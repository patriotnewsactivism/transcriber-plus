import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const t = await prisma.transcript.findUnique({
    where: { id: params.id },
    include: { speakers: true, segments: { include: { words: true }, orderBy: { start: "asc" } }, media: true }
  });
  if (!t) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(t);
}
