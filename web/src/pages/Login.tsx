import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { supabase } from '../services/supabase';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login({ email: data.email.toLowerCase(), password: data.password });
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      setIsSubmitting(true);
      try {
        const { data: authData, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credentialResponse.credential,
        });

        const accessToken = authData.session?.access_token;
        if (error || !accessToken) {
          throw new Error(error?.message || 'Supabase Google session failed.');
        }

        const result = await googleLogin(accessToken, undefined);
        if (result.isNewUser) {
          toast.error('No account found. Please sign up with Google and choose a role.');
          setTimeout(() => navigate('/register'), 700);
          setIsSubmitting(false);
          return;
        }
        if (result.needsProfileCompletion) {
          toast('Profile incomplete. Continue, then update phone/store details in Profile.');
          navigate(from, { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || '';
        if (message.toLowerCase().includes('sign up first')) {
          toast.error('No account found. Please sign up with Google and choose a role.');
          setTimeout(() => navigate('/register'), 700);
        } else {
          toast.error(message || 'Google sign-in failed. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] overflow-hidden">

      {/* ── LEFT: black typographic panel ── */}
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-[#0a0a0a] p-14 lg:flex">
        {/* background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right,#fff 1px,transparent 1px),linear-gradient(to bottom,#fff 1px,transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Top: eyebrow */}
        <span className="relative z-10 text-[10px] font-bold uppercase tracking-[0.3em] text-white/25">
          CampusMarketplace
        </span>

        {/* Center: giant headline */}
        <div className="relative z-10">
          <h1 className="text-[clamp(3.5rem,5.5vw,6rem)] font-black leading-[0.88] tracking-[-0.05em] text-white">
            Good deals<br />
            don't wait.
          </h1>
          <p className="mt-6 max-w-xs text-sm leading-7 text-white/40">
            Sign in to access saved items, ongoing chats, and listings you've been watching.
          </p>
        </div>

        {/* Bottom: two floating product-style tiles */}
        <div className="relative z-10 flex gap-3">
          <div className="flex-1 rounded-lg border border-white/8 bg-white/4 p-4 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/25">Saved items</p>
            <p className="mt-1.5 text-sm font-semibold text-white/70">Pick up where you left off</p>
          </div>
          <div className="flex-1 rounded-lg border border-white/8 bg-white/4 p-4 backdrop-blur-sm">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/25">Messages</p>
            <p className="mt-1.5 text-sm font-semibold text-white/70">Jump back into ongoing deals</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT: bare white form ── */}
      <div className="flex flex-1 flex-col justify-center px-8 py-14 sm:px-12 lg:px-16 xl:px-24">
        <div className="mx-auto w-full max-w-sm">

          {/* Mobile only: back link */}
          <Link
            to="/"
            className="mb-8 block text-[10px] font-bold uppercase tracking-[0.25em] text-earth-400 hover:text-earth-900 lg:hidden"
          >
            ← Home
          </Link>

          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-earth-400">Sign in</p>
          <h2 className="mt-3 text-4xl font-black leading-[0.95] tracking-[-0.04em] text-earth-900">
            Welcome<br />back.
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-0">
            {/* Email field */}
            <div className="border-b border-earth-200 pb-6">
              <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-earth-400 mb-3">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-transparent text-base text-earth-900 placeholder:text-earth-300 focus:outline-none"
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-2 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div className="border-b border-earth-200 py-6">
              <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-earth-400 mb-3">
                Password
              </label>
              <div className="flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your password"
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-base text-earth-900 placeholder:text-earth-300 focus:outline-none"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="ml-3 text-earth-400 transition-colors hover:text-earth-900"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group flex w-full items-center justify-between border border-earth-900 bg-earth-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-white hover:text-earth-900 disabled:opacity-40"
              >
                <span>{isSubmitting ? 'Signing in...' : 'Continue'}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-earth-200" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-earth-400">Or</span>
            <div className="flex-1 h-px bg-earth-200" />
          </div>

          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google sign-in could not start. Check browser/origin settings and try again.')}
              useOneTap={false}
              shape="rectangular"
              theme="outline"
              size="large"
            />
          </div>

          <p className="mt-8 border-t border-earth-100 pt-6 text-sm text-earth-400">
            No account?{' '}
            <Link to="/register" className="font-semibold text-earth-900 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
