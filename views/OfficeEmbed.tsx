import React, { useEffect, useState } from 'react';
import { Loader2, ExternalLink, Maximize2, ShieldAlert } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { fbAuth } from '../services/firebase';
import { api } from '../services/apiService';

const OFFICE_URL = 'https://office.fbgproperty.vn/office';

const OfficeEmbed: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  // Phải mở phiên hợp lệ trước khi nhúng, nếu không cổng vào sẽ trả về trang chặn.
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState<string | null>(null);

  const openFull = () => window.open(OFFICE_URL, '_blank');

  useEffect(() => {
    let alive = true;
    const stop = onAuthStateChanged(fbAuth, async (user) => {
      if (!alive) return;
      if (!user) {
        setDenied('Chưa đăng nhập bằng tài khoản công việc.');
        return;
      }
      try {
        const idToken = await user.getIdToken();
        await api.openOfficeSession(idToken);
        if (alive) { setDenied(null); setReady(true); }
      } catch (e: any) {
        if (alive) setDenied(e?.message || 'Tài khoản không có quyền vào văn phòng.');
      }
    });
    return () => { alive = false; stop(); };
  }, []);

  return (
    <div className="relative bg-slate-900 rounded-[28px] overflow-hidden border border-slate-200 shadow-sm h-full" style={{ minHeight: 520 }}>
      {denied && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-3 px-6 text-center z-20">
          <ShieldAlert className="w-9 h-9 text-amber-400" />
          <span className="text-sm font-bold">Không vào được văn phòng</span>
          <span className="text-xs text-white/60 max-w-sm">{denied}</span>
        </div>
      )}

      {!denied && !ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 z-10">
          <Loader2 className="w-9 h-9 animate-spin mb-3" />
          <span className="text-sm font-bold">Đang mở phiên làm việc...</span>
        </div>
      )}

      {!denied && ready && !loaded && !err && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 z-10">
          <Loader2 className="w-9 h-9 animate-spin mb-3" />
          <span className="text-sm font-bold">Đang tải Văn phòng 3D...</span>
        </div>
      )}

      {!denied && ready && (
        err ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 gap-3">
            <span className="text-sm font-bold">Không nhúng được — mở ở tab riêng:</span>
            <button onClick={openFull} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm"><ExternalLink className="w-4 h-4" /> Mở Office FBG</button>
          </div>
        ) : (
          <iframe
            src={OFFICE_URL}
            title="Office FBG — Văn phòng 3D"
            className="w-full h-full border-0"
            allow="fullscreen; xr-spatial-tracking; microphone; clipboard-write"
            onLoad={() => setLoaded(true)}
            onError={() => setErr(true)}
          />
        )
      )}

      {!denied && ready && (
        <button onClick={openFull} title="Mở toàn màn hình (tab mới)" className="absolute top-3 right-3 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg text-xs font-black backdrop-blur">
          <Maximize2 className="w-3.5 h-3.5" /> Toàn màn hình
        </button>
      )}
    </div>
  );
};

export default OfficeEmbed;
