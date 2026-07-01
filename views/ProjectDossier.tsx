import React, { useEffect, useState } from 'react';
import { FileSearch, Loader2, Sparkles, Copy, Check, AlertTriangle, FileText } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);

const ProjectDossier: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sources, setSources] = useState(0);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getDeployProjects().then((r: any) => {
      setProjects(arr(r));
    }).catch(() => { /* */ });
  }, []);

  const gen = async () => {
    if (!project) { setErr('Chọn dự án.'); return; }
    setErr(''); setLoading(true); setText(''); setSources(0);
    try {
      const r = await api.estateDossier(project);
      setText(r?.text || '');
      setSources(Number(r?.sources) || 0);
    } catch (e: any) { setErr(e?.message || 'Không lập được hồ sơ dự án.'); }
    setLoading(false);
  };

  const copy = () => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center gap-2"><FileSearch className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Hồ sơ dự án (Trợ lý AI)</span></div>
        <p className="text-xs text-slate-400 -mt-2">Trợ lý AI tổng hợp hồ sơ dự án từ tài liệu: vị trí · quy mô · sản phẩm · tiện ích · pháp lý · chính sách · điểm bán. Có thể mất khoảng 30 giây.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={project} onChange={e => setProject(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="">— chọn dự án —</option>
            {projects.map((p: any, i: number) => <option key={p?.name || i} value={p?.name}>{p?.name}</option>)}
          </select>
          <button onClick={gen} disabled={loading} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Lập hồ sơ
          </button>
        </div>
        {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="flex justify-center text-indigo-600 mb-3"><Loader2 className="w-7 h-7 animate-spin" /></div>
          <p className="text-sm font-black text-slate-700">Trợ lý AI đang phân tích…</p>
          <p className="text-[12px] text-slate-400 mt-1">Đang đọc tài liệu dự án và soạn hồ sơ, vui lòng chờ trong giây lát.</p>
        </div>
      )}

      {text && !loading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><FileText className="w-4 h-4" /></div>
              <div>
                <div className="font-black text-slate-900 text-sm leading-none">{project || 'Hồ sơ dự án'}</div>
                <div className="text-[11px] text-slate-400 font-bold mt-1">nguồn tài liệu: {sources}</div>
              </div>
            </div>
            <button onClick={copy} className="inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>
          </div>
          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-2xl p-4">{text}</div>
        </div>
      )}
    </div>
  );
};

export default ProjectDossier;
