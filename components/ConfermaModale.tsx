import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";

// Modale di conferma nero/oro interno all'app (al posto di window.confirm / Alert di sistema).
// Va messo come ultimo figlio della pagina: copre tutto lo schermo e oscura lo sfondo.
export default function ConfermaModale({
  visibile,
  messaggio,
  testoConferma = "Sì, cancella",
  testoAnnulla = "Indietro",
  inCorso = false,
  errore = "",
  onConferma,
  onAnnulla,
}: {
  visibile: boolean;
  messaggio: string;
  testoConferma?: string;
  testoAnnulla?: string;
  inCorso?: boolean;
  errore?: string;
  onConferma: () => void;
  onAnnulla: () => void;
}) {
  const opacita = useRef(new Animated.Value(0)).current;
  const scala = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visibile) return;
    opacita.setValue(0);
    scala.setValue(0.92);
    Animated.parallel([
      Animated.timing(opacita, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(scala, { toValue: 1, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [visibile]);

  if (!visibile) return null;

  return (
    <Animated.View style={[st.overlay, { opacity: opacita }]}>
      {/* Tocco sullo sfondo = Indietro (non durante l'operazione) */}
      <Pressable style={StyleSheet.absoluteFill} onPress={inCorso ? undefined : onAnnulla} />
      <Animated.View style={[st.box, { transform: [{ scale: scala }] }]}>
        <View style={st.icona}>
          <Ionicons name="trash-outline" size={26} color="#D4AF37" />
        </View>
        <Text style={st.messaggio}>{messaggio}</Text>
        {errore ? <Text style={st.errore}>{errore}</Text> : null}
        <View style={st.bottoni}>
          <Pressable
            style={({ pressed }) => [st.btnAnnulla, pressed && st.btnAnnullaPremuto]}
            onPress={onAnnulla}
            disabled={inCorso}
          >
            <Text style={st.btnAnnullaText}>{testoAnnulla}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [st.btnConferma, pressed && st.btnConfermaPremuto, inCorso && { opacity: 0.7 }]}
            onPress={onConferma}
            disabled={inCorso}
          >
            {inCorso ? <ActivityIndicator color="#0A0A0A" /> : <Text style={st.btnConfermaText}>{testoConferma}</Text>}
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 100,
  },
  box: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#141414",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    padding: 24,
    alignItems: "center",
  },
  icona: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#0A0A0A",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  messaggio: { color: "#FFF", fontSize: 17, fontWeight: "700", textAlign: "center", lineHeight: 24 },
  errore: { color: "#F44336", fontSize: 13, textAlign: "center", marginTop: 10 },
  bottoni: { flexDirection: "row", gap: 12, marginTop: 22, alignSelf: "stretch" },
  btnAnnulla: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4AF37",
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    cursor: "pointer" as any,
  },
  btnAnnullaPremuto: { backgroundColor: "#141208" },
  btnAnnullaText: { color: "#D4AF37", fontSize: 15, fontWeight: "700" },
  btnConferma: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer" as any,
  },
  btnConfermaPremuto: { opacity: 0.85 },
  btnConfermaText: { color: "#0A0A0A", fontSize: 15, fontWeight: "800" },
});
