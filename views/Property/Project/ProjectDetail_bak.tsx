import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Pagination from '../../../components/Pagination';
import { api } from '../../../services/apiService';
import {
  ArrowLeft, MapPin, Bot, Loader2, Info, LayoutGrid, FileText,
  CheckCircle2, XCircle, Edit2, Trash2, PlusCircle,
  CloudUpload, Download, Share2, ShieldCheck, FileImage, Video,
  Zap, Plus, Map as MapIcon, Folder
} from 'lucide-react';
import { formatDateTime } from '../../../components/utils/formatDate';



const PRODUCTS_PER_PAGE = 8;

// ===== UI types =====
// type ProjectDocument = {
//   id: string;
//   name: string;
//   type: 'pdf' | 'image' | 'video' | 'legal' | 'other';
//   size: string;
//   date: string;
//   url?: string;
// };

type ProjectDocument = {
  id: string;
  name: string;        // ✅ TÊN FOLDER
  url: string;         // ✅ link Google Drive / Web
  accessLevel?: 'public' | 'internal' | 'restricted';
  createdAt: string;
};

type ProjectProduct = {
  id: string;
  code: string;
  subdivision: string;
  type: string;
  landArea: string;
  constructionArea: string;
  direction: string;
  price: string;
  status: 'Còn hàng' | 'Hết hàng' | string;
};

/* ===== Folder Icon Component ===== */
const FolderIcon = () => (
  <Folder className="w-5 h-5 text-indigo-600" />
);

// ===== Backend response DTO =====
// Lưu ý: ApiProjectDetail đang tham chiếu ProjectProduct/ProjectDocument
// => phải khai báo ProjectProduct/ProjectDocument ở trên trước
type ApiProjectDetail = {
  id: string;
  code: string;
  name: string;
  location: string;
  province: string;
  status: string;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
  investor: string;
  projectType: string;
  imageUrl: string;
  priceRange: string;
  aiAnalysis: string | null;
  productCount: number;
  units: number;
  products: ProjectProduct[] | null;
  documents: ProjectDocument[] | null;
};

type UiProjectDetail = {
  id: string;
  code: string;
  name: string;

  location: string;
  province: string;
  status: string;
  description: string;

  investor: string;
  projectType: string;
  imageUrl: string;
  priceRange: string;

  units: number;
  productCount: number;

  aiAnalysis?: string | null;
  products: ProjectProduct[];
  documents: ProjectDocument[];
};

function normalizeStatus(status: string) {
  const s = (status || '').trim().toLowerCase();
  if (s === 'selling' || s.includes('sell')) return 'Selling';
  if (s === 'planning' || s.includes('plan')) return 'Planning';
  if (s === 'sold out' || s === 'soldout' || s.includes('sold')) return 'Sold Out';
  return status;
}

function mapApiToUi(p: ApiProjectDetail): UiProjectDetail {
  return {
    id: p.id,
    code: p.code,
    name: p.name,

    location: p.location,
    province: p.province,
    status: normalizeStatus(p.status),
    description: p.description ?? '',

    investor: p.investor,
    projectType: p.projectType,
    imageUrl: p.imageUrl,
    priceRange: p.priceRange,

    productCount: p.productCount ?? 0,
    units: p.units && p.units > 0 ? p.units : (p.productCount ?? 0),

    aiAnalysis: (p.aiAnalysis && p.aiAnalysis.trim()) ? p.aiAnalysis : null,
    products: p.products ?? [],
    documents: p.documents ?? [],
  };
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<UiProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'inventory' | 'docs' | 'map'>('info');

  // Inventory states (local demo)
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [productFilter, setProductFilter] = useState<string>('All');
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<ProjectProduct> | null>(null);

  // ✅ Hooks phải nằm TRƯỚC mọi return điều kiện
  const filteredProducts = useMemo(() => {
    const list = project?.products ?? [];
    return list.filter(p => productFilter === 'All' || p.status === productFilter);
  }, [project?.products, productFilter]);

  const totalProductPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  }, [filteredProducts.length]);

  const safePage = useMemo(() => {
    return Math.min(currentProductPage, totalProductPages);
  }, [currentProductPage, totalProductPages]);

  const currentProducts = useMemo(() => {
    return filteredProducts.slice(
      (safePage - 1) * PRODUCTS_PER_PAGE,
      safePage * PRODUCTS_PER_PAGE
    );
  }, [filteredProducts, safePage]);

  // Load project detail từ backend
  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const res = await api.getProjectDetail(id); // <-- chỉ gọi 1 lần
        if (!alive) return;

        setProject(mapApiToUi(res));

        // reset inventory state mỗi khi load dự án mới
        setCurrentProductPage(1);
        setProductFilter('All');
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

  // Loading
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium">Đang tải chi tiết dự án...</p>
      </div>
    );
  }

  // Error / not found
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

  // --- AI Analyze (backend chưa có endpoint) ---
  const handleAnalyze = async () => {
    alert('Chưa có API AI Analysis dưới backend. Khi có endpoint, mình sẽ nối vào.');
  };

  const updateProjectProductsLocal = (newProducts: ProjectProduct[]) => {
    setProject(prev => prev ? ({ ...prev, products: newProducts }) : prev);
    setCurrentProductPage(1);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct({
      code: '',
      type: 'CĂN HỘ',
      landArea: '',
      constructionArea: '',
      direction: '',
      subdivision: 'ĐẢO DỪA',
      price: '',
      status: 'Còn hàng',
    });
    setIsProductFormOpen(true);
  };

  const handleOpenEditProduct = (p: ProjectProduct) => {
    setEditingProduct(p);
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!confirm('Xác nhận xóa sản phẩm này?')) return;
    const updated = (project.products ?? []).filter(p => p.id !== productId);
    updateProjectProductsLocal(updated);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let updated: ProjectProduct[];
    if (editingProduct.id) {
      updated = (project.products ?? []).map(p => (p.id === editingProduct.id ? (editingProduct as ProjectProduct) : p));
    } else {
      updated = [...(project.products ?? []), { ...editingProduct, id: `S-${Date.now()}` } as ProjectProduct];
    }

    updateProjectProductsLocal(updated);
    setIsProductFormOpen(false);
  };

  const getDocIcon = (type: ProjectDocument['type']) => {
    switch (type) {
      case 'pdf': return <FileText className="w-8 h-8 text-red-500" />;
      case 'image': return <FileImage className="w-8 h-8 text-blue-500" />;
      case 'video': return <Video className="w-8 h-8 text-purple-500" />;
      case 'legal': return <ShieldCheck className="w-8 h-8 text-green-600" />;
      default: return <FileText className="w-8 h-8 text-gray-400" />;
    }
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
            <img src={project.imageUrl} alt={project.name} loading="lazy" className="w-full h-full object-cover" />
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
              <span>{project.location}, {project.province}</span>
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
                    <p className="text-2xl font-black text-indigo-900">{project.units} Căn</p>
                  </div>

                  <div className="p-6 bg-green-50/50 rounded-2xl border border-green-100">
                    <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Tầm giá thị trường</p>
                    <p className="text-2xl font-black text-green-900">{project.priceRange}</p>
                  </div>

                  <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-400" />
                      <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Vị trí dự án</p>
                    </div>
                    <p className="text-sm font-black text-orange-900 line-clamp-2">{project.location}, {project.province}</p>
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
                    <div><span className="font-black text-gray-700">Chủ đầu tư:</span> {project.investor}</div>
                    <div><span className="font-black text-gray-700">Loại hình:</span> {project.projectType}</div>
                    <div><span className="font-black text-gray-700">Số SP:</span> {project.productCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== INVENTORY TAB ===== */}
        {activeTab === 'inventory' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <h4 className="text-lg font-black text-gray-900">Giỏ hàng dự án</h4>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  {['All', 'Còn hàng', 'Hết hàng'].map(status => (
                    <button
                      key={status}
                      onClick={() => { setProductFilter(status); setCurrentProductPage(1); }}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                        productFilter === status ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {status === 'All' ? 'Tất cả' : status}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleOpenAddProduct}
                className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-green-700 transition-all shadow-md"
              >
                <PlusCircle className="w-4 h-4" /> Thêm Sản phẩm
              </button>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                    <th className="px-6 py-5">Mã SP</th>
                    <th className="px-6 py-5">Phân khu</th>
                    <th className="px-6 py-5">Loại hình</th>
                    <th className="px-6 py-5">Diện tích (m2)</th>
                    <th className="px-6 py-5">Hướng</th>
                    <th className="px-6 py-5">Giá (Tỷ)</th>
                    <th className="px-6 py-5 text-center">Tình trạng</th>
                    <th className="px-6 py-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-5 font-black text-gray-900 text-sm">{p.code}</td>
                      <td className="px-6 py-5">
                        <span className="px-2 py-1 bg-gray-100 rounded text-[9px] font-black text-gray-600 border border-gray-200">{p.subdivision}</span>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-gray-500">{p.type}</td>
                      <td className="px-6 py-5 text-xs text-gray-500">
                        <div className="font-bold">Đất {p.landArea}</div>
                        <div className="text-[10px] opacity-60 italic">XD: {p.constructionArea}</div>
                      </td>
                      <td className="px-6 py-5 text-xs font-medium text-gray-500">{p.direction}</td>
                      <td className="px-6 py-5 font-black text-indigo-600 text-sm">{p.price}</td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                            p.status === 'Còn hàng' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {p.status === 'Còn hàng' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {p.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenEditProduct(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shadow-sm"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors shadow-sm"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {currentProducts.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-gray-400 font-bold">
                        Chưa có sản phẩm
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={safePage}
              totalPages={totalProductPages}
              onPageChange={setCurrentProductPage}
              totalItems={filteredProducts.length}
              itemsPerPage={PRODUCTS_PER_PAGE}
            />
          </div>
        )}

        {/* ===== DOCS TAB ===== */}
        {activeTab === 'docs' && (
  <div className="animate-in slide-in-from-bottom-4 duration-300">
    <h4 className="text-lg font-black text-gray-900 mb-4">
      Tài liệu & Pháp lý
    </h4>

    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b">
          <tr className="text-[11px] uppercase font-black tracking-widest text-gray-400">
            <th className="px-6 py-4">Thư mục</th>
            <th className="px-6 py-4">Quyền truy cập</th>
            <th className="px-6 py-4">Ngày tạo</th>
            <th className="px-6 py-4 text-right">Mở</th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {project.documents.map(folder => (
            <tr
              key={folder.id}
              className="hover:bg-gray-50 cursor-pointer transition"
              onClick={() => window.open(folder.url, '_blank')}
            >
              <td className="px-6 py-4 font-bold flex items-center gap-3">
                <FolderIcon />
                <span className="text-indigo-700 hover:underline">
                  {folder.name}
                </span>
              </td>

              <td className="px-6 py-4 text-xs font-black uppercase text-gray-500">
                {folder.accessLevel ?? 'Internal'}
              </td>

              <td className="px-6 py-4 text-sm text-gray-500">
                {/* {folder.createdAt} */}
                {formatDateTime(folder.createdAt)}
              </td>

              <td className="px-6 py-4 text-right text-indigo-600 font-black text-xs">
                Mở →
              </td>
            </tr>
          ))}

          {project.documents.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-gray-400 font-bold">
                Chưa có thư mục tài liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {/* <p className="text-xs text-gray-400 italic mt-4">
      * Click thư mục để mở Google Drive / Cloud Storage
    </p> */}
  </div>
)}

        {/* {activeTab === 'docs' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-black text-gray-900 mb-1">Kho tài liệu pháp lý</h4>
                <p className="text-sm text-gray-500 font-medium tracking-tight uppercase">Tự động đồng bộ với Google Drive / Cloud Storage</p>
              </div>
              <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-xs hover:bg-indigo-700 transition-all shadow-md">
                <CloudUpload className="w-4 h-4" /> Tải lên Cloud
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {project.documents.map((doc) => (
                <div key={doc.id} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-2xl transition-all group relative border-b-4 border-b-transparent hover:border-b-indigo-500">
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                      {getDocIcon(doc.type)}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                      <button className="p-2 text-gray-400 hover:text-indigo-600 bg-white shadow-sm border border-gray-100 rounded-lg"><Download className="w-4 h-4" /></button>
                      <button className="p-2 text-gray-400 hover:text-indigo-600 bg-white shadow-sm border border-gray-100 rounded-lg"><Share2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-black text-gray-900 text-sm truncate mb-2" title={doc.name}>{doc.name}</h5>
                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-black uppercase tracking-widest opacity-70">
                      <span>{doc.size}</span>
                      <span>{doc.date}</span>
                    </div>
                  </div>
                </div>
              ))}

              <div className="border-4 border-dashed border-gray-100 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-300 hover:border-indigo-200 hover:text-indigo-300 cursor-pointer transition-all duration-300">
                <Plus className="w-10 h-10 mb-2 opacity-50" />
                <span className="text-xs font-black uppercase tracking-widest">Kéo thả tệp</span>
              </div>
            </div>
          </div>
        )} */}

        {/* ===== MAP TAB ===== */}
        {activeTab === 'map' && (
          <div className="h-full space-y-6 animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-black text-gray-900">Vị trí dự án trên Google Maps</h4>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <MapPin className="w-4 h-4 text-indigo-500" />
                {project.location}, {project.province}
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

      {/* Product CRUD Modal (local only) */}
      {isProductFormOpen && editingProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h4 className="text-xl font-black text-gray-900 leading-none">
                {editingProduct.id ? 'Cập nhật Sản phẩm' : 'Thêm Sản phẩm mới'}
              </h4>
              <button
                onClick={() => setIsProductFormOpen(false)}
                className="p-2 hover:bg-red-50 rounded-full transition-colors text-gray-400 hover:text-red-500"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-8 space-y-6">
              {/* form giữ nguyên như bạn */}
              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsProductFormOpen(false)}
                  className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs"
                >
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
