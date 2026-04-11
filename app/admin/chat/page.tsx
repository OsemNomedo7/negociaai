"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Campaign { id: number; name: string; slug: string; }

interface ChatSession {
  id: number;
  visitorId: string;
  name: string | null;
  cpf: string | null;
  ip: string | null;
  city: string | null;
  state: string | null;
  consulted: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMsg: string | null;
  lastMsgAt: string | null;
  unread: number;
  campaign: Campaign | null;
}

interface ChatMessage {
  id: number;
  content: string;
  sender: string;
  read: number;
  createdAt: string;
}

const dt = (d: string) =>
  new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function ChatAdminPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | "all">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSessions = useCallback(async () => {
    const res = await fetch("/api/admin/chat");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setSessions(data.sessions || []);
    setLoading(false);
  }, [router]);

  const loadMessages = useCallback(async (id: number) => {
    const res = await fetch(`/api/admin/chat/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages || []);
    setActiveSession(data.session);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, unread: 0 } : s));
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    const id = setInterval(loadSessions, 5000);
    return () => clearInterval(id);
  }, [loadSessions]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (!activeId) return;
    pollRef.current = setInterval(() => loadMessages(activeId), 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openSession(id: number) {
    setActiveId(id);
    setMessages([]);
    await loadMessages(id);
  }

  async function sendReply() {
    if (!reply.trim() || !activeId || sending) return;
    setSending(true);
    const res = await fetch(`/api/admin/chat/${activeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reply.trim() }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setReply("");
      loadSessions();
    }
    setSending(false);
  }

  async function closeSession() {
    if (!activeId) return;
    await fetch(`/api/admin/chat/${activeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    setSessions(prev => prev.map(s => s.id === activeId ? { ...s, status: "CLOSED" } : s));
    if (activeSession) setActiveSession({ ...activeSession, status: "CLOSED" });
  }

  // Campanhas únicas para o filtro
  const campaigns = Array.from(
    new Map(sessions.filter(s => s.campaign).map(s => [s.campaign!.id, s.campaign!])).values()
  );

  const filtered = selectedCampaignId === "all"
    ? sessions
    : sessions.filter(s => s.campaign?.id === selectedCampaignId);

  const totalUnread = filtered.reduce((acc, s) => acc + (s.unread || 0), 0);

  return (
    <div className="flex h-[calc(100vh-80px)] gap-0 animate-fade-in overflow-hidden rounded-2xl border"
      style={{ borderColor: "var(--border)" }}>

      {/* ── Session list ── */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-black text-base" style={{ color: "var(--text)" }}>Chats</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{filtered.length} conversa{filtered.length !== 1 ? "s" : ""}</p>
            </div>
            {totalUnread > 0 && (
              <span className="text-xs font-black px-2 py-1 rounded-full text-white"
                style={{ background: "#ef4444" }}>{totalUnread}</span>
            )}
          </div>

          {/* Filtro por campanha */}
          {campaigns.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 2 }}>Filtrar por campanha</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                <button
                  onClick={() => setSelectedCampaignId("all")}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8,
                    border: selectedCampaignId === "all" ? "1px solid rgba(99,102,241,.5)" : "1px solid var(--border)",
                    background: selectedCampaignId === "all" ? "rgba(99,102,241,.1)" : "transparent",
                    color: selectedCampaignId === "all" ? "#818cf8" : "var(--text-muted)",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                  Todas ({sessions.length})
                </button>
                {campaigns.map(c => {
                  const count = sessions.filter(s => s.campaign?.id === c.id).length;
                  const unread = sessions.filter(s => s.campaign?.id === c.id).reduce((a, s) => a + s.unread, 0);
                  return (
                    <button key={c.id}
                      onClick={() => setSelectedCampaignId(c.id)}
                      style={{
                        fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 8,
                        border: selectedCampaignId === c.id ? "1px solid rgba(99,102,241,.5)" : "1px solid var(--border)",
                        background: selectedCampaignId === c.id ? "rgba(99,102,241,.1)" : "transparent",
                        color: selectedCampaignId === c.id ? "#818cf8" : "var(--text-muted)",
                        cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
                      }}>
                      {c.name} ({count})
                      {unread > 0 && <span style={{ background: "#ef4444", color: "#fff", borderRadius: "50%", width: 14, height: 14, fontSize: 9, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{unread}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-7 h-7 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">💬</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma conversa</p>
            </div>
          ) : filtered.map(s => (
            <button key={s.id} onClick={() => openSession(s.id)}
              className="w-full text-left px-4 py-3.5 border-b transition-all hover:bg-indigo-50 dark:hover:bg-white/5"
              style={{
                borderColor: "var(--border)",
                background: activeId === s.id ? "rgba(99,102,241,0.08)" : undefined,
                borderLeft: activeId === s.id ? "3px solid #6366f1" : "3px solid transparent",
              }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-black"
                    style={{ background: s.consulted ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(100,116,139,0.3)" }}>
                    {s.consulted && s.name ? s.name.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                      {s.name || `Visitante #${s.id}`}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {s.ip || "IP desconhecido"}{(s.city || s.state) ? ` · ${[s.city, s.state].filter(Boolean).join(", ")}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {s.lastMsgAt && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{dt(s.lastMsgAt)}</span>}
                  {s.unread > 0 && (
                    <span className="text-xs font-black w-5 h-5 rounded-full flex items-center justify-center text-white"
                      style={{ background: "#6366f1" }}>{s.unread}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Badge da campanha */}
                {s.campaign && selectedCampaignId === "all" && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,.2)" }}>
                    {s.campaign.name}
                  </span>
                )}
                {!s.consulted && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(245,158,11,0.12)", color: "#d97706" }}>Sem consulta</span>
                )}
                {s.status === "CLOSED" && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: "rgba(100,116,139,0.1)", color: "#64748b" }}>Encerrado</span>
                )}
                {s.lastMsg && (
                  <p className="text-xs truncate flex-1" style={{ color: "var(--text-muted)" }}>{s.lastMsg}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Conversation ── */}
      {!activeId ? (
        <div className="flex-1 flex items-center justify-center" style={{ background: "var(--bg)" }}>
          <div className="text-center">
            <p className="text-5xl mb-4">💬</p>
            <p className="font-bold text-base" style={{ color: "var(--text)" }}>Selecione uma conversa</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Escolha um chat na lista ao lado</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col" style={{ background: "var(--bg)" }}>
          {activeSession && (
            <div className="px-5 py-3.5 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
                    {activeSession.name || `Visitante #${activeSession.id}`}
                  </p>
                  {/* Campanha no header do chat */}
                  {activeSession.campaign && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,.2)" }}>
                      📢 {activeSession.campaign.name}
                    </span>
                  )}
                  {activeSession.consulted ? (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>Consultou</span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(245,158,11,0.12)", color: "#d97706" }}>Ainda não consultou</span>
                  )}
                  {activeSession.status === "CLOSED" && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ background: "rgba(100,116,139,0.1)", color: "#64748b" }}>Encerrado</span>
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {[activeSession.ip, activeSession.city, activeSession.state].filter(Boolean).join(" · ")}
                  {activeSession.cpf && ` · CPF: ${activeSession.cpf}`}
                </p>
              </div>
              {activeSession.status === "OPEN" && (
                <button onClick={closeSession}
                  className="text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all hover:border-red-300 hover:text-red-500"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  Encerrar chat
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nenhuma mensagem ainda</p>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[70%] px-4 py-2.5 rounded-2xl text-sm"
                  style={m.sender === "admin"
                    ? { background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", borderBottomRightRadius: 4 }
                    : { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderBottomLeftRadius: 4 }}>
                  <p>{m.content}</p>
                  <p className="text-xs mt-1 opacity-60 text-right">
                    {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
            {activeSession?.status === "CLOSED" ? (
              <p className="text-center text-sm py-2" style={{ color: "var(--text-muted)" }}>Chat encerrado</p>
            ) : (
              <div className="flex gap-2">
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Digite sua resposta..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm border outline-none transition-colors"
                  style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
                />
                <button onClick={sendReply} disabled={sending || !reply.trim()}
                  className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                  {sending ? "..." : "Enviar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
