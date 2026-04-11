import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

async function getSigilopayToken(clientId: string, clientSecret: string): Promise<string | null> {
  try {
    const res = await fetch("https://app.sigilopay.com.br/api/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
    });
    const data = await res.json().catch(() => null);
    if (data?.access_token) return data.access_token;

    // Fallback: Basic auth
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res2 = await fetch("https://app.sigilopay.com.br/api/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${basic}`,
      },
      body: "grant_type=client_credentials",
    });
    const data2 = await res2.json().catch(() => null);
    return data2?.access_token ?? null;
  } catch { return null; }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const campaign = await prisma.campaign.findUnique({ where: { slug: params.slug } });
  if (!campaign || !campaign.active)
    return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });

  if (!campaign.sigilopayClientId || !campaign.sigilopayClientSecret)
    return NextResponse.json({ error: "Integração SigiloPay não configurada nesta campanha." }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, cpf, amount } = body as { name?: string; cpf?: string; amount?: number };
  if (!name || !cpf || !amount || amount <= 0)
    return NextResponse.json({ error: "Nome, CPF e valor são obrigatórios." }, { status: 400 });

  // Obtém o token de acesso
  const token = await getSigilopayToken(campaign.sigilopayClientId, campaign.sigilopayClientSecret);
  if (!token)
    return NextResponse.json({ error: "Falha na autenticação com SigiloPay. Verifique as credenciais." }, { status: 502 });

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
    customer: { name, document: cpf },
  };

  const sigiloRes = await fetch("https://app.sigilopay.com.br/api/v1/gateway/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const sigiloData = await sigiloRes.json().catch(() => null);

  if (!sigiloRes.ok || !sigiloData?.checkoutUrl) {
    console.error("SigiloPay checkout error:", sigiloData);
    return NextResponse.json({ error: "Erro ao gerar link de pagamento.", detail: sigiloData }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: sigiloData.checkoutUrl });
}
