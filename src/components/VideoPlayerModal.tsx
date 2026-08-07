import { useEffect, useRef } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";
import { Video } from "../types";
import { VideoPlayer } from "./VideoPlayer";

type Props = {
  video: Video | null;
  onClose: () => void;
};

export function VideoPlayerModal({ video, onClose }: Props) {
  const scale = useRef(new Animated.Value(0.85)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!video) {
      return;
    }

    scale.setValue(0.85);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { friction: 9, tension: 90, toValue: 1, useNativeDriver: false }),
      Animated.timing(backdropOpacity, { duration: 200, toValue: 1, useNativeDriver: false })
    ]).start();
  }, [video]);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={Boolean(video)}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        {video ? (
          <Animated.View style={[styles.playerCard, { transform: [{ scale }] }]}>
            <Pressable hitSlop={8} onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
            <VideoPlayer source={video.playback_url} style={styles.video} />
            <View style={styles.playerInfo}>
              <Text style={styles.selectedCategory}>{video.category}</Text>
              <Text style={styles.selectedTitle}>{video.title}</Text>
              {video.description ? <Text style={styles.selectedDescription}>{video.description}</Text> : null}
            </View>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(15,10,10,0.9)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  playerCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    maxWidth: 920,
    overflow: "hidden",
    width: "100%"
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "rgba(15,10,10,0.65)",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    position: "absolute",
    right: 12,
    top: 12,
    width: 36,
    zIndex: 10
  },
  closeIcon: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
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
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
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
  }
});
