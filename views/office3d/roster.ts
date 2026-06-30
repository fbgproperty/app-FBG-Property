// Đội ngũ AI cho văn phòng 3D — bám đúng 3 phòng OS đã build.
export type Dept = {
  key: string;
  label: string;
  route: string;
  color: string;       // màu nhân vật
  zone: string;        // màu nền khu
  center: [number, number]; // [x, z] tâm khu
  agents: { n: string; r: string }[];
};

export const HERMES = { n: 'Hermes', r: 'Tổng chỉ huy (COO AI)', color: '#7c3aed', route: '/tro-ly-ai' };

export const DEPTS: Dept[] = [
  {
    key: 'mkt', label: 'Marketing', route: '/marketing', color: '#ec4899', zone: '#ec4899', center: [-5, 0.5],
    agents: [
      { n: 'Giám đốc CL', r: 'Chiến lược chiến dịch' }, { n: 'Copywriter', r: 'Viết nội dung RAG' },
      { n: 'Designer', r: 'Ảnh AI' }, { n: 'Video editor', r: 'Dựng video' },
      { n: 'Channel mgr', r: 'Đa kênh' }, { n: 'Ads mgr', r: 'Chiến dịch ads' },
      { n: 'Lead hunter', r: 'Săn lead' }, { n: 'Nurture bot', r: 'Chăm khách' },
      { n: 'Community', r: 'Trực inbox' }, { n: 'Analyst', r: 'Báo cáo ROI' },
    ],
  },
  {
    key: 'bds', label: 'Bất động sản', route: '/san-bds', color: '#6366f1', zone: '#6366f1', center: [0, -5],
    agents: [
      { n: 'Giám đốc sàn', r: 'Danh mục' }, { n: 'Sales planner', r: 'Kế hoạch bán' },
      { n: 'Market res.', r: 'Thị trường' }, { n: 'Pricing', r: 'Định giá' },
      { n: 'Auto-poster', r: 'Đăng tin' }, { n: 'Project content', r: 'Hồ sơ dự án' },
      { n: 'Listing mgr', r: 'Rổ hàng' }, { n: 'Inventory', r: 'Giỏ hàng' },
      { n: 'Investor', r: 'Khớp NĐT' }, { n: 'Deal coord.', r: 'Phân khách' },
    ],
  },
  {
    key: 'kd', label: 'Kinh doanh', route: '/kinh-doanh', color: '#10b981', zone: '#10b981', center: [5, 0.5],
    agents: [
      { n: 'Giám đốc KD', r: 'Pipeline' }, { n: 'Lead scorer', r: 'Chấm điểm' },
      { n: 'Khách 360', r: 'Hồ sơ 360' }, { n: 'Next-action', r: 'Hành động kế tiếp' },
      { n: 'Nurture str.', r: 'Playbook' }, { n: 'Sale matcher', r: 'Phân sale' },
      { n: 'Forecaster', r: 'Dự báo' }, { n: 'Báo cáo KD', r: 'Báo cáo' },
      { n: 'Churn', r: 'Tái kích hoạt' }, { n: 'Deal coach', r: 'Chốt deal' },
    ],
  },
];
