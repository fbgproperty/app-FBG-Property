import React, { useEffect, useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Loader2, RefreshCw, Server, DollarSign, Globe, Sparkles,
  AlertTriangle, AlertOctagon, Info,
} from 'lucide-react';
import { api } from '../services/apiService';

const LEVEL_STYLE: Record<string, { row: string; icon: any; ic: string }> = {
  danger: { row: 'bg-rose-50 border-rose-100', icon: AlertOctagon, ic: 'text-rose-600' },
  warn: { row: 'bg-amber-50 border-amber-100', icon: AlertTriangle, ic: 'text-amber-600' },
  info: { row: 'bg-slate-50 border-slate-100', icon: Info, ic: 'text-slate-500' },
};

const InfraMonitor: React.FC = () => {
  const [d, setD] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setD(await api.infraAlerts()); } catch { /* */ } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const summary = d?.summary || {};
  const alerts = Array.isArray(d?.alerts) ? d.alerts : [];
  const healthy = !!d?.healthy;
  const issues = Number(summary?.issues) || 0;

  const KPIS = [
    { label: 'Máy chủ', val: Number(summary?.vmTotal) || 0, icon: Server, c: 'bg-indigo-600' },
    { label: 'Chi phí/tháng', val: `≈ $${Number(summary?.monthlyUsd) || 0}`, icon: DollarSign, c: 'bg-emerald-600' },
    { label: 'Tên miền', val: Number(summary?.domains) || 0, icon: Globe, c: 'bg-sky-600' },
    { label: 'Dịch vụ', val: Number(summary?.platforms) || 0, icon: Sparkles, c: 'bg-fuchsia-600' },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-700 flex items-center justify-center text-white shadow-lg"><ShieldAlert className="w-6 h-6" /></div>
          <div>
            <h3 className="text-xl font-black text-slate-900 leading-none">Giám sát & cảnh báo</h3>
            <p className="text-sm text-slate-400 font-semibold mt-1">Theo dõi sức khỏe hạ tầng · chi phí · dịch vụ theo thời gian thật</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-sm hover:bg-slate-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Làm mới
        </button>
      </div>

      {loading && !d ? (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-600">
          <Loader2 className="w-9 h-9 animate-spin mb-3" />
          <p className="font-bold text-sm">Đang kiểm tra hệ thống…</p>
        </div>
      ) : (
        <>
          {healthy ? (
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 shrink-0" />
              <div>
                <p className="font-black text-lg leading-none">Hệ thống ổn định</p>
                <p className="text-sm opacity-90 mt-1">Không có cảnh báo cần xử lý — mọi dịch vụ đang chạy tốt.</p>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-amber-500 to-rose-600 rounded-3xl p-6 text-white flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 shrink-0" />
              <div>
                <p className="font-black text-lg leading-none">Có {issues} cảnh báo cần xử lý</p>
                <p className="text-sm opacity-90 mt-1">Vui lòng xem danh sách bên dưới và xử lý sớm để tránh gián đoạn.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {KPIS.map(x => (
              <div key={x.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className={`w-9 h-9 rounded-xl ${x.c} flex items-center justify-center text-white mb-2`}><x.icon className="w-4 h-4" /></div>
                <p className="text-2xl font-black text-slate-900">{x.val}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{x.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="font-black text-slate-900 mb-3">Danh sách cảnh báo</div>
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-400">Không có cảnh báo — mọi thứ đang ổn.</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((a: any, i: number) => {
                  const st = LEVEL_STYLE[a?.level] || LEVEL_STYLE.info;
                  const Icon = st.icon;
                  return (
                    <div key={i} className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${st.row}`}>
                      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${st.ic}`} />
                      <span className="text-[13px] text-slate-700 font-medium leading-snug">{a?.msg || ''}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InfraMonitor;
