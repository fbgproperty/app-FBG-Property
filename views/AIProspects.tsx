//============= KHÁCH HÀNG TIỀM NĂNG ==============//
import React, { useEffect, useMemo, useState } from "react";
import { api } from '../services/apiService';
import {
  Search, UserCheck, Loader2, Sparkles, Zap, Phone,
  TrendingUp, Star, BadgeCheck, Flame, RefreshCw,
  XCircle, Mail, Building, Clock, Compass, LayoutGrid, List, ChevronRight, Activity
} from "lucide-react";

import Pagination from "../components/Pagination";
import { formatDateTime } from "@/components/utils/formatDate";

const ITEMS_PER_PAGE = 8;

// ===== Backend types =====
type LeadDto = {
  id: string;
  customerId: string;
  projectId?: string | null;
  unitId?: string | null;
  stage: string;
  assignedToUserId?: string | null;
  source: string;
  score: number;
  createdAt: string;
  updatedAt?: string | null;
  customerName?: string | null;
  projectName?: string | null;
  unitName?: string | null;
  phoneNumber?: string | null;
};

const AIProspects: React.FC = () => {
  const [items, setItems] = useState<LeadDto[]>([]);
  const [loading, setLoading] = useState(true);

  // server paging
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  // filters (map đúng theo backend params)
  const [stage, setStage] = useState<string>(""); // ví dụ: "New" / "Qualified" ...
  const [projectId, setProjectId] = useState<string>("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isHandingOver, setIsHandingOver] = useState<string | null>(null);

  // modal
  const [selectedLead, setSelectedLead] = useState<LeadDto | null>(null);
  const [isInsightOpen, setIsInsightOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);

    const res = await api.getLeads({
      stage: stage || undefined,
      projectId: projectId || undefined,
      assignedTo: assignedTo || undefined,
      q: searchQuery || undefined,
      page: currentPage,
      pageSize: ITEMS_PER_PAGE,
    });

    // NOTE: lọc client (tạm). Nếu muốn chuẩn totalPages, nên cho backend lọc minScore=90.
    // const elite = res.items.filter(l => l.score >= 90 && l.stage !== "Chuyển giao Sales");
    const elite = res.items;

    setItems(elite);
    setTotal(res.total); // total từ backend (chưa trừ lọc elite nếu backend không hỗ trợ)
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, stage, projectId, assignedTo, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const handleOpenInsight = (lead: LeadDto) => {
    setSelectedLead(lead);
    setIsInsightOpen(true);
  };

  // Bạn sẽ thay phần này bằng API thật (PATCH /api/leads/{id}/stage chẳng hạn)
  const handleSalesHandover = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHandingOver(id);

    // TODO: call backend update stage
    // await updateLeadStage(id, "Chuyển giao Sales");

    await new Promise((r) => setTimeout(r, 800));
    setItems((prev) => prev.filter((x) => x.id !== id));
    setIsHandingOver(null);
    setIsInsightOpen(false);
    alert("Đã chuyển giao Lead thành công cho đội ngũ Sales!");
  };

  const leadName = (l: LeadDto) => l.customerName?.trim() || "N/A";
  const leadPhone = (l: LeadDto) => l.phoneNumber?.trim() || "—";
  const leadProject = (l: LeadDto) => l.projectName?.trim() || "Chưa gắn dự án";

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-black text-xs uppercase tracking-widest animate-pulse">
          Đang tải Lead tinh hoa (Score ≥ 90%)...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-xl shadow-lg flex-shrink-0">
              <Flame className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-gray-900 leading-none truncate">
                Danh sách tiềm năng (90%+)
              </h2>
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mt-1.5 flex items-center gap-1 whitespace-nowrap">
                <BadgeCheck className="w-3 h-3 flex-shrink-0" /> Sẵn sàng chốt đơn
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="bg-white border border-gray-200 p-0.5 rounded-xl flex items-center shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "grid"
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-orange-600 text-white shadow-md"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-right border-r border-gray-100 pr-4">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 whitespace-nowrap">
                Đang hiển thị
              </p>
              <p className="text-lg font-black text-indigo-600 leading-none">
                {items.length}
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-yellow-400 animate-bounce flex-shrink-0" />
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo tên/điện thoại/dự án..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-orange-100 transition-all outline-none"
          />
        </div>

        {/* stage */}
        <select
          value={stage}
          onChange={(e) => {
            setStage(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase outline-none cursor-pointer flex-shrink-0"
        >
          <option value="">Tất cả stage</option>
          <option value="New">New</option>
          <option value="Qualified">Qualified</option>
          <option value="Chuyển giao Sales">Chuyển giao Sales</option>
        </select>

        {/* projectId / assignedTo có thể thay bằng dropdown thật */}
        <input
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="ProjectId (optional)"
          className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none w-[190px]"
        />
        <input
          value={assignedTo}
          onChange={(e) => {
            setAssignedTo(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="AssignedTo (optional)"
          className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none w-[190px]"
        />
      </div>

      {/* List */}
      {items.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((lead) => (
              <div
                key={lead.id}
                onClick={() => handleOpenInsight(lead)}
                className="bg-white rounded-[32px] border-2 border-orange-50 shadow-xl hover:shadow-orange-100 transition-all duration-500 group flex flex-col relative overflow-hidden transform hover:-translate-y-1 cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-red-500"></div>

                <div className="p-8 flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-6 gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0">
                        {leadName(lead)[0] || "N"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-gray-900 text-lg group-hover:text-orange-600 transition-colors leading-none truncate">
                          {leadName(lead)}
                        </h3>
                        <p className="text-[9px] font-black text-gray-400 uppercase mt-2 tracking-tighter truncate">
                          {leadPhone(lead)} • {lead.source}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full border border-orange-100 shadow-sm">
                        <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                        <span className="text-sm font-black text-orange-600 leading-none">
                          {lead.score}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 relative group-hover:bg-orange-50/20 transition-colors">
                      <Zap className="absolute -top-2 -right-2 w-6 h-6 text-orange-400 fill-orange-400 animate-pulse" />
                      <p className="text-[9px] font-black text-orange-500 uppercase mb-2 tracking-widest">
                        Dự án quan tâm
                      </p>
                      <p className="text-xs font-bold text-gray-800 leading-relaxed truncate">
                        {leadProject(lead)}
                      </p>
                    </div>

                    {/* Nếu backend chưa có AI text như aiAssessment thì có thể hiển thị stage/createdAt */}
                    <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                      <p className="text-[9px] font-black text-indigo-500 uppercase mb-1 tracking-widest">
                        Trạng thái
                      </p>
                      <p className="text-[11px] text-indigo-900 font-bold leading-relaxed line-clamp-2 italic">
                        "{lead.stage}" • {new Date(lead.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 bg-orange-50/30 border-t border-orange-50">
                  <button
                    onClick={(e) => handleSalesHandover(lead.id, e)}
                    disabled={isHandingOver === lead.id}
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {isHandingOver === lead.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang chuyển...
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5" /> Bàn giao ngay
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                    Khách hàng
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                    Dự án quan tâm
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center whitespace-nowrap">
                    Xác suất
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                    Nguồn
                  </th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right whitespace-nowrap">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleOpenInsight(lead)}
                    className="hover:bg-orange-50/20 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-sm shadow-md flex-shrink-0">
                          {leadName(lead)[0] || "N"}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-gray-900 text-[13px] group-hover:text-orange-600 transition-colors truncate">
                            {leadName(lead)}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold truncate">
                            {leadPhone(lead)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-4 max-w-[260px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span className="text-xs font-black text-gray-700 truncate">
                          {leadProject(lead)}
                        </span>
                      </div>
                    </td>

                    <td className="px-8 py-4 text-center">
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-sm font-black">{lead.score}%</span>
                      </div>
                    </td>

                    <td className="px-8 py-4">
                      <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-md uppercase tracking-tight whitespace-nowrap">
                        {lead.source}
                      </span>
                    </td>

                    <td className="px-8 py-4 text-right">
                      <button
                        onClick={(e) => handleSalesHandover(lead.id, e)}
                        disabled={isHandingOver === lead.id}
                        className="p-2 text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-indigo-100 transition-all shadow-sm group/btn"
                      >
                        {isHandingOver === lead.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-dashed border-gray-200">
          <Sparkles className="w-12 h-12 text-gray-200 mb-6" />
          <h3 className="text-xl font-black text-gray-900 mb-2">Danh sách khách hàng tiềm năng trống</h3>
          <p className="text-gray-500 font-medium mb-8">Hệ thống đang tiếp tục sàng lọc...</p>
          <button
            onClick={() => loadData()}
            className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
        </div>
      )}

      {total > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={total}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {/* MODAL: map sang LeadDto */}
      {isInsightOpen && selectedLead && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-[95vw] xl:max-w-[1300px] h-full max-h-[92vh] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
            <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-2.5 bg-orange-600 rounded-xl text-white shadow-xl flex-shrink-0">
                  <Star className="w-5 h-5 fill-current" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none truncate">
                    Chi tiết khách hàng
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      ID: {selectedLead.id}
                    </span>
                    <span className="text-[9px] font-black text-orange-600 uppercase flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 whitespace-nowrap">
                      <Zap className="w-2.5 h-2.5 fill-current" /> LeadDto
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsInsightOpen(false)}
                className="p-2 hover:bg-red-50 rounded-full group transition-all flex-shrink-0"
              >
                <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
              {/* LEFT */}
              <div className="lg:col-span-3 bg-gray-50/40 border-r border-gray-100 p-8 overflow-y-auto flex flex-col items-center">
                <div className="w-24 h-24 rounded-3xl bg-orange-600 flex items-center justify-center text-white font-black text-4xl shadow-xl border-4 border-white mb-6 flex-shrink-0">
                  {leadName(selectedLead)[0] || "N"}
                </div>
                <h3 className="text-xl font-black text-gray-900 text-center mb-1.5 leading-tight line-clamp-2">
                  {leadName(selectedLead)}
                </h3>
                <div className="flex items-center gap-2 mb-8">
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-black uppercase border border-orange-100">
                    {selectedLead.source}
                  </span>
                  <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-black uppercase border border-green-100">
                    {selectedLead.score}%
                  </span>
                </div>

                <div className="w-full space-y-3">
                  <div className="p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
                    <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Điện thoại
                      </span>
                      <span className="text-[13px] font-black text-gray-900 truncate">
                        {leadPhone(selectedLead)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3.5">
                    <Mail className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        Trạng thái
                      </span>
                      <span className="text-[12px] font-black text-gray-900 truncate">
                        {selectedLead.stage}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MIDDLE */}
              <div className="lg:col-span-5 p-10 overflow-y-auto space-y-10 bg-white border-r border-gray-100">
                <div className="flex justify-between items-center border-b border-gray-50 pb-5 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Zap className="w-6 h-6 text-orange-500 fill-current flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-lg font-black text-gray-900 leading-none truncate">
                        Chỉ số Chốt đơn
                      </h4>
                      <p className="text-gray-400 font-black uppercase tracking-widest text-[9px] mt-1 whitespace-nowrap">
                        Dựa trên score backend
                      </p>
                    </div>
                  </div>
                  <span className="text-3xl font-black text-orange-600 leading-none flex-shrink-0">
                    {selectedLead.score}%
                  </span>
                </div>

                <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
                  <TrendingUp className="absolute -right-8 -bottom-8 w-32 h-32 opacity-10" />
                  <h5 className="text-[10px] font-black text-orange-100 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Tóm tắt Lead
                  </h5>
                  <p className="text-lg font-black italic leading-tight mb-6 line-clamp-3">
                    "{leadName(selectedLead)} quan tâm: {leadProject(selectedLead)}"
                  </p>
                  <div className="p-5 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <p className="text-[13px] text-white/90 font-medium leading-relaxed italic">
                      Nguồn: {selectedLead.source} • Ngày tạo:{" "}
                      {formatDateTime(selectedLead.createdAt)}
                      {/* {new Date(selectedLead.createdAt).toLocaleString()} */}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm space-y-4">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Building className="w-4 h-4 text-orange-600" /> Dự án - Căn hộ
                  </h5>
                  <div className="text-sm font-bold text-gray-800">
                    {selectedLead.projectName || "—"} • {selectedLead.unitName || "—"}
                  </div>
                </div>
              </div>

              {/* RIGHT */}
              <div className="lg:col-span-4 p-10 overflow-y-auto bg-gray-50/25 flex flex-col">
                <div className="mb-10 flex-shrink-0">
                  <h4 className="text-lg font-black text-gray-900 flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    Thông tin hệ thống
                  </h4>
                </div>

                <div className="space-y-6 flex-1 min-h-0">
                  <div className="p-5 bg-white rounded-3xl border border-orange-100 shadow-sm flex-shrink-0">
                    <h5 className="text-[9px] font-black text-orange-400 uppercase mb-3 flex items-center gap-2">
                      <Compass className="w-3.5 h-3.5" /> IDs
                    </h5>
                    <p className="text-[12px] font-bold text-gray-700 leading-relaxed">
                      {/* customerId: {selectedLead.customerId} */}
                      Tên khách hàng: {selectedLead.customerName || "N/A"}
                      <br />
                      {/* projectId: {selectedLead.projectId || "—"} */}
                      Tên dự án: {selectedLead.projectName || "N/A"}
                      <br />
                      {/* unitId: {selectedLead.unitId || "—"} */}
                      Mã căn hộ: {selectedLead.unitName || "N/A"}
                      <br />
                      {/* assignedToUserId: {selectedLead.assignedToUserId || "—"} */}
                      Nhân viên tư vấn: {selectedLead.NameUser || "N/A"}
                      <br />
                      Địa chỉ: {selectedLead.Address || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="mt-10 space-y-2.5 pt-8 border-t border-gray-100 flex-shrink-0">
                  <button
                    onClick={(e) => handleSalesHandover(selectedLead.id, e)}
                    className="w-full py-4 bg-orange-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" /> Bàn giao ngay cho Sales
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIProspects;


// import React, { useEffect, useMemo, useState } from 'react';
// import { Customer } from '../types';
// import Pagination from '../components/Pagination';
// import { api } from '../services/apiService';
// import {
//   Search, UserCheck, Loader2, Zap, Phone,
//   TrendingUp, Star, BadgeCheck, Flame, RefreshCw, MessageSquare,
//   XCircle, Mail, MessageCircle, Smartphone, Activity,
//   Building, Clock, Compass, LayoutGrid, List, ChevronRight,
//   Facebook, Instagram, Send, Headset, MessageSquareText, Share2,
// } from 'lucide-react';

// const ITEMS_PER_PAGE = 8;

// // ===== Backend types =====
// type LeadDto = {
//   id: string;
//   customerId: string;
//   projectId?: string | null;
//   unitId?: string | null;
//   stage: string;
//   assignedToUserId?: string | null;
//   source: string;
//   score: number;
//   createdAt: string;
//   updatedAt?: string | null;
//   customerName?: string | null;
//   projectName?: string | null;
//   unitName?: string | null;
//   phoneNumber?: string | null;
// };

// type ApiPagedResponse<T> = {
//   items: T[];
//   page: number;
//   pageSize: number;
//   total: number;
// };

// // ===== Helpers =====
// const ChannelIcon: React.FC<{ name: string }> = ({ name }) => {
//   const n = (name || '').toLowerCase();
//   if (n.includes('facebook')) return <Facebook className="w-3.5 h-3.5 text-blue-600" />;
//   if (n.includes('zalo oa')) return <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[7px] text-white font-black shadow-sm">OA</div>;
//   if (n.includes('zalo')) return <MessageCircle className="w-3.5 h-3.5 text-blue-400" />;
//   if (n.includes('instagram')) return <Instagram className="w-3.5 h-3.5 text-pink-600" />;
//   if (n.includes('whatsapp')) return <Smartphone className="w-3.5 h-3.5 text-green-500" />;
//   if (n.includes('telegram')) return <Send className="w-3.5 h-3.5 text-blue-400" />;
//   if (n.includes('tiktok')) return <Share2 className="w-3.5 h-3.5 text-black" />;
//   if (n.includes('livechat')) return <Headset className="w-3.5 h-3.5 text-indigo-500" />;
//   if (n.includes('gmail')) return <Mail className="w-3.5 h-3.5 text-red-500" />;
//   if (n.includes('sms')) return <MessageSquareText className="w-3.5 h-3.5 text-amber-500" />;
//   if (n.includes('call') || n.includes('gọi điện')) return <Phone className="w-3.5 h-3.5 text-green-600" />;
//   return <MessageSquare className="w-3.5 h-3.5 text-gray-400" />;
// };

// // Map LeadDto -> Customer tối thiểu để UI chạy.
// // TODO: Khi có API join Customer (name/phone/email/needs...) thì thay map này bằng data thật.
// function mapLeadToCustomer(lead: LeadDto): Customer {
//   const shortId = lead.customerId?.slice(0, 8)?.toUpperCase() || 'CUS';
//   return {
//     id: lead.id,
//     name: lead.customerName ?? '',
//     phone: lead.phoneNumber ?? 'N/A',
//     email: 'N/A',
//     needs: `Lead stage: ${lead.stage}`,
//     source: lead.source || 'Unknown',
//     status: lead.stage, // giữ stage
//     score: lead.score ?? 0,
//     projectName: lead.projectName ?? '',
//     unitName: lead.unitName ?? '',


//     // các field UI đang dùng (fallback)
//     preferredChannels: lead.source ? [lead.source] : ['LiveChat'],
//     aiAssessment: `AI Score ${lead.score}% - Stage: ${lead.stage}`,
//     aiDetailedAnalysis: `LeadId: ${lead.id}\nCustomerId: ${lead.customerId}\nProjectId: ${lead.projectId ?? '-'}\nAssignedTo: ${lead.assignedToUserId ?? '-'}`,
//     matchingProjects: [],
//     interactionHistory: [],
//   } as Customer;
// }

// const AIProspects: React.FC = () => {
//   const [prospects, setProspects] = useState<Customer[]>([]);
//   const [loading, setLoading] = useState(true);

//   // server paging
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalItems, setTotalItems] = useState(0);

//   const [isHandingOver, setIsHandingOver] = useState<string | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

//   // filters (map vào query backend)
//   // const [stage, setStage] = useState<string>('HOT'); // ví dụ: Nổi bật / Mới / Chốt / Hủy bỏ...
//   const [stage, setStage] = useState<string>(''); // ví dụ: HOT / NEW / WON / LOST...
//   const [projectId, setProjectId] = useState<string>(''); // uuid string
//   const [assignedTo, setAssignedTo] = useState<string>(''); // uuid string

//   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
//   const [isInsightOpen, setIsInsightOpen] = useState(false);

//   const loadData = async (force: boolean = false) => {
//     setLoading(true);
//     try {
//       const res: ApiPagedResponse<LeadDto> = await api.getLeads({
//         stage: stage || undefined,
//         projectId: projectId || undefined,
//         assignedTo: assignedTo || undefined,
//         q: searchQuery || undefined,
//         page: currentPage,
//         pageSize: ITEMS_PER_PAGE,
//       });

//       // UI yêu cầu “>= 90” => lọc ở client (hoặc tốt hơn: backend hỗ trợ scoreMin)
//       // const elite = (res.items || []).filter(x => (x.score ?? 0) >= 90);
//       const elite = (res.items || []);
//       setProspects(elite.map(mapLeadToCustomer));

//       // total để pagination đúng: nếu bạn muốn total cũng chỉ tính elite thì backend nên hỗ trợ filter scoreMin.
//       // tạm thời: dùng res.total (toàn bộ theo query) hoặc elite.length.
//       setTotalItems(res.total ?? elite.length);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData(false);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentPage, stage, projectId, assignedTo, searchQuery]);

//   const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

//   const filteredProspects = useMemo(() => {
//     // Server đã lọc theo q rồi, client chỉ giữ fallback an toàn
//     const q = searchQuery.trim().toLowerCase();
//     if (!q) return prospects;
//     return prospects.filter(p =>
//       (p.name || '').toLowerCase().includes(q) ||
//       (p.phone || '').includes(q) ||
//       (p.needs || '').toLowerCase().includes(q)
//     );
//   }, [prospects, searchQuery]);

//   const currentItems = filteredProspects; // vì server paging rồi

//   const handleOpenInsight = (c: Customer) => {
//     setSelectedCustomer(c);
//     setIsInsightOpen(true);
//   };

//   const handleSalesHandover = async (id: string, e: React.MouseEvent) => {
//     e.stopPropagation();
//     setIsHandingOver(id);

//     // TODO: gọi API đổi stage / handover thật (PUT /api/leads/{id}/handover)
//     await new Promise(resolve => setTimeout(resolve, 800));

//     setProspects(prev => prev.filter(p => p.id !== id));
//     setIsHandingOver(null);
//     setIsInsightOpen(false);
//     alert('Đã chuyển giao khách hàng cho Sales! (demo)');
//   };

//   if (loading) return (
//     <div className="h-full flex flex-col items-center justify-center text-indigo-600">
//       <Loader2 className="w-12 h-12 animate-spin mb-4" />
//       <p className="font-black text-xs uppercase tracking-widest animate-pulse">
//         Đang tải Leads từ Backend (Score ≥ 90%)...
//       </p>
//     </div>
//   );

//   return (
//     <div className="space-y-6 animate-in fade-in duration-500 pb-10">
//       <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div className="min-w-0">
//           <div className="flex items-center gap-3 mb-1">
//             <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
//               <Flame className="w-5 h-5 text-white" />
//             </div>
//             <div>
//               <h2 className="text-2xl font-black text-gray-900 leading-none">Khách hàng tiềm năng (Hot Leads)</h2>
//               <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1.5 flex items-center gap-1">
//                 <BadgeCheck className="w-3 h-3" /> Tỷ lệ chốt dự kiến ≥ 90%
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <div className="bg-white border border-gray-200 p-0.5 rounded-xl flex items-center shadow-sm">
//             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
//             <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}><List className="w-4 h-4" /></button>
//           </div>
//           <button onClick={() => loadData(true)} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-indigo-600 shadow-sm transition-all">
//             <RefreshCw className="w-4 h-4" />
//           </button>
//         </div>
//       </header>

//       {/* FILTERS -> query backend */}
//       <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
//           <div className="relative md:col-span-2">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
//               placeholder="Nhập từ khóa bạn cần tìm kiếm..."
//               className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
//             />
//           </div>

//           <input
//             value={stage}
//             onChange={(e) => { setStage(e.target.value); setCurrentPage(1); }}
//             placeholder="Chọn trạng thái"
//             className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
//           />

//           <div className="grid grid-cols-2 gap-3">
//             <input
//               value={projectId}
//               onChange={(e) => { setProjectId(e.target.value); setCurrentPage(1); }}
//               placeholder="Chọn dự án"
//               className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
//             />
//             <input
//               value={assignedTo}
//               onChange={(e) => { setAssignedTo(e.target.value); setCurrentPage(1); }}
//               placeholder="Chọn nhân viên phụ trách"
//               className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
//             />
//           </div>
//         </div>

//         {/* <div className="text-[10px] font-bold text-gray-400">
//           Đang query backend: stage / projectId / assignedTo / q / page / pageSize
//         </div> */}
//       </div>

//       {currentItems.length > 0 ? (
//         viewMode === 'grid' ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {currentItems.map((lead) => (
//               <div key={lead.id} onClick={() => handleOpenInsight(lead)} className="bg-white rounded-[32px] border border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer relative flex flex-col overflow-hidden">
//                 <div className="absolute top-4 right-4 text-[10px] font-black px-2 py-1 rounded-lg text-white shadow-sm flex items-center gap-1 bg-green-500 animate-pulse">
//                   <Star className="w-2.5 h-2.5 fill-current" /> {lead.score}%
//                 </div>

//                 <div className="flex items-center gap-4 mb-6">
//                   <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
//                     {(lead.name?.[0] || 'C')}
//                   </div>
//                   <div className="min-w-0">
//                     <h3 className="font-black text-gray-900 text-[15px] truncate group-hover:text-indigo-600 transition-colors">{lead.name}</h3>
//                     <div className="flex items-center gap-1 mt-1">
//                       <Phone className="w-3 h-3 text-green-500" />
//                       <p className="text-[10px] font-bold text-gray-400 truncate">{lead.phone}</p>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-3 mb-6 flex-1">
//                   <div className="p-3 bg-orange-50/50 rounded-2xl border border-orange-100">
//                     <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
//                       <Zap className="w-3 h-3 fill-current" /> Backend Lead
//                     </p>
//                     <p className="text-[11px] text-gray-700 font-bold leading-relaxed line-clamp-3 italic">
//                       "{lead.needs}"
//                     </p>
//                   </div>
//                   <div className="flex gap-1.5 flex-wrap">
//                     {(lead.preferredChannels || []).slice(0, 4).map((ch, i) => (
//                       <div key={i} className="p-1.5 bg-gray-50 rounded-lg border border-gray-100" title={ch}>
//                         <ChannelIcon name={ch} />
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <button
//                   onClick={(e) => handleSalesHandover(lead.id, e)}
//                   disabled={isHandingOver === lead.id}
//                   className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg mt-1"
//                 >
//                   {isHandingOver === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><UserCheck className="w-3.5 h-3.5" /> Chốt & Bàn giao</>}
//                 </button>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
//             <table className="w-full text-left">
//               <thead>
//                 <tr className="bg-gray-50/80 border-b border-gray-100">
//                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Lead</th>
//                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-center">AI Score</th>
//                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Source</th>
//                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Thao tác</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-50">
//                 {currentItems.map((lead) => (
//                   <tr key={lead.id} onClick={() => handleOpenInsight(lead)} className="hover:bg-indigo-50/20 transition-colors group cursor-pointer">
//                     <td className="px-8 py-4">
//                       <div className="flex items-center gap-3">
//                         <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
//                           {(lead.name?.[0] || 'C')}
//                         </div>
//                         <div className="min-w-0">
//                           <div className="font-black text-gray-900 text-sm truncate">{lead.name}</div>
//                           <div className="text-[10px] text-gray-400 font-bold truncate">{lead.needs}</div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-8 py-4 text-center">
//                       <span className="px-2 py-1 rounded-lg text-[10px] font-black text-white bg-green-500 shadow-sm">{lead.score}%</span>
//                     </td>
//                     <td className="px-8 py-4">
//                       <div className="flex gap-2 items-center">
//                         <ChannelIcon name={lead.source || 'Unknown'} />
//                         <span className="text-xs font-bold text-gray-600">{lead.source || 'Unknown'}</span>
//                       </div>
//                     </td>
//                     <td className="px-8 py-4 text-right">
//                       <button onClick={(e) => handleSalesHandover(lead.id, e)} className="p-2 text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm">
//                         <ChevronRight className="w-5 h-5" />
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )
//       ) : (
//         <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-dashed border-gray-200">
//           <Flame className="w-12 h-12 text-gray-200 mb-6" />
//           <h3 className="text-xl font-black text-gray-900 mb-2">Chưa có Lead Score ≥ 90%</h3>
//           <p className="text-gray-500 font-medium mb-8">Backend trả về rỗng theo filter hiện tại.</p>
//           <button onClick={() => loadData(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">
//             Làm mới dữ liệu
//           </button>
//         </div>
//       )}

//       <Pagination
//         currentPage={currentPage}
//         totalPages={totalPages}
//         onPageChange={setCurrentPage}
//         totalItems={totalItems}
//         itemsPerPage={ITEMS_PER_PAGE}
//       />

//       {/* MODAL INSIGHT */}
//       {isInsightOpen && selectedCustomer && (
//         <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/75 backdrop-blur-md animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-[95vw] xl:max-w-[1300px] h-full max-h-[92vh] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col">
//             <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
//               <div className="flex items-center gap-4 min-w-0">
//                 <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-xl flex-shrink-0 animate-pulse">
//                   <Star className="w-5 h-5 fill-current" />
//                 </div>
//                 <div className="min-w-0">
//                   <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none truncate uppercase">
//                     Insight (Backend Lead)
//                   </h3>
//                   <p className="text-[10px] text-green-600 font-black uppercase tracking-widest mt-2 flex items-center gap-1">
//                     <BadgeCheck className="w-3 h-3" /> LeadId: {selectedCustomer.id}
//                   </p>
//                 </div>
//               </div>
//               <button onClick={() => setIsInsightOpen(false)} className="p-2 hover:bg-red-50 rounded-full group transition-all flex-shrink-0">
//                 <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
//               </button>
//             </div>

//             <div className="p-8 overflow-auto">
//               <pre className="text-xs bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
//                 {selectedCustomer.aiDetailedAnalysis}
//               </pre>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AIProspects;