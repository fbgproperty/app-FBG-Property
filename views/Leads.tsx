
import React, { useEffect, useState } from 'react';
import { Customer } from '../types';
import { getAICDPData, saveCDPToCache } from '../services/geminiService';
import { Target, UserCheck, MessageCircle, MoreHorizontal, Loader2, RefreshCw, ArrowRight } from 'lucide-react';

const Leads: React.FC = () => {
  const [transferredLeads, setTransferredLeads] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const data = await getAICDPData();
    // Lấy những khách hàng có trạng thái "Chuyển giao Sales"
    const leads = data.filter((c: Customer) => c.status === 'Chuyển giao Sales');
    setTransferredLeads(leads);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStage = async (id: string, newStatus: any) => {
    const allData = await getAICDPData();
    const updated = allData.map((c: Customer) => c.id === id ? { ...c, status: newStatus } : c);
    saveCDPToCache(updated);
    loadData();
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold text-xs uppercase tracking-widest">Đang tải danh sách Lead Sales...</p>
      </div>
    );
  }

  const stages = [
    { key: 'Chuyển giao Sales', label: 'Mới nhận' },
    { key: 'Đang chăm sóc', label: 'Đang chăm sóc' },
    { key: 'Thành công', label: 'Thành công' },
    { key: 'Thất bại', label: 'Thất bại' }
  ];

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-none">Leads & Bán hàng Thực tế</h2>
          <p className="text-gray-500 font-medium mt-2">Dữ liệu chất lượng cao đã qua sàng lọc từ AI Agent.</p>
        </div>
        <button onClick={loadData} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-indigo-600 shadow-sm">
           <RefreshCw className="w-5 h-5" />
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {stages.map((stage) => (
          <div key={stage.key} className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stage.label}</h3>
              <span className="bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-black">
                {transferredLeads.filter(l => (l.status === stage.key) || (stage.key === 'Chuyển giao Sales' && l.status === 'Chuyển giao Sales')).length}
              </span>
            </div>
            
            <div className="space-y-3 min-h-[300px] bg-gray-50/50 p-2 rounded-2xl border border-dashed border-gray-200">
              {transferredLeads
                .filter(l => l.status === stage.key)
                .map(lead => (
                <div key={lead.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group animate-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-black text-gray-900 text-sm group-hover:text-indigo-600">{lead.name}</h4>
                    <button className="text-gray-300 hover:text-gray-600"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                      <Target className="w-3 h-3 text-indigo-500" />
                      <span className="truncate">{lead.interestedProject}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 italic line-clamp-2">"{lead.needs}"</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5">
                       <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600 border border-orange-200" title="Hot Lead (90%+)">{lead.score}</div>
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><MessageCircle className="w-4 h-4" /></button>
                      <button 
                        onClick={() => handleUpdateStage(lead.id, 'Đang chăm sóc')}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Đánh dấu đang chăm sóc"
                      ><UserCheck className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              ))}

              {transferredLeads.filter(l => l.status === stage.key).length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-gray-300 opacity-50">
                  <ArrowRight className="w-6 h-6 mb-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Trống</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leads;
