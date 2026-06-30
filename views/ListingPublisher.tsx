import React, { useEffect, useState } from 'react';
import { Newspaper, Loader2, Sparkles, Copy, Check, AlertTriangle, Globe, Facebook, MessageCircle } from 'lucide-react';
import { api } from '../services/apiService';

const CHANNELS = [
  { id: 'Website', icon: Globe, c: 'text-indigo-600' },
  { id: 'Facebook', icon: Facebook, c: 'text-blue-600' },
  { id: 'Zalo', icon: MessageCircle, c: 'text-sky-500' },
];

const ListingPublisher: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [unit, setUnit] = useState('');
  const [highlights, setHighlights] = useState('');
  const [channel, setChannel] = useState('Website');
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getProjectsCbx().then((r: any) => {
      const items = r?.items || r?.data?.items || r?.data || [];
      setProjects(Array.isArray(items) ? items : []);
    }).catch(() => { /* */ });
  }, []);

  const gen = async () => {
    if (!project) { setErr('Chọn dự án.'); return; }
    setErr(''); setLoading(true); setText('');
    try {
      const r = await api.estateListing({ project, unit, highlights, channel });
      setText(r?.text || '');
    } catch (e: any) { setErr(e?.message || 'Lỗi'); }
    setLoading(false);
  };
  const copy = () => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-center gap-2"><Newspaper className="w-5 h-5 text-fuchsia-600" /><span className="font-black text-slate-900">Auto-poster — Sinh tin đăng theo kênh</span></div>
      <p className="text-xs text-slate-400 -mt-2">AI bám tài liệu dự án sinh tin đăng chuẩn cho từng kênh (Website chuẩn SEO · Facebook caption+hashtag · Zalo broadcast). Duyệt rồi đăng.</p>

      <div className="flex items-center gap-2">
        {CHANNELS.map(c => {
          const Icon = c.icon; const on = channel === c.id;
          return <button key={c.id} onClick={() => setChannel(c.id)} className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-black text-sm border transition ${on ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><Icon className={`w-4 h-4 ${on ? '' : c.c}`} />{c.id}</button>;
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select value={project} onChange={e => setProject(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 text-sm">
          <option value="">— chọn dự án —</option>
          {projects.map((p: any) => <option key={p.id || p.slug || p.name} value={p.name}>{p.name}</option>)}
        </select>
        <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Căn/sản phẩm (vd: 2PN 75m²)" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
        <input value={highlights} onChange={e => setHighlights(e.target.value)} placeholder="Điểm nhấn (vd: view sông, bàn giao 2026)" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
      </div>
      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}
      <button onClick={gen} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Sinh tin đăng {channel}
      </button>
      {text && (
        <div className="relative">
          <button onClick={copy} className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>
          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-2xl p-4 pr-16">{text}</div>
        </div>
      )}
      <p className="text-[11px] text-slate-400">Đăng web/FB/Zalo qua mục <b>Kênh</b> & <b>Marketing</b>. Đăng portal ngoài (batdongsan.com.vn, Chợ Tốt) cần connector + duyệt — giai đoạn sau.</p>
    </div>
  );
};

export default ListingPublisher;
