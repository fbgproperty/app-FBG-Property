import React from 'react';
import { Workflow, ArrowRight, Search, Database, Sparkles, UserCheck, MessageCircle, FileText, CheckCircle2, Megaphone, Clock, BarChart3 } from 'lucide-react';

const STEP = (icon: any, label: string) => ({ icon, label });
const PIPELINES = [
  {
    name: 'Lead Engine', desc: 'Biến tương tác FB/Zalo thành khách trong CDP, tự giao sale + chăm sóc.',
    steps: [
      STEP(Search, 'Cào lead (FB/Gmaps/comment)'),
      STEP(Database, 'Đưa vào CDP'),
      STEP(Sparkles, 'AI chấm điểm'),
      STEP(UserCheck, 'Giao 1 sale (1 lead 1 chủ)'),
      STEP(MessageCircle, 'Zalo nurture tự động'),
    ],
  },
  {
    name: 'Content Factory', desc: 'Sinh nội dung theo dự án → duyệt → đăng đa kênh theo lịch.',
    steps: [
      STEP(FileText, 'AI sinh nội dung'),
      STEP(CheckCircle2, 'Duyệt'),
      STEP(Megaphone, 'Đăng FB/Zalo/TikTok'),
      STEP(Clock, 'Lên lịch (Tự động hoá)'),
    ],
  },
  {
    name: 'Báo cáo ROI', desc: 'Tổng hợp chi phí ↔ doanh thu mỗi sáng, Trợ lý AI gửi báo cáo.',
    steps: [
      STEP(BarChart3, 'Gom CDP + ERP + Ads'),
      STEP(Sparkles, 'Trợ lý AI tổng hợp'),
      STEP(MessageCircle, 'Gửi kênh thông báo + app'),
    ],
  },
];

const AutomationHub: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2"><Workflow className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Tự động hoá (Trợ lý AI điều phối)</span></div>
      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-black text-sm"><CheckCircle2 className="w-4 h-4" /> Đang vận hành</span>
    </div>

    <div className="space-y-4">
      {PIPELINES.map(p => (
        <div key={p.name} className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="font-black text-slate-900">{p.name}</span>
            <span className="text-[11px] font-black text-slate-400">{p.steps.length} bước</span>
          </div>
          <p className="text-[12px] text-slate-500 mb-3">{p.desc}</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {p.steps.map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl whitespace-nowrap text-[12px] font-bold bg-slate-50 text-slate-600">
                  <s.icon className="w-3.5 h-3.5" />{s.label}
                </div>
                {i < p.steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="flex items-start gap-2 text-[12px] text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
      <Workflow className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <span>Các quy trình được Trợ lý AI điều phối tự động theo lịch tự trị. Một số bước hiện được xử lý thủ công trong app và sẽ dần chuyển sang tự động hoàn toàn.</span>
    </div>
  </div>
);

export default AutomationHub;
