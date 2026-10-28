import { Platform, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { marginTop: 20, marginBottom: 30 },
  backButton: { marginBottom: 20, cursor: "pointer" as any },
  backButtonText: { color: "#D4AF37", fontSize: 14, fontWeight: "600" },
  title: { fontSize: 28, fontWeight: "800", color: "#FFF", marginBottom: 10 },
  sedeChip: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  sedeChipText: { color: "#D4AF37", fontSize: 13, fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#555", marginTop: 15, fontSize: 14 },

  // Section headers
  sectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 14,
    marginTop: 8,
  },

  // Featured grid (2 per row)
  featuredGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  featuredCardWrapper: {
    flexBasis: "47%" as any,
    flexGrow: 1,
  },
  // Senza icona: contenuto centrato in verticale e in orizzontale
  featuredCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#1E1E1E",
    alignItems: "center",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  featuredCardPressed: {
    borderColor: "#D4AF37",
    backgroundColor: "#1A1A0A",
    transform: [{ scale: 0.97 }],
  },
  featuredName: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  // Stessa linea sottile che nelle card a lista separa le informazioni dal prezzo
  featuredDivider: {
    alignSelf: "stretch",
    height: 1,
    backgroundColor: "#1E1E1E",
    marginVertical: 14,
  },
  featuredPriceRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center" },
  featuredPriceSymbol: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
    marginRight: 1,
  },
  featuredPrice: { color: "#D4AF37", fontSize: 24, fontWeight: "800" },

  // List cards (existing)
  cardsContainer: { gap: 12 },
  serviceCard: {
    backgroundColor: "#141414",
    padding: 18,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    ...(Platform.OS === "web" ? { cursor: "pointer" } : {}),
  },
  serviceCardPressed: {
    borderColor: "#D4AF37",
    backgroundColor: "#1A1A0A",
    transform: [{ scale: 0.98 }],
  },
  serviceInfo: { flex: 1, justifyContent: "center", paddingRight: 16 },
  serviceName: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  serviceDesc: { color: "#555", fontSize: 12, lineHeight: 16 },
  // Prezzo separato dal testo da una linea sottile, centrato in verticale nella card
  servicePriceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: "#1E1E1E",
  },
  servicePriceSymbol: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
    marginRight: 1,
  },
  servicePrice: { color: "#D4AF37", fontSize: 28, fontWeight: "800" },
});
