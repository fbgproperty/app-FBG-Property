import React, { useState } from 'react';
import { api } from '../services/apiService';

const fmtVnd = (n: any): string => {
  const x = Number(n);
  if (!x || Number.isNaN(x)) return '';
  if (x >= 1e9) return (x / 1e9).toFixed(2).replace(/\.?0+$/, '') + ' tỷ';
  if (x >= 1e6) return Math.round(x / 1e6) + ' triệu';
  return String(x);
};

const PortalCustomer: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const ph = phone.replace(/[^0-9]/g, '');
    if (ph.length < 8) { setErr('Vui lòng nhập đúng số điện thoại.'); return; }
    setBusy(true); setErr('');
    try {
      const r = await api.saasCustomerPortal(ph);
      if (r?.error) setErr(r.error); else setData(r);
    } catch { setErr('Không tra cứu được, thử lại.'); }
    setBusy(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b1020', color: '#e8eaf6', fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 18px 60px' }}>
        <section style={{ padding: '54px 0 26px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, letterSpacing: '.2em', textTransform: 'uppercase', color: '#e24bd0', fontWeight: 800 }}>FBG Property</div>
          <h1 style={{ fontSize: 'clamp(26px,6vw,38px)', fontWeight: 800, lineHeight: 1.1, margin: '12px 0 6px', letterSpacing: '-.02em' }}>Theo dõi căn hộ của bạn</h1>
          <p style={{ color: '#aab0d4', margin: 0 }}>Nhập số điện thoại đã đăng ký để xem các căn bạn quan tâm và chuyên viên đang hỗ trợ.</p>
        </section>

        <form onSubmit={lookup} style={{ display: 'flex', gap: 10, maxWidth: 420, margin: '0 auto 26px' }}>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Số điện thoại của bạn" inputMode="tel"
            style={{ flex: 1, background: '#0f1428', border: '1px solid #2e355c', color: '#e8eaf6', borderRadius: 12, padding: '13px 16px', fontSize: 15, outline: 'none' }} />
          <button type="submit" disabled={busy}
            style={{ background: 'linear-gradient(135deg,#7c83ff,#e24bd0)', color: '#fff', fontWeight: 800, padding: '13px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {busy ? 'Đang tra…' : 'Tra cứu'}
          </button>
        </form>
        {err && <p style={{ color: '#ff9db1', textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{err}</p>}

        {data && (
          <section style={{ display: 'grid', gap: 12 }}>
            {(data.items || []).length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8b91b8', background: '#151a30', borderRadius: 16, padding: 30 }}>
                Chưa tìm thấy đăng ký nào với số này.<br />Bạn có thể đăng ký quan tâm từ trang giới thiệu từng căn hộ.
              </div>
            ) : (data.items || []).map((it: any, i: number) => (
              <div key={i} style={{ background: '#151a30', border: '1px solid #262c48', borderRadius: 16, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17 }}>{it.project}{it.code ? ` · Căn ${it.code}` : ''}</div>
                    {it.unit && (
                      <div style={{ color: '#aab0d4', fontSize: 13.5, marginTop: 4 }}>
                        {[it.unit.area && `${it.unit.area} m²`, it.unit.type, it.unit.direction && `hướng ${it.unit.direction}`, it.unit.floor && `tầng ${it.unit.floor}`].filter(Boolean).join(' · ')}
                        {it.unit.price ? <> · <b style={{ color: '#e8eaf6' }}>{fmtVnd(it.unit.price)}</b></> : null}
                      </div>
                    )}
                  </div>
                  <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 800, color: '#3dd6a0', background: 'rgba(61,214,160,.12)', borderRadius: 999, padding: '4px 10px', whiteSpace: 'nowrap' }}>{it.status || 'Đang được tư vấn'}</span>
                </div>
                {it.saleName && (
                  <div style={{ marginTop: 10, fontSize: 13.5, color: '#aab0d4', borderTop: '1px solid #262c48', paddingTop: 10 }}>
                    Chuyên viên hỗ trợ: <b style={{ color: '#e8eaf6' }}>{it.saleName}</b> — sẽ chủ động liên hệ với bạn.
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        <footer style={{ textAlign: 'center', color: '#6b7099', fontSize: 12, marginTop: 40 }}>© FBG Property · Thông tin của bạn được bảo mật</footer>
      </div>
    </div>
  );
};

export default PortalCustomer;
