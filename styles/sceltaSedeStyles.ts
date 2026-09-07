import { Platform, StyleSheet } from "react-native";

export const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A", padding: 24 },
  header: { marginTop: 20, marginBottom: 30 },
  backBtn: { marginBottom: 20, cursor: "pointer" as any },
  backText: { color: "#D4AF37", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "800", color: "#FFF", marginBottom: 6 },
  subtitle: { fontSize: 15, color: "#555" },
  sediList: { gap: 14 },
  sedeCard: {
    backgroundColor: "#141414",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  sedeCardPressed: {
    borderColor: "#D4AF37",
    backgroundColor: "#1A1A0A",
    transform: [{ scale: 0.98 }],
  },
  sedeIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(212,175,55,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  sedeName: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 2,
  },
  sedeAddr: { color: "#666", fontSize: 13 },
  sedeArrow: { color: "#D4AF37", fontSize: 28, fontWeight: "300" },
});
