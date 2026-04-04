import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false }, { status: 400 });

  const { name, cpf, event, debtorId } = body as {
    name?: string;
    cpf?: string;
    event?: string;
    debtorId?: number;
  };

  if (!name || !cpf || !event) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const validEvents = ["CLIQUE_PAGAMENTO", "PAGAMENTO_CONCLUIDO"];
  if (!validEvents.includes(event)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await prisma.log.create({
    data: {
      name,
      cpf,
      event,
      ip,
      debtorId: debtorId ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
