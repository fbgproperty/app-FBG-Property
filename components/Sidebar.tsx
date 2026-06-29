
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { canAccess, ROLE_LABELS, isAdminRole } from '../services/permissions';
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
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkle,
  MapPin,
  Briefcase,
  List,
  Star,
  ShieldCheck,
  UserCog,
  Lock,
  User,
  Megaphone
} from 'lucide-react';

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Trạng thái mở/đóng của menu con
  const [isProjectsOpen, setIsProjectsOpen] = useState(location.pathname.startsWith('/bat-dong-san'));
  const [isIdentityOpen, setIsIdentityOpen] = useState(location.pathname.startsWith('/identity'));

  useEffect(() => {
    if (location.pathname.startsWith('/bat-dong-san')) setIsProjectsOpen(true);
    if (location.pathname.startsWith('/identity')) setIsIdentityOpen(true);
  }, [location.pathname]);

  const realEstateSubMenus = [
    { id: 'nha-can-ho', label: 'Nhà - Căn hộ', icon: Home },
    { id: 'du-an-bds', label: 'Dự án', icon: Layers },
    { id: 'tien-ich', label: 'Tiện ích', icon: Sparkle },
    { id: 'co-so', label: 'Cơ sở', icon: MapPin },
    { id: 'nha-dau-tu', label: 'Nhà đầu tư', icon: Briefcase },
    { id: 'danh-muc', label: 'Danh mục', icon: List },
    { id: 'danh-gia', label: 'Đánh giá', icon: Star },
  ];

  const identitySubMenus = [
    { id: 'tai-khoan', label: 'Người dùng', icon: UserCog },
    { id: 'vai-tro', label: 'Vai trò', icon: Lock },
  ];

  const navItems = [
    { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { to: '/tro-ly-ai', label: 'Trợ lý AI', icon: Sparkles },
    { to: '/bat-dong-san', label: 'Bất động sản', icon: Building2, hasSub: true, subState: isProjectsOpen, setSub: setIsProjectsOpen, subItems: realEstateSubMenus, prefix: '/bat-dong-san' },
    { to: '/sale-projects', label: 'Dự án triển khai', icon: Rocket },
    { to: '/my-customers', label: 'Khách của tôi', icon: Target },
    { to: '/cdp', label: 'Danh sách khách hàng', icon: Users },
    { to: '/team', label: 'Đội ngũ AI & Tổ chức', icon: Bot },
    { to: '/deployment', label: 'Triển khai dự án', icon: Rocket },
    { to: '/marketing', label: 'Marketing', icon: Megaphone },
    { to: '/billing', label: 'Hạ tầng & Chi phí', icon: CreditCard },
    { to: '/identity', label: 'Quản trị hệ thống', icon: ShieldCheck, hasSub: true, subState: isIdentityOpen, setSub: setIsIdentityOpen, subItems: identitySubMenus, prefix: '/identity' },
  ];

  const myRole = (typeof localStorage !== 'undefined' && localStorage.getItem('fbg_role')) || 'ctv';
  const isAdmin = ['ceo', 'gd_du_an', 'admin_du_an'].includes(myRole);
  const fbUser: { email?: string; name?: string; photo?: string } = (() => {
    try { return JSON.parse(localStorage.getItem('fbg_user') || '{}'); } catch { return {}; }
  })();
  // Phân quyền theo vai trò (role) — chỉ hiện route được phép
  // Ẩn 2 mục dành riêng cho sale ("Dự án triển khai", "Khách của tôi") với tài khoản admin
  const SALE_ONLY = ['/sale-projects', '/my-customers'];
  const visibleByLevel = (item: any) => {
    if (SALE_ONLY.includes(item.to) && isAdminRole(myRole)) return false;
    return canAccess(item.to, myRole);
  };

  const handleLogoutClick = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
      onLogout();
    }
  };

  return (
    <aside className={`bg-indigo-900 text-white flex flex-col h-full shadow-xl transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-10 bg-indigo-700 text-white p-1 rounded-full border border-indigo-800 hover:bg-indigo-600 transition-colors z-20 shadow-lg">
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className={`p-6 flex items-center gap-3 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="bg-white p-2 rounded-lg shadow-lg shrink-0">
          <ShieldCheck className="text-indigo-900 w-6 h-6" />
        </div>
        {!isCollapsed && <h1 className="text-xl font-bold tracking-tight animate-fadeIn whitespace-nowrap">AI Agent</h1>}
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
        {navItems.filter(visibleByLevel).map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          
          if (item.hasSub) {
            return (
              <React.Fragment key={item.to}>
                <button
                  onClick={() => !isCollapsed && item.setSub!(!item.subState)}
                  className={`flex items-center gap-3 transition-all duration-200 group rounded-lg w-full outline-none ${isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-100 hover:bg-indigo-800/80 hover:text-white'}`}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white'}`} />
                  {!isCollapsed && (
                    <div className="flex items-center justify-between flex-1 overflow-hidden">
                      <span className="font-medium text-sm">{item.label}</span>
                      <ChevronDown size={14} className={`transition-transform duration-300 ${item.subState ? 'rotate-180' : ''}`} />
                    </div>
                  )}
                </button>

                {!isCollapsed && item.subState && (
                  <div className="mt-1 space-y-1 animate-fadeIn overflow-hidden pl-4">
                    {item.subItems!.map((sub) => {
                      const subPath = `${item.prefix}/${sub.id}`;
                      const isSubActive = location.pathname === subPath;
                      return (
                        <NavLink key={sub.id} to={subPath} className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-all ${isSubActive ? 'bg-indigo-700/60 text-white' : 'text-indigo-300 hover:text-white hover:bg-indigo-800/50'}`}>
                          <sub.icon size={16} className={`shrink-0 ${isSubActive ? 'text-white' : 'text-indigo-400'}`} />
                          <span className="whitespace-nowrap">{sub.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          }

          return (
            <NavLink key={item.to} to={item.to} className={`flex items-center gap-3 transition-all duration-200 group rounded-lg w-full ${isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'} ${location.pathname === item.to ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-100 hover:bg-indigo-800/80 hover:text-white'}`}>
              <item.icon className={`w-5 h-5 shrink-0 ${location.pathname === item.to ? 'text-white' : 'text-indigo-300 group-hover:text-white'}`} />
              {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-indigo-800 bg-indigo-950/30 space-y-4">
        {/* Thông tin tài khoản người dùng */}
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'px-2'}`}>
           <div className="w-10 h-10 rounded-xl bg-indigo-700 border border-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg relative group overflow-hidden">
              {fbUser.photo ? <img src={fbUser.photo} alt="" className="w-full h-full object-cover" /> : (fbUser.name || 'U').slice(0, 2).toUpperCase()}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-indigo-900 rounded-full"></div>
           </div>
           {!isCollapsed && (
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-bold text-white truncate leading-tight">{fbUser.name || fbUser.email || 'Người dùng'}</p>
               <p className="text-[10px] text-indigo-300 font-medium uppercase tracking-wider mt-0.5">
                 {ROLE_LABELS[myRole] || 'Sale cộng tác viên'}
               </p>
             </div>
           )}
        </div>

        {/* Nút Đăng xuất */}
        <button 
          onClick={handleLogoutClick} 
          className={`w-full flex items-center gap-3 text-red-300 hover:bg-red-500/10 rounded-lg transition-all font-bold uppercase text-[10px] tracking-widest group ${isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'}`}
          title={isCollapsed ? "Đăng xuất" : ""}
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          {!isCollapsed && <span>Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;


// import React, { useState, useEffect } from 'react';
// import { NavLink, useLocation, useNavigate } from 'react-router-dom';
// import { 
//   LayoutDashboard, 
//   Building2, 
//   Users, 
//   Bot, 
//   Target, 
//   CreditCard,
//   Home,
//   Sparkles,
//   Rocket,
//   LogOut,
//   ChevronLeft,
//   ChevronRight,
//   ChevronDown,
//   Layers,
//   Sparkle,
//   MapPin,
//   Briefcase,
//   List,
//   Star
// } from 'lucide-react';

// interface SidebarProps {
//   onLogout: () => void;
// }

// const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [isCollapsed, setIsCollapsed] = useState(false);
  
//   // Trạng thái mở/đóng của menu con Bất động sản
//   const [isProjectsOpen, setIsProjectsOpen] = useState(location.pathname.startsWith('/bat-dong-san'));

//   // Cập nhật isProjectsOpen nếu chuyển hướng từ bên ngoài vào một trang dự án
//   useEffect(() => {
//     if (location.pathname.startsWith('/bat-dong-san')) {
//       setIsProjectsOpen(true);
//     }
//   }, [location.pathname]);

//   const realEstateSubMenus = [
//     { id: 'nha-can-ho', label: 'Nhà - Căn hộ', icon: Home },
//     { to: 'du-an-bds', id: 'du-an-bds', label: 'Dự án', icon: Layers },
//     { id: 'tien-ich', label: 'Tiện ích', icon: Sparkle },
//     { id: 'co-so', label: 'Cơ sở', icon: MapPin },
//     { id: 'nha-dau-tu', label: 'Nhà đầu tư', icon: Briefcase },
//     { id: 'danh-muc', label: 'Danh mục', icon: List },
//     { id: 'danh-gia', label: 'Đánh giá', icon: Star },
//   ];

//   const navItems = [
//     { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
//     { to: '/bat-dong-san', label: 'Bất động sản', icon: Building2, hasSub: true },
//     { to: '/cdp', label: 'Danh sách khách hàng', icon: Users },
//     { to: '/ai-agents', label: 'Nhân viên AI', icon: Bot },
//     { to: '/deployment', label: 'Triển khai dự án', icon: Rocket },
//     { to: '/ai-prospects', label: 'Khách hàng tiềm năng', icon: Sparkles },
//     { to: '/leads', label: 'Leads & Bán hàng', icon: Target },
//     { to: '/billing', label: 'Hạ tầng & Chi phí', icon: CreditCard },
//   ];

//   const handleLogoutClick = () => {
//     if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
//       onLogout();
//     }
//   };

//   const isCurrentPathActive = (path: string) => {
//     if (path === '/bat-dong-san') {
//       return location.pathname.startsWith('/bat-dong-san');
//     }
//     return location.pathname === path;
//   };

//   return (
//     <aside 
//       className={`bg-indigo-900 text-white flex flex-col h-full shadow-xl transition-all duration-300 relative ${
//         isCollapsed ? 'w-20' : 'w-64'
//       }`}
//     >
//       {/* Nút thu gọn Sidebar */}
//       <button 
//         onClick={() => setIsCollapsed(!isCollapsed)}
//         className="absolute -right-3 top-10 bg-indigo-700 text-white p-1 rounded-full border border-indigo-800 hover:bg-indigo-600 transition-colors z-20 shadow-lg"
//       >
//         {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
//       </button>

//       {/* Brand Header */}
//       <div className={`p-6 flex items-center gap-3 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
//         <div className="bg-white p-2 rounded-lg shadow-lg shrink-0">
//           <Home className="text-indigo-900 w-6 h-6" />
//         </div>
//         {!isCollapsed && (
//           <h1 className="text-xl font-bold tracking-tight animate-fadeIn whitespace-nowrap">RAI Agent</h1>
//         )}
//       </div>
      
//       {/* Navigation Menu */}
//       <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar overflow-x-hidden">
//         {navItems.map((item) => {
//           const isActive = isCurrentPathActive(item.to);
          
//           if (item.hasSub) {
//             return (
//               <React.Fragment key={item.to}>
//                 <button
//                   onClick={() => !isCollapsed && setIsProjectsOpen(!isProjectsOpen)}
//                   title={isCollapsed ? item.label : undefined}
//                   className={`flex items-center gap-3 transition-all duration-200 group rounded-lg w-full outline-none ${
//                     isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
//                   } ${
//                     isActive
//                       ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-white/10' 
//                       : 'text-indigo-100 hover:bg-indigo-800/80 hover:text-white'
//                   }`}
//                 >
//                   <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white'}`} />
//                   {!isCollapsed && (
//                     <div className="flex items-center justify-between flex-1 overflow-hidden">
//                       <span className="font-medium animate-fadeIn whitespace-nowrap text-sm">
//                         {item.label}
//                       </span>
//                       <ChevronDown 
//                         size={14} 
//                         className={`transition-transform duration-300 ${isProjectsOpen ? 'rotate-180' : ''}`} 
//                       />
//                     </div>
//                   )}
//                 </button>

//                 {/* Sub-menu rendering */}
//                 {!isCollapsed && isProjectsOpen && (
//                   <div className="mt-1 space-y-1 animate-fadeIn overflow-hidden pl-4">
//                     {realEstateSubMenus.map((sub) => {
//                       const subPath = `/bat-dong-san/${sub.id}`;
//                       const isSubActive = location.pathname === subPath;
                      
//                       return (
//                         <NavLink
//                           key={sub.id}
//                           to={subPath}
//                           className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
//                             isSubActive 
//                               ? 'bg-indigo-700/60 text-white shadow-sm' 
//                               : 'text-indigo-300 hover:text-white hover:bg-indigo-800/50'
//                           }`}
//                         >
//                           <sub.icon size={16} className={`shrink-0 ${isSubActive ? 'text-white' : 'text-indigo-400'}`} />
//                           <span className="whitespace-nowrap">{sub.label}</span>
//                         </NavLink>
//                       );
//                     })}
//                   </div>
//                 )}
//               </React.Fragment>
//             );
//           }

//           return (
//             <NavLink
//               key={item.to}
//               to={item.to}
//               title={isCollapsed ? item.label : undefined}
//               className={`flex items-center gap-3 transition-all duration-200 group rounded-lg w-full ${
//                 isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
//               } ${
//                 isActive
//                   ? 'bg-indigo-600 text-white shadow-lg ring-1 ring-white/10' 
//                   : 'text-indigo-100 hover:bg-indigo-800/80 hover:text-white'
//               }`}
//             >
//               <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white'}`} />
//               {!isCollapsed && (
//                 <span className="font-medium animate-fadeIn whitespace-nowrap text-sm">
//                   {item.label}
//                 </span>
//               )}
//             </NavLink>
//           );
//         })}
//       </nav>

//       {/* Logout & Infrastructure Info */}
//       <div className="p-4 border-t border-indigo-800 bg-indigo-950/30">
//         <button 
//           onClick={handleLogoutClick}
//           title={isCollapsed ? "Đăng xuất" : undefined}
//           className={`w-full flex items-center gap-3 text-red-300 hover:bg-red-500/10 rounded-lg transition-all font-bold uppercase text-[10px] tracking-widest group ${
//             isCollapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
//           }`}
//         >
//           <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
//           {!isCollapsed && <span className="animate-fadeIn">Đăng xuất</span>}
//         </button>

//         {!isCollapsed && (
//           <div className="mt-4 p-4 bg-indigo-800/40 rounded-lg border border-indigo-700/30 animate-fadeIn">
//             <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2 text-[9px]">Hạ tầng bảo mật</p>
//             <div className="flex items-center gap-2">
//               <div className="flex gap-1">
//                 <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
//                 <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
//                 <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
//               </div>
//               <span className="text-[10px] font-bold opacity-80 whitespace-nowrap">Google Cloud Platform</span>
//             </div>
//           </div>
//         )}
//       </div>
//     </aside>
//   );
// };

// export default Sidebar;
