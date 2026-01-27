
import React, { useEffect, useState } from 'react';
import { BillingData } from '../types';
import { getAIBillingData } from '../services/geminiService';
import Pagination from '../components/Pagination';
import { CreditCard, ShieldCheck, Zap, Server, BarChart3, AlertTriangle, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ITEMS_PER_PAGE = 5;

const Billing: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    getAIBillingData().then(res => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium">AI đang truy xuất hóa đơn từ Google Cloud Console (mô phỏng)...</p>
      </div>
    );
  }

  const totalCost = data.details.reduce((sum: number, item: any) => sum + item.cost, 0).toFixed(2);
  const totalPages = Math.ceil(data.details.length / ITEMS_PER_PAGE);
  const currentDetails = data.details.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
            Hạ tầng & Chi phí (AI Forecast)
          </h2>
          <p className="text-gray-500">Mức tiêu thụ tài nguyên thực tế do Gemini tính toán.</p>
        </div>
        <div className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase opacity-80">Tổng chi tiêu AI</p>
            <p className="text-2xl font-bold">${totalCost}</p>
          </div>
          <CreditCard className="w-8 h-8 opacity-50" />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold flex items-center gap-2">
              <BarChart3 className="text-indigo-600 w-5 h-5" />
              Biểu đồ Chi phí (AI Generation)
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="cost" name="Chi phí ($)" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCost)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <ShieldCheck className="text-green-600 w-5 h-5" />
            Kiểm soát Ngân sách
          </h3>
          <div className="flex-1 space-y-6">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <h4 className="text-xs font-bold text-indigo-700 uppercase mb-2">Lời khuyên từ AI</h4>
              <p className="text-xs text-indigo-900 leading-relaxed italic">
                "Dựa trên dữ liệu 7 ngày qua, bạn nên chuyển một số tác vụ từ Pro sang Flash để tiết kiệm chi phí API mà vẫn giữ nguyên hiệu quả."
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <h3 className="font-bold text-gray-900">Chi tiết Tiêu thụ (Phân trang)</h3>
          <Zap className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-gray-400 font-bold border-b border-gray-100">
                <th className="px-6 py-4">Tài nguyên</th>
                <th className="px-6 py-4 text-center">Requests</th>
                <th className="px-6 py-4 text-right">Chi phí</th>
                <th className="px-6 py-4 text-right">Biến động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentDetails.map((item: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Server className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">{item.apiName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm font-medium text-gray-600">{item.requests.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-gray-900">${item.cost.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-xs font-bold ${item.change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {item.change > 0 ? '+' : ''}{item.change}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={data.details.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>
    </div>
  );
};

export default Billing;
