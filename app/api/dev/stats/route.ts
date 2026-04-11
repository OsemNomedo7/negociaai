import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const now = new Date();

  const [totalUsers, activePlans, blockedUsers, totalCampaigns, activeCampaigns, totalDebtors, paidDebtors, totalConsults, totalPayments] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { planExpiresAt: { gt: now }, active: true } }),
    prisma.user.count({ where: { active: false } }),
    prisma.campaign.count(),
    prisma.campaign.count({ where: { active: true } }),
    prisma.debtor.count(),
    prisma.debtor.count({ where: { status: "PAGO" } }),
    prisma.log.count({ where: { event: "CONSULTA" } }),
    prisma.log.count({ where: { event: "PAGAMENTO_CONCLUIDO" } }),
  ]);

  // Receita estimada mensal
  const activePlanUsers = await prisma.user.findMany({
    where: { planExpiresAt: { gt: now }, active: true },
    include: { plan: { select: { price: true, durationDays: true } } },
  });
  const monthlyRevenue = activePlanUsers.reduce((acc, u) => {
    if (!u.plan || u.plan.durationDays <= 0) return acc;
    return acc + u.plan.price * (30 / u.plan.durationDays);
  }, 0);

  // Atividade dos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dailyLogs = await prisma.log.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { event: true, createdAt: true },
  });

  const days: { label: string; consultas: number; pagamentos: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    days.push({
      label: d.toLocaleDateString("pt-BR", { weekday: "short" }),
      consultas: 0,
      pagamentos: 0,
    });
  }
  for (const log of dailyLogs) {
    const idx = Math.floor((new Date(log.createdAt).getTime() - sevenDaysAgo.getTime()) / 86400000);
    if (idx >= 0 && idx < 7) {
      if (log.event === "CONSULTA") days[idx].consultas++;
      else if (log.event === "PAGAMENTO_CONCLUIDO") days[idx].pagamentos++;
    }
  }

  // Novos cadastros dos últimos 30 dias
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  const newUsersMonth = await prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } });

  const [recentUsers, recentLogs] = await Promise.all([
    prisma.user.findMany({
      take: 6, orderBy: { createdAt: "desc" },
      include: { plan: { select: { name: true } } },
    }),
    prisma.log.findMany({
      take: 10, orderBy: { createdAt: "desc" },
      include: { campaign: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({
    totalUsers, activePlans, blockedUsers,
    totalCampaigns, activeCampaigns,
    totalDebtors, paidDebtors,
    totalConsults, totalPayments,
    monthlyRevenue,
    newUsersMonth,
    conversionRate: totalConsults > 0 ? ((totalPayments / totalConsults) * 100).toFixed(1) : "0.0",
    days,
    recentUsers: recentUsers.map(({ password: _pw, ...u }) => u),
    recentLogs,
  });
}
