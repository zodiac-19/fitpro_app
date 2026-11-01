import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../context/AppContext';
import { useI18n } from '../i18n';
import { isVerifyConfigured, verifyPhotos } from '../services/verification';
import { Bar, Btn, Card, Muted } from '../components/UI';
import { C, R } from '../theme';
import { goalLabel, goalProgress } from '../utils/fitness';

export default function GoalsScreen() {
  const { state: s, verifyGoal, claimGoal } = useApp();
  const { t, row, align } = useI18n();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const configured = isVerifyConfigured();

  const verify = async (index) => {
    setError('');
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return setError(t.perm);
    // Camera only (no library) makes it harder to submit an old photo.
    const res = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
    if (res.canceled || !res.assets?.[0]?.base64) return undefined;
    const after = res.assets[0].base64;
    setBusy(index);
    try {
      const ok = await verifyPhotos(s.baseB64, after);
      if (ok) verifyGoal(index, after);
      else setError(t.pvf);
    } catch (e) {
      setError(t.pvf);
    } finally {
      setBusy(null);
    }
    return undefined;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={st.pad}>
        <View style={[st.between, row]}>
          <Text style={st.h1}>{t.go}</Text>
          <View style={st.pill}><Text style={{ color: C.gold }}>{t.lv} {s.lvl}</Text></View>
        </View>
        {error ? <Text style={{ color: C.ember }}>{error}</Text> : null}

        {s.goals.map((g, i) => {
          const p = goalProgress(s, g);
          const photo = g.k === 'photo';
          return (
            <Card key={i}>
              <View style={[st.between, row]}>
                <Text style={[st.goal, { flex: 1 }, align]}>{goalLabel(t, g)}</Text>
                <Text style={{ color: C.volt }}>{Math.round(p)}%</Text>
              </View>
              {photo && g.v ? <Text style={{ color: C.volt, fontSize: 13 }}>✓ {t.vd}</Text> : null}
              <Bar value={p} rtl={align.textAlign === 'right'} />
              <Muted style={align}>{t.au}</Muted>
              {p >= 100 ? <Btn label={t.cl} onPress={() => claimGoal(i)} /> : null}
              {photo && p < 100 ? (
                busy === i
                  ? <Text style={{ color: C.volt, textAlign: 'center' }}>{t.cp}</Text>
                  : <Btn label={`📷 ${t.vf}`} onPress={() => verify(i)} disabled={!configured || busy !== null} outline />
              ) : null}
              {photo && !configured ? <Muted style={align}>{t.pv}</Muted> : null}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  pad: { padding: 18, gap: 14 },
  between: { justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  h1: { color: C.text, fontSize: 24, fontWeight: '800' },
  goal: { color: C.text, fontSize: 16, fontWeight: '600' },
  pill: { borderWidth: 1, borderColor: C.gold, borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 3 },
});
