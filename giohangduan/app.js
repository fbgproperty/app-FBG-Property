/* ==========================================================================
   FBG Property — Giỏ hàng dự án
   Trang tĩnh độc lập (HTML + CSS + JS thuần), không phụ thuộc mã nguồn app.
   ========================================================================== */

/* Cấu hình — chỉnh tại đây khi triển khai. */
const CONFIG = {
  API_BASE: 'https://appapi.fbgproperty.vn',
  BRIDGE_KEY: 'fbgbridge_eb36304b60751d2b2532e394',
  HOTLINE: '', // ví dụ: '0909 123 456' — để trống thì ẩn nút gọi
  ZALO: '',    // số Zalo (vd '0909123456') hoặc link https://zalo.me/... — để trống thì ẩn
  EMAIL: 'info@fbgproperty.vn',
  PAGE_SIZE: 30,
  TIMEOUT_MS: 15000,
};

(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Tiện ích chung
   * ------------------------------------------------------------------ */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"'`]/g, (c) => ESC_MAP[c]);
  const ic = (name, cls) => `<svg class="ic${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;
  const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
  const str = (v) => (v == null || typeof v === 'object' ? '' : String(v).normalize('NFC').trim());
  const safeUrl = (u) => {
    const s = str(u);
    return /^https?:\/\/[^\s<>"'`]+$/i.test(s) ? s : '';
  };
  const fold = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();
  const normName = (s) => fold(s).trim().replace(/\s+/g, '-');
  const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });
  const reducedMotion = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const pad2 = (n) => String(n).padStart(2, '0');

  /* ------------------------------------------------------------------ *
   * Định dạng giá / diện tích (giống fmtVnd của app)
   * ------------------------------------------------------------------ */
  function fmtVnd(n) {
    const x = Number(n);
    if (!x || Number.isNaN(x)) return '—';
    if (x >= 1e9) return (x / 1e9).toFixed(2).replace(/\.?0+$/, '') + ' tỷ';
    if (x >= 1e6) return Math.round(x / 1e6) + ' tr';
    return String(x);
  }
  const trimNum = (x, d) => x.toFixed(d == null ? 2 : d).replace(/\.?0+$/, '');
  function fmtRange(a, b) {
    if (!(a > 0)) return '—';
    if (!(b > 0) || a === b) return fmtVnd(a);
    if (a >= 1e9 && b >= 1e9) return `${trimNum(a / 1e9)} – ${trimNum(b / 1e9)} tỷ`;
    return `${fmtVnd(a)} – ${fmtVnd(b)}`;
  }
  function toNum(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
    const s = str(v).replace(/\s+/g, '');
    if (!s) return NaN;
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ''));
    return NaN;
  }
  function toArea(v) {
    if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? v : NaN;
    let s = str(v).toLowerCase().replace(/m2|m²|\s/g, '');
    if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
    const n = parseFloat(s);
    return n > 0 ? n : NaN;
  }
  const priceText = (u) => (u._price > 0 ? fmtVnd(u._price) : (u._priceRaw || '—'));
  const areaText = (u) => (Number.isFinite(u._area) ? `${trimNum(u._area)} m²` : (u._areaRaw || '—'));
  function ppmText(u) {
    if (!(u._price > 0) || !(u._area > 0)) return '';
    const x = u._price / u._area / 1e6;
    return x >= 1 ? `${trimNum(x, 1)} tr/m²` : '';
  }
  function fmtTime(d) {
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}, ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
  }
  function fmtDate(s) {
    const t = str(s);
    const m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : t;
  }
  function hostOf(u) {
    try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }

  /* ------------------------------------------------------------------ *
   * Trạng thái căn (chuẩn hoá giống UNIT_STATUS_META của app)
   * ------------------------------------------------------------------ */
  const STATUS = {
    available: { label: 'Còn hàng', cls: 'st-ok', color: '#16a34a' },
    reserved: { label: 'Giữ chỗ', cls: 'st-hold', color: '#d97706' },
    sold: { label: 'Đã bán', cls: 'st-sold', color: '#dc2626' },
    locked: { label: 'Khoá', cls: 'st-lock', color: '#64748b' },
  };
  const ST_KEYS = ['available', 'reserved', 'sold', 'locked'];
  const ST_RANK = { available: 0, reserved: 1, sold: 2, locked: 3 };
  function normStatus(raw) {
    const s = String(raw || '').normalize('NFC').toLowerCase().trim();
    if (/(đã bán|da ban|sold|hết|het)/.test(s)) return 'sold';
    if (/(giữ chỗ|giu cho|đặt chỗ|dat cho|reserv|cọc|coc|hold)/.test(s)) return 'reserved';
    if (/(khoá|khóa|khoa|lock|ẩn)/.test(s)) return 'locked';
    return 'available';
  }
  const isExclusive = (raw) => /(độc quyền|doc quyen)/.test(String(raw || '').normalize('NFC').toLowerCase());
  function statusText(u) {
    let t = u._statusRaw;
    if (u._excl) t = t.replace(/[\s\-–—·,|/()]*(độc quyền|doc quyen)[\s\-–—·,|/()]*/gi, ' ').trim();
    return t || STATUS[u._st].label;
  }
  function statusBadges(u) {
    const text = statusText(u);
    return `<span class="badge ${STATUS[u._st].cls}" title="${esc(u._statusRaw || STATUS[u._st].label)}"><span class="dot" aria-hidden="true"></span><span class="bt">${esc(text)}</span></span>` +
      (u._excl ? `<span class="tag-excl">${ic('star')}Độc quyền</span>` : '');
  }
  const countStatus = (list) => {
    const c = { available: 0, reserved: 0, sold: 0, locked: 0 };
    list.forEach((u) => { c[u._st]++; });
    return c;
  };

  /* ------------------------------------------------------------------ *
   * Dự án tuyển chọn & tài liệu bán hàng (projects.js → window.FBG_PROJECTS)
   * ------------------------------------------------------------------ */
  const DOC_TYPES = {
    all: { icon: 'folder', emoji: '📂', label: 'Link tổng' },
    floorplan: { icon: 'map', emoji: '📐', label: 'Mặt bằng' },
    marketing: { icon: 'image', emoji: '🎬', label: 'Marketing' },
    legal: { icon: 'scale', emoji: '⚖️', label: 'Pháp lý' },
    qa: { icon: 'help', emoji: '❓', label: 'Q&A' },
    training: { icon: 'grad', emoji: '🎓', label: 'Đào tạo' },
    other: { icon: 'file', emoji: '📄', label: 'Tài liệu' },
  };
  function normCurated(src) {
    const out = [];
    const seen = new Set();
    (Array.isArray(src) ? src : []).forEach((c) => {
      if (!isObj(c)) return;
      const name = str(c.name);
      if (!name || seen.has(normName(name))) return;
      seen.add(normName(name));
      const arr = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : (str(v) ? [str(v)] : []));
      const docs = (Array.isArray(c.docs) ? c.docs : []).filter(isObj).map((d) => {
        const type = DOC_TYPES[str(d.type)] ? str(d.type) : 'other';
        return { type, label: str(d.label) || DOC_TYPES[type].label, desc: str(d.desc), url: safeUrl(d.url) };
      }).filter((d) => d.url);
      docs.sort((a, b) => (b.type === 'all') - (a.type === 'all'));
      out.push({
        id: str(c.id) || normName(name),
        name,
        aliases: arr(c.aliases),
        location: str(c.location),
        distributor: str(c.distributor),
        investor: str(c.investor),
        type: str(c.type),
        scale: str(c.scale),
        legal: str(c.legal),
        overview: str(c.overview),
        blocks: arr(c.blocks),
        hot: c.hot === true,
        notice: str(c.notice),
        slogan: str(c.slogan),
        docs,
      });
    });
    return out;
  }
  const CURATED = normCurated(window.FBG_PROJECTS);
  const curatedKeys = (c) => [c.name].concat(c.aliases).map(normName).filter(Boolean);

  function blockLabel(b) {
    const s = str(b);
    if (!s) return 'Chưa phân toà';
    if (/^(toà|tòa|toa|block|tháp|thap|khu|phân khu|lô|tower)\b/i.test(s)) return s;
    return s.length <= 5 && !/\s/.test(s) ? `Toà ${s}` : s;
  }

  const PRICE_BUCKETS = [
    { key: 'lt1', label: 'Dưới 1 tỷ', min: 0, max: 1e9 },
    { key: '1-2', label: '1 – 2 tỷ', min: 1e9, max: 2e9 },
    { key: '2-3', label: '2 – 3 tỷ', min: 2e9, max: 3e9 },
    { key: '3-5', label: '3 – 5 tỷ', min: 3e9, max: 5e9 },
    { key: '5-8', label: '5 – 8 tỷ', min: 5e9, max: 8e9 },
    { key: '8-12', label: '8 – 12 tỷ', min: 8e9, max: 12e9 },
    { key: '12-20', label: '12 – 20 tỷ', min: 12e9, max: 20e9 },
    { key: 'gt20', label: 'Trên 20 tỷ', min: 20e9, max: Infinity },
  ];
  const BUCKET = Object.fromEntries(PRICE_BUCKETS.map((b) => [b.key, b]));
  const inBucket = (p, b) => p > 0 && p >= b.min && p < b.max;

  const SORTS = [
    ['default', 'Còn hàng trước'],
    ['price-asc', 'Giá: thấp → cao'],
    ['price-desc', 'Giá: cao → thấp'],
    ['area-asc', 'Diện tích: nhỏ → lớn'],
    ['area-desc', 'Diện tích: lớn → nhỏ'],
    ['floor-desc', 'Tầng: cao → thấp'],
    ['floor-asc', 'Tầng: thấp → cao'],
    ['code-asc', 'Mã căn: A → Z'],
    ['code-desc', 'Mã căn: Z → A'],
  ];

  /* ------------------------------------------------------------------ *
   * Chuẩn bị dữ liệu căn
   * ------------------------------------------------------------------ */
  function floorNum(f) {
    const m = String(f || '').match(/-?\d+/);
    return m ? parseInt(m[0], 10) : NaN;
  }
  function stackKey(code, floor) {
    const groups = String(code || '').match(/\d+/g);
    if (!groups || !groups.length) return null;
    let last = groups[groups.length - 1];
    if (Number.isFinite(floor) && last.length >= 3) {
      const fs = String(floor);
      for (const p of [fs.padStart(2, '0'), fs]) {
        if (last.length > p.length && last.startsWith(p) && last.length - p.length <= 3) { last = last.slice(p.length); break; }
      }
    }
    return last.replace(/^0+(?=\d)/, '').padStart(2, '0');
  }
  function prepUnits(list) {
    const out = [];
    (Array.isArray(list) ? list : []).forEach((raw) => {
      if (!isObj(raw)) return;
      const i = out.length;
      const u = {
        code: str(raw.code) || `Căn ${i + 1}`,
        block: str(raw.block),
        floor: str(raw.floor),
        type: str(raw.type),
        direction: str(raw.direction),
        _statusRaw: str(raw.status),
        _priceRaw: str(raw.price),
        _areaRaw: str(raw.area),
        _i: i,
      };
      u._st = normStatus(u._statusRaw);
      u._excl = isExclusive(u._statusRaw);
      const p = toNum(raw.price);
      u._price = p > 0 ? p : NaN;
      u._area = toArea(raw.area);
      u._floor = floorNum(u.floor);
      u._floorKey = Number.isFinite(u._floor) ? 'n' + u._floor : 's' + fold(u.floor);
      u._floorLabel = Number.isFinite(u._floor) ? String(u._floor) : (u.floor || '—');
      u._stack = stackKey(u.code, u._floor);
      u._search = fold([u.code, u.block, u.block ? blockLabel(u.block) : '', u.type, u.direction, u._statusRaw, u.floor ? 'tang ' + u.floor : ''].join(' '));
      out.push(u);
    });
    return out;
  }
  function groupBy(list, fn) {
    const m = new Map();
    list.forEach((x) => { const k = fn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
    return m;
  }

  /* ------------------------------------------------------------------ *
   * Nguồn dữ liệu: API thật hoặc dữ liệu minh hoạ (?demo=1)
   * ------------------------------------------------------------------ */
  async function apiFetch(path, opts) {
    const o = opts || {};
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), o.timeout || CONFIG.TIMEOUT_MS);
    try {
      const headers = { 'X-Bridge-Key': CONFIG.BRIDGE_KEY };
      if (o.body) headers['Content-Type'] = 'application/json';
      const res = await fetch(CONFIG.API_BASE + path, {
        method: o.method || 'GET',
        headers,
        body: o.body ? JSON.stringify(o.body) : undefined,
        signal: ctrl ? ctrl.signal : undefined,
      });
      if (!res.ok) { const err = new Error('HTTP ' + res.status); err.status = res.status; throw err; }
      return await res.json();
    } catch (e) {
      if (e && e.name === 'AbortError') { const err = new Error('timeout'); err.code = 'timeout'; throw err; }
      throw e;
    } finally {
      clearTimeout(timer);
    }
  }
  function matchWebProject(items, name) {
    const t = normName(name);
    if (!t) return null;
    const list = (Array.isArray(items) ? items : []).filter(isObj);
    return list.find((it) => normName(it.name) === t) ||
      list.find((it) => normName(it.code) === t) ||
      list.find((it) => {
        const n = normName(it.name);
        return n.length >= 6 && t.length >= 6 && (n.includes(t) || t.includes(n)) &&
          Math.min(n.length, t.length) / Math.max(n.length, t.length) >= 0.6;
      }) || null;
  }

  const ApiSource = {
    summary: () => apiFetch('/inventory/summary'),
    units: (project) => apiFetch('/inventory?project=' + encodeURIComponent(project)),
    async enrich(project) {
      const r = await apiFetch(`/web/projects?page=1&pageSize=100&q=${encodeURIComponent(project)}`, { timeout: 9000 });
      const items = Array.isArray(r && r.items) ? r.items : (Array.isArray(r && r.data) ? r.data : []);
      const hit = matchWebProject(items, project);
      if (!hit || hit.id == null || hit.id === '') return null;
      const id = encodeURIComponent(String(hit.id));
      const [detail, content] = await Promise.all([
        apiFetch(`/web/projects/${id}`, { timeout: 9000 }).catch(() => null),
        apiFetch(`/web/project-content/${id}`, { timeout: 9000 }).catch(() => null),
      ]);
      return { hit, detail: isObj(detail) ? detail : null, content: isObj(content) ? content : null };
    },
    lead: (payload) => apiFetch('/lp/lead', { method: 'POST', body: payload, timeout: 20000 }),
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function buildDemo() {
    const R = mulberry32(20260926);
    const pickW = (pairs) => {
      let r = R() * pairs.reduce((s, p) => s + p[1], 0);
      for (const [v, w] of pairs) { if ((r -= w) < 0) return v; }
      return pairs[0][0];
    };
    const RAW = {
      available: [['Còn hàng', 6], ['Đang mở bán', 2], ['Còn hàng - Độc quyền', 2]],
      reserved: [['Giữ chỗ', 3], ['Đã cọc', 2], ['Đặt chỗ', 1]],
      sold: [['Đã bán', 4], ['Sold', 1]],
      locked: [['Khoá căn', 1]],
    };
    const defs = [
      {
        name: 'Aurora Riverside',
        blocks: ['A', 'B'], floors: [3, 17], ppm: 56e6,
        code: (b, f, s) => `${b}-${pad2(f)}.${s}`,
        stacks: [
          { type: '2PN', area: [68, 72], dir: 'Đông Nam', hot: true },
          { type: '3PN', area: [98, 104], dir: 'Đông Bắc', prem: 1.04 },
          { type: '1PN+1', area: [52, 56], dir: 'Tây Bắc' },
          { type: '2PN+1', area: [80, 84], dir: 'Tây Nam' },
        ],
        top: { type: 'Penthouse', area: [168, 182] },
        enrich: {
          hit: { id: 'demo-aurora', name: 'Aurora Riverside', location: 'Phường An Phú, TP. Thủ Đức' },
          detail: {
            name: 'Aurora Riverside', location: 'Phường An Phú, TP. Thủ Đức', province: 'TP. Hồ Chí Minh',
            projectType: 'Căn hộ ven sông', investor: 'Chủ đầu tư minh hoạ', imageUrl: '', priceRange: '3,0 – 11,6 tỷ', productCount: 120,
          },
          content: {
            overview: 'Aurora Riverside là khu căn hộ ven sông gồm 2 toà tháp 17 tầng, mật độ xây dựng thấp, hướng nhìn thoáng ra sông và công viên nội khu rộng 1,2 ha.\n\nDự án sở hữu chuỗi tiện ích khép kín: hồ bơi tràn bờ, gym, khu BBQ, vườn thiền, nhà trẻ và trung tâm thương mại tầng đế. Kết nối nhanh tới trung tâm thành phố qua tuyến đường ven sông và metro số 1. (Nội dung minh hoạ.)',
            salesPolicy: 'Ưu đãi tháng này:\n- Chiết khấu 3% khi thanh toán theo tiến độ chuẩn\n- Chiết khấu thêm 5% khi thanh toán sớm 70% giá trị căn hộ\n- Tặng gói nội thất cơ bản trị giá 150 triệu cho 20 khách hàng đầu tiên\n- Ngân hàng hỗ trợ vay đến 70%, ân hạn gốc và lãi 24 tháng\nPhương thức thanh toán:\n- Đặt cọc 50 triệu/căn, ký hợp đồng mua bán trong 15 ngày\n- Thanh toán 30% đến khi nhận nhà, 65% khi bàn giao, 5% khi nhận sổ hồng',
            progress: [
              { date: 'Q2/2025', title: 'Khởi công xây dựng', desc: 'Hoàn tất cọc nhồi và tường vây hai toà tháp.' },
              { date: 'Q1/2026', title: 'Hoàn thiện phần móng', desc: 'Thi công tầng hầm và khối đế thương mại.' },
              { date: 'Q3/2026', title: 'Mở bán đợt 1', desc: 'Ra mắt 120 căn thuộc toà A và toà B.' },
              { date: 'Q2/2027', title: 'Cất nóc', desc: 'Hoàn thiện kết cấu 17 tầng.' },
              { date: 'Q4/2027', title: 'Bàn giao dự kiến', desc: 'Bàn giao căn hộ hoàn thiện cơ bản.' },
            ],
            floorplans: [
              { name: 'Mặt bằng tầng điển hình toà A', image: '' },
              { name: 'Căn 2PN — 70 m²', image: '' },
              { name: 'Căn 3PN — 101 m²', image: '' },
              { name: 'Penthouse — 175 m²', image: '' },
            ],
            documents: { files: [
              { name: 'Bảng giá đợt 1 (PDF)', url: '' },
              { name: 'Chính sách bán hàng tháng 9/2026', url: '' },
              { name: 'Hồ sơ pháp lý dự án', url: '' },
            ] },
            news: [
              { title: 'Aurora Riverside ra mắt đợt 1 với 120 căn hộ ven sông', url: '', date: '2026-09-10' },
              { title: 'Cập nhật tiến độ xây dựng tháng 9/2026', url: '', date: '2026-09-20' },
            ],
          },
        },
      },
      {
        name: 'Sky Garden Residence',
        blocks: ['S1', 'S2', 'S3'], floors: [5, 16], ppm: 45e6, priceAsString: true, floorAsString: true, areaAsString: true,
        code: (b, f, s) => `${b}.${pad2(f)}${s}`,
        stacks: [
          { type: '1PN', area: [46, 50], dir: 'Đông' },
          { type: '2PN', area: [63, 68], dir: 'Nam', hot: true },
          { type: '3PN', area: [88, 95], dir: 'Tây', prem: 1.03 },
        ],
        enrich: {
          hit: { id: 'demo-sky', name: 'Sky Garden Residence', location: 'TP. Dĩ An' },
          detail: {
            name: 'Sky Garden Residence', location: 'TP. Dĩ An', province: 'Bình Dương',
            projectType: 'Căn hộ vườn trên cao', investor: 'Chủ đầu tư minh hoạ', imageUrl: '', productCount: 108,
          },
          content: {
            overview: 'Sky Garden Residence gồm 3 toà căn hộ với hệ vườn treo mỗi 4 tầng, phù hợp gia đình trẻ và nhà đầu tư cho thuê gần khu đại học. (Nội dung minh hoạ.)',
            salesPolicy: '- Thanh toán 15% ký hợp đồng, phần còn lại giãn đều 18 tháng\n- Hỗ trợ lãi suất 0% trong 12 tháng đầu\n- Cam kết thuê lại 6%/năm trong 2 năm cho căn 1PN',
          },
        },
      },
      {
        name: 'Lotus Park',
        blocks: ['L'], floors: [2, 13], ppm: 62e6, floorAsString: true,
        code: (b, f, s) => `${b}${pad2(f)}${s}`,
        stacks: [
          { type: 'Studio', area: [35, 38], dir: 'Bắc' },
          { type: '1PN', area: [48, 52], dir: 'Đông Bắc' },
          { type: '2PN', area: [70, 74], dir: 'Đông Nam', hot: true },
          { type: '2PN', area: [72, 76], dir: 'Tây Nam' },
          { type: '3PN', area: [96, 102], dir: 'Tây Bắc' },
        ],
        enrich: null,
      },
    ];
    return defs.map((def) => {
      const units = [];
      const [fMin, fMax] = def.floors;
      def.blocks.forEach((b, bi) => {
        for (let f = fMax; f >= fMin; f--) {
          def.stacks.forEach((st, si) => {
            const isTop = def.top && f === fMax && si < 2;
            const t = isTop ? def.top : st;
            const area = Math.round((t.area[0] + R() * (t.area[1] - t.area[0])) * 10) / 10;
            const lvl = (f - fMin) / (fMax - fMin);
            let price = area * def.ppm * (1 + (f - fMin) * 0.008) * (isTop ? 1.06 : (st.prem || 1)) * (0.97 + R() * 0.06);
            price = Math.round(price / 1e7) * 1e7;
            const soldP = 0.27 + (st.hot ? 0.15 : 0) + (lvl > 0.25 && lvl < 0.8 ? 0.08 : 0) - bi * 0.05;
            const r = R();
            const grp = r < soldP ? 'sold' : r < soldP + 0.13 ? 'reserved' : r < soldP + 0.17 ? 'locked' : 'available';
            let priceOut = def.priceAsString ? String(price) : price;
            if (isTop && si === 1 && bi === def.blocks.length - 1) priceOut = 'Liên hệ';
            units.push({
              code: def.code(b, f, pad2(si + 1)),
              block: b,
              floor: def.floorAsString ? String(f) : f,
              area: def.areaAsString ? String(area) : area,
              type: t.type,
              direction: st.dir,
              price: priceOut,
              status: pickW(RAW[grp]),
            });
          });
        }
      });
      return { name: def.name, units, enrich: def.enrich };
    });
  }
  const DemoSource = {
    _d: null,
    data() { return this._d || (this._d = buildDemo()); },
    async summary() {
      await wait(220);
      const d = this.data();
      return {
        items: d.map((p) => ({ key: normName(p.name), project: p.name, count: p.units.length })),
        totalUnits: d.reduce((s, p) => s + p.units.length, 0),
        totalProjects: d.length,
      };
    },
    async units(project) {
      await wait(200);
      const p = this.data().find((x) => x.name === project);
      return p ? { units: p.units.map((u) => Object.assign({}, u)), total: p.units.length } : { units: [], total: 0 };
    },
    async enrich(project) {
      await wait(260);
      const p = this.data().find((x) => normName(x.name) === normName(project));
      return p && p.enrich ? JSON.parse(JSON.stringify(p.enrich)) : null;
    },
    async lead() { await wait(700); return { ok: true }; },
  };

  /* ------------------------------------------------------------------ *
   * Trạng thái trang
   * ------------------------------------------------------------------ */
  const PAGE = CONFIG.PAGE_SIZE;
  // Hash hỏng (vd. link bị cắt khi chia sẻ qua Zalo/Facebook) không được làm treo trang.
  const safeDecode = (x) => { try { return decodeURIComponent(x); } catch (e) { return x; } };
  const params = new URLSearchParams(location.search);
  const state = {
    demo: params.get('demo') === '1',
    ref: str(params.get('ref')).slice(0, 160),
    wantProject: str(params.get('project') || params.get('du-an')),
    wantUnit: str(params.get('unit') || params.get('can')),
    projects: [],
    apiDown: false,
    project: '',
    units: [],
    summaryStatus: 'loading',
    summaryError: null,
    unitsStatus: 'idle',
    unitsError: null,
    updatedAt: null,
    f: { status: 'all', q: '', block: '', type: '', dir: '', price: '', sort: 'default' },
    view: 'list',
    shown: PAGE,
    options: null,
    optVer: 0,
    enrich: null,
    enrichCache: new Map(),
    mxModel: null,
    mxKey: '',
    openIdx: -1,
    loadSeq: 0,
    initialDone: false,
    lastSorted: [],
    lastFiltered: [],
  };
  const Source = state.demo ? DemoSource : ApiSource;
  const SECTION_IDS = ['tong-quan', 'tai-lieu', 'gio-hang', 'chinh-sach', 'tien-do', 'mat-bang', 'lien-he'];
  const ANCHORS = new Set(SECTION_IDS.concat(['bang-hang']));
  let userScrolled = false;

  /* ------------------------------------------------------------------ *
   * Lọc & sắp xếp
   * ------------------------------------------------------------------ */
  const termsOf = (q) => fold(q).split(/\s+/).filter(Boolean);
  function matchUnit(u, f, skip, terms) {
    if (skip !== 'status' && f.status !== 'all' && u._st !== f.status) return false;
    if (f.block && u.block !== f.block) return false;
    if (f.type && u.type !== f.type) return false;
    if (f.dir && u.direction !== f.dir) return false;
    if (f.price) { const b = BUCKET[f.price]; if (!b || !inBucket(u._price, b)) return false; }
    if (terms && terms.length) { for (const t of terms) { if (!u._search.includes(t)) return false; } }
    return true;
  }
  function currentFiltered() {
    const terms = termsOf(state.f.q);
    return state.units.filter((u) => matchUnit(u, state.f, null, terms));
  }
  function cmpNum(a, b, dir) {
    const an = Number.isFinite(a), bn = Number.isFinite(b);
    if (!an && !bn) return 0;
    if (!an) return 1;
    if (!bn) return -1;
    return dir * (a - b);
  }
  function sortUnits(list, key) {
    const [k, d] = String(key || 'default').split('-');
    const dir = d === 'desc' ? -1 : 1;
    const arr = list.slice();
    const byCode = (a, b) => collator.compare(a.code, b.code);
    switch (k) {
      case 'price': arr.sort((a, b) => cmpNum(a._price, b._price, dir) || byCode(a, b)); break;
      case 'area': arr.sort((a, b) => cmpNum(a._area, b._area, dir) || byCode(a, b)); break;
      case 'floor': arr.sort((a, b) => cmpNum(a._floor, b._floor, dir) || collator.compare(a.block, b.block) || byCode(a, b)); break;
      case 'code': arr.sort((a, b) => dir * byCode(a, b)); break;
      default:
        arr.sort((a, b) => ST_RANK[a._st] - ST_RANK[b._st] || collator.compare(a.block, b.block) || cmpNum(a._floor, b._floor, -1) || byCode(a, b));
    }
    return arr;
  }
  function buildOptions() {
    const u = state.units;
    const count = (fn) => {
      const m = new Map();
      u.forEach((x) => { const k = fn(x); if (k) m.set(k, (m.get(k) || 0) + 1); });
      return Array.from(m.entries()).sort((a, b) => collator.compare(a[0], b[0]));
    };
    state.options = {
      block: count((x) => x.block),
      type: count((x) => x.type),
      dir: count((x) => x.direction),
      price: PRICE_BUCKETS.map((b) => [b.key, u.filter((x) => inBucket(x._price, b)).length]).filter((e) => e[1] > 0),
    };
    state.optVer++;
  }
  function hasActiveFilters(includeStatus) {
    const f = state.f;
    return !!(f.q.trim() || f.block || f.type || f.dir || f.price || (includeStatus && f.status !== 'all'));
  }
  function resetFilters(keepSort) {
    const sort = state.f.sort;
    state.f = { status: 'all', q: '', block: '', type: '', dir: '', price: '', sort: keepSort ? sort : 'default' };
    const q = $('#q');
    if (q) q.value = '';
    state.shown = PAGE;
  }

  /* ------------------------------------------------------------------ *
   * Minh hoạ SVG (dùng khi không có ảnh)
   * ------------------------------------------------------------------ */
  function coverSvg() {
    return `<svg viewBox="0 0 480 300" preserveAspectRatio="xMidYMax meet" role="img" aria-label="Minh hoạ dự án">
      <defs>
        <linearGradient id="cvSky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef2ff"/><stop offset="1" stop-color="#fae8ff"/></linearGradient>
        <linearGradient id="cvA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6366f1"/><stop offset="1" stop-color="#4338ca"/></linearGradient>
        <linearGradient id="cvB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d946ef"/><stop offset="1" stop-color="#a21caf"/></linearGradient>
        <pattern id="cvW" width="16" height="18" patternUnits="userSpaceOnUse"><rect x="4" y="5" width="8" height="8" rx="1.5" fill="#fff" opacity=".32"/></pattern>
      </defs>
      <rect width="480" height="300" fill="url(#cvSky)"/>
      <circle cx="420" cy="56" r="28" fill="#fff" opacity=".85"/>
      <rect x="70" y="120" width="84" height="180" rx="8" fill="#a5b4fc"/>
      <rect x="70" y="120" width="84" height="180" rx="8" fill="url(#cvW)"/>
      <rect x="170" y="54" width="96" height="246" rx="8" fill="url(#cvA)"/>
      <rect x="170" y="54" width="96" height="246" rx="8" fill="url(#cvW)"/>
      <rect x="282" y="96" width="88" height="204" rx="8" fill="url(#cvB)"/>
      <rect x="282" y="96" width="88" height="204" rx="8" fill="url(#cvW)"/>
      <rect x="386" y="170" width="60" height="130" rx="8" fill="#c7d2fe"/>
      <rect x="0" y="272" width="480" height="28" fill="#e0e7ff"/>
      <path d="M0 286c60-10 120-10 180 0s120 10 180 0 90-8 120-4v18H0z" fill="#c7d2fe"/>
    </svg>`;
  }
  function planSvg(i) {
    const v = i % 3;
    const walls = [
      'M40 30h160v120H40z M120 30v62 M40 92h110 M150 92v58 M150 118h50 M84 92v58',
      'M40 30h160v120H40z M100 30v70 M100 100h100 M160 30v70 M40 70h60 M130 100v50',
      'M30 30h180v120H30z M90 30v120 M150 30v60 M150 90h60 M90 90h60 M150 120h60',
    ][v];
    const rooms = [
      '<rect x="43" y="33" width="74" height="56"/><rect x="153" y="95" width="44" height="20"/>',
      '<rect x="103" y="33" width="54" height="64"/><rect x="43" y="73" width="54" height="74"/>',
      '<rect x="33" y="33" width="54" height="114"/><rect x="153" y="93" width="54" height="24"/>',
    ][v];
    return `<svg viewBox="0 0 240 180" role="img" aria-label="Sơ đồ mặt bằng minh hoạ">
      <rect width="240" height="180" fill="#f8fafc"/>
      <g fill="#eef2ff">${rooms}</g>
      <path d="${walls}" fill="none" stroke="#818cf8" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M120 150a16 16 0 0 1 16-16" fill="none" stroke="#e879f9" stroke-width="2"/>
      <text x="120" y="172" text-anchor="middle" font-size="9" font-family="Inter,system-ui,sans-serif" font-weight="700" fill="#94a3b8" letter-spacing="1">MINH HOẠ</text>
    </svg>`;
  }

  /* ------------------------------------------------------------------ *
   * Render: header, hero, tổng quan
   * ------------------------------------------------------------------ */
  function renderHeader() {
    const btn = $('#projBtn');
    const name = $('#projName');
    const cnt = $('#projCount');
    const hot = $('#projHot');
    hot.hidden = true;
    if (state.summaryStatus === 'loading') { name.textContent = 'Đang tải…'; btn.disabled = true; cnt.hidden = true; return; }
    if (state.summaryStatus === 'error' || !state.projects.length) { name.textContent = 'Chưa có dữ liệu'; btn.disabled = true; cnt.hidden = true; return; }
    name.textContent = state.project;
    btn.disabled = false;
    btn.setAttribute('aria-label', `Dự án: ${state.project}. Đổi dự án (${state.projects.length} dự án)`);
    const p = curProj();
    const n = state.unitsStatus === 'ready' ? state.units.length : (p ? p.count : 0);
    cnt.hidden = !n;
    cnt.textContent = n ? `${n} căn` : '';
    hot.hidden = !(p && p.hot);
    document.title = `${state.project} · Giỏ hàng dự án — FBG Property`;
  }

  function enrichInfo() {
    // Dữ liệu từ hệ thống ưu tiên; thiếu trường nào thì lấy từ projects.js (thông tin FBG tự khai báo).
    const api = apiEnrichInfo();
    const cur = curCurated();
    if (!cur) return api;
    return {
      location: api.location || cur.location,
      type: api.type || cur.type,
      investor: api.investor || cur.investor,
      priceRange: api.priceRange || '',
      productCount: api.productCount || 0,
      scale: cur.scale,
      legal: cur.legal,
      image: api.image || '',
      overview: api.overview || cur.overview,
    };
  }
  function apiEnrichInfo() {
    const e = state.enrich;
    if (!e) return { location: '', type: '', investor: '', priceRange: '', productCount: 0, image: '', overview: '' };
    const d = e.detail || {}, h = e.hit || {}, c = e.content || {};
    let location = str(d.location || h.location);
    const prov = str(d.province);
    if (prov && !fold(location).includes(fold(prov))) location = location ? `${location}, ${prov}` : prov;
    const pc = toNum(d.productCount);
    return {
      location,
      type: str(d.projectType),
      investor: str(d.investor),
      priceRange: str(d.priceRange),
      productCount: pc > 0 ? pc : 0,
      image: safeUrl(d.imageUrl),
      overview: htmlToText(c.overview || d.description || h.description || ''),
    };
  }

  function computeKpis(units) {
    const c = countStatus(units);
    const total = units.length;
    const priced = units.filter((u) => u._price > 0);
    const availPriced = priced.filter((u) => u._st === 'available');
    const base = availPriced.length ? availPriced : priced;
    let min = Infinity, max = -Infinity;
    base.forEach((u) => { if (u._price < min) min = u._price; if (u._price > max) max = u._price; });
    let sumP = 0, sumA = 0;
    priced.forEach((u) => { if (u._area > 0) { sumP += u._price; sumA += u._area; } });
    const blocks = new Set(units.map((u) => u.block).filter(Boolean)).size;
    const floors = new Set(units.filter((u) => Number.isFinite(u._floor)).map((u) => u._floor)).size;
    return {
      total, c, blocks, floors,
      min: base.length ? min : NaN,
      max: base.length ? max : NaN,
      priceScope: availPriced.length ? 'available' : 'all',
      ppm: sumA > 0 ? sumP / sumA / 1e6 : NaN,
    };
  }

  function heroSkeleton(name) {
    const tiles = Array.from({ length: 6 }, () =>
      '<div class="kpi"><span class="sk" style="width:62%;height:10px"></span><span class="sk" style="width:48%;height:24px;margin:9px 0 7px"></span><span class="sk" style="width:74%;height:10px"></span></div>').join('');
    return `<div class="hero" aria-busy="true">
      <div class="hero-grid-bg"></div>
      <div class="hero-top"><div class="hero-main">
        <span class="sk" style="width:200px;height:28px;border-radius:99px"></span>
        <h1 class="hero-title" id="heroTitle">${name ? esc(name) : '<span class="sr-only">Đang tải dự án</span><span class="sk" style="width:min(420px,80vw);height:40px;margin-top:4px"></span>'}</h1>
        <span class="sk" style="width:min(360px,70vw);height:16px;margin-top:14px"></span>
      </div></div>
      <div class="kpis">${tiles}</div>
    </div>`;
  }

  function kpiTile(o) {
    const tag = o.action ? 'button' : 'div';
    const attrs = o.action ? ` type="button" data-action="${o.action}" data-v="${esc(o.v)}" aria-label="${esc(o.aria)}"` : '';
    return `<${tag} class="kpi${o.cls ? ' ' + o.cls : ''}"${attrs}>
      <span class="kpi-label">${o.dot ? `<span class="kpi-dot" style="background:${o.dot}"></span>` : ''}${o.icon ? ic(o.icon) : ''}${esc(o.label)}</span>
      <span class="kpi-value">${o.valueHtml}</span>
      ${o.bar != null ? `<span class="kpi-bar" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, o.bar))}%"></span></span>` : ''}
      ${o.sub ? `<span class="kpi-sub">${esc(o.sub)}</span>` : ''}
    </${tag}>`;
  }

  /* Căn đang mở bán: căn còn hàng giá tốt nhất theo từng loại căn */
  function featuredUnits() {
    const avail = state.units.filter((u) => u._st === 'available');
    const best = new Map();
    avail.forEach((u) => {
      const k = u.type || '—';
      const cur = best.get(k);
      if (!cur || (u._price > 0 && !(cur._price > 0)) || (u._price > 0 && u._price < cur._price)) best.set(k, u);
    });
    const byPrice = (a, b) => cmpNum(a._price, b._price, 1) || collator.compare(a.code, b.code);
    let picks = Array.from(best.values()).sort(byPrice);
    if (picks.length < 3) picks = picks.concat(avail.filter((u) => !picks.includes(u)).sort(byPrice).slice(0, 3 - picks.length));
    return { list: picks.slice(0, 4), avail: avail.length };
  }
  function featCard() {
    const fu = featuredUnits();
    const items = fu.list.map((u) => `<li><button type="button" class="feat-item" data-action="open-unit" data-idx="${u._i}" aria-label="${esc(`Xem căn ${u.code}${u.type ? ', ' + u.type : ''}, ${areaText(u)}, giá ${priceText(u)}`)}">
        <span class="feat-ico">${ic(u._excl ? 'star' : 'home')}</span>
        <span class="feat-txt"><b>${esc(u.code)}</b><small>${esc([u.type, areaText(u) !== '—' ? areaText(u) : '', u.direction ? 'Hướng ' + u.direction : ''].filter(Boolean).join(' · '))}</small></span>
        <span class="feat-price">${esc(priceText(u))}</span>
      </button></li>`).join('');
    return `<aside class="feat" aria-labelledby="featTitle">
      <div class="feat-head">
        <div><h2 class="feat-title" id="featTitle">Căn đang mở bán</h2><p>Giá tốt nhất theo từng loại căn</p></div>
        <span class="feat-badge"><span class="dot" aria-hidden="true"></span>${fu.avail} căn trống</span>
      </div>
      ${items ? `<ul class="feat-list">${items}</ul>` : '<p class="feat-empty">Hiện tất cả các căn đã có chủ. Để lại thông tin để được ưu tiên khi có căn mở bán thêm.</p>'}
      ${fu.avail ? `<button type="button" class="feat-all" data-action="kpi-status" data-v="available">Xem tất cả căn còn hàng${ic('arrow-right')}</button>` : `<a class="feat-all" href="#lien-he">Đăng ký nhận căn mới${ic('arrow-right')}</a>`}
    </aside>`;
  }

  function heroMeta(en, cur, withBlocks) {
    const meta = [];
    const loc = en.location || (cur && cur.location);
    if (loc) meta.push(`<span>${ic('pin')}${esc(loc)}</span>`);
    if (en.type) meta.push(`<span>${ic('building')}${esc(en.type)}</span>`);
    if (en.investor) meta.push(`<span>${ic('shield')}Chủ đầu tư: ${esc(en.investor)}</span>`);
    if (cur && cur.distributor) meta.push(`<span>${ic('handshake')}Phân phối: ${esc(cur.distributor)}</span>`);
    if (withBlocks && cur && cur.blocks.length) meta.push(`<span>${ic('layers')}${esc(cur.blocks.map(blockLabel).join(', '))}</span>`);
    return meta;
  }

  /* Hero cho dự án tuyển chọn chưa có bảng hàng: chỉ hiển thị thông tin đã biết, không bịa số liệu. */
  function curatedHero(cur, en) {
    const s = state;
    const meta = heroMeta(en, cur, false);
    const facts = [];
    const loc = en.location || cur.location;
    if (loc) facts.push(kpiTile({ label: 'Vị trí', icon: 'pin', valueHtml: esc(loc), cls: 'kpi-fact' }));
    if (cur.distributor) facts.push(kpiTile({ label: 'Đơn vị phân phối', icon: 'handshake', valueHtml: esc(cur.distributor), cls: 'kpi-fact' }));
    if (cur.blocks.length) facts.push(kpiTile({ label: cur.blocks.length > 1 ? 'Các toà' : 'Toà', icon: 'building', valueHtml: esc(cur.blocks.join(', ')), cls: 'kpi-fact' }));
    if (cur.docs.length) facts.push(kpiTile({ label: 'Tài liệu bán hàng', icon: 'folder', valueHtml: `${cur.docs.length} <small>thư mục</small>`, cls: 'kpi-fact' }));
    facts.push(kpiTile({ label: 'Giỏ hàng', icon: 'clock', valueHtml: s.apiDown ? 'Chưa kết nối' : 'Đang cập nhật', cls: 'kpi-fact' }));
    const eyebrow = (cur.hot ? '<span class="hot-chip">🔥 Hot</span>' : '') +
      (s.apiDown ? '<span class="live-dot off"></span><span class="eb-txt">Chưa kết nối được giỏ hàng</span>' : '<span class="live-dot"></span><span class="eb-txt">Tài liệu bán hàng đã sẵn sàng</span>');
    return `<div class="hero">
      <div class="hero-grid-bg"></div>
      <div class="hero-top">
        <div class="hero-main">
          <p class="hero-eyebrow">${eyebrow}</p>
          <h1 class="hero-title" id="heroTitle">${esc(s.project)}</h1>
          ${meta.length ? `<p class="hero-meta">${meta.join('')}</p>` : ''}
          <div class="hero-actions">
            ${cur.docs.length ? `<a class="btn btn-white" href="#tai-lieu">${ic('folder')}Xem tài liệu bán hàng</a>` : ''}
            <a class="btn btn-glass" href="#lien-he">${ic('send')}Nhận bảng hàng khi mở bán</a>
          </div>
        </div>
      </div>
      <div class="kpis kpis-facts">${facts.join('')}</div>
    </div>`;
  }

  function renderHero() {
    const m = $('#heroMount');
    const s = state;
    if (s.summaryStatus === 'error' || (s.summaryStatus === 'ready' && !s.projects.length)) { m.innerHTML = ''; return; }
    if (s.summaryStatus === 'loading' || s.unitsStatus === 'loading' || s.unitsStatus === 'idle') { m.innerHTML = heroSkeleton(s.project); return; }

    const en = enrichInfo();
    const cur = curCurated();
    if (cur && (s.unitsStatus === 'none' || s.unitsStatus === 'error' || (s.unitsStatus === 'ready' && !s.units.length))) {
      m.innerHTML = curatedHero(cur, en);
      return;
    }
    const meta = heroMeta(en, cur, false);
    if (!meta.length) meta.push(`<span>${ic('sparkles')}Giỏ hàng cập nhật trực tiếp từ hệ thống FBG Property</span>`);
    const hot = cur && cur.hot ? '<span class="hot-chip">🔥 Hot</span>' : '';

    let eyebrow, tiles, priceLine = '', side = '';
    if (s.unitsStatus === 'error' || s.unitsStatus === 'none') {
      eyebrow = '<span class="live-dot off"></span><span class="eb-txt">Chưa tải được giỏ hàng</span>';
      tiles = ['Tổng số căn', 'Còn hàng', 'Giữ chỗ', 'Đã bán', 'Đơn giá TB', 'Tỷ lệ đã bán']
        .map((l) => kpiTile({ label: l, valueHtml: '—', sub: 'Chưa có dữ liệu' })).join('');
    } else {
      const k = computeKpis(s.units);
      const upd = s.updatedAt ? ` · Cập nhật ${fmtTime(s.updatedAt)}` : '';
      eyebrow = k.c.available > 0
        ? `<span class="live-dot"></span><span class="eb-txt">Đang mở bán${upd}</span>`
        : `<span class="live-dot off"></span><span class="eb-txt">${k.total ? 'Tạm hết căn còn hàng' : 'Chưa có căn'}${upd}</span>`;
      const scope = [];
      if (k.blocks) scope.push(`${k.blocks} toà`);
      if (k.floors) scope.push(`${k.floors} tầng`);
      const soldPct = pct(k.c.sold, k.total);
      if (k.min > 0) {
        const one = !(k.max > k.min);
        priceLine = `<div class="hero-price">
          <p class="hero-price-lbl">${k.priceScope === 'available' ? 'Khoảng giá căn còn hàng' : 'Khoảng giá bán'}</p>
          <p class="hero-price-val">${esc(fmtVnd(k.min))}${one ? '' : `<span class="sep" aria-hidden="true">–</span><span class="sr-only"> đến </span>${esc(fmtVnd(k.max))}`}</p>
        </div>`;
      } else if (en.priceRange) {
        priceLine = `<div class="hero-price"><p class="hero-price-lbl">Khoảng giá bán</p><p class="hero-price-val">${esc(en.priceRange)}</p></div>`;
      }
      const ppmTile = Number.isFinite(k.ppm)
        ? kpiTile({ label: 'Đơn giá TB', valueHtml: `${esc(trimNum(k.ppm, 1))} <small>tr/m²</small>`, sub: k.min > 0 ? `Giá từ ${fmtVnd(k.min)}` : 'Theo giá niêm yết' })
        : kpiTile({ label: 'Giá từ', valueHtml: k.min > 0 ? esc(fmtVnd(k.min)).replace(/ (tỷ|tr)$/, ' <small>$1</small>') : '—', sub: k.max > 0 ? `Cao nhất ${fmtVnd(k.max)}` : 'Liên hệ để nhận giá' });
      tiles = [
        kpiTile({ label: 'Tổng số căn', valueHtml: String(k.total), sub: scope.join(' · ') || 'Toàn dự án' }),
        kpiTile({ label: 'Còn hàng', dot: STATUS.available.color, valueHtml: String(k.c.available), sub: `${pct(k.c.available, k.total)}% quỹ căn`, action: 'kpi-status', v: 'available', aria: `Còn hàng: ${k.c.available} căn. Xem danh sách căn còn hàng` }),
        kpiTile({ label: 'Giữ chỗ', dot: STATUS.reserved.color, valueHtml: String(k.c.reserved), sub: `${pct(k.c.reserved, k.total)}% quỹ căn`, action: 'kpi-status', v: 'reserved', aria: `Giữ chỗ: ${k.c.reserved} căn. Xem danh sách căn giữ chỗ` }),
        kpiTile({ label: 'Đã bán', dot: STATUS.sold.color, valueHtml: String(k.c.sold), sub: `${soldPct}% quỹ căn${k.c.locked ? ` · khoá ${k.c.locked}` : ''}`, action: 'kpi-status', v: 'sold', aria: `Đã bán: ${k.c.sold} căn. Xem danh sách căn đã bán` }),
        ppmTile,
        kpiTile({ label: 'Tỷ lệ đã bán', valueHtml: `${soldPct}%`, bar: soldPct, sub: `${k.c.sold}/${k.total} căn đã bán` }),
      ].join('');
      if (s.units.length) side = featCard();
    }

    m.innerHTML = `<div class="hero">
      <div class="hero-grid-bg"></div>
      <div class="hero-top${side ? ' has-side' : ''}">
        <div class="hero-main">
          <p class="hero-eyebrow">${hot}${eyebrow}</p>
          <h1 class="hero-title" id="heroTitle">${esc(s.project)}</h1>
          <p class="hero-meta">${meta.join('')}</p>
          ${priceLine}
          <div class="hero-actions">
            <a class="btn btn-white" href="#gio-hang">${ic('layers')}Xem giỏ hàng</a>
            ${cur && cur.docs.length ? `<a class="btn btn-glass" href="#tai-lieu">${ic('folder')}Tài liệu bán hàng</a>` : `<a class="btn btn-glass" href="#lien-he">${ic('send')}Nhận báo giá</a>`}
          </div>
        </div>
        ${side}
      </div>
      <div class="kpis">${tiles}</div>
    </div>`;
  }

  function blocksCard() {
    const groups = groupBy(state.units, (u) => u.block);
    const keys = Array.from(groups.keys()).sort((a, b) => (!a) - (!b) || collator.compare(a, b));
    const multi = keys.length > 1;
    const rows = keys.slice(0, 8).map((k) => {
      const list = groups.get(k);
      const c = countStatus(list);
      const n = list.length;
      const segs = ST_KEYS.filter((s) => c[s] > 0)
        .map((s) => `<span class="${STATUS[s].cls}" style="width:${((c[s] / n) * 100).toFixed(2)}%"></span>`).join('');
      const label = k ? blockLabel(k) : (multi ? 'Chưa phân toà' : 'Toàn dự án');
      const attrs = k && multi ? `data-action="filter-block" data-v="${esc(k)}"` : 'data-action="goto" data-v="gio-hang"';
      const aria = `${label}: ${n} căn, còn hàng ${c.available}, giữ chỗ ${c.reserved}, đã bán ${c.sold}${c.locked ? `, khoá ${c.locked}` : ''}. Xem trong giỏ hàng`;
      return `<li><button type="button" class="dist-row" ${attrs} aria-label="${esc(aria)}">
        <span class="dist-top"><span class="dist-name">${esc(label)}</span><span class="dist-meta">${n} căn · còn <b>${c.available}</b></span></span>
        <span class="stack-bar" aria-hidden="true">${segs}</span>
      </button></li>`;
    }).join('');
    const all = countStatus(state.units);
    const legend = ST_KEYS.filter((s) => s !== 'locked' || all.locked > 0)
      .map((s) => `<span class="legend-item ${STATUS[s].cls}"><span class="swatch" aria-hidden="true"></span>${STATUS[s].label} <b>${all[s]}</b></span>`).join('');
    return `<article class="card ov-card">
      <div class="ov-head"><h3 class="h3">${multi ? 'Phân bổ theo toà' : 'Tình trạng quỹ căn'}</h3><span class="hint">Nhấn để lọc</span></div>
      <ul class="dist">${rows}</ul>
      ${keys.length > 8 ? `<p class="more-note">và ${keys.length - 8} toà khác trong giỏ hàng</p>` : ''}
      <div class="legend">${legend}</div>
    </article>`;
  }

  function typesCard() {
    const groups = groupBy(state.units, (u) => u.type);
    const keys = Array.from(groups.keys()).filter(Boolean).sort(collator.compare);
    if (!keys.length) return '';
    const rows = keys.slice(0, 8).map((k) => {
      const list = groups.get(k);
      const areas = list.map((u) => u._area).filter(Number.isFinite);
      const aMin = Math.min(...areas), aMax = Math.max(...areas);
      const areaTxt = areas.length ? (Math.round(aMin) === Math.round(aMax) ? `${Math.round(aMin)} m²` : `${Math.round(aMin)}–${Math.round(aMax)} m²`) : 'Diện tích: —';
      const avail = list.filter((u) => u._st === 'available');
      const pBase = (avail.some((u) => u._price > 0) ? avail : list).map((u) => u._price).filter((p) => p > 0);
      const from = pBase.length ? fmtVnd(Math.min(...pBase)) : '';
      return `<li><button type="button" class="type-row" data-action="filter-type" data-v="${esc(k)}" aria-label="${esc(`${k}: ${list.length} căn, còn ${avail.length}${from ? `, giá từ ${from}` : ''}. Lọc loại căn này`)}">
        <span class="type-name"><span class="type-ico">${ic('home')}</span><span>${esc(k)}</span></span>
        <span class="type-mid"><span class="type-area">${esc(areaTxt)}</span>${from ? `<span class="type-price">từ <b>${esc(from)}</b></span>` : ''}</span>
        <span class="type-avail"><b>${avail.length}</b>/${list.length} còn</span>
      </button></li>`;
    }).join('');
    return `<article class="card ov-card">
      <div class="ov-head"><h3 class="h3">Cơ cấu loại căn</h3><span class="hint">Nhấn để lọc</span></div>
      <ul class="types">${rows}</ul>
      ${keys.length > 8 ? `<p class="more-note">và ${keys.length - 8} loại căn khác</p>` : ''}
    </article>`;
  }

  function introCard(en) {
    const facts = [
      ['Chủ đầu tư', en.investor],
      ['Loại hình', en.type],
      ['Vị trí', en.location],
      ['Khoảng giá', en.priceRange],
      ['Quy mô', en.productCount ? `${en.productCount} căn` : (en.scale || '')],
      ['Pháp lý', en.legal],
    ].filter((f) => f[1]);
    const long = en.overview.length > 360;
    const media = en.image
      ? `<img src="${esc(en.image)}" alt="${esc('Hình ảnh dự án ' + state.project)}" loading="lazy" referrerpolicy="no-referrer" data-fallback="cover">`
      : coverSvg();
    return `<article class="card ov-card span-all"><div class="intro">
      <div class="intro-media">${media}</div>
      <div>
        <div class="ov-head"><h3 class="h3">Giới thiệu dự án</h3></div>
        ${en.overview ? `<p class="intro-text${long ? ' is-clamped' : ''}" id="introText">${esc(en.overview)}</p>` : ''}
        ${long ? '<button type="button" class="btn-link" data-action="toggle-intro" aria-expanded="false" aria-controls="introText">Xem thêm</button>' : ''}
        ${facts.length ? `<dl class="facts">${facts.map((f) => `<div class="fact"><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl>` : ''}
      </div>
    </div></article>`;
  }

  function renderOverview() {
    const m = $('#overviewMount');
    const s = state;
    if (s.summaryStatus !== 'ready' || !s.projects.length || s.unitsStatus === 'error' || s.unitsStatus === 'none') {
      const en = enrichInfo();
      // Dự án chưa có bảng hàng: vẫn giới thiệu dự án nếu có dữ liệu thật từ hệ thống.
      m.innerHTML = s.summaryStatus === 'ready' && (en.overview || en.image || en.investor) ? introCard(en) : '';
      return;
    }
    if (s.unitsStatus !== 'ready') {
      m.innerHTML = [0, 1].map(() => `<div class="card ov-card" aria-hidden="true"><span class="sk" style="width:40%;height:16px"></span>${
        [0, 1, 2].map(() => '<span class="sk" style="height:12px;margin-top:22px"></span><span class="sk" style="height:10px;margin-top:10px;width:80%"></span>').join('')}</div>`).join('');
      return;
    }
    if (!s.units.length) { m.innerHTML = ''; return; }
    const en = enrichInfo();
    let html = '';
    if (en.overview || en.investor || en.image || en.type) html += introCard(en);
    const types = typesCard();
    html += blocksCard().replace('class="card ov-card"', types ? 'class="card ov-card"' : 'class="card ov-card span-all"') + types;
    m.innerHTML = html;
    $$('img[data-fallback="cover"]', m).forEach((img) => {
      img.addEventListener('error', () => { const wrap = img.parentNode; if (wrap) wrap.innerHTML = coverSvg(); }, { once: true });
    });
  }

  /* ------------------------------------------------------------------ *
   * Render: giỏ hàng (danh sách + bảng hàng)
   * ------------------------------------------------------------------ */
  function stateBox(o) {
    return `<div class="state">
      <span class="state-ico${o.error ? ' is-error' : ''}">${ic(o.icon)}</span>
      <h3>${esc(o.title)}</h3>
      <p>${esc(o.text)}</p>
      ${o.code ? `<p class="state-code">${esc(o.code)}</p>` : ''}
      ${o.actions && o.actions.length ? `<div class="state-actions">${o.actions.join('')}</div>` : ''}
    </div>`;
  }
  function errText(e) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 'Thiết bị đang ngoại tuyến.';
    if (e && e.code === 'timeout') return 'Máy chủ phản hồi quá lâu (quá thời gian chờ).';
    if (e && e.status) return `Máy chủ trả về mã lỗi ${e.status}.`;
    return 'Không kết nối được tới máy chủ dữ liệu.';
  }

  function renderChips() {
    const el = $('#statusChips');
    if (state.unitsStatus !== 'ready' || !state.units.length) {
      el.innerHTML = state.unitsStatus === 'loading'
        ? [90, 110, 96, 88].map((w) => `<span class="sk" style="width:${w}px;height:38px;border-radius:99px;flex:none"></span>`).join('')
        : '';
      return;
    }
    const terms = termsOf(state.f.q);
    const base = state.units.filter((u) => matchUnit(u, state.f, 'status', terms));
    const c = countStatus(base);
    const anyLocked = state.units.some((u) => u._st === 'locked');
    const chips = [['all', 'Tất cả', base.length]].concat(
      ST_KEYS.filter((k) => k !== 'locked' || anyLocked).map((k) => [k, STATUS[k].label, c[k]]));
    el.innerHTML = chips.map(([k, label, n]) => {
      const on = state.f.status === k;
      return `<button type="button" class="chip${k !== 'all' ? ' ' + STATUS[k].cls : ''}${on ? ' is-active' : ''}" data-action="status" data-v="${k}" aria-pressed="${on}">${k !== 'all' ? '<span class="dot" aria-hidden="true"></span>' : ''}${label}<span class="n">${n}</span></button>`;
    }).join('');
  }

  function fillSelect(el, allLabel, entries, labelFn, value) {
    if (el.dataset.ver !== String(state.optVer)) {
      el.innerHTML = `<option value="">${esc(allLabel)}</option>` +
        entries.map(([k, n]) => `<option value="${esc(k)}">${esc(labelFn(k))} (${n})</option>`).join('');
      el.dataset.ver = String(state.optVer);
    }
    el.value = value;
    if (el.value !== value) el.value = '';
    el.hidden = entries.length < 2 && !value;
    el.disabled = false;
    el.classList.toggle('is-set', !!value);
  }
  function renderSelects() {
    const ids = ['fBlock', 'fType', 'fDir', 'fPrice', 'fSort'];
    const ready = state.unitsStatus === 'ready' && state.units.length && state.options;
    const q = $('#q');
    q.disabled = !ready;
    if (!ready) {
      ids.forEach((id) => { const el = $('#' + id); el.disabled = true; el.hidden = id !== 'fSort' && id !== 'fBlock'; });
      if (!$('#fSort').options.length) $('#fSort').innerHTML = SORTS.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('');
      if (!$('#fBlock').options.length) $('#fBlock').innerHTML = '<option value="">Tất cả toà</option>';
      $('#filterN').hidden = true;
      return;
    }
    const o = state.options, f = state.f;
    fillSelect($('#fBlock'), 'Tất cả toà', o.block, blockLabel, f.block);
    fillSelect($('#fType'), 'Mọi loại căn', o.type, (x) => x, f.type);
    fillSelect($('#fDir'), 'Mọi hướng', o.dir, (x) => `Hướng ${x}`, f.dir);
    fillSelect($('#fPrice'), 'Mọi mức giá', o.price, (k) => BUCKET[k].label, f.price);
    const sort = $('#fSort');
    if (sort.options.length !== SORTS.length) sort.innerHTML = SORTS.map(([k, l]) => `<option value="${k}">${esc(l)}</option>`).join('');
    sort.value = f.sort;
    sort.disabled = false;
    sort.hidden = state.view === 'matrix';
    sort.classList.toggle('is-set', f.sort !== 'default');
    const n = ['block', 'type', 'dir', 'price'].filter((k) => f[k]).length;
    const badge = $('#filterN');
    badge.hidden = !n;
    badge.textContent = n ? String(n) : '';
    $('.search-clear').hidden = !q.value;
  }

  function renderResultBar(filtered) {
    const bar = $('#resultBar');
    const s = state, f = s.f;
    const chips = [];
    if (f.q.trim()) chips.push(['q', `Tìm: “${f.q.trim()}”`]);
    if (f.block) chips.push(['block', blockLabel(f.block)]);
    if (f.type) chips.push(['type', f.type]);
    if (f.dir) chips.push(['dir', `Hướng ${f.dir}`]);
    if (f.price && BUCKET[f.price]) chips.push(['price', BUCKET[f.price].label]);
    let txt;
    if (s.view === 'matrix') {
      const scope = f.block ? s.units.filter((u) => u.block === f.block).length : s.units.length;
      txt = hasActiveFilters(true)
        ? `<span><b>${filtered.length}</b> / ${scope} căn khớp bộ lọc · căn khác được làm mờ</span>`
        : `<span>Toàn bộ <b>${scope}</b> căn theo toà và tầng</span>`;
    } else {
      const shown = Math.min(filtered.length, s.shown);
      txt = `<span>Hiển thị <b>${shown}</b> / ${filtered.length} căn${filtered.length !== s.units.length ? ` <span class="muted">(lọc từ ${s.units.length})</span>` : ''}</span>`;
    }
    const chipHtml = chips.map(([k, l]) =>
      `<button type="button" class="fchip" data-action="rm-filter" data-k="${k}" aria-label="${esc('Bỏ lọc ' + l)}"><span>${esc(l)}</span>${ic('x')}</button>`).join('');
    bar.innerHTML = txt + chipHtml + (hasActiveFilters(true) ? '<button type="button" class="btn-link" data-action="clear-filters">Xoá bộ lọc</button>' : '');
  }

  function listSkeleton() {
    return `<div class="sk-rows" aria-hidden="true">${Array.from({ length: 6 }, () =>
      `<div class="sk-row">${Array.from({ length: 6 }, (_, i) => `<span class="sk" style="width:${[70, 50, 40, 60, 80, 64][i]}%"></span>`).join('')}</div>`).join('')}</div>`;
  }

  function theadHtml() {
    const [k, d] = state.f.sort.split('-');
    const th = (key, label, cls) => {
      const active = k === key;
      const aria = active ? ` aria-sort="${d === 'desc' ? 'descending' : 'ascending'}"` : '';
      const icon = active ? (d === 'desc' ? 'chevron-down' : 'chevron-up') : 'arrow-up-down';
      return `<th scope="col"${cls ? ` class="${cls}"` : ''}${aria}><button type="button" class="th-sort" data-action="sort" data-key="${key}">${label}${ic(icon)}</button></th>`;
    };
    return `<tr>${th('code', 'Mã căn')}<th scope="col">Toà</th>${th('floor', 'Tầng')}${th('area', 'Diện tích', 'num')}<th scope="col">Loại căn</th><th scope="col">Hướng</th>${th('price', 'Giá bán', 'num')}<th scope="col">Tình trạng</th><th scope="col" class="go"><span class="sr-only">Mở chi tiết</span></th></tr>`;
  }
  function rowHtml(u) {
    const ppm = ppmText(u);
    return `<tr data-idx="${u._i}">
      <td><button type="button" class="code-btn" data-action="open-unit" data-idx="${u._i}" aria-label="${esc('Xem chi tiết căn ' + u.code)}">${esc(u.code)}</button></td>
      <td class="t-muted">${esc(u.block || '—')}</td>
      <td class="t-muted">${esc(u._floorLabel)}</td>
      <td class="num">${esc(areaText(u))}</td>
      <td>${esc(u.type || '—')}</td>
      <td>${esc(u.direction || '—')}</td>
      <td class="num"><span class="price">${esc(priceText(u))}</span>${ppm ? `<span class="ppm">${esc(ppm)}</span>` : ''}</td>
      <td><span class="badges">${statusBadges(u)}</span></td>
      <td class="go">${ic('chevron-right', 'row-go')}</td>
    </tr>`;
  }
  function cardHtml(u) {
    const meta = [u.block && blockLabel(u.block), u.floor && `Tầng ${u._floorLabel}`, u.type].filter(Boolean).join(' · ');
    const ppm = ppmText(u);
    return `<li><button type="button" class="ucard" data-action="open-unit" data-idx="${u._i}">
      <span class="ucard-top">
        <span class="ucard-head"><span class="ucard-code">${esc(u.code)}</span><span class="ucard-meta">${esc(meta || '—')}</span></span>
        <span class="badges">${statusBadges(u)}</span>
      </span>
      <span class="ucard-bottom">
        <span class="ucard-specs"><span>${ic('ruler')}${esc(areaText(u))}</span>${u.direction ? `<span>${ic('compass')}${esc(u.direction)}</span>` : ''}</span>
        <span class="ucard-price"><span class="price">${esc(priceText(u))}</span>${ppm ? `<span class="ppm">${esc(ppm)}</span>` : ''}</span>
      </span>
    </button></li>`;
  }
  function moreHtml(total, shown) {
    if (total > shown) {
      const next = Math.min(PAGE, total - shown);
      return `<button type="button" class="btn btn-ghost" data-action="more">${ic('chevron-down')}Xem thêm ${next} căn</button><p>Đang hiển thị ${shown} / ${total} căn</p>`;
    }
    return total > PAGE ? `<p>Đã hiển thị toàn bộ ${total} căn</p>` : '';
  }
  function emptyFilteredHtml() {
    return stateBox({
      icon: 'search-x',
      title: 'Không có căn phù hợp',
      text: 'Thử bỏ bớt điều kiện lọc hoặc tìm với từ khoá khác. Bạn cũng có thể để lại nhu cầu để chuyên viên gợi ý căn phù hợp.',
      actions: [
        `<button type="button" class="btn btn-primary" data-action="clear-filters">${ic('refresh')}Xoá bộ lọc</button>`,
        `<a class="btn btn-ghost" href="#lien-he">${ic('send')}Nhờ tư vấn chọn căn</a>`,
      ],
    });
  }
  function renderList(filtered) {
    const body = $('#invBody');
    state.mxKey = '';
    if (!filtered.length) { body.innerHTML = emptyFilteredHtml(); state.lastSorted = []; return; }
    const sorted = sortUnits(filtered, state.f.sort);
    state.lastSorted = sorted;
    const page = sorted.slice(0, state.shown);
    body.innerHTML = `<div class="list-desktop"><div class="tbl-wrap"><table class="tbl">
        <caption class="sr-only">${esc(`Danh sách căn ${state.project}`)}</caption>
        <thead>${theadHtml()}</thead><tbody>${page.map(rowHtml).join('')}</tbody>
      </table></div></div>
      <ul class="ucards list-mobile">${page.map(cardHtml).join('')}</ul>
      <div class="more" id="moreBox">${moreHtml(sorted.length, page.length)}</div>`;
  }
  function appendMore() {
    const sorted = state.lastSorted;
    const from = state.shown;
    state.shown = Math.min(sorted.length, from + PAGE);
    const slice = sorted.slice(from, state.shown);
    if (!slice.length) return;
    const tbody = $('#invBody tbody');
    const ul = $('#invBody .ucards');
    if (tbody) tbody.insertAdjacentHTML('beforeend', slice.map(rowHtml).join(''));
    if (ul) ul.insertAdjacentHTML('beforeend', slice.map(cardHtml).join(''));
    const box = $('#moreBox');
    const btn = box && box.querySelector('[data-action="more"]');
    if (sorted.length > state.shown && btn) {
      btn.innerHTML = `${ic('chevron-down')}Xem thêm ${Math.min(PAGE, sorted.length - state.shown)} căn`;
      box.querySelector('p').textContent = `Đang hiển thị ${state.shown} / ${sorted.length} căn`;
    } else if (box) {
      box.innerHTML = moreHtml(sorted.length, state.shown);
      const desktop = window.matchMedia('(min-width: 1024px)').matches;
      const first = desktop
        ? $(`#invBody tbody .code-btn[data-idx="${slice[0]._i}"]`)
        : $(`#invBody .ucard[data-idx="${slice[0]._i}"]`);
      if (first) first.focus({ preventScroll: true });
    }
    renderResultBar(state.lastFiltered);
  }

  /* Bảng hàng: hàng = tầng (giảm dần), cột = căn theo toà */
  function floorRank(f) {
    if (Number.isFinite(f.num)) return f.num;
    return /(ph|penthouse|mai|thuong|sky|roof)/.test(fold(f.label)) ? 1e6 : -1e6;
  }
  function floorsOf(units) {
    const m = new Map();
    units.forEach((u) => { if (!m.has(u._floorKey)) m.set(u._floorKey, { key: u._floorKey, label: u._floorLabel, num: u._floor }); });
    return Array.from(m.values()).sort((a, b) => floorRank(b) - floorRank(a) || collator.compare(a.label, b.label));
  }
  function matrixModel() {
    if (state.mxModel) return state.mxModel;
    const groups = groupBy(state.units, (u) => u.block);
    const blocks = [];
    groups.forEach((list, key) => {
      const stacks = new Set();
      const pairs = new Set();
      let grid = true, dup = 0;
      for (const u of list) {
        if (u._stack == null) { grid = false; break; }
        const p = u._floorKey + '|' + u._stack;
        if (pairs.has(p)) dup++;
        pairs.add(p);
        stacks.add(u._stack);
      }
      if (grid && (dup > list.length * 0.1 || stacks.size > 24)) grid = false;
      const cols = grid ? Array.from(stacks).sort(collator.compare) : ['*'];
      const cells = new Map();
      list.forEach((u) => {
        const k = u._floorKey + '|' + (grid ? u._stack : '*');
        if (!cells.has(k)) cells.set(k, []);
        cells.get(k).push(u);
      });
      cells.forEach((arr) => arr.sort((a, b) => collator.compare(a.code, b.code)));
      blocks.push({ key, label: key ? blockLabel(key) : (groups.size > 1 ? 'Chưa phân toà' : 'Toàn dự án'), cols, grid, cells, units: list });
    });
    blocks.sort((a, b) => (!a.key) - (!b.key) || collator.compare(a.key, b.key));
    state.mxModel = { blocks };
    return state.mxModel;
  }
  function cellHtml(u) {
    const st = STATUS[u._st];
    const sub = u._st === 'available' ? (u._price > 0 ? fmtVnd(u._price) : (u._priceRaw || st.label)) : st.label;
    const label = `Căn ${u.code}, ${statusText(u)}${u._excl ? ', độc quyền' : ''}${u._price > 0 ? ', giá ' + fmtVnd(u._price) : ''}`;
    return `<button type="button" class="mx-cell ${st.cls}${u._excl ? ' is-excl' : ''}" data-action="open-unit" data-idx="${u._i}" aria-label="${esc(label)}" title="${esc(label)}"><span class="mx-code">${esc(u.code)}</span><span class="mx-sub">${esc(sub)}</span>${u._excl ? '<span class="mx-excl" aria-hidden="true"></span>' : ''}</button>`;
  }
  function matrixHtml() {
    const model = matrixModel();
    const blocks = state.f.block ? model.blocks.filter((b) => b.key === state.f.block) : model.blocks;
    const units = [].concat(...blocks.map((b) => b.units));
    const floors = floorsOf(units);
    const c = countStatus(units);
    const nExcl = units.filter((u) => u._excl).length;
    const legend = ST_KEYS.filter((k) => k !== 'locked' || c.locked > 0)
      .map((k) => `<span class="legend-item ${STATUS[k].cls}"><span class="swatch" aria-hidden="true"></span>${STATUS[k].label} <b>${c[k]}</b></span>`).join('') +
      (nExcl ? `<span class="legend-item is-excl"><span class="swatch-excl" aria-hidden="true"></span>Độc quyền <b>${nExcl}</b></span>` : '');
    const head1 = `<th class="mx-floor-h" rowspan="2" scope="col">Tầng</th>` + blocks.map((b, i) =>
      (i ? '<th class="mx-gap" rowspan="2" aria-hidden="true"></th>' : '') +
      `<th class="mx-block-h" colspan="${b.cols.length}" scope="colgroup"><span class="mx-bl">${esc(b.label)}</span><small>Còn <b>${countStatus(b.units).available}</b>/${b.units.length} căn</small></th>`).join('');
    const head2 = blocks.map((b) => b.cols.map((col) => `<th scope="col">${b.grid ? esc(col) : 'Căn'}</th>`).join('')).join('');
    const rows = floors.map((fl) => `<tr><th scope="row" class="mx-floor"><span>${esc(fl.label)}</span></th>${blocks.map((b, i) =>
      (i ? '<td class="mx-gap"></td>' : '') + b.cols.map((col) => {
        const list = b.cells.get(fl.key + '|' + col) || [];
        if (!list.length) return '<td><span class="mx-empty" aria-hidden="true"></span></td>';
        if (list.length === 1 && b.grid) return `<td>${cellHtml(list[0])}</td>`;
        return `<td><div class="mx-multi">${list.map(cellHtml).join('')}</div></td>`;
      }).join('')).join('')}</tr>`).join('');
    return `<div class="mx-legend"><div class="legend">${legend}</div><span class="mx-hint">${ic('info')}Nhấn vào ô để xem chi tiết căn</span></div>
      <div class="mx-note-slot"></div>
      <div class="mx-scroll" tabindex="0" role="region" aria-label="${esc('Bảng hàng ' + state.project + ', cuộn ngang để xem thêm')}">
        <table class="mx"><caption class="sr-only">${esc(`Bảng hàng ${state.project}: hàng là tầng, cột là căn theo toà`)}</caption>
          <thead><tr>${head1}</tr><tr>${head2}</tr></thead><tbody>${rows}</tbody>
        </table>
      </div>`;
  }
  function renderMatrix(filtered) {
    const body = $('#invBody');
    const key = `${state.project}|${state.f.block}|${state.units.length}`;
    if (state.mxKey !== key || !body.querySelector('.mx')) {
      body.innerHTML = matrixHtml();
      state.mxKey = key;
    }
    const match = new Set(filtered.map((u) => u._i));
    body.querySelectorAll('.mx-cell').forEach((c) => c.classList.toggle('is-dim', !match.has(Number(c.dataset.idx))));
    const slot = body.querySelector('.mx-note-slot');
    if (slot) {
      slot.innerHTML = filtered.length ? '' :
        `<div class="mx-note">${ic('search-x')}<span>Không có căn nào khớp bộ lọc hiện tại.</span><button type="button" class="btn-link" data-action="clear-filters">Xoá bộ lọc</button></div>`;
    }
  }

  function updatingBox(cur) {
    const actions = [];
    if (state.apiDown) actions.push(`<button type="button" class="btn btn-primary" data-action="retry-summary">${ic('refresh')}Thử lại</button>`);
    if (cur && cur.docs.length) actions.push(`<a class="btn ${state.apiDown ? 'btn-ghost' : 'btn-primary'}" href="#tai-lieu">${ic('folder')}Xem tài liệu bán hàng</a>`);
    actions.push(`<a class="btn btn-ghost" href="#lien-he">${ic('send')}Nhận bảng hàng khi mở bán</a>`);
    return stateBox({
      icon: 'clock',
      title: 'Giỏ hàng đang được cập nhật',
      text: `Giỏ hàng ${state.project} sẽ sớm có mặt tại đây.${cur && cur.docs.length ? ' Trong lúc chờ, Quý Anh Chị có thể xem tài liệu bán hàng' : ' Quý Anh Chị có thể'} hoặc để lại thông tin để nhận bảng hàng sớm nhất.`,
      code: state.apiDown ? 'Chưa kết nối được máy chủ dữ liệu — thông tin tài liệu vẫn xem được bình thường.' : '',
      actions,
    });
  }
  function renderInventory() {
    const s = state;
    const sec = $('#gio-hang');
    const show = s.summaryStatus === 'loading' || (s.summaryStatus === 'ready' && s.projects.length > 0);
    sec.hidden = !show;
    if (!show) return;
    $$('#gio-hang .seg [data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === s.view)));
    const ready = s.unitsStatus === 'ready';
    const cur = curCurated();
    const hasUnits = ready && s.units.length > 0;
    const quiet = !hasUnits && s.unitsStatus !== 'loading' && s.summaryStatus !== 'loading';
    $('#invProj').textContent = s.project || '';
    $('#gio-hang .seg').hidden = quiet;
    $('#gio-hang .toolbar').hidden = quiet;
    $('#statusChips').hidden = quiet;
    const cnt = $('#invCount');
    cnt.hidden = !hasUnits;
    cnt.textContent = hasUnits ? `${s.units.length} căn` : '';
    $('#invSub').textContent = quiet
      ? 'Quỹ căn, giá và tình trạng từng căn được cập nhật trực tiếp từ hệ thống.'
      : s.view === 'matrix'
        ? 'Sơ đồ căn theo toà và tầng. Nhấn vào ô để xem chi tiết.'
        : 'Nhấn vào một căn để xem chi tiết và nhận báo giá.';
    renderChips();
    renderSelects();
    const body = $('#invBody');
    const bar = $('#resultBar');
    if (s.summaryStatus === 'loading' || s.unitsStatus === 'loading' || s.unitsStatus === 'idle') {
      bar.innerHTML = '';
      body.innerHTML = listSkeleton();
      s.mxKey = '';
      return;
    }
    if (s.unitsStatus === 'none' || (cur && !hasUnits && !s.unitsError)) {
      bar.innerHTML = '';
      s.mxKey = '';
      body.innerHTML = updatingBox(cur);
      return;
    }
    if (s.unitsStatus === 'error') {
      bar.innerHTML = '';
      s.mxKey = '';
      body.innerHTML = stateBox({
        icon: 'cloud-off', error: true,
        title: cur ? 'Giỏ hàng đang được cập nhật' : 'Chưa tải được danh sách căn',
        text: 'Không lấy được giỏ hàng của dự án này. Vui lòng thử lại sau giây lát.',
        code: errText(s.unitsError),
        actions: [`<button type="button" class="btn btn-primary" data-action="retry-units">${ic('refresh')}Thử lại</button>`]
          .concat(cur && cur.docs.length ? [`<a class="btn btn-ghost" href="#tai-lieu">${ic('folder')}Xem tài liệu bán hàng</a>`] : []),
      });
      return;
    }
    if (!s.units.length) {
      bar.innerHTML = '';
      s.mxKey = '';
      body.innerHTML = stateBox({
        icon: 'inbox', title: 'Dự án chưa có căn trên giỏ hàng',
        text: 'Giỏ hàng đang được cập nhật. Để lại thông tin để nhận bảng hàng ngay khi mở bán.',
        actions: [`<a class="btn btn-primary" href="#lien-he">${ic('send')}Nhận thông tin mở bán</a>`],
      });
      return;
    }
    const filtered = currentFiltered();
    s.lastFiltered = filtered;
    renderResultBar(filtered);
    if (s.view === 'matrix') renderMatrix(filtered);
    else renderList(filtered);
  }

  /* ------------------------------------------------------------------ *
   * Render: chính sách, tiến độ, mặt bằng, tài liệu
   * ------------------------------------------------------------------ */
  function htmlToText(v) {
    const s = str(v);
    if (!s) return '';
    if (!/<[a-z!/][^>]*>/i.test(s) && !/&[a-z#0-9]+;/i.test(s)) return s;
    try {
      const prepared = s
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<li[^>]*>/gi, '$&- ')
        .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, '$&\n');
      const doc = new DOMParser().parseFromString(prepared, 'text/html');
      return (doc.body.textContent || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    } catch (e) {
      return s.replace(/<[^>]*>/g, ' ').trim();
    }
  }
  function proseHtml(text) {
    let html = '';
    let list = [];
    const flush = () => {
      if (list.length) { html += `<ul class="checks">${list.map((li) => `<li>${ic('check-circle')}<span>${esc(li)}</span></li>`).join('')}</ul>`; list = []; }
    };
    text.split(/\r?\n/).map((l) => l.trim()).forEach((l) => {
      if (!l) { flush(); return; }
      const m = l.match(/^(?:[-•*+–]|\d+[.)])\s+(.*)$/);
      if (m) { list.push(m[1]); return; }
      flush();
      if (l.length <= 70 && /:$/.test(l)) html += `<h4>${esc(l.replace(/:$/, ''))}</h4>`;
      else html += `<p>${esc(l)}</p>`;
    });
    flush();
    return html;
  }
  function parseWhen(s) {
    const t = fold(s);
    let m = t.match(/q\s*([1-4])\s*[/\-\s]\s*(\d{4})/);
    if (m) return new Date(+m[2], (+m[1] - 1) * 3, 1);
    m = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
    m = t.match(/(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (m) return new Date(+m[1], +m[2] - 1, m[3] ? +m[3] : 1);
    m = t.match(/(\d{1,2})\s*[/\-.]\s*(\d{4})/);
    if (m) return new Date(+m[2], +m[1] - 1, 1);
    m = t.match(/\b(\d{4})\b/);
    if (m) return new Date(+m[1], 0, 1);
    return null;
  }
  function renderEnrichSections() {
    const ok = state.summaryStatus === 'ready' && state.projects.length > 0;
    const c = (ok && state.enrich && state.enrich.content) || {};

    const policy = htmlToText(c.salesPolicy);
    $('#chinh-sach').hidden = !policy;
    $('#policyBody').innerHTML = policy ? proseHtml(policy) : '';

    const prog = (Array.isArray(c.progress) ? c.progress : []).filter(isObj)
      .map((p) => ({ date: str(p.date), title: str(p.title), desc: htmlToText(p.desc) }))
      .filter((p) => p.title || p.desc);
    $('#tien-do').hidden = !prog.length;
    const now = new Date();
    $('#progressBody').innerHTML = prog.map((p) => {
      const when = parseWhen(p.date);
      const done = when ? when <= now : false;
      return `<li class="tl-item${done ? ' is-done' : ''}"><span class="tl-dot" aria-hidden="true"></span>
        ${p.date ? `<p class="tl-date">${esc(p.date)}${done ? '<span class="sr-only"> (đã hoàn thành)</span>' : ''}</p>` : ''}
        ${p.title ? `<p class="tl-title">${esc(p.title)}</p>` : ''}
        ${p.desc ? `<p class="tl-desc">${esc(p.desc)}</p>` : ''}</li>`;
    }).join('');
    $('#duo').classList.toggle('is-2', !!policy && prog.length > 0);

    const plans = (Array.isArray(c.floorplans) ? c.floorplans : []).filter(isObj)
      .map((p) => ({ name: str(p.name || p.title), image: safeUrl(p.image || p.url) }))
      .filter((p) => p.name || p.image);
    $('#mat-bang').hidden = !plans.length;
    $('#planBody').innerHTML = plans.map((p, i) => {
      const name = p.name || `Mặt bằng ${i + 1}`;
      const inner = `<div class="plan-img">${p.image ? `<img src="${esc(p.image)}" alt="${esc(name)}" loading="lazy" referrerpolicy="no-referrer" data-plan="${i}">` : planSvg(i)}</div>
        <div class="plan-cap"><span>${esc(name)}</span>${p.image ? ic('external') : ''}</div>`;
      return p.image
        ? `<a class="plan" href="${esc(p.image)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(name + ' — mở ảnh lớn trong thẻ mới')}">${inner}</a>`
        : `<div class="plan">${inner}</div>`;
    }).join('');
    $$('#planBody img[data-plan]').forEach((img) => {
      img.addEventListener('error', () => { const w = img.parentNode; if (w) w.innerHTML = planSvg(Number(img.dataset.plan) || 0); }, { once: true });
    });

    const docsSrc = isObj(c.documents) && Array.isArray(c.documents.files) ? c.documents.files : (Array.isArray(c.documents) ? c.documents : []);
    const files = docsSrc.filter(isObj).map((f) => ({ name: str(f.name || f.title), url: safeUrl(f.url || f.link) })).filter((f) => f.name || f.url);
    const news = (Array.isArray(c.news) ? c.news : []).filter(isObj)
      .map((n) => ({ title: str(n.title), url: safeUrl(n.url || n.link), date: str(n.date) })).filter((n) => n.title);
    const cur = ok ? curCurated() : null;
    const hasCur = !!(cur && (cur.docs.length || cur.notice));
    $('#tai-lieu').hidden = !hasCur && !files.length && !news.length;
    placeDocsSection(hasCur);
    $('#docTitle').textContent = hasCur ? 'Tài liệu bán hàng' : 'Tài liệu & tin tức';
    $('#docSub').textContent = hasCur
      ? [cur.name, cur.distributor ? `Phân phối: ${cur.distributor}` : ''].filter(Boolean).join(' · ')
      : 'Hồ sơ dự án và cập nhật mới nhất.';
    $('#docCopyAll').hidden = !(cur && cur.docs.length);
    $('#curatedDocs').innerHTML = hasCur ? curatedDocsHtml(cur) : '';
    const fileHtml = files.map((f) => {
      const name = f.name || 'Tài liệu dự án';
      if (f.url) {
        return `<li><a class="doc" href="${esc(f.url)}" target="_blank" rel="noopener noreferrer"><span class="doc-ico">${ic('file')}</span>
          <span class="doc-main"><span class="doc-name">${esc(name)}</span><span class="doc-meta">${esc(hostOf(f.url))}</span></span>
          <span class="doc-go"><span class="dg-txt">Mở</span>${ic('external')}</span></a></li>`;
      }
      return `<li><button type="button" class="doc" data-action="ask-doc" data-name="${esc(name)}"><span class="doc-ico">${ic('file')}</span>
        <span class="doc-main"><span class="doc-name">${esc(name)}</span><span class="doc-meta">Gửi qua Zalo hoặc email theo yêu cầu</span></span>
        <span class="doc-go"><span class="dg-txt">Nhận tài liệu</span>${ic('arrow-right')}</span></button></li>`;
    }).join('');
    const newsHtml = news.map((n) => {
      const inner = `<span class="doc-ico is-news">${ic('news')}</span><span class="doc-main"><span class="doc-name">${esc(n.title)}</span>${n.date ? `<span class="doc-meta">${esc(fmtDate(n.date))}</span>` : ''}</span>`;
      return n.url
        ? `<li><a class="doc" href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">${inner}<span class="doc-go"><span class="dg-txt">Đọc</span>${ic('external')}</span></a></li>`
        : `<li><div class="doc">${inner}</div></li>`;
    }).join('');
    const docBody = $('#docBody');
    docBody.classList.toggle('is-2', !!files.length && !!news.length);
    docBody.classList.toggle('has-top', hasCur && (!!files.length || !!news.length));
    docBody.innerHTML = (files.length ? `<div><h3>${hasCur ? 'Tài liệu khác' : 'Tài liệu'}</h3><ul class="doc-list">${fileHtml}</ul></div>` : '') +
      (news.length ? `<div><h3>Tin tức</h3><ul class="doc-list">${newsHtml}</ul></div>` : '');
    const slogan = $('#docSlogan');
    slogan.hidden = !(cur && cur.slogan);
    $('#docSloganText').textContent = cur && cur.slogan ? cur.slogan : '';
  }

  /* Tài liệu bán hàng đặt ngay sau Tổng quan khi dự án có bộ tài liệu tuyển chọn. */
  function placeDocsSection(top) {
    const sec = $('#tai-lieu');
    const tab = $('#tabs .tab[data-tab="tai-lieu"]');
    const anchorSec = top ? $('#gio-hang') : $('#lien-he');
    const anchorTab = top ? $('#tabs .tab[data-tab="gio-hang"]') : $('#tabs .tab[data-tab="lien-he"]');
    if (sec.nextElementSibling !== anchorSec) anchorSec.parentNode.insertBefore(sec, anchorSec);
    if (tab && anchorTab && tab.nextElementSibling !== anchorTab) anchorTab.parentNode.insertBefore(tab, anchorTab);
  }
  function curatedDocsHtml(cur) {
    const notice = cur.notice ? `<div class="notice">
        <span class="notice-ico">${ic('megaphone')}</span>
        <div class="notice-main">
          <p class="notice-to">Kính gửi Quý Anh Chị Đại Lý,</p>
          <p class="notice-text">${esc(cur.notice)}</p>
          ${cur.distributor ? `<p class="notice-from">${ic('handshake')}<span>Đơn vị phân phối: <b>${esc(cur.distributor)}</b></span></p>` : ''}
        </div>
      </div>` : '';
    const cards = cur.docs.map((d, i) => {
      const t = DOC_TYPES[d.type] || DOC_TYPES.other;
      const main = d.type === 'all';
      return `<li class="dcard t-${esc(d.type)}${main ? ' is-main' : ''}">
        <span class="dcard-ico">${ic(t.icon)}</span>
        <span class="dcard-main">
          <a class="dcard-link" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.label)}<span class="sr-only"> (mở trong thẻ mới)</span></a>
          ${d.desc ? `<span class="dcard-desc">${esc(d.desc)}</span>` : ''}
          <span class="dcard-host">${ic('external')}${esc(hostOf(d.url) || 'Mở link')}</span>
        </span>
        <button type="button" class="dcard-copy" data-action="copy-doc" data-i="${i}" aria-label="${esc('Sao chép link ' + d.label)}">${ic('copy')}<span>Sao chép link</span></button>
      </li>`;
    }).join('');
    return notice + (cards ? `<ul class="dgrid">${cards}</ul>` : '');
  }
  function docsMessage(cur) {
    const lines = [`🔥 ${cur.name.toUpperCase()} — TÀI LIỆU BÁN HÀNG`, ''];
    lines.push('Kính gửi Quý Anh Chị Đại Lý,');
    if (cur.notice) lines.push(cur.notice);
    lines.push('');
    cur.docs.forEach((d) => {
      const t = DOC_TYPES[d.type] || DOC_TYPES.other;
      lines.push(`${t.emoji} ${d.label}${d.desc ? ` (${d.desc})` : ''}:`);
      lines.push(d.url);
    });
    const page = projectUrl('tai-lieu');
    if (page) { lines.push(''); lines.push(`🏢 Giỏ hàng & tài liệu cập nhật: ${page}`); }
    if (cur.slogan) { lines.push(''); lines.push(`✨ ${cur.slogan}`); }
    lines.push('');
    lines.push(`FBG Property · ${CONFIG.EMAIL}`);
    return lines.join('\n');
  }

  /* ------------------------------------------------------------------ *
   * Render: trạng thái trang, tab, liên hệ
   * ------------------------------------------------------------------ */
  const SKYLINE = `<svg class="skyline" viewBox="0 0 600 220" preserveAspectRatio="xMaxYMax meet" aria-hidden="true" focusable="false"><g fill="none" stroke="#fff" stroke-width="1.5" stroke-linejoin="round">
      <path d="M10 220V120h60v100M30 140h20M30 160h20M30 180h20M30 200h20"/>
      <path d="M90 220V60l50-30 50 30v160M110 80h20M150 80h20M110 105h20M150 105h20M110 130h20M150 130h20M110 155h20M150 155h20M110 180h20M150 180h20"/>
      <path d="M210 220V100h70v120M225 120h40M225 140h40M225 160h40M225 180h40M225 200h40"/>
      <path d="M300 220V20h80v200M315 40h50M315 60h50M315 80h50M315 100h50M315 120h50M315 140h50M315 160h50M315 180h50M340 0v20"/>
      <path d="M400 220V90h60v130M415 110h30M415 130h30M415 150h30M415 170h30M415 190h30"/>
      <path d="M480 220V50l40-20 40 20v170M495 70h50M495 95h50M495 120h50M495 145h50M495 170h50M495 195h50"/></g></svg>`;
  function renderPageState() {
    const el = $('#pageState');
    const s = state;
    let html = '';
    if (s.summaryStatus === 'error') {
      html = `<div class="card page-state is-error">${SKYLINE}${stateBox({
        icon: 'cloud-off',
        title: 'Chưa tải được giỏ hàng',
        text: 'Kết nối tới máy chủ dữ liệu FBG đang gián đoạn. Vui lòng kiểm tra mạng rồi thử lại, hoặc để lại thông tin để được tư vấn trực tiếp.',
        code: errText(s.summaryError),
        actions: [
          `<button type="button" class="btn btn-white" data-action="retry-summary">${ic('refresh')}Thử lại</button>`,
          `<a class="btn btn-glass" href="#lien-he">${ic('send')}Liên hệ tư vấn</a>`,
        ],
      })}</div>`;
    } else if (s.summaryStatus === 'ready' && !s.projects.length) {
      html = `<div class="card page-state">${stateBox({
        icon: 'inbox',
        title: 'Chưa có dự án đang mở bán',
        text: 'Giỏ hàng đang được cập nhật. Để lại thông tin để FBG Property gửi bạn dự án phù hợp ngay khi mở bán.',
        actions: [`<a class="btn btn-primary" href="#lien-he">${ic('send')}Đăng ký nhận thông tin</a>`],
      })}</div>`;
    } else if (s.summaryStatus === 'ready' && s.apiDown) {
      // Máy chủ lỗi nhưng vẫn có dự án tuyển chọn: báo gọn, trang vẫn dùng được.
      html = `<div class="api-alert" role="status">
        <span class="api-alert-ico">${ic('cloud-off')}</span>
        <p><b>Chưa kết nối được giỏ hàng trực tuyến.</b> <span>${esc(errText(s.summaryError))} Tài liệu bán hàng vẫn xem được bình thường.</span></p>
        <button type="button" class="btn btn-ghost btn-sm" data-action="retry-summary">${ic('refresh')}Thử lại</button>
      </div>`;
    }
    el.hidden = !html;
    el.innerHTML = html;
    $('#tong-quan').hidden = s.summaryStatus === 'error' || (s.summaryStatus === 'ready' && !s.projects.length);
  }
  function renderTabs() {
    const blocked = state.summaryStatus === 'error' || (state.summaryStatus === 'ready' && !state.projects.length);
    $('#subnav').hidden = blocked;
    const hasUnits = state.unitsStatus !== 'ready' || state.units.length > 0;
    $$('#tabs .tab').forEach((t) => {
      const target = t.dataset.tab === 'bang-hang' ? 'gio-hang' : t.dataset.tab;
      const el = document.getElementById(target);
      t.hidden = !el || el.hidden || (t.dataset.tab === 'bang-hang' && (state.unitsStatus === 'none' || state.unitsStatus === 'error' || !hasUnits));
    });
  }
  function contactHref() {
    const out = {};
    const hot = str(CONFIG.HOTLINE);
    const digits = hot.replace(/[^\d+]/g, '');
    if (digits.length >= 8) out.tel = { href: 'tel:' + digits, label: hot };
    const z = str(CONFIG.ZALO);
    if (z) {
      const url = safeUrl(z) || (z.replace(/\D/g, '').length >= 8 ? 'https://zalo.me/' + z.replace(/\D/g, '') : '');
      if (url) out.zalo = { href: url };
    }
    return out;
  }
  function renderContactStatic() {
    const h = contactHref();
    const links = [];
    if (h.tel) links.push(`<a class="btn btn-primary" href="${esc(h.tel.href)}">${ic('phone')}Gọi ${esc(h.tel.label)}</a>`);
    if (h.zalo) links.push(`<a class="btn btn-ghost" href="${esc(h.zalo.href)}" target="_blank" rel="noopener noreferrer">${ic('message')}Chat Zalo</a>`);
    links.push(`<a class="btn btn-ghost" href="mailto:${esc(CONFIG.EMAIL)}">${ic('mail')}${esc(CONFIG.EMAIL)}</a>`);
    $('#contactLinks').innerHTML = links.join('');
    const extra = [];
    if (h.tel) extra.push(`<a class="icon-btn" style="width:48px;height:48px" href="${esc(h.tel.href)}" aria-label="${esc('Gọi hotline ' + h.tel.label)}">${ic('phone')}</a>`);
    if (h.zalo) extra.push(`<a class="icon-btn" style="width:48px;height:48px" href="${esc(h.zalo.href)}" target="_blank" rel="noopener noreferrer" aria-label="Chat Zalo">${ic('message')}</a>`);
    $('#mctaExtra').innerHTML = extra.join('');
    const top = $('#topHotline');
    if (h.tel) { top.href = h.tel.href; top.innerHTML = `${ic('phone')}${esc(h.tel.label)}`; top.hidden = false; }
  }
  function renderContactProjects() {
    const sel = $('#lfProject');
    const names = state.projects.map((p) => p.name);
    const ver = names.join('\u0001');
    if (sel.dataset.ver !== ver) {
      sel.innerHTML = names.length
        ? names.map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('')
        : '<option value="">Tư vấn chung</option>';
      sel.dataset.ver = ver;
      if (state.project) sel.value = state.project;
    }
    const dl = $('#unitCodes');
    const key = state.project + '|' + state.units.length;
    if (dl.dataset.key !== key) {
      dl.innerHTML = state.units.slice(0, 600).map((u) => `<option value="${esc(u.code)}"></option>`).join('');
      dl.dataset.key = key;
    }
  }

  function renderAll() {
    renderPageState();
    renderHeader();
    renderHero();
    renderOverview();
    renderInventory();
    renderEnrichSections();
    renderTabs();
    renderContactProjects();
    scheduleSpy();
    reanchorSoon();
  }

  /* ------------------------------------------------------------------ *
   * Tải dữ liệu
   * ------------------------------------------------------------------ */
  function normalizeSummary(r) {
    const items = Array.isArray(r && r.items) ? r.items : (Array.isArray(r) ? r : []);
    const seen = new Set();
    const out = [];
    items.filter(isObj).forEach((it) => {
      const name = str(it.project || it.name);
      if (!name || seen.has(name)) return;
      seen.add(name);
      const n = toNum(it.count);
      out.push({ key: str(it.key), name, count: n > 0 ? n : 0 });
    });
    return out;
  }
  /* Gộp dự án từ API với dự án tuyển chọn (projects.js): dự án Hot lên đầu. */
  function mergeProjects(apiItems) {
    const used = new Set();
    const merged = CURATED.map((c) => {
      const keys = curatedKeys(c);
      const hit = apiItems.find((it) => !used.has(it) && (keys.includes(normName(it.name)) || (it.key && keys.includes(normName(it.key)))));
      if (hit) used.add(hit);
      return { key: hit ? hit.key : c.id, name: c.name, apiName: hit ? hit.name : '', count: hit ? hit.count : 0, curated: c, hot: c.hot };
    });
    const api = apiItems.filter((it) => !used.has(it)).map((it) => ({ key: it.key, name: it.name, apiName: it.name, count: it.count, curated: null, hot: false }));
    const hot = merged.filter((p) => p.hot);
    const withApi = merged.filter((p) => !p.hot && p.apiName);
    const rest = merged.filter((p) => !p.hot && !p.apiName);
    // Giữ thứ tự của API cho các dự án thường; dự án tuyển chọn có quỹ căn đứng theo vị trí của chính nó trong API.
    const ordered = apiItems.map((it) => withApi.find((p) => p.apiName === it.name) || api.find((p) => p.apiName === it.name)).filter(Boolean);
    return hot.concat(ordered, rest);
  }
  const curProj = () => state.projects.find((p) => p.name === state.project) || null;
  const curCurated = () => { const p = curProj(); return p ? p.curated : null; };
  function pickProject(want) {
    const list = state.projects;
    if (want) {
      const t = normName(want);
      const hit = list.find((p) => p.name === want) ||
        list.find((p) => normName(p.name) === t || (p.apiName && normName(p.apiName) === t)) ||
        list.find((p) => p.key && normName(p.key) === t) ||
        list.find((p) => p.curated && curatedKeys(p.curated).includes(t));
      if (hit) return { name: hit.name };
      return { name: list[0].name, notFound: want };
    }
    return { name: list[0].name };
  }
  async function loadSummary() {
    state.summaryStatus = 'loading';
    state.summaryError = null;
    state.apiDown = false;
    renderAll();
    let apiItems = [];
    try {
      apiItems = normalizeSummary(await Source.summary());
    } catch (e) {
      state.apiDown = true;
      state.summaryError = e;
    }
    state.projects = mergeProjects(apiItems);
    state.summaryStatus = state.apiDown && !state.projects.length ? 'error' : 'ready';
    if (!state.projects.length) { renderAll(); finishInitial(); return; }
    const pick = pickProject(state.project || state.wantProject);
    if (pick.notFound) setTimeout(() => toast(`Không tìm thấy dự án “${pick.notFound}”. Đang hiển thị ${pick.name}.`), 400);
    await selectProject(pick.name, true);
  }
  async function selectProject(name, force) {
    const seq = ++state.loadSeq;
    const changed = state.project !== name;
    state.project = name;
    state.units = [];
    state.unitsError = null;
    state.mxModel = null;
    state.mxKey = '';
    state.options = null;
    state.enrich = state.enrichCache.has(name) ? state.enrichCache.get(name) : null;
    if (changed) {
      resetFilters(true);
      const sel = $('#lfProject');
      if (sel && Array.from(sel.options).some((o) => o.value === name)) sel.value = name;
    }
    const p = curProj();
    // Dự án tuyển chọn chưa có bảng hàng trên hệ thống (hoặc máy chủ không phản hồi): không gọi API quỹ căn.
    const noInventory = !p || !p.apiName || state.apiDown;
    state.unitsStatus = noInventory ? 'none' : 'loading';
    syncUrl();
    renderAll();
    if (!state.apiDown) loadEnrichment(name, p && p.apiName ? p.apiName : name, seq);
    if (noInventory) { finishInitial(); return; }
    try {
      const r = await Source.units(p.apiName);
      if (seq !== state.loadSeq) return;
      state.units = prepUnits(r && (Array.isArray(r.units) ? r.units : (Array.isArray(r.items) ? r.items : [])));
      state.unitsStatus = 'ready';
      state.updatedAt = new Date();
      buildOptions();
    } catch (e) {
      if (seq !== state.loadSeq) return;
      state.unitsStatus = 'error';
      state.unitsError = e;
    }
    renderAll();
    finishInitial();
  }
  async function loadEnrichment(name, apiName, seq) {
    if (state.enrichCache.has(name)) return;
    let data = null;
    let failed = false;
    try { data = await Source.enrich(apiName); } catch (e) { data = null; failed = true; }
    if (data && !isObj(data)) data = null;
    // Chỉ lưu cache khi gọi thành công (kể cả "không khớp"); lỗi mạng tạm thời sẽ được thử lại.
    if (!failed) state.enrichCache.set(name, data);
    if (seq !== state.loadSeq) return;
    state.enrich = data;
    renderHero();
    renderOverview();
    renderEnrichSections();
    renderTabs();
    scheduleSpy();
    reanchorSoon();
  }

  /* Lần tải đầu: cuộn tới #hash và mở căn từ ?unit= / ?can= */
  function finishInitial() {
    if (state.initialDone) return;
    state.initialDone = true;
    reanchorSoon();
    if (state.wantUnit) {
      if (state.unitsStatus === 'ready') {
        const t = fold(state.wantUnit).trim();
        const u = state.units.find((x) => fold(x.code).trim() === t);
        if (u) setTimeout(() => openDrawer(u._i), 60);
        else setTimeout(() => toast(`Không tìm thấy căn “${state.wantUnit}” trong giỏ hàng hiện tại.`), 300);
      } else {
        setTimeout(() => toast(`Chưa mở được căn “${state.wantUnit}” vì bảng hàng chưa sẵn sàng.`), 300);
      }
    }
  }

  /* ------------------------------------------------------------------ *
   * URL, điều hướng mục, scroll-spy
   * ------------------------------------------------------------------ */
  function syncUrl() {
    try {
      const url = new URL(location.href);
      const p = url.searchParams;
      p.delete('du-an');
      p.delete('can');
      if (state.project) p.set('project', state.project);
      const u = state.openIdx >= 0 ? state.units[state.openIdx] : null;
      if (u) p.set('unit', u.code); else p.delete('unit');
      const qs = p.toString();
      history.replaceState(history.state, '', url.pathname + (qs ? '?' + qs : '') + url.hash);
    } catch (e) { /* bỏ qua */ }
  }
  function unitUrl(u) {
    const url = new URL(location.href);
    url.hash = '';
    url.searchParams.delete('du-an');
    url.searchParams.delete('can');
    url.searchParams.set('project', state.project);
    url.searchParams.set('unit', u.code);
    return url.toString();
  }
  function projectUrl(hash) {
    try {
      const url = new URL(location.href);
      ['du-an', 'can', 'unit', 'demo', 'ref'].forEach((k) => url.searchParams.delete(k));
      url.searchParams.set('project', state.project);
      url.hash = hash || '';
      return /^https?:/.test(url.protocol) ? url.toString() : '';
    } catch (e) { return ''; }
  }
  const headerH = () => { const h = $('#siteHeader'); return h ? h.offsetHeight : 0; };
  let spyLock = '', spyLockUntil = 0, spyRaf = 0, activeTab = '';

  /* Neo #hash khi mở trang: nội dung (giỏ hàng, làm giàu dữ liệu, font) đến dần làm layout dịch chuyển,
     nên cuộn lại tới mục đích cho đến khi layout ổn định hoặc người dùng tự cuộn/nhấn. */
  const anchor = { id: '', until: 0 };
  function armAnchor(id) { anchor.id = id; anchor.until = Date.now() + 5000; }
  function cancelAnchor() { anchor.id = ''; }
  let reanchorRaf = 0;
  function reanchorSoon() {
    if (!anchor.id || reanchorRaf) return;
    reanchorRaf = requestAnimationFrame(() => requestAnimationFrame(() => { reanchorRaf = 0; reanchor(); }));
  }
  function reanchor() {
    if (!anchor.id) return;
    if (userScrolled || Date.now() > anchor.until) { cancelAnchor(); return; }
    const id = anchor.id;
    const el = document.getElementById(id === 'bang-hang' ? 'gio-hang' : id);
    if (!el || el.hidden) return;
    const want = headerH() + 8;
    if (Math.abs(el.getBoundingClientRect().top - want) > 2) goTo(id, { instant: true, keepAnchor: true });
    else setActiveTab(id === 'gio-hang' && state.view === 'matrix' ? 'bang-hang' : id);
  }

  function setActiveTab(id) {
    if (id === activeTab) return;
    activeTab = id;
    $$('#tabs .tab').forEach((t) => {
      const on = t.dataset.tab === id;
      t.classList.toggle('is-active', on);
      if (on) t.setAttribute('aria-current', 'location'); else t.removeAttribute('aria-current');
    });
    const strip = $('#tabs');
    const t = $(`#tabs .tab[data-tab="${id}"]`);
    if (t && strip.scrollWidth > strip.clientWidth + 2) {
      const l = t.offsetLeft, r = l + t.offsetWidth;
      if (l < strip.scrollLeft + 8 || r > strip.scrollLeft + strip.clientWidth - 8) {
        strip.scrollTo({ left: Math.max(0, l - (strip.clientWidth - t.offsetWidth) / 2), behavior: reducedMotion() ? 'auto' : 'smooth' });
      }
    }
  }
  function spy() {
    spyRaf = 0;
    let id;
    if (anchor.id && !userScrolled && Date.now() <= anchor.until) {
      id = anchor.id === 'gio-hang' && state.view === 'matrix' ? 'bang-hang' : anchor.id;
    } else if (spyLock && Date.now() < spyLockUntil) {
      id = spyLock;
    } else {
      spyLock = '';
      const line = headerH() + 48;
      let best = '', bestTop = -Infinity, first = '', last = '';
      for (const sid of SECTION_IDS) {
        const el = document.getElementById(sid);
        if (!el || el.hidden) continue;
        const top = el.getBoundingClientRect().top;
        if (!first || top < document.getElementById(first).getBoundingClientRect().top) first = sid;
        if (!last || top > document.getElementById(last).getBoundingClientRect().top) last = sid;
        if (top - line <= 0 && top > bestTop + 1) { best = sid; bestTop = top; }
      }
      id = best || first;
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && last) id = last;
      if (id === 'gio-hang' && state.view === 'matrix') id = 'bang-hang';
    }
    if (id) setActiveTab(id);
  }
  function scheduleSpy() { if (!spyRaf) spyRaf = requestAnimationFrame(spy); }
  function goTo(id, opts) {
    const o = opts || {};
    if (!o.keepAnchor) cancelAnchor();
    if (id === 'bang-hang' && state.view !== 'matrix') setView('matrix', true);
    else if (id === 'gio-hang' && o.fromTab && state.view !== 'list') setView('list', true);
    const target = id === 'bang-hang' ? 'gio-hang' : id;
    const el = document.getElementById(target);
    if (!el || el.hidden) return false;
    try { history.replaceState(history.state, '', '#' + id); } catch (e) { /* bỏ qua */ }
    spyLock = target === 'gio-hang' && state.view === 'matrix' ? 'bang-hang' : id;
    const instant = o.instant || reducedMotion();
    spyLockUntil = Date.now() + (instant ? 250 : 1200);
    setActiveTab(spyLock);
    if (instant) {
      // Cuộn tức thì: tạm tắt scroll-behavior:smooth của <html>, tránh bị render sau cắt ngang.
      const root = document.documentElement;
      const prev = root.style.scrollBehavior;
      root.style.scrollBehavior = 'auto';
      el.scrollIntoView({ block: 'start', behavior: 'auto' });
      root.style.scrollBehavior = prev;
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return true;
  }
  function setView(v, silent) {
    if (state.view === v) return;
    state.view = v;
    state.mxKey = '';
    state.shown = PAGE;
    renderInventory();
    if (!silent) {
      try { history.replaceState(history.state, '', '#' + (v === 'matrix' ? 'bang-hang' : 'gio-hang')); } catch (e) { /* bỏ qua */ }
    }
    if (activeTab === 'gio-hang' || activeTab === 'bang-hang') setActiveTab(v === 'matrix' ? 'bang-hang' : 'gio-hang');
  }

  /* ------------------------------------------------------------------ *
   * Drawer chi tiết căn
   * ------------------------------------------------------------------ */
  let lastFocus = null;
  function similarUnits(u) {
    const pool = state.units.filter((x) => x._i !== u._i && x._st === 'available');
    const same = u.type ? pool.filter((x) => x.type === u.type) : [];
    const list = same.length ? same : pool;
    const score = (x) => (u._price > 0 && x._price > 0 ? Math.abs(x._price - u._price) : 1e15 + (x.block === u.block ? 0 : 1e6) + Math.abs((x._floor || 0) - (u._floor || 0)));
    return list.map((x) => [x, score(x)]).sort((a, b) => a[1] - b[1]).slice(0, 4).map((e) => e[0]);
  }
  function drawerHtml(u) {
    const ppm = ppmText(u);
    const specs = [
      ['building', 'Toà', u.block ? blockLabel(u.block) : '—'],
      ['layers', 'Tầng', u.floor ? u._floorLabel : '—'],
      ['ruler', 'Diện tích', areaText(u)],
      ['home', 'Loại căn', u.type || '—'],
      ['compass', 'Hướng', u.direction || '—'],
      ['tag', 'Tình trạng', statusText(u) + (u._excl ? ' · Độc quyền' : '')],
    ];
    const cta = u._st === 'sold' ? 'Tư vấn căn tương tự' : (u._st === 'locked' ? 'Liên hệ tư vấn' : 'Nhận báo giá');
    const sim = similarUnits(u);
    const simTitle = u._st === 'available' ? 'Căn tương tự còn hàng' : 'Gợi ý căn còn hàng';
    return `<div class="dr-head">
        <div class="dr-head-main">
          <p class="dr-eyebrow">${esc(state.project)}${u.block ? ' · ' + esc(blockLabel(u.block)) : ''}</p>
          <h2 class="dr-title" id="drawerTitle">Căn ${esc(u.code)}</h2>
          <div class="badges">${statusBadges(u)}</div>
        </div>
        <button type="button" class="icon-btn" data-action="close-drawer" data-autofocus aria-label="Đóng chi tiết căn">${ic('x')}</button>
      </div>
      <div class="dr-scroll">
        <div class="dr-price">
          <div><p class="dr-lbl">Giá bán</p><p class="dr-price-val">${esc(priceText(u))}</p></div>
          ${ppm ? `<div><p class="dr-lbl" style="text-align:right">Đơn giá</p><p class="dr-ppm">${esc(ppm)}</p></div>` : ''}
        </div>
        <dl class="dr-specs">${specs.map(([i, l, v]) => `<div class="dr-spec"><dt>${ic(i)}<span>${esc(l)}</span></dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        <p class="dr-note">${ic('info')}<span>Giá và tình trạng mang tính tham khảo${state.updatedAt ? ` tại thời điểm cập nhật ${esc(fmtTime(state.updatedAt))}` : ''}. Liên hệ để nhận bảng tính dòng tiền và chiết khấu mới nhất.</span></p>
        ${sim.length ? `<div class="dr-sim"><h3>${simTitle}</h3><ul class="sim-list">${sim.map((x) => `<li><button type="button" class="sim" data-action="open-unit" data-idx="${x._i}">
          <span class="sim-code">${esc(x.code)}</span><span class="sim-meta">${esc([x.type, areaText(x), x.direction].filter(Boolean).join(' · '))}</span><span class="price">${esc(priceText(x))}</span></button></li>`).join('')}</ul></div>` : ''}
      </div>
      <div class="dr-foot">
        <button type="button" class="btn btn-grad" data-action="quote" data-idx="${u._i}">${ic('send')}${cta}</button>
        <button type="button" class="btn btn-ghost" data-action="share" data-idx="${u._i}">${ic('share')}Chia sẻ</button>
      </div>`;
  }
  function setInert(on) {
    ['.skip-link', '#siteHeader', '#main', '#siteFooter', '#mcta'].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  }
  function openDrawer(idx) {
    const u = state.units[idx];
    if (!u) return;
    const d = $('#drawer');
    const wasOpen = !d.hidden;
    if (!wasOpen) lastFocus = document.activeElement;
    state.openIdx = idx;
    $('#drawerPanel').innerHTML = drawerHtml(u);
    if (!wasOpen) {
      d.hidden = false;
      document.documentElement.classList.add('is-locked');
      setInert(true);
    }
    syncUrl();
    updateMcta();
    const btn = $('#drawerPanel [data-autofocus]');
    if (btn) btn.focus({ preventScroll: true });
  }
  function closeDrawer(noRestore) {
    const d = $('#drawer');
    if (d.hidden) return;
    const idx = state.openIdx;
    d.hidden = true;
    state.openIdx = -1;
    document.documentElement.classList.remove('is-locked');
    setInert(false);
    syncUrl();
    updateMcta();
    if (noRestore) return;
    let target = lastFocus && document.contains(lastFocus) ? lastFocus : null;
    if (!target && idx >= 0) target = $(`#invBody [data-action="open-unit"][data-idx="${idx}"]`);
    if (target && typeof target.focus === 'function') target.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------ *
   * Chọn dự án (menu)
   * ------------------------------------------------------------------ */
  function renderProjMenu() {
    const q = fold($('#projSearch').value.trim());
    const items = state.projects.map((p, i) => ({ p, i })).filter(({ p }) => !q || fold(p.name).includes(q));
    $('#projList').innerHTML = items.length
      ? items.map(({ p, i }) => {
        const sel = p.name === state.project;
        return `<li role="none"><button type="button" role="option" class="proj-opt" data-action="proj-pick" data-i="${i}" aria-selected="${sel}">
          <span class="pm-name">${esc(p.name)}</span>${p.hot ? '<span class="pm-hot">🔥 Hot</span>' : ''}${p.count ? `<span class="pm-count">${p.count} căn</span>` : (p.curated ? `<span class="pm-count">${p.curated.docs.length ? 'Tài liệu' : 'Sắp mở bán'}</span>` : '')}${sel ? ic('check') : '<span style="width:16px"></span>'}</button></li>`;
      }).join('')
      : '<li class="proj-empty" role="none">Không tìm thấy dự án phù hợp</li>';
  }
  function openProjMenu() {
    const m = $('#projMenu');
    m.hidden = false;
    $('#projBtn').setAttribute('aria-expanded', 'true');
    const searchWrap = $('#projSearchWrap');
    searchWrap.hidden = state.projects.length <= 6;
    $('#projSearch').value = '';
    renderProjMenu();
    const target = !searchWrap.hidden ? $('#projSearch') : ($('#projList [aria-selected="true"]') || $('#projList button'));
    if (target) target.focus();
  }
  function closeProjMenu(focusBtn) {
    const m = $('#projMenu');
    if (m.hidden) return;
    m.hidden = true;
    $('#projBtn').setAttribute('aria-expanded', 'false');
    if (focusBtn) $('#projBtn').focus();
  }

  /* ------------------------------------------------------------------ *
   * Chia sẻ, toast, liên hệ
   * ------------------------------------------------------------------ */
  let toastTimer = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 2800);
  }
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) { /* thử cách khác */ }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) { return false; }
  }
  async function shareUnit(u) {
    const url = unitUrl(u);
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (navigator.share && coarse) {
      try { await navigator.share({ title: `Căn ${u.code} · ${state.project}`, text: `Căn ${u.code} — ${priceText(u)} · ${state.project}`, url }); return; } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    const ok = await copyText(url);
    toast(ok ? `Đã sao chép link căn ${u.code}` : 'Không sao chép được — hãy sao chép link trên thanh địa chỉ.');
  }
  function showLeadForm() {
    $('#leadForm').hidden = false;
    $('#leadSuccess').hidden = true;
  }
  function quote(u, note) {
    showLeadForm();
    const sel = $('#lfProject');
    if (Array.from(sel.options).some((o) => o.value === state.project)) sel.value = state.project;
    if (u) $('#lfCode').value = u.code;
    const n = $('#lfNote');
    if (note && !n.value.trim()) n.value = note;
    else if (u && u._st === 'sold' && !n.value.trim()) n.value = `Tôi muốn được tư vấn căn tương tự căn ${u.code}.`;
    closeDrawer(true);
    goTo('lien-he');
    setTimeout(() => { const f = $('#lfName'); if (f) f.focus({ preventScroll: true }); }, reducedMotion() ? 0 : 500);
  }
  function setFieldErr(input, msg) {
    const err = $('#' + input.id + 'Err');
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (err) { err.textContent = msg; err.hidden = false; }
    } else {
      input.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; err.hidden = true; }
    }
  }
  const validPhone = (p) => /^(\+?84|0)\d{8,10}$/.test(p.replace(/[\s.\-()]/g, ''));
  async function submitLead(e) {
    e.preventDefault();
    const nameEl = $('#lfName'), phoneEl = $('#lfPhone');
    const name = nameEl.value.trim();
    const phone = phoneEl.value.trim();
    const code = $('#lfCode').value.trim();
    const note = $('#lfNote').value.trim();
    // Ô chọn hiển thị tên dự án; gửi về CRM đúng tên dự án trên hệ thống quỹ căn (apiName).
    const selName = $('#lfProject').value || state.project;
    const selProj = state.projects.find((x) => x.name === selName);
    const project = (selProj && selProj.apiName) || selName || 'Tư vấn chung';
    const formErr = $('#formErr');
    formErr.hidden = true;
    let bad = null;
    if (name.length < 2) { setFieldErr(nameEl, 'Vui lòng nhập họ và tên.'); bad = bad || nameEl; } else setFieldErr(nameEl, '');
    if (!phone) { setFieldErr(phoneEl, 'Vui lòng nhập số điện thoại.'); bad = bad || phoneEl; }
    else if (!validPhone(phone)) { setFieldErr(phoneEl, 'Số điện thoại chưa đúng định dạng (VD: 0909 123 456).'); bad = bad || phoneEl; }
    else setFieldErr(phoneEl, '');
    if (bad) { bad.focus(); return; }

    const payload = { project, name, phone };
    if (code) payload.code = code;
    if (state.ref) payload.ref = state.ref;
    if (note) payload.note = note;

    const btn = $('#leadSubmit');
    const old = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `${ic('loader', 'spin')}<span>Đang gửi…</span>`;
    try {
      const r = await Source.lead(payload);
      if (!r || !r.ok) { const er = new Error(str(r && r.error) || 'fail'); er.server = str(r && r.error); throw er; }
      $('#leadSuccessText').textContent = state.demo
        ? 'Chế độ minh hoạ: thông tin chưa được gửi đi. Trên trang thật, chuyên viên FBG Property sẽ liên hệ bạn trong thời gian sớm nhất.'
        : `Cảm ơn ${name}! Chuyên viên FBG Property sẽ liên hệ số ${phone} trong thời gian sớm nhất${code ? ` để tư vấn căn ${code}` : ''}.`;
      $('#leadForm').hidden = true;
      $('#leadSuccess').hidden = false;
      $('#leadSuccess').focus();
      $('#leadForm').reset();
      const sel = $('#lfProject');
      if (Array.from(sel.options).some((o) => o.value === state.project)) sel.value = state.project;
    } catch (err) {
      const h = contactHref();
      const alt = h.tel ? `gọi ${h.tel.label}` : `email ${CONFIG.EMAIL}`;
      formErr.innerHTML = `${ic('alert')}<span></span>`;
      formErr.querySelector('span').textContent = `Gửi chưa được${err && err.server ? ` (${err.server})` : ''}. Vui lòng thử lại hoặc ${alt}.`;
      formErr.hidden = false;
    } finally {
      btn.disabled = false;
      btn.innerHTML = old;
    }
  }

  /* ------------------------------------------------------------------ *
   * Thanh hành động mobile
   * ------------------------------------------------------------------ */
  let contactVisible = false;
  function updateMcta() {
    const m = $('#mcta');
    if (m) m.classList.toggle('is-hidden', contactVisible || state.openIdx >= 0);
  }

  /* ------------------------------------------------------------------ *
   * Sự kiện
   * ------------------------------------------------------------------ */
  function onClick(e) {
    const target = e.target;
    if (!(target instanceof Element)) return;
    cancelAnchor();

    if (!$('#projMenu').hidden && !target.closest('#switcher')) closeProjMenu(false);

    const link = target.closest('a[href^="#"]');
    if (link && !link.closest('[data-action]')) {
      const id = safeDecode(link.getAttribute('href').slice(1));
      if (ANCHORS.has(id)) {
        e.preventDefault();
        if (!goTo(id, { fromTab: link.classList.contains('tab') }) && id === 'tong-quan') window.scrollTo(0, 0);
        return;
      }
    }

    const el = target.closest('[data-action]');
    if (!el) {
      const row = target.closest('#invBody tr[data-idx]');
      if (row) openDrawer(Number(row.dataset.idx));
      return;
    }
    const act = el.dataset.action;
    const v = el.dataset.v;
    switch (act) {
      case 'open-unit': openDrawer(Number(el.dataset.idx)); break;
      case 'close-drawer': closeDrawer(); break;
      case 'view': setView(el.dataset.view); break;
      case 'status':
        state.f.status = v; state.shown = PAGE; renderInventory();
        { const b = $(`#statusChips [data-v="${v}"]`); if (b) b.focus({ preventScroll: true }); }
        break;
      case 'kpi-status':
        state.f.status = v; state.shown = PAGE; renderInventory(); goTo('gio-hang'); break;
      case 'filter-block':
        state.f.block = v || ''; state.shown = PAGE; renderInventory(); goTo('gio-hang'); break;
      case 'filter-type':
        state.f.type = v || ''; state.shown = PAGE; renderInventory(); goTo('gio-hang'); break;
      case 'goto': goTo(v); break;
      case 'rm-filter': {
        const k = el.dataset.k;
        if (k === 'q') { state.f.q = ''; $('#q').value = ''; } else if (k in state.f) state.f[k] = '';
        state.shown = PAGE; renderInventory();
        const next = $('#resultBar .fchip') || $('#q');
        if (next && !next.disabled) next.focus({ preventScroll: true });
        break;
      }
      case 'clear-filters':
        resetFilters(true); renderInventory();
        $('#q').focus({ preventScroll: true });
        break;
      case 'clear-q':
        $('#q').value = ''; state.f.q = ''; state.shown = PAGE; renderInventory(); $('#q').focus(); break;
      case 'toggle-filters': {
        const box = $('#filterSelects');
        const open = !box.classList.contains('is-open');
        box.classList.toggle('is-open', open);
        el.setAttribute('aria-expanded', String(open));
        break;
      }
      case 'sort': {
        const key = el.dataset.key;
        const [k, d] = state.f.sort.split('-');
        state.f.sort = k === key ? `${key}-${d === 'asc' ? 'desc' : 'asc'}` : `${key}-${key === 'floor' ? 'desc' : 'asc'}`;
        state.shown = PAGE;
        renderInventory();
        const again = $(`#invBody .th-sort[data-key="${key}"]`);
        if (again) again.focus({ preventScroll: true });
        break;
      }
      case 'more': appendMore(); break;
      case 'retry-summary': cancelAnchor(); loadSummary(); break;
      case 'retry-units': selectProject(state.project); break;
      case 'quote': quote(state.units[Number(el.dataset.idx)]); break;
      case 'share': { const u = state.units[Number(el.dataset.idx)]; if (u) shareUnit(u); break; }
      case 'copy-doc': {
        const cur = curCurated();
        const d = cur && cur.docs[Number(el.dataset.i)];
        if (d) copyText(d.url).then((ok) => toast(ok ? `Đã sao chép link “${d.label}”` : 'Không sao chép được — hãy mở link rồi sao chép từ thanh địa chỉ.'));
        break;
      }
      case 'copy-all-docs': {
        const cur = curCurated();
        if (cur && cur.docs.length) copyText(docsMessage(cur)).then((ok) => toast(ok ? 'Đã sao chép toàn bộ tài liệu — dán vào Zalo để gửi đại lý.' : 'Không sao chép được, vui lòng thử lại.'));
        break;
      }
      case 'ask-doc': quote(null, `Tôi muốn nhận tài liệu: ${el.dataset.name || 'hồ sơ dự án'}.`); break;
      case 'toggle-intro': {
        const p = $('#introText');
        if (!p) break;
        const clamped = p.classList.toggle('is-clamped');
        el.textContent = clamped ? 'Xem thêm' : 'Thu gọn';
        el.setAttribute('aria-expanded', String(!clamped));
        break;
      }
      case 'proj-toggle':
        if ($('#projMenu').hidden) openProjMenu(); else closeProjMenu(false);
        break;
      case 'proj-pick': {
        const p = state.projects[Number(el.dataset.i)];
        closeProjMenu(true);
        if (p && p.name !== state.project) {
          closeDrawer(true);
          selectProject(p.name);
        }
        break;
      }
      case 'lead-reset':
        showLeadForm(); $('#formErr').hidden = true; $('#lfName').focus(); break;
      default: break;
    }
  }

  function onKeydown(e) {
    const drawerOpen = !$('#drawer').hidden;
    if (drawerOpen) {
      if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
      if (e.key === 'Tab') {
        const f = $$('#drawerPanel button, #drawerPanel a[href], #drawerPanel [tabindex]:not([tabindex="-1"])')
          .filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!$('#drawerPanel').contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
      return;
    }
    if (!$('#projMenu').hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeProjMenu(true); return; }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const opts = $$('#projList .proj-opt');
        if (!opts.length) return;
        e.preventDefault();
        const i = opts.indexOf(document.activeElement);
        const next = e.key === 'ArrowDown' ? (i < 0 ? 0 : Math.min(opts.length - 1, i + 1)) : (i <= 0 ? (i === 0 && !$('#projSearchWrap').hidden ? -1 : 0) : i - 1);
        if (next === -1) $('#projSearch').focus(); else opts[next].focus();
      }
      if (e.key === 'Tab' && !$('#projMenu').contains(document.activeElement)) closeProjMenu(false);
    }
    if (['PageDown', 'PageUp', 'End', 'Home', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) { userScrolled = true; cancelAnchor(); }
  }

  function bind() {
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    ['wheel', 'touchmove'].forEach((ev) => window.addEventListener(ev, () => { userScrolled = true; spyLock = ''; cancelAnchor(); }, { passive: true, once: false }));
    window.addEventListener('scroll', scheduleSpy, { passive: true });
    window.addEventListener('resize', scheduleSpy, { passive: true });
    window.addEventListener('hashchange', () => {
      const id = safeDecode(location.hash.slice(1));
      if (ANCHORS.has(id)) goTo(id);
    });

    const q = $('#q');
    const applyQ = debounce(() => { state.f.q = q.value; state.shown = PAGE; renderInventory(); }, 160);
    q.addEventListener('input', () => { $('.search-clear').hidden = !q.value; applyQ(); });
    q.addEventListener('keydown', (e) => { if (e.key === 'Escape' && q.value) { e.stopPropagation(); q.value = ''; state.f.q = ''; renderInventory(); } });

    $$('#filterSelects select').forEach((sel) => {
      sel.addEventListener('change', () => {
        const k = sel.dataset.f;
        state.f[k] = sel.value || (k === 'sort' ? 'default' : '');
        state.shown = PAGE;
        renderInventory();
      });
    });

    $('#projSearch').addEventListener('input', renderProjMenu);
    $('#projSearch').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const b = $('#projList .proj-opt'); if (b) { e.preventDefault(); b.click(); } }
    });

    const form = $('#leadForm');
    form.addEventListener('submit', submitLead);
    ['#lfName', '#lfPhone'].forEach((sel) => $(sel).addEventListener('input', (e) => {
      if (e.target.getAttribute('aria-invalid')) setFieldErr(e.target, '');
    }));

    const header = $('#siteHeader');
    const setH = () => document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    setH();
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => { setH(); reanchorSoon(); }).observe(header);
      new ResizeObserver(reanchorSoon).observe($('#main'));
    } else window.addEventListener('resize', setH);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reanchorSoon).catch(() => {});
    window.addEventListener('load', reanchorSoon);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => { contactVisible = en.isIntersecting; });
        updateMcta();
      }, { threshold: 0.12 }).observe($('#lien-he'));
    }
  }

  /* ------------------------------------------------------------------ *
   * Khởi động
   * ------------------------------------------------------------------ */
  function boot() {
    if (state.demo) {
      $('#demoBanner').hidden = false;
      try {
        const u = new URL(location.href);
        u.searchParams.delete('demo');
        u.searchParams.delete('unit');
        $('#demoExit').href = u.pathname + (u.searchParams.toString() ? '?' + u.searchParams.toString() : '');
      } catch (e) { /* bỏ qua */ }
    }
    renderContactStatic();
    bind();
    const id = safeDecode(location.hash.slice(1));
    if (id && ANCHORS.has(id)) {
      armAnchor(id);
      if (id === 'bang-hang') state.view = 'matrix';
    }
    loadSummary();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
