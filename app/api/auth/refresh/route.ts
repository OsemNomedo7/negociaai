import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest, signToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const payload = await getTenantFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId as number },
    include: { plan: true },
  });
  if (!user || !user.active)
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const planActive = user.planExpiresAt ? user.planExpiresAt > new Date() : false;

  // Reemite o token com planExpiresAt atualizado do banco
  const token = await signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    planId: user.planId,
    planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
  }, "30d");

  const res = NextResponse.json({ ok: true, planActive });
  res.cookies.set("tenant_token", token, {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/",
  });
  return res;
}
