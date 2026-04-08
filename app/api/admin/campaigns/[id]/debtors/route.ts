import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { normalizeCPF } from "@/lib/cpf";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const skip = (page - 1) * limit;

  const [debtors, total] = await Promise.all([
    prisma.debtor.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.debtor.count({ where: { campaignId: id } }),
  ]);

  return NextResponse.json({ debtors, total, page, limit, pages: Math.ceil(total / limit) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const campaignId = parseInt(params.id);
  if (isNaN(campaignId)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, cpf, amount, description, status } = body as {
    name?: string;
    cpf?: string;
    amount?: number;
    description?: string;
    status?: string;
  };

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
  }
  if (!cpf) {
    return NextResponse.json({ error: "CPF é obrigatório." }, { status: 400 });
  }
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: "Valor inválido." }, { status: 400 });
  }

  const normalizedCPF = normalizeCPF(cpf);
  const formattedCPF = `${normalizedCPF.slice(0, 3)}.${normalizedCPF.slice(3, 6)}.${normalizedCPF.slice(6, 9)}-${normalizedCPF.slice(9)}`;

  const existing = await prisma.debtor.findFirst({
    where: { campaignId, cpf: { in: [normalizedCPF, formattedCPF] } },
  });
  if (existing) {
    return NextResponse.json({ error: "CPF já cadastrado nesta campanha." }, { status: 409 });
  }

  const debtor = await prisma.debtor.create({
    data: {
      name: name.trim(),
      cpf: formattedCPF,
      amount: Number(amount),
      description: description?.trim() || "Dívida em aberto",
      status: status || "PENDENTE",
      campaignId,
    },
  });

  return NextResponse.json(debtor, { status: 201 });
}
