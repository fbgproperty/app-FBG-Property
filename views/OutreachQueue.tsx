import React, { useEffect, useState } from 'react';
import { Loader2, RefreshCw, Send, Inbox, Check, Copy, X, CheckCircle2 } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);

// Nút chép nội dung tin.
const CopyBtn: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(String(text || '')); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={copy} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-black text-[12px] text-slate-500 hover:bg-slate-50">
      {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Đã chép</> : <><Copy className="w-3.5 h-3.5" /> Chép</>}
    </button>
  );
};

const statusBadge = (s: string) => {
  if (s === 'sent') return <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">Đã gửi</span>;
  return <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">Đã bỏ</span>;
};

const ItemCard: React.FC<{ it: any; children?: React.ReactNode }> = ({ it, children }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-2.5 shadow-sm">
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-bold text-slate-800 text-sm truncate">{it?.name || 'Khách'}</span>
      {it?.channel && <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">{it.channel}</span>}
      {it?.type && <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{it.type}</span>}
    </div>
    <div className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-3">{it?.message || ''}</div>
    {children}
  </div>
);

const OutreachQueue: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [counts, setCounts] = useState<{ pending: number; sent: number }>({ pending: 0, sent: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await api.outreachList();
      const list = arr(r);
      setItems(list);
      setCounts({
        pending: Number((r as any)?.counts?.pending) || 0,
        sent: Number((r as any)?.counts?.sent) || 0,
      });
    } catch (e: any) { setErr(e?.message || 'Không tải được hàng chờ.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const decide = async (id: string, decision: 'approve' | 'reject') => {
    const key = String(id);
    setBusy(key);
    try {
      await api.outreachDecide(key, decision);
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Xử lý tin lỗi.');
    }
    setBusy('');
  };

  const pending = items.filter(i => String(i?.status) === 'pending');
  const processed = items.filter(i => String(i?.status) !== 'pending');

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 text-white bg-gradient-to-br from-indigo-600 to-sky-600">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1"><Send className="w-5 h-5" /><span className="font-black">Hàng chờ gửi khách</span></div>
            <p className="text-sm opacity-90">Trợ lý AI soạn sẵn — bạn duyệt trước khi gửi.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-xl font-black text-xs backdrop-blur"><RefreshCw className="w-3.5 h-3.5" /> Tải lại</button>
        </div>
        <div className="mt-2 flex items-center gap-5">
          <div className="text-3xl font-black">{loading ? '…' : counts.pending} <span className="text-base font-bold opacity-80">chờ duyệt</span></div>
          <div className="text-3xl font-black">{loading ? '…' : counts.sent} <span className="text-base font-bold opacity-80">đã gửi</span></div>
        </div>
      </div>

      <div className="text-[12px] text-slate-500 font-bold bg-slate-50 rounded-xl px-3 py-2">
        Khi kênh gửi được kết nối, tin duyệt sẽ tự gửi. Hiện tại “Duyệt gửi” đánh dấu đã xử lý.
      </div>

      {err && <div className="text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold">{err}</div>}

      {loading ? (
        <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-3"><Inbox className="w-6 h-6" /></div>
          <p className="text-sm text-slate-500 font-bold">Chưa có tin nào trong hàng chờ. Xếp khách từ mục Dự đoán chốt để Trợ lý AI soạn tin.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <span className="font-black text-slate-800 text-sm">Chờ duyệt</span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-700">{pending.length}</span>
            </div>
            {pending.length === 0 ? (
              <div className="text-[12px] text-slate-400 font-bold text-center py-4 bg-white rounded-2xl border border-slate-100">Không còn tin chờ duyệt.</div>
            ) : pending.map((it: any) => {
              const id = String(it?.id);
              const isBusy = busy === id;
              return (
                <ItemCard key={id} it={it}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button disabled={isBusy} onClick={() => decide(id, 'approve')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-black text-[12px] hover:bg-emerald-700 disabled:opacity-40">
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Duyệt gửi
                    </button>
                    <button disabled={isBusy} onClick={() => decide(id, 'reject')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-black text-[12px] text-slate-500 hover:bg-slate-50 disabled:opacity-40">
                      <X className="w-3.5 h-3.5" /> Bỏ
                    </button>
                    <CopyBtn text={it?.message} />
                  </div>
                </ItemCard>
              );
            })}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 px-1">
              <span className="font-black text-slate-800 text-sm">Đã xử lý</span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{processed.length}</span>
            </div>
            {processed.length === 0 ? (
              <div className="text-[12px] text-slate-400 font-bold text-center py-4 bg-white rounded-2xl border border-slate-100">Chưa có tin nào được xử lý.</div>
            ) : processed.map((it: any) => (
              <ItemCard key={String(it?.id)} it={it}>
                <div className="flex items-center gap-2 flex-wrap">
                  {statusBadge(String(it?.status))}
                  <CopyBtn text={it?.message} />
                </div>
              </ItemCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutreachQueue;
