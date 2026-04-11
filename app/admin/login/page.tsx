"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/* ── Canvas: partículas + linhas ───────────────── */
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    type P = { x: number; y: number; vx: number; vy: number; r: number };
    const pts: P[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.3 + 0.4,
    }));
    const tick = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(239,68,68,.5)";
        ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 140) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(239,68,68,${0.13 * (1 - d / 140)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={ref} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

/* ── Login ─────────────────────────────────────── */
export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [in_,      setIn]       = useState(false);
  const router = useRouter();

  useEffect(() => { const t = setTimeout(() => setIn(true), 60); return () => clearTimeout(t); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res  = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Credenciais inválidas.");
      else router.push("/admin/dashboard");
    } catch { setError("Falha na conexão."); }
    finally  { setLoading(false); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .lg-root { font-family: 'Inter', system-ui, sans-serif; }

        /* ── Background base ── */
        .lg-bg {
          position: fixed; inset: 0; z-index: 0;
          background: #09090B;
        }

        /* ── Orbs animados ── */
        .orb {
          position: fixed; border-radius: 50%;
          filter: blur(120px); pointer-events: none; z-index: 1;
        }
        @keyframes orb-a {
          0%,100% { transform: translate(0,0) scale(1); }
          25%  { transform: translate(80px,-70px) scale(1.12); }
          50%  { transform: translate(-50px,60px) scale(0.88); }
          75%  { transform: translate(60px,30px) scale(1.06); }
        }
        @keyframes orb-b {
          0%,100% { transform: translate(0,0) scale(1); }
          33%  { transform: translate(-90px,70px) scale(1.1); }
          66%  { transform: translate(70px,-50px) scale(0.9); }
        }
        @keyframes orb-c {
          0%,100% { transform: translate(0,0) scale(1); }
          50%  { transform: translate(-60px,-80px) scale(1.08); }
        }
        @keyframes orb-d {
          0%,100% { transform: translate(0,0) scale(1); }
          40%  { transform: translate(100px,50px) scale(1.15); }
          80%  { transform: translate(-40px,80px) scale(0.85); }
        }
        .orb-1 { width:600px; height:600px; top:-15%; left:-10%; background:radial-gradient(circle,rgba(220,38,38,.18) 0%,transparent 70%); animation:orb-a 18s ease-in-out infinite; }
        .orb-2 { width:700px; height:700px; bottom:-20%; right:-15%; background:radial-gradient(circle,rgba(185,28,28,.14) 0%,transparent 70%); animation:orb-b 22s ease-in-out infinite; }
        .orb-3 { width:400px; height:400px; top:40%; left:40%; background:radial-gradient(circle,rgba(239,68,68,.08) 0%,transparent 70%); animation:orb-c 14s ease-in-out infinite; }
        .orb-4 { width:350px; height:350px; top:10%; right:20%; background:radial-gradient(circle,rgba(153,27,27,.1) 0%,transparent 70%); animation:orb-d 20s ease-in-out infinite; }

        /* ── Grid overlay ── */
        .lg-grid {
          position: fixed; inset: 0; z-index: 2; pointer-events: none;
          background-image:
            linear-gradient(rgba(239,68,68,.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239,68,68,.04) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        /* ── Scanlines ── */
        @keyframes scan { 0%{top:-4px;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100vh;opacity:0} }
        .scan-line {
          position: fixed; left:0; right:0; height:1px; z-index:3; pointer-events:none;
          background: linear-gradient(90deg, transparent 0%, rgba(239,68,68,.5) 30%, rgba(239,68,68,.8) 50%, rgba(239,68,68,.5) 70%, transparent 100%);
          box-shadow: 0 0 10px rgba(239,68,68,.6);
          animation: scan 8s linear infinite;
        }

        /* ── Card ── */
        @keyframes card-in { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:none} }
        .lg-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 420px;
          background: rgba(12,12,15,.85);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 20px;
          padding: 44px 40px;
          backdrop-filter: blur(40px);
          box-shadow:
            0 0 0 1px rgba(239,68,68,.08),
            0 0 80px rgba(239,68,68,.07),
            0 32px 80px rgba(0,0,0,.6),
            inset 0 1px 0 rgba(255,255,255,.07);
          animation: card-in .7s cubic-bezier(.16,1,.3,1) both;
        }

        /* Glow spot behind card */
        .card-glow {
          position: fixed;
          width: 500px; height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(239,68,68,.1) 0%, transparent 65%);
          pointer-events: none; z-index: 5;
          transform: translate(-50%, -50%);
          left: 50%; top: 50%;
          filter: blur(20px);
        }

        /* Top red bar */
        .card-top-bar {
          position: absolute; top: 0; left: 20px; right: 20px; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(239,68,68,.7) 30%, rgba(239,68,68,1) 50%, rgba(239,68,68,.7) 70%, transparent);
          border-radius: 99px;
        }

        /* ── Logo ── */
        .lg-logo {
          mix-blend-mode: screen;
          filter: drop-shadow(0 0 20px rgba(239,68,68,.25));
          transition: filter .3s;
        }
        .lg-logo:hover { filter: drop-shadow(0 0 30px rgba(239,68,68,.45)); }

        /* ── Fade in stagger ── */
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:none} }
        .f0 { animation: fadeUp .5s .2s cubic-bezier(.16,1,.3,1) both; }
        .f1 { animation: fadeUp .5s .3s cubic-bezier(.16,1,.3,1) both; }
        .f2 { animation: fadeUp .5s .38s cubic-bezier(.16,1,.3,1) both; }
        .f3 { animation: fadeUp .5s .46s cubic-bezier(.16,1,.3,1) both; }
        .f4 { animation: fadeUp .5s .54s cubic-bezier(.16,1,.3,1) both; }

        /* ── Input ── */
        .lg-input-wrap { position: relative; }
        .lg-input-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: rgba(255,255,255,.25); pointer-events: none;
          transition: color .2s;
        }
        .lg-input-wrap:focus-within .lg-input-icon { color: #ef4444; }
        .lg-input {
          width: 100%; padding: 12px 14px 12px 40px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 10px;
          color: #f8fafc; font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none; caret-color: #ef4444;
          transition: border-color .2s, background .2s, box-shadow .2s;
        }
        .lg-input::placeholder { color: rgba(255,255,255,.2); }
        .lg-input:focus {
          border-color: rgba(239,68,68,.5);
          background: rgba(239,68,68,.04);
          box-shadow: 0 0 0 3px rgba(239,68,68,.08);
        }

        /* ── Button ── */
        @keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }
        .lg-btn {
          width: 100%; padding: 13px;
          background: linear-gradient(90deg, #b91c1c 0%, #dc2626 40%, #ef4444 60%, #dc2626 100%);
          background-size: 200% auto;
          border: none; border-radius: 10px;
          color: #fff; font-weight: 700; font-size: 14px;
          font-family: 'Inter', sans-serif; cursor: pointer;
          box-shadow: 0 4px 24px rgba(220,38,38,.4), 0 1px 0 rgba(255,255,255,.1) inset;
          animation: shimmer 4s linear infinite;
          transition: transform .15s, box-shadow .2s, opacity .2s;
        }
        .lg-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(220,38,38,.55); }
        .lg-btn:active:not(:disabled) { transform: translateY(0); }
        .lg-btn:disabled { opacity: .5; cursor: not-allowed; animation: none; }

        /* ── Error ── */
        .lg-err {
          padding: 10px 14px; border-radius: 8px;
          background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.22);
          color: #fca5a5; font-size: 13px;
          display: flex; align-items: center; gap: 8px;
        }

        /* ── Divider ── */
        .lg-sep { height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent); margin:22px 0; }

        /* ── Status pill ── */
        @keyframes dot-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        .status-dot { animation: dot-blink 2.2s ease-in-out infinite; }

        /* ── Corner brackets ── */
        .brk { position:absolute; width:16px; height:16px; }
        .brk-tl{top:10px;left:10px;border-top:1.5px solid rgba(239,68,68,.4);border-left:1.5px solid rgba(239,68,68,.4);}
        .brk-tr{top:10px;right:10px;border-top:1.5px solid rgba(239,68,68,.4);border-right:1.5px solid rgba(239,68,68,.4);}
        .brk-bl{bottom:10px;left:10px;border-bottom:1.5px solid rgba(239,68,68,.4);border-left:1.5px solid rgba(239,68,68,.4);}
        .brk-br{bottom:10px;right:10px;border-bottom:1.5px solid rgba(239,68,68,.4);border-right:1.5px solid rgba(239,68,68,.4);}
      `}</style>

      {/* Layers de background */}
      <div className="lg-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="lg-grid" />
      <ParticleCanvas />
      <div className="scan-line" />
      <div className="card-glow" />

      {/* Conteúdo */}
      <div className="lg-root" style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px", position: "relative", zIndex: 10,
      }}>
        <div className="lg-card">
          {/* Barra vermelha no topo */}
          <div className="card-top-bar" />

          {/* Corner brackets */}
          <div className="brk brk-tl" /><div className="brk brk-tr" />
          <div className="brk brk-bl" /><div className="brk brk-br" />

          {/* Logo */}
          <div className="f0" style={{ textAlign: "center", marginBottom: 28 }}>
            <img
              src="/logo.png"
              alt="CAOS DÍVIDAS"
              className="lg-logo"
              style={{ height: 160, objectFit: "contain", display: "inline-block" }}
            />
          </div>

          {/* Título */}
          <div className="f1" style={{ textAlign: "center", marginBottom: 28 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc", letterSpacing: "-.02em", marginBottom: 5 }}>
              Acessar painel
            </h1>
            <p style={{ fontSize: 13, color: "rgba(248,250,252,.35)" }}>
              Credenciais de administrador requeridas
            </p>
          </div>

          {/* Status */}
          <div className="f1" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 28 }}>
            <div className="status-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            <span style={{ fontSize: 11, color: "rgba(248,250,252,.3)", letterSpacing: ".06em" }}>
              SISTEMA SEGURO · AES-256 · TLS 1.3
            </span>
          </div>

          {/* Form */}
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="f2">
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(248,250,252,.45)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 7 }}>
                Usuário
              </label>
              <div className="lg-input-wrap">
                <span className="lg-input-icon">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="admin" className="lg-input" autoComplete="username" />
              </div>
            </div>

            <div className="f2">
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(248,250,252,.45)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 7 }}>
                Senha
              </label>
              <div className="lg-input-wrap">
                <span className="lg-input-icon">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="lg-input" autoComplete="current-password" />
              </div>
            </div>

            {error && (
              <div className="lg-err">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="f3" style={{ marginTop: 4 }}>
              <button type="submit" disabled={loading} className="lg-btn">
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <svg className="animate-spin" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24">
                      <circle style={{ opacity: .3 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path style={{ opacity: .8 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Autenticando...
                  </span>
                ) : "Entrar"}
              </button>
            </div>
          </form>

          <div className="lg-sep" />

          {/* Footer badges */}
          <div className="f4" style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            {["🔒 Criptografado", "🛡 Auditado", "✓ Seguro"].map(b => (
              <span key={b} style={{
                fontSize: 11, color: "rgba(248,250,252,.25)",
                padding: "3px 10px", borderRadius: 6,
                background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
              }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
