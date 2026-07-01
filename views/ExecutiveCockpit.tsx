import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flag, Loader2, RefreshCw, Phone, CheckCircle2, Clock, Target, AlertTriangle,
  ChevronRight, Flame, Hourglass, TimerOff, Bell
} from 'lucide-react';
import { api } from '../services/apiService';

const nn = (x: any) => Number(x) || 0;

const ICONS: Record<string, any> = { phone: Phone, check: CheckCircle2, clock: Clock, target: Target, alert: AlertTriangle };
const LEVELS: Record<string, { bar: string; icon: string; hover: string }> = {
  high: { bar: 'bg-indigo-600', icon: 'text-indigo-600', hover: 'hover:border-indigo-200' },
  warn: { bar: 'bg-amber-500', icon: 'text-amber-600', hover: 'hover:border-amber-200' },
  info: { bar: 'bg-slate-400', icon: 'text-slate-500', hover: 'hover:border-slate-200' },
  danger: { bar: 'bg-rose-600', icon: 'text-rose-600', hover: 'hover:border-rose-200' },
};

const ExecutiveCockpit: React.FC = () => {
  const nav = useNavigate();
  const [actions, setActions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ hot: 0, pending: 0, overdue: 0, alerts: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r: any = await api.opsNextActions();
      setActions(Array.isArray(r?.actions) ? r.actions : []);
      setSummary(r?.summary || {});
    } catch (e: any) { setErr(e?.message || 'Không tải được việc ưu tiên.'); setActions([]); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const CHIPS = [
    { label: 'Khách nóng', val: nn(summary?.hot), icon: Flame, c: 'bg-rose-50 text-rose-700' },
    { label: 'Chờ duyệt', val: nn(summary?.pending), icon: Hourglass, c: 'bg-amber-50 text-amber-700' },
    { label: 'Quá hạn', val: nn(summary?.overdue), icon: TimerOff, c: 'bg-slate-100 text-slate-700' },
    { label: 'Cảnh báo', val: nn(summary?.alerts), icon: Bell, c: 'bg-indigo-50 text-indigo-700' },
  ];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-slate-900 to-indigo-700 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1"><Flag className="w-5 h-5" /><span className="font-black text-lg">Việc ưu tiên hôm nay</span></div>
            <p className="text-sm opacity-90">Trợ lý AI gom toàn tổ chức — làm từ trên xuống.</p>
          </div>
          <button onClick={load} disabled={loading} className="text-white/80 hover:text-white shrink-0"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {CHIPS.map(c => (
            <div key={c.label} className={`rounded-2xl px-3 py-2.5 flex items-center gap-2 ${c.c}`}>
              <c.icon className="w-4 h-4 shrink-0" />
              <div><p className="text-xl font-black leading-none">{c.val}</p><p className="text-[11px] font-bold opacity-80 mt-0.5">{c.label}</p></div>
            </div>
          ))}
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      {loading ? (
        <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div>
      ) : actions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-500">Mọi việc đã ổn — không có việc ưu tiên gấp.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {actions.map((a: any, i: number) => {
            const lv = LEVELS[a?.level] || LEVELS.info;
            const Icon = ICONS[a?.icon] || Target;
            const link = a?.link || '';
            return (
              <button
                key={i}
                onClick={() => link && nav(link)}
                disabled={!link}
                className={`w-full text-left bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 transition ${link ? `hover:shadow-md ${lv.hover}` : 'cursor-default'} group`}
              >
                <div className={`w-1.5 self-stretch rounded-full shrink-0 ${lv.bar}`} />
                <div className={`w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 ${lv.icon}`}><Icon className="w-5 h-5" /></div>
                <span className="flex-1 text-sm font-bold text-slate-700">{a?.text || ''}</span>
                {link && <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 shrink-0 transition" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExecutiveCockpit;
