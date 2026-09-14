import { useMemo, useState } from 'react';
import { useGroups } from '../hooks/useGroups';
import { PRAYER_CIRCLES, usePrayerRequests } from '../hooks/usePrayerRequests';

function formatWhen(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function circleMeta(id) {
  return PRAYER_CIRCLES.find((c) => c.id === id) || { label: id, short: id, hint: '' };
}

/**
 * Lifegroup prayer wall — guys / girls / whole group / wife circles.
 */
export default function PrayerRequestsPanel({ myStats }) {
  const { groups } = useGroups(myStats);
  const groupId = groups[0]?.id || null;
  const groupName = groups[0]?.name || null;

  const {
    available,
    user,
    profile,
    requests,
    loading,
    error,
    remoteReady,
    saveProfile,
    addRequest,
    toggleAnswered,
    removeRequest,
  } = usePrayerRequests(groupId);

  const [filter, setFilter] = useState('all');
  const [body, setBody] = useState('');
  const [circle, setCircle] = useState('group');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [editingProfile, setEditingProfile] = useState(!profile.displayName || !profile.gender);
  const [draftName, setDraftName] = useState(profile.displayName || '');
  const [draftGender, setDraftGender] = useState(profile.gender || '');
  const [draftCouple, setDraftCouple] = useState(profile.spousePairCode || '');

  const filtered = useMemo(() => {
    if (filter === 'all') return requests;
    return requests.filter((r) => r.circle === filter);
  }, [requests, filter]);

  const allowedCircles = useMemo(() => {
    return PRAYER_CIRCLES.filter((c) => {
      if (c.id === 'guys') return profile.gender === 'guy';
      if (c.id === 'girls') return profile.gender === 'girl';
      if (c.id === 'wife') return Boolean(profile.spousePairCode);
      return true;
    });
  }, [profile]);

  const saveSetup = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await saveProfile({
      displayName: draftName,
      gender: draftGender,
      spousePairCode: draftCouple,
    });
    setBusy(false);
    if (res.error) {
      setMsg(res.error);
      return;
    }
    setEditingProfile(false);
    if (draftGender === 'guy') setCircle('guys');
    else if (draftGender === 'girl') setCircle('girls');
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await addRequest({ circle, body });
    setBusy(false);
    if (res.error) {
      setMsg(res.error);
      return;
    }
    setBody('');
    if (res.localOnly) {
      setMsg('Saved on this device. Sign in + run the SQL + join a group to share with each other.');
    }
  };

  return (
    <div className="prayer-req">
      <header className="prayer-req-hero">
        <span className="eyebrow">Lifegroup · Prayer</span>
        <h2>Prayer requests</h2>
        <p className="prayer-req-blurb">
          Share what you’re carrying — guys only, girls only, the whole group, or just with your wife.
        </p>
        {groupName ? (
          <p className="prayer-req-meta">Sharing with <strong>{groupName}</strong></p>
        ) : available && user ? (
          <p className="prayer-req-meta">
            Join a family group (More → Family) for guys / girls / group circles. Wife circle only needs a couple code.
          </p>
        ) : null}
      </header>

      {error && (
        <div className="prayer-req-banner warn">
          <p>{error}</p>
        </div>
      )}

      {!remoteReady && !error && (
        <div className="prayer-req-banner">
          <p>
            {available && user
              ? 'Working on this device for now. After supabase/prayer-requests.sql is applied, requests sync to your group.'
              : 'Working on this device. Sign in to share requests with each other.'}
          </p>
        </div>
      )}

      <section className="prayer-req-card setup">
        <div className="prayer-req-setup-head">
          <h3 className="prayer-req-card-title">Your circle</h3>
          {!editingProfile && profile.displayName && (
            <button type="button" className="btn-text" onClick={() => setEditingProfile(true)}>
              Edit
            </button>
          )}
        </div>

        {editingProfile ? (
          <form className="prayer-req-form" onSubmit={saveSetup}>
            <label className="prayer-req-label" htmlFor="pr-name">
              Display name
            </label>
            <input
              id="pr-name"
              className="prayer-req-input"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="How the group knows you"
              autoComplete="nickname"
              required
            />

            <p className="prayer-req-label">I’m in the…</p>
            <div className="prayer-req-gender" role="group" aria-label="Gender circle">
              <button
                type="button"
                className={`chip${draftGender === 'guy' ? ' active' : ''}`}
                onClick={() => setDraftGender('guy')}
              >
                Guys circle
              </button>
              <button
                type="button"
                className={`chip${draftGender === 'girl' ? ' active' : ''}`}
                onClick={() => setDraftGender('girl')}
              >
                Girls circle
              </button>
            </div>

            <label className="prayer-req-label" htmlFor="pr-couple">
              Couple code <span>(optional — for wife / spouse circle)</span>
            </label>
            <input
              id="pr-couple"
              className="prayer-req-input"
              value={draftCouple}
              onChange={(e) => setDraftCouple(e.target.value)}
              placeholder="Same short code you both invent"
              autoComplete="off"
            />
            <p className="prayer-req-hint">
              Pick any private word or number. Only people who enter the same code see wife-circle requests.
            </p>

            <button type="submit" className="btn-primary" disabled={busy || !draftGender}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </form>
        ) : (
          <p className="prayer-req-setup-summary">
            <strong>{profile.displayName}</strong>
            {' · '}
            {profile.gender === 'guy' ? 'Guys circle' : 'Girls circle'}
            {profile.spousePairCode ? ` · Couple code ${profile.spousePairCode}` : ''}
          </p>
        )}
      </section>

      {!editingProfile && (
        <>
          <form className="prayer-req-card compose" onSubmit={submit}>
            <h3 className="prayer-req-card-title">Add a request</h3>
            <p className="prayer-req-label">Who can see this?</p>
            <div className="prayer-req-circles" role="group" aria-label="Visibility circle">
              {PRAYER_CIRCLES.map((c) => {
                const allowed = allowedCircles.some((a) => a.id === c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`chip${circle === c.id ? ' active' : ''}`}
                    disabled={!allowed}
                    title={allowed ? c.hint : 'Set this up in Your circle first'}
                    onClick={() => allowed && setCircle(c.id)}
                  >
                    {c.short}
                  </button>
                );
              })}
            </div>
            <p className="prayer-req-hint">{circleMeta(circle).hint}</p>

            <label className="prayer-req-label" htmlFor="pr-body">
              Request
            </label>
            <textarea
              id="pr-body"
              className="prayer-req-notes"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What can we pray for?"
              required
            />
            <button type="submit" className="btn-primary" disabled={busy || !body.trim()}>
              {busy ? 'Posting…' : 'Share request'}
            </button>
          </form>

          <div className="filter-row section-switch prayer-req-filters" role="tablist" aria-label="Filter by circle">
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              className={`chip${filter === 'all' ? ' active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            {PRAYER_CIRCLES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={filter === c.id}
                className={`chip${filter === c.id ? ' active' : ''}`}
                onClick={() => setFilter(c.id)}
              >
                {c.short}
              </button>
            ))}
          </div>

          {loading && <p className="prayer-req-hint">Loading…</p>}

          {!loading && filtered.length === 0 && (
            <div className="empty-state compact">
              <p className="empty-title">No requests yet</p>
              <p className="empty-sub">
                {filter === 'all'
                  ? 'Be the first — add something the group can carry with you.'
                  : `Nothing in the ${circleMeta(filter).label.toLowerCase()} circle yet.`}
              </p>
            </div>
          )}

          <ul className="prayer-req-list">
            {filtered.map((r) => {
              const mine = user ? r.authorId === user.id : r.authorId === 'local' || !r.remote;
              const meta = circleMeta(r.circle);
              return (
                <li key={r.id} className={`prayer-req-item${r.answeredAt ? ' answered' : ''}`}>
                  <div className="prayer-req-item-top">
                    <span className={`prayer-req-badge circle-${r.circle}`}>{meta.short}</span>
                    <span className="prayer-req-when">{formatWhen(r.createdAt)}</span>
                  </div>
                  <p className="prayer-req-body">{r.body}</p>
                  <div className="prayer-req-item-foot">
                    <span className="prayer-req-author">{r.authorName}</span>
                    {mine && (
                      <div className="prayer-req-actions">
                        <button type="button" className="btn-text" onClick={() => toggleAnswered(r.id)}>
                          {r.answeredAt ? 'Mark open' : 'Answered'}
                        </button>
                        <button type="button" className="btn-text danger" onClick={() => removeRequest(r.id)}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {msg && <p className="prayer-req-msg">{msg}</p>}
    </div>
  );
}
