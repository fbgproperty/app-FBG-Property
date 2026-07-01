import React, { useEffect, useState } from 'react';
import { CalendarDays, Loader2, Sparkles, Copy, Check, FileText } from 'lucide-react';
import { api } from '../services/apiService';

const CHANNEL_STYLE: Record<string, string> = {
  'Bài viết': 'bg-indigo-100 text-indigo-700',
  'Hình ảnh': 'bg-fuchsia-100 text-fuchsia-700',
  'Video ngắn': 'bg-rose-100 text-rose-700',
  'Tin nhắn': 'bg-emerald-100 text-emerald-700',
};

const ContentCalendar: React.FC = () => {
  const [projects, setProjects] = useState<{ name: string }[]>([]);
  const [project, setProject] = useState('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.getDeployProjects();
        const items = Array.isArray(r?.items) ? r.items : [];
        setProjects(items);
        if (items.length) setProject(items[0]?.name || '');
      } catch { /* */ }
    })();
  }, []);

  const run = async () => {
    if (!project) return;
    setLoading(true); setRes(null);
    try { setRes(await api.contentCalendar(project, days)); } catch { /* */ }
    setLoading(false);
  };

  const items = Array.isArray(res?.items) ? res.items : [];

  const copyAll = () => {
    const text = [
      `Lịch nội dung — ${res?.project || project} (${Number(res?.days) || days} ngày)`,
      '',
      ...items.map((it: any) => `Ngày ${Number(it?.day) || 0} · ${it?.channel || ''}\n${it?.title || ''}\n${it?.angle || ''}\n`),
    ].join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><CalendarDays className="w-5 h-5" /><span className="font-black">Lịch nội dung đa kênh (Trợ lý AI)</span></div>
        <p className="text-sm opacity-90">Chọn dự án và số ngày, Trợ lý AI sẽ lên lịch nội dung đa kênh — bài viết, hình ảnh, video ngắn, tin nhắn — bám tài liệu dự án, sẵn sàng để duyệt và triển khai.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Dự án</label>
            <select value={project} onChange={e => setProject(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {projects.length === 0 && <option value="">Chưa có dự án</option>}
              {projects.map((p, i) => <option key={i} value={p?.name || ''}>{p?.name || ''}</option>)}
            </select>
          </div>
          <div className="md:w-40">
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Số ngày</label>
            <select value={days} onChange={e => setDays(Number(e.target.value) || 7)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value={7}>7 ngày</option>
              <option value={14}>14 ngày</option>
            </select>
          </div>
          <button onClick={run} disabled={loading || !project} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm bg-fuchsia-600 text-white shadow hover:bg-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Lập lịch nội dung
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-600">
          <Loader2 className="w-9 h-9 animate-spin mb-3" />
          <p className="font-bold text-sm">Trợ lý AI đang lên lịch…</p>
        </div>
      )}

      {!loading && res && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-[12px] font-black text-slate-500">
              <FileText className="w-4 h-4 text-indigo-500" /> nguồn tài liệu: {Number(res?.sources) || 0}
            </div>
            <button onClick={copyAll} disabled={items.length === 0} className="inline-flex items-center gap-1.5 text-[12px] font-black bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700 disabled:opacity-50">
              {copied ? <><Check className="w-3.5 h-3.5" /> Đã chép</> : <><Copy className="w-3.5 h-3.5" /> Chép toàn bộ lịch</>}
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-slate-400 bg-white rounded-2xl border border-slate-100 p-5">Chưa có nội dung. Hãy thử lập lịch lại.</p>
          ) : (
            <div className="space-y-3">
              {items.map((it: any, i: number) => {
                const ch = it?.channel || '';
                return (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-4">
                    <div className="shrink-0 w-14 text-center">
                      <span className="inline-block text-[10px] font-black text-slate-400 uppercase tracking-wider">Ngày</span>
                      <p className="text-2xl font-black text-slate-900 leading-none">{Number(it?.day) || 0}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md mb-1.5 ${CHANNEL_STYLE[ch] || 'bg-slate-100 text-slate-600'}`}>{ch || 'Nội dung'}</span>
                      <p className="font-bold text-slate-900 leading-snug">{it?.title || ''}</p>
                      <p className="text-[13px] text-slate-500 mt-1 leading-snug">{it?.angle || ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentCalendar;
