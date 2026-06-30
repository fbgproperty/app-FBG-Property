import React, { useEffect, useState } from 'react';
import { BarChart3, Users, Target, Building2, DollarSign, TrendingUp, Loader2, Bot, Clock, Sparkles, FileText } from 'lucide-react';
import { api } from '../services/apiService';

const MarketingROI: React.FC = () => {
  const [d, setD] = useState({ cdp: 0, leads: 0, projects: 0 });
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState('');
  const [genning, setGenning] = useState(false);
  const genReport = async () => {
    setGenning(true); setReport('');
    try {
      const r = await api.analystReport({ khach_cdp: d.cdp, lead: d.leads, du_an_dang_ban: d.projects }, 'tuần này');
      setReport(r?.text || 'Không có dữ liệu.');
    } catch (e: any) { setReport('Lỗi: ' + (e?.message || '')); }
    setGenning(false);
  };
  useEffect(() => {
    (async () => {
      const [cdp, leads, proj] = await Promise.allSettled([
        api.getCdpCustomers({ page: 1, pageSize: 1 }),
        api.getLeads({ page: 1, pageSize: 1 } as any),
        api.getDeployProjects(),
      ]);
      const tot = (x: any) => (x?.total ?? x?.totalItems ?? x?.data?.total ?? (x?.items?.length) ?? 0);
      setD({
        cdp: cdp.status === 'fulfilled' ? tot(cdp.value) : 0,
        leads: leads.status === 'fulfilled' ? tot(leads.value) : 0,
        projects: proj.status === 'fulfilled' ? ((proj.value as any)?.total ?? (proj.value as any)?.items?.length ?? 0) : 0,
      });
      setLoading(false);
    })();
  }, []);

  const real = [
    { label: 'Khách trong CDP', val: d.cdp, icon: Users, color: 'emerald' },
    { label: 'Lead', val: d.leads, icon: Target, color: 'fuchsia' },
    { label: 'Dự án đang bán', val: d.projects, icon: Building2, color: 'indigo' },
  ];
  const soon = [
    { label: 'Chi phí quảng cáo', icon: DollarSign, note: 'Nối Google/FB Ads (GĐ D)' },
    { label: 'Doanh thu deal', icon: DollarSign, note: 'Nối ERP (cọc/hợp đồng)' },
    { label: 'ROI marketing', icon: TrendingUp, note: 'Doanh thu ÷ chi phí' },
  ];
  const C: Record<string, string> = { emerald: 'bg-emerald-600', fuchsia: 'bg-fuchsia-600', indigo: 'bg-indigo-600' };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Báo cáo ROI Marketing</span></div>
      {loading ? <div className="flex justify-center py-8 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {real.map(x => (
            <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${C[x.color]} flex items-center justify-center text-white mb-2`}><x.icon className="w-5 h-5" /></div>
              <p className="text-3xl font-black text-slate-900">{x.val}</p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">{x.label}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Chỉ số ROI (đang nối nguồn dữ liệu)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {soon.map(x => (
            <div key={x.label} className="bg-white rounded-2xl border border-dashed border-slate-200 p-5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2"><x.icon className="w-5 h-5" /></div>
              <p className="text-2xl font-black text-slate-300">—</p>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">{x.label}</p>
              <p className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1"><Clock className="w-3 h-3" />{x.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-fuchsia-600" /><span className="font-black text-slate-900">Analyst — Báo cáo phân tích AI</span></div>
          <button onClick={genReport} disabled={genning} className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60">
            {genning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tạo báo cáo AI
          </button>
        </div>
        {report
          ? <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4">{report}</div>
          : <p className="text-[12px] text-slate-400">AI phân tích số liệu hiện có (CDP · lead · dự án) → tổng quan, điểm mạnh/yếu, 3 đề xuất hành động. Nối đủ Ads + ERP sẽ có ROI đầy đủ.</p>}
      </div>

      <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><Bot className="w-5 h-5" /><span className="font-black">Báo cáo ROI hằng ngày — Hermes</span></div>
        <p className="text-sm opacity-90">Khi đã nối đủ Ads (chi phí) + ERP (doanh thu), Hermes sẽ tổng hợp lead theo nguồn ↔ chi phí ↔ doanh thu deal từng dự án/kênh, tính ROI và gửi Anh Duy mỗi sáng (Telegram + app). <b>Cần</b>: token Ads + cron Hermes (bật ở backend).</p>
      </div>
    </div>
  );
};

export default MarketingROI;
