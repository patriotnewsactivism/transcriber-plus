import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string; segmentId: string } };

const PatchZ = z.object({ speakerId: z.string().nullable() });

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { speakerId } = PatchZ.parse(await req.json());
  const seg = await prisma.segment.update({ where: { id: params.segmentId }, data: { speakerId } });
  await prisma.word.updateMany({ where: { segmentId: seg.id }, data: { speakerId } });
  return NextResponse.json(seg);
}
