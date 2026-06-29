import React, { useEffect, useState } from 'react';
import { Loader2, Users2, RefreshCw, RotateCw, ChevronRight, User } from 'lucide-react';
import { api } from '../services/apiService';

const arr = (x: any): any[] => (Array.isArray(x) ? x : x?.data?.items || x?.items || x?.data || []);
const gid = (g: any) => g.groupId || g.id || g._id || g.uid;
const gname = (g: any) => g.name || g.groupName || g.title || gid(g);
const mname = (m: any) => m.name || m.displayName || m.zaloName || m.uid || m.userId || m.id;

const ZaloGroups: React.FC<{ accounts: any[] }> = ({ accounts }) => {
  const [accId, setAccId] = useState(accounts[0]?._id || '');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [openG, setOpenG] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingM, setLoadingM] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    if (!accId) return;
    setLoading(true);
    try { setGroups(arr(await api.mktGet(`accounts/${accId}/groups`))); } catch { /* */ } finally { setLoading(false); }
  };
  useEffect(() => { load(); setOpenG(null); /* eslint-disable-next-line */ }, [accId]);

  const sync = async () => {
    setSyncing(true); setMsg('');
    try { await api.mktPost(`accounts/${accId}/groups/sync`, {}); setMsg('✓ Đã đồng bộ nhóm.'); load(); }
    catch (e: any) { setMsg('⚠ ' + (e?.message || 'Lỗi đồng bộ')); } finally { setSyncing(false); }
  };
  const viewMembers = async (g: any) => {
    const id = gid(g);
    if (openG === id) { setOpenG(null); return; }
    setOpenG(id); setLoadingM(true); setMembers([]);
    try { setMembers(arr(await api.mktGet(`accounts/${accId}/groups/${id}/members`))); }
    catch (e: any) { setMsg('⚠ ' + (e?.message || 'Lỗi tải thành viên')); } finally { setLoadingM(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Users2 className="w-5 h-5 text-sky-500" /><span className="font-black text-slate-900 text-sm">Nhóm Zalo ({groups.length})</span></div>
        <div className="flex items-center gap-2">
          <select value={accId} onChange={e => setAccId(e.target.value)} className="p-1.5 rounded-lg border border-slate-200 text-xs font-bold">
            {accounts.map((a: any) => <option key={a._id} value={a._id}>{a.name || a.phone || a._id}</option>)}
          </select>
          <button onClick={sync} disabled={syncing} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-sky-500 text-white rounded-lg font-black text-xs hover:bg-sky-600 disabled:opacity-60">{syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCw className="w-3.5 h-3.5" />} Đồng bộ</button>
          <button onClick={load} className="text-slate-400 hover:text-slate-600"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>
      {msg && <p className="text-[12px] font-bold text-amber-600">{msg}</p>}
      {loading ? <div className="text-slate-400 text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</div>
        : groups.length === 0 ? <p className="text-[12px] text-slate-400">Chưa có nhóm. Bấm "Đồng bộ" để lấy nhóm từ Zalo.</p>
        : <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
            {groups.map((g: any, i: number) => (
              <div key={gid(g) || i}>
                <button onClick={() => viewMembers(g)} className="w-full flex items-center gap-3 py-2.5 text-sm hover:bg-slate-50 px-1 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 shrink-0"><Users2 className="w-4 h-4" /></div>
                  <span className="font-bold text-slate-700 flex-1 truncate text-left">{gname(g)}</span>
                  <span className="text-[11px] text-slate-400 font-bold">{g.memberCount ?? g.totalMember ?? ''}</span>
                  <ChevronRight className={`w-4 h-4 text-slate-300 transition ${openG === gid(g) ? 'rotate-90' : ''}`} />
                </button>
                {openG === gid(g) && (
                  <div className="pb-3 pl-11 pr-1">
                    {loadingM ? <div className="text-slate-400 text-xs flex items-center gap-2 py-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải thành viên...</div>
                      : <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                          {members.slice(0, 300).map((m: any, k: number) => <span key={k} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-600 max-w-[160px] truncate"><User className="w-3 h-3 text-sky-500" />{mname(m)}</span>)}
                          {members.length === 0 && <span className="text-[12px] text-slate-400">Không lấy được thành viên.</span>}
                        </div>}
                    {members.length > 0 && <p className="text-[11px] text-slate-400 mt-1.5">{members.length} thành viên — có thể dùng để gửi tin / mời nhóm.</p>}
                  </div>
                )}
              </div>
            ))}
          </div>}
    </div>
  );
};

export default ZaloGroups;
