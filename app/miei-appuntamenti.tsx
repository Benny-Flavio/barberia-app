import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
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

import ConfermaModale from "../components/ConfermaModale";
import { compatto } from "../lib/compatto";
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

  // Cancellazione in due passi: "Cancella" apre il modale, "Sì, cancella" elimina davvero
  const [daCancellare, setDaCancellare] = useState<number | null>(null);
  const [cancellazioneInCorso, setCancellazioneInCorso] = useState(false);
  const [erroreCancellazione, setErroreCancellazione] = useState("");

  const chiudiModale = () => {
    if (cancellazioneInCorso) return;
    setDaCancellare(null);
    setErroreCancellazione("");
  };

  const confermaCancellazione = async () => {
    if (daCancellare == null) return;
    setCancellazioneInCorso(true);
    setErroreCancellazione("");
    try {
      const tkn = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/prenotazioni/${daCancellare}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tkn}` },
      });
      // 404 = già cancellata: in entrambi i casi la lista va riallineata
      if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        setErroreCancellazione(data.error || "Impossibile cancellare. Riprova.");
        return;
      }
      setPrenotazioni((prev) => prev.filter((p) => p.id !== daCancellare));
      setDaCancellare(null);
      carica();
    } catch {
      setErroreCancellazione("Impossibile collegarsi al server.");
    } finally {
      setCancellazioneInCorso(false);
    }
  };

  const GIORNI = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  // "Mar 3 Novembre"
  const fmtData = (d: string) => {
    const dt = new Date(d);
    return `${GIORNI[dt.getDay()]} ${dt.getDate()} ${MESI[dt.getMonth()]}`;
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={{ flex: 1, padding: 24 }}>
      <Animated.View {...compatto("header")} style={[st.header, { opacity: headerOp }]}>
        <Pressable onPress={() => router.back()} style={st.backBtn} {...compatto("indietro")}>
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
          <View style={st.emptyIcon}>
            <Ionicons name="calendar-clear-outline" size={30} color="#D4AF37" />
          </View>
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
              <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
              <Text style={st.confirmText}>
                {(() => {
                  const n = prenotazioni.filter(p => p.stato === "attivo").length;
                  return `Hai ${n} appuntament${n === 1 ? "o confermato" : "i confermati"}`;
                })()}
              </Text>
            </View>
          )}
          <FlatList
            data={prenotazioni}
            keyExtractor={(i) => i.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => {
              const isCancellato = item.stato === "cancellato";
              const barrato = isCancellato && st.testoBarrato;
              return (
                <View style={[st.card, isCancellato && st.cardCancellata]}>
                  <View style={st.cardRow}>
                    {/* Informazioni: servizio e data/ora in evidenza, poi barbiere e sede allineati */}
                    <View style={st.cardInfo}>
                      <Text style={[st.cardServ, barrato]}>{item.servizio_nome}</Text>
                      <View style={st.dataOra}>
                        <Ionicons name="calendar-outline" size={15} color={isCancellato ? "#555" : "#D4AF37"} />
                        <Text style={[st.dataOraText, barrato]}>
                          {fmtData(item.data)} · {item.ora?.slice(0, 5)}
                        </Text>
                      </View>
                      <View style={st.dettaglio}>
                        <Ionicons name="person-outline" size={14} color="#777" />
                        <Text style={st.dettaglioLabel}>Barbiere</Text>
                        <Text style={st.dettaglioValore}>{item.barbiere_nome}</Text>
                      </View>
                      <View style={st.dettaglio}>
                        <Ionicons name="location-outline" size={14} color="#777" />
                        <Text style={st.dettaglioLabel}>Sede</Text>
                        <Text style={st.dettaglioValore}>{item.sede_nome}</Text>
                      </View>
                    </View>
                    {/* Prezzo separato dalla stessa linea sottile delle card servizi */}
                    {item.servizio_prezzo != null && (
                      <View style={st.priceBox}>
                        <Text style={[st.priceSymbol, isCancellato && st.priceSpento]}>€</Text>
                        <Text style={[st.cardPrice, isCancellato && st.priceSpento]}>
                          {Number(item.servizio_prezzo).toFixed(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={st.cardFoot}>
                    <View style={[st.statoChip, isCancellato && st.statoChipCancellato]}>
                      <Ionicons
                        name={isCancellato ? "close-circle-outline" : "checkmark-circle-outline"}
                        size={14}
                        color={isCancellato ? "#F44336" : "#4CAF50"}
                      />
                      <Text style={[st.statoText, isCancellato && { color: "#F44336" }]}>
                        {isCancellato ? "Cancellato" : "Confermato"}
                      </Text>
                    </View>
                    {isCancellato ? (
                      <Text style={st.notaCancellato}>Assenza barbiere</Text>
                    ) : (
                      <Pressable
                        style={({ pressed }) => [st.cancelBtn, pressed && st.cancelBtnPremuto]}
                        onPress={() => setDaCancellare(item.id)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#F44336" />
                        <Text style={st.cancelText}>Cancella</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
      </View>

      <ConfermaModale
        visibile={daCancellare != null}
        messaggio="Sei sicuro di voler cancellare questo appuntamento?"
        inCorso={cancellazioneInCorso}
        errore={erroreCancellazione}
        onAnnulla={chiudiModale}
        onConferma={confermaCancellazione}
      />
    </SafeAreaView>
  );
}
