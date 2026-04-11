"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: number; name: string; price: number; durationDays: number;
  maxCampaigns: number; maxDebtors: number; checkoutUrl: string; active: boolean;
}

export default function PlanosPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [user, setUser] = useState<{ name: string; planActive: boolean; planExpiresAt: string | null } | null>(null);

  useEffect(() => {
    document.title = "Caos Dívidas — Planos";
    fetch("/api/auth/me").then(r => r.json()).then(d => { if (!d.error) setUser(d); });
    fetch("/api/plans").then(r => r.json()).then(d => { if (Array.isArray(d)) setPlans(d); });
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const durationLabel = (days: number) => days === 1 ? "Diário" : days === 7 ? "Semanal" : days === 30 ? "Mensal" : `${days} dias`;

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

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, color: "#f8fafc", marginBottom: 12 }}>
            {user?.planActive ? "Seu plano expirou" : "Escolha seu plano"}
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.45)", maxWidth: 480, margin: "0 auto" }}>
            {user?.planActive
              ? "Renove seu plano para continuar acessando o painel."
              : "Ative um plano para começar a usar o painel completo."}
          </p>
        </div>

        {plans.length === 0 ? (
          <p style={{ textAlign: "center", color: "rgba(255,255,255,.3)", fontSize: 14 }}>Carregando planos...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(plans.length, 3)}, 1fr)`, gap: 20 }}>
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
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#f59e0b", color: "#000", fontSize: 11, fontWeight: 800, padding: "4px 14px", borderRadius: 99, letterSpacing: ".06em" }}>
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
                  <a href={plan.checkoutUrl || "#"} target="_blank" rel="noopener noreferrer"
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
      </div>
    </div>
  );
}
