import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Loader2, ShieldCheck, Handshake, UserSquare, Users, Link2, Copy, Check,
  ExternalLink, Phone, RefreshCw, CheckCircle2, Circle, Wallet, LayoutTemplate,
  Calculator, Globe, TrendingUp, Building2
} from 'lucide-react';
import { api } from '../services/apiService';

const fmtVnd = (n: any): string => {
  const x = Number(n);
  if (!x || Number.isNaN(x)) return '—';
  if (x >= 1e9) return (x / 1e9).toFixed(2).replace(/\.?0+$/, '') + ' tỷ';
  if (x >= 1e6) return Math.round(x / 1e6) + ' tr';
  return String(Math.round(x));
};
const timeAgo = (ts: any): string => {
  if (!ts) return '';
  const ms = typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(String(ts));
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 60) return `${Math.max(1, m)} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
};
const STAGE_LABELS: Record<string, string> = {
  onboard: 'Hồ sơ dự án', train: 'Huấn luyện AI', exam: 'Sát hạch', match: 'Ghép sale',
  campaign: 'Chiến dịch', launch: 'Ra quân', report: 'Báo cáo',
};

type Role = 'admin' | 'g2' | 'sale' | 'khach';

const ProjectWorkspace: React.FC<{ project: string; onBack: () => void }> = ({ project, onBack }) => {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>('admin');
  const [copied, setCopied] = useState('');

  const load = async () => { setLoading(true); setD(await api.saasProjectDetail(project)); setLoading(false); };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [project]);

  const base = window.location.origin + window.location.pathname;
  const lpUrl = (ref?: string) => `${base}#/lp/${encodeURIComponent(project)}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;
  const copy = (id: string, t: string) => { try { navigator.clipboard.writeText(t); setCopied(id); setTimeout(() => setCopied(''), 1500); } catch { /* */ } };

  if (loading && !d) return <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;

  const ROLES: { id: Role; label: string; icon: any }[] = [
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
    { id: 'g2', label: 'Sàn G2', icon: Handshake },
    { id: 'sale', label: 'Sale', icon: UserSquare },
    { id: 'khach', label: 'Khách', icon: Users },
  ];

  return (
    <div className="space-y-5">
      {/* Header workspace */}
      <div className="bg-gradient-to-br from-indigo-700 to-fuchsia-600 rounded-3xl p-6 text-white">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-black opacity-90 hover:opacity-100 mb-2"><ArrowLeft className="w-3.5 h-3.5" /> Danh sách dự án</button>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-2xl font-black leading-tight">{project}</h2>
            <p className="text-sm opacity-90 mt-1">Bảng điều khiển dự án — mỗi vai trò một góc nhìn riêng.</p>
          </div>
          <div className="flex gap-5 text-center">
            <div><p className="text-xl font-black tabular-nums">{d?.deploy?.done ?? 0}/{d?.deploy?.total ?? 7}</p><p className="text-[10px] font-bold uppercase opacity-80">Triển khai</p></div>
            <div><p className="text-xl font-black tabular-nums">{d?.units ?? 0}</p><p className="text-[10px] font-bold uppercase opacity-80">Quỹ căn</p></div>
            <div><p className="text-xl font-black tabular-nums">{d?.totalLeads ?? 0}</p><p className="text-[10px] font-bold uppercase opacity-80">Khách</p></div>
          </div>
        </div>
        {/* Role switcher */}
        <div className="flex gap-1.5 mt-4 bg-white/15 rounded-2xl p-1.5 w-fit">
          {ROLES.map(r => {
            const Icon = r.icon; const on = role === r.id;
            return (
              <button key={r.id} onClick={() => setRole(r.id)} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-black transition ${on ? 'bg-white text-indigo-700 shadow' : 'text-white/85 hover:bg-white/10'}`}>
                <Icon className="w-4 h-4" /> {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {role === 'admin' && <AdminBoard d={d} project={project} onChanged={load} />}
      {role === 'g2' && <G2Board d={d} project={project} lpUrl={lpUrl} copy={copy} copied={copied} />}
      {role === 'sale' && <SaleBoard d={d} project={project} lpUrl={lpUrl} copy={copy} copied={copied} />}
      {role === 'khach' && <KhachBoard d={d} project={project} lpUrl={lpUrl} copy={copy} copied={copied} base={base} />}
    </div>
  );
};

// ================= ADMIN =================
const AdminBoard: React.FC<{ d: any; project: string; onChanged: () => void }> = ({ d, project, onChanged }) => {
  const [assignOpen, setAssignOpen] = useState(false);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Trạng thái triển khai */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <span className="font-black text-slate-800">Triển khai tự trị</span>
        <div className="mt-3 space-y-1.5">
          {(d?.deploy?.stages || []).map((st: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              {st.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-300" />}
              <span className={st.done ? 'text-slate-700' : 'text-slate-400'}>{STAGE_LABELS[st.key] || st.key}</span>
            </div>
          ))}
          {(d?.deploy?.stages || []).length === 0 && <p className="text-sm text-slate-400">Chưa triển khai — chạy ở tab "Triển khai tự trị".</p>}
        </div>
      </div>

      {/* Phễu + gán */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between">
          <span className="font-black text-slate-800">Phễu marketing & phân quyền</span>
          <button onClick={() => setAssignOpen(true)} className="text-xs font-black text-indigo-600 hover:underline">Gán sale/G2 →</button>
        </div>
        {d?.funnel ? (
          <div className="mt-3 space-y-1.5">
            {(d.funnel.stages || []).map((st: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-slate-400 font-black">{i + 1}.</span>
                <span className="flex-1 text-slate-700">{st.name}</span>
                <span className="text-xs font-bold text-fuchsia-600 tabular-nums">{st.budgetPct}%</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-400 mt-3">Chưa có phễu — tạo ở Marketing → Phễu Marketing.</p>}
        <div className="mt-3 pt-3 border-t border-slate-100 flex gap-4 text-sm">
          <span className="text-slate-500"><b className="text-slate-800">{(d?.sales || []).length}</b> sale</span>
          <span className="text-slate-500"><b className="text-slate-800">{(d?.partners || []).length}</b> sàn G2</span>
          <span className="text-slate-500"><b className="text-slate-800">{(d?.landings || []).length}</b> landing</span>
          <span className="text-slate-500"><b className="text-slate-800">{d?.unitsAvailable ?? 0}</b> căn còn bán</span>
        </div>
      </div>

      {/* Khách của dự án */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 lg:col-span-2">
        <span className="font-black text-slate-800">Khách của dự án ({d?.totalLeads ?? 0})</span>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead><tr className="text-left text-[11px] font-black text-slate-400 uppercase border-b border-slate-100">
              <th className="py-2 pr-3">Khách</th><th className="py-2 pr-3">SĐT</th><th className="py-2 pr-3">Căn</th>
              <th className="py-2 pr-3">Nguồn (ref)</th><th className="py-2 pr-3">Sale phụ trách</th><th className="py-2">Lúc</th>
            </tr></thead>
            <tbody>
              {(d?.leads || []).map((l: any, i: number) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-2 pr-3 font-bold text-slate-800">{l.name}</td>
                  <td className="py-2 pr-3 text-emerald-700 font-bold">{l.phone}</td>
                  <td className="py-2 pr-3">{l.code || '—'}</td>
                  <td className="py-2 pr-3 text-slate-500 text-xs">{l.ref || 'trực tiếp'}</td>
                  <td className="py-2 pr-3 text-slate-600">{l.assigned || '—'}</td>
                  <td className="py-2 text-slate-400 text-xs">{timeAgo(l.ts)}</td>
                </tr>
              ))}
              {(d?.leads || []).length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-400">Chưa có khách — chia sẻ link landing để bắt đầu.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {assignOpen && <QuickAssign project={project} initSales={(d?.sales || []).map((s: any) => s.email)} initPartners={(d?.partners || []).map((p: any) => p.id)} onClose={(ch) => { setAssignOpen(false); if (ch) onChanged(); }} />}
    </div>
  );
};

// Modal gán nhanh (dùng chung)
const QuickAssign: React.FC<{ project: string; initSales: string[]; initPartners: string[]; onClose: (changed: boolean) => void }> = ({ project, initSales, initPartners, onClose }) => {
  const [roster, setRoster] = useState<{ email: string; name: string }[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [sales, setSales] = useState<string[]>(initSales);
  const [picked, setPicked] = useState<string[]>(initPartners);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.saasAdminOverview().then((x: any) => setRoster((x?.sales || []).map((s: any) => ({ email: s.email, name: s.name }))));
    api.saasPartners().then((x: any) => setPartners(x?.items || []));
  }, []);
  const save = async () => { setBusy(true); try { await api.saasAssign(project, sales, picked); onClose(true); return; } catch { /* */ } setBusy(false); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => onClose(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-black text-slate-900">Gán sale & sàn G2 — {project}</h3>
        <div>
          <p className="text-xs font-black text-slate-500 uppercase mb-2">Sale ({sales.length})</p>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {roster.map(r => {
              const on = sales.includes(r.email);
              return <button key={r.email} onClick={() => setSales(p => on ? p.filter(x => x !== r.email) : [...p, r.email])} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${on ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500'}`}>{r.name}</button>;
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-black text-slate-500 uppercase mb-2">Sàn G2 ({picked.length})</p>
          <div className="flex flex-wrap gap-2">
            {partners.map((p: any) => {
              const on = picked.includes(p.id);
              return <button key={p.id} onClick={() => setPicked(prev => on ? prev.filter(x => x !== p.id) : [...prev, p.id])} className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${on ? 'border-fuchsia-600 bg-fuchsia-50 text-fuchsia-700' : 'border-slate-100 text-slate-500'}`}>{p.name}</button>;
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => onClose(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-black text-sm">Huỷ</button>
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm disabled:opacity-60">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Lưu</button>
        </div>
      </div>
    </div>
  );
};

// ================= SÀN G2 =================
const G2Board: React.FC<any> = ({ d, project, lpUrl, copy, copied }) => (
  <div className="space-y-4">
    {(d?.partners || []).length === 0 && (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
        <Handshake className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="font-semibold text-slate-500">Dự án chưa gán sàn G2 nào.</p>
        <p className="text-sm">Vào tab Admin → "Gán sale/G2" để thêm đối tác phân phối.</p>
      </div>
    )}
    {(d?.partners || []).map((p: any, i: number) => (
      <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-black text-slate-900">{p.name}</p>
            <p className="text-xs text-slate-400">Hoa hồng {p.commissionPct}% · {p.leads} khách đã nộp cho dự án này</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => copy('g' + i, lpUrl(p.id))} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-fuchsia-200 text-fuchsia-700 font-black text-xs hover:bg-fuchsia-50">
              {copied === 'g' + i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Link phân phối
            </button>
            <a href={lpUrl(p.id)} target="_blank" rel="noreferrer" className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-fuchsia-600"><ExternalLink className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    ))}
    <p className="text-[11px] text-slate-400">Khách vào link phân phối của sàn nào → lead ghi nhận cho sàn đó, hoa hồng tính theo giá căn × %. Xem chi tiết từng sàn ở menu "Sàn G2".</p>
  </div>
);

// ================= SALE =================
const SaleBoard: React.FC<any> = ({ d, project, lpUrl, copy, copied }) => (
  <div className="space-y-4">
    {(d?.sales || []).length === 0 && (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-slate-400">
        <UserSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="font-semibold text-slate-500">Dự án chưa gán sale nào.</p>
        <p className="text-sm">Vào tab Admin → "Gán sale/G2" để phân công đội bán.</p>
      </div>
    )}
    {(d?.sales || []).map((s: any, i: number) => (
      <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-black text-slate-900">{s.name}</p>
            <p className="text-xs text-slate-400">{s.email} · {s.leads} khách được gán từ dự án này</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => copy('s' + i, lpUrl(s.email))} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 text-indigo-700 font-black text-xs hover:bg-indigo-50">
              {copied === 's' + i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Link giới thiệu
            </button>
            <a href={lpUrl(s.email)} target="_blank" rel="noreferrer" className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600"><ExternalLink className="w-4 h-4" /></a>
          </div>
        </div>
      </div>
    ))}
    <p className="text-[11px] text-slate-400">Mỗi sale dán link của mình vào quảng cáo/tin nhắn — khách vào link nào, lead tự về sale đó (kèm báo Telegram). Sale xem khách ở menu "Kênh bán của tôi".</p>
  </div>
);

// Slug tên miền — khớp chuẩn hoá backend (_inv_pkey)
const domainSlug = (name: string): string =>
  (name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd')
    .toLowerCase().trim().replace(/\s+/g, '-').slice(0, 60);

// ================= KHÁCH =================
const KhachBoard: React.FC<any> = ({ d, project, lpUrl, copy, copied, base }) => {
  const domain = `https://${domainSlug(project)}.fbgproperty.vn`;
  return (
    <div className="space-y-4">
      {/* Kênh công khai */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3">
        <span className="font-black text-slate-800 flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-600" /> Kênh công khai của dự án</span>
        {[
          { label: 'Tên miền riêng của dự án', url: domain, id: 'k0', icon: <Globe className="w-4 h-4 text-indigo-500" />, hint: 'ngắn gọn để chạy ads/in ấn — thêm ?ref=email để gắn sale' },
          { label: 'Trang giới thiệu dự án (landing)', url: lpUrl(), id: 'k1', icon: <LayoutTemplate className="w-4 h-4 text-fuchsia-500" /> },
          { label: 'Cổng khách — tra cứu căn quan tâm theo SĐT', url: `${base}#/khach`, id: 'k2', icon: <Users className="w-4 h-4 text-emerald-500" /> },
        ].map((x: any) => (
          <div key={x.id} className="bg-slate-50 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2">
              {x.icon}
              <span className="text-sm font-bold text-slate-700 flex-1 truncate">{x.label}</span>
              <button onClick={() => copy(x.id, x.url)} className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:underline shrink-0">
                {copied === x.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy
              </button>
              <a href={x.url} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-600 shrink-0"><ExternalLink className="w-3.5 h-3.5" /></a>
            </div>
            {x.hint && <p className="text-[11px] text-slate-400 mt-1 ml-6 truncate">{x.url.replace('https://', '')} — {x.hint}</p>}
          </div>
        ))}
        <p className="text-[11px] text-slate-400">Tên miền riêng hoạt động khi DNS wildcard (<b>*</b> → máy chủ) được thêm ở Cloudflare. Máy chủ đã cấu hình sẵn: SSL tự cấp, chỉ chấp nhận dự án có thật.</p>
      </div>

      {/* Tính vay — port từ ELC LoanCalculator */}
      <LoanCalc units={d?.units} />
    </div>
  );
};

// Máy tính vay (mô hình niên kim + lãi cố định, có ân hạn — theo ELC)
const LoanCalc: React.FC<{ units?: number }> = () => {
  const [price, setPrice] = useState(3000);        // triệu
  const [downPct, setDownPct] = useState(30);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [grace, setGrace] = useState(0);
  const [method, setMethod] = useState<'annuity' | 'flat'>('annuity');

  const r = useMemo(() => {
    const principal = price * 1e6 * (100 - downPct) / 100;
    const months = years * 12;
    if (principal <= 0 || months <= 0) return null;
    const g = Math.max(0, Math.min(grace, months));
    let balance = principal, totalInterest = 0, firstPayment = 0, maxPayment = 0;
    if (method === 'flat') {
      const pm = principal / months;
      const fi = principal * (rate / 100) / 12;
      for (let m = 1; m <= months; m++) {
        const interest = m <= g ? 0 : fi;
        const pay = pm + interest;
        if (m === 1) firstPayment = pay;
        maxPayment = Math.max(maxPayment, pay);
        totalInterest += interest;
      }
    } else {
      for (let m = 1; m <= months; m++) {
        const remaining = months - m + 1;
        const mr = m <= g ? 0 : rate / 100 / 12;
        const pay = mr === 0 ? balance / remaining : (balance * mr) / (1 - Math.pow(1 + mr, -remaining));
        const interest = balance * mr;
        totalInterest += interest;
        balance = Math.max(0, balance - (pay - interest));
        if (m === 1) firstPayment = pay;
        maxPayment = Math.max(maxPayment, pay);
      }
    }
    return { principal, firstPayment, maxPayment, totalInterest, total: principal + totalInterest };
  }, [price, downPct, rate, years, grace, method]);

  const Inp = ({ label, value, set, suffix, step = 1 }: any) => (
    <div>
      <label className="text-[11px] font-black text-slate-500">{label}</label>
      <div className="flex items-center gap-1 mt-1">
        <input type="number" value={value} step={step} onChange={e => set(Number(e.target.value))} className="w-full p-2 rounded-lg border border-slate-200 text-sm tabular-nums" />
        <span className="text-xs text-slate-400 font-bold shrink-0">{suffix}</span>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <span className="font-black text-slate-800 flex items-center gap-2"><Calculator className="w-4 h-4 text-emerald-600" /> Tính vay cho khách (gửi kèm khi tư vấn)</span>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
        <Inp label="Giá căn" value={price} set={setPrice} suffix="triệu" step={50} />
        <Inp label="Trả trước" value={downPct} set={setDownPct} suffix="%" />
        <Inp label="Lãi suất/năm" value={rate} set={setRate} suffix="%" step={0.1} />
        <Inp label="Thời hạn" value={years} set={setYears} suffix="năm" />
        <Inp label="Ân hạn 0%" value={grace} set={setGrace} suffix="tháng" />
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => setMethod('annuity')} className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 ${method === 'annuity' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500'}`}>Lãi giảm dần (trả đều)</button>
        <button onClick={() => setMethod('flat')} className={`px-3 py-1.5 rounded-lg text-xs font-black border-2 ${method === 'flat' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-500'}`}>Lãi cố định</button>
      </div>
      {r && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 rounded-xl p-3"><p className="text-[11px] font-black text-slate-400 uppercase">Số tiền vay</p><p className="text-lg font-black tabular-nums">{fmtVnd(r.principal)}</p></div>
          <div className="bg-emerald-50 rounded-xl p-3"><p className="text-[11px] font-black text-emerald-600 uppercase">Trả tháng đầu</p><p className="text-lg font-black text-emerald-700 tabular-nums">{fmtVnd(r.firstPayment)}</p></div>
          <div className="bg-slate-50 rounded-xl p-3"><p className="text-[11px] font-black text-slate-400 uppercase">Tổng lãi</p><p className="text-lg font-black tabular-nums">{fmtVnd(r.totalInterest)}</p></div>
          <div className="bg-slate-50 rounded-xl p-3"><p className="text-[11px] font-black text-slate-400 uppercase">Tổng gốc + lãi</p><p className="text-lg font-black tabular-nums">{fmtVnd(r.total)}</p></div>
        </div>
      )}
      <p className="text-[11px] text-slate-400 mt-2">Mô phỏng tham khảo — lãi suất thực tế theo ngân hàng tại thời điểm giải ngân.</p>
    </div>
  );
};

export default ProjectWorkspace;
