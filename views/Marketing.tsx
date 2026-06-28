import React, { useEffect, useState } from 'react';
import {
  Megaphone, Facebook, MessageCircle, Loader2, RefreshCw, Users, Search, Send,
  UserPlus, AlertTriangle, CheckCircle2, Database, Phone, Plus, QrCode, Server, Trash2, X
} from 'lucide-react';
import { api } from '../services/apiService';

type Tab = 'facebook' | 'zalo';
const MKT = 'https://mkt.fbgproperty.vn';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const arr = (x: any): any[] => (Array.isArray(x) ? x : x?.data?.items || x?.items || x?.data || []);

const Marketing: React.FC = () => {
  const [tab, setTab] = useState<Tab>('facebook');
  const [loading, setLoading] = useState(true);
  const [fbAccounts, setFbAccounts] = useState<any[]>([]);
  const [zaloAccounts, setZaloAccounts] = useState<any[]>([]);
  const [proxies, setProxies] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [userId, setUserId] = useState('');
  const [err, setErr] = useState('');

  const load = async () => {
    setErr('');
    let uid = userId;
    if (!uid) { try { const p = await api.mktGet('auth/profile'); uid = p?.data?._id || p?._id || ''; setUserId(uid); } catch { /* */ } }
    const [fb, za, px, jb] = await Promise.allSettled([
      api.mktGet('fb/accounts'), api.mktGet('accounts'), api.mktGet('proxies'),
      api.mktGet('collect/fb/jobs?userId=' + uid + '&page=1&limit=20'),
    ]);
    if (fb.status === 'fulfilled') setFbAccounts(arr(fb.value));
    if (za.status === 'fulfilled') setZaloAccounts(arr(za.value));
    if (px.status === 'fulfilled') setProxies(arr(px.value));
    if (jb.status === 'fulfilled') setJobs(arr(jb.value));
    if (fb.status === 'rejected' && za.status === 'rejected') setErr('Không kết nối được nền tảng marketing (mkt.fbgproperty.vn).');
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // ===== Facebook: cào + kết nối =====
  const [src, setSrc] = useState<'keyword' | 'groupUrl' | 'postUrl'>('keyword');
  const [val, setVal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [showFbConnect, setShowFbConnect] = useState(false);
  const [fbForm, setFbForm] = useState({ name: '', storageState: '' });

  const startCollect = async () => {
    if (!val.trim()) { setMsg('Nhập từ khoá / link đã.'); return; }
    setSubmitting(true); setMsg('');
    try {
      const body: any = { type: src, userId }; body[src] = val.trim();
      await api.mktPost('collect/fb/jobs', body);
      setMsg('✓ Đã tạo việc cào.'); setVal(''); load();
    } catch (e: any) {
      const m = e?.message || 'Lỗi';
      setMsg('⚠ ' + m + (/userId|account|cookie|session|storage/i.test(m) ? ' — cần kết nối tài khoản Facebook trước (mục bên dưới).' : ''));
    } finally { setSubmitting(false); }
  };
  const addFbAccount = async () => {
    if (!fbForm.name.trim() || !fbForm.storageState.trim()) { setMsg('Nhập tên + dán storageState.'); return; }
    setSubmitting(true); setMsg('');
    try {
      const ss = JSON.parse(fbForm.storageState);
      await api.mktPost('fb/accounts', { name: fbForm.name.trim(), storageState: ss, userAgent: UA });
      setMsg('✓ Đã thêm tài khoản Facebook.'); setFbForm({ name: '', storageState: '' }); setShowFbConnect(false); load();
    } catch (e: any) {
      setMsg('⚠ ' + (e instanceof SyntaxError ? 'storageState không phải JSON hợp lệ.' : e?.message || 'Lỗi'));
    } finally { setSubmitting(false); }
  };

  // ===== Zalo: proxy + QR =====
  const [pxForm, setPxForm] = useState({ host: '', port: '', username: '', password: '' });
  const [qr, setQr] = useState<{ proxyId: string; t: number } | null>(null);
  const addProxy = async () => {
    if (!pxForm.host.trim() || !pxForm.port.trim()) { setMsg('Nhập host + port proxy.'); return; }
    setSubmitting(true); setMsg('');
    try {
      await api.mktPost('proxies', { ...pxForm, host: pxForm.host.trim(), port: pxForm.port.trim() });
      setMsg('✓ Đã thêm proxy.'); setPxForm({ host: '', port: '', username: '', password: '' }); load();
    } catch (e: any) { setMsg('⚠ ' + (e?.message || 'Lỗi')); } finally { setSubmitting(false); }
  };
  const delProxy = async (id: string) => { try { await api.mktDelete('proxies/' + id); load(); } catch { /* */ } };
  const genQR = async (proxyId: string) => {
    setMsg(''); setQr({ proxyId, t: Date.now() });
    try { await api.mktPost('proxies/' + proxyId + '/zalo-qr'); } catch (e: any) { setMsg('⚠ ' + (e?.message || 'Lỗi tạo QR')); }
  };
  // refresh ảnh QR mỗi 3s tới khi quét xong
  useEffect(() => {
    if (!qr) return;
    const iv = setInterval(() => setQr(q => (q ? { ...q, t: Date.now() } : q)), 3000);
    return () => clearInterval(iv);
  }, [qr?.proxyId]);

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
      {msg && <div className={`text-sm font-bold rounded-xl px-4 py-2.5 ${msg.startsWith('✓') ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-amber-700 bg-amber-50 border border-amber-100'}`}>{msg}</div>}

      <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm w-fit">
        <TabBtn id="facebook" label="Facebook" icon={Facebook} color="bg-blue-600" />
        <TabBtn id="zalo" label="Zalo" icon={MessageCircle} color="bg-sky-500" />
      </div>

      {tab === 'facebook' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /><span className="font-black text-slate-900">Tài khoản Facebook</span></div>
                <button onClick={() => setShowFbConnect(s => !s)} className="inline-flex items-center gap-1 text-xs font-black text-blue-600 hover:underline">{showFbConnect ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} Kết nối</button>
              </div>
              <p className="text-3xl font-black text-slate-900 mt-1">{fbAccounts.length}</p>
              {fbAccounts.length > 0 && <div className="mt-2 space-y-1">{fbAccounts.slice(0, 6).map((a: any, i: number) => <div key={a._id || i} className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="font-bold text-slate-700">{a.name || 'Account'}</span></div>)}</div>}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-2"><Database className="w-5 h-5 text-fuchsia-600" /><span className="font-black text-slate-900">Việc cào đã chạy</span></div>
              <p className="text-3xl font-black text-slate-900">{jobs.length}</p>
              <p className="text-[12px] text-slate-400 font-bold mt-1">Lead SĐT/Zalo trích từ comment</p>
            </div>
          </div>

          {showFbConnect && (
            <div className="bg-blue-50/40 rounded-2xl border border-blue-100 p-5 space-y-3">
              <div className="font-black text-slate-900 text-sm">Kết nối tài khoản Facebook</div>
              <p className="text-[12px] text-slate-500">Đăng nhập Facebook trên trình duyệt → dùng tiện ích xuất cookie (vd "J2TEAM Cookies" / EditThisCookie) lấy <b>storageState</b> (JSON gồm cookies) → dán vào đây.</p>
              <input value={fbForm.name} onChange={e => setFbForm(f => ({ ...f, name: e.target.value }))} placeholder="Tên tài khoản (vd: FB Sale 1)" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm" />
              <textarea value={fbForm.storageState} onChange={e => setFbForm(f => ({ ...f, storageState: e.target.value }))} placeholder='{"cookies":[...],"origins":[...]}' rows={4} className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono" />
              <button onClick={addFbAccount} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 disabled:opacity-60">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm tài khoản</button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="flex items-center gap-2"><Search className="w-5 h-5 text-blue-600" /><span className="font-black text-slate-900">Cào lead Facebook</span></div>
            <div className="flex flex-wrap gap-2">
              {([['keyword', 'Từ khoá'], ['groupUrl', 'Link nhóm'], ['postUrl', 'Link bài viết']] as const).map(([k, l]) => (
                <button key={k} onClick={() => setSrc(k)} className={`px-3 py-1.5 rounded-lg text-xs font-black ${src === k ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{l}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={val} onChange={e => setVal(e.target.value)} placeholder={src === 'keyword' ? 'vd: căn hộ Đà Nẵng' : 'dán link Facebook...'} className="flex-1 p-2.5 rounded-xl border border-slate-200 text-sm" />
              <button onClick={startCollect} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 disabled:opacity-60">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Cào</button>
            </div>
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
            <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-sky-500" /><span className="font-black text-slate-900">Tài khoản Zalo đã kết nối</span></div>
            <p className="text-3xl font-black text-slate-900">{zaloAccounts.length}</p>
            {zaloAccounts.length > 0 && <div className="mt-2 space-y-1.5">{zaloAccounts.slice(0, 8).map((a: any, i: number) => (
              <div key={a._id || i} className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-500" /><span className="font-bold text-slate-700">{a.name || a.displayName || a.phone || 'Tài khoản'}</span></div>
            ))}</div>}
          </div>

          {/* Proxy + QR */}
          <div className="bg-sky-50/40 rounded-2xl border border-sky-100 p-5 space-y-4">
            <div className="font-black text-slate-900 text-sm flex items-center gap-2"><Server className="w-4 h-4 text-sky-600" /> Kết nối Zalo (cần proxy + quét QR)</div>
            <p className="text-[12px] text-slate-500">Mỗi tài khoản Zalo chạy qua 1 proxy riêng (nên dùng proxy Việt Nam). Thêm proxy → tạo QR → mở app Zalo quét.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <input value={pxForm.host} onChange={e => setPxForm(f => ({ ...f, host: e.target.value }))} placeholder="host/IP" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
              <input value={pxForm.port} onChange={e => setPxForm(f => ({ ...f, port: e.target.value }))} placeholder="port" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
              <input value={pxForm.username} onChange={e => setPxForm(f => ({ ...f, username: e.target.value }))} placeholder="user (nếu có)" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
              <input value={pxForm.password} onChange={e => setPxForm(f => ({ ...f, password: e.target.value }))} placeholder="pass (nếu có)" className="p-2.5 rounded-xl border border-slate-200 text-sm" />
            </div>
            <button onClick={addProxy} disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 text-white rounded-xl font-black text-sm hover:bg-sky-600 disabled:opacity-60">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Thêm proxy</button>

            {proxies.length > 0 && (
              <div className="space-y-2 pt-2">
                {proxies.map((p: any) => (
                  <div key={p._id} className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 px-3 py-2.5 text-sm">
                    <Server className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-700 flex-1 truncate">{p.host}:{p.port}</span>
                    <button onClick={() => genQR(p._id)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-500 text-white rounded-lg font-black text-xs hover:bg-sky-600"><QrCode className="w-3.5 h-3.5" /> Tạo QR</button>
                    <button onClick={() => delProxy(p._id)} className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}

            {qr && (
              <div className="flex flex-col items-center gap-2 bg-white rounded-2xl border border-sky-100 p-5">
                <p className="font-black text-slate-900 text-sm">Mở app Zalo → Cá nhân → Quét mã QR</p>
                <img src={`${MKT}/uploads/QR/${qr.proxyId}.png?t=${qr.t}`} alt="QR Zalo" className="w-52 h-52 object-contain border border-slate-100 rounded-xl"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }} onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }} />
                <p className="text-[11px] text-slate-400">QR tự làm mới mỗi 3s · quét xong tài khoản hiện ở trên (bấm "Làm mới")</p>
                <button onClick={() => setQr(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Đóng</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-1"><Send className="w-5 h-5 text-sky-500" /><span className="font-black text-slate-900">Gửi tin hàng loạt</span></div>
              <p className="text-[12px] text-slate-400 font-bold">Soạn kịch bản → gửi tới danh sách SĐT (lead từ Facebook). {zaloAccounts.length === 0 ? 'Cần kết nối tài khoản Zalo trước.' : 'Sẵn sàng.'}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-1"><UserPlus className="w-5 h-5 text-sky-500" /><span className="font-black text-slate-900">Kết bạn theo SĐT</span></div>
              <p className="text-[12px] text-slate-400 font-bold">Tự động tìm + gửi kết bạn theo danh sách số. {zaloAccounts.length === 0 ? 'Cần kết nối tài khoản Zalo trước.' : 'Sẵn sàng.'}</p>
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
