"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Tab = "clientes" | "planos";

interface User {
  id: number; name: string; email: string; active: boolean; planActive: boolean;
  planExpiresAt: string | null; createdAt: string;
  plan: { name: string } | null;
  _count: { campaigns: number };
}

interface Plan {
  id: number; name: string; price: number; durationDays: number;
  maxCampaigns: number; maxDebtors: number; checkoutUrl: string; active: boolean;
}

const EMPTY_PLAN: Omit<Plan, "id"> = { name: "", price: 0, durationDays: 30, maxCampaigns: 3, maxDebtors: 1000, checkoutUrl: "", active: true };

export default function DevPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("clientes");
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editPlan, setEditPlan] = useState<(Plan | Omit<Plan, "id">) | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Caos Dívidas — Painel DEV";
    loadUsers(); loadPlans();
  }, []);

  async function loadUsers() {
    const r = await fetch("/api/dev/users");
    if (r.status === 401) { router.push("/dev/login"); return; }
    const d = await r.json();
    if (Array.isArray(d)) setUsers(d);
  }

  async function loadPlans() {
    const r = await fetch("/api/dev/plans");
    const d = await r.json();
    if (Array.isArray(d)) setPlans(d);
  }

  async function toggleUser(u: User) {
    await fetch(`/api/dev/users/${u.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !u.active }) });
    loadUsers();
  }

  async function savePlan() {
    setSaving(true);
    const isEdit = editPlan && "id" in editPlan;
    const url = isEdit ? `/api/dev/plans/${(editPlan as Plan).id}` : "/api/dev/plans";
    const method = isEdit ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editPlan) });
    setEditPlan(null); setSaving(false); loadPlans();
  }

  async function deletePlan(id: number) {
    if (!confirm("Excluir plano?")) return;
    await fetch(`/api/dev/plans/${id}`, { method: "DELETE" });
    loadPlans();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/dev/login");
  }

  const fmt = (v: string) => new Date(v).toLocaleDateString("pt-BR");
  const durationLabel = (d: number) => d === 1 ? "Diário" : d === 7 ? "Semanal" : d === 30 ? "Mensal" : `${d}d`;

  return (
    <div style={{ minHeight: "100vh", background: "#09090b", fontFamily: "Inter, system-ui, sans-serif", color: "#f8fafc" }}>
      {/* Sidebar */}
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <aside style={{ width: 220, background: "#111827", borderRight: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column", padding: "24px 16px", flexShrink: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Logo" style={{ height: 52, objectFit: "contain", marginBottom: 8 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: "#f87171", letterSpacing: ".1em", textAlign: "center", marginBottom: 32 }}>PAINEL DEV</div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            {([
              { key: "clientes", label: "Clientes", icon: "👥" },
              { key: "planos", label: "Planos", icon: "💳" },
            ] as { key: Tab; label: string; icon: string }[]).map(item => (
              <button key={item.key} onClick={() => setTab(item.key)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: tab === item.key ? "rgba(239,68,68,.1)" : "transparent", border: "none", color: tab === item.key ? "#f87171" : "rgba(255,255,255,.45)", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}>
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          <button onClick={logout} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 10, padding: "9px 14px", color: "rgba(255,255,255,.4)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
            Sair
          </button>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, padding: "36px 32px", overflowY: "auto" }}>

          {/* ── CLIENTES ── */}
          {tab === "clientes" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Clientes</h1>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)" }}>{users.length} cadastrado{users.length !== 1 ? "s" : ""}</p>
                </div>
              </div>

              <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                      {["Nome", "E-mail", "Plano", "Campanhas", "Expira em", "Status", "Ações"].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".06em", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)" }}>
                        <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "rgba(255,255,255,.5)" }}>{u.email}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13 }}>{u.plan?.name || <span style={{ color: "rgba(255,255,255,.25)" }}>—</span>}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "rgba(255,255,255,.5)" }}>{u._count.campaigns}</td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "rgba(255,255,255,.5)" }}>{u.planExpiresAt ? fmt(u.planExpiresAt) : "—"}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: u.planActive ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)", color: u.planActive ? "#4ade80" : "#f87171" }}>
                            {u.planActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <button onClick={() => toggleUser(u)}
                            style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", background: u.active ? "rgba(239,68,68,.1)" : "rgba(34,197,94,.1)", border: u.active ? "1px solid rgba(239,68,68,.2)" : "1px solid rgba(34,197,94,.2)", color: u.active ? "#f87171" : "#4ade80" }}>
                            {u.active ? "Bloquear" : "Desbloquear"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p style={{ textAlign: "center", padding: 32, color: "rgba(255,255,255,.2)", fontSize: 14 }}>Nenhum cliente cadastrado ainda.</p>
                )}
              </div>
            </div>
          )}

          {/* ── PLANOS ── */}
          {tab === "planos" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Planos</h1>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)" }}>Configure os planos disponíveis para os clientes</p>
                </div>
                <button onClick={() => setEditPlan(EMPTY_PLAN)}
                  style={{ padding: "10px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                  + Novo plano
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {plans.map(plan => (
                  <div key={plan.id} style={{ background: "#111827", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 4 }}>{durationLabel(plan.durationDays)}</div>
                        <h3 style={{ fontSize: 18, fontWeight: 800 }}>{plan.name}</h3>
                      </div>
                      <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: plan.active ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)", color: plan.active ? "#4ade80" : "#f87171" }}>
                        {plan.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>
                      R$ {plan.price.toFixed(2).replace(".", ",")}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20, fontSize: 13, color: "rgba(255,255,255,.45)" }}>
                      <span>{plan.maxCampaigns} campanhas</span>
                      <span>{plan.maxDebtors.toLocaleString("pt-BR")} devedores</span>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setEditPlan(plan)}
                        style={{ flex: 1, padding: "8px", borderRadius: 8, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.2)", color: "#818cf8", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                        Editar
                      </button>
                      <button onClick={() => deletePlan(plan.id)}
                        style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.18)", color: "#f87171", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
                {plans.length === 0 && (
                  <p style={{ color: "rgba(255,255,255,.2)", fontSize: 14 }}>Nenhum plano criado ainda.</p>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Modal edição de plano */}
      {editPlan && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(255,255,255,.1)", borderRadius: 20, padding: "32px", width: "100%", maxWidth: 480 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24 }}>{"id" in editPlan ? "Editar plano" : "Novo plano"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Nome do plano", key: "name", type: "text" },
                { label: "Preço (R$)", key: "price", type: "number" },
                { label: "Duração (dias)", key: "durationDays", type: "number" },
                { label: "Máx. campanhas", key: "maxCampaigns", type: "number" },
                { label: "Máx. devedores", key: "maxDebtors", type: "number" },
                { label: "URL de checkout", key: "checkoutUrl", type: "text" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.4)", marginBottom: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>{f.label}</label>
                  <input type={f.type} value={(editPlan as Record<string, unknown>)[f.key] as string}
                    onChange={e => setEditPlan(p => ({ ...p!, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, color: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
                </div>
              ))}
              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "rgba(255,255,255,.6)", cursor: "pointer" }}>
                <input type="checkbox" checked={(editPlan as Plan).active ?? true}
                  onChange={e => setEditPlan(p => ({ ...p!, active: e.target.checked }))} />
                Plano ativo (visível para clientes)
              </label>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
              <button onClick={() => setEditPlan(null)} style={{ padding: "9px 20px", borderRadius: 9, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={savePlan} disabled={saving} style={{ padding: "9px 20px", borderRadius: 9, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                {saving ? "Salvando..." : "Salvar plano"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
