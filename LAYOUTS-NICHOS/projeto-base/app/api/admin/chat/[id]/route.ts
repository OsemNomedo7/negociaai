import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { getGeo } from "@/lib/geo";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const sessionId = parseInt(params.id);

  const session = await prisma.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });

  // Preenche geo em sessões antigas
  if (!session.city && session.ip) {
    const geo = await getGeo(session.ip);
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { city: geo.city, state: geo.state, ip: geo.resolvedIp },
    });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { id: "asc" },
    select: { id: true, content: true, sender: true, read: true, createdAt: true },
  });

  // Marca mensagens do visitor como lidas
  await prisma.chatMessage.updateMany({
    where: { sessionId, sender: "visitor", read: false },
    data: { read: true },
  });

  return NextResponse.json({ session, messages });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.content?.trim()) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });

  const sessionId = parseInt(params.id);
  const content = (body.content as string).trim().slice(0, 1000);

  const msg = await prisma.chatMessage.create({
    data: { sessionId, content, sender: "admin", read: true },
  });

  await prisma.chatSession.update({ where: { id: sessionId }, data: { updatedAt: new Date() } });

  return NextResponse.json({ id: msg.id, content: msg.content, sender: msg.sender, createdAt: msg.createdAt });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const sessionId = parseInt(params.id);

  if (body?.status) {
    await prisma.chatSession.update({ where: { id: sessionId }, data: { status: body.status } });
  }

  return NextResponse.json({ ok: true });
}
