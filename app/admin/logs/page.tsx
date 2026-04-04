"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Log {
  id: number; name: string; cpf: string; event: string;
  ip: string | null; createdAt: string;
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

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "50" });
    if (event) p.set("event", event);
    const res = await fetch(`/api/admin/logs?${p}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setLogs(data.logs || []); setTotal(data.total || 0);
    setLoading(false);
  }, [page, event, router]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 50);
  const dt = (d: string) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Logs & Tracking</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{total} eventos registrados</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--border)", background: "rgba(99,102,241,0.04)" }}>
                {["Data/Hora", "Nome", "CPF", "Evento", "IP", "Devedor"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Carregando...</span>
                  </div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16">
                  <p className="text-3xl mb-3">📋</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhum log encontrado</p>
                </td></tr>
              ) : logs.map(log => {
                const ev = EV_STYLE[log.event] || { bg: "rgba(100,116,139,0.1)", color: "#64748b", icon: "•" };
                return (
                  <tr key={log.id} className="border-b transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{dt(log.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{log.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs px-2 py-1 rounded-lg"
                        style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>{log.cpf}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{ background: ev.bg, color: ev.color }}>
                        <span>{ev.icon}</span>
                        {log.event.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{log.ip || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
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
