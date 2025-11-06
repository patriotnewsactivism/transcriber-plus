import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Segment, Speaker } from "@/types/transcription";

function colorFor(speakers: Speaker[] | undefined, speakerId?: string | null) {
  if (!speakers?.length || !speakerId) return "rgba(0,0,0,0.08)";
  return speakers.find(s => s.id === speakerId)?.color ?? "rgba(0,0,0,0.08)";
}

type UseWaveSurferOpts = { url: string; segments?: Segment[]; speakers?: Speaker[]; autoplay?: boolean; };

export function useWaveSurfer(
  containerRef: React.RefObject<HTMLElement>,
  { url, segments = [], speakers = [], autoplay = false }: UseWaveSurferOpts
) {
  const wsRef = useRef<any>(null);
  const regionsRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!containerRef.current) return;
    const WaveSurfer = (await import("wavesurfer.js")).default;
    const Regions = (await import("wavesurfer.js/dist/plugins/regions.esm.js")).default;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url,
      autoplay,
      height: 96,
      minPxPerSec: 60,
      interact: true
    });
    const regions = ws.registerPlugin(Regions.create({ dragSelection: false }));

    wsRef.current = ws;
    regionsRef.current = regions;

    ws.on("ready", () => { setIsReady(true); setDuration(ws.getDuration() ?? 0); });
    ws.on("play", () => setIsPlaying(true));
    ws.on("pause", () => setIsPlaying(false));
    ws.on("timeupdate", (t: number) => {
      setCurrentTime(t);
      const found = segments.find(s => t >= s.start && t < s.end);
      setActiveRegionId(found?.id ?? null);
    });

    segments.forEach(s => regions.addRegion({ id: s.id, start: s.start, end: s.end, drag: false, resize: false, color: colorFor(speakers, s.speakerId) }));

    regions.on("click", (r: any, e: MouseEvent) => { e.stopPropagation(); ws.setTime(r.start); ws.play(); });

    return () => {
      try { ws.destroy(); } catch {}
      wsRef.current = null;
      regionsRef.current = null;
      setIsReady(false);
    };
  }, [autoplay, containerRef, segments, speakers, url]);

  useEffect(() => {
    let cleanup: any;
    (async () => {
      cleanup = await load();
    })();
    return () => { if (typeof cleanup === "function") cleanup(); };
  }, [load]);

  useEffect(() => {
    const regions = regionsRef.current;
    if (!regions) return;
    regions.getRegions().forEach((r: any) => r.remove());
    segments.forEach(s => regions.addRegion({ id: s.id, start: s.start, end: s.end, drag: false, resize: false, color: colorFor(speakers, s.speakerId) }));
  }, [segments, speakers]);

  const api = useMemo(() => ({
    play: () => wsRef.current?.play(),
    pause: () => wsRef.current?.pause(),
    playPause: () => wsRef.current?.playPause(),
    seekTo: (t: number) => wsRef.current?.setTime(t),
    setVolume: (v: number) => wsRef.current?.setVolume?.(v),
    getInstance: () => wsRef.current as any,
    isReady,
    isPlaying,
    currentTime,
    duration,
    activeRegionId
  }), [currentTime, duration, isPlaying, isReady, activeRegionId]);

  return api;
}
