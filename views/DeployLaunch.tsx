import React, { useEffect, useState } from 'react';
import { Rocket, Loader2, Sparkles, Radar, Users, Target, UserCheck, ChevronDown, ChevronRight, ClipboardList, Newspaper, AlertTriangle, History } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);
const n = (x: any) => Number(x) || 0;

const FunnelCard: React.FC<{ label: string; val: number; icon: any; c: string; last?: boolean }> = ({ label, val, icon: Icon, c, last }) => (
  <div className="flex items-center gap-2 flex-1 min-w-[120px]">
    <div className="bg-white rounded-2xl border border-slate-100 p-4 flex-1">
      <div className={`w-9 h-9 rounded-xl ${c} flex items-center justify-center text-white mb-2`}><Icon className="w-4 h-4" /></div>
      <p className="text-2xl font-black text-slate-900">{val}</p>
      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{label}</p>
    </div>
    {!last && <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 hidden md:block" />}
  </div>
);

const Collapsible: React.FC<{ title: string; icon: any; text: string; open: boolean; onToggle: () => void }> = ({ title, icon: Icon, text, open, onToggle }) => (
  <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
    <button onClick={onToggle} className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50">
      <Icon className="w-4 h-4 text-indigo-600" />
      <span className="font-black text-slate-900 text-sm flex-1">{title}</span>
      {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
    </button>
    {open && <div className="px-4 pb-4"><div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4">{text || '—'}</div></div>}
  </div>
);

const DeployLaunch: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [mode, setMode] = useState<'match' | 'broad'>('match');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState<any>(null);
  const [openPlan, setOpenPlan] = useState(true);
  const [openListing, setOpenListing] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const loadCampaigns = async () => {
    try { const r = await api.deployCampaigns(); setCampaigns(arr(r)); } catch { /* */ }
  };
  useEffect(() => {
    api.getDeployProjects().then((r: any) => {
      const items = arr(r);
      setProjects(items);
      if (items.length && !project) setProject(items[0].name);
    }).catch(() => { /* */ });
    loadCampaigns();
    /* eslint-disable-next-line */
  }, []);

  const launch = async () => {
    if (!project) { setErr('Chọn dự án để triển khai.'); return; }
    setErr(''); setLoading(true); setResult(null);
    try {
      const kw = keywords.split(',').map(s => s.trim()).filter(Boolean);
      const r = await api.deployLaunch({ project, keywords: kw.length ? kw : undefined, mode });
      setResult(r);
      setOpenPlan(true); setOpenListing(false);
      loadCampaigns();
    } catch (e: any) { setErr(e?.message || 'Triển khai thất bại.'); }
    setLoading(false);
  };

  const camp = result?.campaign || null;
  const kit = result?.kit || {};
  const bySaleN = camp?.bySale && typeof camp.bySale === 'object' ? Object.keys(camp.bySale).length : 0;
  const interested = n(camp?.interested);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><Rocket className="w-5 h-5" /><span className="font-black">Triển khai dự án tự động</span></div>
        <p className="text-sm opacity-90">1 lệnh — Trợ lý AI dựng bộ bán hàng → lọc khách quan tâm → giao đều sale.</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-black text-slate-500 mb-1 block">Dự án</label>
            <select value={project} onChange={e => setProject(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm">
              {projects.length === 0 && <option value="">— chưa có dự án —</option>}
              {projects.map((p: any) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-500 mb-1 block">Từ khoá mục tiêu (cách nhau bởi dấu phẩy)</label>
            <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="vd: căn hộ 2PN, đầu tư, quận 7" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-black text-slate-500 mb-1 block">Cách lọc khách</label>
          <div className="inline-flex items-center gap-1.5 bg-slate-100 rounded-xl p-1">
            <button onClick={() => setMode('match')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-sm transition ${mode === 'match' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
              <Target className="w-4 h-4" /> Khớp tín hiệu
            </button>
            <button onClick={() => setMode('broad')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-sm transition ${mode === 'broad' ? 'bg-white text-indigo-600 shadow' : 'text-slate-500 hover:text-slate-700'}`}>
              <Radar className="w-4 h-4" /> Phủ toàn tệp
            </button>
          </div>
        </div>

        {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

        <button onClick={launch} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang triển khai… (có thể mất 30–60 giây)</> : <><Sparkles className="w-4 h-4" /> Triển khai tự động</>}
        </button>
      </div>

      {/* Result */}
      {camp && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <span className="font-black text-slate-900">Phễu triển khai · {camp.project}</span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">{camp.mode === 'broad' ? 'Phủ toàn tệp' : 'Khớp tín hiệu'}</span>
            </div>
            <div className="flex items-stretch gap-2 flex-wrap">
              <FunnelCard label="Đã quét" val={n(camp.reach)} icon={Radar} c="bg-slate-700" />
              <FunnelCard label="Có liên hệ" val={n(camp.info)} icon={Users} c="bg-sky-500" />
              <FunnelCard label="Quan tâm" val={interested} icon={Target} c="bg-fuchsia-600" />
              <FunnelCard label="Đã giao sale" val={n(camp.assigned)} icon={UserCheck} c="bg-emerald-600" last />
            </div>
            <div className="mt-3 flex items-center gap-2 text-[12px] text-slate-500 font-bold">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Chia cho {bySaleN} sale
            </div>
            {interested === 0 && camp.mode !== 'broad' && (
              <div className="mt-2 flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-[12px] font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Chưa có khách khớp tín hiệu — thử thêm từ khoá mục tiêu, hoặc chọn "Phủ toàn tệp".
              </div>
            )}
          </div>

          <Collapsible title="Kế hoạch bán (AI)" icon={ClipboardList} text={kit.saleplan || ''} open={openPlan} onToggle={() => setOpenPlan(v => !v)} />
          <Collapsible title="Nội dung đăng (AI)" icon={Newspaper} text={kit.listing || ''} open={openListing} onToggle={() => setOpenListing(v => !v)} />
        </div>
      )}

      {/* Recent campaigns */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3"><History className="w-4 h-4 text-slate-500" /><span className="font-black text-slate-900 text-sm">Chiến dịch gần đây</span></div>
        {campaigns.length === 0 ? <p className="text-[12px] text-slate-400">Chưa có chiến dịch nào.</p> : (
          <div className="divide-y divide-slate-50 -mx-1">
            {campaigns.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 px-1 py-2.5 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-800 text-sm truncate">{c.project}</div>
                  <div className="text-[11px] text-slate-400">{c.ts ? (typeof c.ts === 'number' ? new Date(c.ts).toLocaleString('vi-VN') : String(c.ts)) : ''}</div>
                </div>
                <div className="text-[11px] font-bold text-slate-500 shrink-0">
                  <span className="text-slate-700">{n(c.reach)}</span> quét → <span className="text-fuchsia-600">{n(c.interested)}</span> quan tâm → <span className="text-emerald-600">{n(c.assigned)}</span> giao
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">{c.mode === 'broad' ? 'Phủ toàn tệp' : 'Khớp tín hiệu'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeployLaunch;
