"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { Transcript } from "@/types/transcription";
import { secondsToHHMMSS } from "@/utils/time";
import { toSRT, toVTT } from "@/utils/exports";
import { SpeakerTag } from "@/components/SpeakerTag";

type Props = {
  transcript: Transcript;
  onJump?: (time: number) => void;
  onSpeakerChange?: (segmentId: string, speakerId: string | null) => void;
  onBatchAssign?: (segmentIds: string[], speakerId: string | null) => void;
};

export const TranscriptionResult: React.FC<Props> = ({ transcript, onJump, onSpeakerChange, onBatchAssign }) => {
  const [tab, setTab] = useState<"text" | "segments" | "exports">("segments");
  const srt = useMemo(() => toSRT(transcript), [transcript]);
  const vtt = useMemo(() => toVTT(transcript), [transcript]);
  const fullText = transcript.text ?? transcript.segments.map(s => s.text.trim()).join(" ").trim();

  const [selected, setSelected] = useState<string[]>([]);
  const [lastClicked, setLastClicked] = useState<string | null>(null);
  const isSelected = (id: string) => selected.includes(id);

  const toggle = (id: string, withRange = false) => {
    if (!withRange || !lastClicked) {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
      setLastClicked(id);
      return;
    }
    const ids = transcript.segments.map(s => s.id);
    const a = ids.indexOf(lastClicked);
    const b = ids.indexOf(id);
    if (a === -1 || b === -1) return;
    const [start, end] = a < b ? [a, b] : [b, a];
    const range = ids.slice(start, end + 1);
    const set = new Set(selected.concat(range));
    setSelected(Array.from(set));
    setLastClicked(id);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (tab !== "segments") return;
      const digits = ["1","2","3","4","5","6","7","8","9"];
      if (digits.includes(e.key)) {
        const idx = Number(e.key) - 1;
        const sp = transcript.speakers?.[idx];
        if (sp && selected.length) {
          onBatchAssign?.(selected, sp.id);
        }
      } else if (e.key.toLowerCase() === "u") {
        if (selected.length) onBatchAssign?.(selected, null);
      } else if (e.key === "Escape") {
        setSelected([]);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        const ids = transcript.segments.map(s => s.id);
        const anchor = lastClicked ?? ids[0];
        const idx = Math.max(0, ids.indexOf(anchor));
        const next = e.key === "ArrowDown" ? Math.min(idx + 1, ids.length - 1) : Math.max(idx - 1, 0);
        setSelected([ids[next]]); setLastClicked(ids[next]);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tab, transcript.speakers, transcript.segments, selected, lastClicked, onBatchAssign]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 items-center">
        {(["segments", "text", "exports"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-1 rounded border text-sm ${t === tab ? "bg-black text-white" : ""}`}>{t}</button>
        ))}
        {tab === "segments" && (
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span>Selected: {selected.length}</span>
            <div className="flex items-center gap-1">
              <span>Apply</span>
              <select className="border rounded px-1 py-0.5" onChange={(e)=>{ const sid = e.target.value || null; if (!sid && e.target.value !== "") return; if (selected.length) onBatchAssign?.(selected, sid); e.currentTarget.selectedIndex = 0; }}>
                <option value="">— choose —</option>
                {transcript.speakers?.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                <option value="">Unassign</option>
              </select>
            </div>
            <span className="opacity-60">Keys: 1–9 assign, U unassign, ↑/↓ navigate, Esc clear</span>
          </div>
        )}
      </div>

      {tab === "text" && (<div className="rounded border p-3 leading-7">{fullText}</div>)}

      {tab === "segments" && (
        <div className="rounded border divide-y">
          {transcript.segments.map((seg) => {
            const label = transcript.speakers?.find(s => s.id === seg.speakerId)?.label;
            const active = isSelected(seg.id);
            return (
              <div
                key={seg.id}
                className={`flex gap-3 p-2 items-start ${active ? "bg-blue-50" : ""}`}
                onClick={(e) => toggle(seg.id, e.shiftKey)}
              >
                <button className="text-xs px-2 py-1 rounded border shrink-0" onClick={(e)=>{ e.stopPropagation(); onJump?.(seg.start); }}>
                  {secondsToHHMMSS(seg.start)}
                </button>
                <div className="flex-1">
                  <div className="text-sm">{label ? `[${label}] ` : ""}{seg.text}</div>
                  {seg.words && seg.words.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 text-xs">
                      {seg.words.map((w, i) => (
                        <button key={`${seg.id}-w-${i}`} className="px-1 py-0.5 rounded border"
                          onClick={(e)=>{ e.stopPropagation(); onJump?.(w.start); }}>
                          {w.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <SpeakerTag speakers={transcript.speakers ?? []} value={seg.speakerId ?? null} onChange={(sid) => onSpeakerChange?.(seg.id, sid)} />
              </div>
            );
          })}
        </div>
      )}

      {tab === "exports" && (
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-sm mb-1">SRT</label>
            <textarea className="min-h-48 rounded border p-2 font-mono text-xs" readOnly value={srt} />
            <a download="transcript.srt" href={`data:text/plain;charset=utf-8,${encodeURIComponent(srt)}`} className="mt-2 text-sm underline">Download .srt</a>
          </div>
          <div className="flex flex-col">
            <label className="text-sm mb-1">WebVTT</label>
            <textarea className="min-h-48 rounded border p-2 font-mono text-xs" readOnly value={vtt} />
            <a download="transcript.vtt" href={`data:text/plain;charset=utf-8,${encodeURIComponent(vtt)}`} className="mt-2 text-sm underline">Download .vtt</a>
          </div>
        </div>
      )}
    </div>
  );
};
