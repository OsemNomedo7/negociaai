import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;
  const event = searchParams.get("event") || "";

  const where = event ? { event } : {};

  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { debtor: { select: { name: true } } },
    }),
    prisma.log.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}
