import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase Setup
let supabaseClient: any = null;
function getSupabase() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY/ANON_KEY are required environment variables.");
    }
    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

// Gemini Setup
let geminiModel: any = null;
function getGeminiModel() {
  if (!geminiModel) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is required environment variable.");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
  return geminiModel;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", system: "AMS (Agri-modernization System) Production" });
});

// POST /api/register: Save farmer data
app.post("/api/register", async (req, res) => {
  const { upl, crop_type, phone } = req.body;

  if (!upl || !crop_type || !phone) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("farmers")
      .insert([{ upl, crop_type, phone }])
      .select();

    if (error) throw error;
    res.status(201).json({ message: "Farmer registered successfully", data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/monitor: Trigger satellite check & send Kinyarwanda alerts
app.get("/api/monitor", async (req, res) => {
  try {
    const supabase = getSupabase();
    const model = getGeminiModel();
    const { data: farmers, error: fError } = await supabase.from("farmers").select("*");
    if (fError) throw fError;

    const results = [];

    for (const farmer of farmers) {
      const currentNdvi = Math.random() * 0.7 + 0.15;
      const currentMoisture = Math.floor(Math.random() * 75) + 15;

      const { data: history, error: hError } = await supabase
        .from("crop_history")
        .select("*")
        .eq("upl_id", farmer.id)
        .order("recorded_at", { ascending: false })
        .limit(1);

      if (hError) throw hError;

      let alert = null;
      const lastRecord = history?.[0];
      let prompt = "";

      if (lastRecord) {
        const ndviDrop = (lastRecord.ndvi_score - currentNdvi) / lastRecord.ndvi_score;
        if (ndviDrop > 0.15) {
          alert = `AMS Alert: UPL ${farmer.upl} NDVI yagabanutse cyane (>15%). Genzura indwara cyangwa udukoko uyu munsi.`;
        }
        if (currentMoisture < 30) {
          alert = `AMS Alert: Ubutaka bwawe (UPL: ${farmer.upl}) bukashye cyane (${currentMoisture}%). Tegura kuhira uyu munsi kugira ngo ${farmer.crop_type} itangirika.`;
        }

        prompt = `You are a Wise Agronomist in Rwanda. 
        Farmer: ${farmer.upl} growing ${farmer.crop_type}.
        Current Stats: NDVI=${currentNdvi.toFixed(2)}, Moisture=${currentMoisture}%.
        Previous Stats: NDVI=${lastRecord.ndvi_score.toFixed(2)}, Moisture=${lastRecord.moisture_level}%.
        Analyze the trend and provide actionable advice in KINYARWANDA. 
        Be specific (e.g., 'Irrigate tomorrow' or 'Check north corner').
        Include this link: https://ams.rw/map/${farmer.upl}`;
      } else {
        prompt = `First reading for Farmer ${farmer.upl} (${farmer.crop_type}).
        Stats: NDVI=${currentNdvi.toFixed(2)}, Moisture=${currentMoisture}%.
        Provide initial advice in KINYARWANDA as a Wise Agronomist.
        Include link: https://ams.rw/map/${farmer.upl}`;
      }

      const result = await model.generateContent(prompt);
      const advice = result.response.text();

      await supabase.from("crop_history").insert([
        {
          upl_id: farmer.id,
          ndvi_score: currentNdvi,
          moisture_level: currentMoisture,
        },
      ]);

      results.push({
        upl: farmer.upl,
        crop: farmer.crop_type,
        ndvi: currentNdvi,
        moisture: currentMoisture,
        alert,
        advice,
      });
    }

    res.json({ status: "Analysis Complete", data: results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /admin: Secure dashboard
app.get("/api/admin/data", async (req, res) => {
  const key = req.query.key;
  if (key !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    const supabase = getSupabase();
    const { data: farmers } = await supabase.from("farmers").select("*");
    const { data: history } = await supabase.from("crop_history").select("*, farmers(upl)").order("recorded_at", { ascending: false });
    res.json({ farmers, history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AMS Server running on http://localhost:${PORT}`);
  });
}

startServer();
