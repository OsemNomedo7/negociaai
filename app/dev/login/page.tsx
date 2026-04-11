"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DevLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { document.title = "Caos Dívidas — Painel DEV"; }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/dev/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Credenciais inválidas."); return; }
      router.push("/dev");
    } catch { setError("Falha na conexão."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Caos Dívidas" style={{ height: 72, objectFit: "contain", marginBottom: 12 }} />
          <div style={{ display: "inline-block", padding: "3px 12px", borderRadius: 99, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.25)", fontSize: 11, fontWeight: 700, color: "#f87171", letterSpacing: ".08em" }}>
            PAINEL DEV
          </div>
        </div>

        <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "32px 28px" }}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Usuário", value: username, set: setUsername, type: "text", placeholder: "dev" },
              { label: "Senha", value: password, set: setPassword, type: "password", placeholder: "••••••••" },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", marginBottom: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} required
                  style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, color: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
              </div>
            ))}

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#f87171", fontSize: 13 }}>{error}</div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginTop: 4 }}>
              {loading ? "Entrando..." : "Entrar no Painel DEV"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
