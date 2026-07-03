import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Wand2, MessageSquare, CheckCircle2 } from 'lucide-react';
import { api } from '../services/apiService';

interface Step { tool: string; args: any; result: string }
interface Result { reply: string; steps: Step[] }
interface HistItem { text: string; reply: string; steps: number }

const TOOL_LABEL: Record<string, string> = {
  trien_khai_du_an: 'Triển khai dự án',
  khach_nong: 'Lấy khách nóng',
  chay_skill: 'Chạy kỹ năng',
  danh_sach_skill: 'Xem danh sách kỹ năng',
  bao_cao_dieu_hanh: 'Bản tin điều hành',
  ho_so_du_an: 'Hồ sơ dự án',
  tong_hop_crm: 'Tổng hợp CRM',
  bat_tat_workflow: 'Bật/tắt tự động hoá',
};

const EXAMPLES = [
  'Triển khai dự án Sun Symphony rồi cho tôi khách nóng nhất',
  'Bản tin điều hành + tình hình CRM',
  'Soạn tin chăm khách nguội cho dự án Cora Tower',
  'Bật workflow chấm điểm lead',
];

const CommandBar: React.FC = () => {
  const [text, setText] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistItem[]>([]);

  const submit = async () => {
    const q = text.trim();
    if (!q || running) return;
    setRunning(true); setError(''); setResult(null);
    try {
      const r = await api.commandOrchestrate(q);
      const res: Result = { reply: r?.reply || '', steps: Array.isArray(r?.steps) ? r.steps : [] };
      setResult(res);
      setHistory(prev => [{ text: q, reply: res.reply, steps: res.steps.length }, ...prev].slice(0, 3));
      setText('');
    } catch {
      setError('Tổng chỉ huy chưa xử lý được. Thử lại sau ít phút.');
    } finally { setRunning(false); }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-lg">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center shrink-0"><Wand2 className="w-5 h-5" /></div>
        <div>
          <h3 className="text-xl font-black leading-none">Tổng chỉ huy</h3>
          <p className="text-sm text-white/80 font-semibold mt-1">Gõ điều bạn muốn — Trợ lý AI tự làm bằng công cụ thật rồi báo kết quả.</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 bg-white rounded-2xl p-2 shadow-inner">
        <Sparkles className="w-5 h-5 text-indigo-500 ml-2 shrink-0" />
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={onKeyDown} disabled={running}
          placeholder="Ví dụ: Triển khai dự án Sun Symphony rồi báo khách nóng…"
          className="flex-1 bg-transparent text-slate-800 placeholder-slate-400 text-sm font-semibold outline-none px-1 py-1.5 disabled:opacity-60" />
        <button onClick={submit} disabled={running || !text.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition disabled:opacity-50 shrink-0">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Ra lệnh
        </button>
      </div>

      {running && <div className="mt-3 text-[12px] text-white/80 font-bold flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Tổng chỉ huy đang lập kế hoạch & thực thi…</div>}

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {EXAMPLES.map(ex => (
          <button key={ex} onClick={() => setText(ex)} disabled={running}
            className="text-[11px] font-bold text-white/90 bg-white/10 hover:bg-white/20 rounded-lg px-2.5 py-1 transition disabled:opacity-50">{ex}</button>
        ))}
      </div>

      {error && <div className="mt-4 text-sm font-bold text-white bg-rose-500/30 rounded-xl px-4 py-3">{error}</div>}

      {result && (
        <div className="mt-4 bg-white rounded-2xl p-4 text-slate-800">
          {result.steps.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Đã tự làm {result.steps.length} bước</div>
              <div className="space-y-1">
                {result.steps.map((st, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <div><b className="text-slate-700">{TOOL_LABEL[st.tool] || st.tool}</b>
                      <span className="text-slate-500"> — {String(st.result || '').slice(0, 120)}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-start gap-2.5 border-t border-slate-100 pt-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"><MessageSquare className="w-4 h-4 text-indigo-600" /></div>
            <div className="flex-1">
              <div className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1">Kết quả</div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.reply || 'Đã xử lý.'}</p>
            </div>
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="mt-4">
          <div className="text-[10px] font-black text-white/70 uppercase tracking-wider mb-2 pl-1">Lệnh gần đây</div>
          <div className="space-y-1.5">
            {history.map((h, i) => (
              <div key={i} className="bg-white/10 rounded-xl px-3 py-2">
                <div className="text-[12px] font-black text-white truncate">{h.text}</div>
                {h.reply && <div className="text-[11px] text-white/70 font-semibold truncate mt-0.5">{h.steps} bước · {h.reply}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandBar;
