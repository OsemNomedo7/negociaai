import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);

  if (body?.ids && Array.isArray(body.ids) && body.ids.length > 0) {
    // Delete specific IDs
    const ids = (body.ids as number[]).map(Number).filter(n => !isNaN(n));
    for (const id of ids) {
      await prisma.$executeRaw`DELETE FROM Log WHERE id = ${id}`;
    }
    return NextResponse.json({ deleted: ids.length });
  }

  if (body?.all === true) {
    const result = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM Log`;
    await prisma.$executeRaw`DELETE FROM Log`;
    return NextResponse.json({ deleted: Number(result[0]?.count ?? 0) });
  }

  return NextResponse.json({ error: "Informe ids[] ou all:true" }, { status: 400 });
}

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;
  const event = searchParams.get("event") || "";

  const whereClause = event ? `WHERE l.event = '${event.replace(/'/g, "''")}'` : "";

  const [logs, countResult] = await Promise.all([
    prisma.$queryRawUnsafe<{
      id: number; name: string; cpf: string; event: string;
      ip: string | null; city: string | null; state: string | null;
      createdAt: string; debtorName: string | null;
    }[]>(`
      SELECT l.id, l.name, l.cpf, l.event, l.ip, l.city, l.state, l.createdAt,
             d.name AS debtorName
      FROM Log l
      LEFT JOIN Debtor d ON d.id = l.debtorId
      ${whereClause}
      ORDER BY l.createdAt DESC
      LIMIT ${limit} OFFSET ${skip}
    `),
    prisma.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COUNT(*) AS total FROM Log l ${whereClause}`
    ),
  ]);

  const total = Number(countResult[0]?.total ?? 0);

  // Adapta ao formato que o front espera (debtor: { name })
  const normalized = logs.map(l => ({
    id: l.id, name: l.name, cpf: l.cpf, event: l.event,
    ip: l.ip, city: l.city, state: l.state, createdAt: l.createdAt,
    debtor: l.debtorName ? { name: l.debtorName } : null,
  }));

  return NextResponse.json({ logs: normalized, total, page, limit });
}
