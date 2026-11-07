import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS } from '../lib/format';
import type { UserRole } from '../api/types';

type NavItem = { to: string; label: string };

const NAV: Record<UserRole | 'GUEST', NavItem[]> = {
  GUEST: [
    { to: '/', label: 'خانه' },
    { to: '/book', label: 'رزرو نوبت' },
  ],
  CUSTOMER: [
    { to: '/', label: 'خانه' },
    { to: '/book', label: 'رزرو نوبت' },
    { to: '/my-appointments', label: 'نوبت‌های من' },
  ],
  SPECIALIST: [
    { to: '/specialist/appointments', label: 'نوبت‌ها' },
    { to: '/specialist/hours', label: 'ساعات کاری' },
    { to: '/specialist/profile', label: 'پروفایل متخصص' },
  ],
  ADMIN: [
    { to: '/admin/services', label: 'خدمات' },
    { to: '/admin/specialists', label: 'متخصص‌ها' },
    { to: '/admin/users', label: 'کاربران' },
  ],
};

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  const items = NAV[user?.role ?? 'GUEST'];

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden>
              ✿
            </span>
            <span>سالن زیبایی</span>
          </Link>

          <button
            className="menu-toggle"
            aria-label="منو"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`nav ${open ? 'nav-open' : ''}`}>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}

            <div className="nav-user">
              {user ? (
                <>
                  <NavLink to="/profile" className="user-chip">
                    <span className="avatar">{user.fullName.trim().charAt(0)}</span>
                    <span className="user-chip-text">
                      <strong>{user.fullName}</strong>
                      <small>{ROLE_LABELS[user.role]}</small>
                    </span>
                  </NavLink>
                  <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
                    خروج
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost btn-sm">
                    ورود
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    ثبت‌نام
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="container main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">سامانه رزرو نوبت سالن زیبایی</div>
      </footer>
    </div>
  );
}
