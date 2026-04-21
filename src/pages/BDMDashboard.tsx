import React, { useState, useMemo, useEffect } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { toast } from 'sonner';
import { MeetingStep1Status, Meeting } from '@/types/crm';
import MeetingDetailDialog from '@/components/MeetingDetailDialog';

// ─── Status options available to BDM ──────────────────────────────────────────
const step1Statuses = ['Reschedule', 'Pending', 'Reject'] as const;
type BDMStatus = typeof step1Statuses[number];

// ─── Theme type ────────────────────────────────────────────────────────────────
type Theme = 'dark' | 'light';

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────
const Icons = {
  dashboard: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  meetings: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  pending: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  back: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>,
  check: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  refresh: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  user: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  bell: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  // eye: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  sun: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  moon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  logout: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

// ─── Status Badge renderer ────────────────────────────────────────────────────
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    'Meeting Done': 'badge-done',
    'Converted': 'badge-converted',
    'Pending': 'badge-pending',
    'Scheduled': 'badge-scheduled',
    'Reject': 'badge-notdone',
    'Follow-Up': 'badge-followup',
    'Reschedule Requested': 'badge-reschedule',
    'Reschedule Sent': 'badge-reschedule',
    'Not Done': 'badge-notdone',
    'Connected': 'badge-connected',
    'Not Connected': 'badge-notconn',
    'Mobile Off': 'badge-mobileoff',
    'Interested': 'badge-interested',
    'Not Interested': 'badge-notint',
    'Eligible': 'badge-eligible',
    'Approved': 'badge-approved',
    'Rejected': 'badge-rejected',
    'Virtual': 'badge-done',
    'Walk-in': 'badge-followup',
  };
  return <span className={`badge ${map[status] || 'badge-pending'}`}>{status}</span>;
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BDMDashboard() {
  const { currentUser, leads, users, meetings, updateMeeting, logout } = useCRM();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [detailView, setDetailView] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pendingAssignMeeting, setPendingAssignMeeting] = useState<Meeting | null>(null);
  const [selectedBdoId, setSelectedBdoId] = useState('');
  const [infoMeeting, setInfoMeeting] = useState<Meeting | null>(null);

  // ── Theme state ──
  const [theme, setTheme] = useState<Theme>('dark');
  const isDark = theme === 'dark';

  // ── Live clock ──
  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const h = n.getHours().toString().padStart(2, '0');
      const m = n.getMinutes().toString().padStart(2, '0');
      const s = n.getSeconds().toString().padStart(2, '0');
      setClock(`${h}:${m}:${s} ${n.getHours() >= 12 ? 'PM' : 'AM'}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const myMeetings = useMemo(() => {
    let filtered = meetings.filter(m => m.bdmId === currentUser?.id);
    if (fromDate) filtered = filtered.filter(m => m.date >= fromDate);
    if (toDate) filtered = filtered.filter(m => m.date <= toDate);
    return filtered;
  }, [meetings, currentUser, fromDate, toDate]);

  // ── Pending meetings — status strictly 'Pending' ──────────────────────────
  const pendingMeetings = useMemo(() => {
    return myMeetings.filter(m => m.status === 'Pending');
  }, [myMeetings]);

  const today = new Date().toISOString().split('T')[0];
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const todayMeetings = myMeetings.filter(m => m.date === today);
  const upcomingMeetings = myMeetings.filter(m => m.date > today && m.status === 'Scheduled');

  // ── KPI counts ──
  const rescheduled = myMeetings.filter(m => m.status === 'Reschedule Requested').length;
  const pendingCount = myMeetings.filter(m => m.status === 'Pending' || m.status === 'Scheduled').length;
  const rejected = myMeetings.filter(m => m.status === 'Reject').length;
  const totalMeetings = myMeetings.length;

  const bdos = users.filter(u => u.role === 'BDO' && u.active);

  const handleStatusChange = (meeting: Meeting, status: BDMStatus) => {
    if (status === 'Pending') {
      setPendingAssignMeeting(meeting);
      setSelectedBdoId('');
    } else if (status === 'Reschedule') {
      updateMeeting(meeting.id, { status: 'Reschedule Requested' });
      toast.success('Reschedule request sent to TC');
    } else {
      updateMeeting(meeting.id, { status: status as MeetingStep1Status });
      toast.success(`Meeting status: ${status}`);
    }
  };

  const handleConfirmPendingAssignment = async () => {
    if (!pendingAssignMeeting) return;
    if (!selectedBdoId) { toast.error('Please select a BDO to assign'); return; }
    await updateMeeting(pendingAssignMeeting.id, { status: 'Pending', bdoId: selectedBdoId });
    toast.success('Meeting marked Pending and assigned to BDO');
    setPendingAssignMeeting(null);
    setSelectedBdoId('');
  };

  const getDetailMeetings = () => {
    switch (detailView) {
      case 'rescheduled': return myMeetings.filter(m => m.status === 'Reschedule Requested');
      case 'pending': return myMeetings.filter(m => m.status === 'Pending' || m.status === 'Scheduled');
      case 'rejected': return myMeetings.filter(m => m.status === 'Reject');
      default: return [];
    }
  };

  const detailTitle: Record<string, string> = {
    rescheduled: 'Reschedule Requested',
    pending: 'Pending / Scheduled',
    rejected: 'Rejected',
  };

  // ─── Tab switch helper — resets detailView on every tab change ────────────
  const switchTab = (tab: string) => {
    setActiveTab(tab);
    setDetailView(null);
  };

  // ─── Meeting table renderer ───────────────────────────────────────────────
  const renderMeetingTable = (meetingsList: Meeting[], showStatusDropdown = true) => (
    <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
      <colgroup>
        <col style={{ width: '88px' }} />
        <col style={{ width: '56px' }} />
        <col style={{ width: '110px' }} />
        <col style={{ width: '108px' }} />
        <col style={{ width: '80px' }} />
        <col style={{ width: '64px' }} />
        <col style={{ width: '64px' }} />
        <col style={{ width: '72px' }} />
        <col style={{ width: '108px' }} />
        <col style={{ width: '148px' }} />
        <col style={{ width: '36px' }} />
      </colgroup>
      <thead>
        <tr>
          <th>Date</th>
          <th>Time</th>
          <th>Client</th>
          <th>Phone</th>
          <th>Loan Amt</th>
          <th>TC</th>
          <th>BO</th>
          <th>Type</th>
          <th>Assigned BDO</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {meetingsList.map(m => {
          const lead = leads.find(l => l.id === m.leadId);
          const tc = users.find(u => u.id === m.tcId);
          const bo = users.find(u => u.id === m.boId);
          const assignedBdo = users.find(u => u.id === m.bdoId);
          const isRescheduleRequested = m.status === 'Reschedule Requested';

          return (
            <React.Fragment key={m.id}>
              <tr>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--accent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.date}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', fontWeight: 700, color: 'var(--text)' }}>{m.timeSlot}</td>
                <td className="primary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.clientName || lead?.clientName}</td>
                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead?.phoneNumber}</td>
                <td style={{ color: 'var(--accent)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>&#8377;{lead?.loanRequirement}</td>
                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tc?.name}</td>
                <td style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bo?.name}</td>
                <td><span className="product-chip">{m.meetingType}</span></td>
                <td style={{ overflow: 'hidden' }}>
                  {assignedBdo
                    ? <span className="badge badge-done" style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{Icons.user}&nbsp;{assignedBdo.name}</span>
                    : <span style={{ color: 'var(--text3)', fontSize: '11px' }}>—</span>
                  }
                </td>
                <td>
                  {isRescheduleRequested ? (
                    <span className="badge badge-reschedule">{Icons.refresh}&nbsp;Reschedule Sent</span>
                  ) : showStatusDropdown ? (
                    <select
                      className="cc-select"
                      style={{ width: '100%', fontSize: '11px', padding: '5px 6px' }}
                      value={m.status === 'Scheduled' ? '' : m.status}
                      onChange={e => e.target.value && handleStatusChange(m, e.target.value as BDMStatus)}
                    >
                      <option value="">Update Status</option>
                      {step1Statuses.map(s => (
                        <option key={s} value={s}>{s === 'Reschedule' ? '🔄 Reschedule' : s}</option>
                      ))}
                    </select>
                  ) : (
                    statusBadge(m.status)
                  )}
                </td>
                {/* <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                  <button className="bdm-view-btn" onClick={() => setInfoMeeting(m)}>
                    {Icons.eye}
                  </button>
                </td> */}
              </tr>

              {(m.location || m.state || m.productType || m.finalRequirement || m.collateralValue) && (
                <tr style={{ background: 'var(--bg3)' }}>
                  <td colSpan={11} style={{ padding: '7px 12px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '10px', color: 'var(--text2)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {m.location && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>Location:</span> {m.location}</span>}
                      {m.state && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>State:</span> {m.state}</span>}
                      {m.productType && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>Product:</span> <span className="product-chip">{m.productType}</span></span>}
                      {m.finalRequirement != null && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>Final Req:</span> &#8377;{m.finalRequirement}</span>}
                      {m.collateralValue != null && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>Collateral:</span> &#8377;{m.collateralValue}</span>}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
        {meetingsList.length === 0 && (
          <tr><td colSpan={11} className="empty-row">no meetings found</td></tr>
        )}
      </tbody>
    </table>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

        /* ── DARK THEME ── */
        .bdm-root.dark {
          --bg: #07080f; --bg2: #0d0f1a; --bg3: #12152a;
          --surface: #161929; --surface2: #1c2038;
          --border: rgba(255,255,255,0.06); --border2: rgba(255,255,255,0.1);
          --accent: #3d7fff; --success: #00d4aa; --warning: #f59e0b;
          --danger: #ff4757; --purple: #a78bfa; --orange: #ff6b35;
          --text: #e8eaf6; --text2: #8892b0; --text3: #4a5568;
        }

        /* ── LIGHT THEME ── */
        .bdm-root.light {
          --bg: #f4f5fa; --bg2: #ffffff; --bg3: #eef0f7;
          --surface: #ffffff; --surface2: #eef0f7;
          --border: rgba(0,0,0,0.07); --border2: rgba(0,0,0,0.12);
          --accent: #2563eb; --success: #059669; --warning: #d97706;
          --danger: #dc2626; --purple: #7c3aed; --orange: #ea580c;
          --text: #0f172a; --text2: #475569; --text3: #94a3b8;
        }

        .bdm-root {
          font-family: 'Syne', sans-serif;
          background: var(--bg); color: var(--text); min-height: 100vh;
          position: relative; transition: background 0.25s, color 0.25s;
        }
        .bdm-root.dark::before {
          content: ''; position: fixed; top: -50%; left: -50%;
          width: 200%; height: 200%;
          background:
            radial-gradient(ellipse 600px 400px at 20% 30%, rgba(61,127,255,0.06), transparent),
            radial-gradient(ellipse 500px 500px at 80% 70%, rgba(0,212,170,0.05), transparent),
            radial-gradient(ellipse 400px 300px at 50% 10%, rgba(167,139,250,0.04), transparent);
          pointer-events: none; z-index: 0;
        }
        .bdm-root.dark::after {
          content: ''; position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px; pointer-events: none; z-index: 0; opacity: 0.4;
        }

        .cc-layout { display: flex; min-height: 100vh; position: relative; z-index: 1; }

        /* ── SIDEBAR ── */
        .cc-sidebar {
          width: 240px; flex-shrink: 0; background: var(--bg2);
          border-right: 1px solid var(--border); display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh; overflow: hidden;
          transition: background 0.25s;
        }
        .cc-sidebar::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--accent), transparent); }
        .cc-logo-area { padding: 28px 24px 20px; border-bottom: 1px solid var(--border); }
        .cc-logo-tag { font-size: 9px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); font-family: 'JetBrains Mono', monospace; margin-bottom: 8px; }
        .cc-logo-name { font-size: 20px; font-weight: 800; background: linear-gradient(135deg, var(--text), var(--accent)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.2; }
        .cc-user-chip { margin: 16px 24px; background: var(--surface); border: 1px solid var(--border2); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; }
        .cc-user-avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--accent), var(--purple)); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .cc-user-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .cc-user-role { font-size: 10px; color: var(--accent); font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
        .cc-nav-section { padding: 8px 16px; margin-top: 4px; }
        .cc-nav-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; color: var(--text3); text-transform: uppercase; font-family: 'JetBrains Mono', monospace; padding: 0 8px; margin-bottom: 6px; }
        .cc-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; font-size: 13px; font-weight: 500; color: var(--text2); position: relative; margin-bottom: 2px; }
        .cc-nav-item:hover { background: var(--surface); color: var(--text); }
        .cc-nav-item.active { background: var(--surface2); color: var(--accent); }
        .cc-nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 60%; background: var(--accent); border-radius: 0 3px 3px 0; }
        .cc-nav-icon { width: 16px; height: 16px; opacity: 0.7; display: flex; align-items: center; justify-content: center; }
        .cc-nav-item.active .cc-nav-icon { opacity: 1; }

        /* ── NAV COUNT BADGE ── */
        .cc-nav-badge {
          margin-left: auto;
          font-size: 9px; font-weight: 700;
          background: rgba(245,158,11,0.15); color: var(--warning);
          border: 1px solid rgba(245,158,11,0.28);
          padding: 1px 7px; border-radius: 20px;
          font-family: 'JetBrains Mono', monospace; line-height: 1.6;
        }
        .cc-nav-item.active .cc-nav-badge {
          background: rgba(245,158,11,0.22); border-color: rgba(245,158,11,0.45);
        }

        /* ── SIDEBAR FOOTER ── */
        .cc-sidebar-footer { margin-top: auto; padding: 14px 20px; border-top: 1px solid var(--border); }
        .cc-footer-info { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; line-height: 1.6; }
        .cc-status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); margin-right: 5px; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }

        /* ── THEME TOGGLE ── */
        .cc-theme-toggle { display: flex; background: var(--bg3); border: 1px solid var(--border2); border-radius: 18px; padding: 3px; margin-bottom: 8px; cursor: pointer; }
        .cc-toggle-opt { display: flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 13px; font-size: 10px; font-weight: 600; color: var(--text3); transition: all 0.2s; font-family: 'JetBrains Mono', monospace; flex: 1; justify-content: center; }
        .cc-toggle-opt.active { background: var(--surface); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,0.15); }

        /* ── LOGOUT BUTTON ── */
        .cc-logout-btn { display: flex; align-items: center; gap: 7px; width: 100%; padding: 8px 11px; border-radius: 8px; font-size: 11px; font-weight: 600; color: var(--text2); cursor: pointer; background: var(--surface); border: 1px solid var(--border); transition: all 0.15s; font-family: inherit; }
        .cc-logout-btn:hover { color: var(--danger); border-color: rgba(255,71,87,0.3); background: rgba(255,71,87,0.05); }

        /* ── MAIN CONTENT ── */
        .cc-main { flex: 1; overflow: auto; padding: 32px 32px 60px; }
        .cc-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .cc-page-title { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: var(--text); }
        .cc-page-sub { font-size: 11px; color: var(--text2); margin-top: 3px; font-family: 'JetBrains Mono', monospace; }
        .cc-topbar-right { display: flex; align-items: center; gap: 12px; }
        .cc-clock { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text2); background: var(--surface); border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px; }
        .cc-alert-btn { background: var(--surface); border: 1px solid rgba(255,71,87,0.27); color: var(--danger); padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; animation: border-glow 3s infinite; }
        @keyframes border-glow { 0%, 100% { border-color: rgba(255,71,87,0.27); box-shadow: none } 50% { border-color: rgba(255,71,87,0.53); box-shadow: 0 0 12px rgba(255,71,87,0.13) } }

        /* ── DATE FILTER ── */
        .cc-date-filter { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 24px; }
        .cc-date-input { background: var(--surface); border: 1px solid var(--border2); border-radius: 8px; padding: 7px 12px; color: var(--text); font-size: 12px; font-family: 'JetBrains Mono', monospace; outline: none; }
        .cc-date-input:focus { border-color: var(--accent); }
        .cc-clear-btn { font-size: 11px; color: var(--text3); cursor: pointer; font-family: 'JetBrains Mono', monospace; padding: 7px 12px; border: 1px solid var(--border); border-radius: 8px; background: transparent; transition: all 0.15s; }
        .cc-clear-btn:hover { color: var(--text2); border-color: var(--border2); }
        .date-label { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

        /* ── KPI CARDS ── */
        .cc-kpi-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 28px; }
        .cc-kpi { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 22px 20px; position: relative; overflow: hidden; transition: transform 0.2s, border-color 0.2s; cursor: pointer; }
        .cc-kpi:hover { transform: translateY(-2px); }
        .cc-kpi.orange { border-color: rgba(255,107,53,0.13); }
        .cc-kpi.orange:hover { border-color: rgba(255,107,53,0.33); box-shadow: 0 0 40px rgba(255,107,53,0.13); }
        .cc-kpi.yellow { border-color: rgba(245,158,11,0.13); }
        .cc-kpi.yellow:hover { border-color: rgba(245,158,11,0.33); box-shadow: 0 0 40px rgba(245,158,11,0.13); }
        .cc-kpi.red { border-color: rgba(255,71,87,0.13); }
        .cc-kpi.red:hover { border-color: rgba(255,71,87,0.33); box-shadow: 0 0 40px rgba(255,71,87,0.13); }
        .cc-kpi::before { content: ''; position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; border-radius: 50%; opacity: 0.06; }
        .cc-kpi.orange::before { background: var(--orange); }
        .cc-kpi.yellow::before { background: var(--warning); }
        .cc-kpi.red::before { background: var(--danger); }
        .cc-kpi-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; }
        .cc-kpi-value { font-size: 42px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
        .cc-kpi.orange .cc-kpi-value { color: var(--orange); }
        .cc-kpi.yellow .cc-kpi-value { color: var(--warning); }
        .cc-kpi.red .cc-kpi-value { color: var(--danger); }
        .cc-kpi-sub { font-size: 11px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
        .cc-kpi-hint { font-size: 9px; color: var(--text3); margin-top: 6px; font-family: 'JetBrains Mono', monospace; }

        /* ── GLASS CARDS ── */
        .glass-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
        .card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 12px; border-bottom: 1px solid var(--border); }
        .card-title { font-size: 13px; font-weight: 700; color: var(--text); letter-spacing: 0.3px; }
        .card-sub { font-size: 10px; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }

        /* ── BACK BUTTON ── */
        .back-btn { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text2); cursor: pointer; font-family: 'JetBrains Mono', monospace; padding: 6px 12px; border: 1px solid var(--border); border-radius: 8px; background: transparent; transition: all 0.15s; margin-bottom: 16px; }
        .back-btn:hover { color: var(--text); border-color: var(--border2); }

        /* ── DATA TABLE ── */
        .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .data-table th { padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); font-family: 'JetBrains Mono', monospace; border-bottom: 1px solid var(--border); }
        .data-table td { padding: 11px 12px; border-bottom: 1px solid var(--border); color: var(--text2); vertical-align: middle; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tbody tr { transition: background 0.15s; }
        .data-table tbody tr:hover { background: var(--surface2); }
        .data-table td.primary { color: var(--text); font-weight: 600; }
        .empty-row { text-align: center; color: var(--text3); padding: 24px; font-size: 11px; font-family: 'JetBrains Mono', monospace; }
        .product-chip { font-size: 10px; background: var(--surface2); color: var(--text2); padding: 2px 8px; border-radius: 5px; font-family: 'JetBrains Mono', monospace; }

        /* ── STATUS BADGES ── */
        .badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 6px; letter-spacing: 0.5px; font-family: 'JetBrains Mono', monospace; }
        .badge-converted { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.13); }
        .badge-done { background: rgba(61,127,255,0.1); color: var(--accent); border: 1px solid rgba(61,127,255,0.13); }
        .badge-followup { background: rgba(167,139,250,0.1); color: var(--purple); border: 1px solid rgba(167,139,250,0.13); }
        .badge-notdone { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.13); }
        .badge-pending { background: rgba(245,158,11,0.1); color: var(--warning); border: 1px solid rgba(245,158,11,0.13); }
        .badge-scheduled { background: rgba(61,127,255,0.1); color: var(--accent); border: 1px solid rgba(61,127,255,0.13); }
        .badge-approved { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.13); }
        .badge-rejected { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.13); }
        .badge-interested { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.13); }
        .badge-notint { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.13); }
        .badge-eligible { background: rgba(61,127,255,0.1); color: var(--accent); border: 1px solid rgba(61,127,255,0.13); }
        .badge-connected { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.13); }
        .badge-notconn { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.13); }
        .badge-mobileoff { background: rgba(245,158,11,0.1); color: var(--warning); border: 1px solid rgba(245,158,11,0.13); }
        .badge-reschedule { background: rgba(255,107,53,0.1); color: var(--orange); border: 1px solid rgba(255,107,53,0.13); }

        /* ── VIEW BUTTON ── */
        .bdm-view-btn { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; background: var(--surface2); border: 1px solid var(--border2); color: var(--text2); cursor: pointer; transition: all 0.15s; padding: 0; }
        .bdm-view-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(61,127,255,0.08); }

        /* ── ACTION BUTTONS ── */
        .action-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600; padding: 5px 12px; border-radius: 7px; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; font-family: 'JetBrains Mono', monospace; }
        .btn-approve { background: rgba(0,212,170,0.1); color: var(--success); border-color: rgba(0,212,170,0.13); }
        .btn-approve:hover { background: rgba(0,212,170,0.17); border-color: var(--success); }
        .btn-cancel { background: rgba(255,71,87,0.1); color: var(--danger); border-color: rgba(255,71,87,0.13); }
        .btn-cancel:hover { background: rgba(255,71,87,0.17); border-color: var(--danger); }

        /* ── SELECT / INPUT ── */
        .cc-select, .cc-input {
          width: 100%; background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px;
          padding: 8px 10px; color: var(--text); font-size: 12px; font-family: 'Syne', sans-serif;
          outline: none; transition: border-color 0.15s;
        }
        .cc-select:focus, .cc-input:focus { border-color: var(--accent); }
        .cc-select option { background: var(--bg2); color: var(--text); }

        /* ── MODAL OVERLAY ── */
        .modal-overlay { position: fixed; inset: 0; background: rgba(255, 255, 255, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-box { background: var(--bg2); border: 1px solid var(--border2); border-radius: 20px; width: 460px; max-width: 95vw; padding: 28px; position: relative; box-shadow: 0 24px 60px rgba(0,0,0,0.6); }
        .modal-title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
        .modal-sub { font-size: 11px; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-bottom: 20px; }
        .modal-client-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px; margin-bottom: 18px; }
        .modal-client-name { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
        .modal-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; font-size: 11px; color: var(--text2); font-family: 'JetBrains Mono', monospace; }
        .modal-field { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px; margin-bottom: 6px; }
        .modal-footer { display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; }

        /* ── ALERT STRIP ── */
        .cc-alert-strip { background: linear-gradient(135deg, rgba(255,107,53,0.05), rgba(255,107,53,0.02)); border: 1px solid rgba(255,107,53,0.2); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; position: relative; overflow: hidden; }
        .cc-alert-strip::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--orange); }
        .cc-alert-text { font-size: 12px; color: var(--text); flex: 1; }
        .cc-alert-text strong { color: var(--orange); }

        /* ── PENDING INFO STRIP ── */
        .cc-pending-strip { background: linear-gradient(135deg, rgba(245,158,11,0.05), rgba(245,158,11,0.02)); border: 1px solid rgba(245,158,11,0.2); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; position: relative; overflow: hidden; }
        .cc-pending-strip::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--warning); }
        .cc-pending-strip-text { font-size: 12px; color: var(--text); flex: 1; }
        .cc-pending-strip-text strong { color: var(--warning); }

        /* ── FADE-IN ANIMATION ── */
        .fade-in { animation: fadeIn 0.25s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* ── TABLE SCROLL WRAPPER ── */
        .table-scroll { overflow-x: auto; }
      `}</style>

      <div className={`bdm-root ${theme}`}>
        <div className="cc-layout">

          {/* ════════════ SIDEBAR ════════════ */}
          <aside className="cc-sidebar">
            <div className="cc-logo-area">
              <div className="cc-logo-tag">CRM · BDM Portal</div>
              <div className="cc-logo-name">BDM<br />Dashboard</div>
            </div>
            <div className="cc-user-chip">
              <div className="cc-user-avatar">{currentUser?.name?.[0] ?? 'B'}</div>
              <div>
                <div className="cc-user-name">{currentUser?.name || 'BDM'}</div>
                <div className="cc-user-role">BUS. DEV. MGR</div>
              </div>
            </div>

            <div className="cc-nav-section">
              <div className="cc-nav-label">Navigation</div>

              {/* Dashboard */}
              <div
                className={`cc-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => switchTab('dashboard')}
              >
                <div className="cc-nav-icon">{Icons.dashboard}</div>
                Dashboard
              </div>

              {/* ── NEW: Pending Meetings (above All Meetings) ── */}
              <div
                className={`cc-nav-item ${activeTab === 'pending-meetings' ? 'active' : ''}`}
                onClick={() => switchTab('pending-meetings')}
              >
                <div className="cc-nav-icon">{Icons.pending}</div>
                Pending Meetings
                {pendingMeetings.length > 0 && (
                  <span className="cc-nav-badge">{pendingMeetings.length}</span>
                )}
              </div>

              {/* All Meetings */}
              <div
                className={`cc-nav-item ${activeTab === 'meetings' ? 'active' : ''}`}
                onClick={() => switchTab('meetings')}
              >
                <div className="cc-nav-icon">{Icons.meetings}</div>
                All Meetings
              </div>
            </div>

            {/* ── SIDEBAR FOOTER ── */}
            <div className="cc-sidebar-footer">
              <div className="cc-footer-info">
                <span className="cc-status-dot" />Active · {todayStr}<br />
                <span style={{ color: 'var(--text3)', marginTop: '2px', display: 'block' }}>
                  {rescheduled} reschedule · {pendingMeetings.length} pending
                </span>
                <span style={{ color: 'var(--text3)', display: 'block' }}>
                  {totalMeetings} total meetings
                </span>
              </div>

              <div className="cc-theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                <div className={`cc-toggle-opt ${isDark ? 'active' : ''}`}>{Icons.moon}&nbsp;Dark</div>
                <div className={`cc-toggle-opt ${!isDark ? 'active' : ''}`}>{Icons.sun}&nbsp;Light</div>
              </div>

              <button className="cc-logout-btn" onClick={logout}>
                {Icons.logout}&nbsp;Sign Out
              </button>
            </div>
          </aside>

          {/* ════════════ MAIN CONTENT ════════════ */}
          <main className="cc-main">

            {/* ══════════ DASHBOARD TAB ══════════ */}
            {activeTab === 'dashboard' && (
              <div className="fade-in">
                <div className="cc-topbar">
                  <div>
                    <div className="cc-page-title">
                      {detailView ? detailTitle[detailView] : `Good morning, ${currentUser?.name?.split(' ')[0] || 'BDM'}`}
                    </div>
                    <div className="cc-page-sub">
                      {detailView
                        ? `// ${getDetailMeetings().length} meetings · click row for details`
                        : `// ${todayStr} · ${totalMeetings} meetings in range`}
                    </div>
                  </div>
                  <div className="cc-topbar-right">
                    <div className="cc-clock">{clock}</div>
                    {rescheduled > 0 && !detailView && (
                      <button className="cc-alert-btn" onClick={() => setDetailView('rescheduled')}>
                        {Icons.bell} {rescheduled} Reschedule
                      </button>
                    )}
                  </div>
                </div>

                {!detailView && (
                  <div className="cc-date-filter">
                    <span className="date-label">FROM</span>
                    <input type="date" className="cc-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    <span className="date-label">TO</span>
                    <input type="date" className="cc-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                    {(fromDate || toDate) && (
                      <button className="cc-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>
                    )}
                  </div>
                )}

                {rescheduled > 0 && !detailView && (
                  <div className="cc-alert-strip">
                    <span style={{ fontSize: '16px' }}>🔄</span>
                    <div className="cc-alert-text">
                      <strong>{rescheduled} reschedule request{rescheduled > 1 ? 's' : ''}</strong> waiting — TC needs to be notified.
                    </div>
                  </div>
                )}

                {detailView ? (
                  <>
                    <button className="back-btn" onClick={() => setDetailView(null)}>
                      {Icons.back} back to dashboard
                    </button>
                    <div className="glass-card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">{detailTitle[detailView]}</div>
                          <div className="card-sub">// {getDetailMeetings().length} meetings</div>
                        </div>
                      </div>
                      <div className="table-scroll">
                        {renderMeetingTable(getDetailMeetings(), true)}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="cc-kpi-row">
                      <div className="cc-kpi orange" onClick={() => setDetailView('rescheduled')}>
                        <div className="cc-kpi-label">Reschedule Requested</div>
                        <div className="cc-kpi-value">{rescheduled}</div>
                        <div className="cc-kpi-sub">sent to TC</div>
                        <div className="cc-kpi-hint">↗ click to view</div>
                      </div>
                      <div className="cc-kpi yellow" onClick={() => setDetailView('pending')}>
                        <div className="cc-kpi-label">Pending</div>
                        <div className="cc-kpi-value">{pendingCount}</div>
                        <div className="cc-kpi-sub">awaiting action</div>
                        <div className="cc-kpi-hint">↗ click to view</div>
                      </div>
                      <div className="cc-kpi red" onClick={() => setDetailView('rejected')}>
                        <div className="cc-kpi-label">Rejected</div>
                        <div className="cc-kpi-value">{rejected}</div>
                        <div className="cc-kpi-sub">meetings rejected</div>
                        <div className="cc-kpi-hint">↗ click to view</div>
                      </div>
                    </div>

                    <div className="glass-card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">Today's Meetings</div>
                          <div className="card-sub">// {todayStr} · {todayMeetings.length} scheduled</div>
                        </div>
                      </div>
                      <div className="table-scroll">
                        {renderMeetingTable(todayMeetings, true)}
                      </div>
                    </div>

                    {upcomingMeetings.length > 0 && (
                      <div className="glass-card">
                        <div className="card-header">
                          <div>
                            <div className="card-title">Upcoming Meetings</div>
                            <div className="card-sub">// {upcomingMeetings.length} scheduled ahead</div>
                          </div>
                        </div>
                        <div className="table-scroll">
                          {renderMeetingTable(upcomingMeetings, true)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ══════════ PENDING MEETINGS TAB ══════════ */}
            {activeTab === 'pending-meetings' && (
              <div className="fade-in">
                <div className="cc-topbar">
                  <div>
                    <div className="cc-page-title">Pending Meetings</div>
                    <div className="cc-page-sub">
                      // meetings awaiting BDO action · {pendingMeetings.length} total
                    </div>
                  </div>
                  <div className="cc-topbar-right">
                    <div className="cc-clock">{clock}</div>
                  </div>
                </div>

                <div className="cc-date-filter">
                  <span className="date-label">FROM</span>
                  <input type="date" className="cc-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  <span className="date-label">TO</span>
                  <input type="date" className="cc-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                  {(fromDate || toDate) && (
                    <button className="cc-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>
                  )}
                </div>

                {pendingMeetings.length > 0 && (
                  <div className="cc-pending-strip">
                    <span style={{ fontSize: '16px' }}>⏳</span>
                    <div className="cc-pending-strip-text">
                      <strong>{pendingMeetings.length} pending meeting{pendingMeetings.length > 1 ? 's' : ''}</strong> — assigned to BDO, awaiting follow-up.
                    </div>
                  </div>
                )}

                <div className="glass-card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Pending Meetings</div>
                      <div className="card-sub">// status = Pending · {pendingMeetings.length} meetings</div>
                    </div>
                  </div>
                  <div className="table-scroll">
                    {renderMeetingTable(pendingMeetings, true)}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════ ALL MEETINGS TAB ══════════ */}
            {activeTab === 'meetings' && (
              <div className="fade-in">
                <div className="cc-topbar">
                  <div>
                    <div className="cc-page-title">All Meetings</div>
                    <div className="cc-page-sub">// complete meeting history · {myMeetings.length} total</div>
                  </div>
                  <div className="cc-topbar-right">
                    <div className="cc-clock">{clock}</div>
                  </div>
                </div>
                <div className="cc-date-filter">
                  <span className="date-label">FROM</span>
                  <input type="date" className="cc-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  <span className="date-label">TO</span>
                  <input type="date" className="cc-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                  {(fromDate || toDate) && (
                    <button className="cc-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>
                  )}
                </div>
                <div className="glass-card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Meeting History</div>
                      <div className="card-sub">// {myMeetings.length} meetings in selected range</div>
                    </div>
                  </div>
                  <div className="table-scroll">
                    {renderMeetingTable(myMeetings, true)}
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ══════════ BDO ASSIGNMENT MODAL ══════════ */}
      {pendingAssignMeeting && (() => {
        const lead = leads.find(l => l.id === pendingAssignMeeting.leadId);
        return (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { setPendingAssignMeeting(null); setSelectedBdoId(''); } }}>
            <div className="modal-box">
              <div className="modal-title">{Icons.user} Assign BDO & Mark as Pending</div>
              <div className="modal-sub">// select a BDO to handle this meeting</div>
              <div className="modal-client-card">
                <div className="modal-client-name">{pendingAssignMeeting.clientName || lead?.clientName}</div>
                <div className="modal-detail-grid">
                  {lead?.phoneNumber && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>Phone:</span> {lead.phoneNumber}</span>}
                  {lead?.loanRequirement && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>Loan Req:</span> &#8377;{lead.loanRequirement}</span>}
                  {pendingAssignMeeting.location && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>Location:</span> {pendingAssignMeeting.location}</span>}
                  {pendingAssignMeeting.state && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>State:</span> {pendingAssignMeeting.state}</span>}
                  {pendingAssignMeeting.productType && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>Product:</span> {pendingAssignMeeting.productType}</span>}
                  {pendingAssignMeeting.finalRequirement != null && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>Final Req:</span> &#8377;{pendingAssignMeeting.finalRequirement}</span>}
                  {pendingAssignMeeting.collateralValue != null && <span><span style={{ color: 'var(--text)', fontWeight: 600 }}>Collateral:</span> &#8377;{pendingAssignMeeting.collateralValue}</span>}
                </div>
              </div>
              <div className="modal-field">SELECT BDO TO ASSIGN</div>
              <select className="cc-select" value={selectedBdoId} onChange={e => setSelectedBdoId(e.target.value)}>
                <option value="">Choose a BDO...</option>
                {bdos.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                {bdos.length === 0 && <option disabled>No active BDOs found</option>}
              </select>
              <div className="modal-footer">
                <button className="action-btn btn-cancel" onClick={() => { setPendingAssignMeeting(null); setSelectedBdoId(''); }}>
                  {Icons.x} Cancel
                </button>
                <button
                  className="action-btn btn-approve"
                  style={{ opacity: selectedBdoId ? 1 : 0.4, cursor: selectedBdoId ? 'pointer' : 'not-allowed' }}
                  onClick={handleConfirmPendingAssignment}
                >
                  {Icons.check} Confirm & Assign BDO
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      ══════════ MEETING DETAIL DIALOG — Eye Button ══════════
      <MeetingDetailDialog
        isOpen={!!infoMeeting}
        meeting={infoMeeting}
        onClose={() => setInfoMeeting(null)}
      />
    </>
  );
}
