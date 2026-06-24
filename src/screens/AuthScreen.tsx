import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../lib/supabase";

type Props = {
  demoMode: boolean;
  onDemoAccess: () => void;
};

export function AuthScreen({ demoMode, onDemoAccess }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMagicLink() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
      Alert.alert("Email invalide", "Entre une adresse email valide.");
      return;
    }

    if (!supabase) {
      onDemoAccess();
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: "formationvideos://login"
      }
    });
    setLoading(false);

    if (error) {
      Alert.alert("Connexion impossible", error.message);
      return;
    }

    Alert.alert("Lien envoye", "Consulte ta boite mail pour ouvrir l'application.");
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <Text style={styles.brandPlay}>▶</Text>
        </View>
        <View>
          <Text style={styles.brandName}>Formavideo</Text>
          <Text style={styles.brandTagline}>Apprendre. Progresser. Reussir.</Text>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.kicker}>Acces prive</Text>
        <Text style={styles.title}>Videos instructives</Text>
        <Text style={styles.subtitle}>Connecte-toi avec l'email autorise par l'administrateur.</Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="email@exemple.com"
          placeholderTextColor="#A89A87"
          style={styles.input}
          value={email}
        />

        <Pressable disabled={loading} onPress={sendMagicLink} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>▶</Text>
              <Text style={styles.buttonText}>Recevoir le lien</Text>
            </>
          )}
        </Pressable>

        {demoMode ? (
          <Pressable onPress={onDemoAccess} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Voir la demo locale</Text>
          </Pressable>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: "#F7F1E6",
    flex: 1,
    justifyContent: "center",
    padding: 24
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
    marginBottom: 36
  },
  brandMark: {
    alignItems: "center",
    borderColor: "#C08A3E",
    borderRadius: 14,
    borderWidth: 1.5,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  brandPlay: {
    color: "#C08A3E",
    fontSize: 18
  },
  brandName: {
    color: "#2B2420",
    fontSize: 22,
    fontWeight: "800"
  },
  brandTagline: {
    color: "#8C8377",
    fontSize: 12,
    marginTop: 2
  },
  panel: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAE0D0",
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 440,
    padding: 28,
    shadowColor: "#2B2420",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    width: "100%"
  },
  kicker: {
    color: "#C08A3E",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: "center",
    textTransform: "uppercase"
  },
  title: {
    color: "#2B2420",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center"
  },
  subtitle: {
    color: "#7A6F61",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 26,
    textAlign: "center"
  },
  input: {
    backgroundColor: "#FBF6EC",
    borderColor: "#EAE0D0",
    borderRadius: 999,
    borderWidth: 1,
    color: "#2B2420",
    fontSize: 15,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  button: {
    alignItems: "center",
    backgroundColor: "#C08A3E",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52
  },
  pressed: {
    opacity: 0.86
  },
  buttonIcon: {
    color: "#FFFFFF",
    fontSize: 13
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#EAE0D0",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 14,
    paddingVertical: 13
  },
  secondaryText: {
    color: "#C08A3E",
    fontSize: 14,
    fontWeight: "700"
  }
});
