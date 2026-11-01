// Photo verification of progress (old photo vs new photo). It needs a server-side model:
// set EXPO_PUBLIC_VERIFY_URL. Nothing is "verified" locally.
//
// Request  (POST JSON): { before: <base64>, after: <base64> }
// Response (JSON):      { verified: boolean }
const VERIFY_URL = process.env.EXPO_PUBLIC_VERIFY_URL;

export const isVerifyConfigured = () => Boolean(VERIFY_URL);

export async function verifyPhotos(beforeB64, afterB64) {
  if (!VERIFY_URL) throw new Error('not_configured');
  const res = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ before: beforeB64, after: afterB64 }),
  });
  if (!res.ok) throw new Error('verify_failed');
  const j = await res.json();
  return Boolean(j.verified);
}
