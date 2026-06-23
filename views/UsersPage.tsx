import React, { useState, useMemo, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Search,
  UserCheck,
  Shield,
  Trash2,
  Edit3,
  X,
  Check,
  AlertCircle,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { AspNetUser, AspNetRole } from '../types';
import { api } from '../services/apiService';
import Pagination from '../components/Pagination';

type ToastType = 'syncing' | 'success' | 'error';

const ITEMS_PER_PAGE = 8;

const UsersPage: React.FC = () => {
  // ✅ Không truyền props nữa -> tự quản lý state
  const [users, setUsers] = useState<AspNetUser[]>([]);
  const [roles, setRoles] = useState<AspNetRole[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<AspNetUser | null>(null);

  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    userName: '',
    phoneNumber: '', // ✅ thêm
    selectedRoleIds: [] as string[]
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset page khi search đổi để tránh trang rỗng
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadData = async () => {
    setIsLoading(true);
    setToast({ type: 'syncing', message: 'Đang đồng bộ dữ liệu...' });
    try {
      // ✅ Tự tải cả users + roles
      const [usersData, rolesData] = await Promise.all([
        api.getUsers(),
        api.getRoles?.() // nếu apiService chưa có getRoles, bạn thêm vào
      ]);

      setUsers(usersData || []);
      setRoles(rolesData || []);
      setToast({ type: 'success', message: 'Đã tải dữ liệu thành công' });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.message || 'Lỗi tải dữ liệu từ máy chủ' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter(user =>
      (user.fullName || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q) ||
      (user.userName || '').toLowerCase().includes(q)
    );
  }, [users, searchTerm]);

  // ✅ giống CDP: total + totalPages
  const total = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // ✅ giống CDP: nếu filter làm giảm tổng trang -> ép currentPage về totalPages
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', userName: '', phoneNumber: '', selectedRoleIds: [] });
    setShowModal(true);
  };

  const openEditModal = (user: AspNetUser) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      userName: user.userName || '',
      phoneNumber: user.phoneNumber || '', // ✅ thêm (đảm bảo types.ts có field này)
      selectedRoleIds: (user.roles || []).map(r => r.id)
    });
    setShowModal(true);
  };

  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedRoleIds: prev.selectedRoleIds.includes(roleId)
        ? prev.selectedRoleIds.filter(id => id !== roleId)
        : [...prev.selectedRoleIds, roleId]
    }));
  };

  const handleSave = async () => {
    if (!formData.email || !formData.userName) {
      setToast({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    // ✅ validate PhoneNumber (đặt ở đây)
    if (formData.phoneNumber && formData.phoneNumber.length > 50) {
      setToast({ type: 'error', message: 'Số điện thoại quá dài' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsLoading(true);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
        setToast({ type: 'success', message: 'Cập nhật danh tính thành công' });
      } else {
        await api.createUser(formData);
        setToast({ type: 'success', message: 'Tạo tài khoản thành công (Mật khẩu mặc định: fbg@123)' });
      }

      await loadData();
      setShowModal(false);
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message || 'Lỗi khi lưu dữ liệu' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?')) return;

    setIsLoading(true);
    try {
      await api.deleteUser(id);
      setToast({ type: 'success', message: 'Đã xóa người dùng thành công' });

      // ✅ giống CDP: nếu trang hiện tại chỉ còn 1 item và >1 page => lùi trang
      if (paginatedUsers.length === 1 && currentPage > 1) {
        setCurrentPage(p => p - 1);
      } else {
        await loadData();
      }
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message || 'Lỗi khi xóa' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Phân quyền: chỉ Admin được đổi cấp bậc
  const myLevel = (typeof localStorage !== 'undefined' && localStorage.getItem('salesagent_level')) || 'nhan-vien';
  const isAdmin = myLevel === 'admin';
  const changeLevel = async (userId: string, level: string) => {
    setIsLoading(true);
    try {
      await api.patch(`/users/${encodeURIComponent(userId)}/level`, { level });
      setToast({ type: 'success', message: 'Đã cập nhật cấp bậc' });
      await loadData();
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message || 'Lỗi cập nhật cấp bậc' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toastUI = useMemo(() => {
    if (!toast) return null;

    const icon =
      toast.type === 'success' ? <Check size={24} /> :
      toast.type === 'error' ? <AlertCircle size={24} /> :
      <RefreshCw size={24} className="animate-spin" />;

    const bg =
      toast.type === 'success' ? 'bg-emerald-500' :
      toast.type === 'error' ? 'bg-rose-500' :
      'bg-indigo-600';

    return { icon, bg };
  }, [toast]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Danh sách tài khoản</h2>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={loadData}
            className="group inline-flex items-center px-6 py-3 bg-white text-slate-600 rounded-2xl hover:bg-slate-50 border border-slate-200 transition-all font-bold active:scale-95 shadow-sm"
          >
            <RefreshCw size={20} className={`mr-2.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </button>

          <button
            onClick={openCreateModal}
            className="group inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-bold active:scale-95"
          >
            <Plus size={20} className="mr-2" />
            Tạo tài khoản mới
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden min-h-[500px] relative">
        <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
          <div className="relative w-full max-w-md group">
            <Search size={18} className="absolute inset-y-0 left-4 my-auto text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, email hoặc username..."
              className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 text-sm font-medium outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-extrabold">
                <th className="px-8 py-5">Người dùng</th>
                <th className="px-8 py-5">Số điện thoại</th>
                <th className="px-8 py-5">Vai trò hệ thống</th>
                <th className="px-8 py-5">Bảo mật</th>
                <th className="px-8 py-5 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-indigo-50/20 transition-all duration-300">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 shadow-sm uppercase">
                        {((user.fullName || user.userName || 'U').substring(0, 2))}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{user.fullName || '(Chưa có tên)'}</div>
                        <div className="text-xs text-slate-400 font-medium">{user.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-6">
                    {user.phoneNumber ? (
                      <span className="text-sm font-bold text-slate-700">{user.phoneNumber}</span>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">Chưa có</span>
                    )}
                  </td>

                  <td className="px-8 py-6">
                    {isAdmin ? (
                      <select
                        value={(user as any).level || (user.roles?.[0]?.id) || 'nhan-vien'}
                        onChange={(e) => changeLevel(user.id, e.target.value)}
                        className="px-3 py-2 bg-white border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-50 cursor-pointer"
                        title="Gán cấp bậc"
                      >
                        {(roles || []).map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                      </select>
                    ) : (
                      <span className="px-2.5 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {user.roles?.[0]?.name || 'Nhân viên'}
                      </span>
                    )}
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex gap-2">
                      {user.emailConfirmed ? (
                        <div title="Email đã xác thực" className="w-7 h-7 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
                          <UserCheck size={14} />
                        </div>
                      ) : (
                        <div title="Chưa xác thực email" className="w-7 h-7 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
                          <AlertCircle size={14} />
                        </div>
                      )}

                      {user.twoFactorEnabled && (
                        <div title="2FA đang bật" className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                          <Shield size={14} />
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-indigo-100 transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-rose-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  {/* ✅ bảng có 5 cột */}
                  <td colSpan={5} className="px-8 py-20 text-center">
                    {isLoading ? (
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                        <span className="font-bold text-sm">Đang tải dữ liệu từ API...</span>
                      </div>
                    ) : (
                      <div className="text-slate-300 font-bold uppercase tracking-[0.2em] text-xs">Không có dữ liệu người dùng</div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ✅ Pagination giống CDP */}
        {total > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        )}
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden transform animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  {editingUser ? 'Cấu hình Danh tính' : 'Thêm mới'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Họ và tên</label>
                  <input
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all"
                    placeholder="Nhập họ tên"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">
                    Số điện thoại
                  </label>
                  <input
                    value={formData.phoneNumber}
                    onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Tên đăng nhập</label>
                  <input
                    value={formData.userName}
                    onChange={e => setFormData({ ...formData, userName: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all"
                    placeholder="Nhập tên đăng nhập"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Email liên kết</label>
                  <input
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all"
                    placeholder="Nhập email"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Phân quyền Vai trò (Roles)</label>

                <div className="grid grid-cols-2 gap-3">
                  {(roles || []).map(role => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => toggleRole(role.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                        formData.selectedRoleIds.includes(role.id)
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                          : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                      }`}
                    >
                      <ShieldCheck
                        size={18}
                        className={formData.selectedRoleIds.includes(role.id) ? 'text-indigo-200' : 'text-slate-300'}
                      />
                      <span className="text-xs font-bold uppercase tracking-tight">{role.name}</span>
                    </button>
                  ))}
                  {(!roles || roles.length === 0) && (
                    <div className="col-span-2 text-xs text-slate-400 font-medium">
                      Chưa tải được danh sách roles. Kiểm tra API <code className="bg-slate-100 px-1.5 py-0.5 rounded">getRoles()</code>.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest"
              >
                Hủy bỏ
              </button>

              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 text-xs uppercase tracking-widest"
              >
                {isLoading && <Loader2 size={16} className="animate-spin" />}
                {editingUser ? 'Cập nhật' : 'Lưu & Khởi tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && toastUI && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-500">
          <div className="glass px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-5 border border-white/40 min-w-[320px]">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white ${toastUI.bg}`}>
              {toastUI.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hệ thống Identity</p>
              <p className="text-sm font-bold text-slate-900">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;


// import React, { useState, useMemo, useEffect } from 'react';
// import {
//   RefreshCw,
//   Plus,
//   Search,
//   UserCheck,
//   Shield,
//   Trash2,
//   Edit3,
//   X,
//   Check,
//   AlertCircle,
//   Loader2,
//   ShieldCheck
// } from 'lucide-react';
// import { AspNetUser, AspNetRole } from '../types';
// import { api } from '../services/apiService';
// import Pagination from '../components/Pagination';

// type ToastType = 'syncing' | 'success' | 'error';

// const ITEMS_PER_PAGE = 8;

// const UsersPage: React.FC = () => {
//   // ✅ Không truyền props nữa -> tự quản lý state
//   const [users, setUsers] = useState<AspNetUser[]>([]);
//   const [roles, setRoles] = useState<AspNetRole[]>([]);

//   const [searchTerm, setSearchTerm] = useState('');
//   const [currentPage, setCurrentPage] = useState(1);
//   const [showModal, setShowModal] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [editingUser, setEditingUser] = useState<AspNetUser | null>(null);

//   const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

// //   const [formData, setFormData] = useState({
// //     fullName: '',
// //     email: '',
// //     userName: '',
// //     selectedRoleIds: [] as string[]
// //   });

//   const [formData, setFormData] = useState({
//     fullName: '',
//     email: '',
//     userName: '',
//     phoneNumber: '',        // ✅ thêm
//     selectedRoleIds: [] as string[]
//   });

//   useEffect(() => {
//     loadData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Reset page khi search đổi để tránh trang rỗng
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm]);

//   const loadData = async () => {
//     setIsLoading(true);
//     setToast({ type: 'syncing', message: 'Đang đồng bộ dữ liệu...' });
//     try {
//       // ✅ Tự tải cả users + roles
//       const [usersData, rolesData] = await Promise.all([
//         api.getUsers(),
//         api.getRoles?.() // nếu apiService chưa có getRoles, bạn thêm vào
//       ]);

//       setUsers(usersData || []);
//       setRoles(rolesData || []);
//       setToast({ type: 'success', message: 'Đã tải dữ liệu thành công' });
//     } catch (error: any) {
//       setToast({ type: 'error', message: error?.message || 'Lỗi tải dữ liệu từ máy chủ' });
//     } finally {
//       setIsLoading(false);
//       setTimeout(() => setToast(null), 2500);
//     }
//   };

//   const filteredUsers = useMemo(() => {
//     const q = searchTerm.trim().toLowerCase();
//     if (!q) return users;
//     return users.filter(user =>
//       (user.fullName || '').toLowerCase().includes(q) ||
//       (user.email || '').toLowerCase().includes(q) ||
//       (user.userName || '').toLowerCase().includes(q)
//     );
//   }, [users, searchTerm]);

//   const paginatedUsers = useMemo(() => {
//     const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//     return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
//   }, [filteredUsers, currentPage]);

//   // Fix currentPage nếu filter làm giảm tổng trang
//   useEffect(() => {
//     const maxPage = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
//     if (currentPage > maxPage) setCurrentPage(maxPage);
//   }, [filteredUsers.length, currentPage]);

// //   const openCreateModal = () => {
// //     setEditingUser(null);
// //     setFormData({ fullName: '', email: '', userName: '', selectedRoleIds: [] });
// //     setShowModal(true);
// //   };

//   const openCreateModal = () => {
//     setEditingUser(null);
//     setFormData({ fullName: '', email: '', userName: '', phoneNumber: '', selectedRoleIds: [] });
//     setShowModal(true);
//   };

// //   const openEditModal = (user: AspNetUser) => {
// //     setEditingUser(user);
// //     setFormData({
// //       fullName: user.fullName || '',
// //       email: user.email || '',
// //       userName: user.userName || '',
// //       selectedRoleIds: (user.roles || []).map(r => r.id)
// //     });
// //     setShowModal(true);
// //   };

//     const openEditModal = (user: AspNetUser) => {
//         setEditingUser(user);
//         setFormData({
//         fullName: user.fullName || '',
//         email: user.email || '',
//         userName: user.userName || '',
//         phoneNumber: user.phoneNumber || '', // ✅ thêm (đảm bảo types.ts có field này)
//         selectedRoleIds: (user.roles || []).map(r => r.id)
//         });
//         setShowModal(true);
//     };

//   const toggleRole = (roleId: string) => {
//     setFormData(prev => ({
//       ...prev,
//       selectedRoleIds: prev.selectedRoleIds.includes(roleId)
//         ? prev.selectedRoleIds.filter(id => id !== roleId)
//         : [...prev.selectedRoleIds, roleId]
//     }));
//   };

//   const handleSave = async () => {
//     if (!formData.email || !formData.userName) {
//       setToast({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
//       setTimeout(() => setToast(null), 3000);
//       return;
//     }

//     // ✅ validate PhoneNumber (đặt ở đây)
//     if (formData.phoneNumber && formData.phoneNumber.length > 50) {
//         setToast({ type: 'error', message: 'Số điện thoại quá dài' });
//         setTimeout(() => setToast(null), 3000);
//         return;
//     }

//     setIsLoading(true);
//     try {
//       if (editingUser) {
//         await api.updateUser(editingUser.id, formData);
//         setToast({ type: 'success', message: 'Cập nhật danh tính thành công' });
//       } else {
//         await api.createUser(formData);
//         setToast({ type: 'success', message: 'Tạo tài khoản thành công (Mật khẩu mặc định: 123456Aa@)' });
//       }

//       await loadData();
//       setShowModal(false);
//     } catch (e: any) {
//       setToast({ type: 'error', message: e?.message || 'Lỗi khi lưu dữ liệu' });
//     } finally {
//       setIsLoading(false);
//       setTimeout(() => setToast(null), 4000);
//     }
//   };

//   const handleDelete = async (id: string) => {
//     if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống?')) return;

//     setIsLoading(true);
//     try {
//       await api.deleteUser(id);
//       setToast({ type: 'success', message: 'Đã xóa người dùng thành công' });
//       await loadData();
//     } catch (e: any) {
//       setToast({ type: 'error', message: e?.message || 'Lỗi khi xóa' });
//     } finally {
//       setIsLoading(false);
//       setTimeout(() => setToast(null), 3000);
//     }
//   };

//   const toastUI = useMemo(() => {
//     if (!toast) return null;

//     const icon =
//       toast.type === 'success' ? <Check size={24} /> :
//       toast.type === 'error' ? <AlertCircle size={24} /> :
//       <RefreshCw size={24} className="animate-spin" />;

//     const bg =
//       toast.type === 'success' ? 'bg-emerald-500' :
//       toast.type === 'error' ? 'bg-rose-500' :
//       'bg-indigo-600';

//     return { icon, bg };
//   }, [toast]);

//   return (
//     <div className="space-y-8 animate-in fade-in duration-500 relative">
//       <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
//         <div>
//           <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Danh sách tài khoản</h2>
//           {/* <p className="text-slate-500 font-medium">
//             Kết nối trực tiếp: <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-600 font-bold">api/users</code>
//           </p> */}
//         </div>
//         <div className="flex flex-wrap gap-4">
//           <button
//             onClick={loadData}
//             className="group inline-flex items-center px-6 py-3 bg-white text-slate-600 rounded-2xl hover:bg-slate-50 border border-slate-200 transition-all font-bold active:scale-95 shadow-sm"
//           >
//             <RefreshCw size={20} className={`mr-2.5 ${isLoading ? 'animate-spin' : ''}`} />
//             Làm mới dữ liệu
//           </button>
//           <button
//             onClick={openCreateModal}
//             className="group inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-bold active:scale-95"
//           >
//             <Plus size={20} className="mr-2" />
//             Tạo tài khoản mới
//           </button>
//         </div>
//       </header>

//       <div className="bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden min-h-[500px] relative">
//         <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
//           <div className="relative w-full max-w-md group">
//             <Search size={18} className="absolute inset-y-0 left-4 my-auto text-slate-400" />
//             <input
//               type="text"
//               placeholder="Tìm theo tên, email hoặc username..."
//               className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 text-sm font-medium outline-none transition-all shadow-sm"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//         </div>

//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse">
//             <thead>
//               <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-extrabold">
//                 <th className="px-8 py-5">Người dùng</th>
//                 <th className="px-8 py-5">Số điện thoại</th> {/* ✅ thêm */}
//                 <th className="px-8 py-5">Vai trò hệ thống</th>
//                 <th className="px-8 py-5">Bảo mật</th>
//                 <th className="px-8 py-5 text-right">Thao tác</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-slate-50">
//               {paginatedUsers.length > 0 ? paginatedUsers.map((user) => (
//                 <tr key={user.id} className="group hover:bg-indigo-50/20 transition-all duration-300">
//                   <td className="px-8 py-6">
//                     <div className="flex items-center space-x-4">
//                       <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 shadow-sm uppercase">
//                         {((user.fullName || user.userName || 'U').substring(0, 2))}
//                       </div>
//                       <div>
//                         <div className="text-sm font-bold text-slate-900">{user.fullName || '(Chưa có tên)'}</div>
//                         <div className="text-xs text-slate-400 font-medium">{user.email}</div>
//                       </div>
//                     </div>
//                   </td>

//                   <td className="px-8 py-6">
//                     {user.phoneNumber ? (
//                         <span className="text-sm font-bold text-slate-700">{user.phoneNumber}</span>
//                     ) : (
//                         <span className="text-[10px] text-slate-300 italic">Chưa có</span>
//                     )}
//                   </td>

//                   <td className="px-8 py-6">
//                     <div className="flex flex-wrap gap-1.5">
//                       {user.roles && user.roles.length > 0 ? user.roles.map(role => (
//                         <span key={role.id} className="px-2.5 py-1 bg-white border border-indigo-100 text-indigo-600 rounded-lg text-[9px] font-bold uppercase tracking-wider">
//                           {role.name}
//                         </span>
//                       )) : (
//                         <span className="text-[10px] text-slate-300 italic">Chưa gán vai trò</span>
//                       )}
//                     </div>
//                   </td>

//                   <td className="px-8 py-6">
//                     <div className="flex gap-2">
//                       {user.emailConfirmed ? (
//                         <div title="Email đã xác thực" className="w-7 h-7 bg-emerald-50 text-emerald-500 rounded-lg flex items-center justify-center">
//                           <UserCheck size={14} />
//                         </div>
//                       ) : (
//                         <div title="Chưa xác thực email" className="w-7 h-7 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center">
//                           <AlertCircle size={14} />
//                         </div>
//                       )}

//                       {user.twoFactorEnabled && (
//                         <div title="2FA đang bật" className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
//                           <Shield size={14} />
//                         </div>
//                       )}
//                     </div>
//                   </td>

//                   <td className="px-8 py-6 text-right">
//                     <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                       <button
//                         onClick={() => openEditModal(user)}
//                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-indigo-100 transition-all"
//                       >
//                         <Edit3 size={16} />
//                       </button>
//                       <button
//                         onClick={() => handleDelete(user.id)}
//                         className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-rose-100 transition-all"
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               )) : (
//                 <tr>
//                   <td colSpan={4} className="px-8 py-20 text-center">
//                     {isLoading ? (
//                       <div className="flex flex-col items-center gap-3 text-slate-400">
//                         <Loader2 size={32} className="animate-spin text-indigo-500" />
//                         <span className="font-bold text-sm">Đang tải dữ liệu từ API...</span>
//                       </div>
//                     ) : (
//                       <div className="text-slate-300 font-bold uppercase tracking-[0.2em] text-xs">Không có dữ liệu người dùng</div>
//                     )}
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         <Pagination
//           currentPage={currentPage}
//           totalItems={filteredUsers.length}
//           itemsPerPage={ITEMS_PER_PAGE}
//           onPageChange={setCurrentPage}
//         />
//       </div>

//       {/* User Modal */}
//       {showModal && (
//         <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
//           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden transform animate-in zoom-in-95 duration-300">
//             <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
//               <div>
//                 <h3 className="text-2xl font-black text-slate-900">
//                   {editingUser ? 'Cấu hình Danh tính' : 'Thêm mới'}
//                 </h3>
//                 {/* <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Microsoft Identity Core 8.0</p> */}
//               </div>
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600 transition-all shadow-sm"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
//               <div className="grid grid-cols-2 gap-6">
//                 <div className="col-span-2">
//                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Họ và tên</label>
//                   <input
//                     value={formData.fullName}
//                     onChange={e => setFormData({ ...formData, fullName: e.target.value })}
//                     className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all"
//                     placeholder="Nhập họ tên"
//                   />
//                 </div>

//                 <div>
//                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">
//                         Số điện thoại
//                     </label>
//                     <input
//                         value={formData.phoneNumber}
//                         onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
//                         className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all"
//                         placeholder="Nhập số điện thoại"
//                     />
//                 </div>

//                 <div>
//                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Tên đăng nhập</label>
//                   <input
//                     value={formData.userName}
//                     onChange={e => setFormData({ ...formData, userName: e.target.value })}
//                     className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all"
//                     placeholder="Nhập tên đăng nhập"
//                   />
//                 </div>

//                 <div className="col-span-2">
//                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Email liên kết</label>
//                   <input
//                     value={formData.email}
//                     onChange={e => setFormData({ ...formData, email: e.target.value })}
//                     className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold transition-all"
//                     placeholder="Nhập email"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-4 pt-4 border-t border-slate-100">
//                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 ml-1">Phân quyền Vai trò (Roles)</label>

//                 <div className="grid grid-cols-2 gap-3">
//                   {(roles || []).map(role => (
//                     <button
//                       key={role.id}
//                       type="button"
//                       onClick={() => toggleRole(role.id)}
//                       className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
//                         formData.selectedRoleIds.includes(role.id)
//                           ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
//                           : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
//                       }`}
//                     >
//                       <ShieldCheck
//                         size={18}
//                         className={formData.selectedRoleIds.includes(role.id) ? 'text-indigo-200' : 'text-slate-300'}
//                       />
//                       <span className="text-xs font-bold uppercase tracking-tight">{role.name}</span>
//                     </button>
//                   ))}
//                   {(!roles || roles.length === 0) && (
//                     <div className="col-span-2 text-xs text-slate-400 font-medium">
//                       Chưa tải được danh sách roles. Kiểm tra API <code className="bg-slate-100 px-1.5 py-0.5 rounded">getRoles()</code>.
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
//               <button
//                 onClick={() => setShowModal(false)}
//                 className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest"
//               >
//                 Hủy bỏ
//               </button>

//               <button
//                 onClick={handleSave}
//                 disabled={isLoading}
//                 className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3 text-xs uppercase tracking-widest"
//               >
//                 {isLoading && <Loader2 size={16} className="animate-spin" />}
//                 {editingUser ? 'Cập nhật' : 'Lưu & Khởi tạo'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Toast Notification */}
//       {toast && toastUI && (
//         <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-500">
//           <div className="glass px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-5 border border-white/40 min-w-[320px]">
//             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white ${toastUI.bg}`}>
//               {toastUI.icon}
//             </div>
//             <div>
//               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hệ thống Identity</p>
//               <p className="text-sm font-bold text-slate-900">{toast.message}</p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default UsersPage;
