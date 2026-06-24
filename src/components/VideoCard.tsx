import { Pressable, StyleSheet, Text, View } from "react-native";
import { Video } from "../types";

type Props = {
  completed: boolean;
  locked?: boolean;
  video: Video;
  onPress: () => void;
};

export function VideoCard({ completed, locked, video, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, locked && styles.cardLocked, pressed && styles.pressed]}>
      <View style={styles.thumbnail}>
        <Text style={styles.play}>{locked ? "🔒" : "▶"}</Text>
        {video.duration_minutes ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationBadgeText}>{video.duration_minutes} min</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, locked && styles.titleLocked]}>{video.title}</Text>
        {video.description ? <Text style={styles.description}>{video.description}</Text> : null}
        <View style={styles.metaRow}>
          <Text style={styles.category}>{video.category}</Text>
          {completed ? (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.done}>Terminee</Text>
            </>
          ) : null}
          {locked ? (
            <>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.lockedLabel}>Verrouille</Text>
            </>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E0C8B7",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    padding: 14
  },
  pressed: {
    opacity: 0.75
  },
  cardLocked: {
    opacity: 0.6
  },
  titleLocked: {
    color: "#A89A87"
  },
  lockedLabel: {
    color: "#A89A87",
    fontSize: 12
  },
  thumbnail: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "#FAF7F3",
    borderRadius: 10,
    justifyContent: "center",
    width: 84
  },
  play: {
    color: "#7A9C59",
    fontSize: 22
  },
  durationBadge: {
    backgroundColor: "rgba(43,36,32,0.85)",
    borderRadius: 4,
    bottom: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    position: "absolute"
  },
  durationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600"
  },
  content: {
    flex: 1,
    gap: 5,
    justifyContent: "center"
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 2
  },
  category: {
    color: "#7A9C59",
    fontSize: 12,
    fontWeight: "700"
  },
  dot: {
    color: "#A89A87",
    fontSize: 12
  },
  done: {
    color: "#7A6F61",
    fontSize: 12
  },
  title: {
    color: "#2B2420",
    fontSize: 16,
    fontWeight: "700"
  },
  description: {
    color: "#7A6F61",
    fontSize: 13,
    lineHeight: 18
  },
  duration: {
    color: "#A89A87",
    fontSize: 11,
    fontWeight: "600"
  }
});
