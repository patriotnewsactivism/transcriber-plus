"use client";

import React, { useEffect, useState } from "react";
import { AudioPlayer } from "@/components/AudioPlayer";
import { TranscriptionResult } from "@/components/TranscriptionResult";
import { SpeakerManager } from "@/components/SpeakerManager";
import type { Transcript } from "@/types/transcription";

const demoVerbose = {
  language: "en",
  duration: 8.1,
  segments: [
    { id: 0, start: 0.0, end: 2.25, text: "Hello and welcome", words: [{ start: 0.0, end: 0.4, text: "Hello" }, { start: 0.5, end: 0.8, text: "and" }, { start: 0.9, end: 2.25, text: "welcome" }] },
    { id: 1, start: 2.25, end: 5.7, text: "This is a premium transcriber.", words: [{ start: 2.3, end: 2.6, text: "This" }, { start: 2.7, end: 2.9, text: "is" }, { start: 3.0, end: 3.2, text: "a" }, { start: 3.3, end: 5.7, text: "premium transcriber." }] },
    { id: 2, start: 5.7, end: 8.1, text: "With waveform segments." }
  ]
};

export default function Page() {
  const [mediaUrl] = useState<string>("/sample.mp3");
  const [transcript, setTranscript] = useState<Transcript | null>(null);

  const fetchTranscript = async (id: string) => {
    const res = await fetch(`/api/transcriptions/${id}`);
    const json = await res.json();
    const t: Transcript = {
      id: json.id,
      language: json.language,
      text: json.text,
      segments: json.segments.map((s: any) => ({ id: s.id, start: s.start, end: s.end, text: s.text, speakerId: s.speakerId ?? null, diarConf: s.diarConf ?? null, words: s.words?.map((w: any) => ({ start: w.start, end: w.end, text: w.text, speakerId: w.speakerId ?? null })) })),
      speakers: json.speakers.map((sp: any) => ({ id: sp.id, label: sp.label, color: sp.color }))
    };
    setTranscript(t);
  };

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/transcriptions", {
        method: "POST",
        headers: { "content-type":"application/json" },
        body: JSON.stringify({ mediaUrl, duration: 8.1, verbose_json: demoVerbose, diarize: true })
      });
      const json = await res.json();
      await fetchTranscript(json.id);
    })();
  }, [mediaUrl]);

  const handleSpeakerChange = async (segmentId: string, speakerId: string | null) => {
    if (!transcript?.id) return;
    await fetch(`/api/transcriptions/${transcript.id}/segments/${segmentId}`, { method: "PATCH", headers: { "content-type":"application/json" }, body: JSON.stringify({ speakerId }) });
    await fetchTranscript(transcript.id);
  };
  const handleBatchAssign = async (segmentIds: string[], speakerId: string | null) => {
    if (!transcript?.id || !segmentIds.length) return;
    await fetch(`/api/transcriptions/${transcript.id}/segments/batch`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ segmentIds, speakerId })
    });
    await fetchTranscript(transcript.id);
  };

  if (!transcript) return <main className="p-6">Loading…</main>;

  return (
    <main className="p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Premium Transcriber — Diarization</h1>
      <AudioPlayer src={mediaUrl} segments={transcript.segments} speakers={transcript.speakers} />
      <SpeakerManager transcriptId={transcript.id!} speakers={transcript.speakers ?? []} onChanged={() => fetchTranscript(transcript.id!)} />
      <TranscriptionResult
        transcript={transcript}
        onJump={(t) => console.info("Seek:", t)}
        onSpeakerChange={handleSpeakerChange}
        onBatchAssign={handleBatchAssign}
      />
    </main>
  );
}
