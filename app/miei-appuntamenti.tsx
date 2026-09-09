import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";

import { st } from "../styles/mieiAppuntamentiStyles";

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

export default function MieiAppuntamenti() {
  const [prenotazioni, setPrenotazioni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [showBanner, setShowBanner] = useState(false);
  const headerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    init();

    return () => {
      AsyncStorage.setItem("appuntamenti_visti", "true");
    };
  }, []);

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const t = session?.access_token || "";
    setToken(t);

    const visti = await AsyncStorage.getItem("appuntamenti_visti");
    if (!visti) setShowBanner(true);

    carica(t || "");
  };

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const t = session?.access_token || token;
    if (t && t !== token) setToken(t);
    return t;
  };

  const carica = async (t?: string) => {
    setLoading(true);
    const tkn = t || (await getToken());
    try {
      const res = await fetch(`${BACKEND_URL}/api/prenotazioni/miei`, {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      const data = await res.json();
      setPrenotazioni(Array.isArray(data) ? data : []);
    } catch (err) {}
    setLoading(false);
  };

  const cancella = async (id: number) => {
    try {
      const tkn = await getToken();
      await fetch(`${BACKEND_URL}/api/prenotazioni/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tkn}` },
      });
      carica();
    } catch (err) {}
  };

  const fmtData = (d: string) => {
    const dt = new Date(d);
    const g = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
    const m = [
      "Gen",
      "Feb",
      "Mar",
      "Apr",
      "Mag",
      "Giu",
      "Lug",
      "Ago",
      "Set",
      "Ott",
      "Nov",
      "Dic",
    ];
    return {
      giorno: g[dt.getDay()],
      numero: dt.getDate(),
      mese: m[dt.getMonth()],
    };
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={{ flex: 1, padding: 24 }}>
      <Animated.View style={[st.header, { opacity: headerOp }]}>
        <Pressable onPress={() => router.back()} style={st.backBtn}>
          <Text style={st.backText}>← Indietro</Text>
        </Pressable>
        <Text style={st.title}>I Miei Appuntamenti</Text>
      </Animated.View>

      {loading ? (
        <ActivityIndicator
          color="#D4AF37"
          size="large"
          style={{ marginTop: 50 }}
        />
      ) : prenotazioni.length === 0 ? (
        <View style={st.emptyBox}>
          <Text style={{ fontSize: 50, marginBottom: 16 }}>📋</Text>
          <Text style={st.emptyTitle}>Nessun appuntamento</Text>
          <Text style={st.emptySub}>Prenota il tuo primo taglio!</Text>
          <Pressable
            style={st.ctaBtn}
            onPress={() => router.push("/scelta-sede" as any)}
          >
            <Text style={st.ctaText}>Prenota Ora</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {showBanner && (
            <View style={st.confirmBanner}>
              <Text style={{ fontSize: 18 }}>✅</Text>
              <Text style={st.confirmText}>
                Hai {prenotazioni.length} appuntament
                {prenotazioni.length === 1 ? "o confermato" : "i confermati"}
              </Text>
            </View>
          )}
          <FlatList
            data={prenotazioni}
            keyExtractor={(i) => i.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => {
              const d = fmtData(item.data);
              return (
                <View style={st.card}>
                  <View style={st.cardRow}>
                    <View style={st.dateBox}>
                      <Text style={st.dateDay}>{d.giorno}</Text>
                      <Text style={st.dateNum}>{d.numero}</Text>
                      <Text style={st.dateMon}>{d.mese}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.cardServ}>{item.servizio_nome}</Text>
                      <Text style={st.cardDet}>
                        🕐 {item.ora?.slice(0, 5)} 💈 {item.barbiere_nome}
                      </Text>
                      <Text style={st.sedeTag}>📍 {item.sede_nome}</Text>
                    </View>
                    <Text style={st.cardPrice}>€{item.servizio_prezzo}</Text>
                  </View>
                  <View style={st.cardFoot}>
                    <View style={st.statoChip}>
                      <Text style={st.statoText}>● Confermato</Text>
                    </View>
                    <Pressable
                      style={st.cancelBtn}
                      onPress={() => cancella(item.id)}
                    >
                      <Text style={st.cancelText}>Cancella</Text>
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
      </View>
    </SafeAreaView>
  );
}
