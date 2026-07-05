import React, { useState } from 'react';
import {
  Megaphone, LayoutDashboard, FileText, Target, Share2, Workflow, BarChart3,
  Bot, Radar, CalendarDays, UserSquare, Filter
} from 'lucide-react';
import MarketingFunnel from './MarketingFunnel';
import Marketing from './Marketing';
import QuangCaoDaKenh from './QuangCaoDaKenh';
import ContentFactory from './ContentFactory';
import VideoFactory from './VideoFactory';
import ImageFactory from './ImageFactory';
import AutomationHub from './AutomationHub';
import MarketingROI from './MarketingROI';
import AgencyDashboard from './AgencyDashboard';
import CommunityInbox from './CommunityInbox';
import WebTracking from './WebTracking';
import ContentCalendar from './ContentCalendar';
import SalePersonalize from './SalePersonalize';

type Sec = 'overview' | 'content' | 'persona' | 'funnel' | 'calendar' | 'ads' | 'channels' | 'community' | 'tracking' | 'automation' | 'roi';
const SECTIONS: { id: Sec; label: string; icon: any }[] = [
  { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'funnel', label: 'Phễu Marketing', icon: Filter },
  { id: 'content', label: 'Sản xuất nội dung', icon: FileText },
  { id: 'calendar', label: 'Lịch nội dung', icon: CalendarDays },
  { id: 'ads', label: 'Quảng cáo', icon: Target },
  { id: 'channels', label: 'Kênh (FB/Zalo)', icon: Share2 },
  { id: 'community', label: 'Trực inbox', icon: Bot },
  { id: 'tracking', label: 'Nguồn khách nét', icon: Radar },
  { id: 'automation', label: 'Tự động hoá', icon: Workflow },
  { id: 'roi', label: 'Báo cáo ROI', icon: BarChart3 },
];
const MarketingOS: React.FC = () => {
  const [sec, setSec] = useState<Sec>('overview');
  const [contentTab, setContentTab] = useState<'general' | 'persona'>('general');
  const openSec = (s: string) => {
    if (s === 'persona') { setSec('content'); setContentTab('persona'); }
    else setSec(s as Sec);
  };
  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-fuchsia-600 flex items-center justify-center text-white shadow-lg"><Megaphone className="w-6 h-6" /></div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 leading-none">Marketing</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Content · Quảng cáo · Đa kênh · Tự động hoá AI cho sàn BĐS</p>
        </div>
      </header>

      <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {SECTIONS.map(s => {
          const active = sec === s.id; const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setSec(s.id)} className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-sm whitespace-nowrap transition ${active ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Icon className="w-4 h-4" />{s.label}
            </button>
          );
        })}
      </div>

      <div className="animate-in fade-in duration-300">
        {sec === 'overview' && <AgencyDashboard onOpen={openSec} />}
        {sec === 'funnel' && <MarketingFunnel />}
        {sec === 'ads' && <QuangCaoDaKenh />}
        {sec === 'channels' && <Marketing />}
        {sec === 'community' && <CommunityInbox />}
        {(sec === 'content' || sec === 'persona') && (
          <div className="space-y-5">
            <div className="flex gap-1.5 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm w-fit">
              <button onClick={() => setContentTab('general')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition ${contentTab === 'general' ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
                <FileText className="w-4 h-4" /> Nội dung & Video
              </button>
              <button onClick={() => setContentTab('persona')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm transition ${contentTab === 'persona' ? 'bg-fuchsia-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>
                <UserSquare className="w-4 h-4" /> Cá nhân hoá theo Sale
              </button>
            </div>
            {contentTab === 'general' ? (
              <div className="space-y-5"><ContentFactory /><ImageFactory /><VideoFactory /></div>
            ) : (
              <SalePersonalize />
            )}
          </div>
        )}
        {sec === 'calendar' && <ContentCalendar />}
        {sec === 'tracking' && <WebTracking />}
        {sec === 'automation' && <AutomationHub />}
        {sec === 'roi' && <MarketingROI />}
      </div>
    </div>
  );
};

export default MarketingOS;
