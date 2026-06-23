import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/apiService';
import { Bot, Send, Loader2, User, Sparkles, Building2, Star, MessageSquareText } from 'lucide-react';

type Msg = { role: 'user' | 'ai'; text: string };

const SUGGEST = [
  { icon: Building2, text: 'Hiện có mấy dự án, giới thiệu giúp tôi.' },
  { icon: Star, text: 'Tìm khách tên Nguyễn và chấm điểm tiềm năng.' },
  { icon: MessageSquareText, text: 'Soạn tin Zalo tư vấn dự án Masteri Riviera cho 1 khách.' },
];

const TroLyAI: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef<string | undefined>(undefined);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const [agents, setAgents] = useState<any[]>([]);
  const [persona, setPersona] = useState<any>(null);
  useEffect(() => {
    (async () => {
      try { const a: any[] = await api.getAgents(); setAgents((a || []).filter((x) => String(x.id).startsWith('ai-'))); } catch { /* ignore */ }
    })();
  }, []);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    const toSend = persona
      ? `(Bạn đóng vai nhân viên AI "${persona.name}" — vai trò ${persona.role}, phụ trách dự án ${persona.assignedProject}. Trả lời đúng vai trò này.) ${q}`
      : q;
    try {
      const res: any = await api.post('/agent/chat', { message: toSend, sessionId: sessionRef.current });
      sessionRef.current = res?.sessionId || sessionRef.current;
      setMessages((m) => [...m, { role: 'ai', text: res?.reply || '(trợ lý không trả lời)' }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'ai', text: '⚠️ Lỗi: ' + (e?.message || 'không gọi được trợ lý AI') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-5rem)] animate-in fade-in duration-500">
      <header className="flex items-center gap-3 mb-4 flex-shrink-0">
        <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-lg">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-none">Trợ lý AI</h2>
          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Tư vấn dự án · Chấm điểm lead · Soạn tin — dữ liệu thật từ ERP
          </p>
        </div>
        <select
          value={persona?.id || ''}
          onChange={(e) => { const p = agents.find((a) => a.id === e.target.value) || null; setPersona(p); sessionRef.current = undefined; setMessages([]); }}
          className="ml-auto px-4 py-2.5 bg-white border border-indigo-100 text-indigo-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-50 cursor-pointer shadow-sm"
          title="Chọn nhân viên AI để trò chuyện"
        >
          <option value="">💬 Trợ lý chung</option>
          {agents.map((a) => (<option key={a.id} value={a.id}>{a.name} — {a.role}</option>))}
        </select>
      </header>

      <div className="flex-1 overflow-y-auto bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 space-y-5">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-black text-gray-900">Chào Sếp! Tôi là trợ lý AI của FBG.</h3>
            <p className="text-gray-500 text-sm font-medium mb-6">Hỏi tôi về dự án, khách hàng, hoặc nhờ soạn tin tư vấn.</p>
            <div className="grid gap-2 w-full max-w-md">
              {SUGGEST.map((s, i) => (
                <button key={i} onClick={() => send(s.text)}
                  className="flex items-center gap-3 text-left px-4 py-3 bg-gray-50 hover:bg-indigo-50 border border-gray-100 hover:border-indigo-200 rounded-2xl transition-all group">
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
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-sm'}`}>
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-xs font-bold">Trợ lý đang suy nghĩ...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-4 flex gap-3 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi cho trợ lý AI..."
          className="flex-1 px-5 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none shadow-sm"
        />
        <button type="submit" disabled={loading || !input.trim()}
          className="px-6 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default TroLyAI;
