import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../lib/theme";

export type TabKey = "accueil" | "categories" | "mescours" | "favoris" | "profil";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "accueil", label: "Accueil", icon: "⌂" },
  { key: "categories", label: "Categories", icon: "▦" },
  { key: "mescours", label: "Mes cours", icon: "▶" },
  { key: "favoris", label: "Favoris", icon: "♡" },
  { key: "profil", label: "Profil", icon: "◍" }
];

type Props = {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
};

export function BottomTabBar({ activeTab, onChange }: Props) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <Pressable key={tab.key} onPress={() => onChange(tab.key)} style={styles.tab}>
            <Text style={[styles.icon, active && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            {active ? <View style={styles.activeDot} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    paddingBottom: 10,
    paddingTop: 10
  },
  tab: {
    alignItems: "center",
    flex: 1,
    gap: 3
  },
  icon: {
    color: colors.textMuted,
    fontSize: 20
  },
  iconActive: {
    color: colors.primary
  },
  label: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700"
  },
  labelActive: {
    color: colors.primary
  },
  activeDot: {
    backgroundColor: colors.primary,
    borderRadius: 2,
    height: 3,
    marginTop: 2,
    width: 14
  }
});
