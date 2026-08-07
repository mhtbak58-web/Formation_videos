import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { demoVideos } from "./src/data";
import { BottomTabBar, TabKey } from "./src/components/BottomTabBar";
import { VIDEO_CATEGORIES } from "./src/lib/categories";
import { colors } from "./src/lib/theme";
import { clearAndroidAutoCatalog, publishAndroidAutoCatalog } from "./src/lib/androidAuto";
import { hasSupabaseConfig, supabase } from "./src/lib/supabase";
import { AdminScreen } from "./src/screens/AdminScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { CategoriesScreen } from "./src/screens/CategoriesScreen";
import { FavorisScreen } from "./src/screens/FavorisScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { MyCoursesScreen } from "./src/screens/MyCoursesScreen";
import { ProfilScreen } from "./src/screens/ProfilScreen";
import { ReplaysScreen } from "./src/screens/ReplaysScreen";
import { ProgressByVideo, Video } from "./src/types";

const REPLAY_CATEGORIES: readonly string[] = VIDEO_CATEGORIES;

const STORED_EMAIL_KEY = "loggedInEmail";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("accueil");
  const [booting, setBooting] = useState(true);
  const [canViewReplays, setCanViewReplays] = useState(false);
  const [courseCategoryFilter, setCourseCategoryFilter] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [progress, setProgress] = useState<ProgressByVideo>({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [showReplays, setShowReplays] = useState(false);
  const [videos, setVideos] = useState<Video[]>(demoVideos);

  const courseVideos = useMemo(() => videos.filter((video) => !REPLAY_CATEGORIES.includes(video.category)), [videos]);
  const replayVideos = useMemo(() => videos.filter((video) => REPLAY_CATEGORIES.includes(video.category)), [videos]);
  const accessibleVideos = useMemo(
    () => (canViewReplays ? [...courseVideos, ...replayVideos] : courseVideos),
    [courseVideos, replayVideos, canViewReplays]
  );

  async function attemptAccess(rawEmail: string) {
    const normalizedEmail = rawEmail.trim().toLowerCase();
    const client = supabase;

    if (!client) {
      setBooting(false);
      return;
    }

    setBooting(true);

    const [{ data: allowed, error: allowedError }, { data: admin, error: adminError }, { data: replayAccess, error: replayError }] = await Promise.all([
      client.from("allowed_emails").select("email").eq("email", normalizedEmail).maybeSingle(),
      client.from("admin_emails").select("email").eq("email", normalizedEmail).maybeSingle(),
      client.from("replay_emails").select("email").eq("email", normalizedEmail).maybeSingle()
    ]);

    const nextIsAdmin = Boolean(admin);
    const nextCanViewReplays = Boolean(replayAccess);

    if (
      (allowedError && allowedError.code !== "PGRST116") ||
      (adminError && adminError.code !== "PGRST116") ||
      (replayError && replayError.code !== "PGRST116")
    ) {
      Alert.alert("Verification impossible", allowedError?.message ?? adminError?.message ?? replayError?.message);
    }

    setEmail(normalizedEmail);

    if (!allowed && !nextIsAdmin) {
      setHasAccess(false);
      setIsAdmin(false);
      setCanViewReplays(false);
      setShowAdmin(false);
      await AsyncStorage.removeItem(STORED_EMAIL_KEY);
      setBooting(false);
      return;
    }

    await AsyncStorage.setItem(STORED_EMAIL_KEY, normalizedEmail);

    const videosQuery = client.from("videos").select("*").order("sort_order", { ascending: true });
    const [{ data: videoRows, error: videosError }, { data: progressRows, error: progressError }, { data: favoriteRows, error: favoritesError }] =
      await Promise.all([
        nextIsAdmin ? videosQuery : videosQuery.eq("is_published", true),
        client.from("video_progress").select("video_id, completed").eq("email", normalizedEmail),
        client.from("video_favorites").select("video_id").eq("email", normalizedEmail)
      ]);

    if (videosError || progressError || favoritesError) {
      Alert.alert("Chargement incomplet", videosError?.message ?? progressError?.message ?? favoritesError?.message);
    }

    setHasAccess(true);
    setIsAdmin(nextIsAdmin);
    setCanViewReplays(nextCanViewReplays);
    setVideos((videoRows as Video[] | null) ?? []);
    setProgress(
      (progressRows ?? []).reduce<ProgressByVideo>((acc, item) => {
        acc[item.video_id] = item.completed;
        return acc;
      }, {})
    );
    setFavoriteIds(new Set((favoriteRows ?? []).map((item) => item.video_id as string)));
    setBooting(false);
  }

  useEffect(() => {
    if (!supabase) {
      setBooting(false);
      return;
    }

    AsyncStorage.getItem(STORED_EMAIL_KEY).then((storedEmail) => {
      if (storedEmail) {
        attemptAccess(storedEmail);
      } else {
        setBooting(false);
      }
    });
  }, []);

  useEffect(() => {
    if (hasAccess) {
      publishAndroidAutoCatalog(videos);
    }
  }, [videos, hasAccess]);

  async function toggleFavorite(videoId: string) {
    const isFavorite = favoriteIds.has(videoId);
    const nextFavoriteIds = new Set(favoriteIds);
    if (isFavorite) {
      nextFavoriteIds.delete(videoId);
    } else {
      nextFavoriteIds.add(videoId);
    }
    setFavoriteIds(nextFavoriteIds);

    if (!supabase) {
      return;
    }

    const { error } = isFavorite
      ? await supabase.from("video_favorites").delete().match({ email, video_id: videoId })
      : await supabase.from("video_favorites").insert({ email, video_id: videoId });

    if (error) {
      Alert.alert("Favoris non enregistres", error.message);
    }
  }

  function selectCourseCategory(category: string) {
    setCourseCategoryFilter(category);
    setActiveTab("mescours");
  }

  async function signOut() {
    await AsyncStorage.removeItem(STORED_EMAIL_KEY);
    await clearAndroidAutoCatalog();

    setEmail("");
    setHasAccess(false);
    setIsAdmin(false);
    setCanViewReplays(false);
    setShowAdmin(false);
    setShowReplays(false);
    setActiveTab("accueil");
    setCourseCategoryFilter(null);
    setFavoriteIds(new Set());
    setProgress({});
  }

  if (booting) {
    return (
      <View style={styles.loading}>
        <StatusBar style="dark" />
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (!email) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen
          demoMode={!hasSupabaseConfig}
          onDemoAccess={() => Alert.alert("Configuration manquante", "Aucun acces direct n'est disponible sans configuration Supabase.")}
          onSubmit={attemptAccess}
        />
      </>
    );
  }

  if (!hasAccess) {
    return (
      <View style={styles.denied}>
        <StatusBar style="dark" />
        <Text style={styles.deniedTitle}>Acces non autorise</Text>
        <Text style={styles.deniedText}>L'email {email} n'est pas dans la liste des emails autorises.</Text>
        <Text onPress={signOut} style={styles.deniedLink}>Utiliser un autre email</Text>
      </View>
    );
  }

  if (showAdmin && isAdmin) {
    return (
      <>
        <StatusBar style="dark" />
        <AdminScreen onBack={() => setShowAdmin(false)} onChanged={() => attemptAccess(email)} />
      </>
    );
  }

  if (showReplays && canViewReplays) {
    return (
      <>
        <StatusBar style="dark" />
        <ReplaysScreen favoriteIds={favoriteIds} onBack={() => setShowReplays(false)} onToggleFavorite={toggleFavorite} videos={replayVideos} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.tabScreen}>
        {activeTab === "accueil" ? (
          <HomeScreen
            canViewReplays={canViewReplays}
            courseVideos={courseVideos}
            email={email}
            progress={progress}
            onOpenCategories={() => setActiveTab("categories")}
            onOpenReplays={() => setShowReplays(true)}
            onStartCourses={() => setActiveTab("mescours")}
          />
        ) : null}
        {activeTab === "categories" ? (
          <CategoriesScreen
            canViewReplays={canViewReplays}
            courseVideos={courseVideos}
            onOpenReplays={() => setShowReplays(true)}
            onSelectCategory={selectCourseCategory}
          />
        ) : null}
        {activeTab === "mescours" ? (
          <MyCoursesScreen
            email={email}
            favoriteIds={favoriteIds}
            progress={progress}
            selectedCategory={courseCategoryFilter}
            videos={courseVideos}
            onProgressChange={setProgress}
            onSelectCategory={setCourseCategoryFilter}
            onToggleFavorite={toggleFavorite}
          />
        ) : null}
        {activeTab === "favoris" ? (
          <FavorisScreen favoriteIds={favoriteIds} videos={accessibleVideos} onToggleFavorite={toggleFavorite} />
        ) : null}
        {activeTab === "profil" ? (
          <ProfilScreen email={email} isAdmin={isAdmin} onOpenAdmin={() => setShowAdmin(true)} onSignOut={signOut} />
        ) : null}
        <BottomTabBar activeTab={activeTab} onChange={setActiveTab} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center"
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
    letterSpacing: 0.4,
    marginTop: 14
  },
  denied: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  deniedTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 10,
    textAlign: "center"
  },
  deniedText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
    textAlign: "center"
  },
  deniedLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  },
  tabScreen: {
    flex: 1
  }
});
