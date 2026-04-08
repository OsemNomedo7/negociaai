import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const raw = await prisma.$queryRaw<{
    id: number;
    visitorId: string;
    name: string | null;
    cpf: string | null;
    ip: string | null;
    city: string | null;
    state: string | null;
    consulted: bigint;
    status: string;
    createdAt: string;
    updatedAt: string;
    lastMsg: string | null;
    lastMsgAt: string | null;
    unread: bigint;
  }[]>`
    SELECT
      s.id, s.visitorId, s.name, s.cpf, s.ip, s.city, s.state,
      s.consulted, s.status, s.createdAt, s.updatedAt,
      (SELECT content FROM ChatMessage WHERE sessionId = s.id ORDER BY id DESC LIMIT 1) AS lastMsg,
      (SELECT createdAt FROM ChatMessage WHERE sessionId = s.id ORDER BY id DESC LIMIT 1) AS lastMsgAt,
      (SELECT COUNT(*) FROM ChatMessage WHERE sessionId = s.id AND sender = 'visitor' AND read = 0) AS unread
    FROM ChatSession s
    ORDER BY s.updatedAt DESC
  `;

  // BigInt não serializa em JSON — converter para number
  const sessions = raw.map(s => ({ ...s, consulted: Number(s.consulted), unread: Number(s.unread) }));

  return NextResponse.json({ sessions });
}
