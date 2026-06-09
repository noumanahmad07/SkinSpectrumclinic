import { useState } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Building2, Printer, Mail, MessageSquare, X, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ssaLogo from '../../assets/ssa-logo.png';

const mockProducts = [
  { id: 1, name: 'Hydrating Serum', category: 'Serums', price: 89, stock: 45, image: '💧' },
  { id: 2, name: 'Anti-Aging Cream', category: 'Creams', price: 125, stock: 32, image: '✨' },
  { id: 3, name: 'Vitamin C Serum', category: 'Serums', price: 95, stock: 28, image: '🍊' },
  { id: 4, name: 'Retinol Night Cream', category: 'Creams', price: 110, stock: 5, image: '🌙' },
  { id: 5, name: 'Facial Treatment - Basic', category: 'Treatments', price: 150, stock: 999, image: '💆' },
  { id: 6, name: 'Facial Treatment - Premium', category: 'Treatments', price: 280, stock: 999, image: '💆‍♀️' },
  { id: 7, name: 'Exfoliating Scrub', category: 'Scrubs', price: 65, stock: 50, image: '🧴' },
  { id: 8, name: 'Moisturizing Mask', category: 'Masks', price: 75, stock: 38, image: '🎭' },
  { id: 9, name: 'Eye Cream Deluxe', category: 'Creams', price: 98, stock: 22, image: '👁️' },
  { id: 10, name: 'Sunscreen SPF 50', category: 'Protection', price: 55, stock: 60, image: '☀️' },
  { id: 11, name: 'Luxury Bundle', category: 'Bundles', price: 450, stock: 15, image: '🎁' },
  { id: 12, name: 'Cleanser Foam', category: 'Cleansers', price: 48, stock: 0, image: '🫧' },
];

const categories = ['All', 'Treatments', 'Serums', 'Creams', 'Bundles', 'Scrubs', 'Masks', 'Protection'];

const formatCurrency = (amount: number, decimals = false) =>
  `PKR ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })}`;

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

type PaymentMethod = 'Cash' | 'Card' | 'Transfer' | null;

export default function POS() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [discount, setDiscount] = useState('');
  const [includeTax, setIncludeTax] = useState(true);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');

  const filteredProducts = mockProducts.filter(
    (p) =>
      (selectedCategory === 'All' || p.category === selectedCategory) &&
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    // Switch to cart view on mobile after adding
    setMobileView('cart');
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
  const taxAmount = includeTax ? (subtotal - discountAmount) * 0.08 : 0;
  const total = subtotal - discountAmount + taxAmount;
  const clientName = selectedClient
    ? ['', 'Emma Wilson', 'Sarah Johnson', 'Michael Brown', 'Jessica Davis'][parseInt(selectedClient)]
    : 'Walk-in';
  const receiptDate = new Date().toLocaleDateString();

  const receiptSummary = [
    'Skin Spectrum Aesthetics',
    `Customer: ${clientName}`,
    `Payment: ${paymentMethod}`,
    `Date: ${receiptDate}`,
    '',
    ...cart.map((item) => `${item.name} x${item.quantity} - ${formatCurrency(item.price * item.quantity, true)}`),
    '',
    `Subtotal: ${formatCurrency(subtotal, true)}`,
    discountAmount > 0 ? `Discount: -${formatCurrency(discountAmount, true)}` : '',
    includeTax ? `Tax: ${formatCurrency(taxAmount, true)}` : '',
    `Total Paid: ${formatCurrency(total, true)}`,
  ].filter(Boolean).join('\n');

  const handlePrintReceipt = () => {
    setShowPrintPreview(true);
  };

  const getReceiptPrintHtml = () => {
    const itemsMarkup = cart.map((item) => `
      <tr>
        <td>
          <div class="item-name">${item.name}</div>
          <div class="muted">${formatCurrency(item.price)} each</div>
        </td>
        <td class="center">${item.quantity}</td>
        <td class="right">${formatCurrency(item.price * item.quantity, true)}</td>
      </tr>
    `).join('');

    return `
      <!doctype html>
      <html>
        <head>
          <title>Receipt - Skin Spectrum Aesthetics</title>
          <style>
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: #fff; color: #1A1025; font-family: Arial, sans-serif; }
            body { padding: 18px; }
            .receipt { max-width: 380px; margin: 0 auto; }
            .logo { width: 96px; height: 96px; border-radius: 50%; display: block; margin: 0 auto 12px; object-fit: cover; background: #000; }
            h1 { margin: 0; text-align: center; font-size: 20px; font-weight: 800; }
            .subtitle { margin: 4px 0 18px; text-align: center; color: #6B6570; font-size: 12px; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 18px 0; padding: 12px; border: 1px solid #EDE8E3; border-radius: 8px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th { color: #6B6570; font-size: 11px; text-align: left; border-bottom: 1px solid #EDE8E3; padding: 8px 0; }
            td { padding: 10px 0; border-bottom: 1px solid #F0ECE6; font-size: 12px; vertical-align: top; }
            .center { text-align: center; }
            .right { text-align: right; }
            .item-name { font-weight: 700; }
            .muted { color: #6B6570; font-size: 10px; margin-top: 3px; }
            .totals { margin-top: 14px; font-size: 13px; }
            .row { display: flex; justify-content: space-between; margin: 7px 0; }
            .grand { border-top: 2px solid #EDE8E3; padding-top: 10px; margin-top: 10px; font-weight: 800; font-size: 16px; color: #C9A96E; }
            .thanks { margin-top: 20px; text-align: center; color: #6B6570; font-size: 12px; }
            @page { margin: 12mm; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <img class="logo" src="${ssaLogo}" alt="Skin Spectrum Aesthetics logo" />
            <h1>Skin Spectrum Aesthetics</h1>
            <div class="subtitle">Payment Receipt</div>
            <div class="meta">
              <div><strong>Customer</strong><br />${clientName}</div>
              <div><strong>Payment</strong><br />${paymentMethod}</div>
              <div><strong>Date</strong><br />${receiptDate}</div>
              <div><strong>Products</strong><br />${cart.length}</div>
            </div>
            <table>
              <thead><tr><th>Product</th><th class="center">Qty</th><th class="right">Total</th></tr></thead>
              <tbody>${itemsMarkup}</tbody>
            </table>
            <div class="totals">
              <div class="row"><span>Subtotal</span><span>${formatCurrency(subtotal, true)}</span></div>
              ${discountAmount > 0 ? `<div class="row"><span>Discount</span><span>-${formatCurrency(discountAmount, true)}</span></div>` : ''}
              ${includeTax ? `<div class="row"><span>Tax</span><span>${formatCurrency(taxAmount, true)}</span></div>` : ''}
              <div class="row grand"><span>Total Paid</span><span>${formatCurrency(total, true)}</span></div>
            </div>
            <div class="thanks">Thank you for visiting.</div>
          </div>
        </body>
      </html>
    `;
  };

  const printReceiptDocument = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    const iframeDocument = iframeWindow?.document;
    if (!iframeWindow || !iframeDocument) {
      document.body.removeChild(iframe);
      return;
    }

    iframeDocument.open();
    iframeDocument.write(getReceiptPrintHtml());
    iframeDocument.close();

    const cleanup = () => {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1000);
    };

    setTimeout(() => {
      iframeWindow.focus();
      iframeWindow.print();
      cleanup();
    }, 350);
  };

  const handleWhatsAppReceipt = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(receiptSummary)}`, '_blank');
  };

  const handleEmailReceipt = () => {
    const subject = encodeURIComponent('Skin Spectrum Aesthetics Payment Receipt');
    const body = encodeURIComponent(receiptSummary);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const processPayment = () => {
    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }
    setShowReceipt(true);
  };

  const resetSale = () => {
    setCart([]);
    setSelectedClient(null);
    setDiscount('');
    setShowReceipt(false);
    setShowPrintPreview(false);
    setPaymentMethod(null);
    setMobileView('products');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const ProductsPanel = (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* Search & Filters */}
      <div className="bg-white rounded-[14px] p-4"
        style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6570]" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#F8F5F0] border border-[#EDE8E3] rounded-lg
              focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-[#C9A96E] to-[#E8C98A] text-white shadow-lg'
                  : 'bg-[#F8F5F0] text-[#6B6570] hover:bg-[#EDE8E3]'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 bg-white rounded-[14px] p-4 overflow-y-auto"
        style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ scale: product.stock > 0 ? 1.03 : 1 }}
              className={`relative p-3 md:p-4 rounded-lg border transition-all ${
                product.stock === 0
                  ? 'bg-gray-50 border-[#EDE8E3] opacity-60'
                  : 'bg-white border-[#EDE8E3] hover:border-[#C9A96E] hover:shadow-lg cursor-pointer'
              }`}
              onClick={() => addToCart(product)}>
              <div className="text-3xl md:text-5xl mb-2 md:mb-3 text-center py-3 md:py-5 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #F8F5F0 0%, #F5ECD7 100%)' }}>
                {product.image}
              </div>
              <h4 className="font-semibold text-[#1A1025] mb-1 text-xs md:text-sm leading-tight">{product.name}</h4>
              <p className="text-xs text-[#6B6570] mb-2">{product.category}</p>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: 'var(--font-heading)' }}
                  className="text-base md:text-xl font-bold text-[#C9A96E]">
                  {formatCurrency(product.price)}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full hidden sm:inline ${
                  product.stock === 0
                    ? 'bg-[#E5445A]/10 text-[#E5445A]'
                    : product.stock < 20
                    ? 'bg-[#F0A500]/10 text-[#F0A500]'
                    : 'bg-[#2ECC8A]/10 text-[#2ECC8A]'
                }`}>
                  {product.stock === 0 ? 'OOS' : product.stock < 20 ? 'Low' : 'In Stock'}
                </span>
              </div>
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                  <span className="text-xs font-semibold text-[#E5445A]">Out of Stock</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const CartPanel = (
    <div className="bg-white rounded-[14px] p-4 md:p-6 flex flex-col h-full"
      style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
      <div className="mb-4 md:mb-6">
        <h3 style={{ fontFamily: 'var(--font-heading)' }}
          className="text-xl md:text-2xl font-bold text-[#1A1025] mb-3 md:mb-4">
          Current Sale
        </h3>
        <select
          value={selectedClient || ''}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full px-4 py-3 bg-[#F8F5F0] border border-[#EDE8E3] rounded-lg
            focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent">
          <option value="">Walk-in Customer</option>
          <option value="1">Emma Wilson</option>
          <option value="2">Sarah Johnson</option>
          <option value="3">Michael Brown</option>
          <option value="4">Jessica Davis</option>
        </select>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        <AnimatePresence>
          {cart.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2 p-3 bg-[#F8F5F0] rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#1A1025] text-xs md:text-sm truncate">{item.name}</div>
                <div className="text-xs text-[#6B6570]">{formatCurrency(item.price)} each</div>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <button onClick={() => updateQuantity(item.id, -1)}
                  className="w-6 h-6 md:w-7 md:h-7 bg-white rounded-full flex items-center justify-center
                    text-[#6B6570] hover:text-[#E5445A] transition-colors">
                  <Minus size={12} />
                </button>
                <span className="w-6 md:w-8 text-center font-semibold text-[#1A1025] text-sm">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)}
                  className="w-6 h-6 md:w-7 md:h-7 bg-white rounded-full flex items-center justify-center
                    text-[#6B6570] hover:text-[#C9A96E] transition-colors">
                  <Plus size={12} />
                </button>
              </div>
              <div style={{ fontFamily: 'var(--font-heading)' }}
                className="font-bold text-[#C9A96E] w-16 text-right text-sm">
                {formatCurrency(item.price * item.quantity, true)}
              </div>
              <button onClick={() => removeFromCart(item.id)}
                className="text-[#E5445A] hover:bg-[#E5445A]/10 p-1.5 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {cart.length === 0 && (
          <div className="text-center py-8 md:py-12">
            <div className="text-5xl md:text-6xl mb-4">🛒</div>
            <p className="text-[#6B6570]">Cart is empty</p>
            <p className="text-sm text-[#6B6570] mt-1">Add products to start a sale</p>
          </div>
        )}
      </div>

      {/* Totals & Payment */}
      {cart.length > 0 && (
        <>
          <div className="space-y-3 mb-4 pb-4 border-b border-[#EDE8E3]">
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="Discount %"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                min="0"
                max="100"
                className="flex-1 px-3 py-2 bg-[#F8F5F0] border border-[#EDE8E3] rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent text-sm"
              />
              <label className="flex items-center gap-2 text-sm text-[#6B6570] whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={includeTax}
                  onChange={(e) => setIncludeTax(e.target.checked)}
                  className="rounded border-[#EDE8E3] text-[#C9A96E] focus:ring-[#C9A96E]"
                />
                Tax (8%)
              </label>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[#6B6570] text-sm">
                <span>Subtotal</span><span>{formatCurrency(subtotal, true)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#2ECC8A] text-sm">
                  <span>Discount ({discount}%)</span><span>-{formatCurrency(discountAmount, true)}</span>
                </div>
              )}
              {includeTax && (
                <div className="flex justify-between text-[#6B6570] text-sm">
                  <span>Tax (8%)</span><span>{formatCurrency(taxAmount, true)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-[#EDE8E3]">
                <span style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-bold text-[#1A1025]">
                  Grand Total
                </span>
                <span style={{ fontFamily: 'var(--font-heading)' }} className="text-xl md:text-2xl font-bold text-[#C9A96E]">
                  {formatCurrency(total, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-[#6B6570] uppercase tracking-wider">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {(['Cash', 'Card', 'Transfer'] as const).map((method) => {
                const icons = { Cash: <Banknote size={18} />, Card: <CreditCard size={18} />, Transfer: <Building2 size={18} /> };
                const selected = paymentMethod === method;
                return (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`px-2 py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all text-xs font-medium border-2 ${
                      selected
                        ? 'bg-[#C9A96E] text-white border-[#C9A96E] shadow-lg'
                        : 'bg-[#F8F5F0] text-[#6B6570] border-transparent hover:border-[#C9A96E] hover:text-[#C9A96E]'
                    }`}>
                    {icons[method]}
                    <span>{method}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={processPayment}
              disabled={!paymentMethod}
              className={`w-full py-3.5 rounded-lg font-semibold text-white transition-all
                ${paymentMethod
                  ? 'transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                  : 'opacity-50 cursor-not-allowed'}`}
              style={{
                background: 'linear-gradient(135deg, #1A1025 0%, #2D1F3D 100%)',
                boxShadow: paymentMethod ? '0 4px 16px rgba(26, 16, 37, 0.3)' : 'none'
              }}>
              {paymentMethod ? `Process ${paymentMethod} Payment` : 'Select Payment Method'}
            </button>

            <button className="w-full py-2.5 border-2 border-[#EDE8E3] rounded-lg font-medium
              text-[#6B6570] hover:bg-[#F8F5F0] transition-colors text-sm">
              Save as Invoice
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)] lg:h-[calc(100vh-12rem)]">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex mb-4 bg-white rounded-[14px] p-1"
        style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
        <button
          onClick={() => setMobileView('products')}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
            mobileView === 'products'
              ? 'bg-gradient-to-r from-[#C9A96E] to-[#E8C98A] text-white shadow'
              : 'text-[#6B6570]'
          }`}>
          <Search size={16} />
          Products
        </button>
        <button
          onClick={() => setMobileView('cart')}
          className={`flex-1 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm relative ${
            mobileView === 'cart'
              ? 'bg-gradient-to-r from-[#C9A96E] to-[#E8C98A] text-white shadow'
              : 'text-[#6B6570]'
          }`}>
          <ShoppingCart size={16} />
          Cart
          {cartCount > 0 && (
            <span className="absolute top-1 right-8 w-5 h-5 bg-[#E5445A] text-white rounded-full text-xs flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile: single panel view */}
      <div className="lg:hidden h-[calc(100%-60px)]">
        {mobileView === 'products' ? ProductsPanel : CartPanel}
      </div>

      {/* Desktop: side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-6 h-full">
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
          {ProductsPanel}
        </div>
        <div className="lg:col-span-2 overflow-hidden">
          {CartPanel}
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={resetSale}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[14px] p-6 md:p-8 max-w-md w-full"
              style={{ boxShadow: '0 20px 60px rgba(26, 16, 37, 0.3)' }}>
              <button onClick={resetSale} className="absolute top-4 right-4 p-2 hover:bg-[#F8F5F0] rounded-lg">
                <X size={20} className="text-[#6B6570]" />
              </button>
              <div className="text-center mb-6">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #2ECC8A 0%, #26B57A 100%)' }}>
                  <span className="text-3xl md:text-4xl">✓</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)' }}
                  className="text-2xl md:text-3xl font-bold text-[#1A1025] mb-2">
                  Payment Successful!
                </h3>
                <p className="text-[#6B6570]">
                  {paymentMethod} payment received
                  {selectedClient ? ` from ${clientName}` : ' (Walk-in)'}
                </p>
              </div>

              <div className="mb-6 p-4 bg-[#F8F5F0] rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-[#6B6570] mb-1">Total Paid</div>
                  <div style={{ fontFamily: 'var(--font-heading)' }}
                    className="text-3xl md:text-4xl font-bold text-[#C9A96E]">
                    {formatCurrency(total, true)}
                  </div>
                  <div className="text-xs text-[#6B6570] mt-2">
                    {cart.length} item{cart.length !== 1 ? 's' : ''} • {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { icon: <Printer size={20} />, label: 'Print', action: handlePrintReceipt },
                  { icon: <MessageSquare size={20} />, label: 'WhatsApp', action: handleWhatsAppReceipt },
                  { icon: <Mail size={20} />, label: 'Email', action: handleEmailReceipt },
                ].map((action) => (
                  <button key={action.label}
                    onClick={action.action}
                    className="px-4 py-3 bg-[#F8F5F0] hover:bg-[#C9A96E] hover:text-white
                      rounded-lg flex flex-col items-center gap-2 transition-all">
                    {action.icon}
                    <span className="text-xs">{action.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={resetSale}
                className="w-full py-3 rounded-lg font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #C9A96E 0%, #E8C98A 100%)' }}>
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
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 print:bg-white print:p-0"
            onClick={() => setShowPrintPreview(false)}>
            <style>{`
              @media print {
                body * {
                  visibility: hidden;
                }
                .receipt-print-area,
                .receipt-print-area * {
                  visibility: visible;
                }
                .receipt-print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  max-width: none !important;
                  box-shadow: none !important;
                  border-radius: 0 !important;
                }
                .receipt-no-print {
                  display: none !important;
                }
              }
            `}</style>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92vh] w-full max-w-[430px] overflow-y-auto rounded-[14px] bg-white p-5 shadow-[0_20px_60px_rgba(26,16,37,0.35)] print:max-h-none print:overflow-visible print:p-0">
              <div className="receipt-no-print mb-4 flex gap-3">
                <button
                  onClick={printReceiptDocument}
                  className="flex-1 rounded-lg px-4 py-3 font-semibold text-[#1A1025]"
                  style={{ background: 'linear-gradient(135deg, #C9A96E 0%, #E8C98A 100%)' }}>
                  Print Receipt
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="rounded-lg border border-[#EDE8E3] bg-[#F8F5F0] px-4 py-3 font-semibold text-[#6B6570]">
                  Close
                </button>
              </div>

              <div className="receipt-print-area rounded-[14px] bg-white p-5 text-[#1A1025]">
                <img
                  src={ssaLogo}
                  alt="Skin Spectrum Aesthetics"
                  className="mx-auto mb-3 h-24 w-24 rounded-full bg-black object-cover"
                />
                <h2 className="text-center text-xl font-bold">Skin Spectrum Aesthetics</h2>
                <p className="mb-5 mt-1 text-center text-xs text-[#6B6570]">Payment Receipt</p>

                <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg border border-[#EDE8E3] p-3 text-xs">
                  <div>
                    <div className="font-semibold text-[#6B6570]">Customer</div>
                    <div className="mt-1 font-bold">{clientName}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[#6B6570]">Payment</div>
                    <div className="mt-1 font-bold">{paymentMethod}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[#6B6570]">Date</div>
                    <div className="mt-1 font-bold">{receiptDate}</div>
                  </div>
                  <div>
                    <div className="font-semibold text-[#6B6570]">Products</div>
                    <div className="mt-1 font-bold">{cart.length}</div>
                  </div>
                </div>

                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EDE8E3] text-[#6B6570]">
                      <th className="py-2 text-left font-semibold">Product</th>
                      <th className="py-2 text-center font-semibold">Qty</th>
                      <th className="py-2 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.id} className="border-b border-[#F0ECE6]">
                        <td className="py-3">
                          <div className="font-semibold">{item.name}</div>
                          <div className="mt-1 text-[11px] text-[#6B6570]">{formatCurrency(item.price)} each</div>
                        </td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-right font-semibold">{formatCurrency(item.price * item.quantity, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-[#6B6570]">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, true)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[#2ECC8A]">
                      <span>Discount</span>
                      <span>-{formatCurrency(discountAmount, true)}</span>
                    </div>
                  )}
                  {includeTax && (
                    <div className="flex justify-between text-[#6B6570]">
                      <span>Tax</span>
                      <span>{formatCurrency(taxAmount, true)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-[#EDE8E3] pt-3 text-lg font-bold text-[#C9A96E]">
                    <span>Total Paid</span>
                    <span>{formatCurrency(total, true)}</span>
                  </div>
                </div>

                <p className="mt-5 text-center text-xs text-[#6B6570]">Thank you for visiting.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
