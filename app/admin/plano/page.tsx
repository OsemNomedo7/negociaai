"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Plan {
  id: number; name: string; price: number; durationDays: number;
  maxCampaigns: number; maxDebtors: number; checkoutUrl: string;
}

interface PlanData {
  currentPlan: Plan | null;
  planExpiresAt: string | null;
  planActive: boolean;
  daysLeft: number | null;
  availablePlans: Plan[];
}

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const durationLabel = (d: number) =>
  d === 1 ? "Diário" : d === 7 ? "Semanal" : d === 14 ? "Quinzenal" : d === 30 ? "Mensal" : d === 365 ? "Anual" : `${d} dias`;

export default function PlanoPage() {
  const router = useRouter();
  const [data, setData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/plan")
      .then(r => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        return r.json();
      })
      .then(d => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
    </div>
  );

  const current = data?.currentPlan;
  const daysLeft = data?.daysLeft ?? 0;
  const expires = data?.planExpiresAt ? new Date(data.planExpiresAt).toLocaleDateString("pt-BR") : null;

  return (
    <div className="space-y-6 animate-fade-in" style={{ maxWidth: 860 }}>
      <div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Meu Plano</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Veja seu plano atual e migre para outro quando quiser
        </p>
      </div>

      {/* Plano atual */}
      <div style={{
        borderRadius: 20, padding: 28, position: "relative", overflow: "hidden",
        background: data?.planActive
          ? "linear-gradient(135deg, rgba(16,185,129,.08), rgba(6,95,70,.05))"
          : "linear-gradient(135deg, rgba(239,68,68,.07), rgba(127,29,29,.05))",
        border: `1px solid ${data?.planActive ? "rgba(16,185,129,.2)" : "rgba(239,68,68,.2)"}`,
      }}>
        {/* Glow de fundo */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200, borderRadius: "50%",
          background: data?.planActive ? "rgba(16,185,129,.06)" : "rgba(239,68,68,.06)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: ".08em",
                padding: "3px 10px", borderRadius: 99,
                background: data?.planActive ? "rgba(16,185,129,.15)" : "rgba(239,68,68,.12)",
                color: data?.planActive ? "#34d399" : "#f87171",
                border: `1px solid ${data?.planActive ? "rgba(16,185,129,.25)" : "rgba(239,68,68,.2)"}`,
              }}>
                {data?.planActive ? "● ATIVO" : "● EXPIRADO"}
              </span>
              {data?.planActive && daysLeft !== null && daysLeft <= 7 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: "#f59e0b", padding: "3px 10px", borderRadius: 99, background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.2)" }}>
                  ⚠ Expira em {daysLeft}d
                </span>
              )}
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", marginBottom: 4, letterSpacing: "-.02em" }}>
              {current ? current.name : "Sem plano ativo"}
            </h2>

            {current && (
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {brl(current.price)} · {durationLabel(current.durationDays)}
                {expires && ` · Válido até ${expires}`}
              </p>
            )}
          </div>

          {current && (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[
                { label: "Campanhas", value: current.maxCampaigns },
                { label: "Devedores", value: current.maxDebtors.toLocaleString("pt-BR") },
                { label: "Dias restantes", value: data?.planActive ? `${Math.max(0, daysLeft ?? 0)}d` : "—" },
              ].map(stat => (
                <div key={stat.label} style={{
                  textAlign: "center", padding: "12px 20px", borderRadius: 12,
                  background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.07)",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text)" }}>{stat.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!data?.planActive && current?.checkoutUrl && (
          <a href={current.checkoutUrl} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18,
            padding: "10px 20px", borderRadius: 10,
            background: "linear-gradient(135deg,#ef4444,#b91c1c)",
            color: "#fff", fontSize: 13, fontWeight: 700,
            textDecoration: "none", boxShadow: "0 4px 16px rgba(239,68,68,.3)",
          }}>
            Renovar plano atual →
          </a>
        )}
      </div>

      {/* Planos disponíveis */}
      {(data?.availablePlans?.length ?? 0) > 0 && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
            {current ? "Migrar de plano" : "Escolher um plano"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 18 }}>
            Clique em qualquer plano para ser redirecionado ao checkout.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {data?.availablePlans.map((plan, idx) => {
              const isCurrent = current?.id === plan.id;
              const isPopular = idx === Math.floor((data.availablePlans.length - 1) / 2);
              return (
                <div key={plan.id} style={{
                  borderRadius: 16, overflow: "hidden",
                  border: isCurrent ? "1.5px solid rgba(16,185,129,.3)" : isPopular ? "1.5px solid rgba(99,102,241,.35)" : "1px solid rgba(255,255,255,.08)",
                  background: isCurrent ? "rgba(16,185,129,.05)" : "rgba(255,255,255,.03)",
                  position: "relative",
                }}>
                  {/* Top bar colorida */}
                  <div style={{
                    height: 3,
                    background: isCurrent
                      ? "linear-gradient(90deg,#10b981,#34d399)"
                      : isPopular
                        ? "linear-gradient(90deg,#6366f1,#8b5cf6)"
                        : "linear-gradient(90deg,rgba(255,255,255,.1),rgba(255,255,255,.05))",
                  }} />

                  <div style={{ padding: "20px 20px 16px" }}>
                    {(isCurrent || isPopular) && (
                      <div style={{ marginBottom: 10 }}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: ".08em",
                          padding: "2px 8px", borderRadius: 99,
                          background: isCurrent ? "rgba(16,185,129,.12)" : "rgba(99,102,241,.12)",
                          color: isCurrent ? "#34d399" : "#818cf8",
                          border: `1px solid ${isCurrent ? "rgba(16,185,129,.2)" : "rgba(99,102,241,.2)"}`,
                        }}>
                          {isCurrent ? "PLANO ATUAL" : "MAIS POPULAR"}
                        </span>
                      </div>
                    )}

                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 6 }}>{plan.name}</h3>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 14 }}>
                      <span style={{ fontSize: 26, fontWeight: 900, color: "var(--text)" }}>
                        {brl(plan.price).replace("R$", "").trim().split(",")[0]}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>,{brl(plan.price).split(",")[1]} / {durationLabel(plan.durationDays)}</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18, fontSize: 12, color: "var(--text-muted)" }}>
                      <span>✓ Até {plan.maxCampaigns} campanha{plan.maxCampaigns !== 1 ? "s" : ""}</span>
                      <span>✓ Até {plan.maxDebtors.toLocaleString("pt-BR")} devedores</span>
                      <span>✓ {durationLabel(plan.durationDays)} de acesso</span>
                    </div>

                    {isCurrent ? (
                      <div style={{
                        width: "100%", padding: "10px", borderRadius: 10, textAlign: "center",
                        background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.15)",
                        fontSize: 12, fontWeight: 700, color: "#34d399",
                      }}>
                        Plano atual
                      </div>
                    ) : plan.checkoutUrl ? (
                      <a href={plan.checkoutUrl} target="_blank" rel="noopener noreferrer" style={{
                        display: "block", width: "100%", padding: "10px", borderRadius: 10, textAlign: "center",
                        background: isPopular ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,.07)",
                        border: isPopular ? "none" : "1px solid rgba(255,255,255,.1)",
                        fontSize: 12, fontWeight: 700,
                        color: isPopular ? "#fff" : "var(--text)",
                        textDecoration: "none",
                        boxShadow: isPopular ? "0 4px 16px rgba(99,102,241,.25)" : "none",
                        transition: "opacity .15s",
                      }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.opacity = ".85"}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.opacity = "1"}
                      >
                        Assinar este plano →
                      </a>
                    ) : (
                      <div style={{
                        width: "100%", padding: "10px", borderRadius: 10, textAlign: "center",
                        background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)",
                        fontSize: 12, color: "var(--text-muted)",
                      }}>
                        Sem link de checkout
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
