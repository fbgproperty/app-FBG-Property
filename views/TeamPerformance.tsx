import React, { useEffect, useState } from 'react';
import { Trophy, Loader2, RefreshCw, AlertTriangle, Users, ClipboardCheck, CheckCircle2, UserCheck } from 'lucide-react';
import { api } from '../services/apiService';

const nn = (x: any) => Number(x) || 0;
const RANK_STYLE = ['bg-amber-50/70', 'bg-slate-50', 'bg-orange-50/60'];
const RANK_BADGE = ['bg-amber-400 text-white', 'bg-slate-300 text-white', 'bg-orange-300 text-white'];

const TeamPerformance: React.FC = () => {
  const [team, setTeam] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r: any = await api.teamPerformance();
      const t = Array.isArray(r?.team) ? r.team : [];
      setTeam(t);
      setCount(nn(r?.count) || t.length);
    } catch (e: any) { setErr(e?.message || 'Không tải được số liệu hiệu suất.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const sumTotal = team.reduce((a, x) => a + nn(x?.total), 0);
  const sumDone = team.reduce((a, x) => a + nn(x?.done), 0);
  const sumAssigned = team.reduce((a, x) => a + nn(x?.assigned), 0);

  const KPIS = [
    { label: 'Tổng nhân sự', val: count, icon: Users, c: 'bg-slate-800' },
    { label: 'Tổng việc', val: sumTotal, icon: ClipboardCheck, c: 'bg-indigo-600' },
    { label: 'Tổng hoàn thành', val: sumDone, icon: CheckCircle2, c: 'bg-emerald-600' },
    { label: 'Tổng khách được giao', val: sumAssigned, icon: UserCheck, c: 'bg-fuchsia-600' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-slate-800 to-indigo-700 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1"><Trophy className="w-5 h-5" /><span className="font-black">Hiệu suất đội — số liệu thật</span></div>
            <p className="text-sm opacity-90">Bảng xếp hạng hiệu suất từng nhân sự — việc, tiến độ và khách được giao (đồng bộ thật).</p>
          </div>
          <button onClick={load} className="text-white/80 hover:text-white shrink-0"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPIS.map(x => (
          <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className={`w-9 h-9 rounded-xl ${x.c} flex items-center justify-center text-white mb-2`}><x.icon className="w-4 h-4" /></div>
            <p className="text-2xl font-black text-slate-900">{x.val}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{x.label}</p>
          </div>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        count === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
            Chưa có nhân sự nào để xếp hạng — hãy thêm nhân sự và giao việc để có số liệu hiệu suất.
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wide border-b border-slate-100">
                    <th className="px-4 py-3">Nhân sự</th>
                    <th className="px-3 py-3 text-right">Việc</th>
                    <th className="px-3 py-3 text-right">Đang làm</th>
                    <th className="px-3 py-3 text-right">Hoàn thành</th>
                    <th className="px-3 py-3 text-right">Khách được giao</th>
                    <th className="px-4 py-3 w-48">Tỷ lệ hoàn thành</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {team.map((m: any, i: number) => {
                    const rate = Math.max(0, Math.min(100, nn(m?.completionRate)));
                    const top = i < 3;
                    return (
                      <tr key={m?.email || i} className={top ? RANK_STYLE[i] : 'hover:bg-slate-50/60'}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${top ? RANK_BADGE[i] : 'bg-slate-100 text-slate-400'}`}>{i + 1}</span>
                            <div className="min-w-0">
                              <div className="font-black text-slate-800 truncate">{m?.name || m?.email || 'Chưa rõ'}</div>
                              {m?.role && <div className="text-[11px] text-slate-400 font-bold truncate">{m.role}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-black text-slate-700">{nn(m?.total)}</td>
                        <td className="px-3 py-3 text-right font-bold text-sky-600">{nn(m?.doing)}</td>
                        <td className="px-3 py-3 text-right font-bold text-emerald-600">{nn(m?.done)}</td>
                        <td className="px-3 py-3 text-right font-bold text-fuchsia-600">{nn(m?.assigned)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${rate}%` }} />
                            </div>
                            <span className="text-[11px] font-black text-slate-500 w-9 text-right">{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default TeamPerformance;
