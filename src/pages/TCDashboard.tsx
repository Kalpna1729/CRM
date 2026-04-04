
// import { useState, useMemo } from 'react';
// import { useCRM } from '@/contexts/CRMContext';
// import DashboardLayout, { LayoutDashboard, Calendar, ClipboardList } from '@/components/DashboardLayout';
// import DateRangeFilter from '@/components/DateRangeFilter';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { toast } from 'sonner';
// import { ProductType } from '@/types/crm';
// import { TIME_SLOTS } from '@/data/mockData';
// import { Check, X, CalendarDays, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// const navItems = [
//   { label: 'Team Performance', icon: <LayoutDashboard className="w-4 h-4" />, id: 'performance' },
//   { label: 'Meeting Requests', icon: <ClipboardList className="w-4 h-4" />, id: 'requests' },
//   { label: 'Schedule Meetings', icon: <Calendar className="w-4 h-4" />, id: 'schedule' },
//   { label: 'Meeting History', icon: <CalendarDays className="w-4 h-4" />, id: 'history' },
// ];

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

// export default function TCDashboard() {
//   const { currentUser, users, leads, teams, meetings, meetingRequests, updateLead, addMeeting, updateMeetingRequest, updateMeeting } = useCRM();
//   const [activeTab, setActiveTab] = useState('performance');
//   const [fromDate, setFromDate] = useState<Date | undefined>();
//   const [toDate, setToDate] = useState<Date | undefined>();
//   const [boSearch, setBoSearch] = useState('');
//   const [forms, setForms] = useState<Record<string, ScheduleForm>>({});

//   const getForm = (id: string): ScheduleForm => forms[id] ?? defaultForm();
//   const setFormField = (id: string, field: keyof ScheduleForm, value: string) =>
//     setForms(prev => ({ ...prev, [id]: { ...(prev[id] ?? defaultForm()), [field]: value } }));
//   const resetForm = (id: string) =>
//     setForms(prev => { const n = { ...prev }; delete n[id]; return n; });

//   const myTeam = teams.find(t => t.tcId === currentUser?.id);
//   const myBOs = myTeam?.boIds || [];
//   const bdms = users.filter(u => u.role === 'BDM' && u.active);
//   const today = new Date().toISOString().split('T')[0];
//   const todayMeetings = meetings.filter(m => m.date === today);

//   const teamMeetings = useMemo(() => {
//     let f = meetings.filter(m => m.tcId === currentUser?.id);
//     if (fromDate) f = f.filter(m => m.date >= fromDate.toISOString().split('T')[0]);
//     if (toDate) f = f.filter(m => m.date <= toDate.toISOString().split('T')[0]);
//     return f;
//   }, [meetings, currentUser, fromDate, toDate]);

//   // Stats
//   const totalMeetings = teamMeetings.length;
//   const pendingCount = teamMeetings.filter(m => m.status === 'Pending' || m.status === 'Scheduled').length;
//   const rejectedCount = teamMeetings.filter(m => m.status === 'Reject' || m.status === 'Not Done').length;
//   const rescheduledCount = teamMeetings.filter(m => m.status === 'Reschedule Requested').length;

//   // Meetings by date for sparkline (last 30 days buckets)
//   const meetingsByDate = useMemo(() => {
//     const map: Record<string, number> = {};
//     teamMeetings.forEach(m => { map[m.date] = (map[m.date] || 0) + 1; });
//     return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-30);
//   }, [teamMeetings]);

//   // Lead status breakdown for donut
//   const allTeamLeads = leads.filter(l => myBOs.includes(l.assignedBOId));
//   const totalLeads = allTeamLeads.length || 1;
//   const interestedLeads = allTeamLeads.filter(l => l.leadStatus === 'Interested').length;
//   const pendingLeads = allTeamLeads.filter(l => l.leadStatus === 'Pending').length;
//   const notInterestedLeads = allTeamLeads.filter(l => l.leadStatus === 'Not Interested').length;
//   const otherLeads = totalLeads - interestedLeads - pendingLeads - notInterestedLeads;

//   const interestedPct = Math.round((interestedLeads / totalLeads) * 100);
//   const pendingPct = Math.round((pendingLeads / totalLeads) * 100);
//   const notIntPct = Math.round((notInterestedLeads / totalLeads) * 100);
//   const otherPct = 100 - interestedPct - pendingPct - notIntPct;

//   // State-wise distribution
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
//     return Object.entries(map)
//       .sort(([, a], [, b]) => b.total - a.total)
//       .slice(0, 8)
//       .map(([state, data]) => ({
//         state,
//         ...data,
//         topProduct: Object.entries(data.products).sort(([, a], [, b]) => b - a)[0]?.[0] || '—',
//       }));
//   }, [teamMeetings]);

//   const pendingRequests = meetingRequests.filter(mr => mr.tcId === currentUser?.id && mr.status === 'Pending');
//   const rescheduleRequests = meetings.filter(m => m.tcId === currentUser?.id && m.status === 'Reschedule Requested');

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
//     const meetingId = `m${Date.now()}`;
//     await addMeeting({
//       id: meetingId, leadId, bdmId: f.bdm, tcId: currentUser!.id, boId,
//       date: today, timeSlot: f.slot, status: 'Scheduled', meetingType: f.meetingType,
//       clientName: f.clientName || undefined, location: f.location || undefined,
//       state: f.state || undefined, productType: f.productType || undefined,
//       finalRequirement: f.finalReq || undefined, collateralValue: f.collateral || undefined,
//     });
//     await updateLead(leadId, { meetingId });
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
//       productType: f.productType || undefined, finalRequirement: f.finalReq || undefined,
//       collateralValue: f.collateral || undefined,
//     });
//     resetForm(meetingId);
//     toast.success('Meeting rescheduled successfully');
//   };

//   const getAvailableSlots = (bdmId: string, excludeId?: string) => {
//     const booked = todayMeetings.filter(m => m.bdmId === bdmId && m.id !== excludeId).map(m => m.timeSlot);
//     return TIME_SLOTS.filter(s => !booked.includes(s));
//   };
//   const getBoLeads = (boId: string) => leads.filter(l => l.assignedBOId === boId);

//   // Sparkline path generator
//   const makeSparkline = (data: number[], w = 100, h = 40) => {
//     if (data.length < 2) return '';
//     const max = Math.max(...data) || 1;
//     const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * (h - 4) - 2}`);
//     return `M${pts.join(' L')}`;
//   };

//   // Donut segment helpers
//   const C = 15.915; // circumference factor
//   const donutSegments = [
//     { pct: interestedPct, color: '#55bdbd', offset: 25 },
//     { pct: pendingPct, color: '#f59e0b', offset: 25 - interestedPct },
//     { pct: notIntPct, color: '#ba1a1a', offset: 25 - interestedPct - pendingPct },
//     { pct: otherPct, color: '#8b5cf6', offset: 25 - interestedPct - pendingPct - notIntPct },
//   ];

//   const renderScheduleForm = (id: string, onSubmit: () => void, submitLabel: string, submitClass?: string, excludeId?: string) => {
//     const f = getForm(id);
//     const slots = f.bdm ? getAvailableSlots(f.bdm, excludeId) : [];
//     return (
//       <div className="space-y-4">
//         <div className="grid md:grid-cols-3 gap-4">
//           <div>
//             <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Select BDM</p>
//             <Select value={f.bdm} onValueChange={v => { setFormField(id, 'bdm', v); setFormField(id, 'slot', ''); }}>
//               <SelectTrigger className="rounded-xl border-outline-variant/30"><SelectValue placeholder="Choose BDM" /></SelectTrigger>
//               <SelectContent>{bdms.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
//             </Select>
//           </div>
//           <div>
//             <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Time Slot</p>
//             <Select value={f.slot} onValueChange={v => setFormField(id, 'slot', v)}>
//               <SelectTrigger className="rounded-xl border-outline-variant/30"><SelectValue placeholder="Choose slot" /></SelectTrigger>
//               <SelectContent>
//                 {slots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
//                 {slots.length === 0 && f.bdm && <SelectItem value="_" disabled>No slots available</SelectItem>}
//               </SelectContent>
//             </Select>
//           </div>
//           <div>
//             <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Meeting Type</p>
//             <Select value={f.meetingType} onValueChange={v => setFormField(id, 'meetingType', v)}>
//               <SelectTrigger className="rounded-xl border-outline-variant/30"><SelectValue /></SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="Virtual">Virtual</SelectItem>
//                 <SelectItem value="Walk-in">Walk-in</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//         </div>
//         <div className="grid md:grid-cols-3 gap-4">
//           <div>
//             <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Client Name</p>
//             <Input className="rounded-xl border-outline-variant/30" placeholder="Enter client name" value={f.clientName} onChange={e => setFormField(id, 'clientName', e.target.value)} />
//           </div>
//           <div>
//             <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Location</p>
//             <Input className="rounded-xl border-outline-variant/30" placeholder="Enter location" value={f.location} onChange={e => setFormField(id, 'location', e.target.value)} />
//           </div>
//           <div>
//             <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">State</p>
//             <Input className="rounded-xl border-outline-variant/30" placeholder="Enter state" value={f.state} onChange={e => setFormField(id, 'state', e.target.value)} />
//           </div>
//         </div>
//         <div className="grid md:grid-cols-3 gap-4">
//           <div>
//             <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Product Type</p>
//             <Select value={f.productType} onValueChange={v => setFormField(id, 'productType', v)}>
//               <SelectTrigger className="rounded-xl border-outline-variant/30"><SelectValue placeholder="Select product" /></SelectTrigger>
//               <SelectContent>
//                 {['Term Loan', 'Equity', 'Term+Equity', 'Unsecure', 'Project Funding'].map(p => (
//                   <SelectItem key={p} value={p}>{p}</SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>
//           <div>
//             <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Final Requirement (₹)</p>
//             <Input className="rounded-xl border-outline-variant/30" placeholder="e.g. 10-15 Lakhs" value={f.finalReq} onChange={e => setFormField(id, 'finalReq', e.target.value)} />
//           </div>
//           <div>
//             <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Collateral Value (₹)</p>
//             <Input className="rounded-xl border-outline-variant/30" placeholder="e.g. 1-2 Cr" value={f.collateral} onChange={e => setFormField(id, 'collateral', e.target.value)} />
//           </div>
//         </div>
//         <Button className={`rounded-xl font-bold px-6 ${submitClass ?? 'bg-blue-600 hover:bg-blue-700 text-white'}`} onClick={onSubmit}>
//           {submitLabel.includes('Reschedule') ? <RefreshCw className="w-4 h-4 mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
//           {submitLabel}
//         </Button>
//       </div>
//     );
//   };

//   return (
//     <DashboardLayout navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>

//       {/* ══════════════════════════════════════
//           PERFORMANCE TAB — Premium UI
//       ══════════════════════════════════════ */}
//       {activeTab === 'performance' && (
//         <div className="space-y-8">

//           {/* Date filter */}
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{myTeam?.name || 'Team Performance'}</h2>
//               <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mt-0.5">Business Officer Overview</p>
//             </div>
//             <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
//           </div>

//           {/* ── KPI Cards ── */}
//           <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//             {[
//               {
//                 label: 'Total Meetings', value: totalMeetings, color: 'text-blue-600', bg: 'bg-blue-50',
//                 bar: 'bg-blue-500', barW: '75%', icon: '📅',
//                 trend: <span className="flex items-center text-[11px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full"><TrendingUp className="w-3 h-3 mr-0.5" />Active</span>
//               },
//               {
//                 label: 'Pending Meetings', value: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50',
//                 bar: 'bg-amber-500', barW: `${totalMeetings ? Math.round((pendingCount / totalMeetings) * 100) : 0}%`, icon: '⏳',
//                 trend: <span className="flex items-center text-[11px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full"><Minus className="w-3 h-3 mr-0.5" />Pending</span>
//               },
//               {
//                 label: 'Rejected / Not Done', value: rejectedCount, color: 'text-red-600', bg: 'bg-red-50',
//                 bar: 'bg-red-500', barW: `${totalMeetings ? Math.round((rejectedCount / totalMeetings) * 100) : 0}%`, icon: '❌',
//                 trend: <span className="flex items-center text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full"><TrendingDown className="w-3 h-3 mr-0.5" />Rejected</span>
//               },
//               {
//                 label: 'Reschedule Requests', value: rescheduledCount, color: 'text-purple-600', bg: 'bg-purple-50',
//                 bar: 'bg-purple-500', barW: `${totalMeetings ? Math.round((rescheduledCount / totalMeetings) * 100) : 0}%`, icon: '🔄',
//                 trend: <span className="flex items-center text-[11px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full"><TrendingUp className="w-3 h-3 mr-0.5" />Pending TC</span>
//               },
//             ].map((kpi) => (
//               <div key={kpi.label} className="bg-white p-6 pt-8 rounded-2xl shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] relative overflow-hidden group border border-slate-100">
//                 <div className={`absolute top-0 right-0 p-4 text-4xl opacity-10 group-hover:scale-110 transition-transform select-none`}>
//                   {kpi.icon}
//                 </div>
//                 <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.12em] mb-2">{kpi.label}</p>
//                 <div className="flex items-end justify-between">
//                   <h2 className={`text-4xl font-extrabold leading-none ${kpi.color}`}>{kpi.value.toLocaleString()}</h2>
//                   {kpi.trend}
//                 </div>
//                 <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
//                   <div className={`h-full ${kpi.bar} rounded-full transition-all`} style={{ width: kpi.barW }}></div>
//                 </div>
//               </div>
//             ))}
//           </section>

//           {/* ── Sparkline Charts ── */}
//           <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {[
//               {
//                 title: 'Total Meetings', subtitle: 'Monthly Trend',
//                 data: meetingsByDate.map(([, v]) => v),
//                 stroke: '#2563eb', grad: 'gradBlue',
//               },
//               {
//                 title: 'Pending Volume', subtitle: 'Backlog Trend',
//                 data: meetingsByDate.map(([date]) => teamMeetings.filter(m => m.date === date && (m.status === 'Pending' || m.status === 'Scheduled')).length),
//                 stroke: '#f59e0b', grad: 'gradAmber',
//               },
//               {
//                 title: 'Reschedule Rate', subtitle: 'Monthly Reschedules',
//                 data: meetingsByDate.map(([date]) => teamMeetings.filter(m => m.date === date && m.status === 'Reschedule Requested').length),
//                 stroke: '#8b5cf6', grad: 'gradPurple',
//               },
//             ].map((chart) => (
//               <div key={chart.title} className="bg-white rounded-3xl p-6 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col">
//                 <div className="flex justify-between items-start mb-4">
//                   <div>
//                     <h3 className="font-extrabold text-base text-slate-800 tracking-tight">{chart.title}</h3>
//                     <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{chart.subtitle}</p>
//                   </div>
//                 </div>
//                 <div className="relative h-28 w-full mt-2">
//                   <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
//                     <defs>
//                       <linearGradient id={chart.grad} x1="0%" y1="0%" x2="0%" y2="100%">
//                         <stop offset="0%" style={{ stopColor: chart.stroke, stopOpacity: 0.3 }} />
//                         <stop offset="100%" style={{ stopColor: chart.stroke, stopOpacity: 0 }} />
//                       </linearGradient>
//                     </defs>
//                     {chart.data.length > 1 && (
//                       <>
//                         <path d={makeSparkline(chart.data)} fill="none" stroke={chart.stroke} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
//                         <path d={`${makeSparkline(chart.data)} L100,40 L0,40 Z`} fill={`url(#${chart.grad})`} />
//                       </>
//                     )}
//                     {chart.data.length === 0 && (
//                       <text x="50" y="22" textAnchor="middle" fill="#cbd5e1" fontSize="5" fontWeight="600">No data</text>
//                     )}
//                   </svg>
//                 </div>
//                 <div className="mt-3 flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
//                   {['1', '5', '10', '15', '20', '25', '30'].map(d => <span key={d}>{d}</span>)}
//                 </div>
//               </div>
//             ))}
//           </section>

//           {/* ── BO Table ── */}
//           <section className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-100">
//             <div className="px-8 py-5 flex justify-between items-center border-b border-slate-100">
//               <div>
//                 <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">Lead Overview</h3>
//                 <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Performance Metrics by Individual Officer</p>
//               </div>
//               <div className="relative">
//                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
//                 <input
//                   className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-56 focus:outline-none focus:ring-2 focus:ring-blue-200 placeholder:text-slate-400"
//                   placeholder="Search by BO name..."
//                   value={boSearch}
//                   onChange={e => setBoSearch(e.target.value)}
//                 />
//               </div>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full text-left border-collapse">
//                 <thead>
//                   <tr className="bg-slate-50/70">
//                     {['BO Name', 'Leads', 'Connected', 'Not Connected', 'Interested', 'Not Interested', 'Eligible', 'Not Eligible', 'Meetings', 'Success Rate'].map(h => (
//                       <th key={h} className="px-5 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-[0.1em] whitespace-nowrap">{h}</th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-slate-100">
//                   {myBOs
//                     .filter(boId => {
//                       const bo = users.find(u => u.id === boId);
//                       return bo?.name.toLowerCase().includes(boSearch.toLowerCase());
//                     })
//                     .map(boId => {
//                       const bo = users.find(u => u.id === boId);
//                       const boLeads = getBoLeads(boId);
//                       const connected = boLeads.filter(l => l.numberStatus === 'Connected');
//                       const boMeetings = meetings.filter(m => m.boId === boId);
//                       const eligible = boLeads.filter(l => l.leadStatus === 'Eligible').length;
//                       const successRate = boLeads.length ? Math.round((eligible / boLeads.length) * 100) : 0;
//                       return (
//                         <tr key={boId} className="hover:bg-slate-50/60 transition-colors group">
//                           <td className="px-5 py-4">
//                             <div className="flex items-center gap-3">
//                               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-extrabold shrink-0">
//                                 {bo?.name?.[0] ?? '?'}
//                               </div>
//                               <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors whitespace-nowrap">{bo?.name}</span>
//                             </div>
//                           </td>
//                           <td className="px-5 py-4 font-extrabold text-sm text-slate-800">{boLeads.length}</td>
//                           <td className="px-5 py-4 text-sm font-bold text-green-600">{connected.length}</td>
//                           <td className="px-5 py-4 text-sm font-medium text-slate-400">{boLeads.filter(l => l.numberStatus === 'Not Connected').length}</td>
//                           <td className="px-5 py-4 text-sm font-bold text-slate-700">{boLeads.filter(l => l.leadStatus === 'Interested').length}</td>
//                           <td className="px-5 py-4 text-sm font-medium text-slate-400">{boLeads.filter(l => l.leadStatus === 'Not Interested').length}</td>
//                           <td className="px-5 py-4 text-sm font-bold text-blue-600">{eligible}</td>
//                           <td className="px-5 py-4 text-sm font-medium text-red-500">{boLeads.filter(l => l.leadStatus === 'Not Eligible').length}</td>
//                           <td className="px-5 py-4 text-sm font-bold text-slate-700">{boMeetings.length}</td>
//                           <td className="px-5 py-4 text-right font-extrabold text-sm text-blue-600">{successRate}%</td>
//                         </tr>
//                       );
//                     })}
//                   {myBOs.length === 0 && (
//                     <tr><td colSpan={10} className="text-center py-10 text-slate-400 text-sm">No Business Officers in your team</td></tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </section>

//           {/* ── Donut + State Table ── */}
//           <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">

//             {/* Lead Status Donut */}
//             <div className="bg-white rounded-3xl p-8 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col xl:flex-row items-center gap-8">
//               <div className="flex-grow w-full">
//                 <h3 className="font-extrabold text-lg text-slate-800 tracking-tight mb-1">Lead Status Breakdown</h3>
//                 <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-6">Distribution by Category</p>
//                 <div className="grid grid-cols-2 gap-3">
//                   {[
//                     { label: `Interested (${interestedPct}%)`, color: '#55bdbd' },
//                     { label: `Pending (${pendingPct}%)`, color: '#f59e0b' },
//                     { label: `Not Interested (${notIntPct}%)`, color: '#ba1a1a' },
//                     { label: `Other (${otherPct}%)`, color: '#8b5cf6' },
//                   ].map(item => (
//                     <div key={item.label} className="flex items-center gap-2">
//                       <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
//                       <span className="text-xs font-bold text-slate-700">{item.label}</span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <div className="relative w-52 h-52 shrink-0">
//                 <svg className="w-full h-full -rotate-90" viewBox="0 0 42 42">
//                   <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
//                   {donutSegments.map((seg, i) => (
//                     <circle
//                       key={i}
//                       cx="21" cy="21" r="15.915"
//                       fill="transparent"
//                       stroke={seg.color}
//                       strokeWidth="8"
//                       strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
//                       strokeDashoffset={-seg.offset + 25}
//                     />
//                   ))}
//                 </svg>
//                 <div className="absolute inset-0 flex flex-col items-center justify-center">
//                   <span className="text-2xl font-extrabold text-slate-800">{allTeamLeads.length.toLocaleString()}</span>
//                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Total Leads</p>
//                 </div>
//               </div>
//             </div>

//             {/* State-wise Table */}
//             <div className="bg-white rounded-3xl overflow-hidden shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-100 flex flex-col">
//               <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100">
//                 <div>
//                   <h3 className="font-extrabold text-lg text-slate-800 tracking-tight">State-wise Distribution</h3>
//                   <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Regional Meeting Data</p>
//                 </div>
//               </div>
//               <div className="overflow-x-auto flex-grow">
//                 <table className="w-full text-left border-collapse">
//                   <thead>
//                     <tr className="bg-slate-50/70">
//                       {['State', 'Meetings', 'Pending', 'Rejected', 'Top Product'].map(h => (
//                         <th key={h} className="px-5 py-3.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">{h}</th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-slate-100">
//                     {stateMap.length === 0 && (
//                       <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No state data available</td></tr>
//                     )}
//                     {stateMap.map(row => (
//                       <tr key={row.state} className="hover:bg-slate-50/60 transition-colors">
//                         <td className="px-5 py-3.5 text-xs font-bold text-slate-800">{row.state}</td>
//                         <td className="px-5 py-3.5 text-xs font-extrabold text-slate-800">{row.total}</td>
//                         <td className="px-5 py-3.5 text-xs font-bold text-amber-600">{row.pending}</td>
//                         <td className="px-5 py-3.5 text-xs font-bold text-red-500">{row.rejected}</td>
//                         <td className="px-5 py-3.5 text-xs font-medium text-slate-500">{row.topProduct}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           </section>
//         </div>
//       )}

//       {/* ══════════════════════════════════════
//           REQUESTS TAB
//       ══════════════════════════════════════ */}
//       {activeTab === 'requests' && (
//         <div className="space-y-6">
//           <div>
//             <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Meeting Requests</h2>
//             <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-0.5">{pendingRequests.length} pending requests</p>
//           </div>
//           <div className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_24px_-4px_rgba(0,0,0,0.06)] border border-slate-100">
//             <Table>
//               <TableHeader>
//                 <TableRow className="bg-slate-50/70">
//                   <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Client</TableHead>
//                   <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Phone</TableHead>
//                   <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Loan Amt</TableHead>
//                   <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">BO</TableHead>
//                   <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Status</TableHead>
//                   <TableHead className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {meetingRequests.filter(mr => mr.tcId === currentUser?.id).map(req => {
//                   const lead = leads.find(l => l.id === req.leadId);
//                   const bo = users.find(u => u.id === req.boId);
//                   return (
//                     <TableRow key={req.id} className="hover:bg-slate-50/50">
//                       <TableCell className="font-bold text-slate-800">{lead?.clientName}</TableCell>
//                       <TableCell className="text-slate-600">{lead?.phoneNumber}</TableCell>
//                       <TableCell className="font-bold text-blue-600">₹{lead?.loanRequirement}</TableCell>
//                       <TableCell className="text-slate-600">{bo?.name}</TableCell>
//                       <TableCell>
//                         <Badge variant={req.status === 'Approved' ? 'default' : req.status === 'Rejected' ? 'destructive' : 'secondary'} className="rounded-full text-[10px] font-bold px-3">
//                           {req.status}
//                         </Badge>
//                       </TableCell>
//                       <TableCell>
//                         {req.status === 'Pending' && (
//                           <div className="flex gap-2">
//                             <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold" onClick={() => approveRequest(req.id)}>
//                               <Check className="w-3 h-3 mr-1" />Approve
//                             </Button>
//                             <Button size="sm" variant="outline" className="rounded-xl text-xs font-bold" onClick={() => rejectRequest(req.id)}>
//                               <X className="w-3 h-3 mr-1" />Reject
//                             </Button>
//                           </div>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })}
//                 {meetingRequests.filter(mr => mr.tcId === currentUser?.id).length === 0 && (
//                   <TableRow><TableCell colSpan={6} className="text-center py-10 text-slate-400">No meeting requests</TableCell></TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </div>
//       )}

//       {/* ══════════════════════════════════════
//           SCHEDULE TAB
//       ══════════════════════════════════════ */}
//       {activeTab === 'schedule' && (
//         <div className="space-y-6">
//           <div>
//             <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Schedule Meetings</h2>
//             <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Approve requests and reschedule meetings</p>
//           </div>

//           {rescheduleRequests.length > 0 && (
//             <div className="space-y-4">
//               <div className="flex items-center gap-2">
//                 <RefreshCw className="w-4 h-4 text-orange-500" />
//                 <h3 className="text-base font-extrabold text-orange-600">Reschedule Requests ({rescheduleRequests.length})</h3>
//               </div>
//               {rescheduleRequests.map(m => {
//                 const lead = leads.find(l => l.id === m.leadId);
//                 const bo = users.find(u => u.id === m.boId);
//                 return (
//                   <div key={m.id} className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
//                     <div className="flex items-center gap-3 mb-5 flex-wrap">
//                       <Badge className="bg-orange-500 text-white rounded-full text-xs font-bold px-3 gap-1">
//                         <RefreshCw className="w-3 h-3" />Reschedule
//                       </Badge>
//                       <span className="font-extrabold text-slate-800">{m.clientName || lead?.clientName}</span>
//                       <span className="text-slate-500 text-sm">— ₹{lead?.loanRequirement}</span>
//                       <span className="text-slate-400 text-xs">(BO: {bo?.name})</span>
//                       <span className="text-slate-400 text-xs">· Previous: {m.date} {m.timeSlot}</span>
//                     </div>
//                     {renderScheduleForm(m.id, () => rescheduleExistingMeeting(m.id), 'Confirm Reschedule', 'bg-orange-500 hover:bg-orange-600 text-white', m.id)}
//                   </div>
//                 );
//               })}
//             </div>
//           )}

//           {meetingRequests.filter(mr => mr.tcId === currentUser?.id && mr.status === 'Approved').map(req => {
//             const lead = leads.find(l => l.id === req.leadId);
//             if (!lead || lead.meetingId) return null;
//             const bo = users.find(u => u.id === req.boId);
//             return (
//               <div key={req.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
//                 <div className="flex items-center gap-2 mb-5">
//                   <span className="font-extrabold text-slate-800">{lead.clientName}</span>
//                   <span className="text-slate-500">— ₹{lead.loanRequirement}</span>
//                   <span className="text-slate-400 text-xs">(BO: {bo?.name})</span>
//                 </div>
//                 {renderScheduleForm(req.id, () => scheduleMeeting(req.id, lead.id, req.boId), 'Schedule Meeting')}
//               </div>
//             );
//           })}

//           {rescheduleRequests.length === 0 &&
//             meetingRequests.filter(mr => mr.tcId === currentUser?.id && mr.status === 'Approved' && !leads.find(l => l.id === mr.leadId)?.meetingId).length === 0 && (
//               <div className="bg-white border border-slate-100 rounded-2xl py-12 text-center text-slate-400 shadow-sm">
//                 No pending scheduling required
//               </div>
//             )}

//           <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
//             <div className="px-6 py-4 border-b border-slate-100">
//               <h3 className="font-extrabold text-slate-800">Today's Scheduled Meetings</h3>
//             </div>
//             <Table>
//               <TableHeader>
//                 <TableRow className="bg-slate-50/70">
//                   {['Time', 'Client', 'BDM', 'Type', 'Status'].map(h => (
//                     <TableHead key={h} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{h}</TableHead>
//                   ))}
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {todayMeetings.filter(m => m.tcId === currentUser?.id).map(m => {
//                   const lead = leads.find(l => l.id === m.leadId);
//                   const bdm = users.find(u => u.id === m.bdmId);
//                   return (
//                     <TableRow key={m.id} className="hover:bg-slate-50/50">
//                       <TableCell className="font-bold text-blue-600">{m.timeSlot}</TableCell>
//                       <TableCell className="font-medium text-slate-800">{m.clientName || lead?.clientName}</TableCell>
//                       <TableCell className="text-slate-600">{bdm?.name}</TableCell>
//                       <TableCell><Badge variant="outline" className="rounded-full text-[10px] font-bold">{m.meetingType}</Badge></TableCell>
//                       <TableCell>
//                         <Badge variant={m.status === 'Meeting Done' || m.status === 'Converted' ? 'default' : 'secondary'} className="rounded-full text-[10px] font-bold">
//                           {m.status}
//                         </Badge>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })}
//                 {todayMeetings.filter(m => m.tcId === currentUser?.id).length === 0 && (
//                   <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No meetings scheduled today</TableCell></TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </div>
//       )}

//       {/* ══════════════════════════════════════
//           HISTORY TAB
//       ══════════════════════════════════════ */}
//       {activeTab === 'history' && (
//         <div className="space-y-6">
//           <div>
//             <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Meeting History</h2>
//             <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Date-wise meeting summary</p>
//           </div>
//           <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
//           <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
//             <div className="px-6 py-4 border-b border-slate-100">
//               <h3 className="font-extrabold text-slate-800">Summary <span className="text-slate-400 font-medium">({teamMeetings.length} meetings)</span></h3>
//             </div>
//             <Table>
//               <TableHeader>
//                 <TableRow className="bg-slate-50/70">
//                   {['Date', 'Total', 'Done', 'Not Done', 'Converted', 'Follow-Up', 'Rescheduled'].map(h => (
//                     <TableHead key={h} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{h}</TableHead>
//                   ))}
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {meetingsByDate.slice().reverse().map(([date, count]) => {
//                   const dm = teamMeetings.filter(m => m.date === date);
//                   return (
//                     <TableRow key={date} className="hover:bg-slate-50/50">
//                       <TableCell className="font-bold text-slate-800">{date}</TableCell>
//                       <TableCell className="font-extrabold text-blue-600">{count}</TableCell>
//                       <TableCell className="font-bold text-green-600">{dm.filter(m => m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up').length}</TableCell>
//                       <TableCell className="font-bold text-red-500">{dm.filter(m => m.status === 'Not Done').length}</TableCell>
//                       <TableCell className="font-bold text-purple-600">{dm.filter(m => m.status === 'Converted').length}</TableCell>
//                       <TableCell className="font-bold text-amber-600">{dm.filter(m => m.status === 'Follow-Up').length}</TableCell>
//                       <TableCell className="font-bold text-orange-500">{dm.filter(m => m.status === 'Reschedule Requested').length}</TableCell>
//                     </TableRow>
//                   );
//                 })}
//                 {meetingsByDate.length === 0 && (
//                   <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400">No meetings found</TableCell></TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </div>
//       )}

//     </DashboardLayout>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, string> = {
    'Converted':       'badge-converted',
    'Meeting Done':    'badge-done',
    'Follow-Up':       'badge-followup',
    'Not Done':        'badge-notdone',
    'Pending':         'badge-pending',
    'Scheduled':       'badge-scheduled',
    'Approved':        'badge-approved',
    'Rejected':        'badge-rejected',
    'Interested':      'badge-interested',
    'Not Interested':  'badge-notint',
    'Eligible':        'badge-eligible',
    'Not Eligible':    'badge-notdone',
    'Connected':       'badge-connected',
    'Not Connected':   'badge-notconn',
    'Mobile Off':      'badge-mobileoff',
    'Incoming Barred': 'badge-mobileoff',
    'Reschedule Requested': 'badge-reschedule',
  };
  return (
    <span className={`badge ${map[status] || 'badge-pending'}`}>{status}</span>
  );
}

function healthColor(score: number) {
  if (score >= 70) return '#00d4aa';
  if (score >= 50) return '#f59e0b';
  return '#ff4757';
}

function HealthRing({ score }: { score: number }) {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = healthColor(score);
  return (
    <svg width="72" height="72" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#1c2038" strokeWidth="6" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
      />
      <text x="40" y="45" textAnchor="middle" fontSize="15" fontWeight="700"
        fill={color} fontFamily="'Syne', sans-serif">{score}</text>
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
  dashboard: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  team: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></svg>,
  requests: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  calendar: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  clock: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  bell: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  check: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  x: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  refresh: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function TCDashboard() {
  const {
    currentUser, users, leads, teams, meetings,
    meetingRequests, updateLead, addMeeting,
    updateMeetingRequest, updateMeeting,
  } = useCRM();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
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

  // Meetings by date for history sparkline
  const meetingsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    teamMeetings.forEach(m => { map[m.date] = (map[m.date] || 0) + 1; });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-30);
  }, [teamMeetings]);

  // State-wise
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
    const notInterested = boLeads.filter(l => l.leadStatus === 'Not Interested').length;
    const converted = boMeetings.filter(m => m.status === 'Converted').length;
    const done = boMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length;
    const notDone = boMeetings.filter(m => m.status === 'Not Done').length;
    const followUp = boMeetings.filter(m => m.status === 'Follow-Up').length;
    const pendingReqs = meetingRequests.filter(mr => mr.boId === boId && mr.status === 'Pending').length;
    const total = boLeads.length || 1;
    const connectRate = Math.round((connected / total) * 100);
    const convRate = boMeetings.length ? Math.round((converted / boMeetings.length) * 100) : 0;
    const healthScore = Math.min(100, Math.round(((connected / total) * 40) + ((interested / total) * 30) + (convRate * 0.3)));

    return (
      <div>
        {/* BO Header */}
        <div className="bo-header">
          <div className="bo-avatar">{bo?.name?.[0] ?? '?'}</div>
          <div className="bo-info">
            <div className="bo-name">{bo?.name}</div>
            <div className="bo-role">Business Officer · {bo?.email || 'N/A'}</div>
          </div>
          <HealthRing score={healthScore} />
          <div className="health-label">HEALTH<br />SCORE</div>
        </div>

        {/* Mini KPIs */}
        <div className="bo-kpis">
          {[
            { val: boLeads.length, label: 'Total Leads', color: '#3d7fff' },
            { val: connected, label: `Connected (${connectRate}%)`, color: '#00d4aa' },
            { val: boMeetings.length, label: 'Meetings', color: '#e8eaf6' },
            { val: converted, label: `Converted (${convRate}%)`, color: '#00d4aa' },
          ].map(k => (
            <div key={k.label} className="bo-kpi">
              <div className="bo-kpi-val" style={{ color: k.color }}>{k.val}</div>
              <div className="bo-kpi-label">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="bo-two-col">
          {/* Lead Pipeline */}
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
            {/* Call Outcomes */}
            <div className="bo-panel">
              <div className="panel-section-label">CALL OUTCOMES</div>
              <FunnelRow label="Not conn." val={notConnected} total={boLeads.length} color="#ff4757" />
              <FunnelRow label="Mobile off" val={mobileOff} total={boLeads.length} color="#f59e0b" />
              <FunnelRow label="Inc. barred" val={incomingBarred} total={boLeads.length} color="#f59e0b" />
            </div>
            {/* Meeting Results */}
            <div className="bo-panel">
              <div className="panel-section-label">MEETING RESULTS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { v: done, l: 'DONE', c: '#00d4aa' },
                  { v: notDone, l: 'NOT DONE', c: '#ff4757' },
                  { v: followUp, l: 'FOLLOW-UP', c: '#a78bfa' },
                  { v: pendingReqs, l: 'PENDING REQ', c: pendingReqs > 0 ? '#f59e0b' : '#4a5568' },
                ].map(item => (
                  <div key={item.l}>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: item.c }}>{item.v}</div>
                    <div style={{ fontSize: '9px', color: '#4a5568', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px' }}>{item.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Meetings */}
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

        {/* Leads Assigned */}
        <div className="bo-table-wrap">
          <div className="bo-table-header">LEADS ASSIGNED</div>
          <table className="data-table">
            <thead><tr><th>Client</th><th>Phone</th><th>Number Status</th><th>Lead Status</th><th>Loan Req.</th></tr></thead>
            <tbody>
              {boLeads.slice(0, 8).map(l => (
                <tr key={l.id}>
                  <td className="primary">{l.clientName}</td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#4a5568' }}>{l.phoneNumber}</td>
                  <td>{statusBadge(l.numberStatus)}</td>
                  <td>{statusBadge(l.leadStatus)}</td>
                  <td style={{ color: '#3d7fff', fontWeight: 600 }}>₹{l.loanRequirement}</td>
                </tr>
              ))}
              {boLeads.length === 0 && <tr><td colSpan={5} className="empty-row">no leads assigned</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

        .cc-root {
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
          font-family: 'Syne', sans-serif;
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          position: relative;
        }
        .cc-root::before {
          content: '';
          position: fixed; top: -50%; left: -50%;
          width: 200%; height: 200%;
          background:
            radial-gradient(ellipse 600px 400px at 20% 30%, rgba(61,127,255,0.06), transparent),
            radial-gradient(ellipse 500px 500px at 80% 70%, rgba(0,212,170,0.05), transparent),
            radial-gradient(ellipse 400px 300px at 50% 10%, rgba(167,139,250,0.04), transparent);
          pointer-events: none; z-index: 0;
        }
        .cc-root::after {
          content: '';
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none; z-index: 0; opacity: 0.4;
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
        }
        .cc-sidebar::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent), transparent);
        }
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
        .cc-nav-badge { margin-left: auto; font-size: 10px; font-weight: 700; background: var(--danger); color: #fff; padding: 1px 7px; border-radius: 10px; font-family: 'JetBrains Mono', monospace; }
        .cc-nav-badge.info { background: var(--accent); }
        .cc-sidebar-footer { margin-top: auto; padding: 16px 24px; border-top: 1px solid var(--border); font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
        .cc-status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); margin-right: 6px; animation: pulse-dot 2s infinite; }
        @keyframes pulse-dot { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }

        /* MAIN */
        .cc-main { flex: 1; overflow: auto; padding: 32px 32px 60px; }
        .cc-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
        .cc-page-title { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: var(--text); }
        .cc-page-sub { font-size: 11px; color: var(--text2); margin-top: 3px; font-family: 'JetBrains Mono', monospace; }
        .cc-topbar-right { display: flex; align-items: center; gap: 12px; }
        .cc-clock { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text2); background: var(--surface); border: 1px solid var(--border); padding: 8px 14px; border-radius: 8px; }
        .cc-alert-btn { background: var(--surface); border: 1px solid rgba(255,71,87,0.27); color: var(--danger); padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; animation: border-glow 3s infinite; }
        @keyframes border-glow { 0%, 100% { border-color: rgba(255,71,87,0.27); box-shadow: none } 50% { border-color: rgba(255,71,87,0.53); box-shadow: 0 0 12px rgba(255,71,87,0.13) } }

        /* DATE FILTER */
        .cc-date-filter { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 24px; }
        .cc-date-input { background: var(--surface); border: 1px solid var(--border2); border-radius: 8px; padding: 7px 12px; color: var(--text); font-size: 12px; font-family: 'JetBrains Mono', monospace; outline: none; }
        .cc-date-input:focus { border-color: var(--accent); }
        .cc-clear-btn { font-size: 11px; color: var(--text3); cursor: pointer; font-family: 'JetBrains Mono', monospace; padding: 7px 12px; border: 1px solid var(--border); border-radius: 8px; background: transparent; transition: all 0.15s; }
        .cc-clear-btn:hover { color: var(--text2); border-color: var(--border2); }
        .date-label { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

        /* ALERT STRIP */
        .cc-alert-strip { background: linear-gradient(135deg, rgba(255,107,53,0.05), rgba(255,107,53,0.02)); border: 1px solid rgba(255,107,53,0.2); border-radius: 12px; padding: 12px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; position: relative; overflow: hidden; }
        .cc-alert-strip::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--orange); }
        .cc-alert-text { font-size: 12px; color: var(--text); flex: 1; }
        .cc-alert-text strong { color: var(--orange); }
        .cc-alert-review { font-size: 10px; color: var(--accent); cursor: pointer; font-family: 'JetBrains Mono', monospace; }

        /* KPI CARDS */
        .cc-kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 28px; }
        .cc-kpi { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 22px 20px; position: relative; overflow: hidden; transition: transform 0.2s, border-color 0.2s; cursor: default; }
        .cc-kpi:hover { transform: translateY(-2px); }
        .cc-kpi.blue { border-color: rgba(61,127,255,0.13); }
        .cc-kpi.blue:hover { border-color: rgba(61,127,255,0.33); box-shadow: 0 0 40px rgba(61,127,255,0.13); }
        .cc-kpi.green { border-color: rgba(0,212,170,0.13); }
        .cc-kpi.green:hover { border-color: rgba(0,212,170,0.33); box-shadow: 0 0 40px rgba(0,212,170,0.13); }
        .cc-kpi.orange { border-color: rgba(245,158,11,0.13); }
        .cc-kpi.orange:hover { border-color: rgba(245,158,11,0.33); box-shadow: 0 0 40px rgba(245,158,11,0.13); }
        .cc-kpi.purple { border-color: rgba(167,139,250,0.13); }
        .cc-kpi.purple:hover { border-color: rgba(167,139,250,0.33); box-shadow: 0 0 40px rgba(167,139,250,0.13); }
        .cc-kpi::before { content: ''; position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; border-radius: 50%; opacity: 0.06; }
        .cc-kpi.blue::before { background: var(--accent); }
        .cc-kpi.green::before { background: var(--success); }
        .cc-kpi.orange::before { background: var(--warning); }
        .cc-kpi.purple::before { background: var(--purple); }
        .cc-kpi-label { font-size: 10px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; }
        .cc-kpi-value { font-size: 42px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
        .cc-kpi.blue .cc-kpi-value { color: var(--accent); }
        .cc-kpi.green .cc-kpi-value { color: var(--success); }
        .cc-kpi.orange .cc-kpi-value { color: var(--warning); }
        .cc-kpi.purple .cc-kpi-value { color: var(--purple); }
        .cc-kpi-sub { font-size: 11px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
        .cc-kpi-bar-wrap { display: flex; align-items: flex-end; gap: 3px; height: 28px; margin-top: 12px; }
        .cc-kpi-bar { flex: 1; border-radius: 2px; min-height: 3px; opacity: 0.6; }

        /* GLASS CARD */
        .glass-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; margin-bottom: 20px; }
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
        .slot-free { background: rgba(0,212,170,0.08); color: var(--success); border: 1px solid rgba(0,212,170,0.13); cursor: pointer; }
        .slot-booked { background: rgba(255,71,87,0.08); color: var(--danger); border: 1px solid rgba(255,71,87,0.13); }
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
        .bo-table-wrap { margin: 0 20px; margin-bottom: 0; background: var(--bg3); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
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

        /* ACTION BUTTONS */
        .action-btn { display: inline-flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 600; padding: 5px 12px; border-radius: 7px; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; font-family: 'JetBrains Mono', monospace; }
        .btn-approve { background: rgba(0,212,170,0.1); color: var(--success); border-color: rgba(0,212,170,0.13); }
        .btn-approve:hover { background: rgba(0,212,170,0.17); border-color: var(--success); }
        .btn-reject { background: rgba(255,71,87,0.1); color: var(--danger); border-color: rgba(255,71,87,0.13); }
        .btn-reject:hover { background: rgba(255,71,87,0.17); border-color: var(--danger); }

        /* SCHEDULE FORM */
        .sched-form { padding: 0; }
        .sched-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 14px; }
        .sched-field { }
        .field-label { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; letter-spacing: 1.5px; margin-bottom: 6px; }
        .cc-select, .cc-input { width: 100%; background: var(--bg3); border: 1px solid var(--border2); border-radius: 8px; padding: 8px 10px; color: var(--text); font-size: 12px; font-family: 'Syne', sans-serif; outline: none; transition: border-color 0.15s; }
        .cc-select:focus, .cc-input:focus { border-color: var(--accent); }
        .cc-input::placeholder { color: var(--text3); }
        .cc-btn { display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: 10px; padding: 10px 22px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: 'Syne', sans-serif; transition: all 0.15s; }
        .cc-btn-blue { background: var(--accent); color: #fff; }
        .cc-btn-blue:hover { background: #2d6ef0; }
        .cc-btn-orange { background: var(--orange); color: #fff; }
        .cc-btn-orange:hover { background: #e85d2a; }

        /* RESCHEDULE CARD */
        .reschedule-wrap { background: rgba(255,107,53,0.05); border: 1px solid rgba(255,107,53,0.2); border-radius: 14px; padding: 18px; margin-bottom: 14px; }
        .reschedule-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }

        /* DONUT */
        .donut-section { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 20px; margin-bottom: 20px; }
        .donut-inner { display: flex; align-items: center; gap: 20px; padding: 20px; }
        .legend-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .legend-label { font-size: 11px; color: var(--text2); }
        .legend-val { margin-left: auto; font-size: 11px; font-weight: 600; font-family: 'JetBrains Mono', monospace; color: var(--text); }

        /* STATE TABLE */
        .state-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }

        /* ANIMATIONS */
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
        .fade-in { animation: fadeInUp 0.3s ease forwards; }

        /* SCROLLBAR */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
      `}</style>

      <div className="cc-root">
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
              <span className="cc-status-dot" />Live · {myTeam?.name || 'My Team'}<br />
              <span style={{ color: 'var(--text3)', marginTop: '4px', display: 'block' }}>{myBOs.length} BOs · {allTeamLeads.length} active leads</span>
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
                    { label: 'Total Meetings', value: totalMeetings, cls: 'blue', sub: 'in selected range', bars: [4,6,5,7,6,8,7,totalMeetings], barColor: '#3d7fff' },
                    { label: 'Converted', value: convertedCount, cls: 'green', sub: `${totalMeetings ? Math.round(convertedCount/totalMeetings*100) : 0}% conv. rate`, bars: [1,2,2,3,2,3,3,convertedCount], barColor: '#00d4aa' },
                    { label: 'Pending', value: pendingCount, cls: 'orange', sub: 'needs follow-up', bars: [3,4,3,5,3,4,4,pendingCount], barColor: '#f59e0b' },
                    { label: 'Active Leads', value: allTeamLeads.length, cls: 'purple', sub: `across ${myBOs.length} officers`, bars: [30,32,35,38,40,42,44,allTeamLeads.length], barColor: '#a78bfa' },
                  ].map(k => {
                    const max = Math.max(...k.bars) || 1;
                    return (
                      <div key={k.label} className={`cc-kpi ${k.cls}`}>
                        <div className="cc-kpi-label">{k.label}</div>
                        <div className="cc-kpi-value">{k.value}</div>
                        <div className="cc-kpi-sub">{k.sub}</div>
                        <div className="cc-kpi-bar-wrap">
                          {k.bars.map((v, i) => (
                            <div key={i} className="cc-kpi-bar" style={{ height: `${Math.max(3, Math.round((v/max)*26))}px`, background: k.barColor }} />
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

                  {/* Right column */}
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
                                {TIME_SLOTS.slice(0, 8).map(slot => (
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

                {/* State-wise table */}
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

                {/* BO summary table */}
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

                {/* BO Detail */}
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

                {/* Reschedule Requests */}
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

                {/* Approved requests to schedule */}
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

                {/* Today's scheduled meetings */}
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

                {/* Date filter */}
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