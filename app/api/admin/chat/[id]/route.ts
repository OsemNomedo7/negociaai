import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { getGeo } from "@/lib/geo";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const sessionId = parseInt(params.id);

  const rawSession = await prisma.$queryRaw<{
    id: number; visitorId: string; name: string | null; cpf: string | null;
    ip: string | null; city: string | null; state: string | null;
    consulted: bigint; status: string; createdAt: string;
  }[]>`SELECT id, visitorId, name, cpf, ip, city, state, consulted, status, createdAt
       FROM ChatSession WHERE id = ${sessionId} LIMIT 1`;

  if (!rawSession.length) return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 });
  let row = { ...rawSession[0], consulted: Number(rawSession[0].consulted) };

  // Preenche geo em sessões antigas que não tinham esses dados
  if (!row.city && row.ip) {
    const geo = await getGeo(row.ip);
    await prisma.$executeRaw`UPDATE ChatSession SET city=${geo.city}, state=${geo.state}, ip=${geo.resolvedIp}, updatedAt=datetime('now') WHERE id=${sessionId}`;
    row = { ...row, ip: geo.resolvedIp, city: geo.city, state: geo.state };
  }

  const session = [row];

  const rawMsgs = await prisma.$queryRaw<{
    id: number; content: string; sender: string; read: bigint; createdAt: string;
  }[]>`SELECT id, content, sender, read, createdAt FROM ChatMessage WHERE sessionId = ${sessionId} ORDER BY id ASC`;

  const messages = rawMsgs.map(m => ({ ...m, read: Number(m.read) }));

  // Mark visitor messages as read
  await prisma.$executeRaw`UPDATE ChatMessage SET read = 1 WHERE sessionId = ${sessionId} AND sender = 'visitor'`;

  return NextResponse.json({ session: session[0], messages });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.content?.trim()) return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });

  const sessionId = parseInt(params.id);
  const content = (body.content as string).trim().slice(0, 1000);

  await prisma.$executeRaw`
    INSERT INTO ChatMessage (sessionId, content, sender, read, createdAt)
    VALUES (${sessionId}, ${content}, 'admin', 1, datetime('now'))
  `;
  await prisma.$executeRaw`UPDATE ChatSession SET updatedAt = datetime('now') WHERE id = ${sessionId}`;

  const msg = await prisma.$queryRaw<{ id: number; content: string; sender: string; createdAt: string }[]>`
    SELECT id, content, sender, createdAt FROM ChatMessage WHERE sessionId = ${sessionId} ORDER BY id DESC LIMIT 1
  `;

  return NextResponse.json(msg[0]);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const sessionId = parseInt(params.id);

  if (body?.status) {
    await prisma.$executeRaw`UPDATE ChatSession SET status = ${body.status}, updatedAt = datetime('now') WHERE id = ${sessionId}`;
  }

  return NextResponse.json({ ok: true });
}
