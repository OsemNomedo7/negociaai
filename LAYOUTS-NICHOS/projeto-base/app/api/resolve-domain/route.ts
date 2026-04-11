import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) return NextResponse.json({ slug: null });

  const campaign = await prisma.campaign.findFirst({
    where: { customDomain: domain, active: true },
    select: { slug: true },
  });

  return NextResponse.json({ slug: campaign?.slug ?? null });
}
