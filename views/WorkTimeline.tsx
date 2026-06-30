import React, { useEffect, useState } from 'react';
import { Loader2, Clock, Bot, ClipboardCheck, Send, RefreshCw, Sparkles, Check, X, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../services/apiService';

const ago = (ts: number) => {
  if (!ts) return '';
  const s = Math.floor(Date.now() / 1000 - ts);
  if (s < 60) return 'vừa xong';
  if (s < 3600) return Math.floor(s / 60) + ' phút trước';
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
  return Math.floor(s / 86400) + ' ngày trước';
};

const WorkTimeline: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gen, setGen] = useState(false);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    try { const r = await api.opsWorklog(); setItems(Array.isArray(r.items) ? r.items : []); }
    catch { setItems([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGen(true); setErr('');
    try { await api.worklogGenerate(); await load(); }
    catch (e: any) { setErr(e?.message || 'Chưa sinh được việc (backend đang cập nhật).'); }
    setGen(false);
  };
  const decide = async (id: string, decision: 'approve' | 'reject') => {
    setBusy(id);
    try {
      await api.worklogDecide(id, decision);
      setItems(its => its.map(i => i.id === id ? { ...i, status: decision === 'approve' ? 'approved' : 'rejected', decidedAt: Math.floor(Date.now() / 1000) } : i));
    } catch (e: any) { setErr(e?.message || 'Lỗi'); }
    setBusy('');
  };

  const pending = items.filter(i => i.status === 'pending');

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Trao đổi công việc</span></div>
          <button onClick={load} className="text-slate-300 hover:text-slate-500"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-sky-600 bg-sky-50 rounded-lg px-2.5 py-1.5">
          <Send className="w-3.5 h-3.5" /> Hermes tự sinh việc · báo Telegram · duyệt/từ chối tại đây
        </div>
        <button onClick={generate} disabled={gen} className="mt-2 w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 disabled:opacity-60">
          {gen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Hermes sinh việc {pending.length > 0 && `· ${pending.length} chờ duyệt`}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        {err && <div className="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5 mb-2 font-bold">{err}</div>}
        {loading ? <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-6 h-6 animate-spin" /></div> :
          items.length === 0 ? <div className="text-center text-slate-400 text-xs py-8">Chưa có việc. Bấm <b>"Hermes sinh việc"</b> để Hermes đề xuất việc hôm nay.</div> : (
            <div className="relative pl-4">
              <div className="absolute left-[6px] top-1 bottom-1 w-0.5 bg-slate-100" />
              {items.map((it) => {
                const st = it.status;
                const c = st === 'approved' ? '#10b981' : st === 'rejected' ? '#ef4444' : '#7c3aed';
                const Icon = st === 'approved' ? CheckCircle2 : st === 'rejected' ? XCircle : Bot;
                return (
                  <div key={it.id} className="relative mb-4 pl-3">
                    <div className="absolute -left-[10px] top-1 w-3 h-3 rounded-full border-2 border-white" style={{ background: c }} />
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider" style={{ color: c }}><Icon className="w-3 h-3" />{it.dept || 'Hermes'} · {ago(it.decidedAt || it.ts)}</div>
                    <div className="font-bold text-slate-800 text-[13px] leading-tight mt-0.5">{it.title}</div>
                    {it.desc && <div className="text-[11px] text-slate-400 mt-0.5">{it.desc}</div>}
                    {st === 'pending' ? (
                      <div className="flex items-center gap-2 mt-1.5">
                        <button onClick={() => decide(it.id, 'approve')} disabled={busy === it.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-black text-[11px] hover:bg-emerald-100 disabled:opacity-50">{busy === it.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Duyệt</button>
                        <button onClick={() => decide(it.id, 'reject')} disabled={busy === it.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg font-black text-[11px] hover:bg-rose-100 disabled:opacity-50"><X className="w-3 h-3" /> Từ chối</button>
                      </div>
                    ) : (
                      <span className="inline-block mt-1 text-[10px] font-black px-2 py-0.5 rounded-md" style={{ background: c + '22', color: c }}>{st === 'approved' ? '✓ Đã duyệt' : '✕ Đã từ chối'}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
      </div>
    </div>
  );
};

export default WorkTimeline;
