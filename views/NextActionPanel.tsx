import React, { useEffect, useState } from 'react';
import { Zap, Loader2, Sparkles, Copy, Check, AlertTriangle, ListChecks, User } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => { const c = Array.isArray(x) ? x : (x?.data?.items || x?.items || x?.data?.data || x?.data); return Array.isArray(c) ? c : []; };
const STAGES = ['Khách mới', 'Quan tâm', 'Đang tư vấn', 'Đàm phán', 'Chốt cọc', 'Nguội'];

const ResultBox: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="relative">
      <button onClick={copy} className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>
      <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-2xl p-4 pr-16">{text}</div>
    </div>
  );
};

const NextActionPanel: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [cid, setCid] = useState('');
  const [project, setProject] = useState('');
  const [stage, setStage] = useState('Quan tâm');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [pbLoading, setPbLoading] = useState(false);
  const [action, setAction] = useState('');
  const [playbook, setPlaybook] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    api.getCdpCustomers({ page: 1, pageSize: 100 }).then((r: any) => setCustomers(arr(r))).catch(() => { /* */ });
    api.getProjectsCbx().then((r: any) => setProjects(r?.items || r?.data?.items || r?.data || [])).catch(() => { /* */ });
  }, []);

  const cust = customers.find((c: any) => (c.id || c._id) === cid);
  const cname = (c: any) => c?.fullName || c?.name || c?.phone || 'Khách';
  const cphone = (c: any) => c?.phone || c?.mobile || '';

  const suggest = async () => {
    if (!cid) { setErr('Chọn khách.'); return; }
    setErr(''); setLoading(true); setAction('');
    try {
      let history = '';
      const ph = cphone(cust);
      if (ph) { try { const m: any = await api.memRecall(ph, 'lịch sử quan tâm và trao đổi'); const mm = m?.memories || m?.results || m?.data; if (Array.isArray(mm)) history = mm.map((x: any) => (typeof x === 'string' ? x : x?.memory || x?.text || '')).filter(Boolean).join('; '); } catch { /* */ } }
      const r = await api.salesNextAction({ name: cname(cust), phone: ph, stage, note, project, history });
      setAction(r?.text || '');
    } catch (e: any) { setErr(e?.message || 'Lỗi'); }
    setLoading(false);
  };
  const genPlaybook = async () => {
    setErr(''); setPbLoading(true); setPlaybook('');
    try { const r = await api.salesPlaybook({ stage, project }); setPlaybook(r?.text || ''); }
    catch (e: any) { setErr(e?.message || 'Lỗi'); }
    setPbLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /><span className="font-black text-slate-900">Next-best-action — Hành động kế tiếp cho từng khách</span></div>
        <p className="text-xs text-slate-400 -mt-2">AI đọc hồ sơ + trí nhớ (Bộ nhớ AI theo SĐT) + tài liệu dự án → đánh giá khách, đề xuất việc cần làm + tin nhắn mẫu sẵn gửi.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={cid} onChange={e => { setCid(e.target.value); setAction(''); }} className="p-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="">— chọn khách —</option>
            {customers.map((c: any) => <option key={c.id || c._id} value={c.id || c._id}>{cname(c)}{cphone(c) ? ` · ${cphone(c)}` : ''}</option>)}
          </select>
          <select value={project} onChange={e => setProject(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 text-sm">
            <option value="">— dự án quan tâm (tuỳ chọn) —</option>
            {projects.map((p: any) => <option key={p.id || p.slug || p.name} value={p.name}>{p.name}</option>)}
          </select>
          <select value={stage} onChange={e => setStage(e.target.value)} className="p-2.5 rounded-xl border border-slate-200 text-sm">
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú (vd: hỏi giá 2PN, đã xem nhà mẫu)" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={suggest} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl font-black text-sm hover:bg-amber-600 disabled:opacity-60">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Gợi ý hành động
          </button>
          <button onClick={genPlaybook} disabled={pbLoading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-60">
            {pbLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListChecks className="w-4 h-4" />} Kịch bản chăm sóc (giai đoạn {stage})
          </button>
        </div>
        {action && <div className="space-y-1"><div className="flex items-center gap-1.5 text-[11px] font-black text-amber-600"><User className="w-3.5 h-3.5" /> Hành động cho {cname(cust)}</div><ResultBox text={action} /></div>}
        {playbook && <div className="space-y-1"><div className="flex items-center gap-1.5 text-[11px] font-black text-indigo-600"><ListChecks className="w-3.5 h-3.5" /> Playbook chăm sóc · {stage}</div><ResultBox text={playbook} /></div>}
        <p className="text-[11px] text-slate-400">Tin nhắn AI gợi ý — <b>duyệt</b> trước khi gửi khách (Nghị định 13/2023).</p>
      </div>
    </div>
  );
};

export default NextActionPanel;
