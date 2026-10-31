import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
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

import { compatto } from "../lib/compatto";
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
const ORO = "#D4AF37";

export default function SceltaData() {
  // data / barbiere_id / ora arrivano solo tornando dal riepilogo dopo un refresh della pagina
  // (senza cronologia): servono a ripristinare le scelte già fatte
  const { sede_id, nome_sede, servizio_id, servizio_nome, data, barbiere_id, ora } =
    useLocalSearchParams();

  const [barbieri, setBarbieri] = useState<any[]>([]);
  const [barbiereSelezionato, setBarbiereSelezionato] = useState<any>(null);
  const [dataSelezionata, setDataSelezionata] = useState<string>("");
  const [oraSelezionata, setOraSelezionata] = useState<string>("");
  const [orariDisponibili, setOrariDisponibili] = useState<string[]>([]);
  const [loadingOrari, setLoadingOrari] = useState(false);
  const [loadingBarbieri, setLoadingBarbieri] = useState(false);
  const [barbieriMsg, setBarbieriMsg] = useState("");

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const step2Opacity = useRef(new Animated.Value(0)).current;
  const step3Opacity = useRef(new Animated.Value(0)).current;
  const daRipristinare = useRef<{ barbiere_id?: string; ora?: string } | null>(null);

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
    // Ripristino dopo il mount (non nello stato iniziale: la pagina è pre-renderizzata senza parametri)
    if (typeof data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
      daRipristinare.current = { barbiere_id: barbiere_id as string, ora: ora as string };
      setDataSelezionata(data);
    }
  }, []);

  useEffect(() => {
    if (!dataSelezionata) return;
    setLoadingBarbieri(true);
    setBarbiereSelezionato(null);
    setOraSelezionata("");
    setOrariDisponibili([]);
    setBarbieriMsg("");

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
          const daRipr = daRipristinare.current?.barbiere_id;
          const barbiere = daRipr && data.find((b: any) => String(b.id) === daRipr && !b.disabilitato);
          if (barbiere) setBarbiereSelezionato(barbiere);
          else daRipristinare.current = null;
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
        const daRipr = daRipristinare.current?.ora;
        if (daRipr && Array.isArray(data) && data.includes(daRipr)) setOraSelezionata(daRipr);
        daRipristinare.current = null;
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

  // Tornando dal riepilogo gli orari si riaggiornano (uno potrebbe essere stato appena preso),
  // senza perdere le scelte: l'orario resta selezionato se è ancora libero
  const sceltaCorrente = useRef({ barbiereSelezionato, dataSelezionata, federicoSoloChiamata });
  sceltaCorrente.current = { barbiereSelezionato, dataSelezionata, federicoSoloChiamata };
  const primoFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primoFocus.current) { primoFocus.current = false; return; }
      const { barbiereSelezionato: b, dataSelezionata: d, federicoSoloChiamata: soloChiamata } = sceltaCorrente.current;
      if (!b || !d || soloChiamata) return;
      fetch(`${BACKEND_URL}/api/orari-disponibili?barbiere_id=${b.id}&data=${d}&servizio_id=${servizio_id}`)
        .then((res) => res.json())
        .then((data) => {
          if (!Array.isArray(data)) return;
          setOrariDisponibili(data);
          setOraSelezionata((prec) => (data.includes(prec) ? prec : ""));
        })
        .catch(() => {});
    }, []),
  );

  // Ultimo step: scelto l'orario si passa al riepilogo. Questa pagina resta nello stack con le
  // scelte fatte, quindi "Indietro / Modifica" ci torna con tutto ancora selezionato
  const vaiAlRiepilogo = (ora: string) => {
    if (!dataSelezionata || !barbiereSelezionato) return;
    setOraSelezionata(ora);
    router.push({
      pathname: "/riepilogo-prenotazione" as any,
      params: {
        sede_id: String(sede_id),
        nome_sede: String(nome_sede),
        servizio_id: String(servizio_id),
        servizio_nome: String(servizio_nome),
        barbiere_id: String(barbiereSelezionato.id),
        barbiere_nome: String(barbiereSelezionato.nome),
        data: dataSelezionata,
        ora,
      },
    });
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Animated.View {...compatto("header")} style={[styles.header, { opacity: headerOpacity }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton} {...compatto("indietro")}>
            <Text style={styles.backButtonText}>← Indietro</Text>
          </Pressable>
          <Text style={styles.title}>Prenota Appuntamento</Text>
          <View style={styles.chipRow}>
            <View style={styles.chip}>
              <Ionicons name="location-outline" size={14} color={ORO} />
              <Text style={styles.chipText}>{nome_sede}</Text>
            </View>
            <View style={styles.chip}>
              <Ionicons name="cut-outline" size={14} color={ORO} />
              <Text style={styles.chipText}>{servizio_nome}</Text>
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
                  // disabilitato = assente tutto il giorno; un permesso blocca solo i suoi orari
                  const isDisab = b.disabilitato;
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
                        <Text
                          style={[
                            styles.barberAvatarText,
                            isSelected && styles.barberAvatarTextSelected,
                          ]}
                        >
                          {b.nome?.[0]?.toUpperCase()}
                        </Text>
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
                <View style={styles.chiamataIcona}>
                  <Ionicons name="call-outline" size={24} color={ORO} />
                </View>
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
                  <Ionicons name="call" size={16} color={ORO} />
                  <Text style={styles.chiamataNumeroText}>
                    {new Date(dataSelezionata).getDay() === 5
                      ? "351 842 0733"
                      : "06 9521 0497"}
                  </Text>
                </View>
                <View style={styles.chiamataSedeRiga}>
                  <Ionicons name="location-outline" size={14} color="#888" />
                  <Text style={styles.chiamataSede}>
                    Sede{" "}
                    {new Date(dataSelezionata).getDay() === 5
                      ? "Frascati"
                      : "Colonna"}
                  </Text>
                </View>
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
                    onPress={() => vaiAlRiepilogo(ora)}
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

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
