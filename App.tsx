import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Session } from "@supabase/supabase-js";
import { demoVideos } from "./src/data";
import { clearAndroidAutoCatalog, publishAndroidAutoCatalog } from "./src/lib/androidAuto";
import { hasSupabaseConfig, supabase } from "./src/lib/supabase";
import { AdminScreen } from "./src/screens/AdminScreen";
import { AuthScreen } from "./src/screens/AuthScreen";
import { LibraryScreen } from "./src/screens/LibraryScreen";
import { ProgressByVideo, Video } from "./src/types";

export default function App() {
  const [booting, setBooting] = useState(true);
  const [email, setEmail] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [progress, setProgress] = useState<ProgressByVideo>({});
  const [session, setSession] = useState<Session | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [videos, setVideos] = useState<Video[]>(demoVideos);

  async function loadPrivateContent(currentSession: Session) {
    const client = supabase;
    const userEmail = currentSession.user.email?.toLowerCase();

    if (!client || !userEmail) {
      return;
    }

    setBooting(true);

    const [{ data: allowed, error: allowedError }, { data: admin, error: adminError }] = await Promise.all([
      client.from("allowed_emails").select("email").eq("email", userEmail).maybeSingle(),
      client.from("admin_emails").select("email").eq("email", userEmail).maybeSingle()
    ]);

    const nextIsAdmin = Boolean(admin);

    if ((allowedError && allowedError.code !== "PGRST116") || (adminError && adminError.code !== "PGRST116")) {
      Alert.alert("Verification impossible", allowedError?.message ?? adminError?.message);
    }

    if (!allowed && !nextIsAdmin) {
      setEmail(userEmail);
      setHasAccess(false);
      setIsAdmin(false);
      setShowAdmin(false);
      setBooting(false);
      return;
    }

    const videosQuery = client.from("videos").select("*").order("sort_order", { ascending: true });
    const [{ data: videoRows, error: videosError }, { data: progressRows, error: progressError }] = await Promise.all([
      nextIsAdmin ? videosQuery : videosQuery.eq("is_published", true),
      client.from("video_progress").select("video_id, completed").eq("user_id", currentSession.user.id)
    ]);

    if (videosError || progressError) {
      Alert.alert("Chargement incomplet", videosError?.message ?? progressError?.message);
    }

    setEmail(userEmail);
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

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      loadPrivateContent(session);
    }
  }, [session]);

  useEffect(() => {
    if (hasAccess) {
      publishAndroidAutoCatalog(videos);
    }
  }, [videos, hasAccess]);

  async function signOut() {
    if (supabase) {
      await supabase.auth.signOut();
    }

    await clearAndroidAutoCatalog();

    setEmail("");
    setHasAccess(false);
    setIsAdmin(false);
    setSession(null);
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

  if (!session) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthScreen
          demoMode={!hasSupabaseConfig}
          onDemoAccess={() => Alert.alert("Configuration manquante", "Aucun acces direct n'est disponible sans configuration Supabase.")}
        />
      </>
    );
  }

  if (!hasAccess && session) {
    return (
      <View style={styles.denied}>
        <StatusBar style="dark" />
        <Text style={styles.deniedTitle}>Acces non autorise</Text>
        <Text style={styles.deniedText}>L'email {email} n'est pas dans la liste des emails autorises.</Text>
        <Text onPress={signOut} style={styles.deniedLink}>Utiliser un autre email</Text>
      </View>
    );
  }

  if (showAdmin && isAdmin && session) {
    return (
      <>
        <StatusBar style="dark" />
        <AdminScreen onBack={() => setShowAdmin(false)} onChanged={() => loadPrivateContent(session)} />
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
