import React, { useEffect, useState } from 'react';
import { Radar, Loader2, RefreshCw, AlertTriangle, ExternalLink, Trash2, Plus, Radio, Eye, Clock } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);

/** "2 giờ trước" từ mốc thời gian (unix giây, mili giây, hoặc chuỗi ISO). */
const timeAgo = (ts: any): string => {
  if (!ts) return '';
  let ms: number;
  if (typeof ts === 'number') ms = ts < 1e12 ? ts * 1000 : ts;
  else { const p = Date.parse(String(ts)); if (Number.isNaN(p)) return String(ts); ms = p; }
  const diff = Date.now() - ms;
  if (diff < 0) return 'vừa xong';
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'vừa xong';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(ms).toLocaleDateString('vi-VN');
};

const MarketRadar: React.FC = () => {
  const [signals, setSignals] = useState<any[]>([]);
  const [watches, setWatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const [sg, wt] = await Promise.all([api.marketSignals(), api.marketWatches()]);
      setSignals(arr(sg));
      setWatches(arr(wt));
    } catch (e: any) {
      setErr(e?.message || 'Không tải được dữ liệu Radar thị trường.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const addWatch = async () => {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) { setErr('Đường dẫn nguồn phải bắt đầu bằng http:// hoặc https://'); return; }
    setErr(''); setAdding(true);
    try {
      await api.marketAddWatch(u, title.trim());
      setUrl(''); setTitle('');
      const wt = await api.marketWatches();
      setWatches(arr(wt));
    } catch (e: any) {
      setErr(e?.message || 'Thêm nguồn thất bại.');
    }
    setAdding(false);
  };

  const delWatch = async (id: string) => {
    setErr('');
    try {
      await api.marketDelWatch(id);
      const wt = await api.marketWatches();
      setWatches(arr(wt));
    } catch (e: any) {
      setErr(e?.message || 'Gỡ nguồn thất bại.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1"><Radar className="w-5 h-5" /><span className="font-black">Radar thị trường</span></div>
            <p className="text-sm opacity-90 max-w-2xl">Tự động theo dõi biến động dự án, giá và tin tức bất động sản công khai — báo về ngay khi thị trường có thay đổi, để đội bán hàng phản ứng sớm hơn đối thủ.</p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl font-black text-sm disabled:opacity-60 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Làm mới
          </button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}

      {/* Section 1 — Signals */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-fuchsia-600" />
          <span className="font-black text-slate-900 text-sm flex-1">Tín hiệu mới nhất</span>
          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-fuchsia-50 text-fuchsia-600">{signals.length}</span>
        </div>

        {loading && signals.length === 0 ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải tín hiệu…</div>
        ) : signals.length === 0 ? (
          <div className="text-center py-8">
            <Radar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-semibold">Chưa có tín hiệu mới. Hệ thống sẽ báo ngay khi thị trường có biến động.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((s: any) => (
              <div key={s.id} className="rounded-2xl border border-slate-100 p-4 hover:border-indigo-200 transition">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="font-black text-slate-900 text-sm min-w-0 flex-1">{s.title || 'Biến động thị trường'}</div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 shrink-0"><Clock className="w-3 h-3" />{timeAgo(s.ts)}</span>
                </div>
                {s.text && <p className="text-[13px] text-slate-600 leading-relaxed mt-1.5 whitespace-pre-wrap">{s.text}</p>}
                {s.url && (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-indigo-600 hover:text-indigo-700 mt-2 break-all">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Xem nguồn
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2 — Watches */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-indigo-600" />
          <span className="font-black text-slate-900 text-sm flex-1">Nguồn đang theo dõi</span>
          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">{watches.length}</span>
        </div>

        {/* Add row */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-2 mb-4">
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Đường dẫn nguồn (https://…)" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm" />
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên gợi nhớ (tuỳ chọn)" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm" />
          <button onClick={addWatch} disabled={adding} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm nguồn
          </button>
        </div>

        {watches.length === 0 ? (
          <p className="text-[12px] text-slate-400 py-2">Chưa theo dõi nguồn nào. Thêm một trang công khai để bắt đầu nhận tín hiệu.</p>
        ) : (
          <div className="divide-y divide-slate-50 -mx-1">
            {watches.map((w: any) => (
              <div key={w.id} className="flex items-center gap-3 px-1 py-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                    {w.title || w.url}
                    {w.paused && <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Tạm dừng</span>}
                  </div>
                  {w.url && (
                    <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-indigo-500 hover:text-indigo-600 break-all inline-flex items-center gap-1">
                      <ExternalLink className="w-3 h-3 shrink-0" />{w.url}
                    </a>
                  )}
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {w.lastChecked ? `Kiểm tra lần cuối: ${timeAgo(w.lastChecked)}` : 'Chưa kiểm tra'}
                    {w.lastChanged ? ` · Thay đổi: ${timeAgo(w.lastChanged)}` : ''}
                  </div>
                </div>
                <button onClick={() => delWatch(w.id)} title="Gỡ nguồn" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketRadar;
