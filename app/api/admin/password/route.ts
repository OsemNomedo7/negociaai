import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { currentPassword, newPassword } = body as { currentPassword?: string; newPassword?: string };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const adminRecord = await prisma.admin.findUnique({ where: { username: admin.username as string } });
  if (!adminRecord) return NextResponse.json({ error: "Admin não encontrado." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, adminRecord.password);
  if (!valid) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.admin.update({ where: { id: adminRecord.id }, data: { password: hash } });

  return NextResponse.json({ ok: true });
}
