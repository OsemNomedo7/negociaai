import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateCPF, normalizeCPF } from "@/lib/cpf";
import { rateLimit } from "@/lib/rateLimit";
import { getGeo } from "@/lib/geo";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!rateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde 1 minuto." }, { status: 429 });
  }

  const campaign = await prisma.campaign.findUnique({ where: { slug: params.slug } });
  if (!campaign || !campaign.active) {
    return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, cpf, visitorId } = body as { name?: string; cpf?: string; visitorId?: string };

  if (!name || name.trim().length < 3) {
    return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
  }
  if (!cpf || !validateCPF(cpf)) {
    return NextResponse.json({ error: "CPF inválido." }, { status: 400 });
  }

  const normalizedCPF = normalizeCPF(cpf);
  const formattedCPF = `${normalizedCPF.slice(0,3)}.${normalizedCPF.slice(3,6)}.${normalizedCPF.slice(6,9)}-${normalizedCPF.slice(9)}`;

  const debtor = await prisma.debtor.findFirst({
    where: { campaignId: campaign.id, cpf: { in: [normalizedCPF, formattedCPF, cpf] } },
  });

  const discount     = campaign.discountPercent;
  const scoreMin     = campaign.scoreMin;
  const scoreMax     = campaign.scoreMax;
  const scoreAfterPay = campaign.scoreAfterPay;
  const score = Math.floor(Math.random() * (scoreMax - scoreMin + 1)) + scoreMin;

  const geo = await getGeo(ip);

  let debtData;

  if (debtor) {
    const discountedAmount = Math.round(debtor.amount * (1 - discount / 100) * 100) / 100;
    debtData = {
      found: true, debtorId: debtor.id,
      name: debtor.name, cpf: formattedCPF,
      amount: debtor.amount, discountedAmount,
      description: debtor.description, status: debtor.status,
      discount, score, scoreAfterPay, checkoutUrl: campaign.checkoutUrl || "",
    };
    await prisma.log.create({
      data: {
        name: name.trim(), cpf: formattedCPF, event: "CONSULTA",
        ip: geo.resolvedIp, city: geo.city, state: geo.state,
        debtorId: debtor.id, campaignId: campaign.id,
      },
    });
  } else {
    const defaultAmount = campaign.defaultDebtAmount;
    const discountedAmount = Math.round(defaultAmount * (1 - discount / 100) * 100) / 100;
    debtData = {
      found: false, debtorId: null,
      name: name.trim(), cpf: formattedCPF,
      amount: defaultAmount, discountedAmount,
      description: campaign.defaultDebtDesc, status: "PENDENTE",
      discount, score, scoreAfterPay, checkoutUrl: campaign.checkoutUrl || "",
    };
    await prisma.log.create({
      data: {
        name: name.trim(), cpf: formattedCPF, event: "CONSULTA",
        ip: geo.resolvedIp, city: geo.city, state: geo.state,
        campaignId: campaign.id,
      },
    });
  }

  if (visitorId) {
    await prisma.chatSession.updateMany({
      where: { visitorId },
      data: { name: name.trim(), cpf: formattedCPF, consulted: true },
    });
  }

  return NextResponse.json(debtData);
}
