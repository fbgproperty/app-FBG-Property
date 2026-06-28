import React, { useEffect, useState } from 'react';
import {
  Megaphone, Facebook, MessageCircle, Loader2, RefreshCw, Users, Search, Send,
  UserPlus, AlertTriangle, CheckCircle2, Database, Phone
} from 'lucide-react';
import { api } from '../services/apiService';

type Tab = 'facebook' | 'zalo';
const arr = (x: any): any[] => (Array.isArray(x) ? x : x?.data?.items || x?.items || x?.data || []);

const Marketing: React.FC = () => {
  const [tab, setTab] = useState<Tab>('facebook');
  const [loading, setLoading] = useState(true);
  const [fbAccounts, setFbAccounts] = useState<any[]>([]);
  const [zaloAccounts, setZaloAccounts] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [err, setErr] = useState('');

  // form cào FB
  const [src, setSrc] = useState<'keyword' | 'groupUrl' | 'postUrl'>('keyword');
  const [val, setVal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    const [fb, za, jb] = await Promise.allSettled([
      api.mktGet('fb/accounts'), api.mktGet('accounts'), api.mktGet('collect/fb/jobs?page=1&limit=20'),
    ]);
    if (fb.status === 'fulfilled') setFbAccounts(arr(fb.value));
    if (za.status === 'fulfilled') setZaloAccounts(arr(za.value));
    if (jb.status === 'fulfilled') setJobs(arr(jb.value));
    if (fb.status === 'rejected' && za.status === 'rejected') setErr('Không kết nối được nền tảng marketing (mkt.fbgproperty.vn).');
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startCollect = async () => {
    if (!val.trim()) { setMsg('Nhập từ khoá / link đã.'); return; }
    setSubmitting(true); setMsg('');
    try {
      const body: any = { type: src };
      body[src] = val.trim();
      await api.mktPost('collect/fb/jobs', body);
      setMsg('✓ Đã tạo việc cào. Theo dõi ở danh sách bên dưới.');
      setVal(''); load();
    } catch (e: any) {
      setMsg('⚠ ' + (e?.message || 'Lỗi') + (/userId|account|cookie|session/i.test(e?.message || '') ? ' — cần kết nối tài khoản Facebook trước.' : ''));
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="h-full flex items-center justify-center text-indigo-600"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  const TabBtn: React.FC<{ id: Tab; label: string; icon: any; color: string }> = ({ id, label, icon: Icon, color }) => (
    <button onClick={() => setTab(id)} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${tab === id ? `${color} text-white shadow-lg` : 'text-slate-500 hover:bg-slate-50'}`}>
      <Icon className="w-4.5 h-4.5" />{label}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-fuchsia-600 flex items-center justify-center text-white shadow-lg"><Megaphone className="w-6 h-6" /></div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 leading-none">Marketing</h2>
            <p className="text-sm text-slate-400 font-semibold mt-1">Cào lead Facebook · chăm khách Zalo tự động</p>
          </div>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-50"><RefreshCw className="w-4 h-4" /> Làm mới</button>
      </header>

      {err && <div className="flex items-center gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm font-bold"><AlertTriangle className="w-4 h-4" /> {err}</div>}

      <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm w-fit">
        <TabBtn id="facebook" label="Facebook" icon={Facebook} color="bg-blue-600" />
        <TabBtn id="zalo" label="Zalo" icon={MessageCircle} color="bg-sky-500" />
      </div>

      {tab === 'facebook' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-blue-600" /><span className="font-black text-slate-900">Tài khoản Facebook</span></div>
              <p className="text-3xl font-black text-slate-900">{fbAccounts.length}</p>
              {fbAccounts.length === 0
                ? <p className="text-[12px] text-amber-600 font-bold mt-1">Chưa kết nối — cần thêm cookie phiên FB để cào.</p>
                : <p className="text-[12px] text-emerald-600 font-bold mt-1">Đã kết nối, sẵn sàng cào.</p>}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-2"><Database className="w-5 h-5 text-fuchsia-600" /><span className="font-black text-slate-900">Việc cào đã chạy</span></div>
              <p className="text-3xl font-black text-slate-900">{jobs.length}</p>
              <p className="text-[12px] text-slate-400 font-bold mt-1">Lead SĐT/Zalo trích từ comment</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="flex items-center gap-2"><Search className="w-5 h-5 text-blue-600" /><span className="font-black text-slate-900">Cào lead Facebook</span></div>
            <div className="flex flex-wrap gap-2">
              {([['keyword', 'Từ khoá'], ['groupUrl', 'Link nhóm'], ['postUrl', 'Link bài viết']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setSrc(k)} className={`px-3 py-1.5 rounded-lg text-xs font-black ${src === k ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{l}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={val} onChange={e => setVal(e.target.value)} placeholder={src === 'keyword' ? 'vd: căn hộ Đà Nẵng' : 'dán link Facebook...'} className="flex-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
              <button onClick={startCollect} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 disabled:opacity-60">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Bắt đầu cào
              </button>
            </div>
            {msg && <p className={`text-[12px] font-bold ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-amber-600'}`}>{msg}</p>}
          </div>

          {jobs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-50 font-black text-slate-900 text-sm">Lịch sử cào</div>
              <div className="divide-y divide-slate-50">
                {jobs.slice(0, 15).map((j: any, i: number) => (
                  <div key={j._id || i} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${j.status === 'completed' ? 'text-emerald-500' : j.status === 'failed' ? 'text-rose-500' : 'text-amber-400'}`} />
                    <span className="font-bold text-slate-700 truncate flex-1">{j.keyword || j.groupUrl || j.postUrl || j.type || 'Việc cào'}</span>
                    <span className="text-[11px] text-slate-400 font-bold">{j.status}</span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-black text-fuchsia-600"><Phone className="w-3 h-3" />{j.extractedPhonesCount ?? j.phonesCount ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'zalo' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-sky-500" /><span className="font-black text-slate-900">Tài khoản Zalo</span></div>
            <p className="text-3xl font-black text-slate-900">{zaloAccounts.length}</p>
            {zaloAccounts.length === 0
              ? <p className="text-[12px] text-amber-600 font-bold mt-1">Chưa kết nối — cần đăng nhập Zalo (QR/cookie) để nhắn tin.</p>
              : <div className="mt-3 space-y-1.5">{zaloAccounts.slice(0, 8).map((a: any, i: number) => (
                  <div key={a._id || i} className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="font-bold text-slate-700">{a.name || a.displayName || a.phone || a.username || 'Tài khoản'}</span></div>
                ))}</div>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-1"><Send className="w-5 h-5 text-sky-500" /><span className="font-black text-slate-900">Gửi tin hàng loạt</span></div>
              <p className="text-[12px] text-slate-400 font-bold">Soạn kịch bản → gửi tới danh sách SĐT (lead từ Facebook). Cần tài khoản Zalo đã kết nối.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-1"><UserPlus className="w-5 h-5 text-sky-500" /><span className="font-black text-slate-900">Kết bạn theo SĐT</span></div>
              <p className="text-[12px] text-slate-400 font-bold">Tự động tìm + gửi kết bạn theo danh sách số. Cần tài khoản Zalo đã kết nối.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 text-[12px] text-slate-500 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span>Công cụ Zalo/Facebook không chính thức — dùng đúng quy định, tránh spam để không bị khoá tài khoản. Tuân thủ Nghị định 13/2023 về dữ liệu cá nhân khi thu thập SĐT.</span>
      </div>
    </div>
  );
};

export default Marketing;
