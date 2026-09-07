import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Dimensions, View } from "react-native";
import { supabase } from "../lib/supabase";

const isDesktop = Dimensions.get("window").width > 768;

export default function RootLayout() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/" as any);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
        <View style={{ flex: 1, maxWidth: isDesktop ? 1100 : undefined, width: "100%", alignSelf: isDesktop ? ("center" as any) : undefined }}>
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
      </View>
    </ThemeProvider>
  );
}
