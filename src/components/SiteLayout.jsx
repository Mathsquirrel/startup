import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import poisonDartLogo from '../../images/poisonDart.png';
import { authRequest, getAuthToken, getCurrentUser, setAuthToken } from '../api.js';

const imageUrl = (name) => `/images/${name}`;
const exampleFriends = [
  { name: 'MiraVex', status: 'online' },
  { name: 'RootAndRuin', status: 'offline' },
  { name: 'NikoPrime', status: 'online' },
];

export function handlePersonalDecksClick(event) {
  if (!getAuthToken()) {
    event.preventDefault();
    window.dispatchEvent(new Event('open-login-prompt'));
  }
}

export function Header({ builder = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const [username, setUsername] = useState(() => localStorage.getItem('pdf-username') || '');
  const [loggedIn, setLoggedIn] = useState(() => Boolean(localStorage.getItem('pdf-username')));
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [registerPromptOpen, setRegisterPromptOpen] = useState(false);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('builder-nav-collapsed', builder && collapsed);
    return () => document.body.classList.remove('builder-nav-collapsed');
  }, [builder, collapsed]);

  useEffect(() => {
    if (!loginPromptOpen) return undefined;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [loginPromptOpen]);

  useEffect(() => {
    const openPrompt = () => setLoginPromptOpen(true);
    window.addEventListener('open-login-prompt', openPrompt);
    return () => window.removeEventListener('open-login-prompt', openPrompt);
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return undefined;
    getCurrentUser(token).then((user) => {
      setUsername(user.username);
      setLoggedIn(true);
    }).catch(() => {
      setAuthToken(null);
      setLoggedIn(false);
    });
    return undefined;
  }, []);

  const completeLogin = (result) => {
    setAuthToken(result.token);
    localStorage.setItem('pdf-username', result.username);
    setUsername(result.username);
    setPassword('');
    setLoggedIn(true);
    window.dispatchEvent(new Event('auth-changed'));
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthError('');
    try {
      const result = await authRequest('/auth/login', { username, password });
      completeLogin(result);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const submitRegistration = async (event) => {
    event.preventDefault();
    setAuthError('');
    try {
      await authRequest('/auth/register', { username, password });
      const result = await authRequest('/auth/login', { username, password });
      completeLogin(result);
      setRegisterPromptOpen(false);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const logout = async () => {
    const token = getAuthToken();
    try {
      if (token) await authRequest('/auth/logout', {}, token);
    } catch {
      // The local session is cleared even if the server session already expired.
    }
    setAuthToken(null);
    localStorage.removeItem('pdf-username');
    setLoggedIn(false);
    setUsername('');
    setPassword('');
    window.dispatchEvent(new Event('auth-changed'));
  };

  useEffect(() => {
    const updateAuth = () => {
      const token = getAuthToken();
      setLoggedIn(Boolean(token));
    };
    window.addEventListener('auth-changed', updateAuth);
    return () => window.removeEventListener('auth-changed', updateAuth);
  }, []);

  return <header className={builder ? `collapsible-sidebar${collapsed ? ' nav-collapsed' : ''}` : ''}>
    <div className="header-inner">
      <div className="brand">
        <img className="brand-logo" src={poisonDartLogo} alt="Poison dart frog logo" />
        <h1>PDF DECKS</h1>
        {loggedIn ? <div className="login-form"><strong>Welcome {username}</strong><button type="button" onClick={logout}>Log Out</button></div> : <form className="login-form" onSubmit={submitAuth}>
          <label htmlFor={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-username`}>Username</label>
          <input id={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-username`} name="username" type="text" placeholder="Username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} />
          <label htmlFor={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-password`}>Password</label>
          <input id={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-password`} name="password" type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          <button type="submit">Log In</button>
          <button type="button" onClick={() => { setRegisterPromptOpen(true); setAuthError(''); }}>Need an account?</button>
          {authError && <p role="alert">{authError}</p>}
        </form>}
      </div>
      <section className="friend-list" aria-labelledby="friends-title"><h2 id="friends-title">Friends</h2>{loggedIn ? <ul>{exampleFriends.map((friend) => <li key={friend.name}><span className={`status-dot ${friend.status}`} aria-label={friend.status} />{friend.name}</li>)}</ul> : <><ul /><p className="friend-login-note">No Friends Have Been Added Yet</p></>}</section>
      <nav className="btn-group" aria-label="Primary navigation">
        <NavLink className="btn btn-primary" to="/">Home</NavLink>
        <NavLink className="btn btn-primary" to="/public-decks">Public Decks</NavLink>
        {loggedIn ? <NavLink className="btn btn-primary" to="/personal-decks">My Decks</NavLink> : <button className="btn btn-primary" type="button" onClick={() => setLoginPromptOpen(true)}>My Decks</button>}
      </nav>
      {builder && <button className="nav-toggle" type="button" aria-expanded={!collapsed} aria-label={collapsed ? 'Open navigation' : 'Close navigation'} onClick={() => setCollapsed((value) => !value)} />}
    </div>
    {loginPromptOpen && <div className="login-prompt-overlay" role="dialog" aria-modal="true" aria-labelledby="login-prompt-title"><div className="login-prompt"><p id="login-prompt-title">Please log in or create an account to save personal decks!</p><button type="button" onClick={() => setLoginPromptOpen(false)}>Ok</button></div></div>}
    {registerPromptOpen && <div className="login-prompt-overlay" role="dialog" aria-modal="true" aria-labelledby="register-title"><form className="login-prompt registration-prompt" onSubmit={submitRegistration}><button className="modal-close" type="button" aria-label="Close registration" onClick={() => setRegisterPromptOpen(false)}>×</button><h2 id="register-title">Create an account</h2><div className="registration-field"><label htmlFor="register-username">Username</label><input id="register-username" type="text" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></div><div className="registration-field"><label htmlFor="register-password">Password</label><input id="register-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div><button type="submit">Register</button>{authError && <p role="alert">{authError}</p>}</form></div>}
  </header>;
}

export function Layout({ children, builder = false, footerText }) {
  return <><Header builder={builder} />{children}<footer><p>{footerText}</p></footer></>;
}

export { imageUrl };