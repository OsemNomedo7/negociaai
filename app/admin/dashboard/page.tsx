"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalLogs: number;
  consultations: number;
  clicks: number;
  payments: number;
  conversionRate: string;
  totalDebtors: number;
  estimatedRevenue: number;
  chartData: { date: string; count: number }[];
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-50">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-black text-gray-800">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function formatMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        return r.json();
      })
      .then((data) => { if (data) setStats(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Carregando...
        </div>
      </div>
    );
  }

  if (!stats) return <div className="text-red-500">Erro ao carregar dados.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Visão geral do sistema</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="👁️"
          label="Total de consultas"
          value={stats.consultations.toLocaleString("pt-BR")}
          color="bg-blue-50"
        />
        <StatCard
          icon="💳"
          label="Cliques em pagamento"
          value={stats.clicks.toLocaleString("pt-BR")}
          color="bg-indigo-50"
        />
        <StatCard
          icon="✅"
          label="Pagamentos"
          value={stats.payments.toLocaleString("pt-BR")}
          color="bg-green-50"
        />
        <StatCard
          icon="📈"
          label="Taxa de conversão"
          value={`${stats.conversionRate}%`}
          color="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="👥"
          label="Devedores cadastrados"
          value={stats.totalDebtors.toLocaleString("pt-BR")}
          color="bg-orange-50"
        />
        <StatCard
          icon="💰"
          label="Receita estimada"
          value={formatMoney(stats.estimatedRevenue)}
          sub="Base em pagamentos registrados"
          color="bg-emerald-50"
        />
        <StatCard
          icon="📋"
          label="Total de eventos"
          value={stats.totalLogs.toLocaleString("pt-BR")}
          color="bg-gray-50"
        />
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white card-shadow">
          <div className="text-2xl mb-2">🚀</div>
          <p className="text-2xl font-black">{stats.conversionRate}%</p>
          <p className="text-white/80 text-sm">Conversão geral</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <h2 className="font-bold text-gray-800 mb-1">Consultas nos últimos 7 dias</h2>
        <p className="text-gray-400 text-sm mb-5">Histórico de consultas diárias</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={stats.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: "13px" }}
              formatter={(v) => [v, "Consultas"]}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#colorCount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Funil */}
      <div className="bg-white rounded-2xl card-shadow p-6">
        <h2 className="font-bold text-gray-800 mb-4">Funil de conversão</h2>
        <div className="space-y-3">
          {[
            { label: "Consultas", value: stats.consultations, pct: 100, color: "bg-blue-500" },
            { label: "Cliques em pagamento", value: stats.clicks, pct: stats.consultations > 0 ? (stats.clicks / stats.consultations) * 100 : 0, color: "bg-indigo-500" },
            { label: "Pagamentos concluídos", value: stats.payments, pct: stats.consultations > 0 ? (stats.payments / stats.consultations) * 100 : 0, color: "bg-green-500" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-bold text-gray-800">
                  {item.value.toLocaleString("pt-BR")} ({item.pct.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                  style={{ width: `${Math.min(item.pct, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
