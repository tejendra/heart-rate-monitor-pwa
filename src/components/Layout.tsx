import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Workout', end: true },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

export function Layout() {
  return (
    <div className="app">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="app-header">
        <h1 className="app-title">Heart Rate Workout Tracker</h1>
      </header>

      <main id="main-content" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>

      <nav className="app-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link--active' : 'nav-link'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
