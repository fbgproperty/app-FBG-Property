import React, { useEffect, useState } from 'react';
import { Users, MessageSquare, Building2, Boxes, Share2, ClipboardCheck, Server, Loader2, Sparkles, Copy, Check, Bot } from 'lucide-react';
import { api } from '../services/apiService';

const tot = (x: any) => (x?.total ?? x?.totalItems ?? x?.data?.total ?? (x?.items?.length) ?? 0);
const arr = (x: any): any[] => { const c = Array.isArray(x) ? x : (x?.data?.items || x?.items || x?.data?.data || x?.data); return Array.isArray(c) ? c : []; };

const ReportOverview: React.FC = () => {
  const [d, setD] = useState<any>({ khach: 0, lead: 0, duan: 0, listing: 0, kenh: 0, congviec: 0, vmUp: 0 });
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState('');
  const [gen, setGen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      let uid = ''; try { const p = await api.mktGet('auth/profile'); uid = p?.data?._id || ''; } catch { /* */ }
      const [cdp, leads, pj, pr, acc, tasks, infra] = await Promise.allSettled([
        api.getCdpCustomers({ page: 1, pageSize: 1 }),
        api.getLeads({ page: 1, pageSize: 1 } as any),
        api.getProjectsCbx(),
        api.getRaiProperties({ page: 1, pageSize: 1 } as any),
        api.mktGet('accounts'),
        api.opsTasksSummary(),
        api.infraOverview(),
      ]);
      const ts: any = tasks.status === 'fulfilled' ? tasks.value : {};
      const cv = Object.values(ts).reduce((a: number, b: any) => a + (Number(b) || 0), 0);
      const inf: any = infra.status === 'fulfilled' ? infra.value : {};
      const vms = arr(inf?.vms || inf?.servers);
      setD({
        khach: cdp.status === 'fulfilled' ? tot(cdp.value) : 0,
        lead: leads.status === 'fulfilled' ? tot(leads.value) : 0,
        duan: pj.status === 'fulfilled' ? ((pj.value as any)?.items?.length ?? tot(pj.value)) : 0,
        listing: pr.status === 'fulfilled' ? tot(pr.value) : 0,
        kenh: acc.status === 'fulfilled' ? arr(acc.value).length : 0,
        congviec: cv,
        vmUp: vms.length || 0,
      });
      setLoading(false);
    })();
  }, []);

  const genReport = async () => {
    setGen(true); setReport('');
    try {
      const r = await api.opsBrief({
        marketing: { kenh: d.kenh, agent_live: 10 },
        bds: { du_an: d.duan, listing: d.listing, agent_live: 6 },
        kinh_doanh: { khach: d.khach, lead: d.lead, agent_live: 6 },
        van_hanh: { cong_viec_erp: d.congviec },
        ha_tang: { vm_up: d.vmUp },
      }, 'tuần này');
      setReport(r?.text || '');
    } catch (e: any) { setReport('Lỗi: ' + (e?.message || '')); }
    setGen(false);
  };
  const copy = () => { navigator.clipboard?.writeText(report); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const KPIS = [
    { label: 'Khách (CDP)', val: d.khach, icon: Users, c: 'bg-emerald-600' },
    { label: 'Lead', val: d.lead, icon: MessageSquare, c: 'bg-fuchsia-600' },
    { label: 'Dự án', val: d.duan, icon: Building2, c: 'bg-indigo-600' },
    { label: 'Listing', val: d.listing, icon: Boxes, c: 'bg-blue-600' },
    { label: 'Kênh', val: d.kenh, icon: Share2, c: 'bg-sky-500' },
    { label: 'Công việc ERP', val: d.congviec, icon: ClipboardCheck, c: 'bg-slate-700' },
    { label: 'VM hoạt động', val: d.vmUp, icon: Server, c: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><Bot className="w-5 h-5" /><span className="font-black">Báo cáo tổng hợp toàn hệ thống</span></div>
        <p className="text-sm opacity-90">Gom số liệu thật từ 3 phòng AI + vận hành + hạ tầng. Hermes viết báo cáo tổng cho CEO.</p>
      </div>

      <a href="https://openclaw.fbgproperty.vn" target="_blank" rel="noreferrer" className="block bg-gradient-to-br from-rose-600 to-orange-500 rounded-3xl p-6 text-white hover:opacity-95 transition">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1"><Bot className="w-5 h-5" /><span className="font-black">OpenClaw — Trung tâm giám sát hệ thống</span></div>
            <p className="text-sm opacity-90 max-w-2xl">OpenClaw theo dõi toàn bộ Office FBG + nền tảng, tổng hợp báo cáo giám sát toàn hệ thống. Mở trung tâm OpenClaw để xem giám sát chi tiết.</p>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-rose-600 rounded-xl font-black text-sm shrink-0">Mở OpenClaw →</span>
        </div>
      </a>

      {loading ? <div className="flex justify-center py-8 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {KPIS.map(x => (
            <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className={`w-9 h-9 rounded-xl ${x.c} flex items-center justify-center text-white mb-2`}><x.icon className="w-4 h-4" /></div>
              <p className="text-2xl font-black text-slate-900">{x.val}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{x.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Báo cáo tổng — Hermes</span></div>
          <button onClick={genReport} disabled={gen || loading} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
            {gen ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tạo báo cáo tổng
          </button>
        </div>
        {report
          ? <div className="relative">
              <button onClick={copy} className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>
              <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4 pr-16">{report}</div>
            </div>
          : <p className="text-[12px] text-slate-400">Tổng hợp tình hình 3 phòng + vận hành + hạ tầng → ưu tiên + cảnh báo. Xem báo cáo chi tiết từng mảng ở các tab bên cạnh.</p>}
      </div>
    </div>
  );
};

export default ReportOverview;
