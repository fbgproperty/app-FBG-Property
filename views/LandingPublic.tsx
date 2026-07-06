import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { api } from '../services/apiService';

const fmtVnd = (n: any): string => {
  const x = Number(n);
  if (!x || Number.isNaN(x)) return '';
  if (x >= 1e9) return (x / 1e9).toFixed(2).replace(/\.?0+$/, '') + ' tỷ';
  if (x >= 1e6) return Math.round(x / 1e6) + ' triệu';
  return String(x);
};

const LandingPublic: React.FC = () => {
  const { project = '', code = '' } = useParams();
  const loc = useLocation();
  const ref = new URLSearchParams(loc.search).get('ref') || '';

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', phone: '', note: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');

  const projName = decodeURIComponent(project);
  const unitCode = decodeURIComponent(code);

  useEffect(() => {
    api.lpGet(projName, unitCode).then((d: any) => setData(d)).finally(() => setLoading(false));
  }, [projName, unitCode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) { setErr('Vui lòng nhập họ tên và số điện thoại.'); return; }
    setSending(true); setErr('');
    try {
      const r = await api.lpLead({ project: projName, code: unitCode, name: form.name.trim(), phone: form.phone.trim(), ref, note: form.note.trim() });
      if (r?.ok) setSent(true); else setErr(r?.error || 'Gửi chưa được, thử lại.');
    } catch { setErr('Gửi chưa được, thử lại.'); }
    setSending(false);
  };

  const L = data?.landing || {};
  const unit = data?.unit || {};
  const headline = L.headline || `${unitCode || projName}`;
  const sub = L.subheadline || (projName + (unit.area ? ` · ${unit.area} m²` : '') + (unit.price ? ` · ${fmtVnd(unit.price)}` : ''));

  const specs = (L.specs && L.specs.length) ? L.specs : [
    unit.area && { label: 'Diện tích', value: unit.area + ' m²' },
    unit.type && { label: 'Loại', value: unit.type },
    unit.direction && { label: 'Hướng', value: unit.direction },
    unit.floor && { label: 'Tầng', value: unit.floor },
    unit.block && { label: 'Toà', value: unit.block },
    unit.price && { label: 'Giá', value: fmtVnd(unit.price) },
  ].filter(Boolean);

  if (loading) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'system-ui', color: '#64748b' }}>Đang tải…</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0b1020', color: '#e8eaf6', fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 18px 60px' }}>
        {/* Hero */}
        <section style={{ padding: '54px 0 30px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e24bd0', fontWeight: 800 }}>FBG Property</div>
          <h1 style={{ fontSize: 'clamp(28px,6vw,44px)', fontWeight: 800, lineHeight: 1.08, margin: '12px 0', letterSpacing: '-.02em' }}>{headline}</h1>
          <p style={{ color: '#aab0d4', fontSize: 17, margin: 0 }}>{sub}</p>
          <a href="#dangky" style={{ display: 'inline-block', marginTop: 22, background: 'linear-gradient(135deg,#7c83ff,#e24bd0)', color: '#fff', fontWeight: 800, padding: '13px 28px', borderRadius: 12, textDecoration: 'none' }}>{L.heroCta || 'Nhận bảng giá & tư vấn'}</a>
        </section>

        {/* Specs */}
        {specs.length > 0 && (
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, margin: '10px 0 26px' }}>
            {specs.map((s: any, i: number) => (
              <div key={i} style={{ background: '#151a30', border: '1px solid #262c48', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, color: '#8b91b8', fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </section>
        )}

        {/* Benefits */}
        {(L.benefits || []).length > 0 && (
          <section style={{ display: 'grid', gap: 12, marginBottom: 26 }}>
            {L.benefits.map((b: any, i: number) => (
              <div key={i} style={{ background: '#151a30', border: '1px solid #262c48', borderRadius: 14, padding: 16 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{b.title}</div>
                <div style={{ color: '#aab0d4', marginTop: 4 }}>{b.text}</div>
              </div>
            ))}
          </section>
        )}

        {L.location && <Para title="Vị trí" text={L.location} />}
        {L.policy && <Para title="Chính sách & ưu đãi" text={L.policy} />}

        {(L.faq || []).length > 0 && (
          <section style={{ marginBottom: 26 }}>
            {L.faq.map((f: any, i: number) => (
              <div key={i} style={{ borderTop: '1px solid #262c48', padding: '14px 0' }}>
                <div style={{ fontWeight: 800 }}>{f.q}</div>
                <div style={{ color: '#aab0d4', marginTop: 4 }}>{f.a}</div>
              </div>
            ))}
          </section>
        )}

        {/* Lead form */}
        <section id="dangky" style={{ background: 'linear-gradient(135deg,#1a2040,#241a3e)', border: '1px solid #2e355c', borderRadius: 20, padding: 26, marginTop: 10 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 44 }}>✅</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: '8px 0' }}>Đã nhận thông tin!</h3>
              <p style={{ color: '#aab0d4', margin: 0 }}>Chuyên viên FBG Property sẽ liên hệ với bạn sớm nhất. Cảm ơn bạn đã quan tâm.</p>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', textAlign: 'center' }}>{L.finalCta || 'Đăng ký nhận bảng giá & tư vấn'}</h3>
              <p style={{ color: '#aab0d4', textAlign: 'center', margin: '0 0 18px' }}>Để lại thông tin, chuyên viên liên hệ tư vấn miễn phí.</p>
              <form onSubmit={submit} style={{ display: 'grid', gap: 10, maxWidth: 460, margin: '0 auto' }}>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Họ và tên" style={inp} />
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Số điện thoại" inputMode="tel" style={inp} />
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Nhu cầu (tuỳ chọn)" rows={2} style={inp} />
                {err && <div style={{ color: '#ff9db1', fontSize: 13, fontWeight: 600 }}>{err}</div>}
                <button type="submit" disabled={sending} style={{ background: 'linear-gradient(135deg,#7c83ff,#e24bd0)', color: '#fff', fontWeight: 800, padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 16 }}>
                  {sending ? 'Đang gửi…' : 'Gửi thông tin'}
                </button>
                <p style={{ fontSize: 11, color: '#6b7099', textAlign: 'center', margin: 0 }}>Thông tin của bạn được bảo mật, chỉ dùng để tư vấn dự án.</p>
              </form>
            </>
          )}
        </section>

        <footer style={{ textAlign: 'center', color: '#6b7099', fontSize: 12, marginTop: 34 }}>© FBG Property · {projName}</footer>
      </div>
    </div>
  );
};

const inp: React.CSSProperties = { background: '#0f1428', border: '1px solid #2e355c', color: '#e8eaf6', borderRadius: 10, padding: '12px 14px', fontSize: 15, outline: 'none', width: '100%' };
const Para: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <section style={{ marginBottom: 22 }}>
    <div style={{ fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: '#8b91b8', fontWeight: 800, marginBottom: 6 }}>{title}</div>
    <p style={{ color: '#d6d9ef', margin: 0, lineHeight: 1.65 }}>{text}</p>
  </section>
);

export default LandingPublic;
