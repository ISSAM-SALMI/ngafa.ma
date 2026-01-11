import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Scissors, 
  Shirt, 
  Package, 
  LogOut, 
  Menu,
  X,
  Users
} from 'lucide-react';
import { UserRole } from '../types';

export const Layout = ({ children, currentView, onViewChange }: { 
  children?: React.ReactNode, 
  currentView: string,
  onViewChange: (view: string) => void
}) => {
  const { user, logout } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const NavItem = ({ view, icon: Icon, label }: { view: string, icon: any, label: string }) => (
    <button
      onClick={() => { onViewChange(view); setMobileMenuOpen(false); }}
      className={`w-full flex items-center space-x-3 space-x-reverse px-4 py-3 rounded-lg transition-colors ${
        currentView === view 
          ? 'bg-slate-800 text-white shadow-lg' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <Icon size={20} className="ml-3" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white h-full">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-indigo-500 to-amber-500 bg-clip-text text-transparent">
            نوبتشيا ERP
          </h1>
          <p className="text-xs text-slate-500 mt-1">نظام إدارة متعدد الأنشطة</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="لوحة التحكم" />
          
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-600 uppercase">الوحدات</div>
          <NavItem view="SALON" icon={Scissors} label="صالون الحلاقة" />
          <NavItem view="DRESSES" icon={Shirt} label="تأجير الفساتين" />
          <NavItem view="NGAFA" icon={Package} label="نكافة ومناسبات" />

          {/* Admin Only Section */}
          {user?.role === UserRole.ADMIN && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-600 uppercase">الإدارة</div>
              <NavItem view="USERS" icon={Users} label="المستخدمين" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="mr-3 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role === UserRole.ADMIN ? 'مدير' : 'موظف'}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 space-x-reverse bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm transition-colors"
          >
            <LogOut size={16} className="ml-2" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white h-16 border-b border-slate-100 flex items-center justify-between px-4">
          <h1 className="text-lg font-bold text-slate-800">نوبتشيا ERP</h1>
          <button onClick={() => setMobileMenuOpen(true)} className="text-slate-600">
            <Menu size={24} />
          </button>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900 text-white flex flex-col">
             <div className="flex justify-end p-4">
               <button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
             </div>
             <nav className="p-4 space-y-4">
               <NavItem view="DASHBOARD" icon={LayoutDashboard} label="لوحة التحكم" />
               <NavItem view="SALON" icon={Scissors} label="صالون الحلاقة" />
               <NavItem view="DRESSES" icon={Shirt} label="تأجير الفساتين" />
               <NavItem view="NGAFA" icon={Package} label="نكافة ومناسبات" />
               
               {user?.role === UserRole.ADMIN && (
                 <NavItem view="USERS" icon={Users} label="المستخدمين" />
               )}

               <button onClick={logout} className="w-full text-right flex items-center space-x-3 space-x-reverse px-4 py-3 text-red-400">
                 <LogOut size={20} className="ml-3" /> <span>تسجيل الخروج</span>
               </button>
             </nav>
          </div>
        )}

        {/* Content Body */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};