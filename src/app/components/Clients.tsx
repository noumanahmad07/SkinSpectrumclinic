import { useEffect, useState } from 'react';
import { Search, Plus, X, Phone, Mail, Calendar, Wallet, Filter, Edit, CalendarClock, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const skinTypes = ['Normal', 'Oily', 'Dry', 'Combination', 'Sensitive'];
const skinTypeColors: Record<string, string> = {
  Normal: '#2ECC8A',
  Oily: '#F0A500',
  Dry: '#E5445A',
  Combination: '#C9A96E',
  Sensitive: '#A07840',
};

const skinTypeEmojis: Record<string, string> = {
  Normal: '😊',
  Oily: '💧',
  Dry: '🏜️',
  Combination: '🔄',
  Sensitive: '🌸',
};

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  skinType: string;
  lastVisit: string;
  totalSpent: number;
  concerns: string[];
  allergies: string;
  notes: string;
  followUpDays?: number;
  followUpDate?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

const initialClients: Client[] = [
  {
    id: 1,
    name: 'Emma Wilson',
    phone: '+1 (555) 123-4567',
    email: 'emma.w@example.com',
    skinType: 'Dry',
    lastVisit: '2026-05-20',
    totalSpent: 2450,
    concerns: ['Fine Lines', 'Dehydration'],
    allergies: 'None',
    notes: 'Prefers fragrance-free products',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    phone: '+1 (555) 234-5678',
    email: 'sarah.j@example.com',
    skinType: 'Oily',
    lastVisit: '2026-05-22',
    totalSpent: 1820,
    concerns: ['Acne', 'Large Pores'],
    allergies: 'Benzoyl Peroxide',
    notes: 'Regular client since 2024',
  },
  {
    id: 3,
    name: 'Michael Brown',
    phone: '+1 (555) 345-6789',
    email: 'michael.b@example.com',
    skinType: 'Normal',
    lastVisit: '2026-05-18',
    totalSpent: 980,
    concerns: ['Prevention'],
    allergies: 'None',
    notes: '',
  },
  {
    id: 4,
    name: 'Jessica Davis',
    phone: '+1 (555) 456-7890',
    email: 'jessica.d@example.com',
    skinType: 'Combination',
    lastVisit: '2026-05-25',
    totalSpent: 3200,
    concerns: ['Pigmentation', 'Uneven Tone'],
    allergies: 'Vitamin C',
    notes: 'VIP client - prefers appointments after 5 PM',
  },
  {
    id: 5,
    name: 'David Miller',
    phone: '+1 (555) 567-8901',
    email: 'david.m@example.com',
    skinType: 'Sensitive',
    lastVisit: '2026-05-15',
    totalSpent: 1560,
    concerns: ['Redness', 'Irritation'],
    allergies: 'Fragrance, Retinol',
    notes: 'Requires patch testing for new products',
  },
  {
    id: 6,
    name: 'Lisa Anderson',
    phone: '+1 (555) 678-9012',
    email: 'lisa.a@example.com',
    skinType: 'Dry',
    lastVisit: '2026-05-10',
    totalSpent: 890,
    concerns: ['Dryness', 'Dull Skin'],
    allergies: 'None',
    notes: '',
  },
];

const CLIENTS_STORAGE_KEY = 'skinspectrum_clients';

const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().split('T')[0];
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>(() => {
    const savedClients = window.localStorage.getItem(CLIENTS_STORAGE_KEY);
    return savedClients ? JSON.parse(savedClients) : initialClients;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkinType, setFilterSkinType] = useState<string | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    window.localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  const filteredClients = clients.filter(
    (client) =>
      (client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery)) &&
      (!filterSkinType || client.skinType === filterSkinType)
  );

  const addClient = (newClient: Omit<Client, 'id' | 'lastVisit'>) => {
    const client: Client = {
      ...newClient,
      id: Date.now(),
      lastVisit: new Date().toISOString().split('T')[0],
    };
    setClients((prev) => [client, ...prev]);
    setShowAddClient(false);
    setSuccessMessage(`${client.name} has been added successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const updateClient = (updated: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setEditClient(null);
    setSelectedClient(updated);
    setSuccessMessage('Client updated successfully!');
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

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6570]" size={20} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#EDE8E3] rounded-lg
                focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent shadow-sm"
            />
          </div>
        </div>
        <button
          onClick={() => setShowAddClient(true)}
          className="px-4 md:px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2
            transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #C9A96E 0%, #E8C98A 100%)' }}>
          <Plus size={20} />
          <span className="hidden sm:inline">Add New Client</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-[#6B6570]">
          <Filter size={14} />
        </div>
        <button
          onClick={() => setFilterSkinType(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            filterSkinType === null ? 'bg-[#C9A96E] text-white' : 'bg-white border border-[#EDE8E3] text-[#6B6570] hover:bg-[#F8F5F0]'
          }`}>
          All ({clients.length})
        </button>
        {skinTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilterSkinType(type === filterSkinType ? null : type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              filterSkinType === type ? 'text-white' : 'bg-white border border-[#EDE8E3] text-[#6B6570] hover:bg-[#F8F5F0]'
            }`}
            style={filterSkinType === type ? { backgroundColor: skinTypeColors[type] } : {}}>
            {type}
          </button>
        ))}
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-[14px] overflow-hidden border border-[#EDE8E3]"
        style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-[#F8F5F0] border-b border-[#EDE8E3]">
              <tr>
                {['Client', 'Phone', 'Skin Type', 'Appointment', 'Last Visit', 'Total Spent', 'Follow Up', 'Actions'].map((h) => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-[#6B6570] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client, idx) => (
                <tr
                  key={client.id}
                  className={`border-b border-[#EDE8E3]/60 hover:bg-[#F8F5F0] transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-[#F8F5F0]/30'
                  }`}>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${skinTypeColors[client.skinType]} 0%, ${skinTypeColors[client.skinType]}CC 100%)` }}>
                        {client.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[#1A1025]">{client.name}</div>
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-xs text-[#6B6570] mt-0.5">
                            <Mail size={12} />
                            <span className="truncate max-w-[220px]">{client.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-[#6B6570] whitespace-nowrap">{client.phone}</td>
                  <td className="py-4 px-4">
                    <span
                      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: skinTypeColors[client.skinType] }}>
                      {client.skinType}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-[#1A1025] font-medium whitespace-nowrap">
                    {client.appointmentDate && client.appointmentTime ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF8F4] px-3 py-1 text-xs font-semibold text-[#2A9D6F]">
                        <Calendar size={12} />
                        {new Date(`${client.appointmentDate}T${client.appointmentTime}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                        {new Date(`${client.appointmentDate}T${client.appointmentTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-[#8D8792]">None</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-[#1A1025] font-medium whitespace-nowrap">
                    {new Date(client.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="py-4 px-4 text-sm font-bold text-[#C9A96E] whitespace-nowrap">
                    {formatCurrency(client.totalSpent)}
                  </td>
                  <td className="py-4 px-4 text-sm text-[#6B6570] whitespace-nowrap">
                    {client.followUpDate ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F7EFE1] px-3 py-1 text-xs font-semibold text-[#A67F3F]">
                        <CalendarClock size={12} />
                        {new Date(client.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    ) : (
                      <span className="text-[#8D8792]">None</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedClient(client)}
                        className="p-2 rounded-lg bg-[#F8F5F0] text-[#6B6570] hover:bg-[#C9A96E] hover:text-white transition-colors"
                        title="View client">
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setEditClient(client)}
                        className="p-2 rounded-lg bg-[#F8F5F0] text-[#6B6570] hover:bg-[#C9A96E] hover:text-white transition-colors"
                        title="Edit client">
                        <Edit size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-[#EDE8E3]">
          {filteredClients.map((client) => (
            <div key={client.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${skinTypeColors[client.skinType]} 0%, ${skinTypeColors[client.skinType]}CC 100%)` }}>
                    {client.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[#1A1025] truncate">{client.name}</div>
                    <div className="text-xs text-[#6B6570] truncate">{client.phone}</div>
                  </div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: skinTypeColors[client.skinType] }}>
                  {client.skinType}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-xs text-[#6B6570]">Appointment</div>
                  <div className="font-semibold text-[#1A1025]">
                    {client.appointmentDate && client.appointmentTime
                      ? new Date(`${client.appointmentDate}T${client.appointmentTime}`).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
                      : 'None'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#6B6570]">Last Visit</div>
                  <div className="font-semibold text-[#1A1025]">{new Date(client.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
                <div>
                  <div className="text-xs text-[#6B6570]">Total Spent</div>
                  <div className="font-bold text-[#C9A96E]">{formatCurrency(client.totalSpent)}</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setSelectedClient(client)}
                  className="flex-1 py-2 rounded-lg bg-[#F8F5F0] text-sm font-semibold text-[#6B6570] hover:bg-[#C9A96E] hover:text-white transition-colors">
                  View
                </button>
                <button
                  onClick={() => setEditClient(client)}
                  className="flex-1 py-2 rounded-lg bg-[#F8F5F0] text-sm font-semibold text-[#6B6570] hover:bg-[#C9A96E] hover:text-white transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-[#6B6570] text-lg">No clients found</p>
          <p className="text-sm text-[#6B6570] mt-2">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Client Detail Panel */}
      <AnimatePresence>
        {selectedClient && !editClient && (
          <ClientDetailPanel
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onEdit={() => setEditClient(selectedClient)}
          />
        )}
      </AnimatePresence>

      {/* Edit Client Panel */}
      <AnimatePresence>
        {editClient && (
          <ClientFormPanel
            title="Edit Client"
            initialData={editClient}
            onClose={() => setEditClient(null)}
            onSubmit={(data) => updateClient({ ...editClient, ...data })}
          />
        )}
      </AnimatePresence>

      {/* Add Client Panel */}
      <AnimatePresence>
        {showAddClient && (
          <ClientFormPanel
            title="Add New Client"
            onClose={() => setShowAddClient(false)}
            onSubmit={addClient}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Client Detail Panel
function ClientDetailPanel({ client, onClose, onEdit }: {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
}) {
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
      {/* Drag handle for mobile */}
      <div className="sm:hidden flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 bg-[#EDE8E3] rounded-full" />
      </div>

      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[#EDE8E3] p-4 md:p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 md:gap-4">
          <div
            className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold"
            style={{
              background: `linear-gradient(135deg, ${skinTypeColors[client.skinType]} 0%, ${skinTypeColors[client.skinType]}CC 100%)`,
            }}>
            {client.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)' }}
              className="text-xl md:text-2xl font-bold text-[#1A1025]">
              {client.name}
            </h2>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: skinTypeColors[client.skinType] }}>
              {client.skinType} Skin
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit}
            className="p-2 bg-[#F8F5F0] hover:bg-[#C9A96E] hover:text-white rounded-lg transition-colors">
            <Edit size={18} />
          </button>
          <button onClick={onClose}
            className="p-2 hover:bg-[#F8F5F0] rounded-lg transition-colors">
            <X size={22} className="text-[#6B6570]" />
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-[#1A1025] mb-3 text-sm">Contact Information</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-[#6B6570]">
              <Phone size={15} /><span>{client.phone}</span>
            </div>
            {client.email && (
              <div className="flex items-center gap-3 text-[#6B6570]">
                <Mail size={15} /><span>{client.email}</span>
              </div>
            )}
          </div>
        </div>

        {client.appointmentDate && client.appointmentTime && (
          <div className="p-4 bg-[#EEF8F4] rounded-lg border border-[#2ECC8A]/20">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1025]">
              <Calendar size={16} className="text-[#2A9D6F]" />
              Appointment
            </div>
            <p className="mt-2 text-sm text-[#6B6570]">
              Scheduled for{' '}
              <strong className="text-[#1A1025]">
                {new Date(`${client.appointmentDate}T${client.appointmentTime}`).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </strong>
              .
            </p>
          </div>
        )}

        {client.concerns.length > 0 && (
          <div>
            <h3 className="font-semibold text-[#1A1025] mb-3 text-sm">Skin Concerns</h3>
            <div className="flex flex-wrap gap-2">
              {client.concerns.map((concern, idx) => (
                <span key={idx} className="px-3 py-1 bg-[#F0A500]/10 text-[#F0A500] rounded-full text-xs font-medium">
                  {concern}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-[#1A1025] mb-3 text-sm">Allergies</h3>
          <p className={`text-sm ${client.allergies === 'None' ? 'text-[#2ECC8A]' : 'text-[#E5445A] font-medium'}`}>
            {client.allergies}
          </p>
        </div>

        {client.notes && (
          <div>
            <h3 className="font-semibold text-[#1A1025] mb-3 text-sm">Notes</h3>
            <p className="text-sm text-[#6B6570] bg-[#F8F5F0] p-4 rounded-lg">{client.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[#F8F5F0] rounded-lg">
            <div className="text-xs text-[#6B6570] mb-1">Last Visit</div>
            <div className="font-semibold text-[#1A1025] text-sm">
              {new Date(client.lastVisit).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="p-4 bg-[#F8F5F0] rounded-lg">
            <div className="text-xs text-[#6B6570] mb-1">Total Spent</div>
            <div style={{ fontFamily: 'var(--font-heading)' }} className="text-xl md:text-2xl font-bold text-[#C9A96E]">
              {formatCurrency(client.totalSpent)}
            </div>
          </div>
        </div>

        {client.followUpDate && (
          <div className="p-4 bg-[#F7EFE1] rounded-lg border border-[#D1AD69]/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1025]">
              <CalendarClock size={16} className="text-[#A67F3F]" />
              Follow Up Reminder
            </div>
            <p className="mt-2 text-sm text-[#6B6570]">
              Follow up after {client.followUpDays} day{client.followUpDays === 1 ? '' : 's'} on{' '}
              <strong className="text-[#1A1025]">
                {new Date(client.followUpDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </strong>
              .
            </p>
          </div>
        )}
      </div>
    </motion.div>
    </motion.div>
  );
}

// Reusable Client Form Panel (Add + Edit)
function ClientFormPanel({
  title,
  initialData,
  onClose,
  onSubmit,
}: {
  title: string;
  initialData?: Client;
  onClose: () => void;
  onSubmit: (data: Omit<Client, 'id' | 'lastVisit'>) => void;
}) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    totalSpent: initialData?.totalSpent?.toString() || '',
    followUpDays: initialData?.followUpDays?.toString() || '',
    appointmentDate: initialData?.appointmentDate || '',
    appointmentTime: initialData?.appointmentTime || '',
    skinType: initialData?.skinType || '',
    concerns: initialData?.concerns.join(', ') || '',
    allergies: initialData?.allergies || '',
    notes: initialData?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.skinType) e.skinType = 'Please select a skin type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: initialData?.email || '',
      totalSpent: parseFloat(form.totalSpent) || 0,
      followUpDays: parseInt(form.followUpDays) || undefined,
      followUpDate: form.followUpDays ? addDays(new Date(), parseInt(form.followUpDays)) : undefined,
      appointmentDate: form.appointmentDate || undefined,
      appointmentTime: form.appointmentTime || undefined,
      skinType: form.skinType,
      concerns: form.concerns.split(',').map((c) => c.trim()).filter(Boolean),
      allergies: form.allergies.trim() || 'None',
      notes: form.notes.trim(),
    });
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
          {title}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-[#F8F5F0] rounded-lg transition-colors">
          <X size={22} className="text-[#6B6570]" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter client name"
              className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent ${
                errors.name ? 'border-[#E5445A]' : 'border-[#EDE8E3]'
              }`}
            />
            {errors.name && <p className="text-xs text-[#E5445A] mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Phone *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent ${
                errors.phone ? 'border-[#E5445A]' : 'border-[#EDE8E3]'
              }`}
            />
            {errors.phone && <p className="text-xs text-[#E5445A] mt-1">{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-2">Total Spent (PKR)</label>
          <input
            type="number"
            value={form.totalSpent}
            onChange={(e) => setForm({ ...form, totalSpent: e.target.value })}
            min="0"
            step="1"
            placeholder="0"
            className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-2">Follow Up After (Days)</label>
          <input
            type="number"
            value={form.followUpDays}
            onChange={(e) => setForm({ ...form, followUpDays: e.target.value })}
            min="1"
            step="1"
            placeholder="e.g., 7"
            className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
          />
          <p className="text-xs text-[#6B6570] mt-1">
            Dashboard will show this client one day before the follow-up date.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Appointment Date</label>
            <input
              type="date"
              value={form.appointmentDate}
              onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Appointment Time</label>
            <input
              type="time"
              value={form.appointmentTime}
              onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-3">Skin Type *</label>
          {errors.skinType && <p className="text-xs text-[#E5445A] mb-2">{errors.skinType}</p>}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {skinTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, skinType: type })}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  form.skinType === type ? 'border-current text-white' : 'border-[#EDE8E3] text-[#6B6570] hover:border-[#C9A96E]'
                }`}
                style={form.skinType === type ? { backgroundColor: skinTypeColors[type] } : {}}>
                <div className="text-xl mb-1">{skinTypeEmojis[type]}</div>
                <div className="text-xs font-medium">{type}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-2">Skin Concerns</label>
          <input
            type="text"
            value={form.concerns}
            onChange={(e) => setForm({ ...form, concerns: e.target.value })}
            placeholder="e.g., Acne, Fine Lines, Pigmentation"
            className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
          />
          <p className="text-xs text-[#6B6570] mt-1">Separate multiple concerns with commas</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-2">Allergies</label>
          <input
            type="text"
            value={form.allergies}
            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            placeholder="List any known allergies or 'None'"
            className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-2">Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional notes about the client..."
            className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border-2 border-[#EDE8E3] rounded-lg font-medium text-[#6B6570] hover:bg-[#F8F5F0] transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-3 rounded-lg font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #C9A96E 0%, #E8C98A 100%)' }}>
            {initialData ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </form>
    </motion.div>
    </motion.div>
  );
}
