import React, { useEffect, useState } from 'react';
import { ClipboardList, Loader2, Sparkles, Copy, Check, Save, AlertTriangle } from 'lucide-react';
import { api } from '../services/apiService';

const SalePlanner: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [units, setUnits] = useState('');
  const [price, setPrice] = useState('');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getProjectsCbx().then((r: any) => {
      const items = r?.items || r?.data?.items || r?.data || [];
      setProjects(Array.isArray(items) ? items : []);
    }).catch(() => { /* */ });
  }, []);

  const gen = async () => {
    if (!project) { setErr('Chọn dự án.'); return; }
    setErr(''); setLoading(true); setText(''); setSaved(false);
    try {
      const r = await api.estateSalePlan({ project, units, price, target });
      setText(r?.text || '');
    } catch (e: any) { setErr(e?.message || 'Lỗi'); }
    setLoading(false);
  };
  const copy = () => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const save = async () => {
    const p = projects.find((x: any) => x.name === project);
    const pid = p?.id || p?.slug || project;
    setSaving(true); setErr('');
    try {
      const existing = await api.getDeployPlan(pid).catch(() => ({}));
      await api.saveDeployPlan(pid, { ...(existing || {}), salePlanAI: text, salePlanUpdatedAt: new Date().toISOString() });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setErr('Lưu kế hoạch lỗi: ' + (e?.message || '') + ' (kế hoạch vẫn copy được)'); }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Sales planner — AI lập kế hoạch bán dự án</span></div>
      <p className="text-xs text-slate-400 -mt-2">AI bám tài liệu dự án (RAG) lập kế hoạch: mục tiêu · giai đoạn · kênh · đội sale · chính sách giá · KPI · rủi ro. Lưu vào hồ sơ triển khai.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={project} onChange={e => setProject(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 text-sm">
          <option value="">— chọn dự án —</option>
          {projects.map((p: any) => <option key={p.id || p.slug || p.name} value={p.name}>{p.name}</option>)}
        </select>
        <input value={target} onChange={e => setTarget(e.target.value)} placeholder="Mục tiêu (vd: bán hết GĐ1 trong 3 tháng)" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
        <input value={units} onChange={e => setUnits(e.target.value)} placeholder="Giỏ hàng (vd: 120 căn 1-3PN)" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
        <input value={price} onChange={e => setPrice(e.target.value)} placeholder="Giá (vd: từ 2,4 tỷ)" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
      </div>
      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}
      <button onClick={gen} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Lập kế hoạch bán
      </button>
      {text && (
        <>
          <div className="relative">
            <button onClick={copy} className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-2xl p-4 pr-16">{text}</div>
          </div>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />} {saved ? 'Đã lưu vào hồ sơ triển khai' : 'Lưu kế hoạch'}
          </button>
        </>
      )}
    </div>
  );
};

export default SalePlanner;
