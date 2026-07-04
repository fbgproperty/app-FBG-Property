import React, { useEffect, useState } from 'react';
import { FileText, Loader2, Sparkles, Copy, Check, Send, RefreshCw, History as HistoryIcon, Trash2, Clock, RotateCcw } from 'lucide-react';
import { api } from '../services/apiService';

const timeAgo = (ts: any): string => {
  if (!ts) return '';
  const ms = typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : Date.parse(String(ts));
  if (Number.isNaN(ms)) return '';
  const m = Math.floor((Date.now() - ms) / 60000);
  if (m < 1) return 'vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return new Date(ms).toLocaleDateString('vi-VN');
};

type CType = 'campaign_plan' | 'facebook_post' | 'zalo_broadcast' | 'caption' | 'video_script' | 'ad_copy';
const TYPES: { id: CType; label: string }[] = [
  { id: 'campaign_plan', label: 'Kế hoạch chiến dịch (Chiến lược)' },
  { id: 'facebook_post', label: 'Bài đăng Facebook' },
  { id: 'zalo_broadcast', label: 'Tin Zalo chăm khách' },
  { id: 'caption', label: 'Caption + hashtag' },
  { id: 'video_script', label: 'Kịch bản video 30s' },
  { id: 'ad_copy', label: 'Nội dung quảng cáo' },
];

const ContentFactory: React.FC = () => {
  const [projects, setProjects] = useState<string[]>([]);
  const [project, setProject] = useState('');
  const [type, setType] = useState<CType>('facebook_post');
  const [note, setNote] = useState('');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  const FEATURE = 'content-factory';
  const [history, setHistory] = useState<any[]>([]);
  const [histCopied, setHistCopied] = useState('');
  const loadHistory = async () => {
    try { const r = await api.contentHistory(FEATURE, { limit: 40 }); setHistory(Array.isArray(r?.items) ? r.items : []); } catch { /* */ }
  };

  useEffect(() => {
    api.ragProjects().then(ps => { setProjects(ps); setProject(ps[0] || ''); }).catch(() => setErr('Không tải được danh sách dự án.'));
    loadHistory();
  }, []);

  const gen = async () => {
    if (!project) { setErr('Chọn dự án.'); return; }
    setLoading(true); setErr(''); setOut('');
    try {
      const r = await api.contentDraft(project, type, note);
      const text = (r?.text || r?.answer || '').toString();
      setOut(text);
      if (text) {
        const label = TYPES.find(t => t.id === type)?.label || 'Nội dung';
        try { await api.contentSave({ feature: FEATURE, kind: type, title: `${label} · ${project}`, text, meta: { project, note } }); } catch { /* */ }
        loadHistory();
      }
    } catch (e: any) { setErr(e?.message || 'Lỗi sinh nội dung'); } finally { setLoading(false); }
  };
  const copy = () => { navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const copyHist = (id: string, text: string) => { try { navigator.clipboard.writeText(text || ''); setHistCopied(id); setTimeout(() => setHistCopied(''), 1500); } catch { /* */ } };
  const deleteHistory = async (id: string) => { setHistory(prev => prev.filter(h => String(h.id) !== String(id))); try { await api.contentDelete(id); } catch { /* */ } };

  // ===== Phân phối nội dung qua Zalo (gửi hàng loạt) =====
  const [zaloAccounts, setZaloAccounts] = useState<any[]>([]);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendForm, setSendForm] = useState({ accountId: '', phones: '' });
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState('');
  useEffect(() => { api.mktGet('accounts').then((r: any) => { const a = r?.data?.items || r?.data || []; setZaloAccounts(Array.isArray(a) ? a : []); }).catch(() => { }); }, []);
  const sendZalo = async () => {
    const acc = sendForm.accountId || zaloAccounts[0]?._id;
    const phones = Array.from(new Set(sendForm.phones.split(/[\s,;]+/).map(s => s.replace(/[^0-9]/g, '')).filter(p => p.length >= 8)));
    if (!acc) { setSentMsg('⚠ Chưa có tài khoản Zalo kết nối (khu Kênh).'); return; }
    if (!phones.length) { setSentMsg('⚠ Nhập danh sách SĐT.'); return; }
    if (!out.trim()) { setSentMsg('⚠ Chưa có nội dung.'); return; }
    setSending(true); setSentMsg('');
    try {
      const created = await api.mktPost('message-scripts', { taskName: 'Content ' + project, type: 'PHONE', accountIds: [acc], phoneNumbers: phones, messageContent: out.trim() });
      const id = created?.data?._id || created?._id;
      if (id) await api.mktPatch('message-scripts/' + id + '/start?reset=true');
      setSentMsg(`✓ Đã gửi nội dung tới ${phones.length} số qua Zalo.`); setSendOpen(false);
    } catch (e: any) { setSentMsg('⚠ ' + (e?.message || 'Lỗi')); } finally { setSending(false); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-fuchsia-600" /><span className="font-black text-slate-900">Sản xuất nội dung AI (bám tài liệu dự án)</span></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black text-slate-500">Dự án</label>
            <select value={project} onChange={e => setProject(e.target.value)} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm">
              {projects.length === 0 && <option value="">— đang tải —</option>}
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-black text-slate-500">Loại nội dung</label>
            <select value={type} onChange={e => setType(e.target.value as CType)} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm">
              {TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-black text-slate-500">Ghi chú thêm (tuỳ chọn)</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="vd: nhấn mạnh chính sách chiết khấu, giọng trẻ trung..." className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
        </div>
        <button onClick={gen} disabled={loading || !project} className="inline-flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Sinh nội dung
        </button>
        {err && <p className="text-[12px] font-bold text-amber-600">{err}</p>}
      </div>

      {(out || loading) && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-slate-900 text-sm">Nội dung (chỉnh sửa được)</span>
            <div className="flex gap-2">
              <button onClick={gen} disabled={loading} className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:text-slate-700"><RefreshCw className="w-3.5 h-3.5" /> Tạo lại</button>
              <button onClick={copy} disabled={!out} className="inline-flex items-center gap-1 text-xs font-black text-fuchsia-600 hover:underline">{copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Đã copy' : 'Copy'}</button>
            </div>
          </div>
          {loading ? <div className="py-8 text-center text-slate-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            : <textarea value={out} onChange={e => setOut(e.target.value)} rows={12} className="w-full p-3 rounded-xl border border-slate-200 text-sm leading-relaxed" />}
          <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
            <p className="text-[11px] text-slate-400">Duyệt nội dung trước khi gửi. {zaloAccounts.length === 0 ? 'Kết nối Zalo ở khu "Kênh" để gửi.' : ''}</p>
            <button onClick={() => { setSentMsg(''); setSendForm({ accountId: '', phones: '' }); setSendOpen(true); }} disabled={!out || zaloAccounts.length === 0} className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white rounded-xl font-black text-sm hover:bg-sky-600 disabled:opacity-50"><Send className="w-4 h-4" /> Gửi qua Zalo</button>
          </div>
          {sentMsg && <p className={`text-[12px] font-bold mt-2 ${sentMsg.startsWith('✓') ? 'text-emerald-600' : 'text-amber-600'}`}>{sentMsg}</p>}
        </div>
      )}

      {/* Lịch sử nội dung đã tạo — bền theo điều hướng */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-900">Nội dung đã tạo</span>
            {history.length > 0 && <span className="text-xs font-bold text-slate-400">({history.length})</span>}
          </div>
          <button onClick={loadHistory} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"><RefreshCw className="w-3.5 h-3.5" /> Làm mới</button>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <HistoryIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">Chưa có nội dung nào được lưu.</p>
            <p className="text-xs">Nội dung bạn sinh ra sẽ được lưu tại đây, không mất khi chuyển trang.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {history.map(h => (
              <div key={h.id} className="rounded-xl border border-slate-100 hover:border-slate-200 transition p-3">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-black bg-indigo-50 text-indigo-700"><FileText className="w-3.5 h-3.5" />{TYPES.find(t => t.id === h.kind)?.label?.split(' (')[0] || 'Nội dung'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-800 truncate">{h.title || '(không tiêu đề)'}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{timeAgo(h.ts)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setOut(h.text || ''); if (h.meta?.project) setProject(h.meta.project); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Dùng lại" className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"><RotateCcw className="w-4 h-4" /></button>
                    <button onClick={() => copyHist(String(h.id), h.text)} title="Copy" className="p-1.5 rounded-lg text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50">{histCopied === String(h.id) ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}</button>
                    <button onClick={() => deleteHistory(String(h.id))} title="Xoá" className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {h.text && <div className="mt-2 bg-slate-50 rounded-lg p-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">{h.text}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {sendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSendOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-slate-900">Gửi nội dung qua Zalo</h3>
            <div>
              <label className="text-xs font-black text-slate-500">Tài khoản gửi</label>
              <select value={sendForm.accountId || zaloAccounts[0]?._id || ''} onChange={e => setSendForm(f => ({ ...f, accountId: e.target.value }))} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm">
                {zaloAccounts.map((a: any) => <option key={a._id} value={a._id}>{a.name || a.phone || a._id}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-black text-slate-500">Danh sách SĐT (mỗi số 1 dòng)</label>
              <textarea value={sendForm.phones} onChange={e => setSendForm(f => ({ ...f, phones: e.target.value }))} rows={4} placeholder={'0905123456\n0906234567'} className="w-full mt-1 p-2.5 rounded-xl border border-slate-200 text-sm font-mono" />
            </div>
            <div className="bg-slate-50 rounded-xl p-3 max-h-28 overflow-y-auto text-[12px] text-slate-600 whitespace-pre-wrap">{out}</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSendOpen(false)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-black text-sm">Hủy</button>
              <button onClick={sendZalo} disabled={sending} className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 text-white rounded-xl font-black text-sm hover:bg-sky-600 disabled:opacity-60">{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Gửi ngay</button>
            </div>
            <p className="text-[11px] text-amber-600 font-bold">⚠ Gửi chậm rãi, tránh spam để Zalo không khoá tài khoản.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentFactory;
