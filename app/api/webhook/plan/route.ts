import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Webhook chamado após pagamento de plano
// Espera: { email, planId, secret }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const secret = process.env.PLAN_WEBHOOK_SECRET;
  if (secret && body.secret !== secret)
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { email, planId } = body as { email?: string; planId?: number };
  if (!email || !planId)
    return NextResponse.json({ error: "email e planId obrigatórios." }, { status: 400 });

  const plan = await prisma.plan.findUnique({ where: { id: Number(planId) } });
  if (!plan) return NextResponse.json({ error: "Plano não encontrado." }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  const now = new Date();
  // Se já tem plano ativo, soma os dias ao prazo atual
  const base = user.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now;
  const planExpiresAt = new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { planId: plan.id, planExpiresAt },
  });

  return NextResponse.json({ ok: true, planExpiresAt });
}
