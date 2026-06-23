import React, { useState, useMemo, useEffect } from 'react';
import { api } from '../services/apiService';
import Pagination from '../components/Pagination';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Trash2,
  Edit3,
  X,
  ChevronRight,
  Lock,
  Loader2,
  Check
} from 'lucide-react';

type ToastType = 'success' | 'error' | 'syncing';

const ITEMS_PER_PAGE = 6;

type RoleVM = {
  id: string;
  name: string;
  permissions: string[];        // ✅ quyền (role claims type=permission)
  permissionsLoaded?: boolean;  // ✅ đã load quyền chưa
};

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<RoleVM[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleVM | null>(null);

  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

  // ✅ giữ UI hiện tại: input list claims.value
  const [formData, setFormData] = useState({
    name: '',
    claims: [] as { type: string; value: string }[]
  });

  const uniquePermissionsFromForm = () => {
    const raw = formData.claims
      .map(x => (x.value ?? '').trim())
      .filter(Boolean);

    // unique (case-insensitive)
    const map = new Map<string, string>();
    raw.forEach(p => {
      const key = p.toLowerCase();
      if (!map.has(key)) map.set(key, p);
    });

    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  };

  useEffect(() => {
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    setToast({ type: 'syncing', message: 'Đang đồng bộ vai trò...' });
    try {
      const data = await api.getRoles(); // [{id,name}]
      const vm: RoleVM[] = (data || []).map(r => ({
        id: r.id,
        name: r.name,
        permissions: [],
        permissionsLoaded: false,
      }));
      setRoles(vm);
      setToast({ type: 'success', message: 'Đã tải vai trò thành công' });
    } catch (error: any) {
      setToast({ type: 'error', message: error?.message || 'Lỗi tải danh sách vai trò' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  // ✅ phân trang giống UsersPage (có total + totalPages)
  const total = roles.length;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return roles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [roles, currentPage]);

  // ✅ ép currentPage về totalPages nếu data giảm
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // ✅ Lazy-load quyền cho các role đang hiển thị (tránh gọi N+1 toàn bộ)
  useEffect(() => {
    const hydrateVisiblePermissions = async () => {
      const visible = paginatedRoles.filter(r => !r.permissionsLoaded);
      if (visible.length === 0) return;

      try {
        const results = await Promise.all(
          visible.map(async (r) => {
            try {
              const detail = await api.getRoleDetail(r.id); // {id,name,permissions}
              return { id: r.id, permissions: detail.permissions || [] };
            } catch {
              const perms = await api.getRolePermissions(r.id);
              return { id: r.id, permissions: perms || [] };
            }
          })
        );

        setRoles(prev => prev.map(x => {
          const found = results.find(z => z.id === x.id);
          if (!found) return x;
          return { ...x, permissions: found.permissions, permissionsLoaded: true };
        }));
      } catch {
        // không toast ở đây để tránh spam
      }
    };

    hydrateVisiblePermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, totalPages]); // ✅ trigger theo page (ổn định hơn roles.length)

  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({ name: '', claims: [] });
    setShowModal(true);
  };

  const openEditModal = async (role: RoleVM) => {
    setIsLoading(true);
    try {
      const detail = await api.getRoleDetail(role.id); // { id, name, permissions }
      setEditingRole({ ...role, name: detail.name, permissions: detail.permissions || [], permissionsLoaded: true });

      setFormData({
        name: detail.name,
        claims: (detail.permissions || []).map(p => ({ type: 'permission', value: p })),
      });

      setRoles(prev => prev.map(x => x.id === role.id
        ? { ...x, name: detail.name, permissions: detail.permissions || [], permissionsLoaded: true }
        : x
      ));

      setShowModal(true);
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message || 'Lỗi tải chi tiết vai trò' });
      setTimeout(() => setToast(null), 2500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const name = formData.name.trim();
    if (!name) {
      setToast({ type: 'error', message: 'Tên vai trò không được để trống' });
      setTimeout(() => setToast(null), 2500);
      return;
    }

    const desiredPermissions = uniquePermissionsFromForm();

    setIsLoading(true);
    try {
      if (!editingRole) {
        const created = await api.createRole({ name });

        if (desiredPermissions.length > 0) {
          await Promise.all(desiredPermissions.map(p => api.addRolePermission(created.id, p)));
        }

        setToast({ type: 'success', message: 'Đã tạo vai trò mới thành công' });
      } else {
        await api.updateRole(editingRole.id, { name });

        const currentPermissions = await api.getRolePermissions(editingRole.id);

        const curSet = new Set((currentPermissions || []).map(x => x.toLowerCase()));
        const desSet = new Set(desiredPermissions.map(x => x.toLowerCase()));

        const toAdd = desiredPermissions.filter(p => !curSet.has(p.toLowerCase()));
        const toRemove = (currentPermissions || []).filter(p => !desSet.has(p.toLowerCase()));

        await Promise.all([
          ...toAdd.map(p => api.addRolePermission(editingRole.id, p)),
          ...toRemove.map(p => api.removeRolePermission(editingRole.id, p)),
        ]);

        setToast({ type: 'success', message: 'Đã cập nhật vai trò thành công' });
      }

      await loadRoles();
      setShowModal(false);
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message || 'Lỗi khi lưu vai trò' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa vai trò này sẽ gỡ quyền truy cập của tất cả nhân viên thuộc vai trò này?')) return;

    setIsLoading(true);
    try {
      await api.deleteRole(id);
      setToast({ type: 'success', message: 'Đã xóa vai trò thành công' });

      // ✅ giống UsersPage: xóa item cuối trang thì lùi trang
      if (paginatedRoles.length === 1 && currentPage > 1) {
        setCurrentPage(p => p - 1);
      } else {
        await loadRoles();
      }
    } catch (e: any) {
      setToast({ type: 'error', message: e?.message || 'Lỗi khi xóa vai trò' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getRoleIcon = (roleName: string) => {
    if (roleName.includes('Quản trị')) return <ShieldAlert className="text-rose-500" />;
    if (roleName.includes('Quản lý')) return <ShieldCheck className="text-indigo-600" />;
    return <Shield className="text-emerald-500" />;
  };

  const toastIcon = (type: ToastType) => {
    if (type === 'syncing') return <Loader2 size={20} className="animate-spin text-indigo-300" />;
    if (type === 'success') return <Check size={20} className="text-emerald-400" />;
    return <ShieldAlert size={20} className="text-rose-300" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Danh sách phân quyền vai trò</h2>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-bold active:scale-95"
        >
          <UserPlus size={20} className="mr-2" />
          Thêm vai trò hệ thống
        </button>
      </header>

      {isLoading && !showModal && (
        <div className="absolute inset-0 top-32 flex flex-col items-center justify-center gap-4 text-indigo-500 bg-white/50 backdrop-blur-sm z-10 rounded-[2.5rem]">
          <Loader2 size={40} className="animate-spin" />
          <span className="font-black uppercase tracking-widest text-xs">Đang đồng bộ vai trò...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {paginatedRoles.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all group flex flex-col justify-between border-b-4 border-b-transparent hover:border-b-indigo-500"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {getRoleIcon(role.name)}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(role)}
                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-2">{role.name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
                ID: {role.id.substring(0, 8)}...
              </p>

              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Danh mục quyền hạn</span>

                <div className="space-y-2">
                  {role.permissionsLoaded ? (
                    role.permissions.length > 0 ? (
                      role.permissions.slice(0, 3).map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl"
                        >
                          <ChevronRight size={14} className="text-indigo-400 mr-2" />
                          {p}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-300 italic">Dữ liệu quyền trống</span>
                    )
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Loader2 size={14} className="animate-spin" />
                      Đang tải quyền...
                    </div>
                  )}

                  {role.permissionsLoaded && role.permissions.length > 3 && (
                    <div className="text-[9px] font-black text-indigo-500 pl-3">+{role.permissions.length - 3} QUYỀN KHÁC</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-300 uppercase">Identity Verified</span>
              <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Pagination giống UsersPage */}
      {total > 0 && (
        <div className="flex justify-center mt-10">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={total}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      )}

      {/* Role Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">
                {editingRole ? 'Chỉnh sửa vai trò' : 'Thêm vai trò hệ thống'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900">
                <X size={24} />
              </button>
            </div>

            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  Tên Vai trò
                </label>
                <div className="relative group">
                  <Lock
                    size={18}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
                  />
                  <input
                    type="text"
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold shadow-inner"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ví dụ: SaleManager"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cấp quyền (Permissions)</label>
                  <button
                    onClick={() =>
                      setFormData({ ...formData, claims: [...formData.claims, { type: 'permission', value: '' }] })
                    }
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100"
                    type="button"
                  >
                    + Thêm quyền
                  </button>
                </div>

                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
                  {formData.claims.map((claim, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        className="flex-1 px-4 py-3 text-xs bg-slate-50 rounded-xl outline-none font-bold border border-transparent focus:border-indigo-100"
                        value={claim.value}
                        onChange={(e) => {
                          const newClaims = [...formData.claims];
                          newClaims[idx].value = e.target.value;
                          setFormData({ ...formData, claims: newClaims });
                        }}
                        placeholder="VD: users.view / users.create / roles.manage"
                      />
                      <button
                        onClick={() => setFormData({ ...formData, claims: formData.claims.filter((_, i) => i !== idx) })}
                        className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-slate-50 flex justify-end gap-4 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 text-xs font-black text-slate-400 uppercase tracking-widest"
                type="button"
              >
                Hủy
              </button>

              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-60"
                type="button"
              >
                {isLoading ? 'Đang lưu...' : 'Lưu vào Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10">
          <div className="bg-indigo-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-indigo-800">
            {toastIcon(toast.type)}
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPage;


//     import React, { useState, useMemo, useEffect } from 'react';
//     import { api } from '../services/apiService';
//     import Pagination from '../components/Pagination';
//     import {
//     Shield,
//     ShieldAlert,
//     ShieldCheck,
//     UserPlus,
//     Trash2,
//     Edit3,
//     X,
//     ChevronRight,
//     Lock,
//     Loader2,
//     Check
//     } from 'lucide-react';

//     type ToastType = 'success' | 'error' | 'syncing';

//     const ITEMS_PER_PAGE = 6;

//     type RoleVM = {
//     id: string;
//     name: string;
//     permissions: string[];        // ✅ quyền (role claims type=permission)
//     permissionsLoaded?: boolean;  // ✅ đã load quyền chưa
//     };

//     const RolesPage: React.FC = () => {
//     const [roles, setRoles] = useState<RoleVM[]>([]);
//     const [currentPage, setCurrentPage] = useState(1);
//     const [isLoading, setIsLoading] = useState(false);
//     const [showModal, setShowModal] = useState(false);
//     const [editingRole, setEditingRole] = useState<RoleVM | null>(null);

//     const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

//     // ✅ giữ UI hiện tại: input list claims.value
//     const [formData, setFormData] = useState({
//         name: '',
//         claims: [] as { type: string; value: string }[]
//     });

//     const uniquePermissionsFromForm = () => {
//         const raw = formData.claims
//         .map(x => (x.value ?? '').trim())
//         .filter(Boolean);

//         // unique (case-insensitive)
//         const map = new Map<string, string>();
//         raw.forEach(p => {
//         const key = p.toLowerCase();
//         if (!map.has(key)) map.set(key, p);
//         });

//         return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
//     };

//     useEffect(() => {
//         loadRoles();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     const loadRoles = async () => {
//         setIsLoading(true);
//         setToast({ type: 'syncing', message: 'Đang đồng bộ vai trò...' });
//         try {
//         const data = await api.getRoles(); // [{id,name}]
//         const vm: RoleVM[] = (data || []).map(r => ({
//             id: r.id,
//             name: r.name,
//             permissions: [],
//             permissionsLoaded: false,
//         }));
//         setRoles(vm);
//         setToast({ type: 'success', message: 'Đã tải vai trò thành công' });
//         } catch (error: any) {
//         setToast({ type: 'error', message: error?.message || 'Lỗi tải danh sách vai trò' });
//         } finally {
//         setIsLoading(false);
//         setTimeout(() => setToast(null), 2500);
//         }
//     };

//     const paginatedRoles = useMemo(() => {
//         const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
//         return roles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
//     }, [roles, currentPage]);

//     // Fix currentPage nếu totalItems giảm (xóa role / reload)
//     useEffect(() => {
//         const maxPage = Math.max(1, Math.ceil(roles.length / ITEMS_PER_PAGE));
//         if (currentPage > maxPage) setCurrentPage(maxPage);
//     }, [roles.length, currentPage]);

//     // ✅ Lazy-load quyền cho các role đang hiển thị (tránh gọi N+1 toàn bộ)
//     useEffect(() => {
//         const hydrateVisiblePermissions = async () => {
//         const visible = paginatedRoles.filter(r => !r.permissionsLoaded);

//         if (visible.length === 0) return;

//         try {
//             const results = await Promise.all(
//             visible.map(async (r) => {
//                 // ưu tiên endpoint detail để lấy cả name + permissions (nếu backend có)
//                 // fallback: chỉ lấy permissions
//                 try {
//                 const detail = await api.getRoleDetail(r.id); // {id,name,permissions}
//                 return { id: r.id, permissions: detail.permissions || [] };
//                 } catch {
//                 const perms = await api.getRolePermissions(r.id);
//                 return { id: r.id, permissions: perms || [] };
//                 }
//             })
//             );

//             setRoles(prev => prev.map(x => {
//             const found = results.find(z => z.id === x.id);
//             if (!found) return x;
//             return {
//                 ...x,
//                 permissions: found.permissions,
//                 permissionsLoaded: true,
//             };
//             }));
//         } catch {
//             // không toast ở đây để tránh spam
//         }
//         };

//         hydrateVisiblePermissions();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [currentPage, roles.length]);

//     const openCreateModal = () => {
//         setEditingRole(null);
//         setFormData({ name: '', claims: [] });
//         setShowModal(true);
//     };

//     const openEditModal = async (role: RoleVM) => {
//         setIsLoading(true);
//         try {
//         // ✅ lấy detail mới nhất từ backend để edit đúng
//         const detail = await api.getRoleDetail(role.id); // { id, name, permissions }
//         setEditingRole({ ...role, name: detail.name, permissions: detail.permissions || [], permissionsLoaded: true });

//         setFormData({
//             name: detail.name,
//             claims: (detail.permissions || []).map(p => ({ type: 'permission', value: p })),
//         });

//         // cập nhật state roles cache luôn (để list hiển thị đúng)
//         setRoles(prev => prev.map(x => x.id === role.id
//             ? { ...x, name: detail.name, permissions: detail.permissions || [], permissionsLoaded: true }
//             : x
//         ));

//         setShowModal(true);
//         } catch (e: any) {
//         setToast({ type: 'error', message: e?.message || 'Lỗi tải chi tiết vai trò' });
//         setTimeout(() => setToast(null), 2500);
//         } finally {
//         setIsLoading(false);
//         }
//     };

//     const handleSave = async () => {
//         const name = formData.name.trim();
//         if (!name) {
//         setToast({ type: 'error', message: 'Tên vai trò không được để trống' });
//         setTimeout(() => setToast(null), 2500);
//         return;
//         }

//         const desiredPermissions = uniquePermissionsFromForm();

//         setIsLoading(true);
//         try {
//         if (!editingRole) {
//             // ✅ CREATE role
//             const created = await api.createRole({ name });

//             // ✅ add permissions
//             if (desiredPermissions.length > 0) {
//             await Promise.all(
//                 desiredPermissions.map(p => api.addRolePermission(created.id, p))
//             );
//             }

//             setToast({ type: 'success', message: 'Đã tạo vai trò mới thành công' });
//         } else {
//             // ✅ UPDATE role name
//             await api.updateRole(editingRole.id, { name });

//             // ✅ SYNC permissions (diff)
//             const currentPermissions = await api.getRolePermissions(editingRole.id);

//             const curSet = new Set((currentPermissions || []).map(x => x.toLowerCase()));
//             const desSet = new Set(desiredPermissions.map(x => x.toLowerCase()));

//             const toAdd = desiredPermissions.filter(p => !curSet.has(p.toLowerCase()));
//             const toRemove = (currentPermissions || []).filter(p => !desSet.has(p.toLowerCase()));

//             await Promise.all([
//             ...toAdd.map(p => api.addRolePermission(editingRole.id, p)),
//             ...toRemove.map(p => api.removeRolePermission(editingRole.id, p)),
//             ]);

//             setToast({ type: 'success', message: 'Đã cập nhật vai trò thành công' });
//         }

//         await loadRoles();
//         setShowModal(false);
//         } catch (e: any) {
//         setToast({ type: 'error', message: e?.message || 'Lỗi khi lưu vai trò' });
//         } finally {
//         setIsLoading(false);
//         setTimeout(() => setToast(null), 3000);
//         }
//     };

//     const handleDelete = async (id: string) => {
//         if (!confirm('Xóa vai trò này sẽ gỡ quyền truy cập của tất cả nhân viên thuộc vai trò này?')) return;

//         setIsLoading(true);
//         try {
//         await api.deleteRole(id);
//         setToast({ type: 'success', message: 'Đã xóa vai trò thành công' });
//         await loadRoles();
//         } catch (e: any) {
//         setToast({ type: 'error', message: e?.message || 'Lỗi khi xóa vai trò' });
//         } finally {
//         setIsLoading(false);
//         setTimeout(() => setToast(null), 3000);
//         }
//     };

//     const getRoleIcon = (roleName: string) => {
//         if (roleName.includes('Quản trị')) return <ShieldAlert className="text-rose-500" />;
//         if (roleName.includes('Quản lý')) return <ShieldCheck className="text-indigo-600" />;
//         return <Shield className="text-emerald-500" />;
//     };

//     const toastIcon = (type: ToastType) => {
//         if (type === 'syncing') return <Loader2 size={20} className="animate-spin text-indigo-300" />;
//         if (type === 'success') return <Check size={20} className="text-emerald-400" />;
//         return <ShieldAlert size={20} className="text-rose-300" />;
//     };

//     return (
//         <div className="space-y-8 animate-in fade-in duration-500 relative">
//         <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
//             <div>
//             <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Danh sách phân quyền vai trò</h2>
//             </div>

//             <button
//             onClick={openCreateModal}
//             className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-bold active:scale-95"
//             >
//             <UserPlus size={20} className="mr-2" />
//             Thêm vai trò hệ thống
//             </button>
//         </header>

//         {isLoading && !showModal && (
//             <div className="absolute inset-0 top-32 flex flex-col items-center justify-center gap-4 text-indigo-500 bg-white/50 backdrop-blur-sm z-10 rounded-[2.5rem]">
//             <Loader2 size={40} className="animate-spin" />
//             <span className="font-black uppercase tracking-widest text-xs">Đang đồng bộ vai trò...</span>
//             </div>
//         )}

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {paginatedRoles.map((role) => (
//             <div
//                 key={role.id}
//                 className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all group flex flex-col justify-between border-b-4 border-b-transparent hover:border-b-indigo-500"
//             >
//                 <div>
//                 <div className="flex justify-between items-start mb-6">
//                     <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
//                     {getRoleIcon(role.name)}
//                     </div>
//                     <div className="flex gap-1">
//                     <button
//                         onClick={() => openEditModal(role)}
//                         className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
//                     >
//                         <Edit3 size={18} />
//                     </button>
//                     <button
//                         onClick={() => handleDelete(role.id)}
//                         className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
//                     >
//                         <Trash2 size={18} />
//                     </button>
//                     </div>
//                 </div>

//                 <h3 className="text-xl font-extrabold text-slate-900 mb-2">{role.name}</h3>
//                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
//                     ID: {role.id.substring(0, 8)}...
//                 </p>

//                 <div className="space-y-4">
//                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Danh mục quyền hạn</span>

//                     <div className="space-y-2">
//                     {role.permissionsLoaded ? (
//                         role.permissions.length > 0 ? (
//                         role.permissions.slice(0, 3).map((p, idx) => (
//                             <div
//                             key={idx}
//                             className="flex items-center text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl"
//                             >
//                             <ChevronRight size={14} className="text-indigo-400 mr-2" />
//                             {p}
//                             </div>
//                         ))
//                         ) : (
//                         <span className="text-xs text-slate-300 italic">Dữ liệu quyền trống</span>
//                         )
//                     ) : (
//                         <div className="flex items-center gap-2 text-xs text-slate-400">
//                         <Loader2 size={14} className="animate-spin" />
//                         Đang tải quyền...
//                         </div>
//                     )}

//                     {role.permissionsLoaded && role.permissions.length > 3 && (
//                         <div className="text-[9px] font-black text-indigo-500 pl-3">+{role.permissions.length - 3} QUYỀN KHÁC</div>
//                     )}
//                     </div>
//                 </div>
//                 </div>

//                 <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
//                 <span className="text-[10px] font-bold text-slate-300 uppercase">Identity Verified</span>
//                 <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
//                 </div>
//             </div>
//             ))}
//         </div>

//         <div className="flex justify-center mt-10">
//             <Pagination
//             currentPage={currentPage}
//             totalItems={roles.length}
//             itemsPerPage={ITEMS_PER_PAGE}
//             onPageChange={setCurrentPage}
//             />
//         </div>

//         {/* Role Modal */}
//         {showModal && (
//             <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
//             <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 duration-300">
//                 <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
//                 <h3 className="text-2xl font-black text-slate-900">
//                     {editingRole ? 'Chỉnh sửa vai trò' : 'Thêm vai trò hệ thống'}
//                 </h3>
//                 <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900">
//                     <X size={24} />
//                 </button>
//                 </div>

//                 <div className="p-10 space-y-6">
//                 <div className="space-y-2">
//                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
//                     Tên Vai trò
//                     </label>
//                     <div className="relative group">
//                     <Lock
//                         size={18}
//                         className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
//                     />
//                     <input
//                         type="text"
//                         className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold shadow-inner"
//                         value={formData.name}
//                         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                         placeholder="Ví dụ: SaleManager"
//                     />
//                     </div>
//                 </div>

//                 <div className="pt-4 border-t border-slate-50">
//                     <div className="flex justify-between items-center mb-4">
//                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cấp quyền (Permissions)</label>
//                     <button
//                         onClick={() =>
//                         setFormData({ ...formData, claims: [...formData.claims, { type: 'permission', value: '' }] })
//                         }
//                         className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100"
//                         type="button"
//                     >
//                         + Thêm quyền
//                     </button>
//                     </div>

//                     <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
//                     {formData.claims.map((claim, idx) => (
//                         <div key={idx} className="flex gap-2 items-center">
//                         <input
//                             type="text"
//                             className="flex-1 px-4 py-3 text-xs bg-slate-50 rounded-xl outline-none font-bold border border-transparent focus:border-indigo-100"
//                             value={claim.value}
//                             onChange={(e) => {
//                             const newClaims = [...formData.claims];
//                             newClaims[idx].value = e.target.value;
//                             setFormData({ ...formData, claims: newClaims });
//                             }}
//                             placeholder="VD: users.view / users.create / roles.manage"
//                         />
//                         <button
//                             onClick={() => setFormData({ ...formData, claims: formData.claims.filter((_, i) => i !== idx) })}
//                             className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
//                             type="button"
//                         >
//                             <Trash2 size={16} />
//                         </button>
//                         </div>
//                     ))}
//                     </div>
//                 </div>
//                 </div>

//                 <div className="px-10 py-8 bg-slate-50 flex justify-end gap-4 border-t border-slate-100">
//                 <button
//                     onClick={() => setShowModal(false)}
//                     className="px-6 py-2.5 text-xs font-black text-slate-400 uppercase tracking-widest"
//                     type="button"
//                 >
//                     Hủy
//                 </button>

//                 <button
//                     onClick={handleSave}
//                     disabled={isLoading}
//                     className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-60"
//                     type="button"
//                 >
//                     {isLoading ? 'Đang lưu...' : 'Lưu vào Database'}
//                 </button>
//                 </div>
//             </div>
//             </div>
//         )}

//         {/* Toast */}
//         {toast && (
//             <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10">
//             <div className="bg-indigo-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-indigo-800">
//                 {toastIcon(toast.type)}
//                 <span className="font-bold text-sm tracking-tight">{toast.message}</span>
//             </div>
//             </div>
//         )}
//         </div>
//     );
//     };

//     export default RolesPage;


// // import React, { useState, useMemo, useEffect } from 'react';
// // import { AspNetRole } from '../types';
// // import { api } from '../services/apiService';
// // import Pagination from '../components/Pagination';
// // import {
// //   Shield,
// //   ShieldAlert,
// //   ShieldCheck,
// //   UserPlus,
// //   Trash2,
// //   Edit3,
// //   X,
// //   ChevronRight,
// //   Lock,
// //   Loader2,
// //   Check
// // } from 'lucide-react';

// // type ToastType = 'success' | 'error' | 'syncing';

// // const ITEMS_PER_PAGE = 6;

// // const RolesPage: React.FC = () => {
// //   // ✅ Không truyền props nữa -> tự quản lý roles
// //   const [roles, setRoles] = useState<AspNetRole[]>([]);

// //   const [currentPage, setCurrentPage] = useState(1);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const [showModal, setShowModal] = useState(false);
// //   const [editingRole, setEditingRole] = useState<AspNetRole | null>(null);

// //   const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

// //   const [formData, setFormData] = useState({
// //     name: '',
// //     claims: [] as { type: string; value: string }[]
// //   });

// //   useEffect(() => {
// //     loadData();
// //     // eslint-disable-next-line react-hooks/exhaustive-deps
// //   }, []);

// //   const loadData = async () => {
// //     setIsLoading(true);
// //     setToast({ type: 'syncing', message: 'Đang đồng bộ vai trò...' });
// //     try {
// //       const data = await api.getRoles();
// //       setRoles(data || []);
// //       setToast({ type: 'success', message: 'Đã tải vai trò thành công' });
// //     } catch (error: any) {
// //       setToast({ type: 'error', message: error?.message || 'Lỗi tải danh sách vai trò' });
// //     } finally {
// //       setIsLoading(false);
// //       setTimeout(() => setToast(null), 2500);
// //     }
// //   };

// //   const paginatedRoles = useMemo(() => {
// //     const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
// //     return roles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
// //   }, [roles, currentPage]);

// //   // Fix currentPage nếu totalItems giảm (xóa role / reload)
// //   useEffect(() => {
// //     const maxPage = Math.max(1, Math.ceil(roles.length / ITEMS_PER_PAGE));
// //     if (currentPage > maxPage) setCurrentPage(maxPage);
// //   }, [roles.length, currentPage]);

// //   const openCreateModal = () => {
// //     setEditingRole(null);
// //     setFormData({ name: '', claims: [] });
// //     setShowModal(true);
// //   };

// //   const openEditModal = (role: AspNetRole) => {
// //     setEditingRole(role);
// //     setFormData({
// //       name: role.name,
// //       claims: role.claims ? role.claims.map(c => ({ type: c.claimType, value: c.claimValue })) : []
// //     });
// //     setShowModal(true);
// //   };

// //   const handleSave = async () => {
// //     if (!formData.name.trim()) {
// //       setToast({ type: 'error', message: 'Tên vai trò không được để trống' });
// //       setTimeout(() => setToast(null), 2500);
// //       return;
// //     }

// //     setIsLoading(true);
// //     try {
// //       if (editingRole) {
// //         await api.updateRole(editingRole.id, formData);
// //         setToast({ type: 'success', message: 'Đã cập nhật vai trò thành công' });
// //       } else {
// //         await api.createRole(formData);
// //         setToast({ type: 'success', message: 'Đã tạo vai trò mới thành công' });
// //       }
// //       await loadData();
// //       setShowModal(false);
// //     } catch (e: any) {
// //       setToast({ type: 'error', message: e?.message || 'Lỗi khi lưu vai trò' });
// //     } finally {
// //       setIsLoading(false);
// //       setTimeout(() => setToast(null), 3000);
// //     }
// //   };

// //   const handleDelete = async (id: string) => {
// //     if (!confirm('Xóa vai trò này sẽ gỡ quyền truy cập của tất cả nhân viên thuộc vai trò này?')) return;

// //     setIsLoading(true);
// //     try {
// //       await api.deleteRole(id);
// //       setToast({ type: 'success', message: 'Đã xóa vai trò thành công' });
// //       await loadData();
// //     } catch (e: any) {
// //       setToast({ type: 'error', message: e?.message || 'Lỗi khi xóa vai trò' });
// //     } finally {
// //       setIsLoading(false);
// //       setTimeout(() => setToast(null), 3000);
// //     }
// //   };

// //   const getRoleIcon = (roleName: string) => {
// //     if (roleName.includes('Quản trị')) return <ShieldAlert className="text-rose-500" />;
// //     if (roleName.includes('Quản lý')) return <ShieldCheck className="text-indigo-600" />;
// //     return <Shield className="text-emerald-500" />;
// //   };

// //   const toastIcon = (type: ToastType) => {
// //     if (type === 'syncing') return <Loader2 size={20} className="animate-spin text-indigo-300" />;
// //     if (type === 'success') return <Check size={20} className="text-emerald-400" />;
// //     return <ShieldAlert size={20} className="text-rose-300" />;
// //   };

// //   return (
// //     <div className="space-y-8 animate-in fade-in duration-500 relative">
// //       <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
// //         <div>
// //           <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Danh sách phân quyền vai trò</h2>
// //           {/* <p className="text-slate-500 font-medium">
// //             Bản đồ quyền hạn từ{' '}
// //             <code className="bg-slate-100 px-2 py-0.5 rounded text-indigo-600 font-bold">RoleManager</code>
// //           </p> */}
// //         </div>

// //         <button
// //           onClick={openCreateModal}
// //           className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 font-bold active:scale-95"
// //         >
// //           <UserPlus size={20} className="mr-2" />
// //           Thêm vai trò hệ thống
// //         </button>
// //       </header>

// //       {isLoading && !showModal && (
// //         <div className="absolute inset-0 top-32 flex flex-col items-center justify-center gap-4 text-indigo-500 bg-white/50 backdrop-blur-sm z-10 rounded-[2.5rem]">
// //           <Loader2 size={40} className="animate-spin" />
// //           <span className="font-black uppercase tracking-widest text-xs">Đang đồng bộ vai trò...</span>
// //         </div>
// //       )}

// //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
// //         {paginatedRoles.map((role) => (
// //           <div
// //             key={role.id}
// //             className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all group flex flex-col justify-between border-b-4 border-b-transparent hover:border-b-indigo-500"
// //           >
// //             <div>
// //               <div className="flex justify-between items-start mb-6">
// //                 <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
// //                   {getRoleIcon(role.name)}
// //                 </div>
// //                 <div className="flex gap-1">
// //                   <button
// //                     onClick={() => openEditModal(role)}
// //                     className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
// //                   >
// //                     <Edit3 size={18} />
// //                   </button>
// //                   <button
// //                     onClick={() => handleDelete(role.id)}
// //                     className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
// //                   >
// //                     <Trash2 size={18} />
// //                   </button>
// //                 </div>
// //               </div>

// //               <h3 className="text-xl font-extrabold text-slate-900 mb-2">{role.name}</h3>
// //               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
// //                 ID: {role.id.substring(0, 8)}...
// //               </p>

// //               <div className="space-y-4">
// //                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Danh mục quyền hạn</span>

// //                 <div className="space-y-2">
// //                   {role.claims && role.claims.length > 0 ? (
// //                     role.claims.slice(0, 3).map((claim, idx) => (
// //                       <div
// //                         key={idx}
// //                         className="flex items-center text-[11px] font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl"
// //                       >
// //                         <ChevronRight size={14} className="text-indigo-400 mr-2" />
// //                         {claim.claimValue}
// //                       </div>
// //                     ))
// //                   ) : (
// //                     <span className="text-xs text-slate-300 italic">Dữ liệu quyền trống</span>
// //                   )}

// //                   {role.claims && role.claims.length > 3 && (
// //                     <div className="text-[9px] font-black text-indigo-500 pl-3">+{role.claims.length - 3} QUYỀN KHÁC</div>
// //                   )}
// //                 </div>
// //               </div>
// //             </div>

// //             <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
// //               <span className="text-[10px] font-bold text-slate-300 uppercase">Identity Verified</span>
// //               <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></div>
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       <div className="flex justify-center mt-10">
// //         <Pagination
// //           currentPage={currentPage}
// //           totalItems={roles.length}
// //           itemsPerPage={ITEMS_PER_PAGE}
// //           onPageChange={setCurrentPage}
// //         />
// //       </div>

// //       {/* Role Modal */}
// //       {showModal && (
// //         <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
// //           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden transform animate-in zoom-in-95 duration-300">
// //             <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
// //               <h3 className="text-2xl font-black text-slate-900">
// //                 {editingRole ? 'Chỉnh sửa vai trò' : 'Thêm vai trò hệ thống'}
// //               </h3>
// //               <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-900">
// //                 <X size={24} />
// //               </button>
// //             </div>

// //             <div className="p-10 space-y-6">
// //               <div className="space-y-2">
// //                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
// //                   Tên Vai trò
// //                 </label>
// //                 <div className="relative group">
// //                   <Lock
// //                     size={18}
// //                     className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
// //                   />
// //                   <input
// //                     type="text"
// //                     className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none font-bold shadow-inner"
// //                     value={formData.name}
// //                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
// //                     placeholder="Ví dụ: SaleManager"
// //                   />
// //                 </div>
// //               </div>

// //               <div className="pt-4 border-t border-slate-50">
// //                 <div className="flex justify-between items-center mb-4">
// //                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cấp quyền (Claims)</label>
// //                   <button
// //                     onClick={() => setFormData({ ...formData, claims: [...formData.claims, { type: 'Permission', value: '' }] })}
// //                     className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100"
// //                     type="button"
// //                   >
// //                     + Thêm quyền
// //                   </button>
// //                 </div>

// //                 <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar">
// //                   {formData.claims.map((claim, idx) => (
// //                     <div key={idx} className="flex gap-2 items-center">
// //                       <input
// //                         type="text"
// //                         className="flex-1 px-4 py-3 text-xs bg-slate-50 rounded-xl outline-none font-bold border border-transparent focus:border-indigo-100"
// //                         value={claim.value}
// //                         onChange={(e) => {
// //                           const newClaims = [...formData.claims];
// //                           newClaims[idx].value = e.target.value;
// //                           setFormData({ ...formData, claims: newClaims });
// //                         }}
// //                         placeholder="Giá trị (VD: User.Edit)"
// //                       />
// //                       <button
// //                         onClick={() => setFormData({ ...formData, claims: formData.claims.filter((_, i) => i !== idx) })}
// //                         className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
// //                         type="button"
// //                       >
// //                         <Trash2 size={16} />
// //                       </button>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             </div>

// //             <div className="px-10 py-8 bg-slate-50 flex justify-end gap-4 border-t border-slate-100">
// //               <button
// //                 onClick={() => setShowModal(false)}
// //                 className="px-6 py-2.5 text-xs font-black text-slate-400 uppercase tracking-widest"
// //                 type="button"
// //               >
// //                 Hủy
// //               </button>

// //               <button
// //                 onClick={handleSave}
// //                 disabled={isLoading}
// //                 className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-60"
// //                 type="button"
// //               >
// //                 {isLoading ? 'Đang lưu...' : 'Lưu vào Database'}
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Toast */}
// //       {toast && (
// //         <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10">
// //           <div className="bg-indigo-900 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border border-indigo-800">
// //             {toastIcon(toast.type)}
// //             <span className="font-bold text-sm tracking-tight">{toast.message}</span>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default RolesPage;
