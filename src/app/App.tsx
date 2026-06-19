import { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Clients from './components/Clients';
import Billing from './components/Billing';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Notifications from './components/Notifications';
import {
  authenticateUser,
  isPasswordChangeRequired,
  loadSettings,
  patchSettings,
} from './lib/settings';
import { canUseBackend, fetchSettingsData, mapBackendSettings, mapStaffProfileToUser, parseSupabaseError, signInStaff } from './lib/backend';
import { signOutSupabase, SUPABASE_SESSION_EXPIRED_EVENT } from './lib/supabase';

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearPasswordReminder: () => void;
}

const AUTH_STORAGE_KEY = 'skinspectrum_user';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!savedUser) return null;
    const parsed = JSON.parse(savedUser) as AuthUser;
    return {
      ...parsed,
      mustChangePassword: parsed.mustChangePassword ?? isPasswordChangeRequired(parsed.email),
    };
  });

  const logout = useCallback(() => {
    if (canUseBackend()) {
      signOutSupabase().catch(() => {});
    }
    setUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    };
    window.addEventListener(SUPABASE_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SUPABASE_SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, []);

  useEffect(() => {
    if (!user || !canUseBackend()) return;
    fetchSettingsData()
      .then(({ clinicSettings, billPersons, staffProfiles }) => {
        if (!clinicSettings) return;
        const mapped = mapBackendSettings(clinicSettings);
        patchSettings({
          clinic: mapped.clinic,
          billing: mapped.billing,
          notifications: mapped.notifications,
          security: mapped.security,
          users: staffProfiles.map(mapStaffProfileToUser),
          billPersons: billPersons.map((person) => ({
            id: person.id,
            name: person.name,
            password: loadSettings().billPersons.find((entry) => String(entry.id) === String(person.id))?.password || '',
            status: person.status,
          })),
        });
      })
      .catch(() => {});
  }, [user]);

  const login = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (canUseBackend()) {
      try {
        const result = await signInStaff(normalizedEmail, password);
        if (!result) {
          return {
            success: false,
            error: 'Invalid email or password, or this staff profile is not active in Supabase.',
          };
        }

        const authenticatedUser: AuthUser = {
          name: result.profile.name,
          email: result.profile.email,
          role: result.profile.role,
          mustChangePassword: false,
        };

        setUser(authenticatedUser);
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: parseSupabaseError(error),
        };
      }
    }

    const account = authenticateUser(normalizedEmail, password);
    if (!account) {
      return {
        success: false,
        error: 'Invalid email or password, or this staff profile is not active.',
      };
    }

    const authenticatedUser: AuthUser = {
      name: account.name,
      email: account.email,
      role: account.role,
      mustChangePassword: isPasswordChangeRequired(account.email),
    };

    setUser(authenticatedUser);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    return { success: true };
  };

  const clearPasswordReminder = () => {
    setUser((current) => {
      if (!current) return null;
      const next = { ...current, mustChangePassword: false };
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, clearPasswordReminder }}>
      {/* MARKER-MAKE-KIT-INVOKED */}
      <BrowserRouter>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={user ? <Navigate to={user.mustChangePassword ? '/settings?tab=security' : '/'} /> : <Login />} />
          <Route
            path="/*"
            element={
              user ? (
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pos" element={<POS />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/notifications" element={<Notifications />} />
                  </Routes>
                </DashboardLayout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
