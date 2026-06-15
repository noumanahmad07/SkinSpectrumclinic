import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  Printer,
  Mail,
  MessageSquare,
  X,
  Banknote,
  Clock,
  CheckCircle,
  Check,
  Eye,
  Receipt,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ssaLogo from '../../assets/ssa-logo.png';
import {
  type Invoice,
  loadInvoices,
  saveInvoices,
  INVOICES_UPDATED_EVENT,
} from '../lib/invoices';
import {
  canUseBackend,
  fetchInvoices,
  markBackendInvoicePaid,
  type BackendInvoiceWithItems,
} from '../lib/backend';
import {
  ThermalInvoicePaper,
  buildThermalInvoiceHtml,
  getThermalInvoicePageHeightMm,
  THERMAL_RECEIPT_WIDTH_MM,
  type ThermalInvoiceData,
} from './ThermalReceipt';

const initialInvoices: Invoice[] = [
  {
    id: 'INV-1234', client: 'Emma Wilson', date: '2026-05-25', dueDate: '2026-06-24',
    amount: 450, status: 'Paid',
    items: [
      { name: 'Hydrating Serum', quantity: 2, price: 89 },
      { name: 'Facial Treatment - Premium', quantity: 1, price: 280 },
    ],
    subtotal: 458, discount: 8, tax: 0, total: 450,
  },
  {
    id: 'INV-1233', client: 'Sarah Johnson', date: '2026-05-24', dueDate: '2026-06-23',
    amount: 320, status: 'Paid',
    items: [
      { name: 'Anti-Aging Cream', quantity: 1, price: 125 },
      { name: 'Facial Treatment - Basic', quantity: 1, price: 150 },
      { name: 'Eye Cream Deluxe', quantity: 1, price: 98 },
    ],
    subtotal: 373, discount: 53, tax: 0, total: 320,
  },
  {
    id: 'INV-1232', client: 'Michael Brown', date: '2026-05-24', dueDate: '2026-06-23',
    amount: 580, status: 'Credit', creditAmount: 290, paidAmount: 290, paymentMethod: 'Cash',
    items: [
      { name: 'Luxury Bundle', quantity: 1, price: 450 },
      { name: 'Vitamin C Serum', quantity: 1, price: 95 },
      { name: 'Sunscreen SPF 50', quantity: 1, price: 55 },
    ],
    subtotal: 600, discount: 20, tax: 0, total: 580,
  },
  {
    id: 'INV-1231', client: 'Jessica Davis', date: '2026-05-23', dueDate: '2026-06-22',
    amount: 210, status: 'Paid',
    items: [
      { name: 'Exfoliating Scrub', quantity: 2, price: 65 },
      { name: 'Moisturizing Mask', quantity: 1, price: 75 },
    ],
    subtotal: 205, discount: 0, tax: 5, total: 210,
  },
  {
    id: 'INV-1230', client: 'David Miller', date: '2026-05-15', dueDate: '2026-05-30',
    amount: 890, status: 'Credit', creditAmount: 890,
    items: [
      { name: 'Facial Treatment - Premium', quantity: 2, price: 280 },
      { name: 'Retinol Night Cream', quantity: 1, price: 110 },
      { name: 'Hydrating Serum', quantity: 2, price: 89 },
    ],
    subtotal: 848, discount: 0, tax: 42, total: 890,
  },
  {
    id: 'INV-1229', client: 'Lisa Anderson', date: '2026-05-20', dueDate: '2026-06-19',
    amount: 340, status: 'Credit', creditAmount: 340,
    items: [
      { name: 'Anti-Aging Cream', quantity: 1, price: 125 },
      { name: 'Vitamin C Serum', quantity: 1, price: 95 },
      { name: 'Eye Cream Deluxe', quantity: 1, price: 98 },
    ],
    subtotal: 318, discount: 0, tax: 22, total: 340,
  },
];

const formatCurrency = (amount: number, decimals = false) =>
  `PKR ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`;

const statusStyles: Record<string, string> = {
  Paid: 'bg-[#2ECC8A]/10 text-[#159B61]',
  Credit: 'bg-[#F0A500]/10 text-[#A86F00]',
};

const statAccents = {
  billed: { icon: 'bg-secondary text-primary', bar: 'bg-primary' },
  collected: { icon: 'bg-[#2ECC8A]/10 text-[#159B61]', bar: 'bg-[#2ECC8A]' },
  credit: { icon: 'bg-[#F0A500]/10 text-[#A86F00]', bar: 'bg-[#F0A500]' },
} as const;

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function formatShortDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const mapBackendInvoice = (invoice: BackendInvoiceWithItems): Invoice => ({
  id: invoice.id,
  clientId: invoice.client_id ?? undefined,
  client: invoice.client_name,
  date: invoice.invoice_date,
  dueDate: invoice.due_date,
  amount: Number(invoice.amount || 0),
  status: invoice.status,
  creditAmount: invoice.credit_amount ?? undefined,
  paidAmount: invoice.paid_amount ?? undefined,
  paymentMethod: invoice.payment_method ?? undefined,
  items: (invoice.invoice_items || []).map((item) => ({
    productId: item.product_id ?? undefined,
    name: item.name,
    quantity: item.quantity,
    price: Number(item.price || 0),
  })),
  subtotal: Number(invoice.subtotal || 0),
  discount: Number(invoice.discount || 0),
  tax: Number(invoice.tax || 0),
  total: Number(invoice.total || 0),
});

export default function Billing() {
  const backendEnabled = canUseBackend();
  const [invoices, setInvoicesState] = useState<Invoice[]>(() => (canUseBackend() ? [] : loadInvoices(initialInvoices)));
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [backendError, setBackendError] = useState('');

  const setInvoices = useCallback((updater: Invoice[] | ((prev: Invoice[]) => Invoice[])) => {
    setInvoicesState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (!backendEnabled) {
        saveInvoices(next);
      }
      return next;
    });
  }, [backendEnabled]);

  useEffect(() => {
    if (backendEnabled) return;
    const refresh = () => setInvoicesState(loadInvoices(initialInvoices));
    window.addEventListener(INVOICES_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(INVOICES_UPDATED_EVENT, refresh);
  }, [backendEnabled]);

  useEffect(() => {
    if (!backendEnabled) return;

    let ignore = false;
    fetchInvoices()
      .then((rows) => {
        if (!ignore) {
          setInvoicesState(rows.map(mapBackendInvoice));
          setBackendError('');
        }
      })
      .catch(() => {
        if (!ignore) {
          setBackendError('Could not load invoices from Supabase. Please run billing_backend_setup.sql and check login/RLS.');
        }
      });

    return () => {
      ignore = true;
    };
  }, [backendEnabled]);

  const filteredInvoices = invoices.filter(
    (invoice) =>
      (invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!filterStatus || invoice.status === filterStatus)
  );

  const stats = {
    billed: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    collected: invoices.reduce(
      (sum, inv) => sum + (inv.status === 'Paid' ? inv.amount : (inv.paidAmount ?? 0)),
      0
    ),
    credit: invoices
      .filter((inv) => inv.status === 'Credit')
      .reduce((sum, inv) => sum + (inv.creditAmount ?? 0), 0),
  };

  const markAsPaid = async (id: string) => {
    if (backendEnabled) {
      try {
        const savedInvoice = await markBackendInvoicePaid(id);
        setInvoices((prev) =>
          prev.map((inv) =>
            inv.id === id
              ? {
                  ...inv,
                  status: savedInvoice.status,
                  creditAmount: savedInvoice.credit_amount ?? undefined,
                  paidAmount: savedInvoice.paid_amount ?? inv.total,
                }
              : inv
          )
        );
        if (selectedInvoice?.id === id) {
          setSelectedInvoice((prev) =>
            prev
              ? {
                  ...prev,
                  status: savedInvoice.status,
                  creditAmount: savedInvoice.credit_amount ?? undefined,
                  paidAmount: savedInvoice.paid_amount ?? prev.total,
                }
              : null
          );
        }
        setBackendError('');
        setSuccessMessage('Invoice marked as paid!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch {
        setBackendError('Invoice was not updated in Supabase. Please check Billing backend setup.');
      }
      return;
    }

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? { ...inv, status: 'Paid' as const, creditAmount: undefined, paidAmount: inv.total }
          : inv
      )
    );
    if (selectedInvoice?.id === id) {
      setSelectedInvoice((prev) =>
        prev ? { ...prev, status: 'Paid' as const, creditAmount: undefined, paidAmount: prev.total } : null
      );
    }
    setSuccessMessage('Invoice marked as paid!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col pb-3 lg:h-[calc(100vh-6.75rem)]">
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-[#2ECC8A]/20 bg-card px-4 py-2.5 text-[13px] font-medium text-[#159B61] shadow-lg md:right-8">
            <Check size={16} strokeWidth={2} />
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {backendError && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-[13px] font-medium text-destructive">
          {backendError}
        </div>
      )}

      {/* KPI row */}
      <div className="mb-4 grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
        <StatCard label="Total Billed" value={formatCurrency(stats.billed)} icon={<Banknote size={15} strokeWidth={1.75} />} accent="billed" />
        <StatCard label="Collected" value={formatCurrency(stats.collected)} icon={<CheckCircle size={15} strokeWidth={1.75} />} accent="collected" />
        <StatCard label="On Credit" value={formatCurrency(stats.credit)} icon={<Clock size={15} strokeWidth={1.75} />} accent="credit" />
      </div>

      {/* Search & filters */}
      <Panel className="mb-4 shrink-0 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Search by invoice # or client…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[
            { label: 'All', value: null, count: invoices.length },
            { label: 'Paid', value: 'Paid', count: invoices.filter((i) => i.status === 'Paid').length },
            { label: 'Credit', value: 'Credit', count: invoices.filter((i) => i.status === 'Credit').length },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => setFilterStatus(f.value)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                filterStatus === f.value
                  ? f.value === 'Paid'
                    ? 'bg-[#159B61] text-white'
                    : f.value === 'Credit'
                    ? 'bg-[#A86F00] text-white'
                    : 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </Panel>

      {/* Invoice list */}
      <Panel className="min-h-0 flex-1 overflow-hidden p-0">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground/50">
              <Receipt size={22} strokeWidth={1.5} />
            </div>
            {invoices.length === 0 ? (
              <>
                <p className="text-[14px] font-medium text-foreground">No invoices yet</p>
                <p className="mt-1 max-w-[300px] text-[13px] text-muted-foreground">
                  Invoices are created when you save a bill on POS. Complete a sale there to add billing records.
                </p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-medium text-foreground">No invoices found</p>
                <p className="mt-1 text-[13px] text-muted-foreground">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-border md:hidden">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  onClick={() => setSelectedInvoice(invoice)}
                  className="cursor-pointer bg-card p-4 transition-colors active:bg-muted/30">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[12px] font-medium text-primary">
                      {invoice.id}
                    </span>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-foreground">{invoice.client}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">{formatShortDate(invoice.date)}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div style={{ fontFamily: 'var(--font-heading)' }} className="text-[15px] font-semibold tabular-nums text-foreground">
                        {formatCurrency(invoice.amount)}
                      </div>
                      {(invoice.creditAmount ?? 0) > 0 && (
                        <div className="mt-0.5 text-[11px] font-medium tabular-nums text-[#A86F00]">
                          Credit {formatCurrency(invoice.creditAmount ?? 0)}
                        </div>
                      )}
                    </div>
                  </div>
                  {invoice.status === 'Credit' && (
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => markAsPaid(invoice.id)}
                        className="flex-1 rounded-lg bg-[#159B61] py-2 text-[12px] font-medium text-white transition-opacity hover:opacity-90">
                        Mark Paid
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden h-full overflow-x-hidden overflow-y-auto scroll-area md:block">
              <table className="w-full table-fixed">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b border-border bg-card">
                    <th className="w-[10%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Invoice</th>
                    <th className="w-[18%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Client</th>
                    <th className="w-[11%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Date</th>
                    <th className="w-[11%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Due</th>
                    <th className="w-[12%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total</th>
                    <th className="w-[12%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Credit</th>
                    <th className="w-[9%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                    <th className="w-[11%] bg-card px-2 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="cursor-pointer border-b border-border/60 bg-card transition-colors last:border-0 hover:bg-muted/30"
                      onClick={() => setSelectedInvoice(invoice)}>
                      <td className="px-3 py-2.5">
                        <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[12px] font-medium text-primary">
                          {invoice.id}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block truncate text-[13px] font-medium text-foreground">{invoice.client}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[12px] text-muted-foreground">{formatShortDate(invoice.date)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="text-[12px] text-muted-foreground">
                          {formatShortDate(invoice.dueDate)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span style={{ fontFamily: 'var(--font-heading)' }} className="text-[13px] font-semibold tabular-nums text-foreground">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {(invoice.creditAmount ?? 0) > 0 ? (
                          <span className="text-[12px] font-medium tabular-nums text-[#A86F00]">
                            {formatCurrency(invoice.creditAmount ?? 0)}
                          </span>
                        ) : (
                          <span className="text-[12px] text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <InvoiceRowActions
                          invoice={invoice}
                          onView={() => setSelectedInvoice(invoice)}
                          onPay={() => markAsPaid(invoice.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>

      <AnimatePresence mode="wait">
        {selectedInvoice && (
          <InvoiceDetailModal
            key={selectedInvoice.id}
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onMarkPaid={() => markAsPaid(selectedInvoice.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: keyof typeof statAccents;
}) {
  const styles = statAccents[accent];
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md md:p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[11px] text-muted-foreground md:text-[12px]">{label}</p>
          <p style={{ fontFamily: 'var(--font-heading)' }} className="mt-0.5 truncate text-base font-semibold tabular-nums text-foreground md:text-lg">
            {value}
          </p>
        </div>
      </div>
      <div className={`mt-2.5 h-0.5 w-7 rounded-full ${styles.bar}`} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'Credit') {
    return (
      <span className="inline-flex min-w-[4.75rem] items-center justify-center rounded-full bg-[#F0A500]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#A86F00]">
        Credit
      </span>
    );
  }

  return (
    <span
      className={`inline-flex min-w-[4.75rem] items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
        statusStyles[status] || statusStyles.Paid
      }`}>
      Paid
    </span>
  );
}

function InvoiceRowActions({
  invoice,
  onView,
  onPay,
}: {
  invoice: Invoice;
  onView: () => void;
  onPay: () => void;
}) {
  const showPay = invoice.status === 'Credit';

  return (
    <div
      className="ml-auto inline-grid grid-cols-[2.5rem_1.75rem] items-center justify-items-end gap-1"
      onClick={(e) => e.stopPropagation()}>
      {showPay ? (
        <button
          type="button"
          onClick={onPay}
          className="col-start-1 flex h-7 w-10 items-center justify-center rounded-full bg-[#159B61]/10 text-[10px] font-semibold text-[#159B61] transition-colors hover:bg-[#159B61]/20"
          title="Mark as paid">
          Pay
        </button>
      ) : (
        <span className="col-start-1 h-7 w-10" aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={onView}
        className="col-start-2 flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
        title="View invoice">
        <Eye size={14} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function InvoiceDetailModal({ invoice, onClose, onMarkPaid }: {
  invoice: Invoice;
  onClose: () => void;
  onMarkPaid: () => void;
}) {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const formattedDate = new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const invoiceSummary = [
    'Skin Spectrum Aesthetics',
    `Invoice: ${invoice.id}`,
    `Client: ${invoice.client}`,
    `Status: ${invoice.status}${invoice.status === 'Credit' ? ` (${formatCurrency(invoice.creditAmount ?? invoice.amount, true)} outstanding)` : ''}`,
    `Date: ${formattedDate}`,
    `Due Date: ${formattedDueDate}`,
    '',
    'Items:',
    ...invoice.items.map((item) => `${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity, true)}`),
    '',
    `Subtotal: ${formatCurrency(invoice.subtotal, true)}`,
    invoice.discount > 0 ? `Discount: -${formatCurrency(invoice.discount, true)}` : '',
    invoice.tax > 0 ? `Tax: ${formatCurrency(invoice.tax, true)}` : '',
    `Grand Total: ${formatCurrency(invoice.total, true)}`,
  ].filter(Boolean).join('\n');

  const thermalInvoiceData: ThermalInvoiceData = {
    invoiceId: invoice.id,
    clientName: invoice.client,
    status: invoice.status,
    date: formattedDate,
    dueDate: formattedDueDate,
    items: invoice.items,
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    tax: invoice.tax,
    total: invoice.total,
    creditAmount: invoice.creditAmount,
    paidAmount: invoice.paidAmount,
    paymentMethod: invoice.paymentMethod,
    formatCurrency,
    logoSrc: ssaLogo,
  };

  const printInvoiceDocument = () => {
    const html = buildThermalInvoiceHtml(thermalInvoiceData);
    const pageHeightMm = getThermalInvoicePageHeightMm(invoice.items.length);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.width = `${THERMAL_RECEIPT_WIDTH_MM}mm`;
    iframe.style.height = `${pageHeightMm}mm`;
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    if (!iframeWindow) {
      iframe.remove();
      return;
    }

    iframeWindow.document.open();
    iframeWindow.document.write(html);
    iframeWindow.document.close();

    const cleanup = () => setTimeout(() => iframe.remove(), 1000);

    const triggerPrint = () => {
      iframeWindow.focus();
      iframeWindow.print();
      cleanup();
    };

    if (iframeWindow.document.readyState === 'complete') {
      setTimeout(triggerPrint, 300);
    } else {
      iframe.onload = () => setTimeout(triggerPrint, 300);
    }
  };

  const createInvoiceImage = async () => {
    const width = 900;
    const itemHeight = 56;
    const height = Math.max(920, 710 + invoice.items.length * itemHeight + (invoice.status === 'Paid' ? 110 : 30));
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    const drawText = (text: string, x: number, y: number, options: {
      size?: number;
      weight?: string;
      color?: string;
      align?: CanvasTextAlign;
    } = {}) => {
      ctx.fillStyle = options.color || '#1A1025';
      ctx.font = `${options.weight || '500'} ${options.size || 16}px Inter, Arial, sans-serif`;
      ctx.textAlign = options.align || 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(text, x, y);
    };

    const drawLine = (y: number) => {
      ctx.strokeStyle = '#EDE8E3';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();
    };

    const logo = new Image();
    logo.src = ssaLogo;
    await new Promise<void>((resolve) => {
      logo.onload = () => resolve();
      logo.onerror = () => resolve();
    });

    ctx.fillStyle = '#1A1025';
    ctx.fillRect(0, 0, width, 150);
    if (logo.complete && logo.naturalWidth > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(105, 75, 45, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logo, 60, 30, 90, 90);
      ctx.restore();
    }
    drawText('Skin Spectrum Aesthetics', 172, 48, { size: 28, weight: '800', color: '#FFFFFF' });
    drawText('PROFESSIONAL INVOICE', 172, 88, { size: 13, weight: '700', color: '#E8C98A' });
    drawText(invoice.id, width - 60, 46, { size: 26, weight: '900', color: '#E8C98A', align: 'right' });
    drawText(invoice.status, width - 60, 84, { size: 14, weight: '700', color: '#FFFFFF', align: 'right' });

    drawText('BILLED TO', 60, 190, { size: 12, weight: '800', color: '#6B6570' });
    drawText(invoice.client, 60, 214, { size: 22, weight: '800' });
    drawText('DATE', width - 60, 190, { size: 12, weight: '800', color: '#6B6570', align: 'right' });
    drawText(formattedDate, width - 60, 214, { size: 16, weight: '700', align: 'right' });
    drawText('DUE DATE', width - 60, 246, { size: 12, weight: '800', color: '#6B6570', align: 'right' });
    drawText(formattedDueDate, width - 60, 270, { size: 16, weight: '700', align: 'right' });

    const tableTop = 330;
    ctx.fillStyle = '#F8F5F0';
    ctx.fillRect(60, tableTop, width - 120, 48);
    drawText('DESCRIPTION', 84, tableTop + 16, { size: 12, weight: '800', color: '#6B6570' });
    drawText('QTY', 540, tableTop + 16, { size: 12, weight: '800', color: '#6B6570', align: 'center' });
    drawText('PRICE', 685, tableTop + 16, { size: 12, weight: '800', color: '#6B6570', align: 'right' });
    drawText('TOTAL', 815, tableTop + 16, { size: 12, weight: '800', color: '#6B6570', align: 'right' });

    invoice.items.forEach((item, idx) => {
      const y = tableTop + 48 + idx * itemHeight;
      drawLine(y);
      drawText(item.name, 84, y + 16, { size: 16, weight: '700' });
      drawText(String(item.quantity), 540, y + 16, { size: 15, weight: '600', color: '#6B6570', align: 'center' });
      drawText(formatCurrency(item.price), 685, y + 16, { size: 15, weight: '600', color: '#6B6570', align: 'right' });
      drawText(formatCurrency(item.price * item.quantity, true), 815, y + 16, { size: 15, weight: '800', align: 'right' });
    });
    drawLine(tableTop + 48 + invoice.items.length * itemHeight);

    let totalsY = tableTop + 96 + invoice.items.length * itemHeight;
    drawText('Subtotal', 560, totalsY, { size: 16, color: '#6B6570' });
    drawText(formatCurrency(invoice.subtotal, true), 815, totalsY, { size: 16, color: '#6B6570', align: 'right' });
    totalsY += 34;
    if (invoice.discount > 0) {
      drawText('Discount', 560, totalsY, { size: 16, color: '#2ECC8A' });
      drawText(`-${formatCurrency(invoice.discount, true)}`, 815, totalsY, { size: 16, color: '#2ECC8A', align: 'right' });
      totalsY += 34;
    }
    if (invoice.tax > 0) {
      drawText('Tax', 560, totalsY, { size: 16, color: '#6B6570' });
      drawText(formatCurrency(invoice.tax, true), 815, totalsY, { size: 16, color: '#6B6570', align: 'right' });
      totalsY += 34;
    }

    ctx.strokeStyle = '#EDE8E3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(560, totalsY + 2);
    ctx.lineTo(815, totalsY + 2);
    ctx.stroke();
    drawText('Grand Total', 60, totalsY + 30, { size: 28, weight: '900' });
    drawText(formatCurrency(invoice.total, true), 815, totalsY + 28, { size: 32, weight: '900', color: '#C9A96E', align: 'right' });

    if (invoice.status === 'Paid') {
      ctx.save();
      ctx.translate(width / 2, totalsY + 140);
      ctx.rotate(-0.18);
      ctx.strokeStyle = '#2ECC8A';
      ctx.lineWidth = 6;
      ctx.strokeRect(-86, -34, 172, 68);
      drawText('PAID', 0, -22, { size: 40, weight: '900', color: '#2ECC8A', align: 'center' });
      ctx.restore();
    }

    return canvas;
  };

  const downloadCanvasImage = (canvas: HTMLCanvasElement) => {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${invoice.id}-invoice.png`;
    link.click();
  };

  const canvasToBlob = (canvas: HTMLCanvasElement) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1));

  const handleDownloadInvoice = async () => {
    const canvas = await createInvoiceImage();
    downloadCanvasImage(canvas);
  };

  const handleWhatsAppInvoice = async () => {
    const canvas = await createInvoiceImage();
    const blob = await canvasToBlob(canvas);
    const file = blob ? new File([blob], `${invoice.id}-invoice.png`, { type: 'image/png' }) : null;

    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `${invoice.id} - Skin Spectrum Aesthetics`,
        text: `Invoice ${invoice.id} for ${invoice.client}`,
      });
    } else {
      downloadCanvasImage(canvas);
      const message = [
        `Invoice image downloaded: ${invoice.id}-invoice.png`,
        'Please attach this downloaded image in WhatsApp.',
        '',
        invoiceSummary,
      ].join('\n');
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEmailInvoice = () => {
    const subject = `Invoice ${invoice.id} - Skin Spectrum Aesthetics`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(invoiceSummary)}`;
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 220, damping: 32, mass: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full will-change-transform sm:max-w-2xl">
        <div className="max-h-[92vh] overflow-y-auto scroll-area rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-xl">
      <div className="flex justify-center pt-3 pb-1 sm:hidden">
        <div className="h-1 w-8 rounded-full bg-border" />
      </div>

      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:px-6 md:py-4">
        <h2 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-semibold text-foreground md:text-xl">
          Invoice Details
        </h2>
        <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted">
          <X size={20} strokeWidth={1.75} />
        </button>
      </div>

      <div className="p-4 md:p-8 pt-5 md:pt-7">
        {/* Invoice Header Banner */}
        <div className="relative mb-6 md:mb-8 p-5 md:p-6 rounded-lg text-white overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #C9A96E 0%, #E8C98A 100%)' }}>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                <div style={{ fontFamily: 'var(--font-heading)' }} className="text-2xl md:text-3xl font-bold mb-1">
                  SkinSpectrum
                </div>
                <div className="text-sm opacity-90">Where Skin Meets Science</div>
              </div>
              <div className="sm:text-right flex-shrink-0">
                <div style={{ fontFamily: 'var(--font-mono)' }} className="text-xl md:text-2xl font-bold mb-1">
                  {invoice.id}
                </div>
                <div className="inline-flex">
                  <StatusBadge status={invoice.status} />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 bg-white" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full opacity-10 bg-white" />
        </div>

        {/* Client & Dates */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div>
            <div className="text-xs text-[#6B6570] mb-1">BILLED TO</div>
            <div className="font-semibold text-[#1A1025] text-base md:text-lg">{invoice.client}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#6B6570] mb-1">DATE</div>
            <div className="font-medium text-[#1A1025] text-sm">
              {new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div className="text-xs text-[#6B6570] mt-2">DUE DATE</div>
            <div className="font-medium text-sm text-[#1A1025]">
              {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-6 md:mb-8">
          <div className="bg-[#F8F5F0] px-4 py-3 rounded-t-lg border-b border-[#EDE8E3]">
            <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-[#6B6570]">
              <div className="col-span-6">DESCRIPTION</div>
              <div className="col-span-2 text-center">QTY</div>
              <div className="col-span-2 text-right">PRICE</div>
              <div className="col-span-2 text-right">TOTAL</div>
            </div>
          </div>
          <div className="bg-white border border-[#EDE8E3] border-t-0 rounded-b-lg">
            {invoice.items.map((item, idx) => (
              <div key={idx} className={`grid grid-cols-12 gap-2 px-4 py-3 ${idx !== invoice.items.length - 1 ? 'border-b border-[#EDE8E3]' : ''}`}>
                <div className="col-span-6 text-xs md:text-sm text-[#1A1025] font-medium">{item.name}</div>
                <div className="col-span-2 text-center text-xs md:text-sm text-[#6B6570]">{item.quantity}</div>
                <div className="col-span-2 text-right text-xs md:text-sm text-[#6B6570]">{formatCurrency(item.price)}</div>
                <div className="col-span-2 text-right text-xs md:text-sm font-semibold text-[#1A1025]">
                  {formatCurrency(item.price * item.quantity, true)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-2 mb-6 md:mb-8">
          <div className="flex justify-between text-[#6B6570] text-sm">
            <span>Subtotal</span><span>{formatCurrency(invoice.subtotal, true)}</span>
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-[#2ECC8A] text-sm">
              <span>Discount</span><span>-{formatCurrency(invoice.discount, true)}</span>
            </div>
          )}
          {invoice.tax > 0 && (
            <div className="flex justify-between text-[#6B6570] text-sm">
              <span>Tax</span><span>{formatCurrency(invoice.tax, true)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3 border-t-2 border-[#EDE8E3]">
            <span style={{ fontFamily: 'var(--font-heading)' }} className="text-lg md:text-xl font-bold text-[#1A1025]">
              Grand Total
            </span>
            <span style={{ fontFamily: 'var(--font-heading)' }} className="text-xl md:text-2xl font-bold text-[#C9A96E]">
              {formatCurrency(invoice.total, true)}
            </span>
          </div>
        </div>

        {/* PAID Stamp */}
        {invoice.status === 'Paid' && (
          <div className="text-center mb-6">
            <div className="inline-block px-6 py-3 rounded-lg transform -rotate-12"
              style={{ border: '4px solid #2ECC8A', color: '#2ECC8A' }}>
              <span style={{ fontFamily: 'var(--font-heading)' }} className="text-2xl md:text-3xl font-bold opacity-60">PAID</span>
            </div>
          </div>
        )}

        {/* Credit banner */}
        {invoice.status === 'Credit' && (
          <div className="mb-6 rounded-lg border border-[#F0A500]/30 bg-[#F0A500]/10 px-4 py-3">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#A86F00]">Outstanding credit</div>
              <div style={{ fontFamily: 'var(--font-heading)' }} className="mt-1 text-xl font-bold text-[#A86F00]">
                {formatCurrency(invoice.creditAmount ?? 0, true)}
              </div>
            </div>
            {(invoice.paidAmount ?? 0) > 0 && (
              <div className="mt-3 border-t border-[#F0A500]/20 pt-3 text-center text-[12px] text-[#6B6570]">
                {formatCurrency(invoice.paidAmount ?? 0, true)} already paid
                {invoice.paymentMethod ? ` via ${invoice.paymentMethod}` : ''}
              </div>
            )}
          </div>
        )}

        {/* Mark as Paid CTA */}
        {invoice.status === 'Credit' && (
          <div className="mb-4">
            <button
              onClick={onMarkPaid}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #2ECC8A 0%, #26B57A 100%)' }}>
              <CheckCircle size={18} />
              Mark as Paid
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-2 md:gap-3">
          {[
            { icon: <Printer size={18} />, label: 'Print', action: () => setShowPrintPreview(true) },
            { icon: <Download size={18} />, label: 'Download', action: handleDownloadInvoice },
            { icon: <MessageSquare size={18} />, label: 'WhatsApp', action: handleWhatsAppInvoice },
            { icon: <Mail size={18} />, label: 'Email', action: handleEmailInvoice },
          ].map((action) => (
            <button key={action.label}
              onClick={action.action}
              className="px-2 md:px-4 py-2 md:py-3 bg-[#F8F5F0] hover:bg-[#C9A96E] hover:text-white
                rounded-lg flex flex-col items-center gap-1 md:gap-2 transition-all">
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
        </div>
      </motion.div>
    </motion.div>
    <AnimatePresence>
      {showPrintPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setShowPrintPreview(false)}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 220, damping: 32, mass: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full will-change-transform sm:max-w-md">
            <div className="max-h-[92vh] overflow-y-auto scroll-area rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3.5">
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-base font-semibold text-foreground">
                    Thermal Print Preview
                  </h3>
                  <p className="text-[12px] text-muted-foreground">{invoice.id} · 80mm receipt</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted">
                  <X size={18} />
                </button>
              </div>
              <div className="flex justify-center bg-muted/30 p-4 md:p-6">
                <ThermalInvoicePaper data={thermalInvoiceData} />
              </div>
              <div className="flex gap-2 border-t border-border p-4">
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted">
                  Close
                </button>
                <button
                  type="button"
                  onClick={printInvoiceDocument}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-foreground py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90">
                  <Printer size={15} strokeWidth={1.75} />
                  Print Invoice
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
