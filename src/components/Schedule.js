import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Day kinds: 0 Push, 1 Pull, 2 Legs, 3 Rest, 4 Upper body, 5 Lower body
export const REST = 3;
export const DEFAULT_SCHEDULE = [0, 1, 2, 3, 0, 1, 2]; // Mon..Sun: Push, Pull, Legs, Rest, Push, Pull, Legs

// Muscles suggested in "Add exercise" for each kind of day.
export const KIND_MUSCLES = [
  ['chest', 'shoulders', 'triceps', 'abs'],                              // Push
  ['lats', 'traps', 'biceps', 'forearms'],                               // Pull
  ['quads', 'hamstrings', 'glutes', 'calves'],                           // Legs
  [],                                                                    // Rest
  ['chest', 'shoulders', 'triceps', 'lats', 'traps', 'biceps', 'forearms', 'abs'], // Upper body
  ['quads', 'hamstrings', 'glutes', 'calves'],                           // Lower body
];

export const trainingDays = (schedule) => schedule.filter((k) => k !== REST).length;

const KEY = 'fitpro:schedule:v1';
const isValid = (v) => Array.isArray(v) && v.length === 7 && v.every((k) => Number.isInteger(k) && k >= 0 && k <= 5);

// The user's weekly schedule, saved on the device.
export function useSchedule() {
  const [schedule, setScheduleState] = useState(DEFAULT_SCHEDULE);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : null;
        if (isValid(parsed)) setScheduleState(parsed);
      })
      .catch(() => {});
  }, []);

  const setSchedule = useCallback((next) => {
    if (!isValid(next)) return;
    setScheduleState(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  return [schedule, setSchedule];
}

export const SCHEDULE_STRINGS = {
  en: {
    edit: 'Edit schedule', title: 'Choose your schedule', save: 'Save',
    names: ['Push', 'Pull', 'Legs', 'Rest', 'Upper body', 'Lower body'],
    ds: ['Pu', 'Pl', 'Lg', '–', 'Up', 'Lo'],
    dm: ['Chest · shoulders · triceps', 'Back · biceps · traps', 'Quads · hamstrings · calves', 'Recovery', 'Chest · back · shoulders · arms', 'Quads · hamstrings · glutes · calves'],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  ar: {
    edit: 'تعديل الجدول', title: 'اختر جدولك', save: 'حفظ',
    names: ['دفع', 'سحب', 'أرجل', 'راحة', 'الجزء العلوي', 'الجزء السفلي'],
    ds: ['دف', 'سح', 'أر', '–', 'عل', 'سف'],
    dm: ['صدر · أكتاف · ترايسبس', 'ظهر · بايسبس · ترابيس', 'فخذ أمامي · فخذ خلفي · سمانة', 'استشفاء', 'صدر · ظهر · أكتاف · ذراعان', 'فخذ أمامي · فخذ خلفي · مؤخرة · سمانة'],
    days: ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
  },
  fr: {
    edit: 'Modifier le planning', title: 'Choisis ton planning', save: 'Enregistrer',
    names: ['Push', 'Pull', 'Jambes', 'Repos', 'Haut du corps', 'Bas du corps'],
    ds: ['Pu', 'Pl', 'Ja', '–', 'Ha', 'Ba'],
    dm: ['Pecs · épaules · triceps', 'Dos · biceps · trapèzes', 'Quadriceps · ischios · mollets', 'Récupération', 'Pecs · dos · épaules · bras', 'Quadriceps · ischios · fessiers · mollets'],
    days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  },
  es: {
    edit: 'Editar horario', title: 'Elige tu horario', save: 'Guardar',
    names: ['Empuje', 'Tirón', 'Piernas', 'Descanso', 'Tren superior', 'Tren inferior'],
    ds: ['Em', 'Ti', 'Pi', '–', 'Su', 'In'],
    dm: ['Pecho · hombros · tríceps', 'Espalda · bíceps · trapecios', 'Cuádriceps · isquios · gemelos', 'Recuperación', 'Pecho · espalda · hombros · brazos', 'Cuádriceps · isquios · glúteos · gemelos'],
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  },
};
