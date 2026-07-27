import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { VideoPlayer } from "../components/VideoPlayer";
import { VIDEO_CATEGORIES } from "../lib/categories";
import { Video } from "../types";

type Props = {
  videos: Video[];
  onBack: () => void;
};

export function ReplaysScreen({ videos, onBack }: Props) {
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
        {selectedVideo ? (
          <View style={styles.playerSection}>
            <VideoPlayer source={selectedVideo.playback_url} style={styles.video} />
            <View style={styles.playerInfo}>
              <Text style={styles.selectedCategory}>{selectedVideo.category}</Text>
              <Text style={styles.selectedTitle}>{selectedVideo.title}</Text>
              {selectedVideo.description ? <Text style={styles.selectedDescription}>{selectedVideo.description}</Text> : null}
            </View>
          </View>
        ) : null}

        {videos.length === 0 ? <Text style={styles.emptyText}>Aucun replay ou tuto disponible pour le moment.</Text> : null}

        {groups.map(({ category, items }) => (
          <View key={category} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{category}</Text>
            <View style={styles.grid}>
              {items.map((video) => (
                <Pressable
                  key={video.id}
                  onPress={() => setSelectedVideo(video)}
                  style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
                >
                  <View style={[styles.tileThumbnail, selectedVideo?.id === video.id && styles.tileThumbnailActive]}>
                    <Text style={styles.tilePlay}>▶</Text>
                    {video.duration_minutes ? (
                      <View style={styles.tileDurationBadge}>
                        <Text style={styles.tileDurationText}>{video.duration_minutes} min</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text numberOfLines={2} style={styles.tileTitle}>
                    {video.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#FAF7F3",
    flex: 1
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#E0C8B7",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 18
  },
  eyebrow: {
    color: "#7A9C59",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginBottom: 4,
    textTransform: "uppercase"
  },
  heading: {
    color: "#2B2420",
    fontSize: 19,
    fontWeight: "700"
  },
  backButton: {
    borderColor: "#E0C8B7",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  backText: {
    color: "#2B2420",
    fontSize: 12,
    fontWeight: "700"
  },
  content: {
    padding: 18,
    paddingBottom: 36
  },
  emptyText: {
    color: "#7A6F61",
    fontSize: 14,
    marginBottom: 18,
    textAlign: "center"
  },
  playerSection: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0C8B7",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 28,
    overflow: "hidden"
  },
  video: {
    aspectRatio: 16 / 9,
    backgroundColor: "#1C1814",
    width: "100%"
  },
  playerInfo: {
    gap: 6,
    padding: 20
  },
  selectedCategory: {
    color: "#7A9C59",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  selectedTitle: {
    color: "#2B2420",
    fontSize: 19,
    fontWeight: "700"
  },
  selectedDescription: {
    color: "#7A6F61",
    fontSize: 14,
    lineHeight: 20
  },
  categoryBlock: {
    marginBottom: 18
  },
  categoryTitle: {
    color: "#2B2420",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12
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
  tilePressed: {
    opacity: 0.7
  },
  tileThumbnail: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#FFFFFF",
    borderColor: "#E0C8B7",
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    marginBottom: 8,
    width: "100%"
  },
  tileThumbnailActive: {
    borderColor: "#7A9C59",
    borderWidth: 2
  },
  tilePlay: {
    color: "#7A9C59",
    fontSize: 26
  },
  tileDurationBadge: {
    backgroundColor: "rgba(43,36,32,0.85)",
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
  tileTitle: {
    color: "#2B2420",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center"
  }
});
