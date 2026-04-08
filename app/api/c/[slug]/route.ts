import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const campaign = await prisma.campaign.findUnique({
    where: { slug: params.slug },
  });

  if (!campaign || !campaign.active) {
    return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  }

  // Omit webhookSecret from public response
  const { webhookSecret: _secret, ...publicData } = campaign;

  return NextResponse.json(publicData);
}
