import React, { useEffect, useState } from 'react';
import {
  Crown, Gauge, UserCircle, Zap, HeartHandshake, Users2, TrendingUp, Snowflake, Handshake, BarChart3,
  CheckCircle2, Clock, Lock, Loader2, ArrowRight, ShieldCheck, Users, Flame, MessageSquare
} from 'lucide-react';
import { api } from '../services/apiService';

type St = 'live' | 'partial' | 'soon' | 'locked';
const BADGE: Record<St, { t: string; c: string }> = {
  live: { t: 'Đang hoạt động', c: 'bg-emerald-50 text-emerald-700' },
  partial: { t: 'Một phần', c: 'bg-amber-50 text-amber-700' },
  soon: { t: 'Sắp có', c: 'bg-slate-100 text-slate-500' },
  locked: { t: 'Cần kết nối', c: 'bg-slate-100 text-slate-500' },
};

const BusinessAgency: React.FC<{ onOpen: (s: string) => void }> = ({ onOpen }) => {
  const [k, setK] = useState({ khach: 0, lead: 0, hot: 0, scoped: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s: any = await api.erpMySummary();
        setK({ khach: s.total || 0, lead: (s.Open || 0) + (s.Replied || 0), hot: s.Opportunity || 0, scoped: !!s.scoped });
      } catch {
        try { const cdp: any = await api.getCdpCustomers({ page: 1, pageSize: 1 }); setK(p => ({ ...p, khach: cdp?.total ?? 0 })); } catch { /* */ }
      }
      setLoading(false);
    })();
  }, []);

  const AGENTS: { n: string; role: string; icon: any; status: St; sec?: string; metric: string }[] = [
    { n: 'Giám đốc kinh doanh', role: 'Tổng hợp pipeline, mục tiêu doanh số', icon: Crown, status: 'live', sec: 'report', metric: 'Báo cáo & dự báo' },
    { n: 'Lead scorer', role: 'Chấm điểm tiềm năng từng khách', icon: Gauge, status: 'live', sec: 'customers', metric: 'AI score (đã có)' },
    { n: 'Khách 360', role: 'Hồ sơ 360° + hành vi + trí nhớ', icon: UserCircle, status: 'live', sec: 'customers', metric: 'Profile + mem0' },
    { n: 'Next-best-action', role: 'Hành động kế tiếp + tin nhắn/khách', icon: Zap, status: 'live', sec: 'action', metric: 'Gợi ý hành động' },
    { n: 'Nurture strategist', role: 'Kịch bản chăm sóc theo giai đoạn', icon: HeartHandshake, status: 'live', sec: 'action', metric: 'Playbook AI' },
    { n: 'Sale matcher', role: 'Phân khách ↔ sale phù hợp', icon: Users2, status: 'partial', sec: 'customers', metric: 'Đã có khớp' },
    { n: 'Forecaster', role: 'Dự báo doanh số + sức khoẻ pipeline', icon: TrendingUp, status: 'live', sec: 'report', metric: 'Dự báo AI' },
    { n: 'Báo cáo kinh doanh', role: 'Báo cáo pipeline/doanh số định kỳ', icon: BarChart3, status: 'live', sec: 'report', metric: 'Báo cáo AI' },
    { n: 'Churn / Re-engage', role: 'Phát hiện khách nguội → tái kích hoạt', icon: Snowflake, status: 'partial', sec: 'action', metric: 'Playbook tái kích hoạt' },
    { n: 'Deal coach', role: 'Phân tích deal, xác suất chốt', icon: Handshake, status: 'soon', metric: 'Cần field ERP' },
  ];
  const liveCount = AGENTS.filter(a => a.status === 'live').length;

  const KPIS = [
    { label: k.scoped ? 'Khách của tôi (ERP)' : 'Tổng khách (ERP)', val: k.khach, icon: Users },
    { label: 'Đang xử lý', val: k.lead, icon: MessageSquare },
    { label: 'Cơ hội (nóng)', val: k.hot, icon: Flame },
    { label: 'AI đang chạy', val: `${liveCount}/10`, icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-700 to-indigo-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-5 h-5" /><span className="font-black">Phòng Kinh doanh tự trị bằng AI</span></div>
        <p className="text-sm opacity-90">Đội <b>10 chuyên viên AI</b> vận hành pipeline — chấm điểm, hồ sơ 360, phân khách, chăm sóc, hành động kế tiếp, dự báo, báo cáo — do <b>Hermes</b> chỉ huy, nối CDP·ERP·RAG·mem0. Bạn chỉ <b>chốt deal</b>.</p>
      </div>

      {loading ? <div className="flex justify-center py-6 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPIS.map(x => (
            <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white mb-2"><x.icon className="w-5 h-5" /></div>
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
                className={`text-left bg-white rounded-2xl border border-slate-100 p-4 transition ${open ? 'hover:border-emerald-300 hover:shadow-md' : 'opacity-80 cursor-default'}`}>
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
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">{a.metric}{open && <ArrowRight className="w-3 h-3 text-emerald-500" />}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BusinessAgency;
