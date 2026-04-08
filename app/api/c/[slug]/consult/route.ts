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

  const campaign = await prisma.campaign.findUnique({
    where: { slug: params.slug },
  });

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
  const formattedCPF = `${normalizedCPF.slice(0, 3)}.${normalizedCPF.slice(3, 6)}.${normalizedCPF.slice(6, 9)}-${normalizedCPF.slice(9)}`;

  const debtor = await prisma.debtor.findFirst({
    where: {
      campaignId: campaign.id,
      cpf: { in: [normalizedCPF, formattedCPF, cpf] },
    },
  });

  const discount = campaign.discountPercent;
  const scoreMin = campaign.scoreMin;
  const scoreMax = campaign.scoreMax;
  const scoreAfterPay = campaign.scoreAfterPay;

  const score = Math.floor(Math.random() * (scoreMax - scoreMin + 1)) + scoreMin;

  const geo = await getGeo(ip);

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
      checkoutUrl: campaign.checkoutUrl || "",
    };

    await prisma.$executeRaw`INSERT INTO Log (name, cpf, event, ip, city, state, debtorId, campaignId, createdAt)
      VALUES (${name.trim()}, ${formattedCPF}, 'CONSULTA', ${geo.resolvedIp}, ${geo.city}, ${geo.state}, ${debtor.id}, ${campaign.id}, datetime('now'))`;
  } else {
    const defaultAmount = campaign.defaultDebtAmount;
    const defaultDesc = campaign.defaultDebtDesc;
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
      checkoutUrl: campaign.checkoutUrl || "",
    };

    await prisma.$executeRaw`INSERT INTO Log (name, cpf, event, ip, city, state, campaignId, createdAt)
      VALUES (${name.trim()}, ${formattedCPF}, 'CONSULTA', ${geo.resolvedIp}, ${geo.city}, ${geo.state}, ${campaign.id}, datetime('now'))`;
  }

  if (visitorId) {
    await prisma.$executeRaw`UPDATE ChatSession SET name=${name.trim()}, cpf=${formattedCPF}, consulted=1, updatedAt=datetime('now') WHERE visitorId=${visitorId}`;
  }

  return NextResponse.json(debtData);
}
