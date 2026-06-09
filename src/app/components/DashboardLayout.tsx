import { useState } from 'react';
import { Link, useLocation } from 'react-router';
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
  Sparkles
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
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, section: 'Main' },
  { label: 'Clients', path: '/clients', icon: <Users size={20} />, section: 'Main' },
  { label: 'POS', path: '/pos', icon: <ShoppingCart size={20} />, section: 'Main' },
  { label: 'Billing', path: '/billing', icon: <Receipt size={20} />, section: 'Finance' },
  { label: 'Inventory', path: '/inventory', icon: <Package size={20} />, section: 'System' },
  { label: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, section: 'System' },
  { label: 'Settings', path: '/settings', icon: <Settings size={20} />, section: 'System' },
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

  const SidebarContent = ({ onNavClick, forceExpanded = false }: { onNavClick?: () => void; forceExpanded?: boolean }) => {
    const isCollapsed = collapsed && !forceExpanded;

    return (
    <>
      <div className="p-5 flex items-center justify-between border-b border-white/10">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden bg-black shadow-[0_14px_32px_rgba(201,169,110,0.24)]">
              <img src={ssaLogo} alt="Skin Spectrum Aesthetics" className="h-full w-full object-cover" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)' }}
                className="font-bold text-xl leading-none text-[#F2D794]">SkinSpectrum</div>
              <div className="mt-1 text-xs tracking-[0.14em] uppercase text-[#F5ECD7]/52">Esthetics Studio</div>
            </div>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto overflow-hidden bg-black">
            <img src={ssaLogo} alt="Skin Spectrum Aesthetics" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        {Object.entries(groupedNav).map(([section, items]) => (
          <div key={section} className="mb-6">
            {!isCollapsed && (
              <div className="px-3 mb-2 text-[11px] font-bold text-[#F5ECD7]/42 uppercase tracking-[0.18em]">
                {section}
              </div>
            )}
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavClick}
                    className={`relative flex items-center gap-3 px-3 py-3 rounded-lg transition-all
                      ${
                        isActive
                          ? 'bg-white/[0.09] text-[#F2D794] shadow-[inset_3px_0_0_#D1AD69]'
                          : 'text-[#F5ECD7]/72 hover:bg-white/[0.055] hover:text-[#F2D794]'
                      }`}
                    title={isCollapsed ? item.label : undefined}>
                    <span className={isActive ? 'text-[#F2D794]' : 'text-[#F5ECD7]/64'}>{item.icon}</span>
                    {!isCollapsed && <span className="font-semibold">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!isCollapsed ? (
          <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.055] p-3">
            <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#D1AD69] flex items-center justify-center text-[#1A1025] font-bold shadow-[0_10px_24px_rgba(209,173,105,0.22)]">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-[#F5ECD7] truncate">{user?.name}</div>
              <div className="text-xs text-[#F5ECD7]/60 truncate">{user?.role}</div>
            </div>
            </div>
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#D1AD69] flex items-center justify-center text-[#1A1025] font-bold mx-auto mb-3">
            {user?.name.charAt(0)}
          </div>
        )}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
            bg-white/[0.08] hover:bg-[#E5445A] text-[#F5ECD7] transition-colors
            ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Logout' : undefined}>
          <LogOut size={18} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </>
    );
  };

  return (
    <div className="flex h-screen bg-[#F5EFE6] overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 text-[#F5ECD7] flex flex-col
          transition-transform duration-300 lg:hidden
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          background: 'linear-gradient(180deg, #140A1F 0%, #21152D 58%, #160D20 100%)',
          boxShadow: '4px 0 20px rgba(26, 16, 37, 0.3)'
        }}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-[#F5ECD7] hover:bg-[#E5445A] transition-colors">
          <X size={18} />
        </button>
        <SidebarContent forceExpanded onNavClick={() => setMobileOpen(false)} />
      </aside>

      <aside
        className={`relative hidden lg:flex flex-col text-[#F5ECD7] transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-[280px]'
        }`}
        style={{
          background: 'linear-gradient(180deg, #140A1F 0%, #21152D 58%, #160D20 100%)',
          boxShadow: '8px 0 34px rgba(26, 16, 37, 0.14)'
        }}>
        <SidebarContent />

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 w-7 h-7 rounded-full bg-[#D1AD69]
            flex items-center justify-center text-[#1A1025] shadow-lg hover:scale-110 transition-transform z-10">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white/86 backdrop-blur border-b border-[#E8DFD4] px-4 md:px-8 py-4"
          style={{ boxShadow: '0 10px 32px rgba(26, 16, 37, 0.05)' }}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-[#F8F5F0] transition-colors">
                <Menu size={22} className="text-[#1A1025]" />
              </button>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#A67F3F]">
                  <Sparkles size={14} />
                  Skin Spectrum
                </div>
                <h1 style={{ fontFamily: 'var(--font-heading)' }}
                  className="text-2xl md:text-3xl font-bold leading-tight text-[#1A1025]">
                  {currentPage}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8C8390]" size={19} />
                <input
                  type="text"
                  placeholder="Search clients, invoices, products"
                  className="h-12 pl-12 pr-4 w-64 lg:w-96 xl:w-[440px] bg-[#F7F2EA] border border-[#E8DFD4] rounded-lg
                    focus:outline-none focus:ring-4 focus:ring-[#C9A96E]/18 focus:border-[#C9A96E] transition-all"
                />
              </div>

              <Link
                to="/notifications"
                title="Notifications"
                className={`relative h-11 w-11 flex items-center justify-center rounded-lg transition-colors ${
                  location.pathname === '/notifications'
                    ? 'bg-[#F7EFE1] text-[#A67F3F]'
                    : 'hover:bg-[#F8F5F0]'
                }`}>
                <Bell size={20} className="text-[#6B6570]" />
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#E5445A] rounded-full ring-2 ring-white" />
              </Link>

              <div className="w-11 h-11 rounded-full bg-[#D1AD69] flex items-center justify-center text-[#1A1025] font-bold text-sm shadow-[0_10px_24px_rgba(209,173,105,0.2)]">
                {user?.name.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          {children}
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#140A1F] border-t border-white/10 z-30"
          style={{ boxShadow: '0 -4px 20px rgba(26, 16, 37, 0.2)' }}>
          <div className="flex items-center justify-around px-2 py-2">
            {[
              { label: 'Home', path: '/', icon: <LayoutDashboard size={22} /> },
              { label: 'POS', path: '/pos', icon: <ShoppingCart size={22} /> },
              { label: 'Clients', path: '/clients', icon: <Users size={22} /> },
              { label: 'Billing', path: '/billing', icon: <Receipt size={22} /> },
              { label: 'More', path: null, icon: <Menu size={22} />, isMenu: true },
            ].map((item) => {
              const isActive = item.path && location.pathname === item.path;
              if (item.isMenu) {
                return (
                  <button
                    key="more"
                    onClick={() => setMobileOpen(true)}
                    className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all text-[#F5ECD7]/60 hover:text-[#C9A96E]">
                    {item.icon}
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={item.path}
                  to={item.path!}
                  className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                    isActive ? 'text-[#C9A96E]' : 'text-[#F5ECD7]/60 hover:text-[#C9A96E]'
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
