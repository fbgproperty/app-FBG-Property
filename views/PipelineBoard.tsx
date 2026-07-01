import React, { useEffect, useState } from 'react';
import { Loader2, Phone, Building2, Star, ChevronLeft, ChevronRight, Columns3, RefreshCw } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);

const STAGES = ['Mới', 'Tiếp cận', 'Quan tâm', 'Nóng', 'Đặt lịch', 'Đặt cọc', 'Hợp đồng', 'Khách hàng', 'Mất'];

// Map legacy / variant stage values onto the fixed pipeline order.
const normStage = (s: any): string => {
  const v = String(s || '').trim();
  if (!v) return 'Mới';
  const low = v.toLowerCase();
  if (low === 'mới giao' || low === 'moi giao' || low === 'moi' || low === 'mới') return 'Mới';
  const hit = STAGES.find(st => st.toLowerCase() === low);
  return hit || (STAGES.includes(v) ? v : 'Mới');
};

// Subtle per-stage color styling.
const stageStyle: Record<string, { head: string; badge: string; ring: string }> = {
  'Mới': { head: 'text-slate-600', badge: 'bg-slate-100 text-slate-600', ring: 'border-slate-200' },
  'Tiếp cận': { head: 'text-sky-600', badge: 'bg-sky-100 text-sky-700', ring: 'border-sky-200' },
  'Quan tâm': { head: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700', ring: 'border-indigo-200' },
  'Nóng': { head: 'text-rose-600', badge: 'bg-rose-100 text-rose-700', ring: 'border-rose-200' },
  'Đặt lịch': { head: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', ring: 'border-amber-200' },
  'Đặt cọc': { head: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', ring: 'border-emerald-200' },
  'Hợp đồng': { head: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', ring: 'border-emerald-300' },
  'Khách hàng': { head: 'text-teal-600', badge: 'bg-teal-100 text-teal-700', ring: 'border-teal-200' },
  'Mất': { head: 'text-slate-400', badge: 'bg-slate-100 text-slate-400', ring: 'border-slate-200' },
};
const styleFor = (s: string) => stageStyle[s] || stageStyle['Mới'];

const PipelineBoard: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<string>('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await api.deployMyAssigned();
      setItems(arr(r).map((c: any) => ({ ...c, stage: normStage(c?.stage) })));
    } catch (e: any) { setErr(e?.message || 'Không tải được pipeline.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const move = async (id: string, newStage: string) => {
    if (!id || !newStage) return;
    const key = String(id);
    const prev = items;
    setBusy(key);
    setItems(list => list.map(c => (String(c.id) === key ? { ...c, stage: newStage } : c)));
    try {
      await api.deployAssignStage(key, newStage);
    } catch (e: any) {
      setItems(prev); // rollback on failure
      setErr(e?.message || 'Cập nhật giai đoạn lỗi.');
    }
    setBusy('');
  };

  const total = items.length;
  const grouped: Record<string, any[]> = {};
  STAGES.forEach(s => { grouped[s] = []; });
  items.forEach(c => { const s = normStage(c?.stage); (grouped[s] = grouped[s] || []).push(c); });

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 text-white bg-gradient-to-br from-emerald-600 to-teal-600">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1"><Columns3 className="w-5 h-5" /><span className="font-black">Pipeline bán hàng</span></div>
            <p className="text-sm opacity-90">Kéo khách qua từng giai đoạn để theo dõi tiến độ chốt. Trợ lý AI giao khách quan tâm về cột đầu tiên.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-xl font-black text-xs backdrop-blur"><RefreshCw className="w-3.5 h-3.5" /> Tải lại</button>
        </div>
        <div className="mt-2 text-3xl font-black">{loading ? '…' : total} <span className="text-base font-bold opacity-80">khách</span></div>
      </div>

      {err && <div className="text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold">{err}</div>}

      {/* Legend */}
      <div className="flex items-center gap-2 flex-wrap">
        {STAGES.map(s => { const st = styleFor(s); return (
          <span key={s} className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg ${st.badge}`}>{s} · {grouped[s]?.length || 0}</span>
        ); })}
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-emerald-600"><Loader2 className="w-7 h-7 animate-spin" /></div>
      ) : total === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-3"><Columns3 className="w-6 h-6" /></div>
          <p className="text-sm text-slate-500 font-bold">Chưa có khách trong pipeline. Triển khai dự án ở Sàn BĐS để khách quan tâm về đây.</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {STAGES.map(stage => {
            const st = styleFor(stage);
            const idx = STAGES.indexOf(stage);
            const col = grouped[stage] || [];
            return (
              <div key={stage} className={`shrink-0 w-64 bg-slate-50 rounded-2xl border ${st.ring} p-2.5 space-y-2.5`}>
                <div className="flex items-center justify-between px-1">
                  <span className={`font-black text-sm ${st.head}`}>{stage}</span>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${st.badge}`}>{col.length}</span>
                </div>
                <div className="space-y-2 min-h-[40px]">
                  {col.map((c: any) => {
                    const id = String(c?.id);
                    const isBusy = busy === id;
                    return (
                      <div key={id} className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm space-y-2">
                        <div className="font-bold text-slate-800 text-sm truncate">{c?.name || 'Khách'}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                          {c?.phone && <span className="inline-flex items-center gap-0.5"><Phone className="w-3 h-3" />{c.phone}</span>}
                          {c?.project && <span className="inline-flex items-center gap-0.5 truncate"><Building2 className="w-3 h-3" />{c.project}</span>}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-0.5 font-black text-indigo-600 text-[11px]" title="Điểm"><Star className="w-3 h-3" />{Number(c?.score) || 0}</span>
                          <div className="flex items-center gap-1">
                            <button disabled={idx <= 0 || isBusy} onClick={() => move(id, STAGES[idx - 1])} className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-600" title="Lùi giai đoạn"><ChevronLeft className="w-3.5 h-3.5" /></button>
                            <button disabled={idx >= STAGES.length - 1 || isBusy} onClick={() => move(id, STAGES[idx + 1])} className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center text-slate-600" title="Tiến giai đoạn"><ChevronRight className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <select value={stage} disabled={isBusy} onChange={e => move(id, e.target.value)} className="w-full p-1.5 rounded-lg border border-slate-200 text-[12px] font-bold bg-white">
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    );
                  })}
                  {col.length === 0 && <div className="text-[11px] text-slate-300 font-bold text-center py-3">—</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PipelineBoard;
