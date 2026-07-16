import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../context/DataProvider';

const SYNC_LABEL = {
  idle: '',
  syncing: 'Syncing…',
  synced: 'All changes saved',
  error: "Couldn't sync",
};

export default function AccountMenu() {
  const { available, loading, email, signIn, signUp, signOut } = useAuth();
  const { syncState } = useData();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('signin'); // signin | signup
  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'error' | 'info', text }

  if (!available || loading) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!emailInput.trim() || !password) return;
    setBusy(true);
    setMessage(null);

    const fn = mode === 'signup' ? signUp : signIn;
    const { error, needsConfirm } = await fn(emailInput.trim(), password);

    setBusy(false);
    if (error) {
      setMessage({ type: 'error', text: error });
    } else if (needsConfirm) {
      setMessage({
        type: 'info',
        text: 'Account created. Check your email to confirm, then sign in.',
      });
      setMode('signin');
    } else {
      // Signed in — the auth listener closes the menu by re-rendering.
      setOpen(false);
      setPassword('');
    }
  };

  // --- signed in -------------------------------------------------------------
  if (email) {
    return (
      <div className="account">
        <button
          type="button"
          className="account-avatar"
          onClick={() => setOpen(!open)}
          aria-label="Account"
          title={email}
        >
          {email[0].toUpperCase()}
        </button>
        {open && (
          <>
            <div className="account-scrim" onClick={() => setOpen(false)} />
            <div className="account-popover" role="dialog">
              <span className="account-email">{email}</span>
              {SYNC_LABEL[syncState] && (
                <span className={`sync-line ${syncState}`}>{SYNC_LABEL[syncState]}</span>
              )}
              <button type="button" className="btn-text" onClick={signOut}>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // --- signed out ------------------------------------------------------------
  return (
    <div className="account">
      <button type="button" className="account-signin" onClick={() => setOpen(!open)}>
        Sign in
      </button>
      {open && (
        <>
          <div className="account-scrim" onClick={() => setOpen(false)} />
          <div className="account-popover wide" role="dialog">
            <p className="account-form-title">
              {mode === 'signup' ? 'Create an account' : 'Sign in to sync'}
            </p>
            <p className="account-form-sub">
              Your reading progress, highlights, and notes follow you across devices.
            </p>

            <form onSubmit={submit} className="account-form">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                autoFocus
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                minLength={6}
                required
              />
              {message && (
                <span className={message.type === 'error' ? 'account-error' : 'account-info'}>
                  {message.text}
                </span>
              )}
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <button
              type="button"
              className="account-toggle-mode"
              onClick={() => {
                setMode(mode === 'signup' ? 'signin' : 'signup');
                setMessage(null);
              }}
            >
              {mode === 'signup'
                ? 'Already have an account? Sign in'
                : "New here? Create an account"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
