"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { formatCPF, validateCPF } from "@/lib/cpf";

/* ── Types ────────────────────────────────────── */
interface DebtResult {
  found: boolean; debtorId: number | null;
  name: string; cpf: string;
  amount: number; discountedAmount: number;
  description: string; status: string;
  discount: number; score: number; scoreAfterPay: number;
  checkoutUrl: string;
}

interface PageContent {
  heroTag: string; heroTitleLine1: string; heroTitleAccent: string;
  heroSubtitle: string; heroCta1: string; heroCta2: string;
  heroStat1Val: string; heroStat1Lbl: string;
  heroStat2Val: string; heroStat2Lbl: string;
  heroStat3Val: string; heroStat3Lbl: string;
  heroStat4Val: string; heroStat4Lbl: string;
  promoBannerUrl: string; promoBannerLink: string;
  sectionBannerConsultUrl: string; sectionBannerConsultLink: string;
  sectionBannerSobreUrl: string; sectionBannerSobreLink: string;
  sectionBannerContatoUrl: string; sectionBannerContatoLink: string;
  consultTag: string; consultTitle: string; consultSubtitle: string;
  consultCta: string; consultPrivacy: string;
  aboutTag: string; aboutTitle: string; aboutSubtitle: string;
  aboutStat1Val: string; aboutStat1Lbl: string;
  aboutStat2Val: string; aboutStat2Lbl: string;
  aboutStat3Val: string; aboutStat3Lbl: string;
  aboutStat4Val: string; aboutStat4Lbl: string;
  feat1Icon: string; feat1Title: string; feat1Desc: string;
  feat2Icon: string; feat2Title: string; feat2Desc: string;
  feat3Icon: string; feat3Title: string; feat3Desc: string;
  feat4Icon: string; feat4Title: string; feat4Desc: string;
  feat5Icon: string; feat5Title: string; feat5Desc: string;
  feat6Icon: string; feat6Title: string; feat6Desc: string;
  contactTag: string; contactTitle: string; contactSubtitle: string;
  contactPhone: string; contactPhoneSub: string;
  contactEmail: string; contactEmailSub: string;
  contactAddress: string; contactAddressSub: string;
  contactHours: string; contactHoursSub: string;
  ctaCardTitle: string; ctaCardDesc: string; ctaCardBtn: string;
  footerTagline: string;
  socialX: string; socialLinkedin: string; socialFacebook: string;
}

interface ColorScheme {
  accentColor: string;
  heroBg: string;
  navBg: string;
  navTextColor: string;
  consultBg: string; aboutBg: string; contactBg: string; footerBg: string;
  footerTextColor: string;
  titleColor: string; subtitleColor: string;
  cardBg: string; cardBorder: string;
  inputBorder: string; inputFocusBorder: string;
  scoreColorBad: string; scoreColorMid: string; scoreColorGood: string;
  /** @deprecated use navBg */
  navScrolledBg?: string;
}

interface Cfg {
  companyName: string; companyLogo: string; logoHeight: number;
  primaryColor: string; secondaryColor: string;
  urgencyText: string; ctaText: string; footerText: string;
  faviconUrl: string;
  bannerImages: string[];
  pageTitle: string;
  whatsappNumber: string;
  pc: PageContent;
  cs: ColorScheme;
}

/* ── Defaults ─────────────────────────────────── */
const DEF_PC: PageContent = {
  heroTag: "⚡ Oferta por tempo limitado",
  heroTitleLine1: "Regularize sua situação",
  heroTitleAccent: "financeira agora",
  heroSubtitle: "Quite sua dívida com até 60% de desconto. Processo 100% digital, seguro e imediato.",
  heroCta1: "Consultar minha dívida", heroCta2: "Saiba mais",
  heroStat1Val: "R$ 2.8B+", heroStat1Lbl: "Dívidas negociadas",
  heroStat2Val: "340K+",    heroStat2Lbl: "CPFs regularizados",
  heroStat3Val: "60%",      heroStat3Lbl: "Desconto médio",
  heroStat4Val: "4.9★",     heroStat4Lbl: "Avaliação média",
  promoBannerUrl: "/banner-promo.svg", promoBannerLink: "#consultar",
  sectionBannerConsultUrl: "", sectionBannerConsultLink: "#consultar",
  sectionBannerSobreUrl: "",   sectionBannerSobreLink: "#quem-somos",
  sectionBannerContatoUrl: "", sectionBannerContatoLink: "#fale-conosco",
  consultTag: "Consulta gratuita",
  consultTitle: "Consulte sua dívida",
  consultSubtitle: "Digite seu nome e CPF para verificar se há pendências e receber uma proposta personalizada.",
  consultCta: "Consultar minha situação",
  consultPrivacy: "Consulta 100% gratuita e segura · Sem cadastro",
  aboutTag: "Nossa empresa", aboutTitle: "Quem somos",
  aboutSubtitle: "Somos uma plataforma de renegociação de dívidas que conecta pessoas endividadas às melhores propostas de quitação — de forma rápida, segura e transparente.",
  aboutStat1Val: "2018",     aboutStat1Lbl: "Fundada em",
  aboutStat2Val: "340K+",    aboutStat2Lbl: "Clientes atendidos",
  aboutStat3Val: "R$ 2.8B+", aboutStat3Lbl: "Em dívidas negociadas",
  aboutStat4Val: "4.9/5",    aboutStat4Lbl: "Avaliação no Reclame Aqui",
  feat1Icon: "🔍", feat1Title: "Transparência total",
  feat1Desc: "Todas as informações sobre sua dívida são apresentadas de forma clara, sem surpresas ou taxas ocultas.",
  feat2Icon: "⚡", feat2Title: "Negociação instantânea",
  feat2Desc: "Processo 100% digital. Consulte, negocie e quite sua dívida em minutos, sem burocracia.",
  feat3Icon: "🛡️", feat3Title: "Segurança garantida",
  feat3Desc: "Plataforma com criptografia de ponta a ponta. Seus dados pessoais e financeiros estão protegidos.",
  feat4Icon: "📈", feat4Title: "Score em alta",
  feat4Desc: "Após a quitação, seu score de crédito sobe automaticamente. Volte a ter acesso ao mercado financeiro.",
  feat5Icon: "🤝", feat5Title: "Descontos reais",
  feat5Desc: "Negociamos diretamente com os credores para garantir os maiores descontos possíveis para você.",
  feat6Icon: "📞", feat6Title: "Suporte humanizado",
  feat6Desc: "Nossa equipe está disponível para te auxiliar em cada etapa da negociação, do início ao fim.",
  contactTag: "Atendimento", contactTitle: "Fale conosco",
  contactSubtitle: "Nossa equipe está pronta para te ajudar. Escolha o canal de sua preferência.",
  contactPhone: "(11) 91234-5678", contactPhoneSub: "Seg–Sex, 8h às 20h",
  contactEmail: "suporte@negociai.com.br", contactEmailSub: "Resposta em até 2h úteis",
  contactAddress: "Av. Paulista, 1000 — São Paulo, SP", contactAddressSub: "CEP 01310-100",
  contactHours: "Segunda à Sexta, 8h às 20h", contactHoursSub: "Sábados, 9h às 14h",
  ctaCardTitle: "Pronto para limpar seu nome?",
  ctaCardDesc: "Consulte sua situação gratuitamente agora e descubra o desconto que preparamos especialmente para você.",
  ctaCardBtn: "Consultar dívida grátis",
  footerTagline: "Plataforma líder em renegociação de dívidas no Brasil. Transparência e segurança para você recuperar sua liberdade financeira.",
  socialX: "#", socialLinkedin: "#", socialFacebook: "#",
};

const DEF_CS: ColorScheme = {
  accentColor: "#f97316",
  heroBg: "#060A14",
  navBg: "rgba(6,10,20,.88)",
  navTextColor: "rgba(255,255,255,.75)",
  consultBg: "#F0F4F8", aboutBg: "#ffffff", contactBg: "#F0F4F8", footerBg: "#060A14",
  footerTextColor: "rgba(255,255,255,.35)",
  titleColor: "#0F172A", subtitleColor: "#64748b",
  cardBg: "#ffffff", cardBorder: "#E8EEF8",
  inputBorder: "#E2E8F0", inputFocusBorder: "#6366f1",
  scoreColorBad: "#ef4444", scoreColorMid: "#f59e0b", scoreColorGood: "#22c55e",
};

const DEF_CFG: Cfg = {
  companyName: "NegociAI", companyLogo: "", logoHeight: 44,
  primaryColor: "#6366f1", secondaryColor: "#8b5cf6",
  urgencyText: "⚡ Oferta por tempo limitado", ctaText: "Pagar via PIX",
  footerText: "Seus dados estão protegidos. Ambiente 100% seguro.",
  faviconUrl: "", bannerImages: [], pageTitle: "NegociAI", whatsappNumber: "",
  pc: DEF_PC, cs: DEF_CS,
};

/* ── Helpers ──────────────────────────────────── */
const BRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw === "object" && raw !== null) return raw as T;
  if (typeof raw === "string") { try { return { ...fallback, ...(JSON.parse(raw) as object) } as T; } catch { return fallback; } }
  return fallback;
}

function useCountUp(to: number, ms = 1600) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let n = 0; const step = to / (ms / 16);
    const id = setInterval(() => { n += step; if (n >= to) { setV(to); clearInterval(id); } else setV(Math.floor(n)); }, 16);
    return () => clearInterval(id);
  }, [to, ms]);
  return v;
}

/* ── Countdown ────────────────────────────────── */
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
  return <span className="font-mono font-bold tabular-nums" style={{ color: "#f97316" }}>{p(t.h)}:{p(t.m)}:{p(t.s)}</span>;
}

/* ── Score Meter ──────────────────────────────── */
function ScoreMeter({ score, label, cs }: { score: number; label: string; cs: ColorScheme }) {
  const pct = Math.min(Math.max(score / 1000, 0), 1) * 100;
  const color = score < 400 ? cs.scoreColorBad : score < 600 ? cs.scoreColorMid : cs.scoreColorGood;
  const val = useCountUp(score);
  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>{label}</p>
          <p className="text-5xl font-black tabular-nums leading-none" style={{ color }}>{val}</p>
        </div>
        <p className="text-xs font-bold px-3 py-1 rounded-full pb-1" style={{ background: `${color}18`, color }}>
          {score < 400 ? "Crítico" : score < 600 ? "Regular" : "Bom"}
        </p>
      </div>
      <div className="score-track">
        <div className="score-thumb" style={{ left: `${pct}%`, color }} />
      </div>
      <div className="flex justify-between text-[10px] font-semibold" style={{ color: "#94a3b8" }}>
        <span>0</span><span>300</span><span>600</span><span>1000</span>
      </div>
    </div>
  );
}

/* ── Section Banner ───────────────────────────── */
function SectionBanner({ url, link }: { url: string; link: string }) {
  if (!url) return null;
  const inner = (
    <div className="w-full overflow-hidden rounded-2xl shadow-lg" style={{ maxHeight: 120 }}>
      <img src={url} alt="banner" className="w-full h-full object-cover" />
    </div>
  );
  if (link && link !== "#") return (
    <div className="max-w-5xl mx-auto px-6 py-4">
      <a href={link} onClick={e => { if (link.startsWith("#")) { e.preventDefault(); document.querySelector(link)?.scrollIntoView({ behavior: "smooth" }); } }}>
        {inner}
      </a>
    </div>
  );
  return <div className="max-w-5xl mx-auto px-6 py-4">{inner}</div>;
}

/* ── Navbar ───────────────────────────────────── */
function Navbar({ cfg }: { cfg: Cfg }) {
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastY = useRef(0);
  const grad = `linear-gradient(135deg, ${cfg.primaryColor}, ${cfg.secondaryColor})`;
  const { pc } = cfg;

  useEffect(() => {
    const fn = () => {
      const y = window.scrollY;
      if (y < 60) { setHidden(false); }
      else if (y > lastY.current + 8) { setHidden(true); }
      else if (y < lastY.current - 4) { setHidden(false); }
      lastY.current = y;
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const links = [
    { href: "#inicio", label: "Início" },
    { href: "#consultar", label: "Consultar Dívida" },
    { href: "#quem-somos", label: "Quem Somos" },
    { href: "#fale-conosco", label: "Fale Conosco" },
  ];

  function goTo(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    e.preventDefault(); setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <nav className="nav-root" style={{
      background: cfg.cs.navBg,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,.08)",
      boxShadow: "0 1px 24px rgba(0,0,0,.3)",
      transform: hidden ? "translateY(-100%)" : "translateY(0)",
      transition: "transform .35s cubic-bezier(.4,0,.2,1), box-shadow .3s",
    } as React.CSSProperties}>
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <a href="#inicio" onClick={e => goTo(e, "#inicio")} className="flex items-center gap-3 flex-shrink-0">
          {cfg.companyLogo ? (
            <img src={cfg.companyLogo} alt={cfg.companyName} style={{ height: cfg.logoHeight, maxWidth: 180, objectFit: "contain" }} />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ background: grad }}>
                {cfg.companyName.charAt(0)}
              </div>
              <span className="font-black text-lg tracking-tight" style={{ color: cfg.cs.navTextColor }}>{cfg.companyName}</span>
            </div>
          )}
        </a>
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => <a key={l.href} href={l.href} className="nav-link" style={{ color: cfg.cs.navTextColor }} onClick={e => goTo(e, l.href)}>{l.label}</a>)}
        </div>
        <div className="hidden md:flex">
          <a href="#consultar" onClick={e => goTo(e, "#consultar")} className="nav-cta" style={{ background: grad }}>
            {pc.heroCta1}
          </a>
        </div>
        <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          {[0,1,2].map(i => (
            <span key={i} className="block w-6 h-0.5 bg-white/80 rounded transition-all" style={{
              transform: i === 0 && menuOpen ? "rotate(45deg) translate(4px,4px)" : i === 2 && menuOpen ? "rotate(-45deg) translate(4px,-4px)" : "",
              opacity: i === 1 && menuOpen ? 0 : 1,
            }} />
          ))}
        </button>
      </div>
      {menuOpen && (
        <div className="md:hidden anim-slide-down border-t" style={{ background: "rgba(6,10,20,.96)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,.08)" }}>
          <div className="px-6 py-4 flex flex-col gap-1">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={e => goTo(e, l.href)}
                className="block py-3 text-sm font-semibold border-b"
                style={{ color: "rgba(255,255,255,.7)", borderColor: "rgba(255,255,255,.06)" }}>{l.label}</a>
            ))}
            <a href="#consultar" onClick={e => goTo(e, "#consultar")}
              className="mt-3 text-center py-3 rounded-xl text-white font-bold text-sm"
              style={{ background: grad }}>{pc.heroCta1}</a>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ── Hero com Banner (substitui toda a área escura) */
function HeroBannerSection({ cfg }: { cfg: Cfg }) {
  const { pc } = cfg;
  const link = pc.promoBannerLink || "#consultar";
  function goLink(e: React.MouseEvent<HTMLAnchorElement>) {
    if (link.startsWith("#")) { e.preventDefault(); document.querySelector(link)?.scrollIntoView({ behavior: "smooth" }); }
  }
  return (
    <section id="inicio" style={{ position: "relative", paddingTop: "var(--nav-h)", background: "#060A14" }}>
      <a href={link} onClick={goLink} className="block w-full">
        <img
          src={pc.promoBannerUrl}
          alt="Banner"
          style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
        />
      </a>
    </section>
  );
}

/* ── Hero (texto — quando não tem banner) ─────── */
function HeroSection({ cfg }: { cfg: Cfg }) {
  const { pc, cs } = cfg;
  const grad = `linear-gradient(135deg, ${cfg.primaryColor}, ${cfg.secondaryColor})`;

  return (
    <section id="inicio" className="hero-root" style={{ background: cs.heroBg }}>
      <div className="hero-grid" />
      <div className="hero-glow-left" />
      <div className="hero-glow-right" />
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-32 pb-20">
        <div className="anim-up">
          <span className="hero-tag" style={{ borderColor: `${cs.accentColor}4D`, background: `${cs.accentColor}14`, color: cs.accentColor }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cs.accentColor, display: "inline-block" }} />
            {pc.heroTag} · <Countdown />
          </span>
        </div>
        <h1 className="hero-h1 mt-6 anim-up-1">
          {pc.heroTitleLine1}<br />
          <span className="accent">{pc.heroTitleAccent}</span>
        </h1>
        <p className="hero-sub mt-5 anim-up-2 mx-auto">{pc.heroSubtitle}</p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 anim-up-3">
          <a href="#consultar" onClick={e => { e.preventDefault(); document.querySelector("#consultar")?.scrollIntoView({ behavior: "smooth" }); }}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: grad, boxShadow: `0 8px 32px ${cfg.primaryColor}44` }}>
            <span>🔍</span> {pc.heroCta1}
          </a>
          <a href="#quem-somos" onClick={e => { e.preventDefault(); document.querySelector("#quem-somos")?.scrollIntoView({ behavior: "smooth" }); }}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,.07)", color: "rgba(255,255,255,.85)", border: "1px solid rgba(255,255,255,.12)" }}>
            {pc.heroCta2} →
          </a>
        </div>
        <div className="flex flex-wrap justify-center mt-16 anim-up-3">
          {([1,2,3,4] as const).map(i => (
            <div key={i} className="hero-stat-item">
              <span className="hero-stat-val">{pc[`heroStat${i}Val`]}</span>
              <span className="hero-stat-lbl">{pc[`heroStat${i}Lbl`]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 inset-x-0 flex justify-center z-10 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 flex items-start justify-center pt-2" style={{ borderColor: "rgba(255,255,255,.2)" }}>
          <div className="w-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,.4)" }} />
        </div>
      </div>
    </section>
  );
}

/* ── Banner Section (apenas carrossel na área cinza) */
function BannerSection({ cfg }: { cfg: Cfg }) {
  const [cur, setCur] = useState(0);
  const images = cfg.bannerImages;
  const next = useCallback(() => setCur(c => (c + 1) % images.length), [images.length]);
  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(next, 5000); return () => clearInterval(id);
  }, [next, images.length]);

  if (images.length === 0) return null;

  return (
    <div className="banner-section-wrap" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="banner-container" style={{ aspectRatio: "16/5" }}>
          {images.map((src, i) => (
            <div key={i} className="banner-slide-item" style={{ backgroundImage: `url(${src})`, opacity: i === cur ? 1 : 0 }} />
          ))}
          {images.length > 1 && (<>
            <button onClick={() => setCur(c => (c - 1 + images.length) % images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-white text-xl hover:scale-110 transition-all"
              style={{ background: "rgba(0,0,0,.35)", backdropFilter: "blur(8px)" }}>‹</button>
            <button onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-white text-xl hover:scale-110 transition-all"
              style={{ background: "rgba(0,0,0,.35)", backdropFilter: "blur(8px)" }}>›</button>
            <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 z-20">
              {images.map((_, i) => (
                <button key={i} onClick={() => setCur(i)} className="rounded-full transition-all duration-300"
                  style={{ width: i === cur ? 28 : 8, height: 8, background: i === cur ? "white" : "rgba(255,255,255,.4)" }} />
              ))}
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

/* ── Score Gauge (circular) ───────────────────── */
function ScoreGauge({ score, cs }: { score: number; cs: ColorScheme }) {
  const val = useCountUp(score);
  const color = score < 400 ? cs.scoreColorBad : score < 600 ? cs.scoreColorMid : cs.scoreColorGood;
  const r = 46; const circ = 2 * Math.PI * r;
  const pct = Math.min(score / 1000, 1);
  return (
    <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="9" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-black leading-none" style={{ color }}>{val}</p>
        <p className="text-[10px] font-semibold" style={{ color: "#94a3b8" }}>/1000</p>
      </div>
    </div>
  );
}

/* ── Consult Section ──────────────────────────── */
function ConsultSection({ cfg }: { cfg: Cfg }) {
  const { pc, cs } = cfg;
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfOk, setCpfOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DebtResult | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);
  const grad = `linear-gradient(135deg, ${cfg.primaryColor}, ${cfg.secondaryColor})`;

  function handleCpf(v: string) {
    const f = formatCPF(v); setCpf(f);
    const raw = f.replace(/\D/g, "");
    setCpfOk(raw.length === 11 ? validateCPF(raw) : null);
  }

  async function handleConsult() {
    if (!name.trim() || cpfOk !== true) { setError("Preencha seu nome e um CPF válido."); return; }
    setError(""); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/consult", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), cpf: cpf.replace(/\D/g, ""), visitorId: localStorage.getItem("_chat_vid") || undefined }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Erro ao consultar.");
      else { setResult(data); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }
    } catch { setError("Falha na conexão. Tente novamente."); }
    finally { setLoading(false); }
  }

  return (
    <section id="consultar" className="py-24 px-6" style={{ background: cs.consultBg }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <span className="section-tag mb-3"
            style={{ background: `${cfg.primaryColor}14`, color: cfg.primaryColor, border: `1px solid ${cfg.primaryColor}28` }}>
            <span>🔍</span> {pc.consultTag}
          </span>
          <h2 className="section-h2 mt-3" style={{ color: cs.titleColor }}>{pc.consultTitle}</h2>
          <p className="text-base mt-3" style={{ color: cs.subtitleColor }}>{pc.consultSubtitle}</p>
        </div>

        {!result ? (
          <div className="consult-card" style={{ background: cs.cardBg }}>
            <div className="h-1 w-full" style={{ background: grad }} />
            <div className="p-8 space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: cs.titleColor }}>Nome completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo"
                  className={`input-field ${name.trim().length > 2 ? "valid" : ""}`}
                  style={{ borderColor: cs.inputBorder }} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: cs.titleColor }}>CPF</label>
                <input type="text" value={cpf} onChange={e => handleCpf(e.target.value)}
                  placeholder="000.000.000-00" maxLength={14}
                  className={`input-field ${cpfOk === true ? "valid" : cpfOk === false ? "invalid" : ""}`}
                  style={{ borderColor: cpfOk === null ? cs.inputBorder : undefined }} />
                {cpfOk === false && <p className="text-xs mt-1.5 text-red-500 font-medium">CPF inválido.</p>}
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  <span>⚠️</span>{error}
                </div>
              )}
              <button onClick={handleConsult} disabled={loading || cpfOk !== true || !name.trim()}
                className="cta-btn" style={{ background: grad, boxShadow: `0 8px 24px ${cfg.primaryColor}38` }}>
                {loading ? (
                  <><span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Consultando...</>
                ) : (
                  <><span>🔍</span> {pc.consultCta}</>
                )}
              </button>
              <p className="text-center text-xs" style={{ color: "#94a3b8" }}>🔒 {pc.consultPrivacy}</p>
            </div>
          </div>
        ) : (
          <div ref={resultRef} className="space-y-4 anim-scale">

            {/* ── Alerta urgência — sempre exibido ── */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
              style={{ background: `${cs.scoreColorBad}0D`, border: `1px solid ${cs.scoreColorBad}33` }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: cs.scoreColorBad }}>
                    Dívida ativa localizada em seu nome
                  </p>
                  <p className="text-xs" style={{ color: cs.subtitleColor }}>Esta oferta é exclusiva e expira em: <Countdown /></p>
                </div>
              </div>
              <span className="text-xs font-black px-3 py-1 rounded-full flex-shrink-0 anim-urgency"
                style={{ background: cs.scoreColorBad, color: "white" }}>URGENTE</span>
            </div>

            {/* ── Cards: Dados + Score ── */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Dados da dívida */}
              <div className="result-card" style={{ background: cs.cardBg, borderColor: cs.cardBorder }}>
                <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: cs.cardBorder }}>
                  <span>📋</span>
                  <p className="font-bold text-sm" style={{ color: cs.titleColor }}>Dados da Dívida</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: "Nome", value: result.name },
                    { label: "CPF", value: formatCPF(result.cpf) },
                    { label: "Descrição", value: result.description },
                    { label: "Status", value: "Pendente" },
                  ].map(row => (
                    <div key={row.label} className="flex items-start justify-between gap-4">
                      <span className="text-xs font-semibold flex-shrink-0" style={{ color: cs.subtitleColor }}>{row.label}</span>
                      {row.label === "Status" ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full badge-pending">{row.value}</span>
                      ) : (
                        <span className="text-sm font-semibold text-right" style={{ color: cs.titleColor }}>{row.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Análise de crédito */}
              <div className="result-card" style={{ background: cs.cardBg, borderColor: cs.cardBorder }}>
                <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: cs.cardBorder }}>
                  <span>📊</span>
                  <p className="font-bold text-sm" style={{ color: cs.titleColor }}>Análise de Crédito</p>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <ScoreGauge score={result.score} cs={cs} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#94a3b8" }}>SCORE DE CRÉDITO</p>
                      <p className="text-sm font-bold" style={{ color: result.score < 400 ? cs.scoreColorBad : result.score < 600 ? cs.scoreColorMid : cs.scoreColorGood }}>
                        {result.score < 400 ? "Score Baixo" : result.score < 600 ? "Score Regular" : "Score Bom"}
                      </p>
                    </div>
                  </div>
                  <ScoreMeter score={result.score} label="" cs={cs} />
                  <div className="mt-4 p-3 rounded-xl" style={{ background: `${cs.scoreColorGood}0D`, border: `1px solid ${cs.scoreColorGood}28` }}>
                    <p className="text-xs font-bold mb-1" style={{ color: cs.scoreColorGood }}>🌟 Após regularizar:</p>
                    <p className="text-xl font-black" style={{ color: cs.scoreColorGood }}>
                      {result.scoreAfterPay} <span className="text-xs font-semibold">/1000 pontos</span>
                      <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${cs.scoreColorGood}22`, color: cs.scoreColorGood }}>
                        +{result.scoreAfterPay - result.score} pts
                      </span>
                    </p>
                    <p className="text-xs mt-1" style={{ color: cs.subtitleColor }}>Acesso a crédito, melhores taxas e oportunidades financeiras</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Oferta especial — sempre exibida ── */}
            {(
              <div className="result-card overflow-hidden" style={{ background: cs.cardBg, borderColor: cs.cardBorder }}>
                <div className="h-1 w-full" style={{ background: grad }} />
                <div className="px-6 py-5 border-b" style={{ borderColor: cs.cardBorder }}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span>🔥</span>
                    <p className="font-black text-base" style={{ color: cs.titleColor }}>Oferta Especial de Quitação</p>
                  </div>
                  <p className="text-sm" style={{ color: cs.subtitleColor }}>Pague agora e elimine sua dívida definitivamente</p>
                </div>

                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Pricing */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>Valor original</p>
                        <p className="price-original text-lg">{BRL(result.amount)}</p>
                      </div>
                      <div className="p-4 rounded-xl relative" style={{ background: `${cs.scoreColorGood}0A`, border: `1px solid ${cs.scoreColorGood}28` }}>
                        <span className="absolute -top-2.5 right-3 text-xs font-black px-2 py-0.5 rounded-full text-white"
                          style={{ background: cs.scoreColorGood }}>-{result.discount}% OFF</span>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: cs.scoreColorGood }}>Valor com desconto</p>
                        <p className="price-deal" style={{ color: cs.scoreColorGood }}>{BRL(result.discountedAmount)}</p>
                        <p className="text-xs font-semibold mt-1" style={{ color: cs.subtitleColor }}>
                          Economia de {BRL(result.amount - result.discountedAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#94a3b8" }}>O que você ganha:</p>
                      <div className="space-y-2">
                        {[
                          "Quitação definitiva da dívida",
                          "Aumento imediato do score de crédito",
                          "Acesso a financiamentos e crédito",
                          "Saída do cadastro de inadimplentes",
                          "Aprovação em cartões e empréstimos",
                          "Pagamento rápido via PIX",
                        ].map(b => (
                          <div key={b} className="flex items-center gap-2">
                            <span className="text-xs font-bold" style={{ color: cs.scoreColorGood }}>✓</span>
                            <span className="text-sm" style={{ color: cs.titleColor }}>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <a href={result.checkoutUrl || "#"} target="_blank" rel="noopener noreferrer"
                    className="cta-btn mt-6" style={{ background: grad, boxShadow: `0 8px 24px ${cfg.primaryColor}38` }}>
                    <span>💳</span> {cfg.ctaText} → {BRL(result.discountedAmount)}
                  </a>

                  <div className="flex items-center justify-center gap-6 mt-3">
                    {["🔒 Pagamento seguro", "⚡ PIX Instantâneo", "📄 Comprovante digital"].map(t => (
                      <span key={t} className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Social proof */}
            <div className="text-center px-4 py-3 rounded-xl" style={{ background: `${cfg.primaryColor}07`, border: `1px solid ${cfg.primaryColor}15` }}>
              <p className="text-xs" style={{ color: cs.subtitleColor }}>
                Milhares de brasileiros regularizaram suas dívidas e hoje têm{" "}
                <strong style={{ color: cfg.primaryColor }}>acesso ao crédito, financiamentos e novas oportunidades</strong>.
                <br />Não deixe uma dívida antiga bloquear o seu futuro. Este é o seu momento.
              </p>
            </div>

            <button onClick={() => { setResult(null); setName(""); setCpf(""); setCpfOk(null); }}
              className="w-full text-sm font-semibold py-3 rounded-xl border transition-all hover:opacity-70"
              style={{ borderColor: cs.inputBorder, color: cs.subtitleColor }}>
              ← Nova consulta
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Sobre Section ────────────────────────────── */
function SobreSection({ cfg }: { cfg: Cfg }) {
  const { pc, cs } = cfg;
  const grad = `linear-gradient(135deg, ${cfg.primaryColor}, ${cfg.secondaryColor})`;
  const features = [1,2,3,4,5,6].map(i => ({
    icon: pc[`feat${i}Icon` as keyof PageContent] as string,
    title: pc[`feat${i}Title` as keyof PageContent] as string,
    desc: pc[`feat${i}Desc` as keyof PageContent] as string,
  }));
  const stats = [1,2,3,4].map(i => ({
    val: pc[`aboutStat${i}Val` as keyof PageContent] as string,
    lbl: pc[`aboutStat${i}Lbl` as keyof PageContent] as string,
  }));

  return (
    <section id="quem-somos" className="py-24 px-6" style={{ background: cs.aboutBg }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="section-tag mb-3"
            style={{ background: `${cfg.primaryColor}10`, color: cfg.primaryColor, border: `1px solid ${cfg.primaryColor}22` }}>
            <span>🏢</span> {pc.aboutTag}
          </span>
          <h2 className="section-h2 mt-3" style={{ color: cs.titleColor }}>{pc.aboutTitle}</h2>
          <p className="text-base mt-4 max-w-xl mx-auto" style={{ color: cs.subtitleColor, lineHeight: 1.7 }}>{pc.aboutSubtitle}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {stats.map(s => (
            <div key={s.lbl} className="text-center p-6 rounded-2xl"
              style={{ background: `${cfg.primaryColor}08`, border: `1px solid ${cs.cardBorder}` }}>
              <p className="text-2xl font-black" style={{ color: cfg.primaryColor }}>{s.val}</p>
              <p className="text-xs mt-1 font-semibold" style={{ color: "#94a3b8" }}>{s.lbl}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(f => (
            <div key={f.title} className="feat-card" style={{ background: cs.cardBg, borderColor: cs.cardBorder }}>
              <div className="feat-icon" style={{ background: `${cfg.primaryColor}12` }}>
                <span>{f.icon}</span>
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: cs.titleColor }}>{f.title}</h3>
              <p className="text-sm" style={{ color: cs.subtitleColor, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Contato Section ──────────────────────────── */
function ContatoSection({ cfg }: { cfg: Cfg }) {
  const { pc, cs } = cfg;
  const grad = `linear-gradient(135deg, ${cfg.primaryColor}, ${cfg.secondaryColor})`;
  const contacts = [
    { icon: "📞", color: cfg.primaryColor, bg: `${cfg.primaryColor}12`, label: "Telefone / WhatsApp", value: pc.contactPhone, sub: pc.contactPhoneSub },
    { icon: "📧", color: cs.scoreColorGood, bg: `${cs.scoreColorGood}10`, label: "E-mail de suporte", value: pc.contactEmail, sub: pc.contactEmailSub },
    { icon: "📍", color: cs.accentColor, bg: `${cs.accentColor}10`, label: "Endereço", value: pc.contactAddress, sub: pc.contactAddressSub },
    { icon: "⏰", color: cfg.secondaryColor, bg: `${cfg.secondaryColor}10`, label: "Horário de atendimento", value: pc.contactHours, sub: pc.contactHoursSub },
  ];

  return (
    <section id="fale-conosco" className="py-24 px-6" style={{ background: cs.contactBg }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="section-tag mb-3"
            style={{ background: `${cfg.primaryColor}10`, color: cfg.primaryColor, border: `1px solid ${cfg.primaryColor}22` }}>
            <span>💬</span> {pc.contactTag}
          </span>
          <h2 className="section-h2 mt-3" style={{ color: cs.titleColor }}>{pc.contactTitle}</h2>
          <p className="text-base mt-3" style={{ color: cs.subtitleColor }}>{pc.contactSubtitle}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6 shadow-sm border" style={{ background: cs.cardBg, borderColor: cs.cardBorder }}>
            <h3 className="font-bold text-base mb-2" style={{ color: cs.titleColor }}>Canais de atendimento</h3>
            <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>Fale com nossa equipe especializada</p>
            {contacts.map(c => (
              <div key={c.label} className="contact-item">
                <div className="contact-icon" style={{ background: c.bg }}>
                  <span style={{ color: c.color }}>{c.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "#94a3b8" }}>{c.label}</p>
                  <p className="text-sm font-bold" style={{ color: cs.titleColor }}>{c.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{c.sub}</p>
                </div>
              </div>
            ))}
            <a
              href={cfg.whatsappNumber ? `https://wa.me/${cfg.whatsappNumber}` : "#"}
              target={cfg.whatsappNumber ? "_blank" : undefined}
              rel="noopener noreferrer"
              onClick={e => { if (!cfg.whatsappNumber) e.preventDefault(); }}
              className="mt-4 flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#25D366,#128C7E)", boxShadow: "0 6px 20px rgba(37,211,102,0.35)", opacity: cfg.whatsappNumber ? 1 : 0.5, cursor: cfg.whatsappNumber ? "pointer" : "default" }}>
              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Falar no WhatsApp
            </a>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${cs.heroBg} 0%, ${cs.footerBg} 100%)`, border: "1px solid rgba(255,255,255,.06)" }}>
            <div className="p-8 flex flex-col justify-between h-full gap-8">
              <div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5" style={{ background: `${cfg.primaryColor}20` }}>💡</div>
                <h3 className="text-xl font-black text-white mb-3">{pc.ctaCardTitle}</h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,.55)", lineHeight: 1.7 }}>{pc.ctaCardDesc}</p>
              </div>
              <div className="space-y-3">
                <a href="#consultar" onClick={e => { e.preventDefault(); document.querySelector("#consultar")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 hover:-translate-y-0.5"
                  style={{ background: grad, boxShadow: `0 8px 24px ${cfg.primaryColor}44` }}>
                  <span>🔍</span> {pc.ctaCardBtn}
                </a>
                <p className="text-center text-xs" style={{ color: "rgba(255,255,255,.3)" }}>Sem cadastro · Resultado imediato</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ───────────────────────────────────── */
function Footer({ cfg }: { cfg: Cfg }) {
  const { pc, cs } = cfg;
  const grad = `linear-gradient(135deg, ${cfg.primaryColor}, ${cfg.secondaryColor})`;
  const year = new Date().getFullYear();

  const cols = [
    { title: "Navegação", links: [
      { href: "#inicio", label: "Início" },
      { href: "#consultar", label: "Consultar Dívida" },
      { href: "#quem-somos", label: "Quem Somos" },
      { href: "#fale-conosco", label: "Fale Conosco" },
    ]},
    { title: "Legal", links: [
      { href: "#", label: "Política de Privacidade" },
      { href: "#", label: "Termos de Uso" },
      { href: "#", label: "LGPD" },
      { href: "#", label: "Cookies" },
    ]},
    { title: "Suporte", links: [
      { href: "#", label: "Central de Ajuda" },
      { href: "#", label: "Como funciona" },
      { href: "#", label: "Dúvidas frequentes" },
      { href: "#fale-conosco", label: "Fale conosco" },
    ]},
  ];

  function goTo(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (!href.startsWith("#") || href === "#") return;
    e.preventDefault();
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  }

  const socials = [
    { label: "𝕏", href: pc.socialX },
    { label: "in", href: pc.socialLinkedin },
    { label: "f", href: pc.socialFacebook },
  ];

  return (
    <footer className="pub-footer" style={{ background: cs.footerBg }}>
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,.4), transparent)" }} />
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-10 mb-14">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              {cfg.companyLogo ? (
                <img src={cfg.companyLogo} alt={cfg.companyName} style={{ height: cfg.logoHeight, maxWidth: 140, objectFit: "contain" }} />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black" style={{ background: grad }}>{cfg.companyName.charAt(0)}</div>
                  <span className="text-white font-black text-xl tracking-tight">{cfg.companyName}</span>
                </div>
              )}
            </div>
            <p className="text-sm" style={{ color: cs.footerTextColor, lineHeight: 1.7 }}>{pc.footerTagline}</p>
            <div className="flex gap-3 mt-5">
              {socials.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold cursor-pointer transition-all hover:opacity-70"
                  style={{ background: "rgba(255,255,255,.06)", color: cs.footerTextColor, border: "1px solid rgba(255,255,255,.08)" }}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: cs.footerTextColor, opacity: 0.6 }}>{col.title}</p>
              <div className="space-y-1">
                {col.links.map(l => (
                  <a key={l.label} href={l.href} onClick={e => goTo(e, l.href)} className="footer-link" style={{ color: cs.footerTextColor }}>{l.label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,.06)" }}>
          <span className="text-xs" style={{ color: cs.footerTextColor, opacity: 0.6 }}>
            © {year} {cfg.companyName}. Todos os direitos reservados.
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: `${cs.scoreColorGood}14`, color: cs.scoreColorGood, border: `1px solid ${cs.scoreColorGood}30` }}>
            🔒 {cfg.footerText}
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ── Chat Widget ──────────────────────────────── */
interface ChatMsg { id: number; content: string; sender: string; createdAt: string; }

function ChatWidget({ cfg }: { cfg: Cfg }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [lastId, setLastId] = useState(0);
  const [unread, setUnread] = useState(0);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const grad = `linear-gradient(135deg, ${cfg.primaryColor}, ${cfg.secondaryColor})`;

  function getVisitorId() {
    let vid = localStorage.getItem("_chat_vid");
    if (!vid) { vid = crypto.randomUUID(); localStorage.setItem("_chat_vid", vid); }
    return vid;
  }

  async function startSession() {
    if (started) return;
    setStarted(true);
    const vid = getVisitorId();
    const res = await fetch("/api/chat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: vid }),
    });
    if (res.ok) {
      const s = await res.json() as { id: number };
      setSessionId(s.id);
    }
  }

  async function pollMessages() {
    const vid = localStorage.getItem("_chat_vid");
    if (!vid) return;
    const res = await fetch(`/api/chat/messages?sid=${vid}&after=${lastId}`);
    if (!res.ok) return;
    const data = await res.json() as { messages: ChatMsg[] };
    if (data.messages.length > 0) {
      setMsgs(prev => [...prev, ...data.messages]);
      setLastId(data.messages[data.messages.length - 1].id);
      if (!open) setUnread(u => u + data.messages.filter((m: ChatMsg) => m.sender === "admin").length);
    }
  }

  // Start polling once session is created
  useEffect(() => {
    if (!started) return;
    const id = setInterval(pollMessages, 4000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, lastId, open]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      startSession();
      bottomRef.current?.scrollIntoView();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  async function sendMsg() {
    if (!input.trim() || sending) return;
    const vid = getVisitorId();
    setSending(true);
    const res = await fetch("/api/chat/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sid: vid, content: input.trim() }),
    });
    if (res.ok) {
      const msg = await res.json() as ChatMsg;
      setMsgs(prev => [...prev, msg]);
      setLastId(msg.id);
      setInput("");
    }
    setSending(false);
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 88, right: 20, zIndex: 999,
          width: 340, maxHeight: 480,
          background: "#fff", borderRadius: 20,
          boxShadow: "0 8px 48px rgba(0,0,0,.22)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "slideUpIn .25s cubic-bezier(.4,0,.2,1)",
        }}>
          {/* Header */}
          <div style={{ background: grad, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {(cfg.faviconUrl || cfg.companyLogo) ? (
                <img src={cfg.faviconUrl || cfg.companyLogo} alt={cfg.companyName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "#fff", fontWeight: 900, fontSize: 15 }}>{cfg.companyName.charAt(0)}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 14, margin: 0 }}>{cfg.companyName}</p>
              <p style={{ color: "rgba(255,255,255,.75)", fontSize: 11, margin: 0 }}>Suporte online · Resposta rápida</p>
            </div>
            <button onClick={() => setOpen(false)} style={{ color: "rgba(255,255,255,.8)", background: "none", border: "none", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px 4px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: 8 }}>
            {msgs.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 10px" }}>
                <p style={{ fontSize: 28, margin: "0 0 8px" }}>👋</p>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Olá! Como podemos ajudar você hoje?</p>
                <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Digite sua mensagem abaixo.</p>
              </div>
            )}
            {msgs.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.sender === "visitor" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "78%", padding: "8px 12px", borderRadius: 14,
                  fontSize: 13, lineHeight: 1.5,
                  ...(m.sender === "visitor"
                    ? { background: grad, color: "#fff", borderBottomRightRadius: 4 }
                    : { background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0", borderBottomLeftRadius: 4 }),
                }}>
                  <p style={{ margin: 0 }}>{m.content}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 10, opacity: 0.6, textAlign: "right" }}>
                    {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "8px 10px", borderTop: "1px solid #e2e8f0", background: "#fff", display: "flex", gap: 6 }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
              placeholder="Digite sua mensagem..."
              style={{ flex: 1, padding: "9px 12px", borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13, outline: "none", color: "#0f172a", background: "#f8fafc" }}
            />
            <button onClick={sendMsg} disabled={sending || !input.trim()}
              style={{ padding: "9px 14px", borderRadius: 12, background: grad, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: sending || !input.trim() ? 0.5 : 1 }}>
              →
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 1000,
        width: 56, height: 56, borderRadius: "50%",
        background: grad, border: "none", cursor: "pointer",
        boxShadow: `0 6px 24px ${cfg.primaryColor}55`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform .2s, box-shadow .2s",
      }}
        onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.1)")}
        onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
        {open ? (
          <span style={{ color: "#fff", fontSize: 22, lineHeight: 1 }}>×</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="white" style={{ width: 26, height: 26 }}>
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        )}
        {unread > 0 && !open && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            background: "#ef4444", color: "#fff", borderRadius: "50%",
            width: 20, height: 20, fontSize: 11, fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff",
          }}>{unread}</span>
        )}
      </button>
    </>
  );
}

/* ── Main Page ─────────────────────────────────── */
export default function PublicPage() {
  const [cfg, setCfg] = useState<Cfg>(DEF_CFG);

  useEffect(() => {
    fetch("/api/settings").then(r => r.ok ? r.json() : null).then(d => {
      if (!d) return;
      const pc = parseJson<PageContent>(d.pageContent, DEF_PC);
      const cs = parseJson<ColorScheme>(d.colorScheme, DEF_CS);
      setCfg({
        companyName:    d.companyName    || DEF_CFG.companyName,
        companyLogo:    d.companyLogo    || DEF_CFG.companyLogo,
        logoHeight:     d.logoHeight     || DEF_CFG.logoHeight,
        primaryColor:   d.primaryColor   || DEF_CFG.primaryColor,
        secondaryColor: d.secondaryColor || DEF_CFG.secondaryColor,
        urgencyText:    d.urgencyText    || DEF_CFG.urgencyText,
        ctaText:        d.ctaText        || DEF_CFG.ctaText,
        footerText:     d.footerText     || DEF_CFG.footerText,
        bannerImages:    Array.isArray(d.bannerImages) ? d.bannerImages
          : (typeof d.bannerImages === "string" ? JSON.parse(d.bannerImages || "[]") : []),
        faviconUrl:      d.faviconUrl      || DEF_CFG.faviconUrl,
        pageTitle:       d.pageTitle       || DEF_CFG.pageTitle,
        whatsappNumber:  d.whatsappNumber  || DEF_CFG.whatsappNumber,
        pc, cs,
      });
      // Atualiza título da guia
      document.title = d.pageTitle || d.companyName || "NegociAI";
      // Atualiza favicon
      if (d.faviconUrl) {
        const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']") || document.createElement("link");
        link.type = "image/x-icon"; link.rel = "shortcut icon"; link.href = d.faviconUrl;
        document.head.appendChild(link);
      }
    }).catch(() => {});
  }, []);

  const { pc } = cfg;

  return (
    <main style={{ fontFamily: '"Inter", system-ui, sans-serif', "--primary": cfg.primaryColor, "--secondary": cfg.secondaryColor } as React.CSSProperties}>
      <Navbar cfg={cfg} />
      {cfg.pc.promoBannerUrl ? <HeroBannerSection cfg={cfg} /> : <HeroSection cfg={cfg} />}
      <BannerSection cfg={cfg} />
      <SectionBanner url={pc.sectionBannerConsultUrl} link={pc.sectionBannerConsultLink} />
      <ConsultSection cfg={cfg} />
      <SectionBanner url={pc.sectionBannerSobreUrl} link={pc.sectionBannerSobreLink} />
      <SobreSection cfg={cfg} />
      <SectionBanner url={pc.sectionBannerContatoUrl} link={pc.sectionBannerContatoLink} />
      <ContatoSection cfg={cfg} />
      <Footer cfg={cfg} />
      <ChatWidget cfg={cfg} />
    </main>
  );
}
