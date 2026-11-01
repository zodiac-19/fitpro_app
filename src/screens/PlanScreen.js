import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { Bar, Btn, Card, Chip, Field, Muted } from '../components/UI';
import { NetChip } from './HomeScreen';
import { C, R } from '../theme';
import {
  burnedDay, calorieTarget, DAY_MUSCLES, DAY_TYPES, eaten, proteinEaten, r1, sessionCount, todayIndex,
} from '../utils/fitness';

export default function PlanScreen() {
  const { state: s, addEntry, toggleEntry, removeEntry, finish, addMeal, removeMeal } = useApp();
  const { t, row, align } = useI18n();
  const [day, setDay] = useState(todayIndex());
  const [draft, setDraft] = useState({ name: '', reps: '', kg: '', m: null });
  const [meal, setMeal] = useState({ n: '', k: '', p: '' });
  const [msg, setMsg] = useState('');
  const [fmsg, setFmsg] = useState('');

  const type = DAY_TYPES[day];
  const muscles = DAY_MUSCLES[type];
  const muscle = muscles.includes(draft.m) ? draft.m : muscles[0];
  const log = s.log[day] || [];
  const ticked = log.filter((e) => e.tick).length;
  const pending = log.filter((e) => e.tick && !e.fin).length;
  const target = calorieTarget(s);
  const meals = s.meals[day] || [];
  const proteinTarget = Math.round(+s.profile.weight * 2);
  const L = s.last && s.last.d === day ? s.last : null;

  const onAdd = () => {
    const reps = Math.round(+draft.reps);
    if (!draft.name.trim() || !(reps > 0)) return setMsg(t.de);
    addEntry(day, draft.name.trim(), reps, Math.max(0, +draft.kg || 0), muscle);
    setDraft({ name: '', reps: '', kg: '', m: muscle });
    return setMsg('');
  };
  const onFinish = () => {
    if (!pending) return setMsg(t.tk);
    finish(day);
    return setMsg('');
  };
  const onMeal = () => {
    const k = Math.round(+meal.k);
    if (!meal.n.trim() || !(k > 0)) return setFmsg(t.fm);
    addMeal(day, meal.n.trim(), k, Math.round(+meal.p) || 0);
    setMeal({ n: '', k: '', p: '' });
    return setFmsg('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={st.pad} keyboardShouldPersistTaps="handled">
          <View style={[st.between, row]}>
            <Text style={st.h1}>{t.pn}</Text>
            <Muted>{t.ses}: {sessionCount(s)}/6</Muted>
          </View>

          <Card>
            <View style={[st.between, row]}>
              {DAY_TYPES.map((y, i) => {
                const on = i === day;
                const done = !!s.fin[i];
                return (
                  <Pressable key={i} onPress={() => { setDay(i); setMsg(''); }} style={{ alignItems: 'center', flex: 1 }}>
                    <Text style={{ color: on ? C.volt : C.mute, fontSize: 11 }}>{t.wd[i]}</Text>
                    <View style={[st.dayDot, { borderColor: on ? C.volt : C.edge, backgroundColor: done ? C.volt : 'transparent' }]}>
                      <Text style={{ color: done ? C.bg : C.text, fontSize: 12 }}>{done ? '✓' : y === 3 ? '–' : t.d1[y].slice(0, 1)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {type === 3 ? (
            <Card><Muted style={{ textAlign: 'center', fontSize: 14 }}>{t.rest}</Muted></Card>
          ) : (
            <>
              <View>
                <View style={[st.between, row]}>
                  <Text style={st.h2}>{t.d1[type]}</Text>
                  <Text style={{ color: C.volt }}>{ticked}/{log.length}</Text>
                </View>
                <Muted style={align}>{t.dm[type]}</Muted>
              </View>

              {log.length ? log.map((e) => (
                <View key={e.id} style={[st.entry, row, { borderColor: e.tick ? C.volt : C.edge }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.entryName, align]}>{e.name}</Text>
                    <Muted style={align}>{e.reps} × {e.kg} kg · {t.m[e.m]}</Muted>
                  </View>
                  {!e.fin ? <Pressable onPress={() => removeEntry(day, e.id)} hitSlop={8}><Text style={{ color: C.mute, fontSize: 18 }}>✕</Text></Pressable> : null}
                  <Pressable onPress={() => toggleEntry(day, e.id)} style={[st.tick, { borderColor: e.tick ? C.volt : C.edge, backgroundColor: e.tick ? C.volt : 'transparent' }]}>
                    <Text style={{ color: e.tick ? C.bg : C.mute, fontSize: 18 }}>✓</Text>
                  </Pressable>
                </View>
              )) : <Muted style={{ textAlign: 'center' }}>{t.emp}</Muted>}

              <Card>
                <Text style={[st.h3, align]}>{t.add}</Text>
                <Field placeholder={t.exn} value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} style={align} />
                <View style={[{ gap: 8 }, row]}>
                  <Field placeholder={t.rp} value={draft.reps} onChangeText={(v) => setDraft({ ...draft, reps: v })} keyboardType="number-pad" style={{ flex: 1 }} />
                  <Field placeholder={t.kg} value={draft.kg} onChangeText={(v) => setDraft({ ...draft, kg: v })} keyboardType="decimal-pad" style={{ flex: 1 }} />
                </View>
                <View style={[st.wrap, row]}>
                  {muscles.map((m) => <Chip key={m} label={t.m[m]} active={muscle === m} onPress={() => setDraft({ ...draft, m })} />)}
                </View>
                {msg ? <Text style={{ color: C.ember, fontSize: 13 }}>{msg}</Text> : null}
                <View style={[{ gap: 8 }, row]}>
                  <Pressable onPress={onAdd} style={st.plus} accessibilityLabel={t.add}><Text style={{ color: C.volt, fontSize: 28, lineHeight: 30 }}>+</Text></Pressable>
                  <Btn label={t.fw} onPress={onFinish} style={{ flex: 1 }} />
                </View>
              </Card>

              {L ? (
                <Card color={C.volt}>
                  <Text style={{ color: C.volt, fontWeight: '700' }}>{t.sm}</Text>
                  <View style={[st.between, row]}>
                    <View><Muted>{t.vo}</Muted><Text style={st.num}>{L.vol} kg</Text></View>
                    <View><Muted>{t.nx}</Muted><Text style={st.num}>{L.n}</Text></View>
                    <View><Muted>{t.bu}</Muted><Text style={st.num}>{L.kc} kcal</Text></View>
                  </View>
                  <Muted style={align}>{t.gn}</Muted>
                  <View style={[st.wrap, row]}>
                    {Object.keys(L.gains).map((m) => (
                      <View key={m} style={[st.pill, { borderColor: C.volt }]}><Text style={{ color: C.volt, fontSize: 12 }}>+{r1(L.gains[m])} {t.m[m]}</Text></View>
                    ))}
                    {L.prs.map((n) => (
                      <View key={n} style={[st.pill, { borderColor: C.gold }]}><Text style={{ color: C.gold, fontSize: 12 }}>🏆 {t.rec}: {n}</Text></View>
                    ))}
                  </View>
                </Card>
              ) : null}
            </>
          )}

          <Card>
            <View style={[st.between, row]}>
              <Text style={st.h3}>{t.fd}</Text>
              <NetChip s={s} day={day} t={t} />
            </View>
            <View style={[st.grid, row]}>
              <View><Muted>{t.ft}</Muted><Text style={st.num}>{target} kcal</Text></View>
              <View><Muted>{t.ea}</Muted><Text style={st.num}>{eaten(s, day)} kcal</Text></View>
              <View><Muted>{t.bu}</Muted><Text style={st.num}>{burnedDay(s, day)} kcal</Text></View>
            </View>
            <Bar value={(eaten(s, day) / target) * 100} color={eaten(s, day) > target ? C.gold : C.volt} rtl={align.textAlign === 'right'} />
            <Muted style={align}>{t.pt}: {proteinEaten(s, day)} / {proteinTarget}</Muted>

            {meals.map((m) => (
              <View key={m.id} style={[st.meal, row]}>
                <Text style={[{ color: C.text, flex: 1 }, align]}>{m.n}</Text>
                <Muted>{m.k} kcal{m.p ? ` · ${m.p} g` : ''}</Muted>
                <Pressable onPress={() => removeMeal(day, m.id)} hitSlop={8}><Text style={{ color: C.mute }}>✕</Text></Pressable>
              </View>
            ))}

            <Field placeholder={t.mn} value={meal.n} onChangeText={(v) => setMeal({ ...meal, n: v })} style={align} />
            <View style={[{ gap: 8 }, row]}>
              <Field placeholder="kcal" value={meal.k} onChangeText={(v) => setMeal({ ...meal, k: v })} keyboardType="number-pad" style={{ flex: 1 }} />
              <Field placeholder={t.pt} value={meal.p} onChangeText={(v) => setMeal({ ...meal, p: v })} keyboardType="number-pad" style={{ flex: 1 }} />
              <Pressable onPress={onMeal} style={[st.plus, { width: 46 }]} accessibilityLabel={t.fd}><Text style={{ color: C.volt, fontSize: 24 }}>+</Text></Pressable>
            </View>
            {fmsg ? <Text style={{ color: C.ember, fontSize: 13 }}>{fmsg}</Text> : null}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  pad: { padding: 18, gap: 14 },
  between: { justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  grid: { justifyContent: 'space-between' },
  wrap: { flexWrap: 'wrap', gap: 8 },
  h1: { color: C.text, fontSize: 24, fontWeight: '800' },
  h2: { color: C.text, fontSize: 18, fontWeight: '700' },
  h3: { color: C.text, fontSize: 16, fontWeight: '700' },
  num: { color: C.text, fontSize: 15, fontWeight: '600' },
  dayDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  entry: { backgroundColor: C.panel, borderWidth: 1, borderRadius: R.md, padding: 12, alignItems: 'center', gap: 10 },
  entryName: { color: C.text, fontSize: 15, fontWeight: '600' },
  tick: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  plus: { width: 54, borderWidth: 1.5, borderColor: C.volt, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  pill: { borderWidth: 1, borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 },
  meal: { backgroundColor: C.bg, borderRadius: R.sm, padding: 10, alignItems: 'center', gap: 10 },
});
