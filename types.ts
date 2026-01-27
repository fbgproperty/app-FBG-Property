
export interface ProjectDocument {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'legal';
  url: string;
  size: string;
  date: string;
}

export interface ProjectProduct {
  id: string;
  code: string;
  price: string;
  type: 'CĂN HỘ' | 'ĐẤT NỀN' | 'NHÀ PHỐ';
  landArea: string;
  constructionArea: string;
  direction: string;
  subdivision: 'ĐẢO DỪA' | 'KINH ĐÔ' | 'SAN HÔ';
  status: 'Còn hàng' | 'Hết hàng';
}

export interface Project {
  id: string;
  name: string;
  location: string;
  province: string;
  investor: string;
  projectType: 'Căn hộ' | 'Đất nền' | 'Nhà phố';
  units: number;
  available: number;
  priceRange: string;
  status: 'Planning' | 'Selling' | 'Sold Out';
  imageUrl: string;
  description: string;
  aiAnalysis?: string;
  products: ProjectProduct[];
  documents: ProjectDocument[];
}

export interface InteractionLog {
  date: string;
  action: string;
  content: string;
  channel: 'Zalo OA' | 'Facebook' | 'SMS' | 'Gọi điện' | 'Email';
  sentiment: 'Tích cực' | 'Trung lập' | 'Cần chú ý';
}

export interface MatchingProject {
  projectName: string;
  matchPercentage: number;
  reason: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  interestedProject: string; 
  interests: string[];
  lastInteraction: string;
  projectName: string;
  unitName: string;
  status: 'Mới' | 'Quan tâm' | 'Tiềm năng' | 'Chuyển giao Sales';
  score: number;
  source: 'Facebook' | 'Zalo' | 'Youtube' | 'Tiktok' | 'Google Sheets' | 'Google Forms' | 'BigQuery' | 'Cloud SQL' | 'Firestore';
  channel: 'Website' | 'Chat' | 'Email' | 'Zalo' | 'Facebook';
  needs: string; 
  intent: 'Đầu tư' | 'Ở thực' | 'Tìm hiểu'; 
  conversationSummary: string; 
  aiAssessment: string; 
  // Fields for Deep Insights
  aiDetailedAnalysis?: string;
  matchingProjects: MatchingProject[];
  interactionHistory: InteractionLog[];
  preferredChannels: string[];
}

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  assignedProject: string;
  status: 'Idle' | 'Active' | 'Optimizing';
  successRate: number;
  interactionsCount: number;
  caringCount: number;
}

export interface Lead {
  id: string;
  customerId: string;
  customerName: string;
  projectId: string;
  projectName: string;
  dateCreated: string;
  salesOwner?: string;
  stage: 'Chưa phân phối' | 'Đã liên hệ' | 'Đang thương thảo' | 'Thành công' | 'Thất bại';
}

export interface BillingData {
  apiName: string;
  requests: number;
  cost: number;
  change: number;
}
