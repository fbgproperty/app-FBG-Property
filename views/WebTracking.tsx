import React, { useEffect, useState } from 'react';
import { Radar, Copy, Check, Eye, Flame, UserCheck, Users, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../services/apiService';

// Mã theo dõi dán vào website dự án — mọi lượt xem / bấm quan tâm / để lại liên hệ
// sẽ tự chảy vào dây chuyền và đẩy "khách nét" lên đầu khi triển khai dự án.
const SNIPPET = `<script>
(function(){
  var API="https://appapi.fbgproperty.vn/track/event";
  function send(type,data){try{
    var cid=localStorage.fbgcid||(localStorage.fbgcid=Date.now().toString(36)+Math.random().toString(36).slice(2));
    var b=JSON.stringify(Object.assign({type:type,page:location.pathname,cid:cid},data||{}));
    navigator.sendBeacon(API,new Blob([b],{type:"text/plain"}));
  }catch(e){}}
  var pe=document.querySelector("[data-fbg-project]");
  var proj=pe?pe.getAttribute("data-fbg-project"):document.title;
  send("view",{project:proj});
  document.addEventListener("click",function(e){
    var el=e.target.closest("[data-fbg]");
    if(el)send(el.getAttribute("data-fbg"),{project:el.getAttribute("data-fbg-project")||proj});
  });
  window.fbgLead=function(d){send("lead",d);};
})();
</script>`;

const WebTracking: React.FC = () => {
  const [d, setD] = useState<any>({ visitors: 0, views: 0, interested: 0, identified: 0, recent: [] });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setD(await api.trackSummary()); } catch { /* */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const copy = () => { navigator.clipboard?.writeText(SNIPPET); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const KPIS = [
    { label: 'Khách vào web', val: Number(d.visitors) || 0, icon: Users, c: 'bg-sky-600' },
    { label: 'Lượt xem', val: Number(d.views) || 0, icon: Eye, c: 'bg-indigo-600' },
    { label: 'Quan tâm', val: Number(d.interested) || 0, icon: Flame, c: 'bg-rose-600' },
    { label: 'Có liên hệ', val: Number(d.identified) || 0, icon: UserCheck, c: 'bg-emerald-600' },
  ];
  const recent = Array.isArray(d.recent) ? d.recent : [];
  const label = (t: string) => t === 'interest' ? 'Quan tâm' : t === 'lead' ? 'Để lại liên hệ' : t === 'form' ? 'Gửi form' : 'Xem trang';

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-sky-700 to-indigo-700 rounded-3xl p-6 text-white">
        <div className="flex items-center gap-2 mb-1"><Radar className="w-5 h-5" /><span className="font-black">Nguồn khách nét — Website</span></div>
        <p className="text-sm opacity-90">Gắn mã theo dõi vào web dự án: ai xem trang · bấm quan tâm · để lại số điện thoại sẽ tự thành <b>tín hiệu quan tâm thật</b>, đẩy khách lên đầu khi triển khai dự án và giao ngay cho sale.</p>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-black text-slate-900">Phễu khách từ website</h3>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 text-[12px] font-black text-slate-500 hover:text-indigo-600">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Làm mới
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPIS.map(x => (
          <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className={`w-9 h-9 rounded-xl ${x.c} flex items-center justify-center text-white mb-2`}><x.icon className="w-4 h-4" /></div>
            <p className="text-2xl font-black text-slate-900">{x.val}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{x.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <span className="font-black text-slate-900">Mã theo dõi — dán vào website</span>
          <button onClick={copy} className="inline-flex items-center gap-1.5 text-[12px] font-black bg-indigo-600 text-white rounded-lg px-3 py-1.5 hover:bg-indigo-700">
            {copied ? <><Check className="w-3.5 h-3.5" /> Đã chép</> : <><Copy className="w-3.5 h-3.5" /> Chép mã</>}
          </button>
        </div>
        <pre className="text-[11px] leading-relaxed bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto whitespace-pre">{SNIPPET}</pre>
        <div className="mt-3 text-[12px] text-slate-500 space-y-1">
          <p>1. Dán đoạn mã trên vào cuối trang web dự án (trước thẻ đóng <code className="bg-slate-100 px-1 rounded">&lt;/body&gt;</code>).</p>
          <p>2. Nút "Quan tâm / Đăng ký nhận thông tin": thêm thuộc tính <code className="bg-slate-100 px-1 rounded">data-fbg="interest" data-fbg-project="Tên dự án"</code>.</p>
          <p>3. Khi khách gửi form để lại số: gọi <code className="bg-slate-100 px-1 rounded">window.fbgLead(&#123;project, phone, name&#125;)</code>.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="font-black text-slate-900 mb-3">Hoạt động gần đây</div>
        {recent.length === 0 ? <p className="text-sm text-slate-400">Chưa có tín hiệu. Sau khi gắn mã, khách vào web sẽ hiện ở đây.</p> : (
          <div className="space-y-2">
            {recent.slice(0, 15).map((e: any, i: number) => (
              <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${e.type === 'interest' || e.type === 'lead' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>{label(e.type)}</span>
                <span className="text-[13px] text-slate-700 font-medium truncate flex-1">{e.name || e.phone || 'Khách ẩn danh'} · {e.project || e.page || ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebTracking;
