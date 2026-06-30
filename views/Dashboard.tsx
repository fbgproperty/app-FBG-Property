// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
// import { getAIDashboardData, simulateIncomingLeads, runAIAgentProcessing } from '../services/geminiService';
import { api } from '../services/apiService';
import OfficeEmbed from './OfficeEmbed';
import WorkTimeline from './WorkTimeline';
import {
  Building2,
  Users,
  Bot,
  TrendingUp,
  Loader2,
  Activity,
  Zap,
  Rocket,
  MessageSquare,
  ShieldCheck,
  Cloud,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type DashboardData = {
  stats: {
    activeProjects: number;
    totalLeads: number;
    activeAgents: number;
    revenue: number;
  };
  chartData: Array<{ name: string; leads: number }>;
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simLog, setSimLog] = useState<string[]>([]);
  const [simProgress, setSimProgress] = useState(0);

  const loadData = async () => {
    try {
      const res = await api.getAIDashboardData();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSimulateLeads = async () => {
    try {
      setSimulating(true);
      setSimProgress(0);
      setSimLog([
        'Hệ thống: Khởi động chiến dịch Marketing...',
        'Hệ thống: Đang kết nối Google Ads & Facebook API...',
      ]);

      await new Promise((resolve) => setTimeout(resolve, 800));

      const news = await api.simulateIncomingLeads(5);
      setSimLog((prev) => [
        ...prev,
        `Hệ thống: Đã thu thập ${news.length} Leads mới!`,
        'AI: Đang xử lý định danh CDP...',
      ]);

      await loadData();
    } catch (e: any) {
      setSimLog((prev) => [`Lỗi: ${e?.message || 'Không xác định'}`, ...prev].slice(0, 6));
    } finally {
      setSimulating(false);
      setSimProgress(0);
    }
  };

  const handleRunAIProcess = async () => {
    try {
      setSimulating(true);
      setSimProgress(0);
      setSimLog(['AI Agent: Bắt đầu quét dữ liệu khách hàng...', 'AI Agent: Đang truy vấn Gemini Flash...']);

      await api.runAIAgentProcessing((progress, msg) => {
        setSimProgress(progress);
        setSimLog((prev) => [msg, ...prev].slice(0, 5));
      });

      await loadData();
    } catch (e: any) {
      setSimLog((prev) => [`Lỗi: ${e?.message || 'Không xác định'}`, ...prev].slice(0, 6));
    } finally {
      setSimulating(false);
      setSimProgress(0);
    }
  };

  if (loading || !data)
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold uppercase tracking-widest text-xs">Đang đồng bộ hạ tầng GCP...</p>
      </div>
    );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-3 shrink-0">
        <div>
          <h2 className="text-xl font-black text-gray-900 leading-none">Office FBG</h2>
          <p className="text-gray-400 font-medium mt-1 text-xs">Văn phòng 3D — toàn bộ nhân viên AI trao đổi công việc tập trung qua Hermes · OpenClaw (Telegram)</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100 shrink-0">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          GCP Multi-Region Active
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-9 min-h-0"><OfficeEmbed /></div>
        <div className="lg:col-span-3 min-h-0"><WorkTimeline /></div>
      </div>
    </div>
  );
};

export default Dashboard;



// import React, { useEffect, useState } from 'react';
// import StatCard from '../components/StatCard';
// import { getAIDashboardData, simulateIncomingLeads, runAIAgentProcessing } from '../services/geminiService';
// import { 
//   Building2, 
//   Users, 
//   Bot, 
//   TrendingUp,
//   Loader2,
//   Activity,
//   Zap,
//   Rocket,
//   MessageSquare,
//   ShieldCheck,
//   Cloud,
//   ChevronRight,
//   Clock,
//   ArrowUpRight
// } from 'lucide-react';
// import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// const Dashboard: React.FC = () => {
//   const [data, setData] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [simulating, setSimulating] = useState(false);
//   const [simLog, setSimLog] = useState<string[]>([]);
//   const [simProgress, setSimProgress] = useState(0);

//   const loadData = async () => {
//     const res = await getAIDashboardData();
//     setData(res);
//     setLoading(false);
//   };

//   useEffect(() => {
//     loadData();
//   }, []);

//   const handleSimulateLeads = async () => {
//     setSimulating(true);
//     setSimLog(["Hệ thống: Khởi động chiến dịch Marketing...", "Hệ thống: Đang kết nối Google Ads & Facebook API..."]);
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     const news = await simulateIncomingLeads(5);
//     setSimLog(prev => [...prev, `Hệ thống: Đã thu thập ${news.length} Leads mới!`, "AI: Đang xử lý định danh CDP..."]);
//     await loadData();
//     setSimulating(false);
//   };

//   const handleRunAIProcess = async () => {
//     setSimulating(true);
//     setSimLog(["AI Agent: Bắt đầu quét dữ liệu khách hàng...", "AI Agent: Đang truy vấn Gemini Flash..."]);
//     await runAIAgentProcessing((progress, msg) => {
//       setSimProgress(progress);
//       setSimLog(prev => [msg, ...prev].slice(0, 5));
//     });
//     await loadData();
//     setSimulating(false);
//     setSimProgress(0);
//   };

//   if (loading) return (
//     <div className="h-full flex flex-col items-center justify-center text-indigo-600">
//       <Loader2 className="w-12 h-12 animate-spin mb-4" />
//       <p className="font-bold uppercase tracking-widest text-xs">Đang đồng bộ hạ tầng GCP...</p>
//     </div>
//   );

//   return (
//     <div className="space-y-6 animate-in fade-in duration-500 pb-10">
//       <header className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-black text-gray-900 leading-none">Tổng quan hệ thống</h2>
//           <p className="text-gray-500 font-medium mt-2 text-sm">Chào mừng bạn trở lại, Admin.</p>
//         </div>
//         <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
//           <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
//           GCP Multi-Region Active
//         </div>
//       </header>

//       {/* Stats Section */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <StatCard label="Dự án đang bán" value={data.stats.activeProjects} icon={Building2} trend="Ổn định" trendUp />
//         <StatCard label="Khách hàng (CDP)" value={data.stats.totalLeads} icon={Users} trend="+12% tháng này" trendUp />
//         <StatCard label="Nhân viên AI" value={data.stats.activeAgents} icon={Bot} trend="Online" trendUp />
//         <StatCard label="Chi phí Cloud" value={data.stats.revenue} icon={Cloud} trend="Trong ngân sách" trendUp />
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//         {/* Main Chart Area */}
//         <div className="lg:col-span-8 space-y-6">
//           <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="font-black text-gray-900 flex items-center gap-2">
//                 <Activity className="w-5 h-5 text-indigo-600" /> Biểu đồ Lead & Sales
//               </h3>
//               <select className="text-[10px] font-black uppercase tracking-widest bg-gray-50 border-none rounded-lg px-3 py-1.5 outline-none">
//                 <option>7 ngày qua</option>
//                 <option>30 ngày qua</option>
//               </select>
//             </div>
//             <div className="h-72">
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart data={data.chartData}>
//                   <defs>
//                     <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
//                       <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
//                   <XAxis dataKey="name" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
//                   <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
//                   <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
//                   <Area type="monotone" dataKey="leads" name="Leads" stroke="#4f46e5" strokeWidth={3} fill="url(#colorLeads)" />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
//               <h4 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
//                 <TrendingUp className="w-4 h-4 text-green-500" /> Hiệu suất chốt đơn
//               </h4>
//               <div className="flex items-center justify-between mb-4">
//                  <span className="text-3xl font-black text-gray-900">82.4%</span>
//                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded">+2.1%</span>
//               </div>
//               <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
//                  <div className="bg-green-500 h-full" style={{ width: '82%' }}></div>
//               </div>
//             </div>
//             <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
//               <h4 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
//                 <ShieldCheck className="w-4 h-4 text-indigo-500" /> Bảo mật & Hạ tầng
//               </h4>
//               <div className="space-y-3">
//                  <div className="flex items-center justify-between text-[11px] font-medium text-gray-600">
//                     <span>Dữ liệu mã hóa (AES-256)</span>
//                     <span className="text-green-600 font-bold">An toàn</span>
//                  </div>
//                  <div className="flex items-center justify-between text-[11px] font-medium text-gray-600">
//                     <span>Identity Access (IAM)</span>
//                     <span className="text-green-600 font-bold">Kích hoạt</span>
//                  </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Sidebar: Simulation & Operations */}
//         <div className="lg:col-span-4 space-y-6">
//           <div className="bg-indigo-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden">
//             <Rocket className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
//             <h3 className="text-sm font-black mb-6 flex items-center gap-2 uppercase tracking-widest">
//                <Zap className="w-4 h-4 text-yellow-400 fill-current" /> Trung tâm vận hành AI
//             </h3>
            
//             <div className="space-y-3">
//               <button 
//                 onClick={handleSimulateLeads}
//                 disabled={simulating}
//                 className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/5 rounded-2xl flex items-center gap-3 px-4 transition-all"
//               >
//                 <div className="p-1.5 bg-blue-500 rounded-lg"><MessageSquare className="w-3.5 h-3.5" /></div>
//                 <span className="text-[11px] font-black uppercase tracking-wider text-left">Giả lập 5 Leads mới</span>
//                 <ArrowUpRight className="ml-auto w-3 h-3 opacity-40" />
//               </button>

//               <button 
//                 onClick={handleRunAIProcess}
//                 disabled={simulating}
//                 className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/5 rounded-2xl flex items-center gap-3 px-4 transition-all"
//               >
//                 <div className="p-1.5 bg-indigo-500 rounded-lg"><Bot className="w-3.5 h-3.5" /></div>
//                 <span className="text-[11px] font-black uppercase tracking-wider text-left">AI Quét & Chấm điểm</span>
//                 <ArrowUpRight className="ml-auto w-3 h-3 opacity-40" />
//               </button>
//             </div>

//             {simulating && (
//               <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
//                 <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
//                   <div className="bg-yellow-400 h-full transition-all duration-300" style={{ width: `${simProgress}%` }}></div>
//                 </div>
//                 <div className="bg-black/20 rounded-xl p-3 font-mono text-[9px] h-24 overflow-y-auto space-y-1">
//                   {simLog.map((log, i) => <p key={i} className={i === 0 ? 'text-yellow-400' : 'text-indigo-200'}>{log}</p>)}
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
//              <h4 className="font-black text-gray-900 text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
//                 <Clock className="w-4 h-4 text-indigo-600" /> Nhật ký hoạt động
//              </h4>
//              <div className="space-y-4">
//                 {[
//                   { time: 'Vừa xong', msg: 'Agent Alpha đã gửi 12 email tư vấn' },
//                   { time: '10 phút trước', msg: 'Lead mới từ Google Forms' },
//                   { time: '2 giờ trước', msg: 'Dự án Ocean Park đã cập nhật bảng giá' }
//                 ].map((item, i) => (
//                   <div key={i} className="flex gap-3">
//                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-200 mt-1.5 flex-shrink-0"></div>
//                     <div>
//                       <p className="text-[11px] font-bold text-gray-800 leading-tight">{item.msg}</p>
//                       <p className="text-[9px] text-gray-400 mt-0.5">{item.time}</p>
//                     </div>
//                   </div>
//                 ))}
//              </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
