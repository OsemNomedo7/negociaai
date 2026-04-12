import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function extractEmail(body: Record<string, unknown>): string | null {
  const candidates = [
    body.email,
    (body.customer as Record<string, unknown>)?.email,
    (body.buyer as Record<string, unknown>)?.email,
    (body.payer as Record<string, unknown>)?.email,
    (body.client as Record<string, unknown>)?.email,
    (body.data as Record<string, unknown>)?.email,
    ((body.data as Record<string, unknown>)?.customer as Record<string, unknown>)?.email,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.includes("@")) return c.toLowerCase();
  }
  return null;
}

function isPaid(body: Record<string, unknown>): boolean {
  const raw = (
    body.status ??
    body.payment_status ??
    (body.data as Record<string, unknown>)?.status ??
    (body.transaction as Record<string, unknown>)?.status ??
    ""
  ) as string;
  const status = raw.toString().toLowerCase();
  const PAID = ["approved", "paid", "pago", "completed", "succeeded", "active", "concluido", "captured"];
  return PAID.some(s => status.includes(s));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { planId: string } }
) {
  const planId = parseInt(params.planId);
  if (isNaN(planId) || planId <= 0)
    return NextResponse.json({ error: "planId inválido." }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  // Valida secret
  const devSettings = await prisma.devSettings.findUnique({ where: { id: 1 } });
  const storedSecret = devSettings?.planWebhookSecret || process.env.PLAN_WEBHOOK_SECRET || "";
  const url = new URL(req.url);
  const sentSecret =
    body.secret ??
    url.searchParams.get("secret") ??
    req.headers.get("x-webhook-secret") ??
    "";
  if (storedSecret && sentSecret !== storedSecret)
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  // Ignora eventos que não são pagamento confirmado
  const hasStatus = body.status || body.payment_status ||
    (body.data as Record<string, unknown>)?.status ||
    (body.transaction as Record<string, unknown>)?.status;
  if (hasStatus && !isPaid(body))
    return NextResponse.json({ ok: true, processed: false, reason: "Evento não é pagamento confirmado." });

  const email = extractEmail(body);
  if (!email)
    return NextResponse.json({ error: "E-mail não encontrado no payload.", received: body }, { status: 400 });

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: `Plano ${planId} não encontrado.` }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: `Usuário "${email}" não encontrado.` }, { status: 404 });

  const now = new Date();
  const planExpiresAt = plan.durationDays === 0
    ? new Date("2099-12-31T23:59:59Z")
    : (() => {
        const base = user.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now;
        return new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
      })();

  await prisma.user.update({
    where: { id: user.id },
    data: { planId: plan.id, planExpiresAt, active: true },
  });

  await prisma.planPayment.create({
    data: { userId: user.id, planId: plan.id, amount: plan.price },
  });

  return NextResponse.json({
    ok: true,
    user: { name: user.name, email: user.email },
    plan: { name: plan.name, durationDays: plan.durationDays },
    planExpiresAt,
  });
}
