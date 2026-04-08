import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sid = searchParams.get("sid");
  const after = parseInt(searchParams.get("after") || "0");

  if (!sid) return NextResponse.json({ error: "sid obrigatório" }, { status: 400 });

  const session = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM ChatSession WHERE visitorId = ${sid} LIMIT 1
  `;
  if (!session.length) return NextResponse.json({ messages: [] });

  const sessionId = session[0].id;

  const messages = await prisma.$queryRaw<{
    id: number; content: string; sender: string; createdAt: string;
  }[]>`
    SELECT id, content, sender, createdAt FROM ChatMessage
    WHERE sessionId = ${sessionId} AND id > ${after}
    ORDER BY id ASC
  `;

  return NextResponse.json({ messages, sessionId });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.sid || !body?.content?.trim()) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { sid, content } = body as { sid: string; content: string };

  const session = await prisma.$queryRaw<{ id: number; status: string }[]>`
    SELECT id, status FROM ChatSession WHERE visitorId = ${sid} LIMIT 1
  `;
  if (!session.length) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
  if (session[0].status === "CLOSED") return NextResponse.json({ error: "Chat encerrado" }, { status: 400 });

  const sessionId = session[0].id;
  const trimmed = content.trim().slice(0, 1000);

  await prisma.$executeRaw`
    INSERT INTO ChatMessage (sessionId, content, sender, read, createdAt)
    VALUES (${sessionId}, ${trimmed}, 'visitor', 0, datetime('now'))
  `;
  await prisma.$executeRaw`
    UPDATE ChatSession SET updatedAt = datetime('now') WHERE id = ${sessionId}
  `;

  const msg = await prisma.$queryRaw<{ id: number; content: string; sender: string; createdAt: string }[]>`
    SELECT id, content, sender, createdAt FROM ChatMessage WHERE sessionId = ${sessionId} ORDER BY id DESC LIMIT 1
  `;

  return NextResponse.json(msg[0]);
}
