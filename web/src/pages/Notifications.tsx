import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/ui';
import notificationService from '../services/notification.service';
import { NotificationItem, PaginationInfo } from '../types';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async (targetPage: number) => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications(targetPage, 20);
      if (res.success) {
        setNotifications(res.data.notifications);
        setPagination(res.pagination);
      }
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await notificationService.markAsRead(id);
      if (res.success) {
        setNotifications((prev) =>
          prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
        );
      }
    } catch {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await notificationService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        toast.success('All notifications marked as read');
      }
    } catch {
      toast.error('Failed to mark all notifications as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await notificationService.deleteNotification(id);
      if (res.success) {
        setNotifications((prev) => prev.filter((item) => item._id !== id));
      }
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  if (loading && page === 1) {
    return <LoadingSpinner text="Loading notifications..." fullScreen />;
  }

  return (
    <div className="page-container max-w-3xl">
      {/* Page header */}
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-2">Inbox</p>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-black text-earth-900 uppercase tracking-tight flex items-center gap-3">
          <Bell className="h-6 w-6 text-earth-700" />
          Notifications
        </h1>
        <button
          onClick={handleMarkAllAsRead}
          disabled={markingAll}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-earth-500 hover:text-earth-900 disabled:opacity-40 transition-colors"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          {markingAll ? 'Marking...' : 'Mark all read'}
        </button>
      </div>
      <div className="h-px bg-earth-200 mb-8" />

      {notifications.length === 0 ? (
        <div className="border border-earth-200 p-16 text-center">
          <Bell className="h-12 w-12 text-earth-200 mx-auto mb-4" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-earth-400 mb-1">All clear</p>
          <p className="text-sm text-earth-500">No notifications yet.</p>
        </div>
      ) : (
        <div className="border border-earth-200 divide-y divide-earth-100">
          {notifications.map((item) => (
            <div
              key={item._id}
              className={`p-4 transition-colors ${
                item.isRead ? 'bg-white' : 'bg-earth-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {!item.isRead && (
                    <span className="inline-block w-1.5 h-1.5 bg-earth-900 rounded-full mb-2" />
                  )}
                  <p className="text-sm font-bold text-earth-900 uppercase tracking-tight">{item.title}</p>
                  <p className="text-sm text-earth-600 mt-1 leading-relaxed">{item.message}</p>
                  <p className="text-xs text-earth-400 mt-2 font-mono">
                    {new Date(item.createdAt).toLocaleString('en-GH')}
                  </p>
                  {item.link && (
                    <Link
                      to={item.link}
                      className="inline-block mt-2 text-xs font-bold uppercase tracking-[0.12em] text-earth-900 underline underline-offset-2 hover:text-earth-600"
                    >
                      View details
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!item.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(item._id)}
                      className="p-1.5 text-earth-400 hover:text-earth-900 hover:bg-earth-100 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 text-earth-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-10">
          <button
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1 || loading}
            className="px-5 py-2 border border-earth-300 text-xs font-bold uppercase tracking-[0.15em] text-earth-700 hover:border-earth-900 hover:text-earth-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => setPage((prev) => Math.min(pagination.pages, prev + 1))}
            disabled={page >= pagination.pages || loading}
            className="px-5 py-2 border border-earth-300 text-xs font-bold uppercase tracking-[0.15em] text-earth-700 hover:border-earth-900 hover:text-earth-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;
