export const VIDEO_CATEGORIES = ["Replay", "Tuto"] as const;

export type VideoCategory = (typeof VIDEO_CATEGORIES)[number];
