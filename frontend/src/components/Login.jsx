import React, { useState } from "react";
import { Recycle } from "lucide-react";
import { api } from "../api";

const DEPT_OPTIONS = [
  { code: "eee", label: "EEE" },
  { code: "cse", label: "CSE" },
  { code: "cse_ds", label: "CSE - Data Science" },
  { code: "cse_cy", label: "CSE - Cyber Security" },
];

export default function Login({ onLogin }) {
  const [code, setCode] = useState("eee");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(code, password);
      localStorage.setItem("paperloop_token", data.token);
      onLogin(data.department);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: "#F7F3EA" }}>
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-8 w-full max-w-sm border"
        style={{ borderColor: "#E3DCC8" }}
      >
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Recycle size={22} style={{ color: "#4A7856" }} />
          <span className="font-display text-xl" style={{ color: "#1A2E1A" }}>PaperLoop</span>
        </div>

        <label className="text-xs font-mono uppercase tracking-wider opacity-60">Department</label>
        <select
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full mt-1 mb-4 px-3 py-2.5 rounded-lg border text-sm"
          style={{ borderColor: "#E3DCC8" }}
        >
          {DEPT_OPTIONS.map((d) => (
            <option key={d.code} value={d.code}>{d.label}</option>
          ))}
        </select>

        <label className="text-xs font-mono uppercase tracking-wider opacity-60">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-1 mb-2 px-3 py-2.5 rounded-lg border text-sm"
          style={{ borderColor: "#E3DCC8" }}
        />

        {error && (
          <p className="text-sm mb-4 px-3 py-2 rounded-lg" style={{ backgroundColor: "#FBE9D9", color: "#B5502E" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-3 text-white font-medium py-2.5 rounded-full disabled:opacity-60"
          style={{ backgroundColor: "#4A7856" }}
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
