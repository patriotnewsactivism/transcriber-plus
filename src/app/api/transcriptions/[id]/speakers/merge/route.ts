import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

type Ctx = { params: { id: string } };

const MergeZ = z.object({ fromId: z.string(), intoId: z.string() });

export async function POST(req: NextRequest, { params }: Ctx) {
  const { fromId, intoId } = MergeZ.parse(await req.json());
  if (fromId === intoId) return new NextResponse("Same IDs", { status: 400 });
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.segment.updateMany({ where: { transcriptId: params.id, speakerId: fromId }, data: { speakerId: intoId } });
    await tx.word.updateMany({ where: { speakerId: fromId }, data: { speakerId: intoId } });
    await tx.speaker.delete({ where: { id: fromId } });
  });
  return NextResponse.json({ ok: true });
}
