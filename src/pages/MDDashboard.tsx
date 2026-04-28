import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import DashboardLayout from '@/components/DashboardLayout';
import DateRangeFilter from '@/components/DateRangeFilter';
import MeetingDetailDialog from '@/components/MeetingDetailDialog';
import { Meeting } from '@/types/crm';
import {
  LayoutDashboard,
  Users,
  Calendar,
  TrendingUp,
  AlertTriangle,
  IndianRupee,
  FileBarChart2,
  CheckCircle2,
  Clock,
  UserCheck,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import * as XLSX from 'xlsx';

// ─── Colour helpers ───────────────────────────────────────────────────────────
const GOLD = '#C8951A';
const GOLD_LIGHT = '#E8B84B';
const GOLD_BG = '#FDF8EE';
const GOLD_BG2 = '#FAF1D9';
const DARK = '#1A1506';
const GREEN = '#2D6A4F';
const GREEN_BG = '#E8F5EE';
const RED = '#C0392B';
const RED_BG = '#FDECEA';
const BLUE = '#1A4A8A';
const BLUE_BG = '#EAF0FB';

// Role display labels
const ROLE_LABELS: Record<string, string> = {
  FM: 'Floor Manager', TC: 'Team Captain', BDM: 'Business Dev Manager',
  BO: 'Business Officer', BDO: 'Business Dev Officer', FO: 'Field Officer',
  RM: 'Relationship Manager', MD: 'Managing Director',
};

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  FM: { bg: '#FDF2E0', text: '#8A5C10' },
  TC: { bg: '#E8F0FB', text: '#1A4A8A' },
  BDM: { bg: '#EAF5EE', text: '#2D6A4F' },
  BO: { bg: '#F0EAF8', text: '#6A2D8A' },
  BDO: { bg: '#F5E8FB', text: '#8A2D6A' },
  FO: { bg: '#FBE8E8', text: '#8A2D2D' },
  RM: { bg: '#E8F5F8', text: '#1A6A7A' },
};

// ─── Nav items for MD ─────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'team', label: 'Team Activity', icon: <Users className="w-4 h-4" /> },
  { id: 'pipeline', label: 'Lead Pipeline', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'meetings', label: 'Meetings', icon: <Calendar className="w-4 h-4" /> },
  { id: 'alerts', label: 'Alerts', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'reports', label: 'MIS Reports', icon: <FileBarChart2 className="w-4 h-4" /> },
];

// ─── Tiny sub-components ──────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, trend, trendUp, color = GOLD, onClick,
}: {
  label: string; value: string | number; sub?: string;
  trend?: string; trendUp?: boolean; color?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left w-full rounded-2xl bg-white border border-amber-100 p-5 relative overflow-hidden
                 hover:shadow-md transition-all duration-200 group"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700/70 mb-2">{label}</p>
      <p className="font-display text-3xl font-semibold text-stone-800 leading-none mb-2">{value}</p>
      {sub && <p className="text-xs text-stone-400">{sub}</p>}
      {trend && (
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-2"
          style={{ background: trendUp ? GREEN_BG : RED_BG, color: trendUp ? GREEN : RED }}
        >
          {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend}
        </span>
      )}
      <ChevronRight className="w-4 h-4 text-amber-300 absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="font-display text-lg font-semibold text-stone-800">{title}</h2>
        {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const c = ROLE_COLORS[role] || { bg: '#F0F0F0', text: '#555' };
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: c.bg, color: c.text }}>{role}</span>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    'Converted': { bg: GREEN_BG, text: GREEN },
    'Converted by BDM': { bg: GREEN_BG, text: GREEN },
    'Follow-up': { bg: GOLD_BG2, text: '#8A5C10' },
    'Walk-in Done': { bg: BLUE_BG, text: BLUE },
    'Pending': { bg: '#F5F5F5', text: '#666' },
    'Invalid': { bg: RED_BG, text: RED },
    'Connected': { bg: GREEN_BG, text: GREEN },
    'Not Connected': { bg: RED_BG, text: RED },
  };
  const c = map[status] || { bg: '#F5F5F5', text: '#777' };
  return (
    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

// ─── Gold divider ─────────────────────────────────────────────────────────────
const Divider = () => (
  <div className="h-px my-6" style={{ background: `linear-gradient(90deg, ${GOLD_BG}, transparent)` }} />
);

// ─── Bar chart (pure CSS) ─────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { label: string; leads: number; converted: number }[] }) {
  const max = Math.max(...data.map(d => d.leads), 1);
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex flex-col justify-end" style={{ height: '88px' }}>
            <div className="w-full rounded-t-sm" style={{ height: `${(d.leads / max) * 88}px`, background: GOLD, opacity: 0.45 }} />
            <div className="w-full rounded-t-sm -mt-1" style={{ height: `${(d.converted / max) * 88}px`, background: GREEN }} />
          </div>
          <span className="text-[10px] text-stone-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function MDDashboard() {
  const { leads, users, teams, meetings, currentUser, logout } = useCRM();

  const [activeTab, setActiveTab] = useState('overview');
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);

  // ── Date filter helper ──────────────────────────────────────────────────────
  const inRange = (dateStr: string) => {
    const d = new Date(dateStr);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  };

  const filteredLeads = useMemo(() => leads.filter(l => !fromDate && !toDate ? true : inRange(l.assignedDate)), [leads, fromDate, toDate]);
  const filteredMeetings = useMemo(() => meetings.filter(m => !fromDate && !toDate ? true : inRange(m.date)), [meetings, fromDate, toDate]);

  // ── KPI computations ───────────────────────────────────────────────────────
  const activeUsers = users.filter(u => u.active && u.role !== 'MD');
  const totalLeads = filteredLeads.length;
  const convertedLeads = filteredMeetings.filter(m => m.bdoStatus === 'Converted by BDM' || m.bdoStatus === 'Converted').length;
  const pendingMeetings = filteredMeetings.filter(m => m.status === 'Pending').length;
  const followUpCount = filteredMeetings.filter(m => m.bdoStatus === 'Follow-up').length;
  const walkInDoneCount = filteredMeetings.filter(m => m.bdoStatus === 'Walk-in Done' || m.walkingStatus === 'Walking Done').length;
  const invalidCount = filteredMeetings.filter(m => m.walkingStatus === 'Invalid').length;
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0';

  // Loan amount totals
  // const totalLoanReq = filteredLeads.reduce((sum, l) => sum + (l.requiredAmount || 0), 0);
const totalLoanReq = filteredLeads.reduce((sum, l) => sum + (parseFloat(l.requiredAmount || '0') || 0), 0);
  // ── Per-role breakdown ─────────────────────────────────────────────────────
  const roleBreakdown = useMemo(() => {
    const roles = ['FM', 'TC', 'BDM', 'BO', 'BDO', 'FO', 'RM'];
    return roles.map(role => ({
      role,
      count: users.filter(u => u.role === role && u.active).length,
    })).filter(r => r.count > 0);
  }, [users]);

  // ── Per-team performance ───────────────────────────────────────────────────
  const teamPerf = useMemo(() => teams.map(team => {
    const boLeads = filteredLeads.filter(l => team.boIds.includes(l.assignedBOId));
    const boMeets = filteredMeetings.filter(m => team.boIds.includes(m.boId));
    const converted = boMeets.filter(m => m.bdoStatus === 'Converted by BDM' || m.bdoStatus === 'Converted').length;
    const tc = users.find(u => u.id === team.tcId);
    return { name: team.name, tc: tc?.name || '—', leads: boLeads.length, meetings: boMeets.length, converted };
  }), [teams, filteredLeads, filteredMeetings, users]);

  // ── Monthly chart data (last 6 months) ────────────────────────────────────
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { month: d.getMonth(), year: d.getFullYear(), label: d.toLocaleString('default', { month: 'short' }) };
    });
    return months.map(({ month, year, label }) => ({
      label,
      leads: leads.filter(l => { const d = new Date(l.assignedDate); return d.getMonth() === month && d.getFullYear() === year; }).length,
      converted: meetings.filter(m => {
        const d = new Date(m.date);
        return d.getMonth() === month && d.getFullYear() === year && (m.bdoStatus === 'Converted by BDM' || m.bdoStatus === 'Converted');
      }).length,
    }));
  }, [leads, meetings]);

  // ── BDM-wise leads ─────────────────────────────────────────────────────────
  const bdmData = useMemo(() => {
    const bdms = users.filter(u => u.role === 'BDM' && u.active);
    return bdms.map(bdm => {
      const bdmMeetings = filteredMeetings.filter(m => m.bdmId === bdm.id);
      const converted = bdmMeetings.filter(m => m.bdoStatus === 'Converted by BDM' || m.bdoStatus === 'Converted').length;
      const followUp = bdmMeetings.filter(m => m.bdoStatus === 'Follow-up').length;
      const pending = bdmMeetings.filter(m => m.status === 'Pending').length;
      return { name: bdm.name, total: bdmMeetings.length, converted, followUp, pending };
    }).sort((a, b) => b.converted - a.converted);
  }, [users, filteredMeetings]);

  // ── Alerts ─────────────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const list: { type: 'warning' | 'info' | 'error'; msg: string }[] = [];
    if (invalidCount > 0) list.push({ type: 'error', msg: `${invalidCount} walk-ins marked Invalid — review required` });
    if (pendingMeetings > 10) list.push({ type: 'warning', msg: `${pendingMeetings} meetings still Pending — BDMs need to follow up` });
    const tcPerf = teams.filter(t => {
      const tMeets = filteredMeetings.filter(m => teams.find(tm => tm.id === t.id)?.boIds.includes(m.boId));
      return tMeets.length > 0 && tMeets.filter(m => m.bdoStatus?.includes('Converted')).length / tMeets.length < 0.2;
    });
    if (tcPerf.length > 0) list.push({ type: 'warning', msg: `${tcPerf.length} teams have conversion rate below 20%` });
    if (followUpCount > 15) list.push({ type: 'info', msg: `${followUpCount} leads in Follow-up stage — schedule walk-ins` });
    if (list.length === 0) list.push({ type: 'info', msg: 'All clear — no urgent issues at this time' });
    return list;
  }, [invalidCount, pendingMeetings, followUpCount, filteredMeetings, teams]);

  // ── Excel export ───────────────────────────────────────────────────────────
  // const exportReport = () => {
  //   const wb = XLSX.utils.book_new();
  //   // Leads sheet
  //   const leadsData = filteredLeads.map(l => ({
  //     'Client': l.clientName, 'Phone': l.phoneNumber,
  //     'Loan Req (₹)': l.loanRequirement,
  //     'Assigned BO': users.find(u => u.id === l.assignedBOId)?.name || l.assignedBOId,
  //     'Number Status': l.numberStatus || '—', 'Lead Status': l.leadStatus || '—',
  //     'Date': l.assignedDate,
  //   }));
  //   XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leadsData), 'Leads');
  //   // Meetings sheet
  //   const meetData = filteredMeetings.map(m => ({
  //     'Date': m.date, 'Time': m.timeSlot, 'Client': m.clientName,
  //     'Product': m.productType || '—', 'Meeting Type': m.meetingType || '—',
  //     'BDM': users.find(u => u.id === m.bdmId)?.name || '—',
  //     'BO': users.find(u => u.id === m.boId)?.name || '—',
  //     'Status': m.status, 'BDO Status': m.bdoStatus || '—',
  //   }));
  //   XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meetData), 'Meetings');
  //   // Team performance
  //   XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teamPerf), 'Team Performance');
  //   XLSX.writeFile(wb, `MD_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  // };


  const exportReport = () => {
    const wb = XLSX.utils.book_new();

    // Leads sheet
    const leadsData = filteredLeads.map(l => ({
      'Client': l.clientName, 'Phone': l.phoneNumber,
      'Loan Req (₹)': l.loanRequirement,
      'Assigned BO': users.find(u => u.id === l.assignedBOId)?.name || l.assignedBOId,
      'Number Status': l.numberStatus || '—', 'Lead Status': l.leadStatus || '—',
      'Date': l.assignedDate,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leadsData), 'Leads');

    // Meetings sheet
    const meetData = filteredMeetings.map(m => {
      const lead = leads.find(l => l.id === m.leadId); // ← lead dhundo
      return {
        'Date': m.date, 'Time': m.timeSlot,
        'Client': lead?.clientName || '—',           // ← m.clientName → lead?.clientName
        'Product': lead?.requirementType || '—',     // ← m.productType → lead?.requirementType
        'Meeting Type': m.meetingType || '—',
        'BDM': users.find(u => u.id === m.bdmId)?.name || '—',
        'BO': users.find(u => u.id === m.boId)?.name || '—',
        'Status': m.status, 'BDO Status': m.bdoStatus || '—',
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meetData), 'Meetings');

    // Team performance
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teamPerf), 'Team Performance');
    XLSX.writeFile(wb, `MD_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };



  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout navItems={NAV_ITEMS} activeTab={activeTab} onTabChange={setActiveTab}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold text-stone-800 tracking-tight">
              MD Command Center
            </h1>
            <p className="text-sm text-stone-400 mt-0.5">
              Grow Lotus Fintech — real-time company overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={exportReport}
              className="border-amber-200 text-amber-800 hover:bg-amber-50 gap-2">
              <Download className="w-4 h-4" /> Export MIS
            </Button>
            <div className="text-right">
              <p className="text-xs font-semibold text-stone-700">{currentUser?.name}</p>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider">Managing Director</p>
            </div>
          </div>
        </div>

        {/* Date range filter */}
        <div className="mt-3 flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-600" />
          <DateRangeFilter
            fromDate={fromDate} toDate={toDate}
            onFromChange={setFromDate} onToChange={setToDate}
            onClear={() => { setFromDate(undefined); setToDate(undefined); }}
          />
          {(fromDate || toDate) && (
            <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              Showing filtered data
            </span>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">

          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard
              label="Total Staff Active"
              value={activeUsers.length}
              sub={`across ${Object.keys(ROLE_LABELS).length - 1} roles`}
              trend="Live" trendUp={true} color={GOLD}
              onClick={() => setActiveTab('team')}
            />
            <KpiCard
              label="Leads (Period)"
              value={totalLeads}
              sub={`₹${(totalLoanReq).toFixed(2)} total requirement`}
              trend={`${conversionRate}% converted`} trendUp={parseFloat(conversionRate) > 20}
              color={GREEN}
              onClick={() => setActiveTab('pipeline')}
            />
            <KpiCard
              label="Meetings Scheduled"
              value={filteredMeetings.length}
              sub={`${pendingMeetings} pending · ${followUpCount} follow-up`}
              trend={`${walkInDoneCount} walk-ins done`} trendUp={walkInDoneCount > 0}
              color={BLUE}
              onClick={() => setActiveTab('meetings')}
            />
            <KpiCard
              label="Conversions"
              value={convertedLeads}
              sub={`${invalidCount} invalid walk-ins`}
              trend={invalidCount > 0 ? `${invalidCount} need review` : 'On track'}
              trendUp={invalidCount === 0}
              color={invalidCount > 0 ? RED : GREEN}
              onClick={() => setActiveTab('alerts')}
            />
          </div>

          {/* Chart + Team breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Monthly chart */}
            <div className="bg-white border border-amber-100 rounded-2xl p-5">
              <SectionHeader title="Monthly Performance" sub="Leads vs Conversions — last 6 months" />
              <div className="flex gap-4 mb-3">
                <span className="flex items-center gap-1.5 text-xs text-stone-500">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: GOLD, opacity: 0.45 }} />Leads
                </span>
                <span className="flex items-center gap-1.5 text-xs text-stone-500">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: GREEN }} />Converted
                </span>
              </div>
              <MiniBarChart data={monthlyData} />
            </div>

            {/* Role breakdown */}
            <div className="bg-white border border-amber-100 rounded-2xl p-5">
              <SectionHeader title="Staff by Role" sub="Active headcount breakdown" />
              <div className="space-y-3">
                {roleBreakdown.map(r => (
                  <div key={r.role} className="flex items-center gap-3">
                    <RoleBadge role={r.role} />
                    <div className="flex-1 bg-amber-50 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{
                        width: `${Math.min((r.count / activeUsers.length) * 100, 100)}%`,
                        background: GOLD_LIGHT,
                      }} />
                    </div>
                    <span className="text-sm font-semibold text-stone-700 min-w-[20px] text-right">{r.count}</span>
                    <span className="text-xs text-stone-400 min-w-[80px]">{ROLE_LABELS[r.role]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Meeting funnel */}
          <div className="bg-white border border-amber-100 rounded-2xl p-5">
            <SectionHeader title="Meeting Funnel" sub="Full lifecycle snapshot for selected period" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Meetings', val: filteredMeetings.length, color: BLUE },
                { label: 'Pending', val: pendingMeetings, color: '#888' },
                { label: 'Follow-up', val: followUpCount, color: GOLD },
                { label: 'Walk-in Done', val: walkInDoneCount, color: BLUE },
                { label: 'Converted', val: convertedLeads, color: GREEN },
              ].map(item => (
                <div key={item.label} className="text-center p-4 rounded-xl border"
                  style={{ borderColor: item.color + '33', background: item.color + '0A' }}>
                  <p className="text-2xl font-display font-semibold" style={{ color: item.color }}>{item.val}</p>
                  <p className="text-xs text-stone-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: TEAM ACTIVITY
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'team' && (
        <div className="space-y-6 animate-fade-in">

          {/* All staff table */}
          <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-amber-50">
              <SectionHeader title="All Staff — Live Roster" sub={`${activeUsers.length} active members`} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50/60">
                    {['Name', 'Role', 'Team', 'Leads Handled', 'Meetings', 'Conversions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-amber-700/70">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeUsers.filter(u => u.role !== 'MD').map((user, i) => {
                    const userMeetings = filteredMeetings.filter(m => m.boId === user.id || m.bdmId === user.id || m.tcId === user.id);
                    const userConverted = userMeetings.filter(m => m.bdoStatus?.includes('Converted')).length;
                    const userLeads = filteredLeads.filter(l => l.assignedBOId === user.id).length;
                    const team = teams.find(t => t.boIds.includes(user.id) || t.tcId === user.id);
                    return (
                      <tr key={user.id}
                        className={`border-t border-amber-50 hover:bg-amber-50/40 transition-colors ${i % 2 === 0 ? '' : 'bg-stone-50/30'}`}>
                        <td className="px-4 py-3 font-medium text-stone-800">{user.name}</td>
                        <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                        <td className="px-4 py-3 text-stone-500">{team?.name || '—'}</td>
                        <td className="px-4 py-3 font-semibold">{userLeads > 0 ? userLeads : '—'}</td>
                        <td className="px-4 py-3">{userMeetings.length}</td>
                        <td className="px-4 py-3">
                          {userConverted > 0
                            ? <span className="font-semibold" style={{ color: GREEN }}>{userConverted}</span>
                            : <span className="text-stone-300">0</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Team performance table */}
          <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-amber-50">
              <SectionHeader title="Team Performance" sub="Per-team lead & conversion summary" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50/60">
                    {['Team', 'Team Captain', 'Leads', 'Meetings', 'Converted', 'Conv. Rate'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-amber-700/70">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teamPerf.map((t, i) => {
                    const rate = t.meetings > 0 ? ((t.converted / t.meetings) * 100).toFixed(0) : '0';
                    const rateNum = parseInt(rate);
                    return (
                      <tr key={i} className="border-t border-amber-50 hover:bg-amber-50/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-stone-800">{t.name}</td>
                        <td className="px-4 py-3 text-stone-500">{t.tc}</td>
                        <td className="px-4 py-3">{t.leads}</td>
                        <td className="px-4 py-3">{t.meetings}</td>
                        <td className="px-4 py-3 font-semibold" style={{ color: GREEN }}>{t.converted}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-amber-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(rateNum, 100)}%`, background: rateNum >= 30 ? GREEN : rateNum >= 15 ? GOLD : RED }} />
                            </div>
                            <span className="text-xs font-semibold min-w-[32px]"
                              style={{ color: rateNum >= 30 ? GREEN : rateNum >= 15 ? '#8A5C10' : RED }}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {teamPerf.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-stone-400">No team data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: LEAD PIPELINE
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6 animate-fade-in">

          {/* BDM performance */}
          <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-amber-50">
              <SectionHeader title="BDM-wise Performance" sub="Meetings scheduled & converted per BDM" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-50/60">
                    {['BDM Name', 'Total Meetings', 'Converted', 'Follow-up', 'Pending'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-amber-700/70">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bdmData.map((b, i) => (
                    <tr key={i} className="border-t border-amber-50 hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-stone-800">{b.name}</td>
                      <td className="px-4 py-3">{b.total}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: GREEN }}>{b.converted}</td>
                      <td className="px-4 py-3" style={{ color: '#8A5C10' }}>{b.followUp}</td>
                      <td className="px-4 py-3 text-stone-400">{b.pending}</td>
                    </tr>
                  ))}
                  {bdmData.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">No BDM data</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* All leads table */}
          <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-amber-50">
              <SectionHeader
                title="All Leads"
                sub={`${filteredLeads.length} leads in selected period`}
                action={
                  <Button variant="outline" size="sm" className="border-amber-200 text-amber-700 hover:bg-amber-50 gap-1" onClick={exportReport}>
                    <Download className="w-3.5 h-3.5" /> Export
                  </Button>
                }
              />
            </div>
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="bg-amber-50/60">
                    {['Client', 'Phone', 'Loan Req', 'Assigned BO', 'Number Status', 'Lead Status', 'Type', 'Date'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-amber-700/70">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.slice(0, 200).map((lead, i) => {
                    const bo = users.find(u => u.id === lead.assignedBOId);
                    return (
                      <tr key={lead.id} className={`border-t border-amber-50 hover:bg-amber-50/40 transition-colors ${i % 2 === 0 ? '' : 'bg-stone-50/20'}`}>
                        <td className="px-4 py-3 font-medium text-stone-800">{lead.clientName}</td>
                        <td className="px-4 py-3 text-stone-500">{lead.phoneNumber}</td>
                        <td className="px-4 py-3 font-semibold text-stone-700">₹{(lead.loanRequirement || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-stone-500">{bo?.name || '—'}</td>
                        <td className="px-4 py-3">{lead.numberStatus ? <StatusPill status={lead.numberStatus} /> : <span className="text-stone-300">—</span>}</td>
                        <td className="px-4 py-3">{lead.leadStatus ? <StatusPill status={lead.leadStatus} /> : <span className="text-stone-300">—</span>}</td>
                        <td className="px-4 py-3 text-stone-400 text-xs">{lead.leadType || '—'}</td>
                        <td className="px-4 py-3 text-stone-400 text-xs">{lead.assignedDate}</td>
                      </tr>
                    );
                  })}
                  {filteredLeads.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-stone-400">No leads in selected period</td></tr>
                  )}
                </tbody>
              </table>
              {filteredLeads.length > 200 && (
                <div className="px-4 py-3 text-xs text-amber-700 bg-amber-50 border-t border-amber-100">
                  Showing first 200 of {filteredLeads.length} leads. Export to view all.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: MEETINGS
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'meetings' && (
        <div className="space-y-6 animate-fade-in">

          {/* Status mini cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total', val: filteredMeetings.length, color: BLUE },
              { label: 'Follow-up', val: followUpCount, color: '#8A5C10' },
              { label: 'Walk-in Done', val: walkInDoneCount, color: BLUE },
              { label: 'Converted', val: convertedLeads, color: GREEN },
            ].map(item => (
              <div key={item.label} className="bg-white border border-amber-100 rounded-2xl p-4 text-center"
                style={{ borderTop: `3px solid ${item.color}` }}>
                <p className="text-2xl font-display font-semibold" style={{ color: item.color }}>{item.val}</p>
                <p className="text-xs text-stone-400 mt-1">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Meetings table */}
          <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-amber-50">
              <SectionHeader title="All Meetings" sub={`${filteredMeetings.length} meetings in selected period`} />
            </div>
            <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="bg-amber-50/60">
                    {['Date', 'Time', 'Client', 'Product', 'Type', 'BDM', 'BO', 'Status', 'BDO Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-amber-700/70">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredMeetings.slice(0, 300).map((m, i) => {
                    const lead = leads.find(l => l.id === m.leadId);
                    const bdm = users.find(u => u.id === m.bdmId);
                    const bo = users.find(u => u.id === m.boId);
                    return (
                      <tr key={m.id}
                        onClick={() => { setSelectedMeeting(m); setMeetingDialogOpen(true); }}
                        className={`border-t border-amber-50 hover:bg-amber-50/60 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-stone-50/20'}`}>
                        <td className="px-4 py-3 text-stone-500 text-xs">{m.date}</td>
                        <td className="px-4 py-3 text-stone-500 text-xs">{m.timeSlot}</td>
                        <td className="px-4 py-3 font-medium text-stone-800">{lead?.clientName || lead?.clientName || '—'}</td>
                        <td className="px-4 py-3 text-stone-400 text-xs">{lead?.requirementType || '—'}</td>
                        <td className="px-4 py-3 text-stone-400 text-xs">{m.meetingType || '—'}</td>
                        <td className="px-4 py-3 text-stone-500">{bdm?.name || '—'}</td>
                        <td className="px-4 py-3 text-stone-500">{bo?.name || '—'}</td>
                        <td className="px-4 py-3"><StatusPill status={m.status} /></td>
                        <td className="px-4 py-3">{m.bdoStatus ? <StatusPill status={m.bdoStatus} /> : <span className="text-stone-300">—</span>}</td>
                      </tr>
                    );
                  })}
                  {filteredMeetings.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-stone-400">No meetings in selected period</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredMeetings.length > 300 && (
              <div className="px-4 py-3 text-xs text-amber-700 bg-amber-50 border-t border-amber-100">
                Showing first 300 of {filteredMeetings.length} meetings. Export for complete data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: ALERTS
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'alerts' && (
        <div className="space-y-4 animate-fade-in">
          <SectionHeader title="Alerts & Attention Areas" sub="System-generated flags based on current data" />

          {alerts.map((a, i) => {
            const cfg = {
              error: { bg: RED_BG, text: RED, icon: '⚠️', label: 'Action Required' },
              warning: { bg: GOLD_BG2, text: '#8A5C10', icon: '⚡', label: 'Attention Needed' },
              info: { bg: BLUE_BG, text: BLUE, icon: 'ℹ️', label: 'FYI' },
            }[a.type];
            return (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border"
                style={{ background: cfg.bg, borderColor: cfg.text + '22' }}>
                <span className="text-xl mt-0.5">{cfg.icon}</span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.text }}>{cfg.label}</span>
                  <p className="text-sm text-stone-700 mt-0.5">{a.msg}</p>
                </div>
              </div>
            );
          })}

          <Divider />

          {/* Invalid walk-ins list */}
          {invalidCount > 0 && (
            <div className="bg-white border border-red-100 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-red-50">
                <SectionHeader title="Invalid Walk-ins" sub="These leads need reassessment or follow-up" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-red-50/40">
                      {['Client', 'Date', 'BDM', 'BO', 'Meeting Type'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-red-700/60">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeetings.filter(m => m.walkingStatus === 'Invalid').map(m => {
                      const lead = leads.find(l => l.id === m.leadId);
                      const bdm = users.find(u => u.id === m.bdmId);
                      const bo = users.find(u => u.id === m.boId);
                      return (
                        <tr key={m.id}
                          onClick={() => { setSelectedMeeting(m); setMeetingDialogOpen(true); }}
                          className="border-t border-red-50 hover:bg-red-50/40 cursor-pointer">
                          <td className="px-4 py-3 font-medium text-stone-800">{lead?.clientName || lead?.clientName || '—'}</td>
                          <td className="px-4 py-3 text-stone-500 text-xs">{m.date}</td>
                          <td className="px-4 py-3 text-stone-500">{bdm?.name || '—'}</td>
                          <td className="px-4 py-3 text-stone-500">{bo?.name || '—'}</td>
                          <td className="px-4 py-3 text-stone-400 text-xs">{m.meetingType || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          TAB: MIS REPORTS
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fade-in">
          <SectionHeader title="MIS Reports" sub="Export detailed reports for any period" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Full Lead Report', desc: 'All leads with BO, status, loan amount', icon: <TrendingUp className="w-5 h-5" /> },
              { title: 'Meeting Report', desc: 'All meetings with BDM, BO, TC, status', icon: <Calendar className="w-5 h-5" /> },
              { title: 'Team Performance', desc: 'Per-team conversion and lead stats', icon: <Users className="w-5 h-5" /> },
            ].map((r, i) => (
              <div key={i} className="bg-white border border-amber-100 rounded-2xl p-5 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center"
                  style={{ background: GOLD_BG2, color: GOLD }}>
                  {r.icon}
                </div>
                <h3 className="font-semibold text-stone-800 mb-1">{r.title}</h3>
                <p className="text-xs text-stone-400 mb-4">{r.desc}</p>
                <Button size="sm" variant="outline" onClick={exportReport}
                  className="border-amber-200 text-amber-700 hover:bg-amber-50 gap-2 w-full">
                  <Download className="w-3.5 h-3.5" /> Download Excel
                </Button>
              </div>
            ))}
          </div>

          <Divider />

          {/* Summary numbers */}
          <div className="bg-white border border-amber-100 rounded-2xl p-5">
            <SectionHeader title="Period Summary" sub="Key numbers for selected date range" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Leads', val: totalLeads, icon: <TrendingUp className="w-4 h-4" /> },
                { label: 'Total Meetings', val: filteredMeetings.length, icon: <Calendar className="w-4 h-4" /> },
                { label: 'Conversions', val: convertedLeads, icon: <CheckCircle2 className="w-4 h-4" /> },
                { label: 'Pending Meetings', val: pendingMeetings, icon: <Clock className="w-4 h-4" /> },
                { label: 'Follow-ups', val: followUpCount, icon: <UserCheck className="w-4 h-4" /> },
                { label: 'Walk-ins Done', val: walkInDoneCount, icon: <CheckCircle2 className="w-4 h-4" /> },
                { label: 'Invalid Walk-ins', val: invalidCount, icon: <AlertTriangle className="w-4 h-4" /> },
                { label: 'Loan Req (₹L)', val: (totalLoanReq / 100000).toFixed(1), icon: <IndianRupee className="w-4 h-4" /> },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50/50">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: GOLD_BG2, color: GOLD }}>{item.icon}</div>
                  <div>
                    <p className="text-lg font-display font-semibold text-stone-800">{item.val}</p>
                    <p className="text-[10px] text-stone-400">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Meeting detail dialog (read-only for MD) */}
      <MeetingDetailDialog
        meeting={selectedMeeting}
        isOpen={meetingDialogOpen}
        onClose={() => { setMeetingDialogOpen(false); setSelectedMeeting(null); }}
      />

    </DashboardLayout>
  );
}