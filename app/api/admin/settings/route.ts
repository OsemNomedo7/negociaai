import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) return NextResponse.json({});

  // Pega logoHeight via raw (campo adicionado depois da geração do client)
  const raw = await prisma.$queryRaw<{ logoHeight: number }[]>`
    SELECT logoHeight FROM Settings WHERE id = 1
  `;
  const logoHeight = raw[0]?.logoHeight ?? 44;

  return NextResponse.json({ ...settings, logoHeight });
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  let bannerImages = body.bannerImages;
  if (Array.isArray(bannerImages)) {
    bannerImages = JSON.stringify(bannerImages.slice(0, 5));
  } else if (typeof bannerImages !== "string") {
    bannerImages = "[]";
  }

  // Upsert dos campos conhecidos pelo Prisma client atual
  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      companyName:       body.companyName,
      companyLogo:       body.companyLogo,
      primaryColor:      body.primaryColor,
      secondaryColor:    body.secondaryColor,
      discountPercent:   body.discountPercent   != null ? parseFloat(body.discountPercent)   : undefined,
      defaultDebtAmount: body.defaultDebtAmount != null ? parseFloat(body.defaultDebtAmount) : undefined,
      defaultDebtDesc:   body.defaultDebtDesc,
      checkoutUrl:       body.checkoutUrl,
      scoreMin:          body.scoreMin          != null ? parseInt(body.scoreMin)   : undefined,
      scoreMax:          body.scoreMax          != null ? parseInt(body.scoreMax)   : undefined,
      scoreAfterPay:     body.scoreAfterPay     != null ? parseInt(body.scoreAfterPay) : undefined,
      headerTitle:       body.headerTitle,
      headerSubtitle:    body.headerSubtitle,
      urgencyText:       body.urgencyText,
      ctaText:           body.ctaText,
      footerText:        body.footerText,
      faviconUrl:        body.faviconUrl,
      bannerImages,
    },
    create: { id: 1, ...body, bannerImages },
  });

  // logoHeight via raw SQL (campo adicionado depois da geração do Prisma client)
  if (body.logoHeight != null) {
    const lh = Math.min(Math.max(parseInt(body.logoHeight) || 44, 24), 120);
    await prisma.$executeRaw`UPDATE Settings SET logoHeight = ${lh} WHERE id = 1`;
  }

  const raw = await prisma.$queryRaw<{ logoHeight: number }[]>`
    SELECT logoHeight FROM Settings WHERE id = 1
  `;
  return NextResponse.json({ ...settings, logoHeight: raw[0]?.logoHeight ?? 44 });
}
