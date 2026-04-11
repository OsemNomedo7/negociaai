import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-key"
);

/* ── Generic ─────────────────────────────────────── */
export async function signToken(payload: Record<string, unknown>, expiresIn = "8h") {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

/* ── DEV admin (painel DEV) ──────────────────────── */
export async function getAdminFromRequest(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function isAuthenticated() {
  const cookieStore = cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return false;
  return !!(await verifyToken(token));
}

/* ── Tenant (painel admin por cliente) ───────────── */
export async function getTenantFromRequest(req: NextRequest) {
  const token = req.cookies.get("tenant_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function getTenantPlanActive(req: NextRequest): Promise<boolean> {
  const payload = await getTenantFromRequest(req);
  if (!payload) return false;
  const exp = payload.planExpiresAt as string | null;
  if (!exp) return false;
  return new Date(exp) > new Date();
}
