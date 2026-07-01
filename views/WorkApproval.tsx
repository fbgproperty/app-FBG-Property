import React, { useEffect, useState } from 'react';
import {
  Loader2, RefreshCw, Sparkles, Check, X, ClipboardList, ListChecks,
  CheckCircle2, PlayCircle, Flag, ChevronDown, ChevronRight, Route, History, Square, CheckSquare,
  Bot, Copy,
} from 'lucide-react';
import { api } from '../services/apiService';

const ago = (ts: number) => {
  if (!ts) return '';
  const s = Math.floor(Date.now() / 1000 - ts);
  if (s < 60) return 'vừa xong';
  if (s < 3600) return Math.floor(s / 60) + ' phút trước';
  if (s < 86400) return Math.floor(s / 3600) + ' giờ trước';
  return Math.floor(s / 86400) + ' ngày trước';
};

const STATUS: Record<string, { label: string; color: string; icon: any }> = {
  approved: { label: 'Đã duyệt', color: '#10b981', icon: CheckCircle2 },
  doing: { label: 'Đang thực hiện', color: '#6366f1', icon: PlayCircle },
  done: { label: 'Hoàn thành', color: '#0d9488', icon: Flag },
};

const WorkApproval: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gen, setGen] = useState(false);
  const [busy, setBusy] = useState('');
  const [planning, setPlanning] = useState('');
  const [previews, setPreviews] = useState<Record<string, { t: string; done: boolean }[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [autorun, setAutorun] = useState('');
  const [copied, setCopied] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try { const r = await api.opsWorklog(); setItems(Array.isArray(r?.items) ? r.items : []); }
    catch { setItems([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGen(true); setErr('');
    try { await api.worklogGenerate(); await load(); }
    catch (e: any) { setErr(e?.message || 'Chưa sinh được việc.'); }
    setGen(false);
  };

  const decide = async (id: string, decision: 'approve' | 'reject') => {
    setBusy(id); setErr('');
    try { await api.worklogDecide(id, decision); await load(); }
    catch (e: any) { setErr(e?.message || 'Lỗi'); }
    setBusy('');
  };

  // Preview plan inside a pending card (read-only)
  const previewPlan = async (id: string) => {
    setPlanning(id); setErr('');
    try {
      const r = await api.worklogPlan(id);
      const steps = Array.isArray(r?.steps) ? r.steps : [];
      setPreviews(p => ({ ...p, [id]: steps }));
    } catch (e: any) { setErr(e?.message || 'Chưa lập được lộ trình.'); }
    setPlanning('');
  };

  // Build the roadmap for an approved item (persisted), then reload
  const buildPlan = async (id: string) => {
    setPlanning(id); setErr('');
    try { await api.worklogPlan(id); await load(); }
    catch (e: any) { setErr(e?.message || 'Chưa lập được lộ trình.'); }
    setPlanning('');
  };

  // AI executes ALL steps of an item, attaching a result deliverable to each, then reload
  const doAutorun = async (id: string) => {
    setAutorun(id); setErr('');
    setExpanded(e => ({ ...e, [id]: true }));
    try { await api.worklogAutorun(id); await load(); }
    catch (e: any) { setErr(e?.message || 'Trợ lý AI chưa thực hiện được việc này.'); }
    setAutorun('');
  };

  const copyResult = (key: string, text: string) => {
    try { navigator.clipboard?.writeText(text || ''); } catch { /* */ }
    setCopied(key); setTimeout(() => setCopied(''), 1500);
  };

  const advance = async (id: string, action: 'start' | 'step' | 'done', index?: number) => {
    setBusy(id + (action === 'step' ? ':' + index : ''));
    // optimistic update for step toggle
    if (action === 'step' && typeof index === 'number') {
      setItems(its => its.map(i => i.id === id
        ? { ...i, steps: (Array.isArray(i.steps) ? i.steps : []).map((s: any, k: number) => k === index ? { ...s, done: !s.done } : s) }
        : i));
    }
    try { await api.worklogAdvance(id, action, index); await load(); }
    catch (e: any) { setErr(e?.message || 'Lỗi'); await load(); }
    setBusy('');
  };

  const pending = items.filter(i => i && i.status === 'pending');
  const running = items.filter(i => i && ['approved', 'doing', 'done'].includes(i.status));
  const cDoing = running.filter(i => i.status === 'doing').length;
  const cDone = running.filter(i => i.status === 'done').length;

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-900 text-lg">Công việc — duyệt & lộ trình</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={generate} disabled={gen} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
              {gen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Trợ lý AI sinh việc
            </button>
            <button onClick={load} className="p-2 text-slate-300 hover:text-slate-500"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] font-black">
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700">{pending.length} chờ duyệt</span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">{cDoing} đang thực hiện</span>
          <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700">{cDone} hoàn thành</span>
        </div>
        {err && <div className="mt-3 text-[12px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 font-bold">{err}</div>}
      </div>

      {loading ? <div className="flex justify-center py-16 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        <>
          {/* A. Chờ duyệt */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700"><span className="font-black">Chờ duyệt</span><span className="text-xs font-black text-amber-600">{pending.length}</span></div>
            {pending.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-slate-400 text-xs">Không có việc nào chờ duyệt. Bấm <b>Trợ lý AI sinh việc</b> để đề xuất việc hôm nay.</div>
            ) : pending.map(it => {
              const preview = previews[it.id];
              return (
                <div key={it.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{it.byName && <span className="text-indigo-600">Agent {it.byName} · </span>}{it.dept || 'Trợ lý AI'} · {ago(it.ts)}</div>
                  <div className="font-black text-slate-900 mt-0.5">{it.title}</div>
                  {it.desc && <div className="text-sm text-slate-500 mt-1">{it.desc}</div>}

                  {Array.isArray(preview) && (
                    <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 mb-2"><Route className="w-3.5 h-3.5" /> Lộ trình đề xuất (xem trước)</div>
                      {preview.length === 0 ? <div className="text-[11px] text-slate-400">Chưa có bước nào.</div> : (
                        <ol className="space-y-1.5">
                          {preview.map((s, k) => (
                            <li key={k} className="flex items-start gap-2 text-[13px] text-slate-700">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-black text-[11px] flex items-center justify-center">{k + 1}</span>
                              <span>{s.t}</span>
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <button onClick={() => previewPlan(it.id)} disabled={planning === it.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg font-black text-xs hover:bg-slate-200 disabled:opacity-50">
                      {planning === it.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Route className="w-3.5 h-3.5" />} Xem lộ trình
                    </button>
                    <button onClick={() => decide(it.id, 'approve')} disabled={busy === it.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-black text-xs hover:bg-emerald-100 disabled:opacity-50">
                      {busy === it.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Duyệt
                    </button>
                    <button onClick={() => decide(it.id, 'reject')} disabled={busy === it.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg font-black text-xs hover:bg-rose-100 disabled:opacity-50">
                      <X className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          {/* B. Đang thực hiện & lộ trình */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-slate-700"><span className="font-black">Đang thực hiện & lộ trình</span><span className="text-xs font-black text-indigo-600">{running.length}</span></div>
            {running.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-slate-400 text-xs">Chưa có việc nào được duyệt. Duyệt việc ở mục trên để bắt đầu lập lộ trình.</div>
            ) : running
              .sort((a, b) => (b?.decidedAt || b?.ts || 0) - (a?.decidedAt || a?.ts || 0))
              .map(it => {
                const meta = STATUS[it.status] || STATUS.approved;
                const c = meta.color;
                const Icon = meta.icon;
                const steps = Array.isArray(it.steps) ? it.steps : [];
                const doneCount = steps.filter((s: any) => s?.done).length;
                const hist = Array.isArray(it.history) ? [...it.history].sort((a, b) => (a?.ts || 0) - (b?.ts || 0)) : [];
                const open = expanded[it.id] ?? false;
                return (
                  <div key={it.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <button onClick={() => setExpanded(e => ({ ...e, [it.id]: !open }))} className="w-full text-left p-5 flex items-start gap-3 hover:bg-slate-50/60">
                      <span className="mt-0.5 text-slate-300">{open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md" style={{ background: c + '22', color: c }}><Icon className="w-3 h-3" />{meta.label}</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{it.byName && <span className="text-indigo-600">Agent {it.byName} · </span>}{it.dept || 'Trợ lý AI'} · {ago(it.decidedAt || it.ts)}</span>
                        </div>
                        <div className="font-black text-slate-900 mt-1">{it.title}</div>
                        <div className="mt-2">
                          <div className="text-[10px] font-black text-slate-500">{doneCount}/{steps.length} bước</div>
                          <div className="mt-0.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%`, background: c }} />
                          </div>
                        </div>
                      </div>
                    </button>

                    {open && (
                      <div className="px-5 pb-5 space-y-4">
                        {/* Roadmap */}
                        {steps.length === 0 ? (
                          it.status === 'approved' ? (
                            <button onClick={() => buildPlan(it.id)} disabled={planning === it.id} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
                              {planning === it.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Route className="w-4 h-4" />} Lập lộ trình
                            </button>
                          ) : <div className="text-xs text-slate-400">Chưa có lộ trình.</div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600 mb-2"><ListChecks className="w-3.5 h-3.5" /> Lộ trình thực thi</div>
                            <div className="space-y-1">
                              {steps.map((s: any, k: number) => {
                                const stepBusy = busy === it.id + ':' + k;
                                const result = s?.result;
                                const rKey = it.id + '#' + k;
                                return (
                                  <div key={k}>
                                    <button onClick={() => advance(it.id, 'step', k)} disabled={stepBusy} className="w-full flex items-start gap-2.5 text-left px-3 py-2 rounded-xl hover:bg-slate-50 disabled:opacity-60">
                                      <span className="shrink-0 mt-0.5" style={{ color: s?.done ? c : '#cbd5e1' }}>
                                        {stepBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : s?.done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                      </span>
                                      <span className={`text-[13px] ${s?.done ? 'line-through text-slate-400' : 'text-slate-700'}`}>{s?.t}</span>
                                    </button>
                                    {result && (
                                      <div className="ml-8 mb-1.5 relative">
                                        <button onClick={() => copyResult(rKey, String(result))} className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 text-[10px] font-black bg-white border border-slate-200 rounded-lg px-1.5 py-0.5 hover:bg-slate-50">
                                          {copied === rKey ? <><Check className="w-3 h-3 text-emerald-500" />Đã chép</> : <><Copy className="w-3 h-3" />Chép</>}
                                        </button>
                                        <div className="text-[12px] text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 border border-slate-100 rounded-xl p-3 pr-14">{String(result)}</div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => doAutorun(it.id)} disabled={autorun === it.id} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 text-white rounded-xl font-black text-xs hover:bg-violet-700 disabled:opacity-60">
                            {autorun === it.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Trợ lý AI đang thực hiện…</> : <><Bot className="w-4 h-4" /> Trợ lý AI tự làm</>}
                          </button>
                          {it.status === 'approved' && (
                            <button onClick={() => advance(it.id, 'start')} disabled={busy === it.id} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 disabled:opacity-60">
                              {busy === it.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />} Bắt đầu
                            </button>
                          )}
                          {it.status === 'doing' && (
                            <button onClick={() => advance(it.id, 'done')} disabled={busy === it.id} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 text-white rounded-xl font-black text-xs hover:bg-teal-700 disabled:opacity-60">
                              {busy === it.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />} Đánh dấu hoàn thành
                            </button>
                          )}
                        </div>

                        {/* Timeline */}
                        {hist.length > 0 && (
                          <div>
                            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-500 mb-2"><History className="w-3.5 h-3.5" /> Dòng thời gian <span className="font-semibold text-slate-400">(cũ → mới)</span></div>
                            <div className="relative pl-4">
                              <div className="absolute left-[5px] top-1 bottom-1 w-0.5 bg-slate-100" />
                              {hist.map((h: any, k: number) => (
                                <div key={k} className="relative mb-2.5 pl-3">
                                  <div className="absolute -left-[9px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-indigo-400" />
                                  <div className="text-[13px] text-slate-700">{h?.ev}</div>
                                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{ago(h?.ts)}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </section>
        </>
      )}
    </div>
  );
};

export default WorkApproval;
