import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateCPF, normalizeCPF } from "@/lib/cpf";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!rateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, cpf } = body as { name?: string; cpf?: string };

  if (!name || name.trim().length < 3) {
    return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  }

  if (!cpf || !validateCPF(cpf)) {
    return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
  }

  const normalizedCPF = normalizeCPF(cpf);
  const formattedCPF = `${normalizedCPF.slice(0,3)}.${normalizedCPF.slice(3,6)}.${normalizedCPF.slice(6,9)}-${normalizedCPF.slice(9)}`;

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  const debtor = await prisma.debtor.findFirst({
    where: {
      cpf: {
        in: [normalizedCPF, formattedCPF, cpf],
      },
    },
  });

  const discount = settings?.discountPercent ?? 60;
  const scoreMin = settings?.scoreMin ?? 280;
  const scoreMax = settings?.scoreMax ?? 420;
  const scoreAfterPay = settings?.scoreAfterPay ?? 820;

  const score = Math.floor(Math.random() * (scoreMax - scoreMin + 1)) + scoreMin;

  let debtData;

  if (debtor) {
    const discountedAmount = debtor.amount * (1 - discount / 100);
    debtData = {
      found: true,
      debtorId: debtor.id,
      name: debtor.name,
      cpf: formattedCPF,
      amount: debtor.amount,
      discountedAmount: Math.round(discountedAmount * 100) / 100,
      description: debtor.description,
      status: debtor.status,
      discount,
      score,
      scoreAfterPay,
      checkoutUrl: settings?.checkoutUrl || "",
    };

    await prisma.log.create({
      data: {
        name: name.trim(),
        cpf: formattedCPF,
        event: "CONSULTA",
        ip,
        debtorId: debtor.id,
      },
    });
  } else {
    const defaultAmount = settings?.defaultDebtAmount ?? 1200;
    const defaultDesc = settings?.defaultDebtDesc ?? "Dívida em aberto";
    const discountedAmount = defaultAmount * (1 - discount / 100);

    debtData = {
      found: false,
      debtorId: null,
      name: name.trim(),
      cpf: formattedCPF,
      amount: defaultAmount,
      discountedAmount: Math.round(discountedAmount * 100) / 100,
      description: defaultDesc,
      status: "PENDENTE",
      discount,
      score,
      scoreAfterPay,
      checkoutUrl: settings?.checkoutUrl || "",
    };

    await prisma.log.create({
      data: {
        name: name.trim(),
        cpf: formattedCPF,
        event: "CONSULTA",
        ip,
      },
    });
  }

  return NextResponse.json(debtData);
}
