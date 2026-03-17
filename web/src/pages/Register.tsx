import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
    email: z.string().email('Please enter a valid email'),
    phone: z.string().min(10, 'Please enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    role: z.enum(['buyer', 'seller']),
    studentId: z.string().optional(),
    location: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

type Step = 1 | 2 | 3;

const STEP_LABELS: Record<Step, string> = {
  1: 'Role',
  2: 'Details',
  3: 'Password',
};

const RegisterPage: React.FC = () => {
  const { register: registerUser, googleLogin } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<Step>(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'buyer' },
  });

  const selectedRole = watch('role');

  const goNext = async () => {
    let fields: (keyof RegisterFormData)[] = [];
    if (step === 1) fields = ['role'];
    if (step === 2) fields = ['name', 'email', 'phone'];
    const ok = await trigger(fields);
    if (ok) setStep((s) => (s + 1) as Step);
  };

  const onSubmit = async (data: RegisterFormData) => {
    const ok = await trigger(['password', 'confirmPassword']);
    if (!ok) return;
    setIsSubmitting(true);
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      setIsSubmitting(true);
      try {
        await googleLogin(credentialResponse.credential, selectedRole);
        navigate('/');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Google registration failed');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col bg-white">

      {/* ── Progress bar (fixed height, never scrolls) ── */}
      <div className="border-b border-earth-100 bg-white">
        <div className="mx-auto flex max-w-md items-center gap-0 px-6 py-4">
          {([1, 2, 3] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center text-[10px] font-black transition-colors ${
                    step > s
                      ? 'bg-earth-900 text-white'
                      : step === s
                      ? 'bg-earth-900 text-white'
                      : 'border border-earth-200 text-earth-300'
                  }`}
                >
                  {step > s ? <Check className="h-3 w-3" /> : s}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                    step === s ? 'text-earth-900' : 'text-earth-300'
                  }`}
                >
                  {STEP_LABELS[s]}
                </span>
              </div>
              {i < 2 && <div className="mx-3 flex-1 border-t border-earth-100" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Form area — fills remaining height, centered ── */}
      <div className="flex flex-1 flex-col justify-center px-6 py-8">
        <div className="mx-auto w-full max-w-md">

          {/* Step heading */}
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-earth-400">
            Step {step} of 3
          </p>
          <h1 className="mt-3 text-4xl font-black leading-[0.92] tracking-[-0.04em] text-earth-900">
            {step === 1 && <>I want to<br />…</>}
            {step === 2 && <>Who<br />are you?</>}
            {step === 3 && <>Secure<br />your account.</>}
          </h1>

          <form onSubmit={handleSubmit(onSubmit)}>

            {/* ── STEP 1: Role ── */}
            {step === 1 && (
              <div className="mt-10">
                <div className="grid grid-cols-2 gap-3 mb-10">
                  <button
                    type="button"
                    onClick={() => setValue('role', 'buyer')}
                    className={`py-8 text-sm font-black uppercase tracking-[0.14em] transition-all ${
                      selectedRole === 'buyer'
                        ? 'bg-earth-900 text-white'
                        : 'border border-earth-200 text-earth-500 hover:border-earth-500 hover:text-earth-900'
                    }`}
                  >
                    Buy
                    <span className={`block text-[10px] font-medium normal-case tracking-normal mt-1 ${selectedRole === 'buyer' ? 'text-white/60' : 'text-earth-400'}`}>
                      Browse &amp; purchase
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('role', 'seller')}
                    className={`py-8 text-sm font-black uppercase tracking-[0.14em] transition-all ${
                      selectedRole === 'seller'
                        ? 'bg-earth-900 text-white'
                        : 'border border-earth-200 text-earth-500 hover:border-earth-500 hover:text-earth-900'
                    }`}
                  >
                    Sell
                    <span className={`block text-[10px] font-medium normal-case tracking-normal mt-1 ${selectedRole === 'seller' ? 'text-white/60' : 'text-earth-400'}`}>
                      List your items
                    </span>
                  </button>
                </div>
                <input type="hidden" {...register('role')} />
                <button
                  type="button"
                  onClick={goNext}
                  className="group flex w-full items-center justify-between bg-earth-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-earth-700"
                >
                  <span>Continue with Email</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <div className="mt-8 flex items-center gap-4">
                  <div className="flex-1 h-px bg-earth-200" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-earth-400">Or continue with</span>
                  <div className="flex-1 h-px bg-earth-200" />
                </div>

                <div className="mt-6 flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error('Google Registration failed')}
                    useOneTap={false}
                    shape="rectangular"
                    theme="outline"
                    size="large"
                    text="continue_with"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: Name / Email / Phone ── */}
            {step === 2 && (
              <div className="mt-8">
                {/* Name */}
                <div className="border-b border-earth-100 py-5">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-earth-400 mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="Kwame Asante"
                    autoComplete="name"
                    autoFocus
                    className="w-full bg-transparent text-base text-earth-900 placeholder:text-earth-300 focus:outline-none"
                    {...register('name')}
                  />
                  {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="border-b border-earth-100 py-5">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-earth-400 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full bg-transparent text-base text-earth-900 placeholder:text-earth-300 focus:outline-none"
                    {...register('email')}
                  />
                  {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
                </div>

                {/* Phone */}
                <div className="border-b border-earth-100 py-5">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-earth-400 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="0XX XXX XXXX"
                    autoComplete="tel"
                    className="w-full bg-transparent text-base text-earth-900 placeholder:text-earth-300 focus:outline-none"
                    {...register('phone')}
                  />
                  {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone.message}</p>}
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-4 border border-earth-200 text-xs font-bold uppercase tracking-[0.18em] text-earth-500 hover:border-earth-900 hover:text-earth-900 transition-colors"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="group flex flex-1 items-center justify-between bg-earth-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-earth-700"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Password ── */}
            {step === 3 && (
              <div className="mt-8">
                {/* Password */}
                <div className="border-b border-earth-100 py-5">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-earth-400 mb-2">
                    Password
                  </label>
                  <div className="flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      autoFocus
                      className="flex-1 bg-transparent text-base text-earth-900 placeholder:text-earth-300 focus:outline-none"
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="ml-3 text-earth-400 hover:text-earth-900"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
                </div>

                {/* Confirm */}
                <div className="border-b border-earth-100 py-5">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.25em] text-earth-400 mb-2">
                    Confirm password
                  </label>
                  <div className="flex items-center">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      className="flex-1 bg-transparent text-base text-earth-900 placeholder:text-earth-300 focus:outline-none"
                      {...register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="ml-3 text-earth-400 hover:text-earth-900"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-5 py-4 border border-earth-200 text-xs font-bold uppercase tracking-[0.18em] text-earth-500 hover:border-earth-900 hover:text-earth-900 transition-colors"
                  >
                    ←
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group flex flex-1 items-center justify-between bg-earth-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-earth-700 disabled:opacity-40"
                  >
                    <span>{isSubmitting ? 'Creating...' : 'Create account'}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}

          </form>

          <p className="mt-8 border-t border-earth-100 pt-5 text-sm text-earth-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-earth-900 hover:underline">
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
