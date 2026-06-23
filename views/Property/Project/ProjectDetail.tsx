import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Pagination from '../../../components/Pagination';
import { api } from '../../../services/apiService';
import {
  ArrowLeft, MapPin, Bot, Loader2, Info, LayoutGrid, FileText,
  CheckCircle2, XCircle, Zap, Map as MapIcon, Image as ImageIcon
} from 'lucide-react';
import { formatDateTime } from '../../../components/utils/formatDate';

const PROPERTIES_PER_PAGE = 8;

/** =======================
 * Backend DTOs
 * ======================= */
type ApiRaiProject = {
  id: string;
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
  currencySymbol?: string | null;

  countryName?: string | null;
  latitude?: string | null;
  longitude?: string | null;

  imagesJson?: string | null;

  sourceCreatedAt?: string | null;
  sourceUpdatedAt?: string | null;
  syncedAt: string;

  // ✅ nếu backend embed trực tiếp Properties vào project
  properties?: ApiRaiProperty[];
  // (PascalCase fallback)
  Properties?: ApiRaiProperty[];
};

type ApiRaiProperty = {
  id: string;
  source: string;
  externalId: number;

  projectExternalId?: number | null;
  projectId?: string | null;

  name: string;
  description?: string | null;
  location?: string | null;

  imagesJson?: string | null;

  typeValue?: string | null;
  typeLabel?: string | null;

  statusValue?: string | null;
  statusLabel?: string | null;

  isFeatured: boolean;

  numberBedroom?: number | null;
  numberBathroom?: number | null;
  numberFloor?: number | null;

  square?: number | null;

  price?: number | null;
  priceFormatted?: string | null;
  currencySymbol?: string | null;

  periodValue?: string | null;
  periodLabel?: string | null;

  cityId?: number | null;
  cityName?: string | null;
  stateId?: number | null;
  stateName?: string | null;
  countryId?: number | null;
  countryName?: string | null;

  latitude?: string | null;
  longitude?: string | null;
  zipCode?: string | null;

  uniqueId?: string | null;

  url?: string | null;
  slug?: string | null;

  sourceCreatedAt?: string | null;
  sourceUpdatedAt?: string | null;
  syncedAt: string;
};

// ✅ response có thể là:
// 1) { project: {...}, properties: [...] } (camelCase)
// 2) { project: {...}, Properties: [...] } (PascalCase)
// 3) { project: {..., properties: [...] } } (embed trong project)
// 4) trả thẳng project {..., properties: [...] }
type ApiProjectDetailResponseAny =
  | { project: ApiRaiProject; properties?: ApiRaiProperty[]; Properties?: ApiRaiProperty[] }
  | ApiRaiProject;

/** =======================
 * UI Models (chỉ dùng properties)
 * ======================= */
type UiProperty = {
  id: string;
  code: string; // externalId
  name: string;

  type: string;
  status: 'Còn hàng' | 'Hết hàng' | string;

  square: string;
  bedrooms: string;
  bathrooms: string;
  floors: string;

  areaText: string; // tổng hợp hiển thị
  subdivision: string; // city/state/country
  location: string;

  price: string;
  period: string;

  imageUrl: string;

  updatedAt: string; // sourceUpdatedAt/syncedAt
  url?: string | null;
};

type UiProjectDetail = {
  id: string;
  code: string; // externalId
  name: string;

  location: string;
  province: string;
  status: string;
  description: string;

  investor: string; // source
  projectType: string;
  imageUrl: string;
  priceRange: string;

  units: number;
  propertyCount: number;

  aiAnalysis?: string | null;
  properties: UiProperty[];
  documents: any[]; // backend chưa có
};

/** =======================
 * Helpers
 * ======================= */
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
    if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).images)) {
      const first = (parsed as any).images.find((x: any) => typeof x === 'string' && x.trim() !== '');
      return first || FALLBACK_IMAGE;
    }
  } catch {
    // ignore
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

function normalizeProjectStatus(status: string) {
  const s = (status || '').trim().toLowerCase();
  if (s === 'selling' || s.includes('sell') || s.includes('mở bán')) return 'Selling';
  if (s === 'planning' || s.includes('plan') || s.includes('ra mắt')) return 'Planning';
  if (s === 'sold out' || s === 'soldout' || s.includes('sold') || s.includes('hết')) return 'Sold Out';
  return status;
}

function normalizePropertyStatus(raw: string) {
  const s = (raw || '').trim().toLowerCase();
  if (s.includes('available') || s.includes('còn') || s.includes('open') || s.includes('selling')) return 'Còn hàng';
  if (s.includes('sold') || s.includes('hết') || s.includes('closed') || s.includes('unavailable')) return 'Hết hàng';
  return raw;
}

function formatPriceFromProperty(p: ApiRaiProperty): string {
  if (p.priceFormatted && p.priceFormatted.trim()) return p.priceFormatted.trim();
  if (p.price == null) return '';
  const s = (p.currencySymbol || '').trim();
  return `${new Intl.NumberFormat('vi-VN').format(p.price)}${s ? ` ${s}` : ''}`;
}

function mapPropertyToUi(p: ApiRaiProperty): UiProperty {
  const statusRaw = (p.statusLabel || p.statusValue || '').trim();

  const subdivision =
    (p.cityName || '').trim() ||
    (p.stateName || '').trim() ||
    (p.countryName || '').trim() ||
    '';

  const square = p.square != null ? String(p.square) : '';
  const bedrooms = p.numberBedroom != null ? String(p.numberBedroom) : '';
  const bathrooms = p.numberBathroom != null ? String(p.numberBathroom) : '';
  const floors = p.numberFloor != null ? String(p.numberFloor) : '';

  const areaText = [
    square ? `${square} m²` : '',
    bedrooms ? `${bedrooms} PN` : '',
    bathrooms ? `${bathrooms} VS` : '',
    floors ? `${floors} tầng` : ''
  ].filter(Boolean).join(' • ') || '—';

  const period = (p.periodLabel || p.periodValue || '').trim();

  const updatedAt = (p.sourceUpdatedAt || p.sourceCreatedAt || p.syncedAt || '').toString();

  return {
    id: p.id,
    code: String(p.externalId),
    name: (p.name || '').trim(),

    type: (p.typeLabel || p.typeValue || '').trim(),
    status: normalizePropertyStatus(statusRaw),

    square,
    bedrooms,
    bathrooms,
    floors,

    areaText,
    subdivision,
    location: (p.location || '').trim(),

    price: formatPriceFromProperty(p),
    period,

    imageUrl: tryGetFirstImage(p.imagesJson),

    updatedAt,
    url: p.url ?? null,
  };
}

function mapApiToUi(projectApi: ApiRaiProject, propertiesApi: ApiRaiProperty[]): UiProjectDetail {
  const statusRaw = (projectApi.statusValue || projectApi.statusLabel || '').trim();

  const properties = (propertiesApi ?? []).map(mapPropertyToUi);

  return {
    id: projectApi.id,
    code: String(projectApi.externalId),
    name: projectApi.name,

    location: (projectApi.location || '').trim(),
    province: (projectApi.countryName || '').trim(),
    status: normalizeProjectStatus(statusRaw),
    description: projectApi.description ?? '',

    investor: (projectApi.source || '').trim(),
    projectType: '',

    imageUrl: tryGetFirstImage(projectApi.imagesJson),
    priceRange: buildPriceRange(projectApi.priceFrom, projectApi.priceTo, projectApi.currencySymbol),

    propertyCount: properties.length,
    units: properties.length,

    aiAnalysis: null,
    properties,
    documents: [],
  };
}

/** =======================
 * Component
 * ======================= */
const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<UiProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'inventory' | 'docs' | 'map'>('info');

  // Inventory states
  const [currentPropertyPage, setCurrentPropertyPage] = useState(1);
  const [propertyFilter, setPropertyFilter] = useState<string>('All');

  const filteredProperties = useMemo(() => {
    const list = project?.properties ?? [];
    if (propertyFilter === 'All') return list;
    return list.filter(p => p.status === propertyFilter);
  }, [project?.properties, propertyFilter]);

  const totalPropertyPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProperties.length / PROPERTIES_PER_PAGE));
  }, [filteredProperties.length]);

  const safePage = useMemo(() => {
    return Math.min(currentPropertyPage, totalPropertyPages);
  }, [currentPropertyPage, totalPropertyPages]);

  const currentProperties = useMemo(() => {
    return filteredProperties.slice(
      (safePage - 1) * PROPERTIES_PER_PAGE,
      safePage * PROPERTIES_PER_PAGE
    );
  }, [filteredProperties, safePage]);

  // Load project detail từ backend (ONLY properties)
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        // ✅ backend mới: GET /projects/{id}
        const raw = await api.request<ApiProjectDetailResponseAny>(
          `/projects/${encodeURIComponent(id)}`,
          { method: 'GET' }
        );

        if (!alive) return;

        const anyRaw: any = raw as any;

        // 1) project object
        const projectApi: ApiRaiProject = (anyRaw?.project ?? anyRaw) as ApiRaiProject;

        // 2) properties list: ưu tiên top-level -> embed trong project -> PascalCase
        const propertiesApi: ApiRaiProperty[] =
          (anyRaw?.properties ??
            anyRaw?.Properties ??
            projectApi?.properties ??
            (projectApi as any)?.Properties ??
            []) as ApiRaiProperty[];

        setProject(mapApiToUi(projectApi, propertiesApi));

        setCurrentPropertyPage(1);
        setPropertyFilter('All');
      } catch (e: any) {
        if (!alive) return;
        setProject(null);
        setError(e?.message || 'Không thể tải chi tiết dự án.');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    };

    run();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium">Đang tải chi tiết dự án...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-2">{error ?? 'Không tìm thấy dự án yêu cầu.'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="text-indigo-600 font-bold hover:underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const handleAnalyze = async () => {
    alert('Chưa có API AI Analysis dưới backend.');
  };

  const mapQuery = encodeURIComponent(`${project.name} ${project.location} ${project.province}`);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border-2 border-white">
            <img
              src={project.imageUrl || FALLBACK_IMAGE}
              alt={project.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-gray-900 leading-none">{project.name}</h2>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                project.status === 'Selling' ? 'bg-green-50 text-green-700 border-green-200' :
                project.status === 'Sold Out' ? 'bg-red-50 text-red-700 border-red-200' :
                'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {project.status === 'Selling' ? 'Đang mở bán' : project.status === 'Sold Out' ? 'Hết hàng' : 'Sắp ra mắt'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2 text-gray-500 font-medium text-sm">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <span>
                {project.location}{project.province ? `, ${project.province}` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
            <Bot className="w-4 h-4" /> AI Sales Agent
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-fit overflow-x-auto">
        {[
          { id: 'info', label: 'Thông tin chung', icon: Info },
          { id: 'inventory', label: 'Danh sách Nhà/căn hộ', icon: LayoutGrid },
          { id: 'docs', label: 'Tài liệu & Pháp lý', icon: FileText },
          { id: 'map', label: 'Vị trí', icon: MapIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
        {/* ===== INFO TAB ===== */}
        {activeTab === 'info' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5 text-indigo-600" /> Mô tả dự án
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-lg">{project.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Quy mô sản phẩm</p>
                    <p className="text-2xl font-black text-indigo-900">{project.units} SP</p>
                  </div>

                  <div className="p-6 bg-green-50/50 rounded-2xl border border-green-100">
                    <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Tầm giá thị trường</p>
                    <p className="text-2xl font-black text-green-900">{project.priceRange || '—'}</p>
                  </div>

                  <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-400" />
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Vị trí dự án</p>
                    </div>
                    <p className="text-sm font-black text-orange-900 line-clamp-2">
                      {project.location}{project.province ? `, ${project.province}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-900 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
                  <Bot className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Bot className="w-5 h-5 text-indigo-400" />
                      <h4 className="font-black text-sm uppercase tracking-widest">Phân tích AI Pro</h4>
                    </div>

                    {project.aiAnalysis ? (
                      <p className="text-sm text-indigo-100 italic leading-relaxed whitespace-pre-line">{project.aiAnalysis}</p>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-xs text-indigo-300 mb-4 font-medium italic">
                          Chưa có phân tích chiến lược cho dự án này.
                        </p>
                        <button
                          onClick={handleAnalyze}
                          className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4" />
                          Kích hoạt Phân tích
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Thông tin bổ sung</p>
                  <div className="space-y-2 text-sm text-gray-600 font-medium">
                    <div><span className="font-black text-gray-700">Nguồn (Source):</span> {project.investor || '—'}</div>
                    <div><span className="font-black text-gray-700">Loại hình:</span> {project.projectType || '—'}</div>
                    <div><span className="font-black text-gray-700">Số căn:</span> {project.propertyCount}</div>
                    <div><span className="font-black text-gray-700">Cập nhật:</span> {formatDateTime(new Date().toISOString())}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== INVENTORY TAB (Properties) ===== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <h4 className="text-lg font-black text-gray-900">Danh sách Nhà/Căn hộ</h4>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {['All', 'Còn hàng', 'Hết hàng'].map(status => (
                    <button
                      key={status}
                      onClick={() => { setPropertyFilter(status); setCurrentPropertyPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                        propertyFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {status === 'All' ? 'Tất cả' : status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Tổng: {filteredProperties.length} căn
              </div>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                    <th className="px-6 py-5">Ảnh</th>
                    <th className="px-6 py-5">Mã</th>
                    <th className="px-6 py-5">Tên</th>
                    <th className="px-6 py-5">Khu vực</th>
                    <th className="px-6 py-5">Loại</th>
                    <th className="px-6 py-5">Thông số</th>
                    <th className="px-6 py-5">Giá</th>
                    <th className="px-6 py-5 text-center">Trạng thái</th>
                    <th className="px-6 py-5">Cập nhật</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentProperties.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-14 h-10 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                          {p.imageUrl && p.imageUrl !== FALLBACK_IMAGE ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
                            />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5 font-black text-gray-900 text-sm">{p.code}</td>

                      <td className="px-6 py-5">
                        <div className="font-black text-gray-900 text-sm line-clamp-1">{p.name || '—'}</div>
                        <div className="text-[11px] text-gray-500 font-medium line-clamp-1">
                          {p.location || '—'}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="px-2 py-1 bg-gray-100 rounded text-[9px] font-black text-gray-600 border border-gray-200">
                          {p.subdivision || '—'}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-xs font-bold text-gray-500">{p.type || '—'}</td>

                      <td className="px-6 py-5 text-xs text-gray-600 font-bold">
                        {p.areaText}
                      </td>

                      <td className="px-6 py-5">
                        <div className="font-black text-indigo-600 text-sm">
                          {p.price || '—'}
                        </div>
                        {!!p.period && (
                          <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                            {p.period}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                            p.status === 'Còn hàng' ? 'bg-green-50 text-green-700 border-green-200' :
                            p.status === 'Hết hàng' ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {p.status === 'Còn hàng' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {p.status || '—'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-xs text-gray-500 font-medium">
                        {p.updatedAt ? formatDateTime(p.updatedAt) : '—'}
                      </td>
                    </tr>
                  ))}

                  {currentProperties.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-10 text-center text-gray-400 font-bold">
                        Không có dữ liệu nhà/căn hộ (properties)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={safePage}
              totalPages={totalPropertyPages}
              onPageChange={setCurrentPropertyPage}
              totalItems={filteredProperties.length}
              itemsPerPage={PROPERTIES_PER_PAGE}
            />
          </div>
        )}

        {/* ===== DOCS TAB ===== */}
        {activeTab === 'docs' && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <h4 className="text-lg font-black text-gray-900 mb-4">Tài liệu & Pháp lý</h4>

            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-500 font-bold">
              Backend hiện tại chưa trả về Documents. (documents = [])
            </div>
          </div>
        )}

        {/* ===== MAP TAB ===== */}
        {activeTab === 'map' && (
          <div className="h-full space-y-6 animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-black text-gray-900">Vị trí dự án trên Google Maps</h4>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <MapPin className="w-4 h-4 text-indigo-500" />
                {project.location}{project.province ? `, ${project.province}` : ''}
              </div>
            </div>

            <div className="flex-1 w-full min-h-[500px] rounded-3xl overflow-hidden shadow-inner border border-gray-100 bg-gray-50">
              <iframe
                title="Google Maps Location"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '500px' }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>

            <p className="text-xs text-gray-400 font-medium italic text-center uppercase tracking-widest">
              Dữ liệu bản đồ được cung cấp bởi Google Maps Platform
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;


// import React, { useEffect, useMemo, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import Pagination from '../../../components/Pagination';
// import { api } from '../../../services/apiService';
// import {
//   ArrowLeft, MapPin, Bot, Loader2, Info, LayoutGrid, FileText,
//   CheckCircle2, XCircle, Edit2, Trash2, PlusCircle,
//   Zap, Map as MapIcon
// } from 'lucide-react';
// import { formatDateTime } from '../../../components/utils/formatDate';

// const PRODUCTS_PER_PAGE = 8;

// /** =======================
//  * Backend DTOs (NEW)
//  * ======================= */
// type ApiRaiProject = {
//   id: string;
//   source: string;
//   externalId: number;

//   slug?: string | null;
//   url?: string | null;

//   name: string;
//   description?: string | null;
//   location?: string | null;

//   statusValue?: string | null;
//   statusLabel?: string | null;

//   isFeatured: boolean;

//   priceFrom?: number | null;
//   priceTo?: number | null;
//   currencySymbol?: string | null;

//   countryName?: string | null;
//   latitude?: string | null;
//   longitude?: string | null;

//   imagesJson?: string | null;

//   sourceCreatedAt?: string | null;
//   sourceUpdatedAt?: string | null;
//   syncedAt: string;
// };

// type ApiRaiProperty = {
//   id: string;
//   source: string;
//   externalId: number;

//   projectExternalId?: number | null;
//   projectId?: string | null;

//   name: string;
//   description?: string | null;
//   location?: string | null;

//   imagesJson?: string | null;

//   typeValue?: string | null;
//   typeLabel?: string | null;

//   statusValue?: string | null;
//   statusLabel?: string | null;

//   isFeatured: boolean;

//   numberBedroom?: number | null;
//   numberBathroom?: number | null;
//   numberFloor?: number | null;

//   square?: number | null;

//   price?: number | null;
//   priceFormatted?: string | null;
//   currencySymbol?: string | null;

//   periodValue?: string | null;
//   periodLabel?: string | null;

//   cityName?: string | null;
//   stateName?: string | null;
//   countryName?: string | null;

//   url?: string | null;
//   slug?: string | null;

//   sourceCreatedAt?: string | null;
//   sourceUpdatedAt?: string | null;
//   syncedAt: string;
// };

// type ApiProjectDetailResponse = {
//   project: ApiRaiProject;
//   products: ApiRaiProperty[];
// };

// /** =======================
//  * UI Models (giữ UI cũ)
//  * ======================= */

// type ProjectDocument = {
//   id: string;
//   name: string;
//   url: string;
//   accessLevel?: 'public' | 'internal' | 'restricted';
//   createdAt: string;
// };

// type ProjectProduct = {
//   id: string;
//   code: string;              // map from externalId
//   subdivision: string;       // không có => map tạm từ cityName/stateName/...
//   type: string;              // typeLabel/typeValue
//   landArea: string;          // map from square
//   constructionArea: string;  // không có => ""
//   direction: string;         // không có => ""
//   price: string;             // priceFormatted hoặc format price
//   status: 'Còn hàng' | 'Hết hàng' | string; // normalize từ statusValue/statusLabel
// };

// type UiProjectDetail = {
//   id: string;
//   code: string;        // map from externalId
//   name: string;

//   location: string;
//   province: string;    // map from countryName
//   status: string;
//   description: string;

//   investor: string;    // map from source
//   projectType: string; // không có => ""
//   imageUrl: string;
//   priceRange: string;

//   units: number;       // map from products.length
//   productCount: number;

//   aiAnalysis?: string | null; // chưa có => null
//   products: ProjectProduct[];
//   documents: ProjectDocument[]; // backend mới chưa có => []
// };

// /** =======================
//  * Helpers
//  * ======================= */
// const FALLBACK_IMAGE = 'https://placehold.co/800x600?text=No+Image';

// function tryGetFirstImage(imagesJson?: string | null): string {
//   if (!imagesJson) return FALLBACK_IMAGE;

//   try {
//     const parsed = JSON.parse(imagesJson);

//     // case: ["url1","url2"]
//     if (Array.isArray(parsed)) {
//       const first = parsed.find((x) => typeof x === 'string' && x.trim() !== '');
//       return first || FALLBACK_IMAGE;
//     }

//     // case: { images: ["url1"] }
//     if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).images)) {
//       const first = (parsed as any).images.find((x: any) => typeof x === 'string' && x.trim() !== '');
//       return first || FALLBACK_IMAGE;
//     }
//   } catch {
//     // ignore parse errors
//   }
//   return FALLBACK_IMAGE;
// }

// function buildPriceRange(from?: number | null, to?: number | null, symbol?: string | null): string {
//   const s = (symbol || '').trim();
//   if (from == null && to == null) return '';
//   const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

//   if (from != null && to != null) return `${fmt(from)} – ${fmt(to)}${s ? ` ${s}` : ''}`;
//   if (from != null) return `Từ ${fmt(from)}${s ? ` ${s}` : ''}`;
//   return `Đến ${fmt(to as number)}${s ? ` ${s}` : ''}`;
// }

// function normalizeProjectStatus(status: string) {
//   const s = (status || '').trim().toLowerCase();
//   if (s === 'selling' || s.includes('sell') || s.includes('mở bán')) return 'Selling';
//   if (s === 'planning' || s.includes('plan') || s.includes('ra mắt')) return 'Planning';
//   if (s === 'sold out' || s === 'soldout' || s.includes('sold') || s.includes('hết')) return 'Sold Out';
//   return status;
// }

// function normalizeProductStatus(raw: string) {
//   const s = (raw || '').trim().toLowerCase();

//   // tùy data bạn sync về, bạn có thể tinh chỉnh thêm
//   if (s.includes('available') || s.includes('còn') || s.includes('open') || s.includes('selling')) return 'Còn hàng';
//   if (s.includes('sold') || s.includes('hết') || s.includes('closed') || s.includes('unavailable')) return 'Hết hàng';
//   return raw;
// }

// function formatPriceFromProperty(p: ApiRaiProperty): string {
//   if (p.priceFormatted && p.priceFormatted.trim()) return p.priceFormatted.trim();
//   if (p.price == null) return '';
//   const s = (p.currencySymbol || '').trim();
//   return `${new Intl.NumberFormat('vi-VN').format(p.price)}${s ? ` ${s}` : ''}`;
// }

// function mapPropertyToUi(p: ApiRaiProperty): ProjectProduct {
//   const statusRaw = (p.statusLabel || p.statusValue || '').trim();

//   // subdivision không có; map tạm để UI không trống
//   const subdivision =
//     (p.cityName || '').trim() ||
//     (p.stateName || '').trim() ||
//     (p.countryName || '').trim() ||
//     '';

//   return {
//     id: p.id,
//     code: String(p.externalId),
//     subdivision,
//     type: (p.typeLabel || p.typeValue || '').trim(),
//     landArea: p.square != null ? String(p.square) : '',
//     constructionArea: '',
//     direction: '',
//     price: formatPriceFromProperty(p),
//     status: normalizeProductStatus(statusRaw),
//   };
// }

// function mapApiToUi(res: ApiProjectDetailResponse): UiProjectDetail {
//   const p = res.project;
//   const products = (res.products ?? []).map(mapPropertyToUi);

//   const statusRaw = (p.statusValue || p.statusLabel || '').trim();

//   return {
//     id: p.id,
//     code: String(p.externalId),
//     name: p.name,

//     location: (p.location || '').trim(),
//     province: (p.countryName || '').trim(),
//     status: normalizeProjectStatus(statusRaw),
//     description: p.description ?? '',

//     investor: (p.source || '').trim(),
//     projectType: '',

//     imageUrl: tryGetFirstImage(p.imagesJson),
//     priceRange: buildPriceRange(p.priceFrom, p.priceTo, p.currencySymbol),

//     productCount: products.length,
//     units: products.length,

//     aiAnalysis: null,
//     products,
//     documents: [], // backend mới chưa có
//   };
// }

// const ProjectDetail: React.FC = () => {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();

//   const [project, setProject] = useState<UiProjectDetail | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const [activeTab, setActiveTab] = useState<'info' | 'inventory' | 'docs' | 'map'>('info');

//   // Inventory states (local demo)
//   const [currentProductPage, setCurrentProductPage] = useState(1);
//   const [productFilter, setProductFilter] = useState<string>('All');
//   const [isProductFormOpen, setIsProductFormOpen] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Partial<ProjectProduct> | null>(null);

//   const filteredProducts = useMemo(() => {
//     const list = project?.products ?? [];
//     if (productFilter === 'All') return list;
//     return list.filter(p => p.status === productFilter);
//   }, [project?.products, productFilter]);

//   const totalProductPages = useMemo(() => {
//     return Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
//   }, [filteredProducts.length]);

//   const safePage = useMemo(() => {
//     return Math.min(currentProductPage, totalProductPages);
//   }, [currentProductPage, totalProductPages]);

//   const currentProducts = useMemo(() => {
//     return filteredProducts.slice(
//       (safePage - 1) * PRODUCTS_PER_PAGE,
//       safePage * PRODUCTS_PER_PAGE
//     );
//   }, [filteredProducts, safePage]);

//   // Load project detail từ backend (NEW)
//   useEffect(() => {
//     let alive = true;

//     const run = async () => {
//       if (!id) return;

//       setLoading(true);
//       setError(null);

//       try {
//         // ✅ backend mới: GET /projects/{id} -> { project, products }
//         const res = await api.request<ApiProjectDetailResponse>(
//           `/projects/${encodeURIComponent(id)}`,
//           { method: 'GET' }
//         );

//         if (!alive) return;

//         setProject(mapApiToUi(res));

//         setCurrentProductPage(1);
//         setProductFilter('All');
//       } catch (e: any) {
//         if (!alive) return;
//         setProject(null);
//         setError(e?.message || 'Không thể tải chi tiết dự án.');
//       } finally {
//         if (!alive) return;
//         setLoading(false);
//       }
//     };

//     run();
//     return () => { alive = false; };
//   }, [id]);

//   if (loading) {
//     return (
//       <div className="h-full flex flex-col items-center justify-center text-indigo-600">
//         <Loader2 className="w-12 h-12 animate-spin mb-4" />
//         <p className="font-medium">Đang tải chi tiết dự án...</p>
//       </div>
//     );
//   }

//   if (!project) {
//     return (
//       <div className="h-full flex flex-col items-center justify-center">
//         <p className="text-gray-500 mb-2">{error ?? 'Không tìm thấy dự án yêu cầu.'}</p>
//         <button
//           onClick={() => navigate('/projects')}
//           className="text-indigo-600 font-bold hover:underline"
//         >
//           Quay lại danh sách
//         </button>
//       </div>
//     );
//   }

//   const handleAnalyze = async () => {
//     alert('Chưa có API AI Analysis dưới backend.');
//   };

//   const updateProjectProductsLocal = (newProducts: ProjectProduct[]) => {
//     setProject(prev => prev ? ({ ...prev, products: newProducts, productCount: newProducts.length, units: newProducts.length }) : prev);
//     setCurrentProductPage(1);
//   };

//   const handleOpenAddProduct = () => {
//     setEditingProduct({
//       code: '',
//       type: '',
//       landArea: '',
//       constructionArea: '',
//       direction: '',
//       subdivision: '',
//       price: '',
//       status: 'Còn hàng',
//     });
//     setIsProductFormOpen(true);
//   };

//   const handleOpenEditProduct = (p: ProjectProduct) => {
//     setEditingProduct(p);
//     setIsProductFormOpen(true);
//   };

//   const handleDeleteProduct = (productId: string) => {
//     if (!confirm('Xác nhận xóa sản phẩm này?')) return;
//     const updated = (project.products ?? []).filter(p => p.id !== productId);
//     updateProjectProductsLocal(updated);
//   };

//   const handleSaveProduct = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!editingProduct) return;

//     let updated: ProjectProduct[];
//     if (editingProduct.id) {
//       updated = (project.products ?? []).map(p => (p.id === editingProduct.id ? (editingProduct as ProjectProduct) : p));
//     } else {
//       updated = [...(project.products ?? []), { ...editingProduct, id: `S-${Date.now()}` } as ProjectProduct];
//     }

//     updateProjectProductsLocal(updated);
//     setIsProductFormOpen(false);
//   };

//   const mapQuery = encodeURIComponent(`${project.name} ${project.location} ${project.province}`);

//   return (
//     <div className="space-y-6 animate-in fade-in duration-500">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => navigate('/projects')}
//             className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 text-gray-500"
//           >
//             <ArrowLeft className="w-5 h-5" />
//           </button>

//           <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border-2 border-white">
//             <img
//               src={project.imageUrl || FALLBACK_IMAGE}
//               alt={project.name}
//               loading="lazy"
//               className="w-full h-full object-cover"
//               onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE; }}
//             />
//           </div>

//           <div>
//             <div className="flex items-center gap-2">
//               <h2 className="text-2xl font-black text-gray-900 leading-none">{project.name}</h2>
//               <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shadow-sm ${
//                 project.status === 'Selling' ? 'bg-green-50 text-green-700 border-green-200' :
//                 project.status === 'Sold Out' ? 'bg-red-50 text-red-700 border-red-200' :
//                 'bg-indigo-50 text-indigo-700 border-indigo-200'
//               }`}>
//                 {project.status === 'Selling' ? 'Đang mở bán' : project.status === 'Sold Out' ? 'Hết hàng' : 'Sắp ra mắt'}
//               </span>
//             </div>

//             <div className="flex items-center gap-2 mt-2 text-gray-500 font-medium text-sm">
//               <MapPin className="w-4 h-4 text-indigo-500" />
//               <span>
//                 {project.location}{project.province ? `, ${project.province}` : ''}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="flex gap-2">
//           <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
//             <Bot className="w-4 h-4" /> AI Sales Agent
//           </button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-gray-100 w-fit overflow-x-auto">
//         {[
//           { id: 'info', label: 'Thông tin chung', icon: Info },
//           { id: 'inventory', label: 'Danh sách Nhà/căn hộ', icon: LayoutGrid },
//           { id: 'docs', label: 'Tài liệu & Pháp lý', icon: FileText },
//           { id: 'map', label: 'Vị trí', icon: MapIcon }
//         ].map((tab) => (
//           <button
//             key={tab.id}
//             onClick={() => setActiveTab(tab.id as any)}
//             className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
//               activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
//             }`}
//           >
//             <tab.icon className="w-4 h-4" />
//             {tab.label}
//           </button>
//         ))}
//       </div>

//       {/* Content */}
//       <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
//         {/* ===== INFO TAB ===== */}
//         {activeTab === 'info' && (
//           <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//               <div className="lg:col-span-2 space-y-6">
//                 <div>
//                   <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
//                     <Info className="w-5 h-5 text-indigo-600" /> Mô tả dự án
//                   </h4>
//                   <p className="text-gray-600 leading-relaxed text-lg">{project.description}</p>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
//                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Quy mô sản phẩm</p>
//                     <p className="text-2xl font-black text-indigo-900">{project.units} SP</p>
//                   </div>

//                   <div className="p-6 bg-green-50/50 rounded-2xl border border-green-100">
//                     <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Tầm giá thị trường</p>
//                     <p className="text-2xl font-black text-green-900">{project.priceRange || '—'}</p>
//                   </div>

//                   <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100">
//                     <div className="flex items-center gap-2 mb-1">
//                       <MapPin className="w-3.5 h-3.5 text-orange-400" />
//                       <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Vị trí dự án</p>
//                     </div>
//                     <p className="text-sm font-black text-orange-900 line-clamp-2">
//                       {project.location}{project.province ? `, ${project.province}` : ''}
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-6">
//                 <div className="bg-gray-900 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden">
//                   <Bot className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
//                   <div className="relative z-10">
//                     <div className="flex items-center gap-2 mb-4">
//                       <Bot className="w-5 h-5 text-indigo-400" />
//                       <h4 className="font-black text-sm uppercase tracking-widest">Phân tích AI Pro</h4>
//                     </div>

//                     {project.aiAnalysis ? (
//                       <p className="text-sm text-indigo-100 italic leading-relaxed whitespace-pre-line">{project.aiAnalysis}</p>
//                     ) : (
//                       <div className="text-center py-8">
//                         <p className="text-xs text-indigo-300 mb-4 font-medium italic">
//                           Chưa có phân tích chiến lược cho dự án này.
//                         </p>
//                         <button
//                           onClick={handleAnalyze}
//                           className="w-full bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-xl font-black transition-all flex items-center justify-center gap-2"
//                         >
//                           <Zap className="w-4 h-4" />
//                           Kích hoạt Phân tích
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
//                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Thông tin bổ sung</p>
//                   <div className="space-y-2 text-sm text-gray-600 font-medium">
//                     <div><span className="font-black text-gray-700">Nguồn (Source):</span> {project.investor || '—'}</div>
//                     <div><span className="font-black text-gray-700">Loại hình:</span> {project.projectType || '—'}</div>
//                     <div><span className="font-black text-gray-700">Số SP:</span> {project.productCount}</div>
//                     <div><span className="font-black text-gray-700">Cập nhật:</span> {formatDateTime(new Date().toISOString())}</div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* ===== INVENTORY TAB ===== */}
//         {activeTab === 'inventory' && (
//           <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
//               <div className="flex items-center gap-4">
//                 <h4 className="text-lg font-black text-gray-900">Giỏ hàng dự án</h4>
//                 <div className="flex bg-gray-100 p-1 rounded-xl">
//                   {['All', 'Còn hàng', 'Hết hàng'].map(status => (
//                     <button
//                       key={status}
//                       onClick={() => { setProductFilter(status); setCurrentProductPage(1); }}
//                       className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
//                         productFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
//                       }`}
//                     >
//                       {status === 'All' ? 'Tất cả' : status}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Hiện tại CRUD product đang local demo (backend chưa nối) */}
//               <button
//                 onClick={handleOpenAddProduct}
//                 className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-green-700 transition-all shadow-md"
//               >
//                 <PlusCircle className="w-4 h-4" /> Thêm Sản phẩm
//               </button>
//             </div>

//             <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
//               <table className="w-full text-left">
//                 <thead className="bg-gray-50/80 border-b border-gray-100">
//                   <tr className="text-[10px] uppercase font-black tracking-widest text-gray-400">
//                     <th className="px-6 py-5">Mã SP</th>
//                     <th className="px-6 py-5">Khu vực</th>
//                     <th className="px-6 py-5">Loại hình</th>
//                     <th className="px-6 py-5">Diện tích (m2)</th>
//                     <th className="px-6 py-5">Hướng</th>
//                     <th className="px-6 py-5">Giá</th>
//                     <th className="px-6 py-5 text-center">Tình trạng</th>
//                     <th className="px-6 py-5 text-right">Thao tác</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-50">
//                   {currentProducts.map((p) => (
//                     <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
//                       <td className="px-6 py-5 font-black text-gray-900 text-sm">{p.code}</td>
//                       <td className="px-6 py-5">
//                         <span className="px-2 py-1 bg-gray-100 rounded text-[9px] font-black text-gray-600 border border-gray-200">
//                           {p.subdivision || '—'}
//                         </span>
//                       </td>
//                       <td className="px-6 py-5 text-xs font-bold text-gray-500">{p.type || '—'}</td>
//                       <td className="px-6 py-5 text-xs text-gray-500">
//                         <div className="font-bold">Đất {p.landArea || '—'}</div>
//                         <div className="text-[10px] opacity-60 italic">XD: {p.constructionArea || '—'}</div>
//                       </td>
//                       <td className="px-6 py-5 text-xs font-medium text-gray-500">{p.direction || '—'}</td>
//                       <td className="px-6 py-5 font-black text-indigo-600 text-sm">{p.price || '—'}</td>
//                       <td className="px-6 py-5">
//                         <div className="flex justify-center">
//                           <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
//                             p.status === 'Còn hàng' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
//                           }`}>
//                             {p.status === 'Còn hàng' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
//                             {p.status}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-5 text-right">
//                         <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
//                           <button onClick={() => handleOpenEditProduct(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shadow-sm">
//                             <Edit2 className="w-4 h-4" />
//                           </button>
//                           <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors shadow-sm">
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}

//                   {currentProducts.length === 0 && (
//                     <tr>
//                       <td colSpan={8} className="px-6 py-10 text-center text-gray-400 font-bold">
//                         Chưa có sản phẩm
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             <Pagination
//               currentPage={safePage}
//               totalPages={totalProductPages}
//               onPageChange={setCurrentProductPage}
//               totalItems={filteredProducts.length}
//               itemsPerPage={PRODUCTS_PER_PAGE}
//             />
//           </div>
//         )}

//         {/* ===== DOCS TAB ===== */}
//         {activeTab === 'docs' && (
//           <div className="animate-in slide-in-from-bottom-4 duration-300">
//             <h4 className="text-lg font-black text-gray-900 mb-4">Tài liệu & Pháp lý</h4>

//             <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-500 font-bold">
//               Backend hiện tại chưa trả về Documents. (documents = [])
//             </div>
//           </div>
//         )}

//         {/* ===== MAP TAB ===== */}
//         {activeTab === 'map' && (
//           <div className="h-full space-y-6 animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
//             <div className="flex justify-between items-center">
//               <h4 className="text-lg font-black text-gray-900">Vị trí dự án trên Google Maps</h4>
//               <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
//                 <MapPin className="w-4 h-4 text-indigo-500" />
//                 {project.location}{project.province ? `, ${project.province}` : ''}
//               </div>
//             </div>

//             <div className="flex-1 w-full min-h-[500px] rounded-3xl overflow-hidden shadow-inner border border-gray-100 bg-gray-50">
//               <iframe
//                 title="Google Maps Location"
//                 width="100%"
//                 height="100%"
//                 style={{ border: 0, minHeight: '500px' }}
//                 loading="lazy"
//                 allowFullScreen
//                 src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
//               />
//             </div>

//             <p className="text-xs text-gray-400 font-medium italic text-center uppercase tracking-widest">
//               Dữ liệu bản đồ được cung cấp bởi Google Maps Platform
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Product CRUD Modal (local only) */}
//       {isProductFormOpen && editingProduct && (
//         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
//           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white">
//             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
//               <h4 className="text-xl font-black text-gray-900 leading-none">
//                 {editingProduct.id ? 'Cập nhật Sản phẩm' : 'Thêm Sản phẩm mới'}
//               </h4>
//               <button
//                 onClick={() => setIsProductFormOpen(false)}
//                 className="p-2 hover:bg-red-50 rounded-full transition-colors text-gray-400 hover:text-red-500"
//               >
//                 <XCircle className="w-6 h-6" />
//               </button>
//             </div>

//             <form onSubmit={handleSaveProduct} className="p-8 space-y-6">
//               {/* form fields giữ nguyên của bạn */}

//               <div className="pt-6 flex gap-4">
//                 <button
//                   type="button"
//                   onClick={() => setIsProductFormOpen(false)}
//                   className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
//                 >
//                   Hủy
//                 </button>
//                 <button
//                   type="submit"
//                   className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs"
//                 >
//                   Lưu sản phẩm
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ProjectDetail;
