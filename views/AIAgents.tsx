import React, { useState, useEffect, useMemo } from 'react';
import { AIAgent, Project } from '../types';
import { getAIProjectsData } from '../services/geminiService';
import Pagination from '../components/Pagination';
import {
  Bot, Power, Zap, MessageSquare,
  Loader2, RefreshCw, LayoutGrid, List, Users, CheckCircle2,
  Clock, Sparkles, Building2, UserCheck, Trash2, Edit2, XCircle, Plus
} from 'lucide-react';

import { api } from '../services/apiService';

const ITEMS_PER_PAGE = 8;

const AIAgents: React.FC = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Partial<AIAgent> | null>(null);

  const normalizeAgent = (a: any): AIAgent => ({
    id: String(a.id ?? a.Id ?? ''),
    name: String(a.name ?? a.Name ?? ''),
    status: (a.status ?? a.Status) === 'Active' || (a.status ?? a.Status) === 'Idle' || (a.status ?? a.Status) === 'Optimizing'
      ? (a.status ?? a.Status)
      : 'Idle',
    role: a.role ?? 'Tư vấn dự án',
    assignedProject: a.assignedProject ?? '',
    successRate: Number.isFinite(Number(a.successRate)) ? Number(a.successRate) : 85,
    interactionsCount: Number.isFinite(Number(a.interactionsCount)) ? Number(a.interactionsCount) : 0,
    caringCount: Number.isFinite(Number(a.caringCount)) ? Number(a.caringCount) : 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsRes, projectsRes] = await Promise.allSettled([
        api.getAgents(),
        getAIProjectsData(),
      ]);

      const agentsDataRaw = agentsRes.status === "fulfilled" ? agentsRes.value : [];
      const projectsData = projectsRes.status === "fulfilled" ? projectsRes.value : [];

      if (agentsRes.status === "rejected") console.error("getAgents failed:", agentsRes.reason);
      if (projectsRes.status === "rejected") console.error("getAIProjectsData failed:", projectsRes.reason);

      // ✅ normalize (phòng backend trả PascalCase)
      const agentsData = Array.isArray(agentsDataRaw) ? agentsDataRaw.map(normalizeAgent) : [];
      setAgents(agentsData);
      setProjects(projectsData);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Map API mới: PUT /api/agents/{id}/status
  const toggleAgent = async (id: string) => {
    const current = agents.find(a => a.id === id);
    if (!current) return;

    const nextStatus = (current.status === 'Active' ? 'Idle' : 'Active') as AIAgent['status'];

    // optimistic UI
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus } : a));

    try {
      const nextStatus = current.status === 'Active' ? 'Paused' : 'Active';
      await api.updateAgentStatus(id, { status: nextStatus });
    } catch (err) {
      // rollback
      setAgents(prev => prev.map(a => a.id === id ? current : a));
      alert('Không cập nhật trạng thái được. Vui lòng thử lại.');
    }
  };

  // const handleOpenAdd = () => {
  //   setEditingAgent({
  //     name: '',
  //     role: 'Tư vấn dự án',
  //     assignedProject: projects[0]?.name || '',
  //     status: 'Active',
  //     successRate: 85,
  //     interactionsCount: 0,
  //     caringCount: 0
  //   });
  //   setIsModalOpen(true);
  // };

  const handleOpenAdd = () => {
    setEditingAgent({
      name: '',
      role: 'Tư vấn dự án', // ✅ NEW
      status: 'Active',
      channelsJson: '',
      configJson: '',
    } as any);
    setIsModalOpen(true);
  };

  // const handleOpenEdit = (agent: AIAgent, e: React.MouseEvent) => {
  //   e.stopPropagation();
  //   setEditingAgent(agent);
  //   setIsModalOpen(true);
  // };
  
  const handleOpenEdit = (agent: AIAgent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAgent({
      ...agent,
      role: (agent as any).role ?? 'Tư vấn dự án', // ✅ NEW
      channelsJson: (agent as any).channelsJson ?? '',
      configJson: (agent as any).configJson ?? '',
    } as any);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Xác nhận xóa nhân viên AI này khỏi đội ngũ?')) return;

    const snapshot = agents;
    setAgents(prev => prev.filter(a => a.id !== id));

    try {
      await api.deleteAgent(id);
    } catch (err) {
      setAgents(snapshot);
      alert('Xóa thất bại. Vui lòng thử lại.');
    }
  };

  // ✅ Map API mới: PUT /api/agents/{id} (full fields)
  // Backend trả 204 NoContent => update UI theo optimistic merge
  // const handleSave = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!editingAgent) return;

  //   try {
  //     if (editingAgent.id) {
  //       await api.updateAgent(editingAgent.id, {
  //         name: String(editingAgent.name ?? ''),
  //         status: String(editingAgent.status ?? 'Idle'),
  //         channelsJson: (editingAgent as any).channelsJson ?? null,
  //         configJson: (editingAgent as any).configJson ?? null,
  //       });

  //       setAgents(prev => prev.map(a => a.id === editingAgent.id ? ({ ...a, ...editingAgent } as any) : a));
  //     } else {
  //       // create giữ nguyên như bạn đang dùng
  //       const created = await api.createAgent(editingAgent);
  //       setAgents(prev => [normalizeAgent(created), ...prev]);
  //     }
  //     setIsModalOpen(false);
  //   } catch (err) {
  //     alert('Lưu thất bại. Vui lòng kiểm tra API/Server.');
  //   }
  // };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
  
    const payload = {
      name: String(editingAgent.name ?? '').trim(),
      status: String(editingAgent.status ?? 'Active'),
      channelsJson: (editingAgent as any).channelsJson?.toString() || null,
      configJson: (editingAgent as any).configJson?.toString() || null,
    };
  
    if (!payload.name) {
      alert('Vui lòng nhập Tên Nhân viên AI.');
      return;
    }
  
    // ✅ chỉ 2 status
    if (payload.status !== 'Active' && payload.status !== 'Paused') {
      alert("Status chỉ được phép: 'Active' hoặc 'Paused'.");
      return;
    }
  
    try {
      if (editingAgent.id) {
        await api.updateAgent(editingAgent.id, payload);
  
        // optimistic merge UI (không cần backend trả về)
        setAgents(prev =>
          prev.map(a => a.id === editingAgent.id
            ? ({ ...a, name: payload.name, status: payload.status } as any)
            : a
          )
        );
      } else {
        const created = await api.createAgent(payload as any);
        setAgents(prev => [normalizeAgent(created), ...prev]);
      }
  
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Lưu thất bại. Vui lòng kiểm tra API/Server.');
    }
  };
  

  const totalPages = Math.ceil(agents.length / ITEMS_PER_PAGE);
  const currentAgents = agents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    const total = agents.length;
    const active = agents.filter(a => a.status === 'Active').length;
    const totalInteractions = agents.reduce((acc, curr) => acc + (curr.interactionsCount || 0), 0);
    const totalCaring = agents.reduce((acc, curr) => acc + (curr.caringCount || 0), 0);
    return { total, active, totalInteractions, totalCaring };
  }, [agents]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-black text-xs uppercase tracking-widest animate-pulse">
          Gemini đang điều phối đội ngũ Nhân viên AI...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-none">Đội ngũ Nhân viên AI</h2>
          <p className="text-gray-500 font-medium mt-2">Giám sát và cấu hình lực lượng bán hàng tự động.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 p-0.5 rounded-xl flex items-center shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-600'
                }`}
              title="Dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-gray-600'
                }`}
              title="Dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-indigo-600 shadow-sm transition-all"
            title="Tải lại"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100"
          >
            <Bot className="w-4 h-4" /> Khởi tạo Nhân viên
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-500">
            <CheckCircle2 className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Đang hoạt động</p>
            <p className="text-2xl font-black text-gray-900 leading-none">
              {stats.active}
              <span className="text-gray-300 mx-1">/</span>
              <span className="text-gray-400">{stats.total}</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
            <UserCheck className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors duration-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Đang chăm sóc</p>
            <p className="text-2xl font-black text-gray-900 leading-none">{stats.totalCaring.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-600 transition-colors duration-500">
            <Zap className="w-7 h-7 text-green-600 group-hover:text-white transition-colors duration-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tỷ lệ Chốt TB</p>
            <p className="text-2xl font-black text-gray-900 leading-none">82%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-500">
            <MessageSquare className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors duration-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tương tác AI</p>
            <p className="text-2xl font-black text-gray-900 leading-none">{stats.totalInteractions.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {currentAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex-1">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transition-all duration-500 ${agent.status === 'Active'
                        ? 'bg-indigo-600 text-white shadow-indigo-100'
                        : 'bg-gray-100 text-gray-400'
                        }`}
                    >
                      <Bot className="w-9 h-9" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors leading-none">
                        {agent.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                          {agent.role}
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                          }`} />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className={`p-3 rounded-2xl transition-all duration-300 ${agent.status === 'Active'
                        ? 'bg-green-50 text-green-600 shadow-sm'
                        : 'bg-gray-50 text-gray-400'
                        }`}
                      title="Bật/Tắt"
                    >
                      <Power className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => handleOpenEdit(agent, e)}
                      className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm"
                      title="Sửa"
                    >
                      <Edit2 className="w-6 h-6" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(agent.id, e)}
                      className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all shadow-sm"
                      title="Xóa"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Dự án đảm nhiệm</p>
                      <p className="text-[12px] font-black text-gray-800 truncate">{agent.assignedProject}</p>
                    </div>
                  </div>
                  <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
                    <Users className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    <div>
                      <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Khách hàng chăm sóc</p>
                      <p className="text-[12px] font-black text-indigo-900">{agent.caringCount} Lead</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hiệu suất tư vấn</span>
                    <span className="text-sm font-black text-indigo-600">{agent.successRate}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-full transition-all duration-1000 shadow-lg"
                      style={{ width: `${agent.successRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-50">
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <Clock className="w-3 h-3" /> Tương tác
                    </span>
                    <span className="text-sm font-black text-gray-700">
                      {agent.interactionsCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3 text-yellow-500" /> Rank
                    </span>
                    <span className="text-sm font-black text-indigo-600">Elite</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Nhân viên AI</th>
                {/* <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Vai trò / Chuyên môn</th> */}
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Dự án phụ trách</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Đang chăm sóc</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Hiệu suất</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {currentAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-indigo-50/20 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm transition-colors ${agent.status === 'Active'
                          ? 'bg-indigo-600'
                          : 'bg-gray-400'
                          }`}
                      >
                        <Bot className="w-5 h-5" />
                      </div>
                      <span className="font-black text-gray-900 text-sm">{agent.name}</span>
                    </div>
                  </td>

                  {/* <td className="px-8 py-4">
                    <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg uppercase">
                      {agent.role}
                    </span>
                  </td> */}

                  <td className="px-8 py-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs font-black text-gray-700">{agent.assignedProject}</span>
                    </div>
                  </td>

                  <td className="px-8 py-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                      <Users className="w-3 h-3" />
                      <span className="text-sm font-black">{agent.caringCount}</span>
                    </div>
                  </td>

                  <td className="px-8 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3 text-green-500 fill-current" />
                      <span className="text-sm font-black text-gray-900">{agent.successRate}%</span>
                    </div>
                  </td>

                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleAgent(agent.id)}
                        className={`p-2 rounded-xl border transition-all ${agent.status === 'Active'
                          ? 'text-green-600 hover:bg-green-50 border-green-100'
                          : 'text-gray-400 hover:bg-gray-50 border-gray-100'
                          }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleOpenEdit(agent, e)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(agent.id, e)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={agents.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {/* AGENT MODAL FORM */}
      {isModalOpen && editingAgent && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden border border-white">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="leading-tight">
                  <h3 className="text-[15px] font-black text-slate-900 tracking-tight">
                    {editingAgent.id ? 'Cập nhật nhân viên AI' : 'Thêm mới nhân viên AI'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    Thông tin cơ bản & cấu hình
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-red-50 active:scale-95 transition"
                aria-label="Đóng"
              >
                <XCircle className="w-7 h-7 text-slate-300 hover:text-red-500 transition-colors" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSave} className="px-6 py-6 space-y-5">
              {/* Basic fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                    Tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAgent.name ?? ''}
                    onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                    placeholder="VD: Agent Alpha"
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-bold
                              focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                    Trạng thái <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={(editingAgent.status as any) ?? 'Active'}
                      onChange={(e) => setEditingAgent({ ...editingAgent, status: e.target.value as any })}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[13px] font-bold
                                focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition
                                appearance-none cursor-pointer"
                    >
                      <option value="Active">Hoạt động</option>
                      <option value="Paused">Tạm dừng</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-xs">
                      ▼
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium ml-0.5">
                    Chỉ hỗ trợ <b>Active</b> / <b>Paused</b>
                  </p>
                </div>
              </div>

              {/* Advanced (collapsible) */}
              <details className="group rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Nâng cao (JSON)
                    </span>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                      Optional
                    </span>
                  </div>
                  <span className="text-slate-400 group-open:rotate-180 transition">▾</span>
                </summary>

                <div className="px-4 pb-4 space-y-4">
                  {/* ChannelsJson */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                      ChannelsJson
                    </label>
                    <textarea
                      rows={3}
                      value={(editingAgent as any).channelsJson ?? ''}
                      onChange={(e) =>
                        setEditingAgent({ ...(editingAgent as any), channelsJson: e.target.value } as any)
                      }
                      placeholder='VD: ["Zalo","Facebook","Call"]'
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-bold font-mono
                                focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
                    />
                  </div>

                  {/* ConfigJson */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-0.5">
                      ConfigJson
                    </label>
                    <textarea
                      rows={4}
                      value={(editingAgent as any).configJson ?? ''}
                      onChange={(e) =>
                        setEditingAgent({ ...(editingAgent as any), configJson: e.target.value } as any)
                      }
                      placeholder='VD: {"temperature":0.2,"model":"gemini"}'
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[12px] font-bold font-mono
                                focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition"
                    />
                  </div>

                  <p className="text-[10px] text-slate-400 font-medium">
                    * Có thể để trống. Nếu nhập JSON, hãy đảm bảo đúng định dạng.
                  </p>
                </div>
              </details>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 border border-slate-200 text-slate-500 font-black rounded-2xl
                            hover:bg-slate-50 transition uppercase tracking-widest text-[11px]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700
                            transition shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px]
                            flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {editingAgent.id ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingAgent.id ? 'Lưu' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIAgents;


// import React, { useState, useEffect, useMemo } from 'react';
// import { AIAgent, Project } from '../types';
// import { getAIProjectsData } from '../services/geminiService';
// import Pagination from '../components/Pagination';
// import {
//   Bot, Power, Zap, MessageSquare,
//   Loader2, RefreshCw, LayoutGrid, List, Users, CheckCircle2,
//   Clock, Sparkles, Building2, UserCheck, Trash2, Edit2, XCircle, Plus
// } from 'lucide-react';

// import { api } from '../services/apiService';

// const ITEMS_PER_PAGE = 4;

// const AIAgents: React.FC = () => {
//   const [agents, setAgents] = useState<AIAgent[]>([]);
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

//   // Modal State
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [editingAgent, setEditingAgent] = useState<Partial<AIAgent> | null>(null);

//   const normalizeAgent = (a: any): AIAgent => ({
//     id: String(a.id ?? ''),
//     name: String(a.name ?? ''),
//     status: (a.status === 'Active' || a.status === 'Idle' || a.status === 'Optimizing') ? a.status : 'Idle',
//     role: a.role ?? 'Tư vấn dự án',
//     assignedProject: a.assignedProject ?? '',
//     successRate: Number.isFinite(Number(a.successRate)) ? Number(a.successRate) : 85,
//     interactionsCount: Number.isFinite(Number(a.interactionsCount)) ? Number(a.interactionsCount) : 0,
//     caringCount: Number.isFinite(Number(a.caringCount)) ? Number(a.caringCount) : 0,
//   });
  
//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const [agentsRes, projectsRes] = await Promise.allSettled([
//         api.getAgents(),
//         getAIProjectsData(),
//       ]);
  
//       const agentsData = agentsRes.status === "fulfilled" ? agentsRes.value : [];
//       const projectsData = projectsRes.status === "fulfilled" ? projectsRes.value : [];
  
//       if (agentsRes.status === "rejected") console.error("getAgents failed:", agentsRes.reason);
//       if (projectsRes.status === "rejected") console.error("getAIProjectsData failed:", projectsRes.reason);
  
//       setAgents(agentsData);
//       setProjects(projectsData);
//       setCurrentPage(1);
//     } finally {
//       setLoading(false);
//     }
//   };
  

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const toggleAgent = async (id: string) => {
//     const current = agents.find(a => a.id === id);
//     if (!current) return;

//     const nextStatus = (current.status === 'Active' ? 'Idle' : 'Active') as AIAgent['status'];

//     // optimistic UI
//     setAgents(prev => prev.map(a => a.id === id ? { ...a, status: nextStatus } : a));

//     try {
//       // ✅ update backend (chỉ dùng field có / nhét vào configJson trong apiService)
//       await api.updateAgent(id, { ...current, status: nextStatus });
//     } catch (err) {
//       // rollback
//       setAgents(prev => prev.map(a => a.id === id ? current : a));
//       alert('Không cập nhật trạng thái được. Vui lòng thử lại.');
//     }
//   };

//   const handleOpenAdd = () => {
//     setEditingAgent({
//       name: '',
//       role: 'Tư vấn dự án',
//       assignedProject: projects[0]?.name || '',
//       status: 'Active',
//       successRate: 85,
//       interactionsCount: 0,
//       caringCount: 0
//     });
//     setIsModalOpen(true);
//   };

//   const handleOpenEdit = (agent: AIAgent, e: React.MouseEvent) => {
//     e.stopPropagation();
//     setEditingAgent(agent);
//     setIsModalOpen(true);
//   };

//   const handleDelete = async (id: string, e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (!window.confirm('Xác nhận xóa nhân viên AI này khỏi đội ngũ?')) return;

//     const snapshot = agents;
//     setAgents(prev => prev.filter(a => a.id !== id));

//     try {
//       await api.deleteAgent(id);
//     } catch (err) {
//       setAgents(snapshot);
//       alert('Xóa thất bại. Vui lòng thử lại.');
//     }
//   };

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!editingAgent) return;

//     try {
//       if (editingAgent.id) {
//         // ✅ update
//         const updated = await api.updateAgent(editingAgent.id, editingAgent);
//         setAgents(prev => prev.map(a => a.id === updated.id ? updated : a));
//       } else {
//         // ✅ create
//         const created = await api.createAgent(editingAgent);
//         setAgents(prev => [created, ...prev]);
//       }
//       setIsModalOpen(false);
//     } catch (err) {
//       alert('Lưu thất bại. Vui lòng kiểm tra API/Server.');
//     }
//   };

//   const totalPages = Math.ceil(agents.length / ITEMS_PER_PAGE);
//   const currentAgents = agents.slice(
//     (currentPage - 1) * ITEMS_PER_PAGE,
//     currentPage * ITEMS_PER_PAGE
//   );

//   const stats = useMemo(() => {
//     const total = agents.length;
//     const active = agents.filter(a => a.status === 'Active').length;
//     const totalInteractions = agents.reduce((acc, curr) => acc + (curr.interactionsCount || 0), 0);
//     const totalCaring = agents.reduce((acc, curr) => acc + (curr.caringCount || 0), 0);
//     return { total, active, totalInteractions, totalCaring };
//   }, [agents]);

//   if (loading) {
//     return (
//       <div className="h-full flex flex-col items-center justify-center text-indigo-600">
//         <Loader2 className="w-12 h-12 animate-spin mb-4" />
//         <p className="font-black text-xs uppercase tracking-widest animate-pulse">
//           Gemini đang điều phối đội ngũ Nhân viên AI...
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 animate-in fade-in duration-500">
//       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-black text-gray-900 leading-none">Đội ngũ Nhân viên AI</h2>
//           <p className="text-gray-500 font-medium mt-2">Giám sát và cấu hình lực lượng bán hàng tự động.</p>
//         </div>
//         <div className="flex items-center gap-3">
//           <div className="bg-white border border-gray-200 p-0.5 rounded-xl flex items-center shadow-sm">
//             <button
//               onClick={() => setViewMode('grid')}
//               className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
//                 ? 'bg-indigo-600 text-white shadow-md'
//                 : 'text-gray-400 hover:text-gray-600'
//                 }`}
//               title="Dạng lưới"
//             >
//               <LayoutGrid className="w-4 h-4" />
//             </button>
//             <button
//               onClick={() => setViewMode('table')}
//               className={`p-2 rounded-lg transition-all ${viewMode === 'table'
//                 ? 'bg-indigo-600 text-white shadow-md'
//                 : 'text-gray-400 hover:text-gray-600'
//                 }`}
//               title="Dạng bảng"
//             >
//               <List className="w-4 h-4" />
//             </button>
//           </div>

//           <button
//             onClick={fetchData}
//             className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-indigo-600 shadow-sm transition-all"
//             title="Tải lại"
//           >
//             <RefreshCw className="w-5 h-5" />
//           </button>

//           <button
//             onClick={handleOpenAdd}
//             className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100"
//           >
//             <Bot className="w-4 h-4" /> Khởi tạo Nhân viên
//           </button>
//         </div>
//       </header>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
//           <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-500">
//             <CheckCircle2 className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-500" />
//           </div>
//           <div>
//             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Đang hoạt động</p>
//             <p className="text-2xl font-black text-gray-900 leading-none">
//               {stats.active}
//               <span className="text-gray-300 mx-1">/</span>
//               <span className="text-gray-400">{stats.total}</span>
//             </p>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
//           <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
//             <UserCheck className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors duration-500" />
//           </div>
//           <div>
//             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Đang chăm sóc</p>
//             <p className="text-2xl font-black text-gray-900 leading-none">{stats.totalCaring.toLocaleString()}</p>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
//           <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-600 transition-colors duration-500">
//             <Zap className="w-7 h-7 text-green-600 group-hover:text-white transition-colors duration-500" />
//           </div>
//           <div>
//             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tỷ lệ Chốt TB</p>
//             {/* nếu muốn tính theo agents successRate thay vì hardcode 82%:
//                 const avg = Math.round(agents.reduce((a,c)=>a+(c.successRate||0),0)/Math.max(1,agents.length));
//             */}
//             <p className="text-2xl font-black text-gray-900 leading-none">82%</p>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
//           <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-500">
//             <MessageSquare className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors duration-500" />
//           </div>
//           <div>
//             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tương tác AI</p>
//             <p className="text-2xl font-black text-gray-900 leading-none">{stats.totalInteractions.toLocaleString()}</p>
//           </div>
//         </div>
//       </div>

//       {/* Content Area */}
//       {viewMode === 'grid' ? (
//         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
//           {currentAgents.map((agent) => (
//             <div
//               key={agent.id}
//               className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-2xl hover:border-indigo-100 transition-all duration-500 flex flex-col"
//             >
//               <div className="p-8 border-b border-gray-50 flex-1">
//                 <div className="flex justify-between items-start mb-8">
//                   <div className="flex items-center gap-5">
//                     <div
//                       className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transition-all duration-500 ${agent.status === 'Active'
//                         ? 'bg-indigo-600 text-white shadow-indigo-100'
//                         : 'bg-gray-100 text-gray-400'
//                         }`}
//                     >
//                       <Bot className="w-9 h-9" />
//                     </div>
//                     <div>
//                       <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors leading-none">
//                         {agent.name}
//                       </h3>
//                       <div className="flex items-center gap-2 mt-2">
//                         <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
//                           {agent.role}
//                         </span>
//                         <div className={`w-1.5 h-1.5 rounded-full ${agent.status === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
//                           }`} />
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => toggleAgent(agent.id)}
//                       className={`p-3 rounded-2xl transition-all duration-300 ${agent.status === 'Active'
//                         ? 'bg-green-50 text-green-600 shadow-sm'
//                         : 'bg-gray-50 text-gray-400'
//                         }`}
//                       title="Bật/Tắt"
//                     >
//                       <Power className="w-6 h-6" />
//                     </button>
//                     <button
//                       onClick={(e) => handleOpenEdit(agent, e)}
//                       className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all shadow-sm"
//                       title="Sửa"
//                     >
//                       <Edit2 className="w-6 h-6" />
//                     </button>
//                     <button
//                       onClick={(e) => handleDelete(agent.id, e)}
//                       className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all shadow-sm"
//                       title="Xóa"
//                     >
//                       <Trash2 className="w-6 h-6" />
//                     </button>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
//                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
//                     <Building2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
//                     <div className="min-w-0">
//                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Dự án đảm nhiệm</p>
//                       <p className="text-[12px] font-black text-gray-800 truncate">{agent.assignedProject}</p>
//                     </div>
//                   </div>
//                   <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100 flex items-center gap-3">
//                     <Users className="w-4 h-4 text-indigo-500 flex-shrink-0" />
//                     <div>
//                       <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Khách hàng chăm sóc</p>
//                       <p className="text-[12px] font-black text-indigo-900">{agent.caringCount} Lead</p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <div className="flex justify-between items-end">
//                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hiệu suất tư vấn</span>
//                     <span className="text-sm font-black text-indigo-600">{agent.successRate}%</span>
//                   </div>
//                   <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden shadow-inner">
//                     <div
//                       className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-full transition-all duration-1000 shadow-lg"
//                       style={{ width: `${agent.successRate}%` }}
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-50">
//                 <div className="flex gap-8">
//                   <div className="flex flex-col">
//                     <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
//                       <Clock className="w-3 h-3" /> Tương tác
//                     </span>
//                     <span className="text-sm font-black text-gray-700">
//                       {agent.interactionsCount.toLocaleString()}
//                     </span>
//                   </div>
//                   <div className="flex flex-col">
//                     <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
//                       <Sparkles className="w-3 h-3 text-yellow-500" /> Rank
//                     </span>
//                     <span className="text-sm font-black text-indigo-600">Elite</span>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
//           <table className="w-full text-left min-w-[1000px]">
//             <thead>
//               <tr className="bg-gray-50/80 border-b border-gray-100">
//                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Nhân viên AI</th>
//                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Vai trò / Chuyên môn</th>
//                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Dự án phụ trách</th>
//                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Đang chăm sóc</th>
//                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Hiệu suất</th>
//                 <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
//               </tr>
//             </thead>

//             <tbody className="divide-y divide-gray-50">
//               {currentAgents.map((agent) => (
//                 <tr key={agent.id} className="hover:bg-indigo-50/20 transition-colors group">
//                   <td className="px-8 py-4">
//                     <div className="flex items-center gap-3">
//                       <div
//                         className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-sm transition-colors ${agent.status === 'Active'
//                           ? 'bg-indigo-600'
//                           : 'bg-gray-400'
//                           }`}
//                       >
//                         <Bot className="w-5 h-5" />
//                       </div>
//                       <span className="font-black text-gray-900 text-sm">{agent.name}</span>
//                     </div>
//                   </td>

//                   <td className="px-8 py-4">
//                     <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg uppercase">
//                       {agent.role}
//                     </span>
//                   </td>

//                   <td className="px-8 py-4">
//                     <div className="flex items-center gap-2">
//                       <Building2 className="w-3.5 h-3.5 text-indigo-400" />
//                       <span className="text-xs font-black text-gray-700">{agent.assignedProject}</span>
//                     </div>
//                   </td>

//                   <td className="px-8 py-4 text-center">
//                     <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
//                       <Users className="w-3 h-3" />
//                       <span className="text-sm font-black">{agent.caringCount}</span>
//                     </div>
//                   </td>

//                   <td className="px-8 py-4 text-center">
//                     <div className="flex items-center justify-center gap-1">
//                       <Zap className="w-3 h-3 text-green-500 fill-current" />
//                       <span className="text-sm font-black text-gray-900">{agent.successRate}%</span>
//                     </div>
//                   </td>

//                   <td className="px-8 py-4 text-right">
//                     <div className="flex items-center justify-end gap-2">
//                       <button
//                         onClick={() => toggleAgent(agent.id)}
//                         className={`p-2 rounded-xl border transition-all ${agent.status === 'Active'
//                           ? 'text-green-600 hover:bg-green-50 border-green-100'
//                           : 'text-gray-400 hover:bg-gray-50 border-gray-100'
//                           }`}
//                       >
//                         <Power className="w-4 h-4" />
//                       </button>
//                       <button
//                         onClick={(e) => handleOpenEdit(agent, e)}
//                         className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
//                       >
//                         <Edit2 className="w-4 h-4" />
//                       </button>
//                       <button
//                         onClick={(e) => handleDelete(agent.id, e)}
//                         className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       <Pagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={setCurrentPage}
//         totalItems={agents.length}
//         itemsPerPage={ITEMS_PER_PAGE}
//       />

//       {/* AGENT MODAL FORM */}
//       {isModalOpen && editingAgent && (
//         <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300">
//             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
//                   <Bot className="w-6 h-6" />
//                 </div>
//                 <h3 className="text-xl font-black text-gray-900 tracking-tight">
//                   {editingAgent.id ? 'Cập nhật nhân viên AI' : 'Thêm mới nhân viên AI'}
//                 </h3>
//               </div>
//               <button
//                 onClick={() => setIsModalOpen(false)}
//                 className="p-2 hover:bg-red-50 rounded-full group transition-all"
//               >
//                 <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
//               </button>
//             </div>

//             <form onSubmit={handleSave} className="p-10 space-y-8">
//               <div className="space-y-2">
//                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                   Tên Nhân viên AI
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={editingAgent.name ?? ''}
//                   onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
//                   placeholder="VD: Agent Alpha"
//                   className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                 />
//               </div>

//               <div className="space-y-4 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
//                 <div className="flex justify-between items-center mb-1">
//                   <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
//                     Hiệu suất Success Rate (%)
//                   </label>
//                   <span className="text-sm font-black text-indigo-600">{editingAgent.successRate ?? 0}%</span>
//                 </div>
//                 <input
//                   type="range"
//                   min="0"
//                   max="100"
//                   value={editingAgent.successRate ?? 0}
//                   onChange={(e) => setEditingAgent({ ...editingAgent, successRate: parseInt(e.target.value) })}
//                   className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                     Trạng thái ban đầu
//                   </label>
//                   <select
//                     value={editingAgent.status ?? 'Idle'}
//                     onChange={(e) => setEditingAgent({ ...editingAgent, status: e.target.value as any })}
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
//                   >
//                     <option value="Active">Đang chạy (Active)</option>
//                     <option value="Idle">Đang nghỉ (Idle)</option>
//                   </select>
//                 </div>

//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                     Số khách đang chăm
//                   </label>
//                   <input
//                     type="number"
//                     value={editingAgent.caringCount ?? 0}
//                     onChange={(e) => setEditingAgent({ ...editingAgent, caringCount: parseInt(e.target.value || '0') })}
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>
//               </div>

//               <div className="pt-6 flex gap-4">
//                 <button
//                   type="button"
//                   onClick={() => setIsModalOpen(false)}
//                   className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
//                 >
//                   Hủy bỏ
//                 </button>
//                 <button
//                   type="submit"
//                   className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
//                 >
//                   {editingAgent.id ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
//                   {editingAgent.id ? 'Lưu thay đổi' : 'Khởi tạo ngay'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AIAgents;
