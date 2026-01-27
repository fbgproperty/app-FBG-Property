// =============== DANH SÁCH KHÁCH HÀNG ================
import React, { useEffect, useState } from 'react';
import { Project } from '../types'; // giữ để UI không lỗi (hiện chưa dùng)
import { api } from '../services/apiService';
import Pagination from '../components/Pagination';
import {
  Search, Filter, Mail, Phone, Loader2,
  RefreshCw, Database,
  Facebook, MessageCircle, Share2,
  ChevronDown, UserPlus,
  Star, LayoutGrid, List,
  Trash2, Edit2, XCircle, MessageSquare,
  Smartphone, Video, FileUp, ClipboardList,
  Link, UploadCloud, FileText,
  Instagram, Send, Headset, MessageSquareText,
  CheckCircle2, Zap, FileSpreadsheet, Calendar, MapPin, Info, UserCheck, Clock, Target, Heart, Eye, Code,
  Activity, Briefcase, History
} from 'lucide-react';

import { formatDateTime } from '../components/utils/formatDate';

const ITEMS_PER_PAGE = 8;

// ===== Backend DTOs =====
type CustomerDto = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  source: string;
  tags?: string | null; // backend: string? Tags
};

type PagedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

// ===== ViewModel cho UI =====
type CustomerVM = {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  source: string;
  tags?: string;
  score: number; // placeholder
  status: string; // placeholder
  needs?: string; // placeholder
};

type LeadVM = {
  id: string;
  stage: string;
  score: number;
  source: string;
  projectId?: string | null;
  unitId?: string | null;
  createdAt: string;
};

type ConversationVM = {
  id: string;
  channel?: string | null;
  status: string;
  startedAt: string;
  lastMessageAt: string;
  agentId?: string | null;
};

type MessageVM = {
  id: string;
  conversationId: string;
  senderType: string;
  senderId?: string | null;
  content: string;
  createdAt: string;
};

type CustomerEventVM = {
  id: string;
  channel: string;
  eventType: string;
  eventTime: string;
  payloadJson?: string | null;
};

type CustomerInterestVM = {
  id: string;
  level: number;
  note?: string | null;
  projectId?: string | null;
  unitId?: string | null;
  createdAt: string;
  projectName?: string;
  unitName?: string;
};

type CustomerDetailVM = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  source: string;
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

const mapCustomerToVM = (c: CustomerDto): CustomerVM => ({
  id: c.id,
  fullName: c.fullName,
  phone: c.phone ?? '',
  email: c.email ?? '',
  source: c.source || 'Unknown',
  tags: c.tags ?? '',
  score: 50,
  status: c.tags ? 'Có tag' : 'Mới',
  needs: c.tags ? `Tags: ${c.tags}` : '',
});

const ChannelIcon: React.FC<{ name: string }> = ({ name }) => {
  const n = (name || '').toLowerCase();
  if (n.includes('facebook')) return <Facebook className="w-3.5 h-3.5 text-blue-600" />;
  if (n.includes('zalo oa')) return <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[7px] text-white font-black shadow-sm">OA</div>;
  if (n.includes('zalo')) return <MessageCircle className="w-3.5 h-3.5 text-blue-400" />;
  if (n.includes('instagram')) return <Instagram className="w-3.5 h-3.5 text-pink-600" />;
  if (n.includes('whatsapp')) return <Smartphone className="w-3.5 h-3.5 text-green-500" />;
  if (n.includes('telegram')) return <Send className="w-3.5 h-3.5 text-blue-400" />;
  if (n.includes('tiktok')) return <Share2 className="w-3.5 h-3.5 text-black" />;
  if (n.includes('livechat')) return <Headset className="w-3.5 h-3.5 text-indigo-500" />;
  if (n.includes('gmail')) return <Mail className="w-3.5 h-3.5 text-red-500" />;
  if (n.includes('sms')) return <MessageSquareText className="w-3.5 h-3.5 text-amber-500" />;
  if (n.includes('call')) return <Phone className="w-3.5 h-3.5 text-green-600" />;
  return <MessageSquare className="w-3.5 h-3.5 text-gray-400" />;
};

const SourceBadge: React.FC<{ source: string; showText?: boolean }> = ({ source, showText = true }) => {
  const config: Record<string, { icon: any; color: string; bgColor: string }> = {
    Facebook: { icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    Zalo: { icon: MessageCircle, color: 'text-blue-400', bgColor: 'bg-blue-50' },
    Youtube: { icon: Video, color: 'text-red-600', bgColor: 'bg-red-50' },
    Tiktok: { icon: Share2, color: 'text-gray-900', bgColor: 'bg-gray-100' },
    Excel: { icon: FileUp, color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    'Google Forms': { icon: ClipboardList, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    'Google Sheets': { icon: FileSpreadsheet, color: 'text-green-600', bgColor: 'bg-green-50' },
  };

  const item = config[source] || { icon: Database, color: 'text-gray-600', bgColor: 'bg-gray-50' };
  const Icon = item.icon;

  return (
    <div
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${item.bgColor} ${item.color} border border-current border-opacity-10 w-fit flex-shrink-0`}
      title={source}
    >
      <Icon className="w-2.5 h-2.5" />
      {showText && <span className="text-[8px] font-bold uppercase tracking-tight whitespace-nowrap">{source}</span>}
    </div>
  );
};

// ===== Import result (response) =====
type ImportResult = {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
};

const CDP: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerVM[]>([]);
  const [projects] = useState<Project[]>([]); // giữ để UI không lỗi (hiện chưa dùng)

  const [showSyncMenu, setShowSyncMenu] = useState(false);

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [q, setQ] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  // Modals demo (giữ UI)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerVM | null>(null);

  // Sync modal
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [syncSource, setSyncSource] = useState<'Sheets' | 'Forms' | 'Excel' | null>(null);
  const [syncStep, setSyncStep] = useState(0);

  // Sheets/Forms: JSON input (records)
  const [syncInput, setSyncInput] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [rangeA1, setRangeA1] = useState('A1:F1000'); // tuỳ bạn

  // Forms: dán JSON records
  const [formsRecordsJson, setFormsRecordsJson] = useState(`[
    {
      "fullName": "Nguyễn Văn A",
      "phone": "0900000000",
      "email": "a@gmail.com",
      "tags": "VIP",
      "metadataJson": "{}",
      "sourceRef": "form-001"
    }
  ]`);
  const [importResult, setImportResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  

  // Excel: file
  const [syncFile, setSyncFile] = useState<File | null>(null);

  // flags
  const [importUpsert, setImportUpsert] = useState(true);
  const [skipIfNoPhoneAndEmail, setSkipIfNoPhoneAndEmail] = useState(true);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);

  // result
  const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);

  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetailVM | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'conversations' | 'events' | 'leads'>('profile');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const currentSelectedEvent = selectedCustomerDetail?.events.find(e => e.id === selectedEventId);

  // ===== Add/Edit Modal State =====
  type CustomerForm = {
    id?: string;
    fullName: string;
    phone: string;
    email: string;
    source: string;
    tags: string;
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formCustomer, setFormCustomer] = useState<CustomerForm>({
    fullName: '',
    phone: '',
    email: '',
    source: 'Facebook',
    tags: '',
  });


  const fetchData = async () => {
    setLoading(true);
    try {
      const res = (await api.getCustomers({
        q: q || undefined,
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
      })) as PagedResponse<CustomerDto>;

      const mapped = (res.items ?? []).map(mapCustomerToVM);
      setCustomers(mapped);
      setTotal(res.total ?? 0);
    } catch (e: any) {
      console.error(e);
      setCustomers([]);
      setTotal(0);
      alert(e?.message || 'Không thể tải danh sách Customer từ backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, q]);

  useEffect(() => {
    setCurrentPage(1);
  }, [q]);

  const handleOpenAdd = () => {
    setFormMode('add');
    setFormCustomer({
      fullName: '',
      phone: '',
      email: '',
      source: 'Facebook',
      tags: '',
    });
    setIsFormOpen(true);
  };
  
  const openCustomerDetail = async (customerId: string) => {
    try {
      setIsInsightOpen(true);
      setDetailLoading(true);
      setSelectedCustomerDetail(null);
  
      // ✅ bạn cần có api.getCustomerDetail(customerId)
      const detail = await api.getCustomerDetail(customerId);
      setSelectedCustomerDetail(detail as CustomerDetailVM);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Không tải được chi tiết customer.');
      setIsInsightOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = (c: CustomerVM, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormMode('edit');
    setFormCustomer({
      id: c.id,
      fullName: c.fullName || '',
      phone: c.phone || '',
      email: c.email || '',
      source: c.source || 'Unknown',
      tags: c.tags || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      // 1) Validate tối thiểu
      const fullName = (formCustomer.fullName || '').trim();
      const source = (formCustomer.source || '').trim() || 'Unknown';
  
      if (!fullName) {
        alert('Vui lòng nhập FullName.');
        return;
      }
  
      // 2) Build payload theo backend
      const payload = {
        fullName,
        phone: (formCustomer.phone || '').trim() || null,
        email: (formCustomer.email || '').trim() || null,
        source,
        tags: (formCustomer.tags || '').trim() || null,
      };
  
      // 3) Call API
      if (formMode === 'add') {
        await api.createCustomer(payload);
        alert('Đã thêm khách hàng.');
        setIsFormOpen(false);
        setCurrentPage(1); // thường thêm mới muốn quay về trang 1
        fetchData();
        return;
      }
  
      // edit
      const id = formCustomer.id;
      if (!id) {
        alert('Thiếu Id customer để cập nhật.');
        return;
      }
  
      await api.updateCustomer(id, payload);
      alert('Đã cập nhật khách hàng.');
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
  
      // Support các kiểu error thường gặp:
      const data = err?.response?.data ?? err;
  
      const msg =
        data?.errors
          ? Object.entries(data.errors)
              .map(([k, v]: any) => `${k}: ${(v || []).join(', ')}`)
              .join('\n')
          : (data?.message || data?.title || 'Lưu khách hàng thất bại.');
  
      alert(msg);
    }
  };
  
    

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
  
    const ok = confirm('Bạn chắc chắn muốn xoá khách hàng này?');
    if (!ok) return;
  
    try {
      await api.deleteCustomer(id);
      alert('Đã xoá khách hàng.');
  
      // Nếu xoá xong mà trang hiện tại rỗng (ví dụ còn 1 item), lùi về trang trước cho đẹp
      if (customers.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Xoá khách hàng thất bại.');
    }
  };


  const openSyncForm = (source: 'Sheets' | 'Forms' | 'Excel') => {
    setSyncSource(source);
    setSyncStep(0);

    setSyncInput('');
    setSyncFile(null);

    setSheetUrl('');
    setSheetName('Sheet1');
    setRangeA1('A1:F1000');

    setImportResult(null);
    setImporting(false);

    setIsSyncOpen(true);
  };

  const closeSyncModal = () => {
    setIsSyncOpen(false);
    setSyncStep(0);
    setLastImportResult(null);
  };

  const handleExecuteSync = async () => {
    if (!syncSource) return;
  
    setImportResult(null);
    setImporting(true);
    setSyncStep(1);
  
    try {
      // ===== Google Sheets Link =====
      if (syncSource === 'Sheets') {
        if (!sheetUrl.trim()) return alert('Vui lòng nhập SheetUrl!');
        if (!sheetName.trim()) return alert('Vui lòng nhập SheetName!');
        if (!rangeA1.trim()) return alert('Vui lòng nhập RangeA1! Ví dụ: A1:F1000');
  
        const res = await api.importCustomersFromGoogleSheetsLink({
          sheetUrl: sheetUrl.trim(),
          sheetName: sheetName.trim(),
          rangeA1: rangeA1.trim(),
          hasHeaderRow,
          upsert: importUpsert,
        });
  
        setImportResult(res);
        setSyncStep(4);
        await fetchData();
        return;
      }
  
      // ===== Google Forms (records JSON) =====
      if (syncSource === 'Forms') {
        let parsed: any;
        try {
          parsed = JSON.parse(formsRecordsJson);
        } catch {
          alert('JSON không hợp lệ. Bạn cần dán JSON array records.');
          setSyncStep(0);
          return;
        }
  
        const records = Array.isArray(parsed) ? parsed : [parsed];
        if (!records.length) {
          alert('Danh sách records rỗng.');
          setSyncStep(0);
          return;
        }
  
        const res = await api.importCustomersFromGoogleForms({
          records,
          upsert: importUpsert,
          skipIfNoPhoneAndEmail,
        });
  
        setImportResult(res);
        setSyncStep(4);
        await fetchData();
        return;
      }
  
      // ===== Excel (multipart) =====
      if (syncSource === 'Excel') {
        if (!syncFile) {
          alert('Vui lòng chọn tệp Excel!');
          setSyncStep(0);
          return;
        }
  
        // const res = await api.importCustomersFromExcel({
        //   file: syncFile,
        //   upsert: importUpsert,
        //   hasHeaderRow,
        // });
        try {
          const result = await api.importCustomersFromExcel(
            //'https://localhost:44370', // hoặc hardcode baseUrl
            syncFile!,
            importUpsert,
            hasHeaderRow
          );
          // console.log('IMPORT RESULT:', result);
          // alert(`OK: inserted=${result.inserted}, updated=${result.updated}, skipped=${result.skipped}, errors=${result.errors}`);
          setImportResult(result);
        } catch (e: any) {
          console.error('IMPORT FAILED', e?.data || e);
          // alert(`FAIL: ${e?.message}\n${JSON.stringify(e?.data || {}, null, 2)}`);
        }
        
  
        // setImportResult(res);
        setSyncStep(4);
        await fetchData();
        return;
      }
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Import thất bại.');
      setSyncStep(0);
    } finally {
      setImporting(false);
    }
  };
  
  

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-600">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <p className="text-xs font-bold animate-pulse uppercase tracking-widest">Đang tải Customer từ backend...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-600 rounded-lg shadow-md shadow-indigo-100 flex-shrink-0">
              <Database className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight truncate">Danh sách khách hàng</h2>
          </div>
          <p className="text-[11px] text-gray-500 font-medium">
            Số lượng khách hàng • Tổng: <span className="font-black text-indigo-600">{total}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-white border border-gray-200 p-0.5 rounded-lg flex items-center shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-indigo-600 shadow-sm transition-all"
            title="Reload"
          >
            <RefreshCw className="w-4 h-4" />
          </button> */}

          {/* ✅ NÚT ĐỒNG BỘ + MENU */}
          <div className="relative">
            <button
              onClick={() => setShowSyncMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-[11px] uppercase hover:bg-gray-50 transition-all shadow-sm"
            >
              {/* <RefreshCw className={`w-3.5 h-3.5 ${showSyncMenu ? 'rotate-180' : ''} transition-transform`} /> */}
              Import
            </button>

            {showSyncMenu && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2">
                <button
                  onClick={() => { openSyncForm('Sheets'); setShowSyncMenu(false); }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <span className="text-[11px] font-bold text-gray-700">Google Sheets</span>
                </button>

                <button
                  onClick={() => { openSyncForm('Forms'); setShowSyncMenu(false); }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
                >
                  <ClipboardList className="w-4 h-4 text-purple-600" />
                  <span className="text-[11px] font-bold text-gray-700">Google Forms</span>
                </button>

                <button
                  onClick={() => { openSyncForm('Excel'); setShowSyncMenu(false); }}
                  className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
                >
                  <FileUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-bold text-gray-700">Import Excel</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-indigo-700 shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5" /> Thêm mới
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-indigo-600 shadow-sm transition-all"
            title="Reload"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-2.5 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Vui lòng nhập tìm kiếm..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-inner"
          />
        </div>

        <div className="relative w-full md:w-56 flex-shrink-0 opacity-60">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
          <select
            disabled
            value="All"
            className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-transparent rounded-lg text-[10px] font-bold uppercase outline-none appearance-none cursor-not-allowed transition-all"
            title="Backend hiện chỉ hỗ trợ q/page/pageSize"
          >
            <option value="All">Filter (disabled)</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
        </div>
      </div>

      {customers.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customers.map((c) => (
              <div
                key={c.id}
                // onClick={() => handleOpenInsight(c)}
                onClick={() => openCustomerDetail(c.id)}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group cursor-pointer relative flex flex-col min-w-0"
              >
                <div className="absolute top-3 right-3 flex-shrink-0">
                  <div className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter text-white shadow-sm flex items-center gap-0.5 whitespace-nowrap ${c.score > 80 ? 'bg-green-500' : c.score > 50 ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                    <Star className="w-2 h-2 fill-current" /> {c.score}%
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0">
                    {(c.fullName || 'C')[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-gray-900 text-[13px] truncate group-hover:text-indigo-600 transition-colors">{c.fullName}</h3>
                    <div className="mt-0.5 flex-shrink-0"><SourceBadge source={c.source || 'Unknown'} /></div>
                  </div>
                </div>

                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-gray-600 p-2 bg-gray-50 rounded-xl border border-gray-100 min-w-0">
                    <Phone className="w-3 h-3 text-indigo-500 flex-shrink-0" />
                    <span className="text-[12px] font-black text-gray-900 truncate">{c.phone || '(chưa có)'}</span>
                  </div>

                  <div className="px-1 space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium min-w-0">
                      <Mail className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">{c.email || '(chưa có email)'}</span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-bold leading-snug line-clamp-2 italic opacity-80 min-w-0">
                      {c.needs ? `"${c.needs}"` : (c.tags ? `"Tags: ${c.tags}"` : '(chưa có tags)')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between min-w-0">
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest truncate">
                    {c.status}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={(e) => handleOpenEdit(c, e)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => handleDelete(c.id, e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Khách hàng</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Số điện thoại</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Nguồn</th>
                  <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center whitespace-nowrap">Điểm AI</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id} onClick={() => openCustomerDetail(c.id)} className="hover:bg-indigo-50/20 transition-colors group cursor-pointer">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                          {(c.fullName || 'C')[0]}
                        </div>
                        <div className="font-black text-gray-900 text-[13px] truncate">{c.fullName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[11px] font-bold text-gray-700 whitespace-nowrap">{c.phone || '(n/a)'}</td>
                    <td className="px-6 py-3 text-[11px] font-bold text-gray-700 whitespace-nowrap">{c.source || 'Unknown'}</td>
                    <td className="px-6 py-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black text-white shadow-sm ${c.score > 80 ? 'bg-green-500' : c.score > 50 ? 'bg-indigo-500' : 'bg-gray-400'}`}>
                        {c.score}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={(e) => handleOpenEdit(c, e)} className="p-2 text-indigo-600 hover:bg-white rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => handleDelete(c.id, e)} className="p-2 text-red-600 hover:bg-white rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <Database className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Không có dữ liệu</p>
        </div>
      )}

      {total > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={total}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {/* ================= SYNC MODAL (IMPORT THẬT) ================= */}
      {isSyncOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {syncStep === 0 ? (
              <div className="p-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl text-white shadow-lg ${syncSource === 'Sheets' ? 'bg-green-600' : syncSource === 'Forms' ? 'bg-purple-600' : 'bg-emerald-600'}`}>
                      {syncSource === 'Sheets' ? <FileSpreadsheet className="w-8 h-8" /> : syncSource === 'Forms' ? <ClipboardList className="w-8 h-8" /> : <FileUp className="w-8 h-8" />}
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">Import {syncSource}</h3>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">
                        Sheets/Forms: nhập JSON records • Excel: upload file
                      </p>
                    </div>
                  </div>
                  <button onClick={closeSyncModal} className="text-gray-300 hover:text-red-500 transition-colors">
                    <XCircle className="w-8 h-8" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* ===== SHEETS (LINK) ===== */}
                  {syncSource === 'Sheets' && (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Link className="w-3 h-3" /> SheetUrl
                        </label>
                        <input
                          type="url"
                          value={sheetUrl}
                          onChange={(e) => setSheetUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            SheetName
                          </label>
                          <input
                            type="text"
                            value={sheetName}
                            onChange={(e) => setSheetName(e.target.value)}
                            placeholder="Sheet1"
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                            RangeA1
                          </label>
                          <input
                            type="text"
                            value={rangeA1}
                            onChange={(e) => setRangeA1(e.target.value)}
                            placeholder="A1:F1000"
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== FORMS (RECORDS JSON) ===== */}
                  {syncSource === 'Forms' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Records JSON (array)
                      </label>

                      <textarea
                        value={formsRecordsJson}
                        onChange={(e) => setFormsRecordsJson(e.target.value)}
                        rows={10}
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
                      />
                      <p className="text-[11px] text-gray-500 font-medium">
                        Dán JSON theo format: [{`{ fullName, phone, email, tags, metadataJson, sourceRef }`}]
                      </p>
                    </div>
                  )}

                  {/* ===== EXCEL (FILE) ===== */}
                  {syncSource === 'Excel' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Tệp dữ liệu Excel
                      </label>
                      <div className="relative group">
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={(e) => setSyncFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full py-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${syncFile ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 group-hover:border-indigo-400'}`}>
                          <UploadCloud className={`w-10 h-10 mb-3 ${syncFile ? 'text-green-600' : 'text-gray-300'}`} />
                          {syncFile ? <p className="text-sm font-black text-green-700">{syncFile.name}</p> : <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kéo thả tệp</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ===== OPTIONS ===== */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                      <input type="checkbox" checked={importUpsert} onChange={(e) => setImportUpsert(e.target.checked)} />
                      Upsert
                    </label>

                    <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                      <input type="checkbox" checked={hasHeaderRow} onChange={(e) => setHasHeaderRow(e.target.checked)} />
                      HasHeaderRow
                    </label>

                    {syncSource === 'Forms' && (
                      <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={skipIfNoPhoneAndEmail}
                          onChange={(e) => setSkipIfNoPhoneAndEmail(e.target.checked)}
                        />
                        SkipIfNoPhoneAndEmail
                      </label>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="pt-4 flex gap-4">
                    <button
                      onClick={() => setIsSyncOpen(false)}
                      className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
                      disabled={importing}
                    >
                      Hủy bỏ
                    </button>

                    <button
                      onClick={handleExecuteSync}
                      className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 disabled:opacity-60"
                      disabled={importing}
                    >
                      <Zap className="w-4 h-4 fill-current" /> {importing ? 'Đang import...' : 'Bắt đầu'}
                    </button>
                  </div>

                  {/* RESULT */}
                  {importResult && (
                    <div className="mt-2 text-left bg-gray-50 border border-gray-100 rounded-2xl p-4">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kết quả import</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><b>Total:</b> {importResult.total}</div>
                        <div><b>Inserted:</b> {importResult.inserted}</div>
                        <div><b>Updated:</b> {importResult.updated}</div>
                        <div><b>Skipped:</b> {importResult.skipped}</div>
                        <div><b>Errors:</b> {importResult.errors}</div>
                      </div>
                      {!!importResult.errorMessages?.length && (
                        <ul className="mt-2 list-disc pl-5 text-xs text-red-600">
                          {importResult.errorMessages.slice(0, 5).map((m: string, idx: number) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>


                {/* <div className="space-y-6">
                  {syncSource !== 'Excel' ? (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> JSON Payload (records)
                      </label>

                      <textarea
                        value={syncInput}
                        onChange={(e) => setSyncInput(e.target.value)}
                        className="w-full min-h-[200px] px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
                        placeholder={`{
                          "records":[
                            {"fullName":"...", "phone":"...", "email":"...", "tags":"...", "metadataJson":"{}", "sourceRef":"..."}
                          ]
                        }`}
                      />

                      <div className="flex items-center gap-6 pt-1">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                          <input type="checkbox" checked={importUpsert} onChange={(e) => setImportUpsert(e.target.checked)} />
                          Upsert
                        </label>

                        <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                          <input type="checkbox" checked={skipIfNoPhoneAndEmail} onChange={(e) => setSkipIfNoPhoneAndEmail(e.target.checked)} />
                          Skip if no phone & email
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Tệp dữ liệu Excel
                      </label>

                      <div className="relative group">
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={(e) => setSyncFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full py-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${syncFile ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 group-hover:border-indigo-400'}`}>
                          <UploadCloud className={`w-10 h-10 mb-3 ${syncFile ? 'text-green-600' : 'text-gray-300'}`} />
                          {syncFile ? <p className="text-sm font-black text-green-700">{syncFile.name}</p> : <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chọn hoặc kéo thả tệp</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 pt-1">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                          <input type="checkbox" checked={importUpsert} onChange={(e) => setImportUpsert(e.target.checked)} />
                          Upsert
                        </label>

                        <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                          <input type="checkbox" checked={hasHeaderRow} onChange={(e) => setHasHeaderRow(e.target.checked)} />
                          HasHeaderRow
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex gap-4">
                    <button onClick={closeSyncModal} className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]">
                      Hủy bỏ
                    </button>
                    <button onClick={handleExecuteSync} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2">
                      <Zap className="w-4 h-4 fill-current" /> Bắt đầu Import
                    </button>
                  </div>
                </div> */}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
                  <div className="relative w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl">
                    {syncStep === 4 ? <CheckCircle2 className="w-12 h-12" /> : <RefreshCw className="w-12 h-12 animate-spin" />}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-2">
                  {syncStep === 1 && `Đang import ${syncSource}...`}
                  {syncStep === 4 && 'Import hoàn tất!'}
                </h3>

                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden my-10 shadow-inner">
                  <div className="bg-indigo-600 h-full transition-all duration-700 ease-out shadow-lg" style={{ width: `${(Math.min(syncStep, 4) / 4) * 100}%` }}></div>
                </div>

                {syncStep === 4 && lastImportResult && (
                  <div className="text-left bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Kết quả import</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="font-black">Total:</span> {lastImportResult.total}</div>
                      <div><span className="font-black">Inserted:</span> {lastImportResult.inserted}</div>
                      <div><span className="font-black">Updated:</span> {lastImportResult.updated}</div>
                      <div><span className="font-black">Skipped:</span> {lastImportResult.skipped}</div>
                      <div><span className="font-black">Errors:</span> {lastImportResult.errors}</div>
                    </div>

                    {lastImportResult.errorMessages?.length > 0 && (
                      <ul className="mt-3 text-xs text-red-600 list-disc pl-5">
                        {lastImportResult.errorMessages.map((m, idx) => <li key={idx}>{m}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                {syncStep === 4 && (
                  <button onClick={closeSyncModal} className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-transform">
                    Quay lại
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- COMPACT CENTRAL MODAL (POPUP NHỎ GỌN) --- */}
      {isInsightOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-4xl h-full max-h-[85vh] shadow-2xl rounded-[2.5rem] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
              
              {/* Header */}
              <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                 <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-20 h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl border-4 border-white">
                        {selectedCustomerDetail?.fullName[0] || 'N'}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCustomerDetail?.fullName}</h3>
                       <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-400">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-indigo-100">IDENTITY VERIFIED</span>
                          <span className="tabular-nums">{selectedCustomerDetail?.phone}</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setIsInsightOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                    <XCircle className="w-8 h-8" />
                 </button>
              </div>

              {/* Navigation Tabs */}
              <div className="px-8 py-0.5 bg-white border-b border-slate-50 flex gap-8 overflow-x-auto no-scrollbar">
                 {[
                    { id: 'profile', label: 'Hồ sơ gốc', icon: Info },
                    { id: 'conversations', label: 'Hội thoại', icon: MessageSquare },
                    { id: 'events', label: 'Hoạt động', icon: History },
                    { id: 'leads', label: 'Cơ hội', icon: Target },
                 ].map(tab => (
                    <button
                       key={tab.id}
                       onClick={() => setActiveDetailTab(tab.id as any)}
                       className={`flex items-center gap-2 pb-3.5 pt-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${activeDetailTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                       <tab.icon className="w-4 h-4" />
                       {tab.label}
                    </button>
                 ))}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto bg-slate-50/40 p-8 custom-scrollbar">
                 {detailLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-indigo-600">
                      <Loader2 className="w-8 h-8 animate-spin mb-3" />
                      <p className="text-[11px] font-black uppercase tracking-widest">Đang trích xuất dữ liệu...</p>
                    </div>
                 ) : selectedCustomerDetail && (
                    <div className="h-full animate-in fade-in duration-500">
                       
                       {/* --- TAB 1: PROFILE --- */}
                       {activeDetailTab === 'profile' && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div className="md:col-span-2 bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">Định danh người dùng</h4>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                   {[
                                      { label: 'Họ tên', value: selectedCustomerDetail.fullName, icon: UserCheck },
                                      { label: 'Số điện thoại', value: selectedCustomerDetail.phone, icon: Smartphone },
                                      { label: 'Email', value: selectedCustomerDetail.email, icon: Mail },
                                      { label: 'Nguồn dữ liệu', value: selectedCustomerDetail.source, icon: Send },
                                      { label: 'Ngày tạo hồ sơ', value: formatDateTime(selectedCustomerDetail.createdAt), icon: Calendar },
                                      { label: 'Cập nhật cuối', value: selectedCustomerDetail.updatedAt || 'N/A', icon: Clock },
                                   ].map((item, i) => (
                                      <div key={i} className="space-y-1">
                                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><item.icon className="w-3 h-3" /> {item.label}</p>
                                         <p className="text-[13px] font-bold text-slate-800 truncate">{item.value || '-'}</p>
                                      </div>
                                   ))}
                                   <div className="col-span-2 space-y-1">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Địa chỉ</p>
                                      <p className="text-[13px] font-bold text-slate-800 break-words">{selectedCustomerDetail.address || '-'}</p>
                                   </div>
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Metadata Analysis</p>
                                   <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden shadow-inner border border-slate-800">
                                      <pre className="text-emerald-400 font-mono text-[10px] leading-relaxed max-h-[150px] overflow-auto custom-scrollbar">
                                         {JSON.stringify(JSON.parse(selectedCustomerDetail.metadataJson || '{}'), null, 3)}
                                      </pre>
                                   </div>
                                </div>
                             </div>

                             <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-1">Chỉ số quan tâm AI</h4>
                                {selectedCustomerDetail.interests.map((interest, idx) => (
                                   <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-rose-100 transition-all">
                                      <div className="flex justify-between items-center mb-3">
                                         <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                                         <span className="text-[11px] font-black text-slate-900">{interest.level}/100</span>
                                      </div>
                                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                                         <div className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full" style={{ width: `${interest.level * 10}%` }}></div>
                                      </div>
                                      <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">"{interest.note}"</p>
                                   </div>
                                ))}
                             </div>
                          </div>
                       )}

                       {/* --- TAB 2: CONVERSATIONS --- */}
                       {activeDetailTab === 'conversations' && (
                          <div className="h-[450px] flex gap-6">
                             <div className="w-[280px] overflow-y-auto space-y-3 pr-2 custom-scrollbar border-r border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 sticky top-0 bg-white/10 backdrop-blur-sm">Lịch sử hội thoại</p>
                                {selectedCustomerDetail.conversations.map(conv => (
                                   <div 
                                      key={conv.id}
                                      onClick={() => setSelectedConvId(conv.id)}
                                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedConvId === conv.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-50 hover:border-indigo-100 shadow-sm'}`}
                                   >
                                      <div className="flex justify-between items-start mb-2">
                                         <div className="flex items-center gap-2">
                                            <ChannelIcon name={conv.channel || ''} className={`w-4 h-4 ${selectedConvId === conv.id ? 'text-white' : ''}`} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">{conv.channel}</span>
                                         </div>
                                         <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${conv.status === 'Closed' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-400 text-white'}`}>{conv.status}</span>
                                      </div>
                                      <p className={`text-[9px] font-bold truncate opacity-70 ${selectedConvId === conv.id ? 'text-indigo-100' : 'text-slate-400'}`}>Ngày tạo: {formatDateTime(conv.startedAt)}</p>
                                   </div>
                                ))}
                             </div>

                             <div className="flex-1 bg-white rounded-3xl border border-slate-100 flex flex-col overflow-hidden shadow-inner">
                                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/20 custom-scrollbar">
                                   {selectedCustomerDetail.messages.filter(m => m.conversationId === selectedConvId).map(msg => (
                                      <div key={msg.id} className={`flex ${msg.senderType === 'Customer' ? 'justify-end' : 'justify-start'}`}>
                                         <div className="flex flex-col max-w-[85%]">
                                            <div className={`p-4 rounded-2xl text-[13px] font-semibold leading-relaxed shadow-sm ${msg.senderType === 'Customer' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                                               {msg.content}
                                            </div>
                                            <p className={`mt-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest ${msg.senderType === 'Customer' ? 'text-right' : ''}`}>
                                              {msg.senderType === 'Agent' ? 'Hệ thống' : 'Khách hàng'} • {msg.createdAt.split(' ')[1]}
                                            </p>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                       )}

                       {/* --- TAB 3: EVENTS (SPLIT VIEW RÕ RÀNG) --- */}
                       {activeDetailTab === 'events' && (
                          <div className="h-[480px] flex gap-8">
                             {/* Timeline List */}
                             <div className="w-[320px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 sticky top-0 bg-white/10 backdrop-blur-sm">Dòng thời gian sự kiện</p>
                                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                                  {selectedCustomerDetail.events.map((ev) => (
                                     <div 
                                        key={ev.id}
                                        onClick={() => setSelectedEventId(ev.id)}
                                        className={`relative group cursor-pointer transition-all ${selectedEventId === ev.id ? 'scale-[1.02]' : ''}`}
                                     >
                                        <div className={`absolute -left-[33px] top-2 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all ${selectedEventId === ev.id ? 'bg-indigo-600 scale-125' : 'bg-slate-200 group-hover:bg-indigo-300'}`}></div>
                                        <div className={`p-4 rounded-2xl border-2 transition-all ${selectedEventId === ev.id ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-transparent hover:border-slate-100'}`}>
                                           <div className="flex items-center gap-3 mb-1">
                                              <ChannelIcon name={ev.channel} className="w-3.5 h-3.5" />
                                              <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">{ev.eventType}</h5>
                                           </div>
                                           <p className="text-[10px] font-bold text-slate-400 tabular-nums">Thời gian: {formatDateTime(ev.eventTime)}</p>
                                        </div>
                                     </div>
                                  ))}
                                </div>
                             </div>

                             {/* Action Inspector (Chi tiết hành động) */}
                             <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden ring-1 ring-slate-200/50">
                                {currentSelectedEvent ? (
                                   <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                                      {/* Header Chi tiết */}
                                      <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                         <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                               <Zap className="w-6 h-6" />
                                            </div>
                                            <div>
                                               <h6 className="text-sm font-black text-slate-900 uppercase tracking-widest">Sự kiện: {currentSelectedEvent.eventType}</h6>
                                               <p className="text-[10px] font-bold text-indigo-500 uppercase">Kênh: {currentSelectedEvent.channel}</p>
                                            </div>
                                         </div>
                                         <div className="text-right">
                                            {/* <p className="text-xs font-black text-slate-900">{currentSelectedEvent.eventTime.split(' ')[1]}</p>
                                            <p className="text-[9px] font-bold text-slate-400">{currentSelectedEvent.eventTime.split(' ')[0]}</p> */}
                                            <p className="text-[9px] font-bold text-slate-400">{formatDateTime(currentSelectedEvent.eventTime)}</p>
                                         </div>
                                      </div>

                                      {/* Body Chi tiết */}
                                      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                         <div className="grid grid-cols-2 gap-6">
                                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="w-3 h-3"/> Phân loại</p>
                                               <p className="text-xs font-bold text-slate-800">{currentSelectedEvent.eventType}</p>
                                            </div>
                                            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Smartphone className="w-3 h-3"/> Giao thức</p>
                                               <p className="text-xs font-bold text-slate-800">{currentSelectedEvent.channel}</p>
                                            </div>
                                         </div>

                                         <div className="space-y-4">
                                            <h6 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                                               <Code className="w-4 h-4 text-indigo-500" /> Cấu trúc Payload (JSON)
                                            </h6>
                                            <div className="bg-slate-950 rounded-[1.5rem] p-6 shadow-2xl relative group overflow-hidden">
                                               <div className="absolute top-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <span className="text-[9px] font-black text-emerald-500/50 uppercase tracking-widest">Live Metadata</span>
                                               </div>
                                               <pre className="text-emerald-400 font-mono text-[12px] leading-relaxed custom-scrollbar max-h-[220px] overflow-auto">
                                                  {JSON.stringify(JSON.parse(currentSelectedEvent.payloadJson || '{}'), null, 3)}
                                               </pre>
                                            </div>
                                         </div>

                                         <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
                                            <div className="mt-1"><Info className="w-4 h-4 text-indigo-400" /></div>
                                            <div className="space-y-1">
                                               <p className="text-[10px] font-black text-indigo-900 uppercase">Ghi chú AI</p>
                                               <p className="text-[11px] font-bold text-indigo-700 leading-relaxed italic">
                                                  Hành động "{currentSelectedEvent.eventType}" được ghi nhận tự động từ hệ thống tracking thời gian thực. 
                                                  Đây là dữ liệu thô phục vụ việc phân tích hành vi chuyên sâu.
                                               </p>
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                ) : (
                                   <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-4">
                                      <Eye className="w-16 h-16 opacity-20" />
                                      <p className="text-[11px] font-black uppercase tracking-widest">Chọn một sự kiện để kiểm tra chi tiết</p>
                                   </div>
                                )}
                             </div>
                          </div>
                       )}

                       {/* --- TAB 4: LEADS --- */}
                       {activeDetailTab === 'leads' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             {selectedCustomerDetail.leads.map(lead => (
                                <div key={lead.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-all group overflow-hidden relative">
                                   <div className={`absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 opacity-30`}></div>
                                   <div className="relative z-10 flex flex-col h-full">
                                      <div className="flex justify-between items-start mb-6">
                                         <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${lead.stage === 'Won' ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-white'}`}>
                                            {lead.stage}
                                         </span>
                                         <div className="text-right">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">AI Score</p>
                                            <span className="text-3xl font-black text-slate-900 tabular-nums">{lead.score}%</span>
                                         </div>
                                      </div>
                                      <div className="space-y-4">
                                         <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                                               <Briefcase className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                               <p className="text-[13px] font-black text-slate-800 truncate leading-tight">{lead.projectName || 'Nexus Alpha Project'}</p>
                                               <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Căn hộ: {lead.unitName || 'NONE'}</p>
                                            </div>
                                         </div>
                                         <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                               <Clock className="w-3.5 h-3.5" />
                                               <span className="text-[10px] font-black uppercase tracking-widest">{formatDateTime(lead.createdAt)}</span>
                                            </div>
                                            <SourceBadge source={lead.source} />
                                         </div>
                                      </div>
                                   </div>
                                </div>
                             ))}
                          </div>
                       )}

                    </div>
                 )}
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t bg-slate-50 flex items-center justify-between">
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
                       <Smartphone className="w-3.5 h-3.5" /> Kết nối
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                       <Calendar className="w-3.5 h-3.5" /> Lịch hẹn
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsInsightOpen(false)} className="px-6 py-2.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Đóng</button>
                    <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Biên tập</button>
                  </div>
              </div>

           </div>
        </div>
      )}

      {/* ✅ ADD/EDIT MODAL (khôi phục popup form) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">
                    {formMode === 'add' ? 'Thêm khách hàng' : 'Chỉnh sửa khách hàng'}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">
                    {formMode === 'add' ? 'Tạo bản ghi mới' : `ID: ${formCustomer.id}`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="p-2 hover:bg-red-50 rounded-full group transition-all"
              >
                <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Họ và tên
                  </label>
                  <input
                    required
                    value={formCustomer.fullName}
                    onChange={(e) => setFormCustomer((s) => ({ ...s, fullName: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Số điện thoại
                  </label>
                  <input
                    value={formCustomer.phone}
                    onChange={(e) => setFormCustomer((s) => ({ ...s, phone: e.target.value }))}
                    placeholder="090..."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formCustomer.email}
                    onChange={(e) => setFormCustomer((s) => ({ ...s, email: e.target.value }))}
                    placeholder="abc@gmail.com"
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    Nguồn (Source)
                  </label>
                  <select
                    value={formCustomer.source}
                    onChange={(e) => setFormCustomer((s) => ({ ...s, source: e.target.value }))}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  >
                    {['Facebook', 'Zalo', 'Google Sheets', 'Google Forms', 'Excel', 'Tiktok', 'Other'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Tags
                </label>
                <input
                  value={formCustomer.tags}
                  onChange={(e) => setFormCustomer((s) => ({ ...s, tags: e.target.value }))}
                  placeholder="vip, nhà phố, quận 7..."
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {formMode === 'add' ? 'Tạo mới' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CDP;
