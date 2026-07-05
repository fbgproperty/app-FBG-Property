import React, { useEffect, useRef, useState } from 'react';
import { Video, Loader2, Film, Download, Sparkles, AlertTriangle, Clock, History as HistoryIcon, Trash2, Play, RefreshCw } from 'lucide-react';
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

const parseImgs = (p: any): string[] => {
  let raw = p?.imagesJson ?? p?.images ?? [];
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = [raw]; } }
  return (Array.isArray(raw) ? raw : []).filter((x: any) => typeof x === 'string' && /^https?:\/\//.test(x));
};

const VideoFactory: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [pid, setPid] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('FBG Property');
  const [images, setImages] = useState<string[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [job, setJob] = useState<{ id: string; status: string; step?: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const poll = useRef<any>(null);

  const FEATURE = 'video-factory';
  const LSKEY = 'fbg_vidfactory_job';
  const [history, setHistory] = useState<any[]>([]);
  const [histBlobs, setHistBlobs] = useState<Record<string, string>>({});
  const loadHistory = async () => {
    try { const r = await api.contentHistory(FEATURE, { limit: 30 }); setHistory(Array.isArray(r?.items) ? r.items : []); } catch { /* */ }
  };
  const deleteHistory = async (id: string) => { setHistory(prev => prev.filter(h => String(h.id) !== String(id))); try { await api.contentDelete(id); } catch { /* */ } };
  const ensureHistBlob = async (fname: string) => {
    if (!fname || histBlobs[fname]) return;
    try { const url = await api.videoBlobUrl(fname); setHistBlobs(prev => ({ ...prev, [fname]: url })); } catch { /* */ }
  };

  const startPoll = (id: string, projTitle: string) => {
    poll.current && clearInterval(poll.current);
    poll.current = setInterval(async () => {
      try {
        const s = await api.videoStatus(id);
        setJob({ id, status: s.status, step: s.step });
        try { localStorage.setItem(LSKEY, JSON.stringify({ id, status: s.status, title: projTitle })); } catch { /* */ }
        if (s.status === 'done') {
          clearInterval(poll.current);
          const fname = (s.url || '').split('/').pop();
          try { setVideoUrl(await api.videoBlobUrl(fname)); } catch { /* */ }
          try { localStorage.removeItem(LSKEY); } catch { /* */ }
          try { await api.contentSave({ feature: FEATURE, kind: 'video', title: projTitle || 'Video dự án', url: fname, meta: {} }); } catch { /* */ }
          loadHistory();
        } else if (s.status === 'failed') {
          clearInterval(poll.current);
          setErr('Render lỗi: ' + (s.error || ''));
          try { localStorage.removeItem(LSKEY); } catch { /* */ }
        }
      } catch { /* */ }
    }, 8000);
  };

  useEffect(() => {
    api.getProjectsCbx().then((r: any) => {
      const items = r?.items || r?.data?.items || r?.data || [];
      setProjects(Array.isArray(items) ? items : []);
    }).catch(() => setErr('Không tải được danh sách dự án.'));
    loadHistory();
    // Nối lại job dựng video đang chạy dở (không mất khi rời trang)
    try {
      const raw = localStorage.getItem(LSKEY);
      if (raw) {
        const j = JSON.parse(raw);
        if (j?.id && j.status !== 'done' && j.status !== 'failed') {
          setJob({ id: j.id, status: j.status || 'queued' });
          if (j.title) setTitle(j.title);
          startPoll(j.id, j.title || 'Video dự án');
        } else { localStorage.removeItem(LSKEY); }
      }
    } catch { /* */ }
    return () => poll.current && clearInterval(poll.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectProject = (id: string) => {
    setPid(id); setVideoUrl(''); setJob(null);
    const p = projects.find((x: any) => (x.id || x.slug || x.name) === id);
    if (!p) return;
    setTitle(p.name || 'Dự án');
    const imgs = parseImgs(p).slice(0, 6);
    setImages(imgs);
    setCaptions(imgs.map((_, i) => ['Vị trí đắc địa', 'Tiện ích đẳng cấp', 'Thiết kế hiện đại', 'Pháp lý minh bạch', 'Chính sách hấp dẫn', 'Đầu tư sinh lời'][i] || ''));
  };

  const create = async () => {
    if (!images.length) { setErr('Dự án chưa có ảnh để tạo video.'); return; }
    setErr(''); setVideoUrl('');
    try {
      const projTitle = title.trim() || 'Dự án';
      // Trợ lý AI tự viết kịch bản (bám kho tài liệu) + giọng đọc thuyết minh
      let r: any;
      try {
        r = await api.videoPromo({ project: projTitle, images });
        if (r?.error) throw new Error(r.error);
      } catch {
        // dự phòng: dựng bản không thuyết minh
        r = await api.videoRender({ title: projTitle, subtitle: subtitle.trim(), images, captions });
      }
      const id = r?.jobId; if (!id) throw new Error(r?.error || 'Không tạo được video');
      setJob({ id, status: 'queued' });
      try { localStorage.setItem(LSKEY, JSON.stringify({ id, status: 'queued', title: projTitle })); } catch { /* */ }
      startPoll(id, projTitle);
    } catch (e: any) { setErr(e?.message || 'Lỗi'); }
  };
  const busy = job && job.status !== 'done' && job.status !== 'failed';

  return (
    <div className="space-y-5">
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-center gap-2"><Video className="w-5 h-5 text-fuchsia-600" /><span className="font-black text-slate-900">Tạo video dự án (AI dựng từ ảnh thật)</span></div>
      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-black text-slate-500">Dự án</label>
          <select value={pid} onChange={e => selectProject(e.target.value)} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="">— chọn dự án —</option>
            {projects.map((p: any) => <option key={p.id || p.slug || p.name} value={p.id || p.slug || p.name}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-black text-slate-500">Tiêu đề kết (CTA)</label>
          <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
      </div>

      {images.length > 0 && (
        <div>
          <p className="text-xs font-black text-slate-500 mb-2">{images.length} ảnh + caption (sửa được)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {images.map((img, i) => (
              <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl p-2">
                <img src={img} alt="" className="w-14 h-14 object-cover rounded-lg shrink-0" />
                <input value={captions[i] || ''} onChange={e => setCaptions(c => c.map((x, j) => j === i ? e.target.value : x))} placeholder={`Caption ảnh ${i + 1}`} className="flex-1 p-2 rounded-lg border border-slate-200 text-xs" />
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={create} disabled={!images.length || !!busy} className="inline-flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />} Tạo video
      </button>

      {busy && (
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2.5">
          <Loader2 className="w-4 h-4 animate-spin text-fuchsia-600" />
          <span className="font-bold">{job?.step || 'Đang xử lý'}...</span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" /> render CPU ~3-5 phút, cứ để chạy</span>
        </div>
      )}

      {videoUrl && (
        <div className="space-y-2">
          <video src={videoUrl} controls className="w-full rounded-2xl border border-slate-100 bg-black" />
          <a href={videoUrl} download={`${title}.mp4`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700"><Download className="w-4 h-4" /> Tải video</a>
        </div>
      )}

      <p className="text-[11px] text-slate-400 flex items-start gap-1"><Sparkles className="w-3 h-3 mt-0.5 shrink-0" /> Trợ lý AI tự viết kịch bản bám tài liệu dự án + <b>giọng đọc thuyết minh tiếng Việt</b>, dựng trên ảnh thật. Duyệt trước khi đăng.</p>
    </div>

    {/* Lịch sử video đã tạo — bền theo điều hướng */}
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-indigo-600" />
          <span className="font-black text-slate-900">Video đã tạo</span>
          {history.length > 0 && <span className="text-xs font-bold text-slate-400">({history.length})</span>}
        </div>
        <button onClick={loadHistory} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"><RefreshCw className="w-3.5 h-3.5" /> Làm mới</button>
      </div>
      {history.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <HistoryIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold">Chưa có video nào được lưu.</p>
          <p className="text-xs">Video bạn dựng sẽ được lưu tại đây, không mất khi chuyển trang (kể cả khi đang render).</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map(h => {
            const blob = histBlobs[h.url];
            return (
              <div key={h.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black bg-fuchsia-50 text-fuchsia-700"><Video className="w-3.5 h-3.5" />Video</span>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate">{h.title || '(không tiêu đề)'}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{timeAgo(h.ts)}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteHistory(String(h.id))} title="Xoá" className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="mt-2.5">
                  {blob ? (
                    <div className="space-y-2">
                      <video src={blob} controls className="w-full max-w-md rounded-xl border border-slate-100 bg-black" />
                      <a href={blob} download={`${(h.title || 'video').replace(/\s+/g, '-')}.mp4`} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-black text-xs hover:bg-emerald-700"><Download className="w-3.5 h-3.5" /> Tải video</a>
                    </div>
                  ) : (
                    <button onClick={() => ensureHistBlob(h.url)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-fuchsia-200 text-fuchsia-700 font-black text-xs hover:bg-fuchsia-50"><Play className="w-3.5 h-3.5" /> Xem video</button>
                  )}
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

export default VideoFactory;
