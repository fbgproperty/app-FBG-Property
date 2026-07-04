import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Rocket, LayoutDashboard, Layers, Loader2, RefreshCw, AlertTriangle,
  CheckCircle2, Circle, Search, Sparkles, TrendingUp,
  BookOpen, GraduationCap, ClipboardList, Megaphone, Users, PlayCircle,
  FileText, Trophy, ChevronRight,
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

/* ============================ TỔNG QUAN ============================ */
const OverviewSection: React.FC = () => {
  const [data, setData] = useState<{ items: any[]; total: number; live: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true); setErr('');
    try { setData(await api.projectOsList()); }
    catch (e: any) { setErr(e?.message || 'Không tải được dữ liệu.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span className="font-black text-slate-900 text-sm flex-1">Dự án đang triển khai</span>
          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">{items.length}</span>
        </div>
        {loading && items.length === 0 ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-12 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Rocket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400 font-semibold">Chưa có dự án nào được triển khai. Sang tab “Triển khai” để bắt đầu.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {items.map((it, i) => {
              const progress = Math.max(0, Math.min(100, num(it.progress)));
              const done = num(it.done);
              const totalStages = num(it.total) || 7;
              return (
                <div key={it.slug || i} onClick={() => it.slug && navigate('/projects/' + it.slug)} title="Xem trang chi tiết dự án" className="px-5 py-4 hover:bg-slate-50/60 cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-black text-slate-800 text-sm flex-1 truncate group-hover:text-indigo-600">{it.name || it.slug || '—'}</span>
                    {progress >= 100
                      ? <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3 h-3" />Đã ra quân</span>
                      : <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-600"><PlayCircle className="w-3 h-3" />{done}/{totalStages} bước</span>}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 shrink-0" />
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{done}/{totalStages} bước · {progress}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
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
            <button onClick={runAutopilot} disabled={autopiloting || !!busyStage} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap">
              {autopiloting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />} Triển khai tự trị
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
        {sec === 'overview' && (
          <div className="space-y-6">
            <OverviewSection />
            <Deployment />
          </div>
        )}
        {sec === 'deploy' && <DeploySection />}
        {sec === 'docs' && (
          <div className="space-y-6">
            <ProjectDossier />
            <SalePlanner />
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
