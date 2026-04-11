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
  const [user, setUser] = useState<{ name: string; planActive: boolean; planExpiresAt: string | null } | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkMsg, setCheckMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [clickedPlan, setClickedPlan] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Caos Dívidas — Planos";
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (!d.error) setUser(d); });
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
      setCheckMsg({ ok: false, text: "Plano ainda não ativado. Aguarde alguns instantes após o pagamento e tente novamente." });
    }
    setChecking(false);
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const durationLabel = (days: number) =>
    days === 1 ? "Diário" : days === 7 ? "Semanal" : days === 30 ? "Mensal" : `${days} dias`;

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "Inter, system-ui, sans-serif", padding: "48px 24px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Caos Dívidas" style={{ height: 48, objectFit: "contain" }} />
          <button onClick={logout} style={{ background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, padding: "8px 16px", color: "rgba(255,255,255,.5)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
            Sair
          </button>
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, color: "#f8fafc", marginBottom: 12 }}>
            Escolha seu plano
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.45)", maxWidth: 480, margin: "0 auto" }}>
            Ative um plano para começar a usar o painel completo.
          </p>
        </div>

        {/* Plans */}
        {plans.length === 0 ? (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,.3)", fontSize: 14 }}>Carregando planos...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`, gap: 20, marginBottom: 48 }}>
            {plans.filter(p => p.active).map((plan, i) => {
              const highlight = i === 1 || plans.length === 1;
              return (
                <div key={plan.id} style={{
                  background: highlight ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#111827",
                  border: highlight ? "none" : "1px solid rgba(255,255,255,.08)",
                  borderRadius: 20, padding: "36px 28px", position: "relative",
                  boxShadow: highlight ? "0 20px 60px rgba(99,102,241,.3)" : "none",
                }}>
                  {highlight && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#f59e0b", color: "#000", fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 99, letterSpacing: ".06em", whiteSpace: "nowrap" }}>
                      MAIS POPULAR
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700, color: highlight ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.4)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 8 }}>
                    {durationLabel(plan.durationDays)}
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 4 }}>{plan.name}</h2>
                  <div style={{ fontSize: 40, fontWeight: 900, color: "#f8fafc", lineHeight: 1, marginBottom: 4 }}>
                    R$ {plan.price.toFixed(2).replace(".", ",")}
                  </div>
                  <div style={{ fontSize: 13, color: highlight ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.35)", marginBottom: 28 }}>
                    por {plan.durationDays} dia{plan.durationDays > 1 ? "s" : ""}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                    {[
                      `${plan.maxCampaigns} campanha${plan.maxCampaigns > 1 ? "s" : ""}`,
                      `Até ${plan.maxDebtors.toLocaleString("pt-BR")} devedores`,
                      "Domínio customizado",
                      "Chat ao vivo",
                      "Relatórios completos",
                    ].map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: highlight ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.55)" }}>
                        <svg width="16" height="16" fill="none" stroke={highlight ? "#fff" : "#6366f1"} strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </div>
                    ))}
                  </div>
                  <a
                    href={plan.checkoutUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setClickedPlan(plan.id)}
                    style={{
                      display: "block", textAlign: "center", padding: "14px",
                      background: highlight ? "#fff" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: highlight ? "#6366f1" : "#fff",
                      borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: "none",
                    }}>
                    Assinar agora
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Após pagamento */}
        <div style={{
          background: "rgba(99,102,241,.07)",
          border: "1px solid rgba(99,102,241,.2)",
          borderRadius: 16, padding: "28px 32px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="20" height="20" fill="none" stroke="#818cf8" strokeWidth={1.8} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>Já realizou o pagamento?</span>
          </div>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", maxWidth: 440, lineHeight: 1.7, margin: 0 }}>
            Após a confirmação do pagamento, o acesso é liberado automaticamente em instantes.
            Clique no botão abaixo para verificar se seu plano já foi ativado.
          </p>

          {checkMsg && (
            <div style={{
              padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 500,
              background: checkMsg.ok ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.08)",
              border: checkMsg.ok ? "1px solid rgba(34,197,94,.25)" : "1px solid rgba(239,68,68,.2)",
              color: checkMsg.ok ? "#4ade80" : "#f87171",
            }}>
              {checkMsg.text}
            </div>
          )}

          <button onClick={checkAccess} disabled={checking} style={{
            padding: "12px 32px",
            background: checking ? "rgba(255,255,255,.07)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", borderRadius: 12, color: "#fff",
            fontSize: 14, fontWeight: 700, fontFamily: "inherit",
            cursor: checking ? "not-allowed" : "pointer",
            opacity: checking ? 0.7 : 1,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {checking ? (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ animation: "spin 1s linear infinite" }}>
                  <path strokeLinecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Verificando...
              </>
            ) : "Verificar acesso"}
          </button>

          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>

      </div>
    </div>
  );
}
