import { useState } from 'react';
import { Search, Plus, Grid3x3, List, Edit, Trash2, X, Save, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: number;
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
const productCategories = ['Treatments', 'Serums', 'Creams', 'Bundles', 'Scrubs', 'Masks', 'Protection', 'Cleansers', 'General'];

const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

const getStockStatus = (item: Product) => {
  if (item.stock <= 0) return { label: 'Out of Stock', color: '#E5445A', bg: '#E5445A14' };
  if (item.stock <= item.minStock) return { label: 'Low Stock', color: '#F0A500', bg: '#F0A50014' };
  return { label: 'In Stock', color: '#2ECC8A', bg: '#2ECC8A14' };
};

const getExpiryStatus = (expiry: string) => {
  if (!expiry) return { label: 'No Expiry', color: '#6B6570', bg: '#6B657014', days: null as number | null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiryDate = new Date(expiry);
  expiryDate.setHours(0, 0, 0, 0);
  const days = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (days < 0) return { label: 'Expired', color: '#E5445A', bg: '#E5445A14', days };
  if (days <= 30) return { label: 'Near Expiry', color: '#F0A500', bg: '#F0A50014', days };
  return { label: 'Valid', color: '#2ECC8A', bg: '#2ECC8A14', days };
};

export default function Inventory() {
  const [inventory, setInventory] = useState<Product[]>(initialInventory);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const categories = Array.from(new Set(inventory.map((item) => item.category)));

  const filteredInventory = inventory.filter(
    (item) =>
      (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.code.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!filterCategory || item.category === filterCategory)
  );
  const stockAlerts = inventory.filter((item) => item.stock <= item.minStock);
  const expiryAlerts = inventory.filter((item) => {
    const expiryStatus = getExpiryStatus(item.expiry);
    return expiryStatus.label === 'Expired' || expiryStatus.label === 'Near Expiry';
  });

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const addProduct = (data: Omit<Product, 'id' | 'code'>) => {
    const newProduct: Product = {
      ...data,
      id: Date.now(),
      code: `SKU-${String(inventory.length + 1).padStart(3, '0')}`,
    };
    setInventory((prev) => [newProduct, ...prev]);
    setShowAddProduct(false);
    showSuccess(`${data.name} added to inventory`);
  };

  const updateProduct = (updated: Product) => {
    setInventory((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditProduct(null);
    showSuccess(`${updated.name} updated successfully`);
  };

  const deleteProduct = (id: number) => {
    const product = inventory.find((p) => p.id === id);
    setInventory((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirm(null);
    showSuccess(`${product?.name} removed from inventory`);
  };

  const toggleStatus = (id: number) => {
    setInventory((prev) =>
      prev.map((p) => p.id === id ? { ...p, status: p.status === 'Active' ? 'Inactive' : 'Active' } : p)
    );
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

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6570]" size={20} />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#EDE8E3] rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="flex items-center bg-white border border-[#EDE8E3] rounded-lg p-1">
            <button onClick={() => setViewMode('grid')}
              className={`px-2.5 py-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-[#C9A96E] text-white' : 'text-[#6B6570] hover:bg-[#F8F5F0]'}`}>
              <Grid3x3 size={16} />
            </button>
            <button onClick={() => setViewMode('table')}
              className={`px-2.5 py-2 rounded-md transition-all ${viewMode === 'table' ? 'bg-[#C9A96E] text-white' : 'text-[#6B6570] hover:bg-[#F8F5F0]'}`}>
              <List size={16} />
            </button>
          </div>
          <button
            onClick={() => setShowAddProduct(true)}
            className="px-4 md:px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2
              transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg, #C9A96E 0%, #E8C98A 100%)' }}>
            <Plus size={18} />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            filterCategory === null ? 'bg-[#C9A96E] text-white' : 'bg-white border border-[#EDE8E3] text-[#6B6570] hover:bg-[#F8F5F0]'
          }`}>
          All ({inventory.length})
        </button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilterCategory(cat === filterCategory ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterCategory === cat ? 'bg-[#C9A96E] text-white' : 'bg-white border border-[#EDE8E3] text-[#6B6570] hover:bg-[#F8F5F0]'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {(stockAlerts.length > 0 || expiryAlerts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stockAlerts.length > 0 && (
            <div className="rounded-lg border border-[#F0A500]/25 bg-[#FFF8E8] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#1A1025]">Stock alerts</h3>
                  <p className="text-sm text-[#6B6570] mt-1">
                    {stockAlerts.length} product{stockAlerts.length > 1 ? 's are' : ' is'} at or below minimum stock.
                  </p>
                </div>
                <span className="rounded-full bg-[#F0A500] px-3 py-1 text-xs font-bold text-white">{stockAlerts.length}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {stockAlerts.slice(0, 4).map((item) => (
                  <span key={item.id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6B6570] border border-[#EDE8E3]">
                    {item.name}: {item.stock}/{item.minStock}
                  </span>
                ))}
              </div>
            </div>
          )}

          {expiryAlerts.length > 0 && (
            <div className="rounded-lg border border-[#E5445A]/20 bg-[#FFF1F3] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-[#1A1025]">Expiry alerts</h3>
                  <p className="text-sm text-[#6B6570] mt-1">
                    {expiryAlerts.length} product{expiryAlerts.length > 1 ? 's need' : ' needs'} expiry review.
                  </p>
                </div>
                <span className="rounded-full bg-[#E5445A] px-3 py-1 text-xs font-bold text-white">{expiryAlerts.length}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {expiryAlerts.slice(0, 4).map((item) => {
                  const expiryStatus = getExpiryStatus(item.expiry);
                  return (
                    <span key={item.id} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#6B6570] border border-[#EDE8E3]">
                      {item.name}: {expiryStatus.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredInventory.map((item) => (
            (() => {
              const stockStatus = getStockStatus(item);
              const expiryStatus = getExpiryStatus(item.expiry);
              return (
            <div key={item.id}
              className="bg-white rounded-[14px] p-4 md:p-5 border border-[#EDE8E3] hover:border-[#C9A96E] hover:shadow-lg transition-all"
              style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
              <div className="text-4xl md:text-5xl mb-3 md:mb-4 text-center py-4 md:py-6 rounded-lg"
                style={{ background: 'linear-gradient(135deg, #F8F5F0 0%, #F5ECD7 100%)' }}>
                {item.image}
              </div>

              <div className="mb-3">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-[#1A1025] text-sm leading-tight flex-1 pr-2">{item.name}</h3>
                  <button
                    onClick={() => toggleStatus(item.id)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      item.status === 'Active' ? 'bg-[#2ECC8A]/10 text-[#2ECC8A]' : 'bg-[#6B6570]/10 text-[#6B6570]'
                    }`}>
                    {item.status}
                  </button>
                </div>
                <p style={{ fontFamily: 'var(--font-mono)' }} className="text-xs text-[#6B6570] mb-0.5">{item.code}</p>
                <p className="text-xs text-[#6B6570]">{item.category}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="px-2 py-1 rounded-full text-[11px] font-semibold" style={{ color: stockStatus.color, backgroundColor: stockStatus.bg }}>
                    {stockStatus.label}
                  </span>
                  <span className="px-2 py-1 rounded-full text-[11px] font-semibold" style={{ color: expiryStatus.color, backgroundColor: expiryStatus.bg }}>
                    {expiryStatus.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-[#6B6570]">Sell Price</div>
                  <div style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-bold text-[#C9A96E]">
                    {formatCurrency(item.sellPrice)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#6B6570]">Cost</div>
                  <div className="text-sm font-semibold text-[#6B6570]">{formatCurrency(item.costPrice)}</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <span className="text-[#6B6570]">Stock: <strong>{item.stock}</strong></span>
                  <span className="text-[#6B6570]">Min: {item.minStock}</span>
                </div>
                <div className="h-1.5 bg-[#EDE8E3] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.stock === 0 ? 'bg-[#E5445A]' : item.stock < item.minStock ? 'bg-[#F0A500]' : 'bg-[#2ECC8A]'
                    }`}
                    style={{ width: `${Math.min((item.stock / (item.minStock || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setEditProduct(item)}
                  className="flex-1 px-3 py-2 bg-[#F8F5F0] hover:bg-[#C9A96E] hover:text-white
                    rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5">
                  <Edit size={13} />Edit
                </button>
                <button onClick={() => setDeleteConfirm(item.id)}
                  className="px-3 py-2 bg-[#F8F5F0] hover:bg-[#E5445A] hover:text-white rounded-lg transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
              );
            })()
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-[14px] overflow-hidden"
          style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-[#F8F5F0] border-b border-[#EDE8E3]">
                <tr>
                  {['Code', 'Name', 'Category', 'Cost', 'Sell Price', 'Stock', 'Expiry', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-[#6B6570] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, idx) => {
                  const stockStatus = getStockStatus(item);
                  const expiryStatus = getExpiryStatus(item.expiry);
                  return (
                  <tr key={item.id}
                    className={`border-b border-[#EDE8E3]/50 hover:bg-[#F8F5F0] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F8F5F0]/30'}`}>
                    <td className="py-3 px-3">
                      <span style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-medium text-[#C9A96E]">{item.code}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.image}</span>
                        <span className="text-sm font-medium text-[#1A1025]">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-[#6B6570]">{item.category}</td>
                    <td className="py-3 px-3 text-sm text-[#6B6570]">{formatCurrency(item.costPrice)}</td>
                    <td className="py-3 px-3">
                      <span style={{ fontFamily: 'var(--font-heading)' }} className="text-sm font-bold text-[#C9A96E]">
                        {formatCurrency(item.sellPrice)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-sm font-semibold ${
                        item.stock === 0 ? 'text-[#E5445A]' : item.stock < item.minStock ? 'text-[#F0A500]' : 'text-[#2ECC8A]'
                      }`}>
                        {item.stock}
                      </span>
                      <div className="text-[11px] font-semibold mt-0.5" style={{ color: stockStatus.color }}>
                        {stockStatus.label}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-sm text-[#1A1025]">{item.expiry || 'None'}</div>
                      <div className="text-[11px] font-semibold mt-0.5" style={{ color: expiryStatus.color }}>
                        {expiryStatus.label}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <button onClick={() => toggleStatus(item.id)}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'Active' ? 'bg-[#2ECC8A]/10 text-[#2ECC8A]' : 'bg-[#6B6570]/10 text-[#6B6570]'
                        }`}>
                        {item.status}
                      </button>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => setEditProduct(item)} className="text-[#C9A96E] hover:text-[#A07840] transition-colors">
                          <Edit size={15} />
                        </button>
                        <button onClick={() => setDeleteConfirm(item.id)} className="text-[#E5445A] hover:text-[#C93850] transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredInventory.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-[#6B6570] text-lg">No products found</p>
          <p className="text-sm text-[#6B6570] mt-2">Try adjusting your search or filters</p>
        </div>
      )}

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
            onSubmit={editProduct ? updateProduct : (data) => addProduct(data as Omit<Product, 'id' | 'code'>)}
          />
        )}
      </AnimatePresence>
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
  const [categoryOpen, setCategoryOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sellPrice) return;

    const data = {
      ...(product ? { id: product.id, code: product.code } : {}),
      name: form.name,
      category: form.category || 'General',
      description: form.description,
      costPrice: parseFloat(form.costPrice) || 0,
      sellPrice: parseFloat(form.sellPrice),
      stock: parseInt(form.stock) || 0,
      minStock: parseInt(form.minStock) || 10,
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
      <div className="sticky top-0 bg-white border-b border-[#EDE8E3] p-4 md:p-6 flex items-center justify-between z-10">
        <h2 style={{ fontFamily: 'var(--font-heading)' }} className="text-xl md:text-2xl font-bold text-[#1A1025]">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-[#F8F5F0] rounded-lg transition-colors">
          <X size={22} className="text-[#6B6570]" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
        {/* Emoji Picker */}
        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-2">Product Icon</label>
          <div className="flex gap-2 flex-wrap">
            {productEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setForm({ ...form, image: emoji })}
                className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                  form.image === emoji ? 'bg-[#C9A96E] ring-2 ring-[#C9A96E] ring-offset-2' : 'bg-[#F8F5F0] hover:bg-[#EDE8E3]'
                }`}>
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Product Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g., Hydrating Serum"
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Category</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryOpen((open) => !open)}
                className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent flex items-center justify-between gap-3 text-left">
                <span className={form.category ? 'text-[#1A1025]' : 'text-[#8D8792]'}>
                  {form.category || 'Select category'}
                </span>
                <ChevronDown size={18} className={`text-[#6B6570] transition-transform ${categoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoryOpen && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-44 overflow-y-auto rounded-lg border border-[#EDE8E3] bg-white shadow-xl">
                  {productCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => {
                        setForm({ ...form, category });
                        setCategoryOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                        form.category === category
                          ? 'bg-[#C9A96E] text-white font-semibold'
                          : 'text-[#1A1025] hover:bg-[#F8F5F0]'
                      }`}>
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-2">Description</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief product description..."
            className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Cost Price (PKR)</label>
            <input
              type="number"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Sell Price (PKR) *</label>
            <input
              type="number"
              value={form.sellPrice}
              onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              min="0"
              placeholder="0"
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Min Stock</label>
            <input
              type="number"
              value={form.minStock}
              onChange={(e) => setForm({ ...form, minStock: e.target.value })}
              min="0"
              placeholder="10"
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Unit</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent">
              {['Bottle', 'Jar', 'Tube', 'Sachet', 'Service'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as 'Active' | 'Inactive' })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent">
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-2">Expiry Date</label>
          <input
            type="date"
            value={form.expiry}
            onChange={(e) => setForm({ ...form, expiry: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 border-2 border-[#EDE8E3] rounded-lg font-medium text-[#6B6570] hover:bg-[#F8F5F0] transition-colors">
            Cancel
          </button>
          <button type="submit"
            className="flex-1 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #C9A96E 0%, #E8C98A 100%)' }}>
            <Save size={16} />
            {product ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </form>
    </motion.div>
    </motion.div>
  );
}
