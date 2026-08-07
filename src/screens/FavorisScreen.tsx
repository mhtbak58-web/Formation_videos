import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { VideoPlayerModal } from "../components/VideoPlayerModal";
import { colors } from "../lib/theme";
import { Video } from "../types";

type Props = {
  favoriteIds: Set<string>;
  videos: Video[];
  onToggleFavorite: (videoId: string) => void;
};

export function FavorisScreen({ favoriteIds, videos, onToggleFavorite }: Props) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const favoriteVideos = useMemo(() => videos.filter((video) => favoriteIds.has(video.id)), [videos, favoriteIds]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Favoris</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {favoriteVideos.length === 0 ? (
          <Text style={styles.emptyText}>Aucune video en favoris pour le moment. Appuie sur le coeur d'une video pour l'ajouter ici.</Text>
        ) : (
          <View style={styles.grid}>
            {favoriteVideos.map((video) => (
              <View key={video.id} style={styles.tile}>
                <Pressable onPress={() => setSelectedVideo(video)} style={({ pressed }) => pressed && styles.pressed}>
                  <View style={styles.tileThumbnail}>
                    <Text style={styles.tilePlay}>▶</Text>
                    {video.duration_minutes ? (
                      <View style={styles.tileDurationBadge}>
                        <Text style={styles.tileDurationText}>{video.duration_minutes} min</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
                <Pressable hitSlop={8} onPress={() => onToggleFavorite(video.id)} style={styles.favoriteButton}>
                  <Text style={styles.favoriteIcon}>♥</Text>
                </Pressable>
                <Text numberOfLines={2} style={styles.tileTitle}>
                  {video.title}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <VideoPlayerModal onClose={() => setSelectedVideo(null)} video={selectedVideo} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 18
  },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  content: {
    padding: 18,
    paddingBottom: 36
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center"
  },
  pressed: {
    opacity: 0.75
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  tile: {
    alignItems: "center",
    width: 108
  },
  tileThumbnail: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 8,
    width: "100%"
  },
  tilePlay: {
    color: colors.primary,
    fontSize: 26
  },
  tileDurationBadge: {
    backgroundColor: "rgba(26,21,18,0.85)",
    borderRadius: 4,
    bottom: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: "absolute",
    right: 6
  },
  tileDurationText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600"
  },
  favoriteButton: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: 2,
    top: 2,
    width: 28
  },
  favoriteIcon: {
    color: colors.primary,
    fontSize: 16
  },
  tileTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center"
  }
});
