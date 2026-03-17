import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  ShieldOff,
  MapPin,
  Phone,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/* ── Schemas ── */
const profileSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(50, 'Max 50 characters'),
  phone: z.string().min(10, 'Enter a valid phone number'),
  studentId: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500, 'Max 500 characters').optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(6, 'At least 6 characters'),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type Tab = 'profile' | 'password';

/* ── Shared field styles ── */
const fieldBase =
  'w-full bg-transparent border-0 border-b border-earth-200 focus:border-earth-900 focus:ring-0 text-earth-900 text-sm py-3 px-0 outline-none transition-colors placeholder:text-earth-300';
const fieldDisabled =
  'w-full bg-transparent border-0 border-b border-earth-100 text-earth-300 text-sm py-3 px-0 outline-none cursor-not-allowed';
const labelBase = 'block text-[9px] font-bold uppercase tracking-[0.22em] text-earth-400 mb-1';
const errorBase = 'mt-1.5 text-[11px] text-red-500';

/* ── Initials avatar ── */
function Initials({ name, size = 'lg' }: { name?: string; size?: 'sm' | 'lg' }) {
  const letters = (name || '?')
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  const dim = size === 'lg' ? 'h-24 w-24 text-3xl' : 'h-10 w-10 text-sm';
  return (
    <div className={`${dim} flex items-center justify-center bg-earth-800 font-black text-white tracking-tight flex-shrink-0`}>
      {letters}
    </div>
  );
}

const ProfilePage: React.FC = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register: rp,
    handleSubmit: hsp,
    formState: { errors: pe },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: user?.phone || '',
      studentId: user?.studentId || '',
      location: user?.location || '',
      bio: user?.bio || '',
    },
  });

  const {
    register: rpw,
    handleSubmit: hspw,
    reset: resetPw,
    formState: { errors: pwe },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });

  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdating(true);
    try {
      await updateProfile(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const onChangePassword = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      resetPw();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const joinYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : null;

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white">

      {/* ══════════════════════════════════════
          HERO — full-width dark banner
      ══════════════════════════════════════ */}
      <div className="bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-14 lg:px-8">

          {/* eyebrow */}
          <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/20 mb-10">
            Account &nbsp;/&nbsp; {user?.name}
          </p>

          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">

            {/* Avatar + identity */}
            <div className="flex items-end gap-6">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-24 w-24 object-cover flex-shrink-0"
                />
              ) : (
                <Initials name={user?.name} size="lg" />
              )}

              <div className="pb-0.5">
                <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-black uppercase tracking-[-0.03em] leading-none text-white">
                  {user?.name}
                </h1>
                <p className="mt-2 text-sm text-white/35 tracking-wide">{user?.email}</p>

                {/* meta pills */}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 border border-white/10 px-2.5 py-1">
                    {user?.role}
                  </span>
                  {user?.isVerified ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/25">
                      <ShieldOff className="h-3 w-3" />
                      Unverified
                    </span>
                  )}
                  {user?.location && (
                    <span className="flex items-center gap-1.5 text-[10px] text-white/30 tracking-wide">
                      <MapPin className="h-3 w-3" />
                      {user.location}
                    </span>
                  )}
                  {joinYear && (
                    <span className="flex items-center gap-1.5 text-[10px] text-white/25 tracking-wide">
                      <Calendar className="h-3 w-3" />
                      Member since {joinYear}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio excerpt (desktop) */}
            {user?.bio && (
              <p className="hidden lg:block max-w-xs text-sm text-white/30 italic leading-relaxed text-right">
                "{user.bio}"
              </p>
            )}
          </div>
        </div>

        {/* tab strip — sits at bottom of hero */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex border-t border-white/[0.07]">
            {(['profile', 'password'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] border-t-2 -mt-px transition-colors ${
                  activeTab === t
                    ? 'border-white text-white'
                    : 'border-transparent text-white/30 hover:text-white/60'
                }`}
              >
                {t === 'profile' ? 'Edit Profile' : 'Password'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          BODY — sidebar + form split
      ══════════════════════════════════════ */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-14">
        <div className="flex flex-col gap-12 lg:flex-row lg:gap-20">

          {/* ── Left sidebar — identity summary ── */}
          <aside className="lg:w-56 flex-shrink-0 space-y-8">

            {/* compact avatar */}
            <div className="flex items-center gap-3">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-10 w-10 object-cover" />
              ) : (
                <Initials name={user?.name} size="sm" />
              )}
              <div>
                <p className="text-xs font-bold text-earth-900 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-earth-400 capitalize">{user?.role}</p>
              </div>
            </div>

            <div className="h-px bg-earth-100" />

            {/* quick-info list */}
            <ul className="space-y-4">
              <li>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-300 mb-0.5">Email</p>
                <p className="text-xs text-earth-600 break-all">{user?.email}</p>
              </li>
              {user?.phone && (
                <li>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-300 mb-0.5">Phone</p>
                  <p className="text-xs text-earth-600 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-earth-300" />
                    {user.phone}
                  </p>
                </li>
              )}
              {user?.studentId && (
                <li>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-300 mb-0.5">Student ID</p>
                  <p className="text-xs text-earth-600">{user.studentId}</p>
                </li>
              )}
              {user?.location && (
                <li>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-300 mb-0.5">Location</p>
                  <p className="text-xs text-earth-600 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-earth-300" />
                    {user.location}
                  </p>
                </li>
              )}
              {joinYear && (
                <li>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-earth-300 mb-0.5">Member since</p>
                  <p className="text-xs text-earth-600">{joinYear}</p>
                </li>
              )}
            </ul>

            {user?.bio && (
              <>
                <div className="h-px bg-earth-100" />
                <p className="text-xs text-earth-500 italic leading-relaxed">"{user.bio}"</p>
              </>
            )}
          </aside>

          {/* ── Right: form panel ── */}
          <div className="flex-1 min-w-0">

            {/* ══ Profile form ══ */}
            {activeTab === 'profile' && (
              <form onSubmit={hsp(onUpdateProfile)}>

                {/* section heading */}
                <div className="mb-10">
                  <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-earth-400">Edit profile</p>
                  <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-earth-900">
                    Your information
                  </h2>
                  <div className="mt-3 h-px bg-earth-200" />
                </div>

                {/* two-col grid: name + phone */}
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 mb-10">
                  <div>
                    <label className={labelBase}>Full name</label>
                    <input type="text" className={fieldBase} {...rp('name')} />
                    {pe.name && <p className={errorBase}>{pe.name.message}</p>}
                  </div>
                  <div>
                    <label className={labelBase}>Phone</label>
                    <input type="tel" className={fieldBase} {...rp('phone')} />
                    {pe.phone && <p className={errorBase}>{pe.phone.message}</p>}
                  </div>
                </div>

                {/* email — read only */}
                <div className="mb-10">
                  <label className="block text-[9px] font-bold uppercase tracking-[0.22em] text-earth-300 mb-1">
                    Email&ensp;<span className="normal-case tracking-normal font-normal opacity-60">— cannot be changed</span>
                  </label>
                  <input type="email" value={user?.email || ''} disabled className={fieldDisabled} />
                </div>

                {/* two-col: student ID + location */}
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 mb-10">
                  <div>
                    <label className={labelBase}>Student ID</label>
                    <input type="text" placeholder="STU-XXXX" className={fieldBase} {...rp('studentId')} />
                  </div>
                  <div>
                    <label className={labelBase}>Location</label>
                    <input type="text" placeholder="e.g. Jubilee Hostel" className={fieldBase} {...rp('location')} />
                  </div>
                </div>

                {/* bio — full width */}
                <div className="mb-12">
                  <label className={labelBase}>
                    Bio&ensp;<span className="normal-case tracking-normal font-normal opacity-60">— optional, max 500 chars</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell others a bit about yourself…"
                    className={`${fieldBase} resize-none`}
                    maxLength={500}
                    {...rp('bio')}
                  />
                  {pe.bio && <p className={errorBase}>{pe.bio.message}</p>}
                </div>

                {/* submit */}
                <div className="flex items-center justify-between border-t border-earth-100 pt-8">
                  <p className="text-[10px] text-earth-300 uppercase tracking-[0.15em]">
                    Changes are saved immediately
                  </p>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="flex items-center gap-2.5 bg-earth-900 text-white px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-earth-700 disabled:opacity-40 transition-colors"
                  >
                    {isUpdating ? (
                      <>
                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Save changes
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

            {/* ══ Password form ══ */}
            {activeTab === 'password' && (
              <form onSubmit={hspw(onChangePassword)}>

                {/* section heading */}
                <div className="mb-10">
                  <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-earth-400">Security</p>
                  <h2 className="mt-1 text-2xl font-black uppercase tracking-tight text-earth-900">
                    Change password
                  </h2>
                  <div className="mt-3 h-px bg-earth-200" />
                </div>

                {/* hint */}
                <p className="mb-10 text-sm text-earth-500 leading-relaxed max-w-md">
                  Choose a strong password of at least 6 characters. You'll remain signed in on this device after changing it.
                </p>

                {/* fields — stacked with generous spacing */}
                <div className="space-y-10 max-w-md">

                  <div>
                    <label className={labelBase}>Current password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showCurrent ? 'text' : 'password'}
                        placeholder="Enter current password"
                        className={`flex-1 pr-10 ${fieldBase}`}
                        {...rpw('currentPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((p) => !p)}
                        className="absolute right-0 text-earth-300 hover:text-earth-700 transition-colors"
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwe.currentPassword && <p className={errorBase}>{pwe.currentPassword.message}</p>}
                  </div>

                  <div className="h-px bg-earth-100" />

                  <div>
                    <label className={labelBase}>New password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showNew ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        className={`flex-1 pr-10 ${fieldBase}`}
                        {...rpw('newPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((p) => !p)}
                        className="absolute right-0 text-earth-300 hover:text-earth-700 transition-colors"
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwe.newPassword && <p className={errorBase}>{pwe.newPassword.message}</p>}
                  </div>

                  <div>
                    <label className={labelBase}>Confirm new password</label>
                    <div className="relative flex items-center">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        className={`flex-1 pr-10 ${fieldBase}`}
                        {...rpw('confirmNewPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((p) => !p)}
                        className="absolute right-0 text-earth-300 hover:text-earth-700 transition-colors"
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {pwe.confirmNewPassword && <p className={errorBase}>{pwe.confirmNewPassword.message}</p>}
                  </div>

                </div>

                {/* submit */}
                <div className="flex items-center justify-between border-t border-earth-100 pt-8 mt-12 max-w-md">
                  <p className="text-[10px] text-earth-300 uppercase tracking-[0.15em]">
                    Irreversible action
                  </p>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="flex items-center gap-2.5 bg-earth-900 text-white px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-earth-700 disabled:opacity-40 transition-colors"
                  >
                    {isChangingPassword ? (
                      <>
                        <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-3.5 w-3.5" />
                        Update password
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
