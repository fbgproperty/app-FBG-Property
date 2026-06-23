import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  RefreshCw,
  Search,
  Filter,
  Pencil,
  Trash2,
  Globe,
  MoreHorizontal,
  MapPin,
  Building
} from 'lucide-react';
import PropertyDetailModal, { HouseRecord } from './PropertyDetailModal';
import { api } from '../../../services/apiService';

// Debounce search để tránh spam API
function useDebouncedValue<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// Map backend dto (camelCase/PascalCase) -> HouseRecord UI
const mapHouseRecord = (x: any): HouseRecord => ({
  id: (x.id ?? x.Id ?? '') as string,
  source: (x.source ?? x.Source ?? '') as string,
  externalId: Number(x.externalId ?? x.ExternalId ?? 0),

  name: (x.name ?? x.Name ?? '') as string,
  description: (x.description ?? x.Description ?? '') as string,
  location: (x.location ?? x.Location ?? '') as string,

  imagesJson: (x.imagesJson ?? x.ImagesJson ?? []) as string[],

  typeLabel: (x.typeLabel ?? x.TypeLabel ?? '') as string,
  statusLabel: (x.statusLabel ?? x.StatusLabel ?? '') as string,
  isFeatured: Boolean(x.isFeatured ?? x.IsFeatured ?? false),

  numberBedroom: Number(x.numberBedroom ?? x.NumberBedroom ?? 0),
  numberBathroom: Number(x.numberBathroom ?? x.NumberBathroom ?? 0),
  numberFloor: Number(x.numberFloor ?? x.NumberFloor ?? 1),
  square: Number(x.square ?? x.Square ?? 0),

  priceFormatted: (x.priceFormatted ?? x.PriceFormatted ?? '') as string,
  currencySymbol: (x.currencySymbol ?? x.CurrencySymbol ?? '') as string,

  cityName: (x.cityName ?? x.CityName ?? '') as string,
  stateName: (x.stateName ?? x.StateName ?? '') as string,

  // backend đang trả null => giữ '' để UI render an toàn
  uniqueId: (x.uniqueId ?? x.UniqueId ?? '') as string,

  sourceCreatedAt: (x.sourceCreatedAt ?? x.SourceCreatedAt ?? '') as string,
  syncedAt: (x.syncedAt ?? x.SyncedAt ?? '') as string,

  views: Number(x.views ?? x.Views ?? 0),
});

const HousesApartments: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<HouseRecord | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 400);

  const [selectedProject, setSelectedProject] = useState<string>('all');

  const [items, setItems] = useState<HouseRecord[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [projects, setProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = async () => {
    try {
      const src = await api.getRaiPropertySources();
      setProjects(Array.isArray(src) ? src : []);
    } catch (e) {
      console.error(e);
    }
  };

  // ✅ FIX: đọc camelCase items/page/total (và fallback PascalCase)
  const fetchList = async (nextPage = page) => {
    setLoading(true);
    setError(null);

    try {
      const res: any = await api.getRaiProperties({
        page: nextPage,
        pageSize,
        search: debouncedSearch?.trim() || undefined,
        source: selectedProject, // apiService đã tự bỏ "all" (nếu bạn viết vậy)
        orderBy: 'syncedAt',
        orderDir: 'desc',
      });

      const rawItems = res?.items ?? res?.Items ?? [];
      const rawPage = res?.page ?? res?.Page ?? nextPage;
      const rawTotal = res?.total ?? res?.Total ?? 0;

      const mapped = rawItems.map(mapHouseRecord);

      setItems(mapped);
      setPage(rawPage);
      setTotal(rawTotal);
    } catch (e: any) {
      setError(e?.message || 'Có lỗi khi tải dữ liệu');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (row: HouseRecord) => {
    try {
      const detailRaw: any = await api.getRaiPropertyDetail(row.id);
      const detail = mapHouseRecord(detailRaw);

      setSelectedRecord({
        ...row,
        ...detail,
        views: detail.views ?? row.views ?? 0,
        imagesJson: detail.imagesJson?.length ? detail.imagesJson : (row.imagesJson ?? [])
      });
    } catch (e) {
      setSelectedRecord({ ...row, views: row.views ?? 0 });
    } finally {
      setIsModalOpen(true);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.syncRaiProperties(selectedProject ?? 'all');
      await fetchList(1);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchSources();
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedProject]);

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm ";
    if (status === 'Đang bán') return base + "bg-emerald-500 text-white shadow-emerald-100";
    if (status === 'Đã bán') return base + "bg-gray-400 text-white shadow-gray-100";
    return base + "bg-rose-500 text-white shadow-rose-100";
  };

  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  const visibleCount = useMemo(() => items.length, [items.length]);

  return (
    <div className="space-y-4 animate-fadeIn pb-10">
      {/* Breadcrumbs */}
      <nav className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
        <span className="hover:text-indigo-600 cursor-pointer transition">Trang quản trị</span>
        <span className="text-gray-300">/</span>
        <span className="hover:text-indigo-600 cursor-pointer transition">Bất động sản</span>
        <span className="text-gray-300">/</span>
        <span className="text-indigo-600">Nhà - Căn hộ</span>
      </nav>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Project Filter */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
            <Building size={16} className="text-indigo-500" />
            <select
              className="bg-transparent text-sm font-semibold text-gray-700 outline-none pr-4 cursor-pointer"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="all">Tất cả dự án</option>
              {projects.map((proj) => (
                <option key={proj} value={proj}>{proj}</option>
              ))}
            </select>
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition active:scale-95">
            <Filter size={14} className="text-indigo-500" /> Thêm lọc
          </button>

          <div className="relative group">
            <input
              type="text"
              placeholder="Tìm theo tên, SKU..."
              className="pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white w-64 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 active:scale-95">
            <Plus size={18} /> Tạo mới
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 border border-blue-100 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition active:scale-95 disabled:opacity-60"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Đang đồng bộ...' : 'Đồng bộ'}
          </button>

          <button
            onClick={() => fetchList(page)}
            className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition active:rotate-180 duration-500"
            title="Tải lại"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Grid Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-5 w-12 text-center">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                </th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hình ảnh</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thông tin cơ bản</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Lượt xem</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diện tích</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giá niêm yết</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mã SKU</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</th>
                <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {items.map((row) => (
                <tr key={row.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="p-5 text-center">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                  </td>

                  <td className="p-5">
                    <div className="w-16 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-gray-100">
                      <img
                        src={row.imagesJson?.[0] || 'https://via.placeholder.com/160x120?text=No+Image'}
                        alt={row.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                      />
                    </div>
                  </td>

                  <td className="p-5">
                    <div className="max-w-xs">
                      <button
                        onClick={() => openDetail(row)}
                        className="text-sm font-bold text-gray-800 hover:text-indigo-600 transition text-left line-clamp-2 leading-tight"
                      >
                        {row.name}
                      </button>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded uppercase font-black">
                          {row.source}
                        </span>
                        <span className="text-[10px] flex items-center gap-0.5 text-gray-400 font-medium">
                          <MapPin size={10} /> {row.stateName || '-'}, {row.cityName || '-'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-5 text-center text-sm font-semibold text-gray-500">
                    {(row.views ?? 0).toLocaleString()}
                  </td>

                  <td className="p-5">
                    <span className="text-sm font-bold text-gray-600">{row.square ?? 0} m²</span>
                  </td>

                  <td className="p-5">
                    <span className="text-sm font-black text-indigo-600">{row.priceFormatted || 'Liên hệ'}</span>
                  </td>

                  <td className="p-5 font-mono text-[11px] text-gray-500">{row.uniqueId || '-'}</td>

                  <td className="p-5">
                    <span className={getStatusBadge(row.statusLabel || '')}>{row.statusLabel || 'N/A'}</span>
                  </td>

                  <td className="p-5">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all">
                        <Pencil size={14} />
                      </button>
                      <button className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-lg transition-all">
                        <Trash2 size={14} />
                      </button>
                      <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && items.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                <Search size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-bold">Không tìm thấy tài sản nào phù hợp</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedProject('all'); }}
                className="mt-4 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}

          {loading && (
            <div className="p-10 text-center text-sm font-bold text-gray-500">
              Đang tải dữ liệu...
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-gray-50/80 p-5 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
            <Globe size={14} className="text-indigo-400" />
            Đang hiển thị <span className="text-gray-900 font-bold">{visibleCount}</span> kết quả trong tổng{' '}
            <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black ml-1">{total}</span> bản ghi
          </div>

          <div className="flex gap-2">
            <button
              disabled={!canPrev || loading}
              onClick={() => fetchList(page - 1)}
              className={`px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold transition ${(!canPrev || loading) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Trước
            </button>

            <button className="px-3 py-1.5 bg-indigo-600 text-white border border-indigo-600 rounded-lg text-xs font-bold shadow-sm">
              {page}
            </button>

            <button
              disabled={!canNext || loading}
              onClick={() => fetchList(page + 1)}
              className={`px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold transition ${(!canNext || loading) ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      <PropertyDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={selectedRecord}
      />
    </div>
  );
};

export default HousesApartments;



// import React, { useState, useMemo } from 'react';
// import { 
//   Plus, 
//   RefreshCw, 
//   Search, 
//   ChevronDown, 
//   Filter, 
//   Pencil, 
//   Trash2, 
//   Globe,
//   MoreHorizontal,
//   MapPin,
//   Building
// } from 'lucide-react';
// import PropertyDetailModal, { HouseRecord } from './PropertyDetailModal';

// // Interface matching the C# PagedResult<T> model
// interface PagedResult<T> {
//   Items: T[];
//   Page: number;
//   PageSize: number;
//   Total: number;
// }

// const HousesApartments: React.FC = () => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedRecord, setSelectedRecord] = useState<HouseRecord | null>(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedProject, setSelectedProject] = useState<string>('all');

//   // Initial Mock Data wrapped in PagedResult structure
//   const [pagedData] = useState<PagedResult<HouseRecord>>({
//     Items: [
//       {
//         id: '1', source: 'Internal', externalId: 10245, name: 'Căn hộ Goldmark City - Sapphire S2', 
//         description: 'Căn hộ 3PN hướng Đông Nam, view hồ điều hòa, full nội thất cao cấp. Thiết kế hiện đại, ban công rộng rãi đón ánh sáng tự nhiên.',
//         location: '136 Hồ Tùng Mậu, Hà Nội', 
//         imagesJson: [
//           'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
//           'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
//           'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
//         ],
//         typeLabel: 'Căn hộ chung cư', statusLabel: 'Đang bán', isFeatured: true, numberBedroom: 3, numberBathroom: 2, numberFloor: 1, 
//         square: 110.5, priceFormatted: '6.5 Tỷ', currencySymbol: '₫', cityName: 'Hà Nội', stateName: 'Bắc Từ Liêm', 
//         uniqueId: 'GMC-S2-63', sourceCreatedAt: '2026-01-28', syncedAt: '2026-02-20', views: 1240
//       },
//       {
//         id: '2', source: 'Vinhomes', externalId: 20492, name: 'Vinhomes Smart City - Studio Tonkin', 
//         description: 'Căn hộ Studio thiết kế phong cách Indochine sang trọng, nhận nhà ngay.',
//         location: 'Tây Mỗ, Nam Từ Liêm, Hà Nội', 
//         imagesJson: [
//           'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
//           'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800'
//         ],
//         typeLabel: 'Studio', statusLabel: 'Đã bán', isFeatured: false, numberBedroom: 1, numberBathroom: 1, numberFloor: 1, 
//         square: 32, priceFormatted: '2.1 Tỷ', currencySymbol: '₫', cityName: 'Hà Nội', stateName: 'Nam Từ Liêm', 
//         uniqueId: 'VSC-TK-05', sourceCreatedAt: '2026-02-05', syncedAt: '2026-02-21', views: 890
//       },
//       {
//         id: '3', source: 'Internal', externalId: 30512, name: 'Biệt thự đơn lập Ciputra - Khu K', 
//         description: 'Biệt thự sân vườn rộng, hồ bơi riêng, an ninh tuyệt đối.',
//         location: 'KĐT Ciputra, Tây Hồ, Hà Nội', 
//         imagesJson: [
//           'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
//           'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
//           'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800'
//         ],
//         typeLabel: 'Biệt thự', statusLabel: 'Đang bán', isFeatured: true, numberBedroom: 5, numberBathroom: 6, numberFloor: 3, 
//         square: 450, priceFormatted: '85 Tỷ', currencySymbol: '₫', cityName: 'Hà Nội', stateName: 'Tây Hồ', 
//         uniqueId: 'CPT-K-01', sourceCreatedAt: '2026-02-10', syncedAt: '2026-02-22', views: 4500
//       },
//       {
//         id: '4', source: 'Masterise', externalId: 40129, name: 'Masteri West Heights - 2PN+1', 
//         description: 'Căn hộ view trực diện hồ trung tâm 10.2ha, tiêu chuẩn bàn giao cao cấp.',
//         location: 'Smart City, Hà Nội', 
//         imagesJson: [
//           'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
//           'https://images.unsplash.com/photo-1556912177-c5403073983d?w=800'
//         ],
//         typeLabel: 'Căn hộ', statusLabel: 'Ngừng bán', isFeatured: false, numberBedroom: 2, numberBathroom: 2, numberFloor: 1, 
//         square: 62.5, priceFormatted: '4.8 Tỷ', currencySymbol: '₫', cityName: 'Hà Nội', stateName: 'Nam Từ Liêm', 
//         uniqueId: 'MWH-A-22', sourceCreatedAt: '2026-02-12', syncedAt: '2026-02-22', views: 2100
//       },
//       {
//         id: '5', source: 'Ecopark', externalId: 50982, name: 'The Landmark Swanlake Residences', 
//         description: 'Căn hộ khoáng nóng Onsen tại gia, view trọn công viên Hồ Thiên Nga.',
//         location: 'Ecopark, Hưng Yên', 
//         imagesJson: [
//           'https://images.unsplash.com/photo-1515263487990-61b0082665d1?w=800',
//           'https://images.unsplash.com/photo-1536376074432-ad71746aa04b?w=800'
//         ],
//         typeLabel: 'Căn hộ Onsen', statusLabel: 'Đang bán', isFeatured: true, numberBedroom: 2, numberBathroom: 2, numberFloor: 1, 
//         square: 75, priceFormatted: '5.2 Tỷ', currencySymbol: '₫', cityName: 'Hưng Yên', stateName: 'Văn Giang', 
//         uniqueId: 'EP-SL-10', sourceCreatedAt: '2026-02-15', syncedAt: '2026-02-23', views: 3200
//       },
//       {
//         id: '6', source: 'Sun Group', externalId: 60111, name: 'Sun Grand City Thụy Khuê', 
//         description: 'Căn hộ view trực diện Hồ Tây, ban công rộng 10m2.',
//         location: '69B Thụy Khuê, Tây Hồ, Hà Nội', 
//         imagesJson: [
//           'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
//           'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
//         ],
//         typeLabel: 'Căn hộ hạng sang', statusLabel: 'Đang bán', isFeatured: false, numberBedroom: 3, numberBathroom: 2, numberFloor: 1, 
//         square: 145, priceFormatted: '18 Tỷ', currencySymbol: '₫', cityName: 'Hà Nội', stateName: 'Tây Hồ', 
//         uniqueId: 'SGC-TK-15', sourceCreatedAt: '2026-01-20', syncedAt: '2026-02-23', views: 1560
//       }
//     ],
//     Page: 1,
//     PageSize: 10,
//     Total: 6
//   });

//   // Extract unique projects for the filter
//   const projects = useMemo(() => {
//     const uniqueSources = Array.from(new Set(pagedData.Items.map(item => item.source)));
//     return uniqueSources.sort();
//   }, [pagedData.Items]);

//   const filteredItems = useMemo(() => {
//     return pagedData.Items.filter(r => {
//       const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
//                            r.uniqueId.toLowerCase().includes(searchTerm.toLowerCase());
//       const matchesProject = selectedProject === 'all' || r.source === selectedProject;
//       return matchesSearch && matchesProject;
//     });
//   }, [pagedData.Items, searchTerm, selectedProject]);

//   const openDetail = (record: HouseRecord) => {
//     setSelectedRecord(record);
//     setIsModalOpen(true);
//   };

//   const getStatusBadge = (status: string) => {
//     const base = "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm ";
//     if (status === 'Đang bán') return base + "bg-emerald-500 text-white shadow-emerald-100";
//     if (status === 'Đã bán') return base + "bg-gray-400 text-white shadow-gray-100";
//     return base + "bg-rose-500 text-white shadow-rose-100";
//   };

//   return (
//     <div className="space-y-4 animate-fadeIn pb-10">
//       {/* Breadcrumbs */}
//       <nav className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
//         <span className="hover:text-indigo-600 cursor-pointer transition">Trang quản trị</span>
//         <span className="text-gray-300">/</span>
//         <span className="hover:text-indigo-600 cursor-pointer transition">Bất động sản</span>
//         <span className="text-gray-300">/</span>
//         <span className="text-indigo-600">Nhà - Căn hộ</span>
//       </nav>

//       {/* Toolbar */}
//       <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
//         <div className="flex items-center gap-3">
//           {/* Project Filter */}
//           <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
//             <Building size={16} className="text-indigo-500" />
//             <select 
//               className="bg-transparent text-sm font-semibold text-gray-700 outline-none pr-4 cursor-pointer"
//               value={selectedProject}
//               onChange={(e) => setSelectedProject(e.target.value)}
//             >
//               <option value="all">Tất cả dự án</option>
//               {projects.map(proj => (
//                 <option key={proj} value={proj}>{proj}</option>
//               ))}
//             </select>
//           </div>

//           <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition active:scale-95">
//             <Filter size={14} className="text-indigo-500" /> Thêm lọc
//           </button>

//           <div className="relative group">
//             <input 
//               type="text" 
//               placeholder="Tìm theo tên, SKU..."
//               className="pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white w-64 transition-all outline-none"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 active:scale-95">
//             <Plus size={18} /> Tạo mới
//           </button>
//           <button className="flex items-center gap-2 px-4 py-2.5 border border-blue-100 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold hover:bg-blue-100 transition active:scale-95">
//             <RefreshCw size={16} /> Đồng bộ
//           </button>
//           <button className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition active:rotate-180 duration-500">
//             <RefreshCw size={18} />
//           </button>
//         </div>
//       </div>

//       {/* Grid Table */}
//       <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-left border-collapse min-w-[1200px]">
//             <thead>
//               <tr className="bg-gray-50/50 border-b border-gray-100">
//                 <th className="p-5 w-12 text-center">
//                   <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
//                 </th>
//                 {/* <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID</th> */}
//                 <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hình ảnh</th>
//                 <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thông tin cơ bản</th>
//                 <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Lượt xem</th>
//                 <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diện tích</th>
//                 <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giá niêm yết</th>
//                 <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mã SKU</th>
//                 <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Trạng thái</th>
//                 <th className="p-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-50">
//               {filteredItems.map((row) => (
//                 <tr key={row.id} className="hover:bg-indigo-50/30 transition-colors group">
//                   <td className="p-5 text-center">
//                     <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
//                   </td>
//                   {/* <td className="p-5">
//                     <span className="text-xs font-bold text-gray-400">#{row.externalId}</span>
//                   </td> */}
//                   <td className="p-5">
//                     <div className="w-16 h-12 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
//                       <img src={row.imagesJson[0]} alt={row.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
//                     </div>
//                   </td>
//                   <td className="p-5">
//                     <div className="max-w-xs">
//                       <button 
//                         onClick={() => openDetail(row)}
//                         className="text-sm font-bold text-gray-800 hover:text-indigo-600 transition text-left line-clamp-2 leading-tight"
//                       >
//                         {row.name}
//                       </button>
//                       <div className="flex items-center gap-2 mt-1">
//                         <span className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded uppercase font-black">{row.source}</span>
//                         <span className="text-[10px] flex items-center gap-0.5 text-gray-400 font-medium"><MapPin size={10} /> {row.stateName}, {row.cityName}</span>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="p-5 text-center text-sm font-semibold text-gray-500">{row.views.toLocaleString()}</td>
//                   <td className="p-5">
//                     <span className="text-sm font-bold text-gray-600">{row.square} m²</span>
//                   </td>
//                   <td className="p-5">
//                     <span className="text-sm font-black text-indigo-600">{row.priceFormatted}</span>
//                   </td>
//                   <td className="p-5 font-mono text-[11px] text-gray-500">{row.uniqueId}</td>
//                   <td className="p-5">
//                     <span className={getStatusBadge(row.statusLabel)}>{row.statusLabel}</span>
//                   </td>
//                   <td className="p-5">
//                     <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
//                       <button className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-all"><Pencil size={14} /></button>
//                       <button className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-lg transition-all"><Trash2 size={14} /></button>
//                       <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition"><MoreHorizontal size={14} /></button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//           {filteredItems.length === 0 && (
//             <div className="p-20 text-center">
//                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
//                   <Search size={24} className="text-gray-300" />
//                </div>
//                <p className="text-gray-500 font-bold">Không tìm thấy tài sản nào phù hợp</p>
//                <button 
//                 onClick={() => {setSearchTerm(''); setSelectedProject('all');}}
//                 className="mt-4 text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline"
//                >
//                  Xóa tất cả bộ lọc
//                </button>
//             </div>
//           )}
//         </div>
        
//         {/* Pagination using pagedData properties */}
//         <div className="bg-gray-50/80 p-5 border-t border-gray-100 flex items-center justify-between">
//           <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
//             <Globe size={14} className="text-indigo-400" />
//             Đang hiển thị <span className="text-gray-900 font-bold">{filteredItems.length}</span> kết quả trong tổng <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black ml-1">{pagedData.Total}</span> bản ghi
//           </div>
//           <div className="flex gap-2">
//             <button 
//               disabled={pagedData.Page === 1}
//               className={`px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold transition ${pagedData.Page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
//             >
//               Trước
//             </button>
//             <button className="px-3 py-1.5 bg-indigo-600 text-white border border-indigo-600 rounded-lg text-xs font-bold shadow-sm">{pagedData.Page}</button>
//             <button 
//               disabled={pagedData.Page * pagedData.PageSize >= pagedData.Total}
//               className={`px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold transition ${pagedData.Page * pagedData.PageSize >= pagedData.Total ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50'}`}
//             >
//               Sau
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Detail Modal Component */}
//       <PropertyDetailModal 
//         isOpen={isModalOpen} 
//         onClose={() => setIsModalOpen(false)} 
//         record={selectedRecord} 
//       />

//       <style>{`
//         .animate-spin-slow {
//           animation: spin 3s linear infinite;
//         }
//         @keyframes spin {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(360deg); }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default HousesApartments;
