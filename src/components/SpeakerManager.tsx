"use client";

import React, { useState } from "react";
import type { Speaker } from "@/types/transcription";

type Props = {
  transcriptId: string;
  speakers: Speaker[];
  onChanged: () => void;
};

export const SpeakerManager: React.FC<Props> = ({ transcriptId, speakers, onChanged }) => {
  const [mergeFrom, setMergeFrom] = useState<string>("");
  const [mergeInto, setMergeInto] = useState<string>("");

  const updateSpeaker = async (s: Speaker) => {
    await fetch(`/api/transcriptions/${transcriptId}/speakers/${s.id}`, {
      method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ label: s.label, color: s.color })
    });
    onChanged();
  };

  const createSpeaker = async () => {
    const label = prompt("New speaker label?");
    if (!label) return;
    await fetch(`/api/transcriptions/${transcriptId}/speakers`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label })
    });
    onChanged();
  };

  const merge = async () => {
    if (!mergeFrom || !mergeInto) return;
    await fetch(`/api/transcriptions/${transcriptId}/speakers/merge`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fromId: mergeFrom, intoId: mergeInto })
    });
    setMergeFrom(""); setMergeInto(""); onChanged();
  };

  return (
    <div className="rounded border p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Speakers</h3>
        <button className="text-sm underline" onClick={createSpeaker}>+ Add</button>
      </div>
      <div className="flex flex-col gap-2">
        {speakers.map((s) => (
          <div key={s.id} className="flex gap-2 items-center">
            <input
              className="text-sm border rounded px-2 py-1"
              value={s.label}
              onChange={(e) => updateSpeaker({ ...s, label: e.target.value })}
            />
            <input
              className="h-8 w-8 p-0 border rounded"
              type="color"
              value={s.color.replace(/33$/, "")}
              onChange={(e) => updateSpeaker({ ...s, color: e.target.value + "33" })}
              title="Color"
            />
            <span className="text-xs px-2 py-1 rounded border" style={{ background: s.color }}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 items-center">
        <select className="border rounded px-2 py-1 text-sm" value={mergeFrom} onChange={(e)=>setMergeFrom(e.target.value)}>
          <option value="">Merge from…</option>
          {speakers.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select className="border rounded px-2 py-1 text-sm" value={mergeInto} onChange={(e)=>setMergeInto(e.target.value)}>
          <option value="">into…</option>
          {speakers.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button className="text-sm rounded border px-3 py-1" onClick={merge}>Merge</button>
      </div>
      <p className="text-[11px] opacity-70">Tip: merge reassigns segments & words, then deletes the source.</p>
    </div>
  );
};
