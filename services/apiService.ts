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
  // Bridge ERPNext trên Cloud Run của FBG (dữ liệu thật từ erp.fbgproperty.vn)
  private baseUrl = 'https://api-qrgg43xita-as.a.run.app';
  // private baseUrl = 'https://localhost:44370';

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

  public async getProjects(query: ProjectsQuery) {
    const qs = this.buildQuery(query);
    return this.request<ApiPagedResponse<ApiProjectItem>>(`/projects${qs}`, { method: 'GET' });
  }

  public async getProjectDetail(id: string): Promise<ApiProjectDetail> {
    if (!id) throw new Error('Project id is required');
    return this.request<ApiProjectDetail>(`/projects/${id}`, { method: 'GET' });
  }

  public async getProjectsCbx() {
    return this.request<ApiPagedResponse<ApiProjectItem>>(`/projects`, { method: 'GET' });
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
    const qs = this.buildQuery({
      search: query.search,
      source: query.source && query.source !== "all" ? query.source : undefined,
      projectId: query.projectId,
      projectExternalId: query.projectExternalId,
      statusLabel: query.statusLabel,
      isFeatured: query.isFeatured,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
      orderBy: query.orderBy ?? "syncedAt",
      orderDir: query.orderDir ?? "desc",
    });

    return this.request<PagedResult<RaiPropertyDto>>(`/rai-properties${qs}`, { method: "GET" });
  }

  public async getRaiPropertyDetail(id: string) {
    if (!id) throw new Error("RaiProperty id is required");
    return this.request<RaiPropertyDto>(`/rai-properties/${encodeURIComponent(id)}`, { method: "GET" });
  }

  public async getRaiPropertySources() {
    return this.request<string[]>(`/rai-properties/sources`, { method: "GET" });
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

