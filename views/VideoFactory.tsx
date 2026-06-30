import React, { useEffect, useRef, useState } from 'react';
import { Video, Loader2, Film, Download, Sparkles, AlertTriangle, Clock } from 'lucide-react';
import { api } from '../services/apiService';

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

  useEffect(() => {
    api.getProjectsCbx().then((r: any) => {
      const items = r?.items || r?.data?.items || r?.data || [];
      setProjects(Array.isArray(items) ? items : []);
    }).catch(() => setErr('Không tải được danh sách dự án.'));
    return () => poll.current && clearInterval(poll.current);
  }, []);

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
      const r = await api.videoRender({ title: title.trim() || 'Dự án', subtitle: subtitle.trim(), images, captions });
      const id = r?.jobId; if (!id) throw new Error('Không tạo được job');
      setJob({ id, status: 'queued' });
      poll.current && clearInterval(poll.current);
      poll.current = setInterval(async () => {
        try {
          const s = await api.videoStatus(id);
          setJob({ id, status: s.status, step: s.step });
          if (s.status === 'done') {
            clearInterval(poll.current);
            const url = await api.videoBlobUrl(s.url.split('/').pop());
            setVideoUrl(url);
          } else if (s.status === 'failed') { clearInterval(poll.current); setErr('Render lỗi: ' + (s.error || '')); }
        } catch { /* */ }
      }, 8000);
    } catch (e: any) { setErr(e?.message || 'Lỗi'); }
  };
  const busy = job && job.status !== 'done' && job.status !== 'failed';

  return (
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

      <p className="text-[11px] text-slate-400 flex items-start gap-1"><Sparkles className="w-3 h-3 mt-0.5 shrink-0" /> Video dựng từ ảnh THẬT của dự án (Ken Burns) + tiêu đề + nhạc — không tốn phí AI. Duyệt trước khi đăng.</p>
    </div>
  );
};

export default VideoFactory;
