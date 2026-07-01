import React, { useState } from 'react';
import { Briefcase, LayoutDashboard, Users, Zap, BarChart3, UserCheck, Columns3, HeartHandshake, Flame, Percent, Send } from 'lucide-react';
import BusinessAgency from './BusinessAgency';
import PipelineBoard from './PipelineBoard';
import NextActionPanel from './NextActionPanel';
import NurtureSequence from './NurtureSequence';
import SalesReport from './SalesReport';
import CDP from './CDP';
import MyLeads from './MyLeads';
import AssignedLeads from './AssignedLeads';
import HotLeads from './HotLeads';
import PredictLeads from './PredictLeads';
import OutreachQueue from './OutreachQueue';
import { isAdminRole } from '../services/permissions';

type Sec = 'overview' | 'mine' | 'hot' | 'predict' | 'assigned' | 'pipeline' | 'customers' | 'action' | 'nurture' | 'outreach' | 'report';
const SECTIONS: { id: Sec; label: string; icon: any; admin?: boolean }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'mine', label: 'Khách của tôi', icon: Users },
  { id: 'hot', label: 'Khách nóng', icon: Flame },
  { id: 'predict', label: 'Dự đoán chốt', icon: Percent },
  { id: 'assigned', label: 'Khách được giao', icon: UserCheck },
  { id: 'pipeline', label: 'Pipeline', icon: Columns3 },
  { id: 'customers', label: 'Tất cả khách (CDP)', icon: Users, admin: true },
  { id: 'action', label: 'Hành động AI', icon: Zap },
  { id: 'nurture', label: 'Chăm sóc tự động', icon: HeartHandshake },
  { id: 'outreach', label: 'Hàng chờ gửi', icon: Send },
  { id: 'report', label: 'Báo cáo kinh doanh', icon: BarChart3 },
];

const BusinessOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('overview');
  const role = (typeof localStorage !== 'undefined' && localStorage.getItem('fbg_role')) || 'ctv';
  const admin = isAdminRole(role);
  const sections = SECTIONS.filter(s => !s.admin || admin);
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
        {sections.map(s => {
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
        {sec === 'mine' && <MyLeads />}
        {sec === 'hot' && <HotLeads />}
        {sec === 'predict' && <PredictLeads />}
        {sec === 'assigned' && <AssignedLeads />}
        {sec === 'pipeline' && <PipelineBoard />}
        {sec === 'customers' && admin && <CDP />}
        {sec === 'action' && <NextActionPanel />}
        {sec === 'nurture' && <NurtureSequence />}
        {sec === 'outreach' && <OutreachQueue />}
        {sec === 'report' && <SalesReport />}
      </div>
    </div>
  );
};

export default BusinessOS;
