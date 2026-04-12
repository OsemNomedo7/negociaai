import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  // SigiloPay envia o token de validação no body
  const devSettings = await prisma.devSettings.findUnique({ where: { id: 1 } });
  const storedSecret = devSettings?.planWebhookSecret || process.env.PLAN_WEBHOOK_SECRET || "";
  if (storedSecret && body.token !== storedSecret)
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  // Só processa pagamento confirmado
  if (body.event !== "TRANSACTION_PAID")
    return NextResponse.json({ ok: true, processed: false, reason: `Evento ${body.event} ignorado.` });

  // Email do comprador
  const email: string | null = body.client?.email ?? null;
  if (!email) return NextResponse.json({ error: "E-mail não encontrado no payload." }, { status: 400 });

  // Produto comprado — identifica qual plano pelo sigilopayProductId
  const sigilopayProductId: string | null = body.orderItems?.[0]?.product?.id ?? null;
  if (!sigilopayProductId)
    return NextResponse.json({ error: "Produto não identificado no payload." }, { status: 400 });

  const plan = await prisma.plan.findFirst({ where: { sigilopayProductId } });
  if (!plan)
    return NextResponse.json({
      error: `Nenhum plano mapeado para o produto SigiloPay "${sigilopayProductId}". Configure o ID do produto no painel DEV > Planos.`,
    }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user)
    return NextResponse.json({ error: `Usuário "${email}" não encontrado.` }, { status: 404 });

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
