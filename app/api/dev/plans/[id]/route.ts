import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const id = parseInt(params.id);
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const plan = await prisma.plan.update({
    where: { id },
    data: {
      name: body.name,
      price: Number(body.price),
      durationDays: Number(body.durationDays),
      maxCampaigns: Number(body.maxCampaigns),
      maxDebtors: Number(body.maxDebtors),
      checkoutUrl: body.checkoutUrl,
      active: body.active,
    },
  });
  return NextResponse.json(plan);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  await prisma.plan.delete({ where: { id: parseInt(params.id) } });
  return NextResponse.json({ ok: true });
}
