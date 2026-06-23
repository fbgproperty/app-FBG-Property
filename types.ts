
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

// =====================
// Core DTOs
// =====================
export type CustomerDto = {
  id: string;

  name: string;
  position?: string | null;
  company?: string | null;
  description?: string | null;

  country?: string | null;
  zip?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;

  status?: string | null;
  source?: string | null;

  email?: string | null;
  website?: string | null;
  phoneNumber?: string | null;

  leadValue?: number | null;
  tags?: string | null;

  // (khuyến nghị) để hiển thị UI "Ngày tạo"
  createdAt?: string | null;
  updatedAt?: string | null;
  metadataJson?: string | null;
};

export type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

// =====================
// ViewModels for UI
// =====================
export type CustomerVM = {
  id: string;

  fullName: string; // giữ để UI cũ ít đổi
  phone?: string;
  email?: string;
  source: string;
  tags?: string;

  // fields bổ sung
  position?: string;
  company?: string;
  statusText?: string;
  website?: string;
  leadValue?: number | null;
  address?: string;

  score: number; // placeholder
  status: string; // placeholder UI
  needs?: string; // placeholder UI
};

// =====================
// Detail sub-models
// =====================
export type LeadVM = {
  id: string;
  stage: string;
  score: number;
  source: string;
  projectId?: string | null;
  unitId?: string | null;
  createdAt: string;
  projectName?: string;
  unitName?: string;
};

export type ConversationVM = {
  id: string;
  channel?: string | null;
  status: string; // Active/Closed...
  startedAt: string;
  lastMessageAt: string;
  agentId?: string | null;
};

export type MessageVM = {
  id: string;
  conversationId: string;
  senderType: string; // Customer/Agent/System...
  senderId?: string | null;
  content: string;
  createdAt: string;
};

export type CustomerEventVM = {
  id: string;
  channel: string;
  eventType: string;
  eventTime: string;
  payloadJson?: string | null;
};

export type CustomerInterestVM = {
  id: string;
  level: number;
  note?: string | null;
  projectId?: string | null;
  unitId?: string | null;
  createdAt: string;
  projectName?: string;
  unitName?: string;
};

// =====================
// Customer Detail VM
// =====================
export type CustomerDetailVM = {
  id: string;

  name: string;
  position?: string | null;
  company?: string | null;
  description?: string | null;

  country?: string | null;
  zip?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;

  status?: string | null;
  source?: string | null;

  email?: string | null;
  website?: string | null;
  phoneNumber?: string | null;

  leadValue?: number | null;
  tags?: string | null;

  createdAt: string;
  updatedAt?: string | null;
  metadataJson?: string | null;

  leads: LeadVM[];
  conversations: ConversationVM[];
  messages: MessageVM[];
  events: CustomerEventVM[];
  interests: CustomerInterestVM[];
};

// =====================
// Import result
// =====================
export type ImportResult = {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
};

// Defined interfaces for ASP.NET Identity Core 8.0 compatibility
// export interface AspNetUser {
//   id: string;
//   userName: string;
//   email: string;
//   fullName: string;
//   emailConfirmed: boolean;
//   phoneNumberConfirmed?: boolean;
//   twoFactorEnabled: boolean;
//   lockoutEnabled?: boolean;
//   accessFailedCount?: number;
//   roles: AspNetRole[];
//   claims: AspNetUserClaim[];
//   logins?: AspNetUserLogin[];
//   tokens?: AspNetUserToken[];
// }

export type AspNetUser = {
  id: string;
  userName?: string | null;
  email?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;   // ✅ thêm
  emailConfirmed: boolean;
  twoFactorEnabled: boolean;
  roles?: Array<{ id: string; name: string }>;
};


export interface AspNetUserLogin {
  loginProvider: string;
  providerKey: string;
  providerDisplayName: string;
  userId: string;
}

export interface AspNetUserToken {
  userId: string;
  loginProvider: string;
  name: string;
  value: string;
}

export interface AspNetRole {
  id: string;
  name: string;
  claims: AspNetRoleClaim[];
}

export interface AspNetUserClaim {
  id: number;
  userId: string;
  claimType: string;
  claimValue: string;
}

export interface AspNetRoleClaim {
  id: number;
  roleId: string;
  claimType: string;
  claimValue: string;
}

// ===== ROLES + PERMISSIONS (RoleClaims) =====
export type RoleListItem = {
  id: string;
  name: string;
};

export type RoleDetail = {
  id: string;
  name: string;
  permissions: string[];
};



