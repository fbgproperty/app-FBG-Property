import React, { useEffect, useState } from 'react';
import { Loader2, Clock, RefreshCw, CheckCircle2, XCircle, PlayCircle, Flag } from 'lucide-react';
import { api } from '../services/apiService';

const ago = (ts: number) => {
  if (!ts) return '';
  const s = Math.floor(Date.now() / 1000 - ts);
  if (s < 60) return 'vừa xong';
  if (s < 3600) return Math.floor(s / 60) + ' phút trước';
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
  return Math.floor(s / 86400) + ' ngày trước';
};

const STATUS: Record<string, { label: string; color: string; icon: any }> = {
  approved: { label: 'Đã duyệt', color: '#10b981', icon: CheckCircle2 },
  rejected: { label: 'Đã từ chối', color: '#f43f5e', icon: XCircle },
  doing: { label: 'Đang thực hiện', color: '#6366f1', icon: PlayCircle },
  done: { label: 'Hoàn thành', color: '#0d9488', icon: Flag },
};

const WorkTimeline: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await api.opsWorklog(); setItems(Array.isArray(r?.items) ? r.items : []); }
    catch { setItems([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const decided = items
    .filter(i => i && i.status !== 'pending')
    .sort((a, b) => (b?.decidedAt || b?.ts || 0) - (a?.decidedAt || a?.ts || 0));

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Trao đổi công việc</span></div>
          <button onClick={load} className="text-slate-300 hover:text-slate-500"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="mt-1 text-[11px] font-semibold text-slate-400">Việc đã duyệt · từ chối · đang thực hiện · hoàn thành</div>
        <div className="mt-2 text-[11px] font-bold text-sky-600 bg-sky-50 rounded-lg px-2.5 py-1.5">Duyệt việc mới tại Trợ lý AI › Công việc</div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {loading ? <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-6 h-6 animate-spin" /></div> :
          decided.length === 0 ? <div className="text-center text-slate-400 text-xs py-8 leading-relaxed">Chưa có việc nào được duyệt. Vào <b>Trợ lý AI › Công việc</b> để duyệt việc Trợ lý AI đề xuất.</div> : (
            <div className="relative pl-4">
              <div className="absolute left-[6px] top-1 bottom-1 w-0.5 bg-slate-100" />
              {decided.map((it) => {
                const meta = STATUS[it.status] || STATUS.approved;
                const c = meta.color;
                const Icon = meta.icon;
                const steps = Array.isArray(it.steps) ? it.steps : [];
                const done = steps.filter((s: any) => s?.done).length;
                const hist = Array.isArray(it.history) ? it.history : [];
                const last = hist.length ? hist[hist.length - 1] : null;
                return (
                  <div key={it.id} className="relative mb-4 pl-3">
                    <div className="absolute -left-[10px] top-1 w-3 h-3 rounded-full border-2 border-white" style={{ background: c }} />
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md" style={{ background: c + '22', color: c }}><Icon className="w-3 h-3" />{meta.label}</span>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{it.dept || 'Trợ lý AI'} · {ago(it.decidedAt || it.ts)}</div>
                    <div className="font-bold text-slate-800 text-[13px] leading-tight mt-0.5">{it.title}</div>
                    {steps.length > 0 && (
                      <div className="mt-1.5">
                        <div className="text-[10px] font-black text-slate-500">{done}/{steps.length} bước</div>
                        <div className="mt-0.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${steps.length ? (done / steps.length) * 100 : 0}%`, background: c }} />
                        </div>
                      </div>
                    )}
                    {last && <div className="mt-1 text-[11px] text-slate-400 italic">{last.ev} · {ago(last.ts)}</div>}
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
};

export default WorkTimeline;
