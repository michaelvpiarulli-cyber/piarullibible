import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const PRAYER_CIRCLES = [
  { id: 'guys', label: 'Guys only', short: 'Guys', hint: 'Visible to the men in your group' },
  { id: 'girls', label: 'Girls only', short: 'Girls', hint: 'Visible to the women in your group' },
  { id: 'group', label: 'Whole group', short: 'Group', hint: 'Visible to everyone in your group' },
  { id: 'wife', label: 'Wife / spouse', short: 'Wife', hint: 'Only you and your spouse (shared couple code)' },
];

const PROFILE_KEY = 'bible-plan-prayer-profile';
const LOCAL_KEY = 'bible-plan-prayer-requests';
const TABLE_MISSING =
  'Prayer requests aren’t set up yet. Run supabase/groups.sql then supabase/prayer-requests.sql.';

function loadLocal(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || 'null');
    return raw ?? fallback;
  } catch {
    return fallback;
  }
}

function saveLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeCoupleCode(code) {
  return (code || '').trim().toUpperCase().replace(/\s+/g, '');
}

function genLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Shared lifegroup prayer requests, filtered by circle.
 * Uses Supabase when signed in (after SQL is applied); otherwise local-only
 * so the UI still works on one device.
 */
export function usePrayerRequests(groupId) {
  const { available, user } = useAuth();
  const [profile, setProfile] = useState(() =>
    loadLocal(PROFILE_KEY, { displayName: '', gender: '', spousePairCode: '' })
  );
  const [requests, setRequests] = useState(() => loadLocal(LOCAL_KEY, []));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [remoteReady, setRemoteReady] = useState(false);

  const persistProfile = useCallback((next) => {
    setProfile(next);
    saveLocal(PROFILE_KEY, next);
  }, []);

  const load = useCallback(async () => {
    if (!available || !user) {
      setRemoteReady(false);
      setRequests(loadLocal(LOCAL_KEY, []));
      return;
    }

    setLoading(true);
    setError(null);

    const { data: remoteProfile, error: pe } = await supabase
      .from('prayer_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (pe) {
      setError(pe.code === 'PGRST205' ? TABLE_MISSING : pe.message);
      setRemoteReady(false);
      setLoading(false);
      setRequests(loadLocal(LOCAL_KEY, []));
      return;
    }

    if (remoteProfile) {
      const merged = {
        displayName: remoteProfile.display_name || '',
        gender: remoteProfile.gender || '',
        spousePairCode: remoteProfile.spouse_pair_code || '',
      };
      persistProfile(merged);
    }

    // Fetch what RLS allows: own + group circles + wife by couple code.
    let query = supabase
      .from('prayer_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (groupId) {
      // Prefer this group's shared circles; wife rows still come back via RLS
      // even when group_id is null.
      query = query.or(`group_id.eq.${groupId},circle.eq.wife`);
    } else {
      query = query.eq('circle', 'wife');
    }

    const { data, error: re } = await query;
    if (re) {
      setError(re.code === 'PGRST205' ? TABLE_MISSING : re.message);
      setRemoteReady(false);
      setRequests(loadLocal(LOCAL_KEY, []));
    } else {
      setRemoteReady(true);
      setRequests(
        (data || []).map((r) => ({
          id: r.id,
          authorId: r.author_id,
          groupId: r.group_id,
          circle: r.circle,
          body: r.body,
          authorName: r.author_name,
          spousePairCode: r.spouse_pair_code,
          answeredAt: r.answered_at,
          createdAt: r.created_at,
          remote: true,
        }))
      );
    }
    setLoading(false);
  }, [available, user, groupId, persistProfile]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = useCallback(
    async ({ displayName, gender, spousePairCode }) => {
      const next = {
        displayName: (displayName || '').trim(),
        gender: gender === 'guy' || gender === 'girl' ? gender : '',
        spousePairCode: normalizeCoupleCode(spousePairCode),
      };
      if (!next.displayName || !next.gender) {
        return { error: 'Add your name and whether you’re in the guys or girls circle.' };
      }
      persistProfile(next);

      if (!available || !user) return { error: null, localOnly: true };

      const { error: e } = await supabase.from('prayer_profiles').upsert({
        user_id: user.id,
        display_name: next.displayName,
        gender: next.gender,
        spouse_pair_code: next.spousePairCode || null,
        updated_at: new Date().toISOString(),
      });
      if (e) return { error: e.code === 'PGRST205' ? TABLE_MISSING : e.message };
      await load();
      return { error: null };
    },
    [available, user, persistProfile, load]
  );

  const addRequest = useCallback(
    async ({ circle, body }) => {
      const text = (body || '').trim();
      if (!text) return { error: 'Write a prayer request first.' };
      if (!PRAYER_CIRCLES.some((c) => c.id === circle)) {
        return { error: 'Pick a circle.' };
      }
      if (!profile.displayName || !profile.gender) {
        return { error: 'Set up your name and circle first.' };
      }
      if (circle === 'guys' && profile.gender !== 'guy') {
        return { error: 'Guys-only requests are for the guys circle.' };
      }
      if (circle === 'girls' && profile.gender !== 'girl') {
        return { error: 'Girls-only requests are for the girls circle.' };
      }
      if (circle === 'wife' && !profile.spousePairCode) {
        return { error: 'Add a couple code (with your spouse) to use the wife circle.' };
      }
      if (circle !== 'wife' && !groupId && remoteReady) {
        return { error: 'Join a family group first so the guys / girls / group circles have somewhere to live.' };
      }

      if (available && user && remoteReady) {
        const row = {
          author_id: user.id,
          group_id: circle === 'wife' ? groupId || null : groupId,
          circle,
          body: text,
          author_name: profile.displayName,
          spouse_pair_code: circle === 'wife' ? profile.spousePairCode : null,
        };
        const { error: e } = await supabase.from('prayer_requests').insert(row);
        if (e) return { error: e.message };
        await load();
        return { error: null };
      }

      // Local-only fallback (one device / SQL not applied yet).
      const local = {
        id: genLocalId(),
        authorId: user?.id || 'local',
        groupId: groupId || null,
        circle,
        body: text,
        authorName: profile.displayName,
        spousePairCode: circle === 'wife' ? profile.spousePairCode : null,
        answeredAt: null,
        createdAt: new Date().toISOString(),
        remote: false,
      };
      const next = [local, ...loadLocal(LOCAL_KEY, [])];
      saveLocal(LOCAL_KEY, next);
      setRequests(next);
      return { error: null, localOnly: true };
    },
    [profile, groupId, available, user, remoteReady, load]
  );

  const toggleAnswered = useCallback(
    async (id) => {
      const item = requests.find((r) => r.id === id);
      if (!item) return;
      const answeredAt = item.answeredAt ? null : new Date().toISOString();

      if (item.remote && available && user) {
        const { error: e } = await supabase
          .from('prayer_requests')
          .update({ answered_at: answeredAt })
          .eq('id', id)
          .eq('author_id', user.id);
        if (e) {
          setError(e.message);
          return;
        }
        await load();
        return;
      }

      const next = loadLocal(LOCAL_KEY, []).map((r) =>
        r.id === id ? { ...r, answeredAt } : r
      );
      saveLocal(LOCAL_KEY, next);
      setRequests(next);
    },
    [requests, available, user, load]
  );

  const removeRequest = useCallback(
    async (id) => {
      const item = requests.find((r) => r.id === id);
      if (!item) return;

      if (item.remote && available && user) {
        const { error: e } = await supabase
          .from('prayer_requests')
          .delete()
          .eq('id', id)
          .eq('author_id', user.id);
        if (e) {
          setError(e.message);
          return;
        }
        await load();
        return;
      }

      const next = loadLocal(LOCAL_KEY, []).filter((r) => r.id !== id);
      saveLocal(LOCAL_KEY, next);
      setRequests(next);
    },
    [requests, available, user, load]
  );

  const visibleRequests = useMemo(() => {
    // Remote already filtered by RLS. Local: filter by gender / couple code.
    // Do not let a shared local authorId bypass guys/girls privacy when the
    // on-device profile switches circles.
    if (remoteReady) return requests;
    return requests.filter((r) => {
      if (r.circle === 'group') return true;
      if (r.circle === 'guys') return profile.gender === 'guy';
      if (r.circle === 'girls') return profile.gender === 'girl';
      if (r.circle === 'wife') {
        return Boolean(
          profile.spousePairCode &&
            r.spousePairCode &&
            r.spousePairCode === profile.spousePairCode
        );
      }
      return false;
    });
  }, [requests, remoteReady, profile]);

  return {
    available,
    user,
    profile,
    requests: visibleRequests,
    loading,
    error,
    remoteReady,
    saveProfile,
    addRequest,
    toggleAnswered,
    removeRequest,
    reload: load,
  };
}
