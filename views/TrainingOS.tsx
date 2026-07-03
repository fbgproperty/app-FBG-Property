import React, { useEffect, useState } from 'react';
import {
  GraduationCap, LayoutDashboard, Route as RouteIcon, ClipboardCheck, MessagesSquare, Users,
  Loader2, RefreshCw, AlertTriangle, CheckCircle2, Circle, PlayCircle, BookOpen, Award,
  Send, Sparkles, Bot, User as UserIcon, Trophy, TrendingUp,
} from 'lucide-react';
import { api } from '../services/apiService';

type Sec = 'overview' | 'path' | 'quiz' | 'roleplay' | 'roster';
const SECTIONS: { id: Sec; label: string; icon: any }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'path', label: 'Lộ trình học', icon: RouteIcon },
  { id: 'quiz', label: 'Học & Thi', icon: ClipboardCheck },
  { id: 'roleplay', label: 'Thực chiến', icon: MessagesSquare },
  { id: 'roster', label: 'Học viên', icon: Users },
];

const arr = (x: any): any[] => (Array.isArray(x?.items) ? x.items : Array.isArray(x?.modules) ? x.modules : Array.isArray(x) ? x : []);
const num = (x: any): number => (typeof x === 'number' && !Number.isNaN(x) ? x : 0);

/** Render markdown đơn giản (không phụ thuộc thư viện ngoài). */
const Markdown: React.FC<{ text: string }> = ({ text }) => {
  const lines = String(text || '').split('\n');
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: number) => {
    if (list.length) {
      out.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 space-y-1 my-2">
          {list.map((li, i) => <li key={i} className="text-[13px] text-slate-600 leading-relaxed">{inline(li)}</li>)}
        </ul>
      );
      list = [];
    }
  };
  const inline = (s: string): React.ReactNode => {
    const parts = s.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => p.startsWith('**') && p.endsWith('**')
      ? <strong key={i} className="font-black text-slate-800">{p.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{p}</React.Fragment>);
  };
  lines.forEach((raw, idx) => {
    const line = raw.replace(/\s+$/, '');
    if (/^#{1,6}\s/.test(line)) {
      flush(idx);
      const level = (line.match(/^#+/)?.[0].length) || 1;
      const txt = line.replace(/^#+\s/, '');
      out.push(<div key={idx} className={`font-black text-slate-900 ${level <= 2 ? 'text-base mt-4' : 'text-sm mt-3'} mb-1`}>{inline(txt)}</div>);
    } else if (/^\s*[-*]\s+/.test(line)) {
      list.push(line.replace(/^\s*[-*]\s+/, ''));
    } else if (line.trim() === '') {
      flush(idx);
    } else {
      flush(idx);
      out.push(<p key={idx} className="text-[13px] text-slate-600 leading-relaxed my-1.5">{inline(line)}</p>);
    }
  });
  flush(lines.length);
  return <div>{out}</div>;
};

const StatusBadge: React.FC<{ status?: string; score?: number }> = ({ status, score }) => {
  const s = String(status || '').toLowerCase();
  if (s === 'passed' || s === 'dat' || s === 'đạt') {
    return <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600"><CheckCircle2 className="w-3 h-3" />Đạt{typeof score === 'number' ? ` · ${score}` : ''}</span>;
  }
  if (s === 'learning' || s === 'dang-hoc' || s === 'đang học') {
    return <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-50 text-amber-600"><PlayCircle className="w-3 h-3" />Đang học</span>;
  }
  return <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500"><Circle className="w-3 h-3" />Chưa học</span>;
};

/* ============================ TỔNG QUAN ============================ */
const OverviewSection: React.FC = () => {
  const [data, setData] = useState<{ items: any[]; total: number; selling: number; learning: number; notStarted: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const load = async () => {
    setLoading(true); setErr('');
    try { setData(await api.trainRoster()); }
    catch (e: any) { setErr(e?.message || 'Không tải được dữ liệu.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const total = data?.total ?? 0;
  const selling = data?.selling ?? 0;
  const learning = data?.learning ?? 0;
  const notStarted = data?.notStarted ?? 0;
  const pct = total > 0 ? Math.round((selling / total) * 100) : 0;

  const cards = [
    { label: 'Đang bán', value: selling, icon: Trophy, color: 'emerald' },
    { label: 'Đang học', value: learning, icon: PlayCircle, color: 'amber' },
    { label: 'Chưa học', value: notStarted, icon: Circle, color: 'slate' },
    { label: 'Tổng học viên', value: total, icon: Users, color: 'indigo' },
  ];
  const tone: Record<string, string> = {
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    slate: 'text-slate-500 bg-slate-100',
    indigo: 'text-indigo-600 bg-indigo-50',
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-indigo-700 to-slate-900 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1"><GraduationCap className="w-5 h-5" /><span className="font-black">Trung tâm đào tạo</span></div>
            <p className="text-sm opacity-90 max-w-2xl">Trung tâm đào tạo — chuyên viên (người &amp; AI) học, thi, tốt nghiệp rồi tham gia bán dự án.</p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/25 rounded-xl font-black text-sm disabled:opacity-60 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Làm mới
          </button>
        </div>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tone[c.color]}`}><Icon className="w-5 h-5" /></div>
              <div className="text-3xl font-black text-slate-900 leading-none">{loading && !data ? '…' : c.value}</div>
              <div className="text-[12px] font-bold text-slate-400 mt-1">{c.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span className="font-black text-slate-900 text-sm flex-1">Tỷ lệ đã kích hoạt bán</span>
          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">{pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[12px] text-slate-400 mt-2">{selling}/{total} chuyên viên đã tốt nghiệp và tham gia bán dự án.</p>
      </div>
    </div>
  );
};

/* ============================ LỘ TRÌNH HỌC ============================ */
const PathSection: React.FC = () => {
  const [modules, setModules] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ passed: number; total: number; graduated: boolean; certId: string }>({ passed: 0, total: 0, graduated: false, certId: '' });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<any | null>(null);
  const [lesson, setLesson] = useState<{ title: string; content: string } | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizState | null>(null);

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const d = await api.trainCurriculum();
      setModules(arr(d));
      setMeta({ passed: num(d.passed), total: num(d.total), graduated: !!d.graduated, certId: d.certId || '' });
    } catch (e: any) { setErr(e?.message || 'Không tải được lộ trình.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const openLesson = async (m: any) => {
    setOpen(m); setLesson(null); setQuiz(null); setLessonLoading(true);
    try {
      const l = await api.trainLesson(m.id);
      setLesson({ title: l.title || m.title, content: l.content || '' });
    } catch (e: any) { setErr(e?.message || 'Không tải được bài học.'); }
    setLessonLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-1">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <span className="font-black text-slate-900">Lộ trình 6 mô-đun</span>
          {meta.total > 0 && <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">{meta.passed}/{meta.total} đạt</span>}
          {meta.graduated && <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600"><Award className="w-3 h-3" />Đã tốt nghiệp{meta.certId ? ` · ${meta.certId}` : ''}</span>}
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Làm mới
        </button>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}

      {loading && modules.length === 0 ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải lộ trình…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modules.map((m, i) => (
            <button key={m.id ?? i} onClick={() => openLesson(m)}
              className={`text-left bg-white rounded-2xl border p-5 hover:border-indigo-300 hover:shadow-md transition ${open && open.id === m.id ? 'border-indigo-400 ring-1 ring-indigo-200' : 'border-slate-100'}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shrink-0">{m.icon || (i + 1)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-900 text-sm">{m.title || `Mô-đun ${i + 1}`}</span>
                    <StatusBadge status={m.status} score={m.score} />
                  </div>
                  {m.desc && <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">{m.desc}</p>}
                  {Array.isArray(m.objectives) && m.objectives.length > 0 && (
                    <ul className="mt-2 space-y-0.5">
                      {m.objectives.slice(0, 4).map((o: string, k: number) => (
                        <li key={k} className="text-[11px] text-slate-400 flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 mt-0.5 text-slate-300 shrink-0" />{o}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span className="font-black text-slate-900 text-base flex-1">{lesson?.title || open.title}</span>
            <StatusBadge status={open.status} score={open.score} />
          </div>
          {lessonLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-8 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải bài học…</div>
          ) : lesson?.content ? (
            <div className="prose-none"><Markdown text={lesson.content} /></div>
          ) : (
            <p className="text-sm text-slate-400 py-4">Chưa có nội dung bài học.</p>
          )}

          {!quiz && lesson && !lessonLoading && (
            <button onClick={async () => { setQuiz({ loading: true }); try { const q = await api.trainQuiz(open.id); setQuiz({ loading: false, quiz: q, answers: {} }); } catch (e: any) { setQuiz({ loading: false, error: e?.message || 'Không tải được bài kiểm tra.' }); } }}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700">
              <ClipboardCheck className="w-4 h-4" /> Làm bài kiểm tra
            </button>
          )}
          {quiz && <div className="mt-5 pt-5 border-t border-slate-100"><InlineQuiz state={quiz} setState={setQuiz} onGraded={load} /></div>}
        </div>
      )}
    </div>
  );
};

/* ============================ QUIZ (dùng chung) ============================ */
type QuizState = { loading?: boolean; error?: string; quiz?: { quizId: string; questions: { q: string; options: string[] }[] }; answers?: Record<number, number>; result?: { score: number; correct: number; total: number; pass: boolean }; submitting?: boolean };

const InlineQuiz: React.FC<{ state: QuizState; setState: (s: QuizState) => void; onGraded?: () => void }> = ({ state, setState, onGraded }) => {
  if (state.loading) return <div className="flex items-center gap-2 text-slate-400 text-sm py-6 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo bài kiểm tra…</div>;
  if (state.error) return <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {state.error}</div>;
  if (!state.quiz) return null;
  const { quiz, answers = {}, result } = state;

  const submit = async () => {
    setState({ ...state, submitting: true });
    try {
      const ansArr = quiz.questions.map((_, i) => (answers[i] ?? -1));
      const r = await api.trainGrade(quiz.quizId, ansArr);
      setState({ ...state, submitting: false, result: r });
      onGraded?.();
    } catch (e: any) {
      setState({ ...state, submitting: false, error: e?.message || 'Chấm bài thất bại.' });
    }
  };

  const answered = Object.keys(answers).length;
  return (
    <div className="space-y-4">
      {result ? (
        <div className={`rounded-2xl p-5 text-center ${result.pass ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          {result.pass ? <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" /> : <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />}
          <div className={`text-4xl font-black ${result.pass ? 'text-emerald-600' : 'text-rose-600'}`}>{result.score}</div>
          <p className="text-sm font-bold text-slate-600 mt-1">Đúng {result.correct}/{result.total} · {result.pass ? 'ĐẠT — chúc mừng!' : 'CHƯA ĐẠT — hãy ôn lại và thử lại.'}</p>
          <button onClick={() => setState({ ...state, result: undefined, answers: {} })} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-black text-sm hover:bg-slate-50">
            <RefreshCw className="w-4 h-4" /> Làm lại
          </button>
        </div>
      ) : (
        <>
          {quiz.questions.map((q, qi) => (
            <div key={qi} className="rounded-2xl border border-slate-100 p-4">
              <div className="font-black text-slate-800 text-sm mb-2.5">{qi + 1}. {q.q}</div>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => {
                  const on = answers[qi] === oi;
                  return (
                    <label key={oi} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border cursor-pointer transition ${on ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100 hover:bg-slate-50'}`}>
                      <input type="radio" name={`q-${qi}`} checked={on} onChange={() => setState({ ...state, answers: { ...answers, [qi]: oi } })} className="accent-indigo-600" />
                      <span className="text-[13px] text-slate-700">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <button onClick={submit} disabled={state.submitting || answered < quiz.questions.length}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50">
            {state.submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />} Nộp bài ({answered}/{quiz.questions.length})
          </button>
        </>
      )}
    </div>
  );
};

/* ============================ HỌC & THI ============================ */
const QuizSection: React.FC = () => {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [picked, setPicked] = useState<any | null>(null);
  const [quiz, setQuiz] = useState<QuizState | null>(null);

  const load = async () => {
    setLoading(true); setErr('');
    try { const d = await api.trainCurriculum(); setModules(arr(d)); }
    catch (e: any) { setErr(e?.message || 'Không tải được danh sách mô-đun.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const pick = async (m: any) => {
    setPicked(m); setQuiz({ loading: true });
    try { const q = await api.trainQuiz(m.id); setQuiz({ loading: false, quiz: q, answers: {} }); }
    catch (e: any) { setQuiz({ loading: false, error: e?.message || 'Không tải được bài kiểm tra.' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardCheck className="w-5 h-5 text-indigo-600" />
        <span className="font-black text-slate-900 flex-1">Học &amp; Thi — chọn mô-đun để làm bài</span>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Làm mới
        </button>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}

      <div className="flex items-center gap-2 flex-wrap">
        {modules.map((m, i) => {
          const on = picked && picked.id === m.id;
          return (
            <button key={m.id ?? i} onClick={() => pick(m)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm transition ${on ? 'bg-indigo-600 text-white shadow' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <span>{m.icon || (i + 1)}</span> {m.title || `Mô-đun ${i + 1}`}
            </button>
          );
        })}
      </div>

      {picked && quiz && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="font-black text-slate-900 text-base mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-600" />Bài kiểm tra: {picked.title}</div>
          <InlineQuiz state={quiz} setState={setQuiz} onGraded={load} />
        </div>
      )}
    </div>
  );
};

/* ============================ THỰC CHIẾN ============================ */
type Msg = { role: 'user' | 'assistant'; content: string };
const SCENARIOS = [
  'Khách mặc định (backend chọn)',
  'Khách lần đầu tìm hiểu, còn e ngại về giá',
  'Khách đầu tư quan tâm dòng tiền cho thuê',
  'Khách so sánh với dự án đối thủ',
];

const RoleplaySection: React.FC = () => {
  const [scenario, setScenario] = useState('');
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState<{ score: number; feedback: string; strengths: string[]; improve: string[] } | null>(null);
  const [finishing, setFinishing] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setErr(''); setInput('');
    const next = [...history, { role: 'user' as const, content: text }];
    setHistory(next); setSending(true);
    try {
      const r = await api.trainRoleplay({ history: next, scenario: scenario || undefined });
      setHistory([...next, { role: 'assistant', content: r.reply || '' }]);
    } catch (e: any) {
      setErr(e?.message || 'Khách hàng AI chưa phản hồi. Thử lại.');
    }
    setSending(false);
  };

  const finish = async () => {
    if (finishing || history.length === 0) return;
    setErr(''); setFinishing(true);
    try {
      const r = await api.trainRoleplay({ history, scenario: scenario || undefined, finish: true });
      setResult({ score: num(r.score), feedback: r.feedback || '', strengths: Array.isArray(r.strengths) ? r.strengths : [], improve: Array.isArray(r.improve) ? r.improve : [] });
    } catch (e: any) {
      setErr(e?.message || 'Chấm điểm thất bại.');
    }
    setFinishing(false);
  };

  const reset = () => { setHistory([]); setResult(null); setInput(''); setErr(''); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <MessagesSquare className="w-5 h-5 text-indigo-600" />
        <span className="font-black text-slate-900 flex-1">Thực chiến — luyện bán với khách hàng AI</span>
        <select value={scenario} onChange={e => setScenario(e.target.value === SCENARIOS[0] ? '' : e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 bg-white">
          {SCENARIOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={reset} className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm">
          <RefreshCw className="w-4 h-4" /> Bắt đầu lại
        </button>
      </div>

      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="min-h-[280px] max-h-[440px] overflow-y-auto space-y-3 pr-1">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <MessagesSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-semibold">Bắt đầu cuộc trò chuyện — bạn là chuyên viên bán hàng, khách hàng AI sẽ phản hồi như thật.</p>
            </div>
          ) : history.map((m, i) => (
            <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Bot className="w-4 h-4" /></div>}
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>{m.content}</div>
              {m.role === 'user' && <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><UserIcon className="w-4 h-4" /></div>}
            </div>
          ))}
          {sending && <div className="flex gap-2 justify-start"><div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Bot className="w-4 h-4" /></div><div className="bg-slate-100 rounded-2xl px-4 py-2.5"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div></div>}
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }}
            placeholder="Nhập lời tư vấn của bạn…" className="flex-1 p-2.5 rounded-xl border border-slate-200 text-sm" disabled={!!result} />
          <button onClick={send} disabled={sending || !input.trim() || !!result} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 disabled:opacity-50">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
          <button onClick={finish} disabled={finishing || history.length === 0 || !!result} className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap">
            {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />} Kết thúc &amp; chấm điểm
          </button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex flex-col items-center justify-center shrink-0">
              <span className="text-xl font-black leading-none">{result.score}</span>
              <span className="text-[9px] font-bold">điểm</span>
            </div>
            <div>
              <div className="font-black text-slate-900">Kết quả thực chiến</div>
              {result.feedback && <p className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">{result.feedback}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
              <div className="font-black text-emerald-700 text-sm mb-2 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" />Điểm mạnh</div>
              {result.strengths.length ? <ul className="space-y-1">{result.strengths.map((s, i) => <li key={i} className="text-[13px] text-slate-600 flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 mt-0.5 text-emerald-500 shrink-0" />{s}</li>)}</ul> : <p className="text-[12px] text-slate-400">—</p>}
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
              <div className="font-black text-amber-700 text-sm mb-2 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" />Cần cải thiện</div>
              {result.improve.length ? <ul className="space-y-1">{result.improve.map((s, i) => <li key={i} className="text-[13px] text-slate-600 flex items-start gap-1.5"><Circle className="w-3 h-3 mt-0.5 text-amber-500 shrink-0" />{s}</li>)}</ul> : <p className="text-[12px] text-slate-400">—</p>}
            </div>
          </div>
          <button onClick={reset} className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm"><RefreshCw className="w-4 h-4" /> Luyện lại</button>
        </div>
      )}
    </div>
  );
};

/* ============================ HỌC VIÊN ============================ */
const RosterSection: React.FC = () => {
  const [data, setData] = useState<{ items: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try { setData(await api.trainRoster()); }
    catch (e: any) { setErr(e?.message || 'Không tải được danh sách học viên.'); }
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 6000); return () => clearTimeout(t); }, [toast]);

  const agentTrain = async (email: string) => {
    setBusy(b => ({ ...b, [email]: 'train' })); setToast('');
    try {
      const r = await api.trainAgentTrain(email);
      if (r?.ok) setToast(`AI đã tự học xong${r.graduated ? ' và tốt nghiệp' : ''} — đạt ${r.passed ?? r.results?.length ?? 0} mô-đun${r.certId ? ` · ${r.certId}` : ''}.`);
      else setToast(r?.error || 'AI tự học chưa hoàn tất.');
      await load();
    } catch (e: any) { setToast(e?.message || 'AI tự học thất bại.'); }
    setBusy(b => { const n = { ...b }; delete n[email]; return n; });
  };

  const graduate = async (email: string) => {
    setBusy(b => ({ ...b, [email]: 'grad' })); setToast('');
    try {
      const r = await api.trainGraduate(email);
      if (r?.ok) setToast(`Đã cấp bằng tốt nghiệp${r.certId ? ` · ${r.certId}` : ''}${typeof r.avgScore === 'number' ? ` · điểm TB ${r.avgScore}` : ''}.`);
      else setToast(r?.error || `Chưa đủ điều kiện tốt nghiệp (đạt ${r?.passed ?? 0}/${r?.need ?? '?'}).`);
      await load();
    } catch (e: any) { setToast(e?.message || 'Cấp bằng thất bại.'); }
    setBusy(b => { const n = { ...b }; delete n[email]; return n; });
  };

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-5 h-5 text-indigo-600" />
        <span className="font-black text-slate-900 flex-1">Học viên ({items.length})</span>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Làm mới
        </button>
      </div>

      {toast && <div className="flex items-center gap-2 text-indigo-700 bg-indigo-50 rounded-xl px-3 py-2 text-sm font-bold"><Sparkles className="w-4 h-4 shrink-0" /> {toast}</div>}
      {err && <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-sm font-bold"><AlertTriangle className="w-4 h-4 shrink-0" /> {err}</div>}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-12 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Đang tải học viên…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="px-4 py-3">Học viên</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Vai trò / Phòng</th>
                  <th className="px-4 py-3 min-w-[160px]">Tiến độ</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((it, i) => {
                  const email = it.email || '';
                  const progress = Math.max(0, Math.min(100, num(it.progress)));
                  const bId = busy[email];
                  const canGrad = num(it.passed) >= num(it.totalModules) && num(it.totalModules) > 0 && !it.graduated;
                  return (
                    <tr key={email || i} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-800">{it.name || email || '—'}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {it.isAI
                          ? <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-fuchsia-50 text-fuchsia-600"><Bot className="w-3 h-3" />AI</span>
                          : <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500"><UserIcon className="w-3 h-3" />Người</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[12px] font-bold text-slate-600">{it.role || '—'}</div>
                        {it.dept && <div className="text-[11px] text-slate-400">{it.dept}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">{num(it.passed)}/{num(it.totalModules)} mô-đun · {progress}%</div>
                      </td>
                      <td className="px-4 py-3">
                        {it.graduated
                          ? <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600"><Award className="w-3 h-3" />Tốt nghiệp{it.certId ? ` · ${it.certId}` : ''}</span>
                          : <StatusBadge status={it.status} />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                          {it.isAI && !it.graduated && (
                            <button onClick={() => agentTrain(email)} disabled={!!bId}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-fuchsia-600 text-white rounded-lg font-black text-[12px] hover:bg-fuchsia-700 disabled:opacity-50 whitespace-nowrap">
                              {bId === 'train' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Cho AI tự học
                            </button>
                          )}
                          {canGrad && (
                            <button onClick={() => graduate(email)} disabled={!!bId}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-black text-[12px] hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap">
                              {bId === 'grad' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Award className="w-3.5 h-3.5" />} Cấp bằng tốt nghiệp
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">Chưa có học viên.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {Object.values(busy).includes('train') && (
        <p className="text-[12px] text-slate-400 text-center">AI đang tự học toàn bộ lộ trình — quá trình này mất khoảng 30–60 giây, vui lòng chờ…</p>
      )}
    </div>
  );
};

/* ============================ HUB ============================ */
const TrainingOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('overview');
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><GraduationCap className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Đào Tạo OS</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Học · Thi · Thực chiến · Tốt nghiệp — chuyên viên người &amp; AI được đào tạo rồi tham gia bán dự án</p>
        </div>
      </header>

      <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {SECTIONS.map(s => {
          const active = sec === s.id; const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSec(s.id)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition ${active ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in duration-300">
        {sec === 'overview' && <OverviewSection />}
        {sec === 'path' && <PathSection />}
        {sec === 'quiz' && <QuizSection />}
        {sec === 'roleplay' && <RoleplaySection />}
        {sec === 'roster' && <RosterSection />}
      </div>
    </div>
  );
};

export default TrainingOS;
