import React, { useEffect, useState } from 'react';
import { CalendarClock, Loader2, Power, PowerOff, Clock, Target, Radar, CheckCircle2, AlertTriangle, Repeat } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);

const relTime = (ts: any): string => {
  const t = Number(ts) || 0;
  if (!t) return 'Chưa chạy';
  const diff = Date.now() - t;
  if (diff < 0) return 'Vừa xong';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(t).toLocaleDateString('vi-VN');
};

const cadenceLabel = (c: any) => (c === 'weekly' ? 'Hằng tuần' : 'Hằng ngày');
const modeLabel = (m: any) => (m === 'broad' ? 'Phủ toàn tệp' : 'Khớp tín hiệu');

const CampaignSchedule: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [cadence, setCadence] = useState<'daily' | 'weekly'>('daily');
  const [mode, setMode] = useState<'match' | 'broad'>('match');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const loadSchedules = async () => {
    try { const r = await api.deployScheduleList(); setSchedules(arr(r)); } catch { /* */ }
  };

  useEffect(() => {
    api.getDeployProjects().then((r: any) => {
      const items = arr(r);
      setProjects(items);
      if (items.length && !project) setProject(items[0]?.name || '');
    }).catch(() => { /* */ });
    loadSchedules();
    /* eslint-disable-next-line */
  }, []);

  const setSchedule = async () => {
    if (!project) { setErr('Chọn dự án để bật lịch.'); return; }
    setErr(''); setSaving(true);
    try {
      await api.deployScheduleSet({ project, cadence, mode });
      await loadSchedules();
    } catch (e: any) { setErr(e?.message || 'Không bật được lịch tự chạy.'); }
    setSaving(false);
  };

  const removeSchedule = async (p: string) => {
    setBusy(p); setErr('');
    try {
      await api.deployScheduleRemove(p);
      await loadSchedules();
    } catch (e: any) { setErr(e?.message || 'Không tắt được lịch.'); }
    setBusy('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><CalendarClock className="w-5 h-5" /><span className="font-black">Chiến dịch tự chạy theo lịch</span></div>
        <p className="text-sm opacity-90">Hệ thống tự triển khai dự án mỗi sáng theo lịch — không cần bấm tay.</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-500 mb-1 block">Dự án</label>
            <select value={project} onChange={e => setProject(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm">
              {projects.length === 0 && <option value="">— chưa có dự án —</option>}
              {projects.map((p: any, i: number) => <option key={p?.name || i} value={p?.name}>{p?.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-500 mb-1 block">Tần suất</label>
            <select value={cadence} onChange={e => setCadence(e.target.value as any)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="daily">Hằng ngày</option>
              <option value="weekly">Hằng tuần</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-500 mb-1 block">Cách lọc khách</label>
            <select value={mode} onChange={e => setMode(e.target.value as any)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="match">Khớp tín hiệu</option>
              <option value="broad">Phủ toàn tệp</option>
            </select>
          </div>
        </div>

        {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

        <button onClick={setSchedule} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang bật lịch…</> : <><Power className="w-4 h-4" /> Bật lịch tự chạy</>}
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3"><Repeat className="w-4 h-4 text-slate-500" /><span className="font-black text-slate-900 text-sm">Lịch đang chạy</span></div>
        {schedules.length === 0 ? (
          <p className="text-[12px] text-slate-400">Chưa có lịch nào. Bật lịch để hệ thống tự chạy chiến dịch mỗi sáng.</p>
        ) : (
          <div className="divide-y divide-slate-50 -mx-1">
            {schedules.map((s: any, i: number) => (
              <div key={s?.project || i} className="flex items-center gap-3 px-1 py-3 flex-wrap">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-slate-900 text-sm truncate">{s?.project || '—'}</div>
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">{cadenceLabel(s?.cadence)}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {s?.mode === 'broad' ? <Radar className="w-3 h-3" /> : <Target className="w-3 h-3" />} {modeLabel(s?.mode)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <Clock className="w-3 h-3" /> {relTime(s?.lastRun)}
                    </span>
                  </div>
                </div>
                <button onClick={() => removeSchedule(s?.project)} disabled={busy === s?.project} className="inline-flex items-center gap-1.5 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 disabled:opacity-60 shrink-0">
                  {busy === s?.project ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PowerOff className="w-3.5 h-3.5" />} Tắt lịch
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignSchedule;
