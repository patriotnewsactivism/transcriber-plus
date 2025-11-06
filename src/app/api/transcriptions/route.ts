import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseVerboseJSON } from "@/utils/parseVerbose";
import { diarizeSegments, type Provider } from "@/utils/diarize";
import { colorForIndex, defaultLabel } from "@/utils/speakers";

const PostZ = z.object({
  mediaUrl: z.string().url(),
  duration: z.number().optional(),
  verbose_json: z.any(),
  diarize: z.boolean().optional().default(true)
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mediaUrl, duration, verbose_json, diarize } = PostZ.parse(body);
  const parsed = parseVerboseJSON(verbose_json);

  const provider = (process.env.DIARIZATION_PROVIDER as Provider) || "none";
  let speakerDefs: { label: string; color: string }[] = [];
  let segIdx: Record<string, number> = {};
  let conf: Record<string, number> = {};

  if (diarize) {
    const d = await diarizeSegments(parsed, mediaUrl, provider);
    speakerDefs = d.speakers.map((s, i) => ({ label: s.label, color: s.color || colorForIndex(i) }));
    segIdx = d.segToSpeakerIdx;
    conf = d.conf;
  }

  const result = await prisma.$transaction(async (tx) => {
    const media = await tx.media.upsert({
      where: { url: mediaUrl },
      update: { duration: duration ?? parsed.duration ?? undefined },
      create: { url: mediaUrl, duration: duration ?? parsed.duration ?? null }
    });
    const tr = await tx.transcript.create({
      data: { mediaId: media.id, language: parsed.language ?? null, text: parsed.text ?? null }
    });

    const speakers = (speakerDefs.length ? speakerDefs :
      [0].map(i => ({ label: defaultLabel(i), color: colorForIndex(i) })));

    const createdSpeakers = await Promise.all(
      speakers.map(s => tx.speaker.create({ data: { transcriptId: tr.id, label: s.label, color: s.color } }))
    );

    for (const seg of parsed.segments) {
      const maybeIdx = segIdx[seg.id];
      const spId = Number.isFinite(maybeIdx) ? createdSpeakers[maybeIdx]?.id ?? null : null;
      const sRow = await tx.segment.create({
        data: {
          transcriptId: tr.id,
          start: seg.start, end: seg.end, text: seg.text,
          diarConf: conf[seg.id] ?? null,
          speakerId: spId
        }
      });
      if (seg.words?.length) {
        await tx.word.createMany({
          data: seg.words.map(w => ({
            segmentId: sRow.id, start: w.start, end: w.end, text: w.text, speakerId: spId
          }))
        });
      }
    }

    return tx.transcript.findUniqueOrThrow({
      where: { id: tr.id },
      include: { speakers: true, segments: { include: { words: true }, orderBy: { start: "asc" } }, media: true }
    });
  });

  return NextResponse.json(result);
}

export async function GET() {
  const rows = await prisma.transcript.findMany({
    orderBy: { createdAt: "desc" },
    include: { media: true, _count: { select: { segments: true } } }
  });
  return NextResponse.json(rows);
}
