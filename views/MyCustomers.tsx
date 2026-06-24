import React, { useEffect, useState } from 'react';
import { Target, Loader2, Phone, Building2, BadgeCheck } from 'lucide-react';
import { api } from '../services/apiService';

const getUser = () => { try { return JSON.parse(localStorage.getItem('fbg_user') || '{}'); } catch { return {}; } };

const MyCustomers: React.FC = () => {
  const user = getUser();
  const [data, setData] = useState<{ projects: any[]; leads: any[] }>({ projects: [], leads: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setData(await api.deployMy(user.email || '')); } catch (e) { console.error(e); } finally { setLoading(false); }
    })();
    /* eslint-disable-next-line */
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center text-indigo-600"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  const approved = (data.projects || []).filter((p) => p.status === 'approved');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg"><Target className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Khách của tôi</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Data khách (net) được giao cho bạn từ các dự án đã duyệt.</p>
        </div>
      </header>

      <div>
        <h4 className="font-black text-slate-900 mb-2 flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-emerald-500" /> Dự án được duyệt bán ({approved.length})</h4>
        <div className="flex flex-wrap gap-2 mb-6">
          {approved.map((p) => <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"><Building2 className="w-3.5 h-3.5" /> {p.name}</span>)}
          {!approved.length && <span className="text-sm text-slate-400">Chưa được duyệt dự án nào. Vào "Dự án triển khai" để đăng ký bán.</span>}
        </div>
      </div>

      <div>
        <h4 className="font-black text-slate-900 mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-indigo-500" /> Khách được giao ({(data.leads || []).length})</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(data.leads || []).map((n: any, i: number) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black text-slate-900">{n.fullName}</h3>
                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">điểm {n.score ?? 0}</span>
              </div>
              <p className="text-sm text-slate-500 font-bold flex items-center gap-2 mb-1"><Phone className="w-4 h-4 text-slate-300" /> {n.phone || '—'}</p>
              <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {n.projectName}</p>
            </div>
          ))}
          {!(data.leads || []).length && <span className="text-sm text-slate-400">Chưa có khách nào được giao. Quản lý sẽ giao data net sau khi duyệt.</span>}
        </div>
      </div>
    </div>
  );
};

export default MyCustomers;
