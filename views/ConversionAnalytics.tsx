import React, { useEffect, useState } from 'react';
import { Target, Loader2, RefreshCw, AlertTriangle, UserCheck, CheckCircle2, XCircle, Clock, Percent, DollarSign, Building2, Users } from 'lucide-react';
import { api } from '../services/apiService';

const nn = (x: any) => Number(x) || 0;
const pct = (x: any) => Math.max(0, Math.min(100, Math.round(nn(x))));
const money = (x: any) => nn(x).toLocaleString('vi-VN');

const ConversionAnalytics: React.FC = () => {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try { const r: any = await api.dealsAnalytics(); setD(r || {}); }
    catch (e: any) { setErr(e?.message || 'Không tải được số liệu chuyển đổi.'); setD({}); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const s = d?.summary || {};
  const assigned = nn(s?.assigned), won = nn(s?.won), lost = nn(s?.lost), open = nn(s?.open);
  const winRate = pct(s?.winRate);
  const wonValue = nn(s?.wonValue);

  const byProject = Array.isArray(d?.byProject) ? d.byProject.slice() : [];
  const topProjects = byProject.sort((a: any, b: any) => nn(b?.assigned) - nn(a?.assigned)).slice(0, 10);
  const projMax = topProjects.reduce((m: number, p: any) => Math.max(m, nn(p?.assigned)), 0) || 1;

  const bySale = Array.isArray(d?.bySale) ? d.bySale.slice() : [];
  const topSales = bySale.sort((a: any, b: any) => nn(b?.assigned) - nn(a?.assigned)).slice(0, 15);

  const empty = !loading && (assigned === 0 || (won + lost) === 0);

  const KPIS = [
    { label: 'Đã giao', val: assigned, icon: UserCheck, c: 'bg-indigo-600' },
    { label: 'Chốt thắng', val: won, icon: CheckCircle2, c: 'bg-emerald-600' },
    { label: 'Chốt thua', val: lost, icon: XCircle, c: 'bg-rose-500' },
    { label: 'Đang mở', val: open, icon: Clock, c: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-emerald-700 to-slate-900 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1"><Target className="w-5 h-5" /><span className="font-black">Tỷ lệ chuyển đổi (Chốt & Học)</span></div>
            <p className="text-sm opacity-90">Kết quả chốt thắng / thua theo dự án và nhân viên — số liệu thật.</p>
          </div>
          <button onClick={load} className="text-white/80 hover:text-white shrink-0"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      {loading ? <div className="flex justify-center py-10 text-emerald-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        empty ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
            Chưa có kết quả chốt. Ghi kết quả thắng/thua ở Kinh doanh › Khách nóng để có số liệu chuyển đổi.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {KPIS.map(x => (
                <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className={`w-9 h-9 rounded-xl ${x.c} flex items-center justify-center text-white mb-2`}><x.icon className="w-4 h-4" /></div>
                  <p className="text-2xl font-black text-slate-900">{x.val}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">{x.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center gap-2 mb-3 text-emerald-700"><Percent className="w-4 h-4" /><span className="text-[12px] font-black">Tỷ lệ thắng</span></div>
                <p className="text-4xl font-black text-slate-900 leading-none mb-3">{winRate}<span className="text-xl text-slate-300">%</span></p>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${winRate}%` }} />
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center gap-2 mb-3 text-emerald-700"><DollarSign className="w-4 h-4" /><span className="text-[12px] font-black">Giá trị thắng</span></div>
                <p className="text-4xl font-black text-slate-900 leading-none">{money(wonValue)}</p>
                <p className="text-[11px] text-slate-400 font-bold mt-2">Tổng giá trị các thương vụ đã chốt thắng.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-emerald-600" /><span className="font-black text-slate-900">Theo dự án</span></div>
              {topProjects.length === 0 ? (
                <p className="text-[12px] text-slate-400">Chưa có dữ liệu dự án.</p>
              ) : (
                <div className="space-y-3">
                  {topProjects.map((p: any, i: number) => {
                    const a = nn(p?.assigned);
                    const wr = pct(p?.winRate);
                    const w = Math.max(2, Math.round((a / projMax) * 100));
                    return (
                      <div key={p?.project || i}>
                        <div className="flex items-center justify-between mb-1 text-[12px]">
                          <span className="font-black text-slate-700 truncate pr-2">{p?.project || 'Chưa rõ'}</span>
                          <span className="font-bold text-slate-400 shrink-0">giao {a} · thắng {nn(p?.won)} · thua {nn(p?.lost)} · {wr}%</span>
                        </div>
                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.max(w, wr) === 0 ? 2 : w}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex items-center gap-2 p-5 pb-3"><Users className="w-5 h-5 text-emerald-600" /><span className="font-black text-slate-900">Theo nhân viên</span></div>
              {topSales.length === 0 ? (
                <p className="text-[12px] text-slate-400 px-5 pb-5">Chưa có dữ liệu nhân viên.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wide border-b border-slate-100">
                        <th className="px-5 py-3">Nhân viên</th>
                        <th className="px-3 py-3 text-right">Đã giao</th>
                        <th className="px-3 py-3 text-right">Thắng</th>
                        <th className="px-4 py-3 w-44">Tỷ lệ thắng</th>
                        <th className="px-5 py-3 text-right">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {topSales.map((m: any, i: number) => {
                        const wr = pct(m?.winRate);
                        return (
                          <tr key={m?.sale || m?.name || i} className="hover:bg-slate-50/60">
                            <td className="px-5 py-3 font-black text-slate-800 truncate max-w-[180px]">{m?.name || m?.sale || 'Chưa rõ'}</td>
                            <td className="px-3 py-3 text-right font-bold text-slate-600">{nn(m?.assigned)}</td>
                            <td className="px-3 py-3 text-right font-bold text-emerald-600">{nn(m?.won)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${wr}%` }} />
                                </div>
                                <span className="text-[11px] font-black text-slate-500 w-9 text-right">{wr}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right font-black text-slate-700">{money(m?.value)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
};

export default ConversionAnalytics;
