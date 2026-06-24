import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Projects from './views/Property/Project/Projects';
import ProjectDetail from './views/Property/Project/ProjectDetail';
import HousesApartments from './views/Property/Properties/HousesApartments';
import PropertyDetailModal from './views/Property/Properties/PropertyDetailModal';
import CDP from './views/CDP';
import AIProspects from './views/AIProspects';
import AIAgents from './views/AIAgents';
import Leads from './views/Leads';
import Billing from './views/Billing';
import Deployment from './views/Deployment';
import Login from './views/Login';
import { api } from './services/apiService'; // <-- sửa path đúng
import { fbAuth } from './services/firebase';
import { signOut } from 'firebase/auth';
import UsersPage from './views/UsersPage';
import RolesPage from './views/RolesPage';
import ProfilePage from './views/ProfilePage';
import TroLyAI from './views/TroLyAI';
import QuangCaoDaKenh from './views/QuangCaoDaKenh';

const TOKEN_KEY = 'salesagent_access_token';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem(TOKEN_KEY)
  );

  // Theo dõi thay đổi localStorage (logout/login từ tab khác)
  useEffect(() => {
    const checkAuth = () => {
      const auth = !!localStorage.getItem(TOKEN_KEY);
      setIsAuthenticated(auth);
    };
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogin = () => {
    // Login.tsx đã gọi api.login() và lưu token rồi => ở đây chỉ cần set state
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    api.logout(); // sẽ remove token
    signOut(fbAuth).catch(() => {});
    try { localStorage.removeItem('fbg_user'); localStorage.removeItem('fbg_owner'); } catch { /* ignore */ }
    setIsAuthenticated(false);
  };

  return (
    <>
      {/* Kết nối ERPNext thật (erp.fbgproperty.vn) */}
      <div className="fixed bottom-3 right-3 z-[9999] pointer-events-none select-none px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-300/40">
        ● Dữ liệu thật · ERPNext
      </div>
    <HashRouter>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          {/* Khi chưa đăng nhập, mọi đường dẫn đều về Login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
          <Sidebar onLogout={handleLogout} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <Routes>
              {/* Identity Management Routes */}
              <Route path="/identity/tai-khoan" element={<UsersPage />} />
              <Route path="/identity/vai-tro" element={<RolesPage/>} />
              <Route path="/identity/ho-so-tai-khoan" element={<ProfilePage />} />

              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tro-ly-ai" element={<TroLyAI />} />
              <Route path="/bat-dong-san/du-an-bds" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/bat-dong-san/nha-can-ho" element={<HousesApartments />} />
              <Route path="/bat-dong-san/nha-can-ho/:id" element={<PropertyDetailModal />} />
              <Route path="/deployment" element={<Deployment />} />
              <Route path="/quang-cao" element={<QuangCaoDaKenh />} />
              <Route path="/cdp" element={<CDP />} />
              <Route path="/ai-prospects" element={<AIProspects />} />
              <Route path="/ai-agents" element={<AIAgents />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/billing" element={<Billing />} />

              {/* Trang chủ mặc định */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              {/* Nếu cố tình vào login khi đã auth, đẩy về dashboard */}
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </HashRouter>
    </>
  );
};

export default App;