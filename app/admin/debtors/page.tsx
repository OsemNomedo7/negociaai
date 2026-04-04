"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCPF } from "@/lib/cpf";

interface Debtor {
  id: number;
  name: string;
  cpf: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

const STATUSES = ["PENDENTE", "PAGO", "NEGOCIANDO", "CANCELADO"];

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "bg-orange-100 text-orange-700",
  PAGO: "bg-green-100 text-green-700",
  NEGOCIANDO: "bg-blue-100 text-blue-700",
  CANCELADO: "bg-gray-100 text-gray-500",
};

function formatMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const EMPTY_FORM = { name: "", cpf: "", amount: "", description: "", status: "PENDENTE" };

export default function DebtorsPage() {
  const router = useRouter();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Debtor | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15", search });
    const res = await fetch(`/api/admin/debtors?${params}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setDebtors(data.debtors || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search, router]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setModalOpen(true);
  }

  function openEdit(d: Debtor) {
    setEditing(d);
    setForm({
      name: d.name,
      cpf: d.cpf,
      amount: String(d.amount),
      description: d.description,
      status: d.status,
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    setError("");
    if (!form.name.trim() || !form.cpf || !form.amount) {
      setError("Preencha nome, CPF e valor.");
      return;
    }
    setSaving(true);
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/debtors/${editing.id}` : "/api/admin/debtors";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erro ao salvar.");
    } else {
      setModalOpen(false);
      load();
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este devedor?")) return;
    setDeleting(id);
    await fetch(`/api/admin/debtors/${id}`, { method: "DELETE" });
    setDeleting(null);
    load();
  }

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Devedores</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} registros encontrados</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition-opacity"
        >
          <span>+</span> Novo devedor
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por nome ou CPF..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 transition-colors text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Nome", "CPF", "Valor", "Desc. com 60%", "Descrição", "Status", "Ações"].map((h) => (
                  <th key={h} className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <svg className="animate-spin w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Carregando...
                  </td>
                </tr>
              ) : debtors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Nenhum devedor encontrado.
                  </td>
                </tr>
              ) : (
                debtors.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800 text-sm">{d.name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-gray-600">{d.cpf}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-gray-800 text-sm">{formatMoney(d.amount)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-green-600 text-sm">{formatMoney(d.amount * 0.4)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-gray-500 text-sm">{d.description}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[d.status] || "bg-gray-100 text-gray-500"}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(d)}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={deleting === d.id}
                          className="text-xs font-medium text-red-500 hover:text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40"
                        >
                          {deleting === d.id ? "..." : "Excluir"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                ← Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-black text-gray-800 text-lg">
                {editing ? "Editar devedor" : "Novo devedor"}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome completo *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 transition-colors text-sm"
                    placeholder="Nome do devedor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">CPF *</label>
                  <input
                    type="text"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: formatCPF(e.target.value) })}
                    maxLength={14}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 transition-colors text-sm"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Valor (R$) *</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 transition-colors text-sm"
                    placeholder="1200.00"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrição</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 transition-colors text-sm"
                    placeholder="Ex: Empréstimo pessoal"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 transition-colors text-sm"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
