import React, { useState } from 'react';
import { Trophy, Loader2, Sparkles, AlertTriangle, Award } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);
const n = (x: any) => Number(x) || 0;

const barColor = (score: number) => (score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-indigo-500' : 'bg-slate-400');
const scoreText = (score: number) => (score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-indigo-600' : 'text-slate-500');

const ProjectRanking: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [err, setErr] = useState('');

  const rank = async () => {
    setErr(''); setLoading(true);
    try {
      const r = await api.estateRanking();
      const list = arr(r).slice().sort((a: any, b: any) => n(b?.score) - n(a?.score));
      setItems(list);
      setRan(true);
    } catch (e: any) { setErr(e?.message || 'Không xếp hạng được dự án.'); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Header / control */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center gap-2"><Trophy className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Xếp hạng dự án nên đẩy bán (Trợ lý AI)</span></div>
        <p className="text-xs text-slate-400 -mt-2">Trợ lý AI phân tích tồn kho · quan tâm · thị trường để chấm điểm và xếp hạng những dự án nên ưu tiên đẩy bán. Có thể mất khoảng 15–30 giây.</p>
        {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}
        <button onClick={rank} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xếp hạng…</> : <><Sparkles className="w-4 h-4" /> Xếp hạng</>}
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="flex justify-center text-indigo-600 mb-3"><Loader2 className="w-7 h-7 animate-spin" /></div>
          <p className="text-sm font-black text-slate-700">Trợ lý AI đang phân tích…</p>
          <p className="text-[12px] text-slate-400 mt-1">Đang chấm điểm các dự án và sắp xếp thứ tự ưu tiên, vui lòng chờ trong giây lát.</p>
        </div>
      )}

      {!loading && !ran && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="flex justify-center text-slate-300 mb-3"><Award className="w-8 h-8" /></div>
          <p className="text-sm font-black text-slate-600">Chưa có kết quả xếp hạng</p>
          <p className="text-[12px] text-slate-400 mt-1">Bấm "Xếp hạng" để Trợ lý AI phân tích và gợi ý những dự án nên đẩy bán trước.</p>
        </div>
      )}

      {!loading && ran && items.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="flex justify-center text-slate-300 mb-3"><Award className="w-8 h-8" /></div>
          <p className="text-sm font-black text-slate-600">Chưa có dự án để xếp hạng</p>
          <p className="text-[12px] text-slate-400 mt-1">Thêm dự án và dữ liệu để Trợ lý AI có thể chấm điểm.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-2.5">
          {items.map((it: any, i: number) => {
            const score = Math.max(0, Math.min(100, n(it?.score)));
            const top = i === 0;
            return (
              <div key={it?.project || i} className={`rounded-2xl border p-4 ${top ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${top ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {top ? <Trophy className="w-4 h-4" /> : `#${i + 1}`}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-slate-900 text-sm truncate">{it?.project || '—'}</span>
                      <span className={`font-black text-sm shrink-0 ${scoreText(score)}`}>{score}</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${barColor(score)}`} style={{ width: `${score}%` }} />
                    </div>
                    {it?.reason && <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">{it.reason}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectRanking;
