import { database, isSupabaseConfigured } from './supabase';
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

export async function fetchClients() {
  return database.select<BackendClient>('clients', 'select=*&order=created_at.desc');
}

export async function fetchClientPageClients() {
  return database.select<BackendClient>('clients_page_list', 'select=*');
}

export async function createBackendClient(client: BackendClientInput) {
  const [savedClient] = await database.insert<BackendClient>('clients', [client]);
  return savedClient;
}

export async function updateBackendClient(id: string, client: Partial<BackendClientInput>) {
  const [savedClient] = await database.update<BackendClient>('clients', `id=eq.${id}`, client);
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
  const session = await database.signInWithPassword(email, password);
  const [profile] = await database.select<BackendStaffProfile>(
    'staff_profiles',
    `select=*&id=eq.${session.user.id}&limit=1`,
  );

  if (!profile || profile.status !== 'Active') {
    await database.signOut();
    return null;
  }

  return {
    session,
    profile,
  };
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
  const [
    summaryRows,
    today,
    week,
    month,
    custom,
    categorySales,
    clientGrowth,
    paymentMethods,
    topProducts,
    topClients,
  ] = await Promise.all([
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

  return {
    summary: summaryRows[0] ?? null,
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
  };
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
    security: row.security_settings,
  };
}

export async function fetchSettingsData() {
  const [clinicRows, staffRows, billPersonRows] = await Promise.all([
    database.select<BackendClinicSettings>('settings_clinic', 'select=*'),
    database.select<BackendStaffProfile>('settings_staff_profiles', 'select=*'),
    database.select<BackendBillPersonPublic>('settings_bill_persons', 'select=*'),
  ]);

  return {
    clinicSettings: clinicRows[0] ?? null,
    staffProfiles: staffRows,
    billPersons: billPersonRows,
  };
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

export async function updateBackendStaffProfile(user: UserAccount) {
  if (typeof user.id !== 'string') return null;
  const [savedProfile] = await database.update<BackendStaffProfile>(
    'staff_profiles',
    `id=eq.${user.id}`,
    {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  );
  return savedProfile;
}

export async function deleteBackendStaffProfile(id: string) {
  return database.delete('staff_profiles', `id=eq.${id}`);
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

export async function fetchNotifications() {
  return database.select<BackendNotification>('notifications_center', 'select=*');
}

export async function markBackendNotificationRead(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [savedNotification] = await database.update<BackendNotification>(
    'notifications',
    `id=eq.${id}`,
    { status: 'Read' },
  );
  return savedNotification;
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
