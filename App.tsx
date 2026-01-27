import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Projects from './views/Projects';
import ProjectDetail from './views/ProjectDetail';
import CDP from './views/CDP';
import AIProspects from './views/AIProspects';
import AIAgents from './views/AIAgents';
import Leads from './views/Leads';
import Billing from './views/Billing';
import Deployment from './views/Deployment';
import Login from './views/Login';
import { api } from './services/apiService'; // <-- sửa path đúng

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
    setIsAuthenticated(false);
  };

  return (
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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/deployment" element={<Deployment />} />
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
  );
};

export default App;

// import React, { useState, useEffect } from 'react';
// import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
// import Sidebar from './components/Sidebar';
// import Dashboard from './views/Dashboard';
// import Projects from './views/Projects';
// import ProjectDetail from './views/ProjectDetail';
// import CDP from './views/CDP';
// import AIProspects from './views/AIProspects';
// import AIAgents from './views/AIAgents';
// import Leads from './views/Leads';
// import Billing from './views/Billing';
// import Deployment from './views/Deployment';
// import Login from './views/Login';

// const App: React.FC = () => {
//   const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
//     localStorage.getItem('salesagent_auth') === 'true'
//   );

//   // Theo dõi thay đổi từ localStorage (đề phòng trường hợp logout từ tab khác)
//   useEffect(() => {
//     const checkAuth = () => {
//       const auth = localStorage.getItem('salesagent_auth') === 'true';
//       if (auth !== isAuthenticated) {
//         setIsAuthenticated(auth);
//       }
//     };
//     window.addEventListener('storage', checkAuth);
//     return () => window.removeEventListener('storage', checkAuth);
//   }, [isAuthenticated]);

//   const handleLogin = () => {
//     localStorage.setItem('salesagent_auth', 'true');
//     setIsAuthenticated(true);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('salesagent_auth');
//     setIsAuthenticated(false);
//   };

//   return (
//     <HashRouter>
//       {!isAuthenticated ? (
//         <Routes>
//           <Route path="/login" element={<Login onLogin={handleLogin} />} />
//           {/* Khi chưa đăng nhập, mọi đường dẫn đều về Login */}
//           <Route path="*" element={<Navigate to="/login" replace />} />
//         </Routes>
//       ) : (
//         <div className="flex h-screen bg-gray-50 overflow-hidden">
//           <Sidebar onLogout={handleLogout} />
//           <main className="flex-1 overflow-y-auto p-4 md:p-8">
//             <Routes>
//               <Route path="/dashboard" element={<Dashboard />} />
//               <Route path="/projects" element={<Projects />} />
//               <Route path="/projects/:id" element={<ProjectDetail />} />
//               <Route path="/deployment" element={<Deployment />} />
//               <Route path="/cdp" element={<CDP />} />
//               <Route path="/ai-prospects" element={<AIProspects />} />
//               <Route path="/ai-agents" element={<AIAgents />} />
//               <Route path="/leads" element={<Leads />} />
//               <Route path="/billing" element={<Billing />} />
//               {/* Trang chủ mặc định */}
//               <Route path="/" element={<Navigate to="/dashboard" replace />} />
//               {/* Nếu cố tình vào login khi đã auth, đẩy về dashboard */}
//               <Route path="/login" element={<Navigate to="/dashboard" replace />} />
//               {/* Catch-all cho các route không tồn tại */}
//               <Route path="*" element={<Navigate to="/dashboard" replace />} />
//             </Routes>
//           </main>
//         </div>
//       )}
//     </HashRouter>
//   );
// };

// export default App;
