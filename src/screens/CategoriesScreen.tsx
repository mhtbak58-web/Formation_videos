import { useMemo } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";
import { Video } from "../types";

type Props = {
  canViewReplays: boolean;
  courseVideos: Video[];
  onOpenReplays: () => void;
  onSelectCategory: (category: string) => void;
};

export function CategoriesScreen({ canViewReplays, courseVideos, onOpenReplays, onSelectCategory }: Props) {
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const video of courseVideos) {
      counts.set(video.category, (counts.get(video.category) ?? 0) + 1);
    }
    return Array.from(counts.entries());
  }, [courseVideos]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Categories</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes cours</Text>
          {categories.length === 0 ? (
            <Text style={styles.emptyText}>Aucune categorie pour le moment.</Text>
          ) : (
            categories.map(([category, count]) => (
              <Pressable
                key={category}
                onPress={() => onSelectCategory(category)}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              >
                <View style={styles.tileIcon}>
                  <Text style={styles.tileIconText}>▦</Text>
                </View>
                <View style={styles.tileInfo}>
                  <Text style={styles.tileTitle}>{category}</Text>
                  <Text style={styles.tileMeta}>
                    {count} video{count > 1 ? "s" : ""}
                  </Text>
                </View>
                <Text style={styles.tileChevron}>›</Text>
              </Pressable>
            ))
          )}
        </View>

        {canViewReplays ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Acces libre</Text>
            <Pressable onPress={onOpenReplays} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
              <View style={styles.tileIcon}>
                <Text style={styles.tileIconText}>▶</Text>
              </View>
              <View style={styles.tileInfo}>
                <Text style={styles.tileTitle}>Replays &amp; Tutos</Text>
                <Text style={styles.tileMeta}>Consulter librement</Text>
              </View>
              <Text style={styles.tileChevron}>›</Text>
            </Pressable>
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
  content: {
    padding: 18,
    paddingBottom: 36
  },
  heading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20
  },
  section: {
    marginBottom: 22
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: "uppercase"
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14
  },
  pressed: {
    opacity: 0.75
  },
  tile: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
    padding: 14
  },
  tileIcon: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  tileIconText: {
    color: colors.primary,
    fontSize: 18
  },
  tileInfo: {
    flex: 1,
    gap: 2
  },
  tileTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  tileMeta: {
    color: colors.textMuted,
    fontSize: 12
  },
  tileChevron: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "700"
  }
});
