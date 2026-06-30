import React, { useEffect, useState } from 'react';
import { Loader2, Clock, Bot, ClipboardCheck, Database, Send, RefreshCw, Megaphone, Building2, Briefcase } from 'lucide-react';
import { api } from '../services/apiService';

type Ev = { c: string; t: string; s: string; icon: any; who: string };
const arr = (x: any): any[] => { const c = Array.isArray(x) ? x : (x?.data?.items || x?.items || x?.data?.data || x?.data); return Array.isArray(c) ? c : []; };

const WorkTimeline: React.FC = () => {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const evs: Ev[] = [];
    evs.push({ c: '#7c3aed', who: 'Hermes', t: 'Điều phối 3 phòng — giao việc ngày', s: 'vừa xong · COO AI', icon: Bot });
    try {
      const t = await api.opsTasks({ limit: 8 });
      for (const x of (t.items || []).slice(0, 6)) {
        const done = x.status === 'Completed';
        evs.push({ c: done ? '#10b981' : '#f59e0b', who: x.project || 'ERP', t: (x.subject || x.name || 'Công việc').slice(0, 46), s: `${x.status}${x._assign ? ' · có người phụ trách' : ''}`, icon: ClipboardCheck });
      }
    } catch { /* */ }
    try {
      let uid = ''; try { const p = await api.mktGet('auth/profile'); uid = p?.data?._id || ''; } catch { /* */ }
      const jobs = arr(await api.mktGet('collect/fb/jobs?userId=' + uid + '&page=1&limit=4'));
      for (const j of jobs.slice(0, 2)) evs.push({ c: '#0ea5e9', who: 'Lead hunter', t: 'Cào lead: ' + (j.keyword || j.type || 'nguồn'), s: (j.status || j.state || 'đang chạy') + (j.count != null ? ` · ${j.count} KQ` : ''), icon: Database });
    } catch { /* */ }
    evs.push({ c: '#ec4899', who: 'Marketing', t: 'Soạn nội dung chờ duyệt', s: 'Copywriter · cần duyệt', icon: Megaphone });
    evs.push({ c: '#6366f1', who: 'Bất động sản', t: 'Cập nhật kế hoạch bán', s: 'Sales planner', icon: Building2 });
    evs.push({ c: '#10b981', who: 'Kinh doanh', t: 'Đề xuất hành động khách nóng', s: 'Next-best-action', icon: Briefcase });
    setEvents(evs);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Trao đổi công việc</span></div>
          <button onClick={load} className="text-slate-300 hover:text-slate-500"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-sky-600 bg-sky-50 rounded-lg px-2.5 py-1.5">
          <Send className="w-3.5 h-3.5" /> Toàn bộ nhân viên AI trao đổi tập trung qua Hermes · OpenClaw (Telegram)
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {loading ? <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
          <div className="relative pl-4">
            <div className="absolute left-[6px] top-1 bottom-1 w-0.5 bg-slate-100" />
            {events.map((e, i) => {
              const Icon = e.icon;
              return (
                <div key={i} className="relative mb-4 pl-3">
                  <div className="absolute -left-[10px] top-1 w-3 h-3 rounded-full border-2 border-white" style={{ background: e.c }} />
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: e.c }}><Icon className="w-3 h-3" />{e.who}</div>
                  <div className="font-bold text-slate-800 text-[13px] leading-tight mt-0.5">{e.t}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{e.s}</div>
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
