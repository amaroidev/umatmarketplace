import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/auth.service';
import toast from 'react-hot-toast';

const SellerOnboardingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [storeName, setStoreName] = useState(user?.storeName || '');
  const [brandName, setBrandName] = useState(user?.brandName || '');
  const [responseTimeMinutes, setResponseTimeMinutes] = useState<number>(user?.responseTimeMinutes || 15);
  const [payoutMethod, setPayoutMethod] = useState<'momo' | 'bank'>((user?.sellerOnboarding?.payoutMethod as any) || 'momo');
  const [payoutProvider, setPayoutProvider] = useState(user?.sellerOnboarding?.payoutProvider || 'MTN');
  const [payoutAccountName, setPayoutAccountName] = useState(user?.sellerOnboarding?.payoutAccountName || '');
  const [payoutAccountNumber, setPayoutAccountNumber] = useState(user?.sellerOnboarding?.payoutAccountNumber || '');
  const [identityDocumentUrl, setIdentityDocumentUrl] = useState(user?.sellerOnboarding?.identityDocumentUrl || '');

  const steps = useMemo(
    () => [
      !!(storeName.trim() || brandName.trim()),
      !!(payoutAccountName.trim() && payoutAccountNumber.trim()),
      !!identityDocumentUrl.trim(),
    ],
    [storeName, brandName, payoutAccountName, payoutAccountNumber, identityDocumentUrl]
  );

  const allDone = steps.every(Boolean);

  const submit = async () => {
    setSubmitting(true);
    try {
      await authService.updateSellerOnboarding({
        storeName,
        brandName,
        responseTimeMinutes,
        payoutMethod,
        payoutProvider,
        payoutAccountName,
        payoutAccountNumber,
        identityDocumentUrl,
        completed: allDone,
      });
      await refreshUser();
      toast.success(allDone ? 'Onboarding complete' : 'Onboarding saved');
      if (allDone) navigate('/sell');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container max-w-3xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">Seller setup</p>
      <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-earth-900">Onboarding wizard</h1>

      <div className="mt-6 space-y-3">
        {['Store branding', 'Payout setup', 'Identity check'].map((label, idx) => (
          <div key={label} className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-earth-600">
            {steps[idx] ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-earth-300" />}
            {label}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Store name" className="border border-earth-200 px-3 py-2 text-sm" />
        <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Brand name" className="border border-earth-200 px-3 py-2 text-sm" />
        <input value={responseTimeMinutes} onChange={(e) => setResponseTimeMinutes(Number(e.target.value || 15))} placeholder="Response time minutes" className="border border-earth-200 px-3 py-2 text-sm" />
        <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as any)} className="border border-earth-200 px-3 py-2 text-sm">
          <option value="momo">Mobile money</option>
          <option value="bank">Bank</option>
        </select>
        <input value={payoutProvider} onChange={(e) => setPayoutProvider(e.target.value)} placeholder="Provider (MTN/Bank name)" className="border border-earth-200 px-3 py-2 text-sm" />
        <input value={payoutAccountName} onChange={(e) => setPayoutAccountName(e.target.value)} placeholder="Account name" className="border border-earth-200 px-3 py-2 text-sm" />
        <input value={payoutAccountNumber} onChange={(e) => setPayoutAccountNumber(e.target.value)} placeholder="Account number" className="border border-earth-200 px-3 py-2 text-sm" />
        <input value={identityDocumentUrl} onChange={(e) => setIdentityDocumentUrl(e.target.value)} placeholder="Identity document URL" className="border border-earth-200 px-3 py-2 text-sm sm:col-span-2" />
      </div>

      <button
        onClick={submit}
        disabled={submitting}
        className="mt-8 inline-flex items-center gap-2 bg-earth-900 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white disabled:opacity-50"
      >
        {submitting ? 'Saving...' : allDone ? 'Finish and continue' : 'Save progress'}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export default SellerOnboardingPage;
