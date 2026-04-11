"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: number; name: string; price: number; durationDays: number;
  maxCampaigns: number; maxDebtors: number; checkoutUrl: string; active: boolean;
}

export default function PlanosPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    document.title = "Caos Dívidas — Planos";
    fetch("/api/plans").then(r => r.json()).then(d => { if (Array.isArray(d)) setPlans(d); });
  }, []);

  const checkAccess = useCallback(async () => {
    setChecking(true);
    setCheckMsg(null);
    const res = await fetch("/api/auth/me");
    const d = await res.json();
    if (d.planActive) {
      setCheckMsg({ ok: true, text: "Plano ativo! Redirecionando para o painel..." });
      setTimeout(() => router.push("/admin/dashboard"), 1500);
    } else {
      setCheckMsg({ ok: false, text: "Plano ainda não ativado. Aguarde alguns instantes e tente novamente." });
    }
    setChecking(false);
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const durationLabel = (days: number) =>
    days === 0 ? "Vitalício" : days === 1 ? "Diário" : days === 7 ? "Semanal" : days === 30 ? "Mensal" : `${days} dias`;

  const activePlans = plans.filter(p => p.active);

  const features = [
    { icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Campanhas ilimitadas" },
    { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", label: "Gestão de devedores" },
    { icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9", label: "Domínio personalizado" },
    { icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Chat ao vivo" },
    { icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Relatórios completos" },
    { icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", label: "Notificações automáticas" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #07070f; }

        .plan-card { transition: transform .2s, box-shadow .2s; }
        .plan-card:hover { transform: translateY(-4px); }

        .assinar-btn { transition: opacity .15s, transform .1s; }
        .assinar-btn:hover { opacity: .9; transform: scale(1.02); }
        .assinar-btn:active { transform: scale(.98); }

        .check-btn { transition: all .2s; }
        .check-btn:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 0 24px rgba(99,102,241,.4); }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: .6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        .fade-in { animation: fade-in .4s ease both; }
      `}</style>

      <div style={{ minHeight: "100vh", fontFamily: "Inter, system-ui, sans-serif", color: "#f8fafc", background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,.18) 0%, transparent 60%), #07070f" }}>

        {/* Header */}
        <header style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(7,7,15,.8)", backdropFilter: "blur(20px)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo" style={{ height: 40, objectFit: "contain" }} />
            <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 9, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", color: "rgba(255,255,255,.5)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              Sair
            </button>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px 80px" }}>

          {/* Hero */}
          <div style={{ textAlign: "center", marginBottom: 64 }} className="fade-in">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 99, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", fontSize: 12, fontWeight: 600, color: "#818cf8", letterSpacing: ".06em", marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />
              ACESSO À PLATAFORMA
            </div>
            <h1 style={{ fontSize: "clamp(32px,5vw,52px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16, background: "linear-gradient(135deg, #f8fafc 0%, rgba(248,250,252,.6) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Escolha seu plano
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,.4)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
              Ative um plano e comece a recuperar suas dívidas com tecnologia profissional.
            </p>
          </div>

          {/* Plans grid */}
          {activePlans.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,.25)", fontSize: 15 }}>Carregando planos...</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(activePlans.length, 3)}, 1fr)`, gap: 20, marginBottom: 72 }}>
              {activePlans.map((plan, i) => {
                const highlight = activePlans.length === 1 || i === Math.floor(activePlans.length / 2);
                return (
                  <div key={plan.id} className="plan-card" style={{
                    borderRadius: 24, padding: "2px", position: "relative",
                    background: highlight
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)"
                      : "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
                    boxShadow: highlight ? "0 32px 80px rgba(99,102,241,.35)" : "none",
                  }}>
                    {highlight && (
                      <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", zIndex: 1, background: "linear-gradient(90deg, #f59e0b, #f97316)", color: "#000", fontSize: 10, fontWeight: 800, padding: "4px 14px", borderRadius: 99, letterSpacing: ".1em", whiteSpace: "nowrap" }}>
                        MAIS POPULAR
                      </div>
                    )}
                    <div style={{ background: highlight ? "linear-gradient(145deg, #1a1a2e, #16163a)" : "#0f0f1a", borderRadius: 22, padding: "36px 30px", height: "100%" }}>

                      {/* Duration badge */}
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 8, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.08)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.5)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 20 }}>
                        {durationLabel(plan.durationDays)}
                      </div>

                      <h2 style={{ fontSize: 24, fontWeight: 800, color: "#f8fafc", marginBottom: 6 }}>{plan.name}</h2>

                      {/* Price */}
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,.45)" }}>R$</span>
                        <span style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: highlight ? "#c4b5fd" : "#f8fafc" }}>
                          {Math.floor(plan.price)}
                        </span>
                        {plan.price % 1 !== 0 && (
                          <span style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,.6)", alignSelf: "flex-start", marginTop: 8 }}>
                            ,{(plan.price % 1).toFixed(2).slice(2)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginBottom: 32 }}>
                        {plan.durationDays === 0 ? "acesso vitalício" : `por ${plan.durationDays} dia${plan.durationDays > 1 ? "s" : ""}`}
                      </div>

                      {/* Features */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                        {[
                          plan.maxCampaigns === 0 ? "Campanhas ilimitadas" : `${plan.maxCampaigns} campanha${plan.maxCampaigns > 1 ? "s" : ""}`,
                          plan.maxDebtors === 0 ? "Devedores ilimitados" : `Até ${plan.maxDebtors.toLocaleString("pt-BR")} devedores`,
                          ...features.slice(2).map(f => f.label),
                        ].map((item, fi) => (
                          <div key={fi} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: highlight ? "rgba(255,255,255,.75)" : "rgba(255,255,255,.5)" }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: highlight ? "rgba(167,139,250,.2)" : "rgba(99,102,241,.15)", border: `1px solid ${highlight ? "rgba(167,139,250,.4)" : "rgba(99,102,241,.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg width="10" height="10" fill="none" stroke={highlight ? "#c4b5fd" : "#818cf8"} strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            {item}
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <a href={plan.checkoutUrl || "#"} target="_blank" rel="noopener noreferrer"
                        className="assinar-btn"
                        style={{
                          display: "block", textAlign: "center", padding: "15px",
                          borderRadius: 14, fontSize: 15, fontWeight: 700, textDecoration: "none",
                          background: highlight
                            ? "linear-gradient(135deg, #f8fafc, #e2e8f0)"
                            : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                          color: highlight ? "#4338ca" : "#fff",
                          boxShadow: highlight ? "0 8px 32px rgba(248,250,252,.15)" : "0 8px 24px rgba(99,102,241,.3)",
                        }}>
                        Assinar agora →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Features grid */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,.3)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 10 }}>O que está incluído</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc" }}>Tudo que você precisa para cobrar</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {features.map(f => (
                <div key={f.label} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "18px 20px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="17" height="17" fill="none" stroke="#818cf8" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", marginBottom: 3 }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", lineHeight: 1.5 }}>Disponível em todos os planos</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verificar acesso */}
          <div style={{ position: "relative", borderRadius: 24, overflow: "hidden" }}>
            {/* Background gradient */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(99,102,241,.12) 0%, rgba(139,92,246,.08) 100%)", borderRadius: 24 }} />
            <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(99,102,241,.2)", borderRadius: 24 }} />

            <div style={{ position: "relative", padding: "48px 40px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 20 }}>
              {/* Pulse icon */}
              <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ position: "absolute", width: 56, height: 56, borderRadius: "50%", background: "rgba(99,102,241,.2)", animation: "pulse-ring 2s ease-out infinite" }} />
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 8 }}>Já realizou o pagamento?</h3>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,.4)", maxWidth: 420, lineHeight: 1.7 }}>
                  Após a confirmação do pagamento, o acesso é liberado automaticamente em instantes. Clique abaixo para verificar.
                </p>
              </div>

              {checkMsg && (
                <div className="fade-in" style={{
                  padding: "14px 24px", borderRadius: 12, fontSize: 14, fontWeight: 500,
                  background: checkMsg.ok ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.08)",
                  border: checkMsg.ok ? "1px solid rgba(34,197,94,.25)" : "1px solid rgba(239,68,68,.2)",
                  color: checkMsg.ok ? "#4ade80" : "#f87171",
                }}>
                  {checkMsg.text}
                </div>
              )}

              <button onClick={checkAccess} disabled={checking} className="check-btn"
                style={{
                  padding: "14px 40px", borderRadius: 14, fontSize: 15, fontWeight: 700,
                  fontFamily: "inherit", cursor: checking ? "not-allowed" : "pointer",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none", color: "#fff", display: "flex", alignItems: "center", gap: 10,
                  opacity: checking ? 0.7 : 1,
                  boxShadow: "0 8px 32px rgba(99,102,241,.3)",
                }}>
                {checking ? (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                      <path strokeLinecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Verificando...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verificar acesso ao painel
                  </>
                )}
              </button>

              <p style={{ fontSize: 12, color: "rgba(255,255,255,.25)" }}>
                Use o mesmo e-mail cadastrado na plataforma para realizar o pagamento.
              </p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
