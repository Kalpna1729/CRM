import { useState, useMemo, useEffect } from 'react';
import { useCRM } from '@/contexts/CRMContext.tsx';
import { Meeting } from '@/types/crm.ts';
import { toast } from 'sonner';

type Tab = 'overview' | 'walkin' | 'login' | 'history';
type Theme = 'dark' | 'light';

// ─── Role colours — same palette across all dashboards ────────────────────────
const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  BDM: { bg: 'rgba(61,127,255,0.15)',  color: '#3d7fff' },
  BDO: { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
  BO:  { bg: 'rgba(0,212,170,0.15)',   color: '#00d4aa' },
  TC:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  FM:  { bg: 'rgba(255,107,53,0.15)',  color: '#ff6b35' },
  RM:  { bg: 'rgba(236,72,153,0.15)',  color: '#ec4899' },
  FO:  { bg: 'rgba(99,102,241,0.15)',  color: '#6366f1' },
};

const I = {
  overview: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  walkin:   <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><path d="M8 22l2-8-2-4h8l-2 4 2 8"/><path d="M6 11l2-3M18 11l-2-3"/></svg>,
  login:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>,
  history:  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  check:    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  invalid:  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  bell:     <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  sun:      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  moon:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  logout:   <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  msg:      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  clock:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  warn:     <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'Walking Done': '#00d4aa', 'Invalid': '#ff4757', 'Pending': '#f59e0b',
    'Scheduled': '#3d7fff', 'Meeting Done': '#00d4aa', 'Follow-up': '#a78bfa',
    'Walk-in Done': '#06b6d4',
  };
  const color = map[status] || '#8b8fa8';
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', fontFamily: "'JetBrains Mono',monospace", color, background: `${color}18`, border: `1px solid ${color}33` }}>
      {status || '—'}
    </span>
  );
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const W = 80, H = 28;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * (H - 4) - 2}`).join(' ');
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {data.map((v, i) => <circle key={i} cx={(i / (data.length - 1)) * W} cy={H - (v / max) * (H - 4) - 2} r="2" fill={color} />)}
    </svg>
  );
}

// ─── Date status helper ────────────────────────────────────────────────────────
// Returns: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | null
function getDateStatus(dateStr: string | undefined, today: string): 'overdue' | 'today' | 'tomorrow' | 'upcoming' | null {
  if (!dateStr) return null;
  if (dateStr < today) return 'overdue';
  if (dateStr === today) return 'today';
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'tomorrow';
  return 'upcoming';
}

function DateStatusPill({ status }: { status: ReturnType<typeof getDateStatus> }) {
  if (!status) return null;
  const cfg = {
    overdue:  { bg: 'rgba(255,71,87,0.12)',  color: '#ff4757', icon: '⚠', label: 'Overdue' },
    today:    { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', icon: '🔔', label: 'Today!' },
    tomorrow: { bg: 'rgba(6,182,212,0.12)',  color: '#06b6d4', icon: '⏰', label: 'Tomorrow' },
    upcoming: { bg: 'rgba(148,163,184,0.10)', color: '#8b8fa8', icon: '📅', label: 'Upcoming' },
  }[status];
  return (
    <span style={{
      fontSize: '9px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}33`,
      fontFamily: "'JetBrains Mono',monospace",
      display: 'inline-flex', alignItems: 'center', gap: '3px',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

export default function FODashboard() {
  const { currentUser, leads, users, meetings, meetingRemarks, addMeetingRemark, updateMeeting, addLoginUpdate, logout } = useCRM();

  const [activeTab, setActiveTab]               = useState<Tab>('overview');
  const [theme, setTheme]                       = useState<Theme>('light');
  const [clock, setClock]                       = useState('');
  const [miniLoginDates, setMiniLoginDates]     = useState<Record<string, string>>({});
  const [fullLoginDates, setFullLoginDates]     = useState<Record<string, string>>({});
  const [alerts, setAlerts]                     = useState<{ id: string; msg: string; type: 'warn' | 'info' | 'urgent' }[]>([]);
  const [dismissedAlerts, setDismissedAlerts]   = useState<Set<string>>(new Set());

  // RM selection modal state
  const [rmModal, setRmModal]                   = useState<{ meetingId: string; loginType: 'Mini Login' | 'Full Login' | 'Both' } | null>(null);
  const [selectedRmId, setSelectedRmId]         = useState<string>('');

  // Remark state per meeting
  const [expandedRemark, setExpandedRemark]     = useState<string | null>(null);
  const [remarkText, setRemarkText]             = useState<Record<string, string>>({});
  const [submitting, setSubmitting]             = useState<Record<string, boolean>>({});

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')} ${n.getHours()>=12?'PM':'AM'}`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const today    = new Date().toISOString().split('T')[0];
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const isDark   = theme === 'dark';

  const walkinPendingMeetings = useMemo(() =>
    // BDO 'Walk-in Done' set karta hai jab client aata hai — tab FO ko verify karna hota hai.
    // Pehle 'Follow-up' filter tha jo galat tha — BDO kabhi 'Follow-up' nahi bhejta FO ko.
    meetings.filter(m => m.bdoStatus === 'Walk-in Done' && !m.walkingStatus),
    [meetings]
  );

  const validMeetings = useMemo(() =>
    meetings.filter(m => m.walkingStatus === 'Walking Done'),
    [meetings]
  );

  const pendingLoginMeetings = useMemo(() =>
    validMeetings.filter(m => !m.miniLogin || !m.fullLogin),
    [validMeetings]
  );

  const dailyTrend = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      return meetings.filter(m => m.walkingStatus === 'Walking Done' && m.walkinDate === d.toISOString().split('T')[0]).length;
    }),
    [meetings]
  );

  // ── Build smart alerts including expected login date reminders ─────────────
  useEffect(() => {
    const newAlerts: typeof alerts = [];

    if (walkinPendingMeetings.length > 0)
      newAlerts.push({ id: 'walkin', msg: `${walkinPendingMeetings.length} walk-in(s) pending — mark Valid or Invalid`, type: 'warn' });

    if (pendingLoginMeetings.length > 0)
      newAlerts.push({ id: 'login', msg: `${pendingLoginMeetings.length} valid walk-in(s) pending login update`, type: 'info' });

    // Check expected mini login dates
    const miniDueToday = pendingLoginMeetings.filter(m => !m.miniLogin && m.miniLoginDate === today);
    const miniOverdue  = pendingLoginMeetings.filter(m => !m.miniLogin && m.miniLoginDate && m.miniLoginDate < today);
    if (miniOverdue.length > 0)
      newAlerts.push({ id: 'mini_overdue', msg: `${miniOverdue.length} Mini Login(s) OVERDUE — expected date has passed`, type: 'urgent' });
    if (miniDueToday.length > 0)
      newAlerts.push({ id: 'mini_today', msg: `${miniDueToday.length} Mini Login(s) due TODAY — complete now`, type: 'urgent' });

    // Check expected full login dates
    const fullDueToday = pendingLoginMeetings.filter(m => !m.fullLogin && m.fullLoginDate === today);
    const fullOverdue  = pendingLoginMeetings.filter(m => !m.fullLogin && m.fullLoginDate && m.fullLoginDate < today);
    if (fullOverdue.length > 0)
      newAlerts.push({ id: 'full_overdue', msg: `${fullOverdue.length} Full Login(s) OVERDUE — expected date has passed`, type: 'urgent' });
    if (fullDueToday.length > 0)
      newAlerts.push({ id: 'full_today', msg: `${fullDueToday.length} Full Login(s) due TODAY — complete now`, type: 'urgent' });

    // Tomorrow reminders
    const tom = new Date(today); tom.setDate(tom.getDate() + 1);
    const tomStr = tom.toISOString().split('T')[0];
    const miniTom = pendingLoginMeetings.filter(m => !m.miniLogin && m.miniLoginDate === tomStr).length;
    const fullTom = pendingLoginMeetings.filter(m => !m.fullLogin && m.fullLoginDate === tomStr).length;
    if (miniTom > 0)
      newAlerts.push({ id: 'mini_tom', msg: `${miniTom} Mini Login(s) expected tomorrow — prepare docs`, type: 'info' });
    if (fullTom > 0)
      newAlerts.push({ id: 'full_tom', msg: `${fullTom} Full Login(s) expected tomorrow — prepare docs`, type: 'info' });

    setAlerts(newAlerts);
  }, [walkinPendingMeetings.length, pendingLoginMeetings, today]);

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  // ── Remark helpers ─────────────────────────────────────────────────────────
  const getRoleInfo = (createdBy: string) => {
    const user = users.find(u => u.name === createdBy || u.id === createdBy);
    const role = user?.role || '';
    const style = ROLE_COLORS[role] || { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' };
    return { role, style };
  };

  const remarksByMeeting = useMemo(() => {
    const map: Record<string, any[]> = {};
    meetingRemarks.forEach(r => {
      if (!map[r.meetingId]) map[r.meetingId] = [];
      map[r.meetingId].push(r);
    });
    Object.keys(map).forEach(k => {
      map[k].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    return map;
  }, [meetingRemarks]);

  const handleAddRemark = async (meetingId: string) => {
    const text = (remarkText[meetingId] || '').trim();
    if (!text) { toast.error('Enter a remark'); return; }
    setSubmitting(p => ({ ...p, [meetingId]: true }));
    await addMeetingRemark(meetingId, text, currentUser?.name || 'FO');
    setRemarkText(p => ({ ...p, [meetingId]: '' }));
    setSubmitting(p => ({ ...p, [meetingId]: false }));
    toast.success('Remark saved');
  };

  const getLead = (leadId: string) => leads.find(l => l.id === leadId);

  // All active RM users for the dropdown
  const rmUsers = users.filter(u => u.role === 'RM' && u.active);

  const handleWalkingDone    = async (meetingId: string) => { await updateMeeting(meetingId, { walkingStatus: 'Walking Done', bdoStatus: 'Walk-in Done', foId: currentUser!.id }); toast.success('Walk-in marked as Valid ✓'); };
  const handleWalkingInvalid = async (meetingId: string) => { await updateMeeting(meetingId, { walkingStatus: 'Invalid', foId: currentUser!.id }); toast.success('Walk-in marked as Invalid'); };

  // Login karne se pehle RM select karne ka modal open karo
  const openLoginModal = (meetingId: string, loginType: 'Mini Login' | 'Full Login' | 'Both') => {
    const meeting = meetings.find(m => m.id === meetingId);
    setSelectedRmId(meeting?.rmId || '');  // already assigned RM pre-select karo
    setRmModal({ meetingId, loginType });
  };

  // Modal confirm hone pe actual login update karo
  const confirmLogin = async () => {
    if (!rmModal) return;
    const { meetingId, loginType } = rmModal;
    const date = loginType === 'Full Login' ? (fullLoginDates[meetingId] || today) : (miniLoginDates[meetingId] || today);

    const updates: any = { ...(selectedRmId ? { rmId: selectedRmId } : {}) };

    if (loginType === 'Mini Login') {
      updates.miniLogin = true;
      updates.miniLoginDate = date;
    } else if (loginType === 'Full Login') {
      updates.fullLogin = true;
      updates.fullLoginDate = date;
    } else {
      updates.miniLogin = true;
      updates.fullLogin = true;
      updates.miniLoginDate = today;
      updates.fullLoginDate = today;
    }

    await updateMeeting(meetingId, updates);
    await addLoginUpdate(meetingId, loginType, currentUser!.id);
    toast.success(`${loginType} done ✓${selectedRmId ? ' · RM assigned' : ''}`);
    setRmModal(null);
    setSelectedRmId('');
  };

  const handleMiniLogin = (meetingId: string) => openLoginModal(meetingId, 'Mini Login');
  const handleFullLogin = (meetingId: string) => openLoginModal(meetingId, 'Full Login');
  const handleBothLogin = (meetingId: string) => openLoginModal(meetingId, 'Both');

  // ── Save expected dates to DB ───────────────────────────────────────────────
  const handleSetExpectedMiniDate = async (meetingId: string, date: string) => {
    await updateMeeting(meetingId, { miniLoginDate: date });
    toast.success('Expected Mini Login date saved');
  };
  const handleSetExpectedFullDate = async (meetingId: string, date: string) => {
    await updateMeeting(meetingId, { fullLoginDate: date });
    toast.success('Expected Full Login date saved');
  };

  // ── Inline remark panel (same card style as BDO) ──────────────────────────
  const renderRemarkPanel = (m: Meeting) => {
    const mRemarks = remarksByMeeting[m.id] || [];
    const isOpen   = expandedRemark === m.id;
    return (
      <div style={{ marginTop: '8px' }}>
        {/* Toggle button */}
        <button
          onClick={() => setExpandedRemark(isOpen ? null : m.id)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '6px',
            background: isOpen ? 'rgba(99,102,241,0.12)' : mRemarks.length > 0 ? 'rgba(0,212,170,0.08)' : 'var(--surface2)',
            color: isOpen ? '#6366f1' : mRemarks.length > 0 ? 'var(--success)' : 'var(--text3)',
            border: isOpen ? '1px solid rgba(99,102,241,0.3)' : mRemarks.length > 0 ? '1px solid rgba(0,212,170,0.25)' : '1px solid var(--border2)',
            fontSize: '10px', fontWeight: 600, fontFamily: "'JetBrains Mono',monospace",
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {I.msg}
          {mRemarks.length > 0 ? ` ${mRemarks.length} Remark${mRemarks.length > 1 ? 's' : ''}` : ' Add Remark'}
          <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: '8px' }}>▼</span>
        </button>

        {/* Remarks panel — same card design as BDO */}
        {isOpen && (
          <div style={{
            marginTop: '8px',
            background: 'var(--bg3)', border: '1px solid var(--border2)',
            borderRadius: '8px', padding: '10px',
          }}>
            {/* Existing remarks */}
            <div style={{ maxHeight: '150px', overflowY: 'auto', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {mRemarks.length === 0 && (
                <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace', textAlign: 'center', padding: '8px 0' }}>No remarks yet</div>
              )}
              {mRemarks.map(r => {
                const { role, style } = getRoleInfo(r.createdBy);
                return (
                  <div key={r.id} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: '6px', padding: '6px 9px',
                  }}>
                    {/* Remark text */}
                    <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '4px' }}>{r.remark}</div>
                    {/* Footer: name + role badge + time */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: 'monospace' }}>{r.createdBy}</span>
                      {role && (
                        <span style={{
                          fontSize: '8px', fontWeight: 700,
                          padding: '1px 6px', borderRadius: '20px',
                          background: style.bg, color: style.color,
                          border: `1px solid ${style.color}40`,
                          fontFamily: "'JetBrains Mono',monospace",
                        }}>{role}</span>
                      )}
                      <span style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: 'monospace', marginLeft: 'auto' }}>
                        {new Date(r.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add remark input — same style as BDO */}
            <div style={{ display: 'flex', gap: '5px' }}>
              <input
                value={remarkText[m.id] || ''}
                onChange={e => setRemarkText(p => ({ ...p, [m.id]: e.target.value }))}
                placeholder="Add remark... (Enter to submit)"
                onKeyDown={e => { if (e.key === 'Enter') handleAddRemark(m.id); }}
                style={{
                  flex: 1, background: 'var(--surface)', border: '1px solid var(--border2)',
                  borderRadius: '6px', padding: '5px 8px', color: 'var(--text)',
                  fontSize: '11px', outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={() => handleAddRemark(m.id)}
                disabled={submitting[m.id]}
                style={{
                  padding: '5px 10px', borderRadius: '6px', border: 'none',
                  background: 'var(--teal)', color: '#fff',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  opacity: submitting[m.id] ? 0.6 : 1,
                }}
              >{I.msg}</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
        .fo-root.dark{--bg:#07080f;--bg2:#0d0f1a;--bg3:#12152a;--surface:#161929;--surface2:#1c2038;--border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.1);--accent:#3d7fff;--success:#00d4aa;--warning:#f59e0b;--danger:#ff4757;--purple:#a78bfa;--orange:#ff6b35;--teal:#06b6d4;--text:#e8eaf6;--text2:#8892b0;--text3:#4a5568;}
        .fo-root.light{--bg:#f4f5fa;--bg2:#ffffff;--bg3:#eef0f7;--surface:#ffffff;--surface2:#eef0f7;--border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.12);--accent:#2563eb;--success:#059669;--warning:#d97706;--danger:#dc2626;--purple:#7c3aed;--orange:#ea580c;--teal:#0891b2;--text:#0f172a;--text2:#475569;--text3:#94a3b8;}
        .fo-root{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
        .fo-layout{display:flex;min-height:100vh;}
        .fo-sidebar{width:220px;flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow:hidden;}
        .fo-sidebar::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--teal),var(--accent),transparent);}
        .fo-brand{padding:22px 20px 16px;border-bottom:1px solid var(--border);}
        .fo-brand-tag{font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--teal);font-family:'JetBrains Mono',monospace;margin-bottom:6px;}
        .fo-brand-name{font-size:17px;font-weight:800;color:var(--text);line-height:1.2;}
        .fo-user{margin:12px 18px;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:10px;display:flex;align-items:center;gap:9px;}
        .fo-user-ava{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,var(--teal),var(--accent));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}
        .fo-user-name{font-size:12px;font-weight:600;color:var(--text);}
        .fo-user-role{font-size:9px;color:var(--teal);font-family:'JetBrains Mono',monospace;letter-spacing:1px;}
        .fo-nav-section{padding:6px 12px;margin-top:2px;}
        .fo-nav-label{font-size:9px;font-weight:600;letter-spacing:2.5px;color:var(--text3);text-transform:uppercase;font-family:'JetBrains Mono',monospace;padding:0 8px;margin-bottom:3px;}
        .fo-nav-item{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:9px;cursor:pointer;transition:all 0.15s;font-size:12px;font-weight:500;color:var(--text2);position:relative;margin-bottom:1px;}
        .fo-nav-item:hover{background:var(--surface2);color:var(--text);}
        .fo-nav-item.active{background:var(--surface2);color:var(--teal);}
        .fo-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;background:var(--teal);border-radius:0 3px 3px 0;}
        .fo-nav-icon{width:16px;height:16px;opacity:0.6;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .fo-nav-item.active .fo-nav-icon{opacity:1;}
        .fo-nav-badge{margin-left:auto;font-size:9px;font-weight:700;background:var(--danger);color:#fff;padding:1px 6px;border-radius:8px;font-family:'JetBrains Mono',monospace;}
        .fo-nav-badge.info{background:var(--teal);}
        .fo-sidebar-foot{margin-top:auto;padding:12px 18px;border-top:1px solid var(--border);}
        .fo-status-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--success);margin-right:5px;animation:pdot 2s infinite;}
        @keyframes pdot{0%,100%{opacity:1}50%{opacity:0.3}}
        .fo-footer-info{font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:10px;}
        .fo-theme-toggle{display:flex;background:var(--bg3);border:1px solid var(--border2);border-radius:18px;padding:3px;margin-bottom:8px;cursor:pointer;}
        .fo-toggle-opt{display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:13px;font-size:10px;font-weight:600;color:var(--text3);transition:all 0.2s;font-family:'JetBrains Mono',monospace;flex:1;justify-content:center;}
        .fo-toggle-opt.active{background:var(--surface);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,0.15);}
        .fo-logout-btn{display:flex;align-items:center;gap:7px;width:100%;padding:8px 11px;border-radius:8px;font-size:11px;font-weight:600;color:var(--text2);cursor:pointer;background:var(--surface);border:1px solid var(--border);transition:all 0.15s;font-family:inherit;}
        .fo-main{flex:1;overflow:auto;padding:26px 28px 60px;}
        .fo-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .fo-page-title{font-size:22px;font-weight:800;letter-spacing:-0.5px;color:var(--text);}
        .fo-page-sub{font-size:10px;color:var(--text2);margin-top:2px;font-family:'JetBrains Mono',monospace;}
        .fo-clock{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text2);background:var(--surface);border:1px solid var(--border);padding:6px 12px;border-radius:7px;}
        .fo-kpi-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px;}
        .fo-kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:15px 14px;transition:transform 0.15s;}
        .fo-kpi-card:hover{transform:translateY(-2px);}
        .fo-kpi-label{font-size:9px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text2);font-family:'JetBrains Mono',monospace;margin-bottom:7px;}
        .fo-kpi-val{font-size:32px;font-weight:800;line-height:1;margin-bottom:6px;}
        .fo-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:14px;}
        .fo-card-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 10px;border-bottom:1px solid var(--border);}
        .fo-card-title{font-size:12px;font-weight:700;color:var(--text);}
        .fo-card-sub{font-size:10px;color:var(--text2);font-family:'JetBrains Mono',monospace;margin-top:2px;}
        .fo-card-body{padding:14px 16px;}
        .fo-table{width:100%;border-collapse:collapse;font-size:11px;}
        .fo-table th{padding:8px 10px;text-align:left;font-size:9px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text3);font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--border);}
        .fo-td{padding:9px 10px;border-bottom:1px solid var(--border);vertical-align:top;}
        .fo-table tr:last-child .fo-td{border-bottom:none;}
        .fo-table tbody tr:hover{background:var(--surface2);}
        .fo-pri{color:var(--text);font-weight:600;}
        .fo-empty{text-align:center;color:var(--text3);padding:20px;font-size:10px;font-family:'JetBrains Mono',monospace;}
        .fo-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:7px;font-size:10px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:'JetBrains Mono',monospace;border:1px solid transparent;}
        .fo-btn-valid{background:rgba(0,212,170,0.1);color:var(--success);border-color:rgba(0,212,170,0.2);}
        .fo-btn-invalid{background:rgba(255,71,87,0.1);color:var(--danger);border-color:rgba(255,71,87,0.2);}
        .fo-btn-mini{background:rgba(245,158,11,0.1);color:var(--warning);border-color:rgba(245,158,11,0.2);}
        .fo-btn-full{background:rgba(61,127,255,0.1);color:var(--accent);border-color:rgba(61,127,255,0.2);}
        .fo-btn-both{background:rgba(167,139,250,0.1);color:var(--purple);border-color:rgba(167,139,250,0.2);}

        /* date input with save button */
        .fo-date-row{display:flex;align-items:center;gap:4px;margin-top:3px;}
        .fo-date-input{background:var(--bg3);border:1px solid var(--border2);border-radius:6px;padding:4px 7px;color:var(--text);font-size:11px;outline:none;font-family:'JetBrains Mono',monospace;width:132px;}
        .fo-date-save{padding:3px 8px;border-radius:5px;border:none;background:var(--teal);color:#fff;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap;}

        /* alerts */
        .alert-list{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;}
        .alert-item{display:flex;align-items:center;gap:10px;padding:9px 13px;border-radius:9px;position:relative;overflow:hidden;}
        .alert-warn{background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);}
        .alert-info{background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.18);}
        .alert-urgent{background:rgba(255,71,87,0.07);border:1px solid rgba(255,71,87,0.25);animation:pulse-border 2s infinite;}
        @keyframes pulse-border{0%,100%{border-color:rgba(255,71,87,0.25)}50%{border-color:rgba(255,71,87,0.55);box-shadow:0 0 12px rgba(255,71,87,0.12)}}
        .alert-warn::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--warning);}
        .alert-info::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--teal);}
        .alert-urgent::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--danger);}
        .alert-msg{font-size:12px;color:var(--text);flex:1;}
        .alert-dismiss{font-size:10px;color:var(--text3);cursor:pointer;padding:2px 8px;border:1px solid var(--border2);border-radius:5px;background:transparent;}
        .alert-go{font-size:10px;cursor:pointer;padding:2px 8px;border-radius:5px;background:transparent;border:1px solid;}
        .alert-warn .alert-go{color:var(--warning);border-color:rgba(245,158,11,0.3);}
        .alert-info .alert-go{color:var(--teal);border-color:rgba(6,182,212,0.3);}
        .alert-urgent .alert-go{color:var(--danger);border-color:rgba(255,71,87,0.3);}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeInUp 0.25s ease forwards;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px;}
      `}</style>

      <div className={`fo-root ${theme}`}>
        <div className="fo-layout">

          {/* ── SIDEBAR ── */}
          <aside className="fo-sidebar">
            <div className="fo-brand">
              <div className="fo-brand-tag">CRM · FO Portal</div>
              <div className="fo-brand-name">Field<br />Officer</div>
            </div>
            <div className="fo-user">
              <div className="fo-user-ava">{currentUser?.name?.[0] ?? 'F'}</div>
              <div>
                <div className="fo-user-name">{currentUser?.name || 'FO'}</div>
                <div className="fo-user-role">FIELD OFFICER</div>
              </div>
            </div>
            <div className="fo-nav-section">
              <div className="fo-nav-label">Dashboard</div>
              {([
                { id: 'overview', label: 'Overview',  icon: I.overview },
                { id: 'walkin',   label: 'Walk-in',   icon: I.walkin,  badge: walkinPendingMeetings.length > 0 ? walkinPendingMeetings.length : null },
                { id: 'login',    label: 'Login',     icon: I.login,   badge: pendingLoginMeetings.length > 0 ? pendingLoginMeetings.length : null, badgeCls: 'info' },
                { id: 'history',  label: 'History',   icon: I.history },
              ] as any[]).map(item => (
                <div key={item.id} className={`fo-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                  <div className="fo-nav-icon">{item.icon}</div>
                  {item.label}
                  {item.badge ? <span className={`fo-nav-badge ${item.badgeCls || ''}`}>{item.badge}</span> : null}
                </div>
              ))}
            </div>
            <div className="fo-sidebar-foot">
              <div className="fo-footer-info">
                <span className="fo-status-dot" />Active · {todayStr}<br />
                <span style={{ color: 'var(--text3)', marginTop: '2px', display: 'block' }}>{walkinPendingMeetings.length} walkin · {pendingLoginMeetings.length} login pending</span>
              </div>
              <div className="fo-theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                <div className={`fo-toggle-opt ${isDark ? 'active' : ''}`}>{I.moon} Dark</div>
                <div className={`fo-toggle-opt ${!isDark ? 'active' : ''}`}>{I.sun} Light</div>
              </div>
              <button className="fo-logout-btn" onClick={logout}>{I.logout} Sign Out</button>
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main className="fo-main">

            {/* Alerts */}
            {visibleAlerts.length > 0 && (
              <div className="alert-list">
                {visibleAlerts.map(alert => (
                  <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                    <span style={{ fontSize: '14px' }}>
                      {alert.type === 'urgent' ? '🔴' : alert.type === 'warn' ? '⚠' : 'ℹ'}
                    </span>
                    <span className="alert-msg">{alert.msg}</span>
                    <button className="alert-go" onClick={() => setActiveTab(alert.id.includes('walkin') ? 'walkin' : 'login')}>View →</button>
                    <button className="alert-dismiss" onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* ══════════ OVERVIEW ══════════ */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <div className="fo-topbar">
                  <div>
                    <div className="fo-page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {currentUser?.name?.split(' ')[0] || 'FO'}</div>
                    <div className="fo-page-sub">// Field Officer Dashboard · {todayStr}</div>
                  </div>
                  <div className="fo-clock">{clock}</div>
                </div>
                <div className="fo-kpi-row">
                  {[
                    { label: 'Walkin Pending',   val: walkinPendingMeetings.length,            color: 'var(--warning)' },
                    { label: 'Walkin Valid',      val: validMeetings.length,                    color: 'var(--success)' },
                    { label: 'Mini Login Done',   val: meetings.filter(m => m.miniLogin).length,color: 'var(--warning)' },
                    { label: 'Full Login Done',   val: meetings.filter(m => m.fullLogin).length,color: 'var(--accent)'  },
                  ].map(k => (
                    <div key={k.label} className="fo-kpi-card">
                      <div className="fo-kpi-label">{k.label}</div>
                      <div className="fo-kpi-val" style={{ color: k.color }}>{k.val}</div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                        <Sparkline data={dailyTrend} color={k.color} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Today walkins */}
                <div className="fo-card">
                  <div className="fo-card-head">
                    <div>
                      <div className="fo-card-title">Today's Walk-ins</div>
                      <div className="fo-card-sub">// {meetings.filter(m => m.walkinDate === today).length} scheduled today</div>
                    </div>
                  </div>
                  <table className="fo-table">
                    <thead><tr><th>Client</th><th>Phone</th><th>Walk-in Date</th><th>Location</th><th>Status</th></tr></thead>
                    <tbody>
                      {meetings.filter(m => m.walkinDate === today).map(m => {
                        const lead = getLead(m.leadId);
                        return (
                          <tr key={m.id}>
                            <td className="fo-td fo-pri">{lead?.clientName || lead?.clientName || '—'}</td>
                            <td className="fo-td" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{lead?.phoneNumber || '—'}</td>
                            <td className="fo-td" style={{ fontSize: '11px' }}>{m.walkinDate}</td>
                            <td className="fo-td" style={{ fontSize: '11px' }}>{lead?.address || '—'}</td>
                            <td className="fo-td"><StatusBadge status={m.walkingStatus || 'Pending'} /></td>
                          </tr>
                        );
                      })}
                      {meetings.filter(m => m.walkinDate === today).length === 0 && (
                        <tr><td colSpan={5} className="fo-empty">No walk-ins today</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════ WALK-IN TAB ══════════ */}
            {activeTab === 'walkin' && (
              <div className="fade-in">
                <div className="fo-topbar">
                  <div>
                    <div className="fo-page-title">Walk-in Verification</div>
                    <div className="fo-page-sub">// {walkinPendingMeetings.length} pending — mark valid or invalid</div>
                  </div>
                  <div className="fo-clock">{clock}</div>
                </div>
                {walkinPendingMeetings.length === 0 ? (
                  <div className="fo-card"><div className="fo-card-body" style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontSize: '12px' }}>no walk-ins pending verification</div></div>
                ) : (
                  <div className="fo-card">
                    <div className="fo-card-head"><div className="fo-card-title">Pending Walk-in Verification ({walkinPendingMeetings.length})</div></div>
                    <table className="fo-table">
                      <thead><tr><th>Client</th><th>Phone</th><th>Walk-in Date</th><th>Location</th><th>Loan Req.</th><th>Actions & Remarks</th></tr></thead>
                      <tbody>
                        {walkinPendingMeetings.map(m => {
                          const lead = getLead(m.leadId);
                          const isOverdue = m.walkinDate && m.walkinDate < today;
                          return (
                            <tr key={m.id} style={{ background: isOverdue ? 'rgba(255,71,87,0.03)' : undefined }}>
                              <td className="fo-td fo-pri">
                                <div>{lead?.clientName || lead?.clientName || '—'}</div>
                                {isOverdue && <div style={{ fontSize: '9px', color: 'var(--danger)', marginTop: '2px' }}>⚠ Overdue</div>}
                              </td>
                              <td className="fo-td" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{lead?.phoneNumber || '—'}</td>
                              <td className="fo-td" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{m.walkinDate}</td>
                              <td className="fo-td" style={{ fontSize: '11px' }}>{lead?.address || '—'}</td>
                              <td className="fo-td" style={{ fontSize: '11px' }}>₹{lead?.loanRequirement || '—'}</td>
                              <td className="fo-td">
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                                  <button className="fo-btn fo-btn-valid" onClick={() => handleWalkingDone(m.id)}>{I.check} Valid</button>
                                  <button className="fo-btn fo-btn-invalid" onClick={() => handleWalkingInvalid(m.id)}>{I.invalid} Invalid</button>
                                </div>
                                {renderRemarkPanel(m)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ══════════ LOGIN TAB ══════════ */}
            {activeTab === 'login' && (
              <div className="fade-in">
                <div className="fo-topbar">
                  <div>
                    <div className="fo-page-title">Login Management</div>
                    <div className="fo-page-sub">// set expected dates · track reminders · mark done</div>
                  </div>
                  <div className="fo-clock">{clock}</div>
                </div>

                <div className="fo-kpi-row">
                  {[
                    { label: 'Pending Login',  val: pendingLoginMeetings.length,             color: 'var(--warning)' },
                    { label: 'Mini Login Done',val: meetings.filter(m => m.miniLogin).length, color: 'var(--warning)' },
                    { label: 'Full Login Done',val: meetings.filter(m => m.fullLogin).length, color: 'var(--accent)'  },
                    { label: 'Both Done',      val: meetings.filter(m => m.miniLogin && m.fullLogin).length, color: 'var(--purple)' },
                  ].map(k => (
                    <div key={k.label} className="fo-kpi-card">
                      <div className="fo-kpi-label">{k.label}</div>
                      <div className="fo-kpi-val" style={{ color: k.color, fontSize: '28px' }}>{k.val}</div>
                    </div>
                  ))}
                </div>

                {pendingLoginMeetings.length === 0 ? (
                  <div className="fo-card"><div className="fo-card-body" style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontSize: '12px' }}>all logins updated</div></div>
                ) : (
                  <div className="fo-card">
                    <div className="fo-card-head">
                      <div>
                        <div className="fo-card-title">Pending Login Update ({pendingLoginMeetings.length})</div>
                        <div className="fo-card-sub">// set expected dates · reminders auto-trigger on due date  </div>
                      </div>
                    </div>
                    <table className="fo-table">
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>Phone</th>
                          <th>Walk-in Date</th>
                          {/* ── RENAMED COLUMNS ── */}
                          <th>Expected Mini Login Date</th>
                          <th>Expected Full Login Date</th>
                          <th>Actions & Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingLoginMeetings.map(m => {
                          const lead = getLead(m.leadId);
                          const miniStatus = getDateStatus(m.miniLoginDate, today);
                          const fullStatus = getDateStatus(m.fullLoginDate, today);
                          const rowBg = (miniStatus === 'overdue' || fullStatus === 'overdue')
                            ? 'rgba(255,71,87,0.03)'
                            : (miniStatus === 'today' || fullStatus === 'today')
                            ? 'rgba(245,158,11,0.03)'
                            : undefined;

                          return (
                            <tr key={m.id} style={{ background: rowBg }}>
                              <td className="fo-td fo-pri">{lead?.clientName || lead?.clientName || '—'}</td>
                              <td className="fo-td" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{lead?.phoneNumber || '—'}</td>
                              <td className="fo-td" style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text3)' }}>{m.walkinDate || '—'}</td>

                              {/* Expected Mini Login Date */}
                              <td className="fo-td">
                                {m.miniLogin ? (
                                  <span style={{ fontSize: '11px', color: 'var(--success)' }}>✓ Done {m.miniLoginDate ? `· ${m.miniLoginDate}` : ''}</span>
                                ) : (
                                  <div>
                                    <div className="fo-date-row">
                                      <input
                                        type="date"
                                        className="fo-date-input"
                                        value={miniLoginDates[m.id] ?? m.miniLoginDate ?? ''}
                                        onChange={e => setMiniLoginDates(p => ({ ...p, [m.id]: e.target.value }))}
                                      />
                                      <button
                                        className="fo-date-save"
                                        onClick={() => handleSetExpectedMiniDate(m.id, miniLoginDates[m.id] || '')}
                                        disabled={!miniLoginDates[m.id]}
                                        style={{ opacity: miniLoginDates[m.id] ? 1 : 0.4, cursor: miniLoginDates[m.id] ? 'pointer' : 'not-allowed' }}
                                      >Save</button>
                                    </div>
                                    {/* Reminder pill */}
                                    {miniStatus && (
                                      <div style={{ marginTop: '4px' }}>
                                        <DateStatusPill status={miniStatus} />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Expected Full Login Date */}
                              <td className="fo-td">
                                {m.fullLogin ? (
                                  <span style={{ fontSize: '11px', color: 'var(--accent)' }}>✓ Done {m.fullLoginDate ? `· ${m.fullLoginDate}` : ''}</span>
                                ) : (
                                  <div>
                                    <div className="fo-date-row">
                                      <input
                                        type="date"
                                        className="fo-date-input"
                                        value={fullLoginDates[m.id] ?? m.fullLoginDate ?? ''}
                                        onChange={e => setFullLoginDates(p => ({ ...p, [m.id]: e.target.value }))}
                                      />
                                      <button
                                        className="fo-date-save"
                                        onClick={() => handleSetExpectedFullDate(m.id, fullLoginDates[m.id] || '')}
                                        disabled={!fullLoginDates[m.id]}
                                        style={{ opacity: fullLoginDates[m.id] ? 1 : 0.4, cursor: fullLoginDates[m.id] ? 'pointer' : 'not-allowed' }}
                                      >Save</button>
                                    </div>
                                    {fullStatus && (
                                      <div style={{ marginTop: '4px' }}>
                                        <DateStatusPill status={fullStatus} />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Action buttons + Remark */}
                              <td className="fo-td">
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                  {!m.miniLogin && <button className="fo-btn fo-btn-mini" onClick={() => handleMiniLogin(m.id)}>Mini ✓</button>}
                                  {!m.fullLogin && <button className="fo-btn fo-btn-full" onClick={() => handleFullLogin(m.id)}>Full ✓</button>}
                                  {!m.miniLogin && !m.fullLogin && <button className="fo-btn fo-btn-both" onClick={() => handleBothLogin(m.id)}>Both ✓</button>}
                                </div>
                              </td>
                                {renderRemarkPanel(m)}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Login Done section */}
                <div className="fo-card">
                  <div className="fo-card-head">
                    <div className="fo-card-title">Login Done</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{meetings.filter(m => m.miniLogin || m.fullLogin).length} completed</div>
                  </div>
                  <table className="fo-table">
                    <thead><tr><th>Client</th><th>Phone</th><th>Mini Login</th><th>Full Login</th><th>Walk-in Date</th><th>Remarks</th></tr></thead>
                    <tbody>
                      {meetings.filter(m => m.miniLogin || m.fullLogin).map(m => {
                        const lead = getLead(m.leadId);
                        return (
                          <tr key={m.id}>
                            <td className="fo-td fo-pri">{lead?.clientName || lead?.clientName || '—'}</td>
                            <td className="fo-td" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{lead?.phoneNumber || '—'}</td>
                            <td className="fo-td">
                              <span style={{ fontSize: '11px', color: m.miniLogin ? 'var(--success)' : 'var(--text3)' }}>
                                {m.miniLogin ? `✓ ${m.miniLoginDate || 'Done'}` : '—'}
                              </span>
                            </td>
                            <td className="fo-td">
                              <span style={{ fontSize: '11px', color: m.fullLogin ? 'var(--accent)' : 'var(--text3)' }}>
                                {m.fullLogin ? `✓ ${m.fullLoginDate || 'Done'}` : '—'}
                              </span>
                            </td>
                            <td className="fo-td" style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text3)' }}>{m.walkinDate || '—'}</td>
                            <td className="fo-td">{renderRemarkPanel(m)}</td>
                          </tr>
                        );
                      })}
                      {meetings.filter(m => m.miniLogin || m.fullLogin).length === 0 && (
                        <tr><td colSpan={6} className="fo-empty">No logins done yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════ HISTORY ══════════ */}
            {activeTab === 'history' && (
              <div className="fade-in">
                <div className="fo-topbar">
                  <div>
                    <div className="fo-page-title">History</div>
                    <div className="fo-page-sub">// all walk-in & login records</div>
                  </div>
                  <div className="fo-clock">{clock}</div>
                </div>
                <div className="fo-card">
                  <div className="fo-card-head"><div className="fo-card-title">All Walk-in Records</div></div>
                  <table className="fo-table">
                    <thead>
                      <tr>
                        <th>Client</th><th>Phone</th><th>Walk-in Date</th><th>Location</th>
                        <th>Walk-in Status</th>
                        <th>Mini Login</th><th>Full Login</th><th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meetings.filter(m => m.walkinDate).sort((a, b) => (b.walkinDate || '').localeCompare(a.walkinDate || '')).map(m => {
                        const lead = getLead(m.leadId);
                        const mRemarks = remarksByMeeting[m.id] || [];
                        return (
                          <tr key={m.id}>
                            <td className="fo-td fo-pri">{lead?.clientName || lead?.clientName || '—'}</td>
                            <td className="fo-td" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{lead?.phoneNumber || '—'}</td>
                            <td className="fo-td" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{m.walkinDate}</td>
                            <td className="fo-td" style={{ fontSize: '11px' }}>{lead?.address || '—'}</td>
                            <td className="fo-td"><StatusBadge status={m.walkingStatus || 'Pending'} /></td>
                            <td className="fo-td">
                              <span style={{ fontSize: '11px', color: m.miniLogin ? 'var(--success)' : 'var(--text3)' }}>
                                {m.miniLogin ? `✓ ${m.miniLoginDate || ''}` : '—'}
                              </span>
                            </td>
                            <td className="fo-td">
                              <span style={{ fontSize: '11px', color: m.fullLogin ? 'var(--accent)' : 'var(--text3)' }}>
                                {m.fullLogin ? `✓ ${m.fullLoginDate || ''}` : '—'}
                              </span>
                            </td>
                            <td className="fo-td">
                              {mRemarks.length > 0 ? (
                                <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace' }}>
                                  {mRemarks.length} remark{mRemarks.length > 1 ? 's' : ''}
                                </span>
                              ) : <span style={{ color: 'var(--text3)', fontSize: '10px' }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                      {meetings.filter(m => m.walkinDate).length === 0 && (
                        <tr><td colSpan={8} className="fo-empty">No records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

          {/* ══ RM SELECTION MODAL ══ */}
          {rmModal && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, backdropFilter: 'blur(4px)',
            }} onClick={() => setRmModal(null)}>
              <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--surface)', border: '1px solid var(--border2)',
                borderRadius: '14px', padding: '24px', width: '360px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              }}>
                {/* Header */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>
                    {rmModal.loginType === 'Mini Login' ? '📋 Mini Login' : rmModal.loginType === 'Full Login' ? '📁 Full Login' : '✅ Both Logins'} — Confirm
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', fontFamily: 'monospace' }}>
                    {(() => { const m = meetings.find(x => x.id === rmModal.meetingId); const l = getLead(m?.leadId || ''); return l?.clientName || '—'; })()}
                  </div>
                </div>

                {/* RM Select */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text2)', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: '8px' }}>
                    Assign Relationship Manager
                  </div>
                  {rmUsers.length === 0 ? (
                    <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace', padding: '10px', background: 'var(--bg3)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      No active RM users found
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                      {/* No RM option */}
                      <div
                        onClick={() => setSelectedRmId('')}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                          background: selectedRmId === '' ? 'rgba(148,163,184,0.12)' : 'var(--bg3)',
                          border: `1px solid ${selectedRmId === '' ? 'rgba(148,163,184,0.4)' : 'var(--border)'}`,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px',
                          background: 'rgba(148,163,184,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                        }}>—</div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text2)' }}>No RM (skip)</div>
                          <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace' }}>assign later</div>
                        </div>
                        {selectedRmId === '' && <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '14px' }}>✓</span>}
                      </div>

                      {/* RM list */}
                      {rmUsers.map(rm => (
                        <div
                          key={rm.id}
                          onClick={() => setSelectedRmId(rm.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                            background: selectedRmId === rm.id ? 'rgba(236,72,153,0.08)' : 'var(--bg3)',
                            border: `1px solid ${selectedRmId === rm.id ? 'rgba(236,72,153,0.35)' : 'var(--border)'}`,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '8px',
                            background: 'linear-gradient(135deg,#ec4899,#a855f7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700, color: '#fff', flexShrink: 0,
                          }}>{rm.name?.[0] || 'R'}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rm.name}</div>
                            <div style={{ fontSize: '9px', color: '#ec4899', fontFamily: 'monospace', letterSpacing: '1px' }}>RELATIONSHIP MANAGER</div>
                          </div>
                          {selectedRmId === rm.id && <span style={{ marginLeft: 'auto', color: '#ec4899', fontSize: '14px', flexShrink: 0 }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setRmModal(null)} style={{
                    flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--border2)',
                    background: 'transparent', color: 'var(--text2)', fontSize: '12px',
                    fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}>Cancel</button>
                  <button onClick={confirmLogin} style={{
                    flex: 2, padding: '9px', borderRadius: '8px', border: 'none',
                    background: rmModal.loginType === 'Mini Login' ? 'var(--warning)' : rmModal.loginType === 'Full Login' ? 'var(--accent)' : 'var(--purple)',
                    color: '#fff', fontSize: '12px', fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    {selectedRmId ? `Confirm & Assign RM` : `Confirm ${rmModal.loginType}`}
                  </button>
                </div>
              </div>
            </div>
          )}

    </>
  );
}