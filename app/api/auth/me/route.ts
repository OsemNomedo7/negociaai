import { NextRequest, NextResponse } from "next/server";
import { getTenantFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const payload = await getTenantFromRequest(req);
  if (!payload) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: payload.userId as number },
    include: { plan: true },
  });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const { password: _pw, ...userData } = user;
  const planActive = userData.planExpiresAt ? userData.planExpiresAt > new Date() : false;
  return NextResponse.json({ ...userData, planActive });
}
