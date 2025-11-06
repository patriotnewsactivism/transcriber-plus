import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

const PatchZ = z.object({ segmentIds: z.array(z.string()).min(1), speakerId: z.string().nullable() });

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { segmentIds, speakerId } = PatchZ.parse(await req.json());
  await prisma.segment.updateMany({ where: { id: { in: segmentIds }, transcriptId: params.id }, data: { speakerId } });
  await prisma.word.updateMany({ where: { segmentId: { in: segmentIds } }, data: { speakerId } });
  const updated = await prisma.segment.findMany({ where: { id: { in: segmentIds } } });
  return NextResponse.json(updated);
}
