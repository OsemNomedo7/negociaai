"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Log {
  id: number;
  name: string;
  cpf: string;
  event: string;
  ip: string | null;
  createdAt: string;
  debtor: { name: string } | null;
}

const EVENT_COLORS: Record<string, string> = {
  CONSULTA: "bg-blue-100 text-blue-700",
  CLIQUE_PAGAMENTO: "bg-yellow-100 text-yellow-700",
  PAGAMENTO_CONCLUIDO: "bg-green-100 text-green-700",
};

const EVENT_ICONS: Record<string, string> = {
  CONSULTA: "👁️",
  CLIQUE_PAGAMENTO: "💳",
  PAGAMENTO_CONCLUIDO: "✅",
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
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (event) params.set("event", event);
    const res = await fetch(`/api/admin/logs?${params}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setLogs(data.logs || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, event, router]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 50);

  function formatDate(d: string) {
    return new Date(d).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Logs e Tracking</h1>
        <p className="text-gray-500 text-sm mt-0.5">{total} eventos registrados</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {["", "CONSULTA", "CLIQUE_PAGAMENTO", "PAGAMENTO_CONCLUIDO"].map((e) => (
          <button
            key={e}
            onClick={() => { setEvent(e); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              event === e
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                : "bg-white border-2 border-gray-200 text-gray-600 hover:border-indigo-300"
            }`}
          >
            {e === "" ? "Todos" : (
              <span className="flex items-center gap-1.5">
                <span>{EVENT_ICONS[e]}</span>
                {e.replace(/_/g, " ")}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {["Data/Hora", "Nome consultado", "CPF", "Evento", "IP", "Devedor vinculado"].map((h) => (
                  <th key={h} className="text-left text-xs font-bold text-gray-500 uppercase tracking-wide px-5 py-3.5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <svg className="animate-spin w-6 h-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Carregando...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Nenhum log encontrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-500 font-mono">{formatDate(log.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-medium text-gray-800 text-sm">{log.name}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-gray-600">{log.cpf}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${EVENT_COLORS[log.event] || "bg-gray-100 text-gray-500"}`}>
                        <span>{EVENT_ICONS[log.event]}</span>
                        {log.event.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-400 font-mono">{log.ip || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-500">
                        {log.debtor ? log.debtor.name : <span className="text-gray-300">Padrão</span>}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
            <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                ← Anterior
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
