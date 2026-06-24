import React, { useEffect, useState, useCallback } from 'react';
import {
  Rocket, Loader2, Users, Bot, Target, Search, Plus, Save, X,
  Building2, CheckCircle2, UserPlus, ArrowRight, Trash2,
} from 'lucide-react';
import { api } from '../services/apiService';

const owner = () => (typeof localStorage !== 'undefined' && localStorage.getItem('fbg_owner')) || 'duymp';

const Deployment: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<any | null>(null);
  const [plan, setPlan] = useState<any>(null);
  const [staffPool, setStaffPool] = useState<any[]>([]);
  const [saleAgents, setSaleAgents] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [matching, setMatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.getDeployProjects();
      setProjects(r.items || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadProjects(); }, [loadProjects]);

  const openProject = async (p: any) => {
    setSel(p); setMatches([]);
    try {
      const [pl, ags, sas] = await Promise.all([
        api.getDeployPlan(p.id),
        api.getAgents().catch(() => []),
        api.getSalesAgents('').catch(() => ({ items: [] })),
      ]);
      setPlan(pl || { projectId: p.id, staff: [], saleAgents: [], netLeads: [], plan: {} });
      setStaffPool((ags as any[]).filter((a: any) => !String(a.id || '').startsWith('ai-')));
      setSaleAgents(((sas as any).items || []).filter((s: any) => (s.segment || '') === p.name));
    } catch (e) { console.error(e); }
  };

  const persist = async (next: any) => {
    setPlan(next); setSaving(true);
    try { await api.saveDeployPlan(sel.id, next); loadProjects(); }
    catch (e: any) { alert(e?.message); } finally { setSaving(false); }
  };

  const approveSeller = async (email: string) => {
    try { await api.deployApproveSeller(sel.id, email); const pl = await api.getDeployPlan(sel.id); setPlan(pl); }
    catch (e: any) { alert(e?.message); }
  };

  const runMatch = async () => {
    setMatching(true);
    try { const r = await api.deployMatch(sel.name, 30); setMatches(r.items || []); }
    catch (e: any) { alert(e?.message); } finally { setMatching(false); }
  };

  const addNet = (c: any) => {
    if ((plan.netLeads || []).some((x: any) => x.id === c.id)) return;
    persist({ ...plan, netLeads: [...(plan.netLeads || []), { id: c.id, fullName: c.fullName, phone: c.phone, score: c.score, assignedTo: '' }] });
  };
  const removeNet = (id: string) => persist({ ...plan, netLeads: (plan.netLeads || []).filter((x: any) => x.id !== id) });
  const assignNet = (id: string, staff: string) =>
    setPlan((p: any) => ({ ...p, netLeads: p.netLeads.map((x: any) => x.id === id ? { ...x, assignedTo: staff } : x) }));

  const toggleStaff = (a: any) => {
    const has = (plan.staff || []).some((s: any) => s.id === a.id);
    persist({ ...plan, staff: has ? plan.staff.filter((s: any) => s.id !== a.id) : [...(plan.staff || []), { id: a.id, name: a.name }] });
  };

  const createSaleAo = async () => {
    setBusy('saleao');
    try {
      await api.createSalesAgent({ owner: owner(), name: `Sale ảo ${sel.name}`, persona: `Chuyên tư vấn dự án ${sel.name}`, segment: sel.name, channel: 'telegram' });
      const sas = await api.getSalesAgents('');
      setSaleAgents(((sas as any).items || []).filter((s: any) => (s.segment || '') === sel.name));
      loadProjects();
    } catch (e: any) { alert(e?.message); } finally { setBusy(''); }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-indigo-600"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><Rocket className="w-6 h-6" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-none">Triển khai dự án</h2>
            <p className="text-sm text-slate-400 font-semibold mt-1">Đồng bộ từ ERP · phân khách (data net) · sale ảo · nhân sự</p>
          </div>
        </div>
        <button onClick={loadProjects} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50">Tải lại</button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => (
          <button key={p.id} onClick={() => openProject(p)} className="text-left bg-white rounded-2xl border border-slate-100 p-5 hover:border-indigo-300 hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Building2 className="w-5 h-5" /></div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{p.id}</span>
            </div>
            <h3 className="font-black text-slate-900 text-[15px] group-hover:text-indigo-600">{p.name}</h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">{p.location || '—'} · {p.status || 'Đang mở'}</p>
            <div className="flex gap-2 mt-4 text-[11px] font-black">
              <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-600">👤 {p.staffCount} nhân sự</span>
              <span className="px-2 py-1 rounded-md bg-violet-50 text-violet-600">🤖 {p.saleAoCount} sale ảo</span>
              <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600">🎯 {p.netCount} net</span>
            </div>
          </button>
        ))}
      </div>

      {sel && plan && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setSel(null)}>
          <div className="bg-white rounded-3xl w-full max-w-4xl my-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <div>
                <h3 className="text-xl font-black text-slate-900">{sel.name}</h3>
                <p className="text-xs text-slate-400 font-bold">{sel.id} · {sel.location || '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />}
                <button onClick={() => setSel(null)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-6 space-y-7">
              <section>
                <h4 className="font-black text-slate-900 flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-blue-500" /> Nhân sự tham gia ({(plan.staff || []).length})</h4>
                <div className="flex flex-wrap gap-2">
                  {staffPool.map((a) => {
                    const on = (plan.staff || []).some((s: any) => s.id === a.id);
                    return <button key={a.id} onClick={() => toggleStaff(a)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>{on ? '✓ ' : ''}{a.name}</button>;
                  })}
                  {!staffPool.length && <span className="text-sm text-slate-400">Chưa tải được danh sách nhân sự.</span>}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-black text-slate-900 flex items-center gap-2"><Bot className="w-5 h-5 text-violet-500" /> Sale ảo chăm khách ({saleAgents.length})</h4>
                  <button onClick={createSaleAo} disabled={busy === 'saleao'} className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-xl font-black text-xs hover:bg-violet-700 disabled:opacity-60">
                    {busy === 'saleao' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Tạo sale ảo
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {saleAgents.map((s) => <span key={s.id} className="px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 text-xs font-bold border border-violet-200">🤖 {s.name} · đã chăm {s.nurtured ?? 0}</span>)}
                  {!saleAgents.length && <span className="text-sm text-slate-400">Chưa có sale ảo cho dự án này.</span>}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-black text-slate-900 flex items-center gap-2"><Target className="w-5 h-5 text-emerald-500" /> Khách tiềm năng phù hợp (data NET)</h4>
                  <button onClick={runMatch} disabled={matching} className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 disabled:opacity-60">
                    {matching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} Phân tích toàn hệ thống
                  </button>
                </div>
                {matches.length > 0 && (
                  <div className="space-y-1.5 mb-2 max-h-52 overflow-y-auto">
                    {matches.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-slate-50/60 rounded-xl px-3 py-2 text-sm">
                        <div><span className="font-bold text-slate-800">{c.fullName}</span> <span className="text-slate-400">· {c.phone || '—'}</span> <span className="text-[11px] text-emerald-600 font-black">điểm {c.score}</span> <span className="text-[11px] text-slate-400">({c.reason})</span></div>
                        <button onClick={() => addNet(c)} title="Đưa vào dự án" className="text-indigo-600 hover:text-indigo-800"><UserPlus className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Sale đăng ký bán */}
              <section>
                <h4 className="font-black text-slate-900 flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-amber-500" /> Sale xin bán dự án</h4>
                {(plan.sellRequests || []).length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {(plan.sellRequests || []).map((r: any) => (
                      <div key={r.email} className="flex items-center justify-between bg-amber-50/60 border border-amber-200 rounded-xl px-3 py-2 text-sm">
                        <span className="font-bold text-slate-700">{r.name || r.email} <span className="text-slate-400">({r.email})</span></span>
                        <button onClick={() => approveSeller(r.email)} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-black text-xs hover:bg-emerald-700">Duyệt bán</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {(plan.sellers || []).map((e: string) => <span key={e} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-black border border-emerald-200">✓ {e}</span>)}
                  {!(plan.sellers || []).length && !(plan.sellRequests || []).length && <span className="text-sm text-slate-400">Chưa có sale đăng ký bán dự án này.</span>}
                </div>
              </section>

              <section>
                <h4 className="font-black text-slate-900 flex items-center gap-2 mb-3"><ArrowRight className="w-5 h-5 text-indigo-500" /> Data NET giao cho sale ({(plan.netLeads || []).length})</h4>
                <div className="space-y-1.5">
                  {(plan.netLeads || []).map((n: any) => (
                    <div key={n.id} className="flex items-center justify-between bg-white border border-slate-100 rounded-xl px-3 py-2 text-sm">
                      <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="font-bold text-slate-800">{n.fullName}</span><span className="text-slate-400">{n.phone || '—'}</span></div>
                      <div className="flex items-center gap-2">
                        <select value={n.assignedTo || ''} onChange={(e) => assignNet(n.id, e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1 font-bold">
                          <option value="">— giao cho sale —</option>
                          {(plan.sellers || []).map((e: string) => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <button onClick={() => removeNet(n.id)} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {!(plan.netLeads || []).length && <span className="text-sm text-slate-400">Chưa có data net. Bấm "Phân tích toàn hệ thống" rồi thêm khách.</span>}
                </div>
                <button onClick={() => persist(plan)} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700">
                  <Save className="w-4 h-4" /> Lưu kế hoạch triển khai
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deployment;
