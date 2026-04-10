import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const sessions = await prisma.chatSession.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { id: "desc" },
        take: 1,
        select: { content: true, createdAt: true },
      },
      _count: {
        select: { messages: { where: { sender: "visitor", read: false } } },
      },
    },
  });

  const result = sessions.map(s => ({
    id: s.id,
    visitorId: s.visitorId,
    name: s.name,
    cpf: s.cpf,
    ip: s.ip,
    city: s.city,
    state: s.state,
    consulted: s.consulted,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    lastMsg: s.messages[0]?.content ?? null,
    lastMsgAt: s.messages[0]?.createdAt ?? null,
    unread: s._count.messages,
  }));

  return NextResponse.json({ sessions: result });
}
