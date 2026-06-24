import { Video } from "./types";

export const demoVideos: Video[] = [
  {
    id: "demo-1",
    title: "Bienvenue dans la formation",
    description: "Une introduction courte pour comprendre le parcours.",
    category: "Demarrage",
    duration_minutes: 4,
    playback_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnail_url: null,
    is_published: true,
    sort_order: 1
  },
  {
    id: "demo-2",
    title: "Les bases essentielles",
    description: "Les premiers concepts a maitriser avant de continuer.",
    category: "Fondamentaux",
    duration_minutes: 12,
    playback_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnail_url: null,
    is_published: true,
    sort_order: 2
  },
  {
    id: "demo-3",
    title: "Mise en pratique",
    description: "Un cas concret pour transformer la theorie en reflexe.",
    category: "Exercices",
    duration_minutes: 18,
    playback_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnail_url: null,
    is_published: true,
    sort_order: 3
  }
];
