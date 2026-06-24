import React, { useEffect, useState } from 'react';
import { Rocket, Loader2, Building2, CheckCircle2, Clock, BadgeCheck } from 'lucide-react';
import { api } from '../services/apiService';

const getUser = () => { try { return JSON.parse(localStorage.getItem('fbg_user') || '{}'); } catch { return {}; } };

const SaleProjects: React.FC = () => {
  const user = getUser();
  const [projects, setProjects] = useState<any[]>([]);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [all, mine] = await Promise.all([api.getDeployProjects(), api.deployMy(user.email || '')]);
      setProjects(all.items || []);
      const st: Record<string, string> = {};
      (mine.projects || []).forEach((p: any) => { st[p.id] = p.status; });
      setStatus(st);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const register = async (p: any) => {
    setBusy(p.id);
    try {
      await api.deploySellRegister({ projectId: p.id, projectName: p.name, email: user.email, name: user.name || '' });
      await load();
    } catch (e: any) { alert(e?.message); } finally { setBusy(''); }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-indigo-600"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><Rocket className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Dự án đang triển khai</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Đăng ký xin bán dự án — được duyệt sẽ nhận data khách (net) để bán.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => {
          const st = status[p.id];
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Building2 className="w-5 h-5" /></div>
                <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{p.id}</span>
              </div>
              <h3 className="font-black text-slate-900 text-[15px]">{p.name}</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5 mb-4">{p.location || '—'} · {p.status || 'Đang mở'}</p>
              {st === 'approved' ? (
                <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-black text-sm"><BadgeCheck className="w-4 h-4" /> Được duyệt bán</div>
              ) : st === 'pending' ? (
                <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-black text-sm"><Clock className="w-4 h-4" /> Đang chờ duyệt</div>
              ) : (
                <button onClick={() => register(p)} disabled={busy === p.id} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
                  {busy === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Đăng ký bán
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SaleProjects;
