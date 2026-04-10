"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { formatCPF, validateCPF } from "@/lib/cpf";

/* ─── Types ─────────────────────────────────────────── */
interface Campaign {
  id: number; slug: string; name: string;
  companyName: string; companyLogo: string; logoHeight: number;
  primaryColor: string; secondaryColor: string;
  faviconUrl: string; pageTitle: string;
  headerTitle: string; headerSubtitle: string;
  discountPercent: number; defaultDebtAmount: number; defaultDebtDesc: string;
  checkoutUrl: string; scoreMin: number; scoreMax: number; scoreAfterPay: number;
  urgencyText: string; ctaText: string; footerText: string;
  whatsappNumber: string;
  bannerImages: string;
  pageContent: string;
  colorScheme: string;
}
interface PageContent {
  heroTag?: string; heroTitleLine1?: string; heroTitleAccent?: string;
  heroSubtitle?: string; heroCta1?: string; heroCta2?: string;
  heroStat1Val?: string; heroStat1Lbl?: string;
  heroStat2Val?: string; heroStat2Lbl?: string;
  heroStat3Val?: string; heroStat3Lbl?: string;
  heroStat4Val?: string; heroStat4Lbl?: string;
  promoBannerUrl?: string; promoBannerLink?: string;
  sectionBannerConsultUrl?: string; sectionBannerConsultLink?: string;
  sectionBannerSobreUrl?: string; sectionBannerSobreLink?: string;
  sectionBannerContatoUrl?: string; sectionBannerContatoLink?: string;
  consultTag?: string; consultTitle?: string; consultSubtitle?: string;
  consultCta?: string; consultPrivacy?: string;
  aboutTag?: string; aboutTitle?: string; aboutSubtitle?: string;
  aboutStat1Val?: string; aboutStat1Lbl?: string;
  aboutStat2Val?: string; aboutStat2Lbl?: string;
  aboutStat3Val?: string; aboutStat3Lbl?: string;
  aboutStat4Val?: string; aboutStat4Lbl?: string;
  feat1Icon?: string; feat1Title?: string; feat1Desc?: string;
  feat2Icon?: string; feat2Title?: string; feat2Desc?: string;
  feat3Icon?: string; feat3Title?: string; feat3Desc?: string;
  feat4Icon?: string; feat4Title?: string; feat4Desc?: string;
  feat5Icon?: string; feat5Title?: string; feat5Desc?: string;
  feat6Icon?: string; feat6Title?: string; feat6Desc?: string;
  contactTag?: string; contactTitle?: string; contactSubtitle?: string;
  contactPhone?: string; contactPhoneSub?: string;
  contactEmail?: string; contactEmailSub?: string;
  contactAddress?: string; contactAddressSub?: string;
  contactHours?: string; contactHoursSub?: string;
  ctaCardTitle?: string; ctaCardDesc?: string; ctaCardBtn?: string;
  footerTagline?: string;
  socialX?: string; socialLinkedin?: string; socialFacebook?: string;
}
interface ColorScheme {
  heroBg?: string; accentColor?: string;
  navBg?: string; navTextColor?: string;
  consultBg?: string; aboutBg?: string; contactBg?: string;
  footerBg?: string; footerTextColor?: string;
  titleColor?: string; subtitleColor?: string;
  cardBg?: string; cardBorder?: string;
  inputBorder?: string; inputFocusBorder?: string;
  scoreColorBad?: string; scoreColorMid?: string; scoreColorGood?: string;
}
interface DebtResult {
  found: boolean; debtorId: number | null;
  name: string; cpf: string; amount: number;
  discountedAmount: number; description: string;
  status: string; discount: number; score: number;
  scoreAfterPay: number; checkoutUrl: string;
}

/* ─── Helpers ────────────────────────────────────────── */
function parseJson<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw) return fallback;
  try { return { ...fallback, ...JSON.parse(raw) }; } catch { return fallback; }
}
function parseBanners(raw: string | undefined | null): string[] {
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
}
function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ─── Sub-components ─────────────────────────────────── */
function BannerCarousel({ images, primary }: { images: string[]; primary: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length]);
  if (!images.length) return null;
  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", aspectRatio: "16/5" }}>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt={`Banner ${i + 1}`} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: i === idx ? 1 : 0, transition: "opacity .6s ease",
        }} />
      ))}
      {images.length > 1 && (
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
          {images.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 20 : 7, height: 7, borderRadius: 99,
              background: i === idx ? primary : "rgba(255,255,255,.4)",
              border: "none", cursor: "pointer", transition: "all .3s", padding: 0,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreMeter({ score, scoreAfterPay, primary, colorBad = "#ef4444", colorMid = "#f59e0b", colorGood = "#22c55e" }: {
  score: number; scoreAfterPay: number; primary: string;
  colorBad?: string; colorMid?: string; colorGood?: string;
}) {
  const pct = Math.min(100, Math.max(0, (score / 1000) * 100));
  const color = score < 400 ? colorBad : score < 600 ? colorMid : colorGood;
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>Score atual</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score} pts</span>
      </div>
      <div style={{ height: 10, borderRadius: 99, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 99, background: `linear-gradient(90deg, ${colorBad}, ${color})`, transition: "width 1s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 11, color: colorBad }}>Ruim</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>Regular</span>
        <span style={{ fontSize: 11, color: colorGood }}>Bom</span>
      </div>
      <div style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(34,197,94,.08)", border: "1px solid rgba(34,197,94,.2)", fontSize: 12, color: "#4ade80", textAlign: "center" }}>
        Ao quitar, seu score pode chegar a <strong style={{ color: "#86efac" }}>{scoreAfterPay} pts</strong>
      </div>
    </div>
  );
}

function Countdown() {
  const [seconds, setSeconds] = useState(600);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 600), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{m}:{s}</span>;
}

/* ─── Page ───────────────────────────────────────────── */
export default function CampaignPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [consulting, setConsulting] = useState(false);
  const [result, setResult] = useState<DebtResult | null>(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const visitorId = useRef(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
  );
  const trackedCheckout = useRef(false);

  useEffect(() => {
    fetch(`/api/c/${slug}`)
      .then(r => r.json())
      .then(data => { if (data.error) setNotFound(true); else setCampaign(data); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleCPFChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  }, []);

  async function handleConsult(e: React.FormEvent) {
    e.preventDefault();
    if (!campaign) return;
    if (!validateCPF(cpf)) { setError("CPF inválido. Verifique e tente novamente."); return; }
    setError(""); setConsulting(true); setResult(null);
    try {
      const res = await fetch(`/api/c/${slug}/consult`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cpf, visitorId: visitorId.current }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Erro ao consultar.");
      else setResult(data);
    } catch { setError("Erro de conexão. Tente novamente."); }
    finally { setConsulting(false); }
  }

  async function handleCheckout() {
    if (!result || !campaign) return;
    if (!trackedCheckout.current) {
      trackedCheckout.current = true;
      fetch(`/api/c/${slug}/track`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: result.name, cpf: result.cpf, event: "CLIQUE_PAGAMENTO", debtorId: result.debtorId }),
      }).catch(() => {});
    }
    if (result.checkoutUrl) window.open(result.checkoutUrl, "_blank");
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#09090b", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,.1)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>Carregando...</p>
      </div>
    </div>
  );

  if (notFound || !campaign) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#09090b", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center", color: "#f8fafc" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>404</div>
        <p style={{ color: "rgba(255,255,255,.5)" }}>Campanha não encontrada.</p>
      </div>
    </div>
  );

  /* ── Parsed data ── */
  const primary   = campaign.primaryColor   || "#6366f1";
  const secondary = campaign.secondaryColor || "#8b5cf6";
  const grad      = `linear-gradient(135deg, ${primary}, ${secondary})`;

  const pc = parseJson<PageContent>(campaign.pageContent, {});
  const cs = parseJson<ColorScheme>(campaign.colorScheme, {});
  const banners = parseBanners(campaign.bannerImages);

  const heroBg        = cs.heroBg        || "#060A14";
  const navBg         = cs.navBg         || "rgba(6,10,20,.88)";
  const navTextColor  = cs.navTextColor  || "rgba(255,255,255,.75)";
  const consultBg     = cs.consultBg     || "#F0F4F8";
  const aboutBg       = cs.aboutBg       || "#ffffff";
  const contactBg     = cs.contactBg     || "#F0F4F8";
  const footerBg      = cs.footerBg      || "#060A14";
  const footerTextColor = cs.footerTextColor || "rgba(255,255,255,.35)";
  const titleColor    = cs.titleColor    || "#0F172A";
  const subtitleColor = cs.subtitleColor || "#64748b";
  const cardBg        = cs.cardBg        || "#ffffff";
  const cardBorder    = cs.cardBorder    || "#E8EEF8";
  const scoreColorBad  = cs.scoreColorBad  || "#ef4444";
  const scoreColorMid  = cs.scoreColorMid  || "#f59e0b";
  const scoreColorGood = cs.scoreColorGood || "#22c55e";

  /* Hero texts */
  const heroTag      = pc.heroTag       || campaign.urgencyText      || "⚡ Oferta por tempo limitado";
  const heroTitle1   = pc.heroTitleLine1 || "Regularize sua situação";
  const heroAccent   = pc.heroTitleAccent || "financeira agora";
  const heroSubtitle = pc.heroSubtitle  || campaign.headerSubtitle   || "Quite sua dívida com até 60% de desconto.";
  const heroCta1     = pc.heroCta1      || "Consultar minha dívida";
  const heroCta2     = pc.heroCta2      || "Saiba mais";
  const consultPrivacy = pc.consultPrivacy || "Consulta 100% gratuita e segura · Sem cadastro";

  const stats = [
    { val: pc.heroStat1Val || "R$ 2.8B+", lbl: pc.heroStat1Lbl || "Dívidas negociadas" },
    { val: pc.heroStat2Val || "340K+",    lbl: pc.heroStat2Lbl || "CPFs regularizados" },
    { val: pc.heroStat3Val || "60%",      lbl: pc.heroStat3Lbl || "Desconto médio" },
    { val: pc.heroStat4Val || "4.9★",     lbl: pc.heroStat4Lbl || "Avaliação média" },
  ];

  const features = [
    { icon: pc.feat1Icon || "🔍", title: pc.feat1Title || "Transparência total",       desc: pc.feat1Desc || "Informações claras, sem surpresas ou taxas ocultas." },
    { icon: pc.feat2Icon || "⚡", title: pc.feat2Title || "Negociação instantânea",    desc: pc.feat2Desc || "100% digital. Consulte e quite em minutos." },
    { icon: pc.feat3Icon || "🛡️", title: pc.feat3Title || "Segurança garantida",       desc: pc.feat3Desc || "Criptografia de ponta a ponta. Seus dados protegidos." },
    { icon: pc.feat4Icon || "📈", title: pc.feat4Title || "Score em alta",             desc: pc.feat4Desc || "Após quitar, seu score sobe automaticamente." },
    { icon: pc.feat5Icon || "🤝", title: pc.feat5Title || "Descontos reais",           desc: pc.feat5Desc || "Negociamos com os credores para garantir os maiores descontos." },
    { icon: pc.feat6Icon || "📞", title: pc.feat6Title || "Suporte humanizado",        desc: pc.feat6Desc || "Equipe disponível para te ajudar em cada etapa." },
  ];

  const aboutStats = [
    { val: pc.aboutStat1Val || "2018",    lbl: pc.aboutStat1Lbl || "Fundada em" },
    { val: pc.aboutStat2Val || "340K+",   lbl: pc.aboutStat2Lbl || "Clientes atendidos" },
    { val: pc.aboutStat3Val || "R$ 2.8B+",lbl: pc.aboutStat3Lbl || "Em dívidas negociadas" },
    { val: pc.aboutStat4Val || "4.9/5",   lbl: pc.aboutStat4Lbl || "Avaliação no Reclame Aqui" },
  ];

  const contactCards = [
    { icon: "📞", title: pc.contactPhone || "(11) 91234-5678", sub: pc.contactPhoneSub || "Seg–Sex, 8h às 20h" },
    { icon: "✉️", title: pc.contactEmail || "suporte@negociai.com.br", sub: pc.contactEmailSub || "Resposta em até 2h úteis" },
    { icon: "📍", title: pc.contactAddress || "Av. Paulista, 1000 — SP", sub: pc.contactAddressSub || "CEP 01310-100" },
    { icon: "🕐", title: pc.contactHours || "Segunda à Sexta, 8h às 20h", sub: pc.contactHoursSub || "Sábados, 9h às 14h" },
  ];

  const navLinks = [
    { label: "Início",       id: "inicio" },
    { label: "Consultar",    id: "consultar" },
    { label: "Quem Somos",   id: "quem-somos" },
    { label: "Contato",      id: "fale-conosco" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: ${heroBg}; color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; }
        a { text-decoration: none; }
        .cp-input {
          width: 100%; padding: 14px 18px;
          background: rgba(255,255,255,.07);
          border: 1.5px solid rgba(255,255,255,.13);
          border-radius: 12px; color: #f8fafc; font-size: 15px; font-family: inherit;
          outline: none; transition: border-color .2s, box-shadow .2s;
        }
        .cp-input:focus { border-color: ${primary}; box-shadow: 0 0 0 3px ${primary}22; }
        .cp-input::placeholder { color: rgba(255,255,255,.25); }
        .cp-btn {
          width: 100%; padding: 15px;
          background: ${grad};
          border: none; border-radius: 12px; color: #fff;
          font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer;
          letter-spacing: .02em; transition: opacity .2s, transform .1s;
        }
        .cp-btn:hover { opacity: .9; }
        .cp-btn:active { transform: scale(.99); }
        .cp-btn:disabled { opacity: .5; cursor: not-allowed; }
        .cp-btn-outline {
          padding: 14px 28px; border: 2px solid rgba(255,255,255,.2);
          border-radius: 12px; color: rgba(255,255,255,.8); background: transparent;
          font-size: 15px; font-weight: 600; font-family: inherit; cursor: pointer;
          transition: border-color .2s, color .2s;
        }
        .cp-btn-outline:hover { border-color: rgba(255,255,255,.5); color: #fff; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp .4s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-glow { 0%,100%{ box-shadow:0 0 30px ${primary}33 } 50%{ box-shadow:0 0 60px ${primary}66 } }
        @keyframes float { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-8px) } }
        .hero-card { animation: pulse-glow 4s ease-in-out infinite; }
        @media(max-width:768px){
          .hero-cols { flex-direction: column !important; }
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .about-stats { grid-template-columns: repeat(2,1fr) !important; }
          .contact-grid { grid-template-columns: 1fr !important; }
          .nav-links-desktop { display: none !important; }
          .menu-btn { display: flex !important; }
        }
        @media(min-width:769px){
          .menu-btn { display: none !important; }
          .nav-mobile { display: none !important; }
        }
      `}</style>

      {/* Favicon */}
      {campaign.faviconUrl && <link rel="icon" href={campaign.faviconUrl} />}

      {/* ── NAVBAR ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: navBg, backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.07)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          {/* Logo */}
          <div style={{ flexShrink: 0 }}>
            {campaign.companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={campaign.companyLogo} alt={campaign.companyName} style={{ height: campaign.logoHeight || 40, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc" }}>{campaign.companyName}</span>
            )}
          </div>

          {/* Links desktop */}
          <nav className="nav-links-desktop" style={{ display: "flex", gap: 32 }}>
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: navTextColor, fontSize: 14, fontWeight: 500, fontFamily: "inherit", transition: "color .2s" }}
                onMouseOver={e => (e.currentTarget.style.color = "#fff")}
                onMouseOut={e => (e.currentTarget.style.color = navTextColor)}>
                {l.label}
              </button>
            ))}
          </nav>

          {/* CTA nav */}
          <button onClick={() => scrollTo("consultar")} className="nav-links-desktop"
            style={{ background: grad, border: "none", borderRadius: 10, padding: "9px 20px", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
            Consultar dívida
          </button>

          {/* Hamburguer */}
          <button className="menu-btn" onClick={() => setMenuOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#f8fafc", flexDirection: "column", gap: 5, padding: 4, display: "none" }}>
            <span style={{ display: "block", width: 22, height: 2, background: "currentColor", transition: "all .2s", transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 2, background: "currentColor", opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: "block", width: 22, height: 2, background: "currentColor", transition: "all .2s", transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none" }} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="nav-mobile" style={{ borderTop: "1px solid rgba(255,255,255,.07)", padding: "16px 0" }}>
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                style={{ display: "block", width: "100%", background: "none", border: "none", textAlign: "left", padding: "12px 24px", color: navTextColor, fontSize: 15, fontFamily: "inherit", cursor: "pointer" }}>
                {l.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section id="inicio" style={{ background: `linear-gradient(160deg, ${heroBg} 0%, ${primary}14 50%, ${heroBg} 100%)`, padding: "80px 24px 60px", minHeight: "88vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>

          {/* Promo banner (opcional) */}
          {pc.promoBannerUrl ? (
            <a href={pc.promoBannerLink || "#consultar"}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pc.promoBannerUrl} alt="Promo" style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 16, marginBottom: 40 }} />
            </a>
          ) : null}

          <div className="hero-cols" style={{ display: "flex", gap: 48, alignItems: "center" }}>
            {/* Left */}
            <div style={{ flex: 1 }}>
              {/* Tag */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 99, background: `${primary}18`, border: `1px solid ${primary}44`, fontSize: 13, fontWeight: 600, color: primary, marginBottom: 24 }}>
                {heroTag}
                <span style={{ color: "rgba(255,255,255,.35)", fontWeight: 400 }}>—</span>
                <Countdown />
              </div>

              {/* Title */}
              <h1 style={{ fontSize: "clamp(28px, 4.5vw, 52px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
                <span style={{ color: "#f8fafc" }}>{heroTitle1} </span>
                <span style={{ background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{heroAccent}</span>
              </h1>

              <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,.55)", lineHeight: 1.7, marginBottom: 36, maxWidth: 500 }}>
                {heroSubtitle}
              </p>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => scrollTo("consultar")} style={{ background: grad, border: "none", borderRadius: 12, padding: "15px 32px", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                  {heroCta1}
                </button>
                <button onClick={() => scrollTo("quem-somos")} className="cp-btn-outline">
                  {heroCta2}
                </button>
              </div>
            </div>

            {/* Right — stats */}
            <div style={{ flex: "0 0 auto", width: "min(360px, 100%)" }}>
              <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {stats.map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "20px", textAlign: "center" }}>
                    <div style={{ fontSize: "clamp(18px, 3vw, 28px)", fontWeight: 800, background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 4 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BANNER CAROUSEL ── */}
      {banners.length > 0 && (
        <div style={{ background: heroBg, padding: "0 24px 32px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <BannerCarousel images={banners} primary={primary} />
          </div>
        </div>
      )}

      {/* ── SECTION BANNER CONSULTA ── */}
      {pc.sectionBannerConsultUrl && (
        <a href={pc.sectionBannerConsultLink || "#consultar"} style={{ display: "block" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pc.sectionBannerConsultUrl} alt="Banner" style={{ width: "100%", maxHeight: 180, objectFit: "cover" }} />
        </a>
      )}

      {/* ── CONSULTA ── */}
      <section id="consultar" style={{ background: consultBg, padding: "72px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          {/* Tag */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 99, background: `${primary}15`, border: `1px solid ${primary}30`, fontSize: 12, fontWeight: 700, color: primary, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 16 }}>
              {pc.consultTag || "Consulta gratuita"}
            </span>
            <h2 style={{ fontSize: "clamp(22px, 3.5vw, 36px)", fontWeight: 800, color: titleColor, marginBottom: 12 }}>
              {pc.consultTitle || "Consulte sua dívida"}
            </h2>
            <p style={{ fontSize: 15, color: subtitleColor, lineHeight: 1.7 }}>
              {pc.consultSubtitle || "Digite seu nome e CPF para verificar pendências e receber uma proposta personalizada."}
            </p>
          </div>

          {/* Form card */}
          <div className="hero-card" style={{ background: "#0F172A", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "36px 32px" }}>
            {!result ? (
              <form onSubmit={handleConsult} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.45)", marginBottom: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>Nome completo</label>
                  <input className="cp-input" type="text" placeholder="Digite seu nome completo" value={name} onChange={e => setName(e.target.value)} required minLength={3} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.45)", marginBottom: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>CPF</label>
                  <input className="cp-input" type="text" inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={handleCPFChange} required maxLength={14} />
                </div>
                {error && (
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#f87171", fontSize: 13 }}>
                    {error}
                  </div>
                )}
                <button className="cp-btn" type="submit" disabled={consulting}>
                  {consulting ? "Consultando..." : (pc.consultCta || "Consultar minha situação")}
                </button>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,.25)", textAlign: "center" }}>
                  🔒 {consultPrivacy}
                </p>
              </form>
            ) : (
              <div className="fade-up">
                <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Resultado para</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc" }}>{result.name}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 2 }}>CPF: {result.cpf}</div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <ScoreMeter score={result.score} scoreAfterPay={result.scoreAfterPay} primary={primary}
                    colorBad={scoreColorBad} colorMid={scoreColorMid} colorGood={scoreColorGood} />
                </div>

                <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 14, padding: "18px 20px", marginBottom: 16, border: "1px solid rgba(255,255,255,.08)" }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 10 }}>{result.description}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,.3)", textDecoration: "line-through", marginBottom: 2 }}>{fmtBRL(result.amount)}</div>
                      <div style={{ fontSize: 30, fontWeight: 900, color: "#f8fafc" }}>{fmtBRL(result.discountedAmount)}</div>
                    </div>
                    <div style={{ padding: "8px 14px", borderRadius: 10, background: `${primary}22`, border: `1px solid ${primary}44`, fontSize: 16, fontWeight: 800, color: primary }}>
                      -{result.discount}%
                    </div>
                  </div>
                </div>

                <button className="cp-btn" onClick={handleCheckout}>{campaign.ctaText}</button>

                {campaign.whatsappNumber && (
                  <a href={`https://wa.me/${campaign.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "rgba(37,211,102,.08)", border: "1px solid rgba(37,211,102,.2)", color: "#4ade80", fontSize: 14, fontWeight: 600 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Tirar dúvidas no WhatsApp
                  </a>
                )}

                <button onClick={() => { setResult(null); setCpf(""); setName(""); trackedCheckout.current = false; }}
                  style={{ marginTop: 14, display: "block", width: "100%", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.3)", fontSize: 13, fontFamily: "inherit", textDecoration: "underline" }}>
                  Nova consulta
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION BANNER SOBRE ── */}
      {pc.sectionBannerSobreUrl && (
        <a href={pc.sectionBannerSobreLink || "#quem-somos"} style={{ display: "block" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pc.sectionBannerSobreUrl} alt="Banner" style={{ width: "100%", maxHeight: 180, objectFit: "cover" }} />
        </a>
      )}

      {/* ── QUEM SOMOS ── */}
      <section id="quem-somos" style={{ background: aboutBg, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 99, background: `${primary}12`, border: `1px solid ${primary}28`, fontSize: 12, fontWeight: 700, color: primary, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 16 }}>
              {pc.aboutTag || "Nossa empresa"}
            </span>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, color: titleColor, marginBottom: 16 }}>
              {pc.aboutTitle || "Quem somos"}
            </h2>
            <p style={{ fontSize: 16, color: subtitleColor, maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
              {pc.aboutSubtitle || "Somos uma plataforma de renegociação de dívidas que conecta pessoas às melhores propostas de quitação."}
            </p>
          </div>

          {/* Stats */}
          <div className="about-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 56 }}>
            {aboutStats.map((s, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: "28px 20px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                <div style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6 }}>{s.val}</div>
                <div style={{ fontSize: 13, color: subtitleColor }}>{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: titleColor, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: subtitleColor, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION BANNER CONTATO ── */}
      {pc.sectionBannerContatoUrl && (
        <a href={pc.sectionBannerContatoLink || "#fale-conosco"} style={{ display: "block" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pc.sectionBannerContatoUrl} alt="Banner" style={{ width: "100%", maxHeight: 180, objectFit: "cover" }} />
        </a>
      )}

      {/* ── CONTATO ── */}
      <section id="fale-conosco" style={{ background: contactBg, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 99, background: `${primary}12`, border: `1px solid ${primary}28`, fontSize: 12, fontWeight: 700, color: primary, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 16 }}>
              {pc.contactTag || "Atendimento"}
            </span>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 40px)", fontWeight: 800, color: titleColor, marginBottom: 12 }}>
              {pc.contactTitle || "Fale conosco"}
            </h2>
            <p style={{ fontSize: 15, color: subtitleColor, maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
              {pc.contactSubtitle || "Nossa equipe está pronta para te ajudar. Escolha o canal de sua preferência."}
            </p>
          </div>

          <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, maxWidth: 800, margin: "0 auto 48px" }}>
            {contactCards.map((c, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, padding: "24px", display: "flex", gap: 16, alignItems: "flex-start", boxShadow: "0 2px 12px rgba(0,0,0,.05)" }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: titleColor, marginBottom: 4 }}>{c.title}</div>
                  <div style={{ fontSize: 13, color: subtitleColor }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Card */}
          <div style={{ maxWidth: 700, margin: "0 auto", background: `linear-gradient(135deg, ${primary}18, ${secondary}12)`, border: `1px solid ${primary}30`, borderRadius: 20, padding: "40px 36px", textAlign: "center" }}>
            <h3 style={{ fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 800, color: titleColor, marginBottom: 12 }}>
              {pc.ctaCardTitle || "Pronto para limpar seu nome?"}
            </h3>
            <p style={{ fontSize: 15, color: subtitleColor, marginBottom: 28, lineHeight: 1.6 }}>
              {pc.ctaCardDesc || "Consulte sua situação gratuitamente e descubra o desconto que preparamos para você."}
            </p>
            <button onClick={() => scrollTo("consultar")} style={{ background: grad, border: "none", borderRadius: 12, padding: "15px 36px", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
              {pc.ctaCardBtn || "Consultar dívida grátis"}
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: footerBg, padding: "48px 24px 32px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
            {/* Brand */}
            <div style={{ flex: "0 0 auto" }}>
              {campaign.companyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={campaign.companyLogo} alt={campaign.companyName} style={{ height: (campaign.logoHeight || 40) * 0.8, objectFit: "contain", marginBottom: 12, filter: "brightness(0) invert(1)", opacity: .7 }} />
              ) : (
                <span style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", display: "block", marginBottom: 12 }}>{campaign.companyName}</span>
              )}
              <p style={{ fontSize: 13, color: footerTextColor, maxWidth: 300, lineHeight: 1.7 }}>
                {pc.footerTagline || "Plataforma líder em renegociação de dívidas. Transparência e segurança para você recuperar sua liberdade financeira."}
              </p>
            </div>

            {/* Nav links */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.25)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>Navegação</div>
              {navLinks.map(l => (
                <button key={l.id} onClick={() => scrollTo(l.id)}
                  style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: footerTextColor, fontSize: 14, fontFamily: "inherit", marginBottom: 10, textAlign: "left", transition: "color .2s" }}
                  onMouseOver={e => (e.currentTarget.style.color = "rgba(255,255,255,.7)")}
                  onMouseOut={e => (e.currentTarget.style.color = footerTextColor)}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* Social */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.25)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>Redes sociais</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "X", href: pc.socialX || "#", icon: "𝕏" },
                  { label: "LinkedIn", href: pc.socialLinkedin || "#", icon: "in" },
                  { label: "Facebook", href: pc.socialFacebook || "#", icon: "f" },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: footerTextColor, fontSize: 14, fontWeight: 700, transition: "background .2s" }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 24, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, color: footerTextColor }}>
              © {new Date().getFullYear()} {campaign.companyName}. Todos os direitos reservados.
            </p>
            <p style={{ fontSize: 12, color: footerTextColor, display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              {campaign.footerText}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
