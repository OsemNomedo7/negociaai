"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCPF } from "@/lib/cpf";

interface Debtor {
  id: number; name: string; cpf: string; amount: number;
  description: string; status: string; createdAt: string;
}

const STATUSES = ["PENDENTE", "PAGO", "NEGOCIANDO", "CANCELADO"];
const STATUS_STYLE: Record<string, string> = {
  PENDENTE:   "badge-pending",
  PAGO:       "badge-paid",
  NEGOCIANDO: "badge-nego",
  CANCELADO:  "badge-cancel",
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const EMPTY = { name: "", cpf: "", amount: "", description: "", status: "PENDENTE" };

export default function DebtorsPage() {
  const router = useRouter();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Debtor | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "15", search });
    const res = await fetch(`/api/admin/debtors?${p}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setDebtors(data.debtors || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, router]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(EMPTY); setError(""); setModalOpen(true); }
  function openEdit(d: Debtor) {
    setEditing(d);
    setForm({ name: d.name, cpf: d.cpf, amount: String(d.amount), description: d.description, status: d.status });
    setError(""); setModalOpen(true);
  }

  async function handleSave() {
    setError("");
    if (!form.name.trim() || !form.cpf || !form.amount) { setError("Preencha nome, CPF e valor."); return; }
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/debtors/${editing.id}` : "/api/admin/debtors";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form }) });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Erro ao salvar.");
    else { setModalOpen(false); load(); }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este devedor?")) return;
    setDeleting(id);
    await fetch(`/api/admin/debtors/${id}`, { method: "DELETE" });
    setDeleting(null); load();
  }

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Devedores</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{total} registros</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-glow-sm transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          <span className="text-base">+</span> Novo devedor
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input type="text" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nome ou CPF..."
          className="input-field pl-10 !py-2.5 text-sm" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--border)", background: "rgba(99,102,241,0.04)" }}>
                {["Nome", "CPF", "Valor original", "Com 60% off", "Descrição", "Status", "Ações"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Carregando...</span>
                  </div>
                </td></tr>
              ) : debtors.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <p className="text-3xl mb-3">📭</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum devedor encontrado</p>
                </td></tr>
              ) : debtors.map(d => (
                <tr key={d.id} className="border-b transition-colors" style={{ borderColor: "var(--border)" }}>
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{d.name}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
                      {d.cpf}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{fmt(d.amount)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-bold text-sm text-emerald-600">{fmt(d.amount * 0.4)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{d.description}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[d.status] || "badge-cancel"}`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(d)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(d.id)} disabled={deleting === d.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
                        {deleting === d.id ? "..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 hover:border-indigo-300"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}>← Anterior</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-40 hover:border-indigo-300"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}>Próxima →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl shadow-2xl animate-scale-in overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
            <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-black text-lg" style={{ color: "var(--text)" }}>
                {editing ? "Editar devedor" : "Novo devedor"}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Nome completo *</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input-field" placeholder="Nome do devedor" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>CPF *</label>
                  <input type="text" value={form.cpf}
                    onChange={e => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                    maxLength={14} className="input-field" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Valor (R$) *</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    min="0" step="0.01" className="input-field" placeholder="1200.00" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Descrição</label>
                  <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="input-field" placeholder="Ex: Empréstimo pessoal" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="input-field">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  <span>⚠️</span> {error}
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:opacity-70"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 shadow-glow-sm hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
