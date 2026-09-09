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

import { styles } from "../styles/listinoServiziStyles";

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

export default function ListinoServizi() {
  const { sede_id, nome_sede } = useLocalSearchParams();
  const [servizi, setServizi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const headerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Indietro</Text>
          </Pressable>
          <Text style={styles.title}>I Nostri Servizi</Text>
          <Text style={styles.subtitle}>Listino prezzi</Text>
          <View style={styles.divider} />
        </Animated.View>

        {loading ? (
          <ActivityIndicator
            color="#D4AF37"
            size="large"
            style={{ marginTop: 50 }}
          />
        ) : (
          <View style={styles.cardsContainer}>
            {servizi.map((item, index) => (
              <ServiceCard key={item.id} item={item} index={index} />
            ))}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceCard({ item, index }: { item: any; index: number }) {
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
            useNativeDriver: true,
          }),
        ]).start();
      },
      100 + index * 120,
    );
  }, []);

  return (
    <Animated.View
      style={[styles.card, { opacity, transform: [{ translateY: translate }] }]}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIconContainer}>
          <Text style={styles.cardIcon}>{getIcona(item.nome)}</Text>
        </View>
        <View style={styles.cardPriceContainer}>
          <Text style={styles.cardPriceSymbol}>€</Text>
          <Text style={styles.cardPrice}>{Number(item.prezzo).toFixed(0)}</Text>
        </View>
      </View>
      <Text style={styles.cardNome}>{item.nome}</Text>
      {item.descrizione && (
        <Text style={styles.cardDescrizione}>{item.descrizione}</Text>
      )}
      <View style={styles.cardFooter}>
        <View style={styles.durationChip}>
          <Text style={styles.durationText}>⏳ {item.durata_minuti} min</Text>
        </View>
      </View>
    </Animated.View>
  );
}
