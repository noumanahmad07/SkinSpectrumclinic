import React, { useEffect, useState } from 'react';
import { Download, FileText, Banknote, Receipt, Users, TrendingUp, Check } from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie,
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import ssaLogo from '../../assets/ssa-logo.png';
import { canUseBackend, fetchReportsData, parseSupabaseError } from '../lib/backend';
import { hasActiveSupabaseSession } from '../lib/supabase';

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

const emptyDataByRange: typeof dataByRange = {
  today: { revenue: [], total: 0 },
  week: { revenue: [], total: 0 },
  month: { revenue: [], total: 0 },
  custom: { revenue: [], total: 0 },
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

const paymentColors = ['#C9A96E', '#2ECC8A', '#F0A500', '#8F609A', '#1A1025'];

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

const dateRangeLabels: Record<keyof typeof dataByRange, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  custom: 'Custom Range',
};

const chartTooltip = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(26, 16, 37, 0.08)',
    fontSize: '12px',
  },
  labelStyle: { color: 'hsl(var(--muted-foreground))' },
};

const kpiAccents = {
  gold: { icon: 'bg-secondary text-primary', bar: 'bg-primary' },
  success: { icon: 'bg-[#2ECC8A]/10 text-[#159B61]', bar: 'bg-[#2ECC8A]' },
  warning: { icon: 'bg-[#F0A500]/10 text-[#A86F00]', bar: 'bg-[#F0A500]' },
  plum: { icon: 'bg-[#8F609A]/10 text-[#8F609A]', bar: 'bg-[#8F609A]' },
} as const;

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-sm ${className}`}>
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
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-[15px] font-semibold text-foreground">
          {title}
        </h3>
        {subtitle && <p className="mt-0.5 text-[12px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function KPICard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: keyof typeof kpiAccents;
}) {
  const styles = kpiAccents[accent];
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md md:p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] text-muted-foreground md:text-[12px]">{title}</p>
          <p style={{ fontFamily: 'var(--font-heading)' }} className="mt-0.5 truncate text-base font-semibold tabular-nums text-foreground md:text-lg">
            {value}
          </p>
        </div>
      </div>
      <div className={`mt-2.5 h-0.5 w-7 rounded-full ${styles.bar}`} />
    </div>
  );
}

export default function Reports() {
  const backendEnabled = canUseBackend();
  const backendSyncEnabled = backendEnabled && hasActiveSupabaseSession();
  const [dateRange, setDateRange] = useState<keyof typeof dataByRange>('month');
  const [exportSuccess, setExportSuccess] = useState('');
  const [backendError, setBackendError] = useState('');
  const [reportData, setReportData] = useState(() => (canUseBackend() ? emptyDataByRange : dataByRange));
  const [categoryReportData, setCategoryReportData] = useState(() => (canUseBackend() ? [] : categoryData));
  const [clientGrowthReportData, setClientGrowthReportData] = useState(() => (canUseBackend() ? [] : clientGrowthData));
  const [paymentMethodReportData, setPaymentMethodReportData] = useState(() => (canUseBackend() ? [] : paymentMethodsData));
  const [topProductReportData, setTopProductReportData] = useState(() => (canUseBackend() ? [] : topProducts));
  const [topClientReportData, setTopClientReportData] = useState(() => (canUseBackend() ? [] : topClients));
  const [summary, setSummary] = useState({
    transactions: canUseBackend() ? 0 : 89,
    newClients: canUseBackend() ? 0 : 12,
  });

  useEffect(() => {
    if (!backendSyncEnabled) {
      setBackendError('');
      return;
    }

    let ignore = false;
    fetchReportsData()
      .then((data) => {
        if (ignore) return;
        setReportData({
          today: { revenue: data.revenue.today, total: data.revenue.today.reduce((sum, row) => sum + Number(row.revenue || 0), 0) },
          week: { revenue: data.revenue.week, total: data.revenue.week.reduce((sum, row) => sum + Number(row.revenue || 0), 0) },
          month: { revenue: data.revenue.month, total: data.revenue.month.reduce((sum, row) => sum + Number(row.revenue || 0), 0) },
          custom: { revenue: data.revenue.custom, total: data.revenue.custom.reduce((sum, row) => sum + Number(row.revenue || 0), 0) },
        });
        setCategoryReportData(data.categorySales.map((row) => ({ category: row.category, sales: Number(row.sales || 0) })));
        setClientGrowthReportData(data.clientGrowth);
        setPaymentMethodReportData(
          data.paymentMethods.length
            ? data.paymentMethods.map((row, index) => ({
                name: row.name,
                value: Number(row.value || 0),
                color: paymentColors[index % paymentColors.length],
              }))
            : []
        );
        setTopProductReportData(data.topProducts.length ? data.topProducts.map((row) => ({
          product: row.product,
          revenue: Number(row.revenue || 0),
          units: row.units,
        })) : []);
        setTopClientReportData(data.topClients.length ? data.topClients.map((row) => ({
          client: row.client,
          totalSpent: Number(row.total_spent || 0),
          visits: row.visits,
        })) : []);
        setSummary({
          transactions: data.summary?.transactions || 0,
          newClients: data.summary?.new_clients || 0,
        });
        setBackendError(data.errors.length ? data.errors.join(' ') : '');
      })
      .catch((error) => {
        if (!ignore) {
          setBackendError(parseSupabaseError(error));
        }
      });

    return () => {
      ignore = true;
    };
  }, [backendSyncEnabled]);

  const currentData = reportData[dateRange];
  const transactions = summary.transactions || 0;
  const newClients = summary.newClients || 0;
  const reportTitle = `Business Report - ${dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : dateRange === 'month' ? 'This Month' : 'Custom Range'}`;
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const showExportSuccess = (message: string) => {
    setExportSuccess(message);
    setTimeout(() => setExportSuccess(''), 3000);
  };

  const getReportHtml = () => `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${reportTitle}</title>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 32px; color: #1A1025; font-family: Inter, Arial, sans-serif; background: #fff; }
          .report { max-width: 920px; margin: 0 auto; border: 1px solid #EDE8E3; border-radius: 18px; overflow: hidden; }
          .header { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 28px; background: #1A1025; color: #fff; }
          .brand { display: flex; align-items: center; gap: 16px; }
          .logo { width: 72px; height: 72px; border-radius: 999px; object-fit: cover; background: #000; }
          h1, h2, h3, p { margin: 0; }
          h1 { font-size: 26px; }
          .subtitle { margin-top: 6px; color: #E8C98A; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.4px; }
          .date { text-align: right; color: #EDE8E3; font-size: 14px; }
          .section { padding: 24px 28px; border-bottom: 1px solid #EDE8E3; }
          .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
          .kpi { padding: 16px; background: #F8F5F0; border-radius: 12px; }
          .kpi-label { color: #6B6570; font-size: 12px; margin-bottom: 8px; }
          .kpi-value { color: #C9A96E; font-size: 20px; font-weight: 900; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th { padding: 12px; background: #F8F5F0; color: #6B6570; text-align: left; font-size: 12px; text-transform: uppercase; }
          td { padding: 12px; border-bottom: 1px solid #EDE8E3; font-size: 14px; }
          .right { text-align: right; }
          @media print {
            body { padding: 0; }
            .report { border: 0; border-radius: 0; max-width: none; }
          }
        </style>
      </head>
      <body>
        <main class="report">
          <header class="header">
            <div class="brand">
              <img class="logo" src="${ssaLogo}" alt="Skin Spectrum Aesthetics" />
              <div>
                <h1>Skin Spectrum Aesthetics</h1>
                <p class="subtitle">${reportTitle}</p>
              </div>
            </div>
            <p class="date">${reportDate}</p>
          </header>
          <section class="section">
            <div class="kpis">
              <div class="kpi"><div class="kpi-label">Total Revenue</div><div class="kpi-value">${formatCurrency(currentData.total)}</div></div>
              <div class="kpi"><div class="kpi-label">Transactions</div><div class="kpi-value">${transactions}</div></div>
              <div class="kpi"><div class="kpi-label">New Clients</div><div class="kpi-value">${newClients}</div></div>
              <div class="kpi"><div class="kpi-label">Avg. Order</div><div class="kpi-value">${formatCurrency(transactions ? Math.round(currentData.total / transactions) : 0)}</div></div>
            </div>
          </section>
          <section class="section">
            <h2>Revenue Trend</h2>
            <table>
              <thead><tr><th>Date</th><th class="right">Revenue</th></tr></thead>
              <tbody>${currentData.revenue.map((row) => `<tr><td>${row.date}</td><td class="right">${formatCurrency(row.revenue)}</td></tr>`).join('')}</tbody>
            </table>
          </section>
          <section class="section">
            <h2>Sales by Category</h2>
            <table>
              <thead><tr><th>Category</th><th class="right">Sales</th></tr></thead>
              <tbody>${categoryReportData.map((row) => `<tr><td>${row.category}</td><td class="right">${formatCurrency(row.sales)}</td></tr>`).join('')}</tbody>
            </table>
          </section>
          <section class="section">
            <h2>Top Products</h2>
            <table>
              <thead><tr><th>Product</th><th class="right">Units</th><th class="right">Revenue</th></tr></thead>
              <tbody>${topProductReportData.map((row) => `<tr><td>${row.product}</td><td class="right">${row.units}</td><td class="right">${formatCurrency(row.revenue)}</td></tr>`).join('')}</tbody>
            </table>
          </section>
          <section class="section">
            <h2>Top Clients</h2>
            <table>
              <thead><tr><th>Client</th><th class="right">Visits</th><th class="right">Total Spent</th></tr></thead>
              <tbody>${topClientReportData.map((row) => `<tr><td>${row.client}</td><td class="right">${row.visits}</td><td class="right">${formatCurrency(row.totalSpent)}</td></tr>`).join('')}</tbody>
            </table>
          </section>
        </main>
      </body>
    </html>
  `;

  const handlePdfExport = () => {
    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    document.body.appendChild(frame);

    const doc = frame.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(getReportHtml());
    doc.close();

    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => document.body.removeChild(frame), 1000);
    }, 350);
    showExportSuccess('PDF report opened for download');
  };

  const handleExcelExport = () => {
    const workbookHtml = `
      <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <h1>${reportTitle}</h1>
          <p>Generated: ${reportDate}</p>
          <table border="1">
            <tr><th colspan="2">Summary</th></tr>
            <tr><td>Total Revenue</td><td>${currentData.total}</td></tr>
            <tr><td>Transactions</td><td>${transactions}</td></tr>
            <tr><td>New Clients</td><td>${newClients}</td></tr>
            <tr><td>Average Order</td><td>${transactions ? Math.round(currentData.total / transactions) : 0}</td></tr>
          </table>
          <br />
          <table border="1">
            <tr><th colspan="2">Revenue Trend</th></tr>
            <tr><th>Date</th><th>Revenue</th></tr>
            ${currentData.revenue.map((row) => `<tr><td>${row.date}</td><td>${row.revenue}</td></tr>`).join('')}
          </table>
          <br />
          <table border="1">
            <tr><th colspan="2">Sales by Category</th></tr>
            <tr><th>Category</th><th>Sales</th></tr>
            ${categoryReportData.map((row) => `<tr><td>${row.category}</td><td>${row.sales}</td></tr>`).join('')}
          </table>
          <br />
          <table border="1">
            <tr><th colspan="3">Top Products</th></tr>
            <tr><th>Product</th><th>Units</th><th>Revenue</th></tr>
            ${topProductReportData.map((row) => `<tr><td>${row.product}</td><td>${row.units}</td><td>${row.revenue}</td></tr>`).join('')}
          </table>
          <br />
          <table border="1">
            <tr><th colspan="3">Top Clients</th></tr>
            <tr><th>Client</th><th>Visits</th><th>Total Spent</th></tr>
            ${topClientReportData.map((row) => `<tr><td>${row.client}</td><td>${row.visits}</td><td>${row.totalSpent}</td></tr>`).join('')}
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([workbookHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skin-spectrum-report-${dateRange}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showExportSuccess('Excel report downloaded');
  };

  const avgOrder = transactions ? Math.round(currentData.total / transactions) : 0;
  const revenueSubtitle =
    dateRange === 'today' ? 'Hourly performance' : dateRange === 'week' ? '7-day performance' : 'Daily performance';

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 pb-3 md:space-y-5">
      <AnimatePresence>
        {exportSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-[#2ECC8A]/20 bg-card px-4 py-2.5 text-[13px] font-medium text-[#159B61] shadow-lg md:right-8">
            <Check size={16} strokeWidth={2} />
            {exportSuccess}
          </motion.div>
        )}
      </AnimatePresence>

      {backendEnabled && !backendSyncEnabled && (
        <div className="rounded-lg border border-[#F0A500]/30 bg-[#F0A500]/10 px-4 py-3 text-[13px] text-[#A86F00]">
          Sign in with your Supabase staff account to load live reports from the backend.
        </div>
      )}

      {backendError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-[13px] font-medium text-destructive">
          {backendError}
        </div>
      )}

      {/* Toolbar */}
      <Panel className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-semibold text-foreground md:text-xl">
              Business Reports
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Analytics and insights for your clinic</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as keyof typeof dataByRange)}
              className="h-9 rounded-lg border border-border bg-background px-3 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <button
              type="button"
              onClick={handlePdfExport}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Download size={15} strokeWidth={1.75} />
              PDF
            </button>
            <button
              type="button"
              onClick={handleExcelExport}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              <FileText size={15} strokeWidth={1.75} />
              Excel
            </button>
          </div>
        </div>
      </Panel>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KPICard title="Total Revenue" value={formatCurrency(currentData.total)} icon={<Banknote size={15} strokeWidth={1.75} />} accent="gold" />
        <KPICard title="Transactions" value={String(transactions)} icon={<Receipt size={15} strokeWidth={1.75} />} accent="success" />
        <KPICard title="New Clients" value={String(newClients)} icon={<Users size={15} strokeWidth={1.75} />} accent="warning" />
        <KPICard title="Avg. Order" value={formatCurrency(avgOrder)} icon={<TrendingUp size={15} strokeWidth={1.75} />} accent="plum" />
      </div>

      {/* Revenue chart */}
      <Panel className="p-4 md:p-5">
        <PanelHeader
          title="Revenue Trend"
          subtitle={`${dateRangeLabels[dateRange]} · ${revenueSubtitle}`}
          action={
            <span style={{ fontFamily: 'var(--font-heading)' }} className="text-[15px] font-semibold tabular-nums text-primary">
              {formatCurrency(currentData.total)}
            </span>
          }
        />
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={currentData.revenue}>
            <defs>
              <linearGradient id="reportRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip {...chartTooltip} formatter={(value: number) => [formatCurrency(value), 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={2.5} fill="url(#reportRevenue)" dot={{ fill: '#C9A96E', r: 3 }} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      {/* Category + Client growth */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <Panel className="p-4 md:p-5">
          <PanelHeader title="Sales by Category" subtitle="Revenue breakdown" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryReportData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip {...chartTooltip} formatter={(value: number) => [formatCurrency(value), 'Sales']} />
              <Bar dataKey="sales" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel className="p-4 md:p-5">
          <PanelHeader title="Client Growth" subtitle="Monthly active clients" />
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={clientGrowthReportData}>
              <defs>
                <linearGradient id="reportClients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2ECC8A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2ECC8A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip {...chartTooltip} />
              <Area type="monotone" dataKey="clients" stroke="#2ECC8A" strokeWidth={2.5} fill="url(#reportClients)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* Payment methods */}
      <Panel className="p-4 md:p-5">
        <PanelHeader title="Payment Methods" subtitle="Share of revenue by method" />
        <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[200px_1fr] md:gap-6">
          <div className="mx-auto w-full max-w-[200px]">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={paymentMethodReportData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                  {paymentMethodReportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip {...chartTooltip} formatter={(value: number) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {paymentMethodReportData.map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[13px] font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold tabular-nums text-muted-foreground">{item.value}%</span>
                  <span style={{ fontFamily: 'var(--font-heading)' }} className="text-[13px] font-semibold tabular-nums text-primary">
                    {formatCurrency((item.value / 100) * currentData.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      {/* Rankings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <Panel className="p-4 md:p-5">
          <PanelHeader title="Top Products" subtitle="By revenue" />
          <div className="space-y-1.5">
            {topProductReportData.map((item, idx) => (
              <div key={item.product} className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2.5 transition-colors hover:bg-muted/30">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-primary">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-foreground">{item.product}</div>
                    <div className="text-[11px] text-muted-foreground">{item.units} units</div>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-heading)' }} className="shrink-0 text-[13px] font-semibold tabular-nums text-primary">
                  {formatCurrency(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-4 md:p-5">
          <PanelHeader title="Top Clients" subtitle="By total spent" />
          <div className="space-y-1.5">
            {topClientReportData.map((item) => (
              <div key={item.client} className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2.5 transition-colors hover:bg-muted/30">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {item.client.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-medium text-foreground">{item.client}</div>
                    <div className="text-[11px] text-muted-foreground">{item.visits} visits</div>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-heading)' }} className="shrink-0 text-[13px] font-semibold tabular-nums text-primary">
                  {formatCurrency(item.totalSpent)}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
