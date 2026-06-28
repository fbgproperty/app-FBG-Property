import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Send, RefreshCw, MessageCircle, User } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x) ? x : x?.data?.items || x?.items || x?.data || []);
const threadName = (t: any) => t.name || t.displayName || t.title || t.zaloName || t.threadName || t.phone || 'Hội thoại';
const threadId = (t: any) => t.threadId || t.id || t.uid || t._id;
const msgText = (m: any) => (typeof m.content === 'string' ? m.content : m.content?.text) || m.message || m.text || m.body || '';
const isMine = (m: any) => m.isSelf === true || m.mine === true || m.direction === 'out' || m.fromMe === true || m.sender === 'self';

const ZaloChat: React.FC<{ accounts: any[] }> = ({ accounts }) => {
  const [accId, setAccId] = useState(accounts[0]?._id || '');
  const [threads, setThreads] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingT, setLoadingT] = useState(false);
  const [loadingM, setLoadingM] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    if (!accId) return;
    setLoadingT(true); setErr('');
    try { setThreads(arr(await api.mktGet(`chat/${accId}/threads?limit=60&threadType=user`))); }
    catch (e: any) { setErr(e?.message || 'Lỗi tải hội thoại'); } finally { setLoadingT(false); }
  };
  useEffect(() => { loadThreads(); /* eslint-disable-next-line */ }, [accId]);

  const openThread = async (t: any) => {
    setActive(t); setLoadingM(true); setMessages([]);
    try { setMessages(arr(await api.mktGet(`chat/${accId}/threads/${threadId(t)}/messages/history?limit=50&threadType=user`))); }
    catch (e: any) { setErr(e?.message || 'Lỗi tải tin nhắn'); } finally { setLoadingM(false); }
    setTimeout(() => endRef.current?.scrollIntoView(), 100);
  };
  const send = async () => {
    if (!reply.trim() || !active) return;
    setSending(true);
    try {
      await api.mktPost(`chat/${accId}/messages`, { threadId: threadId(active), message: reply.trim(), threadType: 'user' });
      setMessages(m => [...m, { content: reply.trim(), isSelf: true, ts: Date.now() }]);
      setReply(''); setTimeout(() => endRef.current?.scrollIntoView(), 80);
    } catch (e: any) { setErr(e?.message || 'Lỗi gửi'); } finally { setSending(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-sky-500" /><span className="font-black text-slate-900 text-sm">Hội thoại Zalo</span></div>
        <div className="flex items-center gap-2">
          <select value={accId} onChange={e => { setAccId(e.target.value); setActive(null); setMessages([]); }} className="p-1.5 rounded-lg border border-slate-200 text-xs font-bold">
            {accounts.map((a: any) => <option key={a._id} value={a._id}>{a.name || a.phone || a._id}</option>)}
          </select>
          <button onClick={loadThreads} className="text-slate-400 hover:text-slate-600"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>
      {err && <div className="px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50">{err}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 h-[460px]">
        {/* Thread list */}
        <div className="border-r border-slate-100 overflow-y-auto">
          {loadingT ? <div className="p-4 text-slate-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
            : threads.length === 0 ? <div className="p-4 text-slate-400 text-sm">Chưa có hội thoại. Khi có khách nhắn, sẽ hiện ở đây.</div>
            : threads.map((t: any, i: number) => (
              <button key={threadId(t) || i} onClick={() => openThread(t)} className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 ${active && threadId(active) === threadId(t) ? 'bg-sky-50' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 shrink-0"><User className="w-4 h-4" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-sm truncate">{threadName(t)}</div>
                  <div className="text-[11px] text-slate-400 truncate">{msgText(t.lastMessage || t.lastMsg || {}) || '...'}</div>
                </div>
              </button>
            ))}
        </div>
        {/* Messages */}
        <div className="md:col-span-2 flex flex-col">
          {!active ? <div className="flex-1 flex items-center justify-center text-slate-300 text-sm">Chọn một hội thoại</div> : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/40">
                {loadingM ? <div className="text-slate-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
                  : messages.map((m: any, i: number) => (
                    <div key={i} className={`flex ${isMine(m) ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${isMine(m) ? 'bg-sky-500 text-white rounded-br-sm' : 'bg-white border border-slate-100 text-slate-700 rounded-bl-sm'}`}>{msgText(m)}</div>
                    </div>
                  ))}
                <div ref={endRef} />
              </div>
              <div className="flex items-center gap-2 p-3 border-t border-slate-100">
                <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Nhập tin nhắn..." className="flex-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
                <button onClick={send} disabled={sending || !reply.trim()} className="inline-flex items-center justify-center w-10 h-10 bg-sky-500 text-white rounded-xl hover:bg-sky-600 disabled:opacity-50">{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZaloChat;
