import React, { useEffect, useState } from 'react';
import { Inbox, Loader2, RefreshCw, AlertTriangle, Phone, Clock, Copy, Check, Plug, PlugZap, MessageCircle, Facebook, UserCircle2 } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);

/** "2 giờ trước" từ mốc thời gian (unix giây, mili giây, hoặc chuỗi ISO). */
const timeAgo = (ts: any): string => {
  if (!ts) return '';
  let ms: number;
  if (typeof ts === 'number') ms = ts < 1e12 ? ts * 1000 : ts;
  else { const p = Date.parse(String(ts)); if (Number.isNaN(p)) return String(ts); ms = p; }
  const diff = Date.now() - ms;
  if (diff < 0) return 'vừa xong';
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'vừa xong';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(ms).toLocaleDateString('vi-VN');
};

const STATUSES: { id: string; label: string; cls: string }[] = [
  { id: 'new', label: 'Mới', cls: 'bg-sky-100 text-sky-700' },
  { id: 'contacted', label: 'Đã liên hệ', cls: 'bg-indigo-100 text-indigo-700' },
  { id: 'qualified', label: 'Tiềm năng', cls: 'bg-amber-100 text-amber-700' },
  { id: 'won', label: 'Chốt', cls: 'bg-emerald-100 text-emerald-700' },
  { id: 'lost', label: 'Không đạt', cls: 'bg-rose-100 text-rose-700' },
];
const statusLabel = (id: string): string => STATUSES.find(s => s.id === id)?.label || 'Mới';

const sourceBadge = (src: string): { label: string; cls: string } => {
  const s = String(src || '').toLowerCase();
  if (s.includes('zalo')) return { label: 'Zalo OA', cls: 'bg-blue-100 text-blue-700' };
  if (s.includes('facebook') || s.includes('fb')) return { label: 'Facebook', cls: 'bg-indigo-100 text-indigo-700' };
  return { label: src || 'Khác', cls: 'bg-slate-100 text-slate-600' };
};

/** Ô webhook chỉ đọc, có nút sao chép. */
const WebhookField: React.FC<{ url: string }> = ({ url }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { if (!url) return; navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div>
      <div className="flex items-stretch gap-1.5">
        <input readOnly value={url || ''} placeholder="Chưa có địa chỉ webhook" className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[12px] text-slate-600 font-mono truncate" />
        <button onClick={copy} disabled={!url} title="Sao chép" className="w-10 shrink-0 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-50">
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5">Dán địa chỉ này vào cấu hình webhook của kênh.</p>
    </div>
  );
};

const ChannelCard: React.FC<{ icon: any; name: string; connected: boolean; webhookUrl: string; iconCls: string }> = ({ icon: Icon, name, connected, webhookUrl, iconCls }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 ${iconCls}`}><Icon className="w-5 h-5" /></div>
      <div className="min-w-0 flex-1">
        <div className="font-black text-slate-900 text-sm truncate">{name}</div>
        <span className={`inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md mt-0.5 ${connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
          {connected ? <PlugZap className="w-3 h-3" /> : <Plug className="w-3 h-3" />}
          {connected ? 'Đã kết nối' : 'Chưa kết nối'}
        </span>
      </div>
    </div>
    <WebhookField url={webhookUrl} />
  </div>
);

const ChannelLeads: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState<string>('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const [st, ld] = await Promise.all([api.channelsStatus(), api.channelsLeads()]);
      setStatus(st || {});
      setLeads(arr(ld));
    } catch (e: any) {
      setErr(e?.message || 'Không tải được dữ liệu Kênh khách tự động.');
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const changeStatus = async (id: string, newStatus: string) => {
    setErr(''); setSaving(id);
    try {
      await api.channelLeadStatus(id, newStatus);
      const ld = await api.channelsLeads();
      setLeads(arr(ld));
    } catch (e: any) {
      setErr(e?.message || 'Cập nhật trạng thái thất bại.');
    }
    setSaving('');
  };

  const zalo = status?.zalo || {};
  const facebook = status?.facebook || {};
  const bySource: Record<string, number> = status?.bySource || {};
  const totalLeads = Number(status?.totalLeads) || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-700 to-slate-900 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1"><Inbox className="w-5 h-5" /><span className="font-black">Kênh khách tự động</span></div>
            <p className="text-sm opacity-90 max-w-2xl">Kênh khách tự động — khách từ Zalo OA &amp; Facebook tự động về hệ thống, chia ngay cho chuyên viên.</p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl font-black text-sm disabled:opacity-60 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Làm mới
          </button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}

      {/* Section — Trạng thái kết nối */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <span className="font-black text-slate-900 text-sm flex-1">Trạng thái kết nối</span>
          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">Tổng khách: {totalLeads}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ChannelCard icon={MessageCircle} name="Zalo OA" connected={!!zalo.configured} webhookUrl={zalo.webhookUrl} iconCls="bg-blue-600" />
          <ChannelCard icon={Facebook} name="Facebook Lead Ads" connected={!!facebook.configured} webhookUrl={facebook.webhookUrl} iconCls="bg-indigo-600" />
        </div>
        {Object.keys(bySource).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-3 px-1">
            {Object.entries(bySource).map(([src, n]) => {
              const b = sourceBadge(src);
              return <span key={src} className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-lg ${b.cls}`}>{b.label}: {Number(n) || 0}</span>;
            })}
          </div>
        )}
      </div>

      {/* Section — Khách mới về */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="w-4 h-4 text-emerald-600" />
          <span className="font-black text-slate-900 text-sm flex-1">Khách mới về</span>
          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600">{leads.length}</span>
        </div>

        {loading && leads.length === 0 ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải khách…</div>
        ) : leads.length === 0 ? (
          <div className="text-center py-8">
            <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-semibold max-w-md mx-auto">Chưa có khách mới. Khi kênh kết nối, khách đăng ký/nhắn tin sẽ tự về đây và chia cho chuyên viên.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leads.map((l: any) => {
              const b = sourceBadge(l.source);
              return (
                <div key={l.id} className="rounded-2xl border border-slate-100 p-4 hover:border-emerald-200 transition">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm truncate">{l.name || 'Khách chưa rõ tên'}</span>
                        <span className={`inline-flex items-center text-[10px] font-black px-2 py-0.5 rounded-md ${b.cls}`}>{b.label}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[12px] text-slate-500 font-bold">
                        {l.phone && <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{l.phone}</span>}
                        {l.saleName && <span className="inline-flex items-center gap-1"><UserCircle2 className="w-3.5 h-3.5" />{l.saleName}</span>}
                        <span className="inline-flex items-center gap-1 text-slate-400"><Clock className="w-3.5 h-3.5" />{timeAgo(l.ts)}</span>
                      </div>
                      {l.note && <p className="text-[12px] text-slate-500 leading-relaxed mt-1.5 whitespace-pre-wrap">{l.note}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <select
                          value={String(l.status || 'new')}
                          disabled={saving === l.id}
                          onChange={e => changeStatus(l.id, e.target.value)}
                          className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-[12px] font-black text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                        >
                          {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                        {saving === l.id && <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelLeads;
