import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGeo } from "@/lib/geo";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.visitorId) return NextResponse.json({ error: "visitorId obrigatório" }, { status: 400 });

  const { visitorId } = body as { visitorId: string };

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Check if session already exists
  const existing = await prisma.$queryRaw<{ id: number; name: string | null; cpf: string | null; consulted: number; status: string }[]>`
    SELECT id, name, cpf, consulted, status FROM ChatSession WHERE visitorId = ${visitorId} LIMIT 1
  `;

  if (existing.length > 0) {
    return NextResponse.json(existing[0]);
  }

  // New session — get geo async (don't block response if slow)
  const geo = await getGeo(ip);

  await prisma.$executeRaw`
    INSERT INTO ChatSession (visitorId, ip, city, state, status, consulted, createdAt, updatedAt)
    VALUES (${visitorId}, ${geo.resolvedIp}, ${geo.city}, ${geo.state}, 'OPEN', 0, datetime('now'), datetime('now'))
  `;

  const created = await prisma.$queryRaw<{ id: number; name: string | null; consulted: number; status: string }[]>`
    SELECT id, name, cpf, consulted, status FROM ChatSession WHERE visitorId = ${visitorId} LIMIT 1
  `;

  return NextResponse.json(created[0]);
}
