import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const userId = tenant.userId as number;

  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { debtors: true, logs: true } } },
  });

  const result = await Promise.all(
    campaigns.map(async (c) => {
      const payments = await prisma.log.count({ where: { campaignId: c.id, event: "PAGAMENTO_CONCLUIDO" } });
      const consults = await prisma.log.count({ where: { campaignId: c.id, event: "CONSULTA" } });
      const { webhookSecret: _secret, ...rest } = c;
      let bannerImages: string[] = [];
      try { bannerImages = JSON.parse(rest.bannerImages || "[]"); } catch { /* noop */ }
      return { ...rest, bannerImages, stats: { consults, payments } };
    })
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const userId = tenant.userId as number;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, slug, bannerImages, ...rest } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.trim().length < 2)
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  if (!slug || typeof slug !== "string")
    return NextResponse.json({ error: "Slug é obrigatório." }, { status: 400 });

  const cleanSlug = slug.toLowerCase().trim();
  if (!/^[a-z0-9-]{3,}$/.test(cleanSlug))
    return NextResponse.json({ error: "Slug inválido." }, { status: 400 });

  const existing = await prisma.campaign.findUnique({ where: { slug: cleanSlug } });
  if (existing) return NextResponse.json({ error: "Slug já está em uso." }, { status: 409 });

  // Verifica limite de campanhas do plano
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { plan: true } });
  if (user?.plan) {
    const count = await prisma.campaign.count({ where: { userId } });
    if (count >= user.plan.maxCampaigns)
      return NextResponse.json({ error: `Limite de ${user.plan.maxCampaigns} campanhas atingido no seu plano.` }, { status: 403 });
  }

  const bannerImagesStr = Array.isArray(bannerImages)
    ? JSON.stringify(bannerImages.slice(0, 5))
    : typeof bannerImages === "string" ? bannerImages : "[]";

  const campaign = await prisma.campaign.create({
    data: { name: name.trim(), slug: cleanSlug, bannerImages: bannerImagesStr, userId, ...(rest as object) },
  });

  const { webhookSecret: _secret, ...publicData } = campaign;
  return NextResponse.json(publicData, { status: 201 });
}
