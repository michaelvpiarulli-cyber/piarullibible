import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/** Short, unambiguous share code (no 0/O/1/I/L). */
function genCode() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

const TABLE_MISSING = 'Family groups aren’t set up yet. Run supabase/groups.sql.';

/**
 * Family groups: create/join by code and see everyone's reading progress.
 * `myStats` is the caller's shared summary ({ current_day, streak,
 * completed_days }); it's pushed to the caller's own rows on load so peers see
 * fresh numbers. Notes/highlights are never touched here.
 */
export function useGroups(myStats) {
  const { available, user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep latest stats without making load() churn on every keystroke of reading.
  const statsRef = useRef(myStats);
  statsRef.current = myStats;

  const load = useCallback(async () => {
    if (!available || !user) {
      setGroups([]);
      return;
    }
    setLoading(true);
    setError(null);

    if (statsRef.current) {
      await supabase
        .from('group_members')
        .update({ ...statsRef.current, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    }

    const { data: mine, error: e1 } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id);

    if (e1) {
      setError(e1.code === 'PGRST205' ? TABLE_MISSING : e1.message);
      setLoading(false);
      return;
    }

    const ids = (mine || []).map((m) => m.group_id);
    if (ids.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const [{ data: grps }, { data: members }] = await Promise.all([
      supabase.from('groups').select('*').in('id', ids),
      supabase.from('group_members').select('*').in('group_id', ids),
    ]);

    const assembled = (grps || []).map((g) => ({
      ...g,
      members: (members || [])
        .filter((m) => m.group_id === g.id)
        .sort((a, b) => b.current_day - a.current_day),
    }));
    setGroups(assembled);
    setLoading(false);
  }, [available, user]);

  useEffect(() => {
    load();
  }, [load]);

  const createGroup = useCallback(
    async (name, displayName) => {
      if (!user) return { error: 'Not signed in' };
      const code = genCode();
      const { data: g, error: e1 } = await supabase
        .from('groups')
        .insert({ code, name, created_by: user.id })
        .select()
        .single();
      if (e1) return { error: e1.code === 'PGRST205' ? TABLE_MISSING : e1.message };

      const { error: e2 } = await supabase.from('group_members').insert({
        group_id: g.id,
        user_id: user.id,
        display_name: displayName,
        ...(statsRef.current || {}),
      });
      if (e2) return { error: e2.message };
      await load();
      return { error: null, code };
    },
    [user, load]
  );

  const joinGroup = useCallback(
    async (code, displayName) => {
      if (!user) return { error: 'Not signed in' };
      const { data: g, error: e1 } = await supabase
        .from('groups')
        .select('id')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();
      if (e1) return { error: e1.code === 'PGRST205' ? TABLE_MISSING : e1.message };
      if (!g) return { error: 'No group found with that code.' };

      const { error: e2 } = await supabase.from('group_members').insert({
        group_id: g.id,
        user_id: user.id,
        display_name: displayName,
        ...(statsRef.current || {}),
      });
      if (e2) return { error: e2.code === '23505' ? 'You’re already in this group.' : e2.message };
      await load();
      return { error: null };
    },
    [user, load]
  );

  const leaveGroup = useCallback(
    async (groupId) => {
      if (!user) return;
      await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', user.id);
      await load();
    },
    [user, load]
  );

  return { available, user, groups, loading, error, createGroup, joinGroup, leaveGroup, reload: load };
}
