import React, { useEffect, useState } from 'react';
import {
  Building2, ClipboardList, TrendingUp, DollarSign, Newspaper, FileText, Boxes, Briefcase, Users, Crown,
  CheckCircle2, Clock, Lock, Loader2, ArrowRight, ShieldCheck, Database
} from 'lucide-react';
import { api } from '../services/apiService';

type St = 'live' | 'partial' | 'soon' | 'locked';
const BADGE: Record<St, { t: string; c: string }> = {
  live: { t: 'Đang hoạt động', c: 'bg-emerald-50 text-emerald-700' },
  partial: { t: 'Một phần', c: 'bg-amber-50 text-amber-700' },
  soon: { t: 'Sắp có', c: 'bg-slate-100 text-slate-500' },
  locked: { t: 'Cần kết nối', c: 'bg-slate-100 text-slate-500' },
};

const EstateAgency: React.FC<{ onOpen: (s: string) => void }> = ({ onOpen }) => {
  const [k, setK] = useState({ projects: 0, properties: 0, sources: 0, cdp: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [pj, pr, sr, cdp] = await Promise.allSettled([
        api.getProjectsCbx(),
        api.getRaiProperties({ page: 1, pageSize: 1 } as any),
        api.getRaiPropertySources(),
        api.getCdpCustomers({ page: 1, pageSize: 1 }),
      ]);
      const cnt = (x: any) => (x?.total ?? x?.totalItems ?? x?.data?.total ?? (x?.items?.length) ?? (Array.isArray(x?.data) ? x.data.length : 0) ?? 0);
      setK({
        projects: pj.status === 'fulfilled' ? ((pj.value as any)?.items?.length ?? (pj.value as any)?.data?.items?.length ?? cnt(pj.value)) : 0,
        properties: pr.status === 'fulfilled' ? cnt(pr.value) : 0,
        sources: sr.status === 'fulfilled' ? ((sr.value as any)?.length ?? (sr.value as any)?.data?.length ?? 0) : 0,
        cdp: cdp.status === 'fulfilled' ? cnt(cdp.value) : 0,
      });
      setLoading(false);
    })();
  }, []);

  const AGENTS: { n: string; role: string; icon: any; status: St; sec?: string; metric: string }[] = [
    { n: 'Giám đốc sàn', role: 'Tổng hợp rổ hàng, xếp ưu tiên đẩy bán', icon: Crown, status: 'live', sec: 'saleplan', metric: 'Chiến lược danh mục' },
    { n: 'Sales planner', role: 'Lập kế hoạch bán từng dự án', icon: ClipboardList, status: 'live', sec: 'saleplan', metric: 'Kế hoạch bán (AI+RAG)' },
    { n: 'Market researcher', role: 'Nghiên cứu thị trường đa nguồn', icon: TrendingUp, status: 'live', sec: 'market', metric: 'Báo cáo thị trường' },
    { n: 'Pricing analyst', role: 'Định vị & khuyến nghị giá', icon: DollarSign, status: 'live', sec: 'market', metric: 'Benchmark giá' },
    { n: 'Auto-poster', role: 'Sinh + đăng tin đa kênh', icon: Newspaper, status: 'live', sec: 'listing', metric: 'Tin đăng (web/FB/Zalo)' },
    { n: 'Project content', role: 'Biên tập hồ sơ dự án bám tài liệu', icon: FileText, status: 'live', sec: 'listing', metric: 'Hồ sơ dự án AI' },
    { n: 'Listing manager', role: 'Soi chất lượng rổ hàng', icon: Boxes, status: 'partial', sec: 'data', metric: 'Dữ liệu BĐS' },
    { n: 'Inventory tracker', role: 'Theo dõi giỏ hàng & hấp thụ', icon: Database, status: 'partial', sec: 'deploy', metric: 'Triển khai dự án' },
    { n: 'Investor matcher', role: 'Khớp nhà đầu tư ↔ dự án', icon: Briefcase, status: 'soon', metric: 'Cần data NĐT' },
    { n: 'Deal coordinator', role: 'Phân khách → sale → ERP', icon: Users, status: 'partial', sec: 'deploy', metric: 'Đã có khớp sale' },
  ];
  const liveCount = AGENTS.filter(a => a.status === 'live').length;

  const KPIS = [
    { label: 'Dự án trên sàn', val: k.projects, icon: Building2 },
    { label: 'Listing nhà/căn hộ', val: k.properties, icon: Boxes },
    { label: 'Nguồn dữ liệu', val: k.sources, icon: Database },
    { label: 'AI đang chạy', val: `${liveCount}/10`, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-indigo-700 to-emerald-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-5 h-5" /><span className="font-black">Sàn BĐS tự trị bằng AI</span></div>
        <p className="text-sm opacity-90">Đội <b>10 chuyên viên AI</b> vận hành toàn bộ sàn — rổ hàng, kế hoạch bán, nghiên cứu thị trường, đăng tin, phân phối — do <b>Trợ lý AI</b> chỉ huy, nối ERP·RAG·CDP·Website. Bạn chỉ <b>duyệt + chốt</b>.</p>
      </div>

      {loading ? <div className="flex justify-center py-6 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIS.map(x => (
            <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white mb-2"><x.icon className="w-5 h-5" /></div>
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
                className={`text-left bg-white rounded-2xl border border-slate-100 p-4 transition ${open ? 'hover:border-indigo-300 hover:shadow-md' : 'opacity-80 cursor-default'}`}>
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
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">{a.metric}{open && <ArrowRight className="w-3 h-3 text-indigo-500" />}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EstateAgency;
