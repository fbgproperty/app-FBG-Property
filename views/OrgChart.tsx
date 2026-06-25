import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck, PenLine, CheckCircle2, Clock, Save, Crown } from 'lucide-react';
import { api } from '../services/apiService';
import { isAdminRole, getRole } from '../services/permissions';

const getUser = () => { try { return JSON.parse(localStorage.getItem('fbg_user') || '{}'); } catch { return {}; } };
const ROLE_ORDER = ['ceo', 'gd_du_an', 'gd_kinh_doanh', 'tp_kinh_doanh', 'sale', 'ctv', 'admin_du_an', 'ke_toan', 'marketing'];

const OrgChart: React.FC = () => {
  const user = getUser();
  const myEmail = (user.email || '').toLowerCase();
  const admin = isAdminRole(getRole());
  const [members, setMembers] = useState<any[]>([]);
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Record<string, any>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [m, mine] = await Promise.all([api.orgMembers(), api.orgMe(myEmail)]);
      setMembers(m.items || []); setRoles(m.roles || {}); setMe(mine);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const sign = async () => {
    try { await api.orgSign(myEmail, user.name); await load(); } catch (e: any) { alert(e?.message); }
  };
  const saveMember = async (email: string) => {
    const e = edit[email] || {};
    try { await api.orgSet({ email, role: e.role, manager: e.manager, approved: e.approved }); await load(); setEdit((s) => { const n = { ...s }; delete n[email]; return n; }); }
    catch (er: any) { alert(er?.message); }
  };
  const nameOf = (email: string) => members.find((m) => m.email === email)?.name || email || '—';

  if (loading) return <div className="h-full flex items-center justify-center text-indigo-600"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  const grouped = ROLE_ORDER.map((r) => ({ role: r, label: roles[r] || r, people: members.filter((m) => m.role === r) })).filter((g) => g.people.length);
  const pending = members.filter((m) => !m.approved);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><ShieldCheck className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Sơ đồ tổ chức</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Vai trò · cấp trên · ký duyệt nhân sự</p>
        </div>
      </header>

      {/* Trạng thái của tôi */}
      {me && (
        <div className={`rounded-2xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${me.approved ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <p className="text-sm font-bold text-slate-700">
            Bạn: <b>{me.name || myEmail}</b> — vai trò <b>{me.roleLabel}</b>
            {me.manager ? <> · dưới quyền <b>{nameOf(me.manager)}</b></> : null}
            {' · '}{me.approved ? <span className="text-emerald-700">đã ký duyệt ✓</span> : <span className="text-amber-700">chưa ký</span>}
          </p>
          {!me.approved && (
            <button onClick={sign} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl font-black text-sm hover:bg-amber-700">
              <PenLine className="w-4 h-4" /> Ký xác nhận tham gia
            </button>
          )}
        </div>
      )}

      {/* Admin: nhân sự chờ duyệt */}
      {admin && pending.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-black text-amber-600 uppercase tracking-wide mb-2 flex items-center gap-1"><Clock className="w-4 h-4" /> Chờ ký/duyệt ({pending.length})</p>
          <div className="flex flex-wrap gap-2">
            {pending.map((m) => <span key={m.email} className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-700 text-xs font-bold">{m.name || m.email}</span>)}
          </div>
        </div>
      )}

      {/* Sơ đồ theo cấp bậc */}
      <div className="space-y-5">
        {grouped.map((g) => (
          <div key={g.role}>
            <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              {g.role === 'ceo' && <Crown className="w-3.5 h-3.5 text-amber-500" />}{g.label} ({g.people.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {g.people.map((m) => {
                const e = edit[m.email];
                return (
                  <div key={m.email} className="bg-white rounded-2xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-black text-slate-900 truncate">{m.name || m.email}</p>
                        <p className="text-[11px] text-slate-400 font-semibold truncate">{m.email}</p>
                      </div>
                      {m.approved ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Clock className="w-5 h-5 text-amber-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 font-bold mt-2">{m.roleLabel}{m.manager ? <span className="text-slate-400"> · dưới quyền {nameOf(m.manager)}</span> : null}</p>

                    {admin && (
                      e ? (
                        <div className="mt-3 space-y-2">
                          <select value={e.role} onChange={(ev) => setEdit((s) => ({ ...s, [m.email]: { ...e, role: ev.target.value } }))} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold">
                            {ROLE_ORDER.map((r) => <option key={r} value={r}>{roles[r] || r}</option>)}
                          </select>
                          <select value={e.manager} onChange={(ev) => setEdit((s) => ({ ...s, [m.email]: { ...e, manager: ev.target.value } }))} className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold">
                            <option value="">— không có cấp trên —</option>
                            {members.filter((x) => x.email !== m.email).map((x) => <option key={x.email} value={x.email}>{x.name || x.email}</option>)}
                          </select>
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={!!e.approved} onChange={(ev) => setEdit((s) => ({ ...s, [m.email]: { ...e, approved: ev.target.checked } }))} /> Đã duyệt</label>
                          <button onClick={() => saveMember(m.email)} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-black text-xs hover:bg-emerald-700"><Save className="w-3.5 h-3.5" /> Lưu</button>
                        </div>
                      ) : (
                        <button onClick={() => setEdit((s) => ({ ...s, [m.email]: { role: m.role, manager: m.manager, approved: m.approved } }))} className="mt-3 text-xs font-black text-indigo-600 hover:text-indigo-800">Sửa vai trò / cấp trên</button>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrgChart;
