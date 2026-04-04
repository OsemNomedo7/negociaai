"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider, useTheme } from "@/lib/theme";

const NAV = [
  { href: "/admin/dashboard", icon: "▦", label: "Dashboard" },
  { href: "/admin/debtors",   icon: "◎", label: "Devedores" },
  { href: "/admin/logs",      icon: "≡", label: "Logs" },
  { href: "/admin/settings",  icon: "⚙", label: "Configurações" },
];

function AdminInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="admin-root flex min-h-screen">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ─────────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full w-60 z-30 flex flex-col
        admin-sidebar border-r transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
              <span className="text-white font-black text-sm">N</span>
            </div>
            <div>
              <p className="font-black text-sm" style={{ color: "var(--text)" }}>NegociAI</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Painel Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(item => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`nav-item ${active ? "active" : ""}`}>
                <span className="w-5 h-5 flex items-center justify-center text-base opacity-80">{item.icon}</span>
                <span>{item.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer links */}
        <div className="px-3 pb-4 space-y-1 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <Link href="/" target="_blank" className="nav-item text-xs">
            <span>🌐</span> Ver página pública
          </Link>
          <button onClick={handleLogout} disabled={loggingOut}
            className="nav-item w-full text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40">
            <span>🚪</span>
            <span>{loggingOut ? "Saindo..." : "Sair"}</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="admin-surface border-b sticky top-0 z-10"
          style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <button className="lg:hidden p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-white/5 transition-colors"
              onClick={() => setSidebarOpen(true)}>
              <svg className="w-5 h-5" style={{ color: "var(--text)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Admin</span>
              <span style={{ color: "var(--text-muted)" }}>/</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                {NAV.find(n => n.href === pathname)?.label || ""}
              </span>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold"
              style={{ borderColor: "rgba(16,185,129,0.3)", color: "#10b981", background: "rgba(16,185,129,0.08)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>

            {/* Theme toggle */}
            <button onClick={toggle}
              className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all hover:border-indigo-300"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}>
              <span className="text-lg transition-transform duration-300"
                style={{ transform: theme === "dark" ? "rotate(0deg)" : "rotate(180deg)" }}>
                {theme === "dark" ? "☀️" : "🌙"}
              </span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminInner>{children}</AdminInner>
    </ThemeProvider>
  );
}
