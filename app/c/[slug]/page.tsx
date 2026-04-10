"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { formatCPF, validateCPF } from "@/lib/cpf";

interface Campaign {
  id: number;
  slug: string;
  name: string;
  companyName: string;
  companyLogo: string;
  logoHeight: number;
  primaryColor: string;
  secondaryColor: string;
  faviconUrl: string;
  pageTitle: string;
  headerTitle: string;
  headerSubtitle: string;
  discountPercent: number;
  defaultDebtAmount: number;
  defaultDebtDesc: string;
  checkoutUrl: string;
  scoreMin: number;
  scoreMax: number;
  scoreAfterPay: number;
  urgencyText: string;
  ctaText: string;
  footerText: string;
  whatsappNumber: string;
  bannerImages: string;   // JSON string "[]"
  pageContent: string;    // JSON string "{}"
  colorScheme: string;    // JSON string "{}"
}

interface PageContent {
  heroTag?: string;
  heroTitleLine1?: string;
  heroTitleAccent?: string;
  heroSubtitle?: string;
  consultPrivacy?: string;
  promoBannerUrl?: string;
  promoBannerLink?: string;
}

interface ColorScheme {
  heroBg?: string;
  accentColor?: string;
  scoreColorBad?: string;
  scoreColorMid?: string;
  scoreColorGood?: string;
}

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

function parseJson<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw) return fallback;
  try { return { ...fallback, ...JSON.parse(raw) }; } catch { return fallback; }
}

function parseBanners(raw: string | undefined | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch { return []; }
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
        Ao quitar sua dívida, seu score pode chegar a <strong style={{ color: "#86efac" }}>{scoreAfterPay} pts</strong>
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

function BannerCarousel({ images, primary }: { images: string[]; primary: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length]);
  if (!images.length) return null;
  return (
    <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: 16, aspectRatio: "16/5" }}>
      {images.map((src, i) => (
        <img key={src} src={src} alt={`Banner ${i + 1}`} style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", opacity: i === idx ? 1 : 0, transition: "opacity .6s ease",
        }} />
      ))}
      {images.length > 1 && (
        <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
          {images.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{
              width: i === idx ? 18 : 6, height: 6, borderRadius: 99,
              background: i === idx ? primary : "rgba(255,255,255,.4)",
              border: "none", cursor: "pointer", transition: "all .3s",
              padding: 0,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: result.name, cpf: result.cpf, event: "CLIQUE_PAGAMENTO", debtorId: result.debtorId }),
      }).catch(() => {});
    }
    if (result.checkoutUrl) window.open(result.checkoutUrl, "_blank");
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#09090b", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,.1)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>Carregando...</p>
      </div>
    </div>
  );

  if (notFound || !campaign) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#09090b", color: "#f8fafc", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>404</div>
        <p style={{ color: "rgba(255,255,255,.5)" }}>Campanha não encontrada.</p>
      </div>
    </div>
  );

  const primary   = campaign.primaryColor   || "#6366f1";
  const secondary = campaign.secondaryColor || "#8b5cf6";
  const pc  = parseJson<PageContent>(campaign.pageContent, {});
  const cs  = parseJson<ColorScheme>(campaign.colorScheme, {});
  const banners = parseBanners(campaign.bannerImages);

  const heroBg       = cs.heroBg       || "#09090b";
  const scoreColorBad  = cs.scoreColorBad  || "#ef4444";
  const scoreColorMid  = cs.scoreColorMid  || "#f59e0b";
  const scoreColorGood = cs.scoreColorGood || "#22c55e";

  // Hero texts — use pageContent if set, fallback to direct campaign fields
  const heroTag      = pc.heroTag      || campaign.urgencyText;
  const heroTitle    = pc.heroTitleLine1 && pc.heroTitleAccent
    ? `${pc.heroTitleLine1} ${pc.heroTitleAccent}`
    : campaign.headerTitle;
  const heroSubtitle = pc.heroSubtitle || campaign.headerSubtitle;
  const privacyText  = pc.consultPrivacy || "Consulta gratuita e sem compromisso";

  // Promo banner (substitui hero se preenchido)
  const promoBannerUrl  = pc.promoBannerUrl  || "";
  const promoBannerLink = pc.promoBannerLink || "#";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${heroBg}; color: #f8fafc; font-family: 'Inter', system-ui, sans-serif; }
        .cp-input {
          width: 100%; padding: 12px 16px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 10px; color: #f8fafc; font-size: 15px; font-family: inherit;
          outline: none; transition: border-color .2s;
        }
        .cp-input:focus { border-color: ${primary}; box-shadow: 0 0 0 3px ${primary}22; }
        .cp-input::placeholder { color: rgba(255,255,255,.25); }
        .cp-btn {
          width: 100%; padding: 14px;
          background: linear-gradient(135deg, ${primary}, ${secondary});
          border: none; border-radius: 10px; color: #fff;
          font-size: 15px; font-weight: 700; font-family: inherit; cursor: pointer;
          letter-spacing: .02em; transition: opacity .2s, transform .1s;
        }
        .cp-btn:hover { opacity: .9; }
        .cp-btn:active { transform: scale(.99); }
        .cp-btn:disabled { opacity: .5; cursor: not-allowed; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp .4s ease forwards; }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px ${primary}44; } 50% { box-shadow: 0 0 40px ${primary}88; } }
      `}</style>

      {/* Favicon dinâmico */}
      {campaign.faviconUrl && (
        <link rel="icon" href={campaign.faviconUrl} />
      )}

      {/* Header */}
      <header style={{ background: "rgba(0,0,0,.6)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {campaign.companyLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={campaign.companyLogo} alt={campaign.companyName} style={{ height: campaign.logoHeight, objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: 20, fontWeight: 800, color: "#f8fafc" }}>{campaign.companyName}</span>
        )}
      </header>

      {/* Hero — banner estático OU textos */}
      {promoBannerUrl ? (
        <a href={promoBannerLink} style={{ display: "block" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={promoBannerUrl} alt="Banner" style={{ width: "100%", maxHeight: 300, objectFit: "cover" }} />
        </a>
      ) : (
        <div style={{ background: `linear-gradient(135deg, ${heroBg} 0%, ${primary}18 50%, ${heroBg} 100%)`, padding: "48px 24px 24px", textAlign: "center" }}>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 34px)", fontWeight: 800, background: `linear-gradient(135deg, #f8fafc, ${primary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.2, marginBottom: 12 }}>
            {heroTitle}
          </h1>
          <p style={{ color: "rgba(255,255,255,.55)", fontSize: 15, maxWidth: 520, margin: "0 auto" }}>
            {heroSubtitle}
          </p>
        </div>
      )}

      {/* Carrossel de banners */}
      {banners.length > 0 && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "12px 16px 0" }}>
          <BannerCarousel images={banners} primary={primary} />
        </div>
      )}

      {/* Main card */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "8px 16px 48px" }}>

        {/* Urgency badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 99, background: `${primary}18`, border: `1px solid ${primary}44`, fontSize: 13, fontWeight: 600, color: primary }}>
            {heroTag}
            <span style={{ color: "rgba(255,255,255,.5)", fontWeight: 400 }}>—</span>
            <Countdown />
          </div>
        </div>

        {/* Consult form card */}
        <div style={{ background: "rgba(255,255,255,.028)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, padding: "28px 24px", animation: "pulse-glow 4s ease-in-out infinite" }}>
          {!result ? (
            <form onSubmit={handleConsult} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>Nome completo</label>
                <input className="cp-input" type="text" placeholder="Digite seu nome" value={name} onChange={e => setName(e.target.value)} required minLength={3} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: 6, letterSpacing: ".04em", textTransform: "uppercase" }}>CPF</label>
                <input className="cp-input" type="text" inputMode="numeric" placeholder="000.000.000-00" value={cpf} onChange={handleCPFChange} required maxLength={14} />
              </div>
              {error && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#f87171", fontSize: 13 }}>
                  {error}
                </div>
              )}
              <button className="cp-btn" type="submit" disabled={consulting}>
                {consulting ? "Consultando..." : `Consultar dívida`}
              </button>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.25)", textAlign: "center" }}>{privacyText}</p>
            </form>
          ) : (
            <div className="fade-up">
              <div style={{ textAlign: "center", marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>Resultado para</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>{result.name}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 2 }}>CPF: {result.cpf}</div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <ScoreMeter score={result.score} scoreAfterPay={result.scoreAfterPay} primary={primary}
                  colorBad={scoreColorBad} colorMid={scoreColorMid} colorGood={scoreColorGood} />
              </div>

              <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 12, padding: "18px 20px", marginBottom: 16, border: "1px solid rgba(255,255,255,.08)" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 10 }}>{result.description}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,.35)", textDecoration: "line-through", marginBottom: 2 }}>{fmtBRL(result.amount)}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#f8fafc" }}>{fmtBRL(result.discountedAmount)}</div>
                  </div>
                  <div style={{ padding: "6px 12px", borderRadius: 8, background: `${primary}22`, border: `1px solid ${primary}44`, fontSize: 14, fontWeight: 800, color: primary }}>
                    -{result.discount}%
                  </div>
                </div>
              </div>

              <button className="cp-btn" onClick={handleCheckout}>{campaign.ctaText}</button>

              {campaign.whatsappNumber && (
                <a href={`https://wa.me/${campaign.whatsappNumber.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 12, padding: "11px 16px", borderRadius: 10, background: "rgba(37,211,102,.08)", border: "1px solid rgba(37,211,102,.2)", color: "#4ade80", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Tirar dúvidas no WhatsApp
                </a>
              )}

              <button onClick={() => { setResult(null); setCpf(""); setName(""); trackedCheckout.current = false; }}
                style={{ marginTop: 12, display: "block", width: "100%", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.3)", fontSize: 13, fontFamily: "inherit", textDecoration: "underline" }}>
                Nova consulta
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,.25)", marginTop: 24 }}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" style={{ display: "inline", marginRight: 5, verticalAlign: "middle" }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          {campaign.footerText}
        </p>
      </div>
    </>
  );
}
