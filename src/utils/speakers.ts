export const SPEAKER_COLORS = [
  "#2563eb33", "#16a34a33", "#f59e0b33", "#ef444433",
  "#7c3aed33", "#0ea5e933", "#f9731633", "#22c55e33", "#e11d4833"
];

export function colorForIndex(i: number) { return SPEAKER_COLORS[i % SPEAKER_COLORS.length]; }
export function defaultLabel(i: number) { return `Speaker ${i + 1}`; }
