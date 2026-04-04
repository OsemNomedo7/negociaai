"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import BannerCarouselEditor from "@/components/BannerCarouselEditor";

interface Settings {
  companyName: string;
  companyLogo: string;
  logoHeight: number;
  primaryColor: string;
  secondaryColor: string;
  discountPercent: number;
  defaultDebtAmount: number;
  defaultDebtDesc: string;
  checkoutUrl: string;
  scoreMin: number;
  scoreMax: number;
  scoreAfterPay: number;
  headerTitle: string;
  headerSubtitle: string;
  urgencyText: string;
  ctaText: string;
  footerText: string;
  faviconUrl: string;
  bannerImages: string[];
}

const DEFAULT: Settings = {
  companyName: "NegociAI",
  companyLogo: "",
  logoHeight: 44,
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  discountPercent: 60,
  defaultDebtAmount: 1200,
  defaultDebtDesc: "Dívida em aberto",
  checkoutUrl: "",
  scoreMin: 280,
  scoreMax: 420,
  scoreAfterPay: 820,
  headerTitle: "Regularize sua situação financeira",
  headerSubtitle: "Consulte sua dívida e quite com até 60% de desconto",
  urgencyText: "⚡ Oferta por tempo limitado — expira em breve!",
  ctaText: "Pagar via PIX agora",
  footerText: "Seus dados estão protegidos. Ambiente 100% seguro.",
  faviconUrl: "",
  bannerImages: [],
};

type SectionKey = "empresa" | "cobranca" | "score" | "copy" | "checkout";

const SECTIONS: { key: SectionKey; icon: string; label: string }[] = [
  { key: "empresa", icon: "🏢", label: "Empresa & Visual" },
  { key: "cobranca", icon: "💰", label: "Cobrança" },
  { key: "score", icon: "📊", label: "Fake Score" },
  { key: "copy", icon: "✍️", label: "Copywriting" },
  { key: "checkout", icon: "💳", label: "Checkout" },
];

function parseBannerImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("empresa");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => {
        if (r.status === 401) { router.push("/admin/login"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setSettings({
            ...DEFAULT,
            ...data,
            bannerImages: parseBannerImages(data.bannerImages),
            logoHeight: data.logoHeight ?? DEFAULT.logoHeight,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave() {
    setSaving(true);
    const payload = {
      ...settings,
      bannerImages: JSON.stringify(settings.bannerImages),
    };
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function upd<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
      Carregando...
    </div>
  );

  const grad = `linear-gradient(135deg, ${settings.primaryColor}, ${settings.secondaryColor})`;

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Configurações</h1>
          <p className="text-gray-500 text-sm mt-0.5">Personalize todo o sistema</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          style={saved ? undefined : { background: grad }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-md transition-all ${
            saved ? "bg-green-500" : "hover:opacity-90"
          } disabled:opacity-50`}
        >
          {saving ? "Salvando..." : saved ? "✅ Salvo!" : "Salvar alterações"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeSection === s.key
                ? "text-white shadow-md"
                : "bg-white border-2 border-gray-200 text-gray-600 hover:border-indigo-300"
            }`}
            style={activeSection === s.key ? { background: grad } : undefined}
          >
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="bg-white rounded-2xl card-shadow p-6 space-y-6">

        {/* EMPRESA */}
        {activeSection === "empresa" && (
          <>
            <SectionTitle icon="🏢" title="Identidade da Empresa" />

            <Field
              label="Nome da empresa"
              value={settings.companyName}
              onChange={(v) => upd("companyName", v)}
            />

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <ImageUpload
                  label="Logo da empresa"
                  value={settings.companyLogo}
                  onChange={(v) => upd("companyLogo", v)}
                  hint="Recomendado: PNG transparente, mín. 200×60px"
                />
                {/* Controle de tamanho do logo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Tamanho do logo — <span className="font-normal text-indigo-600">{settings.logoHeight}px</span>
                  </label>
                  <input
                    type="range"
                    min={24}
                    max={120}
                    step={4}
                    value={settings.logoHeight}
                    onChange={(e) => upd("logoHeight", Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>24px (pequeno)</span>
                    <span>120px (grande)</span>
                  </div>
                  {/* Preview ao vivo */}
                  {settings.companyLogo && (
                    <div className="mt-2 p-3 rounded-xl border border-gray-200 bg-gray-900 flex items-center gap-3">
                      <img
                        src={settings.companyLogo}
                        alt="preview"
                        style={{ height: settings.logoHeight }}
                        className="object-contain"
                      />
                      <span className="text-white/40 text-xs">preview no header</span>
                    </div>
                  )}
                </div>
              </div>
              <ImageUpload
                label="Favicon"
                value={settings.faviconUrl}
                onChange={(v) => upd("faviconUrl", v)}
                hint="Recomendado: ICO ou PNG 32×32px"
                accept="image/x-icon,image/vnd.microsoft.icon,image/png,image/gif"
              />
            </div>

            {/* Banner Carrossel */}
            <div className="border-t border-gray-100 pt-5">
              <BannerCarouselEditor
                images={settings.bannerImages}
                onChange={(imgs) => upd("bannerImages", imgs)}
              />
              {settings.bannerImages.length > 1 && (
                <div className="mt-3 p-3 bg-indigo-50 rounded-xl">
                  <p className="text-xs text-indigo-600 font-medium">
                    🎠 O carrossel vai rotacionar automaticamente a cada 4 segundos na página pública.
                    Arraste as miniaturas para reordenar.
                  </p>
                </div>
              )}
            </div>

            {/* Cores */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm font-bold text-gray-700 mb-4">Cores do tema</p>
              <div className="grid grid-cols-2 gap-4">
                <ColorPicker
                  label="Cor primária"
                  value={settings.primaryColor}
                  onChange={(v) => upd("primaryColor", v)}
                />
                <ColorPicker
                  label="Cor secundária"
                  value={settings.secondaryColor}
                  onChange={(v) => upd("secondaryColor", v)}
                />
              </div>
              <div className="mt-3 rounded-xl p-3 text-white text-center font-bold text-sm" style={{ background: grad }}>
                Preview do gradiente — {settings.companyName}
              </div>
            </div>
          </>
        )}

        {/* COBRANÇA */}
        {activeSection === "cobranca" && (
          <>
            <SectionTitle icon="💰" title="Configurações de Cobrança" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Percentual de desconto (%)
                </label>
                <div className="relative">
                  <input type="number" min={1} max={99} value={settings.discountPercent}
                    onChange={(e) => upd("discountPercent", Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 text-sm" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Valor padrão (sem cadastro) — R$
                </label>
                <input type="number" min={0} step={0.01} value={settings.defaultDebtAmount}
                  onChange={(e) => upd("defaultDebtAmount", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrição padrão</label>
                <input type="text" value={settings.defaultDebtDesc}
                  onChange={(e) => upd("defaultDebtDesc", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 text-sm"
                  placeholder="Ex: Dívida em aberto" />
              </div>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-sm text-indigo-700 font-medium">
                Quando o CPF consultado <strong>não está na lista</strong> de devedores,
                será exibida uma dívida com o valor e descrição padrão acima.
              </p>
            </div>
          </>
        )}

        {/* FAKE SCORE */}
        {activeSection === "score" && (
          <>
            <SectionTitle icon="📊" title="Configuração do Fake Score" />
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2">
              <p className="text-sm text-amber-700 font-medium">
                O score exibido é gerado aleatoriamente dentro da faixa configurada.
                O &quot;score após pagamento&quot; é apenas uma prévia visual motivacional.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Score mínimo</label>
                <input type="number" min={0} max={999} value={settings.scoreMin}
                  onChange={(e) => upd("scoreMin", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Score máximo</label>
                <input type="number" min={0} max={999} value={settings.scoreMax}
                  onChange={(e) => upd("scoreMax", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 text-sm" />
                <p className="text-xs text-gray-400 mt-1">Faixa exibida ao cliente</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Score após pagamento</label>
                <input type="number" min={0} max={1000} value={settings.scoreAfterPay}
                  onChange={(e) => upd("scoreAfterPay", Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 text-sm" />
                <p className="text-xs text-gray-400 mt-1">Prévia motivacional</p>
              </div>
            </div>
          </>
        )}

        {/* COPY */}
        {activeSection === "copy" && (
          <>
            <SectionTitle icon="✍️" title="Textos e Copywriting" />
            <div className="space-y-4">
              <Field label="Título principal (header)" value={settings.headerTitle}
                onChange={(v) => upd("headerTitle", v)}
                placeholder="Regularize sua situação financeira" />
              <Field label="Subtítulo (header)" value={settings.headerSubtitle}
                onChange={(v) => upd("headerSubtitle", v)} />
              <Field label="Texto de urgência (badge)" value={settings.urgencyText}
                onChange={(v) => upd("urgencyText", v)} />
              <Field label="Texto do botão CTA" value={settings.ctaText}
                onChange={(v) => upd("ctaText", v)} />
              <Field label="Texto do rodapé" value={settings.footerText}
                onChange={(v) => upd("footerText", v)} />
            </div>
          </>
        )}

        {/* CHECKOUT */}
        {activeSection === "checkout" && (
          <>
            <SectionTitle icon="💳" title="Link de Checkout / PIX" />
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-700 font-medium">
                Ao clicar em &quot;Pagar via PIX&quot;, o cliente é redirecionado para este link.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                URL de checkout
              </label>
              <input type="url" value={settings.checkoutUrl}
                onChange={(e) => upd("checkoutUrl", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 text-sm"
                placeholder="https://..." />
            </div>
            {settings.checkoutUrl && (
              <a href={settings.checkoutUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:underline mt-2">
                🔗 Testar link
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
      <span className="text-xl">{icon}</span>
      <h2 className="font-bold text-gray-800">{title}</h2>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 transition-colors text-sm" />
    </div>
  );
}

function ColorPicker({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-12 h-12 rounded-xl cursor-pointer border-2 border-gray-200 p-1" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-mono" />
      </div>
    </div>
  );
}
