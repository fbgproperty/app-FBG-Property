/**
 * API SERVICE (REAL BACKEND)
 * - Login payload: { emailOrUsername, password }
 * - Response: { accessToken, tokenType, expiresInSeconds, user }
 *
 * ✅ Không dùng axios. File này dùng fetch + tự gắn Bearer token (giống interceptor).
 *
 * ✅ UPDATED Campaign/CampaignProject/Assignments to NEW API routes:
 *   - GET    /api/campaigns
 *   - POST   /api/campaigns
 *   - PUT    /api/campaigns/{id}/project
 *   - PATCH  /api/campaigns/{id}/status
 *   - GET    /api/campaigns/{id}/assignments
 *   - POST   /api/campaigns/{id}/assignments
 *   - PATCH  /api/assignments/{id}/status
 *   - DELETE /api/assignments/{id}
 */

import { AIAgent, AspNetUser, AspNetRole, RoleListItem, RoleDetail } from "../types";
import { DEMO_MODE, demoFetch } from "./demoBackend";

// =====================
// TYPES & HELPERS
// =====================

export type AgentDto = {
  id: string;            // Guid as string
  name: string;
  status: string;        // "Active" | "Idle" | ...
  channelsJson?: string | null;
  configJson?: string | null;
};

type AgentConfig = Partial<Pick<
  AIAgent,
  | "role"
  | "assignedProject"
  | "successRate"
  | "interactionsCount"
  | "caringCount"
>> & Record<string, any>;

const DEFAULT_AGENT_FALLBACK: Pick<
  AIAgent,
  "role" | "assignedProject" | "successRate" | "interactionsCount" | "caringCount"
> = {
  role: "Tư vấn dự án",
  assignedProject: "",
  successRate: 85,
  interactionsCount: 0,
  caringCount: 0,
};

function safeJsonParse<T>(json?: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function normalizeStatus(status: string): AIAgent["status"] {
  const s = (status || "").toLowerCase();
  if (s === "active") return "Active";
  if (s === "idle") return "Idle";
  if (s === "optimizing") return "Optimizing";
  return "Idle"; // fallback an toàn để UI không vỡ
}

/** Map backend DTO -> UI model (AIAgent) */
export function mapDtoToAIAgent(dto: AgentDto): AIAgent {
  const cfg = safeJsonParse<AgentConfig>(dto.configJson) ?? {};
  return {
    id: dto.id,
    name: dto.name,
    status: normalizeStatus(dto.status),

    role: (cfg.role as string) ?? DEFAULT_AGENT_FALLBACK.role,
    assignedProject: (cfg.assignedProject as string) ?? DEFAULT_AGENT_FALLBACK.assignedProject,
    successRate: typeof cfg.successRate === "number" ? cfg.successRate : DEFAULT_AGENT_FALLBACK.successRate,
    interactionsCount: typeof cfg.interactionsCount === "number" ? cfg.interactionsCount : DEFAULT_AGENT_FALLBACK.interactionsCount,
    caringCount: typeof cfg.caringCount === "number" ? cfg.caringCount : DEFAULT_AGENT_FALLBACK.caringCount,
  };
}

/** Map UI model -> DTO để lưu backend (nhồi extra field vào configJson) */
export function mapAIAgentToDto(agent: Partial<AIAgent>): AgentDto {
  const id = agent.id ?? "";
  const name = agent.name ?? "";
  const status = agent.status ?? "Idle";

  const config: AgentConfig = {
    role: agent.role,
    assignedProject: agent.assignedProject,
    successRate: agent.successRate,
    interactionsCount: agent.interactionsCount,
    caringCount: agent.caringCount,
  };

  return {
    id,
    name,
    status,
    channelsJson: null,
    configJson: JSON.stringify(config),
  };
}

export type LoginRequest = {
  emailOrUsername: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string; // "Bearer"
  expiresInSeconds: number;
  user: {
    id: string;
    email: string;
    username: string;
    fullName: string;
    roles: string[];
  };
};

type ApiErrorPayload = {
  message?: string;
  error?: string;
  errors?: any;
};

export type ProjectsQuery = {
  status?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export type ApiPagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type ApiProjectItem = {
  id: string;
  code: string;
  name: string;
  location: string;
  status: string;
  description?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type ApiProjectDetail = {
  id: string;
  code: string;
  name: string;
  location: string;
  status: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;

  province: string;
  projectType: string;
  investor: string;
  imageUrl: string;
  priceRange: string;
  productCount: number;
};

// =====================
// LEADS / IMPORT / CUSTOMERS TYPES
// =====================

// apiService.ts
export type LeadDto = {
  id: string;
  customerId: string;
  projectId?: string | null;
  unitId?: string | null;
  stage: string;
  assignedToUserId?: string | null;
  source: string;
  score: number;
  createdAt: string;
  updatedAt?: string | null;
};

export type CustomerImportRecord = {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  tags?: string | null;
  metadataJson?: string | null;
  sourceRef?: string | null;
};

export type ImportCustomersRequest = {
  records: CustomerImportRecord[];
  upsert: boolean;
  skipIfNoPhoneAndEmail: boolean;
};

export type ImportCustomersResult = {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
};

export type ImportResultDto = {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
};

// ===== Sheets Link =====
export type ImportCustomersFromSheetLinkRequest = {
  sheetUrl: string;
  sheetName: string;
  rangeA1: string;
  hasHeaderRow?: boolean;
  upsert?: boolean;
};

// ===== Google Forms (records) =====
export type ImportCustomerRecord = {
  fullName: string;
  phone?: string;
  email?: string;
  tags?: string;
  metadataJson?: string;
  sourceRef?: string;
};

export type ImportCustomersFromRecordsRequest = {
  records: ImportCustomerRecord[];
  upsert: boolean;
  skipIfNoPhoneAndEmail: boolean;
};

// =====================
// CAMPAIGN / ASSIGNMENTS (UPDATED TYPES FOR NEW API)
// =====================

export type CreateCampaignRequest = {
  name: string;
  projectId: string;        // UI vẫn gửi, apiService sẽ tách ra (create + upsert project)
  startAt: string | null;   // ISO
  endAt: string | null;     // ISO
  targetLeads: number;
  limitAiAgent: number;

  // optional new fields
  stopWhenTargetReached?: boolean | null;
  scoreThreshold?: number | null;
};

export type CreateCampaignResponse = { id: string };

export type UpdateCampaignStatusRequest = { status?: string | null };

export type UpdateCampaignRequest = {
  name: string;
  status?: string | null;       // UI vẫn gửi, apiService sẽ tách PATCH status
  startAt?: string | null;
  endAt?: string | null;
  targetLeads?: number | null;
  limitAiAgent?: number | null;
  stopWhenTargetReached?: boolean | null;
  scoreThreshold?: number | null;
};

export type CampaignProjectDto = { campaignId: string; projectId: string };
export type UpsertCampaignProjectRequest = { projectId: string };

// Assignments new routes: status-only update
export type AgentProjectAssignmentDto = {
  id: string;
  agentId: string;
  projectId?: string | null;
  campaignId: string;
  status?: string | null; // "Active" | "Paused" | "Disabled"
  createdAt: string;
};

export type CreateAgentProjectAssignmentRequest = {
  agentId: string;
  campaignId: string;
  status?: string | null;
};

export type CreateAgentProjectAssignmentResponse = { id: string };

export type UpdateAgentProjectAssignmentRequest = {
  status?: string | null;
};

// =====================
// CAMPAIGN DTO for UI (nếu bạn đang dùng)
// =====================

export type CampaignDtoApi = {
  Id: string;
  Name: string;
  Status: string;
  StartAt?: string | null;
  EndAt?: string | null;
  AgentsAiActive: number;
  TargetLeads: number;
  CurrentLeads: number;
  LimitAiAgent: number;
  Progress: number;
};

export type CampaignDto = {
  id: string;
  name: string;
  status: string;
  startAt?: string | null;
  endAt?: string | null;
  agentsAiActive: number;
  targetLeads: number;
  currentLeads: number;
  limitAiAgent: number;
  progress: number;
};

const toArray = <T,>(raw: any): T[] => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

export const mapCampaignApiToUi = (x: any): CampaignDto => ({
  id: (x.id ?? x.Id ?? '') as string,
  name: (x.name ?? x.Name ?? '') as string,
  status: (x.status ?? x.Status ?? '') as string,
  startAt: (x.startAt ?? x.StartAt ?? null) as any,
  endAt: (x.endAt ?? x.EndAt ?? null) as any,
  agentsAiActive: Number(x.agentsAiActive ?? x.AgentsAiActive ?? 0),
  targetLeads: Number(x.targetLeads ?? x.TargetLeads ?? 0),
  currentLeads: Number(x.currentLeads ?? x.CurrentLeads ?? 0),
  limitAiAgent: Number(x.limitAiAgent ?? x.LimitAiAgent ?? 0),
  progress: Number(x.progress ?? x.Progress ?? 0),
});

// =====================
// DASHBOARD TYPES
// =====================

export type DashboardStats = {
  activeProjects: number;
  totalLeads: number;
  activeAgents: number;
  revenue: number; // UI đang label là "Chi phí Cloud"
};

export type ChartPoint = {
  name: string;  // "T2"..."CN"
  leads: number; // recharts dataKey="leads"
};

export type AiDashboardResponse = {
  stats: DashboardStats;
  chartData: ChartPoint[];
};

export type DashboardData = {
  stats: {
    activeProjects: number;
    totalLeads: number;
    activeAgents: number;
    revenue: number;
  };
  chartData: Array<{ name: string; leads: number }>;
};

export type LeadSimulatedDto = {
  id: string;
  fullName: string;
  source: string;
  phone: string;
  createdAt: string;
};

type AiStep = {
  progress: number;
  message: string;
  delayMs: number;
};

type RunAiProcessResponse = {
  steps: AiStep[];
};

// =====================
// RAI PROPERTIES TYPES
// =====================

export type RaiPropertyQuery = {
  search?: string;
  source?: string;              // "Internal" | "Vinhomes" | ... | "all"
  projectId?: string;           // Guid
  projectExternalId?: number;

  statusLabel?: string;         // "Đang bán" | "Đã bán"...
  isFeatured?: boolean;

  page?: number;
  pageSize?: number;

  orderBy?: string;             // "syncedAt" | "createdAt"
  orderDir?: "asc" | "desc";
};

export type RaiPropertyDto = {
  id: string;
  source: string;
  externalId: number;

  projectExternalId?: number | null;
  projectId?: string | null;

  name: string;
  description?: string | null;
  location?: string | null;

  imagesJson: string[];         // backend trả mảng (DTO)
  typeLabel?: string | null;
  statusLabel?: string | null;
  isFeatured: boolean;

  numberBedroom?: number | null;
  numberBathroom?: number | null;
  numberFloor?: number | null;
  square?: number | null;

  price?: number | null;
  priceFormatted?: string | null;

  currencyId?: number | null;
  currencyTitle?: string | null;
  currencySymbol?: string | null;

  cityId?: number | null;
  cityName?: string | null;
  stateId?: number | null;
  stateName?: string | null;
  countryId?: number | null;
  countryName?: string | null;

  uniqueId?: string | null;

  sourceCreatedAt?: string | null;
  sourceUpdatedAt?: string | null;

  url?: string | null;
  slug?: string | null;

  syncedAt: string;

  views?: number;
};

// PagedResult đúng backend bạn viết (PascalCase)
export type PagedResult<T> = {
  Items: T[];
  Page: number;
  PageSize: number;
  Total: number;
};

export type ImportResult = {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
};

const normalizeImportResult = (x: any): ImportResult => {
  const inserted = Number(x?.inserted ?? 0);
  const updated = Number(x?.updated ?? 0);
  const skipped = Number(x?.skipped ?? 0);

  const msgs: string[] =
    (Array.isArray(x?.errorMessages) && x.errorMessages) ||
    (Array.isArray(x?.errors) && x.errors) ||
    [];

  const errors = Number(x?.errors ?? msgs.length);
  const total = Number(x?.total ?? (inserted + updated + skipped));

  return { total, inserted, updated, skipped, errors, errorMessages: msgs };
};

export type UpsertCustomerRequest = {
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
};

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

  leads: any[];
  conversations: any[];
  messages: any[];
  events: any[];
  interests: any[];
};

// =====================
// IDENTITY TYPES
// =====================

export type CreateUserRequest = {
  email: string;
  userName: string;
  fullName: string;
  phoneNumber?: string | null;
  selectedRoleIds?: string[];
};

export type UpdateUserRequest = {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  selectedRoleIds?: string[];
};

export type UpdateProfileRequest = {
  fullName: string;
  email: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

// =====================
// API SERVICE
// =====================

class ApiService {
  // Toàn bộ dữ liệu ERP đi qua Unified Bridge (GCP) — token ERP giữ server-side,
  // app chỉ gửi X-Bridge-Key. Hết lỗi Unauthorized, không lộ mật khẩu ERP.
  private cdpBaseUrl = 'https://appapi.fbgproperty.vn';
  private cdpBridgeKey = 'fbgbridge_eb36304b60751d2b2532e394';
  private baseUrl = 'https://appapi.fbgproperty.vn/erp';

  private tokenKey = 'salesagent_access_token';
  private tokenTypeKey = 'salesagent_token_type';

  private buildUrl(endpoint: string) {
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;
    return `${this.baseUrl}${endpoint}`;
  }

  public setAuth(accessToken: string | null, tokenType: string | null = 'Bearer') {
    if (!accessToken) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.tokenTypeKey);
      localStorage.removeItem('salesagent_level');
      return;
    }
    localStorage.setItem(this.tokenKey, String(accessToken));
    localStorage.setItem(this.tokenTypeKey, "Bearer");
  }

  public getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public getTokenType(): string {
    const t = localStorage.getItem(this.tokenTypeKey);
    return (t && t.trim()) ? t : 'Bearer';
  }

  /**
   * ✅ "Interceptor" cho fetch:
   * - Luôn set Content-Type json (trừ FormData)
   * - Luôn gắn Authorization: Bearer <token> nếu có
   */
  private getHeaders(extra?: Record<string, string>): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-App-Platform': 'SalesAgent-AI-Platform',
      'X-Bridge-Key': this.cdpBridgeKey,
      ...(extra || {}),
    });

    const token = this.getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  }

  // ✅ Parse error: hỗ trợ Identity trả array [{description}] + ModelState {errors:{...}}
  private async parseError(res: Response): Promise<Error> {
    let payload: any = null;

    try {
      const text = await res.text();
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = text;
      }
    } catch {
      // ignore
    }

    if (Array.isArray(payload)) {
      const first = payload[0];
      const msg = first?.description || first?.message;
      if (msg) return new Error(msg);
    }

    if (payload?.errors && typeof payload.errors === "object") {
      const all: string[] = [];
      for (const k of Object.keys(payload.errors)) {
        const arr = payload.errors[k];
        if (Array.isArray(arr)) all.push(...arr);
        else if (typeof arr === "string") all.push(arr);
      }
      if (all.length) return new Error(all[0]);
    }

    const msg =
      payload?.message ||
      payload?.error ||
      (typeof payload === "string" && payload.trim() ? payload : null) ||
      `Request failed (${res.status} ${res.statusText})`;

    return new Error(msg);
  }

  private buildQuery(params: Record<string, any>) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (typeof v === 'string' && v.trim() === '') return;
      sp.set(k, String(v));
    });
    const qs = sp.toString();
    return qs ? `?${qs}` : '';
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // ✅ DEMO MODE: trả dữ liệu mẫu, không gọi backend thật
    if (DEMO_MODE) {
      const method = (options.method || 'GET').toString().toUpperCase();
      let parsedBody: any = undefined;
      if (typeof options.body === 'string') {
        try { parsedBody = JSON.parse(options.body); } catch { parsedBody = options.body; }
      }
      return demoFetch<T>(method, endpoint, parsedBody);
    }

    const url = this.buildUrl(endpoint);

    const isFormData =
      typeof FormData !== 'undefined' && options.body instanceof FormData;

    // Nếu là FormData: không ép Content-Type (browser tự set boundary)
    const headers = isFormData
      ? (options.headers as HeadersInit | undefined)
      : this.getHeaders(
          options.headers ? (options.headers as Record<string, string>) : undefined
        );

    if (isFormData) {
      const h = new Headers(headers);
      h.delete('Content-Type');
      h.delete('content-type');
      (options as any).headers = h;
    }

    const res = await fetch(url, {
      ...options,
      headers: isFormData ? (options as any).headers : headers,
    });

    if (!res.ok) throw await this.parseError(res);

    if (res.status === 204) return undefined as unknown as T;
    return (await res.json()) as T;
  }

  public get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  public put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  public patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  public postForm<T>(endpoint: string, form: FormData): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: form });
  }

  // =====================
  // AUTH
  // =====================

  public async login(emailOrUsername: string, password: string): Promise<LoginResponse> {
    // ✅ DEMO MODE: đăng nhập giả, nhập gì cũng vào
    if (DEMO_MODE) {
      const demo: LoginResponse = {
        accessToken: 'demo-token-' + Date.now(),
        tokenType: 'Bearer',
        expiresInSeconds: 86400,
        user: {
          id: 'u1',
          email: emailOrUsername || 'admin@raiagent.vn',
          username: 'admin',
          fullName: 'Quản trị viên (Demo)',
          roles: ['Quản trị viên'],
        },
      };
      this.setAuth(demo.accessToken, demo.tokenType);
      return demo;
    }

    const payload: LoginRequest = { emailOrUsername, password };
    const data = await this.post<LoginResponse>('/auth/login', payload);

    if (!data?.accessToken) throw new Error('Login API không trả về accessToken.');

    this.setAuth(data.accessToken, data.tokenType || 'Bearer');
    try { localStorage.setItem('salesagent_level', (data.user as any)?.level || 'nhan-vien'); } catch { /* ignore */ }
    return data;
  }

  public async forgotPassword(email: string): Promise<{ message: string }> {
    const e = (email || '').trim();
    if (!e) throw new Error('Vui lòng nhập email');

    return this.request<{ message: string }>(`/auth/password/forgot`, {
      method: 'POST',
      body: JSON.stringify({ email: e }),
    });
  }

  public logout() {
    this.setAuth(null, null);
  }

  // =====================
  // PROJECTS
  // =====================

  // Bất động sản lấy từ website fbgproperty.vn qua bridge (/web/*). Dự án = chỉ nổi bật.
  private async webGet<T>(path: string): Promise<T> {
    const res = await fetch(`${this.cdpBaseUrl}/web${path}`, {
      headers: { 'X-Bridge-Key': this.cdpBridgeKey },
    });
    if (!res.ok) throw new Error(`web ${res.status}`);
    return res.json();
  }

  public async getProjects(query: ProjectsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    return this.webGet<ApiPagedResponse<ApiProjectItem>>(`/projects?page=${page}&pageSize=${pageSize}`);
  }

  public async getProjectDetail(id: string): Promise<ApiProjectDetail> {
    if (!id) throw new Error('Project id is required');
    return this.webGet<ApiProjectDetail>(`/projects/${encodeURIComponent(id)}`);
  }

  public async getProjectsCbx() {
    return this.webGet<ApiPagedResponse<ApiProjectItem>>(`/projects?pageSize=100`);
  }

  // =====================
  // LEADS
  // =====================

  public async getLeads(params: {
    stage?: string;
    projectId?: string;
    assignedTo?: string;
    q?: string;
    page: number;
    pageSize: number;
  }): Promise<ApiPagedResponse<LeadDto>> {
    const sp = new URLSearchParams();
    if (params.stage) sp.set('stage', params.stage);
    if (params.projectId) sp.set('projectId', params.projectId);
    if (params.assignedTo) sp.set('assignedTo', params.assignedTo);
    if (params.q) sp.set('q', params.q);
    sp.set('page', String(params.page));
    sp.set('pageSize', String(params.pageSize));

    return this.request<ApiPagedResponse<LeadDto>>(`/leads?${sp.toString()}`, { method: 'GET' });
  }

  // =====================
  // IMPORT CUSTOMERS
  // =====================

  public async importCustomersGoogleSheets(payload: ImportCustomersRequest) {
    return this.request<ImportCustomersResult>(`/customers/import/google-sheets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async importCustomersGoogleForms(payload: ImportCustomersRequest) {
    return this.request<ImportCustomersResult>(`/customers/import/google-form`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async importCustomersFromDriveCsvLink(driveLink: string, upsert: boolean) {
    const form = new FormData();
    form.append('DriveLink', driveLink);
    form.append('UpsertByEmail', String(upsert));

    const res = await this.postForm<any>('/customers/import/csv', form);
    return normalizeImportResult(res);
  }

  public async importCustomersFromGoogleSheetsLink(payload: ImportCustomersFromSheetLinkRequest) {
    return this.request<ImportResultDto>(`/customers/import/google-sheets/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetUrl: payload.sheetUrl,
        sheetName: payload.sheetName,
        rangeA1: payload.rangeA1,
        hasHeaderRow: payload.hasHeaderRow ?? true,
        upsert: payload.upsert ?? true,
      }),
    });
  }

  public async importCustomersFromGoogleForms(payload: ImportCustomersFromRecordsRequest) {
    return this.request<ImportResultDto>(`/customers/import/google-forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  public async importCustomersFromExcel(
    file: File,
    upsert = true,
    hasHeaderRow = true,
    token?: string
  ) {
    const fd = new FormData();
    fd.append('File', file);
    fd.append('Upsert', String(upsert));
    fd.append('HasHeaderRow', String(hasHeaderRow));

    const res = await fetch(`${this.baseUrl}/customers/import/excel`, {
      method: 'POST',
      body: fd,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      (err as any).status = res.status;
      (err as any).data = data;
      throw err;
    }

    return data as ImportResultDto;
  }

  // =====================
  // CUSTOMERS CRUD
  // =====================

  public async getCustomers(params: { q?: string; page: number; pageSize: number }) {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    sp.set('page', String(params.page));
    sp.set('pageSize', String(params.pageSize));
    return this.request(`/customers?${sp.toString()}`, { method: 'GET' });
  }

  // Lấy khách hàng từ CDP Unified Bridge (hành vi web thật + ERP).
  // Trả về PagedResponse với item đã ở dạng VM (fullName/phone/viewedProjects/…).
  public async getCdpCustomers(params: { q?: string; page: number; pageSize: number }) {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    sp.set('page', String(params.page));
    sp.set('pageSize', String(params.pageSize));
    const res = await fetch(`${this.cdpBaseUrl}/cdp/customers?${sp.toString()}`, {
      method: 'GET',
      headers: { 'X-Bridge-Key': this.cdpBridgeKey },
    });
    if (!res.ok) throw new Error(`CDP bridge ${res.status}`);
    return res.json();
  }

  // AI gateway qua bridge (key AI nằm server-side, không lộ trong bundle)
  public async aiScore(payload: {
    id?: string; name?: string; needs?: string; status?: string;
    viewedProjects?: string[]; webPageViews?: number; webIdentified?: boolean; leadCount?: number;
  }): Promise<{ score: number; assessment: string }> {
    const res = await fetch(`${this.cdpBaseUrl}/ai/score`, {
      method: 'POST',
      headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`AI score ${res.status}`);
    return res.json();
  }

  public async aiAnalyze(payload: { name: string; details: string }): Promise<{ text: string }> {
    const res = await fetch(`${this.cdpBaseUrl}/ai/analyze`, {
      method: 'POST',
      headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`AI analyze ${res.status}`);
    return res.json();
  }

  // ===== Sale ảo (ADK) qua bridge =====
  public async getSalesAgents(owner?: string): Promise<{ items: any[]; total: number }> {
    const sp = new URLSearchParams();
    if (owner) sp.set('owner', owner);
    const res = await fetch(`${this.cdpBaseUrl}/sales/agents?${sp.toString()}`, {
      headers: { 'X-Bridge-Key': this.cdpBridgeKey },
    });
    if (!res.ok) throw new Error(`sales agents ${res.status}`);
    return res.json();
  }

  public async createSalesAgent(body: { owner: string; name: string; persona?: string; segment?: string; channel?: string }) {
    const res = await fetch(`${this.cdpBaseUrl}/sales/agents`, {
      method: 'POST',
      headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`create sales agent ${res.status}`);
    return res.json();
  }

  public async deleteSalesAgent(id: string) {
    const res = await fetch(`${this.cdpBaseUrl}/sales/agents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'X-Bridge-Key': this.cdpBridgeKey },
    });
    if (!res.ok) throw new Error(`delete sales agent ${res.status}`);
    return res.json();
  }

  public async salesNurture(body: { customerId: string; agentId?: string; persona?: string; channel?: string }) {
    const res = await fetch(`${this.cdpBaseUrl}/sales/nurture`, {
      method: 'POST',
      headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`nurture ${res.status}`);
    return res.json();
  }

  public async deleteCustomer(id: string) {
    return this.request<void>(`/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  public async createCustomer(body: UpsertCustomerRequest) {
    return this.request<void>(`/customers`, { method: 'POST', body: JSON.stringify(body) });
  }

  public async updateCustomer(id: string, body: UpsertCustomerRequest) {
    return this.request<void>(`/customers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // ===== Nạp nguồn khách + đồng bộ ERP↔CDP =====
  public async cdpSyncErp(): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/cdp/sync-erp`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey },
    });
    if (!res.ok) throw new Error(`sync ${res.status}`);
    return res.json();
  }
  public async cdpSyncChatwoot(): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/cdp/sync-chatwoot`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey },
    });
    if (!res.ok) throw new Error(`sync-chat ${res.status}`);
    return res.json();
  }
  public async ragAsk(question: string, project?: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/rag/ask`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, project }),
    });
    if (!res.ok) throw new Error(`rag ${res.status}`);
    return res.json();
  }
  public async imageDraft(payload: { project: string; type: string; note?: string; count?: number }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/image/draft`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`image ${res.status}`);
    return res.json();
  }
  public async opsTasks(params: { status?: string; project?: string; limit?: number } = {}): Promise<{ items: any[]; total: number }> {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.project) q.set('project', params.project);
    q.set('limit', String(params.limit ?? 100));
    const res = await fetch(`${this.cdpBaseUrl}/ops/tasks?${q.toString()}`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey } });
    if (!res.ok) throw new Error(`ops tasks ${res.status}`);
    return res.json();
  }
  public async opsTasksSummary(): Promise<Record<string, number>> {
    const res = await fetch(`${this.cdpBaseUrl}/ops/tasks/summary`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey } });
    if (!res.ok) throw new Error(`ops summary ${res.status}`);
    return res.json();
  }
  public async opsTaskUpdate(name: string, status: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/ops/tasks/update`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, status }),
    });
    if (!res.ok) throw new Error(`task update ${res.status}`);
    return res.json();
  }
  private userEmail(): string {
    try { return (JSON.parse(localStorage.getItem('fbg_user') || '{}').email || '').toLowerCase(); } catch { return ''; }
  }
  /** Lead của ERP, CÔ LẬP theo người đăng nhập (sale chỉ thấy lead_owner = email mình; admin info@ thấy hết). */
  public async erpLeads(params: { limit?: number; status?: string; q?: string } = {}): Promise<{ items: any[]; total: number; scoped: boolean; owner: string }> {
    const qs = new URLSearchParams();
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.status) qs.set('status', params.status);
    if (params.q) qs.set('q', params.q);
    const res = await fetch(`${this.cdpBaseUrl}/ops/leads?${qs.toString()}`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'X-User-Email': this.userEmail() } });
    if (!res.ok) throw new Error(`leads ${res.status}`);
    return res.json();
  }
  public async erpMySummary(): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/ops/my-summary`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'X-User-Email': this.userEmail() } });
    if (!res.ok) throw new Error(`summary ${res.status}`);
    return res.json();
  }
  /** Việc Hermes tự sinh cho nhân sự — duyệt/từ chối; cô lập theo người đăng nhập. */
  public async opsWorklog(): Promise<{ items: any[] }> {
    const res = await fetch(`${this.cdpBaseUrl}/ops/worklog`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'X-User-Email': this.userEmail() } });
    if (!res.ok) throw new Error(`worklog ${res.status}`);
    return res.json();
  }
  public async worklogGenerate(): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/ops/worklog/generate`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'X-User-Email': this.userEmail() },
    });
    if (!res.ok) throw new Error(`gen ${res.status}`);
    return res.json();
  }
  public async worklogDecide(id: string, decision: 'approve' | 'reject'): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/ops/worklog/decide`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'X-User-Email': this.userEmail(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, decision }),
    });
    if (!res.ok) throw new Error(`decide ${res.status}`);
    return res.json();
  }
  public async opsOverdue(): Promise<{ items: any[]; total: number; asOf: string }> {
    const res = await fetch(`${this.cdpBaseUrl}/ops/overdue`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey } });
    if (!res.ok) throw new Error(`overdue ${res.status}`);
    return res.json();
  }
  public async opsBriefLatest(): Promise<{ text: string; ts: number; stats?: any }> {
    const res = await fetch(`${this.cdpBaseUrl}/ops/brief/latest`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey } });
    if (!res.ok) throw new Error(`brief latest ${res.status}`);
    return res.json();
  }
  public async opsBrief(stats: any, period?: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/ops/brief`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats, period: period || 'hôm nay' }),
    });
    if (!res.ok) throw new Error(`ops brief ${res.status}`);
    return res.json();
  }
  public async salesNextAction(payload: { name: string; phone?: string; stage?: string; note?: string; project?: string; history?: string }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/sales/nextaction`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`nextaction ${res.status}`);
    return res.json();
  }
  public async salesPlaybook(payload: { stage: string; project?: string }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/sales/playbook`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`playbook ${res.status}`);
    return res.json();
  }
  public async salesReport(stats: any, period?: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/sales/report`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats, period: period || 'tuần này' }),
    });
    if (!res.ok) throw new Error(`sales report ${res.status}`);
    return res.json();
  }
  public async estateSalePlan(payload: { project: string; units?: string; price?: string; target?: string }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/estate/saleplan`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`saleplan ${res.status}`);
    return res.json();
  }
  public async estateMarket(payload: { project: string; listings: any[] }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/estate/market`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`market ${res.status}`);
    return res.json();
  }
  public async estateListing(payload: { project: string; unit?: string; highlights?: string; channel?: string }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/estate/listing`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`listing ${res.status}`);
    return res.json();
  }
  public async adsPlan(payload: { project: string; platform: string; budget?: string; objective?: string }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/ads/plan`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`ads ${res.status}`);
    return res.json();
  }
  public async analystReport(stats: any, period?: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/analyst/report`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats, period: period || 'tuần này' }),
    });
    if (!res.ok) throw new Error(`analyst ${res.status}`);
    return res.json();
  }
  public async videoRender(payload: { title: string; subtitle?: string; images: string[]; captions?: string[]; music?: string }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/video/render`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`video ${res.status}`);
    return res.json();
  }
  public async videoStatus(jobId: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/video/status/${jobId}`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey } });
    if (!res.ok) throw new Error(`video ${res.status}`);
    return res.json();
  }
  public async videoBlobUrl(name: string): Promise<string> {
    const res = await fetch(`${this.cdpBaseUrl}/video/file/${name}`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey } });
    if (!res.ok) throw new Error(`video file ${res.status}`);
    return URL.createObjectURL(await res.blob());
  }
  public async contentDraft(project: string, type: string, note: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/content/draft`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, type, note }),
    });
    if (!res.ok) throw new Error(`content ${res.status}`);
    return res.json();
  }
  public async ragProjects(): Promise<string[]> {
    const res = await fetch(`${this.cdpBaseUrl}/rag/projects`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey } });
    if (!res.ok) throw new Error(`rag ${res.status}`);
    const j = await res.json();
    return j?.projects || j?.data || (Array.isArray(j) ? j : []);
  }
  public async memRecall(phone: string, query: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/mem/recall`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, query, limit: 8 }),
    });
    if (!res.ok) throw new Error(`mem ${res.status}`);
    return res.json();
  }
  public async memRemember(phone: string, text: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/mem/remember`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, text }),
    });
    if (!res.ok) throw new Error(`mem ${res.status}`);
    return res.json();
  }
  public async aiOrgGet(): Promise<{ items: any[] }> {
    const res = await fetch(`${this.cdpBaseUrl}/org/ai`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey } });
    if (!res.ok) throw new Error(`org ${res.status}`);
    return res.json();
  }
  public async aiOrgSet(items: any[]): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/org/ai`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!res.ok) throw new Error(`org ${res.status}`);
    return res.json();
  }
  public async infraOverview(): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/infra/overview`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey } });
    if (!res.ok) throw new Error(`infra ${res.status}`);
    return res.json();
  }
  // ===== Marketing (Flash Zalo + fb-collect) qua bridge /mkt/* — token giữ server-side, CÔ LẬP theo user =====
  private mktUserEmail(): string {
    try { return (JSON.parse(localStorage.getItem('fbg_user') || '{}').email) || localStorage.getItem('fbg_owner') || ''; } catch { return ''; }
  }
  private mktHeaders(json = false): Record<string, string> {
    const h: Record<string, string> = { 'X-Bridge-Key': this.cdpBridgeKey, 'X-Mkt-User': this.mktUserEmail() };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }
  public async mktGet(path: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/mkt/${path}`, { headers: this.mktHeaders() });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j?.message || `mkt ${res.status}`);
    return j;
  }
  public async mktPost(path: string, body?: any): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/mkt/${path}`, { method: 'POST', headers: this.mktHeaders(true), body: JSON.stringify(body || {}) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((Array.isArray(j?.message) ? j.message.join(', ') : j?.message) || `mkt ${res.status}`);
    return j;
  }
  public async mktPatch(path: string, body?: any): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/mkt/${path}`, { method: 'PATCH', headers: this.mktHeaders(true), body: JSON.stringify(body || {}) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((Array.isArray(j?.message) ? j.message.join(', ') : j?.message) || `mkt ${res.status}`);
    return j;
  }
  public async mktDelete(path: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/mkt/${path}`, { method: 'DELETE', headers: this.mktHeaders() });
    if (!res.ok) throw new Error(`mkt ${res.status}`);
    return res.json().catch(() => ({}));
  }
  public async twilioCall(phone: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/twilio/call`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) throw new Error(`twilio ${res.status}`);
    return res.json();
  }
  public async cdpImport(rows: any[], source: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/cdp/import`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, source }),
    });
    if (!res.ok) throw new Error(`import ${res.status}`);
    return res.json();
  }
  public async cdpImportSheet(url: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/cdp/import/sheet`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) throw new Error(`sheet ${res.status}`);
    return res.json();
  }

  public async getCdpProfile(id: string): Promise<any> {
    return this.webApiGet(`/cdp/customers/${encodeURIComponent(id)}/profile`);
  }
  public async saveCdpInfo(id: string, info: any): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/cdp/customers/${encodeURIComponent(id)}/info`, {
      method: 'PUT', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    });
    if (!res.ok) throw new Error(`info ${res.status}`);
    return res.json();
  }
  public async logCdpActivity(id: string, body: any): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/cdp/customers/${encodeURIComponent(id)}/activity`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`activity ${res.status}`);
    return res.json();
  }
  public async cdpAiScore(id: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/cdp/customers/${encodeURIComponent(id)}/ai-score`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey },
    });
    if (!res.ok) throw new Error(`ai ${res.status}`);
    return res.json();
  }

  public async setCustomerStage(id: string, stage: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/cdp/customers/${encodeURIComponent(id)}/stage`, {
      method: 'PUT', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    });
    if (!res.ok) throw new Error(`stage ${res.status}`);
    return res.json();
  }

  public async getCustomerBehavior(id: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/cdp/customers/${encodeURIComponent(id)}/behavior`, {
      headers: { 'X-Bridge-Key': this.cdpBridgeKey },
    });
    if (!res.ok) throw new Error(`behavior ${res.status}`);
    return res.json();
  }

  public async getCustomerDetail(id: string) {
    return this.request<CustomerDetailVM>(`/customers/${encodeURIComponent(id)}/detail`, { method: 'GET' });
  }

  // =====================
  // AGENTS
  // =====================

  public async getAgents(): Promise<AIAgent[]> {
    const res = await this.request<any>(`/agents`, { method: "GET" });
    const dtos: AgentDto[] = Array.isArray(res) ? res : (res?.items ?? []);
    return dtos.map(mapDtoToAIAgent);
  }

  public async createAgent(body: Partial<AIAgent>) {
    const dto = mapAIAgentToDto(body);
    dto.id = "";
    const created = await this.request<AgentDto>(`/agents`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
    return mapDtoToAIAgent(created);
  }

  public async updateAgentStatus(id: string, body: { status: string }) {
    return this.request<void>(`/agents/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  public async updateAgent(
    id: string,
    body: { name: string; status: string; channelsJson?: string | null; configJson?: string | null }
  ) {
    return this.request<void>(`/agents/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  public async deleteAgent(id: string) {
    return this.request<void>(`/agents/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  // =====================
  // ✅ CAMPAIGNS (NEW API)
  // =====================

  /** NEW: GET /api/campaigns */
  public async getCampaigns() {
    // backend có thể trả [] hoặc {items: []}
    return this.request<any>(`/campaigns`, { method: "GET" });
  }

  /**
   * NEW flow:
   * 1) POST /api/campaigns (không gửi projectId)
   * 2) PUT  /api/campaigns/{id}/project (set project)
   */
  public async createCampaign(body: CreateCampaignRequest) {
    const created = await this.request<CreateCampaignResponse>(`/campaigns`, {
      method: 'POST',
      body: JSON.stringify({
        name: body.name,
        startAt: body.startAt,
        endAt: body.endAt,
        targetLeads: body.targetLeads,
        limitAiAgent: body.limitAiAgent,
        stopWhenTargetReached: body.stopWhenTargetReached ?? true,
        scoreThreshold: body.scoreThreshold ?? null,
      }),
    });

    if (body.projectId) {
      await this.request<void>(`/campaigns/${encodeURIComponent(created.id)}/project`, {
        method: 'PUT',
        body: JSON.stringify({ projectId: body.projectId }),
      });
    }

    return created;
  }

  /**
   * NEW: PUT /api/campaigns/{id} (fields)
   * status nếu có => PATCH /api/campaigns/{id}/status
   */
  public async updateCampaign(id: string, body: UpdateCampaignRequest) {
    await this.request<void>(`/campaigns/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: body.name,
        startAt: body.startAt ?? null,
        endAt: body.endAt ?? null,
        targetLeads: body.targetLeads ?? null,
        limitAiAgent: body.limitAiAgent ?? null,
        stopWhenTargetReached: body.stopWhenTargetReached ?? null,
        scoreThreshold: body.scoreThreshold ?? null,
      }),
    });

    if (body.status) {
      await this.updateCampaignStatus(id, { status: body.status });
    }
  }

  /** NEW: PATCH /api/campaigns/{id}/status */
  public async updateCampaignStatus(id: string, body: UpdateCampaignStatusRequest) {
    return this.request<void>(`/campaigns/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // =====================
  // ✅ CAMPAIGN PROJECT (NEW API)
  // =====================

  public async getCampaignProject(campaignId: string) {
    return this.request<CampaignProjectDto>(
      `/campaigns/${encodeURIComponent(campaignId)}/project`,
      { method: "GET" }
    );
  }

  public async upsertCampaignProject(campaignId: string, projectId: string) {
    return this.request<void>(
      `/campaigns/${encodeURIComponent(campaignId)}/project`,
      { method: "PUT", body: JSON.stringify({ projectId }) }
    );
  }

  // =====================
  // ✅ ASSIGNMENTS (NEW API)
  // =====================

  /** NEW: GET /api/campaigns/{campaignId}/assignments */
  public async getAssignmentsByCampaign(campaignId: string) {
    return this.request<AgentProjectAssignmentDto[]>(
      `/campaigns/${encodeURIComponent(campaignId)}/assignments`,
      { method: 'GET' }
    );
  }

  /** NEW: POST /api/campaigns/{campaignId}/assignments */
  public async createAssignment(body: CreateAgentProjectAssignmentRequest) {
    return this.request<CreateAgentProjectAssignmentResponse>(
      `/campaigns/${encodeURIComponent(body.campaignId)}/assignments`,
      {
        method: 'POST',
        body: JSON.stringify({
          agentId: body.agentId,
          status: body.status ?? "Active",
        }),
      }
    );
  }

  /** NEW: PATCH /api/assignments/{id}/status */
  public async updateAssignment(id: string, body: UpdateAgentProjectAssignmentRequest) {
    return this.request<void>(
      `/assignments/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: body.status ?? "Paused" }),
      }
    );
  }

  /** NEW: DELETE /api/assignments/{id} */
  public async deleteAssignment(id: string) {
    return this.request<void>(`/assignments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // =====================
  // DASHBOARD
  // =====================

  public async getAIDashboardData() {
    return this.request<DashboardData>(`/dashboard/ai`, { method: 'GET' });
  }

  public async simulateIncomingLeads(count: number) {
    return this.request<LeadSimulatedDto[]>(
      `/dashboard/simulate-leads?count=${encodeURIComponent(count)}`,
      { method: 'POST' }
    );
  }

  public async runAIAgentProcessing(onProgress: (progress: number, msg: string) => void): Promise<void> {
    const res = await this.request<RunAiProcessResponse>(`/dashboard/run-ai-process`, { method: 'POST' });
    for (const s of res.steps) {
      onProgress(s.progress, s.message);
      await new Promise((r) => setTimeout(r, s.delayMs));
    }
  }

  // =====================
  // RAI PROPERTIES (Houses/Apartments)
  // =====================

  public async getRaiProperties(query: RaiPropertyQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const q = query.search ? `&q=${encodeURIComponent(query.search)}` : '';
    return this.webGet<PagedResult<RaiPropertyDto>>(`/properties?page=${page}&pageSize=${pageSize}${q}`);
  }

  public async getRaiPropertyDetail(id: string) {
    if (!id) throw new Error("RaiProperty id is required");
    return this.webGet<RaiPropertyDto>(`/properties/${encodeURIComponent(id)}`);
  }

  public async getRaiPropertySources() {
    return this.webGet<string[]>(`/properties/sources`);
  }

  // ===== Nội dung dự án do admin biên tập (per-tab) + AI + Drive =====
  public async getProjectContent(slug: string): Promise<any> {
    return this.webGet<any>(`/project-content/${encodeURIComponent(slug)}`);
  }

  public async saveProjectContent(slug: string, body: any): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/web/project-content/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`save content ${res.status}`);
    return res.json();
  }

  public async aiDraftProject(payload: { tab: string; projectName: string; context?: string }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/web/ai/draft`, {
      method: 'POST',
      headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`ai draft ${res.status}`);
    return res.json();
  }

  // ===== Triển khai dự án (ERP) =====
  public async getDeployProjects(): Promise<{ items: any[]; total: number }> {
    return this.webApiGet(`/deploy/projects`);
  }
  public async getDeployPlan(pid: string): Promise<any> {
    return this.webApiGet(`/deploy/plan/${encodeURIComponent(pid)}`);
  }
  public async saveDeployPlan(pid: string, body: any): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/deploy/plan/${encodeURIComponent(pid)}`, {
      method: 'PUT', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`save plan ${res.status}`);
    return res.json();
  }
  public async deploySellRegister(body: { projectId: string; projectName: string; email: string; name?: string }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/deploy/sell-register`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`register ${res.status}`);
    return res.json();
  }
  public async deployApproveSeller(projectId: string, email: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/deploy/approve-seller`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, email }),
    });
    if (!res.ok) throw new Error(`approve ${res.status}`);
    return res.json();
  }
  public async deployMy(email: string): Promise<{ projects: any[]; leads: any[] }> {
    return this.webApiGet(`/deploy/my?email=${encodeURIComponent(email)}`);
  }
  public async deployMatch(projectName: string, limit = 30): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/deploy/match`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectName, limit }),
    });
    if (!res.ok) throw new Error(`match ${res.status}`);
    return res.json();
  }
  // ===== Trợ lý AI: đồng bộ Hermes Agent + đăng ký =====
  public async assistantMe(email: string): Promise<any> {
    return this.webApiGet(`/assistant/me?email=${encodeURIComponent(email)}`);
  }
  // ===== Tổ chức & phân quyền =====
  public async orgMe(email: string): Promise<any> {
    return this.webApiGet(`/org/me?email=${encodeURIComponent(email)}`);
  }
  public async orgMembers(): Promise<{ items: any[]; roles: Record<string, string> }> {
    return this.webApiGet(`/org/members`);
  }
  public async orgSet(body: { email: string; name?: string; role?: string; manager?: string; approved?: boolean }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/org/set`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`org set ${res.status}`);
    return res.json();
  }
  public async orgSign(email: string, name?: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/org/sign`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    if (!res.ok) throw new Error(`org sign ${res.status}`);
    return res.json();
  }

  public async assistantChat(email: string, message: string): Promise<{ reply: string; slug?: string }> {
    const res = await fetch(`${this.cdpBaseUrl}/assistant/chat`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, message }),
    });
    if (!res.ok) {
      let msg = `chat ${res.status}`;
      try { msg = (await res.json()).detail || msg; } catch { /* ignore */ }
      throw new Error(msg);
    }
    return res.json();
  }
  public async assistantRegister(body: { email: string; name?: string; note?: string }): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/assistant/register`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`register ${res.status}`);
    return res.json();
  }
  public async assistantRequests(): Promise<{ items: any[] }> {
    return this.webApiGet(`/assistant/requests`);
  }
  public async assistantApprove(email: string, slug: string): Promise<any> {
    const res = await fetch(`${this.cdpBaseUrl}/assistant/approve`, {
      method: 'POST', headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, slug }),
    });
    if (!res.ok) throw new Error(`approve ${res.status}`);
    return res.json();
  }

  private async webApiGet<T>(path: string): Promise<T> {
    const res = await fetch(`${this.cdpBaseUrl}${path}`, { headers: { 'X-Bridge-Key': this.cdpBridgeKey } });
    if (!res.ok) throw new Error(`api ${res.status}`);
    return res.json();
  }

  public async driveList(folderUrl: string): Promise<{ files: any[]; error?: string }> {
    const res = await fetch(`${this.cdpBaseUrl}/web/drive/list`, {
      method: 'POST',
      headers: { 'X-Bridge-Key': this.cdpBridgeKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderUrl }),
    });
    if (!res.ok) throw new Error(`drive ${res.status}`);
    return res.json();
  }

  public async createRaiProperty(body: Partial<RaiPropertyDto>) {
    return this.request<RaiPropertyDto>(`/rai-properties`, { method: "POST", body: JSON.stringify(body) });
  }

  public async updateRaiProperty(id: string, body: Partial<RaiPropertyDto>) {
    if (!id) throw new Error("RaiProperty id is required");
    return this.request<RaiPropertyDto>(`/rai-properties/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  public async deleteRaiProperty(id: string) {
    if (!id) throw new Error("RaiProperty id is required");
    return this.request<void>(`/rai-properties/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  public async syncRaiProperties(source: string = "all") {
    return this.request<any>(`/sync/rai/properties`, { method: "POST", body: JSON.stringify({ source }) });
  }

  public async syncRaiCrmLeads() {
    return this.request<any>(`/rai-crm/leads`, { method: "POST" });
  }

  // =====================================================================
  // ✅ IDENTITY API
  // =====================================================================

  // --- Users ---
  public async getUsers(): Promise<AspNetUser[]> {
    return this.request<AspNetUser[]>(`/users`, { method: "GET" });
  }

  public async createUser(user: CreateUserRequest) {
    return this.request<any>(`/users`, {
      method: "POST",
      body: JSON.stringify({
        email: user.email,
        userName: user.userName,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber ?? null,
        selectedRoleIds: user.selectedRoleIds || [],
      }),
    });
  }

  public async updateUser(id: string, user: UpdateUserRequest & { userName?: string }) {
    if (!id) throw new Error("User id is required");
    return this.request<any>(`/users/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({
        id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: (user as any).phoneNumber ?? null,
        selectedRoleIds: user.selectedRoleIds || [],
      }),
    });
  }

  public async deleteUser(id: string) {
    if (!id) throw new Error("User id is required");
    return this.request<void>(`/users/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  // =====================
  // ✅ ROLES + PERMISSIONS (RoleClaims)
  // =====================

  public async getRoles(): Promise<RoleListItem[]> {
    return this.request<RoleListItem[]>(`/roles`, { method: "GET" });
  }

  public async getRoleDetail(id: string): Promise<RoleDetail> {
    if (!id) throw new Error("Role id is required");
    return this.request<RoleDetail>(`/roles/${encodeURIComponent(id)}`, { method: "GET" });
  }

  public async createRole(body: { name: string }): Promise<RoleListItem> {
    return this.request<RoleListItem>(`/roles`, {
      method: "POST",
      body: JSON.stringify({ name: body.name }),
    });
  }

  public async updateRole(id: string, body: { name: string }): Promise<RoleListItem> {
    if (!id) throw new Error("Role id is required");
    return this.request<RoleListItem>(`/roles/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ name: body.name }),
    });
  }

  public async deleteRole(id: string) {
    if (!id) throw new Error("Role id is required");
    return this.request<void>(`/roles/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  // --- Permissions (RoleClaims: ClaimType="permission") ---
  public async getRolePermissions(roleId: string): Promise<string[]> {
    if (!roleId) throw new Error("Role id is required");
    return this.request<string[]>(
      `/roles/${encodeURIComponent(roleId)}/permissions`,
      { method: "GET" }
    );
  }

  public async addRolePermission(roleId: string, permission: string) {
    if (!roleId) throw new Error("Role id is required");
    const p = (permission || "").trim();
    if (!p) return;

    return this.request<void>(
      `/roles/${encodeURIComponent(roleId)}/permissions`,
      {
        method: "POST",
        body: JSON.stringify({ permission: p }),
      }
    );
  }

  public async removeRolePermission(roleId: string, permission: string) {
    if (!roleId) throw new Error("Role id is required");
    const p = (permission || "").trim();
    if (!p) return;

    return this.request<void>(
      `/roles/${encodeURIComponent(roleId)}/permissions/${encodeURIComponent(p)}`,
      { method: "DELETE" }
    );
  }

  public async replaceRolePermission(roleId: string, oldPermission: string, newPermission: string) {
    if (!roleId) throw new Error("Role id is required");

    const oldP = (oldPermission || "").trim();
    const newP = (newPermission || "").trim();
    if (!oldP || !newP) throw new Error("Old/New permission is required");

    return this.request<void>(
      `/roles/${encodeURIComponent(roleId)}/permissions`,
      {
        method: "PUT",
        body: JSON.stringify({ oldPermission: oldP, newPermission: newP }),
      }
    );
  }

  // --- Account/Profile ---
  public async getProfile() {
    return this.request<any>(`/account/profile`, { method: "GET" });
  }

  public async updateProfile(data: UpdateProfileRequest) {
    return this.request<any>(`/account/profile`, {
      method: "PUT",
      body: JSON.stringify({
        fullName: data.fullName,
        email: data.email,
      }),
    });
  }

  public async changePassword(passwords: ChangePasswordRequest) {
    return this.request<any>(`/account/change-password`, {
      method: "POST",
      body: JSON.stringify(passwords),
    });
  }
}

export const api = new ApiService();
export { ApiService };

