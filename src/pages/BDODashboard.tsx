// import { useState, useMemo } from 'react';
// import { useCRM } from '@/contexts/CRMContext';
// import DashboardLayout, { LayoutDashboard, Calendar } from '@/components/DashboardLayout';
// import StatCard from '@/components/StatCard';
// import DateRangeFilter from '@/components/DateRangeFilter';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch';
// import { toast } from 'sonner';
// import { Meeting, BDOStatus, WalkingStatus } from '@/types/crm';
// import { ArrowLeft, Eye, User, Phone, Calendar as CalendarIcon, MapPin, Building, Briefcase, IndianRupee, CheckCircle2, XCircle, Clock, Users, MessageSquare, Send, CalendarCheck } from 'lucide-react';
// import MeetingDetailDialog from '@/components/MeetingDetailDialog';

// const navItems = [
//   { label: 'Pending Meetings', icon: <LayoutDashboard className="w-4 h-4" />, id: 'pending' },
//   { label: 'All Meetings', icon: <Calendar className="w-4 h-4" />, id: 'all' },
// ];

// export default function BDODashboard() {
//   const { currentUser, leads, users, meetings, updateMeeting } = useCRM();
//   const [activeTab, setActiveTab] = useState('pending');
//   const [detailView, setDetailView] = useState<string | null>(null);
//   const [fromDate, setFromDate] = useState<Date | undefined>();
//   const [toDate, setToDate] = useState<Date | undefined>();
//   const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
//   const [infoMeeting, setInfoMeeting] = useState<Meeting | null>(null);

//   // Only show meetings assigned to this BDO (bdoId === currentUser.id)
//   const allBdoMeetings = useMemo(() => {
//     let filtered = meetings.filter(m => m.bdoId === currentUser?.id);
//     if (fromDate) filtered = filtered.filter(m => m.date >= fromDate.toISOString().split('T')[0]);
//     if (toDate) filtered = filtered.filter(m => m.date <= toDate.toISOString().split('T')[0]);
//     return filtered;
//   }, [meetings, currentUser, fromDate, toDate]);

//   // Pending = assigned by BDM with status 'Pending' but no BDO action yet
//   const pendingMeetings = allBdoMeetings.filter(m => m.status === 'Pending' && (!m.bdoStatus || m.bdoStatus.length === 0));
//   const convertedByBDM = allBdoMeetings.filter(m => m.bdoStatus === 'Converted by BDM');
//   const followUpMeetings = allBdoMeetings.filter(m => m.bdoStatus === 'Follow-up' && m.walkingStatus !== 'Walking Done' && m.walkingStatus !== 'Invalid');
//   const walkingDone = allBdoMeetings.filter(m => m.bdoStatus === 'Walk-in Done');
//   const walkingInvalid = allBdoMeetings.filter(m => m.walkingStatus === 'Invalid');
//   const totalConverted = allBdoMeetings.filter(m => m.bdoStatus === 'Converted by BDM' || m.bdoStatus === 'Converted');

//   const handleConvertedByBDM = async (meeting: Meeting) => {
//     setSelectedMeeting(meeting);
//   };

//   const handleSaveConversion = async (miniLogin: boolean, fullLogin: boolean) => {
//     if (!selectedMeeting) return;
//     await updateMeeting(selectedMeeting.id, {
//       bdoStatus: 'Converted by BDM',
//       miniLogin,
//       fullLogin,
//       bdoId: currentUser?.id,
//     });
//     setSelectedMeeting(null);
//     toast.success('Meeting marked as Converted by BDM');
//   };

//   const handleFollowUp = async (meetingId: string) => {
//     await updateMeeting(meetingId, {
//       bdoStatus: 'Follow-up',
//       bdoId: currentUser?.id,
//     });
//     toast.success('Meeting marked as Follow-up');
//   };

//   const handleSetWalkinDate = async (meetingId: string, date: string) => {
//     if (!date) { toast.error('Select a date'); return; }
//     await updateMeeting(meetingId, { walkinDate: date });
//     toast.success('Walk-in date set');
//   };

//   const handleWalkingDone = async (meeting: Meeting) => {
//     await updateMeeting(meeting.id, {
//       walkingStatus: 'Walking Done',
//       bdoStatus: 'Walk-in Done',
//     });
//     toast.success('Walk-in marked as Done. Use "Login Status Update" in View Details to convert.');
//   };

//   const handleSaveWalkingConversion = async (miniLogin: boolean, fullLogin: boolean) => {
//     if (!selectedMeeting) return;
//     await updateMeeting(selectedMeeting.id, {
//       walkingStatus: 'Walking Done',
//       bdoStatus: 'Converted by BDM',
//       miniLogin,
//       fullLogin,
//     });
//     setSelectedMeeting(null);
//     toast.success('Walking completed and converted');
//   };

//   const handleWalkingInvalid = async (meetingId: string) => {
//     await updateMeeting(meetingId, { walkingStatus: 'Invalid' });
//     toast.success('Walking marked as invalid');
//   };

//   const getDetailMeetings = () => {
//     switch (detailView) {
//       case 'pending': return pendingMeetings;
//       case 'converted': return convertedByBDM;
//       case 'followup': return followUpMeetings;
//       case 'walking_done': return walkingDone;
//       case 'walking_invalid': return walkingInvalid;
//       case 'total_converted': return totalConverted;
//       default: return [];
//     }
//   };

//   const detailTitle: Record<string, string> = {
//     pending: 'Pending Meetings', converted: 'Converted by BDM', followup: 'Follow-up',
//     walking_done: 'Walking Done', walking_invalid: 'Walking Invalid', total_converted: 'Total Converted',
//   };

//   const renderMeetingRow = (m: Meeting, showActions = false) => {
//     const lead = leads.find(l => l.id === m.leadId);

//     return (
//       <TableRow key={m.id} className="hover:bg-muted/50 transition-colors">
//         <TableCell>
//           <span className="font-medium text-sm flex items-center gap-1.5 text-foreground">
//             <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
//             {new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
//           </span>
//         </TableCell>
//         <TableCell>
//           <span className="text-sm flex items-center gap-1.5">
//             <Clock className="w-3.5 h-3.5 text-muted-foreground" />
//             {m.timeSlot}
//           </span>
//         </TableCell>
//         <TableCell>
//           <span className="font-semibold text-foreground text-sm">{m.clientName || lead?.clientName || 'Unknown'}</span>
//         </TableCell>
//         <TableCell>
//           <span className="text-sm flex items-center gap-1.5 text-muted-foreground">
//             <Phone className="w-3.5 h-3.5" /> {lead?.phoneNumber || '—'}
//           </span>
//         </TableCell>
//         <TableCell>
//           <span className="font-semibold text-primary text-sm flex items-center gap-1">
//             <IndianRupee className="w-3.5 h-3.5"/>
//             {lead?.loanRequirement || '—'}
//           </span>
//         </TableCell>
//         {showActions && (
//           <TableCell className="text-right pr-6">
//             <Button size="sm" variant="outline" className="h-8 text-xs flex items-center justify-center gap-1.5 bg-background shadow-sm hover:bg-secondary/50 ml-auto" onClick={() => setInfoMeeting(m)}>
//               <Eye className="w-3.5 h-3.5 text-primary" /> View Details
//             </Button>
//           </TableCell>
//         )}
//       </TableRow>
//     );
//   };

//   return (
//     <DashboardLayout navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
//       {activeTab === 'pending' && (
//         <div className="space-y-6">
//           <div>
//             <h2 className="text-2xl font-display font-bold">BDO Dashboard</h2>
//             <p className="text-sm text-muted-foreground mt-1">Manage post-meeting conversions and follow-ups</p>
//           </div>
//           <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />

//           {detailView ? (
//             <div className="space-y-4 animate-fade-in">
//               <div className="flex items-center gap-3">
//                 <Button variant="ghost" size="sm" onClick={() => setDetailView(null)}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
//                 <h3 className="text-lg font-semibold">{detailTitle[detailView]} ({getDetailMeetings().length})</h3>
//               </div>
//               <Card>
//                 <CardContent className="p-0">
//                   <Table>
//                     <TableHeader>
//                       <TableRow className="bg-muted/50 border-b-2">
//                         <TableHead>Date</TableHead>
//                         <TableHead>Time</TableHead>
//                         <TableHead>Client</TableHead>
//                         <TableHead>Phone</TableHead>
//                         <TableHead>Loan Amount</TableHead>
//                         <TableHead className="text-right pr-6">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {getDetailMeetings().map(m => renderMeetingRow(m, true))}
//                       {getDetailMeetings().length === 0 && (
//                         <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No meetings</TableCell></TableRow>
//                       )}
//                     </TableBody>
//                   </Table>
//                 </CardContent>
//               </Card>
//             </div>
//           ) : (
//             <>
//               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                 <StatCard label="Pending Meetings" value={pendingMeetings.length} variant="info" onClick={() => setDetailView('pending')} />
//                 <StatCard label="Converted by BDM" value={convertedByBDM.length} variant="primary" onClick={() => setDetailView('converted')} />
//                 <StatCard label="Follow-up" value={followUpMeetings.length} variant="accent" onClick={() => setDetailView('followup')} />
//               </div>
//               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                 <StatCard label="Walking Done" value={walkingDone.length} variant="primary" onClick={() => setDetailView('walking_done')} />
//                 <StatCard label="Walking Invalid" value={walkingInvalid.length} variant="destructive" onClick={() => setDetailView('walking_invalid')} />
//                 <StatCard label="Total Converted" value={totalConverted.length} variant="accent" onClick={() => setDetailView('total_converted')} />
//               </div>

//               {/* Pending meetings with actions */}
//               <Card>
//                 <CardHeader><CardTitle className="text-base">Pending Meetings ({pendingMeetings.length})</CardTitle></CardHeader>
//                 <CardContent className="p-0">
//                   <Table>
//                     <TableHeader>
//                       <TableRow className="bg-muted/50 border-b-2">
//                         <TableHead>Date</TableHead>
//                         <TableHead>Time</TableHead>
//                         <TableHead>Client</TableHead>
//                         <TableHead>Phone</TableHead>
//                         <TableHead>Loan Amount</TableHead>
//                         <TableHead className="text-right pr-6">Actions</TableHead>
//                       </TableRow>
//                     </TableHeader>
//                     <TableBody>
//                       {pendingMeetings.map(m => renderMeetingRow(m, true))}
//                       {pendingMeetings.length === 0 && (
//                         <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No pending meetings</TableCell></TableRow>
//                       )}
//                     </TableBody>
//                   </Table>
//                 </CardContent>
//               </Card>

//               {/* Follow-up meetings */}
//               {followUpMeetings.length > 0 && (
//                 <Card>
//                   <CardHeader><CardTitle className="text-base">Follow-up Meetings ({followUpMeetings.length})</CardTitle></CardHeader>
//                   <CardContent className="p-0">
//                     <Table>
//                       <TableHeader>
//                         <TableRow className="bg-muted/50 border-b-2">
//                           <TableHead>Date</TableHead>
//                           <TableHead>Time</TableHead>
//                           <TableHead>Client</TableHead>
//                           <TableHead>Phone</TableHead>
//                           <TableHead>Loan Amount</TableHead>
//                           <TableHead className="text-right pr-6">Actions</TableHead>
//                         </TableRow>
//                       </TableHeader>
//                       <TableBody>
//                         {followUpMeetings.map(m => renderMeetingRow(m, true))}
//                       </TableBody>
//                     </Table>
//                   </CardContent>
//                 </Card>
//               )}
//             </>
//           )}
//         </div>
//       )}

//       {activeTab === 'all' && (
//         <div className="space-y-6">
//           <div>
//             <h2 className="text-2xl font-display font-bold">All Meetings</h2>
//             <p className="text-sm text-muted-foreground mt-1">Complete meeting history with BDO updates</p>
//           </div>
//           <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
//           <Card>
//             <CardContent className="p-0">
//               <Table>
//                 <TableHeader>
//                   <TableRow className="bg-muted/50 border-b-2">
//                     <TableHead>Date</TableHead>
//                     <TableHead>Time</TableHead>
//                     <TableHead>Client</TableHead>
//                     <TableHead>Phone</TableHead>
//                     <TableHead>Loan Amount</TableHead>
//                     <TableHead className="text-right pr-6">Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {allBdoMeetings.map(m => renderMeetingRow(m, true))}
//                   {allBdoMeetings.length === 0 && (
//                     <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No meetings</TableCell></TableRow>
//                   )}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>
//         </div>
//       )}

//       {/* Conversion Dialog for Mini/Full Login */}
//       <ConversionDialog
//         open={!!selectedMeeting}
//         onClose={() => setSelectedMeeting(null)}
//         onSave={selectedMeeting?.bdoStatus === 'Follow-up' || selectedMeeting?.walkingStatus ? handleSaveWalkingConversion : handleSaveConversion}
//         title={selectedMeeting?.bdoStatus === 'Follow-up' ? 'Walking Done — Conversion Details' : 'Converted by BDM — Login Details'}
//       />

//       {/* Enhanced Meeting Detail Dialog */}
//       <MeetingDetailDialog
//         isOpen={!!infoMeeting}
//         meeting={infoMeeting}
//         onClose={() => setInfoMeeting(null)}
//         onHandleConverted={handleConvertedByBDM}
//         onHandleFollowUp={handleFollowUp}
//         onHandleSetWalkinDate={handleSetWalkinDate}
//         onHandleWalkingDone={handleWalkingDone}
//         onHandleWalkingInvalid={handleWalkingInvalid}
//       />
//     </DashboardLayout>
//   );
// }

// function ConversionDialog({ open, onClose, onSave, title }: { open: boolean; onClose: () => void; onSave: (mini: boolean, full: boolean) => void; title: string }) {
//   const [miniLogin, setMiniLogin] = useState(false);
//   const [fullLogin, setFullLogin] = useState(false);

//   const handleSave = () => {
//     onSave(miniLogin, fullLogin);
//     setMiniLogin(false);
//     setFullLogin(false);
//   };

//   return (
//     <Dialog open={open} onOpenChange={v => !v && onClose()}>
//       <DialogContent>
//         <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <Label>Mini Login</Label>
//             <Switch checked={miniLogin} onCheckedChange={setMiniLogin} />
//           </div>
//           <div className="flex items-center justify-between">
//             <Label>Full Login</Label>
//             <Switch checked={fullLogin} onCheckedChange={setFullLogin} />
//           </div>
//           <Button onClick={handleSave} className="w-full">Save</Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }

import { useState, useMemo, useEffect } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { Meeting } from '@/types/crm';
import { toast } from 'sonner';
import MeetingDetailDialog from '@/components/MeetingDetailDialog';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'pending' | 'followup' | 'history';
type Theme = 'dark' | 'light';
type Period = 'daily' | 'weekly' | 'monthly' | 'custom';

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  overview: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  pending:  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  followup: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 4l-5 5-4-4L5 14"/><path d="M17 4h6v6"/></svg>,
  history:  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  sun:      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  moon:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  logout:   <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell:     <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  check:    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  walk:     <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><path d="M8 22l2-8-2-4h8l-2 4 2 8"/><path d="M6 11l2-3M18 11l-2-3"/></svg>,
  invalid:  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  eye:      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  calendar: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  phone:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>,
  rupee:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="6" y1="4" x2="18" y2="4"/><line x1="6" y1="9" x2="18" y2="9"/><line x1="15" y1="14" x2="6" y2="21"/><path d="M6 9a6 6 0 000 5h3"/></svg>,
  clear:    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDateRange(period: Period, customFrom: string, customTo: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  if (period === 'daily')   return { from: fmt(today), to: fmt(today) };
  if (period === 'weekly')  { const mon = new Date(today); mon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); return { from: fmt(mon), to: fmt(today) }; }
  if (period === 'monthly') { const first = new Date(today.getFullYear(), today.getMonth(), 1); return { from: fmt(first), to: fmt(today) }; }
  return { from: customFrom || fmt(today), to: customTo || fmt(today) };
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    'Pending':             'var(--warning)',
    'Follow-up':          'var(--purple)',
    'Walk-in Done':       'var(--teal)',
    'Walking Done':       'var(--success)',
    'Invalid':            'var(--danger)',
    'Meeting Done':       'var(--success)',
    'Scheduled':          'var(--accent)',
    'Not Done':           'var(--danger)',
    'Reschedule Requested':'var(--orange)',
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

// ─── Sparkline SVG ─────────────────────────────────────────────────────────
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

// ─── Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px', padding: '0 4px' }}>
      {data.map((d, i) => (
        <div key={d.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: colors[i % colors.length], fontFamily: "'JetBrains Mono', monospace" }}>{d.value}</span>
          <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: colors[i % colors.length], opacity: 0.85, height: `${Math.max((d.value / max) * 56, d.value > 0 ? 4 : 0)}px`, transition: 'height 0.5s ease', minHeight: d.value > 0 ? '4px' : '0' }} />
          <span style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', lineHeight: 1.2 }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut Chart ────────────────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '11px', padding: '20px 0', fontFamily: "'JetBrains Mono', monospace" }}>no data</div>;
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
          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{total}</span>
          <span style={{ fontSize: '8px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.5px' }}>total</span>
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BDODashboard() {
  const { currentUser, leads, users, meetings, updateMeeting, logout } = useCRM();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [theme, setTheme] = useState<Theme>('dark');
  const [period, setPeriod] = useState<Period>('monthly');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [infoMeeting, setInfoMeeting] = useState<Meeting | null>(null);
  const [clock, setClock] = useState('');
  const [alerts, setAlerts] = useState<{ id: string; msg: string; type: 'warn' | 'info' }[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [walkinDateMap, setWalkinDateMap] = useState<Record<string, string>>({});

  // Live clock
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')} ${n.getHours()>=12?'PM':'AM'}`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const { from, to } = getDateRange(period, customFrom, customTo);
  const isDark = theme === 'dark';

  // ── All BDO meetings (unfiltered for alert checks) ──
  const allMyMeetings = useMemo(() => meetings.filter((m: Meeting) => m.bdoId === currentUser?.id), [meetings, currentUser]);

  // ── Period-filtered meetings ──
  const filteredMeetings = useMemo(() => {
    return allMyMeetings.filter((m: Meeting) => m.date >= from && m.date <= to);
  }, [allMyMeetings, from, to]);

  // ── Categories (from allMyMeetings for pending/followup tabs, filteredMeetings for history) ──
  const pendingMeetings  = useMemo(() => allMyMeetings.filter((m: Meeting) => m.status === 'Pending' && (!m.bdoStatus || m.bdoStatus === '')), [allMyMeetings]);
  const followUpMeetings = useMemo(() => allMyMeetings.filter((m: Meeting) => m.bdoStatus === 'Follow-up' && m.walkingStatus !== 'Walking Done' && m.walkingStatus !== 'Invalid'), [allMyMeetings]);
  const walkingDone      = useMemo(() => filteredMeetings.filter((m: Meeting) => m.walkingStatus === 'Walking Done'), [filteredMeetings]);
  const walkingInvalid   = useMemo(() => filteredMeetings.filter((m: Meeting) => m.walkingStatus === 'Invalid'), [filteredMeetings]);
  const walkInTotal      = useMemo(() => filteredMeetings.filter((m: Meeting) => m.meetingType === 'Walk-in'), [filteredMeetings]);

  // ── Stats for period ──
  const stats = useMemo(() => ({
    total:       filteredMeetings.length,
    pending:     filteredMeetings.filter((m: Meeting) => m.status === 'Pending' && !m.bdoStatus).length,
    followup:    filteredMeetings.filter((m: Meeting) => m.bdoStatus === 'Follow-up').length,
    walkInDone:  filteredMeetings.filter((m: Meeting) => m.walkingStatus === 'Walking Done').length,
    walkInInvalid: filteredMeetings.filter((m: Meeting) => m.walkingStatus === 'Invalid').length,
    walkInTotal: filteredMeetings.filter((m: Meeting) => m.meetingType === 'Walk-in').length,
    notDone:     filteredMeetings.filter((m: Meeting) => m.status === 'Not Done').length,
    scheduled:   filteredMeetings.filter((m: Meeting) => m.status === 'Scheduled').length,
  }), [filteredMeetings]);

  // ── Daily trend (last 7 or 30 days) ──
  const dailyTrend = useMemo(() => {
    const days = period === 'daily' ? 7 : period === 'weekly' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      const dateStr = d.toISOString().split('T')[0];
      return allMyMeetings.filter((m: Meeting) => m.date === dateStr).length;
    });
  }, [allMyMeetings, period]);

  // ── Alert system ──
  useEffect(() => {
    const newAlerts: { id: string; msg: string; type: 'warn' | 'info' }[] = [];
    if (pendingMeetings.length > 0)
      newAlerts.push({ id: 'pending', msg: `${pendingMeetings.length} meeting${pendingMeetings.length > 1 ? 's' : ''} pending your action`, type: 'warn' });
    if (followUpMeetings.length > 0)
      newAlerts.push({ id: 'followup', msg: `${followUpMeetings.length} follow-up meeting${followUpMeetings.length > 1 ? 's' : ''} need attention`, type: 'info' });
    const overdueWalkin = allMyMeetings.filter((m: Meeting) => m.bdoStatus === 'Follow-up' && m.walkinDate && m.walkinDate < today && m.walkingStatus !== 'Walking Done' && m.walkingStatus !== 'Invalid');
    if (overdueWalkin.length > 0)
      newAlerts.push({ id: 'overdue_walkin', msg: `${overdueWalkin.length} walk-in date(s) overdue — mark as Done or Invalid`, type: 'warn' });
    setAlerts(newAlerts);
  }, [pendingMeetings.length, followUpMeetings.length, allMyMeetings, today]);

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id));

  // ── Actions — optimistic update ──
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

  const handleWalkingDone = async (meeting: Meeting) => {
    await updateMeeting(meeting.id, { walkingStatus: 'Walking Done', bdoStatus: 'Walk-in Done' });
    toast.success('Walk-in marked as Done');
  };

  const handleWalkingInvalid = async (meetingId: string) => {
    await updateMeeting(meetingId, { walkingStatus: 'Invalid' });
    toast.success('Walk-in marked as Invalid');
  };

  // ── Meeting row renderer ──────────────────────────────────────────────────
  const renderMeetingRow = (m: Meeting, showActions = false) => {
    const lead = leads.find((l: any) => l.id === m.leadId);
    const bdm  = users.find((u: any) => u.id === m.bdmId);
    const isOverdueWalkin = m.bdoStatus === 'Follow-up' && m.walkinDate && m.walkinDate < today && m.walkingStatus !== 'Walking Done' && m.walkingStatus !== 'Invalid';
    return (
      <tr key={m.id} style={{ background: isOverdueWalkin ? 'rgba(255,71,87,0.04)' : undefined }}>
        <td className="bdo-td bdo-pri">
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{m.clientName || lead?.clientName || '—'}</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>₹{lead?.loanRequirement || '—'}</div>
        </td>
        <td className="bdo-td">
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: 'var(--text2)' }}>{m.date}</div>
          <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>{m.timeSlot}</div>
        </td>
        <td className="bdo-td">
          <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{lead?.phoneNumber || '—'}</span>
        </td>
        <td className="bdo-td">
          <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{bdm?.name || '—'}</span>
        </td>
        <td className="bdo-td">
          <span style={{ fontSize: '10px', background: 'var(--surface2)', color: 'var(--text2)', padding: '2px 7px', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{m.meetingType || '—'}</span>
        </td>
        <td className="bdo-td">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <StatusBadge status={m.status} />
            {m.bdoStatus && <StatusBadge status={m.bdoStatus} />}
            {m.walkingStatus && <StatusBadge status={m.walkingStatus} />}
            {m.walkinDate && (
              <span style={{ fontSize: '9px', color: isOverdueWalkin ? 'var(--danger)' : 'var(--teal)', fontFamily: "'JetBrains Mono', monospace" }}>
                {isOverdueWalkin ? '⚠ ' : ''}WI: {m.walkinDate}
              </span>
            )}
          </div>
        </td>
        {showActions && (
          <td className="bdo-td">
            <button className="bdo-view-btn" onClick={() => setInfoMeeting(m)}>
              {I.eye} View
            </button>
          </td>
        )}
      </tr>
    );
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

        .bdo-root.dark {
          --bg: #07080f; --bg2: #0d0f1a; --bg3: #12152a;
          --surface: #161929; --surface2: #1c2038;
          --border: rgba(255,255,255,0.06); --border2: rgba(255,255,255,0.1);
          --accent: #3d7fff; --success: #00d4aa; --warning: #f59e0b;
          --danger: #ff4757; --purple: #a78bfa; --orange: #ff6b35; --teal: #06b6d4;
          --text: #e8eaf6; --text2: #8892b0; --text3: #4a5568;
        }
        .bdo-root.light {
          --bg: #f4f5fa; --bg2: #ffffff; --bg3: #eef0f7;
          --surface: #ffffff; --surface2: #eef0f7;
          --border: rgba(0,0,0,0.07); --border2: rgba(0,0,0,0.12);
          --accent: #2563eb; --success: #059669; --warning: #d97706;
          --danger: #dc2626; --purple: #7c3aed; --orange: #ea580c; --teal: #0891b2;
          --text: #0f172a; --text2: #475569; --text3: #94a3b8;
        }

        .bdo-root { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; transition: background 0.25s, color 0.25s; }
        .bdo-layout { display: flex; min-height: 100vh; }

        /* ── SIDEBAR ── */
        .bdo-sidebar { width: 220px; flex-shrink: 0; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; overflow: hidden; transition: background 0.25s; }
        .bdo-sidebar::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--warning), var(--orange), transparent); }
        .bdo-brand { padding: 22px 20px 16px; border-bottom: 1px solid var(--border); }
        .bdo-brand-tag { font-size: 9px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--warning); font-family: 'JetBrains Mono', monospace; margin-bottom: 6px; }
        .bdo-brand-name { font-size: 17px; font-weight: 800; color: var(--text); line-height: 1.2; }
        .bdo-user { margin: 12px 18px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 10px; padding: 10px; display: flex; align-items: center; gap: 9px; }
        .bdo-user-ava { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, var(--warning), var(--orange)); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .bdo-user-name { font-size: 12px; font-weight: 600; color: var(--text); }
        .bdo-user-role { font-size: 9px; color: var(--warning); font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
        .bdo-nav-section { padding: 6px 12px; margin-top: 2px; }
        .bdo-nav-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; color: var(--text3); text-transform: uppercase; font-family: 'JetBrains Mono', monospace; padding: 0 8px; margin-bottom: 3px; }
        .bdo-nav-item { display: flex; align-items: center; gap: 9px; padding: 8px 11px; border-radius: 9px; cursor: pointer; transition: all 0.15s; font-size: 12px; font-weight: 500; color: var(--text2); position: relative; margin-bottom: 1px; }
        .bdo-nav-item:hover { background: var(--surface2); color: var(--text); }
        .bdo-nav-item.active { background: var(--surface2); color: var(--warning); }
        .bdo-nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 60%; background: var(--warning); border-radius: 0 3px 3px 0; }
        .bdo-nav-icon { width: 16px; height: 16px; opacity: 0.6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .bdo-nav-item.active .bdo-nav-icon { opacity: 1; }
        .bdo-nav-badge { margin-left: auto; font-size: 9px; font-weight: 700; background: var(--danger); color: #fff; padding: 1px 6px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; }
        .bdo-nav-badge.info { background: var(--warning); }
        .bdo-sidebar-foot { margin-top: auto; padding: 12px 18px; border-top: 1px solid var(--border); }
        .bdo-status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); margin-right: 5px; animation: pdot 2s infinite; }
        @keyframes pdot { 0%,100%{opacity:1}50%{opacity:0.3} }
        .bdo-footer-info { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; }
        .bdo-theme-toggle { display: flex; background: var(--bg3); border: 1px solid var(--border2); border-radius: 18px; padding: 3px; margin-bottom: 8px; cursor: pointer; }
        .bdo-toggle-opt { display: flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 13px; font-size: 10px; font-weight: 600; color: var(--text3); transition: all 0.2s; font-family: 'JetBrains Mono', monospace; flex: 1; justify-content: center; }
        .bdo-toggle-opt.active { background: var(--surface); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .bdo-logout-btn { display: flex; align-items: center; gap: 7px; width: 100%; padding: 8px 11px; border-radius: 8px; font-size: 11px; font-weight: 600; color: var(--text2); cursor: pointer; background: var(--surface); border: 1px solid var(--border); transition: all 0.15s; font-family: inherit; }
        .bdo-logout-btn:hover { color: var(--text); border-color: var(--border2); }

        /* ── MAIN ── */
        .bdo-main { flex: 1; overflow: auto; padding: 26px 28px 60px; }
        .bdo-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .bdo-page-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: var(--text); }
        .bdo-page-sub { font-size: 10px; color: var(--text2); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
        .bdo-clock { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text2); background: var(--surface); border: 1px solid var(--border); padding: 6px 12px; border-radius: 7px; }

        /* ── PERIOD FILTER ── */
        .period-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-bottom: 18px; }
        .period-btn { padding: 5px 13px; border-radius: 7px; border: 1px solid var(--border2); cursor: pointer; font-size: 11px; font-weight: 600; color: var(--text2); background: var(--surface); transition: all 0.15s; font-family: 'JetBrains Mono', monospace; }
        .period-btn.active { border-color: var(--warning); color: var(--warning); background: rgba(245,158,11,0.08); }
        .period-date { background: var(--surface); border: 1px solid var(--border2); border-radius: 7px; padding: 5px 9px; color: var(--text); font-size: 11px; font-family: 'JetBrains Mono', monospace; outline: none; }
        .period-date:focus { border-color: var(--warning); }
        .period-label { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
        .period-range-badge { font-size: 10px; color: var(--text3); background: var(--bg3); border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; font-family: 'JetBrains Mono', monospace; }

        /* ── ALERTS ── */
        .alert-list { display: flex; flex-direction: column; gap: 7px; margin-bottom: 16px; }
        .alert-item { display: flex; align-items: center; gap: 10px; padding: 9px 13px; border-radius: 9px; position: relative; overflow: hidden; }
        .alert-warn { background: rgba(245,158,11,0.07); border: 1px solid rgba(245,158,11,0.2); }
        .alert-info { background: rgba(6,182,212,0.06); border: 1px solid rgba(6,182,212,0.18); }
        .alert-warn::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--warning); }
        .alert-info::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--teal); }
        .alert-msg { font-size: 12px; color: var(--text); flex: 1; }
        .alert-dismiss { font-size: 10px; color: var(--text3); cursor: pointer; font-family: 'JetBrains Mono', monospace; padding: 2px 8px; border: 1px solid var(--border2); border-radius: 5px; background: transparent; }
        .alert-dismiss:hover { color: var(--text2); }
        .alert-go { font-size: 10px; cursor: pointer; font-family: 'JetBrains Mono', monospace; padding: 2px 8px; border-radius: 5px; background: transparent; border: 1px solid; }
        .alert-warn .alert-go { color: var(--warning); border-color: rgba(245,158,11,0.3); }
        .alert-info .alert-go { color: var(--teal); border-color: rgba(6,182,212,0.3); }

        /* ── KPI CARDS ── */
        .kpi-row { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; margin-bottom: 16px; }
        .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 15px 14px; transition: transform 0.15s; }
        .kpi-card:hover { transform: translateY(-2px); }
        .kpi-label { font-size: 9px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-bottom: 7px; }
        .kpi-val { font-size: 32px; font-weight: 800; line-height: 1; margin-bottom: 6px; }
        .kpi-spark { display: flex; justify-content: flex-end; margin-top: 6px; }

        /* ── GLASS CARDS ── */
        .bdo-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 14px; transition: background 0.25s; }
        .bdo-card-head { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 10px; border-bottom: 1px solid var(--border); }
        .bdo-card-title { font-size: 12px; font-weight: 700; color: var(--text); }
        .bdo-card-sub { font-size: 10px; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
        .bdo-card-body { padding: 14px 16px; }
        .two-col { display: grid; grid-template-columns: minmax(0,1.3fr) minmax(0,1fr); gap: 14px; margin-bottom: 14px; }
        .three-col { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 14px; margin-bottom: 14px; }

        /* ── TABLE ── */
        .bdo-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .bdo-table th { padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text3); font-family: 'JetBrains Mono', monospace; border-bottom: 1px solid var(--border); }
        .bdo-td { padding: 9px 10px; border-bottom: 1px solid var(--border); vertical-align: middle; }
        .bdo-table tr:last-child .bdo-td { border-bottom: none; }
        .bdo-table tbody tr { transition: background 0.1s; }
        .bdo-table tbody tr:hover { background: var(--surface2); }
        .bdo-pri { color: var(--text); font-weight: 600; }
        .bdo-empty { text-align: center; color: var(--text3); padding: 20px; font-size: 10px; font-family: 'JetBrains Mono', monospace; }
        .bdo-view-btn { display: inline-flex; align-items: center; gap: 5px; padding: 5px 11px; border-radius: 7px; background: var(--surface2); border: 1px solid var(--border2); color: var(--text2); font-size: 10px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: 'JetBrains Mono', monospace; }
        .bdo-view-btn:hover { border-color: var(--warning); color: var(--warning); }

        /* ── ACTION BUTTONS ── */
        .action-row { display: flex; gap: 5px; flex-wrap: wrap; }
        .act-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; cursor: pointer; border: 1px solid transparent; transition: all 0.15s; font-family: 'JetBrains Mono', monospace; }
        .act-followup { background: rgba(167,139,250,0.1); color: var(--purple); border-color: rgba(167,139,250,0.2); }
        .act-followup:hover { background: rgba(167,139,250,0.18); }
        .act-walkin { background: rgba(6,182,212,0.1); color: var(--teal); border-color: rgba(6,182,212,0.2); }
        .act-walkin:hover { background: rgba(6,182,212,0.18); }
        .act-done { background: rgba(0,212,170,0.1); color: var(--success); border-color: rgba(0,212,170,0.2); }
        .act-done:hover { background: rgba(0,212,170,0.18); }
        .act-invalid { background: rgba(255,71,87,0.1); color: var(--danger); border-color: rgba(255,71,87,0.2); }
        .act-invalid:hover { background: rgba(255,71,87,0.18); }

        /* Animations */
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeInUp 0.25s ease forwards; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
      `}</style>

      <div className={`bdo-root ${theme}`}>
        <div className="bdo-layout">

          {/* ── SIDEBAR ── */}
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
                { id: 'overview', label: 'Overview',      icon: I.overview },
                { id: 'pending',  label: 'Pending',       icon: I.pending,  badge: pendingMeetings.length > 0 ? pendingMeetings.length : null, badgeCls: '' },
                { id: 'followup', label: 'Follow-up',     icon: I.followup, badge: followUpMeetings.length > 0 ? followUpMeetings.length : null, badgeCls: 'info' },
                { id: 'history',  label: 'All Meetings',  icon: I.history },
              ] as any[]).map(item => (
                <div key={item.id} className={`bdo-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
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

          {/* ── MAIN ── */}
          <main className="bdo-main">

            {/* ── Period filter (shown on all tabs) ── */}
            <div className="period-row">
              {(['daily','weekly','monthly','custom'] as Period[]).map(p => (
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

            {/* ── Alerts ── */}
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

            {/* ════ OVERVIEW ════ */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <div className="bdo-topbar">
                  <div>
                    <div className="bdo-page-title">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {currentUser?.name?.split(' ')[0] || 'BDO'}</div>
                    <div className="bdo-page-sub">// {period} view · {from} → {to}</div>
                  </div>
                  <div className="bdo-clock">{clock}</div>
                </div>

                {/* KPI Row */}
                <div className="kpi-row">
                  {[
                    { label: 'Total Meetings', val: stats.total,       color: 'var(--warning)' },
                    { label: 'Pending Action', val: stats.pending,     color: 'var(--danger)' },
                    { label: 'Follow-up',      val: stats.followup,    color: 'var(--purple)' },
                    { label: 'Walk-in Done',   val: stats.walkInDone,  color: 'var(--teal)' },
                  ].map((k, ki) => (
                    <div key={k.label} className="kpi-card">
                      <div className="kpi-label">{k.label}</div>
                      <div className="kpi-val" style={{ color: k.color }}>{k.val}</div>
                      <div className="kpi-spark"><Sparkline data={dailyTrend} color={k.color} /></div>
                    </div>
                  ))}
                </div>

                <div className="two-col">
                  {/* Meeting status donut */}
                  <div className="bdo-card">
                    <div className="bdo-card-head">
                      <div>
                        <div className="bdo-card-title">Meeting status breakdown</div>
                        <div className="bdo-card-sub">// {period} · {stats.total} meetings</div>
                      </div>
                    </div>
                    <div className="bdo-card-body">
                      <DonutChart segments={[
                        { label: 'Pending Action', value: stats.pending,      color: 'var(--danger)' },
                        { label: 'Follow-up',      value: stats.followup,     color: 'var(--purple)' },
                        { label: 'Walk-in Done',   value: stats.walkInDone,   color: 'var(--teal)' },
                        { label: 'Walk-in Invalid',value: stats.walkInInvalid, color: 'var(--orange)' },
                        { label: 'Not Done',       value: stats.notDone,      color: '#ff4757' },
                        { label: 'Scheduled',      value: stats.scheduled,    color: 'var(--accent)' },
                      ]} />
                    </div>
                  </div>

                  {/* Walk-in bar chart */}
                  <div className="bdo-card">
                    <div className="bdo-card-head">
                      <div>
                        <div className="bdo-card-title">Walk-in activity</div>
                        <div className="bdo-card-sub">// period breakdown</div>
                      </div>
                    </div>
                    <div className="bdo-card-body">
                      <BarChart
                        data={[
                          { label: 'Total', value: stats.walkInTotal },
                          { label: 'Done',  value: stats.walkInDone },
                          { label: 'Invalid', value: stats.walkInInvalid },
                          { label: 'Pending',  value: stats.walkInTotal - stats.walkInDone - stats.walkInInvalid },
                        ]}
                        colors={['var(--warning)', 'var(--teal)', 'var(--danger)', 'var(--purple)']}
                      />
                      <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {[
                          { l: 'Walk-in rate', v: `${stats.total > 0 ? Math.round(stats.walkInTotal/stats.total*100) : 0}%`, c: 'var(--warning)' },
                          { l: 'Done rate',    v: `${stats.walkInTotal > 0 ? Math.round(stats.walkInDone/stats.walkInTotal*100) : 0}%`, c: 'var(--teal)' },
                        ].map(item => (
                          <div key={item.l} style={{ background: 'var(--bg3)', borderRadius: '7px', padding: '8px 10px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", marginBottom: '3px' }}>{item.l.toUpperCase()}</div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: item.c, fontFamily: "'JetBrains Mono', monospace" }}>{item.v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity trend */}
                <div className="bdo-card">
                  <div className="bdo-card-head">
                    <div>
                      <div className="bdo-card-title">Activity trend</div>
                      <div className="bdo-card-sub">// daily meeting count · {dailyTrend.length} days</div>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace' " }}>Peak: {Math.max(...dailyTrend)} · Avg: {dailyTrend.length ? (dailyTrend.reduce((a,b) => a+b,0)/dailyTrend.length).toFixed(1) : 0}</span>
                  </div>
                  <div className="bdo-card-body" style={{ paddingBottom: '10px' }}>
                    {/* Full-width trend chart */}
                    <div style={{ height: '70px', position: 'relative' }}>
                      {(() => {
                        const data = dailyTrend;
                        const max = Math.max(...data, 1);
                        const W = 600, H = 60;
                        const pts = data.map((v, i) => `${(i/(data.length-1||1))*W},${H-(v/max)*(H-6)-3}`).join(' ');
                        const area = `0,${H} ${pts} ${W},${H}`;
                        return (
                          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="70" preserveAspectRatio="none" style={{ display: 'block' }}>
                            <defs>
                              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--warning)" stopOpacity="0.2"/>
                                <stop offset="100%" stopColor="var(--warning)" stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                            <polygon points={area} fill="url(#trendGrad)" />
                            <polyline points={pts} fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinejoin="round" />
                            {data.map((v, i) => <circle key={i} cx={(i/(data.length-1||1))*W} cy={H-(v/max)*(H-6)-3} r="3" fill="var(--warning)" />)}
                          </svg>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Today's meetings */}
                <div className="bdo-card">
                  <div className="bdo-card-head">
                    <div>
                      <div className="bdo-card-title">Today's meetings</div>
                      <div className="bdo-card-sub">// {todayStr}</div>
                    </div>
                    <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.1)', color: 'var(--warning)', padding: '2px 8px', borderRadius: '5px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, border: '1px solid rgba(245,158,11,0.2)' }}>
                      {allMyMeetings.filter((m: Meeting) => m.date === today).length} today
                    </span>
                  </div>
                  <table className="bdo-table">
                    <thead><tr><th>Client</th><th>Time</th><th>BDM</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {allMyMeetings.filter((m: Meeting) => m.date === today).map((m: Meeting) => renderMeetingRow(m, true))}
                      {allMyMeetings.filter((m: Meeting) => m.date === today).length === 0 && <tr><td colSpan={6} className="bdo-empty">No meetings today</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════ PENDING ════ */}
            {activeTab === 'pending' && (
              <div className="fade-in">
                <div className="bdo-topbar">
                  <div>
                    <div className="bdo-page-title">Pending Meetings</div>
                    <div className="bdo-page-sub">// {pendingMeetings.length} meetings awaiting your action</div>
                  </div>
                  <div className="bdo-clock">{clock}</div>
                </div>

                {pendingMeetings.length === 0 ? (
                  <div className="bdo-card">
                    <div className="bdo-card-body" style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                      all caught up — no pending meetings
                    </div>
                  </div>
                ) : (
                  <div className="bdo-card">
                    <div className="bdo-card-head">
                      <div className="bdo-card-title">Action required ({pendingMeetings.length})</div>
                    </div>
                    <table className="bdo-table">
                      <thead><tr><th>Client</th><th>Date · Time</th><th>Phone</th><th>BDM</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {pendingMeetings.map((m: Meeting) => {
                          const lead = leads.find((l: any) => l.id === m.leadId);
                          const bdm  = users.find((u: any) => u.id === m.bdmId);
                          return (
                            <tr key={m.id}>
                              <td className="bdo-td bdo-pri">
                                <div>{m.clientName || lead?.clientName || '—'}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>₹{lead?.loanRequirement}</div>
                              </td>
                              <td className="bdo-td">
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>{m.date}</div>
                                <div style={{ fontSize: '10px', color: 'var(--warning)', fontFamily: "'JetBrains Mono', monospace" }}>{m.timeSlot}</div>
                              </td>
                              <td className="bdo-td" style={{ fontSize: '11px', color: 'var(--text2)' }}>{lead?.phoneNumber || '—'}</td>
                              <td className="bdo-td" style={{ fontSize: '11px' }}>{bdm?.name || '—'}</td>
                              <td className="bdo-td">
                                <span style={{ fontSize: '10px', background: 'var(--surface2)', color: 'var(--text2)', padding: '2px 7px', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{m.meetingType}</span>
                              </td>
                              <td className="bdo-td"><StatusBadge status={m.status} /></td>
                              <td className="bdo-td">
                                <div className="action-row">
                                  <button className="act-btn act-followup" onClick={() => handleFollowUp(m.id)}>
                                    {I.followup} Follow-up
                                  </button>
                                  <button className="act-btn act-walkin" onClick={() => setInfoMeeting(m)}>
                                    {I.walk} Walk-in
                                  </button>
                                  <button className="bdo-view-btn" onClick={() => setInfoMeeting(m)}>
                                    {I.eye} View
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

            {/* ════ FOLLOW-UP ════ */}
            {activeTab === 'followup' && (
              <div className="fade-in">
                <div className="bdo-topbar">
                  <div>
                    <div className="bdo-page-title">Follow-up Meetings</div>
                    <div className="bdo-page-sub">// {followUpMeetings.length} follow-ups · set walk-in dates · mark outcomes</div>
                  </div>
                  <div className="bdo-clock">{clock}</div>
                </div>

                {followUpMeetings.length === 0 ? (
                  <div className="bdo-card">
                    <div className="bdo-card-body" style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
                      no follow-up meetings
                    </div>
                  </div>
                ) : (
                  <div className="bdo-card">
                    <div className="bdo-card-head">
                      <div className="bdo-card-title">Follow-up action required ({followUpMeetings.length})</div>
                    </div>
                    <table className="bdo-table">
                      <thead><tr><th>Client</th><th>Date · Time</th><th>Phone</th><th>BDM</th><th>Walk-in Date</th><th>Walk-in Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {followUpMeetings.map((m: Meeting) => {
                          const lead = leads.find((l: any) => l.id === m.leadId);
                          const bdm  = users.find((u: any) => u.id === m.bdmId);
                          const walkinDate = walkinDateMap[m.id] || m.walkinDate || '';
                          const isOverdue = walkinDate && walkinDate < today;
                          return (
                            <tr key={m.id} style={{ background: isOverdue ? 'rgba(255,71,87,0.04)' : undefined }}>
                              <td className="bdo-td bdo-pri">
                                <div>{m.clientName || lead?.clientName || '—'}</div>
                                <div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>₹{lead?.loanRequirement}</div>
                              </td>
                              <td className="bdo-td">
                                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>{m.date}</div>
                                <div style={{ fontSize: '10px', color: 'var(--warning)', fontFamily: "'JetBrains Mono', monospace" }}>{m.timeSlot}</div>
                              </td>
                              <td className="bdo-td" style={{ fontSize: '11px', color: 'var(--text2)' }}>{lead?.phoneNumber || '—'}</td>
                              <td className="bdo-td" style={{ fontSize: '11px' }}>{bdm?.name || '—'}</td>
                              <td className="bdo-td">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <input
                                    type="date"
                                    value={walkinDate}
                                    onChange={e => handleSetWalkinDate(m.id, e.target.value)}
                                    style={{ background: 'var(--bg3)', border: `1px solid ${isOverdue ? 'var(--danger)' : 'var(--border2)'}`, borderRadius: '6px', padding: '4px 7px', color: 'var(--text)', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", outline: 'none', width: '130px' }}
                                  />
                                  {isOverdue && <span style={{ fontSize: '9px', color: 'var(--danger)', fontFamily: "'JetBrains Mono', monospace" }}>⚠ Overdue</span>}
                                </div>
                              </td>
                              <td className="bdo-td">
                                {m.walkingStatus
                                  ? <StatusBadge status={m.walkingStatus} />
                                  : <span style={{ color: 'var(--text3)', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace" }}>Not set</span>}
                              </td>
                              <td className="bdo-td">
                                <div className="action-row">
                                  {!m.walkingStatus && walkinDate && (
                                    <button className="act-btn act-done" onClick={() => handleWalkingDone(m)}>
                                      {I.check} Walk Done
                                    </button>
                                  )}
                                  <button className="act-btn act-invalid" onClick={() => handleWalkingInvalid(m.id)}>
                                    {I.invalid} Invalid
                                  </button>
                                  <button className="bdo-view-btn" onClick={() => setInfoMeeting(m)}>
                                    {I.eye} View
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

            {/* ════ HISTORY ════ */}
            {activeTab === 'history' && (
              <div className="fade-in">
                <div className="bdo-topbar">
                  <div>
                    <div className="bdo-page-title">All Meetings</div>
                    <div className="bdo-page-sub">// {filteredMeetings.length} meetings · {from} → {to}</div>
                  </div>
                  <div className="bdo-clock">{clock}</div>
                </div>

                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '10px', marginBottom: '14px' }}>
                  {[
                    { l: 'Total',         v: stats.total,         c: 'var(--warning)' },
                    { l: 'Walk-in Done',  v: stats.walkInDone,    c: 'var(--teal)' },
                    { l: 'Walk-in Invalid',v: stats.walkInInvalid, c: 'var(--danger)' },
                    { l: 'Not Done',      v: stats.notDone,       c: 'var(--danger)' },
                  ].map(k => (
                    <div key={k.l} className="kpi-card" style={{ padding: '13px' }}>
                      <div className="kpi-label">{k.l}</div>
                      <div className="kpi-val" style={{ color: k.c, fontSize: '26px' }}>{k.v}</div>
                    </div>
                  ))}
                </div>

                <div className="bdo-card">
                  <div className="bdo-card-head"><div className="bdo-card-title">Meeting history ({filteredMeetings.length})</div></div>
                  <table className="bdo-table">
                    <thead><tr><th>Client</th><th>Date · Time</th><th>Phone</th><th>BDM</th><th>Type</th><th>Status</th><th>Walk-in Status</th><th>Walk-in Date</th><th>Action</th></tr></thead>
                    <tbody>
                      {filteredMeetings.slice().sort((a: Meeting, b: Meeting) => b.date.localeCompare(a.date)).map((m: Meeting) => {
                        const lead = leads.find((l: any) => l.id === m.leadId);
                        const bdm  = users.find((u: any) => u.id === m.bdmId);
                        return (
                          <tr key={m.id}>
                            <td className="bdo-td bdo-pri">
                              <div>{m.clientName || lead?.clientName}</div>
                              <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>₹{lead?.loanRequirement}</div>
                            </td>
                            <td className="bdo-td">
                              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>{m.date}</div>
                              <div style={{ fontSize: '10px', color: 'var(--warning)', fontFamily: "'JetBrains Mono', monospace" }}>{m.timeSlot}</div>
                            </td>
                            <td className="bdo-td" style={{ fontSize: '11px', color: 'var(--text2)' }}>{lead?.phoneNumber || '—'}</td>
                            <td className="bdo-td" style={{ fontSize: '11px' }}>{bdm?.name || '—'}</td>
                            <td className="bdo-td">
                              <span style={{ fontSize: '10px', background: 'var(--surface2)', color: 'var(--text2)', padding: '2px 7px', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{m.meetingType}</span>
                            </td>
                            <td className="bdo-td">
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <StatusBadge status={m.status} />
                                {m.bdoStatus && <StatusBadge status={m.bdoStatus} />}
                              </div>
                            </td>
                            <td className="bdo-td">
                              {m.walkingStatus ? <StatusBadge status={m.walkingStatus} /> : <span style={{ color: 'var(--text3)', fontSize: '10px' }}>—</span>}
                            </td>
                            <td className="bdo-td" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>
                              {m.walkinDate || '—'}
                            </td>
                            <td className="bdo-td">
                              <button className="bdo-view-btn" onClick={() => setInfoMeeting(m)}>{I.eye} View</button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredMeetings.length === 0 && <tr><td colSpan={9} className="bdo-empty">No meetings in this period</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ── Meeting Detail Dialog ── */}
      <MeetingDetailDialog
        isOpen={!!infoMeeting}
        meeting={infoMeeting}
        onClose={() => setInfoMeeting(null)}
        onHandleConverted={() => {}}
        onHandleFollowUp={handleFollowUp}
        onHandleSetWalkinDate={handleSetWalkinDate}
        onHandleWalkingDone={handleWalkingDone}
        onHandleWalkingInvalid={handleWalkingInvalid}
      />
    </>
  );
}