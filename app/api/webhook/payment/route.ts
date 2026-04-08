import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Extrai CPF de diferentes formatos de payload (Mercado Pago, PushinPay, PagHiper, genérico)
function extractCPF(body: Record<string, unknown>): string | null {
  const candidates = [
    body.cpf,
    body.document,
    body.payer_cpf,
    ((body.payer as Record<string, unknown>)?.identification as Record<string, unknown>)?.number,
    (body.payer as Record<string, unknown>)?.document,
    (body.customer as Record<string, unknown>)?.document,
    (body.customer as Record<string, unknown>)?.cpf,
    body.buyer_document,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.replace(/\D/g, "").length >= 11) {
      return c.replace(/\D/g, "").slice(0, 11);
    }
  }
  return null;
}

function extractStatus(body: Record<string, unknown>): string {
  const raw = (body.status ?? body.payment_status ?? body.situation ?? "") as string;
  return raw.toString().toLowerCase();
}

const PAID_STATUSES = ["approved", "paid", "pago", "concluido", "completed", "succeeded", "active"];

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Valida secret via query param ou header
  const { searchParams } = new URL(req.url);
  const secretParam = searchParams.get("secret") || req.headers.get("x-webhook-secret") || "";

  const settings = await prisma.$queryRaw<{ webhookSecret: string }[]>`
    SELECT webhookSecret FROM Settings WHERE id = 1
  `;
  const storedSecret = settings[0]?.webhookSecret ?? "";

  if (storedSecret && storedSecret !== secretParam) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Payload inválido." }, { status: 400 });

  const status = extractStatus(body);
  const isPaid = PAID_STATUSES.some(s => status.includes(s));

  if (!isPaid) {
    // Evento recebido mas não é pagamento confirmado — apenas confirma recebimento
    return NextResponse.json({ ok: true, processed: false, reason: `status '${status}' não é pagamento confirmado` });
  }

  const cpf = extractCPF(body);
  if (!cpf) {
    return NextResponse.json({ error: "CPF não encontrado no payload." }, { status: 422 });
  }

  // Busca devedor pelo CPF (sem filtro de campanha, busca o primeiro encontrado)
  const debtor = await prisma.debtor.findFirst({ where: { cpf } });

  // Registra evento mesmo se o devedor não estiver na base
  await prisma.log.create({
    data: {
      name:    debtor?.name ?? (body.payer_name as string) ?? "Desconhecido",
      cpf,
      event:   "PAGAMENTO_CONCLUIDO",
      ip,
      debtorId: debtor?.id ?? null,
    },
  });

  // Atualiza status do devedor para PAGO
  if (debtor && debtor.status !== "PAGO") {
    await prisma.debtor.update({
      where: { id: debtor.id },
      data:  { status: "PAGO" },
    });
  }

  return NextResponse.json({ ok: true, processed: true, cpf, debtorFound: !!debtor });
}

// Permite verificação do endpoint por alguns provedores (GET de handshake)
export async function GET() {
  return NextResponse.json({ ok: true, service: "NegociAI Webhook" });
}
