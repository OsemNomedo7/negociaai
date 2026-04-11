"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ── Types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "clientes" | "campanhas" | "logs" | "planos" | "webhook";

interface Stats {
  totalUsers: number; activePlans: number; blockedUsers: number;
  totalCampaigns: number; activeCampaigns: number;
  totalDebtors: number; paidDebtors: number;
  totalConsults: number; totalPayments: number;
  monthlyRevenue: number; conversionRate: string;
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
  maxCampaigns: number; maxDebtors: number; checkoutUrl: string; active: boolean;
  _count?: { users: number };
}

interface Campaign {
  id: number; name: string; slug: string; active: boolean;
  createdAt: string; customDomain: string | null;
  user: { id: number; name: string; email: string };
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

// ── Constants ────────────────────────────────────────────────────────────────
const EMPTY_PLAN: Omit<Plan, "id"> = {
  name: "", price: 0, durationDays: 30, maxCampaigns: 3, maxDebtors: 1000,
  checkoutUrl: "", active: true,
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: string) => new Date(v).toLocaleDateString("pt-BR");
const fmtDT = (v: string) =>
  new Date(v).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const durationLabel = (d: number) =>
  d === 1 ? "Diário" : d === 7 ? "Semanal" : d === 30 ? "Mensal" : `${d}d`;
const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const daysLeft = (exp: string | null) => {
  if (!exp) return null;
  const diff = Math.ceil((new Date(exp).getTime() - Date.now()) / 86400000);
  return diff;
};

// ── Shared styles ────────────────────────────────────────────────────────────
const inputSt: React.CSSProperties = {
  padding: "9px 13px", background: "rgba(255,255,255,.05)",
  border: "1px solid rgba(255,255,255,.1)", borderRadius: 9,
  color: "#f8fafc", fontSize: 13, outline: "none",
  boxSizing: "border-box", fontFamily: "inherit", width: "100%",
};
const btnPrimary: React.CSSProperties = {
  padding: "9px 20px", borderRadius: 9,
  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
  border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
  fontFamily: "inherit", cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  padding: "9px 20px", borderRadius: 9,
  background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)",
  color: "rgba(255,255,255,.7)", fontSize: 13, fontFamily: "inherit", cursor: "pointer",
};

function Badge({ ok, labels = ["Ativo", "Inativo"] }: { ok: boolean; labels?: [string, string] }) {
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: ok ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
      color: ok ? "#4ade80" : "#f87171",
    }}>
      {ok ? labels[0] : labels[1]}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700,
      color: "rgba(255,255,255,.3)", letterSpacing: ".06em", textTransform: "uppercase",
    }}>
      {children}
    </th>
  );
}

// ── SVG Icons ────────────────────────────────────────────────────────────────
const IcoGrid = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
const IcoUsers = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const IcoMega = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
  </svg>
);
const IcoList = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const IcoCard = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const IcoWebhook = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);
const IcoLogout = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v1" />
  </svg>
);

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ background: "#111827", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "20px 22px", height: 90, opacity: .4 }} />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total de Clientes", value: stats.totalUsers, sub: `${stats.blockedUsers} bloqueado${stats.blockedUsers !== 1 ? "s" : ""}`, color: "#f8fafc" },
    { label: "Planos Ativos", value: stats.activePlans, sub: `${stats.totalUsers - stats.activePlans} sem plano ativo`, color: "#4ade80" },
    { label: "Campanhas Ativas", value: stats.activeCampaigns, sub: `${stats.totalCampaigns} no total`, color: "#818cf8" },
    { label: "Total de Devedores", value: stats.totalDebtors.toLocaleString("pt-BR"), sub: `${stats.paidDebtors.toLocaleString("pt-BR")} pagos`, color: "#94a3b8" },
    { label: "Taxa de Conversão", value: `${stats.conversionRate}%`, sub: `${stats.totalPayments} pagamentos / ${stats.totalConsults} consultas`, color: "#f59e0b" },
    { label: "Receita Est. Mensal", value: brl(stats.monthlyRevenue), sub: "baseado nos planos ativos", color: "#34d399" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 12 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: "#111827", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.3)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 10 }}>{c.label}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: c.color, lineHeight: 1 }}>{c.value}</div>
            {c.sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: 6 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Últimos cadastros */}
        <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18 }}>Últimos cadastros</div>
          {stats.recentUsers.length === 0
            ? <p style={{ fontSize: 13, color: "rgba(255,255,255,.25)" }}>Nenhum cadastro ainda.</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {stats.recentUsers.map(u => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>{fmt(u.createdAt)}</div>
                      {u.plan && <div style={{ fontSize: 11, color: "#818cf8", marginTop: 2 }}>{u.plan.name}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Atividade recente */}
        <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18 }}>Atividade recente</div>
          {stats.recentLogs.length === 0
            ? <p style={{ fontSize: 13, color: "rgba(255,255,255,.25)" }}>Nenhuma atividade ainda.</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {stats.recentLogs.map(l => (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, flexShrink: 0,
                      background: l.event === "PAGAMENTO_CONCLUIDO" ? "rgba(34,197,94,.12)" : "rgba(99,102,241,.12)",
                      color: l.event === "PAGAMENTO_CONCLUIDO" ? "#4ade80" : "#818cf8",
                    }}>
                      {l.event === "PAGAMENTO_CONCLUIDO" ? "PAGO" : "CONSULTA"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name}</div>
                      {l.campaign && <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)" }}>{l.campaign.name}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", flexShrink: 0 }}>{fmtDT(l.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// ── Clientes Tab ─────────────────────────────────────────────────────────────
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
    await fetch(`/api/dev/users/${u.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    onReload();
  }

  function openManage(u: User) {
    setManaging(u);
    setNewPlanId(u.planId ?? "");
    setNewExpiry(u.planExpiresAt ? u.planExpiresAt.slice(0, 10) : "");
  }

  function extendDays(days: number) {
    if (!managing) return;
    const base = managing.planExpiresAt && new Date(managing.planExpiresAt) > new Date()
      ? new Date(managing.planExpiresAt) : new Date();
    base.setDate(base.getDate() + days);
    setNewExpiry(base.toISOString().slice(0, 10));
  }

  async function savePlanChange() {
    if (!managing) return;
    setSaving(true);
    const body: Record<string, unknown> = {};
    if (newPlanId !== "") body.planId = newPlanId;
    else body.planId = null;
    if (newExpiry) body.planExpiresAt = new Date(newExpiry + "T23:59:59").toISOString();
    else body.planExpiresAt = null;
    await fetch(`/api/dev/users/${managing.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setManaging(null);
    onReload();
  }

  const filterBtns = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Ativos" },
    { key: "expired", label: "Expirados" },
    { key: "blocked", label: "Bloqueados" },
  ] as const;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
        <input placeholder="Buscar por nome ou e-mail..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputSt, width: 280, flex: "none" }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {filterBtns.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: "7px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
              background: filter === f.key ? "rgba(99,102,241,.15)" : "rgba(255,255,255,.04)",
              border: filter === f.key ? "1px solid rgba(99,102,241,.4)" : "1px solid rgba(255,255,255,.08)",
              color: filter === f.key ? "#818cf8" : "rgba(255,255,255,.4)",
            }}>
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "rgba(255,255,255,.3)" }}>
          {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <Th>Cliente</Th><Th>Plano</Th><Th>Campanhas</Th><Th>Vencimento</Th><Th>Restam</Th><Th>Status</Th><Th>Ações</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => {
              const active = isActive(u);
              const days = daysLeft(u.planExpiresAt);
              return (
                <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>{u.email}</div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13 }}>
                    {u.plan ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.plan.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>{brl(u.plan.price)} / {durationLabel(u.plan.durationDays)}</div>
                      </div>
                    ) : <span style={{ color: "rgba(255,255,255,.2)", fontSize: 12 }}>Sem plano</span>}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "rgba(255,255,255,.5)" }}>
                    {u._count.campaigns}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: active ? "rgba(255,255,255,.5)" : "#f87171" }}>
                    {u.planExpiresAt ? fmt(u.planExpiresAt) : "—"}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13 }}>
                    {days !== null ? (
                      <span style={{ color: days > 7 ? "#4ade80" : days > 0 ? "#f59e0b" : "#f87171", fontWeight: 600 }}>
                        {days > 0 ? `${days}d` : "Expirado"}
                      </span>
                    ) : <span style={{ color: "rgba(255,255,255,.2)" }}>—</span>}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {!u.active
                      ? <Badge ok={false} labels={["Ativo", "Bloqueado"]} />
                      : <Badge ok={active} labels={["Ativo", "Expirado"]} />}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openManage(u)} style={{
                        padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                        fontFamily: "inherit", cursor: "pointer",
                        background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", color: "#818cf8",
                      }}>Gerenciar</button>
                      <button onClick={() => toggleBlock(u)} style={{
                        padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                        fontFamily: "inherit", cursor: "pointer",
                        background: u.active ? "rgba(239,68,68,.08)" : "rgba(34,197,94,.08)",
                        border: u.active ? "1px solid rgba(239,68,68,.2)" : "1px solid rgba(34,197,94,.2)",
                        color: u.active ? "#f87171" : "#4ade80",
                      }}>
                        {u.active ? "Bloquear" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,.2)", fontSize: 14 }}>
            {search || filter !== "all" ? "Nenhum resultado encontrado." : "Nenhum cliente cadastrado ainda."}
          </p>
        )}
      </div>

      {/* Modal Gerenciar */}
      {managing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: "32px", width: "100%", maxWidth: 460 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>
                {managing.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{managing.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{managing.email}</div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>Plano</label>
                <select value={newPlanId}
                  onChange={e => setNewPlanId(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{ ...inputSt, appearance: "none" as const }}>
                  <option value="">Sem plano</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {brl(p.price)} ({durationLabel(p.durationDays)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>Validade do plano</label>
                <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)} style={inputSt} />
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  {[7, 15, 30, 90].map(d => (
                    <button key={d} onClick={() => extendDays(d)} style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      fontFamily: "inherit", cursor: "pointer",
                      background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", color: "#818cf8",
                    }}>+{d}d</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: 6 }}>
                  Extensão a partir do {managing.planExpiresAt && new Date(managing.planExpiresAt) > new Date() ? "vencimento atual" : "dia de hoje"}
                </div>
              </div>

              {/* Info atual */}
              {managing.planExpiresAt && (
                <div style={{ padding: "10px 14px", background: "rgba(255,255,255,.03)", borderRadius: 9, border: "1px solid rgba(255,255,255,.07)", fontSize: 12, color: "rgba(255,255,255,.45)" }}>
                  Vencimento atual: <strong style={{ color: "#f8fafc" }}>{fmt(managing.planExpiresAt)}</strong>
                  {" · "}
                  {daysLeft(managing.planExpiresAt) !== null && (
                    daysLeft(managing.planExpiresAt)! > 0
                      ? <span style={{ color: "#4ade80" }}>{daysLeft(managing.planExpiresAt)} dias restantes</span>
                      : <span style={{ color: "#f87171" }}>Expirado</span>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setManaging(null)} style={btnSecondary}>Cancelar</button>
              <button onClick={savePlanChange} disabled={saving} style={btnPrimary}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Campanhas Tab ─────────────────────────────────────────────────────────────
function CampanhasTab({ campaigns }: { campaigns: Campaign[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const filtered = campaigns.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.user.name.toLowerCase().includes(q) ||
      c.user.email.toLowerCase().includes(q);
    const matchStatus =
      filterStatus === "all" ? true :
      filterStatus === "active" ? c.active : !c.active;
    return matchSearch && matchStatus;
  });

  const totalDebtors = filtered.reduce((s, c) => s + c._count.debtors, 0);
  const totalPayments = filtered.reduce((s, c) => s + c.paymentsCount, 0);
  const totalConsults = filtered.reduce((s, c) => s + c._count.logs, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
        <input placeholder="Buscar por campanha, slug ou cliente..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ ...inputSt, width: 320, flex: "none" }} />
        {(["all", "active", "inactive"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding: "7px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            fontFamily: "inherit", cursor: "pointer",
            background: filterStatus === s ? "rgba(99,102,241,.15)" : "rgba(255,255,255,.04)",
            border: filterStatus === s ? "1px solid rgba(99,102,241,.4)" : "1px solid rgba(255,255,255,.08)",
            color: filterStatus === s ? "#818cf8" : "rgba(255,255,255,.4)",
          }}>
            {s === "all" ? "Todas" : s === "active" ? "Ativas" : "Inativas"} ({
              s === "all" ? campaigns.length :
              s === "active" ? campaigns.filter(c => c.active).length :
              campaigns.filter(c => !c.active).length
            })
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,.35)" }}>
          <span>Devedores: <strong style={{ color: "#f8fafc" }}>{totalDebtors.toLocaleString("pt-BR")}</strong></span>
          <span>Consultas: <strong style={{ color: "#818cf8" }}>{totalConsults.toLocaleString("pt-BR")}</strong></span>
          <span>Pagamentos: <strong style={{ color: "#4ade80" }}>{totalPayments.toLocaleString("pt-BR")}</strong></span>
        </div>
      </div>

      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <Th>Campanha</Th><Th>Cliente</Th><Th>Devedores</Th><Th>Consultas</Th><Th>Pagamentos</Th><Th>Conv.</Th><Th>Status</Th><Th>Criada</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const conv = c._count.logs > 0 ? ((c.paymentsCount / c._count.logs) * 100).toFixed(1) : "0.0";
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.3)", fontFamily: "monospace" }}>
                      /c/{c.slug}
                      {c.customDomain && <span style={{ color: "#818cf8", marginLeft: 6 }}>{c.customDomain}</span>}
                    </div>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.user.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>{c.user.email}</div>
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "rgba(255,255,255,.6)" }}>
                    {c._count.debtors.toLocaleString("pt-BR")}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#818cf8" }}>
                    {c._count.logs.toLocaleString("pt-BR")}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: "#4ade80" }}>
                    {c.paymentsCount.toLocaleString("pt-BR")}
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 13 }}>
                    <span style={{ color: parseFloat(conv) >= 10 ? "#4ade80" : parseFloat(conv) >= 3 ? "#f59e0b" : "rgba(255,255,255,.4)", fontWeight: 600 }}>
                      {conv}%
                    </span>
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <Badge ok={c.active} />
                  </td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: "rgba(255,255,255,.35)" }}>
                    {fmt(c.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,.2)", fontSize: 14 }}>
            {search ? "Nenhum resultado encontrado." : "Nenhuma campanha criada ainda."}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Logs Tab ─────────────────────────────────────────────────────────────────
function LogsTab() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<"" | "CONSULTA" | "PAGAMENTO_CONCLUIDO">("");

  const load = useCallback(async (p: number, ev: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (ev) params.set("event", ev);
    const r = await fetch(`/api/dev/logs?${params}`);
    const d = await r.json();
    setLogs(d.logs ?? []);
    setPage(d.page ?? 1);
    setPages(d.pages ?? 1);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, []);

  useEffect(() => { load(1, event); }, [load, event]);

  const eventFilters = [
    { val: "" as const, label: "Todos" },
    { val: "CONSULTA" as const, label: "Consultas" },
    { val: "PAGAMENTO_CONCLUIDO" as const, label: "Pagamentos" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,.4)" }}>
          {total.toLocaleString("pt-BR")} evento{total !== 1 ? "s" : ""} {event === "CONSULTA" ? "de consulta" : event === "PAGAMENTO_CONCLUIDO" ? "de pagamento" : "no total"}
        </span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          {eventFilters.map(f => (
            <button key={f.val} onClick={() => setEvent(f.val)} style={{
              padding: "7px 13px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              fontFamily: "inherit", cursor: "pointer",
              background: event === f.val ? "rgba(99,102,241,.15)" : "rgba(255,255,255,.04)",
              border: event === f.val ? "1px solid rgba(99,102,241,.4)" : "1px solid rgba(255,255,255,.08)",
              color: event === f.val ? "#818cf8" : "rgba(255,255,255,.4)",
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
              <Th>Evento</Th><Th>Nome</Th><Th>CPF</Th><Th>Campanha</Th><Th>Cliente</Th><Th>Local</Th><Th>Data</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.25)", fontSize: 14 }}>Carregando...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,.2)", fontSize: 14 }}>Nenhum log encontrado.</td></tr>
            ) : logs.map(l => (
              <tr key={l.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                <td style={{ padding: "11px 16px" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: l.event === "PAGAMENTO_CONCLUIDO" ? "rgba(34,197,94,.12)" : "rgba(99,102,241,.12)",
                    color: l.event === "PAGAMENTO_CONCLUIDO" ? "#4ade80" : "#818cf8",
                  }}>
                    {l.event === "PAGAMENTO_CONCLUIDO" ? "PAGO" : "CONSULTA"}
                  </span>
                </td>
                <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 500 }}>{l.name}</td>
                <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,.4)", fontFamily: "monospace" }}>{l.cpf}</td>
                <td style={{ padding: "11px 16px", fontSize: 13 }}>{l.campaign?.name ?? "—"}</td>
                <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                  {l.campaign?.user?.name ?? "—"}
                </td>
                <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                  {l.city && l.state ? `${l.city}, ${l.state}` : (l.ip || "—")}
                </td>
                <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,.35)" }}>
                  {fmtDT(l.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 16 }}>
          <button onClick={() => load(page - 1, event)} disabled={page <= 1} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 12, fontFamily: "inherit",
            cursor: page > 1 ? "pointer" : "not-allowed",
            background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
            color: "rgba(255,255,255,.5)", opacity: page <= 1 ? 0.35 : 1,
          }}>← Anterior</button>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)", padding: "0 8px" }}>
            Página {page} de {pages}
          </span>
          <button onClick={() => load(page + 1, event)} disabled={page >= pages} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 12, fontFamily: "inherit",
            cursor: page < pages ? "pointer" : "not-allowed",
            background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
            color: "rgba(255,255,255,.5)", opacity: page >= pages ? 0.35 : 1,
          }}>Próxima →</button>
        </div>
      )}
    </div>
  );
}

// ── Planos Tab ────────────────────────────────────────────────────────────────
function PlanosTab({ plans, onReload }: { plans: Plan[]; onReload: () => void }) {
  const [editPlan, setEditPlan] = useState<(Plan | Omit<Plan, "id">) | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Plan | null>(null);

  async function savePlan() {
    setSaving(true);
    const isEdit = editPlan && "id" in editPlan;
    const url = isEdit ? `/api/dev/plans/${(editPlan as Plan).id}` : "/api/dev/plans";
    await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editPlan),
    });
    setEditPlan(null);
    setSaving(false);
    onReload();
  }

  async function doDelete(plan: Plan) {
    await fetch(`/api/dev/plans/${plan.id}`, { method: "DELETE" });
    setConfirmDelete(null);
    onReload();
  }

  const inputSm: React.CSSProperties = {
    ...inputSt, padding: "10px 14px", fontSize: 14,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button onClick={() => setEditPlan(EMPTY_PLAN)} style={{
          padding: "10px 20px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700,
          fontFamily: "inherit", cursor: "pointer",
        }}>+ Novo plano</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {plans.map(plan => (
          <div key={plan.id} style={{ background: "#111827", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 3 }}>
                  {durationLabel(plan.durationDays)}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>{plan.name}</h3>
              </div>
              <Badge ok={plan.active} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 10 }}>
              {brl(plan.price)}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14, fontSize: 13, color: "rgba(255,255,255,.45)" }}>
              <span>{plan.maxCampaigns} campanha{plan.maxCampaigns !== 1 ? "s" : ""}</span>
              <span>{plan.maxDebtors.toLocaleString("pt-BR")} devedores</span>
              <span>{plan.durationDays} dias de acesso</span>
            </div>
            {plan._count !== undefined && (
              <div style={{ fontSize: 12, color: "#818cf8", marginBottom: 16, fontWeight: 600 }}>
                {plan._count.users} assinante{plan._count.users !== 1 ? "s" : ""}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setEditPlan(plan)} style={{
                flex: 1, padding: "8px", borderRadius: 8,
                background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)",
                color: "#818cf8", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
              }}>Editar</button>
              <button onClick={() => setConfirmDelete(plan)} style={{
                padding: "8px 12px", borderRadius: 8,
                background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.18)",
                color: "#f87171", fontSize: 13, fontFamily: "inherit", cursor: "pointer",
              }}>✕</button>
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <p style={{ color: "rgba(255,255,255,.2)", fontSize: 14 }}>Nenhum plano criado ainda.</p>
        )}
      </div>

      {/* Modal editar/criar */}
      {editPlan && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: "32px", width: "100%", maxWidth: 480 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>
              {"id" in editPlan ? "Editar plano" : "Novo plano"}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {([
                { label: "Nome do plano", key: "name", type: "text" },
                { label: "Preço (R$)", key: "price", type: "number" },
                { label: "Duração (dias)", key: "durationDays", type: "number" },
                { label: "Máx. campanhas", key: "maxCampaigns", type: "number" },
                { label: "Máx. devedores", key: "maxDebtors", type: "number" },
                { label: "URL de checkout", key: "checkoutUrl", type: "text" },
              ] as { label: string; key: string; type: string }[]).map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>{f.label}</label>
                  <input type={f.type}
                    value={(editPlan as Record<string, unknown>)[f.key] as string}
                    onChange={e => setEditPlan(p => ({ ...p!, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                    style={inputSm} />
                </div>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,.6)", cursor: "pointer" }}>
                <input type="checkbox" checked={(editPlan as Plan).active ?? true}
                  onChange={e => setEditPlan(p => ({ ...p!, active: e.target.checked }))} />
                Plano ativo (visível para clientes)
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setEditPlan(null)} style={btnSecondary}>Cancelar</button>
              <button onClick={savePlan} disabled={saving} style={btnPrimary}>
                {saving ? "Salvando..." : "Salvar plano"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar delete */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(239,68,68,.2)", borderRadius: 20, padding: "32px", width: "100%", maxWidth: 400 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>Excluir plano?</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginBottom: 24 }}>
              O plano <strong style={{ color: "#f8fafc" }}>{confirmDelete.name}</strong> será excluído permanentemente.
              {confirmDelete._count?.users ? ` ${confirmDelete._count.users} usuário(s) utilizam este plano.` : ""}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDelete(null)} style={btnSecondary}>Cancelar</button>
              <button onClick={() => doDelete(confirmDelete)} style={{
                ...btnPrimary,
                background: "linear-gradient(135deg,#ef4444,#dc2626)",
              }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Webhook Tab ───────────────────────────────────────────────────────────────
interface Activation {
  id: number; name: string; email: string;
  planExpiresAt: string; updatedAt: string;
  plan: { name: string } | null;
}

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
      const [sRes, pRes] = await Promise.all([
        fetch("/api/dev/settings"),
        fetch("/api/dev/plans"),
      ]);
      const s = await sRes.json();
      const p = await pRes.json();
      setSecret(s.planWebhookSecret ?? "");
      setSavedSecret(s.planWebhookSecret ?? "");
      setActivations(s.recentActivations ?? []);
      if (Array.isArray(p)) setPlans(p.map((pl: { id: number; name: string }) => ({ id: pl.id, name: pl.name })));
      setLoading(false);
    }
    load();
  }, []);

  function generateSecret() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const arr = Array.from({ length: 40 }, () => chars[Math.floor(Math.random() * chars.length)]);
    setSecret(arr.join(""));
  }

  async function saveSecret() {
    setSaving(true);
    await fetch("/api/dev/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planWebhookSecret: secret }),
    });
    setSavedSecret(secret);
    setSaving(false);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  async function testWebhook() {
    if (!testEmail || !testPlanId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/webhook/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: testEmail, planId: Number(testPlanId), secret: savedSecret }),
      });
      const d = await res.json();
      if (res.ok) {
        setTestResult({ ok: true, msg: `Plano "${d.plan?.name}" ativado para ${d.user?.name}. Expira em ${new Date(d.planExpiresAt).toLocaleDateString("pt-BR")}.` });
        // Recarrega ativações
        const s = await fetch("/api/dev/settings").then(r => r.json());
        setActivations(s.recentActivations ?? []);
      } else {
        setTestResult({ ok: false, msg: d.error ?? "Erro desconhecido." });
      }
    } catch {
      setTestResult({ ok: false, msg: "Falha na conexão." });
    }
    setTesting(false);
  }

  const CopyBtn = ({ text, k }: { text: string; k: string }) => (
    <button onClick={() => copy(text, k)} style={{
      padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
      fontFamily: "inherit", cursor: "pointer", flexShrink: 0,
      background: copied === k ? "rgba(34,197,94,.15)" : "rgba(255,255,255,.07)",
      border: copied === k ? "1px solid rgba(34,197,94,.3)" : "1px solid rgba(255,255,255,.1)",
      color: copied === k ? "#4ade80" : "rgba(255,255,255,.5)",
      transition: "all .2s",
    }}>
      {copied === k ? "Copiado!" : "Copiar"}
    </button>
  );

  const sectionTitle = (t: string) => (
    <div style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc", marginBottom: 14 }}>{t}</div>
  );

  const box = (children: React.ReactNode, extra?: React.CSSProperties) => (
    <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, padding: "22px 24px", ...extra }}>
      {children}
    </div>
  );

  if (loading) return <div style={{ color: "rgba(255,255,255,.3)", padding: 40, textAlign: "center" }}>Carregando...</div>;

  const webhookUrl = `${baseUrl}/api/webhook/plan`;
  const payloadExample = JSON.stringify({ email: "cliente@email.com", planId: 1, secret: savedSecret || "SEU_SECRET" }, null, 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 780 }}>

      {/* URL do Webhook */}
      {box(<>
        {sectionTitle("URL do Webhook")}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 14, lineHeight: 1.6 }}>
          Configure essa URL na sua plataforma de pagamento (Hotmart, Kiwify, PerfectPay, etc.)
          para que o plano seja liberado automaticamente após a compra.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <code style={{
            flex: 1, padding: "10px 14px", background: "rgba(255,255,255,.04)",
            border: "1px solid rgba(255,255,255,.1)", borderRadius: 9,
            fontSize: 13, color: "#818cf8", fontFamily: "monospace", wordBreak: "break-all",
          }}>
            {webhookUrl}
          </code>
          <CopyBtn text={webhookUrl} k="url" />
        </div>
      </>)}

      {/* Secret */}
      {box(<>
        {sectionTitle("Secret de Autenticação")}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 14, lineHeight: 1.6 }}>
          O secret garante que só a sua plataforma de pagamento consegue ativar planos.
          Se estiver vazio, o webhook aceita qualquer requisição (não recomendado).
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={secret}
            onChange={e => setSecret(e.target.value)}
            placeholder="Cole ou gere um secret seguro..."
            style={{ ...inputSt, fontFamily: "monospace", fontSize: 13 }}
          />
          <CopyBtn text={secret} k="secret" />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={generateSecret} style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            fontFamily: "inherit", cursor: "pointer",
            background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.25)", color: "#818cf8",
          }}>
            Gerar novo secret
          </button>
          <button onClick={saveSecret} disabled={saving || secret === savedSecret} style={{
            ...btnPrimary, padding: "8px 20px", fontSize: 12,
            opacity: saving || secret === savedSecret ? 0.5 : 1,
            cursor: saving || secret === savedSecret ? "not-allowed" : "pointer",
          }}>
            {saving ? "Salvando..." : secret === savedSecret ? "Salvo" : "Salvar secret"}
          </button>
        </div>
        {savedSecret && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.15)", borderRadius: 8, fontSize: 12, color: "#4ade80" }}>
            Secret ativo configurado
          </div>
        )}
        {!savedSecret && (
          <div style={{ marginTop: 12, padding: "8px 12px", background: "rgba(245,158,11,.06)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 8, fontSize: 12, color: "#f59e0b" }}>
            Nenhum secret configurado — o webhook está aberto para qualquer requisição.
          </div>
        )}
      </>)}

      {/* Formato do Payload */}
      {box(<>
        {sectionTitle("Formato do Payload (POST JSON)")}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 14, lineHeight: 1.6 }}>
          A plataforma de pagamento deve enviar um POST com este JSON. O <code style={{ color: "#818cf8", background: "rgba(99,102,241,.1)", padding: "1px 6px", borderRadius: 4 }}>planId</code> corresponde ao ID do plano cadastrado no painel.
        </p>
        <div style={{ position: "relative" }}>
          <pre style={{
            padding: "16px 18px", background: "rgba(0,0,0,.3)",
            border: "1px solid rgba(255,255,255,.08)", borderRadius: 10,
            fontSize: 13, color: "#94a3b8", fontFamily: "monospace",
            lineHeight: 1.7, overflowX: "auto", margin: 0,
          }}>
            {payloadExample}
          </pre>
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <CopyBtn text={payloadExample} k="payload" />
          </div>
        </div>
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.35)", lineHeight: 1.6 }}>
            <strong style={{ color: "rgba(255,255,255,.6)" }}>email</strong> — e-mail do cliente cadastrado na plataforma<br />
            <strong style={{ color: "rgba(255,255,255,.6)" }}>planId</strong> — ID do plano{plans.length > 0 && ` (${plans.map(p => `${p.id}=${p.name}`).join(", ")})`}<br />
            <strong style={{ color: "rgba(255,255,255,.6)" }}>secret</strong> — deve bater com o secret configurado acima
          </div>
        </div>
      </>)}

      {/* Testar Webhook */}
      {box(<>
        {sectionTitle("Testar Ativação Manual")}
        <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 16, lineHeight: 1.6 }}>
          Simula uma ativação de plano como se fosse uma notificação da plataforma de pagamento.
          Use para testar antes de configurar em produção.
        </p>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>E-mail do cliente</label>
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)}
              placeholder="cliente@email.com" style={inputSt} />
          </div>
          <div style={{ width: 200, flexShrink: 0 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>Plano</label>
            <select value={testPlanId} onChange={e => setTestPlanId(e.target.value)}
              style={{ ...inputSt, appearance: "none" as const }}>
              <option value="">Selecionar...</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>
        <button onClick={testWebhook} disabled={testing || !testEmail || !testPlanId} style={{
          ...btnPrimary, opacity: testing || !testEmail || !testPlanId ? 0.5 : 1,
          cursor: testing || !testEmail || !testPlanId ? "not-allowed" : "pointer",
        }}>
          {testing ? "Enviando..." : "Ativar plano agora"}
        </button>
        {testResult && (
          <div style={{
            marginTop: 14, padding: "12px 16px", borderRadius: 10, fontSize: 13,
            background: testResult.ok ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)",
            border: testResult.ok ? "1px solid rgba(34,197,94,.2)" : "1px solid rgba(239,68,68,.2)",
            color: testResult.ok ? "#4ade80" : "#f87171",
          }}>
            {testResult.msg}
          </div>
        )}
      </>)}

      {/* Ativações Recentes */}
      {box(<>
        {sectionTitle("Últimas Ativações de Plano")}
        {activations.length === 0 ? (
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.25)" }}>Nenhuma ativação ainda.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <Th>Cliente</Th><Th>Plano</Th><Th>Expira em</Th><Th>Ativado em</Th>
              </tr>
            </thead>
            <tbody>
              {activations.map(a => (
                <tr key={a.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                  <td style={{ padding: "11px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)" }}>{a.email}</div>
                  </td>
                  <td style={{ padding: "11px 16px", fontSize: 13 }}>{a.plan?.name ?? "—"}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13, color: new Date(a.planExpiresAt) > new Date() ? "#4ade80" : "#f87171" }}>
                    {fmt(a.planExpiresAt)}
                  </td>
                  <td style={{ padding: "11px 16px", fontSize: 12, color: "rgba(255,255,255,.35)" }}>
                    {fmtDT(a.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>)}
    </div>
  );
}

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "overview",  label: "Overview",   icon: <IcoGrid /> },
  { key: "clientes",  label: "Clientes",   icon: <IcoUsers /> },
  { key: "campanhas", label: "Campanhas",  icon: <IcoMega /> },
  { key: "logs",      label: "Logs",       icon: <IcoList /> },
  { key: "planos",    label: "Planos",     icon: <IcoCard /> },
  { key: "webhook",   label: "Webhook",    icon: <IcoWebhook /> },
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
    const r = await fetch("/api/dev/plans");
    const d = await r.json();
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
    loadStats();
    loadUsers();
    loadPlans();
    loadCampaigns();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/dev/login");
  }

  const reloadAll = () => { loadStats(); loadUsers(); loadPlans(); loadCampaigns(); };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #09090b; }
        select option { background: #1e293b; color: #f8fafc; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#09090b", fontFamily: "Inter, system-ui, sans-serif", color: "#f8fafc", display: "flex" }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 220, flexShrink: 0,
          background: "#0c0c0f", borderRight: "1px solid rgba(255,255,255,.06)",
          display: "flex", flexDirection: "column",
          position: "sticky", top: 0, height: "100vh",
        }}>
          {/* Logo */}
          <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Logo" style={{ height: 48, objectFit: "contain" }} />
            <div style={{ marginTop: 8, fontSize: 10, fontWeight: 700, color: "#f87171", letterSpacing: ".1em", textTransform: "uppercase" }}>
              PAINEL DEV
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "10px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.2)", letterSpacing: ".1em", textTransform: "uppercase", padding: "4px 12px 8px" }}>
              Menu
            </div>
            {NAV.map(item => {
              const active = tab === item.key;
              return (
                <button key={item.key} onClick={() => setTab(item.key)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
                  borderRadius: 8, background: active ? "rgba(239,68,68,.1)" : "transparent",
                  border: "none", color: active ? "#f87171" : "rgba(255,255,255,.4)",
                  fontSize: 13.5, fontWeight: active ? 600 : 500,
                  fontFamily: "inherit", cursor: "pointer", textAlign: "left",
                  position: "relative", transition: "all .15s",
                }}>
                  <span style={{ opacity: active ? 1 : 0.6, color: active ? "#f87171" : "inherit" }}>
                    {item.icon}
                  </span>
                  {item.label}
                  {active && (
                    <span style={{
                      position: "absolute", left: 0, top: "20%", bottom: "20%",
                      width: 2.5, borderRadius: "0 2px 2px 0", background: "#ef4444",
                    }} />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: "10px 8px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
            <button onClick={reloadAll} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
              borderRadius: 8, background: "transparent", border: "none",
              color: "rgba(255,255,255,.3)", fontFamily: "inherit", fontSize: 13,
              cursor: "pointer", width: "100%",
            }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Atualizar dados
            </button>
            <button onClick={logout} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 12px",
              borderRadius: 8, background: "transparent", border: "none",
              color: "rgba(248,82,82,.5)", fontFamily: "inherit", fontSize: 13,
              cursor: "pointer", width: "100%",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,.07)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(248,82,82,.5)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              <IcoLogout /> Sair
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Topbar */}
          <header style={{
            height: 54, background: "rgba(12,12,15,.9)",
            borderBottom: "1px solid rgba(255,255,255,.06)",
            backdropFilter: "blur(20px)",
            display: "flex", alignItems: "center", padding: "0 28px",
            position: "sticky", top: 0, zIndex: 20, gap: 12,
          }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>DEV</span>
            <span style={{ color: "rgba(255,255,255,.18)" }}>›</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>
              {NAV.find(n => n.key === tab)?.label}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 8, background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.14)", fontSize: 11, fontWeight: 600, color: "#4ade80" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite" }} />
              Online
            </div>
          </header>

          {/* Content */}
          <main style={{ flex: 1, padding: "28px 28px", overflowY: "auto" }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>
                {NAV.find(n => n.key === tab)?.label}
              </h1>
              {tab === "clientes" && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginTop: 4 }}>
                  {users.length} cliente{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}
                </p>
              )}
              {tab === "campanhas" && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginTop: 4 }}>
                  {campaigns.length} campanha{campaigns.length !== 1 ? "s" : ""} no total
                </p>
              )}
              {tab === "planos" && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginTop: 4 }}>
                  Configure os planos disponíveis para os clientes
                </p>
              )}
              {tab === "webhook" && (
                <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)", marginTop: 4 }}>
                  Configure a integração com sua plataforma de pagamento para ativar planos automaticamente
                </p>
              )}
            </div>

            {tab === "overview"  && <OverviewTab stats={stats} />}
            {tab === "clientes"  && <ClientesTab users={users} plans={plans} onReload={() => { loadUsers(); loadStats(); }} />}
            {tab === "campanhas" && <CampanhasTab campaigns={campaigns} />}
            {tab === "logs"      && <LogsTab />}
            {tab === "planos"    && <PlanosTab plans={plans} onReload={() => { loadPlans(); loadStats(); }} />}
            {tab === "webhook"   && <WebhookTab />}
          </main>
        </div>
      </div>
    </>
  );
}
