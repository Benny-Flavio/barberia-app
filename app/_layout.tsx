import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { router, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import { sessioneDiQuestaScheda, supabase } from "../lib/supabase";

export default function RootLayout() {
  const pathname = usePathname();
  // Area staff a tutta larghezza; le pagine cliente su desktop restano in una colonna di max 1100px.
  // La larghezza NON si calcola in JS (Dimensions al caricamento del modulo): la pagina è
  // pre-renderizzata al build senza schermo, e dopo un refresh il layout cambiava. Ci pensa una
  // media query CSS in app/+html.tsx (#app-colonna), uguale in pre-render e nel browser.
  const areaStaff = pathname.startsWith("/admin-dashboard");

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event !== "SIGNED_OUT") return;
      // Anche i logout delle ALTRE schede arrivano qui: torna al login solo se è uscita QUESTA scheda
      if (!(await sessioneDiQuestaScheda())) router.replace("/" as any);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <ThemeProvider value={DarkTheme}>
      <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
        <View nativeID={areaStaff ? "app-piena" : "app-colonna"} style={{ flex: 1, width: "100%" }}>
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
