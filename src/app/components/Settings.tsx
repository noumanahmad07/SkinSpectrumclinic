import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { Building2, Receipt, Bell, Users, Lock, Save, Upload, Check, Plus, X, UserCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ssaLogo from '../../assets/ssa-logo.png';
import { useAuth } from '../App';
import {
  loadSettings,
  patchSettings,
  updateUserPassword,
  type BillingSettings,
  type ClinicSettings,
  type PaymentMethods,
  type WhatsappItems,
  type EmailItems,
  type UserAccount,
  type BillPerson,
} from '../lib/settings';

const fieldClass =
  'h-9 w-full rounded-lg border border-border bg-background px-3 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
const textareaClass =
  'min-h-[72px] w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-[13px] focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15';
const labelClass = 'mb-1.5 block text-[12px] font-medium text-foreground';

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 style={{ fontFamily: 'var(--font-heading)' }} className="text-[14px] font-semibold text-foreground">
        {title}
      </h3>
      {action}
    </div>
  );
}

function useSuccessToast() {
  const [message, setMessage] = useState('');
  const show = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };
  return { message, show };
}

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('clinic');
  const toast = useSuccessToast();

  const tabs: { id: string; label: string; Icon: LucideIcon }[] = [
    { id: 'clinic', label: 'Clinic Info', Icon: Building2 },
    { id: 'billing', label: 'Tax & Billing', Icon: Receipt },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
    { id: 'users', label: 'User Accounts', Icon: Users },
    { id: 'bill-persons', label: 'Bill Person', Icon: UserCheck },
    { id: 'security', label: 'Security', Icon: Lock },
  ];

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.some(({ id }) => id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-4 pb-3">
      <AnimatePresence>
        {toast.message && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed right-4 top-20 z-50 flex items-center gap-2 rounded-lg border border-[#2ECC8A]/20 bg-card px-4 py-2.5 text-[13px] font-medium text-[#159B61] shadow-lg md:right-8">
            <Check size={16} strokeWidth={2} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <Panel className="p-1.5">
        <div className="flex gap-1 overflow-x-auto scroll-area">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-medium transition-colors md:text-[13px] ${
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}>
              <Icon size={15} strokeWidth={1.75} />
              {label}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="p-4 md:p-5">
        {activeTab === 'clinic' && <ClinicInfoTab onSave={(msg) => toast.show(msg)} />}
        {activeTab === 'billing' && <BillingTab onSave={(msg) => toast.show(msg)} />}
        {activeTab === 'notifications' && <NotificationsTab onSave={(msg) => toast.show(msg)} />}
        {activeTab === 'users' && <UsersTab onSave={(msg) => toast.show(msg)} />}
        {activeTab === 'bill-persons' && <BillPersonsTab onSave={(msg) => toast.show(msg)} />}
        {activeTab === 'security' && <SecurityTab onSave={(msg) => toast.show(msg)} />}
      </Panel>
    </div>
  );
}

function SaveButton({ onClick, label = 'Save Changes' }: { onClick: () => void; label?: string }) {
  const [saving, setSaving] = useState(false);

  const handleClick = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      onClick();
    }, 600);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={saving}
      className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-70">
      {saving ? (
        <>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Saving…
        </>
      ) : (
        <>
          <Save size={15} strokeWidth={1.75} />
          {label}
        </>
      )}
    </button>
  );
}

function ClinicInfoTab({ onSave }: { onSave: (msg: string) => void }) {
  const [form, setForm] = useState<ClinicSettings>(() => loadSettings().clinic);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    patchSettings({ clinic: form });
    onSave('Clinic information saved!');
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onSave('Please select a valid image file');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onSave('Logo must be under 2 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const logo = reader.result as string;
      setForm((prev) => ({ ...prev, logo }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const logoSrc = form.logo || ssaLogo;

  return (
    <div>
      <SectionHeader title="Clinic Information" />
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Clinic Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={fieldClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Address</label>
          <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={textareaClass} />
        </div>
        <div>
          <label className={labelClass}>Clinic Logo</label>
          <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-black ring-2 ring-primary/20">
              <img src={logoSrc} alt="Clinic logo" className="h-full w-full object-cover" />
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <Upload size={14} strokeWidth={1.75} />
              Upload New Logo
            </button>
            {form.logo && (
              <button
                type="button"
                onClick={() => setForm({ ...form, logo: null })}
                className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-destructive">
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <SaveButton onClick={handleSave} />
      </div>
    </div>
  );
}

function BillingTab({ onSave }: { onSave: (msg: string) => void }) {
  const [form, setForm] = useState<BillingSettings>(() => loadSettings().billing);

  const handleSave = () => {
    patchSettings({ billing: form });
    onSave('Tax & billing settings saved!');
  };

  return (
    <div>
      <SectionHeader title="Tax & Billing" />
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Tax Rate (%)</label>
            <input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} step="0.01" className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Currency</label>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={fieldClass}>
              <option value="PKR">PKR - Pakistani Rupee</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Accepted Payment Methods</label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { key: 'cash', label: 'Cash' },
              { key: 'card', label: 'Credit/Debit Card' },
              { key: 'transfer', label: 'Bank Transfer' },
              { key: 'mobile', label: 'Mobile Payment' },
              { key: 'credit', label: 'Allow credit on bills (partial payment)' },
            ].map(({ key, label }) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-[13px] transition-colors ${
                  form.methods[key as keyof PaymentMethods]
                    ? 'border-primary/30 bg-secondary text-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/30'
                }`}>
                <input
                  type="checkbox"
                  checked={form.methods[key as keyof PaymentMethods]}
                  onChange={(e) => setForm({ ...form, methods: { ...form.methods, [key]: e.target.checked } })}
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-5 border-t border-border pt-4">
        <SaveButton onClick={handleSave} />
      </div>
    </div>
  );
}

function NotificationsTab({ onSave }: { onSave: (msg: string) => void }) {
  const saved = loadSettings().notifications;
  const [whatsappEnabled, setWhatsappEnabled] = useState(saved.whatsappEnabled);
  const [emailEnabled, setEmailEnabled] = useState(saved.emailEnabled);
  const [whatsappItems, setWhatsappItems] = useState(saved.whatsappItems);
  const [emailItems, setEmailItems] = useState(saved.emailItems);

  const handleSave = () => {
    patchSettings({
      notifications: { whatsappEnabled, emailEnabled, whatsappItems, emailItems },
    });
    onSave('Notification preferences saved!');
  };

  return (
    <div>
      <SectionHeader title="Notification Preferences" />

      <div className="space-y-3">
        <div className="rounded-lg border border-border bg-background p-3.5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">WhatsApp Notifications</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">Send notifications via WhatsApp</div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" checked={whatsappEnabled} onChange={(e) => setWhatsappEnabled(e.target.checked)} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
            </label>
          </div>
          {whatsappEnabled && (
            <div className="space-y-2 border-t border-border pt-3">
              {[
                { key: 'receipt', label: 'Send receipt to client after payment' },
                { key: 'lowStock', label: 'Low stock alerts to admin' },
                { key: 'overdue', label: 'Invoice overdue reminders' },
                { key: 'welcome', label: 'New client welcome message' },
              ].map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={whatsappItems[key as keyof WhatsappItems]}
                    onChange={(e) => setWhatsappItems({ ...whatsappItems, [key]: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary/30"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-background p-3.5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">Email Notifications</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">Send notifications via email</div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
            </label>
          </div>
          {emailEnabled && (
            <div className="space-y-2 border-t border-border pt-3">
              {[
                { key: 'daily', label: 'Daily revenue summary to admin' },
                { key: 'weekly', label: 'Weekly reports to admin' },
                { key: 'lowStock', label: 'Low stock email alerts' },
                { key: 'invoices', label: 'Invoice copies to clients' },
              ].map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={emailItems[key as keyof EmailItems]}
                    onChange={(e) => setEmailItems({ ...emailItems, [key]: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-primary/30"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <SaveButton onClick={handleSave} />
      </div>
    </div>
  );
}

function UserFormModal({
  user,
  onClose,
  onSubmit,
}: {
  user: UserAccount | null;
  onClose: () => void;
  onSubmit: (data: Omit<UserAccount, 'id'> & { id?: number }) => void;
}) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || ('Staff' as UserAccount['role']),
    status: user?.status || ('Active' as UserAccount['status']),
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@skinspectrum.com')) {
      setError('Email must be a @skinspectrum.com address');
      return;
    }
    if (!user && !form.password.trim()) {
      setError('Password is required');
      return;
    }
    if ((!user || form.password.trim()) && form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setError('');
    const password = user ? (form.password.trim() || user.password) : form.password;
    const passwordChangedAt = form.password.trim() || !user ? new Date().toISOString() : user.passwordChangedAt;
    onSubmit(
      user
        ? { name: form.name, email: form.email, password, passwordChangedAt, role: form.role, status: form.status, id: user.id }
        : { name: form.name, email: form.email, password, passwordChangedAt, role: form.role, status: form.status },
    );
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
        className="w-full will-change-transform sm:max-w-md">
        <div className="max-h-[92vh] overflow-y-auto scroll-area rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-xl">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-8 rounded-full bg-border" />
        </div>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-4">
          <h2 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-semibold text-foreground">
            {user ? 'Edit User' : 'Add User'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
              {error}
            </div>
          )}
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter full name"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@skinspectrum.com"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>{user ? 'New Password' : 'Password'}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={user ? 'Leave blank to keep current password' : 'Min 8 characters'}
              className={fieldClass}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {user ? 'Only enter a password if you want to change it.' : 'This password will be used to sign in.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserAccount['role'] })} className={fieldClass}>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as UserAccount['status'] })} className={fieldClass}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 border-t border-border pt-4">
            <button type="button" onClick={onClose} className="h-9 flex-1 rounded-lg border border-border text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted">
              Cancel
            </button>
            <button type="submit" className="h-9 flex-1 rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
              {user ? 'Save Changes' : 'Add User'}
            </button>
          </div>
        </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UsersTab({ onSave }: { onSave: (msg: string) => void }) {
  const [users, setUsers] = useState<UserAccount[]>(() => loadSettings().users);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState<UserAccount | null>(null);

  const persistUsers = (nextUsers: UserAccount[]) => {
    setUsers(nextUsers);
    patchSettings({ users: nextUsers });
  };

  const handleAddUser = (data: Omit<UserAccount, 'id'>) => {
    const nextId = users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1;
    persistUsers([...users, { ...data, id: nextId }]);
    setShowAddUser(false);
    onSave('User added successfully!');
  };

  const handleUpdateUser = (data: Omit<UserAccount, 'id'> & { id?: number }) => {
    if (data.id == null) return;
    persistUsers(users.map((u) => (u.id === data.id ? { ...data, id: data.id } : u)));
    setEditUser(null);
    onSave('User updated successfully!');
  };

  return (
    <div>
      <SectionHeader
        title="User Accounts"
        action={
          <button
            type="button"
            onClick={() => setShowAddUser(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            <Plus size={14} strokeWidth={2} />
            Add User
          </button>
        }
      />

      <div className="overflow-x-hidden overflow-y-auto rounded-lg border border-border">
        <table className="w-full table-fixed">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border bg-card">
              <th className="w-[22%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Name</th>
              <th className="w-[32%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Email</th>
              <th className="w-[14%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Role</th>
              <th className="w-[14%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="w-[18%] bg-card px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[13px] text-muted-foreground">
                  No users yet. Click &quot;Add User&quot; to create one.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <span className="truncate text-[13px] font-medium text-foreground">{user.name}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="block truncate text-[12px] text-muted-foreground">{user.email}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-primary">{user.role}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        user.status === 'Active' ? 'bg-[#2ECC8A]/10 text-[#159B61]' : 'bg-muted text-muted-foreground'
                      }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setEditUser(user)}
                      className="text-[12px] font-medium text-primary transition-colors hover:text-primary/80">
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-background p-3">
        <Lock size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-muted-foreground" />
        <div>
          <div className="text-[13px] font-medium text-foreground">Staff access only</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Only authorized staff with @skinspectrum.com emails can access this system.
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showAddUser && (
          <UserFormModal key="add-user" user={null} onClose={() => setShowAddUser(false)} onSubmit={handleAddUser} />
        )}
        {editUser && (
          <UserFormModal key={`edit-user-${editUser.id}`} user={editUser} onClose={() => setEditUser(null)} onSubmit={handleUpdateUser} />
        )}
      </AnimatePresence>
    </div>
  );
}

function BillPersonFormModal({
  person,
  onClose,
  onSubmit,
}: {
  person: BillPerson | null;
  onClose: () => void;
  onSubmit: (data: Omit<BillPerson, 'id'> & { id?: number }) => void;
}) {
  const [form, setForm] = useState({
    name: person?.name || '',
    password: '',
    status: person?.status || ('Active' as BillPerson['status']),
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!person && !form.password.trim()) {
      setError('Password is required');
      return;
    }
    if ((!person || form.password.trim()) && form.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    setError('');
    const password = person ? (form.password.trim() || person.password) : form.password;
    onSubmit(
      person
        ? { id: person.id, name: form.name.trim(), password, status: form.status }
        : { name: form.name.trim(), password, status: form.status },
    );
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
        className="w-full will-change-transform sm:max-w-md">
        <div className="max-h-[92vh] overflow-y-auto scroll-area rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-xl">
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="h-1 w-8 rounded-full bg-border" />
          </div>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-4">
            <h2 style={{ fontFamily: 'var(--font-heading)' }} className="text-lg font-semibold text-foreground">
              {person ? 'Edit Bill Person' : 'Add Bill Person'}
            </h2>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            {error && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
                {error}
              </div>
            )}
            <div>
              <label className={labelClass}>Staff Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter staff name"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass}>{person ? 'New Bill Password' : 'Bill Password'}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={person ? 'Leave blank to keep current password' : 'Password for POS save/print'}
                className={fieldClass}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Used on POS when saving or printing a bill. Password is never shown in this list.
              </p>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as BillPerson['status'] })}
                className={fieldClass}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="flex gap-2 border-t border-border pt-4">
              <button type="button" onClick={onClose} className="h-9 flex-1 rounded-lg border border-border text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted">
                Cancel
              </button>
              <button type="submit" className="h-9 flex-1 rounded-lg bg-primary text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                {person ? 'Save Changes' : 'Add Bill Person'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
}

function BillPersonsTab({ onSave }: { onSave: (msg: string) => void }) {
  const [billPersons, setBillPersons] = useState<BillPerson[]>(() => loadSettings().billPersons);
  const [showAdd, setShowAdd] = useState(false);
  const [editPerson, setEditPerson] = useState<BillPerson | null>(null);

  const persist = (next: BillPerson[]) => {
    setBillPersons(next);
    patchSettings({ billPersons: next });
  };

  const handleAdd = (data: Omit<BillPerson, 'id'>) => {
    const nextId = billPersons.length ? Math.max(...billPersons.map((p) => p.id)) + 1 : 1;
    persist([...billPersons, { ...data, id: nextId }]);
    setShowAdd(false);
    onSave('Bill person added successfully!');
  };

  const handleUpdate = (data: Omit<BillPerson, 'id'> & { id?: number }) => {
    if (data.id == null) return;
    persist(billPersons.map((p) => (p.id === data.id ? { ...data, id: data.id } : p)));
    setEditPerson(null);
    onSave('Bill person updated successfully!');
  };

  return (
    <div>
      <SectionHeader
        title="Bill Person"
        action={
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-semibold text-primary-foreground transition-opacity hover:opacity-90">
            <Plus size={14} strokeWidth={2} />
            Add Bill Person
          </button>
        }
      />

      <div className="overflow-x-hidden overflow-y-auto rounded-lg border border-border">
        <table className="w-full table-fixed">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="border-b border-border bg-card">
              <th className="w-[40%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Name</th>
              <th className="w-[30%] bg-card px-3 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="w-[30%] bg-card px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card">
            {billPersons.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-[13px] text-muted-foreground">
                  No bill persons yet. Add staff who can authorize POS bills.
                </td>
              </tr>
            ) : (
              billPersons.map((person) => (
                <tr key={person.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    <span className="truncate text-[13px] font-medium text-foreground">{person.name}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        person.status === 'Active' ? 'bg-[#2ECC8A]/10 text-[#159B61]' : 'bg-muted text-muted-foreground'
                      }`}>
                      {person.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setEditPerson(person)}
                      className="text-[12px] font-medium text-primary transition-colors hover:text-primary/80">
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-background p-3">
        <UserCheck size={15} strokeWidth={1.75} className="mt-0.5 shrink-0 text-muted-foreground" />
        <div>
          <div className="text-[13px] font-medium text-foreground">POS bill authorization</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Staff listed here can enter their bill password on POS (Ctrl+S or Ctrl+P) to save or print invoices. Their name appears on the receipt — passwords are never shown here.
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showAdd && (
          <BillPersonFormModal key="add-bill-person" person={null} onClose={() => setShowAdd(false)} onSubmit={handleAdd} />
        )}
        {editPerson && (
          <BillPersonFormModal key={`edit-bill-person-${editPerson.id}`} person={editPerson} onClose={() => setEditPerson(null)} onSubmit={handleUpdate} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SecurityTab({ onSave }: { onSave: (msg: string) => void }) {
  const { user, clearPasswordReminder } = useAuth();
  const saved = loadSettings().security;
  const [form, setForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
    timeout: saved.timeout,
    forceChange: saved.forceChange,
  });
  const [error, setError] = useState('');

  const handleSaveSecurity = () => {
    const minutes = parseInt(form.timeout, 10);
    if (!Number.isFinite(minutes) || minutes < 5) {
      setError('Session timeout must be at least 5 minutes');
      return;
    }
    setError('');
    patchSettings({ security: { timeout: form.timeout, forceChange: form.forceChange } });
    onSave('Security settings saved!');
  };

  const handleSave = () => {
    if (!user?.email) {
      setError('You must be signed in to update your password');
      return;
    }
    if (!form.current) {
      setError('Please enter your current password');
      return;
    }
    if (form.newPass.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (form.newPass !== form.confirm) {
      setError('Passwords do not match');
      return;
    }

    const result = updateUserPassword(user.email, form.current, form.newPass);
    if (!result.success) {
      setError(result.error);
      return;
    }

    patchSettings({ security: { timeout: form.timeout, forceChange: form.forceChange } });
    clearPasswordReminder();
    setError('');
    setForm({ ...form, current: '', newPass: '', confirm: '' });
    onSave('Password updated successfully!');
  };

  return (
    <div>
      <SectionHeader title="Security" />

      {user?.mustChangePassword && (
        <div className="mb-4 rounded-lg border border-[#F0A500]/30 bg-[#F0A500]/10 px-3 py-2.5 text-[13px] text-[#A86F00]">
          Your password has expired. Please set a new password to continue using the system.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className={labelClass}>Current Password</label>
          <input
            type="password"
            placeholder="Enter current password"
            value={form.current}
            onChange={(e) => setForm({ ...form, current: e.target.value })}
            className={fieldClass}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>New Password</label>
            <input
              type="password"
              placeholder="Min 8 characters"
              value={form.newPass}
              onChange={(e) => setForm({ ...form, newPass: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <label className={labelClass}>Session Timeout (minutes)</label>
          <input type="number" min="5" value={form.timeout} onChange={(e) => setForm({ ...form, timeout: e.target.value })} className={`${fieldClass} max-w-[160px]`} />
          <p className="mt-1.5 text-[11px] text-muted-foreground">Users are logged out after this period of inactivity</p>
        </div>

        <div className="rounded-lg border border-border bg-background p-3">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={form.forceChange}
              onChange={(e) => setForm({ ...form, forceChange: e.target.checked })}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary/30"
            />
            <div>
              <div className="text-[13px] font-medium text-foreground">Require password change every 90 days</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">Force users to update their passwords regularly</div>
            </div>
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
        <SaveButton onClick={handleSaveSecurity} label="Save Security Settings" />
        <SaveButton onClick={handleSave} label="Update Password" />
      </div>
    </div>
  );
}
