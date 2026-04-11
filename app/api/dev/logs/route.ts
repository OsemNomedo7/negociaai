import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin || admin.role !== "dev") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const event = url.searchParams.get("event") || undefined;
  const limit = 50;

  const where = event ? { event } : {};

  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: {
          select: {
            name: true,
            slug: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    }),
    prisma.log.count({ where }),
  ]);

  return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
}
