import { useState } from 'react';
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
  Wallet
} from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock Data
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
  id: number;
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

export default function Dashboard() {
  const navigate = useNavigate();
  const dueFollowUps = getDueFollowUps();
  const appointments = getClientAppointments();
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentClient | null>(null);
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const upcomingAppointments = appointments.filter(
    (client) => client.appointmentAt >= now && client.appointmentAt <= oneHourFromNow
  );
  const todayAppointments = appointments.filter(
    (client) => client.appointmentAt >= todayStart && client.appointmentAt <= todayEnd
  );

  return (
    <div className="space-y-5 md:space-y-7">
      <section
        className="relative overflow-hidden rounded-lg border border-white/80 bg-[#1A1025] p-5 text-[#FFF7E8] shadow-[0_24px_70px_rgba(26,16,37,0.14)] md:p-7"
        style={{
          background:
            'radial-gradient(circle at 12% 10%, rgba(240, 207, 130, 0.18), transparent 30%), radial-gradient(circle at 88% 35%, rgba(46, 204, 138, 0.12), transparent 26%), linear-gradient(135deg, #160C20 0%, #241631 60%, #34213A 100%)',
        }}>
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#F2D794]/20 bg-white/[0.07] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#F2D794]">
              <Activity size={14} />
              Live clinic overview
            </p>
            <h2
              style={{ fontFamily: 'var(--font-heading)' }}
              className="mt-4 max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
              Your business pulse, beautifully organized.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#F8EEDB]/68 md:text-base">
              Track revenue, client flow, product performance, and stock health from one focused command center.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[360px]">
            {[
              ['12', 'appointments today'],
              ['6', 'pending checkouts'],
              ['PKR 4.2k', 'invoice value'],
              ['3', 'stock alerts'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-white/10 bg-white/[0.07] p-4 backdrop-blur">
                <p
                  style={{ fontFamily: 'var(--font-heading)' }}
                  className="text-3xl font-bold text-[#F2D794]">
                  {value}
                </p>
                <p className="mt-1 text-xs text-[#F8EEDB]/62">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <KPICard
          title="Today's Revenue"
          value={formatCurrency(8250)}
          change="+12.5%"
          icon={<Banknote size={24} />}
          trend="up"
          accent="#2ECC8A"
        />
        <KPICard
          title="Total Clients"
          value="342"
          change="+8 new"
          icon={<Users size={24} />}
          trend="up"
          accent="#8F609A"
        />
        <KPICard
          title="Pending Invoices"
          value="15"
          change="PKR 4,200"
          icon={<FileText size={24} />}
          trend="neutral"
          accent="#F0A500"
        />
        <KPICard
          title="Products Sold"
          value="89"
          change="+15.2%"
          icon={<Package size={24} />}
          trend="up"
          accent="#C9A96E"
        />
      </div>

      {upcomingAppointments.length > 0 && (
        <section className="rounded-lg border border-[#2ECC8A]/30 bg-[#EEF8F4] p-4 shadow-[0_18px_55px_rgba(26,16,37,0.08)] md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#2ECC8A] text-white">
                <CalendarClock size={21} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1025]">Appointment in the next hour</h3>
                <p className="mt-1 text-sm text-[#6B6570]">
                  These clients have appointments coming up within 60 minutes.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[520px]">
              {upcomingAppointments.slice(0, 4).map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => setSelectedAppointment(client)}
                  className="rounded-lg border border-[#2ECC8A]/20 bg-white/85 px-4 py-3 text-left transition-all hover:border-[#2ECC8A] hover:shadow-md">
                  <div className="font-semibold text-[#1A1025]">{client.name}</div>
                  <div className="mt-1 text-xs text-[#6B6570]">
                    Appointment at {client.appointmentAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {client.phone}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {todayAppointments.length > 0 && (
        <section className="rounded-lg border border-[#EDE8E3] bg-white p-4 shadow-[0_18px_55px_rgba(26,16,37,0.08)] md:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#1A1025]">Today’s appointments</h3>
              <p className="mt-1 text-sm text-[#6B6570]">
                {todayAppointments.length} appointment{todayAppointments.length === 1 ? '' : 's'} scheduled today.
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F7EFE1] text-[#A67F3F]">
              <CalendarDays size={19} />
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {todayAppointments.slice(0, 8).map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => setSelectedAppointment(client)}
                className="rounded-lg border border-[#EDE8E3] bg-[#F8F5F0] px-4 py-3 text-left transition-all hover:border-[#C9A96E] hover:bg-white hover:shadow-md">
                <div className="font-semibold text-[#1A1025]">{client.name}</div>
                <div className="mt-1 text-xs text-[#6B6570]">
                  {client.appointmentAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {client.phone}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {dueFollowUps.length > 0 && (
        <section className="rounded-lg border border-[#D1AD69]/45 bg-[#FFF8E8] p-4 shadow-[0_18px_55px_rgba(26,16,37,0.08)] md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#D1AD69] text-[#1A1025]">
                <CalendarClock size={21} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1A1025]">Follow-up reminders</h3>
                <p className="mt-1 text-sm text-[#6B6570]">
                  These clients need follow-up today or tomorrow.
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[520px]">
              {dueFollowUps.slice(0, 4).map((client) => (
                <div key={client.id} className="rounded-lg border border-[#D1AD69]/30 bg-white/80 px-4 py-3">
                  <div className="font-semibold text-[#1A1025]">Follow up {client.name}</div>
                  <div className="mt-1 text-xs text-[#6B6570]">
                    {new Date(client.followUpDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {client.phone}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
        <div className="lg:col-span-3 rounded-lg border border-white/80 bg-white/95 p-4 shadow-[0_18px_55px_rgba(26,16,37,0.08)] md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)' }}
                className="text-2xl font-bold text-[#1A1025]">
                Revenue Trend
              </h3>
              <p className="text-sm text-[#6B6570] mt-1">Last 7 days performance</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#2ECC8A]/10 px-3 py-1.5 text-[#159B61]">
              <TrendingUp size={18} />
              <span className="font-semibold">+18.3%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E3" />
              <XAxis dataKey="day" stroke="#6B6570" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B6570" style={{ fontSize: '12px' }} tickFormatter={(value) => `PKR ${value / 1000}k`} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #EDE8E3',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(26, 16, 37, 0.08)'
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#C9A96E"
                strokeWidth={3}
                dot={{ fill: '#FFF7E8', stroke: '#C9A96E', strokeWidth: 3, r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 rounded-lg border border-white/80 bg-white/95 p-4 shadow-[0_18px_55px_rgba(26,16,37,0.08)] md:p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)' }}
                className="text-2xl font-bold text-[#1A1025]">
                Top Products
              </h3>
              <p className="mt-1 text-sm text-[#6B6570]">Best performing retail mix</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F7EFE1] text-[#A67F3F]">
              <Package size={19} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={topProductsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value">
                {topProductsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={4} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #EDE8E3',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(26, 16, 37, 0.08)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-3">
            {topProductsData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-[#FAF7F1] px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#1A1025]">{item.name}</span>
                </div>
                <span className="font-semibold text-[#6B6570]">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="rounded-lg border border-white/80 bg-white/95 p-4 shadow-[0_18px_55px_rgba(26,16,37,0.08)] md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)' }}
                className="text-2xl font-bold text-[#1A1025]">
                Recent Invoices
              </h3>
              <p className="mt-1 text-sm text-[#6B6570]">Latest billing activity</p>
            </div>
            <CalendarDays size={20} className="text-[#A67F3F]" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#EDE8E3]">
                  <th className="text-left py-3 px-2 text-sm font-semibold text-[#6B6570]">Invoice</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-[#6B6570]">Client</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-[#6B6570]">Amount</th>
                  <th className="text-left py-3 px-2 text-sm font-semibold text-[#6B6570]">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[#EDE8E3]/60 hover:bg-[#FAF7F1] transition-colors">
                    <td className="py-3 px-2">
                      <span style={{ fontFamily: 'var(--font-mono)' }}
                        className="text-sm font-medium text-[#A67F3F]">
                        {invoice.id}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm text-[#1A1025]">{invoice.client}</td>
                    <td className="py-3 px-2">
                      <span style={{ fontFamily: 'var(--font-heading)' }}
                        className="text-sm font-semibold text-[#1A1025]">
                        {formatCurrency(invoice.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge status={invoice.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-white/80 bg-white/95 p-4 shadow-[0_18px_55px_rgba(26,16,37,0.08)] md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-[#F0A500]" />
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)' }}
                  className="text-2xl font-bold text-[#1A1025]">
                  Low Stock Alerts
                </h3>
                <p className="mt-1 text-sm text-[#6B6570]">Restock before checkout delays</p>
              </div>
            </div>
            <span className="rounded-full bg-[#F0A500]/12 px-3 py-1 text-xs font-bold text-[#A86F00]">
              3 items
            </span>
          </div>
          <div className="space-y-4">
            {lowStockItems.map((item, idx) => (
              <div key={idx} className="p-4 bg-[#FFF9ED] border border-[#F0A500]/20 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-[#1A1025]">{item.product}</div>
                    <div className="text-xs text-[#6B6570] mt-0.5">{item.category}</div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-[#F0A500] text-white rounded-full font-medium">
                    Low Stock
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[#6B6570]">
                    Current: <strong className="text-[#F0A500]">{item.current}</strong>
                  </span>
                  <span className="text-[#6B6570]">
                    Min: <strong className="text-[#1A1025]">{item.minimum}</strong>
                  </span>
                </div>
                <div className="mt-3 h-2 bg-[#EDE8E3] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#E5445A] to-[#F0A500]"
                    style={{ width: `${(item.current / item.minimum) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedAppointment && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setSelectedAppointment(null)}>
          <div
            className="w-full max-w-xl rounded-t-[24px] bg-white shadow-[0_24px_70px_rgba(26,16,37,0.34)] sm:rounded-[16px]"
            onClick={(event) => event.stopPropagation()}>
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-[#EDE8E3]" />
            </div>
            <div className="flex items-start justify-between gap-4 border-b border-[#EDE8E3] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A67F3F]">Appointment Details</p>
                <h3 className="mt-1 text-2xl font-bold text-[#1A1025]">{selectedAppointment.name}</h3>
                <p className="mt-1 text-sm text-[#6B6570]">
                  {selectedAppointment.appointmentAt.toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="rounded-lg p-2 text-[#6B6570] transition-colors hover:bg-[#F8F5F0]">
                <X size={22} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-[#F8F5F0] p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6B6570]">
                    <Phone size={14} />
                    Phone
                  </div>
                  <div className="font-semibold text-[#1A1025]">{selectedAppointment.phone}</div>
                </div>
                <div className="rounded-lg bg-[#F8F5F0] p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6B6570]">
                    <Wallet size={14} />
                    Total Spent
                  </div>
                  <div className="font-bold text-[#C9A96E]">{formatCurrency(selectedAppointment.totalSpent || 0)}</div>
                </div>
              </div>

              {selectedAppointment.email && (
                <div className="rounded-lg border border-[#EDE8E3] p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#6B6570]">
                    <Mail size={14} />
                    Email
                  </div>
                  <div className="text-sm font-medium text-[#1A1025]">{selectedAppointment.email}</div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-[#EDE8E3] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#6B6570]">Skin Type</div>
                  <div className="mt-1 font-semibold text-[#1A1025]">{selectedAppointment.skinType || 'Not set'}</div>
                </div>
                <div className="rounded-lg border border-[#EDE8E3] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#6B6570]">Follow Up</div>
                  <div className="mt-1 font-semibold text-[#1A1025]">
                    {selectedAppointment.followUpDate
                      ? new Date(selectedAppointment.followUpDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : 'Not set'}
                  </div>
                </div>
              </div>

              {selectedAppointment.concerns && selectedAppointment.concerns.length > 0 && (
                <div className="rounded-lg border border-[#EDE8E3] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#6B6570]">Skin Concerns</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedAppointment.concerns.map((concern) => (
                      <span key={concern} className="rounded-full bg-[#FFF8E8] px-3 py-1 text-xs font-semibold text-[#A67F3F]">
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-[#EDE8E3] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-[#6B6570]">Allergies</div>
                <div className="mt-1 text-sm font-medium text-[#1A1025]">{selectedAppointment.allergies || 'None'}</div>
              </div>

              {selectedAppointment.notes && (
                <div className="rounded-lg bg-[#F8F5F0] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#6B6570]">Notes</div>
                  <p className="mt-1 text-sm text-[#1A1025]">{selectedAppointment.notes}</p>
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
                className="w-full rounded-lg py-3 font-semibold text-white transition-all hover:opacity-95"
                style={{ background: 'linear-gradient(135deg, #C9A96E 0%, #E8C98A 100%)' }}>
                Go to POS / Save Treatment Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// KPI Card Component
function KPICard({ title, value, change, icon, trend, accent }: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  accent: string;
}) {
  const trendColor = trend === 'up' ? '#2ECC8A' : trend === 'down' ? '#E5445A' : '#6B6570';

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-white/80 bg-white p-4 shadow-[0_16px_45px_rgba(26,16,37,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(26,16,37,0.12)] md:p-5">
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} />
      <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full opacity-[0.08]" style={{ backgroundColor: accent }} />

      <div className="relative flex h-full flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-[0_12px_28px_rgba(26,16,37,0.12)]"
            style={{ background: `linear-gradient(135deg, ${accent} 0%, #F2D794 135%)` }}>
            {icon}
          </div>
          <div className="flex min-w-0 items-center gap-1 rounded-full border border-[#EDE8E3] bg-[#FAF7F1] px-2.5 py-1">
            {trend === 'up' && <ArrowUpRight size={14} style={{ color: trendColor }} />}
            <span className="truncate text-xs font-bold" style={{ color: trendColor }}>
              {change}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <h4 className="mb-2 text-sm font-medium text-[#5F5967]">{title}</h4>
          <div style={{ fontFamily: 'var(--font-heading)' }}
            className="truncate text-3xl font-black leading-none text-[#1A1025] md:text-[34px]">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const colors = {
    Paid: { bg: '#2ECC8A', text: 'white' },
    Pending: { bg: '#F0A500', text: 'white' },
    Overdue: { bg: '#E5445A', text: 'white' },
  };

  const style = colors[status as keyof typeof colors] || colors.Pending;

  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-xs font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}>
      {status}
    </span>
  );
}
