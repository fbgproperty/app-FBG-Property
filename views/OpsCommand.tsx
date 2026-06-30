import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot, Megaphone, Building2, Briefcase, Server, Loader2, Sparkles, Copy, Check, ArrowRight,
  ShieldCheck, Activity, AlertTriangle, CheckCircle2
} from 'lucide-react';
import { api } from '../services/apiService';

const tot = (x: any) => (x?.total ?? x?.totalItems ?? x?.data?.total ?? (x?.items?.length) ?? 0);
const arr = (x: any): any[] => { const c = Array.isArray(x) ? x : (x?.data?.items || x?.items || x?.data?.data || x?.data); return Array.isArray(c) ? c : []; };

const OpsCommand: React.FC = () => {
  const nav = useNavigate();
  const [d, setD] = useState<any>({ kenh: 0, jobs: 0, duan: 0, listing: 0, khach: 0, lead: 0, vmUp: 0, vmDown: 0, vms: [] });
  const [loading, setLoading] = useState(true);
  const [brief, setBrief] = useState('');
  const [briefTs, setBriefTs] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [ap, setAp] = useState<any>(null);
  const [gen, setGen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Tự tải bản tin Hermes mới nhất (cron sinh mỗi sáng) + task quá hạn + trạng thái autopilot
    api.opsBriefLatest().then((r) => { if (r?.text) { setBrief(r.text); setBriefTs(r.ts || 0); } }).catch(() => { /* */ });
    api.opsOverdue().then((r) => setOverdue(r?.total || 0)).catch(() => { /* */ });
    api.autopilotStatus().then((r) => setAp(r)).catch(() => { /* */ });
  }, []);

  useEffect(() => {
    (async () => {
      const [acc, pj, pr, cdp, leads, infra] = await Promise.allSettled([
        api.mktGet('accounts'),
        api.getProjectsCbx(),
        api.getRaiProperties({ page: 1, pageSize: 1 } as any),
        api.getCdpCustomers({ page: 1, pageSize: 1 }),
        api.getLeads({ page: 1, pageSize: 1 } as any),
        api.infraOverview(),
      ]);
      const inf: any = infra.status === 'fulfilled' ? infra.value : {};
      const vms = arr(inf?.vms || inf?.servers || inf?.data?.vms);
      const up = vms.filter((v: any) => /run|up|active|online/i.test(String(v.status || v.state || ''))).length;
      setD({
        kenh: acc.status === 'fulfilled' ? arr(acc.value).length : 0,
        duan: pj.status === 'fulfilled' ? ((pj.value as any)?.items?.length ?? tot(pj.value)) : 0,
        listing: pr.status === 'fulfilled' ? tot(pr.value) : 0,
        khach: cdp.status === 'fulfilled' ? tot(cdp.value) : 0,
        lead: leads.status === 'fulfilled' ? tot(leads.value) : 0,
        vmUp: up || vms.length, vmDown: vms.length ? (vms.length - up) : 0, vms,
      });
      setLoading(false);
    })();
  }, []);

  const genBrief = async () => {
    setGen(true); setBrief('');
    try {
      const r = await api.opsBrief({
        marketing: { agent_live: 10, kenh_zalo: d.kenh },
        bds: { agent_live: 6, du_an: d.duan, listing: d.listing },
        kinh_doanh: { agent_live: 6, khach: d.khach, lead: d.lead },
        ha_tang: { vm_up: d.vmUp, vm_down: d.vmDown },
      }, 'hôm nay');
      setBrief(r?.text || '');
    } catch (e: any) { setBrief('Lỗi: ' + (e?.message || '')); }
    setGen(false);
  };
  const copy = () => { navigator.clipboard?.writeText(brief); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const DEPTS = [
    { n: 'Marketing', icon: Megaphone, to: '/marketing', live: 10, metric: `${d.kenh} kênh · content/ads/video`, c: 'from-fuchsia-600 to-pink-600' },
    { n: 'Bất động sản', icon: Building2, to: '/san-bds', live: 6, metric: `${d.duan} dự án · ${d.listing} listing`, c: 'from-indigo-600 to-blue-600' },
    { n: 'Kinh doanh', icon: Briefcase, to: '/kinh-doanh', live: 6, metric: `${d.khach} khách · ${d.lead} lead`, c: 'from-emerald-600 to-teal-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-indigo-700 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><Bot className="w-5 h-5" /><span className="font-black">Hermes — Giám đốc vận hành AI (COO)</span></div>
        <p className="text-sm opacity-90">Điều phối <b>{ap?.staff ?? 24} nhân sự — mỗi người 1 trợ lý Hermes riêng</b> (chat · ERP · n8n) + 3 phòng chuyên viên AI + hạ tầng. Một màn hình thấy toàn bộ tổ chức đang chạy gì, ưu tiên gì.</p>
        <div className="flex items-center gap-4 mt-3 text-xs font-bold">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-300" /> {ap?.staff ?? 24} Hermes trực · {ap?.managers ?? 8} quản lý</span>
          <span className="inline-flex items-center gap-1.5"><Server className="w-4 h-4 text-sky-300" /> {loading ? '...' : `${d.vmUp} VM hoạt động`}</span>
          {(ap?.overdue ?? overdue) > 0 && <span className="inline-flex items-center gap-1.5 bg-rose-500/30 px-2 py-0.5 rounded-md"><AlertTriangle className="w-4 h-4 text-rose-200" /> {ap?.overdue ?? overdue} việc quá hạn</span>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider pl-1 pr-1">Mở nhanh OS</span>
          {[
            { n: 'Sàn BĐS', to: '/san-bds', on: true },
            { n: 'Marketing', to: '/marketing', on: true },
            { n: 'Kinh doanh', to: '/kinh-doanh', on: true },
            { n: 'Vận hành', to: '/van-hanh', on: true },
            { n: 'Công nghệ', to: '/billing', on: true },
            { n: 'Báo cáo', to: '', on: false },
          ].map(x => (
            <button key={x.n} disabled={!x.on} onClick={() => x.on && nav(x.to)}
              className={`text-xs font-black px-3 py-1.5 rounded-xl transition ${x.on ? 'bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700' : 'bg-slate-50 text-slate-300 cursor-default'}`}>
              {x.n}{!x.on && ' · sắp có'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-black text-slate-900 mb-3">3 phòng AI — bấm để mở</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEPTS.map(dep => {
            const Icon = dep.icon;
            return (
              <button key={dep.n} onClick={() => nav(dep.to)} className="text-left bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:border-indigo-200 transition group">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${dep.c} flex items-center justify-center text-white mb-3`}><Icon className="w-6 h-6" /></div>
                <div className="font-black text-slate-900 flex items-center justify-between">{dep.n}<ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition" /></div>
                <div className="text-[11px] text-slate-400 font-bold mt-0.5">{loading ? '...' : dep.metric}</div>
                <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md"><CheckCircle2 className="w-3 h-3" /> {dep.live} AI chạy</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3"><Activity className="w-5 h-5 text-sky-500" /><span className="font-black text-slate-900">Sức khoẻ hạ tầng</span></div>
        {loading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> : (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 bg-emerald-50 rounded-xl px-3 py-1.5"><CheckCircle2 className="w-4 h-4" /> {d.vmUp} VM hoạt động</span>
            {d.vmDown > 0 && <span className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-700 bg-rose-50 rounded-xl px-3 py-1.5"><AlertTriangle className="w-4 h-4" /> {d.vmDown} VM lỗi</span>}
            {(d.vms || []).slice(0, 6).map((v: any, i: number) => (
              <span key={i} className="text-[11px] font-bold text-slate-500 bg-slate-50 rounded-lg px-2 py-1">{v.name || v.vm || v.host || `VM${i + 1}`}</span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2"><Bot className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Bản tin vận hành — Hermes</span>
            {briefTs > 0 && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Tự động · {new Date(briefTs * 1000).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>}
          </div>
          <button onClick={genBrief} disabled={gen || loading} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
            {gen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tạo bản tin vận hành
          </button>
        </div>
        {brief
          ? <div className="relative">
              <button onClick={copy} className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4 pr-16">{brief}</div>
            </div>
          : <p className="text-[12px] text-slate-400">Hermes tự sinh bản tin <b>mỗi 7h sáng</b> (tình hình 3 phòng · điểm nghẽn · 3-5 ưu tiên + giao phòng · cảnh báo). Bấm nút để tạo ngay bản tin mới.</p>}
      </div>
    </div>
  );
};

export default OpsCommand;
