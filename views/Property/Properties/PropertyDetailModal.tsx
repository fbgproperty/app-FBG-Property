import React, { useEffect, useState } from 'react';
import {
  X,
  Check,
  Pencil,
  MapPin,
  Bed,
  Bath,
  Maximize,
  Layers,
  Eye,
  Hash,
  Calendar,
  RefreshCw,
  Globe,
  Navigation,
  ExternalLink,
  Tag,
  Building2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { formatDateTime } from '@/components/utils/formatDate';

export interface HouseRecord {
  id: string;
  source: string;
  externalId: number;
  name: string;
  description: string;
  location: string;
  imagesJson: string[];
  typeLabel: string;
  statusLabel: string;
  isFeatured: boolean;
  numberBedroom: number;
  numberBathroom: number;
  numberFloor: number;
  square: number;
  priceFormatted: string;
  currencySymbol: string;
  cityName: string;
  stateName: string;
  uniqueId: string;
  sourceCreatedAt: string;
  syncedAt: string;
  views: number; // backend không làm view => FE set 0
}

interface PropertyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: HouseRecord | null;
}

const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ isOpen, onClose, record }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'gallery' | 'map'>('gallery');

  // Reset state when open new record
  useEffect(() => {
    if (isOpen) {
      setCurrentImageIndex(0);
      setIsLightboxOpen(false);
      setViewMode('gallery');
    }
  }, [isOpen, record?.id]);

  if (!isOpen || !record) return null;

  const safeImages = record.imagesJson?.length
    ? record.imagesJson
    : ['https://via.placeholder.com/1200x800?text=No+Image'];

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % safeImages.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  const handleOpenExternalMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      (record.location || '') + ' ' + (record.cityName || '')
    )}`;
    window.open(url, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm ";
    if (status === 'Đang bán') return base + "bg-emerald-500 text-white shadow-emerald-100";
    if (status === 'Đã bán') return base + "bg-gray-400 text-white shadow-gray-100";
    return base + "bg-rose-500 text-white shadow-rose-100";
  };

  // Embed URL (keyless)
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    (record.location || '') + ' ' + (record.cityName || '')
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Main Backdrop */}
      <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md animate-fadeIn" onClick={onClose}></div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col relative z-10 scale-up border border-indigo-50">
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-gray-50 flex items-start justify-between bg-gradient-to-b from-gray-50 to-white">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
              <Building2 size={32} />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{record.name}</h2>
                {record.isFeatured && (
                  <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
                    <Tag size={10} /> Nổi bật
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-gray-400 text-sm font-semibold">
                <span className="flex items-center gap-1 cursor-pointer hover:text-indigo-600 transition" onClick={handleOpenExternalMap}>
                  <MapPin size={14} className="text-rose-500" /> {record.location || '-'}
                </span>
                <span className="text-gray-200">|</span>
                <span className="flex items-center gap-1 uppercase tracking-wider text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">
                  {record.source}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all text-gray-400 bg-white shadow-sm border border-gray-100"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Primary View Area (Gallery or Map) */}
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100/50 group bg-gray-100 border border-gray-100">
                {viewMode === 'gallery' ? (
                  <div className="w-full h-full cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
                    <img
                      src={safeImages[currentImageIndex]}
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-105"
                      alt={`Property Image ${currentImageIndex + 1}`}
                    />

                    {/* Navigation Arrows */}
                    {safeImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-900 opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-white"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-900 opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-white"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}

                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className={getStatusBadge(record.statusLabel || '')}>{record.statusLabel || 'N/A'}</span>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
                      <div className="flex -space-x-3 pointer-events-auto">
                        {safeImages.map((img, i) => (
                          <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                            className={`w-12 h-12 rounded-xl border-2 transition-all object-cover shadow-lg overflow-hidden ${
                              currentImageIndex === i ? 'border-indigo-500 scale-110 z-10' : 'border-white hover:scale-105'
                            }`}
                          >
                            <img src={img} className="w-full h-full object-cover" alt={`thumb-${i}`} />
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2 pointer-events-auto">
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewMode('map'); }}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                        >
                          <Navigation size={14} /> Xem bản đồ
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
                          className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-white transition-all active:scale-95"
                        >
                          <Eye size={14} /> Xem {safeImages.length} ảnh
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative bg-indigo-50">
                    <iframe
                      src={mapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={true}
                      loading="lazy"
                      title="Property Location"
                      className="w-full h-full"
                    ></iframe>

                    {/* Map Controls */}
                    <div className="absolute bottom-6 right-6 flex gap-2">
                      <button
                        onClick={() => setViewMode('gallery')}
                        className="bg-white shadow-xl px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95 text-indigo-600 border border-indigo-50"
                      >
                        <ImageIcon size={14} /> Quay lại xem ảnh
                      </button>
                      <button
                        onClick={handleOpenExternalMap}
                        className="bg-indigo-600 text-white shadow-xl px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
                      >
                        <ExternalLink size={14} /> Mở bản đồ Google
                      </button>
                    </div>

                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-gray-100 max-w-[240px]">
                      <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider mb-0.5 flex items-center gap-1">
                        <MapPin size={10} /> Vị trí chính xác
                      </p>
                      <p className="text-xs font-bold text-gray-800 line-clamp-2">{record.location || '-'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100/50 text-center group hover:bg-indigo-600 transition-colors duration-500">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition">
                    <Bed className="text-indigo-600" size={20} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-indigo-100 transition">Phòng ngủ</p>
                  <p className="text-xl font-black text-gray-900 group-hover:text-white transition">{record.numberBedroom ?? 0}</p>
                </div>

                <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100/50 text-center group hover:bg-rose-600 transition-colors duration-500">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition">
                    <Bath className="text-rose-600" size={20} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-rose-100 transition">Nhà tắm</p>
                  <p className="text-xl font-black text-gray-900 group-hover:text-white transition">{record.numberBathroom ?? 0}</p>
                </div>

                <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/50 text-center group hover:bg-emerald-600 transition-colors duration-500">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition">
                    <Maximize className="text-emerald-600" size={20} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-emerald-100 transition">Diện tích</p>
                  <p className="text-xl font-black text-gray-900 group-hover:text-white transition">
                    {record.square ?? 0} <span className="text-xs font-medium">m²</span>
                  </p>
                </div>

                <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100/50 text-center group hover:bg-blue-600 transition-colors duration-500">
                  <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition">
                    <Layers className="text-blue-600" size={20} />
                  </div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-100 transition">Số tầng</p>
                  <p className="text-xl font-black text-gray-900 group-hover:text-white transition">{record.numberFloor || 1}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div> Mô tả chi tiết
                </h4>
                <div className="text-gray-600 leading-loose font-medium text-sm bg-gray-50/50 p-6 rounded-3xl border border-gray-100 italic">
                  {record.description || '—'}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-indigo-900 text-white p-8 rounded-[2rem] shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-2">Giá niêm yết</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black">{record.priceFormatted || 'Liên hệ'}</span>
                    <span className="text-indigo-400 font-bold">{record.currencySymbol || ''}</span>
                  </div>
                  <div className="mt-8 pt-6 border-t border-indigo-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-800 rounded-full flex items-center justify-center group-hover:bg-indigo-700 transition">
                        <Eye size={14} className="text-indigo-400" />
                      </div>
                      <span className="text-sm font-bold">
                        {(record.views ?? 0).toLocaleString()} <span className="text-indigo-400 font-medium">Lượt xem</span>
                      </span>
                    </div>
                    <button className="p-2 bg-indigo-700 rounded-xl hover:bg-white hover:text-indigo-900 transition active:scale-95" title="Refresh (UI)">
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 blur-3xl rounded-full"></div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-5">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Thông tin hệ thống</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-400 font-semibold"><Hash size={14} /> Mã SKU</span>
                    <span className="font-mono font-black text-gray-700">{record.uniqueId || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-400 font-semibold"><Calendar size={14} /> Ngày tạo</span>
                    <span className="font-bold text-gray-700">{formatDateTime(record.sourceCreatedAt) || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-400 font-semibold"><RefreshCw size={14} /> Time đồng bộ</span>
                    <span className="font-bold text-indigo-600">{formatDateTime(record.syncedAt) || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-400 font-semibold"><Globe size={14} /> Dự án</span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-black uppercase text-[10px] tracking-wider">
                      {record.source}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="relative bg-gray-50 rounded-[2rem] border border-gray-100 overflow-hidden group cursor-pointer h-52 hover:shadow-xl transition-all duration-500"
                onClick={() => setViewMode('map')}
              >
                <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center opacity-40">
                  <div className="w-full h-full bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition duration-500 group-hover:shadow-lg ring-4 ring-indigo-50">
                    <Navigation size={32} className="text-indigo-600" />
                  </div>
                  <p className="text-sm font-black text-gray-900">{record.cityName || '-'}, {record.stateName || '-'}</p>
                  <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-[0.2em]">{(record.id || '').substring(0, 8)}</p>

                  <button
                    onClick={handleOpenExternalMap}
                    className="mt-4 flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest group-hover:translate-y-[-2px] transition-transform"
                  >
                    Mở bản đồ trực tuyến <ExternalLink size={12} />
                  </button>
                </div>

                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live View</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
              <Check size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">Thông tin đã xác thực</p>
              <p className="text-xs text-gray-400 font-medium tracking-tight">Cập nhật lần cuối bởi Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-8 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition active:scale-95 border border-gray-200">
              Lịch sử thay đổi
            </button>
            <button className="px-12 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition active:scale-95 flex items-center gap-2">
              <Pencil size={18} /> Chỉnh sửa tin
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Lightbox Overlay */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-2xl flex flex-col animate-fadeIn">
          <div className="flex items-center justify-between p-6 text-white relative z-10">
            <div>
              <h4 className="font-bold text-lg">{record.name}</h4>
              <p className="text-xs text-gray-400">Hình ảnh {currentImageIndex + 1} / {safeImages.length}</p>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
            >
              <X size={28} />
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center p-4">
            <button
              onClick={prevImage}
              className="absolute left-8 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all group active:scale-90"
            >
              <ChevronLeft size={48} className="group-hover:-translate-x-1 transition-transform" />
            </button>

            <img
              src={safeImages[currentImageIndex]}
              className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-scaleIn"
              alt="Lightbox Main"
            />

            <button
              onClick={nextImage}
              className="absolute right-8 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all group active:scale-90"
            >
              <ChevronRight size={48} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="p-8 flex items-center justify-center gap-4 overflow-x-auto">
            {safeImages.map((img, i) => (
              <button
                key={i}
                onClick={() => setCurrentImageIndex(i)}
                className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  currentImageIndex === i
                    ? 'border-indigo-500 scale-110 opacity-100 shadow-xl shadow-indigo-500/20'
                    : 'border-transparent opacity-40 hover:opacity-100'
                }`}
              >
                <img src={img} className="w-full h-full object-cover" alt={`thumb-lb-${i}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .scale-up { animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.9) translateY(40px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default PropertyDetailModal;


// import React, { useState } from 'react';
// import { 
//   X, 
//   Check, 
//   Pencil, 
//   MapPin, 
//   Bed, 
//   Bath, 
//   Maximize, 
//   Layers, 
//   Eye, 
//   Hash, 
//   Calendar, 
//   RefreshCw, 
//   Globe, 
//   Navigation, 
//   ExternalLink, 
//   Tag,
//   Building2,
//   ChevronLeft,
//   ChevronRight,
//   Image as ImageIcon
// } from 'lucide-react';

// export interface HouseRecord {
//   id: string;
//   source: string;
//   externalId: number;
//   name: string;
//   description: string;
//   location: string;
//   imagesJson: string[];
//   typeLabel: string;
//   statusLabel: string;
//   isFeatured: boolean;
//   numberBedroom: number;
//   numberBathroom: number;
//   numberFloor: number;
//   square: number;
//   priceFormatted: string;
//   currencySymbol: string;
//   cityName: string;
//   stateName: string;
//   uniqueId: string;
//   sourceCreatedAt: string;
//   syncedAt: string;
//   views: number;
// }

// interface PropertyDetailModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   record: HouseRecord | null;
// }

// const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({ isOpen, onClose, record }) => {
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [isLightboxOpen, setIsLightboxOpen] = useState(false);
//   const [viewMode, setViewMode] = useState<'gallery' | 'map'>('gallery');

//   if (!isOpen || !record) return null;

//   const nextImage = (e?: React.MouseEvent) => {
//     e?.stopPropagation();
//     setCurrentImageIndex((prev) => (prev + 1) % record.imagesJson.length);
//   };

//   const prevImage = (e?: React.MouseEvent) => {
//     e?.stopPropagation();
//     setCurrentImageIndex((prev) => (prev - 1 + record.imagesJson.length) % record.imagesJson.length);
//   };

//   const handleOpenExternalMap = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.location + ' ' + record.cityName)}`;
//     window.open(url, '_blank');
//   };

//   const getStatusBadge = (status: string) => {
//     const base = "px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md shadow-sm ";
//     if (status === 'Đang bán') return base + "bg-emerald-500 text-white shadow-emerald-100";
//     if (status === 'Đã bán') return base + "bg-gray-400 text-white shadow-gray-100";
//     return base + "bg-rose-500 text-white shadow-rose-100";
//   };

//   // Robust Embed URL for keyless use
//   const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(record.location + ' ' + record.cityName)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

//   return (
//     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
//       {/* Main Backdrop */}
//       <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md animate-fadeIn" onClick={onClose}></div>
      
//       <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col relative z-10 scale-up border border-indigo-50">
//         {/* Header */}
//         <div className="p-6 md:p-8 border-b border-gray-50 flex items-start justify-between bg-gradient-to-b from-gray-50 to-white">
//           <div className="flex gap-4">
//             <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
//               <Building2 size={32} />
//             </div>
//             <div>
//               <div className="flex items-center gap-3 mb-1">
//                 <h2 className="text-2xl font-black text-gray-900 tracking-tight">{record.name}</h2>
//                 {record.isFeatured && (
//                   <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1">
//                     <Tag size={10} /> Nổi bật
//                   </span>
//                 )}
//               </div>
//               <div className="flex items-center gap-4 text-gray-400 text-sm font-semibold">
//                 <span className="flex items-center gap-1 cursor-pointer hover:text-indigo-600 transition" onClick={handleOpenExternalMap}>
//                   <MapPin size={14} className="text-rose-500" /> {record.location}
//                 </span>
//                 <span className="text-gray-200">|</span>
//                 <span className="flex items-center gap-1 uppercase tracking-wider text-xs font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{record.source}</span>
//               </div>
//             </div>
//           </div>
//           <button onClick={onClose} className="p-3 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all text-gray-400 bg-white shadow-sm border border-gray-100">
//             <X size={24} />
//           </button>
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Left Column: Image & Details */}
//             <div className="lg:col-span-2 space-y-8">
              
//               {/* Primary View Area (Gallery or Map) */}
//               <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100/50 group bg-gray-100 border border-gray-100">
//                 {viewMode === 'gallery' ? (
//                   <div className="w-full h-full cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
//                     <img 
//                       src={record.imagesJson[currentImageIndex]} 
//                       className="w-full h-full object-cover transition duration-700 group-hover:scale-105" 
//                       alt={`Property Image ${currentImageIndex + 1}`} 
//                     />
                    
//                     {/* Navigation Arrows */}
//                     {record.imagesJson.length > 1 && (
//                       <>
//                         <button 
//                           onClick={prevImage}
//                           className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-900 opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-white"
//                         >
//                           <ChevronLeft size={20} />
//                         </button>
//                         <button 
//                           onClick={nextImage}
//                           className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-gray-900 opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-white"
//                         >
//                           <ChevronRight size={20} />
//                         </button>
//                       </>
//                     )}

//                     <div className="absolute top-4 right-4 flex gap-2">
//                        <span className={getStatusBadge(record.statusLabel)}>{record.statusLabel}</span>
//                     </div>

//                     <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between pointer-events-none">
//                        <div className="flex -space-x-3 pointer-events-auto">
//                          {record.imagesJson.map((img, i) => (
//                            <button 
//                             key={i} 
//                             onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
//                             className={`w-12 h-12 rounded-xl border-2 transition-all object-cover shadow-lg overflow-hidden ${currentImageIndex === i ? 'border-indigo-500 scale-110 z-10' : 'border-white hover:scale-105'}`}
//                            >
//                              <img src={img} className="w-full h-full object-cover" alt={`thumb-${i}`} />
//                            </button>
//                          ))}
//                        </div>
//                        <div className="flex gap-2 pointer-events-auto">
//                           <button 
//                             onClick={(e) => { e.stopPropagation(); setViewMode('map'); }}
//                             className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
//                           >
//                             <Navigation size={14} /> Xem bản đồ
//                           </button>
//                           <button 
//                             onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(true); }}
//                             className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-white transition-all active:scale-95"
//                           >
//                             <Eye size={14} /> Xem {record.imagesJson.length} ảnh
//                           </button>
//                        </div>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="w-full h-full relative bg-indigo-50">
//                     <iframe 
//                       src={mapUrl} 
//                       width="100%" 
//                       height="100%" 
//                       style={{ border: 0 }} 
//                       allowFullScreen={true} 
//                       loading="lazy"
//                       title="Property Location"
//                       className="w-full h-full"
//                     ></iframe>
                    
//                     {/* Map Controls */}
//                     <div className="absolute bottom-6 right-6 flex gap-2">
//                       <button 
//                         onClick={() => setViewMode('gallery')}
//                         className="bg-white shadow-xl px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95 text-indigo-600 border border-indigo-50"
//                       >
//                         <ImageIcon size={14} /> Quay lại xem ảnh
//                       </button>
//                       <button 
//                         onClick={handleOpenExternalMap}
//                         className="bg-indigo-600 text-white shadow-xl px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95"
//                       >
//                         <ExternalLink size={14} /> Mở bản đồ Google
//                       </button>
//                     </div>

//                     <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-gray-100 max-w-[240px]">
//                       <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider mb-0.5 flex items-center gap-1">
//                         <MapPin size={10} /> Vị trí chính xác
//                       </p>
//                       <p className="text-xs font-bold text-gray-800 line-clamp-2">{record.location}</p>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 <div className="bg-indigo-50/50 p-5 rounded-3xl border border-indigo-100/50 text-center group hover:bg-indigo-600 transition-colors duration-500">
//                   <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition">
//                     <Bed className="text-indigo-600" size={20} />
//                   </div>
//                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-indigo-100 transition">Phòng ngủ</p>
//                   <p className="text-xl font-black text-gray-900 group-hover:text-white transition">{record.numberBedroom}</p>
//                 </div>
//                 <div className="bg-rose-50/50 p-5 rounded-3xl border border-rose-100/50 text-center group hover:bg-rose-600 transition-colors duration-500">
//                   <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition">
//                     <Bath className="text-rose-600" size={20} />
//                   </div>
//                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-rose-100 transition">Nhà tắm</p>
//                   <p className="text-xl font-black text-gray-900 group-hover:text-white transition">{record.numberBathroom}</p>
//                 </div>
//                 <div className="bg-emerald-50/50 p-5 rounded-3xl border border-emerald-100/50 text-center group hover:bg-emerald-600 transition-colors duration-500">
//                   <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition">
//                     <Maximize className="text-emerald-600" size={20} />
//                   </div>
//                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-emerald-100 transition">Diện tích</p>
//                   <p className="text-xl font-black text-gray-900 group-hover:text-white transition">{record.square} <span className="text-xs font-medium">m²</span></p>
//                 </div>
//                 <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100/50 text-center group hover:bg-blue-600 transition-colors duration-500">
//                   <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition">
//                     <Layers className="text-blue-600" size={20} />
//                   </div>
//                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-100 transition">Số tầng</p>
//                   <p className="text-xl font-black text-gray-900 group-hover:text-white transition">{record.numberFloor || 1}</p>
//                 </div>
//               </div>

//               <div>
//                 <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
//                   <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div> Mô tả chi tiết
//                 </h4>
//                 <div className="text-gray-600 leading-loose font-medium text-sm bg-gray-50/50 p-6 rounded-3xl border border-gray-100 italic">
//                   {record.description}
//                 </div>
//               </div>
//             </div>

//             {/* Right Column: Key Metrics & Info */}
//             <div className="space-y-6">
//               <div className="bg-indigo-900 text-white p-8 rounded-[2rem] shadow-2xl shadow-indigo-200 relative overflow-hidden group">
//                 <div className="relative z-10">
//                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-2">Giá niêm yết</p>
//                   <div className="flex items-baseline gap-2">
//                     <span className="text-4xl font-black">{record.priceFormatted}</span>
//                     <span className="text-indigo-400 font-bold">{record.currencySymbol}</span>
//                   </div>
//                   <div className="mt-8 pt-6 border-t border-indigo-800 flex items-center justify-between">
//                      <div className="flex items-center gap-2">
//                        <div className="w-8 h-8 bg-indigo-800 rounded-full flex items-center justify-center group-hover:bg-indigo-700 transition">
//                          <Eye size={14} className="text-indigo-400" />
//                        </div>
//                        <span className="text-sm font-bold">{record.views.toLocaleString()} <span className="text-indigo-400 font-medium">Lượt xem</span></span>
//                      </div>
//                      <button className="p-2 bg-indigo-700 rounded-xl hover:bg-white hover:text-indigo-900 transition active:scale-95">
//                        <RefreshCw size={18} />
//                      </button>
//                   </div>
//                 </div>
//                 <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 blur-3xl rounded-full"></div>
//               </div>

//               <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-5">
//                 <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Thông tin hệ thống</h4>
//                 <div className="space-y-4">
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="flex items-center gap-2 text-gray-400 font-semibold"><Hash size={14} /> Mã SKU</span>
//                     <span className="font-mono font-black text-gray-700">{record.uniqueId}</span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="flex items-center gap-2 text-gray-400 font-semibold"><Calendar size={14} /> Ngày tạo</span>
//                     <span className="font-bold text-gray-700">{record.sourceCreatedAt}</span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="flex items-center gap-2 text-gray-400 font-semibold"><RefreshCw size={14} /> Lần cuối đồng bộ</span>
//                     <span className="font-bold text-indigo-600">{record.syncedAt}</span>
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="flex items-center gap-2 text-gray-400 font-semibold"><Globe size={14} /> Dự án</span>
//                     <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-black uppercase text-[10px] tracking-wider">{record.source}</span>
//                   </div>
//                 </div>
//               </div>

//               <div 
//                 className="relative bg-gray-50 rounded-[2rem] border border-gray-100 overflow-hidden group cursor-pointer h-52 hover:shadow-xl transition-all duration-500"
//                 onClick={() => setViewMode('map')}
//               >
//                  {/* Stylized Map Background */}
//                  <div className="absolute inset-0 bg-indigo-50 flex items-center justify-center opacity-40">
//                    <div className="w-full h-full bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
//                  </div>
                 
//                  <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
//                     <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition duration-500 group-hover:shadow-lg ring-4 ring-indigo-50">
//                         <Navigation size={32} className="text-indigo-600" />
//                     </div>
//                     <p className="text-sm font-black text-gray-900">{record.cityName}, {record.stateName}</p>
//                     <p className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-[0.2em]">{record.id.substring(0, 8)}</p>
                    
//                     <button 
//                       onClick={handleOpenExternalMap}
//                       className="mt-4 flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest group-hover:translate-y-[-2px] transition-transform"
//                     >
//                       Mở bản đồ trực tuyến <ExternalLink size={12} />
//                     </button>
//                  </div>

//                  {/* Pulse indicator for interactive card */}
//                  <div className="absolute top-4 right-4 flex items-center gap-2">
//                     <span className="relative flex h-2 w-2">
//                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
//                       <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
//                     </span>
//                     <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Live View</span>
//                  </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="p-8 border-t border-gray-50 flex items-center justify-between bg-white">
//           <div className="flex items-center gap-3">
//              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
//                 <Check size={24} />
//              </div>
//              <div>
//                <p className="text-sm font-black text-gray-900">Thông tin đã xác thực</p>
//                <p className="text-xs text-gray-400 font-medium tracking-tight">Cập nhật lần cuối bởi Admin</p>
//              </div>
//           </div>
//           <div className="flex items-center gap-3">
//             <button className="px-8 py-4 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition active:scale-95 border border-gray-200">
//               Lịch sử thay đổi
//             </button>
//             <button className="px-12 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition active:scale-95 flex items-center gap-2">
//               <Pencil size={18} /> Chỉnh sửa tin
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Full Screen Lightbox Overlay */}
//       {isLightboxOpen && (
//         <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-2xl flex flex-col animate-fadeIn">
//           <div className="flex items-center justify-between p-6 text-white relative z-10">
//             <div>
//               <h4 className="font-bold text-lg">{record.name}</h4>
//               <p className="text-xs text-gray-400">Hình ảnh {currentImageIndex + 1} / {record.imagesJson.length}</p>
//             </div>
//             <button 
//               onClick={() => setIsLightboxOpen(false)}
//               className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
//             >
//               <X size={28} />
//             </button>
//           </div>

//           <div className="flex-1 relative flex items-center justify-center p-4">
//              <button 
//                 onClick={prevImage}
//                 className="absolute left-8 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all group active:scale-90"
//              >
//                <ChevronLeft size={48} className="group-hover:-translate-x-1 transition-transform" />
//              </button>

//              <img 
//               src={record.imagesJson[currentImageIndex]} 
//               className="max-h-full max-w-full object-contain rounded-lg shadow-2xl animate-scaleIn" 
//               alt="Lightbox Main" 
//              />

//              <button 
//                 onClick={nextImage}
//                 className="absolute right-8 p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all group active:scale-90"
//              >
//                <ChevronRight size={48} className="group-hover:translate-x-1 transition-transform" />
//              </button>
//           </div>

//           <div className="p-8 flex items-center justify-center gap-4 overflow-x-auto">
//             {record.imagesJson.map((img, i) => (
//               <button 
//                 key={i} 
//                 onClick={() => setCurrentImageIndex(i)}
//                 className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${currentImageIndex === i ? 'border-indigo-500 scale-110 opacity-100 shadow-xl shadow-indigo-500/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
//               >
//                 <img src={img} className="w-full h-full object-cover" alt={`thumb-lb-${i}`} />
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       <style>{`
//         .scale-up {
//           animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
//         }
//         @keyframes scaleUp {
//           from { opacity: 0; transform: scale(0.9) translateY(40px); }
//           to { opacity: 1; transform: scale(1) translateY(0); }
//         }
//         @keyframes scaleIn {
//           from { opacity: 0; transform: scale(0.95); }
//           to { opacity: 1; transform: scale(1); }
//         }
//       `}</style>
//     </div>
//   );
// };

// export default PropertyDetailModal;
