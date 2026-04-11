import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const userId = tenant.userId as number;

  const campaignFilter = { campaign: { userId } };

  const [totalLogs, consultations, clicks, payments, totalDebtors] = await Promise.all([
    prisma.log.count({ where: campaignFilter }),
    prisma.log.count({ where: { ...campaignFilter, event: "CONSULTA" } }),
    prisma.log.count({ where: { ...campaignFilter, event: "CLIQUE_PAGAMENTO" } }),
    prisma.log.count({ where: { ...campaignFilter, event: "PAGAMENTO_CONCLUIDO" } }),
    prisma.debtor.count({ where: { campaign: { userId } } }),
  ]);

  const conversionRate =
    consultations > 0 ? ((payments / consultations) * 100).toFixed(1) : "0";

  // Consultas dos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentLogs = await prisma.log.findMany({
    where: { ...campaignFilter, createdAt: { gte: sevenDaysAgo }, event: "CONSULTA" },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    byDay[key] = 0;
  }
  for (const log of recentLogs) {
    const key = new Date(log.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    if (key in byDay) byDay[key]++;
  }
  const chartData = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  // Receita estimada
  const paidLogs = await prisma.log.findMany({
    where: { ...campaignFilter, event: "PAGAMENTO_CONCLUIDO", debtorId: { not: null } },
    include: { debtor: true, campaign: { select: { discountPercent: true } } },
  });
  let estimatedRevenue = 0;
  for (const log of paidLogs) {
    if (log.debtor) {
      const discount = log.campaign?.discountPercent ?? 60;
      estimatedRevenue += log.debtor.amount * (1 - discount / 100);
    }
  }

  // Plano do usuário
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { plan: true },
  });
  const planExpiresAt = user?.planExpiresAt ?? null;
  const daysLeft = planExpiresAt
    ? Math.max(0, Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / 86400000))
    : null;

  // Últimas 10 consultas
  const latestConsults = await prisma.log.findMany({
    where: { ...campaignFilter, event: "CONSULTA" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true, name: true, cpf: true, city: true, state: true, createdAt: true,
      campaign: { select: { name: true, slug: true } },
    },
  });

  // Devedores por status
  const debtorsByStatus = await prisma.debtor.groupBy({
    by: ["status"],
    where: { campaign: { userId } },
    _count: { status: true },
  });

  // Top campanhas por consultas
  const campaigns = await prisma.campaign.findMany({
    where: { userId },
    select: {
      id: true, name: true, slug: true, active: true,
      _count: { select: { logs: true, debtors: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const topCampaigns = await Promise.all(
    campaigns.map(async (c) => {
      const consults = await prisma.log.count({ where: { campaignId: c.id, event: "CONSULTA" } });
      const paid = await prisma.log.count({ where: { campaignId: c.id, event: "PAGAMENTO_CONCLUIDO" } });
      return { ...c, consults, paid };
    })
  );
  topCampaigns.sort((a, b) => b.consults - a.consults);

  return NextResponse.json({
    totalLogs, consultations, clicks, payments,
    conversionRate, totalDebtors,
    estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
    chartData,
    plan: user?.plan ?? null,
    planExpiresAt,
    daysLeft,
    latestConsults,
    debtorsByStatus: debtorsByStatus.map(d => ({ status: d.status, count: d._count.status })),
    topCampaigns,
  });
}
