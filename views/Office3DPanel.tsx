import React, { Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, Clock, Bot, ClipboardCheck, Database, Sparkles, X } from 'lucide-react';
import { api } from '../services/apiService';

const Office3D = React.lazy(() => import('./office3d/Office3D'));

type Sel = { name: string; role: string; route: string };
type Ev = { c: string; t: string; s: string; icon: any };

const arr = (x: any): any[] => { const c = Array.isArray(x) ? x : (x?.data?.items || x?.items || x?.data?.data || x?.data); return Array.isArray(c) ? c : []; };

const Office3DPanel: React.FC = () => {
  const nav = useNavigate();
  const [sel, setSel] = useState<Sel | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const evs: Ev[] = [{ c: '#7c3aed', t: 'Hermes điều phối 3 phòng', s: 'vừa xong · 22/30 AI đang chạy', icon: Bot }];
      try {
        const t = await api.opsTasks({ limit: 6 });
        for (const x of (t.items || []).slice(0, 5)) {
          const done = x.status === 'Completed';
          evs.push({ c: done ? '#10b981' : '#f59e0b', t: (x.subject || x.name || 'Công việc').slice(0, 42), s: `${x.project || 'ERP'} · ${x.status}`, icon: ClipboardCheck });
        }
      } catch { /* */ }
      try {
        let uid = ''; try { const p = await api.mktGet('auth/profile'); uid = p?.data?._id || ''; } catch { /* */ }
        const jobs = arr(await api.mktGet('collect/fb/jobs?userId=' + uid + '&page=1&limit=5'));
        for (const j of jobs.slice(0, 2)) evs.push({ c: '#0ea5e9', t: 'Job cào: ' + (j.keyword || j.type || 'lead'), s: (j.status || j.state || 'đang chạy') + (j.count != null ? ` · ${j.count}` : ''), icon: Database });
      } catch { /* */ }
      setEvents(evs);
      setReady(true);
    })();
  }, []);

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="font-black text-gray-900">Văn phòng AI 3D</h3>
          <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md">Hermes + 30 nhân viên</span>
        </div>
        <a href="https://office.fbgproperty.vn" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800">
          <Sparkles className="w-3.5 h-3.5" /> Mở văn phòng 3D thật (Claw3D) <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* 3D canvas */}
        <div className="lg:col-span-8 relative" style={{ height: 460 }}>
          <Suspense fallback={<div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-600"><Loader2 className="w-8 h-8 animate-spin mb-2" /><span className="text-xs font-bold">Đang dựng văn phòng 3D...</span></div>}>
            <Office3D onSelect={setSel} />
          </Suspense>

          {sel && (
            <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-2xl border border-slate-100 shadow-lg p-4 w-64 animate-in fade-in slide-in-from-bottom-2">
              <button onClick={() => setSel(null)} className="absolute top-2 right-2 text-slate-300 hover:text-slate-500"><X className="w-4 h-4" /></button>
              <div className="font-black text-slate-900 text-sm">{sel.name}</div>
              <div className="text-[12px] text-slate-400 font-bold">{sel.role}</div>
              <button onClick={() => nav(sel.route)} className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700">
                Vào làm việc <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* timeline */}
        <div className="lg:col-span-4 border-l border-gray-50 p-5">
          <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-indigo-600" /><span className="font-black text-slate-900 text-sm">Dòng thời gian công việc</span></div>
          {!ready ? <div className="flex justify-center py-8 text-indigo-600"><Loader2 className="w-5 h-5 animate-spin" /></div> : (
            <div className="relative pl-4" style={{ maxHeight: 380, overflowY: 'auto' }}>
              <div className="absolute left-[6px] top-1 bottom-1 w-0.5 bg-slate-100" />
              {events.map((e, i) => {
                const Icon = e.icon;
                return (
                  <div key={i} className="relative mb-4 pl-3">
                    <div className="absolute -left-[10px] top-1 w-3 h-3 rounded-full border-2 border-white" style={{ background: e.c }} />
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[13px] leading-tight"><Icon className="w-3.5 h-3.5 shrink-0" style={{ color: e.c }} />{e.t}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{e.s}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Office3DPanel;
