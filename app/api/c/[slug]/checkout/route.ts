import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const SIGILO_BASE = "https://app.sigilopay.com.br/api/v1";

async function getSigilopayToken(clientId: string, clientSecret: string): Promise<{ token: string | null; debug: unknown }> {
  const attempts: unknown[] = [];

  // Tentativa 1: POST JSON com grant_type
  try {
    const res = await fetch(`${SIGILO_BASE}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: "client_credentials" }),
    });
    const data = await res.json().catch(() => null);
    attempts.push({ try: 1, url: `${SIGILO_BASE}/oauth/token`, status: res.status, data });
    if (data?.access_token) return { token: data.access_token, debug: attempts };
  } catch (e) { attempts.push({ try: 1, error: String(e) }); }

  // Tentativa 2: POST form-urlencoded com Basic auth
  try {
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const res = await fetch(`${SIGILO_BASE}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": `Basic ${basic}` },
      body: "grant_type=client_credentials",
    });
    const data = await res.json().catch(() => null);
    attempts.push({ try: 2, url: `${SIGILO_BASE}/oauth/token`, status: res.status, data });
    if (data?.access_token) return { token: data.access_token, debug: attempts };
  } catch (e) { attempts.push({ try: 2, error: String(e) }); }

  // Tentativa 3: /auth/token
  try {
    const res = await fetch(`${SIGILO_BASE}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret }),
    });
    const data = await res.json().catch(() => null);
    attempts.push({ try: 3, url: `${SIGILO_BASE}/auth/token`, status: res.status, data });
    if (data?.access_token) return { token: data.access_token, debug: attempts };
  } catch (e) { attempts.push({ try: 3, error: String(e) }); }

  return { token: null, debug: attempts };
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

  const { token, debug: authDebug } = await getSigilopayToken(campaign.sigilopayClientId, campaign.sigilopayClientSecret);

  if (!token) {
    return NextResponse.json({
      error: "Falha na autenticação com SigiloPay.",
      authDebug,
    }, { status: 502 });
  }

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

  const sigiloRes = await fetch(`${SIGILO_BASE}/gateway/checkout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const sigiloData = await sigiloRes.json().catch(() => null);

  if (!sigiloRes.ok || !sigiloData?.checkoutUrl) {
    return NextResponse.json({
      error: "Erro ao gerar link de pagamento.",
      checkoutError: sigiloData,
      checkoutStatus: sigiloRes.status,
    }, { status: 502 });
  }

  return NextResponse.json({ checkoutUrl: sigiloData.checkoutUrl });
}
