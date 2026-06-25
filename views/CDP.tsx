import React, { useEffect, useState, useCallback } from 'react';
import {
  Loader2, Search, Phone, MessageCircle, Eye, Bot, UserCheck, Sparkles,
  Database, Gauge, Building2, Activity, ArrowRight, RefreshCw,
} from 'lucide-react';
import { api } from '../services/apiService';

const STAGES = ['Mới', 'Tiếp cận', 'Quan tâm', 'Nóng', 'Đặt lịch', 'Đặt cọc', 'Hợp đồng', 'Khách hàng', 'Mất'];

const CDP: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<any | null>(null);
  const [behavior, setBehavior] = useState<any>(null);
  const [nurture, setNurture] = useState<any>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(async (query = '') => {
    setLoading(true);
    try {
      const res: any = await api.getCdpCustomers({ q: query || undefined, page: 1, pageSize: 60 });
      setItems(res.items || []); setTotal(res.total || 0);
      if (!sel && res.items?.length) openCustomer(res.items[0]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openCustomer = async (c: any) => {
    setSel(c); setBehavior(null); setNurture(null);
    try { setBehavior(await api.getCustomerBehavior(c.id)); } catch { /* ignore */ }
  };

  const setStage = async (stage: string) => {
    if (!sel) return;
    const prev = sel.stage;
    setSel({ ...sel, stage });
    setItems((arr) => arr.map((x) => x.id === sel.id ? { ...x, stage } : x));
    try { await api.setCustomerStage(sel.id, stage); }
    catch (e: any) { alert(e?.message || 'Lỗi đổi giai đoạn'); setSel({ ...sel, stage: prev }); }
  };

  const runCare = async () => {
    if (!sel) return;
    setBusy('care'); setNurture(null);
    try { setNurture(await api.salesNurture({ customerId: sel.id })); }
    catch (e: any) { alert(e?.message); } finally { setBusy(''); }
  };

  const kpi = (icon: any, label: string, value: any) => {
    const Icon = icon;
    return (
      <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex-1 min-w-[120px]">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {label}</p>
        <p className="text-xl font-black text-slate-900 mt-1">{value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none flex items-center gap-2"><Database className="w-6 h-6 text-indigo-600" /> Customer 360</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Hồ sơ 360° đồng bộ ERP–CDP · pipeline 9 bước · AI chăm sóc · <b className="text-indigo-500">{total} khách</b></p>
        </div>
        <button onClick={() => load(q)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Tải lại</button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
        {/* LEFT: danh sách */}
        <div className="bg-white rounded-3xl border border-slate-100 p-3 h-[calc(100vh-12rem)] flex flex-col">
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(q)}
              placeholder="Tìm tên, SĐT…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div> :
              items.map((c) => (
                <button key={c.id} onClick={() => openCustomer(c)} className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${sel?.id === c.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm truncate">{c.fullName || '(chưa có tên)'}</span>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{c.score}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold">{c.phone || '—'} · {c.source}</p>
                  <span className="text-[10px] font-black text-indigo-400">{c.stage || 'Mới'}</span>
                </button>
              ))}
          </div>
        </div>

        {/* RIGHT: 360 */}
        {sel ? (
          <div className="space-y-4">
            {/* header */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black">{(sel.fullName || 'K')[0]}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-slate-900">{sel.fullName}</h3>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{sel.stage || 'Mới'}</span>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">Mã: {sel.id} · Nguồn: {sel.source} {sel.webIdentified ? '· 🟢 đã định danh' : ''}</p>
                    <div className="flex gap-2 mt-2">
                      {sel.phone && <a href={`tel:${sel.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-100"><Phone className="w-3.5 h-3.5" /> {sel.phone}</a>}
                      {sel.phone && <a href={`https://zalo.me/${sel.phone}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-black text-blue-600 hover:bg-blue-100"><MessageCircle className="w-3.5 h-3.5" /> Zalo</a>}
                    </div>
                  </div>
                </div>
                <button onClick={runCare} disabled={busy === 'care'} className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-black text-sm hover:bg-violet-700 disabled:opacity-60">
                  {busy === 'care' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} AI chăm sóc
                </button>
              </div>
            </div>

            {/* KPI */}
            <div className="flex flex-wrap gap-3">
              {kpi(Gauge, 'Điểm tiềm năng', `${sel.score}/100`)}
              {kpi(Eye, 'Lượt xem web', sel.webPageViews ?? 0)}
              {kpi(Building2, 'Dự án đã xem', (sel.viewedProjects || []).length)}
              {kpi(Activity, 'Tương tác', behavior?.pageViews ?? 0)}
            </div>

            {/* Pipeline 9 bước */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5">
              <h4 className="font-black text-slate-900 flex items-center gap-2 mb-4"><ArrowRight className="w-5 h-5 text-indigo-500" /> Pipeline bán hàng (bấm để chuyển giai đoạn)</h4>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                {STAGES.map((st, i) => {
                  const active = (sel.stage || 'Mới') === st;
                  const lost = st === 'Mất';
                  return (
                    <React.Fragment key={st}>
                      <button onClick={() => setStage(st)} className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border-2 transition-all min-w-[78px] ${active ? (lost ? 'bg-rose-500 border-rose-500 text-white' : 'bg-emerald-500 border-emerald-500 text-white') : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${active ? 'bg-white/25' : 'bg-slate-100'}`}>{i < 8 ? i + 1 : '✕'}</span>
                        <span className="text-[11px] font-black whitespace-nowrap">{st}</span>
                      </button>
                      {i < STAGES.length - 1 && <div className="shrink-0 w-3 h-0.5 bg-slate-200" />}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Nhãn dự án */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5">
              <h4 className="font-black text-slate-900 flex items-center gap-2 mb-3"><Building2 className="w-5 h-5 text-amber-500" /> Dự án khách quan tâm</h4>
              <div className="flex flex-wrap gap-2">
                {(sel.viewedProjects || []).length ? (sel.viewedProjects || []).map((p: string, i: number) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-black border border-amber-200"><Eye className="w-3.5 h-3.5" /> {p}</span>
                )) : <span className="text-sm text-slate-400">Chưa ghi nhận dự án khách xem.</span>}
              </div>
            </div>

            {/* Crew AI / kết quả chăm sóc */}
            <div className="bg-white rounded-3xl border border-slate-100 p-5">
              <h4 className="font-black text-slate-900 flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-violet-500" /> Sale ảo chăm sóc (AI soạn tin)</h4>
              {nurture ? (
                <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-4">
                  <p className="text-[11px] font-black text-violet-400 uppercase mb-1">Tin nhắn nháp · kênh {nurture.channel || 'telegram'}</p>
                  <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{nurture.message}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Bấm <b>"AI chăm sóc"</b> để sale ảo phân tích & soạn tin nhắn cá nhân hoá cho khách này.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center text-slate-400"><UserCheck className="w-10 h-10" /></div>
        )}
      </div>
    </div>
  );
};

export default CDP;
