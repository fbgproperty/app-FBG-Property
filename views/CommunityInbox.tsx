import React, { useEffect, useState } from 'react';
import { Bot, Loader2, Send, RefreshCw, Sparkles, User, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => { const c = Array.isArray(x) ? x : (x?.data?.items || x?.items || x?.data?.data || x?.data); return Array.isArray(c) ? c : []; };
const tName = (t: any) => t.name || t.displayName || t.title || t.zaloName || t.threadName || t.phone || 'Khách';
const tId = (t: any) => t.threadId || t.id || t.uid || t._id;
const mText = (m: any) => (typeof m?.content === 'string' ? m.content : m?.content?.text) || m?.message || m?.text || m?.body || '';
const mine = (m: any) => m?.isSelf === true || m?.mine === true || m?.direction === 'out' || m?.fromMe === true || m?.sender === 'self';

type Item = { tid: any; name: string; last: string; draft: string; sent?: boolean; sending?: boolean; err?: string };

const CommunityInbox: React.FC = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accId, setAccId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [scanning, setScanning] = useState(false);
  const [err, setErr] = useState('');
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    api.mktGet('accounts').then((r: any) => {
      const a = arr(r); setAccounts(a); if (a[0]) setAccId(a[0]._id);
    }).catch(() => setErr('Chưa kết nối Zalo. Vào tab Kênh để kết nối.'));
  }, []);

  const draftFor = async (lastMsg: string, name: string): Promise<string> => {
    try {
      const r = await api.ragAsk(`Khách Zalo tên "${name}" nhắn: "${lastMsg}". Soạn 1 câu trả lời tư vấn BĐS của FBG Property: ngắn gọn, thân thiện, đúng thông tin dự án, có 1 lời mời hành động. CHỈ trả về nội dung tin nhắn, không "Chào quý khách", không xưng "chuyên viên".`);
      return (r?.answer || r?.text || '').toString().trim();
    } catch { return ''; }
  };

  const scan = async () => {
    if (!accId) return;
    setScanning(true); setErr(''); setItems([]);
    try {
      const threads = arr(await api.mktGet(`chat/${accId}/threads?limit=40&threadType=user`));
      const need: Item[] = [];
      // quét tối đa 15 hội thoại gần nhất, lấy hội thoại mà tin CUỐI là của khách
      for (const t of threads.slice(0, 15)) {
        try {
          const hist = arr(await api.mktGet(`chat/${accId}/threads/${tId(t)}/messages/history?limit=6&threadType=user`));
          const last = hist[hist.length - 1];
          if (last && !mine(last) && mText(last)) {
            need.push({ tid: tId(t), name: tName(t), last: mText(last), draft: '' });
          }
        } catch { /* */ }
        if (need.length >= 10) break;
      }
      setItems(need);
      // soạn AI tuần tự + auto-gửi nếu bật
      for (let i = 0; i < need.length; i++) {
        const d = await draftFor(need[i].last, need[i].name);
        setItems(prev => prev.map((x, j) => j === i ? { ...x, draft: d } : x));
        if (auto && d) await sendItem(i, d);
      }
    } catch (e: any) { setErr(e?.message || 'Lỗi quét hội thoại'); } finally { setScanning(false); }
  };

  const sendItem = async (i: number, draftOverride?: string) => {
    setItems(prev => prev.map((x, j) => j === i ? { ...x, sending: true, err: '' } : x));
    const it = items[i]; const msg = (draftOverride ?? it?.draft ?? '').trim();
    if (!msg) { setItems(prev => prev.map((x, j) => j === i ? { ...x, sending: false } : x)); return; }
    try {
      await api.mktPost(`chat/${accId}/messages`, { threadId: items[i]?.tid ?? it?.tid, message: msg, threadType: 'user' });
      setItems(prev => prev.map((x, j) => j === i ? { ...x, sent: true, sending: false } : x));
    } catch (e: any) {
      setItems(prev => prev.map((x, j) => j === i ? { ...x, sending: false, err: e?.message || 'Lỗi gửi' } : x));
    }
  };

  const pending = items.filter(i => !i.sent).length;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-3xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1"><Bot className="w-5 h-5" /><span className="font-black">Community manager — Trực inbox 24/7</span></div>
        <p className="text-sm opacity-90">Quét hội thoại Zalo có khách nhắn <b>chưa được trả lời</b>, AI soạn câu trả lời bám tài liệu dự án. Bạn <b>duyệt 1 chạm</b> để gửi, hoặc bật <b>tự động gửi</b>.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 flex-wrap">
        <select value={accId} onChange={e => setAccId(e.target.value)} className="p-2 rounded-xl border border-slate-200 text-sm font-bold">
          {accounts.length === 0 && <option value="">— chưa có Zalo —</option>}
          {accounts.map((a: any) => <option key={a._id} value={a._id}>{a.name || a.phone || a._id}</option>)}
        </select>
        <button onClick={scan} disabled={scanning || !accId} className="inline-flex items-center gap-2 px-4 py-2 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60">
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Quét & soạn trả lời
        </button>
        <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer select-none ml-auto">
          <input type="checkbox" checked={auto} onChange={e => setAuto(e.target.checked)} className="w-4 h-4 accent-fuchsia-600" />
          <Zap className="w-4 h-4 text-amber-500" /> Tự động gửi
        </label>
      </div>

      {auto && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-xs font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> Chế độ tự động gửi: AI gửi ngay không cần duyệt. Chỉ bật khi bạn tin nội dung — chịu trách nhiệm theo Nghị định 13/2023.</div>}
      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      {!scanning && items.length === 0 && !err && <div className="text-center text-slate-400 text-sm py-10">Bấm "Quét & soạn trả lời" để AI tìm khách đang chờ phản hồi.</div>}
      {scanning && items.length === 0 && <div className="flex justify-center py-8 text-fuchsia-600"><Loader2 className="w-7 h-7 animate-spin" /></div>}

      {items.length > 0 && (
        <div className="text-xs font-black text-slate-400">{pending} khách đang chờ trả lời</div>
      )}
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className={`bg-white rounded-2xl border p-4 ${it.sent ? 'border-emerald-200 opacity-70' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 shrink-0"><User className="w-4 h-4" /></div>
              <span className="font-black text-slate-900 text-sm">{it.name}</span>
              {it.sent && <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-black text-emerald-600"><CheckCircle2 className="w-4 h-4" /> Đã gửi</span>}
            </div>
            <p className="text-sm text-slate-500 bg-slate-50 rounded-xl px-3 py-2 mb-2"><b>Khách:</b> {it.last}</p>
            {it.draft ? (
              <>
                <div className="flex items-center gap-1.5 text-[11px] font-black text-fuchsia-600 mb-1"><Sparkles className="w-3.5 h-3.5" /> AI soạn (sửa được)</div>
                <textarea value={it.draft} onChange={e => setItems(prev => prev.map((x, j) => j === i ? { ...x, draft: e.target.value } : x))} disabled={it.sent} rows={2} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm" />
                {it.err && <div className="text-[11px] text-red-500 font-bold mt-1">{it.err}</div>}
                {!it.sent && (
                  <button onClick={() => sendItem(i)} disabled={it.sending || !it.draft.trim()} className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-xl font-black text-sm hover:bg-sky-600 disabled:opacity-60">
                    {it.sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi Zalo
                  </button>
                )}
              </>
            ) : <div className="text-xs text-slate-400 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> AI đang soạn...</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityInbox;
