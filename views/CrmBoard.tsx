import React, { useEffect, useState } from 'react';
import {
  Contact2, Loader2, RefreshCw, AlertTriangle, Users, Target, DoorOpen,
  CheckCircle2, Filter, Phone, UserCircle2, Calendar, Sparkles, Building2, Bot
} from 'lucide-react';
import { api } from '../services/apiService';

const nn = (x: any) => Number(x) || 0;
const money = (x: any) => nn(x).toLocaleString('vi-VN');

const STATUS_VI: Record<string, string> = {
  Lead: 'Khách mới', Open: 'Đang mở', Opportunity: 'Có cơ hội', 'Do Not Contact': 'Không liên hệ',
  Converted: 'Đã chuyển đổi', Replied: 'Đã phản hồi', Interested: 'Quan tâm', Lost: 'Thất bại', Quotation: 'Báo giá',
};
const statusVi = (s: any) => STATUS_VI[s] || (s || 'Chưa rõ');

const STATUS_C: Record<string, string> = {
  Lead: 'bg-slate-100 text-slate-600', Open: 'bg-sky-50 text-sky-700', Replied: 'bg-amber-50 text-amber-700',
  Opportunity: 'bg-indigo-50 text-indigo-700', Converted: 'bg-emerald-50 text-emerald-700',
  Interested: 'bg-fuchsia-50 text-fuchsia-700', Lost: 'bg-rose-50 text-rose-600', Quotation: 'bg-violet-50 text-violet-700',
  'Do Not Contact': 'bg-slate-100 text-slate-400',
};
const statusChip = (s: any) => STATUS_C[s] || 'bg-slate-100 text-slate-500';

const fmtDate = (v: any) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const BarList: React.FC<{ byStatus: Record<string, number>; color: string }> = ({ byStatus, color }) => {
  const entries = Object.entries(byStatus || {}).sort((a, b) => nn(b[1]) - nn(a[1]));
  const max = entries.reduce((m, [, v]) => Math.max(m, nn(v)), 0) || 1;
  if (entries.length === 0) return <p className="text-[12px] text-slate-400">Chưa có dữ liệu.</p>;
  return (
    <div className="space-y-3">
      {entries.map(([st, v]) => {
        const val = nn(v);
        const w = Math.max(2, Math.round((val / max) * 100));
        return (
          <div key={st} className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-[12px] font-black text-slate-600 truncate" title={statusVi(st)}>{statusVi(st)}</div>
            <div className="flex-1 h-7 bg-slate-50 rounded-xl overflow-hidden">
              <div className={`h-full ${color} rounded-xl flex items-center justify-end px-3 transition-all`} style={{ width: `${w}%` }}>
                <span className="text-[12px] font-black text-white">{val}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const CrmBoard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [opps, setOpps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const [syncing, setSyncing] = useState(false);
  const [syncRes, setSyncRes] = useState<any>(null);
  const [syncErr, setSyncErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    const [s, l, o] = await Promise.allSettled([api.crmSummary(), api.crmLeads(), api.crmOpportunities()]);
    if (s.status === 'fulfilled') setSummary(s.value || {}); else { setSummary({}); setErr('Không tải được số liệu CRM.'); }
    setLeads(l.status === 'fulfilled' && Array.isArray(l.value?.items) ? l.value.items : []);
    setOpps(o.status === 'fulfilled' && Array.isArray(o.value?.items) ? o.value.items : []);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const runSync = async () => {
    setSyncing(true); setSyncErr(''); setSyncRes(null);
    try {
      const r = await api.crmSyncWorklog();
      setSyncRes(r || {});
      load();
    } catch (e: any) { setSyncErr(e?.message || 'Không nạp được việc sang CRM.'); }
    setSyncing(false);
  };

  const scoped = !!summary?.scoped;
  const lead = summary?.lead || {};
  const opp = summary?.opportunity || {};
  const leadTotal = nn(lead?.total);
  const oppTotal = nn(opp?.total);
  const oppOpen = nn(opp?.byStatus?.['Open']);
  const oppConverted = nn(opp?.byStatus?.['Converted']);
  const leadByStatus = lead?.byStatus || {};
  const oppByStatus = opp?.byStatus || {};

  const KPIS = [
    { label: 'Tổng Lead', val: leadTotal, icon: Users, c: 'bg-indigo-600' },
    { label: 'Tổng cơ hội', val: oppTotal, icon: Target, c: 'bg-violet-600' },
    { label: 'Cơ hội đang mở', val: oppOpen, icon: DoorOpen, c: 'bg-amber-500' },
    { label: 'Đã chuyển đổi', val: oppConverted, icon: CheckCircle2, c: 'bg-emerald-600' },
  ];

  const topLeads = Array.isArray(leads) ? leads.slice(0, 20) : [];
  const topOpps = Array.isArray(opps) ? opps.slice(0, 20) : [];

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Contact2 className="w-5 h-5" /><span className="font-black text-lg">CRM</span>
              {!loading && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${scoped ? 'bg-emerald-400/20 text-emerald-200' : 'bg-white/15 text-white/90'}`}>
                  {scoped ? 'Chỉ khách của bạn' : 'Toàn công ty'}
                </span>
              )}
            </div>
            <p className="text-sm opacity-90">Khách hàng · Cơ hội · Pipeline — đồng bộ với hệ thống CRM.</p>
          </div>
          <button onClick={load} className="text-white/80 hover:text-white shrink-0"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
        </div>
      </div>

      {/* Sync control */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><Bot className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5"><Sparkles className="w-4 h-4 text-indigo-600" /><span className="font-black text-slate-900">Nạp việc Trợ lý AI vào CRM</span></div>
            <p className="text-[13px] text-slate-500">Đưa toàn bộ công việc của 24 Trợ lý AI vào hệ thống CRM (gán đúng nhân sự).</p>
            {syncErr && <p className="text-[12px] text-amber-700 font-bold mt-2 inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {syncErr}</p>}
            {syncRes && !syncErr && (
              <p className="text-[12px] text-emerald-700 font-black mt-2 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã nạp {nn(syncRes?.synced)} việc (tổng {nn(syncRes?.totalSynced)}/{nn(syncRes?.totalWorklog)})
              </p>
            )}
          </div>
          <button
            onClick={runSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60 shrink-0"
          >
            {syncing ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang nạp…</> : <><RefreshCw className="w-4 h-4" /> Nạp việc sang CRM</>}
          </button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      {loading ? <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {KPIS.map(x => (
              <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className={`w-9 h-9 rounded-xl ${x.c} flex items-center justify-center text-white mb-2`}><x.icon className="w-4 h-4" /></div>
                <p className="text-2xl font-black text-slate-900">{x.val}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{x.label}</p>
              </div>
            ))}
          </div>

          {/* Funnels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4"><Filter className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Phễu Lead</span></div>
              <BarList byStatus={leadByStatus} color="bg-indigo-500" />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-4"><Filter className="w-5 h-5 text-violet-600" /><span className="font-black text-slate-900">Phễu cơ hội</span></div>
              <BarList byStatus={oppByStatus} color="bg-violet-500" />
            </div>
          </div>

          {/* Recent leads */}
          <div className="bg-white rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 p-5 pb-3"><Users className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Danh sách Lead gần đây</span></div>
            {topLeads.length === 0 ? (
              <div className="px-5 pb-6 text-center text-slate-400 text-sm">Chưa có Lead.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {topLeads.map((c: any, i: number) => (
                  <div key={c?.name || i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><UserCircle2 className="w-4 h-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 text-sm truncate">{c?.lead_name || c?.name || 'Chưa rõ'}</div>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                        {c?.mobile_no && <span className="inline-flex items-center gap-0.5"><Phone className="w-3 h-3" />{c.mobile_no}</span>}
                        {c?.lead_owner && <span className="inline-flex items-center gap-0.5"><UserCircle2 className="w-3 h-3" />{c.lead_owner}</span>}
                        {c?.creation && <span className="inline-flex items-center gap-0.5"><Calendar className="w-3 h-3" />{fmtDate(c.creation)}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${statusChip(c?.status)}`}>{statusVi(c?.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent opportunities */}
          <div className="bg-white rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 p-5 pb-3"><Target className="w-5 h-5 text-violet-600" /><span className="font-black text-slate-900">Cơ hội gần đây</span></div>
            {topOpps.length === 0 ? (
              <div className="px-5 pb-6 text-center text-slate-400 text-sm">Chưa có cơ hội.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {topOpps.map((o: any, i: number) => (
                  <div key={o?.name || i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-full bg-violet-50 flex items-center justify-center text-violet-600 shrink-0"><Building2 className="w-4 h-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 text-sm truncate">{o?.title || o?.customer_name || o?.name || 'Chưa rõ'}</div>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                        {nn(o?.opportunity_amount) > 0 && <span className="font-black text-slate-500">{money(o?.opportunity_amount)} đ</span>}
                        {o?.source && <span className="inline-flex items-center gap-0.5"><Filter className="w-3 h-3" />{o.source}</span>}
                        {o?.creation && <span className="inline-flex items-center gap-0.5"><Calendar className="w-3 h-3" />{fmtDate(o.creation)}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${statusChip(o?.status)}`}>{statusVi(o?.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CrmBoard;
