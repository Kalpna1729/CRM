// import { useState, useMemo, useEffect } from 'react';
// import { useCRM } from '@/contexts/CRMContext';
// import { Meeting } from '@/types/crm';
// import { toast } from 'sonner';

// type Tab = 'overview' | 'cases' | 'reminders' | 'history';
// type Theme = 'dark' | 'light';

// const I = {
//   overview: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
//   cases:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
//   bell:     <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
//   history:  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
//   check:    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
//   trash:    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>,
//   sun:      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
//   moon:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
//   logout:   <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
// };

// const STAGE_COLORS: Record<string, string> = {
//   'Login': '#3d7fff', 'Document': '#a78bfa', 'Valuation': '#f59e0b',
//   'Legal': '#06b6d4', 'Sanction': '#00d4aa', 'Disbursed': '#10b981', 'Rejected': '#ff4757',
// };

// const STAGES = ['Login', 'Document', 'Valuation', 'Legal', 'Sanction', 'Disbursed', 'Rejected'];

// function StageBadge({ stage }: { stage: string }) {
//   const color = STAGE_COLORS[stage] || '#8b8fa8';
//   return (
//     <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', fontFamily: "'JetBrains Mono',monospace", color, background: `${color}18`, border: `1px solid ${color}33` }}>
//       {stage || '—'}
//     </span>
//   );
// }

// function PriorityDot({ priority }: { priority?: string }) {
//   const map: Record<string, string> = { High: '#ff4757', Medium: '#f59e0b', Low: '#00d4aa' };
//   const color = map[priority || ''] || '#4a5568';
//   return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 6 }} />;
// }

// export default function RMDashboard() {
//   const {
//     currentUser, leads, users, meetings, meetingRemarks,
//     updateMeeting, addMeetingRemark,
//     followUpReminders, addFollowUpReminder, deleteFollowUpReminder, markFollowUpDone,
//     logout,
//   } = useCRM();

//   const [activeTab, setActiveTab] = useState<Tab>('overview');
//   const [theme, setTheme] = useState<Theme>('light');
//   const [clock, setClock] = useState('');
//   const [expandedCase, setExpandedCase] = useState<string | null>(null);
//   const [remarkText, setRemarkText] = useState<Record<string, string>>({});
//   const [reminderInput, setReminderInput] = useState<Record<string, { date: string; remark: string }>>({});
//   const [alerts, setAlerts] = useState<{ id: string; msg: string; type: 'warn' | 'info' }[]>([]);
//   const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

//   useEffect(() => {
//     const tick = () => {
//       const n = new Date();
//       setClock(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')} ${n.getHours() >= 12 ? 'PM' : 'AM'}`);
//     };
//     tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
//   }, []);

//   const today = new Date().toISOString().split('T')[0];
//   const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
//   const isDark = theme === 'dark';

//   const rmCases = useMemo(() => meetings.filter(m => m.miniLogin || m.fullLogin), [meetings]);

//   const overdueReminders = useMemo(() =>
//     followUpReminders.filter(r => !r.isDone && r.reminderDate <= today),
//     [followUpReminders, today]
//   );

//   const docsPending = useMemo(() => rmCases.filter(m => !m.documentsReceived).length, [rmCases]);

//   useEffect(() => {
//     const newAlerts: { id: string; msg: string; type: 'warn' | 'info' }[] = [];
//     if (overdueReminders.length > 0)
//       newAlerts.push({ id: 'reminders', msg: `${overdueReminders.length} reminder(s) overdue`, type: 'warn' });
//     if (docsPending > 0)
//       newAlerts.push({ id: 'docs', msg: `${docsPending} case(s) documents pending`, type: 'info' });
//     setAlerts(newAlerts);
//   }, [overdueReminders.length, docsPending]);

//   const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

//   const getLead = (leadId: string) => leads.find(l => l.id === leadId);
//   const getMeetingRemarks = (meetingId: string) => meetingRemarks.filter(r => r.meetingId === meetingId);
//   const getMeetingReminders = (meetingId: string) => followUpReminders.filter(r => r.leadId === meetingId);

//   const timeAgo = (iso: string) => {
//     const diff = Date.now() - new Date(iso).getTime();
//     const mins = Math.floor(diff / 60000);
//     if (mins < 1) return 'just now';
//     if (mins < 60) return `${mins}m ago`;
//     const hrs = Math.floor(mins / 60);
//     if (hrs < 24) return `${hrs}h ago`;
//     return `${Math.floor(hrs / 24)}d ago`;
//   };

//   const handleAddRemark = async (meetingId: string) => {
//     const text = remarkText[meetingId]?.trim();
//     if (!text) { toast.error('Remark likhein'); return; }
//     await addMeetingRemark(meetingId, text, currentUser!.id);
//     setRemarkText(prev => ({ ...prev, [meetingId]: '' }));
//     toast.success('Remark saved ✓');
//   };

//   const handleAddReminder = async (meetingId: string) => {
//     const { date, remark } = reminderInput[meetingId] || {};
//     if (!date || !remark?.trim()) { toast.error('Date aur remark dono likhein'); return; }
//     await addFollowUpReminder(meetingId, date, remark.trim());
//     setReminderInput(prev => ({ ...prev, [meetingId]: { date: '', remark: '' } }));
//     toast.success('Reminder added ✓');
//   };

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
//         .rm-root.dark{--bg:#07080f;--bg2:#0d0f1a;--bg3:#12152a;--surface:#161929;--surface2:#1c2038;--border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.1);--accent:#3d7fff;--success:#00d4aa;--warning:#f59e0b;--danger:#ff4757;--purple:#a78bfa;--orange:#ff6b35;--teal:#06b6d4;--text:#e8eaf6;--text2:#8892b0;--text3:#4a5568;}
//         .rm-root.light{--bg:#f4f5fa;--bg2:#ffffff;--bg3:#eef0f7;--surface:#ffffff;--surface2:#eef0f7;--border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.12);--accent:#2563eb;--success:#059669;--warning:#d97706;--danger:#dc2626;--purple:#7c3aed;--orange:#ea580c;--teal:#0891b2;--text:#0f172a;--text2:#475569;--text3:#94a3b8;}
//         .rm-root{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
//         .rm-layout{display:flex;min-height:100vh;}
//         .rm-sidebar{width:220px;flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow:hidden;}
//         .rm-sidebar::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--purple),var(--accent),transparent);}
//         .rm-brand{padding:22px 20px 16px;border-bottom:1px solid var(--border);}
//         .rm-brand-tag{font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--purple);font-family:'JetBrains Mono',monospace;margin-bottom:6px;}
//         .rm-brand-name{font-size:17px;font-weight:800;color:var(--text);line-height:1.2;}
//         .rm-user{margin:12px 18px;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:10px;display:flex;align-items:center;gap:9px;}
//         .rm-user-ava{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,var(--purple),var(--accent));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}
//         .rm-user-name{font-size:12px;font-weight:600;color:var(--text);}
//         .rm-user-role{font-size:9px;color:var(--purple);font-family:'JetBrains Mono',monospace;letter-spacing:1px;}
//         .rm-nav-section{padding:6px 12px;margin-top:2px;}
//         .rm-nav-label{font-size:9px;font-weight:600;letter-spacing:2.5px;color:var(--text3);text-transform:uppercase;font-family:'JetBrains Mono',monospace;padding:0 8px;margin-bottom:3px;}
//         .rm-nav-item{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:9px;cursor:pointer;transition:all 0.15s;font-size:12px;font-weight:500;color:var(--text2);position:relative;margin-bottom:1px;}
//         .rm-nav-item:hover{background:var(--surface2);color:var(--text);}
//         .rm-nav-item.active{background:var(--surface2);color:var(--purple);}
//         .rm-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;background:var(--purple);border-radius:0 3px 3px 0;}
//         .rm-nav-icon{width:16px;height:16px;opacity:0.6;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
//         .rm-nav-item.active .rm-nav-icon{opacity:1;}
//         .rm-nav-badge{margin-left:auto;font-size:9px;font-weight:700;background:var(--danger);color:#fff;padding:1px 6px;border-radius:8px;font-family:'JetBrains Mono',monospace;}
//         .rm-nav-badge.info{background:var(--purple);}
//         .rm-sidebar-foot{margin-top:auto;padding:12px 18px;border-top:1px solid var(--border);}
//         .rm-status-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--success);margin-right:5px;animation:pdot 2s infinite;}
//         @keyframes pdot{0%,100%{opacity:1}50%{opacity:0.3}}
//         .rm-footer-info{font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:10px;}
//         .rm-theme-toggle{display:flex;background:var(--bg3);border:1px solid var(--border2);border-radius:18px;padding:3px;margin-bottom:8px;cursor:pointer;}
//         .rm-toggle-opt{display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:13px;font-size:10px;font-weight:600;color:var(--text3);transition:all 0.2s;font-family:'JetBrains Mono',monospace;flex:1;justify-content:center;}
//         .rm-toggle-opt.active{background:var(--surface);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,0.15);}
//         .rm-logout-btn{display:flex;align-items:center;gap:7px;width:100%;padding:8px 11px;border-radius:8px;font-size:11px;font-weight:600;color:var(--text2);cursor:pointer;background:var(--surface);border:1px solid var(--border);transition:all 0.15s;font-family:inherit;}
//         .rm-main{flex:1;overflow:auto;padding:26px 28px 60px;}
//         .rm-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
//         .rm-page-title{font-size:22px;font-weight:800;letter-spacing:-0.5px;color:var(--text);}
//         .rm-page-sub{font-size:10px;color:var(--text2);margin-top:2px;font-family:'JetBrains Mono',monospace;}
//         .rm-clock{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text2);background:var(--surface);border:1px solid var(--border);padding:6px 12px;border-radius:7px;}
//         .rm-kpi-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px;}
//         .rm-kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:15px 14px;transition:transform 0.15s;}
//         .rm-kpi-card:hover{transform:translateY(-2px);}
//         .rm-kpi-label{font-size:9px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text2);font-family:'JetBrains Mono',monospace;margin-bottom:7px;}
//         .rm-kpi-val{font-size:32px;font-weight:800;line-height:1;margin-bottom:6px;}
//         .rm-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:14px;}
//         .rm-card-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 10px;border-bottom:1px solid var(--border);}
//         .rm-card-title{font-size:12px;font-weight:700;color:var(--text);}
//         .rm-card-sub{font-size:10px;color:var(--text2);font-family:'JetBrains Mono',monospace;margin-top:2px;}
//         .rm-card-body{padding:14px 16px;}
//         .rm-table{width:100%;border-collapse:collapse;font-size:11px;}
//         .rm-table th{padding:8px 10px;text-align:left;font-size:9px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text3);font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--border);}
//         .rm-td{padding:9px 10px;border-bottom:1px solid var(--border);vertical-align:top;}
//         .rm-table tr:last-child .rm-td{border-bottom:none;}
//         .rm-table tbody tr:hover{background:var(--surface2);}
//         .rm-pri{color:var(--text);font-weight:600;}
//         .rm-empty{text-align:center;color:var(--text3);padding:32px;font-size:11px;font-family:'JetBrains Mono',monospace;}
//         .rm-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:7px;font-size:10px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:'JetBrains Mono',monospace;border:1px solid transparent;}
//         .rm-btn-green{background:rgba(0,212,170,0.1);color:var(--success);border-color:rgba(0,212,170,0.2);}
//         .rm-btn-red{background:rgba(255,71,87,0.1);color:var(--danger);border-color:rgba(255,71,87,0.2);}
//         .rm-btn-blue{background:rgba(61,127,255,0.1);color:var(--accent);border-color:rgba(61,127,255,0.2);}
//         .rm-btn-purple{background:rgba(167,139,250,0.1);color:var(--purple);border-color:rgba(167,139,250,0.2);}
//         .rm-input{width:100%;padding:8px 12px;border-radius:8px;font-size:12px;background:var(--surface2);color:var(--text);border:1px solid var(--border2);outline:none;font-family:'Inter',sans-serif;}
//         .rm-input:focus{border-color:var(--purple);}
//         .rm-date-input{padding:6px 10px;border-radius:7px;font-size:11px;background:var(--surface2);color:var(--text);border:1px solid var(--border2);outline:none;font-family:'JetBrains Mono',monospace;}
//         .rm-expanded{background:var(--bg3);border-top:1px solid var(--border);padding:16px 20px;}
//         .rm-section-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:10px;}
//         .stage-track{display:flex;gap:4px;align-items:center;flex-wrap:wrap;}
//         .stage-dot{padding:4px 10px;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:'JetBrains Mono',monospace;border:1px solid transparent;}
//         .alert-list{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;}
//         .alert-item{display:flex;align-items:center;gap:10px;padding:9px 13px;border-radius:9px;position:relative;overflow:hidden;}
//         .alert-warn{background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);}
//         .alert-info{background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.18);}
//         .alert-warn::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--warning);}
//         .alert-info::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--purple);}
//         .alert-msg{font-size:12px;color:var(--text);flex:1;}
//         .alert-dismiss{font-size:10px;color:var(--text3);cursor:pointer;padding:2px 8px;border:1px solid var(--border2);border-radius:5px;background:transparent;}
//         .alert-go{font-size:10px;cursor:pointer;padding:2px 8px;border-radius:5px;background:transparent;border:1px solid;}
//         .alert-warn .alert-go{color:var(--warning);border-color:rgba(245,158,11,0.3);}
//         .alert-info .alert-go{color:var(--purple);border-color:rgba(167,139,250,0.3);}
//         @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
//         .fade-in{animation:fadeInUp 0.25s ease forwards;}
//         ::-webkit-scrollbar{width:4px;height:4px;}
//         ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px;}
//       `}</style>

//       <div className={`rm-root ${theme}`}>
//         <div className="rm-layout">

//           {/* SIDEBAR */}
//           <aside className="rm-sidebar">
//             <div className="rm-brand">
//               <div className="rm-brand-tag">CRM · RM Portal</div>
//               <div className="rm-brand-name">Relationship<br />Manager</div>
//             </div>
//             <div className="rm-user">
//               <div className="rm-user-ava">{currentUser?.name?.[0] ?? 'R'}</div>
//               <div>
//                 <div className="rm-user-name">{currentUser?.name || 'RM'}</div>
//                 <div className="rm-user-role">REL. MANAGER</div>
//               </div>
//             </div>
//             <div className="rm-nav-section">
//               <div className="rm-nav-label">Dashboard</div>
//               {([
//                 { id: 'overview', label: 'Overview', icon: I.overview },
//                 { id: 'cases', label: 'Cases', icon: I.cases, badge: docsPending > 0 ? docsPending : null },
//                 { id: 'reminders', label: 'Reminders', icon: I.bell, badge: overdueReminders.length > 0 ? overdueReminders.length : null },
//                 { id: 'history', label: 'History', icon: I.history },
//               ] as any[]).map(item => (
//                 <div key={item.id} className={`rm-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
//                   <div className="rm-nav-icon">{item.icon}</div>
//                   {item.label}
//                   {item.badge ? <span className="rm-nav-badge">{item.badge}</span> : null}
//                 </div>
//               ))}
//             </div>
//             <div className="rm-sidebar-foot">
//               <div className="rm-footer-info">
//                 <span className="rm-status-dot" />Active · {todayStr}<br />
//                 <span style={{ color: 'var(--text3)', marginTop: '2px', display: 'block' }}>{rmCases.length} cases · {overdueReminders.length} overdue</span>
//               </div>
//               <div className="rm-theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
//                 <div className={`rm-toggle-opt ${isDark ? 'active' : ''}`}>{I.moon} Dark</div>
//                 <div className={`rm-toggle-opt ${!isDark ? 'active' : ''}`}>{I.sun} Light</div>
//               </div>
//               <button className="rm-logout-btn" onClick={logout}>{I.logout} Sign Out</button>
//             </div>
//           </aside>

//           {/* MAIN */}
//           <main className="rm-main">

//             {/* Alerts */}
//             {visibleAlerts.length > 0 && (
//               <div className="alert-list">
//                 {visibleAlerts.map(alert => (
//                   <div key={alert.id} className={`alert-item alert-${alert.type}`}>
//                     <span style={{ fontSize: '14px' }}>{alert.type === 'warn' ? '⚠' : 'ℹ'}</span>
//                     <span className="alert-msg">{alert.msg}</span>
//                     <button className="alert-go" onClick={() => setActiveTab(alert.id === 'reminders' ? 'reminders' : 'cases')}>View →</button>
//                     <button className="alert-dismiss" onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}>✕</button>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* OVERVIEW */}
//             {activeTab === 'overview' && (
//               <div className="fade-in">
//                 <div className="rm-topbar">
//                   <div>
//                     <div className="rm-page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {currentUser?.name?.split(' ')[0] || 'RM'}</div>
//                     <div className="rm-page-sub">// Relationship Manager · {todayStr}</div>
//                   </div>
//                   <div className="rm-clock">{clock}</div>
//                 </div>

//                 {/* KPI */}
//                 <div className="rm-kpi-row">
//                   {[
//                     { label: 'Total Cases', val: rmCases.length, color: 'var(--purple)' },
//                     { label: 'Docs Pending', val: docsPending, color: 'var(--warning)' },
//                     { label: 'Overdue Reminders', val: overdueReminders.length, color: 'var(--danger)' },
//                     { label: 'Disbursed', val: rmCases.filter(m => m.caseStage === 'Disbursed').length, color: 'var(--success)' },
//                   ].map(k => (
//                     <div key={k.label} className="rm-kpi-card">
//                       <div className="rm-kpi-label">{k.label}</div>
//                       <div className="rm-kpi-val" style={{ color: k.color }}>{k.val}</div>
//                     </div>
//                   ))}
//                 </div>

//                 {/* Stage wise */}
//                 <div className="rm-card">
//                   <div className="rm-card-head">
//                     <div>
//                       <div className="rm-card-title">Stage-wise breakdown</div>
//                       <div className="rm-card-sub">// {rmCases.length} total cases</div>
//                     </div>
//                   </div>
//                   <div className="rm-card-body">
//                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
//                       {['Login', 'Document', 'Valuation', 'Legal', 'Sanction', 'Disbursed', 'Rejected'].map(stage => {
//                         const count = rmCases.filter(m => m.caseStage === stage).length;
//                         const color = STAGE_COLORS[stage];
//                         return (
//                           <div key={stage} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: '10px', background: `${color}0d`, border: `1px solid ${color}22` }}>
//                             <div style={{ fontSize: '22px', fontWeight: 800, color }}>{count}</div>
//                             <div style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono',monospace", marginTop: '4px' }}>{stage}</div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Today reminders */}
//                 <div className="rm-card">
//                   <div className="rm-card-head">
//                     <div className="rm-card-title">Today's Reminders</div>
//                   </div>
//                   {overdueReminders.filter(r => r.reminderDate === today).length === 0
//                     ? <div className="rm-empty">No reminders today</div>
//                     : overdueReminders.filter(r => r.reminderDate === today).map(r => {
//                       const m = meetings.find(m => m.id === r.leadId);
//                       const lead = m ? getLead(m.leadId) : null;
//                       return (
//                         <div key={r.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                           <div>
//                             <div style={{ fontWeight: 600, fontSize: '12px' }}>{lead?.clientName || '—'}</div>
//                             <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{r.remark}</div>
//                           </div>
//                           <div style={{ display: 'flex', gap: '6px' }}>
//                             <button className="rm-btn rm-btn-green" onClick={() => markFollowUpDone(r.id)}>{I.check} Done</button>
//                             <button className="rm-btn rm-btn-red" onClick={() => deleteFollowUpReminder(r.id)}>{I.trash}</button>
//                           </div>
//                         </div>
//                       );
//                     })
//                   }
//                 </div>
//               </div>
//             )}

//             {/* CASES */}
//             {activeTab === 'cases' && (
//               <div className="fade-in">
//                 <div className="rm-topbar">
//                   <div>
//                     <div className="rm-page-title">Cases</div>
//                     <div className="rm-page-sub">// {rmCases.length} active cases — click to expand</div>
//                   </div>
//                   <div className="rm-clock">{clock}</div>
//                 </div>

//                 {rmCases.length === 0
//                   ? <div className="rm-card"><div className="rm-empty">No cases yet — waiting for login done</div></div>
//                   : rmCases.map(m => {
//                     const lead = getLead(m.leadId);
//                     const remarks = getMeetingRemarks(m.id);
//                     const reminders = getMeetingReminders(m.id);
//                     const isExpanded = expandedCase === m.id;
//                     const hasOverdue = reminders.some(r => !r.isDone && r.reminderDate <= today);

//                     return (
//                       <div key={m.id} className="rm-card" style={{ border: hasOverdue ? '1px solid rgba(255,71,87,0.3)' : undefined }}>
//                         {/* Case header */}
//                         <div
//                           onClick={() => setExpandedCase(isExpanded ? null : m.id)}
//                           style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
//                         >
//                           <PriorityDot priority={m.rmPriority} />
//                           <div style={{ flex: 2 }}>
//                             <div style={{ fontWeight: 700, fontSize: '13px' }}>{lead?.clientName || lead?.clientName || '—'}</div>
//                             <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>{lead?.phoneNumber || '—'} · ₹{lead?.loanRequirement || '—'}</div>
//                           </div>
//                           <div style={{ flex: 1 }}>
//                             {m.caseStage ? <StageBadge stage={m.caseStage} /> : <span style={{ fontSize: '10px', color: 'var(--text3)' }}>No stage</span>}
//                           </div>
//                           <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
//                             <span style={{ fontSize: '11px', color: m.documentsReceived ? 'var(--success)' : 'var(--warning)' }}>
//                               {m.documentsReceived ? '📄 Docs ✓' : '📄 Docs Pending'}
//                             </span>
//                           </div>
//                           <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{remarks.length} remarks · {reminders.filter(r => !r.isDone).length} reminders</div>
//                           {hasOverdue && <span style={{ fontSize: '9px', color: 'var(--danger)', fontWeight: 700 }}>⚠ OVERDUE</span>}
//                           <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{isExpanded ? '▲' : '▼'}</span>
//                         </div>

//                         {/* Expanded */}
//                         {isExpanded && (
//                           <div className="rm-expanded">
//                             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

//                               {/* Left — Case details */}
//                               <div>
//                                 {/* Stage track */}
//                                 <div className="rm-section-label">Case Stage</div>
//                                 <div className="stage-track" style={{ marginBottom: '16px' }}>
//                                   {STAGES.map(s => {
//                                     const color = STAGE_COLORS[s];
//                                     const isActive = m.caseStage === s;
//                                     return (
//                                       <button key={s} className="stage-dot" onClick={() => updateMeeting(m.id, { caseStage: s as any })}
//                                         style={{ background: isActive ? `${color}20` : 'transparent', color: isActive ? color : 'var(--text3)', borderColor: isActive ? color : 'var(--border2)' }}>
//                                         {s}
//                                       </button>
//                                     );
//                                   })}
//                                 </div>

//                                 {/* Priority */}
//                                 <div className="rm-section-label">Priority</div>
//                                 <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
//                                   {['High', 'Medium', 'Low'].map(p => {
//                                     const map: Record<string, string> = { High: '#ff4757', Medium: '#f59e0b', Low: '#00d4aa' };
//                                     const color = map[p];
//                                     const isActive = m.rmPriority === p;
//                                     return (
//                                       <button key={p} className="stage-dot" onClick={() => updateMeeting(m.id, { rmPriority: p as any })}
//                                         style={{ background: isActive ? `${color}20` : 'transparent', color: isActive ? color : 'var(--text3)', borderColor: isActive ? color : 'var(--border2)' }}>
//                                         {p}
//                                       </button>
//                                     );
//                                   })}
//                                 </div>

//                                 {/* Documents */}
//                                 <div className="rm-section-label">Documents</div>
//                                 <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
//                                   <button className={`rm-btn ${m.documentsReceived ? 'rm-btn-green' : 'rm-btn-blue'}`}
//                                     onClick={() => updateMeeting(m.id, { documentsReceived: !m.documentsReceived })}>
//                                     {m.documentsReceived ? '✓ Received' : 'Mark Received'}
//                                   </button>
//                                 </div>

//                                 {/* Report Date */}
//                                 <div className="rm-section-label">Valuation Report Date</div>
//                                 <input type="date" className="rm-date-input"
//                                   value={m.reportDate || ''}
//                                   onChange={e => updateMeeting(m.id, { reportDate: e.target.value })}
//                                   style={{ marginBottom: '16px', display: 'block' }}
//                                 />

//                                 {/* Status */}
//                                 <div className="rm-section-label">Status Update</div>
//                                 <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
//                                   {(['Legal Team Sent', 'Disbursed', 'On Hold', 'Rejected', 'Follow-up'] as any[]).map(s => (
//                                     <button key={s} className="stage-dot" onClick={() => updateMeeting(m.id, { status: s })}
//                                       style={{ background: m.status === s ? 'rgba(61,127,255,0.15)' : 'transparent', color: m.status === s ? 'var(--accent)' : 'var(--text3)', borderColor: m.status === s ? 'rgba(61,127,255,0.3)' : 'var(--border2)', fontSize: '10px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', border: '1px solid', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
//                                       {s}
//                                     </button>
//                                   ))}
//                                 </div>
//                               </div>

//                               {/* Right — Remarks + Reminders */}
//                               <div>
//                                 {/* Reminders */}
//                                 <div className="rm-section-label">Reminders</div>
//                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
//                                   {reminders.length === 0 && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>No reminders</div>}
//                                   {reminders.map(r => (
//                                     <div key={r.id} style={{
//                                       padding: '8px 10px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start',
//                                       background: r.isDone ? 'transparent' : r.reminderDate < today ? 'rgba(255,71,87,0.08)' : r.reminderDate === today ? 'rgba(245,158,11,0.08)' : 'rgba(61,127,255,0.06)',
//                                       border: `1px solid ${r.isDone ? 'var(--border)' : r.reminderDate < today ? 'rgba(255,71,87,0.2)' : r.reminderDate === today ? 'rgba(245,158,11,0.2)' : 'rgba(61,127,255,0.15)'}`,
//                                       opacity: r.isDone ? 0.5 : 1,
//                                     }}>
//                                       <div style={{ flex: 1 }}>
//                                         <div style={{ fontSize: '10px', fontWeight: 700, color: r.isDone ? 'var(--text3)' : r.reminderDate < today ? 'var(--danger)' : r.reminderDate === today ? 'var(--warning)' : 'var(--accent)', fontFamily: 'monospace' }}>
//                                           {r.isDone ? '✓ Done' : r.reminderDate < today ? '⚠ Overdue' : r.reminderDate === today ? '● Today' : r.reminderDate}
//                                         </div>
//                                         <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{r.remark}</div>
//                                       </div>
//                                       <div style={{ display: 'flex', gap: '4px' }}>
//                                         {!r.isDone && <button className="rm-btn rm-btn-green" style={{ padding: '3px 8px' }} onClick={() => markFollowUpDone(r.id)}>{I.check}</button>}
//                                         <button className="rm-btn rm-btn-red" style={{ padding: '3px 8px' }} onClick={() => deleteFollowUpReminder(r.id)}>{I.trash}</button>
//                                       </div>
//                                     </div>
//                                   ))}
//                                 </div>
//                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
//                                   <input type="date" className="rm-date-input" value={reminderInput[m.id]?.date || ''} min={today}
//                                     onChange={e => setReminderInput(prev => ({ ...prev, [m.id]: { ...prev[m.id], date: e.target.value } }))} />
//                                   <input className="rm-input" placeholder="Reminder note..." value={reminderInput[m.id]?.remark || ''}
//                                     onChange={e => setReminderInput(prev => ({ ...prev, [m.id]: { ...prev[m.id], remark: e.target.value } }))}
//                                     onKeyDown={e => e.key === 'Enter' && handleAddReminder(m.id)} />
//                                   <button className="rm-btn rm-btn-purple" onClick={() => handleAddReminder(m.id)} style={{ alignSelf: 'flex-start' }}>
//                                     {I.bell} Add Reminder
//                                   </button>
//                                 </div>

//                                 {/* Remarks */}
//                                 <div className="rm-section-label">Remarks</div>
//                                 <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', maxHeight: '200px', overflowY: 'auto' }}>
//                                   {remarks.length === 0 && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>No remarks yet</div>}
//                                   {remarks.map(r => (
//                                     <div key={r.id} style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
//                                       <div style={{ fontSize: '12px', color: 'var(--text)' }}>{r.remark}</div>
//                                       <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', fontFamily: 'monospace' }}>{timeAgo(r.createdAt)}</div>
//                                     </div>
//                                   ))}
//                                 </div>
//                                 <div style={{ display: 'flex', gap: '8px' }}>
//                                   <input className="rm-input" placeholder="Add remark..." value={remarkText[m.id] || ''}
//                                     onChange={e => setRemarkText(prev => ({ ...prev, [m.id]: e.target.value }))}
//                                     onKeyDown={e => e.key === 'Enter' && handleAddRemark(m.id)} />
//                                   <button className="rm-btn rm-btn-blue" onClick={() => handleAddRemark(m.id)}>Save</button>
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })
//                 }
//               </div>
//             )}

//             {/* REMINDERS */}
//             {activeTab === 'reminders' && (
//               <div className="fade-in">
//                 <div className="rm-topbar">
//                   <div>
//                     <div className="rm-page-title">Reminders</div>
//                     <div className="rm-page-sub">// {followUpReminders.filter(r => !r.isDone).length} pending · {overdueReminders.length} overdue</div>
//                   </div>
//                   <div className="rm-clock">{clock}</div>
//                 </div>

//                 {/* Overdue */}
//                 {overdueReminders.length > 0 && (
//                   <div className="rm-card" style={{ border: '1px solid rgba(255,71,87,0.3)' }}>
//                     <div className="rm-card-head">
//                       <div className="rm-card-title" style={{ color: 'var(--danger)' }}>⚠ Overdue ({overdueReminders.length})</div>
//                     </div>
//                     {overdueReminders.map(r => {
//                       const m = meetings.find(m => m.id === r.leadId);
//                       const lead = m ? getLead(m.leadId) : null;
//                       return (
//                         <div key={r.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                           <div>
//                             <div style={{ fontWeight: 600, fontSize: '12px' }}>{lead?.clientName || lead?.clientName || '—'}</div>
//                             <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{r.remark}</div>
//                             <div style={{ fontSize: '10px', color: 'var(--danger)', fontFamily: 'monospace', marginTop: '2px' }}>Due: {r.reminderDate}</div>
//                           </div>
//                           <div style={{ display: 'flex', gap: '6px' }}>
//                             <button className="rm-btn rm-btn-green" onClick={() => markFollowUpDone(r.id)}>{I.check} Done</button>
//                             <button className="rm-btn rm-btn-red" onClick={() => deleteFollowUpReminder(r.id)}>{I.trash}</button>
//                           </div>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}

//                 {/* Upcoming */}
//                 <div className="rm-card">
//                   <div className="rm-card-head"><div className="rm-card-title">Upcoming Reminders</div></div>
//                   {followUpReminders.filter(r => !r.isDone && r.reminderDate > today).length === 0
//                     ? <div className="rm-empty">No upcoming reminders</div>
//                     : followUpReminders.filter(r => !r.isDone && r.reminderDate > today).sort((a, b) => a.reminderDate.localeCompare(b.reminderDate)).map(r => {
//                       const m = meetings.find(m => m.id === r.leadId);
//                       const lead = m ? getLead(m.leadId) : null;
//                       return (
//                         <div key={r.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                           <div>
//                             <div style={{ fontWeight: 600, fontSize: '12px' }}>{lead?.clientName || lead?.clientName || '—'}</div>
//                             <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{r.remark}</div>
//                             <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'monospace', marginTop: '2px' }}>{r.reminderDate}</div>
//                           </div>
//                           <div style={{ display: 'flex', gap: '6px' }}>
//                             <button className="rm-btn rm-btn-green" onClick={() => markFollowUpDone(r.id)}>{I.check} Done</button>
//                             <button className="rm-btn rm-btn-red" onClick={() => deleteFollowUpReminder(r.id)}>{I.trash}</button>
//                           </div>
//                         </div>
//                       );
//                     })
//                   }
//                 </div>
//               </div>
//             )}

//             {/* HISTORY */}
//             {activeTab === 'history' && (
//               <div className="fade-in">
//                 <div className="rm-topbar">
//                   <div>
//                     <div className="rm-page-title">History</div>
//                     <div className="rm-page-sub">// All cases record</div>
//                   </div>
//                   <div className="rm-clock">{clock}</div>
//                 </div>
//                 <div className="rm-card">
//                   <div className="rm-card-head"><div className="rm-card-title">All Cases ({rmCases.length})</div></div>
//                   <table className="rm-table">
//                     <thead>
//                       <tr>
//                         <th>Client</th>
//                         <th>Phone</th>
//                         <th>Loan</th>
//                         <th>Stage</th>
//                         <th>Priority</th>
//                         <th>Documents</th>
//                         <th>Report Date</th>
//                         <th>Status</th>
//                         <th>Mini Login</th>
//                         <th>Full Login</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {rmCases.map(m => {
//                         const lead = getLead(m.leadId);
//                         return (
//                           <tr key={m.id}>
//                             <td className="rm-td rm-pri">{lead?.clientName || lead?.clientName || '—'}</td>
//                             <td className="rm-td" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{lead?.phoneNumber || '—'}</td>
//                             <td className="rm-td" style={{ fontSize: '11px' }}>₹{lead?.loanRequirement || '—'}</td>
//                             <td className="rm-td">{m.caseStage ? <StageBadge stage={m.caseStage} /> : <span style={{ color: 'var(--text3)', fontSize: '10px' }}>—</span>}</td>
//                             <td className="rm-td"><PriorityDot priority={m.rmPriority} /><span style={{ fontSize: '11px' }}>{m.rmPriority || '—'}</span></td>
//                             <td className="rm-td">
//                               <span style={{ fontSize: '11px', color: m.documentsReceived ? 'var(--success)' : 'var(--warning)' }}>
//                                 {m.documentsReceived ? '✓ Yes' : 'Pending'}
//                               </span>
//                             </td>
//                             <td className="rm-td" style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text3)' }}>{m.reportDate || '—'}</td>
//                             <td className="rm-td" style={{ fontSize: '11px' }}>{m.status || '—'}</td>
//                             <td className="rm-td">
//                               <span style={{ fontSize: '11px', color: m.miniLogin ? 'var(--success)' : 'var(--text3)' }}>{m.miniLogin ? `✓ ${m.miniLoginDate || ''}` : '—'}</span>
//                             </td>
//                             <td className="rm-td">
//                               <span style={{ fontSize: '11px', color: m.fullLogin ? 'var(--accent)' : 'var(--text3)' }}>{m.fullLogin ? `✓ ${m.fullLoginDate || ''}` : '—'}</span>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                       {rmCases.length === 0 && <tr><td colSpan={10} className="rm-empty">No cases yet</td></tr>}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}
//           </main>
//         </div>
//       </div>
//     </>
//   );
// }
import { useState, useMemo, useEffect } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { Meeting } from '@/types/crm';
import { toast } from 'sonner';

type Tab = 'overview' | 'cases' | 'reminders' | 'history';
type Theme = 'dark' | 'light';

const I = {
  overview: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  cases:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  bell:     <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  history:  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  check:    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  trash:    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>,
  sun:      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  moon:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  logout:   <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const STAGE_COLORS: Record<string, string> = {
  'Login': '#3d7fff', 'Document': '#a78bfa', 'Valuation': '#f59e0b',
  'Legal': '#06b6d4', 'Sanction': '#00d4aa', 'Disbursed': '#10b981', 'Rejected': '#ff4757',
};

const STAGES = ['Login', 'Document', 'Valuation', 'Legal', 'Sanction', 'Disbursed', 'Rejected'];

function StageBadge({ stage }: { stage: string }) {
  const color = STAGE_COLORS[stage] || '#8b8fa8';
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', fontFamily: "'JetBrains Mono',monospace", color, background: `${color}18`, border: `1px solid ${color}33` }}>
      {stage || '—'}
    </span>
  );
}

function PriorityDot({ priority }: { priority?: string }) {
  const map: Record<string, string> = { High: '#ff4757', Medium: '#f59e0b', Low: '#00d4aa' };
  const color = map[priority || ''] || '#4a5568';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 6 }} />;
}

export default function RMDashboard() {
  const {
    currentUser, leads, users, meetings, meetingRemarks,
    updateMeeting, addMeetingRemark,
    followUpReminders, addFollowUpReminder, deleteFollowUpReminder, markFollowUpDone,
    logout,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [theme, setTheme] = useState<Theme>('light');
  const [clock, setClock] = useState('');
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [remarkText, setRemarkText] = useState<Record<string, string>>({});
  const [reminderInput, setReminderInput] = useState<Record<string, { date: string; remark: string }>>({});
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

  const rmCases = useMemo(() => meetings.filter(m => m.miniLogin || m.fullLogin), [meetings]);

  const overdueReminders = useMemo(() =>
    followUpReminders.filter(r => !r.isDone && r.reminderDate <= today),
    [followUpReminders, today]
  );

  const docsPending = useMemo(() => rmCases.filter(m => !m.documentsReceived).length, [rmCases]);

  useEffect(() => {
    const newAlerts: { id: string; msg: string; type: 'warn' | 'info' }[] = [];
    if (overdueReminders.length > 0)
      newAlerts.push({ id: 'reminders', msg: `${overdueReminders.length} reminder(s) overdue`, type: 'warn' });
    if (docsPending > 0)
      newAlerts.push({ id: 'docs', msg: `${docsPending} case(s) documents pending`, type: 'info' });
    setAlerts(newAlerts);
  }, [overdueReminders.length, docsPending]);

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  const getLead = (leadId: string) => leads.find(l => l.id === leadId);
  const getMeetingRemarks = (meetingId: string) => meetingRemarks.filter(r => r.meetingId === meetingId);
  const getMeetingReminders = (meetingId: string) => {
    // reminder.leadId === lead.id hai, meetingId nahi.
    // Pehle meeting se uska leadId nikalo, phir filter karo.
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return [];
    return followUpReminders.filter(r => r.leadId === meeting.leadId);
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleAddRemark = async (meetingId: string) => {
    const text = remarkText[meetingId]?.trim();
    if (!text) { toast.error('Remark likhein'); return; }
    await addMeetingRemark(meetingId, text, currentUser!.id);
    setRemarkText(prev => ({ ...prev, [meetingId]: '' }));
    toast.success('Remark saved ✓');
  };

  const handleAddReminder = async (meetingId: string) => {
    const { date, remark } = reminderInput[meetingId] || {};
    if (!date || !remark?.trim()) { toast.error('Date aur remark dono likhein'); return; }
    // Bug fix: addFollowUpReminder leadId maangta hai, meetingId nahi.
    // Meeting se uska leadId nikaal ke bhejo — warna foreign key violation aata tha.
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) { toast.error('Meeting nahi mili'); return; }
    await addFollowUpReminder(meeting.leadId, date, remark.trim());
    setReminderInput(prev => ({ ...prev, [meetingId]: { date: '', remark: '' } }));
    toast.success('Reminder added ✓');
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
        .rm-root.dark{--bg:#07080f;--bg2:#0d0f1a;--bg3:#12152a;--surface:#161929;--surface2:#1c2038;--border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.1);--accent:#3d7fff;--success:#00d4aa;--warning:#f59e0b;--danger:#ff4757;--purple:#a78bfa;--orange:#ff6b35;--teal:#06b6d4;--text:#e8eaf6;--text2:#8892b0;--text3:#4a5568;}
        .rm-root.light{--bg:#f4f5fa;--bg2:#ffffff;--bg3:#eef0f7;--surface:#ffffff;--surface2:#eef0f7;--border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.12);--accent:#2563eb;--success:#059669;--warning:#d97706;--danger:#dc2626;--purple:#7c3aed;--orange:#ea580c;--teal:#0891b2;--text:#0f172a;--text2:#475569;--text3:#94a3b8;}
        .rm-root{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
        .rm-layout{display:flex;min-height:100vh;}
        .rm-sidebar{width:220px;flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow:hidden;}
        .rm-sidebar::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--purple),var(--accent),transparent);}
        .rm-brand{padding:22px 20px 16px;border-bottom:1px solid var(--border);}
        .rm-brand-tag{font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--purple);font-family:'JetBrains Mono',monospace;margin-bottom:6px;}
        .rm-brand-name{font-size:17px;font-weight:800;color:var(--text);line-height:1.2;}
        .rm-user{margin:12px 18px;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:10px;display:flex;align-items:center;gap:9px;}
        .rm-user-ava{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,var(--purple),var(--accent));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}
        .rm-user-name{font-size:12px;font-weight:600;color:var(--text);}
        .rm-user-role{font-size:9px;color:var(--purple);font-family:'JetBrains Mono',monospace;letter-spacing:1px;}
        .rm-nav-section{padding:6px 12px;margin-top:2px;}
        .rm-nav-label{font-size:9px;font-weight:600;letter-spacing:2.5px;color:var(--text3);text-transform:uppercase;font-family:'JetBrains Mono',monospace;padding:0 8px;margin-bottom:3px;}
        .rm-nav-item{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:9px;cursor:pointer;transition:all 0.15s;font-size:12px;font-weight:500;color:var(--text2);position:relative;margin-bottom:1px;}
        .rm-nav-item:hover{background:var(--surface2);color:var(--text);}
        .rm-nav-item.active{background:var(--surface2);color:var(--purple);}
        .rm-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;background:var(--purple);border-radius:0 3px 3px 0;}
        .rm-nav-icon{width:16px;height:16px;opacity:0.6;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .rm-nav-item.active .rm-nav-icon{opacity:1;}
        .rm-nav-badge{margin-left:auto;font-size:9px;font-weight:700;background:var(--danger);color:#fff;padding:1px 6px;border-radius:8px;font-family:'JetBrains Mono',monospace;}
        .rm-nav-badge.info{background:var(--purple);}
        .rm-sidebar-foot{margin-top:auto;padding:12px 18px;border-top:1px solid var(--border);}
        .rm-status-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--success);margin-right:5px;animation:pdot 2s infinite;}
        @keyframes pdot{0%,100%{opacity:1}50%{opacity:0.3}}
        .rm-footer-info{font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:10px;}
        .rm-theme-toggle{display:flex;background:var(--bg3);border:1px solid var(--border2);border-radius:18px;padding:3px;margin-bottom:8px;cursor:pointer;}
        .rm-toggle-opt{display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:13px;font-size:10px;font-weight:600;color:var(--text3);transition:all 0.2s;font-family:'JetBrains Mono',monospace;flex:1;justify-content:center;}
        .rm-toggle-opt.active{background:var(--surface);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,0.15);}
        .rm-logout-btn{display:flex;align-items:center;gap:7px;width:100%;padding:8px 11px;border-radius:8px;font-size:11px;font-weight:600;color:var(--text2);cursor:pointer;background:var(--surface);border:1px solid var(--border);transition:all 0.15s;font-family:inherit;}
        .rm-main{flex:1;overflow:auto;padding:26px 28px 60px;}
        .rm-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .rm-page-title{font-size:22px;font-weight:800;letter-spacing:-0.5px;color:var(--text);}
        .rm-page-sub{font-size:10px;color:var(--text2);margin-top:2px;font-family:'JetBrains Mono',monospace;}
        .rm-clock{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text2);background:var(--surface);border:1px solid var(--border);padding:6px 12px;border-radius:7px;}
        .rm-kpi-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px;}
        .rm-kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:15px 14px;transition:transform 0.15s;}
        .rm-kpi-card:hover{transform:translateY(-2px);}
        .rm-kpi-label{font-size:9px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text2);font-family:'JetBrains Mono',monospace;margin-bottom:7px;}
        .rm-kpi-val{font-size:32px;font-weight:800;line-height:1;margin-bottom:6px;}
        .rm-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:14px;}
        .rm-card-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 10px;border-bottom:1px solid var(--border);}
        .rm-card-title{font-size:12px;font-weight:700;color:var(--text);}
        .rm-card-sub{font-size:10px;color:var(--text2);font-family:'JetBrains Mono',monospace;margin-top:2px;}
        .rm-card-body{padding:14px 16px;}
        .rm-table{width:100%;border-collapse:collapse;font-size:11px;}
        .rm-table th{padding:8px 10px;text-align:left;font-size:9px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text3);font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--border);}
        .rm-td{padding:9px 10px;border-bottom:1px solid var(--border);vertical-align:top;}
        .rm-table tr:last-child .rm-td{border-bottom:none;}
        .rm-table tbody tr:hover{background:var(--surface2);}
        .rm-pri{color:var(--text);font-weight:600;}
        .rm-empty{text-align:center;color:var(--text3);padding:32px;font-size:11px;font-family:'JetBrains Mono',monospace;}
        .rm-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 11px;border-radius:7px;font-size:10px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:'JetBrains Mono',monospace;border:1px solid transparent;}
        .rm-btn-green{background:rgba(0,212,170,0.1);color:var(--success);border-color:rgba(0,212,170,0.2);}
        .rm-btn-red{background:rgba(255,71,87,0.1);color:var(--danger);border-color:rgba(255,71,87,0.2);}
        .rm-btn-blue{background:rgba(61,127,255,0.1);color:var(--accent);border-color:rgba(61,127,255,0.2);}
        .rm-btn-purple{background:rgba(167,139,250,0.1);color:var(--purple);border-color:rgba(167,139,250,0.2);}
        .rm-input{width:100%;padding:8px 12px;border-radius:8px;font-size:12px;background:var(--surface2);color:var(--text);border:1px solid var(--border2);outline:none;font-family:'Inter',sans-serif;}
        .rm-input:focus{border-color:var(--purple);}
        .rm-date-input{padding:6px 10px;border-radius:7px;font-size:11px;background:var(--surface2);color:var(--text);border:1px solid var(--border2);outline:none;font-family:'JetBrains Mono',monospace;}
        .rm-expanded{background:var(--bg3);border-top:1px solid var(--border);padding:16px 20px;}
        .rm-section-label{font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:10px;}
        .stage-track{display:flex;gap:4px;align-items:center;flex-wrap:wrap;}
        .stage-dot{padding:4px 10px;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;transition:all 0.15s;font-family:'JetBrains Mono',monospace;border:1px solid transparent;}
        .alert-list{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;}
        .alert-item{display:flex;align-items:center;gap:10px;padding:9px 13px;border-radius:9px;position:relative;overflow:hidden;}
        .alert-warn{background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);}
        .alert-info{background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.18);}
        .alert-warn::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--warning);}
        .alert-info::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--purple);}
        .alert-msg{font-size:12px;color:var(--text);flex:1;}
        .alert-dismiss{font-size:10px;color:var(--text3);cursor:pointer;padding:2px 8px;border:1px solid var(--border2);border-radius:5px;background:transparent;}
        .alert-go{font-size:10px;cursor:pointer;padding:2px 8px;border-radius:5px;background:transparent;border:1px solid;}
        .alert-warn .alert-go{color:var(--warning);border-color:rgba(245,158,11,0.3);}
        .alert-info .alert-go{color:var(--purple);border-color:rgba(167,139,250,0.3);}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeInUp 0.25s ease forwards;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px;}
      `}</style>

      <div className={`rm-root ${theme}`}>
        <div className="rm-layout">

          {/* SIDEBAR */}
          <aside className="rm-sidebar">
            <div className="rm-brand">
              <div className="rm-brand-tag">CRM · RM Portal</div>
              <div className="rm-brand-name">Relationship<br />Manager</div>
            </div>
            <div className="rm-user">
              <div className="rm-user-ava">{currentUser?.name?.[0] ?? 'R'}</div>
              <div>
                <div className="rm-user-name">{currentUser?.name || 'RM'}</div>
                <div className="rm-user-role">REL. MANAGER</div>
              </div>
            </div>
            <div className="rm-nav-section">
              <div className="rm-nav-label">Dashboard</div>
              {([
                { id: 'overview', label: 'Overview', icon: I.overview },
                { id: 'cases', label: 'Cases', icon: I.cases, badge: docsPending > 0 ? docsPending : null },
                { id: 'reminders', label: 'Reminders', icon: I.bell, badge: overdueReminders.length > 0 ? overdueReminders.length : null },
                { id: 'history', label: 'History', icon: I.history },
              ] as any[]).map(item => (
                <div key={item.id} className={`rm-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                  <div className="rm-nav-icon">{item.icon}</div>
                  {item.label}
                  {item.badge ? <span className="rm-nav-badge">{item.badge}</span> : null}
                </div>
              ))}
            </div>
            <div className="rm-sidebar-foot">
              <div className="rm-footer-info">
                <span className="rm-status-dot" />Active · {todayStr}<br />
                <span style={{ color: 'var(--text3)', marginTop: '2px', display: 'block' }}>{rmCases.length} cases · {overdueReminders.length} overdue</span>
              </div>
              <div className="rm-theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                <div className={`rm-toggle-opt ${isDark ? 'active' : ''}`}>{I.moon} Dark</div>
                <div className={`rm-toggle-opt ${!isDark ? 'active' : ''}`}>{I.sun} Light</div>
              </div>
              <button className="rm-logout-btn" onClick={logout}>{I.logout} Sign Out</button>
            </div>
          </aside>

          {/* MAIN */}
          <main className="rm-main">

            {/* Alerts */}
            {visibleAlerts.length > 0 && (
              <div className="alert-list">
                {visibleAlerts.map(alert => (
                  <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                    <span style={{ fontSize: '14px' }}>{alert.type === 'warn' ? '⚠' : 'ℹ'}</span>
                    <span className="alert-msg">{alert.msg}</span>
                    <button className="alert-go" onClick={() => setActiveTab(alert.id === 'reminders' ? 'reminders' : 'cases')}>View →</button>
                    <button className="alert-dismiss" onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <div className="rm-topbar">
                  <div>
                    <div className="rm-page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {currentUser?.name?.split(' ')[0] || 'RM'}</div>
                    <div className="rm-page-sub">// Relationship Manager · {todayStr}</div>
                  </div>
                  <div className="rm-clock">{clock}</div>
                </div>

                {/* KPI */}
                <div className="rm-kpi-row">
                  {[
                    { label: 'Total Cases', val: rmCases.length, color: 'var(--purple)' },
                    { label: 'Docs Pending', val: docsPending, color: 'var(--warning)' },
                    { label: 'Overdue Reminders', val: overdueReminders.length, color: 'var(--danger)' },
                    { label: 'Disbursed', val: rmCases.filter(m => m.caseStage === 'Disbursed').length, color: 'var(--success)' },
                  ].map(k => (
                    <div key={k.label} className="rm-kpi-card">
                      <div className="rm-kpi-label">{k.label}</div>
                      <div className="rm-kpi-val" style={{ color: k.color }}>{k.val}</div>
                    </div>
                  ))}
                </div>

                {/* Stage wise */}
                <div className="rm-card">
                  <div className="rm-card-head">
                    <div>
                      <div className="rm-card-title">Stage-wise breakdown</div>
                      <div className="rm-card-sub">// {rmCases.length} total cases</div>
                    </div>
                  </div>
                  <div className="rm-card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                      {['Login', 'Document', 'Valuation', 'Legal', 'Sanction', 'Disbursed', 'Rejected'].map(stage => {
                        const count = rmCases.filter(m => m.caseStage === stage).length;
                        const color = STAGE_COLORS[stage];
                        return (
                          <div key={stage} style={{ textAlign: 'center', padding: '12px 8px', borderRadius: '10px', background: `${color}0d`, border: `1px solid ${color}22` }}>
                            <div style={{ fontSize: '22px', fontWeight: 800, color }}>{count}</div>
                            <div style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono',monospace", marginTop: '4px' }}>{stage}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Today reminders */}
                <div className="rm-card">
                  <div className="rm-card-head">
                    <div className="rm-card-title">Today's Reminders</div>
                  </div>
                  {overdueReminders.filter(r => r.reminderDate === today).length === 0
                    ? <div className="rm-empty">No reminders today</div>
                    : overdueReminders.filter(r => r.reminderDate === today).map(r => {
                      // r.leadId ek lead ID hai — seedha lead dhundo, meeting ke zariye nahi.
                      const lead = getLead(r.leadId);
                      return (
                        <div key={r.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '12px' }}>{lead?.clientName || '—'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>{r.remark}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="rm-btn rm-btn-green" onClick={() => markFollowUpDone(r.id)}>{I.check} Done</button>
                            <button className="rm-btn rm-btn-red" onClick={() => deleteFollowUpReminder(r.id)}>{I.trash}</button>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* CASES */}
            {activeTab === 'cases' && (
              <div className="fade-in">
                <div className="rm-topbar">
                  <div>
                    <div className="rm-page-title">Cases</div>
                    <div className="rm-page-sub">// {rmCases.length} active cases — click to expand</div>
                  </div>
                  <div className="rm-clock">{clock}</div>
                </div>

                {rmCases.length === 0
                  ? <div className="rm-card"><div className="rm-empty">No cases yet — waiting for login done</div></div>
                  : rmCases.map(m => {
                    const lead = getLead(m.leadId);
                    const remarks = getMeetingRemarks(m.id);
                    const reminders = getMeetingReminders(m.id);
                    const isExpanded = expandedCase === m.id;
                    const hasOverdue = reminders.some(r => !r.isDone && r.reminderDate <= today);

                    return (
                      <div key={m.id} className="rm-card" style={{ border: hasOverdue ? '1px solid rgba(255,71,87,0.3)' : undefined }}>
                        {/* Case header */}
                        <div
                          onClick={() => setExpandedCase(isExpanded ? null : m.id)}
                          style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                        >
                          <PriorityDot priority={m.rmPriority} />
                          <div style={{ flex: 2 }}>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{lead?.clientName || lead?.clientName || '—'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>{lead?.phoneNumber || '—'} · ₹{lead?.loanRequirement || '—'}</div>
                          </div>
                          <div style={{ flex: 1 }}>
                            {m.caseStage ? <StageBadge stage={m.caseStage} /> : <span style={{ fontSize: '10px', color: 'var(--text3)' }}>No stage</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '11px', color: m.documentsReceived ? 'var(--success)' : 'var(--warning)' }}>
                              {m.documentsReceived ? '📄 Docs ✓' : '📄 Docs Pending'}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{remarks.length} remarks · {reminders.filter(r => !r.isDone).length} reminders</div>
                          {hasOverdue && <span style={{ fontSize: '9px', color: 'var(--danger)', fontWeight: 700 }}>⚠ OVERDUE</span>}
                          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>

                        {/* Expanded */}
                        {isExpanded && (
                          <div className="rm-expanded">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                              {/* Left — Case details */}
                              <div>
                                {/* Stage track */}
                                <div className="rm-section-label">Case Stage</div>
                                <div className="stage-track" style={{ marginBottom: '16px' }}>
                                  {STAGES.map(s => {
                                    const color = STAGE_COLORS[s];
                                    const isActive = m.caseStage === s;
                                    return (
                                      <button key={s} className="stage-dot" onClick={() => updateMeeting(m.id, { caseStage: s as any })}
                                        style={{ background: isActive ? `${color}20` : 'transparent', color: isActive ? color : 'var(--text3)', borderColor: isActive ? color : 'var(--border2)' }}>
                                        {s}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Priority */}
                                <div className="rm-section-label">Priority</div>
                                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                                  {['High', 'Medium', 'Low'].map(p => {
                                    const map: Record<string, string> = { High: '#ff4757', Medium: '#f59e0b', Low: '#00d4aa' };
                                    const color = map[p];
                                    const isActive = m.rmPriority === p;
                                    return (
                                      <button key={p} className="stage-dot" onClick={() => updateMeeting(m.id, { rmPriority: p as any })}
                                        style={{ background: isActive ? `${color}20` : 'transparent', color: isActive ? color : 'var(--text3)', borderColor: isActive ? color : 'var(--border2)' }}>
                                        {p}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Documents */}
                                <div className="rm-section-label">Documents</div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
                                  <button className={`rm-btn ${m.documentsReceived ? 'rm-btn-green' : 'rm-btn-blue'}`}
                                    onClick={() => updateMeeting(m.id, { documentsReceived: !m.documentsReceived })}>
                                    {m.documentsReceived ? '✓ Received' : 'Mark Received'}
                                  </button>
                                </div>

                                {/* Report Date */}
                                <div className="rm-section-label">Valuation Report Date</div>
                                <input type="date" className="rm-date-input"
                                  value={m.reportDate || ''}
                                  onChange={e => updateMeeting(m.id, { reportDate: e.target.value })}
                                  style={{ marginBottom: '16px', display: 'block' }}
                                />

                                {/* Status */}
                                <div className="rm-section-label">Status Update</div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {(['Legal Team Sent', 'Disbursed', 'On Hold', 'Rejected', 'Follow-up'] as any[]).map(s => (
                                    <button key={s} className="stage-dot" onClick={() => updateMeeting(m.id, { status: s })}
                                      style={{ background: m.status === s ? 'rgba(61,127,255,0.15)' : 'transparent', color: m.status === s ? 'var(--accent)' : 'var(--text3)', borderColor: m.status === s ? 'rgba(61,127,255,0.3)' : 'var(--border2)', fontSize: '10px', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', border: '1px solid', fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Right — Remarks + Reminders */}
                              <div>
                                {/* Reminders */}
                                <div className="rm-section-label">Reminders</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                                  {reminders.length === 0 && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>No reminders</div>}
                                  {reminders.map(r => (
                                    <div key={r.id} style={{
                                      padding: '8px 10px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start',
                                      background: r.isDone ? 'transparent' : r.reminderDate < today ? 'rgba(255,71,87,0.08)' : r.reminderDate === today ? 'rgba(245,158,11,0.08)' : 'rgba(61,127,255,0.06)',
                                      border: `1px solid ${r.isDone ? 'var(--border)' : r.reminderDate < today ? 'rgba(255,71,87,0.2)' : r.reminderDate === today ? 'rgba(245,158,11,0.2)' : 'rgba(61,127,255,0.15)'}`,
                                      opacity: r.isDone ? 0.5 : 1,
                                    }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: r.isDone ? 'var(--text3)' : r.reminderDate < today ? 'var(--danger)' : r.reminderDate === today ? 'var(--warning)' : 'var(--accent)', fontFamily: 'monospace' }}>
                                          {r.isDone ? '✓ Done' : r.reminderDate < today ? '⚠ Overdue' : r.reminderDate === today ? '● Today' : r.reminderDate}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{r.remark}</div>
                                      </div>
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        {!r.isDone && <button className="rm-btn rm-btn-green" style={{ padding: '3px 8px' }} onClick={() => markFollowUpDone(r.id)}>{I.check}</button>}
                                        <button className="rm-btn rm-btn-red" style={{ padding: '3px 8px' }} onClick={() => deleteFollowUpReminder(r.id)}>{I.trash}</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                                  <input type="date" className="rm-date-input" value={reminderInput[m.id]?.date || ''} min={today}
                                    onChange={e => setReminderInput(prev => ({ ...prev, [m.id]: { ...prev[m.id], date: e.target.value } }))} />
                                  <input className="rm-input" placeholder="Reminder note..." value={reminderInput[m.id]?.remark || ''}
                                    onChange={e => setReminderInput(prev => ({ ...prev, [m.id]: { ...prev[m.id], remark: e.target.value } }))}
                                    onKeyDown={e => e.key === 'Enter' && handleAddReminder(m.id)} />
                                  <button className="rm-btn rm-btn-purple" onClick={() => handleAddReminder(m.id)} style={{ alignSelf: 'flex-start' }}>
                                    {I.bell} Add Reminder
                                  </button>
                                </div>

                                {/* Remarks */}
                                <div className="rm-section-label">Remarks</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                  {remarks.length === 0 && <div style={{ fontSize: '11px', color: 'var(--text3)' }}>No remarks yet</div>}
                                  {remarks.map(r => (
                                    <div key={r.id} style={{ padding: '8px 10px', borderRadius: '8px', background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                                      <div style={{ fontSize: '12px', color: 'var(--text)' }}>{r.remark}</div>
                                      <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '4px', fontFamily: 'monospace' }}>{timeAgo(r.createdAt)}</div>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <input className="rm-input" placeholder="Add remark..." value={remarkText[m.id] || ''}
                                    onChange={e => setRemarkText(prev => ({ ...prev, [m.id]: e.target.value }))}
                                    onKeyDown={e => e.key === 'Enter' && handleAddRemark(m.id)} />
                                  <button className="rm-btn rm-btn-blue" onClick={() => handleAddRemark(m.id)}>Save</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            )}

            {/* REMINDERS */}
            {activeTab === 'reminders' && (
              <div className="fade-in">
                <div className="rm-topbar">
                  <div>
                    <div className="rm-page-title">Reminders</div>
                    <div className="rm-page-sub">// {followUpReminders.filter(r => !r.isDone).length} pending · {overdueReminders.length} overdue</div>
                  </div>
                  <div className="rm-clock">{clock}</div>
                </div>

                {/* Overdue */}
                {overdueReminders.length > 0 && (
                  <div className="rm-card" style={{ border: '1px solid rgba(255,71,87,0.3)' }}>
                    <div className="rm-card-head">
                      <div className="rm-card-title" style={{ color: 'var(--danger)' }}>⚠ Overdue ({overdueReminders.length})</div>
                    </div>
                    {overdueReminders.map(r => {
                      const lead = getLead(r.leadId);
                      return (
                        <div key={r.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '12px' }}>{lead?.clientName || '—'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{r.remark}</div>
                            <div style={{ fontSize: '10px', color: 'var(--danger)', fontFamily: 'monospace', marginTop: '2px' }}>Due: {r.reminderDate}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="rm-btn rm-btn-green" onClick={() => markFollowUpDone(r.id)}>{I.check} Done</button>
                            <button className="rm-btn rm-btn-red" onClick={() => deleteFollowUpReminder(r.id)}>{I.trash}</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Upcoming */}
                <div className="rm-card">
                  <div className="rm-card-head"><div className="rm-card-title">Upcoming Reminders</div></div>
                  {followUpReminders.filter(r => !r.isDone && r.reminderDate > today).length === 0
                    ? <div className="rm-empty">No upcoming reminders</div>
                    : followUpReminders.filter(r => !r.isDone && r.reminderDate > today).sort((a, b) => a.reminderDate.localeCompare(b.reminderDate)).map(r => {
                      const lead = getLead(r.leadId);
                      return (
                        <div key={r.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '12px' }}>{lead?.clientName || '—'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{r.remark}</div>
                            <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: 'monospace', marginTop: '2px' }}>{r.reminderDate}</div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="rm-btn rm-btn-green" onClick={() => markFollowUpDone(r.id)}>{I.check} Done</button>
                            <button className="rm-btn rm-btn-red" onClick={() => deleteFollowUpReminder(r.id)}>{I.trash}</button>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            )}

            {/* HISTORY */}
            {activeTab === 'history' && (
              <div className="fade-in">
                <div className="rm-topbar">
                  <div>
                    <div className="rm-page-title">History</div>
                    <div className="rm-page-sub">// All cases record</div>
                  </div>
                  <div className="rm-clock">{clock}</div>
                </div>
                <div className="rm-card">
                  <div className="rm-card-head"><div className="rm-card-title">All Cases ({rmCases.length})</div></div>
                  <table className="rm-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Phone</th>
                        <th>Loan</th>
                        <th>Stage</th>
                        <th>Priority</th>
                        <th>Documents</th>
                        <th>Report Date</th>
                        <th>Status</th>
                        <th>Mini Login</th>
                        <th>Full Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rmCases.map(m => {
                        const lead = getLead(m.leadId);
                        return (
                          <tr key={m.id}>
                            <td className="rm-td rm-pri">{lead?.clientName || lead?.clientName || '—'}</td>
                            <td className="rm-td" style={{ fontFamily: 'monospace', fontSize: '11px' }}>{lead?.phoneNumber || '—'}</td>
                            <td className="rm-td" style={{ fontSize: '11px' }}>₹{lead?.loanRequirement || '—'}</td>
                            <td className="rm-td">{m.caseStage ? <StageBadge stage={m.caseStage} /> : <span style={{ color: 'var(--text3)', fontSize: '10px' }}>—</span>}</td>
                            <td className="rm-td"><PriorityDot priority={m.rmPriority} /><span style={{ fontSize: '11px' }}>{m.rmPriority || '—'}</span></td>
                            <td className="rm-td">
                              <span style={{ fontSize: '11px', color: m.documentsReceived ? 'var(--success)' : 'var(--warning)' }}>
                                {m.documentsReceived ? '✓ Yes' : 'Pending'}
                              </span>
                            </td>
                            <td className="rm-td" style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text3)' }}>{m.reportDate || '—'}</td>
                            <td className="rm-td" style={{ fontSize: '11px' }}>{m.status || '—'}</td>
                            <td className="rm-td">
                              <span style={{ fontSize: '11px', color: m.miniLogin ? 'var(--success)' : 'var(--text3)' }}>{m.miniLogin ? `✓ ${m.miniLoginDate || ''}` : '—'}</span>
                            </td>
                            <td className="rm-td">
                              <span style={{ fontSize: '11px', color: m.fullLogin ? 'var(--accent)' : 'var(--text3)' }}>{m.fullLogin ? `✓ ${m.fullLoginDate || ''}` : '—'}</span>
                            </td>
                          </tr>
                        );
                      })}
                      {rmCases.length === 0 && <tr><td colSpan={10} className="rm-empty">No cases yet</td></tr>}
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