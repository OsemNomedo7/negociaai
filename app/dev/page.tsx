"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "overview" | "clientes" | "campanhas" | "logs" | "planos" | "webhook" | "credenciais";

interface DayStats { label: string; consultas: number; pagamentos: number; }

interface Stats {
  totalUsers: number; activePlans: number; blockedUsers: number; newUsersMonth: number;
  totalCampaigns: number; activeCampaigns: number;
  totalDebtors: number; paidDebtors: number;
  totalConsults: number; totalPayments: number;
  monthlyRevenue: number; conversionRate: string;
  revenueAllTime: number; revenueThisMonth: number;
  days: DayStats[];
  recentUsers: User[]; recentLogs: RecentLog[];
}

interface User {
  id: number; name: string; email: string; active: boolean;
  planId: number | null; planExpiresAt: string | null; createdAt: string;
  plan: { name: string; price: number; durationDays: number } | null;
  _count: { campaigns: number };
  planActive?: boolean;
}

interface Plan {
  id: number; name: string; price: number; durationDays: number;
  maxCampaigns: number; maxDebtors: number; checkoutUrl: string;
  sigilopayProductId: string; active: boolean;
  _count?: { users: number };
}

interface Campaign {
  id: number; name: string; slug: string; active: boolean;
  createdAt: string; customDomain: string | null;
  user: { id: number; name: string; email: string } | null;
  _count: { debtors: number; logs: number };
  paymentsCount: number;
}

interface LogEntry {
  id: number; name: string; cpf: string; event: string;
  ip: string; city: string | null; state: string | null; createdAt: string;
  campaign: { name: string; slug: string; user: { name: string; email: string } } | null;
}

interface RecentLog {
  id: number; name: string; event: string; createdAt: string;
  campaign: { name: string } | null;
}

interface Activation {
  id: number; name: string; email: string;
  planExpiresAt: string; updatedAt: string;
  plan: { name: string } | null;
}

const EMPTY_PLAN: Omit<Plan, "id"> = {
  name: "", price: 0, durationDays: 30, maxCampaigns: 3, maxDebtors: 1000,
  checkoutUrl: "", sigilopayProductId: "", active: true,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (v: string) => new Date(v).toLocaleDateString("pt-BR");
const fmtDT = (v: string) =>
  new Date(v).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const durationLabel = (d: number) =>
  d === 0 ? "Sem limite" : d === 1 ? "Diário" : d === 7 ? "Semanal" : d === 30 ? "Mensal" : `${d}d`;
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const daysLeft = (exp: string | null) => {
  if (!exp) return null;
  return Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000);
};
const initials = (name: string) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
const avatarColor = (name: string) => {
  const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];
  return colors[name.charCodeAt(0) % colors.length];
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  padding: "10px 14px", background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.1)", borderRadius: 10,
  color: "#f8fafc", fontSize: 13, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit", width: "100%",
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 22px", borderRadius: 10,
  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
  fontFamily: "inherit", cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  padding: "10px 22px", borderRadius: 10,
  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.09)",
  color: "rgba(255,255,255,.65)", fontSize: 13, fontFamily: "inherit", cursor: "pointer",
};

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Badge({ ok, labels = ["Ativo", "Inativo"] }: { ok: boolean; labels?: [string, string] }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: ok ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
      color: ok ? "#4ade80" : "#f87171",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: ok ? "#4ade80" : "#f87171", flexShrink: 0 }} />
      {ok ? labels[0] : labels[1]}
    </span>
  );
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${avatarColor(name)}28`,
      border: `1.5px solid ${avatarColor(name)}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 800, color: avatarColor(name),
    }}>
      {initials(name)}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th style={{
      padding: "11px 16px", textAlign: right ? "right" : "left",
      fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.25)",
      letterSpacing: ".08em", textTransform: "uppercase",
      background: "rgba(255,255,255,.02)",
    }}>
      {children}
    </th>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#111827", border: "1px solid rgba(255,255,255,.06)",
      borderRadius: 16, overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginTop: 2 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function MiniBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 28 }}>
      {data.map((v, i) => (
        <div key={i} style={{
          flex: 1, background: color, borderRadius: "2px 2px 0 0",
          height: `${Math.max((v / max) * 100, 6)}%`,
          opacity: 0.25 + (i / Math.max(data.length - 1, 1)) * 0.75,
          transition: "height .3s",
        }} />
      ))}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ height: 110, borderRadius: 16, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)", animation: "shimmer 1.5s infinite" }} />
        ))}
      </div>
    );
  }

  const consultasData = stats.days.map(d => d.consultas);
  const pagamentosData = stats.days.map(d => d.pagamentos);

  const kpis = [
    {
      label: "Total de Clientes", value: stats.totalUsers.toString(),
      sub: `+${stats.newUsersMonth} este mês`, color: "#6366f1",
      chart: undefined,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zm8 14v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
    },
    {
      label: "Planos Ativos", value: stats.activePlans.toString(),
      sub: `${stats.totalUsers - stats.activePlans} sem plano`, color: "#10b981",
      chart: undefined,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
    },
    {
      label: "Campanhas Ativas", value: stats.activeCampaigns.toString(),
      sub: `${stats.totalCampaigns} no total`, color: "#8b5cf6",
      chart: undefined,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
    },
    {
      label: "Receita Est. / Mês", value: brl(stats.monthlyRevenue),
      sub: `${stats.activePlans} assinantes ativos`, color: "#f59e0b",
      chart: undefined,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
    },
    {
      label: "Receita Real (mês)", value: brl(stats.revenueThisMonth),
      sub: `Total acumulado: ${brl(stats.revenueAllTime)}`, color: "#22c55e",
      chart: undefined,
      icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
    },
  ];

  const secondary = [
    { label: "Total Devedores", value: stats.totalDebtors.toLocaleString("pt-BR"), sub: `${stats.paidDebtors.toLocaleString("pt-BR")} pagos`, color: "#94a3b8" },
    { label: "Consultas (total)", value: stats.totalConsults.toLocaleString("pt-BR"), sub: "últimos acessos", color: "#60a5fa" },
    { label: "Pagamentos", value: stats.totalPayments.toLocaleString("pt-BR"), sub: "confirmados", color: "#34d399" },
    { label: "Taxa de Conversão", value: `${stats.conversionRate}%`, sub: "pagamentos / consultas", color: "#f472b6" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Primary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: "linear-gradient(145deg, #111827, #0f1420)",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 16, padding: "22px", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${k.color}, transparent)` }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.3)", letterSpacing: ".07em", textTransform: "uppercase" }}>{k.label}</div>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: `${k.color}18`, display: "flex", alignItems: "center", justifyContent: "center", color: k.color }}>
                {k.icon}
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, color: "#f8fafc", lineHeight: 1, marginBottom: 6 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {secondary.map(s => (
          <div key={s.label} style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.25)", letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Activity chart + feeds */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 12 }}>

        {/* Chart + feeds left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* 7-day chart */}
          <SectionCard>
            <CardHeader title="Atividade — últimos 7 dias" sub="Consultas e pagamentos por dia" />
            <div style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 80, marginBottom: 8 }}>
                {stats.days.map((d, i) => {
                  const maxC = Math.max(...consultasData, 1);
                  const maxP = Math.max(...pagamentosData, 1);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
                      {/* Consultas bar */}
                      <div style={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", height: 64, gap: 2 }}>
                        <div style={{ background: "#6366f1", borderRadius: "3px 3px 0 0", height: `${Math.max((d.consultas / maxC) * 100, d.consultas > 0 ? 8 : 3)}%`, opacity: 0.7 }} title={`${d.consultas} consultas`} />
                        <div style={{ background: "#10b981", borderRadius: "3px 3px 0 0", height: `${Math.max((d.pagamentos / maxP) * 40, d.pagamentos > 0 ? 8 : 3)}%` }} title={`${d.pagamentos} pagamentos`} />
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", whiteSpace: "nowrap" }}>{d.label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
                {[{ color: "#6366f1", label: "Consultas" }, { color: "#10b981", label: "Pagamentos" }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,.4)" }}>
                    <div style={{ width: 10, height: 3, borderRadius: 2, background: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          {/* Recent signups */}
          <SectionCard>
            <CardHeader title="Últimos cadastros" sub={`${stats.totalUsers} clientes no total`} />
            <div style={{ padding: "6px 0" }}>
              {stats.recentUsers.length === 0 ? (
                <div style={{ padding: "20px 22px", fontSize: 13, color: "rgba(255,255,255,.2)" }}>Nenhum cadastro ainda.</div>
              ) : stats.recentUsers.map(u => (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 22px" }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
                  <Avatar name={u.name} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{fmt(u.createdAt)}</div>
                    {u.plan && <div style={{ fontSize: 10, color: "#818cf8", fontWeight: 600, marginTop: 2 }}>{u.plan.name}</div>}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Activity feed right */}
        <SectionCard>
          <CardHeader title="Feed de atividade" sub="Eventos em tempo real" />
          <div style={{ padding: "6px 0", overflowY: "auto", maxHeight: 480 }}>
            {stats.recentLogs.length === 0 ? (
              <div style={{ padding: "20px 22px", fontSize: 13, color: "rgba(255,255,255,.2)" }}>Nenhuma atividade ainda.</div>
            ) : stats.recentLogs.map((l, i) => {
              const isPaid = l.event === "PAGAMENTO_CONCLUIDO";
              return (
                <div key={l.id} style={{ display: "flex", gap: 12, padding: "12px 22px", position: "relative" }}>
                  {/* Timeline line */}
                  {i < stats.recentLogs.length - 1 && (
                    <div style={{ position: "absolute", left: 33, top: 40, bottom: 0, width: 1, background: "rgba(255,255,255,.05)" }} />
                  )}
                  {/* Dot */}
                  <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, marginTop: 2, background: isPaid ? "rgba(16,185,129,.15)" : "rgba(99,102,241,.15)", border: `1.5px solid ${isPaid ? "rgba(16,185,129,.4)" : "rgba(99,102,241,.4)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isPaid ? (
                      <svg width="11" height="11" fill="none" stroke="#10b981" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg width="11" height="11" fill="none" stroke="#818cf8" strokeWidth={2.5} viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /></svg>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isPaid ? "#34d399" : "#818cf8" }}>
                        {isPaid ? "Pagamento" : "Consulta"}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#f8fafc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</div>
                    {l.campaign && <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{l.campaign.name}</div>}
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 2 }}>{fmtDT(l.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ── Clientes ──────────────────────────────────────────────────────────────────
function ClientesTab({ users, plans, onReload }: { users: User[]; plans: Plan[]; onReload: () => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "blocked">("all");
  const [managing, setManaging] = useState<User | null>(null);
  const [newPlanId, setNewPlanId] = useState<number | "">("");
  const [newExpiry, setNewExpiry] = useState("");
  const [saving, setSaving] = useState(false);

  const isActive = (u: User) => u.active && !!u.planExpiresAt && new Date(u.planExpiresAt) > new Date();

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ? true :
      filter === "active" ? isActive(u) :
      filter === "expired" ? (u.active && !isActive(u)) :
      !u.active;
    return matchSearch && matchFilter;
  });

  const counts = {
    all: users.length,
    active: users.filter(isActive).length,
    expired: users.filter(u => u.active && !isActive(u)).length,
    blocked: users.filter(u => !u.active).length,
  };

  async function toggleBlock(u: User) {
    await fetch(`/api/dev/users/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !u.active }) });
    onReload();
  }

  function openManage(u: User) {
    setManaging(u);
    setNewPlanId(u.planId ?? "");
    setNewExpiry(u.planExpiresAt ? u.planExpiresAt.slice(0, 10) : "");
  }

  function extendDays(d: number) {
    if (!managing) return;
    const base = managing.planExpiresAt && new Date(managing.planExpiresAt) > new Date()
      ? new Date(managing.planExpiresAt) : new Date();
    base.setDate(base.getDate() + d);
    setNewExpiry(base.toISOString().slice(0, 10));
  }

  async function saveManage() {
    if (!managing) return;
    setSaving(true);
    const body: Record<string, unknown> = {
      planId: newPlanId === "" ? null : newPlanId,
      planExpiresAt: newExpiry ? new Date(newExpiry + "T23:59:59").toISOString() : null,
    };
    await fetch(`/api/dev/users/${managing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    setManaging(null);
    onReload();
  }

  const filterBtns = [
    { key: "all" as const, label: "Todos" },
    { key: "active" as const, label: "Ativos" },
    { key: "expired" as const, label: "Expirados" },
    { key: "blocked" as const, label: "Bloqueados" },
  ];

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "none" }}>
          <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={1.8} viewBox="0 0 24 24" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...inputSt, width: 260, paddingLeft: 36 }} />
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {filterBtns.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
              background: filter === f.key ? "rgba(99,102,241,.18)" : "rgba(255,255,255,.04)",
              border: filter === f.key ? "1px solid rgba(99,102,241,.4)" : "1px solid rgba(255,255,255,.07)",
              color: filter === f.key ? "#818cf8" : "rgba(255,255,255,.4)",
            }}>
              {f.label} <span style={{ opacity: .6 }}>({counts[f.key]})</span>
            </button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,.25)" }}>{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      <SectionCard>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
              <Th>Cliente</Th><Th>Plano</Th><Th>Campanhas</Th><Th>Vencimento</Th><Th>Restam</Th><Th>Status</Th><Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const active = isActive(u);
              const days = daysLeft(u.planExpiresAt);
              return (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)", transition: "background .1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={u.name} size={32} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {u.plan ? (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.plan.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{brl(u.plan.price)}/{durationLabel(u.plan.durationDays)}</div>
                      </div>
                    ) : <span style={{ fontSize: 12, color: "rgba(255,255,255,.2)" }}>Sem plano</span>}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "rgba(255,255,255,.5)" }}>{u._count.campaigns}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: active ? "rgba(255,255,255,.5)" : "#f87171" }}>
                    {u.planExpiresAt ? fmt(u.planExpiresAt) : "—"}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {days !== null
                      ? <span style={{ fontSize: 13, fontWeight: 700, color: days > 7 ? "#4ade80" : days > 0 ? "#f59e0b" : "#f87171" }}>{days > 0 ? `${days}d` : "Expirado"}</span>
                      : <span style={{ color: "rgba(255,255,255,.2)" }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {!u.active ? <Badge ok={false} labels={["Ativo", "Bloqueado"]} /> : <Badge ok={active} labels={["Ativo", "Expirado"]} />}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openManage(u)} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", background: "rgba(99,102,241,.12)", border: "1px solid rgba(99,102,241,.25)", color: "#818cf8" }}>Gerenciar</button>
                      <button onClick={() => toggleBlock(u)} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", background: u.active ? "rgba(239,68,68,.08)" : "rgba(34,197,94,.08)", border: u.active ? "1px solid rgba(239,68,68,.2)" : "1px solid rgba(34,197,94,.2)", color: u.active ? "#f87171" : "#4ade80" }}>
                        {u.active ? "Bloquear" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "rgba(255,255,255,.2)", fontSize: 14 }}>
                {search || filter !== "all" ? "Nenhum resultado encontrado." : "Nenhum cliente ainda."}
              </td></tr>
            )}
          </tbody>
        </table>
      </SectionCard>

      {/* Modal */}
      {managing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#131320", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: "32px", width: "100%", maxWidth: 460, boxShadow: "0 32px 80px rgba(0,0,0,.6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
              <Avatar name={managing.name} size={46} />
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{managing.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{managing.email}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.35)", marginBottom: 7, letterSpacing: ".06em", textTransform: "uppercase" }}>Plano</label>
                <select value={newPlanId} onChange={e => setNewPlanId(e.target.value === "" ? "" : Number(e.target.value))} style={{ ...inputSt, appearance: "none" as const }}>
                  <option value="">Sem plano</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} — {brl(p.price)} ({durationLabel(p.durationDays)})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.35)", marginBottom: 7, letterSpacing: ".06em", textTransform: "uppercase" }}>Validade</label>
                <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={inputSt} />
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  {[7, 15, 30, 90].map(d => (
                    <button key={d} onClick={() => extendDays(d)} style={{ padding: "5px 11px", borderRadius: 7, fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)", color: "#818cf8" }}>+{d}d</button>
                  ))}
                </div>
                {managing.planExpiresAt && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: 8 }}>
                    Atual: {fmt(managing.planExpiresAt)}
                    {daysLeft(managing.planExpiresAt) !== null && (
                      <span style={{ marginLeft: 8, color: daysLeft(managing.planExpiresAt)! > 0 ? "#4ade80" : "#f87171" }}>
                        ({daysLeft(managing.planExpiresAt)! > 0 ? `${daysLeft(managing.planExpiresAt)} dias restantes` : "expirado"})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 28, justifyContent: "flex-end" }}>
              <button onClick={() => setManaging(null)} style={btnGhost}>Cancelar</button>
              <button onClick={saveManage} disabled={saving} style={btnPrimary}>{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Campanhas ─────────────────────────────────────────────────────────────────
function CampanhasTab({ campaigns }: { campaigns: Campaign[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const filtered = campaigns.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) ||
      (c.user?.name ?? "").toLowerCase().includes(q) ||
      (c.user?.email ?? "").toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" ? true : filterStatus === "active" ? c.active : !c.active;
    return matchSearch && matchStatus;
  });

  const totals = filtered.reduce((acc, c) => ({
    debtors: acc.debtors + c._count.debtors,
    logs: acc.logs + c._count.logs,
    payments: acc.payments + c.paymentsCount,
  }), { debtors: 0, logs: 0, payments: 0 });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "none" }}>
          <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth={1.8} viewBox="0 0 24 24" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
          </svg>
          <input placeholder="Buscar campanha ou cliente..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputSt, width: 280, paddingLeft: 36 }} />
        </div>
        {(["all", "active", "inactive"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600,
            fontFamily: "inherit", cursor: "pointer",
            background: filterStatus === s ? "rgba(99,102,241,.18)" : "rgba(255,255,255,.04)",
            border: filterStatus === s ? "1px solid rgba(99,102,241,.4)" : "1px solid rgba(255,255,255,.07)",
            color: filterStatus === s ? "#818cf8" : "rgba(255,255,255,.4)",
          }}>
            {s === "all" ? "Todas" : s === "active" ? "Ativas" : "Inativas"} ({s === "all" ? campaigns.length : s === "active" ? campaigns.filter(c => c.active).length : campaigns.filter(c => !c.active).length})
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,.3)" }}>
          <span>Devedores: <strong style={{ color: "#94a3b8" }}>{totals.debtors.toLocaleString("pt-BR")}</strong></span>
          <span>Consultas: <strong style={{ color: "#818cf8" }}>{totals.logs.toLocaleString("pt-BR")}</strong></span>
          <span>Pagamentos: <strong style={{ color: "#4ade80" }}>{totals.payments.toLocaleString("pt-BR")}</strong></span>
        </div>
      </div>

      <SectionCard>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
              <Th>Campanha</Th><Th>Cliente</Th><Th>Devedores</Th><Th>Consultas</Th><Th>Pagamentos</Th><Th>Conv.</Th><Th>Status</Th><Th>Criada</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const conv = c._count.logs > 0 ? ((c.paymentsCount / c._count.logs) * 100).toFixed(1) : "0.0";
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)", transition: "background .1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,.02)"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontFamily: "monospace" }}>
                      /{c.slug}
                      {c.customDomain && <span style={{ color: "#818cf8", marginLeft: 6 }}>{c.customDomain}</span>}
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {c.user ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={c.user.name} size={26} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{c.user.name}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{c.user.email}</div>
                        </div>
                      </div>
                    ) : <span style={{ fontSize: 12, color: "rgba(255,255,255,.2)" }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "rgba(255,255,255,.5)" }}>{c._count.debtors.toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#818cf8" }}>{c._count.logs.toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#4ade80" }}>{c.paymentsCount.toLocaleString("pt-BR")}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: parseFloat(conv) >= 10 ? "#4ade80" : parseFloat(conv) >= 3 ? "#f59e0b" : "rgba(255,255,255,.35)" }}>{conv}%</span>
                  </td>
                  <td style={{ padding: "13px 16px" }}><Badge ok={c.active} /></td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "rgba(255,255,255,.3)" }}>{fmt(c.createdAt)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: "rgba(255,255,255,.2)", fontSize: 14 }}>
                {search ? "Nenhum resultado." : "Nenhuma campanha criada ainda."}
              </td></tr>
            )}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// ── Logs ──────────────────────────────────────────────────────────────────────
function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<"" | "CONSULTA" | "PAGAMENTO_CONCLUIDO">("");

  const load = useCallback(async (p: number, ev: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p) });
      if (ev) params.set("event", ev);
      const r = await fetch(`/api/dev/logs?${params}`);
      const d = await r.json();
      setLogs(d.logs ?? []); setPage(d.page ?? 1); setPages(d.pages ?? 1); setTotal(d.total ?? 0);
    } catch {
      setLogs([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1, event); }, [load, event]);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,.35)" }}>{total.toLocaleString("pt-BR")} evento{total !== 1 ? "s" : ""}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          {([["", "Todos"], ["CONSULTA", "Consultas"], ["PAGAMENTO_CONCLUIDO", "Pagamentos"]] as [string, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setEvent(val as typeof event)} style={{
              padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
              background: event === val ? "rgba(99,102,241,.18)" : "rgba(255,255,255,.04)",
              border: event === val ? "1px solid rgba(99,102,241,.4)" : "1px solid rgba(255,255,255,.07)",
              color: event === val ? "#818cf8" : "rgba(255,255,255,.4)",
            }}>{label}</button>
          ))}
        </div>
      </div>

      <SectionCard>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
              <Th>Evento</Th><Th>Nome</Th><Th>CPF</Th><Th>Campanha</Th><Th>Cliente</Th><Th>Local</Th><Th>Data</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,.2)", fontSize: 14 }}>Carregando...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,.2)", fontSize: 14 }}>Nenhum log encontrado.</td></tr>
            ) : logs.map(l => (
              <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)", transition: "background .1s" }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,.02)"}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                <td style={{ padding: "11px 16px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 7, fontSize: 10, fontWeight: 700, background: l.event === "PAGAMENTO_CONCLUIDO" ? "rgba(16,185,129,.12)" : "rgba(99,102,241,.12)", color: l.event === "PAGAMENTO_CONCLUIDO" ? "#34d399" : "#818cf8" }}>
                    {l.event === "PAGAMENTO_CONCLUIDO" ? "PAGO" : "CONSULTA"}
                  </span>
                </td>
                <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 500 }}>{l.name}</td>
                <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,.4)", fontFamily: "monospace" }}>{l.cpf}</td>
                <td style={{ padding: "11px 16px", fontSize: 13 }}>{l.campaign?.name ?? "—"}</td>
                <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,.35)" }}>{l.campaign?.user?.name ?? "—"}</td>
                <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,.35)" }}>{l.city && l.state ? `${l.city}, ${l.state}` : (l.ip || "—")}</td>
                <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,.3)" }}>{fmtDT(l.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button onClick={() => load(page - 1, event)} disabled={page <= 1} style={{ ...btnGhost, padding: "7px 16px", fontSize: 12, opacity: page <= 1 ? 0.3 : 1, cursor: page <= 1 ? "not-allowed" : "pointer" }}>← Anterior</button>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)", padding: "0 12px" }}>Página {page} de {pages}</span>
          <button onClick={() => load(page + 1, event)} disabled={page >= pages} style={{ ...btnGhost, padding: "7px 16px", fontSize: 12, opacity: page >= pages ? 0.3 : 1, cursor: page >= pages ? "not-allowed" : "pointer" }}>Próxima →</button>
        </div>
      )}
    </div>
  );
}

// ── Planos ────────────────────────────────────────────────────────────────────
function PlanosTab({ plans, onReload }: { plans: Plan[]; onReload: () => void }) {
  const [editPlan, setEditPlan] = useState<(Plan | Omit<Plan, "id">) | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null);

  async function savePlan() {
    setSaving(true);
    const isEdit = editPlan && "id" in editPlan;
    await fetch(isEdit ? `/api/dev/plans/${(editPlan as Plan).id}` : "/api/dev/plans", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editPlan),
    });
    setEditPlan(null); setSaving(false); onReload();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <button onClick={() => setEditPlan(EMPTY_PLAN)} style={btnPrimary}>+ Novo plano</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ background: "linear-gradient(145deg,#111827,#0f1420)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 18, padding: "24px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: plan.active ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,.1)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 4 }}>{durationLabel(plan.durationDays)}</div>
                <h3 style={{ fontSize: 19, fontWeight: 800 }}>{plan.name}</h3>
              </div>
              <Badge ok={plan.active} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 10, background: "linear-gradient(135deg,#f8fafc,rgba(248,250,252,.7))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {brl(plan.price)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14, fontSize: 13, color: "rgba(255,255,255,.4)" }}>
              <span>{plan.maxCampaigns === 0 ? "Campanhas ilimitadas" : `${plan.maxCampaigns} campanha${plan.maxCampaigns !== 1 ? "s" : ""}`}</span>
              <span>{plan.maxDebtors === 0 ? "Devedores ilimitados" : `${plan.maxDebtors.toLocaleString("pt-BR")} devedores`}</span>
              <span>{plan.durationDays === 0 ? "Acesso sem limite de prazo" : `${plan.durationDays} dias de acesso`}</span>
            </div>
            <div style={{ padding: "7px 10px", borderRadius: 7, background: plan.sigilopayProductId ? "rgba(34,197,94,.06)" : "rgba(239,68,68,.06)", border: `1px solid ${plan.sigilopayProductId ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.2)"}`, marginBottom: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.25)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>ID Produto SigiloPay</div>
              <code style={{ fontSize: 11, color: plan.sigilopayProductId ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>
                {plan.sigilopayProductId || "⚠ Não configurado"}
              </code>
            </div>
            {plan._count !== undefined && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 7, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", fontSize: 11, fontWeight: 600, color: "#818cf8", marginBottom: 16 }}>
                {plan._count.users} assinante{plan._count.users !== 1 ? "s" : ""}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditPlan(plan)} style={{ flex: 1, padding: "9px", borderRadius: 9, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", color: "#818cf8", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>Editar</button>
              <button onClick={() => setConfirmDelete(plan)} style={{ padding: "9px 12px", borderRadius: 9, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.18)", color: "#f87171", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>✕</button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <p style={{ color: "rgba(255,255,255,.2)", fontSize: 14 }}>Nenhum plano ainda.</p>}
      </div>

      {/* Modal criar/editar */}
      {editPlan && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#131320", border: "1px solid rgba(255,255,255,.1)", borderRadius: 22, padding: "32px", width: "100%", maxWidth: 480, boxShadow: "0 32px 80px rgba(0,0,0,.6)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>{"id" in editPlan ? "Editar plano" : "Novo plano"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {([
                { label: "Nome", key: "name", type: "text" },
                { label: "Preço (R$)", key: "price", type: "number" },
                { label: "Duração (dias) — 0 = sem limite", key: "durationDays", type: "number" },
                { label: "Máx. campanhas — 0 = sem limite", key: "maxCampaigns", type: "number" },
                { label: "Máx. devedores — 0 = sem limite", key: "maxDebtors", type: "number" },
                { label: "URL de checkout", key: "checkoutUrl", type: "text" },
                { label: "ID do Produto SigiloPay", key: "sigilopayProductId", type: "text" },
              ] as { label: string; key: string; type: string }[]).map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.35)", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>{f.label}</label>
                  <input type={f.type} value={(editPlan as Record<string, unknown>)[f.key] as string}
                    onChange={e => setEditPlan(p => ({ ...p!, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                    style={inputSt} />
                </div>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,.6)", cursor: "pointer" }}>
                <input type="checkbox" checked={(editPlan as Plan).active ?? true} onChange={e => setEditPlan(p => ({ ...p!, active: e.target.checked }))} />
                Plano ativo (visível para clientes)
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setEditPlan(null)} style={btnGhost}>Cancelar</button>
              <button onClick={savePlan} disabled={saving} style={btnPrimary}>{saving ? "Salvando..." : "Salvar plano"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar delete */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "#131320", border: "1px solid rgba(239,68,68,.2)", borderRadius: 22, padding: "32px", width: "100%", maxWidth: 400, boxShadow: "0 32px 80px rgba(0,0,0,.6)" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <svg width="20" height="20" fill="none" stroke="#f87171" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Excluir "{confirmDelete.name}"?</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.45)", marginBottom: 28, lineHeight: 1.6 }}>
              Esta ação é permanente.{confirmDelete._count?.users ? ` ${confirmDelete._count.users} usuário(s) usa este plano.` : ""}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={btnGhost}>Cancelar</button>
              <button onClick={async () => { await fetch(`/api/dev/plans/${confirmDelete.id}`, { method: "DELETE" }); setConfirmDelete(null); onReload(); }} style={{ ...btnPrimary, background: "linear-gradient(135deg,#ef4444,#dc2626)" }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Webhook ───────────────────────────────────────────────────────────────────
function WebhookTab() {
  const [secret, setSecret] = useState("");
  const [savedSecret, setSavedSecret] = useState("");
  const [activations, setActivations] = useState<Activation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testPlanId, setTestPlanId] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [plans, setPlans] = useState<{ id: number; name: string }[]>([]);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    async function load() {
      const [s, p] = await Promise.all([fetch("/api/dev/settings").then(r => r.json()), fetch("/api/dev/plans").then(r => r.json())]);
      setSecret(s.planWebhookSecret ?? ""); setSavedSecret(s.planWebhookSecret ?? ""); setActivations(s.recentActivations ?? []);
      if (Array.isArray(p)) setPlans(p.map((pl: { id: number; name: string }) => ({ id: pl.id, name: pl.name })));
      setLoading(false);
    }
    load();
  }, []);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  function generateSecret() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    setSecret(Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
  }

  async function saveSecret() {
    setSaving(true);
    await fetch("/api/dev/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ planWebhookSecret: secret }) });
    setSavedSecret(secret); setSaving(false);
  }

  async function testWebhook() {
    if (!testEmail || !testPlanId) return;
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch("/api/webhook/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: testEmail, planId: Number(testPlanId), secret: savedSecret }) });
      const d = await res.json();
      if (res.ok) {
        setTestResult({ ok: true, msg: `Plano "${d.plan?.name}" ativado para ${d.user?.name}. Expira em ${new Date(d.planExpiresAt).toLocaleDateString("pt-BR")}.` });
        const s = await fetch("/api/dev/settings").then(r => r.json());
        setActivations(s.recentActivations ?? []);
      } else {
        setTestResult({ ok: false, msg: d.error ?? "Erro desconhecido." });
      }
    } catch { setTestResult({ ok: false, msg: "Falha na conexão." }); }
    setTesting(false);
  }

  const CopyBtn = ({ text, k }: { text: string; k: string }) => (
    <button onClick={() => copy(text, k)} style={{ padding: "6px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", flexShrink: 0, background: copied === k ? "rgba(34,197,94,.15)" : "rgba(255,255,255,.06)", border: copied === k ? "1px solid rgba(34,197,94,.3)" : "1px solid rgba(255,255,255,.1)", color: copied === k ? "#4ade80" : "rgba(255,255,255,.5)", transition: "all .15s" }}>
      {copied === k ? "✓ Copiado" : "Copiar"}
    </button>
  );

  if (loading) return <div style={{ color: "rgba(255,255,255,.3)", padding: 60, textAlign: "center" }}>Carregando...</div>;

  const webhookUrl = `${baseUrl}/api/webhook/plan`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 780 }}>

      {/* URL */}
      <SectionCard>
        <CardHeader title="URL do Webhook" sub="Configure na sua plataforma de pagamento (SigiloPay, Hotmart, Kiwify...)" />
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <code style={{ flex: 1, padding: "10px 14px", background: "rgba(99,102,241,.07)", border: "1px solid rgba(99,102,241,.2)", borderRadius: 10, fontSize: 13, color: "#818cf8", fontFamily: "monospace", wordBreak: "break-all" }}>{webhookUrl}</code>
            <CopyBtn text={webhookUrl} k="url" />
          </div>

          {plans.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.3)", letterSpacing: ".07em", textTransform: "uppercase" }}>URLs por plano — use estas na SigiloPay</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {plans.map((p, i) => {
                  const planUrl = `${webhookUrl}?planId=${p.id}${savedSecret ? `&secret=${savedSecret}` : ""}`;
                  return (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#818cf8", flexShrink: 0 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginBottom: 3 }}>{p.name}</div>
                        <code style={{ display: "block", padding: "8px 12px", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, fontSize: 12, color: "#94a3b8", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{planUrl}</code>
                      </div>
                      <CopyBtn text={planUrl} k={`url-${p.id}`} />
                    </div>
                  );
                })}
              </div>
              {!savedSecret && <div style={{ fontSize: 12, color: "#f59e0b", background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 8, padding: "8px 12px" }}>Configure o secret abaixo para que ele apareça nas URLs.</div>}
            </>
          )}
        </div>
      </SectionCard>

      {/* Secret */}
      <SectionCard>
        <CardHeader title="Secret de Autenticação" sub="Garante que só sua plataforma de pagamento pode ativar planos" />
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={secret} onChange={e => setSecret(e.target.value)} placeholder="Cole ou gere um secret seguro..." style={{ ...inputSt, fontFamily: "monospace", fontSize: 13 }} />
            <CopyBtn text={secret} k="secret" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={generateSecret} style={{ padding: "8px 16px", borderRadius: 9, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)", color: "#818cf8" }}>Gerar novo secret</button>
            <button onClick={saveSecret} disabled={saving || secret === savedSecret} style={{ ...btnPrimary, padding: "8px 20px", fontSize: 12, opacity: saving || secret === savedSecret ? 0.5 : 1, cursor: saving || secret === savedSecret ? "not-allowed" : "pointer" }}>
              {saving ? "Salvando..." : secret === savedSecret ? "Salvo ✓" : "Salvar secret"}
            </button>
          </div>
          {savedSecret
            ? <div style={{ padding: "8px 12px", background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.15)", borderRadius: 8, fontSize: 12, color: "#4ade80" }}>Secret ativo configurado</div>
            : <div style={{ padding: "8px 12px", background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.15)", borderRadius: 8, fontSize: 12, color: "#f59e0b" }}>Sem secret — o webhook aceita qualquer requisição.</div>}
        </div>
      </SectionCard>

      {/* Payload */}
      <SectionCard>
        <CardHeader title="Formato do Payload" sub="JSON que a plataforma de pagamento deve enviar" />
        <div style={{ padding: "20px 22px" }}>
          <div style={{ position: "relative" }}>
            <pre style={{ padding: "16px 18px", background: "rgba(0,0,0,.3)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 10, fontSize: 13, color: "#94a3b8", fontFamily: "monospace", lineHeight: 1.7, margin: 0 }}>
              {JSON.stringify({ email: "cliente@email.com", planId: 1, secret: savedSecret || "SEU_SECRET" }, null, 2)}
            </pre>
            <div style={{ position: "absolute", top: 10, right: 10 }}>
              <CopyBtn text={JSON.stringify({ email: "cliente@email.com", planId: 1, secret: savedSecret || "SEU_SECRET" }, null, 2)} k="payload" />
            </div>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,.35)", lineHeight: 1.8 }}>
            <strong style={{ color: "rgba(255,255,255,.6)" }}>email</strong> — e-mail do cliente cadastrado na plataforma<br />
            <strong style={{ color: "rgba(255,255,255,.6)" }}>planId</strong> — ID do plano{plans.length > 0 && ` (${plans.map(p => `${p.id}=${p.name}`).join(", ")})`}<br />
            <strong style={{ color: "rgba(255,255,255,.6)" }}>secret</strong> — chave de autenticação configurada acima
          </div>
        </div>
      </SectionCard>

      {/* Test */}
      <SectionCard>
        <CardHeader title="Testar Ativação" sub="Simula o recebimento de um pagamento" />
        <div style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.35)", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>E-mail do cliente</label>
              <input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="cliente@email.com" style={inputSt} />
            </div>
            <div style={{ width: 200 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.35)", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>Plano</label>
              <select value={testPlanId} onChange={e => setTestPlanId(e.target.value)} style={{ ...inputSt, appearance: "none" as const }}>
                <option value="">Selecionar...</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <button onClick={testWebhook} disabled={testing || !testEmail || !testPlanId} style={{ ...btnPrimary, opacity: testing || !testEmail || !testPlanId ? 0.5 : 1, cursor: testing || !testEmail || !testPlanId ? "not-allowed" : "pointer" }}>
            {testing ? "Ativando..." : "Ativar plano agora"}
          </button>
          {testResult && (
            <div style={{ marginTop: 14, padding: "12px 16px", borderRadius: 10, fontSize: 13, background: testResult.ok ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)", border: testResult.ok ? "1px solid rgba(34,197,94,.2)" : "1px solid rgba(239,68,68,.2)", color: testResult.ok ? "#4ade80" : "#f87171" }}>
              {testResult.msg}
            </div>
          )}
        </div>
      </SectionCard>

      {/* Ativações recentes */}
      <SectionCard>
        <CardHeader title="Últimas Ativações" sub="Planos ativados recentemente" />
        {activations.length === 0
          ? <div style={{ padding: "24px 22px", fontSize: 13, color: "rgba(255,255,255,.2)" }}>Nenhuma ativação ainda.</div>
          : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                  <Th>Cliente</Th><Th>Plano</Th><Th>Expira em</Th><Th>Ativado</Th>
                </tr>
              </thead>
              <tbody>
                {activations.map(a => (
                  <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                    <td style={{ padding: "11px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <Avatar name={a.name} size={28} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 16px", fontSize: 13 }}>{a.plan?.name ?? "—"}</td>
                    <td style={{ padding: "11px 16px", fontSize: 13, color: new Date(a.planExpiresAt) > new Date() ? "#4ade80" : "#f87171" }}>{fmt(a.planExpiresAt)}</td>
                    <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,.3)" }}>{fmtDT(a.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </SectionCard>
    </div>
  );
}

// ── Credenciais ───────────────────────────────────────────────────────────────
function CredenciaisTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPassword && newPassword !== confirmPassword) {
      setMsg({ type: "err", text: "As senhas não coincidem." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dev/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newUsername: newUsername || undefined, newPassword: newPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "err", text: data.error }); return; }
      setMsg({ type: "ok", text: data.message });
      setCurrentPassword(""); setNewUsername(""); setNewPassword(""); setConfirmPassword("");
    } catch { setMsg({ type: "err", text: "Falha na conexão." }); }
    finally { setLoading(false); }
  }

  const field = (label: string, value: string, set: (v: string) => void, placeholder?: string) => (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.35)", marginBottom: 7, letterSpacing: ".07em", textTransform: "uppercase" }}>{label}</label>
      <input type="password" value={value} onChange={e => set(e.target.value)} placeholder={placeholder ?? "••••••••"} style={inputSt} />
    </div>
  );

  return (
    <div style={{ maxWidth: 480 }}>
      <SectionCard>
        <CardHeader title="Alterar Credenciais" sub="Atualize o usuário e/ou senha de acesso ao painel DEV" />
        <div style={{ padding: 24 }}>
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Senha atual */}
            <div style={{ padding: "14px 16px", background: "rgba(239,68,68,.05)", border: "1px solid rgba(239,68,68,.12)", borderRadius: 12, marginBottom: 4 }}>
              <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,.4)", lineHeight: 1.5 }}>
                A senha atual é necessária para confirmar qualquer alteração.
              </p>
            </div>
            {field("Senha atual *", currentPassword, setCurrentPassword, "Sua senha atual")}

            <div style={{ height: 1, background: "rgba(255,255,255,.05)", margin: "4px 0" }} />

            {/* Novo usuário */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.35)", marginBottom: 7, letterSpacing: ".07em", textTransform: "uppercase" }}>Novo usuário <span style={{ color: "rgba(255,255,255,.2)", fontWeight: 400 }}>(opcional)</span></label>
              <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="ex: admin" style={inputSt} autoComplete="off" />
            </div>

            {/* Nova senha */}
            {field("Nova senha (opcional)", newPassword, setNewPassword, "Mínimo 6 caracteres")}
            {field("Confirmar nova senha", confirmPassword, setConfirmPassword, "Repita a nova senha")}

            {msg && (
              <div style={{
                padding: "12px 14px", borderRadius: 10,
                background: msg.type === "ok" ? "rgba(34,197,94,.07)" : "rgba(239,68,68,.07)",
                border: `1px solid ${msg.type === "ok" ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.2)"}`,
                color: msg.type === "ok" ? "#4ade80" : "#f87171",
                fontSize: 13, display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>{msg.type === "ok" ? "✓" : "⚠"}</span>
                {msg.text}
              </div>
            )}

            <button type="submit" disabled={loading || !currentPassword} style={{
              ...btnPrimary,
              background: "linear-gradient(135deg,#ef4444,#b91c1c)",
              boxShadow: "0 4px 20px rgba(239,68,68,.25)",
              opacity: (!currentPassword || loading) ? .5 : 1,
              cursor: (!currentPassword || loading) ? "not-allowed" : "pointer",
            }}>
              {loading ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
const NAV: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview", label: "Overview", icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg> },
  { key: "clientes", label: "Clientes", icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zm8 14v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg> },
  { key: "campanhas", label: "Campanhas", icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
  { key: "logs", label: "Logs", icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
  { key: "planos", label: "Planos", icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
  { key: "webhook", label: "Webhook", icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
  { key: "credenciais", label: "Credenciais", icon: <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" /></svg> },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DevPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const redirect401 = useCallback((r: Response) => {
    if (r.status === 401) { router.push("/dev/login"); return true; }
    return false;
  }, [router]);

  const loadStats = useCallback(async () => {
    const r = await fetch("/api/dev/stats");
    if (redirect401(r)) return;
    setStats(await r.json());
  }, [redirect401]);

  const loadUsers = useCallback(async () => {
    const r = await fetch("/api/dev/users");
    if (redirect401(r)) return;
    const d = await r.json();
    if (Array.isArray(d)) setUsers(d);
  }, [redirect401]);

  const loadPlans = useCallback(async () => {
    const d = await fetch("/api/dev/plans").then(r => r.json());
    if (Array.isArray(d)) setPlans(d);
  }, []);

  const loadCampaigns = useCallback(async () => {
    const r = await fetch("/api/dev/campaigns");
    if (redirect401(r)) return;
    const d = await r.json();
    if (Array.isArray(d)) setCampaigns(d);
  }, [redirect401]);

  useEffect(() => {
    document.title = "Caos Dívidas — Painel DEV";
    loadStats(); loadUsers(); loadPlans(); loadCampaigns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/dev/login");
  }

  const reloadAll = () => { loadStats(); loadUsers(); loadPlans(); loadCampaigns(); };

  const subtitles: Partial<Record<Tab, string>> = {
    clientes: `${users.length} cliente${users.length !== 1 ? "s" : ""} cadastrado${users.length !== 1 ? "s" : ""}`,
    campanhas: `${campaigns.length} campanha${campaigns.length !== 1 ? "s" : ""} no total`,
    planos: "Configure os planos disponíveis para os clientes",
    webhook: "Integração com plataforma de pagamento para ativação automática",
    logs: "Histórico de eventos da plataforma",
    credenciais: "Altere o usuário e a senha de acesso ao painel DEV",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #09090b; overflow-x: hidden; }
        select option { background: #1e293b; color: #f8fafc; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes shimmer { 0%,100% { opacity:.4 } 50% { opacity:.7 } }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#09090b", fontFamily: "Inter, system-ui, sans-serif", color: "#f8fafc", display: "flex" }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 224, flexShrink: 0,
          background: "linear-gradient(180deg, #0d0d17 0%, #08080f 100%)",
          borderRight: "1px solid rgba(255,255,255,.05)",
          display: "flex", flexDirection: "column",
          position: "sticky", top: 0, height: "100vh",
        }}>
          {/* Logo */}
          <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,.05)", textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo" style={{ height: 46, objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(239,68,68,.25))" }} />
            <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", fontSize: 9, fontWeight: 800, color: "#f87171", letterSpacing: ".12em" }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#f87171" }} />
              PAINEL DEV
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.18)", letterSpacing: ".12em", textTransform: "uppercase", padding: "2px 12px 10px" }}>Navegação</div>
            {NAV.map(item => {
              const active = tab === item.key;
              return (
                <button key={item.key} onClick={() => setTab(item.key)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 9, border: "none",
                  background: active ? "rgba(239,68,68,.1)" : "transparent",
                  color: active ? "#f87171" : "rgba(255,255,255,.38)",
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  fontFamily: "inherit", cursor: "pointer", textAlign: "left",
                  position: "relative", transition: "all .15s", width: "100%",
                }}>
                  {active && <span style={{ position: "absolute", left: 0, top: "18%", bottom: "18%", width: 2.5, borderRadius: "0 3px 3px 0", background: "linear-gradient(180deg,#f87171,#ef4444)", boxShadow: "0 0 8px rgba(239,68,68,.5)" }} />}
                  <span style={{ color: active ? "#f87171" : "inherit", opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div style={{ padding: "10px 10px 14px", borderTop: "1px solid rgba(255,255,255,.05)" }}>
            <button onClick={reloadAll} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, background: "transparent", border: "none", color: "rgba(255,255,255,.25)", fontFamily: "inherit", fontSize: 12, cursor: "pointer", width: "100%", transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.55)"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,.25)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Atualizar dados
            </button>
            <button onClick={logout} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 9, background: "transparent", border: "none", color: "rgba(248,82,82,.4)", fontFamily: "inherit", fontSize: 12, cursor: "pointer", width: "100%", transition: "all .15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,.07)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(248,82,82,.4)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
              Sair da conta
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Topbar */}
          <header style={{ height: 56, background: "rgba(9,9,11,.85)", borderBottom: "1px solid rgba(255,255,255,.05)", backdropFilter: "blur(24px)", display: "flex", alignItems: "center", padding: "0 28px", position: "sticky", top: 0, zIndex: 20, gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.2)" }}>DEV</span>
              <span style={{ color: "rgba(255,255,255,.15)" }}>›</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{NAV.find(n => n.key === tab)?.label}</span>
            </div>
            {stats && tab === "overview" && (
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,.3)" }}>
                <span><span style={{ color: "#4ade80", fontWeight: 600 }}>{stats.activePlans}</span> planos ativos</span>
                <span><span style={{ color: "#818cf8", fontWeight: 600 }}>{stats.activeCampaigns}</span> campanhas</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 8, background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.12)", fontSize: 11, fontWeight: 600, color: "#4ade80" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
              Online
            </div>
          </header>

          {/* Content */}
          <main style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{NAV.find(n => n.key === tab)?.label}</h1>
              {subtitles[tab] && <p style={{ fontSize: 13, color: "rgba(255,255,255,.3)", marginTop: 5 }}>{subtitles[tab]}</p>}
            </div>

            {tab === "overview"  && <OverviewTab stats={stats} />}
            {tab === "clientes"  && <ClientesTab users={users} plans={plans} onReload={() => { loadUsers(); loadStats(); }} />}
            {tab === "campanhas" && <CampanhasTab campaigns={campaigns} />}
            {tab === "logs"      && <LogsTab />}
            {tab === "planos"    && <PlanosTab plans={plans} onReload={() => { loadPlans(); loadStats(); }} />}
            {tab === "webhook"      && <WebhookTab />}
            {tab === "credenciais"  && <CredenciaisTab />}
          </main>
        </div>
      </div>
    </>
  );
}
