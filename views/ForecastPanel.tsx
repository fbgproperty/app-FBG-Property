import React, { useState } from 'react';
import { LineChart, Loader2, Sparkles, TrendingUp, Users, UserCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../services/apiService';

const nn = (x: any) => Number(x) || 0;

const ForecastPanel: React.FC = () => {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const run = async () => {
    setLoading(true); setErr('');
    try { const r: any = await api.reportForecast(); setD(r || {}); }
    catch (e: any) { setErr(e?.message || 'Chưa chạy được dự báo.'); }
    setLoading(false);
  };

  const series = Array.isArray(d?.series) ? d.series : [];
  const max = series.reduce((m: number, s: any) => Math.max(m, nn(s?.value)), 0);
  const allZero = series.length > 0 && max === 0;
  const inp = d?.inputs || {};

  const CHIPS = [
    { label: 'Khách quan tâm', val: nn(inp?.interested), icon: Users, c: 'bg-indigo-600' },
    { label: 'Đang chăm', val: nn(inp?.assigned), icon: UserCheck, c: 'bg-fuchsia-600' },
    { label: 'Việc xong', val: nn(inp?.done), icon: CheckCircle2, c: 'bg-emerald-600' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1"><LineChart className="w-5 h-5" /><span className="font-black">Dự báo doanh số 4 tuần (Trợ lý AI)</span></div>
            <p className="text-sm opacity-90">Ước lượng xu hướng 4 tuần tới dựa trên phễu khách và tiến độ công việc thật.</p>
          </div>
          <button onClick={run} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 rounded-xl font-black text-sm hover:bg-slate-50 disabled:opacity-60 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Chạy dự báo
          </button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      {loading ? (
        <div className="flex justify-center py-16 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div>
      ) : !d ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
          Bấm <b>Chạy dự báo</b> để Trợ lý AI ước lượng doanh số 4 tuần tới.
        </div>
      ) : (
        <>
          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Xu hướng 4 tuần</span></div>
            {series.length === 0 ? (
              <p className="text-[12px] text-slate-400">Chưa có dữ liệu dự báo.</p>
            ) : (
              <>
                <div className="flex items-end justify-around gap-3 h-52">
                  {series.map((s: any, i: number) => {
                    const v = nn(s?.value);
                    const h = allZero ? 4 : Math.max(4, Math.round((v / (max || 1)) * 100));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div className="text-[12px] font-black text-slate-700 mb-1">{v}</div>
                        <div className="w-full max-w-[64px] rounded-t-xl bg-gradient-to-t from-indigo-600 to-indigo-400 transition-all" style={{ height: `${h}%` }} />
                        <div className="text-[11px] font-black text-slate-500 mt-2 text-center truncate w-full">{s?.label || `Tuần ${i + 1}`}</div>
                      </div>
                    );
                  })}
                </div>
                {allZero && <p className="mt-3 text-[12px] text-amber-600 font-bold">Tất cả tuần đang bằng 0 — chưa đủ dữ liệu để dự báo xu hướng.</p>}
              </>
            )}
          </div>

          {/* Input chips */}
          <div className="grid grid-cols-3 gap-3">
            {CHIPS.map(x => (
              <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${x.c} flex items-center justify-center text-white shrink-0`}><x.icon className="w-5 h-5" /></div>
                <div><p className="text-xl font-black text-slate-900 leading-none">{x.val}</p><p className="text-[11px] text-slate-400 font-bold mt-1">{x.label}</p></div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Nhận định của Trợ lý AI</span></div>
            {d?.summary
              ? <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4">{d.summary}</div>
              : <p className="text-[12px] text-slate-400">Chưa có nhận định.</p>}
            {d?.assumption && <p className="mt-3 text-[12px] text-slate-400 font-semibold">Giả định: {d.assumption}</p>}
            {allZero && <p className="mt-2 text-[12px] text-slate-500 font-bold">Chưa có đủ dữ liệu phễu để dự báo — hãy triển khai dự án để có số liệu.</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default ForecastPanel;
