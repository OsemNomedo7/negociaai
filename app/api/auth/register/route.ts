import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, email, password } = body as { name?: string; email?: string; password?: string };

  if (!name || name.trim().length < 2)
    return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  if (!password || password.length < 6)
    return NextResponse.json({ error: "Senha deve ter pelo menos 6 caracteres." }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.toLowerCase(), password: hashed },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
