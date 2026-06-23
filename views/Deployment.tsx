/// TRIỂN KHAI DỰ ÁN (UPDATED TO NEW API)
import React, { useState, useEffect, useMemo } from 'react';
import { Project, AIAgent } from '../types';
import Pagination from '../components/Pagination';
import {
  Rocket, Activity, Bot, Zap,
  Play, Pause, Settings, RefreshCw,
  Loader2, LayoutGrid, List,
  Building2, Users, XCircle, ChevronDown, PlusCircle,
  TrendingUp, Inbox, Save, Edit2, Trash2, Search
} from 'lucide-react';

import { api, AgentProjectAssignmentDto } from '../services/apiService';
import { formatDateTime } from '@/components/utils/formatDate';

const PROJECTS_PER_PAGE = 4;

// ===== Backend DTO (API trả về PascalCase/camelCase) =====
type CampaignDtoApi = {
  id?: string;
  name?: string;
  status?: string;
  startAt?: string | null;
  endAt?: string | null;

  Id?: string;
  Name?: string;
  Status?: string;
  StartAt?: string | null;
  EndAt?: string | null;

  // các field này có thể backend mới chưa trả -> UI tự về 0
  AgentsAiActive?: number;
  TargetLeads?: number;
  CurrentLeads?: number;
  LimitAiAgent?: number;
  Progress?: number;

  agentsAiActive?: number;
  targetLeads?: number;
  currentLeads?: number;
  limitAiAgent?: number;
  progress?: number;
};

type CampaignStatus = 'Draft' | 'Active' | 'Paused' | 'Completed' | 'Stopped';

type CampaignDto = {
  id: string;
  name: string;
  status: CampaignStatus;
  startAt?: string | null;
  endAt?: string | null;

  agentsAiActive: number;
  targetLeads: number;
  currentLeads: number;
  limitAiAgent: number;
  progress: number;
};

const normalizeCampaignStatus = (s: any): CampaignStatus => {
  const v = String(s || '').toLowerCase();
  if (v === 'active') return 'Active';
  if (v === 'paused') return 'Paused';
  if (v === 'completed') return 'Completed';
  if (v === 'stopped') return 'Stopped';
  return 'Draft';
};

const mapCampaignApiToUi = (x: any): CampaignDto => {
  const id = (x.id ?? x.Id ?? '') as string;
  const name = (x.name ?? x.Name ?? '') as string;
  const status = normalizeCampaignStatus(x.status ?? x.Status);

  const targetLeads = Number(x.targetLeads ?? x.TargetLeads ?? 0);
  const currentLeads = Number(x.currentLeads ?? x.CurrentLeads ?? 0);
  const progress = Number(x.progress ?? x.Progress ?? (targetLeads > 0 ? Math.round((currentLeads / targetLeads) * 100) : 0));

  return {
    id,
    name,
    status,
    startAt: (x.startAt ?? x.StartAt ?? null) as any,
    endAt: (x.endAt ?? x.EndAt ?? null) as any,

    agentsAiActive: Number(x.agentsAiActive ?? x.AgentsAiActive ?? 0),
    targetLeads,
    currentLeads,
    limitAiAgent: Number(x.limitAiAgent ?? x.LimitAiAgent ?? 0),
    progress,
  };
};

type DeploymentState = {
  status: CampaignStatus;
  progress: number;

  targetLeads: number;
  currentLeads: number;

  agentsAiActive: number;
  limitAiAgent: number;
};

// normalize response: hỗ trợ [] | {items: []} | {data: []}
const toArray = <T,>(raw: any): T[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

const PLACEHOLDER_IMG =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=60';

// datetime-local helpers
const toLocalInputValue = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}`;
};

const localInputToIso = (local: string) => {
  if (!local) return null;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

const Deployment: React.FC = () => {
  const [projectsCbx, setProjectsCbx] = useState<Project[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
  const [agents, setAgents] = useState<AIAgent[]>([]);

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    projectId: '',
    agentCount: 1,
    targetLeads: 500,
    startAt: new Date().toISOString(),
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);

  const [settingsForm, setSettingsForm] = useState<{
    name: string;
    status: 'Active' | 'Paused'; // UI cho phép bật/tắt
    startAtLocal: string;
    endAtLocal: string;
    targetLeads: number;
    limitAiAgent: number;
  }>({
    name: '',
    status: 'Paused',
    startAtLocal: '',
    endAtLocal: '',
    targetLeads: 500,
    limitAiAgent: 1,
  });

  // Assignments Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AgentProjectAssignmentDto[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  const [assignForm, setAssignForm] = useState<{
    id?: string;
    agentId: string;
    status: string; // "Active" | "Paused" | "Disabled"
  }>({
    agentId: '',
    status: 'Active',
  });

  const agentNameById = (agentId: string) => {
    const found = agents.find(a => a.id === agentId);
    return found?.name || agentId;
  };

  const openAssignModal = async (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setIsAssignModalOpen(true);
    setAssignForm({ agentId: '', status: 'Active' });

    try {
      setLoadingAssignments(true);
      const data = await api.getAssignmentsByCampaign(campaignId); // NEW API inside service
      setAssignments(toArray<AgentProjectAssignmentDto>(data));
    } catch (e) {
      console.error(e);
      setAssignments([]);
      alert('Không tải được danh sách Agent thuộc chiến dịch.');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const reloadAssignments = async () => {
    if (!selectedCampaignId) return;
    setLoadingAssignments(true);
    try {
      const data = await api.getAssignmentsByCampaign(selectedCampaignId);
      setAssignments(toArray<AgentProjectAssignmentDto>(data));
    } finally {
      setLoadingAssignments(false);
    }
  };

  // trạng thái triển khai theo campaignId
  const [deploymentStates, setDeploymentStates] = useState<Record<string, DeploymentState>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campaignsRes, agentsRes, projectsRes] = await Promise.allSettled([
        api.getCampaigns(),     // NEW API inside service
        (api as any).getAgents?.() ?? Promise.resolve([]),
        (api as any).getProjectsCbx?.() ?? Promise.resolve([]),
      ]);

      const cRaw = campaignsRes.status === 'fulfilled' ? campaignsRes.value : [];
      const aRaw = agentsRes.status === 'fulfilled' ? agentsRes.value : [];
      const pRaw = projectsRes.status === 'fulfilled' ? projectsRes.value : [];

      const cApi = toArray<CampaignDtoApi>(cRaw);
      const cData = cApi.map(mapCampaignApiToUi);

      const aData = toArray<AIAgent>(aRaw);
      // projectsCbx: backend trả paged => items
      const pItems = Array.isArray((pRaw as any)?.items) ? (pRaw as any).items : toArray<Project>(pRaw);
      const pData = pItems.map((x: any) => ({
        id: x.id ?? x.Id,
        name: x.name ?? x.Name,
        location: x.location ?? x.Location,
        status: x.status ?? x.Status,
      })) as any as Project[];

      setCampaigns(cData);
      setAgents(aData);
      setProjectsCbx(pData);

      const mappedStates: Record<string, DeploymentState> = {};
      for (const c of cData) {
        mappedStates[c.id] = {
          status: c.status,
          progress: Number(c.progress ?? 0),
          targetLeads: Number(c.targetLeads ?? 0),
          currentLeads: Number(c.currentLeads ?? 0),
          agentsAiActive: Number(c.agentsAiActive ?? 0),
          limitAiAgent: Number(c.limitAiAgent ?? 0),
        };
      }
      setDeploymentStates(mappedStates);

      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching deployment data:", error);
      setCampaigns([]);
      setAgents([]);
      setProjectsCbx([]);
      setDeploymentStates({});
    } finally {
      setLoading(false);
    }
  };

  const ASSIGNMENTS_PER_PAGE = 6;
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [assignmentQ, setAssignmentQ] = useState('');

  const filteredAssignments = useMemo(() => {
    const q = assignmentQ.trim().toLowerCase();
    if (!q) return assignments;

    return assignments.filter(x => {
      const name = agentNameById(x.agentId)?.toLowerCase() || '';
      const id8 = (x.id || '').slice(-8).toLowerCase();
      const st = (x.status || '').toLowerCase();
      return name.includes(q) || id8.includes(q) || st.includes(q);
    });
  }, [assignments, assignmentQ, agents]);

  const totalAssignmentsPages = Math.max(1, Math.ceil(filteredAssignments.length / ASSIGNMENTS_PER_PAGE));
  const currentAssignments = filteredAssignments.slice(
    (assignmentsPage - 1) * ASSIGNMENTS_PER_PAGE,
    assignmentsPage * ASSIGNMENTS_PER_PAGE
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setAssignmentsPage(1);
  }, [assignmentQ]);

  // ===== CREATE CAMPAIGN (NEW API flow is handled inside apiService.createCampaign) =====
  const handleStartCampaign = async () => {
    if (!newCampaign.name.trim()) {
      alert("Vui lòng nhập Tên chiến dịch!");
      return;
    }
    if (!newCampaign.projectId) {
      alert("Vui lòng chọn dự án để triển khai!");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: newCampaign.name.trim(),
        projectId: newCampaign.projectId,
        startAt: newCampaign.startAt ?? null,
        endAt: newCampaign.endAt ?? null,
        targetLeads: Number(newCampaign.targetLeads || 0),
        limitAiAgent: Number(newCampaign.agentCount || 1),
      };

      const created = await api.createCampaign(payload as any); // NEW API inside service

      // reload server state to be accurate
      await fetchData();

      setIsModalOpen(false);
      setNewCampaign({
        name: '',
        projectId: '',
        agentCount: 1,
        targetLeads: 500,
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      alert('Tạo chiến dịch thất bại. Vui lòng kiểm tra API/Server.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSettings = (campaignId: string) => {
    const c = campaigns.find(x => x.id === campaignId);
    const state = deploymentStates[campaignId];
    if (!c || !state) return;

    setSelectedDeploymentId(campaignId);

    // UI settings chỉ cho Active/Paused
    const uiStatus = c.status === 'Active' ? 'Active' : 'Paused';

    setSettingsForm({
      name: c.name,
      status: uiStatus,
      startAtLocal: toLocalInputValue(c.startAt),
      endAtLocal: toLocalInputValue(c.endAt),
      targetLeads: state.targetLeads,
      limitAiAgent: state.limitAiAgent,
    });
    setIsSettingsModalOpen(true);
  };

  const handleUpdateSettings = async () => {
    if (!selectedDeploymentId) return;

    const currentState = deploymentStates[selectedDeploymentId];
    if (!currentState) return;

    const startAtIso = localInputToIso(settingsForm.startAtLocal);
    const endAtIso = localInputToIso(settingsForm.endAtLocal);

    const payload = {
      name: settingsForm.name.trim(),
      status: settingsForm.status, // Active | Paused (PATCH status)
      startAt: startAtIso,
      endAt: endAtIso,
      targetLeads: Number(settingsForm.targetLeads || 0),
      limitAiAgent: Number(settingsForm.limitAiAgent || 0),
    };

    if (!payload.name) {
      alert('Tên chiến dịch không được rỗng.');
      return;
    }

    const newProgress = Math.min(
      100,
      Math.round((currentState.currentLeads / Math.max(1, payload.targetLeads || 1)) * 100)
    );

    // optimistic UI
    setCampaigns(prev =>
      prev.map(c =>
        c.id === selectedDeploymentId
          ? { ...c, name: payload.name, startAt: payload.startAt, endAt: payload.endAt }
          : c
      )
    );

    setDeploymentStates(prev => ({
      ...prev,
      [selectedDeploymentId]: {
        ...prev[selectedDeploymentId],
        targetLeads: payload.targetLeads ?? 0,
        limitAiAgent: payload.limitAiAgent ?? 0,
        progress: newProgress,
      }
    }));

    try {
      await api.updateCampaign(selectedDeploymentId, {
        name: payload.name,
        status: payload.status,
        startAt: payload.startAt,
        endAt: payload.endAt,
        targetLeads: payload.targetLeads,
        limitAiAgent: payload.limitAiAgent,
      } as any);

      setIsSettingsModalOpen(false);
      await fetchData();
    } catch (e) {
      console.error(e);
      alert('Lưu cấu hình chiến dịch thất bại.');
      await fetchData(); // rollback chuẩn
    }
  };

  const toggleDeploymentStatus = async (id: string) => {
    const current = deploymentStates[id];
    if (!current) return;

    if (current.status === 'Completed' || current.status === 'Stopped') {
      alert('Chiến dịch đã kết thúc, không thể thay đổi trạng thái.');
      return;
    }

    const nextStatus = current.status === 'Active' ? 'Paused' : 'Active';

    // optimistic
    setDeploymentStates(prev => ({
      ...prev,
      [id]: { ...prev[id], status: nextStatus as CampaignStatus }
    }));
    setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, status: nextStatus as any } : c)));

    try {
      await api.updateCampaignStatus(id, { status: nextStatus });
    } catch (e) {
      console.error(e);

      // rollback
      setDeploymentStates(prev => ({
        ...prev,
        [id]: { ...prev[id], status: current.status }
      }));
      setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, status: current.status } : c)));

      alert('Cập nhật trạng thái chiến dịch thất bại.');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-black text-xs uppercase tracking-widest animate-pulse">
          Đang thiết lập môi trường triển khai AI...
        </p>
      </div>
    );
  }

  const activeDeployments = campaigns.filter(c => deploymentStates[c.id]);
  const totalPages = Math.ceil(activeDeployments.length / PROJECTS_PER_PAGE);
  const currentDeployments = activeDeployments.slice(
    (currentPage - 1) * PROJECTS_PER_PAGE,
    currentPage * PROJECTS_PER_PAGE
  );

  const selectedCampaignForSetting = campaigns.find(c => c.id === selectedDeploymentId);

  const statusBadge = (st: CampaignStatus) => {
    if (st === 'Active') return { text: 'Đang triển khai', cls: 'bg-green-50 text-green-700 border-green-200' };
    if (st === 'Paused') return { text: 'Tạm dừng', cls: 'bg-orange-50 text-orange-700 border-orange-200' };
    if (st === 'Draft') return { text: 'Bản nháp', cls: 'bg-slate-50 text-slate-700 border-slate-200' };
    if (st === 'Completed') return { text: 'Hoàn tất', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    return { text: 'Đã dừng', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-none">Triển khai Dự án</h2>
          <p className="text-gray-500 font-medium mt-2">Kích hoạt và giám sát lực lượng AI cho từng chiến dịch cụ thể.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 p-0.5 rounded-xl flex items-center shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              title="Dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
              title="Dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => fetchData()}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-indigo-600 shadow-sm transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100"
          >
            <Rocket className="w-4 h-4" /> Bắt đầu chiến dịch
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
            <Rocket className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors duration-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Chiến dịch đang chạy</p>
            <p className="text-2xl font-black text-gray-900 leading-none">
              {activeDeployments.filter(c => deploymentStates[c.id]?.status === 'Active').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
          <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-600 transition-colors duration-500">
            <Activity className="w-7 h-7 text-green-600 group-hover:text-white transition-colors duration-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tốc độ Lead (24h)</p>
            <p className="text-2xl font-black text-gray-900 leading-none">—</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-500">
            <Bot className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors duration-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Hiệu suất AI</p>
            <p className="text-2xl font-black text-gray-900 leading-none">—</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 px-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          Các dự án đang triển khai bán hàng
        </h3>

        {activeDeployments.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {currentDeployments.map((c) => {
                  const state = deploymentStates[c.id];
                  if (!state) return null;

                  const badge = statusBadge(state.status);

                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row gap-8"
                    >
                      <div className="w-full md:w-32 h-32 rounded-3xl overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
                        <img src={PLACEHOLDER_IMG} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-black text-gray-900 leading-none">{c.name}</h4>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${badge.cls}`}>
                                {badge.text}
                              </span>
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Campaign</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleOpenSettings(c.id)}
                              className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all border border-gray-100 hover:bg-white hover:shadow-md"
                            >
                              <Settings className="w-5 h-5" />
                            </button>

                            <button
                              disabled={state.status === 'Completed' || state.status === 'Stopped'}
                              onClick={() => toggleDeploymentStatus(c.id)}
                              className={`p-2.5 rounded-xl transition-all shadow-md ${
                                state.status === 'Active'
                                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              } ${state.status === 'Completed' || state.status === 'Stopped' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {state.status === 'Active' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                              <span>Tiến độ mục tiêu Lead</span>
                              <span>{state.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden shadow-inner">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-full"
                                style={{ width: `${state.progress}%` }}
                              />
                            </div>
                            <p className="text-[11px] font-bold text-gray-500">
                              {state.currentLeads} / {state.targetLeads} Leads
                            </p>
                          </div>

                          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                                <Bot className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Nhân viên AI</p>
                                <p className="text-sm font-black text-indigo-900 leading-none">{state.agentsAiActive} Active</p>
                              </div>
                            </div>
                            <button
                              onClick={() => openAssignModal(c.id)}
                              className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
                            >
                              Điều phối
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Dự án triển khai</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Tiến độ mục tiêu</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Lực lượng AI</th>
                      <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {currentDeployments.map((c) => {
                      const state = deploymentStates[c.id];
                      if (!state) return null;

                      const badge = statusBadge(state.status);

                      return (
                        <tr key={c.id} className="hover:bg-indigo-50/20 transition-colors group">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
                                <img src={PLACEHOLDER_IMG} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-black text-gray-900 text-sm truncate">{c.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Campaign</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-8 py-4">
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${badge.cls}`}>
                              {badge.text}
                            </span>
                          </td>

                          <td className="px-8 py-4">
                            <div className="w-48 space-y-1.5">
                              <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase">
                                <span>{state.currentLeads} / {state.targetLeads}</span>
                                <span>{state.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-600 h-full" style={{ width: `${state.progress}%` }} />
                              </div>
                            </div>
                          </td>

                          <td className="px-8 py-4 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                              <Bot className="w-4 h-4" />
                              <span className="text-xs font-black">{state.limitAiAgent}</span>
                            </div>
                          </td>

                          <td className="px-8 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                disabled={state.status === 'Completed' || state.status === 'Stopped'}
                                onClick={() => toggleDeploymentStatus(c.id)}
                                className={`p-2 rounded-xl transition-all shadow-sm ${
                                  state.status === 'Active'
                                    ? 'text-orange-500 hover:bg-orange-50'
                                    : 'text-green-600 hover:bg-green-50'
                                } ${state.status === 'Completed' || state.status === 'Stopped' ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                {state.status === 'Active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleOpenSettings(c.id)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openAssignModal(c.id)}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                title="Điều phối AI"
                              >
                                <Users className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={activeDeployments.length}
              itemsPerPage={PROJECTS_PER_PAGE}
            />
          </>
        ) : (
          <div className="py-20 bg-white rounded-[40px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Inbox className="w-10 h-10 text-gray-200" />
            </div>
            <h4 className="text-xl font-black text-gray-900 mb-2">Chưa có dự án nào đang triển khai</h4>
            <p className="text-gray-500 max-w-sm mb-8">Hãy chọn dự án mục tiêu và kích hoạt lực lượng AI để bắt đầu chiến dịch bán hàng.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Khởi tạo ngay
            </button>
          </div>
        )}
      </div>

      {/* MODAL: ĐIỀU PHỐI AI */}
      {isAssignModalOpen && selectedCampaignId && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-7xl max-h-[92vh] rounded-[48px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Header */}
            <div className="px-12 py-10 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-8">
                <div className="p-6 bg-indigo-600 rounded-[32px] text-white shadow-2xl shadow-indigo-100">
                  <Bot className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">Điều phối nhân viên AI</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" /> Quản trị và phân bổ nguồn lực tự động
                    </p>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <p className="text-[11px] text-indigo-600 font-black uppercase tracking-widest">
                      Chiến dịch: {campaigns.find(c => c.id === selectedCampaignId)?.name}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setSelectedCampaignId(null);
                  setAssignments([]);
                  setAssignForm({ agentId: '', status: 'Active' });
                  setAssignmentQ('');
                }}
                className="p-4 hover:bg-red-50 rounded-full group transition-all active:scale-90"
              >
                <XCircle className="w-11 h-11 text-slate-300 group-hover:text-red-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-12 py-10 space-y-8">
              {/* Form */}
              <div className="bg-slate-50 border border-slate-100 rounded-[40px] p-10 space-y-8 shadow-sm">
                {assignForm.id && (
                  <button
                    onClick={() => setAssignForm({ agentId: '', status: 'Active' })}
                    className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" /> Hủy chế độ chỉnh sửa
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
                  {/* Select Agent */}
                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Chọn nhân viên từ kho dữ liệu
                    </label>
                    <div className="relative">
                      <select
                        value={assignForm.agentId}
                        disabled={!!assignForm.id}
                        onChange={(e) => setAssignForm(prev => ({ ...prev, agentId: e.target.value }))}
                        className={`w-full px-7 py-5 bg-white border border-slate-200 rounded-3xl text-base font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer ${
                          assignForm.id ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''
                        }`}
                      >
                        <option value="">-- Danh sách nhân viên khả dụng --</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.name} (Tình trạng: {a.status})
                          </option>
                        ))}
                      </select>
                      {!assignForm.id && (
                        <ChevronDown className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-6 h-6" />
                      )}
                    </div>
                  </div>

                  {/* Status (NEW: Active/Paused/Disabled) */}
                  <div className="md:col-span-1 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Trạng thái assignment
                    </label>
                    <div className="relative">
                      <select
                        value={assignForm.status}
                        onChange={(e) => setAssignForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-7 py-5 bg-white border border-slate-200 rounded-3xl text-base font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="Active">Hoạt động (Active)</option>
                        <option value="Paused">Tạm dừng (Paused)</option>
                        <option value="Disabled">Tắt (Disabled)</option>
                      </select>
                      <ChevronDown className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-6 h-6" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-1">
                    {assignForm.id ? (
                      <button
                        onClick={async () => {
                          try {
                            setLoadingAssignments(true);
                            await api.updateAssignment(assignForm.id!, { status: assignForm.status });
                            await reloadAssignments();
                            setAssignForm({ agentId: '', status: 'Active' });
                          } catch (e) {
                            console.error(e);
                            alert('Cập nhật assignment thất bại.');
                          } finally {
                            setLoadingAssignments(false);
                          }
                        }}
                        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <Save className="w-5 h-5" /> Cập nhật ngay
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!assignForm.agentId) {
                            alert('Vui lòng chọn nhân viên!');
                            return;
                          }

                          try {
                            setLoadingAssignments(true);
                            await api.createAssignment({
                              agentId: assignForm.agentId,
                              campaignId: selectedCampaignId,
                              status: assignForm.status
                            });
                            await reloadAssignments();
                            setAssignForm({ agentId: '', status: 'Active' });
                          } catch (e) {
                            console.error(e);
                            alert('Thêm Agent vào chiến dịch thất bại (có thể bị trùng Agent hoặc vượt Limit).');
                          } finally {
                            setLoadingAssignments(false);
                          }
                        }}
                        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <PlusCircle className="w-6 h-6" /> Thêm vào đội ngũ
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white rounded-[48px] border border-slate-100 overflow-hidden shadow-sm flex flex-col">
                <div className="px-8 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <h5 className="text-[12px] font-black uppercase tracking-widest text-slate-900">
                      Danh sách nhân sự đang vận hành
                    </h5>
                    <span className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-600 shadow-sm">
                      {filteredAssignments.length} Thành viên
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    {loadingAssignments && (
                      <div className="flex items-center gap-3 text-indigo-600 text-[11px] font-black uppercase tracking-widest animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang đồng bộ...
                      </div>
                    )}

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={assignmentQ}
                        onChange={(e) => setAssignmentQ(e.target.value)}
                        type="text"
                        placeholder="Tìm theo tên / status / mã..."
                        className="pl-11 pr-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-indigo-50 outline-none w-72 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400">
                          Tên nhân viên AI / Định danh
                        </th>
                        <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400">
                          Trạng thái
                        </th>
                        <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400">
                          Ngày gia nhập
                        </th>
                        <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">
                          Tác vụ
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-50">
                      {currentAssignments.map((x) => (
                        <tr key={x.id} className="hover:bg-indigo-50/30 transition-all group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-all duration-300">
                                <Bot className="w-7 h-7" />
                              </div>
                              <div>
                                <div className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                                  {agentNameById(x.agentId)}
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                  LOG ID: #{(x.id || '').slice(-8).toUpperCase()}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-8 py-6">
                            <span
                              className={`inline-flex items-center justify-center px-4 py-2 rounded-2xl text-[11px] font-black uppercase border whitespace-nowrap ${
                                x.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : x.status === 'Paused'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {x.status === 'Active' ? 'Hoạt động' : x.status === 'Paused' ? 'Tạm dừng' : 'Tắt'}
                            </span>
                          </td>

                          <td className="px-8 py-6">
                            <div className="text-sm font-bold text-slate-500 whitespace-nowrap">
                              {formatDateTime(x.createdAt)}
                            </div>
                          </td>

                          <td className="px-8 py-6 text-right">
                            <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                              <button
                                onClick={() => setAssignForm({ id: x.id, agentId: x.agentId, status: (x.status ?? 'Active') })}
                                className="p-3 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all shadow-sm hover:shadow-md bg-white border border-indigo-50"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-6 h-6" />
                              </button>

                              <button
                                onClick={async () => {
                                  if (!window.confirm('Hủy phân bổ nhân sự này?')) return;
                                  try {
                                    setLoadingAssignments(true);
                                    await api.deleteAssignment(x.id);
                                    await reloadAssignments();
                                  } catch (e) {
                                    console.error(e);
                                    alert('Xóa assignment thất bại.');
                                  } finally {
                                    setLoadingAssignments(false);
                                  }
                                }}
                                className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all shadow-sm hover:shadow-md bg-white border border-red-50"
                                title="Gỡ khỏi chiến dịch"
                              >
                                <Trash2 className="w-6 h-6" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {filteredAssignments.length === 0 && !loadingAssignments && (
                        <tr>
                          <td colSpan={4} className="px-8 py-32 text-center">
                            <div className="flex flex-col items-center">
                              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                                <Users className="w-12 h-12 text-slate-200" />
                              </div>
                              <p className="text-slate-400 font-black uppercase text-sm tracking-widest">Danh sách nhân sự đang trống</p>
                              <p className="text-slate-300 text-xs mt-2 font-medium">Sử dụng form phía trên để phân bổ đội ngũ AI.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {filteredAssignments.length > ASSIGNMENTS_PER_PAGE && (
                  <Pagination
                    currentPage={assignmentsPage}
                    totalPages={totalAssignmentsPages}
                    onPageChange={setAssignmentsPage}
                    totalItems={filteredAssignments.length}
                    itemsPerPage={ASSIGNMENTS_PER_PAGE}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-12 py-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-indigo-400" />
                    </div>
                  ))}
                </div>
                <div className="h-10 w-px bg-slate-200 mx-2" />
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                  Trạng thái hệ thống: <span className="text-emerald-500">Đã sẵn sàng</span>
                  <br />
                  <span className="text-slate-300 normal-case font-medium">
                    Mọi thay đổi sẽ được áp dụng ngay lập tức cho các quy trình AI đang chạy.
                  </span>
                </p>
              </div>

              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-12 py-5 bg-indigo-900 text-white rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-800 transition-all active:scale-95 flex items-center gap-3"
              >
                <Save className="w-5 h-5" /> Hoàn tất và Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KHỞI TẠO CHIẾN DỊCH MỚI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-[32px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">Khởi tạo chiến dịch</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Cấu hình lực lượng bán hàng AI</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 rounded-full group transition-all">
                <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
              </button>
            </div>

            <div className="px-8 py-6 space-y-6 overflow-y-auto">
              {/* Tên chiến dịch */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Rocket className="w-3 h-3" /> Tên chiến dịch
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="VD: Chiến dịch năm 2026"
                />
              </div>

              {/* Chọn dự án */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Building2 className="w-3 h-3" /> Dự án BĐS mục tiêu
                </label>
                <div className="relative">
                  <select
                    value={newCampaign.projectId}
                    onChange={(e) => setNewCampaign({ ...newCampaign, projectId: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Chọn dự án...</option>
                    {projectsCbx.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Phân bổ nhân viên AI */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Bot className="w-3 h-3 text-indigo-500" /> Phân bổ nhân viên AI
                  </label>
                  <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{newCampaign.agentCount} Agents</span>
                </div>
                <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={newCampaign.agentCount}
                    onChange={(e) => setNewCampaign({ ...newCampaign, agentCount: parseInt(e.target.value) })}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] font-black text-indigo-300 uppercase">
                    <span>1 Nhân viên</span>
                    <span>Tối đa 20</span>
                  </div>
                </div>
              </div>

              {/* Mục tiêu Lead */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Users className="w-3 h-3" /> Mục tiêu Lead chất lượng
                </label>
                <input
                  type="number"
                  value={newCampaign.targetLeads}
                  onChange={(e) => setNewCampaign({ ...newCampaign, targetLeads: parseInt(e.target.value || '0') })}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="VD: 500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleStartCampaign}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> Triển khai ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SETTINGS */}
      {isSettingsModalOpen && selectedCampaignForSetting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">Cấu hình Chiến dịch</h3>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-2">
                    {selectedCampaignForSetting.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 hover:bg-red-50 rounded-full group transition-all">
                <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Tên chiến dịch
                  </label>
                  <input
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Trạng thái
                  </label>
                  <div className="relative">
                    <select
                      value={settingsForm.status}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
                    >
                      <option value="Active">Active (Đang chạy)</option>
                      <option value="Paused">Paused (Tạm dừng)</option>
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Thời gian bắt đầu
                  </label>
                  <input
                    type="datetime-local"
                    value={settingsForm.startAtLocal}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, startAtLocal: e.target.value }))}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Thời gian kết thúc
                  </label>
                  <input
                    type="datetime-local"
                    value={settingsForm.endAtLocal}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, endAtLocal: e.target.value }))}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Mục tiêu Lead
                  </label>
                  <input
                    type="number"
                    value={settingsForm.targetLeads}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, targetLeads: parseInt(e.target.value || '0') }))}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Giới hạn AI Agent
                  </label>
                  <input
                    type="number"
                    value={settingsForm.limitAiAgent}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, limitAiAgent: parseInt(e.target.value || '0') }))}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-4">
                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleUpdateSettings}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> Lưu cấu hình
                </button>
              </div>

              <p className="text-[10px] text-gray-400 italic px-1 font-medium">
                * Status được update qua PATCH /api/campaigns/{'{id}'}/status, còn field khác qua PUT /api/campaigns/{'{id}'}.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deployment;


// /// TRIỂN KHAI DỰ ÁN
// import React, { useState, useEffect, useMemo } from 'react';
// import { Project, AIAgent } from '../types';
// import Pagination from '../components/Pagination';
// import {
//   Rocket, Activity, Bot, Zap,
//   Play, Pause, Settings, RefreshCw,
//   Loader2, LayoutGrid, List,
//   Building2, Users, XCircle, ChevronDown, PlusCircle,
//   TrendingUp, Inbox, Save, Edit2, Trash2, Search
// } from 'lucide-react';

// import { api, AgentProjectAssignmentDto } from '../services/apiService';
// import { formatDateTime } from '@/components/utils/formatDate';

// const PROJECTS_PER_PAGE = 4;

// // ===== Backend DTO (API trả về PascalCase) =====
// type CampaignDtoApi = {
//   id?: string;
//   name?: string;
//   status?: string;
//   startAt?: string | null;
//   endAt?: string | null;

//   Id?: string;
//   Name?: string;
//   Status?: string;
//   StartAt?: string | null;
//   EndAt?: string | null;

//   AgentsAiActive?: number;
//   TargetLeads?: number;
//   CurrentLeads?: number;
//   LimitAiAgent?: number;
//   Progress?: number;
// };

// // ✅ chỉ 2 trạng thái
// type CampaignStatus = 'Active' | 'Paused';

// // ===== UI DTO (camelCase) =====
// type CampaignDto = {
//   id: string;
//   name: string;
//   status: CampaignStatus;
//   startAt?: string | null;
//   endAt?: string | null;

//   agentsAiActive: number;
//   targetLeads: number;
//   currentLeads: number;
//   limitAiAgent: number;
//   progress: number;
// };

// const normalizeCampaignStatus = (s: any): CampaignStatus => {
//   const v = String(s || '').toLowerCase();
//   if (v === 'paused') return 'Paused';
//   return 'Active';
// };

// const mapCampaignApiToUi = (x: any): CampaignDto => {
//   const id = (x.id ?? x.Id ?? '') as string;
//   const name = (x.name ?? x.Name ?? '') as string;
//   const status = normalizeCampaignStatus(x.status ?? x.Status);

//   return {
//     id,
//     name,
//     status,
//     startAt: (x.startAt ?? x.StartAt ?? null) as any,
//     endAt: (x.endAt ?? x.EndAt ?? null) as any,

//     agentsAiActive: Number(x.agentsAiActive ?? x.AgentsAiActive ?? 0),
//     targetLeads: Number(x.targetLeads ?? x.TargetLeads ?? 0),
//     currentLeads: Number(x.currentLeads ?? x.CurrentLeads ?? 0),
//     limitAiAgent: Number(x.limitAiAgent ?? x.LimitAiAgent ?? 0),
//     progress: Number(x.progress ?? x.Progress ?? 0),
//   };
// };

// type DeploymentState = {
//   status: CampaignStatus;
//   progress: number;

//   targetLeads: number;
//   currentLeads: number;

//   agentsAiActive: number;
//   limitAiAgent: number;
// };

// // ✅ normalize response: hỗ trợ [] | {items: []} | {data: []}
// const toArray = <T,>(raw: any): T[] => {
//   if (Array.isArray(raw)) return raw;
//   if (Array.isArray(raw?.items)) return raw.items;
//   if (Array.isArray(raw?.data)) return raw.data;
//   return [];
// };

// const PLACEHOLDER_IMG =
//   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=60';

// // ===== helpers for datetime-local =====
// const toLocalInputValue = (iso?: string | null) => {
//   if (!iso) return '';
//   const d = new Date(iso);
//   if (Number.isNaN(d.getTime())) return '';
//   // yyyy-MM-ddTHH:mm
//   const pad = (n: number) => String(n).padStart(2, '0');
//   const yyyy = d.getFullYear();
//   const MM = pad(d.getMonth() + 1);
//   const dd = pad(d.getDate());
//   const HH = pad(d.getHours());
//   const mm = pad(d.getMinutes());
//   return `${yyyy}-${MM}-${dd}T${HH}:${mm}`;
// };

// const localInputToIso = (local: string) => {
//   // local is "yyyy-MM-ddTHH:mm"
//   if (!local) return null;
//   const d = new Date(local);
//   if (Number.isNaN(d.getTime())) return null;
//   return d.toISOString();
// };

// const Deployment: React.FC = () => {
//   const [projectsCbx, setProjectsCbx] = useState<Project[]>([]);
//   const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
//   const [agents, setAgents] = useState<AIAgent[]>([]);

//   const [loading, setLoading] = useState(true);
//   const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
//   const [currentPage, setCurrentPage] = useState(1);

//   // Create Modal State
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [newCampaign, setNewCampaign] = useState({
//     name: '',
//     projectId: '',
//     agentCount: 1,
//     targetLeads: 500,
//     startAt: new Date().toISOString(),
//     endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//   });

//   // Settings Modal State
//   const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
//   const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);

//   // ✅ Settings form khớp API update full campaign
//   const [settingsForm, setSettingsForm] = useState<{
//     name: string;
//     status: CampaignStatus;
//     startAtLocal: string; // datetime-local
//     endAtLocal: string;   // datetime-local
//     targetLeads: number;
//     limitAiAgent: number;
//   }>({
//     name: '',
//     status: 'Paused',
//     startAtLocal: '',
//     endAtLocal: '',
//     targetLeads: 500,
//     limitAiAgent: 1,
//   });

//   // ===== Assignments Modal =====
//   const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
//   const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
//   const [assignments, setAssignments] = useState<AgentProjectAssignmentDto[]>([]);
//   const [loadingAssignments, setLoadingAssignments] = useState(false);

//   const [assignForm, setAssignForm] = useState<{
//     id?: string;
//     agentId: string;
//     status: string;
//   }>({
//     agentId: '',
//     status: 'Active',
//   });

//   const agentNameById = (agentId: string) => {
//     const found = agents.find(a => a.id === agentId);
//     return found?.name || agentId;
//   };

//   const openAssignModal = async (campaignId: string) => {
//     setSelectedCampaignId(campaignId);
//     setIsAssignModalOpen(true);
//     setAssignForm({ agentId: '', status: 'Active' });

//     try {
//       setLoadingAssignments(true);
//       const data = await api.getAssignmentsByCampaign(campaignId);
//       setAssignments(toArray<AgentProjectAssignmentDto>(data));
//     } catch (e) {
//       console.error(e);
//       setAssignments([]);
//       alert('Không tải được danh sách Agent thuộc chiến dịch.');
//     } finally {
//       setLoadingAssignments(false);
//     }
//   };

//   const reloadAssignments = async () => {
//     if (!selectedCampaignId) return;
//     setLoadingAssignments(true);
//     try {
//       const data = await api.getAssignmentsByCampaign(selectedCampaignId);
//       setAssignments(toArray<AgentProjectAssignmentDto>(data));
//     } finally {
//       setLoadingAssignments(false);
//     }
//   };

//   // trạng thái triển khai theo campaignId
//   const [deploymentStates, setDeploymentStates] = useState<Record<string, DeploymentState>>({});

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const [campaignsRes, agentsRes, projectsRes] = await Promise.allSettled([
//         api.request<any>(`/campaigns`, { method: 'GET' }),

//         typeof (api as any).getAgents === 'function'
//           ? (api as any).getAgents()
//           : Promise.resolve([]),

//         typeof (api as any).getProjectsCbx === 'function'
//           ? (api as any).getProjectsCbx()
//           : (typeof (api as any).getProjects === 'function'
//             ? (api as any).getProjects()
//             : Promise.resolve([])),
//       ]);

//       const cRaw = campaignsRes.status === 'fulfilled' ? campaignsRes.value : [];
//       const aRaw = agentsRes.status === 'fulfilled' ? agentsRes.value : [];
//       const pRaw = projectsRes.status === 'fulfilled' ? projectsRes.value : [];

//       const cApi = toArray<CampaignDtoApi>(cRaw);
//       const cData = cApi.map(mapCampaignApiToUi);

//       const aData = toArray<AIAgent>(aRaw);
//       const pData = toArray<Project>(pRaw);

//       setCampaigns(cData);
//       setAgents(aData);
//       setProjectsCbx(pData);

//       const mappedStates: Record<string, DeploymentState> = {};
//       for (const c of cData) {
//         mappedStates[c.id] = {
//           status: c.status,
//           progress: Number(c.progress ?? 0),
//           targetLeads: Number(c.targetLeads ?? 0),
//           currentLeads: Number(c.currentLeads ?? 0),
//           agentsAiActive: Number(c.agentsAiActive ?? 0),
//           limitAiAgent: Number(c.limitAiAgent ?? 0),
//         };
//       }
//       setDeploymentStates(mappedStates);

//       setCurrentPage(1);
//     } catch (error) {
//       console.error("Error fetching deployment data:", error);
//       setCampaigns([]);
//       setAgents([]);
//       setProjectsCbx([]);
//       setDeploymentStates({});
//     } finally {
//       setLoading(false);
//     }
//   };

//   const ASSIGNMENTS_PER_PAGE = 6;
//   const [assignmentsPage, setAssignmentsPage] = useState(1);
//   const [assignmentQ, setAssignmentQ] = useState('');

//   const filteredAssignments = useMemo(() => {
//     const q = assignmentQ.trim().toLowerCase();
//     if (!q) return assignments;

//     return assignments.filter(x => {
//       const name = agentNameById(x.agentId)?.toLowerCase() || '';
//       const id8 = (x.id || '').slice(-8).toLowerCase();
//       const st = (x.status || '').toLowerCase();
//       return name.includes(q) || id8.includes(q) || st.includes(q);
//     });
//   }, [assignments, assignmentQ, agents]);

//   const totalAssignmentsPages = Math.max(1, Math.ceil(filteredAssignments.length / ASSIGNMENTS_PER_PAGE));
//   const currentAssignments = filteredAssignments.slice(
//     (assignmentsPage - 1) * ASSIGNMENTS_PER_PAGE,
//     assignmentsPage * ASSIGNMENTS_PER_PAGE
//   );

//   useEffect(() => {
//     fetchData();
//   }, []);

//   useEffect(() => {
//     setAssignmentsPage(1);
//   }, [assignmentQ]);

//   const handleStartCampaign = async () => {
//     if (!newCampaign.name.trim()) {
//       alert("Vui lòng nhập Tên chiến dịch!");
//       return;
//     }
//     if (!newCampaign.projectId) {
//       alert("Vui lòng chọn dự án để triển khai!");
//       return;
//     }

//     try {
//       setLoading(true);

//       const payload = {
//         name: newCampaign.name.trim(),
//         projectId: newCampaign.projectId,
//         startAt: newCampaign.startAt,
//         endAt: newCampaign.endAt,
//         targetLeads: Number(newCampaign.targetLeads || 0),
//         limitAiAgent: Number(newCampaign.agentCount || 0),
//       };

//       const created = await api.createCampaign(payload);

//       // ✅ nếu backend không trả status -> default Paused (an toàn)
//       const createdStatus: CampaignStatus = normalizeCampaignStatus((created as any)?.status ?? 'Paused');

//       setCampaigns(prev => [
//         {
//           id: created.id,
//           name: payload.name,
//           status: createdStatus,
//           startAt: payload.startAt,
//           endAt: payload.endAt,
//           agentsAiActive: 0,
//           targetLeads: payload.targetLeads,
//           currentLeads: 0,
//           limitAiAgent: payload.limitAiAgent,
//           progress: 0,
//         },
//         ...prev,
//       ]);

//       setDeploymentStates(prev => ({
//         ...prev,
//         [created.id]: {
//           status: createdStatus,
//           progress: 0,
//           targetLeads: payload.targetLeads,
//           currentLeads: 0,
//           agentsAiActive: 0,
//           limitAiAgent: payload.limitAiAgent,
//         },
//       }));

//       setIsModalOpen(false);
//       setNewCampaign({
//         name: '',
//         projectId: '',
//         agentCount: 1,
//         targetLeads: 500,
//         startAt: new Date().toISOString(),
//         endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//       });
//       setCurrentPage(1);
//     } catch (err) {
//       console.error(err);
//       alert('Tạo chiến dịch thất bại. Vui lòng kiểm tra API/Server.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleOpenSettings = (campaignId: string) => {
//     const c = campaigns.find(x => x.id === campaignId);
//     const state = deploymentStates[campaignId];
//     if (!c || !state) return;

//     setSelectedDeploymentId(campaignId);
//     setSettingsForm({
//       name: c.name,
//       status: c.status,
//       startAtLocal: toLocalInputValue(c.startAt),
//       endAtLocal: toLocalInputValue(c.endAt),
//       targetLeads: state.targetLeads,
//       limitAiAgent: state.limitAiAgent,
//     });
//     setIsSettingsModalOpen(true);
//   };

//   // ✅ API #2: PUT /api/campaigns/{id} (update full)
//   const handleUpdateSettings = async () => {
//     if (!selectedDeploymentId) return;

//     const currentState = deploymentStates[selectedDeploymentId];
//     if (!currentState) return;

//     const startAtIso = localInputToIso(settingsForm.startAtLocal);
//     const endAtIso = localInputToIso(settingsForm.endAtLocal);

//     const payload = {
//       name: settingsForm.name.trim(),
//       status: settingsForm.status, // Active | Paused
//       startAt: startAtIso,
//       endAt: endAtIso,
//       targetLeads: Number(settingsForm.targetLeads || 0),
//       limitAiAgent: Number(settingsForm.limitAiAgent || 0),
//     };

//     if (!payload.name) {
//       alert('Tên chiến dịch không được rỗng.');
//       return;
//     }

//     const newProgress = Math.min(
//       100,
//       Math.round((currentState.currentLeads / Math.max(1, payload.targetLeads || 1)) * 100)
//     );

//     // optimistic update UI
//     setCampaigns(prev =>
//       prev.map(c =>
//         c.id === selectedDeploymentId
//           ? {
//             ...c,
//             name: payload.name,
//             status: payload.status as CampaignStatus,
//             startAt: payload.startAt,
//             endAt: payload.endAt,
//             targetLeads: payload.targetLeads ?? 0,
//             limitAiAgent: payload.limitAiAgent ?? 0,
//             progress: newProgress
//           }
//           : c
//       )
//     );

//     setDeploymentStates(prev => ({
//       ...prev,
//       [selectedDeploymentId]: {
//         ...prev[selectedDeploymentId],
//         status: payload.status as CampaignStatus,
//         targetLeads: payload.targetLeads ?? 0,
//         limitAiAgent: payload.limitAiAgent ?? 0,
//         progress: newProgress,
//       }
//     }));

//     try {
//       await api.updateCampaign(selectedDeploymentId, payload);
//       setIsSettingsModalOpen(false);
//     } catch (e) {
//       console.error(e);
//       alert('Lưu cấu hình chiến dịch thất bại.');
//       await fetchData(); // rollback chuẩn
//     }
//   };

//   // ✅ API #1: PUT /api/campaigns/{id}/status (chỉ status)
//   const toggleDeploymentStatus = async (id: string) => {
//     const current = deploymentStates[id];
//     if (!current) return;

//     const nextStatus: CampaignStatus = current.status === 'Active' ? 'Paused' : 'Active';

//     // optimistic
//     setDeploymentStates(prev => ({
//       ...prev,
//       [id]: { ...prev[id], status: nextStatus }
//     }));
//     setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, status: nextStatus } : c)));

//     try {
//       await api.updateCampaignStatus(id, { status: nextStatus });
//     } catch (e) {
//       console.error(e);

//       // rollback
//       setDeploymentStates(prev => ({
//         ...prev,
//         [id]: { ...prev[id], status: current.status }
//       }));
//       setCampaigns(prev => prev.map(c => (c.id === id ? { ...c, status: current.status } : c)));

//       alert('Cập nhật trạng thái chiến dịch thất bại.');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="h-full flex flex-col items-center justify-center text-indigo-600">
//         <Loader2 className="w-12 h-12 animate-spin mb-4" />
//         <p className="font-black text-xs uppercase tracking-widest animate-pulse">
//           Đang thiết lập môi trường triển khai AI...
//         </p>
//       </div>
//     );
//   }

//   const activeDeployments = campaigns.filter(c => deploymentStates[c.id]);
//   const totalPages = Math.ceil(activeDeployments.length / PROJECTS_PER_PAGE);
//   const currentDeployments = activeDeployments.slice(
//     (currentPage - 1) * PROJECTS_PER_PAGE,
//     currentPage * PROJECTS_PER_PAGE
//   );

//   const selectedCampaignForSetting = campaigns.find(c => c.id === selectedDeploymentId);

//   return (
//     <div className="space-y-8 animate-in fade-in duration-500 pb-10">
//       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-black text-gray-900 leading-none">Triển khai Dự án</h2>
//           <p className="text-gray-500 font-medium mt-2">Kích hoạt và giám sát lực lượng AI cho từng chiến dịch cụ thể.</p>
//         </div>
//         <div className="flex items-center gap-3">
//           <div className="bg-white border border-gray-200 p-0.5 rounded-xl flex items-center shadow-sm">
//             <button
//               onClick={() => setViewMode('grid')}
//               className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
//               title="Dạng lưới"
//             >
//               <LayoutGrid className="w-4 h-4" />
//             </button>
//             <button
//               onClick={() => setViewMode('table')}
//               className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
//               title="Dạng bảng"
//             >
//               <List className="w-4 h-4" />
//             </button>
//           </div>
//           <button
//             onClick={() => fetchData()}
//             className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-indigo-600 shadow-sm transition-all"
//           >
//             <RefreshCw className="w-5 h-5" />
//           </button>
//           <button
//             onClick={() => setIsModalOpen(true)}
//             className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100"
//           >
//             <Rocket className="w-4 h-4" /> Bắt đầu chiến dịch
//           </button>
//         </div>
//       </header>

//       {/* Stats */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
//           <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
//             <Rocket className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors duration-500" />
//           </div>
//           <div>
//             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Chiến dịch đang chạy</p>
//             <p className="text-2xl font-black text-gray-900 leading-none">{activeDeployments.length}</p>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
//           <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-600 transition-colors duration-500">
//             <Activity className="w-7 h-7 text-green-600 group-hover:text-white transition-colors duration-500" />
//           </div>
//           <div>
//             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tốc độ Lead (24h)</p>
//             <p className="text-2xl font-black text-gray-900 leading-none">+156 Lead</p>
//           </div>
//         </div>

//         <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
//           <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-500">
//             <Bot className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors duration-500" />
//           </div>
//           <div>
//             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Hiệu suất AI</p>
//             <p className="text-2xl font-black text-gray-900 leading-none">94% Capacity</p>
//           </div>
//         </div>
//       </div>

//       <div className="space-y-6">
//         <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 px-2">
//           <Activity className="w-5 h-5 text-indigo-600" />
//           Các dự án đang triển khai bán hàng
//         </h3>

//         {activeDeployments.length > 0 ? (
//           <>
//             {viewMode === 'grid' ? (
//               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {currentDeployments.map((c) => {
//                   const state = deploymentStates[c.id];
//                   if (!state) return null;

//                   return (
//                     <div
//                       key={c.id}
//                       className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row gap-8"
//                     >
//                       <div className="w-full md:w-32 h-32 rounded-3xl overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
//                         <img src={PLACEHOLDER_IMG} className="w-full h-full object-cover" />
//                       </div>

//                       <div className="flex-1 space-y-4">
//                         <div className="flex justify-between items-start">
//                           <div>
//                             <h4 className="text-lg font-black text-gray-900 leading-none">{c.name}</h4>
//                             <div className="flex items-center gap-3 mt-2">
//                               <span
//                                 className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
//                                   state.status === 'Active'
//                                     ? 'bg-green-50 text-green-700 border-green-200'
//                                     : 'bg-orange-50 text-orange-700 border-orange-200'
//                                 }`}
//                               >
//                                 {state.status === 'Active' ? 'Đang triển khai' : 'Tạm dừng'}
//                               </span>
//                               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Campaign</span>
//                             </div>
//                           </div>

//                           <div className="flex gap-2">
//                             <button
//                               onClick={() => handleOpenSettings(c.id)}
//                               className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all border border-gray-100 hover:bg-white hover:shadow-md"
//                             >
//                               <Settings className="w-5 h-5" />
//                             </button>
//                             <button
//                               onClick={() => toggleDeploymentStatus(c.id)}
//                               className={`p-2.5 rounded-xl transition-all shadow-md ${
//                                 state.status === 'Active'
//                                   ? 'bg-orange-500 text-white hover:bg-orange-600'
//                                   : 'bg-green-600 text-white hover:bg-green-700'
//                               }`}
//                             >
//                               {state.status === 'Active' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
//                             </button>
//                           </div>
//                         </div>

//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                           <div className="space-y-2">
//                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
//                               <span>Tiến độ mục tiêu Lead</span>
//                               <span>{state.progress}%</span>
//                             </div>
//                             <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden shadow-inner">
//                               <div
//                                 className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-full"
//                                 style={{ width: `${state.progress}%` }}
//                               />
//                             </div>
//                             <p className="text-[11px] font-bold text-gray-500">
//                               {state.currentLeads} / {state.targetLeads} Leads
//                             </p>
//                           </div>

//                           <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
//                             <div className="flex items-center gap-3">
//                               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
//                                 <Bot className="w-6 h-6" />
//                               </div>
//                               <div>
//                                 <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Nhân viên AI</p>
//                                 <p className="text-sm font-black text-indigo-900 leading-none">{state.agentsAiActive} Active</p>
//                               </div>
//                             </div>
//                             <button
//                               onClick={() => openAssignModal(c.id)}
//                               className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
//                             >
//                               Tăng cường
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             ) : (
//               <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
//                 <table className="w-full text-left min-w-[1000px]">
//                   <thead>
//                     <tr className="bg-gray-50/80 border-b border-gray-100">
//                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Dự án triển khai</th>
//                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
//                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Tiến độ mục tiêu</th>
//                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Lực lượng AI</th>
//                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Tốc độ Lead</th>
//                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-50">
//                     {currentDeployments.map((c) => {
//                       const state = deploymentStates[c.id];
//                       if (!state) return null;

//                       return (
//                         <tr key={c.id} className="hover:bg-indigo-50/20 transition-colors group">
//                           <td className="px-8 py-4">
//                             <div className="flex items-center gap-4">
//                               <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
//                                 <img src={PLACEHOLDER_IMG} className="w-full h-full object-cover" />
//                               </div>
//                               <div className="min-w-0">
//                                 <h4 className="font-black text-gray-900 text-sm truncate">{c.name}</h4>
//                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Campaign</p>
//                               </div>
//                             </div>
//                           </td>

//                           <td className="px-8 py-4">
//                             <span
//                               className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${
//                                 state.status === 'Active'
//                                   ? 'bg-green-50 text-green-700 border-green-200'
//                                   : 'bg-orange-50 text-orange-700 border-orange-200'
//                               }`}
//                             >
//                               {state.status === 'Active' ? 'Vận hành' : 'Tạm dừng'}
//                             </span>
//                           </td>

//                           <td className="px-8 py-4">
//                             <div className="w-48 space-y-1.5">
//                               <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase">
//                                 <span>{state.currentLeads} / {state.targetLeads}</span>
//                                 <span>{state.progress}%</span>
//                               </div>
//                               <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
//                                 <div className="bg-indigo-600 h-full" style={{ width: `${state.progress}%` }} />
//                               </div>
//                             </div>
//                           </td>

//                           <td className="px-8 py-4 text-center">
//                             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
//                               <Bot className="w-4 h-4" />
//                               <span className="text-xs font-black">{state.limitAiAgent}</span>
//                             </div>
//                           </td>

//                           <td className="px-8 py-4 text-center">
//                             <div className="flex items-center justify-center gap-1.5 text-green-600">
//                               <TrendingUp className="w-4 h-4" />
//                               <span className="text-xs font-black">+12%</span>
//                             </div>
//                           </td>

//                           <td className="px-8 py-4 text-right">
//                             <div className="flex items-center justify-end gap-2">
//                               <button
//                                 onClick={() => toggleDeploymentStatus(c.id)}
//                                 className={`p-2 rounded-xl transition-all shadow-sm ${
//                                   state.status === 'Active'
//                                     ? 'text-orange-500 hover:bg-orange-50'
//                                     : 'text-green-600 hover:bg-green-50'
//                                 }`}
//                               >
//                                 {state.status === 'Active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
//                               </button>
//                               <button
//                                 onClick={() => handleOpenSettings(c.id)}
//                                 className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
//                               >
//                                 <Settings className="w-4 h-4" />
//                               </button>
//                               <button
//                                 onClick={() => openAssignModal(c.id)}
//                                 className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
//                                 title="Điều phối AI"
//                               >
//                                 <Users className="w-4 h-4" />
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}

//             <Pagination
//               currentPage={currentPage}
//               totalPages={totalPages}
//               onPageChange={setCurrentPage}
//               totalItems={activeDeployments.length}
//               itemsPerPage={PROJECTS_PER_PAGE}
//             />
//           </>
//         ) : (
//           <div className="py-20 bg-white rounded-[40px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
//             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
//               <Inbox className="w-10 h-10 text-gray-200" />
//             </div>
//             <h4 className="text-xl font-black text-gray-900 mb-2">Chưa có dự án nào đang triển khai</h4>
//             <p className="text-gray-500 max-w-sm mb-8">Hãy chọn dự án mục tiêu và kích hoạt lực lượng AI để bắt đầu chiến dịch bán hàng.</p>
//             <button
//               onClick={() => setIsModalOpen(true)}
//               className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
//             >
//               <PlusCircle className="w-4 h-4" /> Khởi tạo ngay
//             </button>
//           </div>
//         )}
//       </div>

//       {/* MODAL: ĐIỀU PHỐI AI */}
//       {isAssignModalOpen && selectedCampaignId && (
//         <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-2xl animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-7xl max-h-[92vh] rounded-[48px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300 flex flex-col">
//             {/* Header */}
//             <div className="px-12 py-10 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
//               <div className="flex items-center gap-8">
//                 <div className="p-6 bg-indigo-600 rounded-[32px] text-white shadow-2xl shadow-indigo-100">
//                   <Bot className="w-10 h-10" />
//                 </div>
//                 <div>
//                   <h3 className="text-4xl font-black text-slate-900 tracking-tight">Điều phối nhân viên AI</h3>
//                   <div className="flex items-center gap-4 mt-2">
//                     <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
//                       <Users className="w-4 h-4 text-indigo-500" /> Quản trị và phân bổ nguồn lực tự động
//                     </p>
//                     <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
//                     <p className="text-[11px] text-indigo-600 font-black uppercase tracking-widest">
//                       Dự án: {campaigns.find(c => c.id === selectedCampaignId)?.name}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <button
//                 onClick={() => {
//                   setIsAssignModalOpen(false);
//                   setSelectedCampaignId(null);
//                   setAssignments([]);
//                   setAssignForm({ agentId: '', status: 'Active' });
//                   setAssignmentQ('');
//                 }}
//                 className="p-4 hover:bg-red-50 rounded-full group transition-all active:scale-90"
//               >
//                 <XCircle className="w-11 h-11 text-slate-300 group-hover:text-red-500" />
//               </button>
//             </div>

//             {/* Content */}
//             <div className="flex-1 overflow-y-auto px-12 py-10 space-y-8">
//               {/* Form */}
//               <div className="bg-slate-50 border border-slate-100 rounded-[40px] p-10 space-y-8 shadow-sm">
//                 {assignForm.id && (
//                   <button
//                     onClick={() => setAssignForm({ agentId: '', status: 'Active' })}
//                     className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
//                   >
//                     <XCircle className="w-4 h-4" /> Hủy chế độ chỉnh sửa
//                   </button>
//                 )}

//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
//                   {/* Select Agent */}
//                   <div className="md:col-span-2 space-y-3">
//                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
//                       Chọn nhân viên từ kho dữ liệu
//                     </label>
//                     <div className="relative">
//                       <select
//                         value={assignForm.agentId}
//                         disabled={!!assignForm.id}
//                         onChange={(e) => setAssignForm(prev => ({ ...prev, agentId: e.target.value }))}
//                         className={`w-full px-7 py-5 bg-white border border-slate-200 rounded-3xl text-base font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer ${
//                           assignForm.id ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''
//                         }`}
//                       >
//                         <option value="">-- Danh sách nhân viên khả dụng --</option>
//                         {agents.map(a => (
//                           <option key={a.id} value={a.id}>
//                             {a.name} (Tình trạng: {a.status})
//                           </option>
//                         ))}
//                       </select>
//                       {!assignForm.id && (
//                         <ChevronDown className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-6 h-6" />
//                       )}
//                     </div>
//                   </div>

//                   {/* Status */}
//                   <div className="md:col-span-1 space-y-3">
//                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
//                       Chế độ vận hành dự kiến
//                     </label>
//                     <div className="relative">
//                       <select
//                         value={assignForm.status}
//                         onChange={(e) => setAssignForm(prev => ({ ...prev, status: e.target.value }))}
//                         className="w-full px-7 py-5 bg-white border border-slate-200 rounded-3xl text-base font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
//                       >
//                         <option value="Active">Hoạt động (Active)</option>
//                         <option value="Idle">Chế độ chờ (Idle)</option>
//                         <option value="Paused">Tạm dừng (Paused)</option>
//                       </select>
//                       <ChevronDown className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-6 h-6" />
//                     </div>
//                   </div>

//                   {/* Actions */}
//                   <div className="md:col-span-1">
//                     {assignForm.id ? (
//                       <button
//                         onClick={async () => {
//                           try {
//                             setLoadingAssignments(true);
//                             await api.updateAssignment(assignForm.id!, { status: assignForm.status });
//                             await reloadAssignments();
//                             setAssignForm({ agentId: '', status: 'Active' });
//                           } catch (e) {
//                             console.error(e);
//                             alert('Cập nhật assignment thất bại.');
//                           } finally {
//                             setLoadingAssignments(false);
//                           }
//                         }}
//                         className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
//                       >
//                         <Save className="w-5 h-5" /> Cập nhật ngay
//                       </button>
//                     ) : (
//                       <button
//                         onClick={async () => {
//                           if (!assignForm.agentId) {
//                             alert('Vui lòng chọn nhân viên!');
//                             return;
//                           }

//                           try {
//                             setLoadingAssignments(true);
//                             await api.createAssignment({
//                               agentId: assignForm.agentId,
//                               campaignId: selectedCampaignId,
//                               status: assignForm.status
//                             });
//                             await reloadAssignments();
//                             setAssignForm({ agentId: '', status: 'Active' });
//                           } catch (e) {
//                             console.error(e);
//                             alert('Thêm Agent vào chiến dịch thất bại (có thể bị trùng Agent).');
//                           } finally {
//                             setLoadingAssignments(false);
//                           }
//                         }}
//                         className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
//                       >
//                         <PlusCircle className="w-6 h-6" /> Thêm vào đội ngũ
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Table */}
//               <div className="bg-white rounded-[48px] border border-slate-100 overflow-hidden shadow-sm flex flex-col">
//                 <div className="px-8 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
//                   <div className="flex items-center gap-4">
//                     <h5 className="text-[12px] font-black uppercase tracking-widest text-slate-900">
//                       Danh sách nhân sự đang vận hành
//                     </h5>
//                     <span className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-600 shadow-sm">
//                       {filteredAssignments.length} Thành viên
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-6">
//                     {loadingAssignments && (
//                       <div className="flex items-center gap-3 text-indigo-600 text-[11px] font-black uppercase tracking-widest animate-pulse">
//                         <Loader2 className="w-5 h-5 animate-spin" />
//                         Đang đồng bộ...
//                       </div>
//                     )}

//                     <div className="relative">
//                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//                       <input
//                         value={assignmentQ}
//                         onChange={(e) => setAssignmentQ(e.target.value)}
//                         type="text"
//                         placeholder="Tìm theo tên / status / mã..."
//                         className="pl-11 pr-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-indigo-50 outline-none w-72 transition-all"
//                       />
//                     </div>
//                   </div>
//                 </div>

//                 <div className="overflow-x-auto">
//                   <table className="w-full text-left">
//                     <thead>
//                       <tr className="bg-slate-50/50">
//                         <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400">
//                           Tên nhân viên AI / Định danh
//                         </th>
//                         <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400">
//                           Trạng thái vận hành
//                         </th>
//                         <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400">
//                           Hiệu suất dự kiến
//                         </th>
//                         <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400">
//                           Ngày gia nhập
//                         </th>
//                         <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">
//                           Tác vụ
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody className="divide-y divide-slate-50">
//                       {currentAssignments.map((x) => (
//                         <tr key={x.id} className="hover:bg-indigo-50/30 transition-all group">
//                           <td className="px-8 py-6">
//                             <div className="flex items-center gap-6">
//                               <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-all duration-300">
//                                 <Bot className="w-7 h-7" />
//                               </div>
//                               <div>
//                                 <div className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
//                                   {agentNameById(x.agentId)}
//                                 </div>
//                                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
//                                   LOG ID: #{(x.id || '').slice(-8).toUpperCase()}
//                                 </div>
//                               </div>
//                             </div>
//                           </td>

//                           <td className="px-8 py-6">
//                             <span
//                               className={`inline-flex items-center justify-center px-4 py-2 rounded-2xl text-[11px] font-black uppercase border whitespace-nowrap ${
//                                 x.status === 'Active'
//                                   ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
//                                   : x.status === 'Idle'
//                                   ? 'bg-amber-50 text-amber-700 border-amber-100'
//                                   : 'bg-slate-100 text-slate-600 border-slate-200'
//                               }`}
//                             >
//                               {x.status === 'Active' ? 'Đang hoạt động' : x.status === 'Idle' ? 'Chế độ chờ' : 'Tạm dừng'}
//                             </span>
//                           </td>

//                           <td className="px-8 py-6">
//                             <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
//                               <TrendingUp className="w-4 h-4" />
//                               <span>100% Load</span>
//                             </div>
//                           </td>

//                           <td className="px-8 py-6">
//                             <div className="text-sm font-bold text-slate-500 whitespace-nowrap">
//                               {formatDateTime(x.createdAt)}
//                             </div>
//                           </td>

//                           <td className="px-8 py-6 text-right">
//                             <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
//                               <button
//                                 onClick={() => setAssignForm({ id: x.id, agentId: x.agentId, status: (x.status ?? 'Active') })}
//                                 className="p-3 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all shadow-sm hover:shadow-md bg-white border border-indigo-50"
//                                 title="Chỉnh sửa cấu hình"
//                               >
//                                 <Edit2 className="w-6 h-6" />
//                               </button>

//                               <button
//                                 onClick={async () => {
//                                   if (!window.confirm('Hủy phân bổ nhân sự này?')) return;
//                                   try {
//                                     setLoadingAssignments(true);
//                                     await api.deleteAssignment(x.id);
//                                     await reloadAssignments();
//                                   } catch (e) {
//                                     console.error(e);
//                                     alert('Xóa assignment thất bại.');
//                                   } finally {
//                                     setLoadingAssignments(false);
//                                   }
//                                 }}
//                                 className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all shadow-sm hover:shadow-md bg-white border border-red-50"
//                                 title="Gỡ khỏi chiến dịch"
//                               >
//                                 <Trash2 className="w-6 h-6" />
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       ))}

//                       {filteredAssignments.length === 0 && !loadingAssignments && (
//                         <tr>
//                           <td colSpan={5} className="px-8 py-32 text-center">
//                             <div className="flex flex-col items-center">
//                               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
//                                 <Users className="w-12 h-12 text-slate-200" />
//                               </div>
//                               <p className="text-slate-400 font-black uppercase text-sm tracking-widest">Danh sách nhân sự đang trống</p>
//                               <p className="text-slate-300 text-xs mt-2 font-medium">Sử dụng form phía trên để bắt đầu phân bổ đội ngũ AI.</p>
//                             </div>
//                           </td>
//                         </tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>

//                 {filteredAssignments.length > ASSIGNMENTS_PER_PAGE && (
//                   <Pagination
//                     currentPage={assignmentsPage}
//                     totalPages={totalAssignmentsPages}
//                     onPageChange={setAssignmentsPage}
//                     totalItems={filteredAssignments.length}
//                     itemsPerPage={ASSIGNMENTS_PER_PAGE}
//                   />
//                 )}
//               </div>
//             </div>

//             {/* Footer */}
//             <div className="px-12 py-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
//               <div className="flex items-center gap-4">
//                 <div className="flex -space-x-3">
//                   {[1, 2, 3].map(i => (
//                     <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center">
//                       <Bot className="w-5 h-5 text-indigo-400" />
//                     </div>
//                   ))}
//                 </div>
//                 <div className="h-10 w-px bg-slate-200 mx-2" />
//                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
//                   Trạng thái hệ thống: <span className="text-emerald-500">Đã sẵn sàng</span>
//                   <br />
//                   <span className="text-slate-300 normal-case font-medium">
//                     Mọi thay đổi sẽ được áp dụng ngay lập tức cho các quy trình AI đang chạy.
//                   </span>
//                 </p>
//               </div>

//               <button
//                 onClick={() => setIsAssignModalOpen(false)}
//                 className="px-12 py-5 bg-indigo-900 text-white rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-800 transition-all active:scale-95 flex items-center gap-3"
//               >
//                 <Save className="w-5 h-5" /> Hoàn tất và Đóng
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* MODAL: KHỞI TẠO CHIẾN DỊCH MỚI */}
//       {isModalOpen && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-[32px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300 flex flex-col">
//             <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
//                   <Rocket className="w-6 h-6" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">Khởi tạo chiến dịch</h3>
//                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Cấu hình lực lượng bán hàng AI</p>
//                 </div>
//               </div>
//               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 rounded-full group transition-all">
//                 <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
//               </button>
//             </div>

//             <div className="px-8 py-6 space-y-6 overflow-y-auto">
//               {/* Tên chiến dịch */}
//               <div className="space-y-3">
//                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                   <Rocket className="w-3 h-3" /> Tên chiến dịch
//                 </label>
//                 <input
//                   type="text"
//                   value={newCampaign.name}
//                   onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
//                   className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   placeholder="VD: Chiến dịch năm 2026"
//                 />
//               </div>

//               {/* Chọn dự án */}
//               <div className="space-y-3">
//                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                   <Building2 className="w-3 h-3" /> Dự án BĐS mục tiêu
//                 </label>
//                 <div className="relative">
//                   <select
//                     value={newCampaign.projectId}
//                     onChange={(e) => setNewCampaign({ ...newCampaign, projectId: e.target.value })}
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
//                   >
//                     <option value="">Chọn dự án...</option>
//                     {projectsCbx.map(p => (
//                       <option key={p.id} value={p.id}>{p.name}</option>
//                     ))}
//                   </select>
//                   <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
//                 </div>
//               </div>

//               {/* Phân bổ nhân viên AI */}
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center mb-1">
//                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                     <Bot className="w-3 h-3 text-indigo-500" /> Phân bổ nhân viên AI
//                   </label>
//                   <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{newCampaign.agentCount} Agents</span>
//                 </div>
//                 <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-4">
//                   <input
//                     type="range"
//                     min="1"
//                     max="20"
//                     value={newCampaign.agentCount}
//                     onChange={(e) => setNewCampaign({ ...newCampaign, agentCount: parseInt(e.target.value) })}
//                     className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
//                   />
//                   <div className="flex justify-between text-[10px] font-black text-indigo-300 uppercase">
//                     <span>1 Nhân viên</span>
//                     <span>Tối đa 20</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Mục tiêu Lead */}
//               <div className="space-y-3">
//                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                   <Users className="w-3 h-3" /> Mục tiêu Lead chất lượng
//                 </label>
//                 <input
//                   type="number"
//                   value={newCampaign.targetLeads}
//                   onChange={(e) => setNewCampaign({ ...newCampaign, targetLeads: parseInt(e.target.value || '0') })}
//                   className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   placeholder="VD: 500"
//                 />
//               </div>

//               {/* Action Buttons */}
//               <div className="pt-2 flex gap-4">
//                 <button
//                   onClick={() => setIsModalOpen(false)}
//                   className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
//                 >
//                   Hủy bỏ
//                 </button>
//                 <button
//                   onClick={handleStartCampaign}
//                   className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
//                 >
//                   <Zap className="w-4 h-4" /> Triển khai ngay
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* MODAL: SETTINGS (đã chỉnh khớp API update full) */}
//       {isSettingsModalOpen && selectedCampaignForSetting && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300">
//             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
//                   <Settings className="w-6 h-6" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">Cấu hình Chiến dịch</h3>
//                   <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-2">
//                     {selectedCampaignForSetting.name}
//                   </p>
//                 </div>
//               </div>
//               <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 hover:bg-red-50 rounded-full group transition-all">
//                 <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
//               </button>
//             </div>

//             <div className="p-10 space-y-8">
//               {/* Grid fields */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 {/* Name */}
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                     Tên chiến dịch
//                   </label>
//                   <input
//                     value={settingsForm.name}
//                     onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                     placeholder="VD: Chiến dịch Q1/2026"
//                   />
//                 </div>

//                 {/* Status */}
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                     Trạng thái
//                   </label>
//                   <div className="relative">
//                     <select
//                       value={settingsForm.status}
//                       onChange={(e) => setSettingsForm(prev => ({ ...prev, status: e.target.value as CampaignStatus }))}
//                       className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
//                     >
//                       <option value="Active">Active (Đang chạy)</option>
//                       <option value="Paused">Paused (Tạm dừng)</option>
//                     </select>
//                     <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
//                   </div>
//                 </div>

//                 {/* StartAt */}
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                     Thời gian bắt đầu
//                   </label>
//                   <input
//                     type="datetime-local"
//                     value={settingsForm.startAtLocal}
//                     onChange={(e) => setSettingsForm(prev => ({ ...prev, startAtLocal: e.target.value }))}
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>

//                 {/* EndAt */}
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                     Thời gian kết thúc
//                   </label>
//                   <input
//                     type="datetime-local"
//                     value={settingsForm.endAtLocal}
//                     onChange={(e) => setSettingsForm(prev => ({ ...prev, endAtLocal: e.target.value }))}
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>

//                 {/* TargetLeads */}
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                     Mục tiêu Lead
//                   </label>
//                   <input
//                     type="number"
//                     value={settingsForm.targetLeads}
//                     onChange={(e) => setSettingsForm(prev => ({ ...prev, targetLeads: parseInt(e.target.value || '0') }))}
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                     placeholder="VD: 500"
//                   />
//                 </div>

//                 {/* LimitAiAgent */}
//                 <div className="space-y-2">
//                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                     Giới hạn AI Agent
//                   </label>
//                   <input
//                     type="number"
//                     value={settingsForm.limitAiAgent}
//                     onChange={(e) => setSettingsForm(prev => ({ ...prev, limitAiAgent: parseInt(e.target.value || '0') }))}
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                     placeholder="VD: 10"
//                   />
//                 </div>
//               </div>

//               <div className="pt-2 flex gap-4">
//                 <button
//                   onClick={() => setIsSettingsModalOpen(false)}
//                   className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
//                 >
//                   Hủy bỏ
//                 </button>
//                 <button
//                   onClick={handleUpdateSettings}
//                   className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
//                 >
//                   <Save className="w-4 h-4" /> Lưu cấu hình
//                 </button>
//               </div>

//               <p className="text-[10px] text-gray-400 italic px-1 font-medium">
//                 * Form này update đúng API `PUT /api/campaigns/{'{id}'}`: Name, Status, StartAt, EndAt, TargetLeads, LimitAiAgent.
//               </p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Deployment;


// // /// TRIỂN KHAI DỰ ÁN
// // import React, { useState, useEffect, useMemo } from 'react';
// // import { Project, AIAgent } from '../types';
// // import Pagination from '../components/Pagination';
// // import {
// //   Rocket, Activity, Bot, Zap,
// //   Play, Pause, Settings, RefreshCw,
// //   Loader2, LayoutGrid, List,
// //   Building2, Users, XCircle, ChevronDown, PlusCircle,
// //   TrendingUp, Inbox, Save, Edit2, Trash2, Search
// // } from 'lucide-react';

// // import { api, AgentProjectAssignmentDto } from '../services/apiService';
// // import { formatDateTime } from '@/components/utils/formatDate';

// // const PROJECTS_PER_PAGE = 4;

// // // ===== Backend DTO (API trả về PascalCase) =====
// // type CampaignDtoApi = {
// //   id?: string;
// //   name?: string;
// //   status?: string;
// //   startAt?: string | null;
// //   endAt?: string | null;

// //   Id?: string;
// //   Name?: string;
// //   Status?: string;
// //   StartAt?: string | null;
// //   EndAt?: string | null;

// //   AgentsAiActive?: number;
// //   TargetLeads?: number;
// //   CurrentLeads?: number;
// //   LimitAiAgent?: number;
// //   Progress?: number;
// // };

// // // ===== UI DTO (camelCase) =====
// // type CampaignDto = {
// //   id: string;
// //   name: string;
// //   status: string;
// //   startAt?: string | null;
// //   endAt?: string | null;

// //   agentsAiActive: number;
// //   targetLeads: number;
// //   currentLeads: number;
// //   limitAiAgent: number;
// //   progress: number;
// // };

// // const mapCampaignApiToUi = (x: any): CampaignDto => {
// //   const id = (x.id ?? x.Id ?? '') as string;
// //   const name = (x.name ?? x.Name ?? '') as string;
// //   const status = (x.status ?? x.Status ?? '') as string;

// //   return {
// //     id,
// //     name,
// //     status,
// //     startAt: (x.startAt ?? x.StartAt ?? null) as any,
// //     endAt: (x.endAt ?? x.EndAt ?? null) as any,

// //     // ✅ support camelCase + PascalCase
// //     agentsAiActive: Number(x.agentsAiActive ?? x.AgentsAiActive ?? 0),
// //     targetLeads: Number(x.targetLeads ?? x.TargetLeads ?? 0),
// //     currentLeads: Number(x.currentLeads ?? x.CurrentLeads ?? 0),
// //     limitAiAgent: Number(x.limitAiAgent ?? x.LimitAiAgent ?? 0),
// //     progress: Number(x.progress ?? x.Progress ?? 0),
// //   };
// // };


// // type DeploymentState = {
// //   status: 'Active' | 'Paused';
// //   progress: number;

// //   targetLeads: number;
// //   currentLeads: number;

// //   agentsAiActive: number;
// //   limitAiAgent: number;
// // };

// // // ✅ normalize response: hỗ trợ [] | {items: []} | {data: []}
// // const toArray = <T,>(raw: any): T[] => {
// //   if (Array.isArray(raw)) return raw;
// //   if (Array.isArray(raw?.items)) return raw.items;
// //   if (Array.isArray(raw?.data)) return raw.data;
// //   return [];
// // };

// // const mapCampaignStatusToDeployment = (s: string): DeploymentState['status'] => {
// //   const v = (s || '').toLowerCase();
// //   if (v === 'paused') return 'Paused';
// //   if (v === 'draft') return 'Paused'; // Draft xem như chưa chạy
// //   return 'Active';
// // };

// // const PLACEHOLDER_IMG =
// //   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=60';

// // const Deployment: React.FC = () => {
// //   // ✅ tách riêng: projectsCbx chỉ cho combobox popup
// //   const [projectsCbx, setProjectsCbx] = useState<Project[]>([]);
// //   // ✅ campaigns là nguồn render list triển khai
// //   const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
// //   const [agents, setAgents] = useState<AIAgent[]>([]);

// //   const [loading, setLoading] = useState(true);
// //   const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
// //   const [currentPage, setCurrentPage] = useState(1);

// //   // Create Modal State
// //   const [isModalOpen, setIsModalOpen] = useState(false);
// //   const [newCampaign, setNewCampaign] = useState({
// //     name: '',
// //     projectId: '',
// //     agentCount: 1,
// //     targetLeads: 500,
// //     startAt: new Date().toISOString(),
// //     endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 ngày
// //   });

// //   // Settings Modal State
// //   const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
// //   const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);
// //   const [settingsForm, setSettingsForm] = useState({
// //     agentCount: 1,
// //     targetLeads: 500
// //   });

// //   // ===== Assignments Modal =====
// //   const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
// //   const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
// //   const [assignments, setAssignments] = useState<AgentProjectAssignmentDto[]>([]);
// //   const [loadingAssignments, setLoadingAssignments] = useState(false);

// //   // form add/edit
// //   const [assignForm, setAssignForm] = useState<{
// //     id?: string;
// //     agentId: string;
// //     status: string;
// //   }>({
// //     agentId: '',
// //     status: 'Active',
// //   });

// //   const agentNameById = (agentId: string) => {
// //     const found = agents.find(a => a.id === agentId);
// //     return found?.name || agentId;
// //   };

// //   const openAssignModal = async (campaignId: string) => {
// //     setSelectedCampaignId(campaignId);
// //     setIsAssignModalOpen(true);
// //     setAssignForm({ agentId: '', status: 'Active' });

// //     try {
// //       setLoadingAssignments(true);
// //       const data = await api.getAssignmentsByCampaign(campaignId);
// //       setAssignments(toArray<AgentProjectAssignmentDto>(data));
// //     } catch (e) {
// //       console.error(e);
// //       setAssignments([]);
// //       alert('Không tải được danh sách Agent thuộc chiến dịch.');
// //     } finally {
// //       setLoadingAssignments(false);
// //     }
// //   };

// //   const reloadAssignments = async () => {
// //     if (!selectedCampaignId) return;
// //     setLoadingAssignments(true);
// //     try {
// //       const data = await api.getAssignmentsByCampaign(selectedCampaignId);
// //       setAssignments(toArray<AgentProjectAssignmentDto>(data));
// //     } finally {
// //       setLoadingAssignments(false);
// //     }
// //   };

// //   // trạng thái triển khai theo campaignId
// //   const [deploymentStates, setDeploymentStates] = useState<Record<string, DeploymentState>>({});

// //   const fetchData = async () => {
// //     setLoading(true);
// //     try {
// //       const [campaignsRes, agentsRes, projectsRes] = await Promise.allSettled([
// //         api.request<any>(`/api/campaigns`, { method: 'GET' }),

// //         typeof (api as any).getAgents === 'function'
// //           ? (api as any).getAgents()
// //           : Promise.resolve([]),

// //         // ✅ gọi getProjectsCbx nếu có, fallback getProjects, nếu không có thì []
// //         typeof (api as any).getProjectsCbx === 'function'
// //           ? (api as any).getProjectsCbx()
// //           : (typeof (api as any).getProjects === 'function'
// //               ? (api as any).getProjects()
// //               : Promise.resolve([])),
// //       ]);

// //       const cRaw = campaignsRes.status === 'fulfilled' ? campaignsRes.value : [];
// //       const aRaw = agentsRes.status === 'fulfilled' ? agentsRes.value : [];
// //       const pRaw = projectsRes.status === 'fulfilled' ? projectsRes.value : [];

// //       const cApi = toArray<CampaignDtoApi>(cRaw);
// //       const cData = cApi.map(mapCampaignApiToUi);

// //       const aData = toArray<AIAgent>(aRaw);
// //       const pData = toArray<Project>(pRaw);

// //       setCampaigns(cData);
// //       setAgents(aData);
// //       setProjectsCbx(pData);

// //       // map campaigns -> deploymentStates
// //       const mappedStates: Record<string, DeploymentState> = {};
// //       for (const c of cData) {
// //         mappedStates[c.id] = {
// //           status: mapCampaignStatusToDeployment(c.status),
// //           progress: Number(c.progress ?? 0),
// //           targetLeads: Number(c.targetLeads ?? 0),
// //           currentLeads: Number(c.currentLeads ?? 0),
// //           agentsAiActive: Number(c.agentsAiActive ?? 0),
// //           limitAiAgent: Number(c.limitAiAgent ?? 0),
// //         };
// //       }
// //       setDeploymentStates(mappedStates);

// //       setCurrentPage(1);
// //     } catch (error) {
// //       console.error("Error fetching deployment data:", error);
// //       setCampaigns([]);
// //       setAgents([]);
// //       setProjectsCbx([]);
// //       setDeploymentStates({});
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const ASSIGNMENTS_PER_PAGE = 6;
// //   const [assignmentsPage, setAssignmentsPage] = useState(1);
// //   const [assignmentQ, setAssignmentQ] = useState('');

// //   const filteredAssignments = useMemo(() => {
// //     const q = assignmentQ.trim().toLowerCase();
// //     if (!q) return assignments;

// //     return assignments.filter(x => {
// //       const name = agentNameById(x.agentId)?.toLowerCase() || '';
// //       const id8 = (x.id || '').slice(-8).toLowerCase();
// //       const st = (x.status || '').toLowerCase();
// //       return name.includes(q) || id8.includes(q) || st.includes(q);
// //     });
// //   }, [assignments, assignmentQ, agents]);

// //   const totalAssignmentsPages = Math.max(1, Math.ceil(filteredAssignments.length / ASSIGNMENTS_PER_PAGE));
// //   const currentAssignments = filteredAssignments.slice(
// //     (assignmentsPage - 1) * ASSIGNMENTS_PER_PAGE,
// //     assignmentsPage * ASSIGNMENTS_PER_PAGE
// //   );

// //   useEffect(() => {
// //     fetchData();
// //   }, []);

// //   useEffect(() => {
// //     setAssignmentsPage(1);
// //   }, [assignmentQ]);

// //   const handleStartCampaign = async () => {
// //     if (!newCampaign.name.trim()) {
// //       alert("Vui lòng nhập Tên chiến dịch!");
// //       return;
// //     }
// //     if (!newCampaign.projectId) {
// //       alert("Vui lòng chọn dự án để triển khai!");
// //       return;
// //     }

// //     try {
// //       setLoading(true);

// //       const payload = {
// //         name: newCampaign.name.trim(),
// //         projectId: newCampaign.projectId,
// //         startAt: newCampaign.startAt,
// //         endAt: newCampaign.endAt,
// //         targetLeads: Number(newCampaign.targetLeads || 0),
// //         limitAiAgent: Number(newCampaign.agentCount || 0), // map agentCount -> limitAiAgent
// //       };

// //       const created = await api.createCampaign(payload);

// //       // ✅ optimistic update campaigns (đủ field để khỏi lệch type)
// //       setCampaigns(prev => [
// //         {
// //           id: created.id,
// //           name: payload.name,
// //           status: 'Draft',
// //           startAt: payload.startAt,
// //           endAt: payload.endAt,
// //           agentsAiActive: 0,
// //           targetLeads: payload.targetLeads,
// //           currentLeads: 0,
// //           limitAiAgent: payload.limitAiAgent,
// //           progress: 0,
// //         },
// //         ...prev,
// //       ]);

// //       // ✅ optimistic update deploymentStates
// //       setDeploymentStates(prev => ({
// //         ...prev,
// //         [created.id]: {
// //           status: 'Paused',
// //           progress: 0,
// //           targetLeads: payload.targetLeads,
// //           currentLeads: 0,
// //           agentsAiActive: 0,
// //           limitAiAgent: payload.limitAiAgent,
// //         },
// //       }));

// //       setIsModalOpen(false);
// //       setNewCampaign({
// //         name: '',
// //         projectId: '',
// //         agentCount: 1,
// //         targetLeads: 500,
// //         startAt: new Date().toISOString(),
// //         endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
// //       });
// //       setCurrentPage(1);
// //     } catch (err) {
// //       console.error(err);
// //       alert('Tạo chiến dịch thất bại. Vui lòng kiểm tra API/Server.');
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   const handleOpenSettings = (campaignId: string) => {
// //     const state = deploymentStates[campaignId];
// //     if (!state) return;

// //     setSelectedDeploymentId(campaignId);
// //     setSettingsForm({
// //       agentCount: state.limitAiAgent,
// //       targetLeads: state.targetLeads
// //     });
// //     setIsSettingsModalOpen(true);
// //   };

// //   const handleUpdateSettings = () => {
// //     if (!selectedDeploymentId) return;

// //     setDeploymentStates(prev => {
// //       const currentState = prev[selectedDeploymentId];
// //       const newProgress = Math.min(
// //         100,
// //         Math.round((currentState.currentLeads / Math.max(1, settingsForm.targetLeads)) * 100)
// //       );

// //       return {
// //         ...prev,
// //         [selectedDeploymentId]: {
// //           ...currentState,
// //           limitAiAgent: settingsForm.agentCount,
// //           targetLeads: settingsForm.targetLeads,
// //           progress: newProgress
// //         }
// //       };
// //     });

// //     setIsSettingsModalOpen(false);
// //   };

// //   const toggleDeploymentStatus = (id: string) => {
// //     setDeploymentStates(prev => ({
// //       ...prev,
// //       [id]: {
// //         ...prev[id],
// //         status: prev[id]?.status === 'Active' ? 'Paused' : 'Active'
// //       }
// //     }));
// //   };

// //   if (loading) {
// //     return (
// //       <div className="h-full flex flex-col items-center justify-center text-indigo-600">
// //         <Loader2 className="w-12 h-12 animate-spin mb-4" />
// //         <p className="font-black text-xs uppercase tracking-widest animate-pulse">
// //           Đang thiết lập môi trường triển khai AI...
// //         </p>
// //       </div>
// //     );
// //   }

// //   // ✅ list hiển thị theo campaigns (không phụ thuộc projects)
// //   const activeDeployments = campaigns.filter(c => deploymentStates[c.id]);
// //   const totalPages = Math.ceil(activeDeployments.length / PROJECTS_PER_PAGE);
// //   const currentDeployments = activeDeployments.slice(
// //     (currentPage - 1) * PROJECTS_PER_PAGE,
// //     currentPage * PROJECTS_PER_PAGE
// //   );

// //   const selectedCampaignForSetting = campaigns.find(c => c.id === selectedDeploymentId);

// //   return (
// //     <div className="space-y-8 animate-in fade-in duration-500 pb-10">
// //       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
// //         <div>
// //           <h2 className="text-2xl font-black text-gray-900 leading-none">Triển khai Dự án</h2>
// //           <p className="text-gray-500 font-medium mt-2">Kích hoạt và giám sát lực lượng AI cho từng chiến dịch cụ thể.</p>
// //         </div>
// //         <div className="flex items-center gap-3">
// //           <div className="bg-white border border-gray-200 p-0.5 rounded-xl flex items-center shadow-sm">
// //             <button
// //               onClick={() => setViewMode('grid')}
// //               className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
// //               title="Dạng lưới"
// //             >
// //               <LayoutGrid className="w-4 h-4" />
// //             </button>
// //             <button
// //               onClick={() => setViewMode('table')}
// //               className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
// //               title="Dạng bảng"
// //             >
// //               <List className="w-4 h-4" />
// //             </button>
// //           </div>
// //           <button
// //             onClick={() => fetchData()}
// //             className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-indigo-600 shadow-sm transition-all"
// //           >
// //             <RefreshCw className="w-5 h-5" />
// //           </button>
// //           <button
// //             onClick={() => setIsModalOpen(true)}
// //             className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-100"
// //           >
// //             <Rocket className="w-4 h-4" /> Bắt đầu chiến dịch
// //           </button>
// //         </div>
// //       </header>

// //       {/* Stats */}
// //       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
// //         <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
// //           <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors duration-500">
// //             <Rocket className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors duration-500" />
// //           </div>
// //           <div>
// //             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Chiến dịch đang chạy</p>
// //             <p className="text-2xl font-black text-gray-900 leading-none">{activeDeployments.length}</p>
// //           </div>
// //         </div>

// //         <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
// //           <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-600 transition-colors duration-500">
// //             <Activity className="w-7 h-7 text-green-600 group-hover:text-white transition-colors duration-500" />
// //           </div>
// //           <div>
// //             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Tốc độ Lead (24h)</p>
// //             <p className="text-2xl font-black text-gray-900 leading-none">+156 Lead</p>
// //           </div>
// //         </div>

// //         <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-xl transition-all duration-500">
// //           <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-500">
// //             <Bot className="w-7 h-7 text-purple-600 group-hover:text-white transition-colors duration-500" />
// //           </div>
// //           <div>
// //             <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Hiệu suất AI</p>
// //             <p className="text-2xl font-black text-gray-900 leading-none">94% Capacity</p>
// //           </div>
// //         </div>
// //       </div>

// //       <div className="space-y-6">
// //         <h3 className="text-lg font-black text-gray-900 flex items-center gap-2 px-2">
// //           <Activity className="w-5 h-5 text-indigo-600" />
// //           Các dự án đang triển khai bán hàng
// //         </h3>

// //         {activeDeployments.length > 0 ? (
// //           <>
// //             {viewMode === 'grid' ? (
// //               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
// //                 {currentDeployments.map((c) => {
// //                   const state = deploymentStates[c.id];
// //                   if (!state) return null;

// //                   return (
// //                     <div
// //                       key={c.id}
// //                       className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row gap-8"
// //                     >
// //                       <div className="w-full md:w-32 h-32 rounded-3xl overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
// //                         <img src={PLACEHOLDER_IMG} className="w-full h-full object-cover" />
// //                       </div>

// //                       <div className="flex-1 space-y-4">
// //                         <div className="flex justify-between items-start">
// //                           <div>
// //                             <h4 className="text-lg font-black text-gray-900 leading-none">{c.name}</h4>
// //                             <div className="flex items-center gap-3 mt-2">
// //                               <span
// //                                 className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
// //                                   state.status === 'Active'
// //                                     ? 'bg-green-50 text-green-700 border-green-200'
// //                                     : 'bg-orange-50 text-orange-700 border-orange-200'
// //                                 }`}
// //                               >
// //                                 {state.status === 'Active' ? 'Đang triển khai' : 'Tạm dừng'}
// //                               </span>
// //                               <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Campaign</span>
// //                             </div>
// //                           </div>

// //                           <div className="flex gap-2">
// //                             <button
// //                               onClick={() => handleOpenSettings(c.id)}
// //                               className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all border border-gray-100 hover:bg-white hover:shadow-md"
// //                             >
// //                               <Settings className="w-5 h-5" />
// //                             </button>
// //                             <button
// //                               onClick={() => toggleDeploymentStatus(c.id)}
// //                               className={`p-2.5 rounded-xl transition-all shadow-md ${
// //                                 state.status === 'Active'
// //                                   ? 'bg-orange-500 text-white hover:bg-orange-600'
// //                                   : 'bg-green-600 text-white hover:bg-green-700'
// //                               }`}
// //                             >
// //                               {state.status === 'Active' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
// //                             </button>
// //                           </div>
// //                         </div>

// //                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// //                           <div className="space-y-2">
// //                             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
// //                               <span>Tiến độ mục tiêu Lead</span>
// //                               <span>{state.progress}%</span>
// //                             </div>
// //                             <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden shadow-inner">
// //                               <div
// //                                 className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-full"
// //                                 style={{ width: `${state.progress}%` }}
// //                               />
// //                             </div>
// //                             <p className="text-[11px] font-bold text-gray-500">
// //                               {state.currentLeads} / {state.targetLeads} Leads
// //                             </p>
// //                           </div>

// //                           <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between">
// //                             <div className="flex items-center gap-3">
// //                               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
// //                                 <Bot className="w-6 h-6" />
// //                               </div>
// //                               <div>
// //                                 <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Nhân viên AI</p>
// //                                 <p className="text-sm font-black text-indigo-900 leading-none">{state.agentsAiActive} Active</p>
// //                               </div>
// //                             </div>
// //                             <button
// //                               onClick={() => openAssignModal(c.id)}
// //                               className="text-[9px] font-black text-indigo-600 uppercase hover:underline"
// //                             >
// //                               Tăng cường
// //                             </button>
// //                           </div>
// //                         </div>
// //                       </div>
// //                     </div>
// //                   );
// //                 })}
// //               </div>
// //             ) : (
// //               <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
// //                 <table className="w-full text-left min-w-[1000px]">
// //                   <thead>
// //                     <tr className="bg-gray-50/80 border-b border-gray-100">
// //                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Dự án triển khai</th>
// //                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Trạng thái</th>
// //                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Tiến độ mục tiêu</th>
// //                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Lực lượng AI</th>
// //                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">Tốc độ Lead</th>
// //                       <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
// //                     </tr>
// //                   </thead>
// //                   <tbody className="divide-y divide-gray-50">
// //                     {currentDeployments.map((c) => {
// //                       const state = deploymentStates[c.id];
// //                       if (!state) return null;

// //                       return (
// //                         <tr key={c.id} className="hover:bg-indigo-50/20 transition-colors group">
// //                           <td className="px-8 py-4">
// //                             <div className="flex items-center gap-4">
// //                               <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 shadow-sm flex-shrink-0">
// //                                 <img src={PLACEHOLDER_IMG} className="w-full h-full object-cover" />
// //                               </div>
// //                               <div className="min-w-0">
// //                                 <h4 className="font-black text-gray-900 text-sm truncate">{c.name}</h4>
// //                                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Campaign</p>
// //                               </div>
// //                             </div>
// //                           </td>

// //                           <td className="px-8 py-4">
// //                             <span
// //                               className={`px-2 py-1 rounded text-[9px] font-black uppercase border ${
// //                                 state.status === 'Active'
// //                                   ? 'bg-green-50 text-green-700 border-green-200'
// //                                   : 'bg-orange-50 text-orange-700 border-orange-200'
// //                               }`}
// //                             >
// //                               {state.status === 'Active' ? 'Vận hành' : 'Tạm dừng'}
// //                             </span>
// //                           </td>

// //                           <td className="px-8 py-4">
// //                             <div className="w-48 space-y-1.5">
// //                               <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase">
// //                                 <span>{state.currentLeads} / {state.targetLeads}</span>
// //                                 <span>{state.progress}%</span>
// //                               </div>
// //                               <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
// //                                 <div className="bg-indigo-600 h-full" style={{ width: `${state.progress}%` }} />
// //                               </div>
// //                             </div>
// //                           </td>

// //                           <td className="px-8 py-4 text-center">
// //                             <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
// //                               <Bot className="w-4 h-4" />
// //                               <span className="text-xs font-black">{state.limitAiAgent}</span>
// //                             </div>
// //                           </td>

// //                           <td className="px-8 py-4 text-center">
// //                             <div className="flex items-center justify-center gap-1.5 text-green-600">
// //                               <TrendingUp className="w-4 h-4" />
// //                               <span className="text-xs font-black">+12%</span>
// //                             </div>
// //                           </td>

// //                           <td className="px-8 py-4 text-right">
// //                             <div className="flex items-center justify-end gap-2">
// //                               <button
// //                                 onClick={() => toggleDeploymentStatus(c.id)}
// //                                 className={`p-2 rounded-xl transition-all shadow-sm ${
// //                                   state.status === 'Active'
// //                                     ? 'text-orange-500 hover:bg-orange-50'
// //                                     : 'text-green-600 hover:bg-green-50'
// //                                 }`}
// //                               >
// //                                 {state.status === 'Active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
// //                               </button>
// //                               <button
// //                                 onClick={() => handleOpenSettings(c.id)}
// //                                 className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
// //                               >
// //                                 <Settings className="w-4 h-4" />
// //                               </button>
// //                               <button
// //                                 onClick={() => openAssignModal(c.id)}
// //                                 className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
// //                                 title="Điều phối AI"
// //                               >
// //                                 <Users className="w-4 h-4" />
// //                               </button>
// //                             </div>
// //                           </td>
// //                         </tr>
// //                       );
// //                     })}
// //                   </tbody>
// //                 </table>
// //               </div>
// //             )}

// //             <Pagination
// //               currentPage={currentPage}
// //               totalPages={totalPages}
// //               onPageChange={setCurrentPage}
// //               totalItems={activeDeployments.length}
// //               itemsPerPage={PROJECTS_PER_PAGE}
// //             />
// //           </>
// //         ) : (
// //           <div className="py-20 bg-white rounded-[40px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
// //             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
// //               <Inbox className="w-10 h-10 text-gray-200" />
// //             </div>
// //             <h4 className="text-xl font-black text-gray-900 mb-2">Chưa có dự án nào đang triển khai</h4>
// //             <p className="text-gray-500 max-w-sm mb-8">Hãy chọn dự án mục tiêu và kích hoạt lực lượng AI để bắt đầu chiến dịch bán hàng.</p>
// //             <button
// //               onClick={() => setIsModalOpen(true)}
// //               className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
// //             >
// //               <PlusCircle className="w-4 h-4" /> Khởi tạo ngay
// //             </button>
// //           </div>
// //         )}
// //       </div>

// //       {/* MODAL: ĐIỀU PHỐI AI (DUY NHẤT - ĐÃ LOẠI BỎ MODAL TRÙNG) */}
// //       {isAssignModalOpen && selectedCampaignId && (
// //         <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-2xl animate-in fade-in duration-300">
// //           <div className="bg-white w-full max-w-7xl max-h-[92vh] rounded-[48px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300 flex flex-col">
// //             {/* Header */}
// //             <div className="px-12 py-10 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
// //               <div className="flex items-center gap-8">
// //                 <div className="p-6 bg-indigo-600 rounded-[32px] text-white shadow-2xl shadow-indigo-100">
// //                   <Bot className="w-10 h-10" />
// //                 </div>
// //                 <div>
// //                   <h3 className="text-4xl font-black text-slate-900 tracking-tight">Điều phối nhân viên AI</h3>
// //                   <div className="flex items-center gap-4 mt-2">
// //                     <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
// //                       <Users className="w-4 h-4 text-indigo-500" /> Quản trị và phân bổ nguồn lực tự động
// //                     </p>
// //                     <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
// //                     <p className="text-[11px] text-indigo-600 font-black uppercase tracking-widest">
// //                       Dự án: {campaigns.find(c => c.id === selectedCampaignId)?.name}
// //                     </p>
// //                   </div>
// //                 </div>
// //               </div>

// //               <button
// //                 onClick={() => {
// //                   setIsAssignModalOpen(false);
// //                   setSelectedCampaignId(null);
// //                   setAssignments([]);
// //                   setAssignForm({ agentId: '', status: 'Active' });
// //                   setAssignmentQ('');
// //                 }}
// //                 className="p-4 hover:bg-red-50 rounded-full group transition-all active:scale-90"
// //               >
// //                 <XCircle className="w-11 h-11 text-slate-300 group-hover:text-red-500" />
// //               </button>
// //             </div>

// //             {/* Content */}
// //             <div className="flex-1 overflow-y-auto px-12 py-10 space-y-8">
// //               {/* Form */}
// //               <div className="bg-slate-50 border border-slate-100 rounded-[40px] p-10 space-y-8 shadow-sm">
// //                 {assignForm.id && (
// //                   <button
// //                     onClick={() => setAssignForm({ agentId: '', status: 'Active' })}
// //                     className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2"
// //                   >
// //                     <XCircle className="w-4 h-4" /> Hủy chế độ chỉnh sửa
// //                   </button>
// //                 )}

// //                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-end">
// //                   {/* Select Agent */}
// //                   <div className="md:col-span-2 space-y-3">
// //                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
// //                       Chọn nhân viên từ kho dữ liệu
// //                     </label>
// //                     <div className="relative">
// //                       <select
// //                         value={assignForm.agentId}
// //                         disabled={!!assignForm.id}
// //                         onChange={(e) => setAssignForm(prev => ({ ...prev, agentId: e.target.value }))}
// //                         className={`w-full px-7 py-5 bg-white border border-slate-200 rounded-3xl text-base font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer ${
// //                           assignForm.id ? 'opacity-60 bg-slate-100 cursor-not-allowed' : ''
// //                         }`}
// //                       >
// //                         <option value="">-- Danh sách nhân viên khả dụng --</option>
// //                         {agents.map(a => (
// //                           <option key={a.id} value={a.id}>
// //                             {a.name} (Tình trạng: {a.status})
// //                           </option>
// //                         ))}
// //                       </select>
// //                       {!assignForm.id && (
// //                         <ChevronDown className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-6 h-6" />
// //                       )}
// //                     </div>
// //                   </div>

// //                   {/* Status */}
// //                   <div className="md:col-span-1 space-y-3">
// //                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
// //                       Chế độ vận hành dự kiến
// //                     </label>
// //                     <div className="relative">
// //                       <select
// //                         value={assignForm.status}
// //                         onChange={(e) => setAssignForm(prev => ({ ...prev, status: e.target.value }))}
// //                         className="w-full px-7 py-5 bg-white border border-slate-200 rounded-3xl text-base font-bold focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
// //                       >
// //                         <option value="Active">Hoạt động (Active)</option>
// //                         <option value="Idle">Chế độ chờ (Idle)</option>
// //                         <option value="Paused">Tạm dừng (Paused)</option>
// //                       </select>
// //                       <ChevronDown className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-6 h-6" />
// //                     </div>
// //                   </div>

// //                   {/* Actions */}
// //                   <div className="md:col-span-1">
// //                     {assignForm.id ? (
// //                       <button
// //                         onClick={async () => {
// //                           try {
// //                             setLoadingAssignments(true);
// //                             await api.updateAssignment(assignForm.id!, { status: assignForm.status });
// //                             await reloadAssignments();
// //                             setAssignForm({ agentId: '', status: 'Active' });
// //                           } catch (e) {
// //                             console.error(e);
// //                             alert('Cập nhật assignment thất bại.');
// //                           } finally {
// //                             setLoadingAssignments(false);
// //                           }
// //                         }}
// //                         className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
// //                       >
// //                         <Save className="w-5 h-5" /> Cập nhật ngay
// //                       </button>
// //                     ) : (
// //                       <button
// //                         onClick={async () => {
// //                           if (!assignForm.agentId) {
// //                             alert('Vui lòng chọn nhân viên!');
// //                             return;
// //                           }

// //                           try {
// //                             setLoadingAssignments(true);
// //                             await api.createAssignment({
// //                               agentId: assignForm.agentId,
// //                               campaignId: selectedCampaignId,
// //                               status: assignForm.status
// //                             });
// //                             await reloadAssignments();
// //                             setAssignForm({ agentId: '', status: 'Active' });
// //                           } catch (e) {
// //                             console.error(e);
// //                             alert('Thêm Agent vào chiến dịch thất bại (có thể bị trùng Agent).');
// //                           } finally {
// //                             setLoadingAssignments(false);
// //                           }
// //                         }}
// //                         className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"
// //                       >
// //                         <PlusCircle className="w-6 h-6" /> Thêm vào đội ngũ
// //                       </button>
// //                     )}
// //                   </div>
// //                 </div>
// //               </div>

// //               {/* Table */}
// //               <div className="bg-white rounded-[48px] border border-slate-100 overflow-hidden shadow-sm flex flex-col">
// //                 <div className="px-8 py-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
// //                   <div className="flex items-center gap-4">
// //                     <h5 className="text-[12px] font-black uppercase tracking-widest text-slate-900">
// //                       Danh sách nhân sự đang vận hành
// //                     </h5>
// //                     <span className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-600 shadow-sm">
// //                       {filteredAssignments.length} Thành viên
// //                     </span>
// //                   </div>

// //                   <div className="flex items-center gap-6">
// //                     {loadingAssignments && (
// //                       <div className="flex items-center gap-3 text-indigo-600 text-[11px] font-black uppercase tracking-widest animate-pulse">
// //                         <Loader2 className="w-5 h-5 animate-spin" />
// //                         Đang đồng bộ...
// //                       </div>
// //                     )}

// //                     <div className="relative">
// //                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
// //                       <input
// //                         value={assignmentQ}
// //                         onChange={(e) => setAssignmentQ(e.target.value)}
// //                         type="text"
// //                         placeholder="Tìm theo tên / status / mã..."
// //                         className="pl-11 pr-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-indigo-50 outline-none w-72 transition-all"
// //                       />
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <div className="overflow-x-auto">
// //                   <table className="w-full text-left">
// //                     <thead>
// //                       <tr className="bg-slate-50/50">
// //                         <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400">
// //                           Tên nhân viên AI / Định danh
// //                         </th>
// //                         <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400">
// //                           Trạng thái vận hành
// //                         </th>
// //                         <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400">
// //                           Hiệu suất dự kiến
// //                         </th>
// //                         <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400">
// //                           Ngày gia nhập
// //                         </th>
// //                         <th className="px-8 py-7 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">
// //                           Tác vụ
// //                         </th>
// //                       </tr>
// //                     </thead>

// //                     <tbody className="divide-y divide-slate-50">
// //                       {currentAssignments.map((x) => (
// //                         <tr key={x.id} className="hover:bg-indigo-50/30 transition-all group">
// //                           <td className="px-8 py-6">
// //                             <div className="flex items-center gap-6">
// //                               <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-all duration-300">
// //                                 <Bot className="w-7 h-7" />
// //                               </div>
// //                               <div>
// //                                 <div className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
// //                                   {agentNameById(x.agentId)}
// //                                 </div>
// //                                 <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
// //                                   LOG ID: #{(x.id || '').slice(-8).toUpperCase()}
// //                                 </div>
// //                               </div>
// //                             </div>
// //                           </td>

// //                           <td className="px-8 py-6">
// //                             <span
// //                               className={`inline-flex items-center justify-center px-4 py-2 rounded-2xl text-[11px] font-black uppercase border whitespace-nowrap ${
// //                                 x.status === 'Active'
// //                                   ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
// //                                   : x.status === 'Idle'
// //                                   ? 'bg-amber-50 text-amber-700 border-amber-100'
// //                                   : 'bg-slate-100 text-slate-600 border-slate-200'
// //                               }`}
// //                             >
// //                               {x.status === 'Active' ? 'Đang hoạt động' : x.status === 'Idle' ? 'Chế độ chờ' : 'Tạm dừng'}
// //                             </span>
// //                           </td>

// //                           <td className="px-8 py-6">
// //                             <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
// //                               <TrendingUp className="w-4 h-4" />
// //                               <span>100% Load</span>
// //                             </div>
// //                           </td>

// //                           <td className="px-8 py-6">
// //                             <div className="text-sm font-bold text-slate-500 whitespace-nowrap">
// //                               {formatDateTime(x.createdAt)}
// //                             </div>
// //                           </td>

// //                           <td className="px-8 py-6 text-right">
// //                             <div className="flex items-center justify-end gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
// //                               <button
// //                                 onClick={() => setAssignForm({ id: x.id, agentId: x.agentId, status: (x.status ?? 'Active') })}
// //                                 className="p-3 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all shadow-sm hover:shadow-md bg-white border border-indigo-50"
// //                                 title="Chỉnh sửa cấu hình"
// //                               >
// //                                 <Edit2 className="w-6 h-6" />
// //                               </button>

// //                               <button
// //                                 onClick={async () => {
// //                                   if (!window.confirm('Hủy phân bổ nhân sự này?')) return;
// //                                   try {
// //                                     setLoadingAssignments(true);
// //                                     await api.deleteAssignment(x.id);
// //                                     await reloadAssignments();
// //                                   } catch (e) {
// //                                     console.error(e);
// //                                     alert('Xóa assignment thất bại.');
// //                                   } finally {
// //                                     setLoadingAssignments(false);
// //                                   }
// //                                 }}
// //                                 className="p-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all shadow-sm hover:shadow-md bg-white border border-red-50"
// //                                 title="Gỡ khỏi chiến dịch"
// //                               >
// //                                 <Trash2 className="w-6 h-6" />
// //                               </button>
// //                             </div>
// //                           </td>
// //                         </tr>
// //                       ))}

// //                       {filteredAssignments.length === 0 && !loadingAssignments && (
// //                         <tr>
// //                           <td colSpan={5} className="px-8 py-32 text-center">
// //                             <div className="flex flex-col items-center">
// //                               <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
// //                                 <Users className="w-12 h-12 text-slate-200" />
// //                               </div>
// //                               <p className="text-slate-400 font-black uppercase text-sm tracking-widest">Danh sách nhân sự đang trống</p>
// //                               <p className="text-slate-300 text-xs mt-2 font-medium">Sử dụng form phía trên để bắt đầu phân bổ đội ngũ AI.</p>
// //                             </div>
// //                           </td>
// //                         </tr>
// //                       )}
// //                     </tbody>
// //                   </table>
// //                 </div>

// //                 {filteredAssignments.length > ASSIGNMENTS_PER_PAGE && (
// //                   <Pagination
// //                     currentPage={assignmentsPage}
// //                     totalPages={totalAssignmentsPages}
// //                     onPageChange={setAssignmentsPage}
// //                     totalItems={filteredAssignments.length}
// //                     itemsPerPage={ASSIGNMENTS_PER_PAGE}
// //                   />
// //                 )}
// //               </div>
// //             </div>

// //             {/* Footer */}
// //             <div className="px-12 py-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
// //               <div className="flex items-center gap-4">
// //                 <div className="flex -space-x-3">
// //                   {[1, 2, 3].map(i => (
// //                     <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center">
// //                       <Bot className="w-5 h-5 text-indigo-400" />
// //                     </div>
// //                   ))}
// //                 </div>
// //                 <div className="h-10 w-px bg-slate-200 mx-2" />
// //                 <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
// //                   Trạng thái hệ thống: <span className="text-emerald-500">Đã sẵn sàng</span>
// //                   <br />
// //                   <span className="text-slate-300 normal-case font-medium">
// //                     Mọi thay đổi sẽ được áp dụng ngay lập tức cho các quy trình AI đang chạy.
// //                   </span>
// //                 </p>
// //               </div>

// //               <button
// //                 onClick={() => setIsAssignModalOpen(false)}
// //                 className="px-12 py-5 bg-indigo-900 text-white rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-800 transition-all active:scale-95 flex items-center gap-3"
// //               >
// //                 <Save className="w-5 h-5" /> Hoàn tất và Đóng
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* MODAL: KHỞI TẠO CHIẾN DỊCH MỚI */}
// //       {isModalOpen && (
// //         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
// //           <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-[32px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300 flex flex-col">
// //             <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
// //               <div className="flex items-center gap-4">
// //                 <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
// //                   <Rocket className="w-6 h-6" />
// //                 </div>
// //                 <div>
// //                   <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">Khởi tạo chiến dịch</h3>
// //                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Cấu hình lực lượng bán hàng AI</p>
// //                 </div>
// //               </div>
// //               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 rounded-full group transition-all">
// //                 <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
// //               </button>
// //             </div>

// //             <div className="px-8 py-6 space-y-6 overflow-y-auto">
// //               {/* Tên chiến dịch */}
// //               <div className="space-y-3">
// //                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
// //                   <Rocket className="w-3 h-3" /> Tên chiến dịch
// //                 </label>
// //                 <input
// //                   type="text"
// //                   value={newCampaign.name}
// //                   onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
// //                   className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
// //                   placeholder="VD: Chiến dịch năm 2026"
// //                 />
// //               </div>

// //               {/* Chọn dự án */}
// //               <div className="space-y-3">
// //                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
// //                   <Building2 className="w-3 h-3" /> Dự án BĐS mục tiêu
// //                 </label>
// //                 <div className="relative">
// //                   <select
// //                     value={newCampaign.projectId}
// //                     onChange={(e) => setNewCampaign({ ...newCampaign, projectId: e.target.value })}
// //                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all appearance-none cursor-pointer"
// //                   >
// //                     <option value="">Chọn dự án...</option>
// //                     {projectsCbx.map(p => (
// //                       <option key={p.id} value={p.id}>{p.name}</option>
// //                     ))}
// //                   </select>
// //                   <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
// //                 </div>
// //               </div>

// //               {/* Phân bổ nhân viên AI */}
// //               <div className="space-y-4">
// //                 <div className="flex justify-between items-center mb-1">
// //                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
// //                     <Bot className="w-3 h-3 text-indigo-500" /> Phân bổ nhân viên AI
// //                   </label>
// //                   <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{newCampaign.agentCount} Agents</span>
// //                 </div>
// //                 <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-4">
// //                   <input
// //                     type="range"
// //                     min="1"
// //                     max="20"
// //                     value={newCampaign.agentCount}
// //                     onChange={(e) => setNewCampaign({ ...newCampaign, agentCount: parseInt(e.target.value) })}
// //                     className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
// //                   />
// //                   <div className="flex justify-between text-[10px] font-black text-indigo-300 uppercase">
// //                     <span>1 Nhân viên</span>
// //                     <span>Tối đa 20</span>
// //                   </div>
// //                 </div>
// //               </div>

// //               {/* Mục tiêu Lead */}
// //               <div className="space-y-3">
// //                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
// //                   <Users className="w-3 h-3" /> Mục tiêu Lead chất lượng
// //                 </label>
// //                 <input
// //                   type="number"
// //                   value={newCampaign.targetLeads}
// //                   onChange={(e) => setNewCampaign({ ...newCampaign, targetLeads: parseInt(e.target.value || '0') })}
// //                   className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
// //                   placeholder="VD: 500"
// //                 />
// //               </div>

// //               {/* Action Buttons */}
// //               <div className="pt-2 flex gap-4">
// //                 <button
// //                   onClick={() => setIsModalOpen(false)}
// //                   className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
// //                 >
// //                   Hủy bỏ
// //                 </button>
// //                 <button
// //                   onClick={handleStartCampaign}
// //                   className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
// //                 >
// //                   <Zap className="w-4 h-4" /> Triển khai ngay
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* MODAL: SETTINGS */}
// //       {isSettingsModalOpen && selectedCampaignForSetting && (
// //         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
// //           <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300">
// //             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
// //               <div className="flex items-center gap-4">
// //                 <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
// //                   <Settings className="w-6 h-6" />
// //                 </div>
// //                 <div>
// //                   <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">Cấu hình Chiến dịch</h3>
// //                   <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-2">{selectedCampaignForSetting.name}</p>
// //                 </div>
// //               </div>
// //               <button onClick={() => setIsSettingsModalOpen(false)} className="p-2 hover:bg-red-50 rounded-full group transition-all">
// //                 <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
// //               </button>
// //             </div>

// //             <div className="p-10 space-y-8">
// //               {/* Phân bổ nhân viên AI */}
// //               <div className="space-y-4">
// //                 <div className="flex justify-between items-center mb-1">
// //                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
// //                     <Bot className="w-3 h-3 text-indigo-500" /> Điều chỉnh lực lượng AI
// //                   </label>
// //                   <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{settingsForm.agentCount} Agents</span>
// //                 </div>
// //                 <div className="bg-indigo-50/30 p-6 rounded-3xl border border-indigo-100 space-y-4">
// //                   <input
// //                     type="range"
// //                     min="1"
// //                     max="30"
// //                     value={settingsForm.agentCount}
// //                     onChange={(e) => setSettingsForm({ ...settingsForm, agentCount: parseInt(e.target.value) })}
// //                     className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
// //                   />
// //                   <div className="flex justify-between text-[10px] font-black text-indigo-300 uppercase">
// //                     <span>Tối thiểu 1</span>
// //                     <span>Tối đa 30 (Elite)</span>
// //                   </div>
// //                 </div>
// //               </div>

// //               {/* Mục tiêu Lead */}
// //               <div className="space-y-3">
// //                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
// //                   <Users className="w-3 h-3" /> Mục tiêu Lead mới
// //                 </label>
// //                 <input
// //                   type="number"
// //                   value={settingsForm.targetLeads}
// //                   onChange={(e) => setSettingsForm({ ...settingsForm, targetLeads: parseInt(e.target.value || '0') })}
// //                   className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
// //                   placeholder="VD: 500"
// //                 />
// //                 <p className="text-[9px] text-gray-400 italic px-1 font-medium">
// //                   * Thay đổi mục tiêu sẽ tự động cập nhật lại tỉ lệ phần trăm tiến độ chiến dịch.
// //                 </p>
// //               </div>

// //               {/* Action Buttons */}
// //               <div className="pt-6 flex gap-4">
// //                 <button
// //                   onClick={() => setIsSettingsModalOpen(false)}
// //                   className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
// //                 >
// //                   Hủy bỏ
// //                 </button>
// //                 <button
// //                   onClick={handleUpdateSettings}
// //                   className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
// //                 >
// //                   <Save className="w-4 h-4" /> Lưu cấu hình
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default Deployment;
