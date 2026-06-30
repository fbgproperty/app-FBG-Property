import React, { useEffect, useState } from 'react';
import { Workflow, ExternalLink, Loader2, Database, CheckCircle2, Clock, Zap, XCircle, RefreshCw, Bot } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => { const c = Array.isArray(x) ? x : (x?.data?.items || x?.items || x?.data?.data || x?.data); return Array.isArray(c) ? c : []; };
const fmtTs = (ts?: number) => ts ? new Date(ts * 1000).toLocaleString('vi-VN') : '—';

const AutomationOps: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ap, setAp] = useState<any>(null);
  const [running, setRunning] = useState(false);

  const loadAp = async () => { try { setAp(await api.autopilotStatus()); } catch { /* */ } };

  useEffect(() => {
    (async () => {
      let uid = '';
      try { const p = await api.mktGet('auth/profile'); uid = p?.data?._id || ''; } catch { /* */ }
      try { setJobs(arr(await api.mktGet('collect/fb/jobs?userId=' + uid + '&page=1&limit=50'))); } catch { /* */ }
      await loadAp();
      setLoading(false);
    })();
  }, []);

  const runNow = async () => {
    if (!window.confirm('Chạy Autopilot ngay? Trợ lý AI sẽ đồng bộ dữ liệu, sinh bản tin và gửi cho 8 quản lý qua Telegram.')) return;
    setRunning(true);
    try { await api.autopilotRun(); await loadAp(); } catch (e: any) { alert('Lỗi: ' + (e?.message || '')); }
    setRunning(false);
  };

  const SCHEDULE = [
    { t: '07:00', name: 'Autopilot — đồng bộ + bản tin + nhắc quá hạn → quản lý' },
    { t: '07:30', name: 'Trợ lý AI sinh việc cho 24 nhân sự → duyệt qua Telegram' },
    { t: '15:00', name: 'Nhắc việc quá hạn buổi chiều → quản lý' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-fuchsia-700 to-indigo-600 rounded-3xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1"><Workflow className="w-5 h-5" /><span className="font-black">Tự động hoá & Jobs</span></div>
        <p className="text-sm opacity-90">Trợ lý AI điều phối quy trình tự động qua công cụ tự động hoá + các job nền (cào lead, đồng bộ). Quy trình phức tạp dựng trực quan trong công cụ tự động hoá.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-600"><Workflow className="w-6 h-6" /></div>
          <div>
            <div className="font-black text-slate-900">Tự động hoá</div>
            <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Engine đang chạy</div>
          </div>
        </div>
        <a href="https://n8n.fbgproperty.vn" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700">
          <ExternalLink className="w-4 h-4" /> Mở công cụ tự động hoá quản lý quy trình
        </a>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3"><Database className="w-5 h-5 text-fuchsia-600" /><span className="font-black text-slate-900">Jobs nền — cào & đồng bộ dữ liệu</span></div>
        {loading ? <div className="flex justify-center py-6 text-indigo-600"><Loader2 className="w-6 h-6 animate-spin" /></div> :
          jobs.length === 0 ? <p className="text-sm text-slate-400">Chưa có job. Tạo job cào lead trong Marketing → Kênh.</p> : (
            <div className="space-y-2">
              {jobs.slice(0, 20).map((j: any, i: number) => {
                const st = String(j.status || j.state || '').toLowerCase();
                const done = /done|completed|success|finish/.test(st);
                return (
                  <div key={j._id || i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                    {done ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <Clock className="w-4 h-4 text-amber-500 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-slate-800 truncate">{j.keyword || j.name || j.type || j.source || 'Job cào'}</div>
                      <div className="text-[11px] text-slate-400 truncate">{j.target || j.url || j.note || ''} {j.count != null && `· ${j.count} kết quả`}</div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 shrink-0">{j.status || j.state || '—'}</span>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2"><Bot className="w-5 h-5" /><span className="font-black">Autopilot — Trợ lý điều hành AI tự trị mỗi ngày</span></div>
          <button onClick={runNow} disabled={running} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-700 rounded-xl font-black text-sm hover:bg-emerald-50 disabled:opacity-60">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Chạy ngay
          </button>
        </div>
        <p className="text-sm opacity-90 mt-1">Trợ lý AI tự động đồng bộ dữ liệu, viết bản tin vận hành và nhắc việc quá hạn — gửi thẳng vào Telegram của 8 quản lý. Không cần bấm tay.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
          {[['Nhân sự', ap?.staff], ['Quản lý', ap?.managers], ['Việc hôm nay', ap?.worklog_today], ['Chờ duyệt', ap?.worklog_pending], ['Quá hạn', ap?.overdue]].map(([k, v]) => (
            <div key={String(k)} className="bg-white/15 rounded-xl px-3 py-2">
              <div className="text-xl font-black">{v ?? '—'}</div>
              <div className="text-[10px] opacity-80 font-bold">{k}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center gap-2 mb-3"><Clock className="w-5 h-5 text-emerald-600" /><span className="font-black text-slate-900">Lịch tự trị (cron)</span></div>
          <div className="space-y-2">
            {SCHEDULE.map(s => (
              <div key={s.t} className="flex items-start gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                <span className="text-sm font-black text-emerald-600 shrink-0 w-12">{s.t}</span>
                <span className="text-[13px] text-slate-700 font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /><span className="font-black text-slate-900">Lần chạy gần nhất</span></div>
            <span className="text-[11px] text-slate-400 font-bold">{ap?.date || 'chưa chạy'} · {fmtTs(ap?.ts)}</span>
          </div>
          {(ap?.steps || []).length === 0 ? (
            <p className="text-[12px] text-slate-400">Autopilot sẽ tự chạy lúc 07:00 sáng mai. Bấm "Chạy ngay" để chạy thử.</p>
          ) : (
            <div className="space-y-2">
              {ap.steps.map((st: any, i: number) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                  {st.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-sm text-slate-800 truncate">{st.name}</div>
                    <div className="text-[11px] text-slate-400 truncate">{st.detail}</div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 shrink-0">{st.ms != null ? st.ms + 'ms' : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutomationOps;
