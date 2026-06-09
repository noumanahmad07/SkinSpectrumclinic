import { useState } from 'react';
import { Building2, Receipt, Bell, Users, Lock, Save, Upload, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ssaLogo from '../../assets/ssa-logo.png';

function useSuccessToast() {
  const [message, setMessage] = useState('');
  const show = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };
  return { message, show };
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('clinic');
  const toast = useSuccessToast();

  const tabs = [
    { id: 'clinic', label: 'Clinic Info', icon: <Building2 size={16} /> },
    { id: 'billing', label: 'Tax & Billing', icon: <Receipt size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'users', label: 'User Accounts', icon: <Users size={16} /> },
    { id: 'security', label: 'Security', icon: <Lock size={16} /> },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast.message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 md:right-8 z-50 bg-[#2ECC8A] text-white px-6 py-3 rounded-lg shadow-lg font-medium flex items-center gap-2">
            <Check size={18} />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-heading)' }} className="text-2xl md:text-3xl font-bold text-[#1A1025] mb-1 md:mb-2">
          Settings
        </h2>
        <p className="text-[#6B6570] text-sm">Manage your clinic and system preferences</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[14px] p-1.5 md:p-2 flex gap-1 overflow-x-auto scrollbar-hide"
        style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 md:px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap text-xs md:text-sm ${
              activeTab === tab.id ? 'bg-[#C9A96E] text-white' : 'text-[#6B6570] hover:bg-[#F8F5F0]'
            }`}>
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-[14px] p-4 md:p-8"
        style={{ boxShadow: '0 4px 20px rgba(26, 16, 37, 0.08)' }}>
        {activeTab === 'clinic' && <ClinicInfoTab onSave={() => toast.show('Clinic information saved!')} />}
        {activeTab === 'billing' && <BillingTab onSave={() => toast.show('Tax & billing settings saved!')} />}
        {activeTab === 'notifications' && <NotificationsTab onSave={() => toast.show('Notification preferences saved!')} />}
        {activeTab === 'users' && <UsersTab onSave={() => toast.show('User settings saved!')} />}
        {activeTab === 'security' && <SecurityTab onSave={() => toast.show('Password updated successfully!')} />}
      </div>
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
      onClick={handleClick}
      disabled={saving}
      className={`px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2
        transition-all transform active:scale-[0.98] ${saving ? 'opacity-80' : 'hover:scale-[1.02]'}`}
      style={{ background: 'linear-gradient(135deg, #C9A96E 0%, #E8C98A 100%)' }}>
      {saving ? (
        <>
          <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Save size={16} />
          {label}
        </>
      )}
    </button>
  );
}

function ClinicInfoTab({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    name: 'SkinSpectrum Esthetics',
    phone: '+1 (555) 123-4567',
    email: 'info@skinspectrum.com',
    address: '123 Beauty Lane, Suite 100\nLos Angeles, CA 90028\nUnited States',
    website: 'www.skinspectrum.com',
  });

  return (
    <div className="space-y-5 md:space-y-6">
      <h3 className="text-base md:text-lg font-semibold text-[#1A1025]">Clinic Information</h3>
      <div className="space-y-4 md:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Clinic Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-2">Address</label>
          <textarea
            rows={3}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-2">Clinic Logo</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-black flex items-center justify-center overflow-hidden border border-[#E8C98A]/40">
              <img src={ssaLogo} alt="Skin Spectrum Aesthetics" className="h-full w-full object-cover" />
            </div>
            <button className="px-4 py-2 bg-[#F8F5F0] hover:bg-[#EDE8E3] border border-[#EDE8E3] rounded-lg font-medium text-[#6B6570] transition-colors flex items-center gap-2 text-sm">
              <Upload size={15} />Upload New Logo
            </button>
          </div>
        </div>
      </div>
      <div className="pt-4 border-t border-[#EDE8E3]">
        <SaveButton onClick={onSave} />
      </div>
    </div>
  );
}

function BillingTab({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    taxRate: '8',
    currency: 'PKR',
    invoicePrefix: 'INV',
    paymentTerms: '30',
    methods: { cash: true, card: true, transfer: true, mobile: true },
  });

  return (
    <div className="space-y-5 md:space-y-6">
      <h3 className="text-base md:text-lg font-semibold text-[#1A1025]">Tax & Billing Settings</h3>
      <div className="space-y-4 md:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Tax Rate (%)</label>
            <input
              type="number"
              value={form.taxRate}
              onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
              step="0.01"
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Currency</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent">
              <option value="PKR">PKR - Pakistani Rupee</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Invoice Prefix</label>
            <input
              type="text"
              value={form.invoicePrefix}
              onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">Payment Terms (Days)</label>
            <input
              type="number"
              value={form.paymentTerms}
              onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1A1025] mb-3">Accepted Payment Methods</label>
          <div className="space-y-2">
            {[
              { key: 'cash', label: 'Cash' },
              { key: 'card', label: 'Credit/Debit Card' },
              { key: 'transfer', label: 'Bank Transfer' },
              { key: 'mobile', label: 'Mobile Payment' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.methods[key as keyof typeof form.methods]}
                  onChange={(e) => setForm({ ...form, methods: { ...form.methods, [key]: e.target.checked } })}
                  className="w-4 h-4 md:w-5 md:h-5 rounded border-[#EDE8E3] text-[#C9A96E] focus:ring-[#C9A96E] focus:ring-offset-0"
                />
                <span className="text-[#1A1025] text-sm md:text-base">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="pt-4 border-t border-[#EDE8E3]">
        <SaveButton onClick={onSave} />
      </div>
    </div>
  );
}

function NotificationsTab({ onSave }: { onSave: () => void }) {
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [whatsappItems, setWhatsappItems] = useState({
    receipt: true, lowStock: true, overdue: true, welcome: true,
  });
  const [emailItems, setEmailItems] = useState({
    daily: true, weekly: true, lowStock: true, invoices: true,
  });

  return (
    <div className="space-y-5 md:space-y-6">
      <h3 className="text-base md:text-lg font-semibold text-[#1A1025]">Notification Preferences</h3>

      {/* WhatsApp */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium text-[#1A1025]">WhatsApp Notifications</div>
            <div className="text-xs md:text-sm text-[#6B6570] mt-0.5">Send notifications via WhatsApp</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={whatsappEnabled} onChange={(e) => setWhatsappEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-[#EDE8E3] rounded-full peer peer-checked:bg-[#C9A96E] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
          </label>
        </div>
        {whatsappEnabled && (
          <div className="pl-4 space-y-2">
            {[
              { key: 'receipt', label: 'Send receipt to client after payment' },
              { key: 'lowStock', label: 'Low stock alerts to admin' },
              { key: 'overdue', label: 'Invoice overdue reminders' },
              { key: 'welcome', label: 'New client welcome message' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={whatsappItems[key as keyof typeof whatsappItems]}
                  onChange={(e) => setWhatsappItems({ ...whatsappItems, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-[#EDE8E3] text-[#C9A96E] focus:ring-[#C9A96E] focus:ring-offset-0"
                />
                <span className="text-[#6B6570]">{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Email */}
      <div className="pt-4 border-t border-[#EDE8E3]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium text-[#1A1025]">Email Notifications</div>
            <div className="text-xs md:text-sm text-[#6B6570] mt-0.5">Send notifications via email</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={emailEnabled} onChange={(e) => setEmailEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-[#EDE8E3] rounded-full peer peer-checked:bg-[#C9A96E] peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
          </label>
        </div>
        {emailEnabled && (
          <div className="pl-4 space-y-2">
            {[
              { key: 'daily', label: 'Daily revenue summary to admin' },
              { key: 'weekly', label: 'Weekly reports to admin' },
              { key: 'lowStock', label: 'Low stock email alerts' },
              { key: 'invoices', label: 'Invoice copies to clients' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={emailItems[key as keyof typeof emailItems]}
                  onChange={(e) => setEmailItems({ ...emailItems, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-[#EDE8E3] text-[#C9A96E] focus:ring-[#C9A96E] focus:ring-offset-0"
                />
                <span className="text-[#6B6570]">{label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-[#EDE8E3]">
        <SaveButton onClick={onSave} />
      </div>
    </div>
  );
}

function UsersTab({ onSave }: { onSave: () => void }) {
  const [users] = useState([
    { id: 1, name: 'Admin User', email: 'admin@skinspectrum.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Staff Member', email: 'staff@skinspectrum.com', role: 'Staff', status: 'Active' },
    { id: 3, name: 'Manager', email: 'manager@skinspectrum.com', role: 'Manager', status: 'Active' },
  ]);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-semibold text-[#1A1025]">User Accounts</h3>
        <button onClick={onSave} className="px-4 py-2 rounded-lg font-medium text-white bg-[#C9A96E] hover:bg-[#A07840] transition-colors text-sm">
          Add User
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#EDE8E3]">
        <table className="w-full min-w-[500px]">
          <thead className="bg-[#F8F5F0] border-b border-[#EDE8E3]">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-[#6B6570] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[#EDE8E3]/50 hover:bg-[#F8F5F0]">
                <td className="py-3 px-4 text-sm text-[#1A1025] font-medium">{user.name}</td>
                <td className="py-3 px-4 text-sm text-[#6B6570] truncate max-w-[160px]">{user.email}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-[#C9A96E]/10 text-[#C9A96E] rounded-full text-xs font-medium">{user.role}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 bg-[#2ECC8A]/10 text-[#2ECC8A] rounded-full text-xs font-medium">{user.status}</span>
                </td>
                <td className="py-3 px-4">
                  <button onClick={onSave} className="text-[#C9A96E] hover:text-[#A07840] text-sm font-medium">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-[#F8F5F0] rounded-lg border border-[#EDE8E3]">
        <div className="flex items-start gap-3">
          <Lock size={16} className="text-[#6B6570] mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-[#1A1025] mb-1 text-sm">Staff Access Only</div>
            <div className="text-xs md:text-sm text-[#6B6570]">
              This system is private. Only authorized staff with @skinspectrum.com emails can access it.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityTab({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    current: '', newPass: '', confirm: '', timeout: '30', forceChange: true,
  });
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!form.current) { setError('Please enter your current password'); return; }
    if (form.newPass.length < 8) { setError('New password must be at least 8 characters'); return; }
    if (form.newPass !== form.confirm) { setError('Passwords do not match'); return; }
    setError('');
    setForm({ ...form, current: '', newPass: '', confirm: '' });
    onSave();
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <h3 className="text-base md:text-lg font-semibold text-[#1A1025]">Security Settings</h3>

      {error && (
        <div className="p-3 bg-[#E5445A]/10 border border-[#E5445A]/20 rounded-lg text-[#E5445A] text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {[
          { label: 'Current Password', key: 'current', placeholder: 'Enter current password' },
          { label: 'New Password', key: 'newPass', placeholder: 'Enter new password (min 8 chars)' },
          { label: 'Confirm New Password', key: 'confirm', placeholder: 'Confirm new password' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-[#1A1025] mb-2">{label}</label>
            <input
              type="password"
              placeholder={placeholder}
              value={form[key as keyof typeof form] as string}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            />
          </div>
        ))}

        <div className="pt-4 border-t border-[#EDE8E3]">
          <label className="block text-sm font-medium text-[#1A1025] mb-2">Session Timeout (minutes)</label>
          <input
            type="number"
            value={form.timeout}
            onChange={(e) => setForm({ ...form, timeout: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-[#EDE8E3] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
          />
          <p className="text-xs text-[#6B6570] mt-2">Users are auto-logged out after this period of inactivity</p>
        </div>

        <div className="pt-4 border-t border-[#EDE8E3]">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.forceChange}
              onChange={(e) => setForm({ ...form, forceChange: e.target.checked })}
              className="w-4 h-4 md:w-5 md:h-5 rounded border-[#EDE8E3] text-[#C9A96E] focus:ring-[#C9A96E] focus:ring-offset-0"
            />
            <div>
              <div className="font-medium text-[#1A1025] text-sm">Require password change every 90 days</div>
              <div className="text-xs text-[#6B6570]">Force users to update their passwords regularly</div>
            </div>
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-[#EDE8E3]">
        <SaveButton onClick={handleSave} label="Update Password" />
      </div>
    </div>
  );
}
