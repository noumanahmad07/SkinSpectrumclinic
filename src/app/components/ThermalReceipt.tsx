import React from 'react';

export type ThermalReceiptItem = {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  discount?: number;
};

export type ThermalReceiptData = {
  clientName: string;
  billStaffName: string | null;
  paymentMethod: string | null;
  creditAmount?: number;
  paidAmount?: number;
  receiptDate: string;
  receiptTime?: string;
  cart: ThermalReceiptItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  includeTax: boolean;
  taxRatePercent: number;
  formatCurrency: (amount: number, decimals?: boolean) => string;
  logoSrc: string;
};

function formatPaymentLine(data: ThermalReceiptData): string {
  const credit = data.creditAmount ?? 0;
  const paid = data.paidAmount ?? Math.max(0, data.total - credit);
  if (credit > 0 && paid > 0) {
    return `${data.paymentMethod || 'Paid'} ${data.formatCurrency(paid, true)} + Credit ${data.formatCurrency(credit, true)}`;
  }
  if (credit > 0) return `Credit ${data.formatCurrency(credit, true)}`;
  return data.paymentMethod || '—';
}

/** Estimate thermal roll height from item count (80mm width). */
export function getThermalPageHeightMm(itemCount: number): number {
  const base = 92;
  const perItem = 11;
  return Math.max(120, Math.ceil(base + itemCount * perItem));
}

export const THERMAL_RECEIPT_WIDTH_MM = 80;

/** Line-item amount only (no currency prefix) for thermal item columns. */
function formatThermalLineAmount(amount: number, decimals = true): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });
}

function getThermalItemDiscountAmount(item: { price: number; quantity: number; discount?: number }) {
  const discount = Math.min(100, Math.max(0, item.discount ?? 0));
  return (item.price * item.quantity * discount) / 100;
}

function getThermalItemLineTotal(item: { price: number; quantity: number; discount?: number }) {
  return Math.max(0, item.price * item.quantity - getThermalItemDiscountAmount(item));
}

function dashedRule(className = '') {
  return <div className={`border-t border-dashed border-[#B8AFA6] ${className}`} />;
}

export function ThermalReceiptPaper({
  data,
  className = '',
}: {
  data: ThermalReceiptData;
  className?: string;
}) {
  const {
    clientName,
    billStaffName,
    paymentMethod,
    creditAmount = 0,
    paidAmount,
    receiptDate,
    receiptTime,
    cart,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    includeTax,
    taxRatePercent,
    formatCurrency,
    logoSrc,
  } = data;

  const appliedCredit = creditAmount;
  const appliedPaid = paidAmount ?? Math.max(0, total - appliedCredit);
  const paymentLine = formatPaymentLine(data);

  const metaRows = [
    ['Date', receiptTime ? `${receiptDate} ${receiptTime}` : receiptDate],
    ['Customer', clientName],
    ['Staff', billStaffName || '—'],
    ['Payment', paymentLine],
    ['Items', String(cart.length)],
  ] as const;

  return (
    <div
      className={`mx-auto w-full max-w-[80mm] bg-white px-3 py-4 font-mono text-[#1A1025] shadow-[0_8px_30px_rgba(26,16,37,0.12)] ${className}`}
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
      <div className="text-center">
        <img src={logoSrc} alt="Logo" className="mx-auto mb-2 h-12 w-12 rounded-full bg-black object-cover" />
        <div className="text-[11px] font-bold uppercase tracking-[0.08em]">Skin Spectrum Aesthetics</div>
        <div className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-[#6B6570]">Payment Receipt</div>
      </div>

      {dashedRule('my-3')}

      <div className="space-y-1 text-[10px] leading-snug">
        {metaRows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <span className="shrink-0 text-[#6B6570]">{label}</span>
            <span className="text-right font-semibold">{value}</span>
          </div>
        ))}
      </div>

      {dashedRule('my-3')}

      <div className="mb-1 flex text-[9px] font-bold uppercase tracking-wide text-[#6B6570]">
        <span className="flex-1">Item</span>
        <span className="w-7 text-center">Qty</span>
        <span className="w-[4.5rem] text-right">Amount</span>
      </div>

      <div className="space-y-2">
        {cart.map((item) => (
          <div key={item.id} className="text-[10px] leading-snug">
            <div className="flex items-start gap-1">
              <span className="flex-1 break-words font-semibold">{item.name}</span>
              <span className="w-7 shrink-0 text-center tabular-nums">{item.quantity}</span>
              <span className="w-[4.5rem] shrink-0 text-right tabular-nums font-semibold">
                {formatThermalLineAmount(getThermalItemLineTotal(item), true)}
              </span>
            </div>
            {(item.discount ?? 0) > 0 && (
              <div className="mt-0.5 text-right text-[9px] font-semibold text-[#159B61]">
                {item.discount}% off
              </div>
            )}
          </div>
        ))}
      </div>

      {dashedRule('my-3')}

      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between gap-3">
          <span className="text-[#6B6570]">Subtotal</span>
          <span className="tabular-nums font-semibold">{formatCurrency(subtotal, true)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between gap-3 text-[#159B61]">
            <span>Discount</span>
            <span className="tabular-nums font-semibold">-{formatCurrency(discountAmount, true)}</span>
          </div>
        )}
        {includeTax && (
          <div className="flex justify-between gap-3">
            <span className="text-[#6B6570]">Tax ({taxRatePercent}%)</span>
            <span className="tabular-nums font-semibold">{formatCurrency(taxAmount, true)}</span>
          </div>
        )}
      </div>

      <div className="my-2 border-t-2 border-double border-[#1A1025]" />

      <div className="flex justify-between gap-3 text-[11px] font-bold">
        <span>GRAND TOTAL</span>
        <span className="tabular-nums text-[#A67F3F]">{formatCurrency(total, true)}</span>
      </div>
      {appliedPaid > 0 && (
        <div className="mt-1 flex justify-between gap-3 text-[10px]">
          <span className="text-[#6B6570]">Paid now</span>
          <span className="tabular-nums font-semibold">{formatCurrency(appliedPaid, true)}</span>
        </div>
      )}
      {appliedCredit > 0 && (
        <div className="mt-1 flex justify-between gap-3 text-[10px]">
          <span className="text-[#6B6570]">On credit</span>
          <span className="tabular-nums font-semibold text-[#A86F00]">{formatCurrency(appliedCredit, true)}</span>
        </div>
      )}

      {dashedRule('my-3')}

      <p className="text-center text-[9px] leading-relaxed text-[#6B6570]">
        Thank you for visiting Skin Spectrum Aesthetics
      </p>
      <p className="mt-2 text-center text-[8px] text-[#9A929E]">*** Computer generated receipt ***</p>
    </div>
  );
}

export function buildThermalReceiptHtml(data: ThermalReceiptData): string {
  const {
    clientName,
    billStaffName,
    paymentMethod,
    creditAmount = 0,
    paidAmount,
    receiptDate,
    receiptTime,
    cart,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    includeTax,
    taxRatePercent,
    formatCurrency,
    logoSrc,
  } = data;

  const appliedCredit = creditAmount;
  const appliedPaid = paidAmount ?? Math.max(0, total - appliedCredit);
  const paymentLine = formatPaymentLine(data);

  const esc = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const metaRows = [
    ['Date', receiptTime ? `${receiptDate} ${receiptTime}` : receiptDate],
    ['Customer', clientName],
    ['Staff', billStaffName || '—'],
    ['Payment', paymentLine],
    ['Items', String(cart.length)],
  ];

  const itemsHtml = cart
    .map(
      (item) => `
      <div class="item">
        <div class="item-row">
          <span class="item-name">${esc(item.name)}</span>
          <span class="qty">${item.quantity}</span>
          <span class="amt">${esc(formatThermalLineAmount(getThermalItemLineTotal(item), true))}</span>
        </div>
        ${(item.discount ?? 0) > 0 ? `<div class="item-discount">${item.discount}% off</div>` : ''}
      </div>`,
    )
    .join('');

  const metaHtml = metaRows
    .map(
      ([label, value]) => `
      <div class="meta-row">
        <span class="meta-label">${esc(label)}</span>
        <span class="meta-value">${esc(value)}</span>
      </div>`,
    )
    .join('');

  const pageHeightMm = getThermalPageHeightMm(cart.length);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt - Skin Spectrum Aesthetics</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      @page {
        size: ${THERMAL_RECEIPT_WIDTH_MM}mm ${pageHeightMm}mm;
        margin: 0;
      }
      html, body {
        width: ${THERMAL_RECEIPT_WIDTH_MM}mm;
        height: ${pageHeightMm}mm;
        max-width: ${THERMAL_RECEIPT_WIDTH_MM}mm;
        max-height: ${pageHeightMm}mm;
        overflow: hidden;
        background: #fff;
        color: #1A1025;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 10px;
        line-height: 1.35;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { padding: 3mm 4mm 4mm; }
      .receipt { width: 100%; page-break-after: avoid; page-break-inside: avoid; }
      .center { text-align: center; }
      .logo {
        width: 44px; height: 44px; border-radius: 50%;
        display: block; margin: 0 auto 6px; object-fit: cover; background: #000;
      }
      .brand { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-align: center; }
      .subtitle { margin-top: 2px; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #6B6570; text-align: center; }
      .rule { border-top: 1px dashed #B8AFA6; margin: 10px 0; }
      .rule-double { border-top: 2px double #1A1025; margin: 8px 0; }
      .meta-row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; font-size: 10px; }
      .meta-label { color: #6B6570; flex-shrink: 0; }
      .meta-value { font-weight: 700; text-align: right; word-break: break-word; }
      .head { display: flex; font-size: 9px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #6B6570; margin-bottom: 4px; }
      .head .item-col { flex: 1; }
      .head .qty { width: 24px; text-align: center; }
      .head .amt { width: 68px; text-align: right; }
      .item { margin-bottom: 8px; font-size: 10px; }
      .item-row { display: flex; align-items: flex-start; gap: 4px; }
      .item-name { flex: 1; font-weight: 700; word-break: break-word; }
      .qty { width: 24px; text-align: center; flex-shrink: 0; }
      .amt { width: 68px; text-align: right; flex-shrink: 0; font-weight: 700; }
      .item-discount { margin-top: 2px; text-align: right; font-size: 9px; font-weight: 700; color: #159B61; }
      .total-row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; font-size: 10px; }
      .total-row .label { color: #6B6570; }
      .total-row .value { font-weight: 700; }
      .total-row.discount .value { color: #159B61; }
      .grand { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; font-weight: 800; }
      .grand .value { color: #A67F3F; }
      .footer { margin-top: 10px; text-align: center; font-size: 9px; color: #6B6570; line-height: 1.45; }
      .fine { margin-top: 8px; text-align: center; font-size: 8px; color: #9A929E; }
      @media print {
        html, body {
          width: ${THERMAL_RECEIPT_WIDTH_MM}mm !important;
          height: ${pageHeightMm}mm !important;
          max-width: ${THERMAL_RECEIPT_WIDTH_MM}mm !important;
          max-height: ${pageHeightMm}mm !important;
          margin: 0 !important;
          overflow: hidden !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="center">
        <img class="logo" src="${logoSrc}" alt="Logo" />
        <div class="brand">Skin Spectrum Aesthetics</div>
        <div class="subtitle">Payment Receipt</div>
      </div>
      <div class="rule"></div>
      ${metaHtml}
      <div class="rule"></div>
      <div class="head">
        <span class="item-col">Item</span>
        <span class="qty">Qty</span>
        <span class="amt">Amount</span>
      </div>
      ${itemsHtml}
      <div class="rule"></div>
      <div class="total-row"><span class="label">Subtotal</span><span class="value">${esc(formatCurrency(subtotal, true))}</span></div>
      ${discountAmount > 0 ? `<div class="total-row discount"><span class="label">Discount</span><span class="value">-${esc(formatCurrency(discountAmount, true))}</span></div>` : ''}
      ${includeTax ? `<div class="total-row"><span class="label">Tax (${taxRatePercent}%)</span><span class="value">${esc(formatCurrency(taxAmount, true))}</span></div>` : ''}
      <div class="rule-double"></div>
      <div class="grand"><span>GRAND TOTAL</span><span class="value">${esc(formatCurrency(total, true))}</span></div>
      ${appliedPaid > 0 ? `<div class="total-row"><span class="label">Paid now</span><span class="value">${esc(formatCurrency(appliedPaid, true))}</span></div>` : ''}
      ${appliedCredit > 0 ? `<div class="total-row"><span class="label">On credit</span><span class="value" style="color:#A86F00">${esc(formatCurrency(appliedCredit, true))}</span></div>` : ''}
      <div class="rule"></div>
      <div class="footer">Thank you for visiting Skin Spectrum Aesthetics</div>
      <div class="fine">*** Computer generated receipt ***</div>
    </div>
  </body>
</html>`;
}

export type ThermalInvoiceItem = {
  name: string;
  quantity: number;
  price: number;
  discount?: number;
};

export type ThermalInvoiceData = {
  invoiceId: string;
  clientName: string;
  status: 'Paid' | 'Credit';
  date: string;
  dueDate: string;
  items: ThermalInvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  creditAmount?: number;
  paidAmount?: number;
  paymentMethod?: string;
  formatCurrency: (amount: number, decimals?: boolean) => string;
  logoSrc: string;
};

export function getThermalInvoicePageHeightMm(itemCount: number): number {
  const base = 112;
  const perItem = 11;
  return Math.max(140, Math.ceil(base + itemCount * perItem));
}

export function ThermalInvoicePaper({
  data,
  className = '',
}: {
  data: ThermalInvoiceData;
  className?: string;
}) {
  const {
    invoiceId,
    clientName,
    status,
    date,
    dueDate,
    items,
    subtotal,
    discount,
    tax,
    total,
    creditAmount = 0,
    paidAmount,
    paymentMethod,
    formatCurrency,
    logoSrc,
  } = data;

  const appliedCredit = creditAmount;
  const appliedPaid = paidAmount ?? Math.max(0, total - appliedCredit);

  const metaRows = [
    ['Invoice', invoiceId],
    ['Status', status],
    ['Client', clientName],
    ['Date', date],
    ['Due', dueDate],
    ...(paymentMethod ? [['Payment', paymentMethod] as const] : []),
  ] as const;

  return (
    <div
      className={`mx-auto w-full max-w-[80mm] bg-white px-3 py-4 font-mono text-[#1A1025] shadow-[0_8px_30px_rgba(26,16,37,0.12)] ${className}`}
      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>
      <div className="text-center">
        <img src={logoSrc} alt="Logo" className="mx-auto mb-2 h-12 w-12 rounded-full bg-black object-cover" />
        <div className="text-[11px] font-bold uppercase tracking-[0.08em]">Skin Spectrum Aesthetics</div>
        <div className="mt-0.5 text-[9px] uppercase tracking-[0.14em] text-[#6B6570]">Tax Invoice</div>
      </div>

      {dashedRule('my-3')}

      <div className="space-y-1 text-[10px] leading-snug">
        {metaRows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3">
            <span className="shrink-0 text-[#6B6570]">{label}</span>
            <span className="text-right font-semibold">{value}</span>
          </div>
        ))}
      </div>

      {dashedRule('my-3')}

      <div className="mb-1 flex text-[9px] font-bold uppercase tracking-wide text-[#6B6570]">
        <span className="flex-1">Item</span>
        <span className="w-7 text-center">Qty</span>
        <span className="w-[4.5rem] text-right">Amount</span>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="text-[10px] leading-snug">
            <div className="flex items-start gap-1">
              <span className="flex-1 break-words font-semibold">{item.name}</span>
              <span className="w-7 shrink-0 text-center tabular-nums">{item.quantity}</span>
              <span className="w-[4.5rem] shrink-0 text-right tabular-nums font-semibold">
                {formatThermalLineAmount(getThermalItemLineTotal(item), true)}
              </span>
            </div>
            {(item.discount ?? 0) > 0 && (
              <div className="mt-0.5 text-right text-[9px] font-semibold text-[#159B61]">
                {item.discount}% off
              </div>
            )}
          </div>
        ))}
      </div>

      {dashedRule('my-3')}

      <div className="space-y-1 text-[10px]">
        <div className="flex justify-between gap-3">
          <span className="text-[#6B6570]">Subtotal</span>
          <span className="tabular-nums font-semibold">{formatCurrency(subtotal, true)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between gap-3 text-[#159B61]">
            <span>Discount</span>
            <span className="tabular-nums font-semibold">-{formatCurrency(discount, true)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between gap-3">
            <span className="text-[#6B6570]">Tax</span>
            <span className="tabular-nums font-semibold">{formatCurrency(tax, true)}</span>
          </div>
        )}
      </div>

      <div className="my-2 border-t-2 border-double border-[#1A1025]" />

      <div className="flex justify-between gap-3 text-[11px] font-bold">
        <span>GRAND TOTAL</span>
        <span className="tabular-nums text-[#A67F3F]">{formatCurrency(total, true)}</span>
      </div>
      {appliedPaid > 0 && (
        <div className="mt-1 flex justify-between gap-3 text-[10px]">
          <span className="text-[#6B6570]">Paid</span>
          <span className="tabular-nums font-semibold">{formatCurrency(appliedPaid, true)}</span>
        </div>
      )}
      {appliedCredit > 0 && (
        <div className="mt-1 flex justify-between gap-3 text-[10px]">
          <span className="text-[#6B6570]">On credit</span>
          <span className="tabular-nums font-semibold text-[#A86F00]">{formatCurrency(appliedCredit, true)}</span>
        </div>
      )}

      {status === 'Paid' && (
        <div className="my-3 text-center text-[13px] font-bold tracking-[0.2em] text-[#159B61] opacity-70">
          *** PAID ***
        </div>
      )}

      {dashedRule('my-3')}

      <p className="text-center text-[9px] leading-relaxed text-[#6B6570]">
        Thank you for visiting Skin Spectrum Aesthetics
      </p>
      <p className="mt-2 text-center text-[8px] text-[#9A929E]">*** Computer generated invoice ***</p>
    </div>
  );
}

export function buildThermalInvoiceHtml(data: ThermalInvoiceData): string {
  const {
    invoiceId,
    clientName,
    status,
    date,
    dueDate,
    items,
    subtotal,
    discount,
    tax,
    total,
    creditAmount = 0,
    paidAmount,
    paymentMethod,
    formatCurrency,
    logoSrc,
  } = data;

  const appliedCredit = creditAmount;
  const appliedPaid = paidAmount ?? Math.max(0, total - appliedCredit);

  const esc = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const metaRows = [
    ['Invoice', invoiceId],
    ['Status', status],
    ['Client', clientName],
    ['Date', date],
    ['Due', dueDate],
    ...(paymentMethod ? [['Payment', paymentMethod]] : []),
  ];

  const metaHtml = metaRows
    .map(
      ([label, value]) => `
      <div class="meta-row">
        <span class="meta-label">${esc(label)}</span>
        <span class="meta-value">${esc(value)}</span>
      </div>`,
    )
    .join('');

  const itemsHtml = items
    .map(
      (item) => `
      <div class="item">
        <div class="item-row">
          <span class="item-name">${esc(item.name)}</span>
          <span class="qty">${item.quantity}</span>
          <span class="amt">${esc(formatThermalLineAmount(getThermalItemLineTotal(item), true))}</span>
        </div>
        ${(item.discount ?? 0) > 0 ? `<div class="item-discount">${item.discount}% off</div>` : ''}
      </div>`,
    )
    .join('');

  const pageHeightMm = getThermalInvoicePageHeightMm(items.length);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${esc(invoiceId)} - Skin Spectrum Aesthetics</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      @page {
        size: ${THERMAL_RECEIPT_WIDTH_MM}mm ${pageHeightMm}mm;
        margin: 0;
      }
      html, body {
        width: ${THERMAL_RECEIPT_WIDTH_MM}mm;
        height: ${pageHeightMm}mm;
        max-width: ${THERMAL_RECEIPT_WIDTH_MM}mm;
        max-height: ${pageHeightMm}mm;
        overflow: hidden;
        background: #fff;
        color: #1A1025;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 10px;
        line-height: 1.35;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { padding: 3mm 4mm 4mm; }
      .receipt { width: 100%; page-break-after: avoid; page-break-inside: avoid; }
      .center { text-align: center; }
      .logo {
        width: 44px; height: 44px; border-radius: 50%;
        display: block; margin: 0 auto 6px; object-fit: cover; background: #000;
      }
      .brand { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; text-align: center; }
      .subtitle { margin-top: 2px; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #6B6570; text-align: center; }
      .rule { border-top: 1px dashed #B8AFA6; margin: 10px 0; }
      .rule-double { border-top: 2px double #1A1025; margin: 8px 0; }
      .meta-row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; font-size: 10px; }
      .meta-label { color: #6B6570; flex-shrink: 0; }
      .meta-value { font-weight: 700; text-align: right; word-break: break-word; }
      .head { display: flex; font-size: 9px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #6B6570; margin-bottom: 4px; }
      .head .item-col { flex: 1; }
      .head .qty { width: 24px; text-align: center; }
      .head .amt { width: 68px; text-align: right; }
      .item { margin-bottom: 8px; font-size: 10px; }
      .item-row { display: flex; align-items: flex-start; gap: 4px; }
      .item-name { flex: 1; font-weight: 700; word-break: break-word; }
      .qty { width: 24px; text-align: center; flex-shrink: 0; }
      .amt { width: 68px; text-align: right; flex-shrink: 0; font-weight: 700; }
      .item-discount { margin-top: 2px; text-align: right; font-size: 9px; font-weight: 700; color: #159B61; }
      .total-row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; font-size: 10px; }
      .total-row .label { color: #6B6570; }
      .total-row .value { font-weight: 700; }
      .total-row.discount .value { color: #159B61; }
      .grand { display: flex; justify-content: space-between; gap: 8px; font-size: 11px; font-weight: 800; }
      .grand .value { color: #A67F3F; }
      .paid-stamp { margin: 10px 0; text-align: center; font-size: 13px; font-weight: 800; letter-spacing: 0.2em; color: #159B61; opacity: 0.72; }
      .footer { margin-top: 10px; text-align: center; font-size: 9px; color: #6B6570; line-height: 1.45; }
      .fine { margin-top: 8px; text-align: center; font-size: 8px; color: #9A929E; }
      @media print {
        html, body {
          width: ${THERMAL_RECEIPT_WIDTH_MM}mm !important;
          height: ${pageHeightMm}mm !important;
          max-width: ${THERMAL_RECEIPT_WIDTH_MM}mm !important;
          max-height: ${pageHeightMm}mm !important;
          margin: 0 !important;
          overflow: hidden !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="center">
        <img class="logo" src="${logoSrc}" alt="Logo" />
        <div class="brand">Skin Spectrum Aesthetics</div>
        <div class="subtitle">Tax Invoice</div>
      </div>
      <div class="rule"></div>
      ${metaHtml}
      <div class="rule"></div>
      <div class="head">
        <span class="item-col">Item</span>
        <span class="qty">Qty</span>
        <span class="amt">Amount</span>
      </div>
      ${itemsHtml}
      <div class="rule"></div>
      <div class="total-row"><span class="label">Subtotal</span><span class="value">${esc(formatCurrency(subtotal, true))}</span></div>
      ${discount > 0 ? `<div class="total-row discount"><span class="label">Discount</span><span class="value">-${esc(formatCurrency(discount, true))}</span></div>` : ''}
      ${tax > 0 ? `<div class="total-row"><span class="label">Tax</span><span class="value">${esc(formatCurrency(tax, true))}</span></div>` : ''}
      <div class="rule-double"></div>
      <div class="grand"><span>GRAND TOTAL</span><span class="value">${esc(formatCurrency(total, true))}</span></div>
      ${appliedPaid > 0 ? `<div class="total-row"><span class="label">Paid</span><span class="value">${esc(formatCurrency(appliedPaid, true))}</span></div>` : ''}
      ${appliedCredit > 0 ? `<div class="total-row"><span class="label">On credit</span><span class="value" style="color:#A86F00">${esc(formatCurrency(appliedCredit, true))}</span></div>` : ''}
      ${status === 'Paid' ? '<div class="paid-stamp">*** PAID ***</div>' : ''}
      <div class="rule"></div>
      <div class="footer">Thank you for visiting Skin Spectrum Aesthetics</div>
      <div class="fine">*** Computer generated invoice ***</div>
    </div>
  </body>
</html>`;
}
