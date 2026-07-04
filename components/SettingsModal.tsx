import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  RefreshCw,
  Bell,
  Info,
  Loader2,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { api } from '../services/apiService';
import { ROLE_LABELS } from '../services/permissions';

export type SettingsTab = 'tai-khoan' | 'dong-bo' | 'thong-bao' | 've-he-thong';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}

interface FbUser {
  email?: string;
  name?: string;
  photo?: string;
}

const readUser = (): FbUser => {
  try {
    return JSON.parse(localStorage.getItem('fbg_user') || '{}');
  } catch {
    return {};
  }
};

const readRole = (): string =>
  (typeof localStorage !== 'undefined' && localStorage.getItem('fbg_role')) || 'ctv';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'tai-khoan', label: 'Tài khoản', icon: User },
  { id: 'dong-bo', label: 'Cấu hình đồng bộ', icon: RefreshCw },
  { id: 'thong-bao', label: 'Thông báo', icon: Bell },
  { id: 've-he-thong', label: 'Về hệ thống', icon: Info },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose, initialTab = 'tai-khoan' }) => {
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  // ===== Cấu hình đồng bộ =====
  const [syncItems, setSyncItems] = useState<{ key: string; name: string; connected: boolean; detail: string }[]>([]);
  const [syncConnected, setSyncConnected] = useState(0);
  const [syncTotal, setSyncTotal] = useState(0);
  const [syncLoading, setSyncLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [syncedMsg, setSyncedMsg] = useState('');

  // ===== Thông báo =====
  const [settings, setSettings] = useState<{ notifyLead: boolean; notifyReport: boolean; autoSync: boolean; lang: string } | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saving, setSaving] = useState<string>('');

  const user = readUser();
  const role = readRole();
  const roleLabel = ROLE_LABELS[role] || 'Sale cộng tác viên';

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  const loadSync = async () => {
    setSyncLoading(true);
    setSyncedMsg('');
    const res = await api.syncStatus();
    setSyncItems(res.items || []);
    setSyncConnected(res.connected || 0);
    setSyncTotal(res.total || 0);
    setSyncLoading(false);
  };

  const loadSettings = async () => {
    setSettingsLoading(true);
    const res = await api.meSettings();
    setSettings(res);
    setSettingsLoading(false);
  };

  useEffect(() => {
    if (!open) return;
    if (tab === 'dong-bo') loadSync();
    if (tab === 'thong-bao' && !settings) loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  const runSync = async () => {
    setRunning(true);
    setSyncedMsg('');
    const res = await api.syncRun();
    setRunning(false);
    if (res.ok) {
      setSyncedMsg(
        res.synced && res.synced.length
          ? `Đã đồng bộ: ${res.synced.join(', ')}`
          : 'Đã đồng bộ xong.'
      );
      await loadSync();
    } else {
      setSyncedMsg('Đồng bộ chưa thành công, vui lòng thử lại.');
    }
  };

  const toggleSetting = async (key: 'notifyLead' | 'notifyReport' | 'autoSync') => {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSettings(next);
    setSaving(key);
    const res = await api.meSettingsSave({ [key]: next[key] });
    if (res.ok && res.settings) setSettings(res.settings);
    setSaving('');
  };

  if (!open) return null;

  const avatar = (
    <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden shadow">
      {user.photo ? (
        <img src={user.photo} alt="" className="w-full h-full object-cover" />
      ) : (
        (user.name || user.email || 'U').slice(0, 2).toUpperCase()
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl rounded-[24px] shadow-2xl overflow-hidden border border-white flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg">
              <User className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <h3 className="text-[15px] font-black text-slate-900 tracking-tight">Cài đặt</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Tài khoản &amp; đồng bộ dữ liệu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-red-50 active:scale-95 transition"
            aria-label="Đóng"
          >
            <X className="w-6 h-6 text-slate-300 hover:text-red-500 transition-colors" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Tabs bên trái */}
          <div className="w-48 shrink-0 border-r border-slate-100 bg-slate-50/40 p-3 space-y-1 overflow-y-auto">
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                  }`}
                >
                  <t.icon className="w-4 h-4 shrink-0" />
                  <span className="text-left leading-tight">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Nội dung */}
          <div className="flex-1 min-w-0 overflow-y-auto p-6">
            {/* ===== Tài khoản ===== */}
            {tab === 'tai-khoan' && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  {avatar}
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate">
                      {user.name || user.email || 'Người dùng'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user.email || '—'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Họ tên</span>
                    <span className="text-sm font-semibold text-slate-800">{user.name || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email</span>
                    <span className="text-sm font-semibold text-slate-800">{user.email || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Vai trò</span>
                    <span className="text-sm font-semibold text-indigo-700">{roleLabel}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ===== Cấu hình đồng bộ ===== */}
            {tab === 'dong-bo' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Cấu hình đồng bộ</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {syncLoading ? 'Đang tải trạng thái…' : `Đã kết nối ${syncConnected}/${syncTotal} nguồn`}
                    </p>
                  </div>
                  <button
                    onClick={runSync}
                    disabled={running || syncLoading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow hover:bg-indigo-700 active:scale-95 transition disabled:opacity-60"
                  >
                    {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {running ? 'Đang đồng bộ…' : 'Đồng bộ ngay'}
                  </button>
                </div>

                {syncedMsg && (
                  <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium">
                    {syncedMsg}
                  </div>
                )}

                <div className="space-y-2">
                  {syncLoading && syncItems.length === 0 && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang tải…
                    </div>
                  )}
                  {!syncLoading && syncItems.length === 0 && (
                    <p className="text-sm text-slate-400 py-6 text-center">Chưa có nguồn dữ liệu nào.</p>
                  )}
                  {syncItems.map((it) => (
                    <div
                      key={it.key}
                      className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/60 transition"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{it.name}</p>
                        {it.detail && <p className="text-xs text-slate-400 mt-0.5 truncate">{it.detail}</p>}
                        {!it.connected && (it.key === 'zalo' || it.key === 'facebook') && (
                          <p className="text-[11px] text-amber-600 mt-1 font-medium">
                            Kết nối tại mục Kinh doanh → Kênh khách.
                          </p>
                        )}
                      </div>
                      {it.connected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã kết nối
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold shrink-0">
                          <Circle className="w-3.5 h-3.5" /> Chưa kết nối
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== Thông báo ===== */}
            {tab === 'thong-bao' && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900">Thông báo</h4>
                {settingsLoading && !settings && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải…
                  </div>
                )}
                {settings && (
                  <div className="space-y-2">
                    {([
                      { key: 'notifyLead', label: 'Báo khi có khách mới' },
                      { key: 'notifyReport', label: 'Báo cáo định kỳ' },
                      { key: 'autoSync', label: 'Tự động đồng bộ' },
                    ] as const).map((row) => {
                      const on = settings[row.key];
                      return (
                        <div
                          key={row.key}
                          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-slate-100 bg-white"
                        >
                          <span className="text-sm font-semibold text-slate-800">{row.label}</span>
                          <button
                            onClick={() => toggleSetting(row.key)}
                            disabled={saving === row.key}
                            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                              on ? 'bg-indigo-600' : 'bg-slate-300'
                            } ${saving === row.key ? 'opacity-60' : ''}`}
                            aria-pressed={on}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                on ? 'translate-x-5' : ''
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ===== Về hệ thống ===== */}
            {tab === 've-he-thong' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900">FBG Property</p>
                    <p className="text-xs font-bold text-indigo-600 tracking-widest">Phiên bản v11.0</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Nền tảng vận hành bất động sản tự trị bằng AI.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
