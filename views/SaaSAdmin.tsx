import React, { useEffect, useState } from 'react';
import {
  Rocket, Loader2, Plus, Users, Building2, TrendingUp, LayoutTemplate,
  CheckCircle2, XCircle, RefreshCw, Handshake, Phone, ClipboardList, Zap
} from 'lucide-react';
import { api } from '../services/apiService';
import ProjectWorkspace from './ProjectWorkspace';

const timeAgo = (ts: any): string => {
  if (!ts) return '';
  const ms = typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(String(ts));
  if (Number.isNaN(ms)) return '';
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};

/** Đọc quỹ căn dán từ Excel/Sheet: mỗi dòng "mã [tab/,] diện tích [tab/,] loại [tab/,] hướng [tab/,] giá [tab/,] tình trạng" */
const parseUnits = (text: string): any[] => {
  const out: any[] = [];
  for (const line of text.split('\n')) {
    const cells = line.split(/\t|;|,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.trim());
    if (!cells[0] || !/^[A-Za-z0-9]/.test(cells[0]) || cells[0].length < 3) continue;
    const numOf = (s: string) => { const d = (s || '').replace(/[^0-9]/g, ''); return d ? Number(d) : undefined; };
    const areaOf = (s: string) => { const m = (s || '').replace(',', '.').match(/\d+\.?\d*/); return m ? Number(m[0]) : undefined; };
    out.push({
      code: cells[0], area: areaOf(cells[1] || ''), type: cells[2] || '', direction: cells[3] || '',
      price: numOf(cells[4] || ''), status: cells[5] || 'Mở bán',
    });
  }
  return out;
};

const SaaSAdmin: React.FC = () => {
  const [tab, setTab] = useState<'tower' | 'wizard'>('tower');
  const [wsProject, setWsProject] = useState('');
  if (wsProject) return <ProjectWorkspace project={wsProject} onBack={() => setWsProject('')} />;
  return (
    <div className="space-y-5">
      <div className="flex gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm w-fit">
        <button onClick={() => setTab('tower')} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition ${tab === 'tower' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
          <TrendingUp className="w-4 h-4" /> Bàn điều hành (Admin)
        </button>
        <button onClick={() => setTab('wizard')} className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition ${tab === 'wizard' ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
          <Plus className="w-4 h-4" /> Khởi tạo dự án
        </button>
      </div>
      {tab === 'tower' ? <ControlTower onOpen={setWsProject} /> : <Wizard onDone={() => setTab('tower')} />}
    </div>
  );
};

// ============ A1. WIZARD KHỞI TẠO ============
const Wizard: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [unitsText, setUnitsText] = useState('');
  const [sales, setSales] = useState<string[]>([]);
  const [roster, setRoster] = useState<{ email: string; name: string }[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [pickedPartners, setPickedPartners] = useState<string[]>([]);
  const [deploy, setDeploy] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.saasAdminOverview().then((d: any) => setRoster((d?.sales || []).map((s: any) => ({ email: s.email, name: s.name }))));
    api.saasPartners().then((d: any) => setPartners(d?.items || []));
  }, []);

  const units = parseUnits(unitsText);

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api.saasProjectInit({ name: name.trim(), location: location.trim(), description: description.trim(), units, sales, partners: pickedPartners, deploy });
      if (!r?.ok) throw new Error(r?.error || 'Khởi tạo lỗi');
      setResult(r);
    } catch (e: any) { setErr(e?.message || 'Lỗi khởi tạo'); }
    setBusy(false);
  };

  const StepDot = ({ n, label }: { n: number; label: string }) => (
    <button onClick={() => n < step && setStep(n)} className={`flex items-center gap-2 ${n <= step ? 'text-indigo-700' : 'text-slate-300'}`}>
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${n < step ? 'bg-indigo-600 text-white' : n === step ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-400' : 'bg-slate-100'}`}>{n}</span>
      <span className="text-xs font-black hidden sm:inline">{label}</span>
    </button>
  );

  if (result) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-6 text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h3 className="text-xl font-black text-slate-900">Đã khởi tạo dự án "{result.project}"</h3>
        <div className="max-w-md mx-auto space-y-1.5 text-left">
          {(result.steps || []).map((st: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {st.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              <b className="capitalize">{st.step === 'catalog' ? 'Danh mục' : st.step === 'inventory' ? 'Quỹ căn' : st.step === 'assign' ? 'Gán sale/G2' : 'Triển khai tự trị'}</b>
              <span className="text-slate-500">{st.note}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">Sale được gán đã nhận thông báo qua kênh nhắn tin. Quỹ căn + landing sẵn sàng ở Sàn BĐS → Quỹ căn.</p>
        <button onClick={onDone} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm">Về bàn điều hành</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
      <div className="flex items-center gap-4 flex-wrap">
        <StepDot n={1} label="Thông tin" /><span className="text-slate-200">—</span>
        <StepDot n={2} label="Quỹ căn" /><span className="text-slate-200">—</span>
        <StepDot n={3} label="Gán sale & G2" /><span className="text-slate-200">—</span>
        <StepDot n={4} label="Xuất bản" />
      </div>

      {step === 1 && (
        <div className="space-y-3 max-w-xl">
          <div><label className="text-xs font-black text-slate-500">Tên dự án *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="vd: Sky Garden Đà Nẵng" className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm" /></div>
          <div><label className="text-xs font-black text-slate-500">Vị trí</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="vd: Sơn Trà, Đà Nẵng" className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm" /></div>
          <div><label className="text-xs font-black text-slate-500">Mô tả ngắn</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Định vị, điểm nổi bật…" className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm" /></div>
          <button onClick={() => name.trim() && setStep(2)} disabled={!name.trim()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm disabled:opacity-50">Tiếp: Quỹ căn →</button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Dán bảng hàng từ Excel/Trang tính (mỗi dòng 1 căn): <b>Mã căn · Diện tích · Loại · Hướng · Giá · Tình trạng</b>. Có thể bỏ qua, nhập sau.</p>
          <textarea value={unitsText} onChange={e => setUnitsText(e.target.value)} rows={8}
            placeholder={'SG-05.01\t50.5\t1PN\tĐông Nam\t2500000000\tMở bán\nSG-05.02\t65\t2PN\tTây Bắc\t3200000000\tMở bán'}
            className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono" />
          <p className="text-xs font-bold text-indigo-600">{units.length > 0 ? `✓ Nhận diện ${units.length} căn` : 'Chưa có căn nào (bỏ qua được)'}</p>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2.5 border border-slate-200 rounded-xl font-black text-sm text-slate-600">← Lại</button>
            <button onClick={() => setStep(3)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm">Tiếp: Gán sale & G2 →</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-black text-slate-500 uppercase mb-2">Chọn sale phụ trách ({sales.length})</p>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {roster.map(r => {
                const on = sales.includes(r.email);
                return (
                  <button key={r.email} onClick={() => setSales(p => on ? p.filter(x => x !== r.email) : [...p, r.email])}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${on ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}`}>{r.name}</button>
                );
              })}
              {roster.length === 0 && <span className="text-sm text-slate-400">Đang tải danh sách sale…</span>}
            </div>
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 uppercase mb-2">Sàn G2 phân phối ({pickedPartners.length})</p>
            <div className="flex flex-wrap gap-2">
              {partners.map((p: any) => {
                const on = pickedPartners.includes(p.id);
                return (
                  <button key={p.id} onClick={() => setPickedPartners(prev => on ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${on ? 'border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-100 text-slate-500'}`}>
                    <Handshake className="w-3 h-3 inline mr-1" />{p.name}</button>
                );
              })}
              {partners.length === 0 && <span className="text-sm text-slate-400">Chưa có sàn G2 — đăng ký ở trang Sàn G2.</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2.5 border border-slate-200 rounded-xl font-black text-sm text-slate-600">← Lại</button>
            <button onClick={() => setStep(4)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm">Tiếp: Xuất bản →</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 max-w-xl">
          <div className="bg-slate-50 rounded-xl p-4 space-y-1 text-sm">
            <p><b>{name}</b>{location ? ` · ${location}` : ''}</p>
            <p className="text-slate-500">{units.length} căn · {sales.length} sale · {pickedPartners.length} sàn G2</p>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={deploy} onChange={e => setDeploy(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Zap className="w-4 h-4 text-amber-500" /> Chạy triển khai tự trị ngay (huấn luyện AI, chiến dịch, phễu — chạy nền)</span>
          </label>
          {err && <p className="text-sm font-bold text-rose-600">{err}</p>}
          <div className="flex gap-2">
            <button onClick={() => setStep(3)} className="px-4 py-2.5 border border-slate-200 rounded-xl font-black text-sm text-slate-600">← Lại</button>
            <button onClick={submit} disabled={busy} className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Khởi tạo dự án
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============ A2. CONTROL TOWER (sổ đăng ký hợp nhất — mọi nguồn về một mối) ============
const ControlTower: React.FC<{ onOpen?: (p: string) => void }> = ({ onOpen }) => {
  const [d, setD] = useState<any>(null);
  const [registry, setRegistry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignFor, setAssignFor] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    const [ov, rg] = await Promise.all([api.saasAdminOverview(), api.saasRegistry()]);
    setD(ov); setRegistry(rg?.items || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading && !d) return <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  const t = d?.totals || {};

  const Stat = ({ icon, label, value }: any) => (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 text-slate-400 text-[11px] font-black uppercase">{icon}{label}</div>
      <p className="text-2xl font-black text-slate-900 mt-1 tabular-nums">{value ?? 0}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Stat icon={<Building2 className="w-3.5 h-3.5" />} label="Dự án (hợp nhất)" value={registry.length} />
        <Stat icon={<ClipboardList className="w-3.5 h-3.5" />} label="Quỹ căn" value={t.units} />
        <Stat icon={<LayoutTemplate className="w-3.5 h-3.5" />} label="Landing" value={t.landings} />
        <Stat icon={<Users className="w-3.5 h-3.5" />} label="Khách (lead)" value={t.leads} />
        <Stat icon={<TrendingUp className="w-3.5 h-3.5" />} label="Lead 7 ngày" value={t.leads7d} />
        <Stat icon={<Users className="w-3.5 h-3.5" />} label="Sale" value={t.sales} />
        <Stat icon={<Handshake className="w-3.5 h-3.5" />} label="Sàn G2" value={t.partners} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sổ đăng ký hợp nhất — TẤT CẢ dự án từ mọi nguồn (ERP/RAG/wizard) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <span className="font-black text-slate-800">Toàn bộ dự án (hợp nhất từ triển khai · phễu · quỹ căn · landing · lead)</span>
            <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead><tr className="text-left text-[11px] font-black text-slate-400 uppercase border-b border-slate-100">
                <th className="py-2 pr-3">Dự án</th><th className="py-2 pr-3">Triển khai</th><th className="py-2 pr-3">Phễu</th>
                <th className="py-2 pr-3 text-right">Quỹ căn</th><th className="py-2 pr-3 text-right">Landing</th>
                <th className="py-2 pr-3 text-right">Lead</th><th className="py-2 pr-3">Sale/G2</th><th className="py-2"></th>
              </tr></thead>
              <tbody>
                {registry.map((r: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="py-2 pr-3 font-black text-slate-800">{r.project}</td>
                    <td className="py-2 pr-3">
                      <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${r.deployDone >= 7 ? 'bg-emerald-50 text-emerald-700' : r.deployDone > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                        {r.deployDone}/{r.deployTotal}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{r.funnelStages > 0 ? <span className="text-[11px] font-bold bg-fuchsia-50 text-fuchsia-700 rounded-full px-2 py-0.5">{r.funnelStages} GĐ</span> : <span className="text-slate-300">—</span>}</td>
                    <td className="py-2 pr-3 text-right tabular-nums font-bold">{r.units || '—'}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{r.landings || '—'}</td>
                    <td className="py-2 pr-3 text-right tabular-nums font-black text-emerald-700">{r.leads || 0}</td>
                    <td className="py-2 pr-3 text-slate-500 text-xs">{r.sales.length} sale · {r.partners.length} G2</td>
                    <td className="py-2 whitespace-nowrap">
                      <button onClick={() => onOpen && onOpen(r.project)} className="text-xs font-black text-indigo-600 hover:underline mr-3">Bảng điều khiển →</button>
                      <button onClick={() => setAssignFor(r)} className="text-xs font-black text-slate-400 hover:text-indigo-600 hover:underline">Gán</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lead theo dự án */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <span className="font-black text-slate-800">Khách theo dự án</span>
          <div className="space-y-1.5 mt-3 max-h-72 overflow-y-auto">
            {(d?.leadsByProject || []).map((x: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm text-slate-600 flex-1 truncate">{x.project}</span>
                <div className="h-2 bg-indigo-100 rounded-full flex-1 overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, x.leads * 12)}%` }} /></div>
                <b className="text-sm tabular-nums w-8 text-right">{x.leads}</b>
              </div>
            ))}
            {(d?.leadsByProject || []).length === 0 && <p className="text-sm text-slate-400 text-center py-6">Chưa có khách từ landing.</p>}
          </div>
        </div>

        {/* Hiệu suất sale */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <span className="font-black text-slate-800">Hiệu suất sale (lead được gán)</span>
          <div className="space-y-1.5 mt-3 max-h-64 overflow-y-auto">
            {(d?.sales || []).slice(0, 10).map((s: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 truncate">{s.name || s.email}</span>
                <b className="tabular-nums text-indigo-700">{s.leads}</b>
              </div>
            ))}
          </div>
        </div>

        {assignFor && <AssignModal proj={assignFor} onClose={(changed: boolean) => { setAssignFor(null); if (changed) load(); }} />}

        {/* Khách mới nhất */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <span className="font-black text-slate-800">Khách mới nhất</span>
          <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
            {(d?.recentLeads || []).map((l: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-2.5 py-2">
                <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-bold text-slate-800 truncate">{l.name}</span>
                <span className="text-slate-400 text-xs shrink-0">{l.project}{l.code ? ` · ${l.code}` : ''}</span>
                <span className="text-[11px] text-slate-400 ml-auto shrink-0">{timeAgo(l.ts)}</span>
              </div>
            ))}
            {(d?.recentLeads || []).length === 0 && <p className="text-sm text-slate-400 text-center py-6">Chưa có khách.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal gán sale/G2 cho một dự án (kể cả dự án đã triển khai từ ERP/RAG)
const AssignModal: React.FC<{ proj: any; onClose: (changed: boolean) => void }> = ({ proj, onClose }) => {
  const [roster, setRoster] = useState<{ email: string; name: string }[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [sales, setSales] = useState<string[]>(proj.sales || []);
  const [picked, setPicked] = useState<string[]>(proj.partners || []);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.saasAdminOverview().then((d: any) => setRoster((d?.sales || []).map((s: any) => ({ email: s.email, name: s.name }))));
    api.saasPartners().then((d: any) => setPartners(d?.items || []));
  }, []);

  const save = async () => {
    setBusy(true);
    try { await api.saasAssign(proj.project, sales, picked); onClose(true); return; } catch { /* */ }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => onClose(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-black text-slate-900">Gán sale & sàn G2 — {proj.project}</h3>
        <div>
          <p className="text-xs font-black text-slate-500 uppercase mb-2">Sale phụ trách ({sales.length})</p>
          <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto">
            {roster.map(r => {
              const on = sales.includes(r.email);
              return (
                <button key={r.email} onClick={() => setSales(p => on ? p.filter(x => x !== r.email) : [...p, r.email])}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${on ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}`}>{r.name}</button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-black text-slate-500 uppercase mb-2">Sàn G2 phân phối ({picked.length})</p>
          <div className="flex flex-wrap gap-2">
            {partners.map((p: any) => {
              const on = picked.includes(p.id);
              return (
                <button key={p.id} onClick={() => setPicked(prev => on ? prev.filter(x => x !== p.id) : [...prev, p.id])}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${on ? 'border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-100 text-slate-500'}`}>{p.name}</button>
              );
            })}
            {partners.length === 0 && <span className="text-sm text-slate-400">Chưa có sàn G2 (đăng ký ở trang Sàn G2).</span>}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => onClose(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-black text-sm">Huỷ</button>
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Lưu gán
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaaSAdmin;
