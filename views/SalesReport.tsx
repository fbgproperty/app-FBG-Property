import React, { useEffect, useState } from 'react';
import { BarChart3, Users, Flame, MessageSquare, CheckCircle2, Loader2, Sparkles, Copy, Check, Bot } from 'lucide-react';
import { api } from '../services/apiService';

const SalesReport: React.FC = () => {
  const [d, setD] = useState({ khach: 0, lead: 0, hot: 0, projects: 0 });
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState('');
  const [gen, setGen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      const [sum, proj] = await Promise.allSettled([
        api.erpMySummary(),
        api.getDeployProjects(),
      ]);
      const s: any = sum.status === 'fulfilled' ? sum.value : {};
      setD({
        khach: s.total || 0,
        lead: (s.Open || 0) + (s.Replied || 0),
        hot: s.Opportunity || 0,
        projects: proj.status === 'fulfilled' ? ((proj.value as any)?.total ?? (proj.value as any)?.items?.length ?? 0) : 0,
      });
      setLoading(false);
    })();
  }, []);

  const genReport = async () => {
    setGen(true); setReport('');
    try {
      const r = await api.salesReport({ khach_cdp: d.khach, lead: d.lead, lead_nong: d.hot, du_an: d.projects }, 'tuần này');
      setReport(r?.text || 'Không có dữ liệu.');
    } catch (e: any) { setReport('Lỗi: ' + (e?.message || '')); }
    setGen(false);
  };
  const copy = () => { navigator.clipboard?.writeText(report); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const KPIS = [
    { label: 'Khách (ERP)', val: d.khach, icon: Users, c: 'bg-emerald-600' },
    { label: 'Đang xử lý', val: d.lead, icon: MessageSquare, c: 'bg-fuchsia-600' },
    { label: 'Cơ hội (nóng)', val: d.hot, icon: Flame, c: 'bg-rose-500' },
    { label: 'Dự án đang bán', val: d.projects, icon: CheckCircle2, c: 'bg-indigo-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Báo cáo kinh doanh & Dự báo</span></div>
      {loading ? <div className="flex justify-center py-8 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {KPIS.map(x => (
            <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${x.c} flex items-center justify-center text-white mb-2`}><x.icon className="w-5 h-5" /></div>
              <p className="text-3xl font-black text-slate-900">{x.val}</p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">{x.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2"><Bot className="w-5 h-5 text-fuchsia-600" /><span className="font-black text-slate-900">Giám đốc kinh doanh AI — báo cáo & dự báo</span></div>
          <button onClick={genReport} disabled={gen} className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60">
            {gen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tạo báo cáo AI
          </button>
        </div>
        {report
          ? <div className="relative">
              <button onClick={copy} className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4 pr-16">{report}</div>
            </div>
          : <p className="text-[12px] text-slate-400">AI phân tích sức khoẻ pipeline (khách · lead · điểm nóng · dự án) → điểm nghẽn, dự báo doanh số, 3 hành động ưu tiên cho đội sale. Nối ERP (giá trị deal) sẽ có dự báo doanh thu đầy đủ.</p>}
      </div>
    </div>
  );
};

export default SalesReport;
