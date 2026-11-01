import { askVision, cors, GATE, MUSCLES } from '../lib/vision.js';

const clamp = (n, a, b) => Math.max(a, Math.min(b, Number.isFinite(+n) ? +n : a));

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const { image, age, weight, height } = req.body || {};
  if (!image) return res.status(400).json({ error: 'image_required' });

  const prompt = `You analyse a fitness progress photo. The user says: age ${age}, weight ${weight} kg, height ${height} cm.
${GATE}
If usable, judge ONLY what is visible: chest size/development, shoulder width relative to the waist, waist and belly size, arms, legs, overall leanness. Be realistic and conservative, do not flatter.
Return ONLY JSON:
{"valid": true, "bodyFat": <number 5-45, estimated body fat %>, "type": <0 lean | 1 athletic | 2 solid/heavy>,
 "scores": {${MUSCLES.map((m) => `"${m}": <0-100>`).join(', ')}}}
Use 50 for muscles that are not visible. Average untrained adult = about 40-50, well-trained = 70+, elite = 90+.`;

  try {
    const r = await askVision(prompt, [image]);
    if (r.valid === false) return res.json({ valid: false, reason: r.reason || 'not_body' });
    const bodyFat = Math.round(clamp(r.bodyFat, 5, 45) * 10) / 10;
    const scores = Object.fromEntries(MUSCLES.map((m) => [m, Math.round(clamp(r.scores?.[m] ?? 50, 0, 100))]));
    return res.json({
      valid: true,
      bodyFat,
      percentile: Math.max(5, Math.min(97, Math.round(100 - bodyFat * 2.2))),
      type: [0, 1, 2].includes(r.type) ? r.type : 1,
      scores,
    });
  } catch (e) {
    console.error('SCAN_ERROR', e.message);
    return res.status(502).json({ error: 'analysis_failed' });
  }
}
