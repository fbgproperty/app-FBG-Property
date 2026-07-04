import React, { useEffect, useState } from 'react';
import { History as HistoryIcon, Loader2, RefreshCw, Terminal, MessageCircleQuestion, User, Filter } from 'lucide-react';
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

const fullTime = (ts: any): string => {
  if (!ts) return '';
  let ms: number;
  if (typeof ts === 'number') ms = ts < 1e12 ? ts * 1000 : ts;
  else { const p = Date.parse(String(ts)); if (Number.isNaN(p)) return String(ts); ms = p; }
  return new Date(ms).toLocaleString('vi-VN');
};

type Row = { id?: any; ts?: any; kind?: string; actor?: string; project?: string; input?: string; output?: string };

const KINDS: { key: string; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'command', label: 'Lệnh điều hành' },
  { key: 'ai_ask', label: 'Hỏi trợ lý AI' },
];

const kindMeta = (k?: string) => {
  if (k === 'ai_ask') return { label: 'Hỏi trợ lý AI', Icon: MessageCircleQuestion, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (k === 'command') return { label: 'Lệnh điều hành', Icon: Terminal, cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  return { label: k || 'Hoạt động', Icon: HistoryIcon, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
};

const History: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [kind, setKind] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const res = await api.appHistory(kind, 200);
      setRows(arr(res));
    } catch (e: any) {
      setErr(e?.message || 'Không tải được lịch sử.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [kind]);

  const nq = q.trim().toLowerCase();
  const filtered = nq
    ? rows.filter(r => `${r.input || ''} ${r.output || ''} ${r.actor || ''} ${r.project || ''}`.toLowerCase().includes(nq))
    : rows;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <HistoryIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Lịch sử hoạt động</h1>
            <p className="text-sm text-slate-500">Mọi lệnh điều hành và câu hỏi gửi trợ lý AI đều được lưu lại, tra cứu được.</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm text-sm font-medium disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Làm mới
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="inline-flex items-center gap-1.5 text-slate-400 mr-1"><Filter className="w-4 h-4" /></div>
        {KINDS.map(k => (
          <button key={k.key} onClick={() => setKind(k.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${kind === k.key ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'}`}>
            {k.label}
          </button>
        ))}
        <div className="flex-1 min-w-[180px]" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm trong nội dung…"
          className="px-3.5 py-2 rounded-lg border border-slate-200 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-200" />
      </div>

      {err && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">{err}</div>
      )}

      {loading && rows.length === 0 ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Đang tải lịch sử…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-slate-400">
          <HistoryIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-slate-500">Chưa có hoạt động nào được ghi lại.</p>
          <p className="text-sm">Khi bạn ra lệnh điều hành hoặc hỏi trợ lý AI, chúng sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r, i) => {
            const meta = kindMeta(r.kind);
            const id = String(r.id ?? i);
            const isOpen = !!open[id];
            const preview = (r.input || '').replace(/\s+/g, ' ').trim();
            return (
              <div key={id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all overflow-hidden">
                <button onClick={() => setOpen(s => ({ ...s, [id]: !s[id] }))}
                  className="w-full text-left px-4 py-3 flex items-start gap-3">
                  <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.cls}`}>
                    <meta.Icon className="w-3.5 h-3.5" /> {meta.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm text-slate-800 ${isOpen ? '' : 'truncate'}`}>{preview || <span className="text-slate-400 italic">(trống)</span>}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                      {r.actor && <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />{r.actor}</span>}
                      {r.project && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{r.project}</span>}
                      <span title={fullTime(r.ts)}>{timeAgo(r.ts)}</span>
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3">
                    {r.input && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Yêu cầu</p>
                        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 rounded-lg p-3">{r.input}</pre>
                      </div>
                    )}
                    {r.output && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Kết quả</p>
                        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans bg-emerald-50/60 rounded-lg p-3">{r.output}</pre>
                      </div>
                    )}
                    <p className="text-xs text-slate-400">{fullTime(r.ts)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-center text-xs text-slate-400 mt-6">Hiển thị {filtered.length} hoạt động gần nhất{nq ? ` (lọc theo "${q}")` : ''}.</p>
      )}
    </div>
  );
};

export default History;
