import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function getSettings() {
  return prisma.devSettings.upsert({
    where: { id: 1 },
    create: { id: 1, planWebhookSecret: "" },
    update: {},
  });
}

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const settings = await getSettings();

  // Últimas ativações de plano (usuários com planExpiresAt, ordenados por updatedAt)
  const recentActivations = await prisma.user.findMany({
    where: { planExpiresAt: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true, name: true, email: true,
      planExpiresAt: true, updatedAt: true,
      plan: { select: { name: true } },
    },
  });

  return NextResponse.json({ planWebhookSecret: settings.planWebhookSecret, recentActivations });
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const settings = await prisma.devSettings.upsert({
    where: { id: 1 },
    create: { id: 1, planWebhookSecret: body.planWebhookSecret ?? "" },
    update: { planWebhookSecret: body.planWebhookSecret ?? "" },
  });

  return NextResponse.json({ planWebhookSecret: settings.planWebhookSecret });
}
