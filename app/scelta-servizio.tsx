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

import { styles } from "../styles/sceltaServizioStyles";

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

const getIcona = (nome: string) => {
  const n = nome.toLowerCase();
  if (n.includes("bimbo") || n.includes("under")) return "👦";
  if (n.includes("taglio") && n.includes("modellatura")) return "💇‍♂️";
  if (n.includes("taglio") && n.includes("rifinitura")) return "✂️";
  if (n.includes("taglio")) return "💈";
  if (n.includes("modellatura") && n.includes("rasatura")) return "🧖‍♂️";
  if (n.includes("modellatura")) return "🪒";
  if (n.includes("rasatura")) return "🧔";
  if (n.includes("rifinitura")) return "✨";
  if (n.includes("trattamento")) return "💆‍♂️";
  return "💈";
};

export default function SceltaServizio() {
  const { sede_id, nome_sede } = useLocalSearchParams();
  const [servizi, setServizi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(headerTranslate, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/servizi`)
      .then((res) => res.json())
      .then((data) => {
        setServizi(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Errore:", err);
        setLoading(false);
      });
  }, []);

  const isGettonato = (nome: string) => {
    const n = nome.trim().toLowerCase();
    return n === "taglio" || n === "rasatura";
  };

  const gettonati = servizi.filter((s) => isGettonato(s.nome));
  const altri = servizi.filter((s) => !isGettonato(s.nome));

  const selezionaServizio = (servizio: any) => {
    router.push({
      pathname: "/scelta-data",
      params: {
        sede_id: String(sede_id),
        nome_sede: String(nome_sede),
        servizio_id: servizio.id,
        servizio_nome: servizio.nome,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslate }],
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Indietro</Text>
          </Pressable>
          <Text style={styles.title}>Cosa facciamo oggi?</Text>
          <View style={styles.sedeChip}>
            <Text style={styles.sedeChipText}>📍 {nome_sede}</Text>
          </View>
        </Animated.View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#D4AF37" size="large" />
            <Text style={styles.loadingText}>Caricamento servizi...</Text>
          </View>
        ) : (
          <View>
            {gettonati.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>— I Più Scelti</Text>
                <View style={styles.featuredGrid}>
                  {gettonati.map((item, index) => (
                    <AnimatedCard
                      key={item.id}
                      item={item}
                      index={index}
                      onPress={selezionaServizio}
                      variant="grid"
                    />
                  ))}
                </View>
              </>
            )}
            {altri.length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { marginTop: 28 }]}>
                  — Altri Servizi
                </Text>
                <View style={styles.cardsContainer}>
                  {altri.map((item, index) => (
                    <AnimatedCard
                      key={item.id}
                      item={item}
                      index={gettonati.length + index}
                      onPress={selezionaServizio}
                      variant="list"
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AnimatedCard({
  item,
  index,
  onPress,
  variant = "list",
}: {
  item: any;
  index: number;
  onPress: (s: any) => void;
  variant?: "list" | "grid";
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    setTimeout(
      () => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(translate, {
            toValue: 0,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
        ]).start();
      },
      200 + index * 100,
    );
  }, []);

  if (variant === "grid") {
    return (
      <Animated.View
        style={[
          styles.featuredCardWrapper,
          { opacity, transform: [{ translateY: translate }] },
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.featuredCard,
            pressed && styles.featuredCardPressed,
          ]}
          onPress={() => onPress(item)}
        >
          <View style={styles.featuredIconContainer}>
            <Text style={styles.featuredIcon}>{getIcona(item.nome)}</Text>
          </View>
          <Text style={styles.featuredName}>{item.nome}</Text>
          <Text style={styles.featuredDuration}>⏳ {item.durata_minuti} min</Text>
          <View style={styles.featuredPriceRow}>
            <Text style={styles.featuredPriceSymbol}>€</Text>
            <Text style={styles.featuredPrice}>
              {Number(item.prezzo).toFixed(0)}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: translate }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.serviceCard,
          pressed && styles.serviceCardPressed,
        ]}
        onPress={() => onPress(item)}
      >
        <View style={styles.serviceIconContainer}>
          <Text style={styles.serviceIcon}>{getIcona(item.nome)}</Text>
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.nome}</Text>
          {item.descrizione && (
            <Text style={styles.serviceDesc}>{item.descrizione}</Text>
          )}
          <View style={styles.serviceMeta}>
            <Text style={styles.serviceDuration}>
              ⏳ {item.durata_minuti} min
            </Text>
          </View>
        </View>
        <View style={styles.servicePriceContainer}>
          <Text style={styles.servicePriceSymbol}>€</Text>
          <Text style={styles.servicePrice}>
            {Number(item.prezzo).toFixed(0)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
