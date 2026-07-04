import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Plus, X, Trash2, Move } from 'lucide-react';

export type Unit = {
  code: string;
  status: string;
  type?: string;
  area?: string;
  price?: string;
  direction?: string;
  y: number;
  x: number;
};

export type FloorPlan = {
  name: string;
  image: string;
  blocks?: string;
  units?: Unit[];
};

type StatusKey = 'available' | 'sold' | 'reserved' | 'locked';

const STATUS_META: Record<StatusKey, { color: string; label: string }> = {
  available: { color: '#16a34a', label: 'Còn' },
  sold: { color: '#dc2626', label: 'Đã bán' },
  reserved: { color: '#d97706', label: 'Giữ chỗ' },
  locked: { color: '#64748b', label: 'Khoá' },
};

// Chuẩn hoá chuỗi trạng thái (VN/EN) về 1 nhóm màu
const normStatus = (raw?: string): StatusKey => {
  const s = (raw || '').toLowerCase().trim();
  if (/(đã bán|da ban|sold|hết|het)/.test(s)) return 'sold';
  if (/(giữ chỗ|giu cho|đặt chỗ|dat cho|reserv|cọc|coc|hold)/.test(s)) return 'reserved';
  if (/(khoá|khoa|lock|ẩn|an)/.test(s)) return 'locked';
  return 'available'; // "còn", "available", trống -> còn
};

const statusColor = (raw?: string) => STATUS_META[normStatus(raw)].color;

const STATUS_OPTIONS = ['Còn', 'Giữ chỗ', 'Đã bán', 'Khoá'];

const esc = (v?: string) =>
  (v || '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );

const FloorPlanMap: React.FC<{
  floorplan: FloorPlan;
  isAdmin: boolean;
  onChange: (updated: FloorPlan) => void;
}> = ({ floorplan, isAdmin, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const [imgError, setImgError] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<StatusKey>>(
    new Set(['available', 'sold', 'reserved', 'locked'])
  );
  // Form gắn/sửa pin: {index} là vị trí trong units, y/x toạ độ
  const [form, setForm] = useState<
    | (Partial<Unit> & { y: number; x: number; index: number | null })
    | null
  >(null);

  const units = floorplan.units || [];

  // giữ ref tới các giá trị mới nhất để callback Leaflet dùng
  const stateRef = useRef({ editMode, floorplan, activeFilters });
  stateRef.current = { editMode, floorplan, activeFilters };

  const summary = useMemo(() => {
    const c = { available: 0, sold: 0, reserved: 0, locked: 0 };
    units.forEach((u) => { c[normStatus(u.status)]++; });
    return c;
  }, [units]);

  // Tạo bản đồ 1 lần khi mount / khi ảnh đổi
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = containerRef.current;
    if (!el || !floorplan.image) { setImgError(!floorplan.image); return; }

    let map: L.Map | null = null;
    let cancelled = false;
    setImgError(false);

    const img = new Image();
    img.onload = () => {
      if (cancelled || !containerRef.current) return;
      const w = img.naturalWidth || 1000;
      const h = img.naturalHeight || 700;
      const bounds: L.LatLngBoundsExpression = [[0, 0], [h, w]];

      map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -3,
        maxZoom: 3,
        attributionControl: false,
        zoomControl: true,
      });
      mapRef.current = map;
      L.imageOverlay(floorplan.image, bounds).addTo(map);
      map.fitBounds(bounds as L.LatLngBoundsExpression);
      map.setMaxBounds((bounds as any));

      const layer = L.layerGroup().addTo(map);
      markerLayerRef.current = layer;

      // Click bản đồ để gắn pin mới (chỉ khi đang bật chế độ gắn vị trí)
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (!stateRef.current.editMode) return;
        setForm({ y: e.latlng.lat, x: e.latlng.lng, index: null, status: 'Còn' });
      });

      renderMarkers();
    };
    img.onerror = () => { if (!cancelled) setImgError(true); };
    img.src = floorplan.image;

    return () => {
      cancelled = true;
      if (map) { map.remove(); }
      mapRef.current = null;
      markerLayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [floorplan.image]);

  // Vẽ lại markers khi units / filter / editMode đổi
  const renderMarkers = () => {
    const layer = markerLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();
    const { editMode: em, floorplan: fp, activeFilters: filters } = stateRef.current;
    (fp.units || []).forEach((u, idx) => {
      const key = normStatus(u.status);
      if (!filters.has(key)) return;
      const color = STATUS_META[key].color;
      const marker = L.circleMarker([u.y, u.x], {
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 0.95,
        draggable: em && isAdmin,
      } as any);

      const popupHtml =
        `<div style="min-width:170px;font-size:13px;line-height:1.5">
          <div style="font-weight:800;margin-bottom:4px">${esc(u.code) || 'Căn'}</div>
          ${u.type ? `<div><b>Loại:</b> ${esc(u.type)}</div>` : ''}
          ${u.area ? `<div><b>Diện tích:</b> ${esc(u.area)}</div>` : ''}
          ${u.price ? `<div><b>Giá:</b> ${esc(u.price)}</div>` : ''}
          ${u.direction ? `<div><b>Hướng:</b> ${esc(u.direction)}</div>` : ''}
          <div style="margin-top:4px"><span style="display:inline-block;padding:2px 8px;border-radius:6px;color:#fff;font-weight:700;background:${color}">${STATUS_META[key].label}</span></div>
          ${em && isAdmin
            ? `<div style="margin-top:8px;display:flex;gap:6px">
                 <button data-edit="${idx}" style="flex:1;padding:4px 6px;border-radius:6px;border:1px solid #c7d2fe;background:#eef2ff;color:#4338ca;font-weight:700;cursor:pointer">Sửa</button>
                 <button data-del="${idx}" style="flex:1;padding:4px 6px;border-radius:6px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;font-weight:700;cursor:pointer">Xoá</button>
               </div>`
            : ''}
        </div>`;
      marker.bindPopup(popupHtml);
      marker.bindTooltip(esc(u.code) || `#${idx + 1}`, {
        permanent: true,
        direction: 'top',
        offset: [0, -6],
        className: 'fp-unit-tip',
      });

      marker.on('popupopen', (e: any) => {
        const node: HTMLElement = e.popup.getElement();
        if (!node) return;
        const editBtn = node.querySelector('[data-edit]') as HTMLElement | null;
        const delBtn = node.querySelector('[data-del]') as HTMLElement | null;
        editBtn?.addEventListener('click', () => {
          const cur = stateRef.current.floorplan.units?.[idx];
          if (cur) setForm({ ...cur, index: idx });
          map.closePopup();
        });
        delBtn?.addEventListener('click', () => {
          const next = { ...stateRef.current.floorplan };
          next.units = (next.units || []).filter((_, j) => j !== idx);
          onChange(next);
          map.closePopup();
        });
      });

      if (em && isAdmin) {
        marker.on('dragend', (e: any) => {
          const ll = e.target.getLatLng();
          const next = { ...stateRef.current.floorplan };
          const arr = [...(next.units || [])];
          if (arr[idx]) { arr[idx] = { ...arr[idx], y: ll.lat, x: ll.lng }; next.units = arr; onChange(next); }
        });
      }
      marker.addTo(layer);
    });
  };

  useEffect(() => {
    renderMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, activeFilters, editMode]);

  const toggleFilter = (k: StatusKey) => {
    setActiveFilters((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  };

  const submitForm = () => {
    if (!form) return;
    const next: FloorPlan = { ...floorplan };
    const arr = [...(next.units || [])];
    const unit: Unit = {
      code: form.code || '',
      status: form.status || 'Còn',
      type: form.type || '',
      area: form.area || '',
      price: form.price || '',
      direction: form.direction || '',
      y: form.y,
      x: form.x,
    };
    if (form.index === null || form.index === undefined) arr.push(unit);
    else arr[form.index] = unit;
    next.units = arr;
    onChange(next);
    setForm(null);
  };

  if (imgError || !floorplan.image) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 h-[480px] flex flex-col items-center justify-center text-slate-400 gap-2">
        <MapPin className="w-8 h-8" />
        <p className="font-semibold text-sm">Chưa có ảnh mặt bằng — thêm ảnh ở chế độ Sửa.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Thanh điều khiển: chú thích + lọc + tổng hợp */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(STATUS_META) as StatusKey[]).map((k) => {
            const on = activeFilters.has(k);
            const m = STATUS_META[k];
            return (
              <button
                key={k}
                onClick={() => toggleFilter(k)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                  on ? 'bg-white border-slate-300 text-slate-700 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color, opacity: on ? 1 : 0.4 }} />
                {m.label}
              </button>
            );
          })}
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditMode((v) => !v); setForm(null); }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition-all ${
              editMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Move className="w-3.5 h-3.5" /> {editMode ? 'Đang gắn vị trí — bấm để tắt' : 'Gắn vị trí căn'}
          </button>
        )}
      </div>

      <div className="text-sm font-bold text-slate-600">
        Tổng {units.length} căn ·{' '}
        <span className="text-emerald-600">Còn {summary.available}</span> ·{' '}
        <span className="text-rose-600">Đã bán {summary.sold}</span> ·{' '}
        <span className="text-amber-600">Giữ chỗ {summary.reserved}</span>
        {summary.locked > 0 && <> · <span className="text-slate-500">Khoá {summary.locked}</span></>}
      </div>

      {editMode && isAdmin && (
        <div className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
          Bấm vào ảnh mặt bằng để gắn một căn mới. Kéo các điểm đã gắn để chỉnh vị trí. Bấm điểm để Sửa/Xoá.
        </div>
      )}

      <div className="relative">
        <div
          ref={containerRef}
          className="w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-50"
          style={{ height: 480 }}
        />
      </div>

      {/* Form gắn / sửa pin */}
      {form && isAdmin && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4" onClick={() => setForm(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 flex items-center gap-2">
                {form.index === null ? <Plus className="w-4 h-4 text-indigo-600" /> : <Move className="w-4 h-4 text-indigo-600" />}
                {form.index === null ? 'Gắn căn mới' : 'Sửa căn'}
              </h4>
              <button onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input autoFocus value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Mã căn" className="col-span-2 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              <input value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Loại" className="p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              <input value={form.area || ''} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="Diện tích" className="p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              <input value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Giá" className="p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              <input value={form.direction || ''} onChange={(e) => setForm({ ...form, direction: e.target.value })} placeholder="Hướng" className="p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              <select value={form.status || 'Còn'} onChange={(e) => setForm({ ...form, status: e.target.value })} className="col-span-2 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200 font-bold">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              {form.index !== null && (
                <button
                  onClick={() => {
                    const next = { ...floorplan };
                    next.units = (next.units || []).filter((_, j) => j !== form.index);
                    onChange(next);
                    setForm(null);
                  }}
                  className="px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-black text-sm flex items-center gap-1.5 hover:bg-rose-100"
                >
                  <Trash2 className="w-4 h-4" /> Xoá
                </button>
              )}
              <button onClick={submitForm} className="flex-1 px-3 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-700">
                Lưu vị trí
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlanMap;
