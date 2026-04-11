import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Rota temporária para corrigir o email do usuário admin
// DELETE este arquivo após o uso!
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (secret !== "caos-fix-2024") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, active: true },
    orderBy: { id: "asc" },
  });

  if (users.length === 0) {
    return NextResponse.json({ error: "Nenhum usuário encontrado." }, { status: 404 });
  }

  const target = users.find(u => u.name.toLowerCase() === "admin") ?? users[0];

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { email: "admin@admin.com", active: true },
    include: { _count: { select: { campaigns: true } } },
  });

  return NextResponse.json({
    ok: true,
    message: "Email atualizado com sucesso!",
    user: { id: updated.id, name: updated.name, email: updated.email, active: updated.active },
    campanhas: updated._count.campaigns,
    allUsers: users,
  });
}
