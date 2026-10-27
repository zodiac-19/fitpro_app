import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEY } from '../constants';
import {
  defaultScores, initialGoals, nextGoal, weekKey, weekNet,
} from '../utils/fitness';

export const initialState = {
  ready: false,
  lang: 'en',
  profile: null,   // { name, age, weight, height }
  scan: null,      // { bodyFat, percentile, type }
  baseB64: null,   // first scan photo (base64), used for photo verification
  scores: defaultScores(),
  log: {},         // { [dayIndex]: [{ id, name, reps, kg, m, tick, fin, kc }] }
  meals: {},       // { [dayIndex]: [{ id, n, k, p }] }
  fin: {},         // { [dayIndex]: true } days with a finished workout this week
  pr: {},          // { [lowercaseName]: { n, kg } } personal records
  lvl: 1,
  goals: [],
  last: null,      // last workout summary
  netCarry: 0,     // calorie balance carried over from previous weeks
  weekStart: weekKey(),
  inviteCode: null,
  nextId: 1,
};

// Weekly reset: the training table is the same every week, the logs start fresh.
function rollover(s) {
  return {
    ...s,
    netCarry: (s.netCarry || 0) + weekNet(s),
    log: {}, meals: {}, fin: {}, last: null,
    weekStart: weekKey(),
    goals: s.goals.map((g) => (['kcal', 'sess', 'eat'].includes(g.k) ? { ...g, b: 0 } : g)),
  };
}

export function reducer(s, a) {
  switch (a.type) {
    case 'hydrate': {
      const merged = { ...initialState, ...a.state, ready: true };
      return merged.profile && merged.scan && merged.weekStart !== weekKey() ? rollover(merged) : merged;
    }
    case 'setLang':
      return { ...s, lang: a.lang };
    case 'onboard': {
      const scores = a.scan.scores ? { ...defaultScores(), ...a.scan.scores } : defaultScores();
      const base = { ...s, profile: a.profile, scan: { bodyFat: a.scan.bodyFat, percentile: a.scan.percentile, type: a.scan.type }, scores, baseB64: a.photoB64 || null, weekStart: weekKey() };
      return { ...base, goals: initialGoals(base) };
    }
    case 'addEntry': {
      const e = { id: s.nextId, name: a.name, reps: a.reps, kg: a.kg, m: a.m, tick: false, fin: false, kc: 0 };
      return { ...s, nextId: s.nextId + 1, log: { ...s.log, [a.day]: [...(s.log[a.day] || []), e] } };
    }
    case 'toggleEntry':
      return { ...s, log: { ...s.log, [a.day]: (s.log[a.day] || []).map((e) => (e.id === a.id && !e.fin ? { ...e, tick: !e.tick } : e)) } };
    case 'removeEntry':
      return { ...s, log: { ...s.log, [a.day]: (s.log[a.day] || []).filter((e) => e.id !== a.id) } };
    case 'finish': {
      const list = s.log[a.day] || [];
      const todo = list.filter((e) => e.tick && !e.fin);
      if (!todo.length) return s;
      let vol = 0, kc = 0;
      const gains = {}, prs = [];
      const scores = { ...s.scores };
      const pr = { ...s.pr };
      const updated = list.map((e) => {
        if (!(e.tick && !e.fin)) return e;
        const v = e.reps * e.kg;
        const gain = Math.min(3, 0.4 + v / 800);
        const burn = Math.round(v * 0.12 + 6);
        const key = e.name.trim().toLowerCase();
        vol += v; kc += burn;
        gains[e.m] = (gains[e.m] || 0) + gain;
        scores[e.m] = Math.min(100, scores[e.m] + gain);
        if (pr[key] && e.kg > pr[key].kg) prs.push(e.name);
        if (!pr[key] || e.kg > pr[key].kg) pr[key] = { n: e.name, kg: e.kg };
        return { ...e, fin: true, kc: burn };
      });
      return {
        ...s, scores, pr,
        log: { ...s.log, [a.day]: updated },
        fin: { ...s.fin, [a.day]: true },
        last: { d: a.day, vol: Math.round(vol), n: todo.length, kc, gains, prs },
      };
    }
    case 'addMeal':
      return { ...s, nextId: s.nextId + 1, meals: { ...s.meals, [a.day]: [...(s.meals[a.day] || []), { id: s.nextId, n: a.n, k: a.k, p: a.p }] } };
    case 'removeMeal':
      return { ...s, meals: { ...s.meals, [a.day]: (s.meals[a.day] || []).filter((m) => m.id !== a.id) } };
    case 'verifyGoal':
      return { ...s, baseB64: a.photoB64 || s.baseB64, goals: s.goals.map((g, i) => (i === a.index ? { ...g, v: true } : g)) };
    case 'claimGoal':
      return { ...s, lvl: s.lvl + 1, goals: s.goals.map((g, i) => (i === a.index ? nextGoal(s, g) : g)) };
    case 'setCode':
      return { ...s, inviteCode: a.code };
    case 'reset':
      return { ...initialState, ready: true, lang: s.lang };
    default:
      return s;
  }
}

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timer = useRef(null);

  // Load saved state once.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => dispatch({ type: 'hydrate', state: raw ? JSON.parse(raw) : {} }))
      .catch(() => dispatch({ type: 'hydrate', state: {} }));
  }, []);

  // Save (debounced) on every change.
  useEffect(() => {
    if (!state.ready) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const { ready, ...persist } = state;
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(persist)).catch(() => {});
    }, 400);
    return () => clearTimeout(timer.current);
  }, [state]);

  const actions = useMemo(() => ({
    setLang: (lang) => dispatch({ type: 'setLang', lang }),
    onboard: (profile, scan, photoB64) => dispatch({ type: 'onboard', profile, scan, photoB64 }),
    addEntry: (day, name, reps, kg, m) => dispatch({ type: 'addEntry', day, name, reps, kg, m }),
    toggleEntry: (day, id) => dispatch({ type: 'toggleEntry', day, id }),
    removeEntry: (day, id) => dispatch({ type: 'removeEntry', day, id }),
    finish: (day) => dispatch({ type: 'finish', day }),
    addMeal: (day, n, k, p) => dispatch({ type: 'addMeal', day, n, k, p }),
    removeMeal: (day, id) => dispatch({ type: 'removeMeal', day, id }),
    verifyGoal: (index, photoB64) => dispatch({ type: 'verifyGoal', index, photoB64 }),
    claimGoal: (index) => dispatch({ type: 'claimGoal', index }),
    setInviteCode: (code) => dispatch({ type: 'setCode', code }),
    reset: () => dispatch({ type: 'reset' }),
  }), []);

  const value = useMemo(() => ({ state, ...actions }), [state, actions]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
