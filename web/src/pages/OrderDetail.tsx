import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Truck,
  User as UserIcon,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  CreditCard,
  MessageCircle,
  Star,
  Circle,
  Clock,
  DollarSign,
  ThumbsUp,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import orderService from '../services/order.service';
import chatService from '../services/chat.service';
import reviewService from '../services/review.service';
import api from '../services/api';
import { Button, LoadingSpinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import {
  OrderPopulated,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  OrderStatus,
  ReviewPopulated,
} from '../types';

interface TrackingStep {
  status: OrderStatus;
  label: string;
  desc: string;
  icon: React.ReactNode;
}

const TRACKING_STEPS: TrackingStep[] = [
  {
    status: 'pending',
    label: 'Order placed',
    desc: 'Your order has been received and is awaiting payment.',
    icon: <Package className="h-4 w-4" />,
  },
  {
    status: 'paid',
    label: 'Payment confirmed',
    desc: 'Payment has been verified. Waiting for seller to confirm.',
    icon: <DollarSign className="h-4 w-4" />,
  },
  {
    status: 'confirmed',
    label: 'Order confirmed',
    desc: 'The seller has confirmed your order and is preparing it.',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  {
    status: 'ready',
    label: 'Ready for pickup / dispatch',
    desc: 'Your item is packed and ready. Coordinate with the seller.',
    icon: <Truck className="h-4 w-4" />,
  },
  {
    status: 'completed',
    label: 'Completed',
    desc: 'Order successfully fulfilled.',
    icon: <ThumbsUp className="h-4 w-4" />,
  },
];

const statusOrder: OrderStatus[] = ['pending', 'paid', 'confirmed', 'ready', 'completed'];

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderPopulated | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [contacting, setContacting] = useState(false);
  const [orderReview, setOrderReview] = useState<ReviewPopulated | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Dispute state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('item_not_received');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await orderService.getOrder(id);
        if (res.success) setOrder(res.data.order);
      } catch (err: any) {
        if (err.response?.status === 404) navigate('/orders', { replace: true });
        toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !order || !user || order.status !== 'completed') return;
    reviewService.getOrderReview(id).then((res) => {
      if (res.success) setOrderReview(res.data.review);
    }).catch(() => {});
  }, [id, order, user]);

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      const res = await orderService.cancelOrder(id, cancelReason || undefined);
      if (res.success) {
        setOrder(res.data.order);
        toast.success('Order cancelled');
        setShowCancelModal(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleContactSeller = async () => {
    if (!order || !user) return;
    setContacting(true);
    try {
      const productId = typeof order.items[0]?.product === 'object'
        ? order.items[0].product._id
        : order.items[0]?.product;
      const res = await chatService.getOrCreateConversation(order.seller._id, productId);
      if (res.success) navigate(`/messages/${res.data.conversation._id}`);
    } catch {
      toast.error('Failed to start conversation');
    } finally {
      setContacting(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!id || !disputeDescription.trim()) { toast.error('Please describe the issue'); return; }
    setSubmittingDispute(true);
    try {
      const evidence = disputeEvidence
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      await api.post('/disputes', {
        orderId: id,
        reason: disputeReason,
        description: disputeDescription.trim(),
        evidence,
      });
      toast.success('Dispute raised. Our team will review it shortly.');
      setShowDisputeModal(false);
      setDisputeDescription('');
      setDisputeEvidence('');
      // Refresh order to reflect new disputed status
      const res = await orderService.getOrder(id);
      if (res.success) setOrder(res.data.order);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to raise dispute');
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleSubmitReview = async () => {    if (!id) return;
    if (!reviewComment.trim()) { toast.error('Please add a comment'); return; }
    setSubmittingReview(true);
    try {
      const res = await reviewService.createReview({ orderId: id, rating: reviewRating, comment: reviewComment.trim() });
      if (res.success && res.data.review) {
        setOrderReview(res.data.review);
        toast.success('Review submitted');
        setShowReviewModal(false);
        setReviewComment('');
        setReviewRating(5);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading order..." fullScreen />;

  if (!order) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="text-xl font-bold text-earth-800 mb-4">Order Not Found</h2>
        <Link to="/orders" className="inline-block px-6 py-3 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.15em]">
          View Orders
        </Link>
      </div>
    );
  }

  const isBuyer = user && order.buyer._id === user._id;
  const isSeller = user && order.seller._id === user._id;
  const canCancel =
    (isBuyer && ['pending', 'paid'].includes(order.status)) ||
    (isSeller && ['paid', 'confirmed'].includes(order.status));
  const canLeaveReview = Boolean(isBuyer && order.status === 'completed' && !orderReview);
  const canRaiseDispute = Boolean(
    isBuyer &&
      ['paid', 'confirmed', 'ready', 'completed'].includes(order.status) &&
      order.status !== 'disputed'
  );
  const currentStepIndex = order.status === 'cancelled' ? -1 : statusOrder.indexOf(order.status);
  const item = order.items[0];

  return (
    <div className="page-container max-w-3xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-earth-500 hover:text-earth-900 mb-8 uppercase tracking-[0.12em] font-bold transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-1">Order</p>
          <h1 className="text-2xl font-black text-earth-900 uppercase tracking-tight">
            #{order.orderNumber}
          </h1>
          <p className="text-xs text-earth-500 mt-1">
            {new Date(order.createdAt).toLocaleDateString('en-GH', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide ${ORDER_STATUS_COLORS[order.status]}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Delivery tracking timeline */}
      {order.status !== 'cancelled' && order.status !== 'disputed' && (
        <div className="border border-earth-200 bg-white p-6 mb-6">
          <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-earth-400 mb-6">
            Delivery tracking
          </p>
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-3.5 top-4 bottom-4 w-px bg-earth-100" />

            <div className="space-y-0">
              {TRACKING_STEPS.map((step, index) => {
                const stepIndex = statusOrder.indexOf(step.status);
                const isDone = stepIndex < currentStepIndex;
                const isCurrent = stepIndex === currentStepIndex;
                const isFuture = stepIndex > currentStepIndex;

                return (
                  <div key={step.status} className="flex gap-4 pb-6 last:pb-0">
                    {/* Dot */}
                    <div className={`relative z-10 flex-shrink-0 w-7 h-7 flex items-center justify-center ${
                      isDone
                        ? 'bg-earth-900 text-white'
                        : isCurrent
                        ? 'bg-earth-900 text-white ring-4 ring-earth-100'
                        : 'bg-white border-2 border-earth-200 text-earth-300'
                    }`}>
                      {isDone ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : isCurrent ? (
                        step.icon
                      ) : (
                        <Circle className="h-3.5 w-3.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pt-0.5 ${isFuture ? 'opacity-40' : ''}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-bold uppercase tracking-wide ${
                          isCurrent ? 'text-earth-900' : isDone ? 'text-earth-700' : 'text-earth-400'
                        }`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] bg-earth-900 text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-earth-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Cancelled notice */}
      {order.status === 'cancelled' && (
        <div className="bg-red-50 border border-red-200 p-4 mb-6 flex items-start gap-3">
          <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Order cancelled</p>
            {order.cancelReason && (
              <p className="text-sm text-red-600 mt-1">Reason: {order.cancelReason}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Item */}
        <div className="border border-earth-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-4 flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" /> Item
          </p>
          <div className="flex gap-3">
            <div className="w-14 h-14 overflow-hidden bg-earth-100 flex-shrink-0">
              {item?.image ? (
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-earth-300">
                  <Package className="h-5 w-5" />
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-earth-900 text-sm">{item?.title}</p>
              <p className="text-xs text-earth-500 mt-0.5">Qty: {item?.quantity || 1}</p>
              <p className="text-sm font-bold text-earth-900 mt-1">
                GHS {item?.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="border border-earth-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-4 flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" /> Delivery
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-earth-500 text-xs uppercase tracking-wide">Method</span>
              <span className="font-medium text-earth-900 capitalize">{order.deliveryMethod}</span>
            </div>
            {order.deliveryAddress && (
              <div className="flex justify-between">
                <span className="text-earth-500 text-xs uppercase tracking-wide">Address</span>
                <span className="font-medium text-earth-900">{order.deliveryAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment */}
        <div className="border border-earth-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-4 flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" /> Payment
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-earth-500 text-xs uppercase tracking-wide">Item</span>
              <span className="text-earth-900">
                GHS {(item?.price * (item?.quantity || 1)).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-earth-500 text-xs uppercase tracking-wide">Delivery</span>
              <span className={order.deliveryFee > 0 ? 'text-earth-900' : 'text-green-600'}>
                {order.deliveryFee > 0 ? `GHS ${order.deliveryFee.toFixed(2)}` : 'Free'}
              </span>
            </div>
            <div className="h-px bg-earth-100" />
            <div className="flex justify-between font-bold">
              <span className="text-earth-900 text-xs uppercase tracking-wide">Total</span>
              <span className="text-earth-900">
                GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {order.payment && (
              <div className="flex justify-between">
                <span className="text-earth-500 text-xs uppercase tracking-wide">Status</span>
                <span className={`font-medium text-sm ${
                  order.payment.status === 'success' ? 'text-green-600' :
                  order.payment.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {order.payment.status === 'success' ? 'Paid' :
                   order.payment.status === 'failed' ? 'Failed' : 'Pending'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Seller / Buyer */}
        <div className="border border-earth-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-4 flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5" /> {isBuyer ? 'Seller' : 'Buyer'}
          </p>
          {isBuyer ? (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-earth-900">
                {order.seller.name}
                {order.seller.isVerified && (
                  <span className="text-moss-500 text-xs ml-2">Verified</span>
                )}
              </p>
              {order.seller.phone && (
                <p className="text-earth-600 flex items-center gap-1.5 text-xs">
                  <Phone className="h-3.5 w-3.5 text-earth-400" />
                  {order.seller.phone}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-earth-900">{order.buyer.name}</p>
              {order.buyer.phone && (
                <p className="text-earth-600 flex items-center gap-1.5 text-xs">
                  <Phone className="h-3.5 w-3.5 text-earth-400" />
                  {order.buyer.phone}
                </p>
              )}
              {order.buyer.email && (
                <p className="text-earth-600 flex items-center gap-1.5 text-xs">
                  <Mail className="h-3.5 w-3.5 text-earth-400" />
                  {order.buyer.email}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Note */}
      {order.note && (
        <div className="border border-earth-200 bg-earth-50 p-4 mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-1">Note to Seller</p>
          <p className="text-sm text-earth-700">{order.note}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6 flex-wrap">
        <button
          onClick={handleContactSeller}
          disabled={contacting}
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-earth-300 text-xs font-bold uppercase tracking-[0.12em] text-earth-700 hover:bg-earth-100 transition-colors disabled:opacity-50"
        >
          <MessageCircle className="h-4 w-4" />
          {isBuyer ? 'Message Seller' : 'Message Buyer'}
        </button>
        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-red-300 text-xs font-bold uppercase tracking-[0.12em] text-red-600 hover:bg-red-50 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Cancel Order
          </button>
        )}
        {canLeaveReview && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-earth-900 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-earth-700 transition-colors"
          >
            <Star className="h-4 w-4" />
            Leave Review
          </button>
        )}
        {canRaiseDispute && (
          <button
            onClick={() => setShowDisputeModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-red-300 text-xs font-bold uppercase tracking-[0.12em] text-red-600 hover:bg-red-50 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            Raise Dispute
          </button>
        )}
      </div>

      {/* Review card */}
      {orderReview && (
        <div className="border border-earth-200 bg-white p-5 mt-6">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-3">Your Review</p>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${star <= orderReview.rating ? 'text-yellow-500 fill-yellow-500' : 'text-earth-200'}`}
              />
            ))}
          </div>
          <p className="text-sm text-earth-700">{orderReview.comment}</p>
          {orderReview.reply && (
            <div className="mt-3 bg-earth-50 border border-earth-100 p-3">
              <p className="text-xs font-bold text-earth-500 uppercase tracking-wide mb-1">Seller reply</p>
              <p className="text-sm text-earth-700">{orderReview.reply}</p>
            </div>
          )}
        </div>
      )}

      {/* Cancel modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white max-w-md w-full p-6">
            <h3 className="text-lg font-black text-earth-900 uppercase tracking-tight mb-2">Cancel Order</h3>
            <p className="text-sm text-earth-500 mb-4">
              Are you sure? This action cannot be undone.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              className="w-full h-20 resize-none border border-earth-200 p-3 text-sm focus:outline-none focus:border-earth-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                className="flex-1 px-4 py-2.5 border border-earth-300 text-xs font-bold uppercase tracking-[0.12em] text-earth-700 hover:bg-earth-50 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 bg-red-600 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white max-w-md w-full p-6">
            <h3 className="text-lg font-black text-earth-900 uppercase tracking-tight mb-2">Leave a Review</h3>
            <p className="text-sm text-earth-500 mb-5">Share your experience with this order.</p>
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-2">Rating</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setReviewRating(star)} className="p-1">
                    <Star className={`h-6 w-6 ${star <= reviewRating ? 'text-yellow-500 fill-yellow-500' : 'text-earth-300'}`} />
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Write your review..."
              className="w-full h-28 resize-none border border-earth-200 p-3 text-sm focus:outline-none focus:border-earth-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowReviewModal(false); setReviewComment(''); setReviewRating(5); }}
                className="flex-1 px-4 py-2.5 border border-earth-300 text-xs font-bold uppercase tracking-[0.12em] text-earth-700 hover:bg-earth-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className="flex-1 px-4 py-2.5 bg-earth-900 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-earth-700 transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dispute modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white max-w-lg w-full p-6">
            <h3 className="text-lg font-black text-earth-900 uppercase tracking-tight mb-1">Raise a Dispute</h3>
            <p className="text-sm text-earth-500 mb-5">
              Describe your issue. Our moderation team will review within 24–48 hours.
            </p>
            <div className="mb-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-earth-400 mb-2">Reason</p>
              <select
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-earth-300 focus:border-earth-900 focus:ring-0 text-sm py-2 outline-none text-earth-900"
              >
                {[
                  ['item_not_received', 'Item not received'],
                  ['item_not_as_described', 'Item not as described'],
                  ['wrong_item', 'Wrong item sent'],
                  ['damaged_item', 'Item arrived damaged'],
                  ['seller_unresponsive', 'Seller unresponsive'],
                  ['fraud', 'Fraud / scam'],
                  ['other', 'Other'],
                ].map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="mb-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-earth-400 mb-2">Description</p>
              <textarea
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                placeholder="Describe what happened in detail..."
                className="w-full h-28 resize-none border border-earth-200 p-3 text-sm focus:outline-none focus:border-earth-500"
              />
              <p className="text-[10px] text-earth-400 mt-1">{disputeDescription.length}/2000</p>
            </div>
            <div className="mb-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-earth-400 mb-2">Evidence links</p>
              <input
                value={disputeEvidence}
                onChange={(e) => setDisputeEvidence(e.target.value)}
                placeholder="Paste screenshot/photo links separated by commas"
                className="w-full border border-earth-200 p-3 text-sm focus:outline-none focus:border-earth-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDisputeModal(false); setDisputeDescription(''); setDisputeEvidence(''); }}
                className="flex-1 px-4 py-2.5 border border-earth-300 text-xs font-bold uppercase tracking-[0.12em] text-earth-700 hover:bg-earth-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRaiseDispute}
                disabled={submittingDispute || disputeDescription.trim().length < 10}
                className="flex-1 px-4 py-2.5 bg-red-600 text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submittingDispute ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
