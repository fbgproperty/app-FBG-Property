import React, { useEffect, useState } from 'react';
import { Megaphone, CheckCircle2, Circle, ExternalLink, Loader2, ChevronRight, Sparkles, Target, Copy, Check } from 'lucide-react';
import { api } from '../services/apiService';

const AdsAIPanel: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [project, setProject] = useState('');
  const [platform, setPlatform] = useState('Facebook Ads');
  const [budget, setBudget] = useState('300.000đ/ngày');
  const [objective, setObjective] = useState('Tin nhắn / Lead');
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getProjectsCbx().then((r: any) => {
      const items = r?.items || r?.data?.items || r?.data || [];
      setProjects(Array.isArray(items) ? items : []);
    }).catch(() => { /* */ });
  }, []);

  const gen = async () => {
    if (!project) { setErr('Chọn dự án.'); return; }
    setErr(''); setLoading(true); setText('');
    try {
      const r = await api.adsPlan({ project, platform, budget, objective });
      setText(r?.text || '');
    } catch (e: any) { setErr(e?.message || 'Lỗi'); }
    setLoading(false);
  };
  const copy = () => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-2"><Target className="w-5 h-5 text-fuchsia-600" /><span className="font-black text-gray-900">AI tạo chiến dịch & creative quảng cáo</span><span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md">Chạy ngay</span></div>
      <p className="text-xs text-gray-400 -mt-2">AI bám tài liệu dự án sinh: đối tượng nhắm chọn · tiêu đề · mô tả · CTA · phân bổ ngân sách. Copy thẳng vào trình quản lý quảng cáo (chưa cần Developer Token).</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select value={project} onChange={e => setProject(e.target.value)} className="p-2.5 rounded-xl border border-gray-200 text-sm">
          <option value="">— chọn dự án —</option>
          {projects.map((p: any) => <option key={p.id || p.slug || p.name} value={p.name}>{p.name}</option>)}
        </select>
        <select value={platform} onChange={e => setPlatform(e.target.value)} className="p-2.5 rounded-xl border border-gray-200 text-sm">
          {['Facebook Ads', 'Google Ads', 'TikTok Ads', 'Zalo Ads'].map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <input value={budget} onChange={e => setBudget(e.target.value)} placeholder="Ngân sách/ngày" className="p-2.5 rounded-xl border border-gray-200 text-sm" />
        <select value={objective} onChange={e => setObjective(e.target.value)} className="p-2.5 rounded-xl border border-gray-200 text-sm">
          {['Tin nhắn / Lead', 'Tương tác', 'Truy cập web', 'Nhận diện thương hiệu'].map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </div>
      {err && <div className="text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold">{err}</div>}
      <button onClick={gen} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 bg-fuchsia-600 text-white rounded-xl font-black text-sm hover:bg-fuchsia-700 disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tạo chiến dịch AI
      </button>
      {text && (
        <div className="relative">
          <button onClick={copy} className="absolute top-2 right-2 inline-flex items-center gap-1 text-[11px] font-black bg-white border border-slate-200 rounded-lg px-2 py-1 hover:bg-slate-50">{copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Đã chép</> : <><Copy className="w-3.5 h-3.5" />Chép</>}</button>
          <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 rounded-2xl p-4 pr-16">{text}</div>
        </div>
      )}
    </div>
  );
};

type Channel = {
  id: string; name: string; color: string; bg: string; icon: string; status: 'connect' | 'soon';
};

const CHANNELS: Channel[] = [
  { id: 'google', name: 'Google Ads', color: 'text-[#4285F4]', bg: 'bg-blue-50', icon: 'G', status: 'connect' },
  { id: 'facebook', name: 'Facebook Ads', color: 'text-[#1877F2]', bg: 'bg-blue-50', icon: 'f', status: 'soon' },
  { id: 'tiktok', name: 'TikTok Ads', color: 'text-gray-900', bg: 'bg-gray-100', icon: '♪', status: 'soon' },
  { id: 'zalo', name: 'Zalo Ads', color: 'text-[#0068FF]', bg: 'bg-sky-50', icon: 'Z', status: 'soon' },
];

const GOOGLE_STEPS = [
  { t: 'Tài khoản Google Ads', d: 'Có tài khoản Google Ads dưới info@fbgproperty.vn', done: false },
  { t: 'Developer Token', d: 'Xin trong Google Ads → Google duyệt (vài ngày)', done: false },
  { t: 'Cho phép truy cập', d: 'Đăng nhập Google + bấm "Cho phép" (OAuth)', done: false },
];

const QuangCaoDaKenh: React.FC = () => {
  const [showSteps, setShowSteps] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const handleConnectGoogle = async () => {
    setConnecting(true);
    try {
      // Khi đã cấu hình OAuth client + có Developer Token, nút này sẽ chuyển sang luồng OAuth thật.
      alert('Để kết nối thật Google Ads, cần: (1) tài khoản Google Ads, (2) Developer Token đã được Google duyệt, (3) cấp OAuth client. Xem checklist bên dưới.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg">
          <Megaphone className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 leading-none">Quảng cáo đa kênh</h2>
          <p className="text-[11px] font-bold text-rose-500 uppercase tracking-widest mt-1.5">
            Kết nối Google · Facebook · TikTok · Zalo Ads vào một nơi
          </p>
        </div>
      </header>

      <AdsAIPanel />

      {/* Google Ads — nổi bật */}
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl font-black text-[#4285F4] shadow-sm">G</div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Google Ads</h3>
              <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                <Circle className="w-2.5 h-2.5 fill-current" /> Chưa kết nối
              </span>
            </div>
          </div>
          <button
            onClick={handleConnectGoogle}
            disabled={connecting}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Bắt đầu kết nối
          </button>
        </div>

        <div className="p-6">
          <button onClick={() => setShowSteps((s) => !s)} className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest mb-4">
            <ChevronRight className={`w-4 h-4 transition-transform ${showSteps ? 'rotate-90' : ''}`} /> Các bước cần để kết nối
          </button>
          {showSteps && (
            <div className="space-y-3">
              {GOOGLE_STEPS.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  {s.done ? <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm font-black text-gray-800">{i + 1}. {s.t}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{s.d}</p>
                  </div>
                </div>
              ))}
              <p className="text-[11px] text-gray-400 font-medium pt-1">
                ⓘ Bước 2 (Developer Token) do Google duyệt tay, thường mất vài ngày — không thể tự động bỏ qua.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Các kênh khác */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CHANNELS.filter((c) => c.status === 'soon').map((c) => (
          <div key={c.id} className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6 flex items-center gap-4 opacity-90">
            <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center text-xl font-black ${c.color}`}>{c.icon}</div>
            <div>
              <h4 className="font-black text-gray-900 text-sm">{c.name}</h4>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sắp ra mắt</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuangCaoDaKenh;
