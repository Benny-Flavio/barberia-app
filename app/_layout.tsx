import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { router, Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { conTimeout, ServizioNonRaggiungibile } from "../lib/conTimeout";
import { supabase } from "../lib/supabase";

// ── Auth guard + route guard per ruolo (unico punto, vale per tutte le pagine) ──
// "/"                → login e registrazione: l'unica pagina accessibile senza sessione
// qualsiasi altra    → serve una sessione valida, altrimenti si torna a "/"
// "/admin-dashboard" → area staff: solo admin / super_admin
// tutto il resto     → area cliente: gli account staff vengono rimandati alla dashboard
const AREA_STAFF = ["/admin-dashboard"];
const isStaff = (ruolo: string | null) => ruolo === "admin" || ruolo === "super_admin";

// Ruolo dell'utente loggato, letto da profili (stessa fonte del login) e tenuto in memoria per utente
let ruoloInCache: { userId: string; ruolo: string | null } | null = null;
// Ogni chiamata a Supabase ha un tempo massimo: se non risponde si mostra "Riprova", non una rotellina infinita
const ruoloUtenteLoggato = async (): Promise<{ loggato: boolean; ruolo: string | null }> => {
  const { data: { session } } = await conTimeout(supabase.auth.getSession());
  if (!session) return { loggato: false, ruolo: null };
  if (ruoloInCache?.userId !== session.user.id) {
    const { data, error } = await conTimeout(
      supabase.from("profili").select("ruolo").eq("id", session.user.id).single(),
    );
    // PGRST116 = nessun profilo per questo utente (ruolo assente); qualsiasi altro errore = Supabase non risponde bene
    if (error && error.code !== "PGRST116") throw new ServizioNonRaggiungibile();
    ruoloInCache = { userId: session.user.id, ruolo: data?.ruolo ?? null };
  }
  return { loggato: true, ruolo: ruoloInCache.ruolo };
};

export default function RootLayout() {
  const pathname = usePathname();
  // Pagina per cui il controllo del ruolo è concluso; finché non lo è, la pagina resta coperta
  const [verificata, setVerificata] = useState<string | null>(null);
  const ultimaVerifica = useRef(0);
  // Supabase non ha risposto in tempo: al posto della rotellina, messaggio + "Riprova"
  const [irraggiungibile, setIrraggiungibile] = useState(false);
  const [tentativo, setTentativo] = useState(0);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // Cambio di utente: il ruolo va riletto al prossimo cambio di pagina
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") ruoloInCache = null;
      // Sessione condivisa tra le schede: dopo un logout (qui o altrove) non c'è più una sessione valida
      if (event === "SIGNED_OUT") {
        AsyncStorage.removeItem("utente").catch(() => {}); // niente nome di un utente precedente in cache
        router.replace("/" as any);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (pathname === "/") return;
    const id = ++ultimaVerifica.current;
    setIrraggiungibile(false);
    (async () => {
      try {
        const { loggato, ruolo } = await ruoloUtenteLoggato();
        if (id !== ultimaVerifica.current) return; // nel frattempo si è cambiata pagina
        // Nessuna sessione valida: pagina mai mostrata, si torna al login
        if (!loggato) return router.replace("/" as any);
        const areaStaff = AREA_STAFF.some((p) => pathname.startsWith(p));
        if (areaStaff && !isStaff(ruolo)) return router.replace("/home" as any);
        if (!areaStaff && isStaff(ruolo)) return router.replace("/admin-dashboard" as any);
        setVerificata(pathname);
      } catch {
        // Verifica impossibile (Supabase lento o irraggiungibile, rete assente): la pagina resta coperta,
        // ma con un messaggio e "Riprova" invece di una rotellina infinita o di un rimbalzo al login
        if (id === ultimaVerifica.current) setIrraggiungibile(true);
      }
    })();
  }, [pathname, tentativo]);

  const inVerifica = pathname !== "/" && verificata !== pathname;

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
          <Stack.Screen name="riepilogo-prenotazione" />
          <Stack.Screen name="miei-appuntamenti" />
          <Stack.Screen name="listino-servizi" />
          <Stack.Screen name="sedi-info" />
          <Stack.Screen name="messaggi" />
          <Stack.Screen name="admin-dashboard" />
        </Stack>
        {/* Copre la pagina finché il ruolo non è verificato: nessun contenuto dell'area sbagliata a schermo */}
        {inVerifica && (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 32 }}>
            {irraggiungibile ? (
              <>
                <Text style={{ color: "#FFF", fontSize: 18, fontWeight: "800", textAlign: "center" }}>
                  Servizio momentaneamente non raggiungibile
                </Text>
                <Text style={{ color: "#888", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                  Controlla la connessione e riprova tra qualche istante.
                </Text>
                <Pressable
                  onPress={() => setTentativo((t) => t + 1)}
                  style={{ marginTop: 24, backgroundColor: "#D4AF37", paddingVertical: 14, paddingHorizontal: 40, borderRadius: 12, cursor: "pointer" as any }}
                >
                  <Text style={{ color: "#0A0A0A", fontSize: 16, fontWeight: "800" }}>Riprova</Text>
                </Pressable>
              </>
            ) : (
              <ActivityIndicator color="#D4AF37" size="large" />
            )}
          </View>
        )}
        <StatusBar style="light" />
      </View>
    </ThemeProvider>
  );
}
