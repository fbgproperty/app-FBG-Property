import React, { useEffect, useState } from 'react';
import { Users, Loader2, Phone, MapPin, Star, Eye, Building2 } from 'lucide-react';
import { api } from '../services/apiService';
import Customer360 from './Customer360';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);

const AssignedLeads: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selId, setSelId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await api.deployMyAssigned();
      const list = arr(r);
      setItems(list);
      setTotal(Number((r as any)?.total) || list.length);
    } catch (e: any) { setErr(e?.message || 'Không tải được danh sách khách được giao.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 text-white bg-gradient-to-br from-emerald-600 to-teal-600">
        <div className="flex items-center gap-2 mb-1"><Users className="w-5 h-5" /><span className="font-black">Khách quan tâm được giao</span></div>
        <p className="text-sm opacity-90">Khách đã được Trợ lý AI lọc theo tín hiệu quan tâm và giao về cho bạn. Mở 360° để xem tư vấn chốt.</p>
        <div className="mt-2 text-3xl font-black">{loading ? '…' : total} <span className="text-base font-bold opacity-80">khách</span></div>
      </div>

      {err && <div className="text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold">{err}</div>}

      {loading ? <div className="flex justify-center py-10 text-emerald-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-3"><Users className="w-6 h-6" /></div>
          <p className="text-sm text-slate-500 font-bold">Chưa có khách được giao.</p>
          <p className="text-[12px] text-slate-400 mt-1">Khi admin triển khai dự án, khách quan tâm sẽ tự động về đây.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {items.map((c: any) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
              <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Users className="w-4 h-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-800 text-sm truncate">{c.name || 'Khách'}</div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                  {c.phone && <span className="inline-flex items-center gap-0.5"><Phone className="w-3 h-3" />{c.phone}</span>}
                  {c.project && <span className="inline-flex items-center gap-0.5"><Building2 className="w-3 h-3" />{c.project}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px] shrink-0">
                <span className="inline-flex items-center gap-0.5 font-black text-indigo-600" title="Điểm"><Star className="w-3 h-3" />{Number(c.score) || 0}</span>
                <span className="inline-flex items-center gap-0.5 font-black text-emerald-600" title="Tín hiệu khớp"><MapPin className="w-3 h-3" />{Number(c.hits) || 0}</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{c.stage || 'Quan tâm'}</span>
              </div>
              <button onClick={() => setSelId(String(c.id))} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-black text-[12px] hover:bg-indigo-700 shrink-0">
                <Eye className="w-3.5 h-3.5" /> Xem 360°
              </button>
            </div>
          ))}
        </div>
      )}

      {selId && <Customer360 id={selId} onClose={() => setSelId(null)} />}
    </div>
  );
};

export default AssignedLeads;
