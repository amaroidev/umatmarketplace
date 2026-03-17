import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();

  const isHomeLanding = pathname === '/';

  /* ── Compact footer — all inner pages ── */
  if (!isHomeLanding) {
    return (
      <footer className="border-t border-earth-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">
            CampusMarket &copy; {year}
          </p>
          <div className="flex items-center gap-5">
            <Link to="/products" className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors">
              Browse
            </Link>
            <Link to="/categories" className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors">
              Categories
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/orders" className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors">
                  Orders
                </Link>
                <Link to="/profile" className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors">
                  Sign in
                </Link>
                <Link to="/register" className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-400 hover:text-earth-900 transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    );
  }

  /* ── Full editorial footer — home/landing only ── */
  return (
    <footer className="bg-[#0a0a0a] text-white">

      {/* Top: large typographic block */}
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-end lg:justify-between">

          {/* Statement */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/25 mb-5">
              CampusMarket
            </p>
            <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-black leading-[0.9] tracking-[-0.04em] text-white">
              Buy it.<br />
              Sell it.<br />
              <span className="text-white/20">Keep it campus.</span>
            </h2>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-8 sm:grid-cols-3 lg:gap-x-20">
            <div>
              <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.28em] text-white/25">
                Marketplace
              </p>
              <ul className="space-y-3">
                {[
                  { to: '/products', label: 'All listings' },
                  { to: '/categories', label: 'Categories' },
                  ...(isAuthenticated ? [{ to: '/sell', label: 'Sell something' }] : []),
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-sm text-white/50 transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.28em] text-white/25">
                Account
              </p>
              <ul className="space-y-3">
                {(isAuthenticated ? [
                  { to: '/profile', label: 'My profile' },
                  { to: '/orders', label: 'My orders' },
                  { to: '/saved', label: 'Saved items' },
                  { to: '/notifications', label: 'Notifications' },
                ] : [
                  { to: '/login', label: 'Sign in' },
                  { to: '/register', label: 'Register' },
                ]).map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-sm text-white/50 transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.28em] text-white/25">
                Support
              </p>
              <ul className="space-y-3">
                {[
                  { to: '/messages', label: 'Messages' },
                  { to: '/notifications', label: 'Notifications' },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-sm text-white/50 transition-colors hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom rule + legal */}
      <div className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-[10px] text-white/25">
            &copy; {year} CampusMarket. All rights reserved.
          </p>
          <p className="text-[10px] text-white/15">
            Built for students, by students.
          </p>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
