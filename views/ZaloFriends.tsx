import React, { useEffect, useState } from 'react';
import { Loader2, Search, UserPlus, Users, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x) ? x : x?.data?.items || x?.items || x?.data || []);
const uidOf = (u: any) => u.uid || u.userId || u.zaloId || u.id || u._id;
const nameOf = (u: any) => u.name || u.displayName || u.zaloName || u.username || u.phone || uidOf(u);

const ZaloFriends: React.FC<{ accounts: any[] }> = ({ accounts }) => {
  const [accId, setAccId] = useState(accounts[0]?._id || '');
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingF, setLoadingF] = useState(false);
  const [phones, setPhones] = useState('');
  const [found, setFound] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('Xin chào, mình là tư vấn viên FBG Property, kết bạn để trao đổi nhé!');
  const [sentUids, setSentUids] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState('');

  const loadFriends = async () => {
    if (!accId) return;
    setLoadingF(true);
    try { setFriends(arr(await api.mktGet(`accounts/${accId}/friends`))); } catch { /* */ } finally { setLoadingF(false); }
  };
  useEffect(() => { loadFriends(); setFound([]); setSentUids({}); /* eslint-disable-next-line */ }, [accId]);

  const search = async () => {
    const list = Array.from(new Set(phones.split(/[\s,;]+/).map(s => s.replace(/[^0-9]/g, '')).filter(p => p.length >= 8)));
    if (!list.length) { setMsg('⚠ Nhập SĐT.'); return; }
    setSearching(true); setMsg(''); setFound([]);
    try { setFound(arr(await api.mktPost(`accounts/${accId}/find-users-by-phone-numbers`, { phoneNumbers: list }))); }
    catch (e: any) { setMsg('⚠ ' + (e?.message || 'Lỗi tìm')); } finally { setSearching(false); }
  };
  const addFriend = async (u: any) => {
    const targetId = uidOf(u);
    try {
      await api.mktPost(`accounts/${accId}/send-friend-request`, { targetId, message });
      setSentUids(s => ({ ...s, [targetId]: true }));
    } catch (e: any) { setMsg('⚠ ' + (e?.message || 'Lỗi kết bạn')); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Users className="w-5 h-5 text-sky-500" /><span className="font-black text-slate-900 text-sm">Bạn bè & tìm theo SĐT</span></div>
        <select value={accId} onChange={e => setAccId(e.target.value)} className="p-1.5 rounded-lg border border-slate-200 text-xs font-bold">
          {accounts.map((a: any) => <option key={a._id} value={a._id}>{a.name || a.phone || a._id}</option>)}
        </select>
      </div>
      {msg && <p className="text-[12px] font-bold text-amber-600">{msg}</p>}

      {/* Tìm theo SĐT → kết bạn */}
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-500">Tìm người dùng Zalo theo SĐT (mỗi số 1 dòng/cách dấu phẩy)</label>
        <div className="flex gap-2">
          <textarea value={phones} onChange={e => setPhones(e.target.value)} rows={2} placeholder={'0905123456, 0906234567'} className="flex-1 p-2.5 rounded-xl border border-slate-200 text-sm font-mono" />
          <button onClick={search} disabled={searching} className="inline-flex items-center gap-2 px-4 self-start py-2.5 bg-sky-500 text-white rounded-xl font-black text-sm hover:bg-sky-600 disabled:opacity-60">{searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Tìm</button>
        </div>
        <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Lời nhắn kết bạn" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm" />
        {found.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {found.map((u: any, i: number) => {
              const id = uidOf(u);
              return (
                <div key={id || i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2 text-sm">
                  <span className="font-bold text-slate-700 flex-1 truncate">{nameOf(u)}</span>
                  {sentUids[id]
                    ? <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-black"><CheckCircle2 className="w-4 h-4" /> Đã gửi</span>
                    : <button onClick={() => addFriend(u)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-sky-500 text-white rounded-lg font-black text-xs hover:bg-sky-600"><UserPlus className="w-3.5 h-3.5" /> Kết bạn</button>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Danh sách bạn bè */}
      <div className="pt-2 border-t border-slate-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-slate-500">Danh sách bạn bè ({friends.length})</span>
          <button onClick={loadFriends} className="text-slate-400 hover:text-slate-600"><RefreshCw className="w-4 h-4" /></button>
        </div>
        {loadingF ? <div className="text-slate-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
          : <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto">
              {friends.slice(0, 300).map((f: any, i: number) => <span key={uidOf(f) || i} className="bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-[12px] font-bold text-slate-600 truncate max-w-[180px]">{nameOf(f)}</span>)}
              {friends.length === 0 && <span className="text-[12px] text-slate-400">Chưa có / chưa đồng bộ bạn bè.</span>}
            </div>}
      </div>
    </div>
  );
};

export default ZaloFriends;
