import { describe, it, expect, beforeEach, vi } from "vitest";
import { diarizeSegments } from "@/utils/diarize";
import type { Transcript } from "@/types/transcription";

const base: Transcript = {
  segments: [
    { id: "a", start: 0, end: 1, text: "Hi" },
    { id: "b", start: 2, end: 3, text: "There" },
    { id: "c", start: 3.9, end: 4.5, text: "Friend" }
  ]
};

describe("diarizeSegments", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("pyannote provider maps speakers and assignments", async () => {
    process.env.DIARIZATION_API_URL = "http://example.com";
    // @ts-expect-error mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        speakers: [{ label: "Alice" }, { label: "Bob" }],
        assignments: [
          { segmentId: "a", speakerIndex: 0 },
          { segmentId: "b", speakerIndex: 1 },
          { segmentId: "c", speakerIndex: 1 }
        ],
        confidences: { a: 0.9, b: 0.8, c: 0.7 }
      })
    });

    const res = await diarizeSegments(base, "http://file", "pyannote");
    expect(res.speakers.length).toBe(2);
    expect(res.segToSpeakerIdx["a"]).toBe(0);
    expect(res.segToSpeakerIdx["b"]).toBe(1);
    expect(res.conf["c"]).toBeCloseTo(0.7);
  });

  it("generic http provider same contract", async () => {
    process.env.DIARIZATION_API_URL = "http://example.com";
    // @ts-expect-error mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        speakers: [{}, {}],
        assignments: [
          { segmentId: "a", speakerIndex: 1 },
          { segmentId: "b", speakerIndex: 1 },
          { segmentId: "c", speakerIndex: 0 }
        ]
      })
    });

    const res = await diarizeSegments(base, "http://file", "http");
    expect(Object.values(res.segToSpeakerIdx)).toEqual([1,1,0]);
  });

  it("fallback none returns alternating with confidences", async () => {
    const res = await diarizeSegments(base, "http://file", "none");
    expect(res.speakers.length).toBeGreaterThan(0);
    expect(res.segToSpeakerIdx["a"]).toBeTypeOf("number");
    expect(res.conf["a"]).toBeGreaterThan(0);
  });

  it("errors surface when provider fails", async () => {
    // @ts-expect-error mock fetch
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(diarizeSegments(base, "http://file", "pyannote")).rejects.toThrow();
  });
});
