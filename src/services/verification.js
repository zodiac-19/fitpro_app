// Photo verification of a body-fat goal. A server model looks at the NEW photo, rejects anything that
// is not a real, live photo of a body, estimates the body fat and compares it with the goal.
//
// Request  (POST JSON): { before: <base64>, after: <base64>, target: number }
// Response (JSON):      { verified: boolean, valid: boolean, reason?: string, bodyFat?: number }
const VERIFY_URL = process.env.EXPO_PUBLIC_VERIFY_URL;

export const isVerifyConfigured = () => Boolean(VERIFY_URL);

export async function verifyPhotos(beforeB64, afterB64, target) {
  if (!VERIFY_URL) throw new Error('not_configured');
  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ before: beforeB64, after: afterB64, target }),
  });
  if (!res.ok) throw new Error('verify_failed');
  const j = await res.json();
  return { verified: Boolean(j.verified), valid: j.valid !== false, reason: j.reason, bodyFat: j.bodyFat };
}
