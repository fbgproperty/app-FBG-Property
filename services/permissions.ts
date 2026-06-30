// Phân quyền theo vai trò (role) — dùng chung cho Sidebar + App routes.

export const ROLE_LABELS: Record<string, string> = {
  ceo: 'CEO',
  gd_du_an: 'Giám đốc dự án',
  gd_kinh_doanh: 'Giám đốc kinh doanh',
  tp_kinh_doanh: 'Trưởng phòng kinh doanh',
  sale: 'Nhân viên sale',
  ctv: 'Sale cộng tác viên',
  admin_du_an: 'Admin quản lý dự án',
  ke_toan: 'Kế toán',
  marketing: 'Marketing',
};

// Mỗi vai trò → các route được phép. '*' = full.
const PERMS: Record<string, string[]> = {
  ceo: ['*'],
  gd_du_an: ['/dashboard', '/tro-ly-ai', '/bat-dong-san', '/deployment', '/cdp', '/ai-agents', '/ai-prospects', '/leads', '/org'],
  gd_kinh_doanh: ['/dashboard', '/tro-ly-ai', '/bat-dong-san', '/deployment', '/cdp', '/ai-agents', '/ai-prospects', '/leads', '/org'],
  tp_kinh_doanh: ['/dashboard', '/tro-ly-ai', '/bat-dong-san', '/deployment', '/cdp', '/ai-agents', '/ai-prospects', '/my-customers', '/org'],
  sale: ['/dashboard', '/tro-ly-ai', '/bat-dong-san', '/sale-projects', '/my-customers', '/org'],
  ctv: ['/dashboard', '/tro-ly-ai', '/sale-projects', '/my-customers', '/org'],
  admin_du_an: ['/dashboard', '/tro-ly-ai', '/bat-dong-san', '/deployment', '/cdp', '/org'],
  ke_toan: ['/dashboard', '/billing', '/leads', '/org'],
  marketing: ['/dashboard', '/bat-dong-san', '/quang-cao', '/ai-prospects', '/org'],
};

export const getRole = (): string =>
  (typeof localStorage !== 'undefined' && localStorage.getItem('fbg_role')) || 'ctv';

export const canAccess = (route: string, role: string = getRole()): boolean => {
  const p = PERMS[role] || PERMS.ctv;
  if (p.includes('*')) return true;
  if (route === '/team' || route.startsWith('/team/')) return true; // hub gộp: ai cũng vào được, nội dung con tự lọc
  if (route === '/van-hanh' || route.startsWith('/van-hanh/')) return true; // Vận hành OS: gộp đội ngũ AI + tổ chức
  if (route === '/marketing') return ['ceo', 'gd_du_an', 'gd_kinh_doanh', 'tp_kinh_doanh', 'admin_du_an', 'marketing', 'sale', 'ctv'].includes(role);
  if (route === '/san-bds') return ['ceo', 'gd_du_an', 'gd_kinh_doanh', 'tp_kinh_doanh', 'admin_du_an', 'marketing', 'sale', 'ctv'].includes(role);
  if (route === '/kinh-doanh') return ['ceo', 'gd_du_an', 'gd_kinh_doanh', 'tp_kinh_doanh', 'admin_du_an', 'marketing', 'sale', 'ctv'].includes(role);
  return p.some((r) => route === r || route.startsWith(r + '/'));
};

// Vai trò có quyền biên tập/quản trị nội dung (admin-level trong UI cũ)
export const isManagerRole = (role: string = getRole()): boolean =>
  ['ceo', 'gd_du_an', 'gd_kinh_doanh', 'tp_kinh_doanh', 'admin_du_an'].includes(role);

export const isAdminRole = (role: string = getRole()): boolean =>
  ['ceo', 'gd_du_an', 'admin_du_an'].includes(role);
