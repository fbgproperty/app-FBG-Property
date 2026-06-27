import React, { useState } from 'react';
import { Bot, Network, ShieldCheck } from 'lucide-react';
import AIAgents from './AIAgents';
import AIOrgChart from './AIOrgChart';
import OrgChart from './OrgChart';

type Tab = 'agents' | 'ai-org' | 'org';

const TABS: { id: Tab; label: string; icon: any; desc: string }[] = [
  { id: 'agents', label: 'Nhân viên AI', icon: Bot, desc: 'Lực lượng bán hàng tự động' },
  { id: 'ai-org', label: 'Sơ đồ đội AI', icon: Network, desc: 'Vai trò · ai dưới quyền ai' },
  { id: 'org', label: 'Sơ đồ tổ chức', icon: ShieldCheck, desc: 'Nhân sự thật · ký duyệt' },
];

const TeamHub: React.FC = () => {
  const initial = (typeof window !== 'undefined' && (new URLSearchParams(window.location.hash.split('?')[1] || '').get('tab') as Tab)) || 'agents';
  const [tab, setTab] = useState<Tab>(['agents', 'ai-org', 'org'].includes(initial) ? initial : 'agents');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {TABS.map(t => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{t.label}</span>
              <span className={`hidden md:inline text-[10px] font-bold ${active ? 'text-indigo-200' : 'text-slate-300'}`}>· {t.desc}</span>
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in duration-300">
        {tab === 'agents' && <AIAgents />}
        {tab === 'ai-org' && <AIOrgChart />}
        {tab === 'org' && <OrgChart />}
      </div>
    </div>
  );
};

export default TeamHub;
