import {
  collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where,
} from 'firebase/firestore';
import { getDb } from './firebase';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no look-alike characters
const CODE_LENGTH = 6;

export const pairId = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);

// Accepts a raw code or a pasted link (e.g. https://fitpro.app/join/AMN42X) and returns the code.
export function parseCode(input) {
  const parts = String(input || '').trim().split(/[/?#\s]+/).filter(Boolean);
  return (parts.pop() || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

const randomCode = () =>
  Array.from({ length: CODE_LENGTH }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

// Reserve a unique invite code for this user (kept for the lifetime of the install).
export async function ensureInviteCode(uid, existing) {
  const db = getDb();
  if (existing) {
    const snap = await getDoc(doc(db, 'codes', existing));
    if (snap.exists() && snap.data().uid === uid) return existing;
  }
  for (let i = 0; i < 8; i += 1) {
    const code = randomCode();
    const ref = doc(db, 'codes', code);
    if (!(await getDoc(ref)).exists()) {
      await setDoc(ref, { uid, createdAt: serverTimestamp() });
      return code;
    }
  }
  throw new Error('code_unavailable');
}

export function publishProfile(uid, data) {
  return setDoc(doc(getDb(), 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

// Link the current user with the owner of a code. Throws: 'invalid' | 'notfound' | 'self'
export async function connectWithCode(uid, input) {
  const code = parseCode(input);
  if (code.length !== CODE_LENGTH) throw new Error('invalid');
  const db = getDb();
  const snap = await getDoc(doc(db, 'codes', code));
  if (!snap.exists()) throw new Error('notfound');
  const friendUid = snap.data().uid;
  if (friendUid === uid) throw new Error('self');
  const members = [uid, friendUid].sort();
  await setDoc(doc(db, 'connections', pairId(uid, friendUid)), { members, createdAt: serverTimestamp() }, { merge: true });
  return friendUid;
}

export const disconnect = (linkId) => deleteDoc(doc(getDb(), 'connections', linkId));

export function watchConnections(uid, onChange, onError) {
  const q = query(collection(getDb(), 'connections'), where('members', 'array-contains', uid));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, friendUid: d.data().members.find((m) => m !== uid) }))),
    onError,
  );
}

export function watchUser(uid, onChange, onError) {
  return onSnapshot(doc(getDb(), 'users', uid), (s) => onChange(s.exists() ? s.data() : null), onError);
}
