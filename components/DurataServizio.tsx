import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

// Durata del servizio ("⏳ 20 min"): unico componente per listino e scelta servizio,
// così stile e spaziatura sono identici in tutte le card
export default function DurataServizio({ minuti, style }: { minuti: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[st.chip, style]}>
      <Text style={st.testo}>⏳ {minuti} min</Text>
    </View>
  );
}

const st = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  testo: { color: "#888", fontSize: 13, fontWeight: "600" },
});
