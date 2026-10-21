import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Sessione condivisa tra le schede: dopo un logout (qui o altrove) non c'è più una sessione valida
      if (event === "SIGNED_OUT") {
        router.replace("/" as any);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Layout fluido a tutta larghezza, senza calcoli sulla dimensione dello schermo: la pagina è
  // pre-renderizzata al build (senza schermo) e un valore calcolato in JS cambiava dopo un refresh.
  return (
    <ThemeProvider value={DarkTheme}>
      <View style={{ flex: 1, width: "100%", backgroundColor: "#0A0A0A" }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="home" />
          <Stack.Screen name="scelta-sede" />
          <Stack.Screen name="scelta-servizio" />
          <Stack.Screen name="scelta-data" />
          <Stack.Screen name="miei-appuntamenti" />
          <Stack.Screen name="listino-servizi" />
          <Stack.Screen name="sedi-info" />
          <Stack.Screen name="messaggi" />
          <Stack.Screen name="admin-dashboard" />
        </Stack>
        <StatusBar style="light" />
      </View>
    </ThemeProvider>
  );
}
