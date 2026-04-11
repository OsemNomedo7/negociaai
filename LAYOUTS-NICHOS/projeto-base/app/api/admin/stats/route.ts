import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const [totalLogs, consultations, clicks, payments, totalDebtors] = await Promise.all([
    prisma.log.count(),
    prisma.log.count({ where: { event: "CONSULTA" } }),
    prisma.log.count({ where: { event: "CLIQUE_PAGAMENTO" } }),
    prisma.log.count({ where: { event: "PAGAMENTO_CONCLUIDO" } }),
    prisma.debtor.count(),
  ]);

  const conversionRate =
    consultations > 0 ? ((payments / consultations) * 100).toFixed(1) : "0";

  // Consultas dos últimos 7 dias
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentLogs = await prisma.log.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      event: "CONSULTA",
    },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Agrupar por dia
  const byDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    byDay[key] = 0;
  }
  for (const log of recentLogs) {
    const key = new Date(log.createdAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    if (key in byDay) byDay[key]++;
  }

  const chartData = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  // Receita estimada (valor com desconto dos pagamentos concluídos)
  const paidLogs = await prisma.log.findMany({
    where: { event: "PAGAMENTO_CONCLUIDO", debtorId: { not: null } },
    include: { debtor: true },
  });

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const discount = settings?.discountPercent ?? 60;

  let estimatedRevenue = 0;
  for (const log of paidLogs) {
    if (log.debtor) {
      estimatedRevenue += log.debtor.amount * (1 - discount / 100);
    }
  }

  return NextResponse.json({
    totalLogs,
    consultations,
    clicks,
    payments,
    conversionRate,
    totalDebtors,
    estimatedRevenue: Math.round(estimatedRevenue * 100) / 100,
    chartData,
  });
}
