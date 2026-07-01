import React, { useEffect, useState } from 'react';
import { TrendingUp, Loader2, RefreshCw, AlertTriangle, Radar, Target, UserCheck, Globe, Users, Megaphone, CheckCircle2, Building2 } from 'lucide-react';
import { api } from '../services/apiService';

const nn = (x: any) => Number(x) || 0;

const AnalyticsBoard: React.FC = () => {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try { const r: any = await api.reportAnalytics(); setD(r || {}); }
    catch (e: any) { setErr(e?.message || 'Không tải được số liệu phân tích.'); setD({}); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const funnel = d?.funnel || {};
  const reach = nn(funnel?.reach), interested = nn(funnel?.interested), assigned = nn(funnel?.assigned);
  const funnelMax = Math.max(reach, interested, assigned, 1);
  const web = d?.web || {};
  const byProject = Array.isArray(d?.byProject) ? d.byProject.slice() : [];
  const topProjects = byProject.sort((a: any, b: any) => nn(b?.assigned) - nn(a?.assigned)).slice(0, 10);
  const projMax = topProjects.reduce((m: number, p: any) => Math.max(m, nn(p?.assigned)), 0) || 1;
  const worklog = d?.worklog || {};

  const FUNNEL = [
    { label: 'Đã quét', val: reach, icon: Radar, c: 'bg-indigo-300' },
    { label: 'Quan tâm', val: interested, icon: Target, c: 'bg-indigo-500' },
    { label: 'Đã giao', val: assigned, icon: UserCheck, c: 'bg-indigo-700' },
  ];
  const hasData = d && (reach || interested || assigned || nn(web?.visitors) || topProjects.length);

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-5 h-5" /><span className="font-black">Phân tích tổng — Phiên bản 2</span></div>
            <p className="text-sm opacity-90">Phễu triển khai, nguồn web và hiệu quả theo dự án — tổng hợp số liệu thật.</p>
          </div>
          <button onClick={load} className="text-white/80 hover:text-white shrink-0"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      {loading ? <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        !hasData ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
            Chưa có dữ liệu — hãy triển khai một dự án để có số liệu phễu.
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4"><Radar className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Phễu triển khai</span></div>
              <div className="space-y-3">
                {FUNNEL.map(x => {
                  const w = Math.max(2, Math.round((x.val / funnelMax) * 100));
                  return (
                    <div key={x.label} className="flex items-center gap-3">
                      <div className="w-24 flex items-center gap-1.5 shrink-0 text-slate-500"><x.icon className="w-3.5 h-3.5" /><span className="text-[12px] font-black">{x.label}</span></div>
                      <div className="flex-1 h-8 bg-slate-50 rounded-xl overflow-hidden">
                        <div className={`h-full ${x.c} rounded-xl flex items-center justify-end px-3 transition-all`} style={{ width: `${w}%` }}>
                          <span className="text-[12px] font-black text-white">{x.val}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Khách ghé web', val: nn(web?.visitors), icon: Globe, c: 'bg-sky-500' },
                { label: 'Quan tâm từ web', val: nn(web?.interested), icon: Users, c: 'bg-fuchsia-600' },
              ].map(x => (
                <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${x.c} flex items-center justify-center text-white shrink-0`}><x.icon className="w-5 h-5" /></div>
                  <div><p className="text-2xl font-black text-slate-900 leading-none">{x.val}</p><p className="text-[11px] text-slate-400 font-bold mt-1">{x.label}</p></div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Theo dự án</span></div>
              {topProjects.length === 0 ? (
                <p className="text-[12px] text-slate-400">Chưa có dữ liệu dự án.</p>
              ) : (
                <div className="space-y-3">
                  {topProjects.map((p: any, i: number) => {
                    const a = nn(p?.assigned);
                    const w = Math.max(2, Math.round((a / projMax) * 100));
                    return (
                      <div key={p?.project || i}>
                        <div className="flex items-center justify-between mb-1 text-[12px]">
                          <span className="font-black text-slate-700 truncate pr-2">{p?.project || 'Chưa rõ'}</span>
                          <span className="font-bold text-slate-400 shrink-0">quan tâm {nn(p?.interested)} · giao {a}</span>
                        </div>
                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${w}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-fuchsia-600 flex items-center justify-center text-white shrink-0"><Megaphone className="w-5 h-5" /></div>
                <div><p className="text-2xl font-black text-slate-900 leading-none">{nn(d?.campaigns)}</p><p className="text-[11px] text-slate-400 font-bold mt-1">Số chiến dịch</p></div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                <div><p className="text-2xl font-black text-slate-900 leading-none">{nn(worklog?.done)}<span className="text-base text-slate-300">/{nn(worklog?.total)}</span></p><p className="text-[11px] text-slate-400 font-bold mt-1">Việc hoàn thành</p></div>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default AnalyticsBoard;
