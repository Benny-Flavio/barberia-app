import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  Text,
  View
} from "react-native";

import { st } from "../styles/sceltaSedeStyles";

const FOTO_COLONNA = require("../assets/images/sede-colonna.webp");
const FOTO_FRASCATI = require("../assets/images/sede-frascati.webp");

export default function SceltaSede() {
  const headerOp = useRef(new Animated.Value(0)).current;
  const btn1Op = useRef(new Animated.Value(0)).current;
  const btn1Y = useRef(new Animated.Value(30)).current;
  const btn2Op = useRef(new Animated.Value(0)).current;
  const btn2Y = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.timing(headerOp, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(btn1Op, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(btn1Y, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, 200);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(btn2Op, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(btn2Y, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, 350);
  }, []);

  const scegliSede = (id: number, nome: string) => {
    router.push({
      pathname: "/scelta-servizio" as any,
      params: { sede_id: id, nome_sede: nome },
    });
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={{ flex: 1, padding: 24 }}>
        <Animated.View style={[st.header, { opacity: headerOp }]}>
          <Pressable onPress={() => router.back()} style={st.backBtn}>
            <Text style={st.backText}>← Indietro</Text>
          </Pressable>
          <Text style={st.title}>Dove vuoi prenotare?</Text>
          <Text style={st.subtitle}>Scegli la sede</Text>
        </Animated.View>

        <View style={st.sediGrid}>
          {/* Colonna */}
          <Animated.View style={[st.sedeCardWrapper, { opacity: btn1Op, transform: [{ translateY: btn1Y }] }]}>
            <Pressable
              style={({ pressed }) => [st.sedeCard, pressed && st.sedeCardPressed]}
              onPress={() => scegliSede(1, "Colonna")}
            >
              <Image source={FOTO_COLONNA} style={st.sedeImg} resizeMode="cover" />
              <View style={st.sedeCardInfo}>
                <Text style={st.sedeName}>Colonna</Text>
                <Text style={st.sedeAddr}>Via Roma 1, Colonna (RM)</Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Frascati */}
          <Animated.View style={[st.sedeCardWrapper, { opacity: btn2Op, transform: [{ translateY: btn2Y }] }]}>
            <Pressable
              style={({ pressed }) => [st.sedeCard, pressed && st.sedeCardPressed]}
              onPress={() => scegliSede(2, "Frascati")}
            >
              <Image source={FOTO_FRASCATI} style={st.sedeImg} resizeMode="cover" />
              <View style={st.sedeCardInfo}>
                <Text style={st.sedeName}>Frascati</Text>
                <Text style={st.sedeAddr}>Corso Italia 15, Frascati (RM)</Text>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}
