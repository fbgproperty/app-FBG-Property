import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Loader2, RefreshCw, CheckCircle2, AlertTriangle, Circle, User } from 'lucide-react';
import { api } from '../services/apiService';

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-slate-100 text-slate-600', Working: 'bg-sky-50 text-sky-700',
  'Pending Review': 'bg-amber-50 text-amber-700', Overdue: 'bg-rose-50 text-rose-700',
  Completed: 'bg-emerald-50 text-emerald-700', Cancelled: 'bg-slate-100 text-slate-400',
};
const parseAssign = (a: any): string => {
  if (!a) return ''; try { const arr = typeof a === 'string' ? JSON.parse(a) : a; return Array.isArray(arr) ? arr.join(', ') : String(arr); } catch { return String(a); }
};

const ErpTasks: React.FC = () => {
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [tasks, setTasks] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const [s, t] = await Promise.allSettled([api.opsTasksSummary(), api.opsTasks({ status: filter, limit: 150 })]);
      if (s.status === 'fulfilled') setSummary(s.value);
      if (t.status === 'fulfilled') setTasks(t.value.items || []);
      else setErr('Không tải được công việc ERP.');
    } catch (e: any) { setErr(e?.message || 'Lỗi'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const markDone = async (name: string) => {
    setBusy(name);
    try { await api.opsTaskUpdate(name, 'Completed'); setTasks(ts => ts.map(t => t.name === name ? { ...t, status: 'Completed' } : t)); }
    catch (e: any) { setErr('Cập nhật lỗi: ' + (e?.message || '')); }
    setBusy('');
  };

  const total = Object.values(summary).reduce((a, b) => a + (b || 0), 0);
  const CHIPS = [{ k: '', label: 'Tất cả', n: total }, ...Object.entries(summary).filter(([, n]) => n > 0).map(([k, n]) => ({ k, label: k, n }))];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-slate-800 to-indigo-700 rounded-3xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1"><ClipboardCheck className="w-5 h-5" /><span className="font-black">Công việc (ERP)</span></div>
        <p className="text-sm opacity-90">Đồng bộ thật từ ERPNext — {loading ? '...' : total} công việc theo dự án/người phụ trách. Hermes sẽ tự giao & nhắc deadline (cron).</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {CHIPS.map(c => (
          <button key={c.k || 'all'} onClick={() => setFilter(c.k)} className={`text-xs font-black px-3 py-1.5 rounded-xl border transition ${filter === c.k ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {c.label} · {c.n}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-slate-400 hover:text-slate-600"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      {loading ? <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {tasks.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm">Không có công việc.</div> :
            tasks.map((t: any) => {
              const done = t.status === 'Completed' || t.status === 'Cancelled';
              const assign = parseAssign(t._assign);
              return (
                <div key={t.name} className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => !done && markDone(t.name)} disabled={done || busy === t.name} className="shrink-0">
                    {busy === t.name ? <Loader2 className="w-5 h-5 animate-spin text-indigo-500" /> : done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-emerald-500" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className={`font-bold text-sm truncate ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.subject || t.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="font-mono">{t.name}</span>
                      {t.project && <span className="font-bold">· {t.project}</span>}
                      {assign && <span className="inline-flex items-center gap-0.5"><User className="w-3 h-3" />{assign}</span>}
                      {t.exp_end_date && <span>· hạn {t.exp_end_date}</span>}
                    </div>
                  </div>
                  {t.priority && <span className="text-[10px] font-black text-slate-400 shrink-0">{t.priority}</span>}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${STATUS_COLORS[t.status] || 'bg-slate-100 text-slate-500'}`}>{t.status}</span>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default ErpTasks;
