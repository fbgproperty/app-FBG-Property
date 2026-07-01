import React, { useState } from 'react';
import { Target, Loader2, Sparkles, Copy, Check, AlertTriangle, Building2 } from 'lucide-react';
import { api } from '../services/apiService';

const nn = (x: any) => Number(x) || 0;

const OptimizePanel: React.FC = () => {
  const [optimize, setOptimize] = useState('');
  const [byProject, setByProject] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [ran, setRan] = useState(false);

  const run = async () => {
    setLoading(true); setErr(''); setOptimize(''); setByProject([]);
    try {
      const r: any = await api.reportOptimize();
      setOptimize(r?.optimize || '');
      setByProject(Array.isArray(r?.byProject) ? r.byProject.slice(0, 10) : []);
      setRan(true);
    } catch (e: any) { setErr(e?.message || 'Không phân tích được lúc này.'); }
    setLoading(false);
  };
  const copy = () => { navigator.clipboard?.writeText(optimize); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1"><Target className="w-5 h-5" /><span className="font-black">Tối ưu tập trung (Trợ lý AI)</span></div>
            <p className="text-sm opacity-90">Trợ lý AI chỉ ra nơi nên dồn sức để tăng tỷ lệ chốt và giá trị.</p>
          </div>
          <button onClick={run} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-xl font-black text-sm hover:bg-indigo-50 disabled:opacity-60 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Phân tích tối ưu
          </button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-indigo-600 font-bold text-sm"><Loader2 className="w-6 h-6 animate-spin" /> Trợ lý AI đang phân tích…</div>
      )}

      {!loading && optimize && (
        <div className="relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <button onClick={copy} className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Khuyến nghị tối ưu</span></div>
          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pr-16">{optimize}</div>
        </div>
      )}

      {!loading && byProject.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Hiệu quả theo dự án</span></div>
          <div className="space-y-3">
            {byProject.map((p: any, i: number) => {
              const won = nn(p?.won), assigned = nn(p?.assigned);
              const rate = Math.max(0, Math.min(100, Math.round(nn(p?.winRate))));
              const w = Math.max(2, rate);
              return (
                <div key={p?.project || i}>
                  <div className="flex items-center justify-between mb-1 text-[12px]">
                    <span className="font-black text-slate-700 truncate pr-2">{p?.project || 'Chưa rõ'}</span>
                    <span className="font-bold text-slate-400 shrink-0">chốt {won}/{assigned} · {rate}%{p?.value != null && ` · ${nn(p?.value).toLocaleString('vi-VN')}`}</span>
                  </div>
                  <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && !optimize && !err && (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
          {ran ? 'Chưa có khuyến nghị — thử lại sau.' : 'Bấm “Phân tích tối ưu” để Trợ lý AI chỉ ra nơi nên dồn sức tăng tỷ lệ chốt.'}
        </div>
      )}
    </div>
  );
};

export default OptimizePanel;
