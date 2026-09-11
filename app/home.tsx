// app/home.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "../lib/supabase";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

// IMPORTIAMO GLI STILI SEPARATI E LA COSTANTE SHEET_H
import { s, SHEET_H } from "../styles/homeStyles";
import GuidaInstallazione from "../components/GuidaInstallazione";

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";

export default function Home() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [utente, setUtente] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editCognome, setEditCognome] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [vecchiaPw, setVecchiaPw] = useState("");
  const [nuovaPw, setNuovaPw] = useState("");
  const [pwErrore, setPwErrore] = useState("");
  const [nonLette, setNonLette] = useState(0);
  const [numAppuntamenti, setNumAppuntamenti] = useState(0);
  const [appDomani, setAppDomani] = useState<any[]>([]);
  const [reminderIdx, setReminderIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [cardHeight, setCardHeight] = useState(130);

  const nextCardY = useRef(new Animated.Value(0)).current;
  const cancelFadeAnim = useRef(new Animated.Value(1)).current;
  const pendingIdx = useRef(0);
  const sheetAnim = useRef(new Animated.Value(SHEET_H)).current;
  const overlayOp = useRef(new Animated.Value(0)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const mainCardOp = useRef(new Animated.Value(0)).current;
  const mainCardY = useRef(new Animated.Value(30)).current;
  const gridOp = useRef(new Animated.Value(0)).current;
  const gridY = useRef(new Animated.Value(30)).current;
  const hasAnimated = useRef(false);
  const fallbackTimer = useRef<any>(null);

  const startCardAnimations = () => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(mainCardOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(mainCardY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, 150);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(gridOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(gridY, { toValue: 0, friction: 6, useNativeDriver: true }),
      ]).start();
    }, 400);
  };

  useEffect(() => {
    caricaUtente();
    contaNotifiche();
    Animated.timing(headerOp, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    // Fallback: avvia le animazioni dopo 900ms se l'API è lenta (cold start Render)
    fallbackTimer.current = setTimeout(startCardAnimations, 900);
    return () => { if (fallbackTimer.current) clearTimeout(fallbackTimer.current); };
  }, []);

  const caricaUtente = async () => {
    let u = JSON.parse((await AsyncStorage.getItem("utente")) || "{}");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        // Se l'UUID in cache non corrisponde all'utente corrente, ignora la cache
        if (u.uuid && u.uuid !== session.user.id) {
          u = {};
          await AsyncStorage.removeItem("utente");
        }
        if (!u.nome) {
          const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const json = await res.json();
          if (json.utente?.nome) {
            u = { ...json.utente, uuid: session.user.id };
          } else {
            const meta = session.user?.user_metadata;
            if (meta?.nome) u = { ...u, uuid: session.user.id, nome: meta.nome, cognome: meta.cognome, telefono: meta.telefono || u.telefono };
          }
          await AsyncStorage.setItem("utente", JSON.stringify(u));
        }
      }
    } catch {}
    setUtente(u);
    setEditNome(u.nome || "");
    setEditCognome(u.cognome || "");
    setEditTelefono(u.telefono || "");
  };

  const contaNotifiche = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${BACKEND_URL}/api/notifiche`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (Array.isArray(data))
        setNonLette(data.filter((n: any) => !n.letta).length);
    } catch (err) {}
  };

  const contaAppuntamenti = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${BACKEND_URL}/api/prenotazioni/miei`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!Array.isArray(data)) return;
      setNumAppuntamenti(data.filter((a: any) => a.stato === 'attivo').length);

      const adesso = new Date();
      const oggiStr = adesso.toISOString().split("T")[0];
      const oraCorrente = adesso.toTimeString().slice(0, 5);
      const domani = new Date(adesso);
      domani.setDate(adesso.getDate() + 1);
      const domaniStr = domani.toISOString().split("T")[0];

      const trovati = data.filter((a: any) => {
        const appDateStr = new Date(a.data).toISOString().split("T")[0];
        if (appDateStr === domaniStr) return true;
        if (appDateStr === oggiStr) {
          const appOra = (a.ora ?? "23:59").slice(0, 5);
          return appOra > oraCorrente;
        }
        return false;
      });
      const nonDismissi: any[] = [];
      for (const a of trovati) {
        if (a.stato === 'cancellato') {
          // Mostra sempre i cancellati (ignorano il dismissed), marca per rilevare il ripristino
          await AsyncStorage.setItem(`reminder_was_cancelled_${a.id}`, "1");
          nonDismissi.push(a);
        } else {
          // Se era cancellato e ora è ripristinato, cancella il dismissed precedente
          const wasCancelled = await AsyncStorage.getItem(`reminder_was_cancelled_${a.id}`);
          if (wasCancelled) {
            await AsyncStorage.removeItem(`reminder_dismissed_${a.id}`);
            await AsyncStorage.removeItem(`reminder_was_cancelled_${a.id}`);
          }
          const dismissed = await AsyncStorage.getItem(`reminder_dismissed_${a.id}`);
          if (!dismissed) nonDismissi.push(a);
        }
      }
      setAppDomani(nonDismissi);
      setReminderIdx(0);
    } catch (err) {}
  };

  // Rimuove ogni appuntamento di oggi esattamente all'orario preciso
  useEffect(() => {
    const adesso = new Date();
    const oggiStr = adesso.toISOString().split("T")[0];
    const timers: ReturnType<typeof setTimeout>[] = [];

    appDomani.forEach((a) => {
      if (new Date(a.data).toISOString().split("T")[0] !== oggiStr) return;
      const [h, m] = (a.ora ?? "23:59").slice(0, 5).split(":").map(Number);
      const scadenza = new Date(adesso);
      scadenza.setHours(h, m, 0, 0);
      const delay = scadenza.getTime() - adesso.getTime();
      if (delay <= 0) return;
      timers.push(
        setTimeout(() => setAppDomani((prev) => prev.filter((x) => x.id !== a.id)), delay)
      );
    });

    return () => timers.forEach(clearTimeout);
  }, [appDomani]);

  // Auto-dismiss popup cancellati dopo 15s con fade-out
  useEffect(() => {
    if (appDomani.length === 0) return;
    const currentApp = appDomani[reminderIdx];
    if (!currentApp || currentApp.stato !== 'cancellato') {
      cancelFadeAnim.setValue(1);
      return;
    }
    cancelFadeAnim.setValue(1);
    const timer = setTimeout(() => {
      Animated.timing(cancelFadeAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start(() => {
        cancelFadeAnim.setValue(1);
        setAppDomani((prev) => {
          const nuovi = prev.filter((x: any) => x.id !== currentApp.id);
          setReminderIdx((i) => Math.min(i, Math.max(0, nuovi.length - 1)));
          return nuovi;
        });
      });
    }, 14200);
    return () => clearTimeout(timer);
  }, [appDomani, reminderIdx]);

  useFocusEffect(
    useCallback(() => {
      const ricarica = async () => {
        const visti = await AsyncStorage.getItem("appuntamenti_visti");
        await contaAppuntamenti();
        if (visti) setNumAppuntamenti(0);
        contaNotifiche();
        startCardAnimations(); // avvia animazioni ora che i dati sono pronti (no-op se già avviate)
      };
      ricarica();
    }, []),
  );

  const navigateTo = (newIdx: number) => {
    if (transitioning || newIdx < 0 || newIdx >= appDomani.length) return;
    const goingForward = newIdx > reminderIdx;
    pendingIdx.current = newIdx;
    setTransitioning(true);
    // Avanti: entra dal basso (+cardHeight), Indietro: entra dall'alto (-cardHeight)
    nextCardY.setValue(goingForward ? cardHeight : -cardHeight);
    Animated.timing(nextCardY, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setReminderIdx(pendingIdx.current);
      setTransitioning(false);
    });
  };

  const apriSheet = () => {
    setSheetVisible(true);
    Animated.parallel([
      Animated.spring(sheetAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOp, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const chiudiSheet = () => {
    setEditMode(false);
    setShowPw(false);
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: SHEET_H,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOp, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setSheetVisible(false));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("utente");
    router.replace("/");
  };

  const salvaProfilo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${BACKEND_URL}/api/auth/profilo`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: editNome,
          cognome: editCognome,
          telefono: editTelefono,
        }),
      });
      if ((await res.json()).success) {
        const nu = { ...utente, nome: editNome, cognome: editCognome };
        await AsyncStorage.setItem("utente", JSON.stringify(nu));
        setUtente(nu);
        setEditMode(false);
      }
    } catch (err) {}
  };

  const cambiaPw = async () => {
    if (!vecchiaPw || !nuovaPw) return;
    if (nuovaPw.length < 6) {
      setPwErrore("Minimo 6 caratteri");
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${BACKEND_URL}/api/auth/cambia-password`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vecchia_password: vecchiaPw,
          nuova_password: nuovaPw,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPw(false);
        setVecchiaPw("");
        setNuovaPw("");
        setPwErrore("");
      } else {
        setPwErrore(data.error || "Errore. Riprova.");
      }
    } catch (err) {}
  };

  return (
    <View style={s.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        bounces={false}
      >
        <Animated.View style={[s.header, { opacity: headerOp }]}>
          <View>
            <View style={s.logoRow}>
              <View style={s.logo}>
                <Image
                  source={require("../assets/images/logo.png")}
                  style={s.logoImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={s.brandText}>BULLDOG BARBER SHOP</Text>
            </View>
            <Text style={s.greeting}>Bentornato,</Text>
            <Text style={s.greetingName}>{[utente?.nome, utente?.cognome].filter(Boolean).join(" ")}!</Text>
          </View>
          <Pressable style={s.profileBtn} onPress={apriSheet}>
            <Text style={s.profileIcon}>👤</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={{ opacity: mainCardOp, transform: [{ translateY: mainCardY }] }}>
        {appDomani.length > 0 && (() => {
          const app = appDomani[reminderIdx];
          const risingApp = transitioning ? appDomani[pendingIdx.current] : null;
          const isOggi = new Date(app.data).toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
          const isCancellato = app.stato === 'cancellato';
          const risingIsOggi = risingApp
            ? new Date(risingApp.data).toISOString().split("T")[0] === new Date().toISOString().split("T")[0]
            : false;
          const risingIsCancellato = risingApp ? risingApp.stato === 'cancellato' : false;
          const hasPrev = reminderIdx > 0;
          const hasNext = reminderIdx < appDomani.length - 1;

          return (
            <View style={{ marginTop: 16, marginBottom: 4 }}>
              {/* zIndex: 10 sul container → sempre sopra i peek strip a zIndex 9 */}
              <View style={{ zIndex: 10 }}>
                {/* Front card */}
                <Animated.View
                  style={[s.reminderBanner, { marginBottom: 0 }, isCancellato && { backgroundColor: '#1A0505', borderColor: 'rgba(244,67,54,0.35)' }, { opacity: isCancellato ? cancelFadeAnim : 1 }]}
                  onLayout={e => setCardHeight(e.nativeEvent.layout.height)}
                >
                  <Text style={s.reminderIcon}>{isCancellato ? '❌' : '🔔'}</Text>
                  <View style={s.reminderBody}>
                    <Text style={[s.reminderTitle, { marginBottom: 6 }, isCancellato && { color: '#F44336' }]}>
                      {isCancellato ? 'APPUNTAMENTO CANCELLATO' : `APPUNTAMENTO ${isOggi ? "OGGI" : "DOMANI"}`}
                    </Text>
                    <Text style={[s.reminderService, isCancellato && { color: '#555', textDecorationLine: 'line-through' }]}>{app.servizio_nome}</Text>
                    <Text style={[s.reminderDetail, isCancellato && { color: '#444', textDecorationLine: 'line-through' }]}>🕐 {app.ora?.slice(0, 5)}  💈 {app.barbiere_nome}</Text>
                    <Text style={[s.reminderDetail, isCancellato && { color: '#444' }]}>📍 {app.sede_nome}</Text>
                    {isCancellato && <Text style={{ color: '#666', fontSize: 11, marginTop: 4, fontStyle: 'italic' }}>Assenza barbiere — si chiude automaticamente</Text>}
                    {!isCancellato && appDomani.length > 1 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
                        <Pressable
                          onPress={() => navigateTo(reminderIdx - 1)}
                          style={{ opacity: hasPrev && !transitioning ? 1 : 0.25, paddingVertical: 2, paddingRight: 6, cursor: 'pointer' as any }}
                        >
                          <Text style={{ color: '#D4AF37', fontSize: 22, fontWeight: '300', lineHeight: 22 }}>‹</Text>
                        </Pressable>
                        <Text style={{ color: '#555', fontSize: 11 }}>{reminderIdx + 1} / {appDomani.length}</Text>
                        <Pressable
                          onPress={() => navigateTo(reminderIdx + 1)}
                          style={{ opacity: hasNext && !transitioning ? 1 : 0.25, paddingVertical: 2, paddingLeft: 6, cursor: 'pointer' as any }}
                        >
                          <Text style={{ color: '#D4AF37', fontSize: 22, fontWeight: '300', lineHeight: 22 }}>›</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                  {!isCancellato && (
                    <Pressable
                      style={s.reminderClose}
                      onPress={async () => {
                        if (transitioning) return;
                        await AsyncStorage.setItem(`reminder_dismissed_${app.id}`, "1");
                        const nuovi = appDomani.filter((a: any) => a.id !== app.id);
                        setAppDomani(nuovi);
                        setReminderIdx(i => Math.min(i, Math.max(0, nuovi.length - 1)));
                      }}
                    >
                      <Text style={s.reminderCloseText}>✕</Text>
                    </Pressable>
                  )}
                </Animated.View>

                {/* Card in arrivo — entra dal basso (avanti) o dall'alto (indietro) */}
                {transitioning && risingApp && (
                  <Animated.View
                    style={[
                      s.reminderBanner,
                      risingIsCancellato && { backgroundColor: '#1A0505', borderColor: 'rgba(244,67,54,0.35)' },
                      {
                        position: 'absolute' as any,
                        top: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1,
                        transform: [{ translateY: nextCardY }],
                      },
                    ]}
                  >
                    <Text style={s.reminderIcon}>{risingIsCancellato ? '❌' : '🔔'}</Text>
                    <View style={s.reminderBody}>
                      <Text style={[s.reminderTitle, { marginBottom: 6 }, risingIsCancellato && { color: '#F44336' }]}>
                        {risingIsCancellato ? 'APPUNTAMENTO CANCELLATO' : `APPUNTAMENTO ${risingIsOggi ? "OGGI" : "DOMANI"}`}
                      </Text>
                      <Text style={[s.reminderService, risingIsCancellato && { color: '#555', textDecorationLine: 'line-through' }]}>{risingApp.servizio_nome}</Text>
                      <Text style={[s.reminderDetail, risingIsCancellato && { color: '#444', textDecorationLine: 'line-through' }]}>🕐 {risingApp.ora?.slice(0, 5)}  💈 {risingApp.barbiere_nome}</Text>
                      <Text style={[s.reminderDetail, risingIsCancellato && { color: '#444' }]}>📍 {risingApp.sede_nome}</Text>
                    </View>
                    <View style={s.reminderClose} />
                  </Animated.View>
                )}
              </View>

              {/* Peek strips decorativi — mostrano che ci sono più card */}
              {appDomani.length > 1 && (
                <View
                  style={{
                    height: 14,
                    marginHorizontal: 8,
                    marginTop: -8,
                    backgroundColor: '#1E1800',
                    borderBottomLeftRadius: 14,
                    borderBottomRightRadius: 14,
                    borderWidth: 1,
                    borderTopWidth: 0,
                    borderColor: 'rgba(212,175,55,0.25)',
                    zIndex: 9,
                  }}
                />
              )}
              {appDomani.length > 2 && (
                <View
                  style={{
                    height: 12,
                    marginHorizontal: 16,
                    marginTop: -6,
                    backgroundColor: '#1B1500',
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12,
                    borderWidth: 1,
                    borderTopWidth: 0,
                    borderColor: 'rgba(212,175,55,0.14)',
                    zIndex: 8,
                  }}
                />
              )}
            </View>
          );
        })()}

        <Text style={s.sectionTitle}>— Prenota</Text>
          <Pressable
            style={({ pressed }) => [s.mainCard, pressed && s.mainCardPressed]}
            onPress={() => router.push("/scelta-sede" as any)}
          >
            <View style={s.mainInner}>
              <View style={s.mainIcon}>
                <Text style={{ fontSize: 26 }}>📅</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.mainTitle}>Nuova Prenotazione</Text>
                <Text style={s.mainSub}>Scegli sede, servizio e orario</Text>
              </View>
              <Text style={s.mainArrow}>›</Text>
            </View>
            <View style={s.mainBar} />
          </Pressable>
        </Animated.View>

        <Animated.View style={{ opacity: gridOp, transform: [{ translateY: gridY }] }}>
        <Text style={s.sectionTitle}>— Esplora</Text>
        <View style={s.grid}>
          <Pressable
            style={({ pressed }) => [s.gridCard, pressed && s.gridCardPressed]}
            onPress={() => router.push("/miei-appuntamenti" as any)}
          >
            <View style={s.iconRow}>
              <Text style={s.gridIcon}>🕒</Text>
              {numAppuntamenti > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{numAppuntamenti}</Text>
                </View>
              )}
            </View>
            <Text style={s.gridTitle}>Appuntamenti</Text>
            <Text style={s.gridSub}>Visualizza e gestisci</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.gridCard, pressed && s.gridCardPressed]}
            onPress={() => router.push("/listino-servizi" as any)}
          >
            <Text style={s.gridIcon}>✂️</Text>
            <Text style={s.gridTitle}>Servizi</Text>
            <Text style={s.gridSub}>Listino prezzi</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [s.gridCard, pressed && s.gridCardPressed]}
            onPress={() => router.push("/sedi-info" as any)}
          >
            <Text style={s.gridIcon}>📍</Text>
            <Text style={s.gridTitle}>Sedi</Text>
            <Text style={s.gridSub}>Info e barbieri</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              s.gridCardMsg,
              pressed && s.gridCardPressed,
            ]}
            onPress={() => router.push("/messaggi" as any)}
          >
            <View style={s.iconRow}>
              <Text style={s.gridIcon}>💬</Text>
              {nonLette > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{nonLette}</Text>
                </View>
              )}
            </View>
            <Text style={s.gridTitle}>Messaggi</Text>
            <Text style={s.gridSub}>Comunicazioni dallo staff</Text>
          </Pressable>
        </View>
          <View style={s.footerBox}>
            <View style={s.footerLine} />
            <Text style={s.footerText}>PRENOTA IL TUO STILE</Text>
          </View>
        </Animated.View>
      </ScrollView>

      {sheetVisible && (
        <Animated.View
          style={[s.overlay, { opacity: overlayOp }]}
          pointerEvents="auto"
        >
          <Pressable style={{ flex: 1 }} onPress={chiudiSheet} />
        </Animated.View>
      )}

      {sheetVisible && (
        <Animated.View
          style={[
            s.sheet,
            { height: SHEET_H, transform: [{ translateY: sheetAnim }] },
          ]}
        >
          <View style={s.handleBar} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View style={s.sheetHeader}>
              <View style={s.avatarLarge}>
                <Text style={s.avatarLargeText}>
                  {utente?.nome?.[0]?.toUpperCase() || "?"}
                </Text>
              </View>
              <Text style={s.sheetName}>
                {utente?.nome} {utente?.cognome || ""}
              </Text>
              <Text style={s.sheetEmail}>{utente?.email}</Text>
              {utente?.telefono ? (
                <Text style={s.sheetPhone}>📞 {utente.telefono}</Text>
              ) : null}
            </View>

            <View style={s.quickActions}>
              <Pressable
                style={s.quickBtn}
                onPress={() => {
                  setEditMode(true);
                  setShowPw(false);
                }}
              >
                <View style={s.quickIcon}>
                  <Text style={{ fontSize: 18 }}>✏️</Text>
                </View>
                <Text style={s.quickText}>Modifica</Text>
              </Pressable>
              <Pressable
                style={s.quickBtn}
                onPress={() => {
                  setShowPw(!showPw);
                  setEditMode(false);
                }}
              >
                <View style={s.quickIcon}>
                  <Text style={{ fontSize: 18 }}>🔒</Text>
                </View>
                <Text style={s.quickText}>Password</Text>
              </Pressable>
              <Pressable style={[s.quickBtn]} onPress={logout}>
                <View style={[s.quickIcon, s.quickIconDanger]}>
                  <Text style={{ fontSize: 18 }}>🚪</Text>
                </View>
                <Text style={[s.quickText, { color: "#F44336" }]}>Esci</Text>
              </Pressable>
            </View>

            {editMode && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>MODIFICA PROFILO</Text>
                <View style={s.fieldRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Nome</Text>
                    <TextInput
                      style={s.fieldInput}
                      value={editNome}
                      onChangeText={setEditNome}
                      placeholderTextColor="#333"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.fieldLabel}>Cognome</Text>
                    <TextInput
                      style={s.fieldInput}
                      value={editCognome}
                      onChangeText={setEditCognome}
                      placeholderTextColor="#333"
                    />
                  </View>
                </View>
                <Text style={s.fieldLabel}>Telefono</Text>
                <TextInput
                  style={s.fieldInput}
                  value={editTelefono}
                  onChangeText={setEditTelefono}
                  placeholderTextColor="#333"
                  keyboardType="phone-pad"
                />
                <View style={s.btnRow}>
                  <Pressable
                    style={s.btnCancel}
                    onPress={() => setEditMode(false)}
                  >
                    <Text style={s.btnCancelText}>Annulla</Text>
                  </Pressable>
                  <Pressable style={s.btnSave} onPress={salvaProfilo}>
                    <Text style={s.btnSaveText}>Salva</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {showPw && (
              <View style={s.section}>
                <Text style={s.sectionLabel}>CAMBIA PASSWORD</Text>
                <Text style={s.fieldLabel}>Password attuale</Text>
                <TextInput
                  style={s.fieldInput}
                  value={vecchiaPw}
                  onChangeText={setVecchiaPw}
                  placeholder="••••••"
                  placeholderTextColor="#333"
                  secureTextEntry
                />
                <Text style={s.fieldLabel}>Nuova password</Text>
                <TextInput
                  style={s.fieldInput}
                  value={nuovaPw}
                  onChangeText={setNuovaPw}
                  placeholder="Minimo 6 caratteri"
                  placeholderTextColor="#333"
                  secureTextEntry
                />
                {pwErrore ? (
                  <Text style={{ color: "#F44336", fontSize: 12, marginTop: 6, marginBottom: 2 }}>{pwErrore}</Text>
                ) : null}
                <View style={s.btnRow}>
                  <Pressable
                    style={s.btnCancel}
                    onPress={() => {
                      setShowPw(false);
                      setVecchiaPw("");
                      setNuovaPw("");
                      setPwErrore("");
                    }}
                  >
                    <Text style={s.btnCancelText}>Annulla</Text>
                  </Pressable>
                  <Pressable style={s.btnSave} onPress={cambiaPw}>
                    <Text style={s.btnSaveText}>Cambia</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {!editMode && !showPw && (
              <View style={s.infoSection}>
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Appuntamenti attivi</Text>
                  <Text style={s.infoValue}>{numAppuntamenti}</Text>
                </View>
                <View style={s.infoDivider} />
                <View style={s.infoRow}>
                  <Text style={s.infoLabel}>Messaggi non letti</Text>
                  <Text style={s.infoValue}>{nonLette}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}

      <StatusBar style="light" />
      <GuidaInstallazione userId={utente?.uuid || ""} />
    </View>
  );
}
