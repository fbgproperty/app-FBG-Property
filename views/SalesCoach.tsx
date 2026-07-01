import React, { useEffect, useState } from 'react';
import { GraduationCap, Loader2, AlertTriangle, Copy, Check, Sparkles, UserCheck, CheckCircle2, XCircle, Clock, Layers } from 'lucide-react';
import { api } from '../services/apiService';

const nn = (x: any) => Number(x) || 0;

const SalesCoach: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState('');
  const [res, setRes] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const loadStaff = async () => {
    setLoadingStaff(true); setErr('');
    try {
      const r: any = await api.teamPerformance();
      const t = Array.isArray(r?.team) ? r.team : [];
      const sales = t.filter((m: any) => String(m?.role || '').toLowerCase().includes('sale'));
      const list = sales.length ? sales : t;
      setStaff(list);
      if (list.length && !email) setEmail(list[0]?.email || '');
    } catch (e: any) { setErr(e?.message || 'Không tải được danh sách nhân sự.'); }
    setLoadingStaff(false);
  };
  useEffect(() => { loadStaff(); /* eslint-disable-next-line */ }, []);

  const run = async () => {
    if (!email) { setErr('Hãy chọn một nhân viên để huấn luyện.'); return; }
    setRunning(true); setErr(''); setRes(null);
    try { const r: any = await api.salesCoach(email); setRes(r || {}); }
    catch (e: any) { setErr(e?.message || 'Không tạo được nội dung huấn luyện.'); }
    setRunning(false);
  };

  const stats = res?.stats || {};
  const coach = res?.coach || '';
  const stages = stats?.stages && typeof stats.stages === 'object' ? stats.stages : {};
  const stageEntries = Object.entries(stages).map(([k, v]) => [k, nn(v)] as [string, number]).sort((a, b) => b[1] - a[1]);
  const stageMax = stageEntries.reduce((m, [, v]) => Math.max(m, v), 0) || 1;

  const copy = () => { navigator.clipboard?.writeText(coach || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const CHIPS = [
    { label: 'Khách được giao', val: nn(stats?.assigned), icon: UserCheck, c: 'text-indigo-600 bg-indigo-50' },
    { label: 'Thắng', val: nn(stats?.won), icon: CheckCircle2, c: 'text-emerald-600 bg-emerald-50' },
    { label: 'Thua', val: nn(stats?.lost), icon: XCircle, c: 'text-rose-600 bg-rose-50' },
    { label: 'Đang mở', val: nn(stats?.open), icon: Clock, c: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-slate-900 to-indigo-700 rounded-3xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1"><GraduationCap className="w-5 h-5" /><span className="font-black">Huấn luyện nhân viên (Trợ lý AI)</span></div>
        <p className="text-sm opacity-90">Chọn một nhân viên để Trợ lý AI phân tích số liệu và đưa ra góp ý huấn luyện.</p>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wide">Nhân viên</label>
            <select
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loadingStaff || running}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
            >
              {loadingStaff ? (
                <option value="">Đang tải danh sách…</option>
              ) : staff.length === 0 ? (
                <option value="">Chưa có nhân sự</option>
              ) : (
                staff.map((m: any, i: number) => (
                  <option key={m?.email || i} value={m?.email || ''}>{m?.name || m?.email || 'Chưa rõ'}</option>
                ))
              )}
            </select>
          </div>
          <button
            onClick={run}
            disabled={running || loadingStaff || !email}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-2.5 text-sm font-black text-white shadow hover:bg-indigo-800 disabled:opacity-50"
          >
            {running ? <><Loader2 className="w-4 h-4 animate-spin" />Trợ lý AI đang phân tích…</> : <><GraduationCap className="w-4 h-4" />Huấn luyện</>}
          </button>
        </div>
      </div>

      {running ? (
        <div className="flex flex-col items-center gap-2 py-10 text-indigo-600">
          <Loader2 className="w-7 h-7 animate-spin" />
          <span className="text-sm font-bold text-slate-400">Trợ lý AI đang phân tích…</span>
        </div>
      ) : !res ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center text-slate-400 text-sm">
          Chọn một nhân viên và bấm “Huấn luyện” để nhận phân tích số liệu và góp ý từ Trợ lý AI.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map(x => (
              <div key={x.label} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-black ${x.c}`}>
                <x.icon className="w-3.5 h-3.5" />{x.label}: {x.val}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-4"><Layers className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Phân bổ theo giai đoạn</span></div>
            {stageEntries.length === 0 ? (
              <p className="text-[12px] text-slate-400">Chưa có dữ liệu giai đoạn.</p>
            ) : (
              <div className="space-y-3">
                {stageEntries.map(([k, v], i) => {
                  const w = Math.max(2, Math.round((v / stageMax) * 100));
                  return (
                    <div key={k || i}>
                      <div className="flex items-center justify-between mb-1 text-[12px]">
                        <span className="font-black text-slate-700 truncate pr-2">{k || 'Chưa rõ'}</span>
                        <span className="font-bold text-slate-400 shrink-0">{v}</span>
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

          <div className="relative bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 p-5">
            <button onClick={copy} className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}
            </button>
            <div className="flex items-center gap-2 mb-3 text-indigo-700"><Sparkles className="w-4 h-4" /><span className="text-[12px] font-black">Góp ý huấn luyện từ Trợ lý AI</span></div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pr-16">{coach || 'Chưa có nội dung huấn luyện.'}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesCoach;
