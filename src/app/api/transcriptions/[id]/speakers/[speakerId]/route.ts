import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string, speakerId: string } };

const PatchZ3 = z.object({ label: z.string().optional(), color: z.string().optional() });

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const data = PatchZ3.parse(await req.json());
  const s = await prisma.speaker.update({ where: { id: params.speakerId }, data });
  return NextResponse.json(s);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  await prisma.speaker.delete({ where: { id: params.speakerId } });
  return new NextResponse(null, { status: 204 });
}
