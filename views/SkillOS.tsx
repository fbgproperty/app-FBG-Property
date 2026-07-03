import React, { useEffect, useMemo, useState } from 'react';
import {
  Wand2, Loader2, X, Copy, Check, RefreshCw, ThumbsUp, ThumbsDown,
  FileText, CalendarDays, Sparkles, Film, Target, ShieldCheck,
  HeartHandshake, Phone, Workflow, GraduationCap, Play,
} from 'lucide-react';
import { api } from '../services/apiService';

type SkillInput = { k: string; label: string };
type Skill = {
  id: string;
  cat: string;
  name: string;
  icon: string;
  desc: string;
  inputs: SkillInput[];
  runs: number;
  good: number;
  bad: number;
  learned: number;
};

const CAT_ORDER = ['Marketing', 'Bán hàng', 'Tự động hoá'];

const ICON_MAP: Record<string, any> = {
  file: FileText,
  calendar: CalendarDays,
  sparkles: Sparkles,
  film: Film,
  target: Target,
  shield: ShieldCheck,
  heart: HeartHandshake,
  phone: Phone,
  workflow: Workflow,
};
const iconFor = (name?: string): any => ICON_MAP[String(name || '').toLowerCase()] || Sparkles;

// Some inputs deserve a multi-line textarea.
const isLong = (label?: string): boolean => {
  const l = String(label || '');
  return ['Nội dung', 'Danh sách', 'Thông tin', 'Danh sách khách'].some(t => l.includes(t));
};

// ── Run modal for a single skill ───────────────────────────────────
const RunModal: React.FC<{ skill: Skill; onClose: () => void; onLearned: () => void }> = ({ skill, onClose, onLearned }) => {
  const inputDefs = Array.isArray(skill?.inputs) ? skill.inputs : [];
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const it of inputDefs) init[it.k] = '';
    return init;
  });
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [runId, setRunId] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [rated, setRated] = useState<0 | 1 | -1>(0);
  const [rating, setRating] = useState(false);

  const setField = (k: string, v: string) => setInputs(prev => ({ ...prev, [k]: v }));

  const run = async () => {
    setRunning(true);
    setError('');
    setOutput('');
    setRunId('');
    setRated(0);
    try {
      const res = await api.skillsRun({ skillId: skill.id, inputs });
      if (res?.error) {
        setError(res.error);
      } else if (res?.output) {
        setOutput(res.output);
        setRunId(res?.runId || '');
      } else {
        setError('Trợ lý AI chưa trả về kết quả. Vui lòng thử lại.');
      }
    } catch {
      setError('Trợ lý AI đang bận hoặc mất kết nối. Vui lòng thử lại sau ít phút.');
    } finally {
      setRunning(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* */ }
  };

  const rate = async (r: 1 | -1) => {
    if (!runId || rated !== 0 || rating) return;
    setRating(true);
    try {
      await api.skillsRate(runId, r);
      setRated(r);
      if (r === 1) onLearned();
    } catch { /* */ } finally {
      setRating(false);
    }
  };

  const SkillIcon = iconFor(skill?.icon);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100">
              <SkillIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-slate-900 leading-tight truncate">{skill?.name || 'Kỹ năng'}</h3>
              <p className="text-slate-500 text-sm truncate">{skill?.desc || ''}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition shrink-0"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {Number(skill?.learned) > 0 && (
            <div className="inline-flex items-center gap-2 text-[12px] font-bold px-3 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <GraduationCap className="w-4 h-4 shrink-0" />
              Kỹ năng này đã học {skill.learned} mẫu tốt — kết quả ngày càng sát.
            </div>
          )}

          {inputDefs.length > 0 && (
            <div className="space-y-3">
              {inputDefs.map(it => (
                <div key={it.k} className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {it.label}
                  </label>
                  {isLong(it.label) ? (
                    <textarea
                      rows={4}
                      value={inputs[it.k] ?? ''}
                      onChange={e => setField(it.k, e.target.value)}
                      disabled={running}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium
                                focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition resize-y disabled:opacity-60"
                    />
                  ) : (
                    <input
                      type="text"
                      value={inputs[it.k] ?? ''}
                      onChange={e => setField(it.k, e.target.value)}
                      disabled={running}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium
                                focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition disabled:opacity-60"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={run}
            disabled={running}
            className="w-full py-3.5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700
                      transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2
                      disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Trợ lý AI đang làm…' : 'Chạy kỹ năng'}
          </button>

          {running && (
            <div className="flex items-center justify-center gap-2 text-indigo-600 text-sm font-bold py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Trợ lý AI đang làm… (có thể mất tới vài chục giây)
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm font-bold rounded-xl p-4">
              {error}
            </div>
          )}

          {output && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  Kết quả từ Trợ lý AI
                </span>
                <button
                  onClick={copy}
                  className="flex items-center gap-1.5 text-[11px] font-black px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {output}
              </div>

              {/* Rating */}
              {rated === 0 ? (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[12px] text-slate-400 font-bold mr-1">Kết quả này thế nào?</span>
                  <button
                    onClick={() => rate(1)}
                    disabled={rating || !runId}
                    className="inline-flex items-center gap-1.5 text-[12px] font-black px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition disabled:opacity-50"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" /> Tốt
                  </button>
                  <button
                    onClick={() => rate(-1)}
                    disabled={rating || !runId}
                    className="inline-flex items-center gap-1.5 text-[12px] font-black px-3 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" /> Chưa tốt
                  </button>
                </div>
              ) : rated === 1 ? (
                <div className="inline-flex items-center gap-2 text-[12px] font-bold px-3 py-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <GraduationCap className="w-4 h-4 shrink-0" /> Đã lưu, kỹ năng sẽ học từ mẫu này.
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-[12px] font-bold px-3 py-2 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200">
                  <Check className="w-4 h-4 shrink-0" /> Đã ghi nhận, Trợ lý AI sẽ điều chỉnh.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Skill card ─────────────────────────────────────────────────────
const SkillCard: React.FC<{ skill: Skill; onOpen: () => void }> = ({ skill, onOpen }) => {
  const SkillIcon = iconFor(skill?.icon);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 text-white flex items-center justify-center shrink-0 shadow">
          <SkillIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-black text-slate-900 leading-tight">{skill?.name || 'Kỹ năng'}</div>
          <div className="text-slate-500 text-sm mt-0.5">{skill?.desc || ''}</div>
        </div>
      </div>

      <div className="text-[12px] text-slate-400 font-bold">
        Đã dùng {Number(skill?.runs) || 0} · {Number(skill?.good) || 0}👍 · đã học {Number(skill?.learned) || 0} mẫu
      </div>

      <button
        onClick={onOpen}
        className="mt-auto w-full py-2.5 bg-indigo-600 text-white font-black rounded-xl text-sm hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
      >
        <Wand2 className="w-4 h-4" /> Dùng kỹ năng
      </button>
    </div>
  );
};

// ── Main SkillOS panel ─────────────────────────────────────────────
const SkillOS: React.FC = () => {
  const [items, setItems] = useState<Skill[]>([]);
  const [cats, setCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [active, setActive] = useState<Skill | null>(null);

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await api.skillsList();
      setItems(Array.isArray(r?.items) ? r.items : []);
      const c = Array.isArray(r?.cats) ? r.cats : [];
      setCats(c.length ? c : CAT_ORDER);
    } catch (e: any) {
      setErr(e?.message || 'Không tải được thư viện kỹ năng.');
      setItems([]);
      setCats([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // Group by cat, following the cats order (Marketing, Bán hàng, Tự động hoá), then leftovers.
  const groups = useMemo(() => {
    const byCat = new Map<string, Skill[]>();
    for (const it of items) {
      const c = it?.cat || 'Khác';
      if (!byCat.has(c)) byCat.set(c, []);
      byCat.get(c)!.push(it);
    }
    const ordered: { cat: string; list: Skill[] }[] = [];
    const seen = new Set<string>();
    for (const c of cats) {
      if (byCat.has(c)) { ordered.push({ cat: c, list: byCat.get(c)! }); seen.add(c); }
    }
    for (const [c, list] of byCat) {
      if (!seen.has(c)) ordered.push({ cat: c, list });
    }
    return ordered;
  }, [items, cats]);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header card */}
      <div className="rounded-3xl p-6 text-white bg-gradient-to-br from-indigo-600 to-fuchsia-600 shadow-lg">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-white/15 rounded-2xl"><Wand2 className="w-5 h-5" /></div>
              <h2 className="text-2xl font-black leading-none">SkillOS — Kỹ năng chuyên sâu của Trợ lý AI</h2>
            </div>
            <p className="text-sm opacity-90 mt-2 max-w-2xl">
              Chọn kỹ năng → Trợ lý AI làm việc. Kỹ năng tự học từ đánh giá, càng dùng càng giỏi.
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-2xl text-sm font-black transition disabled:opacity-60 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </div>
      </div>

      {err && (
        <div className="text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm font-bold">{err}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-indigo-600"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
          <div className="w-14 h-14 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 mx-auto mb-3"><Wand2 className="w-7 h-7" /></div>
          <p className="text-sm text-slate-600 font-black">Chưa có kỹ năng nào.</p>
          <p className="text-[12px] text-slate-400 mt-1">Khi thư viện kỹ năng được cấp, danh sách sẽ hiện ở đây.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ cat, list }) => (
            <section key={cat} className="space-y-3">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {cat}
                <span className="text-slate-300 normal-case tracking-normal font-bold">({list.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map(skill => (
                  <SkillCard
                    key={skill.id || `${cat}-${skill.name}`}
                    skill={skill}
                    onOpen={() => setActive(skill)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {active && (
        <RunModal
          skill={active}
          onClose={() => setActive(null)}
          onLearned={load}
        />
      )}
    </div>
  );
};

export default SkillOS;
