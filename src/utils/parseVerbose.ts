import { z } from "zod";
import type { Transcript, Segment } from "@/types/transcription";

const WordZ = z.object({ start: z.number(), end: z.number(), word: z.string().optional(), text: z.string().optional() });
const SegmentZ = z.object({ id: z.union([z.number(), z.string()]).optional(), start: z.number(), end: z.number(), text: z.string(), words: z.array(WordZ).optional() });
const VerboseZ = z.object({ text: z.string().optional(), language: z.string().optional(), duration: z.number().optional(), segments: z.array(SegmentZ) });

export function parseVerboseJSON(input: unknown): Transcript {
  const p = VerboseZ.parse(input);
  const segments: Segment[] = p.segments.map((s, i) => ({
    id: String(s.id ?? i),
    start: s.start, end: s.end, text: s.text.trim(),
    words: s.words?.map(w => ({ start: w.start, end: w.end, text: (w.text ?? w.word ?? "").trim() }))
  }));
  return { text: p.text, language: p.language, duration: p.duration, segments };
}
