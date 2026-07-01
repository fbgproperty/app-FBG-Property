import React, { useState } from 'react';
import { Scale, Loader2, Sparkles, Copy, Check, AlertTriangle, Trophy, XCircle } from 'lucide-react';
import { api } from '../services/apiService';

const nn = (x: any) => Number(x) || 0;

const DealInsights: React.FC = () => {
  const [insights, setInsights] = useState('');
  const [stats, setStats] = useState<any>({ won: 0, lost: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [ran, setRan] = useState(false);

  const run = async () => {
    setLoading(true); setErr(''); setInsights('');
    try {
      const r: any = await api.dealsInsights();
      setInsights(r?.insights || '');
      setStats(r?.stats || { won: 0, lost: 0 });
      setRan(true);
    } catch (e: any) { setErr(e?.message || 'Không phân tích được lúc này.'); }
    setLoading(false);
  };
  const copy = () => { navigator.clipboard?.writeText(insights); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const won = nn(stats?.won), lost = nn(stats?.lost);
  const empty = ran && won + lost === 0;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1"><Scale className="w-5 h-5" /><span className="font-black">Phân tích thắng/thua (Trợ lý AI)</span></div>
            <p className="text-sm opacity-90">Trợ lý AI rút ra vì sao thắng, vì sao thua để cải thiện tỷ lệ chốt.</p>
          </div>
          <button onClick={run} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-700 rounded-xl font-black text-sm hover:bg-indigo-50 disabled:opacity-60 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Phân tích
          </button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-indigo-600 font-bold text-sm"><Loader2 className="w-6 h-6 animate-spin" /> Trợ lý AI đang phân tích…</div>
      )}

      {!loading && ran && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0"><Trophy className="w-5 h-5" /></div>
            <div><p className="text-2xl font-black text-slate-900 leading-none">{won}</p><p className="text-[11px] text-slate-400 font-bold mt-1">Thắng</p></div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0"><XCircle className="w-5 h-5" /></div>
            <div><p className="text-2xl font-black text-slate-900 leading-none">{lost}</p><p className="text-[11px] text-slate-400 font-bold mt-1">Thua</p></div>
          </div>
        </div>
      )}

      {!loading && empty && (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
          Chưa có kết quả chốt để phân tích. Ghi thắng/thua ở Kinh doanh › Khách nóng.
        </div>
      )}

      {!loading && !empty && insights && (
        <div className="relative bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <button onClick={copy} className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>
          <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Nhận định</span></div>
          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pr-16">{insights}</div>
        </div>
      )}

      {!loading && !ran && !err && (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
          Bấm “Phân tích” để Trợ lý AI rút ra vì sao thắng, vì sao thua.
        </div>
      )}
    </div>
  );
};

export default DealInsights;
