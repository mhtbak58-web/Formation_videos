import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { demoVideos } from "./src/data";
import { clearAndroidAutoCatalog, publishAndroidAutoCatalog } from "./src/lib/androidAuto";
import { hasSupabaseConfig, supabase } from "./src/lib/supabase";
import { AdminScreen } from "./src/screens/AdminScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { LibraryScreen } from "./src/screens/LibraryScreen";
import { ProgressByVideo, Video } from "./src/types";

const STORED_EMAIL_KEY = "loggedInEmail";

export default function App() {
  const [booting, setBooting] = useState(true);
  const [email, setEmail] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [progress, setProgress] = useState<ProgressByVideo>({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [videos, setVideos] = useState<Video[]>(demoVideos);

  async function attemptAccess(rawEmail: string) {
    const normalizedEmail = rawEmail.trim().toLowerCase();
    const client = supabase;

    if (!client) {
      setBooting(false);
      return;
    }

    setBooting(true);

    const [{ data: allowed, error: allowedError }, { data: admin, error: adminError }] = await Promise.all([
      client.from("allowed_emails").select("email").eq("email", normalizedEmail).maybeSingle(),
      client.from("admin_emails").select("email").eq("email", normalizedEmail).maybeSingle()
    ]);

    const nextIsAdmin = Boolean(admin);

    if ((allowedError && allowedError.code !== "PGRST116") || (adminError && adminError.code !== "PGRST116")) {
      Alert.alert("Verification impossible", allowedError?.message ?? adminError?.message);
    }

    setEmail(normalizedEmail);

    if (!allowed && !nextIsAdmin) {
      setHasAccess(false);
      setIsAdmin(false);
      setShowAdmin(false);
      await AsyncStorage.removeItem(STORED_EMAIL_KEY);
      setBooting(false);
      return;
    }

    await AsyncStorage.setItem(STORED_EMAIL_KEY, normalizedEmail);

    const videosQuery = client.from("videos").select("*").order("sort_order", { ascending: true });
    const [{ data: videoRows, error: videosError }, { data: progressRows, error: progressError }] = await Promise.all([
      nextIsAdmin ? videosQuery : videosQuery.eq("is_published", true),
      client.from("video_progress").select("video_id, completed").eq("email", normalizedEmail)
    ]);

    if (videosError || progressError) {
      Alert.alert("Chargement incomplet", videosError?.message ?? progressError?.message);
    }

    setHasAccess(true);
    setIsAdmin(nextIsAdmin);
    setVideos((videoRows as Video[] | null) ?? []);
    setProgress(
      (progressRows ?? []).reduce<ProgressByVideo>((acc, item) => {
        acc[item.video_id] = item.completed;
        return acc;
      }, {})
    );
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

  async function signOut() {
    await AsyncStorage.removeItem(STORED_EMAIL_KEY);
    await clearAndroidAutoCatalog();

    setEmail("");
    setHasAccess(false);
    setIsAdmin(false);
    setShowAdmin(false);
    setProgress({});
  }

  if (booting) {
    return (
      <View style={styles.loading}>
        <StatusBar style="dark" />
        <ActivityIndicator color="#C08A3E" size="large" />
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

  return (
    <>
      <StatusBar style="dark" />
      <LibraryScreen
        email={email}
        isAdmin={isAdmin}
        onOpenAdmin={() => setShowAdmin(true)}
        onProgressChange={setProgress}
        onSignOut={signOut}
        progress={progress}
        videos={videos}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: "center",
    backgroundColor: "#F7F1E6",
    flex: 1,
    justifyContent: "center"
  },
  loadingText: {
    color: "#7A6F61",
    fontSize: 14,
    letterSpacing: 0.4,
    marginTop: 14
  },
  denied: {
    alignItems: "center",
    backgroundColor: "#F7F1E6",
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  deniedTitle: {
    color: "#2B2420",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 10,
    textAlign: "center"
  },
  deniedText: {
    color: "#7A6F61",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
    textAlign: "center"
  },
  deniedLink: {
    color: "#C08A3E",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase"
  }
});
