import React, { useState } from 'react';
import { Briefcase, LayoutDashboard, Users, Zap, BarChart3 } from 'lucide-react';
import BusinessAgency from './BusinessAgency';
import NextActionPanel from './NextActionPanel';
import SalesReport from './SalesReport';
import CDP from './CDP';

type Sec = 'overview' | 'customers' | 'action' | 'report';
const SECTIONS: { id: Sec; label: string; icon: any }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'customers', label: 'Khách hàng', icon: Users },
  { id: 'action', label: 'Hành động AI', icon: Zap },
  { id: 'report', label: 'Báo cáo kinh doanh', icon: BarChart3 },
];

const BusinessOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('overview');
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg"><Briefcase className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Kinh doanh</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Khách hàng · Pipeline · Hành động AI · Báo cáo — tự trị bằng AI</p>
        </div>
      </header>

      <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {SECTIONS.map(s => {
          const active = sec === s.id; const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSec(s.id)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition ${active ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in duration-300">
        {sec === 'overview' && <BusinessAgency onOpen={(s) => setSec(s as Sec)} />}
        {sec === 'customers' && <CDP />}
        {sec === 'action' && <NextActionPanel />}
        {sec === 'report' && <SalesReport />}
      </div>
    </div>
  );
};

export default BusinessOS;
