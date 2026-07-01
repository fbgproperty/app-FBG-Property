import React, { useState } from 'react';
import { BarChart3, LayoutDashboard, Briefcase, Megaphone, TrendingUp } from 'lucide-react';
import ReportOverview from './ReportOverview';
import SalesReport from './SalesReport';
import MarketingROI from './MarketingROI';
import AnalyticsBoard from './AnalyticsBoard';

type Sec = 'overview' | 'sales' | 'marketing' | 'analytics';
const SECTIONS: { id: Sec; label: string; icon: any }[] = [
  { id: 'overview', label: 'Tổng hợp', icon: LayoutDashboard },
  { id: 'sales', label: 'Kinh doanh', icon: Briefcase },
  { id: 'marketing', label: 'Marketing', icon: Megaphone },
  { id: 'analytics', label: 'Phân tích', icon: TrendingUp },
];

const ReportOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('overview');
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-700 flex items-center justify-center text-white shadow-lg"><BarChart3 className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Báo cáo</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Tổng hợp toàn hệ thống · Kinh doanh · Marketing — do Trợ lý AI soạn</p>
        </div>
      </header>

      <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {SECTIONS.map(s => {
          const active = sec === s.id; const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSec(s.id)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition ${active ? 'bg-indigo-700 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in duration-300">
        {sec === 'overview' && <ReportOverview />}
        {sec === 'sales' && <SalesReport />}
        {sec === 'marketing' && <MarketingROI />}
        {sec === 'analytics' && <AnalyticsBoard />}
      </div>
    </div>
  );
};

export default ReportOS;
