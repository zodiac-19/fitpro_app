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
First decide if the photo is usable. Be very lenient.
Return {"valid": false, "reason": R} ONLY when:
- no real person is visible (paper, cardboard, objects, animals, drawings, or only a close-up of a face): R = "not_person"
- no part of the body below the face can be seen at all: R = "quality"
Every other photo of a human is valid: any age, any clothing (shirtless, fitted, loose, jacket), any pose, any lighting, gallery or camera.
The more of the body is visible and the clearer the photo, the more precise the estimate must be. When the photo shows less detail (clothes, distance, angle), still give a full estimate using the visible shape plus the user's age, weight and height, and use 50 for any muscle you cannot judge.`;

export const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
};
