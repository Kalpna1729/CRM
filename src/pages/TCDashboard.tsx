// import { useState, useMemo, useEffect } from 'react';
// import { useCRM } from '@/contexts/CRMContext';
// import { ProductType } from '@/types/crm';
// import { TIME_SLOTS } from '@/data/mockData';
// import { toast } from 'sonner';

// // ─── Types ────────────────────────────────────────────────────────────────────
// type ScheduleForm = {
//   bdm: string; slot: string; meetingType: 'Virtual' | 'Walk-in';
//   clientName: string; location: string; state: string;
//   productType: ProductType; finalReq: string; collateral: string;
// };
// const defaultForm = (): ScheduleForm => ({
//   bdm: '', slot: '', meetingType: 'Virtual',
//   clientName: '', location: '', state: '',
//   productType: '', finalReq: '', collateral: '',
// });

// type Tab = 'overview' | 'team' | 'requests' | 'schedule' | 'history';
// type Theme = 'dark' | 'light';

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// function statusBadge(status: string) {
//   const map: Record<string, string> = {
//     'Converted': 'badge-converted',
//     'Meeting Done': 'badge-done',
//     'Follow-Up': 'badge-followup',
//     'Not Done': 'badge-notdone',
//     'Pending': 'badge-pending',
//     'Scheduled': 'badge-scheduled',
//     'Approved': 'badge-approved',
//     'Rejected': 'badge-rejected',
//     'Interested': 'badge-interested',
//     'Not Interested': 'badge-notint',
//     'Eligible': 'badge-eligible',
//     'Not Eligible': 'badge-notdone',
//     'Connected': 'badge-connected',
//     'Not Connected': 'badge-notconn',
//     'Mobile Off': 'badge-mobileoff',
//     'Incoming Barred': 'badge-mobileoff',
//     'Reschedule Requested': 'badge-reschedule',
//   };
//   return (
//     <span className={`badge ${map[status] || 'badge-pending'}`}>{status}</span>
//   );
// }

// function healthColor(score: number, theme: Theme) {
//   if (score >= 70) return '#00d4aa';
//   if (score >= 50) return '#f59e0b';
//   return '#ff4757';
// }

// function HealthRing({ score, theme }: { score: number; theme: Theme }) {
//   const r = 28, circ = 2 * Math.PI * r;
//   const dash = (score / 100) * circ;
//   const color = healthColor(score, theme);
//   const trackColor = theme === 'dark' ? '#1c2038' : '#e5e7eb';
//   return (
//     <svg width="72" height="72" viewBox="0 0 80 80">
//       <circle cx="40" cy="40" r={r} fill="none" stroke={trackColor} strokeWidth="6" />
//       <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
//         strokeDasharray={`${dash} ${circ - dash}`}
//         strokeLinecap="round"
//         style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
//       />
//       <text x="40" y="45" textAnchor="middle" fontSize="15" fontWeight="700"
//         fill={color} fontFamily="'Inter', sans-serif">{score}</text>
//     </svg>
//   );
// }

// function FunnelRow({ label, val, total, color }: { label: string; val: number; total: number; color: string }) {
//   const pct = total ? Math.round((val / total) * 100) : 0;
//   return (
//     <div className="funnel-row">
//       <span className="funnel-label">{label}</span>
//       <div className="funnel-bar-bg">
//         <div className="funnel-bar-fill" style={{ width: `${pct}%`, background: color }} />
//       </div>
//       <span className="funnel-count" style={{ color }}>{val}</span>
//     </div>
//   );
// }

// // ─── Nav Icons (inline SVG) ────────────────────────────────────────────────────
// const Icons = {
//   dashboard: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
//   team: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" /></svg>,
//   requests: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>,
//   calendar: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
//   clock: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>,
//   bell: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>,
//   check: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>,
//   x: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
//   refresh: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>,
//   logout: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
//   sun: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
//   moon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>,
// };

// // ─── Main Component ────────────────────────────────────────────────────────────
// export default function TCDashboard() {
//   const {
//     currentUser, users, leads, teams, meetings,
//     meetingRequests, updateLead, addMeeting,
//     updateMeetingRequest, updateMeeting, logout,
//   } = useCRM();

//   const [activeTab, setActiveTab] = useState<Tab>('overview');
//   const [theme, setTheme] = useState<Theme>('dark');
//   const [fromDate, setFromDate] = useState<string>('');
//   const [toDate, setToDate] = useState<string>('');
//   const [forms, setForms] = useState<Record<string, ScheduleForm>>({});
//   const [selectedBOId, setSelectedBOId] = useState<string | null>(null);
//   const [clock, setClock] = useState('');

//   // Live clock
//   useEffect(() => {
//     const tick = () => {
//       const n = new Date();
//       const h = n.getHours().toString().padStart(2, '0');
//       const m = n.getMinutes().toString().padStart(2, '0');
//       const s = n.getSeconds().toString().padStart(2, '0');
//       setClock(`${h}:${m}:${s} ${n.getHours() >= 12 ? 'PM' : 'AM'}`);
//     };
//     tick();
//     const id = setInterval(tick, 1000);
//     return () => clearInterval(id);
//   }, []);

//   // Form helpers
//   const getForm = (id: string) => forms[id] ?? defaultForm();
//   const setFormField = (id: string, field: keyof ScheduleForm, value: string) =>
//     setForms(prev => ({ ...prev, [id]: { ...(prev[id] ?? defaultForm()), [field]: value } }));
//   const resetForm = (id: string) =>
//     setForms(prev => { const n = { ...prev }; delete n[id]; return n; });

//   // Data
//   const myTeam = teams.find(t => t.tcId === currentUser?.id);
//   const myBOs = myTeam?.boIds || [];
//   const bdms = users.filter(u => u.role === 'BDM' && u.active);
//   const today = new Date().toISOString().split('T')[0];
//   const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
//   const todayMeetings = meetings.filter(m => m.date === today);

//   const teamMeetings = useMemo(() => {
//     let f = meetings.filter(m => m.tcId === currentUser?.id);
//     if (fromDate) f = f.filter(m => m.date >= fromDate);
//     if (toDate) f = f.filter(m => m.date <= toDate);
//     return f;
//   }, [meetings, currentUser, fromDate, toDate]);

//   const allTeamLeads = leads.filter(l => myBOs.includes(l.assignedBOId));
//   const pendingRequests = meetingRequests.filter(mr => mr.tcId === currentUser?.id && mr.status === 'Pending');
//   const rescheduleRequests = meetings.filter(m => m.tcId === currentUser?.id && m.status === 'Reschedule Requested');
//   const approvedPending = meetingRequests.filter(
//     mr => mr.tcId === currentUser?.id && mr.status === 'Approved' && !leads.find(l => l.id === mr.leadId)?.meetingId
//   );

//   // KPI stats
//   const totalMeetings = teamMeetings.length;
//   const pendingCount = teamMeetings.filter(m => m.status === 'Pending' || m.status === 'Scheduled').length;
//   const rejectedCount = teamMeetings.filter(m => m.status === 'Reject' || m.status === 'Not Done').length;
//   const convertedCount = teamMeetings.filter(m => m.status === 'Converted').length;

//   const meetingsByDate = useMemo(() => {
//     const map: Record<string, number> = {};
//     teamMeetings.forEach(m => { map[m.date] = (map[m.date] || 0) + 1; });
//     return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-30);
//   }, [teamMeetings]);

//   const stateMap = useMemo(() => {
//     const map: Record<string, { total: number; pending: number; rejected: number; products: Record<string, number> }> = {};
//     teamMeetings.forEach(m => {
//       const s = m.state || 'Unknown';
//       if (!map[s]) map[s] = { total: 0, pending: 0, rejected: 0, products: {} };
//       map[s].total++;
//       if (m.status === 'Pending' || m.status === 'Scheduled') map[s].pending++;
//       if (m.status === 'Reject' || m.status === 'Not Done') map[s].rejected++;
//       if (m.productType) map[s].products[m.productType] = (map[s].products[m.productType] || 0) + 1;
//     });
//     return Object.entries(map).sort(([, a], [, b]) => b.total - a.total).slice(0, 8).map(([state, data]) => ({
//       state, ...data,
//       topProduct: Object.entries(data.products).sort(([, a], [, b]) => b - a)[0]?.[0] || '—',
//     }));
//   }, [teamMeetings]);

//   // Actions
//   const approveRequest = async (requestId: string) => {
//     await updateMeetingRequest(requestId, { status: 'Approved' });
//     const req = meetingRequests.find(mr => mr.id === requestId);
//     if (req) await updateLead(req.leadId, { meetingApproved: true });
//     toast.success('Meeting request approved');
//   };
//   const rejectRequest = async (requestId: string) => {
//     await updateMeetingRequest(requestId, { status: 'Rejected' });
//     const req = meetingRequests.find(mr => mr.id === requestId);
//     if (req) await updateLead(req.leadId, { meetingRequested: false, meetingRejected: true });
//     toast.success('Meeting request rejected');
//   };
//   const scheduleMeeting = async (reqId: string, leadId: string, boId: string) => {
//     const f = getForm(reqId);
//     if (!f.bdm || !f.slot) { toast.error('Select BDM and time slot'); return; }
//     await addMeeting({
//       id: `m${Date.now()}`, leadId, bdmId: f.bdm, tcId: currentUser!.id, boId,
//       date: today, timeSlot: f.slot, status: 'Scheduled', meetingType: f.meetingType,
//       clientName: f.clientName || undefined, location: f.location || undefined,
//       state: f.state || undefined, productType: f.productType || undefined,
//       finalRequirement: f.finalReq || undefined, collateralValue: f.collateral || undefined,
//     });
//     await updateLead(leadId, { meetingId: `m${Date.now()}` });
//     resetForm(reqId);
//     toast.success('Meeting scheduled');
//   };
//   const rescheduleExistingMeeting = async (meetingId: string) => {
//     const f = getForm(meetingId);
//     if (!f.bdm || !f.slot) { toast.error('Select BDM and time slot'); return; }
//     await updateMeeting(meetingId, {
//       status: 'Scheduled', bdmId: f.bdm, date: today, timeSlot: f.slot,
//       meetingType: f.meetingType, clientName: f.clientName || undefined,
//       location: f.location || undefined, state: f.state || undefined,
//       productType: f.productType || undefined,
//       finalRequirement: f.finalReq || undefined,
//       collateralValue: f.collateral || undefined,
//     });
//     resetForm(meetingId);
//     toast.success('Meeting rescheduled successfully');
//   };

//   const getAvailableSlots = (bdmId: string, excludeId?: string) => {
//     const booked = todayMeetings.filter(m => m.bdmId === bdmId && m.id !== excludeId).map(m => m.timeSlot);
//     return TIME_SLOTS.filter(s => !booked.includes(s));
//   };

//   // ─── Schedule Form ─────────────────────────────────────────────────────────
//   const renderScheduleForm = (id: string, onSubmit: () => void, label: string, isReschedule = false, excludeId?: string) => {
//     const f = getForm(id);
//     const slots = f.bdm ? getAvailableSlots(f.bdm, excludeId) : [];
//     return (
//       <div className="sched-form">
//         <div className="sched-grid">
//           <div className="sched-field">
//             <div className="field-label">SELECT BDM</div>
//             <select className="cc-select" value={f.bdm} onChange={e => { setFormField(id, 'bdm', e.target.value); setFormField(id, 'slot', ''); }}>
//               <option value="">Choose BDM</option>
//               {bdms.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
//             </select>
//           </div>
//           <div className="sched-field">
//             <div className="field-label">TIME SLOT</div>
//             <select className="cc-select" value={f.slot} onChange={e => setFormField(id, 'slot', e.target.value)}>
//               <option value="">Choose slot</option>
//               {slots.map(s => <option key={s} value={s}>{s}</option>)}
//               {slots.length === 0 && f.bdm && <option disabled>No slots available</option>}
//             </select>
//           </div>
//           <div className="sched-field">
//             <div className="field-label">MEETING TYPE</div>
//             <select className="cc-select" value={f.meetingType} onChange={e => setFormField(id, 'meetingType', e.target.value)}>
//               <option value="Virtual">Virtual</option>
//               <option value="Walk-in">Walk-in</option>
//             </select>
//           </div>
//           <div className="sched-field">
//             <div className="field-label">CLIENT NAME</div>
//             <input className="cc-input" placeholder="Enter client name" value={f.clientName} onChange={e => setFormField(id, 'clientName', e.target.value)} />
//           </div>
//           <div className="sched-field">
//             <div className="field-label">LOCATION</div>
//             <input className="cc-input" placeholder="Enter location" value={f.location} onChange={e => setFormField(id, 'location', e.target.value)} />
//           </div>
//           <div className="sched-field">
//             <div className="field-label">STATE</div>
//             <input className="cc-input" placeholder="Enter state" value={f.state} onChange={e => setFormField(id, 'state', e.target.value)} />
//           </div>
//           <div className="sched-field">
//             <div className="field-label">PRODUCT TYPE</div>
//             <select className="cc-select" value={f.productType} onChange={e => setFormField(id, 'productType', e.target.value)}>
//               <option value="">Select product</option>
//               {['Term Loan', 'Equity', 'Term+Equity', 'Unsecure', 'Project Funding'].map(p => (
//                 <option key={p} value={p}>{p}</option>
//               ))}
//             </select>
//           </div>
//           <div className="sched-field">
//             <div className="field-label">FINAL REQ. (₹)</div>
//             <input className="cc-input" placeholder="e.g. 10-15 Lakhs" value={f.finalReq} onChange={e => setFormField(id, 'finalReq', e.target.value)} />
//           </div>
//           <div className="sched-field">
//             <div className="field-label">COLLATERAL (₹)</div>
//             <input className="cc-input" placeholder="e.g. 1-2 Cr" value={f.collateral} onChange={e => setFormField(id, 'collateral', e.target.value)} />
//           </div>
//         </div>
//         <button className={`cc-btn ${isReschedule ? 'cc-btn-orange' : 'cc-btn-blue'}`} onClick={onSubmit}>
//           {isReschedule ? Icons.refresh : Icons.calendar}
//           {label}
//         </button>
//       </div>
//     );
//   };

//   // ─── BO Detail Panel ────────────────────────────────────────────────────────
//   const renderBODetail = (boId: string) => {
//     const bo = users.find(u => u.id === boId);
//     const boLeads = leads.filter(l => l.assignedBOId === boId);
//     const boMeetings = meetings.filter(m => m.boId === boId);
//     const connected = boLeads.filter(l => l.numberStatus === 'Connected').length;
//     const notConnected = boLeads.filter(l => l.numberStatus === 'Not Connected').length;
//     const mobileOff = boLeads.filter(l => l.numberStatus === 'Mobile Off').length;
//     const incomingBarred = boLeads.filter(l => l.numberStatus === 'Incoming Barred').length;
//     const interested = boLeads.filter(l => l.leadStatus === 'Interested').length;
//     const eligible = boLeads.filter(l => l.leadStatus === 'Eligible').length;
//     const notInterested = boLeads.filter(l => l.leadStatus === 'Not Interested').length;
//     const converted = boMeetings.filter(m => m.status === 'Converted').length;
//     const done = boMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length;
//     const notDone = boMeetings.filter(m => m.status === 'Not Done').length;
//     const followUp = boMeetings.filter(m => m.status === 'Follow-Up').length;
//     const pendingReqs = meetingRequests.filter(mr => mr.boId === boId && mr.status === 'Pending').length;
//     const total = boLeads.length || 1;
//     const connectRate = Math.round((connected / total) * 100);
//     const convRate = boMeetings.length ? Math.round((converted / boMeetings.length) * 100) : 0;
//     const healthScore = Math.min(100, Math.round(((connected / total) * 40) + ((interested / total) * 30) + (convRate * 0.3)));

//     return (
//       <div>
//         <div className="bo-header">
//           <div className="bo-avatar">{bo?.name?.[0] ?? '?'}</div>
//           <div className="bo-info">
//             <div className="bo-name">{bo?.name}</div>
//             <div className="bo-role">{bo?.username || 'N/A'}</div>
//           </div>
//           <HealthRing score={healthScore} theme={theme} />
//           <div className="health-label">HEALTH<br />SCORE</div>
//         </div>

//         <div className="bo-kpis">
//           {[
//             { val: boLeads.length, label: 'Total Leads', color: '#3d7fff' },
//             { val: connected, label: `Connected (${connectRate}%)`, color: '#00d4aa' },
//             { val: boMeetings.length, label: 'Meetings', color: 'var(--text)' },
//             { val: converted, label: `Converted (${convRate}%)`, color: '#00d4aa' },
//           ].map(k => (
//             <div key={k.label} className="bo-kpi">
//               <div className="bo-kpi-val" style={{ color: k.color }}>{k.val}</div>
//               <div className="bo-kpi-label">{k.label}</div>
//             </div>
//           ))}
//         </div>

//         <div className="bo-two-col">
//           <div className="bo-panel">
//             <div className="panel-section-label">LEAD PIPELINE</div>
//             <FunnelRow label="Total" val={boLeads.length} total={boLeads.length} color="#3d7fff" />
//             <FunnelRow label="Connected" val={connected} total={boLeads.length} color="#00d4aa" />
//             <FunnelRow label="Interested" val={interested} total={boLeads.length} color="#a78bfa" />
//             {/* <FunnelRow label="Eligible" val={eligible} total={boLeads.length} color="#3d7fff" /> */}
//             <FunnelRow label="Meetings" val={boMeetings.length} total={boLeads.length} color="#f59e0b" />
//             <FunnelRow label="Converted" val={converted} total={boLeads.length} color="#00d4aa" />
//           </div>

//           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
//             <div className="bo-panel">
//               <div className="panel-section-label">CALL OUTCOMES</div>
//               <FunnelRow label="Not conn." val={notConnected} total={boLeads.length} color="#ff4757" />
//               <FunnelRow label="Mobile off" val={mobileOff} total={boLeads.length} color="#f59e0b" />
//               <FunnelRow label="Inc. barred" val={incomingBarred} total={boLeads.length} color="#f59e0b" />
//             </div>
//             <div className="bo-panel">
//               <div className="panel-section-label">MEETING RESULTS</div>
//               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
//                 {[
//                   { v: done, l: 'DONE', c: '#00d4aa' },
//                   { v: notDone, l: 'NOT DONE', c: '#ff4757' },
//                   { v: followUp, l: 'FOLLOW-UP', c: '#a78bfa' },
//                   { v: pendingReqs, l: 'PENDING REQ', c: pendingReqs > 0 ? '#f59e0b' : 'var(--text3)' },
//                 ].map(item => (
//                   <div key={item.l}>
//                     <div style={{ fontSize: '18px', fontWeight: 700, color: item.c }}>{item.v}</div>
//                     <div style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px' }}>{item.l}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bo-table-wrap" style={{ marginBottom: '12px' }}>
//           <div className="bo-table-header">RECENT MEETINGS</div>
//           <table className="data-table">
//             <thead><tr><th>Client</th><th>Date</th><th>Product</th><th>Amount</th><th>Status</th></tr></thead>
//             <tbody>
//               {boMeetings.slice(-5).reverse().map(m => {
//                 const lead = leads.find(l => l.id === m.leadId);
//                 return (
//                   <tr key={m.id}>
//                     <td className="primary">{m.clientName || lead?.clientName}</td>
//                     <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{m.date}</td>
//                     <td><span className="product-chip">{m.productType || '—'}</span></td>
//                     <td style={{ color: '#3d7fff', fontWeight: 600 }}>₹{lead?.loanRequirement || '—'}</td>
//                     <td>{statusBadge(m.status)}</td>
//                   </tr>
//                 );
//               })}
//               {boMeetings.length === 0 && <tr><td colSpan={5} className="empty-row">no meetings yet</td></tr>}
//             </tbody>
//           </table>
//         </div>

//         <div className="bo-table-wrap">
//           <div className="bo-table-header">LEADS ASSIGNED</div>
//           <table className="data-table">
//             <thead><tr><th>Client</th><th>Phone</th><th>Number Status</th><th>Lead Status</th><th>Loan Req.</th></tr></thead>
//             <tbody>
//               {boLeads.slice(0, 8).map(l => (
//                 <tr key={l.id}>
//                   <td className="primary">{l.clientName}</td>
//                   <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{l.phoneNumber}</td>
//                   <td>{statusBadge(l.numberStatus)}</td>
//                   <td>{statusBadge(l.leadStatus)}</td>
//                   <td style={{ color: '#3d7fff', fontWeight: 600 }}>₹{l.loanRequirement}</td>
//                 </tr>
//               ))}
//               {boLeads.length === 0 && <tr><td colSpan={5} className="empty-row">no leads assigned</td></tr>}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     );
//   };

//   const isDark = theme === 'dark';

//   // ─── RENDER ─────────────────────────────────────────────────────────────────
//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

//         /* ── THEME VARIABLES ── */
//         .cc-root.dark {
//           --bg: #07080f;
//           --bg2: #0d0f1a;
//           --bg3: #12152a;
//           --surface: #161929;
//           --surface2: #1c2038;
//           --border: rgba(255,255,255,0.06);
//           --border2: rgba(255,255,255,0.1);
//           --accent: #3d7fff;
//           --success: #00d4aa;
//           --warning: #f59e0b;
//           --danger: #ff4757;
//           --purple: #a78bfa;
//           --orange: #ff6b35;
//           --text: #e8eaf6;
//           --text2: #8892b0;
//           --text3: #4a5568;
//           --toggle-bg: #1c2038;
//           --toggle-border: rgba(255,255,255,0.1);
//         }

//         .cc-root.light {
//           --bg: #f8f9fc;
//           --bg2: #ffffff;
//           --bg3: #f1f3f8;
//           --surface: #ffffff;
//           --surface2: #eef0f7;
//           --border: rgba(0,0,0,0.08);
//           --border2: rgba(0,0,0,0.13);
//           --accent: #2563eb;
//           --success: #059669;
//           --warning: #d97706;
//           --danger: #dc2626;
//           --purple: #7c3aed;
//           --orange: #ea580c;
//           --text: #111827;
//           --text2: #4b5563;
//           --text3: #9ca3af;
//           --toggle-bg: #e5e7eb;
//           --toggle-border: rgba(0,0,0,0.1);
//         }

//         .cc-root {
//           font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
//           background: var(--bg);
//           color: var(--text);
//           min-height: 100vh;
//           position: relative;
//           transition: background 0.25s, color 0.25s;
//         }
//         .cc-root::before {
//           content: '';
//           position: fixed; top: -50%; left: -50%;
//           width: 200%; height: 200%;
//           background:
//             radial-gradient(ellipse 600px 400px at 20% 30%, rgba(61,127,255,0.04), transparent),
//             radial-gradient(ellipse 500px 500px at 80% 70%, rgba(0,212,170,0.03), transparent);
//           pointer-events: none; z-index: 0;
//         }

//         /* LAYOUT */
//         .cc-layout { display: flex; min-height: 100vh; position: relative; z-index: 1; }

//         /* SIDEBAR */
//         .cc-sidebar {
//           width: 240px; flex-shrink: 0;
//           background: var(--bg2);
//           border-right: 1px solid var(--border);
//           display: flex; flex-direction: column;
//           position: sticky; top: 0; height: 100vh;
//           overflow: hidden;
//           transition: background 0.25s, border-color 0.25s;
//         }
//         .cc-sidebar::before {
//           content: ''; position: absolute;
//           top: 0; left: 0; right: 0; height: 1px;
//           background: linear-gradient(90deg, transparent, var(--accent), transparent);
//         }
//         .cc-logo-area { padding: 28px 24px 20px; border-bottom: 1px solid var(--border); }
//         .cc-logo-tag { font-size: 9px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); font-family: 'JetBrains Mono', monospace; margin-bottom: 8px; }
//         .cc-logo-name { font-size: 20px; font-weight: 800; color: var(--text); line-height: 1.2; }
//         .cc-user-chip { margin: 16px 24px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; }
//         .cc-user-avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--accent), var(--purple)); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
//         .cc-user-name { font-size: 13px; font-weight: 600; color: var(--text); }
//         .cc-user-role { font-size: 10px; color: var(--accent); font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
//         .cc-nav-section { padding: 8px 16px; margin-top: 4px; }
//         .cc-nav-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; color: var(--text3); text-transform: uppercase; font-family: 'JetBrains Mono', monospace; padding: 0 8px; margin-bottom: 6px; }
//         .cc-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; font-size: 13px; font-weight: 500; color: var(--text2); position: relative; margin-bottom: 2px; }
//         .cc-nav-item:hover { background: var(--surface2); color: var(--text); }
//         .cc-nav-item.active { background: var(--surface2); color: var(--accent); }
//         .cc-nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 60%; background: var(--accent); border-radius: 0 3px 3px 0; }
//         .cc-nav-icon { width: 16px; height: 16px; opacity: 0.7; display: flex; align-items: center; justify-content: center; }
//         .cc-nav-item.active .cc-nav-icon { opacity: 1; }
//         .cc-nav-badge { margin-left: auto; font-size: 10px; font-weight: 700; background: var(--danger); color: #fff; padding: 1px 7px; border-radius: 10px; font-family: 'JetBrains Mono', monospace; }
//         .cc-nav-badge.info { background: var(--accent); }
//         .cc-sidebar-footer { margin-top: auto; padding: 16px 24px; border-top: 1px solid var(--border); font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
//         .cc-status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); margin-right: 6px; animation: pulse-dot 2s infinite; }
//         @keyframes pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }

//         /* THEME TOGGLE */
//         .theme-toggle {
//           display: flex; align-items: center; gap: 8px;
//           background: var(--toggle-bg);
//           border: 1px solid var(--toggle-border);
//           border-radius: 20px;
//           padding: 4px;
//           margin-bottom: 12px;
//           cursor: pointer;
//         }
//         .toggle-option {
//           display: flex; align-items: center; gap: 5px;
//           padding: 5px 10px; border-radius: 14px;
//           font-size: 11px; font-weight: 600;
//           color: var(--text3);
//           transition: all 0.2s;
//           font-family: 'JetBrains Mono', monospace;
//           letter-spacing: 0.5px;
//         }
//         .toggle-option.active {
//           background: var(--surface);
//           color: var(--text);
//           box-shadow: 0 1px 3px rgba(0,0,0,0.15);
//         }
//         .cc-root.light .toggle-option.active {
//           box-shadow: 0 1px 4px rgba(0,0,0,0.12);
//         }

//         /* MAIN */
//         .cc-main { flex: 1; overflow: auto; padding: 32px 32px 60px; }
//         .cc-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
//         .cc-page-title { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: var(--text); }
//         .cc-page-sub { font-size: 11px; color: var(--text2); margin-top: 3px; font-family: 'JetBrains Mono', monospace; }
//         .cc-topbar-right { display: flex; align-items: center; gap: 12px; }
//         .cc-clock { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text2); background: var(--surface); border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px; }
//         .cc-alert-btn { background: var(--surface); border: 1px solid rgba(255,71,87,0.27); color: var(--danger); padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }

//         /* DATE FILTER */
//         .cc-date-filter { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 24px; }
//         .cc-date-input { background: var(--surface); border: 1px solid var(--border2); border-radius: 8px; padding: 7px 12px; color: var(--text); font-size: 12px; font-family: 'JetBrains Mono', monospace; outline: none; }
//         .cc-date-input:focus { border-color: var(--accent); }
//         .cc-clear-btn { font-size: 11px; color: var(--text3); cursor: pointer; font-family: 'JetBrains Mono', monospace; padding: 7px 12px; border: 1px solid var(--border); border-radius: 8px; background: transparent; transition: all 0.15s; }
//         .date-label { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

//         /* ALERT STRIP */
//         .cc-alert-strip { background: rgba(255,107,53,0.05); border: 1px solid rgba(255,107,53,0.2); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; position: relative; overflow: hidden; }
//         .cc-alert-strip::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--orange); }
//         .cc-alert-text { font-size: 12px; color: var(--text); flex: 1; }
//         .cc-alert-text strong { color: var(--orange); }
//         .cc-alert-review { font-size: 10px; color: var(--accent); cursor: pointer; font-family: 'JetBrains Mono', monospace; }

//         /* KPI CARDS */
//         .cc-kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 28px; }
//         .cc-kpi { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 22px 20px; position: relative; overflow: hidden; transition: transform 0.2s, border-color 0.2s, background 0.25s; cursor: default; }
//         .cc-kpi:hover { transform: translateY(-2px); }
//         .cc-kpi.blue:hover { border-color: rgba(61,127,255,0.33); }
//         .cc-kpi.green:hover { border-color: rgba(0,212,170,0.33); }
//         .cc-kpi.orange:hover { border-color: rgba(245,158,11,0.33); }
//         .cc-kpi.purple:hover { border-color: rgba(167,139,250,0.33); }
//         .cc-kpi-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; }
//         .cc-kpi-value { font-size: 42px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
//         .cc-kpi.blue .cc-kpi-value { color: var(--accent); }
//         .cc-kpi.green .cc-kpi-value { color: var(--success); }
//         .cc-kpi.orange .cc-kpi-value { color: var(--warning); }
//         .cc-kpi.purple .cc-kpi-value { color: var(--purple); }
//         .cc-kpi-sub { font-size: 11px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
//         .cc-kpi-bar-wrap { display: flex; align-items: flex-end; gap: 3px; height: 28px; margin-top: 12px; }
//         .cc-kpi-bar { flex: 1; border-radius: 2px; min-height: 3px; opacity: 0.5; }

//         /* GLASS CARD */
//         .glass-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 20px; transition: background 0.25s, border-color 0.25s; }
//         .card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 12px; border-bottom: 1px solid var(--border); }
//         .card-title { font-size: 13px; font-weight: 700; color: var(--text); letter-spacing: 0.3px; }
//         .card-sub { font-size: 10px; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
//         .card-body { padding: 16px 20px; }

//         /* OVERVIEW GRID */
//         .overview-two-col { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 20px; margin-bottom: 20px; }

//         /* TIMELINE */
//         .tl-item { display: flex; gap: 14px; margin-bottom: 12px; }
//         .tl-item:last-child { margin-bottom: 0; }
//         .tl-left { display: flex; flex-direction: column; align-items: center; width: 40px; flex-shrink: 0; }
//         .tl-time { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: var(--accent); font-weight: 500; }
//         .tl-line { flex: 1; width: 1px; background: var(--border); margin-top: 4px; }
//         .tl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
//         .tl-content { flex: 1; background: var(--bg3); border-radius: 10px; padding: 9px 12px; border: 1px solid var(--border); }
//         .tl-client { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 3px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
//         .tl-meta { font-size: 10px; color: var(--text2); font-family: 'JetBrains Mono', monospace; }

//         /* FUNNEL */
//         .funnel-row { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
//         .funnel-label { font-size: 11px; color: var(--text2); width: 90px; flex-shrink: 0; font-family: 'JetBrains Mono', monospace; }
//         .funnel-bar-bg { flex: 1; background: var(--bg3); border-radius: 3px; height: 5px; overflow: hidden; }
//         .funnel-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
//         .funnel-count { font-size: 11px; font-weight: 600; min-width: 24px; text-align: right; font-family: 'JetBrains Mono', monospace; }

//         /* BDM SLOTS */
//         .slot-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 14px; }
//         .slot-chip { font-size: 10px; padding: 5px 4px; border-radius: 6px; text-align: center; font-family: 'JetBrains Mono', monospace; }
//         .slot-free { background: rgba(0,212,170,0.08); color: var(--success); border: 1px solid rgba(0,212,170,0.2); }
//         .slot-booked { background: rgba(255,71,87,0.08); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
//         .slot-legend { display: flex; gap: 12px; font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; margin-top: 8px; }

//         /* BO CHIPS */
//         .bo-tab-row { display: flex; gap: 8px; padding: 16px 20px; border-bottom: 1px solid var(--border); overflow-x: auto; }
//         .bo-chip { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--border2); cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; }
//         .bo-chip:hover { border-color: rgba(61,127,255,0.27); background: var(--surface2); }
//         .bo-chip.active { border-color: var(--accent); background: rgba(61,127,255,0.07); }
//         .bo-chip-ava { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: rgba(61,127,255,0.13); color: var(--accent); }
//         .bo-chip-name { font-size: 12px; font-weight: 600; color: var(--text); }

//         /* BO DETAIL */
//         .bo-header { display: flex; align-items: center; gap: 16px; padding: 20px; border-bottom: 1px solid var(--border); }
//         .bo-avatar { width: 48px; height: 48px; border-radius: 12px; background: rgba(61,127,255,0.13); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: var(--accent); flex-shrink: 0; }
//         .bo-name { font-size: 15px; font-weight: 700; color: var(--text); }
//         .bo-role { font-size: 10px; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
//         .health-label { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; line-height: 1.5; }
//         .bo-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--border); }
//         .bo-kpi { background: var(--bg3); border-radius: 10px; padding: 12px; border: 1px solid var(--border); }
//         .bo-kpi-val { font-size: 20px; font-weight: 700; line-height: 1; margin-bottom: 3px; }
//         .bo-kpi-label { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
//         .bo-two-col { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 14px; padding: 16px 20px; border-bottom: 1px solid var(--border); }
//         .bo-panel { background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
//         .panel-section-label { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px; margin-bottom: 12px; }
//         .bo-table-wrap { margin: 0 20px; background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
//         .bo-table-wrap + .bo-table-wrap { margin-top: 12px; }
//         .bo-table-wrap:last-child { margin-bottom: 20px; }
//         .bo-table-header { padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px; }

//         /* DATA TABLE */
//         .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
//         .data-table th { padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); font-family: 'JetBrains Mono', monospace; border-bottom: 1px solid var(--border); }
//         .data-table td { padding: 11px 12px; border-bottom: 1px solid var(--border); color: var(--text2); vertical-align: middle; }
//         .data-table tr:last-child td { border-bottom: none; }
//         .data-table tbody tr { transition: background 0.15s; }
//         .data-table tbody tr:hover { background: var(--surface2); }
//         .data-table td.primary { color: var(--text); font-weight: 600; }
//         .empty-row { text-align: center; color: var(--text3); padding: 16px; font-size: 11px; font-family: 'JetBrains Mono', monospace; }
//         .product-chip { font-size: 10px; background: var(--surface2); color: var(--text2); padding: 2px 8px; border-radius: 5px; font-family: 'JetBrains Mono', monospace; }

//         /* BADGES */
//         .badge { display: inline-flex; align-items: center; font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 6px; letter-spacing: 0.5px; font-family: 'JetBrains Mono', monospace; }
//         .badge-converted { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.2); }
//         .badge-done { background: rgba(61,127,255,0.1); color: var(--accent); border: 1px solid rgba(61,127,255,0.2); }
//         .badge-followup { background: rgba(167,139,250,0.1); color: var(--purple); border: 1px solid rgba(167,139,250,0.2); }
//         .badge-notdone { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
//         .badge-pending { background: rgba(245,158,11,0.1); color: var(--warning); border: 1px solid rgba(245,158,11,0.2); }
//         .badge-scheduled { background: rgba(61,127,255,0.1); color: var(--accent); border: 1px solid rgba(61,127,255,0.2); }
//         .badge-approved { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.2); }
//         .badge-rejected { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
//         .badge-interested { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.2); }
//         .badge-notint { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
//         .badge-eligible { background: rgba(61,127,255,0.1); color: var(--accent); border: 1px solid rgba(61,127,255,0.2); }
//         .badge-connected { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.2); }
//         .badge-notconn { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
//         .badge-mobileoff { background: rgba(245,158,11,0.1); color: var(--warning); border: 1px solid rgba(245,158,11,0.2); }
//         .badge-reschedule { background: rgba(255,107,53,0.1); color: var(--orange); border: 1px solid rgba(255,107,53,0.2); }

//         /* ACTION BUTTONS */
//         .action-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600; padding: 5px 12px; border-radius: 7px; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; font-family: 'JetBrains Mono', monospace; }
//         .btn-approve { background: rgba(0,212,170,0.1); color: var(--success); border-color: rgba(0,212,170,0.2); }
//         .btn-approve:hover { background: rgba(0,212,170,0.17); border-color: var(--success); }
//         .btn-reject { background: rgba(255,71,87,0.1); color: var(--danger); border-color: rgba(255,71,87,0.2); }
//         .btn-reject:hover { background: rgba(255,71,87,0.17); border-color: var(--danger); }

//         /* SCHEDULE FORM */
//         .sched-form { padding: 0; }
//         .sched-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
//         .field-label { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px; margin-bottom: 6px; }
//         .cc-select, .cc-input { width: 100%; background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px; padding: 8px 10px; color: var(--text); font-size: 12px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.15s; }
//         .cc-select:focus, .cc-input:focus { border-color: var(--accent); }
//         .cc-input::placeholder { color: var(--text3); }
//         .cc-btn { display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: 10px; padding: 10px 22px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
//         .cc-btn-blue { background: var(--accent); color: #fff; }
//         .cc-btn-blue:hover { opacity: 0.88; }
//         .cc-btn-orange { background: var(--orange); color: #fff; }
//         .cc-btn-orange:hover { opacity: 0.88; }

//         /* RESCHEDULE CARD */
//         .reschedule-wrap { background: rgba(255,107,53,0.05); border: 1px solid rgba(255,107,53,0.2); border-radius: 14px; padding: 18px; margin-bottom: 14px; }
//         .reschedule-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }

//         /* ANIMATIONS */
//         @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
//         .fade-in { animation: fadeInUp 0.3s ease forwards; }

//         /* SCROLLBAR */
//         ::-webkit-scrollbar { width: 4px; height: 4px; }
//         ::-webkit-scrollbar-track { background: transparent; }
//         ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
//       `}</style>

//       <div className={`cc-root ${theme}`}>
//         <div className="cc-layout">

//           {/* ── SIDEBAR ── */}
//           <aside className="cc-sidebar">
//             {/* <div className="cc-logo-area">
//               <div className="cc-logo-name">Command<br />Center</div>
//               <div className="cc-logo-tag">CRM · TC Portal</div>
//             </div> */}
//             <div className="cc-user-chip">
//               <div className="cc-user-avatar">{currentUser?.name?.[0] ?? 'T'}</div>
//               <div>
//                 <div className="cc-user-name">{currentUser?.name || 'Team Coord.'}</div>
//                 <div className="cc-user-role">TEAM COORD.</div>
//               </div>
//             </div>
//             <div className="cc-nav-section">
//               <div className="cc-nav-label">Overview</div>
//               <div className={`cc-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
//                 <div className="cc-nav-icon">{Icons.dashboard}</div>Dashboard
//               </div>
//               <div className={`cc-nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
//                 <div className="cc-nav-icon">{Icons.team}</div>Team Performance
//               </div>
//             </div>
//             <div className="cc-nav-section">
//               <div className="cc-nav-label">Actions</div>
//               <div className={`cc-nav-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
//                 <div className="cc-nav-icon">{Icons.requests}</div>Meeting Requests
//                 {pendingRequests.length > 0 && <span className="cc-nav-badge">{pendingRequests.length}</span>}
//               </div>
//               <div className={`cc-nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
//                 <div className="cc-nav-icon">{Icons.calendar}</div>Schedule
//                 {(rescheduleRequests.length + approvedPending.length) > 0 && (
//                   <span className="cc-nav-badge info">{rescheduleRequests.length + approvedPending.length}</span>
//                 )}
//               </div>
//               <div className={`cc-nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
//                 <div className="cc-nav-icon">{Icons.clock}</div>History
//               </div>
//             </div>
//             <div className="cc-sidebar-footer">
//               <div style={{ marginBottom: '12px' }}>
//                 <span className="cc-status-dot" />Live · {myTeam?.name || 'My Team'}<br />
//                 <span style={{ color: 'var(--text3)', marginTop: '4px', display: 'block' }}>{myBOs.length} BOs · {allTeamLeads.length} active leads</span>
//               </div>

//               {/* ── Theme Toggle ── */}
//               <div className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
//                 <div className={`toggle-option ${isDark ? 'active' : ''}`}>
//                   {Icons.moon} Dark
//                 </div>
//                 <div className={`toggle-option ${!isDark ? 'active' : ''}`}>
//                   {Icons.sun} Light
//                 </div>
//               </div>

//               <button
//                 onClick={logout}
//                 style={{
//                   display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
//                   padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
//                   color: 'var(--text2)', cursor: 'pointer', background: 'var(--surface)',
//                   border: '1px solid var(--border)', transition: 'all 0.2s', fontFamily: 'inherit'
//                 }}
//                 onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)'; }}
//                 onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
//               >
//                 {Icons.logout} Sign Out
//               </button>
//             </div>
//           </aside>

//           {/* ── MAIN ── */}
//           <main className="cc-main">

//             {/* ════════════════ OVERVIEW TAB ════════════════ */}
//             {activeTab === 'overview' && (
//               <div className="fade-in">
//                 <div className="cc-topbar">
//                   <div>
//                     <div className="cc-page-title">Good morning, {currentUser?.name?.split(' ')[0] || 'TC'}</div>
//                     <div className="cc-page-sub">// {myTeam?.name || 'My Team'} · {myBOs.length} BOs · {allTeamLeads.length} leads active</div>
//                   </div>
//                   <div className="cc-topbar-right">
//                     <div className="cc-clock">{clock}</div>
//                     {pendingRequests.length > 0 && (
//                       <button className="cc-alert-btn" onClick={() => setActiveTab('requests')}>
//                         {Icons.bell} {pendingRequests.length} Pending
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 {pendingRequests.length > 0 && (
//                   <div className="cc-alert-strip">
//                     <span style={{ fontSize: '16px' }}>⚡</span>
//                     <div className="cc-alert-text">
//                       <strong>{pendingRequests.length} meeting request{pendingRequests.length > 1 ? 's' : ''}</strong> waiting for your approval — review before end of day.
//                     </div>
//                     <span className="cc-alert-review" onClick={() => setActiveTab('requests')}>Review now →</span>
//                   </div>
//                 )}

//                 {/* KPI Cards */}
//                 <div className="cc-kpi-row">
//                   {[
//                     { label: 'Total Meetings', value: totalMeetings, cls: 'black', sub: 'in selected range', bars: [4, 6, 5, 7, 6, 8, 7, totalMeetings], barColor: '#3d7fff' },
//                     { label: 'Converted', value: convertedCount, cls: 'black', sub: `${totalMeetings ? Math.round(convertedCount / totalMeetings * 100) : 0}% conv. rate`, bars: [1, 2, 2, 3, 2, 3, 3, convertedCount], barColor: '#00d4aa' },
//                     { label: 'Pending', value: pendingCount, cls: 'black', sub: 'needs follow-up', bars: [3, 4, 3, 5, 3, 4, 4, pendingCount], barColor: '#f59e0b' },
//                     { label: 'Active Leads', value: allTeamLeads.length, cls: 'black', sub: `across ${myBOs.length} officers`, bars: [30, 32, 35, 38, 40, 42, 44, allTeamLeads.length], barColor: '#a78bfa' },
//                   ].map(k => {
//                     const max = Math.max(...k.bars) || 1;
//                     return (
//                       <div key={k.label} className={`cc-kpi ${k.cls}`}>
//                         <div className="cc-kpi-label">{k.label}</div>
//                         <div className="cc-kpi-value">{k.value}</div>
//                         <div className="cc-kpi-sub">{k.sub}</div>
//                         <div className="cc-kpi-bar-wrap">
//                           {k.bars.map((v, i) => (
//                             <div key={i} className="cc-kpi-bar" style={{ height: `${Math.max(3, Math.round((v / max) * 26))}px`, background: k.barColor }} />
//                           ))}
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>

//                 <div className="overview-two-col">
//                   {/* Today's Timeline */}
//                   <div className="glass-card">
//                     <div className="card-header">
//                       <div>
//                         <div className="card-title">Today's meeting timeline</div>
//                         <div className="card-sub">// {todayStr} · {todayMeetings.filter(m => m.tcId === currentUser?.id).length} scheduled</div>
//                       </div>
//                     </div>
//                     <div className="card-body">
//                       {todayMeetings.filter(m => m.tcId === currentUser?.id).length === 0 && (
//                         <div className="empty-row" style={{ padding: '24px 0' }}>No meetings scheduled today</div>
//                       )}
//                       {todayMeetings.filter(m => m.tcId === currentUser?.id).map((m, i, arr) => {
//                         const lead = leads.find(l => l.id === m.leadId);
//                         const bdm = users.find(u => u.id === m.bdmId);
//                         const dotColor = { 'Converted': '#00d4aa', 'Meeting Done': '#3d7fff', 'Follow-Up': '#a78bfa', 'Not Done': '#ff4757', 'Scheduled': '#f59e0b' }[m.status] || '#8892b0';
//                         return (
//                           <div key={m.id} className="tl-item">
//                             <div className="tl-left">
//                               <div className="tl-time">{m.timeSlot}</div>
//                               {i < arr.length - 1 && <div className="tl-line" />}
//                             </div>
//                             <div className="tl-dot" style={{ background: dotColor }} />
//                             <div className="tl-content">
//                               <div className="tl-client">
//                                 {m.clientName || lead?.clientName}
//                                 {statusBadge(m.status)}
//                               </div>
//                               <div className="tl-meta">BDM: {bdm?.name} · {m.meetingType} · {m.productType || '—'} · ₹{lead?.loanRequirement}</div>
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   <div>
//                     {/* BDM Slots */}
//                     <div className="glass-card">
//                       <div className="card-header">
//                         <div>
//                           <div className="card-title">BDM availability</div>
//                           <div className="card-sub">// today's free slots</div>
//                         </div>
//                       </div>
//                       <div className="card-body" style={{ paddingTop: '12px' }}>
//                         {bdms.map(bdm => {
//                           const bookedSlots = todayMeetings.filter(m => m.bdmId === bdm.id).map(m => m.timeSlot);
//                           return (
//                             <div key={bdm.id} style={{ marginBottom: '14px' }}>
//                               <div style={{ fontSize: '10px', color: 'var(--text2)', fontFamily: "'JetBrains Mono', monospace", marginBottom: '8px' }}>{bdm.name.toUpperCase()} (BDM)</div>
//                               <div className="slot-grid">
//                                 {TIME_SLOTS.slice(0, 24).map(slot => (
//                                   <div key={slot} className={`slot-chip ${bookedSlots.includes(slot) ? 'slot-booked' : 'slot-free'}`}>{slot}</div>
//                                 ))}
//                               </div>
//                             </div>
//                           );
//                         })}
//                         {bdms.length === 0 && <div className="empty-row">No BDMs assigned</div>}
//                         <div className="slot-legend">
//                           <span style={{ color: 'var(--success)' }}>■</span> Free &nbsp;&nbsp;
//                           <span style={{ color: 'var(--danger)' }}>■</span> Booked
//                         </div>
//                       </div>
//                     </div>

//                     {/* Lead Funnel */}
//                     <div className="glass-card">
//                       <div className="card-header">
//                         <div>
//                           <div className="card-title">Lead funnel</div>
//                           <div className="card-sub">// team aggregate · all time</div>
//                         </div>
//                       </div>
//                       <div className="card-body" style={{ paddingTop: '12px' }}>
//                         <FunnelRow label="Total leads" val={allTeamLeads.length} total={allTeamLeads.length} color="#3d7fff" />
//                         <FunnelRow label="Connected" val={allTeamLeads.filter(l => l.numberStatus === 'Connected').length} total={allTeamLeads.length} color="#00d4aa" />
//                         <FunnelRow label="Interested" val={allTeamLeads.filter(l => l.leadStatus === 'Interested').length} total={allTeamLeads.length} color="#a78bfa" />
//                         <FunnelRow label="Meetings" val={teamMeetings.length} total={allTeamLeads.length} color="#f59e0b" />
//                         <FunnelRow label="Converted" val={convertedCount} total={allTeamLeads.length} color="#00d4aa" />
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* {stateMap.length > 0 && (
//                   <div className="glass-card">
//                     <div className="card-header">
//                       <div>
//                         <div className="card-title">State-wise distribution</div>
//                         <div className="card-sub">// regional meeting data</div>
//                       </div>
//                     </div>
//                     <table className="data-table">
//                       <thead><tr><th>State</th><th>Meetings</th><th>Pending</th><th>Rejected</th><th>Top Product</th></tr></thead>
//                       <tbody>
//                         {stateMap.map(row => (
//                           <tr key={row.state}>
//                             <td className="primary">{row.state}</td>
//                             <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{row.total}</td>
//                             <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{row.pending}</td>
//                             <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{row.rejected}</td>
//                             <td><span className="product-chip">{row.topProduct}</span></td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 )} */}
//                 <div className="glass-card" style={{ marginBottom: '20px' }}>
//                   <div className="card-header">
//                     <div className="card-title">Lead overview</div>
//                   </div>
//                   <table className="data-table">
//                     <thead>
//                       <tr>
//                         {['BO Name', 'Leads', 'Connected', 'Not Connected', 'Interested', 'Not Interested', 'Eligible', 'Meetings', 'Conv. Rate'].map(h => (
//                           <th key={h}>{h}</th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {myBOs.map(boId => {
//                         const bo = users.find(u => u.id === boId);
//                         const boLeads = leads.filter(l => l.assignedBOId === boId);
//                         const boMeetings = meetings.filter(m => m.boId === boId);
//                         const converted = boMeetings.filter(m => m.status === 'Converted').length;
//                         const convRate = boMeetings.length ? Math.round(converted / boMeetings.length * 100) : 0;
//                         return (
//                           <tr key={boId} style={{ cursor: 'pointer' }} onClick={() => { setSelectedBOId(boId); }}>
//                             <td className="primary">
//                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                                 <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(61,127,255,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
//                                   {bo?.name?.[0] ?? '?'}
//                                 </div>
//                                 {bo?.name}
//                               </div>
//                             </td>
//                             <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{boLeads.length}</td>
//                             <td style={{ color: 'var(--success)', fontWeight: 600 }}>{boLeads.filter(l => l.numberStatus === 'Connected').length}</td>
//                             <td style={{ color: 'var(--danger)' }}>{boLeads.filter(l => l.numberStatus === 'Not Connected').length}</td>
//                             <td style={{ color: 'var(--text)' }}>{boLeads.filter(l => l.leadStatus === 'Interested').length}</td>
//                             <td style={{ color: 'var(--text3)' }}>{boLeads.filter(l => l.leadStatus === 'Not Interested').length}</td>
//                             <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{boLeads.filter(l => l.leadStatus === 'Eligible').length}</td>
//                             <td style={{ color: 'var(--text)' }}>{boMeetings.length}</td>
//                             <td style={{ color: convRate >= 50 ? 'var(--success)' : convRate >= 25 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700 }}>{convRate}%</td>
//                           </tr>
//                         );
//                       })}
//                       {myBOs.length === 0 && <tr><td colSpan={9} className="empty-row">No Business Officers in your team</td></tr>}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {/* ════════════════ TEAM TAB ════════════════ */}
//             {activeTab === 'team' && (
//               <div className="fade-in">
//                 <div className="cc-topbar">
//                   <div>
//                     <div className="cc-page-title">Team performance</div>
//                     <div className="cc-page-sub">// {myTeam?.name || 'My Team'} · per BO deep dive</div>
//                   </div>
//                 </div>

//                 {myBOs.length > 0 && (
//                   <div className="glass-card">
//                     <div className="bo-tab-row">
//                       {myBOs.map(boId => {
//                         const bo = users.find(u => u.id === boId);
//                         const isSelected = selectedBOId === boId || (!selectedBOId && boId === myBOs[0]);
//                         return (
//                           <div key={boId} className={`bo-chip ${isSelected ? 'active' : ''}`} onClick={() => setSelectedBOId(boId)}>
//                             <div className="bo-chip-ava">{bo?.name?.[0] ?? '?'}</div>
//                             <div className="bo-chip-name">{bo?.name}</div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                     {renderBODetail(selectedBOId || myBOs[0])}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* ════════════════ REQUESTS TAB ════════════════ */}
//             {activeTab === 'requests' && (
//               <div className="fade-in">
//                 <div className="cc-topbar">
//                   <div>
//                     <div className="cc-page-title">Meeting requests</div>
//                     <div className="cc-page-sub">// {pendingRequests.length} pending · review and approve</div>
//                   </div>
//                 </div>
//                 <div className="glass-card">
//                   <table className="data-table">
//                     <thead>
//                       <tr>
//                         <th>Client</th><th>Phone</th><th>Loan Req.</th><th>BO</th>
//                         <th>Lead Status</th><th>Status</th><th>Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {meetingRequests.filter(mr => mr.tcId === currentUser?.id).map(req => {
//                         const lead = leads.find(l => l.id === req.leadId);
//                         const bo = users.find(u => u.id === req.boId);
//                         return (
//                           <tr key={req.id}>
//                             <td className="primary">{lead?.clientName}</td>
//                             <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{lead?.phoneNumber}</td>
//                             <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{lead?.loanRequirement}</td>
//                             <td>{bo?.name}</td>
//                             <td>{statusBadge(lead?.leadStatus || 'Pending')}</td>
//                             <td>{statusBadge(req.status)}</td>
//                             <td>
//                               {req.status === 'Pending' && (
//                                 <div style={{ display: 'flex', gap: '6px' }}>
//                                   <button className="action-btn btn-approve" onClick={() => approveRequest(req.id)}>{Icons.check} Approve</button>
//                                   <button className="action-btn btn-reject" onClick={() => rejectRequest(req.id)}>{Icons.x} Reject</button>
//                                 </div>
//                               )}
//                               {req.status !== 'Pending' && <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>—</span>}
//                             </td>
//                           </tr>
//                         );
//                       })}
//                       {meetingRequests.filter(mr => mr.tcId === currentUser?.id).length === 0 && (
//                         <tr><td colSpan={7} className="empty-row">No meeting requests</td></tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {/* ════════════════ SCHEDULE TAB ════════════════ */}
//             {activeTab === 'schedule' && (
//               <div className="fade-in">
//                 <div className="cc-topbar">
//                   <div>
//                     <div className="cc-page-title">Schedule meetings</div>
//                     <div className="cc-page-sub">// assign BDM + slot · reschedules</div>
//                   </div>
//                 </div>

//                 {rescheduleRequests.length > 0 && (
//                   <div style={{ marginBottom: '20px' }}>
//                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
//                       <span style={{ color: 'var(--orange)' }}>{Icons.refresh}</span>
//                       <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--orange)' }}>Reschedule Requests ({rescheduleRequests.length})</span>
//                     </div>
//                     {rescheduleRequests.map(m => {
//                       const lead = leads.find(l => l.id === m.leadId);
//                       const bo = users.find(u => u.id === m.boId);
//                       return (
//                         <div key={m.id} className="reschedule-wrap">
//                           <div className="reschedule-header">
//                             {statusBadge('Reschedule Requested')}
//                             <span style={{ fontWeight: 700, color: 'var(--text)' }}>{m.clientName || lead?.clientName}</span>
//                             <span style={{ color: 'var(--text2)', fontSize: '13px' }}>— ₹{lead?.loanRequirement}</span>
//                             <span style={{ color: 'var(--text3)', fontSize: '11px' }}>(BO: {bo?.name})</span>
//                             <span style={{ color: 'var(--text3)', fontSize: '11px' }}>· Prev: {m.date} {m.timeSlot}</span>
//                           </div>
//                           {renderScheduleForm(m.id, () => rescheduleExistingMeeting(m.id), 'Confirm Reschedule', true, m.id)}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}

//                 {approvedPending.map(req => {
//                   const lead = leads.find(l => l.id === req.leadId);
//                   if (!lead) return null;
//                   const bo = users.find(u => u.id === req.boId);
//                   return (
//                     <div key={req.id} className="glass-card">
//                       <div className="card-header">
//                         <div>
//                           <div className="card-title">{lead.clientName} — ₹{lead.loanRequirement}</div>
//                           <div className="card-sub">// BO: {bo?.name} · Approved</div>
//                         </div>
//                         {statusBadge('Approved')}
//                       </div>
//                       <div className="card-body">
//                         {renderScheduleForm(req.id, () => scheduleMeeting(req.id, lead.id, req.boId), 'Confirm Schedule')}
//                       </div>
//                     </div>
//                   );
//                 })}

//                 {rescheduleRequests.length === 0 && approvedPending.length === 0 && (
//                   <div className="glass-card">
//                     <div className="card-body" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
//                       no pending scheduling required
//                     </div>
//                   </div>
//                 )}

//                 <div className="glass-card">
//                   <div className="card-header">
//                     <div>
//                       <div className="card-title">Today's scheduled meetings</div>
//                       <div className="card-sub">// {todayStr}</div>
//                     </div>
//                   </div>
//                   <table className="data-table">
//                     <thead><tr><th>Time</th><th>Client</th><th>BDM</th><th>Type</th><th>Status</th></tr></thead>
//                     <tbody>
//                       {todayMeetings.filter(m => m.tcId === currentUser?.id).map(m => {
//                         const lead = leads.find(l => l.id === m.leadId);
//                         const bdm = users.find(u => u.id === m.bdmId);
//                         return (
//                           <tr key={m.id}>
//                             <td style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{m.timeSlot}</td>
//                             <td className="primary">{m.clientName || lead?.clientName}</td>
//                             <td>{bdm?.name}</td>
//                             <td><span className="product-chip">{m.meetingType}</span></td>
//                             <td>{statusBadge(m.status)}</td>
//                           </tr>
//                         );
//                       })}
//                       {todayMeetings.filter(m => m.tcId === currentUser?.id).length === 0 && (
//                         <tr><td colSpan={5} className="empty-row">No meetings scheduled today</td></tr>
//                       )}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {/* ════════════════ HISTORY TAB ════════════════ */}
//             {activeTab === 'history' && (
//               <div className="fade-in">
//                 <div className="cc-topbar">
//                   <div>
//                     <div className="cc-page-title">Meeting history</div>
//                     <div className="cc-page-sub">// date-wise summary · all meetings</div>
//                   </div>
//                 </div>

//                 <div className="cc-date-filter">
//                   <span className="date-label">FROM</span>
//                   <input type="date" className="cc-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
//                   <span className="date-label">TO</span>
//                   <input type="date" className="cc-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
//                   {(fromDate || toDate) && (
//                     <button className="cc-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>
//                   )}
//                 </div>

//                 <div className="glass-card">
//                   <div className="card-header">
//                     <div className="card-title">
//                       Summary <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({teamMeetings.length} meetings)</span>
//                     </div>
//                   </div>
//                   <table className="data-table">
//                     <thead>
//                       <tr>
//                         <th>Date</th><th>Total</th><th>Done</th><th>Not Done</th>
//                         <th>Converted</th><th>Follow-Up</th><th>Rescheduled</th><th>Conv. Rate</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {meetingsByDate.slice().reverse().map(([date, count]) => {
//                         const dm = teamMeetings.filter(m => m.date === date);
//                         const conv = dm.filter(m => m.status === 'Converted').length;
//                         const convRate = count ? Math.round(conv / count * 100) : 0;
//                         return (
//                           <tr key={date}>
//                             <td className="primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{date}</td>
//                             <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{count}</td>
//                             <td style={{ color: 'var(--success)', fontWeight: 600 }}>
//                               {dm.filter(m => ['Meeting Done', 'Converted', 'Follow-Up'].includes(m.status)).length}
//                             </td>
//                             <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{dm.filter(m => m.status === 'Not Done').length}</td>
//                             <td style={{ color: 'var(--success)', fontWeight: 600 }}>{conv}</td>
//                             <td style={{ color: 'var(--purple)', fontWeight: 600 }}>{dm.filter(m => m.status === 'Follow-Up').length}</td>
//                             <td style={{ color: 'var(--orange)', fontWeight: 600 }}>{dm.filter(m => m.status === 'Reschedule Requested').length}</td>
//                             <td>
//                               <span className={`badge ${convRate >= 60 ? 'badge-converted' : convRate >= 35 ? 'badge-done' : 'badge-pending'}`}>
//                                 {convRate}%
//                               </span>
//                             </td>
//                           </tr>
//                         );
//                       })}
//                       {meetingsByDate.length === 0 && (
//                         <tr><td colSpan={8} className="empty-row">No meetings found</td></tr>
//                       )}
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
import { ProductType } from '@/types/crm';
import { TIME_SLOTS } from '@/data/mockData';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────
type ScheduleForm = {
  bdm: string; slot: string; meetingType: 'Virtual' | 'Walk-in';
  clientName: string; location: string; state: string;
  productType: ProductType; finalReq: string; collateral: string;
};
const defaultForm = (): ScheduleForm => ({
  bdm: '', slot: '', meetingType: 'Virtual',
  clientName: '', location: '', state: '',
  productType: '', finalReq: '', collateral: '',
});

type Tab = 'overview' | 'team' | 'requests' | 'schedule' | 'history';
type Theme = 'dark' | 'light';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, string> = {
    'Converted': 'badge-converted',
    'Meeting Done': 'badge-done',
    'Follow-Up': 'badge-followup',
    'Not Done': 'badge-notdone',
    'Pending': 'badge-pending',
    'Scheduled': 'badge-scheduled',
    'Approved': 'badge-approved',
    'Rejected': 'badge-rejected',
    'Interested': 'badge-interested',
    'Not Interested': 'badge-notint',
    'Eligible': 'badge-eligible',
    'Not Eligible': 'badge-notdone',
    'Connected': 'badge-connected',
    'Not Connected': 'badge-notconn',
    'Mobile Off': 'badge-mobileoff',
    'Incoming Barred': 'badge-mobileoff',
    'Reschedule Requested': 'badge-reschedule',
  };
  return (
    <span className={`badge ${map[status] || 'badge-pending'}`}>{status}</span>
  );
}

function healthColor(score: number, theme: Theme) {
  if (score >= 70) return '#00d4aa';
  if (score >= 50) return '#f59e0b';
  return '#ff4757';
}

function HealthRing({ score, theme }: { score: number; theme: Theme }) {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = healthColor(score, theme);
  const trackColor = theme === 'dark' ? '#1c2038' : '#e5e7eb';
  return (
    <svg width="72" height="72" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke={trackColor} strokeWidth="6" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
      />
      <text x="40" y="45" textAnchor="middle" fontSize="15" fontWeight="700"
        fill={color} fontFamily="'Inter', sans-serif">{score}</text>
    </svg>
  );
}

function FunnelRow({ label, val, total, color }: { label: string; val: number; total: number; color: string }) {
  const pct = total ? Math.round((val / total) * 100) : 0;
  return (
    <div className="funnel-row">
      <span className="funnel-label">{label}</span>
      <div className="funnel-bar-bg">
        <div className="funnel-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="funnel-count" style={{ color }}>{val}</span>
    </div>
  );
}

// ─── Nav Icons (inline SVG) ────────────────────────────────────────────────────
const Icons = {
  dashboard: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  team: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" /></svg>,
  requests: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>,
  calendar: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  clock: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>,
  bell: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>,
  check: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>,
  x: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  refresh: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>,
  logout: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  sun: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  moon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>,
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TCDashboard() {
  const {
    currentUser, users, leads, teams, meetings,
    meetingRequests, updateLead, addMeeting,
    updateMeetingRequest, updateMeeting, logout,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [theme, setTheme] = useState<Theme>('dark');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [forms, setForms] = useState<Record<string, ScheduleForm>>({});
  const [selectedBOId, setSelectedBOId] = useState<string | null>(null);
  const [clock, setClock] = useState('');

  // Live clock
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

  // Form helpers
  const getForm = (id: string) => forms[id] ?? defaultForm();
  const setFormField = (id: string, field: keyof ScheduleForm, value: string) =>
    setForms(prev => ({ ...prev, [id]: { ...(prev[id] ?? defaultForm()), [field]: value } }));
  const resetForm = (id: string) =>
    setForms(prev => { const n = { ...prev }; delete n[id]; return n; });

  // Data
  const myTeam = teams.find(t => t.tcId === currentUser?.id);
  const myBOs = myTeam?.boIds || [];
  const bdms = users.filter(u => u.role === 'BDM' && u.active);
  const today = new Date().toISOString().split('T')[0];
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const todayMeetings = meetings.filter(m => m.date === today);

  const teamMeetings = useMemo(() => {
    let f = meetings.filter(m => m.tcId === currentUser?.id);
    if (fromDate) f = f.filter(m => m.date >= fromDate);
    if (toDate) f = f.filter(m => m.date <= toDate);
    return f;
  }, [meetings, currentUser, fromDate, toDate]);

  const allTeamLeads = leads.filter(l => myBOs.includes(l.assignedBOId));
  const pendingRequests = meetingRequests.filter(mr => mr.tcId === currentUser?.id && mr.status === 'Pending');
  const rescheduleRequests = meetings.filter(m => m.tcId === currentUser?.id && m.status === 'Reschedule Requested');
  const approvedPending = meetingRequests.filter(
    mr => mr.tcId === currentUser?.id && mr.status === 'Approved' && !leads.find(l => l.id === mr.leadId)?.meetingId
  );

  // KPI stats
  const totalMeetings = teamMeetings.length;
  const pendingCount = teamMeetings.filter(m => m.status === 'Pending' || m.status === 'Scheduled').length;
  const rejectedCount = teamMeetings.filter(m => m.status === 'Reject' || m.status === 'Not Done').length;
  const convertedCount = teamMeetings.filter(m => m.status === 'Converted').length;

  const meetingsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    teamMeetings.forEach(m => { map[m.date] = (map[m.date] || 0) + 1; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-30);
  }, [teamMeetings]);

  const stateMap = useMemo(() => {
    const map: Record<string, { total: number; pending: number; rejected: number; products: Record<string, number> }> = {};
    teamMeetings.forEach(m => {
      const s = m.state || 'Unknown';
      if (!map[s]) map[s] = { total: 0, pending: 0, rejected: 0, products: {} };
      map[s].total++;
      if (m.status === 'Pending' || m.status === 'Scheduled') map[s].pending++;
      if (m.status === 'Reject' || m.status === 'Not Done') map[s].rejected++;
      if (m.productType) map[s].products[m.productType] = (map[s].products[m.productType] || 0) + 1;
    });
    return Object.entries(map).sort(([, a], [, b]) => b.total - a.total).slice(0, 8).map(([state, data]) => ({
      state, ...data,
      topProduct: Object.entries(data.products).sort(([, a], [, b]) => b - a)[0]?.[0] || '—',
    }));
  }, [teamMeetings]);

  // Actions
  const approveRequest = async (requestId: string) => {
    await updateMeetingRequest(requestId, { status: 'Approved' });
    const req = meetingRequests.find(mr => mr.id === requestId);
    if (req) await updateLead(req.leadId, { meetingApproved: true });
    toast.success('Meeting request approved');
  };
  const rejectRequest = async (requestId: string) => {
    await updateMeetingRequest(requestId, { status: 'Rejected' });
    const req = meetingRequests.find(mr => mr.id === requestId);
    if (req) await updateLead(req.leadId, { meetingRequested: false, meetingRejected: true });
    toast.success('Meeting request rejected');
  };
  const scheduleMeeting = async (reqId: string, leadId: string, boId: string) => {
    const f = getForm(reqId);
    if (!f.bdm || !f.slot) { toast.error('Select BDM and time slot'); return; }
    await addMeeting({
      id: `m${Date.now()}`, leadId, bdmId: f.bdm, tcId: currentUser!.id, boId,
      date: today, timeSlot: f.slot, status: 'Scheduled', meetingType: f.meetingType,
      clientName: f.clientName || undefined, location: f.location || undefined,
      state: f.state || undefined, productType: f.productType || undefined,
      finalRequirement: f.finalReq || undefined, collateralValue: f.collateral || undefined,
    });
    await updateLead(leadId, { meetingId: `m${Date.now()}` });
    resetForm(reqId);
    toast.success('Meeting scheduled');
  };

  // const scheduleMeeting = async (reqId: string, leadId: string, boId: string) => {
  //   const f = getForm(reqId);
  //   if (!f.bdm || !f.slot) { toast.error('Select BDM and time slot'); return; }

  //   const meetingId = `m${Date.now()}`; // ✅ Ek hi ID, dono jagah use karo

  //   await addMeeting({
  //     id: meetingId, leadId, bdmId: f.bdm, tcId: currentUser!.id, boId,
  //     date: today, timeSlot: f.slot, status: 'Scheduled',
  //     meetingType: f.meetingType,
  //     clientName: f.clientName || undefined,
  //     location: f.location || undefined,
  //     state: f.state || undefined,
  //     productType: f.productType || undefined,
  //     finalRequirement: f.finalReq || undefined,
  //     collateralValue: f.collateral || undefined,
  //   });

  //   // ✅ meetingRequested: false reset karo — BO ke dashboard pe button nahi aayega
  //   await updateLead(leadId, {
  //     meetingId: meetingId,        // ✅ Same ID
  //     meetingRequested: false,     // ✅ Flag clear karo
  //     meetingApproved: true,       // ✅ Approved mark karo
  //   });

  //   resetForm(reqId);
  //   toast.success('Meeting scheduled');
  // };
  const rescheduleExistingMeeting = async (meetingId: string) => {
    const f = getForm(meetingId);
    if (!f.bdm || !f.slot) { toast.error('Select BDM and time slot'); return; }
    await updateMeeting(meetingId, {
      status: 'Scheduled', bdmId: f.bdm, date: today, timeSlot: f.slot,
      meetingType: f.meetingType, clientName: f.clientName || undefined,
      location: f.location || undefined, state: f.state || undefined,
      productType: f.productType || undefined,
      finalRequirement: f.finalReq || undefined,
      collateralValue: f.collateral || undefined,
    });
    resetForm(meetingId);
    toast.success('Meeting rescheduled successfully');
  };

  const getAvailableSlots = (bdmId: string, excludeId?: string) => {
    const booked = todayMeetings.filter(m => m.bdmId === bdmId && m.id !== excludeId).map(m => m.timeSlot);
    return TIME_SLOTS.filter(s => !booked.includes(s));
  };

  // ─── Schedule Form ─────────────────────────────────────────────────────────
  const renderScheduleForm = (id: string, onSubmit: () => void, label: string, isReschedule = false, excludeId?: string) => {
    const f = getForm(id);
    const slots = f.bdm ? getAvailableSlots(f.bdm, excludeId) : [];
    return (
      <div className="sched-form">
        <div className="sched-grid">
          <div className="sched-field">
            <div className="field-label">SELECT BDM</div>
            <select className="cc-select" value={f.bdm} onChange={e => { setFormField(id, 'bdm', e.target.value); setFormField(id, 'slot', ''); }}>
              <option value="">Choose BDM</option>
              {bdms.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="sched-field">
            <div className="field-label">TIME SLOT</div>
            <select className="cc-select" value={f.slot} onChange={e => setFormField(id, 'slot', e.target.value)}>
              <option value="">Choose slot</option>
              {slots.map(s => <option key={s} value={s}>{s}</option>)}
              {slots.length === 0 && f.bdm && <option disabled>No slots available</option>}
            </select>
          </div>
          <div className="sched-field">
            <div className="field-label">MEETING TYPE</div>
            <select className="cc-select" value={f.meetingType} onChange={e => setFormField(id, 'meetingType', e.target.value)}>
              <option value="Virtual">Virtual</option>
              <option value="Walk-in">Walk-in</option>
            </select>
          </div>
          <div className="sched-field">
            <div className="field-label">CLIENT NAME</div>
            <input className="cc-input" placeholder="Enter client name" value={f.clientName} onChange={e => setFormField(id, 'clientName', e.target.value)} />
          </div>
          <div className="sched-field">
            <div className="field-label">LOCATION</div>
            <input className="cc-input" placeholder="Enter location" value={f.location} onChange={e => setFormField(id, 'location', e.target.value)} />
          </div>
          <div className="sched-field">
            <div className="field-label">STATE</div>
            <input className="cc-input" placeholder="Enter state" value={f.state} onChange={e => setFormField(id, 'state', e.target.value)} />
          </div>
          <div className="sched-field">
            <div className="field-label">PRODUCT TYPE</div>
            <select className="cc-select" value={f.productType} onChange={e => setFormField(id, 'productType', e.target.value)}>
              <option value="">Select product</option>
              {['Term Loan', 'Equity', 'Term+Equity', 'Unsecure', 'Project Funding'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="sched-field">
            <div className="field-label">FINAL REQ. (₹)</div>
            <input className="cc-input" placeholder="e.g. 10-15 Lakhs" value={f.finalReq} onChange={e => setFormField(id, 'finalReq', e.target.value)} />
          </div>
          <div className="sched-field">
            <div className="field-label">COLLATERAL (₹)</div>
            <input className="cc-input" placeholder="e.g. 1-2 Cr" value={f.collateral} onChange={e => setFormField(id, 'collateral', e.target.value)} />
          </div>
        </div>
        <button className={`cc-btn ${isReschedule ? 'cc-btn-orange' : 'cc-btn-blue'}`} onClick={onSubmit}>
          {isReschedule ? Icons.refresh : Icons.calendar}
          {label}
        </button>
      </div>
    );
  };

  // ─── BO Detail Panel ────────────────────────────────────────────────────────
  const renderBODetail = (boId: string) => {
    const bo = users.find(u => u.id === boId);
    const boLeads = leads.filter(l => l.assignedBOId === boId);
    const boMeetings = meetings.filter(m => m.boId === boId);
    const connected = boLeads.filter(l => l.numberStatus === 'Connected').length;
    const notConnected = boLeads.filter(l => l.numberStatus === 'Not Connected').length;
    const mobileOff = boLeads.filter(l => l.numberStatus === 'Mobile Off').length;
    const incomingBarred = boLeads.filter(l => l.numberStatus === 'Incoming Barred').length;
    const interested = boLeads.filter(l => l.leadStatus === 'Interested').length;
    const eligible = boLeads.filter(l => l.leadStatus === 'Eligible').length;
    const converted = boMeetings.filter(m => m.status === 'Converted').length;
    const done = boMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length;
    const notDone = boMeetings.filter(m => m.status === 'Not Done').length;
    const followUp = boMeetings.filter(m => m.status === 'Follow-Up').length;
    const pendingReqs = meetingRequests.filter(mr => mr.boId === boId && mr.status === 'Pending').length;
    const total = boLeads.length || 1;
    const connectRate = Math.round((connected / total) * 100);
    const convRate = boMeetings.length ? Math.round((converted / boMeetings.length) * 100) : 0;
    const healthScore = Math.min(100, Math.round(((connected / total) * 40) + ((interested / total) * 30) + (convRate * 0.3)));

    // ── BO Activity fields (from DB via BO's updateLead calls) ──
    const todayDate = new Date().toISOString().split('T')[0];
    const hotLeads = boLeads.filter(l => l.priority === 'Hot').length;
    const warmLeads = boLeads.filter(l => l.priority === 'Warm').length;
    const coldLeads = boLeads.filter(l => l.priority === 'Cold').length;
    const totalCalls = boLeads.reduce((s, l) => s + (l.callCount || 0), 0);
    const fuOverdue = boLeads.filter(l => l.followUpDate && l.followUpDate < todayDate).length;
    const fuToday = boLeads.filter(l => l.followUpDate === todayDate).length;
    const fuUpcoming = boLeads.filter(l => l.followUpDate && l.followUpDate > todayDate).length;
    const notCalled = boLeads.filter(l => !l.callCount || l.callCount === 0).length;
    const avgCalls = boLeads.length > 0 ? Math.round((totalCalls / boLeads.length) * 10) / 10 : 0;

    return (
      <div>
        {/* ── Header ── */}
        <div className="bo-header">
          <div className="bo-avatar">{bo?.name?.[0] ?? '?'}</div>
          <div className="bo-info">
            <div className="bo-name">{bo?.name}</div>
            <div className="bo-role">Business Officer · {bo?.username || 'N/A'}</div>
          </div>
          <HealthRing score={healthScore} theme={theme} />
          <div className="health-label">HEALTH<br />SCORE</div>
        </div>

        {/* ── Top KPIs ── */}
        <div className="bo-kpis">
          {[
            { val: boLeads.length, label: 'Total Leads', color: '#3d7fff' },
            { val: connected, label: `Connected (${connectRate}%)`, color: '#00d4aa' },
            { val: boMeetings.length, label: 'Meetings', color: 'var(--text)' },
            { val: converted, label: `Converted (${convRate}%)`, color: '#00d4aa' },
          ].map(k => (
            <div key={k.label} className="bo-kpi">
              <div className="bo-kpi-val" style={{ color: k.color }}>{k.val}</div>
              <div className="bo-kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── NEW: BO Activity Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '12px', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>

          {/* Priority Tags */}
          <div className="bo-panel">
            <div className="panel-section-label">LEAD PRIORITY TAGS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginTop: '8px' }}>
              {[
                { label: 'Hot', val: hotLeads, color: '#ff4757', bg: 'rgba(255,71,87,0.1)' },
                { label: 'Warm', val: warmLeads, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                { label: 'Cold', val: coldLeads, color: 'var(--accent)', bg: 'rgba(61,127,255,0.1)' },
                { label: 'Untagged', val: boLeads.filter(l => !l.priority).length, color: 'var(--text3)', bg: 'transparent' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: item.color, background: item.bg, padding: '2px 8px', borderRadius: '5px', minWidth: '52px', textAlign: 'center', fontWeight: 600 }}>{item.label}</span>
                  <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '3px', background: item.color, width: `${boLeads.length ? Math.round((item.val / boLeads.length) * 100) : 0}%`, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace", minWidth: '18px', textAlign: 'right' }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Status */}
          <div className="bo-panel">
            <div className="panel-section-label">FOLLOW-UP STATUS</div>
            {fuOverdue > 0 && (
              <div style={{ marginTop: '6px', marginBottom: '8px', fontSize: '10px', color: '#ff4757', fontFamily: "'JetBrains Mono', monospace", padding: '5px 8px', background: 'rgba(255,71,87,0.08)', borderRadius: '6px', border: '1px solid rgba(255,71,87,0.15)' }}>
                ⚠ {fuOverdue} overdue — needs attention
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginTop: fuOverdue > 0 ? 0 : '8px' }}>
              {[
                { v: fuOverdue, l: 'OVERDUE', c: '#ff4757' },
                { v: fuToday, l: 'DUE TODAY', c: '#f59e0b' },
                { v: fuUpcoming, l: 'UPCOMING', c: '#00d4aa' },
                { v: boLeads.filter(l => l.followUpDate).length, l: 'TOTAL SET', c: 'var(--accent)' },
              ].map(item => (
                <div key={item.l} style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '8px 10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: item.c, fontFamily: "'JetBrains Mono', monospace" }}>{item.v}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px' }}>{item.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Call Activity */}
          <div className="bo-panel">
            <div className="panel-section-label">CALL ACTIVITY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px', marginTop: '8px' }}>
              {[
                { v: totalCalls, l: 'TOTAL CALLS', c: 'var(--accent)' },
                { v: avgCalls, l: 'AVG / LEAD', c: 'var(--purple)' },
                { v: notCalled, l: 'NOT CALLED', c: '#ff4757' },
                { v: boLeads.filter(l => (l.callCount || 0) >= 3).length, l: '3+ ATTEMPTS', c: '#f59e0b' },
              ].map(item => (
                <div key={item.l} style={{ background: 'var(--bg3)', borderRadius: '8px', padding: '8px 10px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: item.c, fontFamily: "'JetBrains Mono', monospace" }}>{item.v}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px' }}>{item.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pipeline + Results ── */}
        <div className="bo-two-col">
          <div className="bo-panel">
            <div className="panel-section-label">LEAD PIPELINE</div>
            <FunnelRow label="Total" val={boLeads.length} total={boLeads.length} color="#3d7fff" />
            <FunnelRow label="Connected" val={connected} total={boLeads.length} color="#00d4aa" />
            <FunnelRow label="Interested" val={interested} total={boLeads.length} color="#a78bfa" />
            <FunnelRow label="Eligible" val={eligible} total={boLeads.length} color="#3d7fff" />
            <FunnelRow label="Meetings" val={boMeetings.length} total={boLeads.length} color="#f59e0b" />
            <FunnelRow label="Converted" val={converted} total={boLeads.length} color="#00d4aa" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="bo-panel">
              <div className="panel-section-label">CALL OUTCOMES</div>
              <FunnelRow label="Not conn." val={notConnected} total={boLeads.length} color="#ff4757" />
              <FunnelRow label="Mobile off" val={mobileOff} total={boLeads.length} color="#f59e0b" />
              <FunnelRow label="Inc. barred" val={incomingBarred} total={boLeads.length} color="#f59e0b" />
            </div>
            <div className="bo-panel">
              <div className="panel-section-label">MEETING RESULTS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { v: done, l: 'DONE', c: '#00d4aa' },
                  { v: notDone, l: 'NOT DONE', c: '#ff4757' },
                  { v: followUp, l: 'FOLLOW-UP', c: '#a78bfa' },
                  { v: pendingReqs, l: 'PENDING REQ', c: pendingReqs > 0 ? '#f59e0b' : 'var(--text3)' },
                ].map(item => (
                  <div key={item.l}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: item.c }}>{item.v}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px' }}>{item.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Recent Meetings ── */}
        <div className="bo-table-wrap" style={{ marginBottom: '12px' }}>
          <div className="bo-table-header">RECENT MEETINGS</div>
          <table className="data-table">
            <thead><tr><th>Client</th><th>Date</th><th>Product</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              {boMeetings.slice(-5).reverse().map(m => {
                const lead = leads.find(l => l.id === m.leadId);
                return (
                  <tr key={m.id}>
                    <td className="primary">{m.clientName || lead?.clientName}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{m.date}</td>
                    <td><span className="product-chip">{m.productType || '—'}</span></td>
                    <td style={{ color: '#3d7fff', fontWeight: 600 }}>₹{lead?.loanRequirement || '—'}</td>
                    <td>{statusBadge(m.status)}</td>
                  </tr>
                );
              })}
              {boMeetings.length === 0 && <tr><td colSpan={5} className="empty-row">no meetings yet</td></tr>}
            </tbody>
          </table>
        </div>

        {/* ── Leads Assigned (with Priority + Calls + Follow-up) ── */}
        <div className="bo-table-wrap">
          <div className="bo-table-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>LEADS ASSIGNED</span>
            <span style={{ fontSize: '9px', color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>Priority · Calls · Follow-up from BO activity</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th><th>Phone</th><th>Num. Status</th><th>Lead Status</th>
                <th>Priority</th><th>Calls</th><th>Follow-up</th><th>Loan Req.</th>
              </tr>
            </thead>
            <tbody>
              {boLeads.slice(0, 10).map(l => {
                const fuDate = l.followUpDate || '';
                const isOverdue = fuDate && fuDate < todayDate;
                const isDueToday = fuDate === todayDate;
                return (
                  <tr key={l.id}>
                    <td className="primary">{l.clientName}</td>
                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{l.phoneNumber}</td>
                    <td>{statusBadge(l.numberStatus)}</td>
                    <td>{statusBadge(l.leadStatus)}</td>
                    <td>
                      {l.priority
                        ? <span style={{
                          fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '5px',
                          fontFamily: "'JetBrains Mono', monospace",
                          background: l.priority === 'Hot' ? 'rgba(255,71,87,0.12)' : l.priority === 'Warm' ? 'rgba(245,158,11,0.12)' : 'rgba(61,127,255,0.12)',
                          color: l.priority === 'Hot' ? '#ff4757' : l.priority === 'Warm' ? '#f59e0b' : 'var(--accent)',
                        }}>{l.priority}</span>
                        : <span style={{ color: 'var(--text3)', fontSize: '10px' }}>—</span>}
                    </td>
                    <td>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700,
                        color: (l.callCount || 0) === 0 ? 'var(--danger)' : (l.callCount || 0) >= 3 ? 'var(--warning)' : 'var(--accent)'
                      }}>
                        {l.callCount || 0}
                      </span>
                    </td>
                    <td>
                      {fuDate
                        ? <span style={{
                          fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                          color: isOverdue ? '#ff4757' : isDueToday ? '#f59e0b' : '#00d4aa'
                        }}>
                          {isOverdue ? '⚠ ' : isDueToday ? '● ' : ''}{fuDate}
                        </span>
                        : <span style={{ color: 'var(--text3)', fontSize: '10px' }}>—</span>}
                    </td>
                    <td style={{ color: '#3d7fff', fontWeight: 600 }}>₹{l.loanRequirement}</td>
                  </tr>
                );
              })}
              {boLeads.length === 0 && <tr><td colSpan={8} className="empty-row">no leads assigned</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const isDark = theme === 'dark';

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

        /* ── THEME VARIABLES ── */
        .cc-root.dark {
          --bg: #07080f;
          --bg2: #0d0f1a;
          --bg3: #12152a;
          --surface: #161929;
          --surface2: #1c2038;
          --border: rgba(255,255,255,0.06);
          --border2: rgba(255,255,255,0.1);
          --accent: #3d7fff;
          --success: #00d4aa;
          --warning: #f59e0b;
          --danger: #ff4757;
          --purple: #a78bfa;
          --orange: #ff6b35;
          --text: #e8eaf6;
          --text2: #8892b0;
          --text3: #4a5568;
          --toggle-bg: #1c2038;
          --toggle-border: rgba(255,255,255,0.1);
        }

        .cc-root.light {
          --bg: #f8f9fc;
          --bg2: #ffffff;
          --bg3: #f1f3f8;
          --surface: #ffffff;
          --surface2: #eef0f7;
          --border: rgba(0,0,0,0.08);
          --border2: rgba(0,0,0,0.13);
          --accent: #2563eb;
          --success: #059669;
          --warning: #d97706;
          --danger: #dc2626;
          --purple: #7c3aed;
          --orange: #ea580c;
          --text: #111827;
          --text2: #4b5563;
          --text3: #9ca3af;
          --toggle-bg: #e5e7eb;
          --toggle-border: rgba(0,0,0,0.1);
        }

        .cc-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          position: relative;
          transition: background 0.25s, color 0.25s;
        }
        .cc-root::before {
          content: '';
          position: fixed; top: -50%; left: -50%;
          width: 200%; height: 200%;
          background:
            radial-gradient(ellipse 600px 400px at 20% 30%, rgba(61,127,255,0.04), transparent),
            radial-gradient(ellipse 500px 500px at 80% 70%, rgba(0,212,170,0.03), transparent);
          pointer-events: none; z-index: 0;
        }

        /* LAYOUT */
        .cc-layout { display: flex; min-height: 100vh; position: relative; z-index: 1; }

        /* SIDEBAR */
        .cc-sidebar {
          width: 240px; flex-shrink: 0;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh;
          overflow: hidden;
          transition: background 0.25s, border-color 0.25s;
        }
        .cc-sidebar::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
        }
        .cc-logo-area { padding: 28px 24px 20px; border-bottom: 1px solid var(--border); }
        .cc-logo-tag { font-size: 9px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); font-family: 'JetBrains Mono', monospace; margin-bottom: 8px; }
        .cc-logo-name { font-size: 20px; font-weight: 800; color: var(--text); line-height: 1.2; }
        .cc-user-chip { margin: 16px 24px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 10px; }
        .cc-user-avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, var(--accent), var(--purple)); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .cc-user-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .cc-user-role { font-size: 10px; color: var(--accent); font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
        .cc-nav-section { padding: 8px 16px; margin-top: 4px; }
        .cc-nav-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; color: var(--text3); text-transform: uppercase; font-family: 'JetBrains Mono', monospace; padding: 0 8px; margin-bottom: 6px; }
        .cc-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 10px; cursor: pointer; transition: all 0.2s; font-size: 13px; font-weight: 500; color: var(--text2); position: relative; margin-bottom: 2px; }
        .cc-nav-item:hover { background: var(--surface2); color: var(--text); }
        .cc-nav-item.active { background: var(--surface2); color: var(--accent); }
        .cc-nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 60%; background: var(--accent); border-radius: 0 3px 3px 0; }
        .cc-nav-icon { width: 16px; height: 16px; opacity: 0.7; display: flex; align-items: center; justify-content: center; }
        .cc-nav-item.active .cc-nav-icon { opacity: 1; }
        .cc-nav-badge { margin-left: auto; font-size: 10px; font-weight: 700; background: var(--danger); color: #fff; padding: 1px 7px; border-radius: 10px; font-family: 'JetBrains Mono', monospace; }
        .cc-nav-badge.info { background: var(--accent); }
        .cc-sidebar-footer { margin-top: auto; padding: 16px 24px; border-top: 1px solid var(--border); font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
        .cc-status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); margin-right: 6px; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }

        /* THEME TOGGLE */
        .theme-toggle {
          display: flex; align-items: center; gap: 8px;
          background: var(--toggle-bg);
          border: 1px solid var(--toggle-border);
          border-radius: 20px;
          padding: 4px;
          margin-bottom: 12px;
          cursor: pointer;
        }
        .toggle-option {
          display: flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 14px;
          font-size: 11px; font-weight: 600;
          color: var(--text3);
          transition: all 0.2s;
          font-family: 'JetBrains Mono', monospace;
          letter-spacing: 0.5px;
        }
        .toggle-option.active {
          background: var(--surface);
          color: var(--text);
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .cc-root.light .toggle-option.active {
          box-shadow: 0 1px 4px rgba(0,0,0,0.12);
        }

        /* MAIN */
        .cc-main { flex: 1; overflow: auto; padding: 32px 32px 60px; }
        .cc-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .cc-page-title { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: var(--text); }
        .cc-page-sub { font-size: 11px; color: var(--text2); margin-top: 3px; font-family: 'JetBrains Mono', monospace; }
        .cc-topbar-right { display: flex; align-items: center; gap: 12px; }
        .cc-clock { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text2); background: var(--surface); border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px; }
        .cc-alert-btn { background: var(--surface); border: 1px solid rgba(255,71,87,0.27); color: var(--danger); padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }

        /* DATE FILTER */
        .cc-date-filter { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 24px; }
        .cc-date-input { background: var(--surface); border: 1px solid var(--border2); border-radius: 8px; padding: 7px 12px; color: var(--text); font-size: 12px; font-family: 'JetBrains Mono', monospace; outline: none; }
        .cc-date-input:focus { border-color: var(--accent); }
        .cc-clear-btn { font-size: 11px; color: var(--text3); cursor: pointer; font-family: 'JetBrains Mono', monospace; padding: 7px 12px; border: 1px solid var(--border); border-radius: 8px; background: transparent; transition: all 0.15s; }
        .date-label { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

        /* ALERT STRIP */
        .cc-alert-strip { background: rgba(255,107,53,0.05); border: 1px solid rgba(255,107,53,0.2); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; position: relative; overflow: hidden; }
        .cc-alert-strip::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--orange); }
        .cc-alert-text { font-size: 12px; color: var(--text); flex: 1; }
        .cc-alert-text strong { color: var(--orange); }
        .cc-alert-review { font-size: 10px; color: var(--accent); cursor: pointer; font-family: 'JetBrains Mono', monospace; }

        /* KPI CARDS */
        .cc-kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 28px; }
        .cc-kpi { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 22px 20px; position: relative; overflow: hidden; transition: transform 0.2s, border-color 0.2s, background 0.25s; cursor: default; }
        .cc-kpi:hover { transform: translateY(-2px); }
        .cc-kpi.blue:hover { border-color: rgba(61,127,255,0.33); }
        .cc-kpi.green:hover { border-color: rgba(0,212,170,0.33); }
        .cc-kpi.orange:hover { border-color: rgba(245,158,11,0.33); }
        .cc-kpi.purple:hover { border-color: rgba(167,139,250,0.33); }
        .cc-kpi-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; }
        .cc-kpi-value { font-size: 42px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
        .cc-kpi.blue .cc-kpi-value { color: var(--accent); }
        .cc-kpi.green .cc-kpi-value { color: var(--success); }
        .cc-kpi.orange .cc-kpi-value { color: var(--warning); }
        .cc-kpi.purple .cc-kpi-value { color: var(--purple); }
        .cc-kpi-sub { font-size: 11px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
        .cc-kpi-bar-wrap { display: flex; align-items: flex-end; gap: 3px; height: 28px; margin-top: 12px; }
        .cc-kpi-bar { flex: 1; border-radius: 2px; min-height: 3px; opacity: 0.5; }

        /* GLASS CARD */
        .glass-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 20px; transition: background 0.25s, border-color 0.25s; }
        .card-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 12px; border-bottom: 1px solid var(--border); }
        .card-title { font-size: 13px; font-weight: 700; color: var(--text); letter-spacing: 0.3px; }
        .card-sub { font-size: 10px; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
        .card-body { padding: 16px 20px; }

        /* OVERVIEW GRID */
        .overview-two-col { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 20px; margin-bottom: 20px; }

        /* TIMELINE */
        .tl-item { display: flex; gap: 14px; margin-bottom: 12px; }
        .tl-item:last-child { margin-bottom: 0; }
        .tl-left { display: flex; flex-direction: column; align-items: center; width: 40px; flex-shrink: 0; }
        .tl-time { font-size: 10px; font-family: 'JetBrains Mono', monospace; color: var(--accent); font-weight: 500; }
        .tl-line { flex: 1; width: 1px; background: var(--border); margin-top: 4px; }
        .tl-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
        .tl-content { flex: 1; background: var(--bg3); border-radius: 10px; padding: 9px 12px; border: 1px solid var(--border); }
        .tl-client { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 3px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .tl-meta { font-size: 10px; color: var(--text2); font-family: 'JetBrains Mono', monospace; }

        /* FUNNEL */
        .funnel-row { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
        .funnel-label { font-size: 11px; color: var(--text2); width: 90px; flex-shrink: 0; font-family: 'JetBrains Mono', monospace; }
        .funnel-bar-bg { flex: 1; background: var(--bg3); border-radius: 3px; height: 5px; overflow: hidden; }
        .funnel-bar-fill { height: 100%; border-radius: 3px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
        .funnel-count { font-size: 11px; font-weight: 600; min-width: 24px; text-align: right; font-family: 'JetBrains Mono', monospace; }

        /* BDM SLOTS */
        .slot-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 14px; }
        .slot-chip { font-size: 10px; padding: 5px 4px; border-radius: 6px; text-align: center; font-family: 'JetBrains Mono', monospace; }
        .slot-free { background: rgba(0,212,170,0.08); color: var(--success); border: 1px solid rgba(0,212,170,0.2); }
        .slot-booked { background: rgba(255,71,87,0.08); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
        .slot-legend { display: flex; gap: 12px; font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; margin-top: 8px; }

        /* BO CHIPS */
        .bo-tab-row { display: flex; gap: 8px; padding: 16px 20px; border-bottom: 1px solid var(--border); overflow-x: auto; }
        .bo-chip { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--border2); cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; }
        .bo-chip:hover { border-color: rgba(61,127,255,0.27); background: var(--surface2); }
        .bo-chip.active { border-color: var(--accent); background: rgba(61,127,255,0.07); }
        .bo-chip-ava { width: 26px; height: 26px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: rgba(61,127,255,0.13); color: var(--accent); }
        .bo-chip-name { font-size: 12px; font-weight: 600; color: var(--text); }

        /* BO DETAIL */
        .bo-header { display: flex; align-items: center; gap: 16px; padding: 20px; border-bottom: 1px solid var(--border); }
        .bo-avatar { width: 48px; height: 48px; border-radius: 12px; background: rgba(61,127,255,0.13); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: var(--accent); flex-shrink: 0; }
        .bo-name { font-size: 15px; font-weight: 700; color: var(--text); }
        .bo-role { font-size: 10px; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
        .health-label { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; line-height: 1.5; }
        .bo-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--border); }
        .bo-kpi { background: var(--bg3); border-radius: 10px; padding: 12px; border: 1px solid var(--border); }
        .bo-kpi-val { font-size: 20px; font-weight: 700; line-height: 1; margin-bottom: 3px; }
        .bo-kpi-label { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
        .bo-two-col { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 14px; padding: 16px 20px; border-bottom: 1px solid var(--border); }
        .bo-panel { background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
        .panel-section-label { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px; margin-bottom: 12px; }
        .bo-table-wrap { margin: 0 20px; background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
        .bo-table-wrap + .bo-table-wrap { margin-top: 12px; }
        .bo-table-wrap:last-child { margin-bottom: 20px; }
        .bo-table-header { padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px; }

        /* DATA TABLE */
        .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .data-table th { padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); font-family: 'JetBrains Mono', monospace; border-bottom: 1px solid var(--border); }
        .data-table td { padding: 11px 12px; border-bottom: 1px solid var(--border); color: var(--text2); vertical-align: middle; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tbody tr { transition: background 0.15s; }
        .data-table tbody tr:hover { background: var(--surface2); }
        .data-table td.primary { color: var(--text); font-weight: 600; }
        .empty-row { text-align: center; color: var(--text3); padding: 16px; font-size: 11px; font-family: 'JetBrains Mono', monospace; }
        .product-chip { font-size: 10px; background: var(--surface2); color: var(--text2); padding: 2px 8px; border-radius: 5px; font-family: 'JetBrains Mono', monospace; }

        /* BADGES */
        .badge { display: inline-flex; align-items: center; font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 6px; letter-spacing: 0.5px; font-family: 'JetBrains Mono', monospace; }
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
        .badge-reschedule { background: rgba(255,107,53,0.1); color: var(--orange); border: 1px solid rgba(255,107,53,0.2); }

        /* ACTION BUTTONS */
        .action-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600; padding: 5px 12px; border-radius: 7px; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; font-family: 'JetBrains Mono', monospace; }
        .btn-approve { background: rgba(0,212,170,0.1); color: var(--success); border-color: rgba(0,212,170,0.2); }
        .btn-approve:hover { background: rgba(0,212,170,0.17); border-color: var(--success); }
        .btn-reject { background: rgba(255,71,87,0.1); color: var(--danger); border-color: rgba(255,71,87,0.2); }
        .btn-reject:hover { background: rgba(255,71,87,0.17); border-color: var(--danger); }

        /* SCHEDULE FORM */
        .sched-form { padding: 0; }
        .sched-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
        .field-label { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px; margin-bottom: 6px; }
        .cc-select, .cc-input { width: 100%; background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px; padding: 8px 10px; color: var(--text); font-size: 12px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.15s; }
        .cc-select:focus, .cc-input:focus { border-color: var(--accent); }
        .cc-input::placeholder { color: var(--text3); }
        .cc-btn { display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: 10px; padding: 10px 22px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .cc-btn-blue { background: var(--accent); color: #fff; }
        .cc-btn-blue:hover { opacity: 0.88; }
        .cc-btn-orange { background: var(--orange); color: #fff; }
        .cc-btn-orange:hover { opacity: 0.88; }

        /* RESCHEDULE CARD */
        .reschedule-wrap { background: rgba(255,107,53,0.05); border: 1px solid rgba(255,107,53,0.2); border-radius: 14px; padding: 18px; margin-bottom: 14px; }
        .reschedule-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }

        /* ANIMATIONS */
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .fade-in { animation: fadeInUp 0.3s ease forwards; }

        /* SCROLLBAR */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
      `}</style>

      <div className={`cc-root ${theme}`}>
        <div className="cc-layout">

          {/* ── SIDEBAR ── */}
          <aside className="cc-sidebar">
            <div className="cc-logo-area">
              <div className="cc-logo-tag">CRM · TC Portal</div>
              <div className="cc-logo-name">Command<br />Center</div>
            </div>
            <div className="cc-user-chip">
              <div className="cc-user-avatar">{currentUser?.name?.[0] ?? 'T'}</div>
              <div>
                <div className="cc-user-name">{currentUser?.name || 'Team Coord.'}</div>
                <div className="cc-user-role">TEAM COORD.</div>
              </div>
            </div>
            <div className="cc-nav-section">
              <div className="cc-nav-label">Overview</div>
              <div className={`cc-nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                <div className="cc-nav-icon">{Icons.dashboard}</div>Dashboard
              </div>
              <div className={`cc-nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
                <div className="cc-nav-icon">{Icons.team}</div>Team Performance
              </div>
            </div>
            <div className="cc-nav-section">
              <div className="cc-nav-label">Actions</div>
              <div className={`cc-nav-item ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                <div className="cc-nav-icon">{Icons.requests}</div>Meeting Requests
                {pendingRequests.length > 0 && <span className="cc-nav-badge">{pendingRequests.length}</span>}
              </div>
              <div className={`cc-nav-item ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
                <div className="cc-nav-icon">{Icons.calendar}</div>Schedule
                {(rescheduleRequests.length + approvedPending.length) > 0 && (
                  <span className="cc-nav-badge info">{rescheduleRequests.length + approvedPending.length}</span>
                )}
              </div>
              <div className={`cc-nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                <div className="cc-nav-icon">{Icons.clock}</div>History
              </div>
            </div>
            <div className="cc-sidebar-footer">
              <div style={{ marginBottom: '12px' }}>
                <span className="cc-status-dot" />Live · {myTeam?.name || 'My Team'}<br />
                <span style={{ color: 'var(--text3)', marginTop: '4px', display: 'block' }}>{myBOs.length} BOs · {allTeamLeads.length} active leads</span>
              </div>

              {/* ── Theme Toggle ── */}
              <div className="theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                <div className={`toggle-option ${isDark ? 'active' : ''}`}>
                  {Icons.moon} Dark
                </div>
                <div className={`toggle-option ${!isDark ? 'active' : ''}`}>
                  {Icons.sun} Light
                </div>
              </div>

              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                  padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                  color: 'var(--text2)', cursor: 'pointer', background: 'var(--surface)',
                  border: '1px solid var(--border)', transition: 'all 0.2s', fontFamily: 'inherit'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
              >
                {Icons.logout} Sign Out
              </button>
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main className="cc-main">

            {/* ════════════════ OVERVIEW TAB ════════════════ */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <div className="cc-topbar">
                  <div>
                    <div className="cc-page-title">Good morning, {currentUser?.name?.split(' ')[0] || 'TC'}</div>
                    <div className="cc-page-sub">// {myTeam?.name || 'My Team'} · {myBOs.length} BOs · {allTeamLeads.length} leads active</div>
                  </div>
                  <div className="cc-topbar-right">
                    <div className="cc-clock">{clock}</div>
                    {pendingRequests.length > 0 && (
                      <button className="cc-alert-btn" onClick={() => setActiveTab('requests')}>
                        {Icons.bell} {pendingRequests.length} Pending
                      </button>
                    )}
                  </div>
                </div>

                {pendingRequests.length > 0 && (
                  <div className="cc-alert-strip">
                    <span style={{ fontSize: '16px' }}>⚡</span>
                    <div className="cc-alert-text">
                      <strong>{pendingRequests.length} meeting request{pendingRequests.length > 1 ? 's' : ''}</strong> waiting for your approval — review before end of day.
                    </div>
                    <span className="cc-alert-review" onClick={() => setActiveTab('requests')}>Review now →</span>
                  </div>
                )}

                {/* KPI Cards */}
                <div className="cc-kpi-row">
                  {[
                    { label: 'Total Meetings', value: totalMeetings, cls: 'blue', sub: 'in selected range', bars: [4, 6, 5, 7, 6, 8, 7, totalMeetings], barColor: '#3d7fff' },
                    { label: 'Converted', value: convertedCount, cls: 'green', sub: `${totalMeetings ? Math.round(convertedCount / totalMeetings * 100) : 0}% conv. rate`, bars: [1, 2, 2, 3, 2, 3, 3, convertedCount], barColor: '#00d4aa' },
                    { label: 'Pending', value: pendingCount, cls: 'orange', sub: 'needs follow-up', bars: [3, 4, 3, 5, 3, 4, 4, pendingCount], barColor: '#f59e0b' },
                    { label: 'Active Leads', value: allTeamLeads.length, cls: 'purple', sub: `across ${myBOs.length} officers`, bars: [30, 32, 35, 38, 40, 42, 44, allTeamLeads.length], barColor: '#a78bfa' },
                  ].map(k => {
                    const max = Math.max(...k.bars) || 1;
                    return (
                      <div key={k.label} className={`cc-kpi ${k.cls}`}>
                        <div className="cc-kpi-label">{k.label}</div>
                        <div className="cc-kpi-value">{k.value}</div>
                        <div className="cc-kpi-sub">{k.sub}</div>
                        <div className="cc-kpi-bar-wrap">
                          {k.bars.map((v, i) => (
                            <div key={i} className="cc-kpi-bar" style={{ height: `${Math.max(3, Math.round((v / max) * 26))}px`, background: k.barColor }} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="overview-two-col">
                  {/* Today's Timeline */}
                  <div className="glass-card">
                    <div className="card-header">
                      <div>
                        <div className="card-title">Today's meeting timeline</div>
                        <div className="card-sub">// {todayStr} · {todayMeetings.filter(m => m.tcId === currentUser?.id).length} scheduled</div>
                      </div>
                    </div>
                    <div className="card-body">
                      {todayMeetings.filter(m => m.tcId === currentUser?.id).length === 0 && (
                        <div className="empty-row" style={{ padding: '24px 0' }}>No meetings scheduled today</div>
                      )}
                      {todayMeetings.filter(m => m.tcId === currentUser?.id).map((m, i, arr) => {
                        const lead = leads.find(l => l.id === m.leadId);
                        const bdm = users.find(u => u.id === m.bdmId);
                        const dotColor = { 'Converted': '#00d4aa', 'Meeting Done': '#3d7fff', 'Follow-Up': '#a78bfa', 'Not Done': '#ff4757', 'Scheduled': '#f59e0b' }[m.status] || '#8892b0';
                        return (
                          <div key={m.id} className="tl-item">
                            <div className="tl-left">
                              <div className="tl-time">{m.timeSlot}</div>
                              {i < arr.length - 1 && <div className="tl-line" />}
                            </div>
                            <div className="tl-dot" style={{ background: dotColor }} />
                            <div className="tl-content">
                              <div className="tl-client">
                                {m.clientName || lead?.clientName}
                                {statusBadge(m.status)}
                              </div>
                              <div className="tl-meta">BDM: {bdm?.name} · {m.meetingType} · {m.productType || '—'} · ₹{lead?.loanRequirement}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    {/* BDM Slots */}
                    <div className="glass-card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">BDM availability</div>
                          <div className="card-sub">// today's free slots</div>
                        </div>
                      </div>
                      <div className="card-body" style={{ paddingTop: '12px' }}>
                        {bdms.map(bdm => {
                          const bookedSlots = todayMeetings.filter(m => m.bdmId === bdm.id).map(m => m.timeSlot);
                          return (
                            <div key={bdm.id} style={{ marginBottom: '14px' }}>
                              <div style={{ fontSize: '10px', color: 'var(--text2)', fontFamily: "'JetBrains Mono', monospace", marginBottom: '8px' }}>{bdm.name.toUpperCase()} (BDM)</div>
                              <div className="slot-grid">
                                {TIME_SLOTS.slice(0, 21).map(slot => (
                                  <div key={slot} className={`slot-chip ${bookedSlots.includes(slot) ? 'slot-booked' : 'slot-free'}`}>{slot}</div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {bdms.length === 0 && <div className="empty-row">No BDMs assigned</div>}
                        <div className="slot-legend">
                          <span style={{ color: 'var(--success)' }}>■</span> Free &nbsp;&nbsp;
                          <span style={{ color: 'var(--danger)' }}>■</span> Booked
                        </div>
                      </div>
                    </div>

                    {/* Lead Funnel */}
                    <div className="glass-card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">Lead funnel</div>
                          <div className="card-sub">// team aggregate · all time</div>
                        </div>
                      </div>
                      <div className="card-body" style={{ paddingTop: '12px' }}>
                        <FunnelRow label="Total leads" val={allTeamLeads.length} total={allTeamLeads.length} color="#3d7fff" />
                        <FunnelRow label="Connected" val={allTeamLeads.filter(l => l.numberStatus === 'Connected').length} total={allTeamLeads.length} color="#00d4aa" />
                        <FunnelRow label="Interested" val={allTeamLeads.filter(l => l.leadStatus === 'Interested').length} total={allTeamLeads.length} color="#a78bfa" />
                        <FunnelRow label="Meetings" val={teamMeetings.length} total={allTeamLeads.length} color="#f59e0b" />
                        <FunnelRow label="Converted" val={convertedCount} total={allTeamLeads.length} color="#00d4aa" />
                      </div>
                    </div>
                  </div>
                </div>

                {stateMap.length > 0 && (
                  <div className="glass-card">
                    <div className="card-header">
                      <div>
                        <div className="card-title">State-wise distribution</div>
                        <div className="card-sub">// regional meeting data</div>
                      </div>
                    </div>
                    <table className="data-table">
                      <thead><tr><th>State</th><th>Meetings</th><th>Pending</th><th>Rejected</th><th>Top Product</th></tr></thead>
                      <tbody>
                        {stateMap.map(row => (
                          <tr key={row.state}>
                            <td className="primary">{row.state}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{row.total}</td>
                            <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{row.pending}</td>
                            <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{row.rejected}</td>
                            <td><span className="product-chip">{row.topProduct}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ TEAM TAB ════════════════ */}
            {activeTab === 'team' && (
              <div className="fade-in">
                <div className="cc-topbar">
                  <div>
                    <div className="cc-page-title">Team performance</div>
                    <div className="cc-page-sub">// {myTeam?.name || 'My Team'} · per BO deep dive</div>
                  </div>
                </div>

                <div className="glass-card" style={{ marginBottom: '20px' }}>
                  <div className="card-header">
                    <div className="card-title">Lead overview</div>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        {['BO Name', 'Leads', 'Connected', 'Not Connected', 'Interested', 'Not Interested', 'Eligible', 'Meetings', 'Conv. Rate'].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myBOs.map(boId => {
                        const bo = users.find(u => u.id === boId);
                        const boLeads = leads.filter(l => l.assignedBOId === boId);
                        const boMeetings = meetings.filter(m => m.boId === boId);
                        const converted = boMeetings.filter(m => m.status === 'Converted').length;
                        const convRate = boMeetings.length ? Math.round(converted / boMeetings.length * 100) : 0;
                        return (
                          <tr key={boId} style={{ cursor: 'pointer' }} onClick={() => { setSelectedBOId(boId); }}>
                            <td className="primary">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(61,127,255,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                                  {bo?.name?.[0] ?? '?'}
                                </div>
                                {bo?.name}
                              </div>
                            </td>
                            <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{boLeads.length}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 600 }}>{boLeads.filter(l => l.numberStatus === 'Connected').length}</td>
                            <td style={{ color: 'var(--danger)' }}>{boLeads.filter(l => l.numberStatus === 'Not Connected').length}</td>
                            <td style={{ color: 'var(--text)' }}>{boLeads.filter(l => l.leadStatus === 'Interested').length}</td>
                            <td style={{ color: 'var(--text3)' }}>{boLeads.filter(l => l.leadStatus === 'Not Interested').length}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{boLeads.filter(l => l.leadStatus === 'Eligible').length}</td>
                            <td style={{ color: 'var(--text)' }}>{boMeetings.length}</td>
                            <td style={{ color: convRate >= 50 ? 'var(--success)' : convRate >= 25 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700 }}>{convRate}%</td>
                          </tr>
                        );
                      })}
                      {myBOs.length === 0 && <tr><td colSpan={9} className="empty-row">No Business Officers in your team</td></tr>}
                    </tbody>
                  </table>
                </div>

                {myBOs.length > 0 && (
                  <div className="glass-card">
                    <div className="bo-tab-row">
                      {myBOs.map(boId => {
                        const bo = users.find(u => u.id === boId);
                        const isSelected = selectedBOId === boId || (!selectedBOId && boId === myBOs[0]);
                        return (
                          <div key={boId} className={`bo-chip ${isSelected ? 'active' : ''}`} onClick={() => setSelectedBOId(boId)}>
                            <div className="bo-chip-ava">{bo?.name?.[0] ?? '?'}</div>
                            <div className="bo-chip-name">{bo?.name}</div>
                          </div>
                        );
                      })}
                    </div>
                    {renderBODetail(selectedBOId || myBOs[0])}
                  </div>
                )}
              </div>
            )}

            {/* ════════════════ REQUESTS TAB ════════════════ */}
            {activeTab === 'requests' && (
              <div className="fade-in">
                <div className="cc-topbar">
                  <div>
                    <div className="cc-page-title">Meeting requests</div>
                    <div className="cc-page-sub">// {pendingRequests.length} pending · review and approve</div>
                  </div>
                </div>
                <div className="glass-card">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Client</th><th>Phone</th><th>Loan Req.</th><th>BO</th>
                        <th>Lead Status</th><th>Status</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meetingRequests.filter(mr => mr.tcId === currentUser?.id).map(req => {
                        const lead = leads.find(l => l.id === req.leadId);
                        const bo = users.find(u => u.id === req.boId);
                        return (
                          <tr key={req.id}>
                            <td className="primary">{lead?.clientName}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{lead?.phoneNumber}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{lead?.loanRequirement}</td>
                            <td>{bo?.name}</td>
                            <td>{statusBadge(lead?.leadStatus || 'Pending')}</td>
                            <td>{statusBadge(req.status)}</td>
                            <td>
                              {req.status === 'Pending' && (
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button className="action-btn btn-approve" onClick={() => approveRequest(req.id)}>{Icons.check} Approve</button>
                                  <button className="action-btn btn-reject" onClick={() => rejectRequest(req.id)}>{Icons.x} Reject</button>
                                </div>
                              )}
                              {req.status !== 'Pending' && <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                      {meetingRequests.filter(mr => mr.tcId === currentUser?.id).length === 0 && (
                        <tr><td colSpan={7} className="empty-row">No meeting requests</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════════════════ SCHEDULE TAB ════════════════ */}
            {activeTab === 'schedule' && (
              <div className="fade-in">
                <div className="cc-topbar">
                  <div>
                    <div className="cc-page-title">Schedule meetings</div>
                    <div className="cc-page-sub">// assign BDM + slot · reschedules</div>
                  </div>
                </div>

                {rescheduleRequests.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ color: 'var(--orange)' }}>{Icons.refresh}</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--orange)' }}>Reschedule Requests ({rescheduleRequests.length})</span>
                    </div>
                    {rescheduleRequests.map(m => {
                      const lead = leads.find(l => l.id === m.leadId);
                      const bo = users.find(u => u.id === m.boId);
                      return (
                        <div key={m.id} className="reschedule-wrap">
                          <div className="reschedule-header">
                            {statusBadge('Reschedule Requested')}
                            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{m.clientName || lead?.clientName}</span>
                            <span style={{ color: 'var(--text2)', fontSize: '13px' }}>— ₹{lead?.loanRequirement}</span>
                            <span style={{ color: 'var(--text3)', fontSize: '11px' }}>(BO: {bo?.name})</span>
                            <span style={{ color: 'var(--text3)', fontSize: '11px' }}>· Prev: {m.date} {m.timeSlot}</span>
                          </div>
                          {renderScheduleForm(m.id, () => rescheduleExistingMeeting(m.id), 'Confirm Reschedule', true, m.id)}
                        </div>
                      );
                    })}
                  </div>
                )}

                {approvedPending.map(req => {
                  const lead = leads.find(l => l.id === req.leadId);
                  if (!lead) return null;
                  const bo = users.find(u => u.id === req.boId);
                  return (
                    <div key={req.id} className="glass-card">
                      <div className="card-header">
                        <div>
                          <div className="card-title">{lead.clientName} — ₹{lead.loanRequirement}</div>
                          <div className="card-sub">// BO: {bo?.name} · Approved</div>
                        </div>
                        {statusBadge('Approved')}
                      </div>
                      <div className="card-body">
                        {renderScheduleForm(req.id, () => scheduleMeeting(req.id, lead.id, req.boId), 'Confirm Schedule')}
                      </div>
                    </div>
                  );
                })}

                {rescheduleRequests.length === 0 && approvedPending.length === 0 && (
                  <div className="glass-card">
                    <div className="card-body" style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                      no pending scheduling required
                    </div>
                  </div>
                )}

                <div className="glass-card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Today's scheduled meetings</div>
                      <div className="card-sub">// {todayStr}</div>
                    </div>
                  </div>
                  <table className="data-table">
                    <thead><tr><th>Time</th><th>Client</th><th>BDM</th><th>Type</th><th>Status</th></tr></thead>
                    <tbody>
                      {todayMeetings.filter(m => m.tcId === currentUser?.id).map(m => {
                        const lead = leads.find(l => l.id === m.leadId);
                        const bdm = users.find(u => u.id === m.bdmId);
                        return (
                          <tr key={m.id}>
                            <td style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{m.timeSlot}</td>
                            <td className="primary">{m.clientName || lead?.clientName}</td>
                            <td>{bdm?.name}</td>
                            <td><span className="product-chip">{m.meetingType}</span></td>
                            <td>{statusBadge(m.status)}</td>
                          </tr>
                        );
                      })}
                      {todayMeetings.filter(m => m.tcId === currentUser?.id).length === 0 && (
                        <tr><td colSpan={5} className="empty-row">No meetings scheduled today</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════════════════ HISTORY TAB ════════════════ */}
            {activeTab === 'history' && (
              <div className="fade-in">
                <div className="cc-topbar">
                  <div>
                    <div className="cc-page-title">Meeting history</div>
                    <div className="cc-page-sub">// date-wise summary · all meetings</div>
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
                    <div className="card-title">
                      Summary <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({teamMeetings.length} meetings)</span>
                    </div>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th><th>Total</th><th>Done</th><th>Not Done</th>
                        <th>Converted</th><th>Follow-Up</th><th>Rescheduled</th><th>Conv. Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meetingsByDate.slice().reverse().map(([date, count]) => {
                        const dm = teamMeetings.filter(m => m.date === date);
                        const conv = dm.filter(m => m.status === 'Converted').length;
                        const convRate = count ? Math.round(conv / count * 100) : 0;
                        return (
                          <tr key={date}>
                            <td className="primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{date}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{count}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                              {dm.filter(m => ['Meeting Done', 'Converted', 'Follow-Up'].includes(m.status)).length}
                            </td>
                            <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{dm.filter(m => m.status === 'Not Done').length}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 600 }}>{conv}</td>
                            <td style={{ color: 'var(--purple)', fontWeight: 600 }}>{dm.filter(m => m.status === 'Follow-Up').length}</td>
                            <td style={{ color: 'var(--orange)', fontWeight: 600 }}>{dm.filter(m => m.status === 'Reschedule Requested').length}</td>
                            <td>
                              <span className={`badge ${convRate >= 60 ? 'badge-converted' : convRate >= 35 ? 'badge-done' : 'badge-pending'}`}>
                                {convRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {meetingsByDate.length === 0 && (
                        <tr><td colSpan={8} className="empty-row">No meetings found</td></tr>
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