import React, { useEffect, useRef, useState } from 'react';
import {
  Megaphone, Loader2, Sparkles, ShieldCheck, Users, Target, Database,
  Send, Brain, AlertTriangle, CheckCircle2, PlayCircle, Clock, Flag, Info,
} from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x) ? x : []);
const n = (x: any) => Number(x) || 0;

const STATUS: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Chờ duyệt', color: '#f59e0b', icon: Clock },
  submitted: { label: 'Đã báo Giám đốc', color: '#6366f1', icon: Send },
  approved: { label: 'Đang thực thi', color: '#0d9488', icon: PlayCircle },
  running: { label: 'Đang thực thi', color: '#0d9488', icon: PlayCircle },
  done: { label: 'Hoàn thành', color: '#10b981', icon: Flag },
};

const KpiCard: React.FC<{ label: string; val: React.ReactNode; icon: any; c: string }> = ({ label, val, icon: Icon, c }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 flex-1 min-w-[130px]">
    <div className={`w-9 h-9 rounded-xl ${c} flex items-center justify-center text-white mb-2`}><Icon className="w-4 h-4" /></div>
    <p className="text-2xl font-black text-slate-900 leading-none">{val}</p>
    <p className="text-[10px] text-slate-400 font-bold mt-1">{label}</p>
  </div>
);

const CampaignApproval: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [plan, setPlan] = useState<any>(null);
  const [planning, setPlanning] = useState(false);
  const [approving, setApproving] = useState(false);
  const [err, setErr] = useState('');
  const pollRef = useRef<any>(null);

  const hasPlan = plan && plan.status && plan.status !== 'none';

  useEffect(() => {
    api.getDeployProjects().then((r: any) => {
      const items = arr(r);
      setProjects(items);
      if (items.length) setProject(items[0]?.name || '');
    }).catch(() => { /* */ });
    api.campaignStatus().then((r: any) => {
      if (r && r.status && r.status !== 'none') setPlan(r);
    }).catch(() => { /* */ });
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    /* eslint-disable-next-line */
  }, []);

  const doPlan = async () => {
    if (!project) { setErr('Chọn dự án để lập kế hoạch.'); return; }
    setErr(''); setPlanning(true);
    try {
      const r = await api.campaignPlan(project);
      if (r && r.status && r.status !== 'none') setPlan(r);
      else setErr('Chưa lập được kế hoạch.');
    } catch (e: any) { setErr(e?.message || 'Chưa lập được kế hoạch.'); }
    setPlanning(false);
  };

  const startPoll = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    let ticks = 0;
    pollRef.current = setInterval(async () => {
      ticks++;
      try {
        const r = await api.campaignStatus();
        if (r && r.status && r.status !== 'none') setPlan(r);
        if (r?.status === 'done' || ticks >= 6) { clearInterval(pollRef.current); pollRef.current = null; }
      } catch { /* */ }
    }, 5000);
  };

  const doApprove = async () => {
    if (!window.confirm('Duyệt kế hoạch? Hệ thống sẽ chia data cho sale và đẩy Telegram yêu cầu chăm qua Zalo.')) return;
    setErr(''); setApproving(true);
    try {
      const r = await api.campaignApprove();
      if (r?.status) setPlan((p: any) => ({ ...(p || {}), status: r.status }));
      startPoll();
    } catch (e: any) { setErr(e?.message || 'Chưa duyệt được (chỉ Giám đốc/Admin).'); }
    setApproving(false);
  };

  const status = String(plan?.status || '');
  const meta = STATUS[status] || STATUS.pending;
  const StatusIcon = meta.icon;
  const canApprove = ['pending', 'submitted'].includes(status);
  const isLive = status === 'done' || status === 'running' || status === 'approved';
  const cdpOk = !!plan?.cdpOk;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><Megaphone className="w-5 h-5" /><span className="font-black text-lg">Chiến dịch phân bổ data</span></div>
        <p className="text-sm opacity-90">Lập kế hoạch → Giám đốc duyệt → hệ thống tự chia data + đẩy cho sale chăm qua Zalo.</p>
      </div>

      {/* Lập kế hoạch */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className="text-[11px] font-black text-slate-500 mb-1 block">Dự án</label>
            <select value={project} onChange={e => setProject(e.target.value)} className="w-full p-2.5 rounded-xl border border-slate-200 text-sm">
              {projects.length === 0 && <option value="">— chưa có dự án —</option>}
              {projects.map((p: any) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <button onClick={doPlan} disabled={planning} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap">
            {planning ? <><Loader2 className="w-4 h-4 animate-spin" /> Trợ lý AI đang lập kế hoạch…</> : <><Sparkles className="w-4 h-4" /> Lập kế hoạch</>}
          </button>
        </div>
        {err && <div className="mt-3 flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}
      </div>

      {/* Empty state */}
      {!hasPlan && !planning && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3"><Megaphone className="w-6 h-6" /></div>
          <p className="font-black text-slate-800">Chưa có kế hoạch nào</p>
          <p className="text-sm text-slate-400 mt-1">Chọn một dự án và bấm <b className="text-slate-600">Lập kế hoạch</b> để Trợ lý AI dựng phương án chia data cho sale.</p>
        </div>
      )}

      {/* Plan display */}
      {hasPlan && (
        <div className="space-y-4">
          {/* Status + project */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900">Kế hoạch · {plan?.project || '—'}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg" style={{ background: meta.color + '22', color: meta.color }}>
                <StatusIcon className="w-3.5 h-3.5" /> {meta.label}
              </span>
            </div>
            {isLive && (
              <div className="mt-3 flex items-center gap-2 text-[12px] font-bold text-emerald-700 bg-emerald-50 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Đã chia: {n(plan?.assignedTotal)} lead · Đã đẩy {n(plan?.pushed)} sale
              </div>
            )}
          </div>

          {/* KPI funnel */}
          <div className="flex items-stretch gap-2 flex-wrap">
            <KpiCard label="ERP cần chia" val={n(plan?.erpToDistribute)} icon={Database} c="bg-slate-700" />
            <KpiCard label="Mỗi sale" val={n(plan?.perSaleErp)} icon={Target} c="bg-fuchsia-600" />
            <KpiCard label="Số sale" val={Array.isArray(plan?.sales) ? plan.sales.length : 0} icon={Users} c="bg-sky-500" />
            <KpiCard label="CDP" val={cdpOk ? n(plan?.cdpTotal) : <span className="text-sm text-slate-400">chờ dịch vụ</span>} icon={Database} c="bg-emerald-600" />
          </div>

          {/* Strategy */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2"><Brain className="w-4 h-4 text-indigo-600" /><span className="font-black text-slate-900 text-sm">Chiến lược (Giám đốc Kinh doanh)</span></div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-xl p-4">{plan?.strategy || '—'}</div>
          </div>

          {/* Sales list */}
          {Array.isArray(plan?.sales) && plan.sales.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-3"><Users className="w-4 h-4 text-slate-500" /><span className="font-black text-slate-900 text-sm">Sale nhận data · {plan.sales.length}</span></div>
              <div className="flex flex-wrap gap-1.5">
                {plan.sales.map((s: any, k: number) => (
                  <span key={s?.email || k} className="text-[12px] font-bold text-slate-600 bg-slate-100 rounded-lg px-2.5 py-1">{s?.name || s?.email || '—'}</span>
                ))}
              </div>
            </div>
          )}

          {/* Approve & execute */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <button onClick={doApprove} disabled={!canApprove || approving} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {approving ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi duyệt…</> : <><ShieldCheck className="w-4 h-4" /> Duyệt & Thực thi</>}
            </button>
            {!canApprove && isLive && (
              <div className="mt-3 flex items-center gap-2 text-[12px] font-bold text-teal-700 bg-teal-50 rounded-xl px-3 py-2">
                <PlayCircle className="w-4 h-4 shrink-0" /> Kế hoạch đang được thực thi — hệ thống tự chia data và đẩy cho sale.
              </div>
            )}
            <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-400 font-semibold">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Chỉ Giám đốc/Admin duyệt được. Thực thi chạy nền ~15-20 phút.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignApproval;
