/// <reference types="vite/client" />

import React, { useState, useEffect, useRef, useCallback, type ReactNode, type KeyboardEvent } from 'react';
import { useLocation } from 'react-router';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Building2,
  Smartphone,
  Printer,
  Mail,
  MessageSquare,
  X,
  ShoppingCart,
  Droplets,
  Sparkles,
  Sun,
  Gift,
  Layers,
  FlaskConical,
  UserRound,
  Check,
  Package,
  ChevronRight,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ssaLogo from '../../assets/ssa-logo.png';
import { ThermalReceiptPaper, buildThermalReceiptHtml, getThermalPageHeightMm, THERMAL_RECEIPT_WIDTH_MM, type ThermalReceiptData } from './ThermalReceipt';
import {
  getEnabledPaymentMethods,
  getTaxRateDecimal,
  getActiveBillPersons,
  authenticateBillPerson,
  loadSettings,
  isCreditEnabled,
  SETTINGS_UPDATED_EVENT,
  type PosPaymentMethod,
  type BillPersonPublic,
} from '../lib/settings';
import { appendInvoice, buildPosInvoice } from '../lib/invoices';

const mockProducts = [
  { id: 1, name: 'Hydrating Serum', category: 'Serums', price: 89, stock: 45 },
  { id: 2, name: 'Anti-Aging Cream', category: 'Creams', price: 125, stock: 32 },
  { id: 3, name: 'Vitamin C Serum', category: 'Serums', price: 95, stock: 28 },
  { id: 4, name: 'Retinol Night Cream', category: 'Creams', price: 110, stock: 5 },
  { id: 5, name: 'Facial Treatment - Basic', category: 'Treatments', price: 150, stock: 999 },
  { id: 6, name: 'Facial Treatment - Premium', category: 'Treatments', price: 280, stock: 999 },
  { id: 7, name: 'Exfoliating Scrub', category: 'Scrubs', price: 65, stock: 50 },
  { id: 8, name: 'Moisturizing Mask', category: 'Masks', price: 75, stock: 38 },
  { id: 9, name: 'Eye Cream Deluxe', category: 'Creams', price: 98, stock: 22 },
  { id: 10, name: 'Sunscreen SPF 50', category: 'Protection', price: 55, stock: 60 },
  { id: 11, name: 'Luxury Bundle', category: 'Bundles', price: 450, stock: 15 },
  { id: 12, name: 'Cleanser Foam', category: 'Cleansers', price: 48, stock: 0 },
];

const categories = ['All', 'Treatments', 'Serums', 'Creams', 'Bundles', 'Scrubs', 'Masks', 'Protection'];

const categoryIcons: Record<string, LucideIcon> = {
  Serums: Droplets,
  Creams: Sparkles,
  Treatments: UserRound,
  Scrubs: FlaskConical,
  Masks: Layers,
  Protection: Sun,
  Bundles: Gift,
  Cleansers: Droplets,
};

type PaymentMethod = PosPaymentMethod | null;

const PAYMENT_ICONS: Record<PosPaymentMethod, LucideIcon> = {
  Cash: Banknote,
  Card: CreditCard,
  Transfer: Building2,
  Mobile: Smartphone,
};

function useBillingSettings() {
  const location = useLocation();
  const [billing, setBilling] = useState(() => loadSettings().billing);

  useEffect(() => {
    const refresh = () => setBilling(loadSettings().billing);
    refresh();
    window.addEventListener(SETTINGS_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [location.pathname]);

  return billing;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
        Out of stock
      </span>
    );
  }
  if (stock >= 500) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary">
        Available
      </span>
    );
  }
  if (stock < 20) {
    return (
      <span className="inline-flex whitespace-nowrap rounded-md bg-[#F0A500]/10 px-2 py-0.5 text-[11px] font-medium text-[#A86F00]">
        Low · {stock}
      </span>
    );
  }
  return (
    <span className="inline-flex whitespace-nowrap rounded-md bg-[#2ECC8A]/10 px-2 py-0.5 text-[11px] font-medium text-[#159B61]">
      {stock} in stock
    </span>
  );
}

function StaffAuthModal({
  action,
  onClose,
  onSuccess,
}: {
  action: 'save' | 'print';
  onClose: () => void;
  onSuccess: (staffName: string) => void;
}) {
  const [persons, setPersons] = useState<BillPersonPublic[]>(() => getActiveBillPersons());
  const [personId, setPersonId] = useState<number>(() => getActiveBillPersons()[0]?.id ?? 0);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const refresh = () => {
      const active = getActiveBillPersons();
      setPersons(active);
      setPersonId((current) => (active.some((person) => person.id === current) ? current : active[0]?.id ?? 0));
    };
    refresh();
    window.addEventListener(SETTINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, refresh);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId) {
      setError('No bill person selected');
      return;
    }
    const person = authenticateBillPerson(personId, password);
    if (!person) {
      setError('Invalid staff or password');
      return;
    }
    onSuccess(person.name);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-[15px] font-semibold text-foreground">
              Staff authorization
            </h3>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {action === 'save' ? 'Enter bill password to save this invoice.' : 'Enter bill password to print this invoice.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-foreground">Staff member</label>
            <select
              value={personId || ''}
              onChange={(e) => setPersonId(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15">
              {persons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-foreground">Bill password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter bill password"
              autoFocus
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 flex-1 rounded-lg border border-border text-[13px] font-medium text-muted-foreground hover:bg-muted">
              Cancel
            </button>
            <button type="submit" className="h-9 flex-1 rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground hover:opacity-90">
              {action === 'save' ? 'Save Bill' : 'Print Bill'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function POS() {
  const location = useLocation();
  const billing = useBillingSettings();
  const enabledPaymentMethods = getEnabledPaymentMethods(billing);
  const creditEnabled = isCreditEnabled(billing);
  const taxRatePercent = parseFloat(billing.taxRate) || 0;
  const taxRateDecimal = getTaxRateDecimal(billing);

  const formatCurrency = useCallback(
    (amount: number, decimals = false) =>
      `${billing.currency} ${amount.toLocaleString(undefined, {
        minimumFractionDigits: decimals ? 2 : 0,
        maximumFractionDigits: decimals ? 2 : 0,
      })}`,
    [billing.currency],
  );

  const routedClient = (location.state as { clientName?: string } | null)?.clientName || null;
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(routedClient);
  const [treatmentName, setTreatmentName] = useState('');
  const [treatmentPrice, setTreatmentPrice] = useState('');
  const [discount, setDiscount] = useState('');
  const [includeTax, setIncludeTax] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [treatmentError, setTreatmentError] = useState('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [creditAmount, setCreditAmount] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [billStaffName, setBillStaffName] = useState<string | null>(null);
  const [staffAuthModal, setStaffAuthModal] = useState<{ action: 'save' | 'print' } | null>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const productListRef = useRef<HTMLDivElement>(null);
  const printAfterSaveRef = useRef(false);
  const keyboardHandlersRef = useRef({
    requestStaffAuth: (_action: 'save' | 'print') => {},
    printReceiptDocument: () => {},
    showReceipt: false,
    showPrintPreview: false,
    cartLength: 0,
    paymentMethod: null as PaymentMethod,
    setAlertMessage: (_message: string | null) => {},
  });

  useEffect(() => {
    setPaymentMethod((current) => {
      if (enabledPaymentMethods.length === 0) return null;
      if (current && enabledPaymentMethods.includes(current)) return current;
      return enabledPaymentMethods[0];
    });
  }, [enabledPaymentMethods]);

  const filteredProducts = mockProducts.filter(
    (p) =>
      (selectedCategory === 'All' || p.category === selectedCategory) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `SKU-${String(p.id).padStart(3, '0')}`.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openProductModal = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedProductIndex(0);
    setShowProductModal(true);
  }, []);

  const closeProductModal = useCallback(() => {
    setShowProductModal(false);
    setSearchQuery('');
    setSelectedProductIndex(0);
  }, []);

  useEffect(() => {
    if (showProductModal) {
      const timer = setTimeout(() => productSearchRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [showProductModal]);

  useEffect(() => {
    setSelectedProductIndex(0);
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    if (!showProductModal || !productListRef.current) return;
    const active = productListRef.current.querySelector('[data-active="true"]');
    active?.scrollIntoView({ block: 'nearest' });
  }, [selectedProductIndex, showProductModal, filteredProducts.length]);

  const addToCart = (product: typeof mockProducts[0]) => {
    if (product.stock === 0) return;
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      setCart(cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
          : item
      ));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const addProductFromPicker = (product: (typeof mockProducts)[0]) => {
    if (product.stock === 0) return;
    addToCart(product);
  };

  const handleProductSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (filteredProducts.length === 0) {
      if (e.key === 'Escape') closeProductModal();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedProductIndex((i) => Math.min(i + 1, filteredProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedProductIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const product = filteredProducts[selectedProductIndex];
      if (product) addProductFromPicker(product);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeProductModal();
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map((item) => {
      if (item.id === id) {
        const product = mockProducts.find((p) => p.id === id);
        const newQty = Math.max(1, Math.min(item.quantity + delta, product?.stock || 999));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = discount ? (subtotal * parseFloat(discount)) / 100 : 0;
  const taxAmount = includeTax ? (subtotal - discountAmount) * taxRateDecimal : 0;
  const total = subtotal - discountAmount + taxAmount;
  const appliedCredit = creditEnabled
    ? Math.min(Math.max(0, parseFloat(creditAmount) || 0), total)
    : 0;
  const paidAmount = Math.max(0, total - appliedCredit);
  const clientName = selectedClient || 'Walk-in';
  const receiptDate = new Date().toLocaleDateString();
  const receiptTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const thermalReceiptData: ThermalReceiptData = {
    clientName,
    billStaffName,
    paymentMethod,
    creditAmount: appliedCredit,
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
    logoSrc: ssaLogo,
  };

  const paymentSummary =
    appliedCredit > 0 && paidAmount > 0
      ? `${paymentMethod} ${formatCurrency(paidAmount, true)} + Credit ${formatCurrency(appliedCredit, true)}`
      : appliedCredit > 0
      ? `Credit ${formatCurrency(appliedCredit, true)}`
      : `${paymentMethod}`;

  const receiptSummary = [
    'Skin Spectrum Aesthetics',
    `Customer: ${clientName}`,
    `Staff: ${billStaffName || '—'}`,
    `Payment: ${paymentSummary}`,
    `Date: ${receiptDate}`,
    '',
    ...cart.map((item) => `${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity, true)}`),
    '',
    `Subtotal: ${formatCurrency(subtotal, true)}`,
    discountAmount > 0 ? `Discount: -${formatCurrency(discountAmount, true)}` : '',
    includeTax ? `Tax: ${formatCurrency(taxAmount, true)}` : '',
    `Grand Total: ${formatCurrency(total, true)}`,
    paidAmount > 0 ? `Paid Now: ${formatCurrency(paidAmount, true)}` : '',
    appliedCredit > 0 ? `On Credit: ${formatCurrency(appliedCredit, true)}` : '',
  ].filter(Boolean).join('\n');

  const handlePrintReceipt = () => {
    setShowPrintPreview(true);
  };

  const getReceiptPrintHtml = () => buildThermalReceiptHtml(thermalReceiptData);

  const printReceiptDocument = () => {
    const html = getReceiptPrintHtml();
    const pageHeightMm = getThermalPageHeightMm(cart.length);

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
      setAlertMessage('Unable to open print dialog.');
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
      iframeWindow.onload = () => setTimeout(triggerPrint, 300);
    }
  };

  const handleWhatsAppReceipt = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(receiptSummary)}`, '_blank');
  };

  const handleEmailReceipt = () => {
    const subject = encodeURIComponent('Skin Spectrum Aesthetics Payment Receipt');
    const body = encodeURIComponent(receiptSummary);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const validateBeforeBill = () => {
    if (cart.length === 0) {
      setAlertMessage('Please add a product or treatment before saving the bill.');
      return false;
    }
    if (paidAmount > 0 && !paymentMethod) {
      setAlertMessage('Please select a payment method for the amount being paid now.');
      return false;
    }
    if (creditEnabled && creditAmount.trim() !== '') {
      const parsed = parseFloat(creditAmount);
      if (Number.isNaN(parsed) || parsed < 0) {
        setAlertMessage('Credit amount must be zero or greater.');
        return false;
      }
      if (parsed > total) {
        setAlertMessage('Credit amount cannot exceed the grand total.');
        return false;
      }
    }
    if (paidAmount === 0 && appliedCredit === 0) {
      setAlertMessage('Enter a payment method or credit amount.');
      return false;
    }
    if (getActiveBillPersons().length === 0) {
      setAlertMessage('No bill persons configured. Add staff in Settings → Bill Person.');
      return false;
    }
    return true;
  };

  const executeBillAction = (action: 'save' | 'print', staffName: string) => {
    setBillStaffName(staffName);
    appendInvoice(
      buildPosInvoice({
        client: clientName,
        paymentMethod: paidAmount > 0 ? paymentMethod : null,
        creditAmount: appliedCredit,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total,
      })
    );
    if (action === 'save') {
      setShowReceipt(true);
      return;
    }
    printAfterSaveRef.current = true;
    setShowReceipt(true);
  };

  const requestStaffAuth = (action: 'save' | 'print') => {
    if (action === 'save' && showReceipt) return;
    if (action === 'print' && (showReceipt || showPrintPreview)) {
      printReceiptDocument();
      return;
    }
    if (!validateBeforeBill()) return;
    setStaffAuthModal({ action });
  };

  const proceedToBill = () => requestStaffAuth('save');

  keyboardHandlersRef.current = {
    requestStaffAuth,
    printReceiptDocument,
    showReceipt,
    showPrintPreview,
    cartLength: cart.length,
    paymentMethod,
    setAlertMessage,
  };

  useEffect(() => {
    if (!showReceipt || !printAfterSaveRef.current) return;
    printAfterSaveRef.current = false;
    const timer = setTimeout(() => {
      keyboardHandlersRef.current.printReceiptDocument();
    }, 300);
    return () => clearTimeout(timer);
  }, [showReceipt]);

  useEffect(() => {
    const handleKeyDown = (event: Event) => {
      const e = event as globalThis.KeyboardEvent;
      if (!(e.ctrlKey || e.metaKey)) return;

      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        keyboardHandlersRef.current.requestStaffAuth('save');
        return;
      }

      if (key === 'p') {
        e.preventDefault();
        const { showReceipt: receiptOpen, showPrintPreview: previewOpen } = keyboardHandlersRef.current;

        if (receiptOpen || previewOpen) {
          keyboardHandlersRef.current.printReceiptDocument();
          return;
        }
        keyboardHandlersRef.current.requestStaffAuth('print');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetSale = () => {
    setCart([]);
    setSelectedClient(null);
    setTreatmentName('');
    setTreatmentPrice('');
    setDiscount('');
    setShowReceipt(false);
    setShowPrintPreview(false);
    setBillStaffName(null);
    setPaymentMethod(enabledPaymentMethods[0] ?? 'Cash');
    setCreditAmount('');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const openTreatmentModal = () => {
    setTreatmentError('');
    setShowTreatmentModal(true);
  };

  const closeTreatmentModal = () => {
    setShowTreatmentModal(false);
    setTreatmentError('');
  };

  const addTreatmentToCart = () => {
    const price = parseFloat(treatmentPrice);
    if (!treatmentName.trim() || !price || price <= 0) {
      setTreatmentError('Please enter a treatment name and a valid price.');
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        id: -Date.now(),
        name: treatmentName.trim(),
        price,
        quantity: 1,
      },
    ]);
    setTreatmentName('');
    setTreatmentPrice('');
    setTreatmentError('');
    setShowTreatmentModal(false);
  };

  const CartPanel = (
    <Panel className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-5 py-4 md:px-6 md:py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-[15px] font-semibold text-foreground md:text-base">
            Current Sale
          </h3>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary">
            {cartCount} item{cartCount === 1 ? '' : 's'}
          </span>
        </div>

        <button
          type="button"
          onClick={openProductModal}
          className="mb-3 flex h-10 w-full items-center gap-3 rounded-lg border border-border bg-background px-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/30 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15">
          <Search size={16} className="shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <span className="flex-1 text-[13px] text-muted-foreground">Search and add products…</span>
          <span className="hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            ↵ Open
          </span>
        </button>

        <select
          value={selectedClient || ''}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] text-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15">
          <option value="">Walk-in Customer</option>
          {selectedClient && !['Emma Wilson', 'Sarah Johnson', 'Michael Brown', 'Jessica Davis'].includes(selectedClient) && (
            <option value={selectedClient}>{selectedClient}</option>
          )}
          <option value="Emma Wilson">Emma Wilson</option>
          <option value="Sarah Johnson">Sarah Johnson</option>
          <option value="Michael Brown">Michael Brown</option>
          <option value="Jessica Davis">Jessica Davis</option>
        </select>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4 md:px-6">
        <button
          type="button"
          onClick={openTreatmentModal}
          className="mb-3 flex w-full shrink-0 items-center justify-between rounded-lg border border-dashed border-border bg-background px-3.5 py-3 text-left transition-colors hover:border-primary/40 hover:bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-primary">
              <Sparkles size={15} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground">Add treatment bill</p>
              <p className="text-[11px] text-muted-foreground">Custom service or procedure</p>
            </div>
          </div>
          <Plus size={16} className="text-muted-foreground" strokeWidth={1.75} />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto scroll-area">
          <div className="space-y-2 pb-1">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 md:px-5">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-foreground md:text-sm">{item.name}</div>
                  <div className="text-[11px] text-muted-foreground md:text-[12px]">{formatCurrency(item.price)} each</div>
                </div>
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive">
                    <Minus size={12} strokeWidth={2} />
                  </button>
                  <span className="min-w-[2rem] text-center text-[14px] font-semibold tabular-nums text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
                    <Plus size={12} strokeWidth={2} />
                  </button>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <div className="text-right text-[13px] font-medium tabular-nums text-foreground md:text-sm">
                    {formatCurrency(item.price * item.quantity, true)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground/50">
                <ShoppingCart size={22} strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-medium text-foreground">Cart is empty</p>
              <p className="mt-1 max-w-[240px] text-[12px] leading-relaxed text-muted-foreground">
                Click search above to add products, or add a custom treatment
              </p>
            </div>
          )}
          </div>
        </div>
      </div>

      {cart.length > 0 && (
        <div className="shrink-0 border-t border-border px-4 pb-3 pt-3 md:px-5 md:pb-4">
          <div className="mb-2.5 space-y-2">
            {/* Disc · Credit · Tax — boxed row */}
            <div className={`grid gap-2 ${creditEnabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <div className="rounded-lg border border-border bg-background px-2.5 py-2">
                <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Disc</div>
                <input
                  type="number"
                  placeholder="%"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                  max="100"
                  className="h-7 w-full rounded-md border border-border bg-card px-2 text-[12px] tabular-nums focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                />
                <div className={`mt-1.5 text-[10px] font-medium tabular-nums ${discountAmount > 0 ? 'text-[#159B61]' : 'text-muted-foreground'}`}>
                  {discountAmount > 0 ? `-${formatCurrency(discountAmount, true)}` : formatCurrency(0, true)}
                </div>
              </div>

              {creditEnabled && (
                <div className="rounded-lg border border-border bg-background px-2.5 py-2">
                  <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Credit</div>
                  <input
                    type="number"
                    placeholder="0"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    min="0"
                    max={total}
                    className="h-7 w-full rounded-md border border-border bg-card px-2 text-[12px] tabular-nums focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                  <div className={`mt-1.5 text-[10px] font-medium tabular-nums ${appliedCredit > 0 ? 'text-[#A86F00]' : 'text-muted-foreground'}`}>
                    {formatCurrency(appliedCredit, true)}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-background px-2.5 py-2">
                <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Tax</div>
                <label className="flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-card px-2 text-[11px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={includeTax}
                    onChange={(e) => setIncludeTax(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="font-medium tabular-nums text-foreground">{taxRatePercent}%</span>
                </label>
                <div className={`mt-1.5 text-[10px] font-medium tabular-nums ${includeTax && taxAmount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {includeTax ? formatCurrency(taxAmount, true) : formatCurrency(0, true)}
                </div>
              </div>
            </div>

            {/* Totals — compact rows */}
            <div className="space-y-0.5 text-[12px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium tabular-nums text-foreground">{formatCurrency(subtotal, true)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-1.5">
                <span style={{ fontFamily: 'var(--font-heading)' }} className="text-[13px] font-semibold text-foreground">
                  Grand Total
                </span>
                <span style={{ fontFamily: 'var(--font-heading)' }} className="text-[15px] font-semibold tabular-nums text-primary">
                  {formatCurrency(total, true)}
                </span>
              </div>
              {creditEnabled && appliedCredit > 0 && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    Paid now · On credit
                  </span>
                  <span className="tabular-nums">
                    <span className="font-medium text-foreground">{formatCurrency(paidAmount, true)}</span>
                    <span className="mx-1 text-muted-foreground">·</span>
                    <span className="font-medium text-[#A86F00]">{formatCurrency(appliedCredit, true)}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Payment — compact inline pills */}
            {paidAmount > 0 && (
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Pay</span>
              <div className="flex flex-1 gap-1">
                {enabledPaymentMethods.map((method) => {
                  const Icon = PAYMENT_ICONS[method];
                  const selected = paymentMethod === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`flex flex-1 items-center justify-center gap-1 rounded-md border px-1.5 py-1.5 text-[10px] font-medium transition-colors ${
                        selected
                          ? 'border-primary bg-secondary text-primary'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-secondary/30'
                      }`}>
                      <Icon size={12} strokeWidth={1.75} />
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>
            )}
          </div>

          <button
            onClick={proceedToBill}
            className="w-full rounded-lg bg-foreground py-2 text-[12px] font-semibold text-background transition-opacity hover:opacity-90">
            Proceed to Bill
          </button>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            Ctrl+S save · Ctrl+P print · staff password required
          </p>
        </div>
      )}
    </Panel>
  );

  return (
    <div className="mx-auto flex h-[calc(100dvh-10.5rem)] max-h-[calc(100dvh-10.5rem)] w-full max-w-[1200px] flex-col overflow-hidden px-4 md:h-[calc(100dvh-7.75rem)] md:max-h-[calc(100dvh-7.75rem)] md:px-6 lg:h-[calc(100dvh-7rem)] lg:max-h-[calc(100dvh-7rem)] lg:px-8">
      <div className="min-h-0 flex-1 overflow-hidden">{CartPanel}</div>

      {/* Product Picker — right panel */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-50 flex">
            <button
              type="button"
              aria-label="Close product picker"
              className="min-w-0 flex-1"
              onClick={closeProductModal}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="flex h-full w-full max-w-[420px] flex-col border-l border-border bg-card shadow-[-8px_0_32px_rgba(26,16,37,0.08)]">
              <div className="border-b border-border px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-[15px] font-semibold text-foreground">
                    Add Product
                  </h3>
                  <button
                    type="button"
                    onClick={closeProductModal}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted">
                    <X size={18} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} strokeWidth={1.75} />
                  <input
                    ref={productSearchRef}
                    type="text"
                    placeholder="Search by name, category, or SKU…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleProductSearchKeyDown}
                    className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                        selectedCategory === cat
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  ↑↓ navigate · Enter to add · Esc to close
                </p>
              </div>

              <div ref={productListRef} className="min-h-0 flex-1 overflow-y-auto scroll-area p-2">
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package size={28} className="mb-2 text-muted-foreground/40" strokeWidth={1.5} />
                    <p className="text-[13px] font-medium text-foreground">No products found</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">Try a different search or category</p>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {filteredProducts.map((product, index) => {
                      const outOfStock = product.stock === 0;
                      const isActive = index === selectedProductIndex;
                      const CategoryIcon = categoryIcons[product.category] || Package;
                      return (
                        <li key={product.id}>
                          <button
                            type="button"
                            data-active={isActive}
                            disabled={outOfStock}
                            onClick={() => addProductFromPicker(product)}
                            onMouseEnter={() => setSelectedProductIndex(index)}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                              isActive
                                ? 'bg-foreground text-background'
                                : outOfStock
                                ? 'cursor-not-allowed opacity-45'
                                : 'hover:bg-muted/60'
                            }`}>
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                isActive ? 'bg-background/15 text-background' : 'bg-secondary text-primary'
                              }`}>
                              <CategoryIcon size={15} strokeWidth={1.75} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13px] font-medium">{product.name}</div>
                              <div className={`text-[11px] ${isActive ? 'text-background/70' : 'text-muted-foreground'}`}>
                                {product.category} · SKU-{String(product.id).padStart(3, '0')}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className={`text-[13px] font-medium tabular-nums ${isActive ? '' : 'text-foreground'}`}>
                                {formatCurrency(product.price)}
                              </div>
                              {!outOfStock && isActive && (
                                <div className="text-[10px] text-background/60">Enter ↵</div>
                              )}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Add Treatment Modal */}
      <AnimatePresence>
        {showTreatmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={closeTreatmentModal}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl">
              <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Sparkles size={17} strokeWidth={1.75} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-[15px] font-semibold text-foreground">
                      Add treatment bill
                    </h3>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">Enter a custom service or procedure</p>
                  </div>
                </div>
                <button
                  onClick={closeTreatmentModal}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 px-5 py-4">
                <div>
                  <label htmlFor="treatment-name" className="mb-1.5 block text-[12px] font-medium text-foreground">
                    Treatment / service
                  </label>
                  <input
                    id="treatment-name"
                    type="text"
                    value={treatmentName}
                    onChange={(e) => {
                      setTreatmentName(e.target.value);
                      if (treatmentError) setTreatmentError('');
                    }}
                    placeholder="e.g. Hydrafacial, Chemical Peel"
                    className={`h-9 w-full rounded-lg border bg-background px-3 text-[13px] focus:outline-none focus:ring-2 ${
                      treatmentError && !treatmentName.trim()
                        ? 'border-destructive/50 focus:border-destructive/50 focus:ring-destructive/15'
                        : 'border-border focus:border-primary/40 focus:ring-primary/15'
                    }`}
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="treatment-price" className="mb-1.5 block text-[12px] font-medium text-foreground">
                    Price (PKR)
                  </label>
                  <input
                    id="treatment-price"
                    type="number"
                    value={treatmentPrice}
                    onChange={(e) => {
                      setTreatmentPrice(e.target.value);
                      if (treatmentError) setTreatmentError('');
                    }}
                    min="0"
                    step="1"
                    placeholder="0"
                    className={`h-9 w-full rounded-lg border bg-background px-3 text-[13px] focus:outline-none focus:ring-2 ${
                      treatmentError && (!treatmentPrice || parseFloat(treatmentPrice) <= 0)
                        ? 'border-destructive/50 focus:border-destructive/50 focus:ring-destructive/15'
                        : 'border-border focus:border-primary/40 focus:ring-primary/15'
                    }`}
                    onKeyDown={(e) => e.key === 'Enter' && addTreatmentToCart()}
                  />
                </div>

                {treatmentError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                    <AlertCircle size={15} className="mt-0.5 shrink-0 text-destructive" strokeWidth={1.75} />
                    <p className="text-[12px] leading-relaxed text-destructive">{treatmentError}</p>
                  </motion.div>
                )}
              </div>

              <div className="flex gap-2 border-t border-border px-5 py-4">
                <button
                  type="button"
                  onClick={closeTreatmentModal}
                  className="flex-1 rounded-lg border border-border bg-background py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addTreatmentToCart}
                  className="flex-1 rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  Add to cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Modal */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={() => setAlertMessage(null)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F0A500]/10 text-[#A86F00]">
                  <AlertCircle size={18} strokeWidth={1.75} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-[15px] font-semibold text-foreground">
                    Action required
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{alertMessage}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAlertMessage(null)}
                className="w-full rounded-lg bg-foreground py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90">
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff bill authorization */}
      <AnimatePresence>
        {staffAuthModal && (
          <StaffAuthModal
            key={staffAuthModal.action}
            action={staffAuthModal.action}
            onClose={() => setStaffAuthModal(null)}
            onSuccess={(staffName) => {
              const action = staffAuthModal.action;
              setStaffAuthModal(null);
              executeBillAction(action, staffName);
            }}
          />
        )}
      </AnimatePresence>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
            onClick={resetSale}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto scroll-area rounded-xl border border-border bg-card p-5 shadow-xl md:p-6">
              <button onClick={resetSale} className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X size={18} />
              </button>

              <div className="mb-5 flex items-start gap-3 pr-8">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2ECC8A]/15 text-[#159B61]">
                  <Check size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-xl font-semibold text-foreground">
                    Bill completed
                  </h3>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    {appliedCredit > 0 && paidAmount > 0
                      ? `${formatCurrency(paidAmount, true)} paid via ${paymentMethod}, ${formatCurrency(appliedCredit, true)} on credit for ${clientName}`
                      : appliedCredit > 0
                      ? `${formatCurrency(appliedCredit, true)} on credit for ${clientName}`
                      : `${paymentMethod} payment received from ${clientName}`}
                  </p>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg border border-border bg-background p-3 text-[13px] md:grid-cols-5">
                {[
                  ['Customer', clientName],
                  ['Staff', billStaffName || '—'],
                  ['Payment', paymentSummary],
                  ['Date', receiptDate],
                  ['Items', String(cart.length)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
                    <div className="mt-0.5 font-medium text-foreground">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mb-4 overflow-hidden rounded-lg border border-border">
                <div className="grid grid-cols-12 bg-muted/30 px-4 py-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                {cart.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 border-t border-border/60 px-4 py-2.5 text-[13px]">
                    <div className="col-span-6 font-medium text-foreground">{item.name}</div>
                    <div className="col-span-2 text-center tabular-nums text-muted-foreground">{item.quantity}</div>
                    <div className="col-span-2 text-right tabular-nums text-muted-foreground">{formatCurrency(item.price)}</div>
                    <div className="col-span-2 text-right font-medium tabular-nums text-foreground">
                      {formatCurrency(item.price * item.quantity, true)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-5 rounded-lg bg-background p-3.5">
                <div className="space-y-1.5 text-[13px]">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span className="tabular-nums">{formatCurrency(subtotal, true)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#159B61]">
                      <span>Discount</span><span className="tabular-nums">-{formatCurrency(discountAmount, true)}</span>
                    </div>
                  )}
                  {includeTax && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax ({taxRatePercent}%)</span><span className="tabular-nums">{formatCurrency(taxAmount, true)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2">
                    <span className="font-semibold text-foreground">Grand Total</span>
                    <span className="font-semibold tabular-nums text-primary">{formatCurrency(total, true)}</span>
                  </div>
                  {paidAmount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Paid now</span>
                      <span className="tabular-nums">{formatCurrency(paidAmount, true)}</span>
                    </div>
                  )}
                  {appliedCredit > 0 && (
                    <div className="flex justify-between text-[#A86F00]">
                      <span>On credit</span>
                      <span className="tabular-nums font-medium">{formatCurrency(appliedCredit, true)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                {[
                  { icon: <Printer size={18} strokeWidth={1.75} />, label: 'Print', action: handlePrintReceipt },
                  { icon: <MessageSquare size={18} strokeWidth={1.75} />, label: 'WhatsApp', action: handleWhatsAppReceipt },
                  { icon: <Mail size={18} strokeWidth={1.75} />, label: 'Email', action: handleEmailReceipt },
                ].map((action) => (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-background py-3 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:bg-secondary/40 hover:text-foreground">
                    {action.icon}
                    {action.label}
                  </button>
                ))}
              </div>

              <button
                onClick={resetSale}
                className="w-full rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                New Sale
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPrintPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setShowPrintPreview(false)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[92vh] w-full max-w-[420px] flex-col overflow-hidden rounded-xl border border-border bg-[#E8E2DA] shadow-xl">
              <div className="flex shrink-0 gap-2 border-b border-border bg-card p-3">
                <button
                  onClick={printReceiptDocument}
                  className="flex-1 rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground">
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="rounded-lg border border-border bg-background px-4 py-2.5 text-[13px] font-medium text-muted-foreground">
                  Close
                </button>
              </div>

              <div className="px-3 py-2 text-center text-[10px] text-muted-foreground">
                80mm thermal preview · pharmacy / utility bill size
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto scroll-area p-4">
                <ThermalReceiptPaper data={thermalReceiptData} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
