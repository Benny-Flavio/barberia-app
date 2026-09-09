import { StyleSheet } from "react-native";

export const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { marginTop: 20, marginBottom: 24 },
  backBtn: { marginBottom: 20, cursor: "pointer" as any },
  backText: { color: "#D4AF37", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "800", color: "#FFF", marginBottom: 6 },
  subtitle: { fontSize: 15, color: "#555" },

  msgList: { gap: 12 },
  msgCard: {
    backgroundColor: "#141414",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },
  msgCardUnread: {
    borderColor: "rgba(212,175,55,0.3)",
    backgroundColor: "#141208",
  },
  msgHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  msgIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  msgIconAlert: { backgroundColor: "rgba(244,67,54,0.1)" },
  msgIconInfo: { backgroundColor: "rgba(212,175,55,0.1)" },
  msgFrom: { fontSize: 14, fontWeight: "700", color: "#FFF" },
  msgDate: { fontSize: 11, color: "#555", marginTop: 2 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D4AF37",
  },
  msgText: { fontSize: 14, color: "#AAA", lineHeight: 20 },

  emptyBox: { alignItems: "center", marginTop: 60 },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(212,175,55,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySub: {
    color: "#555",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
});
