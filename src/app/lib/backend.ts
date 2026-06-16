import { database, getStoredSupabaseSession, hasActiveSupabaseSession, isSupabaseConfigured, signUpStaffUser, trySignInWithPassword } from './supabase';
import type { Invoice } from './invoices';
import type {
  BillingSettings,
  ClinicSettings,
  NotificationSettings,
  SecuritySettings,
  UserAccount,
  BillPerson,
} from './settings';

export type BackendClient = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  skin_type: string;
  last_visit: string;
  total_spent: number;
  concerns: string[];
  allergies: string;
  notes: string;
  follow_up_days: number | null;
  follow_up_date: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BackendClientInput = Omit<BackendClient, 'id' | 'created_at' | 'updated_at'>;

export type BackendProduct = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  cost_price: number;
  sell_price: number;
  stock: number;
  min_stock: number;
  unit: string;
  expiry: string | null;
  status: 'Active' | 'Inactive';
  image: string;
};

export type BackendInventoryProduct = BackendProduct & {
  stock_status?: string;
  expiry_status?: string;
  created_at?: string;
  updated_at?: string;
};

export type BackendProductInput = Omit<BackendProduct, 'id'>;

export type BackendPosProduct = {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  min_stock: number;
  unit: string;
  expiry: string | null;
  status: 'Active' | 'Inactive';
  image: string;
};

export type BackendPosClient = {
  id: string;
  name: string;
  phone: string;
  total_spent: number;
  last_visit: string;
  appointment_date: string | null;
  appointment_time: string | null;
};

export type BackendInvoice = {
  id: string;
  client_id: string | null;
  client_name: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  status: 'Paid' | 'Credit';
  credit_amount: number | null;
  paid_amount: number | null;
  payment_method: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
};

export type BackendInvoiceItem = {
  id: string;
  invoice_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  price: number;
};

export type BackendInvoiceWithItems = BackendInvoice & {
  invoice_items: BackendInvoiceItem[];
};

export type BackendStaffProfile = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff' | 'Manager';
  status: 'Active' | 'Inactive';
  password_changed_at: string | null;
};

export type DashboardSummary = {
  today_revenue: number;
  total_clients: number;
  pending_invoices: number;
  pending_invoice_amount: number;
  products_sold: number;
  stock_alerts: number;
  appointments_today: number;
};

export type DashboardRevenuePoint = {
  day: string;
  revenue_date: string;
  revenue: number;
};

export type DashboardTopProduct = {
  name: string;
  units: number;
  value: number;
};

export type DashboardRecentInvoice = {
  id: string;
  client: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Credit';
};

export type DashboardLowStock = {
  product: string;
  current: number;
  minimum: number;
  category: string;
};

export type ReportSummary = {
  total_revenue: number;
  transactions: number;
  new_clients: number;
  avg_order: number;
};

export type ReportRevenuePoint = {
  date: string;
  revenue: number;
};

export type ReportCategorySale = {
  category: string;
  sales: number;
};

export type ReportClientGrowth = {
  month: string;
  clients: number;
};

export type ReportPaymentMethod = {
  name: string;
  value: number;
  amount: number;
};

export type ReportTopProduct = {
  product: string;
  revenue: number;
  units: number;
};

export type ReportTopClient = {
  client: string;
  total_spent: number;
  visits: number;
};

export type BackendClinicSettings = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  logo_url: string | null;
  tax_rate: number;
  currency: string;
  payment_methods: BillingSettings['methods'];
  notification_settings: NotificationSettings;
  security_settings: SecuritySettings;
};

export type BackendBillPersonPublic = {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
};

export type BackendNotification = {
  id: string;
  title: string;
  message: string;
  category: string;
  status: 'Unread' | 'Read' | string;
  priority: 'High' | 'Medium' | 'Normal' | string;
  created_at: string;
};

export function canUseBackend() {
  return isSupabaseConfigured();
}

export function canWriteToBackend() {
  return canUseBackend() && hasActiveSupabaseSession();
}

export async function fetchClients() {
  return database.select<BackendClient>('clients', 'select=*&order=created_at.desc');
}

export async function fetchClientPageClients() {
  return database.select<BackendClient>('clients_page_list', 'select=*');
}

export async function createBackendClient(client: BackendClientInput) {
  const rows = await database.insert<BackendClient>('clients', [client]);
  const savedClient = rows[0];
  if (!savedClient) {
    throw new Error('Supabase did not return the saved client.');
  }
  return savedClient;
}

export async function updateBackendClient(id: string, client: Partial<BackendClientInput>) {
  const rows = await database.update<BackendClient>('clients', `id=eq.${id}`, client);
  const savedClient = rows[0];
  if (!savedClient) {
    throw new Error('Supabase did not return the updated client.');
  }
  return savedClient;
}

export async function fetchProducts() {
  return database.select<BackendProduct>('products', 'select=*&order=name.asc');
}

export async function fetchInventoryProducts() {
  return database.select<BackendInventoryProduct>('inventory_products', 'select=*');
}

export async function createBackendProduct(product: BackendProductInput) {
  const [savedProduct] = await database.insert<BackendProduct>('products', [product]);
  return savedProduct;
}

export async function updateBackendProduct(id: string, product: Partial<BackendProductInput>) {
  const [savedProduct] = await database.update<BackendProduct>('products', `id=eq.${id}`, product);
  return savedProduct;
}

export async function deleteBackendProduct(id: string) {
  return database.delete('products', `id=eq.${id}`);
}

export async function fetchPosProducts() {
  return database.select<BackendPosProduct>('pos_products', 'select=*');
}

export async function fetchPosClients() {
  return database.select<BackendPosClient>('pos_clients', 'select=*');
}

export async function signInStaff(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const session = await database.signInWithPassword(normalizedEmail, password);
  const [profile] = await database.select<BackendStaffProfile>(
    'staff_profiles',
    `select=*&id=eq.${session.user.id}&limit=1`,
  );

  if (!profile || profile.status !== 'Active') {
    await database.signOut();
    return null;
  }

  window.sessionStorage.removeItem('skinspectrum_dismissals_backend');

  return {
    session,
    profile,
  };
}

export function parseSupabaseError(error: unknown): string {
  if (!(error instanceof Error) || !error.message) return 'Supabase request failed. Please try again.';

  try {
    const parsed = JSON.parse(error.message) as {
      msg?: string;
      message?: string;
      error_description?: string;
      error?: string;
      code?: string;
    };
    const detail = parsed.msg || parsed.message || parsed.error_description || parsed.error;
    if (detail?.includes('row-level security') || parsed.code === '42501') {
      return 'Permission denied. Log out and sign in with your Supabase staff account.';
    }
    if (parsed.code === 'user_already_exists' || detail?.toLowerCase().includes('already registered')) {
      return 'This email already exists in Supabase Auth. Use a different email or add the staff profile from the Supabase dashboard.';
    }
    return detail || error.message;
  } catch {
    if (error.message.includes('row-level security') || error.message.includes('42501')) {
      return 'Permission denied. Log out and sign in with your Supabase staff account.';
    }
    return error.message;
  }
}

function parseSupabaseAuthError(error: unknown): string {
  return parseSupabaseError(error);
}

export async function updateBackendStaffPassword(
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ success: true } | { success: false; error: string }> {
  if (newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters' };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const session = await database.signInWithPassword(normalizedEmail, currentPassword);
    await database.updatePassword(session.access_token, newPassword);

    await database.update<BackendStaffProfile>(
      'staff_profiles',
      `id=eq.${session.user.id}`,
      { password_changed_at: new Date().toISOString() },
    );

    await database.signInWithPassword(normalizedEmail, newPassword);
    return { success: true };
  } catch (error) {
    const detail = parseSupabaseAuthError(error).toLowerCase();
    if (
      detail.includes('invalid login credentials') ||
      detail.includes('invalid_grant') ||
      detail.includes('invalid email or password')
    ) {
      return { success: false, error: 'Current password is incorrect' };
    }
    return { success: false, error: parseSupabaseAuthError(error) };
  }
}

export async function fetchInvoices() {
  return database.select<BackendInvoiceWithItems>(
    'invoices',
    'select=*,invoice_items(*)&order=invoice_date.desc',
  );
}

export async function markBackendInvoicePaid(id: string) {
  const [invoice] = await database.select<BackendInvoice>(
    'invoices',
    `select=id,total&id=eq.${id}&limit=1`,
  );

  const [savedInvoice] = await database.update<BackendInvoice>(
    'invoices',
    `id=eq.${id}`,
    {
      status: 'Paid',
      credit_amount: null,
      paid_amount: invoice?.total ?? null,
    },
  );
  return savedInvoice;
}

export async function fetchDashboardData() {
  const [
    summaryRows,
    revenueTrend,
    topProducts,
    recentInvoices,
    lowStock,
    todayAppointments,
    upcomingAppointments,
    dueFollowUps,
  ] = await Promise.all([
    database.select<DashboardSummary>('dashboard_summary', 'select=*'),
    database.select<DashboardRevenuePoint>('dashboard_revenue_trend', 'select=*'),
    database.select<DashboardTopProduct>('dashboard_top_products', 'select=*'),
    database.select<DashboardRecentInvoice>('dashboard_recent_invoices', 'select=*'),
    database.select<DashboardLowStock>('dashboard_low_stock', 'select=*'),
    database.select<BackendClient>('dashboard_today_appointments', 'select=*'),
    database.select<BackendClient>('dashboard_upcoming_appointments', 'select=*'),
    database.select<BackendClient>('dashboard_due_followups', 'select=*'),
  ]);

  return {
    summary: summaryRows[0] ?? null,
    revenueTrend,
    topProducts,
    recentInvoices,
    lowStock,
    todayAppointments,
    upcomingAppointments,
    dueFollowUps,
  };
}

export async function fetchReportsData() {
  const results = await Promise.allSettled([
    database.select<ReportSummary>('reports_summary', 'select=*'),
    database.select<ReportRevenuePoint>('reports_revenue_today', 'select=*'),
    database.select<ReportRevenuePoint>('reports_revenue_week', 'select=*'),
    database.select<ReportRevenuePoint>('reports_revenue_month', 'select=*'),
    database.select<ReportRevenuePoint>('reports_revenue_custom', 'select=*'),
    database.select<ReportCategorySale>('reports_category_sales', 'select=*'),
    database.select<ReportClientGrowth>('reports_client_growth', 'select=*'),
    database.select<ReportPaymentMethod>('reports_payment_methods', 'select=*'),
    database.select<ReportTopProduct>('reports_top_products', 'select=*'),
    database.select<ReportTopClient>('reports_top_clients', 'select=*'),
  ]);

  const errors: string[] = [];
  const readRows = <T,>(index: number, label: string): T[] => {
    const result = results[index];
    if (result.status === 'fulfilled') return result.value;
    errors.push(formatReportsLoadError(label, result.reason));
    return [];
  };

  const summaryRows = readRows<ReportSummary>(0, 'Reports summary');
  const today = readRows<ReportRevenuePoint>(1, 'Today revenue');
  const week = readRows<ReportRevenuePoint>(2, 'Week revenue');
  const month = readRows<ReportRevenuePoint>(3, 'Month revenue');
  const custom = readRows<ReportRevenuePoint>(4, 'Custom revenue');
  const categorySales = readRows<ReportCategorySale>(5, 'Category sales');
  const clientGrowth = readRows<ReportClientGrowth>(6, 'Client growth');
  const paymentMethods = readRows<ReportPaymentMethod>(7, 'Payment methods');
  const topProducts = readRows<ReportTopProduct>(8, 'Top products');
  const topClients = readRows<ReportTopClient>(9, 'Top clients');

  return {
    summary: summaryRows[0] ?? {
      total_revenue: 0,
      transactions: 0,
      new_clients: 0,
      avg_order: 0,
    },
    revenue: {
      today,
      week,
      month,
      custom,
    },
    categorySales,
    clientGrowth,
    paymentMethods,
    topProducts,
    topClients,
    errors,
  };
}

function formatReportsLoadError(label: string, error: unknown) {
  const message = parseSupabaseError(error);
  if (/does not exist|PGRST205|404/.test(message)) {
    return `${label} could not load. Run supabase/reports_backend_setup.sql (or supabase/fix_reports_backend.sql) in the Supabase SQL Editor.`;
  }
  if (/row-level security|permission denied|401|jwt|not authenticated/i.test(message)) {
    return `${label} could not load. Sign out and sign in again with your Supabase staff account.`;
  }
  return `${label} could not load. ${message}`;
}

export function mapBackendSettings(row: BackendClinicSettings) {
  return {
    clinic: {
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      website: row.website,
      logo: row.logo_url,
    } satisfies ClinicSettings,
    billing: {
      taxRate: String(row.tax_rate ?? 8),
      currency: row.currency || 'PKR',
      methods: row.payment_methods,
    } satisfies BillingSettings,
    notifications: row.notification_settings,
    security: {
      forceChange: row.security_settings?.forceChange ?? true,
    } satisfies SecuritySettings,
  };
}

export async function fetchSettingsData() {
  const [clinicResult, staffResult, billPersonResult] = await Promise.allSettled([
    database.select<BackendClinicSettings>('settings_clinic', 'select=*'),
    database.select<BackendStaffProfile>('settings_staff_profiles', 'select=*'),
    database.select<BackendBillPersonPublic>('settings_bill_persons', 'select=*'),
  ]);

  const errors: string[] = [];

  const clinicRows = clinicResult.status === 'fulfilled' ? clinicResult.value : [];
  if (clinicResult.status === 'rejected') {
    errors.push(formatSettingsLoadError('Clinic settings', clinicResult.reason));
  }

  const staffRows = staffResult.status === 'fulfilled' ? staffResult.value : [];
  if (staffResult.status === 'rejected') {
    errors.push(formatSettingsLoadError('User accounts', staffResult.reason));
  }

  const billPersonRows = billPersonResult.status === 'fulfilled' ? billPersonResult.value : [];
  if (billPersonResult.status === 'rejected') {
    errors.push(formatSettingsLoadError('Bill persons', billPersonResult.reason));
  }

  return {
    clinicSettings: clinicRows[0] ?? null,
    staffProfiles: staffRows,
    billPersons: billPersonRows,
    errors,
  };
}

function formatSettingsLoadError(scope: string, error: unknown) {
  const message = parseSupabaseError(error);
  if (/does not exist|PGRST205|404/.test(message)) {
    return `${scope} could not load. Run supabase/settings_backend_setup.sql in the Supabase SQL Editor.`;
  }
  if (/row-level security|permission denied|401|jwt|not authenticated/i.test(message)) {
    return `${scope} could not load. Sign out and sign in again with your Supabase staff account.`;
  }
  return `${scope} could not load. ${message}`;
}

async function updateClinicSettingsPatch(patch: Partial<BackendClinicSettings>) {
  const [settings] = await database.select<BackendClinicSettings>('settings_clinic', 'select=id');
  if (!settings) {
    const [savedSettings] = await database.insert<BackendClinicSettings>('clinic_settings', [patch]);
    return savedSettings;
  }
  const [savedSettings] = await database.update<BackendClinicSettings>('clinic_settings', `id=eq.${settings.id}`, patch);
  return savedSettings;
}

export async function saveBackendClinicSettings(clinic: ClinicSettings) {
  return updateClinicSettingsPatch({
    name: clinic.name,
    phone: clinic.phone,
    email: clinic.email,
    address: clinic.address,
    website: clinic.website,
    logo_url: clinic.logo,
  });
}

export async function saveBackendBillingSettings(billing: BillingSettings) {
  return updateClinicSettingsPatch({
    tax_rate: Number(billing.taxRate) || 0,
    currency: billing.currency,
    payment_methods: billing.methods,
  });
}

export async function saveBackendNotificationSettings(notifications: NotificationSettings) {
  return updateClinicSettingsPatch({
    notification_settings: notifications,
  });
}

export async function saveBackendSecuritySettings(security: SecuritySettings) {
  return updateClinicSettingsPatch({
    security_settings: security,
  });
}

export async function getCurrentStaffProfile() {
  const session = getStoredSupabaseSession();
  if (!session?.user?.id) return null;
  const [profile] = await database.select<BackendStaffProfile>(
    'staff_profiles',
    `select=*&id=eq.${session.user.id}&limit=1`,
  );
  return profile ?? null;
}

export async function updateBackendStaffProfile(user: UserAccount, newPassword?: string) {
  if (typeof user.id !== 'string') return null;

  const trimmedPassword = newPassword?.trim();
  if (trimmedPassword && trimmedPassword.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  if (trimmedPassword) {
    const currentProfile = await getCurrentStaffProfile();
    if (!currentProfile || currentProfile.role !== 'Admin') {
      throw new Error(
        `Password reset requires Admin role. Your account role is "${currentProfile?.role ?? 'unknown'}". In Supabase run fix_promote_admin_role.sql, then log out and sign in again.`,
      );
    }
  }

  const [savedProfile] = await database.update<BackendStaffProfile>(
    'staff_profiles',
    `id=eq.${user.id}`,
    {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      ...(trimmedPassword ? { password_changed_at: new Date().toISOString() } : {}),
    },
  );

  if (!savedProfile) {
    throw new Error(
      'Could not update this user. Your account needs Admin role in Supabase staff_profiles.',
    );
  }

  if (trimmedPassword) {
    await database.rpcValue<void>('admin_reset_staff_password', {
      target_user_id: user.id,
      new_password: trimmedPassword,
    });

    const loginWorks = await trySignInWithPassword(user.email, trimmedPassword);
    if (!loginWorks) {
      throw new Error(
        'Password was saved but login verification failed. Run the updated fix_admin_reset_staff_password.sql in Supabase SQL Editor, then set the password again.',
      );
    }
  }

  return savedProfile;
}

export async function deleteBackendStaffProfile(id: string) {
  return database.delete('staff_profiles', `id=eq.${id}`);
}

export function mapStaffProfileToUser(profile: BackendStaffProfile): UserAccount {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email.toLowerCase(),
    password: '',
    passwordChangedAt: profile.password_changed_at ?? undefined,
    role: profile.role,
    status: profile.status,
  };
}

export async function createStaffUserInBackend(input: {
  name: string;
  email: string;
  password: string;
  role: UserAccount['role'];
  status: UserAccount['status'];
}): Promise<UserAccount> {
  const email = input.email.trim().toLowerCase();
  const authUser = await signUpStaffUser(email, input.password, {
    name: input.name.trim(),
    role: input.role,
  });

  const [existing] = await database.select<BackendStaffProfile>(
    'staff_profiles',
    `select=*&id=eq.${authUser.id}&limit=1`,
  );

  if (existing) {
    const rows = await database.update<BackendStaffProfile>(
      'staff_profiles',
      `id=eq.${authUser.id}`,
      {
        name: input.name.trim(),
        email,
        role: input.role,
        status: input.status,
      },
    );
    return mapStaffProfileToUser(rows[0] ?? existing);
  }

  const rows = await database.insert<BackendStaffProfile>('staff_profiles', [{
    id: authUser.id,
    name: input.name.trim(),
    email,
    role: input.role,
    status: input.status,
    password_changed_at: new Date().toISOString(),
  }]);
  if (!rows[0]) {
    throw new Error('Could not create staff profile in Supabase.');
  }
  return mapStaffProfileToUser(rows[0]);
}

export async function upsertBackendBillPerson(person: Omit<BillPerson, 'id'> & { id?: string | number }) {
  const [savedPerson] = await database.rpc<BackendBillPersonPublic>('upsert_bill_person', {
    person_id: typeof person.id === 'string' ? person.id : null,
    person_name: person.name,
    person_password: person.password,
    person_status: person.status,
  });
  return savedPerson;
}

export async function deleteBackendBillPerson(id: string) {
  return database.delete('bill_persons', `id=eq.${id}`);
}

export async function verifyBackendBillPerson(personId: string, password: string) {
  return database.rpcValue<boolean>('verify_bill_person', {
    person_id: personId,
    person_password: password,
  });
}

export const NOTIFICATIONS_UPDATED_EVENT = 'skinspectrum_notifications_updated';
const DISMISSED_NOTIFICATIONS_KEY = 'skinspectrum_dismissed_notifications';
const DISMISSALS_BACKEND_PROBE_KEY = 'skinspectrum_dismissals_backend';

function isSupabaseMissingResource(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes('404')
    || message.includes('pgrst205')
    || message.includes('does not exist')
    || message.includes('could not find the table')
  );
}

function readLocalDismissals(): Set<string> {
  try {
    const raw = window.localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function addLocalDismissal(notificationKey: string) {
  const dismissed = readLocalDismissals();
  dismissed.add(notificationKey);
  window.localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify([...dismissed]));
}

function shouldSkipDismissalsBackendFetch(): boolean {
  return window.sessionStorage.getItem(DISMISSALS_BACKEND_PROBE_KEY) !== 'ready';
}

function markDismissalsBackendUnavailable() {
  window.sessionStorage.setItem(DISMISSALS_BACKEND_PROBE_KEY, 'unavailable');
}

function markDismissalsBackendReady() {
  window.sessionStorage.setItem(DISMISSALS_BACKEND_PROBE_KEY, 'ready');
}

function isHiddenNotification(row: BackendNotification): boolean {
  if (row.category === 'System') return true;
  const title = row.title.trim().toLowerCase();
  const message = row.message.trim().toLowerCase();
  return title === 'system ready' || message.includes('backend schema has been initialized');
}

async function fetchDismissedNotificationKeys(): Promise<Set<string>> {
  const merged = readLocalDismissals();
  if (shouldSkipDismissalsBackendFetch()) {
    return merged;
  }

  try {
    const rows = await database.select<{ notification_key: string }>(
      'notification_dismissals',
      'select=notification_key',
    );
    markDismissalsBackendReady();
    rows.forEach((row) => merged.add(row.notification_key));
    return merged;
  } catch (error) {
    if (isSupabaseMissingResource(error)) {
      markDismissalsBackendUnavailable();
    }
    return merged;
  }
}

export function resetDismissalsBackendProbe() {
  window.sessionStorage.removeItem(DISMISSALS_BACKEND_PROBE_KEY);
}

export function notifyNotificationsUpdated() {
  window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
}

export async function fetchNotificationsData(): Promise<BackendNotification[]> {
  if (!hasActiveSupabaseSession()) return [];

  const [centerResult, dismissed] = await Promise.all([
    database.select<BackendNotification>('notifications_center', 'select=*'),
    fetchDismissedNotificationKeys(),
  ]);

  return centerResult
    .filter((row) => !isHiddenNotification(row))
    .map((row) => ({
      ...row,
      status: row.status === 'Read' || dismissed.has(row.id) ? 'Read' : 'Unread',
    }));
}

export async function fetchNotifications() {
  return fetchNotificationsData();
}

export async function fetchUnreadNotificationCount() {
  try {
    const rows = await fetchNotificationsData();
    return rows.filter((row) => row.status === 'Unread').length;
  } catch {
    return 0;
  }
}

export async function markBackendNotificationRead(id: string) {
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const [savedNotification] = await database.update<BackendNotification>(
      'notifications',
      `id=eq.${id}`,
      { status: 'Read' },
    );
    notifyNotificationsUpdated();
    return savedNotification;
  }

  const probe = window.sessionStorage.getItem(DISMISSALS_BACKEND_PROBE_KEY);
  if (probe !== 'unavailable') {
    try {
      await database.rpcValue<void>('dismiss_notification', { notification_key: id });
      markDismissalsBackendReady();
      notifyNotificationsUpdated();
      return null;
    } catch (error) {
      if (isSupabaseMissingResource(error)) {
        markDismissalsBackendUnavailable();
      } else {
        throw error;
      }
    }
  }

  addLocalDismissal(id);
  notifyNotificationsUpdated();
  return null;
}

export async function saveInvoiceToBackend(invoice: Invoice) {
  const [savedInvoice] = await database.insert<BackendInvoice>('invoices', [{
    id: invoice.id,
    client_id: invoice.clientId ?? null,
    client_name: invoice.client,
    invoice_date: invoice.date,
    due_date: invoice.dueDate,
    amount: invoice.amount,
    status: invoice.status,
    credit_amount: invoice.creditAmount ?? null,
    paid_amount: invoice.paidAmount ?? null,
    payment_method: invoice.paymentMethod ?? null,
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    tax: invoice.tax,
    total: invoice.total,
  }]);

  await database.insert<BackendInvoiceItem>('invoice_items', invoice.items.map((item) => ({
    invoice_id: invoice.id,
    product_id: item.productId ?? null,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  })));

  return savedInvoice;
}

export async function decreaseBackendProductStock(productId: string, quantity: number) {
  const [product] = await database.select<BackendProduct>(
    'products',
    `select=id,stock,unit&id=eq.${productId}&limit=1`,
  );

  if (!product || product.unit === 'Service') return null;

  const nextStock = Math.max(0, product.stock - quantity);
  const [savedProduct] = await database.update<BackendProduct>(
    'products',
    `id=eq.${productId}`,
    { stock: nextStock },
  );
  return savedProduct;
}

export async function updateBackendClientAfterSale(clientId: string, total: number) {
  const [client] = await database.select<BackendClient>(
    'clients',
    `select=id,total_spent&id=eq.${clientId}&limit=1`,
  );

  if (!client) return null;

  const [savedClient] = await database.update<BackendClient>(
    'clients',
    `id=eq.${clientId}`,
    {
      total_spent: Number(client.total_spent || 0) + total,
      last_visit: new Date().toISOString().slice(0, 10),
    },
  );
  return savedClient;
}
