import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Filter,
  Package,
  Search,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { canUseBackend, fetchNotifications, markBackendNotificationRead, type BackendNotification } from '../lib/backend';

type NotificationItem = {
  id: string | number;
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
  System: ShieldCheck,
};

const colorByCategory: Record<string, string> = {
  Appointments: '#8F609A',
  Inventory: '#F0A500',
  Billing: '#C9A96E',
  Reports: '#2ECC8A',
  System: '#1A1025',
};

const formatRelativeTime = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const mapBackendNotification = (notification: BackendNotification): NotificationItem => ({
  id: notification.id,
  title: notification.title,
  message: notification.message,
  time: formatRelativeTime(notification.created_at),
  category: notification.category,
  status: notification.status,
  priority: notification.priority,
  icon: iconByCategory[notification.category] || Bell,
  color: colorByCategory[notification.category] || '#1A1025',
});

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    title: 'Emma Wilson appointment starts in 20 minutes',
    message: 'Hydrating facial treatment is scheduled for Room 2 with notes updated by reception.',
    time: '10 min ago',
    category: 'Appointments',
    status: 'Unread',
    priority: 'High',
    icon: CalendarClock,
    color: '#8F609A',
  },
  {
    id: 2,
    title: 'Low stock: Retinol Night Cream',
    message: 'Current quantity is 5. Minimum stock level is 15. Create a purchase order soon.',
    time: '28 min ago',
    category: 'Inventory',
    status: 'Unread',
    priority: 'High',
    icon: Package,
    color: '#F0A500',
  },
  {
    id: 3,
    title: 'Invoice INV-1232 is pending',
    message: 'Michael Brown has a pending invoice of PKR 580 from the latest visit.',
    time: '1 hr ago',
    category: 'Billing',
    status: 'Unread',
    priority: 'Medium',
    icon: CreditCard,
    color: '#C9A96E',
  },
  {
    id: 4,
    title: 'Daily checkout summary is ready',
    message: 'Today generated PKR 8,250 across 89 products sold and 12 completed appointments.',
    time: '2 hrs ago',
    category: 'Reports',
    status: 'Read',
    priority: 'Normal',
    icon: ClipboardList,
    color: '#2ECC8A',
  },
  {
    id: 5,
    title: 'Security check completed',
    message: 'Staff access permissions and dashboard session activity were verified successfully.',
    time: '4 hrs ago',
    category: 'System',
    status: 'Read',
    priority: 'Normal',
    icon: ShieldCheck,
    color: '#1A1025',
  },
];

const filters = ['All', 'Unread', 'Appointments', 'Billing', 'Inventory', 'System'];

export default function Notifications() {
  const backendEnabled = canUseBackend();
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => (canUseBackend() ? [] : initialNotifications));
  const [activeFilter, setActiveFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [backendError, setBackendError] = useState('');

  useEffect(() => {
    if (!backendEnabled) return;
    let ignore = false;
    fetchNotifications()
      .then((rows) => {
        if (!ignore) {
          setNotifications(rows.map(mapBackendNotification));
          setBackendError('');
        }
      })
      .catch(() => {
        if (!ignore) setBackendError('Could not load notifications from Supabase. Please run notifications_backend_setup.sql.');
      });
    return () => {
      ignore = true;
    };
  }, [backendEnabled]);

  const markRead = async (id: string | number) => {
    if (backendEnabled && typeof id === 'string') {
      await markBackendNotificationRead(id);
    }
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'Read' } : item)));
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
  const highPriorityCount = notifications.filter((notification) => notification.priority === 'High').length;

  return (
    <div className="space-y-5 md:space-y-7">
      {backendError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-[13px] font-medium text-destructive">
          {backendError}
        </div>
      )}

      <section
        className="relative overflow-hidden rounded-lg border border-white/80 p-5 text-[#FFF7E8] shadow-[0_24px_70px_rgba(26,16,37,0.14)] md:p-7"
        style={{
          background:
            'radial-gradient(circle at 14% 12%, rgba(240, 207, 130, 0.18), transparent 32%), radial-gradient(circle at 88% 30%, rgba(143, 96, 154, 0.2), transparent 28%), linear-gradient(135deg, #160C20 0%, #241631 58%, #34213A 100%)',
        }}>
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#F2D794]/20 bg-white/[0.07] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#F2D794]">
              <Bell size={14} />
              Staff notification center
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
              Keep every clinic update in one calm, focused view.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#F8EEDB]/68 md:text-base">
              Review appointment reminders, billing updates, stock alerts, and system activity before they become delays.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[340px]">
            <SummaryCard label="Unread" value={unreadCount.toString()} icon={<Bell size={18} />} />
            <SummaryCard label="High priority" value={highPriorityCount.toString()} icon={<AlertTriangle size={18} />} />
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8390]" size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notifications by client, invoice, inventory, or system update"
              className="h-14 w-full rounded-lg border border-[#E8DFD4] bg-white/95 pl-12 pr-4 shadow-[0_14px_35px_rgba(26,16,37,0.06)] outline-none transition-all focus:border-[#C9A96E] focus:ring-4 focus:ring-[#C9A96E]/18"
            />
          </div>

          <button
            onClick={() => setShowFilters((value) => !value)}
            className={`flex h-14 items-center justify-center gap-2 rounded-lg border px-5 font-semibold shadow-[0_14px_35px_rgba(26,16,37,0.06)] transition-all lg:min-w-[150px] ${
              showFilters
                ? 'border-[#D1AD69] bg-[#D1AD69] text-[#1A1025]'
                : 'border-[#E8DFD4] bg-white/95 text-[#6B6570] hover:border-[#D1AD69] hover:text-[#1A1025]'
            }`}>
            <Filter size={18} />
            Filter
            {activeFilter !== 'All' && (
              <span className="rounded-full bg-[#1A1025] px-2 py-0.5 text-xs text-white">
                {activeFilter}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="rounded-lg border border-[#E8DFD4] bg-white/95 p-3 shadow-[0_14px_35px_rgba(26,16,37,0.06)]">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setActiveFilter(filter);
                    setShowFilters(false);
                  }}
                  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-all ${
                    activeFilter === filter
                      ? 'border-[#D1AD69] bg-[#D1AD69] text-[#1A1025] shadow-[0_10px_24px_rgba(209,173,105,0.2)]'
                      : 'border-[#E8DFD4] bg-white text-[#6B6570] hover:border-[#D1AD69] hover:text-[#1A1025]'
                  }`}>
                  {filter}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const Icon = notification.icon;
          const isUnread = notification.status === 'Unread';

          return (
            <article
              key={notification.id}
              className={`rounded-lg border bg-white/95 p-4 shadow-[0_16px_45px_rgba(26,16,37,0.07)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(26,16,37,0.1)] md:p-5 ${
                isUnread ? 'border-[#D1AD69]/45' : 'border-white/80'
              }`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white shadow-[0_12px_28px_rgba(26,16,37,0.1)]"
                    style={{ background: notification.color }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[#1A1025] md:text-lg">{notification.title}</h3>
                      {isUnread && <span className="h-2 w-2 rounded-full bg-[#E5445A]" />}
                    </div>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[#6B6570]">{notification.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-[#F7EFE1] px-3 py-1 text-[#A67F3F]">{notification.category}</span>
                      <span className="rounded-full bg-[#F8F5F0] px-3 py-1 text-[#6B6570]">{notification.priority}</span>
                      <span className="text-[#8C8390]">{notification.time}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => markRead(notification.id)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E8DFD4] bg-white px-4 text-sm font-semibold text-[#6B6570] transition-colors hover:border-[#D1AD69] hover:text-[#1A1025]">
                  <CheckCircle2 size={16} />
                  Mark read
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="rounded-lg border border-white/80 bg-white/95 p-10 text-center shadow-[0_16px_45px_rgba(26,16,37,0.07)]">
          <Bell className="mx-auto text-[#C9A96E]" size={34} />
          <h3 className="mt-3 text-lg font-bold text-[#1A1025]">No notifications found</h3>
          <p className="mt-1 text-sm text-[#6B6570]">Try a different filter or search term.</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F2D794] text-[#1A1025]">
        {icon}
      </div>
      <p className="text-3xl font-bold text-[#F2D794]">{value}</p>
      <p className="mt-1 text-xs text-[#F8EEDB]/62">{label}</p>
    </div>
  );
}
