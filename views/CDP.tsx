import React, { useEffect, useState, useCallback, useRef } from 'react';
import { CustomerDto, CustomerVM, CustomerDetailVM, PagedResponse, ImportResult } from '../types';
import { api } from '../services/apiService';
import Pagination from '../components/Pagination';
import {
  Search, Mail, Phone, Loader2,
  RefreshCw, Database,
  Facebook, MessageCircle, Share2,
  ChevronDown, UserPlus,
  Trash2, Edit2, XCircle, MessageSquare,
  Smartphone, Video, FileUp, ClipboardList,
  Link, Link2, UploadCloud, FileText,
  Instagram, Send, Headset, MessageSquareText,
  CheckCircle2, Zap, FileSpreadsheet, Calendar, MapPin, Info, UserCheck, Clock, Target, Heart, Eye, Code,
  Activity, Briefcase, History, Globe, DollarSign, TrendingUp, Sparkles, Save, X, ChevronRight, AlertCircle, CloudDownload, Plus, AlertTriangle,
  SlidersHorizontal
} from 'lucide-react';

import { formatDateTime } from '../components/utils/formatDate';

const ITEMS_PER_PAGE = 8;

// ===== Helpers =====
const safeJsonStringify = (json: string | null | undefined) => {
  try {
    return JSON.stringify(JSON.parse(json || '{}'), null, 3);
  } catch {
    return JSON.stringify({ raw: json }, null, 3);
  }
};

const ChannelIcon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  const n = (name || '').toLowerCase();
  const cn = className || 'w-3.5 h-3.5';
  if (n.includes('facebook')) return <Facebook className={`${cn} text-blue-600`} />;
  if (n.includes('zalo oa')) return <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[7px] text-white font-black shadow-sm">OA</div>;
  if (n.includes('zalo')) return <MessageCircle className={`${cn} text-blue-400`} />;
  if (n.includes('instagram')) return <Instagram className={`${cn} text-pink-600`} />;
  if (n.includes('whatsapp')) return <Smartphone className={`${cn} text-green-500`} />;
  if (n.includes('telegram')) return <Send className={`${cn} text-blue-400`} />;
  if (n.includes('tiktok')) return <Share2 className={`${cn} text-black`} />;
  if (n.includes('livechat')) return <Headset className={`${cn} text-indigo-500`} />;
  if (n.includes('gmail')) return <Mail className={`${cn} text-red-500`} />;
  if (n.includes('sms')) return <MessageSquareText className={`${cn} text-amber-500`} />;
  if (n.includes('call')) return <Phone className={`${cn} text-green-600`} />;
  return <MessageSquare className={`${cn} text-gray-400`} />;
};

const SourceBadge: React.FC<{ source: string }> = ({ source }) => {
  const config: Record<string, { icon: any; color: string; bg: string }> = {
    Facebook: { icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50' },
    Zalo: { icon: MessageCircle, color: 'text-sky-500', bg: 'bg-sky-50' },
    Youtube: { icon: Video, color: 'text-red-600', bg: 'bg-red-50' },
    Tiktok: { icon: Share2, color: 'text-slate-900', bg: 'bg-slate-100' },
    Excel: { icon: FileUp, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    'Google Forms': { icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
    'Google Sheets': { icon: FileSpreadsheet, color: 'text-green-600', bg: 'bg-green-50' },
    'Drive CSV': { icon: Link2, color: 'text-blue-600', bg: 'bg-blue-50' },
    Hotline: { icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  };

  const item = config[source] || { icon: Database, color: 'text-slate-500', bg: 'bg-slate-50' };
  const Icon = item.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg ${item.bg} ${item.color} border border-current border-opacity-10 w-fit shadow-sm`}>
      <Icon className="w-2.5 h-2.5" />
      <span className="text-[9px] font-black uppercase tracking-tighter">{source}</span>
    </div>
  );
};

// ===== ViewModel =====
interface ExtendedCustomerVM extends CustomerVM {
  createdAt: string;
  description: string;
}

const mapCustomerToVM = (c: CustomerDto): ExtendedCustomerVM => {
  const viewed: string[] = (c as any).viewedProjects ?? [];
  const pageViews: number = (c as any).webPageViews ?? 0;
  const tags = (c as any).tags ?? (c as any).Tags ?? '';
  return {
  id: (c as any).id ?? (c as any).Id ?? '',
  // bridge CDP trả fullName/phone; backend cũ trả name/phoneNumber → đỡ cả hai
  fullName: (c as any).fullName ?? (c as any).name ?? (c as any).Name ?? '',
  phone: (c as any).phone ?? (c as any).phoneNumber ?? (c as any).PhoneNumber ?? '',
  email: (c as any).email ?? (c as any).Email ?? '',
  source: (c as any).source ?? (c as any).Source ?? 'Unknown',
  tags,
  position: (c as any).position ?? (c as any).Position ?? '',
  company: (c as any).company ?? (c as any).Company ?? '',
  statusText: (c as any).statusText ?? (c as any).status ?? (c as any).Status ?? '',
  website: (c as any).website ?? (c as any).Website ?? '',
  leadValue: (c as any).leadValue ?? (c as any).LeadValue ?? null,
  address: (c as any).address ?? (c as any).Address ?? '',
  // điểm thật từ CDP nếu có, không thì placeholder
  score: typeof (c as any).score === 'number' && (c as any).score > 0 ? (c as any).score : 50,
  status: ((c as any).status ?? (c as any).Status) || (tags ? 'Có tag' : 'Mới'),
  needs: tags ? `Tags: ${tags}` : '',
  // hành vi thật từ CDP
  viewedProjects: viewed,
  webPageViews: pageViews,
  webIdentified: (c as any).webIdentified ?? false,
  leadCount: (c as any).leadCount ?? 1,
  createdAt: (c as any).createdAt ?? (c as any).CreatedAt ?? new Date().toISOString(),
  description: (c as any).description ?? (c as any).Description ?? 'Chưa có mô tả chi tiết cho khách hàng này.',
  };
};

// ===== Form types (logic thật như file 1) =====
type CustomerForm = {
  id?: string;

  name: string;
  position: string;
  company: string;
  description: string;

  country: string;
  zip: string;
  city: string;
  state: string;
  address: string;

  status: string;
  source: string;

  email: string;
  website: string;
  phoneNumber: string;

  leadValue: string; // nhập text -> parse number
  tags: string;
};

const CDP: React.FC = () => {
  const [customers, setCustomers] = useState<ExtendedCustomerVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [q, setQ] = useState('');
  const [filterStatus, setFilterStatus] = useState<'All' | 'New' | 'Contacted' | 'Won'>('All');
  const [filterSource, setFilterSource] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  // Detail modal
  const [isInsightOpen, setIsInsightOpen] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetailVM | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'conversations' | 'events' | 'leads'>('profile');
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const currentSelectedEvent = selectedCustomerDetail?.events?.find(e => e.id === selectedEventId);

  // Add/Edit/Delete UI (layout 2)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<ExtendedCustomerVM | null>(null);

  // form state (logic thật)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formCustomer, setFormCustomer] = useState<CustomerForm>({
    name: '',
    position: '',
    company: '',
    description: '',

    country: 'Vietnam',
    zip: '',
    city: '',
    state: '',
    address: '',

    status: 'New',
    source: 'Facebook',

    email: '',
    website: '',
    phoneNumber: '',

    leadValue: '',
    tags: '',
  });

  // Sync/import (logic thật)
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [syncSource, setSyncSource] = useState<'Sheets' | 'Forms' | 'Excel' | 'DriveCsv' | null>(null);
  const [syncStep, setSyncStep] = useState(0);

  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetName, setSheetName] = useState('Sheet1');
  const [rangeA1, setRangeA1] = useState('A1:F1000');

  const [driveCsvLink, setDriveCsvLink] = useState('');

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

  const [syncFile, setSyncFile] = useState<File | null>(null);

  const [importUpsert, setImportUpsert] = useState(true);
  const [skipIfNoPhoneAndEmail, setSkipIfNoPhoneAndEmail] = useState(true);
  const [hasHeaderRow, setHasHeaderRow] = useState(true);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);

  // misc
  const [isSystemSyncing, setIsSystemSyncing] = useState(false);

  type NoticeType = 'success' | 'error' | 'info';

  const [notice, setNotice] = useState<{ type: NoticeType; title: string; message?: string } | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  
  const showNotice = (type: NoticeType, title: string, message?: string, autoCloseMs = 3500) => {
    setNotice({ type, title, message });
  
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(null), autoCloseMs);
  };
  
  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);
  

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const syncMenuRef = useRef<HTMLDivElement>(null);

  // ===== Data fetch (logic thật từ file 1) =====
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Nguồn dữ liệu: CDP Unified Bridge (hành vi web thật + ERP)
      const res = (await api.getCdpCustomers({
        q: q || undefined,
        page: currentPage,
        pageSize: ITEMS_PER_PAGE,
      })) as PagedResponse<CustomerDto>;

      let mapped = (res.items ?? []).map(mapCustomerToVM);

      // Client-side filter để vẫn dùng layout 2
      if (filterStatus !== 'All') {
        mapped = mapped.filter(x => (x.statusText || '').toLowerCase() === filterStatus.toLowerCase());
      }
      if (filterSource !== 'All') {
        mapped = mapped.filter(x => (x.source || '').toLowerCase() === filterSource.toLowerCase());
      }

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
  }, [currentPage, q, filterStatus, filterSource]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // click outside sync menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (syncMenuRef.current && !syncMenuRef.current.contains(event.target as Node)) {
        setShowSyncMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== Detail (logic thật) =====
  const openCustomerDetail = async (customerId: string) => {
    try {
      setIsInsightOpen(true);
      setDetailLoading(true);
      setSelectedCustomerDetail(null);
      setActiveDetailTab('profile');

      const detail = await api.getCustomerDetail(customerId);
      setSelectedCustomerDetail(detail as CustomerDetailVM);

      const firstConv = (detail as any)?.conversations?.[0]?.id;
      const firstEvent = (detail as any)?.events?.[0]?.id;
      if (firstConv) setSelectedConvId(firstConv);
      if (firstEvent) setSelectedEventId(firstEvent);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Không tải được chi tiết customer.');
      setIsInsightOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // ===== Add/Edit handlers (logic thật) =====
  const openCreate = () => {
    setFormMode('add');
    setFormCustomer({
      name: '',
      position: '',
      company: '',
      description: '',

      country: 'Vietnam',
      zip: '',
      city: '',
      state: '',
      address: '',

      status: 'New',
      source: 'Facebook',

      email: '',
      website: '',
      phoneNumber: '',

      leadValue: '',
      tags: '',
    });
    setIsCreateOpen(true);
  };

  const openEdit = (e: React.MouseEvent, c: ExtendedCustomerVM) => {
    e.stopPropagation();
    setFormMode('edit');
    setFormCustomer({
      id: c.id,

      name: c.fullName || '',
      position: c.position || '',
      company: c.company || '',
      description: c.description || '',

      country: 'Vietnam',
      zip: '',
      city: '',
      state: '',
      address: c.address || '',

      status: c.statusText || 'New',
      source: c.source || 'Unknown',

      email: c.email || '',
      website: c.website || '',
      phoneNumber: c.phone || '',

      leadValue: c.leadValue != null ? String(c.leadValue) : '',
      tags: c.tags || '',
    });
    setIsEditOpen(true);
  };

  const buildPayload = () => {
    const name = (formCustomer.name || '').trim();
    if (!name) throw new Error('Vui lòng nhập Name.');

    const leadValueNum =
      formCustomer.leadValue.trim() === ''
        ? null
        : Number(formCustomer.leadValue.replace(/,/g, ''));

    return {
      name,

      position: formCustomer.position.trim() || null,
      company: formCustomer.company.trim() || null,
      description: formCustomer.description.trim() || null,

      country: formCustomer.country.trim() || null,
      zip: formCustomer.zip.trim() || null,
      city: formCustomer.city.trim() || null,
      state: formCustomer.state.trim() || null,
      address: formCustomer.address.trim() || null,

      status: formCustomer.status.trim() || null,
      source: formCustomer.source.trim() || null,

      email: formCustomer.email.trim() || null,
      website: formCustomer.website.trim() || null,
      phoneNumber: formCustomer.phoneNumber.trim() || null,

      leadValue: Number.isFinite(leadValueNum as any) ? leadValueNum : null,
      tags: formCustomer.tags.trim() || null,
    };
  };

  const handleSaveForm = async () => {
    setIsSaving(true);
    try {
      const payload = buildPayload();

      if (formMode === 'add') {
        await api.createCustomer(payload as any);
        alert('Đã thêm khách hàng.');
        setIsCreateOpen(false);
        setCurrentPage(1);
        await fetchData();
        return;
      }

      const id = formCustomer.id;
      if (!id) {
        alert('Thiếu Id customer để cập nhật.');
        return;
      }

      await api.updateCustomer(id, payload as any);
      alert('Đã cập nhật khách hàng.');
      setIsEditOpen(false);
      await fetchData();
    } catch (err: any) {
      console.error(err);
      const data = err?.response?.data ?? err;

      const msg =
        data?.errors
          ? Object.entries(data.errors)
              .map(([k, v]: any) => `${k}: ${(v || []).join(', ')}`)
              .join('\n')
          : (data?.message || data?.title || err?.message || 'Lưu khách hàng thất bại.');

      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ===== Delete (logic thật) =====
  const handleDeleteClick = (e: React.MouseEvent, customer: ExtendedCustomerVM) => {
    e.stopPropagation();
    setCustomerToDelete(customer);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteCustomer(customerToDelete.id);
      alert('Đã xoá khách hàng.');

      // giống file 1: nếu trang hiện tại chỉ còn 1 item và >1 page => lùi page
      if (customers.length === 1 && currentPage > 1) {
        setCurrentPage(p => p - 1);
      } else {
        await fetchData();
      }

      setIsDeleteOpen(false);
      setCustomerToDelete(null);
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Xoá khách hàng thất bại.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ===== System sync (giữ như layout 2) =====
  // const handleSystemSync = async () => {
  //   setIsSystemSyncing(true);
  //   try {
  //     await fetchData();
  //   } finally {
  //     setIsSystemSyncing(false);
  //   }
  // };

  const handleSystemSync = async () => {
    setIsSystemSyncing(true);
    showNotice('info', 'Đang đồng bộ RaiCrm...', 'Hệ thống đang gọi backend để đồng bộ khách hàng.', 999999);
  
    try {
      const res = await (api as any).syncRaiCrmLeads();
  
      showNotice(
        'success',
        'Đồng bộ RaiCrm thành công!',
        res?.message || 'Dữ liệu khách hàng đã được đồng bộ và cập nhật vào hệ thống.'
      );
  
      await fetchData();
    } catch (err: any) {
      console.error(err);
  
      const data = err?.response?.data ?? err;
      const msg =
        data?.errors
          ? Object.entries(data.errors)
              .map(([k, v]: any) => `${k}: ${(v || []).join(', ')}`)
              .join('\n')
          : (data?.message || data?.title || err?.message || 'Đồng bộ RaiCrm thất bại.');
  
      showNotice('error', 'Đồng bộ RaiCrm thất bại!', msg, 6000);
    } finally {
      setIsSystemSyncing(false);
    }
  };
  
  

  // ===== Import modal (logic thật file 1) =====
  const openSyncForm = (source: 'Sheets' | 'Forms' | 'Excel' | 'DriveCsv') => {
    setSyncSource(source);
    setSyncStep(0);

    setSheetUrl('');
    setSheetName('Sheet1');
    setRangeA1('A1:F1000');
    setDriveCsvLink('');
    setSyncFile(null);

    setImportResult(null);
    setLastImportResult(null);
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
      if (syncSource === 'Sheets') {
        if (!sheetUrl.trim()) return alert('Vui lòng nhập SheetUrl!');
        if (!sheetName.trim()) return alert('Vui lòng nhập SheetName!');
        if (!rangeA1.trim()) return alert('Vui lòng nhập RangeA1! Ví dụ: A1:F1000');

        const res = await (api as any).importCustomersFromGoogleSheetsLink({
          sheetUrl: sheetUrl.trim(),
          sheetName: sheetName.trim(),
          rangeA1: rangeA1.trim(),
          hasHeaderRow,
          upsert: importUpsert,
        });

        setImportResult(res);
        setLastImportResult(res);
        setSyncStep(4);
        await fetchData();
        return;
      }

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

        const res = await (api as any).importCustomersFromGoogleForms({
          records,
          upsert: importUpsert,
          skipIfNoPhoneAndEmail,
        });

        setImportResult(res);
        setLastImportResult(res);
        setSyncStep(4);
        await fetchData();
        return;
      }

      if (syncSource === 'DriveCsv') {
        if (!driveCsvLink.trim()) return alert('Vui lòng nhập Google Drive CSV Link!');
        const res = await (api as any).importCustomersFromDriveCsvLink(driveCsvLink.trim(), importUpsert);

        setImportResult(res);
        setLastImportResult(res);
        setSyncStep(4);
        await fetchData();
        return;
      }

      if (syncSource === 'Excel') {
        if (!syncFile) {
          alert('Vui lòng chọn tệp Excel/CSV!');
          setSyncStep(0);
          return;
        }

        const res = await (api as any).importCustomersFromExcel(syncFile!, importUpsert, hasHeaderRow);

        setImportResult(res);
        setLastImportResult(res);
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

  // ============================ UI ============================
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {notice && (
        <div className="fixed bottom-6 right-6 z-[2000] w-[360px] max-w-[92vw] animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className={[
              "bg-white rounded-[1.75rem] border shadow-2xl overflow-hidden",
              notice.type === "success" ? "border-emerald-100 shadow-emerald-100/40" :
              notice.type === "error" ? "border-rose-100 shadow-rose-100/40" :
              "border-indigo-100 shadow-indigo-100/40"
            ].join(" ")}
          >
            <div className="p-5 flex items-start gap-4">
              <div
                className={[
                  "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0",
                  notice.type === "success" ? "bg-emerald-50 text-emerald-600" :
                  notice.type === "error" ? "bg-rose-50 text-rose-600" :
                  "bg-indigo-50 text-indigo-600"
                ].join(" ")}
              >
                {notice.type === "success" ? <CheckCircle2 className="w-6 h-6" /> :
                notice.type === "error" ? <AlertTriangle className="w-6 h-6" /> :
                <Loader2 className="w-6 h-6 animate-spin" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {notice.type === "success" ? "Success" : notice.type === "error" ? "Error" : "Processing"}
                </div>
                <div className="mt-1 text-[14px] font-black text-slate-900 leading-tight">
                  {notice.title}
                </div>
                {!!notice.message && (
                  <div className="mt-2 text-[12px] font-medium text-slate-500 leading-relaxed">
                    {notice.message}
                  </div>
                )}
              </div>

              <button
                onClick={() => setNotice(null)}
                className="p-2 rounded-xl text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              className={[
                "h-1.5",
                notice.type === "success" ? "bg-emerald-500" :
                notice.type === "error" ? "bg-rose-500" :
                "bg-indigo-500"
              ].join(" ")}
            />
          </div>
        </div>
      )}


      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Danh sách khách hàng</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-2">
                Dữ liệu thực thể • Tổng: <span className="text-indigo-600">{total.toLocaleString()}</span> định danh
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>
              <SlidersHorizontal className="w-4 h-4 rotate-90" />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

          {/* Import menu */}
          <div className="relative" ref={syncMenuRef}>
            <button
              onClick={() => setShowSyncMenu(!showSyncMenu)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
            >
              <CloudDownload className={`w-4 h-4 ${showSyncMenu ? 'text-indigo-600' : ''}`} />
              Import
            </button>

            {showSyncMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[100] animate-in slide-in-from-top-2">
                <div className="px-3 py-2 border-b border-slate-50 mb-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nguồn Import</p>
                </div>

                {[
                  { label: 'Google Sheets (link)', icon: FileSpreadsheet, color: 'text-emerald-600', onClick: () => openSyncForm('Sheets') },
                  { label: 'Google Forms (records JSON)', icon: ClipboardList, color: 'text-purple-600', onClick: () => openSyncForm('Forms') },
                  { label: 'Excel / CSV file (upload)', icon: FileUp, color: 'text-blue-600', onClick: () => openSyncForm('Excel') },
                  { label: 'CSV (Drive link)', icon: Link2, color: 'text-sky-600', onClick: () => openSyncForm('DriveCsv') },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      item.onClick();
                      setShowSyncMenu(false);
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                      <span className="text-[11px] font-black uppercase text-slate-600 group-hover:text-slate-900">{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSystemSync}
            disabled={isSystemSyncing}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50 group"
          >
            {isSystemSyncing ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Activity className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />}
            Đồng bộ RaiCrm
          </button>

          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Khách hàng mới
          </button>

          <button onClick={fetchData} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 shadow-sm transition-all">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* FILTER BAR */}
      <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-2">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 w-4 h-4 transition-colors" />
          <input
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm theo tên, email, sđt, doanh nghiệp..."
            className="w-full pl-12 pr-6 py-4 bg-slate-50/50 border-2 border-transparent rounded-2xl text-[13px] font-bold text-slate-800 focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/30 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 px-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mr-2 hidden sm:block">Trạng thái:</span>
            {(['All', 'New', 'Contacted', 'Won'] as const).map(s => (
              <button
                key={s}
                onClick={() => { setFilterStatus(s); setCurrentPage(1); }}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all ${filterStatus === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'}`}
              >
                {s === 'All' ? 'Tất cả' : s === 'New' ? 'Mới' : s === 'Contacted' ? 'Đang chăm sóc' : 'Thành công'}
              </button>
            ))}
          </div>

          <div className="h-8 w-[1px] bg-slate-100 mx-2 hidden lg:block"></div>

          <div className="relative min-w-[180px]">
            <select
              value={filterSource}
              onChange={(e) => { setFilterSource(e.target.value); setCurrentPage(1); }}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase outline-none appearance-none cursor-pointer text-slate-600"
            >
              <option value="All">Nguồn dữ liệu</option>
              {['Facebook', 'Zalo', 'Google Forms', 'Google Sheets', 'Excel', 'Drive CSV', 'Tiktok', 'Hotline'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="py-24 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Đang nạp dữ liệu...</p>
        </div>
      ) : customers.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => openCustomerDetail(c.id)}
                className="bg-white rounded-[2.5rem] border border-slate-100 p-6 hover:shadow-2xl hover:border-indigo-100 transition-all duration-300 group cursor-pointer relative flex flex-col overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-1.5 h-full ${c.score > 85 ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>

                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 shrink-0 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-2xl shadow-xl group-hover:scale-110 transition-transform">
                    {(c.fullName || 'C')[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-slate-900 text-lg truncate group-hover:text-indigo-600 transition-colors tracking-tight leading-none mb-2">{c.fullName}</h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <SourceBadge source={c.source || 'Unknown'} />
                      {!!c.leadValue && c.leadValue > 25000000 && (
                        <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md uppercase flex items-center gap-1 border border-amber-200">
                          <Sparkles className="w-2.5 h-2.5" /> High Value
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-2 text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[10px] font-bold tabular-nums">Ngày tạo: {formatDateTime(c.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black text-white shadow-md ${c.score > 85 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-600'}`}>
                      <TrendingUp className="w-2.5 h-2.5" /> {c.score}%
                    </div>
                    <div className="mt-1.5 text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">{c.statusText || c.status}</div>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2 group-hover:bg-indigo-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-[12px] font-black text-slate-800 uppercase tracking-tight truncate">{c.company || 'Cá nhân'}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-[11px]">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{c.leadValue != null ? `${Number(c.leadValue).toLocaleString('vi-VN')} VNĐ` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-1.5 space-y-2.5">
                    <div className="flex items-center gap-3 text-slate-600 font-bold text-sm tabular-nums">
                      <Phone className="w-4 h-4 text-slate-300 shrink-0" />
                      <span>{c.phone || '(chưa có)'}</span>
                    </div>

                    <div className="flex items-start gap-3 text-slate-500">
                      <MapPin className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      <span className="text-[12px] font-semibold leading-tight line-clamp-1">{c.address || '-'}</span>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50/40 p-3 rounded-xl border border-dashed border-slate-200">
                      <FileText className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic line-clamp-2">
                        "{c.needs ? c.needs : (c.tags ? `Tags: ${c.tags}` : (c.description || ''))}"
                      </p>
                    </div>

                    {(c.viewedProjects && c.viewedProjects.length > 0) ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {c.viewedProjects.slice(0, 3).map((proj, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-black">
                            <Eye className="w-3 h-3" /> {proj}
                          </span>
                        ))}
                        {c.viewedProjects.length > 3 ? (
                          <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-black">
                            +{c.viewedProjects.length - 3}
                          </span>
                        ) : null}
                      </div>
                    ) : null}

                    {(c.webPageViews && c.webPageViews > 0) ? (
                      <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                          {c.webIdentified ? '🟢 Đã định danh' : '👁 Ẩn danh'} · {c.webPageViews} lượt xem web
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm">
                      {(selectedCustomerDetail?.conversations?.length ?? 0) ? selectedCustomerDetail?.conversations?.length : 0}
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-sm">
                      {(selectedCustomerDetail?.events?.length ?? 0) ? selectedCustomerDetail?.events?.length : 0}
                    </div>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => openEdit(e, c)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDeleteClick(e, c)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[1400px]">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Khách hàng / Doanh nghiệp</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ngày tạo / Nguồn</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Địa chỉ</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Giá trị / Trạng thái</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Liên hệ</th>
                  <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map((c) => (
                  <tr key={c.id} onClick={() => openCustomerDetail(c.id)} className="hover:bg-indigo-50/40 transition-colors group cursor-pointer">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                          {(c.fullName || 'C')[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 text-[15px] tracking-tight group-hover:text-indigo-600 transition-colors truncate">{c.fullName}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5 truncate">
                            <Briefcase className="w-3 h-3" /> {c.company || 'Cá nhân'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-[12px] font-bold text-slate-600 tabular-nums">{formatDateTime(c.createdAt)}</div>
                      <div className="mt-1"><SourceBadge source={c.source || 'Unknown'} /></div>
                    </td>

                    <td className="px-6 py-5 min-w-[150px]">
                      <div className="flex items-center gap-2 text-slate-500 text-[13px] font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-300" />
                        <span className="line-clamp-1">{c.address || '-'}</span>
                      </div>
                    </td>

                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="text-[14px] font-black text-emerald-600 tabular-nums">{c.leadValue != null ? `${Number(c.leadValue).toLocaleString('vi-VN')} VNĐ` : 'N/A'}</div>
                      <div className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase mt-1 ${c.statusText === 'Won' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                        {c.statusText || c.status}
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <div className="text-[13px] font-black text-slate-800 tabular-nums flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-400" /> {c.phone || '(n/a)'}
                      </div>
                      <div className="text-[11px] font-bold text-slate-400 mt-0.5">{c.email || '(n/a)'}</div>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <button onClick={(e) => openEdit(e, c)} className="p-2.5 bg-white shadow-sm border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDeleteClick(e, c)} className="p-2.5 bg-white shadow-sm border border-rose-100 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="py-36 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-center shadow-sm flex flex-col items-center justify-center">
          <Database className="w-20 h-20 text-slate-100 mb-6" />
          <p className="text-slate-400 font-black text-xs uppercase tracking-[0.4em]">Hệ thống không tìm thấy định danh phù hợp</p>
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

      {/* ================= DELETE CONFIRMATION MODAL (logic thật) ================= */}
      {isDeleteOpen && customerToDelete && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(225,29,72,0.25)] border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm ring-1 ring-rose-100">
                <AlertTriangle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Xác nhận xóa khách hàng</h3>
                <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                  Bạn có chắc chắn muốn xóa khách hàng <span className="text-slate-900 font-black">"{customerToDelete.fullName}"</span>?
                  Dữ liệu sẽ được gỡ khỏi hệ thống và không thể hoàn tác.
                </p>
              </div>
              <div className="flex flex-col gap-3 pt-2">
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-rose-100 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Xóa định danh
                </button>
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="w-full py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= IMPORT MODAL (logic thật) ================= */}
      {isSyncOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            {syncStep === 0 ? (
              <>
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3 text-indigo-600">
                    <CloudDownload className="w-5 h-5" />
                    <h3 className="text-lg font-black uppercase tracking-tight">
                      Import {syncSource === 'DriveCsv' ? 'CSV (Drive link)' : syncSource}
                    </h3>
                  </div>
                  <button onClick={closeSyncModal} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  {/* Sheets */}
                  {syncSource === 'Sheets' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Link className="w-3 h-3" /> SheetUrl
                        </label>
                        <input
                          type="url"
                          value={sheetUrl}
                          onChange={(e) => setSheetUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SheetName</label>
                          <input
                            type="text"
                            value={sheetName}
                            onChange={(e) => setSheetName(e.target.value)}
                            placeholder="Sheet1"
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RangeA1</label>
                          <input
                            type="text"
                            value={rangeA1}
                            onChange={(e) => setRangeA1(e.target.value)}
                            placeholder="A1:F1000"
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Forms */}
                  {syncSource === 'Forms' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Records JSON (array)
                      </label>
                      <textarea
                        value={formsRecordsJson}
                        onChange={(e) => setFormsRecordsJson(e.target.value)}
                        rows={10}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                      />
                      <p className="text-[11px] text-slate-500 font-medium">
                        Dán JSON theo format: [{`{ fullName, phone, email, tags, metadataJson, sourceRef }`}]
                      </p>
                    </div>
                  )}

                  {/* Drive CSV */}
                  {syncSource === 'DriveCsv' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Link2 className="w-3 h-3" /> Google Drive CSV Link
                      </label>
                      <input
                        type="url"
                        value={driveCsvLink}
                        onChange={(e) => setDriveCsvLink(e.target.value)}
                        placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                      />
                      <p className="text-[11px] text-slate-500 font-medium">
                        Link phải <b>public/share</b> để server tải được file CSV.
                      </p>
                    </div>
                  )}

                  {/* Excel */}
                  {syncSource === 'Excel' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Tệp dữ liệu Excel/CSV
                      </label>
                      <div className="relative group">
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => setSyncFile(e.target.files ? e.target.files[0] : null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`w-full py-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${syncFile ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-slate-50 group-hover:border-indigo-400'}`}>
                          <UploadCloud className={`w-10 h-10 mb-3 ${syncFile ? 'text-green-600' : 'text-slate-300'}`} />
                          {syncFile ? <p className="text-sm font-black text-green-700">{syncFile.name}</p> : <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kéo thả tệp</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                      <input type="checkbox" checked={importUpsert} onChange={(e) => setImportUpsert(e.target.checked)} />
                      Upsert
                    </label>

                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                      <input type="checkbox" checked={hasHeaderRow} onChange={(e) => setHasHeaderRow(e.target.checked)} />
                      HasHeaderRow
                    </label>

                    {syncSource === 'Forms' && (
                      <label className="flex items-center gap-2 text-[11px] font-bold text-slate-700 md:col-span-2">
                        <input type="checkbox" checked={skipIfNoPhoneAndEmail} onChange={(e) => setSkipIfNoPhoneAndEmail(e.target.checked)} />
                        SkipIfNoPhoneAndEmail
                      </label>
                    )}
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={closeSyncModal}
                      className="flex-1 py-4 border border-slate-200 text-slate-500 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[11px]"
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

                  {importResult && (
                    <div className="mt-2 text-left bg-slate-50 border border-slate-200 rounded-2xl p-4">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Kết quả import</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><b>Total:</b> {importResult.total}</div>
                        <div><b>Inserted:</b> {importResult.inserted}</div>
                        <div><b>Updated:</b> {importResult.updated}</div>
                        <div><b>Skipped:</b> {importResult.skipped}</div>
                        <div><b>Errors:</b> {importResult.errors}</div>
                      </div>
                      {!!importResult.errorMessages?.length && (
                        <ul className="mt-2 list-disc pl-5 text-xs text-rose-600">
                          {importResult.errorMessages.slice(0, 5).map((m: string, idx: number) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
                  <div className="relative w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl">
                    {syncStep === 4 ? <CheckCircle2 className="w-12 h-12" /> : <RefreshCw className="w-12 h-12 animate-spin" />}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  {syncStep === 1 && `Đang import ${syncSource}...`}
                  {syncStep === 4 && 'Import hoàn tất!'}
                </h3>

                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden my-10 shadow-inner">
                  <div className="bg-indigo-600 h-full transition-all duration-700 ease-out shadow-lg" style={{ width: `${(Math.min(syncStep, 4) / 4) * 100}%` }} />
                </div>

                {syncStep === 4 && lastImportResult && (
                  <div className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Kết quả import</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="font-black">Total:</span> {lastImportResult.total}</div>
                      <div><span className="font-black">Inserted:</span> {lastImportResult.inserted}</div>
                      <div><span className="font-black">Updated:</span> {lastImportResult.updated}</div>
                      <div><span className="font-black">Skipped:</span> {lastImportResult.skipped}</div>
                      <div><span className="font-black">Errors:</span> {lastImportResult.errors}</div>
                    </div>

                    {lastImportResult.errorMessages?.length > 0 && (
                      <ul className="mt-3 text-xs text-rose-600 list-disc pl-5">
                        {lastImportResult.errorMessages.map((m, idx) => <li key={idx}>{m}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                {syncStep === 4 && (
                  <button onClick={closeSyncModal} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-transform">
                    Quay lại
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= CREATE MODAL (dùng formCustomer thật) ================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-indigo-50/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Plus className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Thêm khách hàng mới</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Khởi tạo định danh thực thể mới (Bảng Customer)</p>
                </div>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formCustomer.name}
                    onChange={e => setFormCustomer(s => ({ ...s, name: e.target.value }))}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formCustomer.phoneNumber}
                    onChange={e => setFormCustomer(s => ({ ...s, phoneNumber: e.target.value }))}
                    placeholder="09xx xxx xxx"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Email</label>
                  <input
                    type="email"
                    value={formCustomer.email}
                    onChange={e => setFormCustomer(s => ({ ...s, email: e.target.value }))}
                    placeholder="name@company.com"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Website</label>
                  <input
                    type="text"
                    value={formCustomer.website}
                    onChange={e => setFormCustomer(s => ({ ...s, website: e.target.value }))}
                    placeholder="https://..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Chức vụ / Vị trí</label>
                  <input
                    type="text"
                    value={formCustomer.position}
                    onChange={e => setFormCustomer(s => ({ ...s, position: e.target.value }))}
                    placeholder="CEO, Manager, Developer..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Doanh nghiệp</label>
                  <input
                    type="text"
                    value={formCustomer.company}
                    onChange={e => setFormCustomer(s => ({ ...s, company: e.target.value }))}
                    placeholder="Tên công ty / tổ chức"
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Nguồn</label>
                  <select
                    value={formCustomer.source}
                    onChange={e => setFormCustomer(s => ({ ...s, source: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-indigo-400 outline-none transition-all appearance-none shadow-sm cursor-pointer"
                  >
                    {['Facebook', 'Zalo', 'Google Sheets', 'Google Forms', 'Excel', 'Drive CSV', 'Tiktok', 'Hotline', 'Referral', 'Other'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Trạng thái</label>
                  <select
                    value={formCustomer.status}
                    onChange={e => setFormCustomer(s => ({ ...s, status: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-indigo-400 outline-none transition-all appearance-none shadow-sm cursor-pointer"
                  >
                    {['New', 'Contacted', 'Qualified', 'Working', 'Won', 'Lost'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1 group">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quốc gia</label>
                    <input type="text" value={formCustomer.country} onChange={e => setFormCustomer(s => ({ ...s, country: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold border-2 border-transparent focus:border-indigo-300 outline-none" />
                  </div>
                  <div className="space-y-1 group">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Thành phố</label>
                    <input type="text" value={formCustomer.city} onChange={e => setFormCustomer(s => ({ ...s, city: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold border-2 border-transparent focus:border-indigo-300 outline-none" />
                  </div>
                  <div className="space-y-1 group">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Khu vực</label>
                    <input type="text" value={formCustomer.state} onChange={e => setFormCustomer(s => ({ ...s, state: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold border-2 border-transparent focus:border-indigo-300 outline-none" />
                  </div>
                  <div className="space-y-1 group">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Zip Code</label>
                    <input type="text" value={formCustomer.zip} onChange={e => setFormCustomer(s => ({ ...s, zip: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 rounded-xl text-xs font-bold border-2 border-transparent focus:border-indigo-300 outline-none" />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Địa chỉ cụ thể</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-400 transition-colors" />
                    <input
                      type="text"
                      value={formCustomer.address}
                      onChange={e => setFormCustomer(s => ({ ...s, address: e.target.value }))}
                      placeholder="Số nhà, đường, phường..."
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Giá trị kỳ vọng (Lead Value)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      value={formCustomer.leadValue}
                      onChange={e => setFormCustomer(s => ({ ...s, leadValue: e.target.value }))}
                      placeholder="150000000"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Thẻ phân loại (Tags)</label>
                  <input
                    type="text"
                    value={formCustomer.tags}
                    onChange={e => setFormCustomer(s => ({ ...s, tags: e.target.value }))}
                    placeholder="Ví dụ: VIP, Hot..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300 shadow-sm"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 group-focus-within:text-indigo-500 transition-colors">Mô tả chi tiết</label>
                  <textarea
                    rows={4}
                    value={formCustomer.description}
                    onChange={e => setFormCustomer(s => ({ ...s, description: e.target.value }))}
                    placeholder="Ghi chú/nhu cầu khách hàng..."
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-3xl text-[14px] font-medium text-slate-700 focus:bg-white focus:border-indigo-400 outline-none transition-all resize-none italic placeholder:text-slate-300 shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-slate-50 flex items-center justify-end gap-4 border-t border-slate-100">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveForm}
                disabled={isSaving || !formCustomer.name.trim()}
                className="flex items-center gap-3 px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-95"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu & Khởi tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL (dùng formCustomer thật) ================= */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-indigo-50/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
                  <Edit2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Chỉnh sửa thông tin</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">Cập nhật định danh ID: {formCustomer.id}</p>
                </div>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="p-2.5 text-slate-400 hover:bg-slate-100 rounded-2xl transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* reuse same inputs as create, but with amber focus */}
                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-amber-500 transition-colors">Họ và tên</label>
                  <input
                    type="text"
                    value={formCustomer.name}
                    onChange={e => setFormCustomer(s => ({ ...s, name: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-amber-500 transition-colors">Số điện thoại</label>
                  <input
                    type="text"
                    value={formCustomer.phoneNumber}
                    onChange={e => setFormCustomer(s => ({ ...s, phoneNumber: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-amber-500 transition-colors">Email</label>
                  <input
                    type="email"
                    value={formCustomer.email}
                    onChange={e => setFormCustomer(s => ({ ...s, email: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-amber-500 transition-colors">Website</label>
                  <input
                    type="text"
                    value={formCustomer.website}
                    onChange={e => setFormCustomer(s => ({ ...s, website: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-amber-500 transition-colors">Doanh nghiệp</label>
                  <input
                    type="text"
                    value={formCustomer.company}
                    onChange={e => setFormCustomer(s => ({ ...s, company: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-amber-500 transition-colors">Chức vụ</label>
                  <input
                    type="text"
                    value={formCustomer.position}
                    onChange={e => setFormCustomer(s => ({ ...s, position: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-amber-500 transition-colors">Địa chỉ</label>
                  <input
                    type="text"
                    value={formCustomer.address}
                    onChange={e => setFormCustomer(s => ({ ...s, address: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-amber-500 transition-colors">LeadValue</label>
                  <input
                    type="text"
                    value={formCustomer.leadValue}
                    onChange={e => setFormCustomer(s => ({ ...s, leadValue: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-amber-500 transition-colors">Tags</label>
                  <input
                    type="text"
                    value={formCustomer.tags}
                    onChange={e => setFormCustomer(s => ({ ...s, tags: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[14px] font-bold text-slate-800 focus:bg-white focus:border-amber-400 outline-none transition-all shadow-sm"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5 group">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-amber-500 transition-colors">Mô tả chi tiết</label>
                  <textarea
                    rows={4}
                    value={formCustomer.description}
                    onChange={e => setFormCustomer(s => ({ ...s, description: e.target.value }))}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-3xl text-[14px] font-medium text-slate-700 focus:bg-white focus:border-amber-400 outline-none transition-all resize-none italic shadow-sm"
                  />
                </div>
              </div>
            </div>

            <div className="px-10 py-8 bg-slate-50 flex items-center justify-end gap-4 border-t border-slate-100">
              <button
                onClick={() => setIsEditOpen(false)}
                className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveForm}
                disabled={isSaving}
                className="flex items-center gap-3 px-10 py-4 bg-amber-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-amber-100 hover:bg-amber-700 transition-all disabled:opacity-50 active:scale-95"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Cập nhật thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 360 INSIGHT MODAL (logic thật, giữ layout 2) ================= */}
      {isInsightOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-5xl h-full max-h-[90vh] shadow-2xl rounded-[3rem] flex flex-col overflow-hidden animate-in zoom-in-95 duration-400 border border-slate-200">
            <div className="px-10 py-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center font-black text-3xl shadow-2xl border-4 border-white">
                  {selectedCustomerDetail?.name?.[0] || 'C'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter truncate">{selectedCustomerDetail?.name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-widest border border-indigo-100">IDENTITY VERIFIED</span>
                    <p className="text-xs font-bold text-slate-400 tabular-nums tracking-widest uppercase truncate">{selectedCustomerDetail?.phoneNumber}</p>
                  </div>
                  {!!selectedCustomerDetail?.company && (
                    <div className="mt-2 text-[11px] font-bold text-slate-500 truncate">
                      {selectedCustomerDetail.company} {selectedCustomerDetail.position ? `• ${selectedCustomerDetail.position}` : ''}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={() => setIsInsightOpen(false)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                <XCircle className="w-10 h-10" />
              </button>
            </div>

            <div className="px-10 py-1 bg-white border-b border-slate-100 flex gap-10 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: 'profile', label: 'Thông tin chung', icon: Info },
                { id: 'conversations', label: 'Hội thoại', icon: MessageSquare },
                { id: 'events', label: 'Hành vi', icon: History },
                { id: 'leads', label: 'Cơ hội', icon: Target },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id as any)}
                  className={`flex items-center gap-2.5 pb-5 pt-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all border-b-4 ${activeDetailTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-10 custom-scrollbar">
              {detailLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-indigo-600">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="text-[11px] font-black uppercase tracking-widest animate-pulse">Đang trích xuất dữ liệu...</p>
                </div>
              ) : selectedCustomerDetail ? (
                <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {activeDetailTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          {[
                            { label: 'Họ và tên', value: selectedCustomerDetail.name, icon: UserCheck },
                            { label: 'Số điện thoại', value: selectedCustomerDetail.phoneNumber, icon: Smartphone },
                            { label: 'Email', value: selectedCustomerDetail.email, icon: Mail },
                            { label: 'Ngày tạo', value: formatDateTime(selectedCustomerDetail.createdAt), icon: Calendar },
                            { label: 'Website', value: selectedCustomerDetail.website, icon: Globe },
                            { label: 'Nguồn', value: selectedCustomerDetail.source, icon: Send },
                            { label: 'Địa chỉ', value: selectedCustomerDetail.address, icon: MapPin },
                            { label: 'Doanh nghiệp', value: selectedCustomerDetail.company, icon: Briefcase },
                            { label: 'Giá trị Lead', value: selectedCustomerDetail.leadValue != null ? `${Number(selectedCustomerDetail.leadValue).toLocaleString('vi-VN')} VNĐ` : 'N/A', icon: DollarSign },
                            { label: 'Tags', value: selectedCustomerDetail.tags, icon: Heart },
                            { label: 'Cập nhật cuối', value: selectedCustomerDetail.updatedAt ? formatDateTime(selectedCustomerDetail.updatedAt) : 'N/A', icon: Clock },
                            { label: 'Trạng thái', value: selectedCustomerDetail.status, icon: Activity },
                          ].map((item, i) => (
                            <div key={i} className="space-y-1.5">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <item.icon className="w-3.5 h-3.5" /> {item.label}
                              </p>
                              <p className="text-[15px] font-bold text-slate-800">{item.value || '-'}</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Mô tả chi tiết</p>
                          <p className="text-[14px] text-slate-700 font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100 leading-relaxed italic">
                            {selectedCustomerDetail.description || '-'}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2"><Code className="w-3.5 h-3.5" /> Metadata</p>
                          <div className="bg-slate-950 rounded-2xl p-6 shadow-2xl">
                            <pre className="text-emerald-400 font-mono text-[12px] leading-relaxed overflow-auto max-h-[260px] custom-scrollbar">
                              {safeJsonStringify((selectedCustomerDetail as any).metadataJson)}
                            </pre>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Intent AI Score</h4>
                        {(selectedCustomerDetail.interests || []).map((interest, idx) => (
                          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                              <span className="text-[12px] font-black text-slate-900">{interest.level}/100</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(100, interest.level)}%` }} />
                            </div>
                            <p className="mt-4 text-[12px] text-slate-500 font-medium italic">"{interest.note || ''}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'conversations' && (
                    <div className="h-[500px] flex gap-8">
                      <div className="w-[300px] overflow-y-auto space-y-4 pr-3 border-r border-slate-100 custom-scrollbar">
                        {(selectedCustomerDetail.conversations || []).map(conv => (
                          <div
                            key={conv.id}
                            onClick={() => setSelectedConvId(conv.id)}
                            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedConvId === conv.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-white border-slate-50 hover:border-indigo-100'}`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <ChannelIcon name={conv.channel || ''} className={`w-4 h-4 ${selectedConvId === conv.id ? 'text-white' : ''}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{conv.channel}</span>
                              </div>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${conv.status === 'Closed' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-400 text-white'}`}>
                                {conv.status}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold opacity-70 tabular-nums">{formatDateTime(conv.startedAt)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex-1 bg-white rounded-3xl border border-slate-100 flex flex-col overflow-hidden shadow-inner">
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20 custom-scrollbar">
                          {(selectedCustomerDetail.messages || [])
                            .filter(m => m.conversationId === selectedConvId)
                            .map(msg => (
                              <div key={msg.id} className={`flex ${msg.senderType === 'Customer' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`p-5 rounded-2xl text-[14px] font-semibold leading-relaxed shadow-sm ${msg.senderType === 'Customer' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'events' && (
                    <div className="h-[500px] flex gap-8">
                      <div className="w-[350px] overflow-y-auto pr-4 custom-scrollbar">
                        <div className="relative pl-8 border-l-4 border-slate-100 space-y-8">
                          {(selectedCustomerDetail.events || []).map(ev => (
                            <div key={ev.id} onClick={() => setSelectedEventId(ev.id)} className="relative cursor-pointer group">
                              <div className={`absolute -left-[42px] top-2 w-5 h-5 rounded-full border-4 border-white shadow-lg ${selectedEventId === ev.id ? 'bg-indigo-600 scale-125' : 'bg-slate-300'}`}></div>
                              <div className={`p-5 rounded-2xl border-2 transition-all ${selectedEventId === ev.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-2 mb-1">
                                  <ChannelIcon name={ev.channel} className="w-4 h-4" />
                                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-tight">{ev.eventType}</h5>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 tabular-nums uppercase mt-1">{formatDateTime(ev.eventTime)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 bg-white rounded-3xl border border-slate-100 p-8 shadow-inner overflow-y-auto custom-scrollbar">
                        {currentSelectedEvent ? (
                          <div className="space-y-6 animate-in fade-in">
                            <h6 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                              <Zap className="w-5 h-5 text-indigo-500" /> Event Details
                            </h6>
                            <div className="bg-slate-950 rounded-2xl p-6 shadow-2xl">
                              <pre className="text-emerald-400 font-mono text-[13px] leading-relaxed overflow-auto max-h-[300px] custom-scrollbar">
                                {safeJsonStringify(currentSelectedEvent.payloadJson)}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-300 uppercase font-black text-[10px] tracking-widest">
                            Chọn một sự kiện để phân tích
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'leads' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(selectedCustomerDetail.leads || []).map(lead => (
                        <div key={lead.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-all group overflow-hidden relative">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 opacity-30 group-hover:scale-125 transition-transform duration-700"></div>
                          <div className="relative z-10 space-y-8">
                            <div className="flex justify-between items-start">
                              <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${lead.stage === 'Won' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}>
                                {lead.stage}
                              </span>
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Lead Score</p>
                                <span className="text-4xl font-black text-slate-900 tabular-nums">{lead.score}%</span>
                              </div>
                            </div>

                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-5">
                              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-xl border border-slate-50">
                                <Briefcase className="w-7 h-7" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-lg font-black text-slate-800 truncate leading-tight">{lead.projectName || 'N/A'}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 truncate">Unit: {lead.unitName || 'N/A'}</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-slate-400">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                <Clock className="w-4 h-4" /> {formatDateTime(lead.createdAt)}
                              </div>
                              <SourceBadge source={lead.source || 'Unknown'} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300 space-y-4 flex-col">
                  <Eye className="w-16 h-16 opacity-20" />
                  <p className="text-[11px] font-black uppercase tracking-widest">Không có dữ liệu chi tiết</p>
                </div>
              )}
            </div>

            <div className="px-10 py-8 border-t bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex gap-4">
                <button className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 transition-all active:scale-95 group">
                  <Smartphone className="w-4 h-4 group-hover:scale-125 transition-transform" /> Liên hệ
                </button>
                <button className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all group">
                  <Calendar className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Lịch hẹn
                </button>
              </div>
              <button onClick={() => setIsInsightOpen(false)} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all">
                Đóng hồ sơ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CDP;


// // =============== DANH SÁCH KHÁCH HÀNG ================
// import React, { useEffect, useState } from 'react';
// import { Project } from '../types'; // giữ để UI không lỗi (hiện chưa dùng)
// import { api } from '../services/apiService';
// import Pagination from '../components/Pagination';
// import {
//   Search, Filter, Mail, Phone, Loader2,
//   RefreshCw, Database,
//   Facebook, MessageCircle, Share2,
//   ChevronDown, UserPlus,
//   Star, LayoutGrid, List,
//   Trash2, Edit2, XCircle, MessageSquare,
//   Smartphone, Video, FileUp, ClipboardList,
//   Link, Link2, UploadCloud, FileText,
//   Instagram, Send, Headset, MessageSquareText,
//   CheckCircle2, Zap, FileSpreadsheet, Calendar, MapPin, Info, UserCheck, Clock, Target, Heart, Eye, Code,
//   Activity, Briefcase, History,
//   Globe
// } from 'lucide-react';

// import { formatDateTime } from '../components/utils/formatDate';

// const ITEMS_PER_PAGE = 8;

// // ===== Backend DTOs (UPDATED) =====
// type CustomerDto = {
//   id: string;

//   name: string;
//   position?: string | null;
//   company?: string | null;
//   description?: string | null;

//   country?: string | null;
//   zip?: string | null;
//   city?: string | null;
//   state?: string | null;
//   address?: string | null;

//   status?: string | null;
//   source?: string | null;

//   email?: string | null;
//   website?: string | null;
//   phoneNumber?: string | null;

//   leadValue?: number | null;
//   tags?: string | null;
// };

// type PagedResponse<T> = {
//   items: T[];
//   page: number;
//   pageSize: number;
//   total: number;
// };

// // ===== ViewModel cho UI =====
// type CustomerVM = {
//   id: string;

//   fullName: string; // giữ để UI cũ ít đổi
//   phone?: string;
//   email?: string;
//   source: string;
//   tags?: string;

//   // fields bổ sung
//   position?: string;
//   company?: string;
//   statusText?: string;
//   website?: string;
//   leadValue?: number | null;
//   address?: string;

//   score: number; // placeholder
//   status: string; // placeholder UI
//   needs?: string; // placeholder UI
// };

// type LeadVM = {
//   id: string;
//   stage: string;
//   score: number;
//   source: string;
//   projectId?: string | null;
//   unitId?: string | null;
//   createdAt: string;
//   projectName?: string;
//   unitName?: string;
// };

// type ConversationVM = {
//   id: string;
//   channel?: string | null;
//   status: string;
//   startedAt: string;
//   lastMessageAt: string;
//   agentId?: string | null;
// };

// type MessageVM = {
//   id: string;
//   conversationId: string;
//   senderType: string;
//   senderId?: string | null;
//   content: string;
//   createdAt: string;
// };

// type CustomerEventVM = {
//   id: string;
//   channel: string;
//   eventType: string;
//   eventTime: string;
//   payloadJson?: string | null;
// };

// type CustomerInterestVM = {
//   id: string;
//   level: number;
//   note?: string | null;
//   projectId?: string | null;
//   unitId?: string | null;
//   createdAt: string;
//   projectName?: string;
//   unitName?: string;
// };

// // ===== Customer Detail (UPDATED fields + giữ các array đang dùng UI) =====
// type CustomerDetailVM = {
//   id: string;

//   name: string;
//   position?: string | null;
//   company?: string | null;
//   description?: string | null;

//   country?: string | null;
//   zip?: string | null;
//   city?: string | null;
//   state?: string | null;
//   address?: string | null;

//   status?: string | null;
//   source?: string | null;

//   email?: string | null;
//   website?: string | null;
//   phoneNumber?: string | null;

//   leadValue?: number | null;
//   tags?: string | null;

//   createdAt: string;
//   updatedAt?: string | null;
//   metadataJson?: string | null;

//   leads: LeadVM[];
//   conversations: ConversationVM[];
//   messages: MessageVM[];
//   events: CustomerEventVM[];
//   interests: CustomerInterestVM[];
// };

// const mapCustomerToVM = (c: CustomerDto): CustomerVM => ({
//   id: c.id,

//   fullName: c.name,
//   phone: c.phoneNumber ?? '',
//   email: c.email ?? '',
//   source: c.source ?? 'Unknown',
//   tags: c.tags ?? '',

//   position: c.position ?? '',
//   company: c.company ?? '',
//   statusText: c.status ?? '',
//   website: c.website ?? '',
//   leadValue: c.leadValue ?? null,
//   address: c.address ?? '',

//   score: 50,
//   status: c.tags ? 'Có tag' : 'Mới',
//   needs: c.tags ? `Tags: ${c.tags}` : '',
// });

// const safeJsonStringify = (json: string | null | undefined) => {
//   try {
//     return JSON.stringify(JSON.parse(json || '{}'), null, 3);
//   } catch {
//     return JSON.stringify({ raw: json }, null, 3);
//   }
// };

// const ChannelIcon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
//   const n = (name || '').toLowerCase();
//   const cn = className || 'w-3.5 h-3.5';
//   if (n.includes('facebook')) return <Facebook className={`${cn} text-blue-600`} />;
//   if (n.includes('zalo oa')) return <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[7px] text-white font-black shadow-sm">OA</div>;
//   if (n.includes('zalo')) return <MessageCircle className={`${cn} text-blue-400`} />;
//   if (n.includes('instagram')) return <Instagram className={`${cn} text-pink-600`} />;
//   if (n.includes('whatsapp')) return <Smartphone className={`${cn} text-green-500`} />;
//   if (n.includes('telegram')) return <Send className={`${cn} text-blue-400`} />;
//   if (n.includes('tiktok')) return <Share2 className={`${cn} text-black`} />;
//   if (n.includes('livechat')) return <Headset className={`${cn} text-indigo-500`} />;
//   if (n.includes('gmail')) return <Mail className={`${cn} text-red-500`} />;
//   if (n.includes('sms')) return <MessageSquareText className={`${cn} text-amber-500`} />;
//   if (n.includes('call')) return <Phone className={`${cn} text-green-600`} />;
//   return <MessageSquare className={`${cn} text-gray-400`} />;
// };

// const SourceBadge: React.FC<{ source: string; showText?: boolean }> = ({ source, showText = true }) => {
//   const config: Record<string, { icon: any; color: string; bgColor: string }> = {
//     Facebook: { icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-50' },
//     Zalo: { icon: MessageCircle, color: 'text-blue-400', bgColor: 'bg-blue-50' },
//     Youtube: { icon: Video, color: 'text-red-600', bgColor: 'bg-red-50' },
//     Tiktok: { icon: Share2, color: 'text-gray-900', bgColor: 'bg-gray-100' },
//     Excel: { icon: FileUp, color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
//     'Google Forms': { icon: ClipboardList, color: 'text-purple-600', bgColor: 'bg-purple-50' },
//     'Google Sheets': { icon: FileSpreadsheet, color: 'text-green-600', bgColor: 'bg-green-50' },
//     'Drive CSV': { icon: Link2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
//   };

//   const item = config[source] || { icon: Database, color: 'text-gray-600', bgColor: 'bg-gray-50' };
//   const Icon = item.icon;

//   return (
//     <div
//       className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${item.bgColor} ${item.color} border border-current border-opacity-10 w-fit flex-shrink-0`}
//       title={source}
//     >
//       <Icon className="w-2.5 h-2.5" />
//       {showText && <span className="text-[8px] font-bold uppercase tracking-tight whitespace-nowrap">{source}</span>}
//     </div>
//   );
// };

// // ===== Import result (response) =====
// type ImportResult = {
//   total: number;
//   inserted: number;
//   updated: number;
//   skipped: number;
//   errors: number;
//   errorMessages: string[];
// };

// const CDP: React.FC = () => {
//   const [customers, setCustomers] = useState<CustomerVM[]>([]);
//   const [projects] = useState<Project[]>([]); // giữ để UI không lỗi (hiện chưa dùng)

//   const [showSyncMenu, setShowSyncMenu] = useState(false);

//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);

//   const [q, setQ] = useState('');
//   const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

//   const [total, setTotal] = useState(0);
//   const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

//   // Modals demo (giữ UI)
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isInsightOpen, setIsInsightOpen] = useState(false);
//   const [selectedCustomer, setSelectedCustomer] = useState<CustomerVM | null>(null);

//   // Sync modal
//   const [isSyncOpen, setIsSyncOpen] = useState(false);
//   const [syncSource, setSyncSource] = useState<'Sheets' | 'Forms' | 'Excel' | 'DriveCsv' | null>(null);
//   const [syncStep, setSyncStep] = useState(0);

//   // Sheets/Forms: JSON input (records)
//   const [syncInput, setSyncInput] = useState('');
//   const [sheetUrl, setSheetUrl] = useState('');
//   const [sheetName, setSheetName] = useState('Sheet1');
//   const [rangeA1, setRangeA1] = useState('A1:F1000'); // tuỳ bạn

//   // Drive CSV
//   const [driveCsvLink, setDriveCsvLink] = useState('');

//   // Forms: dán JSON records (giữ nguyên để bạn tự chỉnh theo backend import)
//   const [formsRecordsJson, setFormsRecordsJson] = useState(`[
//     {
//       "fullName": "Nguyễn Văn A",
//       "phone": "0900000000",
//       "email": "a@gmail.com",
//       "tags": "VIP",
//       "metadataJson": "{}",
//       "sourceRef": "form-001"
//     }
//   ]`);
//   const [importResult, setImportResult] = useState<any>(null);
//   const [importing, setImporting] = useState(false);

//   // Excel: file
//   const [syncFile, setSyncFile] = useState<File | null>(null);

//   // flags
//   const [importUpsert, setImportUpsert] = useState(true);
//   const [skipIfNoPhoneAndEmail, setSkipIfNoPhoneAndEmail] = useState(true);
//   const [hasHeaderRow, setHasHeaderRow] = useState(true);

//   // result
//   const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);

//   const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetailVM | null>(null);
//   const [detailLoading, setDetailLoading] = useState(false);

//   const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'conversations' | 'events' | 'leads'>('profile');
//   const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
//   const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

//   const currentSelectedEvent = selectedCustomerDetail?.events.find(e => e.id === selectedEventId);

//   // ===== Add/Edit Modal State (UPDATED) =====
//   type CustomerForm = {
//     id?: string;

//     name: string;
//     position: string;
//     company: string;
//     description: string;

//     country: string;
//     zip: string;
//     city: string;
//     state: string;
//     address: string;

//     status: string;
//     source: string;

//     email: string;
//     website: string;
//     phoneNumber: string;

//     leadValue: string; // text để nhập; submit parse number
//     tags: string;
//   };

//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
//   const [formCustomer, setFormCustomer] = useState<CustomerForm>({
//     name: '',
//     position: '',
//     company: '',
//     description: '',

//     country: 'Vietnam',
//     zip: '',
//     city: '',
//     state: '',
//     address: '',

//     status: 'New',
//     source: 'Facebook',

//     email: '',
//     website: '',
//     phoneNumber: '',

//     leadValue: '',
//     tags: '',
//   });

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const res = (await api.getCustomers({
//         q: q || undefined,
//         page: currentPage,
//         pageSize: ITEMS_PER_PAGE,
//       })) as PagedResponse<CustomerDto>;

//       const mapped = (res.items ?? []).map(mapCustomerToVM);
//       setCustomers(mapped);
//       setTotal(res.total ?? 0);
//     } catch (e: any) {
//       console.error(e);
//       setCustomers([]);
//       setTotal(0);
//       alert(e?.message || 'Không thể tải danh sách Customer từ backend.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentPage, q]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [q]);

//   const handleOpenAdd = () => {
//     setFormMode('add');
//     setFormCustomer({
//       name: '',
//       position: '',
//       company: '',
//       description: '',

//       country: 'Vietnam',
//       zip: '',
//       city: '',
//       state: '',
//       address: '',

//       status: 'New',
//       source: 'Facebook',

//       email: '',
//       website: '',
//       phoneNumber: '',

//       leadValue: '',
//       tags: '',
//     });
//     setIsFormOpen(true);
//   };

//   const openCustomerDetail = async (customerId: string) => {
//     try {
//       setIsInsightOpen(true);
//       setDetailLoading(true);
//       setSelectedCustomerDetail(null);

//       const detail = await api.getCustomerDetail(customerId);
//       setSelectedCustomerDetail(detail as CustomerDetailVM);

//       const firstConv = (detail as any)?.conversations?.[0]?.id;
//       const firstEvent = (detail as any)?.events?.[0]?.id;
//       if (firstConv) setSelectedConvId(firstConv);
//       if (firstEvent) setSelectedEventId(firstEvent);
//     } catch (e: any) {
//       console.error(e);
//       alert(e?.message || 'Không tải được chi tiết customer.');
//       setIsInsightOpen(false);
//     } finally {
//       setDetailLoading(false);
//     }
//   };

//   const handleOpenEdit = (c: CustomerVM, e: React.MouseEvent) => {
//     e.stopPropagation();
//     setFormMode('edit');
//     setFormCustomer({
//       id: c.id,

//       name: c.fullName || '',
//       position: c.position || '',
//       company: c.company || '',
//       description: '',

//       country: 'Vietnam',
//       zip: '',
//       city: '',
//       state: '',
//       address: c.address || '',

//       status: c.statusText || 'New',
//       source: c.source || 'Unknown',

//       email: c.email || '',
//       website: c.website || '',
//       phoneNumber: c.phone || '',

//       leadValue: c.leadValue != null ? String(c.leadValue) : '',
//       tags: c.tags || '',
//     });
//     setIsFormOpen(true);
//   };

//   const handleSaveCustomer = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       const name = (formCustomer.name || '').trim();
//       if (!name) {
//         alert('Vui lòng nhập Name.');
//         return;
//       }

//       const leadValueNum =
//         formCustomer.leadValue.trim() === ''
//           ? null
//           : Number(formCustomer.leadValue.replace(/,/g, ''));

//       const payload = {
//         name,

//         position: formCustomer.position.trim() || null,
//         company: formCustomer.company.trim() || null,
//         description: formCustomer.description.trim() || null,

//         country: formCustomer.country.trim() || null,
//         zip: formCustomer.zip.trim() || null,
//         city: formCustomer.city.trim() || null,
//         state: formCustomer.state.trim() || null,
//         address: formCustomer.address.trim() || null,

//         status: formCustomer.status.trim() || null,
//         source: formCustomer.source.trim() || null,

//         email: formCustomer.email.trim() || null,
//         website: formCustomer.website.trim() || null,
//         phoneNumber: formCustomer.phoneNumber.trim() || null,

//         leadValue: Number.isFinite(leadValueNum as any) ? leadValueNum : null,
//         tags: formCustomer.tags.trim() || null,
//       };

//       if (formMode === 'add') {
//         await api.createCustomer(payload as any);
//         alert('Đã thêm khách hàng.');
//         setIsFormOpen(false);
//         setCurrentPage(1);
//         fetchData();
//         return;
//       }

//       const id = formCustomer.id;
//       if (!id) {
//         alert('Thiếu Id customer để cập nhật.');
//         return;
//       }

//       await api.updateCustomer(id, payload as any);
//       alert('Đã cập nhật khách hàng.');
//       setIsFormOpen(false);
//       fetchData();
//     } catch (err: any) {
//       console.error(err);
//       const data = err?.response?.data ?? err;

//       const msg =
//         data?.errors
//           ? Object.entries(data.errors)
//               .map(([k, v]: any) => `${k}: ${(v || []).join(', ')}`)
//               .join('\n')
//           : (data?.message || data?.title || 'Lưu khách hàng thất bại.');

//       alert(msg);
//     }
//   };

//   const handleDelete = async (id: string, e: React.MouseEvent) => {
//     e.stopPropagation();

//     const ok = confirm('Bạn chắc chắn muốn xoá khách hàng này?');
//     if (!ok) return;

//     try {
//       await api.deleteCustomer(id);
//       alert('Đã xoá khách hàng.');

//       if (customers.length === 1 && currentPage > 1) {
//         setCurrentPage((p) => p - 1);
//       } else {
//         fetchData();
//       }
//     } catch (err: any) {
//       console.error(err);
//       alert(err?.message || 'Xoá khách hàng thất bại.');
//     }
//   };

//   const openSyncForm = (source: 'Sheets' | 'Forms' | 'Excel' | 'DriveCsv') => {
//     setSyncSource(source);
//     setSyncStep(0);

//     setSyncInput('');
//     setSyncFile(null);

//     setSheetUrl('');
//     setSheetName('Sheet1');
//     setRangeA1('A1:F1000');

//     setDriveCsvLink('');

//     setImportResult(null);
//     setImporting(false);

//     setIsSyncOpen(true);
//   };

//   const closeSyncModal = () => {
//     setIsSyncOpen(false);
//     setSyncStep(0);
//     setLastImportResult(null);
//   };

//   const handleExecuteSync = async () => {
//     if (!syncSource) return;

//     setImportResult(null);
//     setImporting(true);
//     setSyncStep(1);

//     try {
//       // ===== Google Sheets Link =====
//       if (syncSource === 'Sheets') {
//         if (!sheetUrl.trim()) return alert('Vui lòng nhập SheetUrl!');
//         if (!sheetName.trim()) return alert('Vui lòng nhập SheetName!');
//         if (!rangeA1.trim()) return alert('Vui lòng nhập RangeA1! Ví dụ: A1:F1000');

//         const res = await (api as any).importCustomersFromGoogleSheetsLink({
//           sheetUrl: sheetUrl.trim(),
//           sheetName: sheetName.trim(),
//           rangeA1: rangeA1.trim(),
//           hasHeaderRow,
//           upsert: importUpsert,
//         });

//         setImportResult(res);
//         setLastImportResult(res);
//         setSyncStep(4);
//         await fetchData();
//         return;
//       }

//       // ===== Google Forms (records JSON) =====
//       if (syncSource === 'Forms') {
//         let parsed: any;
//         try {
//           parsed = JSON.parse(formsRecordsJson);
//         } catch {
//           alert('JSON không hợp lệ. Bạn cần dán JSON array records.');
//           setSyncStep(0);
//           return;
//         }

//         const records = Array.isArray(parsed) ? parsed : [parsed];
//         if (!records.length) {
//           alert('Danh sách records rỗng.');
//           setSyncStep(0);
//           return;
//         }

//         const res = await (api as any).importCustomersFromGoogleForms({
//           records,
//           upsert: importUpsert,
//           skipIfNoPhoneAndEmail,
//         });

//         setImportResult(res);
//         setLastImportResult(res);
//         setSyncStep(4);
//         await fetchData();
//         return;
//       }

//       // ===== Drive CSV Link =====
//       if (syncSource === 'DriveCsv') {
//         if (!driveCsvLink.trim()) return alert('Vui lòng nhập Google Drive CSV Link!');

//         const res = await (api as any).importCustomersFromDriveCsvLink(driveCsvLink.trim(), importUpsert);

//         setImportResult(res);
//         setLastImportResult(res);
//         setSyncStep(4);
//         await fetchData();
//         return;
//       }

//       // ===== Excel (multipart) =====
//       if (syncSource === 'Excel') {
//         if (!syncFile) {
//           alert('Vui lòng chọn tệp Excel/CSV!');
//           setSyncStep(0);
//           return;
//         }

//         try {
//           const result = await (api as any).importCustomersFromExcel(
//             syncFile!,
//             importUpsert,
//             hasHeaderRow
//           );
//           setImportResult(result);
//           setLastImportResult(result);
//         } catch (e: any) {
//           console.error('IMPORT FAILED', e?.data || e);
//           alert(e?.message || 'Import Excel thất bại.');
//           setSyncStep(0);
//           return;
//         }

//         setSyncStep(4);
//         await fetchData();
//         return;
//       }
//     } catch (e: any) {
//       console.error(e);
//       alert(e?.message || 'Import thất bại.');
//       setSyncStep(0);
//     } finally {
//       setImporting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="h-full flex flex-col items-center justify-center text-indigo-600">
//         <Loader2 className="w-8 h-8 animate-spin mb-3" />
//         <p className="text-xs font-bold animate-pulse uppercase tracking-widest">Đang tải Customer từ backend...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4 animate-in fade-in duration-500 pb-10">
//       <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
//         <div className="min-w-0">
//           <div className="flex items-center gap-2 mb-1">
//             <div className="p-1.5 bg-indigo-600 rounded-lg shadow-md shadow-indigo-100 flex-shrink-0">
//               <Database className="w-4 h-4 text-white" />
//             </div>
//             <h2 className="text-xl font-black text-gray-900 tracking-tight truncate">Danh sách khách hàng</h2>
//           </div>
//           <p className="text-[11px] text-gray-500 font-medium">
//             Số lượng khách hàng • Tổng: <span className="font-black text-indigo-600">{total}</span>
//           </p>
//         </div>

//         <div className="flex items-center gap-2 flex-shrink-0">
//           <div className="bg-white border border-gray-200 p-0.5 rounded-lg flex items-center shadow-sm">
//             <button
//               onClick={() => setViewMode('grid')}
//               className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'}`}
//             >
//               <LayoutGrid className="w-3.5 h-3.5" />
//             </button>
//             <button
//               onClick={() => setViewMode('table')}
//               className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'}`}
//             >
//               <List className="w-3.5 h-3.5" />
//             </button>
//           </div>

//           {/* ✅ NÚT ĐỒNG BỘ + MENU */}
//           <div className="relative">
//             <button
//               onClick={() => setShowSyncMenu(v => !v)}
//               className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-[11px] uppercase hover:bg-gray-50 transition-all shadow-sm"
//             >
//               Import
//             </button>

//             {showSyncMenu && (
//               <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2">
//                 <button
//                   onClick={() => { openSyncForm('Sheets'); setShowSyncMenu(false); }}
//                   className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
//                 >
//                   <FileSpreadsheet className="w-4 h-4 text-green-600" />
//                   <span className="text-[11px] font-bold text-gray-700">Google Sheets</span>
//                 </button>

//                 <button
//                   onClick={() => { openSyncForm('Forms'); setShowSyncMenu(false); }}
//                   className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
//                 >
//                   <ClipboardList className="w-4 h-4 text-purple-600" />
//                   <span className="text-[11px] font-bold text-gray-700">Google Forms</span>
//                 </button>

//                 <button
//                   onClick={() => { openSyncForm('Excel'); setShowSyncMenu(false); }}
//                   className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
//                 >
//                   <FileUp className="w-4 h-4 text-emerald-600" />
//                   <span className="text-[11px] font-bold text-gray-700">Import Excel</span>
//                 </button>

//                 {/* ✅ NEW: Drive CSV link */}
//                 <button
//                   onClick={() => { openSyncForm('DriveCsv'); setShowSyncMenu(false); }}
//                   className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
//                 >
//                   <Link2 className="w-4 h-4 text-blue-600" />
//                   <span className="text-[11px] font-bold text-gray-700">Import CSV (Drive link)</span>
//                 </button>
//               </div>
//             )}
//           </div>

//           <button
//             onClick={handleOpenAdd}
//             className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-indigo-700 shadow-md"
//           >
//             <UserPlus className="w-3.5 h-3.5" /> Thêm mới
//           </button>
//           <button
//             onClick={fetchData}
//             className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-indigo-600 shadow-sm transition-all"
//             title="Reload"
//           >
//             <RefreshCw className="w-4 h-4" />
//           </button>
//         </div>
//       </header>

//       <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-2.5 items-center">
//         <div className="relative flex-1 w-full">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
//           <input
//             type="text"
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//             placeholder="Tìm theo tên/SĐT/email/công ty/tag..."
//             className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-inner"
//           />
//         </div>

//         <div className="relative w-full md:w-56 flex-shrink-0 opacity-60">
//           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
//           <select
//             disabled
//             value="All"
//             className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-transparent rounded-lg text-[10px] font-bold uppercase outline-none appearance-none cursor-not-allowed transition-all"
//             title="Backend hiện chỉ hỗ trợ q/page/pageSize"
//           >
//             <option value="All">Filter (disabled)</option>
//           </select>
//           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
//         </div>
//       </div>

//       {customers.length > 0 ? (
//         viewMode === 'grid' ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//             {customers.map((c) => (
//               <div
//                 key={c.id}
//                 onClick={() => openCustomerDetail(c.id)}
//                 className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group cursor-pointer relative flex flex-col min-w-0"
//               >
//                 <div className="absolute top-3 right-3 flex-shrink-0">
//                   <div className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter text-white shadow-sm flex items-center gap-0.5 whitespace-nowrap ${c.score > 80 ? 'bg-green-500' : c.score > 50 ? 'bg-indigo-500' : 'bg-gray-400'}`}>
//                     <Star className="w-2 h-2 fill-current" /> {c.score}%
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 mb-4 min-w-0">
//                   <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0">
//                     {(c.fullName || 'C')[0]}
//                   </div>
//                   <div className="min-w-0">
//                     <h3 className="font-black text-gray-900 text-[13px] truncate group-hover:text-indigo-600 transition-colors">{c.fullName}</h3>
//                     <div className="mt-0.5 flex items-center gap-2">
//                       <SourceBadge source={c.source || 'Unknown'} />
//                       {!!c.company && (
//                         <span className="text-[10px] font-bold text-gray-400 truncate">{c.company}</span>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2 flex-1 min-w-0">
//                   <div className="flex items-center gap-2 text-gray-600 p-2 bg-gray-50 rounded-xl border border-gray-100 min-w-0">
//                     <Phone className="w-3 h-3 text-indigo-500 flex-shrink-0" />
//                     <span className="text-[12px] font-black text-gray-900 truncate">{c.phone || '(chưa có)'}</span>
//                   </div>

//                   <div className="px-1 space-y-1 min-w-0">
//                     <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium min-w-0">
//                       <Mail className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
//                       <span className="truncate">{c.email || '(chưa có email)'}</span>
//                     </div>

//                     {!!c.website && (
//                       <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium min-w-0">
//                         <Globe className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
//                         <span className="truncate">{c.website}</span>
//                       </div>
//                     )}

//                     <p className="text-[11px] text-gray-600 font-bold leading-snug line-clamp-2 italic opacity-80 min-w-0">
//                       {c.needs ? `"${c.needs}"` : (c.tags ? `"Tags: ${c.tags}"` : '(chưa có tags)')}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between min-w-0">
//                   <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest truncate">
//                     {c.statusText || c.status}
//                   </span>
//                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
//                     <button onClick={(e) => handleOpenEdit(c, e)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
//                     <button onClick={(e) => handleDelete(c.id, e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
//             <table className="w-full text-left min-w-[900px]">
//               <thead>
//                 <tr className="bg-gray-50 border-b border-gray-100">
//                   <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Khách hàng</th>
//                   <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Số điện thoại</th>
//                   <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Email</th>
//                   <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Nguồn</th>
//                   <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Công ty</th>
//                   <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center whitespace-nowrap">Điểm AI</th>
//                   <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Thao tác</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-50">
//                 {customers.map((c) => (
//                   <tr key={c.id} onClick={() => openCustomerDetail(c.id)} className="hover:bg-indigo-50/20 transition-colors group cursor-pointer">
//                     <td className="px-6 py-3">
//                       <div className="flex items-center gap-3 min-w-0">
//                         <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
//                           {(c.fullName || 'C')[0]}
//                         </div>
//                         <div className="font-black text-gray-900 text-[13px] truncate">{c.fullName}</div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-3 text-[11px] font-bold text-gray-700 whitespace-nowrap">{c.phone || '(n/a)'}</td>
//                     <td className="px-6 py-3 text-[11px] font-bold text-gray-700 whitespace-nowrap">{c.email || '(n/a)'}</td>
//                     <td className="px-6 py-3 text-[11px] font-bold text-gray-700 whitespace-nowrap">{c.source || 'Unknown'}</td>
//                     <td className="px-6 py-3 text-[11px] font-bold text-gray-700 whitespace-nowrap">{c.company || '(n/a)'}</td>
//                     <td className="px-6 py-3 text-center whitespace-nowrap">
//                       <span className={`px-2 py-0.5 rounded text-[9px] font-black text-white shadow-sm ${c.score > 80 ? 'bg-green-500' : c.score > 50 ? 'bg-indigo-500' : 'bg-gray-400'}`}>
//                         {c.score}%
//                       </span>
//                     </td>
//                     <td className="px-6 py-3 text-right">
//                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
//                         <button onClick={(e) => handleOpenEdit(c, e)} className="p-2 text-indigo-600 hover:bg-white rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
//                         <button onClick={(e) => handleDelete(c.id, e)} className="p-2 text-red-600 hover:bg-white rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )
//       ) : (
//         <div className="py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
//           <Database className="w-10 h-10 text-gray-200 mx-auto mb-3" />
//           <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Không có dữ liệu</p>
//         </div>
//       )}

//       {total > 0 && (
//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           onPageChange={setCurrentPage}
//           totalItems={total}
//           itemsPerPage={ITEMS_PER_PAGE}
//         />
//       )}

//       {/* ================= SYNC MODAL (IMPORT THẬT) ================= */}
//       {isSyncOpen && (
//         <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
//             {syncStep === 0 ? (
//               <div className="p-10">
//                 <div className="flex justify-between items-start mb-8">
//                   <div className="flex items-center gap-4">
//                     <div
//                       className={`p-4 rounded-2xl text-white shadow-lg ${
//                         syncSource === 'Sheets'
//                           ? 'bg-green-600'
//                           : syncSource === 'Forms'
//                           ? 'bg-purple-600'
//                           : syncSource === 'DriveCsv'
//                           ? 'bg-blue-600'
//                           : 'bg-emerald-600'
//                       }`}
//                     >
//                       {syncSource === 'Sheets' ? (
//                         <FileSpreadsheet className="w-8 h-8" />
//                       ) : syncSource === 'Forms' ? (
//                         <ClipboardList className="w-8 h-8" />
//                       ) : syncSource === 'DriveCsv' ? (
//                         <Link2 className="w-8 h-8" />
//                       ) : (
//                         <FileUp className="w-8 h-8" />
//                       )}
//                     </div>
//                     <div>
//                       <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">
//                         {syncSource === 'DriveCsv' ? 'Nhập đường dẫn driver (.csv)' : `Import ${syncSource}`}
//                       </h3>
//                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">
//                         Sheets: link • Forms: JSON • Excel: upload • DriveCsv: link CSV
//                       </p>
//                     </div>
//                   </div>
//                   <button onClick={closeSyncModal} className="text-gray-300 hover:text-red-500 transition-colors">
//                     <XCircle className="w-8 h-8" />
//                   </button>
//                 </div>

//                 <div className="space-y-6">
//                   {/* ===== SHEETS (LINK) ===== */}
//                   {syncSource === 'Sheets' && (
//                     <div className="space-y-5">
//                       <div className="space-y-2">
//                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                           <Link className="w-3 h-3" /> SheetUrl
//                         </label>
//                         <input
//                           type="url"
//                           value={sheetUrl}
//                           onChange={(e) => setSheetUrl(e.target.value)}
//                           placeholder="https://docs.google.com/spreadsheets/d/..."
//                           className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                         />
//                       </div>

//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div className="space-y-2">
//                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                             SheetName
//                           </label>
//                           <input
//                             type="text"
//                             value={sheetName}
//                             onChange={(e) => setSheetName(e.target.value)}
//                             placeholder="Sheet1"
//                             className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                           />
//                         </div>

//                         <div className="space-y-2">
//                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                             RangeA1
//                           </label>
//                           <input
//                             type="text"
//                             value={rangeA1}
//                             onChange={(e) => setRangeA1(e.target.value)}
//                             placeholder="A1:F1000"
//                             className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* ===== FORMS (RECORDS JSON) ===== */}
//                   {syncSource === 'Forms' && (
//                     <div className="space-y-3">
//                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                         <FileText className="w-3 h-3" /> Records JSON (array)
//                       </label>

//                       <textarea
//                         value={formsRecordsJson}
//                         onChange={(e) => setFormsRecordsJson(e.target.value)}
//                         rows={10}
//                         className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                       />
//                       <p className="text-[11px] text-gray-500 font-medium">
//                         Dán JSON theo format: [{`{ fullName, phone, email, tags, metadataJson, sourceRef }`}]
//                       </p>
//                     </div>
//                   )}

//                   {/* ===== DRIVE CSV LINK ===== */}
//                   {syncSource === 'DriveCsv' && (
//                     <div className="space-y-3">
//                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                         <Link2 className="w-3 h-3" /> Google Drive CSV Link (Thông tin khách hàng)
//                       </label>

//                       <input
//                         type="url"
//                         value={driveCsvLink}
//                         onChange={(e) => setDriveCsvLink(e.target.value)}
//                         placeholder="Ví dụ: https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
//                         className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                       />
//                       <p className="text-[11px] text-gray-500 font-medium">
//                         Link phải <b>public/share</b> để server tải được file CSV.
//                       </p>
//                     </div>
//                   )}

//                   {/* ===== EXCEL (FILE) ===== */}
//                   {syncSource === 'Excel' && (
//                     <div className="space-y-3">
//                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                         <FileText className="w-3 h-3" /> Tệp dữ liệu Excel/CSV
//                       </label>
//                       <div className="relative group">
//                         <input
//                           type="file"
//                           accept=".xlsx, .xls, .csv"
//                           onChange={(e) => setSyncFile(e.target.files ? e.target.files[0] : null)}
//                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
//                         />
//                         <div className={`w-full py-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${syncFile ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 group-hover:border-indigo-400'}`}>
//                           <UploadCloud className={`w-10 h-10 mb-3 ${syncFile ? 'text-green-600' : 'text-gray-300'}`} />
//                           {syncFile ? <p className="text-sm font-black text-green-700">{syncFile.name}</p> : <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kéo thả tệp</p>}
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* ===== OPTIONS ===== */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
//                     <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
//                       <input type="checkbox" checked={importUpsert} onChange={(e) => setImportUpsert(e.target.checked)} />
//                       Upsert
//                     </label>

//                     <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
//                       <input type="checkbox" checked={hasHeaderRow} onChange={(e) => setHasHeaderRow(e.target.checked)} />
//                       HasHeaderRow
//                     </label>

//                     {syncSource === 'Forms' && (
//                       <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 md:col-span-2">
//                         <input
//                           type="checkbox"
//                           checked={skipIfNoPhoneAndEmail}
//                           onChange={(e) => setSkipIfNoPhoneAndEmail(e.target.checked)}
//                         />
//                         SkipIfNoPhoneAndEmail
//                       </label>
//                     )}
//                   </div>

//                   {/* ACTIONS */}
//                   <div className="pt-4 flex gap-4">
//                     <button
//                       onClick={() => setIsSyncOpen(false)}
//                       className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
//                       disabled={importing}
//                     >
//                       Hủy bỏ
//                     </button>

//                     <button
//                       onClick={handleExecuteSync}
//                       className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 disabled:opacity-60"
//                       disabled={importing}
//                     >
//                       <Zap className="w-4 h-4 fill-current" /> {importing ? 'Đang import...' : 'Bắt đầu'}
//                     </button>
//                   </div>

//                   {/* RESULT */}
//                   {importResult && (
//                     <div className="mt-2 text-left bg-gray-50 border border-gray-100 rounded-2xl p-4">
//                       <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kết quả import</div>
//                       <div className="grid grid-cols-2 gap-2 text-sm">
//                         <div><b>Total:</b> {importResult.total}</div>
//                         <div><b>Inserted:</b> {importResult.inserted}</div>
//                         <div><b>Updated:</b> {importResult.updated}</div>
//                         <div><b>Skipped:</b> {importResult.skipped}</div>
//                         <div><b>Errors:</b> {importResult.errors}</div>
//                       </div>
//                       {!!importResult.errorMessages?.length && (
//                         <ul className="mt-2 list-disc pl-5 text-xs text-red-600">
//                           {importResult.errorMessages.slice(0, 5).map((m: string, idx: number) => (
//                             <li key={idx}>{m}</li>
//                           ))}
//                         </ul>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ) : (
//               <div className="p-12 text-center">
//                 <div className="relative w-24 h-24 mx-auto mb-8">
//                   <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
//                   <div className="relative w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl">
//                     {syncStep === 4 ? <CheckCircle2 className="w-12 h-12" /> : <RefreshCw className="w-12 h-12 animate-spin" />}
//                   </div>
//                 </div>

//                 <h3 className="text-2xl font-black text-gray-900 mb-2">
//                   {syncStep === 1 && `Đang import ${syncSource}...`}
//                   {syncStep === 4 && 'Import hoàn tất!'}
//                 </h3>

//                 <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden my-10 shadow-inner">
//                   <div className="bg-indigo-600 h-full transition-all duration-700 ease-out shadow-lg" style={{ width: `${(Math.min(syncStep, 4) / 4) * 100}%` }}></div>
//                 </div>

//                 {syncStep === 4 && lastImportResult && (
//                   <div className="text-left bg-gray-50 border border-gray-100 rounded-2xl p-4">
//                     <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Kết quả import</div>
//                     <div className="grid grid-cols-2 gap-3 text-sm">
//                       <div><span className="font-black">Total:</span> {lastImportResult.total}</div>
//                       <div><span className="font-black">Inserted:</span> {lastImportResult.inserted}</div>
//                       <div><span className="font-black">Updated:</span> {lastImportResult.updated}</div>
//                       <div><span className="font-black">Skipped:</span> {lastImportResult.skipped}</div>
//                       <div><span className="font-black">Errors:</span> {lastImportResult.errors}</div>
//                     </div>

//                     {lastImportResult.errorMessages?.length > 0 && (
//                       <ul className="mt-3 text-xs text-red-600 list-disc pl-5">
//                         {lastImportResult.errorMessages.map((m, idx) => <li key={idx}>{m}</li>)}
//                       </ul>
//                     )}
//                   </div>
//                 )}

//                 {syncStep === 4 && (
//                   <button onClick={closeSyncModal} className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-transform">
//                     Quay lại
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* --- COMPACT CENTRAL MODAL (DETAIL) --- */}
//       {isInsightOpen && (
//         <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-4xl h-full max-h-[85vh] shadow-2xl rounded-[2.5rem] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
//             {/* Header */}
//             <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
//               <div className="flex items-center gap-5">
//                 <div className="relative">
//                   <div className="w-20 h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl border-4 border-white">
//                     {selectedCustomerDetail?.name?.[0] || 'N'}
//                   </div>
//                   <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
//                 </div>
//                 <div className="min-w-0">
//                   <h3 className="text-2xl font-black text-slate-900 tracking-tight truncate">{selectedCustomerDetail?.name}</h3>
//                   <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-400">
//                     <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-indigo-100">IDENTITY VERIFIED</span>
//                     <span className="tabular-nums">{selectedCustomerDetail?.phoneNumber}</span>
//                   </div>
//                   {!!selectedCustomerDetail?.company && (
//                     <div className="mt-1 text-[11px] font-bold text-slate-500 truncate">
//                       {selectedCustomerDetail.company} {selectedCustomerDetail.position ? `• ${selectedCustomerDetail.position}` : ''}
//                     </div>
//                   )}
//                 </div>
//               </div>
//               <button onClick={() => setIsInsightOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
//                 <XCircle className="w-8 h-8" />
//               </button>
//             </div>

//             {/* Navigation Tabs */}
//             <div className="px-8 py-0.5 bg-white border-b border-slate-50 flex gap-8 overflow-x-auto no-scrollbar">
//               {[
//                 { id: 'profile', label: 'Hồ sơ gốc', icon: Info },
//                 { id: 'conversations', label: 'Hội thoại', icon: MessageSquare },
//                 { id: 'events', label: 'Hoạt động', icon: History },
//                 { id: 'leads', label: 'Cơ hội', icon: Target },
//               ].map(tab => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveDetailTab(tab.id as any)}
//                   className={`flex items-center gap-2 pb-3.5 pt-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${activeDetailTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
//                 >
//                   <tab.icon className="w-4 h-4" />
//                   {tab.label}
//                 </button>
//               ))}
//             </div>

//             {/* Content */}
//             <div className="flex-1 overflow-y-auto bg-slate-50/40 p-8 custom-scrollbar">
//               {detailLoading ? (
//                 <div className="h-full flex flex-col items-center justify-center text-indigo-600">
//                   <Loader2 className="w-8 h-8 animate-spin mb-3" />
//                   <p className="text-[11px] font-black uppercase tracking-widest">Đang trích xuất dữ liệu...</p>
//                 </div>
//               ) : selectedCustomerDetail && (
//                 <div className="h-full animate-in fade-in duration-500">
//                   {/* --- TAB 1: PROFILE --- */}
//                   {activeDetailTab === 'profile' && (
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                       <div className="md:col-span-2 bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
//                         <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">Thông tin khách hàng</h4>

//                         <div className="grid grid-cols-2 gap-x-8 gap-y-6">
//                           {[
//                             { label: 'Họ và tên', value: selectedCustomerDetail.name, icon: UserCheck },
//                             { label: 'Số điện thoại', value: selectedCustomerDetail.phoneNumber, icon: Smartphone },
//                             { label: 'Email', value: selectedCustomerDetail.email, icon: Mail },
//                             { label: 'Website', value: selectedCustomerDetail.website, icon: Globe },
//                             { label: 'Nguồn', value: selectedCustomerDetail.source, icon: Send },
//                             { label: 'Trạng thái', value: selectedCustomerDetail.status, icon: Activity },
//                             { label: 'Giá trị lead', value: selectedCustomerDetail.leadValue != null ? String(selectedCustomerDetail.leadValue) : 'N/A', icon: Target },
//                             { label: 'Thẻ (Tags)', value: selectedCustomerDetail.tags, icon: Heart },
//                             { label: 'Ngày tạo', value: formatDateTime(selectedCustomerDetail.createdAt), icon: Calendar },
//                             { label: 'Cập nhật cuối', value: selectedCustomerDetail.updatedAt ? formatDateTime(selectedCustomerDetail.updatedAt) : 'N/A', icon: Clock },
//                           ]
//                           .map((item, i) => (
//                             <div key={i} className="space-y-1">
//                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
//                                 <item.icon className="w-3 h-3" /> {item.label}
//                               </p>
//                               <p className="text-[13px] font-bold text-slate-800 truncate">{item.value || '-'}</p>
//                             </div>
//                           ))}

//                           <div className="col-span-2 space-y-1">
//                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Address</p>
//                             <p className="text-[13px] font-bold text-slate-800 break-words">{selectedCustomerDetail.address || '-'}</p>
//                           </div>

//                           <div className="col-span-2 space-y-1">
//                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Briefcase className="w-3 h-3" /> Company / Position</p>
//                             <p className="text-[13px] font-bold text-slate-800 break-words">
//                               {(selectedCustomerDetail.company || '-')}{selectedCustomerDetail.position ? ` • ${selectedCustomerDetail.position}` : ''}
//                             </p>
//                           </div>

//                           <div className="col-span-2 space-y-1">
//                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><FileText className="w-3 h-3" /> Description</p>
//                             <p className="text-[13px] font-bold text-slate-800 break-words">{selectedCustomerDetail.description || '-'}</p>
//                           </div>
//                         </div>

//                         <div className="pt-4 border-t border-slate-50">
//                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Metadata</p>
//                           <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden shadow-inner border border-slate-800">
//                             <pre className="text-emerald-400 font-mono text-[10px] leading-relaxed max-h-[150px] overflow-auto custom-scrollbar">
//                               {safeJsonStringify(selectedCustomerDetail.metadataJson)}
//                             </pre>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="space-y-4">
//                         <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-1">Chỉ số quan tâm AI</h4>
//                         {selectedCustomerDetail.interests.map((interest, idx) => (
//                           <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-rose-100 transition-all">
//                             <div className="flex justify-between items-center mb-3">
//                               <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
//                               <span className="text-[11px] font-black text-slate-900">{interest.level}/100</span>
//                             </div>
//                             <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
//                               <div className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full" style={{ width: `${Math.min(100, interest.level)}%` }} />
//                             </div>
//                             <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">"{interest.note || ''}"</p>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* --- TAB 2: CONVERSATIONS --- */}
//                   {activeDetailTab === 'conversations' && (
//                     <div className="h-[450px] flex gap-6">
//                       <div className="w-[280px] overflow-y-auto space-y-3 pr-2 custom-scrollbar border-r border-slate-100">
//                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 sticky top-0 bg-white/10 backdrop-blur-sm">Lịch sử hội thoại</p>
//                         {selectedCustomerDetail.conversations.map(conv => (
//                           <div
//                             key={conv.id}
//                             onClick={() => setSelectedConvId(conv.id)}
//                             className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedConvId === conv.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-50 hover:border-indigo-100 shadow-sm'}`}
//                           >
//                             <div className="flex justify-between items-start mb-2">
//                               <div className="flex items-center gap-2">
//                                 <ChannelIcon name={conv.channel || ''} className={`w-4 h-4 ${selectedConvId === conv.id ? 'text-white' : ''}`} />
//                                 <span className="text-[10px] font-black uppercase tracking-widest">{conv.channel}</span>
//                               </div>
//                               <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${conv.status === 'Closed' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-400 text-white'}`}>{conv.status}</span>
//                             </div>
//                             <p className={`text-[9px] font-bold truncate opacity-70 ${selectedConvId === conv.id ? 'text-indigo-100' : 'text-slate-400'}`}>Ngày tạo: {formatDateTime(conv.startedAt)}</p>
//                           </div>
//                         ))}
//                       </div>

//                       <div className="flex-1 bg-white rounded-3xl border border-slate-100 flex flex-col overflow-hidden shadow-inner">
//                         <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/20 custom-scrollbar">
//                           {selectedCustomerDetail.messages
//                             .filter(m => m.conversationId === selectedConvId)
//                             .map(msg => (
//                               <div key={msg.id} className={`flex ${msg.senderType === 'Customer' ? 'justify-end' : 'justify-start'}`}>
//                                 <div className="flex flex-col max-w-[85%]">
//                                   <div className={`p-4 rounded-2xl text-[13px] font-semibold leading-relaxed shadow-sm ${msg.senderType === 'Customer' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
//                                     {msg.content}
//                                   </div>
//                                   <p className={`mt-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest ${msg.senderType === 'Customer' ? 'text-right' : ''}`}>
//                                     {msg.senderType === 'Agent' ? 'Hệ thống' : 'Khách hàng'} • {msg.createdAt?.split(' ')?.[1] || ''}
//                                   </p>
//                                 </div>
//                               </div>
//                             ))}
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* --- TAB 3: EVENTS --- */}
//                   {activeDetailTab === 'events' && (
//                     <div className="h-[480px] flex gap-8">
//                       <div className="w-[320px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
//                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 sticky top-0 bg-white/10 backdrop-blur-sm">Dòng thời gian sự kiện</p>
//                         <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
//                           {selectedCustomerDetail.events.map((ev) => (
//                             <div
//                               key={ev.id}
//                               onClick={() => setSelectedEventId(ev.id)}
//                               className={`relative group cursor-pointer transition-all ${selectedEventId === ev.id ? 'scale-[1.02]' : ''}`}
//                             >
//                               <div className={`absolute -left-[33px] top-2 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all ${selectedEventId === ev.id ? 'bg-indigo-600 scale-125' : 'bg-slate-200 group-hover:bg-indigo-300'}`}></div>
//                               <div className={`p-4 rounded-2xl border-2 transition-all ${selectedEventId === ev.id ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-transparent hover:border-slate-100'}`}>
//                                 <div className="flex items-center gap-3 mb-1">
//                                   <ChannelIcon name={ev.channel} className="w-3.5 h-3.5" />
//                                   <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">{ev.eventType}</h5>
//                                 </div>
//                                 <p className="text-[10px] font-bold text-slate-400 tabular-nums">Thời gian: {formatDateTime(ev.eventTime)}</p>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </div>

//                       <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden ring-1 ring-slate-200/50">
//                         {currentSelectedEvent ? (
//                           <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
//                             <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
//                               <div className="flex items-center gap-4">
//                                 <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
//                                   <Zap className="w-6 h-6" />
//                                 </div>
//                                 <div>
//                                   <h6 className="text-sm font-black text-slate-900 uppercase tracking-widest">Sự kiện: {currentSelectedEvent.eventType}</h6>
//                                   <p className="text-[10px] font-bold text-indigo-500 uppercase">Kênh: {currentSelectedEvent.channel}</p>
//                                 </div>
//                               </div>
//                               <div className="text-right">
//                                 <p className="text-[9px] font-bold text-slate-400">{formatDateTime(currentSelectedEvent.eventTime)}</p>
//                               </div>
//                             </div>

//                             <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
//                               <div className="grid grid-cols-2 gap-6">
//                                 <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
//                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Phân loại</p>
//                                   <p className="text-xs font-bold text-slate-800">{currentSelectedEvent.eventType}</p>
//                                 </div>
//                                 <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
//                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Smartphone className="w-3 h-3" /> Giao thức</p>
//                                   <p className="text-xs font-bold text-slate-800">{currentSelectedEvent.channel}</p>
//                                 </div>
//                               </div>

//                               <div className="space-y-4">
//                                 <h6 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
//                                   <Code className="w-4 h-4 text-indigo-500" /> Cấu trúc Payload (JSON)
//                                 </h6>
//                                 <div className="bg-slate-950 rounded-[1.5rem] p-6 shadow-2xl relative group overflow-hidden">
//                                   <pre className="text-emerald-400 font-mono text-[12px] leading-relaxed custom-scrollbar max-h-[220px] overflow-auto">
//                                     {safeJsonStringify(currentSelectedEvent.payloadJson)}
//                                   </pre>
//                                 </div>
//                               </div>

//                               <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
//                                 <div className="mt-1"><Info className="w-4 h-4 text-indigo-400" /></div>
//                                 <div className="space-y-1">
//                                   <p className="text-[10px] font-black text-indigo-900 uppercase">Ghi chú AI</p>
//                                   <p className="text-[11px] font-bold text-indigo-700 leading-relaxed italic">
//                                     Hành động "{currentSelectedEvent.eventType}" được ghi nhận tự động từ hệ thống tracking thời gian thực.
//                                   </p>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         ) : (
//                           <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-4">
//                             <Eye className="w-16 h-16 opacity-20" />
//                             <p className="text-[11px] font-black uppercase tracking-widest">Chọn một sự kiện để kiểm tra chi tiết</p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}

//                   {/* --- TAB 4: LEADS --- */}
//                   {activeDetailTab === 'leads' && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                       {selectedCustomerDetail.leads.map(lead => (
//                         <div key={lead.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-all group overflow-hidden relative">
//                           <div className={`absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 opacity-30`}></div>
//                           <div className="relative z-10 flex flex-col h-full">
//                             <div className="flex justify-between items-start mb-6">
//                               <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${lead.stage === 'Won' ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-white'}`}>
//                                 {lead.stage}
//                               </span>
//                               <div className="text-right">
//                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">AI Score</p>
//                                 <span className="text-3xl font-black text-slate-900 tabular-nums">{lead.score}%</span>
//                               </div>
//                             </div>
//                             <div className="space-y-4">
//                               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
//                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
//                                   <Briefcase className="w-5 h-5" />
//                                 </div>
//                                 <div className="min-w-0">
//                                   <p className="text-[13px] font-black text-slate-800 truncate leading-tight">{lead.projectName || 'N/A'}</p>
//                                   <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Căn hộ: {lead.unitName || 'NONE'}</p>
//                                 </div>
//                               </div>
//                               <div className="flex items-center justify-between pt-4 border-t border-slate-50">
//                                 <div className="flex items-center gap-1.5 text-slate-400">
//                                   <Clock className="w-3.5 h-3.5" />
//                                   <span className="text-[10px] font-black uppercase tracking-widest">{formatDateTime(lead.createdAt)}</span>
//                                 </div>
//                                 <SourceBadge source={lead.source} />
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Footer */}
//             <div className="px-8 py-6 border-t bg-slate-50 flex items-center justify-between">
//               <div className="flex gap-3">
//                 <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
//                   <Smartphone className="w-3.5 h-3.5" /> Kết nối
//                 </button>
//                 <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
//                   <Calendar className="w-3.5 h-3.5" /> Lịch hẹn
//                 </button>
//               </div>
//               <div className="flex gap-2">
//                 <button onClick={() => setIsInsightOpen(false)} className="px-6 py-2.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Đóng</button>
//                 <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Biên tập</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ ADD/EDIT MODAL (UPDATED fields) */}
//       {isFormOpen && (
//         <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300">
//             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
//                   <UserPlus className="w-6 h-6" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">
//                     {formMode === 'add' ? 'Thêm khách hàng' : 'Chỉnh sửa khách hàng'}
//                   </h3>
//                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">
//                     {formMode === 'add' ? 'Tạo bản ghi mới' : `ID: ${formCustomer.id}`}
//                   </p>
//                 </div>
//               </div>

//               <button
//                 onClick={() => setIsFormOpen(false)}
//                 className="p-2 hover:bg-red-50 rounded-full group transition-all"
//               >
//                 <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
//               </button>
//             </div>

//             <form onSubmit={handleSaveCustomer} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
//               {/* BASIC */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Name
//                   </label>
//                   <input
//                     required
//                     value={formCustomer.name}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, name: e.target.value }))}
//                     placeholder="Nguyễn Văn A"
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     PhoneNumber
//                   </label>
//                   <input
//                     value={formCustomer.phoneNumber}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, phoneNumber: e.target.value }))}
//                     placeholder="090..."
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Email
//                   </label>
//                   <input
//                     type="email"
//                     value={formCustomer.email}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, email: e.target.value }))}
//                     placeholder="abc@gmail.com"
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Website
//                   </label>
//                   <input
//                     value={formCustomer.website}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, website: e.target.value }))}
//                     placeholder="https://..."
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Source
//                   </label>
//                   <select
//                     value={formCustomer.source}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, source: e.target.value }))}
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   >
//                     {['Facebook', 'Zalo', 'Google Sheets', 'Google Forms', 'Excel', 'Drive CSV', 'Tiktok', 'Hotline', 'Referral', 'Other'].map((s) => (
//                       <option key={s} value={s}>{s}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Status
//                   </label>
//                   <select
//                     value={formCustomer.status}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, status: e.target.value }))}
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   >
//                     {['New', 'Contacted', 'Qualified', 'Working', 'Won', 'Lost'].map((s) => (
//                       <option key={s} value={s}>{s}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Company
//                   </label>
//                   <input
//                     value={formCustomer.company}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, company: e.target.value }))}
//                     placeholder="Rai Holdings..."
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Position
//                   </label>
//                   <input
//                     value={formCustomer.position}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, position: e.target.value }))}
//                     placeholder="Sales Executive..."
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>
//               </div>

//               {/* LOCATION */}
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Country
//                   </label>
//                   <input
//                     value={formCustomer.country}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, country: e.target.value }))}
//                     placeholder="Vietnam"
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     City
//                   </label>
//                   <input
//                     value={formCustomer.city}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, city: e.target.value }))}
//                     placeholder="Hồ Chí Minh"
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     State
//                   </label>
//                   <input
//                     value={formCustomer.state}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, state: e.target.value }))}
//                     placeholder="HCM"
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Zip
//                   </label>
//                   <input
//                     value={formCustomer.zip}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, zip: e.target.value }))}
//                     placeholder="700000"
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>
//                 <div className="md:col-span-2">
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Address
//                   </label>
//                   <input
//                     value={formCustomer.address}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, address: e.target.value }))}
//                     placeholder="Quận 7, Hồ Chí Minh..."
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>
//               </div>

//               {/* EXTRA */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     LeadValue
//                   </label>
//                   <input
//                     value={formCustomer.leadValue}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, leadValue: e.target.value }))}
//                     placeholder="150000000"
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                   <p className="mt-1 text-[10px] text-gray-400 font-bold">Nhập số (có thể có dấu phẩy).</p>
//                 </div>

//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Tags
//                   </label>
//                   <input
//                     value={formCustomer.tags}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, tags: e.target.value }))}
//                     placeholder="vip,hot,..."
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>

//                 <div className="md:col-span-2">
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Description
//                   </label>
//                   <textarea
//                     value={formCustomer.description}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, description: e.target.value }))}
//                     rows={4}
//                     placeholder="Ghi chú/nhu cầu khách hàng..."
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>
//               </div>

//               <div className="pt-6 flex gap-4">
//                 <button
//                   type="button"
//                   onClick={() => setIsFormOpen(false)}
//                   className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
//                 >
//                   Hủy bỏ
//                 </button>
//                 <button
//                   type="submit"
//                   className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
//                 >
//                   <CheckCircle2 className="w-4 h-4" />
//                   {formMode === 'add' ? 'Tạo mới' : 'Lưu thay đổi'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CDP;


// // =============== DANH SÁCH KHÁCH HÀNG ================
// import React, { useEffect, useState } from 'react';
// import { Project } from '../types'; // giữ để UI không lỗi (hiện chưa dùng)
// import { api } from '../services/apiService';
// import Pagination from '../components/Pagination';
// import {
//   Search, Filter, Mail, Phone, Loader2,
//   RefreshCw, Database,
//   Facebook, MessageCircle, Share2,
//   ChevronDown, UserPlus,
//   Star, LayoutGrid, List,
//   Trash2, Edit2, XCircle, MessageSquare,
//   Smartphone, Video, FileUp, ClipboardList,
//   Link, Link2, UploadCloud, FileText,
//   Instagram, Send, Headset, MessageSquareText,
//   CheckCircle2, Zap, FileSpreadsheet, Calendar, MapPin, Info, UserCheck, Clock, Target, Heart, Eye, Code,
//   Activity, Briefcase, History
// } from 'lucide-react';

// import { formatDateTime } from '../components/utils/formatDate';

// const ITEMS_PER_PAGE = 8;

// // ===== Backend DTOs =====
// type CustomerDto = {
//   id: string;
//   fullName: string;
//   phone?: string | null;
//   email?: string | null;
//   source: string;
//   tags?: string | null; // backend: string? Tags
// };

// type PagedResponse<T> = {
//   items: T[];
//   page: number;
//   pageSize: number;
//   total: number;
// };

// // ===== ViewModel cho UI =====
// type CustomerVM = {
//   id: string;
//   fullName: string;
//   phone?: string;
//   email?: string;
//   source: string;
//   tags?: string;
//   score: number; // placeholder
//   status: string; // placeholder
//   needs?: string; // placeholder
// };

// type LeadVM = {
//   id: string;
//   stage: string;
//   score: number;
//   source: string;
//   projectId?: string | null;
//   unitId?: string | null;
//   createdAt: string;
//   projectName?: string;
//   unitName?: string;
// };

// type ConversationVM = {
//   id: string;
//   channel?: string | null;
//   status: string;
//   startedAt: string;
//   lastMessageAt: string;
//   agentId?: string | null;
// };

// type MessageVM = {
//   id: string;
//   conversationId: string;
//   senderType: string;
//   senderId?: string | null;
//   content: string;
//   createdAt: string;
// };

// type CustomerEventVM = {
//   id: string;
//   channel: string;
//   eventType: string;
//   eventTime: string;
//   payloadJson?: string | null;
// };

// type CustomerInterestVM = {
//   id: string;
//   level: number;
//   note?: string | null;
//   projectId?: string | null;
//   unitId?: string | null;
//   createdAt: string;
//   projectName?: string;
//   unitName?: string;
// };

// type CustomerDetailVM = {
//   id: string;
//   fullName: string;
//   phone?: string | null;
//   email?: string | null;
//   source: string;
//   tags?: string | null;
//   createdAt: string;
//   updatedAt?: string | null;
//   metadataJson?: string | null;

//   // ✅ bổ sung để tránh TS lỗi vì bạn đang dùng selectedCustomerDetail.address
//   address?: string | null;

//   leads: LeadVM[];
//   conversations: ConversationVM[];
//   messages: MessageVM[];
//   events: CustomerEventVM[];
//   interests: CustomerInterestVM[];
// };

// const mapCustomerToVM = (c: CustomerDto): CustomerVM => ({
//   id: c.id,
//   fullName: c.fullName,
//   phone: c.phone ?? '',
//   email: c.email ?? '',
//   source: c.source || 'Unknown',
//   tags: c.tags ?? '',
//   score: 50,
//   status: c.tags ? 'Có tag' : 'Mới',
//   needs: c.tags ? `Tags: ${c.tags}` : '',
// });

// const safeJsonStringify = (json: string | null | undefined) => {
//   try {
//     return JSON.stringify(JSON.parse(json || '{}'), null, 3);
//   } catch {
//     return JSON.stringify({ raw: json }, null, 3);
//   }
// };

// const ChannelIcon: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
//   const n = (name || '').toLowerCase();
//   const cn = className || 'w-3.5 h-3.5';
//   if (n.includes('facebook')) return <Facebook className={`${cn} text-blue-600`} />;
//   if (n.includes('zalo oa')) return <div className="w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center text-[7px] text-white font-black shadow-sm">OA</div>;
//   if (n.includes('zalo')) return <MessageCircle className={`${cn} text-blue-400`} />;
//   if (n.includes('instagram')) return <Instagram className={`${cn} text-pink-600`} />;
//   if (n.includes('whatsapp')) return <Smartphone className={`${cn} text-green-500`} />;
//   if (n.includes('telegram')) return <Send className={`${cn} text-blue-400`} />;
//   if (n.includes('tiktok')) return <Share2 className={`${cn} text-black`} />;
//   if (n.includes('livechat')) return <Headset className={`${cn} text-indigo-500`} />;
//   if (n.includes('gmail')) return <Mail className={`${cn} text-red-500`} />;
//   if (n.includes('sms')) return <MessageSquareText className={`${cn} text-amber-500`} />;
//   if (n.includes('call')) return <Phone className={`${cn} text-green-600`} />;
//   return <MessageSquare className={`${cn} text-gray-400`} />;
// };

// const SourceBadge: React.FC<{ source: string; showText?: boolean }> = ({ source, showText = true }) => {
//   const config: Record<string, { icon: any; color: string; bgColor: string }> = {
//     Facebook: { icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-50' },
//     Zalo: { icon: MessageCircle, color: 'text-blue-400', bgColor: 'bg-blue-50' },
//     Youtube: { icon: Video, color: 'text-red-600', bgColor: 'bg-red-50' },
//     Tiktok: { icon: Share2, color: 'text-gray-900', bgColor: 'bg-gray-100' },
//     Excel: { icon: FileUp, color: 'text-emerald-700', bgColor: 'bg-emerald-50' },
//     'Google Forms': { icon: ClipboardList, color: 'text-purple-600', bgColor: 'bg-purple-50' },
//     'Google Sheets': { icon: FileSpreadsheet, color: 'text-green-600', bgColor: 'bg-green-50' },
//     'Drive CSV': { icon: Link2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
//   };

//   const item = config[source] || { icon: Database, color: 'text-gray-600', bgColor: 'bg-gray-50' };
//   const Icon = item.icon;

//   return (
//     <div
//       className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${item.bgColor} ${item.color} border border-current border-opacity-10 w-fit flex-shrink-0`}
//       title={source}
//     >
//       <Icon className="w-2.5 h-2.5" />
//       {showText && <span className="text-[8px] font-bold uppercase tracking-tight whitespace-nowrap">{source}</span>}
//     </div>
//   );
// };

// // ===== Import result (response) =====
// type ImportResult = {
//   total: number;
//   inserted: number;
//   updated: number;
//   skipped: number;
//   errors: number;
//   errorMessages: string[];
// };

// const CDP: React.FC = () => {
//   const [customers, setCustomers] = useState<CustomerVM[]>([]);
//   const [projects] = useState<Project[]>([]); // giữ để UI không lỗi (hiện chưa dùng)

//   const [showSyncMenu, setShowSyncMenu] = useState(false);

//   const [loading, setLoading] = useState(true);
//   const [currentPage, setCurrentPage] = useState(1);

//   const [q, setQ] = useState('');
//   const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

//   const [total, setTotal] = useState(0);
//   const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

//   // Modals demo (giữ UI)
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isInsightOpen, setIsInsightOpen] = useState(false);
//   const [selectedCustomer, setSelectedCustomer] = useState<CustomerVM | null>(null);

//   // Sync modal
//   const [isSyncOpen, setIsSyncOpen] = useState(false);
//   const [syncSource, setSyncSource] = useState<'Sheets' | 'Forms' | 'Excel' | 'DriveCsv' | null>(null);
//   const [syncStep, setSyncStep] = useState(0);

//   // Sheets/Forms: JSON input (records)
//   const [syncInput, setSyncInput] = useState('');
//   const [sheetUrl, setSheetUrl] = useState('');
//   const [sheetName, setSheetName] = useState('Sheet1');
//   const [rangeA1, setRangeA1] = useState('A1:F1000'); // tuỳ bạn

//   // Drive CSV
//   const [driveCsvLink, setDriveCsvLink] = useState('');

//   // Forms: dán JSON records
//   const [formsRecordsJson, setFormsRecordsJson] = useState(`[
//     {
//       "fullName": "Nguyễn Văn A",
//       "phone": "0900000000",
//       "email": "a@gmail.com",
//       "tags": "VIP",
//       "metadataJson": "{}",
//       "sourceRef": "form-001"
//     }
//   ]`);
//   const [importResult, setImportResult] = useState<any>(null);
//   const [importing, setImporting] = useState(false);

//   // Excel: file
//   const [syncFile, setSyncFile] = useState<File | null>(null);

//   // flags
//   const [importUpsert, setImportUpsert] = useState(true);
//   const [skipIfNoPhoneAndEmail, setSkipIfNoPhoneAndEmail] = useState(true);
//   const [hasHeaderRow, setHasHeaderRow] = useState(true);

//   // result
//   const [lastImportResult, setLastImportResult] = useState<ImportResult | null>(null);

//   const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetailVM | null>(null);
//   const [detailLoading, setDetailLoading] = useState(false);

//   const [activeDetailTab, setActiveDetailTab] = useState<'profile' | 'conversations' | 'events' | 'leads'>('profile');
//   const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
//   const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

//   const currentSelectedEvent = selectedCustomerDetail?.events.find(e => e.id === selectedEventId);

//   // ===== Add/Edit Modal State =====
//   type CustomerForm = {
//     id?: string;
//     fullName: string;
//     phone: string;
//     email: string;
//     source: string;
//     tags: string;
//   };

//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
//   const [formCustomer, setFormCustomer] = useState<CustomerForm>({
//     fullName: '',
//     phone: '',
//     email: '',
//     source: 'Facebook',
//     tags: '',
//   });

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const res = (await api.getCustomers({
//         q: q || undefined,
//         page: currentPage,
//         pageSize: ITEMS_PER_PAGE,
//       })) as PagedResponse<CustomerDto>;

//       const mapped = (res.items ?? []).map(mapCustomerToVM);
//       setCustomers(mapped);
//       setTotal(res.total ?? 0);
//     } catch (e: any) {
//       console.error(e);
//       setCustomers([]);
//       setTotal(0);
//       alert(e?.message || 'Không thể tải danh sách Customer từ backend.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [currentPage, q]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [q]);

//   const handleOpenAdd = () => {
//     setFormMode('add');
//     setFormCustomer({
//       fullName: '',
//       phone: '',
//       email: '',
//       source: 'Facebook',
//       tags: '',
//     });
//     setIsFormOpen(true);
//   };

//   const openCustomerDetail = async (customerId: string) => {
//     try {
//       setIsInsightOpen(true);
//       setDetailLoading(true);
//       setSelectedCustomerDetail(null);

//       const detail = await api.getCustomerDetail(customerId);
//       setSelectedCustomerDetail(detail as CustomerDetailVM);

//       // auto select first conv/event for UX
//       const firstConv = (detail as any)?.conversations?.[0]?.id;
//       const firstEvent = (detail as any)?.events?.[0]?.id;
//       if (firstConv) setSelectedConvId(firstConv);
//       if (firstEvent) setSelectedEventId(firstEvent);
//     } catch (e: any) {
//       console.error(e);
//       alert(e?.message || 'Không tải được chi tiết customer.');
//       setIsInsightOpen(false);
//     } finally {
//       setDetailLoading(false);
//     }
//   };

//   const handleOpenEdit = (c: CustomerVM, e: React.MouseEvent) => {
//     e.stopPropagation();
//     setFormMode('edit');
//     setFormCustomer({
//       id: c.id,
//       fullName: c.fullName || '',
//       phone: c.phone || '',
//       email: c.email || '',
//       source: c.source || 'Unknown',
//       tags: c.tags || '',
//     });
//     setIsFormOpen(true);
//   };

//   const handleSaveCustomer = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       const fullName = (formCustomer.fullName || '').trim();
//       const source = (formCustomer.source || '').trim() || 'Unknown';

//       if (!fullName) {
//         alert('Vui lòng nhập FullName.');
//         return;
//       }

//       const payload = {
//         fullName,
//         phone: (formCustomer.phone || '').trim() || null,
//         email: (formCustomer.email || '').trim() || null,
//         source,
//         tags: (formCustomer.tags || '').trim() || null,
//       };

//       if (formMode === 'add') {
//         await api.createCustomer(payload);
//         alert('Đã thêm khách hàng.');
//         setIsFormOpen(false);
//         setCurrentPage(1);
//         fetchData();
//         return;
//       }

//       const id = formCustomer.id;
//       if (!id) {
//         alert('Thiếu Id customer để cập nhật.');
//         return;
//       }

//       await api.updateCustomer(id, payload);
//       alert('Đã cập nhật khách hàng.');
//       setIsFormOpen(false);
//       fetchData();
//     } catch (err: any) {
//       console.error(err);
//       const data = err?.response?.data ?? err;

//       const msg =
//         data?.errors
//           ? Object.entries(data.errors)
//               .map(([k, v]: any) => `${k}: ${(v || []).join(', ')}`)
//               .join('\n')
//           : (data?.message || data?.title || 'Lưu khách hàng thất bại.');

//       alert(msg);
//     }
//   };

//   const handleDelete = async (id: string, e: React.MouseEvent) => {
//     e.stopPropagation();

//     const ok = confirm('Bạn chắc chắn muốn xoá khách hàng này?');
//     if (!ok) return;

//     try {
//       await api.deleteCustomer(id);
//       alert('Đã xoá khách hàng.');

//       if (customers.length === 1 && currentPage > 1) {
//         setCurrentPage((p) => p - 1);
//       } else {
//         fetchData();
//       }
//     } catch (err: any) {
//       console.error(err);
//       alert(err?.message || 'Xoá khách hàng thất bại.');
//     }
//   };

//   const openSyncForm = (source: 'Sheets' | 'Forms' | 'Excel' | 'DriveCsv') => {
//     setSyncSource(source);
//     setSyncStep(0);

//     setSyncInput('');
//     setSyncFile(null);

//     setSheetUrl('');
//     setSheetName('Sheet1');
//     setRangeA1('A1:F1000');

//     setDriveCsvLink('');

//     setImportResult(null);
//     setImporting(false);

//     setIsSyncOpen(true);
//   };

//   const closeSyncModal = () => {
//     setIsSyncOpen(false);
//     setSyncStep(0);
//     setLastImportResult(null);
//   };

//   const handleExecuteSync = async () => {
//     if (!syncSource) return;

//     setImportResult(null);
//     setImporting(true);
//     setSyncStep(1);

//     try {
//       // ===== Google Sheets Link =====
//       if (syncSource === 'Sheets') {
//         if (!sheetUrl.trim()) return alert('Vui lòng nhập SheetUrl!');
//         if (!sheetName.trim()) return alert('Vui lòng nhập SheetName!');
//         if (!rangeA1.trim()) return alert('Vui lòng nhập RangeA1! Ví dụ: A1:F1000');

//         const res = await api.importCustomersFromGoogleSheetsLink({
//           sheetUrl: sheetUrl.trim(),
//           sheetName: sheetName.trim(),
//           rangeA1: rangeA1.trim(),
//           hasHeaderRow,
//           upsert: importUpsert,
//         });

//         setImportResult(res);
//         setLastImportResult(res);
//         setSyncStep(4);
//         await fetchData();
//         return;
//       }

//       // ===== Google Forms (records JSON) =====
//       if (syncSource === 'Forms') {
//         let parsed: any;
//         try {
//           parsed = JSON.parse(formsRecordsJson);
//         } catch {
//           alert('JSON không hợp lệ. Bạn cần dán JSON array records.');
//           setSyncStep(0);
//           return;
//         }

//         const records = Array.isArray(parsed) ? parsed : [parsed];
//         if (!records.length) {
//           alert('Danh sách records rỗng.');
//           setSyncStep(0);
//           return;
//         }

//         const res = await api.importCustomersFromGoogleForms({
//           records,
//           upsert: importUpsert,
//           skipIfNoPhoneAndEmail,
//         });

//         setImportResult(res);
//         setLastImportResult(res);
//         setSyncStep(4);
//         await fetchData();
//         return;
//       }

//       // ===== Drive CSV Link =====
//       if (syncSource === 'DriveCsv') {
//         if (!driveCsvLink.trim()) return alert('Vui lòng nhập Google Drive CSV Link!');

//         // ✅ cần có api.importCustomersFromDriveCsvLink trong apiService.ts
//         const res = await api.importCustomersFromDriveCsvLink(driveCsvLink.trim(), importUpsert);

//         setImportResult(res);
//         setLastImportResult(res);
//         setSyncStep(4);
//         await fetchData();
//         return;
//       }

//       // ===== Excel (multipart) =====
//       if (syncSource === 'Excel') {
//         if (!syncFile) {
//           alert('Vui lòng chọn tệp Excel/CSV!');
//           setSyncStep(0);
//           return;
//         }

//         try {
//           const result = await api.importCustomersFromExcel(
//             syncFile!,
//             importUpsert,
//             hasHeaderRow
//           );
//           setImportResult(result);
//           setLastImportResult(result);
//         } catch (e: any) {
//           console.error('IMPORT FAILED', e?.data || e);
//           alert(e?.message || 'Import Excel thất bại.');
//           setSyncStep(0);
//           return;
//         }

//         setSyncStep(4);
//         await fetchData();
//         return;
//       }
//     } catch (e: any) {
//       console.error(e);
//       alert(e?.message || 'Import thất bại.');
//       setSyncStep(0);
//     } finally {
//       setImporting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="h-full flex flex-col items-center justify-center text-indigo-600">
//         <Loader2 className="w-8 h-8 animate-spin mb-3" />
//         <p className="text-xs font-bold animate-pulse uppercase tracking-widest">Đang tải Customer từ backend...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4 animate-in fade-in duration-500 pb-10">
//       <header className="flex flex-col md:flex-row md:items-end justify-between gap-3">
//         <div className="min-w-0">
//           <div className="flex items-center gap-2 mb-1">
//             <div className="p-1.5 bg-indigo-600 rounded-lg shadow-md shadow-indigo-100 flex-shrink-0">
//               <Database className="w-4 h-4 text-white" />
//             </div>
//             <h2 className="text-xl font-black text-gray-900 tracking-tight truncate">Danh sách khách hàng</h2>
//           </div>
//           <p className="text-[11px] text-gray-500 font-medium">
//             Số lượng khách hàng • Tổng: <span className="font-black text-indigo-600">{total}</span>
//           </p>
//         </div>

//         <div className="flex items-center gap-2 flex-shrink-0">
//           <div className="bg-white border border-gray-200 p-0.5 rounded-lg flex items-center shadow-sm">
//             <button
//               onClick={() => setViewMode('grid')}
//               className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'}`}
//             >
//               <LayoutGrid className="w-3.5 h-3.5" />
//             </button>
//             <button
//               onClick={() => setViewMode('table')}
//               className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'}`}
//             >
//               <List className="w-3.5 h-3.5" />
//             </button>
//           </div>

//           {/* ✅ NÚT ĐỒNG BỘ + MENU */}
//           <div className="relative">
//             <button
//               onClick={() => setShowSyncMenu(v => !v)}
//               className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-[11px] uppercase hover:bg-gray-50 transition-all shadow-sm"
//             >
//               Import
//             </button>

//             {showSyncMenu && (
//               <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in slide-in-from-top-2">
//                 <button
//                   onClick={() => { openSyncForm('Sheets'); setShowSyncMenu(false); }}
//                   className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
//                 >
//                   <FileSpreadsheet className="w-4 h-4 text-green-600" />
//                   <span className="text-[11px] font-bold text-gray-700">Google Sheets</span>
//                 </button>

//                 <button
//                   onClick={() => { openSyncForm('Forms'); setShowSyncMenu(false); }}
//                   className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
//                 >
//                   <ClipboardList className="w-4 h-4 text-purple-600" />
//                   <span className="text-[11px] font-bold text-gray-700">Google Forms</span>
//                 </button>

//                 <button
//                   onClick={() => { openSyncForm('Excel'); setShowSyncMenu(false); }}
//                   className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
//                 >
//                   <FileUp className="w-4 h-4 text-emerald-600" />
//                   <span className="text-[11px] font-bold text-gray-700">Import Excel</span>
//                 </button>

//                 {/* ✅ NEW: Drive CSV link */}
//                 <button
//                   onClick={() => { openSyncForm('DriveCsv'); setShowSyncMenu(false); }}
//                   className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-indigo-50 text-left transition-colors"
//                 >
//                   <Link2 className="w-4 h-4 text-blue-600" />
//                   <span className="text-[11px] font-bold text-gray-700">Import CSV (Drive link)</span>
//                 </button>
//               </div>
//             )}
//           </div>

//           <button
//             onClick={handleOpenAdd}
//             className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-[11px] uppercase tracking-wider hover:bg-indigo-700 shadow-md"
//           >
//             <UserPlus className="w-3.5 h-3.5" /> Thêm mới
//           </button>
//           <button
//             onClick={fetchData}
//             className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-indigo-600 shadow-sm transition-all"
//             title="Reload"
//           >
//             <RefreshCw className="w-4 h-4" />
//           </button>
//         </div>
//       </header>

//       <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-2.5 items-center">
//         <div className="relative flex-1 w-full">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
//           <input
//             type="text"
//             value={q}
//             onChange={(e) => setQ(e.target.value)}
//             placeholder="Vui lòng nhập tìm kiếm..."
//             className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-inner"
//           />
//         </div>

//         <div className="relative w-full md:w-56 flex-shrink-0 opacity-60">
//           <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
//           <select
//             disabled
//             value="All"
//             className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-transparent rounded-lg text-[10px] font-bold uppercase outline-none appearance-none cursor-not-allowed transition-all"
//             title="Backend hiện chỉ hỗ trợ q/page/pageSize"
//           >
//             <option value="All">Filter (disabled)</option>
//           </select>
//           <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 pointer-events-none" />
//         </div>
//       </div>

//       {customers.length > 0 ? (
//         viewMode === 'grid' ? (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
//             {customers.map((c) => (
//               <div
//                 key={c.id}
//                 onClick={() => openCustomerDetail(c.id)}
//                 className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 group cursor-pointer relative flex flex-col min-w-0"
//               >
//                 <div className="absolute top-3 right-3 flex-shrink-0">
//                   <div className={`text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter text-white shadow-sm flex items-center gap-0.5 whitespace-nowrap ${c.score > 80 ? 'bg-green-500' : c.score > 50 ? 'bg-indigo-500' : 'bg-gray-400'}`}>
//                     <Star className="w-2 h-2 fill-current" /> {c.score}%
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-3 mb-4 min-w-0">
//                   <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0">
//                     {(c.fullName || 'C')[0]}
//                   </div>
//                   <div className="min-w-0">
//                     <h3 className="font-black text-gray-900 text-[13px] truncate group-hover:text-indigo-600 transition-colors">{c.fullName}</h3>
//                     <div className="mt-0.5 flex-shrink-0"><SourceBadge source={c.source || 'Unknown'} /></div>
//                   </div>
//                 </div>

//                 <div className="space-y-2 flex-1 min-w-0">
//                   <div className="flex items-center gap-2 text-gray-600 p-2 bg-gray-50 rounded-xl border border-gray-100 min-w-0">
//                     <Phone className="w-3 h-3 text-indigo-500 flex-shrink-0" />
//                     <span className="text-[12px] font-black text-gray-900 truncate">{c.phone || '(chưa có)'}</span>
//                   </div>

//                   <div className="px-1 space-y-1 min-w-0">
//                     <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium min-w-0">
//                       <Mail className="w-2.5 h-2.5 text-indigo-400 flex-shrink-0" />
//                       <span className="truncate">{c.email || '(chưa có email)'}</span>
//                     </div>
//                     <p className="text-[11px] text-gray-600 font-bold leading-snug line-clamp-2 italic opacity-80 min-w-0">
//                       {c.needs ? `"${c.needs}"` : (c.tags ? `"Tags: ${c.tags}"` : '(chưa có tags)')}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between min-w-0">
//                   <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest truncate">
//                     {c.status}
//                   </span>
//                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
//                     <button onClick={(e) => handleOpenEdit(c, e)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
//                     <button onClick={(e) => handleDelete(c.id, e)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
//             <table className="w-full text-left min-w-[700px]">
//               <thead>
//                 <tr className="bg-gray-50 border-b border-gray-100">
//                   <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Khách hàng</th>
//                   <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Số điện thoại</th>
//                   <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Nguồn</th>
//                   <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 text-center whitespace-nowrap">Điểm AI</th>
//                   <th className="px-6 py-4 text-right text-[9px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Thao tác</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-50">
//                 {customers.map((c) => (
//                   <tr key={c.id} onClick={() => openCustomerDetail(c.id)} className="hover:bg-indigo-50/20 transition-colors group cursor-pointer">
//                     <td className="px-6 py-3">
//                       <div className="flex items-center gap-3 min-w-0">
//                         <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
//                           {(c.fullName || 'C')[0]}
//                         </div>
//                         <div className="font-black text-gray-900 text-[13px] truncate">{c.fullName}</div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-3 text-[11px] font-bold text-gray-700 whitespace-nowrap">{c.phone || '(n/a)'}</td>
//                     <td className="px-6 py-3 text-[11px] font-bold text-gray-700 whitespace-nowrap">{c.source || 'Unknown'}</td>
//                     <td className="px-6 py-3 text-center whitespace-nowrap">
//                       <span className={`px-2 py-0.5 rounded text-[9px] font-black text-white shadow-sm ${c.score > 80 ? 'bg-green-500' : c.score > 50 ? 'bg-indigo-500' : 'bg-gray-400'}`}>
//                         {c.score}%
//                       </span>
//                     </td>
//                     <td className="px-6 py-3 text-right">
//                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
//                         <button onClick={(e) => handleOpenEdit(c, e)} className="p-2 text-indigo-600 hover:bg-white rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
//                         <button onClick={(e) => handleDelete(c.id, e)} className="p-2 text-red-600 hover:bg-white rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )
//       ) : (
//         <div className="py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
//           <Database className="w-10 h-10 text-gray-200 mx-auto mb-3" />
//           <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Không có dữ liệu</p>
//         </div>
//       )}

//       {total > 0 && (
//         <Pagination
//           currentPage={currentPage}
//           totalPages={totalPages}
//           onPageChange={setCurrentPage}
//           totalItems={total}
//           itemsPerPage={ITEMS_PER_PAGE}
//         />
//       )}

//       {/* ================= SYNC MODAL (IMPORT THẬT) ================= */}
//       {isSyncOpen && (
//         <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
//             {syncStep === 0 ? (
//               <div className="p-10">
//                 <div className="flex justify-between items-start mb-8">
//                   <div className="flex items-center gap-4">
//                     <div
//                       className={`p-4 rounded-2xl text-white shadow-lg ${
//                         syncSource === 'Sheets'
//                           ? 'bg-green-600'
//                           : syncSource === 'Forms'
//                           ? 'bg-purple-600'
//                           : syncSource === 'DriveCsv'
//                           ? 'bg-blue-600'
//                           : 'bg-emerald-600'
//                       }`}
//                     >
//                       {syncSource === 'Sheets' ? (
//                         <FileSpreadsheet className="w-8 h-8" />
//                       ) : syncSource === 'Forms' ? (
//                         <ClipboardList className="w-8 h-8" />
//                       ) : syncSource === 'DriveCsv' ? (
//                         <Link2 className="w-8 h-8" />
//                       ) : (
//                         <FileUp className="w-8 h-8" />
//                       )}
//                     </div>
//                     <div>
//                       <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">Nhập đường dẫn driver (.csv)</h3>
//                       <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">
//                         Sheets: link • Forms: JSON • Excel: upload • DriveCsv: link CSV
//                       </p>
//                     </div>
//                   </div>
//                   <button onClick={closeSyncModal} className="text-gray-300 hover:text-red-500 transition-colors">
//                     <XCircle className="w-8 h-8" />
//                   </button>
//                 </div>

//                 <div className="space-y-6">
//                   {/* ===== SHEETS (LINK) ===== */}
//                   {syncSource === 'Sheets' && (
//                     <div className="space-y-5">
//                       <div className="space-y-2">
//                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                           <Link className="w-3 h-3" /> SheetUrl
//                         </label>
//                         <input
//                           type="url"
//                           value={sheetUrl}
//                           onChange={(e) => setSheetUrl(e.target.value)}
//                           placeholder="https://docs.google.com/spreadsheets/d/..."
//                           className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                         />
//                       </div>

//                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                         <div className="space-y-2">
//                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                             SheetName
//                           </label>
//                           <input
//                             type="text"
//                             value={sheetName}
//                             onChange={(e) => setSheetName(e.target.value)}
//                             placeholder="Sheet1"
//                             className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                           />
//                         </div>

//                         <div className="space-y-2">
//                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
//                             RangeA1
//                           </label>
//                           <input
//                             type="text"
//                             value={rangeA1}
//                             onChange={(e) => setRangeA1(e.target.value)}
//                             placeholder="A1:F1000"
//                             className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* ===== FORMS (RECORDS JSON) ===== */}
//                   {syncSource === 'Forms' && (
//                     <div className="space-y-3">
//                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                         <FileText className="w-3 h-3" /> Records JSON (array)
//                       </label>

//                       <textarea
//                         value={formsRecordsJson}
//                         onChange={(e) => setFormsRecordsJson(e.target.value)}
//                         rows={10}
//                         className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-mono focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                       />
//                       <p className="text-[11px] text-gray-500 font-medium">
//                         Dán JSON theo format: [{`{ fullName, phone, email, tags, metadataJson, sourceRef }`}]
//                       </p>
//                     </div>
//                   )}

//                   {/* ===== DRIVE CSV LINK ===== */}
//                   {syncSource === 'DriveCsv' && (
//                     <div className="space-y-3">
//                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                         <Link2 className="w-3 h-3" /> Google Drive CSV Link (Thông tin khách hàng)
//                       </label>

//                       <input
//                         type="url"
//                         value={driveCsvLink}
//                         onChange={(e) => setDriveCsvLink(e.target.value)}
//                         placeholder="Ví dụ: https://drive.google.com/file/d/FILE_ID/view?usp=sharing"
//                         className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-inner"
//                       />
//                       <p className="text-[11px] text-gray-500 font-medium">
//                         Link phải <b>public/share</b> để server tải được file CSV.
//                       </p>
//                     </div>
//                   )}

//                   {/* ===== EXCEL (FILE) ===== */}
//                   {syncSource === 'Excel' && (
//                     <div className="space-y-3">
//                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
//                         <FileText className="w-3 h-3" /> Tệp dữ liệu Excel/CSV
//                       </label>
//                       <div className="relative group">
//                         <input
//                           type="file"
//                           accept=".xlsx, .xls, .csv"
//                           onChange={(e) => setSyncFile(e.target.files ? e.target.files[0] : null)}
//                           className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
//                         />
//                         <div className={`w-full py-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all ${syncFile ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 group-hover:border-indigo-400'}`}>
//                           <UploadCloud className={`w-10 h-10 mb-3 ${syncFile ? 'text-green-600' : 'text-gray-300'}`} />
//                           {syncFile ? <p className="text-sm font-black text-green-700">{syncFile.name}</p> : <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kéo thả tệp</p>}
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* ===== OPTIONS ===== */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
//                     <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
//                       <input type="checkbox" checked={importUpsert} onChange={(e) => setImportUpsert(e.target.checked)} />
//                       Upsert
//                     </label>

//                     <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
//                       <input type="checkbox" checked={hasHeaderRow} onChange={(e) => setHasHeaderRow(e.target.checked)} />
//                       HasHeaderRow
//                     </label>

//                     {syncSource === 'Forms' && (
//                       <label className="flex items-center gap-2 text-[11px] font-bold text-gray-700 md:col-span-2">
//                         <input
//                           type="checkbox"
//                           checked={skipIfNoPhoneAndEmail}
//                           onChange={(e) => setSkipIfNoPhoneAndEmail(e.target.checked)}
//                         />
//                         SkipIfNoPhoneAndEmail
//                       </label>
//                     )}
//                   </div>

//                   {/* ACTIONS */}
//                   <div className="pt-4 flex gap-4">
//                     <button
//                       onClick={() => setIsSyncOpen(false)}
//                       className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
//                       disabled={importing}
//                     >
//                       Hủy bỏ
//                     </button>

//                     <button
//                       onClick={handleExecuteSync}
//                       className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 disabled:opacity-60"
//                       disabled={importing}
//                     >
//                       <Zap className="w-4 h-4 fill-current" /> {importing ? 'Đang import...' : 'Bắt đầu'}
//                     </button>
//                   </div>

//                   {/* RESULT */}
//                   {importResult && (
//                     <div className="mt-2 text-left bg-gray-50 border border-gray-100 rounded-2xl p-4">
//                       <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kết quả import</div>
//                       <div className="grid grid-cols-2 gap-2 text-sm">
//                         <div><b>Total:</b> {importResult.total}</div>
//                         <div><b>Inserted:</b> {importResult.inserted}</div>
//                         <div><b>Updated:</b> {importResult.updated}</div>
//                         <div><b>Skipped:</b> {importResult.skipped}</div>
//                         <div><b>Errors:</b> {importResult.errors}</div>
//                       </div>
//                       {!!importResult.errorMessages?.length && (
//                         <ul className="mt-2 list-disc pl-5 text-xs text-red-600">
//                           {importResult.errorMessages.slice(0, 5).map((m: string, idx: number) => (
//                             <li key={idx}>{m}</li>
//                           ))}
//                         </ul>
//                       )}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             ) : (
//               <div className="p-12 text-center">
//                 <div className="relative w-24 h-24 mx-auto mb-8">
//                   <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
//                   <div className="relative w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl">
//                     {syncStep === 4 ? <CheckCircle2 className="w-12 h-12" /> : <RefreshCw className="w-12 h-12 animate-spin" />}
//                   </div>
//                 </div>

//                 <h3 className="text-2xl font-black text-gray-900 mb-2">
//                   {syncStep === 1 && `Đang import ${syncSource}...`}
//                   {syncStep === 4 && 'Import hoàn tất!'}
//                 </h3>

//                 <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden my-10 shadow-inner">
//                   <div className="bg-indigo-600 h-full transition-all duration-700 ease-out shadow-lg" style={{ width: `${(Math.min(syncStep, 4) / 4) * 100}%` }}></div>
//                 </div>

//                 {syncStep === 4 && lastImportResult && (
//                   <div className="text-left bg-gray-50 border border-gray-100 rounded-2xl p-4">
//                     <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Kết quả import</div>
//                     <div className="grid grid-cols-2 gap-3 text-sm">
//                       <div><span className="font-black">Total:</span> {lastImportResult.total}</div>
//                       <div><span className="font-black">Inserted:</span> {lastImportResult.inserted}</div>
//                       <div><span className="font-black">Updated:</span> {lastImportResult.updated}</div>
//                       <div><span className="font-black">Skipped:</span> {lastImportResult.skipped}</div>
//                       <div><span className="font-black">Errors:</span> {lastImportResult.errors}</div>
//                     </div>

//                     {lastImportResult.errorMessages?.length > 0 && (
//                       <ul className="mt-3 text-xs text-red-600 list-disc pl-5">
//                         {lastImportResult.errorMessages.map((m, idx) => <li key={idx}>{m}</li>)}
//                       </ul>
//                     )}
//                   </div>
//                 )}

//                 {syncStep === 4 && (
//                   <button onClick={closeSyncModal} className="w-full mt-6 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 transition-transform">
//                     Quay lại
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* --- COMPACT CENTRAL MODAL (POPUP NHỎ GỌN) --- */}
//       {isInsightOpen && (
//         <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-4xl h-full max-h-[85vh] shadow-2xl rounded-[2.5rem] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
//             {/* Header */}
//             <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
//               <div className="flex items-center gap-5">
//                 <div className="relative">
//                   <div className="w-20 h-20 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl border-4 border-white">
//                     {selectedCustomerDetail?.fullName?.[0] || 'N'}
//                   </div>
//                   <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
//                 </div>
//                 <div>
//                   <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedCustomerDetail?.fullName}</h3>
//                   <div className="flex items-center gap-3 mt-1 text-xs font-bold text-slate-400">
//                     <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest border border-indigo-100">IDENTITY VERIFIED</span>
//                     <span className="tabular-nums">{selectedCustomerDetail?.phone}</span>
//                   </div>
//                 </div>
//               </div>
//               <button onClick={() => setIsInsightOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
//                 <XCircle className="w-8 h-8" />
//               </button>
//             </div>

//             {/* Navigation Tabs */}
//             <div className="px-8 py-0.5 bg-white border-b border-slate-50 flex gap-8 overflow-x-auto no-scrollbar">
//               {[
//                 { id: 'profile', label: 'Hồ sơ gốc', icon: Info },
//                 { id: 'conversations', label: 'Hội thoại', icon: MessageSquare },
//                 { id: 'events', label: 'Hoạt động', icon: History },
//                 { id: 'leads', label: 'Cơ hội', icon: Target },
//               ].map(tab => (
//                 <button
//                   key={tab.id}
//                   onClick={() => setActiveDetailTab(tab.id as any)}
//                   className={`flex items-center gap-2 pb-3.5 pt-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${activeDetailTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
//                 >
//                   <tab.icon className="w-4 h-4" />
//                   {tab.label}
//                 </button>
//               ))}
//             </div>

//             {/* Scrollable Content */}
//             <div className="flex-1 overflow-y-auto bg-slate-50/40 p-8 custom-scrollbar">
//               {detailLoading ? (
//                 <div className="h-full flex flex-col items-center justify-center text-indigo-600">
//                   <Loader2 className="w-8 h-8 animate-spin mb-3" />
//                   <p className="text-[11px] font-black uppercase tracking-widest">Đang trích xuất dữ liệu...</p>
//                 </div>
//               ) : selectedCustomerDetail && (
//                 <div className="h-full animate-in fade-in duration-500">
//                   {/* --- TAB 1: PROFILE --- */}
//                   {activeDetailTab === 'profile' && (
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                       <div className="md:col-span-2 bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
//                         <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-50 pb-4">Định danh người dùng</h4>
//                         <div className="grid grid-cols-2 gap-x-8 gap-y-6">
//                           {[
//                             { label: 'Họ tên', value: selectedCustomerDetail.fullName, icon: UserCheck },
//                             { label: 'Số điện thoại', value: selectedCustomerDetail.phone, icon: Smartphone },
//                             { label: 'Email', value: selectedCustomerDetail.email, icon: Mail },
//                             { label: 'Nguồn dữ liệu', value: selectedCustomerDetail.source, icon: Send },
//                             { label: 'Ngày tạo hồ sơ', value: formatDateTime(selectedCustomerDetail.createdAt), icon: Calendar },
//                             { label: 'Cập nhật cuối', value: selectedCustomerDetail.updatedAt || 'N/A', icon: Clock },
//                           ].map((item, i) => (
//                             <div key={i} className="space-y-1">
//                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
//                                 <item.icon className="w-3 h-3" /> {item.label}
//                               </p>
//                               <p className="text-[13px] font-bold text-slate-800 truncate">{(item.value as any) || '-'}</p>
//                             </div>
//                           ))}
//                           <div className="col-span-2 space-y-1">
//                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Địa chỉ</p>
//                             <p className="text-[13px] font-bold text-slate-800 break-words">{selectedCustomerDetail.address || '-'}</p>
//                           </div>
//                         </div>
//                         <div className="pt-4 border-t border-slate-50">
//                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Metadata Analysis</p>
//                           <div className="bg-slate-900 rounded-2xl p-4 overflow-hidden shadow-inner border border-slate-800">
//                             <pre className="text-emerald-400 font-mono text-[10px] leading-relaxed max-h-[150px] overflow-auto custom-scrollbar">
//                               {safeJsonStringify(selectedCustomerDetail.metadataJson)}
//                             </pre>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="space-y-4">
//                         <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-1">Chỉ số quan tâm AI</h4>
//                         {selectedCustomerDetail.interests.map((interest, idx) => (
//                           <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-rose-100 transition-all">
//                             <div className="flex justify-between items-center mb-3">
//                               <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
//                               <span className="text-[11px] font-black text-slate-900">{interest.level}/100</span>
//                             </div>
//                             <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
//                               <div className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full" style={{ width: `${Math.min(100, interest.level)}%` }}></div>
//                             </div>
//                             <p className="text-[10px] font-bold text-slate-500 italic leading-relaxed">"{interest.note || ''}"</p>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* --- TAB 2: CONVERSATIONS --- */}
//                   {activeDetailTab === 'conversations' && (
//                     <div className="h-[450px] flex gap-6">
//                       <div className="w-[280px] overflow-y-auto space-y-3 pr-2 custom-scrollbar border-r border-slate-100">
//                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 sticky top-0 bg-white/10 backdrop-blur-sm">Lịch sử hội thoại</p>
//                         {selectedCustomerDetail.conversations.map(conv => (
//                           <div
//                             key={conv.id}
//                             onClick={() => setSelectedConvId(conv.id)}
//                             className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedConvId === conv.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-50 hover:border-indigo-100 shadow-sm'}`}
//                           >
//                             <div className="flex justify-between items-start mb-2">
//                               <div className="flex items-center gap-2">
//                                 <ChannelIcon name={conv.channel || ''} className={`w-4 h-4 ${selectedConvId === conv.id ? 'text-white' : ''}`} />
//                                 <span className="text-[10px] font-black uppercase tracking-widest">{conv.channel}</span>
//                               </div>
//                               <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${conv.status === 'Closed' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-400 text-white'}`}>{conv.status}</span>
//                             </div>
//                             <p className={`text-[9px] font-bold truncate opacity-70 ${selectedConvId === conv.id ? 'text-indigo-100' : 'text-slate-400'}`}>Ngày tạo: {formatDateTime(conv.startedAt)}</p>
//                           </div>
//                         ))}
//                       </div>

//                       <div className="flex-1 bg-white rounded-3xl border border-slate-100 flex flex-col overflow-hidden shadow-inner">
//                         <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/20 custom-scrollbar">
//                           {selectedCustomerDetail.messages
//                             .filter(m => m.conversationId === selectedConvId)
//                             .map(msg => (
//                               <div key={msg.id} className={`flex ${msg.senderType === 'Customer' ? 'justify-end' : 'justify-start'}`}>
//                                 <div className="flex flex-col max-w-[85%]">
//                                   <div className={`p-4 rounded-2xl text-[13px] font-semibold leading-relaxed shadow-sm ${msg.senderType === 'Customer' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
//                                     {msg.content}
//                                   </div>
//                                   <p className={`mt-1.5 text-[9px] font-black text-slate-300 uppercase tracking-widest ${msg.senderType === 'Customer' ? 'text-right' : ''}`}>
//                                     {msg.senderType === 'Agent' ? 'Hệ thống' : 'Khách hàng'} • {msg.createdAt?.split(' ')?.[1] || ''}
//                                   </p>
//                                 </div>
//                               </div>
//                             ))}
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* --- TAB 3: EVENTS --- */}
//                   {activeDetailTab === 'events' && (
//                     <div className="h-[480px] flex gap-8">
//                       <div className="w-[320px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
//                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 sticky top-0 bg-white/10 backdrop-blur-sm">Dòng thời gian sự kiện</p>
//                         <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
//                           {selectedCustomerDetail.events.map((ev) => (
//                             <div
//                               key={ev.id}
//                               onClick={() => setSelectedEventId(ev.id)}
//                               className={`relative group cursor-pointer transition-all ${selectedEventId === ev.id ? 'scale-[1.02]' : ''}`}
//                             >
//                               <div className={`absolute -left-[33px] top-2 w-4 h-4 rounded-full border-2 border-white shadow-sm transition-all ${selectedEventId === ev.id ? 'bg-indigo-600 scale-125' : 'bg-slate-200 group-hover:bg-indigo-300'}`}></div>
//                               <div className={`p-4 rounded-2xl border-2 transition-all ${selectedEventId === ev.id ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-transparent hover:border-slate-100'}`}>
//                                 <div className="flex items-center gap-3 mb-1">
//                                   <ChannelIcon name={ev.channel} className="w-3.5 h-3.5" />
//                                   <h5 className="text-[11px] font-black text-slate-900 uppercase tracking-tight truncate">{ev.eventType}</h5>
//                                 </div>
//                                 <p className="text-[10px] font-bold text-slate-400 tabular-nums">Thời gian: {formatDateTime(ev.eventTime)}</p>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </div>

//                       <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-xl flex flex-col overflow-hidden ring-1 ring-slate-200/50">
//                         {currentSelectedEvent ? (
//                           <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
//                             <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
//                               <div className="flex items-center gap-4">
//                                 <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
//                                   <Zap className="w-6 h-6" />
//                                 </div>
//                                 <div>
//                                   <h6 className="text-sm font-black text-slate-900 uppercase tracking-widest">Sự kiện: {currentSelectedEvent.eventType}</h6>
//                                   <p className="text-[10px] font-bold text-indigo-500 uppercase">Kênh: {currentSelectedEvent.channel}</p>
//                                 </div>
//                               </div>
//                               <div className="text-right">
//                                 <p className="text-[9px] font-bold text-slate-400">{formatDateTime(currentSelectedEvent.eventTime)}</p>
//                               </div>
//                             </div>

//                             <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
//                               <div className="grid grid-cols-2 gap-6">
//                                 <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
//                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Phân loại</p>
//                                   <p className="text-xs font-bold text-slate-800">{currentSelectedEvent.eventType}</p>
//                                 </div>
//                                 <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
//                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Smartphone className="w-3 h-3" /> Giao thức</p>
//                                   <p className="text-xs font-bold text-slate-800">{currentSelectedEvent.channel}</p>
//                                 </div>
//                               </div>

//                               <div className="space-y-4">
//                                 <h6 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
//                                   <Code className="w-4 h-4 text-indigo-500" /> Cấu trúc Payload (JSON)
//                                 </h6>
//                                 <div className="bg-slate-950 rounded-[1.5rem] p-6 shadow-2xl relative group overflow-hidden">
//                                   <pre className="text-emerald-400 font-mono text-[12px] leading-relaxed custom-scrollbar max-h-[220px] overflow-auto">
//                                     {safeJsonStringify(currentSelectedEvent.payloadJson)}
//                                   </pre>
//                                 </div>
//                               </div>

//                               <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-4">
//                                 <div className="mt-1"><Info className="w-4 h-4 text-indigo-400" /></div>
//                                 <div className="space-y-1">
//                                   <p className="text-[10px] font-black text-indigo-900 uppercase">Ghi chú AI</p>
//                                   <p className="text-[11px] font-bold text-indigo-700 leading-relaxed italic">
//                                     Hành động "{currentSelectedEvent.eventType}" được ghi nhận tự động từ hệ thống tracking thời gian thực.
//                                   </p>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         ) : (
//                           <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-4">
//                             <Eye className="w-16 h-16 opacity-20" />
//                             <p className="text-[11px] font-black uppercase tracking-widest">Chọn một sự kiện để kiểm tra chi tiết</p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   )}

//                   {/* --- TAB 4: LEADS --- */}
//                   {activeDetailTab === 'leads' && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                       {selectedCustomerDetail.leads.map(lead => (
//                         <div key={lead.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-100 transition-all group overflow-hidden relative">
//                           <div className={`absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 opacity-30`}></div>
//                           <div className="relative z-10 flex flex-col h-full">
//                             <div className="flex justify-between items-start mb-6">
//                               <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${lead.stage === 'Won' ? 'bg-emerald-500 text-white' : 'bg-slate-950 text-white'}`}>
//                                 {lead.stage}
//                               </span>
//                               <div className="text-right">
//                                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">AI Score</p>
//                                 <span className="text-3xl font-black text-slate-900 tabular-nums">{lead.score}%</span>
//                               </div>
//                             </div>
//                             <div className="space-y-4">
//                               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
//                                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
//                                   <Briefcase className="w-5 h-5" />
//                                 </div>
//                                 <div className="min-w-0">
//                                   <p className="text-[13px] font-black text-slate-800 truncate leading-tight">{lead.projectName || 'N/A'}</p>
//                                   <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Căn hộ: {lead.unitName || 'NONE'}</p>
//                                 </div>
//                               </div>
//                               <div className="flex items-center justify-between pt-4 border-t border-slate-50">
//                                 <div className="flex items-center gap-1.5 text-slate-400">
//                                   <Clock className="w-3.5 h-3.5" />
//                                   <span className="text-[10px] font-black uppercase tracking-widest">{formatDateTime(lead.createdAt)}</span>
//                                 </div>
//                                 <SourceBadge source={lead.source} />
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Footer */}
//             <div className="px-8 py-6 border-t bg-slate-50 flex items-center justify-between">
//               <div className="flex gap-3">
//                 <button className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
//                   <Smartphone className="w-3.5 h-3.5" /> Kết nối
//                 </button>
//                 <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
//                   <Calendar className="w-3.5 h-3.5" /> Lịch hẹn
//                 </button>
//               </div>
//               <div className="flex gap-2">
//                 <button onClick={() => setIsInsightOpen(false)} className="px-6 py-2.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Đóng</button>
//                 <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">Biên tập</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ✅ ADD/EDIT MODAL */}
//       {isFormOpen && (
//         <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-300">
//           <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white animate-in zoom-in-95 duration-300">
//             <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
//               <div className="flex items-center gap-4">
//                 <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
//                   <UserPlus className="w-6 h-6" />
//                 </div>
//                 <div>
//                   <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none">
//                     {formMode === 'add' ? 'Thêm khách hàng' : 'Chỉnh sửa khách hàng'}
//                   </h3>
//                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">
//                     {formMode === 'add' ? 'Tạo bản ghi mới' : `ID: ${formCustomer.id}`}
//                   </p>
//                 </div>
//               </div>

//               <button
//                 onClick={() => setIsFormOpen(false)}
//                 className="p-2 hover:bg-red-50 rounded-full group transition-all"
//               >
//                 <XCircle className="w-8 h-8 text-gray-300 group-hover:text-red-500" />
//               </button>
//             </div>

//             <form onSubmit={handleSaveCustomer} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Họ và tên
//                   </label>
//                   <input
//                     required
//                     value={formCustomer.fullName}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, fullName: e.target.value }))}
//                     placeholder="Nguyễn Văn A"
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Số điện thoại
//                   </label>
//                   <input
//                     value={formCustomer.phone}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, phone: e.target.value }))}
//                     placeholder="090..."
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Email
//                   </label>
//                   <input
//                     type="email"
//                     value={formCustomer.email}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, email: e.target.value }))}
//                     placeholder="abc@gmail.com"
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                     Nguồn (Source)
//                   </label>
//                   <select
//                     value={formCustomer.source}
//                     onChange={(e) => setFormCustomer((s) => ({ ...s, source: e.target.value }))}
//                     className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                   >
//                     {['Facebook', 'Zalo', 'Google Sheets', 'Google Forms', 'Excel', 'Drive CSV', 'Tiktok', 'Other'].map((s) => (
//                       <option key={s} value={s}>{s}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
//                   Tags
//                 </label>
//                 <input
//                   value={formCustomer.tags}
//                   onChange={(e) => setFormCustomer((s) => ({ ...s, tags: e.target.value }))}
//                   placeholder="vip, nhà phố, quận 7..."
//                   className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
//                 />
//               </div>

//               <div className="pt-6 flex gap-4">
//                 <button
//                   type="button"
//                   onClick={() => setIsFormOpen(false)}
//                   className="flex-1 py-4 border border-gray-200 text-gray-500 font-black rounded-2xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px]"
//                 >
//                   Hủy bỏ
//                 </button>
//                 <button
//                   type="submit"
//                   className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
//                 >
//                   <CheckCircle2 className="w-4 h-4" />
//                   {formMode === 'add' ? 'Tạo mới' : 'Lưu thay đổi'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CDP;
