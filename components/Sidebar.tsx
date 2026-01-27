
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Bot, 
  Target, 
  CreditCard,
  Home,
  Sparkles,
  Rocket,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const navItems = [
    { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/projects', label: 'Dự án', icon: Building2 },
    { to: '/cdp', label: 'Dữ liệu Khách hàng', icon: Users },
    { to: '/ai-agents', label: 'Nhân viên AI', icon: Bot },
    { to: '/deployment', label: 'Triển khai dự án', icon: Rocket },
    { to: '/ai-prospects', label: 'Khách hàng tiềm năng', icon: Sparkles },
    { to: '/leads', label: 'Leads & Bán hàng', icon: Target },
    { to: '/billing', label: 'Hạ tầng & Chi phí', icon: CreditCard },
  ];

  const handleLogoutClick = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
      // Chỉ cần gọi onLogout, App.tsx sẽ thấy isAuthenticated = false 
      // và tự động render bộ Route của Login
      onLogout();
    }
  };

  return (
    <aside className="w-64 bg-indigo-900 text-white flex flex-col h-full shadow-xl">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white p-2 rounded-lg shadow-lg">
          <Home className="text-indigo-900 w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Sales AI Agent</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-700 text-white shadow-md translate-x-1 border-l-4 border-indigo-400' 
                  : 'text-indigo-100 hover:bg-indigo-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <button 
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-500/10 rounded-lg transition-all font-bold uppercase text-[10px] tracking-widest group"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          Đăng xuất
        </button>
      </div>

      <div className="p-6">
        <div className="bg-indigo-800 rounded-lg p-4">
          <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-2 text-[9px]">Hạ tầng bảo mật</p>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
            <span className="text-[11px] font-bold opacity-80">Google Cloud</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
