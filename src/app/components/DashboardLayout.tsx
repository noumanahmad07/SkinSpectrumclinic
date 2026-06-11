import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Receipt,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../App';
import ssaLogo from '../../assets/ssa-logo.png';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  section: string;
}

const navigation: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} strokeWidth={1.75} />, section: 'Main' },
  { label: 'Clients', path: '/clients', icon: <Users size={18} strokeWidth={1.75} />, section: 'Main' },
  { label: 'POS', path: '/pos', icon: <ShoppingCart size={18} strokeWidth={1.75} />, section: 'Main' },
  { label: 'Billing', path: '/billing', icon: <Receipt size={18} strokeWidth={1.75} />, section: 'Finance' },
  { label: 'Inventory', path: '/inventory', icon: <Package size={18} strokeWidth={1.75} />, section: 'System' },
  { label: 'Reports', path: '/reports', icon: <BarChart3 size={18} strokeWidth={1.75} />, section: 'System' },
  { label: 'Settings', path: '/settings', icon: <Settings size={18} strokeWidth={1.75} />, section: 'System' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const groupedNav = navigation.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const currentPage = location.pathname === '/notifications'
    ? 'Notifications'
    : navigation.find((n) => n.path === location.pathname)?.label || 'Dashboard';

  if (user?.mustChangePassword && location.pathname !== '/settings') {
    return <Navigate to="/settings?tab=security" replace />;
  }

  const SidebarContent = ({ onNavClick, forceExpanded = false }: { onNavClick?: () => void; forceExpanded?: boolean }) => {
    const isCollapsed = collapsed && !forceExpanded;

    return (
      <>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-5">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/10">
                <img src={ssaLogo} alt="Skin Spectrum Aesthetics" className="h-full w-full object-cover" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)' }} className="text-[15px] font-semibold leading-tight text-[#E8C98A]">
                  SkinSpectrum
                </div>
                <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#F5ECD7]/45">
                  Esthetics Studio
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-black/40 ring-1 ring-white/10">
              <img src={ssaLogo} alt="Skin Spectrum Aesthetics" className="h-full w-full object-cover" />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto scroll-area px-3 py-5">
          {Object.entries(groupedNav).map(([section, items]) => (
            <div key={section} className="mb-5">
              {!isCollapsed && (
                <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F5ECD7]/35">
                  {section}
                </div>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onNavClick}
                      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                        isActive
                          ? 'bg-white/[0.08] font-medium text-[#E8C98A]'
                          : 'text-[#F5ECD7]/65 hover:bg-white/[0.04] hover:text-[#F5ECD7]'
                      }`}
                      title={isCollapsed ? item.label : undefined}>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#C9A96E]" />
                      )}
                      <span className={isActive ? 'text-[#E8C98A]' : 'text-[#F5ECD7]/50'}>{item.icon}</span>
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] p-4">
          {!isCollapsed ? (
            <div className="mb-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#C9A96E] text-xs font-semibold text-[#1A1025]">
                  {user?.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-[#F5ECD7]">{user?.name}</div>
                  <div className="truncate text-[11px] text-[#F5ECD7]/50">{user?.role}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#C9A96E] text-xs font-semibold text-[#1A1025]">
              {user?.name.charAt(0)}
            </div>
          )}
          <button
            onClick={logout}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-[#F5ECD7]/70 transition-colors hover:bg-white/[0.06] hover:text-[#F5ECD7] ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : undefined}>
            <LogOut size={16} strokeWidth={1.75} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#1A1025] text-[#F5ECD7] transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 rounded-lg p-2 text-[#F5ECD7]/70 transition-colors hover:bg-white/[0.06] hover:text-[#F5ECD7]">
          <X size={18} />
        </button>
        <SidebarContent forceExpanded onNavClick={() => setMobileOpen(false)} />
      </aside>

      <aside
        className={`relative hidden flex-col bg-[#1A1025] text-[#F5ECD7] transition-all duration-300 lg:flex ${
          collapsed ? 'w-[72px]' : 'w-[260px]'
        }`}>
        <SidebarContent />

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[88px] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#EDE8E3]/20 bg-[#2D1F3D] text-[#E8C98A] shadow-md transition-transform hover:scale-105">
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-border bg-card/80 px-4 py-3 backdrop-blur-md md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 transition-colors hover:bg-muted lg:hidden">
                <Menu size={20} className="text-foreground" />
              </button>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  Skin Spectrum
                </p>
                <h1
                  style={{ fontFamily: 'var(--font-heading)' }}
                  className="text-xl font-semibold leading-tight text-foreground md:text-[22px]">
                  {currentPage}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} strokeWidth={1.75} />
                <input
                  type="text"
                  placeholder="Search clients, invoices, products…"
                  className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 lg:w-80"
                />
              </div>

              <Link
                to="/notifications"
                title="Notifications"
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  location.pathname === '/notifications' ? 'bg-secondary text-primary' : 'hover:bg-muted'
                }`}>
                <Bell size={18} strokeWidth={1.75} className="text-muted-foreground" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-card" />
              </Link>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {user?.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="scroll-area flex-1 overflow-auto p-4 md:p-6 lg:p-7 pb-20 lg:pb-7">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.06] bg-[#1A1025] lg:hidden">
          <div className="flex items-center justify-around px-1 py-1.5">
            {[
              { label: 'Home', path: '/', icon: <LayoutDashboard size={20} strokeWidth={1.75} /> },
              { label: 'POS', path: '/pos', icon: <ShoppingCart size={20} strokeWidth={1.75} /> },
              { label: 'Clients', path: '/clients', icon: <Users size={20} strokeWidth={1.75} /> },
              { label: 'Billing', path: '/billing', icon: <Receipt size={20} strokeWidth={1.75} /> },
              { label: 'More', path: null, icon: <Menu size={20} strokeWidth={1.75} />, isMenu: true },
            ].map((item) => {
              const isActive = item.path && location.pathname === item.path;
              if (item.isMenu) {
                return (
                  <button
                    key="more"
                    onClick={() => setMobileOpen(true)}
                    className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[#F5ECD7]/50 transition-colors hover:text-[#C9A96E]">
                    {item.icon}
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={item.path}
                  to={item.path!}
                  className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 transition-colors ${
                    isActive ? 'text-[#C9A96E]' : 'text-[#F5ECD7]/50 hover:text-[#C9A96E]'
                  }`}>
                  {item.icon}
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
