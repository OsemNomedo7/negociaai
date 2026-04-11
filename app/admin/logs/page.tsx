"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Log {
  id: number; name: string; cpf: string; event: string;
  ip: string | null; city: string | null; state: string | null; createdAt: string;
  debtor: { name: string } | null;
}

const EV_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  CONSULTA:            { bg: "rgba(99,102,241,0.1)",  color: "#6366f1", icon: "👁️" },
  CLIQUE_PAGAMENTO:    { bg: "rgba(245,158,11,0.1)",  color: "#d97706", icon: "💳" },
  PAGAMENTO_CONCLUIDO: { bg: "rgba(16,185,129,0.1)",  color: "#059669", icon: "✅" },
};

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [event, setEvent] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: "50" });
      if (event) p.set("event", event);
      const res = await fetch(`/api/admin/logs?${p}`);
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setLogs(data.logs || []); setTotal(data.total || 0);
      setSelected(new Set());
    } catch {
      setLogs([]); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, event, router]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 50);
  const dt = (d: string) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  const allOnPageSelected = logs.length > 0 && logs.every(l => selected.has(l.id));

  function toggleAll() {
    if (allOnPageSelected) {
      setSelected(prev => { const n = new Set(prev); logs.forEach(l => n.delete(l.id)); return n; });
    } else {
      setSelected(prev => { const n = new Set(prev); logs.forEach(l => n.add(l.id)); return n; });
    }
  }

  function toggleOne(id: number) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function deleteSelected() {
    if (selected.size === 0 || deleting) return;
    setDeleting(true);
    await fetch("/api/admin/logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    await load();
    setDeleting(false);
  }

  async function deleteAll() {
    setDeleting(true);
    setConfirmAll(false);
    await fetch("/api/admin/logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setPage(1);
    await load();
    setDeleting(false);
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Logs & Tracking</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{total} eventos registrados</p>
        </div>
        <button onClick={() => setConfirmAll(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:border-red-400 hover:text-red-500"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "var(--surface)" }}>
          🗑️ Limpar todos
        </button>
      </div>

      {/* Confirm delete all */}
      {confirmAll && (
        <div className="rounded-xl border p-4 flex items-center justify-between gap-4"
          style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)" }}>
          <p className="text-sm font-semibold" style={{ color: "#ef4444" }}>
            ⚠️ Apagar <strong>todos os {total} logs</strong>? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setConfirmAll(false)}
              className="px-3 py-1.5 text-xs rounded-lg border font-semibold"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>Cancelar</button>
            <button onClick={deleteAll} disabled={deleting}
              className="px-3 py-1.5 text-xs rounded-lg font-semibold text-white disabled:opacity-50"
              style={{ background: "#ef4444" }}>
              {deleting ? "Apagando..." : "Confirmar"}
            </button>
          </div>
        </div>
      )}

      {/* Filtros + barra de seleção */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "", label: "Todos", icon: "◉" },
          { key: "CONSULTA", label: "Consultas", icon: "👁️" },
          { key: "CLIQUE_PAGAMENTO", label: "Cliques", icon: "💳" },
          { key: "PAGAMENTO_CONCLUIDO", label: "Pagamentos", icon: "✅" },
        ].map(f => (
          <button key={f.key} onClick={() => { setEvent(f.key); setPage(1); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all border"
            style={event === f.key
              ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white", borderColor: "transparent", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }
              : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <span>{f.icon}</span>{f.label}
          </button>
        ))}

        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {selected.size} selecionado{selected.size > 1 ? "s" : ""}
            </span>
            <button onClick={deleteSelected} disabled={deleting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "#ef4444" }}>
              🗑️ {deleting ? "Apagando..." : "Apagar selecionados"}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--border)", background: "rgba(99,102,241,0.04)" }}>
                <th className="px-4 py-3.5">
                  <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}
                    className="rounded cursor-pointer" style={{ accentColor: "#6366f1" }} />
                </th>
                {["Data/Hora", "Nome", "CPF", "Evento", "IP", "Localização", "Devedor"].map(h => (
                  <th key={h} className="px-4 py-3.5 text-xs font-bold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Carregando...</span>
                  </div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <p className="text-3xl mb-3">📋</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum log encontrado</p>
                </td></tr>
              ) : logs.map(log => {
                const ev = EV_STYLE[log.event] || { bg: "rgba(100,116,139,0.1)", color: "#64748b", icon: "•" };
                const isChecked = selected.has(log.id);
                return (
                  <tr key={log.id} className="border-b transition-colors"
                    style={{ borderColor: "var(--border)", background: isChecked ? "rgba(99,102,241,0.04)" : undefined }}>
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={isChecked} onChange={() => toggleOne(log.id)}
                        className="rounded cursor-pointer" style={{ accentColor: "#6366f1" }} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{dt(log.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{log.name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs px-2 py-1 rounded-lg"
                        style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>{log.cpf}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: ev.bg, color: ev.color }}>
                        <span>{ev.icon}</span>
                        {log.event.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{log.ip || "—"}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {log.city || log.state ? `${log.city || "—"}, ${log.state || "—"}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {log.debtor?.name || <span style={{ opacity: 0.4 }}>Padrão</span>}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t" style={{ borderColor: "var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40 hover:border-indigo-300 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}>← Anterior</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs rounded-lg border disabled:opacity-40 hover:border-indigo-300 transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}>Próxima →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
