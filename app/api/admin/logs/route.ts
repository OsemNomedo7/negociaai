import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const event = searchParams.get("event") || undefined;

  // Filtra apenas logs das campanhas do usuário logado
  const where = {
    campaign: { userId: admin.userId as number },
    ...(event ? { event } : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, cpf: true, event: true,
        ip: true, city: true, state: true, createdAt: true,
        debtor: { select: { name: true } },
      },
    }),
    prisma.log.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);

  // Apenas deleta logs das campanhas do próprio usuário
  const userCampaigns = await prisma.campaign.findMany({
    where: { userId: admin.userId as number },
    select: { id: true },
  });
  const campaignIds = userCampaigns.map(c => c.id);

  if (body?.ids && Array.isArray(body.ids) && body.ids.length > 0) {
    const ids = (body.ids as number[]).map(Number).filter(n => !isNaN(n));
    const deleted = await prisma.log.deleteMany({
      where: { id: { in: ids }, campaignId: { in: campaignIds } },
    });
    return NextResponse.json({ deleted: deleted.count });
  }

  if (body?.all === true) {
    const deleted = await prisma.log.deleteMany({
      where: { campaignId: { in: campaignIds } },
    });
    return NextResponse.json({ deleted: deleted.count });
  }

  return NextResponse.json({ error: "Informe ids[] ou all:true" }, { status: 400 });
}
