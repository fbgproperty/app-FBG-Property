import React, { useEffect, useState } from 'react';
import { Newspaper, Loader2, RefreshCw, Copy, Check, AlertTriangle, Users, UserCheck, Megaphone, CheckCircle2, TrendingUp } from 'lucide-react';
import { api } from '../services/apiService';

const nn = (x: any) => Number(x) || 0;

const ExecutiveDigest: React.FC = () => {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true); setErr('');
    try { const r: any = await api.reportDigest(); setD(r || {}); }
    catch (e: any) { setErr(e?.message || 'Không tải được bản tin điều hành.'); setD({}); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const digest = d?.digest || '';
  const cur = d?.current || {};
  const trends = Array.isArray(d?.trends) ? d.trends : [];
  const trendMax = trends.reduce((m: number, t: any) => Math.max(m, nn(t?.assigned)), 0) || 1;

  const copy = () => { navigator.clipboard?.writeText(digest || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const STATS = [
    { label: 'Khách quan tâm', val: nn(cur?.interested), icon: Users, c: 'bg-indigo-600' },
    { label: 'Đang chăm', val: nn(cur?.assigned), icon: UserCheck, c: 'bg-emerald-600' },
    { label: 'Chiến dịch', val: nn(cur?.campaigns), icon: Megaphone, c: 'bg-fuchsia-600' },
    { label: 'Việc hoàn thành', val: `${nn(cur?.worklogDone)}/${nn(cur?.worklogTotal)}`, icon: CheckCircle2, c: 'bg-amber-500' },
  ];

  const fmt = (ts: any) => {
    const dt = new Date(nn(ts) * 1000);
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}`;
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1"><Newspaper className="w-5 h-5" /><span className="font-black">Bản tin điều hành & xu hướng</span></div>
            <p className="text-sm opacity-90">Bản tin điều hành do Trợ lý AI soạn — số liệu hiện tại và xu hướng theo ngày.</p>
          </div>
          <button onClick={load} className="text-white/80 hover:text-white shrink-0"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      {loading ? (
        <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div>
      ) : (
        <>
          <div className="relative bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 p-5">
            <button onClick={copy} className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}
            </button>
            <div className="flex items-center gap-2 mb-3 text-indigo-700"><Newspaper className="w-4 h-4" /><span className="text-[12px] font-black">Bản tin điều hành</span></div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pr-16">{digest || 'Chưa có nội dung bản tin.'}</div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map(x => (
              <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${x.c} flex items-center justify-center text-white shrink-0`}><x.icon className="w-5 h-5" /></div>
                <div><p className="text-2xl font-black text-slate-900 leading-none">{x.val}</p><p className="text-[11px] text-slate-400 font-bold mt-1">{x.label}</p></div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Xu hướng đang chăm theo ngày</span></div>
            {trends.length < 2 ? (
              <p className="text-[12px] text-slate-400">Xu hướng sẽ hiện khi hệ thống tích lũy dữ liệu theo ngày.</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {trends.map((t: any, i: number) => {
                  const a = nn(t?.assigned);
                  const h = Math.max(4, Math.round((a / trendMax) * 100));
                  return (
                    <div key={t?.ts || i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                      <span className="text-[10px] font-black text-slate-500">{a}</span>
                      <div className="w-full bg-indigo-500 rounded-t-lg transition-all" style={{ height: `${h}%` }} />
                      <span className="text-[10px] text-slate-400 font-bold">{fmt(t?.ts)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ExecutiveDigest;
