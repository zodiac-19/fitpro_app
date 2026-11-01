import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { fmt, useI18n } from '../i18n';
import MuscleMap from '../components/MuscleMap';
import { Bar, Btn, Card, Chip, Muted } from '../components/UI';
import { C, R } from '../theme';
import {
  burnedDay, burnedWeek, calorieTarget, eaten, estimatedBodyFat, goalLabel, goalProgress, netDay,
  r1, scoreColor, titleFlags, todayIndex, weakestMuscle,
} from '../utils/fitness';

export function NetChip({ s, day, t }) {
  if (!eaten(s, day)) return <Muted>{t.ne}: —</Muted>;
  const net = netDay(s, day);
  const good = s.scan.bodyFat >= 15 ? net < 0 : net > 0;
  const color = good ? C.volt : C.gold;
  return (
    <View style={[st.pill, { borderColor: color }]}>
      <Text style={{ color, fontSize: 12 }}>{net < 0 ? t.df : t.sr} {Math.abs(Math.round(net))} kcal</Text>
    </View>
  );
}

function CoachModal({ visible, onClose, s, t }) {
  const [answer, setAnswer] = useState('');
  const weak = weakestMuscle(s.scores);
  const ask = (n) => setAnswer(n === 1
    ? fmt(t.ca, { m: t.m[weak], s: Math.round(s.scores[weak]) })
    : fmt(t.a2, { c: Math.round(s.scores.chest), k: burnedWeek(s) }));
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.sheet} onPress={() => {}}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label={t.q1} onPress={() => ask(1)} />
            <Chip label={t.q2} onPress={() => ask(2)} />
          </View>
          {answer ? <Text style={{ color: C.text, fontSize: 15, lineHeight: 22 }}>{answer}</Text> : null}
          <Btn label={t.close} onPress={onClose} outline />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function HomeScreen() {
  const { state: s } = useApp();
  const { t, row, align } = useI18n();
  const [selected, setSelected] = useState(null);
  const [coach, setCoach] = useState(false);
  const today = todayIndex();
  const weak = weakestMuscle(s.scores);
  const shown = selected || weak;
  const level = (v) => (v < 45 ? t.la : v < 75 ? t.so : t.el);
  const flags = titleFlags(s.scores);
  const active = flags.indexOf(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={st.pad}>
        <View style={[st.between, row]}>
          <Text style={st.h1}>{t.hey}, {s.profile.name}</Text>
          <Pressable onPress={() => setCoach(true)} style={st.coachBtn}><Text style={{ color: C.volt }}>✦ {t.coach}</Text></Pressable>
        </View>

        <Card>
          <MuscleMap scores={s.scores} selected={selected} onSelect={setSelected} flipLabel={t.flip} width={210} />
          <Muted style={{ textAlign: 'center' }}>{t.tap}</Muted>
        </Card>

        <Card color={scoreColor(s.scores[shown])}>
          <View style={[st.between, row]}>
            <Text style={st.h2}>{t.m[shown]}</Text>
            <Text style={[st.h2, { color: scoreColor(s.scores[shown]) }]}>{Math.round(s.scores[shown])}</Text>
          </View>
          <Muted style={align}>{selected ? level(s.scores[shown]) : `${t.fo} · ${level(s.scores[shown])}`}</Muted>
        </Card>

        <Card>
          <Muted style={align}>{t.ttl}: <Text style={{ color: C.gold }}>{active >= 0 ? t.tt[active] : '—'}</Text></Muted>
          <View style={[st.wrap, row]}>
            {flags.map((on, i) => (
              <View key={i} style={[st.pill, { borderColor: on ? C.gold : C.edge }]}>
                <Text style={{ color: on ? C.gold : C.mute, fontSize: 13 }}>{on ? '♛' : '🔒'} {t.tt[i]}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <View style={[st.between, row]}><Text style={st.h3}>{t.td}</Text><NetChip s={s} day={today} t={t} /></View>
          <View style={[st.grid, row]}>
            <View><Muted>{t.ea}</Muted><Text style={st.num}>{eaten(s, today)} <Text style={st.small}>/ {calorieTarget(s)}</Text></Text></View>
            <View><Muted>{t.bu}</Muted><Text style={st.num}>{burnedDay(s, today)}</Text></View>
            <View><Muted>{t.fe}</Muted><Text style={[st.num, { color: C.volt }]}>{r1(estimatedBodyFat(s))}%</Text></View>
          </View>
        </Card>

        <Card>
          <View style={[st.between, row]}>
            <Text style={st.h3}>{t.rm}</Text>
            <View style={[st.pill, { borderColor: C.gold }]}><Text style={{ color: C.gold, fontSize: 12 }}>{t.lv} {s.lvl}</Text></View>
          </View>
          {s.goals.map((g, i) => {
            const p = goalProgress(s, g);
            return (
              <View key={i} style={{ gap: 6 }}>
                <View style={[st.between, row]}>
                  <Text style={[st.goal, { flex: 1 }, align]}>{goalLabel(t, g)}</Text>
                  <Text style={{ color: C.volt }}>{Math.round(p)}%</Text>
                </View>
                <Bar value={p} rtl={align.textAlign === 'right'} />
              </View>
            );
          })}
        </Card>
      </ScrollView>
      <CoachModal visible={coach} onClose={() => setCoach(false)} s={s} t={t} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  pad: { padding: 18, gap: 14 },
  between: { justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  h1: { color: C.text, fontSize: 24, fontWeight: '800' },
  h2: { color: C.text, fontSize: 19, fontWeight: '700' },
  h3: { color: C.text, fontSize: 16, fontWeight: '700' },
  goal: { color: C.mute, fontSize: 13 },
  coachBtn: { borderWidth: 1, borderColor: C.volt, borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 6 },
  pill: { borderWidth: 1, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 4 },
  wrap: { flexWrap: 'wrap', gap: 8 },
  grid: { justifyContent: 'space-between' },
  num: { color: C.text, fontSize: 17, fontWeight: '600' },
  small: { color: C.mute, fontSize: 12, fontWeight: '400' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.panel, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: 20, gap: 14 },
});
