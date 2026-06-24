import { useMemo, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { VideoCard } from "../components/VideoCard";
import { VideoPlayer } from "../components/VideoPlayer";
import { supabase } from "../lib/supabase";
import { ProgressByVideo, Video } from "../types";

type Props = {
  email: string;
  progress: ProgressByVideo;
  isAdmin: boolean;
  videos: Video[];
  onOpenAdmin: () => void;
  onProgressChange: (progress: ProgressByVideo) => void;
  onSignOut: () => void;
};

const RESOURCES = [
  { icon: "📄", label: "Support PDF du parcours" },
  { icon: "📋", label: "Check-list de mise en pratique" },
  { icon: "🎬", label: "Exemples a telecharger" }
];

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${totalMinutes}min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h${String(minutes).padStart(2, "0")}` : `${hours}h`;
}

export function LibraryScreen({ email, progress, isAdmin, videos, onOpenAdmin, onProgressChange, onSignOut }: Props) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(videos[0] ?? null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
  const completionRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const totalMinutes = videos.reduce((sum, video) => sum + (video.duration_minutes ?? 0), 0);
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
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(completionRatio * 100)}%` }]} />
      </View>

      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandPlay}>▶</Text>
          </View>
          <View>
            <Text style={styles.heading}>Catalogue video</Text>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.metaLine}>
              📚 {totalCount} module{totalCount > 1 ? "s" : ""} • ⏱️ {formatDuration(totalMinutes)} de contenu
            </Text>
            <Text style={styles.progressLabel}>
              {completedCount}/{totalCount} termines · {Math.round(completionRatio * 100)}%
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {isAdmin ? (
            <Pressable onPress={onOpenAdmin} style={styles.adminButton}>
              <Text style={styles.adminText}>Admin</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sortir</Text>
          </Pressable>
        </View>
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
                setSelectedCategory(null);
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
                  setSelectedCategory(category);
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
                key={video.id}
                locked={lockedByVideoId[video.id]}
                onPress={() => selectVideo(video)}
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

        <View style={styles.resourcesBlock}>
          <Text style={styles.categoryTitle}>Ressources</Text>
          {RESOURCES.map((resource) => (
            <View key={resource.label} style={styles.resourceRow}>
              <Text style={styles.resourceIcon}>{resource.icon}</Text>
              <Text style={styles.resourceLabel}>{resource.label}</Text>
            </View>
          ))}
        </View>
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
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  brandMark: {
    alignItems: "center",
    borderColor: "#7A9C59",
    borderRadius: 10,
    borderWidth: 1.5,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  brandPlay: {
    color: "#7A9C59",
    fontSize: 14
  },
  eyebrow: {
    color: "#7A9C59",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginBottom: 6,
    textTransform: "uppercase"
  },
  heading: {
    color: "#2B2420",
    fontSize: 19,
    fontWeight: "700"
  },
  email: {
    color: "#A89A87",
    fontSize: 12,
    marginTop: 2
  },
  metaLine: {
    color: "#7A6F61",
    fontSize: 12,
    marginTop: 6
  },
  progressLabel: {
    color: "#7A9C59",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 3
  },
  progressTrack: {
    backgroundColor: "#E0C8B7",
    height: 4,
    width: "100%"
  },
  progressFill: {
    backgroundColor: "#7A9C59",
    height: 4
  },
  signOutButton: {
    borderColor: "#E0C8B7",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  headerActions: {
    flexDirection: "row",
    gap: 8
  },
  adminButton: {
    backgroundColor: "#7A9C59",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9
  },
  adminText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700"
  },
  signOutText: {
    color: "#2B2420",
    fontSize: 12,
    fontWeight: "700"
  },
  categoryPickerWrap: {
    paddingHorizontal: 18,
    paddingTop: 16,
    zIndex: 10
  },
  categoryPicker: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderColor: "#7A9C59",
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
    color: "#7A9C59",
    fontSize: 14
  },
  categoryPickerText: {
    color: "#7A9C59",
    fontSize: 14,
    fontWeight: "700"
  },
  categoryPickerChevron: {
    color: "#7A9C59",
    fontSize: 10
  },
  categoryMenu: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0C8B7",
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    overflow: "hidden",
    paddingVertical: 4,
    shadowColor: "#2B2420",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18
  },
  categoryMenuRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 13
  },
  categoryMenuRowText: {
    color: "#2B2420",
    fontSize: 14,
    fontWeight: "600"
  },
  categoryMenuCheck: {
    color: "#7A9C59",
    fontSize: 14,
    fontWeight: "700"
  },
  content: {
    padding: 18,
    paddingBottom: 36
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
    gap: 8,
    padding: 20
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
  completeButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#7A9C59",
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
    color: "#2B2420",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12
  },
  certificateCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#7A9C59",
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
    color: "#2B2420",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center"
  },
  certificateText: {
    color: "#7A6F61",
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
    backgroundColor: "#7A9C59",
    borderRadius: 999,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 14,
    paddingVertical: 8
  },
  resourcesBlock: {
    marginBottom: 18
  },
  resourceRow: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E0C8B7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    padding: 14
  },
  resourceIcon: {
    fontSize: 18
  },
  resourceLabel: {
    color: "#2B2420",
    fontSize: 14,
    fontWeight: "600"
  }
});
