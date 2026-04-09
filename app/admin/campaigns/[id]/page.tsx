"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import BannerCarouselEditor from "@/components/BannerCarouselEditor";

/* ─── Types ───────────────────────────────────── */
interface CampaignSettings {
  id: number;
  name: string;
  slug: string;
  customDomain: string;
  active: boolean;
  companyName: string; companyLogo: string; logoHeight: number;
  primaryColor: string; secondaryColor: string;
  discountPercent: number; defaultDebtAmount: number; defaultDebtDesc: string;
  checkoutUrl: string; scoreMin: number; scoreMax: number; scoreAfterPay: number;
  headerTitle: string; headerSubtitle: string;
  urgencyText: string; ctaText: string; footerText: string;
  faviconUrl: string; bannerImages: string[];
  pageTitle: string; whatsappNumber: string;
  webhookSecret: string;
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
}

/* ─── Defaults ────────────────────────────────── */
const DEFAULT_SETTINGS: Omit<CampaignSettings, "id"> = {
  name: "", slug: "", customDomain: "", active: true,
  companyName: "NegociAI", companyLogo: "", logoHeight: 44,
  primaryColor: "#6366f1", secondaryColor: "#8b5cf6",
  discountPercent: 60, defaultDebtAmount: 1200, defaultDebtDesc: "Dívida em aberto",
  checkoutUrl: "", scoreMin: 280, scoreMax: 420, scoreAfterPay: 820, whatsappNumber: "", webhookSecret: "",
  headerTitle: "Regularize sua situação financeira",
  headerSubtitle: "Consulte sua dívida e quite com até 60% de desconto",
  urgencyText: "⚡ Oferta por tempo limitado",
  ctaText: "Pagar via PIX agora",
  footerText: "Seus dados estão protegidos. Ambiente 100% seguro.",
  faviconUrl: "", bannerImages: [], pageTitle: "NegociAI",
};

const DEFAULT_CONTENT: PageContent = {
  heroTag: "⚡ Oferta por tempo limitado",
  heroTitleLine1: "Regularize sua situação",
  heroTitleAccent: "financeira agora",
  heroSubtitle: "Quite sua dívida com até 60% de desconto. Processo 100% digital, seguro e imediato.",
  heroCta1: "Consultar minha dívida",
  heroCta2: "Saiba mais",
  heroStat1Val: "R$ 2.8B+", heroStat1Lbl: "Dívidas negociadas",
  heroStat2Val: "340K+",   heroStat2Lbl: "CPFs regularizados",
  heroStat3Val: "60%",     heroStat3Lbl: "Desconto médio",
  heroStat4Val: "4.9★",    heroStat4Lbl: "Avaliação média",
  promoBannerUrl: "/banner-promo.svg", promoBannerLink: "#consultar",
  sectionBannerConsultUrl: "", sectionBannerConsultLink: "#consultar",
  sectionBannerSobreUrl: "",   sectionBannerSobreLink: "#quem-somos",
  sectionBannerContatoUrl: "", sectionBannerContatoLink: "#fale-conosco",
  consultTag: "Consulta gratuita",
  consultTitle: "Consulte sua dívida",
  consultSubtitle: "Digite seu nome e CPF para verificar se há pendências e receber uma proposta personalizada.",
  consultCta: "Consultar minha situação",
  consultPrivacy: "Consulta 100% gratuita e segura · Sem cadastro",
  aboutTag: "Nossa empresa",
  aboutTitle: "Quem somos",
  aboutSubtitle: "Somos uma plataforma de renegociação de dívidas que conecta pessoas endividadas às melhores propostas de quitação — de forma rápida, segura e transparente.",
  aboutStat1Val: "2018",   aboutStat1Lbl: "Fundada em",
  aboutStat2Val: "340K+",  aboutStat2Lbl: "Clientes atendidos",
  aboutStat3Val: "R$ 2.8B+", aboutStat3Lbl: "Em dívidas negociadas",
  aboutStat4Val: "4.9/5",  aboutStat4Lbl: "Avaliação no Reclame Aqui",
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
  contactTag: "Atendimento",
  contactTitle: "Fale conosco",
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

const DEFAULT_COLORS: ColorScheme = {
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

/* ─── Helpers ─────────────────────────────────── */
function parseBannerImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return []; } }
  return [];
}
function parseJson<T>(raw: unknown, fallback: T): T {
  if (typeof raw === "object" && raw !== null) return raw as T;
  if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return fallback; } }
  return fallback;
}

type TabKey = "campanha" | "empresa" | "cores" | "banners" | "copy-hero" | "copy-consulta" | "copy-sobre" | "copy-contato" | "negocio" | "webhook";
const TABS: { key: TabKey; icon: string; label: string }[] = [
  { key: "campanha",       icon: "🚀", label: "Campanha" },
  { key: "empresa",        icon: "🏢", label: "Empresa" },
  { key: "cores",          icon: "🎨", label: "Cores & Tema" },
  { key: "banners",        icon: "🖼️", label: "Banners" },
  { key: "copy-hero",      icon: "✨", label: "Hero" },
  { key: "copy-consulta",  icon: "🔍", label: "Consulta" },
  { key: "copy-sobre",     icon: "🏢", label: "Quem Somos" },
  { key: "copy-contato",   icon: "💬", label: "Contato" },
  { key: "negocio",        icon: "⚙️", label: "Negócio" },
  { key: "webhook",        icon: "🔗", label: "Webhook" },
];

/* ─── Component ───────────────────────────────── */
export default function CampaignEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [settings, setSettings] = useState<CampaignSettings>({ id: 0, ...DEFAULT_SETTINGS });
  const [pageContent, setPageContent] = useState<PageContent>(DEFAULT_CONTENT);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(DEFAULT_COLORS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("campanha");

  useEffect(() => {
    fetch(`/api/admin/campaigns/${id}`)
      .then(r => { if (r.status === 401) { router.push("/admin/login"); return null; } return r.json(); })
      .then(d => {
        if (!d) return;
        setSettings({
          ...DEFAULT_SETTINGS, ...d,
          id: d.id,
          bannerImages: parseBannerImages(d.bannerImages),
          logoHeight: d.logoHeight ?? 44,
          pageTitle: d.pageTitle ?? d.companyName ?? "NegociAI",
        });
        setPageContent({ ...DEFAULT_CONTENT, ...parseJson(d.pageContent, {}) });
        setColorScheme({ ...DEFAULT_COLORS, ...parseJson(d.colorScheme, {}) });
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...settings,
        bannerImages: settings.bannerImages,
        pageContent: JSON.stringify(pageContent),
        colorScheme: JSON.stringify(colorScheme),
      }),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  function updS<K extends keyof CampaignSettings>(k: K, v: CampaignSettings[K]) { setSettings(s => ({ ...s, [k]: v })); }
  function updPC<K extends keyof PageContent>(k: K, v: PageContent[K]) { setPageContent(p => ({ ...p, [k]: v })); }
  function updCS<K extends keyof ColorScheme>(k: K, v: ColorScheme[K]) { setColorScheme(c => ({ ...c, [k]: v })); }

  if (loading) return (
    <div className="flex items-center justify-center h-64" style={{ color: "var(--text-muted)" }}>
      <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin mr-3" />
      Carregando...
    </div>
  );

  const grad = `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`;
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://seudominio.com";
  const campaignUrl = `${appUrl}/c/${settings.slug}`;

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/campaigns")}
            className="flex items-center gap-1.5 text-sm font-semibold hover:opacity-80 transition-opacity"
            style={{ color: "var(--text-muted)" }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Campanhas
          </button>
          <span style={{ color: "var(--border)" }}>/</span>
          <h1 className="text-xl font-black" style={{ color: "var(--text)" }}>{settings.name}</h1>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: settings.active ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)", color: settings.active ? "#22c55e" : "#ef4444" }}>
            {settings.active ? "Ativa" : "Inativa"}
          </span>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50"
          style={saved ? { background: "#22c55e" } : { background: grad }}>
          {saving ? (
            <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Salvando...</>
          ) : saved ? "✅ Salvo!" : "💾 Salvar alterações"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all border"
            style={activeTab === t.key
              ? { background: grad, color: "white", borderColor: "transparent", boxShadow: "0 4px 12px rgba(99,102,241,.3)" }
              : { background: "var(--surface)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card p-6 space-y-6">

        {/* ─── CAMPANHA ─── */}
        {activeTab === "campanha" && (<>
          <Heading icon="🚀" title="Dados da Campanha" />

          <Field label="Nome da campanha" value={settings.name} onChange={v => updS("name", v)} />

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Slug (parte da URL)" value={settings.slug} onChange={v => updS("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} hint="Ex: campanha-verao → /c/campanha-verao" />
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Status</label>
              <select value={settings.active ? "1" : "0"} onChange={e => updS("active", e.target.value === "1")}
                className="input-field">
                <option value="1">✅ Ativa — acessível ao público</option>
                <option value="0">⛔ Inativa — página fora do ar</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>URL gerada</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 p-3 rounded-xl font-mono text-sm break-all"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}>
                {campaignUrl}
              </div>
              <button onClick={() => navigator.clipboard.writeText(campaignUrl)}
                className="px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--surface)" }}>
                Copiar
              </button>
              <a href={campaignUrl} target="_blank" rel="noopener noreferrer"
                className="px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--surface)" }}>
                Abrir
              </a>
            </div>
          </div>

          <div>
            <Field label="Domínio customizado (opcional)" value={settings.customDomain} onChange={v => updS("customDomain", v)}
              placeholder="pague.suaempresa.com.br"
              hint="Deixe em branco para usar apenas a URL gerada acima." />
            {settings.customDomain && (
              <div className="mt-3 p-4 rounded-xl text-sm space-y-2"
                style={{ background: "rgba(59,130,246,.06)", border: "1px solid rgba(59,130,246,.2)" }}>
                <p className="font-semibold" style={{ color: "#60a5fa" }}>Instruções DNS</p>
                <p style={{ color: "var(--text-muted)" }}>
                  No painel do seu provedor de DNS, aponte{" "}
                  <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "rgba(255,255,255,.08)" }}>{settings.customDomain}</code>{" "}
                  para este servidor:
                </p>
                <div className="flex flex-col gap-1.5 font-mono text-xs" style={{ color: "var(--text)" }}>
                  <div className="p-2 rounded" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                    CNAME @ cname.vercel-dns.com
                  </div>
                  <p className="text-center text-xs" style={{ color: "var(--text-muted)" }}>ou</p>
                  <div className="p-2 rounded" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                    A @ 76.76.21.21
                  </div>
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Após apontar o DNS, adicione o domínio no painel do Vercel. O SSL é gerado automaticamente.
                </p>
              </div>
            )}
          </div>
        </>)}

        {/* ─── EMPRESA ─── */}
        {activeTab === "empresa" && (<>
          <Heading icon="🏢" title="Identidade da Empresa" />

          <Field label="Nome da empresa" value={settings.companyName} onChange={v => updS("companyName", v)} />
          <Field label="Título da guia do navegador (tab)" value={settings.pageTitle} onChange={v => updS("pageTitle", v)}
            hint="Ex: NegociAI — Regularize sua dívida" />

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <ImageUpload label="Logo da empresa" value={settings.companyLogo}
                onChange={v => updS("companyLogo", v)}
                hint="PNG transparente · mín 200×60px" />
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                  Tamanho do logo — <span style={{ color: settings.primaryColor }}>{settings.logoHeight}px</span>
                </label>
                <input type="range" min={24} max={120} step={4} value={settings.logoHeight}
                  onChange={e => updS("logoHeight", Number(e.target.value))}
                  className="w-full" style={{ accentColor: settings.primaryColor }} />
                <div className="flex justify-between text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  <span>24px</span><span>120px</span>
                </div>
                {settings.companyLogo && (
                  <div className="mt-2 p-3 rounded-xl flex items-center gap-3" style={{ background: "#060A14", border: "1px solid rgba(255,255,255,.08)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settings.companyLogo} alt="preview" style={{ height: settings.logoHeight }} className="object-contain" />
                    <span className="text-xs" style={{ color: "rgba(255,255,255,.3)" }}>preview no header</span>
                  </div>
                )}
              </div>
            </div>
            <ImageUpload label="Favicon" value={settings.faviconUrl}
              onChange={v => updS("faviconUrl", v)}
              hint="ICO ou PNG 32×32px"
              accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/gif" />
          </div>
        </>)}

        {/* ─── CORES ─── */}
        {activeTab === "cores" && (<>
          <Heading icon="🎨" title="Cores & Tema" />
          <div className="p-4 rounded-xl" style={{ background: grad }}>
            <p className="text-white font-bold text-sm text-center">Preview do gradiente principal — {settings.companyName}</p>
          </div>

          <div className="space-y-5">
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>Cores do gradiente (navbar, botões, destaques)</p>
            <div className="grid grid-cols-2 gap-4">
              <CP label="Cor primária" value={settings.primaryColor} onChange={v => updS("primaryColor", v)} />
              <CP label="Cor secundária" value={settings.secondaryColor} onChange={v => updS("secondaryColor", v)} />
            </div>

            <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>Cor de destaque / urgência</p>
              <div className="grid grid-cols-2 gap-4">
                <CP label="Cor de acento" value={colorScheme.accentColor} onChange={v => updCS("accentColor", v)} />
              </div>
            </div>

            <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>Backgrounds das seções</p>
              <div className="grid grid-cols-2 gap-4">
                <CP label="Hero (fundo escuro)" value={colorScheme.heroBg} onChange={v => updCS("heroBg", v)} />
                <CP label="Navbar (fundo)" value={colorScheme.navBg} onChange={v => updCS("navBg", v)} text />
                <CP label="Seção Consulta (bg)" value={colorScheme.consultBg} onChange={v => updCS("consultBg", v)} />
                <CP label="Seção Quem Somos (bg)" value={colorScheme.aboutBg} onChange={v => updCS("aboutBg", v)} />
                <CP label="Seção Contato (bg)" value={colorScheme.contactBg} onChange={v => updCS("contactBg", v)} />
                <CP label="Footer (bg)" value={colorScheme.footerBg} onChange={v => updCS("footerBg", v)} />
              </div>
            </div>

            <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>Cores do texto</p>
              <div className="grid grid-cols-2 gap-4">
                <CP label="Texto da navbar" value={colorScheme.navTextColor} onChange={v => updCS("navTextColor", v)} text />
                <CP label="Texto do footer" value={colorScheme.footerTextColor} onChange={v => updCS("footerTextColor", v)} text />
              </div>
            </div>

            <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>Texto & Cards</p>
              <div className="grid grid-cols-2 gap-4">
                <CP label="Títulos das seções" value={colorScheme.titleColor} onChange={v => updCS("titleColor", v)} />
                <CP label="Subtítulos / corpo" value={colorScheme.subtitleColor} onChange={v => updCS("subtitleColor", v)} />
                <CP label="Fundo dos cards" value={colorScheme.cardBg} onChange={v => updCS("cardBg", v)} />
                <CP label="Borda dos cards" value={colorScheme.cardBorder} onChange={v => updCS("cardBorder", v)} />
                <CP label="Borda dos inputs" value={colorScheme.inputBorder} onChange={v => updCS("inputBorder", v)} />
                <CP label="Borda input (foco)" value={colorScheme.inputFocusBorder} onChange={v => updCS("inputFocusBorder", v)} />
              </div>
            </div>

            <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-4" style={{ color: "var(--text)" }}>Cores do Score de Crédito</p>
              <div className="grid grid-cols-3 gap-4">
                <CP label="Score ruim (< 400)" value={colorScheme.scoreColorBad} onChange={v => updCS("scoreColorBad", v)} />
                <CP label="Score médio (400–600)" value={colorScheme.scoreColorMid} onChange={v => updCS("scoreColorMid", v)} />
                <CP label="Score bom (> 600)" value={colorScheme.scoreColorGood} onChange={v => updCS("scoreColorGood", v)} />
              </div>
            </div>
          </div>
        </>)}

        {/* ─── BANNERS ─── */}
        {activeTab === "banners" && (<>
          <Heading icon="🖼️" title="Banners & Mídia" />

          <div>
            <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>Banner Carrossel (seção Hero)</p>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Aparece abaixo do hero, em container enquadrado. Até 5 imagens.</p>
            <BannerCarouselEditor images={settings.bannerImages} onChange={imgs => updS("bannerImages", imgs)} />
          </div>

          <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>Banner Principal (substitui o Hero)</p>
            <div className="flex items-start gap-2 mb-3 p-3 rounded-xl" style={{ background: "rgba(249,115,22,.07)", border: "1px solid rgba(249,115,22,.25)" }}>
              <span className="text-base flex-shrink-0">⚠️</span>
              <p className="text-xs" style={{ color: "#ea580c" }}>
                <strong>Quando preenchido</strong>, este banner substitui toda a área escura do hero (título, subtítulo, CTAs e stats ficam ocultos).
                Para usar o hero com texto, deixe este campo em branco.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 items-start">
              <div className="space-y-3">
                <ImageUpload
                  label="Imagem do banner principal"
                  value={pageContent.promoBannerUrl}
                  onChange={v => updPC("promoBannerUrl", v)}
                  hint="PNG, JPG ou SVG · Proporção recomendada 4:1 (ex: 1200×300px)"
                />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Ou use a URL:{" "}
                  <code className="px-1.5 py-0.5 rounded text-xs cursor-pointer font-mono"
                    style={{ background: "rgba(99,102,241,.1)", color: "#6366f1" }}
                    onClick={() => updPC("promoBannerUrl", "/banner-promo.svg")}>
                    /banner-promo.svg
                  </code>{" "}(banner padrão gerado)
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Link ao clicar</label>
                <input type="text" value={pageContent.promoBannerLink} onChange={e => updPC("promoBannerLink", e.target.value)}
                  className="input-field" placeholder="#consultar ou https://..." />
                <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
                  Use <code className="font-mono">#consultar</code> para rolar até a seção de consulta
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>Banners por Seção</p>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Aparecem como faixas entre as seções da página. Deixe em branco para ocultar.
            </p>
            {[
              { label: "Banner — antes da Seção Consulta", urlKey: "sectionBannerConsultUrl" as keyof PageContent, linkKey: "sectionBannerConsultLink" as keyof PageContent },
              { label: "Banner — antes da Seção Quem Somos", urlKey: "sectionBannerSobreUrl" as keyof PageContent, linkKey: "sectionBannerSobreLink" as keyof PageContent },
              { label: "Banner — antes da Seção Contato", urlKey: "sectionBannerContatoUrl" as keyof PageContent, linkKey: "sectionBannerContatoLink" as keyof PageContent },
            ].map(b => (
              <div key={b.label} className="mb-5 p-4 rounded-xl" style={{ background: "rgba(99,102,241,.04)", border: "1px solid var(--border)" }}>
                <p className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>{b.label}</p>
                <div className="grid md:grid-cols-2 gap-4 items-start">
                  <ImageUpload label="Imagem do banner" value={pageContent[b.urlKey] as string}
                    onChange={v => updPC(b.urlKey, v)} hint="PNG, JPG ou SVG · proporção recomendada 6:1" />
                  <div>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Link ao clicar</label>
                    <input type="text" value={pageContent[b.linkKey] as string} onChange={e => updPC(b.linkKey, e.target.value)}
                      className="input-field" placeholder="#ancora ou https://..." />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {/* ─── COPY HERO ─── */}
        {activeTab === "copy-hero" && (<>
          <Heading icon="✨" title="Copys — Seção Hero" />
          <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: pageContent.promoBannerUrl ? "rgba(249,115,22,.07)" : "rgba(99,102,241,.06)", border: `1px solid ${pageContent.promoBannerUrl ? "rgba(249,115,22,.3)" : "rgba(99,102,241,.2)"}` }}>
            <span className="text-base flex-shrink-0">{pageContent.promoBannerUrl ? "⚠️" : "ℹ️"}</span>
            <p className="text-xs" style={{ color: pageContent.promoBannerUrl ? "#ea580c" : "var(--text-muted)" }}>
              {pageContent.promoBannerUrl
                ? <><strong>Banner estático ativo.</strong> Estas copys não estão sendo exibidas — o banner substitui toda a área do hero. Para usar estas copys, remova o banner na aba <strong>Banners</strong>.</>
                : <>Estas copys são exibidas no hero quando <strong>nenhum banner estático</strong> está configurado.</>
              }
            </p>
          </div>
          <div className="space-y-4">
            <Field label="Badge de urgência (tag pequena)" value={pageContent.heroTag} onChange={v => updPC("heroTag", v)} hint="Ex: ⚡ Oferta por tempo limitado" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Título — linha 1 (branca)" value={pageContent.heroTitleLine1} onChange={v => updPC("heroTitleLine1", v)} />
              <Field label="Título — linha 2 (gradiente)" value={pageContent.heroTitleAccent} onChange={v => updPC("heroTitleAccent", v)} />
            </div>
            <Field label="Subtítulo" value={pageContent.heroSubtitle} onChange={v => updPC("heroSubtitle", v)} />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Botão CTA principal" value={pageContent.heroCta1} onChange={v => updPC("heroCta1", v)} />
              <Field label="Botão secundário" value={pageContent.heroCta2} onChange={v => updPC("heroCta2", v)} />
            </div>
            <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Stats do Hero (4 números)</p>
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: "rgba(99,102,241,.04)", border: "1px solid var(--border)" }}>
                    <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>Stat #{i}</p>
                    <div className="space-y-2">
                      <input type="text" value={pageContent[`heroStat${i}Val` as keyof PageContent] as string}
                        onChange={e => updPC(`heroStat${i}Val` as keyof PageContent, e.target.value)}
                        className="input-field text-sm" placeholder="Valor (ex: 340K+)" />
                      <input type="text" value={pageContent[`heroStat${i}Lbl` as keyof PageContent] as string}
                        onChange={e => updPC(`heroStat${i}Lbl` as keyof PageContent, e.target.value)}
                        className="input-field text-sm" placeholder="Label (ex: CPFs regularizados)" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>)}

        {/* ─── COPY CONSULTA ─── */}
        {activeTab === "copy-consulta" && (<>
          <Heading icon="🔍" title="Copys — Seção Consulta" />
          <div className="space-y-4">
            <Field label="Tag da seção" value={pageContent.consultTag} onChange={v => updPC("consultTag", v)} />
            <Field label="Título da seção" value={pageContent.consultTitle} onChange={v => updPC("consultTitle", v)} />
            <Field label="Subtítulo" value={pageContent.consultSubtitle} onChange={v => updPC("consultSubtitle", v)} />
            <Field label="Texto do botão CTA" value={pageContent.consultCta} onChange={v => updPC("consultCta", v)} />
            <Field label="Texto de privacidade (abaixo do botão)" value={pageContent.consultPrivacy} onChange={v => updPC("consultPrivacy", v)} />
            <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>TEXTOS DA OFERTA (resultado)</p>
              <div className="space-y-3">
                <Field label="Texto urgência" value={settings.urgencyText} onChange={v => updS("urgencyText", v)} />
                <Field label="Texto botão pagamento" value={settings.ctaText} onChange={v => updS("ctaText", v)} />
                <Field label="Texto de rodapé do card" value={settings.footerText} onChange={v => updS("footerText", v)} />
              </div>
            </div>
          </div>
        </>)}

        {/* ─── COPY SOBRE ─── */}
        {activeTab === "copy-sobre" && (<>
          <Heading icon="🏢" title="Copys — Seção Quem Somos" />
          <div className="space-y-4">
            <Field label="Tag da seção" value={pageContent.aboutTag} onChange={v => updPC("aboutTag", v)} />
            <Field label="Título" value={pageContent.aboutTitle} onChange={v => updPC("aboutTitle", v)} />
            <Field label="Subtítulo" value={pageContent.aboutSubtitle} onChange={v => updPC("aboutSubtitle", v)} />
            <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>4 Números de destaque</p>
              <div className="grid grid-cols-2 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: "rgba(99,102,241,.04)", border: "1px solid var(--border)" }}>
                    <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>Stat #{i}</p>
                    <div className="space-y-2">
                      <input type="text" value={pageContent[`aboutStat${i}Val` as keyof PageContent] as string}
                        onChange={e => updPC(`aboutStat${i}Val` as keyof PageContent, e.target.value)}
                        className="input-field text-sm" placeholder="Valor" />
                      <input type="text" value={pageContent[`aboutStat${i}Lbl` as keyof PageContent] as string}
                        onChange={e => updPC(`aboutStat${i}Lbl` as keyof PageContent, e.target.value)}
                        className="input-field text-sm" placeholder="Label" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>6 Cards de Diferenciais</p>
              <div className="space-y-3">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: "rgba(99,102,241,.04)", border: "1px solid var(--border)" }}>
                    <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>Card #{i}</p>
                    <div className="grid grid-cols-[60px_1fr_1fr] gap-2 items-start">
                      <input type="text" value={pageContent[`feat${i}Icon` as keyof PageContent] as string}
                        onChange={e => updPC(`feat${i}Icon` as keyof PageContent, e.target.value)}
                        className="input-field text-center text-lg" placeholder="🔍" />
                      <input type="text" value={pageContent[`feat${i}Title` as keyof PageContent] as string}
                        onChange={e => updPC(`feat${i}Title` as keyof PageContent, e.target.value)}
                        className="input-field text-sm" placeholder="Título" />
                      <input type="text" value={pageContent[`feat${i}Desc` as keyof PageContent] as string}
                        onChange={e => updPC(`feat${i}Desc` as keyof PageContent, e.target.value)}
                        className="input-field text-sm" placeholder="Descrição" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>)}

        {/* ─── COPY CONTATO ─── */}
        {activeTab === "copy-contato" && (<>
          <Heading icon="💬" title="Copys — Fale Conosco & Footer" />
          <div className="space-y-4">
            <Field label="Tag da seção" value={pageContent.contactTag} onChange={v => updPC("contactTag", v)} />
            <Field label="Título" value={pageContent.contactTitle} onChange={v => updPC("contactTitle", v)} />
            <Field label="Subtítulo" value={pageContent.contactSubtitle} onChange={v => updPC("contactSubtitle", v)} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone / WhatsApp" value={pageContent.contactPhone} onChange={v => updPC("contactPhone", v)} />
              <Field label="Horário do telefone" value={pageContent.contactPhoneSub} onChange={v => updPC("contactPhoneSub", v)} />
              <Field label="E-mail" value={pageContent.contactEmail} onChange={v => updPC("contactEmail", v)} />
              <Field label="Info do e-mail" value={pageContent.contactEmailSub} onChange={v => updPC("contactEmailSub", v)} />
              <Field label="Endereço" value={pageContent.contactAddress} onChange={v => updPC("contactAddress", v)} />
              <Field label="Complemento do endereço" value={pageContent.contactAddressSub} onChange={v => updPC("contactAddressSub", v)} />
              <Field label="Horários" value={pageContent.contactHours} onChange={v => updPC("contactHours", v)} />
              <Field label="Horários extra (sábado etc)" value={pageContent.contactHoursSub} onChange={v => updPC("contactHoursSub", v)} />
            </div>
            <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Card CTA (direita)</p>
              <div className="space-y-3">
                <Field label="Título do card" value={pageContent.ctaCardTitle} onChange={v => updPC("ctaCardTitle", v)} />
                <Field label="Descrição" value={pageContent.ctaCardDesc} onChange={v => updPC("ctaCardDesc", v)} />
                <Field label="Texto do botão" value={pageContent.ctaCardBtn} onChange={v => updPC("ctaCardBtn", v)} />
              </div>
            </div>
            <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Footer</p>
              <div className="space-y-3">
                <Field label="Tagline do footer" value={pageContent.footerTagline} onChange={v => updPC("footerTagline", v)} />
                <Field label="Texto de segurança (rodapé)" value={settings.footerText} onChange={v => updS("footerText", v)} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Link X (Twitter)" value={pageContent.socialX} onChange={v => updPC("socialX", v)} />
                  <Field label="Link LinkedIn" value={pageContent.socialLinkedin} onChange={v => updPC("socialLinkedin", v)} />
                  <Field label="Link Facebook" value={pageContent.socialFacebook} onChange={v => updPC("socialFacebook", v)} />
                </div>
              </div>
            </div>
          </div>
        </>)}

        {/* ─── NEGÓCIO ─── */}
        {activeTab === "negocio" && (<>
          <Heading icon="⚙️" title="Configurações de Negócio" />
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Cobrança</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Desconto (%)</label>
                  <div className="relative">
                    <input type="number" min={1} max={99} value={settings.discountPercent}
                      onChange={e => updS("discountPercent", Number(e.target.value))}
                      className="input-field pr-10" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "var(--text-muted)" }}>%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Valor padrão (R$)</label>
                  <input type="number" min={0} step={0.01} value={settings.defaultDebtAmount}
                    onChange={e => updS("defaultDebtAmount", Number(e.target.value))} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Descrição padrão da dívida</label>
                  <input type="text" value={settings.defaultDebtDesc} onChange={e => updS("defaultDebtDesc", e.target.value)}
                    className="input-field" placeholder="Dívida em aberto" />
                </div>
              </div>
              <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: "rgba(99,102,241,.06)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                Quando o CPF não está na lista de devedores, será exibida uma dívida com os valores acima.
              </div>
            </div>
            <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Score de crédito</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Score mínimo</label>
                  <input type="number" min={0} max={999} value={settings.scoreMin}
                    onChange={e => updS("scoreMin", Number(e.target.value))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Score máximo</label>
                  <input type="number" min={0} max={999} value={settings.scoreMax}
                    onChange={e => updS("scoreMax", Number(e.target.value))} className="input-field" />
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Faixa exibida ao cliente</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>Score após pagamento</label>
                  <input type="number" min={0} max={1000} value={settings.scoreAfterPay}
                    onChange={e => updS("scoreAfterPay", Number(e.target.value))} className="input-field" />
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Prévia motivacional</p>
                </div>
              </div>
            </div>
            <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>Link de Checkout / PIX</p>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Ao clicar em "Pagar via PIX", o cliente é redirecionado para este link.</p>
              <input type="url" value={settings.checkoutUrl} onChange={e => updS("checkoutUrl", e.target.value)}
                className="input-field" placeholder="https://checkout.pagamento.com.br/..." />
              {settings.checkoutUrl && (
                <a href={settings.checkoutUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium hover:underline"
                  style={{ color: settings.primaryColor }}>🔗 Testar link</a>
              )}
            </div>
            <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
              <p className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>Número do WhatsApp</p>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Código do país + DDD + número, sem espaços. Ex: 5511912345678</p>
              <input type="text" value={settings.whatsappNumber} onChange={e => updS("whatsappNumber", e.target.value)}
                className="input-field" placeholder="5511912345678" />
              {settings.whatsappNumber && (
                <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium hover:underline"
                  style={{ color: "#25D366" }}>
                  <span>📱</span> Testar link do WhatsApp
                </a>
              )}
            </div>
          </div>
        </>)}

        {/* ─── WEBHOOK ─── */}
        {activeTab === "webhook" && (<>
          <Heading icon="🔗" title="Webhook de Pagamentos" />
          <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <p className="font-semibold mb-1" style={{ color: "var(--text)" }}>Como funciona</p>
            <p style={{ color: "var(--text-muted)" }}>
              Quando um pagamento for confirmado pelo processador (Mercado Pago, PushinPay, PagHiper etc.),
              ele envia uma notificação para o seu endpoint. O sistema atualiza o status do devedor automaticamente
              e registra o evento{" "}
              <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--border)" }}>PAGAMENTO_CONCLUIDO</code>{" "}
              nos logs.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>URL do Webhook</p>
            <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
              Configure esta URL no painel do seu processador de pagamento.
            </p>
            <div className="flex items-center gap-2 p-3 rounded-xl font-mono text-sm break-all"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text)" }}>
                {appUrl}/api/webhook/payment?secret=
                <span style={{ color: settings.primaryColor }}>{settings.webhookSecret || "SEU_SECRET"}</span>
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold" style={{ color: "var(--text)" }}>Token secreto (webhook secret)</label>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Qualquer string aleatória. Cole no campo de secret/token do seu processador e aqui.
              Deixe em branco para desativar a validação (não recomendado).
            </p>
            <div className="flex gap-2">
              <input type="text" value={settings.webhookSecret} onChange={e => updS("webhookSecret", e.target.value)}
                className="input-field font-mono flex-1" placeholder="ex: wh_k9x2mLp3nQ7rT1vZ..." />
              <button type="button" onClick={() => {
                const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                updS("webhookSecret", "wh_" + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
              }} className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
                style={{ borderColor: "var(--border)", color: "var(--text)", background: "var(--surface)" }}>
                Gerar
              </button>
            </div>
          </div>
          <div className="border-t pt-5" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-bold mb-3" style={{ color: "var(--text)" }}>Compatibilidade</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { name: "Mercado Pago", field: "status: approved" },
                { name: "PushinPay", field: "status: paid" },
                { name: "PagHiper", field: "situation: paid" },
                { name: "Genérico", field: "cpf + status: paid" },
              ].map(p => (
                <div key={p.name} className="p-3 rounded-xl text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p className="text-sm font-bold" style={{ color: "var(--text)" }}>{p.name}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{p.field}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "#f59e0b" }}>Campos reconhecidos no payload</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              O sistema detecta automaticamente o CPF nos campos: <code>cpf</code>, <code>document</code>, <code>payer_cpf</code>, <code>payer.identification.number</code>, <code>customer.cpf</code>.
              O status é lido de: <code>status</code>, <code>payment_status</code>, <code>situation</code>.
            </p>
          </div>
        </>)}

      </div>
    </div>
  );
}

/* ─── Mini components ─────────────────────────── */
function Heading({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: "var(--border)" }}>
      <span className="text-xl">{icon}</span>
      <h2 className="font-bold" style={{ color: "var(--text)" }}>{title}</h2>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="input-field" />
      {hint && <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}

function CP({ label, value, onChange, text }: {
  label: string; value: string; onChange: (v: string) => void; text?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>{label}</label>
      <div className="flex items-center gap-2">
        {!text && (
          <input type="color" value={value.startsWith("rgba") || value.startsWith("rgb") ? "#000000" : value}
            onChange={e => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border-2 p-0.5 flex-shrink-0"
            style={{ borderColor: "var(--border)" }} />
        )}
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          className="input-field font-mono text-sm flex-1" />
      </div>
    </div>
  );
}
