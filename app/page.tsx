"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { formatCPF, validateCPF } from "@/lib/cpf";

/* ─── Types ──────────────────────────────────────── */
interface DebtResult {
  found: boolean; debtorId: number | null;
  name: string; cpf: string;
  amount: number; discountedAmount: number;
  description: string; status: string;
  discount: number; score: number; scoreAfterPay: number;
  checkoutUrl: string;
}
interface PublicSettings {
  companyName: string; companyLogo: string; logoHeight: number;
  primaryColor: string; secondaryColor: string;
  headerTitle: string; headerSubtitle: string;
  urgencyText: string; ctaText: string; footerText: string;
  bannerImages: string[];
}

/* ─── Helpers ────────────────────────────────────── */
const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
}

/* ─── Countdown ──────────────────────────────────── */
function Countdown() {
  const [t, setT] = useState({ h: 1, m: 47, s: 23 });
  useEffect(() => {
    const id = setInterval(() => setT(p => {
      let { h, m, s } = p;
      if (--s < 0) { s = 59; if (--m < 0) { m = 59; if (--h < 0) h = 2; } }
      return { h, m, s };
    }), 1000);
    return () => clearInterval(id);
  }, []);
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono font-black text-orange-400">
      {p(t.h)}:{p(t.m)}:{p(t.s)}
    </span>
  );
}

/* ─── Hero Banner Carousel ───────────────────────── */
function HeroBanner({ images, gradient, children }: {
  images: string[]; gradient: string; children: React.ReactNode;
}) {
  const [cur, setCur] = useState(0);
  const go = useCallback((i: number) => setCur((images.length + i) % images.length), [images.length]);
  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => go(cur + 1), 5000);
    return () => clearInterval(id);
  }, [cur, go, images.length]);

  return (
    <header className="relative overflow-hidden" style={{ minHeight: 560 }}>
      {/* Background: banner images ou gradient */}
      {images.length > 0 ? (
        <>
          {images.map((src, i) => (
            <div
              key={src + i}
              className="banner-slide"
              style={{ opacity: i === cur ? 1 : 0, backgroundImage: `url(${src})` }}
            />
          ))}
          {/* Overlay gradient sobre o banner para contraste */}
          <div className="absolute inset-0" style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.7) 100%)"
          }} />
        </>
      ) : (
        <div className="absolute inset-0 hero-bg">
          {/* Blobs animados */}
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 animate-blob"
            style={{ background: `radial-gradient(circle, ${gradient.split(",")[0].replace("linear-gradient(135deg,", "").trim()} 0%, transparent 70%)` }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15 animate-blob"
            style={{ background: `radial-gradient(circle, #8b5cf6 0%, transparent 70%)`, animationDelay: "3s" }} />
          <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10 animate-blob"
            style={{ background: `radial-gradient(circle, #06b6d4 0%, transparent 70%)`, animationDelay: "1.5s" }} />
        </div>
      )}

      {/* Conteúdo */}
      <div className="relative z-10">{children}</div>

      {/* Dots do carrossel */}
      {images.length > 1 && (
        <div className="absolute bottom-5 inset-x-0 z-20 flex justify-center gap-2">
          {images.map((_, i) => (
            <button key={i} onClick={() => setCur(i)}
              className={`rounded-full transition-all duration-300 ${i === cur ? "w-7 h-2.5 bg-white" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"}`} />
          ))}
          {/* Barra de progresso */}
          <div className="absolute -top-1 left-0 h-0.5 w-full bg-white/15">
            <div key={cur} className="h-full bg-white/50" style={{ animation: "progress 5s linear forwards" }} />
          </div>
        </div>
      )}
      {/* Setas */}
      {images.length > 1 && (
        <>
          <button onClick={() => go(cur - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white text-xl flex items-center justify-center backdrop-blur-sm transition-all">‹</button>
          <button onClick={() => go(cur + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white text-xl flex items-center justify-center backdrop-blur-sm transition-all">›</button>
        </>
      )}
    </header>
  );
}

/* ─── Score Gauge ────────────────────────────────── */
function ScoreGauge({ score, afterPay }: { score: number; afterPay: number }) {
  const [w, setW] = useState(0);
  const [showAfter, setShowAfter] = useState(false);
  const pct = Math.round((score / 1000) * 100);
  const afterPct = Math.round((afterPay / 1000) * 100);
  const color = score < 400 ? "#ef4444" : score < 600 ? "#f59e0b" : "#22c55e";
  const label = score < 400 ? "Score Baixo" : score < 600 ? "Score Regular" : "Score Bom";
  const numVal = useCountUp(score);

  useEffect(() => {
    const t1 = setTimeout(() => setW(pct), 400);
    const t2 = setTimeout(() => setShowAfter(true), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pct]);

  // SVG circular gauge (semicircle)
  const R = 54;
  const C = 2 * Math.PI * R;
  const half = C / 2;
  const filled = (pct / 100) * half;

  return (
    <div className="space-y-4">
      {/* Gauge SVG */}
      <div className="flex items-center gap-4">
        <div className="relative w-32 h-20">
          <svg viewBox="0 0 120 70" className="w-full">
            {/* track */}
            <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="#e5e7eb" strokeWidth="10" strokeLinecap="round" />
            {/* fill */}
            <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 157} 200`}
              style={{ transition: "stroke-dasharray 1.8s cubic-bezier(0.4,0,0.2,1)" }} />
            <text x="60" y="58" textAnchor="middle" fontSize="20" fontWeight="900" fill={color}>{numVal}</text>
            <text x="60" y="70" textAnchor="middle" fontSize="9" fill="#9ca3af">/1000</text>
          </svg>
        </div>
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mb-1"
            style={{ background: color + "18", color }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
            {label}
          </span>
          <p className="text-xs text-gray-500 leading-relaxed max-w-[160px]">
            Seu crédito está comprometido. Regularize agora.
          </p>
        </div>
      </div>

      {/* Barra linear */}
      <div>
        <div className="relative h-3 rounded-full overflow-hidden bg-gray-100">
          <div className="absolute inset-0 score-bar-track opacity-30 rounded-full" />
          <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-[1800ms] ease-out"
            style={{ width: `${w}%`, background: color, boxShadow: `0 0 10px ${color}80` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Ruim</span><span>Regular</span><span>Bom</span><span>Excelente</span>
        </div>
      </div>

      {/* Preview pós-pagamento */}
      <div className={`p-3.5 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50 transition-all duration-700 ${showAfter ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-emerald-600 text-xs font-bold flex items-center gap-1.5">
            <span>✨</span> Após regularizar sua dívida
          </span>
          <span className="text-xs font-black px-2 py-0.5 bg-emerald-500 text-white rounded-full">
            +{afterPay - score} pts
          </span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-black text-emerald-600">{afterPay}</span>
          <span className="text-emerald-400 text-xs">/1000 pontos</span>
        </div>
        <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-[1500ms] ease-out"
            style={{ width: `${showAfter ? afterPct : 0}%` }} />
        </div>
        <p className="text-xs text-emerald-500 mt-2 font-medium">
          Acesso a crédito, melhores taxas e aprovação facilitada
        </p>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────── */
export default function HomePage() {
  const [settings, setSettings] = useState<PublicSettings>({
    companyName: "NegociAI", companyLogo: "", logoHeight: 44,
    primaryColor: "#6366f1", secondaryColor: "#8b5cf6",
    headerTitle: "Regularize sua situação financeira",
    headerSubtitle: "Consulte sua dívida e quite com até 60% de desconto",
    urgencyText: "⚡ Oferta por tempo limitado — expira em breve!",
    ctaText: "Pagar via PIX agora",
    footerText: "Seus dados estão protegidos. Ambiente 100% seguro.",
    bannerImages: [],
  });

  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebtResult | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      const bannerImages = (() => {
        if (Array.isArray(data.bannerImages)) return data.bannerImages;
        if (typeof data.bannerImages === "string") {
          try { return JSON.parse(data.bannerImages); } catch { return []; }
        }
        return [];
      })();
      setSettings(s => ({ ...s, ...data, bannerImages, logoHeight: data.logoHeight ?? 44 }));
    }).catch(() => {});
  }, []);

  function handleCPF(v: string) {
    const f = formatCPF(v); setCpf(f);
    const c = f.replace(/\D/g, "");
    setCpfValid(c.length === 11 ? validateCPF(f) : null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!name.trim() || name.trim().length < 3) return setError("Informe seu nome completo.");
    if (!validateCPF(cpf)) return setError("CPF inválido. Verifique e tente novamente.");
    setLoading(true);
    try {
      const res = await fetch("/api/consult", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cpf }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Erro ao consultar.");
      else {
        setResult(data);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
      }
    } catch { setError("Erro de conexão. Tente novamente."); }
    finally { setLoading(false); }
  }

  async function handlePayClick() {
    if (!result) return;
    await fetch("/api/track", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: result.name, cpf: result.cpf, event: "CLIQUE_PAGAMENTO", debtorId: result.debtorId }),
    }).catch(() => {});
    if (result.checkoutUrl) window.open(result.checkoutUrl, "_blank");
    else alert("Link de pagamento não configurado. Entre em contato.");
  }

  const grad = `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.secondaryColor} 100%)`;

  return (
    <div className="min-h-screen" style={{ background: "#F0F4FF" }}>

      {/* ── HERO ──────────────────────────────────── */}
      <HeroBanner images={settings.bannerImages} gradient={grad}>
        <div className="max-w-5xl mx-auto px-5 pt-7 pb-24">
          {/* Navbar */}
          <nav className="flex items-center justify-between mb-14">
            {settings.companyLogo ? (
              <img src={settings.companyLogo} alt={settings.companyName}
                style={{ height: settings.logoHeight }} className="object-contain drop-shadow-lg" />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: grad }}>
                  <span className="text-white font-black text-base">{settings.companyName.charAt(0)}</span>
                </div>
                <span className="text-white font-bold text-xl tracking-tight">{settings.companyName}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="glass rounded-full px-3.5 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white text-xs font-semibold">Sistema Online</span>
              </div>
              <div className="glass rounded-full px-3.5 py-2 hidden md:flex items-center gap-2">
                <span className="text-white text-xs">🔒</span>
                <span className="text-white text-xs font-semibold">100% Seguro</span>
              </div>
            </div>
          </nav>

          {/* Hero copy */}
          <div className="text-center max-w-2xl mx-auto animate-fade-in">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 urgency-pulse">
              <span className="text-yellow-300 text-sm font-bold">{settings.urgencyText}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-5 tracking-tight"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
              {settings.headerTitle}
            </h1>
            <p className="text-white/80 text-lg md:text-xl leading-relaxed">
              {settings.headerSubtitle}
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-10 max-w-xl mx-auto">
            {[
              { v: "47.832+", l: "Dívidas regularizadas" },
              { v: "60%", l: "Desconto médio" },
              { v: "99,8%", l: "Aprovação imediata" },
            ].map(s => (
              <div key={s.l} className="glass rounded-2xl p-4 text-center">
                <p className="text-white font-black text-2xl">{s.v}</p>
                <p className="text-white/60 text-xs mt-0.5 leading-tight">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </HeroBanner>

      {/* ── FORM CARD (flutua sobre o hero) ──────── */}
      <div className="max-w-xl mx-auto px-4 -mt-14 relative z-20 animate-slide-up">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="h-1.5 w-full" style={{ background: grad }} />
          <div className="p-7 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow"
                style={{ background: grad }}>
                <span className="text-white text-lg">🔍</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Consulte sua dívida</h2>
                <p className="text-gray-400 text-sm">Rápido, seguro e gratuito</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ex: João Carlos Silva" autoComplete="off"
                  className="input-field" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CPF</label>
                <div className="relative">
                  <input type="text" value={cpf} onChange={e => handleCPF(e.target.value)}
                    placeholder="000.000.000-00" maxLength={14} autoComplete="off"
                    className={`input-field pr-10 ${cpfValid === true ? "border-emerald-400 bg-emerald-50/30" : cpfValid === false ? "border-red-400 bg-red-50/30" : ""}`} />
                  {cpfValid !== null && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-base">
                      {cpfValid ? "✅" : "❌"}
                    </div>
                  )}
                </div>
                {cpfValid === false && <p className="text-red-500 text-xs mt-1 font-medium">CPF inválido. Verifique os dígitos.</p>}
              </div>

              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full text-base py-4 rounded-2xl cta-glow">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Consultando...
                  </span>
                ) : "Consultar minha dívida →"}
              </button>
            </form>

            <div className="flex items-center justify-center gap-5 mt-5 pt-4 border-t border-gray-100">
              {[["🔒", "SSL 256-bit"], ["🛡️", "LGPD"], ["✅", "Ambiente seguro"]].map(([i, t]) => (
                <span key={t} className="flex items-center gap-1 text-xs text-gray-400 font-medium">{i} {t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RESULTADO ─────────────────────────────── */}
      {result && (
        <div ref={resultRef} className="max-w-3xl mx-auto px-4 mt-8 pb-20 space-y-5 animate-slide-up">

          {/* Alert urgência */}
          <div className="flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-lg">⚠️</div>
              <div>
                <p className="font-bold text-red-700 text-sm">Dívida ativa localizada no seu CPF</p>
                <p className="text-red-400 text-xs mt-0.5">Oferta exclusiva expira em <Countdown /></p>
              </div>
            </div>
            <span className="text-xs bg-red-500 text-white font-black px-3 py-1.5 rounded-full animate-pulse">URGENTE</span>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Dados da dívida */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-sm">📋</div>
                <h3 className="font-bold text-gray-800">Dados da Dívida</h3>
              </div>
              <div className="p-5 space-y-0">
                {[
                  { l: "Nome", v: result.name },
                  { l: "CPF", v: result.cpf },
                  { l: "Descrição", v: result.description },
                ].map(item => (
                  <div key={item.l} className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-400 text-sm">{item.l}</span>
                    <span className="text-gray-800 font-semibold text-sm text-right max-w-[60%]">{item.v}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">{result.status}</span>
                </div>
              </div>
            </div>

            {/* Score */}
            <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-sm">📊</div>
                <h3 className="font-bold text-gray-800">Análise de Crédito</h3>
              </div>
              <div className="p-5">
                <ScoreGauge score={result.score} afterPay={result.scoreAfterPay} />
              </div>
            </div>
          </div>

          {/* OFERTA */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            <div className="h-1" style={{ background: grad }} />
            <div className="p-6 md:p-7">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow"
                  style={{ background: grad }}>🎯</div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">Oferta Exclusiva de Quitação</h3>
                  <p className="text-gray-400 text-sm">Elimine sua dívida definitivamente com desconto especial</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Valores */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-medium mb-2">Valor original da dívida</p>
                    <p className="text-2xl font-bold text-gray-300 strike">{fmt(result.amount)}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-500 mt-2">
                      🚫 Valor integral
                    </span>
                  </div>

                  <div className="relative rounded-xl p-4 border-2 border-emerald-400 overflow-hidden"
                    style={{ background: "linear-gradient(135deg, #f0fdf4, #ecfdf5)" }}>
                    <div className="absolute -top-0 right-0 text-white text-xs font-black px-3 py-1.5 rounded-bl-xl"
                      style={{ background: grad }}>
                      -{Math.round(result.discount)}% OFF
                    </div>
                    <p className="text-xs text-emerald-600 font-semibold mb-1">Valor com desconto</p>
                    <p className="text-4xl font-black text-emerald-700 tracking-tight">
                      {fmt(result.discountedAmount)}
                    </p>
                    <p className="text-xs text-emerald-500 mt-1.5 font-semibold">
                      💸 Você economiza {fmt(result.amount - result.discountedAmount)}
                    </p>
                  </div>
                </div>

                {/* Benefícios */}
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-3">O que você conquista:</p>
                  <div className="space-y-2.5">
                    {[
                      ["✅", "Quitação definitiva registrada"],
                      ["📈", "Aumento imediato do score"],
                      ["🏦", "Acesso a financiamentos"],
                      ["🔓", "Saída dos cadastros negativos"],
                      ["💳", "Aprovação em cartões e crédito"],
                      ["⚡", "Pagamento via PIX instantâneo"],
                    ].map(([i, t]) => (
                      <div key={t} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <span className="text-base">{i}</span> {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button onClick={handlePayClick}
                className="w-full py-5 rounded-2xl text-white font-black text-lg cta-glow transition-all hover:scale-[1.015] active:scale-[0.99]"
                style={{ background: grad }}>
                <span className="flex items-center justify-center gap-2">
                  <span>💳</span>
                  {settings.ctaText}
                  <span>→</span>
                </span>
              </button>

              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-400">
                <span>🔒 Pagamento seguro</span>
                <span>⚡ PIX instantâneo</span>
                <span>📄 Comprovante digital</span>
              </div>
            </div>
          </div>

          {/* Prova social */}
          <div className="rounded-2xl p-5 text-center border border-indigo-100"
            style={{ background: "linear-gradient(135deg, #eef2ff, #f5f3ff)" }}>
            <p className="text-gray-700 text-sm leading-relaxed">
              <span className="font-bold text-indigo-600">Mais de 47 mil brasileiros</span> regularizaram suas dívidas e hoje desfrutam de{" "}
              <span className="font-bold text-indigo-600">crédito aprovado, financiamentos e novas oportunidades</span>.
              Não deixe uma dívida antiga bloquear o seu futuro. <strong>Este é o seu momento.</strong>
            </p>
          </div>
        </div>
      )}

      {/* ── FOOTER PROFISSIONAL ────────────────────── */}
      <footer style={{ background: "linear-gradient(180deg, #06091A 0%, #0B0F24 100%)" }}>
        {/* Trust strip */}
        <div className="border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap justify-center gap-6">
            {[["🔒","SSL 256-bit"],["🛡️","LGPD Compliant"],["✅","Empresa Registrada"],["⚡","Atendimento Ágil"],["🏦","Pagamentos Seguros"]].map(([i,t]) => (
              <span key={t} className="flex items-center gap-1.5 text-white/30 text-xs font-medium">
                <span>{i}</span>{t}
              </span>
            ))}
          </div>
        </div>

        {/* Corpo */}
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Col 1 — Marca */}
            <div className="md:col-span-2">
              {settings.companyLogo ? (
                <img src={settings.companyLogo} alt={settings.companyName}
                  style={{ height: Math.min(settings.logoHeight, 48) }}
                  className="object-contain mb-4 brightness-0 invert opacity-80" />
              ) : (
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: grad }}>
                    <span className="text-white font-black">{settings.companyName.charAt(0)}</span>
                  </div>
                  <span className="text-white font-bold text-xl">{settings.companyName}</span>
                </div>
              )}
              <p className="text-white/45 text-sm leading-relaxed max-w-xs">{settings.footerText}</p>
              <p className="text-white/25 text-xs mt-3 leading-relaxed max-w-xs">
                Empresa especializada em negociação e recuperação de crédito, atuando com ética,
                transparência e em conformidade com o Código de Defesa do Consumidor.
              </p>
              <div className="flex gap-2.5 mt-5">
                {[["f","Facebook"],["in","LinkedIn"],["ig","Instagram"]].map(([s,l]) => (
                  <div key={l} title={l} className="w-9 h-9 rounded-lg bg-white/8 hover:bg-white/15 transition-colors flex items-center justify-center cursor-pointer border border-white/10">
                    <span className="text-white/50 text-xs font-bold">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 2 — Links */}
            <div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-5">Informações</p>
              <ul className="space-y-3">
                {["Como funciona","Política de Privacidade","Termos de Uso","LGPD","Fale Conosco"].map(l => (
                  <li key={l}>
                    <span className="text-white/35 hover:text-white/65 text-sm cursor-pointer transition-colors">{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — Contato */}
            <div>
              <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-5">Contato</p>
              <ul className="space-y-3">
                {[["📧","contato@empresa.com.br"],["📱","0800 000 0000"],["⏰","Seg-Sex, 8h–20h"],["📍","Brasil"]].map(([i,v]) => (
                  <li key={v} className="flex items-start gap-2.5">
                    <span className="text-white/25 text-sm mt-0.5">{i}</span>
                    <span className="text-white/40 text-sm">{v}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 mt-5">
                {[["PROCON","Registrado"],["BACEN","Regulado"]].map(([t,s]) => (
                  <div key={t} className="border border-white/10 rounded-lg px-2.5 py-2 text-center">
                    <p className="text-white/55 text-xs font-bold">{t}</p>
                    <p className="text-white/25 text-xs">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5">
          <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-xs">
              © {new Date().getFullYear()} {settings.companyName}. Todos os direitos reservados. CNPJ: 00.000.000/0001-00
            </p>
            <div className="flex items-center gap-5">
              {["Privacidade","Termos","Cookies"].map(l => (
                <span key={l} className="text-white/20 hover:text-white/45 text-xs cursor-pointer transition-colors">{l}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
