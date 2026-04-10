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

  const existing = await prisma.chatSession.findUnique({ where: { visitorId } });
  if (existing) return NextResponse.json({ id: existing.id, name: existing.name, cpf: existing.cpf, status: existing.status, consulted: existing.consulted });

  const geo = await getGeo(ip);

  const created = await prisma.chatSession.create({
    data: { visitorId, ip: geo.resolvedIp, city: geo.city, state: geo.state },
  });

  return NextResponse.json({ id: created.id, name: created.name, cpf: created.cpf, status: created.status, consulted: created.consulted });
}
