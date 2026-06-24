export type Video = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  duration_minutes: number | null;
  playback_url: string;
  thumbnail_url: string | null;
  is_published: boolean;
  sort_order: number;
};

export type ProgressByVideo = Record<string, boolean>;
