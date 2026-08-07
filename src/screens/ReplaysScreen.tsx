import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { VideoPlayerModal } from "../components/VideoPlayerModal";
import { VIDEO_CATEGORIES } from "../lib/categories";
import { colors } from "../lib/theme";
import { Video } from "../types";

type Props = {
  favoriteIds: Set<string>;
  videos: Video[];
  onBack: () => void;
  onToggleFavorite: (videoId: string) => void;
};

export function ReplaysScreen({ favoriteIds, videos, onBack, onToggleFavorite }: Props) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const groups = useMemo(() => {
    return VIDEO_CATEGORIES.map((category) => ({
      category,
      items: videos.filter((video) => video.category === category)
    })).filter((group) => group.items.length > 0);
  }, [videos]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Acces libre</Text>
          <Text style={styles.heading}>Replays &amp; Tutos</Text>
        </View>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {videos.length === 0 ? <Text style={styles.emptyText}>Aucun replay ou tuto disponible pour le moment.</Text> : null}

        {groups.map(({ category, items }) => (
          <View key={category} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.grid}>
              {items.map((video) => (
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
                    <Text style={[styles.favoriteIcon, favoriteIds.has(video.id) && styles.favoriteIconActive]}>
                      {favoriteIds.has(video.id) ? "♥" : "♡"}
                    </Text>
                  </Pressable>
                  <Text numberOfLines={2} style={styles.tileTitle}>
                    {video.title}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
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
    alignItems: "center",
    backgroundColor: colors.card,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 18
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginBottom: 4,
    textTransform: "uppercase"
  },
  heading: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "700"
  },
  backButton: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  backText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700"
  },
  content: {
    padding: 18,
    paddingBottom: 36
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 18,
    textAlign: "center"
  },
  categoryBlock: {
    marginBottom: 18
  },
  categoryTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  pressed: {
    opacity: 0.7
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
    color: colors.textMuted,
    fontSize: 16
  },
  favoriteIconActive: {
    color: colors.primary
  },
  tileTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center"
  }
});
