import React, { useEffect, useState } from 'react';
import { TrendingUp, Loader2, Sparkles, Copy, Check, AlertTriangle, Database } from 'lucide-react';
import { api } from '../services/apiService';

const num = (v: any) => (typeof v === 'number' ? v : parseFloat(String(v || '').replace(/[^\d.]/g, ''))) || 0;

const MarketResearch: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [listings, setListings] = useState<any[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r: any = await api.getProjectsCbx();
        setProjects(r?.items || r?.data?.items || r?.data || []);
      } catch { /* */ }
      try {
        const pr: any = await api.getRaiProperties({ page: 1, pageSize: 40 } as any);
        const items = pr?.items || pr?.data?.items || pr?.data || [];
        setListings(Array.isArray(items) ? items : []);
      } catch { setErr('Chưa lấy được dữ liệu listing thị trường.'); }
      try { const s: any = await api.getRaiPropertySources(); setSources(Array.isArray(s) ? s : (s?.data || [])); } catch { /* */ }
      setLoadingData(false);
    })();
  }, []);

  const gen = async () => {
    setErr(''); setLoading(true); setText('');
    try {
      const comp = listings.map((x: any) => ({
        title: x.title || x.name || x.propertyName,
        price: x.priceText || x.price || x.listedPrice,
        area: x.area || x.acreage || x.size,
        source: x.source || x.sourceName || x.origin,
      }));
      const r = await api.estateMarket({ project, listings: comp });
      setText(r?.text || '');
    } catch (e: any) { setErr(e?.message || 'Lỗi'); }
    setLoading(false);
  };
  const copy = () => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const prices = listings.map((x: any) => num(x.price || x.listedPrice || x.priceText)).filter(v => v > 0);
  const avg = prices.length ? (prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-3xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-5 h-5" /><span className="font-black">Market researcher — Nghiên cứu thị trường</span></div>
        <p className="text-sm opacity-90">AI quét <b>{loadingData ? '...' : listings.length}</b> listing đa nguồn {sources.length ? `(${sources.slice(0, 4).join(', ')}${sources.length > 4 ? '...' : ''})` : ''} → phân tích mặt bằng giá, nguồn cung đối thủ, định vị dự án & khuyến nghị giá.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 p-4"><div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white mb-2"><Database className="w-4 h-4" /></div><p className="text-2xl font-black text-slate-900">{loadingData ? '—' : listings.length}</p><p className="text-[11px] text-slate-400 font-bold">Listing thị trường</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4"><div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white mb-2"><Database className="w-4 h-4" /></div><p className="text-2xl font-black text-slate-900">{sources.length || '—'}</p><p className="text-[11px] text-slate-400 font-bold">Nguồn dữ liệu</p></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4"><div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white mb-2"><TrendingUp className="w-4 h-4" /></div><p className="text-2xl font-black text-slate-900">{avg ? (avg >= 1e9 ? (avg / 1e9).toFixed(1) + ' tỷ' : (avg / 1e6).toFixed(0) + ' tr') : '—'}</p><p className="text-[11px] text-slate-400 font-bold">Giá TB niêm yết</p></div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <select value={project} onChange={e => setProject(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="">— Toàn thị trường —</option>
            {projects.map((p: any) => <option key={p.id || p.slug || p.name} value={p.name}>Định vị: {p.name}</option>)}
          </select>
          <button onClick={gen} disabled={loading || loadingData} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Phân tích thị trường
          </button>
        </div>
        {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}
        {text && (
          <div className="relative">
            <button onClick={copy} className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-2xl p-4 pr-16">{text}</div>
          </div>
        )}
        <p className="text-[11px] text-slate-400 flex items-start gap-1"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" /> Dữ liệu từ nguồn đã tổng hợp sẵn của sàn; số liệu tham khảo, không tái phát tán dữ liệu cá nhân (Nghị định 13/2023).</p>
      </div>
    </div>
  );
};

export default MarketResearch;
