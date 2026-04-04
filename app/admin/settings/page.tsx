"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  companyName: string;
  companyLogo: string;
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
  bannerUrl: string;
}

const DEFAULT: Settings = {
  companyName: "NegociAI",
  companyLogo: "",
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
  bannerUrl: "",
};

type SectionKey = "empresa" | "cobranca" | "score" | "copy" | "checkout";

const SECTIONS: { key: SectionKey; icon: string; label: string }[] = [
  { key: "empresa", icon: "🏢", label: "Empresa & Visual" },
  { key: "cobranca", icon: "💰", label: "Cobrança" },
  { key: "score", icon: "📊", label: "Fake Score" },
  { key: "copy", icon: "✍️", label: "Copywriting" },
  { key: "checkout", icon: "💳", label: "Checkout" },
];

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
      .then((data) => { if (data) setSettings({ ...DEFAULT, ...data }); })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  function upd(key: keyof Settings, value: string | number) {
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
      <div className="bg-white rounded-2xl card-shadow p-6 space-y-5">

        {/* EMPRESA */}
        {activeSection === "empresa" && (
          <>
            <SectionTitle icon="🏢" title="Identidade da Empresa" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome da empresa" value={settings.companyName} onChange={(v) => upd("companyName", v)} />
              <Field label="URL do logo (imagem)" value={settings.companyLogo} onChange={(v) => upd("companyLogo", v)} placeholder="https://..." />
              <Field label="URL do favicon" value={settings.faviconUrl} onChange={(v) => upd("faviconUrl", v)} placeholder="https://..." />
              <Field label="URL do banner" value={settings.bannerUrl} onChange={(v) => upd("bannerUrl", v)} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cor primária</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={settings.primaryColor}
                    onChange={(e) => upd("primaryColor", e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-gray-200 p-1" />
                  <input type="text" value={settings.primaryColor}
                    onChange={(e) => upd("primaryColor", e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cor secundária</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={settings.secondaryColor}
                    onChange={(e) => upd("secondaryColor", e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-gray-200 p-1" />
                  <input type="text" value={settings.secondaryColor}
                    onChange={(e) => upd("secondaryColor", e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 text-sm font-mono" />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="rounded-xl p-4 text-white text-center font-bold text-sm" style={{ background: grad }}>
              Preview do gradiente: {settings.companyName}
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
                <p className="text-xs text-gray-400 mt-1">Ex: 60 = 60% de desconto</p>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Descrição padrão
                </label>
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
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { range: `${settings.scoreMin}–${settings.scoreMax}`, label: "Faixa exibida", color: "bg-red-50 text-red-700 border-red-200" },
                { range: "Score baixo / em risco", label: "Mensagem exibida", color: "bg-orange-50 text-orange-700 border-orange-200" },
                { range: `→ ${settings.scoreAfterPay}`, label: "Após regularizar", color: "bg-green-50 text-green-700 border-green-200" },
              ].map((item) => (
                <div key={item.label} className={`border rounded-xl p-3 ${item.color}`}>
                  <p className="font-bold text-sm">{item.range}</p>
                  <p className="text-xs mt-0.5 opacity-70">{item.label}</p>
                </div>
              ))}
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
                onChange={(v) => upd("headerSubtitle", v)}
                placeholder="Consulte sua dívida e quite com desconto" />
              <Field label="Texto de urgência (badge)" value={settings.urgencyText}
                onChange={(v) => upd("urgencyText", v)}
                placeholder="⚡ Oferta por tempo limitado!" />
              <Field label="Texto do botão CTA" value={settings.ctaText}
                onChange={(v) => upd("ctaText", v)}
                placeholder="Pagar via PIX agora" />
              <Field label="Texto do rodapé" value={settings.footerText}
                onChange={(v) => upd("footerText", v)}
                placeholder="Seus dados estão protegidos." />
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
                Use link de pagamento do Mercado Pago, PagSeguro, Hotmart, ou qualquer gateway.
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                URL de checkout (link de pagamento)
              </label>
              <input type="url" value={settings.checkoutUrl}
                onChange={(e) => upd("checkoutUrl", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 text-sm"
                placeholder="https://pagamento.mercadopago.com.br/..." />
            </div>
            <div className="mt-4">
              {settings.checkoutUrl ? (
                <a href={settings.checkoutUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-indigo-600 text-sm font-medium hover:underline">
                  🔗 Testar link de checkout
                </a>
              ) : (
                <p className="text-sm text-gray-400">Nenhum link configurado ainda.</p>
              )}
            </div>
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

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 transition-colors text-sm"
      />
    </div>
  );
}
