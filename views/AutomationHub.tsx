import React from 'react';
import { Workflow, ArrowRight, CheckCircle2, Clock, ExternalLink, Search, Database, Sparkles, UserCheck, MessageCircle, FileText, Megaphone, BarChart3 } from 'lucide-react';

const STEP = (icon: any, label: string, done: boolean) => ({ icon, label, done });
const PIPELINES = [
  {
    name: 'Lead Engine', desc: 'Biến tương tác FB/Zalo thành khách trong CDP, tự giao sale + chăm sóc.',
    steps: [
      STEP(Search, 'Cào lead (FB/Gmaps/comment)', true),
      STEP(Database, 'Đưa vào CDP', true),
      STEP(Sparkles, 'AI chấm điểm', false),
      STEP(UserCheck, 'Giao 1 sale (1 lead 1 chủ)', false),
      STEP(MessageCircle, 'Zalo nurture tự động', true),
    ],
  },
  {
    name: 'Content Factory', desc: 'Sinh nội dung theo dự án → duyệt → đăng đa kênh theo lịch.',
    steps: [
      STEP(FileText, 'AI sinh nội dung (RAG)', true),
      STEP(CheckCircle2, 'Duyệt', false),
      STEP(Megaphone, 'Đăng FB/Zalo/TikTok', false),
      STEP(Clock, 'Lên lịch (Tự động hoá)', false),
    ],
  },
  {
    name: 'Báo cáo ROI', desc: 'Tổng hợp chi phí ↔ doanh thu mỗi sáng, Trợ lý AI gửi Anh Duy.',
    steps: [
      STEP(BarChart3, 'Gom CDP + ERP + Ads', false),
      STEP(Sparkles, 'Trợ lý AI tổng hợp', false),
      STEP(MessageCircle, 'Gửi Telegram + app', false),
    ],
  },
];

const AutomationHub: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-2"><Workflow className="w-5 h-5 text-indigo-600" /><span className="font-black text-slate-900">Tự động hoá (Trợ lý AI điều phối)</span></div>
      <a href="https://n8n.fbgproperty.vn" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700"><ExternalLink className="w-4 h-4" /> Mở công cụ tự động hoá</a>
    </div>

    <div className="space-y-4">
      {PIPELINES.map(p => (
        <div key={p.name} className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="font-black text-slate-900">{p.name}</span>
            <span className="text-[11px] font-black text-slate-400">{p.steps.filter(s => s.done).length}/{p.steps.length} bước đã chạy</span>
          </div>
          <p className="text-[12px] text-slate-500 mb-3">{p.desc}</p>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {p.steps.map((s, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl whitespace-nowrap text-[12px] font-bold ${s.done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
                  <s.icon className="w-3.5 h-3.5" />{s.label}{s.done ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                </div>
                {i < p.steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>

    <div className="flex items-start gap-2 text-[12px] text-slate-500 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
      <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <span>Các bước <b>chưa chạy</b> (AI chấm điểm, giao sale, duyệt, đăng đa kênh, báo cáo) sẽ được nối thành quy trình tự động trên <b>công cụ tự động hoá</b> + lịch tự trị của Trợ lý AI — cần bật ở máy chủ (cấu hình + thông tin kết nối). Bước "đã chạy" hiện làm thủ công trong app.</span>
    </div>
  </div>
);

export default AutomationHub;
