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

const C = {
  bg: '#0B1020', card: '#141A30', line: '#262C48', ink: '#E8EAF6', mut: '#A6ACD0',
  faint: '#6B7099', acc: '#E24BD0', acc2: '#7C83FF', ok: '#3DD6A0',
};
const grad = 'linear-gradient(135deg,#7C83FF,#E24BD0)';

const Section: React.FC<{ eyebrow: string; title?: string; children: React.ReactNode }> = ({ eyebrow, title, children }) => (
  <section style={{ margin: '34px 0' }}>
    <div style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: C.acc, fontWeight: 800 }}>{eyebrow}</div>
    {title && <h2 style={{ fontSize: 'clamp(20px,3.4vw,28px)', fontWeight: 800, margin: '6px 0 14px', letterSpacing: '-.01em' }}>{title}</h2>}
    {!title && <div style={{ height: 12 }} />}
    {children}
  </section>
);

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
  const [more, setMore] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);

  const rawProj = decodeURIComponent(project);
  const unitCode = decodeURIComponent(code);
  const projName = data?.project || rawProj;

  useEffect(() => {
    api.lpGet(rawProj, unitCode).then((d: any) => setData(d)).finally(() => setLoading(false));
  }, [rawProj, unitCode]);

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

  if (loading) return <div style={{ minHeight: '100vh', background: C.bg, display: 'grid', placeItems: 'center', fontFamily: 'system-ui', color: C.faint }}>Đang tải…</div>;

  const L = data?.landing || {};
  const ct = data?.content || {};
  const unit = data?.unit || {};
  const images: string[] = data?.images || [];
  const unitsTop: any[] = data?.unitsTop || [];
  const hero = images[heroIdx] || images[0] || '';

  const headline = L.headline || (unitCode ? `Căn ${unitCode} · ${projName}` : projName);
  const address = ct.address || '';
  const priceFrom = unitCode ? unit.price : data?.priceFrom;

  const chips = unitCode
    ? [unit.area && `${unit.area} m²`, unit.type, unit.direction && `Hướng ${unit.direction}`, unit.floor && `Tầng ${unit.floor}`, unit.price && `Giá ${fmtVnd(unit.price)}`].filter(Boolean)
    : [priceFrom && `Giá từ ${fmtVnd(priceFrom)}`, data?.unitsCount > 0 && `${data.unitsCount} căn/sản phẩm`, (ct.subdivisions || []).length > 0 && `${ct.subdivisions.length} phân khu`].filter(Boolean);

  const specs = (L.specs && L.specs.length) ? L.specs : (unitCode ? [
    unit.area && { label: 'Diện tích', value: unit.area + ' m²' },
    unit.type && { label: 'Loại', value: unit.type },
    unit.direction && { label: 'Hướng', value: unit.direction },
    unit.floor && { label: 'Tầng', value: unit.floor },
    unit.block && { label: 'Toà', value: unit.block },
    unit.price && { label: 'Giá', value: fmtVnd(unit.price) },
  ].filter(Boolean) : []);

  const overview: string = ct.overview || '';
  const ovShort = overview.length > 700 ? overview.slice(0, 700).replace(/\S+$/, '') + '…' : overview;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', lineHeight: 1.6 }}>
      {/* ===== HERO ===== */}
      <header style={{ position: 'relative', minHeight: hero ? 'min(78vh,640px)' : 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
        {hero && <>
          <img src={hero} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,16,32,.35) 0%, rgba(11,16,32,.55) 45%, rgba(11,16,32,.96) 100%)' }} />
        </>}
        <div style={{ position: 'relative', maxWidth: 980, margin: '0 auto', padding: hero ? '120px 20px 34px' : '54px 20px 10px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: C.acc, fontWeight: 800 }}>FBG Property giới thiệu</div>
          <h1 style={{ fontSize: 'clamp(30px,6vw,52px)', fontWeight: 800, lineHeight: 1.05, margin: '10px 0 8px', letterSpacing: '-.02em', textShadow: hero ? '0 2px 24px rgba(0,0,0,.5)' : 'none' }}>{headline}</h1>
          {L.subheadline && <p style={{ color: C.mut, fontSize: 17, margin: '0 0 6px', maxWidth: 640 }}>{L.subheadline}</p>}
          {address && <p style={{ color: C.mut, fontSize: 14.5, margin: 0 }}>📍 {address}</p>}
          {chips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              {chips.map((c: any, i: number) => (
                <span key={i} style={{ fontSize: 13, fontWeight: 700, background: 'rgba(124,131,255,.16)', border: '1px solid rgba(124,131,255,.35)', borderRadius: 999, padding: '6px 14px', backdropFilter: 'blur(4px)' }}>{c}</span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <a href="#dangky" style={{ background: grad, color: '#fff', fontWeight: 800, padding: '14px 30px', borderRadius: 12, textDecoration: 'none', fontSize: 15.5, boxShadow: '0 8px 28px rgba(226,75,208,.35)' }}>{L.heroCta || 'Nhận bảng giá & tư vấn'}</a>
            {unitsTop.length > 0 && <a href="#quycan" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.25)', color: '#fff', fontWeight: 700, padding: '14px 24px', borderRadius: 12, textDecoration: 'none', fontSize: 15 }}>Xem quỹ căn</a>}
          </div>
        </div>
        {/* Gallery thumbs */}
        {images.length > 1 && (
          <div style={{ position: 'relative', maxWidth: 980, margin: '0 auto', padding: '0 20px 22px', width: '100%', boxSizing: 'border-box', display: 'flex', gap: 8, overflowX: 'auto' }}>
            {images.map((im, i) => (
              <img key={i} src={im} alt="" onClick={() => setHeroIdx(i)}
                style={{ width: 92, height: 60, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', flexShrink: 0, border: i === heroIdx ? `2px solid ${C.acc}` : '2px solid transparent', opacity: i === heroIdx ? 1 : .75 }} />
            ))}
          </div>
        )}
      </header>

      <main style={{ maxWidth: 980, margin: '0 auto', padding: '0 20px 80px', boxSizing: 'border-box' }}>
        {/* ===== Thông số căn (trang căn hộ) ===== */}
        {specs.length > 0 && (
          <Section eyebrow={unitCode ? 'Thông số căn hộ' : 'Thông tin nhanh'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10 }}>
              {specs.map((s: any, i: number) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: '14px 16px' }}>
                  <div style={{ fontSize: 12, color: C.faint, fontWeight: 700 }}>{s.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== Tổng quan ===== */}
        {overview && (
          <Section eyebrow="Tổng quan dự án">
            <p style={{ color: '#D6D9EF', whiteSpace: 'pre-wrap', margin: 0, fontSize: 15.5 }}>{more ? overview : ovShort}</p>
            {overview.length > 700 && (
              <button onClick={() => setMore(m => !m)} style={{ marginTop: 10, background: 'none', border: 'none', color: C.acc2, fontWeight: 800, cursor: 'pointer', fontSize: 14, padding: 0 }}>
                {more ? '− Thu gọn' : '+ Xem đầy đủ'}
              </button>
            )}
          </Section>
        )}

        {/* ===== Lợi ích (AI landing) ===== */}
        {(L.benefits || []).length > 0 && (
          <Section eyebrow="Vì sao chọn dự án này">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
              {L.benefits.map((b: any, i: number) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: grad, display: 'grid', placeItems: 'center', fontWeight: 900, marginBottom: 10 }}>{i + 1}</div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{b.title}</div>
                  <div style={{ color: C.mut, marginTop: 4, fontSize: 14.5 }}>{b.text}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== Vị trí ===== */}
        {(ct.location || address) && (
          <Section eyebrow="Vị trí & kết nối">
            <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
              {address && <p style={{ margin: '0 0 8px', fontWeight: 800 }}>📍 {address}</p>}
              {ct.location && <p style={{ color: '#D6D9EF', whiteSpace: 'pre-wrap', margin: 0, fontSize: 15 }}>{String(ct.location).slice(0, 1200)}</p>}
              {L.location && !ct.location && <p style={{ color: '#D6D9EF', margin: 0 }}>{L.location}</p>}
            </div>
          </Section>
        )}

        {/* ===== Phân khu ===== */}
        {(ct.subdivisions || []).length > 0 && (
          <Section eyebrow="Phân khu" title="Các phân khu của dự án">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
              {ct.subdivisions.map((sd: any, i: number) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: 18 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>{sd.name}</div>
                  <div style={{ color: C.mut, marginTop: 6, fontSize: 14 }}>{String(sd.desc || '').slice(0, 220)}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== Quỹ căn nổi bật ===== */}
        {unitsTop.length > 0 && !unitCode && (
          <Section eyebrow="Quỹ căn" title="Căn đẹp đang mở bán">
            <div id="quycan" style={{ overflowX: 'auto', border: `1px solid ${C.line}`, borderRadius: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560, fontSize: 14.5 }}>
                <thead>
                  <tr style={{ background: C.card, textAlign: 'left' }}>
                    {['Mã căn', 'Loại', 'DT (m²)', 'Hướng', 'Giá'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: C.faint }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unitsTop.map((u: any, i: number) => (
                    <tr key={i} style={{ borderTop: `1px solid ${C.line}` }}>
                      <td style={{ padding: '11px 14px', fontWeight: 800 }}>{u.code}</td>
                      <td style={{ padding: '11px 14px', color: C.mut }}>{u.type || '—'}</td>
                      <td style={{ padding: '11px 14px', color: C.mut }}>{u.area || '—'}</td>
                      <td style={{ padding: '11px 14px', color: C.mut }}>{u.direction || '—'}</td>
                      <td style={{ padding: '11px 14px', fontWeight: 800, color: C.ok }}>{fmtVnd(u.price) || 'Liên hệ'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ color: C.faint, fontSize: 12.5, marginTop: 8 }}>* Hiển thị {unitsTop.length}/{data?.unitsCount} căn — để lại thông tin để nhận <b style={{ color: C.mut }}>bảng hàng đầy đủ + chính sách mới nhất</b>.</p>
          </Section>
        )}

        {/* ===== Chính sách ===== */}
        {(ct.salesPolicy || L.policy) && (
          <Section eyebrow="Chính sách bán hàng & ưu đãi">
            <div style={{ background: 'linear-gradient(135deg, rgba(124,131,255,.10), rgba(226,75,208,.10))', border: `1px solid ${C.line}`, borderRadius: 16, padding: 20 }}>
              <p style={{ color: '#D6D9EF', whiteSpace: 'pre-wrap', margin: 0, fontSize: 15 }}>{(ct.salesPolicy || L.policy || '').slice(0, 1800)}</p>
            </div>
          </Section>
        )}

        {/* ===== Tiến độ ===== */}
        {(ct.progress || []).length > 0 && (
          <Section eyebrow="Tiến độ" title="Hành trình dự án">
            <div style={{ borderLeft: `2px solid ${C.line}`, marginLeft: 8, paddingLeft: 22, display: 'grid', gap: 16 }}>
              {ct.progress.map((p: any, i: number) => (
                <div key={i} style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: -29, top: 4, width: 12, height: 12, borderRadius: '50%', background: i === ct.progress.length - 1 ? C.acc : C.line, border: `2px solid ${C.bg}` }} />
                  <div style={{ fontSize: 12.5, color: C.acc2, fontWeight: 800 }}>{p.date}</div>
                  <div style={{ fontWeight: 800 }}>{p.title}</div>
                  {p.desc && <div style={{ color: C.mut, fontSize: 14 }}>{String(p.desc).slice(0, 160)}</div>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== FAQ ===== */}
        {(L.faq || []).length > 0 && (
          <Section eyebrow="Hỏi nhanh — đáp gọn">
            <div>
              {L.faq.map((f: any, i: number) => (
                <div key={i} style={{ borderTop: `1px solid ${C.line}`, padding: '14px 0' }}>
                  <div style={{ fontWeight: 800 }}>{f.q}</div>
                  <div style={{ color: C.mut, marginTop: 4, fontSize: 14.5 }}>{f.a}</div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ===== FORM ĐĂNG KÝ ===== */}
        <section id="dangky" style={{ background: 'linear-gradient(135deg,#1A2040,#241A3E)', border: '1px solid #2E355C', borderRadius: 22, padding: 28, marginTop: 40 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '22px 0' }}>
              <div style={{ fontSize: 46 }}>✅</div>
              <h3 style={{ fontSize: 23, fontWeight: 800, margin: '8px 0' }}>Đã nhận thông tin!</h3>
              <p style={{ color: C.mut, margin: 0 }}>Chuyên viên FBG Property sẽ liên hệ với bạn sớm nhất. Cảm ơn bạn đã quan tâm {projName}.</p>
            </div>
          ) : (
            <>
              <h3 style={{ fontSize: 23, fontWeight: 800, margin: '0 0 4px', textAlign: 'center' }}>{L.finalCta || `Nhận bảng giá & tư vấn ${projName}`}</h3>
              <p style={{ color: C.mut, textAlign: 'center', margin: '0 0 18px', fontSize: 14.5 }}>Để lại thông tin — chuyên viên gọi lại tư vấn miễn phí, gửi bảng hàng & chính sách mới nhất.</p>
              <form onSubmit={submit} style={{ display: 'grid', gap: 10, maxWidth: 460, margin: '0 auto' }}>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Họ và tên" style={inp} />
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Số điện thoại" inputMode="tel" style={inp} />
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Nhu cầu (tuỳ chọn): để ở / đầu tư, ngân sách…" rows={2} style={inp} />
                {err && <div style={{ color: '#FF9DB1', fontSize: 13, fontWeight: 600 }}>{err}</div>}
                <button type="submit" disabled={sending} style={{ background: grad, color: '#fff', fontWeight: 800, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 16 }}>
                  {sending ? 'Đang gửi…' : 'Gửi thông tin'}
                </button>
                <p style={{ fontSize: 11, color: C.faint, textAlign: 'center', margin: 0 }}>Thông tin của bạn được bảo mật, chỉ dùng để tư vấn dự án.</p>
              </form>
            </>
          )}
        </section>

        <footer style={{ textAlign: 'center', color: C.faint, fontSize: 12, marginTop: 36 }}>© FBG Property · {projName}{address ? ` · ${address}` : ''}</footer>
      </main>

      {/* CTA nổi (mobile) */}
      {!sent && (
        <a href="#dangky" style={{ position: 'fixed', right: 16, bottom: 16, background: grad, color: '#fff', fontWeight: 800, padding: '13px 22px', borderRadius: 999, textDecoration: 'none', fontSize: 14.5, boxShadow: '0 10px 30px rgba(226,75,208,.45)', zIndex: 50 }}>Nhận tư vấn ↓</a>
      )}
    </div>
  );
};

const inp: React.CSSProperties = { background: '#0F1428', border: '1px solid #2E355C', color: '#E8EAF6', borderRadius: 10, padding: '13px 15px', fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

export default LandingPublic;
