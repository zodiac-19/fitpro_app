// Body scan. Without a server it returns a formula-based ESTIMATE (clearly labelled in the UI).
// To use real photo analysis, host an endpoint and set EXPO_PUBLIC_SCAN_URL.
//
// Request  (POST JSON): { image: <base64 jpeg>, age, weight, height }
// Response (JSON):      { bodyFat: number, percentile: number, type: 0|1|2, scores?: { chest: 0-100, ... } }
const SCAN_URL = process.env.EXPO_PUBLIC_SCAN_URL;

export function estimate({ age, weight, height }) {
  const bmi = +weight / Math.pow(+height / 100, 2);
  const bodyFat = Math.max(6, Math.min(40, Math.round((1.2 * bmi + 0.23 * +age - 16.2) * 10) / 10));
  return {
    bodyFat,
    percentile: Math.max(5, Math.min(97, Math.round(100 - bodyFat * 2.2))),
    type: bmi < 21 ? 0 : bmi < 26 ? 1 : 2,
    source: 'estimate',
  };
}

export async function analyzeBody(profile, photoB64) {
  if (SCAN_URL && photoB64) {
    const res = await fetch(SCAN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: photoB64, age: +profile.age, weight: +profile.weight, height: +profile.height }),
    });
    if (!res.ok) throw new Error('scan_failed');
    const j = await res.json();
    return {
      bodyFat: +j.bodyFat,
      percentile: +j.percentile,
      type: Math.max(0, Math.min(2, +j.type || 0)),
      scores: j.scores,
      source: 'server',
    };
  }
  return estimate(profile);
}
