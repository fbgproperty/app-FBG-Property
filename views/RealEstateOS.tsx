import React, { useState } from 'react';
import { Building2, LayoutDashboard, ClipboardList, TrendingUp, Newspaper } from 'lucide-react';
import EstateAgency from './EstateAgency';
import SalePlanner from './SalePlanner';
import MarketResearch from './MarketResearch';
import ListingPublisher from './ListingPublisher';

type Sec = 'overview' | 'saleplan' | 'market' | 'listing';
const SECTIONS: { id: Sec; label: string; icon: any }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'saleplan', label: 'Kế hoạch bán', icon: ClipboardList },
  { id: 'market', label: 'Nghiên cứu thị trường', icon: TrendingUp },
  { id: 'listing', label: 'Đăng tin', icon: Newspaper },
];

const RealEstateOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('overview');
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><Building2 className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Sàn BĐS AI</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Rổ hàng · Kế hoạch bán · Nghiên cứu thị trường · Đăng tin — tự trị bằng AI</p>
        </div>
      </header>

      <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {SECTIONS.map(s => {
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
        {sec === 'saleplan' && <SalePlanner />}
        {sec === 'market' && <MarketResearch />}
        {sec === 'listing' && <ListingPublisher />}
      </div>
    </div>
  );
};

export default RealEstateOS;
