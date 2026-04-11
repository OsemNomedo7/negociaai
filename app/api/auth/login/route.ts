import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { email, password } = body as { email?: string; password?: string };
  if (!email || !password)
    return NextResponse.json({ error: "E-mail e senha obrigatórios." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { plan: true },
  });
  if (!user || !user.active)
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid)
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });

  const planActive = user.planExpiresAt && user.planExpiresAt > new Date();

  const token = await signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    planId: user.planId,
    planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
  }, "30d");

  const res = NextResponse.json({
    ok: true,
    planActive,
    planExpiresAt: user.planExpiresAt,
  });
  res.cookies.set("tenant_token", token, {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/",
  });
  return res;
}
