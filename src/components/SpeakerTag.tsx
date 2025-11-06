"use client";

import React from "react";
import type { Speaker } from "@/types/transcription";

type Props = { speakers: Speaker[]; value?: string | null; onChange: (speakerId: string | null) => void; };

export const SpeakerTag: React.FC<Props> = ({ speakers, value, onChange }) => {
  return (
    <select className="text-xs px-1.5 py-1 rounded border bg-white" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">Unassigned</option>
      {speakers.map(s => (<option key={s.id} value={s.id}>{s.label}</option>))}
    </select>
  );
};
