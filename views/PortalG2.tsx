import React, { useEffect, useState } from 'react';
import { Handshake, Loader2, Plus, Copy, Check, Link2, Phone, Building2, Wallet, RefreshCw, ExternalLink } from 'lucide-react';
import { api } from '../services/apiService';
import { isManagerRole } from '../services/permissions';

const fmtVnd = (n: any): string => {
  const x = Number(n);
  if (!x || Number.isNaN(x)) return '0';
  if (x >= 1e9) return (x / 1e9).toFixed(2).replace(/\.?0+$/, '') + ' tỷ';
  if (x >= 1e6) return Math.round(x / 1e6) + ' triệu';
  return String(x);
};
const timeAgo = (ts: any): string => {
  if (!ts) return '';
  const ms = typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(String(ts));
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 60) return `${Math.max(1, m)} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};

const PortalG2: React.FC = () => {
  const [partners, setPartners] = useState<any[]>([]);
  const [sel, setSel] = useState('');
  const [ov, setOv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReg, setShowReg] = useState(false);
  const [reg, setReg] = useState({ name: '', phone: '', email: '', company: '', commissionPct: 1 });
  const [regBusy, setRegBusy] = useState(false);
  const [copied, setCopied] = useState('');
  const manager = isManagerRole();

  const loadPartners = async () => {
    const r = await api.saasPartners();
    const items = r?.items || [];
    setPartners(items);
    if (items.length && !sel) setSel(items[0].id);
    setLoading(false);
  };
  useEffect(() => { loadPartners(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (sel) api.saasPartnerOverview(sel).then(setOv); }, [sel]);

  const submitReg = async () => {
    if (!reg.name.trim()) return;
    setRegBusy(true);
    try {
      const r = await api.saasPartnerRegister({ ...reg, name: reg.name.trim() });
      if (r?.ok) { setShowReg(false); setReg({ name: '', phone: '', email: '', company: '', commissionPct: 1 }); await loadPartners(); setSel(r.partner.id); }
    } catch { /* */ }
    setRegBusy(false);
  };

  const base = window.location.origin + window.location.pathname;
  const linkOf = (proj: string) => `${base}#/lp/${encodeURIComponent(proj)}?ref=${encodeURIComponent(sel)}`;
  const copy = (id: string, t: string) => { try { navigator.clipboard.writeText(t); setCopied(id); setTimeout(() => setCopied(''), 1500); } catch { /* */ } };

  if (loading) return <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-fuchsia-600 to-indigo-600 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1"><Handshake className="w-5 h-5" /><span className="font-black text-lg">Sàn G2 — Đối tác phân phối</span></div>
            <p className="text-sm opacity-90">Mỗi sàn G2 có link phân phối riêng: khách vào link của sàn nào, lead ghi nhận cho sàn đó + tính hoa hồng ước tính.</p>
          </div>
          {manager && (
            <button onClick={() => setShowReg(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-fuchsia-700 rounded-xl font-black text-sm shrink-0"><Plus className="w-4 h-4" /> Đăng ký sàn G2</button>
          )}
        </div>
      </div>

      {/* Chọn sàn */}
      {partners.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {partners.map((p: any) => (
            <button key={p.id} onClick={() => setSel(p.id)}
              className={`px-3.5 py-2 rounded-xl border-2 whitespace-nowrap text-sm font-black shrink-0 ${sel === p.id ? 'border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-100 bg-white text-slate-600'}`}>
              {p.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
          <Handshake className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="font-semibold text-slate-500">Chưa có sàn G2 nào.</p>
          {manager && <p className="text-sm">Bấm "Đăng ký sàn G2" để thêm đối tác phân phối đầu tiên.</p>}
        </div>
      )}

      {ov?.partner && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4"><p className="text-[11px] font-black text-slate-400 uppercase">Khách đã nộp</p><p className="text-2xl font-black tabular-nums">{ov.totalLeads}</p></div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4"><p className="text-[11px] font-black text-slate-400 uppercase">Dự án được bán</p><p className="text-2xl font-black tabular-nums">{(ov.projects || []).length}</p></div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4"><p className="text-[11px] font-black text-slate-400 uppercase">% Hoa hồng</p><p className="text-2xl font-black tabular-nums">{ov.partner.commissionPct}%</p></div>
            <div className="bg-white rounded-2xl border border-emerald-200 p-4 bg-emerald-50/40"><p className="text-[11px] font-black text-emerald-600 uppercase flex items-center gap-1"><Wallet className="w-3 h-3" /> Hoa hồng ước tính</p><p className="text-2xl font-black text-emerald-700 tabular-nums">{fmtVnd(ov.estCommission)}</p></div>
          </div>

          {/* Link phân phối */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <span className="font-black text-slate-800 flex items-center gap-2"><Link2 className="w-4 h-4 text-fuchsia-600" /> Link phân phối của {ov.partner.name}</span>
            <div className="space-y-2 mt-3">
              {(ov.projects || []).map((proj: string, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-bold text-slate-700 truncate flex-1">{proj}</span>
                  <button onClick={() => copy('g' + i, linkOf(proj))} className="inline-flex items-center gap-1 text-xs font-black text-fuchsia-600 hover:underline shrink-0">
                    {copied === 'g' + i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy link
                  </button>
                  <a href={linkOf(proj)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-fuchsia-600 shrink-0"><ExternalLink className="w-3.5 h-3.5" /></a>
                </div>
              ))}
              {(ov.projects || []).length === 0 && <p className="text-sm text-slate-400 py-3">Sàn này chưa được gán dự án — gán trong wizard Khởi tạo dự án (Dự Án → SaaS & Admin).</p>}
            </div>
          </div>

          {/* Khách của sàn */}
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-800">Khách sàn đã nộp ({ov.totalLeads})</span>
              <button onClick={() => api.saasPartnerOverview(sel).then(setOv)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead><tr className="text-left text-[11px] font-black text-slate-400 uppercase border-b border-slate-100">
                  <th className="py-2 pr-3">Khách</th><th className="py-2 pr-3">SĐT</th><th className="py-2 pr-3">Dự án · Căn</th><th className="py-2">Lúc</th>
                </tr></thead>
                <tbody>
                  {(ov.leads || []).map((l: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2 pr-3 font-bold text-slate-800">{l.name}</td>
                      <td className="py-2 pr-3"><span className="inline-flex items-center gap-1 text-emerald-700 font-bold"><Phone className="w-3.5 h-3.5" />{l.phone}</span></td>
                      <td className="py-2 pr-3 text-slate-600">{l.project}{l.code ? ` · ${l.code}` : ''}</td>
                      <td className="py-2 text-slate-400 text-xs">{timeAgo(l.ts)}</td>
                    </tr>
                  ))}
                  {(ov.leads || []).length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-400">Chưa có khách từ sàn này.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal đăng ký */}
      {showReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowReg(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900">Đăng ký sàn G2</h3>
            <input value={reg.name} onChange={e => setReg(r => ({ ...r, name: e.target.value }))} placeholder="Tên sàn / đối tác *" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input value={reg.phone} onChange={e => setReg(r => ({ ...r, phone: e.target.value }))} placeholder="SĐT" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
              <input value={reg.email} onChange={e => setReg(r => ({ ...r, email: e.target.value }))} placeholder="Email" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <input value={reg.company} onChange={e => setReg(r => ({ ...r, company: e.target.value }))} placeholder="Công ty (tuỳ chọn)" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm" />
            <div>
              <label className="text-xs font-black text-slate-500">% hoa hồng</label>
              <input type="number" step="0.1" min="0" max="10" value={reg.commissionPct} onChange={e => setReg(r => ({ ...r, commissionPct: Number(e.target.value) }))} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowReg(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-black text-sm">Huỷ</button>
              <button onClick={submitReg} disabled={regBusy || !reg.name.trim()} className="inline-flex items-center gap-2 px-4 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-sm disabled:opacity-60">
                {regBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Đăng ký
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalG2;
