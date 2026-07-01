import React, { useEffect, useState } from 'react';
import {
  Megaphone, LayoutDashboard, FileText, Target, Share2, Workflow, BarChart3,
  Users, Database, Loader2, Sparkles, ShieldCheck, Bot, ArrowRight, Clock, Radar, CalendarDays
} from 'lucide-react';
import { api } from '../services/apiService';
import Marketing from './Marketing';
import QuangCaoDaKenh from './QuangCaoDaKenh';
import ContentFactory from './ContentFactory';
import VideoFactory from './VideoFactory';
import ImageFactory from './ImageFactory';
import AutomationHub from './AutomationHub';
import MarketingROI from './MarketingROI';
import AgencyDashboard from './AgencyDashboard';
import CommunityInbox from './CommunityInbox';
import WebTracking from './WebTracking';
import ContentCalendar from './ContentCalendar';

type Sec = 'overview' | 'content' | 'calendar' | 'ads' | 'channels' | 'community' | 'tracking' | 'automation' | 'roi';
const SECTIONS: { id: Sec; label: string; icon: any }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'content', label: 'Content AI', icon: FileText },
  { id: 'calendar', label: 'Lịch nội dung', icon: CalendarDays },
  { id: 'ads', label: 'Quảng cáo', icon: Target },
  { id: 'channels', label: 'Kênh (FB/Zalo)', icon: Share2 },
  { id: 'community', label: 'Trực inbox', icon: Bot },
  { id: 'tracking', label: 'Nguồn khách nét', icon: Radar },
  { id: 'automation', label: 'Tự động hoá', icon: Workflow },
  { id: 'roi', label: 'Báo cáo ROI', icon: BarChart3 },
];
const arr = (x: any): any[] => { const c = Array.isArray(x) ? x : (x?.data?.items || x?.items || x?.data?.data || x?.data); return Array.isArray(c) ? c : []; };

const Overview: React.FC = () => {
  const [k, setK] = useState({ zalo: 0, fb: 0, jobs: 0, cdp: 0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      let uid = '';
      try { const p = await api.mktGet('auth/profile'); uid = p?.data?._id || ''; } catch { /* */ }
      const [za, fb, jb, cdp] = await Promise.allSettled([
        api.mktGet('accounts'), api.mktGet('fb/accounts'),
        api.mktGet('collect/fb/jobs?userId=' + uid + '&page=1&limit=100'),
        (api as any).getCdpCustomers ? (api as any).getCdpCustomers({ page: 1, pageSize: 1 }) : Promise.reject(),
      ]);
      setK({
        zalo: za.status === 'fulfilled' ? arr(za.value).length : 0,
        fb: fb.status === 'fulfilled' ? arr(fb.value).length : 0,
        jobs: jb.status === 'fulfilled' ? arr(jb.value).length : 0,
        cdp: cdp.status === 'fulfilled' ? ((cdp.value as any)?.total ?? (cdp.value as any)?.totalItems ?? arr(cdp.value).length) : 0,
      });
      setLoading(false);
    })();
  }, []);
  const KPIS = [
    { label: 'Kênh Zalo kết nối', val: k.zalo, icon: Share2, color: 'sky' },
    { label: 'Kênh Facebook', val: k.fb, icon: Share2, color: 'blue' },
    { label: 'Việc cào lead', val: k.jobs, icon: Database, color: 'fuchsia' },
    { label: 'Khách trong CDP', val: k.cdp, icon: Users, color: 'emerald' },
  ];
  const FLOWS = [
    { t: 'Content Factory', d: 'Trợ lý AI + kho tài liệu AI sinh bài/caption/kịch bản theo dự án → duyệt → đăng đa kênh', s: 'Đang phát triển (GĐ B)' },
    { t: 'Lead Engine', d: 'Cào lead → CDP → AI chấm điểm → giao 1 sale → Zalo nurture → ERP deal', s: 'Một phần đã chạy' },
    { t: 'Ad Optimizer', d: 'Kéo số liệu Ads → AI tối ưu ngân sách + cảnh báo', s: 'Chờ token Google (GĐ D)' },
    { t: 'Báo cáo ROI', d: 'Trợ lý AI tổng hợp chi phí marketing ↔ doanh thu deal mỗi sáng', s: 'GĐ E' },
  ];
  const C: Record<string, string> = { sky: 'bg-sky-500', blue: 'bg-blue-600', fuchsia: 'bg-fuchsia-600', emerald: 'bg-emerald-600' };
  return (
    <div className="space-y-6">
      {loading ? <div className="flex justify-center py-10 text-indigo-600"><Loader2 className="w-8 h-8 animate-spin" /></div> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIS.map(x => (
            <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${C[x.color]} flex items-center justify-center text-white mb-2`}><x.icon className="w-5 h-5" /></div>
              <p className="text-3xl font-black text-slate-900">{x.val}</p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">{x.label}</p>
            </div>
          ))}
        </div>
      )}
      <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><Bot className="w-5 h-5" /><span className="font-black">Điều phối bởi Trợ lý AI</span></div>
        <p className="text-sm opacity-90">Trợ lý AI lập kế hoạch chiến dịch + giao việc + báo cáo, nối Tự động hoá · CDP · ERP · kho tài liệu AI · Bộ nhớ AI để tự động hoá. Mọi nội dung/quảng cáo/tin gửi khách <b>cần người duyệt</b> trước khi ra ngoài.</p>
      </div>
      <div>
        <h3 className="font-black text-slate-900 mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-fuchsia-600" /> 4 luồng tự động hoá lõi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FLOWS.map(f => (
            <div key={f.t} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <span className="font-black text-slate-900">{f.t}</span>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">{f.s}</span>
              </div>
              <p className="text-[12px] text-slate-500 mt-1 leading-snug">{f.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Soon: React.FC<{ icon: any; title: string; desc: string; phase: string; bullets: string[] }> = ({ icon: Icon, title, desc, phase, bullets }) => (
  <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center max-w-2xl mx-auto">
    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-3"><Icon className="w-7 h-7" /></div>
    <h3 className="text-xl font-black text-slate-900">{title}</h3>
    <p className="text-sm text-slate-500 mt-1">{desc}</p>
    <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full mt-3"><Clock className="w-3.5 h-3.5" /> {phase}</span>
    <div className="mt-4 space-y-2 text-left">
      {bullets.map((b, i) => <div key={i} className="flex items-start gap-2 text-sm text-slate-600"><ArrowRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />{b}</div>)}
    </div>
  </div>
);

const MarketingOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('overview');
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-fuchsia-600 flex items-center justify-center text-white shadow-lg"><Megaphone className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Marketing</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Content · Quảng cáo · Đa kênh · Tự động hoá AI cho sàn BĐS</p>
        </div>
      </header>

      <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {SECTIONS.map(s => {
          const active = sec === s.id; const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSec(s.id)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition ${active ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in duration-300">
        {sec === 'overview' && <AgencyDashboard onOpen={(s) => setSec(s as Sec)} />}
        {sec === 'ads' && <QuangCaoDaKenh />}
        {sec === 'channels' && <Marketing />}
        {sec === 'community' && <CommunityInbox />}
        {sec === 'content' && <div className="space-y-5"><ContentFactory /><ImageFactory /><VideoFactory /></div>}
        {sec === 'calendar' && <ContentCalendar />}
        {sec === 'tracking' && <WebTracking />}
        {sec === 'automation' && <AutomationHub />}
        {sec === 'roi' && <MarketingROI />}
      </div>
    </div>
  );
};

export default MarketingOS;
