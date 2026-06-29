import React, { useEffect, useState } from 'react';
import { FileText, Loader2, Sparkles, Copy, Check, Send, RefreshCw } from 'lucide-react';
import { api } from '../services/apiService';

type CType = 'facebook_post' | 'zalo_broadcast' | 'caption' | 'video_script' | 'ad_copy';
const TYPES: { id: CType; label: string }[] = [
  { id: 'facebook_post', label: 'Bài đăng Facebook' },
  { id: 'zalo_broadcast', label: 'Tin Zalo chăm khách' },
  { id: 'caption', label: 'Caption + hashtag' },
  { id: 'video_script', label: 'Kịch bản video 30s' },
  { id: 'ad_copy', label: 'Nội dung quảng cáo' },
];
const prompt = (t: CType, p: string, note: string) => {
  const base: Record<CType, string> = {
    facebook_post: `Soạn 1 BÀI ĐĂNG FACEBOOK marketing thật hấp dẫn quảng bá dự án "${p}". Gồm: tiêu đề giật tít, 3-4 điểm nổi bật (vị trí/giá/tiện ích/pháp lý), 1 lời kêu gọi hành động, 5 hashtag. Khoảng 150 từ, văn phong bán hàng BĐS.`,
    zalo_broadcast: `Soạn 1 TIN NHẮN ZALO ngắn gọn (~60 từ) chăm khách đang quan tâm dự án "${p}". Thân thiện, có đúng 1 lời kêu gọi (hẹn xem nhà / nhận bảng giá).`,
    caption: `Viết 1 CAPTION ngắn (~30 từ) cho ảnh dự án "${p}" + 5 hashtag.`,
    video_script: `Viết KỊCH BẢN VIDEO NGẮN 30 giây giới thiệu dự án "${p}": mô tả cảnh quay + lời thoại theo từng cảnh, hấp dẫn.`,
    ad_copy: `Viết NỘI DUNG QUẢNG CÁO cho dự án "${p}": 1 headline ngắn, 1 đoạn mô tả, 1 CTA — tối ưu chuyển đổi.`,
  };
  return base[t] + (note ? ` Yêu cầu thêm: ${note}.` : '') +
    ' Chỉ dùng thông tin THẬT của dự án, không bịa số liệu.' +
    ' QUAN TRỌNG: CHỈ xuất đúng nội dung được yêu cầu — KHÔNG lời chào, KHÔNG xưng "tôi là chuyên viên tư vấn", KHÔNG mở đầu kiểu "Chào quý khách", KHÔNG giải thích thêm.';
};

const ContentFactory: React.FC = () => {
  const [projects, setProjects] = useState<string[]>([]);
  const [project, setProject] = useState('');
  const [type, setType] = useState<CType>('facebook_post');
  const [note, setNote] = useState('');
  const [out, setOut] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.ragProjects().then(ps => { setProjects(ps); setProject(ps[0] || ''); }).catch(() => setErr('Không tải được danh sách dự án.'));
  }, []);

  const gen = async () => {
    if (!project) { setErr('Chọn dự án.'); return; }
    setLoading(true); setErr(''); setOut('');
    try {
      const r = await api.ragAsk(prompt(type, project, note), project);
      setOut((r?.answer || r?.text || r?.data || '').toString());
    } catch (e: any) { setErr(e?.message || 'Lỗi sinh nội dung'); } finally { setLoading(false); }
  };
  const copy = () => { navigator.clipboard.writeText(out); setCopied(true); setTimeout(() => setCopied(false), 1500); };

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
          <div className="flex items-center justify-between mt-3">
            <p className="text-[11px] text-slate-400">Duyệt nội dung trước khi đăng. Đăng đa kênh (FB/Zalo theo lịch) — sắp nối ở GĐ tiếp.</p>
            <button disabled className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 rounded-xl font-black text-sm cursor-not-allowed" title="Sắp ra mắt"><Send className="w-4 h-4" /> Đăng đa kênh (sắp có)</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentFactory;
