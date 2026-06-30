import React, { useState } from 'react';
import { Cpu, ClipboardCheck, Workflow, Bot, Network } from 'lucide-react';
import ErpTasks from './ErpTasks';
import AutomationOps from './AutomationOps';
import AIAgents from './AIAgents';
import AIOrgChart from './AIOrgChart';
import OrgChart from './OrgChart';

type Sec = 'tasks' | 'automation' | 'agents' | 'org';
const SECTIONS: { id: Sec; label: string; icon: any }[] = [
  { id: 'tasks', label: 'Công việc (ERP)', icon: ClipboardCheck },
  { id: 'automation', label: 'Tự động hoá', icon: Workflow },
  { id: 'agents', label: 'Đội ngũ AI', icon: Bot },
  { id: 'org', label: 'Tổ chức', icon: Network },
];

const OperationsOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('tasks');
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg"><Cpu className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Vận hành</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Công việc ERP · Tự động hoá · Đội ngũ AI · Tổ chức</p>
        </div>
      </header>

      <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {SECTIONS.map(s => {
          const active = sec === s.id; const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSec(s.id)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition ${active ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in duration-300">
        {sec === 'tasks' && <ErpTasks />}
        {sec === 'automation' && <AutomationOps />}
        {sec === 'agents' && <AIAgents />}
        {sec === 'org' && <div className="space-y-6"><AIOrgChart /><OrgChart /></div>}
      </div>
    </div>
  );
};

export default OperationsOS;
