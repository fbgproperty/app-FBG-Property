import React, { useState } from 'react';
import { Building2, LayoutDashboard, ClipboardList, TrendingUp, Newspaper, Boxes, Rocket, Layers, Home } from 'lucide-react';
import EstateAgency from './EstateAgency';
import SalePlanner from './SalePlanner';
import MarketResearch from './MarketResearch';
import ListingPublisher from './ListingPublisher';
import Projects from './Property/Project/Projects';
import HousesApartments from './Property/Properties/HousesApartments';
import Deployment from './Deployment';
import DeployLaunch from './DeployLaunch';
import { isAdminRole } from '../services/permissions';

type Sec = 'overview' | 'data' | 'trienkhai' | 'deploy' | 'saleplan' | 'market' | 'listing';
const SECTIONS: { id: Sec; label: string; icon: any; admin?: boolean }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'data', label: 'Dữ liệu BĐS', icon: Boxes },
  { id: 'trienkhai', label: 'Triển khai', icon: Rocket, admin: true },
  { id: 'deploy', label: 'Triển khai hạ tầng', icon: Rocket, admin: true },
  { id: 'saleplan', label: 'Kế hoạch bán', icon: ClipboardList },
  { id: 'market', label: 'Nghiên cứu thị trường', icon: TrendingUp },
  { id: 'listing', label: 'Đăng tin', icon: Newspaper },
];

const DataSection: React.FC = () => {
  const [tab, setTab] = useState<'projects' | 'listings'>('projects');
  const TABS = [
    { id: 'projects' as const, label: 'Dự án', icon: Layers },
    { id: 'listings' as const, label: 'Tin đăng (Nhà · Căn hộ)', icon: Home },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map(t => {
          const on = tab === t.id; const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-sm transition ${on ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>
      <div>{tab === 'projects' ? <Projects /> : <HousesApartments />}</div>
    </div>
  );
};

const RealEstateOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('overview');
  const role = (typeof localStorage !== 'undefined' && localStorage.getItem('fbg_role')) || 'ctv';
  const admin = isAdminRole(role);
  const sections = SECTIONS.filter(s => !s.admin || admin);
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><Building2 className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Sàn BĐS AI</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Dữ liệu BĐS · Triển khai · Kế hoạch bán · Nghiên cứu thị trường · Đăng tin — tự trị bằng AI</p>
        </div>
      </header>

      <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {sections.map(s => {
          const active = sec === s.id; const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSec(s.id)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition ${active ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in duration-300">
        {sec === 'overview' && <EstateAgency onOpen={(s) => setSec(s as Sec)} />}
        {sec === 'data' && <DataSection />}
        {sec === 'trienkhai' && admin && <DeployLaunch />}
        {sec === 'deploy' && admin && <Deployment />}
        {sec === 'saleplan' && <SalePlanner />}
        {sec === 'market' && <MarketResearch />}
        {sec === 'listing' && <ListingPublisher />}
      </div>
    </div>
  );
};

export default RealEstateOS;
