import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) return NextResponse.json({});

  // Retorna apenas campos públicos
  return NextResponse.json({
    companyName: settings.companyName,
    companyLogo: settings.companyLogo,
    primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    headerTitle: settings.headerTitle,
    headerSubtitle: settings.headerSubtitle,
    urgencyText: settings.urgencyText,
    ctaText: settings.ctaText,
    footerText: settings.footerText,
    faviconUrl: settings.faviconUrl,
    bannerImages: settings.bannerImages ?? "[]",
    logoHeight: settings.logoHeight ?? 44,
  });
}
