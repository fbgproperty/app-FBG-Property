
import { api } from "./apiService";
import { Customer, Project, AIAgent } from "../types";

// AI chạy server-side qua Unified Bridge (appapi.fbgproperty.vn) — key không còn nhúng trong bundle.

// --- DỮ LIỆU MẪU BAN ĐẦU ---
const PROVINCES = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Bình Dương', 'Đồng Nai'];
const SOURCES = ['Facebook', 'Zalo', 'Google Sheets', 'Google Forms', 'Tiktok'];
const CHANNELS = ['facebook', 'zalo', 'zalo oa', 'Instagram', 'whatsapp', 'telegram', 'tiktok', 'livechat', 'gmail', 'sms', 'call'];

const MOCK_PROJECTS: Project[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `P${i + 1}`,
  name: i % 2 === 0 ? `Vinhomes Ocean Park ${i + 1}` : `NovaWorld Phan Thiết ${i + 1}`,
  location: i % 3 === 0 ? "Gia Lâm" : "Tiến Thành",
  province: PROVINCES[i % PROVINCES.length],
  investor: i % 2 === 0 ? "Vinhomes" : "Novaland",
  projectType: i % 3 === 0 ? "Căn hộ" : "Nhà phố",
  units: 500,
  available: 120,
  priceRange: `${3 + i} - ${10 + i} tỷ VNĐ`,
  imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  description: "Dự án cao cấp với tiện ích đồng bộ.",
  status: "Selling",
  products: [],
  documents: []
}));

const MOCK_CUSTOMERS: Customer[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `C${i + 1}`,
    name: `Khách hàng ${String.fromCharCode(65 + i)}`,
    email: `customer${i}@gmail.com`,
    phone: `090${1234567 + i}`,
    address: PROVINCES[i % PROVINCES.length],
    interestedProject: MOCK_PROJECTS[i % MOCK_PROJECTS.length].name,
    interests: ['Đầu tư'],
    lastInteraction: 'Vừa xong',
    status: i < 5 ? 'Tiềm năng' : 'Quan tâm',
    score: 85 + (i % 15), // Tạo ra dải điểm từ 85 đến 99, đảm bảo có nhiều khách hàng > 90
    source: SOURCES[i % SOURCES.length] as any,
    channel: 'Website',
    needs: i < 5 ? 'Khách hàng VIP, sẵn sàng đặt cọc ngay nếu pháp lý ổn.' : 'Đang tìm hiểu căn hộ 2 phòng ngủ.',
    intent: 'Đầu tư',
    conversationSummary: 'Khách hàng rất quan tâm đến chính sách chiết khấu.',
    aiAssessment: i < 5 ? 'Lead cực kỳ tiềm năng, tỷ lệ chốt trên 90%.' : 'Cần thêm thời gian tư vấn.',
    matchingProjects: [
        { projectName: MOCK_PROJECTS[i % MOCK_PROJECTS.length].name, matchPercentage: 95, reason: "Phù hợp hoàn hảo ngân sách" }
    ],
    interactionHistory: [
        { date: '21/10/2024', action: 'Tư vấn qua Call', content: 'Trao đổi về lịch thanh toán', channel: 'Gọi điện', sentiment: 'Tích cực' }
    ],
    preferredChannels: ['call', 'sms', 'zalo', 'gmail']
}));

// --- LOGIC NGHIỆP VỤ ---

export const aiScoreCustomer = async (
    needs: string,
    ctx?: { id?: string; name?: string; status?: string; viewedProjects?: string[]; webPageViews?: number; webIdentified?: boolean; leadCount?: number }
): Promise<{score: number, assessment: string}> => {
    try {
        return await api.aiScore({ needs, ...(ctx || {}) });
    } catch (e) {
        return { score: Math.floor(Math.random() * 40) + 40, assessment: "AI đang bận, chấm điểm dự phòng." };
    }
};

export const simulateIncomingLeads = async (count: number) => {
    const db = JSON.parse(localStorage.getItem('salesagent_mock_db') || '{}');
    const newLeads: Customer[] = Array.from({ length: count }).map((_, i) => {
        const id = `C_NEW_${Date.now()}_${i}`;
        return {
            id,
            name: `Khách mới ${i + 1}`,
            email: `new${i}@gmail.com`,
            phone: `098${Math.floor(Math.random() * 8999999) + 1000000}`,
            address: PROVINCES[Math.floor(Math.random() * PROVINCES.length)],
            interestedProject: MOCK_PROJECTS[0].name,
            interests: ['Mới'],
            lastInteraction: 'Vừa xong',
            status: 'Mới',
            score: 0,
            source: SOURCES[Math.floor(Math.random() * SOURCES.length)] as any,
            channel: 'Website',
            needs: "Tìm mua biệt thự để ở ngay.",
            intent: 'Ở thực',
            conversationSummary: '',
            aiAssessment: 'Đang chờ AI phân tích...',
            matchingProjects: [],
            interactionHistory: [],
            preferredChannels: ['call', 'sms']
        };
    });

    db.customers = [...newLeads, ...db.customers];
    localStorage.setItem('salesagent_mock_db', JSON.stringify(db));
    return newLeads;
};

export const runAIAgentProcessing = async (updateProgress: (p: number, msg: string) => void) => {
    const db = JSON.parse(localStorage.getItem('salesagent_mock_db') || '{}');
    const customers = db.customers as Customer[];
    
    let processedCount = 0;
    const leadsToProcess = customers.filter(c => c.score === 0 || c.status === 'Mới');
    
    for (const lead of leadsToProcess) {
        processedCount++;
        const progress = Math.round((processedCount / leadsToProcess.length) * 100);
        updateProgress(progress, `Đang phân tích khách hàng: ${lead.name}...`);
        
        const result = await aiScoreCustomer(lead.needs);
        lead.score = result.score;
        lead.aiAssessment = result.assessment;
        
        if (lead.score >= 90) {
            lead.status = 'Tiềm năng';
        } else if (lead.score >= 50) {
            lead.status = 'Quan tâm';
        }
    }

    db.customers = customers;
    localStorage.setItem('salesagent_mock_db', JSON.stringify(db));
    updateProgress(100, "Hoàn tất quá trình quét AI!");
};

const initializeMockDataIfNeeded = async () => {
    const dbKey = 'salesagent_mock_db';
    // Xóa DB cũ để nạp DB mới có điểm số > 90
    localStorage.removeItem(dbKey);
    
    const initialDB = {
        projects: MOCK_PROJECTS,
        customers: MOCK_CUSTOMERS,
        agents: [
            { id: 'A1', name: 'Agent Alpha', role: 'Tư vấn dự án', assignedProject: 'Vinhomes Ocean Park 1', status: 'Active', successRate: 88, interactionsCount: 1250, caringCount: 42 },
            { id: 'A2', name: 'Agent Beta', role: 'Phân loại Lead', assignedProject: 'NovaWorld Phan Thiết 1', status: 'Active', successRate: 92, interactionsCount: 3400, caringCount: 156 }
        ],
        leads: [],
        billing: {
            details: [{ apiName: 'Gemini 3 Pro API', requests: 12500, cost: 250.50, change: 12.5 }],
            trend: [{ date: '21/10', cost: 42 }]
        }
    };
    localStorage.setItem(dbKey, JSON.stringify(initialDB));
};

initializeMockDataIfNeeded();

export const getAIProjectsData = async (force?: boolean) => api.get<Project[]>('/projects');
export const getAIProjectById = async (id: string) => (await getAIProjectsData()).find(p => p.id === id);
export const getAIDashboardData = async () => {
    const db = JSON.parse(localStorage.getItem('salesagent_mock_db') || '{}');
    return {
        stats: {
            activeProjects: db.projects.length,
            totalLeads: db.customers.length,
            activeAgents: db.agents.length,
            revenue: "$4.2M"
        },
        chartData: [
            { name: 'T2', sales: 400, leads: 240 }, { name: 'T3', sales: 300, leads: 139 },
            { name: 'T4', sales: 200, leads: 980 }, { name: 'T5', sales: 278, leads: 390 }
        ],
        activities: []
    };
};
export const getAICDPData = async () => api.get<Customer[]>('/customers');
export const getAIAgentsData = async () => api.get<AIAgent[]>('/agents');
export const getAIBillingData = async () => api.get<any>('/billing');
export const saveCDPToCache = (customers: Customer[]) => {
    const db = JSON.parse(localStorage.getItem('salesagent_mock_db') || '{}');
    db.customers = customers;
    localStorage.setItem('salesagent_mock_db', JSON.stringify(db));
};
export const saveAgentsToCache = (agents: AIAgent[]) => {
    const db = JSON.parse(localStorage.getItem('salesagent_mock_db') || '{}');
    db.agents = agents;
    localStorage.setItem('salesagent_mock_db', JSON.stringify(db));
};
export const saveProjectsToCache = (projects: Project[]) => {
    const db = JSON.parse(localStorage.getItem('salesagent_mock_db') || '{}');
    db.projects = projects;
    localStorage.setItem('salesagent_mock_db', JSON.stringify(db));
};

export const analyzeProject = async (name: string, details: string) => {
    try {
        const res = await api.aiAnalyze({ name, details });
        return res.text;
    } catch (e) {
        return "AI tạm thời không khả dụng.";
    }
};
