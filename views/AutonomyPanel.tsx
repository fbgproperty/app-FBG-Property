import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Zap, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../services/apiService';

const AutonomyPanel: React.FC = () => {
  const [st, setSt] = useState<any>({ status: 'idle' });
  const [starting, setStarting] = useState(false);
  const [msg, setMsg] = useState('');
  const poll = useRef<any>(null);

  const load = async () => {
    try { setSt(await api.autonomyStatus()); } catch { /* */ }
  };

  useEffect(() => {
    load();
    poll.current = setInterval(load, 8000);
    return () => poll.current && clearInterval(poll.current);
  }, []);

  const run = async () => {
    setStarting(true); setMsg('');
    try {
      const r = await api.autonomyRun();
      if (r?.error) setMsg(r.error);
      else setMsg(`Đã khởi động tự trị cho ${r.started} dự án.`);
      await load();
    } catch { setMsg('Không khởi động được. Thử lại.'); }
    setStarting(false);
  };

  const running = st?.status === 'running';
  const done = st?.status === 'done';
  const total = st?.total || 0;
  const doneN = st?.done || 0;
  const pct = total ? Math.round((doneN / total) * 100) : 0;
  const okN = (st?.results || []).filter((r: any) => r.ok).length;

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-3xl p-6 text-white shadow-lg">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center"><Bot className="w-6 h-6" /></div>
          <div>
            <h3 className="font-black text-lg leading-tight">Tự trị Go-to-Market toàn bộ dự án</h3>
            <p className="text-sm opacity-90">Mỗi dự án có tài liệu kho AI: đồng bộ tài liệu → huấn luyện AI → ghép sale → tạo chiến dịch + việc → dựng phễu marketing 5 giai đoạn. Con người chỉ duyệt & chốt.</p>
          </div>
        </div>
        <button onClick={run} disabled={starting || running}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-700 rounded-xl font-black text-sm hover:bg-indigo-50 disabled:opacity-60 shrink-0">
          {starting || running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {running ? 'Đang chạy…' : 'Chạy tự trị toàn bộ'}
        </button>
      </div>

      {(running || done) && (
        <div className="mt-5 bg-white/15 rounded-2xl p-4">
          <div className="flex items-center justify-between text-sm font-bold mb-2">
            <span>{running ? `Đang xử lý: ${st.current || '…'}` : 'Hoàn tất'}</span>
            <span>{doneN}/{total} dự án · {okN} thành công</span>
          </div>
          <div className="h-2.5 bg-white/25 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto">
            {(st.results || []).slice().reverse().map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[12px] bg-white/10 rounded-lg px-2.5 py-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${r.ok ? 'text-emerald-300' : 'text-amber-300'}`} />
                <span className="font-bold truncate flex-1">{r.project}</span>
                <span className="opacity-80 shrink-0">
                  {(r.deploy?.done ?? 0)}/{(r.deploy?.total ?? 7)} · phễu {r.funnel?.stages ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 flex-wrap">
        {msg && <span className="text-[12px] font-bold bg-white/20 rounded-lg px-3 py-1">{msg}</span>}
        <button onClick={load} className="inline-flex items-center gap-1 text-[12px] font-bold opacity-90 hover:opacity-100"><RefreshCw className="w-3.5 h-3.5" /> Làm mới</button>
        {done && <span className="text-[12px] font-bold opacity-90">✓ Đã báo Telegram cho quản trị. Vào Marketing → Phễu và Dự Án để giao việc.</span>}
      </div>
    </div>
  );
};

export default AutonomyPanel;
