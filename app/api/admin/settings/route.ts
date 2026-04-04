import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) return NextResponse.json({});

  const raw = await prisma.$queryRaw<{ logoHeight: number }[]>`SELECT logoHeight FROM Settings WHERE id = 1`;
  return NextResponse.json({ ...settings, logoHeight: raw[0]?.logoHeight ?? 44 });
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  let bannerImages = body.bannerImages;
  if (Array.isArray(bannerImages)) bannerImages = JSON.stringify(bannerImages.slice(0, 5));
  else if (typeof bannerImages !== "string") bannerImages = "[]";

  // Campos explícitos — sem spread de body para evitar campos desconhecidos pelo Prisma client
  const data = {
    companyName:       typeof body.companyName       === "string" ? body.companyName       : undefined,
    companyLogo:       typeof body.companyLogo       === "string" ? body.companyLogo       : undefined,
    primaryColor:      typeof body.primaryColor      === "string" ? body.primaryColor      : undefined,
    secondaryColor:    typeof body.secondaryColor    === "string" ? body.secondaryColor    : undefined,
    discountPercent:   body.discountPercent   != null ? parseFloat(body.discountPercent)   : undefined,
    defaultDebtAmount: body.defaultDebtAmount != null ? parseFloat(body.defaultDebtAmount) : undefined,
    defaultDebtDesc:   typeof body.defaultDebtDesc   === "string" ? body.defaultDebtDesc   : undefined,
    checkoutUrl:       typeof body.checkoutUrl       === "string" ? body.checkoutUrl       : undefined,
    scoreMin:          body.scoreMin      != null ? parseInt(body.scoreMin)      : undefined,
    scoreMax:          body.scoreMax      != null ? parseInt(body.scoreMax)      : undefined,
    scoreAfterPay:     body.scoreAfterPay != null ? parseInt(body.scoreAfterPay) : undefined,
    headerTitle:       typeof body.headerTitle       === "string" ? body.headerTitle       : undefined,
    headerSubtitle:    typeof body.headerSubtitle    === "string" ? body.headerSubtitle    : undefined,
    urgencyText:       typeof body.urgencyText       === "string" ? body.urgencyText       : undefined,
    ctaText:           typeof body.ctaText           === "string" ? body.ctaText           : undefined,
    footerText:        typeof body.footerText        === "string" ? body.footerText        : undefined,
    faviconUrl:        typeof body.faviconUrl        === "string" ? body.faviconUrl        : undefined,
    bannerImages,
  };

  // Remove undefined para não sobrescrever com undefined
  const updateData = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: updateData,
    create: {
      id: 1,
      companyName:       data.companyName       ?? "NegociAI",
      companyLogo:       data.companyLogo       ?? "",
      primaryColor:      data.primaryColor      ?? "#6366f1",
      secondaryColor:    data.secondaryColor    ?? "#8b5cf6",
      discountPercent:   data.discountPercent   ?? 60,
      defaultDebtAmount: data.defaultDebtAmount ?? 1200,
      defaultDebtDesc:   data.defaultDebtDesc   ?? "Dívida em aberto",
      checkoutUrl:       data.checkoutUrl       ?? "",
      scoreMin:          data.scoreMin          ?? 280,
      scoreMax:          data.scoreMax          ?? 420,
      scoreAfterPay:     data.scoreAfterPay     ?? 820,
      headerTitle:       data.headerTitle       ?? "Regularize sua situação financeira",
      headerSubtitle:    data.headerSubtitle    ?? "Consulte sua dívida e quite com até 60% de desconto",
      urgencyText:       data.urgencyText       ?? "⚡ Oferta por tempo limitado",
      ctaText:           data.ctaText           ?? "Pagar via PIX agora",
      footerText:        data.footerText        ?? "Ambiente 100% seguro.",
      faviconUrl:        data.faviconUrl        ?? "",
      bannerImages,
    },
  });

  // logoHeight via raw SQL (fora do Prisma client gerado)
  if (body.logoHeight != null) {
    const lh = Math.min(Math.max(parseInt(body.logoHeight) || 44, 24), 120);
    await prisma.$executeRaw`UPDATE Settings SET logoHeight = ${lh} WHERE id = 1`;
  }

  const raw = await prisma.$queryRaw<{ logoHeight: number }[]>`SELECT logoHeight FROM Settings WHERE id = 1`;
  return NextResponse.json({ ...settings, logoHeight: raw[0]?.logoHeight ?? 44 });
}
