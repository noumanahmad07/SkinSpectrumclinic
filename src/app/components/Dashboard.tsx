import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CalendarClock,
  FileText,
  Package,
  TrendingUp,
  Users,
  X,
  Phone,
  Mail,
  Wallet,
  ChevronRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  canUseBackend,
  fetchDashboardData,
  type BackendClient,
  type DashboardLowStock,
  type DashboardRecentInvoice,
  type DashboardRevenuePoint,
  type DashboardSummary,
  type DashboardTopProduct,
} from '../lib/backend';

const revenueData = [
  { day: 'Mon', revenue: 4500 },
  { day: 'Tue', revenue: 5200 },
  { day: 'Wed', revenue: 4800 },
  { day: 'Thu', revenue: 6100 },
  { day: 'Fri', revenue: 7300 },
  { day: 'Sat', revenue: 8200 },
  { day: 'Sun', revenue: 5900 },
];

const topProductsData = [
  { name: 'Hydrating Serum', value: 42, color: '#C9A96E' },
  { name: 'Anti-Aging Cream', value: 28, color: '#A07840' },
  { name: 'Facial Treatment', value: 18, color: '#2ECC8A' },
  { name: 'Vitamin C Serum', value: 12, color: '#F0A500' },
];

const recentInvoices = [
  { id: 'INV-1234', client: 'Emma Wilson', date: '2026-05-25', amount: 450, status: 'Paid' },
  { id: 'INV-1233', client: 'Sarah Johnson', date: '2026-05-24', amount: 320, status: 'Paid' },
  { id: 'INV-1232', client: 'Michael Brown', date: '2026-05-24', amount: 580, status: 'Pending' },
  { id: 'INV-1231', client: 'Jessica Davis', date: '2026-05-23', amount: 210, status: 'Paid' },
  { id: 'INV-1230', client: 'David Miller', date: '2026-05-22', amount: 890, status: 'Overdue' },
];

const lowStockItems = [
  { product: 'Hydrating Serum', current: 8, minimum: 20, category: 'Serums' },
  { product: 'Retinol Night Cream', current: 5, minimum: 15, category: 'Creams' },
  { product: 'Vitamin C Serum', current: 12, minimum: 25, category: 'Serums' },
];

interface StoredClient {
  id: number | string;
  name: string;
  phone: string;
  email?: string;
  skinType?: string;
  totalSpent?: number;
  concerns?: string[];
  allergies?: string;
  notes?: string;
  followUpDate?: string;
  followUpDays?: number;
  appointmentDate?: string;
  appointmentTime?: string;
}

type AppointmentClient = StoredClient & { appointmentAt: Date };

const CLIENTS_STORAGE_KEY = 'skinspectrum_clients';

const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

const getDueFollowUps = () => {
  const savedClients = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
  const clients: StoredClient[] = savedClients ? JSON.parse(savedClients) : [];
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(23, 59, 59, 999);

  return clients.filter((client) => {
    if (!client.followUpDate) return false;
    const followUpDate = new Date(client.followUpDate);
    followUpDate.setHours(12, 0, 0, 0);
    return followUpDate >= today && followUpDate <= tomorrow;
  });
};

const getClientAppointments = () => {
  const savedClients = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
  const clients: StoredClient[] = savedClients ? JSON.parse(savedClients) : [];

  return clients
    .filter((client) => client.appointmentDate && client.appointmentTime)
    .map((client) => ({
      ...client,
      appointmentAt: new Date(`${client.appointmentDate}T${client.appointmentTime}`),
    }))
    .filter((client) => !Number.isNaN(client.appointmentAt.getTime()))
    .sort((a, b) => a.appointmentAt.getTime() - b.appointmentAt.getTime());
};

const mapBackendClient = (client: BackendClient): StoredClient => ({
  id: client.id,
  name: client.name,
  phone: client.phone,
  email: client.email || undefined,
  skinType: client.skin_type,
  totalSpent: Number(client.total_spent || 0),
  concerns: client.concerns || [],
  allergies: client.allergies,
  notes: client.notes,
  followUpDays: client.follow_up_days || undefined,
  followUpDate: client.follow_up_date || undefined,
  appointmentDate: client.appointment_date || undefined,
  appointmentTime: client.appointment_time || undefined,
});

const buildAppointments = (clients: StoredClient[]) =>
  clients
    .filter((client) => client.appointmentDate && client.appointmentTime)
    .map((client) => ({
      ...client,
      appointmentAt: new Date(`${client.appointmentDate}T${client.appointmentTime}`),
    }))
    .filter((client) => !Number.isNaN(client.appointmentAt.getTime()))
    .sort((a, b) => a.appointmentAt.getTime() - b.appointmentAt.getTime());

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-[15px] font-semibold text-foreground">
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export default function Dashboard() {
  const backendEnabled = canUseBackend();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<{
    summary: DashboardSummary | null;
    revenueTrend: DashboardRevenuePoint[];
    topProducts: DashboardTopProduct[];
    recentInvoices: DashboardRecentInvoice[];
    lowStock: DashboardLowStock[];
    todayAppointments: BackendClient[];
    upcomingAppointments: BackendClient[];
    dueFollowUps: BackendClient[];
  } | null>(null);
  const [backendError, setBackendError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentClient | null>(null);
  const now = new Date();

  useEffect(() => {
    if (!backendEnabled) return;

    fetchDashboardData()
      .then(setDashboardData)
      .catch(() => setBackendError('Dashboard backend data could not be loaded.'));
  }, [backendEnabled]);

  const localDueFollowUps = getDueFollowUps();
  const localAppointments = getClientAppointments();
  const dueFollowUps = dashboardData?.dueFollowUps.length
    ? dashboardData.dueFollowUps.map(mapBackendClient)
    : backendEnabled ? [] : localDueFollowUps;
  const appointments = dashboardData?.todayAppointments.length
    ? buildAppointments(dashboardData.todayAppointments.map(mapBackendClient))
    : backendEnabled ? [] : localAppointments;
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const upcomingAppointments = dashboardData?.upcomingAppointments.length
    ? buildAppointments(dashboardData.upcomingAppointments.map(mapBackendClient))
    : backendEnabled ? [] : appointments.filter((client) => client.appointmentAt >= now && client.appointmentAt <= oneHourFromNow);
  const todayAppointments = appointments.filter((client) => client.appointmentAt >= todayStart && client.appointmentAt <= todayEnd);

  const dashboardSummary = dashboardData?.summary;
  const dashboardRevenueData = dashboardData?.revenueTrend.length
    ? dashboardData.revenueTrend.map((point) => ({ day: point.day, revenue: Number(point.revenue) }))
    : backendEnabled ? [] : revenueData;
  const dashboardTopProducts = dashboardData?.topProducts.length
    ? dashboardData.topProducts.map((item, index) => ({
        name: item.name,
        value: Number(item.value || 0),
        color: ['#C9A96E', '#A07840', '#2ECC8A', '#F0A500', '#8F609A'][index] || '#6B6570',
      }))
    : backendEnabled ? [] : topProductsData;
  const dashboardRecentInvoices = dashboardData?.recentInvoices.length ? dashboardData.recentInvoices : backendEnabled ? [] : recentInvoices;
  const dashboardLowStock = dashboardData?.lowStock.length ? dashboardData.lowStock : backendEnabled ? [] : lowStockItems;

  const pendingInvoices = dashboardRecentInvoices.filter((i) => i.status === 'Pending' || i.status === 'Overdue' || i.status === 'Credit');
  const pendingTotal = pendingInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);

  const quickStats = [
    { value: String(dashboardSummary?.appointments_today ?? todayAppointments.length), label: 'Appointments today' },
    { value: String(dashboardSummary?.pending_invoices ?? pendingInvoices.length), label: 'Pending checkouts' },
    { value: formatCurrency(dashboardSummary?.pending_invoice_amount ?? pendingTotal), label: 'Outstanding invoices' },
    { value: String(dashboardSummary?.stock_alerts ?? dashboardLowStock.length), label: 'Stock alerts' },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {backendError && (
        <div className="rounded-lg border border-[#F0A500]/20 bg-[#FFF8E8] px-4 py-3 text-sm font-medium text-[#A86F00]">
          {backendError}
        </div>
      )}

      {/* Welcome strip */}
      <section className="relative overflow-hidden rounded-xl border border-[#2D1F3D]/20 bg-[#1A1025] px-5 py-5 md:px-6 md:py-6">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#C9A96E]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-[#2ECC8A]/8 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#C9A96E]/80">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2ECC8A] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2ECC8A]" />
              </span>
              Live overview
            </p>
            <h2
              style={{ fontFamily: 'var(--font-heading)' }}
              className="mt-2 text-xl font-semibold leading-snug text-white md:text-2xl">
              Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'} — here&apos;s your clinic at a glance.
            </h2>
            <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-[#F5ECD7]/55">
              Revenue, appointments, inventory, and billing — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[420px]">
            {quickStats.map(({ value, label }) => (
              <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2.5">
                <p style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-semibold tabular-nums text-[#E8C98A]">
                  {value}
                </p>
                <p className="mt-0.5 text-[11px] leading-tight text-[#F5ECD7]/45">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KPICard
          title="Today's Revenue"
          value={formatCurrency(dashboardSummary?.today_revenue ?? 0)}
          change="+12.5%"
          icon={<Banknote size={18} strokeWidth={1.75} />}
          trend="up"
          accent="success"
        />
        <KPICard
          title="Total Clients"
          value={String(dashboardSummary?.total_clients ?? 0)}
          change="+8 new"
          icon={<Users size={18} strokeWidth={1.75} />}
          trend="up"
          accent="plum"
        />
        <KPICard
          title="Pending Invoices"
          value={String(dashboardSummary?.pending_invoices ?? 0)}
          change={formatCurrency(dashboardSummary?.pending_invoice_amount ?? 0)}
          icon={<FileText size={18} strokeWidth={1.75} />}
          trend="neutral"
          accent="warning"
        />
        <KPICard
          title="Products Sold"
          value={String(dashboardSummary?.products_sold ?? 0)}
          change="+15.2%"
          icon={<Package size={18} strokeWidth={1.75} />}
          trend="up"
          accent="gold"
        />
      </div>

      {upcomingAppointments.length > 0 && (
        <Panel className="border-[#2ECC8A]/20 bg-[#2ECC8A]/[0.04]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2ECC8A]/15 text-[#159B61]">
                <CalendarClock size={17} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">Upcoming in the next hour</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {upcomingAppointments.length} appointment{upcomingAppointments.length === 1 ? '' : 's'} starting soon.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[480px]">
              {upcomingAppointments.slice(0, 4).map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedAppointment(client)}
                  className="group flex items-center justify-between rounded-lg border border-[#2ECC8A]/15 bg-card px-3.5 py-2.5 text-left transition-colors hover:border-[#2ECC8A]/40">
                  <div>
                    <div className="text-[13px] font-medium text-foreground">{client.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {client.appointmentAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {client.phone}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground/40 transition-colors group-hover:text-[#2ECC8A]" />
                </button>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {todayAppointments.length > 0 && (
        <Panel>
          <PanelHeader
            title="Today's Appointments"
            subtitle={`${todayAppointments.length} scheduled for ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
            action={
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
                <CalendarDays size={15} strokeWidth={1.75} />
              </div>
            }
          />
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {todayAppointments.slice(0, 8).map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelectedAppointment(client)}
                className="group rounded-lg border border-border bg-background px-3.5 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-secondary/40">
                <div className="text-[13px] font-medium text-foreground">{client.name}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {client.appointmentAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {client.phone}
                </div>
              </button>
            ))}
          </div>
        </Panel>
      )}

      {dueFollowUps.length > 0 && (
        <Panel className="border-[#C9A96E]/20 bg-[#C9A96E]/[0.04]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C9A96E]/15 text-[#A07840]">
                <CalendarClock size={17} strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">Follow-up reminders</h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">Clients due for follow-up today or tomorrow.</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[480px]">
              {dueFollowUps.slice(0, 4).map((client) => (
                <div key={client.id} className="rounded-lg border border-[#C9A96E]/15 bg-card px-3.5 py-2.5">
                  <div className="text-[13px] font-medium text-foreground">{client.name}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(client.followUpDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {client.phone}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-5">
        <Panel className="lg:col-span-3">
          <PanelHeader
            title="Revenue Trend"
            subtitle="Last 7 days"
            action={
              <span className="inline-flex items-center gap-1 rounded-md bg-[#2ECC8A]/10 px-2 py-1 text-[12px] font-medium text-[#159B61]">
                <TrendingUp size={13} strokeWidth={2} />
                +18.3%
              </span>
            }
          />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={dashboardRevenueData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A96E" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#C9A96E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E3" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B6570' }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B6570' }}
                tickFormatter={(value) => `${value / 1000}k`}
                width={40}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #EDE8E3',
                  borderRadius: '8px',
                  boxShadow: '0 4px 16px rgba(26,16,37,0.06)',
                  fontSize: '13px',
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={2} fill="url(#revenueFill)" dot={false} activeDot={{ r: 4, fill: '#C9A96E', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader title="Top Products" subtitle="Retail mix by share" />
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={dashboardTopProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none">
                  {dashboardTopProducts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, 'Share']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #EDE8E3',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(26,16,37,0.06)',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-full flex-1 space-y-2">
              {dashboardTopProducts.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-[13px] text-foreground">{item.name}</span>
                  </div>
                  <span className="shrink-0 text-[13px] font-medium tabular-nums text-muted-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <Panel>
          <PanelHeader title="Recent Invoices" subtitle="Latest billing activity" />
          <div className="overflow-x-auto -mx-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2.5 pl-1 pr-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Invoice</th>
                  <th className="pb-2.5 px-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Client</th>
                  <th className="pb-2.5 px-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Amount</th>
                  <th className="pb-2.5 pl-2 pr-1 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardRecentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/30">
                    <td className="py-2.5 pl-1 pr-2">
                      <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[12px] font-medium text-primary">
                        {invoice.id}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-[13px] text-foreground">{invoice.client}</td>
                    <td className="py-2.5 px-2 text-[13px] font-medium tabular-nums text-foreground">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="py-2.5 pl-2 pr-1">
                      <StatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Low Stock Alerts"
            subtitle="Items below minimum threshold"
            action={
              <span className="rounded-md bg-[#F0A500]/10 px-2 py-1 text-[11px] font-medium text-[#A86F00]">
                {dashboardLowStock.length} items
              </span>
            }
          />
          <div className="space-y-3">
            {dashboardLowStock.map((item) => {
              const pct = Math.min((item.current / item.minimum) * 100, 100);
              return (
                <div key={item.product} className="rounded-lg border border-[#F0A500]/15 bg-[#F0A500]/[0.03] p-3.5">
                  <div className="mb-2.5 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-medium text-foreground">{item.product}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{item.category}</div>
                    </div>
                    <span className="shrink-0 rounded-md bg-[#F0A500]/12 px-1.5 py-0.5 text-[10px] font-medium text-[#A86F00]">
                      Low
                    </span>
                  </div>
                  <div className="mb-2 flex items-center gap-3 text-[12px] text-muted-foreground">
                    <span>
                      Stock: <strong className="font-medium text-[#F0A500]">{item.current}</strong>
                    </span>
                    <span className="text-border">·</span>
                    <span>
                      Min: <strong className="font-medium text-foreground">{item.minimum}</strong>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E5445A] to-[#F0A500] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-0 sm:items-center sm:p-4"
          onClick={() => setSelectedAppointment(null)}>
          <div
            className="w-full max-w-lg rounded-t-2xl bg-card shadow-xl sm:rounded-xl"
            onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-8 rounded-full bg-border" />
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Appointment</p>
                <h3 style={{ fontFamily: 'var(--font-heading)' }} className="mt-0.5 text-lg font-semibold text-foreground">
                  {selectedAppointment.name}
                </h3>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {selectedAppointment.appointmentAt.toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-background p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Phone size={12} />
                    Phone
                  </div>
                  <div className="text-[13px] font-medium text-foreground">{selectedAppointment.phone}</div>
                </div>
                <div className="rounded-lg bg-background p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Wallet size={12} />
                    Total Spent
                  </div>
                  <div className="text-[13px] font-semibold text-primary">{formatCurrency(selectedAppointment.totalSpent || 0)}</div>
                </div>
              </div>

              {selectedAppointment.email && (
                <div className="rounded-lg border border-border p-3.5">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <Mail size={12} />
                    Email
                  </div>
                  <div className="text-[13px] text-foreground">{selectedAppointment.email}</div>
                </div>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-3.5">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Skin Type</div>
                  <div className="mt-1 text-[13px] font-medium text-foreground">{selectedAppointment.skinType || 'Not set'}</div>
                </div>
                <div className="rounded-lg border border-border p-3.5">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Follow Up</div>
                  <div className="mt-1 text-[13px] font-medium text-foreground">
                    {selectedAppointment.followUpDate
                      ? new Date(selectedAppointment.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Not set'}
                  </div>
                </div>
              </div>

              {selectedAppointment.concerns && selectedAppointment.concerns.length > 0 && (
                <div className="rounded-lg border border-border p-3.5">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Skin Concerns</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedAppointment.concerns.map((concern) => (
                      <span key={concern} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary">
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border p-3.5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Allergies</div>
                <div className="mt-1 text-[13px] text-foreground">{selectedAppointment.allergies || 'None'}</div>
              </div>

              {selectedAppointment.notes && (
                <div className="rounded-lg bg-background p-3.5">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Notes</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-foreground">{selectedAppointment.notes}</p>
                </div>
              )}

              <button
                onClick={() => navigate('/pos', {
                  state: {
                    clientName: selectedAppointment.name,
                    clientPhone: selectedAppointment.phone,
                    appointmentId: selectedAppointment.id,
                  },
                })}
                className="w-full rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                Open in POS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const accentStyles = {
  success: { icon: 'bg-[#2ECC8A]/10 text-[#159B61]', bar: 'bg-[#2ECC8A]' },
  plum: { icon: 'bg-[#8F609A]/10 text-[#8F609A]', bar: 'bg-[#8F609A]' },
  warning: { icon: 'bg-[#F0A500]/10 text-[#A86F00]', bar: 'bg-[#F0A500]' },
  gold: { icon: 'bg-[#C9A96E]/10 text-[#A07840]', bar: 'bg-[#C9A96E]' },
} as const;

function KPICard({
  title,
  value,
  change,
  icon,
  trend,
  accent,
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  accent: keyof typeof accentStyles;
}) {
  const styles = accentStyles[accent];
  const trendColor = trend === 'up' ? 'text-[#159B61]' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles.icon}`}>
          {icon}
        </div>
        <div className={`flex items-center gap-0.5 text-[11px] font-medium ${trendColor}`}>
          {trend === 'up' && <ArrowUpRight size={12} strokeWidth={2} />}
          {change}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-[12px] text-muted-foreground">{title}</p>
        <p style={{ fontFamily: 'var(--font-heading)' }} className="mt-1 text-xl font-semibold tabular-nums leading-none text-foreground md:text-[22px]">
          {value}
        </p>
      </div>
      <div className={`mt-3 h-0.5 w-8 rounded-full ${styles.bar}`} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Paid: 'bg-[#2ECC8A]/10 text-[#159B61]',
    Pending: 'bg-[#F0A500]/10 text-[#A86F00]',
    Overdue: 'bg-destructive/10 text-destructive',
    Credit: 'bg-[#F0A500]/10 text-[#A86F00]',
  };

  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
}
