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
  heroCheck1?: string; heroCheck2?: string; heroCheck3?: string;
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
  offerBenefits?: string; // JSON array de strings
  chatCompanyName?: string; chatSubtitle?: string; chatWelcome?: string;
}
interface ColorScheme {
  heroBg?: string; accentColor?: string;
  navBg?: string; navTextColor?: string;
  consultBg?: string; aboutBg?: string; contactBg?: string;
  footerBg?: string; footerTextColor?: string;
  titleColor?: string; subtitleColor?: string;
  cardBg?: string; cardBorder?: string; cardTextColor?: string;
  scoreColorBad?: string; scoreColorMid?: string; scoreColorGood?: string;
}
interface DebtResult {
  found: boolean; debtorId: number | null;
  name: string; cpf: string; amount: number;
  discountedAmount: number; description: string;
  status: string; discount: number; score: number;
  scoreAfterPay: number; checkoutUrl: string;
}
interface ChatMsg { id: number; content: string; sender: string; createdAt: string; }

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

/* ─── Banner Carousel ────────────────────────────────── */
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

/* ─── Circular Score ─────────────────────────────────── */
function CircularScore({ score, colorBad, colorMid, colorGood }: {
  score: number; colorBad: string; colorMid: string; colorGood: string;
}) {
  const pct = Math.min(100, Math.max(0, score / 1000));
  const color = score < 400 ? colorBad : score < 600 ? colorMid : colorGood;
  const label = score < 400 ? "Score Baixo" : score < 600 ? "Score Regular" : "Score Bom";
  const r = 44; const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="10" />
          <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.4)" }}>/1000</span>
          <span style={{ fontSize: 10, fontWeight: 600, color, marginTop: 2 }}>{Math.round(pct * 100)}%</span>
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, padding: "3px 10px", borderRadius: 99, background: `${color}18`, border: `1px solid ${color}33` }}>{label}</span>
      <div style={{ width: "100%", maxWidth: 200 }}>
        <div style={{ height: 6, borderRadius: 99, background: `linear-gradient(90deg, ${colorBad}, ${colorMid}, ${colorGood})`, marginBottom: 4 }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: colorBad }}>Ruim</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>Regular</span>
          <span style={{ fontSize: 10, color: colorGood }}>Bom</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Countdown ──────────────────────────────────────── */
function Countdown() {
  const [s, setS] = useState(5999);
  useEffect(() => {
    const t = setInterval(() => setS(v => v > 0 ? v - 1 : 5999), 1000);
    return () => clearInterval(t);
  }, []);
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{m}:{sec}</span>;
}

/* ─── Chat Widget ────────────────────────────────────── */
function ChatWidget({ visitorId, primary, secondary, companyName, companyLogo, pc, campaignId }: {
  visitorId: string; primary: string; secondary: string;
  companyName: string; companyLogo: string; pc: PageContent; campaignId: number;
}) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [closed, setClosed] = useState(false);
  const lastIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const grad = `linear-gradient(135deg, ${primary}, ${secondary})`;

  const chatCompany = pc.chatCompanyName || companyName;
  const chatSub     = pc.chatSubtitle   || "Suporte online · Resposta rápida";
  const chatWelcome = pc.chatWelcome    || "Olá! Como podemos ajudar você hoje?";

  // Cria/recupera sessão ao abrir
  useEffect(() => {
    if (!open || sessionId) return;
    fetch("/api/chat/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, campaignId }),
    }).then(r => r.json()).then(d => {
      if (d.id) { setSessionId(d.id); if (d.status === "CLOSED") setClosed(true); }
    }).catch(() => {});
  }, [open, sessionId, visitorId]);

  // Poll mensagens
  useEffect(() => {
    if (!open || !sessionId) return;
    const poll = async () => {
      try {
        const r = await fetch(`/api/chat/messages?sid=${visitorId}&after=${lastIdRef.current}`);
        const d = await r.json();
        if (d.messages?.length) {
          setMsgs(prev => [...prev, ...d.messages]);
          lastIdRef.current = d.messages[d.messages.length - 1].id;
          if (d.messages.some((m: ChatMsg) => m.sender === "admin")) {
            // noop — just show
          }
        }
      } catch { /* noop */ }
    };
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [open, sessionId, visitorId]);

  // Scroll para última msg
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  async function send() {
    const text = input.trim();
    if (!text || sending || closed) return;
    setSending(true);
    setInput("");
    try {
      const r = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid: visitorId, content: text }),
      });
      const d = await r.json();
      if (d.id) { setMsgs(prev => [...prev, d]); lastIdRef.current = d.id; }
    } catch { /* noop */ } finally { setSending(false); }
  }

  return (
    <>
      {/* Botão flutuante */}
      <button onClick={() => setOpen(o => !o)} style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 1000,
        width: 56, height: 56, borderRadius: "50%", background: grad,
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px ${primary}66`, transition: "transform .2s",
      }}
        onMouseOver={e => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}>
        {open ? (
          <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
            <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
          </svg>
        )}
      </button>

      {/* Painel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 92, right: 24, zIndex: 999,
          width: "min(360px, calc(100vw - 32px))", borderRadius: 16,
          background: "#ffffff", boxShadow: "0 8px 40px rgba(0,0,0,.18)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "Inter, system-ui, sans-serif",
        }}>
          {/* Header */}
          <div style={{ background: grad, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
              {companyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={companyLogo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>{chatCompany[0]}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chatCompany}</div>
              <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>{chatSub}</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.8)", padding: 4, display: "flex" }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px", minHeight: 220, maxHeight: 320, display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Welcome */}
            <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👋</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 4 }}>{chatWelcome}</p>
              <p style={{ fontSize: 12, color: "#94a3b8" }}>Digite sua mensagem abaixo.</p>
            </div>

            {msgs.map(m => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.sender === "visitor" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "9px 13px", borderRadius: m.sender === "visitor" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.sender === "visitor" ? grad : "#f1f5f9",
                  color: m.sender === "visitor" ? "#fff" : "#1e293b",
                  fontSize: 13, lineHeight: 1.5,
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {closed && (
              <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", padding: "8px 0" }}>
                Chat encerrado.
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {!closed && (
            <div style={{ borderTop: "1px solid #e2e8f0", padding: "12px 16px", display: "flex", gap: 8, background: "#fff" }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Digite sua mensagem..."
                style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 14px", fontSize: 13, outline: "none", fontFamily: "inherit", color: "#1e293b" }}
              />
              <button onClick={send} disabled={sending || !input.trim()} style={{
                width: 38, height: 38, borderRadius: 10, background: grad,
                border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                opacity: (!input.trim() || sending) ? .4 : 1, flexShrink: 0,
              }}>
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
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

  useEffect(() => {
    if (campaign?.pageTitle) document.title = campaign.pageTitle;
  }, [campaign?.pageTitle]);

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#09090b", fontFamily: "system-ui, sans-serif" }}>
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

  const heroBg       = cs.heroBg       || "#060A14";
  const navBg        = cs.navBg        || "rgba(6,10,20,.9)";
  const navTextColor = cs.navTextColor  || "rgba(255,255,255,.75)";
  const consultBg    = cs.consultBg    || "#F0F4F8";
  const aboutBg      = cs.aboutBg      || "#ffffff";
  const contactBg    = cs.contactBg    || "#F0F4F8";
  const footerBg     = cs.footerBg     || "#060A14";
  const footerTextColor = cs.footerTextColor || "rgba(255,255,255,.35)";
  const titleColor   = cs.titleColor   || "#0F172A";
  const subtitleColor = cs.subtitleColor || "#64748b";
  const cardBg          = cs.cardBg          || "#ffffff";
  const cardBorder      = cs.cardBorder      || "#E8EEF8";
  const cardTextColor   = cs.cardTextColor   || "#f8fafc";
  const scoreColorBad  = cs.scoreColorBad  || "#ef4444";
  const scoreColorMid  = cs.scoreColorMid  || "#f59e0b";
  const scoreColorGood = cs.scoreColorGood || "#22c55e";

  const heroTag    = pc.heroTag      || campaign.urgencyText || "🔥 Oferta por tempo limitado";
  const heroTitle1 = pc.heroTitleLine1 || campaign.headerTitle || "Regularize sua situação";
  const heroAccent = pc.heroTitleAccent || "financeira agora";
  const heroSub    = pc.heroSubtitle  || campaign.headerSubtitle || "Quite sua dívida com até 60% de desconto.";
  const heroCta1   = pc.heroCta1     || "Consultar CPF grátis";
  const heroCta2   = pc.heroCta2     || "Saiba mais";
  const heroChecks = [
    pc.heroCheck1 || "Sem burocracia",
    pc.heroCheck2 || "100% online",
    pc.heroCheck3 || "Resultado imediato",
  ];

  const stats = [
    { val: pc.heroStat1Val || "R$ 2.8B+", lbl: pc.heroStat1Lbl || "Negociados" },
    { val: pc.heroStat2Val || "+500 mil",  lbl: pc.heroStat2Lbl || "Pessoas ajudadas" },
    { val: pc.heroStat3Val || "4.8★",      lbl: pc.heroStat3Lbl || "Avaliação média" },
    { val: pc.heroStat4Val || `${campaign.discountPercent}%`, lbl: pc.heroStat4Lbl || "Descontos de" },
  ];

  // Benefícios da oferta
  let offerBenefits: string[] = [
    "Quitação definitiva da dívida",
    "Aumento imediato do score de crédito",
    "Acesso a financiamentos e crédito",
    "Saída do cadastro de inadimplentes",
    "Aprovação em cartões e empréstimos",
    "Pagamento rápido via PIX",
  ];
  try {
    if (pc.offerBenefits) {
      const parsed = JSON.parse(pc.offerBenefits);
      if (Array.isArray(parsed) && parsed.length) offerBenefits = parsed;
    }
  } catch { /* usa default */ }

  const features = [
    { icon: pc.feat1Icon || "🔍", title: pc.feat1Title || "Transparência total",    desc: pc.feat1Desc || "Informações claras, sem surpresas ou taxas ocultas." },
    { icon: pc.feat2Icon || "⚡", title: pc.feat2Title || "Negociação instantânea", desc: pc.feat2Desc || "100% digital. Consulte e quite em minutos." },
    { icon: pc.feat3Icon || "🛡️", title: pc.feat3Title || "Segurança garantida",    desc: pc.feat3Desc || "Criptografia de ponta a ponta. Dados protegidos." },
    { icon: pc.feat4Icon || "📈", title: pc.feat4Title || "Score em alta",          desc: pc.feat4Desc || "Após quitar, seu score sobe automaticamente." },
    { icon: pc.feat5Icon || "🤝", title: pc.feat5Title || "Descontos reais",        desc: pc.feat5Desc || "Negociamos para garantir os maiores descontos." },
    { icon: pc.feat6Icon || "📞", title: pc.feat6Title || "Suporte humanizado",     desc: pc.feat6Desc || "Equipe disponível para te ajudar em cada etapa." },
  ];

  const aboutStats = [
    { val: pc.aboutStat1Val || "2018",    lbl: pc.aboutStat1Lbl || "Fundada em" },
    { val: pc.aboutStat2Val || "340K+",   lbl: pc.aboutStat2Lbl || "Clientes atendidos" },
    { val: pc.aboutStat3Val || "R$ 2.8B+",lbl: pc.aboutStat3Lbl || "Em dívidas negociadas" },
    { val: pc.aboutStat4Val || "4.9/5",   lbl: pc.aboutStat4Lbl || "Avaliação no Reclame Aqui" },
  ];

  const contactCards = [
    { icon: "📞", title: pc.contactPhone || "(11) 91234-5678",              sub: pc.contactPhoneSub || "Seg–Sex, 8h às 20h" },
    { icon: "✉️", title: pc.contactEmail || "suporte@negociai.com.br",      sub: pc.contactEmailSub || "Resposta em até 2h úteis" },
    { icon: "📍", title: pc.contactAddress || "Av. Paulista, 1000 — SP",    sub: pc.contactAddressSub || "CEP 01310-100" },
    { icon: "🕐", title: pc.contactHours || "Segunda à Sexta, 8h às 20h",   sub: pc.contactHoursSub || "Sábados, 9h às 14h" },
  ];

  const navLinks = [
    { label: "Início",        id: "inicio" },
    { label: "Consultar Dívida", id: "consultar" },
    { label: "Quem Somos",    id: "quem-somos" },
    { label: "Fale Conosco",  id: "fale-conosco" },
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
          background: rgba(255,255,255,.07); border: 1.5px solid rgba(255,255,255,.13);
          border-radius: 12px; color: ${cardTextColor}; font-size: 15px; font-family: inherit;
          outline: none; transition: border-color .2s, box-shadow .2s;
        }
        .cp-input:focus { border-color: ${primary}; box-shadow: 0 0 0 3px ${primary}22; }
        .cp-input::placeholder { color: ${cardTextColor}44; }
        .cp-btn {
          width: 100%; padding: 15px; background: ${grad};
          border: none; border-radius: 12px; color: #fff;
          font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer;
          letter-spacing: .02em; transition: opacity .2s, transform .1s;
        }
        .cp-btn:hover { opacity: .92; }
        .cp-btn:active { transform: scale(.99); }
        .cp-btn:disabled { opacity: .5; cursor: not-allowed; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp .4s ease forwards; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseGlow { 0%,100%{ box-shadow:0 0 30px ${primary}33 } 50%{ box-shadow:0 0 60px ${primary}66 } }
        .hero-card { animation: pulseGlow 4s ease-in-out infinite; }
        @media(max-width:768px){
          .hero-cols { flex-direction:column !important; }
          .stats-grid { grid-template-columns:repeat(2,1fr) !important; }
          .result-cols { flex-direction:column !important; }
          .offer-cols { flex-direction:column !important; }
          .feat-grid { grid-template-columns:1fr !important; }
          .about-intro { grid-template-columns:1fr !important; gap:40px !important; }
          .contact-layout { grid-template-columns:1fr !important; gap:48px !important; }
          .nav-desktop { display:none !important; }
          .menu-btn { display:flex !important; }
        }
        @media(min-width:769px){
          .menu-btn { display:none !important; }
          .nav-mobile { display:none !important; }
        }
      `}</style>

      {campaign.faviconUrl && <link rel="icon" href={campaign.faviconUrl} />}

      {/* ── NAVBAR ── */}
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: navBg, backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ flexShrink: 0 }}>
            {campaign.companyLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={campaign.companyLogo} alt={campaign.companyName} style={{ height: campaign.logoHeight || 40, objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc" }}>{campaign.companyName}</span>
            )}
          </div>

          <nav className="nav-desktop" style={{ display: "flex", gap: 28 }}>
            {navLinks.map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: navTextColor, fontSize: 14, fontWeight: 500, fontFamily: "inherit", transition: "color .2s" }}
                onMouseOver={e => (e.currentTarget.style.color = "#fff")}
                onMouseOut={e => (e.currentTarget.style.color = navTextColor)}>
                {l.label}
              </button>
            ))}
          </nav>

          <button onClick={() => scrollTo("consultar")} className="nav-desktop"
            style={{ background: grad, border: "none", borderRadius: 10, padding: "9px 20px", color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", whiteSpace: "nowrap" }}>
            Consultar minha dívida
          </button>

          <button className="menu-btn" onClick={() => setMenuOpen(o => !o)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#f8fafc", flexDirection: "column", gap: 5, padding: 4, display: "none" }}>
            <span style={{ display: "block", width: 22, height: 2, background: "currentColor", transition: "all .2s", transform: menuOpen ? "rotate(45deg) translateY(7px)" : "none" }} />
            <span style={{ display: "block", width: 22, height: 2, background: "currentColor", opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: "block", width: 22, height: 2, background: "currentColor", transition: "all .2s", transform: menuOpen ? "rotate(-45deg) translateY(-7px)" : "none" }} />
          </button>
        </div>
        {menuOpen && (
          <div className="nav-mobile" style={{ borderTop: "1px solid rgba(255,255,255,.07)", padding: "12px 0", background: navBg }}>
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
      {pc.promoBannerUrl ? (
        /* Banner cobre 100% do hero — sem texto */
        <section id="inicio" style={{ lineHeight: 0 }}>
          <a href={pc.promoBannerLink || "#consultar"} style={{ display: "block" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pc.promoBannerUrl} alt="Banner" style={{ width: "100%", maxHeight: "90vh", objectFit: "cover", display: "block" }} />
          </a>
        </section>
      ) : (
      <section id="inicio" style={{ background: `linear-gradient(160deg, ${heroBg} 0%, ${primary}16 50%, ${heroBg} 100%)`, padding: "80px 24px 64px", minHeight: "88vh", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
          <div className="hero-cols" style={{ display: "flex", gap: 56, alignItems: "center" }}>
            {/* Left */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", borderRadius: 99, background: `${primary}18`, border: `1px solid ${primary}44`, fontSize: 13, fontWeight: 600, color: primary, marginBottom: 24 }}>
                {heroTag}
              </div>
              <h1 style={{ fontSize: "clamp(28px, 4.5vw, 52px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 16 }}>
                <span style={{ color: "#f8fafc" }}>{heroTitle1} </span>
                <span style={{ background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{heroAccent}</span>
              </h1>
              <p style={{ fontSize: "clamp(15px, 2vw, 17px)", color: "rgba(255,255,255,.55)", lineHeight: 1.7, marginBottom: 20, maxWidth: 500 }}>
                {heroSub}
              </p>
              {/* Checkmarks */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", marginBottom: 36 }}>
                {heroChecks.map((c, i) => (
                  <span key={i} style={{ fontSize: 14, color: "rgba(255,255,255,.7)", display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="8" fill={primary} opacity=".2" />
                      <path d="M5 8l2 2 4-4" stroke={primary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {c}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => scrollTo("consultar")} style={{ background: grad, border: "none", borderRadius: 12, padding: "15px 32px", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                  {heroCta1}
                </button>
                <button onClick={() => scrollTo("quem-somos")} style={{ padding: "14px 28px", border: "2px solid rgba(255,255,255,.2)", borderRadius: 12, color: "rgba(255,255,255,.8)", background: "transparent", fontSize: 15, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                  {heroCta2}
                </button>
              </div>
            </div>

            {/* Right — stats */}
            <div style={{ flex: "0 0 auto", width: "min(340px,100%)" }}>
              {campaign.companyLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={campaign.companyLogo} alt={campaign.companyName}
                  style={{ height: Math.max(48, campaign.logoHeight || 60), objectFit: "contain", display: "block", margin: "0 auto 24px" }} />
              )}
              <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {stats.map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.09)", borderRadius: 16, padding: "20px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: "clamp(16px,2.5vw,24px)", fontWeight: 900, background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 4 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

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
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 99, background: `${primary}15`, border: `1px solid ${primary}30`, fontSize: 12, fontWeight: 700, color: primary, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 16 }}>
              {pc.consultTag || "Consulta gratuita"}
            </span>
            <h2 style={{ fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 800, color: titleColor, marginBottom: 12 }}>
              {pc.consultTitle || "Consulte sua dívida"}
            </h2>
            <p style={{ fontSize: 15, color: subtitleColor, lineHeight: 1.7 }}>
              {pc.consultSubtitle || "Digite seu nome e CPF para verificar pendências e receber uma proposta personalizada."}
            </p>
          </div>

          {/* Form card */}
          <div className="hero-card" style={{ background: cs.cardBg || "#0F172A", border: `1px solid ${cs.cardBorder || "rgba(255,255,255,.08)"}`, borderRadius: 20, padding: "36px 32px" }}>
            {!result ? (
              <form onSubmit={handleConsult} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: `${cardTextColor}99`, marginBottom: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>Nome completo</label>
                  <input className="cp-input" type="text" placeholder="Digite seu nome completo" value={name} onChange={e => setName(e.target.value)} required minLength={3} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: `${cardTextColor}99`, marginBottom: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>CPF</label>
                  <input className="cp-input" type="text" inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={handleCPFChange} required maxLength={14} />
                </div>
                {error && (
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#f87171", fontSize: 13 }}>{error}</div>
                )}
                <button className="cp-btn" type="submit" disabled={consulting}>
                  {consulting ? "Consultando..." : (pc.consultCta || "Consultar minha situação")}
                </button>
                <p style={{ fontSize: 11, color: `${cardTextColor}55`, textAlign: "center" }}>🔒 {pc.consultPrivacy || "Consulta 100% gratuita e segura · Sem cadastro"}</p>
              </form>
            ) : (
              <div className="fade-up">
                {/* Urgência */}
                <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 10, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>Dívida ativa localizada em seu nome</div>
                    <div style={{ fontSize: 12, color: cardTextColor, marginTop: 2 }}>Esta oferta é exclusiva e expira em: <Countdown /></div>
                  </div>
                  <span style={{ padding: "4px 10px", borderRadius: 6, background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 800, letterSpacing: ".06em" }}>URGENTE</span>
                </div>

                {/* Dois cards */}
                <div className="result-cols" style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                  {/* Dados da Dívida */}
                  <div style={{ flex: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: "20px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: cardTextColor, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>📋</span> Dados da Dívida
                    </div>
                    {[
                      { label: "Nome", value: result.name },
                      { label: "CPF", value: result.cpf },
                      { label: "Descrição", value: result.description },
                      { label: "Status", value: result.status, badge: true },
                    ].map(row => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${cardTextColor}22` }}>
                        <span style={{ fontSize: 12, color: cardTextColor }}>{row.label}</span>
                        {row.badge ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(239,68,68,.15)", color: "#f87171", border: "1px solid rgba(239,68,68,.3)" }}>{row.value}</span>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: cardTextColor, maxWidth: 140, textAlign: "right", wordBreak: "break-word" }}>{row.value}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Análise de Crédito */}
                  <div style={{ flex: 1, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: cardTextColor, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>📊</span> Análise de Crédito
                    </div>
                    <CircularScore score={result.score} colorBad={scoreColorBad} colorMid={scoreColorMid} colorGood={scoreColorGood} />
                    <div style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.18)", textAlign: "center" }}>
                      <div style={{ fontSize: 11, color: cardTextColor, marginBottom: 4 }}>Após regularizar:</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>{result.scoreAfterPay} <span style={{ fontSize: 11, fontWeight: 400 }}>/1000 pontos</span></div>
                      <div style={{ fontSize: 11, color: "#86efac", marginTop: 4 }}>+{result.scoreAfterPay - result.score} pts</div>
                      <div style={{ fontSize: 11, color: cardTextColor, marginTop: 6 }}>Acesso a crédito, melhores taxas e oportunidades</div>
                    </div>
                  </div>
                </div>

                {/* Oferta */}
                <div style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: "24px", marginBottom: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: cardTextColor, marginBottom: 4 }}>🎯 Oferta Especial de Quitação</div>
                    <div style={{ fontSize: 13, color: cardTextColor }}>Pague agora e elimine sua dívida definitivamente</div>
                  </div>

                  <div className="offer-cols" style={{ display: "flex", gap: 20, marginBottom: 20 }}>
                    {/* Preços */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: cardTextColor, textDecoration: "line-through" }}>{fmtBRL(result.amount)}</div>
                      <div style={{ fontSize: 11, color: cardTextColor, marginBottom: 8 }}>Valor cheio</div>
                      <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, background: `${scoreColorGood}22`, border: `1px solid ${scoreColorGood}44`, fontSize: 12, fontWeight: 800, color: scoreColorGood, marginBottom: 8 }}>
                        -{result.discount}% OFF
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: cardTextColor, lineHeight: 1 }}>{fmtBRL(result.discountedAmount)}</div>
                      <div style={{ fontSize: 12, color: scoreColorGood, marginTop: 4 }}>Economia de {fmtBRL(result.amount - result.discountedAmount)}</div>
                    </div>

                    {/* Benefícios */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: cardTextColor, marginBottom: 10 }}>O que você ganha:</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {offerBenefits.map((b, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, color: cardTextColor }}>
                            <span style={{ color: scoreColorGood, fontWeight: 700, flexShrink: 0 }}>✓</span>
                            {b}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button className="cp-btn" onClick={handleCheckout} style={{ fontSize: 16, padding: "16px" }}>
                    {campaign.ctaText || "Pagar via PIX agora"} →
                  </button>

                  {/* Trust badges */}
                  <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "6px 20px", marginTop: 14 }}>
                    {["🔒 Pagamento seguro", "⚡ PIX Instantâneo", "📄 Comprovante digital"].map(b => (
                      <span key={b} style={{ fontSize: 11, color: cardTextColor }}>{b}</span>
                    ))}
                  </div>
                </div>

                {campaign.whatsappNumber && (
                  <a href={`https://wa.me/${campaign.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 10, background: "rgba(37,211,102,.08)", border: "1px solid rgba(37,211,102,.2)", color: "#4ade80", fontSize: 14, fontWeight: 600 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Tirar dúvidas no WhatsApp
                  </a>
                )}

                {/* Social proof */}
                <p style={{ textAlign: "center", fontSize: 12, color: cardTextColor, marginTop: 16, lineHeight: 1.6 }}>
                  Milhares de brasileiros regularizaram suas dívidas e hoje têm acesso a crédito, financiamentos e novas oportunidades.
                  Não deixe uma dívida antiga bloquear o seu futuro. Este é o seu momento.
                </p>

                <button onClick={() => { setResult(null); setCpf(""); setName(""); trackedCheckout.current = false; }}
                  style={{ marginTop: 14, display: "block", width: "100%", background: "none", border: "none", cursor: "pointer", color: cardTextColor, fontSize: 13, fontFamily: "inherit", textDecoration: "underline" }}>
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
      <section id="quem-somos" style={{ background: aboutBg, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Intro: texto + stats lado a lado */}
          <div className="about-intro" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center", marginBottom: 80 }}>
            <div>
              <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 4, background: `${primary}15`, fontSize: 11, fontWeight: 700, color: primary, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 20 }}>
                {pc.aboutTag || "Nossa empresa"}
              </span>
              <h2 style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 800, color: titleColor, lineHeight: 1.2, marginBottom: 20 }}>
                {pc.aboutTitle || "Especialistas em renegociação de dívidas"}
              </h2>
              <p style={{ fontSize: 16, color: subtitleColor, lineHeight: 1.8, marginBottom: 32 }}>
                {pc.aboutSubtitle || "Somos uma plataforma de renegociação de dívidas que conecta pessoas às melhores propostas de quitação com segurança e transparência."}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 2, background: grad, borderRadius: 2 }} />
                <span style={{ fontSize: 13, color: subtitleColor, fontWeight: 500 }}>Regulamentada e certificada</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: cardBorder, border: `1px solid ${cardBorder}`, borderRadius: 16, overflow: "hidden" }}>
              {aboutStats.map((s, i) => (
                <div key={i} style={{ background: cardBg, padding: "32px 28px" }}>
                  <div style={{ fontSize: "clamp(24px,2.5vw,34px)", fontWeight: 900, background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6, lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 13, color: subtitleColor, lineHeight: 1.4 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Diferenciais */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: subtitleColor, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 32 }}>Por que escolher a {campaign.companyName || "nossa plataforma"}</p>
          </div>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, border: `1px solid ${cardBorder}`, borderRadius: 16, overflow: "hidden" }}>
            {features.map((f, i) => {
              const featIcons = [
                <svg key={0} width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
                <svg key={1} width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/></svg>,
                <svg key={2} width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
                <svg key={3} width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/></svg>,
                <svg key={4} width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z"/></svg>,
                <svg key={5} width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"/></svg>,
              ];
              return (
                <div key={i} style={{ background: cardBg, padding: "32px 28px", borderRight: i % 3 !== 2 ? `1px solid ${cardBorder}` : "none", borderBottom: i < 3 ? `1px solid ${cardBorder}` : "none" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `${primary}10`, display: "flex", alignItems: "center", justifyContent: "center", color: primary, marginBottom: 20 }}>
                    {featIcons[i]}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: titleColor, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: subtitleColor, lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              );
            })}
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
      <section id="fale-conosco" style={{ background: contactBg, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="contact-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>

            {/* Lado esquerdo: info */}
            <div>
              <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 4, background: `${primary}15`, fontSize: 11, fontWeight: 700, color: primary, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 20 }}>
                {pc.contactTag || "Atendimento"}
              </span>
              <h2 style={{ fontSize: "clamp(28px,3vw,42px)", fontWeight: 800, color: titleColor, lineHeight: 1.2, marginBottom: 16 }}>
                {pc.contactTitle || "Fale conosco"}
              </h2>
              <p style={{ fontSize: 15, color: subtitleColor, lineHeight: 1.8, marginBottom: 48 }}>
                {pc.contactSubtitle || "Nossa equipe está pronta para te ajudar. Escolha o canal de sua preferência."}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  { label: "Telefone", value: pc.contactPhone || "(11) 91234-5678", sub: pc.contactPhoneSub || "Seg–Sex, 8h às 20h",
                    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.338c0 9.037 7.376 16.462 16.413 16.462h1.175a2.25 2.25 0 002.25-2.25v-1.372a1.25 1.25 0 00-.774-1.183l-3.43-1.543a1.25 1.25 0 00-1.478.31l-1.197 1.44a.75.75 0 01-.884.214 13.088 13.088 0 01-6.485-6.486.75.75 0 01.214-.884l1.44-1.197a1.25 1.25 0 00.31-1.478L8.258 5.297A1.25 1.25 0 007.075 4.5H5.7a3.45 3.45 0 00-3.45 3.45v.388z"/></svg> },
                  { label: "E-mail", value: pc.contactEmail || "suporte@negociai.com.br", sub: pc.contactEmailSub || "Resposta em até 2h úteis",
                    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"/></svg> },
                  { label: "Endereço", value: pc.contactAddress || "Av. Paulista, 1000 — SP", sub: pc.contactAddressSub || "CEP 01310-100",
                    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg> },
                  { label: "Horário", value: pc.contactHours || "Segunda à Sexta, 8h às 20h", sub: pc.contactHoursSub || "Sábados, 9h às 14h",
                    icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "20px 0", borderBottom: i < 3 ? `1px solid ${cardBorder}` : "none" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${primary}10`, display: "flex", alignItems: "center", justifyContent: "center", color: primary, flexShrink: 0, marginTop: 2 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: subtitleColor, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: titleColor, marginBottom: 2 }}>{item.value}</div>
                      <div style={{ fontSize: 13, color: subtitleColor }}>{item.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lado direito: CTA card */}
            <div style={{ position: "sticky", top: 24 }}>
              <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 20, overflow: "hidden" }}>
                <div style={{ background: grad, padding: "32px 32px 28px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.7)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>Oferta exclusiva</div>
                  <h3 style={{ fontSize: "clamp(20px,2.5vw,26px)", fontWeight: 800, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>
                    {pc.ctaCardTitle || "Pronto para limpar seu nome?"}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,.8)", lineHeight: 1.6 }}>
                    {pc.ctaCardDesc || "Consulte sua situação gratuitamente e descubra o desconto que preparamos para você."}
                  </p>
                </div>
                <div style={{ padding: "28px 32px 32px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                    {["Consulta 100% gratuita e sem compromisso", "Resultado imediato — sem cadastro", "Desconto exclusivo para pagamento via PIX"].map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: subtitleColor }}>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${primary}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="11" height="11" fill="none" stroke={primary} strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => scrollTo("consultar")} style={{ width: "100%", background: grad, border: "none", borderRadius: 12, padding: "15px", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", letterSpacing: ".02em" }}>
                    {pc.ctaCardBtn || "Consultar dívida grátis"}
                  </button>
                  <p style={{ fontSize: 12, color: subtitleColor, textAlign: "center", marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    Seus dados estão protegidos
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: footerBg, padding: "48px 24px 32px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
            <div style={{ flex: "0 0 auto", maxWidth: 320 }}>
              {campaign.companyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={campaign.companyLogo} alt={campaign.companyName} style={{ height: (campaign.logoHeight || 40) * 0.8, objectFit: "contain", marginBottom: 12, opacity: .7 }} />
              ) : (
                <span style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc", display: "block", marginBottom: 12 }}>{campaign.companyName}</span>
              )}
              <p style={{ fontSize: 13, color: footerTextColor, lineHeight: 1.7 }}>
                {pc.footerTagline || "Plataforma líder em renegociação de dívidas. Transparência e segurança para você recuperar sua liberdade financeira."}
              </p>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.2)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>Navegação</div>
              {navLinks.map(l => (
                <button key={l.id} onClick={() => scrollTo(l.id)}
                  style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: footerTextColor, fontSize: 14, fontFamily: "inherit", marginBottom: 10, textAlign: "left" }}>
                  {l.label}
                </button>
              ))}
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.2)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 16 }}>Redes sociais</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "X", href: pc.socialX || "#", icon: "𝕏" },
                  { label: "in", href: pc.socialLinkedin || "#", icon: "in" },
                  { label: "f", href: pc.socialFacebook || "#", icon: "f" },
                ].map(s => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", color: footerTextColor, fontSize: 13, fontWeight: 700 }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 24, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, color: footerTextColor }}>© {new Date().getFullYear()} {campaign.companyName}. Todos os direitos reservados.</p>
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

      {/* ── CHAT WIDGET ── */}
      <ChatWidget
        visitorId={visitorId.current}
        primary={primary}
        secondary={secondary}
        companyName={campaign.companyName}
        companyLogo={campaign.companyLogo}
        pc={pc}
        campaignId={campaign.id}
      />
    </>
  );
}
