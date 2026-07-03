import React, { useEffect, useRef, useState } from 'react';
import {
  UserSquare, Loader2, Sparkles, Copy, Check, Save, MessageCircle,
  FileText, Video, Download, Wand2, ImageDown, Film
} from 'lucide-react';
import { api } from '../services/apiService';

// Trích ảnh dự án (giống hệ video sẵn có)
const parseImgs = (p: any): string[] => {
  let raw = p?.imagesJson ?? p?.images ?? [];
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = [raw]; } }
  return (Array.isArray(raw) ? raw : []).filter((x: any) => typeof x === 'string' && /^https?:\/\//.test(x));
};

type Sale = { email: string; name: string; role: string; hasPhoto: boolean; persona: string };
type Kind = 'message' | 'post' | 'video';

const KINDS: { id: Kind; label: string; icon: any }[] = [
  { id: 'message', label: 'Tin nhắn Zalo', icon: MessageCircle },
  { id: 'post', label: 'Bài đăng', icon: FileText },
  { id: 'video', label: 'Kịch bản video', icon: Video },
];

const initials = (name: string): string =>
  (name || '?').trim().split(/\s+/).slice(-2).map(w => w[0] || '').join('').toUpperCase() || '?';

const SalePersonalize: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [selected, setSelected] = useState<string>('');

  const [persona, setPersona] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const [kind, setKind] = useState<Kind>('message');
  const [project, setProject] = useState('');
  const [customer, setCustomer] = useState('');
  const [note, setNote] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ==== Video cá nhân hoá (dùng hệ video sẵn có) ====
  const [vidProjects, setVidProjects] = useState<any[]>([]);
  const [vidPid, setVidPid] = useState('');
  const [vidJob, setVidJob] = useState<{ id: string; status: string; step?: string } | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [vidErr, setVidErr] = useState('');
  const vidPoll = useRef<any>(null);

  const sale = sales.find(s => s?.email === selected) || null;

  // ==== Load personas on mount ====
  useEffect(() => {
    (async () => {
      try {
        const r = await api.salePersonas();
        const items = Array.isArray(r?.items) ? r.items : [];
        setSales(items);
        if (items.length) setSelected(items[0].email);
      } catch {
        setSales([]);
      } finally {
        setLoadingSales(false);
      }
    })();
  }, []);

  // ==== Sync persona textarea when selected sale changes ====
  useEffect(() => {
    if (sale) setPersona(sale.persona || '');
    setResult('');
    setErr('');
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(''), 1800); };

  const suggestPersona = async () => {
    if (!sale) return;
    setSuggesting(true); setErr('');
    try {
      const r = await api.salePersonaSuggest(sale.email);
      if (r?.persona) setPersona(r.persona);
    } catch {
      setErr('Trợ lý AI đang bận, thử lại sau ít phút.');
    } finally {
      setSuggesting(false);
    }
  };

  const savePersona = async () => {
    if (!sale) return;
    setSaving(true); setErr('');
    try {
      await api.salePersonaSet(sale.email, persona);
      setSales(prev => prev.map(s => s.email === sale.email ? { ...s, persona } : s));
      showToast('Đã lưu');
    } catch {
      setErr('Không lưu được tính cách. Thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const generate = async () => {
    if (!sale) return;
    setGenerating(true); setErr(''); setResult('');
    try {
      const r = await api.salePersonalize({ email: sale.email, kind, project, customer, note });
      setResult((r?.text || '').toString());
    } catch {
      setErr('Trợ lý AI đang bận hoặc mất kết nối. Thử lại sau.');
    } finally {
      setGenerating(false);
    }
  };

  const copyResult = () => {
    try {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* */ }
  };

  // ==== Load dự án cho video + dọn dẹp poll ====
  useEffect(() => {
    api.getProjectsCbx().then((r: any) => {
      const items = r?.items || r?.data?.items || r?.data || [];
      setVidProjects(Array.isArray(items) ? items : []);
    }).catch(() => setVidErr('Không tải được danh sách dự án.'));
    return () => { vidPoll.current && clearInterval(vidPoll.current); };
  }, []);

  const vidBusy = !!(vidJob && vidJob.status !== 'done' && vidJob.status !== 'failed');

  const createVideo = async () => {
    if (!sale) return;
    setVidErr(''); setVideoUrl('');
    const project = vidProjects.find((x: any) => (x?.id || x?.slug || x?.name) === vidPid) || null;
    const projImgs = parseImgs(project).slice(0, 5);
    const salePhoto = api.salePhotoUrl(sale.email);
    // Ảnh sale là frame ĐẦU; nếu dự án chưa có ảnh vẫn dựng được (lặp ảnh sale)
    const images = projImgs.length ? [salePhoto, ...projImgs] : [salePhoto, salePhoto];
    const captions = [
      'Chào bạn, mình là ' + (sale.name || '') + ' — FBG Property',
      ...projImgs.map((_, i) => ['Vị trí đắc địa', 'Tiện ích đẳng cấp', 'Thiết kế hiện đại', 'Pháp lý minh bạch', 'Chính sách hấp dẫn'][i] || ''),
    ];
    try {
      const r = await api.videoRender({ title: project?.name || 'Dự án', subtitle: sale.name, images, captions });
      const id = r?.jobId; if (!id) throw new Error('Không tạo được video');
      setVidJob({ id, status: 'queued' });
      vidPoll.current && clearInterval(vidPoll.current);
      vidPoll.current = setInterval(async () => {
        try {
          const s = await api.videoStatus(id);
          setVidJob({ id, status: s.status, step: s.step });
          if (s.status === 'done') {
            clearInterval(vidPoll.current);
            const url = await api.videoBlobUrl((s.url || '').split('/').pop());
            setVideoUrl(url);
          } else if (s.status === 'failed') {
            clearInterval(vidPoll.current);
            setVidErr('Dựng video chưa xong, thử lại sau ít phút.');
          }
        } catch { /* */ }
      }, 3000);
    } catch (e: any) {
      setVidErr(e?.message || 'Không dựng được video. Thử lại.');
    }
  };

  // ==== Canvas share card ====
  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width, H = canvas.height;

    // Gradient background (indigo → fuchsia)
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#4f46e5');
    g.addColorStop(1, '#c026d3');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Soft decorative circles
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(W * 0.9, H * 0.12, 220, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W * 0.08, H * 0.92, 260, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const cx = W / 2;
    const avatarY = H * 0.30;
    const avatarR = W * 0.16;

    const drawText = () => {
      ctx.textAlign = 'center';

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(W * 0.062)}px system-ui, -apple-system, Arial, sans-serif`;
      ctx.fillText(sale?.name || 'Chuyên viên', cx, avatarY + avatarR + W * 0.10);

      // Role
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `600 ${Math.round(W * 0.032)}px system-ui, -apple-system, Arial, sans-serif`;
      ctx.fillText(sale?.role || 'Chuyên viên bất động sản', cx, avatarY + avatarR + W * 0.152);

      // Headline: project + greeting
      const proj = (project || '').trim();
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${Math.round(W * 0.040)}px system-ui, -apple-system, Arial, sans-serif`;
      const headline = proj ? `Đồng hành cùng bạn tại ${proj}` : 'Đồng hành cùng bạn trên mọi hành trình';
      // wrap headline
      const maxW = W * 0.82;
      const words = headline.split(' ');
      const lines: string[] = [];
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
        else line = test;
      }
      if (line) lines.push(line);
      const startY = avatarY + avatarR + W * 0.24;
      const lh = W * 0.052;
      lines.forEach((ln, i) => ctx.fillText(ln, cx, startY + i * lh));

      // Brand footer
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `800 ${Math.round(W * 0.026)}px system-ui, -apple-system, Arial, sans-serif`;
      ctx.fillText('FBG Property', cx, H - W * 0.05);
    };

    const drawPlaceholderAvatar = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, avatarY, avatarR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fill();
      ctx.lineWidth = W * 0.012;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.stroke();
      ctx.clip();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${Math.round(avatarR * 0.9)}px system-ui, -apple-system, Arial, sans-serif`;
      ctx.fillText(initials(sale?.name || ''), cx, avatarY);
      ctx.restore();
      ctx.textBaseline = 'alphabetic';
      drawText();
    };

    if (!sale) { drawPlaceholderAvatar(); return; }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, avatarY, avatarR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      // cover-fit the photo into the circle
      const size = avatarR * 2;
      const ratio = Math.max(size / img.width, size / img.height);
      const dw = img.width * ratio, dh = img.height * ratio;
      ctx.drawImage(img, cx - dw / 2, avatarY - dh / 2, dw, dh);
      ctx.restore();
      // ring
      ctx.beginPath();
      ctx.arc(cx, avatarY, avatarR, 0, Math.PI * 2);
      ctx.lineWidth = W * 0.012;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.stroke();
      drawText();
    };
    img.onerror = () => drawPlaceholderAvatar();
    img.src = api.salePhotoUrl(sale.email);
  };

  useEffect(() => { drawCard(); }, [selected, project]); // eslint-disable-line react-hooks/exhaustive-deps

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `card-${(sale?.name || 'sale').replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      setErr('Không tải được ảnh card. Thử lại.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-gradient-to-br from-fuchsia-600 to-indigo-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <UserSquare className="w-5 h-5" />
          <span className="font-black text-lg">Cá nhân hoá theo Sale (Trợ lý AI)</span>
        </div>
        <p className="text-sm opacity-90">Dùng ảnh thật + tính cách của sale để chăm khách như chính họ.</p>
      </div>

      {/* Chọn sale */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Chọn sale</p>
        {loadingSales ? (
          <div className="flex justify-center py-6 text-indigo-600"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : sales.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-sm font-semibold">
            Chưa có sale nào. Hãy thêm hồ sơ sale để bắt đầu cá nhân hoá.
          </div>
        ) : (
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {sales.map(s => {
              const active = s.email === selected;
              return (
                <button
                  key={s.email}
                  onClick={() => setSelected(s.email)}
                  className={`flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full border-2 whitespace-nowrap transition shrink-0 ${active ? 'border-fuchsia-600 bg-fuchsia-50' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <span className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                    {s.hasPhoto ? (
                      <img
                        src={api.salePhotoUrl(s.email)}
                        crossOrigin="anonymous"
                        alt={s.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-[11px] font-black text-slate-500">{initials(s.name)}</span>
                    )}
                  </span>
                  <span className={`text-sm font-black ${active ? 'text-fuchsia-700' : 'text-slate-600'}`}>{s.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {sale && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Cột trái — Hồ sơ sale */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                {sale.hasPhoto ? (
                  <img
                    src={api.salePhotoUrl(sale.email)}
                    crossOrigin="anonymous"
                    alt={sale.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <span className="text-xl font-black text-slate-400">{initials(sale.name)}</span>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-900 leading-tight truncate">{sale.name}</h3>
                <p className="text-sm text-slate-500 truncate">{sale.role || 'Chuyên viên bất động sản'}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500">Tính cách & giọng</label>
              <textarea
                value={persona}
                onChange={e => setPersona(e.target.value)}
                rows={7}
                placeholder="vd: thân thiện, nhiệt tình, hay dùng emoji, xưng em – gọi anh/chị, chốt nhanh gọn..."
                className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-sm leading-relaxed focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-500 outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={suggestPersona}
                disabled={suggesting}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 font-black text-sm hover:bg-indigo-50 disabled:opacity-60"
              >
                {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Gợi ý bằng Trợ lý AI
              </button>
              <button
                onClick={savePersona}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu tính cách
              </button>
            </div>
            {suggesting && <p className="text-[12px] font-bold text-indigo-600">Trợ lý AI đang phác hoạ tính cách…</p>}
            {toast && <p className="text-[12px] font-black text-emerald-600">{toast}</p>}
          </div>

          {/* Cột phải — Tạo nội dung cá nhân hoá */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fuchsia-600" />
              <span className="font-black text-slate-900">Tạo nội dung cá nhân hoá</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {KINDS.map(k => {
                const active = k.id === kind; const Icon = k.icon;
                return (
                  <button
                    key={k.id}
                    onClick={() => setKind(k.id)}
                    className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 font-black text-[11px] transition ${active ? 'border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  >
                    <Icon className="w-4 h-4" />{k.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-xs font-black text-slate-500">Dự án</label>
                <input value={project} onChange={e => setProject(e.target.value)} placeholder="vd: Sun Symphony Residences" className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-500">Tên khách (tuỳ chọn)</label>
                  <input value={customer} onChange={e => setCustomer(e.target.value)} placeholder="vd: anh Minh" className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500">Yêu cầu thêm (tuỳ chọn)</label>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="vd: nhấn chính sách chiết khấu" className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
                </div>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={generating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tạo nội dung
            </button>

            {generating && (
              <div className="flex items-center gap-2 text-fuchsia-600 text-sm font-bold">
                <Loader2 className="w-4 h-4 animate-spin" /> Trợ lý AI đang viết theo giọng {sale.name}…
              </div>
            )}
            {err && <p className="text-[12px] font-bold text-amber-600">{err}</p>}

            {result && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Kết quả</span>
                  <button onClick={copyResult} className="inline-flex items-center gap-1 text-xs font-black text-fuchsia-600 hover:underline">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Đã copy' : 'Copy'}
                  </button>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{result}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video cá nhân hoá — dùng hệ video sẵn có */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-fuchsia-600" />
            <span className="font-black text-slate-900">Video cá nhân hoá (dùng ảnh thật của sale)</span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mở đầu bằng mặt sale → ảnh dự án → lời chào giọng sale. Dựng bằng hệ video sẵn có.
          </p>
        </div>

        {!sale ? (
          <div className="text-sm font-semibold text-slate-400 bg-slate-50 rounded-xl px-3 py-3">
            Chọn một sale ở trên trước.
          </div>
        ) : (
          <>
            {vidErr && <p className="text-[12px] font-bold text-amber-600">{vidErr}</p>}

            <div>
              <label className="text-xs font-black text-slate-500">Dự án</label>
              <select
                value={vidPid}
                onChange={e => { setVidPid(e.target.value); setVideoUrl(''); setVidJob(null); setVidErr(''); }}
                className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm"
              >
                <option value="">— chọn dự án —</option>
                {vidProjects.map((p: any) => (
                  <option key={p?.id || p?.slug || p?.name} value={p?.id || p?.slug || p?.name}>{p?.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={createVideo}
              disabled={vidBusy}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60"
            >
              {vidBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />} Tạo video cá nhân hoá
            </button>

            {vidBusy && (
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-fuchsia-600" />
                <span className="font-bold">Đang dựng video… (có thể mất 1–2 phút)</span>
              </div>
            )}

            {videoUrl && (
              <div className="space-y-2">
                <video src={videoUrl} controls className="w-full rounded-2xl border border-slate-100 bg-black" />
                <a
                  href={videoUrl}
                  download={`video-${(sale.name || 'sale').replace(/\s+/g, '-')}.mp4`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700"
                >
                  <Download className="w-4 h-4" /> Tải video
                </a>
              </div>
            )}

            <p className="text-[11px] text-slate-400">
              Video mở đầu bằng ảnh thật của sale, tiếp nối bằng ảnh dự án — dựng bằng hệ video sẵn có. Duyệt trước khi gửi khách.
            </p>
          </>
        )}
      </div>

      {/* Ảnh card cá nhân hoá */}
      {sale && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ImageDown className="w-5 h-5 text-indigo-600" />
              <span className="font-black text-slate-900">Ảnh card cá nhân hoá</span>
            </div>
            <button
              onClick={downloadCard}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700"
            >
              <Download className="w-4 h-4" /> Tải ảnh card
            </button>
          </div>
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={1080}
              height={1080}
              className="w-full max-w-[420px] rounded-2xl border border-slate-100 shadow-sm"
            />
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-3">
            Card tự cập nhật khi đổi sale hoặc tên dự án. Dùng ảnh thật của sale để khách thấy gần gũi.
          </p>
        </div>
      )}
    </div>
  );
};

export default SalePersonalize;
