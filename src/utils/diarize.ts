import { z } from "zod";
import type { Transcript, Speaker } from "@/types/transcription";
import { colorForIndex, defaultLabel } from "./speakers";

export type Provider = "pyannote" | "http" | "none";

const DiarResZ = z.object({
  speakers: z.array(z.object({ label: z.string().optional(), color: z.string().optional() })).min(1),
  assignments: z.array(z.object({ segmentId: z.string(), speakerIndex: z.number().nonnegative() })),
  confidences: z.record(z.string(), z.number()).optional()
});

export async function diarizeSegments(
  transcript: Transcript,
  mediaUrl: string,
  provider: Provider
): Promise<{ speakers: Speaker[]; segToSpeakerIdx: Record<string, number>; conf: Record<string, number> }> {
  if (provider === "pyannote" || provider === "http") {
    const url = process.env.DIARIZATION_API_URL;
    if (!url) throw new Error("DIARIZATION_API_URL not set");
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mediaUrl, segments: transcript.segments })
    });
    if (!res.ok) throw new Error(`Diarization provider failed ${res.status}`);
    const parsed = DiarResZ.parse(await res.json());
    const speakers: Speaker[] = parsed.speakers.map((s, i) => ({
      id: String(i),
      label: s.label?.trim() || defaultLabel(i),
      color: s.color || colorForIndex(i)
    }));
    const segToSpeakerIdx: Record<string, number> = {};
    parsed.assignments.forEach(a => { segToSpeakerIdx[a.segmentId] = a.speakerIndex; });
    return { speakers, segToSpeakerIdx, conf: parsed.confidences ?? {} };
  }

  // Heuristic fallback
  let idx = 0;
  const segs = [...transcript.segments].sort((a, b) => a.start - b.start);
  const speakers: Speaker[] = [0, 1].map(i => ({ id: String(i), label: defaultLabel(i), color: colorForIndex(i) }));
  const segToSpeakerIdx: Record<string, number> = {};
  const conf: Record<string, number> = {};
  let lastEnd = segs[0]?.start ?? 0;
  for (const s of segs) {
    const gap = s.start - lastEnd;
    if (gap > 0.8) idx = (idx + 1) % 2;
    segToSpeakerIdx[s.id] = idx;
    conf[s.id] = Math.max(0.5, Math.min(0.9, 1 - Math.abs(gap - 0.8)));
    lastEnd = s.end;
  }
  return { speakers, segToSpeakerIdx, conf };
}
