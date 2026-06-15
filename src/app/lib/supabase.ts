type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
  };
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_SESSION_KEY = 'skinspectrum_supabase_session';

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export function getStoredSupabaseSession(): SupabaseSession | null {
  try {
    const raw = window.localStorage.getItem(SUPABASE_SESSION_KEY);
    return raw ? (JSON.parse(raw) as SupabaseSession) : null;
  } catch {
    return null;
  }
}

export function storeSupabaseSession(session: SupabaseSession | null) {
  if (!session) {
    window.localStorage.removeItem(SUPABASE_SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
}

function assertSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.');
  }
}

async function supabaseRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  assertSupabaseConfig();

  const token = options.token ?? getStoredSupabaseSession()?.access_token ?? SUPABASE_ANON_KEY!;
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function signInWithPassword(email: string, password: string) {
  const session = await supabaseRequest<SupabaseSession>('/auth/v1/token?grant_type=password', {
    method: 'POST',
    token: SUPABASE_ANON_KEY,
    body: { email, password },
  });
  storeSupabaseSession(session);
  return session;
}

export async function sendPasswordResetEmail(email: string, redirectTo: string) {
  assertSupabaseConfig();

  const response = await fetch(`${SUPABASE_URL}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${SUPABASE_ANON_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, redirect_to: redirectTo }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Password reset request failed: ${response.status}`);
  }

  if (response.status === 204) return;
  await response.json().catch(() => undefined);
}

export async function updateSupabasePassword(accessToken: string, password: string) {
  return supabaseRequest('/auth/v1/user', {
    method: 'PUT',
    token: accessToken,
    body: { password },
  });
}

export async function signOutSupabase() {
  const token = getStoredSupabaseSession()?.access_token;
  if (token) {
    await supabaseRequest('/auth/v1/logout', { method: 'POST', token });
  }
  storeSupabaseSession(null);
}

export async function selectRows<T>(table: string, query = 'select=*') {
  return supabaseRequest<T[]>(`/rest/v1/${table}?${query}`);
}

export async function insertRows<T>(table: string, rows: unknown[]) {
  return supabaseRequest<T[]>(`/rest/v1/${table}`, {
    method: 'POST',
    body: rows,
  });
}

export async function updateRows<T>(table: string, filter: string, patch: unknown) {
  return supabaseRequest<T[]>(`/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    body: patch,
  });
}

export async function deleteRows(table: string, filter: string) {
  return supabaseRequest<void>(`/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
  });
}

export async function rpcRows<T>(functionName: string, body: unknown) {
  return supabaseRequest<T[]>(`/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    body,
  });
}

export async function rpcValue<T>(functionName: string, body: unknown) {
  return supabaseRequest<T>(`/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    body,
  });
}

export type DatabaseClient = {
  signInWithPassword: typeof signInWithPassword;
  sendPasswordResetEmail: typeof sendPasswordResetEmail;
  updatePassword: typeof updateSupabasePassword;
  signOut: typeof signOutSupabase;
  select: typeof selectRows;
  insert: typeof insertRows;
  update: typeof updateRows;
  delete: typeof deleteRows;
  rpc: typeof rpcRows;
  rpcValue: typeof rpcValue;
};

export const database: DatabaseClient = {
  signInWithPassword,
  sendPasswordResetEmail,
  updatePassword: updateSupabasePassword,
  signOut: signOutSupabase,
  select: selectRows,
  insert: insertRows,
  update: updateRows,
  delete: deleteRows,
  rpc: rpcRows,
  rpcValue,
};
