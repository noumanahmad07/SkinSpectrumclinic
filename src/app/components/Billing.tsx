import { useState } from 'react';
import { Search, FileText, Download, Printer, Mail, MessageSquare, X, Banknote, Clock, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ssaLogo from '../../assets/ssa-logo.png';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: string;
  client: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

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
    amount: 580, status: 'Pending',
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
    amount: 890, status: 'Overdue',
    items: [
      { name: 'Facial Treatment - Premium', quantity: 2, price: 280 },
      { name: 'Retinol Night Cream', quantity: 1, price: 110 },
      { name: 'Hydrating Serum', quantity: 2, price: 89 },
    ],
    subtotal: 848, discount: 0, tax: 42, total: 890,
  },
  {
    id: 'INV-1229', client: 'Lisa Anderson', date: '2026-05-20', dueDate: '2026-06-19',
    amount: 340, status: 'Pending',
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

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const filteredInvoices = invoices.filter(
    (invoice) =>
      (invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.client.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!filterStatus || invoice.status === filterStatus)
  );

  const stats = {
    billed: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    collected: invoices.filter((inv) => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0),
    outstanding: invoices.filter((inv) => inv.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0),
    overdue: invoices.filter((inv) => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0),
  };

  const markAsPaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => inv.id === id ? { ...inv, status: 'Paid' as const } : inv)
    );
    if (selectedInvoice?.id === id) {
      setSelectedInvoice((prev) => prev ? { ...prev, status: 'Paid' as const } : null);
    }
    setSuccessMessage('Invoice marked as paid!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const sendReminder = (invoice: Invoice) => {
    setSuccessMessage(`Reminder sent to ${invoice.client} via WhatsApp`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Success Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 md:right-8 z-50 bg-[#2ECC8A] text-white px-6 py-3 rounded-lg shadow-lg font-medium">
            ✓ {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatPill label="Total Billed" value={formatCurrency(stats.billed)} icon={<Banknote size={16} />} color="#C9A96E" />
        <StatPill label="Collected" value={formatCurrency(stats.collected)} icon={<CheckCircle size={16} />} color="#2ECC8A" />
        <StatPill label="Outstanding" value={formatCurrency(stats.outstanding)} icon={<Clock size={16} />} color="#F0A500" />
        <StatPill label="Overdue" value={formatCurrency(stats.overdue)} icon={<AlertCircle size={16} />} color="#E5445A" />
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-[14px] p-3 md:p-4"
        style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6570]" size={18} />
            <input
              type="text"
              placeholder="Search by invoice # or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-[#F8F5F0] border border-[#EDE8E3] rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent text-sm"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { label: 'All', value: null, active: '#C9A96E' },
              { label: 'Paid', value: 'Paid', active: '#2ECC8A' },
              { label: 'Pending', value: 'Pending', active: '#F0A500' },
              { label: 'Overdue', value: 'Overdue', active: '#E5445A' },
            ].map((f) => (
              <button
                key={f.label}
                onClick={() => setFilterStatus(f.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                  filterStatus === f.value ? 'text-white' : 'bg-[#F8F5F0] text-[#6B6570] hover:bg-[#EDE8E3]'
                }`}
                style={filterStatus === f.value ? { backgroundColor: f.active } : {}}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoice Cards - Mobile */}
      <div className="sm:hidden space-y-3">
        {filteredInvoices.map((invoice) => (
          <div
            key={invoice.id}
            onClick={() => setSelectedInvoice(invoice)}
            className="bg-white rounded-[14px] p-4 border border-[#EDE8E3] cursor-pointer hover:border-[#C9A96E] transition-all"
            style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontFamily: 'var(--font-mono)' }} className="text-sm font-medium text-[#C9A96E]">{invoice.id}</span>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-[#1A1025] text-sm">{invoice.client}</div>
                <div className="text-xs text-[#6B6570] mt-0.5">{new Date(invoice.date).toLocaleDateString()}</div>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-bold text-[#1A1025]">
                {formatCurrency(invoice.amount)}
              </div>
            </div>
            {invoice.status !== 'Paid' && (
              <button
                onClick={(e) => { e.stopPropagation(); markAsPaid(invoice.id); }}
                className="mt-3 w-full py-2 rounded-lg text-xs font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #2ECC8A 0%, #26B57A 100%)' }}>
                Mark as Paid
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Invoice Table - Desktop */}
      <div className="hidden sm:block bg-white rounded-[14px] overflow-hidden"
        style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-[#F8F5F0] border-b border-[#EDE8E3]">
              <tr>
                {['Invoice #', 'Client', 'Date', 'Due Date', 'Amount', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-[#6B6570] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, idx) => (
                <tr
                  key={invoice.id}
                  className={`border-b border-[#EDE8E3]/50 hover:bg-[#F8F5F0] transition-colors cursor-pointer ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-[#F8F5F0]/30'
                  }`}
                  onClick={() => setSelectedInvoice(invoice)}>
                  <td className="py-4 px-4">
                    <span style={{ fontFamily: 'var(--font-mono)' }} className="text-sm font-medium text-[#C9A96E]">
                      {invoice.id}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-[#1A1025] font-medium">{invoice.client}</td>
                  <td className="py-4 px-4 text-sm text-[#6B6570]">{new Date(invoice.date).toLocaleDateString()}</td>
                  <td className="py-4 px-4 text-sm text-[#6B6570]">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className="py-4 px-4">
                    <span style={{ fontFamily: 'var(--font-heading)' }} className="text-sm font-bold text-[#1A1025]">
                      {formatCurrency(invoice.amount)}
                    </span>
                  </td>
                  <td className="py-4 px-4"><StatusBadge status={invoice.status} /></td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => setSelectedInvoice(invoice)}
                        className="text-[#C9A96E] hover:text-[#A07840] transition-colors p-1 rounded hover:bg-[#F8F5F0]">
                        <FileText size={16} />
                      </button>
                      {invoice.status !== 'Paid' && (
                        <button
                          onClick={() => markAsPaid(invoice.id)}
                          className="px-2 py-1 text-xs font-medium text-white rounded-lg transition-all hover:opacity-90"
                          style={{ background: 'linear-gradient(135deg, #2ECC8A 0%, #26B57A 100%)' }}>
                          Pay
                        </button>
                      )}
                      {invoice.status === 'Overdue' && (
                        <button
                          onClick={() => sendReminder(invoice)}
                          className="px-2 py-1 text-xs font-medium text-white rounded-lg transition-all"
                          style={{ backgroundColor: '#F0A500' }}>
                          Remind
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-[#6B6570] text-lg">No invoices found</p>
          </div>
        )}
      </div>

      {/* Invoice Detail Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onMarkPaid={() => markAsPaid(selectedInvoice.id)}
            onSendReminder={() => sendReminder(selectedInvoice)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatPill({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-[14px] p-3 md:p-4 flex items-center gap-3"
      style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0"
        style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-[#6B6570] mb-0.5 truncate">{label}</div>
        <div style={{ fontFamily: 'var(--font-heading)' }} className="text-lg md:text-xl font-bold text-[#1A1025]">
          {value}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    Paid: { bg: '#2ECC8A', text: 'white' },
    Pending: { bg: '#F0A500', text: 'white' },
    Overdue: { bg: '#E5445A', text: 'white' },
  };
  const style = colors[status as keyof typeof colors] || colors.Pending;
  return (
    <span className="inline-block px-2 md:px-3 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: style.bg, color: style.text }}>
      {status}
    </span>
  );
}

function InvoiceDetailModal({ invoice, onClose, onMarkPaid, onSendReminder }: {
  invoice: Invoice;
  onClose: () => void;
  onMarkPaid: () => void;
  onSendReminder: () => void;
}) {
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const formattedDate = new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const formattedDueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const invoiceSummary = [
    'Skin Spectrum Aesthetics',
    `Invoice: ${invoice.id}`,
    `Client: ${invoice.client}`,
    `Status: ${invoice.status}`,
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

  const getInvoicePrintHtml = () => `
    <!doctype html>
    <html>
      <head>
        <title>${invoice.id} - Skin Spectrum Aesthetics</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            color: #1A1025;
            font-family: Inter, Arial, sans-serif;
            background: #fff;
          }
          .invoice {
            max-width: 760px;
            margin: 0 auto;
            border: 1px solid #EDE8E3;
            border-radius: 18px;
            overflow: hidden;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            padding: 28px;
            background: #1A1025;
            color: #fff;
          }
          .brand {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          .logo {
            width: 86px;
            height: 86px;
            border-radius: 999px;
            object-fit: cover;
            background: #000;
          }
          h1, h2, p { margin: 0; }
          h1 { font-size: 26px; letter-spacing: 0; }
          .subtitle { margin-top: 5px; color: #E8C98A; font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; }
          .invoice-id { text-align: right; font-weight: 800; font-size: 22px; color: #E8C98A; }
          .status { margin-top: 8px; font-size: 12px; color: #fff; }
          .meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            padding: 28px;
            border-bottom: 1px solid #EDE8E3;
          }
          .label { color: #6B6570; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
          .value { font-size: 16px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; }
          th {
            padding: 14px 18px;
            background: #F8F5F0;
            color: #6B6570;
            font-size: 11px;
            text-align: left;
            text-transform: uppercase;
            letter-spacing: .8px;
          }
          td {
            padding: 15px 18px;
            border-bottom: 1px solid #EDE8E3;
            font-size: 14px;
          }
          .right { text-align: right; }
          .center { text-align: center; }
          .totals {
            padding: 24px 28px 28px;
            display: grid;
            gap: 10px;
          }
          .row { display: flex; justify-content: space-between; color: #6B6570; font-size: 15px; }
          .grand {
            margin-top: 8px;
            padding-top: 16px;
            border-top: 2px solid #EDE8E3;
            color: #1A1025;
            font-size: 24px;
            font-weight: 900;
          }
          .grand strong { color: #C9A96E; }
          .paid {
            margin: 0 28px 28px auto;
            width: max-content;
            padding: 10px 22px;
            border: 4px solid #2ECC8A;
            border-radius: 10px;
            color: #2ECC8A;
            font-size: 30px;
            font-weight: 900;
            transform: rotate(-10deg);
            opacity: .72;
          }
          @media print {
            body { padding: 0; }
            .invoice { border: 0; border-radius: 0; max-width: none; }
          }
        </style>
      </head>
      <body>
        <section class="invoice">
          <div class="header">
            <div class="brand">
              <img class="logo" src="${ssaLogo}" alt="Skin Spectrum Aesthetics" />
              <div>
                <h1>Skin Spectrum Aesthetics</h1>
                <p class="subtitle">Professional invoice</p>
              </div>
            </div>
            <div>
              <div class="invoice-id">${invoice.id}</div>
              <div class="status">${invoice.status}</div>
            </div>
          </div>
          <div class="meta">
            <div>
              <div class="label">Billed to</div>
              <div class="value">${invoice.client}</div>
            </div>
            <div class="right">
              <div class="label">Date</div>
              <div class="value">${formattedDate}</div>
              <div class="label" style="margin-top:14px;">Due date</div>
              <div class="value">${formattedDueDate}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="center">Qty</th>
                <th class="right">Price</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item) => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td class="center">${item.quantity}</td>
                  <td class="right">${formatCurrency(item.price)}</td>
                  <td class="right"><strong>${formatCurrency(item.price * item.quantity, true)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <div class="row"><span>Subtotal</span><span>${formatCurrency(invoice.subtotal, true)}</span></div>
            ${invoice.discount > 0 ? `<div class="row" style="color:#2ECC8A;"><span>Discount</span><span>-${formatCurrency(invoice.discount, true)}</span></div>` : ''}
            ${invoice.tax > 0 ? `<div class="row"><span>Tax</span><span>${formatCurrency(invoice.tax, true)}</span></div>` : ''}
            <div class="row grand"><span>Grand Total</span><strong>${formatCurrency(invoice.total, true)}</strong></div>
          </div>
          ${invoice.status === 'Paid' ? '<div class="paid">PAID</div>' : ''}
        </section>
      </body>
    </html>
  `;

  const printInvoiceDocument = () => {
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
    doc.write(getInvoicePrintHtml());
    doc.close();

    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => document.body.removeChild(frame), 1000);
    }, 350);
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

    onSendReminder();
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
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-[24px] sm:rounded-[14px] w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto"
        style={{ boxShadow: '0 20px 60px rgba(26, 16, 37, 0.3)' }}>
      <div className="sm:hidden flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-[#EDE8E3] rounded-full" />
      </div>

      <div className="sticky top-0 bg-white border-b border-[#EDE8E3] px-4 py-3 md:px-6 md:py-4 flex items-center justify-between z-20">
        <h2 style={{ fontFamily: 'var(--font-heading)' }} className="text-xl md:text-2xl font-bold text-[#1A1025]">
          Invoice Details
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-[#F8F5F0] rounded-lg transition-colors">
          <X size={22} className="text-[#6B6570]" />
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
            <div className={`font-medium text-sm ${invoice.status === 'Overdue' ? 'text-[#E5445A]' : 'text-[#1A1025]'}`}>
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

        {/* Mark as Paid CTA */}
        {invoice.status !== 'Paid' && (
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
    </motion.div>
    </motion.div>
    <AnimatePresence>
      {showPrintPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
          onClick={() => setShowPrintPreview(false)}>
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-t-[24px] sm:rounded-[16px] w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto"
            style={{ boxShadow: '0 24px 70px rgba(26, 16, 37, 0.34)' }}>
            <div className="sticky top-0 bg-white border-b border-[#EDE8E3] p-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold text-[#1A1025]">Print Preview</h3>
                <p className="text-sm text-[#6B6570]">{invoice.id} for {invoice.client}</p>
              </div>
              <button onClick={() => setShowPrintPreview(false)} className="p-2 hover:bg-[#F8F5F0] rounded-lg transition-colors">
                <X size={22} className="text-[#6B6570]" />
              </button>
            </div>
            <div className="p-4 md:p-6 bg-[#F8F5F0]">
              <div className="bg-white border border-[#EDE8E3] rounded-[14px] overflow-hidden">
                <div className="bg-[#1A1025] text-white p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img src={ssaLogo} alt="Skin Spectrum Aesthetics" className="w-16 h-16 rounded-full object-cover bg-black" />
                    <div>
                      <div className="text-xl font-bold">Skin Spectrum Aesthetics</div>
                      <div className="text-xs uppercase tracking-[0.18em] text-[#E8C98A]">Professional invoice</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#E8C98A]">{invoice.id}</div>
                    <div className="text-sm">{invoice.status}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-5 border-b border-[#EDE8E3]">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#6B6570]">Billed to</div>
                    <div className="font-bold text-[#1A1025]">{invoice.client}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#6B6570]">Date</div>
                    <div className="font-semibold text-[#1A1025]">{formattedDate}</div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#6B6570] mt-2">Due date</div>
                    <div className="font-semibold text-[#1A1025]">{formattedDueDate}</div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px]">
                    <thead className="bg-[#F8F5F0]">
                      <tr>
                        <th className="text-left p-3 text-xs text-[#6B6570] uppercase">Description</th>
                        <th className="text-center p-3 text-xs text-[#6B6570] uppercase">Qty</th>
                        <th className="text-right p-3 text-xs text-[#6B6570] uppercase">Price</th>
                        <th className="text-right p-3 text-xs text-[#6B6570] uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.name} className="border-t border-[#EDE8E3]">
                          <td className="p-3 text-sm font-semibold">{item.name}</td>
                          <td className="p-3 text-sm text-center text-[#6B6570]">{item.quantity}</td>
                          <td className="p-3 text-sm text-right text-[#6B6570]">{formatCurrency(item.price)}</td>
                          <td className="p-3 text-sm text-right font-bold">{formatCurrency(item.price * item.quantity, true)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex justify-between text-sm text-[#6B6570]"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal, true)}</span></div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm text-[#2ECC8A]"><span>Discount</span><span>-{formatCurrency(invoice.discount, true)}</span></div>
                  )}
                  {invoice.tax > 0 && (
                    <div className="flex justify-between text-sm text-[#6B6570]"><span>Tax</span><span>{formatCurrency(invoice.tax, true)}</span></div>
                  )}
                  <div className="flex justify-between border-t-2 border-[#EDE8E3] pt-3 text-xl font-black text-[#1A1025]">
                    <span>Grand Total</span>
                    <span className="text-[#C9A96E]">{formatCurrency(invoice.total, true)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#EDE8E3] flex gap-3">
              <button
                onClick={() => setShowPrintPreview(false)}
                className="flex-1 py-3 rounded-lg bg-[#F8F5F0] text-[#1A1025] font-semibold hover:bg-[#EDE8E3] transition-colors">
                Close
              </button>
              <button
                onClick={printInvoiceDocument}
                className="flex-1 py-3 rounded-lg text-white font-semibold hover:opacity-95 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #C9A96E 0%, #E8C98A 100%)' }}>
                Print Invoice
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
