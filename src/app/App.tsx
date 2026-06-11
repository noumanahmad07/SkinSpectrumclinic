import { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import Login from './components/Login';
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
  getSessionTimeoutMinutes,
  isPasswordChangeRequired,
  loadSettings,
  SETTINGS_UPDATED_EVENT,
} from './lib/settings';

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
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

function useSessionTimeout(isLoggedIn: boolean, logout: () => void) {
  useEffect(() => {
    if (!isLoggedIn) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      const minutes = getSessionTimeoutMinutes(loadSettings().security);
      timeoutId = setTimeout(() => {
        logout();
      }, minutes * 60 * 1000);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    window.addEventListener(SETTINGS_UPDATED_EVENT, resetTimer);
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      window.removeEventListener(SETTINGS_UPDATED_EVENT, resetTimer);
    };
  }, [isLoggedIn, logout]);
}

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
    setUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  useSessionTimeout(Boolean(user), logout);

  const login = (email: string, password: string) => {
    const account = authenticateUser(email, password);
    if (!account) return false;

    const authenticatedUser: AuthUser = {
      name: account.name,
      email: account.email,
      role: account.role,
      mustChangePassword: isPasswordChangeRequired(account.email),
    };

    setUser(authenticatedUser);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
    return true;
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
