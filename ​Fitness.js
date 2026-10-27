// Pure helpers: scoring, calories, goals. No React or native imports, so they are easy to test.

export const MUSCLES = ['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'lats', 'traps', 'glutes', 'quads', 'hamstrings', 'calves'];

// Monday..Sunday. 0 = Push, 1 = Pull, 2 = Legs, 3 = Rest
export const DAY_TYPES = [0, 1, 2, 0, 1, 2, 3];
export const DAY_MUSCLES = [
  ['chest', 'shoulders', 'triceps', 'abs'],
  ['lats', 'traps', 'biceps', 'forearms'],
  ['quads', 'hamstrings', 'glutes', 'calves'],
  [],
];

export const defaultScores = () => Object.fromEntries(MUSCLES.map((m) => [m, 50]));
export const r1 = (x) => Math.round(x * 10) / 10;
export const todayIndex = () => (new Date().getDay() + 6) % 7;

const pad = (n) => String(n).padStart(2, '0');
export function weekKey(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const STOPS = [[255, 77, 94], [122, 111, 214], [61, 242, 224]];
export function scoreColor(score) {
  const t = Math.max(0, Math.min(1, score / 100)) * 2;
  const i = Math.min(1, Math.floor(t));
  const f = t - i;
  const [a, b] = [STOPS[i], STOPS[i + 1]];
  return `rgb(${a.map((v, n) => Math.round(v + (b[n] - v) * f)).join(',')})`;
}

export const weakestMuscle = (scores) => MUSCLES.reduce((a, b) => (scores[a] <= scores[b] ? a : b));
export const titleFlags = (scores) => [scores.chest >= 85, scores.biceps >= 80, scores.quads >= 75];

/* ---------- Calories ---------- */
const DAYS = [0, 1, 2, 3, 4, 5, 6];
export const tdee = (s) => Math.round((10 * +s.profile.weight + 6.25 * +s.profile.height - 5 * +s.profile.age - 78) * 1.3);
export const calorieTarget = (s) => Math.round((tdee(s) + (s.scan.bodyFat >= 15 ? -300 : 250)) / 10) * 10;
export const eaten = (s, d) => (s.meals[d] || []).reduce((a, m) => a + m.k, 0);
export const proteinEaten = (s, d) => (s.meals[d] || []).reduce((a, m) => a + (m.p || 0), 0);
export const burnedDay = (s, d) => (s.log[d] || []).reduce((a, e) => a + (e.fin ? e.kc : 0), 0);
export const burnedWeek = (s) => DAYS.reduce((a, d) => a + burnedDay(s, d), 0);
export const netDay = (s, d) => (eaten(s, d) > 0 ? eaten(s, d) - tdee(s) - burnedDay(s, d) : 0);
export const weekNet = (s) => DAYS.reduce((a, d) => a + netDay(s, d), 0);
export const cumNet = (s) => (s.netCarry || 0) + weekNet(s);
export const estimatedBodyFat = (s) => s.scan.bodyFat + (cumNet(s) / 7700 / +s.profile.weight) * 100;
export const onTarget = (s, d) => {
  const e = eaten(s, d);
  const t = calorieTarget(s);
  return e > 0 && e >= t - 150 && e <= t + 100;
};
export const onTargetCount = (s) => DAYS.filter((d) => onTarget(s, d)).length;
export const sessionCount = (s) => DAYS.filter((d) => s.fin[d]).length;

/* ---------- Goals ---------- */
// kinds: photo | muscle | kcal | sess | eat
export function initialGoals(s) {
  const f = r1(s.scan.bodyFat);
  return [
    { k: 'photo', b0: f, t: r1(f - 1), v: false },
    { k: 'muscle', m: 'chest', b: s.scores.chest, t: Math.round(s.scores.chest) + 6 },
    { k: 'kcal', b: 0, t: 1200 },
    { k: 'sess', b: 0, t: 3 },
    { k: 'eat', b: 0, t: 3 },
  ];
}

export function nextGoal(s, g) {
  if (g.k === 'photo') {
    const b = r1(estimatedBodyFat(s));
    return { k: 'photo', b0: b, t: Math.max(6, r1(b - 1)), v: false };
  }
  if (g.k === 'muscle') {
    const m = weakestMuscle(s.scores);
    return { k: 'muscle', m, b: s.scores[m], t: Math.min(99, Math.round(s.scores[m]) + 6) };
  }
  if (g.k === 'kcal') return { k: 'kcal', b: burnedWeek(s), t: g.t + 300 };
  if (g.k === 'sess') return { k: 'sess', b: sessionCount(s), t: Math.min(6, g.t + 1) };
  return { k: 'eat', b: onTargetCount(s), t: Math.min(7, g.t + 1) };
}

export function goalProgress(s, g) {
  let p;
  if (g.k === 'photo') p = g.v ? 100 : ((g.b0 - estimatedBodyFat(s)) / (g.b0 - g.t)) * 100;
  else if (g.k === 'muscle') p = ((s.scores[g.m] - g.b) / (g.t - g.b)) * 100;
  else if (g.k === 'kcal') p = ((burnedWeek(s) - g.b) / g.t) * 100;
  else if (g.k === 'sess') p = ((sessionCount(s) - g.b) / g.t) * 100;
  else p = ((onTargetCount(s) - g.b) / g.t) * 100;
  return Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : 0;
}

export function goalLabel(t, g) {
  const rep = (str, vars) => Object.keys(vars).reduce((a, k) => a.split(`{${k}}`).join(String(vars[k])), str);
  if (g.k === 'photo') return rep(t.gp, { n: g.t });
  if (g.k === 'muscle') return rep(t.gm, { m: t.m[g.m], n: g.t });
  if (g.k === 'kcal') return rep(t.gk, { n: g.t });
  if (g.k === 'sess') return rep(t.gs, { n: g.t });
  return rep(t.ge, { n: g.t });
}

/* ---------- Public snapshot shared with linked friends ---------- */
export function buildPublicProfile(s) {
  const lifts = Object.values(s.pr || {})
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 5)
    .map((x) => ({ n: String(x.n).slice(0, 40), k: x.kg }));
  return {
    name: String(s.profile.name).slice(0, 30),
    age: +s.profile.age,
    weight: +s.profile.weight,
    height: +s.profile.height,
    bodyFat: r1(estimatedBodyFat(s)),
    percentile: s.scan.percentile,
    type: s.scan.type,
    level: s.lvl,
    sessions: sessionCount(s),
    burned: burnedWeek(s),
    week: DAYS.map((d) => !!s.fin[d]),
    scores: Object.fromEntries(MUSCLES.map((m) => [m, Math.round(s.scores[m] * 10) / 10])),
    goals: s.goals.map((g) => ({ k: g.k, m: g.m || null, t: g.t, p: Math.round(goalProgress(s, g)) })),
    lifts,
  };
}
