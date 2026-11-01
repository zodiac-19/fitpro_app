// Real photo analysis. The photo is sent to your analysis server (see /server) which looks at the
// actual body (chest, shoulders, waist...) and REJECTS anything that is not a clear photo of a person.
// There is no formula fallback: without a valid photo there is no result.
//
// Request  (POST JSON): { image: <base64 jpeg>, age, weight, height }
// Response (JSON):      { valid: true, bodyFat, percentile, type: 0|1|2, scores: { chest: 0-100, ... } }
//                    or { valid: false, reason: 'not_person'|'not_body'|'minor'|'not_live'|'quality' }
const SCAN_URL = process.env.EXPO_PUBLIC_SCAN_URL;

export const isScanConfigured = () => Boolean(SCAN_URL);

export async function analyzeBody(profile, photoB64) {
  if (!photoB64) throw new Error('quality');
  if (!SCAN_URL) throw new Error('not_configured');
  const res = await fetch(SCAN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: photoB64, age: +profile.age, weight: +profile.weight, height: +profile.height }),
  });
  if (!res.ok) throw new Error('scan_failed');
  const j = await res.json();
  if (j.valid === false) throw new Error(j.reason || 'not_body');
  return {
    bodyFat: +j.bodyFat,
    percentile: +j.percentile,
    type: Math.max(0, Math.min(2, +j.type || 0)),
    scores: j.scores,
    source: 'server',
  };
}
