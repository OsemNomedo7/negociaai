"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeProvider } from "@/lib/theme";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard",       icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )},
  { href: "/admin/debtors",   label: "Devedores",       icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4.13a4 4 0 11-8 0 4 4 0 018 0zM3 8a4 4 0 118 0" />
    </svg>
  )},
  { href: "/admin/logs",      label: "Logs",            icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )},
  { href: "/admin/chat",      label: "Suporte / Chat",  icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )},
  { href: "/admin/campaigns", label: "Campanhas",        icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )},
  { href: "/admin/settings",  label: "Configurações",   icon: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
];

function AdminInner({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open,    setOpen]    = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => { document.title = "Caos Dívidas — Painel Admin"; }, []);

  if (pathname === "/admin/login") return <>{children}</>;

  async function logout() {
    setLeaving(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const currentLabel = NAV.find(n => n.href === pathname)?.label ?? "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }
        .adm-root {
          display: flex; min-height: 100vh;
          background: #09090B;
          font-family: 'Inter', system-ui, sans-serif;
          color: #f8fafc;
        }

        /* ── SIDEBAR ── */
        .adm-sidebar {
          width: 224px; flex-shrink: 0;
          background: #0C0C0F;
          border-right: 1px solid rgba(255,255,255,.07);
          display: flex; flex-direction: column;
          position: fixed; top: 0; left: 0; bottom: 0;
          z-index: 40;
          transition: transform .3s cubic-bezier(.16,1,.3,1);
        }
        @media (max-width: 1023px) {
          .adm-sidebar { transform: translateX(-100%); }
          .adm-sidebar.open { transform: translateX(0); box-shadow: 24px 0 80px rgba(0,0,0,.6); }
          .adm-content { margin-left: 0 !important; }
        }
        @media (min-width: 1024px) {
          .adm-content { margin-left: 224px; }
        }

        /* Logo area */
        .adm-logo {
          padding: 22px 18px 18px;
          border-bottom: 1px solid rgba(255,255,255,.06);
        }

        /* Nav items */
        .adm-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 8px;
          font-size: 13.5px; font-weight: 500;
          color: rgba(248,250,252,.4);
          text-decoration: none;
          transition: color .15s, background .15s;
          position: relative;
        }
        .adm-link:hover { color: rgba(248,250,252,.8); background: rgba(255,255,255,.05); }
        .adm-link.active {
          color: #f8fafc;
          background: rgba(239,68,68,.12);
          font-weight: 600;
        }
        .adm-link.active::before {
          content: '';
          position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 2.5px; border-radius: 0 2px 2px 0;
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239,68,68,.6);
        }

        /* ── TOPBAR ── */
        .adm-topbar {
          height: 54px;
          background: rgba(12,12,15,.9);
          border-bottom: 1px solid rgba(255,255,255,.06);
          backdrop-filter: blur(20px);
          position: sticky; top: 0; z-index: 20;
          display: flex; align-items: center; gap: 12px;
          padding: 0 22px;
        }

        /* ── MAIN ── */
        .adm-main {
          flex: 1; min-width: 0;
          background:
            radial-gradient(ellipse 60% 40% at 80% 10%, rgba(239,68,68,.04) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 10% 90%, rgba(185,28,28,.03) 0%, transparent 60%),
            #09090B;
        }

        /* Mobile overlay */
        .adm-overlay {
          position: fixed; inset: 0; z-index: 30;
          background: rgba(0,0,0,.65);
          backdrop-filter: blur(4px);
        }

        /* Scrollbar */
        .adm-sidebar::-webkit-scrollbar { width: 3px; }
        .adm-sidebar::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 99px; }

        /* Separator line */
        .adm-sep {
          height: 1px; margin: 6px 0;
          background: rgba(255,255,255,.06);
        }

        @keyframes live-blink {
          0%,100% { opacity: 1; }
          50%      { opacity: .4; }
        }
        .live-indicator {
          width: 6px; height: 6px; border-radius: 50%; background: #22c55e;
          animation: live-blink 2s ease-in-out infinite;
        }
      `}</style>

      <div className="adm-root">

        {/* Mobile overlay */}
        {open && <div className="adm-overlay lg:hidden" onClick={() => setOpen(false)} />}

        {/* ── SIDEBAR ── */}
        <aside className={`adm-sidebar ${open ? "open" : ""}`}>

          {/* Logo */}
          <div className="adm-logo">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src="/logo.png"
                alt="Logo"
                style={{
                  height: 64, width: "auto", objectFit: "contain",
                  mixBlendMode: "screen",
                  filter: "drop-shadow(0 0 10px rgba(239,68,68,.3)) saturate(1.2)",
                }}
              />
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(248,250,252,.2)", letterSpacing: ".1em",
              textTransform: "uppercase", padding: "4px 12px 8px" }}>
              Menu
            </div>
            {NAV.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={`adm-link ${active ? "active" : ""}`}>
                  <span style={{ opacity: active ? 1 : 0.6, color: active ? "#ef4444" : "inherit" }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,.06)" }}>
            <Link href="/" target="_blank" className="adm-link" style={{ fontSize: 13 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver página pública
            </Link>
            <button onClick={logout} disabled={leaving}
              className="adm-link"
              style={{
                width: "100%", background: "none", border: "none", cursor: "pointer",
                color: "rgba(248,82,82,.5)", fontFamily: "inherit", fontSize: 13,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,.07)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(248,82,82,.5)"; (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
              {leaving ? "Saindo..." : "Sair"}
            </button>
          </div>
        </aside>

        {/* ── MAIN AREA ── */}
        <div className="adm-content adm-main" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* Topbar */}
          <header className="adm-topbar">
            {/* Hamburger */}
            <button
              className="lg:hidden"
              onClick={() => setOpen(true)}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 8, padding: "6px 8px", cursor: "pointer", color: "#f8fafc",
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Breadcrumb */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(248,250,252,.3)" }}>Admin</span>
              <span style={{ color: "rgba(248,250,252,.2)" }}>›</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>
                {currentLabel}
              </span>
            </div>

            {/* Live badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "6px 12px", borderRadius: 8,
              background: "rgba(34,197,94,.06)", border: "1px solid rgba(34,197,94,.14)",
              fontSize: 11, fontWeight: 600, color: "#4ade80", letterSpacing: ".03em",
            }}>
              <div className="live-indicator" />
              Online
            </div>
          </header>

          {/* Content */}
          <main style={{ flex: 1, padding: "28px 28px", overflowY: "auto" }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminInner>{children}</AdminInner>
    </ThemeProvider>
  );
}
