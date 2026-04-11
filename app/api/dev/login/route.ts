import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { username, password } = body as { username?: string; password?: string };
  if (!username || !password)
    return NextResponse.json({ error: "Usuário e senha obrigatórios." }, { status: 400 });

  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });

  const token = await signToken({ adminId: admin.id, username: admin.username, role: "dev" }, "8h");

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_token", token, {
    httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 8, path: "/",
  });
  return res;
}
