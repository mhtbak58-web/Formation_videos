import { useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { VideoCard } from "../components/VideoCard";
import { VideoPlayer } from "../components/VideoPlayer";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";
import { ProgressByVideo, Video } from "../types";

type Props = {
  email: string;
  favoriteIds: Set<string>;
  progress: ProgressByVideo;
  selectedCategory: string | null;
  videos: Video[];
  onProgressChange: (progress: ProgressByVideo) => void;
  onSelectCategory: (category: string | null) => void;
  onToggleFavorite: (videoId: string) => void;
};

export function MyCoursesScreen({
  email,
  favoriteIds,
  progress,
  selectedCategory,
  videos,
  onProgressChange,
  onSelectCategory,
  onToggleFavorite
}: Props) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(videos[0] ?? null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);

  const categories = useMemo(() => {
    return Array.from(new Set(videos.map((video) => video.category)));
  }, [videos]);

  const lockedByVideoId = useMemo(() => {
    const locked: Record<string, boolean> = {};
    let previousCompleted = true;

    for (const video of videos) {
      locked[video.id] = !previousCompleted;
      previousCompleted = Boolean(progress[video.id]);
    }

    return locked;
  }, [videos, progress]);

  const groupedVideos = useMemo(() => {
    return videos
      .filter((video) => !selectedCategory || video.category === selectedCategory)
      .reduce<Record<string, Video[]>>((groups, video) => {
        const categoryVideos = groups[video.category] ?? [];
        categoryVideos.push(video);
        groups[video.category] = categoryVideos;
        return groups;
      }, {});
  }, [videos, selectedCategory]);

  const totalCount = videos.length;
  const completedCount = videos.filter((video) => progress[video.id]).length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  async function markComplete(video: Video) {
    const nextProgress = { ...progress, [video.id]: true };
    onProgressChange(nextProgress);

    if (!supabase || video.id.startsWith("demo-")) {
      return;
    }

    const { error } = await supabase.from("video_progress").upsert({
      completed: true,
      completed_at: new Date().toISOString(),
      email,
      video_id: video.id
    });

    if (error) {
      Alert.alert("Progression non enregistree", error.message);
    }
  }

  function selectVideo(video: Video) {
    if (lockedByVideoId[video.id]) {
      Alert.alert("Module verrouille", "Termine le module precedent pour debloquer celui-ci.");
      return;
    }

    setSelectedVideo(video);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.heading}>Mes cours</Text>
      </View>

      <View style={styles.categoryPickerWrap}>
        <Pressable
          onPress={() => setCategoryMenuOpen((open) => !open)}
          style={({ pressed }) => [styles.categoryPicker, pressed && styles.pressed]}
        >
          <Text style={styles.categoryPickerIcon}>▦</Text>
          <Text style={styles.categoryPickerText}>{selectedCategory ?? "Toutes les categories"}</Text>
          <Text style={styles.categoryPickerChevron}>{categoryMenuOpen ? "▲" : "▼"}</Text>
        </Pressable>

        {categoryMenuOpen ? (
          <View style={styles.categoryMenu}>
            <Pressable
              onPress={() => {
                onSelectCategory(null);
                setCategoryMenuOpen(false);
              }}
              style={({ pressed }) => [styles.categoryMenuRow, pressed && styles.pressed]}
            >
              <Text style={styles.categoryMenuRowText}>Toutes les categories</Text>
              {!selectedCategory ? <Text style={styles.categoryMenuCheck}>✓</Text> : null}
            </Pressable>
            {categories.map((category) => (
              <Pressable
                key={category}
                onPress={() => {
                  onSelectCategory(category);
                  setCategoryMenuOpen(false);
                }}
                style={({ pressed }) => [styles.categoryMenuRow, pressed && styles.pressed]}
              >
                <Text style={styles.categoryMenuRowText}>{category}</Text>
                {selectedCategory === category ? <Text style={styles.categoryMenuCheck}>✓</Text> : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {totalCount === 0 ? (
          <Text style={styles.emptyText}>Aucun cours pour le moment. Reviens bientot pour un parcours structure.</Text>
        ) : null}

        {selectedVideo ? (
          <View style={styles.playerSection}>
            <VideoPlayer source={selectedVideo.playback_url} style={styles.video} />
            <View style={styles.playerInfo}>
              <Text style={styles.eyebrow}>Video de presentation</Text>
              <Text style={styles.selectedTitle}>{selectedVideo.title}</Text>
              {selectedVideo.description ? <Text style={styles.selectedDescription}>{selectedVideo.description}</Text> : null}
              <Pressable onPress={() => markComplete(selectedVideo)} style={styles.completeButton}>
                <Text style={styles.completeIcon}>▶</Text>
                <Text style={styles.completeText}>{progress[selectedVideo.id] ? "Terminee" : "Marquer comme terminee"}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {Object.entries(groupedVideos).map(([category, items]) => (
          <View key={category} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {items.map((video) => (
              <VideoCard
                completed={Boolean(progress[video.id])}
                isFavorite={favoriteIds.has(video.id)}
                key={video.id}
                locked={lockedByVideoId[video.id]}
                onPress={() => selectVideo(video)}
                onToggleFavorite={() => onToggleFavorite(video.id)}
                video={video}
              />
            ))}
          </View>
        ))}

        {allCompleted ? (
          <View style={styles.certificateCard}>
            <Text style={styles.certificateIcon}>🎓</Text>
            <Text style={styles.certificateTitle}>Certificat de fin de formation</Text>
            <Text style={styles.certificateText}>Felicitations, tu as termine tous les modules du parcours.</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>🏆 Formation terminee</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
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
  categoryPickerWrap: {
    paddingHorizontal: 18,
    paddingTop: 16,
    zIndex: 10
  },
  categoryPicker: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  pressed: {
    opacity: 0.75
  },
  categoryPickerIcon: {
    color: colors.primary,
    fontSize: 14
  },
  categoryPickerText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700"
  },
  categoryPickerChevron: {
    color: colors.primary,
    fontSize: 10
  },
  categoryMenu: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    overflow: "hidden",
    paddingVertical: 4
  },
  categoryMenuRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 13
  },
  categoryMenuRowText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600"
  },
  categoryMenuCheck: {
    color: colors.primary,
    fontSize: 14,
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
  playerSection: {
    backgroundColor: colors.card,
    borderColor: colors.border,
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
    gap: 8,
    padding: 20
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginBottom: 6,
    textTransform: "uppercase"
  },
  selectedTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "700"
  },
  selectedDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20
  },
  completeButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 12
  },
  completeIcon: {
    color: "#FFFFFF",
    fontSize: 11
  },
  completeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700"
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
  certificateCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    padding: 24
  },
  certificateIcon: {
    fontSize: 32,
    marginBottom: 10
  },
  certificateTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center"
  },
  certificateText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
    textAlign: "center"
  },
  badgeRow: {
    flexDirection: "row",
    gap: 8
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 8
  }
});
