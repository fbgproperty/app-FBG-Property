import React, { useEffect, useState } from 'react';
import { Bot, Plus, Trash2, Send, Loader2, Sparkles, X } from 'lucide-react';
import { api } from '../services/apiService';

// Panel quản lý "Sale ảo" (ADK) — đọc/tạo qua Unified Bridge.
// owner: slug nhân sự (mặc định lấy từ localStorage 'fbg_owner' hoặc 'duymp').
const SaleAoPanel: React.FC = () => {
  const owner = (typeof localStorage !== 'undefined' && localStorage.getItem('fbg_owner')) || 'duymp';
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', persona: '', segment: '', channel: 'telegram' });
  const [showForm, setShowForm] = useState(false);

  const [nurtureFor, setNurtureFor] = useState<any | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [nurturing, setNurturing] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getSalesAgents(owner);
      setAgents(res.items || []);
    } catch (e) { console.error(e); setAgents([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await api.createSalesAgent({ owner, ...form });
      setForm({ name: '', persona: '', segment: '', channel: 'telegram' });
      setShowForm(false);
      await load();
    } catch (e: any) { alert(e?.message || 'Lỗi tạo sale ảo'); }
    finally { setCreating(false); }
  };

  const del = async (id: string) => {
    if (!confirm('Xoá sale ảo này?')) return;
    try { await api.deleteSalesAgent(id); await load(); } catch (e: any) { alert(e?.message); }
  };

  const runNurture = async () => {
    if (!customerId.trim() || !nurtureFor) return;
    setNurturing(true); setResult(null);
    try {
      const r = await api.salesNurture({ customerId: customerId.trim(), agentId: nurtureFor.id });
      setResult(r);
      load();
    } catch (e: any) { alert(e?.message || 'Lỗi soạn tin'); }
    finally { setNurturing(false); }
  };

  return (
    <div className="mb-8 bg-gradient-to-br from-indigo-50/60 to-white rounded-3xl border border-indigo-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Sale ảo (ADK)</h2>
            <p className="text-[12px] text-slate-400 font-semibold mt-1">
              AI agent tự động chăm khách thật từ CDP · chủ sở hữu: <span className="text-indigo-600 font-black">{owner}</span>
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
          <Plus className="w-4 h-4" /> Tạo sale ảo
        </button>
      </div>

      {showForm && (
        <div className="mb-5 grid grid-cols-1 md:grid-cols-4 gap-3 bg-white rounded-2xl border border-slate-100 p-4">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Tên sale ảo" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold" />
          <input value={form.persona} onChange={e => setForm({ ...form, persona: e.target.value })}
            placeholder="Tính cách / chuyên môn" className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold md:col-span-2" />
          <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold">
            <option value="telegram">Telegram</option>
            <option value="zalo">Zalo</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
          <div className="md:col-span-4 flex justify-end">
            <button onClick={create} disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 disabled:opacity-50">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tạo
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải sale ảo…
        </div>
      ) : agents.length === 0 ? (
        <p className="text-slate-400 text-sm font-semibold py-6 text-center">Chưa có sale ảo nào. Bấm "Tạo sale ảo" hoặc nhờ Hermes tạo qua Telegram.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-slate-100 p-5 group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-black text-slate-900 text-[15px] tracking-tight">{a.name}</h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-200">{a.status}</span>
              </div>
              <p className="text-[12px] text-slate-500 font-semibold leading-snug line-clamp-2 mb-3">{a.persona || 'Sale ảo FBG'}</p>
              <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 mb-4">
                <span className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100">Kênh: {a.channel}</span>
                <span className="px-2 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600">Đã chăm: {a.nurtured ?? 0}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setNurtureFor(a); setCustomerId(''); setResult(null); }}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-xl font-black text-[12px] hover:bg-indigo-700">
                  <Send className="w-3.5 h-3.5" /> Soạn tin
                </button>
                <button onClick={() => del(a.id)} className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {nurtureFor && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setNurtureFor(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-slate-900 text-lg">Soạn tin · {nurtureFor.name}</h3>
              <button onClick={() => setNurtureFor(null)} className="p-2 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <input value={customerId} onChange={e => setCustomerId(e.target.value)}
              placeholder="customer_id (vd: CRM-LEAD-2026-00496)"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold mb-3" />
            <button onClick={runNurture} disabled={nurturing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50">
              {nurturing ? <><Loader2 className="w-4 h-4 animate-spin" /> Sale ảo đang soạn…</> : <><Sparkles className="w-4 h-4" /> Sale ảo soạn tin</>}
            </button>
            {result && (
              <div className="mt-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 p-4">
                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-wide mb-1">
                  Gửi {result.customer?.fullName || result.customerId} · {result.channel}
                </p>
                <p className="text-sm text-slate-700 font-medium whitespace-pre-wrap leading-relaxed">{result.message}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SaleAoPanel;
