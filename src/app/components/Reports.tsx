import { useState } from 'react';
import { Download, FileText, TrendingUp } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

const dataByRange = {
  today: {
    revenue: [
      { date: '9 AM', revenue: 420 },
      { date: '11 AM', revenue: 890 },
      { date: '1 PM', revenue: 650 },
      { date: '3 PM', revenue: 1100 },
      { date: '5 PM', revenue: 980 },
      { date: '7 PM', revenue: 1350 },
    ],
    total: 5390,
  },
  week: {
    revenue: [
      { date: 'Mon', revenue: 4500 },
      { date: 'Tue', revenue: 5200 },
      { date: 'Wed', revenue: 4800 },
      { date: 'Thu', revenue: 6100 },
      { date: 'Fri', revenue: 7300 },
      { date: 'Sat', revenue: 8200 },
      { date: 'Sun', revenue: 5900 },
    ],
    total: 42000,
  },
  month: {
    revenue: [
      { date: 'May 01', revenue: 4200 },
      { date: 'May 05', revenue: 5100 },
      { date: 'May 10', revenue: 4800 },
      { date: 'May 15', revenue: 6300 },
      { date: 'May 20', revenue: 7200 },
      { date: 'May 25', revenue: 8500 },
    ],
    total: 36100,
  },
  custom: {
    revenue: [
      { date: 'Apr 01', revenue: 3800 },
      { date: 'Apr 15', revenue: 4900 },
      { date: 'May 01', revenue: 4200 },
      { date: 'May 15', revenue: 6300 },
      { date: 'Jun 01', revenue: 7800 },
    ],
    total: 27000,
  },
};

const categoryData = [
  { category: 'Treatments', sales: 45000 },
  { category: 'Serums', sales: 32000 },
  { category: 'Creams', sales: 28000 },
  { category: 'Bundles', sales: 18000 },
  { category: 'Others', sales: 12000 },
];

const clientGrowthData = [
  { month: 'Jan', clients: 245 },
  { month: 'Feb', clients: 268 },
  { month: 'Mar', clients: 289 },
  { month: 'Apr', clients: 312 },
  { month: 'May', clients: 342 },
];

const paymentMethodsData = [
  { name: 'Cash', value: 42, color: '#C9A96E' },
  { name: 'Card', value: 38, color: '#2ECC8A' },
  { name: 'Bank Transfer', value: 20, color: '#F0A500' },
];

const topProducts = [
  { product: 'Facial Treatment - Premium', revenue: 28000, units: 100 },
  { product: 'Hydrating Serum', revenue: 22400, units: 252 },
  { product: 'Anti-Aging Cream', revenue: 18750, units: 150 },
  { product: 'Luxury Bundle', revenue: 18000, units: 40 },
  { product: 'Vitamin C Serum', revenue: 14250, units: 150 },
];

const topClients = [
  { client: 'Jessica Davis', totalSpent: 3200, visits: 12 },
  { client: 'Emma Wilson', totalSpent: 2450, visits: 9 },
  { client: 'Sarah Johnson', totalSpent: 1820, visits: 8 },
  { client: 'David Miller', totalSpent: 1560, visits: 6 },
  { client: 'Michael Brown', totalSpent: 980, visits: 4 },
];

const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'white',
    border: '1px solid #EDE8E3',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(26, 16, 37, 0.08)',
    fontSize: '12px',
  },
};

export default function Reports() {
  const [dateRange, setDateRange] = useState<keyof typeof dataByRange>('month');
  const [exportSuccess, setExportSuccess] = useState('');

  const currentData = dataByRange[dateRange];

  const handleExport = (type: string) => {
    setExportSuccess(`${type} exported successfully!`);
    setTimeout(() => setExportSuccess(''), 3000);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Export Toast */}
      <AnimatePresence>
        {exportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 md:right-8 z-50 bg-[#2ECC8A] text-white px-6 py-3 rounded-lg shadow-lg font-medium">
            ✓ {exportSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)' }} className="text-2xl md:text-3xl font-bold text-[#1A1025] mb-1 md:mb-2">
            Business Reports
          </h2>
          <p className="text-[#6B6570] text-sm">Analytics and insights for your business</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as keyof typeof dataByRange)}
            className="px-3 py-2 md:py-3 bg-white border border-[#EDE8E3] rounded-lg
              focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent text-sm">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          <button
            onClick={() => handleExport('PDF')}
            className="px-3 py-2 md:py-3 bg-white border border-[#EDE8E3] rounded-lg
              hover:bg-[#F8F5F0] transition-colors flex items-center gap-1.5 text-sm">
            <Download size={15} className="text-[#6B6570]" />
            <span className="font-medium text-[#6B6570] hidden sm:inline">PDF</span>
          </button>
          <button
            onClick={() => handleExport('Excel')}
            className="px-3 py-2 md:py-3 bg-white border border-[#EDE8E3] rounded-lg
              hover:bg-[#F8F5F0] transition-colors flex items-center gap-1.5 text-sm">
            <FileText size={15} className="text-[#6B6570]" />
            <span className="font-medium text-[#6B6570] hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(currentData.total), icon: '💰', color: '#C9A96E' },
          { label: 'Transactions', value: '89', icon: '🧾', color: '#2ECC8A' },
          { label: 'New Clients', value: '12', icon: '👥', color: '#F0A500' },
          { label: 'Avg. Order', value: formatCurrency(Math.round(currentData.total / 89)), icon: '📊', color: '#1A1025' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-[14px] p-4 md:p-5"
            style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)', borderTop: `4px solid ${kpi.color}` }}>
            <div className="text-2xl mb-2">{kpi.icon}</div>
            <div style={{ fontFamily: 'var(--font-heading)' }} className="text-xl md:text-2xl font-bold text-[#1A1025]">{kpi.value}</div>
            <div className="text-xs text-[#6B6570] mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-[14px] p-4 md:p-6"
        style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
        <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-3">
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg md:text-xl font-bold text-[#1A1025]">
              Revenue Trend
            </h3>
            <p className="text-xs md:text-sm text-[#6B6570] mt-0.5">
              {dateRange === 'today' ? 'Hourly performance' : dateRange === 'week' ? '7-day performance' : 'Daily performance'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#6B6570]">Total</div>
            <div style={{ fontFamily: 'var(--font-heading)' }} className="text-xl md:text-2xl font-bold text-[#C9A96E]">
              {formatCurrency(currentData.total)}
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={currentData.revenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E3" />
            <XAxis dataKey="date" stroke="#6B6570" style={{ fontSize: '11px' }} />
            <YAxis stroke="#6B6570" style={{ fontSize: '11px' }} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={3}
              dot={{ fill: '#C9A96E', r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Two Column Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Sales by Category */}
        <div className="bg-white rounded-[14px] p-4 md:p-6" style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg md:text-xl font-bold text-[#1A1025] mb-4 md:mb-6">
            Sales by Category
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E3" />
              <XAxis dataKey="category" stroke="#6B6570" style={{ fontSize: '10px' }} />
              <YAxis stroke="#6B6570" style={{ fontSize: '10px' }} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="sales" fill="#1A1025" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Client Growth */}
        <div className="bg-white rounded-[14px] p-4 md:p-6" style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg md:text-xl font-bold text-[#1A1025] mb-4 md:mb-6">
            Client Growth
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={clientGrowthData}>
              <defs>
                <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2ECC8A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2ECC8A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDE8E3" />
              <XAxis dataKey="month" stroke="#6B6570" style={{ fontSize: '11px' }} />
              <YAxis stroke="#6B6570" style={{ fontSize: '11px' }} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="clients" stroke="#2ECC8A" strokeWidth={3}
                fillOpacity={1} fill="url(#colorClients)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-[14px] p-4 md:p-6" style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg md:text-xl font-bold text-[#1A1025] mb-4 md:mb-6">
          Payment Methods Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
          <div className="flex justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={paymentMethodsData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  paddingAngle={5} dataKey="value">
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="md:col-span-2 space-y-3">
            {paymentMethodsData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 md:p-4 bg-[#F8F5F0] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-[#1A1025] text-sm md:text-base">{item.name}</span>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                  <span className="text-lg md:text-2xl font-bold text-[#6B6570]">{item.value}%</span>
                  <span style={{ fontFamily: 'var(--font-heading)' }} className="text-base md:text-lg font-bold text-[#C9A96E]">
                    {formatCurrency((item.value / 100) * currentData.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-[14px] p-4 md:p-6" style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg md:text-xl font-bold text-[#1A1025] mb-4 md:mb-6">
            Top Products
          </h3>
          <div className="space-y-2 md:space-y-3">
            {topProducts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 md:p-4 bg-[#F8F5F0] rounded-lg hover:bg-[#EDE8E3] transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-bold text-[#C9A96E] w-5 flex-shrink-0">#{idx + 1}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A1025] text-xs md:text-sm truncate">{item.product}</div>
                    <div className="text-xs text-[#6B6570]">{item.units} units</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)' }} className="text-base md:text-lg font-bold text-[#C9A96E] flex-shrink-0">
                  {formatCurrency(item.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-[14px] p-4 md:p-6" style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg md:text-xl font-bold text-[#1A1025] mb-4 md:mb-6">
            Top Clients
          </h3>
          <div className="space-y-2 md:space-y-3">
            {topClients.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 md:p-4 bg-[#F8F5F0] rounded-lg hover:bg-[#EDE8E3] transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#C9A96E] flex items-center justify-center text-white font-bold text-xs md:text-sm flex-shrink-0">
                    {item.client.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A1025] text-xs md:text-sm truncate">{item.client}</div>
                    <div className="text-xs text-[#6B6570]">{item.visits} visits</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)' }} className="text-base md:text-lg font-bold text-[#C9A96E] flex-shrink-0">
                  {formatCurrency(item.totalSpent)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
