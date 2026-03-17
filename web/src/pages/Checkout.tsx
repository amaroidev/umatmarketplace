import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Truck,
  Package,
  CreditCard,
  Smartphone,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import productService from '../services/product.service';
import orderService from '../services/order.service';
import paymentService from '../services/payment.service';
import { LoadingSpinner } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ProductPopulated, PAYMENT_METHODS, PaymentMethod, DeliveryMethod } from '../types';

const Checkout: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<ProductPopulated | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('momo_mtn');

  useEffect(() => {
    if (!productId) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await productService.getProduct(productId);
        if (res.success) {
          setProduct(res.data.product);
          if (res.data.product.deliveryOption === 'delivery') {
            setDeliveryMethod('delivery');
          } else {
            setDeliveryMethod('pickup');
          }
          if (res.data.product.pickupLocation) {
            setPickupLocation(res.data.product.pickupLocation);
          }
        }
      } catch (err: any) {
        toast.error('Failed to load product');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, navigate]);

  const deliveryFee = deliveryMethod === 'delivery' ? 5.0 : 0;
  const totalAmount = product ? product.price + deliveryFee : 0;
  const canPickup = product?.deliveryOption === 'pickup' || product?.deliveryOption === 'both';
  const canDeliver = product?.deliveryOption === 'delivery' || product?.deliveryOption === 'both';

  const handleSubmit = async () => {
    if (!product || !user) return;
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }
    setSubmitting(true);
    try {
      const orderRes = await orderService.createOrder({
        productId: product._id,
        quantity: 1,
        deliveryMethod,
        pickupLocation: deliveryMethod === 'pickup' ? pickupLocation : undefined,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : undefined,
        note: note.trim() || undefined,
      });
      if (!orderRes.success) { toast.error(orderRes.message || 'Failed to create order'); return; }
      const order = orderRes.data.order;
      const callbackUrl = `${window.location.origin}/payment/verify`;
      const payRes = await paymentService.initiatePayment(order._id, paymentMethod, callbackUrl);
      if (payRes.success && payRes.data.authorizationUrl) {
        window.location.href = payRes.data.authorizationUrl;
      } else {
        toast.error('Failed to initialize payment');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading checkout..." fullScreen />;

  if (!product) {
    return (
      <div className="page-container text-center py-20">
        <h2 className="text-xl font-black text-earth-800 uppercase mb-4">Product Not Found</h2>
        <Link to="/products" className="inline-block px-6 py-3 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.15em]">
          Browse Products
        </Link>
      </div>
    );
  }

  if (product.status !== 'active') {
    return (
      <div className="page-container text-center py-20">
        <h2 className="text-xl font-black text-earth-800 uppercase mb-2">Product Unavailable</h2>
        <p className="text-earth-500 mb-6">This product is no longer available for purchase.</p>
        <Link to="/products" className="inline-block px-6 py-3 bg-earth-900 text-white text-xs font-bold uppercase tracking-[0.15em]">
          Browse Products
        </Link>
      </div>
    );
  }

  const seller = product.seller;
  const image = product.images[0]?.url ||
    `https://placehold.co/200x200/e2e8f0/64748b?text=${encodeURIComponent(product.title.slice(0, 15))}`;

  return (
    <div className="page-container max-w-4xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs text-earth-500 hover:text-earth-900 mb-8 uppercase tracking-[0.12em] font-bold transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>

      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-1">Purchase</p>
        <h1 className="text-3xl font-black text-earth-900 uppercase tracking-tight">Checkout</h1>
        <div className="h-px bg-earth-200 mt-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product summary */}
          <div className="border border-earth-200 bg-white p-5">
            <div className="flex gap-4">
              <img src={image} alt={product.title} className="w-18 h-18 w-[72px] h-[72px] object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-earth-900 text-sm truncate">{product.title}</h3>
                <p className="text-xs text-earth-500 mt-0.5">
                  Sold by {seller.name}
                  {seller.isVerified && <span className="text-moss-500 ml-1">&#10003;</span>}
                </p>
                <p className="text-lg font-black text-earth-900 mt-1">
                  GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery method */}
          <div className="border border-earth-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-500 mb-4 flex items-center gap-2">
              <Truck className="h-3.5 w-3.5" /> Delivery Method
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {canPickup && (
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`flex items-center gap-3 p-4 border-2 text-left transition-colors ${
                    deliveryMethod === 'pickup'
                      ? 'border-earth-900 bg-earth-50'
                      : 'border-earth-200 hover:border-earth-400'
                  }`}
                >
                  <Package className={`h-5 w-5 ${deliveryMethod === 'pickup' ? 'text-earth-900' : 'text-earth-400'}`} />
                  <div>
                    <p className="font-bold text-earth-900 text-sm">Campus Pickup</p>
                    <p className="text-xs text-earth-500">Free — meet at a location</p>
                  </div>
                </button>
              )}
              {canDeliver && (
                <button
                  type="button"
                  onClick={() => setDeliveryMethod('delivery')}
                  className={`flex items-center gap-3 p-4 border-2 text-left transition-colors ${
                    deliveryMethod === 'delivery'
                      ? 'border-earth-900 bg-earth-50'
                      : 'border-earth-200 hover:border-earth-400'
                  }`}
                >
                  <Truck className={`h-5 w-5 ${deliveryMethod === 'delivery' ? 'text-earth-900' : 'text-earth-400'}`} />
                  <div>
                    <p className="font-bold text-earth-900 text-sm">Delivery</p>
                    <p className="text-xs text-earth-500">GHS 5.00 delivery fee</p>
                  </div>
                </button>
              )}
            </div>
            {deliveryMethod === 'delivery' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-2 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Delivery Address
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your delivery address on campus..."
                  className="w-full border-b border-earth-300 bg-transparent py-2 text-sm focus:outline-none focus:border-earth-900 placeholder:text-earth-300"
                />
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="border border-earth-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-500 mb-4 flex items-center gap-2">
              <CreditCard className="h-3.5 w-3.5" /> Payment Method
            </p>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`w-full flex items-center gap-3 p-3.5 border-2 text-left transition-colors ${
                    paymentMethod === method.value
                      ? 'border-earth-900 bg-earth-50'
                      : 'border-earth-200 hover:border-earth-400'
                  }`}
                >
                  {/* Square radio */}
                  <div className={`w-4 h-4 border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === method.value ? 'border-earth-900' : 'border-earth-300'
                  }`}>
                    {paymentMethod === method.value && (
                      <div className="w-2 h-2 bg-earth-900" />
                    )}
                  </div>
                  {method.value.startsWith('momo') ? (
                    <Smartphone className="h-4 w-4 text-earth-400" />
                  ) : method.value === 'card' ? (
                    <CreditCard className="h-4 w-4 text-earth-400" />
                  ) : (
                    <Building2 className="h-4 w-4 text-earth-400" />
                  )}
                  <span className="font-medium text-earth-900 text-sm">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="border border-earth-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-earth-500 mb-3">
              Note to Seller (optional)
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any special instructions..."
              className="w-full h-20 resize-none border-b border-earth-300 bg-transparent py-2 text-sm focus:outline-none focus:border-earth-900 placeholder:text-earth-300"
              maxLength={500}
            />
          </div>
        </div>

        {/* Right: Order summary */}
        <div className="lg:col-span-1">
          <div className="border border-earth-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-500 mb-5">Order Summary</p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-earth-500 text-xs uppercase tracking-wide">Item</span>
                <span className="font-medium text-earth-900">
                  GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-earth-500 text-xs uppercase tracking-wide">Delivery</span>
                <span className={`font-medium ${deliveryFee > 0 ? 'text-earth-900' : 'text-green-600'}`}>
                  {deliveryFee > 0 ? `GHS ${deliveryFee.toFixed(2)}` : 'Free'}
                </span>
              </div>
              <div className="h-px bg-earth-200" />
              <div className="flex justify-between">
                <span className="font-black text-earth-900 text-xs uppercase tracking-[0.12em]">Total</span>
                <span className="font-black text-earth-900">
                  GHS {totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-6 py-3.5 bg-earth-900 text-white text-xs font-black uppercase tracking-[0.15em] hover:bg-earth-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Processing...' : `Pay GHS ${totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}`}
            </button>

            <div className="flex items-center gap-2 text-xs text-earth-400 mt-4 justify-center">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
              Secured by Paystack
            </div>
            <p className="text-xs text-earth-400 mt-3 text-center leading-relaxed">
              You will be redirected to Paystack to complete your payment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
