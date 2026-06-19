import React, { useCallback, useEffect, useState } from 'react';
import { Search, Plus, Grid3x3, List, Edit, Trash2, X, Save, AlertTriangle, ShieldAlert, Check, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  canUseBackend,
  createBackendProduct,
  deleteBackendProduct,
  fetchInventoryProducts,
  updateBackendProduct,
  type BackendInventoryProduct,
  type BackendProduct,
  type BackendProductInput,
} from '../lib/backend';

interface Product {
  id: number | string;
  code: string;
  name: string;
  category: string;
  description: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  expiry: string;
  status: 'Active' | 'Inactive';
  image: string;
}

const mapBackendProduct = (product: BackendInventoryProduct | BackendProduct): Product => ({
  id: product.id,
  code: product.code,
  name: product.name,
  category: product.category,
  description: product.description,
  costPrice: Number(product.cost_price || 0),
  sellPrice: Number(product.sell_price || 0),
  stock: product.stock,
  minStock: product.min_stock,
  unit: product.unit,
  expiry: product.expiry || '',
  status: product.status,
  image: product.image || '',
});

const toBackendProductInput = (product: Omit<Product, 'id'>): BackendProductInput => ({
  code: product.code,
  name: product.name,
  category: product.category,
  description: product.description,
  cost_price: product.costPrice,
  sell_price: product.sellPrice,
  stock: product.stock,
  min_stock: product.minStock,
  unit: product.unit,
  expiry: product.expiry || null,
  status: product.status,
  image: product.image,
});

const generateNextSku = (items: Product[]) => {
  const maxSkuNumber = items.reduce((max, item) => {
    const match = item.code.match(/^SKU-(\d+)$/i);
    if (!match) return max;
    return Math.max(max, Number(match[1]) || 0);
  }, 0);

  return `SKU-${String(maxSkuNumber + 1).padStart(3, '0')}`;
};

const formatBackendError = (fallback: string, error: unknown) => {
  if (error instanceof Error && error.message) {
    return `${fallback} ${error.message}`;
  }
  return fallback;
};

const initialInventory: Product[] = [
  {
    id: 1, code: 'SKU-001', name: 'Hydrating Serum', category: 'Serums',
    description: 'Deep hydration serum with hyaluronic acid',
    costPrice: 45, sellPrice: 89, stock: 45, minStock: 20, unit: 'Bottle',
    expiry: '2027-12-31', status: 'Active', image: '💧',
  },
  {
    id: 2, code: 'SKU-002', name: 'Anti-Aging Cream', category: 'Creams',
    description: 'Premium anti-aging formula with retinol',
    costPrice: 65, sellPrice: 125, stock: 32, minStock: 15, unit: 'Jar',
    expiry: '2027-10-15', status: 'Active', image: '✨',
  },
  {
    id: 3, code: 'SKU-003', name: 'Vitamin C Serum', category: 'Serums',
    description: 'Brightening serum with 20% Vitamin C',
    costPrice: 50, sellPrice: 95, stock: 28, minStock: 25, unit: 'Bottle',
    expiry: '2027-08-20', status: 'Active', image: '🍊',
  },
  {
    id: 4, code: 'SKU-004', name: 'Retinol Night Cream', category: 'Creams',
    description: 'Intensive night repair with retinol',
    costPrice: 58, sellPrice: 110, stock: 5, minStock: 15, unit: 'Jar',
    expiry: '2027-11-30', status: 'Active', image: '🌙',
  },
  {
    id: 5, code: 'SKU-005', name: 'Facial Treatment - Basic', category: 'Treatments',
    description: 'Standard facial treatment service',
    costPrice: 0, sellPrice: 150, stock: 999, minStock: 999, unit: 'Service',
    expiry: '', status: 'Active', image: '💆',
  },
  {
    id: 6, code: 'SKU-006', name: 'Exfoliating Scrub', category: 'Scrubs',
    description: 'Gentle exfoliating scrub with natural beads',
    costPrice: 28, sellPrice: 65, stock: 50, minStock: 30, unit: 'Tube',
    expiry: '2027-09-15', status: 'Active', image: '🧴',
  },
  {
    id: 7, code: 'SKU-007', name: 'Cleanser Foam', category: 'Cleansers',
    description: 'Deep cleansing foam for all skin types',
    costPrice: 22, sellPrice: 48, stock: 0, minStock: 25, unit: 'Bottle',
    expiry: '2027-06-30', status: 'Inactive', image: '🫧',
  },
];

const productEmojis = ['💧', '✨', '🍊', '🌙', '💆', '💆‍♀️', '🧴', '🎭', '👁️', '☀️', '🎁', '🫧', '🌿', '💎', '🌸'];
const productCategories = ['Treatments', 'Serums', 'Creams', 'Bundles', 'Scrubs', 'Masks', 'Protection', 'Cleansers', 'Sunblock', 'Shampoo', 'General'];

const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const stockBadgeStyles = {
  'Out of Stock': 'bg-destructive/10 text-destructive',
  'Low Stock': 'bg-[#F0A500]/10 text-[#A86F00]',
  'In Stock': 'bg-[#2ECC8A]/10 text-[#159B61]',
  Available: 'bg-[#2ECC8A]/10 text-[#159B61]',
} as const;

const stockToneClasses = {
  out: 'text-destructive',
  low: 'text-[#A86F00]',
  ok: 'text-[#159B61]',
} as const;

const expiryBadgeStyles = {
  Expired: 'bg-destructive/10 text-destructive',
  'Near Expiry': 'bg-[#F0A500]/10 text-[#A86F00]',
  Valid: 'bg-[#2ECC8A]/10 text-[#159B61]',
  'No Expiry': 'bg-muted text-muted-foreground',
} as const;

const isUnlimitedStock = (item: Product) => item.unit === 'Service' || item.minStock >= 999;

const getStockStatus = (item: Product) => {
  if (isUnlimitedStock(item)) {
    return { label: 'Available' as const, tone: 'ok' as const, color: '#2ECC8A', bg: '#2ECC8A14' };
  }
  if (item.stock <= 0) return { label: 'Out of Stock' as const, tone: 'out' as const, color: '#E5445A', bg: '#E5445A14' };
  if (item.stock <= item.minStock) return { label: 'Low Stock' as const, tone: 'low' as const, color: '#F0A500', bg: '#F0A50014' };
  return { label: 'In Stock' as const, tone: 'ok' as const, color: '#2ECC8A', bg: '#2ECC8A14' };
};

const getExpiryStatus = (expiry: string) => {
  if (!expiry) return { label: 'No Expiry', color: '#6B6570', bg: '#6B657014', days: null as number | null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(expiry);
  expiryDate.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) return { label: 'Expired', color: '#E5445A', bg: '#E5445A14', days };
  if (days <= 60) return { label: 'Near Expiry', color: '#F0A500', bg: '#F0A50014', days };
  return { label: 'Valid', color: '#2ECC8A', bg: '#2ECC8A14', days };
};

export default function Inventory() {
  const backendEnabled = canUseBackend();
  const [inventory, setInventory] = useState<Product[]>(() => (canUseBackend() ? [] : initialInventory));
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [backendError, setBackendError] = useState('');

  const loadBackendInventory = useCallback(async () => {
    const rows = await fetchInventoryProducts();
    setInventory(rows.map(mapBackendProduct));
    setBackendError('');
  }, []);

  useEffect(() => {
    if (!backendEnabled) {
      setBackendError('Supabase is not configured. Products added here are local only and will disappear after refresh or navigation.');
      return;
    }

    let ignore = false;
    loadBackendInventory()
      .then(() => {
        if (!ignore) {
          setBackendError('');
        }
      })
      .catch((error) => {
        if (!ignore) {
          setBackendError(formatBackendError('Could not load inventory from Supabase.', error));
        }
      });

    return () => {
      ignore = true;
    };
  }, [backendEnabled, loadBackendInventory]);

  const categories = Array.from(new Set(inventory.map((item) => item.category)));

  const filteredInventory = inventory.filter(
    (item) =>
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!filterCategory || item.category === filterCategory)
  );
  const stockAlerts = inventory.filter((item) => !isUnlimitedStock(item) && item.stock <= item.minStock);
  const expiryAlerts = inventory.filter((item) => {
    const expiryStatus = getExpiryStatus(item.expiry);
    return expiryStatus.label === 'Expired' || expiryStatus.label === 'Near Expiry';
  });

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const addProduct = async (data: Omit<Product, 'id' | 'code'>) => {
    const productToSave: Omit<Product, 'id'> = {
      ...data,
      code: generateNextSku(inventory),
    };

    if (backendEnabled) {
      try {
        const savedProduct = await createBackendProduct(toBackendProductInput(productToSave));
        setInventory((prev) => [mapBackendProduct(savedProduct), ...prev.filter((item) => item.id !== savedProduct.id)]);
        await loadBackendInventory();
        setBackendError('');
      } catch (error) {
        setBackendError(formatBackendError('Product was not saved to Supabase.', error));
        return;
      }
    } else {
      const newProduct: Product = {
        ...productToSave,
        id: Date.now(),
      };
      setInventory((prev) => [newProduct, ...prev]);
      setBackendError('Supabase is not configured. This product was added locally only and was not saved to backend.');
    }

    setShowAddProduct(false);
    showSuccess(`${data.name} added to inventory`);
  };

  const updateProduct = async (updated: Product) => {
    let savedProduct = updated;

    if (backendEnabled && typeof updated.id === 'string') {
      try {
        const backendProduct = await updateBackendProduct(updated.id, toBackendProductInput(updated));
        savedProduct = mapBackendProduct(backendProduct);
        await loadBackendInventory();
        setBackendError('');
      } catch (error) {
        setBackendError(formatBackendError('Product changes were not saved to Supabase.', error));
        return;
      }
    }

    setInventory((prev) => prev.map((p) => (p.id === savedProduct.id ? savedProduct : p)));
    setEditProduct(null);
    showSuccess(`${savedProduct.name} updated successfully`);
  };

  const deleteProduct = async (id: number | string) => {
    const product = inventory.find((p) => p.id === id);
    if (backendEnabled && typeof id === 'string') {
      try {
        await deleteBackendProduct(id);
        await loadBackendInventory();
        setBackendError('');
      } catch (error) {
        setBackendError(formatBackendError('Product was not deleted from Supabase.', error));
        return;
      }
    }

    setInventory((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
    showSuccess(`${product?.name} removed from inventory`);
  };

  const toggleStatus = async (id: number | string) => {
    const product = inventory.find((p) => p.id === id);
    if (!product) return;

    const nextStatus = product.status === 'Active' ? 'Inactive' : 'Active';

    if (backendEnabled && typeof id === 'string') {
      try {
        const savedProduct = await updateBackendProduct(id, { status: nextStatus });
        setInventory((prev) => prev.map((p) => (p.id === id ? mapBackendProduct(savedProduct) : p)));
        await loadBackendInventory();
        setBackendError('');
        return;
      } catch (error) {
        setBackendError(formatBackendError('Product status was not updated in Supabase.', error));
        return;
      }
    }

    setInventory((prev) => prev.map((p) => p.id === id ? { ...p, status: nextStatus } : p));
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
      <div className="mb-4 grid shrink-0 grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <p className="text-[11px] text-muted-foreground">Total Products</p>
          <p style={{ fontFamily: 'var(--font-heading)' }} className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {inventory.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <p className="text-[11px] text-muted-foreground">Low / Out of Stock</p>
          <p style={{ fontFamily: 'var(--font-heading)' }} className="mt-0.5 text-lg font-semibold tabular-nums text-[#A86F00]">
            {stockAlerts.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
          <p className="text-[11px] text-muted-foreground">Expiry Alerts</p>
          <p style={{ fontFamily: 'var(--font-heading)' }} className="mt-0.5 text-lg font-semibold tabular-nums text-destructive">
            {expiryAlerts.length}
          </p>
        </div>
      </div>

      {/* Toolbar + filters */}
      <Panel className="mb-4 shrink-0 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search products by name or SKU…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded-md p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                title="Grid view">
                <Grid3x3 size={15} strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`rounded-md p-1.5 transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
                title="Table view">
                <List size={15} strokeWidth={1.75} />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowAddProduct(true)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:px-4">
              <Plus size={16} strokeWidth={2} />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setFilterCategory(null)}
            className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
              filterCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}>
            All ({inventory.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-foreground text-background'
                  : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </Panel>

      {/* Compact alerts */}
      {(stockAlerts.length > 0 || expiryAlerts.length > 0) && (
        <Panel className="mb-4 shrink-0 divide-y divide-border p-0">
          {stockAlerts.length > 0 && (
            <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F0A500]/10 text-[#A86F00]">
                  <AlertTriangle size={14} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#A86F00]">Stock watch</p>
                  <p className="text-[10px] text-muted-foreground">{stockAlerts.length} need restock</p>
                </div>
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                  {stockAlerts.filter((item) => item.stock === 0).length} out
                </span>
                <span className="rounded-full bg-[#F0A500]/10 px-2 py-0.5 text-[10px] font-medium text-[#A86F00]">
                  {stockAlerts.filter((item) => item.stock > 0).length} low
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {stockAlerts.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px]">
                    <span className="max-w-[8rem] truncate font-medium text-foreground">{item.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.stock}/{item.minStock}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        item.stock === 0 ? 'bg-destructive/10 text-destructive' : 'bg-[#F0A500]/10 text-[#A86F00]'
                      }`}>
                      {item.stock === 0 ? 'Out' : 'Low'}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {expiryAlerts.length > 0 && (
            <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex shrink-0 items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <ShieldAlert size={14} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-destructive">Expiry watch</p>
                  <p className="text-[10px] text-muted-foreground">{expiryAlerts.length} need review</p>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {expiryAlerts.map((item) => {
                  const expiryStatus = getExpiryStatus(item.expiry);
                  return (
                    <span
                      key={item.id}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px]">
                      <span className="max-w-[8rem] truncate font-medium text-foreground">{item.name}</span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${expiryBadgeStyles[expiryStatus.label as keyof typeof expiryBadgeStyles] || expiryBadgeStyles['No Expiry']}`}>
                        {expiryStatus.label}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* Products */}
      <Panel className="min-h-0 flex-1 overflow-hidden p-0">
        {filteredInventory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground/50">
              <Package size={22} strokeWidth={1.5} />
            </div>
            {inventory.length === 0 ? (
              <>
                <p className="text-[14px] font-medium text-foreground">No products yet</p>
                <p className="mt-1 max-w-[280px] text-[13px] text-muted-foreground">
                  Click Add Product above to create inventory items in Supabase.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddProduct(true)}
                  className="mt-4 flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  Add Product
                </button>
              </>
            ) : (
              <>
                <p className="text-[14px] font-medium text-foreground">No products found</p>
                <p className="mt-1 text-[13px] text-muted-foreground">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="h-full overflow-y-auto scroll-area p-3 md:p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredInventory.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onEdit={() => setEditProduct(item)}
                  onDelete={() => setDeleteConfirm(item.id)}
                  onToggleStatus={() => toggleStatus(item.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full overflow-x-hidden overflow-y-auto scroll-area">
            <table className="w-full table-fixed">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border bg-card">
                  <th className="w-[9%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Code</th>
                  <th className="w-[20%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Product</th>
                  <th className="w-[10%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Category</th>
                  <th className="w-[9%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Cost</th>
                  <th className="w-[10%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sell</th>
                  <th className="w-[13%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Stock</th>
                  <th className="w-[14%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Expiry</th>
                  <th className="w-[9%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="w-[6%] bg-card px-2 py-2.5" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="bg-card">
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const expiryStatus = getExpiryStatus(item.expiry);
                  return (
                    <tr key={item.id} className="border-b border-border/60 bg-card transition-colors last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[11px] font-medium text-primary">
                          {item.code}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-base">{item.image}</span>
                          <span className="truncate text-[13px] font-medium text-foreground">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[12px] text-muted-foreground">{item.category}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-[12px] tabular-nums text-muted-foreground">{formatCurrency(item.costPrice)}</span>
                      </td>
                      <td className="px-3 py-2">
                        <span style={{ fontFamily: 'var(--font-heading)' }} className="text-[12px] font-semibold tabular-nums text-primary">
                          {formatCurrency(item.sellPrice)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className={`shrink-0 text-[12px] font-semibold tabular-nums ${stockToneClasses[stockStatus.tone]}`}>
                            {isUnlimitedStock(item) ? '∞' : item.stock}
                          </span>
                          <span
                            className={`inline-flex shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                              stockBadgeStyles[stockStatus.label as keyof typeof stockBadgeStyles]
                            }`}>
                            {stockStatus.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                            {item.expiry
                              ? new Date(item.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                              : '—'}
                          </span>
                          <span
                            className={`inline-flex shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                              expiryBadgeStyles[expiryStatus.label as keyof typeof expiryBadgeStyles]
                            }`}>
                            {expiryStatus.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggleStatus(item.id)}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            item.status === 'Active' ? 'bg-[#2ECC8A]/10 text-[#159B61]' : 'bg-muted text-muted-foreground'
                          }`}>
                          {item.status}
                        </button>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => setEditProduct(item)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                            title="Edit">
                            <Edit size={14} strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(item.id)}
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Delete">
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[14px] p-6 max-w-sm w-full"
              style={{ boxShadow: '0 20px 60px rgba(26, 16, 37, 0.3)' }}>
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">🗑️</div>
                <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-xl font-bold text-[#1A1025] mb-2">
                  Delete Product?
                </h3>
                <p className="text-[#6B6570] text-sm">
                  This will permanently remove "{inventory.find((p) => p.id === deleteConfirm)?.name}" from inventory.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 border-2 border-[#EDE8E3] rounded-lg font-medium text-[#6B6570] hover:bg-[#F8F5F0] transition-colors">
                  Cancel
                </button>
                <button onClick={() => deleteProduct(deleteConfirm)}
                  className="flex-1 py-3 rounded-lg font-semibold text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #E5445A 0%, #C93850 100%)' }}>
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {(showAddProduct || editProduct) && (
          <ProductFormModal
            product={editProduct}
            onClose={() => { setShowAddProduct(false); setEditProduct(null); }}
            onSubmit={(data) => {
              if (editProduct) {
                updateProduct(data as Product);
              } else {
                addProduct(data as Omit<Product, 'id' | 'code'>);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({
  item,
  onEdit,
  onDelete,
  onToggleStatus,
}: {
  item: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const stockStatus = getStockStatus(item);
  const expiryStatus = getExpiryStatus(item.expiry);
  const stockPercent = Math.min((item.stock / (item.minStock || 1)) * 100, 100);

  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm transition-colors hover:border-primary/30">
      <div className="flex gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-2xl">{item.image}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-[13px] font-semibold text-foreground">{item.name}</h3>
            <button
              type="button"
              onClick={onToggleStatus}
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                item.status === 'Active' ? 'bg-[#2ECC8A]/10 text-[#159B61]' : 'bg-muted text-muted-foreground'
              }`}>
              {item.status}
            </button>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-muted-foreground">
            {item.code} · {item.category}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${stockBadgeStyles[stockStatus.label as keyof typeof stockBadgeStyles]}`}>
              {stockStatus.label}
            </span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${expiryBadgeStyles[expiryStatus.label as keyof typeof expiryBadgeStyles]}`}>
              {expiryStatus.label}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <p className="text-muted-foreground">Sell</p>
          <p style={{ fontFamily: 'var(--font-heading)' }} className="font-semibold tabular-nums text-primary">
            {formatCurrency(item.sellPrice)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Stock</p>
          <p className={`font-semibold tabular-nums ${stockToneClasses[stockStatus.tone]}`}>
            {isUnlimitedStock(item) ? '∞' : item.stock}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Min</p>
          <p className="font-semibold tabular-nums text-muted-foreground">{item.minStock}</p>
        </div>
      </div>

      <div className="mt-2">
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              stockStatus.tone === 'out' ? 'bg-destructive' : stockStatus.tone === 'low' ? 'bg-[#F0A500]' : 'bg-[#2ECC8A]'
            }`}
            style={{ width: `${isUnlimitedStock(item) ? 100 : stockPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-2.5 flex gap-1.5">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-primary">
          <Edit size={12} strokeWidth={1.75} />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
          <Trash2 size={12} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

function ProductFormModal({
  product,
  onClose,
  onSubmit,
}: {
  product: Product | null;
  onClose: () => void;
  onSubmit: (data: Product | Omit<Product, 'id' | 'code'>) => void;
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    category: product?.category || '',
    description: product?.description || '',
    costPrice: product?.costPrice?.toString() || '',
    sellPrice: product?.sellPrice?.toString() || '',
    stock: product?.stock?.toString() || '',
    minStock: product?.minStock?.toString() || '10',
    unit: product?.unit || 'Bottle',
    expiry: product?.expiry || '',
    status: product?.status || 'Active' as 'Active' | 'Inactive',
    image: product?.image || '💧',
  });
  const [errors, setErrors] = useState<{ details?: string; pricing?: string; inventory?: string; expiry?: string }>({});

  const labelClass = 'mb-1.5 block text-[12px] font-medium text-foreground';
  const fieldClass =
    'h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
  const sectionClass = 'space-y-3 rounded-lg border border-border bg-muted/20 p-3.5';
  const sectionTitleClass = 'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground';
  const sectionErrorClass = 'rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-[12px] font-medium text-destructive';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const costPrice = parseFloat(form.costPrice) || 0;
    const sellPrice = parseFloat(form.sellPrice);
    const stock = parseInt(form.stock, 10);
    const minStock = parseInt(form.minStock, 10);
    const expiryStatus = getExpiryStatus(form.expiry);

    if (!form.name.trim()) {
      setErrors({ details: 'Product name is required' });
      return;
    }
    if (!Number.isFinite(sellPrice)) {
      setErrors({ pricing: 'Sell price is required' });
      return;
    }
    if (costPrice > sellPrice) {
      setErrors({ pricing: 'Cost price cannot be more than sell price' });
      return;
    }
    if ((form.stock.trim() && (!Number.isFinite(stock) || stock < 0)) || (form.minStock.trim() && (!Number.isFinite(minStock) || minStock < 0))) {
      setErrors({ inventory: 'Stock and minimum stock cannot be negative' });
      return;
    }
    if (form.expiry && expiryStatus.label === 'Expired') {
      setErrors({ expiry: 'Expired products cannot be added to inventory' });
      return;
    }
    setErrors({});

    const data = {
      ...(product ? { id: product.id, code: product.code } : {}),
      name: form.name.trim(),
      category: form.category || 'General',
      description: form.description,
      costPrice,
      sellPrice,
      stock: Number.isFinite(stock) ? stock : 0,
      minStock: Number.isFinite(minStock) ? minStock : 10,
      unit: form.unit,
      expiry: form.expiry,
      status: form.status,
      image: form.image,
    };
    onSubmit(data as Product);
  };

  return (
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

          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3.5 md:px-5">
            <h2 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-semibold text-foreground">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4 p-4 md:p-5">
            {/* Icon picker */}
            <div className={sectionClass}>
              <p className={sectionTitleClass}>Product Icon</p>
              <div className="flex flex-wrap gap-1.5">
                {productEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm({ ...form, image: emoji })}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-colors ${
                      form.image === emoji
                        ? 'border-primary bg-secondary ring-1 ring-primary/30'
                        : 'border-border bg-background hover:bg-muted/50'
                    }`}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic info */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Hydrating Serum"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={fieldClass}>
                  <option value="">Select category</option>
                  {productCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            {errors.details && <div className={sectionErrorClass}>{errors.details}</div>}

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief product description..."
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
            </div>

            {/* Pricing */}
            <div className={sectionClass}>
              <p className={sectionTitleClass}>Pricing</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Cost Price (PKR)</label>
                  <input
                    type="number"
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Sell Price (PKR) *</label>
                  <input
                    type="number"
                    value={form.sellPrice}
                    onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={fieldClass}
                  />
                </div>
              </div>
              {errors.pricing && <div className={sectionErrorClass}>{errors.pricing}</div>}
            </div>

            {/* Inventory */}
            <div className={sectionClass}>
              <p className={sectionTitleClass}>Inventory</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className={labelClass}>Stock</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    min="0"
                    placeholder="0"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Min Stock</label>
                  <input
                    type="number"
                    value={form.minStock}
                    onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                    min="0"
                    placeholder="10"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className={fieldClass}>
                    {['Bottle', 'Jar', 'Tube', 'Sachet', 'Service'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}
                    className={fieldClass}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              {errors.inventory && <div className={sectionErrorClass}>{errors.inventory}</div>}
            </div>

            <div>
              <label className={labelClass}>Expiry Date</label>
              <input
                type="date"
                value={form.expiry}
                onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                className={fieldClass}
              />
              {form.expiry && getExpiryStatus(form.expiry).label === 'Near Expiry' && !errors.expiry && (
                <div className="mt-2 rounded-lg border border-[#F0A500]/20 bg-[#F0A500]/10 px-3 py-2 text-[12px] font-medium text-[#A86F00]">
                  This product is near to expire, but it can still be added.
                </div>
              )}
              {errors.expiry && <div className={`mt-2 ${sectionErrorClass}`}>{errors.expiry}</div>}
            </div>

            <div className="flex gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-border py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted">
                Cancel
              </button>
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-foreground py-2.5 text-[13px] font-semibold text-background transition-opacity hover:opacity-90">
                <Save size={15} strokeWidth={1.75} />
                {product ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
