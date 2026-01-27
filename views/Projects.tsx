
// =========== DANH SÁCH DỰ ÁN ===========
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { api } from '../services/apiService';
import {
  Plus, MapPin, Loader2, RefreshCcw,
  LayoutGrid, Search, Filter, X, Building, Layers, Activity
} from 'lucide-react';

const PROJECTS_PER_PAGE = 6;

// ====== Backend DTO (đúng theo ProjectDetailDto bạn đã bổ sung) ======
type ApiProjectItem = {
  id: string; // Guid
  code: string;
  name: string;

  location: string;
  province: string;

  status: string;        // Selling | Planning | Sold Out (khuyên chuẩn hóa)
  projectType: string;   // Căn hộ | Đất nền | Nhà phố
  investor: string;

  imageUrl: string;
  priceRange: string;
  productCount: number;

  description?: string | null;
  createdAt: string; // DateTimeOffset
  updatedAt?: string | null;
};

type ApiPagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

// ====== UI Model ======
type UiProject = {
  id: string;
  name: string;
  location: string;
  province: string;
  investor: string;
  status: string; // "Selling" | "Planning" | "Sold Out" hoặc backend trả gì thì giữ
  imageUrl: string;
  priceRange: string;
  projectType: string;
  productCount: number;
};

// Nếu backend status không đúng 3 giá trị UI đang tô màu, ta normalize nhẹ
function normalizeStatus(status: string) {
  const s = (status || '').trim().toLowerCase();
  if (s === 'selling' || s.includes('sell')) return 'Selling';
  if (s === 'planning' || s.includes('plan')) return 'Planning';
  if (s === 'sold out' || s === 'soldout' || s.includes('sold')) return 'Sold Out';
  return status;
}

function mapApiToUi(p: ApiProjectItem): UiProject {
  return {
    id: p.id,
    name: p.name,
    location: p.location,
    province: p.province,
    investor: p.investor,
    status: normalizeStatus(p.status),
    imageUrl: p.imageUrl,
    priceRange: p.priceRange,
    projectType: p.projectType,
    productCount: p.productCount ?? 0,
  };
}

const Projects: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<UiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // server pagination
  const [currentProjectPage, setCurrentProjectPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [investorFilter, setInvestorFilter] = useState('All');
  const [provinceFilter, setProvinceFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const buildQuery = (params: Record<string, any>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (typeof v === 'string' && v.trim() === '') return;
      if (v === 'All') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString();
    return qs ? `?${qs}` : '';
  };

  const loadProjects = async (force: boolean = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);

      // Backend hiện tại hỗ trợ: status, q, page, pageSize
      // investor/province/type hiện đang filter client-side (vì bạn chưa nói backend có param này)
      const query = buildQuery({
        status: statusFilter === 'All' ? undefined : statusFilter,
        q: searchQuery,
        page: currentProjectPage,
        pageSize: PROJECTS_PER_PAGE,
      });

      const res = await api.request<ApiPagedResponse<ApiProjectItem>>(
        `/projects${query}`,
        { method: 'GET' }
      );

      const mapped = res.items.map(mapApiToUi);

      setProjects(mapped);
      setTotalItems(res.total);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectPage, statusFilter, searchQuery]);

  // Dropdown options
  const investors = useMemo(() => {
    const set = new Set(projects.map(p => p.investor).filter(Boolean));
    return ['All', ...Array.from(set)].sort();
  }, [projects]);

  const provinces = useMemo(() => {
    const set = new Set(projects.map(p => p.province).filter(Boolean));
    return ['All', ...Array.from(set)].sort();
  }, [projects]);

  const projectTypes = useMemo(() => {
    const set = new Set(projects.map(p => p.projectType).filter(Boolean));
    return ['All', ...Array.from(set)].sort();
  }, [projects]);

  // Client-side filter bổ sung (investor/province/type)
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchInvestor = investorFilter === 'All' || p.investor === investorFilter;
      const matchProvince = provinceFilter === 'All' || p.province === provinceFilter;
      const matchType = typeFilter === 'All' || p.projectType === typeFilter;
      return matchInvestor && matchProvince && matchType;
    });
  }, [projects, investorFilter, provinceFilter, typeFilter]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setInvestorFilter('All');
    setProvinceFilter('All');
    setTypeFilter('All');
    setCurrentProjectPage(1);
  };

  // Pagination vẫn theo server total (không theo filteredProjects)
  const totalProjectPages = Math.ceil(totalItems / PROJECTS_PER_PAGE);

  const handleProjectClick = (id: string) => {
    navigate(`/projects/${id}`);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium">Đang tải danh mục bất động sản...</p>
      </div>
    );
  }

  const hasAnyFilter =
    !!searchQuery ||
    statusFilter !== 'All' ||
    investorFilter !== 'All' ||
    provinceFilter !== 'All' ||
    typeFilter !== 'All';

  return (
    <div className="space-y-6 relative h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Danh mục Dự án</h2>
          <p className="text-gray-500">Tìm kiếm dự án theo từ khóa và trạng thái.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadProjects(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Làm mới
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-md">
            <Plus className="w-5 h-5" /> Thêm dự án
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search (server q) */}
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentProjectPage(1); }}
              placeholder="Tên dự án, địa chỉ..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Investor (client filter) */}
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={investorFilter}
              onChange={(e) => { setInvestorFilter(e.target.value); setCurrentProjectPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All">Nhà đầu tư: Tất cả</option>
              {investors.filter(x => x !== 'All').map(x => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          {/* Province (client filter) */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={provinceFilter}
              onChange={(e) => { setProvinceFilter(e.target.value); setCurrentProjectPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All">Tỉnh thành: Tất cả</option>
              {provinces.filter(x => x !== 'All').map(x => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          {/* Project Type (client filter) */}
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentProjectPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All">Loại hình: Tất cả</option>
              {projectTypes.filter(x => x !== 'All').map(x => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          {/* Status (server status) */}
          <div className="relative">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentProjectPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All">Trạng thái: Tất cả</option>
              <option value="Selling">Đang mở bán</option>
              <option value="Planning">Sắp ra mắt</option>
              <option value="Sold Out">Hết hàng</option>
            </select>
          </div>
        </div>

        {hasAnyFilter && (
          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-tight"
            >
              <X className="w-3.5 h-3.5" /> Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Grid Results */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              onClick={() => handleProjectClick(project.id)}
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={project.imageUrl}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  <span className={`text-white text-[9px] font-black px-2 py-1 rounded-md shadow-lg uppercase border backdrop-blur-md w-fit ${
                    project.status === 'Selling' ? 'bg-green-600/80 border-green-400/50' :
                    project.status === 'Sold Out' ? 'bg-red-600/80 border-red-400/50' :
                    'bg-indigo-600/80 border-indigo-400/50'
                  }`}>
                    {project.status === 'Selling' ? 'Đang mở bán' : project.status === 'Sold Out' ? 'Hết hàng' : 'Sắp ra mắt'}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-black text-white leading-tight drop-shadow-md line-clamp-2">
                    {project.name}
                  </h3>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Building className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {project.investor}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-500 mb-4">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm truncate font-medium">
                    {project.location}, {project.province}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-sm font-black text-indigo-600 tracking-tight">
                    {project.priceRange}
                  </span>

                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-gray-400 uppercase">
                      {project.projectType}
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-black">
                      <LayoutGrid className="w-3 h-3" /> {project.productCount} SP
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Filter className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="text-lg font-bold text-gray-900">Không tìm thấy kết quả</h3>
          <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          <button
            onClick={resetFilters}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
          >
            Xem tất cả dự án
          </button>
        </div>
      )}

      {totalItems > 0 && (
        <Pagination
          currentPage={currentProjectPage}
          totalPages={totalProjectPages}
          onPageChange={setCurrentProjectPage}
          totalItems={totalItems}
          itemsPerPage={PROJECTS_PER_PAGE}
        />
      )}
    </div>
  );
};

export default Projects;



// import React, { useEffect, useState, useMemo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Project } from '../types';
// import { getAIProjectsData } from '../services/geminiService';
// import Pagination from '../components/Pagination';
// import { 
//   Plus, MapPin, Loader2, RefreshCcw, 
//   LayoutGrid, Search, Filter, X, Building, Globe, Layers, Activity
// } from 'lucide-react';

// const PROJECTS_PER_PAGE = 6;

// const Projects: React.FC = () => {
//   const navigate = useNavigate();
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [currentProjectPage, setCurrentProjectPage] = useState(1);

//   // Filter States
//   const [searchQuery, setSearchQuery] = useState('');
//   const [investorFilter, setInvestorFilter] = useState('All');
//   const [provinceFilter, setProvinceFilter] = useState('All'); // Đổi từ region sang province
//   const [typeFilter, setTypeFilter] = useState('All');
//   const [statusFilter, setStatusFilter] = useState('All');

//   const loadProjects = async (force: boolean = false) => {
//     if (force) setRefreshing(true);
//     else setLoading(true);
    
//     const data = await getAIProjectsData(force);
//     setProjects(data);
    
//     setLoading(false);
//     setRefreshing(false);
//   };

//   useEffect(() => {
//     loadProjects();
//   }, []);

//   // Unique lists for filters
//   const investors = useMemo(() => {
//     const list = new Set(projects.map(p => p.investor));
//     return ['All', ...Array.from(list)].sort();
//   }, [projects]);

//   // Tự động lấy danh sách tỉnh thành từ dữ liệu dự án
//   const provinces = useMemo(() => {
//     const list = new Set(projects.map(p => p.province));
//     return ['All', ...Array.from(list)].sort();
//   }, [projects]);

//   const filteredProjects = useMemo(() => {
//     return projects.filter(p => {
//       const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
//                           p.location.toLowerCase().includes(searchQuery.toLowerCase());
//       const matchInvestor = investorFilter === 'All' || p.investor === investorFilter;
//       const matchProvince = provinceFilter === 'All' || p.province === provinceFilter;
//       const matchType = typeFilter === 'All' || p.projectType === typeFilter;
//       const matchStatus = statusFilter === 'All' || p.status === statusFilter;

//       return matchSearch && matchInvestor && matchProvince && matchType && matchStatus;
//     });
//   }, [projects, searchQuery, investorFilter, provinceFilter, typeFilter, statusFilter]);

//   // Reset filters
//   const resetFilters = () => {
//     setSearchQuery('');
//     setInvestorFilter('All');
//     setProvinceFilter('All');
//     setTypeFilter('All');
//     setStatusFilter('All');
//     setCurrentProjectPage(1);
//   };

//   // Pagination logic
//   const totalProjectPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
//   const currentProjects = filteredProjects.slice(
//     (currentProjectPage - 1) * PROJECTS_PER_PAGE,
//     currentProjectPage * PROJECTS_PER_PAGE
//   );

//   const handleProjectClick = (id: string) => {
//     navigate(`/projects/${id}`);
//   };

//   if (loading) {
//     return (
//       <div className="h-full flex flex-col items-center justify-center text-indigo-600">
//         <Loader2 className="w-12 h-12 animate-spin mb-4" />
//         <p className="font-medium">Đang tải danh mục bất động sản...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6 relative h-full flex flex-col">
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-900">Danh mục Dự án</h2>
//           <p className="text-gray-500">Tìm kiếm dự án theo tỉnh thành và nhà đầu tư.</p>
//         </div>
//         <div className="flex gap-2">
//           <button 
//             onClick={() => loadProjects(true)} 
//             disabled={refreshing}
//             className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
//           >
//             {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />} 
//             Làm mới AI
//           </button>
//           <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-md">
//             <Plus className="w-5 h-5" /> Thêm Dự án
//           </button>
//         </div>
//       </div>

//       {/* Filter Bar */}
//       <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//           {/* Search */}
//           <div className="relative lg:col-span-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <input 
//               type="text"
//               value={searchQuery}
//               onChange={(e) => { setSearchQuery(e.target.value); setCurrentProjectPage(1); }}
//               placeholder="Tên dự án, địa chỉ..."
//               className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
//             />
//           </div>

//           {/* Investor */}
//           <div className="relative">
//             <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <select 
//               value={investorFilter}
//               onChange={(e) => { setInvestorFilter(e.target.value); setCurrentProjectPage(1); }}
//               className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
//             >
//               <option value="All">Nhà đầu tư: Tất cả</option>
//               {investors.filter(i => i !== 'All').map(i => <option key={i} value={i}>{i}</option>)}
//             </select>
//           </div>

//           {/* Province Filter */}
//           <div className="relative">
//             <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <select 
//               value={provinceFilter}
//               onChange={(e) => { setProvinceFilter(e.target.value); setCurrentProjectPage(1); }}
//               className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
//             >
//               <option value="All">Tỉnh thành: Tất cả</option>
//               {provinces.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
//             </select>
//           </div>

//           {/* Project Type */}
//           <div className="relative">
//             <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <select 
//               value={typeFilter}
//               onChange={(e) => { setTypeFilter(e.target.value); setCurrentProjectPage(1); }}
//               className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
//             >
//               <option value="All">Loại hình: Tất cả</option>
//               <option value="Căn hộ">Căn hộ</option>
//               <option value="Đất nền">Đất nền</option>
//               <option value="Nhà phố">Nhà phố</option>
//             </select>
//           </div>

//           {/* Status */}
//           <div className="relative">
//             <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <select 
//               value={statusFilter}
//               onChange={(e) => { setStatusFilter(e.target.value); setCurrentProjectPage(1); }}
//               className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
//             >
//               <option value="All">Trạng thái: Tất cả</option>
//               <option value="Selling">Đang mở bán</option>
//               <option value="Planning">Sắp ra mắt</option>
//               <option value="Sold Out">Hết hàng</option>
//             </select>
//           </div>
//         </div>

//         {/* Clear Filters */}
//         {(searchQuery || investorFilter !== 'All' || provinceFilter !== 'All' || typeFilter !== 'All' || statusFilter !== 'All') && (
//           <div className="flex justify-end">
//             <button 
//               onClick={resetFilters}
//               className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-tight"
//             >
//               <X className="w-3.5 h-3.5" /> Xóa tất cả bộ lọc
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Grid Results */}
//       {currentProjects.length > 0 ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
//           {currentProjects.map((project) => (
//             <div 
//               key={project.id} 
//               onClick={() => handleProjectClick(project.id)}
//               className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
//             >
//               <div className="relative h-48 overflow-hidden">
//                 <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
//                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                
//                 <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
//                   <span className={`text-white text-[9px] font-black px-2 py-1 rounded-md shadow-lg uppercase border backdrop-blur-md w-fit ${
//                     project.status === 'Selling' ? 'bg-green-600/80 border-green-400/50' : 
//                     project.status === 'Sold Out' ? 'bg-red-600/80 border-red-400/50' : 
//                     'bg-indigo-600/80 border-indigo-400/50'
//                   }`}>
//                     {project.status === 'Selling' ? 'Đang mở bán' : project.status === 'Sold Out' ? 'Hết hàng' : 'Sắp ra mắt'}
//                   </span>
//                 </div>

//                 <div className="absolute bottom-4 left-4 right-4">
//                   <h3 className="text-xl font-black text-white leading-tight drop-shadow-md line-clamp-2">{project.name}</h3>
//                 </div>
//               </div>
//               <div className="p-5 flex-1 flex flex-col">
//                 <div className="flex items-center gap-2 text-gray-400 mb-2">
//                   <Building className="w-3.5 h-3.5" />
//                   <span className="text-[10px] font-black uppercase tracking-widest">{project.investor}</span>
//                 </div>
//                 <div className="flex items-center gap-2 text-gray-500 mb-4">
//                   <MapPin className="w-4 h-4 text-indigo-500" />
//                   <span className="text-sm truncate font-medium">{project.location}, {project.province}</span>
//                 </div>
//                 <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
//                   <span className="text-sm font-black text-indigo-600 tracking-tight">{project.priceRange}</span>
//                   <div className="flex flex-col items-end">
//                     <span className="text-[9px] font-black text-gray-400 uppercase">{project.projectType}</span>
//                     <div className="flex items-center gap-1.5 text-[10px] text-indigo-400 font-black">
//                       <LayoutGrid className="w-3 h-3" /> {project.products.length} SP
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
//           <Filter className="w-12 h-12 text-gray-200 mb-4" />
//           <h3 className="text-lg font-bold text-gray-900">Không tìm thấy kết quả</h3>
//           <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
//           <button onClick={resetFilters} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
//             Xem tất cả dự án
//           </button>
//         </div>
//       )}

//       {filteredProjects.length > 0 && (
//         <Pagination 
//           currentPage={currentProjectPage} 
//           totalPages={totalProjectPages} 
//           onPageChange={setCurrentProjectPage} 
//           totalItems={filteredProjects.length}
//           itemsPerPage={PROJECTS_PER_PAGE}
//         />
//       )}
//     </div>
//   );
// };

// export default Projects;
