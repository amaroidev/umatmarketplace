import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import growthService from '../services/growth.service';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const AdminGrowthPage: React.FC = () => {
  const [trustUserId, setTrustUserId] = useState('');
  const [trustType, setTrustType] = useState<'identity_verified' | 'safe_meetup' | 'scam_flag'>('safe_meetup');
  const [scoreDelta, setScoreDelta] = useState('5');

  const { data: analytics } = useQuery({
    queryKey: ['growthAnalyticsOverview'],
    queryFn: () => growthService.getAnalyticsOverview(),
  });

  const { data: ops } = useQuery({
    queryKey: ['growthOpsOverview'],
    queryFn: () => growthService.getOpsOverview(),
  });

  const addSignal = async () => {
    if (!trustUserId.trim()) {
      toast.error('Enter user ID');
      return;
    }
    try {
      await growthService.addTrustSignal({
        userId: trustUserId.trim(),
        type: trustType,
        scoreDelta: Number(scoreDelta),
      });
      toast.success('Trust signal recorded');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add trust signal');
    }
  };

  const funnel = analytics?.data?.funnel;
  const cohorts = analytics?.data?.cohorts || {};
  const opsData = ops?.data || {};

  return (
    <div className="page-container max-w-6xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">Admin</p>
      <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-earth-900">Growth & Ops Suite</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="border border-earth-200 p-4"><p className="text-[10px] text-earth-400 uppercase">Views</p><p className="text-2xl font-black text-earth-900">{funnel?.views || 0}</p></div>
        <div className="border border-earth-200 p-4"><p className="text-[10px] text-earth-400 uppercase">Chats</p><p className="text-2xl font-black text-earth-900">{funnel?.chats || 0}</p></div>
        <div className="border border-earth-200 p-4"><p className="text-[10px] text-earth-400 uppercase">Orders</p><p className="text-2xl font-black text-earth-900">{funnel?.orders || 0}</p></div>
        <div className="border border-earth-200 p-4"><p className="text-[10px] text-earth-400 uppercase">View→Chat</p><p className="text-2xl font-black text-earth-900">{Math.round((funnel?.viewToChatRate || 0) * 100)}%</p></div>
        <div className="border border-earth-200 p-4"><p className="text-[10px] text-earth-400 uppercase">Chat→Order</p><p className="text-2xl font-black text-earth-900">{Math.round((funnel?.chatToOrderRate || 0) * 100)}%</p></div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="border border-earth-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">Cohort retention proxy</p>
          <div className="mt-3 space-y-2">
            {Object.entries(cohorts).map(([month, val]: any) => (
              <div key={month} className="flex justify-between border border-earth-100 px-3 py-2 text-xs">
                <span className="font-bold text-earth-900">{month}</span>
                <span className="text-earth-600">Signups {val.signup} · Orders {val.order}</span>
              </div>
            ))}
            {Object.keys(cohorts).length === 0 && <p className="text-xs text-earth-400">No cohort events yet.</p>}
          </div>
        </div>

        <div className="border border-earth-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">Trust workflow</p>
          <div className="mt-3 space-y-2">
            <input value={trustUserId} onChange={(e) => setTrustUserId(e.target.value)} placeholder="User ID" className="w-full border border-earth-200 px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <select value={trustType} onChange={(e) => setTrustType(e.target.value as any)} className="border border-earth-200 px-3 py-2 text-sm">
                <option value="safe_meetup">Safe meetup</option>
                <option value="identity_verified">Identity verified</option>
                <option value="scam_flag">Scam flag</option>
              </select>
              <input value={scoreDelta} onChange={(e) => setScoreDelta(e.target.value)} placeholder="Score delta" className="border border-earth-200 px-3 py-2 text-sm" />
            </div>
            <button onClick={addSignal} className="w-full bg-earth-900 text-white py-2 text-xs font-bold uppercase tracking-[0.12em]">Add trust signal</button>
          </div>
        </div>
      </div>

      <div className="mt-8 border border-earth-200 p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-earth-400">Ops overview</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {[
            ['Moderation Queue', opsData.moderationQueue || 0],
            ['Open Orders', opsData.openOrders || 0],
            ['Failed Payments', opsData.failedPayments || 0],
            ['Disputes', opsData.disputes || 0],
            ['Pending Replies', opsData.pendingReviewReplies || 0],
          ].map(([label, val]) => (
            <div key={label as string} className="border border-earth-100 px-3 py-2 text-xs flex justify-between">
              <span className="text-earth-500 uppercase tracking-[0.12em] font-bold">{label as string}</span>
              <span className="font-black text-earth-900">{val as any}</span>
            </div>
          ))}
        </div>

        {Array.isArray(opsData.retryJobs) && opsData.retryJobs.length > 0 && (
          <div className="mt-4 border border-earth-100 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-earth-400 mb-2">Recent retry jobs</p>
            <div className="space-y-1">
              {opsData.retryJobs.slice(0, 5).map((job: any) => (
                <p key={job._id} className="text-xs text-earth-600">
                  <span className="font-bold uppercase text-earth-700">{job.type}</span> · {job.status} · attempts {job.attempts}/{job.maxAttempts}
                </p>
              ))}
            </div>
          </div>
        )}

        {Array.isArray(opsData.importAuditLogs) && opsData.importAuditLogs.length > 0 && (
          <div className="mt-4 border border-earth-100 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-earth-400 mb-2">Recent audit logs</p>
            <div className="space-y-1">
              {opsData.importAuditLogs.slice(0, 5).map((log: any) => (
                <p key={log._id} className="text-xs text-earth-600">
                  <span className="font-bold uppercase text-earth-700">{log.action}</span> · {log.scope} · {log.status}
                </p>
              ))}
            </div>
            <Link to="/admin" className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[0.14em] text-earth-500 hover:text-earth-900">Open full ops console</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGrowthPage;
