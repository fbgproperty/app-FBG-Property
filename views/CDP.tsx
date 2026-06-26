import React, { useEffect, useState, useCallback } from 'react';
import {
  Loader2, Search, Phone, MessageCircle, Eye, Bot, UserCheck, Sparkles,
  Database, Gauge, Building2, Activity, ArrowRight, RefreshCw,
  FileSpreadsheet, Upload, UserPlus, X, Save, Clock, Send, CheckCircle2, ShieldCheck,
} from 'lucide-react';
import { api } from '../services/apiService';

const STAGES = ['Mới', 'Tiếp cận', 'Quan tâm', 'Nóng', 'Đặt lịch', 'Đặt cọc', 'Hợp đồng', 'Khách hàng', 'Mất'];
const ACT_TYPES = ['Gọi điện', 'Tổng đài', 'Zalo', 'Email', 'Đặt lịch', 'Gặp trực tiếp', 'Ghi chú'];
const getUser = () => { try { return JSON.parse(localStorage.getItem('fbg_user') || '{}'); } catch { return {}; } };
const ago = (ts: number) => { const d = Math.floor((Date.now() / 1000 - ts) / 86400); return d <= 0 ? 'hôm nay' : `${d} ngày trước`; };

const CDP: React.FC = () => {
  const user = getUser();
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<any | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tab, setTab] = useState<'overview' | 'p360' | 'timeline'>('overview');
  const [info, setInfo] = useState<any>({});
  const [behavior, setBehavior] = useState<any>(null);
  const [nurture, setNurture] = useState<any>(null);
  const [actForm, setActForm] = useState({ type: 'Gọi điện', result: '', note: '' });
  const [busy, setBusy] = useState('');
  const [tool, setTool] = useState<'' | 'sheet' | 'file' | 'add'>('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [addForm, setAddForm] = useState({ fullName: '', phone: '', email: '' });
  const [msg, setMsg] = useState('');

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
    setSel(c); setProfile(null); setBehavior(null); setNurture(null);
    try {
      const p = await api.getCdpProfile(c.id);
      setProfile(p); setInfo({ ...p.customer });
    } catch { /* ignore */ }
    try { setBehavior(await api.getCustomerBehavior(c.id)); } catch { /* ignore */ }
  };
  const reloadProfile = async () => { if (sel) { const p = await api.getCdpProfile(sel.id); setProfile(p); } };

  const saveInfo = async () => {
    setBusy('info');
    try {
      await api.saveCdpInfo(sel.id, { fullName: info.fullName, phone: info.phone, email: info.email, source: info.source, note: info.note, webRegistered: info.webRegistered, appointments: Number(info.appointments) || 0 });
      setItems((a) => a.map((x) => x.id === sel.id ? { ...x, fullName: info.fullName, phone: info.phone } : x));
      await reloadProfile(); setMsg('✅ Đã lưu thông tin khách');
    } catch (e: any) { alert(e?.message); } finally { setBusy(''); }
  };
  const logActivity = async () => {
    if (!actForm.note && !actForm.result) return;
    setBusy('act');
    try { await api.logCdpActivity(sel.id, { ...actForm, by: user.name || user.email }); setActForm({ type: 'Gọi điện', result: '', note: '' }); await reloadProfile(); }
    catch (e: any) { alert(e?.message); } finally { setBusy(''); }
  };
  const aiScore = async () => {
    setBusy('ai');
    try { await api.cdpAiScore(sel.id); await reloadProfile(); }
    catch (e: any) { alert(e?.message); } finally { setBusy(''); }
  };
  const setStage = async (stage: string) => {
    setSel({ ...sel, stage }); setItems((a) => a.map((x) => x.id === sel.id ? { ...x, stage } : x));
    try { await api.setCustomerStage(sel.id, stage); } catch (e: any) { alert(e?.message); }
  };
  const runCare = async () => {
    setBusy('care'); setNurture(null);
    try { setNurture(await api.salesNurture({ customerId: sel.id })); } catch (e: any) { alert(e?.message); } finally { setBusy(''); }
  };

  // ===== import / sync (toolbar) =====
  const syncErp = async () => { setBusy('sync'); setMsg(''); try { const r = await api.cdpSyncErp(); setMsg(`✅ Đồng bộ: ${r.erpLeads} lead → ${r.saved} hồ sơ · CDP ${r.cdpCount} khách`); await load(q); } catch (e: any) { setMsg('⚠️ ' + e?.message); } finally { setBusy(''); } };
  const afterImport = async (r: any) => { setTool(''); setMsg(`Đã tạo ${r.created || 0} khách. Đang đồng bộ…`); try { const s = await api.cdpSyncErp(); setMsg(`✅ Tạo ${r.created || 0} khách · CDP ${s.cdpCount}`); } catch { /* ignore */ } await load(q); };
  const importSheet = async () => { if (!sheetUrl.trim()) return; setBusy('sheet'); try { const r = await api.cdpImportSheet(sheetUrl.trim()); if (r.error) alert(r.error); else { setSheetUrl(''); await afterImport(r); } } catch (e: any) { alert(e?.message); } finally { setBusy(''); } };
  const importFile = async (file: File) => {
    setBusy('file');
    try {
      const text = await file.text(); const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const head = lines[0].split(',').map((h) => h.toLowerCase().trim().replace(/^"|"$/g, ''));
      const idx = (ns: string[]) => head.findIndex((h) => ns.some((n) => h.includes(n)));
      const iN = idx(['tên', 'ten', 'name', 'khách']), iP = idx(['sđt', 'sdt', 'điện thoại', 'dien thoai', 'phone', 'mobile']), iE = idx(['email']);
      const rows = lines.slice(1).map((l) => { const c = l.split(',').map((x) => x.trim().replace(/^"|"$/g, '')); return { fullName: iN >= 0 ? c[iN] : '', phone: iP >= 0 ? c[iP] : '', email: iE >= 0 ? c[iE] : '' }; }).filter((r) => r.fullName || r.phone);
      await afterImport(await api.cdpImport(rows, 'Import file'));
    } catch (e: any) { alert(e?.message); } finally { setBusy(''); }
  };
  const addOne = async () => { if (!addForm.fullName && !addForm.phone) return; setBusy('add'); try { const r = await api.cdpImport([addForm], 'Nhập tay'); setAddForm({ fullName: '', phone: '', email: '' }); await afterImport(r); } catch (e: any) { alert(e?.message); } finally { setBusy(''); } };

  const cust = profile?.customer || sel || {};
  const rule = profile?.rule;
  const ai = profile?.ai;
  const acts = profile?.activities || [];
  const channels = ACT_TYPES.map((t) => ({ t, n: acts.filter((a: any) => a.type === t).length })).filter((c) => c.n);

  const Field = ({ label, k, type = 'text' }: any) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-50">
      <span className="text-sm text-slate-400 font-bold">{label}</span>
      <input type={type} value={info[k] ?? ''} onChange={(e) => setInfo({ ...info, [k]: e.target.value })} className="text-right text-sm font-bold text-slate-800 bg-transparent outline-none focus:bg-indigo-50/50 rounded px-1 max-w-[55%]" />
    </div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none flex items-center gap-2"><Database className="w-6 h-6 text-indigo-600" /> Danh sách khách hàng</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Customer 360 · đồng bộ ERP–CDP · <b className="text-indigo-500">{total} khách</b></p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={syncErp} disabled={busy === 'sync'} className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">{busy === 'sync' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Đồng bộ ERP→CDP</button>
          <button onClick={() => { setTool('sheet'); setMsg(''); }} className="px-3.5 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-black text-sm hover:bg-emerald-100 flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> Google Sheet</button>
          <button onClick={() => setTool('file')} className="px-3.5 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl font-black text-sm hover:bg-amber-100 flex items-center gap-2"><Upload className="w-4 h-4" /> File CSV</button>
          <button onClick={() => setTool('add')} className="px-3.5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-50 flex items-center gap-2"><UserPlus className="w-4 h-4" /> Thêm khách</button>
        </div>
      </header>
      {msg && <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-700">{msg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* LEFT */}
        <div className="bg-white rounded-3xl border border-slate-100 p-3 h-[calc(100vh-11rem)] flex flex-col">
          <div className="relative mb-2">
            <Search className="w-4 h-4 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load(q)} placeholder="Tìm tên, SĐT…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-200" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div> :
              items.map((c) => (
                <button key={c.id} onClick={() => openCustomer(c)} className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${sel?.id === c.id ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                  <div className="flex items-center justify-between"><span className="font-black text-slate-900 text-sm truncate">{c.fullName || '(chưa có tên)'}</span><span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{c.score}</span></div>
                  <p className="text-[11px] text-slate-400 font-bold">{c.phone || '—'} · {c.source}</p>
                  <span className="text-[10px] font-black text-indigo-400">{c.stage || 'Mới'}</span>
                </button>
              ))}
          </div>
        </div>

        {/* RIGHT */}
        {sel ? (
          <div>
            {/* customer header + tabs */}
            <div className="bg-white rounded-t-3xl border border-slate-100 px-5 pt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-lg font-black">{(cust.fullName || 'K')[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><h3 className="text-lg font-black text-slate-900 truncate">{cust.fullName}</h3><span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{cust.stage || 'Mới'}</span></div>
                  <p className="text-xs text-slate-400 font-bold">Mã: {cust.id} · Nguồn: {cust.source}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const ph = (cust.phone || '').replace(/[^0-9]/g, ''); if (!ph) { alert('Khách chưa có số điện thoại'); return; } window.open(`https://appapi.fbgproperty.vn/stringee/softphone?to=${ph}&name=${encodeURIComponent(cust.fullName || '')}`, 'stringee_call', 'width=380,height=660'); }} className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700"><Phone className="w-4 h-4" /> Gọi</button>
                  <a href="https://chat.fbgproperty.vn/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-600 text-white rounded-xl font-black text-xs hover:bg-sky-700"><MessageCircle className="w-4 h-4" /> Chat</a>
                  <button onClick={runCare} disabled={busy === 'care'} className="inline-flex items-center gap-2 px-3 py-2 bg-violet-600 text-white rounded-xl font-black text-xs hover:bg-violet-700 disabled:opacity-60">{busy === 'care' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />} AI chăm sóc</button>
                </div>
              </div>
              <div className="flex gap-1">
                {[['overview', 'Tổng quan'], ['p360', 'Hồ sơ 360°'], ['timeline', 'Dòng thời gian']].map(([k, l]) => (
                  <button key={k} onClick={() => setTab(k as any)} className={`px-4 py-2.5 text-sm font-black border-b-2 transition-all ${tab === k ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{l}</button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-b-3xl border border-t-0 border-slate-100 p-5">
              {!profile ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div> : (
                <>
                  {/* ===== TAB TỔNG QUAN ===== */}
                  {tab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <div className="border border-slate-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-black text-slate-900">Thông tin (sửa trực tiếp)</h4>
                          <button onClick={saveInfo} disabled={busy === 'info'} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-black text-xs hover:bg-emerald-700 disabled:opacity-60">{busy === 'info' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Lưu</button>
                        </div>
                        <Field label="Họ tên" k="fullName" />
                        <Field label="SĐT" k="phone" />
                        <Field label="Email" k="email" />
                        <Field label="Nguồn" k="source" />
                        <Field label="Số lịch hẹn" k="appointments" type="number" />
                        <div className="flex items-center justify-between py-2 border-b border-slate-50">
                          <span className="text-sm text-slate-400 font-bold">Đăng ký web</span>
                          <label className="flex items-center gap-1 text-sm font-bold"><input type="checkbox" checked={!!info.webRegistered} onChange={(e) => setInfo({ ...info, webRegistered: e.target.checked })} /> {info.webRegistered ? 'Rồi' : 'Chưa'}</label>
                        </div>
                        <div className="pt-2">
                          <span className="text-sm text-slate-400 font-bold">Ghi chú</span>
                          <textarea value={info.note || ''} onChange={(e) => setInfo({ ...info, note: e.target.value })} className="w-full mt-1 p-2 rounded-lg border border-slate-200 text-sm" rows={2} placeholder="Ghi chú về khách…" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="border border-slate-100 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-3"><h4 className="font-black text-slate-900 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-amber-500" /> Điểm quy tắc (tham khảo)</h4><span className="text-2xl font-black text-amber-500">{rule?.total ?? cust.score}/100</span></div>
                          {(rule?.items || []).map((it: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                              <span className={`font-bold flex items-center gap-2 ${it.got ? 'text-emerald-600' : 'text-slate-400'}`}>{it.got ? '☑' : '☐'} {it.label}</span>
                              <span className={`font-black ${it.got ? 'text-emerald-600' : 'text-slate-300'}`}>+{it.got}/{it.max}</span>
                            </div>
                          ))}
                        </div>
                        <div className="border border-slate-100 rounded-2xl p-4">
                          <div className="flex items-center justify-between mb-2"><h4 className="font-black text-slate-900 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-violet-500" /> Phân tích AI</h4><button onClick={aiScore} disabled={busy === 'ai'} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-black text-xs text-slate-600 hover:bg-slate-50">{busy === 'ai' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Chấm điểm lại bằng AI</button></div>
                          {ai?.score != null ? (
                            <div>
                              <div className="flex items-center gap-2"><span className="text-3xl font-black text-amber-500">{ai.score}/100</span><span className="text-xs font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-600">{ai.label}</span></div>
                              <p className="text-sm text-slate-600 mt-2">{ai.reasoning}</p>
                              {ai.bestTime && <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-400" /> Thời điểm gọi tốt: <b>{ai.bestTime}</b></p>}
                              {ai.action && <div className="mt-2 bg-amber-50/60 border border-amber-100 rounded-xl p-3 text-sm text-slate-700"><b>💡 Gợi ý:</b> {ai.action}</div>}
                            </div>
                          ) : <p className="text-sm text-slate-400">Bấm "Chấm điểm lại bằng AI" để phân tích.</p>}
                        </div>
                      </div>

                      {(cust.region || cust.budget || cust.projectInterest || cust.product || cust.segment) && (
                        <div className="lg:col-span-2 border border-slate-100 rounded-2xl p-4 bg-slate-50/40">
                          <h4 className="font-black text-slate-900 mb-3 flex items-center gap-1.5"><Database className="w-4 h-4 text-indigo-500" /> Hồ sơ nguồn (data thô)</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[['Vùng miền', cust.region], ['Tệp khách', cust.segment], ['Sản phẩm quan tâm', cust.product], ['Ngân sách', cust.budget], ['Mục đích', cust.purpose], ['Dự án quan tâm', cust.projectInterest]].filter(([, v]) => v).map(([l, v]: any, i) => (
                              <div key={i}><p className="text-[11px] font-black text-slate-400 uppercase">{l}</p><p className="text-sm font-bold text-slate-800 mt-0.5">{v}</p></div>
                            ))}
                          </div>
                          {cust.rawNote && <p className="text-sm text-slate-500 mt-3 italic">"{cust.rawNote}"</p>}
                        </div>
                      )}

                      <div className="lg:col-span-2 border border-slate-100 rounded-2xl p-4">
                        <h4 className="font-black text-slate-900 mb-3">Lịch sử liên hệ ({acts.length})</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {acts.map((a: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-sm border-l-2 border-amber-200 pl-3">
                              <div className="flex-1"><p className="font-bold text-slate-700">{a.type}{a.result ? ` · ${a.result}` : ''}</p><p className="text-slate-500">{a.note}</p></div>
                              <span className="text-[11px] text-slate-400 font-bold whitespace-nowrap">{ago(a.at)}</span>
                            </div>
                          ))}
                          {!acts.length && <p className="text-sm text-slate-400">Chưa có lịch sử. Ghi nhận ở tab "Dòng thời gian".</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== TAB HỒ SƠ 360 ===== */}
                  {tab === 'p360' && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        {cust.phone && <a href={`tel:${cust.phone}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-600"><Phone className="w-3.5 h-3.5" /> {cust.phone}</a>}
                        {cust.phone && <a href={`https://zalo.me/${cust.phone}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-black text-blue-600"><MessageCircle className="w-3.5 h-3.5" /> Zalo</a>}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {[[Gauge, 'Điểm tiềm năng', `${cust.score}/100`], [Eye, 'Lượt xem web', cust.webPageViews ?? 0], [Building2, 'Dự án đã xem', (cust.viewedProjects || []).length], [Activity, 'Tương tác', behavior?.pageViews ?? 0]].map(([Ic, l, v]: any, i) => (
                          <div key={i} className="bg-slate-50/60 rounded-2xl border border-slate-100 px-4 py-3 flex-1 min-w-[120px]"><p className="text-[11px] font-black text-slate-400 uppercase flex items-center gap-1.5"><Ic className="w-3.5 h-3.5" /> {l}</p><p className="text-xl font-black text-slate-900 mt-1">{v}</p></div>
                        ))}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 flex items-center gap-2 mb-3"><ArrowRight className="w-5 h-5 text-indigo-500" /> Pipeline bán hàng</h4>
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                          {STAGES.map((st, i) => { const active = (cust.stage || 'Mới') === st; const lost = st === 'Mất'; return (
                            <React.Fragment key={st}>
                              <button onClick={() => setStage(st)} className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border-2 min-w-[78px] ${active ? (lost ? 'bg-rose-500 border-rose-500 text-white' : 'bg-emerald-500 border-emerald-500 text-white') : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}><span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${active ? 'bg-white/25' : 'bg-slate-100'}`}>{i < 8 ? i + 1 : '✕'}</span><span className="text-[11px] font-black whitespace-nowrap">{st}</span></button>
                              {i < STAGES.length - 1 && <div className="shrink-0 w-3 h-0.5 bg-slate-200" />}
                            </React.Fragment>); })}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 flex items-center gap-2 mb-2"><Building2 className="w-5 h-5 text-amber-500" /> Dự án quan tâm</h4>
                        <div className="flex flex-wrap gap-2">{(cust.viewedProjects || []).length ? (cust.viewedProjects || []).map((p: string, i: number) => <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-black border border-amber-200"><Eye className="w-3.5 h-3.5" /> {p}</span>) : <span className="text-sm text-slate-400">Chưa ghi nhận.</span>}</div>
                      </div>
                      {nurture && <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-4"><p className="text-[11px] font-black text-violet-400 uppercase mb-1">AI soạn tin · {nurture.channel}</p><p className="text-sm text-slate-700 whitespace-pre-wrap">{nurture.message}</p></div>}
                    </div>
                  )}

                  {/* ===== TAB DÒNG THỜI GIAN ===== */}
                  {tab === 'timeline' && (
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
                      <div>
                        <div className="border border-slate-100 rounded-2xl p-4 mb-4">
                          <div className="flex gap-2 mb-2">
                            <select value={actForm.type} onChange={(e) => setActForm({ ...actForm, type: e.target.value })} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold">{ACT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
                            <input value={actForm.result} onChange={(e) => setActForm({ ...actForm, result: e.target.value })} placeholder="Kết quả…" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold" />
                          </div>
                          <textarea value={actForm.note} onChange={(e) => setActForm({ ...actForm, note: e.target.value })} placeholder="Ghi lại nội dung chăm sóc khách…" className="w-full p-3 rounded-xl border border-slate-200 text-sm" rows={3} />
                          <div className="flex justify-end mt-2"><button onClick={logActivity} disabled={busy === 'act'} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">{busy === 'act' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Đăng</button></div>
                        </div>
                        <h4 className="font-black text-slate-900 mb-3">Dòng thời gian ({acts.length})</h4>
                        <div className="space-y-3 relative pl-5 border-l-2 border-slate-100">
                          {acts.map((a: any, i: number) => (
                            <div key={i} className="relative">
                              <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-white" />
                              <div className="flex justify-between"><p className="font-bold text-slate-800 text-sm">[{a.type}] {a.result}</p><span className="text-[11px] text-slate-400 font-bold">{ago(a.at)}</span></div>
                              <p className="text-sm text-slate-500">{a.note}</p>
                              {a.by && <p className="text-[11px] text-slate-400">— {a.by}</p>}
                            </div>
                          ))}
                          {!acts.length && <p className="text-sm text-slate-400">Chưa có hoạt động.</p>}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="border border-slate-100 rounded-2xl p-4">
                          <h4 className="font-black text-slate-900 mb-2">Kênh đã tương tác</h4>
                          {channels.length ? channels.map((c) => <div key={c.t} className="flex justify-between text-sm py-1"><span className="text-slate-600 font-bold">{c.t}</span><span className="text-slate-400 font-bold">{c.n} lần</span></div>) : <p className="text-sm text-slate-400">Chưa có.</p>}
                          <div className="flex justify-between text-sm py-1 border-t border-slate-50 mt-1 pt-2"><span className="text-slate-600 font-bold">Chatwoot</span><span className="text-amber-500 font-bold text-xs">đa kênh</span></div>
                        </div>
                        <div className="border border-slate-100 rounded-2xl p-4">
                          <h4 className="font-black text-slate-900 mb-2">Giao dịch (0)</h4>
                          <p className="text-sm text-slate-400">Chưa có giao dịch.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : <div className="flex items-center justify-center text-slate-400"><UserCheck className="w-10 h-10" /></div>}
      </div>

      {/* modals import */}
      {tool && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setTool('')}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-black text-slate-900 text-lg">{tool === 'sheet' ? 'Nạp từ Google Trang tính' : tool === 'file' ? 'Nạp từ file CSV' : 'Thêm khách thủ công'}</h3><button onClick={() => setTool('')} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button></div>
            {tool === 'sheet' && <div className="space-y-3"><p className="text-xs text-slate-400 font-semibold">Dán link Google Sheet (công khai). Cột: Tên / SĐT / Email.</p><input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full p-3 rounded-xl border border-slate-200 text-sm" /><button onClick={importSheet} disabled={busy === 'sheet'} className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 disabled:opacity-60 flex items-center justify-center gap-2">{busy === 'sheet' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Nạp & đồng bộ</button></div>}
            {tool === 'file' && <div className="space-y-3"><p className="text-xs text-slate-400 font-semibold">Chọn file .csv (cột Tên, SĐT, Email). Excel: lưu thành CSV.</p><input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} className="w-full text-sm" />{busy === 'file' && <p className="text-sm text-amber-600 font-bold flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang nạp…</p>}</div>}
            {tool === 'add' && <div className="space-y-2"><input value={addForm.fullName} onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })} placeholder="Họ tên" className="w-full p-3 rounded-xl border border-slate-200 text-sm" /><input value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} placeholder="Số điện thoại" className="w-full p-3 rounded-xl border border-slate-200 text-sm" /><input value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="Email" className="w-full p-3 rounded-xl border border-slate-200 text-sm" /><button onClick={addOne} disabled={busy === 'add'} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">{busy === 'add' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Thêm & đồng bộ</button></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CDP;
