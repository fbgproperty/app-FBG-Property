import React, { useEffect, useState } from 'react';
import {
  CreditCard, ShieldCheck, Server, Loader2, Globe, Cpu, MemoryStick, RefreshCw,
  Sparkles, Phone, Mic, Volume2, Cloud, Database, Brain, MessageSquare, Radio, Building2, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { api } from '../services/apiService';

const ICONS: Record<string, any> = {
  openrouter: Sparkles, twilio: Phone, stringee: Phone, deepgram: Mic, elevenlabs: Volume2,
  cloudflare: Cloud, ragflow: Database, mem0: Brain, chatwoot: MessageSquare, livekit: Radio, erpnext: Building2,
};
const KIND_STYLE: Record<string, string> = {
  'API trả tiền': 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
  'Self-host': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  'Miễn phí': 'bg-slate-50 text-slate-500 border-slate-100',
};

const StatusDot: React.FC<{ live: any }> = ({ live }) => {
  const s = live?.status;
  const map: Record<string, string> = { live: 'bg-emerald-500', free: 'bg-slate-400', self_host: 'bg-emerald-500', on_sale_vm: 'bg-amber-400', manual: 'bg-amber-400', error: 'bg-rose-500' };
  return <span className={`w-2.5 h-2.5 rounded-full ${map[s] || 'bg-slate-300'} ${s === 'live' ? 'animate-pulse' : ''}`} />;
};

const money = (v: any) => (v === null || v === undefined ? '—' : `$${Number(v).toFixed(2)}`);

const Billing: React.FC = () => {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try { setD(await api.infraOverview()); } catch (e: any) { setErr(e?.message || 'Lỗi tải'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center text-indigo-600">
      <Loader2 className="w-11 h-11 animate-spin mb-3" />
      <p className="font-bold text-sm">Đang đồng bộ hạ tầng & chi phí thật...</p>
    </div>
  );
  if (err || !d) return (
    <div className="h-full flex flex-col items-center justify-center text-rose-500 gap-3">
      <AlertTriangle className="w-10 h-10" /><p className="font-bold">{err || 'Không có dữ liệu'}</p>
      <button onClick={load} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm">Thử lại</button>
    </div>
  );

  const t = d.totals || {};
  const orUsed = t.openrouter_used_usd, orRemain = t.openrouter_remaining_usd;
  const orPct = orUsed != null && orRemain != null && (orUsed + orRemain) > 0 ? Math.round(orUsed / (orUsed + orRemain) * 100) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><CreditCard className="w-6 h-6" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-none">Hạ tầng & Chi phí</h2>
            <p className="text-sm text-slate-400 font-semibold mt-1">Toàn bộ VM · nền tảng · API của dự án — số liệu thật, đồng bộ trực tiếp</p>
          </div>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-50 self-start">
          <RefreshCw className="w-4 h-4" /> Đồng bộ lại
        </button>
      </header>

      {/* KPI tổng */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-indigo-600 text-white rounded-2xl p-5 shadow-lg shadow-indigo-200">
          <p className="text-[10px] font-black uppercase opacity-80 tracking-wider">Hạ tầng VM / tháng</p>
          <p className="text-3xl font-black mt-1">{money(t.vm_monthly_usd)}</p>
          <p className="text-[11px] opacity-70 mt-1">{d.vms?.length} máy chủ · cố định</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">OpenRouter đã dùng</p>
          <p className="text-3xl font-black mt-1 text-slate-900">{money(orUsed)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Còn lại {money(orRemain)}{orPct != null ? ` · dùng ${orPct}%` : ''}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Số dư Twilio</p>
          <p className="text-3xl font-black mt-1 text-slate-900">{money(t.twilio_balance_usd)}</p>
          <p className="text-[11px] text-slate-400 mt-1">AI gọi chăm khách</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Domain đang chạy</p>
          <p className="text-3xl font-black mt-1 text-slate-900">{d.domains?.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Cloudflare DNS (free)</p>
        </div>
      </div>

      {orPct != null && (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between text-xs font-black text-slate-500 mb-2">
            <span>Hạn mức OpenRouter</span><span>{money(orUsed)} / {money(orUsed + orRemain)}</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${orPct > 85 ? 'bg-rose-500' : orPct > 60 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${orPct}%` }} />
          </div>
          {orPct > 80 && <p className="text-[11px] text-rose-500 font-bold mt-2">⚠ Sắp hết credit OpenRouter — nên nạp thêm để AI không gián đoạn.</p>}
        </div>
      )}

      {/* Máy chủ */}
      <section>
        <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2"><Server className="w-5 h-5 text-indigo-600" /> Máy chủ (Google Cloud · {d.vm_monthly_total ? money(d.vm_monthly_total) : ''}/tháng)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {d.vms.map((v: any) => (
            <div key={v.name} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><Server className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">{v.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{v.machine}</span>
                </div>
                <p className="text-[12px] text-slate-500 truncate">{v.role}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold mt-1">
                  <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{v.vcpu} vCPU</span>
                  <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3" />{v.ram_gb}GB</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-slate-900">{money(v.monthly_usd)}</p>
                <p className="text-[10px] text-slate-400 font-bold">/ tháng</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nền tảng & API */}
      <section>
        <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-fuchsia-600" /> Nền tảng & API ({d.platforms.length})</h3>
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {d.platforms.map((p: any) => {
            const Icon = ICONS[p.key] || Cloud;
            const live = p.live || {};
            let right = '';
            if (live.status === 'live' && p.key === 'openrouter') right = `Đã dùng ${money(live.used_usd)} · còn ${money(live.remaining_usd)}`;
            else if (live.status === 'live' && p.key === 'twilio') right = `Số dư ${money(live.balance_usd)}`;
            else if (live.status === 'free') right = 'Miễn phí';
            else if (live.status === 'self_host') right = 'Gồm trong VM';
            else if (live.status === 'error') right = 'Lỗi kết nối';
            else right = live.note || p.billing || '';
            return (
              <div key={p.key} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 shrink-0"><Icon className="w-5 h-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <StatusDot live={live} />
                    <span className="font-black text-slate-900 text-sm truncate">{p.name}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${KIND_STYLE[p.kind] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>{p.kind}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-bold truncate">{p.detail || ''}{p.detail && p.billing ? ' · ' : ''}{p.billing}</p>
                </div>
                <div className="text-right shrink-0 text-[12px] font-bold text-slate-600 max-w-[180px] truncate">{right}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Domain */}
      <section>
        <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> Tên miền ({d.domains.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {d.domains.map((dm: any) => (
            <div key={dm.host} className="bg-white rounded-xl border border-slate-100 px-3 py-2.5 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-black text-slate-800 text-[13px] truncate">{dm.host}</p>
                <p className="text-[11px] text-slate-400 font-bold truncate">{dm.svc} → {dm.to}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-start gap-2 text-[12px] text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>{d.notes} · Cập nhật: {new Date(d.generated_at).toLocaleString('vi-VN')}</span>
      </div>
    </div>
  );
};

export default Billing;
