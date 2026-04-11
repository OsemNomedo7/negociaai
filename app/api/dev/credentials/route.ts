import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { currentPassword, newUsername, newPassword } = body as {
    currentPassword?: string;
    newUsername?: string;
    newPassword?: string;
  };

  if (!currentPassword) return NextResponse.json({ error: "Senha atual é obrigatória." }, { status: 400 });
  if (!newUsername && !newPassword) return NextResponse.json({ error: "Informe o novo usuário ou nova senha." }, { status: 400 });

  // Busca o admin atual pelo username do token
  const current = await prisma.admin.findUnique({ where: { username: admin.username as string } });
  if (!current) return NextResponse.json({ error: "Admin não encontrado." }, { status: 404 });

  // Valida senha atual
  const valid = await bcrypt.compare(currentPassword, current.password);
  if (!valid) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });

  // Verifica conflito de username
  if (newUsername && newUsername !== current.username) {
    const exists = await prisma.admin.findUnique({ where: { username: newUsername } });
    if (exists) return NextResponse.json({ error: "Esse usuário já está em uso." }, { status: 409 });
  }

  const data: { username?: string; password?: string } = {};
  if (newUsername) data.username = newUsername;
  if (newPassword) {
    if (newPassword.length < 6) return NextResponse.json({ error: "Nova senha deve ter ao menos 6 caracteres." }, { status: 400 });
    data.password = await bcrypt.hash(newPassword, 12);
  }

  await prisma.admin.update({ where: { id: current.id }, data });

  return NextResponse.json({ ok: true, message: "Credenciais atualizadas com sucesso." });
}
