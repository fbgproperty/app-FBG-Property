import React, { useEffect, useState } from 'react';
import {
  Crown, Briefcase, Building2, Megaphone, HeartHandshake, Users, Phone, Bot,
  ChevronDown, ChevronRight, Sparkles, Loader2, Pencil, Save, Plus, Trash2, X
} from 'lucide-react';
import { api } from '../services/apiService';
import { isAdminRole, getRole } from '../services/permissions';

type N = {
  id: string; name: string; agent?: string; role: string; manager?: string | null;
  dept?: string; sponsor?: string; kpi?: string; status?: string;
};

const ROLES: { id: string; label: string }[] = [
  { id: 'ceo', label: 'CEO · Tham mưu trưởng' },
  { id: 'gd_kinh_doanh', label: 'GĐ Kinh doanh' },
  { id: 'gd_du_an', label: 'GĐ Dự án' },
  { id: 'tp_kinh_doanh', label: 'Trưởng nhóm' },
  { id: 'sale', label: 'Sale / Telesale' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'cham_soc', label: 'Chăm sóc khách' },
  { id: 'project', label: 'Agent kiến thức dự án' },
];
const META: Record<string, { icon: any; color: string }> = {
  ceo: { icon: Crown, color: 'amber' }, gd_kinh_doanh: { icon: Briefcase, color: 'indigo' },
  gd_du_an: { icon: Building2, color: 'emerald' }, tp_kinh_doanh: { icon: Users, color: 'blue' },
  sale: { icon: Phone, color: 'slate' }, marketing: { icon: Megaphone, color: 'fuchsia' },
  cham_soc: { icon: HeartHandshake, color: 'rose' }, project: { icon: Sparkles, color: 'teal' },
};
const COLORS: Record<string, string> = {
  amber: 'bg-amber-500', indigo: 'bg-indigo-600', emerald: 'bg-emerald-600', blue: 'bg-blue-500',
  fuchsia: 'bg-fuchsia-600', rose: 'bg-rose-500', teal: 'bg-teal-500', slate: 'bg-slate-400',
};

const NodeCard: React.FC<{ n: N; kids: Record<string, N[]>; depth: number }> = ({ n, kids, depth }) => {
  const [open, setOpen] = useState(depth < 2);
  const m = META[n.role] || META.sale;
  const Icon = m.icon;
  const children = kids[n.id] || [];
  const has = children.length > 0;
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-start gap-2">
        {has && (
          <button onClick={() => setOpen(o => !o)} className="mt-3 text-slate-400 hover:text-slate-600">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm px-4 py-3 min-w-[230px] ${depth === 0 ? 'ring-2 ring-amber-200' : ''}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${COLORS[m.color]} flex items-center justify-center text-white shrink-0`}><Icon className="w-5 h-5" /></div>
            <div className="min-w-0">
              <div className="font-black text-slate-900 text-sm leading-tight">{n.name}</div>
              <div className="text-[11px] text-slate-400 font-bold">{n.agent || '—'} · {n.dept || ''}</div>
            </div>
            {n.status === 'Active' && <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500" />}
          </div>
          {n.kpi && <div className="text-[11px] text-slate-500 mt-2 leading-snug"><b className="text-slate-600">KPI:</b> {n.kpi}</div>}
          {n.sponsor && <div className="text-[10px] text-amber-600 font-bold mt-1">Người bảo trợ: {n.sponsor}</div>}
        </div>
      </div>
      {has && open && (
        <div className="ml-6 mt-2 pl-5 border-l-2 border-dashed border-slate-200 flex flex-col gap-2">
          {children.map(c => <NodeCard key={c.id} n={c} kids={kids} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
};

const AIOrgChart: React.FC = () => {
  const admin = isAdminRole(getRole());
  const [nodes, setNodes] = useState<N[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<N[]>([]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await api.aiOrgGet(); setNodes(r.items || []); } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const startEdit = () => { setDraft(JSON.parse(JSON.stringify(nodes))); setEditing(true); };
  const save = async () => {
    setSaving(true);
    try { await api.aiOrgSet(draft); setNodes(draft); setEditing(false); } catch (e: any) { alert(e?.message || 'Lỗi lưu'); } finally { setSaving(false); }
  };
  const upd = (i: number, k: keyof N, v: any) => setDraft(d => d.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const addRow = () => setDraft(d => [...d, { id: 'node' + Date.now(), name: 'Vai trò mới', agent: '', role: 'sale', manager: 'ceo', dept: '', kpi: '', status: 'Idle' }]);
  const delRow = (i: number) => setDraft(d => d.filter((_, j) => j !== i));

  if (loading) return <div className="h-full flex items-center justify-center text-indigo-600"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  // dựng cây
  const kids: Record<string, N[]> = {};
  nodes.forEach(n => { const m = n.manager || '_root'; (kids[m] = kids[m] || []).push(n); });
  const ids = new Set(nodes.map(n => n.id));
  const roots = nodes.filter(n => !n.manager || !ids.has(n.manager));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><Bot className="w-6 h-6" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-none">Sơ đồ đội ngũ AI</h2>
            <p className="text-sm text-slate-400 font-semibold mt-1">Định danh theo vai trò · ai dưới quyền ai · Anh Duy là Hội đồng quản trị</p>
          </div>
        </div>
        {admin && !editing && (
          <button onClick={startEdit} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700"><Pencil className="w-4 h-4" /> Chỉnh sơ đồ</button>
        )}
        {editing && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm"><X className="w-4 h-4" /> Hủy</button>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 disabled:opacity-60">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu</button>
          </div>
        )}
      </header>

      <div className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm text-slate-700">
        <b className="text-amber-700">Nguyên tắc:</b> AI Commander (CEO agent) lập kế hoạch + giao việc + báo cáo <b>Anh Duy duyệt</b>.
        Mọi tin gửi khách / cuộc gọi / báo giá / cọc / hợp đồng <b>phải có người duyệt</b>. AI làm số lượng & tốc độ; sale người chốt.
      </div>

      {!editing ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-5 overflow-x-auto">
          {roots.map(r => <NodeCard key={r.id} n={r} kids={kids} depth={0} />)}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 p-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 font-black text-xs border-b border-slate-100">
              <th className="py-2 pr-2">Tên hiển thị</th><th className="pr-2">Agent</th><th className="pr-2">Vai trò</th>
              <th className="pr-2">Cấp trên</th><th className="pr-2">Phòng ban</th><th className="pr-2">KPI</th><th></th>
            </tr></thead>
            <tbody>
              {draft.map((n, i) => (
                <tr key={n.id} className="border-b border-slate-50">
                  <td className="py-1.5 pr-2"><input value={n.name} onChange={e => upd(i, 'name', e.target.value)} className="w-36 p-1.5 rounded-lg border border-slate-200 text-xs" /></td>
                  <td className="pr-2"><input value={n.agent || ''} onChange={e => upd(i, 'agent', e.target.value)} className="w-28 p-1.5 rounded-lg border border-slate-200 text-xs" /></td>
                  <td className="pr-2"><select value={n.role} onChange={e => upd(i, 'role', e.target.value)} className="p-1.5 rounded-lg border border-slate-200 text-xs">{ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></td>
                  <td className="pr-2"><select value={n.manager || ''} onChange={e => upd(i, 'manager', e.target.value || null)} className="p-1.5 rounded-lg border border-slate-200 text-xs"><option value="">— (gốc)</option>{draft.filter(x => x.id !== n.id).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></td>
                  <td className="pr-2"><input value={n.dept || ''} onChange={e => upd(i, 'dept', e.target.value)} className="w-24 p-1.5 rounded-lg border border-slate-200 text-xs" /></td>
                  <td className="pr-2"><input value={n.kpi || ''} onChange={e => upd(i, 'kpi', e.target.value)} className="w-44 p-1.5 rounded-lg border border-slate-200 text-xs" /></td>
                  <td><button onClick={() => delRow(i)} className="text-rose-500 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl font-black text-xs hover:bg-slate-200"><Plus className="w-4 h-4" /> Thêm vai trò</button>
        </div>
      )}
    </div>
  );
};

export default AIOrgChart;
