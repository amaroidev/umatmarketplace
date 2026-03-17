import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  ChevronRight,
  AlertTriangle,
  Check,
  Lock,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import notificationService from '../services/notification.service';
import toast from 'react-hot-toast';

type Tab = 'notifications' | 'privacy' | 'account';

const labelBase = 'text-[9px] font-bold uppercase tracking-[0.22em] text-earth-400';
const descBase = 'text-xs text-earth-500 mt-0.5';

interface NotifPrefs {
  orderUpdates: boolean;
  messages: boolean;
  reviews: boolean;
  promotions: boolean;
  systemAlerts: boolean;
}

interface PrivacyPrefs {
  showPhone: boolean;
  showLocation: boolean;
  allowMessages: boolean;
  showOnlineStatus: boolean;
}

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('notifications');

  /* ── Notification prefs ── */
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    orderUpdates: true,
    messages: true,
    reviews: true,
    promotions: false,
    systemAlerts: true,
  });
  const [savingNotif, setSavingNotif] = useState(false);
  
  const [pushEnabled, setPushEnabled] = useState(false);
  const [togglingPush, setTogglingPush] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  useEffect(() => {
    // Check if currently subscribed
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setPushEnabled(!!sub);
        });
      });
    }
  }, []);

  const handleTogglePush = async () => {
    setTogglingPush(true);
    try {
      if (pushEnabled) {
        await notificationService.unsubscribeFromPush();
        setPushEnabled(false);
        toast.success('Push notifications disabled');
      } else {
        // Request permission if not granted yet
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await notificationService.subscribeToPush();
          setPushEnabled(true);
          toast.success('Push notifications enabled');
        } else {
          toast.error('Permission denied for push notifications');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle push notifications');
    } finally {
      setTogglingPush(false);
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      await notificationService.sendTestPush();
      toast.success('Test push sent');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send test push');
    } finally {
      setTestingPush(false);
    }
  };

  /* ── Privacy prefs ── */
  const [privacyPrefs, setPrivacyPrefs] = useState<PrivacyPrefs>({
    showPhone: false,
    showLocation: true,
    allowMessages: true,
    showOnlineStatus: true,
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  /* ── Account deletion ── */
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const saveNotifPrefs = async () => {
    setSavingNotif(true);
    try {
      await api.put('/auth/settings/notifications', notifPrefs);
      toast.success('Notification preferences saved');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSavingNotif(false);
    }
  };

  const savePrivacyPrefs = async () => {
    setSavingPrivacy(true);
    try {
      await api.put('/auth/settings/privacy', privacyPrefs);
      toast.success('Privacy settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      toast.error('Enter your password');
      return;
    }
    setDeleting(true);
    try {
      await api.delete('/auth/account', { data: { password: deletePassword } });
      await logout();
      navigate('/');
      toast.success('Account deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Eye className="h-4 w-4" /> },
    { id: 'account', label: 'Account', icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white">

      {/* ── Hero ── */}
      <div className="bg-[#0a0a0a] px-6 pt-14 pb-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/20 mb-4">
            Account / Settings
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Settings</h1>
          <p className="mt-2 text-sm text-white/35">Manage your preferences, privacy, and account.</p>

          {/* Tabs at bottom of hero */}
          <div className="flex border-t border-white/[0.07] mt-10">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.22em] border-t-2 -mt-px transition-colors ${
                  activeTab === t.id
                    ? 'border-white text-white'
                    : 'border-transparent text-white/30 hover:text-white/60'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">

        {/* ══ NOTIFICATIONS ══ */}
        {activeTab === 'notifications' && (
          <div>
            <div className="mb-10">
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-earth-400">Preferences</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-earth-900">Notification settings</h2>
              <div className="mt-3 h-px bg-earth-200" />
            </div>

            <p className="text-sm text-earth-500 mb-8 max-w-lg">
              Choose which notifications you receive. These apply to in-app notifications and, when enabled, browser push notifications.
            </p>

            <div className="divide-y divide-earth-100 border border-earth-200 mb-10">
              {(
                [
                  { key: 'orderUpdates', label: 'Order updates', desc: 'Status changes, confirmations, and shipping updates for your orders.' },
                  { key: 'messages', label: 'New messages', desc: 'When someone sends you a chat message.' },
                  { key: 'reviews', label: 'Reviews & replies', desc: 'When someone leaves a review on your listing or replies to yours.' },
                  { key: 'promotions', label: 'Promotions', desc: 'Featured listing opportunities and marketplace announcements.' },
                  { key: 'systemAlerts', label: 'System alerts', desc: 'Important account security events and policy updates.' },
                ] as { key: keyof NotifPrefs; label: string; desc: string }[]
              ).map((item) => (
                <div key={item.key} className="flex items-center justify-between px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold text-earth-900">{item.label}</p>
                    <p className={descBase}>{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    className={`relative h-6 w-11 flex-shrink-0 transition-colors ${
                      notifPrefs[item.key] ? 'bg-earth-900' : 'bg-earth-200'
                    }`}
                    role="switch"
                    aria-checked={notifPrefs[item.key]}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 bg-white transition-transform ${
                        notifPrefs[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end mb-12">
              <button
                onClick={saveNotifPrefs}
                disabled={savingNotif}
                className="flex items-center gap-2 bg-earth-900 text-white px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-earth-700 disabled:opacity-40 transition-colors"
              >
                {savingNotif ? (
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save preferences
              </button>
            </div>

            {/* Browser Push Notifications Section */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-earth-400">This Device</p>
              <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-earth-900">Push Notifications</h3>
              <div className="mt-3 h-px bg-earth-200 mb-6" />

              <div className="border border-earth-200 px-6 py-5 flex items-center justify-between bg-earth-50">
                <div className="flex items-start gap-4">
                  <Smartphone className="h-5 w-5 text-earth-900 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-earth-900">Enable browser notifications</p>
                    <p className="text-xs text-earth-500 mt-0.5 max-w-sm">
                      Receive instant alerts even when you're not actively using the app. This applies only to the current browser.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleTogglePush}
                  disabled={togglingPush}
                  className={`relative h-6 w-11 flex-shrink-0 transition-colors disabled:opacity-50 ${
                    pushEnabled ? 'bg-earth-900' : 'bg-earth-200'
                  }`}
                  role="switch"
                  aria-checked={pushEnabled}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 bg-white transition-transform ${
                      pushEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleTestPush}
                  disabled={!pushEnabled || testingPush}
                  className="flex items-center gap-2 border border-earth-300 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-earth-700 hover:bg-earth-100 disabled:opacity-40 transition-colors"
                >
                  {testingPush ? (
                    <span className="h-3.5 w-3.5 border-2 border-earth-300 border-t-earth-900 rounded-full animate-spin" />
                  ) : (
                    <Bell className="h-3.5 w-3.5" />
                  )}
                  Send test push
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ PRIVACY ══ */}
        {activeTab === 'privacy' && (
          <div>
            <div className="mb-10">
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-earth-400">Data & visibility</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-earth-900">Privacy settings</h2>
              <div className="mt-3 h-px bg-earth-200" />
            </div>

            <p className="text-sm text-earth-500 mb-8 max-w-lg">
              Control what other students can see about you and how you can be reached.
            </p>

            <div className="divide-y divide-earth-100 border border-earth-200 mb-10">
              {(
                [
                  { key: 'showPhone', label: 'Show phone number', desc: 'Your phone number will be visible on your public profile.' },
                  { key: 'showLocation', label: 'Show location', desc: 'Your campus location will appear on your listings and profile.' },
                  { key: 'allowMessages', label: 'Allow messages', desc: 'Other users can initiate a conversation with you.' },
                  { key: 'showOnlineStatus', label: 'Show online status', desc: 'Others can see when you were last active in chats.' },
                ] as { key: keyof PrivacyPrefs; label: string; desc: string }[]
              ).map((item) => (
                <div key={item.key} className="flex items-center justify-between px-6 py-5">
                  <div>
                    <p className="text-sm font-semibold text-earth-900">{item.label}</p>
                    <p className={descBase}>{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setPrivacyPrefs((p) => ({ ...p, [item.key]: !p[item.key] }))}
                    className={`relative h-6 w-11 flex-shrink-0 transition-colors ${
                      privacyPrefs[item.key] ? 'bg-earth-900' : 'bg-earth-200'
                    }`}
                    role="switch"
                    aria-checked={privacyPrefs[item.key]}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 bg-white transition-transform ${
                        privacyPrefs[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            {/* Data download notice */}
            <div className="border border-earth-200 p-6 mb-8">
              <div className="flex items-start gap-4">
                <Lock className="h-5 w-5 text-earth-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-earth-900 mb-1">Your data is yours</p>
                  <p className="text-xs text-earth-500 leading-relaxed">
                    We never sell your personal data to third parties. All data is stored securely on our servers and used only to operate the marketplace.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={savePrivacyPrefs}
                disabled={savingPrivacy}
                className="flex items-center gap-2 bg-earth-900 text-white px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-earth-700 disabled:opacity-40 transition-colors"
              >
                {savingPrivacy ? (
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Save settings
              </button>
            </div>
          </div>
        )}

        {/* ══ ACCOUNT ══ */}
        {activeTab === 'account' && (
          <div>
            <div className="mb-10">
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-earth-400">Danger zone</p>
              <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-earth-900">Account management</h2>
              <div className="mt-3 h-px bg-earth-200" />
            </div>

            {/* Account summary */}
            <div className="border border-earth-200 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className={labelBase}>Signed in as</p>
                  <p className="mt-1 text-sm font-semibold text-earth-900">{user?.name}</p>
                  <p className="text-xs text-earth-500">{user?.email}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400 border border-earth-200 px-2.5 py-1">
                  {user?.role}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mb-12">
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center justify-between border border-earth-200 px-6 py-4 text-sm text-earth-700 hover:border-earth-400 transition-colors"
              >
                <span>Edit profile information</span>
                <ChevronRight className="h-4 w-4 text-earth-400" />
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="w-full flex items-center justify-between border border-earth-200 px-6 py-4 text-sm text-earth-700 hover:border-earth-400 transition-colors"
              >
                <span>Change password</span>
                <ChevronRight className="h-4 w-4 text-earth-400" />
              </button>
            </div>

            {/* Delete account */}
            <div className="border border-red-200 bg-red-50">
              <div className="px-6 py-5 border-b border-red-200">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-800">Delete account</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      This permanently removes your account, all your listings, orders, and messages. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <div className="px-6 py-5">
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 border border-red-300 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete my account
                  </button>
                </div>
              ) : (
                <div className="px-6 py-5 space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-700">
                    Type <span className="font-black">DELETE</span> to confirm
                  </p>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="Type DELETE"
                    className="w-full max-w-xs bg-transparent border-0 border-b border-red-300 focus:border-red-600 focus:ring-0 text-sm py-2 px-0 outline-none text-earth-900 placeholder:text-red-300"
                  />
                  <div className="relative flex items-center max-w-xs">
                    <input
                      type={showDeletePassword ? 'text' : 'password'}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Your password"
                      className="flex-1 pr-10 bg-transparent border-0 border-b border-red-300 focus:border-red-600 focus:ring-0 text-sm py-2 px-0 outline-none text-earth-900 placeholder:text-red-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword((p) => !p)}
                      className="absolute right-0 text-red-300 hover:text-red-600 transition-colors"
                    >
                      {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting || deleteInput !== 'DELETE' || !deletePassword}
                      className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] hover:bg-red-700 disabled:opacity-40 transition-colors"
                    >
                      {deleting ? (
                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Confirm delete
                    </button>
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); setDeletePassword(''); }}
                      className="text-[10px] font-bold uppercase tracking-[0.16em] text-earth-400 hover:text-earth-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsPage;
