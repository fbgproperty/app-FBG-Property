import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, LayoutDashboard, Layers, Loader2, RefreshCw, AlertTriangle,
  CheckCircle2, Circle, Search, Sparkles, TrendingUp,
  BookOpen, GraduationCap, ClipboardList, Megaphone, Users, PlayCircle,
  FileText, Trophy, ChevronRight, MapPin, Plus, Building2, X,
  ListChecks, Send, Server, BarChart3, Bot, Zap,
} from 'lucide-react';
import { api } from '../services/apiService';
import { isAdminRole } from '../services/permissions';
import ProjectDossier from './ProjectDossier';
import SalePlanner from './SalePlanner';
import DeployLaunch from './DeployLaunch';
import CampaignSchedule from './CampaignSchedule';
import ProjectRanking from './ProjectRanking';
import Deployment from './Deployment';
import MarketResearch from './MarketResearch';
import MarketRadar from './MarketRadar';
import AutonomyPanel from './AutonomyPanel';

type Sec = 'overview' | 'deploy' | 'docs' | 'campaign' | 'ranking' | 'market';
const SECTIONS: { id: Sec; label: string; icon: any; admin?: boolean }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'deploy', label: 'Triển khai tự trị', icon: Rocket },
  { id: 'docs', label: 'Hồ sơ & Kế hoạch bán', icon: FileText },
  { id: 'campaign', label: 'Chiến dịch', icon: Megaphone, admin: true },
  { id: 'ranking', label: 'Xếp hạng ưu tiên', icon: Trophy },
  { id: 'market', label: 'Nghiên cứu thị trường', icon: TrendingUp },
];

const num = (x: any): number => (typeof x === 'number' && !Number.isNaN(x) ? x : 0);

// Map icon backend (string) → lucide component
const STAGE_ICONS: Record<string, any> = {
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  'clipboard-list': ClipboardList,
  'megaphone': Megaphone,
  'users': Users,
  'rocket': Rocket,
  'trending-up': TrendingUp,
};
const stageIcon = (name?: string) => STAGE_ICONS[String(name || '').trim()] || Layers;

// Icon theo phòng ban của công việc triển khai
const DEPT_ICONS: Record<string, any> = {
  'Đào tạo': GraduationCap,
  'Marketing': Megaphone,
  'Kinh doanh': Users,
  'Vận hành': Server,
  'Công nghệ': Bot,
  'Báo cáo': BarChart3,
};
const deptIcon = (name?: string) => DEPT_ICONS[String(name || '').trim()] || ListChecks;

// Trạng thái công việc: todo | doing | done
type TaskStatus = 'todo' | 'doing' | 'done';
const TASK_STATES: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'Chưa làm' },
  { id: 'doing', label: 'Đang làm' },
  { id: 'done', label: 'Xong' },
];

/* ==================== BẢNG CÔNG VIỆC TRIỂN KHAI (v13) ==================== */
const TaskBoard: React.FC<{ picked: { name: string; slug: string } }> = ({ picked }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 6000); return () => clearTimeout(t); }, [toast]);

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const r = await api.projectTasks(picked.slug);
      setTasks(Array.isArray(r?.tasks) ? r.tasks : []);
    } catch (e: any) { setErr(e?.message || 'Không tải được danh sách việc.'); }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [picked.slug]);

  const gen = async () => {
    if (generating) return;
    setGenerating(true); setErr(''); setToast('');
    try {
      const r = await api.projectTasksGen(picked.name, picked.slug);
      if (r?.ok) { setToast(`AI đã tạo ${num(r.count)} công việc triển khai.`); await load(); }
      else setErr(r?.error || 'Tạo việc chưa hoàn tất.');
    } catch (e: any) { setErr(e?.message || 'Tạo việc thất bại.'); }
    setGenerating(false);
  };

  const notify = async () => {
    if (notifying) return;
    setNotifying(true); setErr(''); setToast('');
    try {
      const r = await api.projectTasksNotify(picked.slug);
      if (r?.ok) setToast(`Đã giao việc cho ${num(r.notified)} nhân sự.`);
      else setErr(r?.error || 'Giao việc chưa hoàn tất.');
    } catch (e: any) { setErr(e?.message || 'Giao việc thất bại.'); }
    setNotifying(false);
  };

  const setStatus = async (id: string, status: TaskStatus) => {
    const prev = tasks;
    setTasks(ts => ts.map(t => (t.id === id ? { ...t, status } : t)));
    try {
      const r = await api.projectTasksUpdate(picked.slug, id, status);
      if (!r?.ok) { setTasks(prev); setErr(r?.error || 'Cập nhật việc thất bại.'); }
    } catch (e: any) { setTasks(prev); setErr(e?.message || 'Cập nhật việc thất bại.'); }
  };

  const done = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;

  // Gom nhóm theo phòng ban giữ thứ tự xuất hiện
  const groups: { dept: string; items: any[] }[] = [];
  for (const t of tasks) {
    const dept = String(t.dept || 'Khác').trim() || 'Khác';
    let g = groups.find(x => x.dept === dept);
    if (!g) { g = { dept, items: [] }; groups.push(g); }
    g.items.push(t);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow"><ListChecks className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-slate-900">Bảng công việc triển khai</div>
          <div className="text-[12px] text-slate-400">{total > 0 ? `Đã xong ${done}/${total}` : 'Chưa có việc'}</div>
        </div>
        <button onClick={gen} disabled={generating || notifying} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tạo việc bằng AI
        </button>
        <button onClick={notify} disabled={notifying || generating || total === 0} className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-black text-sm hover:bg-violet-700 disabled:opacity-50 whitespace-nowrap">
          {notifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Giao việc & xin ý kiến
        </button>
        <button onClick={load} disabled={loading} title="Làm mới" className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      </div>

      {generating && <p className="text-[12px] text-slate-400 text-center">AI đang phân rã công việc và giao cho nhân sự — mất khoảng 30 giây, vui lòng chờ…</p>}
      {toast && <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2 text-sm font-bold"><CheckCircle2 className="w-4 h-4 shrink-0" /> {toast}</div>}
      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}

      {loading && tasks.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải công việc…</div>
      ) : total === 0 ? (
        <div className="border border-dashed border-slate-200 rounded-2xl py-10 text-center">
          <ListChecks className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-semibold">Chưa có việc. Bấm “Tạo việc bằng AI”.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const DIcon = deptIcon(g.dept);
            return (
              <div key={g.dept} className="rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <DIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="font-black text-slate-800 text-sm">{g.dept}</span>
                  <span className="text-[11px] text-slate-400 font-bold">{g.items.filter(t => t.status === 'done').length}/{g.items.length}</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {g.items.map((t, i) => (
                    <div key={t.id || i} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-bold ${t.status === 'done' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.title || '—'}</div>
                        {(t.assigneeName || t.assignee) && (
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                            <Users className="w-3 h-3" /> {t.assigneeName || t.assignee}
                          </span>
                        )}
                      </div>
                      <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
                        {TASK_STATES.map(s => {
                          const active = (t.status || 'todo') === s.id;
                          const activeCls = s.id === 'done' ? 'bg-emerald-600 text-white' : s.id === 'doing' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-white';
                          return (
                            <button key={s.id} onClick={() => setStatus(t.id, s.id)}
                              className={`px-2.5 py-1.5 text-[12px] font-black transition ${active ? activeCls : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                              {s.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ============================ TỔNG QUAN ============================ */
// Parse URL ảnh bìa từ imagesJson (cùng logic tryGetFirstImage của danh mục dự án)
const FALLBACK_IMAGE = '';
function firstImage(imagesJson?: string | null): string {
  if (!imagesJson) return FALLBACK_IMAGE;
  try {
    const parsed = JSON.parse(imagesJson);
    if (Array.isArray(parsed)) {
      const first = parsed.find((x) => typeof x === 'string' && x.trim() !== '');
      return first || FALLBACK_IMAGE;
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.images)) {
      const first = parsed.images.find((x: any) => typeof x === 'string' && x.trim() !== '');
      return first || FALLBACK_IMAGE;
    }
  } catch { /* ignore parse errors */ }
  return FALLBACK_IMAGE;
}

/* ==================== VẬN HÀNH TỰ TRỊ HẰNG NGÀY (v14) ==================== */
function relTime(ts?: number | string | null): string {
  if (!ts) return '';
  let ms = 0;
  if (typeof ts === 'number') ms = ts < 1e12 ? ts * 1000 : ts;
  else { const p = Date.parse(ts); if (Number.isNaN(p)) return ''; ms = p; }
  const diff = Date.now() - ms;
  if (diff < 0) return 'vừa xong';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

const AutopilotCard: React.FC = () => {
  const [st, setSt] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { (async () => { try { setSt(await api.autopilotStatus()); } catch { /* */ } })(); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 6000); return () => clearTimeout(t); }, [toast]);

  const send = async () => {
    if (sending) return;
    setSending(true); setToast('');
    try {
      const r = await api.autopilotDaily(true);
      if (r?.ok) { setToast('Đã gửi bản tin vận hành cho quản lý.'); setSt((s: any) => ({ ...(s || {}), ...r, lastRun: Date.now() })); }
      else setToast('Gửi bản tin chưa hoàn tất.');
    } catch { setToast('Gửi bản tin thất bại.'); }
    setSending(false);
  };

  const chips = [
    { label: 'Dự án đang bán', value: num(st?.sellingProjects) },
    { label: 'Đã ra quân', value: num(st?.ready) },
    { label: 'Đội AI tốt nghiệp', value: num(st?.graduates) },
    { label: 'Cơ hội', value: num(st?.opps) },
  ];
  const rel = relTime(st?.lastRun);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow"><Zap className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-slate-900">Vận hành tự trị hằng ngày</div>
          {rel && <div className="text-[12px] text-slate-400">Cập nhật gần nhất: {rel}</div>}
        </div>
        <button onClick={send} disabled={sending} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi bản tin cho quản lý ngay
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {chips.map(c => (
          <div key={c.label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
            <div className="text-lg font-black text-slate-900 leading-none">{c.value}</div>
            <div className="text-[11px] text-slate-500 font-semibold mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      {toast && <div className="mt-3 flex items-center gap-2 text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 text-[13px] font-bold"><CheckCircle2 className="w-4 h-4 shrink-0" /> {toast}</div>}
      <p className="mt-2 text-[12px] text-slate-400">Hệ thống tự tổng hợp &amp; gửi bản tin mỗi ngày. Quản lý nhận qua kênh nhắn tin.</p>
    </div>
  );
};

const OverviewSection: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const res = await api.projectShowcase();
      setItems(Array.isArray(res?.items) ? res.items : []);
    } catch (e: any) { setErr(e?.message || 'Không tải được dữ liệu.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(''), 5000); return () => clearTimeout(t); }, [msg]);

  const add = async () => {
    const term = name.trim();
    if (!term || adding) return;
    setAdding(true); setMsg('');
    try {
      const r = await api.projectShowcaseAdd(term);
      if (r?.error) { setMsg(r.error); }
      else { setName(''); await load(); }
    } catch (e: any) { setMsg(e?.message || 'Thêm dự án thất bại.'); }
    setAdding(false);
  };

  const remove = async (slug: string) => {
    if (!slug) return;
    try { await api.projectShowcaseRemove(slug); await load(); }
    catch (e: any) { setMsg(e?.message || 'Gỡ dự án thất bại.'); }
  };

  return (
    <div className="space-y-4">
      {/* Vận hành tự trị hằng ngày */}
      <AutopilotCard />

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}

      {/* Thêm dự án */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') add(); }}
              placeholder="Gõ tên dự án đang bán…"
              disabled={adding}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <button onClick={add} disabled={adding || !name.trim()} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm
          </button>
          <button onClick={load} disabled={loading} title="Làm mới" className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
        {msg && <div className="mt-2 flex items-center gap-2 text-amber-700 bg-amber-50 rounded-lg px-3 py-2 text-[13px] font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {msg}</div>}
      </div>

      {/* Lưới dự án đang bán */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-14 text-center">
          <Building2 className="w-9 h-9 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-semibold">Chưa có dự án đang bán. Gõ tên dự án và bấm Thêm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, i) => {
            const img = firstImage(it.imagesJson);
            const progress = Math.max(0, Math.min(100, num(it.progress)));
            const statusLabel = String(it.status || '').trim() || 'Đang bán';
            return (
              <div
                key={it.slug || i}
                onClick={() => it.slug && navigate('/projects/' + it.slug)}
                title="Xem trang chi tiết dự án"
                className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Ảnh bìa */}
                <div className="relative aspect-video overflow-hidden bg-slate-100">
                  {img ? (
                    <img
                      src={img}
                      alt={it.name || it.slug || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { const t = e.currentTarget as HTMLImageElement; t.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 via-slate-100 to-emerald-100">
                      <Building2 className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                  {/* Badge trạng thái */}
                  <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-600/90 text-white shadow backdrop-blur-sm">
                    <CheckCircle2 className="w-3 h-3" /> {statusLabel}
                  </span>
                  {/* Nút gỡ (chỉ dự án thêm thủ công) */}
                  {it.manual === true && (
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(it.slug); }}
                      title="Gỡ khỏi danh sách"
                      className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-slate-500 hover:text-red-500 flex items-center justify-center shadow"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Nội dung */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start gap-2">
                    <span className="font-black text-slate-900 text-sm flex-1 truncate group-hover:text-indigo-600">{it.name || it.slug || '—'}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0 mt-0.5" />
                  </div>
                  {it.location && (
                    <div className="flex items-center gap-1.5 text-slate-500 mt-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="text-[12px] truncate">{it.location}</span>
                    </div>
                  )}
                  {progress > 0 && (
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                        {progress >= 100
                          ? <><CheckCircle2 className="w-3 h-3" /> Đã ra quân</>
                          : <><PlayCircle className="w-3 h-3" /> Ra quân {progress}%</>}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ============================ TRIỂN KHAI ============================ */
const DeploySection: React.FC = () => {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<{ name: string; slug: string } | null>(null);

  const [status, setStatus] = useState<{ stages: any[]; done: number; total: number; progress: number } | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [err, setErr] = useState('');
  const [autopiloting, setAutopiloting] = useState(false);
  const [deployingMaster, setDeployingMaster] = useState(false);
  const navigate = useNavigate();
  const [busyStage, setBusyStage] = useState('');
  const [toast, setToast] = useState('');

  // Debounce tìm dự án
  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res: any = await api.getProjects({ q: term, pageSize: 8, page: 1 });
        setResults(Array.isArray(res?.items) ? res.items : []);
      } catch { setResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 6000); return () => clearTimeout(t); }, [toast]);

  const loadStatus = async (p: { name: string; slug: string }) => {
    setLoadingStatus(true); setErr('');
    try {
      const s = await api.projectOsStatus(p.name, p.slug);
      setStatus({ stages: Array.isArray(s.stages) ? s.stages : [], done: num(s.done), total: num(s.total), progress: num(s.progress) });
    } catch (e: any) { setErr(e?.message || 'Không tải được tiến độ.'); }
    setLoadingStatus(false);
  };

  const pick = async (item: any) => {
    const p = { name: item.name || item.id || item.slug || '', slug: item.id || item.slug || '' };
    setPicked(p); setResults([]); setQ(item.name || ''); setStatus(null);
    await loadStatus(p);
  };

  const runAutopilot = async () => {
    if (!picked || autopiloting) return;
    setAutopiloting(true); setErr(''); setToast('');
    try {
      const r = await api.projectOsAutopilot(picked.name, picked.slug);
      if (r?.ok) setToast(`Đã triển khai tự trị ${num(r.done)}/${num(r.total) || 7} bước cho “${picked.name}”.`);
      else setToast('Triển khai tự trị chưa hoàn tất.');
      await loadStatus(picked);
    } catch (e: any) { setErr(e?.message || 'Triển khai tự trị thất bại.'); }
    setAutopiloting(false);
  };

  const runMaster = async () => {
    if (!picked || deployingMaster || autopiloting || !!busyStage) return;
    if (!window.confirm('Chạy triển khai toàn diện? Hệ thống sẽ chạy đủ các bước và gửi thông báo cho đội ngũ.')) return;
    setDeployingMaster(true); setErr(''); setToast('');
    try {
      const r = await api.projectDeployMaster(picked.name, picked.slug, true);
      if (r?.ok) setToast(`Đã triển khai toàn diện: ${num(r.done)}/${num(r.total) || 7} bước · ${num(r.docs)} tài liệu · đã báo ${num(r.notified)} nhân sự`);
      else setToast(r?.error || 'Triển khai toàn diện chưa hoàn tất.');
      await loadStatus(picked);
    } catch (e: any) { setErr(e?.message || 'Triển khai toàn diện thất bại.'); }
    setDeployingMaster(false);
  };

  const runStage = async (stageId: string) => {
    if (!picked || busyStage) return;
    setBusyStage(stageId); setErr(''); setToast('');
    try {
      const r = await api.projectOsStage(picked.name, picked.slug, stageId);
      if (r?.ok) setToast(r.summary ? String(r.summary).slice(0, 160) : 'Đã chạy xong bước này.');
      else setToast(r?.summary || 'Chạy bước chưa hoàn tất.');
      await loadStatus(picked);
    } catch (e: any) { setErr(e?.message || 'Chạy bước thất bại.'); }
    setBusyStage('');
  };

  return (
    <div className="space-y-4">
      {/* Picker */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-indigo-600" />
          <span className="font-black text-slate-900 text-sm">Chọn dự án để triển khai</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Nhập tên dự án để tìm…"
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 animate-spin" />}
        </div>

        {results.length > 0 && (
          <div className="mt-2 border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50">
            {results.map((it, i) => (
              <button key={it.id || it.slug || i} onClick={() => pick(it)}
                className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate">{it.name || it.id}</div>
                  {it.location && <div className="text-[11px] text-slate-400 truncate">{it.location}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {toast && <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 rounded-xl px-3 py-2 text-sm font-bold"><Sparkles className="w-4 h-4 shrink-0" /> {toast}</div>}
      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}

      {picked && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow"><Rocket className="w-5 h-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-slate-900 truncate">{picked.name}</div>
              <div className="text-[12px] text-slate-400">
                {status ? `${status.done}/${status.total || 7} bước · ${status.progress}%` : 'Đang tải tiến độ…'}
              </div>
            </div>
            <button onClick={() => picked.slug && navigate('/projects/' + picked.slug)} className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-black text-sm">
              <FileText className="w-4 h-4" /> Xem chi tiết
            </button>
            <button onClick={() => loadStatus(picked)} disabled={loadingStatus} className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm disabled:opacity-60">
              {loadingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Làm mới
            </button>
            <button onClick={runAutopilot} disabled={autopiloting || !!busyStage || deployingMaster} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap">
              {autopiloting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Triển khai tự trị
            </button>
            <button onClick={runMaster} disabled={deployingMaster || autopiloting || !!busyStage} className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl font-black text-sm hover:bg-violet-700 disabled:opacity-50 whitespace-nowrap">
              {deployingMaster ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />} Triển khai toàn diện
            </button>
          </div>

          {status && (
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, status.progress))}%` }} />
            </div>
          )}

          {autopiloting && (
            <p className="text-[12px] text-slate-400 text-center">AI đang triển khai toàn bộ 7 bước — quá trình này mất khoảng 40–60 giây, vui lòng chờ…</p>
          )}
          {deployingMaster && (
            <p className="text-[12px] text-slate-400 text-center">Đang triển khai toàn diện — chạy đủ các bước, đồng bộ tài liệu &amp; gửi thông báo cho đội ngũ (~60 giây), vui lòng chờ…</p>
          )}

          {loadingStatus && !status ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải pipeline…</div>
          ) : (
            <div className="space-y-2.5">
              {(status?.stages || []).map((st, i) => {
                const Icon = stageIcon(st.icon);
                const isDone = !!st.done;
                const stageId = st.id || '';
                const busy = busyStage === stageId;
                return (
                  <div key={stageId || i} className={`rounded-2xl border p-4 flex gap-3 ${isDone ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm">{i + 1}. {st.title || stageId}</span>
                        {isDone
                          ? <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3 h-3" />Hoàn tất</span>
                          : <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500"><Circle className="w-3 h-3" />Chờ chạy</span>}
                      </div>
                      {st.desc && <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{st.desc}</p>}
                      {isDone && st.summary && <p className="text-[12px] text-slate-600 mt-2 bg-white rounded-lg border border-slate-100 p-2.5 leading-relaxed whitespace-pre-wrap">{st.summary}</p>}
                      <button onClick={() => runStage(stageId)} disabled={busy || autopiloting || !!busyStage}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-black text-[12px] disabled:opacity-50">
                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />} Chạy bước này
                      </button>
                    </div>
                  </div>
                );
              })}
              {status && status.stages.length === 0 && !loadingStatus && (
                <p className="text-sm text-slate-400 py-4 text-center">Chưa có dữ liệu pipeline cho dự án này.</p>
              )}
            </div>
          )}
        </div>
      )}

      {picked && <TaskBoard picked={picked} />}

      {!picked && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 py-12 text-center">
          <Rocket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-semibold">Tìm và chọn một dự án ở trên để xem pipeline 7 bước.</p>
        </div>
      )}
    </div>
  );
};

/* ============================ HUB ============================ */
const ProjectOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('overview');
  const role = (typeof localStorage !== 'undefined' && localStorage.getItem('fbg_role')) || 'ctv';
  const admin = isAdminRole(role);
  const sections = SECTIONS.filter(s => !s.admin || admin);
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><Rocket className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Dự Án OS</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Triển khai từng dự án tự trị bằng AI — từ nạp hồ sơ đến ra quân bán hàng</p>
        </div>
      </header>

      <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {sections.map(s => {
          const active = sec === s.id; const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSec(s.id)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition ${active ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in duration-300">
        {sec === 'overview' && <OverviewSection />}
        {sec === 'deploy' && <div className="space-y-5"><AutonomyPanel /><DeploySection /></div>}
        {sec === 'docs' && (
          <div className="space-y-6">
            <ProjectDossier />
            <SalePlanner />
            <Deployment />
          </div>
        )}
        {sec === 'campaign' && admin && (
          <div className="space-y-6">
            <DeployLaunch />
            <CampaignSchedule />
          </div>
        )}
        {sec === 'ranking' && <ProjectRanking />}
        {sec === 'market' && (
          <div className="space-y-6">
            <MarketResearch />
            <MarketRadar />
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectOS;
