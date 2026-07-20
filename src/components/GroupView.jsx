import { useState } from 'react';
import { useGroups } from '../hooks/useGroups';
import { DAYS } from '../data/generatePlan';

export default function GroupView({ myStats }) {
  const { available, user, groups, loading, error, createGroup, joinGroup, leaveGroup } =
    useGroups(myStats);

  const [mode, setMode] = useState('none'); // none | create | join
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!available) {
    return <div className="empty-state"><p className="empty-title">Sync isn’t configured</p></div>;
  }

  if (!user) {
    return (
      <div className="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 6.5a3 3 0 0 1 0 5.8M15.5 20a6.5 6.5 0 0 0-1.8-4.5" />
        </svg>
        <p className="empty-title">Read together</p>
        <p className="empty-sub">Sign in (top right) to start a family group and cheer each other on through the year.</p>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setBusy(true);
    setMsg(null);
    const res =
      mode === 'create'
        ? await createGroup(name.trim() || 'Our Group', displayName.trim())
        : await joinGroup(code, displayName.trim());
    setBusy(false);
    if (res.error) {
      setMsg(res.error);
    } else {
      setMode('none');
      setName('');
      setCode('');
    }
  };

  return (
    <div className="group-view">
      {error && <div className="empty-state"><p className="empty-sub">{error}</p></div>}

      {groups.map((g) => (
        <section key={g.id} className="group-card">
          <header className="group-card-head">
            <div>
              <h3>{g.name}</h3>
              <span className="group-code">
                Code <strong>{g.code}</strong>
              </span>
            </div>
            <button type="button" className="btn-text" onClick={() => leaveGroup(g.id)}>
              Leave
            </button>
          </header>

          <ul className="member-list">
            {g.members.map((m) => (
              <li key={m.id} className={`member${m.user_id === user.id ? ' me' : ''}`}>
                <span className="member-avatar">{(m.display_name || '?')[0].toUpperCase()}</span>
                <div className="member-body">
                  <span className="member-name">
                    {m.display_name}
                    {m.user_id === user.id && <span className="member-you">You</span>}
                  </span>
                  <div className="member-bar-row">
                    <div className="progress-bar-outer thin">
                      <div
                        className="progress-bar-inner"
                        style={{ width: `${Math.round((m.current_day / DAYS) * 100)}%` }}
                      />
                    </div>
                    <span className="member-day">Day {m.current_day}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {mode === 'none' ? (
        <div className="group-actions">
          <button type="button" className="btn-primary" onClick={() => setMode('create')}>
            Create a group
          </button>
          <button type="button" className="btn-secondary" onClick={() => setMode('join')}>
            Join with a code
          </button>
        </div>
      ) : (
        <form className="group-form" onSubmit={submit}>
          <p className="account-form-title">
            {mode === 'create' ? 'Create a group' : 'Join a group'}
          </p>
          {mode === 'create' ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name (e.g. Piarulli Family)"
            />
          ) : (
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="6-letter code"
              maxLength={6}
              autoCapitalize="characters"
              required
            />
          )}
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name (shown to the group)"
            required
          />
          {msg && <span className="account-error">{msg}</span>}
          <div className="group-form-actions">
            <button type="button" className="btn-text" onClick={() => { setMode('none'); setMsg(null); }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={busy || loading}>
              {busy ? 'Please wait…' : mode === 'create' ? 'Create' : 'Join'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
