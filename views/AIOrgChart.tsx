import React, { useState } from 'react';
import { Crown, Briefcase, Building2, Megaphone, HeartHandshake, Users, Phone, Bot, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

// ===== Sơ đồ tổ chức đội ngũ AI (Hermes) — định danh theo VAI TRÒ =====
// Cấu trúc nông 2 tầng theo chiến lược: Commander → GĐ → trưởng nhóm → worker.
// "sponsor" = người chịu trách nhiệm cho agent vai trò đó.

type Node = {
  role: string; label: string; agent: string; dept: string;
  sponsor?: string; kpi: string; icon: any; color: string; children?: Node[];
};

const sales = (from: number, to: number): Node[] =>
  Array.from({ length: to - from + 1 }, (_, i) => ({
    role: 'sale', label: `Sale ${from + i}`, agent: `hermes-sale${from + i}`, dept: 'Kinh doanh',
    kpi: 'Tốc độ <5 phút · số hẹn · cuộc/ngày', icon: Phone, color: 'slate',
  }));

const ORG: Node = {
  role: 'ceo', label: 'CEO · Tham mưu trưởng', agent: 'ceo (duymp)', dept: 'Ban điều hành',
  sponsor: 'Anh Duy', kpi: 'Đạt chỉ tiêu công ty · độ phủ pipeline', icon: Crown, color: 'amber',
  children: [
    {
      role: 'gd_kinh_doanh', label: 'GĐ Kinh doanh', agent: 'gdkd', dept: 'Kinh doanh',
      sponsor: 'Anh Duy', kpi: 'Chỉ tiêu nhóm · win rate 20-30%', icon: Briefcase, color: 'indigo',
      children: [
        {
          role: 'tp_kinh_doanh', label: 'Trưởng nhóm A', agent: 'team-lead-a', dept: 'Kinh doanh',
          kpi: 'Số hẹn · SQL→cơ hội', icon: Users, color: 'blue', children: sales(1, 8),
        },
        {
          role: 'tp_kinh_doanh', label: 'Trưởng nhóm B', agent: 'team-lead-b', dept: 'Kinh doanh',
          kpi: 'Số hẹn · SQL→cơ hội', icon: Users, color: 'blue', children: sales(9, 16),
        },
      ],
    },
    {
      role: 'gd_du_an', label: 'GĐ Dự án', agent: 'gdda', dept: 'Dự án',
      sponsor: 'Anh Duy', kpi: 'Độ chính xác RAG · độ mới tài liệu', icon: Building2, color: 'emerald',
      children: [
        { role: 'project', label: 'Agent kiến thức dự án', agent: 'rag-per-project', dept: 'Dự án',
          kpi: '1 agent/dự án · RAG riêng (10/13 dự án)', icon: Sparkles, color: 'teal' },
      ],
    },
    {
      role: 'marketing', label: 'Marketing · Lead-gen', agent: 'marketing', dept: 'Marketing',
      kpi: 'Số lead · CPL · lead→SQL', icon: Megaphone, color: 'fuchsia',
    },
    {
      role: 'cham_soc', label: 'Chăm sóc khách', agent: 'maily', dept: 'CSKH',
      sponsor: 'Anh Duy', kpi: 'CSAT · NPS · tỷ lệ giới thiệu', icon: HeartHandshake, color: 'rose',
    },
  ],
};

const COLORS: Record<string, string> = {
  amber: 'bg-amber-500', indigo: 'bg-indigo-600', emerald: 'bg-emerald-600', blue: 'bg-blue-500',
  fuchsia: 'bg-fuchsia-600', rose: 'bg-rose-500', teal: 'bg-teal-500', slate: 'bg-slate-400',
};

const NodeCard: React.FC<{ n: Node; depth: number }> = ({ n, depth }) => {
  const [open, setOpen] = useState(depth < 2);
  const Icon = n.icon;
  const hasKids = !!n.children?.length;
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-start gap-2">
        {hasKids && (
          <button onClick={() => setOpen(o => !o)} className="mt-3 text-slate-400 hover:text-slate-600">
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
        <div className={`relative rounded-2xl border border-slate-100 bg-white shadow-sm px-4 py-3 min-w-[230px] ${depth === 0 ? 'ring-2 ring-amber-200' : ''}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${COLORS[n.color]} flex items-center justify-center text-white shrink-0`}><Icon className="w-5 h-5" /></div>
            <div className="min-w-0">
              <div className="font-black text-slate-900 text-sm leading-tight">{n.label}</div>
              <div className="text-[11px] text-slate-400 font-bold">{n.agent} · {n.dept}</div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 leading-snug"><b className="text-slate-600">KPI:</b> {n.kpi}</div>
          {n.sponsor && <div className="text-[10px] text-amber-600 font-bold mt-1">Người bảo trợ: {n.sponsor}</div>}
        </div>
      </div>
      {hasKids && open && (
        <div className="ml-6 mt-2 pl-5 border-l-2 border-dashed border-slate-200 flex flex-col gap-2">
          {n.children!.map((c, i) => <NodeCard key={i} n={c} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
};

const AIOrgChart: React.FC = () => {
  const totalSales = 16;
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><Bot className="w-6 h-6" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-none">Sơ đồ đội ngũ AI</h2>
            <p className="text-sm text-slate-400 font-semibold mt-1">Định danh theo vai trò · ai dưới quyền ai · Anh Duy là Hội đồng quản trị</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs font-black">
          <span className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">CEO 1</span>
          <span className="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">GĐ 3</span>
          <span className="px-3 py-2 rounded-xl bg-slate-50 text-slate-600 border border-slate-200">Sale {totalSales}</span>
        </div>
      </header>

      <div className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm text-slate-700">
        <b className="text-amber-700">Nguyên tắc:</b> AI Commander (CEO agent) lập kế hoạch + giao việc + báo cáo <b>Anh Duy duyệt</b>.
        Mọi tin gửi khách / cuộc gọi / báo giá / cọc / hợp đồng <b>phải có người duyệt</b>. AI làm số lượng & tốc độ; sale người chốt.
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 p-5 overflow-x-auto">
        <NodeCard n={ORG} depth={0} />
      </div>
    </div>
  );
};

export default AIOrgChart;
