export type Word = { start: number; end: number; text: string; speakerId?: string | null; };
export type Segment = { id: string; start: number; end: number; text: string; speakerId?: string | null; diarConf?: number | null; words?: Word[]; };
export type Speaker = { id: string; label: string; color: string; };
export type Transcript = { id?: string; language?: string | null; duration?: number | null; text?: string; segments: Segment[]; speakers?: Speaker[]; };
