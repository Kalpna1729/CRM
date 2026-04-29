// import { useState, useMemo, useEffect, Fragment } from 'react';
// import { useCRM } from '@/contexts/CRMContext';
// import { Meeting } from '@/types/crm';
// import { toast } from 'sonner';

// type Tab = 'overview' | 'pending' | 'followup' | 'history';
// type Theme = 'dark' | 'light';
// type Period = 'daily' | 'weekly' | 'monthly' | 'custom';

// const I = {
//   overview: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
//   pending:  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
//   followup: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 4l-5 5-4-4L5 14"/><path d="M17 4h6v6"/></svg>,
//   history:  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
//   sun:      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
//   moon:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
//   logout:   <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
//   bell:     <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
//   msg:      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
//   check:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
//   x:        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
//   rupee:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="6" y1="4" x2="18" y2="4"/><line x1="6" y1="9" x2="18" y2="9"/><line x1="15" y1="14" x2="6" y2="21"/><path d="M6 9a6 6 0 000 5h3"/></svg>,
//   chevron:  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>,
// };

// // ─── Role colour map — same palette as BDM dashboard ─────────────────────────
// const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
//   BDM: { bg: 'rgba(61,127,255,0.15)',  color: '#3d7fff' },
//   BDO: { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
//   BO:  { bg: 'rgba(0,212,170,0.15)',   color: '#00d4aa' },
//   TC:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
//   FM:  { bg: 'rgba(255,107,53,0.15)',  color: '#ff6b35' },
//   RM:  { bg: 'rgba(236,72,153,0.15)',  color: '#ec4899' },
//   FO:  { bg: 'rgba(99,102,241,0.15)',  color: '#6366f1' },
// };

// function getDateRange(period: Period, customFrom: string, customTo: string) {
//   const today = new Date();
//   const fmt = (d: Date) => d.toISOString().split('T')[0];
//   if (period === 'daily') return { from: fmt(today), to: fmt(today) };
//   if (period === 'weekly') { const mon = new Date(today); mon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); return { from: fmt(mon), to: fmt(today) }; }
//   if (period === 'monthly') { const first = new Date(today.getFullYear(), today.getMonth(), 1); return { from: fmt(first), to: fmt(today) }; }
//   return { from: customFrom || fmt(today), to: customTo || fmt(today) };
// }

// function statusColor(status: string) {
//   const map: Record<string, string> = {
//     'Pending': 'var(--warning)', 'Follow-up': 'var(--purple)',
//     'Walk-in Done': 'var(--teal)', 'Walking Done': 'var(--success)',
//     'Invalid': 'var(--danger)', 'Meeting Done': 'var(--success)',
//     'Scheduled': 'var(--accent)', 'Not Done': 'var(--danger)',
//     'Reschedule Requested': 'var(--orange)',
//   };
//   return map[status] || 'var(--text3)';
// }

// function StatusBadge({ status }: { status: string }) {
//   const color = statusColor(status);
//   return (
//     <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', fontFamily: "'JetBrains Mono', monospace", color, background: `${color}18`, border: `1px solid ${color}33` }}>
//       {status || '—'}
//     </span>
//   );
// }

// function Sparkline({ data, color }: { data: number[]; color: string }) {
//   if (data.length < 2) return null;
//   const max = Math.max(...data, 1);
//   const W = 80, H = 28;
//   const pts = data.map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * (H - 4) - 2}`).join(' ');
//   return (
//     <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
//       <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
//       {data.map((v, i) => <circle key={i} cx={(i / (data.length - 1)) * W} cy={H - (v / max) * (H - 4) - 2} r="2" fill={color} />)}
//     </svg>
//   );
// }

// function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
//   const total = segments.reduce((s, d) => s + d.value, 0);
//   if (total === 0) return <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '11px', padding: '20px 0' }}>no data</div>;
//   let offset = 0;
//   return (
//     <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
//       <div style={{ position: 'relative', flexShrink: 0 }}>
//         <svg viewBox="0 0 36 36" width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
//           {segments.filter(d => d.value > 0).map((d, i) => {
//             const pct = (d.value / total) * 100;
//             const el = <circle key={i} cx="18" cy="18" r="14" fill="none" stroke={d.color} strokeWidth="5" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} />;
//             offset += pct;
//             return el;
//           })}
//         </svg>
//         <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
//           <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}>{total}</span>
//           <span style={{ fontSize: '8px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>total</span>
//         </div>
//       </div>
//       <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
//         {segments.map(d => (
//           <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
//             <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
//             <span style={{ fontSize: '11px', color: 'var(--text2)', flex: 1 }}>{d.label}</span>
//             <span style={{ fontSize: '11px', fontWeight: 700, color: d.color, fontFamily: "'JetBrains Mono', monospace" }}>{d.value}</span>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default function BDODashboard() {
//   const { currentUser, leads, users, meetings, meetingRemarks, addMeetingRemark, updateMeeting, logout } = useCRM();

//   const [activeTab, setActiveTab] = useState<Tab>('overview');
//   const [theme, setTheme] = useState<Theme>('light');
//   const [period, setPeriod] = useState<Period>('monthly');
//   const [customFrom, setCustomFrom] = useState('');
//   const [customTo, setCustomTo] = useState('');
//   const [clock, setClock] = useState('');
//   const [alerts, setAlerts] = useState<{ id: string; msg: string; type: 'warn' | 'info' }[]>([]);
//   const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
//   const [walkinDateMap, setWalkinDateMap] = useState<Record<string, string>>({});
//   const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);
//   const [remarkText, setRemarkText] = useState<Record<string, string>>({});
//   const [viewFormLeadId, setViewFormLeadId] = useState<string | null>(null);

//   useEffect(() => {
//     const tick = () => {
//       const n = new Date();
//       setClock(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')} ${n.getHours() >= 12 ? 'PM' : 'AM'}`);
//     };
//     tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
//   }, []);

//   const today = new Date().toISOString().split('T')[0];
//   const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
//   const { from, to } = getDateRange(period, customFrom, customTo);
//   const isDark = theme === 'dark';

//   const allMyMeetings = useMemo(() => meetings.filter((m: Meeting) => m.bdoId === currentUser?.id), [meetings, currentUser]);
//   const filteredMeetings = useMemo(() => allMyMeetings.filter((m: Meeting) => m.date >= from && m.date <= to), [allMyMeetings, from, to]);

//   const pendingMeetings = useMemo(() =>
//     allMyMeetings.filter((m: Meeting) => m.status === 'Pending' && (m.bdoStatus === undefined || m.bdoStatus === null)),
//     [allMyMeetings]
//   );

//   const followUpMeetings = useMemo(() =>
//     allMyMeetings.filter((m: Meeting) => m.bdoStatus === 'Follow-up' && m.walkingStatus !== 'Walking Done' && m.walkingStatus !== 'Invalid'),
//     [allMyMeetings]
//   );

//   const stats = useMemo(() => ({
//     total: filteredMeetings.length,
//     pending: filteredMeetings.filter((m: Meeting) => m.status === 'Pending' && !m.bdoStatus).length,
//     followup: filteredMeetings.filter((m: Meeting) => m.bdoStatus === 'Follow-up').length,
//     walkInDone: filteredMeetings.filter((m: Meeting) => m.walkingStatus === 'Walking Done').length,
//     walkInInvalid: filteredMeetings.filter((m: Meeting) => m.walkingStatus === 'Invalid').length,
//     notDone: filteredMeetings.filter((m: Meeting) => m.status === 'Not Done').length,
//     scheduled: filteredMeetings.filter((m: Meeting) => m.status === 'Scheduled').length,
//   }), [filteredMeetings]);

//   const dailyTrend = useMemo(() => {
//     const days = period === 'daily' ? 7 : period === 'weekly' ? 7 : 30;
//     return Array.from({ length: days }, (_, i) => {
//       const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
//       return allMyMeetings.filter((m: Meeting) => m.date === d.toISOString().split('T')[0]).length;
//     });
//   }, [allMyMeetings, period]);

//   useEffect(() => {
//     const newAlerts: { id: string; msg: string; type: 'warn' | 'info' }[] = [];
//     if (pendingMeetings.length > 0)
//       newAlerts.push({ id: 'pending', msg: `${pendingMeetings.length} meeting${pendingMeetings.length > 1 ? 's' : ''} pending your action`, type: 'warn' });
//     if (followUpMeetings.length > 0)
//       newAlerts.push({ id: 'followup', msg: `${followUpMeetings.length} follow-up meeting${followUpMeetings.length > 1 ? 's' : ''} need attention`, type: 'info' });
//     const overdueWalkin = allMyMeetings.filter((m: Meeting) => m.bdoStatus === 'Follow-up' && m.walkinDate && m.walkinDate < today && m.walkingStatus !== 'Walking Done' && m.walkingStatus !== 'Invalid');
//     if (overdueWalkin.length > 0)
//       newAlerts.push({ id: 'overdue_walkin', msg: `${overdueWalkin.length} walk-in date(s) overdue`, type: 'warn' });
//     setAlerts(newAlerts);
//   }, [pendingMeetings.length, followUpMeetings.length, allMyMeetings, today]);

//   const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

//   const handleFollowUp = async (meetingId: string) => {
//     await updateMeeting(meetingId, { bdoStatus: 'Follow-up', bdoId: currentUser?.id });
//     toast.success('Marked as Follow-up');
//   };

//   const handleSetWalkinDate = async (meetingId: string, date: string) => {
//     if (!date) { toast.error('Select a date'); return; }
//     await updateMeeting(meetingId, { walkinDate: date });
//     setWalkinDateMap(prev => ({ ...prev, [meetingId]: date }));
//     toast.success('Walk-in date set');
//   };

//   const handleWalkingDone = async (meetingId: string) => {
//     await updateMeeting(meetingId, { walkingStatus: 'Walking Done', bdoStatus: 'Walk-in Done' });
//     toast.success('Walk-in marked as Done');
//   };

//   const handleWalkingInvalid = async (meetingId: string) => {
//     await updateMeeting(meetingId, { walkingStatus: 'Invalid' });
//     toast.success('Walk-in marked as Invalid');
//   };

//   const handleAddRemark = async (meetingId: string) => {
//     const text = remarkText[meetingId]?.trim();
//     if (!text) { toast.error('Enter a remark'); return; }
//     await addMeetingRemark(meetingId, text, currentUser?.name || 'BDO');
//     setRemarkText(prev => ({ ...prev, [meetingId]: '' }));
//     toast.success('Remark added');
//   };

//   // ─── Helper: get role badge for a remark's createdBy ─────────────────────
//   // meetingRemarks.createdBy stores the user's NAME (string), not ID
//   // So we match by name to find the user and get their role
//   const getRemarkRoleInfo = (createdBy: string) => {
//     const user = users.find(u => u.name === createdBy || u.id === createdBy);
//     const role = user?.role || '';
//     const style = ROLE_COLORS[role] || { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' };
//     return { role, style };
//   };

//   // ─── Expanded Panel ────────────────────────────────────────────────────────
//   const renderExpandedPanel = (m: Meeting) => {
//     const lead = leads.find(l => l.id === m.leadId);
//     const bdm = users.find(u => u.id === m.bdmId);
//     const walkinInput = walkinDateMap[m.id] ?? m.walkinDate ?? '';
//     const mRemarks = meetingRemarks
//       .filter(r => r.meetingId === m.id)
//       .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
//     const isOverdue = walkinInput && walkinInput < today;

//     return (
//       <tr>
//         <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid var(--border2)' }}>
//           <div style={{
//             background: isDark ? 'rgba(245,158,11,0.03)' : 'rgba(245,158,11,0.02)',
//             borderTop: '1px solid var(--border2)',
//             padding: '16px 18px',
//             display: 'grid',
//             gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
//             gap: '14px',
//           }}>

//             {/* Walk-in Management */}
//             <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '13px' }}>
//               <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1.5px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px' }}>
//                 📅 WALK-IN MANAGEMENT
//               </div>
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
//                 <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace' }}>
//                   {m.walkinDate ? `Current: ${m.walkinDate}` : 'No walk-in date set'}
//                 </div>
//                 <input
//                   type="date"
//                   value={walkinInput}
//                   min={today}
//                   onChange={e => setWalkinDateMap(prev => ({ ...prev, [m.id]: e.target.value }))}
//                   style={{
//                     background: 'var(--bg3)', border: `1px solid ${isOverdue ? 'var(--danger)' : 'var(--border2)'}`,
//                     borderRadius: '6px', padding: '5px 8px', color: 'var(--text)',
//                     fontSize: '11px', outline: 'none', width: '100%', boxSizing: 'border-box',
//                   }}
//                 />
//                 {isOverdue && <span style={{ fontSize: '9px', color: 'var(--danger)', fontFamily: 'monospace' }}>⚠ Overdue</span>}
//                 <button
//                   disabled={!walkinInput}
//                   onClick={() => handleSetWalkinDate(m.id, walkinInput)}
//                   style={{
//                     padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border2)',
//                     background: walkinInput ? 'rgba(245,158,11,0.1)' : 'var(--surface2)',
//                     color: walkinInput ? 'var(--warning)' : 'var(--text3)',
//                     fontSize: '10px', fontWeight: 600, cursor: walkinInput ? 'pointer' : 'not-allowed',
//                     fontFamily: "'JetBrains Mono',monospace",
//                   }}
//                 >
//                   {m.walkinDate ? '📅 Update Date' : '📅 Set Date'}
//                 </button>

//                 {m.walkinDate && !m.walkingStatus && (
//                   <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
//                     <button
//                       onClick={() => handleWalkingDone(m.id)}
//                       style={{
//                         flex: 1, padding: '5px 6px', borderRadius: '6px',
//                         background: 'rgba(0,212,170,0.1)', color: 'var(--success)',
//                         border: '1px solid rgba(0,212,170,0.25)', fontSize: '10px',
//                         fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace",
//                       }}
//                     >✓ Walk-in Done</button>
//                     <button
//                       onClick={() => handleWalkingInvalid(m.id)}
//                       style={{
//                         flex: 1, padding: '5px 6px', borderRadius: '6px',
//                         background: 'rgba(255,71,87,0.1)', color: 'var(--danger)',
//                         border: '1px solid rgba(255,71,87,0.25)', fontSize: '10px',
//                         fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace",
//                       }}
//                     >✕ Denied for Walkin</button>
//                   </div>
//                 )}

//                 {m.walkingStatus && (
//                   <div style={{
//                     padding: '5px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
//                     fontFamily: 'monospace',
//                     background: m.walkingStatus === 'Walking Done' ? 'rgba(0,212,170,0.1)' : 'rgba(255,71,87,0.1)',
//                     color: m.walkingStatus === 'Walking Done' ? 'var(--success)' : 'var(--danger)',
//                     border: `1px solid ${m.walkingStatus === 'Walking Done' ? 'rgba(0,212,170,0.2)' : 'rgba(255,71,87,0.2)'}`,
//                   }}>
//                     {m.walkingStatus === 'Walking Done' ? '✓ Walk-in Done' : '✕ Denied for Walk-in'}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Status Info */}
//             <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '13px' }}>
//               <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1.5px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px' }}>
//                 📊 STATUS INFO
//               </div>
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
//                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                   <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>Meeting</span>
//                   <StatusBadge status={m.status} />
//                 </div>
//                 {m.bdoStatus && (
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>BDO Status</span>
//                     <StatusBadge status={m.bdoStatus} />
//                   </div>
//                 )}
//                 {m.walkinDate && (
//                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                     <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>Walk-in Date</span>
//                     <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', fontFamily: 'monospace' }}>{m.walkinDate}</span>
//                   </div>
//                 )}
//                 <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
//                   <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace', marginBottom: '5px' }}>LEAD INFO</div>
//                   <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{lead?.clientName || '—'}</div>
//                   <div style={{ fontSize: '11px', color: 'var(--warning)', fontFamily: 'monospace' }}>₹{lead?.loanRequirement}</div>
//                   {lead?.phoneNumber && <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace', marginTop: '2px' }}>{lead.phoneNumber}</div>}
//                   <div style={{ marginTop: '5px' }}>{bdm && <span style={{ fontSize: '10px', color: 'var(--text2)' }}>BDM: {bdm.name}</span>}</div>
//                 </div>
//               </div>
//             </div>

//             {/* ── Remarks — same card design, role badge added to each entry ── */}
//             <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '13px' }}>
//               <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1.5px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
//                 💬 REMARKS
//                 {mRemarks.length > 0 && (
//                   <span style={{ background: 'var(--warning)', color: '#fff', fontSize: '9px', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>
//                     {mRemarks.length}
//                   </span>
//                 )}
//               </div>

//               {/* Remark list */}
//               <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '130px', overflowY: 'auto', marginBottom: '8px' }}>
//                 {mRemarks.length === 0 && (
//                   <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>No remarks yet</div>
//                 )}
//                 {mRemarks.map(r => {
//                   const { role, style } = getRemarkRoleInfo(r.createdBy);
//                   return (
//                     <div key={r.id} style={{
//                       background: 'var(--bg3)', border: '1px solid var(--border)',
//                       borderRadius: '6px', padding: '6px 9px',
//                     }}>
//                       {/* Remark text — unchanged */}
//                       <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '4px' }}>{r.remark}</div>

//                       {/* Footer line: name + role badge + timestamp */}
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
//                         <span style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: 'monospace' }}>
//                           {r.createdBy}
//                         </span>

//                         {/* Role badge — only shown if role is identified */}
//                         {role && (
//                           <span style={{
//                             fontSize: '8px', fontWeight: 700,
//                             padding: '1px 6px', borderRadius: '20px',
//                             background: style.bg, color: style.color,
//                             border: `1px solid ${style.color}40`,
//                             fontFamily: "'JetBrains Mono', monospace",
//                             letterSpacing: '0.5px',
//                           }}>
//                             {role}
//                           </span>
//                         )}

//                         <span style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: 'monospace', marginLeft: 'auto' }}>
//                           {new Date(r.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
//                         </span>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>

//               {/* Add remark input — completely unchanged */}
//               <div style={{ display: 'flex', gap: '5px' }}>
//                 <input
//                   value={remarkText[m.id] || ''}
//                   onChange={e => setRemarkText(prev => ({ ...prev, [m.id]: e.target.value }))}
//                   placeholder="Add remark..."
//                   onKeyDown={e => { if (e.key === 'Enter') handleAddRemark(m.id); }}
//                   style={{
//                     flex: 1, background: 'var(--bg3)', border: '1px solid var(--border2)',
//                     borderRadius: '6px', padding: '5px 8px', color: 'var(--text)',
//                     fontSize: '11px', outline: 'none', fontFamily: 'inherit',
//                   }}
//                 />
//                 <button
//                   onClick={() => handleAddRemark(m.id)}
//                   style={{
//                     padding: '5px 10px', borderRadius: '6px', border: 'none',
//                     background: 'var(--warning)', color: '#fff',
//                     fontSize: '11px', fontWeight: 600, cursor: 'pointer',
//                   }}
//                 >
//                   {I.msg}
//                 </button>
//               </div>
//             </div>

//           </div>
//         </td>
//       </tr>
//     );
//   };

//   // ─── Meeting Row renderer ──────────────────────────────────────────────────
//   const renderMeetingRow = (m: Meeting) => {
//     const lead = leads.find(l => l.id === m.leadId);
//     const bdm = users.find(u => u.id === m.bdmId);
//     const isExp = expandedMeeting === m.id;
//     const walkinInput = walkinDateMap[m.id] ?? m.walkinDate ?? '';
//     const isOverdue = walkinInput && walkinInput < today;

//     return (
//       <Fragment key={m.id}>
//         <tr
//           style={{ cursor: 'pointer', background: isExp ? (isDark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.03)') : isOverdue ? 'rgba(255,71,87,0.04)' : undefined, transition: 'background 0.12s' }}
//           onClick={() => setExpandedMeeting(isExp ? null : m.id)}
//         >
//           <td className="bdo-td bdo-pri">
//             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//               <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--warning)', flexShrink: 0 }}>
//                 {(lead?.clientName || '?')[0]}
//               </div>
//               <div>
//                 <div>{lead?.clientName || '—'}</div>
//                 <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: "'JetBrains Mono',monospace" }}>₹{lead?.loanRequirement}</div>
//               </div>
//             </div>
//           </td>
//           <td className="bdo-td">
//             <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px' }}>{m.date}</div>
//             <div style={{ fontSize: '10px', color: 'var(--warning)', fontFamily: "'JetBrains Mono',monospace" }}>{m.timeSlot}</div>
//           </td>
//           <td className="bdo-td" style={{ fontSize: '11px', color: 'var(--text2)' }}>{lead?.phoneNumber || '—'}</td>
//           <td className="bdo-td" style={{ fontSize: '11px' }}>{bdm?.name || '—'}</td>
//           <td className="bdo-td"><span style={{ fontSize: '10px', background: 'var(--surface2)', color: 'var(--text2)', padding: '2px 7px', borderRadius: '4px' }}>{m.meetingType}</span></td>
//           <td className="bdo-td">
//             <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
//               <StatusBadge status={m.status} />
//               {m.bdoStatus && <StatusBadge status={m.bdoStatus} />}
//             </div>
//           </td>
//           <td className="bdo-td" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', color: isOverdue ? 'var(--danger)' : 'var(--text3)' }}>
//             {m.walkinDate ? (isOverdue ? `⚠ ${m.walkinDate}` : m.walkinDate) : '—'}
//           </td>
//           <td className="bdo-td">
//             <span style={{
//               display: 'inline-flex', alignItems: 'center', gap: '4px',
//               fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace',
//               transition: 'transform 0.2s',
//               transform: isExp ? 'rotate(180deg)' : 'rotate(0deg)',
//             }}>
//               {I.chevron}
//             </span>
//           </td>
//         </tr>
//         {isExp && renderExpandedPanel(m)}
//       </Fragment>
//     );
//   };

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
//         .bdo-root.dark{--bg:#07080f;--bg2:#0d0f1a;--bg3:#12152a;--surface:#161929;--surface2:#1c2038;--border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.1);--accent:#3d7fff;--success:#00d4aa;--warning:#f59e0b;--danger:#ff4757;--purple:#a78bfa;--orange:#ff6b35;--teal:#06b6d4;--text:#e8eaf6;--text2:#8892b0;--text3:#4a5568;}
//         .bdo-root.light{--bg:#f4f5fa;--bg2:#ffffff;--bg3:#eef0f7;--surface:#ffffff;--surface2:#eef0f7;--border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.12);--accent:#2563eb;--success:#059669;--warning:#d97706;--danger:#dc2626;--purple:#7c3aed;--orange:#ea580c;--teal:#0891b2;--text:#0f172a;--text2:#475569;--text3:#94a3b8;}
//         .bdo-root{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
//         .bdo-layout{display:flex;min-height:100vh;}
//         .bdo-sidebar{width:220px;flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow:hidden;}
//         .bdo-sidebar::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--warning),var(--orange),transparent);}
//         .bdo-brand{padding:22px 20px 16px;border-bottom:1px solid var(--border);}
//         .bdo-brand-tag{font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--warning);font-family:'JetBrains Mono',monospace;margin-bottom:6px;}
//         .bdo-brand-name{font-size:17px;font-weight:800;color:var(--text);line-height:1.2;}
//         .bdo-user{margin:12px 18px;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:10px;display:flex;align-items:center;gap:9px;}
//         .bdo-user-ava{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,var(--warning),var(--orange));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}
//         .bdo-user-name{font-size:12px;font-weight:600;color:var(--text);}
//         .bdo-user-role{font-size:9px;color:var(--warning);font-family:'JetBrains Mono',monospace;letter-spacing:1px;}
//         .bdo-nav-section{padding:6px 12px;margin-top:2px;}
//         .bdo-nav-label{font-size:9px;font-weight:600;letter-spacing:2.5px;color:var(--text3);text-transform:uppercase;font-family:'JetBrains Mono',monospace;padding:0 8px;margin-bottom:3px;}
//         .bdo-nav-item{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:9px;cursor:pointer;transition:all 0.15s;font-size:12px;font-weight:500;color:var(--text2);position:relative;margin-bottom:1px;}
//         .bdo-nav-item:hover{background:var(--surface2);color:var(--text);}
//         .bdo-nav-item.active{background:var(--surface2);color:var(--warning);}
//         .bdo-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;background:var(--warning);border-radius:0 3px 3px 0;}
//         .bdo-nav-icon{width:16px;height:16px;opacity:0.6;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
//         .bdo-nav-item.active .bdo-nav-icon{opacity:1;}
//         .bdo-nav-badge{margin-left:auto;font-size:9px;font-weight:700;background:var(--danger);color:#fff;padding:1px 6px;border-radius:8px;font-family:'JetBrains Mono',monospace;}
//         .bdo-nav-badge.info{background:var(--warning);}
//         .bdo-sidebar-foot{margin-top:auto;padding:12px 18px;border-top:1px solid var(--border);}
//         .bdo-status-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--success);margin-right:5px;animation:pdot 2s infinite;}
//         @keyframes pdot{0%,100%{opacity:1}50%{opacity:0.3}}
//         .bdo-footer-info{font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:10px;}
//         .bdo-theme-toggle{display:flex;background:var(--bg3);border:1px solid var(--border2);border-radius:18px;padding:3px;margin-bottom:8px;cursor:pointer;}
//         .bdo-toggle-opt{display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:13px;font-size:10px;font-weight:600;color:var(--text3);transition:all 0.2s;font-family:'JetBrains Mono',monospace;flex:1;justify-content:center;}
//         .bdo-toggle-opt.active{background:var(--surface);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,0.15);}
//         .bdo-logout-btn{display:flex;align-items:center;gap:7px;width:100%;padding:8px 11px;border-radius:8px;font-size:11px;font-weight:600;color:var(--text2);cursor:pointer;background:var(--surface);border:1px solid var(--border);transition:all 0.15s;font-family:inherit;}
//         .bdo-main{flex:1;overflow:auto;padding:26px 28px 60px;}
//         .bdo-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
//         .bdo-page-title{font-size:22px;font-weight:800;letter-spacing:-0.5px;color:var(--text);}
//         .bdo-page-sub{font-size:10px;color:var(--text2);margin-top:2px;font-family:'JetBrains Mono',monospace;}
//         .bdo-clock{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text2);background:var(--surface);border:1px solid var(--border);padding:6px 12px;border-radius:7px;}
//         .period-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:18px;}
//         .period-btn{padding:5px 13px;border-radius:7px;border:1px solid var(--border2);cursor:pointer;font-size:11px;font-weight:600;color:var(--text2);background:var(--surface);transition:all 0.15s;font-family:'JetBrains Mono',monospace;}
//         .period-btn.active{border-color:var(--warning);color:var(--warning);background:rgba(245,158,11,0.08);}
//         .period-date{background:var(--surface);border:1px solid var(--border2);border-radius:7px;padding:5px 9px;color:var(--text);font-size:11px;font-family:'JetBrains Mono',monospace;outline:none;}
//         .period-label{font-size:9px;color:var(--text3);font-family:'JetBrains Mono',monospace;}
//         .period-range-badge{font-size:10px;color:var(--text3);background:var(--bg3);border:1px solid var(--border);padding:4px 10px;border-radius:6px;font-family:'JetBrains Mono',monospace;}
//         .alert-list{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;}
//         .alert-item{display:flex;align-items:center;gap:10px;padding:9px 13px;border-radius:9px;position:relative;overflow:hidden;}
//         .alert-warn{background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);}
//         .alert-info{background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.18);}
//         .alert-warn::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--warning);}
//         .alert-info::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--teal);}
//         .alert-msg{font-size:12px;color:var(--text);flex:1;}
//         .alert-dismiss{font-size:10px;color:var(--text3);cursor:pointer;font-family:'JetBrains Mono',monospace;padding:2px 8px;border:1px solid var(--border2);border-radius:5px;background:transparent;}
//         .alert-go{font-size:10px;cursor:pointer;font-family:'JetBrains Mono',monospace;padding:2px 8px;border-radius:5px;background:transparent;border:1px solid;}
//         .alert-warn .alert-go{color:var(--warning);border-color:rgba(245,158,11,0.3);}
//         .alert-info .alert-go{color:var(--teal);border-color:rgba(6,182,212,0.3);}
//         .kpi-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px;}
//         .kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:15px 14px;transition:transform 0.15s;}
//         .kpi-card:hover{transform:translateY(-2px);}
//         .kpi-label{font-size:9px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text2);font-family:'JetBrains Mono',monospace;margin-bottom:7px;}
//         .kpi-val{font-size:32px;font-weight:800;line-height:1;margin-bottom:6px;}
//         .kpi-spark{display:flex;justify-content:flex-end;margin-top:6px;}
//         .bdo-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:14px;}
//         .bdo-card-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 10px;border-bottom:1px solid var(--border);}
//         .bdo-card-title{font-size:12px;font-weight:700;color:var(--text);}
//         .bdo-card-sub{font-size:10px;color:var(--text2);font-family:'JetBrains Mono',monospace;margin-top:2px;}
//         .bdo-card-body{padding:14px 16px;}
//         .two-col{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;margin-bottom:14px;}
//         .bdo-table{width:100%;border-collapse:collapse;font-size:11px;}
//         .bdo-table th{padding:8px 10px;text-align:left;font-size:9px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text3);font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--border);}
//         .bdo-td{padding:9px 10px;border-bottom:1px solid var(--border);vertical-align:middle;}
//         .bdo-table tr:last-child .bdo-td{border-bottom:none;}
//         .bdo-table tbody tr:hover{background:var(--surface2);}
//         .bdo-pri{color:var(--text);font-weight:600;}
//         .bdo-empty{text-align:center;color:var(--text3);padding:20px;font-size:10px;font-family:'JetBrains Mono',monospace;}
//         .act-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all 0.15s;font-family:'JetBrains Mono',monospace;}
//         .act-followup{background:rgba(167,139,250,0.1);color:var(--purple);border-color:rgba(167,139,250,0.2);}
//         @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
//         .fade-in{animation:fadeInUp 0.25s ease forwards;}
//         ::-webkit-scrollbar{width:4px;height:4px;}
//         ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px;}
//       `}</style>

//       <div className={`bdo-root ${theme}`}>
//         <div className="bdo-layout">
//           <aside className="bdo-sidebar">
//             <div className="bdo-brand">
//               <div className="bdo-brand-tag">CRM · BDO Portal</div>
//               <div className="bdo-brand-name">Field<br />Operations</div>
//             </div>
//             <div className="bdo-user">
//               <div className="bdo-user-ava">{currentUser?.name?.[0] ?? 'B'}</div>
//               <div>
//                 <div className="bdo-user-name">{currentUser?.name || 'BDO'}</div>
//                 <div className="bdo-user-role">BUS. DEV. OFFICER</div>
//               </div>
//             </div>
//             <div className="bdo-nav-section">
//               <div className="bdo-nav-label">Dashboard</div>
//               {([
//                 { id: 'overview', label: 'Overview', icon: I.overview },
//                 { id: 'pending', label: 'Pending', icon: I.pending, badge: pendingMeetings.length > 0 ? pendingMeetings.length : null },
//                 { id: 'followup', label: 'Follow-up', icon: I.followup, badge: followUpMeetings.length > 0 ? followUpMeetings.length : null, badgeCls: 'info' },
//                 { id: 'history', label: 'All Meetings', icon: I.history },
//               ] as any[]).map(item => (
//                 <div key={item.id} className={`bdo-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => { setActiveTab(item.id as Tab); setExpandedMeeting(null); }}>
//                   <div className="bdo-nav-icon">{item.icon}</div>
//                   {item.label}
//                   {item.badge ? <span className={`bdo-nav-badge ${item.badgeCls || ''}`}>{item.badge}</span> : null}
//                 </div>
//               ))}
//             </div>
//             <div className="bdo-sidebar-foot">
//               <div className="bdo-footer-info">
//                 <span className="bdo-status-dot" />Active · {todayStr}<br />
//                 <span style={{ color: 'var(--text3)', marginTop: '2px', display: 'block' }}>{pendingMeetings.length} pending · {allMyMeetings.length} total</span>
//               </div>
//               <div className="bdo-theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
//                 <div className={`bdo-toggle-opt ${isDark ? 'active' : ''}`}>{I.moon} Dark</div>
//                 <div className={`bdo-toggle-opt ${!isDark ? 'active' : ''}`}>{I.sun} Light</div>
//               </div>
//               <button className="bdo-logout-btn" onClick={logout}>{I.logout} Sign Out</button>
//             </div>
//           </aside>

//           <main className="bdo-main">
//             <div className="period-row">
//               {(['daily', 'weekly', 'monthly', 'custom'] as Period[]).map(p => (
//                 <button key={p} className={`period-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
//                   {p.charAt(0).toUpperCase() + p.slice(1)}
//                 </button>
//               ))}
//               {period === 'custom' && (
//                 <>
//                   <span className="period-label">FROM</span>
//                   <input type="date" className="period-date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
//                   <span className="period-label">TO</span>
//                   <input type="date" className="period-date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
//                 </>
//               )}
//               <span className="period-range-badge">{from} → {to}</span>
//             </div>

//             {visibleAlerts.length > 0 && (
//               <div className="alert-list">
//                 {visibleAlerts.map(alert => (
//                   <div key={alert.id} className={`alert-item alert-${alert.type}`}>
//                     <span style={{ fontSize: '14px' }}>{alert.type === 'warn' ? '⚠' : 'ℹ'}</span>
//                     <span className="alert-msg">{alert.msg}</span>
//                     <button className="alert-go" onClick={() => setActiveTab(alert.id === 'pending' ? 'pending' : 'followup')}>View →</button>
//                     <button className="alert-dismiss" onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}>✕</button>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* OVERVIEW */}
//             {activeTab === 'overview' && (
//               <div className="fade-in">
//                 <div className="bdo-topbar">
//                   <div>
//                     <div className="bdo-page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {currentUser?.name?.split(' ')[0] || 'BDO'}</div>
//                     <div className="bdo-page-sub">// {period} view · {from} → {to}</div>
//                   </div>
//                   <div className="bdo-clock">{clock}</div>
//                 </div>
//                 <div className="kpi-row">
//                   {[
//                     { label: 'Total Meetings', val: stats.total, color: 'var(--warning)' },
//                     { label: 'Pending Action', val: stats.pending, color: 'var(--danger)' },
//                     { label: 'Follow-up', val: followUpMeetings.length, color: 'var(--purple)' },
//                     { label: 'Walk-in Done', val: stats.walkInDone, color: 'var(--teal)' },
//                   ].map((k) => (
//                     <div key={k.label} className="kpi-card">
//                       <div className="kpi-label">{k.label}</div>
//                       <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
//                       <div className="kpi-spark"><Sparkline data={dailyTrend} color={k.color} /></div>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="two-col">
//                   <div className="bdo-card">
//                     <div className="bdo-card-head">
//                       <div>
//                         <div className="bdo-card-title">Meeting status breakdown</div>
//                         <div className="bdo-card-sub">// {period} · {stats.total} meetings</div>
//                       </div>
//                     </div>
//                     <div className="bdo-card-body">
//                       <DonutChart segments={[
//                         { label: 'Pending Action', value: stats.pending, color: 'var(--danger)' },
//                         { label: 'Follow-up', value: stats.followup, color: 'var(--purple)' },
//                         { label: 'Walk-in Date Set', value: allMyMeetings.filter(m => m.walkinDate).length, color: 'var(--teal)' },
//                         { label: 'Not Done', value: stats.notDone, color: '#ff4757' },
//                         { label: 'Scheduled', value: stats.scheduled, color: 'var(--accent)' },
//                       ]} />
//                     </div>
//                   </div>
//                   <div className="bdo-card">
//                     <div className="bdo-card-head">
//                       <div>
//                         <div className="bdo-card-title">Today's meetings</div>
//                         <div className="bdo-card-sub">// {todayStr}</div>
//                       </div>
//                     </div>
//                     <div className="bdo-card-body">
//                       {allMyMeetings.filter(m => m.date === today).length === 0
//                         ? <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '11px', padding: '16px 0' }}>No meetings today</div>
//                         : allMyMeetings.filter(m => m.date === today).map(m => {
//                           const lead = leads.find(l => l.id === m.leadId);
//                           return (
//                             <div key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                               <div>
//                                 <div style={{ fontWeight: 600, fontSize: '12px' }}>{lead?.clientName}</div>
//                                 <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{m.timeSlot}</div>
//                               </div>
//                               <StatusBadge status={m.status} />
//                             </div>
//                           );
//                         })
//                       }
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* PENDING */}
//             {activeTab === 'pending' && (
//               <div className="fade-in">
//                 <div className="bdo-topbar">
//                   <div>
//                     <div className="bdo-page-title">Pending Meetings</div>
//                     <div className="bdo-page-sub">// {pendingMeetings.length} meetings · click row to expand</div>
//                   </div>
//                   <div className="bdo-clock">{clock}</div>
//                 </div>
//                 {pendingMeetings.length === 0 ? (
//                   <div className="bdo-card"><div className="bdo-card-body" style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontSize: '12px' }}>all caught up — no pending meetings</div></div>
//                 ) : (
//                   <div className="bdo-card">
//                     <div className="bdo-card-head">
//                       <div className="bdo-card-title">Action required ({pendingMeetings.length})</div>
//                       <div className="bdo-card-sub" style={{ marginTop: 0 }}>click row to expand · set walk-in · add remarks</div>
//                     </div>
//                     <table className="bdo-table">
//                       <thead>
//                         <tr>
//                           <th>Client</th><th>Date · Time</th><th>Phone</th><th>BDM</th>
//                           <th>Type</th><th>Status</th><th>Walk-in Date</th>
//                           <th>
//                             <button
//                               className="act-btn act-followup"
//                               style={{ fontSize: '9px', padding: '3px 8px' }}
//                               onClick={async () => {
//                                 for (const m of pendingMeetings) await handleFollowUp(m.id);
//                                 toast.success('All marked as Follow-up');
//                               }}
//                             >
//                               All → Follow-up
//                             </button>
//                           </th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {pendingMeetings.map((m: Meeting) => renderMeetingRow(m))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* FOLLOW-UP */}
//             {activeTab === 'followup' && (
//               <div className="fade-in">
//                 <div className="bdo-topbar">
//                   <div>
//                     <div className="bdo-page-title">Follow-up Meetings</div>
//                     <div className="bdo-page-sub">// {followUpMeetings.length} follow-ups · click row to expand</div>
//                   </div>
//                   <div className="bdo-clock">{clock}</div>
//                 </div>
//                 {followUpMeetings.length === 0 ? (
//                   <div className="bdo-card"><div className="bdo-card-body" style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontSize: '12px' }}>no follow-up meetings</div></div>
//                 ) : (
//                   <div className="bdo-card">
//                     <div className="bdo-card-head">
//                       <div className="bdo-card-title">Follow-up ({followUpMeetings.length})</div>
//                       <div className="bdo-card-sub" style={{ marginTop: 0 }}>click row to expand · set walk-in date · mark done or invalid</div>
//                     </div>
//                     <table className="bdo-table">
//                       <thead><tr><th>Client</th><th>Date · Time</th><th>Phone</th><th>BDM</th><th>Type</th><th>Status</th><th>Walk-in Date</th><th></th></tr></thead>
//                       <tbody>
//                         {followUpMeetings.map((m: Meeting) => renderMeetingRow(m))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* HISTORY */}
//             {activeTab === 'history' && (
//               <div className="fade-in">
//                 <div className="bdo-topbar">
//                   <div>
//                     <div className="bdo-page-title">All Meetings</div>
//                     <div className="bdo-page-sub">// {filteredMeetings.length} meetings · click row to expand</div>
//                   </div>
//                   <div className="bdo-clock">{clock}</div>
//                 </div>
//                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '10px', marginBottom: '14px' }}>
//                   {[
//                     { l: 'Total', v: stats.total, c: 'var(--warning)' },
//                     { l: 'Follow-up', v: stats.followup, c: 'var(--purple)' },
//                     { l: 'Walk-in Date Set', v: filteredMeetings.filter(m => m.walkinDate).length, c: 'var(--teal)' },
//                     { l: 'Not Done', v: stats.notDone, c: 'var(--danger)' },
//                   ].map(k => (
//                     <div key={k.l} className="kpi-card" style={{ padding: '13px' }}>
//                       <div className="kpi-label">{k.l}</div>
//                       <div className="kpi-val" style={{ color: k.c, fontSize: '26px' }}>{k.v}</div>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="bdo-card">
//                   <div className="bdo-card-head">
//                     <div className="bdo-card-title">Meeting history ({filteredMeetings.length})</div>
//                     <div className="bdo-card-sub" style={{ marginTop: 0 }}>click row to expand details</div>
//                   </div>
//                   <table className="bdo-table">
//                     <thead><tr><th>Client</th><th>Date · Time</th><th>Phone</th><th>BDM</th><th>Type</th><th>Status</th><th>Walk-in Date</th><th></th></tr></thead>
//                     <tbody>
//                       {filteredMeetings.slice().sort((a, b) => b.date.localeCompare(a.date)).map((m: Meeting) => renderMeetingRow(m))}
//                       {filteredMeetings.length === 0 && <tr><td colSpan={8} className="bdo-empty">No meetings in this period</td></tr>}
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














































import { useState, useMemo, useEffect, Fragment } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { Meeting } from '@/types/crm';
import { toast } from 'sonner';

type Tab = 'overview' | 'pending' | 'followup' | 'history';
type Theme = 'dark' | 'light';
type Period = 'daily' | 'weekly' | 'monthly' | 'custom';

const I = {
  overview: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  pending:  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  followup: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 4l-5 5-4-4L5 14"/><path d="M17 4h6v6"/></svg>,
  history:  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  sun:      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  moon:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  logout:   <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell:     <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  msg:      <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  check:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  x:        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  rupee:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="6" y1="4" x2="18" y2="4"/><line x1="6" y1="9" x2="18" y2="9"/><line x1="15" y1="14" x2="6" y2="21"/><path d="M6 9a6 6 0 000 5h3"/></svg>,
  chevron:  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>,
};

// ─── Role colour map — same palette as BDM dashboard ─────────────────────────
const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  BDM: { bg: 'rgba(61,127,255,0.15)',  color: '#3d7fff' },
  BDO: { bg: 'rgba(167,139,250,0.15)', color: '#a78bfa' },
  BO:  { bg: 'rgba(0,212,170,0.15)',   color: '#00d4aa' },
  TC:  { bg: 'rgba(245,158,11,0.15)',  color: '#f59e0b' },
  FM:  { bg: 'rgba(255,107,53,0.15)',  color: '#ff6b35' },
  RM:  { bg: 'rgba(236,72,153,0.15)',  color: '#ec4899' },
  FO:  { bg: 'rgba(99,102,241,0.15)',  color: '#6366f1' },
};

function getDateRange(period: Period, customFrom: string, customTo: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  if (period === 'daily') return { from: fmt(today), to: fmt(today) };
  if (period === 'weekly') { const mon = new Date(today); mon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); return { from: fmt(mon), to: fmt(today) }; }
  if (period === 'monthly') { const first = new Date(today.getFullYear(), today.getMonth(), 1); return { from: fmt(first), to: fmt(today) }; }
  return { from: customFrom || fmt(today), to: customTo || fmt(today) };
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    'Pending': 'var(--warning)', 'Follow-up': 'var(--purple)',
    'Walk-in Done': 'var(--teal)', 'Walking Done': 'var(--success)',
    'Invalid': 'var(--danger)', 'Meeting Done': 'var(--success)',
    'Scheduled': 'var(--accent)', 'Not Done': 'var(--danger)',
    'Reschedule Requested': 'var(--orange)',
  };
  return map[status] || 'var(--text3)';
}

function StatusBadge({ status }: { status: string }) {
  const color = statusColor(status);
  return (
    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px', fontFamily: "'JetBrains Mono', monospace", color, background: `${color}18`, border: `1px solid ${color}33` }}>
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

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '11px', padding: '20px 0' }}>no data</div>;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg viewBox="0 0 36 36" width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
          {segments.filter(d => d.value > 0).map((d, i) => {
            const pct = (d.value / total) * 100;
            const el = <circle key={i} cx="18" cy="18" r="14" fill="none" stroke={d.color} strokeWidth="5" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} />;
            offset += pct;
            return el;
          })}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace" }}>{total}</span>
          <span style={{ fontSize: '8px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>total</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
        {segments.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: d.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: 'var(--text2)', flex: 1 }}>{d.label}</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: d.color, fontFamily: "'JetBrains Mono', monospace" }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BDODashboard() {
  const { currentUser, leads, users, meetings, meetingRemarks, addMeetingRemark, updateMeeting, logout } = useCRM();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [theme, setTheme] = useState<Theme>('light');
  const [period, setPeriod] = useState<Period>('monthly');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [clock, setClock] = useState('');
  const [alerts, setAlerts] = useState<{ id: string; msg: string; type: 'warn' | 'info' }[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [walkinDateMap, setWalkinDateMap] = useState<Record<string, string>>({});
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);
  const [remarkText, setRemarkText] = useState<Record<string, string>>({});
  const [viewFormLeadId, setViewFormLeadId] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')} ${n.getHours() >= 12 ? 'PM' : 'AM'}`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const { from, to } = getDateRange(period, customFrom, customTo);
  const isDark = theme === 'dark';

  const allMyMeetings = useMemo(() => meetings.filter((m: Meeting) => m.bdoId === currentUser?.id), [meetings, currentUser]);
  const filteredMeetings = useMemo(() => allMyMeetings.filter((m: Meeting) => m.date >= from && m.date <= to), [allMyMeetings, from, to]);

  const pendingMeetings = useMemo(() =>
    allMyMeetings.filter((m: Meeting) => m.status === 'Pending' && (m.bdoStatus === undefined || m.bdoStatus === null)),
    [allMyMeetings]
  );

  const followUpMeetings = useMemo(() =>
    allMyMeetings.filter((m: Meeting) => m.bdoStatus === 'Follow-up' && m.walkingStatus !== 'Walking Done' && m.walkingStatus !== 'Invalid'),
    [allMyMeetings]
  );

  const stats = useMemo(() => ({
    total: filteredMeetings.length,
    pending: filteredMeetings.filter((m: Meeting) => m.status === 'Pending' && !m.bdoStatus).length,
    followup: filteredMeetings.filter((m: Meeting) => m.bdoStatus === 'Follow-up').length,
    walkInDone: filteredMeetings.filter((m: Meeting) => m.walkingStatus === 'Walking Done').length,
    walkInInvalid: filteredMeetings.filter((m: Meeting) => m.walkingStatus === 'Invalid').length,
    notDone: filteredMeetings.filter((m: Meeting) => m.status === 'Not Done').length,
    scheduled: filteredMeetings.filter((m: Meeting) => m.status === 'Scheduled').length,
  }), [filteredMeetings]);

  const dailyTrend = useMemo(() => {
    const days = period === 'daily' ? 7 : period === 'weekly' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      return allMyMeetings.filter((m: Meeting) => m.date === d.toISOString().split('T')[0]).length;
    });
  }, [allMyMeetings, period]);

  useEffect(() => {
    const newAlerts: { id: string; msg: string; type: 'warn' | 'info' }[] = [];
    if (pendingMeetings.length > 0)
      newAlerts.push({ id: 'pending', msg: `${pendingMeetings.length} meeting${pendingMeetings.length > 1 ? 's' : ''} pending your action`, type: 'warn' });
    if (followUpMeetings.length > 0)
      newAlerts.push({ id: 'followup', msg: `${followUpMeetings.length} follow-up meeting${followUpMeetings.length > 1 ? 's' : ''} need attention`, type: 'info' });
    const overdueWalkin = allMyMeetings.filter((m: Meeting) => m.bdoStatus === 'Follow-up' && m.walkinDate && m.walkinDate < today && m.walkingStatus !== 'Walking Done' && m.walkingStatus !== 'Invalid');
    if (overdueWalkin.length > 0)
      newAlerts.push({ id: 'overdue_walkin', msg: `${overdueWalkin.length} walk-in date(s) overdue`, type: 'warn' });
    setAlerts(newAlerts);
  }, [pendingMeetings.length, followUpMeetings.length, allMyMeetings, today]);

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  const handleFollowUp = async (meetingId: string) => {
    await updateMeeting(meetingId, { bdoStatus: 'Follow-up', bdoId: currentUser?.id });
    toast.success('Marked as Follow-up');
  };

  const handleSetWalkinDate = async (meetingId: string, date: string) => {
    if (!date) { toast.error('Select a date'); return; }
    await updateMeeting(meetingId, { walkinDate: date });
    setWalkinDateMap(prev => ({ ...prev, [meetingId]: date }));
    toast.success('Walk-in date set');
  };

  const handleWalkingDone = async (meetingId: string) => {
    // Sirf bdoStatus set karo — walkingStatus FO verify karke set karega.
    // walkingStatus yahan set karne se FO ka walkin section bypass ho jaata tha.
    await updateMeeting(meetingId, { bdoStatus: 'Walk-in Done' });
    toast.success('Sent to FO for verification ✓');
  };

  const handleWalkingInvalid = async (meetingId: string) => {
    await updateMeeting(meetingId, { walkingStatus: 'Invalid' });
    toast.success('Walk-in marked as Invalid');
  };

  const handleAddRemark = async (meetingId: string) => {
    const text = remarkText[meetingId]?.trim();
    if (!text) { toast.error('Enter a remark'); return; }
    await addMeetingRemark(meetingId, text, currentUser?.name || 'BDO');
    setRemarkText(prev => ({ ...prev, [meetingId]: '' }));
    toast.success('Remark added');
  };

  // ─── Helper: get role badge for a remark's createdBy ─────────────────────
  // meetingRemarks.createdBy stores the user's NAME (string), not ID
  // So we match by name to find the user and get their role
  const getRemarkRoleInfo = (createdBy: string) => {
    const user = users.find(u => u.name === createdBy || u.id === createdBy);
    const role = user?.role || '';
    const style = ROLE_COLORS[role] || { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' };
    return { role, style };
  };

  // ─── Expanded Panel ────────────────────────────────────────────────────────
  const renderExpandedPanel = (m: Meeting) => {
    const lead = leads.find(l => l.id === m.leadId);
    const bdm = users.find(u => u.id === m.bdmId);
    const walkinInput = walkinDateMap[m.id] ?? m.walkinDate ?? '';
    const mRemarks = meetingRemarks
      .filter(r => r.meetingId === m.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const isOverdue = walkinInput && walkinInput < today;

    return (
      <tr>
        <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid var(--border2)' }}>
          <div style={{
            background: isDark ? 'rgba(245,158,11,0.03)' : 'rgba(245,158,11,0.02)',
            borderTop: '1px solid var(--border2)',
            padding: '16px 18px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
            gap: '14px',
          }}>

            {/* Walk-in Management */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '13px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1.5px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px' }}>
                📅 WALK-IN MANAGEMENT
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace' }}>
                  {m.walkinDate ? `Current: ${m.walkinDate}` : 'No walk-in date set'}
                </div>
                <input
                  type="date"
                  value={walkinInput}
                  min={today}
                  onChange={e => setWalkinDateMap(prev => ({ ...prev, [m.id]: e.target.value }))}
                  style={{
                    background: 'var(--bg3)', border: `1px solid ${isOverdue ? 'var(--danger)' : 'var(--border2)'}`,
                    borderRadius: '6px', padding: '5px 8px', color: 'var(--text)',
                    fontSize: '11px', outline: 'none', width: '100%', boxSizing: 'border-box',
                  }}
                />
                {isOverdue && <span style={{ fontSize: '9px', color: 'var(--danger)', fontFamily: 'monospace' }}>⚠ Overdue</span>}
                <button
                  disabled={!walkinInput}
                  onClick={() => handleSetWalkinDate(m.id, walkinInput)}
                  style={{
                    padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--border2)',
                    background: walkinInput ? 'rgba(245,158,11,0.1)' : 'var(--surface2)',
                    color: walkinInput ? 'var(--warning)' : 'var(--text3)',
                    fontSize: '10px', fontWeight: 600, cursor: walkinInput ? 'pointer' : 'not-allowed',
                    fontFamily: "'JetBrains Mono',monospace",
                  }}
                >
                  {m.walkinDate ? '📅 Update Date' : '📅 Set Date'}
                </button>

                {m.walkinDate && !m.walkingStatus && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                    <button
                      onClick={() => handleWalkingDone(m.id)}
                      style={{
                        flex: 1, padding: '5px 6px', borderRadius: '6px',
                        background: 'rgba(0,212,170,0.1)', color: 'var(--success)',
                        border: '1px solid rgba(0,212,170,0.25)', fontSize: '10px',
                        fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >✓ Walk-in Done</button>
                    <button
                      onClick={() => handleWalkingInvalid(m.id)}
                      style={{
                        flex: 1, padding: '5px 6px', borderRadius: '6px',
                        background: 'rgba(255,71,87,0.1)', color: 'var(--danger)',
                        border: '1px solid rgba(255,71,87,0.25)', fontSize: '10px',
                        fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace",
                      }}
                    >✕ Denied for Walkin</button>
                  </div>
                )}

                {m.walkingStatus && (
                  <div style={{
                    padding: '5px 9px', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                    fontFamily: 'monospace',
                    background: m.walkingStatus === 'Walking Done' ? 'rgba(0,212,170,0.1)' : 'rgba(255,71,87,0.1)',
                    color: m.walkingStatus === 'Walking Done' ? 'var(--success)' : 'var(--danger)',
                    border: `1px solid ${m.walkingStatus === 'Walking Done' ? 'rgba(0,212,170,0.2)' : 'rgba(255,71,87,0.2)'}`,
                  }}>
                    {m.walkingStatus === 'Walking Done' ? '✓ Walk-in Done' : '✕ Denied for Walk-in'}
                  </div>
                )}
              </div>
            </div>

            {/* Status Info */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '13px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1.5px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px' }}>
                📊 STATUS INFO
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>Meeting</span>
                  <StatusBadge status={m.status} />
                </div>
                {m.bdoStatus && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>BDO Status</span>
                    <StatusBadge status={m.bdoStatus} />
                  </div>
                )}
                {m.walkinDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>Walk-in Date</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', fontFamily: 'monospace' }}>{m.walkinDate}</span>
                  </div>
                )}
                <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace', marginBottom: '5px' }}>LEAD INFO</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{lead?.clientName || '—'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--warning)', fontFamily: 'monospace' }}>₹{lead?.loanRequirement}</div>
                  {lead?.phoneNumber && <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace', marginTop: '2px' }}>{lead.phoneNumber}</div>}
                  <div style={{ marginTop: '5px' }}>{bdm && <span style={{ fontSize: '10px', color: 'var(--text2)' }}>BDM: {bdm.name}</span>}</div>
                </div>
              </div>
            </div>

            {/* ── Remarks — same card design, role badge added to each entry ── */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '13px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1.5px', color: 'var(--text3)', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                💬 REMARKS
                {mRemarks.length > 0 && (
                  <span style={{ background: 'var(--warning)', color: '#fff', fontSize: '9px', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>
                    {mRemarks.length}
                  </span>
                )}
              </div>

              {/* Remark list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '130px', overflowY: 'auto', marginBottom: '8px' }}>
                {mRemarks.length === 0 && (
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>No remarks yet</div>
                )}
                {mRemarks.map(r => {
                  const { role, style } = getRemarkRoleInfo(r.createdBy);
                  return (
                    <div key={r.id} style={{
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '6px 9px',
                    }}>
                      {/* Remark text — unchanged */}
                      <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '4px' }}>{r.remark}</div>

                      {/* Footer line: name + role badge + timestamp */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: 'monospace' }}>
                          {r.createdBy}
                        </span>

                        {/* Role badge — only shown if role is identified */}
                        {role && (
                          <span style={{
                            fontSize: '8px', fontWeight: 700,
                            padding: '1px 6px', borderRadius: '20px',
                            background: style.bg, color: style.color,
                            border: `1px solid ${style.color}40`,
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: '0.5px',
                          }}>
                            {role}
                          </span>
                        )}

                        <span style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: 'monospace', marginLeft: 'auto' }}>
                          {new Date(r.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add remark input — completely unchanged */}
              <div style={{ display: 'flex', gap: '5px' }}>
                <input
                  value={remarkText[m.id] || ''}
                  onChange={e => setRemarkText(prev => ({ ...prev, [m.id]: e.target.value }))}
                  placeholder="Add remark..."
                  onKeyDown={e => { if (e.key === 'Enter') handleAddRemark(m.id); }}
                  style={{
                    flex: 1, background: 'var(--bg3)', border: '1px solid var(--border2)',
                    borderRadius: '6px', padding: '5px 8px', color: 'var(--text)',
                    fontSize: '11px', outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={() => handleAddRemark(m.id)}
                  style={{
                    padding: '5px 10px', borderRadius: '6px', border: 'none',
                    background: 'var(--warning)', color: '#fff',
                    fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {I.msg}
                </button>
              </div>
            </div>

          </div>
        </td>
      </tr>
    );
  };

  // ─── Meeting Row renderer ──────────────────────────────────────────────────
  const renderMeetingRow = (m: Meeting) => {
    const lead = leads.find(l => l.id === m.leadId);
    const bdm = users.find(u => u.id === m.bdmId);
    const isExp = expandedMeeting === m.id;
    const walkinInput = walkinDateMap[m.id] ?? m.walkinDate ?? '';
    const isOverdue = walkinInput && walkinInput < today;

    return (
      <Fragment key={m.id}>
        <tr
          style={{ cursor: 'pointer', background: isExp ? (isDark ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.03)') : isOverdue ? 'rgba(255,71,87,0.04)' : undefined, transition: 'background 0.12s' }}
          onClick={() => setExpandedMeeting(isExp ? null : m.id)}
        >
          <td className="bdo-td bdo-pri">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--warning)', flexShrink: 0 }}>
                {(lead?.clientName || '?')[0]}
              </div>
              <div>
                <div>{lead?.clientName || '—'}</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: "'JetBrains Mono',monospace" }}>₹{lead?.loanRequirement}</div>
              </div>
            </div>
          </td>
          <td className="bdo-td">
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '11px' }}>{m.date}</div>
            <div style={{ fontSize: '10px', color: 'var(--warning)', fontFamily: "'JetBrains Mono',monospace" }}>{m.timeSlot}</div>
          </td>
          <td className="bdo-td" style={{ fontSize: '11px', color: 'var(--text2)' }}>{lead?.phoneNumber || '—'}</td>
          <td className="bdo-td" style={{ fontSize: '11px' }}>{bdm?.name || '—'}</td>
          <td className="bdo-td"><span style={{ fontSize: '10px', background: 'var(--surface2)', color: 'var(--text2)', padding: '2px 7px', borderRadius: '4px' }}>{m.meetingType}</span></td>
          <td className="bdo-td">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <StatusBadge status={m.status} />
              {m.bdoStatus && <StatusBadge status={m.bdoStatus} />}
            </div>
          </td>
          <td className="bdo-td" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '10px', color: isOverdue ? 'var(--danger)' : 'var(--text3)' }}>
            {m.walkinDate ? (isOverdue ? `⚠ ${m.walkinDate}` : m.walkinDate) : '—'}
          </td>
          <td className="bdo-td">
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '10px', color: 'var(--text3)', fontFamily: 'monospace',
              transition: 'transform 0.2s',
              transform: isExp ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>
              {I.chevron}
            </span>
          </td>
        </tr>
        {isExp && renderExpandedPanel(m)}
      </Fragment>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
        .bdo-root.dark{--bg:#07080f;--bg2:#0d0f1a;--bg3:#12152a;--surface:#161929;--surface2:#1c2038;--border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.1);--accent:#3d7fff;--success:#00d4aa;--warning:#f59e0b;--danger:#ff4757;--purple:#a78bfa;--orange:#ff6b35;--teal:#06b6d4;--text:#e8eaf6;--text2:#8892b0;--text3:#4a5568;}
        .bdo-root.light{--bg:#f4f5fa;--bg2:#ffffff;--bg3:#eef0f7;--surface:#ffffff;--surface2:#eef0f7;--border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.12);--accent:#2563eb;--success:#059669;--warning:#d97706;--danger:#dc2626;--purple:#7c3aed;--orange:#ea580c;--teal:#0891b2;--text:#0f172a;--text2:#475569;--text3:#94a3b8;}
        .bdo-root{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;}
        .bdo-layout{display:flex;min-height:100vh;}
        .bdo-sidebar{width:220px;flex-shrink:0;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow:hidden;}
        .bdo-sidebar::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--warning),var(--orange),transparent);}
        .bdo-brand{padding:22px 20px 16px;border-bottom:1px solid var(--border);}
        .bdo-brand-tag{font-size:9px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--warning);font-family:'JetBrains Mono',monospace;margin-bottom:6px;}
        .bdo-brand-name{font-size:17px;font-weight:800;color:var(--text);line-height:1.2;}
        .bdo-user{margin:12px 18px;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:10px;display:flex;align-items:center;gap:9px;}
        .bdo-user-ava{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,var(--warning),var(--orange));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}
        .bdo-user-name{font-size:12px;font-weight:600;color:var(--text);}
        .bdo-user-role{font-size:9px;color:var(--warning);font-family:'JetBrains Mono',monospace;letter-spacing:1px;}
        .bdo-nav-section{padding:6px 12px;margin-top:2px;}
        .bdo-nav-label{font-size:9px;font-weight:600;letter-spacing:2.5px;color:var(--text3);text-transform:uppercase;font-family:'JetBrains Mono',monospace;padding:0 8px;margin-bottom:3px;}
        .bdo-nav-item{display:flex;align-items:center;gap:9px;padding:8px 11px;border-radius:9px;cursor:pointer;transition:all 0.15s;font-size:12px;font-weight:500;color:var(--text2);position:relative;margin-bottom:1px;}
        .bdo-nav-item:hover{background:var(--surface2);color:var(--text);}
        .bdo-nav-item.active{background:var(--surface2);color:var(--warning);}
        .bdo-nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:60%;background:var(--warning);border-radius:0 3px 3px 0;}
        .bdo-nav-icon{width:16px;height:16px;opacity:0.6;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .bdo-nav-item.active .bdo-nav-icon{opacity:1;}
        .bdo-nav-badge{margin-left:auto;font-size:9px;font-weight:700;background:var(--danger);color:#fff;padding:1px 6px;border-radius:8px;font-family:'JetBrains Mono',monospace;}
        .bdo-nav-badge.info{background:var(--warning);}
        .bdo-sidebar-foot{margin-top:auto;padding:12px 18px;border-top:1px solid var(--border);}
        .bdo-status-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--success);margin-right:5px;animation:pdot 2s infinite;}
        @keyframes pdot{0%,100%{opacity:1}50%{opacity:0.3}}
        .bdo-footer-info{font-size:10px;color:var(--text3);font-family:'JetBrains Mono',monospace;margin-bottom:10px;}
        .bdo-theme-toggle{display:flex;background:var(--bg3);border:1px solid var(--border2);border-radius:18px;padding:3px;margin-bottom:8px;cursor:pointer;}
        .bdo-toggle-opt{display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:13px;font-size:10px;font-weight:600;color:var(--text3);transition:all 0.2s;font-family:'JetBrains Mono',monospace;flex:1;justify-content:center;}
        .bdo-toggle-opt.active{background:var(--surface);color:var(--text);box-shadow:0 1px 3px rgba(0,0,0,0.15);}
        .bdo-logout-btn{display:flex;align-items:center;gap:7px;width:100%;padding:8px 11px;border-radius:8px;font-size:11px;font-weight:600;color:var(--text2);cursor:pointer;background:var(--surface);border:1px solid var(--border);transition:all 0.15s;font-family:inherit;}
        .bdo-main{flex:1;overflow:auto;padding:26px 28px 60px;}
        .bdo-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
        .bdo-page-title{font-size:22px;font-weight:800;letter-spacing:-0.5px;color:var(--text);}
        .bdo-page-sub{font-size:10px;color:var(--text2);margin-top:2px;font-family:'JetBrains Mono',monospace;}
        .bdo-clock{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text2);background:var(--surface);border:1px solid var(--border);padding:6px 12px;border-radius:7px;}
        .period-row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:18px;}
        .period-btn{padding:5px 13px;border-radius:7px;border:1px solid var(--border2);cursor:pointer;font-size:11px;font-weight:600;color:var(--text2);background:var(--surface);transition:all 0.15s;font-family:'JetBrains Mono',monospace;}
        .period-btn.active{border-color:var(--warning);color:var(--warning);background:rgba(245,158,11,0.08);}
        .period-date{background:var(--surface);border:1px solid var(--border2);border-radius:7px;padding:5px 9px;color:var(--text);font-size:11px;font-family:'JetBrains Mono',monospace;outline:none;}
        .period-label{font-size:9px;color:var(--text3);font-family:'JetBrains Mono',monospace;}
        .period-range-badge{font-size:10px;color:var(--text3);background:var(--bg3);border:1px solid var(--border);padding:4px 10px;border-radius:6px;font-family:'JetBrains Mono',monospace;}
        .alert-list{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;}
        .alert-item{display:flex;align-items:center;gap:10px;padding:9px 13px;border-radius:9px;position:relative;overflow:hidden;}
        .alert-warn{background:rgba(245,158,11,0.07);border:1px solid rgba(245,158,11,0.2);}
        .alert-info{background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.18);}
        .alert-warn::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--warning);}
        .alert-info::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--teal);}
        .alert-msg{font-size:12px;color:var(--text);flex:1;}
        .alert-dismiss{font-size:10px;color:var(--text3);cursor:pointer;font-family:'JetBrains Mono',monospace;padding:2px 8px;border:1px solid var(--border2);border-radius:5px;background:transparent;}
        .alert-go{font-size:10px;cursor:pointer;font-family:'JetBrains Mono',monospace;padding:2px 8px;border-radius:5px;background:transparent;border:1px solid;}
        .alert-warn .alert-go{color:var(--warning);border-color:rgba(245,158,11,0.3);}
        .alert-info .alert-go{color:var(--teal);border-color:rgba(6,182,212,0.3);}
        .kpi-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px;}
        .kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:15px 14px;transition:transform 0.15s;}
        .kpi-card:hover{transform:translateY(-2px);}
        .kpi-label{font-size:9px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text2);font-family:'JetBrains Mono',monospace;margin-bottom:7px;}
        .kpi-val{font-size:32px;font-weight:800;line-height:1;margin-bottom:6px;}
        .kpi-spark{display:flex;justify-content:flex-end;margin-top:6px;}
        .bdo-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-bottom:14px;}
        .bdo-card-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 10px;border-bottom:1px solid var(--border);}
        .bdo-card-title{font-size:12px;font-weight:700;color:var(--text);}
        .bdo-card-sub{font-size:10px;color:var(--text2);font-family:'JetBrains Mono',monospace;margin-top:2px;}
        .bdo-card-body{padding:14px 16px;}
        .two-col{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;margin-bottom:14px;}
        .bdo-table{width:100%;border-collapse:collapse;font-size:11px;}
        .bdo-table th{padding:8px 10px;text-align:left;font-size:9px;font-weight:600;letter-spacing:1.8px;text-transform:uppercase;color:var(--text3);font-family:'JetBrains Mono',monospace;border-bottom:1px solid var(--border);}
        .bdo-td{padding:9px 10px;border-bottom:1px solid var(--border);vertical-align:middle;}
        .bdo-table tr:last-child .bdo-td{border-bottom:none;}
        .bdo-table tbody tr:hover{background:var(--surface2);}
        .bdo-pri{color:var(--text);font-weight:600;}
        .bdo-empty{text-align:center;color:var(--text3);padding:20px;font-size:10px;font-family:'JetBrains Mono',monospace;}
        .act-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all 0.15s;font-family:'JetBrains Mono',monospace;}
        .act-followup{background:rgba(167,139,250,0.1);color:var(--purple);border-color:rgba(167,139,250,0.2);}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeInUp 0.25s ease forwards;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px;}
      `}</style>

      <div className={`bdo-root ${theme}`}>
        <div className="bdo-layout">
          <aside className="bdo-sidebar">
            <div className="bdo-brand">
              <div className="bdo-brand-tag">CRM · BDO Portal</div>
              <div className="bdo-brand-name">Field<br />Operations</div>
            </div>
            <div className="bdo-user">
              <div className="bdo-user-ava">{currentUser?.name?.[0] ?? 'B'}</div>
              <div>
                <div className="bdo-user-name">{currentUser?.name || 'BDO'}</div>
                <div className="bdo-user-role">BUS. DEV. OFFICER</div>
              </div>
            </div>
            <div className="bdo-nav-section">
              <div className="bdo-nav-label">Dashboard</div>
              {([
                { id: 'overview', label: 'Overview', icon: I.overview },
                { id: 'pending', label: 'Pending', icon: I.pending, badge: pendingMeetings.length > 0 ? pendingMeetings.length : null },
                { id: 'followup', label: 'Follow-up', icon: I.followup, badge: followUpMeetings.length > 0 ? followUpMeetings.length : null, badgeCls: 'info' },
                { id: 'history', label: 'All Meetings', icon: I.history },
              ] as any[]).map(item => (
                <div key={item.id} className={`bdo-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => { setActiveTab(item.id as Tab); setExpandedMeeting(null); }}>
                  <div className="bdo-nav-icon">{item.icon}</div>
                  {item.label}
                  {item.badge ? <span className={`bdo-nav-badge ${item.badgeCls || ''}`}>{item.badge}</span> : null}
                </div>
              ))}
            </div>
            <div className="bdo-sidebar-foot">
              <div className="bdo-footer-info">
                <span className="bdo-status-dot" />Active · {todayStr}<br />
                <span style={{ color: 'var(--text3)', marginTop: '2px', display: 'block' }}>{pendingMeetings.length} pending · {allMyMeetings.length} total</span>
              </div>
              <div className="bdo-theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                <div className={`bdo-toggle-opt ${isDark ? 'active' : ''}`}>{I.moon} Dark</div>
                <div className={`bdo-toggle-opt ${!isDark ? 'active' : ''}`}>{I.sun} Light</div>
              </div>
              <button className="bdo-logout-btn" onClick={logout}>{I.logout} Sign Out</button>
            </div>
          </aside>

          <main className="bdo-main">
            <div className="period-row">
              {(['daily', 'weekly', 'monthly', 'custom'] as Period[]).map(p => (
                <button key={p} className={`period-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
              {period === 'custom' && (
                <>
                  <span className="period-label">FROM</span>
                  <input type="date" className="period-date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                  <span className="period-label">TO</span>
                  <input type="date" className="period-date" value={customTo} onChange={e => setCustomTo(e.target.value)} />
                </>
              )}
              <span className="period-range-badge">{from} → {to}</span>
            </div>

            {visibleAlerts.length > 0 && (
              <div className="alert-list">
                {visibleAlerts.map(alert => (
                  <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                    <span style={{ fontSize: '14px' }}>{alert.type === 'warn' ? '⚠' : 'ℹ'}</span>
                    <span className="alert-msg">{alert.msg}</span>
                    <button className="alert-go" onClick={() => setActiveTab(alert.id === 'pending' ? 'pending' : 'followup')}>View →</button>
                    <button className="alert-dismiss" onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <div className="bdo-topbar">
                  <div>
                    <div className="bdo-page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {currentUser?.name?.split(' ')[0] || 'BDO'}</div>
                    <div className="bdo-page-sub">// {period} view · {from} → {to}</div>
                  </div>
                  <div className="bdo-clock">{clock}</div>
                </div>
                <div className="kpi-row">
                  {[
                    { label: 'Total Meetings', val: stats.total, color: 'var(--warning)' },
                    { label: 'Pending Action', val: stats.pending, color: 'var(--danger)' },
                    { label: 'Follow-up', val: followUpMeetings.length, color: 'var(--purple)' },
                    { label: 'Walk-in Done', val: stats.walkInDone, color: 'var(--teal)' },
                  ].map((k) => (
                    <div key={k.label} className="kpi-card">
                      <div className="kpi-label">{k.label}</div>
                      <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
                      <div className="kpi-spark"><Sparkline data={dailyTrend} color={k.color} /></div>
                    </div>
                  ))}
                </div>
                <div className="two-col">
                  <div className="bdo-card">
                    <div className="bdo-card-head">
                      <div>
                        <div className="bdo-card-title">Meeting status breakdown</div>
                        <div className="bdo-card-sub">// {period} · {stats.total} meetings</div>
                      </div>
                    </div>
                    <div className="bdo-card-body">
                      <DonutChart segments={[
                        { label: 'Pending Action', value: stats.pending, color: 'var(--danger)' },
                        { label: 'Follow-up', value: stats.followup, color: 'var(--purple)' },
                        { label: 'Walk-in Date Set', value: allMyMeetings.filter(m => m.walkinDate).length, color: 'var(--teal)' },
                        { label: 'Not Done', value: stats.notDone, color: '#ff4757' },
                        { label: 'Scheduled', value: stats.scheduled, color: 'var(--accent)' },
                      ]} />
                    </div>
                  </div>
                  <div className="bdo-card">
                    <div className="bdo-card-head">
                      <div>
                        <div className="bdo-card-title">Today's meetings</div>
                        <div className="bdo-card-sub">// {todayStr}</div>
                      </div>
                    </div>
                    <div className="bdo-card-body">
                      {allMyMeetings.filter(m => m.date === today).length === 0
                        ? <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '11px', padding: '16px 0' }}>No meetings today</div>
                        : allMyMeetings.filter(m => m.date === today).map(m => {
                          const lead = leads.find(l => l.id === m.leadId);
                          return (
                            <div key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '12px' }}>{lead?.clientName}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{m.timeSlot}</div>
                              </div>
                              <StatusBadge status={m.status} />
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PENDING */}
            {activeTab === 'pending' && (
              <div className="fade-in">
                <div className="bdo-topbar">
                  <div>
                    <div className="bdo-page-title">Pending Meetings</div>
                    <div className="bdo-page-sub">// {pendingMeetings.length} meetings · click row to expand</div>
                  </div>
                  <div className="bdo-clock">{clock}</div>
                </div>
                {pendingMeetings.length === 0 ? (
                  <div className="bdo-card"><div className="bdo-card-body" style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontSize: '12px' }}>all caught up — no pending meetings</div></div>
                ) : (
                  <div className="bdo-card">
                    <div className="bdo-card-head">
                      <div className="bdo-card-title">Action required ({pendingMeetings.length})</div>
                      <div className="bdo-card-sub" style={{ marginTop: 0 }}>click row to expand · set walk-in · add remarks</div>
                    </div>
                    <table className="bdo-table">
                      <thead>
                        <tr>
                          <th>Client</th><th>Date · Time</th><th>Phone</th><th>BDM</th>
                          <th>Type</th><th>Status</th><th>Walk-in Date</th>
                          <th>
                            <button
                              className="act-btn act-followup"
                              style={{ fontSize: '9px', padding: '3px 8px' }}
                              onClick={async () => {
                                for (const m of pendingMeetings) await handleFollowUp(m.id);
                                toast.success('All marked as Follow-up');
                              }}
                            >
                              All → Follow-up
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingMeetings.map((m: Meeting) => renderMeetingRow(m))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* FOLLOW-UP */}
            {activeTab === 'followup' && (
              <div className="fade-in">
                <div className="bdo-topbar">
                  <div>
                    <div className="bdo-page-title">Follow-up Meetings</div>
                    <div className="bdo-page-sub">// {followUpMeetings.length} follow-ups · click row to expand</div>
                  </div>
                  <div className="bdo-clock">{clock}</div>
                </div>
                {followUpMeetings.length === 0 ? (
                  <div className="bdo-card"><div className="bdo-card-body" style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontSize: '12px' }}>no follow-up meetings</div></div>
                ) : (
                  <div className="bdo-card">
                    <div className="bdo-card-head">
                      <div className="bdo-card-title">Follow-up ({followUpMeetings.length})</div>
                      <div className="bdo-card-sub" style={{ marginTop: 0 }}>click row to expand · set walk-in date · mark done or invalid</div>
                    </div>
                    <table className="bdo-table">
                      <thead><tr><th>Client</th><th>Date · Time</th><th>Phone</th><th>BDM</th><th>Type</th><th>Status</th><th>Walk-in Date</th><th></th></tr></thead>
                      <tbody>
                        {followUpMeetings.map((m: Meeting) => renderMeetingRow(m))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* HISTORY */}
            {activeTab === 'history' && (
              <div className="fade-in">
                <div className="bdo-topbar">
                  <div>
                    <div className="bdo-page-title">All Meetings</div>
                    <div className="bdo-page-sub">// {filteredMeetings.length} meetings · click row to expand</div>
                  </div>
                  <div className="bdo-clock">{clock}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { l: 'Total', v: stats.total, c: 'var(--warning)' },
                    { l: 'Follow-up', v: stats.followup, c: 'var(--purple)' },
                    { l: 'Walk-in Date Set', v: filteredMeetings.filter(m => m.walkinDate).length, c: 'var(--teal)' },
                    { l: 'Not Done', v: stats.notDone, c: 'var(--danger)' },
                  ].map(k => (
                    <div key={k.l} className="kpi-card" style={{ padding: '13px' }}>
                      <div className="kpi-label">{k.l}</div>
                      <div className="kpi-val" style={{ color: k.c, fontSize: '26px' }}>{k.v}</div>
                    </div>
                  ))}
                </div>
                <div className="bdo-card">
                  <div className="bdo-card-head">
                    <div className="bdo-card-title">Meeting history ({filteredMeetings.length})</div>
                    <div className="bdo-card-sub" style={{ marginTop: 0 }}>click row to expand details</div>
                  </div>
                  <table className="bdo-table">
                    <thead><tr><th>Client</th><th>Date · Time</th><th>Phone</th><th>BDM</th><th>Type</th><th>Status</th><th>Walk-in Date</th><th></th></tr></thead>
                    <tbody>
                      {filteredMeetings.slice().sort((a, b) => b.date.localeCompare(a.date)).map((m: Meeting) => renderMeetingRow(m))}
                      {filteredMeetings.length === 0 && <tr><td colSpan={8} className="bdo-empty">No meetings in this period</td></tr>}
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