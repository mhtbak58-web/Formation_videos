import { NativeModules, Platform } from "react-native";
import { Video } from "../types";

type AndroidAutoCatalogNativeModule = {
  publishCatalog(json: string): Promise<boolean>;
  clearCatalog(): Promise<boolean>;
};

const nativeModule = NativeModules.AndroidAutoCatalog as AndroidAutoCatalogNativeModule | undefined;

type AutoTrack = {
  id: string;
  title: string;
  subtitle: string | null;
  mediaUrl: string;
  artworkUrl: string | null;
};

type AutoCategory = {
  id: string;
  title: string;
  tracks: AutoTrack[];
};

function buildCatalog(videos: Video[]): { categories: AutoCategory[] } {
  const published = videos.filter((video) => video.is_published);

  const grouped = published.reduce<Record<string, Video[]>>((groups, video) => {
    const items = groups[video.category] ?? [];
    items.push(video);
    groups[video.category] = items;
    return groups;
  }, {});

  const categories = Object.entries(grouped).map(([category, items]) => ({
    id: category,
    title: category,
    tracks: items.map((video) => ({
      id: video.id,
      title: video.title,
      subtitle: video.description ?? null,
      mediaUrl: video.playback_url,
      artworkUrl: video.thumbnail_url ?? null
    }))
  }));

  return { categories };
}

/**
 * Sends the current video catalog to the native Android Auto media
 * service so it shows up as a browsable tree on the car screen. Audio
 * is extracted from the same `playback_url` used for normal in-app
 * playback (Android Auto cannot show video while driving, so the
 * native service plays the track's audio only).
 *
 * No-op on platforms other than Android, and safe to call even if the
 * native module hasn't been built yet (e.g. running in Expo Go).
 */
export async function publishAndroidAutoCatalog(videos: Video[]): Promise<void> {
  if (Platform.OS !== "android" || !nativeModule) {
    return;
  }

  try {
    await nativeModule.publishCatalog(JSON.stringify(buildCatalog(videos)));
  } catch (error) {
    console.warn("AndroidAutoCatalog: failed to publish catalog", error);
  }
}

export async function clearAndroidAutoCatalog(): Promise<void> {
  if (Platform.OS !== "android" || !nativeModule) {
    return;
  }

  try {
    await nativeModule.clearCatalog();
  } catch (error) {
    console.warn("AndroidAutoCatalog: failed to clear catalog", error);
  }
}
