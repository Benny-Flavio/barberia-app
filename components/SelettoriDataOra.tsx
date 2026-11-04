import React, { useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";

// Selettori di data e ora in stile nero/oro, usati dalla dashboard staff e dalla Console Developer
export const MESI_IT = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const GIORNI_IT = ["Lu","Ma","Me","Gi","Ve","Sa","Do"];

export function CalendarioInline({ value, onChange, min, marginBottom = 14, disabledDow = [] }: {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  marginBottom?: number;
  disabledDow?: number[];
}) {
  const oggi = new Date();
  const oggiStr = `${oggi.getFullYear()}-${String(oggi.getMonth()+1).padStart(2,"0")}-${String(oggi.getDate()).padStart(2,"0")}`;
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [measuredH, setMeasuredH] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split("-")[0]) : oggi.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split("-")[1]) - 1 : oggi.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayMon = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayMon; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const rows: (number | null)[][] = [];
  for (let r = 0; r < Math.ceil(cells.length / 7); r++) rows.push(cells.slice(r*7, r*7+7));

  // fallback height se non ancora misurato: header(52) + intestazione giorni(30) + righe(30px cad) + padding(28)
  const estimatedH = measuredH > 0 ? measuredH : 110 + rows.length * 30;

  const fmtDisplay = (v: string) => { const [y,m,d] = v.split("-"); return `${d}/${m}/${y}`; };

  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y-1)) : setViewMonth(m => m-1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y+1)) : setViewMonth(m => m+1);

  const openCal = () => {
    setVisible(true);
    setOpen(true);
    Animated.parallel([
      Animated.timing(animVal,   { toValue: 1, duration: 260, useNativeDriver: false }),
      Animated.timing(heightAnim, { toValue: estimatedH, duration: 260, useNativeDriver: false }),
    ]).start();
  };

  const closeCal = () => {
    setOpen(false);
    Animated.parallel([
      Animated.timing(animVal,   { toValue: 0, duration: 260, useNativeDriver: false }),
      Animated.timing(heightAnim, { toValue: 0, duration: 260, useNativeDriver: false }),
    ]).start(() => setVisible(false));
  };

  const selectDay = (day: number) => {
    const ds = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    if (min && ds < min) return;
    if (disabledDow.length > 0 && disabledDow.includes(new Date(ds).getDay())) return;
    onChange(ds);
    closeCal();
  };

  return (
    <View style={{ marginBottom }}>
      <Pressable
        onPress={() => open ? closeCal() : openCal()}
        style={{ backgroundColor: "#0A0A0A", borderWidth: 1.5, borderColor: open ? "#D4AF37" : "#1A1A1A", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <Text style={{ color: value ? "#FFF" : "#444", fontSize: 15 }}>{value ? fmtDisplay(value) : "GG / MM / AAAA"}</Text>
        <Text style={{ color: open ? "#D4AF37" : "#444", fontSize: 11 }}>{open ? "▲" : "▼"}</Text>
      </Pressable>

      {/* wrapper che anima l'altezza — impedisce al layout di collassare di scatto */}
      {visible && (
        <Animated.View style={{ height: heightAnim, overflow: "hidden", marginTop: 6 }}>
          <Animated.View
            onLayout={(e) => { const h = e.nativeEvent.layout.height; if (h > 0) setMeasuredH(h); }}
            style={{ opacity: animVal, backgroundColor: "#0D0D0D", borderRadius: 14, borderWidth: 1, borderColor: "#1E1E1E", padding: 14 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Pressable onPress={prevMonth} style={{ padding: 10 }}>
                <Text style={{ color: "#666", fontSize: 18, lineHeight: 18 }}>‹</Text>
              </Pressable>
              <Text style={{ flex: 1, textAlign: "center", color: "#DDD", fontWeight: "700", fontSize: 13, letterSpacing: 1 }}>
                {MESI_IT[viewMonth].toUpperCase()} {viewYear}
              </Text>
              <Pressable onPress={nextMonth} style={{ padding: 10 }}>
                <Text style={{ color: "#666", fontSize: 18, lineHeight: 18 }}>›</Text>
              </Pressable>
            </View>

            <View style={{ flexDirection: "row", marginBottom: 8 }}>
              {GIORNI_IT.map(g => (
                <View key={g} style={{ flex: 1, alignItems: "center" }}>
                  <Text style={{ color: "#444", fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }}>{g}</Text>
                </View>
              ))}
            </View>

            {rows.map((row, ri) => (
              <View key={ri} style={{ flexDirection: "row" }}>
                {Array.from({ length: 7 }, (_, ci) => {
                  const day = row[ci] ?? null;
                  if (!day) return <View key={ci} style={{ flex: 1, paddingVertical: 8 }} />;
                  const ds = `${viewYear}-${String(viewMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const isSelected = ds === value;
                  const isOggi = ds === oggiStr;
                  const isDowDisabled = disabledDow.length > 0 && disabledDow.includes(new Date(ds).getDay());
                  const isDisabled = !!(min && ds < min) || isDowDisabled;
                  return (
                    <Pressable
                      key={ci}
                      onPress={() => !isDisabled && selectDay(day)}
                      style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8, backgroundColor: isSelected ? "#D4AF37" : "transparent", opacity: isDisabled ? 0.2 : 1 }}
                    >
                      <Text style={{ color: isSelected ? "#000" : isOggi ? "#D4AF37" : "#AAA", fontSize: 13, fontWeight: isSelected || isOggi ? "700" : "400" }}>
                        {day}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const ORE_DISP = ["07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22"];
const MIN_DISP = ["00","10","20","30","40","50"];

export function OrarioInline({ value, onChange, marginBottom = 14 }: {
  value: string;
  onChange: (v: string) => void;
  marginBottom?: number;
}) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [measuredH, setMeasuredH] = useState(0);
  const animVal = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

  const parts = value ? value.split(":") : ["", ""];
  const selOra = parts[0] || "";
  const selMin = parts[1]?.slice(0, 2) || "";

  const estimatedH = measuredH > 0 ? measuredH : 240;

  const openSel = () => {
    setVisible(true);
    setOpen(true);
    Animated.parallel([
      Animated.timing(animVal,    { toValue: 1, duration: 260, useNativeDriver: false }),
      Animated.timing(heightAnim, { toValue: estimatedH, duration: 260, useNativeDriver: false }),
    ]).start();
  };

  const closeSel = () => {
    setOpen(false);
    Animated.parallel([
      Animated.timing(animVal,    { toValue: 0, duration: 260, useNativeDriver: false }),
      Animated.timing(heightAnim, { toValue: 0, duration: 260, useNativeDriver: false }),
    ]).start(() => setVisible(false));
  };

  const pickOra = (ora: string) => {
    onChange(`${ora}:${selMin || "00"}`);
  };

  const pickMin = (min: string) => {
    onChange(`${selOra || "09"}:${min}`);
    closeSel();
  };

  return (
    <View style={{ marginBottom }}>
      <Pressable
        onPress={() => open ? closeSel() : openSel()}
        style={{ backgroundColor: "#0A0A0A", borderWidth: 1.5, borderColor: open ? "#D4AF37" : "#1A1A1A", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
      >
        <Text style={{ color: value ? "#FFF" : "#444", fontSize: 15 }}>{value || "HH : MM"}</Text>
        <Text style={{ color: open ? "#D4AF37" : "#444", fontSize: 11 }}>{open ? "▲" : "▼"}</Text>
      </Pressable>

      {visible && (
        <Animated.View style={{ height: heightAnim, overflow: "hidden", marginTop: 6 }}>
          <Animated.View
            onLayout={(e) => { const h = e.nativeEvent.layout.height; if (h > 0) setMeasuredH(h); }}
            style={{ opacity: animVal, backgroundColor: "#0D0D0D", borderRadius: 14, borderWidth: 1, borderColor: "#1E1E1E", padding: 14 }}
          >
            <Text style={{ color: "#444", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 }}>ORA</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {ORE_DISP.map(ora => (
                <Pressable
                  key={ora}
                  onPress={() => pickOra(ora)}
                  style={{ paddingVertical: 7, paddingHorizontal: 10, borderRadius: 8, backgroundColor: selOra === ora ? "#D4AF37" : "#141414", minWidth: 40, alignItems: "center" }}
                >
                  <Text style={{ color: selOra === ora ? "#000" : "#AAA", fontSize: 13, fontWeight: selOra === ora ? "700" : "400" }}>{ora}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ height: 1, backgroundColor: "#1E1E1E", marginBottom: 12 }} />

            <Text style={{ color: "#444", fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 8 }}>MINUTI</Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {MIN_DISP.map(min => (
                <Pressable
                  key={min}
                  onPress={() => pickMin(min)}
                  style={{ flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: selMin === min ? "#D4AF37" : "#141414", alignItems: "center" }}
                >
                  <Text style={{ color: selMin === min ? "#000" : "#AAA", fontSize: 13, fontWeight: selMin === min ? "700" : "400" }}>:{min}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}
