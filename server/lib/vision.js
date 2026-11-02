const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const TIMEOUT_MS = 15000;

async function post(url, headers, body) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

const parse = (text) => {
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) throw new Error('bad_model_output');
  return JSON.parse(m[0]);
};

// ---- Gemini ----
async function gemini(prompt, photos) {
  const models = [...new Set([process.env.GEMINI_MODEL, 'gemini-3.8-flash', 'gemini-3.5-flash-lite'].filter(Boolean))];
  let last = 'gemini_failed';
  for (const model of models) {
    const res = await post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      { 'x-goog-api-key': process.env.GEMINI_API_KEY },
      {
        contents: [{ parts: [...photos.map((b) => ({ inline_data: { mime_type: 'image/jpeg', data: b } })), { text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      },
    );
    if (res.ok) {
      const d = await res.json();
      return parse((d.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join(''));
    }
    last = `gemini_${res.status}_${model}`;
  }
  throw new Error(last);
}

// ---- OpenAI-compatible providers (Groq, OpenRouter) ----
const openaiStyle = (name, url, keyVar, models) => async (prompt, photos) => {
  let last = `${name}_failed`;
  for (const model of models().filter(Boolean)) {
    const res = await post(url, { authorization: `Bearer ${process.env[keyVar]}` }, {
      model,
      temperature: 0.2,
      max_tokens: 700,
      messages: [{
        role: 'user',
        content: [
          ...photos.map((b) => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b}` } })),
          { type: 'text', text: prompt },
        ],
      }],
    });
    if (res.ok) {
      const d = await res.json();
      return parse(d.choices?.[0]?.message?.content);
    }
    last = `${name}_${res.status}_${model}`;
  }
  throw new Error(last);
};

const groq = openaiStyle('groq', 'https://api.groq.com/openai/v1/chat/completions', 'GROQ_API_KEY',
  () => [process.env.GROQ_MODEL, 'meta-llama/llama-4-scout-17b-16e-instruct']);

const openrouter = openaiStyle('openrouter', 'https://openrouter.ai/api/v1/chat/completions', 'OPENROUTER_API_KEY',
  () => [process.env.OPENROUTER_MODEL, 'google/gemma-3-27b-it:free']);

const PROVIDERS = [
  ['GEMINI_API_KEY', gemini],
  ['GROQ_API_KEY', groq],
  ['OPENROUTER_API_KEY', openrouter],
].filter(([key]) => process.env[key]);

export async function askVision(prompt, photos) {
  if (!PROVIDERS.length) throw new Error('no_provider_configured');
  const errors = [];
  for (const [, run] of PROVIDERS) {
    try {
      return await run(prompt, photos);
    } catch (e) {
      errors.push(e.name === 'AbortError' ? 'timeout' : e.message);
      await wait(300);
    }
  }
  throw new Error(errors.join(' | '));
}

export const MUSCLES = ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'lats', 'traps', 'glutes', 'quads', 'hamstrings', 'calves'];

export const GATE = `
First decide if the photo is usable. Be very lenient.
Return {"valid": false, "reason": R} ONLY when:
- no real person is visible (paper, cardboard, objects, animals, drawings, or only a close-up of a face): R = "not_person"
- the person clearly looks younger than 18: R = "minor"
- no part of the body below the face can be seen at all: R = "quality"
Every other photo of an adult is valid: any age, any clothing (shirtless, fitted, loose, jacket), any pose, any lighting, gallery or camera.
The more of the body is visible and the clearer the photo, the more precise the estimate must be. When the photo shows less detail (clothes, distance, angle), still give a full estimate using the visible shape plus the user's age, weight and height, and use 50 for any muscle you cannot judge.`;

export const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
};
