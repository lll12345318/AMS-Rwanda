import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sprout, 
  Satellite, 
  AlertTriangle, 
  CheckCircle2, 
  LayoutDashboard, 
  UserPlus, 
  History,
  ShieldCheck,
  ChevronRight,
  Loader2
} from "lucide-react";

export default function App() {
  const [view, setView] = useState<"home" | "register" | "monitor" | "admin">("home");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [adminKey, setAdminKey] = useState("");
  const [adminData, setAdminData] = useState<any>(null);
  const [monitorResults, setMonitorResults] = useState<any[]>([]);

  // Registration Form State
  const [regForm, setRegForm] = useState({ upl: "", crop_type: "", phone: "" });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Murakoze! Uwasabye yanditswe neza." });
        setRegForm({ upl: "", crop_type: "", phone: "" });
      } else {
        setMessage({ type: "error", text: data.error || "Habaye ikibazo." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Ntabwo dushoboye kugera kuri server." });
    } finally {
      setLoading(false);
    }
  };

  const triggerMonitor = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/monitor");
      const data = await res.json();
      if (res.ok) {
        setMonitorResults(data.data);
        setView("monitor");
      } else {
        setMessage({ type: "error", text: data.error || "Kugenzura byanze." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Habaye ikibazo cy'itumanaho." });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/data?key=${adminKey}`);
      const data = await res.json();
      if (res.ok) {
        setAdminData(data);
        setView("admin");
      } else {
        setMessage({ type: "error", text: "Ijambo ry'ibanga riracyari rito cyangwa ntabwo ari ryo." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Ntabwo dushoboye kugera kuri data." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div 
            className="flex cursor-pointer items-center gap-2" 
            onClick={() => setView("home")}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
              <Satellite size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-emerald-900">AMS <span className="font-light text-slate-400">Rwanda</span></span>
          </div>
          
          <div className="hidden items-center gap-6 md:flex">
            <button onClick={() => setView("home")} className="text-sm font-medium text-slate-600 hover:text-emerald-600">Ahabanza</button>
            <button onClick={() => setView("register")} className="text-sm font-medium text-slate-600 hover:text-emerald-600">Kwiyandikisha</button>
            <button onClick={triggerMonitor} className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
              <Satellite size={16} /> Kugenzura
            </button>
          </div>

          <button 
            onClick={() => setView(view === "admin" ? "home" : "admin")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-emerald-600"
          >
            <ShieldCheck size={20} />
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Home View */}
          {view === "home" && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid gap-12 lg:grid-cols-2 lg:items-center"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  <Sprout size={14} /> Precision Agriculture
                </div>
                <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-slate-900 lg:text-6xl">
                  Agri-modernization System <span className="text-emerald-600">(AMS)</span>
                </h1>
                <p className="text-lg leading-relaxed text-slate-600">
                  Uburyo bugezweho bwo gukurikirana imyaka hifashishijwe icyogajuru. 
                  Tugufasha kumenya uko umurima wawe umeze, amazi arimo, n'indwara zishobora kuwibasira.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setView("register")}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-4 font-bold text-white shadow-xl shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-emerald-300 active:scale-95"
                  >
                    Kwiyandikisha <ChevronRight size={20} />
                  </button>
                  <button 
                    onClick={triggerMonitor}
                    className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 py-4 font-bold text-slate-700 transition-all hover:border-emerald-200 hover:bg-emerald-50 active:scale-95"
                  >
                    Genzura Umurima
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square overflow-hidden rounded-3xl bg-emerald-100 shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=80" 
                    alt="Rwandan Farm" 
                    className="h-full w-full object-cover opacity-80 mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 to-transparent" />
                </div>
                {/* Floating Stats Card */}
                <motion.div 
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-6 shadow-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Satellite size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-slate-400">NDVI Score</p>
                      <p className="text-2xl font-black text-emerald-600">0.82</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Register View */}
          {view === "register" && (
            <motion.div 
              key="register"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mx-auto max-w-xl"
            >
              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <UserPlus size={32} />
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">Iyandikishe muri AMS</h2>
                  <p className="text-slate-500">Uzuza amakuru y'umurima wawe kugira ngo utangire guhabwa ubutumwa.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">UPL (Land ID)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="UPL-12345"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                      value={regForm.upl}
                      onChange={e => setRegForm({...regForm, upl: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Ubwoko bw'Igihingwa</label>
                    <select 
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                      value={regForm.crop_type}
                      onChange={e => setRegForm({...regForm, crop_type: e.target.value})}
                    >
                      <option value="">Hitamo...</option>
                      <option value="Ibigori">Ibigori (Maize)</option>
                      <option value="Ibishyimbo">Ibishyimbo (Beans)</option>
                      <option value="Ikawa">Ikawa (Coffee)</option>
                      <option value="Ibirayi">Ibirayi (Potatoes)</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">Nimero ya Telefone</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="078..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                      value={regForm.phone}
                      onChange={e => setRegForm({...regForm, phone: e.target.value})}
                    />
                  </div>

                  <button 
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Emeza Kwiyandikisha"}
                  </button>
                </form>

                {message && (
                  <div className={`mt-6 rounded-xl p-4 text-sm font-medium ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                    {message.text}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Monitor Results View */}
          {view === "monitor" && (
            <motion.div 
              key="monitor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-slate-900">Ibisubizo by'Icyogajuru</h2>
                <button 
                  onClick={triggerMonitor}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <Satellite size={16} /> Genzura Nanone
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {monitorResults.map((res, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
                  >
                    <div className="bg-emerald-600 p-4 text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold uppercase tracking-wider opacity-80">UPL: {res.farmer}</span>
                        <Satellite size={18} />
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-slate-50 p-3 text-center">
                          <p className="text-[10px] font-bold uppercase text-slate-400">NDVI</p>
                          <p className="text-xl font-black text-emerald-600">{res.ndvi.toFixed(2)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-3 text-center">
                          <p className="text-[10px] font-bold uppercase text-slate-400">Moisture</p>
                          <p className="text-xl font-black text-blue-600">{res.moisture}%</p>
                        </div>
                      </div>

                      {res.alert && (
                        <div className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
                          <AlertTriangle className="shrink-0" size={20} />
                          <p className="text-xs font-semibold leading-relaxed">{res.alert}</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Wise Agronomist Advice</p>
                        <div className="text-sm leading-relaxed text-slate-600 italic">
                          "{res.advice}"
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Admin View */}
          {view === "admin" && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {!adminData ? (
                <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
                  <div className="mb-6 text-center">
                    <ShieldCheck size={48} className="mx-auto mb-4 text-emerald-600" />
                    <h2 className="text-2xl font-bold">Admin Login</h2>
                  </div>
                  <input 
                    type="password" 
                    placeholder="Enter Admin Password"
                    className="mb-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-500 focus:bg-white"
                    value={adminKey}
                    onChange={e => setAdminKey(e.target.value)}
                  />
                  <button 
                    onClick={fetchAdminData}
                    className="w-full rounded-xl bg-slate-900 py-4 font-bold text-white hover:bg-slate-800"
                  >
                    Login to Dashboard
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold">Admin Dashboard</h2>
                    <button onClick={() => setAdminData(null)} className="text-sm font-bold text-red-600">Logout</button>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Total Farmers</h3>
                        <UserPlus size={16} className="text-emerald-600" />
                      </div>
                      <p className="text-4xl font-black">{adminData.farmers?.length || 0}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">Monitoring Logs</h3>
                        <History size={16} className="text-blue-600" />
                      </div>
                      <p className="text-4xl font-black">{adminData.history?.length || 0}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-bold text-slate-400 uppercase text-xs tracking-widest">System Status</h3>
                        <CheckCircle2 size={16} className="text-emerald-600" />
                      </div>
                      <p className="text-4xl font-black text-emerald-600">Active</p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                      <h3 className="font-bold">Recent Crop History</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">UPL</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">NDVI</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">Moisture</th>
                            <th className="px-6 py-4 font-bold text-slate-400 uppercase text-[10px]">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminData.history?.map((h: any, i: number) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="px-6 py-4 font-bold">{h.farmers?.upl}</td>
                              <td className="px-6 py-4 text-emerald-600 font-mono">{h.ndvi_score.toFixed(3)}</td>
                              <td className="px-6 py-4 text-blue-600 font-mono">{h.moisture_level}%</td>
                              <td className="px-6 py-4 text-slate-400">{new Date(h.recorded_at).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <div className="mb-4 flex justify-center gap-2">
            <Satellite className="text-emerald-600" size={24} />
            <span className="text-xl font-bold tracking-tight text-emerald-900">AMS</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2026 Agri-modernization System Rwanda. Precision Agriculture for a Sustainable Future.
          </p>
        </div>
      </footer>
    </div>
  );
}
