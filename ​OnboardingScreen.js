import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { LANGS, useI18n } from '../i18n';
import { analyzeBody } from '../services/bodyScan';
import { Btn, Card, Field, Muted } from '../components/UI';
import { C, R } from '../theme';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function LanguageStep({ next }) {
  const { t, lang, setLang, row, align } = useI18n();
  return (
    <View style={s.step}>
      <Text style={[s.h1, align]}>{t.ti}</Text>
      <Text style={[s.sub, align]}>{t.su}</Text>
      <View style={{ gap: 12, marginTop: 28 }}>
        {LANGS.map((l) => (
          <Pressable key={l.code} onPress={() => setLang(l.code)} style={[s.langRow, row, lang === l.code && { borderColor: C.volt }]}>
            <Text style={s.langText}>{l.label}</Text>
            {lang === l.code ? <View style={s.dot} /> : null}
          </Pressable>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <Btn label={t.co} onPress={next} />
    </View>
  );
}

function ProfileStep({ value, onChange, next }) {
  const { t, align } = useI18n();
  const [error, setError] = useState(false);
  const fields = [['name', t.na, 'default'], ['age', t.ag, 'number-pad'], ['weight', t.we, 'decimal-pad'], ['height', t.he, 'number-pad']];
  const submit = () => {
    const ok = value.name.trim() && +value.age >= 13 && +value.age <= 100 && +value.weight > 25 && +value.weight < 300 && +value.height > 100 && +value.height < 250;
    if (!ok) return setError(true);
    setError(false);
    return next();
  };
  return (
    <KeyboardAvoidingView style={s.step} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={[s.h1, align]}>{t.pr}</Text>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14, paddingTop: 22 }}>
        {fields.map(([key, label, kb]) => (
          <View key={key}>
            <Text style={[s.label, align]}>{label}</Text>
            <Field value={value[key]} onChangeText={(v) => onChange({ ...value, [key]: v })} keyboardType={kb} style={[{ fontSize: 17 }, align]} />
          </View>
        ))}
        {error ? <Text style={{ color: C.ember }}>{t.err}</Text> : null}
      </ScrollView>
      <Btn label={t.co} onPress={submit} />
    </KeyboardAvoidingView>
  );
}

function ScanLine({ height }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: height - 3, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [height, y]);
  return <Animated.View style={[s.scanLine, { transform: [{ translateY: y }] }]} />;
}

function ScanStep({ profile, done }) {
  const { t, align } = useI18n();
  const [uri, setUri] = useState(null);
  const [b64, setB64] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | scanning | result | error
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const H = 340;

  const run = async (photo) => {
    setUri(photo?.uri || null);
    setB64(photo?.base64 || null);
    setPhase('scanning');
    setStage(0);
    const timers = [setTimeout(() => setStage(1), 900), setTimeout(() => setStage(2), 1800)];
    try {
      const [res] = await Promise.all([analyzeBody(profile, photo?.base64), sleep(2700)]);
      setResult(res);
      setPhase('result');
    } catch (e) {
      setMessage(t.fail);
      setPhase('error');
    } finally {
      timers.forEach(clearTimeout);
    }
  };

  const pick = async (camera) => {
    const options = { quality: 0.5, base64: true, allowsEditing: true, aspect: [3, 4] };
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setMessage(t.perm); setPhase('error'); return; }
    }
    const res = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!res.canceled && res.assets?.length) run(res.assets[0]);
  };

  return (
    <ScrollView style={s.step} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={[s.h1, align]}>{t.sc}</Text>
      <Text style={[s.sub, align]}>{t.ss}</Text>
      <View style={[s.frame, { height: H }]}>
        {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <View style={s.silhouette} />}
        {phase === 'scanning' ? (<><ScanLine height={H} /><View style={s.tint} /></>) : null}
      </View>

      {phase === 'scanning' ? <Text style={[s.sub, { textAlign: 'center', color: C.volt }]}>{t.st[stage]}</Text> : null}
      {phase === 'error' ? <Text style={{ color: C.ember, marginTop: 12 }}>{message}</Text> : null}

      {phase === 'result' && result ? (
        <View style={{ marginTop: 16, gap: 12 }}>
          <Card color={C.gold} style={{ alignItems: 'center' }}>
            <Text style={{ color: C.gold }}>{t.be}</Text>
            <Text style={s.big}>{result.percentile}%</Text>
            <Muted>{t.of}</Muted>
          </Card>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Card style={{ flex: 1 }}><Muted>{t.bf}</Muted><Text style={s.stat}>{result.bodyFat}%</Text></Card>
            <Card style={{ flex: 1 }}><Muted>{t.ty}</Muted><Text style={s.stat}>{t.tp[result.type]}</Text></Card>
          </View>
          {result.source === 'estimate' ? <Muted style={{ textAlign: 'center' }}>{t.es}</Muted> : null}
          <Btn label={t.pl} onPress={() => done(result, b64)} />
        </View>
      ) : null}

      {phase === 'idle' || phase === 'error' ? (
        <View style={{ gap: 10, marginTop: 16 }}>
          <Btn label={t.cam} onPress={() => pick(true)} />
          <Btn label={t.lib} onPress={() => pick(false)} outline />
          <Btn label={t.skip} onPress={() => run(null)} outline />
        </View>
      ) : null}
    </ScrollView>
  );
}

export default function OnboardingScreen() {
  const { onboard } = useApp();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ name: '', age: '', weight: '', height: '' });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {step === 0 ? <LanguageStep next={() => setStep(1)} /> : null}
      {step === 1 ? <ProfileStep value={profile} onChange={setProfile} next={() => setStep(2)} /> : null}
      {step === 2 ? <ScanStep profile={profile} done={(res, b64) => onboard({ ...profile, name: profile.name.trim() }, res, b64)} /> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  step: { flex: 1, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 16 },
  h1: { color: C.text, fontSize: 30, fontWeight: '800', lineHeight: 36, letterSpacing: -0.5 },
  sub: { color: C.mute, fontSize: 15, lineHeight: 22, marginTop: 10 },
  label: { color: C.mute, fontSize: 13, marginBottom: 6 },
  langRow: { justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.panel, borderColor: C.edge, borderWidth: 1.5, borderRadius: R.md, padding: 16 },
  langText: { color: C.text, fontSize: 18, fontWeight: '600' },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: C.volt },
  frame: { marginTop: 18, borderRadius: R.xl, backgroundColor: C.panel, overflow: 'hidden', borderWidth: 1, borderColor: C.edge, alignItems: 'center', justifyContent: 'center' },
  silhouette: { width: 110, height: 250, borderRadius: 55, borderWidth: 2, borderColor: C.edge, borderStyle: 'dashed' },
  scanLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: C.volt, shadowColor: C.volt, shadowOpacity: 1, shadowRadius: 12, elevation: 8 },
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(61,242,224,0.08)' },
  big: { color: C.text, fontSize: 48, fontWeight: '800' },
  stat: { color: C.text, fontSize: 24, fontWeight: '700' },
});
