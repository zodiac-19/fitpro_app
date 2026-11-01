import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { C, R } from '../theme';

export function Card({ children, color, style }) {
  return <View style={[s.card, color && { borderColor: color }, style]}>{children}</View>;
}

export function Btn({ label, onPress, outline, disabled, style, children }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, outline && s.btnOutline, disabled && { opacity: 0.4 }, pressed && { transform: [{ scale: 0.98 }] }, style]}
    >
      {children}
      {label ? <Text style={[s.btnText, outline && { color: C.text }]}>{label}</Text> : null}
    </Pressable>
  );
}

export function Bar({ value, color = C.volt, rtl }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <View style={[s.track, rtl && { transform: [{ scaleX: -1 }] }]}>
      <View style={{ height: 8, borderRadius: 4, width: `${pct}%`, backgroundColor: color }} />
    </View>
  );
}

export function Chip({ label, active, onPress, color = C.volt }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: color, borderColor: color }]}>
      <Text style={[s.chipText, active && { color: C.bg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ style, ...props }) {
  return <TextInput placeholderTextColor={C.mute} style={[s.input, style]} {...props} />;
}

export const Title = ({ children, style }) => <Text style={[s.title, style]}>{children}</Text>;
export const Muted = ({ children, style }) => <Text style={[s.muted, style]}>{children}</Text>;

export const s = StyleSheet.create({
  card: { backgroundColor: C.panel, borderRadius: R.lg, borderWidth: 1, borderColor: C.edge, padding: 14, gap: 10 },
  btn: { backgroundColor: C.volt, borderRadius: R.md, paddingVertical: 13, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.edge },
  btnText: { color: C.bg, fontSize: 15, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, backgroundColor: C.bg, overflow: 'hidden' },
  chip: { borderWidth: 1, borderColor: C.edge, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { color: C.text, fontSize: 13 },
  input: { backgroundColor: C.bg, color: C.text, borderColor: C.edge, borderWidth: 1, borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  title: { color: C.text, fontSize: 22, fontWeight: '700' },
  muted: { color: C.mute, fontSize: 13 },
});
