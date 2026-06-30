import React, { useState } from 'react';
import {
  Home,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Bot,
  Zap,
  ShieldCheck,
  Share2,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/apiService';
import { signInWithPopup } from 'firebase/auth';
import { fbAuth, googleProvider } from '../services/firebase';
import { isManagerRole } from '../services/permissions';

interface LoginProps {
  onLogin: () => void;
}

type AuthMode = 'login' | 'forgot';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // email ở đây dùng như emailOrUsername
  const [email, setEmail] = useState('info@fbgproperty.vn');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setMode('login');
    setIsSubmitted(false);
    setError(null);
    setEmail('');
    setPassword('');
    setLoading(false);
    setSocialLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (mode === 'forgot' && !email.trim()) {
      setError('Vui lòng nhập email để khôi phục mật khẩu');
      setLoading(false);
      return;
    }

    if (mode === 'login') {
      try {
        await api.login(email, password);
        onLogin();
      } catch (err: any) {
        setError(err?.message || 'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại!');
      } finally {
        setLoading(false);
      }
      return;
    }

    // forgot password -> gọi API thật
    try {
      await api.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi yêu cầu khôi phục. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading(true);
    setError(null);
    try {
      const cred = await signInWithPopup(fbAuth, googleProvider);
      const user = cred.user;
      const idToken = await user.getIdToken();
      // Lưu phiên: token Firebase để gating UI; dữ liệu ERP xác thực bằng bridge-key server-side
      api.setAuth(idToken, 'Bearer');
      const email = (user.email || '').toLowerCase();
      // Lấy vai trò từ sơ đồ tổ chức (org). Người lạ → ctv (chờ duyệt).
      let role = email.endsWith('@fbgproperty.vn') ? 'ceo' : 'ctv';
      try { const me = await api.orgMe(email); if (me?.role) role = me.role; } catch { /* ignore */ }
      try {
        localStorage.setItem('fbg_user', JSON.stringify({ email: user.email, name: user.displayName, photo: user.photoURL }));
        if (user.email) localStorage.setItem('fbg_owner', user.email.split('@')[0]);
        localStorage.setItem('fbg_role', role);
        // tương thích thành phần cũ: vai trò quản lý = 'admin'
        localStorage.setItem('salesagent_level', isManagerRole(role) ? 'admin' : 'sale');
      } catch { /* ignore */ }
      onLogin();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setError('Đăng nhập Google chưa được bật trong Firebase Console. Vui lòng bật provider Google rồi thử lại.');
      } else if (code === 'auth/unauthorized-domain') {
        setError('Tên miền app.fbgproperty.vn chưa được thêm vào Authorized domains của Firebase Auth.');
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setError(null);
      } else {
        setError(err?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại!');
      }
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 relative overflow-hidden bg-slate-950">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-xl rounded-[30px] md:rounded-[40px] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        {/* Left Side */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 to-blue-700 relative text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-white p-2.5 rounded-2xl shadow-xl">
                <Home className="text-indigo-600 w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter">FBG Property</h1>
            </div>

            <div className="space-y-8">
              <h2 className="text-4xl font-black leading-tight">
                Bất động sản FBG <br />
                <span className="text-indigo-200">vận hành bằng AI</span>
              </h2>
              <p className="text-indigo-100 text-lg font-medium opacity-80 leading-relaxed">
                Vận hành đội ngũ nhân sự ảo, tối ưu quy trình kinh doanh bất động sản trên hạ tầng Google Cloud.
              </p>

              <div className="space-y-4 pt-4">
                {[
                  { icon: Bot, text: '30+ chuyên viên AI hỗ trợ từng nhân sự' },
                  { icon: Zap, text: 'Xử lý dữ liệu Real-time với BigQuery' },
                  { icon: ShieldCheck, text: 'Bảo mật chuẩn Google Cloud Platform' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-md"
                  >
                    <item.icon className="w-5 h-5 text-indigo-300" />
                    <span className="text-sm font-bold">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="p-8 md:p-16 flex flex-col justify-center bg-white relative">
          {/* Mobile header */}
          <div className="mb-10 lg:hidden flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <Home className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">FBG Property</h1>
          </div>

          {/* Form Header */}
          <div className="mb-10 transition-all">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
              {mode === 'login' ? 'Chào mừng trở lại!' : 'Khôi phục mật khẩu'}
            </h3>
            <p className="text-gray-500 font-medium text-sm">
              {mode === 'login'
                ? 'Đăng nhập hệ thống FBG Property.'
                : 'Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.'}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <p className="text-xs font-bold uppercase tracking-tight text-red-600">{error}</p>
            </div>
          )}

          {isSubmitted ? (
            <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-bold text-gray-900">Đã gửi yêu cầu!</h4>
                <p className="text-gray-500 text-sm">
                  Vui lòng kiểm tra hộp thư đến của <b>{email}</b> để tiếp tục.
                </p>
              </div>
              <button
                onClick={resetState}
                className="w-full py-4 border-2 border-slate-100 text-slate-700 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    {mode === 'login' ? 'Email / Username' : 'Email'}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type={mode === 'login' ? 'text' : 'email'}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
                      placeholder={mode === 'login' ? 'email hoặc username' : 'admin@raident.ai'}
                    />
                  </div>
                </div>

                {mode === 'login' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Mật khẩu
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setError(null);
                          setIsSubmitted(false);
                        }}
                        className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
                      >
                        Quên mật khẩu?
                      </button>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || socialLoading}
                  className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {mode === 'login' ? 'Đang xác thực...' : 'Đang xử lý...'}
                    </>
                  ) : mode === 'login' ? (
                    'Bắt đầu làm việc'
                  ) : (
                    'Gửi yêu cầu khôi phục'
                  )}
                </button>

                {mode === 'forgot' && (
                  <button
                    type="button"
                    onClick={resetState}
                    className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                  >
                    Quay lại đăng nhập
                  </button>
                )}
              </form>

              {mode === 'login' && (
                <div className="animate-in fade-in duration-500">
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-100" />
                    </div>
                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                      <span className="bg-white px-4">Hoặc</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading || socialLoading}
                    className="w-full py-4 border-2 border-slate-100 bg-white text-slate-700 rounded-3xl font-black uppercase text-xs tracking-[0.1em] hover:bg-slate-50 hover:border-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {socialLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    ) : (
                      <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                    )}
                    Đăng nhập / Đăng ký bằng Google
                  </button>
                </div>
              )}
            </>
          )}

          <p className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Hệ thống quản trị nội bộ. <span className="text-red-500">Nghiêm cấm truy cập trái phép.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
// import React, { useState } from 'react';
// import {
//   Home,
//   Mail,
//   Lock,
//   Loader2,
//   AlertCircle,
//   Bot,
//   Zap,
//   ShieldCheck,
//   Share2,
//   ArrowLeft,
//   CheckCircle2,
// } from 'lucide-react';
// import { api } from '../services/apiService';

// interface LoginProps {
//   onLogin: () => void;
// }

// type AuthMode = 'login' | 'forgot';

// const Login: React.FC<LoginProps> = ({ onLogin }) => {
//   const [mode, setMode] = useState<AuthMode>('login');

//   // email ở đây dùng như emailOrUsername
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');

//   const [loading, setLoading] = useState(false);
//   const [socialLoading, setSocialLoading] = useState(false);

//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const resetState = () => {
//     setMode('login');
//     setIsSubmitted(false);
//     setError(null);
//     setEmail('');
//     setPassword('');
//     setLoading(false);
//     setSocialLoading(false);
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     if (mode === 'login') {
//       try {
//         await api.login(email, password);
//         onLogin();
//       } catch (err: any) {
//         setError(err?.message || 'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại!');
//       } finally {
//         setLoading(false);
//       }
//       return;
//     }

//     // forgot password
//     try {
//       // Nếu bạn có API thật:
//       // await api.forgotPassword(email);

//       // Fallback giả lập giống code 1
//       await new Promise((res) => setTimeout(res, 1500));

//       setIsSubmitted(true);
//     } catch (err: any) {
//       setError(err?.message || 'Không thể gửi yêu cầu khôi phục. Vui lòng thử lại!');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSocialLogin = async () => {
//     setSocialLoading(true);
//     setError(null);

//     try {
//       // Nếu bạn có API social thật:
//       // await api.socialLogin();
//       await new Promise((res) => setTimeout(res, 1500));
//       onLogin();
//     } catch (err: any) {
//       setError(err?.message || 'Đăng nhập social thất bại. Vui lòng thử lại!');
//     } finally {
//       setSocialLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 relative overflow-hidden bg-slate-950">
//       {/* Background Decor */}
//       <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
//       <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />

//       <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-xl rounded-[30px] md:rounded-[40px] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
//         {/* Left Side */}
//         <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 to-blue-700 relative text-white">
//           <div className="relative z-10">
//             <div className="flex items-center gap-3 mb-10">
//               <div className="bg-white p-2.5 rounded-2xl shadow-xl">
//                 <Home className="text-indigo-600 w-7 h-7" />
//               </div>
//               <h1 className="text-2xl font-black tracking-tighter">FBG Property</h1>
//             </div>

//             <div className="space-y-8">
//               <h2 className="text-4xl font-black leading-tight">
//                 Nền tảng Bán hàng <br />
//                 <span className="text-indigo-200">Tự động hóa bằng AI</span>
//               </h2>
//               <p className="text-indigo-100 text-lg font-medium opacity-80 leading-relaxed">
//                 Vận hành đội ngũ nhân sự ảo, tối ưu quy trình kinh doanh bất động sản trên hạ tầng Google Cloud.
//               </p>

//               <div className="space-y-4 pt-4">
//                 {[
//                   { icon: Bot, text: '30+ chuyên viên AI hỗ trợ từng nhân sự' },
//                   { icon: Zap, text: 'Xử lý dữ liệu Real-time với BigQuery' },
//                   { icon: ShieldCheck, text: 'Bảo mật chuẩn Google Cloud Platform' },
//                 ].map((item, i) => (
//                   <div
//                     key={i}
//                     className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-md"
//                   >
//                     <item.icon className="w-5 h-5 text-indigo-300" />
//                     <span className="text-sm font-bold">{item.text}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right Side */}
//         <div className="p-8 md:p-16 flex flex-col justify-center bg-white relative">
//           {/* Mobile header */}
//           <div className="mb-10 lg:hidden flex items-center gap-3">
//             <div className="bg-indigo-600 p-2 rounded-xl text-white">
//               <Home className="w-6 h-6" />
//             </div>
//             <h1 className="text-xl font-black tracking-tight text-gray-900">FBG Property</h1>
//           </div>

//           {/* Form Header */}
//           <div className="mb-10 transition-all">
//             <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
//               {mode === 'login' ? 'Chào mừng trở lại!' : 'Khôi phục mật khẩu'}
//             </h3>
//             <p className="text-gray-500 font-medium text-sm">
//               {mode === 'login'
//                 ? 'Đăng nhập hệ thống FBG Property.'
//                 : 'Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.'}
//             </p>
//           </div>

//           {error && (
//             <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
//               <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
//               <p className="text-xs font-bold uppercase tracking-tight text-red-600">{error}</p>
//             </div>
//           )}

//           {isSubmitted ? (
//             <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4">
//               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
//                 <CheckCircle2 className="w-10 h-10" />
//               </div>
//               <div className="space-y-2">
//                 <h4 className="text-xl font-bold text-gray-900">Đã gửi yêu cầu!</h4>
//                 <p className="text-gray-500 text-sm">
//                   Vui lòng kiểm tra hộp thư đến của <b>{email}</b> để tiếp tục.
//                 </p>
//               </div>
//               <button
//                 onClick={resetState}
//                 className="w-full py-4 border-2 border-slate-100 text-slate-700 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
//               >
//                 <ArrowLeft className="w-4 h-4" />
//                 Quay lại đăng nhập
//               </button>
//             </div>
//           ) : (
//             <>
//               <form onSubmit={handleSubmit} className="space-y-5">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                     {mode === 'login' ? 'Email / Username' : 'Email'}
//                   </label>
//                   <div className="relative group">
//                     <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
//                     <input
//                       type={mode === 'login' ? 'text' : 'email'}
//                       required
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                       placeholder={mode === 'login' ? 'email hoặc username' : 'admin@raident.ai'}
//                     />
//                   </div>
//                 </div>

//                 {mode === 'login' && (
//                   <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
//                     <div className="flex justify-between items-center ml-1">
//                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
//                         Mật khẩu
//                       </label>
//                       <button
//                         type="button"
//                         onClick={() => setMode('forgot')}
//                         className="text-[10px] font-black text-indigo-600 uppercase hover:underline"
//                       >
//                         Quên mật khẩu?
//                       </button>
//                     </div>
//                     <div className="relative group">
//                       <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
//                       <input
//                         type="password"
//                         required
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                         placeholder="••••••••"
//                       />
//                     </div>
//                   </div>
//                 )}

//                 <button
//                   type="submit"
//                   disabled={loading || socialLoading}
//                   className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
//                 >
//                   {loading ? (
//                     <>
//                       <Loader2 className="w-5 h-5 animate-spin" />
//                       {mode === 'login' ? 'Đang xác thực...' : 'Đang xử lý...'}
//                     </>
//                   ) : mode === 'login' ? (
//                     'Bắt đầu làm việc'
//                   ) : (
//                     'Gửi yêu cầu khôi phục'
//                   )}
//                 </button>

//                 {mode === 'forgot' && (
//                   <button
//                     type="button"
//                     onClick={resetState}
//                     className="w-full text-center text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
//                   >
//                     Quay lại đăng nhập
//                   </button>
//                 )}
//               </form>

//               {mode === 'login' && (
//                 <div className="animate-in fade-in duration-500">
//                   <div className="relative my-8">
//                     <div className="absolute inset-0 flex items-center">
//                       <div className="w-full border-t border-gray-100" />
//                     </div>
//                     <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
//                       <span className="bg-white px-4">Hoặc</span>
//                     </div>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={handleSocialLogin}
//                     disabled={loading || socialLoading}
//                     className="w-full py-4 border-2 border-slate-100 bg-white text-slate-700 rounded-3xl font-black uppercase text-xs tracking-[0.1em] hover:bg-slate-50 hover:border-indigo-100 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
//                   >
//                     {socialLoading ? (
//                       <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
//                     ) : (
//                       <Share2 className="w-5 h-5 text-indigo-500" />
//                     )}
//                     Đăng nhập bằng Rai social
//                   </button>
//                 </div>
//               )}
//             </>
//           )}

//           <p className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
//             Hệ thống quản trị nội bộ. <span className="text-red-500">Nghiêm cấm truy cập trái phép.</span>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;


// import React, { useState } from 'react';
// import { Home, Mail, Lock, Loader2, AlertCircle, Bot, Zap, ShieldCheck } from 'lucide-react';
// import { api } from '../services/apiService'; // sửa path cho đúng dự án bạn

// interface LoginProps {
//   onLogin: () => void;
// }

// const Login: React.FC<LoginProps> = ({ onLogin }) => {
//   const [email, setEmail] = useState(''); // dùng làm emailOrUsername
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       await api.login(email, password); // email -> emailOrUsername
//       onLogin();
//     } catch (err: any) {
//       setError(err?.message || 'Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại!');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
//       {/* Background Decor */}
//       <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
//       <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>

//       <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">

//         {/* Left Side */}
//         <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 to-blue-700 relative text-white">
//           <div className="relative z-10">
//             <div className="flex items-center gap-3 mb-10">
//               <div className="bg-white p-2.5 rounded-2xl shadow-xl">
//                 <Home className="text-indigo-600 w-7 h-7" />
//               </div>
//               <h1 className="text-2xl font-black tracking-tighter">FBG Property</h1>
//             </div>

//             <div className="space-y-8">
//               <h2 className="text-4xl font-black leading-tight">
//                 Nền tảng Bán hàng <br />
//                 <span className="text-indigo-200">Tự động hóa bằng AI</span>
//               </h2>
//               <p className="text-indigo-100 text-lg font-medium opacity-80 leading-relaxed">
//                 Vận hành đội ngũ nhân sự ảo, tối ưu quy trình kinh doanh bất động sản trên hạ tầng Google Cloud.
//               </p>

//               <div className="space-y-4 pt-4">
//                 {[
//                   { icon: Bot, text: "Lực lượng AI Agent chuyên nghiệp" },
//                   { icon: Zap, text: "Xử lý dữ liệu Real-time với BigQuery" },
//                   { icon: ShieldCheck, text: "Bảo mật chuẩn Google Cloud Platform" }
//                 ].map((item, i) => (
//                   <div key={i} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
//                     <item.icon className="w-5 h-5 text-indigo-300" />
//                     <span className="text-sm font-bold">{item.text}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right Side */}
//         <div className="p-8 md:p-16 flex flex-col justify-center bg-white">
//           <div className="mb-10 lg:hidden flex items-center gap-3">
//             <div className="bg-indigo-600 p-2 rounded-xl text-white">
//               <Home className="w-6 h-6" />
//             </div>
//             <h1 className="text-xl font-black tracking-tight text-gray-900">FBG Property</h1>
//           </div>

//           <div className="mb-10">
//             <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Chào mừng trở lại!</h3>
//             <p className="text-gray-500 font-medium">Đăng nhập để quản trị hệ thống RAI Agent.</p>
//           </div>

//           {error && (
//             <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
//               <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
//               <p className="text-xs font-bold uppercase tracking-tight text-red-600">{error}</p>
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="space-y-2">
//               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                 Email / Username
//               </label>
//               <div className="relative group">
//                 <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
//                 <input
//                   type="text"
//                   required
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                   placeholder="email hoặc username"
//                 />
//               </div>
//             </div>

//             <div className="space-y-2">
//               <div className="flex justify-between items-center ml-1">
//                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mật khẩu</label>
//                 <a href="#" className="text-[10px] font-black text-indigo-600 uppercase hover:underline">
//                   Quên mật khẩu?
//                 </a>
//               </div>
//               <div className="relative group">
//                 <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
//                 <input
//                   type="password"
//                   required
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                   placeholder="••••••••"
//                 />
//               </div>
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
//             >
//               {loading ? (
//                 <>
//                   <Loader2 className="w-5 h-5 animate-spin" />
//                   Đang xác thực...
//                 </>
//               ) : (
//                 'Bắt đầu làm việc'
//               )}
//             </button>
//           </form>

//           <p className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
//             Hệ thống quản trị nội bộ. <span className="text-red-500">Nghiêm cấm truy cập trái phép.</span>
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Login;

// // import React, { useState } from 'react';
// // import { Home, Mail, Lock, Loader2, AlertCircle, Bot, Zap, ShieldCheck } from 'lucide-react';

// // interface LoginProps {
// //   onLogin: () => void;
// // }

// // const Login: React.FC<LoginProps> = ({ onLogin }) => {
// //   const [email, setEmail] = useState('admin@salesagent.ai');
// //   const [password, setPassword] = useState('password123');
// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState<string | null>(null);

// //   const handleSubmit = (e: React.FormEvent) => {
// //     e.preventDefault();
// //     setLoading(true);
// //     setError(null);

// //     // Giả lập xác thực sau 1.5s
// //     setTimeout(() => {
// //       if (email === 'admin@salesagent.ai' && password === 'password123') {
// //         onLogin();
// //       } else {
// //         setError('Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại!');
// //         setLoading(false);
// //       }
// //     }, 1500);
// //   };

// //   return (
// //     <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
// //       {/* Background Decor */}
// //       <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"></div>
// //       <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      
// //       <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        
// //         {/* Left Side: Branding & Info */}
// //         <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 to-blue-700 relative text-white">
// //           <div className="relative z-10">
// //             <div className="flex items-center gap-3 mb-10">
// //               <div className="bg-white p-2.5 rounded-2xl shadow-xl">
// //                 <Home className="text-indigo-600 w-7 h-7" />
// //               </div>
// //               <h1 className="text-2xl font-black tracking-tighter">SalesAgent AI</h1>
// //             </div>
            
// //             <div className="space-y-8">
// //               <h2 className="text-4xl font-black leading-tight">
// //                 Nền tảng Bán hàng <br />
// //                 <span className="text-indigo-200">Tự động hóa bằng AI</span>
// //               </h2>
// //               <p className="text-indigo-100 text-lg font-medium opacity-80 leading-relaxed">
// //                 Vận hành đội ngũ nhân sự ảo, tối ưu quy trình kinh doanh bất động sản trên hạ tầng Google Cloud.
// //               </p>
              
// //               <div className="space-y-4 pt-4">
// //                 {[
// //                   { icon: Bot, text: "Lực lượng AI Agent chuyên nghiệp" },
// //                   { icon: Zap, text: "Xử lý dữ liệu Real-time với BigQuery" },
// //                   { icon: ShieldCheck, text: "Bảo mật chuẩn Google Cloud Platform" }
// //                 ].map((item, i) => (
// //                   <div key={i} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
// //                     <item.icon className="w-5 h-5 text-indigo-300" />
// //                     <span className="text-sm font-bold">{item.text}</span>
// //                   </div>
// //                 ))}
// //               </div>
// //             </div>
// //           </div>
          
// //           <div className="relative z-10 flex items-center gap-4 text-xs font-black uppercase tracking-widest opacity-60">
// //              <span>Vận hành bởi Google Cloud</span>
// //              <div className="flex gap-1.5">
// //                 <div className="w-2 h-2 rounded-full bg-red-400"></div>
// //                 <div className="w-2 h-2 rounded-full bg-blue-400"></div>
// //                 <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
// //              </div>
// //           </div>

// //           <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
// //              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
// //                 <path d="M0 100 L100 0 L100 100 Z" fill="white" />
// //              </svg>
// //           </div>
// //         </div>

// //         {/* Right Side: Login Form */}
// //         <div className="p-8 md:p-16 flex flex-col justify-center bg-white">
// //           <div className="mb-10 lg:hidden flex items-center gap-3">
// //              <div className="bg-indigo-600 p-2 rounded-xl text-white">
// //                 <Home className="w-6 h-6" />
// //              </div>
// //              <h1 className="text-xl font-black tracking-tight text-gray-900">SalesAgent AI</h1>
// //           </div>

// //           <div className="mb-10">
// //             <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Chào mừng trở lại!</h3>
// //             <p className="text-gray-500 font-medium">Đăng nhập để quản trị hệ thống SalesAgent AI.</p>
// //           </div>

// //           {error && (
// //             <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 animate-in slide-in-from-top-2">
// //               <AlertCircle className="w-5 h-5 flex-shrink-0" />
// //               <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
// //             </div>
// //           )}

// //           <form onSubmit={handleSubmit} className="space-y-6">
// //             <div className="space-y-2">
// //               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email nội bộ</label>
// //               <div className="relative group">
// //                 <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
// //                 <input 
// //                   type="email" 
// //                   required
// //                   value={email}
// //                   onChange={(e) => setEmail(e.target.value)}
// //                   className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
// //                   placeholder="name@salesagent.ai"
// //                 />
// //               </div>
// //             </div>

// //             <div className="space-y-2">
// //               <div className="flex justify-between items-center ml-1">
// //                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mật khẩu</label>
// //                 <a href="#" className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Quên mật khẩu?</a>
// //               </div>
// //               <div className="relative group">
// //                 <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
// //                 <input 
// //                   type="password" 
// //                   required
// //                   value={password}
// //                   onChange={(e) => setPassword(e.target.value)}
// //                   className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
// //                   placeholder="••••••••"
// //                 />
// //               </div>
// //             </div>

// //             <div className="flex items-center gap-3 py-2">
// //               <input type="checkbox" id="remember" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
// //               <label htmlFor="remember" className="text-xs font-bold text-gray-500 uppercase tracking-tighter cursor-pointer">Ghi nhớ phiên đăng nhập</label>
// //             </div>

// //             <button 
// //               type="submit" 
// //               disabled={loading}
// //               className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
// //             >
// //               {loading ? (
// //                 <>
// //                   <Loader2 className="w-5 h-5 animate-spin" />
// //                   Đang xác thực...
// //                 </>
// //               ) : (
// //                 'Bắt đầu làm việc'
// //               )}
// //             </button>
// //           </form>

// //           <div className="mt-12 pt-8 border-t border-gray-100 text-center">
// //              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Hoặc đăng nhập nhanh với</p>
// //              <div className="flex gap-4">
// //                 <button className="flex-1 flex items-center justify-center gap-3 py-3 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all">
// //                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
// //                    <span className="text-xs font-bold text-gray-700">Google Workspace</span>
// //                 </button>
// //              </div>
// //           </div>
          
// //           <p className="mt-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
// //             Hệ thống quản trị nội bộ. <span className="text-red-500">Nghiêm cấm truy cập trái phép.</span>
// //           </p>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default Login;
