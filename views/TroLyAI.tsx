import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/apiService';
import { Bot, Send, Loader2, User, Sparkles, Building2, Star, MessageSquareText, ExternalLink, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

type Msg = { role: 'user' | 'ai'; text: string };

const SUGGEST = [
  { icon: Building2, text: 'Hiện có mấy dự án, giới thiệu giúp tôi.' },
  { icon: Star, text: 'Tìm khách tên Nguyễn và chấm điểm tiềm năng.' },
  { icon: MessageSquareText, text: 'Soạn tin Zalo tư vấn dự án Masteri Riviera cho 1 khách.' },
];

const getUser = () => { try { return JSON.parse(localStorage.getItem('fbg_user') || '{}'); } catch { return {}; } };

const TroLyAI: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef<string | undefined>(undefined);
  const endRef = useRef<HTMLDivElement>(null);

  const [me, setMe] = useState<any>(null);
  const [registering, setRegistering] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [slugInputs, setSlugInputs] = useState<Record<string, string>>({});
  const user = getUser();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const loadMe = async () => {
    if (!user.email) { setMe({ hasAgent: false }); return; }
    try {
      const m = await api.assistantMe(user.email);
      setMe(m);
      if (m.isAdmin) { try { const r = await api.assistantRequests(); setRequests(r.items || []); } catch { /* ignore */ } }
    } catch { setMe({ hasAgent: false }); }
  };
  useEffect(() => { loadMe(); /* eslint-disable-next-line */ }, []);

  const register = async () => {
    setRegistering(true);
    try { await api.assistantRegister({ email: user.email, name: user.name || '', note: '' }); await loadMe(); }
    catch (e: any) { alert(e?.message); } finally { setRegistering(false); }
  };
  const approve = async (email: string) => {
    const slug = (slugInputs[email] || '').trim();
    if (!slug) { alert('Nhập slug Hermes (vd: hub2)'); return; }
    try { await api.assistantApprove(email, slug); await loadMe(); } catch (e: any) { alert(e?.message); }
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput(''); setLoading(true);
    try {
      const res: any = await api.post('/agent/chat', { message: q, sessionId: sessionRef.current });
      sessionRef.current = res?.sessionId || sessionRef.current;
      setMessages((m) => [...m, { role: 'ai', text: res?.reply || '(trợ lý không trả lời)' }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'ai', text: '⚠️ Lỗi: ' + (e?.message || 'không gọi được trợ lý AI') }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-5rem)] animate-in fade-in duration-500">
      <header className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-lg"><Bot className="w-6 h-6 text-white" /></div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-none">Trợ lý AI</h2>
          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Hermes Agent cá nhân · đủ công cụ ERP/CDP/Sale ảo/Chatwoot
          </p>
        </div>
        {me?.hasAgent && (
          <a href={me.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-indigo-700">
            <ExternalLink className="w-4 h-4" /> Mở Hermes Agent đầy đủ
          </a>
        )}
      </header>

      {/* Trạng thái đồng bộ Hermes */}
      {me && me.hasAgent && (
        <div className="mb-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-bold text-emerald-800">Đã đồng bộ Hermes Agent của bạn: <span className="font-black">{me.slug}.fbgproperty.vn</span> — bấm "Mở Hermes Agent đầy đủ" để dùng trợ lý mạnh nhất (có mọi công cụ + Telegram).</p>
        </div>
      )}
      {me && !me.hasAgent && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4">
          {me.pending ? (
            <p className="text-sm font-bold text-amber-800 flex items-center gap-2"><Clock className="w-5 h-5" /> Yêu cầu Trợ lý AI riêng của bạn đang <b>chờ quản trị duyệt</b>. Tạm thời dùng trợ lý chung bên dưới.</p>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm font-bold text-amber-800">Bạn chưa có <b>Trợ lý AI Hermes riêng</b>. Đăng ký để được cấp một trợ lý cá nhân (đồng bộ ERP/CDP/Sale ảo).</p>
              <button onClick={register} disabled={registering || !user.email} className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-xl font-black text-sm hover:bg-amber-700 disabled:opacity-60 whitespace-nowrap">
                {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Đăng ký để được duyệt
              </button>
            </div>
          )}
        </div>
      )}
      {/* Admin: duyệt yêu cầu */}
      {me?.isAdmin && requests.length > 0 && (
        <div className="mb-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl px-4 py-3">
          <p className="text-xs font-black text-indigo-500 uppercase tracking-wide mb-2">Yêu cầu Trợ lý AI chờ duyệt ({requests.length})</p>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.email} className="flex items-center gap-2 text-sm">
                <span className="font-bold text-slate-700 flex-1 truncate">{r.name || r.email} <span className="text-slate-400">({r.email})</span></span>
                <input value={slugInputs[r.email] || ''} onChange={(e) => setSlugInputs((s) => ({ ...s, [r.email]: e.target.value }))} placeholder="slug Hermes" className="w-32 px-2 py-1 rounded-lg border border-slate-200 text-xs font-bold" />
                <button onClick={() => approve(r.email)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-black text-xs hover:bg-indigo-700">Duyệt</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 space-y-5">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mb-4"><Bot className="w-8 h-8 text-indigo-600" /></div>
            <h3 className="text-lg font-black text-gray-900">Chào {user.name || 'Sếp'}! Tôi là trợ lý AI của FBG.</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">Hỏi nhanh ở đây, hoặc mở Hermes Agent đầy đủ để dùng mọi công cụ.</p>
            <div className="grid gap-2 w-full max-w-md">
              {SUGGEST.map((s, i) => (
                <button key={i} onClick={() => send(s.text)} className="flex items-center gap-3 text-left px-4 py-3 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-2xl transition-all group">
                  <s.icon className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="text-[13px] font-bold text-gray-700 group-hover:text-indigo-700">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${m.role === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-indigo-600 text-white'}`}>
              {m.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm'}`}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0"><Bot className="w-5 h-5" /></div>
            <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm flex items-center gap-2 text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> <span className="text-xs font-bold">Trợ lý đang suy nghĩ...</span></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-4 flex gap-3 flex-shrink-0">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi nhanh trợ lý AI..." className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none shadow-sm" />
        <button type="submit" disabled={loading || !input.trim()} className="px-6 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default TroLyAI;
