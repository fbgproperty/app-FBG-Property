import React, { useEffect, useState } from 'react';
import { Workflow, ExternalLink, Loader2, Database, CheckCircle2, Clock, Zap } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => { const c = Array.isArray(x) ? x : (x?.data?.items || x?.items || x?.data?.data || x?.data); return Array.isArray(c) ? c : []; };

const AutomationOps: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let uid = '';
      try { const p = await api.mktGet('auth/profile'); uid = p?.data?._id || ''; } catch { /* */ }
      try { setJobs(arr(await api.mktGet('collect/fb/jobs?userId=' + uid + '&page=1&limit=50'))); } catch { /* */ }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-fuchsia-700 to-indigo-600 rounded-3xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1"><Workflow className="w-5 h-5" /><span className="font-black">Tự động hoá — n8n & Jobs</span></div>
        <p className="text-sm opacity-90">Hermes điều phối quy trình tự động qua n8n + các job nền (cào lead, đồng bộ). Quy trình phức tạp dựng trực quan trong n8n.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-fuchsia-50 flex items-center justify-center text-fuchsia-600"><Workflow className="w-6 h-6" /></div>
          <div>
            <div className="font-black text-slate-900">n8n Automation</div>
            <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Engine đang chạy · n8n.fbgproperty.vn</div>
          </div>
        </div>
        <a href="https://n8n.fbgproperty.vn" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700">
          <ExternalLink className="w-4 h-4" /> Mở n8n quản lý quy trình
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

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-1"><Zap className="w-5 h-5 text-amber-500" /><span className="font-black text-slate-900">Tự động hoá tự trị (Hermes cron)</span></div>
        <p className="text-[12px] text-slate-400">Sắp bật: bản tin vận hành mỗi sáng · nhắc deadline công việc ERP · giao lead nóng cho sale · cào thị trường định kỳ · cảnh báo VM/số dư API — điều phối qua n8n + Hermes.</p>
      </div>
    </div>
  );
};

export default AutomationOps;
