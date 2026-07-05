import React, { useEffect, useState } from 'react';
import { Filter, Loader2, Sparkles, Copy, Check, RefreshCw, Target, Users, Megaphone, Radio, ChevronDown, TrendingUp, Wallet } from 'lucide-react';
import { api } from '../services/apiService';

const STAGE_COLORS = ['from-fuchsia-600 to-fuchsia-500', 'from-violet-600 to-violet-500', 'from-indigo-600 to-indigo-500', 'from-blue-600 to-blue-500', 'from-emerald-600 to-emerald-500'];
const STAGE_WIDTHS = ['100%', '88%', '76%', '64%', '54%'];

const MarketingFunnel: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [brief, setBrief] = useState('');
  const [funnel, setFunnel] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<number>(0);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    api.getProjectsCbx().then((r: any) => {
      const items = r?.items || r?.data?.items || r?.data || [];
      setProjects(Array.isArray(items) ? items : []);
    }).catch(() => { /* */ });
  }, []);

  // Nạp phễu đã lưu khi đổi dự án
  useEffect(() => {
    if (!project) { setFunnel(null); return; }
    api.marketingFunnelGet(project).then((f: any) => {
      setFunnel(f && Array.isArray(f.stages) && f.stages.length ? f : null);
    }).catch(() => setFunnel(null));
  }, [project]);

  const gen = async () => {
    if (!project) { setErr('Chọn dự án trước.'); return; }
    setLoading(true); setErr('');
    try {
      const f = await api.marketingFunnelGen(project, brief.trim() || undefined);
      if (f?.error) throw new Error(f.error);
      setFunnel(f); setOpen(0);
    } catch (e: any) { setErr(e?.message || 'Không tạo được phễu. Thử lại.'); }
    setLoading(false);
  };

  const copy = (id: string, text: string) => {
    try { navigator.clipboard.writeText(text || ''); setCopied(id); setTimeout(() => setCopied(''), 1500); } catch { /* */ }
  };

  const stages: any[] = funnel?.stages || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-fuchsia-600 to-indigo-600 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-5 h-5" />
          <span className="font-black text-lg">Phễu Marketing theo dự án (chuẩn ngành BĐS)</span>
        </div>
        <p className="text-sm opacity-90">Chọn dự án → trợ lý AI dựng phễu 5 giai đoạn (Nhận biết → Quan tâm → Cân nhắc → Hành động → Ủng hộ) theo mô hình AIDA · 5A · TOFU/MOFU/BOFU, kèm kênh, ngân sách, nội dung mẫu dùng được ngay.</p>
      </div>

      {/* Chọn dự án + tạo */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black text-slate-500">Dự án</label>
            <select value={project} onChange={e => setProject(e.target.value)} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm">
              <option value="">— chọn dự án —</option>
              {projects.map((p: any) => <option key={p.id || p.slug || p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-black text-slate-500">Định hướng thêm (tuỳ chọn)</label>
            <input value={brief} onChange={e => setBrief(e.target.value)} placeholder="vd: tập trung khách đầu tư, ngân sách thấp, đẩy mạnh TikTok…" className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={gen} disabled={loading || !project} className="inline-flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {funnel ? 'Tạo lại phễu' : 'Tạo phễu marketing'}
          </button>
          {loading && <span className="text-[12px] font-bold text-fuchsia-600">Trợ lý AI đang dựng phễu theo chuẩn ngành… (~30-60s)</span>}
          {err && <span className="text-[12px] font-bold text-amber-600">{err}</span>}
        </div>
      </div>

      {/* Kết quả */}
      {funnel && (
        <>
          {/* Định vị + khách tổng thể */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1"><Target className="w-3.5 h-3.5" /> Định vị</p>
              <p className="text-sm text-slate-700 leading-relaxed">{funnel.summary || '—'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-1"><Users className="w-3.5 h-3.5" /> Khách mục tiêu</p>
              <p className="text-sm text-slate-700 leading-relaxed">{funnel.target || '—'}</p>
            </div>
          </div>

          {/* Phễu trực quan */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Phễu 5 giai đoạn — bấm để xem chi tiết</p>
            <div className="flex flex-col items-center gap-1.5">
              {stages.map((st, i) => {
                const active = open === i;
                return (
                  <button key={i} onClick={() => setOpen(active ? -1 : i)}
                    style={{ width: STAGE_WIDTHS[i] || '50%' }}
                    className={`bg-gradient-to-r ${STAGE_COLORS[i % STAGE_COLORS.length]} text-white rounded-xl px-4 py-3 shadow-sm transition-all hover:brightness-110 ${active ? 'ring-4 ring-fuchsia-200' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-sm truncate">{i + 1}. {st.name}</span>
                      <span className="text-[11px] font-bold bg-white/25 rounded-full px-2 py-0.5 shrink-0 flex items-center gap-1"><Wallet className="w-3 h-3" />{st.budgetPct ?? '—'}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chi tiết giai đoạn đang mở */}
          {stages[open] && (
            <div className="bg-white rounded-2xl border-2 border-fuchsia-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-lg bg-gradient-to-r ${STAGE_COLORS[open % STAGE_COLORS.length]} text-white flex items-center justify-center font-black text-sm`}>{open + 1}</span>
                <h3 className="text-lg font-black text-slate-900">{stages[open].name}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Info icon={<Target className="w-3.5 h-3.5" />} label="Mục tiêu" text={stages[open].goal} />
                <Info icon={<Users className="w-3.5 h-3.5" />} label="Chân dung khách" text={stages[open].audience} />
                <Info icon={<Megaphone className="w-3.5 h-3.5" />} label="Thông điệp cốt lõi" text={stages[open].message} />
                <Info icon={<TrendingUp className="w-3.5 h-3.5" />} label="Chỉ số đo (KPI)" text={stages[open].kpi} />
              </div>

              <div className="flex flex-wrap gap-2">
                {(stages[open].channels || []).map((c: string, k: number) => (
                  <span key={k} className="inline-flex items-center gap-1 text-xs font-bold bg-indigo-50 text-indigo-700 rounded-full px-3 py-1"><Radio className="w-3 h-3" />{c}</span>
                ))}
                {(stages[open].contentTypes || []).map((c: string, k: number) => (
                  <span key={'ct' + k} className="text-xs font-bold bg-slate-100 text-slate-600 rounded-full px-3 py-1">{c}</span>
                ))}
              </div>

              {stages[open].cta && (
                <div className="bg-fuchsia-50 rounded-xl p-3">
                  <p className="text-[11px] font-black text-fuchsia-500 uppercase">Kêu gọi hành động</p>
                  <p className="text-sm font-bold text-fuchsia-800">{stages[open].cta}</p>
                </div>
              )}

              {/* Nội dung mẫu dùng ngay */}
              {(stages[open].samples || []).length > 0 && (
                <div className="space-y-2.5">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Nội dung mẫu (dùng được ngay)</p>
                  {(stages[open].samples || []).map((sm: any, k: number) => {
                    const id = `${open}-${k}`;
                    return (
                      <div key={k} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-indigo-700 bg-indigo-50 rounded-lg px-2 py-0.5">{sm.type || 'Nội dung'}</span>
                          <button onClick={() => copy(id, sm.text)} className="inline-flex items-center gap-1 text-xs font-black text-fuchsia-600 hover:underline">
                            {copied === id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied === id ? 'Đã copy' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{sm.text}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!funnel && !loading && (
        <div className="text-center py-16 text-slate-400">
          <Filter className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-slate-500">Chọn một dự án và bấm "Tạo phễu marketing".</p>
          <p className="text-sm">Trợ lý AI sẽ dựng chiến lược phễu đầy đủ theo chuẩn ngành bất động sản.</p>
        </div>
      )}
    </div>
  );
};

const Info: React.FC<{ icon: React.ReactNode; label: string; text?: string }> = ({ icon, label, text }) => (
  <div className="bg-slate-50 rounded-xl p-3">
    <p className="text-[11px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-0.5">{icon}{label}</p>
    <p className="text-sm text-slate-700 leading-relaxed">{text || '—'}</p>
  </div>
);

export default MarketingFunnel;
