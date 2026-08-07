import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";

type Props = {
  email: string;
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onSignOut: () => void;
};

export function ProfilScreen({ email, isAdmin, onOpenAdmin, onSignOut }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>◍</Text>
        </View>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.menu}>
          {isAdmin ? (
            <Pressable onPress={onOpenAdmin} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
              <Text style={styles.menuRowText}>Administration</Text>
              <Text style={styles.menuChevron}>›</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={onSignOut} style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
            <Text style={styles.menuRowTextDanger}>Se deconnecter</Text>
            <Text style={styles.menuChevron}>›</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    alignItems: "center",
    padding: 24
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 40,
    height: 80,
    justifyContent: "center",
    marginBottom: 14,
    marginTop: 24,
    width: 80
  },
  avatarIcon: {
    color: "#FFFFFF",
    fontSize: 30
  },
  email: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 28
  },
  menu: {
    alignSelf: "stretch",
    gap: 10
  },
  pressed: {
    opacity: 0.75
  },
  menuRow: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16
  },
  menuRowText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  menuRowTextDanger: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700"
  },
  menuChevron: {
    color: colors.textMuted,
    fontSize: 18
  }
});
