import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { normalizeCPF } from "@/lib/cpf";

export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { cpf: { contains: search } },
        ],
      }
    : {};

  const [debtors, total] = await Promise.all([
    prisma.debtor.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
    prisma.debtor.count({ where }),
  ]);

  return NextResponse.json({ debtors, total, page, limit });
}

export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, cpf, amount, description, status } = body;

  if (!name || !cpf || !amount) {
    return NextResponse.json({ error: "Campos obrigatórios: nome, CPF, valor." }, { status: 400 });
  }

  const normalizedCPF = normalizeCPF(cpf);
  const formatted = `${normalizedCPF.slice(0,3)}.${normalizedCPF.slice(3,6)}.${normalizedCPF.slice(6,9)}-${normalizedCPF.slice(9)}`;

  try {
    const debtor = await prisma.debtor.create({
      data: {
        name: name.trim(),
        cpf: formatted,
        amount: parseFloat(amount),
        description: description || "Dívida em aberto",
        status: status || "PENDENTE",
      },
    });
    return NextResponse.json(debtor, { status: 201 });
  } catch {
    return NextResponse.json({ error: "CPF já cadastrado." }, { status: 409 });
  }
}
