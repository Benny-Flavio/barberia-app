import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";

import { compatto } from "../lib/compatto";
import { supabase } from "../lib/supabase";
import { styles } from "../styles/riepilogoPrenotazioneStyles";

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

const GIORNI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const MESI = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

// "2026-11-03" → "Martedì 3 Novembre 2026" (calcolato sui numeri, senza fuso orario)
const dataLeggibile = (iso: string) => {
  const [a, m, g] = iso.split("-").map(Number);
  const giorno = new Date(Date.UTC(a, m - 1, g)).getUTCDay();
  return `${GIORNI[giorno]} ${g} ${MESI[m - 1]} ${a}`;
};

// Step finale del flusso di prenotazione: sede → servizio → giorno/barbiere/orario → riepilogo
export default function RiepilogoPrenotazione() {
  const p = useLocalSearchParams<{
    sede_id: string;
    nome_sede: string;
    servizio_id: string;
    servizio_nome: string;
    barbiere_id: string;
    barbiere_nome: string;
    data: string;
    ora: string;
  }>();

  // La pagina è pre-renderizzata senza parametri: il contenuto che ne dipende si mostra dopo il mount
  const [montato, setMontato] = useState(false);
  const [servizio, setServizio] = useState<any>(null);
  const [invioInCorso, setInvioInCorso] = useState(false);
  const [errore, setErrore] = useState("");
  const [confermato, setConfermato] = useState(false);

  const contenutoOp = useRef(new Animated.Value(0)).current;
  const successoOp = useRef(new Animated.Value(0)).current;
  const successoScala = useRef(new Animated.Value(0.6)).current;

  const completo = !!(p.sede_id && p.servizio_id && p.barbiere_id && p.data && p.ora);

  useEffect(() => {
    setMontato(true);
    Animated.timing(contenutoOp, { toValue: 1, duration: 450, useNativeDriver: true }).start();
    // Prezzo e durata del servizio scelto (il flusso passa solo id e nome)
    fetch(`${BACKEND_URL}/api/servizi`)
      .then((res) => res.json())
      .then((lista) => {
        if (Array.isArray(lista)) setServizio(lista.find((s: any) => String(s.id) === String(p.servizio_id)) ?? null);
      })
      .catch(() => {});
  }, []);

  // Torna alla scelta di giorno/barbiere/orario con le scelte ancora selezionate
  const modifica = () => {
    if (router.canGoBack()) return router.back();
    // Pagina aperta direttamente (es. dopo un refresh): la scelta-data ripristina dai parametri
    router.replace({
      pathname: "/scelta-data",
      params: {
        sede_id: p.sede_id,
        nome_sede: p.nome_sede,
        servizio_id: p.servizio_id,
        servizio_nome: p.servizio_nome,
        data: p.data,
        barbiere_id: p.barbiere_id,
        ora: p.ora,
      },
    });
  };

  const conferma = async () => {
    if (invioInCorso || confermato) return;
    setErrore("");
    setInvioInCorso(true);
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }
      // Forza refresh del token se prossimo alla scadenza o già scaduto
      if (!session.expires_at || session.expires_at * 1000 < Date.now() + 60000) {
        const refreshed = await supabase.auth.refreshSession();
        if (refreshed.data.session) session = refreshed.data.session;
      }
      const response = await fetch(`${BACKEND_URL}/api/prenotazioni`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sede_id: Number(p.sede_id),
          barbiere_id: Number(p.barbiere_id),
          data: p.data,
          ora: p.ora,
          servizio_id: Number(p.servizio_id),
        }),
      });
      const result = await response.json();
      if (result.success) {
        await AsyncStorage.removeItem("appuntamenti_visti");
        setConfermato(true);
        Animated.parallel([
          Animated.timing(successoOp, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(successoScala, { toValue: 1, friction: 5, useNativeDriver: true }),
        ]).start();
      } else {
        setErrore(result.error || "Impossibile salvare la prenotazione.");
      }
    } catch {
      setErrore("Impossibile collegarsi al server.");
    } finally {
      setInvioInCorso(false);
    }
  };

  // Chiude gli step della prenotazione e riapre la home (anche se la pagina è stata aperta da link)
  const tornaAllaHome = () => {
    if (router.canDismiss()) router.dismissAll();
    router.replace("/home");
  };

  const righe = completo && (
    <View style={styles.card}>
      <View style={styles.cardHero}>
        <Text style={styles.heroData}>{dataLeggibile(p.data)}</Text>
        <Text style={styles.heroOra}>{p.ora}</Text>
        <Text style={styles.heroServizio}>{p.servizio_nome}</Text>
      </View>
      <View style={styles.righe}>
        <View style={styles.riga}>
          <Text style={styles.rigaLabel}>Barbiere</Text>
          <Text style={styles.rigaValore}>{p.barbiere_nome}</Text>
        </View>
        <View style={styles.riga}>
          <Text style={styles.rigaLabel}>Sede</Text>
          <Text style={styles.rigaValore}>{p.nome_sede}</Text>
        </View>
        {servizio?.durata_minuti ? (
          <View style={styles.riga}>
            <Text style={styles.rigaLabel}>Durata</Text>
            <Text style={styles.rigaValore}>{servizio.durata_minuti} min</Text>
          </View>
        ) : null}
        {servizio?.prezzo != null ? (
          <View style={[styles.riga, styles.rigaUltima]}>
            <Text style={styles.rigaLabel}>Prezzo</Text>
            <Text style={styles.rigaPrezzo}>€ {Number(servizio.prezzo).toFixed(0)}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  if (!montato) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        {!completo ? (
          <View style={styles.vuoto}>
            <Text style={styles.vuotoTesto}>Nessuna prenotazione da riepilogare.</Text>
            <Pressable style={[styles.btnConferma, { alignSelf: "stretch" }]} onPress={() => router.replace("/scelta-sede")}>
              <Text style={styles.btnConfermaText}>Nuova Prenotazione</Text>
            </Pressable>
          </View>
        ) : confermato ? (
          <Animated.View style={[styles.successo, { opacity: successoOp }]}>
            <Animated.View style={[styles.successoCerchio, { transform: [{ scale: successoScala }] }]}>
              <Ionicons name="checkmark" size={52} color="#D4AF37" />
            </Animated.View>
            <Text style={styles.successoTitolo}>Appuntamento Confermato!</Text>
            <Text style={styles.successoTesto}>
              Ti aspettiamo a {p.nome_sede}.{"\n"}Trovi l'appuntamento nella sezione Appuntamenti.
            </Text>
            <View style={styles.successoCard}>{righe}</View>
            <View style={[styles.bottoni, { alignSelf: "stretch" }]}>
              <Pressable
                style={({ pressed }) => [styles.btnConferma, pressed && styles.btnConfermaPremuto]}
                onPress={tornaAllaHome}
              >
                <Text style={styles.btnConfermaText}>Torna alla Home</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: contenutoOp }}>
            <View {...compatto("header")} style={styles.header}>
              <Text style={styles.stepLabel}>ULTIMO PASSAGGIO</Text>
              <Text style={styles.title}>Riepilogo</Text>
              <Text style={styles.subtitle}>Controlla i dettagli e conferma</Text>
            </View>

            {righe}

            {errore ? <Text style={styles.errore}>{errore}</Text> : null}

            <View style={styles.bottoni}>
              <Pressable
                style={({ pressed }) => [
                  styles.btnConferma,
                  pressed && styles.btnConfermaPremuto,
                  invioInCorso && styles.btnDisabilitato,
                ]}
                onPress={conferma}
                disabled={invioInCorso}
              >
                {invioInCorso ? (
                  <ActivityIndicator color="#0A0A0A" />
                ) : (
                  <Text style={styles.btnConfermaText}>Conferma Appuntamento</Text>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.btnIndietro, pressed && styles.btnIndietroPremuto]}
                onPress={modifica}
                disabled={invioInCorso}
              >
                <Text style={styles.btnIndietroText}>← Indietro / Modifica</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
