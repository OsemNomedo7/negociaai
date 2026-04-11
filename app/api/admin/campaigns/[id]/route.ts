import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTenantFromRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const userId = tenant.userId as number;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { _count: { select: { debtors: true, logs: true } } },
  });

  if (!campaign) return NextResponse.json({ error: "Campanha não encontrada." }, { status: 404 });

  const consults = await prisma.log.count({ where: { campaignId: id, event: "CONSULTA" } });
  const payments = await prisma.log.count({ where: { campaignId: id, event: "PAGAMENTO_CONCLUIDO" } });

  let bannerImages: string[] = [];
  try { bannerImages = JSON.parse(campaign.bannerImages || "[]"); } catch { /* noop */ }
  return NextResponse.json({ ...campaign, bannerImages, stats: { consults, payments } });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const userId = tenant.userId as number;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

  // If slug is being updated, validate it
  if (body.slug !== undefined) {
    const cleanSlug = String(body.slug).toLowerCase().trim();
    if (!/^[a-z0-9-]{3,}$/.test(cleanSlug)) {
      return NextResponse.json({
        error: "Slug deve ter pelo menos 3 caracteres e conter apenas letras minúsculas, números e hífens.",
      }, { status: 400 });
    }
    const existing = await prisma.campaign.findFirst({
      where: { slug: cleanSlug, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Slug já está em uso." }, { status: 409 });
    }
    body.slug = cleanSlug;
  }

  // Handle JSON fields serialization
  if (body.bannerImages !== undefined) {
    body.bannerImages = Array.isArray(body.bannerImages)
      ? JSON.stringify(body.bannerImages.slice(0, 5))
      : typeof body.bannerImages === "string" ? body.bannerImages : "[]";
  }
  if (body.pageContent !== undefined && typeof body.pageContent !== "string") {
    body.pageContent = JSON.stringify(body.pageContent);
  }
  if (body.colorScheme !== undefined && typeof body.colorScheme !== "string") {
    body.colorScheme = JSON.stringify(body.colorScheme);
  }

  // Strip readonly/computed fields that aren't Campaign columns
  const {
    id: _id, createdAt: _c, updatedAt: _u,
    _count: _cnt, stats: _st, debtors: _dbt, logs: _lg,
    ...updateData
  } = body;

  try {
    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
    });
    const { webhookSecret: _secret, sigilopayApiKey: _spk, ...publicData } = campaign;
    return NextResponse.json(publicData);
  } catch (err) {
    console.error("Campaign update error:", err);
    return NextResponse.json({ error: "Erro ao salvar campanha." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenant = await getTenantFromRequest(req);
  if (!tenant) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const userId = tenant.userId as number;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: "ID inválido." }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const hard = searchParams.get("hard") === "1";

  if (hard) {
    // Disassociate related records first
    await prisma.log.updateMany({ where: { campaignId: id }, data: { campaignId: null } });
    await prisma.debtor.updateMany({ where: { campaignId: id }, data: { campaignId: null } });
    await prisma.campaign.delete({ where: { id } });
  } else {
    await prisma.campaign.update({ where: { id }, data: { active: false } });
  }

  return NextResponse.json({ ok: true });
}
