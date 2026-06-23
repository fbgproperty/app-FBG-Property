/**
 * ============================================================
 *  DEMO BACKEND (KHÔNG cần server thật)
 * ------------------------------------------------------------
 *  Mục đích: cho phép chạy/triển khai bản DEMO của RaiAgent khi
 *  CHƯA có backend .NET. Khi DEMO_MODE = true, mọi lời gọi API
 *  trong apiService sẽ được trả về dữ liệu mẫu ở đây thay vì fetch.
 *
 *  ⚠️ Đây là DỮ LIỆU GIẢ để trình diễn giao diện. Khi có backend
 *  thật, đặt DEMO_MODE = false (hoặc bỏ chặn trong apiService).
 *  Dữ liệu lấy bối cảnh BĐS Đà Nẵng để demo cho FBG Property.
 * ============================================================
 */

export const DEMO_MODE = false;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
let _seq = 1000;
const nid = (p = 'demo') => `${p}-${++_seq}`;
const iso = (daysAgo = 0) =>
  new Date(Date.now() - daysAgo * 86400_000).toISOString();

// ───────────────────────── DỰ ÁN (Project[]) ─────────────────────────
const PROJECT_NAMES = [
  'Sun Ponte Residence',
  'The Filmore Đà Nẵng',
  'Sun Cosmo Residence',
  'Asiana Đà Nẵng',
  'Hoà Xuân Riverside',
];
const PROJECTS = PROJECT_NAMES.map((name, i) => ({
  id: `P${i + 1}`,
  name,
  location: ['Sơn Trà', 'Hải Châu', 'Ngũ Hành Sơn', 'Thanh Khê', 'Cẩm Lệ'][i],
  province: 'Đà Nẵng',
  investor: ['Sun Group', 'Filmore', 'Sun Group', 'Gotec Land', 'Hoà Bình'][i],
  projectType: i === 4 ? 'Đất nền' : 'Căn hộ',
  units: 400 + i * 120,
  available: 60 + i * 18,
  priceRange: `${3 + i} - ${8 + i} tỷ`,
  status: 'Selling',
  imageUrl: '',
  description: 'Dự án cao cấp ven sông Hàn, pháp lý đầy đủ, bàn giao hoàn thiện.',
  products: [],
  documents: [],
}));

// ──────────────────────── KHÁCH HÀNG (Customer[]) ────────────────────────
const FIRST = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const LAST = ['Văn An', 'Thị Bình', 'Minh Châu', 'Quốc Dũng', 'Thu Hà', 'Hữu Khang', 'Ngọc Lan', 'Thanh Mai', 'Đức Nam', 'Hồng Phúc', 'Gia Huy', 'Kim Oanh'];
const SOURCES = ['Facebook', 'Zalo', 'Google Forms', 'Tiktok', 'Google Sheets'];
const STATUSES = ['Chuyển giao Sales', 'Tiềm năng', 'Quan tâm', 'Mới', 'Chuyển giao Sales', 'Tiềm năng', 'Quan tâm', 'Mới', 'Chuyển giao Sales', 'Tiềm năng', 'Quan tâm', 'Mới'];
const NEEDS = [
  'Khách VIP, sẵn sàng đặt cọc nếu pháp lý ổn.',
  'Tìm căn 2PN view sông để ở.',
  'Đầu tư cho thuê, cần dòng tiền tốt.',
  'Quan tâm chính sách chiết khấu & ân hạn gốc.',
  'Mua ở thực, ưu tiên bàn giao sớm.',
];
const CUSTOMERS = Array.from({ length: 12 }).map((_, i) => {
  const name = `${FIRST[i]} ${LAST[i]}`;
  const proj = PROJECTS[i % PROJECTS.length];
  return {
    id: `C${i + 1}`,
    name,
    email: `khach${i + 1}@gmail.com`,
    phone: `09${(10000000 + i * 137913).toString().slice(0, 8)}`,
    address: 'Đà Nẵng',
    interestedProject: proj.name,
    interests: ['Đầu tư', 'Ở thực'].slice(0, (i % 2) + 1),
    lastInteraction: ['Vừa xong', '15 phút trước', '1 giờ trước', 'Hôm qua'][i % 4],
    projectName: proj.name,
    unitName: `${['A', 'B', 'C'][i % 3]}-${10 + i}0${i % 9}`,
    status: STATUSES[i],
    score: 70 + ((i * 7) % 30),
    source: SOURCES[i % SOURCES.length],
    channel: 'Website',
    needs: NEEDS[i % NEEDS.length],
    intent: ['Đầu tư', 'Ở thực', 'Tìm hiểu'][i % 3],
    conversationSummary: 'Khách quan tâm chính sách & tiến độ thanh toán.',
    aiAssessment: i % 3 === 0 ? 'Lead nóng, tỷ lệ chốt > 90%.' : 'Cần thêm thời gian tư vấn.',
    matchingProjects: [{ projectName: proj.name, matchPercentage: 90 + (i % 9), reason: 'Phù hợp ngân sách & khu vực' }],
    interactionHistory: [{ date: iso(i), action: 'Tư vấn qua Zalo', content: 'Trao đổi lịch thanh toán', channel: 'Zalo OA', sentiment: 'Tích cực' }],
    preferredChannels: ['call', 'zalo', 'gmail'].slice(0, (i % 3) + 1),
  };
});

// ApiProjectItem (cho màn "Danh mục Dự án" — shape khác Project)
const PROJ_STATUS = ['Selling', 'Selling', 'Selling', 'Sold Out', 'Selling'];
const PROJECTS_API = PROJECTS.map((p, i) => ({
  id: p.id,
  code: `DA${i + 1}`,
  name: p.name,
  location: p.location,
  statusValue: PROJ_STATUS[i],
  statusLabel: PROJ_STATUS[i] === 'Sold Out' ? 'Đã bán' : 'Đang bán',
  source: p.investor,
  countryName: p.province,
  priceFrom: 3 + i,
  priceTo: 8 + i,
  currencySymbol: 'tỷ',
  imagesJson: [],
  description: p.description,
  createdAt: iso(30 - i),
  updatedAt: null,
}));

// CustomerDto (cho CDP, có phân trang)
const CUSTOMERS_DTO = CUSTOMERS.map((c) => ({
  id: c.id,
  name: c.name,
  position: '',
  company: '',
  description: c.needs,
  country: 'Vietnam',
  zip: '',
  city: 'Đà Nẵng',
  state: '',
  address: c.address,
  status: c.status,
  source: c.source,
  email: c.email,
  website: '',
  phoneNumber: c.phone,
  leadValue: 1000 + Number(c.score) * 25,
  tags: c.intent,
  createdAt: iso(Number(c.id.slice(1))),
  updatedAt: null,
  metadataJson: null,
}));

// ──────────────────────── NHÂN VIÊN AI (AgentDto[]) ────────────────────────
const AGENT_DEFS = [
  { name: 'Trợ lý Hằng', role: 'Tư vấn dự án', proj: 'Sun Ponte Residence', rate: 88, inter: 1250, care: 42, status: 'Active' },
  { name: 'Trợ lý Minh', role: 'Phân loại Lead', proj: 'The Filmore Đà Nẵng', rate: 92, inter: 3400, care: 156, status: 'Active' },
  { name: 'Trợ lý Lan', role: 'Chăm sóc khách', proj: 'Sun Cosmo Residence', rate: 79, inter: 980, care: 73, status: 'Idle' },
  { name: 'Trợ lý Phúc', role: 'Tư vấn dự án', proj: 'Asiana Đà Nẵng', rate: 85, inter: 2110, care: 95, status: 'Active' },
];
const AGENTS_DTO = AGENT_DEFS.map((a, i) => ({
  id: `A${i + 1}`,
  name: a.name,
  status: a.status,
  channelsJson: JSON.stringify(['zalo', 'facebook', 'gmail']),
  configJson: JSON.stringify({
    role: a.role,
    assignedProject: a.proj,
    successRate: a.rate,
    interactionsCount: a.inter,
    caringCount: a.care,
  }),
}));

// ──────────────────────── LEADS (LeadDto[], phân trang) ────────────────────────
const LEADS = Array.from({ length: 11 }).map((_, i) => {
  const c = CUSTOMERS[i % CUSTOMERS.length];
  return {
    id: nid('lead'),
    customerId: c.id,
    projectId: PROJECTS[i % PROJECTS.length].id,
    unitId: null,
    stage: ['New', 'Qualified'][i % 2],
    assignedToUserId: null,
    source: c.source,
    score: 90 + (i % 10),
    createdAt: iso(i),
    updatedAt: null,
    customerName: c.name,
    projectName: PROJECTS[i % PROJECTS.length].name,
    unitName: c.unitName,
    phoneNumber: c.phone,
  };
});

// ──────────────────────── BĐS (RaiPropertyDto[], phân trang) ────────────────────────
const RAI_PROPS = Array.from({ length: 9 }).map((_, i) => {
  const proj = PROJECTS[i % PROJECTS.length];
  const price = (2.4 + i * 0.6) * 1_000_000_000;
  return {
    id: `RP${i + 1}`,
    source: ['Internal', 'Vinhomes', 'Sun Group'][i % 3],
    externalId: 1000 + i,
    projectExternalId: null,
    projectId: proj.id,
    name: `${proj.name} • Căn ${['A', 'B', 'C'][i % 3]}-${12 + i}0${i % 8}`,
    description: 'Căn góc, view sông Hàn, full nội thất cao cấp.',
    location: `${proj.location}, Đà Nẵng`,
    imagesJson: [],
    typeLabel: i === 8 ? 'Đất nền' : 'Căn hộ',
    statusLabel: i % 4 === 3 ? 'Đã bán' : 'Đang bán',
    isFeatured: i % 3 === 0,
    numberBedroom: 1 + (i % 3),
    numberBathroom: 1 + (i % 2),
    numberFloor: 1,
    square: 45 + i * 7,
    price,
    priceFormatted: `${(price / 1_000_000_000).toFixed(1)} tỷ`,
    currencyId: 1,
    currencyTitle: 'VND',
    currencySymbol: '₫',
    cityId: 48,
    cityName: 'Đà Nẵng',
    stateId: null,
    stateName: null,
    countryId: 1,
    countryName: 'Việt Nam',
    uniqueId: `UID${i}`,
    sourceCreatedAt: iso(i + 3),
    sourceUpdatedAt: iso(i),
    url: '#',
    slug: `can-ho-${i + 1}`,
    syncedAt: iso(i),
    views: 120 + i * 33,
  };
});

// ──────────────────────── BILLING ────────────────────────
const BILLING = {
  details: [
    { apiName: 'Gemini 3 Pro API', requests: 12500, cost: 250.5, change: 12.5 },
    { apiName: 'Gemini 3 Flash API', requests: 41200, cost: 86.3, change: -4.1 },
    { apiName: 'Cloud Run', requests: 0, cost: 42.0, change: 1.2 },
    { apiName: 'Cloud SQL (PostgreSQL)', requests: 0, cost: 64.8, change: 0.8 },
    { apiName: 'Cloud Storage', requests: 0, cost: 9.4, change: 0.2 },
  ],
  trend: Array.from({ length: 7 }).map((_, i) => ({
    date: `${15 + i}/06`,
    cost: 38 + Math.round(Math.sin(i) * 8 + i * 2),
  })),
};

// ──────────────────────── CAMPAIGNS (CampaignDtoApi[]) ────────────────────────
const CAMPAIGNS = [
  { Id: nid('camp'), Name: 'Ra mắt Sun Ponte Q3', Status: 'Active', StartAt: iso(20), EndAt: iso(-40), AgentsAiActive: 2, TargetLeads: 500, CurrentLeads: 318, LimitAiAgent: 3, Progress: 64 },
  { Id: nid('camp'), Name: 'Filmore - tệp đầu tư', Status: 'Paused', StartAt: iso(10), EndAt: iso(-20), AgentsAiActive: 1, TargetLeads: 300, CurrentLeads: 96, LimitAiAgent: 2, Progress: 32 },
];

// ──────────────────────── IDENTITY ────────────────────────
const ROLES = [
  { id: 'r1', name: 'Quản trị viên' },
  { id: 'r2', name: 'Trưởng phòng KD' },
  { id: 'r3', name: 'Nhân viên Sales' },
];
const USERS = [
  { id: 'u1', userName: 'admin', email: 'admin@raiagent.vn', fullName: 'Quản trị viên', phoneNumber: '0905000001', emailConfirmed: true, twoFactorEnabled: false, roles: [{ id: 'r1', name: 'Quản trị viên' }] },
  { id: 'u2', userName: 'tpkd', email: 'tpkd@raiagent.vn', fullName: 'Trần Thị Bình', phoneNumber: '0905000002', emailConfirmed: true, twoFactorEnabled: false, roles: [{ id: 'r2', name: 'Trưởng phòng KD' }] },
  { id: 'u3', userName: 'sales01', email: 'sales01@raiagent.vn', fullName: 'Lê Minh Châu', phoneNumber: '0905000003', emailConfirmed: false, twoFactorEnabled: false, roles: [{ id: 'r3', name: 'Nhân viên Sales' }] },
];
const PERMS = ['dashboard.view', 'leads.view', 'leads.edit', 'customers.view', 'customers.edit', 'agents.view', 'agents.manage'];
const PROFILE = {
  userName: 'admin',
  email: 'admin@raiagent.vn',
  fullName: 'Quản trị viên (Demo)',
  phoneNumber: '0905 000 001',
  emailConfirmed: true,
  twoFactorEnabled: false,
  role: 'Quản trị viên',
  joinDate: '21/02/2026',
};

// ──────────────────────── HELPERS ────────────────────────
function readPaging(endpoint: string) {
  const qs = endpoint.split('?')[1] || '';
  const sp = new URLSearchParams(qs);
  const page = Math.max(1, Number(sp.get('page') || 1));
  const pageSize = Math.max(1, Number(sp.get('pageSize') || 10));
  return { page, pageSize };
}
function paginate(arr: any[], endpoint: string) {
  const { page, pageSize } = readPaging(endpoint);
  const start = (page - 1) * pageSize;
  return { items: arr.slice(start, start + pageSize), page, pageSize, total: arr.length };
}
function customerDetail(path: string) {
  const id = path.split('/')[2];
  const base = CUSTOMERS_DTO.find((c) => c.id === id) || CUSTOMERS_DTO[0];
  return {
    ...base,
    leads: LEADS.slice(0, 2).map((l) => ({ id: l.id, stage: l.stage, score: l.score, source: l.source, projectId: l.projectId, unitId: null, createdAt: l.createdAt, projectName: l.projectName, unitName: l.unitName })),
    conversations: [{ id: 'cv1', channel: 'Zalo OA', status: 'Active', startedAt: iso(2), lastMessageAt: iso(0), agentId: 'A1' }],
    messages: [
      { id: 'm1', conversationId: 'cv1', senderType: 'Customer', senderId: base.id, content: 'Cho mình xin bảng giá căn 2PN ạ.', createdAt: iso(2) },
      { id: 'm2', conversationId: 'cv1', senderType: 'Agent', senderId: 'A1', content: 'Dạ em gửi anh/chị bảng giá và chính sách mới nhất ạ.', createdAt: iso(2) },
    ],
    events: [{ id: 'e1', channel: 'Website', eventType: 'view_project', eventTime: iso(1), payloadJson: null }],
    interests: [{ id: 'it1', level: 4, note: 'Quan tâm view sông', projectId: 'P1', unitId: null, createdAt: iso(1), projectName: 'Sun Ponte Residence', unitName: 'A-1203' }],
  };
}

// ──────────────────────── ROUTER ────────────────────────
export async function demoFetch<T = any>(method: string, endpoint: string, body?: any): Promise<T> {
  await delay(160 + Math.floor(Math.random() * 220));
  const m = (method || 'GET').toUpperCase();
  const path = endpoint.split('?')[0];
  const hasPage = /[?&]page=/.test(endpoint);
  const R = (v: any) => v as unknown as T;

  if (m === 'GET') {
    if (path === '/dashboard/ai')
      return R({
        stats: {
          activeProjects: PROJECTS.length,
          totalLeads: 1280,
          activeAgents: AGENTS_DTO.filter((a) => a.status === 'Active').length,
          revenue: '$452',
        },
        chartData: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((name, i) => ({ name, leads: 120 + Math.round(Math.sin(i + 1) * 60 + i * 18) })),
      });
    if (path === '/agents') return R(AGENTS_DTO);
    if (path === '/projects') return R(hasPage ? paginate(PROJECTS_API, endpoint) : PROJECTS);
    if (path.startsWith('/projects/')) return R(PROJECTS.find((p) => p.id === path.split('/')[2]) || PROJECTS[0]);
    if (path === '/leads') return R(paginate(LEADS, endpoint));
    if (/^\/customers\/[^/]+\/detail$/.test(path)) return R(customerDetail(path));
    if (path === '/customers') return R(hasPage ? paginate(CUSTOMERS_DTO, endpoint) : CUSTOMERS);
    if (path === '/rai-properties/sources') return R(['Internal', 'Vinhomes', 'Sun Group', 'Novaland']);
    if (path === '/rai-properties') return R(paginate(RAI_PROPS, endpoint));
    if (path.startsWith('/rai-properties/')) return R(RAI_PROPS.find((p) => p.id === path.split('/')[2]) || RAI_PROPS[0]);
    if (path === '/billing') return R(BILLING);
    if (path === '/campaigns') return R(CAMPAIGNS);
    if (/^\/campaigns\/[^/]+\/assignments$/.test(path)) return R([]);
    if (/^\/campaigns\/[^/]+\/project$/.test(path)) return R({ campaignId: path.split('/')[2], projectId: PROJECTS[0].id });
    if (path === '/users') return R(USERS);
    if (path === '/roles') return R(ROLES);
    if (/^\/roles\/[^/]+\/permissions$/.test(path)) return R(PERMS.slice(0, 4));
    if (path.startsWith('/roles/')) {
      const role = ROLES.find((r) => r.id === path.split('/')[2]) || ROLES[0];
      return R({ ...role, permissions: PERMS.slice(0, 4) });
    }
    if (path === '/account/profile') return R(PROFILE);
    return R([]); // mặc định an toàn cho mọi GET lạ
  }

  if (m === 'POST') {
    if (path === '/auth/password/forgot') return R({ message: 'Demo: liên kết đặt lại mật khẩu đã được gửi (giả lập).' });
    if (path === '/dashboard/simulate-leads')
      return R(
        Array.from({ length: 5 }).map((_, i) => ({
          id: nid('newlead'),
          fullName: `Khách mới ${i + 1}`,
          source: SOURCES[i % SOURCES.length],
          phone: `09${(80000000 + i * 11111).toString().slice(0, 8)}`,
          createdAt: iso(0),
        }))
      );
    if (path === '/dashboard/run-ai-process')
      return R({
        steps: [
          { progress: 20, message: 'AI: Đang đọc nhu cầu khách hàng mới...', delayMs: 500 },
          { progress: 45, message: 'AI: Chấm điểm tiềm năng (Gemini)...', delayMs: 600 },
          { progress: 70, message: 'AI: Khớp dự án phù hợp ngân sách...', delayMs: 600 },
          { progress: 90, message: 'AI: Định danh & gộp hồ sơ CDP...', delayMs: 500 },
          { progress: 100, message: 'Hoàn tất quét & chấm điểm!', delayMs: 300 },
        ],
      });
    if (path === '/sync/rai/properties') return R({ ok: true, synced: RAI_PROPS.length });
    if (path === '/rai-crm/leads') return R({ ok: true, imported: LEADS.length });
    if (path === '/agents') return R({ id: nid('agent'), ...(body || {}) });
    if (path === '/campaigns') return R({ id: nid('camp') });
    if (/\/assignments$/.test(path)) return R({ id: nid('asg') });
    if (path === '/roles') return R({ id: nid('role'), name: body?.name || 'Vai trò mới' });
    if (path === '/users') return R({ id: nid('user'), ...(body || {}) });
    return R({ id: nid() }); // POST lạ → trả id giả
  }

  // PUT / PATCH / DELETE → coi như 204 No Content
  return R(undefined);
}
