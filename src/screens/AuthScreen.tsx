import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { hasSupabaseConfig } from "../lib/supabase";
import { colors } from "../lib/theme";

type Props = {
  demoMode: boolean;
  onDemoAccess: () => void;
  onSubmit: (email: string) => void;
};

export function AuthScreen({ demoMode, onDemoAccess, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
      Alert.alert("Email invalide", "Entre une adresse email valide.");
      return;
    }

    if (!hasSupabaseConfig) {
      onDemoAccess();
      return;
    }

    setSubmitting(true);
    onSubmit(normalizedEmail);
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
        <Text style={styles.subtitle}>Entre l'email autorise par l'administrateur pour acceder directement.</Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="email@exemple.com"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={email}
        />

        <Pressable disabled={submitting} onPress={handleSubmit} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonIcon}>▶</Text>
              <Text style={styles.buttonText}>Acceder</Text>
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
    backgroundColor: colors.background,
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
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  brandPlay: {
    color: "#FFFFFF",
    fontSize: 18
  },
  brandName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  brandTagline: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2
  },
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    maxWidth: 440,
    padding: 28,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    width: "100%"
  },
  kicker: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: "center",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center"
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 26,
    textAlign: "center"
  },
  input: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 14
  },
  button: {
    alignItems: "center",
    backgroundColor: colors.primary,
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
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 14,
    paddingVertical: 13
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700"
  }
});
