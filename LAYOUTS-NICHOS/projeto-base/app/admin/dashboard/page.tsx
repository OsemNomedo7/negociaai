"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

interface Stats {
  totalLogs: number; consultations: number; clicks: number; payments: number;
  conversionRate: string; totalDebtors: number; estimatedRevenue: number;
  chartData: { date: string; count: number }[];
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ── Animated number counter ───────────────────── */
function Counter({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const dur = 900;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{prefix}{val.toLocaleString("pt-BR")}{suffix}</>;
}

/* ── Stat card ─────────────────────────────────── */
function Stat({ label, value, icon, sub, accent = "#ef4444", trend }: {
  label: string; value: React.ReactNode; icon: React.ReactNode;
  sub?: string; accent?: string; trend?: string;
}) {
  return (
    <div className="dash-card" style={{
      background: "rgba(255,255,255,.028)",
      border: "1px solid rgba(255,255,255,.07)",
      borderRadius: 14, padding: "22px 24px",
      position: "relative", overflow: "hidden",
      transition: "border-color .2s, transform .2s",
    }}>
      {/* Top accent bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}, transparent)`,
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${accent}18`, border: `1px solid ${accent}28`,
          fontSize: 16,
        }}>{icon}</div>

        {trend && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
            background: trend.startsWith("+") ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
            color: trend.startsWith("+") ? "#4ade80" : "#f87171",
            border: `1px solid ${trend.startsWith("+") ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.2)"}`,
          }}>{trend}</span>
        )}
      </div>

      <div style={{ fontSize: 28, fontWeight: 800, color: "#f8fafc", letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "rgba(248,250,252,.4)", letterSpacing: ".02em" }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: "rgba(248,250,252,.22)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ── Tooltip ────────────────────────────────────── */
function ChartTip({ active, payload, label }: { active?: boolean; payload?: {value:number}[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#111115", border: "1px solid rgba(255,255,255,.1)",
      borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 8px 32px rgba(0,0,0,.5)", fontSize: 12,
    }}>
      <div style={{ color: "rgba(248,250,252,.4)", marginBottom: 4, fontSize: 11 }}>{label}</div>
      <div style={{ color: "#f8fafc", fontWeight: 700 }}>{payload[0].value} consultas</div>
    </div>
  );
}

/* ── Funnel bar ─────────────────────────────────── */
function FunnelBar({ label, value, total, color, icon }: {
  label: string; value: number; total: number; color: string; icon: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontSize: 13, color: "rgba(248,250,252,.6)", fontWeight: 500 }}>{label}</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc" }}>{value.toLocaleString("pt-BR")}</span>
          <span style={{ fontSize: 11, color: "rgba(248,250,252,.3)", marginLeft: 6 }}>{pct.toFixed(1)}%</span>
        </div>
      </div>
      <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${Math.min(pct, 100)}%`, borderRadius: 99,
          background: color, transition: "width 1.2s cubic-bezier(.16,1,.3,1)",
        }} />
      </div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [time,    setTime]    = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => { if (r.status === 401) { router.push("/admin/login"); return null; } return r.json(); })
      .then(d => { if (d) setStats(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("pt-BR"));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, flexDirection: "column", gap: 14 }}>
      <div className="animate-spin" style={{
        width: 32, height: 32, borderRadius: "50%",
        border: "2px solid rgba(239,68,68,.15)", borderTopColor: "#ef4444",
      }} />
      <span style={{ fontSize: 12, color: "rgba(248,250,252,.3)", letterSpacing: ".06em" }}>Carregando dados...</span>
    </div>
  );

  if (!stats) return null;

  const maxBar = Math.max(...stats.chartData.map(d => d.count), 1);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .dash-root * { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }

        /* ── Background animado fixo ── */
        .dash-bg-layer {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
        }
        .dash-orb {
          position: absolute; border-radius: 50%; filter: blur(100px);
        }
        @keyframes d-orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          25%  { transform: translate(60px,-80px) scale(1.1); }
          50%  { transform: translate(-40px,60px) scale(0.9); }
          75%  { transform: translate(80px,40px) scale(1.05); }
        }
        @keyframes d-orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%  { transform: translate(-80px,60px) scale(1.12); }
          66%  { transform: translate(50px,-40px) scale(0.88); }
        }
        @keyframes d-orb3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%  { transform: translate(70px,90px) scale(1.06); }
        }
        @keyframes d-orb4 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%  { transform: translate(-60px,-70px) scale(1.08); }
          80%  { transform: translate(40px,50px) scale(0.92); }
        }
        .dash-orb-1 { width:700px;height:700px;top:-20%;left:-15%;background:radial-gradient(circle,rgba(220,38,38,.1) 0%,transparent 70%);animation:d-orb1 20s ease-in-out infinite; }
        .dash-orb-2 { width:600px;height:600px;bottom:-20%;right:-10%;background:radial-gradient(circle,rgba(185,28,28,.08) 0%,transparent 70%);animation:d-orb2 25s ease-in-out infinite; }
        .dash-orb-3 { width:400px;height:400px;top:40%;right:20%;background:radial-gradient(circle,rgba(239,68,68,.06) 0%,transparent 70%);animation:d-orb3 17s ease-in-out infinite; }
        .dash-orb-4 { width:350px;height:350px;top:10%;left:40%;background:radial-gradient(circle,rgba(153,27,27,.07) 0%,transparent 70%);animation:d-orb4 22s ease-in-out infinite; }

        /* Grid overlay sobre o bg */
        .dash-grid-overlay {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background-image:
            linear-gradient(rgba(239,68,68,.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(239,68,68,.03) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 90% 90% at 50% 50%, black 20%, transparent 100%);
        }

        /* Scanline sweep */
        @keyframes dash-scan { 0%{top:-3px;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100vh;opacity:0} }
        .dash-scan {
          position: fixed; left:0; right:0; height:1px; z-index:2; pointer-events:none;
          background: linear-gradient(90deg, transparent, rgba(239,68,68,.3) 40%, rgba(239,68,68,.5) 50%, rgba(239,68,68,.3) 60%, transparent);
          animation: dash-scan 12s linear infinite;
        }

        /* Content fica acima do background */
        .dash-content { position: relative; z-index: 10; }

        .dash-card { transition: border-color .2s, transform .2s; }
        .dash-card:hover {
          border-color: rgba(255,255,255,.12) !important;
          transform: translateY(-1px);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .du  { animation: fadeUp .5s cubic-bezier(.16,1,.3,1) both; }
        .du1 { animation: fadeUp .5s .06s cubic-bezier(.16,1,.3,1) both; }
        .du2 { animation: fadeUp .5s .12s cubic-bezier(.16,1,.3,1) both; }
        .du3 { animation: fadeUp .5s .18s cubic-bezier(.16,1,.3,1) both; }
        .du4 { animation: fadeUp .5s .24s cubic-bezier(.16,1,.3,1) both; }

        @keyframes live-pulse {
          0%,100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,.4); }
          50%      { opacity: .7; box-shadow: 0 0 0 5px rgba(34,197,94,0); }
        }
        .live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #22c55e;
          animation: live-pulse 2.2s ease-in-out infinite;
        }

        .section-label {
          font-size: 11px; font-weight: 600; letter-spacing: .08em;
          color: rgba(248,250,252,.3); text-transform: uppercase; margin-bottom: 14px;
        }

        /* Recharts overrides */
        .recharts-cartesian-grid line { stroke: rgba(255,255,255,.04) !important; }
        .recharts-tooltip-wrapper { z-index: 99; }
      `}</style>

      {/* Background animado */}
      <div className="dash-bg-layer">
        <div className="dash-orb dash-orb-1" />
        <div className="dash-orb dash-orb-2" />
        <div className="dash-orb dash-orb-3" />
        <div className="dash-orb dash-orb-4" />
      </div>
      <div className="dash-grid-overlay" />
      <div className="dash-scan" />

      <div className="dash-root dash-content" style={{ display: "flex", flexDirection: "column", gap: 30 }}>

        {/* ── Header ── */}
        <div className="du" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f8fafc", letterSpacing: "-.03em", marginBottom: 4 }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 13, color: "rgba(248,250,252,.35)" }}>
              Visão geral em tempo real · {time}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 10,
            background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.15)",
            fontSize: 12, fontWeight: 600, color: "#4ade80" }}>
            <div className="live-dot" />
            Ao vivo
          </div>
        </div>

        {/* ── Stats row 1 ── */}
        <div className="du1">
          <div className="section-label">Métricas principais</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <Stat label="Consultas" icon="👁" accent="#ef4444" trend="+12%"
              value={<Counter target={stats.consultations} />} />
            <Stat label="Cliques em pagar" icon="💳" accent="#8b5cf6" trend="+8%"
              value={<Counter target={stats.clicks} />} />
            <Stat label="Pagamentos" icon="✅" accent="#22c55e" trend="+5%"
              value={<Counter target={stats.payments} />} />
            <Stat label="Taxa de conversão" icon="📈" accent="#f59e0b"
              sub="consultas → pagamentos"
              value={`${stats.conversionRate}%`} />
          </div>
        </div>

        {/* ── Stats row 2 ── */}
        <div className="du2">
          <div className="section-label">Visão financeira</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <Stat label="Total de devedores" icon="👥" accent="#06b6d4"
              value={<Counter target={stats.totalDebtors} />} />
            <Stat label="Receita estimada" icon="💰" accent="#22c55e"
              sub="pagamentos registrados"
              value={fmt(stats.estimatedRevenue)} />
            <Stat label="Total de eventos" icon="📋" accent="#64748b"
              value={<Counter target={stats.totalLogs} />} />

            {/* Conversion highlight card */}
            <div style={{
              borderRadius: 14, padding: "22px 24px", position: "relative", overflow: "hidden",
              background: "linear-gradient(135deg, rgba(220,38,38,.2) 0%, rgba(185,28,28,.08) 100%)",
              border: "1px solid rgba(239,68,68,.25)",
            }}>
              <div style={{
                position: "absolute", top: -30, right: -30,
                width: 120, height: 120, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(239,68,68,.15), transparent)",
              }} />
              <div style={{ fontSize: 12, color: "rgba(248,250,252,.4)", marginBottom: 10, fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase" }}>
                Meta de conversão
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#f8fafc", letterSpacing: "-.04em", lineHeight: 1 }}>
                {stats.conversionRate}%
              </div>
              <div style={{ fontSize: 11, color: "rgba(248,250,252,.3)", margin: "8px 0 12px" }}>
                Alvo: 5.0%
              </div>
              <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,.08)" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  width: `${Math.min(parseFloat(stats.conversionRate) * 20, 100)}%`,
                  background: "linear-gradient(90deg, #dc2626, #ef4444)",
                  boxShadow: "0 0 10px rgba(239,68,68,.5)",
                  transition: "width 1.2s cubic-bezier(.16,1,.3,1)",
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Charts ── */}
        <div className="du3" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 14 }}>

          {/* Area chart */}
          <div style={{
            background: "rgba(255,255,255,.028)", border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 14, padding: "24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", marginBottom: 3 }}>
                  Consultas diárias
                </div>
                <div style={{ fontSize: 12, color: "rgba(248,250,252,.35)" }}>Últimos 7 dias</div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6,
                background: "rgba(239,68,68,.1)", color: "#f87171",
                border: "1px solid rgba(239,68,68,.2)", letterSpacing: ".04em",
              }}>7D</div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date"
                  tick={{ fontSize: 11, fill: "rgba(248,250,252,.3)" }}
                  axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "rgba(248,250,252,.3)" }}
                  axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="count"
                  stroke="#ef4444" strokeWidth={2}
                  fill="url(#redGrad)"
                  dot={{ r: 3, fill: "#ef4444", stroke: "#09090b", strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: "#ef4444", stroke: "#09090b", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Funnel */}
          <div style={{
            background: "rgba(255,255,255,.028)", border: "1px solid rgba(255,255,255,.07)",
            borderRadius: 14, padding: "24px",
            display: "flex", flexDirection: "column", gap: 0,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc", marginBottom: 4 }}>Funil de conversão</div>
            <div style={{ fontSize: 12, color: "rgba(248,250,252,.35)", marginBottom: 24 }}>Jornada do usuário</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
              <FunnelBar label="Consultas"     value={stats.consultations} total={stats.consultations} color="#ef4444" icon="👁" />
              <FunnelBar label="Clicou pagar"  value={stats.clicks}        total={stats.consultations} color="#8b5cf6" icon="💳" />
              <FunnelBar label="Pagamentos"    value={stats.payments}       total={stats.consultations} color="#22c55e" icon="✅" />
            </div>

            {/* Mini bar chart */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.06)" }}>
              <div className="section-label" style={{ marginBottom: 10, fontSize: 10 }}>Distribuição por dia</div>
              <ResponsiveContainer width="100%" height={64}>
                <BarChart data={stats.chartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.chartData.map((entry, i) => (
                      <Cell key={i}
                        fill={`rgba(239,68,68,${0.3 + 0.7 * (entry.count / maxBar)})`} />
                    ))}
                  </Bar>
                  <XAxis dataKey="date"
                    tick={{ fontSize: 9, fill: "rgba(248,250,252,.25)" }}
                    axisLine={false} tickLine={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Bottom status bar ── */}
        <div className="du4" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
          padding: "12px 18px", borderRadius: 10,
          background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)",
          fontSize: 11, color: "rgba(248,250,252,.25)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="live-dot" style={{ width: 5, height: 5 }} />
            Todos os sistemas operando
          </div>
          <span>Atualizado às {time}</span>
          <span>CAOS DÍVIDAS v2.0.1</span>
        </div>

      </div>
    </>
  );
}
