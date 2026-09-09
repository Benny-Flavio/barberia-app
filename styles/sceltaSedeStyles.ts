import { Platform, StyleSheet } from "react-native";

export const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { marginTop: 20, marginBottom: 30 },
  backBtn: { marginBottom: 20, cursor: "pointer" as any },
  backText: { color: "#D4AF37", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "800", color: "#FFF", marginBottom: 6 },
  subtitle: { fontSize: 15, color: "#555" },

  // Grid 2 colonne
  sediGrid: {
    flexDirection: "row",
    gap: 14,
  },
  sedeCardWrapper: {
    flex: 1,
  },
  sedeCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  sedeCardPressed: {
    borderColor: "#D4AF37",
    transform: [{ scale: 0.98 }],
  },
  sedeImg: {
    width: "100%",
    height: 200,
  },
  sedeImgPlaceholder: {
    width: "100%",
    height: 150,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  sedeCardInfo: {
    padding: 16,
  },
  sedeName: {
    color: "#D4AF37",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 4,
  },
  sedeAddr: {
    color: "#555",
    fontSize: 12,
    lineHeight: 17,
  },
});
