import type { Transcript } from "@/types/transcription";
import { secondsToTimestamp } from "@/utils/time";

export const toSRT = (t: Transcript): string =>
  t.segments.map((seg, i) => {
    const start = secondsToTimestamp(seg.start);
    const end = secondsToTimestamp(seg.end);
    const label = t.speakers?.find(s => s.id === seg.speakerId)?.label;
    const prefix = label ? `[${label}] ` : "";
    return `${i + 1}\n${start} --> ${end}\n${prefix}${seg.text.trim()}\n`;
  }).join("\n");

export const toVTT = (t: Transcript): string => {
  const header = "WEBVTT\n\n";
  const body = t.segments.map(seg => {
    const start = secondsToTimestamp(seg.start).replace(",", ".");
    const end = secondsToTimestamp(seg.end).replace(",", ".");
    const label = t.speakers?.find(s => s.id === seg.speakerId)?.label;
    const prefix = label ? `[${label}] ` : "";
    return `${start} --> ${end}\n${prefix}${seg.text.trim()}\n`;
  }).join("\n");
  return header + body;
};
