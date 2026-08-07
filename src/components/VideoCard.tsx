import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";
import { Video } from "../types";

type Props = {
  completed: boolean;
  isFavorite?: boolean;
  locked?: boolean;
  video: Video;
  onPress: () => void;
  onToggleFavorite?: () => void;
};

export function VideoCard({ completed, isFavorite, locked, video, onPress, onToggleFavorite }: Props) {
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
      {onToggleFavorite ? (
        <Pressable hitSlop={8} onPress={onToggleFavorite} style={styles.favoriteButton}>
          <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteIconActive]}>{isFavorite ? "♥" : "♡"}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
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
    color: colors.textMuted
  },
  lockedLabel: {
    color: colors.textMuted,
    fontSize: 12
  },
  thumbnail: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    justifyContent: "center",
    width: 84
  },
  play: {
    color: colors.primary,
    fontSize: 22
  },
  durationBadge: {
    backgroundColor: "rgba(26,21,18,0.85)",
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
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700"
  },
  dot: {
    color: colors.textMuted,
    fontSize: 12
  },
  done: {
    color: colors.textMuted,
    fontSize: 12
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  duration: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600"
  },
  favoriteButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  favoriteIcon: {
    color: colors.textMuted,
    fontSize: 20
  },
  favoriteIconActive: {
    color: colors.primary
  }
});
