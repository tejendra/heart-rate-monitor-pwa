import { NavLink, Outlet } from 'react-router-dom';
import { AppBrand } from './AppBrand';
import { useWorkoutSession } from '../context/WorkoutContext';

const navItems = [
  { to: '/', label: 'Workout', end: true },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

export function Layout() {
  const { isRecording } = useWorkoutSession();

  return (
    <div className={`app${isRecording ? ' app--workout-recording' : ''}`}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {!isRecording && (
        <header className="app-header">
          <AppBrand />
        </header>
      )}

      <main
        id="main-content"
        className={`app-main${isRecording ? ' app-main--workout-recording' : ''}`}
        tabIndex={-1}
      >
        <Outlet />
      </main>

      {!isRecording && (
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
      )}
    </div>
  );
}
