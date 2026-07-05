import React, { useEffect, useState } from 'react';
import { Building2, Loader2, Search, X, FileText, LayoutTemplate, Copy, Check, Sparkles, Home, Compass, Ruler, Layers, Tag, RefreshCw } from 'lucide-react';
import { api } from '../services/apiService';

const fmtVnd = (n: any): string => {
  const x = Number(n);
  if (!x || Number.isNaN(x)) return '—';
  if (x >= 1e9) return (x / 1e9).toFixed(2).replace(/\.?0+$/, '') + ' tỷ';
  if (x >= 1e6) return Math.round(x / 1e6) + ' tr';
  return String(x);
};
const statusColor = (s: string): string => {
  const n = (s || '').toLowerCase();
  if (n.includes('đã bán') || n.includes('da ban')) return 'bg-rose-50 text-rose-600';
  if (n.includes('độc quyền') || n.includes('doc quyen')) return 'bg-emerald-50 text-emerald-700';
  if (n.includes('chéo') || n.includes('cheo')) return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-500';
};

const Inventory: React.FC = () => {
  const [summary, setSummary] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<any>(null);

  useEffect(() => {
    api.inventorySummary().then((r: any) => {
      const items = r?.items || [];
      setSummary(items);
      if (items.length) setProject(items[0].project);
    });
  }, []);

  const load = async (p: string) => {
    if (!p) return;
    setLoading(true);
    try { const r = await api.inventoryList(p); setUnits(r?.units || []); } catch { setUnits([]); }
    setLoading(false);
  };
  useEffect(() => { load(project); /* eslint-disable-next-line */ }, [project]);

  const nq = q.trim().toLowerCase();
  const filtered = nq ? units.filter(u => `${u.code} ${u.block} ${u.type} ${u.direction} ${u.status}`.toLowerCase().includes(nq)) : units;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><Building2 className="w-5 h-5" /><span className="font-black text-lg">Quỹ căn — Bảng hàng theo dự án</span></div>
        <p className="text-sm opacity-90">Mỗi mã căn là một sản phẩm bán: giá, diện tích, hướng, loại. Chọn căn → tạo <b>tin đăng</b> hoặc <b>landing page</b> để sale chạy quảng cáo.</p>
      </div>

      {/* Dự án */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {summary.map((s: any) => {
          const active = s.project === project;
          return (
            <button key={s.key} onClick={() => setProject(s.project)}
              className={`flex items-center gap-2 pl-3 pr-3.5 py-2 rounded-xl border-2 whitespace-nowrap shrink-0 transition ${active ? 'border-fuchsia-600 bg-fuchsia-50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
              <span className={`text-sm font-black ${active ? 'text-fuchsia-700' : 'text-slate-600'}`}>{s.project}</span>
              <span className="text-[11px] font-bold bg-white/70 text-slate-500 rounded-full px-2 py-0.5">{s.count}</span>
            </button>
          );
        })}
      </div>

      {/* Bảng căn */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <span className="font-black text-slate-800">{project} — {filtered.length} căn</span>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm mã căn / toà / loại…" className="pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm w-56" />
            </div>
            <button onClick={() => load(project)} className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </div>
        {loading ? (
          <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[11px] font-black text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-2 pr-3">Mã căn</th><th className="py-2 pr-3">Toà</th><th className="py-2 pr-3">Tầng</th>
                  <th className="py-2 pr-3">DT (m²)</th><th className="py-2 pr-3">Loại</th><th className="py-2 pr-3">Hướng</th>
                  <th className="py-2 pr-3 text-right">Giá</th><th className="py-2 pr-3">Tình trạng</th><th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="py-2 pr-3 font-black text-slate-800">{u.code}</td>
                    <td className="py-2 pr-3 text-slate-500">{u.block || '—'}</td>
                    <td className="py-2 pr-3 text-slate-500">{u.floor || '—'}</td>
                    <td className="py-2 pr-3 text-slate-600 tabular-nums">{u.area || '—'}</td>
                    <td className="py-2 pr-3 text-slate-600">{u.type || '—'}</td>
                    <td className="py-2 pr-3 text-slate-600">{u.direction || '—'}</td>
                    <td className="py-2 pr-3 text-right font-bold text-slate-800 tabular-nums">{fmtVnd(u.price)}</td>
                    <td className="py-2 pr-3"><span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${statusColor(u.status)}`}>{u.status || '—'}</span></td>
                    <td className="py-2"><button onClick={() => setSel(u)} className="text-xs font-black text-fuchsia-600 hover:underline whitespace-nowrap">Bán căn →</button></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-slate-400">Không có căn phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sel && <UnitModal project={project} unit={sel} onClose={() => setSel(null)} />}
    </div>
  );
};

const UnitModal: React.FC<{ project: string; unit: any; onClose: () => void }> = ({ project, unit, onClose }) => {
  const [tab, setTab] = useState<'listing' | 'landing'>('listing');
  const [brief, setBrief] = useState('');
  const [listing, setListing] = useState<any>(null);
  const [landing, setLanding] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  const copy = (id: string, text: string) => { try { navigator.clipboard.writeText(text || ''); setCopied(id); setTimeout(() => setCopied(''), 1500); } catch { /* */ } };

  const gen = async () => {
    setBusy(true);
    try {
      if (tab === 'listing') { const r = await api.inventoryListing(project, unit.code, brief.trim() || undefined); if (!r?.error) setListing(r); }
      else { const r = await api.inventoryLanding(project, unit.code, brief.trim() || undefined); if (!r?.error) setLanding(r); }
    } catch { /* */ }
    setBusy(false);
  };

  const spec = (icon: React.ReactNode, label: string, val: any) => (
    <div className="flex items-center gap-1.5 text-sm"><span className="text-slate-400">{icon}</span><span className="text-slate-500">{label}:</span><b className="text-slate-800">{val || '—'}</b></div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-900">{unit.code}</h3>
            <p className="text-xs text-slate-400">{project}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3">
            {spec(<Ruler className="w-4 h-4" />, 'Diện tích', unit.area ? unit.area + ' m²' : '')}
            {spec(<Home className="w-4 h-4" />, 'Loại', unit.type)}
            {spec(<Compass className="w-4 h-4" />, 'Hướng', unit.direction)}
            {spec(<Layers className="w-4 h-4" />, 'Tầng', unit.floor)}
            {spec(<Building2 className="w-4 h-4" />, 'Toà', unit.block)}
            {spec(<Tag className="w-4 h-4" />, 'Giá', fmtVnd(unit.price))}
          </div>

          <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1 w-fit">
            <button onClick={() => setTab('listing')} className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-black text-sm ${tab === 'listing' ? 'bg-white shadow text-fuchsia-700' : 'text-slate-500'}`}><FileText className="w-4 h-4" /> Tin đăng</button>
            <button onClick={() => setTab('landing')} className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-black text-sm ${tab === 'landing' ? 'bg-white shadow text-fuchsia-700' : 'text-slate-500'}`}><LayoutTemplate className="w-4 h-4" /> Landing page</button>
          </div>

          <div className="flex gap-2">
            <input value={brief} onChange={e => setBrief(e.target.value)} placeholder="Định hướng (tuỳ chọn): nhấn view biển, khách đầu tư…" className="flex-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
            <button onClick={gen} disabled={busy} className="inline-flex items-center gap-2 px-4 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60 shrink-0">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tạo
            </button>
          </div>

          {/* Kết quả tin đăng */}
          {tab === 'listing' && listing && (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-black text-slate-900">{listing.title}</p>
                <button onClick={() => copy('t', `${listing.title}\n\n${listing.description}\n\n${(listing.hashtags || []).join(' ')}`)} className="inline-flex items-center gap-1 text-xs font-black text-fuchsia-600 hover:underline shrink-0">
                  {copied === 't' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy
                </button>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{listing.description}</p>
              {(listing.highlights || []).length > 0 && (
                <ul className="text-sm text-slate-700 space-y-1">
                  {listing.highlights.map((h: string, i: number) => <li key={i} className="flex gap-2"><span className="text-fuchsia-500">✦</span>{h}</li>)}
                </ul>
              )}
              {(listing.hashtags || []).length > 0 && <p className="text-sm text-indigo-600 font-semibold">{listing.hashtags.join(' ')}</p>}
            </div>
          )}

          {/* Kết quả landing */}
          {tab === 'landing' && landing && (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white p-4">
                <p className="font-black text-lg leading-tight">{landing.headline}</p>
                <p className="text-sm opacity-90 mt-1">{landing.subheadline}</p>
                {landing.heroCta && <span className="inline-block mt-2 bg-white text-indigo-700 rounded-lg px-3 py-1 text-sm font-black">{landing.heroCta}</span>}
              </div>
              {(landing.specs || []).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {landing.specs.map((s: any, i: number) => <div key={i} className="bg-slate-50 rounded-lg p-2.5"><p className="text-[11px] text-slate-400 font-bold">{s.label}</p><p className="text-sm font-black text-slate-800">{s.value}</p></div>)}
                </div>
              )}
              {(landing.benefits || []).map((b: any, i: number) => (
                <div key={i} className="border-l-2 border-fuchsia-300 pl-3"><p className="font-black text-sm text-slate-800">{b.title}</p><p className="text-sm text-slate-600">{b.text}</p></div>
              ))}
              {landing.location && <div><p className="text-[11px] font-black text-slate-400 uppercase">Vị trí</p><p className="text-sm text-slate-700">{landing.location}</p></div>}
              {landing.policy && <div><p className="text-[11px] font-black text-slate-400 uppercase">Chính sách</p><p className="text-sm text-slate-700">{landing.policy}</p></div>}
              {(landing.faq || []).map((f: any, i: number) => (
                <div key={i} className="bg-slate-50 rounded-lg p-2.5"><p className="text-sm font-black text-slate-800">{f.q}</p><p className="text-sm text-slate-600">{f.a}</p></div>
              ))}
              {landing.finalCta && <div className="text-center bg-fuchsia-50 rounded-xl p-3"><p className="font-black text-fuchsia-800">{landing.finalCta}</p></div>}
              <button onClick={() => copy('l', JSON.stringify(landing, null, 2))} className="inline-flex items-center gap-1 text-xs font-black text-fuchsia-600 hover:underline">
                {copied === 'l' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy toàn bộ landing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;
