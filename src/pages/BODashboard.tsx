import { useState, useMemo, useEffect, Fragment } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { useLoading } from '@/hooks/use-loading';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { NumberStatus, LeadStatus, LeadType } from '@/types/crm';
import { DoubleConfirmModal } from '@/components/ui/DoubleConfirmModal';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'leads' | 'history' | 'meetings' | 'requests';
type Theme = 'dark' | 'light';
type Priority = 'Hot' | 'Warm' | 'Cold' | '';

// NOTE: These 3 fields must exist on the Lead type in @/types/crm.ts and in DB:
//   priority?:    'Hot' | 'Warm' | 'Cold'
//   followUpDate?: string   (ISO date "YYYY-MM-DD")
//   callCount?:   number

// ─── Constants ────────────────────────────────────────────────────────────────
const numberStatuses: NumberStatus[] = ['Connected', 'Not Connected'];
const leadStatuses: LeadStatus[] = [, 'Mobile Off', 'Incoming Barred', 'Invalid Number', 'Interested', 'Not Interested', 'Eligible', 'Not Eligible', 'Pending', 'Language Barrier', 'Ringing'];
const leadTypes: LeadType[] = ['Client', 'DSA'];

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icons = {
  overview: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  leads: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>,
  history: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>,
  meetings: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  requests: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>,
  phone: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>,
  send: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  msg: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>,
  edit: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  check: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>,
  trash: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>,
  bell: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>,
  fire: <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2c0 0-5 4-5 9a5 5 0 0010 0c0-5-5-9-5-9zm0 13a2 2 0 110-4 2 2 0 010 4z" /></svg>,
  sun: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  moon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>,
  logout: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  back: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>,
  tag: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
  clock2: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>,
  follow: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, string> = {
    'Converted': 'badge-converted', 'Meeting Done': 'badge-done',
    'Follow-Up': 'badge-followup', 'Not Done': 'badge-notdone',
    'Pending': 'badge-pending', 'Scheduled': 'badge-scheduled',
    'Approved': 'badge-approved', 'Pending Approval': 'badge-pending',
    'Rejected': 'badge-rejected', 'Interested': 'badge-interested',
    'Not Interested': 'badge-notint', 'Eligible': 'badge-eligible',
    'Not Eligible': 'badge-notdone', 'Connected': 'badge-connected',
    'Not Connected': 'badge-notconn', 'Mobile Off': 'badge-mobileoff',
    'Incoming Barred': 'badge-mobileoff', 'Ringing': 'badge-ringing',
    'Language Barrier': 'badge-lang',
  };
  return <span className={`badge ${map[status] || 'badge-pending'}`}>{status}</span>;
}

function priorityBadge(p: Priority) {
  if (!p) return null;
  const map = { Hot: 'prio-hot', Warm: 'prio-warm', Cold: 'prio-cold' };
  return <span className={`prio-badge ${map[p]}`}>{p}</span>;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BODashboard() {
  const {
    currentUser, leads, users, teams, meetings,
    meetingRequests, leadRemarks,
    updateLead, addMeetingRequest, addRemark, updateRemark, deleteRemark, logout,
  } = useCRM();
  const { withLoading, isLoading } = useLoading();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [theme, setTheme] = useState<Theme>('dark');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [numberStatusFilter, setNumberStatusFilter] = useState('all');
  const [stableLeadOrder, setStableLeadOrder] = useState<string[]>([]);
  const [remarkText, setRemarkText] = useState<Record<string, string>>({});
  const [editingRemark, setEditingRemark] = useState<string | null>(null);
  const [editRemarkText, setEditRemarkText] = useState('');
  const [remarkToDelete, setRemarkToDelete] = useState<string | null>(null);
  const [clock, setClock] = useState('');
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  // NOTE: priority, followUpDate, callCount are now stored in Lead via updateLead → DB persisted
  // callLogs remain local (timestamps/notes) — only callCount goes to DB
  const [callLogs, setCallLogs] = useState<Record<string, { time: string; note: string }[]>>({});

  // Live clock
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')} ${n.getHours() >= 12 ? 'PM' : 'AM'}`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  // Supabase presence
  useEffect(() => {
    if (!currentUser) return;
    const ch = supabase.channel('online-users').subscribe(async (s) => {
      if (s === 'SUBSCRIBED') await ch.track({ userId: currentUser.id });
    });
    return () => { supabase.removeChannel(ch); };
  }, [currentUser]);



  // useEffect(() => {
  //   if (!currentUser) return;

  //   console.log("🔥 Realtime start ho gaya");

  //   const channel = supabase
  //     .channel('leads-live')
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: 'INSERT',
  //         schema: 'public',
  //         table: 'leads',

  //         // 🔥 sirf apne leads
  //         filter: `assigned_bo_id=eq.${currentUser.id}`
  //       },
  //       (payload) => {
  //         console.log("🔥 New lead:", payload);

  //         // ❌ yaha dikkat hai (tera state context me hai)
  //         // 👉 direct setLeads nahi hai

  //         // ✅ solution:
  //         window.location.reload(); // TEMP FIX
  //       }
  //     )
  //     .subscribe((status) => {
  //       console.log("Realtime status:", status);
  //     });

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, [currentUser]);


  // Data
  const today = new Date().toISOString().split('T')[0];
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const myLeads = leads.filter(l => l.assignedBOId === currentUser?.id);
  const todayLeads = myLeads.filter(l => l.assignedDate === today);
  const myTeam = teams.find(t => t.boIds.includes(currentUser?.id || ''));
  const myTCId = myTeam?.tcId || '';
  const myMeetings = useMemo(() => {
    let f = meetings.filter(m => m.boId === currentUser?.id);
    if (fromDate) f = f.filter(m => m.date >= fromDate);
    if (toDate) f = f.filter(m => m.date <= toDate);
    return f;
  }, [meetings, currentUser, fromDate, toDate]);
  const myRequests = meetingRequests.filter(mr => mr.boId === currentUser?.id);

  // Stable order
  useEffect(() => {
    const ids = todayLeads.map(l => l.id);
    setStableLeadOrder(prev => {
      const newIds = ids.filter(id => !prev.includes(id));
      return [...prev, ...newIds];
    });
  }, [todayLeads.length]);

  const filteredTodayLeads = useMemo(() => {
    let f = todayLeads;
    if (statusFilter !== 'all') f = f.filter(l => l.leadStatus === statusFilter);
    if (numberStatusFilter !== 'all') f = f.filter(l => l.numberStatus === numberStatusFilter);
    return [...f].sort((a, b) => stableLeadOrder.indexOf(a.id) - stableLeadOrder.indexOf(b.id));
  }, [todayLeads, statusFilter, numberStatusFilter, stableLeadOrder]);

  const filteredHistory = useMemo(() => {
    let f = myLeads;
    if (fromDate) f = f.filter(l => l.assignedDate >= fromDate);
    if (toDate) f = f.filter(l => l.assignedDate <= toDate);
    if (statusFilter !== 'all') f = f.filter(l => l.leadStatus === statusFilter);
    if (numberStatusFilter !== 'all') f = f.filter(l => l.numberStatus === numberStatusFilter);
    return f;
  }, [myLeads, fromDate, toDate, statusFilter, numberStatusFilter]);

  // Follow-up leads for today/overdue — read from DB field lead.followUpDate
  const followupAlerts = useMemo(() => {
    return myLeads
      .filter(l => l.followUpDate && l.followUpDate <= today)
      .map(l => ({ lead: l, date: l.followUpDate! }));
  }, [myLeads, today]);

  // Overview stats
  const connected = todayLeads.filter(l => l.numberStatus === 'Connected').length;
  const notConnected = todayLeads.filter(l => l.numberStatus === 'Not Connected').length;
  const interested = todayLeads.filter(l => l.leadStatus === 'Interested').length;
  const eligible = todayLeads.filter(l => l.leadStatus === 'Eligible').length;
  const meetingsToday = meetings.filter(m => m.boId === currentUser?.id && m.date === today).length;
  const pendingReqCount = myRequests.filter(r => r.status === 'Pending').length;
  const approvedReqCount = myRequests.filter(r => r.status === 'Approved').length;
  const hotLeads = todayLeads.filter(l => l.priority === 'Hot').length;
  const totalCalls = myLeads.reduce((s, l) => s + (l.callCount || 0), 0);
  const connectRate = todayLeads.length ? Math.round((connected / todayLeads.length) * 100) : 0;

  // Actions
  const updateNumberStatus = async (leadId: string, status: NumberStatus) => {
    await updateLead(leadId, { numberStatus: status });
    // Auto log call
    const now = new Date().toISOString();
    setCallLogs(prev => ({ ...prev, [leadId]: [...(prev[leadId] || []), { time: now, note: `Status → ${status}` }] }));
    toast.success('Number status updated');
  };
  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    await updateLead(leadId, { leadStatus: status });
    toast.success('Lead status updated');
  };
  const updateLeadType = async (leadId: string, type: LeadType) => {
    await updateLead(leadId, { leadType: type });
  };
  const requestMeeting = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    if (lead.leadStatus !== 'Interested') { toast.error('Only for Interested leads'); return; }
    if (lead.meetingRequested) { toast.error('Already requested'); return; }
    await updateLead(leadId, { meetingRequested: true, meetingRejected: false });
    await addMeetingRequest({ id: `mr${Date.now()}`, leadId, boId: currentUser!.id, tcId: myTCId, status: 'Pending', createdAt: today });
    toast.success('Meeting request sent to TC');
  };
  const handleAddRemark = async (leadId: string) => {
    const text = remarkText[leadId]?.trim();
    if (!text) { toast.error('Enter a remark'); return; }
    await addRemark({ leadId, remark: text, createdBy: currentUser!.id, createdAt: new Date().toISOString() });
    setRemarkText(prev => ({ ...prev, [leadId]: '' }));
    toast.success('Remark saved');
  };
  const handleUpdateRemark = async (remarkId: string) => {
    if (!editRemarkText.trim()) return;
    await updateRemark(remarkId, editRemarkText.trim());
    setEditingRemark(null);
    toast.success('Remark updated');
  };
  const logCall = async (leadId: string, note = 'Manual call logged') => {
    const lead = leads.find(l => l.id === leadId);
    const newCount = (lead?.callCount || 0) + 1;
    await updateLead(leadId, { callCount: newCount });
    const now = new Date().toISOString();
    setCallLogs(prev => ({ ...prev, [leadId]: [...(prev[leadId] || []), { time: now, note }] }));
    toast.success('Call logged');
  };
  const setPriority = async (leadId: string, p: Priority) => {
    await updateLead(leadId, { priority: p || null });
    toast.success(p ? `Priority set to ${p}` : 'Priority cleared');
  };
  const setFollowup = async (leadId: string, date: string) => {
    await updateLead(leadId, { followUpDate: date || null });
    toast.success(date ? 'Follow-up reminder set' : 'Follow-up cleared');
  };

  const getLeadRemarks = (leadId: string) => leadRemarks.filter(r => r.leadId === leadId);
  const isDark = theme === 'dark';

  // ─── Lead Row (expanded panel) ─────────────────────────────────────────────
  const renderLeadRow = (lead: typeof myLeads[0], showRemarks = true) => {
    const remarks = getLeadRemarks(lead.id);
    const isExpanded = expandedLead === lead.id;
    const logs = callLogs[lead.id] || [];
    const prio = (lead.priority || '') as Priority;
    const fuDate = lead.followUpDate || '';
    const callCount = lead.callCount || 0;
    const isOverdue = fuDate && fuDate < today;
    const isDueToday = fuDate === today;

    return (
      <Fragment key={lead.id}>
        <tr
          key={lead.id}
          className={`lead-row ${lead.meetingRejected ? 'row-rejected' : ''} ${isExpanded ? 'row-expanded' : ''}`}
          onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
          style={{ cursor: 'pointer' }}
        >
          <td className="primary">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="lead-avatar">{lead.clientName?.[0]}</div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{lead.clientName}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>{lead.assignedDate}</div>
              </div>
            </div>
          </td>
          <td>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text2)' }}>{lead.phoneNumber}</div>
            {(callCount > 0 || logs.length > 0) && (
              <div style={{ fontSize: '9px', color: 'var(--accent)', marginTop: '2px', fontFamily: "'JetBrains Mono', monospace" }}>
                {Icons.clock2} {callCount} call{callCount !== 1 ? 's' : ''}{logs.length > 0 ? ` · ${timeAgo(logs[logs.length - 1].time)}` : ''}
              </div>
            )}
          </td>
          <td style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>₹{lead.loanRequirement}</td>
          <td>
            {lead.meetingRequested
              ? statusBadge(lead.numberStatus || '—')
              : (
                <select className="cc-select-sm" value={lead.numberStatus || ''} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); updateNumberStatus(lead.id, e.target.value as NumberStatus); }}>
                  <option value="">Set status</option>
                  {numberStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
          </td>
          <td>
            {lead.meetingRequested
              ? statusBadge(lead.leadStatus || '—')
              : (
                <select className="cc-select-sm" value={lead.leadStatus || ''} onClick={e => e.stopPropagation()} onChange={e => { e.stopPropagation(); updateLeadStatus(lead.id, e.target.value as LeadStatus); }}>
                  <option value="">Set status</option>
                  {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
          </td>
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {priorityBadge(prio)}
              {fuDate && (
                <span className={`fu-chip ${isOverdue ? 'fu-overdue' : isDueToday ? 'fu-today' : 'fu-future'}`}>
                  {Icons.bell} {fuDate}
                </span>
              )}
            </div>
          </td>
          <td>
            {lead.leadStatus === 'Interested' && !lead.meetingRequested && (
              <button className="cc-btn-sm cc-btn-blue" onClick={e => { e.stopPropagation(); withLoading(`meeting_${lead.id}`, () => requestMeeting(lead.id)); }}>
                {Icons.send} {isLoading(`meeting_${lead.id}`) ? '...' : 'Request'}
              </button>
            )}
            {lead.meetingRequested && (
              <span className={`badge ${lead.meetingApproved ? 'badge-approved' : 'badge-pending'}`}>
                {lead.meetingApproved ? 'Approved' : 'Pending'}
              </span>
            )}
          </td>
        </tr>
        {isExpanded && (
          <tr key={`${lead.id}-expanded`} className="expanded-row">
            <td colSpan={7}>
              <div className="expanded-panel">
                <div className="exp-grid">

                  {/* ── Priority ── */}
                  <div className="exp-section">
                    <div className="exp-section-label">{Icons.tag} PRIORITY TAG</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      {(['Hot', 'Warm', 'Cold', ''] as Priority[]).map(p => (
                        <button key={p || 'None'} className={`prio-btn ${prio === p ? 'prio-btn-active' : ''} ${p === 'Hot' ? 'prio-btn-hot' : p === 'Warm' ? 'prio-btn-warm' : p === 'Cold' ? 'prio-btn-cold' : 'prio-btn-none'}`}
                          onClick={() => setPriority(lead.id, p)}>
                          {p || 'None'}
                        </button>
                      ))}
                    </div>
                    {/* Lead Type */}
                    <div className="exp-section-label" style={{ marginTop: '12px' }}>LEAD TYPE</div>
                    {lead.meetingRequested
                      ? <span className="badge badge-done">{lead.leadType || '—'}</span>
                      : (
                        <select className="cc-select-sm" style={{ marginTop: '6px' }} value={lead.leadType || ''} onChange={e => updateLeadType(lead.id, e.target.value as LeadType)}>
                          <option value="">Select type</option>
                          {leadTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      )}
                  </div>

                  {/* ── Follow-up ── */}
                  <div className="exp-section">
                    <div className="exp-section-label">{Icons.follow} FOLLOW-UP REMINDER</div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                      <input type="date" className="cc-date-input" value={fuDate} min={today}
                        onChange={e => setFollowup(lead.id, e.target.value)} style={{ flex: 1 }} />
                      {fuDate && (
                        <button className="cc-btn-sm cc-btn-ghost" onClick={() => setFollowup(lead.id, '')}>✕</button>
                      )}
                    </div>
                    {fuDate && (
                      <div className={`fu-status ${isOverdue ? 'fu-status-overdue' : isDueToday ? 'fu-status-today' : 'fu-status-future'}`}>
                        {isOverdue ? '⚠ Overdue' : isDueToday ? '● Due today' : `Scheduled for ${fuDate}`}
                      </div>
                    )}
                  </div>

                  {/* ── Call Log ── */}
                  <div className="exp-section">
                    <div className="exp-section-label">{Icons.phone} CALL LOG</div>
                    <div className="call-log-list">
                      {logs.length === 0 && <div className="call-empty">No calls logged yet</div>}
                      {logs.slice(-4).reverse().map((log, i) => (
                        <div key={i} className="call-entry">
                          <span className="call-dot" />
                          <div>
                            <div className="call-note">{log.note}</div>
                            <div className="call-time">{timeAgo(log.time)} · {new Date(log.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="cc-btn-sm cc-btn-ghost" style={{ marginTop: '8px' }} onClick={() => logCall(lead.id)}>
                      {Icons.phone} Log call
                    </button>
                  </div>

                  {/* ── Remarks ── */}
                  {showRemarks && (
                    <div className="exp-section">
                      <div className="exp-section-label">{Icons.msg} REMARKS</div>
                      <div className="remarks-list">
                        {remarks.map(r => (
                          <div key={r.id} className="remark-item">
                            {editingRemark === r.id ? (
                              <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                                <input value={editRemarkText} onChange={e => setEditRemarkText(e.target.value)} className="cc-input-xs" />
                                <button className="icon-btn icon-btn-green" onClick={() => handleUpdateRemark(r.id)}>{Icons.check}</button>
                              </div>
                            ) : (
                              <>
                                <span className="remark-text">{r.remark}</span>
                                <span className="remark-time">{timeAgo(r.createdAt)}</span>
                                <div style={{ display: 'flex', gap: '3px', marginLeft: 'auto' }}>
                                  <button className="icon-btn" onClick={() => { setEditingRemark(r.id); setEditRemarkText(r.remark); }}>{Icons.edit}</button>
                                  <button className="icon-btn icon-btn-red" onClick={() => setRemarkToDelete(r.id)}>{Icons.trash}</button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <input value={remarkText[lead.id] || ''} onChange={e => setRemarkText(prev => ({ ...prev, [lead.id]: e.target.value }))}
                          placeholder="Add remark..." className="cc-input-xs" style={{ flex: 1 }}
                          onKeyDown={e => { if (e.key === 'Enter') withLoading(`remark_${lead.id}`, () => handleAddRemark(lead.id)); }} />
                        <button className="cc-btn-sm cc-btn-blue"
                          disabled={isLoading(`remark_${lead.id}`)}
                          onClick={() => withLoading(`remark_${lead.id}`, () => handleAddRemark(lead.id))}>
                          {Icons.msg}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    );
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

        /* ── THEME VARIABLES ── */
        .bo-root.dark {
          --bg: #07080f; --bg2: #0d0f1a; --bg3: #12152a;
          --surface: #161929; --surface2: #1c2038;
          --border: rgba(255,255,255,0.06); --border2: rgba(255,255,255,0.1);
          --accent: #3d7fff; --success: #00d4aa; --warning: #f59e0b;
          --danger: #ff4757; --purple: #a78bfa; --orange: #ff6b35;
          --text: #e8eaf6; --text2: #8892b0; --text3: #4a5568;
          --row-hover: rgba(255,255,255,0.025);
          --expanded-bg: rgba(61,127,255,0.04);
        }
        .bo-root.light {
          --bg: #f4f5fa; --bg2: #ffffff; --bg3: #eef0f7;
          --surface: #ffffff; --surface2: #eef0f7;
          --border: rgba(0,0,0,0.08); --border2: rgba(0,0,0,0.13);
          --accent: #2563eb; --success: #059669; --warning: #d97706;
          --danger: #dc2626; --purple: #7c3aed; --orange: #ea580c;
          --text: #111827; --text2: #4b5563; --text3: #9ca3af;
          --row-hover: rgba(0,0,0,0.02);
          --expanded-bg: rgba(37,99,235,0.03);
        }

        /* ── BASE ── */
        .bo-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg); color: var(--text);
          min-height: 100vh; position: relative;
          transition: background 0.25s, color 0.25s;
        }
        .bo-layout { display: flex; min-height: 100vh; position: relative; z-index: 1; }

        /* ── SIDEBAR ── */
        .bo-sidebar {
          width: 232px; flex-shrink: 0; background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh; overflow: hidden;
          transition: background 0.25s, border-color 0.25s;
        }
        .bo-sidebar::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); }
        .bo-logo-area { padding: 24px 22px 18px; border-bottom: 1px solid var(--border); }
        .bo-logo-tag { font-size: 9px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); font-family: 'JetBrains Mono', monospace; margin-bottom: 6px; }
        .bo-logo-name { font-size: 18px; font-weight: 800; color: var(--text); line-height: 1.2; }
        .bo-user-chip { margin: 14px 20px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 12px; padding: 11px; display: flex; align-items: center; gap: 10px; }
        .bo-user-ava { width: 34px; height: 34px; border-radius: 10px; background: linear-gradient(135deg, var(--accent), var(--purple)); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .bo-user-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .bo-user-role { font-size: 10px; color: var(--success); font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px; }
        .bo-nav-section { padding: 6px 14px; margin-top: 2px; }
        .bo-nav-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; color: var(--text3); text-transform: uppercase; font-family: 'JetBrains Mono', monospace; padding: 0 8px; margin-bottom: 4px; }
        .bo-nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; cursor: pointer; transition: all 0.15s; font-size: 13px; font-weight: 500; color: var(--text2); position: relative; margin-bottom: 1px; }
        .bo-nav-item:hover { background: var(--surface2); color: var(--text); }
        .bo-nav-item.active { background: var(--surface2); color: var(--accent); }
        .bo-nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 60%; background: var(--accent); border-radius: 0 3px 3px 0; }
        .bo-nav-icon { width: 16px; height: 16px; opacity: 0.65; display: flex; align-items: center; justify-content: center; }
        .bo-nav-item.active .bo-nav-icon { opacity: 1; }
        .bo-nav-badge { margin-left: auto; font-size: 10px; font-weight: 700; background: var(--danger); color: #fff; padding: 1px 7px; border-radius: 10px; font-family: 'JetBrains Mono', monospace; }
        .bo-nav-badge.warn { background: var(--warning); }
        .bo-nav-badge.info { background: var(--accent); }
        .bo-sidebar-footer { margin-top: auto; padding: 14px 20px; border-top: 1px solid var(--border); }
        .bo-status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); margin-right: 5px; animation: pdot 2s infinite; }
        @keyframes pdot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .bo-footer-info { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; }

        /* Theme Toggle */
        .theme-toggle { display: flex; align-items: center; background: var(--bg3); border: 1px solid var(--border2); border-radius: 20px; padding: 3px; margin-bottom: 10px; cursor: pointer; }
        .toggle-opt { display: flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 14px; font-size: 11px; font-weight: 600; color: var(--text3); transition: all 0.2s; font-family: 'JetBrains Mono', monospace; flex: 1; justify-content: center; }
        .toggle-opt.active { background: var(--surface); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .logout-btn { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; color: var(--text2); cursor: pointer; background: var(--surface); border: 1px solid var(--border); transition: all 0.2s; font-family: inherit; }
        .logout-btn:hover { border-color: var(--border2); color: var(--text); }

        /* ── MAIN ── */
        .bo-main { flex: 1; overflow: auto; padding: 28px 28px 60px; }
        .bo-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .bo-page-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: var(--text); }
        .bo-page-sub { font-size: 11px; color: var(--text2); margin-top: 3px; font-family: 'JetBrains Mono', monospace; }
        .bo-clock { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text2); background: var(--surface); border: 1px solid var(--border); padding: 7px 12px; border-radius: 8px; }

        /* Alert Strip */
        .alert-strip { background: rgba(255,107,53,0.05); border: 1px solid rgba(255,107,53,0.2); border-radius: 10px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin-bottom: 18px; position: relative; overflow: hidden; }
        .alert-strip::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--orange); }
        .alert-text { font-size: 12px; color: var(--text); flex: 1; }
        .alert-link { font-size: 10px; color: var(--accent); cursor: pointer; font-family: 'JetBrains Mono', monospace; }

        /* ── KPI CARDS ── */
        .kpi-row { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 14px; margin-bottom: 24px; }
        .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 18px 16px; transition: transform 0.2s, border-color 0.2s, background 0.25s; }
        .kpi-card:hover { transform: translateY(-2px); }
        .kpi-label { font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-bottom: 8px; }
        .kpi-val { font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
        .kpi-sub { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
        .kpi-bar-wrap { display: flex; align-items: flex-end; gap: 2px; height: 22px; margin-top: 10px; }
        .kpi-bar { flex: 1; border-radius: 2px; min-height: 2px; opacity: 0.5; }

        /* ── OVERVIEW SECTIONS ── */
        .ov-two-col { display: grid; grid-template-columns: minmax(0,1.5fr) minmax(0,1fr); gap: 18px; margin-bottom: 18px; }
        .ov-three-col { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 18px; margin-bottom: 18px; }

        /* Glass Card */
        .glass-card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; margin-bottom: 18px; transition: background 0.25s; }
        .card-head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px 11px; border-bottom: 1px solid var(--border); }
        .card-title { font-size: 12px; font-weight: 700; color: var(--text); letter-spacing: 0.3px; }
        .card-sub { font-size: 10px; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
        .card-body { padding: 14px 18px; }

        /* Funnel */
        .funnel-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .funnel-label { font-size: 10px; color: var(--text2); width: 80px; flex-shrink: 0; font-family: 'JetBrains Mono', monospace; }
        .funnel-bar-bg { flex: 1; background: var(--bg3); border-radius: 3px; height: 5px; overflow: hidden; }
        .funnel-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
        .funnel-count { font-size: 11px; font-weight: 600; min-width: 20px; text-align: right; font-family: 'JetBrains Mono', monospace; }

        /* Follow-up alert list */
        .fu-alert-list { display: flex; flex-direction: column; gap: 6px; }
        .fu-alert-item { display: flex; align-items: center; gap: 10px; background: var(--bg3); border: 1px solid var(--border); border-radius: 9px; padding: 9px 12px; }
        .fu-alert-name { font-size: 13px; font-weight: 600; color: var(--text); flex: 1; }
        .fu-alert-date { font-size: 10px; font-family: 'JetBrains Mono', monospace; }
        .fu-overdue .fu-alert-date { color: var(--danger); }
        .fu-today-item .fu-alert-date { color: var(--warning); }

        /* Call timeline */
        .call-timeline { display: flex; flex-direction: column; gap: 5px; max-height: 200px; overflow-y: auto; }
        .call-tl-item { display: flex; gap: 10px; }
        .call-tl-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); flex-shrink: 0; margin-top: 4px; }
        .call-tl-name { font-size: 12px; font-weight: 600; color: var(--text); }
        .call-tl-meta { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

        /* Request status */
        .req-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: var(--bg3); border: 1px solid var(--border); border-radius: 9px; margin-bottom: 6px; }
        .req-name { font-size: 13px; font-weight: 600; color: var(--text); flex: 1; }
        .req-date { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

        /* ── DATA TABLE ── */
        .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .data-table th { padding: 9px 11px; text-align: left; font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); font-family: 'JetBrains Mono', monospace; border-bottom: 1px solid var(--border); }
        .data-table td { padding: 10px 11px; border-bottom: 1px solid var(--border); color: var(--text2); vertical-align: middle; }
        .data-table tr:last-child td { border-bottom: none; }
        .lead-row { transition: background 0.12s; }
        .lead-row:hover { background: var(--row-hover); }
        .row-expanded { background: var(--row-hover); }
        .row-rejected { background: rgba(255,71,87,0.04); }
        .data-table td.primary { color: var(--text); font-weight: 600; }
        .empty-row { text-align: center; color: var(--text3); padding: 20px; font-size: 11px; font-family: 'JetBrains Mono', monospace; }
        .product-chip { font-size: 10px; background: var(--surface2); color: var(--text2); padding: 2px 8px; border-radius: 5px; font-family: 'JetBrains Mono', monospace; }
        .lead-avatar { width: 28px; height: 28px; border-radius: 8px; background: rgba(61,127,255,0.12); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--accent); flex-shrink: 0; }

        /* ── EXPANDED PANEL ── */
        .expanded-row td { padding: 0; border-bottom: 1px solid var(--border); }
        .expanded-panel { background: var(--expanded-bg); border-top: 1px solid var(--border2); padding: 16px 18px; }
        .exp-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; }
        .exp-section { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
        .exp-section-label { font-size: 9px; font-weight: 600; letter-spacing: 1.5px; color: var(--text3); text-transform: uppercase; font-family: 'JetBrains Mono', monospace; display: flex; align-items: center; gap: 5px; }

        /* Priority buttons */
        .prio-btn { padding: 5px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid var(--border2); background: var(--surface2); color: var(--text2); transition: all 0.15s; font-family: 'JetBrains Mono', monospace; }
        .prio-btn-active.prio-btn-hot { background: rgba(255,71,87,0.15); color: #ff4757; border-color: rgba(255,71,87,0.3); }
        .prio-btn-active.prio-btn-warm { background: rgba(245,158,11,0.15); color: #f59e0b; border-color: rgba(245,158,11,0.3); }
        .prio-btn-active.prio-btn-cold { background: rgba(61,127,255,0.15); color: var(--accent); border-color: rgba(61,127,255,0.3); }
        .prio-btn-active.prio-btn-none { background: var(--surface2); color: var(--text); border-color: var(--border2); }

        /* Priority badges */
        .prio-badge { font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 5px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.5px; }
        .prio-hot { background: rgba(255,71,87,0.12); color: #ff4757; border: 1px solid rgba(255,71,87,0.2); }
        .prio-warm { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
        .prio-cold { background: rgba(61,127,255,0.12); color: var(--accent); border: 1px solid rgba(61,127,255,0.2); }

        /* Follow-up chips */
        .fu-chip { font-size: 9px; padding: 2px 7px; border-radius: 5px; font-family: 'JetBrains Mono', monospace; display: inline-flex; align-items: center; gap: 3px; }
        .fu-overdue { background: rgba(255,71,87,0.1); color: var(--danger); }
        .fu-today { background: rgba(245,158,11,0.1); color: var(--warning); }
        .fu-future { background: rgba(0,212,170,0.08); color: var(--success); }
        .fu-status { font-size: 10px; margin-top: 6px; font-family: 'JetBrains Mono', monospace; padding: 4px 8px; border-radius: 6px; }
        .fu-status-overdue { background: rgba(255,71,87,0.1); color: var(--danger); }
        .fu-status-today { background: rgba(245,158,11,0.1); color: var(--warning); }
        .fu-status-future { background: rgba(0,212,170,0.08); color: var(--success); }

        /* Call log */
        .call-log-list { display: flex; flex-direction: column; gap: 5px; max-height: 120px; overflow-y: auto; }
        .call-entry { display: flex; gap: 8px; align-items: flex-start; }
        .call-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); flex-shrink: 0; margin-top: 4px; }
        .call-note { font-size: 11px; color: var(--text); }
        .call-time { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
        .call-empty { font-size: 11px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

        /* Remarks */
        .remarks-list { display: flex; flex-direction: column; gap: 4px; max-height: 100px; overflow-y: auto; }
        .remark-item { display: flex; align-items: flex-start; gap: 6px; background: var(--bg3); border-radius: 6px; padding: 6px 8px; }
        .remark-text { font-size: 11px; color: var(--text); flex: 1; }
        .remark-time { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; white-space: nowrap; }

        /* ── BADGES ── */
        .badge { display: inline-flex; align-items: center; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.5px; font-family: 'JetBrains Mono', monospace; }
        .badge-converted { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.2); }
        .badge-done { background: rgba(61,127,255,0.1); color: var(--accent); border: 1px solid rgba(61,127,255,0.2); }
        .badge-followup { background: rgba(167,139,250,0.1); color: var(--purple); border: 1px solid rgba(167,139,250,0.2); }
        .badge-notdone { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
        .badge-pending { background: rgba(245,158,11,0.1); color: var(--warning); border: 1px solid rgba(245,158,11,0.2); }
        .badge-scheduled { background: rgba(61,127,255,0.1); color: var(--accent); border: 1px solid rgba(61,127,255,0.2); }
        .badge-approved { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.2); }
        .badge-rejected { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
        .badge-interested { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.2); }
        .badge-notint { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
        .badge-eligible { background: rgba(61,127,255,0.1); color: var(--accent); border: 1px solid rgba(61,127,255,0.2); }
        .badge-connected { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.2); }
        .badge-notconn { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
        .badge-mobileoff { background: rgba(245,158,11,0.1); color: var(--warning); border: 1px solid rgba(245,158,11,0.2); }
        .badge-ringing { background: rgba(0,212,170,0.08); color: var(--success); border: 1px solid rgba(0,212,170,0.15); }
        .badge-lang { background: rgba(167,139,250,0.1); color: var(--purple); border: 1px solid rgba(167,139,250,0.2); }

        /* ── BUTTONS & INPUTS ── */
        .cc-select-sm { background: var(--bg3); border: 1px solid var(--border2); border-radius: 7px; padding: 5px 8px; color: var(--text); font-size: 11px; font-family: 'Inter', sans-serif; outline: none; width: 130px; }
        .cc-select-sm:focus { border-color: var(--accent); }
        .cc-date-input { background: var(--surface); border: 1px solid var(--border2); border-radius: 8px; padding: 6px 10px; color: var(--text); font-size: 11px; font-family: 'JetBrains Mono', monospace; outline: none; }
        .cc-date-input:focus { border-color: var(--accent); }
        .cc-input-xs { background: var(--bg3); border: 1px solid var(--border2); border-radius: 6px; padding: 5px 8px; color: var(--text); font-size: 11px; font-family: 'Inter', sans-serif; outline: none; width: 100%; }
        .cc-input-xs:focus { border-color: var(--accent); }
        .cc-input-xs::placeholder { color: var(--text3); }
        .cc-btn-sm { display: inline-flex; align-items: center; gap: 5px; border: none; border-radius: 7px; padding: 6px 12px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .cc-btn-blue { background: var(--accent); color: #fff; }
        .cc-btn-blue:hover { opacity: 0.85; }
        .cc-btn-ghost { background: var(--surface2); color: var(--text2); border: 1px solid var(--border2); }
        .cc-btn-ghost:hover { color: var(--text); border-color: var(--text3); }
        .icon-btn { background: none; border: none; cursor: pointer; color: var(--text3); padding: 2px; border-radius: 4px; display: flex; align-items: center; }
        .icon-btn:hover { color: var(--text2); background: var(--surface2); }
        .icon-btn-red:hover { color: var(--danger); }
        .icon-btn-green:hover { color: var(--success); }

        /* Filter bar */
        .filter-bar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
        .filter-label { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

        /* Date range */
        .date-range { display: flex; gap: 8px; align-items: center; }
        .cc-clear-btn { font-size: 10px; color: var(--text3); cursor: pointer; font-family: 'JetBrains Mono', monospace; padding: 6px 10px; border: 1px solid var(--border); border-radius: 7px; background: transparent; }
        .cc-clear-btn:hover { color: var(--text2); }

        /* Animations */
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeInUp 0.25s ease forwards; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
      `}</style>

      <div className={`bo-root ${theme}`}>
        <div className="bo-layout">

          {/* ── SIDEBAR ── */}
          <aside className="bo-sidebar">
            <div className="bo-logo-area">
              <div className="bo-logo-tag">CRM · BO Portal</div>
              <div className="bo-logo-name">My<br />Dashboard</div>
            </div>
            <div className="bo-user-chip">
              <div className="bo-user-ava">{currentUser?.name?.[0] ?? 'B'}</div>
              <div>
                <div className="bo-user-name">{currentUser?.name || 'Business Officer'}</div>
                <div className="bo-user-role">BUS. OFFICER</div>
              </div>
            </div>
            <div className="bo-nav-section">
              <div className="bo-nav-label">Main</div>
              {([
                { id: 'overview', label: 'Overview', icon: Icons.overview },
                { id: 'leads', label: "Today's Leads", icon: Icons.leads, badge: followupAlerts.length > 0 ? followupAlerts.length : null, badgeCls: 'warn' },
                { id: 'history', label: 'Lead History', icon: Icons.history },
                { id: 'meetings', label: 'My Meetings', icon: Icons.meetings },
                { id: 'requests', label: 'Meeting Requests', icon: Icons.requests, badge: pendingReqCount > 0 ? pendingReqCount : null, badgeCls: '' },
              ] as { id: Tab; label: string; icon: JSX.Element; badge?: number | null; badgeCls?: string }[]).map(item => (
                <div key={item.id} className={`bo-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                  <div className="bo-nav-icon">{item.icon}</div>
                  {item.label}
                  {item.badge ? <span className={`bo-nav-badge ${item.badgeCls || ''}`}>{item.badge}</span> : null}
                </div>
              ))}
            </div>
            <div className="bo-sidebar-footer">
              <div className="bo-footer-info">
                <span className="bo-status-dot" />Online · {myTeam?.name || 'My Team'}<br />
                <span style={{ color: 'var(--text3)', marginTop: '3px', display: 'block' }}>{todayLeads.length} leads today · {myMeetings.length} meetings</span>
              </div>
              <div className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                <div className={`toggle-opt ${isDark ? 'active' : ''}`}>{Icons.moon} Dark</div>
                <div className={`toggle-opt ${!isDark ? 'active' : ''}`}>{Icons.sun} Light</div>
              </div>
              <button className="logout-btn" onClick={logout}>{Icons.logout} Sign Out</button>
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main className="bo-main">

            {/* ════ OVERVIEW TAB ════ */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <div className="bo-topbar">
                  <div>
                    <div className="bo-page-title">Good morning, {currentUser?.name?.split(' ')[0] || 'BO'}</div>
                    <div className="bo-page-sub">// {todayStr} · your daily snapshot</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="bo-clock">{clock}</div>
                    {followupAlerts.length > 0 && (
                      <button className="cc-btn-sm cc-btn-ghost" style={{ borderColor: 'rgba(245,158,11,0.3)', color: 'var(--warning)' }} onClick={() => setActiveTab('history')}>
                        {Icons.bell} {followupAlerts.length} follow-up{followupAlerts.length > 1 ? 's' : ''} due
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Row */}
                <div className="kpi-row">
                  {[
                    { label: "Total Leads", val: myLeads.length, color: 'var(--accent)', bars: [8, 10, 9, 12, 11, 13, myLeads.length], barColor: '#3d7fff' },
                    { label: 'Connected', val: connected, color: 'var(--success)', sub: `${connectRate}% rate`, bars: [3, 4, 3, 5, 4, 5, connected], barColor: '#00d4aa' },
                    { label: 'Interested', val: interested, color: 'var(--purple)', bars: [1, 2, 1, 3, 2, 3, interested], barColor: '#a78bfa' },
                    { label: 'Total Meetings', val: myMeetings.length, color: 'var(--warning)', bars: [0, 1, 0, 2, 1, 2, myMeetings.length], barColor: '#f59e0b' },
                    { label: 'Hot Leads', val: hotLeads, color: 'var(--danger)', bars: [0, 1, 1, 2, 1, 2, hotLeads], barColor: '#ff4757' },
                  ].map(k => {
                    const max = Math.max(...k.bars) || 1;
                    return (
                      <div key={k.label} className="kpi-card">
                        <div className="kpi-label">{k.label}</div>
                        <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
                        {k.sub && <div className="kpi-sub">{k.sub}</div>}
                        <div className="kpi-bar-wrap">
                          {k.bars.map((v, i) => (
                            <div key={i} className="kpi-bar" style={{ height: `${Math.max(2, Math.round((v / max) * 20))}px`, background: k.barColor }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="ov-two-col">
                  {/* Lead Funnel */}
                  <div className="glass-card">
                    <div className="card-head">
                      <div><div className="card-title">Today's lead funnel</div><div className="card-sub">// status breakdown</div></div>
                    </div>
                    <div className="card-body">
                      {[
                        { label: 'Assigned', val: todayLeads.length, color: '#3d7fff' },
                        { label: 'Connected', val: connected, color: '#00d4aa' },
                        { label: 'Not Conn.', val: notConnected, color: '#ff4757' },
                        { label: 'Interested', val: interested, color: '#a78bfa' },
                        { label: 'Eligible', val: eligible, color: '#3d7fff' },
                        { label: 'Meetings', val: meetingsToday, color: '#f59e0b' },
                      ].map(r => (
                        <div key={r.label} className="funnel-row">
                          <span className="funnel-label">{r.label}</span>
                          <div className="funnel-bar-bg"><div className="funnel-bar-fill" style={{ width: `${todayLeads.length ? Math.round((r.val / todayLeads.length) * 100) : 0}%`, background: r.color }} /></div>
                          <span className="funnel-count" style={{ color: r.color }}>{r.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Follow-up alerts */}
                  <div className="glass-card">
                    <div className="card-head">
                      <div><div className="card-title">Follow-up alerts</div><div className="card-sub">// due today & overdue</div></div>
                      <span className="badge badge-pending">{followupAlerts.length} due</span>
                    </div>
                    <div className="card-body">
                      {followupAlerts.length === 0 && <div className="empty-row" style={{ padding: '16px 0' }}>No follow-ups due</div>}
                      <div className="fu-alert-list">
                        {followupAlerts.slice(0, 6).map(({ lead, date }) => {
                          const isOD = date && date < today;
                          return (
                            <div key={lead!.id} className={`fu-alert-item ${isOD ? 'fu-overdue' : 'fu-today-item'}`}>
                              <div className="lead-avatar">{lead!.clientName[0]}</div>
                              <div style={{ flex: 1 }}>
                                <div className="fu-alert-name">{lead!.clientName}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>₹{lead!.loanRequirement}</div>
                              </div>
                              <div className={`fu-chip ${isOD ? 'fu-overdue' : 'fu-today'}`}>{isOD ? '⚠ Overdue' : '● Today'}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ov-three-col">
                  {/* Meeting Requests */}
                  <div className="glass-card" style={{ marginBottom: 0 }}>
                    <div className="card-head">
                      <div><div className="card-title">Meeting requests</div><div className="card-sub">// approval status</div></div>
                    </div>
                    <div className="card-body">
                      {[
                        { label: 'Pending', val: pendingReqCount, color: 'var(--warning)' },
                        { label: 'Approved', val: approvedReqCount, color: 'var(--success)' },
                        { label: 'Rejected', val: myRequests.filter(r => r.status === 'Rejected').length, color: 'var(--danger)' },
                        { label: 'Total Sent', val: myRequests.length, color: 'var(--accent)' },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{item.label}</span>
                          <span style={{ fontSize: '18px', fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Call Log */}
                  <div className="glass-card" style={{ marginBottom: 0 }}>
                    <div className="card-head">
                      <div><div className="card-title">Recent call activity</div><div className="card-sub">// {totalCalls} total calls logged</div></div>
                    </div>
                    <div className="card-body">
                      <div className="call-timeline">
                        {Object.entries(callLogs).flatMap(([id, logs]) =>
                          logs.map(log => ({ id, log, lead: myLeads.find(l => l.id === id) }))
                        ).sort((a, b) => new Date(b.log.time).getTime() - new Date(a.log.time).getTime()).slice(0, 5).map((entry, i) => (
                          <div key={i} className="call-tl-item">
                            <div className="call-tl-dot" />
                            <div>
                              <div className="call-tl-name">{entry.lead?.clientName || 'Unknown'}</div>
                              <div className="call-tl-meta">{entry.log.note} · {timeAgo(entry.log.time)}</div>
                            </div>
                          </div>
                        ))}
                        {totalCalls === 0 && Object.keys(callLogs).length === 0 && <div className="empty-row" style={{ padding: '12px 0' }}>No calls logged yet</div>}
                      </div>
                    </div>
                  </div>

                  {/* Priority breakdown */}
                  <div className="glass-card" style={{ marginBottom: 0 }}>
                    <div className="card-head">
                      <div><div className="card-title">Lead priorities</div><div className="card-sub">// hot · warm · cold</div></div>
                    </div>
                    <div className="card-body">
                      {[
                        { label: 'Hot', val: todayLeads.filter(l => l.priority === 'Hot').length, cls: 'prio-hot' },
                        { label: 'Warm', val: todayLeads.filter(l => l.priority === 'Warm').length, cls: 'prio-warm' },
                        { label: 'Cold', val: todayLeads.filter(l => l.priority === 'Cold').length, cls: 'prio-cold' },
                        { label: 'Untagged', val: todayLeads.filter(l => !l.priority).length, cls: '' },
                      ].map(item => (
                        <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                          <span className={`prio-badge ${item.cls}`} style={!item.cls ? { color: 'var(--text3)', background: 'none', border: 'none' } : {}}>{item.label}</span>
                          <span style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ LEADS TAB ════ */}
            {activeTab === 'leads' && (
              <div className="fade-in">
                <div className="bo-topbar">
                  <div>
                    <div className="bo-page-title">Today's leads</div>
                    <div className="bo-page-sub">// {todayLeads.length} assigned · click row to expand</div>
                  </div>
                  <div className="bo-clock">{clock}</div>
                </div>
                {followupAlerts.length > 0 && (
                  <div className="alert-strip">
                    <span>{Icons.bell}</span>
                    <button className="cc-btn-sm cc-btn-ghost" style={{ borderColor: 'rgba(245,158,11,0.3)', color: 'var(--warning)' }} onClick={() => setActiveTab('history')}>
                      {/* {Icons.bell} {followupAlerts.length} follow-up{followupAlerts.length > 1 ? 's' : ''} due */}
                      <div className="alert-text"><strong style={{ color: 'var(--orange)' }}>{followupAlerts.length} follow-up{followupAlerts.length > 1 ? 's' : ''}</strong> due — {followupAlerts.map(f => f.lead?.clientName).join(', ')}</div>
                    </button>
                  </div>
                )}
                <div className="filter-bar">
                  <span className="filter-label">FILTER</span>
                  <select className="cc-select-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Lead Status</option>
                    {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="cc-select-sm" value={numberStatusFilter} onChange={e => setNumberStatusFilter(e.target.value)}>
                    <option value="all">All Number Status</option>
                    {numberStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {(statusFilter !== 'all' || numberStatusFilter !== 'all') && (
                    <button className="cc-clear-btn" onClick={() => { setStatusFilter('all'); setNumberStatusFilter('all'); }}>clear ×</button>
                  )}
                </div>
                <div className="glass-card">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Client</th><th>Phone · Calls</th><th>Loan Req.</th>
                        <th>Number Status</th><th>Lead Status</th><th>Priority · Follow-up</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTodayLeads.map(lead => renderLeadRow(lead, true))}
                      {filteredTodayLeads.length === 0 && <tr><td colSpan={7} className="empty-row">No leads found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════ HISTORY TAB ════ */}
            {activeTab === 'history' && (
              <div className="fade-in">
                <div className="bo-topbar">
                  <div>
                    <div className="bo-page-title">Lead history</div>
                    <div className="bo-page-sub">// all assigned leads · {filteredHistory.length} records</div>
                  </div>
                </div>
                <div className="filter-bar">
                  <span className="filter-label">DATE</span>
                  <input type="date" className="cc-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  <span className="filter-label">TO</span>
                  <input type="date" className="cc-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                  <select className="cc-select-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Lead Status</option>
                    {leadStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="cc-select-sm" value={numberStatusFilter} onChange={e => setNumberStatusFilter(e.target.value)}>
                    <option value="all">All Number Status</option>
                    {numberStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {(fromDate || toDate || statusFilter !== 'all' || numberStatusFilter !== 'all') && (
                    <button className="cc-clear-btn" onClick={() => { setFromDate(''); setToDate(''); setStatusFilter('all'); setNumberStatusFilter('all'); }}>clear ×</button>
                  )}
                </div>
                <div className="glass-card">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Client</th><th>Phone · Calls</th><th>Loan Req.</th>
                        <th>Number Status</th><th>Lead Status</th><th>Priority · Follow-up</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map(lead => renderLeadRow(lead, true))}
                      {filteredHistory.length === 0 && <tr><td colSpan={7} className="empty-row">No leads found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════ MEETINGS TAB ════ */}
            {activeTab === 'meetings' && (
              <div className="fade-in">
                <div className="bo-topbar">
                  <div>
                    <div className="bo-page-title">My meetings</div>
                    <div className="bo-page-sub">// scheduled and past</div>
                  </div>
                </div>
                <div className="filter-bar">
                  <span className="filter-label">DATE</span>
                  <input type="date" className="cc-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  <span className="filter-label">TO</span>
                  <input type="date" className="cc-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                  {(fromDate || toDate) && <button className="cc-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>}
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { label: 'Total', val: myMeetings.length, color: 'var(--accent)' },
                    { label: 'Scheduled', val: myMeetings.filter(m => m.status === 'Scheduled').length, color: 'var(--purple)' },
                    { label: 'Done', val: myMeetings.filter(m => ['Meeting Done', 'Converted', 'Follow-Up'].includes(m.status)).length, color: 'var(--success)' },
                    { label: 'Converted', val: myMeetings.filter(m => m.status === 'Converted').length, color: 'var(--success)' },
                  ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ padding: '16px' }}>
                      <div className="kpi-label">{k.label}</div>
                      <div className="kpi-val" style={{ color: k.color, fontSize: '30px' }}>{k.val}</div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="glass-card">
                  <div className="card-head"><div className="card-title">Date-wise summary</div></div>
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Total</th><th>Done</th><th>Not Done</th><th>Converted</th><th>Follow-Up</th></tr></thead>
                    <tbody>
                      {Object.entries(
                        myMeetings.reduce((acc, m) => { acc[m.date] = (acc[m.date] || 0) + 1; return acc; }, {} as Record<string, number>)
                      ).sort(([a], [b]) => b.localeCompare(a)).map(([date, count]) => {
                        const dm = myMeetings.filter(m => m.date === date);
                        return (
                          <tr key={date}>
                            <td className="primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{date}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{count}</td>
                            <td style={{ color: 'var(--success)' }}>{dm.filter(m => ['Meeting Done', 'Converted', 'Follow-Up'].includes(m.status)).length}</td>
                            <td style={{ color: 'var(--danger)' }}>{dm.filter(m => m.status === 'Not Done').length}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 600 }}>{dm.filter(m => m.status === 'Converted').length}</td>
                            <td style={{ color: 'var(--purple)' }}>{dm.filter(m => m.status === 'Follow-Up').length}</td>
                          </tr>
                        );
                      })}
                      {myMeetings.length === 0 && <tr><td colSpan={6} className="empty-row">No meetings found</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* Details */}
                <div className="glass-card">
                  <div className="card-head"><div className="card-title">Meeting details</div></div>
                  <table className="data-table">
                    <thead><tr><th>Date</th><th>Time</th><th>Client</th><th>Loan Amt</th><th>BDM</th><th>Type</th><th>Status</th></tr></thead>
                    <tbody>
                      {myMeetings.map(m => {
                        const lead = leads.find(l => l.id === m.leadId);
                        const bdm = users.find(u => u.id === m.bdmId);
                        return (
                          <tr key={m.id}>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>{m.date}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{m.timeSlot}</td>
                            <td className="primary">{lead?.clientName}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{lead?.loanRequirement}</td>
                            <td>{bdm?.name}</td>
                            <td><span className="product-chip">{m.meetingType}</span></td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {statusBadge(m.status)}
                                {m.bdoStatus && <span className="badge badge-done" style={{ fontSize: '9px' }}>{m.bdoStatus}</span>}
                                {m.miniLogin && <span className="badge badge-eligible" style={{ fontSize: '9px' }}>Mini Login</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {myMeetings.length === 0 && <tr><td colSpan={7} className="empty-row">No meetings</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════ REQUESTS TAB ════ */}
            {activeTab === 'requests' && (
              <div className="fade-in">
                <div className="bo-topbar">
                  <div>
                    <div className="bo-page-title">Meeting requests</div>
                    <div className="bo-page-sub">// {myRequests.length} total · {pendingReqCount} pending TC approval</div>
                  </div>
                </div>

                {/* Status summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '14px', marginBottom: '20px' }}>
                  {[
                    { label: 'Pending Approval', val: pendingReqCount, color: 'var(--warning)', badge: 'badge-pending' },
                    { label: 'Approved', val: approvedReqCount, color: 'var(--success)', badge: 'badge-approved' },
                    { label: 'Rejected', val: myRequests.filter(r => r.status === 'Rejected').length, color: 'var(--danger)', badge: 'badge-rejected' },
                  ].map(k => (
                    <div key={k.label} className="kpi-card" style={{ padding: '16px' }}>
                      <div className="kpi-label">{k.label}</div>
                      <div className="kpi-val" style={{ color: k.color, fontSize: '30px' }}>{k.val}</div>
                    </div>
                  ))}
                </div>

                {/* Request list */}
                <div className="glass-card">
                  <div className="card-head"><div className="card-title">All requests</div></div>
                  <table className="data-table">
                    <thead><tr><th>Client</th><th>Phone</th><th>Loan Req.</th><th>Lead Status</th><th>Request Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {myRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(req => {
                        const lead = leads.find(l => l.id === req.leadId);
                        return (
                          <tr key={req.id}>
                            <td className="primary">{lead?.clientName}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text3)' }}>{lead?.phoneNumber}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{lead?.loanRequirement}</td>
                            <td>{statusBadge(lead?.leadStatus || 'Pending')}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{req.createdAt}</td>
                            <td>{statusBadge(req.status === 'Pending' ? 'Pending Approval' : req.status)}</td>
                          </tr>
                        );
                      })}
                      {myRequests.length === 0 && <tr><td colSpan={6} className="empty-row">No requests sent yet</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      <DoubleConfirmModal
        isOpen={!!remarkToDelete}
        onClose={() => setRemarkToDelete(null)}
        onConfirm={() => { if (remarkToDelete) { deleteRemark(remarkToDelete); setRemarkToDelete(null); toast.success('Remark deleted'); } }}
        title="Delete Remark"
      />
    </>
  );
}