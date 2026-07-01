import React, { useState } from 'react';
import { HeartHandshake, Loader2, Sparkles, Copy, Check, AlertTriangle, User } from 'lucide-react';
import { api } from '../services/apiService';

const STAGES = ['Mới', 'Tiếp cận', 'Quan tâm', 'Nóng', 'Đặt lịch', 'Đặt cọc', 'Hợp đồng', 'Khách hàng', 'Mất'];

const CopyBtn: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(text || ''); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={copy} className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">
      {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}
    </button>
  );
};

const NurtureSequence: React.FC = () => {
  const [stage, setStage] = useState('Quan tâm');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [err, setErr] = useState('');

  const run = async () => {
    setErr(''); setLoading(true); setItems([]); setRan(false);
    try {
      const r: any = await api.salesSequence(stage);
      setItems(Array.isArray(r?.items) ? r.items : []);
      setRan(true);
    } catch (e: any) { setErr(e?.message || 'Không soạn được chuỗi chăm sóc.'); }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-emerald-600 to-slate-900 rounded-3xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1"><HeartHandshake className="w-5 h-5" /><span className="font-black">Chuỗi chăm sóc tự động (Trợ lý AI)</span></div>
        <p className="text-sm opacity-90">Chọn giai đoạn — Trợ lý AI soạn sẵn tin nhắn chăm sóc cho từng khách.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <p className="text-[12px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2 font-bold inline-flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Tin nhắn cần bạn xem lại trước khi gửi khách.</p>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={stage} onChange={e => setStage(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 text-sm font-bold min-w-[160px]">
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={run} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Soạn chuỗi chăm sóc
          </button>
        </div>

        {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

        {loading ? (
          <div className="flex justify-center py-10 text-emerald-600"><Loader2 className="w-7 h-7 animate-spin" /></div>
        ) : ran && items.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-10 text-center text-slate-400 text-sm">
            Chưa có khách ở giai đoạn này. Chọn giai đoạn khác hoặc triển khai dự án để có khách.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it: any, i: number) => (
              <div key={it?.id || i} className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">{it?.name || 'Khách'}</span>
                  {it?.project ? <span className="text-[12px] text-slate-400 font-semibold">· quan tâm {it.project}</span> : null}
                </div>
                <div className="relative">
                  <CopyBtn text={it?.message || ''} />
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4 pr-16 border border-slate-200">
                    {it?.message || ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NurtureSequence;
