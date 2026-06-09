import { useState, createContext, useContext } from 'react';
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

// Auth Context
interface AuthContextType {
  user: { name: string; email: string; role: string } | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AUTH_STORAGE_KEY = 'skinspectrum_user';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default function App() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    const savedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (email: string, password: string) => {
    // Mock authentication - accepts any staff@skinspectrum.com email
    if (email.includes('@skinspectrum.com') && password.length > 0) {
      const authenticatedUser = {
        name: 'Staff Member',
        email: email,
        role: 'Admin'
      };

      setUser(authenticatedUser);
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {/* MARKER-MAKE-KIT-INVOKED */}
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
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
