const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

export async function askVision(prompt, photos) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            ...photos.map((b64) => ({ inline_data: { mime_type: 'image/jpeg', data: b64 } })),
            { text: prompt },
          ],
        }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini_${res.status}`);
  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('');
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('bad_model_output');
  return JSON.parse(m[0]);
}

export const MUSCLES = ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'lats', 'traps', 'glutes', 'quads', 'hamstrings', 'calves'];

export const GATE = `
First decide if the photo is usable. Return {"valid": false, "reason": R} when:
- no real, live human body is in the photo (paper, cardboard, objects, animals, drawings, a face-only selfie): R = "not_person"
- a person is there but the torso (chest, shoulders, waist) is not clearly visible or is hidden by baggy clothes, or it is too dark/blurry/cropped: R = "not_body" (use "quality" for dark/blurry)
- the person looks younger than 18: R = "minor"
- it is a screenshot, a photo of a screen/printed picture, or a stock/edited image rather than a live photo: R = "not_live"
Never guess on an unusable photo.`;

export const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
};
