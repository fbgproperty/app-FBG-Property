import React, { useEffect, useState } from 'react';
import { UserSquare, Loader2, Link2, Copy, Check, Phone, RefreshCw, Building2, TrendingUp, ExternalLink } from 'lucide-react';
import { api } from '../services/apiService';

const timeAgo = (ts: any): string => {
  if (!ts) return '';
  const ms = typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(String(ts));
  if (Number.isNaN(ms)) return '';
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};

const PortalSale: React.FC = () => {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  const load = async () => { setLoading(true); setD(await api.saasSaleOverview()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const base = window.location.origin + window.location.pathname;
  const me = d?.email || '';
  const linkOf = (proj: string) => `${base}#/lp/${encodeURIComponent(proj)}?ref=${encodeURIComponent(me)}`;
  const copy = (id: string, text: string) => { try { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(''), 1500); } catch { /* */ } };

  if (loading && !d) return <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  const myProjects: any[] = d?.myProjects || [];
  const allProjects: string[] = d?.allProjects || [];
  const leads: any[] = d?.leads || [];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><UserSquare className="w-5 h-5" /><span className="font-black text-lg">Kênh bán của tôi</span></div>
        <p className="text-sm opacity-90">Link giới thiệu riêng của bạn — khách vào link nào, lead tự về bạn. Kèm danh sách khách từ landing.</p>
        <div className="flex gap-4 mt-3">
          <div><p className="text-2xl font-black tabular-nums">{d?.stats?.total ?? 0}</p><p className="text-[11px] opacity-80 font-bold uppercase">Khách của tôi</p></div>
          <div><p className="text-2xl font-black tabular-nums">{d?.stats?.last7d ?? 0}</p><p className="text-[11px] opacity-80 font-bold uppercase">7 ngày qua</p></div>
          <div><p className="text-2xl font-black tabular-nums">{myProjects.length}</p><p className="text-[11px] opacity-80 font-bold uppercase">Dự án được gán</p></div>
        </div>
      </div>

      {/* Link giới thiệu theo dự án */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-black text-slate-800 flex items-center gap-2"><Link2 className="w-4 h-4 text-indigo-600" /> Link giới thiệu của tôi (dán vào quảng cáo / gửi khách)</span>
          <button onClick={load} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {(myProjects.length ? myProjects.map((p: any) => p.project) : allProjects).map((proj: string, i: number) => (
            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm font-bold text-slate-700 truncate flex-1">{proj}</span>
              <button onClick={() => copy('l' + i, linkOf(proj))} className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:underline shrink-0">
                {copied === 'l' + i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy link
              </button>
              <a href={linkOf(proj)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 shrink-0"><ExternalLink className="w-3.5 h-3.5" /></a>
            </div>
          ))}
          {myProjects.length === 0 && allProjects.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Chưa có dự án nào.</p>}
        </div>
        <p className="text-[11px] text-slate-400 mt-2">Mẹo: vào <b>Sàn BĐS → Quỹ căn</b> chọn từng căn để tạo landing riêng cho căn — link xuất bản ở đó cũng tự gắn tên bạn.</p>
      </div>

      {/* Khách của tôi từ landing */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <span className="font-black text-slate-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-600" /> Khách từ landing ({leads.length})</span>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead><tr className="text-left text-[11px] font-black text-slate-400 uppercase border-b border-slate-100">
              <th className="py-2 pr-3">Khách</th><th className="py-2 pr-3">SĐT</th><th className="py-2 pr-3">Dự án</th><th className="py-2 pr-3">Căn</th><th className="py-2">Lúc</th>
            </tr></thead>
            <tbody>
              {leads.map((l: any, i: number) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2 pr-3 font-bold text-slate-800">{l.name}</td>
                  <td className="py-2 pr-3"><a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 text-emerald-700 font-bold"><Phone className="w-3.5 h-3.5" />{l.phone}</a></td>
                  <td className="py-2 pr-3 text-slate-600">{l.project}</td>
                  <td className="py-2 pr-3 text-slate-600">{l.code || '—'}</td>
                  <td className="py-2 text-slate-400 text-xs">{timeAgo(l.ts)}</td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-400">Chưa có khách — chia sẻ link giới thiệu của bạn để bắt đầu.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PortalSale;
