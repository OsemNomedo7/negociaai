import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const plans = await prisma.plan.findMany({ orderBy: { durationDays: "asc" } });
  return NextResponse.json(plans);
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const plan = await prisma.plan.create({
    data: {
      name: body.name || "Novo Plano",
      price: Number(body.price) || 0,
      durationDays: Number(body.durationDays) || 30,
      maxCampaigns: Number(body.maxCampaigns) || 3,
      maxDebtors: Number(body.maxDebtors) || 1000,
      checkoutUrl: body.checkoutUrl || "",
      active: body.active ?? true,
    },
  });
  return NextResponse.json(plan);
}
