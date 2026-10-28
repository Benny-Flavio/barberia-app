import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  header: { marginTop: 20, marginBottom: 24 },
  stepLabel: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#FFF", marginBottom: 6 },
  subtitle: { fontSize: 15, color: "#555" },

  // Card riepilogo
  card: {
    backgroundColor: "#141414",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    overflow: "hidden",
  },
  cardHero: {
    alignItems: "center",
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  heroData: { color: "#888", fontSize: 13, fontWeight: "600", letterSpacing: 1, textTransform: "uppercase" },
  heroOra: { color: "#D4AF37", fontSize: 44, fontWeight: "900", marginTop: 4 },
  heroServizio: { color: "#FFF", fontSize: 18, fontWeight: "700", marginTop: 6, textAlign: "center" },
  righe: { paddingHorizontal: 22, paddingVertical: 8 },
  riga: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
    gap: 16,
  },
  rigaUltima: { borderBottomWidth: 0 },
  rigaLabel: { color: "#666", fontSize: 14 },
  rigaValore: { color: "#FFF", fontSize: 15, fontWeight: "700", flexShrink: 1, textAlign: "right" },
  rigaPrezzo: { color: "#D4AF37", fontSize: 20, fontWeight: "800" },

  errore: {
    color: "#F44336",
    fontSize: 14,
    textAlign: "center",
    marginTop: 18,
    lineHeight: 20,
  },

  // Bottoni nero/oro
  bottoni: { marginTop: 24, gap: 12 },
  btnConferma: {
    backgroundColor: "#D4AF37",
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    cursor: "pointer" as any,
  },
  btnConfermaPremuto: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnDisabilitato: { opacity: 0.6 },
  btnConfermaText: { color: "#0A0A0A", fontSize: 17, fontWeight: "800", letterSpacing: 0.5 },
  btnIndietro: {
    backgroundColor: "#0A0A0A",
    paddingVertical: 17,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D4AF37",
    alignItems: "center",
    cursor: "pointer" as any,
  },
  btnIndietroPremuto: { backgroundColor: "#141208" },
  btnIndietroText: { color: "#D4AF37", fontSize: 16, fontWeight: "700" },

  // Schermata di successo
  successo: { alignItems: "center", paddingTop: 40 },
  successoCerchio: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: "#D4AF37",
    backgroundColor: "rgba(212,175,55,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successoTitolo: { color: "#FFF", fontSize: 26, fontWeight: "900", textAlign: "center" },
  successoTesto: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 28,
  },
  successoCard: { alignSelf: "stretch" },

  // Parametri mancanti (pagina aperta senza passare dal flusso)
  vuoto: { alignItems: "center", paddingTop: 60 },
  vuotoTesto: { color: "#888", fontSize: 15, textAlign: "center", marginBottom: 24 },
});
