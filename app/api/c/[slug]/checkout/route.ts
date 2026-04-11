import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const campaign = await prisma.campaign.findUnique({ where: { slug: params.slug } });
  if (!campaign || !campaign.active)
    return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });

  if (!campaign.sigilopayApiKey)
    return NextResponse.json({ error: "Integração SigiloPay não configurada nesta campanha." }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, cpf, amount } = body as { name?: string; cpf?: string; amount?: number };
  if (!name || !cpf || !amount || amount <= 0)
    return NextResponse.json({ error: "Nome, CPF e valor são obrigatórios." }, { status: 400 });

  // SigiloPay espera valor em centavos (inteiro)
  const priceInCents = Math.round(amount * 100);

  const payload = {
    product: {
      name: campaign.name,
      externalId: `${campaign.slug}-${cpf.replace(/\D/g, "")}`,
      offer: {
        name: `Negociação — ${campaign.name}`,
        price: priceInCents,
        offerType: "NATIONAL",
        currency: "BRL",
        lang: "pt-BR",
      },
    },
    settings: {
      paymentMethods: ["PIX"],
      acceptedDocs: ["CPF"],
      thankYouPage: "",
      askForAddress: false,
      ...(campaign.primaryColor ? {
        colors: {
          primaryColor: campaign.primaryColor,
          purchaseButtonBackground: campaign.primaryColor,
        },
      } : {}),
    },
    customer: {
      name,
      document: cpf,
    },
  };

  const sigiloRes = await fetch("https://app.sigilopay.com.br/api/v1/gateway/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${campaign.sigilopayApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const sigiloData = await sigiloRes.json().catch(() => null);

  if (!sigiloRes.ok || !sigiloData?.checkoutUrl) {
    console.error("SigiloPay error:", sigiloData);
    return NextResponse.json({
      error: "Erro ao gerar link de pagamento. Tente novamente.",
      detail: sigiloData,
    }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: sigiloData.checkoutUrl });
}
