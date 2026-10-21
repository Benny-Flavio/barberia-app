import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// ── Web: sessione PER SCHEDA ──
// Con il localStorage di default la sessione è unica per tutto il browser: entrando come admin
// in una scheda, la scheda del cliente diventava admin. Qui ogni scheda tiene la propria sessione
// in sessionStorage; localStorage conserva solo l'ultima sessione usata, per far partire già
// loggata una nuova scheda o la PWA riaperta.
const LOGOUT = "__logout__";
const AVVIATA = "::avviata";

const leggiSessione = (v: string | null): { userId: string | null; scadenza: number } => {
  try {
    const s = v ? JSON.parse(v) : null;
    return { userId: s?.user?.id ?? null, scadenza: s?.expires_at ?? 0 };
  } catch {
    return { userId: null, scadenza: 0 };
  }
};

const storagePerScheda = {
  getItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    let mia = sessionStorage.getItem(key);
    // Solo all'avvio della scheda si parte dall'ultima sessione salvata: dopo, i login fatti
    // in altre schede non vengono "adottati" da questa
    if (!sessionStorage.getItem(key + AVVIATA)) {
      sessionStorage.setItem(key + AVVIATA, "1");
      if (mia === null) {
        mia = localStorage.getItem(key);
        if (mia !== null) sessionStorage.setItem(key, mia);
      }
    }
    if (mia === null || mia === LOGOUT) return null;
    // Stesso utente in un'altra scheda con token più recenti (rinnovo): usa quelli, così le
    // schede dello stesso utente non riusano un refresh token già consumato
    const condivisa = localStorage.getItem(key);
    const m = leggiSessione(mia);
    const c = leggiSessione(condivisa);
    if (condivisa && m.userId && c.userId === m.userId && c.scadenza > m.scadenza) {
      sessionStorage.setItem(key, condivisa);
      return condivisa;
    }
    return mia;
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(key, value);
    sessionStorage.setItem(key + AVVIATA, "1");
    localStorage.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    const mia = sessionStorage.getItem(key);
    // L'ultima sessione salvata si cancella solo se è di questo utente (non quella di un'altra scheda)
    if (leggiSessione(localStorage.getItem(key)).userId === leggiSessione(mia).userId) {
      localStorage.removeItem(key);
    }
    // Marca il logout: anche ricaricando la scheda non riprende la sessione di un'altra scheda
    sessionStorage.setItem(key, LOGOUT);
    sessionStorage.setItem(key + AVVIATA, "1");
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === "web" ? storagePerScheda : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

// Supabase notifica login/logout anche alle ALTRE schede (BroadcastChannel). Un evento
// riguarda questa scheda solo se corrisponde alla sessione che questa scheda ha davvero.
// (Differito con setTimeout: chiamare getSession dentro onAuthStateChange può bloccarsi.)
export const sessioneDiQuestaScheda = () =>
  new Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]>((resolve) =>
    setTimeout(async () => resolve((await supabase.auth.getSession()).data.session), 0)
  );
