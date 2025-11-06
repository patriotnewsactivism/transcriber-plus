"use client";

import React, { useMemo, useRef, useState } from "react";
import { useWaveSurfer } from "@/hooks/useWaveSurfer";
import type { Segment, Speaker } from "@/types/transcription";
import { secondsToHHMMSS } from "@/utils/time";
import clsx from "clsx";

type Props = { src: string; segments?: Segment[]; speakers?: Speaker[]; onSeek?: (time: number) => void; };

export const AudioPlayer: React.FC<Props> = ({ src, segments = [], speakers = [], onSeek }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(1);
  const ws = useWaveSurfer(containerRef, { url: src, segments, speakers, autoplay: false });

  const handlePlayPause = () => ws.playPause();
  const handleSeek = (t: number) => { ws.seekTo(t); onSeek?.(t); };
  const totalText = useMemo(() => (segments.length ? segments.map(s => s.text).join(" ") : ""), [segments]);

  return (
    <div className="flex flex-col gap-3">
      <div ref={containerRef} className="w-full rounded-xl border p-2" style={{ userSelect: "none" }} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={handlePlayPause} disabled={!ws.isReady} className="rounded px-3 py-1 border" aria-label="Play/Pause">
          {ws.isPlaying ? "Pause" : "Play"}
        </button>
        <div className="text-sm tabular-nums">{secondsToHHMMSS(ws.currentTime)} / {secondsToHHMMSS(ws.duration)}</div>
        <label className="ml-auto flex items-center gap-2 text-sm">Vol
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => { const v = Number(e.target.value); setVolume(v); ws.setVolume(v); }} />
        </label>
      </div>
      {segments.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="text-xs opacity-70">Segments</div>
          <ul className="max-h-56 overflow-y-auto pr-1">
            {segments.map((s) => {
              const active = ws.activeRegionId === s.id;
              const label = speakers.find(sp => sp.id === s.speakerId)?.label ?? "—";
              return (
                <li key={s.id} className={clsx("flex gap-3 items-start rounded px-2 py-1 cursor-pointer", active ? "bg-blue-50" : "hover:bg-neutral-50")} onClick={() => handleSeek(s.start)}>
                  <span className="text-xs shrink-0 tabular-nums">{secondsToHHMMSS(s.start)}</span>
                  <span className="text-sm leading-5 flex-1">{s.text}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border shrink-0">{label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {totalText && <textarea readOnly className="sr-only" aria-hidden value={totalText} />}
    </div>
  );
};
