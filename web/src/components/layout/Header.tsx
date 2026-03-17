import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Settings,
  Bell,
  ChevronDown,
  ClipboardList,
  Grid,
  Heart,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  ShoppingBag,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import chatService from '../../services/chat.service';
import notificationService from '../../services/notification.service';
import Button from '../ui/Button';
import { SearchBar } from '../search';
import BrandMark from './BrandMark';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount, setUnreadCount, onNewMessage } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  useEffect(() => {
    if (!isAuthenticated) return;
    chatService.getUnreadCount().then((res) => {
      if (res.success) setUnreadCount(res.data.unreadCount);
    }).catch(() => {});
  }, [isAuthenticated, setUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated) return;
    notificationService.getUnreadCount().then((res) => {
      if (res.success) setNotificationCount(res.data.unreadCount);
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    const unsub = onNewMessage((message) => {
      const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
      if (senderId !== user?._id) {
        setUnreadCount((prev) => prev + 1);
      }
    });
    return unsub;
  }, [onNewMessage, setUnreadCount, user?._id]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const brand = (
    <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 flex-shrink-0">
      <BrandMark className="h-7 w-7" />
      <span className="text-sm font-black tracking-[-0.02em] text-earth-900 uppercase">
        CampusMarket
      </span>
    </Link>
  );

  /* ── Minimal auth-page bar ── */
  if (isAuthPage) {
    return (
      <header className="border-b border-earth-100 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {brand}
          <div className="flex items-center gap-4">
            <Link
              to="/products"
              className="hidden text-xs font-bold uppercase tracking-[0.18em] text-earth-400 transition-colors hover:text-earth-900 sm:inline-flex"
            >
              Browse
            </Link>
            {location.pathname === '/login' ? (
              <Link
                to="/register"
                className="text-xs font-bold uppercase tracking-[0.18em] text-earth-900 transition-opacity hover:opacity-60"
              >
                Register →
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold uppercase tracking-[0.18em] text-earth-900 transition-opacity hover:opacity-60"
              >
                Sign in →
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-earth-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-6">

          {/* Left: logo + nav links */}
          <div className="flex items-center gap-8 flex-shrink-0">
            {brand}
            <nav className="hidden items-center gap-6 lg:flex">
              <Link
                to="/products"
                className="text-xs font-bold uppercase tracking-[0.18em] text-earth-500 transition-colors hover:text-earth-900"
              >
                Browse
              </Link>
              <Link
                to="/categories"
                className="text-xs font-bold uppercase tracking-[0.18em] text-earth-500 transition-colors hover:text-earth-900"
              >
                Categories
              </Link>
              {isAuthenticated && (
                <Link
                  to="/saved"
                  className="text-xs font-bold uppercase tracking-[0.18em] text-earth-500 transition-colors hover:text-earth-900"
                >
                  Saved
                </Link>
              )}
            </nav>
          </div>

          {/* Center: search */}
          <div className="hidden flex-1 max-w-sm lg:block">
            <SearchBar
              className="w-full [&_.searchbar-input]:h-8 [&_.searchbar-input]:rounded-none [&_.searchbar-input]:border-0 [&_.searchbar-input]:border-b [&_.searchbar-input]:border-earth-200 [&_.searchbar-input]:bg-transparent [&_.searchbar-input]:text-xs [&_.searchbar-input]:focus:border-earth-700 [&_.searchbar-input]:focus:outline-none [&_.searchbar-input]:focus:ring-0 [&_.searchbar-panel]:rounded-xl [&_.searchbar-panel]:border-earth-200"
              placeholder="Search listings..."
            />
          </div>

          {/* Right: actions */}
          <div className="hidden items-center gap-1 md:flex">
            {isAuthenticated ? (
              <>
                {(user?.role === 'seller' || user?.role === 'admin') && (
                  <Link
                    to="/sell"
                    className="mr-3 text-xs font-bold uppercase tracking-[0.18em] text-earth-900 transition-opacity hover:opacity-60"
                  >
                    + Sell
                  </Link>
                )}

                <Link
                  to="/messages"
                  className="relative p-2 text-earth-500 transition-colors hover:text-earth-900"
                  title="Messages"
                >
                  <MessageSquare className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-[14px] min-w-[14px] items-center justify-center bg-earth-900 px-0.5 text-[8px] font-black text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/notifications"
                  className="relative p-2 text-earth-500 transition-colors hover:text-earth-900"
                  title="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {notificationCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-[14px] min-w-[14px] items-center justify-center bg-earth-900 px-0.5 text-[8px] font-black text-white">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="relative ml-2">
                  <button
                    className="flex items-center gap-2 text-earth-700 transition-colors hover:text-earth-900"
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  >
                    <div className="flex h-7 w-7 items-center justify-center bg-earth-100 overflow-hidden">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-7 w-7 object-cover" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-earth-500" />
                      )}
                    </div>
                    <span className="hidden text-xs font-bold uppercase tracking-[0.14em] lg:block max-w-[80px] truncate">
                      {user?.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="h-3 w-3 text-earth-400" />
                  </button>

                  {isProfileMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsProfileMenuOpen(false)} />
                      <div className="absolute right-0 z-40 mt-3 w-52 border border-earth-100 bg-white shadow-lg">
                        <div className="border-b border-earth-100 px-4 py-3">
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-earth-900">{user?.name}</p>
                          <p className="text-[10px] text-earth-400 mt-0.5">{user?.email}</p>
                        </div>
                        {[
                          { to: '/profile', icon: <User className="h-3.5 w-3.5" />, label: 'Profile' },
                          { to: '/messages', icon: <MessageSquare className="h-3.5 w-3.5" />, label: 'Messages' },
                          ...(user?.role === 'seller' || user?.role === 'admin' ? [
                            { to: '/my-listings', icon: <ShoppingBag className="h-3.5 w-3.5" />, label: 'My listings' },
                            { to: '/seller/orders', icon: <ClipboardList className="h-3.5 w-3.5" />, label: 'Seller orders' },
                          ] : []),
                          { to: '/orders', icon: <Package className="h-3.5 w-3.5" />, label: 'My orders' },
                          { to: '/notifications', icon: <Bell className="h-3.5 w-3.5" />, label: 'Notifications' },
                          { to: '/settings', icon: <Settings className="h-3.5 w-3.5" />, label: 'Settings' },
                          ...(user?.role === 'admin' ? [
                            { to: '/admin', icon: <Grid className="h-3.5 w-3.5" />, label: 'Admin' },
                          ] : []),
                        ].map(({ to, icon, label }) => (
                          <Link
                            key={to}
                            to={to}
                            className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-earth-700 transition-colors hover:bg-earth-50"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            {icon}
                            {label}
                          </Link>
                        ))}
                        <button
                          className="flex w-full items-center gap-3 border-t border-earth-100 px-4 py-2.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-bold uppercase tracking-[0.18em] text-earth-500 transition-colors hover:text-earth-900 px-3 py-2"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="ml-1 bg-earth-900 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-75"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="p-2 text-earth-700 md:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — drawer style, no rounded corners */}
      {isMobileMenuOpen && (
        <div className="border-t border-earth-100 bg-white md:hidden">
          <div className="px-4 py-5 space-y-1">
            <SearchBar
              className="mb-4 [&_.searchbar-input]:rounded-none [&_.searchbar-input]:border-0 [&_.searchbar-input]:border-b [&_.searchbar-input]:border-earth-200 [&_.searchbar-input]:bg-transparent [&_.searchbar-input]:text-sm [&_.searchbar-panel]:rounded-xl"
              onSearch={() => setIsMobileMenuOpen(false)}
              placeholder="Search listings..."
            />
            {[
              { to: '/products', label: 'Browse listings' },
              { to: '/categories', label: 'Categories' },
              ...(isAuthenticated ? [
                { to: '/profile', label: 'My profile' },
                { to: '/messages', label: 'Messages' },
                { to: '/saved', label: 'Saved items' },
                { to: '/notifications', label: 'Notifications' },
                { to: '/settings', label: 'Settings' },
                ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin dashboard' }] : []),
                { to: '/orders', label: 'My orders' },
              ] : []),
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="block py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-earth-700 transition-colors hover:text-earth-900 border-b border-earth-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            {isAuthenticated ? (
              <div className="pt-3 flex flex-col gap-2">
                {(user?.role === 'seller' || user?.role === 'admin') && (
                  <Link
                    to="/sell"
                    className="block bg-earth-900 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    + Sell something
                  </Link>
                )}
                <button
                  className="block w-full py-2.5 text-left text-xs font-bold uppercase tracking-[0.18em] text-red-600"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-3 flex flex-col gap-2">
                <Link
                  to="/login"
                  className="block border border-earth-200 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-earth-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="block bg-earth-900 py-3 text-center text-xs font-black uppercase tracking-[0.18em] text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
