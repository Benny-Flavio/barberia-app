import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import { st } from "../styles/adminDashboardStyles";
import { CalendarioInline, MESI_IT, OrarioInline } from "./SelettoriDataOra";

const BACKEND_URL = "https://barberia-backend-bulldog.onrender.com";
const minutiDa = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

// ── Console Developer (solo ruolo developer) ──
// Area di amministrazione separata dall'agenda dei barbieri: comunicazioni ai clienti, aperture
// straordinarie, orari delle sedi e turni dello staff (programmabili da una data futura) e archivio
// delle operazioni con report mensile in PDF.
// Le conferme passano dal modale della dashboard (chiediConferma), che copre tutto lo schermo.
export type Conferma = {
  messaggio: string;
  icona: React.ComponentProps<typeof Ionicons>["name"];
  testoConferma: string;
  azione: () => Promise<string | void>; // restituisce il messaggio da mostrare, lancia in caso di errore
};
export type Apertura = { id: number; data: string; sede_id: number; sede_nome: string; ora_inizio: string; ora_fine: string; barbieri: number[] };
type Fascia = { inizio: string; fine: string };
type OrarioGiorno = { sede_id: number; giorno_settimana: number; fasce: Fascia[] };

type Props = {
  sedi: any[];
  elencoBarbieri: any[];
  aperture: Apertura[];
  fetchAuth: (url: string, options?: RequestInit) => Promise<Response>;
  msg: (m: string) => void;
  onAperture: () => void;
  chiediConferma: (c: Conferma) => void;
};

const GIORNI_LUNGHI = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const ORDINE_SETTIMANA = [1, 2, 3, 4, 5, 6, 0]; // da lunedì a domenica
const isoDi = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daIso = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
// "2026-12-20" → "Domenica 20 Dicembre"
const dataLunga = (iso: string) => {
  const d = daIso(iso);
  return `${GIORNI_LUNGHI[d.getDay()]} ${d.getDate()} ${MESI_IT[d.getMonth()]}`;
};
const dataBreve = (iso: string) => iso.split("-").reverse().join("/");
const oggiIso = () => isoDi(new Date());
// Esegue una chiamata JSON e lancia l'errore del backend (mostrato nel modale di conferma)
const chiamata = async (fetchAuth: Props["fetchAuth"], url: string, options?: RequestInit) => {
  const res = await fetchAuth(url, options);
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || "Errore");
  return d;
};

function Interruttore({ attivo, onCambia, etichetta, nota }: { attivo: boolean; onCambia: (v: boolean) => void; etichetta: string; nota?: string }) {
  return (
    <Pressable style={st.titToggleRow} onPress={() => onCambia(!attivo)}>
      <View style={{ flex: 1 }}>
        <Text style={st.titToggleLabel}>{etichetta}</Text>
        {nota ? <Text style={st.titToggleNota}>{nota}</Text> : null}
      </View>
      <View style={[st.titToggleTrack, attivo && st.titToggleTrackOn]}>
        <View style={[st.titToggleKnob, attivo && st.titToggleKnobOn]} />
      </View>
    </Pressable>
  );
}

function Intestazione({ icona, titolo, sotto }: { icona: React.ComponentProps<typeof Ionicons>["name"]; titolo: string; sotto: string }) {
  return (
    <View style={st.titCardHead}>
      <View style={st.titIcona}><Ionicons name={icona} size={20} color="#D4AF37" /></View>
      <View style={{ flex: 1 }}>
        <Text style={st.titCardTitle}>{titolo}</Text>
        <Text style={st.titCardSub}>{sotto}</Text>
      </View>
    </View>
  );
}

function BottoneOro({ icona, testo, onPress, inCorso = false }: { icona: React.ComponentProps<typeof Ionicons>["name"]; testo: string; onPress: () => void; inCorso?: boolean }) {
  return (
    <Pressable style={({ pressed }) => [st.titBtnOro, (pressed || inCorso) && { opacity: 0.85 }]} onPress={onPress} disabled={inCorso}>
      {inCorso ? <ActivityIndicator color="#0A0A0A" /> : <Ionicons name={icona} size={18} color="#0A0A0A" />}
      <Text style={st.titBtnOroText}>{testo}</Text>
    </Pressable>
  );
}

// Riga a tendina: in chiusura solo titolo e data, toccandola mostra il contenuto completo
function RigaFisarmonica({ titolo, data, aperta, onTocca, children }: { titolo: string; data: string; aperta: boolean; onTocca: () => void; children: React.ReactNode }) {
  return (
    <View style={[st.consAcc, aperta && st.consAccAperta]}>
      <Pressable style={st.consAccTesta} onPress={onTocca} role="button" aria-expanded={aperta}>
        <Text style={st.consAccTitolo} numberOfLines={1}>{titolo}</Text>
        <Text style={st.consAccData}>{data}</Text>
        <Ionicons name={aperta ? "chevron-up" : "chevron-down"} size={16} color="#D4AF37" />
      </Pressable>
      {aperta && <View style={st.consAccCorpo}>{children}</View>}
    </View>
  );
}

// ── "Valido dal": da oggi oppure dal lunedì di una settimana futura ──
// ‹ › settimana precedente/successiva, « » mese precedente/successivo (primo lunedì del mese)
const prossimoLunedi = (d: Date) => { const x = new Date(d); x.setDate(x.getDate() + ((8 - x.getDay()) % 7 || 7)); return x; };
const primoLunediDa = (d: Date) => { const x = new Date(d); while (x.getDay() !== 1) x.setDate(x.getDate() + 1); return x; };
function SelettoreValidita({ valore, onCambia }: { valore: string; onCambia: (v: string) => void }) {
  const oggi = oggiIso();
  const limite = (d: Date) => { const iso = isoDi(d); return iso <= oggi ? oggi : iso; };
  const sposta = (settimane: number) => {
    if (settimane > 0 && valore === oggi) return onCambia(isoDi(prossimoLunedi(new Date())));
    const d = daIso(valore);
    d.setDate(d.getDate() + settimane * 7);
    onCambia(limite(d));
  };
  const spostaMese = (n: number) => {
    const d = daIso(valore);
    onCambia(limite(primoLunediDa(new Date(d.getFullYear(), d.getMonth() + n, 1))));
  };
  const fine = valore === oggi ? null : (() => { const d = daIso(valore); d.setDate(d.getDate() + 6); return isoDi(d); })();
  return (
    <View style={st.consValidita}>
      <Text style={st.mLabel}>VALIDO DAL</Text>
      <View style={{ alignItems: "center", marginBottom: 12 }}>
        <Text style={st.consMeseTesto}>{valore === oggi ? "Da oggi" : `Da ${dataLunga(valore)}`}</Text>
        <Text style={st.consValiditaSotto}>{valore === oggi ? "La modifica vale subito" : `Settimana ${dataBreve(valore)} – ${dataBreve(fine!)} e seguenti`}</Text>
      </View>
      <View style={st.consMese}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Pressable onPress={() => spostaMese(-1)} style={st.consMeseFreccia} accessibilityLabel="Mese precedente" disabled={valore === oggi}>
            <Ionicons name="play-back" size={14} color={valore === oggi ? "#444" : "#D4AF37"} />
          </Pressable>
          <Pressable onPress={() => sposta(-1)} style={st.consMeseFreccia} accessibilityLabel="Settimana precedente" disabled={valore === oggi}>
            <Ionicons name="chevron-back" size={18} color={valore === oggi ? "#444" : "#D4AF37"} />
          </Pressable>
        </View>
        <Text style={st.consValiditaSotto}>settimana · mese</Text>
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Pressable onPress={() => sposta(1)} style={st.consMeseFreccia} accessibilityLabel="Settimana successiva">
            <Ionicons name="chevron-forward" size={18} color="#D4AF37" />
          </Pressable>
          <Pressable onPress={() => spostaMese(1)} style={st.consMeseFreccia} accessibilityLabel="Mese successivo">
            <Ionicons name="play-forward" size={14} color="#D4AF37" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ═══ COMUNICAZIONI AI CLIENTI ═══
function SezioneComunicazioni({ sedi, fetchAuth, msg, chiediConferma }: Props) {
  const [comTitolo, setComTitolo] = useState("");
  const [comTesto, setComTesto] = useState("");
  // null = tutti i clienti; id sede = clienti con appuntamenti futuri in quella sede
  const [comSede, setComSede] = useState<number | null>(null);
  const [nDestinatari, setNDestinatari] = useState<number | null>(null);
  const [emailAttiva, setEmailAttiva] = useState(false);
  const [storico, setStorico] = useState<any[]>([]);
  const [aperta, setAperta] = useState<number | null>(null);

  const caricaStorico = async () => {
    try {
      const res = await fetchAuth(`${BACKEND_URL}/api/admin/comunicazioni`);
      const d = await res.json();
      if (Array.isArray(d)) setStorico(d);
    } catch {}
  };
  useEffect(() => { caricaStorico(); }, []);
  // Anteprima del numero di destinatari a ogni cambio di filtro
  useEffect(() => {
    setNDestinatari(null);
    fetchAuth(`${BACKEND_URL}/api/admin/comunicazioni`, { method: "POST", body: JSON.stringify({ anteprima: true, sede_id: comSede }) })
      .then((r) => r.json())
      .then((d) => { if (d.anteprima) { setNDestinatari(d.destinatari); setEmailAttiva(!!d.email); } })
      .catch(() => {});
  }, [comSede]);

  const nomeSede = (id: number | null) => sedi.find((s) => s.id === id)?.nome || "";
  const inviaComunicazione = () => {
    if (!comTitolo.trim()) return msg("Inserisci il titolo");
    if (!comTesto.trim()) return msg("Scrivi il messaggio");
    if (!nDestinatari) return msg(comSede ? `Nessun cliente con appuntamenti futuri a ${nomeSede(comSede)}` : "Nessun cliente destinatario");
    chiediConferma({
      icona: "megaphone-outline",
      testoConferma: "Sì, invia",
      messaggio: `Inviare «${comTitolo.trim()}» a ${nDestinatari} ${nDestinatari === 1 ? "cliente" : "clienti"}`
        + (comSede ? ` con appuntamenti futuri a ${nomeSede(comSede)}?` : "?")
        + (emailAttiva ? "\n\nLo riceveranno in app e via email." : "\n\nLo riceveranno in app (email non ancora configurata)."),
      azione: async () => {
        const d = await chiamata(fetchAuth, `${BACKEND_URL}/api/admin/comunicazioni`, {
          method: "POST",
          body: JSON.stringify({ titolo: comTitolo.trim(), messaggio: comTesto.trim(), sede_id: comSede }),
        });
        setComTitolo("");
        setComTesto("");
        caricaStorico();
        return d.messaggio;
      },
    });
  };

  return (
    <View style={st.titCard}>
      <Intestazione icona="megaphone-outline" titolo="Comunicazioni ai clienti" sotto="Arrivano nella sezione Messaggi dell'app e via email." />

      <Text style={st.mLabel}>DESTINATARI</Text>
      <View style={{ gap: 8, marginBottom: 8 }}>
        <Pressable style={[st.mChip, comSede === null && st.mChipA]} onPress={() => setComSede(null)}>
          <Text style={[st.mChipText, comSede === null && st.mChipTextA]}>Tutti i clienti</Text>
        </Pressable>
        {sedi.map((s) => (
          <Pressable key={s.id} style={[st.mChip, comSede === s.id && st.mChipA]} onPress={() => setComSede(s.id)}>
            <Text style={[st.mChipText, comSede === s.id && st.mChipTextA]}>Clienti con appuntamenti futuri a {s.nome}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={st.titCardSub}>
        {nDestinatari === null ? "Calcolo dei destinatari…" : `${nDestinatari} ${nDestinatari === 1 ? "cliente riceverà" : "clienti riceveranno"} il messaggio`}
        {comSede ? ` (solo chi ha un appuntamento da oggi in poi a ${nomeSede(comSede)})` : ""}
      </Text>

      <Text style={[st.mLabel, { marginTop: 14 }]}>TITOLO</Text>
      <TextInput
        style={[st.mInput, { marginBottom: 12 }]}
        value={comTitolo}
        onChangeText={setComTitolo}
        placeholder="Es: Sede chiusa per problemi tecnici"
        placeholderTextColor="#333"
        selectionColor="#D4AF37"
        maxLength={120}
      />
      <Text style={st.mLabel}>MESSAGGIO</Text>
      <TextInput
        style={[st.mInput, st.titTextarea]}
        value={comTesto}
        onChangeText={setComTesto}
        placeholder="Scrivi il messaggio per i clienti…"
        placeholderTextColor="#333"
        selectionColor="#D4AF37"
        multiline
        maxLength={2000}
      />

      <BottoneOro icona="send-outline" testo="Invia comunicazione" onPress={inviaComunicazione} />

      {storico.length > 0 && (
        <>
          <Text style={[st.mLabel, { marginTop: 22 }]}>INVIATE DI RECENTE</Text>
          {storico.slice(0, 15).map((c) => (
            <RigaFisarmonica
              key={c.id}
              titolo={c.titolo}
              data={new Date(c.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" })}
              aperta={aperta === c.id}
              onTocca={() => setAperta(aperta === c.id ? null : c.id)}
            >
              <Text style={st.consAccTesto}>{String(c.messaggio).replace(/\*\*/g, "")}</Text>
              <Text style={st.consAccDettaglio}>
                Inviata il {new Date(c.created_at).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </Text>
              <Text style={st.consAccDettaglio}>
                Destinatari: {c.destinatari} {c.destinatari === 1 ? "cliente" : "clienti"}{c.sede_id ? ` con appuntamenti futuri a ${nomeSede(c.sede_id)}` : ""}
              </Text>
              <Text style={st.consAccDettaglio}>
                Email: {c.email_inviate > 0 ? `${c.email_inviate} consegnate` : "nessuna inviata"}{c.email_fallite > 0 ? ` · ${c.email_fallite} non consegnate` : ""}
              </Text>
            </RigaFisarmonica>
          ))}
        </>
      )}
    </View>
  );
}

// ═══ APERTURE STRAORDINARIE: UNA data di chiusura per UNA sede ═══
function SezioneAperture({ sedi, elencoBarbieri, aperture, fetchAuth, msg, onAperture, chiediConferma, orari }: Props & { orari: OrarioGiorno[] }) {
  const sedeNome = (id: number) => sedi.find((s) => s.id === id)?.nome || "";
  const nomeBarbiere = (id: number) => elencoBarbieri.find((b) => b.id === id)?.nome || `#${id}`;
  const [apSede, setApSede] = useState<number>(sedi[0]?.id ?? 0);
  const [apData, setApData] = useState("");
  const [apInizio, setApInizio] = useState("10:00");
  const [apFine, setApFine] = useState("18:00");
  const [apBarbieri, setApBarbieri] = useState<number[]>([]);
  const [apAvvisa, setApAvvisa] = useState(true);
  // Selezionabili solo i giorni di chiusura della sede scelta (orario in vigore; il backend verifica la data esatta)
  const giorniAperti = orari.filter((o) => o.sede_id === apSede && o.fasce.length > 0).map((o) => o.giorno_settimana);
  const giorniChiusi = [0, 1, 2, 3, 4, 5, 6].filter((g) => !giorniAperti.includes(g));

  // Barbieri preselezionati: quelli che di solito lavorano nella sede scelta
  useEffect(() => {
    if (!apSede) return;
    setApData("");
    fetch(`${BACKEND_URL}/api/barbieri/${apSede}`)
      .then((r) => r.json())
      .then((l) => { if (Array.isArray(l)) setApBarbieri(l.map((b: any) => b.id)); })
      .catch(() => {});
  }, [apSede]);
  const toggleBarbiere = (id: number) =>
    setApBarbieri((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const sblocca = () => {
    if (!apData) return msg("Scegli la data da sbloccare");
    if (minutiDa(apFine) - minutiDa(apInizio) < 40) return msg("L'apertura deve durare almeno 40 minuti");
    if (apBarbieri.length === 0) return msg("Seleziona almeno un barbiere");
    chiediConferma({
      icona: "lock-open-outline",
      testoConferma: "Sì, sblocca",
      messaggio: `Sbloccare solo ${dataLunga(apData)} a ${sedeNome(apSede)}, dalle ${apInizio} alle ${apFine}?`
        + (apAvvisa ? "\n\nTutti i clienti riceveranno l'avviso in app e via email." : ""),
      azione: async () => {
        const d = await chiamata(fetchAuth, `${BACKEND_URL}/api/admin/aperture-straordinarie`, {
          method: "POST",
          body: JSON.stringify({ data: apData, sede_id: apSede, ora_inizio: apInizio, ora_fine: apFine, barbieri: apBarbieri, notifica_clienti: apAvvisa }),
        });
        setApData("");
        onAperture();
        return d.messaggio;
      },
    });
  };

  const annullaApertura = (a: Apertura) =>
    chiediConferma({
      icona: "close-circle-outline",
      testoConferma: "Sì, annulla",
      messaggio: `Annullare l'apertura straordinaria di ${dataLunga(a.data)} a ${a.sede_nome}?\n\nGli appuntamenti già presi verranno cancellati e i clienti avvisati.`,
      azione: async () => {
        const d = await chiamata(fetchAuth, `${BACKEND_URL}/api/admin/aperture-straordinarie/${a.id}`, { method: "DELETE" });
        onAperture();
        return d.messaggio;
      },
    });

  return (
    <View style={st.titCard}>
      <Intestazione icona="calendar-outline" titolo="Aperture straordinarie" sotto="Sblocca un singolo giorno di chiusura della sede. Tutti gli altri restano chiusi." />

      <Text style={st.mLabel}>SEDE</Text>
      <View style={[st.mGrid, { marginBottom: 14 }]}>
        {sedi.map((s) => (
          <Pressable key={s.id} style={[st.mChip, { flex: 1, alignItems: "center" }, apSede === s.id && st.mChipA]} onPress={() => setApSede(s.id)}>
            <Text style={[st.mChipText, apSede === s.id && st.mChipTextA]}>{s.nome}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={st.mLabel}>DATA (SOLO GIORNI DI CHIUSURA: {giorniChiusi.length ? ORDINE_SETTIMANA.filter((g) => giorniChiusi.includes(g)).map((g) => GIORNI_LUNGHI[g].toUpperCase()).join(", ") : "NESSUNO"})</Text>
      <CalendarioInline value={apData} onChange={setApData} min={oggiIso()} disabledDow={giorniAperti} />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={st.mLabel}>DALLE</Text>
          <OrarioInline value={apInizio} onChange={setApInizio} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.mLabel}>ALLE</Text>
          <OrarioInline value={apFine} onChange={setApFine} />
        </View>
      </View>

      <Text style={st.mLabel}>BARBIERI IN SERVIZIO</Text>
      <View style={[st.mGrid, { marginBottom: 14, flexWrap: "wrap" }]}>
        {elencoBarbieri.map((b) => {
          const sel = apBarbieri.includes(b.id);
          return (
            <Pressable key={b.id} style={[st.mChip, sel && st.mChipA]} onPress={() => toggleBarbiere(b.id)}>
              <Text style={[st.mChipText, sel && st.mChipTextA]}>{b.nome}</Text>
            </Pressable>
          );
        })}
      </View>

      <Interruttore
        attivo={apAvvisa}
        onCambia={setApAvvisa}
        etichetta="Invia comunicazione ai clienti"
        nota="Avviso dell'apertura a tutti i clienti, in app e via email"
      />

      <BottoneOro icona="lock-open-outline" testo="Sblocca giorno" onPress={sblocca} />

      {aperture.length > 0 && (
        <>
          <Text style={[st.mLabel, { marginTop: 22 }]}>GIORNI SBLOCCATI</Text>
          {aperture.map((a) => (
            <View key={a.id} style={st.titRiga}>
              <View style={{ flex: 1 }}>
                <Text style={st.titRigaTitolo}>{dataLunga(a.data)} · {a.sede_nome}</Text>
                <Text style={st.titRigaSub}>
                  {a.ora_inizio}–{a.ora_fine} · {a.barbieri.map(nomeBarbiere).join(", ")}
                </Text>
              </View>
              <Pressable style={st.absBtn} onPress={() => annullaApertura(a)}>
                <Text style={st.absBtnText}>Annulla</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

// Elenco delle modifiche programmate (non ancora in vigore) con "Annulla"
function Programmate({ voci, onAnnulla }: { voci: { valido_dal: string; riepilogo: string }[]; onAnnulla: (validoDal: string) => void }) {
  if (voci.length === 0) return null;
  return (
    <View style={{ marginTop: 18 }}>
      <Text style={st.mLabel}>MODIFICHE PROGRAMMATE</Text>
      {voci.map((v) => (
        <View key={v.valido_dal} style={st.titRiga}>
          <View style={{ flex: 1 }}>
            <Text style={st.titRigaTitolo}>Dal {dataLunga(v.valido_dal)}</Text>
            <Text style={st.titRigaSub} numberOfLines={2}>{v.riepilogo}</Text>
          </View>
          <Pressable style={st.absBtn} onPress={() => onAnnulla(v.valido_dal)}>
            <Text style={st.absBtnText}>Annulla</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

// ═══ ORARI DELLE SEDI (programmabili) ═══
function SezioneOrari({ sedi, fetchAuth, msg, chiediConferma, onOrari }: Props & { onOrari: () => void }) {
  const [sede, setSede] = useState<number>(sedi[0]?.id ?? 0);
  const [validoDal, setValidoDal] = useState(oggiIso());
  const [bozza, setBozza] = useState<Record<number, Fascia[]> | null>(null);
  const [programmate, setProgrammate] = useState<{ valido_dal: string; riepilogo: string }[]>([]);
  const [ricarica, setRicarica] = useState(0);

  // La bozza parte dall'orario che sarà in vigore alla data scelta
  useEffect(() => {
    setBozza(null);
    fetch(`${BACKEND_URL}/api/orari-sedi?sede_id=${sede}&data=${validoDal}`)
      .then((r) => r.json())
      .then((l: OrarioGiorno[]) => {
        const b: Record<number, Fascia[]> = {};
        for (let g = 0; g <= 6; g++) b[g] = (l.find((o) => o.giorno_settimana === g)?.fasce || []).map((f) => ({ ...f }));
        setBozza(b);
      })
      .catch(() => setBozza({ 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }));
    fetch(`${BACKEND_URL}/api/orari-sedi/versioni?sede_id=${sede}`)
      .then((r) => r.json())
      .then((l) => {
        if (!Array.isArray(l)) return;
        setProgrammate(l.filter((v: any) => v.valido_dal > oggiIso()).map((v: any) => ({
          valido_dal: v.valido_dal,
          riepilogo: ORDINE_SETTIMANA.map((g) => {
            const f = v.giorni.find((x: any) => x.giorno_settimana === g)?.fasce || [];
            return `${GIORNI_LUNGHI[g].slice(0, 3)} ${f.length ? f.map((x: Fascia) => `${x.inizio}–${x.fine}`).join(", ") : "chiuso"}`;
          }).join(" · "),
        })));
      })
      .catch(() => {});
  }, [sede, validoDal, ricarica]);

  const cambiaFascia = (g: number, i: number, campo: keyof Fascia, valore: string) =>
    setBozza((b) => b && ({ ...b, [g]: b[g].map((f, j) => (j === i ? { ...f, [campo]: valore } : f)) }));
  const aggiungiFascia = (g: number) =>
    setBozza((b) => {
      if (!b) return b;
      const ultima = b[g][b[g].length - 1];
      const nuova = ultima ? { inizio: ultima.fine, fine: ultima.fine < "20:00" ? "20:00" : "22:00" } : { inizio: "09:00", fine: "19:00" };
      return { ...b, [g]: [...b[g], nuova] };
    });
  const togliFascia = (g: number, i: number) => setBozza((b) => b && ({ ...b, [g]: b[g].filter((_, j) => j !== i) }));
  const apriChiudi = (g: number, aperto: boolean) => setBozza((b) => b && ({ ...b, [g]: aperto ? [{ inizio: "09:00", fine: "19:00" }] : [] }));

  const nomeSede = sedi.find((s) => s.id === sede)?.nome || "";
  const quando = validoDal === oggiIso() ? "da oggi" : `da ${dataLunga(validoDal)}`;
  const salva = () => {
    if (!bozza) return;
    for (const g of ORDINE_SETTIMANA) {
      const fasce = [...(bozza[g] || [])].sort((a, b) => a.inizio.localeCompare(b.inizio));
      for (let i = 0; i < fasce.length; i++) {
        if (minutiDa(fasce[i].fine) - minutiDa(fasce[i].inizio) < 20) return msg(`${GIORNI_LUNGHI[g]}: ogni fascia deve durare almeno 20 minuti`);
        if (i > 0 && minutiDa(fasce[i].inizio) < minutiDa(fasce[i - 1].fine)) return msg(`${GIORNI_LUNGHI[g]}: le fasce si sovrappongono`);
      }
    }
    const riepilogo = ORDINE_SETTIMANA.map((g) => `${GIORNI_LUNGHI[g].slice(0, 3)}: ${bozza[g]?.length ? bozza[g].map((f) => `${f.inizio}–${f.fine}`).join(", ") : "chiuso"}`).join("\n");
    chiediConferma({
      icona: "time-outline",
      testoConferma: "Sì, salva",
      messaggio: `Salvare il nuovo orario di ${nomeSede}, valido ${quando}?\n\n${riepilogo}\n\n`
        + (validoDal === oggiIso() ? "Vale subito per le nuove prenotazioni." : "Fino ad allora i clienti vedono l'orario attuale.")
        + " Gli appuntamenti già presi restano validi.",
      azione: async () => {
        const d = await chiamata(fetchAuth, `${BACKEND_URL}/api/admin/orari-sedi/${sede}`, { method: "PUT", body: JSON.stringify({ valido_dal: validoDal, giorni: bozza }) });
        setRicarica((n) => n + 1);
        onOrari();
        return d.messaggio;
      },
    });
  };
  const annullaProgrammata = (vd: string) =>
    chiediConferma({
      icona: "close-circle-outline",
      testoConferma: "Sì, annulla",
      messaggio: `Annullare l'orario di ${nomeSede} programmato da ${dataLunga(vd)}?\n\nResterà in vigore l'orario precedente.`,
      azione: async () => {
        const d = await chiamata(fetchAuth, `${BACKEND_URL}/api/admin/orari-sedi/${sede}/versioni/${vd}`, { method: "DELETE" });
        setRicarica((n) => n + 1);
        onOrari();
        return d.messaggio;
      },
    });

  return (
    <View style={st.titCard}>
      <Intestazione icona="time-outline" titolo="Orari delle sedi" sotto="Orario standard di apertura e chiusura, giorno per giorno. Puoi programmarlo da una data futura." />

      <Text style={st.mLabel}>SEDE</Text>
      <View style={[st.mGrid, { marginBottom: 14 }]}>
        {sedi.map((s) => (
          <Pressable key={s.id} style={[st.mChip, { flex: 1, alignItems: "center" }, sede === s.id && st.mChipA]} onPress={() => setSede(s.id)}>
            <Text style={[st.mChipText, sede === s.id && st.mChipTextA]}>{s.nome}</Text>
          </Pressable>
        ))}
      </View>

      <SelettoreValidita valore={validoDal} onCambia={setValidoDal} />

      {!bozza ? (
        <ActivityIndicator color="#D4AF37" style={{ marginVertical: 20 }} />
      ) : (
        ORDINE_SETTIMANA.map((g) => {
          const fasce = bozza[g] || [];
          const aperto = fasce.length > 0;
          return (
            <View key={g} style={st.consGiorno}>
              <View style={st.consGiornoTesta}>
                <Text style={[st.consGiornoNome, !aperto && { color: "#666" }]}>{GIORNI_LUNGHI[g]}</Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <Pressable style={[st.consPill, aperto && st.consPillA]} onPress={() => !aperto && apriChiudi(g, true)}>
                    <Text style={[st.consPillText, aperto && st.consPillTextA]}>Aperto</Text>
                  </Pressable>
                  <Pressable style={[st.consPill, !aperto && st.consPillChiuso]} onPress={() => aperto && apriChiudi(g, false)}>
                    <Text style={[st.consPillText, !aperto && st.consPillTextChiuso]}>Chiuso</Text>
                  </Pressable>
                </View>
              </View>
              {fasce.map((f, i) => (
                <View key={i} style={st.consFascia}>
                  <View style={{ flex: 1 }}><OrarioInline value={f.inizio} onChange={(v) => cambiaFascia(g, i, "inizio", v)} marginBottom={0} /></View>
                  <Text style={{ color: "#555", fontSize: 13 }}>–</Text>
                  <View style={{ flex: 1 }}><OrarioInline value={f.fine} onChange={(v) => cambiaFascia(g, i, "fine", v)} marginBottom={0} /></View>
                  <Pressable onPress={() => togliFascia(g, i)} style={st.consTogli} accessibilityLabel={`Togli fascia ${GIORNI_LUNGHI[g]}`}>
                    <Ionicons name="close" size={16} color="#888" />
                  </Pressable>
                </View>
              ))}
              {aperto && fasce.length < 3 && (
                <Pressable onPress={() => aggiungiFascia(g)} style={st.consAggiungi}>
                  <Ionicons name="add" size={15} color="#D4AF37" />
                  <Text style={st.consAggiungiText}>Aggiungi fascia (es. pausa pranzo)</Text>
                </Pressable>
              )}
            </View>
          );
        })
      )}

      <BottoneOro icona="save-outline" testo={validoDal === oggiIso() ? "Salva orario (da oggi)" : `Programma dal ${dataBreve(validoDal)}`} onPress={salva} />
      <Programmate voci={programmate} onAnnulla={annullaProgrammata} />
    </View>
  );
}

// ═══ TURNI FISSI DEI BARBIERI (programmabili) ═══
function SezioneTurni({ sedi, fetchAuth, chiediConferma }: Props) {
  const [validoDal, setValidoDal] = useState(oggiIso());
  const [barbieri, setBarbieri] = useState<any[]>([]);
  const [scelto, setScelto] = useState<number | null>(null);
  const [bozza, setBozza] = useState<Record<number, number | null>>({});
  const [ricarica, setRicarica] = useState(0);
  // Turni in vigore alla data scelta (più le modifiche programmate di ogni barbiere)
  useEffect(() => {
    fetchAuth(`${BACKEND_URL}/api/admin/turni?data=${validoDal}`)
      .then((r) => r.json())
      .then((d) => {
        if (!Array.isArray(d)) return;
        setBarbieri(d);
        setScelto((s) => s ?? d[0]?.id ?? null);
      })
      .catch(() => {});
  }, [validoDal, ricarica]);
  useEffect(() => {
    const b = barbieri.find((x) => x.id === scelto);
    if (!b) return;
    const t: Record<number, number | null> = {};
    for (let g = 0; g <= 6; g++) t[g] = b.turni?.[g] ?? null;
    setBozza(t);
  }, [scelto, barbieri]);

  const nomeSede = (id: number | null) => (id ? sedi.find((s) => s.id === id)?.nome || "" : "Riposo");
  const b = barbieri.find((x) => x.id === scelto);
  const quando = validoDal === oggiIso() ? "da oggi" : `da ${dataLunga(validoDal)}`;
  const salva = () => {
    if (!b) return;
    const riepilogo = ORDINE_SETTIMANA.map((g) => `${GIORNI_LUNGHI[g].slice(0, 3)}: ${nomeSede(bozza[g] ?? null)}`).join("\n");
    chiediConferma({
      icona: "people-outline",
      testoConferma: "Sì, salva",
      messaggio: `Salvare i turni di ${b.nome}, validi ${quando}?\n\n${riepilogo}\n\n`
        + (validoDal === oggiIso() ? "Valgono subito per le nuove prenotazioni." : "Fino ad allora restano i turni attuali.")
        + " Gli appuntamenti già presi restano validi.",
      azione: async () => {
        const d = await chiamata(fetchAuth, `${BACKEND_URL}/api/admin/turni/${b.id}`, { method: "PUT", body: JSON.stringify({ valido_dal: validoDal, turni: bozza }) });
        setRicarica((n) => n + 1);
        return d.messaggio;
      },
    });
  };
  const annullaProgrammata = (vd: string) =>
    b && chiediConferma({
      icona: "close-circle-outline",
      testoConferma: "Sì, annulla",
      messaggio: `Annullare i turni di ${b.nome} programmati da ${dataLunga(vd)}?\n\nResteranno in vigore i turni precedenti.`,
      azione: async () => {
        const d = await chiamata(fetchAuth, `${BACKEND_URL}/api/admin/turni/${b.id}/versioni/${vd}`, { method: "DELETE" });
        setRicarica((n) => n + 1);
        return d.messaggio;
      },
    });

  return (
    <View style={st.titCard}>
      <Intestazione icona="people-outline" titolo="Turni dello staff" sotto="Per ogni giorno della settimana, in quale sede lavora il barbiere (o se è a riposo). Puoi programmarli da una data futura." />

      <SelettoreValidita valore={validoDal} onCambia={setValidoDal} />

      <Text style={st.mLabel}>BARBIERE</Text>
      <View style={[st.mGrid, { marginBottom: 14, flexWrap: "wrap" }]}>
        {barbieri.map((x) => (
          <Pressable key={x.id} style={[st.mChip, scelto === x.id && st.mChipA]} onPress={() => setScelto(x.id)}>
            <Text style={[st.mChipText, scelto === x.id && st.mChipTextA]}>{x.nome}</Text>
          </Pressable>
        ))}
      </View>

      {barbieri.length === 0 ? (
        <ActivityIndicator color="#D4AF37" style={{ marginVertical: 20 }} />
      ) : (
        ORDINE_SETTIMANA.map((g) => (
          <View key={g} style={st.consGiorno}>
            <View style={st.consGiornoTesta}>
              <Text style={[st.consGiornoNome, bozza[g] == null && { color: "#666" }]}>{GIORNI_LUNGHI[g]}</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              {[null, ...sedi.map((s) => s.id)].map((id) => {
                const sel = (bozza[g] ?? null) === id;
                return (
                  <Pressable
                    key={String(id)}
                    style={[st.consPill, sel && (id === null ? st.consPillChiuso : st.consPillA)]}
                    onPress={() => setBozza((x) => ({ ...x, [g]: id }))}
                  >
                    <Text style={[st.consPillText, sel && (id === null ? st.consPillTextChiuso : st.consPillTextA)]}>{nomeSede(id)}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}

      <BottoneOro icona="save-outline" testo={validoDal === oggiIso() ? "Salva turni (da oggi)" : `Programma dal ${dataBreve(validoDal)}`} onPress={salva} />
      <Programmate
        voci={(b?.programmati || []).map((p: any) => ({
          valido_dal: p.valido_dal,
          riepilogo: ORDINE_SETTIMANA.map((g) => `${GIORNI_LUNGHI[g].slice(0, 3)} ${nomeSede(p.turni?.[g] ?? null)}`).join(" · "),
        }))}
        onAnnulla={annullaProgrammata}
      />
    </View>
  );
}

// ═══ ARCHIVIO OPERAZIONI + REPORT PDF ═══
function SezioneArchivio({ fetchAuth, msg }: Props) {
  const ora = new Date();
  const [anno, setAnno] = useState(ora.getFullYear());
  const [mese, setMese] = useState(ora.getMonth() + 1);
  const [righe, setRighe] = useState<any[] | null>(null);
  const [aperta, setAperta] = useState<number | null>(null);
  const [esporto, setEsporto] = useState(false);

  useEffect(() => {
    setRighe(null);
    setAperta(null);
    fetchAuth(`${BACKEND_URL}/api/admin/developer-logs?anno=${anno}&mese=${mese}`)
      .then((r) => r.json())
      .then((d) => setRighe(Array.isArray(d) ? d : []))
      .catch(() => setRighe([]));
  }, [anno, mese]);

  const spostaMese = (n: number) => {
    const d = new Date(anno, mese - 1 + n, 1);
    setAnno(d.getFullYear());
    setMese(d.getMonth() + 1);
  };

  // Scarica il PDF del mese: la richiesta porta il token, quindi il file passa da un blob locale
  const esporta = async () => {
    if (Platform.OS !== "web") return msg("Esportazione disponibile dal browser");
    setEsporto(true);
    try {
      const res = await fetchAuth(`${BACKEND_URL}/api/admin/developer-logs/export?anno=${anno}&mese=${mese}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-operazioni-${anno}-${String(mese).padStart(2, "0")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      msg(`Report di ${MESI_IT[mese - 1]} ${anno} scaricato`);
    } catch {
      msg("Esportazione non riuscita");
    } finally {
      setEsporto(false);
    }
  };

  return (
    <View style={st.titCard}>
      <Intestazione icona="document-text-outline" titolo="Archivio operazioni" sotto="Registro automatico delle operazioni della console. Il report mensile in PDF documenta l'attività di manutenzione." />

      <View style={st.consMese}>
        <Pressable onPress={() => spostaMese(-1)} style={st.consMeseFreccia} accessibilityLabel="Mese precedente">
          <Ionicons name="chevron-back" size={20} color="#D4AF37" />
        </Pressable>
        <Text style={st.consMeseTesto}>{MESI_IT[mese - 1]} {anno}</Text>
        <Pressable onPress={() => spostaMese(1)} style={st.consMeseFreccia} accessibilityLabel="Mese successivo">
          <Ionicons name="chevron-forward" size={20} color="#D4AF37" />
        </Pressable>
      </View>

      <View style={{ marginBottom: 16 }}>
        <BottoneOro icona="download-outline" testo="Esporta Report (PDF)" onPress={esporta} inCorso={esporto} />
      </View>

      {righe === null ? (
        <ActivityIndicator color="#D4AF37" style={{ marginVertical: 20 }} />
      ) : righe.length === 0 ? (
        <Text style={[st.titCardSub, { textAlign: "center", marginVertical: 12 }]}>Nessuna operazione registrata in questo mese</Text>
      ) : (
        <>
          <Text style={st.mLabel}>{righe.length} {righe.length === 1 ? "OPERAZIONE" : "OPERAZIONI"}</Text>
          {righe.map((r) => (
            <RigaFisarmonica
              key={r.id}
              titolo={r.azione_etichetta}
              data={dataBreve(r.data)}
              aperta={aperta === r.id}
              onTocca={() => setAperta(aperta === r.id ? null : r.id)}
            >
              <Text style={st.consAccTesto}>{r.descrizione}</Text>
              {(r.righe || []).map((x: string, i: number) => (
                <Text key={i} style={st.consAccDettaglio}>{x}</Text>
              ))}
              <Text style={st.consAccDettaglio}>Registrata il {dataBreve(r.data)} alle {r.ora}</Text>
            </RigaFisarmonica>
          ))}
        </>
      )}
    </View>
  );
}

const SEZIONI = [
  { id: "comunicazioni", etichetta: "Comunicazioni", icona: "megaphone-outline" },
  { id: "aperture", etichetta: "Aperture", icona: "calendar-outline" },
  { id: "orari", etichetta: "Orari sedi", icona: "time-outline" },
  { id: "turni", etichetta: "Turni", icona: "people-outline" },
  { id: "archivio", etichetta: "Archivio", icona: "document-text-outline" },
] as const;

export default function ConsoleDeveloper(props: Props) {
  const [sezione, setSezione] = useState<(typeof SEZIONI)[number]["id"]>("comunicazioni");
  // Orario in vigore oggi: serve alle aperture straordinarie (quali giorni sono di chiusura)
  const [orari, setOrari] = useState<OrarioGiorno[]>([]);
  const caricaOrari = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/orari-sedi`);
      const d = await res.json();
      if (Array.isArray(d)) setOrari(d);
    } catch {}
  };
  useEffect(() => { caricaOrari(); }, []);

  return (
    <View style={st.titWrap}>
      <View>
        <Text style={st.consTitolo}>Console Developer</Text>
        <Text style={st.titCardSub}>Amministrazione del sistema, separata dall'agenda dei barbieri.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {SEZIONI.map((s) => {
          const attiva = sezione === s.id;
          return (
            <Pressable key={s.id} style={[st.consNav, attiva && st.consNavA]} onPress={() => setSezione(s.id)}>
              <Ionicons name={s.icona} size={15} color={attiva ? "#0A0A0A" : "#D4AF37"} />
              <Text style={[st.consNavText, attiva && st.consNavTextA]}>{s.etichetta}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {sezione === "comunicazioni" && <SezioneComunicazioni {...props} />}
      {sezione === "aperture" && <SezioneAperture {...props} orari={orari} />}
      {sezione === "orari" && <SezioneOrari {...props} onOrari={caricaOrari} />}
      {sezione === "turni" && <SezioneTurni {...props} />}
      {sezione === "archivio" && <SezioneArchivio {...props} />}
    </View>
  );
}
