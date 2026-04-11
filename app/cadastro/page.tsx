"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("As senhas não coincidem."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao cadastrar."); return; }
      // Após cadastro, leva para login
      router.push("/admin/login?registered=1");
    } catch { setError("Erro de conexão."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Caos Dívidas" style={{ height: 80, objectFit: "contain" }} />
        </div>

        <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,.08)", borderRadius: 20, padding: "36px 32px" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc", marginBottom: 6, textAlign: "center" }}>Criar conta</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,.4)", textAlign: "center", marginBottom: 28 }}>Preencha os dados para começar</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Nome completo", key: "name", type: "text", placeholder: "Seu nome" },
              { label: "E-mail", key: "email", type: "email", placeholder: "seu@email.com" },
              { label: "Senha", key: "password", type: "password", placeholder: "Mínimo 6 caracteres" },
              { label: "Confirmar senha", key: "confirm", type: "password", placeholder: "Repita a senha" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.5)", marginBottom: 8, letterSpacing: ".06em", textTransform: "uppercase" }}>{f.label}</label>
                <input
                  type={f.type} placeholder={f.placeholder} value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required
                  style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, color: "#f8fafc", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                />
              </div>
            ))}

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", color: "#f87171", fontSize: 13 }}>{error}</div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", marginTop: 4 }}>
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,.35)", marginTop: 20 }}>
            Já tem conta?{" "}
            <Link href="/admin/login" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 600 }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
