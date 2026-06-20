import React, { useCallback, useEffect, useState } from 'react';
import { Search, Plus, X, Phone, Mail, Calendar, Edit, CalendarClock, Eye, Users, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  canUseBackend,
  createBackendClient,
  deleteBackendClient,
  fetchClientPageClients,
  parseSupabaseError,
  updateBackendClient,
  type BackendClient,
  type BackendClientInput,
} from '../lib/backend';
import { hasActiveSupabaseSession } from '../lib/supabase';

const skinTypes = ['Normal', 'Oily', 'Dry', 'Combination', 'Sensitive'];
const skinTypeStyles: Record<string, string> = {
  Normal: 'bg-[#2ECC8A]/10 text-[#159B61]',
  Oily: 'bg-[#F0A500]/10 text-[#A86F00]',
  Dry: 'bg-destructive/10 text-destructive',
  Combination: 'bg-secondary text-primary',
  Sensitive: 'bg-[#8F609A]/10 text-[#8F609A]',
};

const skinTypeAccent: Record<string, string> = {
  Normal: '#2ECC8A',
  Oily: '#F0A500',
  Dry: '#E5445A',
  Combination: '#C9A96E',
  Sensitive: '#8F609A',
};

interface Client {
  id: number | string;
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

const formatCurrency = (amount: number) => `PKR ${amount.toLocaleString()}`;

const todayDate = () => new Date().toISOString().split('T')[0];

const formatAppointmentDate = (client: Pick<Client, 'appointmentDate' | 'appointmentTime'>) => {
  if (!client.appointmentDate) return '';
  return new Date(`${client.appointmentDate}T${client.appointmentTime || '00:00:00'}`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const formatAppointmentDateTime = (client: Pick<Client, 'appointmentDate' | 'appointmentTime'>) => {
  if (!client.appointmentDate) return '';
  const appointmentAt = new Date(`${client.appointmentDate}T${client.appointmentTime || '00:00:00'}`);
  const dateText = appointmentAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  if (!client.appointmentTime) return `${dateText} · Any time`;
  return appointmentAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const mapBackendClient = (client: BackendClient): Client => ({
  id: client.id,
  name: client.name,
  phone: client.phone,
  email: client.email || '',
  skinType: client.skin_type,
  lastVisit: client.last_visit,
  totalSpent: Number(client.total_spent || 0),
  concerns: client.concerns || [],
  allergies: client.allergies || 'None',
  notes: client.notes || '',
  followUpDays: client.follow_up_days ?? undefined,
  followUpDate: client.follow_up_date ?? undefined,
  appointmentDate: client.appointment_date ?? undefined,
  appointmentTime: client.appointment_time ? client.appointment_time.slice(0, 5) : undefined,
});

const toBackendClientInput = (client: Omit<Client, 'id'>): BackendClientInput => ({
  name: client.name,
  phone: client.phone,
  email: client.email || null,
  skin_type: client.skinType,
  last_visit: client.lastVisit,
  total_spent: client.totalSpent,
  concerns: client.concerns,
  allergies: client.allergies || 'None',
  notes: client.notes || '',
  follow_up_days: client.followUpDays ?? null,
  follow_up_date: client.followUpDate ?? null,
  appointment_date: client.appointmentDate ?? null,
  appointment_time: client.appointmentTime ? `${client.appointmentTime}:00` : null,
});

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SkinTypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium ${skinTypeStyles[type] || skinTypeStyles.Normal}`}>
      {type}
    </span>
  );
}

function ClientAvatar({ name, skinType }: { name: string; skinType: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2);
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: skinTypeAccent[skinType] || skinTypeAccent.Normal }}>
      {initials}
    </div>
  );
}

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString().split('T')[0];
};

const getTodayDateInputValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isPastDateInputValue = (dateValue: string) => dateValue < getTodayDateInputValue();

export default function Clients() {
  const backendEnabled = canUseBackend();
  const supabaseSessionActive = hasActiveSupabaseSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(backendEnabled);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSkinType, setFilterSkinType] = useState<string | null>(null);
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [backendError, setBackendError] = useState('');

  const loadClients = useCallback(async () => {
    if (!backendEnabled) return;
    setIsLoading(true);
    setBackendError('');
    try {
      const rows = await fetchClientPageClients();
      setClients(rows.map(mapBackendClient));
    } catch (error) {
      setClients([]);
      setBackendError(parseSupabaseError(error));
    } finally {
      setIsLoading(false);
    }
  }, [backendEnabled]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients = clients.filter(
    (client) =>
      (client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery)) &&
      (!filterSkinType || client.skinType === filterSkinType)
  );

  const addClient = async (newClient: Omit<Client, 'id' | 'lastVisit'>) => {
    if (!supabaseSessionActive) {
      throw new Error('Log out and sign in with your Supabase staff account to save clients.');
    }

    setBackendError('');
    const lastVisit = todayDate();

    try {
      const savedClient = await createBackendClient(
        toBackendClientInput({ ...newClient, lastVisit }),
      );
      const mapped = mapBackendClient(savedClient);
      setClients((prev) => [mapped, ...prev.filter((client) => client.phone !== mapped.phone)]);
      setShowAddClient(false);
      setSuccessMessage(`${mapped.name} has been added successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const message = parseSupabaseError(error);
      setBackendError(message);
      throw new Error(message);
    }
  };

  const updateClient = async (updated: Client) => {
    if (!supabaseSessionActive) {
      throw new Error('Log out and sign in with your Supabase staff account to save clients.');
    }
    if (typeof updated.id !== 'string') {
      throw new Error('This client record is invalid. Please refresh and try again.');
    }

    setBackendError('');

    try {
      const backendClient = await updateBackendClient(updated.id, toBackendClientInput(updated));
      const savedClient = mapBackendClient(backendClient);
      setClients((prev) => prev.map((client) => (client.id === savedClient.id ? savedClient : client)));
      setEditClient(null);
      setSelectedClient(savedClient);
      setSuccessMessage('Client updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const message = parseSupabaseError(error);
      setBackendError(message);
      throw new Error(message);
    }
  };

  const deleteClient = async (client: Client) => {
    if (!supabaseSessionActive) {
      setBackendError('Log out and sign in with your Supabase staff account to delete clients.');
      return;
    }
    if (typeof client.id !== 'string') {
      setBackendError('This client record is invalid. Please refresh and try again.');
      return;
    }

    setBackendError('');

    try {
      await deleteBackendClient(client.id);
      setClients((prev) => prev.filter((item) => item.id !== client.id));
      setSelectedClient((current) => (current?.id === client.id ? null : current));
      setEditClient((current) => (current?.id === client.id ? null : current));
      setDeleteConfirm(null);
      setSuccessMessage(`${client.name} has been deleted.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setBackendError(parseSupabaseError(error));
    }
  };

  if (!backendEnabled) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <Panel className="p-6">
          <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-semibold text-foreground">
            Backend not configured
          </h3>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to load and save clients from Supabase.
          </p>
        </Panel>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <Panel className="p-8 text-center text-[13px] text-muted-foreground">Loading clients from Supabase…</Panel>
      </div>
    );
  }

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
        <div className="mb-4 flex flex-col gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] font-medium text-destructive">{backendError}</p>
          <button
            type="button"
            onClick={loadClients}
            className="shrink-0 rounded-lg border border-destructive/30 px-3 py-1 text-[12px] font-semibold text-destructive hover:bg-destructive/10">
            Retry
          </button>
        </div>
      )}

      {!supabaseSessionActive && (
        <div className="mb-4 rounded-lg border border-[#F0A500]/20 bg-[#FFF8E8] px-4 py-2.5 text-[13px] text-[#A86F00]">
          Clients save to Supabase only. Log out and sign in with your Supabase staff email and password (created in Supabase Dashboard → Authentication → Users).
        </div>
      )}

      <Panel className="mb-4 shrink-0 border-[#C9A96E]/20 bg-[#C9A96E]/[0.04] p-3.5">
        <p className="text-[12px] text-muted-foreground">
          Clients are stored in Supabase. Use <strong className="font-medium text-foreground">Add New Client</strong> to create records, then select them on <strong className="font-medium text-foreground">POS</strong> when saving a bill.
        </p>
      </Panel>

      <Panel className="mb-4 shrink-0 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} strokeWidth={1.75} />
            <input
              type="text"
              placeholder="Search clients…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <button
            onClick={() => setShowAddClient(true)}
            className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            <Plus size={16} strokeWidth={2} />
            <span className="hidden sm:inline">Add New Client</span>
            <span className="sm:hidden">Add Client</span>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterSkinType(null)}
            className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
              filterSkinType === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}>
            All ({clients.length})
          </button>
          {skinTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilterSkinType(type === filterSkinType ? null : type)}
              className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                filterSkinType === type
                  ? 'bg-foreground text-background'
                  : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}>
              {type}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="min-h-0 flex-1 overflow-hidden p-0">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground/50">
              <Users size={22} strokeWidth={1.5} />
            </div>
            {clients.length === 0 ? (
              <>
                <p className="text-[14px] font-medium text-foreground">No clients yet</p>
                <p className="mt-1 max-w-[280px] text-[13px] text-muted-foreground">
                  Click Add New Client above to create your first client in Supabase.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddClient(true)}
                  className="mt-4 flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  <Plus size={16} strokeWidth={2} />
                  Add New Client
                </button>
              </>
            ) : (
              <>
                <p className="text-[14px] font-medium text-foreground">No clients found</p>
                <p className="mt-1 text-[13px] text-muted-foreground">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="hidden h-full overflow-auto scroll-area md:block">
              <table className="min-w-[1120px] w-full table-fixed">
                <thead className="sticky top-0 z-10 bg-card">
                  <tr className="border-b border-border bg-card">
                    <th className="w-[23%] bg-card px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Client</th>
                    <th className="w-[14%] bg-card px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Phone</th>
                    <th className="w-[10%] bg-card px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Skin</th>
                    <th className="w-[12%] bg-card px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Appointment</th>
                    <th className="w-[12%] bg-card px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Last Visit</th>
                    <th className="w-[12%] bg-card px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Spent</th>
                    <th className="w-[10%] bg-card px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Follow Up</th>
                    <th className="w-[7%] bg-card px-4 py-3 text-right" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="bg-card">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-10 text-center text-[13px] text-muted-foreground">
                        No clients yet. Add a client to use them on POS and Billing.
                      </td>
                    </tr>
                  ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id} className="border-b border-border/60 bg-card transition-colors last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <ClientAvatar name={client.name} skinType={client.skinType} />
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-medium text-foreground">{client.name}</div>
                            {client.email && (
                              <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
                                <Mail size={11} strokeWidth={1.75} />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="block truncate text-[12px] text-muted-foreground">{client.phone}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <SkinTypeBadge type={client.skinType} />
                      </td>
                      <td className="px-3 py-3.5">
                        {client.appointmentDate ? (
                          <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-[#2ECC8A]/10 px-2 py-1 text-[11px] font-medium leading-none text-[#159B61]">
                            <Calendar size={11} strokeWidth={1.75} />
                            <span className="truncate">{formatAppointmentDate(client)}</span>
                          </span>
                        ) : (
                          <span className="text-[12px] text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="whitespace-nowrap text-[12px] font-medium text-foreground">
                          {new Date(client.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="whitespace-nowrap text-[12px] font-medium tabular-nums text-primary">{formatCurrency(client.totalSpent)}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        {client.followUpDate ? (
                          <span className="inline-flex max-w-full items-center gap-1 rounded-md bg-secondary px-2 py-1 text-[11px] font-medium leading-none text-primary">
                            <CalendarClock size={11} strokeWidth={1.75} />
                            <span className="truncate">{new Date(client.followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </span>
                        ) : (
                          <span className="text-[12px] text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedClient(client)}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                            title="View client">
                            <Eye size={14} strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() => setEditClient(client)}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Edit client">
                            <Edit size={14} strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(client)}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            title="Delete client">
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-border md:hidden">
              {filteredClients.map((client) => (
                <div key={client.id} className="bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <ClientAvatar name={client.name} skinType={client.skinType} />
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-foreground">{client.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">{client.phone}</div>
                      </div>
                    </div>
                    <SkinTypeBadge type={client.skinType} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[12px]">
                    <div>
                      <div className="text-[11px] text-muted-foreground">Last Visit</div>
                      <div className="font-medium text-foreground">
                        {new Date(client.lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] text-muted-foreground">Total Spent</div>
                      <div className="font-medium tabular-nums text-primary">{formatCurrency(client.totalSpent)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="flex-1 rounded-lg border border-border py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                      View
                    </button>
                    <button
                      onClick={() => setEditClient(client)}
                      className="flex-1 rounded-lg bg-primary py-2 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90">
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(client)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-destructive/20 text-destructive transition-colors hover:bg-destructive/10"
                      title="Delete client">
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>

      {/* Client Detail Panel */}
      <AnimatePresence>
        {selectedClient && !editClient && (
          <ClientDetailPanel
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onEdit={() => setEditClient(selectedClient)}
            onDelete={() => setDeleteConfirm(selectedClient)}
          />
        )}
      </AnimatePresence>

      {/* Delete Client Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div
              initial={{ scale: 0.94, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <Trash2 size={18} strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-base font-semibold text-foreground">
                    Delete Client?
                  </h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    This will permanently remove <span className="font-medium text-foreground">{deleteConfirm.name}</span> from clients.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-lg border border-border py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteClient(deleteConfirm)}
                  className="flex-1 rounded-lg bg-destructive py-2.5 text-[13px] font-semibold text-destructive-foreground transition-opacity hover:opacity-90">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Client Panel */}
      <AnimatePresence mode="wait">
        {editClient && (
          <ClientFormPanel
            key={`edit-client-${editClient.id}`}
            title="Edit Client"
            initialData={editClient}
            onClose={() => setEditClient(null)}
            onSubmit={(data) => updateClient({ ...editClient, ...data })}
          />
        )}
      </AnimatePresence>

      {/* Add Client Panel */}
      <AnimatePresence mode="wait">
        {showAddClient && (
          <ClientFormPanel
            key="add-client"
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
function ClientDetailPanel({ client, onClose, onEdit, onDelete }: {
  client: Client;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full overflow-y-auto scroll-area rounded-t-2xl border border-border bg-card shadow-xl sm:max-w-2xl sm:rounded-xl">
      <div className="flex justify-center pt-3 pb-1 sm:hidden">
        <div className="h-1 w-8 rounded-full bg-border" />
      </div>

      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-4 md:p-5">
        <div className="flex items-center gap-3">
          <ClientAvatar name={client.name} skinType={client.skinType} />
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-semibold text-foreground">
              {client.name}
            </h2>
            <SkinTypeBadge type={client.skinType} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-primary">
            <Edit size={16} strokeWidth={1.75} />
          </button>
          <button onClick={onDelete} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
            <Trash2 size={16} strokeWidth={1.75} />
          </button>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4 md:p-5">
        <div>
          <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Contact</h3>
          <div className="space-y-2 text-[13px] text-muted-foreground">
            <div className="flex items-center gap-2"><Phone size={14} strokeWidth={1.75} /><span>{client.phone}</span></div>
            {client.email && (
              <div className="flex items-center gap-2"><Mail size={14} strokeWidth={1.75} /><span>{client.email}</span></div>
            )}
          </div>
        </div>

        {client.appointmentDate && (
          <div className="rounded-lg border border-[#2ECC8A]/20 bg-[#2ECC8A]/[0.04] p-3.5">
            <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <Calendar size={15} strokeWidth={1.75} className="text-[#159B61]" />
              Appointment
            </div>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {formatAppointmentDateTime(client)}
            </p>
          </div>
        )}

        {client.concerns.length > 0 && (
          <div>
            <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Skin Concerns</h3>
            <div className="flex flex-wrap gap-1.5">
              {client.concerns.map((concern) => (
                <span key={concern} className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-primary">{concern}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Allergies</h3>
          <p className={`text-[13px] ${client.allergies === 'None' ? 'text-[#159B61]' : 'font-medium text-destructive'}`}>{client.allergies}</p>
        </div>

        {client.notes && (
          <div>
            <h3 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Notes</h3>
            <p className="rounded-lg bg-background p-3.5 text-[13px] leading-relaxed text-muted-foreground">{client.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-background p-3.5">
            <div className="text-[11px] text-muted-foreground">Last Visit</div>
            <div className="mt-0.5 text-[13px] font-medium text-foreground">
              {new Date(client.lastVisit).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="rounded-lg bg-background p-3.5">
            <div className="text-[11px] text-muted-foreground">Total Spent</div>
            <div style={{ fontFamily: 'var(--font-heading)' }} className="mt-0.5 text-lg font-semibold tabular-nums text-primary">
              {formatCurrency(client.totalSpent)}
            </div>
          </div>
        </div>

        {client.followUpDate && (
          <div className="rounded-lg border border-primary/20 bg-secondary/40 p-3.5">
            <div className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <CalendarClock size={15} strokeWidth={1.75} className="text-primary" />
              Follow Up Reminder
            </div>
            <p className="mt-1.5 text-[13px] text-muted-foreground">
              {client.followUpDays} day{client.followUpDays === 1 ? '' : 's'} — {new Date(client.followUpDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
  onSubmit: (data: Omit<Client, 'id' | 'lastVisit'>) => void | Promise<void>;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const todayDate = getTodayDateInputValue();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    if (!form.skinType) e.skinType = 'Please select a skin type';
    if (form.appointmentDate) {
      const isUnchangedPast =
        Boolean(initialData?.appointmentDate) && initialData?.appointmentDate === form.appointmentDate;
      if (isPastDateInputValue(form.appointmentDate) && !isUnchangedPast) {
        e.appointmentDate = 'Appointment date cannot be in the past';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: initialData?.email || '',
        totalSpent: parseFloat(form.totalSpent) || 0,
        followUpDays: parseInt(form.followUpDays, 10) || undefined,
        followUpDate: form.followUpDays ? addDays(new Date(), parseInt(form.followUpDays, 10)) : undefined,
        appointmentDate: form.appointmentDate || undefined,
        appointmentTime: form.appointmentTime || undefined,
        skinType: form.skinType,
        concerns: form.concerns.split(',').map((c) => c.trim()).filter(Boolean),
        allergies: form.allergies.trim() || 'None',
        notes: form.notes.trim(),
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-4 md:p-5">
        <h2 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-4 md:p-5">
        {submitError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
            {submitError}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-foreground">Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter client name"
              className={`h-9 w-full rounded-lg border bg-background px-3 text-[13px] focus:outline-none focus:ring-2 ${
                errors.name ? 'border-destructive/50 focus:ring-destructive/15' : 'border-border focus:ring-primary/15'
              }`}
            />
            {errors.name && <p className="mt-1 text-[11px] text-destructive">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-foreground">Phone *</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className={`h-9 w-full rounded-lg border bg-background px-3 text-[13px] focus:outline-none focus:ring-2 ${
                errors.phone ? 'border-destructive/50 focus:ring-destructive/15' : 'border-border focus:ring-primary/15'
              }`}
            />
            {errors.phone && <p className="mt-1 text-[11px] text-destructive">{errors.phone}</p>}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-foreground">Total Spent (PKR)</label>
          <input
            type="number"
            value={form.totalSpent}
            onChange={(e) => setForm({ ...form, totalSpent: e.target.value })}
            min="0"
            step="1"
            placeholder="0"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-foreground">Follow Up After (Days)</label>
          <input
            type="number"
            value={form.followUpDays}
            onChange={(e) => setForm({ ...form, followUpDays: e.target.value })}
            min="1"
            step="1"
            placeholder="e.g., 7"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Dashboard will remind you one day before follow-up.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-foreground">Appointment Date</label>
            <input
              type="date"
              value={form.appointmentDate}
              min={todayDate}
              onChange={(e) => {
                const nextDate = e.target.value;
                setForm({ ...form, appointmentDate: nextDate });
                if (nextDate && isPastDateInputValue(nextDate)) {
                  setErrors((prev) => ({ ...prev, appointmentDate: 'Appointment date cannot be in the past' }));
                } else {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.appointmentDate;
                    return next;
                  });
                }
              }}
              className={`h-9 w-full rounded-lg border bg-background px-3 text-[13px] focus:outline-none focus:ring-2 ${
                errors.appointmentDate
                  ? 'border-destructive/50 focus:ring-destructive/15'
                  : 'border-border focus:border-primary/40 focus:ring-primary/15'
              }`}
            />
            {errors.appointmentDate && <p className="mt-1 text-[11px] text-destructive">{errors.appointmentDate}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-foreground">Appointment Time</label>
            <input
              type="time"
              value={form.appointmentTime}
              onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })}
              className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[12px] font-medium text-foreground">Skin Type *</label>
          {errors.skinType && <p className="mb-2 text-[11px] text-destructive">{errors.skinType}</p>}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {skinTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, skinType: type })}
                className={`rounded-lg border px-2 py-2.5 text-center text-[12px] font-medium transition-colors ${
                  form.skinType === type
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-secondary/40'
                }`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-foreground">Skin Concerns</label>
          <input
            type="text"
            value={form.concerns}
            onChange={(e) => setForm({ ...form, concerns: e.target.value })}
            placeholder="e.g., Acne, Fine Lines, Pigmentation"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">Separate multiple concerns with commas</p>
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-foreground">Allergies</label>
          <input
            type="text"
            value={form.allergies}
            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
            placeholder="List any known allergies or 'None'"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-foreground">Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional notes about the client…"
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <div className="flex gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-background py-2.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-lg bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting ? 'Saving…' : initialData ? 'Save Changes' : 'Add Client'}
          </button>
        </div>
      </form>
        </div>
      </motion.div>
    </motion.div>
  );
}
