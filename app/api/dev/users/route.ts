import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { plan: true, _count: { select: { campaigns: true } } },
  });

  return NextResponse.json(users.map(({ password: _pw, ...u }) => ({
    ...u,
    planActive: u.planExpiresAt ? u.planExpiresAt > new Date() : false,
  })));
}
