export const INVOICES_STORAGE_KEY = 'skinspectrum_invoices';
export const INVOICES_UPDATED_EVENT = 'skinspectrum-invoices-updated';

const INVOICE_ID_PREFIX = 'INV';
const INVOICE_DUE_DAYS = 30;

export interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

export type InvoiceStatus = 'Paid' | 'Credit';

export interface Invoice {
  id: string;
  client: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  creditAmount?: number;
  paidAmount?: number;
  paymentMethod?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

function normalizeInvoice(invoice: Invoice): Invoice {
  const credit = Math.max(0, invoice.creditAmount ?? 0);
  const hasCredit = credit > 0;

  return {
    ...invoice,
    status: hasCredit ? 'Credit' : 'Paid',
    creditAmount: hasCredit ? credit : undefined,
    paidAmount: hasCredit
      ? (invoice.paidAmount ?? Math.max(0, invoice.total - credit))
      : invoice.total,
  };
}

export function loadInvoices(fallback: Invoice[]): Invoice[] {
  try {
    const raw = window.localStorage.getItem(INVOICES_STORAGE_KEY);
    if (!raw) return fallback.map(normalizeInvoice);
    const parsed = JSON.parse(raw) as Invoice[];
    return parsed.map(normalizeInvoice);
  } catch {
    return fallback.map(normalizeInvoice);
  }
}

export function saveInvoices(invoices: Invoice[]) {
  window.localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
  window.dispatchEvent(new Event(INVOICES_UPDATED_EVENT));
}

export function appendInvoice(invoice: Invoice) {
  const existing = loadInvoices([]);
  saveInvoices([invoice, ...existing]);
}

export function createNextInvoiceId(existing: Invoice[]): string {
  const prefix = INVOICE_ID_PREFIX;
  const nums = existing.map((inv) => {
    const suffix = inv.id.startsWith(`${prefix}-`) ? inv.id.slice(prefix.length + 1) : inv.id.split('-').pop() ?? '0';
    const n = parseInt(suffix, 10);
    return Number.isFinite(n) ? n : 0;
  });
  const next = nums.length ? Math.max(...nums) + 1 : 1235;
  return `${prefix}-${next}`;
}

export function buildPosInvoice(params: {
  client: string;
  paymentMethod: string | null;
  creditAmount: number;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}): Invoice {
  const existing = loadInvoices([]);
  const id = createNextInvoiceId(existing);
  const today = new Date();
  const due = new Date(today);
  due.setDate(due.getDate() + INVOICE_DUE_DAYS);

  const credit = Math.min(Math.max(0, params.creditAmount), params.total);
  const paid = Math.max(0, params.total - credit);
  const hasCredit = credit > 0;

  return {
    id,
    client: params.client,
    date: today.toISOString().slice(0, 10),
    dueDate: due.toISOString().slice(0, 10),
    amount: params.total,
    status: hasCredit ? 'Credit' : 'Paid',
    creditAmount: hasCredit ? credit : undefined,
    paidAmount: paid > 0 ? paid : undefined,
    paymentMethod: paid > 0 ? (params.paymentMethod ?? undefined) : undefined,
    items: params.items,
    subtotal: params.subtotal,
    discount: params.discount,
    tax: params.tax,
    total: params.total,
  };
}
