"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface Stats {
  totalLogs: number; consultations: number; clicks: number; payments: number;
  conversionRate: string; totalDebtors: number; estimatedRevenue: number;
  chartData: { date: string; count: number }[];
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function StatCard({ icon, label, value, sub, trend, color }: {
  icon: string; label: string; value: string | number;
  sub?: string; trend?: string; color: string;
}) {
  return (
    <div className="card relative overflow-hidden p-5 stat-card-line animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm"
          style={{ background: color + "18", border: `1px solid ${color}25` }}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs font-bold px-2 py-1 rounded-full"
            style={{ background: trend.startsWith("+") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                     color: trend.startsWith("+") ? "#10b981" : "#ef4444" }}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-black mb-0.5" style={{ color: "var(--text)" }}>{value}</p>
      <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => { if (r.status === 401) { router.push("/admin/login"); return null; } return r.json(); })
      .then(d => { if (d) setStats(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Carregando dados...</p>
      </div>
    </div>
  );

  if (!stats) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Visão geral em tempo real
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Dados ao vivo
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👁️" label="Consultas" value={stats.consultations.toLocaleString("pt-BR")} color="#6366f1" trend="+12%" />
        <StatCard icon="💳" label="Cliques em pagar" value={stats.clicks.toLocaleString("pt-BR")} color="#8b5cf6" trend="+8%" />
        <StatCard icon="✅" label="Pagamentos" value={stats.payments.toLocaleString("pt-BR")} color="#10b981" trend="+5%" />
        <StatCard icon="📈" label="Taxa de conversão" value={`${stats.conversionRate}%`} color="#f59e0b" sub="consultas → pagamentos" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="👥" label="Devedores" value={stats.totalDebtors.toLocaleString("pt-BR")} color="#06b6d4" />
        <StatCard icon="💰" label="Receita estimada" value={fmt(stats.estimatedRevenue)} sub="pagamentos registrados" color="#10b981" />
        <StatCard icon="📋" label="Total de eventos" value={stats.totalLogs.toLocaleString("pt-BR")} color="#64748b" />

        {/* Destaque */}
        <div className="card p-5 relative overflow-hidden" style={{
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          border: "none",
        }}>
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -left-4 w-20 h-20 rounded-full bg-white/8" />
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium mb-2">Conversão geral</p>
            <p className="text-4xl font-black text-white">{stats.conversionRate}%</p>
            <p className="text-white/60 text-xs mt-1">Meta: 5%</p>
            <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(parseFloat(stats.conversionRate) * 10, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Gráfico de área */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-sm" style={{ color: "var(--text)" }}>Consultas — últimos 7 dias</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Histórico diário de acessos</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-lg font-medium"
              style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>7d</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", fontSize: "12px", background: "var(--surface)", color: "var(--text)" }}
                formatter={(v: number) => [v, "Consultas"]} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#grad)" dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Funil */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-bold text-sm mb-5" style={{ color: "var(--text)" }}>Funil de conversão</h2>
          <div className="space-y-4">
            {[
              { l: "Consultas", v: stats.consultations, pct: 100, c: "#6366f1" },
              { l: "Clicaram em pagar", v: stats.clicks, pct: stats.consultations > 0 ? (stats.clicks / stats.consultations) * 100 : 0, c: "#8b5cf6" },
              { l: "Pagamentos", v: stats.payments, pct: stats.consultations > 0 ? (stats.payments / stats.consultations) * 100 : 0, c: "#10b981" },
            ].map(item => (
              <div key={item.l}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{item.l}</span>
                  <span className="text-xs font-bold" style={{ color: "var(--text)" }}>
                    {item.v} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({item.pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(item.pct, 100)}%`, background: item.c }} />
                </div>
              </div>
            ))}
          </div>

          {/* Bar chart mini */}
          <div className="mt-5 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <p className="text-xs font-medium mb-3" style={{ color: "var(--text-muted)" }}>Distribuição por dia</p>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} opacity={0.8} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
