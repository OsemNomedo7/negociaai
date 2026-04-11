"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DevLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

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
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: .35; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: .15; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,.25); }
          50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .dev-input {
          width: 100%;
          padding: 13px 16px;
          background: rgba(255,255,255,.04);
          border: 1.5px solid rgba(255,255,255,.08);
          border-radius: 12px;
          color: #f8fafc;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          font-family: inherit;
          transition: border-color .2s, background .2s, box-shadow .2s;
        }
        .dev-input:focus {
          border-color: rgba(239,68,68,.5);
          background: rgba(239,68,68,.05);
          box-shadow: 0 0 0 3px rgba(239,68,68,.08);
        }
        .dev-input::placeholder { color: rgba(255,255,255,.2); }
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: opacity .2s, transform .15s, box-shadow .2s;
          box-shadow: 0 4px 24px rgba(239,68,68,.3);
          letter-spacing: .02em;
        }
        .submit-btn:hover:not(:disabled) {
          opacity: .9;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(239,68,68,.4);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: .6; cursor: not-allowed; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(239,68,68,.12) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(99,102,241,.08) 0%, transparent 50%), #07070f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Orbs decorativos */}
        {[
          { w: 300, h: 300, top: "10%", left: "5%", delay: "0s", dur: "8s", color: "rgba(239,68,68,.06)" },
          { w: 200, h: 200, top: "60%", right: "8%", delay: "3s", dur: "10s", color: "rgba(99,102,241,.06)" },
          { w: 150, h: 150, top: "40%", left: "50%", delay: "1.5s", dur: "12s", color: "rgba(239,68,68,.04)" },
        ].map((orb, i) => (
          <div key={i} style={{
            position: "absolute",
            width: orb.w, height: orb.h,
            top: orb.top, left: (orb as { left?: string }).left, right: (orb as { right?: string }).right,
            borderRadius: "50%",
            background: orb.color,
            filter: "blur(60px)",
            animation: `float ${orb.dur} ${orb.delay} ease-in-out infinite`,
            pointerEvents: "none",
          }} />
        ))}

        {/* Grid lines decorativas */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 0%, transparent 80%)",
        }} />

        <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp .5s ease both", position: "relative" }}>

          {/* Logo e badge */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Caos Dívidas" style={{ display: "block", height: 140, objectFit: "contain", margin: "0 auto 24px", filter: "drop-shadow(0 0 20px rgba(239,68,68,.45))" }} />

            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 14px",
              borderRadius: 99,
              background: "rgba(239,68,68,.08)",
              border: "1px solid rgba(239,68,68,.2)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#f87171", letterSpacing: ".1em" }}>ACESSO DEV</span>
            </div>
          </div>

          {/* Card do form */}
          <div style={{
            background: "linear-gradient(135deg, rgba(255,255,255,.03), rgba(255,255,255,.01))",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 24,
            padding: "32px 28px",
            backdropFilter: "blur(12px)",
            boxShadow: "0 24px 80px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.05)",
          }}>
            <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.3)", marginTop: 0, marginBottom: 24 }}>
              Insira suas credenciais de acesso
            </p>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.35)", marginBottom: 8, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  Usuário
                </label>
                <input
                  className="dev-input"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setFocused("user")}
                  onBlur={() => setFocused(null)}
                  placeholder="dev"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.35)", marginBottom: 8, letterSpacing: ".08em", textTransform: "uppercase" }}>
                  Senha
                </label>
                <input
                  className="dev-input"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused("pass")}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(239,68,68,.07)",
                  border: "1px solid rgba(239,68,68,.2)",
                }}>
                  <span style={{ fontSize: 16 }}>⚠</span>
                  <span style={{ color: "#f87171", fontSize: 13 }}>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="submit-btn" style={{ marginTop: 4 }}>
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{
                      width: 16, height: 16,
                      border: "2px solid rgba(255,255,255,.3)",
                      borderTop: "2px solid #fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin-slow .7s linear infinite",
                    }} />
                    Autenticando...
                  </span>
                ) : "Entrar no Painel DEV"}
              </button>
            </form>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "rgba(255,255,255,.15)" }}>
            Acesso restrito — área administrativa
          </p>
        </div>
      </div>

      {/* Suprimir warning de focused não usado */}
      {focused && null}
    </>
  );
}
