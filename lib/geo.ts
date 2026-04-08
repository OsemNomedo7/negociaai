const isLocalIp = (ip: string) =>
  !ip ||
  ip === "unknown" ||
  ip === "::1" ||
  ip === "::ffff:127.0.0.1" ||
  ip.startsWith("127.") ||
  ip.startsWith("192.168.") ||
  ip.startsWith("10.") ||
  ip.startsWith("172.16.") ||
  ip.startsWith("172.17.") ||
  ip.startsWith("172.18.") ||
  ip.startsWith("172.19.") ||
  ip.startsWith("172.2") ||
  ip.startsWith("172.3");

async function lookupGeo(ip: string): Promise<{ city: string; state: string }> {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { city: "—", state: "—" };
    const data = await res.json() as { status?: string; city?: string; regionName?: string };
    if (data.status !== "success") return { city: "—", state: "—" };
    return { city: data.city || "—", state: data.regionName || "—" };
  } catch {
    return { city: "—", state: "—" };
  }
}

export async function getGeo(ip: string): Promise<{ resolvedIp: string; city: string; state: string }> {
  if (isLocalIp(ip)) {
    // Tenta descobrir o IP público real do servidor (útil em dev/localhost)
    try {
      const res = await fetch("http://ip-api.com/json/?fields=status,query,city,regionName", {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json() as { status?: string; query?: string; city?: string; regionName?: string };
        if (data.status === "success") {
          return {
            resolvedIp: data.query || ip,
            city: data.city || "—",
            state: data.regionName || "—",
          };
        }
      }
    } catch { /* silencioso */ }
    return { resolvedIp: ip, city: "Local", state: "Dev" };
  }

  const geo = await lookupGeo(ip);
  return { resolvedIp: ip, ...geo };
}
