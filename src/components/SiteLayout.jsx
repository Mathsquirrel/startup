import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import poisonDartLogo from '../../images/poisonDart.png';

const imageUrl = (name) => `/images/${name}`;

export function Header({ builder = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle('builder-nav-collapsed', builder && collapsed);
    return () => document.body.classList.remove('builder-nav-collapsed');
  }, [builder, collapsed]);

  return <header className={builder ? `collapsible-sidebar${collapsed ? ' nav-collapsed' : ''}` : ''}>
    <div className="header-inner">
      <div className="brand">
        <img className="brand-logo" src={poisonDartLogo} alt="Poison dart frog logo" />
        <h1>PDF DECKS</h1>
        <form className="login-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-username`}>Username</label>
          <input id={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-username`} name="username" type="text" placeholder="Username" autoComplete="username" />
          <label htmlFor={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-password`}>Password</label>
          <input id={`${builder ? 'builder' : location.pathname.slice(1) || 'index'}-password`} name="password" type="password" placeholder="Password" autoComplete="current-password" />
          <button type="submit">Log in</button>
        </form>
      </div>
      <section className="friend-list" aria-labelledby="friends-title"><h2 id="friends-title">Friends</h2><ul /><p className="friend-login-note">No Friends Have Been Added Yet</p></section>
      <nav className="btn-group" aria-label="Primary navigation">
        <NavLink className="btn btn-primary" to="/">Home</NavLink>
        <NavLink className="btn btn-primary" to="/public-decks">Public Decks</NavLink>
        <NavLink className="btn btn-primary" to="/personal-decks">My Decks</NavLink>
      </nav>
      {builder && <button className="nav-toggle" type="button" aria-expanded={!collapsed} aria-label={collapsed ? 'Open navigation' : 'Close navigation'} onClick={() => setCollapsed((value) => !value)} />}
    </div>
  </header>;
}

export function Layout({ children, builder = false, footerText }) {
  return <><Header builder={builder} />{children}<footer><p>{footerText}</p></footer></>;
}

export { imageUrl };