from flask import Flask, request, jsonify
import os
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv
import random
from datetime import datetime

load_dotenv()

app = Flask(__name__)

# Lazy Initialization for Supabase (Production Fix)
_supabase_client = None
def get_supabase():
    global _supabase_client
    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL")
        # Use SERVICE_KEY to bypass RLS for AMS logic
        key = os.environ.get("SUPABASE_SERVICE_KEY")
        if not url or not key:
            # Prevents crash during build if env vars are missing
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY are required.")
        _supabase_client = create_client(url, key)
    return _supabase_client

# Lazy Initialization for Gemini
_gemini_model = None
def get_gemini_model():
    global _gemini_model
    if _gemini_model is None:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required.")
        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel('gemini-1.5-flash')
    return _gemini_model

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "password")

@app.route('/api/health')
def health():
    return jsonify({"status": "AMS Online", "region": "Rwanda", "version": "1.2.0"})

@app.route('/api/register', methods=['POST'])
def register():
    try:
        supabase = get_supabase()
        data = request.json
        upl = data.get('upl')
        phone = data.get('phone')
        crop_type = data.get('crop_type')
        
        if not all([upl, phone, crop_type]):
            return jsonify({"error": "Missing required fields (upl, phone, crop_type)"}), 400
            
        response = supabase.table("farmers").insert({
            "upl": upl,
            "phone": phone,
            "crop_type": crop_type
        }).execute()
        
        return jsonify({"message": "Farmer onboarded successfully", "data": response.data}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/monitor', methods=['GET'])
def monitor():
    try:
        supabase = get_supabase()
        model = get_gemini_model()
        
        # 1. Fetch all farmers
        farmers = supabase.table("farmers").select("*").execute().data
        results = []
        
        for farmer in farmers:
            # 2. Simulate current satellite data
            current_ndvi = random.uniform(0.15, 0.85)
            current_moisture = random.randint(15, 85)
            
            # 3. Fetch Historical Trend
            history = supabase.table("crop_history")\
                .select("*")\
                .eq("upl_id", farmer['id'])\
                .order("recorded_at", desc=True)\
                .limit(1)\
                .execute().data
            
            last_record = history[0] if history else None
            alert = None
            
            # 4. Proactive Alerts Logic (STRICTLY KINYARWANDA)
            if last_record:
                ndvi_drop = (last_record['ndvi_score'] - current_ndvi) / last_record['ndvi_score']
                if ndvi_drop > 0.15:
                    alert = f"AMS Alert: Ubutaka bwawe (UPL: {farmer['upl']}) NDVI yagabanutse cyane (>15%). Genzura indwara cyangwa udukoko uyu munsi kugira ngo {farmer['crop_type']} itangirika."
            
            if current_moisture < 30 and alert is None:
                alert = f"AMS Alert: Ubutaka bwawe (UPL: {farmer['upl']}) bukashye cyane ({current_moisture}%). Tegura kuhira uyu munsi kugira ngo {farmer['crop_type']} itangirika."

            # AI Advice (Wise Agronomist in Kinyarwanda)
            if last_record:
                prompt = f"""
                You are a Wise Agronomist in Rwanda. 
                Farmer: {farmer['upl']} growing {farmer['crop_type']}.
                Current Stats: NDVI={current_ndvi:.2f}, Moisture={current_moisture}%. 
                Previous Stats: NDVI={last_record['ndvi_score']:.2f}, Moisture={last_record['moisture_level']}%. 
                Analyze the trend and provide actionable advice STRICTLY in KINYARWANDA. 
                Be specific and encouraging.
                Include this placeholder link for satellite view: https://ams.rw/map/{farmer['upl']}
                """
            else:
                prompt = f"""
                You are a Wise Agronomist in Rwanda. 
                First reading for Farmer {farmer['upl']} ({farmer['crop_type']}).
                Stats: NDVI={current_ndvi:.2f}, Moisture={current_moisture}%. 
                Provide initial advice STRICTLY in KINYARWANDA.
                Include this link: https://ams.rw/map/{farmer['upl']}
                """
            
            ai_response = model.generate_content(prompt).text
            
            # 5. Save new record
            supabase.table("crop_history").insert({
                "upl_id": farmer['id'],
                "ndvi_score": current_ndvi,
                "moisture_level": current_moisture
            }).execute()
            
            results.append({
                "upl": farmer['upl'],
                "crop": farmer['crop_type'],
                "ndvi": current_ndvi,
                "moisture": current_moisture,
                "alert": alert,
                "advice": ai_response
            })
            
        return jsonify({"status": "Analysis Complete", "data": results})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/data')
def admin_data():
    key = request.args.get('key')
    if key != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized Access"}), 403
        
    try:
        supabase = get_supabase()
        farmers = supabase.table("farmers").select("*").execute().data
        history = supabase.table("crop_history").select("*, farmers(upl)").order("recorded_at", desc=True).execute().data
        return jsonify({"farmers": farmers, "history": history})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=3000)