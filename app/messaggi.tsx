import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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

import { compatto } from "../lib/compatto";
import { s } from "../styles/messaggiStyles";

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

// L'inbox raccoglie messaggi automatici sugli appuntamenti e comunicazioni manuali dello staff
type TipoMessaggio = "cancellazione" | "ripristino" | "comunicazione" | "info";
const STILE_TIPO: Record<TipoMessaggio, {
  icona: React.ComponentProps<typeof Ionicons>["name"];
  colore: string;
  bordo: string;
  coloreTitolo: string;
  mittente: string;
}> = {
  cancellazione: { icona: "alert-circle-outline", colore: "#E5734A", bordo: "rgba(229,115,74,0.35)", coloreTitolo: "#E5734A", mittente: "Bulldog Barber Shop" },
  ripristino: { icona: "checkmark-circle-outline", colore: "#D4AF37", bordo: "rgba(212,175,55,0.3)", coloreTitolo: "#D4AF37", mittente: "Bulldog Barber Shop" },
  comunicazione: { icona: "megaphone-outline", colore: "#D4AF37", bordo: "rgba(212,175,55,0.3)", coloreTitolo: "#FFF", mittente: "Staff Bulldog" },
  info: { icona: "notifications-outline", colore: "#D4AF37", bordo: "rgba(212,175,55,0.3)", coloreTitolo: "#FFF", mittente: "Bulldog Barber Shop" },
};
// Il tipo arriva dal backend; per i messaggi creati prima del campo "tipo" si ricava dal testo
const tipoMessaggio = (msg: any): TipoMessaggio => {
  if (msg.tipo && msg.tipo !== "info" && msg.tipo in STILE_TIPO) return msg.tipo;
  if (msg.messaggio?.startsWith("Ci scusiamo per il disagio")) return "cancellazione";
  if (msg.messaggio?.startsWith("Buone notizie!")) return "ripristino";
  return "info";
};

export default function Messaggi() {
  const [messaggi, setMessaggi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const headerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOp, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    caricaMessaggi();
  }, []);

  const caricaMessaggi = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${BACKEND_URL}/api/notifiche`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessaggi(Array.isArray(data) ? data : []);

      // Segna come lette
      await fetch(`${BACKEND_URL}/api/notifiche/lette`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.log(err);
    }
    setLoading(false);
  };

  const formattaData = (d: string) => {
    const dt = new Date(d);
    const giorni = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
    const mesi = [
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
    const ore = dt.getHours().toString().padStart(2, "0");
    const min = dt.getMinutes().toString().padStart(2, "0");
    return `${giorni[dt.getDay()]} ${dt.getDate()} ${mesi[dt.getMonth()]} • ${ore}:${min}`;
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Animated.View {...compatto("header")} style={[s.header, { opacity: headerOp }]}>
          <Pressable onPress={() => router.back()} style={s.backBtn} {...compatto("indietro")}>
            <Text style={s.backText}>← Indietro</Text>
          </Pressable>
          <Text style={s.title}>Messaggi</Text>
          <Text style={s.subtitle}>Comunicazioni dallo staff</Text>
        </Animated.View>

        {loading ? (
          <ActivityIndicator
            color="#D4AF37"
            size="large"
            style={{ marginTop: 50 }}
          />
        ) : messaggi.length === 0 ? (
          <View style={s.emptyBox}>
            <View style={s.emptyIconBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={34} color="#D4AF37" />
            </View>
            <Text style={s.emptyTitle}>Nessun messaggio</Text>
            <Text style={s.emptySub}>
              Qui vedrai le comunicazioni dalla barberia, come variazioni di
              orario, chiusure o avvisi importanti.
            </Text>
          </View>
        ) : (
          <View style={s.msgList}>
            {messaggi.map((msg, index) => (
              <MsgCard
                key={msg.id}
                msg={msg}
                index={index}
                formattaData={formattaData}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MsgCard({ msg, index, formattaData }: any) {
  const op = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(op, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(y, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, index * 80);
  }, []);

  const tipo = tipoMessaggio(msg);
  const stile = STILE_TIPO[tipo];

  const renderTestoFormattato = (testo: string) => {
    if (!testo) return null;
    const parti = testo.split(/(\*\*.*?\*\*)/g);
    return parti.map((parte, i) => {
      if (parte.startsWith("**") && parte.endsWith("**")) {
        return (
          <Text key={i} style={{ fontWeight: "800", color: "#FFF" }}>
            {parte.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={i}>{parte}</Text>;
    });
  };

  return (
    <Animated.View
      style={[
        s.msgCard,
        !msg.letta && s.msgCardUnread,
        { opacity: op, transform: [{ translateY: y }] },
      ]}
    >
      <View style={s.msgHeader}>
        <View style={[s.msgIconBox, { borderColor: stile.bordo }]}>
          <Ionicons name={stile.icona} size={19} color={stile.colore} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.msgFrom}>{stile.mittente}</Text>
          <Text style={s.msgDate}>{formattaData(msg.created_at)}</Text>
        </View>
        {!msg.letta && <View style={s.unreadDot} />}
      </View>
      {msg.titolo ? (
        <Text style={[s.msgTitolo, { color: stile.coloreTitolo }]}>{msg.titolo}</Text>
      ) : null}
      <Text style={s.msgText}>{renderTestoFormattato(msg.messaggio)}</Text>
    </Animated.View>
  );
}
