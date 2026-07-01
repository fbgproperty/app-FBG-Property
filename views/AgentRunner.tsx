import React, { useState } from 'react';
import { Loader2, X, Copy, Check, Sparkles, Send } from 'lucide-react';
import { api } from '../services/apiService';

interface AgentRunnerProps {
  agent: { n: string; role: string };
  onClose: () => void;
}

const SUGGESTIONS = [
  'Cho dự án Sun Symphony Residences',
  'Tổng quan tuần này',
  'Đề xuất hành động',
];

const AgentRunner: React.FC<AgentRunnerProps> = ({ agent, onClose }) => {
  const [message, setMessage] = useState(
    `Thực hiện nhiệm vụ: ${agent.role}. Trình bày ngắn gọn, thực chiến.`
  );
  const [running, setRunning] = useState(false);
  const [reply, setReply] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const addSuggestion = (s: string) => {
    setMessage(prev => (prev.trim() ? `${prev.trim()} ${s}` : s));
  };

  const run = async () => {
    if (!message.trim()) return;
    setRunning(true);
    setError('');
    setReply('');
    try {
      const res = await api.agentRun({ agent: agent.n, role: agent.role, message: message.trim() });
      setReply(res?.reply || 'Chuyên viên AI chưa trả về nội dung. Vui lòng thử lại.');
    } catch {
      setError('Chuyên viên AI đang bận hoặc mất kết nối. Vui lòng thử lại sau ít phút.');
    } finally {
      setRunning(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* */ }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 leading-tight truncate">{agent.n}</h3>
              <p className="text-slate-500 text-sm truncate">{agent.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Giao việc cho chuyên viên
            </label>

            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSuggestion(s)}
                  disabled={running}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition disabled:opacity-50"
                >
                  + {s}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              disabled={running}
              placeholder="Mô tả nhiệm vụ bạn muốn chuyên viên AI thực hiện…"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium
                        focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition resize-y disabled:opacity-60"
            />
          </div>

          <button
            onClick={run}
            disabled={running || !message.trim()}
            className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700
                      transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2
                      disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {running ? 'Chuyên viên AI đang xử lý…' : 'Giao việc'}
          </button>

          {running && (
            <div className="flex items-center justify-center gap-2 text-indigo-600 text-sm font-bold py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chuyên viên AI đang xử lý…
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm font-bold rounded-xl p-4">
              {error}
            </div>
          )}

          {reply && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Kết quả từ chuyên viên AI
                </span>
                <button
                  onClick={copy}
                  className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {reply}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentRunner;
