import { askVision, cors, GATE } from '../lib/vision.js';

const TOLERANCE = +(process.env.VERIFY_TOLERANCE || 1.5);

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const { before, after, target } = req.body || {};
  if (!after || !Number.isFinite(+target)) return res.status(400).json({ error: 'bad_request' });

  const photos = before ? [before, after] : [after];
  const prompt = `You verify a fitness goal from a photo. The LAST image is the new photo to verify${before ? '; the first image is the starting photo, only for context (lighting, pose, framing)' : ''}.
${GATE}
Also return "valid": false with reason "not_live" if the new photo is obviously not taken fresh (screen, printout, edited).
If usable, estimate the body fat % shown in the new photo from the visible chest, waist and belly. Be realistic and conservative, do not flatter.
Return ONLY JSON: {"valid": true, "bodyFat": <number 5-45>}`;

  try {
    const r = await askVision(prompt, photos);
    if (r.valid === false) return res.json({ valid: false, verified: false, reason: r.reason || 'not_body' });
    const bodyFat = Math.round(Math.max(5, Math.min(45, +r.bodyFat)) * 10) / 10;
    return res.json({ valid: true, verified: bodyFat <= +target + TOLERANCE, bodyFat });
  } catch (e) {
    return res.status(502).json({ error: 'analysis_failed' });
  }
}
