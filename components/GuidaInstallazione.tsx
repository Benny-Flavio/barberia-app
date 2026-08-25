import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";

type Device = "telefono" | "computer";
type Piattaforma = "android" | "ios" | "windows" | "mac";

interface Props {
  userId: string;
}

const PASSI: Record<Piattaforma, { emoji: string; testo: string }[]> = {
  ios: [
    { emoji: "🔍", testo: "Assicurati di aprire questo sito con Safari (non Chrome o altri browser)" },
    { emoji: "📤", testo: 'Tocca l\'icona Condividi (□↑) nella barra in basso dello schermo' },
    { emoji: "📋", testo: 'Scorri il menu e tocca "Aggiungi a schermata Home"' },
    { emoji: "✏️", testo: 'Puoi rinominare l\'app, poi tocca "Aggiungi" in alto a destra' },
    { emoji: "✅", testo: "L'app Bulldog Barber Shop apparirà nella tua schermata Home!" },
  ],
  android: [
    { emoji: "🌐", testo: "Assicurati di aprire questo sito con Google Chrome" },
    { emoji: "⋮", testo: "Tocca i tre puntini in alto a destra nella barra del browser" },
    { emoji: "📲", testo: 'Tocca "Aggiungi a schermata Home" oppure "Installa app"' },
    { emoji: "✅", testo: 'Tocca "Aggiungi" per confermare — l\'app è installata!' },
  ],
  windows: [
    { emoji: "🌐", testo: "Apri questo sito su Chrome o Microsoft Edge" },
    { emoji: "📥", testo: "Clicca sull'icona ⊕ nella barra degli indirizzi (in alto a destra)" },
    { emoji: "🖥️", testo: 'Seleziona "Installa Bulldog Barber Shop"' },
    { emoji: "✅", testo: "Clicca Installa — troverai l'app nel menu Start e sul Desktop!" },
  ],
  mac: [
    { emoji: "🌐", testo: "Apri questo sito su Chrome o Safari" },
    { emoji: "📥", testo: "Chrome: clicca sull'icona ⊕ nella barra degli indirizzi\nSafari: vai su File → Aggiungi al Dock" },
    { emoji: "🖥️", testo: 'Clicca su "Installa" o "Aggiungi"' },
    { emoji: "✅", testo: "L'app apparirà nel tuo Dock e nel Launchpad!" },
  ],
};

const LABEL_PIATTAFORMA: Record<Piattaforma, string> = {
  ios: "iPhone / iPad",
  android: "Android",
  windows: "Windows",
  mac: "Mac",
};

export default function GuidaInstallazione({ userId }: Props) {
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState<Device>("telefono");
  const [piattaforma, setPiattaforma] = useState<Piattaforma>("android");
  const [nonMostrare, setNonMostrare] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (!userId) return;
    AsyncStorage.getItem(`guida_pwa_${userId}`).then((val) => {
      if (!val) {
        setVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(slideAnim, { toValue: 0, friction: 7, useNativeDriver: true }),
        ]).start();
      }
    });

    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) { setDevice("telefono"); setPiattaforma("ios"); }
      else if (/android/.test(ua)) { setDevice("telefono"); setPiattaforma("android"); }
      else if (/mac/.test(ua)) { setDevice("computer"); setPiattaforma("mac"); }
      else { setDevice("computer"); setPiattaforma("windows"); }
    }
  }, [userId]);

  const chiudi = async () => {
    if (nonMostrare) {
      await AsyncStorage.setItem(`guida_pwa_${userId}`, "1");
    }
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setVisible(false)
    );
  };

  if (!visible) return null;

  const passi = PASSI[piattaforma];
  const telefPiattaforme: Piattaforma[] = ["android", "ios"];
  const compPiattaforme: Piattaforma[] = ["windows", "mac"];
  const currentGroup = device === "telefono" ? telefPiattaforme : compPiattaforme;

  return (
    <Animated.View
      style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.82)", zIndex: 9999,
        justifyContent: "center", alignItems: "center",
        opacity: fadeAnim,
      }}
      pointerEvents="auto"
    >
      <Animated.View
        style={{
          width: "92%", maxWidth: 480,
          backgroundColor: "#111", borderRadius: 18,
          borderWidth: 1, borderColor: "#2A2A2A",
          maxHeight: "88%",
          transform: [{ translateY: slideAnim }],
          shadowColor: "#000", shadowOpacity: 0.7, shadowRadius: 24, elevation: 20,
        }}
      >
        {/* HEADER */}
        <View style={{ padding: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#1E1E1E" }}>
          <Text style={{ color: "#D4AF37", fontSize: 18, fontWeight: "800", letterSpacing: 0.5, textAlign: "center" }}>
            📲 Aggiungi alla Home
          </Text>
          <Text style={{ color: "#888", fontSize: 12, textAlign: "center", marginTop: 4 }}>
            Installa l'app per accedere più rapidamente
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* TAB DEVICE */}
          <View style={{ flexDirection: "row", margin: 16, marginBottom: 12, backgroundColor: "#1A1A1A", borderRadius: 10, padding: 3 }}>
            {(["telefono", "computer"] as Device[]).map((d) => (
              <Pressable
                key={d}
                onPress={() => {
                  setDevice(d);
                  setPiattaforma(d === "telefono" ? "android" : "windows");
                }}
                style={{
                  flex: 1, paddingVertical: 8, borderRadius: 8,
                  backgroundColor: device === d ? "#D4AF37" : "transparent",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: device === d ? "#0A0A0A" : "#666", fontWeight: "700", fontSize: 13 }}>
                  {d === "telefono" ? "📱 Telefono" : "💻 Computer"}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* TAB PIATTAFORMA */}
          <View style={{ flexDirection: "row", marginHorizontal: 16, marginBottom: 18, gap: 8 }}>
            {currentGroup.map((p) => (
              <Pressable
                key={p}
                onPress={() => setPiattaforma(p)}
                style={{
                  flex: 1, paddingVertical: 7, borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: piattaforma === p ? "#D4AF37" : "#2A2A2A",
                  backgroundColor: piattaforma === p ? "rgba(212,175,55,0.08)" : "transparent",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: piattaforma === p ? "#D4AF37" : "#555", fontWeight: "700", fontSize: 12 }}>
                  {LABEL_PIATTAFORMA[p]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* PASSI */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            {passi.map((passo, i) => (
              <View key={i} style={{ flexDirection: "row", marginBottom: 14, alignItems: "flex-start" }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16,
                  backgroundColor: "#1A1A1A", borderWidth: 1.5, borderColor: "#D4AF37",
                  justifyContent: "center", alignItems: "center", marginRight: 12, flexShrink: 0,
                }}>
                  <Text style={{ color: "#D4AF37", fontWeight: "800", fontSize: 13 }}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22, marginBottom: 2 }}>{passo.emoji}</Text>
                  <Text style={{ color: "#CCC", fontSize: 13, lineHeight: 19 }}>{passo.testo}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* NOTA SPECIFICA */}
          {piattaforma === "ios" && (
            <View style={{ marginHorizontal: 16, marginBottom: 14, backgroundColor: "#1A1A1A", borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: "#D4AF37" }}>
              <Text style={{ color: "#AAA", fontSize: 12, lineHeight: 18 }}>
                ⚠️ Su iPhone e iPad l'installazione funziona <Text style={{ color: "#D4AF37", fontWeight: "700" }}>solo con Safari</Text>. Se stai usando Chrome o Firefox, copia il link e aprilo in Safari.
              </Text>
            </View>
          )}

          {/* NON MOSTRARE PIÙ */}
          <Pressable
            onPress={() => setNonMostrare(!nonMostrare)}
            style={{ flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 20, gap: 10 }}
          >
            <View style={{
              width: 20, height: 20, borderRadius: 5,
              borderWidth: 2, borderColor: nonMostrare ? "#D4AF37" : "#333",
              backgroundColor: nonMostrare ? "#D4AF37" : "transparent",
              justifyContent: "center", alignItems: "center",
            }}>
              {nonMostrare && <Text style={{ color: "#0A0A0A", fontSize: 12, fontWeight: "800" }}>✓</Text>}
            </View>
            <Text style={{ color: "#666", fontSize: 13 }}>Non mostrare più</Text>
          </Pressable>
        </ScrollView>

        {/* BOTTONE CHIUDI */}
        <View style={{ padding: 16, paddingTop: 0 }}>
          <Pressable
            onPress={chiudi}
            style={{ backgroundColor: "#D4AF37", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
          >
            <Text style={{ color: "#0A0A0A", fontWeight: "800", fontSize: 15, letterSpacing: 0.3 }}>
              Ho capito, chiudi
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
