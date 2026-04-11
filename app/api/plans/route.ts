import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    orderBy: { durationDays: "asc" },
  });
  return NextResponse.json(plans);
}
