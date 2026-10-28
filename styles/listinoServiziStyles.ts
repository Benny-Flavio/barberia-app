import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { marginTop: 20, marginBottom: 25 },
  backButton: { marginBottom: 20, cursor: "pointer" as any },
  backButtonText: { color: "#D4AF37", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "800", color: "#FFF", marginBottom: 6 },
  subtitle: { fontSize: 15, color: "#555", marginBottom: 20 },
  divider: { height: 2, backgroundColor: "#1E1E1E", borderRadius: 1 },
  cardsContainer: { gap: 14 },
  card: {
    backgroundColor: "#141414",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1E1E1E",
  },
  // Nome a sinistra e prezzo a destra sulla stessa riga, centrati in verticale
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 10,
  },
  cardPriceContainer: { flexDirection: "row", alignItems: "flex-start" },
  cardPriceSymbol: {
    color: "#D4AF37",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 4,
    marginRight: 2,
  },
  cardPrice: { color: "#D4AF37", fontSize: 36, fontWeight: "800" },
  cardNome: { flex: 1, color: "#FFF", fontSize: 20, fontWeight: "700" },
  cardDescrizione: {
    color: "#555",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  cardFooter: { flexDirection: "row" },
  durationChip: {
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  durationText: { color: "#666", fontSize: 13 },
});
