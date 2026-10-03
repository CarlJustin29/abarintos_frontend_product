import { useState } from 'react';
import { login, register, errorMessage } from '../api.js';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);

    try {
      if (mode === 'register') {
        await register(form);
        setNotice('Account created. You can now sign in.');
        setMode('login');
      } else {
        onLogin(await login(form.username, form.password));
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setNotice('');
    setMode(mode === 'login' ? 'register' : 'login');
  };

  return (
    <main className="auth-page">
      <section className="auth-story">
        <a className="brand" href="/" aria-label="Stockroom home">
          <span className="brand-mark">S</span>
          <span><span className="brand-name">STOCKROOM</span><span className="brand-caption">PRODUCT WORKSPACE</span></span>
        </a>
        <div className="story-copy">
          <p className="eyebrow">A clearer view of your inventory</p>
          <h1>Everything in its right place.</h1>
          <p>A calm, simple space to keep your product catalog organized and in view.</p>
        </div>
        <p className="story-foot">PRODUCT WORKSPACE &nbsp;·&nbsp; SIMPLE BY DESIGN</p>
      </section>
      <section className="auth-side">
        <div className="auth">
          <p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join the workspace'}</p>
          <h2>{mode === 'login' ? 'Sign in to Stockroom' : 'Create your account'}</h2>
          <p className="auth-subtitle">
            {mode === 'login' ? 'Enter your details to access your product workspace.' : 'Create an account to view the product catalog.'}
          </p>
          {error && <div className="alert error" role="alert">{error}</div>}
          {notice && <div className="alert success" role="status">{notice}</div>}

          <form onSubmit={submit}>
            <label>Username
              <input autoComplete="username" value={form.username} onChange={set('username')} required />
            </label>
            {mode === 'register' && (
              <label>Email address
                <input type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
              </label>
            )}
            <label>Password
              <input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
              />
            </label>
            <button className="button auth-submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="auth-foot">
            {mode === 'login' ? 'No account yet? ' : 'Already registered? '}
            <button type="button" onClick={toggleMode}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button>
          </p>
        </div>
      </section>
    </main>
  );
}
