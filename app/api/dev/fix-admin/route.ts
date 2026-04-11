import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// Rota temporária para corrigir credenciais do usuário admin
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
    // Nenhum usuário — cria o admin do zero
    const hash = await bcrypt.hash("admin123", 12);
    const created = await prisma.user.create({
      data: { name: "Admin", email: "admin@admin.com", password: hash, active: true },
      include: { _count: { select: { campaigns: true } } },
    });
    return NextResponse.json({
      ok: true, action: "created",
      user: { id: created.id, name: created.name, email: created.email },
      campanhas: created._count.campaigns,
    });
  }

  const target = users.find(u => u.name.toLowerCase() === "admin") ?? users[0];
  const hash = await bcrypt.hash("admin123", 12);

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { email: "admin@admin.com", password: hash, active: true },
    include: { _count: { select: { campaigns: true } } },
  });

  // Busca todas campanhas para diagnóstico
  const allCampaigns = await prisma.campaign.findMany({
    select: { id: true, name: true, slug: true, userId: true, active: true },
    orderBy: { id: "asc" },
  });

  return NextResponse.json({
    ok: true, action: "updated",
    message: "Email e senha redefinidos com sucesso!",
    loginCom: { email: "admin@admin.com", senha: "admin123" },
    user: { id: updated.id, name: updated.name, email: updated.email, active: updated.active },
    campanhasDoUsuario: updated._count.campaigns,
    todasCampanhas: allCampaigns,
    todosUsuarios: users.map(u => ({ id: u.id, name: u.name, email: u.email, active: u.active })),
  });
}
