/**
 * API SERVICE (REAL BACKEND)
 * - Login payload: { emailOrUsername, password }
 * - Response: { accessToken, tokenType, expiresInSeconds, user }
 */
import { AIAgent } from "../types";
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

const DEFAULT_AGENT_FALLBACK: Pick<AIAgent, "role" | "assignedProject" | "successRate" | "interactionsCount" | "caringCount"> = {
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
  // fallback an toàn để UI không vỡ
  return "Idle";
}

/** Map backend DTO -> UI model (AIAgent) */
export function mapDtoToAIAgent(dto: AgentDto): AIAgent {
  const cfg = safeJsonParse<AgentConfig>(dto.configJson) ?? {};
  // channelsJson bạn có thể parse để dùng sau, hiện UI chưa dùng thì cứ giữ nguyên trong cfg nếu muốn
  // const channels = safeJsonParse<any>(dto.channelsJson);

  return {
    id: dto.id,
    name: dto.name,
    status: normalizeStatus(dto.status),

    // các field UI cần nhưng backend không có -> lấy từ configJson hoặc default
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
    channelsJson: null, // nếu bạn có UI cấu hình kênh sau này thì serialize vào đây
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

// ===== Import Google Sheets (Link) =====
// export type ImportCustomersFromSheetLinkRequest = {
//   sheetUrl: string;
//   sheetName: string;
//   rangeA1: string;
//   hasHeaderRow?: boolean; // default true
//   upsert?: boolean;       // default true
// };

// export type ImportResultDto = {
//   total: number;
//   inserted: number;
//   updated: number;
//   skipped: number;
//   errors: number;
//   errorMessages: string[];
// };

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

export type UpsertCustomerRequest = {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  source: string;
  tags?: string | null;
};

// servicesService.ts
// export type CampaignDto = {
//   id: string;
//   name: string;
//   status: string;   // Draft | Active | Paused | ...
//   startAt?: string | null;
//   endAt?: string | null;
// };

export type CustomerDetailVM = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  source: string;
  tags?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  metadataJson?: string | null;

  leads: Array<{
    id: string;
    stage: string;
    score: number;
    source: string;
    projectId?: string | null;
    unitId?: string | null;
    createdAt: string;
    updatedAt?: string | null;
  }>;

  conversations: Array<{
    id: string;
    customerId: string;
    agentId?: string | null;
    channel?: string | null;
    startedAt: string;
    lastMessageAt: string;
    status: string;
  }>;

  messages: Array<{
    id: string;
    conversationId: string;
    senderType: string;
    senderId?: string | null;
    content: string;
    createdAt: string;
  }>;

  events: Array<{
    id: string;
    customerId?: string | null;
    anonymousKey?: string | null;
    channel: string;
    eventType: string;
    eventTime: string;
    payloadJson?: string | null;
  }>;

  interests: Array<{
    id: string;
    customerId: string;
    projectId?: string | null;
    unitId?: string | null;
    level: number;
    note?: string | null;
    createdAt: string;
  }>;
};

export type CreateCampaignRequest = {
  name: string;
  projectId: string;
  startAt: string;     // ISO
  endAt: string;       // ISO
  targetLeads: number;
  limitAiAgent: number;
};

export type CreateCampaignResponse = {
  id: string;
};

// servicesService.ts

export type AgentProjectAssignmentDto = {
  id: string;
  agentId: string;
  projectId?: string | null;
  campaignId: string;
  status?: string | null;
  createdAt: string;
};

export type UpdateCampaignStatusRequest = { status?: string | null };

export type UpdateCampaignRequest = {
  name: string;
  status?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  targetLeads?: number | null;
  limitAiAgent?: number | null;
};

export type CreateAgentProjectAssignmentRequest = {
  agentId: string;
  // projectId?: string | null;
  campaignId: string;
  status?: string | null;
};

export type CreateAgentProjectAssignmentResponse = {
  id: string;
};

export type UpdateAgentProjectAssignmentRequest = {
  projectId?: string | null;
  campaignId?: string | null;
  status?: string | null;
};

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

const mapCampaignApiToUi = (x: any): CampaignDto => ({
  id: (x.id ?? x.Id ?? '') as string,
  name: (x.name ?? x.Name ?? '') as string,
  status: (x.status ?? x.Status ?? '') as string,
  startAt: (x.startAt ?? x.StartAt ?? null) as any,
  endAt: (x.endAt ?? x.EndAt ?? null) as any,
  agentsAiActive: Number(x.AgentsAiActive ?? 0),
  targetLeads: Number(x.TargetLeads ?? 0),
  currentLeads: Number(x.CurrentLeads ?? 0),
  limitAiAgent: Number(x.LimitAiAgent ?? 0),
  progress: Number(x.Progress ?? 0),
});

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


class ApiService {
  private baseUrl = 'https://localhost:44370';
  // private baseUrl = 'http://localhost/api';
  // private baseUrl = '/api';
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
      return;
    }
    localStorage.setItem(this.tokenKey, accessToken);
    localStorage.setItem(this.tokenTypeKey, tokenType || 'Bearer');
  }

  public getAccessToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public getTokenType(): string {
    return localStorage.getItem(this.tokenTypeKey) || 'Bearer';
  }

  private getHeaders(extra?: Record<string, string>): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-App-Platform': 'SalesAgent-AI-Platform',
      ...(extra || {}),
    });

    const token = this.getAccessToken();
    if (token) headers.append('Authorization', `${this.getTokenType()} ${token}`);

    return headers;
  }

  private async parseError(res: Response): Promise<Error> {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = await res.json();
    } catch {
      // ignore
    }
    const msg =
      payload?.message ||
      payload?.error ||
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
    const url = this.buildUrl(endpoint);

    const res = await fetch(url, {
      ...options,
      headers: this.getHeaders(
        options.headers ? (options.headers as Record<string, string>) : undefined
      ),
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

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ===== AUTH =====

  /**
   * Sửa đúng endpoint backend của bạn nếu khác:
   * Ví dụ phổ biến: /auth/login hoặc /auth/sign-in
   */
  public async login(emailOrUsername: string, password: string): Promise<LoginResponse> {
    const payload: LoginRequest = { emailOrUsername, password };

    const data = await this.post<LoginResponse>('/auth/login', payload);

    if (!data?.accessToken) throw new Error('Login API không trả về accessToken.');

    this.setAuth(data.accessToken, data.tokenType || 'Bearer');
    return data;
  }

  public logout() {
    this.setAuth(null, null);
  }

  public async getProjects(query: ProjectsQuery) {
    const qs = this.buildQuery(query);
    return this.request<ApiPagedResponse<ApiProjectItem>>(`/projects${qs}`, {
      method: 'GET',
    });
  }

  public async getProjectDetail(id: string): Promise<ApiProjectDetail> {
    if (!id) throw new Error('Project id is required');
    return this.request<ApiProjectDetail>(`/projects/${id}`, {
      method: 'GET',
    });
  }

  public async getCustomers(params: { q?: string; page: number; pageSize: number }) {
    const sp = new URLSearchParams();
    if (params.q) sp.set('q', params.q);
    sp.set('page', String(params.page));
    sp.set('pageSize', String(params.pageSize));
  
    return api.request(`/customers?${sp.toString()}`, { method: 'GET' });
  }
  

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

  public async importCustomersGoogleSheets(payload: ImportCustomersRequest) {
    return api.request<ImportCustomersResult>(`/customers/import/google-sheets`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async importCustomersGoogleForms(payload: ImportCustomersRequest) {
    return api.request<ImportCustomersResult>(`/customers/import/google-form`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // public async importCustomersExcel(payload: { file: File; upsert: boolean; hasHeaderRow: boolean }) {
  //   const form = new FormData();
  //   form.append('file', payload.file); // đúng tên field: File
  //   form.append('upsert', String(payload.upsert));
  //   form.append('hasHeaderRow', String(payload.hasHeaderRow));

  //   return api.request<ImportCustomersResult>(`/customers/import/excel`, {
  //     method: 'POST',
  //     body: form,
  //     // lưu ý: api.request phải KHÔNG set Content-Type khi body là FormData
  //   });
  // }

  // public async importCustomersFromGoogleSheetsLink(payload: ImportCustomersFromSheetLinkRequest) {
  //   return api.request<ImportResultDto>(`/customers/import/google-sheets/link`, {
  //     method: 'POST',
  //     body: JSON.stringify({
  //       sheetUrl: payload.sheetUrl,
  //       sheetName: payload.sheetName,
  //       rangeA1: payload.rangeA1,
  //       hasHeaderRow: payload.hasHeaderRow ?? true,
  //       upsert: payload.upsert ?? true,
  //     }),
  //     headers: { 'Content-Type': 'application/json' },
  //   });
  // }

  public async importCustomersFromGoogleSheetsLink(payload: ImportCustomersFromSheetLinkRequest) {
    return api.request<ImportResultDto>(`/customers/import/google-sheets/link`, {
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
    return api.request<ImportResultDto>(`/customers/import/google-forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  // public async importCustomersFromExcel(args: { file: File; upsert: boolean; hasHeaderRow: boolean }) {
  //   const fd = new FormData();
  //   // đúng tên field theo swagger: File, Upsert, HasHeaderRow
  //   fd.append('File', args.file);
  //   fd.append('Upsert', String(args.upsert));
  //   fd.append('HasHeaderRow', String(args.hasHeaderRow)); 

  //   // IMPORTANT: không set Content-Type, browser sẽ tự set boundary
  //   return api.request<ImportResultDto>(`/customers/import/excel`, {
  //     method: 'POST',
  //     body: fd,
  //   });
  // }

  public async importCustomersFromExcel(
    //baseUrl: string,         // ví dụ: "https://localhost:5001" hoặc "http://localhost:5000"
    file: File,
    upsert = true,
    hasHeaderRow = true,
    token?: string           // optional nếu bạn có auth (Bearer)
  ) {
    const fd = new FormData();
  
    // ✅ MUST match backend field name exactly: "File"
    fd.append('File', file);
  
    // ✅ These are form fields
    fd.append('Upsert', String(upsert));
    fd.append('HasHeaderRow', String(hasHeaderRow));
  
    const res = await fetch(`${this.baseUrl}/customers/import/excel`, {
      method: 'POST',
      body: fd,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // ❌ DO NOT set "Content-Type" here
      },
    });
  
    // try parse json (backend usually returns json even on error)
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      (err as any).status = res.status;
      (err as any).data = data;
      throw err;
    }
  
    return data as {
      total: number;
      inserted: number;
      updated: number;
      skipped: number;
      errors: number;
      errorMessages: string[];
    };
  }

  public async deleteCustomer(id: string) {
    return api.request<void>(`/customers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  public async createCustomer(body: UpsertCustomerRequest) {
    return api.request<void>(`/customers`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async updateCustomer(id: string, body: UpsertCustomerRequest) {
    return api.request<void>(`/customers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public async getCustomerDetail(id: string) {
    return api.request<CustomerDetailVM>(`/customers/${id}/detail`, { method: 'GET' });
  }

  // public async getAgents() {
  //   const dtos = await api.request<AgentDto[]>(`/agents`, { method: "GET" });
  //   return (dtos ?? []).map(mapDtoToAIAgent);
  // }

  public async getAgents(): Promise<AIAgent[]> {
    const res = await api.request<any>(`/agents`, { method: "GET" });
    // console.log(res);

    // support: trả thẳng mảng hoặc wrapper { items: [...] }
    const dtos: AgentDto[] = Array.isArray(res) ? res : (res?.items ?? []);
    return dtos.map(mapDtoToAIAgent);
  }
  
  public async createAgent(body: Partial<AIAgent>) {
    const dto = mapAIAgentToDto(body);
    dto.id = ""; // để backend tự tạo Guid (nếu backend yêu cầu bỏ id thì remove hẳn id)
    const created = await api.request<AgentDto>(`/agents`, {
      method: "POST",
      body: JSON.stringify(dto),
    });
    return mapDtoToAIAgent(created);
  }
  
  // public async updateAgent(id: string, body: Partial<AIAgent>) {
  //   const dto = mapAIAgentToDto({ ...body, id });
  //   const updated = await api.request<AgentDto>(`/agents/${encodeURIComponent(id)}`, {
  //     method: "PUT",
  //     body: JSON.stringify(dto),
  //   });
  //   return mapDtoToAIAgent(updated);
  // }

  public async updateAgentStatus(id: string, body: { status: string }) {
    return this.request<void>(`/agents/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  public async updateAgent(id: string, body: { name: string; status: string; channelsJson?: string | null; configJson?: string | null }) {
    return api.request<void>(`/agents/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  
  public async deleteAgent(id: string) {
    return api.request<void>(`/agents/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  public async getCampaigns() {
    return api.request<CampaignDto[]>(`/campaigns`, { method: "GET" });
  }

  public async getProjectsCbx() {
    return this.request<ApiPagedResponse<ApiProjectItem>>(`/projects`, {
      method: 'GET',
    });
  }

  public async createCampaign(body: CreateCampaignRequest) {
    return api.request<CreateCampaignResponse>(`/campaigns`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // public async getCampaignAgents(campaignId: string) {
  //   return api.request<AgentDto[]>(`/campaigns/${encodeURIComponent(campaignId)}/agents`, {
  //     method: 'GET',
  //   });
  // }

  // public async addAgentToCampaign(campaignId: string, agentId: string) {
  //   return api.request<void>(`/campaigns/${encodeURIComponent(campaignId)}/agents`, {
  //     method: 'POST',
  //     body: JSON.stringify({ agentId }),
  //   });
  // }

  // public async removeAgentFromCampaign(campaignId: string, agentId: string) {
  //   return api.request<void>(
  //     `/campaigns/${encodeURIComponent(campaignId)}/agents/${encodeURIComponent(agentId)}`,
  //     { method: 'DELETE' }
  //   );
  // }

  // public async updateAgent(id: string, body: Partial<AgentDto>) {
  //   return api.request<void>(`/agents/${encodeURIComponent(id)}`, {
  //     method: 'PUT',
  //     body: JSON.stringify(body),
  //   });
  // }

  public async getAssignmentsByCampaign(campaignId: string) {
    return api.request<AgentProjectAssignmentDto[]>(
      `/agent-project-assignments?campaignId=${encodeURIComponent(campaignId)}`,
      { method: 'GET' }
    );
  }

  public async createAssignment(body: CreateAgentProjectAssignmentRequest) {
    return api.request<CreateAgentProjectAssignmentResponse>(`/agent-project-assignments`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  public async updateCampaignStatus(id: string, body: UpdateCampaignStatusRequest) {
    return api.request<void>(`/campaigns/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public async updateCampaign(id: string, body: UpdateCampaignRequest) {
    return api.request<void>(`/campaigns/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public async updateAssignment(id: string, body: UpdateAgentProjectAssignmentRequest) {
    return api.request<void>(`/agent-project-assignments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  public async deleteAssignment(id: string) {
    return api.request<void>(`/agent-project-assignments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // public async getAIDashboardData() {
  //   return api.request<{
  //     stats: {
  //       activeProjects: number;
  //       totalLeads: number;
  //       activeAgents: number;
  //       revenue: number;
  //     };
  //     chartData: Array<{
  //       name: string;
  //       leads: number;
  //     }>;
  //   }>(`/dashboard/ai`, {
  //     method: 'GET',
  //   });
  // }

  // public async simulateIncomingLeads(count: number) {
  //   return api.request<
  //     {
  //       id: string;
  //       fullName: string;
  //       source: string;
  //       phone: string;
  //       createdAt: string;
  //     }[]
  //   >(
  //     `/dashboard/simulate-leads?count=${encodeURIComponent(count)}`,
  //     {
  //       method: 'POST',
  //     }
  //   );
  // }

  public async getAIDashboardData() {
    return api.request<DashboardData>(`/dashboard/ai`, { method: 'GET' });
  }
  
  public async simulateIncomingLeads(count: number) {
    return api.request<LeadSimulatedDto[]>(
      `/dashboard/simulate-leads?count=${encodeURIComponent(count)}`,
      { method: 'POST' }
    );
  }
  
  // ✅ bỏ SSE: gọi 1 phát nhận steps rồi giả lập progress/log ở FE
  public async runAIAgentProcessing(
    onProgress: (progress: number, msg: string) => void
  ): Promise<void> {
    const res = await api.request<RunAiProcessResponse>(`/dashboard/run-ai-process`, {
      method: 'POST',
    });
  
    for (const s of res.steps) {
      onProgress(s.progress, s.message);
      await new Promise((r) => setTimeout(r, s.delayMs));
    }
  }


  
  
}

export const api = new ApiService();
