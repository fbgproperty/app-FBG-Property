import React, { useEffect, useState } from 'react';
import { Flame, Loader2, Phone, Building2, Star, RefreshCw, PhoneCall, X, Copy, Check, Trophy, XCircle, DollarSign } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);

const hotStyle = (n: number): string => {
  const v = Number(n) || 0;
  if (v >= 70) return 'bg-rose-100 text-rose-700';
  if (v >= 50) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
};

// Modal kịch bản gọi cho một khách.
const ScriptModal: React.FC<{ id: string; onClose: () => void }> = ({ id, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [script, setScript] = useState('');
  const [customer, setCustomer] = useState<any>(null);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setErr('');
    api.salesCallscript(id)
      .then((r: any) => { if (alive) { setScript(String(r?.script || '')); setCustomer(r?.customer || null); } })
      .catch((e: any) => { if (alive) setErr(e?.message || 'Không soạn được kịch bản.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const copy = () => { navigator.clipboard?.writeText(script); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0"><PhoneCall className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="font-black text-slate-900 truncate leading-tight">Kịch bản gọi (Trợ lý AI)</div>
            {customer?.name && (
              <div className="text-[12px] text-slate-400 font-bold truncate">
                {customer.name}{customer?.project ? ` · ${customer.project}` : ''}{customer?.stage ? ` · ${customer.stage}` : ''}
              </div>
            )}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-indigo-600 gap-3">
              <Loader2 className="w-7 h-7 animate-spin" />
              <span className="text-sm font-bold text-slate-500">Trợ lý AI đang soạn kịch bản…</span>
            </div>
          ) : err ? (
            <div className="text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold">{err}</div>
          ) : (
            <>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-gradient-to-br from-indigo-50 to-sky-50 rounded-2xl p-4 max-h-[50vh] overflow-y-auto">{script || 'Chưa có kịch bản.'}</div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <button onClick={copy} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl font-black text-[12px] hover:bg-slate-50">
                  {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Đã chép</> : <><Copy className="w-3.5 h-3.5" /> Chép</>}
                </button>
                <button onClick={onClose} className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl font-black text-[12px] hover:bg-indigo-700">Đóng</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const HotLeads: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [scriptId, setScriptId] = useState<string | null>(null);
  const [winId, setWinId] = useState<string | null>(null); // row đang mở ô nhập số tiền
  const [winValue, setWinValue] = useState('');
  const [busy, setBusy] = useState('');
  const [flash, setFlash] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await api.salesHot();
      const list = arr(r);
      setItems(list);
      setTotal(Number((r as any)?.total) || list.length);
    } catch (e: any) { setErr(e?.message || 'Không tải được danh sách khách nóng.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const flashMsg = (m: string) => { setFlash(m); setTimeout(() => setFlash(''), 2500); };

  const removeRow = (id: string) => {
    setItems(list => list.filter(c => String(c?.id) !== String(id)));
    setTotal(t => Math.max(0, (Number(t) || 0) - 1));
  };

  const closeWon = async (id: string) => {
    const key = String(id);
    const value = Number(winValue) || 0;
    const prev = items;
    setBusy(key);
    try {
      await api.dealsOutcome({ id: key, result: 'won', value: value || undefined });
      removeRow(key);
      setWinId(null); setWinValue('');
      flashMsg('Đã chốt thắng — chúc mừng!');
    } catch (e: any) {
      setItems(prev);
      setErr(e?.message || 'Ghi nhận chốt thắng lỗi.');
    }
    setBusy('');
  };

  const closeLost = async (id: string) => {
    const key = String(id);
    const prev = items;
    setBusy(key);
    try {
      await api.dealsOutcome({ id: key, result: 'lost' });
      removeRow(key);
      flashMsg('Đã ghi nhận chốt thua.');
    } catch (e: any) {
      setItems(prev);
      setErr(e?.message || 'Ghi nhận chốt thua lỗi.');
    }
    setBusy('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl p-5 text-white bg-gradient-to-br from-rose-600 to-orange-600">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1"><Flame className="w-5 h-5" /><span className="font-black">Khách nóng nhất hôm nay (Trợ lý AI)</span></div>
            <p className="text-sm opacity-90">Xếp theo độ nóng — ưu tiên gọi/chăm trước.</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 rounded-xl font-black text-xs backdrop-blur"><RefreshCw className="w-3.5 h-3.5" /> Tải lại</button>
        </div>
        <div className="mt-2 text-3xl font-black">{loading ? '…' : total} <span className="text-base font-bold opacity-80">khách</span></div>
      </div>

      {err && <div className="text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold">{err}</div>}
      {flash && <div className="text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 text-sm font-bold">{flash}</div>}

      {loading ? (
        <div className="flex justify-center py-10 text-rose-600"><Loader2 className="w-7 h-7 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-3"><Flame className="w-6 h-6" /></div>
          <p className="text-sm text-slate-500 font-bold">Chưa có khách nào. Triển khai dự án để có khách quan tâm về đây.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50">
          {items.map((c: any) => {
            const id = String(c?.id);
            const isBusy = busy === id;
            const openWin = winId === id;
            return (
              <div key={id} className="px-4 py-3 space-y-2.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg shrink-0 ${hotStyle(c?.hot)}`} title="Độ nóng">🔥 {Number(c?.hot) || 0}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 text-sm truncate">{c?.name || 'Khách'}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                      {c?.phone && <span className="inline-flex items-center gap-0.5"><Phone className="w-3 h-3" />{c.phone}</span>}
                      {c?.project && <span className="inline-flex items-center gap-0.5 truncate"><Building2 className="w-3 h-3" />{c.project}</span>}
                      {c?.saleName && <span className="truncate">{c.saleName}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] shrink-0">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{c?.stage || 'Quan tâm'}</span>
                    <span className="inline-flex items-center gap-0.5 font-black text-indigo-600" title="Điểm"><Star className="w-3 h-3" />{Number(c?.score) || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button disabled={isBusy} onClick={() => setScriptId(id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-black text-[12px] hover:bg-indigo-700 disabled:opacity-40">
                    <PhoneCall className="w-3.5 h-3.5" /> Kịch bản gọi
                  </button>
                  <button disabled={isBusy} onClick={() => { setWinId(openWin ? null : id); setWinValue(''); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl font-black text-[12px] hover:bg-emerald-700 disabled:opacity-40">
                    <Trophy className="w-3.5 h-3.5" /> Chốt thắng
                  </button>
                  <button disabled={isBusy} onClick={() => closeLost(id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl font-black text-[12px] hover:bg-rose-700 disabled:opacity-40">
                    {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Chốt thua
                  </button>
                </div>

                {openWin && (
                  <div className="flex items-center gap-2 flex-wrap bg-emerald-50 rounded-xl p-2.5">
                    <div className="inline-flex items-center gap-1.5 flex-1 min-w-[160px] bg-white rounded-lg border border-emerald-200 px-2.5 py-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <input
                        autoFocus
                        type="number"
                        value={winValue}
                        onChange={e => setWinValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') closeWon(id); }}
                        placeholder="Số tiền (không bắt buộc)"
                        className="flex-1 min-w-0 text-[12px] font-bold outline-none bg-transparent"
                      />
                    </div>
                    <button disabled={isBusy} onClick={() => closeWon(id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-black text-[12px] hover:bg-emerald-700 disabled:opacity-40">
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Xác nhận thắng
                    </button>
                    <button disabled={isBusy} onClick={() => { setWinId(null); setWinValue(''); }} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-black text-[12px] text-slate-500 hover:bg-slate-50">Huỷ</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {scriptId && <ScriptModal id={scriptId} onClose={() => setScriptId(null)} />}
    </div>
  );
};

export default HotLeads;
