import React, { useState } from 'react';
import { Server, Activity, UserCog, Lock } from 'lucide-react';
import Billing from './Billing';
import UsersPage from './UsersPage';
import RolesPage from './RolesPage';

type Sec = 'infra' | 'users' | 'roles';
const SECTIONS: { id: Sec; label: string; icon: any }[] = [
  { id: 'infra', label: 'Hạ tầng & Chi phí', icon: Activity },
  { id: 'users', label: 'Người dùng', icon: UserCog },
  { id: 'roles', label: 'Vai trò & Phân quyền', icon: Lock },
];

const TechnologyOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('infra');
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-slate-700 flex items-center justify-center text-white shadow-lg"><Server className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Công nghệ</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Hạ tầng & Chi phí · Người dùng · Vai trò & Phân quyền</p>
        </div>
      </header>

      <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {SECTIONS.map(s => {
          const active = sec === s.id; const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSec(s.id)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition ${active ? 'bg-slate-700 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in duration-300">
        {sec === 'infra' && <Billing />}
        {sec === 'users' && <UsersPage />}
        {sec === 'roles' && <RolesPage />}
      </div>
    </div>
  );
};

export default TechnologyOS;
