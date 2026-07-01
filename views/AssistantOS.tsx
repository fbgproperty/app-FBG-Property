import React, { useState } from 'react';
import { Sparkles, LayoutDashboard, MessageSquare, ClipboardList, ListChecks } from 'lucide-react';
import OpsCommand from './OpsCommand';
import TroLyAI from './TroLyAI';
import WorkApproval from './WorkApproval';
import ExecutiveCockpit from './ExecutiveCockpit';

type Sec = 'today' | 'command' | 'work' | 'chat';
const SECTIONS: { id: Sec; label: string; icon: any }[] = [
  { id: 'today', label: 'Ưu tiên hôm nay', icon: ListChecks },
  { id: 'command', label: 'Chỉ huy', icon: LayoutDashboard },
  { id: 'work', label: 'Công việc', icon: ClipboardList },
  { id: 'chat', label: 'Trò chuyện Trợ lý AI', icon: MessageSquare },
];

const AssistantOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('today');
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg"><Sparkles className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Trợ lý AI</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Bộ não chỉ huy toàn bộ các OS · ra lệnh trực tiếp bằng hội thoại</p>
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
        {sec === 'today' && <ExecutiveCockpit />}
        {sec === 'command' && <OpsCommand />}
        {sec === 'work' && <WorkApproval />}
        {sec === 'chat' && <TroLyAI />}
      </div>
    </div>
  );
};

export default AssistantOS;
