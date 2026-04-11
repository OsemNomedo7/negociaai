import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const now = new Date();

  const [totalUsers, activePlans, blockedUsers, totalCampaigns, activeCampaigns, totalDebtors, paidDebtors, totalConsults] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { planExpiresAt: { gt: now }, active: true } }),
    prisma.user.count({ where: { active: false } }),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { active: true } }),
    prisma.debtor.count(),
    prisma.debtor.count({ where: { status: "PAGO" } }),
    prisma.log.count({ where: { event: "CONSULTA" } }),
  ]);

  const totalPayments = await prisma.log.count({ where: { event: "PAGAMENTO_CONCLUIDO" } });

  // Receita estimada mensal baseada em usuários com plano ativo
  const activePlanUsers = await prisma.user.findMany({
    where: { planExpiresAt: { gt: now }, active: true },
    include: { plan: { select: { price: true, durationDays: true } } },
  });
  const monthlyRevenue = activePlanUsers.reduce((acc, u) => {
    if (!u.plan || u.plan.durationDays <= 0) return acc;
    return acc + u.plan.price * (30 / u.plan.durationDays);
  }, 0);

  const [recentUsers, recentLogs] = await Promise.all([
    prisma.user.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { plan: { select: { name: true } } },
    }),
    prisma.log.findMany({
      take: 12,
      orderBy: { createdAt: "desc" },
      include: { campaign: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({
    totalUsers,
    activePlans,
    blockedUsers,
    totalCampaigns,
    activeCampaigns,
    totalDebtors,
    paidDebtors,
    totalConsults,
    totalPayments,
    monthlyRevenue,
    conversionRate: totalConsults > 0 ? ((totalPayments / totalConsults) * 100).toFixed(1) : "0.0",
    recentUsers: recentUsers.map(({ password: _pw, ...u }) => u),
    recentLogs,
  });
}
