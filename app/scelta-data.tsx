import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";
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
import { Calendar, LocaleConfig } from "react-native-calendars";

import { styles } from "../styles/sceltaDataStyles";

LocaleConfig.locales["it"] = {
  monthNames: [
    "Gennaio",
    "Febbraio",
    "Marzo",
    "Aprile",
    "Maggio",
    "Giugno",
    "Luglio",
    "Agosto",
    "Settembre",
    "Ottobre",
    "Novembre",
    "Dicembre",
  ],
  monthNamesShort: [
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
  ],
  dayNames: [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"],
  today: "Oggi",
};
LocaleConfig.defaultLocale = "it";

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

export default function SceltaData() {
  const { sede_id, nome_sede, servizio_id, servizio_nome } =
    useLocalSearchParams();

  const [barbieri, setBarbieri] = useState<any[]>([]);
  const [barbiereSelezionato, setBarbiereSelezionato] = useState<any>(null);
  const [dataSelezionata, setDataSelezionata] = useState<string>("");
  const [oraSelezionata, setOraSelezionata] = useState<string>("");
  const [orariDisponibili, setOrariDisponibili] = useState<string[]>([]);
  const [loadingOrari, setLoadingOrari] = useState(false);
  const [loadingBarbieri, setLoadingBarbieri] = useState(false);
  const [invioInCorso, setInvioInCorso] = useState(false);
  const [errore, setErrore] = useState("");
  const [barbieriMsg, setBarbieriMsg] = useState("");

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const step2Opacity = useRef(new Animated.Value(0)).current;
  const step3Opacity = useRef(new Animated.Value(0)).current;
  const riepilogoOpacity = useRef(new Animated.Value(0)).current;

  const oggi = new Date();
  const dataOggiString = oggi.toISOString().split("T")[0];
  const treSettimane = new Date();
  treSettimane.setDate(oggi.getDate() + 21);
  const dataMassimaString = treSettimane.toISOString().split("T")[0];

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!dataSelezionata) return;
    setLoadingBarbieri(true);
    setBarbiereSelezionato(null);
    setOraSelezionata("");
    setOrariDisponibili([]);
    setBarbieriMsg("");
    setErrore("");

    fetch(
      `${BACKEND_URL}/api/barbieri-disponibili?sede_id=${sede_id}&data=${dataSelezionata}`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.messaggio) {
          setBarbieri([]);
          setBarbieriMsg(data.messaggio);
        } else {
          setBarbieri(data);
          Animated.timing(step2Opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        }
        setLoadingBarbieri(false);
      })
      .catch((err) => {
        console.log(err);
        setLoadingBarbieri(false);
      });
  }, [dataSelezionata]);

  const [federicoSoloChiamata, setFedericoSoloChiamata] = useState(false);

  useEffect(() => {
    if (!barbiereSelezionato || !dataSelezionata) return;

    const giornoSett = new Date(dataSelezionata).getDay();
    if (
      barbiereSelezionato.nome === "Federico" &&
      (giornoSett === 5 || giornoSett === 6)
    ) {
      setFedericoSoloChiamata(true);
      setOrariDisponibili([]);
      setOraSelezionata("");
      Animated.timing(step3Opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
      return;
    }

    setFedericoSoloChiamata(false);
    setLoadingOrari(true);
    setOraSelezionata("");

    fetch(
      `${BACKEND_URL}/api/orari-disponibili?barbiere_id=${barbiereSelezionato.id}&data=${dataSelezionata}&servizio_id=${servizio_id}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setOrariDisponibili(data);
        Animated.timing(step3Opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
        setLoadingOrari(false);
      })
      .catch((err) => {
        console.log(err);
        setLoadingOrari(false);
      });
  }, [barbiereSelezionato, dataSelezionata]);

  useEffect(() => {
    if (oraSelezionata) {
      Animated.timing(riepilogoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [oraSelezionata]);

  const confermaPrenotazione = async () => {
    if (!dataSelezionata || !oraSelezionata || !barbiereSelezionato) {
      setErrore("Scegli una data, un barbiere e un orario.");
      return;
    }
    setInvioInCorso(true);
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }
      // Forza refresh del token se prossimo alla scadenza o già scaduto
      if (!session.expires_at || session.expires_at * 1000 < Date.now() + 60000) {
        const refreshed = await supabase.auth.refreshSession();
        if (refreshed.data.session) session = refreshed.data.session;
      }
      const token = session.access_token;
      const response = await fetch(`${BACKEND_URL}/api/prenotazioni`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sede_id: Number(sede_id),
          barbiere_id: barbiereSelezionato.id,
          data: dataSelezionata,
          ora: oraSelezionata,
          servizio_id: Number(servizio_id),
        }),
      });
      const result = await response.json();
      if (result.success) {
        await AsyncStorage.removeItem("appuntamenti_visti");
        router.push({
          pathname: "/home",
          params: { sede_id: String(sede_id), nome_sede: String(nome_sede) },
        });
      } else {
        setErrore(result.error || "Impossibile salvare.");
      }
    } catch (error) {
      setErrore("Impossibile collegarsi al server.");
    } finally {
      setInvioInCorso(false);
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    for (let i = 0; i < 80; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const giorno = d.getDay();
      if (giorno === 0 || giorno === 1) {
        const anno = d.getFullYear();
        const mese = String(d.getMonth() + 1).padStart(2, "0");
        const gg = String(d.getDate()).padStart(2, "0");
        const key = `${anno}-${mese}-${gg}`;
        marked[key] = { disabled: true, disableTouchEvent: true };
      }
    }
    if (dataSelezionata)
      marked[dataSelezionata] = {
        ...marked[dataSelezionata],
        selected: true,
        selectedColor: "#D4AF37",
      };
    return marked;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Indietro</Text>
          </Pressable>
          <Text style={styles.title}>Prenota Appuntamento</Text>
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>📍 {nome_sede}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>✂️ {servizio_nome}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.stepContainer}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Scegli il Giorno</Text>
          </View>
          <View style={styles.calendarContainer}>
            <Calendar
              firstDay={1}
              minDate={dataOggiString}
              maxDate={dataMassimaString}
              onDayPress={(day: any) => setDataSelezionata(day.dateString)}
              markedDates={getMarkedDates()}
              theme={{
                backgroundColor: "#0A0A0A",
                calendarBackground: "#141414",
                textSectionTitleColor: "#D4AF37",
                selectedDayBackgroundColor: "#D4AF37",
                selectedDayTextColor: "#0A0A0A",
                todayTextColor: "#D4AF37",
                dayTextColor: "#FFF",
                textDisabledColor: "#333",
                monthTextColor: "#D4AF37",
                arrowColor: "#D4AF37",
                textMonthFontWeight: "bold",
              }}
            />
          </View>
        </View>

        {dataSelezionata ? (
          <Animated.View
            style={[styles.stepContainer, { opacity: step2Opacity }]}
          >
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Scegli il Barbiere</Text>
            </View>
            {loadingBarbieri ? (
              <ActivityIndicator
                color="#D4AF37"
                size="small"
                style={{ marginVertical: 20 }}
              />
            ) : barbieri.length === 0 ? (
              <Text style={styles.emptyText}>{barbieriMsg || "Nessun barbiere disponibile"}</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
              >
                {barbieri.map((b) => {
                  const isDisab = b.disabilitato || b.assente;
                  const isSelected = barbiereSelezionato?.id === b.id && !isDisab;
                  return (
                    <Pressable
                      key={b.id}
                      style={[
                        styles.barberCard,
                        isSelected && styles.barberCardSelected,
                        isDisab && { opacity: 0.38 },
                      ]}
                      onPress={() => !isDisab && setBarbiereSelezionato(b)}
                    >
                      <View
                        style={[
                          styles.barberAvatar,
                          isSelected && styles.barberAvatarSelected,
                        ]}
                      >
                        <Text style={styles.barberAvatarText}>💈</Text>
                      </View>
                      <Text
                        style={[
                          styles.barberName,
                          isSelected && styles.barberNameSelected,
                        ]}
                      >
                        {b.nome}
                      </Text>
                      {isDisab && (
                        <Text style={{ color: "#E5734A", fontSize: 9, textAlign: "center", marginTop: 2, fontWeight: "700", letterSpacing: 0.5 }}>
                          ASSENTE
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </Animated.View>
        ) : null}

        {barbiereSelezionato ? (
          <Animated.View
            style={[styles.stepContainer, { opacity: step3Opacity }]}
          >
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Scegli l'Orario</Text>
            </View>
            {federicoSoloChiamata ? (
              <View style={styles.chiamataBox}>
                <Text style={{ fontSize: 28, marginBottom: 12 }}>📞</Text>
                <Text style={styles.chiamataTitle}>Solo su chiamata</Text>
                <Text style={styles.chiamataText}>
                  Per prenotare con Federico il{" "}
                  {new Date(dataSelezionata).getDay() === 5
                    ? "Venerdì"
                    : "Sabato"}
                  , contatta la sede di{" "}
                  {new Date(dataSelezionata).getDay() === 5
                    ? "Frascati"
                    : "Colonna"}
                  .
                </Text>
                <View style={styles.chiamataNumero}>
                  <Text style={styles.chiamataNumeroText}>
                    📞{" "}
                    {new Date(dataSelezionata).getDay() === 5
                      ? "06 7654321"
                      : "06 1234567"}
                  </Text>
                </View>
                <Text style={styles.chiamataSede}>
                  📍 Sede{" "}
                  {new Date(dataSelezionata).getDay() === 5
                    ? "Frascati"
                    : "Colonna"}
                </Text>
              </View>
            ) : loadingOrari ? (
              <ActivityIndicator
                color="#D4AF37"
                size="small"
                style={{ marginVertical: 20 }}
              />
            ) : orariDisponibili.length === 0 ? (
              <Text style={styles.emptyText}>Nessun orario disponibile</Text>
            ) : (
              <View style={styles.timeGrid}>
                {orariDisponibili.map((ora) => (
                  <Pressable
                    key={ora}
                    style={[
                      styles.timeBtn,
                      oraSelezionata === ora && styles.timeBtnSelected,
                    ]}
                    onPress={() => setOraSelezionata(ora)}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        oraSelezionata === ora && styles.timeTextSelected,
                      ]}
                    >
                      {ora}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>
        ) : null}

        {oraSelezionata ? (
          <Animated.View
            style={[styles.riepilogo, { opacity: riepilogoOpacity }]}
          >
            <Text style={styles.riepilogoTitle}>Riepilogo</Text>
            <View style={styles.riepilogoRow}>
              <Text style={styles.riepilogoLabel}>Sede</Text>
              <Text style={styles.riepilogoValue}>{nome_sede}</Text>
            </View>
            <View style={styles.riepilogoRow}>
              <Text style={styles.riepilogoLabel}>Servizio</Text>
              <Text style={styles.riepilogoValue}>{servizio_nome}</Text>
            </View>
            <View style={styles.riepilogoRow}>
              <Text style={styles.riepilogoLabel}>Barbiere</Text>
              <Text style={styles.riepilogoValue}>
                {barbiereSelezionato?.nome}
              </Text>
            </View>
            <View style={styles.riepilogoRow}>
              <Text style={styles.riepilogoLabel}>Data</Text>
              <Text style={styles.riepilogoValue}>{dataSelezionata}</Text>
            </View>
            <View style={styles.riepilogoRow}>
              <Text style={styles.riepilogoLabel}>Ora</Text>
              <Text style={styles.riepilogoValue}>{oraSelezionata}</Text>
            </View>

            {errore ? (
              <Text style={{ color: "#F44336", fontSize: 13, textAlign: "center", marginBottom: 8 }}>{errore}</Text>
            ) : null}
            <Pressable
              style={[
                styles.confirmBtn,
                invioInCorso && styles.confirmBtnDisabled,
              ]}
              onPress={confermaPrenotazione}
              disabled={invioInCorso}
            >
              <Text style={styles.confirmBtnText}>
                {invioInCorso ? "Invio..." : "Conferma Appuntamento"}
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
