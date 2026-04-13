// ─────────────────────────────────────────────────────────────────────────────
// FMReport.tsx — Report Tab for FM Dashboard
// Import and add as a tab inside FMDashboard_updated.tsx
//
// HOW TO INTEGRATE:
//   1. Import at top of FMDashboard_updated.tsx:
//        import FMReport from './FMReport';
//   2. Add nav item:
//        { id: 'report', label: 'Reports', icon: I.report }
//   3. Add tab content:
//        {activeTab === 'report' && <FMReport users={users} leads={leads} meetings={meetings} meetingRequests={meetingRequests} teams={teams} />}
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportProps {
  users: any[];
  leads: any[];
  meetings: any[];
  meetingRequests: any[];
  teams: any[];
}

type Period = 'daily' | 'weekly' | 'monthly' | 'custom';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDateRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  if (period === 'daily') return { from: fmt(today), to: fmt(today) };
  if (period === 'weekly') {
    const mon = new Date(today); mon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    return { from: fmt(mon), to: fmt(today) };
  }
  if (period === 'monthly') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: fmt(first), to: fmt(today) };
  }
  return { from: customFrom, to: customTo };
}

function pct(num: number, den: number) {
  return den === 0 ? '0%' : `${Math.round((num / den) * 100)}%`;
}

function Num({ v, color }: { v: number; color?: string }) {
  return <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: color || 'var(--rpt-text)' }}>{v}</span>;
}

function PctBadge({ num, den, good = 50 }: { num: number; den: number; good?: number }) {
  const val = den === 0 ? 0 : Math.round((num / den) * 100);
  const color = val >= good ? 'var(--rpt-success)' : val >= good / 2 ? 'var(--rpt-warning)' : 'var(--rpt-danger)';
  return <span style={{ fontSize: '10px', fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", background: `${color}18`, padding: '1px 6px', borderRadius: '4px', border: `1px solid ${color}33` }}>{val}%</span>;
}

function SectionHead({ title, sub, badge }: { title: string; sub?: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--rpt-border)', background: 'var(--rpt-surface)' }}>
      <div>
        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--rpt-text)' }}>{title}</div>
        {sub && <div style={{ fontSize: '10px', color: 'var(--rpt-text3)', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>{sub}</div>}
      </div>
      {badge && <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', background: 'rgba(6,182,212,0.1)', color: 'var(--rpt-teal)', border: '1px solid rgba(6,182,212,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>{badge}</span>}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function FMReport({ users, leads, meetings, meetingRequests, teams }: ReportProps) {
  const [period, setPeriod] = useState<Period>('monthly');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [activeSection, setActiveSection] = useState<string>('org');

  const today = new Date().toISOString().split('T')[0];
  const { from, to } = getDateRange(period, customFrom, customTo);

  // ─── Filtered data ──────────────────────────────────────────────────────────
  const fLeads = useMemo(() => leads.filter((l: any) => l.assignedDate >= from && l.assignedDate <= to), [leads, from, to]);
  const fMeetings = useMemo(() => meetings.filter((m: any) => m.date >= from && m.date <= to), [meetings, from, to]);
  const fRequests = useMemo(() => meetingRequests.filter((r: any) => r.createdAt >= from && r.createdAt <= to), [meetingRequests, from, to]);

  const bos  = users.filter((u: any) => u.role === 'BO'  && u.active);
  const tcs  = users.filter((u: any) => u.role === 'TC'  && u.active);
  const bdms = users.filter((u: any) => u.role === 'BDM' && u.active);
  const bdos = users.filter((u: any) => u.role === 'BDO' && u.active);

  // ─── ORG KPIs ───────────────────────────────────────────────────────────────
  const orgStats = useMemo(() => {
    const totalLeads    = fLeads.length;
    const connected     = fLeads.filter((l: any) => l.numberStatus === 'Connected').length;
    const notConn       = fLeads.filter((l: any) => l.numberStatus === 'Not Connected').length;
    const mobileOff     = fLeads.filter((l: any) => l.numberStatus === 'Mobile Off').length;
    const incoming      = fLeads.filter((l: any) => l.numberStatus === 'Incoming Barred').length;
    const invalid       = fLeads.filter((l: any) => l.numberStatus === 'Invalid Number').length;
    const interested    = fLeads.filter((l: any) => l.leadStatus === 'Interested').length;
    const notInterested = fLeads.filter((l: any) => l.leadStatus === 'Not Interested').length;
    const eligible      = fLeads.filter((l: any) => l.leadStatus === 'Eligible').length;
    const notEligible   = fLeads.filter((l: any) => l.leadStatus === 'Not Eligible').length;
    const pending       = fLeads.filter((l: any) => l.leadStatus === 'Pending').length;
    const langBarrier   = fLeads.filter((l: any) => l.leadStatus === 'Language Barrier').length;
    const totalMtgs     = fMeetings.length;
    const scheduled     = fMeetings.filter((m: any) => m.status === 'Scheduled').length;
    const done          = fMeetings.filter((m: any) => m.status === 'Meeting Done' || m.status === 'Converted').length;
    const converted     = fMeetings.filter((m: any) => m.status === 'Converted').length;
    const notDone       = fMeetings.filter((m: any) => m.status === 'Not Done').length;
    const reschedule    = fMeetings.filter((m: any) => m.status === 'Reschedule Requested').length;
    const followUp      = fMeetings.filter((m: any) => m.status === 'Follow-Up').length;
    const reqTotal      = fRequests.length;
    const reqApproved   = fRequests.filter((r: any) => r.status === 'Approved').length;
    const reqRejected   = fRequests.filter((r: any) => r.status === 'Rejected').length;
    const reqPending    = fRequests.filter((r: any) => r.status === 'Pending').length;
    const walkin        = fMeetings.filter((m: any) => m.meetingType === 'Walk-in').length;
    const miniLogin     = fMeetings.filter((m: any) => m.miniLogin).length;
    const fullLogin     = fMeetings.filter((m: any) => m.fullLogin).length;
    const totalCalls    = leads.reduce((s: number, l: any) => s + (l.callCount || 0), 0);
    const hotLeads      = fLeads.filter((l: any) => l.priority === 'Hot').length;
    const overdueFollowups = leads.filter((l: any) => l.followUpDate && l.followUpDate < today).length;
    return { totalLeads, connected, notConn, mobileOff, incoming, invalid, interested, notInterested, eligible, notEligible, pending, langBarrier, totalMtgs, scheduled, done, converted, notDone, reschedule, followUp, reqTotal, reqApproved, reqRejected, reqPending, walkin, miniLogin, fullLogin, totalCalls, hotLeads, overdueFollowups };
  }, [fLeads, fMeetings, fRequests, leads, today]);

  // ─── BO Stats (with meeting/walkin/login from boId) ─────────────────────────
  const boStats = useMemo(() => bos.map((bo: any) => {
    const boLeads     = fLeads.filter((l: any) => l.assignedBOId === bo.id);
    const boMeetings  = fMeetings.filter((m: any) => m.boId === bo.id); // meetings linked to this BO
    const boRequests  = fRequests.filter((r: any) => r.boId === bo.id);
    const connected   = boLeads.filter((l: any) => l.numberStatus === 'Connected').length;
    const notConn     = boLeads.filter((l: any) => l.numberStatus === 'Not Connected').length;
    const mobileOff   = boLeads.filter((l: any) => l.numberStatus === 'Mobile Off').length;
    const interested  = boLeads.filter((l: any) => l.leadStatus === 'Interested').length;
    const eligible    = boLeads.filter((l: any) => l.leadStatus === 'Eligible').length;
    const hot         = boLeads.filter((l: any) => l.priority === 'Hot').length;
    const warm        = boLeads.filter((l: any) => l.priority === 'Warm').length;
    const cold        = boLeads.filter((l: any) => l.priority === 'Cold').length;
    const totalCalls  = boLeads.reduce((s: number, l: any) => s + (l.callCount || 0), 0);
    const notCalled   = boLeads.filter((l: any) => !l.callCount || l.callCount === 0).length;
    const overdueFollowups = boLeads.filter((l: any) => l.followUpDate && l.followUpDate < today).length;
    // Meeting metrics (linked via boId in meetings table)
    const meetings_total  = boMeetings.length;
    const meetings_done   = boMeetings.filter((m: any) => m.status === 'Meeting Done' || m.status === 'Converted').length;
    const meetings_conv   = boMeetings.filter((m: any) => m.status === 'Converted').length;
    const meetings_notDone = boMeetings.filter((m: any) => m.status === 'Not Done').length;
    const meetings_reschedule = boMeetings.filter((m: any) => m.status === 'Reschedule Requested').length;
    // Walk-in (BO ke lead ki meeting jisme walk-in hua)
    const walkin_total    = boMeetings.filter((m: any) => m.meetingType === 'Walk-in').length;
    const walkin_done     = boMeetings.filter((m: any) => m.meetingType === 'Walk-in' && (m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up')).length;
    // Login (BO ke lead ki meeting mein login hua)
    const mini_login      = boMeetings.filter((m: any) => m.miniLogin).length;
    const full_login      = boMeetings.filter((m: any) => m.fullLogin).length;
    // BDO outcomes on BO's leads
    const bdo_converted   = boMeetings.filter((m: any) => m.bdoStatus === 'Converted by BDM').length;
    const walking_done    = boMeetings.filter((m: any) => m.walkingStatus === 'Walking Done').length;
    // Requests
    const req_sent        = boRequests.length;
    const req_approved    = boRequests.filter((r: any) => r.status === 'Approved').length;
    const req_rejected    = boRequests.filter((r: any) => r.status === 'Rejected').length;
    const team = teams.find((t: any) => t.boIds.includes(bo.id));
    const tc = team ? users.find((u: any) => u.id === team.tcId) : null;
    return {
      id: bo.id, name: bo.name, tcName: tc?.name || '—',
      leads: boLeads.length, connected, notConn, mobileOff, interested, eligible,
      hot, warm, cold, totalCalls, notCalled, overdueFollowups,
      meetings_total, meetings_done, meetings_conv, meetings_notDone, meetings_reschedule,
      walkin_total, walkin_done, mini_login, full_login,
      bdo_converted, walking_done,
      req_sent, req_approved, req_rejected,
    };
  }).sort((a: any, b: any) => b.meetings_conv - a.meetings_conv), [bos, fLeads, fMeetings, fRequests, teams, users, today]);

  // ─── TC Stats ───────────────────────────────────────────────────────────────
  const tcStats = useMemo(() => tcs.map((tc: any) => {
    const team = teams.find((t: any) => t.tcId === tc.id);
    const boIds = team?.boIds || [];
    const tcLeads = fLeads.filter((l: any) => boIds.includes(l.assignedBOId));
    const tcMeetings = fMeetings.filter((m: any) => m.tcId === tc.id);
    const tcRequests = fRequests.filter((r: any) => r.tcId === tc.id);
    const req_pending  = tcRequests.filter((r: any) => r.status === 'Pending').length;
    const req_approved = tcRequests.filter((r: any) => r.status === 'Approved').length;
    const req_rejected = tcRequests.filter((r: any) => r.status === 'Rejected').length;
    const mtg_scheduled  = tcMeetings.filter((m: any) => m.status === 'Scheduled').length;
    const mtg_done       = tcMeetings.filter((m: any) => m.status === 'Meeting Done' || m.status === 'Converted').length;
    const mtg_conv       = tcMeetings.filter((m: any) => m.status === 'Converted').length;
    const mtg_reschedule = tcMeetings.filter((m: any) => m.status === 'Reschedule Requested').length;
    const walkin         = tcMeetings.filter((m: any) => m.meetingType === 'Walk-in').length;
    const mini_login     = tcMeetings.filter((m: any) => m.miniLogin).length;
    return {
      id: tc.id, name: tc.name, teamName: team?.name || '—',
      boCount: boIds.length, leads: tcLeads.length,
      req_total: tcRequests.length, req_pending, req_approved, req_rejected,
      mtg_total: tcMeetings.length, mtg_scheduled, mtg_done, mtg_conv, mtg_reschedule,
      walkin, mini_login,
    };
  }), [tcs, fLeads, fMeetings, fRequests, teams]);

  // ─── BDM Stats ──────────────────────────────────────────────────────────────
  const bdmStats = useMemo(() => bdms.map((bdm: any) => {
    const bdmMtgs = fMeetings.filter((m: any) => m.bdmId === bdm.id);
    const done       = bdmMtgs.filter((m: any) => m.status === 'Meeting Done' || m.status === 'Converted').length;
    const conv       = bdmMtgs.filter((m: any) => m.status === 'Converted').length;
    const notDone    = bdmMtgs.filter((m: any) => m.status === 'Not Done').length;
    const pending    = bdmMtgs.filter((m: any) => m.status === 'Pending' || m.status === 'Scheduled').length;
    const reschedule = bdmMtgs.filter((m: any) => m.status === 'Reschedule Requested').length;
    const walkin     = bdmMtgs.filter((m: any) => m.meetingType === 'Walk-in').length;
    const walkin_done = bdmMtgs.filter((m: any) => m.meetingType === 'Walk-in' && (m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up')).length;
    const mini       = bdmMtgs.filter((m: any) => m.miniLogin).length;
    const full       = bdmMtgs.filter((m: any) => m.fullLogin).length;
    // Product breakdown
    const productMap: Record<string, number> = {};
    bdmMtgs.forEach((m: any) => { if (m.productType) productMap[m.productType] = (productMap[m.productType] || 0) + 1; });
    const topProduct = Object.entries(productMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    return {
      id: bdm.id, name: bdm.name,
      total: bdmMtgs.length, done, conv, notDone, pending, reschedule,
      walkin, walkin_done, mini, full, topProduct,
    };
  }).sort((a: any, b: any) => b.conv - a.conv), [bdms, fMeetings]);

  // ─── BDO Stats ──────────────────────────────────────────────────────────────
  const bdoStats = useMemo(() => bdos.map((bdo: any) => {
    const doneMtgs   = fMeetings.filter((m: any) => m.bdoId === bdo.id);
    const pending    = doneMtgs.filter((m: any) => !m.bdoStatus || m.bdoStatus === '').length;
    const conv_bdm   = doneMtgs.filter((m: any) => m.bdoStatus === 'Converted by BDM').length;
    const followup   = doneMtgs.filter((m: any) => m.bdoStatus === 'Follow-up').length;
    const walking    = doneMtgs.filter((m: any) => m.walkingStatus === 'Walking Done').length;
    const invalid    = doneMtgs.filter((m: any) => m.walkingStatus === 'Invalid').length;
    const mini       = doneMtgs.filter((m: any) => m.miniLogin).length;
    const full       = doneMtgs.filter((m: any) => m.fullLogin).length;
    return { id: bdo.id, name: bdo.name, total: doneMtgs.length, pending, conv_bdm, followup, walking, invalid, mini, full };
  }), [bdos, fMeetings]);

  // ─── Flags ──────────────────────────────────────────────────────────────────
  const flags = useMemo(() => {
    const f: { type: string; msg: string; severity: 'red' | 'yellow' }[] = [];
    boStats.forEach((bo: any) => {
      if (bo.leads > 0 && bo.totalCalls === 0) f.push({ type: 'BO', msg: `${bo.name} — 0 calls logged in this period`, severity: 'red' });
      if (bo.overdueFollowups > 0) f.push({ type: 'BO', msg: `${bo.name} — ${bo.overdueFollowups} overdue follow-up(s)`, severity: 'red' });
      if (bo.hot > 0 && bo.req_sent === 0) f.push({ type: 'BO', msg: `${bo.name} — ${bo.hot} Hot leads but no meeting request sent`, severity: 'yellow' });
    });
    tcStats.forEach((tc: any) => {
      if (tc.req_pending > 0) f.push({ type: 'TC', msg: `${tc.name} — ${tc.req_pending} meeting request(s) still pending`, severity: 'yellow' });
    });
    bdmStats.forEach((bdm: any) => {
      if (bdm.total > 0 && bdm.conv === 0) f.push({ type: 'BDM', msg: `${bdm.name} — 0 conversions in this period`, severity: 'yellow' });
      if (bdm.reschedule > 0 && bdm.done === 0) f.push({ type: 'BDM', msg: `${bdm.name} — only reschedules, no meetings done`, severity: 'red' });
    });
    return f;
  }, [boStats, tcStats, bdmStats]);

  // ─── Excel Export ────────────────────────────────────────────────────────────
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const periodLabel = period === 'custom' ? `${from}_to_${to}` : period;

    // Sheet 1: Org Summary
    const orgRows = [
      ['Metric', 'Value'],
      ['Period', `${from} to ${to}`],
      ['Total Leads', orgStats.totalLeads],
      ['Connected', orgStats.connected],
      ['Not Connected', orgStats.notConn],
      ['Mobile Off', orgStats.mobileOff],
      ['Incoming Barred', orgStats.incoming],
      ['Invalid Number', orgStats.invalid],
      ['Interested', orgStats.interested],
      ['Not Interested', orgStats.notInterested],
      ['Eligible', orgStats.eligible],
      ['Not Eligible', orgStats.notEligible],
      ['Pending', orgStats.pending],
      ['Language Barrier', orgStats.langBarrier],
      ['Total Meetings', orgStats.totalMtgs],
      ['Scheduled', orgStats.scheduled],
      ['Meeting Done', orgStats.done],
      ['Converted', orgStats.converted],
      ['Not Done', orgStats.notDone],
      ['Reschedule Requested', orgStats.reschedule],
      ['Follow-Up', orgStats.followUp],
      ['Walk-in', orgStats.walkin],
      ['Mini Login', orgStats.miniLogin],
      ['Full Login', orgStats.fullLogin],
      ['Total Calls Logged', orgStats.totalCalls],
      ['Hot Leads', orgStats.hotLeads],
      ['Overdue Follow-ups', orgStats.overdueFollowups],
      ['Requests Sent', orgStats.reqTotal],
      ['Requests Approved', orgStats.reqApproved],
      ['Requests Rejected', orgStats.reqRejected],
      ['Requests Pending', orgStats.reqPending],
      ['Connect Rate', `${orgStats.totalLeads ? Math.round((orgStats.connected / orgStats.totalLeads) * 100) : 0}%`],
      ['Lead-to-Meeting Rate', `${orgStats.totalLeads ? Math.round((orgStats.totalMtgs / orgStats.totalLeads) * 100) : 0}%`],
      ['Meeting-to-Conversion Rate', `${orgStats.totalMtgs ? Math.round((orgStats.converted / orgStats.totalMtgs) * 100) : 0}%`],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(orgRows), 'Org Summary');

    // Sheet 2: BO Performance
    const boHeader = ['BO Name', 'TC', 'Leads', 'Connected', 'Not Conn.', 'Mobile Off', 'Interested', 'Eligible', 'Hot', 'Warm', 'Cold', 'Total Calls', 'Not Called', 'Overdue F/U', 'Mtg Total', 'Mtg Done', 'Converted', 'Not Done', 'Reschedule', 'Walk-in Total', 'Walk-in Done', 'Mini Login', 'Full Login', 'BDO Conv.', 'Walking Done', 'Req Sent', 'Req Approved', 'Req Rejected', 'Connect%', 'Conv%'];
    const boRows = boStats.map((bo: any) => [
      bo.name, bo.tcName, bo.leads, bo.connected, bo.notConn, bo.mobileOff, bo.interested, bo.eligible,
      bo.hot, bo.warm, bo.cold, bo.totalCalls, bo.notCalled, bo.overdueFollowups,
      bo.meetings_total, bo.meetings_done, bo.meetings_conv, bo.meetings_notDone, bo.meetings_reschedule,
      bo.walkin_total, bo.walkin_done, bo.mini_login, bo.full_login, bo.bdo_converted, bo.walking_done,
      bo.req_sent, bo.req_approved, bo.req_rejected,
      bo.leads ? `${Math.round((bo.connected / bo.leads) * 100)}%` : '0%',
      bo.meetings_total ? `${Math.round((bo.meetings_conv / bo.meetings_total) * 100)}%` : '0%',
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([boHeader, ...boRows]), 'BO Performance');

    // Sheet 3: TC Performance
    const tcHeader = ['TC Name', 'Team', 'BOs', 'Leads', 'Req Total', 'Approved', 'Rejected', 'Pending', 'Mtg Total', 'Scheduled', 'Done', 'Converted', 'Reschedule', 'Walk-in', 'Mini Login', 'Approval%', 'Conv%'];
    const tcRows = tcStats.map((tc: any) => [
      tc.name, tc.teamName, tc.boCount, tc.leads,
      tc.req_total, tc.req_approved, tc.req_rejected, tc.req_pending,
      tc.mtg_total, tc.mtg_scheduled, tc.mtg_done, tc.mtg_conv, tc.mtg_reschedule,
      tc.walkin, tc.mini_login,
      tc.req_total ? `${Math.round((tc.req_approved / tc.req_total) * 100)}%` : '0%',
      tc.mtg_total ? `${Math.round((tc.mtg_conv / tc.mtg_total) * 100)}%` : '0%',
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([tcHeader, ...tcRows]), 'TC Performance');

    // Sheet 4: BDM Performance
    const bdmHeader = ['BDM Name', 'Total Mtgs', 'Done', 'Converted', 'Not Done', 'Pending', 'Reschedule', 'Walk-in', 'Walk-in Done', 'Mini Login', 'Full Login', 'Top Product', 'Walk-in%', 'Conv%'];
    const bdmRows = bdmStats.map((bdm: any) => [
      bdm.name, bdm.total, bdm.done, bdm.conv, bdm.notDone, bdm.pending, bdm.reschedule,
      bdm.walkin, bdm.walkin_done, bdm.mini, bdm.full, bdm.topProduct,
      bdm.total ? `${Math.round((bdm.walkin / bdm.total) * 100)}%` : '0%',
      bdm.total ? `${Math.round((bdm.conv / bdm.total) * 100)}%` : '0%',
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([bdmHeader, ...bdmRows]), 'BDM Performance');

    // Sheet 5: BDO Performance
    const bdoHeader = ['BDO Name', 'Assigned', 'Pending', 'Conv. by BDM', 'Follow-up', 'Walking Done', 'Walking Invalid', 'Mini Login', 'Full Login'];
    const bdoRows = bdoStats.map((bdo: any) => [bdo.name, bdo.total, bdo.pending, bdo.conv_bdm, bdo.followup, bdo.walking, bdo.invalid, bdo.mini, bdo.full]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([bdoHeader, ...bdoRows]), 'BDO Performance');

    // Sheet 6: Flags
    const flagHeader = ['Role', 'Alert Message', 'Severity'];
    const flagRows = flags.map((f: any) => [f.type, f.msg, f.severity === 'red' ? 'Critical' : 'Warning']);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([flagHeader, ...flagRows]), 'Flags & Alerts');

    XLSX.writeFile(wb, `CRM_Report_${periodLabel}_${today}.xlsx`);
  };

  // ─── Section definitions ─────────────────────────────────────────────────────
  const sections = [
    { id: 'org',  label: 'Org Summary' },
    { id: 'bo',   label: 'BO Performance' },
    { id: 'tc',   label: 'TC Performance' },
    { id: 'bdm',  label: 'BDM Performance' },
    { id: 'bdo',  label: 'BDO Performance' },
    { id: 'flags', label: 'Flags & Alerts' },
  ];

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .rpt-root { font-family: 'Inter', -apple-system, sans-serif; }
        .rpt-root { --rpt-text: var(--text, #e8eaf6); --rpt-text2: var(--text2, #8892b0); --rpt-text3: var(--text3, #4a5568); --rpt-surface: var(--surface, #161929); --rpt-surface2: var(--surface2, #1c2038); --rpt-bg3: var(--bg3, #12152a); --rpt-border: var(--border, rgba(255,255,255,0.06)); --rpt-accent: var(--accent, #3d7fff); --rpt-success: var(--success, #00d4aa); --rpt-warning: var(--warning, #f59e0b); --rpt-danger: var(--danger, #ff4757); --rpt-purple: var(--purple, #a78bfa); --rpt-teal: var(--teal, #06b6d4); }
        .rpt-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
        .rpt-periods { display: flex; gap: 4px; }
        .rpt-period { padding: 6px 14px; border-radius: 8px; border: 1px solid var(--rpt-border); cursor: pointer; font-size: 11px; font-weight: 600; color: var(--rpt-text2); background: var(--rpt-surface); transition: all 0.15s; font-family: 'JetBrains Mono', monospace; }
        .rpt-period.active { border-color: var(--rpt-teal); color: var(--rpt-teal); background: rgba(6,182,212,0.08); }
        .rpt-export { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 8px; background: var(--rpt-teal); color: #fff; font-size: 11px; font-weight: 700; cursor: pointer; border: none; font-family: inherit; transition: opacity 0.15s; }
        .rpt-export:hover { opacity: 0.87; }
        .rpt-custom { display: flex; gap: 7px; align-items: center; }
        .rpt-date { background: var(--rpt-surface); border: 1px solid var(--rpt-border); border-radius: 7px; padding: 5px 9px; color: var(--rpt-text); font-size: 11px; font-family: 'JetBrains Mono', monospace; outline: none; }
        .rpt-date:focus { border-color: var(--rpt-teal); }
        .rpt-label { font-size: 9px; color: var(--rpt-text3); font-family: 'JetBrains Mono', monospace; }
        .rpt-section-nav { display: flex; gap: 4px; margin-bottom: 16px; flex-wrap: wrap; }
        .rpt-sec-btn { padding: 5px 12px; border-radius: 7px; border: 1px solid var(--rpt-border); cursor: pointer; font-size: 11px; font-weight: 600; color: var(--rpt-text2); background: var(--rpt-surface); transition: all 0.15s; }
        .rpt-sec-btn:hover { background: var(--rpt-surface2); color: var(--rpt-text); }
        .rpt-sec-btn.active { border-color: var(--rpt-accent); color: var(--rpt-accent); background: rgba(61,127,255,0.08); }
        .rpt-card { background: var(--rpt-surface); border: 1px solid var(--rpt-border); border-radius: 13px; overflow: hidden; margin-bottom: 14px; }
        .rpt-kpi-row { display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 10px; margin-bottom: 14px; }
        .rpt-kpi { background: var(--rpt-surface); border: 1px solid var(--rpt-border); border-radius: 10px; padding: 12px 12px; }
        .rpt-kpi-label { font-size: 9px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--rpt-text2); font-family: 'JetBrains Mono', monospace; margin-bottom: 6px; }
        .rpt-kpi-val { font-size: 26px; font-weight: 800; line-height: 1; margin-bottom: 3px; }
        .rpt-kpi-sub { font-size: 9px; color: var(--rpt-text3); font-family: 'JetBrains Mono', monospace; }
        .rpt-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .rpt-table th { padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: var(--rpt-text3); font-family: 'JetBrains Mono', monospace; border-bottom: 1px solid var(--rpt-border); white-space: nowrap; }
        .rpt-table td { padding: 9px 10px; border-bottom: 1px solid var(--rpt-border); color: var(--rpt-text2); vertical-align: middle; white-space: nowrap; }
        .rpt-table tr:last-child td { border-bottom: none; }
        .rpt-table tbody tr:hover { background: rgba(255,255,255,0.02); }
        .rpt-table td.pri { color: var(--rpt-text); font-weight: 600; }
        .rpt-table .rank { font-size: 10px; font-weight: 700; color: var(--rpt-text3); font-family: 'JetBrains Mono', monospace; width: 24px; }
        .rpt-empty { text-align: center; color: var(--rpt-text3); padding: 20px; font-size: 10px; font-family: 'JetBrains Mono', monospace; }
        .rpt-two-col { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 12px; margin-bottom: 14px; }
        .rpt-three-col { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 12px; margin-bottom: 14px; }
        .rpt-sub-section { margin-bottom: 10px; }
        .rpt-sub-label { font-size: 9px; font-weight: 600; letter-spacing: 2px; color: var(--rpt-text3); text-transform: uppercase; font-family: 'JetBrains Mono', monospace; padding: 8px 12px; border-bottom: 1px solid var(--rpt-border); background: var(--rpt-bg3); }
        .flag-item { display: flex; align-items: flex-start; gap: 10px; padding: 9px 12px; border-bottom: 1px solid var(--rpt-border); }
        .flag-dot-red { width: 7px; height: 7px; border-radius: 50%; background: var(--rpt-danger); flex-shrink: 0; margin-top: 3px; }
        .flag-dot-yellow { width: 7px; height: 7px; border-radius: 50%; background: var(--rpt-warning); flex-shrink: 0; margin-top: 3px; }
        .flag-type { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; flex-shrink: 0; }
        .flag-msg { font-size: 11px; color: var(--rpt-text); flex: 1; }
        .period-badge { font-size: 10px; color: var(--rpt-text3); font-family: 'JetBrains Mono', monospace; padding: 4px 10px; border-radius: 6px; background: var(--rpt-bg3); border: 1px solid var(--rpt-border); }
        .overflow-x { overflow-x: auto; }
      `}</style>

      <div className="rpt-root">
        {/* ── Toolbar ── */}
        <div className="rpt-toolbar">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="rpt-periods">
              {(['daily','weekly','monthly','custom'] as Period[]).map(p => (
                <button key={p} className={`rpt-period ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <div className="rpt-custom">
                <span className="rpt-label">FROM</span>
                <input type="date" className="rpt-date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                <span className="rpt-label">TO</span>
                <input type="date" className="rpt-date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
              </div>
            )}
            <span className="period-badge">{from} → {to}</span>
          </div>
          <button className="rpt-export" onClick={handleExport}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Excel
          </button>
        </div>

        {/* ── Section Nav ── */}
        <div className="rpt-section-nav">
          {sections.map(s => (
            <button key={s.id} className={`rpt-sec-btn ${activeSection === s.id ? 'active' : ''}`} onClick={() => setActiveSection(s.id)}>
              {s.label}
              {s.id === 'flags' && flags.length > 0 && <span style={{ marginLeft: '5px', fontSize: '9px', background: 'rgba(255,71,87,0.15)', color: 'var(--rpt-danger)', padding: '1px 5px', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{flags.length}</span>}
            </button>
          ))}
        </div>

        {/* ════ SECTION: ORG SUMMARY ════ */}
        {activeSection === 'org' && (
          <div>
            {/* Top KPIs */}
            <div className="rpt-kpi-row">
              {[
                { label: 'Total Leads', val: orgStats.totalLeads, color: 'var(--rpt-teal)' },
                { label: 'Connected', val: orgStats.connected, color: 'var(--rpt-success)', sub: `${pct(orgStats.connected, orgStats.totalLeads)} rate` },
                { label: 'Interested', val: orgStats.interested, color: 'var(--rpt-purple)' },
                { label: 'Total Meetings', val: orgStats.totalMtgs, color: 'var(--rpt-accent)' },
                { label: 'Converted', val: orgStats.converted, color: 'var(--rpt-success)', sub: `${pct(orgStats.converted, orgStats.totalMtgs)} of mtgs` },
                { label: 'Total Calls', val: orgStats.totalCalls, color: 'var(--rpt-teal)' },
              ].map(k => (
                <div key={k.label} className="rpt-kpi">
                  <div className="rpt-kpi-label">{k.label}</div>
                  <div className="rpt-kpi-val" style={{ color: k.color }}>{k.val}</div>
                  {k.sub && <div className="rpt-kpi-sub">{k.sub}</div>}
                </div>
              ))}
            </div>

            <div className="rpt-two-col">
              {/* Lead pipeline table */}
              <div className="rpt-card">
                <SectionHead title="Lead pipeline breakdown" sub="// number status + lead status" />
                <div className="rpt-sub-label">NUMBER STATUS</div>
                <table className="rpt-table">
                  <thead><tr><th>Status</th><th>Count</th><th>% of total</th></tr></thead>
                  <tbody>
                    {[
                      { s: 'Connected',       v: orgStats.connected,  c: 'var(--rpt-success)' },
                      { s: 'Not Connected',   v: orgStats.notConn,    c: 'var(--rpt-danger)' },
                      { s: 'Mobile Off',      v: orgStats.mobileOff,  c: 'var(--rpt-warning)' },
                      { s: 'Incoming Barred', v: orgStats.incoming,   c: 'var(--rpt-warning)' },
                      { s: 'Invalid Number',  v: orgStats.invalid,    c: 'var(--rpt-text3)' },
                    ].map(r => (
                      <tr key={r.s}>
                        <td className="pri">{r.s}</td>
                        <td><Num v={r.v} color={r.c} /></td>
                        <td><PctBadge num={r.v} den={orgStats.totalLeads} good={30} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rpt-sub-label">LEAD STATUS</div>
                <table className="rpt-table">
                  <thead><tr><th>Status</th><th>Count</th><th>% of leads</th></tr></thead>
                  <tbody>
                    {[
                      { s: 'Interested',      v: orgStats.interested,    c: 'var(--rpt-success)' },
                      { s: 'Not Interested',  v: orgStats.notInterested, c: 'var(--rpt-danger)' },
                      { s: 'Eligible',        v: orgStats.eligible,      c: 'var(--rpt-accent)' },
                      { s: 'Not Eligible',    v: orgStats.notEligible,   c: 'var(--rpt-text3)' },
                      { s: 'Pending',         v: orgStats.pending,       c: 'var(--rpt-warning)' },
                      { s: 'Language Barrier',v: orgStats.langBarrier,   c: 'var(--rpt-purple)' },
                    ].map(r => (
                      <tr key={r.s}>
                        <td className="pri">{r.s}</td>
                        <td><Num v={r.v} color={r.c} /></td>
                        <td><PctBadge num={r.v} den={orgStats.totalLeads} good={20} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Meeting funnel */}
              <div className="rpt-card">
                <SectionHead title="Meeting funnel" sub="// request → schedule → outcome" />
                <div className="rpt-sub-label">REQUEST PIPELINE</div>
                <table className="rpt-table">
                  <thead><tr><th>Stage</th><th>Count</th><th>Rate</th></tr></thead>
                  <tbody>
                    {[
                      { s: 'Requests Sent',    v: orgStats.reqTotal,    c: 'var(--rpt-text)', den: orgStats.reqTotal },
                      { s: 'Approved',         v: orgStats.reqApproved, c: 'var(--rpt-success)', den: orgStats.reqTotal },
                      { s: 'Rejected',         v: orgStats.reqRejected, c: 'var(--rpt-danger)', den: orgStats.reqTotal },
                      { s: 'Pending',          v: orgStats.reqPending,  c: 'var(--rpt-warning)', den: orgStats.reqTotal },
                    ].map(r => (
                      <tr key={r.s}>
                        <td className="pri">{r.s}</td>
                        <td><Num v={r.v} color={r.c} /></td>
                        <td><PctBadge num={r.v} den={r.den} good={50} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rpt-sub-label">MEETING OUTCOMES</div>
                <table className="rpt-table">
                  <thead><tr><th>Status</th><th>Count</th><th>% of mtgs</th></tr></thead>
                  <tbody>
                    {[
                      { s: 'Scheduled',           v: orgStats.scheduled,  c: 'var(--rpt-accent)' },
                      { s: 'Meeting Done',         v: orgStats.done,       c: 'var(--rpt-success)' },
                      { s: 'Converted',            v: orgStats.converted,  c: 'var(--rpt-success)' },
                      { s: 'Not Done',             v: orgStats.notDone,    c: 'var(--rpt-danger)' },
                      { s: 'Reschedule Requested', v: orgStats.reschedule, c: 'var(--rpt-warning)' },
                      { s: 'Follow-Up',            v: orgStats.followUp,   c: 'var(--rpt-purple)' },
                      { s: 'Walk-in',              v: orgStats.walkin,     c: 'var(--rpt-teal)' },
                      { s: 'Mini Login',           v: orgStats.miniLogin,  c: 'var(--rpt-accent)' },
                      { s: 'Full Login',           v: orgStats.fullLogin,  c: 'var(--rpt-accent)' },
                    ].map(r => (
                      <tr key={r.s}>
                        <td className="pri">{r.s}</td>
                        <td><Num v={r.v} color={r.c} /></td>
                        <td><PctBadge num={r.v} den={orgStats.totalMtgs} good={30} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="rpt-sub-label">CONVERSION RATES</div>
                <table className="rpt-table">
                  <tbody>
                    {[
                      { s: 'Lead → Connected',    num: orgStats.connected, den: orgStats.totalLeads },
                      { s: 'Lead → Interested',   num: orgStats.interested, den: orgStats.totalLeads },
                      { s: 'Lead → Meeting',      num: orgStats.totalMtgs, den: orgStats.totalLeads },
                      { s: 'Meeting → Converted', num: orgStats.converted, den: orgStats.totalMtgs },
                      { s: 'Lead → Converted',    num: orgStats.converted, den: orgStats.totalLeads },
                    ].map(r => (
                      <tr key={r.s}>
                        <td className="pri">{r.s}</td>
                        <td><PctBadge num={r.num} den={r.den} good={30} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ SECTION: BO PERFORMANCE ════ */}
        {activeSection === 'bo' && (
          <div>
            <div className="rpt-card">
              <SectionHead title="BO performance — full report" sub={`// leads · calls · priority · meetings · walkin · login — ${boStats.length} BOs`} badge={`Period: ${from} → ${to}`} />
              <div className="overflow-x">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>BO Name</th>
                      <th>TC</th>
                      <th>Leads</th>
                      <th>Connected</th>
                      <th>Not Conn.</th>
                      <th>Mob Off</th>
                      <th>Interested</th>
                      <th>Eligible</th>
                      <th>Hot</th>
                      <th>Warm</th>
                      <th>Cold</th>
                      <th>Calls</th>
                      <th>Not Called</th>
                      <th>OD F/U</th>
                      <th>Mtg Total</th>
                      <th>Mtg Done</th>
                      <th>Converted</th>
                      <th>Not Done</th>
                      <th>Reschedule</th>
                      <th>Walk-in</th>
                      <th>WI Done</th>
                      <th>Mini Login</th>
                      <th>Full Login</th>
                      <th>BDO Conv.</th>
                      <th>Walk Done</th>
                      <th>Req Sent</th>
                      <th>Req Appr.</th>
                      <th>Req Rej.</th>
                      <th>Connect%</th>
                      <th>Conv%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boStats.map((bo: any, i: number) => (
                      <tr key={bo.id}>
                        <td className="rank">{i + 1}</td>
                        <td className="pri">{bo.name}</td>
                        <td style={{ color: 'var(--rpt-teal)', fontSize: '10px' }}>{bo.tcName}</td>
                        <td><Num v={bo.leads} color="var(--rpt-accent)" /></td>
                        <td><Num v={bo.connected} color="var(--rpt-success)" /></td>
                        <td><Num v={bo.notConn} color={bo.notConn > 0 ? 'var(--rpt-danger)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bo.mobileOff} color={bo.mobileOff > 0 ? 'var(--rpt-warning)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bo.interested} color="var(--rpt-purple)" /></td>
                        <td><Num v={bo.eligible} color="var(--rpt-accent)" /></td>
                        <td><Num v={bo.hot} color={bo.hot > 0 ? '#ff4757' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bo.warm} color={bo.warm > 0 ? '#f59e0b' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bo.cold} color={bo.cold > 0 ? 'var(--rpt-accent)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bo.totalCalls} color="var(--rpt-teal)" /></td>
                        <td><Num v={bo.notCalled} color={bo.notCalled > 0 ? 'var(--rpt-danger)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bo.overdueFollowups} color={bo.overdueFollowups > 0 ? 'var(--rpt-danger)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bo.meetings_total} color="var(--rpt-accent)" /></td>
                        <td><Num v={bo.meetings_done} color="var(--rpt-success)" /></td>
                        <td><Num v={bo.meetings_conv} color="var(--rpt-success)" /></td>
                        <td><Num v={bo.meetings_notDone} color={bo.meetings_notDone > 0 ? 'var(--rpt-danger)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bo.meetings_reschedule} color={bo.meetings_reschedule > 0 ? 'var(--rpt-warning)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bo.walkin_total} color="var(--rpt-teal)" /></td>
                        <td><Num v={bo.walkin_done} color="var(--rpt-success)" /></td>
                        <td><Num v={bo.mini_login} color="var(--rpt-accent)" /></td>
                        <td><Num v={bo.full_login} color="var(--rpt-accent)" /></td>
                        <td><Num v={bo.bdo_converted} color="var(--rpt-success)" /></td>
                        <td><Num v={bo.walking_done} color="var(--rpt-teal)" /></td>
                        <td><Num v={bo.req_sent} /></td>
                        <td><Num v={bo.req_approved} color="var(--rpt-success)" /></td>
                        <td><Num v={bo.req_rejected} color={bo.req_rejected > 0 ? 'var(--rpt-danger)' : 'var(--rpt-text3)'} /></td>
                        <td><PctBadge num={bo.connected} den={bo.leads} good={40} /></td>
                        <td><PctBadge num={bo.meetings_conv} den={bo.meetings_total} good={30} /></td>
                      </tr>
                    ))}
                    {boStats.length === 0 && <tr><td colSpan={31} className="rpt-empty">No BO data in this period</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ SECTION: TC PERFORMANCE ════ */}
        {activeSection === 'tc' && (
          <div>
            <div className="rpt-card">
              <SectionHead title="TC performance report" sub={`// request handling · team meetings · walkin · login — ${tcStats.length} TCs`} />
              <div className="overflow-x">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>#</th><th>TC Name</th><th>Team</th><th>BOs</th><th>Leads</th>
                      <th>Req Total</th><th>Approved</th><th>Rejected</th><th>Pending</th>
                      <th>Mtg Total</th><th>Scheduled</th><th>Done</th><th>Converted</th><th>Not Done</th><th>Reschedule</th>
                      <th>Walk-in</th><th>Mini Login</th>
                      <th>Approval%</th><th>Conv%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tcStats.map((tc: any, i: number) => (
                      <tr key={tc.id}>
                        <td className="rank">{i + 1}</td>
                        <td className="pri">{tc.name}</td>
                        <td style={{ color: 'var(--rpt-teal)', fontSize: '10px' }}>{tc.teamName}</td>
                        <td><Num v={tc.boCount} color="var(--rpt-accent)" /></td>
                        <td><Num v={tc.leads} /></td>
                        <td><Num v={tc.req_total} /></td>
                        <td><Num v={tc.req_approved} color="var(--rpt-success)" /></td>
                        <td><Num v={tc.req_rejected} color={tc.req_rejected > 0 ? 'var(--rpt-danger)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={tc.req_pending} color={tc.req_pending > 0 ? 'var(--rpt-warning)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={tc.mtg_total} color="var(--rpt-accent)" /></td>
                        <td><Num v={tc.mtg_scheduled} /></td>
                        <td><Num v={tc.mtg_done} color="var(--rpt-success)" /></td>
                        <td><Num v={tc.mtg_conv} color="var(--rpt-success)" /></td>
                        <td><Num v={tc.mtg_reschedule} color={tc.mtg_reschedule > 0 ? 'var(--rpt-warning)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={tc.mtg_reschedule} color={tc.mtg_reschedule > 0 ? 'var(--rpt-warning)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={tc.walkin} color="var(--rpt-teal)" /></td>
                        <td><Num v={tc.mini_login} color="var(--rpt-accent)" /></td>
                        <td><PctBadge num={tc.req_approved} den={tc.req_total} good={60} /></td>
                        <td><PctBadge num={tc.mtg_conv} den={tc.mtg_total} good={30} /></td>
                      </tr>
                    ))}
                    {tcStats.length === 0 && <tr><td colSpan={19} className="rpt-empty">No TC data in this period</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ SECTION: BDM PERFORMANCE ════ */}
        {activeSection === 'bdm' && (
          <div>
            <div className="rpt-card">
              <SectionHead title="BDM performance report" sub={`// meetings · walkin · login · reschedule — ${bdmStats.length} BDMs`} />
              <div className="overflow-x">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>#</th><th>BDM Name</th><th>Total Mtgs</th><th>Done</th><th>Converted</th><th>Not Done</th>
                      <th>Pending</th><th>Reschedule</th><th>Walk-in</th><th>WI Done</th>
                      <th>Mini Login</th><th>Full Login</th><th>Top Product</th>
                      <th>Walk-in%</th><th>Login%</th><th>Conv%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bdmStats.map((bdm: any, i: number) => (
                      <tr key={bdm.id}>
                        <td className="rank">{i + 1}</td>
                        <td className="pri">{bdm.name}</td>
                        <td><Num v={bdm.total} color="var(--rpt-accent)" /></td>
                        <td><Num v={bdm.done} color="var(--rpt-success)" /></td>
                        <td><Num v={bdm.conv} color="var(--rpt-success)" /></td>
                        <td><Num v={bdm.notDone} color={bdm.notDone > 0 ? 'var(--rpt-danger)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bdm.pending} color={bdm.pending > 0 ? 'var(--rpt-warning)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bdm.reschedule} color={bdm.reschedule > 0 ? 'var(--rpt-warning)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bdm.walkin} color="var(--rpt-teal)" /></td>
                        <td><Num v={bdm.walkin_done} color="var(--rpt-success)" /></td>
                        <td><Num v={bdm.mini} color="var(--rpt-accent)" /></td>
                        <td><Num v={bdm.full} color="var(--rpt-accent)" /></td>
                        <td style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: 'var(--rpt-purple)' }}>{bdm.topProduct}</td>
                        <td><PctBadge num={bdm.walkin} den={bdm.total} good={20} /></td>
                        <td><PctBadge num={bdm.mini} den={bdm.total} good={20} /></td>
                        <td><PctBadge num={bdm.conv} den={bdm.total} good={30} /></td>
                      </tr>
                    ))}
                    {bdmStats.length === 0 && <tr><td colSpan={16} className="rpt-empty">No BDM data in this period</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ SECTION: BDO PERFORMANCE ════ */}
        {activeSection === 'bdo' && (
          <div>
            <div className="rpt-card">
              <SectionHead title="BDO performance report" sub={`// post-meeting conversions · walking · login — ${bdoStats.length} BDOs`} />
              <div className="overflow-x">
                <table className="rpt-table">
                  <thead>
                    <tr>
                      <th>#</th><th>BDO Name</th><th>Assigned</th><th>Pending</th>
                      <th>Conv. by BDM</th><th>Follow-up</th><th>Walking Done</th><th>Invalid</th>
                      <th>Mini Login</th><th>Full Login</th><th>Action%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bdoStats.map((bdo: any, i: number) => (
                      <tr key={bdo.id}>
                        <td className="rank">{i + 1}</td>
                        <td className="pri">{bdo.name}</td>
                        <td><Num v={bdo.total} color="var(--rpt-accent)" /></td>
                        <td><Num v={bdo.pending} color={bdo.pending > 0 ? 'var(--rpt-warning)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bdo.conv_bdm} color="var(--rpt-success)" /></td>
                        <td><Num v={bdo.followup} color="var(--rpt-purple)" /></td>
                        <td><Num v={bdo.walking} color="var(--rpt-teal)" /></td>
                        <td><Num v={bdo.invalid} color={bdo.invalid > 0 ? 'var(--rpt-danger)' : 'var(--rpt-text3)'} /></td>
                        <td><Num v={bdo.mini} color="var(--rpt-accent)" /></td>
                        <td><Num v={bdo.full} color="var(--rpt-accent)" /></td>
                        <td><PctBadge num={bdo.total - bdo.pending} den={bdo.total} good={60} /></td>
                      </tr>
                    ))}
                    {bdoStats.length === 0 && <tr><td colSpan={11} className="rpt-empty">No BDO data in this period</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════ SECTION: FLAGS ════ */}
        {activeSection === 'flags' && (
          <div>
            <div className="rpt-card">
              <SectionHead title={`Flags & alerts`} sub="// auto-generated attention items" badge={`${flags.length} issues`} />
              {flags.length === 0 && <div className="rpt-empty" style={{ padding: '28px' }}>No flags in this period — everything looks good</div>}
              {flags.map((f, i) => (
                <div key={i} className="flag-item" style={{ borderBottom: i < flags.length - 1 ? '1px solid var(--rpt-border)' : 'none' }}>
                  <div className={f.severity === 'red' ? 'flag-dot-red' : 'flag-dot-yellow'} />
                  <span className="flag-type" style={{ background: f.severity === 'red' ? 'rgba(255,71,87,0.1)' : 'rgba(245,158,11,0.1)', color: f.severity === 'red' ? 'var(--rpt-danger)' : 'var(--rpt-warning)' }}>{f.type}</span>
                  <span className="flag-msg">{f.msg}</span>
                  <span style={{ fontSize: '9px', color: f.severity === 'red' ? 'var(--rpt-danger)' : 'var(--rpt-warning)', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', fontWeight: 700 }}>{f.severity === 'red' ? 'Critical' : 'Warning'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}