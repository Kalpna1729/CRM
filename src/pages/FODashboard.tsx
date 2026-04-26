import { useState, useMemo, useEffect } from 'react';
import { useCRM } from '@/contexts/CRMContext.tsx';
import { Meeting} from '@/types/crm.ts';
import { toast } from 'sonner';

type Tab = 'overview' | 'walkin' | 'login' | 'history';
type Theme = 'dark' | 'light';

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
  eye:      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
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

export default function FODashboard() {
  const { currentUser, leads, users, meetings, updateMeeting, addLoginUpdate, logout } = useCRM();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [theme, setTheme] = useState<Theme>('light');
  const [clock, setClock] = useState('');
  const [miniLoginDates, setMiniLoginDates] = useState<Record<string, string>>({});
  const [fullLoginDates, setFullLoginDates] = useState<Record<string, string>>({});
  const [alerts, setAlerts] = useState<{ id: string; msg: string; type: 'warn' | 'info' }[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')} ${n.getHours() >= 12 ? 'PM' : 'AM'}`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const isDark = theme === 'dark';

  // FO ko sirf walkin date set wali meetings dikhni chahiye
  const walkinPendingMeetings = useMemo(() =>
    meetings.filter(m => m.bdoStatus === 'Follow-up' && m.walkinDate && !m.walkingStatus),
    [meetings]
  );

  const validMeetings = useMemo(() =>
    meetings.filter(m => m.walkingStatus === 'Walking Done'),
    [meetings]
  );

  const pendingLoginMeetings = useMemo(() =>
    validMeetings.filter(m => !m.miniLogin && !m.fullLogin),
    [validMeetings]
  );

  const dailyTrend = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (29 - i));
      return meetings.filter(m => m.walkingStatus === 'Walking Done' && m.walkinDate === d.toISOString().split('T')[0]).length;
    });
  }, [meetings]);

  useEffect(() => {
    const newAlerts: { id: string; msg: string; type: 'warn' | 'info' }[] = [];
    if (walkinPendingMeetings.length > 0)
      newAlerts.push({ id: 'walkin', msg: `${walkinPendingMeetings.length} walk-in(s) pending — mark Valid or Invalid`, type: 'warn' });
    if (pendingLoginMeetings.length > 0)
      newAlerts.push({ id: 'login', msg: `${pendingLoginMeetings.length} valid walk-in(s) pending login update`, type: 'info' });
    setAlerts(newAlerts);
  }, [walkinPendingMeetings.length, pendingLoginMeetings.length]);

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  const getLead = (leadId: string) => leads.find(l => l.id === leadId);

  const handleWalkingDone = async (meetingId: string) => {
    await updateMeeting(meetingId, { walkingStatus: 'Walking Done', bdoStatus: 'Walk-in Done', foId: currentUser!.id });
    toast.success('Walk-in marked as Valid ✓');
  };

  const handleWalkingInvalid = async (meetingId: string) => {
    await updateMeeting(meetingId, { walkingStatus: 'Invalid', foId: currentUser!.id });
    toast.success('Walk-in marked as Invalid');
  };

  const handleMiniLogin = async (meetingId: string) => {
    const date = miniLoginDates[meetingId] || today;
    await updateMeeting(meetingId, { miniLogin: true, miniLoginDate: date });
    await addLoginUpdate(meetingId, 'Mini Login', currentUser!.id);
    toast.success('Mini Login done ✓');
  };

  const handleFullLogin = async (meetingId: string) => {
    const date = fullLoginDates[meetingId] || today;
    await updateMeeting(meetingId, { fullLogin: true, fullLoginDate: date });
    await addLoginUpdate(meetingId, 'Full Login', currentUser!.id);
    toast.success('Full Login done ✓');
  };

  const handleBothLogin = async (meetingId: string) => {
    await updateMeeting(meetingId, { miniLogin: true, fullLogin: true, miniLoginDate: today, fullLoginDate: today });
    await addLoginUpdate(meetingId, 'Both', currentUser!.id);
    toast.success('Both Logins done ✓');
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
        .fo-td{padding:9px 10px;border-bottom:1px solid var(--border);vertical-align:middle;}
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
        .alert-list{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;}
        .alert-item{display:flex;align-items:center;gap:10px;padding:9px 13px;border-radius:9px;position:relative;overflow:hidden;}
        .alert-warn{background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);}
        .alert-info{background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.18);}
        .alert-warn::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--warning);}
        .alert-info::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--teal);}
        .alert-msg{font-size:12px;color:var(--text);flex:1;}
        .alert-dismiss{font-size:10px;color:var(--text3);cursor:pointer;padding:2px 8px;border:1px solid var(--border2);border-radius:5px;background:transparent;}
        .alert-go{font-size:10px;cursor:pointer;padding:2px 8px;border-radius:5px;background:transparent;border:1px solid;}
        .alert-warn .alert-go{color:var(--warning);border-color:rgba(245,158,11,0.3);}
        .alert-info .alert-go{color:var(--teal);border-color:rgba(6,182,212,0.3);}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeInUp 0.25s ease forwards;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px;}
      `}</style>

      <div className={`fo-root ${theme}`}>
        <div className="fo-layout">

          {/* SIDEBAR */}
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
                { id: 'overview', label: 'Overview', icon: I.overview },
                { id: 'walkin', label: 'Walk-in', icon: I.walkin, badge: walkinPendingMeetings.length > 0 ? walkinPendingMeetings.length : null },
                { id: 'login', label: 'Login', icon: I.login, badge: pendingLoginMeetings.length > 0 ? pendingLoginMeetings.length : null, badgeCls: 'info' },
                { id: 'history', label: 'History', icon: I.history },
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
                <span style={{ color: 'var(--text3)', marginTop: '2px', display: 'block' }}>{walkinPendingMeetings.length} walkin pending · {pendingLoginMeetings.length} login pending</span>
              </div>
              <div className="fo-theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                <div className={`fo-toggle-opt ${isDark ? 'active' : ''}`}>{I.moon} Dark</div>
                <div className={`fo-toggle-opt ${!isDark ? 'active' : ''}`}>{I.sun} Light</div>
              </div>
              <button className="fo-logout-btn" onClick={logout}>{I.logout} Sign Out</button>
            </div>
          </aside>

          {/* MAIN */}
          <main className="fo-main">

            {/* Alerts */}
            {visibleAlerts.length > 0 && (
              <div className="alert-list">
                {visibleAlerts.map(alert => (
                  <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                    <span style={{ fontSize: '14px' }}>{alert.type === 'warn' ? '⚠' : 'ℹ'}</span>
                    <span className="alert-msg">{alert.msg}</span>
                    <button className="alert-go" onClick={() => setActiveTab(alert.id === 'walkin' ? 'walkin' : 'login')}>View →</button>
                    <button className="alert-dismiss" onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* OVERVIEW */}
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
                    { label: 'Walkin Pending', val: walkinPendingMeetings.length, color: 'var(--warning)' },
                    { label: 'Walkin Valid', val: validMeetings.length, color: 'var(--success)' },
                    { label: 'Mini Login Done', val: meetings.filter(m => m.miniLogin).length, color: 'var(--warning)' },
                    { label: 'Full Login Done', val: meetings.filter(m => m.fullLogin).length, color: 'var(--accent)' },
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
                            <td className="fo-td fo-pri">{m.clientName || lead?.clientName || '—'}</td>
                            <td className="fo-td" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{lead?.phoneNumber || '—'}</td>
                            <td className="fo-td" style={{ fontSize: '11px' }}>{m.walkinDate}</td>
                            <td className="fo-td" style={{ fontSize: '11px' }}>{m.location || '—'}</td>
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

            {/* WALK-IN TAB */}
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
                      <thead><tr><th>Client</th><th>Phone</th><th>Walk-in Date</th><th>Location</th><th>Loan Req.</th><th>Actions</th></tr></thead>
                      <tbody>
                        {walkinPendingMeetings.map(m => {
                          const lead = getLead(m.leadId);
                          const isOverdue = m.walkinDate && m.walkinDate < today;
                          return (
                            <tr key={m.id} style={{ background: isOverdue ? 'rgba(255,71,87,0.04)' : undefined }}>
                              <td className="fo-td fo-pri">
                                <div>{m.clientName || lead?.clientName || '—'}</div>
                                {isOverdue && <div style={{ fontSize: '9px', color: 'var(--danger)' }}>⚠ Overdue</div>}
                              </td>
                              <td className="fo-td" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{lead?.phoneNumber || '—'}</td>
                              <td className="fo-td" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{m.walkinDate}</td>
                              <td className="fo-td" style={{ fontSize: '11px' }}>{m.location || '—'}</td>
                              <td className="fo-td" style={{ fontSize: '11px' }}>₹{lead?.loanRequirement || '—'}</td>
                              <td className="fo-td">
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="fo-btn fo-btn-valid" onClick={() => handleWalkingDone(m.id)}>
                                    {I.check} Valid
                                  </button>
                                  <button className="fo-btn fo-btn-invalid" onClick={() => handleWalkingInvalid(m.id)}>
                                    {I.invalid} Invalid
                                  </button>
                                </div>
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

            {/* LOGIN TAB */}
            {activeTab === 'login' && (
              <div className="fade-in">
                <div className="fo-topbar">
                  <div>
                    <div className="fo-page-title">Login Management</div>
                    <div className="fo-page-sub">// {pendingLoginMeetings.length} pending · {meetings.filter(m => m.miniLogin || m.fullLogin).length} done</div>
                  </div>
                  <div className="fo-clock">{clock}</div>
                </div>

                {/* Stats */}
                <div className="fo-kpi-row">
                  {[
                    { label: 'Pending Login', val: pendingLoginMeetings.length, color: 'var(--warning)' },
                    { label: 'Mini Login Done', val: meetings.filter(m => m.miniLogin).length, color: 'var(--warning)' },
                    { label: 'Full Login Done', val: meetings.filter(m => m.fullLogin).length, color: 'var(--accent)' },
                    { label: 'Both Done', val: meetings.filter(m => m.miniLogin && m.fullLogin).length, color: 'var(--purple)' },
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
                    <div className="fo-card-head"><div className="fo-card-title">Pending Login Update ({pendingLoginMeetings.length})</div></div>
                    <table className="fo-table">
                      <thead><tr><th>Client</th><th>Phone</th><th>Walk-in Date</th><th>Location</th><th>Mini Login Date</th><th>Full Login Date</th><th>Actions</th></tr></thead>
                      <tbody>
                        {pendingLoginMeetings.map(m => {
                          const lead = getLead(m.leadId);
                          return (
                            <tr key={m.id}>
                              <td className="fo-td fo-pri">{m.clientName || lead?.clientName || '—'}</td>
                              <td className="fo-td" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{lead?.phoneNumber || '—'}</td>
                              <td className="fo-td" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{m.walkinDate || '—'}</td>
                              <td className="fo-td" style={{ fontSize: '11px' }}>{m.location || '—'}</td>
                              <td className="fo-td">
                                <input type="date"
                                  value={miniLoginDates[m.id] || ''}
                                  onChange={e => setMiniLoginDates(prev => ({ ...prev, [m.id]: e.target.value }))}
                                  style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '4px 7px', color: 'var(--text)', fontSize: '11px', outline: 'none', width: '130px' }}
                                />
                              </td>
                              <td className="fo-td">
                                <input type="date"
                                  value={fullLoginDates[m.id] || ''}
                                  onChange={e => setFullLoginDates(prev => ({ ...prev, [m.id]: e.target.value }))}
                                  style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '6px', padding: '4px 7px', color: 'var(--text)', fontSize: '11px', outline: 'none', width: '130px' }}
                                />
                              </td>
                              <td className="fo-td">
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                  {!m.miniLogin && <button className="fo-btn fo-btn-mini" onClick={() => handleMiniLogin(m.id)}>Mini ✓</button>}
                                  {!m.fullLogin && <button className="fo-btn fo-btn-full" onClick={() => handleFullLogin(m.id)}>Full ✓</button>}
                                  {!m.miniLogin && !m.fullLogin && <button className="fo-btn fo-btn-both" onClick={() => handleBothLogin(m.id)}>Both ✓</button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Already done */}
                <div className="fo-card">
                  <div className="fo-card-head">
                    <div className="fo-card-title">Login Done</div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{meetings.filter(m => m.miniLogin || m.fullLogin).length} completed</div>
                  </div>
                  <table className="fo-table">
                    <thead><tr><th>Client</th><th>Phone</th><th>Mini Login</th><th>Full Login</th><th>Walk-in Date</th></tr></thead>
                    <tbody>
                      {meetings.filter(m => m.miniLogin || m.fullLogin).map(m => {
                        const lead = getLead(m.leadId);
                        return (
                          <tr key={m.id}>
                            <td className="fo-td fo-pri">{m.clientName || lead?.clientName || '—'}</td>
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
                          </tr>
                        );
                      })}
                      {meetings.filter(m => m.miniLogin || m.fullLogin).length === 0 && (
                        <tr><td colSpan={5} className="fo-empty">No logins done yet</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* HISTORY */}
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
                    <thead><tr><th>Client</th><th>Phone</th><th>Walk-in Date</th><th>Location</th><th>Walk-in Status</th><th>Mini Login</th><th>Full Login</th></tr></thead>
                    <tbody>
                      {meetings.filter(m => m.walkinDate).sort((a, b) => (b.walkinDate || '').localeCompare(a.walkinDate || '')).map(m => {
                        const lead = getLead(m.leadId);
                        return (
                          <tr key={m.id}>
                            <td className="fo-td fo-pri">{m.clientName || lead?.clientName || '—'}</td>
                            <td className="fo-td" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{lead?.phoneNumber || '—'}</td>
                            <td className="fo-td" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{m.walkinDate}</td>
                            <td className="fo-td" style={{ fontSize: '11px' }}>{m.location || '—'}</td>
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
                          </tr>
                        );
                      })}
                      {meetings.filter(m => m.walkinDate).length === 0 && (
                        <tr><td colSpan={7} className="fo-empty">No records found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}