import React, { useEffect, useState } from 'react';
import { Users, Loader2, RefreshCw, Phone, ShieldCheck, Search, Globe } from 'lucide-react';
import { api } from '../services/apiService';

const STATUS_C: Record<string, string> = {
  Lead: 'bg-slate-100 text-slate-600', Open: 'bg-sky-50 text-sky-700', Replied: 'bg-amber-50 text-amber-700',
  Opportunity: 'bg-indigo-50 text-indigo-700', Converted: 'bg-emerald-50 text-emerald-700', Interested: 'bg-fuchsia-50 text-fuchsia-700',
};

const MyLeads: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ total: number; scoped: boolean; owner: string }>({ total: 0, scoped: false, owner: '' });
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await api.erpLeads({ limit: 100, q: q.trim() || undefined });
      setItems(r.items || []);
      setMeta({ total: r.total ?? (r.items || []).length, scoped: !!r.scoped, owner: r.owner || '' });
    } catch (e: any) { setErr(e?.message || 'Không tải được khách hàng từ ERP.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="space-y-4">
      <div className={`rounded-3xl p-5 text-white ${meta.scoped ? 'bg-gradient-to-br from-emerald-600 to-teal-600' : 'bg-gradient-to-br from-indigo-700 to-slate-900'}`}>
        <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-5 h-5" /><span className="font-black">{meta.scoped ? 'Khách của tôi' : 'Toàn bộ khách (đồng bộ)'}</span></div>
        <p className="text-sm opacity-90">
          {meta.scoped
            ? <>Dữ liệu RIÊNG của bạn — đồng bộ thật từ ERP (lead_owner = <b>{meta.owner}</b>). Người khác không thấy.</>
            : <>Bạn đang ở quyền quản trị — thấy <b>đồng bộ toàn bộ</b> khách của hệ thống.</>}
        </p>
        <div className="mt-2 text-3xl font-black">{loading ? '…' : meta.total} <span className="text-base font-bold opacity-80">khách</span></div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Tìm tên / số điện thoại..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Tải</button>
      </div>
      {err && <div className="text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold">{err}</div>}

      {loading ? <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {items.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm">Chưa có khách.</div> :
            items.map((c: any) => (
              <div key={c.name} className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Users className="w-4 h-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-sm truncate">{c.lead_name || c.name}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    {c.mobile_no && <span className="inline-flex items-center gap-0.5"><Phone className="w-3 h-3" />{c.mobile_no}</span>}
                    {c.source && <span className="inline-flex items-center gap-0.5"><Globe className="w-3 h-3" />{c.source}</span>}
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${STATUS_C[c.status] || 'bg-slate-100 text-slate-500'}`}>{c.status || 'Lead'}</span>
              </div>
            ))}
        </div>
      )}
      <p className="text-[11px] text-slate-400">Nguồn: ERP (erp.fbgproperty.vn) · cô lập theo người đăng nhập — nhân sự xem dữ liệu riêng, admin đồng bộ toàn bộ.</p>
    </div>
  );
};

export default MyLeads;
