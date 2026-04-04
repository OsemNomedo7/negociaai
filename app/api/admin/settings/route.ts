import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  return NextResponse.json(settings || {});
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  // Garantir que bannerImages seja string JSON válida
  let bannerImages = body.bannerImages;
  if (Array.isArray(bannerImages)) {
    bannerImages = JSON.stringify(bannerImages.slice(0, 5));
  } else if (typeof bannerImages !== "string") {
    bannerImages = "[]";
  }

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: {
      companyName: body.companyName,
      companyLogo: body.companyLogo,
      primaryColor: body.primaryColor,
      secondaryColor: body.secondaryColor,
      discountPercent: body.discountPercent !== undefined ? parseFloat(body.discountPercent) : undefined,
      defaultDebtAmount: body.defaultDebtAmount !== undefined ? parseFloat(body.defaultDebtAmount) : undefined,
      defaultDebtDesc: body.defaultDebtDesc,
      checkoutUrl: body.checkoutUrl,
      scoreMin: body.scoreMin !== undefined ? parseInt(body.scoreMin) : undefined,
      scoreMax: body.scoreMax !== undefined ? parseInt(body.scoreMax) : undefined,
      scoreAfterPay: body.scoreAfterPay !== undefined ? parseInt(body.scoreAfterPay) : undefined,
      headerTitle: body.headerTitle,
      headerSubtitle: body.headerSubtitle,
      urgencyText: body.urgencyText,
      ctaText: body.ctaText,
      footerText: body.footerText,
      faviconUrl: body.faviconUrl,
      bannerImages,
    },
    create: { id: 1, ...body, bannerImages },
  });

  return NextResponse.json(settings);
}
