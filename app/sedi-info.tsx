import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

import { compatto } from "../lib/compatto";
import { st } from "../styles/sediInfoStyles";

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";
const ORO = "#D4AF37";

// Account Instagram: quelli delle sedi sono PROVVISORI, da sostituire con gli account reali.
// I profili personali dei barbieri vanno aggiunti qui per id (barbieri.id); finché manca,
// l'icona del barbiere porta all'account Instagram della sua sede.
const INSTAGRAM_BARBIERI: Record<number, string> = {
  // 1: "https://www.instagram.com/nome_profilo",
};

const SEDI_INFO = [
  {
    id: 1,
    nome: "Colonna",
    indirizzo: "Via Casilina 27, Colonna (RM)",
    telefono: "06 9521 0497",
    instagram: "https://www.instagram.com/bulldog_colonna",
  },
  {
    id: 2,
    nome: "Frascati",
    indirizzo: "Via S. Martino 9, Frascati (RM)",
    telefono: "351 842 0733",
    instagram: "https://www.instagram.com/bulldog_frascati",
  },
];

const ORARI = [
  { giorno: "Lunedì", ore: null },
  { giorno: "Martedì", ore: "9:00 - 19:00" },
  { giorno: "Mercoledì", ore: "9:00 - 19:00" },
  { giorno: "Giovedì", ore: "12:00 - 22:00" },
  { giorno: "Venerdì", ore: "9:00 - 19:00" },
  { giorno: "Sabato", ore: "9:00 - 19:00" },
  { giorno: "Domenica", ore: null },
];

// Ricerca dell'indirizzo esatto: sullo smartphone il link universale apre l'app Google Maps
const linkMaps = (indirizzo: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(indirizzo)}`;
const linkTelefono = (telefono: string) => `tel:${telefono.replace(/\s/g, "")}`;
const apri = (url: string) => Linking.openURL(url).catch(() => {});

// Giorni di turno nella sede (0=dom … 6=sab): consecutivi → "Mar - Sab", altrimenti "Mar, Gio, Sab"
const GIORNI_BREVI = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const fmtGiorni = (giorni?: number[]) => {
  if (!Array.isArray(giorni) || giorni.length === 0) return null;
  const g = [...giorni].sort((a, b) => a - b);
  const consecutivi = g.length > 2 && g.every((x, i) => i === 0 || x === g[i - 1] + 1);
  return consecutivi
    ? `${GIORNI_BREVI[g[0]]} - ${GIORNI_BREVI[g[g.length - 1]]}`
    : g.map((x) => GIORNI_BREVI[x]).join(", ");
};

export default function SediInfo() {
  const [barbieri, setBarbieri] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sedeAperta, setSedeAperta] = useState<number | null>(null);
  const headerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    caricaBarbieri();
  }, []);

  const caricaBarbieri = async () => {
    try {
      const [b1, b2] = await Promise.all(
        [1, 2].map((id) => fetch(`${BACKEND_URL}/api/barbieri/${id}`).then((r) => r.json())),
      );
      setBarbieri([
        { sede_id: 1, barbieri: Array.isArray(b1) ? b1 : [] },
        { sede_id: 2, barbieri: Array.isArray(b2) ? b2 : [] },
      ]);
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const getBarbieri = (sedeId: number) => {
    const sede = barbieri.find((b) => b.sede_id === sedeId);
    return sede?.barbieri || [];
  };

  return (
    <SafeAreaView style={st.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Animated.View {...compatto("header")} style={[st.header, { opacity: headerOp }]}>
          <Pressable onPress={() => router.back()} style={st.backBtn} {...compatto("indietro")}>
            <Text style={st.backText}>← Indietro</Text>
          </Pressable>
          <Text style={st.title}>Le Nostre Sedi</Text>
          <Text style={st.subtitle}>Scopri dove trovarci</Text>
        </Animated.View>

        {loading ? (
          <ActivityIndicator
            color={ORO}
            size="large"
            style={{ marginTop: 50 }}
          />
        ) : (
          <View style={st.sediList}>
            {SEDI_INFO.map((sede, index) => (
              <SedeCard
                key={sede.id}
                sede={sede}
                index={index}
                barbieri={getBarbieri(sede.id)}
                aperta={sedeAperta === sede.id}
                onToggle={() =>
                  setSedeAperta(sedeAperta === sede.id ? null : sede.id)
                }
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SedeCard({ sede, index, barbieri, aperta, onToggle }: any) {
  const op = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setTimeout(
      () => {
        Animated.parallel([
          Animated.timing(op, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(y, {
            toValue: 0,
            friction: 6,
            useNativeDriver: true,
          }),
        ]).start();
      },
      200 + index * 150,
    );
  }, []);

  return (
    <Animated.View
      style={[st.sedeCard, { opacity: op, transform: [{ translateY: y }] }]}
    >
      <Pressable style={st.sedeHeader} onPress={onToggle}>
        <View style={st.sedeIconBox}>
          <Ionicons name="location-outline" size={24} color={ORO} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.sedeName}>{sede.nome}</Text>
          <Text style={st.sedeAddr}>{sede.indirizzo}</Text>
        </View>
        <Ionicons name={aperta ? "chevron-up" : "chevron-down"} size={20} color={ORO} />
      </Pressable>

      {/* Azioni rapide sempre visibili: Maps, chiamata, Instagram della sede */}
      <View style={st.azioni}>
        <Pressable style={({ pressed }) => [st.azioneBtn, pressed && st.azioneBtnPremuto]} onPress={() => apri(linkMaps(sede.indirizzo))}>
          <Ionicons name="navigate-outline" size={17} color={ORO} />
          <Text style={st.azioneText}>Mappa</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [st.azioneBtn, pressed && st.azioneBtnPremuto]} onPress={() => apri(linkTelefono(sede.telefono))}>
          <Ionicons name="call-outline" size={17} color={ORO} />
          <Text style={st.azioneText}>Chiama</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [st.azioneBtn, st.azioneBtnOro, pressed && st.azioneBtnPremuto]} onPress={() => apri(sede.instagram)}>
          <Ionicons name="logo-instagram" size={17} color="#0A0A0A" />
          <Text style={[st.azioneText, st.azioneTextOro]}>Instagram</Text>
        </Pressable>
      </View>

      {aperta && (
        <View style={st.sedeDetails}>
          <View style={st.divider} />

          <Pressable style={st.detailRow} onPress={() => apri(linkMaps(sede.indirizzo))}>
            <View style={st.detailIconBox}>
              <Ionicons name="map-outline" size={18} color={ORO} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.detailLabel}>Indirizzo</Text>
              <Text style={[st.detailValue, st.detailLink]}>{sede.indirizzo}</Text>
              <Text style={st.detailHint}>Apri in Google Maps</Text>
            </View>
            <Ionicons name="open-outline" size={16} color="#666" />
          </Pressable>

          <Pressable style={st.detailRow} onPress={() => apri(linkTelefono(sede.telefono))}>
            <View style={st.detailIconBox}>
              <Ionicons name="call-outline" size={18} color={ORO} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.detailLabel}>Telefono</Text>
              <Text style={[st.detailValue, st.detailLink]}>{sede.telefono}</Text>
            </View>
          </Pressable>

          <View style={st.detailRow}>
            <View style={st.detailIconBox}>
              <Ionicons name="time-outline" size={18} color={ORO} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.detailLabel}>Orari di apertura</Text>
              {ORARI.map((o) => (
                <View key={o.giorno} style={st.orarioRiga}>
                  <Text style={o.ore ? st.orarioGiorno : st.orarioChiuso}>{o.giorno}</Text>
                  <Text style={o.ore ? st.orarioOre : st.orarioChiuso}>{o.ore ?? "Chiuso"}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={st.divider} />

          <View style={st.barbieriTitleRow}>
            <Ionicons name="cut-outline" size={18} color={ORO} />
            <Text style={st.barbieriTitle}>I nostri barbieri</Text>
          </View>
          <View style={st.barbieriList}>
            {barbieri.map((b: any) => {
              const giorni = fmtGiorni(b.giorni_lavoro);
              return (
                <View key={b.id} style={st.barbiereRiga}>
                  <View style={st.barbiereAvatar}>
                    <Text style={st.barbiereIniziale}>{b.nome?.[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.barbiereName}>{b.nome}</Text>
                    <View style={st.barbiereGiorni}>
                      <Ionicons name="calendar-outline" size={12} color="#777" />
                      <Text style={st.barbiereGiorniText}>{giorni ?? "Giorni in aggiornamento"}</Text>
                    </View>
                  </View>
                  <Pressable
                    style={({ pressed }) => [st.instaBtn, pressed && st.azioneBtnPremuto]}
                    onPress={() => apri(INSTAGRAM_BARBIERI[b.id] ?? sede.instagram)}
                    accessibilityLabel={`Instagram di ${b.nome}`}
                  >
                    <Ionicons name="logo-instagram" size={19} color={ORO} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </Animated.View>
  );
}
