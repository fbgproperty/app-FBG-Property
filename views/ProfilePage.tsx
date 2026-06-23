import React, { useEffect, useMemo, useState } from 'react';
import {
  User,
  Shield,
  Lock,
  Smartphone,
  Mail,
  BadgeCheck,
  History,
  Key,
  Loader2,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/apiService';

type ProfileTab = 'thông tin' | 'bảo mật' | 'quyền hạn' | 'nhật ký';

type UserProfile = {
  // ✅ các field chắc chắn có (theo code backend bạn đưa trước)
  fullName: string;
  userName: string;
  email: string;

  // ✅ optional: backend có thì map, chưa có thì để undefined
  phoneNumber?: string;
  emailConfirmed?: boolean;
  twoFactorEnabled?: boolean;

  // ✅ để sau bạn xử lý nếu backend trả
  role?: string;
  joinDate?: string;

  // ✅ để sau nếu bạn làm log hoạt động
  // logs?: Array<{ action: string; time: string; device: string; type: 'login'|'security'|'logout' }>;
};

const safeText = (v: any) => (v == null || v === '' ? '—' : String(v));

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('thông tin');
  const [isEditing, setIsEditing] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [originalUser, setOriginalUser] = useState<UserProfile | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const tabs: { id: ProfileTab; label: string; icon: any }[] = useMemo(
    () => [
      { id: 'thông tin', label: 'Thông tin cá nhân', icon: User },
      { id: 'bảo mật', label: 'Bảo mật & Tài khoản', icon: Shield },
      { id: 'quyền hạn', label: 'Vai trò & Quyền', icon: Lock },
      { id: 'nhật ký', label: 'Hoạt động gần đây', icon: History },
    ],
    []
  );

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getProfile();

      // ✅ Map camelCase + PascalCase
      const mapped: UserProfile = {
        userName: data?.userName ?? data?.UserName ?? '',
        email: data?.email ?? data?.Email ?? '',
        fullName: data?.fullName ?? data?.FullName ?? '',

        phoneNumber: data?.phoneNumber ?? data?.PhoneNumber,
        emailConfirmed: data?.emailConfirmed ?? data?.EmailConfirmed,
        twoFactorEnabled: data?.twoFactorEnabled ?? data?.TwoFactorEnabled,

        // ⛔ backend chưa có thì sẽ undefined, UI sẽ hiện "—"
        role: data?.role ?? data?.Role,
        joinDate: data?.joinDate ?? data?.JoinDate,
      };

      setUser(mapped);
      setOriginalUser(mapped);
      setIsEditing(false);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Không lấy được hồ sơ. Kiểm tra API / token / quyền truy cập.');
      setUser(null);
      setOriginalUser(null);
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = () => {
    if (!user) return;
    setOriginalUser(user);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (originalUser) setUser(originalUser);
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // ✅ Chỉ gửi những field backend chắc chắn nhận (theo controller: FullName, Email)
      // Nếu backend bạn có PhoneNumber thì mở thêm
      const payload = {
        fullName: user.fullName,
        email: user.email,
        // phoneNumber: user.phoneNumber,
      };

      await api.updateProfile(payload);

      setOriginalUser(user);
      setIsEditing(false);
      setToast('Cập nhật hồ sơ thành công!');
    } catch (e: any) {
      alert(e?.message || 'Lỗi khi cập nhật hồ sơ');
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await api.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
        confirmNewPassword: passwords.confirm,
      });

      setPasswords({ current: '', new: '', confirm: '' });
      setToast('Đã đổi mật khẩu thành công!');
    } catch (e: any) {
      alert(e?.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // ✅ Loading lần đầu
  if (isLoading && !user) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-6 text-slate-400">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="font-black uppercase tracking-widest text-xs">Đang truy vấn Identity Server...</p>
      </div>
    );
  }

  // ✅ Error / user null
  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-600">
        <div className="text-sm font-bold">Trang không tải được hồ sơ</div>
        <div className="text-xs text-slate-400 max-w-lg text-center">
          {error || 'Không có dữ liệu user. (API trả về null hoặc bạn đang bị logout)'}
        </div>
        <button
          onClick={fetchProfile}
          className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const initials =
    (user.userName?.substring?.(0, 2)?.toUpperCase?.() ||
      user.fullName?.substring?.(0, 2)?.toUpperCase?.() ||
      'US');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <span className="text-indigo-600 font-bold text-xs uppercase tracking-[0.3em] mb-2 block">
          Thiết lập tài khoản
        </span>
        {/* <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Hồ sơ của tôi</h2> */}
        {/* <p className="text-slate-500 mt-2 font-medium">Quản lý thông tin định danh và tùy chọn bảo mật cá nhân.</p> */}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột trái */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 relative">
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 rounded-[2rem] bg-white p-1.5 shadow-xl">
                  <div className="w-full h-full rounded-[1.7rem] bg-indigo-50 flex items-center justify-center text-3xl font-black text-indigo-600 border border-indigo-100">
                    {initials}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-16 pb-8 px-8 text-center">
              <h3 className="text-xl font-black text-slate-900">{safeText(user.fullName)}</h3>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
                @{safeText(user.userName)}
              </p>

              <div className="flex justify-center gap-2 mt-6">
                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {safeText(user.role)}
                </span>

                {/* Verified = emailConfirmed nếu backend trả; không có thì vẫn hiển thị "—" */}
                <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <BadgeCheck size={12} />
                  {user.emailConfirmed == null ? '—' : user.emailConfirmed ? 'Verified' : 'Unverified'}
                </span>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-medium">Ngày tham gia</span>
                  <span className="text-slate-900 font-bold">{safeText(user.joinDate)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-medium">Trạng thái</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Đang hoạt động
                  </span>
                </div>
              </div>

              <div className="pt-6 flex justify-center">
                <button
                  type="button"
                  onClick={fetchProfile}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  Refresh hồ sơ
                </button>
              </div>
            </div>
          </div>

          {/* Card 2FA: không fake, chỉ hiển thị trạng thái nếu backend có */}
          <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
            <h4 className="text-lg font-bold relative z-10">Bảo mật tài khoản</h4>
            <p className="text-indigo-200 text-xs mt-2 leading-relaxed relative z-10">
              Trạng thái 2FA từ API: <b>{user.twoFactorEnabled == null ? '—' : user.twoFactorEnabled ? 'Bật' : 'Tắt'}</b>
            </p>
            <button
              type="button"
              className="mt-6 w-full py-3 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/15 transition-all relative z-10 shadow-lg"
              onClick={() => {
                setToast('Chưa tích hợp API bật/tắt 2FA (backend chưa có endpoint)');
                setTimeout(() => setToast(null), 2500);
              }}
            >
              Thiết lập 2FA
            </button>
          </div>
        </div>

        {/* Cột phải */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_8px_40px_rgba(0,0,0,0.03)] overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-50 px-8 bg-slate-50/30 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'py-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all border-b-2 px-6 whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600',
                  ].join(' ')}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-10 relative">
              {/* overlay loading khi đã có user */}
              {isLoading && user && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="flex items-center gap-3 text-slate-600 font-bold">
                    <Loader2 className="animate-spin" size={20} />
                    Đang xử lý...
                  </div>
                </div>
              )}

              {/* THÔNG TIN */}
              {activeTab === 'thông tin' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-900">Chi tiết định danh</h3>

                    {!isEditing ? (
                      <button
                        onClick={startEditing}
                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                      >
                        Chỉnh sửa hồ sơ
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={cancelEditing}
                          className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all"
                        >
                          Hủy thay đổi
                        </button>
                        <button
                          onClick={handleUpdate}
                          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2"
                        >
                          <Save size={16} />
                          Lưu
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Họ và tên
                      </label>
                      <div className="relative group">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
                          size={18}
                        />
                        <input
                          type="text"
                          disabled={!isEditing}
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all font-semibold disabled:opacity-60"
                          value={user.fullName || ''}
                          onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Tài khoản đăng nhập
                      </label>
                      <div className="relative group">
                        <BadgeCheck
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors"
                          size={18}
                        />
                        <input
                          type="text"
                          disabled
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-semibold opacity-60 cursor-not-allowed"
                          value={user.userName || ''}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Email
                      </label>
                      <div className="relative group">
                        <Mail
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
                          size={18}
                        />
                        <input
                          type="email"
                          disabled={!isEditing}
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all font-semibold disabled:opacity-60"
                          value={user.email || ''}
                          onChange={(e) => setUser({ ...user, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Số điện thoại
                      </label>
                      <div className="relative group">
                        <Smartphone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors"
                          size={18}
                        />
                        <input
                          type="text"
                          disabled={!isEditing}
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 focus:bg-white transition-all font-semibold disabled:opacity-60"
                          value={user.phoneNumber ?? ''}
                          onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
                          placeholder="(To do....)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BẢO MẬT */}
              {activeTab === 'bảo mật' && (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                  <section>
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                      <Key className="text-indigo-600" /> Thay đổi mật khẩu
                    </h3>

                    <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Mật khẩu hiện tại
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          required
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-semibold"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Mật khẩu mới
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          required
                          value={passwords.new}
                          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-semibold"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Xác nhận mật khẩu mới
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          required
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:bg-white transition-all font-semibold"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={16} /> Đang đổi...
                          </>
                        ) : (
                          'Đổi mật khẩu'
                        )}
                      </button>
                    </form>
                  </section>

                  <section className="pt-10 border-t border-slate-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">Xác thực hai lớp (2FA)</h4>
                        <p className="text-sm text-slate-400 font-medium">
                          Hiển thị theo dữ liệu backend trả về (nếu có).
                        </p>
                      </div>

                      <div className="relative inline-flex items-center cursor-not-allowed opacity-80">
                        <input type="checkbox" checked={!!user.twoFactorEnabled} className="sr-only peer" readOnly />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500">
                      Trạng thái: <b>{user.twoFactorEnabled == null ? '—' : user.twoFactorEnabled ? 'Bật' : 'Tắt'}</b>
                    </div>
                  </section>
                </div>
              )}

              {/* QUYỀN HẠN */}
              {activeTab === 'quyền hạn' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <Shield className="text-indigo-600" /> Vai trò & Chính sách
                  </h3>

                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Vai trò được gán</p>
                    <div className="flex flex-wrap gap-3">
                      <span className="px-6 py-3 bg-white border border-indigo-100 text-indigo-600 rounded-2xl text-sm font-bold shadow-sm">
                        {safeText(user.role)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-4">
                      * Nếu backend chưa trả `role`, tab này sẽ hiện “—”. Bạn có thể bổ sung endpoint lấy roles/claims sau.
                    </p>
                  </div>

                  <div className="p-6 bg-white border border-slate-100 rounded-[2rem]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Claims / Permissions
                    </p>
                    <div className="text-sm text-slate-600 font-medium">
                      Chưa có dữ liệu từ API.
                    </div>
                  </div>
                </div>
              )}

              {/* NHẬT KÝ */}
              {activeTab === 'nhật ký' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="p-6 bg-white border border-slate-100 rounded-[2rem]">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Nhật ký hoạt động
                    </p>
                    <div className="text-sm text-slate-600 font-medium">
                      Chưa có dữ liệu từ API.
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {/* * Bạn có thể bổ sung endpoint ví dụ: <code className="px-2 py-0.5 bg-slate-50 rounded">GET /api/account/activity</code> rồi map vào đây. */}
                      TO DO......
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-emerald-500 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4">
            <CheckCircle2 size={24} />
            <span className="font-bold text-sm">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;

// import React, { useState, useEffect } from 'react';
// import { Shield, BadgeCheck, Key, Loader2, Save, CheckCircle2 } from 'lucide-react';
// import { api } from '../services/apiService';

// type ProfileTab = 'thông tin' | 'bảo mật' | 'quyền hạn';

// const ProfilePage: React.FC = () => {
//   const [activeTab, setActiveTab] = useState<ProfileTab>('thông tin');
//   const [isEditing, setIsEditing] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [user, setUser] = useState<any>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
//   const [toast, setToast] = useState<string | null>(null);

//   useEffect(() => {
//     fetchProfile();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const fetchProfile = async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const data = await api.getProfile();

//       // ✅ Map cả camelCase lẫn PascalCase để tránh undefined
//       const mapped = {
//         userName: data?.userName ?? data?.UserName ?? '',
//         email: data?.email ?? data?.Email ?? '',
//         fullName: data?.fullName ?? data?.FullName ?? '',
//       };

//       setUser(mapped);
//     } catch (e: any) {
//       console.error(e);
//       setError(e?.message || 'Không lấy được hồ sơ. Kiểm tra API / token / quyền truy cập.');
//       setUser(null);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleUpdate = async () => {
//     setIsLoading(true);
//     try {
//       await api.updateProfile(user);
//       setIsEditing(false);
//       setToast('Cập nhật hồ sơ thành công!');
//     } catch (e) {
//       alert('Lỗi khi cập nhật hồ sơ');
//     } finally {
//       setIsLoading(false);
//       setTimeout(() => setToast(null), 3000);
//     }
//   };

//   const handleChangePassword = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (passwords.new !== passwords.confirm) {
//       alert('Mật khẩu xác nhận không khớp');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       await api.changePassword({
//         currentPassword: passwords.current,
//         newPassword: passwords.new,
//         confirmNewPassword: passwords.confirm,
//       });

//       setPasswords({ current: '', new: '', confirm: '' });
//       setToast('Đã đổi mật khẩu thành công!');
//     } catch (e: any) {
//       alert(e.message || 'Lỗi khi đổi mật khẩu');
//     } finally {
//       setIsLoading(false);
//       setTimeout(() => setToast(null), 3000);
//     }
//   };

//   // ✅ Loading lần đầu
//   if (isLoading && !user) {
//     return (
//       <div className="h-full flex flex-col items-center justify-center gap-6 text-slate-400">
//         <Loader2 className="animate-spin text-indigo-600" size={48} />
//         <p className="font-black uppercase tracking-widest text-xs">Đang truy vấn Identity Server...</p>
//       </div>
//     );
//   }

//   // ✅ Không còn return null -> có màn hình lỗi / retry
//   if (!user) {
//     return (
//       <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-600">
//         <div className="text-sm font-bold">Trang không tải được hồ sơ</div>
//         <div className="text-xs text-slate-400 max-w-lg text-center">
//           {error || 'Không có dữ liệu user. (API trả về null hoặc bạn đang bị logout)'}
//         </div>
//         <button
//           onClick={fetchProfile}
//           className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
//         >
//           Thử lại
//         </button>
//       </div>
//     );
//   }

//   const initials =
//     (user.userName?.substring?.(0, 2)?.toUpperCase?.() || 'US');

//   return (
//     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
//       <header>
//         <span className="text-indigo-600 font-bold text-xs uppercase tracking-[0.3em] mb-2 block">
//           Cổng định danh RAI
//         </span>
//         <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Hồ sơ Quản trị</h2>
//       </header>

//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
//         <div className="lg:col-span-4 space-y-6">
//           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
//             <div className="h-32 bg-indigo-600 relative overflow-hidden">
//               <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
//               <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
//                 <div className="w-24 h-24 rounded-[2rem] bg-white p-1 shadow-2xl">
//                   <div className="w-full h-full rounded-[1.7rem] bg-indigo-50 flex items-center justify-center text-3xl font-black text-indigo-600 shadow-inner">
//                     {initials}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="pt-16 pb-8 px-8 text-center">
//               <h3 className="text-xl font-black text-slate-900">{user.fullName || 'User'}</h3>
//               <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
//                 ID: {user.userName || 'N/A'}
//               </p>
//               <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
//                 <span>Security Level</span>
//                 <span className="text-emerald-500 flex items-center gap-1">
//                   <BadgeCheck size={12} /> Administrator
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="lg:col-span-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
//           <div className="flex border-b border-slate-50 px-8 bg-slate-50/20">
//             {(['thông tin', 'bảo mật', 'quyền hạn'] as ProfileTab[]).map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`py-6 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${
//                   activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'
//                 }`}
//               >
//                 {tab}
//               </button>
//             ))}
//           </div>

//           <div className="p-10">
//             {activeTab === 'thông tin' && (
//               <div className="space-y-8 animate-in fade-in duration-300">
//                 <div className="flex justify-between items-center mb-4">
//                   <h3 className="text-xl font-black text-slate-900">Chi tiết tài khoản</h3>
//                   <button
//                     onClick={() => (isEditing ? handleUpdate() : setIsEditing(true))}
//                     className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
//                       isEditing
//                         ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
//                         : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//                     }`}
//                   >
//                     {isEditing ? (
//                       <>
//                         <Save size={14} /> Lưu thay đổi API
//                       </>
//                     ) : (
//                       'Chỉnh sửa hồ sơ'
//                     )}
//                   </button>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//                   <div className="space-y-3">
//                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
//                       Họ tên hiển thị
//                     </label>
//                     <input
//                       disabled={!isEditing}
//                       value={user.fullName || ''}
//                       onChange={(e) => setUser({ ...user, fullName: e.target.value })}
//                       className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold focus:ring-4 focus:ring-indigo-50 transition-all disabled:opacity-60"
//                     />
//                   </div>

//                   <div className="space-y-3">
//                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
//                       Email đăng ký
//                     </label>
//                     <input
//                       disabled={!isEditing}
//                       value={user.email || ''}
//                       onChange={(e) => setUser({ ...user, email: e.target.value })}
//                       className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold focus:ring-4 focus:ring-indigo-50 transition-all disabled:opacity-60"
//                     />
//                   </div>
//                 </div>
//               </div>
//             )}

//             {activeTab === 'bảo mật' && (
//               <div className="space-y-10 animate-in slide-in-from-right-2 duration-300">
//                 <section>
//                   <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
//                     <Key size={20} className="text-indigo-600" /> Cập nhật Mật khẩu
//                   </h3>

//                   <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
//                     <input
//                       type="password"
//                       placeholder="Mật khẩu hiện tại"
//                       required
//                       value={passwords.current}
//                       onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
//                       className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-indigo-50 font-bold"
//                     />
//                     <input
//                       type="password"
//                       placeholder="Mật khẩu mới"
//                       required
//                       value={passwords.new}
//                       onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
//                       className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-indigo-50 font-bold"
//                     />
//                     <input
//                       type="password"
//                       placeholder="Xác nhận mật khẩu mới"
//                       required
//                       value={passwords.confirm}
//                       onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
//                       className="w-full px-6 py-4 bg-slate-50 rounded-2xl border-none outline-none focus:ring-4 focus:ring-indigo-50 font-bold"
//                     />
//                     <button
//                       type="submit"
//                       disabled={isLoading}
//                       className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
//                     >
//                       Cập nhật Mật khẩu Identity
//                     </button>
//                   </form>
//                 </section>
//               </div>
//             )}

//             {activeTab === 'quyền hạn' && (
//               <div className="p-12 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 text-center text-indigo-900 animate-in zoom-in-95 duration-300">
//                 <Shield size={56} className="mx-auto mb-6 text-indigo-200" />
//                 <h4 className="text-lg font-black uppercase tracking-widest mb-2">Đặc quyền Quản trị tối cao</h4>
//                 <p className="text-sm font-medium text-indigo-400 max-w-sm mx-auto">
//                   Tài khoản này có toàn quyền truy cập (All Permissions) vào hệ thống quản lý bất động sản và CRM.
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {toast && (
//         <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-500">
//           <div className="bg-emerald-500 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4">
//             <CheckCircle2 size={24} />
//             <span className="font-bold text-sm">{toast}</span>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProfilePage;
