import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Send, Loader2, ArrowRight, Wand2, MessageSquare, Building2,
} from 'lucide-react';
import { api } from '../services/apiService';

type Intent = 'deploy' | 'report' | 'leads' | 'dossier' | 'content' | 'unknown' | string;

interface CmdResult {
  intent: Intent;
  project?: string;
  reply: string;
}

interface HistItem {
  text: string;
  reply: string;
  intent: Intent;
  project?: string;
}

// Ánh xạ ý định → hành động điều hướng
const NAV_MAP: Record<string, { label: string; to: string }> = {
  deploy: { label: 'Mở Triển khai dự án', to: '/san-bds' },
  report: { label: 'Mở Báo cáo', to: '/bao-cao' },
  leads: { label: 'Mở Kinh doanh', to: '/kinh-doanh' },
  dossier: { label: 'Mở Sàn BĐS', to: '/san-bds' },
  content: { label: 'Mở Marketing', to: '/marketing' },
};

const EXAMPLES = [
  'Triển khai dự án Sun Symphony',
  'Báo cáo tổng tuần này',
  'Khách nào đang nóng',
  'Hồ sơ dự án Cora Tower',
];

const CommandBar: React.FC = () => {
  const nav = useNavigate();
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CmdResult | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistItem[]>([]);

  const submit = async () => {
    const q = text.trim();
    if (!q || running) return;
    setRunning(true);
    setError('');
    setResult(null);
    try {
      const r = await api.assistantCommand(q);
      const res: CmdResult = {
        intent: r?.intent || 'unknown',
        project: r?.project,
        reply: r?.reply || '',
      };
      setResult(res);
      setHistory(prev => [
        { text: q, reply: res.reply, intent: res.intent, project: res.project },
        ...prev,
      ].slice(0, 3));
    } catch (e: any) {
      setError('Không kết nối được Trợ lý AI. Thử lại sau ít phút.');
    } finally {
      setRunning(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const nAction = result ? NAV_MAP[result.intent] : undefined;
  const isUnknown = result && result.intent === 'unknown';

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-lg">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
          <Wand2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-black leading-none">Ra lệnh bằng hội thoại</h3>
          <p className="text-sm text-white/80 font-semibold mt-1">Gõ điều bạn muốn — Trợ lý AI hiểu và mở đúng nơi.</p>
        </div>
      </div>

      {/* Ô nhập lệnh */}
      <div className="mt-4 flex items-center gap-2 bg-white rounded-2xl p-2 shadow-inner">
        <Sparkles className="w-5 h-5 text-indigo-500 ml-2 shrink-0" />
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={running}
          placeholder="Ví dụ: Triển khai dự án Sun Symphony…"
          className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm font-semibold outline-none px-1 py-1.5 disabled:opacity-60"
        />
        <button
          onClick={submit}
          disabled={running || !text.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition disabled:opacity-50 shrink-0"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Ra lệnh
        </button>
      </div>

      {/* Gợi ý mẫu */}
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {EXAMPLES.map(ex => (
          <button
            key={ex}
            onClick={() => setText(ex)}
            disabled={running}
            className="text-[11px] font-bold text-white/90 bg-white/10 hover:bg-white/20 rounded-lg px-2.5 py-1 transition disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Lỗi */}
      {error && (
        <div className="mt-4 text-sm font-bold text-white bg-rose-500/30 rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Phản hồi Trợ lý AI */}
      {result && (
        <div className="mt-4 bg-white rounded-2xl p-4 text-slate-800">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1">Trợ lý AI</div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {result.reply || (isUnknown ? 'Chưa rõ lệnh, thử diễn đạt khác.' : '')}
              </p>

              {result.project && (
                <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-black bg-emerald-50 text-emerald-700 rounded-lg px-2.5 py-1">
                  <Building2 className="w-3.5 h-3.5" /> Dự án: {result.project}
                </span>
              )}

              {isUnknown && !result.reply && (
                <p className="text-[12px] text-slate-400 font-semibold mt-1">Chưa rõ lệnh, thử diễn đạt khác.</p>
              )}

              {nAction && (
                <div className="mt-3">
                  <button
                    onClick={() => nav(nAction.to)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition"
                  >
                    {nAction.label} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lịch sử gần đây (tối đa 3) */}
      {history.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] font-black text-white/70 uppercase tracking-wider mb-2 pl-1">Lệnh gần đây</div>
          <div className="space-y-1.5">
            {history.map((h, i) => (
              <div key={i} className="bg-white/10 rounded-xl px-3 py-2">
                <div className="text-[12px] font-black text-white truncate">{h.text}</div>
                {h.reply && <div className="text-[11px] text-white/70 font-semibold truncate mt-0.5">{h.reply}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandBar;
