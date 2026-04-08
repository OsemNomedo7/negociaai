"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPass.length < 6) {
      setMsg({ ok: false, text: "Nova senha deve ter pelo menos 6 caracteres." });
      return;
    }
    if (newPass !== confirm) {
      setMsg({ ok: false, text: "Senhas não coincidem." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "Erro ao alterar senha." });
      } else {
        setMsg({ ok: true, text: "Senha alterada com sucesso!" });
        setCurrent(""); setNewPass(""); setConfirm("");
      }
    } catch {
      setMsg({ ok: false, text: "Erro de conexão." });
    } finally {
      setSaving(false);
    }
  }

  const inp: React.CSSProperties = {
    padding: "10px 14px", borderRadius: 8,
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.1)",
    color: "#f8fafc", fontSize: 14, fontFamily: "inherit",
    outline: "none", width: "100%",
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 480 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc", marginBottom: 6 }}>Configurações</h1>
      <p style={{ fontSize: 14, color: "rgba(248,250,252,.4)", marginBottom: 32 }}>
        Altere a senha de acesso ao painel.
      </p>

      <form onSubmit={handleSubmit} style={{
        background: "#0f0f12",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 14, padding: 24,
        display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(248,250,252,.4)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Senha atual
          </label>
          <input type="password" style={inp} value={current} onChange={e => setCurrent(e.target.value)} required />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(248,250,252,.4)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Nova senha
          </label>
          <input type="password" style={inp} value={newPass} onChange={e => setNewPass(e.target.value)} required />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(248,250,252,.4)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Confirmar nova senha
          </label>
          <input type="password" style={inp} value={confirm} onChange={e => setConfirm(e.target.value)} required />
        </div>

        {msg && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, fontSize: 13,
            background: msg.ok ? "rgba(34,197,94,.08)" : "rgba(239,68,68,.08)",
            border: `1px solid ${msg.ok ? "rgba(34,197,94,.2)" : "rgba(239,68,68,.2)"}`,
            color: msg.ok ? "#4ade80" : "#f87171",
          }}>
            {msg.text}
          </div>
        )}

        <button type="submit" disabled={saving} style={{
          padding: "11px 20px", borderRadius: 8,
          background: saving ? "rgba(239,68,68,.3)" : "#ef4444",
          border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
          fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer",
          transition: "background .15s",
        }}>
          {saving ? "Salvando..." : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
