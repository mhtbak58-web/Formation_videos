import { Image, Pressable, ScrollView, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { formatDuration } from "../lib/format";
import { colors } from "../lib/theme";
import { ProgressByVideo, Video } from "../types";

const heroImage = require("../assets/images/hero-camera-studio.jpg");
const promoImageSource = require("../assets/images/promo-desk-items.jpg");
const resourcePdfImage = require("../assets/images/resource-pdf.jpg");
const resourceChecklistImage = require("../assets/images/resource-checklist.jpg");
const resourceEditingImage = require("../assets/images/resource-editing.jpg");

type Props = {
  canViewReplays: boolean;
  courseVideos: Video[];
  email: string;
  progress: ProgressByVideo;
  onOpenCategories: () => void;
  onOpenReplays: () => void;
  onStartCourses: () => void;
};

const RESOURCES = [
  { icon: "📄", image: resourcePdfImage, label: "Support PDF du parcours", description: "Telechargez le support complet du parcours en format PDF." },
  { icon: "📋", image: resourceChecklistImage, label: "Check-list de mise en pratique", description: "Un guide pratique pour vous aider a passer a l'action efficacement." },
  { icon: "🎬", image: resourceEditingImage, label: "Exemples a telecharger", description: "Accedez a des exemples concrets pour vous inspirer et progresser." }
];

export function HomeScreen({ canViewReplays, courseVideos, email, progress, onOpenCategories, onOpenReplays, onStartCourses }: Props) {
  const totalCount = courseVideos.length;
  const completedCount = courseVideos.filter((video) => progress[video.id]).length;
  const completionRatio = totalCount > 0 ? completedCount / totalCount : 0;
  const totalMinutes = courseVideos.reduce((sum, video) => sum + (video.duration_minutes ?? 0), 0);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Text style={styles.brandIcon}>🎬</Text>
            </View>
            <View>
              <Text style={styles.heading}>Catalogue video</Text>
              <Text style={styles.email}>{email}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {canViewReplays ? (
              <Pressable onPress={onOpenReplays} style={styles.replaysButton}>
                <Text style={styles.replaysIcon}>▶</Text>
                <Text style={styles.replaysText}>Replays &amp; Tutos</Text>
              </Pressable>
            ) : null}
            <View style={styles.bellButton}>
              <Text style={styles.bellIcon}>🔔</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            📚 {totalCount} module{totalCount > 1 ? "s" : ""} • ⏱️ {formatDuration(totalMinutes)} de contenu
          </Text>
          <Text style={styles.progressLabel}>
            {completedCount}/{totalCount} termines · {Math.round(completionRatio * 100)}%
          </Text>
        </View>

        <View style={styles.hero}>
          <Image resizeMode="cover" source={heroImage} style={styles.heroImage} />
        </View>

        <Pressable onPress={onOpenCategories} style={({ pressed }) => [styles.categoryPicker, pressed && styles.pressed]}>
          <Text style={styles.categoryPickerIcon}>▦</Text>
          <Text style={styles.categoryPickerText}>Toutes les categories</Text>
          <Text style={styles.categoryPickerChevron}>▼</Text>
        </Pressable>

        <View style={styles.promo}>
          <View style={styles.promoText}>
            <Text style={styles.promoHeading}>
              Apprenez.{"\n"}Creez. <Text style={styles.promoHeadingAccent}>Partagez.</Text>
            </Text>
            <Text style={styles.promoSubtext}>Passez a l'action et transformez vos idees en contenu.</Text>
            <Pressable onPress={onStartCourses} style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Commencer →</Text>
            </Pressable>
          </View>
          <Image resizeMode="cover" source={promoImageSource} style={styles.promoImage} />
        </View>

        <View style={styles.resourcesBlock}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>RESSOURCES</Text>
            <View style={styles.sectionUnderline} />
          </View>
          {RESOURCES.map((resource) => (
            <View key={resource.label} style={styles.resourceCard}>
              <View style={styles.resourceThumbnailWrap}>
                <Image resizeMode="cover" source={resource.image} style={styles.resourceThumbnail} />
                <View style={styles.resourceThumbnailBadge}>
                  <Text style={styles.resourceThumbnailIcon}>{resource.icon}</Text>
                </View>
              </View>
              <View style={styles.resourceInfo}>
                <Text style={styles.resourceLabel}>{resource.label}</Text>
                <Text style={styles.resourceDescription}>{resource.description}</Text>
              </View>
              <View style={styles.resourceArrow}>
                <Text style={styles.resourceArrowIcon}>→</Text>
              </View>
            </View>
          ))}
        </View>
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
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 52,
    justifyContent: "center",
    width: 52
  },
  brandIcon: {
    fontSize: 22
  },
  heading: {
    color: colors.text,
    fontSize: 19,
    fontWeight: "800"
  },
  email: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2
  },
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  replaysButton: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  replaysIcon: {
    color: colors.primary,
    fontSize: 11
  },
  replaysText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800"
  },
  bellButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  bellIcon: {
    fontSize: 16
  },
  statsRow: {
    marginBottom: 18
  },
  statsText: {
    color: colors.textMuted,
    fontSize: 13
  },
  progressLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4
  },
  hero: {
    backgroundColor: colors.primaryDark,
    borderRadius: 18,
    height: 150,
    marginBottom: 18,
    overflow: "hidden"
  },
  heroImage: {
    height: "100%",
    width: "100%"
  },
  categoryPicker: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.primary,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 14
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
    flex: 1,
    fontSize: 14,
    fontWeight: "700"
  },
  categoryPickerChevron: {
    color: colors.primary,
    fontSize: 12
  },
  promo: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 24,
    overflow: "hidden"
  },
  promoText: {
    flex: 3,
    gap: 8,
    padding: 20
  },
  promoHeading: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28
  },
  promoHeadingAccent: {
    color: colors.primary
  },
  promoSubtext: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18
  },
  promoButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: 999,
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 11
  },
  promoButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800"
  },
  promoImage: {
    alignSelf: "stretch",
    backgroundColor: colors.primarySoft,
    flex: 2
  },
  resourcesBlock: {
    gap: 10
  },
  sectionTitleRow: {
    marginBottom: 6
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1
  },
  sectionUnderline: {
    backgroundColor: colors.primary,
    borderRadius: 2,
    height: 3,
    marginTop: 6,
    width: 28
  },
  resourceCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12
  },
  resourceThumbnailWrap: {
    height: 56,
    width: 56
  },
  resourceThumbnail: {
    borderRadius: 12,
    height: 56,
    width: 56
  },
  resourceThumbnailBadge: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    bottom: -6,
    height: 24,
    justifyContent: "center",
    left: -6,
    position: "absolute",
    width: 24
  },
  resourceThumbnailIcon: {
    fontSize: 12
  },
  resourceInfo: {
    flex: 1,
    gap: 3
  },
  resourceLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  resourceDescription: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16
  },
  resourceArrow: {
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32
  },
  resourceArrowIcon: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700"
  }
});
