"use client";

import { useEffect, useState, useCallback } from "react";
import BannerCarouselEditor from "@/components/BannerCarouselEditor";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Campaign {
  id: number;
  slug: string;
  name: string;
  customDomain?: string;
  active: boolean;
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
  webhookSecret: string;
  scoreMin: number;
  scoreMax: number;
  scoreAfterPay: number;
  urgencyText: string;
  ctaText: string;
  footerText: string;
  whatsappNumber: string;
  bannerImages: string[];
  stats: { consults: number; payments: number };
  _count: { debtors: number; logs: number };
}

interface Debtor {
  id: number;
  name: string;
  cpf: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

const EMPTY_FORM: Omit<Campaign, "id" | "active" | "stats" | "_count"> = {
  slug: "",
  name: "",
  customDomain: "",
  companyName: "NegociAI",
  companyLogo: "",
  logoHeight: 44,
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  faviconUrl: "",
  pageTitle: "NegociAI",
  headerTitle: "Regularize sua situação financeira",
  headerSubtitle: "Consulte sua dívida e quite com até 60% de desconto",
  discountPercent: 60,
  defaultDebtAmount: 1200,
  defaultDebtDesc: "Dívida em aberto",
  checkoutUrl: "",
  webhookSecret: "",
  scoreMin: 280,
  scoreMax: 420,
  scoreAfterPay: 820,
  urgencyText: "⚡ Oferta por tempo limitado",
  ctaText: "Pagar via PIX agora",
  footerText: "Ambiente 100% seguro.",
  whatsappNumber: "",
  bannerImages: [],
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: "rgba(248,250,252,.4)", letterSpacing: ".06em", textTransform: "uppercase" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", style }: {
  value: string | number; onChange: (v: string) => void;
  placeholder?: string; type?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: "9px 12px", borderRadius: 8,
        background: "rgba(255,255,255,.05)",
        border: "1px solid rgba(255,255,255,.1)",
        color: "#f8fafc", fontSize: 13, fontFamily: "inherit", outline: "none",
        width: "100%",
        ...style,
      }}
    />
  );
}

/* ─── Campaign Form Modal ────────────────────────────────────────────────── */
function CampaignModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<Campaign> | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!initial?.id;
  const [form, setForm] = useState<typeof EMPTY_FORM>(() => ({
    ...EMPTY_FORM,
    ...(initial
      ? {
          slug: initial.slug ?? "",
          name: initial.name ?? "",
          customDomain: initial.customDomain ?? "",
          companyName: initial.companyName ?? EMPTY_FORM.companyName,
          companyLogo: initial.companyLogo ?? "",
          logoHeight: initial.logoHeight ?? 44,
          primaryColor: initial.primaryColor ?? "#6366f1",
          secondaryColor: initial.secondaryColor ?? "#8b5cf6",
          faviconUrl: initial.faviconUrl ?? "",
          pageTitle: initial.pageTitle ?? "NegociAI",
          headerTitle: initial.headerTitle ?? EMPTY_FORM.headerTitle,
          headerSubtitle: initial.headerSubtitle ?? EMPTY_FORM.headerSubtitle,
          discountPercent: initial.discountPercent ?? 60,
          defaultDebtAmount: initial.defaultDebtAmount ?? 1200,
          defaultDebtDesc: initial.defaultDebtDesc ?? EMPTY_FORM.defaultDebtDesc,
          checkoutUrl: initial.checkoutUrl ?? "",
          webhookSecret: initial.webhookSecret ?? "",
          scoreMin: initial.scoreMin ?? 280,
          scoreMax: initial.scoreMax ?? 420,
          scoreAfterPay: initial.scoreAfterPay ?? 820,
          urgencyText: initial.urgencyText ?? EMPTY_FORM.urgencyText,
          ctaText: initial.ctaText ?? EMPTY_FORM.ctaText,
          footerText: initial.footerText ?? EMPTY_FORM.footerText,
          whatsappNumber: initial.whatsappNumber ?? "",
          bannerImages: Array.isArray(initial.bannerImages) ? initial.bannerImages : [],
        }
      : {}),
  }));

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [slugManual, setSlugManual] = useState(isEdit);

  function set<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function handleName(v: string) {
    set("name", v);
    if (!slugManual) set("slug", slugify(v));
  }

  async function handleSave() {
    setErr("");
    setSaving(true);
    try {
      const url = isEdit ? `/api/admin/campaigns/${initial!.id}` : "/api/admin/campaigns";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Erro ao salvar."); return; }
      onSave();
    } catch {
      setErr("Erro de conexão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px 16px", overflowY: "auto",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 620,
        background: "#0f0f12",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 16, overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,.7)",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>
            {isEdit ? "Editar campanha" : "Nova campanha"}
          </h2>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,.4)", display: "flex",
          }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Section: Identidade */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".1em", textTransform: "uppercase" }}>
            Identidade
          </p>

          <FieldGroup label="Nome *">
            <Input value={form.name} onChange={handleName} placeholder="Ex: Campanha de Verão" />
          </FieldGroup>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldGroup label="Slug *">
              <Input
                value={form.slug}
                onChange={v => { setSlugManual(true); set("slug", slugify(v)); }}
                placeholder="minha-campanha"
              />
            </FieldGroup>
            <FieldGroup label="Título da página (SEO)">
              <Input value={form.pageTitle} onChange={v => set("pageTitle", v)} placeholder="NegociAI" />
            </FieldGroup>
          </div>

          {/* Domínio customizado */}
          <FieldGroup label="Domínio customizado (opcional)">
            <Input value={form.customDomain ?? ""} onChange={v => set("customDomain", v)} placeholder="pague.suaempresa.com.br" />
          </FieldGroup>
          {form.customDomain && (
            <div style={{
              padding: "12px 14px", borderRadius: 8,
              background: "rgba(59,130,246,.06)", border: "1px solid rgba(59,130,246,.2)",
              fontSize: 12, color: "rgba(248,250,252,.6)", lineHeight: 1.7,
            }}>
              <span style={{ color: "#60a5fa", fontWeight: 700 }}>Instruções DNS</span>
              {" — aponte o domínio "}
              <code style={{ background: "rgba(255,255,255,.08)", padding: "1px 5px", borderRadius: 4 }}>{form.customDomain}</code>
              {" para este servidor adicionando um registro:"}
              <br />
              <code style={{ background: "rgba(255,255,255,.08)", padding: "2px 8px", borderRadius: 4, display: "inline-block", marginTop: 4 }}>
                CNAME @ cname.vercel-dns.com
              </code>
              {" ou "}
              <code style={{ background: "rgba(255,255,255,.08)", padding: "2px 8px", borderRadius: 4, display: "inline-block" }}>
                A @ 76.76.21.21
              </code>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 12 }}>
            <FieldGroup label="URL do logo">
              <Input value={form.companyLogo} onChange={v => set("companyLogo", v)} placeholder="https://..." />
            </FieldGroup>
            <FieldGroup label="Altura (px)">
              <Input type="number" value={form.logoHeight} onChange={v => set("logoHeight", Number(v))} />
            </FieldGroup>
          </div>

          <FieldGroup label="URL do favicon">
            <Input value={form.faviconUrl} onChange={v => set("faviconUrl", v)} placeholder="https://...favicon.ico" />
          </FieldGroup>

          <FieldGroup label="Nome da empresa">
            <Input value={form.companyName} onChange={v => set("companyName", v)} />
          </FieldGroup>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FieldGroup label="Cor primária">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={form.primaryColor}
                  onChange={e => set("primaryColor", e.target.value)}
                  style={{ width: 36, height: 36, borderRadius: 6, border: "none", background: "none", cursor: "pointer" }} />
                <Input value={form.primaryColor} onChange={v => set("primaryColor", v)} />
              </div>
            </FieldGroup>
            <FieldGroup label="Cor secundária">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={form.secondaryColor}
                  onChange={e => set("secondaryColor", e.target.value)}
                  style={{ width: 36, height: 36, borderRadius: 6, border: "none", background: "none", cursor: "pointer" }} />
                <Input value={form.secondaryColor} onChange={v => set("secondaryColor", v)} />
              </div>
            </FieldGroup>
          </div>

          {/* Section: Conteúdo */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 8 }}>
            Conteúdo
          </p>

          <FieldGroup label="Título do header">
            <Input value={form.headerTitle} onChange={v => set("headerTitle", v)} />
          </FieldGroup>
          <FieldGroup label="Subtítulo do header">
            <Input value={form.headerSubtitle} onChange={v => set("headerSubtitle", v)} />
          </FieldGroup>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <FieldGroup label="Desconto %">
              <Input type="number" value={form.discountPercent} onChange={v => set("discountPercent", Number(v))} />
            </FieldGroup>
            <FieldGroup label="Valor padrão (R$)">
              <Input type="number" value={form.defaultDebtAmount} onChange={v => set("defaultDebtAmount", Number(v))} />
            </FieldGroup>
            <FieldGroup label="Descrição padrão">
              <Input value={form.defaultDebtDesc} onChange={v => set("defaultDebtDesc", v)} />
            </FieldGroup>
          </div>

          <FieldGroup label="URL de checkout">
            <Input value={form.checkoutUrl} onChange={v => set("checkoutUrl", v)} placeholder="https://..." />
          </FieldGroup>

          <FieldGroup label="Número WhatsApp">
            <Input value={form.whatsappNumber} onChange={v => set("whatsappNumber", v)} placeholder="5511999999999" />
          </FieldGroup>

          {/* Section: Score */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 8 }}>
            Score
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <FieldGroup label="Score mín">
              <Input type="number" value={form.scoreMin} onChange={v => set("scoreMin", Number(v))} />
            </FieldGroup>
            <FieldGroup label="Score máx">
              <Input type="number" value={form.scoreMax} onChange={v => set("scoreMax", Number(v))} />
            </FieldGroup>
            <FieldGroup label="Score pós-pag.">
              <Input type="number" value={form.scoreAfterPay} onChange={v => set("scoreAfterPay", Number(v))} />
            </FieldGroup>
          </div>

          {/* Section: Textos */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 8 }}>
            Textos
          </p>

          <FieldGroup label="Texto de urgência">
            <Input value={form.urgencyText} onChange={v => set("urgencyText", v)} />
          </FieldGroup>
          <FieldGroup label="Texto do botão CTA">
            <Input value={form.ctaText} onChange={v => set("ctaText", v)} />
          </FieldGroup>
          <FieldGroup label="Texto do rodapé">
            <Input value={form.footerText} onChange={v => set("footerText", v)} />
          </FieldGroup>

          {/* Section: Banners */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 8 }}>
            Banners (até 5)
          </p>
          <BannerCarouselEditor
            images={form.bannerImages}
            onChange={imgs => set("bannerImages", imgs)}
          />

          {/* Section: Webhook */}
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".1em", textTransform: "uppercase", marginTop: 8 }}>
            Webhook de pagamento
          </p>
          <FieldGroup label="Token secreto">
            <div style={{ display: "flex", gap: 8 }}>
              <Input value={form.webhookSecret} onChange={v => set("webhookSecret", v)} placeholder="Token para validar o webhook" />
              <button
                type="button"
                onClick={() => set("webhookSecret", Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2))}
                style={{
                  padding: "9px 14px", borderRadius: 8, whiteSpace: "nowrap",
                  background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)",
                  color: "rgba(248,250,252,.7)", fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                }}
              >
                Gerar
              </button>
            </div>
          </FieldGroup>
          {isEdit && form.slug && (
            <div style={{ fontSize: 11, color: "rgba(248,250,252,.4)", lineHeight: 1.6 }}>
              URL do webhook:{" "}
              <code style={{ background: "rgba(255,255,255,.06)", padding: "2px 6px", borderRadius: 4 }}>
                {typeof window !== "undefined" ? window.location.origin : ""}/api/webhook/payment?secret={form.webhookSecret || "<token>"}
              </code>
            </div>
          )}

          {err && (
            <div style={{
              padding: "10px 14px", borderRadius: 8,
              background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)",
              color: "#f87171", fontSize: 13,
            }}>
              {err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 22px", borderTop: "1px solid rgba(255,255,255,.06)",
          display: "flex", gap: 10, justifyContent: "flex-end",
        }}>
          <button onClick={onClose} style={{
            padding: "9px 18px", borderRadius: 8,
            background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)",
            color: "rgba(248,250,252,.6)", fontSize: 13, fontWeight: 600,
            fontFamily: "inherit", cursor: "pointer",
          }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            padding: "9px 20px", borderRadius: 8,
            background: saving ? "rgba(239,68,68,.3)" : "#ef4444",
            border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
            fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer",
            transition: "background .15s",
          }}>
            {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar campanha"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Debtors Modal ──────────────────────────────────────────────────────── */
const INP = { padding: "8px 10px", borderRadius: 7, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "#f8fafc", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%" } as React.CSSProperties;
const STATUS_OPTS = ["PENDENTE", "PAGO", "NEGOCIANDO", "CANCELADO"];

function DebtorsModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  // Add form
  const [form, setForm] = useState({ name: "", cpf: "", amount: "", description: "Dívida em aberto", status: "PENDENTE" });
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");

  // Edit
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; cpf: string; amount: string; description: string; status: string }>({ name: "", cpf: "", amount: "", description: "", status: "" });
  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState("");

  // Delete
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadDebtors = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/debtors?page=${p}&limit=20`);
      const data = await res.json();
      setDebtors(data.debtors || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setPage(p);
    } finally { setLoading(false); }
  }, [campaign.id]);

  useEffect(() => { loadDebtors(1); }, [loadDebtors]);

  function fmtCPF(v: string) {
    const c = v.replace(/\D/g, "").slice(0, 11);
    if (c.length <= 3) return c;
    if (c.length <= 6) return `${c.slice(0,3)}.${c.slice(3)}`;
    if (c.length <= 9) return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6)}`;
    return `${c.slice(0,3)}.${c.slice(3,6)}.${c.slice(6,9)}-${c.slice(9)}`;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddErr(""); setAdding(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/debtors`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const data = await res.json();
      if (!res.ok) { setAddErr(data.error || "Erro ao adicionar."); return; }
      setForm({ name: "", cpf: "", amount: "", description: "Dívida em aberto", status: "PENDENTE" });
      loadDebtors(1);
    } catch { setAddErr("Erro de conexão."); }
    finally { setAdding(false); }
  }

  function startEdit(d: Debtor) {
    setEditId(d.id);
    setEditForm({ name: d.name, cpf: d.cpf, amount: String(d.amount), description: d.description, status: d.status });
    setEditErr("");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setEditErr(""); setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/debtors/${editId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, amount: Number(editForm.amount) }),
      });
      const data = await res.json();
      if (!res.ok) { setEditErr(data.error || "Erro ao salvar."); return; }
      setEditId(null);
      loadDebtors(page);
    } catch { setEditErr("Erro de conexão."); }
    finally { setEditSaving(false); }
  }

  async function handleDelete(id: number) {
    setDeleting(true);
    try {
      await fetch(`/api/admin/debtors/${id}`, { method: "DELETE" });
      setDeleteId(null);
      loadDebtors(page);
    } catch { /* noop */ }
    finally { setDeleting(false); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,.8)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "24px 16px", overflowY: "auto",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 860,
        background: "#0f0f12", border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 80px rgba(0,0,0,.7)",
        marginBottom: 24,
      }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc" }}>Devedores — {campaign.name}</h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{total} registros cadastrados</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.4)", display: "flex" }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add form */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 12 }}>
            Adicionar devedor
          </p>
          <form onSubmit={handleAdd}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1.5fr 1fr", gap: 8, marginBottom: 10 }}>
              <input placeholder="Nome completo *" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={INP} />
              <input placeholder="000.000.000-00 *" required value={form.cpf}
                onChange={e => setForm(f => ({ ...f, cpf: fmtCPF(e.target.value) }))} style={INP} />
              <input placeholder="Valor R$ *" type="number" required min="0.01" step="0.01" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={INP} />
              <input placeholder="Descrição" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={INP} />
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                style={{ ...INP, cursor: "pointer" }}>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {addErr && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>{addErr}</p>}
            <button type="submit" disabled={adding} style={{ padding: "8px 20px", borderRadius: 8, background: "#6366f1", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: adding ? "not-allowed" : "pointer", opacity: adding ? .6 : 1 }}>
              {adding ? "Adicionando..." : "+ Adicionar"}
            </button>
          </form>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto", maxHeight: "50vh", overflowY: "auto" }}>
          {loading ? (
            <p style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,.4)", fontSize: 13 }}>Carregando...</p>
          ) : debtors.length === 0 ? (
            <p style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,.3)", fontSize: 13 }}>Nenhum devedor cadastrado.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
              <thead style={{ position: "sticky", top: 0, background: "#0f0f12", zIndex: 1 }}>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
                  {["Nome", "CPF", "Valor", "Descrição", "Status", "Ações"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "rgba(248,250,252,.3)", textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {debtors.map(d => (
                  editId === d.id ? (
                    /* Edit row */
                    <tr key={d.id} style={{ background: "rgba(99,102,241,.06)", borderBottom: "1px solid rgba(99,102,241,.15)" }}>
                      <td colSpan={6} style={{ padding: "12px 14px" }}>
                        <form onSubmit={handleEdit}>
                          <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1.5fr 1fr", gap: 8, marginBottom: 10 }}>
                            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome" required style={INP} />
                            <input value={editForm.cpf} onChange={e => setEditForm(f => ({ ...f, cpf: fmtCPF(e.target.value) }))} placeholder="CPF" required style={INP} />
                            <input value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} type="number" min="0.01" step="0.01" required placeholder="Valor" style={INP} />
                            <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição" style={INP} />
                            <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} style={{ ...INP, cursor: "pointer" }}>
                              {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          {editErr && <p style={{ fontSize: 12, color: "#f87171", marginBottom: 8 }}>{editErr}</p>}
                          <div style={{ display: "flex", gap: 8 }}>
                            <button type="submit" disabled={editSaving} style={{ padding: "7px 16px", borderRadius: 7, background: "#22c55e", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                              {editSaving ? "Salvando..." : "✓ Salvar"}
                            </button>
                            <button type="button" onClick={() => setEditId(null)} style={{ padding: "7px 14px", borderRadius: 7, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
                              Cancelar
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  ) : (
                    /* Normal row */
                    <tr key={d.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)", transition: "background .15s" }}
                      onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,.02)")}
                      onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#f8fafc" }}>{d.name}</td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "rgba(255,255,255,.5)", fontFamily: "monospace" }}>{d.cpf}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#f8fafc", whiteSpace: "nowrap" }}>{fmtBRL(d.amount)}</td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "rgba(255,255,255,.45)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.description}</td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                          background: d.status === "PAGO" ? "rgba(34,197,94,.12)" : d.status === "NEGOCIANDO" ? "rgba(251,191,36,.1)" : d.status === "CANCELADO" ? "rgba(100,116,139,.1)" : "rgba(239,68,68,.1)",
                          color: d.status === "PAGO" ? "#4ade80" : d.status === "NEGOCIANDO" ? "#fbbf24" : d.status === "CANCELADO" ? "#94a3b8" : "#f87171",
                          border: `1px solid ${d.status === "PAGO" ? "rgba(34,197,94,.2)" : d.status === "NEGOCIANDO" ? "rgba(251,191,36,.2)" : d.status === "CANCELADO" ? "rgba(100,116,139,.2)" : "rgba(239,68,68,.2)"}`,
                        }}>
                          {d.status}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => startEdit(d)} style={{ padding: "5px 10px", borderRadius: 6, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.3)", color: "#818cf8", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                            Editar
                          </button>
                          <button onClick={() => setDeleteId(d.id)} style={{ padding: "5px 10px", borderRadius: 6, background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#f87171", fontSize: 11, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ padding: "12px 24px", borderTop: "1px solid rgba(255,255,255,.06)", display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
            <button onClick={() => loadDebtors(page - 1)} disabled={page <= 1}
              style={{ padding: "6px 14px", borderRadius: 7, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", cursor: page <= 1 ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "inherit" }}>
              ← Anterior
            </button>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>{page} / {pages}</span>
            <button onClick={() => loadDebtors(page + 1)} disabled={page >= pages}
              style={{ padding: "6px 14px", borderRadius: 7, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", cursor: page >= pages ? "not-allowed" : "pointer", fontSize: 12, fontFamily: "inherit" }}>
              Próximo →
            </button>
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#1a1a1f", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: "28px 32px", maxWidth: 380, width: "90%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f8fafc", marginBottom: 8 }}>Excluir devedor?</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.45)", marginBottom: 24, lineHeight: 1.6 }}>
              Esta ação não pode ser desfeita. Os logs relacionados também serão removidos.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: "9px 20px", borderRadius: 9, background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={deleting} style={{ padding: "9px 20px", borderRadius: 9, background: "#ef4444", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                {deleting ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalCampaign, setModalCampaign] = useState<Partial<Campaign> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [debtorsCampaign, setDebtorsCampaign] = useState<Campaign | null>(null);

  const [copied, setCopied] = useState<number | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/campaigns");
      const data = await res.json();
      setCampaigns(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setModalCampaign(null);
    setShowModal(true);
  }

  function openEdit(c: Campaign) {
    setModalCampaign(c);
    setShowModal(true);
  }

  async function toggleActive(c: Campaign) {
    await fetch(`/api/admin/campaigns/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    load();
  }

  async function deleteCampaign(c: Campaign) {
    if (!confirm(`Desativar campanha "${c.name}"? (soft delete)`)) return;
    await fetch(`/api/admin/campaigns/${c.id}`, { method: "DELETE" });
    load();
  }

  function copyUrl(c: Campaign) {
    const url = `${origin}/c/${c.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(c.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <>
      {showModal && (
        <CampaignModal
          initial={modalCampaign}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }}
        />
      )}

      {debtorsCampaign && (
        <DebtorsModal
          campaign={debtorsCampaign}
          onClose={() => setDebtorsCampaign(null)}
        />
      )}

      <div>
        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", letterSpacing: "-.02em" }}>
              Campanhas
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,.4)", marginTop: 4 }}>
              Gerencie landing pages e devedores por campanha
            </p>
          </div>
          <button
            onClick={openCreate}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 18px", borderRadius: 10,
              background: "#ef4444", border: "none",
              color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: "inherit", cursor: "pointer",
              transition: "opacity .15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = ".85"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nova campanha
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,.3)", fontSize: 14 }}>
            Carregando campanhas...
          </div>
        ) : campaigns.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 24px",
            background: "rgba(255,255,255,.02)", border: "1px dashed rgba(255,255,255,.1)",
            borderRadius: 16, color: "rgba(255,255,255,.3)",
          }}>
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth={1.2} viewBox="0 0 24 24" style={{ margin: "0 auto 16px", display: "block", opacity: .4 }}>
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Nenhuma campanha criada</p>
            <p style={{ fontSize: 13 }}>Clique em "Nova campanha" para começar</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {campaigns.map(c => (
              <div key={c.id} style={{
                background: "rgba(255,255,255,.028)",
                border: "1px solid rgba(255,255,255,.07)",
                borderRadius: 14, padding: "18px 20px",
                transition: "border-color .15s",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,.07)"; }}
              >
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>

                  {/* Left: info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>{c.name}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                        background: c.active ? "rgba(34,197,94,.1)" : "rgba(255,255,255,.06)",
                        color: c.active ? "#4ade80" : "rgba(255,255,255,.35)",
                        border: `1px solid ${c.active ? "rgba(34,197,94,.2)" : "rgba(255,255,255,.1)"}`,
                        textTransform: "uppercase", letterSpacing: ".06em",
                      }}>
                        {c.active ? "Ativa" : "Pausada"}
                      </span>
                    </div>

                    {/* URL */}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "5px 10px", borderRadius: 7,
                      background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)",
                      marginBottom: 10,
                    }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,.5)", fontFamily: "monospace" }}>
                        {origin}/c/{c.slug}
                      </span>
                      <button
                        onClick={() => copyUrl(c)}
                        title="Copiar URL"
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: copied === c.id ? "#4ade80" : "rgba(255,255,255,.4)",
                          display: "flex", padding: 0, transition: "color .15s",
                        }}
                      >
                        {copied === c.id ? (
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 16 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                        <strong style={{ color: "#f8fafc" }}>{c._count.debtors}</strong> devedores
                      </span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                        <strong style={{ color: "#f8fafc" }}>{c.stats.consults}</strong> consultas
                      </span>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,.4)" }}>
                        <strong style={{ color: "#4ade80" }}>{c.stats.payments}</strong> pagamentos
                      </span>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <a href={`/admin/campaigns/${c.id}`} style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "6px 12px", borderRadius: 8,
                      background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)",
                      color: "#f87171", fontSize: 12, fontWeight: 700,
                      textDecoration: "none", transition: "opacity .15s",
                    }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Configurar
                    </a>
                    <ActionBtn onClick={() => setDebtorsCampaign(c)} title="Devedores" variant="neutral">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4.13a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Devedores
                    </ActionBtn>
                    <ActionBtn onClick={() => openEdit(c)} title="Editar">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar
                    </ActionBtn>
                    <a
                      href={`/c/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "6px 12px", borderRadius: 8,
                        background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)",
                        color: "rgba(255,255,255,.5)", fontSize: 12, fontWeight: 600,
                        textDecoration: "none", transition: "color .15s, border-color .15s",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#f8fafc"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,.5)"; }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Ver
                    </a>
                    <ActionBtn
                      onClick={() => toggleActive(c)}
                      title={c.active ? "Pausar" : "Ativar"}
                      variant={c.active ? "warning" : "success"}
                    >
                      {c.active ? (
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                      ) : (
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                      {c.active ? "Pausar" : "Ativar"}
                    </ActionBtn>
                    <ActionBtn onClick={() => deleteCampaign(c)} title="Deletar" variant="danger">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
                      </svg>
                      Deletar
                    </ActionBtn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ActionBtn({
  children,
  onClick,
  title,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  variant?: "default" | "neutral" | "warning" | "success" | "danger";
}) {
  const styles: Record<string, React.CSSProperties> = {
    default:  { background: "rgba(99,102,241,.1)",  border: "1px solid rgba(99,102,241,.2)",  color: "#a5b4fc" },
    neutral:  { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.55)" },
    warning:  { background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)",  color: "#fbbf24" },
    success:  { background: "rgba(34,197,94,.08)",  border: "1px solid rgba(34,197,94,.2)",   color: "#4ade80" },
    danger:   { background: "rgba(239,68,68,.08)",  border: "1px solid rgba(239,68,68,.18)",  color: "#f87171" },
  };
  const s = styles[variant];
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
        fontFamily: "inherit", cursor: "pointer", transition: "opacity .15s",
        ...s,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = ".75"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
    >
      {children}
    </button>
  );
}
