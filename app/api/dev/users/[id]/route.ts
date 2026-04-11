import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Bloquear/desbloquear, trocar plano manualmente
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const id = parseInt(params.id);
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.active !== undefined) data.active = body.active;
  if (body.planId !== undefined) data.planId = body.planId;
  if (body.planExpiresAt !== undefined) data.planExpiresAt = body.planExpiresAt ? new Date(body.planExpiresAt) : null;

  const user = await prisma.user.update({ where: { id }, data, include: { plan: true } });
  const { password: _pw, ...userData } = user;
  return NextResponse.json(userData);
}
