import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

const PostZ2 = z.object({ label: z.string().min(1), color: z.string().optional() });

export async function POST(req: NextRequest, { params }: Ctx) {
  const { label, color } = PostZ2.parse(await req.json());
  const s = await prisma.speaker.create({ data: { transcriptId: params.id, label, color: color ?? "#2563eb33" } });
  return NextResponse.json(s);
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const speakers = await prisma.speaker.findMany({ where: { transcriptId: params.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json(speakers);
}
