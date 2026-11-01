import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

// Durata del servizio (clessidra + "20 min"): unico componente per listino e scelta servizio,
// così stile e spaziatura sono identici in tutte le card
export default function DurataServizio({ minuti, style }: { minuti: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[st.chip, style]}>
      <Ionicons name="hourglass-outline" size={13} color="#888" />
      <Text style={st.testo}>{minuti} min</Text>
    </View>
  );
}

const st = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  testo: { color: "#888", fontSize: 13, fontWeight: "600" },
});
