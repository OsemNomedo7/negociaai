import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sid = searchParams.get("sid");
  const after = parseInt(searchParams.get("after") || "0");

  if (!sid) return NextResponse.json({ error: "sid obrigatório" }, { status: 400 });

  const session = await prisma.chatSession.findUnique({ where: { visitorId: sid } });
  if (!session) return NextResponse.json({ messages: [] });

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId: session.id, id: { gt: after } },
    orderBy: { id: "asc" },
    select: { id: true, content: true, sender: true, createdAt: true },
  });

  return NextResponse.json({ messages, sessionId: session.id });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.sid || !body?.content?.trim()) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { sid, content } = body as { sid: string; content: string };

  const session = await prisma.chatSession.findUnique({ where: { visitorId: sid } });
  if (!session) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
  if (session.status === "CLOSED") return NextResponse.json({ error: "Chat encerrado" }, { status: 400 });

  const msg = await prisma.chatMessage.create({
    data: { sessionId: session.id, content: content.trim().slice(0, 1000), sender: "visitor" },
  });

  await prisma.chatSession.update({ where: { id: session.id }, data: { updatedAt: new Date() } });

  return NextResponse.json({ id: msg.id, content: msg.content, sender: msg.sender, createdAt: msg.createdAt });
}
