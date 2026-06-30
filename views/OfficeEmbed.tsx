import React, { useState } from 'react';
import { Loader2, ExternalLink, Maximize2 } from 'lucide-react';

const OFFICE_URL = 'https://office.fbgproperty.vn/office';

const OfficeEmbed: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [err, setErr] = useState(false);
  const openFull = () => window.open(OFFICE_URL, '_blank');

  return (
    <div className="relative bg-slate-900 rounded-[28px] overflow-hidden border border-slate-200 shadow-sm h-full" style={{ minHeight: 520 }}>
      {!loaded && !err && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 z-10">
          <Loader2 className="w-9 h-9 animate-spin mb-3" />
          <span className="text-sm font-bold">Đang tải Văn phòng 3D · nối Trung tâm giám sát...</span>
        </div>
      )}
      {err ? (
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
      )}
      <button onClick={openFull} title="Mở toàn màn hình (tab mới)" className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/50 hover:bg-black/70 text-white rounded-lg text-xs font-black backdrop-blur">
        <Maximize2 className="w-3.5 h-3.5" /> Toàn màn hình
      </button>
    </div>
  );
};

export default OfficeEmbed;
