import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Package,
  Loader2,
} from 'lucide-react';
import paymentService from '../services/payment.service';
import { OrderPopulated, ORDER_STATUS_LABELS } from '../types';

const PaymentVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [order, setOrder] = useState<OrderPopulated | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) {
      setVerifying(false);
      setError('No payment reference found');
      return;
    }

    const verify = async () => {
      setVerifying(true);
      try {
        const res = await paymentService.verifyPayment(reference);
        if (res.success && res.data.verified) {
          setVerified(true);
          setOrder(res.data.order);
        } else {
          setVerified(false);
          setError('Payment could not be verified. Please try again or contact support.');
        }
      } catch (err: any) {
        setVerified(false);
        setError(err.response?.data?.message || 'Payment verification failed');
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [reference]);

  if (verifying) {
    return (
      <div className="page-container max-w-lg mx-auto text-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-earth-400 mx-auto mb-6" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-2">Please wait</p>
        <h2 className="text-2xl font-black text-earth-900 uppercase tracking-tight mb-2">Verifying Payment</h2>
        <p className="text-sm text-earth-500">Confirming your payment with our processor...</p>
      </div>
    );
  }

  if (error && !verified) {
    return (
      <div className="page-container max-w-lg mx-auto text-center py-24">
        <XCircle className="h-14 w-14 text-earth-300 mx-auto mb-6" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-2">Payment failed</p>
        <h2 className="text-2xl font-black text-earth-900 uppercase tracking-tight mb-3">Something went wrong</h2>
        <p className="text-sm text-earth-500 mb-8 max-w-sm mx-auto">{error}</p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/orders"
            className="px-6 py-3 border border-earth-300 text-xs font-bold uppercase tracking-[0.15em] text-earth-700 hover:border-earth-900 hover:text-earth-900 transition-colors"
          >
            View Orders
          </Link>
          <Link
            to="/products"
            className="px-6 py-3 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.15em] hover:bg-earth-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container max-w-lg mx-auto py-16">
      {/* Success header */}
      <div className="text-center mb-10">
        <CheckCircle className="h-14 w-14 text-earth-400 mx-auto mb-6" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-2">Order confirmed</p>
        <h2 className="text-3xl font-black text-earth-900 uppercase tracking-tight mb-3">
          Payment Successful
        </h2>
        <p className="text-sm text-earth-500">
          Your order has been placed and the seller has been notified.
        </p>
      </div>

      {/* Order details */}
      {order && (
        <div className="border border-earth-200 mb-8">
          <div className="px-5 py-3 border-b border-earth-200 bg-earth-50">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-500">Order Details</p>
          </div>
          <div className="px-5 py-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-earth-400">Order #</span>
              <span className="font-mono font-bold text-earth-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-earth-400">Status</span>
              <span className="px-2 py-0.5 bg-earth-100 text-earth-800 text-xs font-bold uppercase tracking-wide">
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
            </div>
            {order.items[0] && (
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-earth-400 flex-shrink-0">Item</span>
                <span className="font-medium text-earth-900 truncate text-right">
                  {order.items[0].title}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-earth-400">Delivery</span>
              <span className="font-medium text-earth-900 capitalize">{order.deliveryMethod}</span>
            </div>
            <div className="h-px bg-earth-100" />
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-earth-700">Total Paid</span>
              <span className="text-lg font-black text-earth-900">
                GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* What's next */}
      <div className="border border-earth-200 mb-10">
        <div className="px-5 py-3 border-b border-earth-200 bg-earth-50">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            What happens next
          </p>
        </div>
        <ol className="px-5 py-4 space-y-3">
          {[
            'The seller will confirm your order',
            `You'll be notified when it's ready for ${order?.deliveryMethod === 'delivery' ? 'delivery' : 'pickup'}`,
            'Meet up or receive your item and mark as completed',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-earth-700">
              <span className="flex-shrink-0 w-5 h-5 border border-earth-300 text-xs font-black text-earth-400 flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        {order && (
          <Link
            to={`/orders/${order._id}`}
            className="px-6 py-3 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.15em] hover:bg-earth-700 transition-colors flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            View Order
          </Link>
        )}
        <Link
          to="/orders"
          className="px-6 py-3 border border-earth-300 text-xs font-bold uppercase tracking-[0.15em] text-earth-700 hover:border-earth-900 hover:text-earth-900 transition-colors flex items-center gap-2"
        >
          My Orders
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default PaymentVerification;
