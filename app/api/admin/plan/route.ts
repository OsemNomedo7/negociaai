import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const payload = await getTenantFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const [user, plans] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.userId as number },
      include: { plan: true },
    }),
    prisma.plan.findMany({
      where: { active: true },
      orderBy: { price: "asc" },
      select: {
        id: true, name: true, price: true, durationDays: true,
        maxCampaigns: true, maxDebtors: true, checkoutUrl: true,
      },
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const planActive = user.planExpiresAt ? user.planExpiresAt > new Date() : false;
  const daysLeft = user.planExpiresAt
    ? Math.ceil((user.planExpiresAt.getTime() - Date.now()) / 86400000)
    : null;

  return NextResponse.json({
    currentPlan: user.plan ?? null,
    planExpiresAt: user.planExpiresAt ?? null,
    planActive,
    daysLeft,
    availablePlans: plans,
  });
}
