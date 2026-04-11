import { NextRequest, NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/auth";

const VERCEL_TOKEN = process.env.VERCEL_TOKEN!;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID!;
const BASE = "https://api.vercel.com";

// POST /api/admin/domain — adiciona domínio no projeto Vercel
export async function POST(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { domain } = await req.json().catch(() => ({}));
  if (!domain) return NextResponse.json({ error: "Domínio obrigatório." }, { status: 400 });

  const res = await fetch(`${BASE}/v10/projects/${VERCEL_PROJECT_ID}/domains`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: domain }),
  });

  const data = await res.json();

  if (!res.ok && data.error?.code !== "domain_already_in_use") {
    return NextResponse.json({ error: data.error?.message || "Erro ao adicionar domínio." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// GET /api/admin/domain?domain=xxx — checa status DNS/SSL do domínio
export async function GET(req: NextRequest) {
  const admin = await getAdminFromRequest(req);
  if (!admin) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const domain = req.nextUrl.searchParams.get("domain");
  if (!domain) return NextResponse.json({ error: "Domínio obrigatório." }, { status: 400 });

  // Busca status do domínio no projeto
  const [domainRes, configRes] = await Promise.all([
    fetch(`${BASE}/v10/projects/${VERCEL_PROJECT_ID}/domains/${domain}`, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    }),
    fetch(`${BASE}/v6/domains/${domain}/config`, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    }),
  ]);

  const domainData = await domainRes.json();
  const configData = configRes.ok ? await configRes.json() : {};

  const registered = domainRes.ok && !domainData.error;
  const verified = domainData.verified === true;
  const dnsConfigured = configData.misconfigured === false;
  const sslReady = domainData.ssl?.state === "issued";

  return NextResponse.json({
    registered,
    verified,
    dnsConfigured,
    sslReady,
    active: verified && dnsConfigured && sslReady,
    raw: { domain: domainData, config: configData },
  });
}
