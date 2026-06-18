export const SETTINGS_STORAGE_KEY = 'skinspectrum_settings';
export const SETTINGS_UPDATED_EVENT = 'skinspectrum-settings-updated';

export type PaymentMethods = { cash: boolean; card: boolean; transfer: boolean; mobile: boolean; credit: boolean };

export type ClinicSettings = {
  name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  logo: string | null;
};

export type BillingSettings = {
  taxRate: string;
  currency: string;
  methods: PaymentMethods;
};

export type WhatsappItems = { receipt: boolean; lowStock: boolean; overdue: boolean; welcome: boolean };
export type EmailItems = { daily: boolean; weekly: boolean; lowStock: boolean; invoices: boolean };

export type NotificationSettings = {
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  whatsappItems: WhatsappItems;
  emailItems: EmailItems;
};

export type UserAccount = {
  id: number | string;
  name: string;
  email: string;
  password: string;
  passwordChangedAt?: string;
  role: 'Admin' | 'Staff' | 'Manager';
  status: 'Active' | 'Inactive';
};

export type SecuritySettings = {
  forceChange: boolean;
};

export type BillPerson = {
  id: number | string;
  name: string;
  password: string;
  status: 'Active' | 'Inactive';
};

export type AppSettings = {
  clinic: ClinicSettings;
  billing: BillingSettings;
  notifications: NotificationSettings;
  users: UserAccount[];
  billPersons: BillPerson[];
  security: SecuritySettings;
};

export type PosPaymentMethod = 'Cash' | 'Card' | 'Transfer' | 'Mobile';

const POS_PAYMENT_METHODS: { key: keyof PaymentMethods; label: PosPaymentMethod }[] = [
  { key: 'cash', label: 'Cash' },
  { key: 'card', label: 'Card' },
  { key: 'transfer', label: 'Transfer' },
  { key: 'mobile', label: 'Mobile' },
];

export function isCreditEnabled(billing: BillingSettings = loadSettings().billing): boolean {
  return billing.methods.credit !== false;
}

export const defaultSettings: AppSettings = {
  clinic: {
    name: 'Skin Spectrum Aesthetics',
    phone: '+1 (555) 123-4567',
    email: 'info@skinspectrum.com',
    address: '123 Beauty Lane, Suite 100\nLos Angeles, CA 90028\nUnited States',
    website: 'www.skinspectrum.com',
    logo: null,
  },
  billing: {
    taxRate: '8',
    currency: 'PKR',
    methods: { cash: true, card: true, transfer: true, mobile: true, credit: true },
  },
  notifications: {
    whatsappEnabled: true,
    emailEnabled: true,
    whatsappItems: { receipt: true, lowStock: true, overdue: true, welcome: true },
    emailItems: { daily: true, weekly: true, lowStock: true, invoices: true },
  },
  users: [
    { id: 1, name: 'Admin User', email: 'admin@skinspectrum.com', password: 'admin123', passwordChangedAt: new Date().toISOString(), role: 'Admin', status: 'Active' },
    { id: 2, name: 'Staff Member', email: 'staff@skinspectrum.com', password: 'staff123', passwordChangedAt: new Date().toISOString(), role: 'Staff', status: 'Active' },
    { id: 3, name: 'Manager', email: 'manager@skinspectrum.com', password: 'manager123', passwordChangedAt: new Date().toISOString(), role: 'Manager', status: 'Active' },
  ],
  billPersons: [
    { id: 1, name: 'Admin User', password: 'bill1234', status: 'Active' },
    { id: 2, name: 'Staff Member', password: 'bill1234', status: 'Active' },
    { id: 3, name: 'Manager', password: 'bill1234', status: 'Active' },
  ],
  security: {
    forceChange: true,
  },
};

function notifySettingsUpdated() {
  window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
}

function normalizeUsers(users: Partial<UserAccount>[]): UserAccount[] {
  return users.map((user, index) => {
    const fallback = defaultSettings.users.find((d) => d.email.toLowerCase() === (user.email || '').toLowerCase());
    const storedPassword = typeof user.password === 'string' ? user.password : undefined;
    return {
      id: user.id ?? index + 1,
      name: user.name || fallback?.name || 'Staff Member',
      email: user.email || fallback?.email || `staff${index + 1}@skinspectrum.com`,
      password: storedPassword && storedPassword.length > 0 ? storedPassword : (fallback?.password || ''),
      passwordChangedAt: user.passwordChangedAt || fallback?.passwordChangedAt,
      role: user.role || fallback?.role || 'Staff',
      status: user.status || fallback?.status || 'Active',
    };
  });
}

export function mergeStaffUsersFromBackend(
  staffProfiles: Array<{
    id: string | number;
    name: string;
    email: string;
    role: UserAccount['role'];
    status: UserAccount['status'];
    password_changed_at?: string | null;
  }>,
  existingUsers: UserAccount[] = loadSettings().users,
): UserAccount[] {
  const merged = staffProfiles.map((profile) => {
    const existing = existingUsers.find((user) => user.email.toLowerCase() === profile.email.toLowerCase());
    const defaultAccount = defaultSettings.users.find(
      (user) => user.email.toLowerCase() === profile.email.toLowerCase(),
    );
    const password =
      existing?.password && existing.password.length > 0
        ? existing.password
        : (defaultAccount?.password || '');
    return {
      id: profile.id,
      name: profile.name,
      email: profile.email.toLowerCase(),
      password,
      passwordChangedAt: profile.password_changed_at ?? existing?.passwordChangedAt,
      role: profile.role,
      status: profile.status,
    };
  });

  const backendEmails = new Set(staffProfiles.map((profile) => profile.email.toLowerCase()));
  const localOnlyUsers = existingUsers
    .filter((user) => !backendEmails.has(user.email.toLowerCase()))
    .map((user) => ({ ...user, email: user.email.toLowerCase() }));

  return [...merged, ...localOnlyUsers];
}

function normalizeBillPersons(persons: Partial<BillPerson>[]): BillPerson[] {
  return persons.map((person, index) => {
    const fallback = defaultSettings.billPersons.find((d) => d.id === person.id) || defaultSettings.billPersons[index];
    return {
      id: person.id ?? fallback?.id ?? index + 1,
      name: person.name || fallback?.name || `Staff ${index + 1}`,
      password: person.password || fallback?.password || 'bill1234',
      status: person.status || fallback?.status || 'Active',
    };
  });
}

export function loadSettings(): AppSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      clinic: { ...defaultSettings.clinic, ...parsed.clinic },
      billing: {
        ...defaultSettings.billing,
        ...parsed.billing,
        methods: { ...defaultSettings.billing.methods, ...parsed.billing?.methods },
      },
      notifications: {
        ...defaultSettings.notifications,
        ...parsed.notifications,
        whatsappItems: { ...defaultSettings.notifications.whatsappItems, ...parsed.notifications?.whatsappItems },
        emailItems: { ...defaultSettings.notifications.emailItems, ...parsed.notifications?.emailItems },
      },
      users: normalizeUsers(parsed.users?.length ? parsed.users : defaultSettings.users),
      billPersons: normalizeBillPersons(parsed.billPersons?.length ? parsed.billPersons : defaultSettings.billPersons),
      security: {
        forceChange: parsed.security?.forceChange ?? defaultSettings.security.forceChange,
      },
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  notifySettingsUpdated();
}

export function patchSettings(patch: Partial<AppSettings>) {
  const current = loadSettings();
  const next = {
    ...current,
    ...patch,
    clinic: patch.clinic ? { ...current.clinic, ...patch.clinic } : current.clinic,
    billing: patch.billing
      ? { ...current.billing, ...patch.billing, methods: { ...current.billing.methods, ...patch.billing.methods } }
      : current.billing,
    notifications: patch.notifications
      ? {
          ...current.notifications,
          ...patch.notifications,
          whatsappItems: patch.notifications.whatsappItems
            ? { ...current.notifications.whatsappItems, ...patch.notifications.whatsappItems }
            : current.notifications.whatsappItems,
          emailItems: patch.notifications.emailItems
            ? { ...current.notifications.emailItems, ...patch.notifications.emailItems }
            : current.notifications.emailItems,
        }
      : current.notifications,
    billPersons: patch.billPersons ?? current.billPersons,
    security: patch.security ? { ...current.security, ...patch.security } : current.security,
  };
  saveSettings(next);
  return next;
}

export function getTaxRateDecimal(billing: BillingSettings = loadSettings().billing): number {
  const rate = parseFloat(billing.taxRate);
  return Number.isFinite(rate) && rate > 0 ? rate / 100 : 0;
}

export function getEnabledPaymentMethods(billing: BillingSettings = loadSettings().billing): PosPaymentMethod[] {
  return POS_PAYMENT_METHODS.filter(({ key }) => billing.methods[key]).map(({ label }) => label);
}

export function authenticateUser(email: string, password: string): UserAccount | null {
  const normalizedEmail = email.trim().toLowerCase();
  const settings = loadSettings();
  const savedAccount = settings.users.find((user) => user.email.toLowerCase() === normalizedEmail);
  const defaultAccount = defaultSettings.users.find((user) => user.email.toLowerCase() === normalizedEmail);
  const account = savedAccount ?? defaultAccount;
  if (!account || account.status !== 'Active') return null;

  const effectivePassword =
    savedAccount?.password && savedAccount.password.length > 0
      ? savedAccount.password
      : (defaultAccount?.password ?? '');

  if (!effectivePassword || effectivePassword !== password) return null;
  return { ...account, email: normalizedEmail, password: effectivePassword };
}

export function isPasswordChangeRequired(email: string): boolean {
  const settings = loadSettings();
  if (!settings.security.forceChange) return false;

  const account = settings.users.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
  if (!account) return false;
  if (!account.passwordChangedAt) return true;

  const changedAt = new Date(account.passwordChangedAt).getTime();
  const daysSinceChange = (Date.now() - changedAt) / (1000 * 60 * 60 * 24);
  return daysSinceChange >= 90;
}

export function updateUserPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): { success: true } | { success: false; error: string } {
  const settings = loadSettings();
  const index = settings.users.findIndex((user) => user.email.toLowerCase() === email.trim().toLowerCase());
  if (index === -1) return { success: false, error: 'Account not found' };
  if (settings.users[index].password !== currentPassword) {
    return { success: false, error: 'Current password is incorrect' };
  }
  if (newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters' };
  }

  const updatedUsers = [...settings.users];
  updatedUsers[index] = {
    ...updatedUsers[index],
    password: newPassword,
    passwordChangedAt: new Date().toISOString(),
  };
  patchSettings({ users: updatedUsers });
  return { success: true };
}

export type BillPersonPublic = Pick<BillPerson, 'id' | 'name' | 'status'>;

export function getActiveBillPersons(): BillPersonPublic[] {
  return loadSettings()
    .billPersons.filter((person) => person.status === 'Active')
    .map(({ id, name, status }) => ({ id, name, status }));
}

export function authenticateBillPerson(personId: number | string, password: string): BillPerson | null {
  const person = loadSettings().billPersons.find((entry) => String(entry.id) === String(personId));
  if (!person || person.status !== 'Active' || person.password !== password) return null;
  return person;
}
