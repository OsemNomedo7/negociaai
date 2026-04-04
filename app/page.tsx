"use client";

import { useState, useEffect, useRef } from "react";
import { formatCPF, validateCPF } from "@/lib/cpf";
import BannerCarousel from "@/components/BannerCarousel";

interface DebtResult {
  found: boolean;
  debtorId: number | null;
  name: string;
  cpf: string;
  amount: number;
  discountedAmount: number;
  description: string;
  status: string;
  discount: number;
  score: number;
  scoreAfterPay: number;
  checkoutUrl: string;
}

interface PublicSettings {
  companyName: string;
  companyLogo: string;
  primaryColor: string;
  secondaryColor: string;
  headerTitle: string;
  headerSubtitle: string;
  urgencyText: string;
  ctaText: string;
  footerText: string;
  bannerImages: string[];
}

function formatMoney(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function AnimatedNumber({ target, prefix = "" }: { target: number; prefix?: string }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const steps = 60;
    const increment = target / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrent(Math.min(Math.round(increment * step), target));
      if (step >= steps) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [target]);
  return <span>{prefix}{current.toLocaleString("pt-BR")}</span>;
}

function ScoreGauge({ score, scoreAfterPay }: { score: number; scoreAfterPay: number }) {
  const [width, setWidth] = useState(0);
  const [previewWidth, setPreviewWidth] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const pct = Math.round((score / 1000) * 100);
  const previewPct = Math.round((scoreAfterPay / 1000) * 100);

  useEffect(() => {
    const t1 = setTimeout(() => setWidth(pct), 300);
    const t2 = setTimeout(() => {
      setShowPreview(true);
      setPreviewWidth(previewPct);
    }, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [pct, previewPct]);

  const color = score < 400 ? "#ef4444" : score < 600 ? "#f59e0b" : "#22c55e";
  const label = score < 400 ? "Score Baixo" : score < 600 ? "Score Regular" : "Score Bom";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Score de Crédito</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black" style={{ color }}>
              <AnimatedNumber target={score} />
            </span>
            <span className="text-gray-400 text-sm">/1000</span>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-full mt-1"
            style={{ background: color + "20", color }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }}></span>
            {label}
          </span>
        </div>
        <div className="w-20 h-20 relative">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#f0f0f0" strokeWidth="3" />
            <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3"
              strokeDasharray={`${pct * 0.942} 94.2`}
              strokeLinecap="round"
              style={{ transition: "stroke-dasharray 2s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
          </div>
        </div>
      </div>

      {/* Barra de score */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>0</span>
          <span>Ruim</span>
          <span>Regular</span>
          <span>Bom</span>
          <span>1000</span>
        </div>
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-red-100 rounded-l-full"></div>
            <div className="flex-1 bg-yellow-100"></div>
            <div className="flex-1 bg-green-100 rounded-r-full"></div>
          </div>
          <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-[2000ms] ease-out"
            style={{ width: `${width}%`, background: `linear-gradient(90deg, #ef4444, ${color})` }}>
          </div>
          {/* Indicador de posição */}
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md transition-all duration-[2000ms] ease-out"
            style={{ left: `calc(${width}% - 8px)`, background: color }}>
          </div>
        </div>
      </div>

      {/* Preview pós-pagamento */}
      <div className={`mt-4 p-3 rounded-xl border-2 border-dashed border-green-200 bg-green-50 transition-all duration-700 ${showPreview ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-green-600 text-sm font-bold">✨ Após regularizar:</span>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-black text-green-600">{scoreAfterPay}</span>
          <span className="text-green-400 text-sm">/1000 pontos</span>
          <span className="text-xs font-semibold px-2 py-0.5 bg-green-600 text-white rounded-full">
            +{scoreAfterPay - score} pts
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-green-500 transition-all duration-[1500ms] ease-out"
            style={{ width: `${previewWidth}%` }}>
          </div>
        </div>
        <p className="text-xs text-green-600 mt-2 font-medium">
          Acesso a crédito, melhores taxas e oportunidades financeiras
        </p>
      </div>
    </div>
  );
}

function Countdown() {
  const [time, setTime] = useState({ h: 1, m: 47, s: 23 });
  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        let { h, m, s } = t;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 2; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="font-mono font-bold text-red-600">
      {pad(time.h)}:{pad(time.m)}:{pad(time.s)}
    </span>
  );
}

export default function HomePage() {
  const [settings, setSettings] = useState<PublicSettings>({
    companyName: "NegociAI",
    companyLogo: "",
    primaryColor: "#6366f1",
    secondaryColor: "#8b5cf6",
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
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const bannerImages = (() => {
          if (Array.isArray(data.bannerImages)) return data.bannerImages;
          if (typeof data.bannerImages === "string") {
            try { return JSON.parse(data.bannerImages); } catch { return []; }
          }
          return [];
        })();
        setSettings((s) => ({ ...s, ...data, bannerImages }));
      })
      .catch(() => {});
  }, []);

  function handleCPF(v: string) {
    const formatted = formatCPF(v);
    setCpf(formatted);
    const clean = formatted.replace(/\D/g, "");
    if (clean.length === 11) {
      setCpfValid(validateCPF(formatted));
    } else {
      setCpfValid(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || name.trim().length < 3) {
      setError("Informe seu nome completo.");
      return;
    }
    if (!validateCPF(cpf)) {
      setError("CPF inválido. Verifique e tente novamente.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/consult", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cpf }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao consultar. Tente novamente.");
      } else {
        setResult(data);
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayClick() {
    if (!result) return;
    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: result.name,
        cpf: result.cpf,
        event: "CLIQUE_PAGAMENTO",
        debtorId: result.debtorId,
      }),
    }).catch(() => {});

    if (result.checkoutUrl) {
      window.open(result.checkoutUrl, "_blank");
    } else {
      alert("Link de pagamento não configurado. Entre em contato.");
    }
  }

  const grad = `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.secondaryColor} 100%)`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header style={{ background: grad }} className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/20 blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-white/20 blur-3xl"></div>
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-8">
          {/* Logo/Nome */}
          <div className="flex items-center gap-3 mb-8">
            {settings.companyLogo ? (
              <img src={settings.companyLogo} alt="Logo" className="h-10 object-contain" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="text-white font-black text-lg">N</span>
                </div>
                <span className="text-white font-bold text-xl">{settings.companyName}</span>
              </div>
            )}
            <div className="ml-auto">
              <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-white text-xs font-medium">100% Seguro</span>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-4 urgency-badge">
              <span className="text-yellow-300 text-sm font-bold">{settings.urgencyText}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3">
              {settings.headerTitle}
            </h1>
            <p className="text-white/80 text-lg max-w-lg mx-auto">
              {settings.headerSubtitle}
            </p>
          </div>

          {/* Stats trust signals */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Dívidas regularizadas", value: "47.832+" },
              { label: "Desconto médio", value: "60%" },
              { label: "Aprovação imediata", value: "99,8%" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                <div className="text-white font-black text-xl">{s.value}</div>
                <div className="text-white/70 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Banner carrossel (quando configurado) */}
          {settings.bannerImages.length > 0 && (
            <div className="mt-2 rounded-2xl overflow-hidden shadow-lg">
              <BannerCarousel images={settings.bannerImages} />
            </div>
          )}
        </div>
      </header>

      {/* FORM DE CONSULTA */}
      <div className="max-w-4xl mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl card-shadow-lg p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Consulte sua dívida agora</h2>
          <p className="text-gray-500 text-sm mb-6">Preencha os dados abaixo para verificar sua situação</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Nome completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Carlos Silva"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 transition-colors text-gray-800 text-base"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">CPF</label>
              <div className="relative">
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => handleCPF(e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-gray-800 text-base pr-10 ${
                    cpfValid === null
                      ? "border-gray-200 focus:border-indigo-400"
                      : cpfValid
                      ? "border-green-400 bg-green-50"
                      : "border-red-300 bg-red-50"
                  }`}
                  autoComplete="off"
                />
                {cpfValid !== null && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {cpfValid ? (
                      <span className="text-green-500 text-lg">✓</span>
                    ) : (
                      <span className="text-red-400 text-lg">✗</span>
                    )}
                  </div>
                )}
              </div>
              {cpfValid === false && (
                <p className="text-red-500 text-xs mt-1">CPF inválido. Verifique os dígitos.</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ background: grad }}
              className="w-full py-4 rounded-xl text-white font-bold text-base transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Consultando...
                </span>
              ) : (
                "Consultar minha dívida"
              )}
            </button>
          </form>

          <div className="flex items-center justify-center gap-4 mt-4 text-gray-400">
            <span className="flex items-center gap-1 text-xs">
              <span>🔒</span> Dados criptografados
            </span>
            <span className="flex items-center gap-1 text-xs">
              <span>🛡️</span> LGPD
            </span>
            <span className="flex items-center gap-1 text-xs">
              <span>✅</span> Ambiente seguro
            </span>
          </div>
        </div>
      </div>

      {/* RESULTADO */}
      {result && (
        <div ref={resultRef} className="max-w-4xl mx-auto px-4 mt-6 pb-16 animate-fade-in">

          {/* Banner urgência */}
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-red-700 text-sm">Dívida ativa localizada em seu nome</p>
                <p className="text-red-500 text-xs">Esta oferta é exclusiva e expira em: <Countdown /></p>
              </div>
            </div>
            <span className="text-xs bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full">URGENTE</span>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Dados da dívida */}
            <div className="bg-white rounded-2xl card-shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-base">📋</span>
                </div>
                <h3 className="font-bold text-gray-800">Dados da Dívida</h3>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Nome", value: result.name },
                  { label: "CPF", value: result.cpf },
                  { label: "Descrição", value: result.description },
                  { label: "Status", value: result.status, badge: true },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-start py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500 text-sm">{item.label}</span>
                    {item.badge ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                        {item.value}
                      </span>
                    ) : (
                      <span className="text-gray-800 font-medium text-sm text-right max-w-[60%]">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Score */}
            <div className="bg-white rounded-2xl card-shadow p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <span className="text-base">📊</span>
                </div>
                <h3 className="font-bold text-gray-800">Análise de Crédito</h3>
              </div>
              <ScoreGauge score={result.score} scoreAfterPay={result.scoreAfterPay} />
            </div>
          </div>

          {/* OFERTA DE PAGAMENTO */}
          <div className="mt-5 bg-white rounded-2xl card-shadow-lg overflow-hidden">
            <div className="p-1" style={{ background: grad }}>
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h3 className="font-black text-gray-800 text-lg">Oferta Especial de Quitação</h3>
                    <p className="text-gray-500 text-sm">Pague agora e elimine sua dívida definitivamente</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Valores */}
                  <div>
                    <div className="bg-gray-50 rounded-xl p-4 mb-3">
                      <p className="text-xs text-gray-500 font-medium mb-1">Valor original</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-400 strike">
                          {formatMoney(result.amount)}
                        </span>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-full">
                        <span>🚫</span> Valor cheio
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-4 relative overflow-hidden">
                      <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-black px-2 py-1 rounded-bl-lg">
                        -{Math.round(result.discount)}% OFF
                      </div>
                      <p className="text-xs text-green-600 font-medium mb-1">Valor com desconto</p>
                      <div className="text-3xl font-black text-green-700">
                        <AnimatedNumber target={result.discountedAmount} prefix="R$ " />
                      </div>
                      <p className="text-xs text-green-500 mt-1 font-medium">
                        Economia de {formatMoney(result.amount - result.discountedAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Benefícios */}
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-700 mb-3">O que você ganha:</p>
                    {[
                      { icon: "✅", text: "Quitação definitiva da dívida" },
                      { icon: "📈", text: "Aumento imediato do score de crédito" },
                      { icon: "🏦", text: "Acesso a financiamentos e crédito" },
                      { icon: "🔓", text: "Saída do cadastro de inadimplentes" },
                      { icon: "💳", text: "Aprovação em cartões e empréstimos" },
                      { icon: "⚡", text: "Pagamento rápido via PIX" },
                    ].map((b) => (
                      <div key={b.text} className="flex items-center gap-2 text-sm text-gray-700">
                        <span>{b.icon}</span>
                        <span>{b.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handlePayClick}
                  className="w-full py-5 rounded-2xl text-white font-black text-lg relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl pulse-ring"
                  style={{ background: grad }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <span className="text-xl">💳</span>
                    {settings.ctaText}
                    <span className="text-xl">→</span>
                  </span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
                </button>

                <div className="flex items-center justify-center gap-6 mt-4 text-gray-400 text-xs">
                  <span className="flex items-center gap-1">🔒 Pagamento seguro</span>
                  <span className="flex items-center gap-1">⚡ PIX instantâneo</span>
                  <span className="flex items-center gap-1">📄 Comprovante digital</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagem persuasiva */}
          <div className="mt-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
            <p className="text-center text-gray-700 text-sm font-medium leading-relaxed">
              <span className="font-bold text-indigo-600">Milhares de brasileiros</span> regularizaram suas dívidas e hoje têm{" "}
              <span className="font-bold text-indigo-600">acesso a crédito, financiamentos e novas oportunidades</span>.{" "}
              Não deixe uma dívida antiga bloquear o seu futuro. Este é o seu momento.
            </p>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="border-t border-gray-100 bg-white py-8 mt-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">{settings.footerText}</p>
          <p className="text-gray-300 text-xs mt-2">
            © {new Date().getFullYear()} {settings.companyName}. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
