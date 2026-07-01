import React, { useEffect, useState } from 'react';
import { Loader2, Phone, Building2, RefreshCw, Percent, Sparkles, HeartHandshake, Check } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);

// Badge/bar color theo xác suất chốt.
const predStyle = (n: number): { badge: string; bar: string } => {
  const v = Number(n) || 0;
  if (v >= 60) return { badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' };
  if (v >= 35) return { badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' };
  return { badge: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400' };
};

const PredictLeads: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');
  const [queued, setQueued] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await api.salesPredict();
      const list = arr(r);
      setItems(list);
      setTotal(Number((r as any)?.total) || list.length);
      setQueued({});
    } catch (e: any) { setErr(e?.message || 'Không tải được dự đoán.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const queue = async (c: any) => {
    const id = String(c?.id);
    const name = c?.name || 'anh/chị';
    const project = c?.project || 'dự án';
    setBusy(id);
    try {
      await api.outreachQueue({
        cid: id,
        name,
        channel: 'Tin nhắn',
        type: 'nurture',
        message: `Chào anh/chị ${name}, về dự án ${project} em có thông tin/ưu đãi mới muốn chia sẻ. Anh/chị sắp xếp thời gian nghe tư vấn nhé ạ.`,
      });
      setQueued(q => ({ ...q, [id]: true }));
    } catch (e: any) {
      setErr(e?.message || 'Xếp hàng chăm sóc lỗi.');
    }
    setBusy('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 text-white bg-gradient-to-br from-indigo-600 to-violet-600">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1"><Percent className="w-5 h-5" /><span className="font-black">Dự đoán khả năng chốt (Trợ lý AI)</span></div>
            <p className="text-sm opacity-90">Xếp theo xác suất chốt — dồn sức vào khách dễ thắng.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-xl font-black text-xs backdrop-blur"><RefreshCw className="w-3.5 h-3.5" /> Tải lại</button>
        </div>
        <div className="mt-2 text-3xl font-black">{loading ? '…' : total} <span className="text-base font-bold opacity-80">khách</span></div>
      </div>

      {err && <div className="text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold">{err}</div>}

      {loading ? (
        <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-3"><Sparkles className="w-6 h-6" /></div>
          <p className="text-sm text-slate-500 font-bold">Chưa có khách để dự đoán. Triển khai dự án để có khách.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {items.map((c: any) => {
            const id = String(c?.id);
            const pct = Math.max(0, Math.min(100, Number(c?.predict) || 0));
            const st = predStyle(pct);
            const isBusy = busy === id;
            const done = !!queued[id];
            return (
              <div key={id} className="px-4 py-3 flex items-start gap-3">
                <div className="w-16 shrink-0 space-y-1">
                  <span className={`inline-flex items-center justify-center text-sm font-black px-2 py-1 rounded-lg w-full ${st.badge}`}>{pct}%</span>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm truncate">{c?.name || 'Khách'}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{c?.stage || 'Quan tâm'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                    {c?.phone && <span className="inline-flex items-center gap-0.5"><Phone className="w-3 h-3" />{c.phone}</span>}
                    {c?.project && <span className="inline-flex items-center gap-0.5 truncate"><Building2 className="w-3 h-3" />{c.project}</span>}
                  </div>
                  {c?.reason && <div className="text-[12px] text-slate-500 leading-snug">{c.reason}</div>}

                  <div className="pt-1">
                    {done ? (
                      <span className="inline-flex items-center gap-1.5 text-[12px] font-black text-emerald-600"><Check className="w-3.5 h-3.5" /> Đã xếp hàng ✓</span>
                    ) : (
                      <button disabled={isBusy} onClick={() => queue(c)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-black text-[12px] hover:bg-indigo-700 disabled:opacity-40">
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <HeartHandshake className="w-3.5 h-3.5" />} Xếp hàng chăm sóc
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PredictLeads;
