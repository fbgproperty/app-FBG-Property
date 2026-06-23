// =========== DANH SÁCH DỰ ÁN (map theo RaiProject DTO mới) ===========
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../../../components/Pagination';
import { api } from '../../../services/apiService';
import {
  Plus, MapPin, Loader2, RefreshCcw,
  LayoutGrid, Search, Filter, X, Building, Layers, Activity, CloudDownload
} from 'lucide-react';

const PROJECTS_PER_PAGE = 6;

// ====== Backend DTO (ProjectDetailDto mới theo RaiProject) ======
type ApiProjectItem = {
  id: string; // Guid
  source: string;
  externalId: number;

  slug?: string | null;
  url?: string | null;

  name: string;
  description?: string | null;
  location?: string | null;

  statusValue?: string | null;
  statusLabel?: string | null;

  isFeatured: boolean;

  priceFrom?: number | null;
  priceTo?: number | null;

  currencyId?: number | null;
  currencyTitle?: string | null;
  currencySymbol?: string | null;

  cityId?: number | null;
  stateId?: number | null;
  countryId?: number | null;
  countryName?: string | null;

  latitude?: string | null;
  longitude?: string | null;

  imagesJson?: string | null;

  sourceCreatedAt?: string | null; // DateTimeOffset?
  sourceUpdatedAt?: string | null; // DateTimeOffset?
  syncedAt: string; // DateTimeOffset (not null)
};

type ApiPagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

// ====== UI Model (giữ UI cũ, map từ RaiProject) ======
type UiProject = {
  id: string;
  name: string;
  location: string;
  province: string;   // map từ countryName (tạm)
  investor: string;   // map từ source (tạm)
  status: string;     // normalized từ statusValue/statusLabel
  imageUrl: string;
  priceRange: string;
  projectType: string; // không có => ""
  productCount: number; // list không có => 0
};

// ---------- helpers ----------
const FALLBACK_IMAGE = 'https://placehold.co/800x600?text=No+Image';

function tryGetFirstImage(imagesJson?: string | null): string {
  if (!imagesJson) return FALLBACK_IMAGE;

  try {
    const parsed = JSON.parse(imagesJson);

    // case: ["url1","url2"]
    if (Array.isArray(parsed)) {
      const first = parsed.find((x) => typeof x === 'string' && x.trim() !== '');
      return first || FALLBACK_IMAGE;
    }

    // case: { images: ["url1"] }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.images)) {
      const first = parsed.images.find((x: any) => typeof x === 'string' && x.trim() !== '');
      return first || FALLBACK_IMAGE;
    }
  } catch {
    // ignore parse errors
  }

  return FALLBACK_IMAGE;
}

function buildPriceRange(from?: number | null, to?: number | null, symbol?: string | null): string {
  const s = (symbol || '').trim();
  if (from == null && to == null) return '';
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  if (from != null && to != null) return `${fmt(from)} – ${fmt(to)}${s ? ` ${s}` : ''}`;
  if (from != null) return `Từ ${fmt(from)}${s ? ` ${s}` : ''}`;
  return `Đến ${fmt(to as number)}${s ? ` ${s}` : ''}`;
}

// Normalize status để UI tô màu như trước
function normalizeStatus(status: string) {
  const s = (status || '').trim().toLowerCase();
  if (s === 'selling' || s.includes('sell') || s.includes('mở bán')) return 'Selling';
  if (s === 'planning' || s.includes('plan') || s.includes('ra mắt')) return 'Planning';
  if (s === 'sold out' || s === 'soldout' || s.includes('sold') || s.includes('hết')) return 'Sold Out';
  return status;
}

function mapApiToUi(p: ApiProjectItem): UiProject {
  const statusRaw = (p.statusValue || p.statusLabel || '').trim();
  return {
    id: p.id,
    name: p.name,
    location: (p.location || '').trim(),
    province: (p.countryName || '').trim(),        // tạm map Province <- CountryName
    investor: (p.source || '').trim(),             // tạm map Investor <- Source
    status: normalizeStatus(statusRaw),
    imageUrl: tryGetFirstImage(p.imagesJson),
    priceRange: buildPriceRange(p.priceFrom, p.priceTo, p.currencySymbol),
    projectType: '',                               // RaiProject không có
    productCount: 0,                               // list endpoint không có
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

  // Các filter UI cũ (investor/province/type) vẫn giữ để không phải sửa layout:
  // investor -> source, province -> countryName, type -> không có => dropdown sẽ rỗng và luôn match
  const [investorFilter, setInvestorFilter] = useState('All');
  const [provinceFilter, setProvinceFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [syncing, setSyncing] = useState(false);

  const syncRaiProjects = async () => {
    try {
      setSyncing(true);
  
      await api.request<void>(`/sync/rai/projects`, { method: 'POST' });
  
      // Sync xong reload lại list
      await loadProjects(true);
    } finally {
      setSyncing(false);
    }
  };
  

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

      // Backend hỗ trợ: status (statusValue), q, page, pageSize
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

  // Dropdown options (investor -> source)
  const investors = useMemo(() => {
    const set = new Set(projects.map(p => p.investor).filter(Boolean));
    return ['All', ...Array.from(set)].sort();
  }, [projects]);

  // Province -> countryName
  const provinces = useMemo(() => {
    const set = new Set(projects.map(p => p.province).filter(Boolean));
    return ['All', ...Array.from(set)].sort();
  }, [projects]);

  // ProjectType không có => dropdown sẽ chỉ All
  const projectTypes = useMemo(() => {
    return ['All'];
  }, []);

  // Client-side filter bổ sung (source/countryName)
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchInvestor = investorFilter === 'All' || p.investor === investorFilter;
      const matchProvince = provinceFilter === 'All' || p.province === provinceFilter;

      // typeFilter không còn data => luôn true (tránh làm rỗng list)
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
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-bold shadow-md">
            <Plus className="w-5 h-5" /> Thêm dự án
        </button>
        <button
            onClick={syncRaiProjects}
            disabled={syncing || refreshing}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-black shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
            Đồng bộ dữ liệu
        </button>
          <button
            onClick={() => loadProjects(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
            Làm mới
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
              placeholder="Tên dự án, địa chỉ, slug, url..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>

          {/* Investor (client filter) => Source */}
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={investorFilter}
              onChange={(e) => { setInvestorFilter(e.target.value); setCurrentProjectPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All">Nguồn: Tất cả</option>
              {investors.filter(x => x !== 'All').map(x => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          {/* Province (client filter) => CountryName */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={provinceFilter}
              onChange={(e) => { setProvinceFilter(e.target.value); setCurrentProjectPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All">Quốc gia: Tất cả</option>
              {provinces.filter(x => x !== 'All').map(x => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          {/* Project Type (không có trong RaiProject) */}
          <div className="relative">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentProjectPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All">Loại hình: (chưa có dữ liệu)</option>
              {projectTypes.filter(x => x !== 'All').map(x => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          {/* Status (server statusValue) */}
          <div className="relative">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentProjectPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="All">Trạng thái: Tất cả</option>
              {/* Các value này phải khớp StatusValue thực tế trong DB */}
              <option value="Selling">Đang bán</option>
              <option value="Planning">Chuẩn bị mở bán</option>
              <option value="Sold Out">Đã bán</option>
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
                  src={project.imageUrl || FALLBACK_IMAGE}
                  alt={project.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                  <span className={`text-white text-[9px] font-black px-2 py-1 rounded-md shadow-lg uppercase border backdrop-blur-md w-fit ${
                    project.status === 'Selling' ? 'bg-green-600/80 border-green-400/50' :
                    project.status === 'Sold Out' ? 'bg-red-600/80 border-red-400/50' :
                    'bg-indigo-600/80 border-indigo-400/50'
                  }`}>
                    {project.status === 'Selling' ? 'Đang bán' : project.status === 'pre_sale' ? 'Chuẩn bị mở bán' : 'Đã bán'}
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
                    {project.investor || '—'} {/* source */}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-500 mb-4">
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm truncate font-medium">
                    {project.location}{project.province ? `, ${project.province}` : ''}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                  <span className="text-sm font-black text-indigo-600 tracking-tight">
                    {project.priceRange || '—'}
                  </span>

                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-gray-400 uppercase">
                      {project.projectType || '—'}
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
