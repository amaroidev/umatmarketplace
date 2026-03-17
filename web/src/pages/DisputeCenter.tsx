import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Search,
  XCircle,
  Shield,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Dispute {
  _id: string;
  order: { _id: string; orderNumber: string; totalAmount: number; status: string };
  raisedBy: { _id: string; name: string; email: string };
  against: { _id: string; name: string; email: string };
  reason: string;
  description: string;
  evidence?: string[];
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  adminNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

const REASON_LABELS: Record<string, string> = {
  item_not_received: 'Item not received',
  item_not_as_described: 'Item not as described',
  wrong_item: 'Wrong item sent',
  damaged_item: 'Item arrived damaged',
  seller_unresponsive: 'Seller unresponsive',
  fraud: 'Fraud / scam',
  other: 'Other',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-red-50 text-red-700 border-red-200',
  under_review: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-earth-50 text-earth-500 border-earth-200',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  open: <AlertTriangle className="h-3.5 w-3.5" />,
  under_review: <Clock className="h-3.5 w-3.5" />,
  resolved: <CheckCircle className="h-3.5 w-3.5" />,
  closed: <XCircle className="h-3.5 w-3.5" />,
};

const labelBase = 'text-[9px] font-bold uppercase tracking-[0.28em] text-earth-400';

const DisputeCenterPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['myDisputes'],
    queryFn: async () => {
      const res = await api.get('/disputes/my');
      return res.data;
    },
  });

  const disputes: Dispute[] = data?.data?.disputes ?? [];
  const filtered = disputes.filter(
    (d) =>
      d.order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      REASON_LABELS[d.reason]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-[calc(100vh-56px)] bg-white">
      {/* Hero */}
      <div className="bg-[#0a0a0a] px-6 pt-14 pb-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/20 mb-4">
            Account / Disputes
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Dispute Center</h1>
          <p className="mt-2 text-sm text-white/35">
            Track and manage disputes raised on your orders.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        {/* Search */}
        <div className="flex items-center gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-earth-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order number or reason..."
              className="w-full pl-9 pr-4 py-2.5 bg-transparent border-0 border-b border-earth-300 focus:border-earth-900 focus:ring-0 text-sm outline-none placeholder:text-earth-300"
            />
          </div>
          <Link
            to="/orders"
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-earth-400 hover:text-earth-900 border border-earth-200 hover:border-earth-400 px-3 py-2.5 transition-colors"
          >
            My Orders
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-earth-200 p-5 animate-pulse">
                <div className="h-3 w-32 bg-earth-100 mb-2" />
                <div className="h-2.5 w-64 bg-earth-100" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-earth-200 px-8 py-20 text-center">
            <Shield className="h-12 w-12 text-earth-200 mx-auto mb-4" />
            <p className="text-sm font-bold uppercase tracking-wide text-earth-400">
              {search ? 'No matching disputes' : 'No disputes'}
            </p>
            <p className="text-xs text-earth-400 mt-1">
              {search
                ? 'Try a different search term.'
                : 'You have no open or past disputes. Disputes can be raised from an order detail page.'}
            </p>
          </div>
        ) : (
          <div className="border border-earth-200 divide-y divide-earth-100">
            {filtered.map((dispute) => (
              <div key={dispute._id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={labelBase}>Order #{dispute.order.orderNumber}</p>
                      <span className={`flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] border ${STATUS_STYLES[dispute.status]}`}>
                        {STATUS_ICONS[dispute.status]}
                        {dispute.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-earth-900">
                      {REASON_LABELS[dispute.reason] ?? dispute.reason}
                    </p>
                    <p className="text-xs text-earth-500 mt-1 line-clamp-2">{dispute.description}</p>

                    {dispute.adminNote && (
                      <div className="mt-3 border-l-2 border-earth-300 pl-3">
                        <p className={`${labelBase} mb-0.5`}>Admin note</p>
                        <p className="text-xs text-earth-600">{dispute.adminNote}</p>
                      </div>
                    )}

                    {dispute.evidence && dispute.evidence.length > 0 && (
                      <div className="mt-3">
                        <p className={`${labelBase} mb-2`}>Evidence</p>
                        <div className="flex flex-wrap gap-2">
                          {dispute.evidence.map((item, index) => (
                            <a
                              key={`${dispute._id}-${index}`}
                              href={item}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 border border-earth-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-earth-500 hover:border-earth-900 hover:text-earth-900"
                            >
                              View file <ArrowRight className="h-2.5 w-2.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-black text-earth-900">
                      GHS {dispute.order.totalAmount?.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-earth-400 mt-0.5">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </p>
                    <Link
                      to={`/orders/${dispute.order._id}`}
                      className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-earth-400 hover:text-earth-900 transition-colors"
                    >
                      View order <ArrowRight className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputeCenterPage;
