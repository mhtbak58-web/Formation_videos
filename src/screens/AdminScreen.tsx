import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";
import { Video } from "../types";

type Props = {
  onBack: () => void;
  onChanged: () => Promise<void>;
};

type AllowedEmail = {
  email: string;
  note: string | null;
};

type VideoForm = {
  title: string;
  description: string;
  category: string;
  duration: string;
  playbackUrl: string;
};

const emptyVideoForm: VideoForm = {
  title: "",
  description: "",
  category: "General",
  duration: "",
  playbackUrl: ""
};

export function AdminScreen({ onBack, onChanged }: Props) {
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [videoForm, setVideoForm] = useState<VideoForm>(emptyVideoForm);
  const [videos, setVideos] = useState<Video[]>([]);

  async function loadAdminData() {
    if (!supabase) {
      return;
    }

    setLoading(true);
    const [{ data: emailRows, error: emailsError }, { data: videoRows, error: videosError }] = await Promise.all([
      supabase.from("allowed_emails").select("email, note").order("created_at", { ascending: false }),
      supabase.from("videos").select("*").order("sort_order", { ascending: true })
    ]);

    if (emailsError || videosError) {
      Alert.alert("Chargement admin impossible", emailsError?.message ?? videosError?.message);
    }

    setAllowedEmails((emailRows as AllowedEmail[] | null) ?? []);
    setVideos((videoRows as Video[] | null) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function addAllowedEmail() {
    if (!supabase) {
      return;
    }

    const normalizedEmail = emailInput.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) {
      Alert.alert("Email invalide", "Entre une adresse email valide.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("allowed_emails").insert({ email: normalizedEmail });
    setSaving(false);

    if (error) {
      Alert.alert("Ajout impossible", error.message);
      return;
    }

    setEmailInput("");
    await loadAdminData();
  }

  async function removeAllowedEmail(email: string) {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.from("allowed_emails").delete().eq("email", email);
    if (error) {
      Alert.alert("Suppression impossible", error.message);
      return;
    }

    await loadAdminData();
  }

  async function addVideo() {
    if (!supabase) {
      return;
    }

    if (!videoForm.title.trim() || !videoForm.playbackUrl.trim()) {
      Alert.alert("Video incomplete", "Le titre et l'URL de lecture sont obligatoires.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("videos").insert({
      title: videoForm.title.trim(),
      description: videoForm.description.trim() || null,
      category: videoForm.category.trim() || "General",
      duration_minutes: videoForm.duration ? Number(videoForm.duration) : null,
      playback_url: videoForm.playbackUrl.trim(),
      sort_order: videos.length + 1,
      is_published: true
    });
    setSaving(false);

    if (error) {
      Alert.alert("Ajout video impossible", error.message);
      return;
    }

    setVideoForm(emptyVideoForm);
    await loadAdminData();
    await onChanged();
  }

  async function toggleVideo(video: Video) {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.from("videos").update({ is_published: !video.is_published }).eq("id", video.id);
    if (error) {
      Alert.alert("Modification impossible", error.message);
      return;
    }

    await loadAdminData();
    await onChanged();
  }

  async function deleteVideo(video: Video) {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.from("videos").delete().eq("id", video.id);
    if (error) {
      Alert.alert("Suppression impossible", error.message);
      return;
    }

    await loadAdminData();
    await onChanged();
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563eb" size="large" />
        <Text style={styles.loadingText}>Chargement admin...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Administration</Text>
          <Text style={styles.heading}>Gestion du contenu</Text>
        </View>
        <Pressable onPress={onBack} style={styles.outlineButton}>
          <Text style={styles.outlineText}>Retour</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emails autorises</Text>
          <View style={styles.inlineForm}>
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmailInput}
              placeholder="email@exemple.com"
              style={[styles.input, styles.inlineInput]}
              value={emailInput}
            />
            <Pressable disabled={saving} onPress={addAllowedEmail} style={styles.primaryButton}>
              <Text style={styles.primaryText}>Ajouter</Text>
            </Pressable>
          </View>
          {allowedEmails.map((item) => (
            <View key={item.email} style={styles.row}>
              <Text style={styles.rowText}>{item.email}</Text>
              <Pressable onPress={() => removeAllowedEmail(item.email)} style={styles.dangerButton}>
                <Text style={styles.dangerText}>Supprimer</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nouvelle video</Text>
          <TextInput onChangeText={(title) => setVideoForm((current) => ({ ...current, title }))} placeholder="Titre" style={styles.input} value={videoForm.title} />
          <TextInput onChangeText={(category) => setVideoForm((current) => ({ ...current, category }))} placeholder="Categorie" style={styles.input} value={videoForm.category} />
          <TextInput
            keyboardType="number-pad"
            onChangeText={(duration) => setVideoForm((current) => ({ ...current, duration }))}
            placeholder="Duree en minutes"
            style={styles.input}
            value={videoForm.duration}
          />
          <TextInput
            multiline
            onChangeText={(description) => setVideoForm((current) => ({ ...current, description }))}
            placeholder="Description"
            style={[styles.input, styles.textArea]}
            value={videoForm.description}
          />
          <TextInput
            autoCapitalize="none"
            onChangeText={(playbackUrl) => setVideoForm((current) => ({ ...current, playbackUrl }))}
            placeholder="URL de lecture video"
            style={styles.input}
            value={videoForm.playbackUrl}
          />
          <Pressable disabled={saving} onPress={addVideo} style={styles.primaryButton}>
            <Text style={styles.primaryText}>Publier la video</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Videos</Text>
          {videos.map((video) => (
            <View key={video.id} style={styles.videoRow}>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                <Text style={styles.videoMeta}>{video.category} · {video.is_published ? "Publiee" : "Brouillon"}</Text>
              </View>
              <View style={styles.actions}>
                <Pressable onPress={() => toggleVideo(video)} style={styles.outlineButton}>
                  <Text style={styles.outlineText}>{video.is_published ? "Masquer" : "Publier"}</Text>
                </Pressable>
                <Pressable onPress={() => deleteVideo(video)} style={styles.dangerButton}>
                  <Text style={styles.dangerText}>Supprimer</Text>
                </Pressable>
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
    backgroundColor: "#f8fafc",
    flex: 1
  },
  loading: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    flex: 1,
    justifyContent: "center"
  },
  loadingText: {
    color: "#475569",
    marginTop: 12
  },
  header: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  eyebrow: {
    color: "#2563eb",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  heading: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "900"
  },
  content: {
    gap: 16,
    padding: 16,
    paddingBottom: 36
  },
  section: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: "900"
  },
  inlineForm: {
    flexDirection: "row",
    gap: 8
  },
  inlineInput: {
    flex: 1
  },
  input: {
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#0f172a",
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  textArea: {
    minHeight: 84,
    textAlignVertical: "top"
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 14
  },
  primaryText: {
    color: "#ffffff",
    fontWeight: "800"
  },
  outlineButton: {
    alignItems: "center",
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 12
  },
  outlineText: {
    color: "#0f172a",
    fontSize: 13,
    fontWeight: "800"
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 12
  },
  dangerText: {
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "800"
  },
  row: {
    alignItems: "center",
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    paddingTop: 10
  },
  rowText: {
    color: "#0f172a",
    flex: 1,
    fontSize: 14,
    fontWeight: "700"
  },
  videoRow: {
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    gap: 10,
    paddingTop: 12
  },
  videoInfo: {
    gap: 2
  },
  videoTitle: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800"
  },
  videoMeta: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700"
  },
  actions: {
    flexDirection: "row",
    gap: 8
  }
});
