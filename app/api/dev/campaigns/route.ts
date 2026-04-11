import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { debtors: true, logs: true } },
    },
  });

  // Contar pagamentos por campanha
  const paymentCounts = await prisma.log.groupBy({
    by: ["campaignId"],
    where: { event: "PAGAMENTO_CONCLUIDO" },
    _count: { id: true },
  });
  const paymentsMap = Object.fromEntries(paymentCounts.map(p => [p.campaignId, p._count.id]));

  return NextResponse.json(
    campaigns.map(c => ({ ...c, paymentsCount: paymentsMap[c.id] ?? 0 }))
  );
}
