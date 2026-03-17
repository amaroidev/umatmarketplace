import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  Users,
  UserCheck,
  Ban,
  Package,
  Flag,
  Star,
  ShoppingCart,
  Clock,
  CheckCircle,
  TrendingUp,
  Search,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import adminService, { AdminDashboardStats, DisputePopulated } from '../services/admin.service';
import orderService from '../services/order.service';
import { Button, Input, LoadingSpinner } from '../components/ui';
import { OrderPopulated, ProductPopulated, User } from '../types';
import { Link } from 'react-router-dom';

type AdminTab = 'overview' | 'users' | 'products' | 'orders' | 'disputes';

const TABS: { value: AdminTab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'users', label: 'Users' },
  { value: 'products', label: 'Products' },
  { value: 'orders', label: 'Orders' },
  { value: 'disputes', label: 'Disputes' },
];

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  under_review: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-earth-200 text-earth-700',
};

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<ProductPopulated[]>([]);
  const [orders, setOrders] = useState<OrderPopulated[]>([]);
  const [disputes, setDisputes] = useState<DisputePopulated[]>([]);
  const [moderationQueue, setModerationQueue] = useState<{ products: ProductPopulated[]; disputes: DisputePopulated[] }>({
    products: [],
    disputes: [],
  });

  const [userSearch, setUserSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  
  // Dispute management state
  const [selectedDispute, setSelectedDispute] = useState<DisputePopulated | null>(null);
  const [disputeStatus, setDisputeStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [runningAutomation, setRunningAutomation] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await adminService.getDashboardStats();
      if (res.success) setStats(res.data.stats);
    } catch {
      toast.error('Failed to load dashboard stats');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await adminService.getUsers({ limit: 50, search: userSearch || undefined });
      if (res.success) setUsers(res.data.users);
    } catch {
      toast.error('Failed to load users');
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await adminService.getProducts({ limit: 50, search: productSearch || undefined });
      if (res.success) setProducts(res.data.products);
    } catch {
      toast.error('Failed to load products');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await adminService.getOrders({ limit: 50, search: orderSearch || undefined });
      if (res.success) setOrders(res.data.orders);
    } catch {
      toast.error('Failed to load orders');
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await adminService.getDisputes({ limit: 50 });
      if (res.success) setDisputes(res.data.disputes);
    } catch {
      toast.error('Failed to load disputes');
    }
  };

  const fetchModerationQueue = async () => {
    try {
      const res = await adminService.getModerationQueue({ limit: 10 });
      if (res.success) setModerationQueue(res.data);
    } catch {
      toast.error('Failed to load moderation queue');
    }
  };

  const runAutomationSweep = async () => {
    setRunningAutomation(true);
    try {
      const res = await orderService.runAutomationSweep();
      if (res.success) {
        toast.success(`Sweep done: ${res.data.abandonedCheckoutCount} abandoned + ${res.data.inventoryLowAlertCount} low-stock alerts`);
      }
    } catch {
      toast.error('Failed to run automation sweep');
    } finally {
      setRunningAutomation(false);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchProducts(), fetchOrders(), fetchDisputes(), fetchModerationQueue()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Users', value: stats.totalUsers, icon: Users, color: 'text-earth-600' },
      { label: 'Sellers', value: stats.totalSellers, icon: UserCheck, color: 'text-moss-600' },
      { label: 'Banned Users', value: stats.bannedUsers, icon: Ban, color: 'text-red-600' },
      { label: 'Products', value: stats.totalProducts, icon: Package, color: 'text-earth-700' },
      { label: 'Flagged Products', value: stats.flaggedProducts, icon: Flag, color: 'text-orange-600' },
      { label: 'Featured Products', value: stats.featuredProducts, icon: Star, color: 'text-yellow-600' },
      { label: 'Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-purple-600' },
      { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-amber-600' },
      { label: 'Completed Orders', value: stats.completedOrders, icon: CheckCircle, color: 'text-green-600' },
      { label: 'Revenue (GHS)', value: stats.totalRevenue.toFixed(2), icon: TrendingUp, color: 'text-earth-600' },
      { label: 'Open Disputes', value: stats.openDisputes, icon: AlertTriangle, color: 'text-orange-600' },
    ];
  }, [stats]);

  const handleToggleBan = async (user: User) => {
    setBusyId(user._id);
    try {
      const res = await adminService.setUserBanStatus(user._id, !user.isBanned);
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u._id === user._id ? res.data.user : u)));
        toast.success(user.isBanned ? 'User unbanned' : 'User banned');
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleVerifySeller = async (user: User) => {
    setBusyId(user._id);
    try {
      const res = await adminService.setSellerVerification(user._id, !user.isVerified);
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u._id === user._id ? res.data.user : u)));
        toast.success(res.data.user.isVerified ? 'Seller verified' : 'Seller unverified');
        fetchStats();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update seller verification');
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleFeatured = async (product: ProductPopulated) => {
    setBusyId(product._id);
    try {
      const res = await adminService.updateProductModeration(product._id, {
        isFeatured: !product.isFeatured,
      });
      if (res.success) {
        setProducts((prev) => prev.map((p) => (p._id === product._id ? res.data.product : p)));
        toast.success(res.data.product.isFeatured ? 'Product featured' : 'Product unfeatured');
        fetchStats();
      }
    } catch {
      toast.error('Failed to update featured status');
    } finally {
      setBusyId(null);
    }
  };

  const handleClearFlag = async (product: ProductPopulated) => {
    setBusyId(product._id);
    try {
      const res = await adminService.updateProductModeration(product._id, {
        isFlagged: false,
        flagReason: '',
      });
      if (res.success) {
        setProducts((prev) => prev.map((p) => (p._id === product._id ? res.data.product : p)));
        toast.success('Product flag cleared');
        fetchStats();
      }
    } catch {
      toast.error('Failed to clear product flag');
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateDispute = async () => {
    if (!selectedDispute) return;
    setBusyId('dispute-update');
    try {
      const res = await adminService.updateDisputeStatus(selectedDispute._id, disputeStatus, adminNote);
      if (res.success) {
        setDisputes((prev) => prev.map((d) => (d._id === selectedDispute._id ? res.data.dispute : d)));
        toast.success('Dispute updated');
        setSelectedDispute(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update dispute');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." fullScreen />;
  }

  return (
    <div className="page-container max-w-7xl relative pb-20">
      {/* Header */}
      <div className="mb-8 pt-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-2 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          Administration
        </p>
        <h1 className="text-3xl font-black text-earth-900 uppercase tracking-tight">Admin Dashboard</h1>
        <div className="h-px bg-earth-200 mt-4" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto mb-8 border-b border-earth-200">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] whitespace-nowrap border-b-2 -mb-px transition-colors ${
              activeTab === tab.value
                ? 'border-earth-900 text-earth-900'
                : 'border-transparent text-earth-400 hover:text-earth-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-px border border-earth-200 bg-earth-200 md:grid-cols-3 lg:grid-cols-5">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white p-5">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-earth-500">
                  <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
                  {card.label}
                </div>
                <p className="text-2xl font-black text-earth-900">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-earth-200 bg-white">
              <div className="flex items-center justify-between border-b border-earth-100 px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400">Moderation queue</p>
                  <h2 className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-earth-900">Flagged listings</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={runAutomationSweep} disabled={runningAutomation}>
                    {runningAutomation ? 'Running...' : 'Run sweep'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={fetchModerationQueue}>Refresh</Button>
                </div>
              </div>
              <div className="divide-y divide-earth-100">
                {moderationQueue.products.length === 0 ? (
                  <p className="p-5 text-sm text-earth-500">No flagged listings waiting.</p>
                ) : moderationQueue.products.map((product) => (
                  <div key={product._id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-earth-900">{product.title}</p>
                        <p className="mt-1 text-xs text-earth-500">{typeof product.seller === 'string' ? 'Seller' : product.seller.name}</p>
                        {product.flagReason && (
                          <p className="mt-2 text-xs text-orange-700">Reason: {product.flagReason}</p>
                        )}
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => setActiveTab('products')}>Review</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-earth-200 bg-white">
              <div className="border-b border-earth-100 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400">Moderation queue</p>
                <h2 className="mt-1 text-sm font-black uppercase tracking-[0.12em] text-earth-900">Open disputes</h2>
              </div>
              <div className="divide-y divide-earth-100">
                {moderationQueue.disputes.length === 0 ? (
                  <p className="p-5 text-sm text-earth-500">No active disputes in queue.</p>
                ) : moderationQueue.disputes.map((dispute) => (
                  <div key={dispute._id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-earth-900">#{dispute.order.orderNumber}</p>
                        <p className="mt-1 text-xs text-earth-500">{dispute.reason.replace(/_/g, ' ')}</p>
                        <p className="mt-2 text-xs text-earth-600 line-clamp-2">{dispute.description}</p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => setActiveTab('disputes')}>Review</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div>
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
            <h2 className="text-sm font-bold text-earth-900 uppercase tracking-[0.15em]">User Management</h2>
            <div className="flex gap-2">
              <div className="w-64">
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users"
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Button variant="outline" onClick={fetchUsers}>Search</Button>
            </div>
          </div>
          <div className="border border-earth-200 divide-y divide-earth-100">
            {users.map((user) => (
              <div key={user._id} className="bg-white p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-earth-900 text-sm">{user.name}</p>
                  <p className="text-xs text-earth-500 mt-0.5">{user.email} &middot; {user.role}</p>
                  <div className="flex gap-2 mt-1.5">
                    {user.isVerified && (
                      <span className="text-xs px-2 py-0.5 bg-moss-100 text-moss-700 font-medium uppercase tracking-wide">
                        Verified
                      </span>
                    )}
                    {user.isBanned && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 font-medium uppercase tracking-wide">
                        Banned
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {user.role === 'seller' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleVerifySeller(user)}
                      isLoading={busyId === user._id}
                    >
                      {user.isVerified ? 'Unverify' : 'Verify'}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={user.isBanned ? 'secondary' : 'danger'}
                    onClick={() => handleToggleBan(user)}
                    isLoading={busyId === user._id}
                  >
                    {user.isBanned ? 'Unban' : 'Ban'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      {activeTab === 'products' && (
        <div>
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
            <h2 className="text-sm font-bold text-earth-900 uppercase tracking-[0.15em]">Product Moderation</h2>
            <div className="flex gap-2">
              <div className="w-64">
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products"
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Button variant="outline" onClick={fetchProducts}>Search</Button>
            </div>
          </div>
          <div className="border border-earth-200 divide-y divide-earth-100">
            {products.map((product) => (
              <div key={product._id} className="bg-white p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-earth-900 text-sm">{product.title}</p>
                  <p className="text-xs text-earth-500 mt-0.5">
                    GHS {product.price.toLocaleString('en-GH', { minimumFractionDigits: 2 })} &middot;{' '}
                    {typeof product.seller === 'string' ? 'Seller' : product.seller.name}
                  </p>
                  <div className="flex gap-2 mt-1.5">
                    {product.isFlagged && (
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 font-medium uppercase tracking-wide">
                        Flagged
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 font-medium uppercase tracking-wide">
                        Featured
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 bg-earth-100 text-earth-700 font-medium uppercase tracking-wide capitalize">
                      {product.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleFeatured(product)}
                    isLoading={busyId === product._id}
                  >
                    {product.isFeatured ? 'Unfeature' : 'Feature'}
                  </Button>
                  {product.isFlagged && (
                     <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleClearFlag(product)}
                      isLoading={busyId === product._id}
                    >
                      Clear Flag
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders */}
      {activeTab === 'orders' && (
        <div>
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
            <h2 className="text-sm font-bold text-earth-900 uppercase tracking-[0.15em]">Order Monitoring</h2>
            <div className="flex gap-2">
              <div className="w-64">
                <Input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order number"
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <Button variant="outline" onClick={fetchOrders}>Search</Button>
            </div>
          </div>
          <div className="border border-earth-200 divide-y divide-earth-100">
            {orders.map((order) => (
              <div key={order._id} className="bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <Link to={`/orders/${order._id}`} className="font-semibold text-earth-900 text-sm hover:underline">#{order.orderNumber}</Link>
                    <p className="text-xs text-earth-500 mt-0.5">
                      Buyer: {order.buyer.name} &middot; Seller: {order.seller.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-earth-900 text-sm">
                      GHS {order.totalAmount.toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-earth-500 capitalize mt-0.5">{order.status.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="p-4 text-sm text-earth-500">No orders found.</p>}
          </div>
        </div>
      )}

      {/* Disputes */}
      {activeTab === 'disputes' && (
        <div>
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
            <h2 className="text-sm font-bold text-earth-900 uppercase tracking-[0.15em]">Dispute Center</h2>
            <Button variant="outline" onClick={fetchDisputes}>Refresh</Button>
          </div>
          <div className="border border-earth-200 divide-y divide-earth-100">
            {disputes.map((dispute) => (
              <div key={dispute._id} className="bg-white p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 ${DISPUTE_STATUS_COLORS[dispute.status] || 'bg-earth-100 text-earth-700'}`}>
                      {dispute.status.replace('_', ' ')}
                    </span>
                    <Link to={`/orders/${dispute.order._id}`} className="text-xs font-bold text-earth-900 hover:underline flex items-center gap-1">
                      Order #{dispute.order.orderNumber}
                    </Link>
                  </div>
                  <p className="text-sm font-medium text-earth-900 mt-2">Reason: {dispute.reason}</p>
                  <p className="text-sm text-earth-600 mt-1 line-clamp-2">{dispute.description}</p>
                  <p className="text-xs text-earth-500 mt-2">
                    Raised by <span className="font-semibold">{dispute.raisedBy.name}</span> against <span className="font-semibold">{dispute.against.name}</span>
                    <br/>
                    <span className="text-[10px] uppercase tracking-wider mt-1 block">
                      {new Date(dispute.createdAt).toLocaleString()}
                    </span>
                  </p>
                  {dispute.adminNote && (
                    <div className="mt-3 p-3 bg-earth-50 border-l-2 border-earth-400 text-sm">
                      <p className="text-xs font-bold uppercase tracking-wider text-earth-500 mb-1">Admin Note</p>
                      <p className="text-earth-800">{dispute.adminNote}</p>
                    </div>
                  )}
                  {dispute.evidence && dispute.evidence.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dispute.evidence.map((item, index) => (
                        <a
                          key={`${dispute._id}-evidence-${index}`}
                          href={item}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 border border-earth-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-earth-500 hover:border-earth-900 hover:text-earth-900"
                        >
                          Evidence <AlertTriangle className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedDispute(dispute);
                    setDisputeStatus(dispute.status);
                    setAdminNote(dispute.adminNote || '');
                  }}
                >
                  Manage Dispute
                </Button>
              </div>
            ))}
            {disputes.length === 0 && <p className="p-4 text-sm text-earth-500">No disputes found.</p>}
          </div>
        </div>
      )}

      {/* Dispute Management Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-earth-200 w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-earth-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-earth-900 uppercase tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-earth-900" />
                Manage Dispute
              </h3>
              <button 
                onClick={() => setSelectedDispute(null)}
                className="text-earth-400 hover:text-earth-900 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto">
              <div className="mb-6 bg-earth-50 p-4 border border-earth-200">
                <p className="text-xs font-bold uppercase tracking-wider text-earth-500 mb-2">Order Info</p>
                <p className="text-sm font-semibold text-earth-900">Order #{selectedDispute.order.orderNumber}</p>
                <p className="text-sm text-earth-600">Amount: GHS {selectedDispute.order.totalAmount.toFixed(2)}</p>
                <div className="h-px bg-earth-200 my-3" />
                <p className="text-sm text-earth-900"><span className="text-earth-500">Raised By:</span> {selectedDispute.raisedBy.name} ({selectedDispute.raisedBy.email})</p>
                <p className="text-sm text-earth-900 mt-1"><span className="text-earth-500">Against:</span> {selectedDispute.against.name} ({selectedDispute.against.email})</p>
              </div>

              <div className="mb-5">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-earth-500 mb-2">
                  Update Status
                </label>
                <div className="relative">
                  <select
                    value={disputeStatus}
                    onChange={(e) => setDisputeStatus(e.target.value)}
                    className="w-full appearance-none bg-transparent border-b border-earth-200 py-3 pl-3 pr-8 text-sm focus:border-earth-900 focus:outline-none transition-colors cursor-pointer text-earth-900"
                  >
                    <option value="open">Open</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed (No Action)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-earth-400">
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-earth-500 mb-2">
                  Admin Note (Visible to users)
                </label>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full bg-transparent border-b border-earth-200 py-3 px-3 text-sm focus:border-earth-900 focus:outline-none transition-colors text-earth-900 resize-none min-h-[100px]"
                  placeholder="Enter resolution details, instructions, or outcome..."
                />
              </div>
            </div>

            <div className="p-5 border-t border-earth-100 flex justify-end gap-3 bg-earth-50">
              <Button variant="outline" onClick={() => setSelectedDispute(null)}>Cancel</Button>
              <Button 
                onClick={handleUpdateDispute} 
                isLoading={busyId === 'dispute-update'}
                disabled={busyId === 'dispute-update'}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
