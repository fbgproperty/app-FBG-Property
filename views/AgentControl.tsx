import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot, Users, CheckCircle2, RefreshCw, Loader2, X, Send, Radio, Sparkles,
} from 'lucide-react';
import { api } from '../services/apiService';

type RosterItem = {
  email: string;
  name: string;
  role: string;
  dept: string;
  slug: string;
  ready: boolean;
  hasTelegram: boolean;
};

type Turn = { role: 'user' | 'agent'; text: string };

const QUICK = [
  'Báo cáo tình hình khách của bạn',
  'Đề xuất việc cần làm hôm nay',
  'Soạn tin chăm sóc 1 khách tiềm năng',
];

const initials = (name?: string): string => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'AI';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
};

// ── Command modal for a single agent ───────────────────────────────
const CommandModal: React.FC<{ agent: RosterItem; onClose: () => void }> = ({ agent, onClose }) => {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [turns, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setTurns((t) => [...t, { role: 'user', text }]);
    setInput('');
    setBusy(true);
    try {
      const res = await api.assistantChat(agent.email, text);
      setTurns((t) => [...t, { role: 'agent', text: res?.reply || '(Agent chưa trả lời)' }]);
    } catch (e: any) {
      setTurns((t) => [...t, { role: 'agent', text: '⚠️ ' + (e?.message || 'Không kết nối được Agent. Vui lòng thử lại sau ít phút.') }]);
    } finally {
      setBusy(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100 font-black text-sm">
              {initials(agent.name)}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 leading-tight truncate">{agent.name || 'Agent'}</h3>
              <p className="text-slate-500 text-sm truncate">{agent.role || 'Agent'}</p>
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

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 bg-slate-50/40">
          {turns.length === 0 && !busy && (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-14 h-14 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <p className="text-sm font-black text-slate-700">Ra lệnh cho Agent của {agent.name || 'nhân sự'}</p>
              <p className="text-[12px] text-slate-400 mt-1">Gõ lệnh bên dưới hoặc chọn nhanh một gợi ý.</p>
            </div>
          )}

          {turns.map((t, i) => (
            <div key={i} className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  t.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm shadow-sm'
                }`}
              >
                {t.text}
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tl-sm bg-white border border-slate-100 shadow-sm flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-[13px] font-bold">Agent đang xử lý… (có thể mất tới vài phút)</span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-slate-100 px-6 py-4 space-y-3 bg-white">
          <div className="flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInput(q)}
                disabled={busy}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition disabled:opacity-50"
              >
                + {q}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-end">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              placeholder="Ra lệnh cho Agent… (Enter để gửi, Shift+Enter xuống dòng)"
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium
                        focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition resize-none disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Ra lệnh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Single agent card ──────────────────────────────────────────────
const AgentCard: React.FC<{ agent: RosterItem; onOpen: () => void }> = ({ agent, onOpen }) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 font-black text-sm shadow">
        {initials(agent.name)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-black text-slate-900 text-sm truncate">{agent.name || 'Nhân sự'}</div>
        <div className="text-slate-500 text-sm truncate">{agent.role || '—'}</div>
      </div>
    </div>

    <div className="flex items-center gap-2 flex-wrap">
      {agent.ready ? (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> Sẵn sàng
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
          <span className="w-2 h-2 rounded-full bg-slate-400" /> Chưa kích hoạt
        </span>
      )}
      {agent.hasTelegram && (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100" title="Có kênh nhắn">
          <Radio className="w-3 h-3" /> Có kênh nhắn
        </span>
      )}
    </div>

    <button
      onClick={onOpen}
      disabled={!agent.ready}
      className="mt-1 w-full py-2.5 bg-indigo-600 text-white font-black rounded-xl text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
    >
      <Bot className="w-4 h-4" /> Vào ra lệnh
    </button>
  </div>
);

// ── Main control panel ─────────────────────────────────────────────
const AgentControl: React.FC = () => {
  const [items, setItems] = useState<RosterItem[]>([]);
  const [total, setTotal] = useState(0);
  const [ready, setReady] = useState(0);
  const [depts, setDepts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [active, setActive] = useState<RosterItem | null>(null);

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await api.agentsRoster();
      const list: RosterItem[] = Array.isArray(r?.items) ? r.items : [];
      setItems(list);
      setTotal(Number(r?.total) || list.length);
      setReady(Number(r?.ready) || list.filter((x) => x?.ready).length);
      setDepts(Array.isArray(r?.depts) ? r.depts : []);
    } catch (e: any) {
      setErr(e?.message || 'Không tải được danh sách Agent.');
      setItems([]); setTotal(0); setReady(0); setDepts([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // Group items by dept, following `depts` order, then any leftover depts.
  const groups = useMemo(() => {
    const byDept = new Map<string, RosterItem[]>();
    for (const it of items) {
      const d = it?.dept || 'Khác';
      if (!byDept.has(d)) byDept.set(d, []);
      byDept.get(d)!.push(it);
    }
    const ordered: { dept: string; list: RosterItem[] }[] = [];
    const seen = new Set<string>();
    for (const d of depts) {
      if (byDept.has(d)) { ordered.push({ dept: d, list: byDept.get(d)! }); seen.add(d); }
    }
    for (const [d, list] of byDept) {
      if (!seen.has(d)) ordered.push({ dept: d, list });
    }
    return ordered;
  }, [items, depts]);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header card */}
      <div className="rounded-3xl p-6 text-white bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-white/15 rounded-2xl"><Bot className="w-5 h-5" /></div>
              <h2 className="text-2xl font-black leading-none">Điều khiển 24 Agent</h2>
            </div>
            <p className="text-sm opacity-90 mt-2 max-w-2xl">
              Mỗi nhân sự một Agent riêng — kiểm soát toàn bộ, vào từng Agent để ra lệnh.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-2xl text-sm font-black transition disabled:opacity-60 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-sm font-black px-3 py-1.5 rounded-full bg-white/15">
            <Users className="w-4 h-4" /> Tổng Agent: {loading ? '…' : total}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-black px-3 py-1.5 rounded-full bg-white/15">
            <CheckCircle2 className="w-4 h-4" /> Sẵn sàng: {loading ? '…' : ready}
          </span>
        </div>
      </div>

      {err && (
        <div className="text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm font-bold">{err}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-indigo-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
          <div className="w-14 h-14 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-3"><Bot className="w-7 h-7" /></div>
          <p className="text-sm text-slate-600 font-black">Chưa có Agent nào.</p>
          <p className="text-[12px] text-slate-400 mt-1">Khi mỗi nhân sự được cấp một Agent riêng, danh sách sẽ hiện ở đây.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ dept, list }) => (
            <section key={dept} className="space-y-3">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {dept}
                <span className="text-slate-300 normal-case tracking-normal font-bold">({list.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map((agent) => (
                  <AgentCard
                    key={agent.email || `${dept}-${agent.name}`}
                    agent={agent}
                    onOpen={() => setActive(agent)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {active && <CommandModal agent={active} onClose={() => setActive(null)} />}
    </div>
  );
};

export default AgentControl;
