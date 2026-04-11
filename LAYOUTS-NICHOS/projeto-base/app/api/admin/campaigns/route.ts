import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { debtors: true, logs: true },
      },
    },
  });

  const result = await Promise.all(
    campaigns.map(async (c) => {
      const payments = await prisma.log.count({
        where: { campaignId: c.id, event: "PAGAMENTO_CONCLUIDO" },
      });
      const consults = await prisma.log.count({
        where: { campaignId: c.id, event: "CONSULTA" },
      });
      const { webhookSecret: _secret, ...rest } = c;
      let bannerImages: string[] = [];
      try { bannerImages = JSON.parse(rest.bannerImages || "[]"); } catch { /* noop */ }
      return { ...rest, bannerImages, stats: { consults, payments } };
    })
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, slug, bannerImages, ...rest } = body as Record<string, unknown>;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }

  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "Slug é obrigatório." }, { status: 400 });
  }

  const cleanSlug = slug.toLowerCase().trim();

  if (!/^[a-z0-9-]{3,}$/.test(cleanSlug)) {
    return NextResponse.json({
      error: "Slug deve ter pelo menos 3 caracteres e conter apenas letras minúsculas, números e hífens.",
    }, { status: 400 });
  }

  const existing = await prisma.campaign.findUnique({ where: { slug: cleanSlug } });
  if (existing) {
    return NextResponse.json({ error: "Slug já está em uso." }, { status: 409 });
  }

  const bannerImagesStr = Array.isArray(bannerImages)
    ? JSON.stringify(bannerImages.slice(0, 5))
    : typeof bannerImages === "string" ? bannerImages : "[]";

  const campaign = await prisma.campaign.create({
    data: {
      name: name.trim(),
      slug: cleanSlug,
      bannerImages: bannerImagesStr,
      ...(rest as object),
    },
  });

  const { webhookSecret: _secret, ...publicData } = campaign;
  return NextResponse.json(publicData, { status: 201 });
}
