import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { isConfigured, getUid } from '../services/firebase';
import {
  connectWithCode, disconnect, ensureInviteCode, publishProfile, watchConnections, watchUser,
} from '../services/squadService';
import { buildPublicProfile } from '../utils/fitness';

// Owns everything Squad needs: identity, invite code, publishing my profile, and live friend data.
export default function useSquad() {
  const { state, setInviteCode } = useApp();
  const configured = isConfigured();
  const [uid, setUid] = useState(null);
  const [status, setStatus] = useState(configured ? 'loading' : 'unconfigured'); // loading | ready | error | unconfigured
  const [links, setLinks] = useState([]);
  const [friendData, setFriendData] = useState({});

  // 1) sign in + reserve an invite code
  useEffect(() => {
    if (!configured) return undefined;
    let off = false;
    (async () => {
      try {
        const id = await getUid();
        const code = await ensureInviteCode(id, state.inviteCode);
        if (off) return;
        setUid(id);
        if (code !== state.inviteCode) setInviteCode(code);
        setStatus('ready');
      } catch (e) {
        if (!off) setStatus('error');
      }
    })();
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured]);

  // 2) publish my public profile (debounced) whenever my data changes
  const snapshot = useMemo(() => JSON.stringify(buildPublicProfile(state)), [state]);
  useEffect(() => {
    if (!uid) return undefined;
    const id = setTimeout(() => publishProfile(uid, JSON.parse(snapshot)).catch(() => {}), 1200);
    return () => clearTimeout(id);
  }, [uid, snapshot]);

  // 3) live list of linked friends
  useEffect(() => {
    if (!uid) return undefined;
    return watchConnections(uid, setLinks, () => {});
  }, [uid]);

  // 4) live data of every linked friend
  const friendKey = links.map((l) => l.friendUid).join(',');
  useEffect(() => {
    const offs = links.map((l) =>
      watchUser(l.friendUid, (d) => setFriendData((prev) => ({ ...prev, [l.friendUid]: d })), () => {}));
    return () => offs.forEach((off) => off());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendKey]);

  const connect = useCallback(async (input) => {
    if (!uid) throw new Error('error');
    try {
      await connectWithCode(uid, input);
    } catch (e) {
      if (['invalid', 'notfound', 'self'].includes(e.message)) throw e;
      throw new Error('error');
    }
  }, [uid]);

  const unlink = useCallback((linkId) => disconnect(linkId).catch(() => {}), []);

  const friends = links.map((l) => ({ linkId: l.id, uid: l.friendUid, data: friendData[l.friendUid] || null }));
  return { status, code: state.inviteCode, friends, connect, unlink };
}
