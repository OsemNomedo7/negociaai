import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminFromRequest } from "@/lib/auth";
import { normalizeCPF } from "@/lib/cpf";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const id = parseInt(params.id);
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, cpf, amount, description, status } = body;
  const normalizedCPF = normalizeCPF(cpf || "");
  const formatted = normalizedCPF.length === 11
    ? `${normalizedCPF.slice(0,3)}.${normalizedCPF.slice(3,6)}.${normalizedCPF.slice(6,9)}-${normalizedCPF.slice(9)}`
    : cpf;

  try {
    const debtor = await prisma.debtor.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(cpf && { cpf: formatted }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
    });
    return NextResponse.json(debtor);
  } catch {
    return NextResponse.json({ error: "Devedor não encontrado." }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const id = parseInt(params.id);

  try {
    await prisma.log.deleteMany({ where: { debtorId: id } });
    await prisma.debtor.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Devedor não encontrado." }, { status: 404 });
  }
}
