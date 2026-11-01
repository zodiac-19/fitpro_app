import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../context/AppContext';
import { fmt, useI18n } from '../i18n';
import useSquad from '../hooks/useSquad';
import MuscleMap from '../components/MuscleMap';
import { Bar, Btn, Card, Chip, Field, Muted } from '../components/UI';
import { SHARE_BASE } from '../constants';
import { C, R } from '../theme';
import { buildPublicProfile, MUSCLES, titleFlags } from '../utils/fitness';

const avg = (goals) => (goals && goals.length ? Math.round(goals.reduce((a, g) => a + g.p, 0) / goals.length) : 0);
const goalText = (t, g) => {
  if (g.k === 'photo') return fmt(t.gp, { n: g.t });
  if (g.k === 'muscle') return fmt(t.gm, { m: t.m[g.m] || '', n: g.t });
  if (g.k === 'kcal') return fmt(t.gk, { n: g.t });
  if (g.k === 'sess') return fmt(t.gs, { n: g.t });
  return fmt(t.ge, { n: g.t });
};

function StatRow({ label, a, b }) {
  return (
    <View style={st.statRow}>
      <Text style={[st.statA, { color: C.volt }]}>{a}</Text>
      <Text style={st.statLabel}>{label}</Text>
      <Text style={[st.statA, { color: C.gold }]}>{b}</Text>
    </View>
  );
}

function MuscleRow({ label, a, b }) {
  return (
    <View style={st.mRow}>
      <View style={st.side}><Text style={[st.val, { color: C.volt }]}>{Math.round(a)}</Text><View style={{ flex: 1 }}><Bar value={a} /></View></View>
      <Text style={st.mLabel}>{label}</Text>
      <View style={st.side}><View style={{ flex: 1 }}><Bar value={b} color={C.gold} /></View><Text style={[st.val, { color: C.gold, textAlign: 'left' }]}>{Math.round(b)}</Text></View>
    </View>
  );
}

function GoalColumn({ name, color, goals, t }) {
  return (
    <View style={{ flex: 1, gap: 8 }}>
      <Text style={{ color, fontWeight: '700' }} numberOfLines={1}>{name}</Text>
      {goals.map((g, i) => (
        <View key={i} style={{ gap: 4 }}>
          <Text style={{ color: C.mute, fontSize: 12 }}>{goalText(t, g)}</Text>
          <View style={st.goalLine}><View style={{ flex: 1 }}><Bar value={g.p} color={color} /></View><Text style={{ color, fontSize: 12 }}>{g.p}%</Text></View>
        </View>
      ))}
    </View>
  );
}

function WeekDots({ week, color }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center' }}>
      {week.map((on, i) => (
        <View key={i} style={[st.dot, { borderColor: on ? color : C.edge, backgroundColor: on ? color : 'transparent' }]}>
          {on ? <Text style={{ color: C.bg, fontSize: 11 }}>✓</Text> : null}
        </View>
      ))}
    </View>
  );
}

// Fully dynamic: works for any two users, nothing is hard-coded.
const zeroScores = () => Object.fromEntries(MUSCLES.map((m) => [m, 0]));
// A friend's document may be partial (older app version, first sync): fill safe defaults.
const normalize = (d) => ({
  name: d.name || '…', age: d.age ?? '—', weight: d.weight ?? '—', height: d.height ?? '—',
  bodyFat: d.bodyFat ?? '—', percentile: d.percentile ?? '—', type: [0, 1, 2].includes(d.type) ? d.type : 0,
  level: d.level || 1, sessions: d.sessions || 0, burned: d.burned || 0,
  week: Array.isArray(d.week) && d.week.length === 7 ? d.week : Array(7).fill(false),
  scores: { ...zeroScores(), ...(d.scores || {}) }, goals: Array.isArray(d.goals) ? d.goals : [], lifts: Array.isArray(d.lifts) ? d.lifts : [],
});

function Compare({ me, other: rawOther, t }) {
  const other = normalize(rawOther);
  const [view, setView] = useState('front');
  const a = avg(me.goals);
  const b = avg(other.goals);
  const verdict = a === b ? t.tie : a > b ? fmt(t.lead, { n: a - b }) : fmt(t.behind, { name: other.name, n: b - a });
  const tf = (s) => { const i = titleFlags(s).indexOf(true); return i >= 0 ? t.tt[i] : ''; };
  const flip = () => setView((v) => (v === 'front' ? 'back' : 'front'));
  const lifts = (l) => (l && l.length ? l : []);

  return (
    <View style={{ gap: 14 }}>
      <Card>
        <View style={st.bodies}>
          <Pressable onPress={flip} style={st.bodyCol}>
            <Text style={[st.name, { color: C.volt }]} numberOfLines={1}>{me.name}</Text>
            <Muted>{t.lv} {me.level}{tf(me.scores) ? ` · ${tf(me.scores)}` : ''}</Muted>
            <MuscleMap scores={me.scores} width={120} view={view} showFlip={false} />
          </Pressable>
          <Pressable onPress={flip} style={st.bodyCol}>
            <Text style={[st.name, { color: C.gold }]} numberOfLines={1}>{other.name}</Text>
            <Muted>{t.lv} {other.level}{tf(other.scores) ? ` · ${tf(other.scores)}` : ''}</Muted>
            <MuscleMap scores={other.scores} width={120} view={view} showFlip={false} />
          </Pressable>
        </View>
        <Muted style={{ textAlign: 'center' }}>{t.flip}</Muted>
      </Card>

      <Card>
        <Text style={st.h3}>{t.pf}</Text>
        <StatRow label={t.ag} a={me.age} b={other.age} />
        <StatRow label={t.we} a={`${me.weight} kg`} b={`${other.weight} kg`} />
        <StatRow label={t.he} a={`${me.height} cm`} b={`${other.height} cm`} />
        <StatRow label={t.bf} a={`${me.bodyFat}%`} b={`${other.bodyFat}%`} />
        <StatRow label={t.ty} a={t.tp[me.type]} b={t.tp[other.type]} />
        <StatRow label={t.pcl} a={`${me.percentile}%`} b={`${other.percentile}%`} />
        <StatRow label={t.ses} a={`${me.sessions}/6`} b={`${other.sessions}/6`} />
        <StatRow label={t.kcb} a={me.burned} b={other.burned} />
      </Card>

      <Card>
        <Text style={st.h3}>{t.mu}</Text>
        <View style={{ gap: 8 }}>
          {MUSCLES.map((m) => <MuscleRow key={m} label={t.m[m]} a={me.scores[m] || 0} b={other.scores[m] || 0} />)}
        </View>
      </Card>

      <Card>
        <Text style={st.h3}>{t.lifts}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {[[me, C.volt], [other, C.gold]].map(([p, color], i) => (
            <View key={i} style={{ flex: 1, gap: 6 }}>
              {lifts(p.lifts).length ? lifts(p.lifts).map((l, j) => (
                <View key={j} style={st.lift}><Text style={{ color: C.text, fontSize: 13, flex: 1 }} numberOfLines={1}>{l.n}</Text><Text style={{ color, fontSize: 13 }}>{l.k} kg</Text></View>
              )) : <Muted>—</Muted>}
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={st.h3}>{t.wk}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><WeekDots week={me.week} color={C.volt} /></View>
          <View style={{ flex: 1 }}><WeekDots week={other.week} color={C.gold} /></View>
        </View>
      </Card>

      <Card>
        <Text style={st.h3}>{t.ag2}</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <GoalColumn name={t.you} color={C.volt} goals={me.goals} t={t} />
          <GoalColumn name={other.name} color={C.gold} goals={other.goals} t={t} />
        </View>
      </Card>

      <Card color={a >= b ? C.volt : C.gold}>
        <Text style={{ color: a >= b ? C.volt : C.gold, fontWeight: '700', textAlign: 'center' }}>{verdict}</Text>
      </Card>
    </View>
  );
}

export default function SquadScreen() {
  const { state } = useApp();
  const { t, row, align } = useI18n();
  const squad = useSquad();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null); // { ok: boolean, text: string }
  const [copied, setCopied] = useState(false);
  const [picked, setPicked] = useState(0);

  const link = squad.code ? `${SHARE_BASE}${squad.code}` : '';
  const errorText = { invalid: t.bad, notfound: t.nofound, self: t.slf, error: t.er2 };

  const join = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await squad.connect(input);
      setInput('');
      setFeedback({ ok: true, text: t.ok });
    } catch (e) {
      setFeedback({ ok: false, text: errorText[e.message] || t.er2 });
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const share = () => Share.share({ message: `Fitpro: ${link}\n${t.yc}: ${squad.code}` });

  if (squad.status === 'unconfigured') {
    return <SafeAreaView style={st.safe} edges={['top']}><View style={st.pad}><Text style={st.h1}>{t.sq}</Text><Card><Text style={{ color: C.text, lineHeight: 22 }}>{t.nf}</Text></Card></View></SafeAreaView>;
  }
  if (squad.status === 'loading') {
    return <SafeAreaView style={[st.safe, { justifyContent: 'center' }]}><ActivityIndicator color={C.volt} /></SafeAreaView>;
  }
  if (squad.status === 'error') {
    return <SafeAreaView style={st.safe} edges={['top']}><View style={st.pad}><Card><Text style={{ color: C.ember }}>{t.er2}</Text></Card></View></SafeAreaView>;
  }

  const idx = Math.min(picked, Math.max(0, squad.friends.length - 1));
  const friend = squad.friends[idx];
  const me = buildPublicProfile(state);

  return (
    <SafeAreaView style={st.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.pad} keyboardShouldPersistTaps="handled">
          <View style={[st.between, row]}>
            <Text style={st.h1}>{t.sq}</Text>
            <View style={st.vis}><Text style={{ color: C.volt, fontSize: 12 }}>👁 {t.vis}</Text></View>
          </View>

          <Card>
            <Text style={[st.h3, align]}>{t.yc}</Text>
            <Muted style={align}>{t.iv2}</Muted>
            <View style={st.codeBox}><Text style={st.code}>{squad.code}</Text></View>
            <Muted style={{ textAlign: 'center' }}>{link}</Muted>
            <View style={[{ gap: 8 }, row]}>
              <Btn label={copied ? t.cd : t.cpy} onPress={copy} style={{ flex: 1 }} outline />
              <Btn label={t.shr} onPress={share} style={{ flex: 1 }} />
            </View>
          </Card>

          <Card>
            <Field value={input} onChangeText={setInput} placeholder={t.jn} autoCapitalize="none" autoCorrect={false} style={align} />
            <Btn label={busy ? t.lw : t.jb} onPress={join} disabled={busy || !input.trim()} />
            {feedback ? <Text style={{ color: feedback.ok ? C.volt : C.ember, fontSize: 13 }}>{feedback.text}</Text> : null}
          </Card>

          {squad.friends.length === 0 ? <Muted style={{ textAlign: 'center' }}>{t.nofr}</Muted> : (
            <>
              <View style={[st.wrap, row]}>
                {squad.friends.map((f, i) => (
                  <Chip key={f.uid} label={f.data?.name || '…'} active={i === idx} onPress={() => setPicked(i)} color={C.gold} />
                ))}
              </View>
              {friend.data ? <Compare me={me} other={friend.data} t={t} /> : <Card><Muted>{fmt(t.wt, { name: '…' })}</Muted></Card>}
              <Btn label={t.ul} onPress={() => squad.unlink(friend.linkId)} outline />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  pad: { padding: 18, gap: 14 },
  between: { justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  wrap: { flexWrap: 'wrap', gap: 8 },
  h1: { color: C.text, fontSize: 24, fontWeight: '800' },
  h3: { color: C.text, fontSize: 16, fontWeight: '700' },
  vis: { borderWidth: 1, borderColor: C.volt, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 },
  codeBox: { backgroundColor: C.bg, borderRadius: R.md, borderWidth: 1, borderColor: C.edge, paddingVertical: 14, alignItems: 'center' },
  code: { color: C.volt, fontSize: 30, fontWeight: '800', letterSpacing: 6 },
  bodies: { flexDirection: 'row', gap: 8, direction: 'ltr' },
  bodyCol: { flex: 1, alignItems: 'center', gap: 2 },
  name: { fontWeight: '700', fontSize: 15 },
  statRow: { flexDirection: 'row', alignItems: 'center', direction: 'ltr' },
  statA: { flex: 1, textAlign: 'center', fontSize: 13 },
  statLabel: { width: 96, textAlign: 'center', color: C.mute, fontSize: 12 },
  mRow: { flexDirection: 'row', alignItems: 'center', gap: 6, direction: 'ltr' },
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  val: { width: 22, textAlign: 'right', fontSize: 12 },
  mLabel: { width: 74, textAlign: 'center', color: C.mute, fontSize: 12 },
  lift: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  goalLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
