import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Package,
  RefreshCw,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  canUseBackend,
  fetchNotificationsData,
  markBackendNotificationRead,
  parseSupabaseError,
  type BackendNotification,
} from '../lib/backend';
import { hasActiveSupabaseSession } from '../lib/supabase';

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  category: string;
  status: string;
  priority: string;
  icon: LucideIcon;
  color: string;
};

const iconByCategory: Record<string, LucideIcon> = {
  Appointments: CalendarClock,
  Inventory: Package,
  Billing: CreditCard,
  Reports: ClipboardList,
};

const categoryStyles: Record<string, { bg: string; text: string; accent: string }> = {
  Appointments: { bg: 'bg-[#8F609A]/10', text: 'text-[#8F609A]', accent: '#8F609A' },
  Inventory: { bg: 'bg-[#F0A500]/10', text: 'text-[#A86F00]', accent: '#F0A500' },
  Billing: { bg: 'bg-secondary', text: 'text-primary', accent: '#C9A96E' },
  Reports: { bg: 'bg-[#2ECC8A]/10', text: 'text-[#159B61]', accent: '#2ECC8A' },
};

const priorityStyles: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive',
  Medium: 'bg-[#F0A500]/10 text-[#A86F00]',
  Normal: 'bg-muted text-muted-foreground',
};

const filters = [
  { key: 'All', label: 'All' },
  { key: 'Unread', label: 'Unread' },
  { key: 'Appointments', label: 'Appointments' },
  { key: 'Billing', label: 'Billing' },
  { key: 'Inventory', label: 'Inventory' },
] as const;

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const formatRelativeTime = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const mapBackendNotification = (notification: BackendNotification): NotificationItem => {
  const style = categoryStyles[notification.category] || categoryStyles.Billing;
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    time: formatRelativeTime(notification.created_at),
    category: notification.category,
    status: notification.status,
    priority: notification.priority,
    icon: iconByCategory[notification.category] || Bell,
    color: style.accent,
  };
};

const initialNotifications: NotificationItem[] = [
  {
    id: 'demo-1',
    title: 'Emma Wilson appointment starts in 20 minutes',
    message: 'Hydrating facial treatment is scheduled for Room 2 with notes updated by reception.',
    time: '10m ago',
    category: 'Appointments',
    status: 'Unread',
    priority: 'High',
    icon: CalendarClock,
    color: '#8F609A',
  },
  {
    id: 'demo-2',
    title: 'Low stock: Retinol Night Cream',
    message: 'Current quantity is 5. Minimum stock level is 15. Create a purchase order soon.',
    time: '28m ago',
    category: 'Inventory',
    status: 'Unread',
    priority: 'High',
    icon: Package,
    color: '#F0A500',
  },
  {
    id: 'demo-3',
    title: 'Invoice INV-1232 is pending',
    message: 'Michael Brown has a pending invoice of PKR 580 from the latest visit.',
    time: '1h ago',
    category: 'Billing',
    status: 'Unread',
    priority: 'Medium',
    icon: CreditCard,
    color: '#C9A96E',
  },
];

export default function Notifications() {
  const backendEnabled = canUseBackend();
  const backendSyncEnabled = backendEnabled && hasActiveSupabaseSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => (backendEnabled ? [] : initialNotifications));
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [backendError, setBackendError] = useState('');
  const [isLoading, setIsLoading] = useState(backendSyncEnabled);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = useCallback(async (silent = false) => {
    if (!backendSyncEnabled) {
      setBackendError('');
      setIsLoading(false);
      return;
    }

    if (silent) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const rows = await fetchNotificationsData();
      setNotifications(rows.map(mapBackendNotification));
      setBackendError('');
    } catch (error) {
      setBackendError(
        `Could not load notifications. ${parseSupabaseError(error)}`,
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [backendSyncEnabled]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    if (backendSyncEnabled) {
      try {
        await markBackendNotificationRead(id);
      } catch (error) {
        setBackendError(parseSupabaseError(error));
        return;
      }
    }
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'Read' } : item)));
  };

  const markAllRead = async () => {
    const unread = notifications.filter((item) => item.status === 'Unread');
    for (const item of unread) {
      if (backendSyncEnabled) {
        try {
          await markBackendNotificationRead(item.id);
        } catch {
          continue;
        }
      }
    }
    setNotifications((prev) => prev.map((item) => ({ ...item, status: 'Read' })));
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesFilter =
      activeFilter === 'All' ||
      notification.status === activeFilter ||
      notification.category === activeFilter;
    const matchesSearch = `${notification.title} ${notification.message} ${notification.category}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((notification) => notification.status === 'Unread').length;
  const highPriorityCount = notifications.filter(
    (notification) => notification.priority === 'High' && notification.status === 'Unread',
  ).length;
  const hasActiveFilters = activeFilter !== 'All' || query.trim().length > 0;

  const filterCounts = filters.reduce<Record<string, number>>((acc, filter) => {
    if (filter.key === 'All') acc[filter.key] = notifications.length;
    else if (filter.key === 'Unread') acc[filter.key] = unreadCount;
    else acc[filter.key] = notifications.filter((item) => item.category === filter.key).length;
    return acc;
  }, {});

  return (
    <div className="space-y-4 md:space-y-5">
      {backendEnabled && !backendSyncEnabled && (
        <div className="rounded-lg border border-[#F0A500]/30 bg-[#F0A500]/10 px-4 py-3 text-[13px] text-[#A86F00]">
          Sign in with your Supabase staff account to load live notifications.
        </div>
      )}

      {backendError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-[13px] font-medium text-destructive">
          {backendError}
        </div>
      )}

      {/* Stats + toolbar */}
      <Panel className="p-4">
        <div className="mb-3 grid grid-cols-3 gap-2 border-b border-border pb-4">
          <StatCard label="Unread" value={unreadCount} accent={unreadCount > 0} />
          <StatCard label="High priority" value={highPriorityCount} accent={highPriorityCount > 0} warn />
          <StatCard label="Total" value={notifications.length} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by client, invoice, or product…"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="flex shrink-0 gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex h-10 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-muted">
                  <CheckCheck size={15} />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => loadNotifications(true)}
                disabled={isRefreshing || isLoading}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50">
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  activeFilter === filter.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}>
                {filter.label}
                <span className="ml-1.5 tabular-nums opacity-70">({filterCounts[filter.key] ?? 0})</span>
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {/* List */}
      <Panel className="overflow-hidden p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="mt-3 text-[13px] text-muted-foreground">Loading notifications…</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            hasActiveFilters={hasActiveFilters}
            backendSyncEnabled={backendSyncEnabled}
          />
        ) : (
          <div className="divide-y divide-border">
            <AnimatePresence initial={false}>
              {filteredNotifications.map((notification, index) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  index={index}
                  onMarkRead={() => markRead(notification.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </Panel>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent = false,
  warn = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-lg bg-muted/30 px-3 py-2.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        style={{ fontFamily: 'var(--font-heading)' }}
        className={`mt-0.5 text-xl font-semibold tabular-nums ${
          accent ? (warn ? 'text-[#A86F00]' : 'text-primary') : 'text-foreground'
        }`}>
        {value}
      </p>
    </div>
  );
}

function NotificationRow({
  notification,
  index,
  onMarkRead,
}: {
  notification: NotificationItem;
  index: number;
  onMarkRead: () => void;
}) {
  const Icon = notification.icon;
  const isUnread = notification.status === 'Unread';
  const categoryStyle = categoryStyles[notification.category] || categoryStyles.Billing;
  const priorityClass = priorityStyles[notification.priority] || priorityStyles.Normal;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      className={`group relative bg-card transition-colors hover:bg-muted/20 ${
        isUnread ? 'bg-secondary/10' : ''
      }`}>
      {isUnread && (
        <span className="absolute left-0 top-0 h-full w-[3px] rounded-r-full bg-primary" />
      )}

      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4 md:p-5">
        <div className="flex min-w-0 gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${categoryStyle.bg} ${categoryStyle.text}`}>
            <Icon size={20} strokeWidth={1.75} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[14px] font-semibold leading-snug text-foreground md:text-[15px]">
                {notification.title}
              </h3>
              {isUnread && (
                <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-destructive" aria-label="Unread" />
              )}
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {notification.message}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${categoryStyle.bg} ${categoryStyle.text}`}>
                {notification.category}
              </span>
              <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${priorityClass}`}>
                {notification.priority}
              </span>
              <span className="text-[11px] text-muted-foreground/80">{notification.time}</span>
            </div>
          </div>
        </div>

        {isUnread && (
          <button
            type="button"
            onClick={onMarkRead}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-border bg-background px-3.5 text-[12px] font-medium text-foreground opacity-100 transition-all hover:border-primary/30 hover:bg-secondary/40 sm:opacity-0 sm:group-hover:opacity-100">
            <CheckCircle2 size={14} />
            Mark read
          </button>
        )}
      </div>
    </motion.article>
  );
}

function EmptyState({
  hasActiveFilters,
  backendSyncEnabled,
}: {
  hasActiveFilters: boolean;
  backendSyncEnabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center md:py-20">
      <div className="relative mb-5">
        <div className="absolute inset-0 scale-150 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
          {hasActiveFilters ? (
            <Search size={28} strokeWidth={1.5} className="text-muted-foreground/50" />
          ) : (
            <Sparkles size={28} strokeWidth={1.5} className="text-primary/70" />
          )}
        </div>
      </div>

      <h3
        style={{ fontFamily: 'var(--font-heading)' }}
        className="text-lg font-semibold text-foreground">
        {hasActiveFilters ? 'No matching notifications' : 'All caught up'}
      </h3>

      <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        {hasActiveFilters
          ? 'Try a different search term or filter to find what you need.'
          : backendSyncEnabled
            ? 'No appointment reminders, stock alerts, or billing updates right now. New alerts appear automatically from your clinic data.'
            : 'Connect Supabase and sign in to receive live clinic alerts here.'}
      </p>

      {!hasActiveFilters && backendSyncEnabled && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['Appointments', 'Inventory', 'Billing'].map((label) => (
            <span
              key={label}
              className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
