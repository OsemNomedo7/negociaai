import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getGeo } from "@/lib/geo";

const ALLOWED_EVENTS = ["CLIQUE_PAGAMENTO", "PAGAMENTO_CONCLUIDO"];

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const campaign = await prisma.campaign.findUnique({ where: { slug: params.slug } });
  if (!campaign || !campaign.active) {
    return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  const { name, cpf, event, debtorId } = body as {
    name?: string; cpf?: string; event?: string; debtorId?: number;
  };

  if (!name || !cpf || !event) {
    return NextResponse.json({ error: "Campos obrigatórios: name, cpf, event." }, { status: 400 });
  }
  if (!ALLOWED_EVENTS.includes(event)) {
    return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  }

  const geo = await getGeo(ip);

  await prisma.log.create({
    data: {
      name: name.trim(), cpf, event,
      ip: geo.resolvedIp, city: geo.city, state: geo.state,
      debtorId: debtorId || null, campaignId: campaign.id,
    },
  });

  return NextResponse.json({ ok: true });
}
