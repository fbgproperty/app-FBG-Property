import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Loader2, Info, Image as ImageIcon, GraduationCap, Grid3x3,
  LayoutGrid, Building2, Camera, FileText, Calendar, Newspaper, Sparkles, Save,
  Plus, Trash2, RefreshCw, ExternalLink, BookOpen, Map as MapIcon, Wand2, Bell,
} from 'lucide-react';
import { api } from '../../../services/apiService';
import FloorPlanMap from './FloorPlanMap';

const FALLBACK = 'https://placehold.co/800x500/eef2ff/6366f1?text=FBG+Property';

// Chuẩn hoá trạng thái căn (VN/EN) -> nhóm màu chung, dùng cho tab Quỹ căn
type UnitStatusKey = 'available' | 'sold' | 'reserved' | 'locked';
const UNIT_STATUS_META: Record<UnitStatusKey, { color: string; badge: string; label: string }> = {
  available: { color: '#16a34a', badge: 'bg-emerald-50 text-emerald-600', label: 'Còn' },
  sold: { color: '#dc2626', badge: 'bg-rose-50 text-rose-600', label: 'Đã bán' },
  reserved: { color: '#d97706', badge: 'bg-amber-50 text-amber-600', label: 'Giữ chỗ' },
  locked: { color: '#64748b', badge: 'bg-slate-100 text-slate-500', label: 'Khoá' },
};
const normUnitStatus = (raw?: string): UnitStatusKey => {
  const s = (raw || '').toLowerCase().trim();
  if (/(đã bán|da ban|sold|hết|het)/.test(s)) return 'sold';
  if (/(giữ chỗ|giu cho|đặt chỗ|dat cho|reserv|cọc|coc|hold)/.test(s)) return 'reserved';
  if (/(khoá|khoa|lock|ẩn)/.test(s)) return 'locked';
  return 'available';
};

type TabId =
  | 'overview' | 'location' | 'training' | 'subdivision' | 'floorplan'
  | 'units' | 'photos360' | 'salesPolicy' | 'progress' | 'documents' | 'news';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'overview', label: 'Tổng quan', icon: Info },
  { id: 'location', label: 'Vị trí', icon: MapIcon },
  { id: 'training', label: 'Đào tạo', icon: GraduationCap },
  { id: 'subdivision', label: 'Phân khu', icon: Grid3x3 },
  { id: 'floorplan', label: 'Mặt bằng quỹ căn', icon: LayoutGrid },
  { id: 'units', label: 'Quỹ căn', icon: Building2 },
  { id: 'photos360', label: 'Ảnh 360°', icon: Camera },
  { id: 'salesPolicy', label: 'Chính sách bán hàng', icon: FileText },
  { id: 'progress', label: 'Tiến độ', icon: Calendar },
  { id: 'documents', label: 'Tài liệu', icon: BookOpen },
  { id: 'news', label: 'Tin tức', icon: Newspaper },
];

const emptyContent = (slug: string) => ({
  slug,
  overview: '',
  location: { text: '' },
  training: { notebooklmUrl: '', items: [] as { q: string; a: string }[] },
  subdivisions: [] as { name: string; desc: string; image: string }[],
  floorplans: [] as {
    name: string; image: string; blocks?: string;
    units?: { code: string; status: string; type?: string; area?: string; price?: string; direction?: string; y: number; x: number }[];
  }[],
  units: [] as { code: string; type: string; area: string; price: string; direction: string; status: string }[],
  photos360: [] as { name: string; url: string }[],
  salesPolicy: '',
  progress: [] as { date: string; title: string; desc: string }[],
  documents: { driveFolderUrl: '', files: [] as { name: string; url: string }[] },
  news: [] as { title: string; url: string; date: string }[],
});

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const slug = id || '';
  const navigate = useNavigate();
  const isAdmin = (typeof localStorage !== 'undefined' && localStorage.getItem('salesagent_level')) === 'admin';

  const [detail, setDetail] = useState<any | null>(null);
  const [content, setContent] = useState<any>(emptyContent(slug));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('overview');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [aiBusy, setAiBusy] = useState<string>('');
  const [heroIdx, setHeroIdx] = useState(0);
  const [fpIdx, setFpIdx] = useState(0);
  const [unitFilter, setUnitFilter] = useState<UnitStatusKey | 'all'>('all');
  const [ragQ, setRagQ] = useState('');
  const [ragA, setRagA] = useState<any>(null);
  const [ragBusy, setRagBusy] = useState(false);
  const [enrichBusy, setEnrichBusy] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetBusy, setSheetBusy] = useState(false);
  const [docSyncBusy, setDocSyncBusy] = useState(false);
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const flash = (kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 6000);
  };
  const askRag = async () => {
    if (!ragQ.trim()) return;
    setRagBusy(true); setRagA(null);
    try { setRagA(await api.ragAsk(ragQ, detail?.name)); }
    catch (e: any) { setRagA({ answer: '⚠️ ' + (e?.message || 'lỗi') }); }
    finally { setRagBusy(false); }
  };

  // Nạp lại nội dung dự án (project-content) — dùng chung cho lần đầu và sau khi AI đồng bộ.
  const loadContent = useCallback(async () => {
    if (!slug) return;
    const c = await api.getProjectContent(slug).catch(() => ({}));
    setContent({ ...emptyContent(slug), ...(c || {}), slug });
    setSheetUrl((c as any)?.unitsSheetUrl || '');
    setDirty(false);
  }, [slug]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!slug) return;
      setLoading(true); setError(null);
      try {
        const [d, c] = await Promise.all([
          api.getProjectDetail(slug),
          api.getProjectContent(slug).catch(() => ({})),
        ]);
        if (!alive) return;
        setDetail(d);
        setContent({ ...emptyContent(slug), ...(c || {}), slug });
        setSheetUrl((c as any)?.unitsSheetUrl || '');
      } catch (e: any) {
        if (alive) setError(e?.message || 'Không thể tải chi tiết dự án.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  const patch = useCallback((updater: (c: any) => any) => {
    setContent((prev: any) => updater({ ...prev }));
    setDirty(true);
  }, []);

  const save = async (payload?: any) => {
    setSaving(true);
    try {
      await api.saveProjectContent(slug, payload ?? content);
      setDirty(false);
    } catch (e: any) {
      alert(e?.message || 'Lỗi lưu nội dung');
    } finally {
      setSaving(false);
    }
  };

  // Cập nhật 1 mặt bằng (kèm vị trí căn đã gắn) rồi lưu ngay lên máy chủ
  const updateFloorplan = useCallback((i: number, updated: any) => {
    setContent((prev: any) => {
      const a = [...(prev.floorplans || [])];
      a[i] = updated;
      const next = { ...prev, floorplans: a };
      save(next);
      return next;
    });
  }, [slug]);

  const aiDraft = async (tabKey: string, into: (text: string, training?: any) => void) => {
    setAiBusy(tabKey);
    try {
      const ctx = content.documents?.files?.map((f: any) => f.name).join(', ') || '';
      const r = await api.aiDraftProject({ tab: tabKey, projectName: detail?.name || slug, context: ctx });
      into(r.text || '', r.training);
      setDirty(true);
    } catch (e: any) {
      alert(e?.message || 'AI lỗi');
    } finally {
      setAiBusy('');
    }
  };

  const syncDrive = async () => {
    const url = content.documents?.driveFolderUrl;
    if (!url) { alert('Dán link folder Google Drive trước.'); return; }
    setAiBusy('drive');
    try {
      const r = await api.driveList(url);
      if (r.error) { alert('Drive: ' + r.error); }
      patch((c) => ({ ...c, documents: { ...c.documents, files: r.files || [] } }));
    } catch (e: any) {
      alert(e?.message || 'Lỗi đồng bộ Drive');
    } finally {
      setAiBusy('');
    }
  };

  // AI đồng bộ dữ liệu dự án: tự động điền các mục nội dung rồi nạp lại tab.
  const enrichProject = async () => {
    setEnrichBusy(true); setToast(null);
    try {
      const r = await api.projectEnrich(slug);
      if (r.ok) {
        await loadContent();
        const filled = (r.filled && r.filled.length) ? r.filled.join(', ') : 'các mục nội dung';
        flash('ok', `Đã đồng bộ: ${filled}`);
      } else {
        flash('err', r.error || 'Đồng bộ dữ liệu dự án thất bại. Vui lòng thử lại.');
      }
    } catch (e: any) {
      flash('err', e?.message || 'Đồng bộ dữ liệu dự án thất bại.');
    } finally {
      setEnrichBusy(false);
    }
  };

  // Đồng bộ bảng hàng (quỹ căn) từ Google Trang tính.
  const syncUnitsSheet = async () => {
    const url = (sheetUrl || '').trim();
    if (!url) { flash('err', 'Dán link Google Trang tính bảng hàng trước.'); return; }
    setSheetBusy(true); setToast(null);
    try {
      const r = await api.projectUnitsSyncSheet(slug, url);
      if (r.error) {
        flash('err', r.error);
      } else {
        await loadContent();
        flash('ok', `Đã đồng bộ ${r.count ?? 0} căn`);
      }
    } catch (e: any) {
      flash('err', e?.message || 'Đồng bộ bảng hàng thất bại.');
    } finally {
      setSheetBusy(false);
    }
  };

  // Đồng bộ tài liệu dự án từ kho tài liệu AI.
  const syncDocs = async () => {
    setDocSyncBusy(true);
    try {
      const r = await api.projectDocumentsSync(slug, detail?.name || slug);
      if (r.ok) {
        await loadContent();
        flash('ok', 'Đã đồng bộ ' + (r.count || 0) + ' tài liệu');
      } else flash('err', r.error || 'Chưa có tài liệu');
    } catch (e: any) {
      flash('err', e?.message || 'Lỗi');
    } finally {
      setDocSyncBusy(false);
    }
  };

  // Gửi thông báo & xin ý kiến về dự án tới đội ngũ kinh doanh.
  const notifyStaff = async () => {
    if (!window.confirm('Gửi thông báo & xin ý kiến về dự án này tới đội ngũ kinh doanh?')) return;
    setNotifyBusy(true);
    try {
      const r = await api.projectNotify(detail?.name || slug, { ask: true });
      flash('ok', 'Đã gửi thông báo cho ' + (r.sent || 0) + ' nhân sự');
    } catch (e: any) {
      flash('err', e?.message || 'Lỗi');
    } finally {
      setNotifyBusy(false);
    }
  };

  const images: string[] = useMemo(
    () => (detail?.images?.length ? detail.images : [detail?.imageUrl || FALLBACK]),
    [detail]
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-600">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-medium">Đang tải chi tiết dự án...</p>
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-2">{error ?? 'Không tìm thấy dự án.'}</p>
        <button onClick={() => navigate('/bat-dong-san/du-an-bds')} className="text-indigo-600 font-bold hover:underline">Quay lại danh sách</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate('/bat-dong-san/du-an-bds')} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 text-gray-500 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-md shrink-0 border-2 border-white">
            <img src={detail.imageUrl || FALLBACK} alt={detail.name} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-gray-900 leading-tight truncate">{detail.name}</h2>
            <div className="flex items-center gap-2 mt-1 text-gray-500 font-medium text-sm">
              <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">{detail.location}{detail.province ? `, ${detail.province}` : ''}</span>
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={enrichProject} disabled={enrichBusy}
              className="px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg transition-all bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-70">
              {enrichBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {enrichBusy ? 'Đang đồng bộ…' : 'AI đồng bộ dữ liệu dự án'}
            </button>
            <button onClick={notifyStaff} disabled={notifyBusy}
              className="px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg transition-all bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-70">
              {notifyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              {notifyBusy ? 'Đang gửi…' : 'Thông báo nhân sự'}
            </button>
            <button onClick={() => save()} disabled={saving || !dirty}
              className={`px-5 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg transition-all ${dirty ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {dirty ? 'Lưu thay đổi' : 'Đã lưu'}
            </button>
          </div>
        )}
      </div>

      {/* Hint khi đang đồng bộ + thông báo kết quả */}
      {isAdmin && enrichBusy && (
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-xl px-4 py-2.5">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          Đang đồng bộ từ nguồn dự án &amp; kho tài liệu… (~40s)
        </div>
      )}
      {toast && (
        <div className={`text-sm font-bold rounded-xl px-4 py-2.5 border ${toast.kind === 'ok' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
          {toast.text}
        </div>
      )}

      {/* Hỏi AI tài liệu dự án (Kho tài liệu AI) */}
      <div className="bg-violet-50 rounded-2xl border border-violet-100 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span className="font-black text-sm text-violet-900">Hỏi AI về tài liệu dự án</span>
        </div>
        <div className="flex gap-2">
          <input value={ragQ} onChange={(e) => setRagQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && askRag()}
            placeholder="vd: Chính sách bán hàng? Pháp lý? Bảng giá? Tiện ích?"
            className="flex-1 px-3 py-2 rounded-xl border border-violet-200 text-sm focus:outline-none focus:border-violet-400" />
          <button onClick={askRag} disabled={ragBusy}
            className="px-4 py-2 bg-violet-600 text-white rounded-xl font-black text-sm hover:bg-violet-700 disabled:opacity-60 flex items-center gap-2">
            {ragBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Hỏi
          </button>
        </div>
        {ragA && (
          <div className="mt-3 bg-white rounded-xl border border-violet-100 p-3 text-sm text-gray-700 whitespace-pre-wrap">
            {ragA.answer}
            {ragA.sources ? <div className="text-[11px] text-gray-400 mt-2">Nguồn: {ragA.sources} đoạn · {ragA.project || 'tự nhận diện'}</div> : null}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all whitespace-nowrap ${tab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[420px]">
        {/* ===== TỔNG QUAN ===== */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="relative rounded-2xl overflow-hidden aspect-[16/7] bg-slate-100 group">
              <img src={images[heroIdx] || FALLBACK} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }} />
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.slice(0, 10).map((_, i) => (
                    <button key={i} onClick={() => setHeroIdx(i)} className={`w-2 h-2 rounded-full ${i === heroIdx ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { l: 'Số tòa', v: detail.numberBlock },
                { l: 'Số tầng', v: detail.numberFloor },
                { l: 'Số căn', v: detail.numberFlat },
                { l: 'Bàn giao', v: detail.dateFinish },
              ].map((s, i) => (
                <div key={i} className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                  <p className="text-[11px] font-black text-indigo-400 uppercase tracking-wide">{s.l}</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{s.v || '—'}</p>
                </div>
              ))}
            </div>
            <div>
              <SectionTitle icon={Info} title="Giới thiệu dự án"
                action={isAdmin && <AiBtn busy={aiBusy === 'overview'} onClick={() => aiDraft('overview', (t) => patch((c) => ({ ...c, overview: t })))} />} />
              {isAdmin ? (
                <textarea value={content.overview || detail.content || detail.description || ''} onChange={(e) => patch((c) => ({ ...c, overview: e.target.value }))}
                  className="w-full min-h-[180px] p-4 rounded-2xl border border-slate-200 text-[15px] leading-relaxed focus:ring-2 focus:ring-indigo-200 outline-none" placeholder="Mô tả tổng quan dự án..." />
              ) : (
                <p className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-wrap">{content.overview || detail.content || detail.description || 'Chưa có mô tả.'}</p>
              )}
            </div>
          </div>
        )}

        {/* ===== VỊ TRÍ ===== */}
        {tab === 'location' && (
          <div className="space-y-5">
            <SectionTitle icon={MapIcon} title="Vị trí & kết nối"
              action={isAdmin && <AiBtn busy={aiBusy === 'location'} onClick={() => aiDraft('location', (t) => patch((c) => ({ ...c, location: { text: t } })))} />} />
            {isAdmin ? (
              <textarea value={content.location?.text || ''} onChange={(e) => patch((c) => ({ ...c, location: { text: e.target.value } }))}
                className="w-full min-h-[120px] p-4 rounded-2xl border border-slate-200 text-[15px] outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Mô tả vị trí, giao thông, tiện ích..." />
            ) : (
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{content.location?.text || detail.location}</p>
            )}
            <div className="rounded-2xl overflow-hidden border border-slate-200 aspect-[16/8]">
              <iframe title="map" className="w-full h-full" loading="lazy"
                src={detail.latitude && detail.longitude
                  ? `https://maps.google.com/maps?q=${detail.latitude},${detail.longitude}&z=15&output=embed`
                  : `https://maps.google.com/maps?q=${encodeURIComponent(detail.name + ' ' + (detail.location || ''))}&z=14&output=embed`} />
            </div>
          </div>
        )}

        {/* ===== ĐÀO TẠO ===== */}
        {tab === 'training' && (
          <div className="space-y-5">
            <SectionTitle icon={GraduationCap} title="Đào tạo sale"
              action={isAdmin && <AiBtn label="AI tạo Q&A" busy={aiBusy === 'training'} onClick={() => aiDraft('training', (_t, training) => training && patch((c) => ({ ...c, training: { ...c.training, items: training.items || [] } })))} />} />
            {content.training?.notebooklmUrl && (
              <a href={content.training.notebooklmUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl font-black text-sm hover:bg-amber-100">
                <BookOpen className="w-4 h-4" /> Mở tài liệu đào tạo <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <div className="space-y-3">
              {(content.training?.items || []).map((it: any, i: number) => (
                <div key={i} className="bg-slate-50/60 rounded-2xl border border-slate-100 p-4">
                  <p className="font-black text-slate-900 text-[15px] flex items-start gap-2"><span className="text-indigo-500">Q.</span> {it.q}</p>
                  <p className="text-slate-600 mt-1.5 text-[14px] flex items-start gap-2"><span className="text-emerald-500 font-black">A.</span> {it.a}</p>
                  {isAdmin && <button onClick={() => patch((c) => ({ ...c, training: { ...c.training, items: c.training.items.filter((_: any, j: number) => j !== i) } }))} className="text-rose-400 text-xs font-bold mt-2 hover:text-rose-600">Xoá</button>}
                </div>
              ))}
              {!(content.training?.items || []).length && <Empty text="Chưa có nội dung đào tạo. Bấm 'AI đồng bộ dữ liệu dự án' (trên đầu trang) hoặc 'AI tạo Q&A' để AI tự sinh Q&A từ tài liệu dự án." />}
            </div>
            {isAdmin && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <p className="text-[12px] font-bold text-slate-400">Tuỳ chọn — nhúng thêm tài liệu đào tạo ngoài (không bắt buộc):</p>
                <input value={content.training?.notebooklmUrl || ''} onChange={(e) => patch((c) => ({ ...c, training: { ...c.training, notebooklmUrl: e.target.value } }))}
                  placeholder="Dán link chia sẻ tài liệu (public)..." className="w-full p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
            )}
          </div>
        )}

        {/* ===== PHÂN KHU ===== */}
        {tab === 'subdivision' && (
          <ListEditor isAdmin={isAdmin} title="Phân khu" icon={Grid3x3}
            items={content.subdivisions} empty="Chưa có phân khu."
            onAdd={() => patch((c) => ({ ...c, subdivisions: [...c.subdivisions, { name: '', desc: '', image: '' }] }))}
            onChange={(i, k, v) => patch((c) => { const a = [...c.subdivisions]; a[i] = { ...a[i], [k]: v }; return { ...c, subdivisions: a }; })}
            onRemove={(i) => patch((c) => ({ ...c, subdivisions: c.subdivisions.filter((_: any, j: number) => j !== i) }))}
            fields={[{ k: 'name', ph: 'Tên phân khu' }, { k: 'desc', ph: 'Mô tả' }, { k: 'image', ph: 'Link ảnh' }]}
            render={(it: any) => (
              <div className="flex gap-4 items-center">
                {it.image && <img src={it.image} className="w-24 h-20 rounded-xl object-cover" alt="" />}
                <div><p className="font-black text-slate-900">{it.name}</p><p className="text-sm text-slate-500">{it.desc}</p></div>
              </div>
            )} />
        )}

        {/* ===== MẶT BẰNG QUỸ CĂN ===== */}
        {tab === 'floorplan' && (
          <div className="space-y-4">
            <SectionTitle icon={LayoutGrid} title={`Mặt bằng quỹ căn (${content.floorplans?.length || 0})`}
              action={isAdmin && <AddBtn onClick={() => { patch((c) => ({ ...c, floorplans: [...c.floorplans, { name: 'Mặt bằng mới', image: '', units: [] }] })); setFpIdx(content.floorplans?.length || 0); }} />} />

            {!(content.floorplans || []).length ? (
              <Empty text="Chưa có mặt bằng." />
            ) : (
              <>
                {/* Chọn mặt bằng / tòa */}
                {(content.floorplans || []).length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {(content.floorplans || []).map((f: any, i: number) => (
                      <button key={i} onClick={() => setFpIdx(i)}
                        className={`px-3 py-2 rounded-xl text-sm font-bold border transition-all ${fpIdx === i ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        {f.name || `Mặt bằng ${i + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Admin: chỉnh tên / tòa / ảnh của mặt bằng đang chọn */}
                {isAdmin && content.floorplans[fpIdx] && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50/60 border border-slate-100 rounded-2xl p-3">
                    <input value={content.floorplans[fpIdx].name || ''} placeholder="Tên mặt bằng"
                      onChange={(e) => patch((c) => { const a = [...c.floorplans]; a[fpIdx] = { ...a[fpIdx], name: e.target.value }; return { ...c, floorplans: a }; })}
                      className="p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                    <input value={content.floorplans[fpIdx].blocks || ''} placeholder="Tòa / phân khu"
                      onChange={(e) => patch((c) => { const a = [...c.floorplans]; a[fpIdx] = { ...a[fpIdx], blocks: e.target.value }; return { ...c, floorplans: a }; })}
                      className="p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                    <input value={content.floorplans[fpIdx].image || ''} placeholder="Link ảnh mặt bằng"
                      onChange={(e) => patch((c) => { const a = [...c.floorplans]; a[fpIdx] = { ...a[fpIdx], image: e.target.value }; return { ...c, floorplans: a }; })}
                      className="p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                    <button onClick={() => { patch((c) => ({ ...c, floorplans: c.floorplans.filter((_: any, j: number) => j !== fpIdx) })); setFpIdx(0); }}
                      className="sm:col-span-3 justify-self-start inline-flex items-center gap-1.5 text-rose-400 text-xs font-bold hover:text-rose-600">
                      <Trash2 className="w-3.5 h-3.5" /> Xoá mặt bằng này
                    </button>
                  </div>
                )}

                {content.floorplans[fpIdx] && (
                  <FloorPlanMap
                    key={fpIdx + '::' + (content.floorplans[fpIdx].image || '')}
                    floorplan={content.floorplans[fpIdx]}
                    isAdmin={isAdmin}
                    onChange={(updated) => updateFloorplan(fpIdx, updated)}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* ===== QUỸ CĂN ===== */}
        {tab === 'units' && (() => {
          const allUnits = content.units || [];
          const counts = { available: 0, sold: 0, reserved: 0, locked: 0 } as Record<UnitStatusKey, number>;
          allUnits.forEach((u: any) => { counts[normUnitStatus(u.status)]++; });
          const filterChips: { key: UnitStatusKey | 'all'; label: string; n: number }[] = [
            { key: 'all', label: 'Tất cả', n: allUnits.length },
            { key: 'available', label: 'Còn', n: counts.available },
            { key: 'sold', label: 'Đã bán', n: counts.sold },
            { key: 'reserved', label: 'Giữ chỗ', n: counts.reserved },
            { key: 'locked', label: 'Khoá', n: counts.locked },
          ];
          return (
            <div className="space-y-4">
              <SectionTitle icon={Building2} title={`Quỹ căn (${allUnits.length})`}
                action={isAdmin && <AddBtn onClick={() => patch((c) => ({ ...c, units: [...c.units, { code: '', type: '', area: '', price: '', direction: '', status: 'Còn' }] }))} />} />

              {isAdmin && (
                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="Dán link Google Trang tính bảng hàng..."
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                    <button onClick={syncUnitsSheet} disabled={sheetBusy}
                      className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap">
                      {sheetBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Đồng bộ bảng hàng
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">Dán link Google Trang tính bảng hàng gốc (chia sẻ 'Bất kỳ ai có liên kết').</p>
                </div>
              )}

              <div className="text-sm font-bold text-slate-600">
                Tổng {allUnits.length} căn ·{' '}
                <span className="text-emerald-600">Còn {counts.available}</span> ·{' '}
                <span className="text-rose-600">Đã bán {counts.sold}</span> ·{' '}
                <span className="text-amber-600">Giữ chỗ {counts.reserved}</span>
                {counts.locked > 0 && <> · <span className="text-slate-500">Khoá {counts.locked}</span></>}
              </div>

              <div className="flex flex-wrap gap-2">
                {filterChips.map((c) => (
                  <button key={c.key} onClick={() => setUnitFilter(c.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${unitFilter === c.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                    {c.label} ({c.n})
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase font-black">
                    <tr>{['Mã căn', 'Loại', 'Diện tích', 'Giá', 'Hướng', 'Trạng thái', ''].map((h) => <th key={h} className="text-left px-4 py-3">{h}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {allUnits.map((u: any, i: number) => ({ u, i }))
                      .filter(({ u }: any) => unitFilter === 'all' || normUnitStatus(u.status) === unitFilter)
                      .map(({ u, i }: any) => {
                      const meta = UNIT_STATUS_META[normUnitStatus(u.status)];
                      return (
                        <tr key={i} className="hover:bg-slate-50/50">
                          {(['code', 'type', 'area', 'price', 'direction'] as const).map((k) => (
                            <td key={k} className="px-4 py-2.5">
                              {isAdmin ? <input value={u[k] || ''} onChange={(e) => patch((c) => { const a = [...c.units]; a[i] = { ...a[i], [k]: e.target.value }; return { ...c, units: a }; })} className="w-full bg-transparent outline-none border-b border-transparent focus:border-indigo-300" placeholder="—" /> : <span className={k === 'code' ? 'font-bold text-slate-800' : ''}>{u[k] || '—'}</span>}
                            </td>
                          ))}
                          <td className="px-4 py-2.5">
                            {isAdmin ? (
                              <select value={u.status} onChange={(e) => patch((c) => { const a = [...c.units]; a[i] = { ...a[i], status: e.target.value }; return { ...c, units: a }; })} className="bg-transparent outline-none font-bold">
                                <option>Còn</option><option>Giữ chỗ</option><option>Đặt chỗ</option><option>Đã bán</option><option>Khoá</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-black ${meta.badge}`}>
                                <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                                {u.status || meta.label}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">{isAdmin && <button onClick={() => patch((c) => ({ ...c, units: c.units.filter((_: any, j: number) => j !== i) }))} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {!allUnits.length && <Empty text="Chưa có quỹ căn." />}
              </div>
            </div>
          );
        })()}

        {/* ===== ẢNH 360 ===== */}
        {tab === 'photos360' && (
          <ListEditor isAdmin={isAdmin} title="Ảnh 360°" icon={Camera}
            items={content.photos360} empty="Chưa có ảnh 360°."
            onAdd={() => patch((c) => ({ ...c, photos360: [...c.photos360, { name: '', url: '' }] }))}
            onChange={(i, k, v) => patch((c) => { const a = [...c.photos360]; a[i] = { ...a[i], [k]: v }; return { ...c, photos360: a }; })}
            onRemove={(i) => patch((c) => ({ ...c, photos360: c.photos360.filter((_: any, j: number) => j !== i) }))}
            fields={[{ k: 'name', ph: 'Tên điểm' }, { k: 'url', ph: 'Link nhúng 360 (Kuula/Matterport...)' }]}
            render={(it: any) => (
              <div>
                <p className="font-bold text-slate-800 text-sm mb-2">{it.name}</p>
                {it.url && <div className="aspect-video rounded-xl overflow-hidden border border-slate-200"><iframe title={it.name} src={it.url} className="w-full h-full" allowFullScreen /></div>}
              </div>
            )} />
        )}

        {/* ===== CHÍNH SÁCH BÁN HÀNG ===== */}
        {tab === 'salesPolicy' && (
          <div className="space-y-4">
            <SectionTitle icon={FileText} title="Chính sách bán hàng"
              action={isAdmin && <AiBtn busy={aiBusy === 'salesPolicy'} onClick={() => aiDraft('salesPolicy', (t) => patch((c) => ({ ...c, salesPolicy: t })))} />} />
            {isAdmin ? (
              <textarea value={content.salesPolicy || ''} onChange={(e) => patch((c) => ({ ...c, salesPolicy: e.target.value }))} className="w-full min-h-[260px] p-4 rounded-2xl border border-slate-200 text-[15px] leading-relaxed outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Chiết khấu, thanh toán, ưu đãi..." />
            ) : (
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{content.salesPolicy || 'Chưa có chính sách bán hàng.'}</p>
            )}
          </div>
        )}

        {/* ===== TIẾN ĐỘ ===== */}
        {tab === 'progress' && (
          <div className="space-y-4">
            <SectionTitle icon={Calendar} title="Tiến độ"
              action={isAdmin && <>
                <AiBtn busy={aiBusy === 'progress'} onClick={() => aiDraft('progress', (t) => patch((c) => ({ ...c, progress: [...(c.progress || []), { date: '', title: 'AI gợi ý', desc: t }] })))} />
                <AddBtn onClick={() => patch((c) => ({ ...c, progress: [...c.progress, { date: '', title: '', desc: '' }] }))} />
              </>} />
            <div className="space-y-3 relative pl-6 border-l-2 border-indigo-100">
              {(content.progress || []).map((p: any, i: number) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[29px] top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white" />
                  {isAdmin ? (
                    <div className="bg-slate-50/60 rounded-xl p-3 space-y-2">
                      <div className="flex gap-2">
                        <input value={p.date} onChange={(e) => patch((c) => { const a = [...c.progress]; a[i] = { ...a[i], date: e.target.value }; return { ...c, progress: a }; })} placeholder="Mốc (vd Q3/2026)" className="w-40 p-2 rounded-lg border border-slate-200 text-sm" />
                        <input value={p.title} onChange={(e) => patch((c) => { const a = [...c.progress]; a[i] = { ...a[i], title: e.target.value }; return { ...c, progress: a }; })} placeholder="Tiêu đề" className="flex-1 p-2 rounded-lg border border-slate-200 text-sm" />
                        <button onClick={() => patch((c) => ({ ...c, progress: c.progress.filter((_: any, j: number) => j !== i) }))} className="text-rose-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                      <textarea value={p.desc} onChange={(e) => patch((c) => { const a = [...c.progress]; a[i] = { ...a[i], desc: e.target.value }; return { ...c, progress: a }; })} placeholder="Mô tả" className="w-full p-2 rounded-lg border border-slate-200 text-sm" />
                    </div>
                  ) : (
                    <div><p className="text-[11px] font-black text-indigo-500 uppercase">{p.date}</p><p className="font-black text-slate-900">{p.title}</p><p className="text-sm text-slate-500">{p.desc}</p></div>
                  )}
                </div>
              ))}
              {!(content.progress || []).length && <Empty text="Chưa có tiến độ." />}
            </div>
          </div>
        )}

        {/* ===== TÀI LIỆU ===== */}
        {tab === 'documents' && (
          <div className="space-y-4">
            <SectionTitle icon={BookOpen} title="Tài liệu chủ đầu tư"
              action={isAdmin && (
                <button onClick={syncDocs} disabled={docSyncBusy}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
                  {docSyncBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {docSyncBusy ? 'Đang đồng bộ…' : 'Đồng bộ tài liệu từ kho AI'}
                </button>
              )} />
            {isAdmin && (
              <div className="space-y-1.5">
                <p className="text-[12px] font-bold text-slate-400">Tuỳ chọn — thư mục tài liệu ngoài (không bắt buộc):</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input value={content.documents?.driveFolderUrl || ''} onChange={(e) => patch((c) => ({ ...c, documents: { ...c.documents, driveFolderUrl: e.target.value } }))} placeholder="Dán link thư mục tài liệu (chia sẻ công khai)…" className="flex-1 p-3 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                  <button onClick={syncDrive} disabled={aiBusy === 'drive'} className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-200 disabled:opacity-60">
                    {aiBusy === 'drive' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Nạp thư mục ngoài
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(content.documents?.files || []).map((f: any, i: number) => (
                f.url ? (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50/60 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group">
                    <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-700 truncate flex-1">{f.name}</span>
                    <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-500" />
                  </a>
                ) : (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50/60 border border-slate-100 rounded-xl">
                    <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                    <span className="text-sm font-bold text-slate-700 truncate flex-1">{f.name}</span>
                  </div>
                )
              ))}
            </div>
            {!(content.documents?.files || []).length && <Empty text="Chưa có tài liệu. Bấm 'Đồng bộ tài liệu từ kho AI' để lấy tài liệu dự án." />}
          </div>
        )}

        {/* ===== TIN TỨC ===== */}
        {tab === 'news' && (
          <ListEditor isAdmin={isAdmin} title="Tin tức" icon={Newspaper}
            items={content.news} empty="Chưa có tin tức."
            onAdd={() => patch((c) => ({ ...c, news: [...c.news, { title: '', url: '', date: '' }] }))}
            onChange={(i, k, v) => patch((c) => { const a = [...c.news]; a[i] = { ...a[i], [k]: v }; return { ...c, news: a }; })}
            onRemove={(i) => patch((c) => ({ ...c, news: c.news.filter((_: any, j: number) => j !== i) }))}
            fields={[{ k: 'title', ph: 'Tiêu đề' }, { k: 'date', ph: 'Ngày' }, { k: 'url', ph: 'Link' }]}
            render={(it: any) => (
              <a href={it.url || '#'} target="_blank" rel="noreferrer" className="block">
                <p className="font-black text-slate-900 hover:text-indigo-600">{it.title}</p>
                <p className="text-xs text-slate-400 font-bold">{it.date}</p>
              </a>
            )} />
        )}
      </div>
    </div>
  );
};

// ---------- helpers ----------
const SectionTitle: React.FC<{ icon: any; title: string; action?: React.ReactNode }> = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between mb-3">
    <h4 className="text-lg font-black text-slate-900 flex items-center gap-2"><Icon className="w-5 h-5 text-indigo-600" /> {title}</h4>
    <div className="flex items-center gap-2">{action}</div>
  </div>
);
const AiBtn: React.FC<{ onClick: () => void; busy?: boolean; label?: string }> = ({ onClick, busy, label }) => (
  <button onClick={onClick} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-50 border border-violet-200 text-violet-700 rounded-xl font-black text-xs hover:bg-violet-100 disabled:opacity-60">
    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />} {label || 'AI soạn'}
  </button>
);
const AddBtn: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button onClick={onClick} className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl font-black text-xs hover:bg-indigo-100"><Plus className="w-3.5 h-3.5" /> Thêm</button>
);
const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center py-10 text-slate-400 text-sm font-semibold">{text}</div>
);

const ListEditor: React.FC<any> = ({ isAdmin, title, icon, items, empty, onAdd, onChange, onRemove, fields, render, grid }) => (
  <div className="space-y-4">
    <SectionTitle icon={icon} title={`${title} (${items?.length || 0})`} action={isAdmin && <AddBtn onClick={onAdd} />} />
    {!(items || []).length && <Empty text={empty} />}
    <div className={grid ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
      {(items || []).map((it: any, i: number) => (
        <div key={i} className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4">
          {isAdmin ? (
            <div className="space-y-2">
              {fields.map((f: any) => (
                <input key={f.k} value={it[f.k] || ''} onChange={(e) => onChange(i, f.k, e.target.value)} placeholder={f.ph} className="w-full p-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              ))}
              <button onClick={() => onRemove(i)} className="text-rose-400 text-xs font-bold hover:text-rose-600 flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Xoá</button>
            </div>
          ) : render(it)}
        </div>
      ))}
    </div>
  </div>
);

export default ProjectDetail;
