import React, { useEffect, useState } from 'react';
import {
  Brain, FileText, Image as ImageIcon, Video, Share2, Target, Search, MessageCircle, Bot, BarChart3,
  CheckCircle2, Clock, Lock, Users, Database, Loader2, ArrowRight, ShieldCheck, Sparkles
} from 'lucide-react';
import { api } from '../services/apiService';
import AgentRunner from './AgentRunner';

const arr = (x: any): any[] => { const c = Array.isArray(x) ? x : (x?.data?.items || x?.items || x?.data?.data || x?.data); return Array.isArray(c) ? c : []; };
type St = 'live' | 'partial' | 'soon' | 'locked';
const BADGE: Record<St, { t: string; c: string }> = {
  live: { t: 'Đang hoạt động', c: 'bg-emerald-50 text-emerald-700' },
  partial: { t: 'Một phần', c: 'bg-amber-50 text-amber-700' },
  soon: { t: 'Sắp có', c: 'bg-slate-100 text-slate-500' },
  locked: { t: 'Cần kết nối', c: 'bg-slate-100 text-slate-500' },
};

const AgencyDashboard: React.FC<{ onOpen: (s: string) => void }> = ({ onOpen }) => {
  const [k, setK] = useState({ zalo: 0, fb: 0, jobs: 0, cdp: 0 });
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('bạn');
  const [runAgent, setRunAgent] = useState<{ n: string; role: string } | null>(null);

  useEffect(() => {
    try { const u = JSON.parse(localStorage.getItem('fbg_user') || '{}'); if (u?.name) setName(u.name); } catch { /* */ }
    (async () => {
      let uid = ''; try { const p = await api.mktGet('auth/profile'); uid = p?.data?._id || ''; } catch { /* */ }
      const [za, fb, jb, cdp] = await Promise.allSettled([
        api.mktGet('accounts'), api.mktGet('fb/accounts'),
        api.mktGet('collect/fb/jobs?userId=' + uid + '&page=1&limit=100'),
        api.getCdpCustomers({ page: 1, pageSize: 1 }),
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

  const AGENTS: { n: string; role: string; icon: any; status: St; sec?: string; metric: string }[] = [
    { n: 'Giám đốc chiến lược', role: 'Lập kế hoạch chiến dịch theo dự án', icon: Brain, status: 'live', sec: 'content', metric: 'Lập kế hoạch (AI)' },
    { n: 'Copywriter', role: 'Viết nội dung bám tài liệu dự án', icon: FileText, status: 'live', sec: 'content', metric: 'Sinh nội dung AI' },
    { n: 'Designer', role: 'Banner / ảnh quảng cáo AI', icon: ImageIcon, status: 'live', sec: 'content', metric: 'Ảnh AI' },
    { n: 'Video editor', role: 'Dựng video từ ảnh dự án thật', icon: Video, status: 'live', sec: 'content', metric: 'Video AI' },
    { n: 'Channel manager', role: 'Đăng / gửi đa kênh', icon: Share2, status: 'live', sec: 'channels', metric: `${k.zalo} kênh Zalo` },
    { n: 'Ads manager', role: 'AI tạo chiến dịch + creative quảng cáo', icon: Target, status: 'live', sec: 'ads', metric: 'AI chiến dịch (cần kết nối kênh ads)' },
    { n: 'Lead hunter', role: 'Săn lead FB/Gmaps → CDP', icon: Search, status: 'live', sec: 'channels', metric: `${k.jobs} việc cào` },
    { n: 'Nurture bot', role: 'Chăm khách tự động (Zalo)', icon: MessageCircle, status: 'live', sec: 'channels', metric: 'Gửi + AI gợi ý' },
    { n: 'Community manager', role: 'Trả lời inbox Zalo 24/7', icon: Bot, status: 'live', sec: 'community', metric: 'Auto-reply (AI)' },
    { n: 'Analyst', role: 'Báo cáo hiệu quả + ROI', icon: BarChart3, status: 'live', sec: 'roi', metric: 'Báo cáo AI + ROI' },
  ];
  const liveCount = AGENTS.filter(a => a.status === 'live').length;

  const KPIS = [
    { label: 'Kênh kết nối', val: k.zalo + k.fb, icon: Share2 },
    { label: 'Việc săn lead', val: k.jobs, icon: Database },
    { label: 'Khách trong CDP', val: k.cdp, icon: Users },
    { label: 'AI đang chạy', val: `${liveCount}/10`, icon: Bot },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-5 h-5" /><span className="font-black">Phòng Marketing AI của {name}</span></div>
        <p className="text-sm opacity-90">Đội <b>10 chuyên viên AI</b> phục vụ riêng bạn — sản xuất nội dung, chạy kênh, săn lead, chăm khách, báo cáo — do <b>Trợ lý AI</b> chỉ huy, nối CDP·ERP·kho tài liệu·Bộ nhớ AI. Bạn chỉ <b>duyệt + chốt deal</b>.</p>
      </div>

      {loading ? <div className="flex justify-center py-6 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIS.map(x => (
            <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="w-10 h-10 rounded-xl bg-fuchsia-600 flex items-center justify-center text-white mb-2"><x.icon className="w-5 h-5" /></div>
              <p className="text-2xl font-black text-slate-900">{x.val}</p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">{x.label}</p>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="font-black text-slate-900 mb-3">Đội chuyên viên AI ({liveCount}/10 đang chạy)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {AGENTS.map((a, i) => {
            const Icon = a.icon; const open = !!a.sec;
            return (
              <button key={i} disabled={!open} onClick={() => a.sec && onOpen(a.sec)}
                className={`text-left bg-white rounded-2xl border border-slate-100 p-4 transition ${open ? 'hover:border-fuchsia-300 hover:shadow-md' : 'opacity-80 cursor-default'}`}>
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.status === 'live' ? 'bg-emerald-50 text-emerald-600' : a.status === 'partial' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black text-slate-900 text-sm leading-tight">{a.n}</div>
                    <div className="text-[11px] text-slate-400 font-bold truncate">{a.role}</div>
                  </div>
                  {a.status === 'live' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : a.status === 'locked' ? <Lock className="w-4 h-4 text-slate-300 shrink-0" /> : <Clock className="w-4 h-4 text-slate-300 shrink-0" />}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${BADGE[a.status].c}`}>{BADGE[a.status].t}</span>
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">{a.metric}{open && <ArrowRight className="w-3 h-3 text-fuchsia-500" />}</span>
                </div>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); setRunAgent({ n: a.n, role: a.role }); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setRunAgent({ n: a.n, role: a.role }); } }}
                  className="mt-3 w-full py-2 bg-fuchsia-600 text-white text-[11px] font-black rounded-xl hover:bg-fuchsia-700 transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Giao việc
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-1"><CheckCircle2 className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Việc cần bạn duyệt</span></div>
        <p className="text-[12px] text-slate-400">Khi AI soạn nội dung / tin gửi / chiến dịch quảng cáo, việc cần duyệt sẽ hiện ở đây để bạn bấm duyệt 1 chạm. (Hàng đợi duyệt — nối ở giai đoạn tự động hoá.)</p>
      </div>

      {runAgent && <AgentRunner agent={runAgent} onClose={() => setRunAgent(null)} />}
    </div>
  );
};

export default AgencyDashboard;
