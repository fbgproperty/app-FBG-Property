import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, ArrowRight, Sparkles, Building2, Megaphone, Briefcase, Cpu, BarChart3, Bot,
  Users, Boxes, Zap, CheckCircle2, Brain, MessageSquare, TrendingUp
} from 'lucide-react';

const OS = [
  { icon: Bot, name: 'Trợ lý AI', d: 'Bộ não AI chỉ huy toàn bộ, ra lệnh bằng hội thoại', c: 'from-indigo-600 to-violet-600' },
  { icon: Building2, name: 'Sàn Bất động sản', d: 'Rổ hàng · kế hoạch bán · nghiên cứu thị trường · đăng tin', c: 'from-indigo-600 to-blue-600' },
  { icon: Megaphone, name: 'Marketing', d: 'Content · ảnh · video · quảng cáo · đa kênh · trực inbox 24/7', c: 'from-fuchsia-600 to-pink-600' },
  { icon: Briefcase, name: 'Kinh doanh', d: 'Khách 360 · chấm điểm · hành động kế tiếp · dự báo', c: 'from-emerald-600 to-teal-600' },
  { icon: Cpu, name: 'Vận hành', d: 'Công việc ERP · tự động hoá · đội ngũ · tổ chức', c: 'from-slate-700 to-slate-900' },
  { icon: ShieldCheck, name: 'Công nghệ', d: 'Hạ tầng · chi phí · người dùng · phân quyền', c: 'from-slate-600 to-gray-700' },
  { icon: BarChart3, name: 'Báo cáo', d: 'Tổng hợp toàn hệ thống do Trợ lý AI soạn', c: 'from-indigo-700 to-slate-900' },
];

const VALUES = [
  { icon: Brain, t: 'Mỗi nhân sự có một đội AI riêng', d: '30+ chuyên viên AI chia 3 phòng (Marketing · BĐS · Kinh doanh) hỗ trợ từng người tự động.' },
  { icon: MessageSquare, t: 'Bám tài liệu thật của dự án', d: 'Mọi nội dung, tư vấn, kế hoạch đều grounded RAG từ tài liệu chủ đầu tư — không bịa.' },
  { icon: TrendingUp, t: 'Tăng hiệu quả, giảm việc tay', d: 'AI soạn content, dựng video, chấm điểm khách, gợi ý hành động — nhân sự chỉ duyệt & chốt deal.' },
  { icon: Zap, t: 'Trợ lý AI điều phối tự trị', d: 'Một bộ não AI nối ERP · CDP · RAG · Bộ nhớ AI · Website · Zalo — vận hành xuyên suốt.' },
];

const STATS = [
  { v: '7', l: 'Hệ điều hành AI (OS)' },
  { v: '30+', l: 'Chuyên viên AI' },
  { v: '13', l: 'Dự án grounded RAG' },
  { v: '6.000+', l: 'Khách trong CDP' },
];

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
          <div className="leading-none">
            <div className="font-black text-lg">FBG Property</div>
            <div className="text-[10px] text-indigo-300 font-bold tracking-widest uppercase">AI Proptech</div>
          </div>
        </div>
        <Link to="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 rounded-xl font-black text-sm hover:bg-indigo-50 transition">
          Đăng nhập <ArrowRight className="w-4 h-4" />
        </Link>
      </nav>

      {/* Hero */}
      <header className="relative px-6 md:px-12 pt-12 pb-20 max-w-5xl mx-auto text-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.25),transparent_60%)]" />
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-indigo-300 mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Doanh nghiệp BĐS vận hành toàn diện bằng AI
        </div>
        <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
          Bất động sản FBG Property<br /><span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">nâng hiệu quả nhân sự bằng AI</span>
        </h1>
        <p className="text-slate-300 text-lg mt-6 max-w-2xl mx-auto leading-relaxed">
          Một hệ điều hành doanh nghiệp do <b className="text-white">Trợ lý AI</b> chỉ huy: 30+ chuyên viên AI làm marketing, bán hàng, vận hành — để mỗi nhân sự FBG làm việc như có cả một đội ngũ phía sau.
        </p>
        <div className="flex items-center justify-center gap-3 mt-9">
          <Link to="/login" className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-fuchsia-600 rounded-xl font-black hover:opacity-90 transition shadow-lg shadow-indigo-600/30">
            Vào hệ thống <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#he-thong" className="px-7 py-3.5 border border-white/15 rounded-xl font-black text-sm hover:bg-white/5 transition">Khám phá hệ thống</a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
          {STATS.map(s => (
            <div key={s.l} className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">{s.v}</div>
              <div className="text-[11px] text-slate-400 font-bold mt-1">{s.l}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Vì sao */}
      <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {VALUES.map(v => {
            const Icon = v.icon;
            return (
              <div key={v.t} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shrink-0"><Icon className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-black text-lg">{v.t}</h3>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">{v.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7 OS */}
      <section id="he-thong" className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black">7 Hệ điều hành — một doanh nghiệp AI</h2>
          <p className="text-slate-400 mt-3">Mỗi phòng ban là một OS do Trợ lý AI điều phối, nối liền dữ liệu thật.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {OS.map(o => {
            const Icon = o.icon;
            return (
              <div key={o.name} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-indigo-400/40 transition">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${o.c} flex items-center justify-center mb-3`}><Icon className="w-6 h-6" /></div>
                <h3 className="font-black text-lg">{o.name}</h3>
                <p className="text-slate-400 text-sm mt-1 leading-relaxed">{o.d}</p>
              </div>
            );
          })}
          <div className="bg-gradient-to-br from-indigo-600/20 to-fuchsia-600/20 border border-indigo-400/30 rounded-2xl p-5 flex flex-col justify-center">
            <div className="flex items-center gap-2 font-black text-lg"><Sparkles className="w-5 h-5 text-fuchsia-400" /> Văn phòng 3D</div>
            <p className="text-slate-300 text-sm mt-1">Nhân viên AI làm việc trong văn phòng 3D thật — nhìn được toàn bộ hoạt động công ty.</p>
          </div>
        </div>
      </section>

      {/* CTA cuối */}
      <section className="px-6 md:px-12 py-16 max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-br from-indigo-600 to-fuchsia-600 rounded-3xl p-10">
          <h2 className="text-3xl font-black">Sẵn sàng làm việc cùng đội AI của bạn?</h2>
          <p className="text-white/80 mt-3 max-w-xl mx-auto">Đăng nhập để vào hệ thống — mỗi nhân sự FBG đều có đội chuyên viên AI hỗ trợ marketing, bán hàng và vận hành.</p>
          <Link to="/login" className="inline-flex items-center gap-2 px-8 py-4 mt-7 bg-white text-slate-900 rounded-xl font-black hover:bg-indigo-50 transition">
            Đăng nhập hệ thống <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="px-6 md:px-12 py-8 max-w-7xl mx-auto border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-slate-500">
        <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> <b className="text-slate-300">FBG Property</b> — Proptech vận hành bằng AI</div>
        <div>© 2026 FBG Property · info@fbgproperty.vn</div>
      </footer>
    </div>
  );
};

export default LandingPage;
