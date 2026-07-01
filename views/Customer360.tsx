import React, { useEffect, useState } from 'react';
import { X, Loader2, User, Phone, Mail, Star, Target, Copy, Check, Sparkles, Activity, ClipboardList, MapPin } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x) ? x : []);

const TRAIT_LABELS: Record<string, string> = {
  segment: 'Phân khúc',
  region: 'Khu vực',
  product: 'Loại hình',
  budget: 'Ngân sách',
  purpose: 'Mục đích',
  project_interest: 'Dự án quan tâm',
  note: 'Ghi chú',
};
const TRAIT_ORDER = ['segment', 'region', 'product', 'budget', 'purpose', 'project_interest', 'note'];

const Chip: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1">
    <span className="text-slate-400">{label}:</span>
    <span className="text-slate-700">{String(value)}</span>
  </span>
);

const Customer360: React.FC<{ id: string; onClose: () => void }> = ({ id, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setErr('');
    api.customer360(id)
      .then((r: any) => { if (alive) setData(r || {}); })
      .catch((e: any) => { if (alive) setErr(e?.message || 'Không tải được hồ sơ.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  const profile = data?.profile || null;
  const assignment = data?.assignment || null;
  const closeBrief = data?.closeBrief || '';
  const activity = arr(data?.activity);
  const traits = (profile?.traits || assignment?.traits || {}) as Record<string, any>;
  const name = profile?.fullName || assignment?.name || 'Khách';
  const phone = profile?.phone || assignment?.phone || '';

  const copy = () => { navigator.clipboard?.writeText(closeBrief); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="w-full max-w-xl h-full bg-slate-50 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0"><User className="w-5 h-5" /></div>
          <div className="min-w-0 flex-1">
            <div className="font-black text-slate-900 truncate leading-tight">{name}</div>
            {phone && <div className="text-[12px] text-slate-400 font-bold inline-flex items-center gap-1"><Phone className="w-3 h-3" />{phone}</div>}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? <div className="flex justify-center py-16 text-indigo-600"><Loader2 className="w-7 h-7 animate-spin" /></div> : err ? (
            <div className="text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold">{err}</div>
          ) : (
            <>
              {/* Hồ sơ */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-3"><User className="w-4 h-4 text-indigo-600" /><span className="font-black text-slate-900 text-sm">Hồ sơ</span></div>
                <div className="flex flex-wrap gap-2">
                  {profile?.score != null && <Chip label="Điểm" value={Number(profile.score) || 0} />}
                  {profile?.status && <Chip label="Trạng thái" value={profile.status} />}
                  {profile?.source && <Chip label="Nguồn" value={profile.source} />}
                  {profile?.email && <Chip label="Email" value={profile.email} />}
                  {TRAIT_ORDER.filter(k => traits?.[k]).map(k => <Chip key={k} label={TRAIT_LABELS[k] || k} value={traits[k]} />)}
                  {!profile && !Object.keys(traits || {}).length && <span className="text-[12px] text-slate-400">Chưa có hồ sơ chi tiết.</span>}
                </div>
              </div>

              {/* Được giao */}
              {assignment && (
                <div className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-emerald-600" /><span className="font-black text-slate-900 text-sm">Được giao</span></div>
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div><span className="text-slate-400 font-bold">Dự án</span><div className="font-bold text-slate-700 inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" />{assignment.project || '—'}</div></div>
                    <div><span className="text-slate-400 font-bold">Sale phụ trách</span><div className="font-bold text-slate-700">{assignment.saleName || assignment.sale || '—'}</div></div>
                    <div><span className="text-slate-400 font-bold">Giai đoạn</span><div className="font-bold text-slate-700">{assignment.stage || '—'}</div></div>
                    <div><span className="text-slate-400 font-bold">Tín hiệu khớp</span><div className="font-black text-emerald-600 inline-flex items-center gap-1"><Star className="w-3 h-3" />{Number(assignment.hits) || 0}</div></div>
                  </div>
                </div>
              )}

              {/* Tư vấn chốt */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-fuchsia-600" /><span className="font-black text-slate-900 text-sm">Tư vấn chốt của Trợ lý AI</span></div>
                  {closeBrief && <button onClick={copy} className="inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>}
                </div>
                {closeBrief
                  ? <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-gradient-to-br from-fuchsia-50 to-indigo-50 rounded-xl p-4">{closeBrief}</div>
                  : <p className="text-[12px] text-slate-400">Chưa có tư vấn chốt.</p>}
              </div>

              {/* Hoạt động */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4 text-sky-600" /><span className="font-black text-slate-900 text-sm">Hoạt động</span></div>
                {activity.length === 0 ? <p className="text-[12px] text-slate-400">Chưa có hoạt động.</p> : (
                  <div className="space-y-2">
                    {activity.map((a: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-[12px]">
                        <div className="w-6 h-6 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0 mt-0.5"><ClipboardList className="w-3 h-3" /></div>
                        <div className="min-w-0">
                          <div className="text-slate-700 font-semibold">{a?.title || a?.type || a?.action || a?.text || 'Hoạt động'}</div>
                          {(a?.note || a?.detail) && <div className="text-slate-400">{a.note || a.detail}</div>}
                          {a?.ts && <div className="text-[10px] text-slate-300">{typeof a.ts === 'number' ? new Date(a.ts).toLocaleString('vi-VN') : String(a.ts)}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customer360;
