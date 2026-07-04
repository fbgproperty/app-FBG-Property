import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Loader2, Sparkles, Download, AlertTriangle, Wand2, History as HistoryIcon, Trash2, Clock, RefreshCw } from 'lucide-react';
import { api } from '../services/apiService';

const timeAgo = (ts: any): string => {
  if (!ts) return '';
  const ms = typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(String(ts));
  if (Number.isNaN(ms)) return '';
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(ms).toLocaleDateString('vi-VN');
};

const TYPES = [
  { id: 'banner', t: 'Banner quảng cáo' },
  { id: 'poster', t: 'Poster sang trọng' },
  { id: 'social', t: 'Ảnh post mạng XH' },
  { id: 'interior', t: 'Nội thất / staging ảo' },
  { id: 'aerial', t: 'Phối cảnh trên cao' },
];

const ImageFactory: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [type, setType] = useState('banner');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const FEATURE = 'image-factory';
  const [history, setHistory] = useState<any[]>([]);
  const loadHistory = async () => {
    try { const r = await api.contentHistory(FEATURE, { limit: 30 }); setHistory(Array.isArray(r?.items) ? r.items : []); } catch { /* */ }
  };
  const deleteHistory = async (id: string) => { setHistory(prev => prev.filter(h => String(h.id) !== String(id))); try { await api.contentDelete(id); } catch { /* */ } };

  useEffect(() => {
    api.getProjectsCbx().then((r: any) => {
      const items = r?.items || r?.data?.items || r?.data || [];
      setProjects(Array.isArray(items) ? items : []);
    }).catch(() => { /* */ });
    loadHistory();
  }, []);

  const gen = async () => {
    if (!project) { setErr('Chọn dự án trước.'); return; }
    setErr(''); setLoading(true); setImages([]); setPrompt('');
    try {
      const r = await api.imageDraft({ project, type, note, count: 3 });
      setPrompt(r?.prompt || '');
      const imgs = Array.isArray(r?.images) ? r.images : [];
      setImages(imgs);
      if (imgs.length) {
        const label = TYPES.find(t => t.id === type)?.t || 'Ảnh';
        try { await api.contentSave({ feature: FEATURE, kind: type, title: `${label} · ${project}`, url: imgs[0], text: r?.prompt || '', meta: { project, images: imgs, prompt: r?.prompt || '' } }); } catch { /* */ }
        loadHistory();
      }
    } catch (e: any) { setErr(e?.message || 'Lỗi tạo ảnh'); }
    setLoading(false);
  };

  return (
    <div className="space-y-5">
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-fuchsia-600" /><span className="font-black text-slate-900">Designer — Ảnh AI cho dự án</span></div>
      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-black text-slate-500">Dự án</label>
          <select value={project} onChange={e => setProject(e.target.value)} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="">— chọn dự án —</option>
            {projects.map((p: any) => <option key={p.id || p.slug || p.name} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-black text-slate-500">Loại ảnh</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm">
            {TYPES.map(t => <option key={t.id} value={t.id}>{t.t}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-black text-slate-500">Yêu cầu thêm (tuỳ chọn)</label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="vd: ven sông, tông xanh, có gia đình..." className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
      </div>

      <button onClick={gen} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Tạo ảnh
      </button>

      {prompt && <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2"><b>Prompt AI:</b> {prompt}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <div key={i} className="group relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 aspect-square">
              <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
              <a href={img} target="_blank" rel="noreferrer" download className="absolute bottom-2 right-2 bg-white/90 rounded-lg p-2 opacity-0 group-hover:opacity-100 transition"><Download className="w-4 h-4 text-slate-700" /></a>
            </div>
          ))}
        </div>
      )}
      {loading && <div className="text-xs text-slate-400">Đang sinh ảnh... (vài giây, ảnh tải dần)</div>}

      <p className="text-[11px] text-slate-400 flex items-start gap-1"><Sparkles className="w-3 h-3 mt-0.5 shrink-0" /> Ảnh AI minh hoạ — KHÔNG phải ảnh thật của căn hộ. Dùng cho banner/ý tưởng; ghi rõ "ảnh minh hoạ" khi đăng.</p>
    </div>

    {/* Lịch sử ảnh đã tạo — bền theo điều hướng */}
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-indigo-600" />
          <span className="font-black text-slate-900">Ảnh đã tạo</span>
          {history.length > 0 && <span className="text-xs font-bold text-slate-400">({history.length})</span>}
        </div>
        <button onClick={loadHistory} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"><RefreshCw className="w-3.5 h-3.5" /> Làm mới</button>
      </div>
      {history.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <HistoryIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">Chưa có ảnh nào được lưu.</p>
          <p className="text-xs">Ảnh bạn tạo sẽ được lưu tại đây, không mất khi chuyển trang.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map(h => {
            const imgs: string[] = Array.isArray(h.meta?.images) ? h.meta.images : (h.url ? [h.url] : []);
            return (
              <div key={h.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{h.title || '(không tiêu đề)'}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{timeAgo(h.ts)}</p>
                  </div>
                  <button onClick={() => deleteHistory(String(h.id))} title="Xoá" className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {imgs.map((img, i) => (
                    <div key={i} className="group relative rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-square">
                      <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <a href={img} target="_blank" rel="noreferrer" download className="absolute bottom-1.5 right-1.5 bg-white/90 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition"><Download className="w-3.5 h-3.5 text-slate-700" /></a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
};

export default ImageFactory;
