import React, { useState, useEffect, useCallback } from "react";
import { Leaf, TreeDeciduous, Droplets, QrCode, Plus, X, Check, Recycle, Building2, LogOut } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "../api";

const WASTE_TYPES = [
  "Answer sheets",
  "Assignment printouts",
  "Lab record sheets",
  "Notices & circulars",
  "Newspapers",
];

const DEPT_COLORS = {
  eee: "#4A7856",
  cse: "#C97B3D",
  cse_ds: "#5B7C8D",
  cse_cy: "#8D5B7C",
};

function StackIcon({ sheets, color }) {
  const capped = Math.min(Math.max(sheets, 1), 12);
  return (
    <div className="relative h-24 w-16 flex flex-col-reverse items-center justify-start">
      {Array.from({ length: capped }).map((_, i) => (
        <div
          key={i}
          className="w-14 rounded-[2px] border"
          style={{
            height: "6px",
            marginBottom: i === 0 ? 0 : "-2px",
            backgroundColor: i % 2 === 0 ? "#FFFFFF" : "#F2EDE2",
            borderColor: color,
            opacity: 0.55 + (i / capped) * 0.45,
            transition: "all 0.4s ease",
          }}
        />
      ))}
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "#C97B3D" }}>{icon}</span>
      <div>
        <div className="font-mono text-sm font-semibold leading-tight">{value}</div>
        <div className="text-xs opacity-60 leading-tight">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard({ department, onLogout }) {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ type: WASTE_TYPES[0], kg: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsData, logsData] = await Promise.all([api.getStats(), api.getLogs()]);
      setStats(statsData);
      setLogs(logsData);
    } catch (err) {
      showToast(`Couldn't load data: ${err.message}`);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function submitLog(e) {
    e.preventDefault();
    const kgNum = parseFloat(form.kg);
    if (Number.isNaN(kgNum) || kgNum <= 0) {
      showToast("Enter a weight greater than 0 (e.g. 3.5)");
      return;
    }
    setSubmitting(true);
    try {
      await api.createLog(form.type, kgNum);
      setForm({ type: WASTE_TYPES[0], kg: "" });
      setShowForm(false);
      showToast(`Logged ${kgNum}kg from ${department.name}`);
      await loadData();
    } catch (err) {
      showToast(`Couldn't save: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: "#F7F3EA" }}>
        <div className="flex items-center gap-2 text-sm font-mono opacity-60" style={{ color: "#1A2E1A" }}>
          <Recycle size={16} /> Loading PaperLoop…
        </div>
      </div>
    );
  }

  const totalKg = stats?.total_kg || 0;
  const deptTotals = (stats?.by_department || []).map((d) => ({
    ...d,
    color: DEPT_COLORS[d.code] || "#4A7856",
  }));

  const qrUrl = `${window.location.origin}/?log=${department.code}`;

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#F7F3EA", color: "#1A2E1A", fontFamily: "Inter, sans-serif" }}>
      <header className="px-6 md:px-12 pt-10 pb-6 border-b" style={{ borderColor: "#E3DCC8" }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Recycle size={22} style={{ color: "#4A7856" }} />
            <span className="font-display text-xl tracking-tight">PaperLoop</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-3 py-1 rounded-full border" style={{ borderColor: "#4A7856", color: "#4A7856" }}>
              {department.name}
            </span>
            <button onClick={onLogout} className="opacity-60 hover:opacity-100" title="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <section className="px-6 md:px-12 py-12 max-w-6xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-widest mb-3" style={{ color: "#C97B3D" }}>
          Campus paper, closing the loop
        </p>
        <h1 className="font-display text-4xl md:text-6xl leading-[1.05] mb-6 max-w-3xl">
          Every sheet RVCE throws away has a second life. We just had to start counting them.
        </h1>
        <div className="flex flex-wrap items-end gap-8 mt-8">
          <div>
            <div className="font-mono text-5xl md:text-6xl font-semibold" style={{ color: "#4A7856" }}>
              {totalKg.toFixed(1)}<span className="text-2xl ml-1">kg</span>
            </div>
            <div className="text-sm mt-1 opacity-70">diverted from landfill</div>
          </div>
          <div className="flex gap-6 pb-1">
            <Stat icon={<TreeDeciduous size={18} />} value={stats.trees_saved} label="trees saved" />
            <Stat icon={<Droplets size={18} />} value={`${stats.water_saved_litres}L`} label="water saved" />
            <Stat icon={<Leaf size={18} />} value={`${stats.co2_avoided_kg}kg`} label="CO₂ avoided" />
          </div>
        </div>
      </section>

      <section className="px-6 md:px-12 pb-16 max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl">Department stacks</h2>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full text-white transition hover:opacity-90"
              style={{ backgroundColor: "#4A7856" }}
            >
              <Plus size={16} /> Log waste
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {deptTotals.map((d, i) => (
              <div key={d.code} className="rounded-2xl p-4 bg-white border flex flex-col items-center text-center" style={{ borderColor: "#E3DCC8" }}>
                {i === 0 && d.total_kg > 0 && (
                  <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full mb-2" style={{ backgroundColor: "#FBE9D9", color: "#C97B3D" }}>
                    Leading
                  </span>
                )}
                <StackIcon sheets={Math.ceil(d.total_kg / 1.5)} color={d.color} />
                <div className="font-medium text-sm mt-2">{d.name}</div>
                <div className="font-mono text-lg" style={{ color: d.color }}>{d.total_kg.toFixed(1)}kg</div>
              </div>
            ))}
          </div>

          <h3 className="font-display text-xl mt-10 mb-4">Recent log entries</h3>
          <div className="space-y-2">
            {logs.length === 0 && (
              <p className="text-sm opacity-60">No entries yet. Be the first to log waste.</p>
            )}
            {logs.slice(0, 6).map((l) => (
              <div key={l.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border" style={{ borderColor: "#E3DCC8" }}>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEPT_COLORS[l.department_code] || "#4A7856" }} />
                  <span className="text-sm font-medium">{l.department_name}</span>
                  <span className="text-sm opacity-60">{l.waste_type}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm">{parseFloat(l.kg).toFixed(1)}kg</span>
                  <span className="text-xs opacity-50">{new Date(l.logged_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl p-6 bg-white border" style={{ borderColor: "#E3DCC8" }}>
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={18} style={{ color: "#C97B3D" }} />
              <h3 className="font-display text-lg">Pilot partner</h3>
            </div>
            <p className="text-sm opacity-80 leading-relaxed mb-4">
              We're in early discussion with a local recycling/upcycling unit to take logged
              waste from a trial pickup point on campus. Status: pilot conversation started,
              terms not yet finalized.
            </p>
          </div>

          <div className="rounded-2xl p-6 bg-white border" style={{ borderColor: "#E3DCC8" }}>
            <div className="flex items-center gap-2 mb-3">
              <QrCode size={18} style={{ color: "#4A7856" }} />
              <h3 className="font-display text-lg">Your bin QR code</h3>
            </div>
            <p className="text-sm opacity-80 leading-relaxed mb-4">
              Print this and stick it on your department's collection bin.
            </p>
            <button
              onClick={() => setShowQR(true)}
              className="w-full text-sm font-medium px-4 py-2.5 rounded-full border transition hover:bg-[#F7F3EA]"
              style={{ borderColor: "#4A7856", color: "#4A7856" }}
            >
              Show QR code
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50" onClick={() => setShowForm(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={submitLog} className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl">Log paper waste</h3>
              <button type="button" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <p className="text-xs opacity-60 mb-4">Logging as <strong>{department.name}</strong></p>
            <label className="text-xs font-mono uppercase tracking-wider opacity-60">Waste type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full mt-1 mb-4 px-3 py-2.5 rounded-lg border text-sm"
              style={{ borderColor: "#E3DCC8" }}
            >
              {WASTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <label className="text-xs font-mono uppercase tracking-wider opacity-60">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              required
              value={form.kg}
              onChange={(e) => setForm({ ...form, kg: e.target.value })}
              placeholder="e.g. 3.5"
              className="w-full mt-1 mb-5 px-3 py-2.5 rounded-lg border text-sm font-mono"
              style={{ borderColor: "#E3DCC8" }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 text-white font-medium py-2.5 rounded-full disabled:opacity-60"
              style={{ backgroundColor: "#4A7856" }}
            >
              <Check size={16} /> {submitting ? "Saving…" : "Confirm log"}
            </button>
          </form>
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50" onClick={() => setShowQR(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-8 w-full max-w-sm text-center">
            <div className="flex justify-end"><button onClick={() => setShowQR(false)}><X size={18} /></button></div>
            <div className="mx-auto w-48 h-48 flex items-center justify-center mb-4">
              <QRCodeSVG value={qrUrl} size={180} bgColor="#FFFFFF" fgColor="#1A2E1A" />
            </div>
            <p className="font-display text-lg mb-1">{department.name}</p>
            <p className="text-sm opacity-60 break-all">{qrUrl}</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1A2E1A] text-white text-sm px-5 py-3 rounded-full flex items-center gap-2 z-50">
          <Check size={14} /> {toast}
        </div>
      )}
    </div>
  );
}
