// import React from "react";
// import { useState, useMemo, useRef, useEffect } from 'react';
// import { useCRM } from '@/contexts/CRMContext';
// import { supabase } from '@/integrations/supabase/client';
// import { useLoading } from '@/hooks/use-loading';
// import DashboardLayout, { LayoutDashboard, Users, Upload, Calendar, UserCircle, BarChart3, FolderOpen, Briefcase } from '@/components/DashboardLayout';
// import StatCard from '@/components/StatCard';
// import DateRangeFilter from '@/components/DateRangeFilter';
// import DetailDataTable from '@/components/DetailDataTable';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
// import { Switch } from '@/components/ui/switch';
// import { toast } from 'sonner';
// import { User, Lead, UserRole, NumberStatus, LeadStatus, DuplicateLead } from '@/types/crm';
// import { Plus, Trash2, Upload as UploadIcon, ChevronDown, ChevronRight, Edit2, UserPlus, UserMinus, Download, ClipboardPaste, Footprints, Eye, GitMerge, AlertTriangle } from 'lucide-react';
// import * as XLSX from 'xlsx';
// import { DoubleConfirmModal } from '@/components/ui/DoubleConfirmModal';




// const navItems = [
//   { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, id: 'dashboard' },
//   { label: 'User Management', icon: <Users className="w-4 h-4" />, id: 'users' },
//   { label: 'Team Management', icon: <UserCircle className="w-4 h-4" />, id: 'teams' },
//   { label: 'Upload Leads', icon: <Upload className="w-4 h-4" />, id: 'leads' },
//   { label: 'BDM Performance', icon: <BarChart3 className="w-4 h-4" />, id: 'bdm' },
//   { label: 'BDO Performance', icon: <Briefcase className="w-4 h-4" />, id: 'bdo' },
//   { label: 'Duplicate Leads', icon: <FolderOpen className="w-4 h-4" />, id: 'duplicates' },
// ];

// export default function FMDashboard() {
//   const { users, leads, teams, meetings, duplicateLeads, addUser, updateUser, removeUser, addLeads, addTeam, updateTeam, updateTeamMembers, deleteTeam, deleteDuplicateLead, mergeDuplicateLead } = useCRM();
//   // loader
//   const { withLoading, isLoading } = useLoading();
//   const [activeTab, setActiveTab] = useState('dashboard');
//   const [expandedTC, setExpandedTC] = useState<string | null>(null);
//   const [showConnectedDetail, setShowConnectedDetail] = useState<string | null>(null);
//   const [detailView, setDetailView] = useState<string | null>(null);
//   const [fromDate, setFromDate] = useState<Date | undefined>();
//   const [toDate, setToDate] = useState<Date | undefined>();
//   // green dot online status
//   const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

//   useEffect(() => {
//     const channel = supabase.channel('online-users')
//       .on('presence', { event: 'sync' }, () => {
//         const state = channel.presenceState<{ userId: string }>();
//         const ids = new Set(Object.values(state).flat().map((p) => p.userId));
//         setOnlineUserIds(ids);
//       })
//       .subscribe();
//     return () => { supabase.removeChannel(channel); };
//   }, []);

//   // User mgmt state
//   const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'BO' as UserRole, tcId: '' });
//   const [showAddUser, setShowAddUser] = useState(false);
//   const [editingUser, setEditingUser] = useState<string | null>(null);
//   const [editRole, setEditRole] = useState<UserRole>('BO');
//   const [editTCId, setEditTCId] = useState('');

//   // Lead upload state
//   const [leadInput, setLeadInput] = useState({ clientName: '', phoneNumber: '', loanRequirement: '' });
//   const [selectedBOs, setSelectedBOs] = useState<string[]>([]);
//   // Delete modal state
//   const [userToDelete, setUserToDelete] = useState<string | null>(null);
//   const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [pasteData, setPasteData] = useState('');

//   // Duplicate leads state
//   const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateLead | null>(null);
//   const [duplicateToDelete, setDuplicateToDelete] = useState<string | null>(null);
//   const [duplicateToMerge, setDuplicateToMerge] = useState<DuplicateLead | null>(null);

//   // Pre-save upload confirmation state
//   const [pendingUpload, setPendingUpload] = useState<{
//     newLeads: Lead[];
//     dupes: DuplicateLead[];
//     isManual: boolean;
//   } | null>(null);

//   // Team management state
//   const [showCreateTeam, setShowCreateTeam] = useState(false);
//   const [newTeamName, setNewTeamName] = useState('');
//   const [newTeamTC, setNewTeamTC] = useState('');
//   const [newTeamBOs, setNewTeamBOs] = useState<string[]>([]);
//   const [editingTeam, setEditingTeam] = useState<string | null>(null);
//   const [changeTCTeamId, setChangeTCTeamId] = useState<string | null>(null);
//   const [newTCForTeam, setNewTCForTeam] = useState('');

//   const bos = users.filter(u => u.role === 'BO' && u.active);
//   const tcs = users.filter(u => u.role === 'TC' && u.active);
//   const bdms = users.filter(u => u.role === 'BDM' && u.active);
//   const bdos = users.filter(u => u.role === 'BDO' && u.active);
//   const assignedBOIds = teams.flatMap(t => t.boIds);
//   const unassignedBOs = bos.filter(b => !assignedBOIds.includes(b.id));

//   const filteredLeads = useMemo(() => {
//     let filtered = leads;
//     if (fromDate) { const from = fromDate.toISOString().split('T')[0]; filtered = filtered.filter(l => l.assignedDate >= from); }
//     if (toDate) { const to = toDate.toISOString().split('T')[0]; filtered = filtered.filter(l => l.assignedDate <= to); }
//     return filtered;
//   }, [leads, fromDate, toDate]);

//   const filteredMeetings = useMemo(() => {
//     let filtered = meetings;
//     if (fromDate) { const from = fromDate.toISOString().split('T')[0]; filtered = filtered.filter(m => m.date >= from); }
//     if (toDate) { const to = toDate.toISOString().split('T')[0]; filtered = filtered.filter(m => m.date <= to); }
//     return filtered;
//   }, [meetings, fromDate, toDate]);

//   const getLeadsForBO = (boId: string) => filteredLeads.filter(l => l.assignedBOId === boId);
//   const getNumberStatusCount = (boLeads: Lead[], status: NumberStatus) => boLeads.filter(l => l.numberStatus === status).length;
//   const getLeadStatusCount = (boLeads: Lead[], status: LeadStatus) => boLeads.filter(l => l.leadStatus === status).length;

//   // Walking meetings count
//   const walkinMeetings = filteredMeetings.filter(m => m.meetingType === 'Walk-in' && (m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up'));

//   const handleAddUser = async () => {
//     if (!newUser.name || !newUser.username || !newUser.password) {
//       toast.error('Fill all fields')
//       return
//     }
//     if (users.find(u => u.username === newUser.username)) {
//       toast.error('Username already exists')
//       return
//     }

//     try {
//       const user: User = {
//         id: crypto.randomUUID(),
//         name: newUser.name,
//         username: newUser.username,
//         role: newUser.role,
//         active: true,
//       }

//       if (newUser.role === 'BO' && newUser.tcId) {
//         const team = teams.find(t => t.tcId === newUser.tcId)
//         if (team) {
//           user.teamId = team.id
//           await updateTeamMembers(team.id, [...team.boIds, user.id])
//         }
//       }

//       if (newUser.role === 'TC') {
//         const teamId = `team_${Date.now()}`
//         user.teamId = teamId
//         await addTeam({ id: teamId, name: `${newUser.name}'s Team`, tcId: user.id, boIds: [] })
//       }

//       await addUser(user, newUser.password)  // ← password bhi pass karo
//       setNewUser({ name: '', username: '', password: '', role: 'BO', tcId: '' })
//       toast.success('User added successfully')
//     } catch (err) {
//       toast.error('Failed to create user')
//     }
//   }

//   const handleEditRole = async (userId: string) => {
//     await updateUser(userId, { role: editRole });
//     if (editRole === 'BO' && editTCId) {
//       for (const t of teams) {
//         if (t.boIds.includes(userId)) {
//           await updateTeamMembers(t.id, t.boIds.filter(id => id !== userId));
//         }
//       }
//       const targetTeam = teams.find(t => t.tcId === editTCId);
//       if (targetTeam) {
//         await updateTeamMembers(targetTeam.id, [...targetTeam.boIds, userId]);
//       }
//     }
//     setEditingUser(null);
//     toast.success('User updated');
//   };

//   // Process leads from rows
//   const processLeadRows = async (rows: any[]) => {
//     if (selectedBOs.length === 0) { toast.error('Select at least one BO for distribution'); return; }
//     let added = 0;
//     const today = new Date().toISOString().split('T')[0];
//     const newLeads: Lead[] = [];
//     const dupes: DuplicateLead[] = [];

//     rows.forEach((row: any, idx: number) => {
//       const clientName = row['Client Name'] || row['client_name'] || row['Name'] || row['name'] || '';
//       // Strip all non-digit characters from phone number
//       const rawPhone = String(row['Phone Number'] || row['phone_number'] || row['Phone'] || row['phone'] || '').trim();
//       const phoneNumber = rawPhone.replace(/\D/g, '');
//       const loanRequirement = String(row['Loan Requirement'] || row['loan_requirement'] || row['Loan Amount'] || row['amount'] || row['Loan Requirement Amount'] || '');
//       if (!clientName || !phoneNumber) return;

//       const existing = leads.find(l => l.phoneNumber === phoneNumber) || newLeads.find(l => l.phoneNumber === phoneNumber);
//       if (existing) {
//         const bo = users.find(u => u.id === existing.assignedBOId);
//         dupes.push({
//           id: crypto.randomUUID(), clientName, phoneNumber, loanRequirement,
//           originalLeadId: existing.id, originalBoName: bo?.name || 'Unknown',
//           uploadedBy: users.find(u => u.id === undefined)?.name, uploadedAt: new Date().toISOString(),
//         });
//         return;
//       }

//       const boId = selectedBOs[added % selectedBOs.length];
//       newLeads.push({
//         id: `l${Date.now()}_${idx}`, clientName, phoneNumber, loanRequirement,
//         numberStatus: '', leadStatus: '', leadType: '', assignedBOId: boId,
//         assignedDate: today, meetingRequested: false, meetingApproved: false,
//       });
//       added++;
//     });

//     if (newLeads.length === 0 && dupes.length === 0) {
//       toast.error('No valid data found');
//       return;
//     }

//     if (dupes.length > 0) {
//       // Show confirmation popup before saving
//       setPendingUpload({ newLeads, dupes, isManual: false });
//     } else {
//       // No duplicates, safe to add immediately
//       await addLeads(newLeads);
//       toast.success(`${added} leads uploaded successfully.`);
//     }
//   };

//   // Excel upload
//   const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = async (evt) => {
//       const data = evt.target?.result;
//       const workbook = XLSX.read(data, { type: 'binary' });
//       const sheet = workbook.Sheets[workbook.SheetNames[0]];
//       const rows = XLSX.utils.sheet_to_json<any>(sheet);
//       await processLeadRows(rows);
//     };
//     reader.readAsBinaryString(file);
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   };

//   // Paste from Excel
//   const handlePasteImport = async () => {
//     if (!pasteData.trim()) { toast.error('Paste data first'); return; }
//     const lines = pasteData.trim().split('\n');
//     if (lines.length < 2) { toast.error('Need header row + data'); return; }

//     const headers = lines[0].split('\t').map(h => h.trim());
//     const rows = lines.slice(1).map(line => {
//       const vals = line.split('\t');
//       const obj: any = {};
//       headers.forEach((h, i) => { obj[h] = vals[i]?.trim() || ''; });
//       return obj;
//     });
//     await processLeadRows(rows);
//     setPasteData('');
//   };

//   const handleAddLead = async () => {
//     if (!leadInput.clientName || !leadInput.phoneNumber || !leadInput.loanRequirement) { toast.error('Fill all fields'); return; }
//     if (!/^\d+$/.test(leadInput.phoneNumber)) { toast.error('Phone number must contain digits only'); return; }
//     if (selectedBOs.length === 0) { toast.error('Select at least one BO'); return; }

//     const duplicate = leads.find(l => l.phoneNumber === leadInput.phoneNumber);
//     if (duplicate) {
//       const assignedBO = users.find(u => u.id === duplicate.assignedBOId);

//       const dupeObj: DuplicateLead = {
//         id: crypto.randomUUID(),
//         clientName: leadInput.clientName,
//         phoneNumber: leadInput.phoneNumber,
//         loanRequirement: leadInput.loanRequirement,
//         originalLeadId: duplicate.id,
//         originalBoName: assignedBO?.name || 'Unknown',
//         uploadedBy: users.find(u => u.id === undefined)?.name,
//         uploadedAt: new Date().toISOString()
//       };

//       // Detected duplicate, prompt for confirmation instead of rejecting
//       setPendingUpload({ newLeads: [], dupes: [dupeObj], isManual: true });
//       return;
//     }

//     const boId = selectedBOs[Math.floor(Math.random() * selectedBOs.length)];
//     const today = new Date().toISOString().split('T')[0];
//     await addLeads([{
//       id: `l${Date.now()}`, clientName: leadInput.clientName, phoneNumber: leadInput.phoneNumber,
//       loanRequirement: leadInput.loanRequirement, numberStatus: '', leadStatus: '', leadType: '',
//       assignedBOId: boId, assignedDate: today, meetingRequested: false, meetingApproved: false,
//     }]);
//     setLeadInput({ clientName: '', phoneNumber: '', loanRequirement: '' });
//     toast.success(`Lead assigned to ${users.find(u => u.id === boId)?.name}`);
//   };

//   const handleCreateTeam = async () => {
//     if (!newTeamName || !newTeamTC) { toast.error('Enter team name and select TC'); return; }
//     const teamId = `team_${Date.now()}`;
//     await addTeam({ id: teamId, name: newTeamName, tcId: newTeamTC, boIds: newTeamBOs });
//     await updateUser(newTeamTC, { teamId: teamId });
//     for (const boId of newTeamBOs) {
//       await updateUser(boId, { teamId: teamId });
//     }
//     setNewTeamName(''); setNewTeamTC(''); setNewTeamBOs([]); setShowCreateTeam(false);
//     toast.success('Team created');
//   };

//   const handleAddBOToTeam = async (teamId: string, boId: string) => {
//     const team = teams.find(t => t.id === teamId);
//     if (!team) return;
//     for (const t of teams) {
//       if (t.boIds.includes(boId)) {
//         await updateTeamMembers(t.id, t.boIds.filter(id => id !== boId));
//       }
//     }
//     await updateTeamMembers(teamId, [...team.boIds.filter(id => id !== boId), boId]);
//     await updateUser(boId, { teamId });
//     toast.success('BO added to team');
//   };

//   const handleRemoveBOFromTeam = async (teamId: string, boId: string) => {
//     const team = teams.find(t => t.id === teamId);
//     if (!team) return;
//     await updateTeamMembers(teamId, team.boIds.filter(id => id !== boId));
//     await updateUser(boId, { teamId: undefined });
//     toast.success('BO removed from team');
//   };

//   const handleChangeTC = async (teamId: string) => {
//     if (!newTCForTeam) { toast.error('Select a TC'); return; }
//     await updateTeam(teamId, { tcId: newTCForTeam });
//     await updateUser(newTCForTeam, { teamId });
//     setChangeTCTeamId(null);
//     setNewTCForTeam('');
//     toast.success('TC changed');
//   };

//   const getDetailData = () => {
//     switch (detailView) {
//       case 'total': return { title: 'Total Leads', data: filteredLeads };
//       case 'connected': return { title: 'Connected Leads', data: filteredLeads.filter(l => l.numberStatus === 'Connected') };
//       case 'not_connected': return { title: 'Not Connected Leads', data: filteredLeads.filter(l => l.numberStatus === 'Not Connected') };
//       case 'mobile_off': return { title: 'Mobile Off', data: filteredLeads.filter(l => l.numberStatus === 'Mobile Off') };
//       case 'incoming_barred': return { title: 'Incoming Barred', data: filteredLeads.filter(l => l.numberStatus === 'Incoming Barred') };
//       case 'invalid_number': return { title: 'Invalid Number', data: filteredLeads.filter(l => l.numberStatus === 'Invalid Number') };
//       case 'interested': return { title: 'Interested', data: filteredLeads.filter(l => l.leadStatus === 'Interested') };
//       case 'not_interested': return { title: 'Not Interested', data: filteredLeads.filter(l => l.leadStatus === 'Not Interested') };
//       case 'pending': return { title: 'Pending', data: filteredLeads.filter(l => l.leadStatus === 'Pending') };
//       case 'eligible': return { title: 'Eligible', data: filteredLeads.filter(l => l.leadStatus === 'Eligible') };
//       case 'not_eligible': return { title: 'Not Eligible', data: filteredLeads.filter(l => l.leadStatus === 'Not Eligible') };
//       case 'language_barrier': return { title: 'Language Barrier', data: filteredLeads.filter(l => l.leadStatus === 'Language Barrier') };
//       case 'total_bos': return { title: 'All Business Officers', data: filteredLeads };
//       case 'total_meetings': return { title: 'All Meetings', data: filteredLeads, meetings: filteredMeetings };
//       case 'walkin': return { title: 'Walk-in Meetings', data: filteredLeads, meetings: walkinMeetings };
//       default: return null;
//     }
//   };

//   // Dashboard filters
//   const [selectedTC, setSelectedTC] = useState('');
//   const [selectedMeetingStatus, setSelectedMeetingStatus] = useState('');

//   // dashMeetings: filtered by TC + meeting status + date
//   const dashMeetings = useMemo(() => {
//     let m = filteredMeetings;
//     if (selectedMeetingStatus) m = m.filter(mt => mt.status === selectedMeetingStatus);
//     if (selectedTC) {
//       const team = teams.find(t => t.tcId === selectedTC);
//       if (team) {
//         const tcBoIds = new Set(team.boIds);
//         m = m.filter(mt => tcBoIds.has(mt.boId));
//       }
//     }
//     return m;
//   }, [filteredMeetings, selectedTC, selectedMeetingStatus, teams]);

//   return (
//     <DashboardLayout navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
//       {activeTab === 'dashboard' && (
//         <div className="space-y-6">

//           {/* ── Header + Filters ── */}
//           <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
//             <div>
//               <h2 className="text-2xl font-display font-bold text-foreground">Performance Dashboard</h2>
//               <p className="text-sm text-muted-foreground mt-1">Real-time performance metrics and Meeting distribution</p>
//             </div>
//             <div className="flex flex-wrap items-end gap-4">
//               <div>
//                 <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Team Captain</label>
//                 <select className="block w-40 pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" value={selectedTC} onChange={e => setSelectedTC(e.target.value)}>
//                   <option value="">All Captains</option>
//                   {tcs.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Meeting Status</label>
//                 <select className="block w-40 pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" value={selectedMeetingStatus} onChange={e => setSelectedMeetingStatus(e.target.value)}>
//                   <option value="">All Statuses</option>
//                   {['Scheduled', 'Meeting Done', 'Not Done', 'Pending', 'Reject', 'Converted', 'Follow-Up'].map(s => <option key={s} value={s}>{s}</option>)}
//                 </select>
//               </div>
//               <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
//             </div>
//           </div>

//           {detailView ? (
//             (() => {
//               const detail = getDetailData();
//               if (!detail) return null;
//               return <DetailDataTable title={detail.title} leads={detail.data} users={users} meetings={detail.meetings} onBack={() => setDetailView(null)} showMeetingDetails={detailView === 'total_meetings' || detailView === 'walkin'} />;
//             })()
//           ) : (
//             <>
//               {/* ── 5 KPI Cards ── */}
//               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
//                 {[
//                   { label: 'Total Meetings', value: dashMeetings.length, border: 'border-l-blue-500', sub: 'vs last month', view: 'total_meetings' },
//                   { label: 'Pending', value: dashMeetings.filter(m => m.status === 'Pending').length, border: 'border-l-amber-500', sub: 'waiting', view: 'total_meetings' },
//                   { label: 'Rejected', value: dashMeetings.filter(m => m.status === 'Reject').length, border: 'border-l-red-500', sub: 'improvement', view: 'total_meetings' },
//                   { label: 'Meeting Done', value: dashMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length, border: 'border-l-blue-400', sub: 'steady', view: 'total_meetings' },
//                   { label: 'Rescheduled', value: dashMeetings.filter(m => m.status === 'Follow-Up').length, border: 'border-l-sky-300', sub: 'follow-up', view: 'total_meetings' },
//                 ].map(card => (
//                   <button key={card.label} onClick={() => setDetailView(card.view)}
//                     className={`bg-card border border-border border-l-4 ${card.border} rounded-xl p-5 text-left hover:shadow-md transition-all`}>
//                     <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.label}</p>
//                     <p className="text-3xl font-extrabold text-foreground mt-2">{card.value.toLocaleString()}</p>
//                     <p className="text-xs text-muted-foreground mt-2">{card.sub}</p>
//                   </button>
//                 ))}
//               </div>

//               {/* ── Main 4-col grid ── */}
//               <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

//                 {/* LEFT 3 cols */}
//                 <div className="xl:col-span-3 space-y-6">

//                   {/* Row 1: Meeting Status Donut + TC Meeting Count Bars */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                     <Card className="md:col-span-1">
//                       <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider">Meeting Status</CardTitle></CardHeader>
//                       <CardContent>
//                         {(() => {
//                           const data = [
//                             { name: 'Pending', value: dashMeetings.filter(m => m.status === 'Pending').length, color: '#f59e0b' },
//                             { name: 'Rejected', value: dashMeetings.filter(m => m.status === 'Reject').length, color: '#ef4444' },
//                             { name: 'Done', value: dashMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length, color: '#3b82f6' },
//                             { name: 'Follow-Up', value: dashMeetings.filter(m => m.status === 'Follow-Up').length, color: '#7dd3fc' },
//                           ].filter(d => d.value > 0);
//                           const total = data.reduce((s, d) => s + d.value, 0);
//                           if (total === 0) return <p className="text-center text-muted-foreground text-sm py-14">No data yet</p>;
//                           let offset = 0;
//                           return (
//                             <div className="flex items-center gap-3 h-44">
//                               <div className="relative w-36 h-36 flex-shrink-0">
//                                 <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
//                                   {data.map((d, i) => { const pct = (d.value / total) * 100; const el = <circle key={i} cx="18" cy="18" r="15.9" fill="none" stroke={d.color} strokeWidth="3.8" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} />; offset += pct; return el; })}
//                                 </svg>
//                                 <div className="absolute inset-0 flex flex-col items-center justify-center">
//                                   <span className="text-lg font-extrabold text-foreground">{total.toLocaleString()}</span>
//                                   <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Total</span>
//                                 </div>
//                               </div>
//                               <div className="flex-1 space-y-2">
//                                 {data.map(d => (
//                                   <div key={d.name} className="flex items-center gap-2 text-xs">
//                                     <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
//                                     <span className="text-muted-foreground flex-1">{d.name}</span>
//                                     <span className="font-bold text-foreground">{d.value}</span>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           );
//                         })()}
//                       </CardContent>
//                     </Card>

//                     <Card className="md:col-span-2">
//                       <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider">Meeting Count - Team Captain</CardTitle></CardHeader>
//                       <CardContent>
//                         {(() => {
//                           const tcData = teams.map(team => {
//                             const tc = users.find(u => u.id === team.tcId);
//                             const tcMeetings = dashMeetings.filter(m => team.boIds.includes(m.boId));
//                             return { name: tc?.name || 'TC', value: tcMeetings.length };
//                           }).filter(t => t.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
//                           if (tcData.length === 0) return <p className="text-center text-muted-foreground text-sm py-14">No TC data yet</p>;
//                           const max = Math.max(...tcData.map(t => t.value), 1);
//                           const colors = ['#3b82f6', '#0ea5e9', '#10b981', '#6366f1', '#f59e0b', '#94a3b8'];
//                           return (
//                             <div className="space-y-3 h-44 overflow-y-auto">
//                               {tcData.map((t, i) => (
//                                 <div key={i} className="flex items-center gap-3">
//                                   <span className="text-xs font-semibold text-foreground w-24 truncate flex-shrink-0">{t.name}</span>
//                                   <div className="flex-1 bg-secondary rounded-full h-3.5">
//                                     <div className="h-3.5 rounded-full" style={{ width: `${(t.value / max) * 100}%`, backgroundColor: colors[i % colors.length] }} />
//                                   </div>
//                                   <span className="text-xs text-muted-foreground w-8 text-right">{t.value}</span>
//                                 </div>
//                               ))}
//                             </div>
//                           );
//                         })()}
//                       </CardContent>
//                     </Card>
//                   </div>

//                   {/* Row 2: BDM Bar Chart + Product Donut */}
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                     <Card className="md:col-span-2">
//                       <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider">Meeting Count - BDM</CardTitle></CardHeader>
//                       <CardContent>
//                         {(() => {
//                           const bdmData = bdms.map(bdm => ({
//                             name: bdm.name.split(' ')[0],
//                             value: dashMeetings.filter(m => m.bdmId === bdm.id).length,
//                           })).filter(b => b.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
//                           if (bdmData.length === 0) return <p className="text-center text-muted-foreground text-sm py-14">No BDM data yet</p>;
//                           const max = Math.max(...bdmData.map(b => b.value), 1);
//                           return (
//                             <div className="flex items-end gap-3 h-40 px-2">
//                               {bdmData.map((b, i) => (
//                                 <div key={i} className="flex flex-col items-center gap-1 flex-1">
//                                   <span className="text-[10px] font-bold text-foreground">{b.value}</span>
//                                   <div className="w-full rounded-t-md bg-indigo-400 dark:bg-indigo-500" style={{ height: `${Math.max((b.value / max) * 100, 8)}%` }} />
//                                   <span className="text-[10px] text-muted-foreground truncate w-full text-center">{b.name}</span>
//                                 </div>
//                               ))}
//                             </div>
//                           );
//                         })()}
//                       </CardContent>
//                     </Card>

//                     <Card className="md:col-span-1">
//                       <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider">Product Distribution</CardTitle></CardHeader>
//                       <CardContent>
//                         {(() => {
//                           const productMap: Record<string, number> = {};
//                           dashMeetings.forEach(m => { if (m.productType) productMap[m.productType] = (productMap[m.productType] || 0) + 1; });
//                           const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#94a3b8'];
//                           const data = Object.entries(productMap).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
//                           const total = data.reduce((s, d) => s + d.value, 0);
//                           if (total === 0) return <p className="text-center text-muted-foreground text-sm py-14">No product data yet</p>;
//                           let offset = 0;
//                           return (
//                             <div className="flex flex-col items-center gap-3 h-40 justify-center">
//                               <div className="relative w-28 h-28">
//                                 <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
//                                   {data.map((d, i) => { const pct = (d.value / total) * 100; const el = <circle key={i} cx="18" cy="18" r="15.9" fill="none" stroke={d.color} strokeWidth="3.8" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} />; offset += pct; return el; })}
//                                 </svg>
//                               </div>
//                               <div className="w-full space-y-1">
//                                 {data.map(d => (
//                                   <div key={d.name} className="flex items-center gap-1.5 text-xs">
//                                     <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
//                                     <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
//                                     <span className="font-bold">{d.value}</span>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           );
//                         })()}
//                       </CardContent>
//                     </Card>
//                   </div>

//                   {/* ── BDM-wise Performance Table ── */}
//                   <Card>
//                     <CardHeader className="pb-3"><CardTitle className="text-xs font-bold uppercase tracking-wider">BDM-wise Performance</CardTitle></CardHeader>
//                     <CardContent>
//                       <div className="overflow-x-auto">
//                         <table className="min-w-full divide-y divide-border">
//                           <thead>
//                             <tr className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
//                               <th className="px-4 py-3 text-left">BDM Name</th>
//                               <th className="px-4 py-3 text-left">Total Meeting</th>
//                               <th className="px-4 py-3 text-left">Pending Meeting</th>
//                               <th className="px-4 py-3 text-left">Walk-in</th>
//                               <th className="px-4 py-3 text-left">Mini-Login</th>
//                               <th className="px-4 py-3 text-left">Walking Rate</th>
//                               <th className="px-4 py-3 text-left">Login Rate</th>
//                             </tr>
//                           </thead>
//                           <tbody className="divide-y divide-border text-sm">
//                             {bdms.map(bdm => {
//                               const bdmMtgs = dashMeetings.filter(m => m.bdmId === bdm.id);
//                               if (bdmMtgs.length === 0) return null;
//                               const pending = bdmMtgs.filter(m => m.status === 'Pending').length;
//                               const walkin = bdmMtgs.filter(m => m.meetingType === 'Walk-in').length;
//                               const mini = bdmMtgs.filter(m => m.miniLogin).length;
//                               const walkRate = Math.round((walkin / bdmMtgs.length) * 100);
//                               const loginRate = Math.round((mini / bdmMtgs.length) * 100);
//                               return (
//                                 <tr key={bdm.id} className="hover:bg-secondary/30 transition-colors">
//                                   <td className="px-4 py-4 font-medium text-foreground">{bdm.name}</td>
//                                   <td className="px-4 py-4 text-muted-foreground">{bdmMtgs.length}</td>
//                                   <td className="px-4 py-4 text-muted-foreground">{pending}</td>
//                                   <td className="px-4 py-4 text-muted-foreground">{walkin}</td>
//                                   <td className="px-4 py-4 text-muted-foreground">{mini}</td>
//                                   <td className="px-4 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">{walkRate}%</span></td>
//                                   <td className="px-4 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">{loginRate}%</span></td>
//                                 </tr>
//                               );
//                             })}
//                             {bdms.filter(b => dashMeetings.filter(m => m.bdmId === b.id).length > 0).length === 0 && (
//                               <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No BDM data yet</td></tr>
//                             )}
//                           </tbody>
//                         </table>
//                       </div>
//                     </CardContent>
//                   </Card>

//                   {/* ── TC-wise Performance Table ── */}
//                   <Card>
//                     <CardHeader className="pb-3"><CardTitle className="text-xs font-bold uppercase tracking-wider">TC-wise Performance</CardTitle></CardHeader>
//                     <CardContent>
//                       <div className="overflow-x-auto">
//                         <table className="min-w-full divide-y divide-border">
//                           <thead>
//                             <tr className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
//                               <th className="px-4 py-3 text-left">TC Name</th>
//                               <th className="px-4 py-3 text-left">No. of BO</th>
//                               <th className="px-4 py-3 text-left">Total Leads</th>
//                               <th className="px-4 py-3 text-left">Total Meeting</th>
//                               <th className="px-4 py-3 text-left">Pending Meetings</th>
//                               <th className="px-4 py-3 text-left">Walk-in</th>
//                               <th className="px-4 py-3 text-left">Success Rate</th>
//                             </tr>
//                           </thead>
//                           <tbody className="divide-y divide-border text-sm">
//                             {teams.map(team => {
//                               const tc = users.find(u => u.id === team.tcId);
//                               const teamLeads = filteredLeads.filter(l => team.boIds.includes(l.assignedBOId));
//                               const tcMtgs = dashMeetings.filter(m => team.boIds.includes(m.boId));
//                               const pending = tcMtgs.filter(m => m.status === 'Pending').length;
//                               const walkin = tcMtgs.filter(m => m.meetingType === 'Walk-in').length;
//                               const done = tcMtgs.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length;
//                               const rate = tcMtgs.length > 0 ? Math.round((done / tcMtgs.length) * 100) : 0;
//                               return (
//                                 <tr key={team.id} className="hover:bg-secondary/30 transition-colors">
//                                   <td className="px-4 py-4 font-medium text-foreground">{tc?.name || '—'}</td>
//                                   <td className="px-4 py-4 text-muted-foreground">{team.boIds.length}</td>
//                                   <td className="px-4 py-4 font-semibold text-foreground">{teamLeads.length}</td>
//                                   <td className="px-4 py-4 text-muted-foreground">{tcMtgs.length}</td>
//                                   <td className="px-4 py-4 text-muted-foreground">{pending}</td>
//                                   <td className="px-4 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">{walkin}</span></td>
//                                   <td className="px-4 py-4 font-bold text-foreground">{rate}%</td>
//                                 </tr>
//                               );
//                             })}
//                             {teams.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No team data yet</td></tr>}
//                           </tbody>
//                         </table>
//                       </div>
//                     </CardContent>
//                   </Card>

//                   {/* ── BO-wise Performance Table ── */}
//                   <Card>
//                     <CardHeader className="pb-3"><CardTitle className="text-xs font-bold uppercase tracking-wider">BO-wise Performance</CardTitle></CardHeader>
//                     <CardContent>
//                       <div className="overflow-x-auto">
//                         <table className="min-w-full divide-y divide-border">
//                           <thead>
//                             <tr className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
//                               <th className="px-4 py-3 text-left">BO Name</th>
//                               <th className="px-4 py-3 text-left">Total Leads</th>
//                               <th className="px-4 py-3 text-left">Connected</th>
//                               <th className="px-4 py-3 text-left">Interested</th>
//                               <th className="px-4 py-3 text-left">Meeting</th>
//                               <th className="px-4 py-3 text-left">Success Rate</th>
//                             </tr>
//                           </thead>
//                           <tbody className="divide-y divide-border text-sm">
//                             {bos.map(bo => {
//                               const boLeads = getLeadsForBO(bo.id);
//                               if (boLeads.length === 0) return null;
//                               const connected = getNumberStatusCount(boLeads, 'Connected');
//                               const interested = getLeadStatusCount(boLeads, 'Interested');
//                               const boMtgs = dashMeetings.filter(m => m.boId === bo.id).length;
//                               const rate = boLeads.length > 0 ? Math.round((boMtgs / boLeads.length) * 100) : 0;
//                               return (
//                                 <tr key={bo.id} className="hover:bg-secondary/30 transition-colors">
//                                   <td className="px-4 py-4 font-medium text-foreground">{bo.name}</td>
//                                   <td className="px-4 py-4 text-muted-foreground">{boLeads.length}</td>
//                                   <td className="px-4 py-4"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100 dark:bg-green-950 dark:text-green-300 dark:border-green-800">{connected}</span></td>
//                                   <td className="px-4 py-4"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">{interested}</span></td>
//                                   <td className="px-4 py-4"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">{boMtgs}</span></td>
//                                   <td className="px-4 py-4 font-bold text-foreground">{rate}%</td>
//                                 </tr>
//                               );
//                             })}
//                             {bos.filter(bo => getLeadsForBO(bo.id).length > 0).length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No BO data yet</td></tr>}
//                           </tbody>
//                         </table>
//                       </div>
//                     </CardContent>
//                   </Card>

//                   {/* ── State-wise Leads Table ── */}
//                   <Card>
//                     <CardHeader className="pb-3"><CardTitle className="text-xs font-bold uppercase tracking-wider">State-wise Leads</CardTitle></CardHeader>
//                     <CardContent>
//                       <div className="overflow-x-auto">
//                         <table className="min-w-full divide-y divide-border">
//                           <thead>
//                             <tr className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
//                               <th className="px-4 py-3 text-left">State</th>
//                               <th className="px-4 py-3 text-left">Total Meetings</th>
//                               <th className="px-4 py-3 text-left">Pending</th>
//                               <th className="px-4 py-3 text-left">Top Product</th>
//                             </tr>
//                           </thead>
//                           <tbody className="divide-y divide-border text-sm">
//                             {(() => {
//                               const sm: Record<string, { total: number; pending: number; products: Record<string, number> }> = {};
//                               dashMeetings.forEach(m => {
//                                 const s = m.state || 'Unknown';
//                                 if (!sm[s]) sm[s] = { total: 0, pending: 0, products: {} };
//                                 sm[s].total++;
//                                 if (m.status === 'Pending') sm[s].pending++;
//                                 if (m.productType) sm[s].products[m.productType] = (sm[s].products[m.productType] || 0) + 1;
//                               });
//                               const rows = Object.entries(sm).sort((a, b) => b[1].total - a[1].total);
//                               if (rows.length === 0) return <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No state data yet</td></tr>;
//                               return rows.map(([state, d]) => {
//                                 const top = Object.entries(d.products).sort((a, b) => b[1] - a[1])[0]?.[0];
//                                 return (
//                                   <tr key={state} className="hover:bg-secondary/30 transition-colors">
//                                     <td className="px-4 py-4 font-medium text-foreground">{state}</td>
//                                     <td className="px-4 py-4 text-muted-foreground">{d.total}</td>
//                                     <td className="px-4 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100 dark:bg-green-950 dark:text-green-300 dark:border-green-800">{d.pending}</span></td>
//                                     <td className="px-4 py-4">{top ? <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-100 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">{top}</span> : <span className="text-muted-foreground">—</span>}</td>
//                                   </tr>
//                                 );
//                               });
//                             })()}
//                           </tbody>
//                         </table>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </div>

//                 {/* ── RIGHT PANEL ── */}
//                 <div className="xl:col-span-1 space-y-6">
//                   {/* Daily Trend */}
//                   <Card>
//                     <CardHeader className="pb-2 flex flex-row items-center justify-between">
//                       <CardTitle className="text-xs font-bold uppercase tracking-wider">Daily Trend</CardTitle>
//                       <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded uppercase">Monthly</span>
//                     </CardHeader>
//                     <CardContent>
//                       {(() => {
//                         const dateMap: Record<string, number> = {};
//                         dashMeetings.forEach(m => { dateMap[m.date] = (dateMap[m.date] || 0) + 1; });
//                         const sorted = Object.entries(dateMap).sort((a, b) => a[0].localeCompare(b[0]));
//                         if (sorted.length === 0) return <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No trend data yet</div>;
//                         const values = sorted.map(([, v]) => v);
//                         const max = Math.max(...values, 1);
//                         const peak = Math.max(...values);
//                         const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
//                         const W = 200, H = 120;
//                         const pts = values.map((v, i) => `${(i / (values.length - 1 || 1)) * W},${H - (v / max) * (H - 10) - 5}`).join(' ');
//                         const area = `0,${H} ${pts} ${W},${H}`;
//                         return (
//                           <>
//                             <div className="h-56 w-full">
//                               <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
//                                 <defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
//                                 <polygon points={area} fill="url(#trendGrad)" />
//                                 <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
//                                 {values.map((v, i) => <circle key={i} cx={(i / (values.length - 1 || 1)) * W} cy={H - (v / max) * (H - 10) - 5} r="2.5" fill="white" stroke="#3b82f6" strokeWidth="1.5" />)}
//                               </svg>
//                             </div>
//                             <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3">
//                               <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Peak Volume</p><p className="text-base font-bold text-foreground">{peak} Meetings</p></div>
//                               <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Avg Daily</p><p className="text-base font-bold text-foreground">{avg}</p></div>
//                             </div>
//                           </>
//                         );
//                       })()}
//                     </CardContent>
//                   </Card>

//                   {/* Activity Heatmap */}
//                   <Card>
//                     <CardHeader className="pb-4"><CardTitle className="text-xs font-bold uppercase tracking-wider">Activity Heatmap</CardTitle></CardHeader>
//                     <CardContent>
//                       {(() => {
//                         const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
//                         const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
//                         dashMeetings.forEach(m => {
//                           if (!m.date) return;
//                           const d = new Date(m.date);
//                           const dow = d.getDay();
//                           const wom = Math.floor((d.getDate() - 1) / 7);
//                           if (dow >= 1 && dow <= 5 && wom < 5) grid[wom][dow - 1]++;
//                         });
//                         const maxVal = Math.max(...grid.flat(), 1);
//                         const getColor = (v: number) => { const p = v / maxVal; if (p === 0) return 'bg-blue-50 dark:bg-blue-950'; if (p < 0.25) return 'bg-blue-200 dark:bg-blue-800'; if (p < 0.5) return 'bg-blue-400 dark:bg-blue-600'; if (p < 0.75) return 'bg-blue-600 dark:bg-blue-400'; return 'bg-blue-800 dark:bg-blue-300'; };
//                         const wLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
//                         return (
//                           <>
//                             <div className="grid gap-1.5" style={{ gridTemplateColumns: '28px repeat(5, 1fr)' }}>
//                               <div />
//                               {days.map(d => <div key={d} className="text-[9px] text-center text-muted-foreground font-bold uppercase">{d}</div>)}
//                               {/* {grid.map((row, wi) => (
//                                 <>
//                                   <div key={`w${wi}`} className="text-[9px] text-muted-foreground font-bold flex items-center justify-end pr-1">{wLabels[wi]}</div>
//                                   {row.map((val, di) => <div key={di} title={`${val} meetings`} className={`${getColor(val)} rounded-sm h-8 shadow-sm`} />)}
//                                 </>
//                               ))} */}
//                               {grid.map((row, wi) => (
//                                 <React.Fragment key={wi}>
//                                   <div className="text-[9px] text-muted-foreground font-bold flex items-center justify-end pr-1">
//                                     {wLabels[wi]}
//                                   </div>

//                                   {row.map((val, di) => (
//                                     <div
//                                       key={di}
//                                       title={`${val} meetings`}
//                                       className={`${getColor(val)} rounded-sm h-8 shadow-sm`}
//                                     />
//                                   ))}
//                                 </React.Fragment>
//                               ))}
//                             </div>
//                             <div className="mt-5 flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase">
//                               <span>Low Activity</span>
//                               <div className="flex gap-1">{['bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-blue-700', 'bg-blue-900'].map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />)}</div>
//                               <span>High Activity</span>
//                             </div>
//                           </>
//                         );
//                       })()}
//                     </CardContent>
//                   </Card>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       )}

//       {activeTab === 'users' && (
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-2xl font-display font-bold">User Management</h2>
//               <p className="text-sm text-muted-foreground mt-1">Add, edit, and manage users</p>
//             </div>
//             <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
//               <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add User</Button></DialogTrigger>
//               <DialogContent>
//                 <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
//                 <div className="space-y-4">
//                   <div><Label>Name</Label><Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} /></div>
//                   <div><Label>Username</Label><Input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} /></div>
//                   <div><Label>Password</Label><Input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} /></div>
//                   <div>
//                     <Label>Role</Label>
//                     <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v as UserRole }))}>
//                       <SelectTrigger><SelectValue /></SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="BO">Business Officer</SelectItem>
//                         <SelectItem value="TC">Team Captain</SelectItem>
//                         <SelectItem value="BDM">Business Dev Manager</SelectItem>
//                         <SelectItem value="BDO">Business Dev Officer</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                   {newUser.role === 'BO' && (
//                     <div>
//                       <Label>Assign to TC</Label>
//                       <Select value={newUser.tcId} onValueChange={v => setNewUser(p => ({ ...p, tcId: v }))}>
//                         <SelectTrigger><SelectValue placeholder="Select TC" /></SelectTrigger>
//                         <SelectContent>{tcs.map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
//                       </Select>
//                     </div>
//                   )}
//                   {/* <Button onClick={handleAddUser} className="w-full">Add User</Button> */}
//                   <Button
//                     disabled={isLoading('add_user')}
//                     onClick={() => withLoading('add_user', handleAddUser)}
//                     className="w-full">
//                     {isLoading('add_user') ? 'Adding...' : 'Add User'}
//                   </Button>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           </div>

//           <Card>
//             <CardContent className="p-0">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead>Team</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {users.filter(u => u.role !== 'FM').map(user => {
//                     const userTeam = teams.find(t => t.boIds.includes(user.id) || t.tcId === user.id);
//                     const isEditing = editingUser === user.id;
//                     return (
//                       <TableRow key={user.id}>
//                         <TableCell className="font-medium">{user.name}</TableCell>
//                         <TableCell>{user.username}</TableCell>
//                         <TableCell>
//                           {isEditing ? (
//                             <Select value={editRole} onValueChange={v => setEditRole(v as UserRole)}>
//                               <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
//                               <SelectContent>
//                                 <SelectItem value="BO">BO</SelectItem>
//                                 <SelectItem value="TC">TC</SelectItem>
//                                 <SelectItem value="BDM">BDM</SelectItem>
//                                 <SelectItem value="BDO">BDO</SelectItem>
//                               </SelectContent>
//                             </Select>
//                           ) : <Badge variant="secondary">{user.role}</Badge>}
//                         </TableCell>
//                         <TableCell>
//                           {isEditing && editRole === 'BO' ? (
//                             <Select value={editTCId} onValueChange={setEditTCId}>
//                               <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Select TC" /></SelectTrigger>
//                               <SelectContent>{tcs.map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
//                             </Select>
//                           ) : <span className="text-sm text-muted-foreground">{userTeam?.name || '—'}</span>}
//                         </TableCell>
//                         <TableCell>
//                           <Switch checked={user.active} onCheckedChange={checked => updateUser(user.id, { active: checked })} />
//                         </TableCell>
//                         <TableCell>
//                           <div className="flex gap-1">
//                             {isEditing ? (
//                               <>
//                                 {/* <Button size="sm" onClick={() => handleEditRole(user.id)}>Save</Button> */}
//                                 <Button size="sm"
//                                   disabled={isLoading(`edit_role_${user.id}`)}
//                                   onClick={() => withLoading(`edit_role_${user.id}`, () => handleEditRole(user.id))}>
//                                   {isLoading(`edit_role_${user.id}`) ? 'Saving...' : 'Save'}
//                                 </Button>
//                                 <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
//                               </>
//                             ) : (
//                               <>
//                                 <Button size="sm" variant="ghost" onClick={() => { setEditingUser(user.id); setEditRole(user.role); setEditTCId(''); }}>
//                                   <Edit2 className="w-4 h-4" />
//                                 </Button>
//                                 <Button size="sm" variant="ghost" onClick={() => setUserToDelete(user.id)}>
//                                   <Trash2 className="w-4 h-4 text-destructive" />
//                                 </Button>
//                               </>
//                             )}
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     );
//                   })}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>
//         </div>
//       )}

//       {activeTab === 'teams' && (
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-2xl font-display font-bold">Team Management</h2>
//               <p className="text-sm text-muted-foreground mt-1">Create teams, assign TC and BOs</p>
//             </div>
//             <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
//               <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Create Team</Button></DialogTrigger>
//               <DialogContent>
//                 <DialogHeader><DialogTitle>Create New Team</DialogTitle></DialogHeader>
//                 <div className="space-y-4">
//                   <div><Label>Team Name</Label><Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Alpha Team" /></div>
//                   <div>
//                     <Label>Assign TC</Label>
//                     <Select value={newTeamTC} onValueChange={setNewTeamTC}>
//                       <SelectTrigger><SelectValue placeholder="Select TC" /></SelectTrigger>
//                       <SelectContent>{tcs.filter(tc => !teams.some(t => t.tcId === tc.id)).map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
//                     </Select>
//                   </div>
//                   <div>
//                     <Label>Assign BOs</Label>
//                     <div className="flex flex-wrap gap-2 mt-2">
//                       {unassignedBOs.map(bo => (
//                         <button key={bo.id} onClick={() => setNewTeamBOs(prev => prev.includes(bo.id) ? prev.filter(id => id !== bo.id) : [...prev, bo.id])}
//                           className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${newTeamBOs.includes(bo.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-foreground'}`}>
//                           {bo.name}
//                         </button>
//                       ))}
//                       {unassignedBOs.length === 0 && <span className="text-sm text-muted-foreground">No unassigned BOs</span>}
//                     </div>
//                   </div>
//                   {/* <Button onClick={handleCreateTeam} className="w-full">Create Team</Button> */}

//                   <Button
//                     disabled={isLoading('create_team')}
//                     onClick={() => withLoading('create_team', handleCreateTeam)}
//                     className="w-full">
//                     {isLoading('create_team') ? 'Creating...' : 'Create Team'}
//                   </Button>
//                 </div>
//               </DialogContent>
//             </Dialog>
//           </div>

//           <div className="grid gap-4">
//             {teams.map(team => {
//               const tc = users.find(u => u.id === team.tcId);
//               const isEditing = editingTeam === team.id;
//               return (
//                 <Card key={team.id}>
//                   <CardHeader>
//                     <CardTitle className="text-base flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         {team.name}
//                         <Badge variant="outline">TC: {tc?.name}</Badge>
//                       </div>
//                       <div className="flex gap-1">
//                         <Button size="sm" variant="ghost" onClick={() => { setChangeTCTeamId(changeTCTeamId === team.id ? null : team.id); setNewTCForTeam(''); }}>
//                           Change TC
//                         </Button>
//                         <Button size="sm" variant="ghost" onClick={() => setEditingTeam(isEditing ? null : team.id)}>
//                           <Edit2 className="w-4 h-4" />
//                         </Button>
//                         <Button size="sm" variant="ghost" onClick={() => setTeamToDelete(team.id)}>
//                           <Trash2 className="w-4 h-4 text-destructive" />
//                         </Button>
//                       </div>
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     {changeTCTeamId === team.id && (
//                       <div className="mb-4 p-3 bg-secondary/50 rounded-lg flex gap-3 items-end">
//                         <div className="flex-1">
//                           <Label className="text-xs">New TC</Label>
//                           <Select value={newTCForTeam} onValueChange={setNewTCForTeam}>
//                             <SelectTrigger><SelectValue placeholder="Select TC" /></SelectTrigger>
//                             <SelectContent>{tcs.filter(tc => tc.id !== team.tcId).map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
//                           </Select>
//                         </div>
//                         {/* <Button size="sm" onClick={() => handleChangeTC(team.id)}>Save</Button> */}
//                         <Button size="sm"
//                           disabled={isLoading(`change_tc_${team.id}`)}
//                           onClick={() => withLoading(`change_tc_${team.id}`, () => handleChangeTC(team.id))}>
//                           {isLoading(`change_tc_${team.id}`) ? 'Saving...' : 'Save'}
//                         </Button>
//                       </div>
//                     )}
//                     <p className="text-sm text-muted-foreground mb-3">Business Officers:</p>
//                     <div className="flex flex-wrap gap-2">
//                       {team.boIds.map(boId => {
//                         const bo = users.find(u => u.id === boId);
//                         return (
//                           <div key={boId} className="flex items-center gap-1">
//                             <Badge>{bo?.name}</Badge>
//                             {isEditing && (
//                               <button
//                                 disabled={isLoading(`remove_bo_${boId}`)}
//                                 onClick={() => withLoading(`remove_bo_${boId}`, () => handleRemoveBOFromTeam(team.id, boId))}
//                                 className="text-destructive hover:text-destructive/80 disabled:opacity-50">
//                                 <UserMinus className="w-3 h-3" />
//                               </button>
//                             )}
//                           </div>
//                         );
//                       })}
//                       {team.boIds.length === 0 && <span className="text-sm text-muted-foreground">No BOs assigned</span>}
//                     </div>
//                     {isEditing && (
//                       <div className="mt-4 pt-4 border-t border-border">
//                         <p className="text-sm font-medium mb-2">Add BO to this team:</p>
//                         <div className="flex flex-wrap gap-2">
//                           {bos.filter(b => !team.boIds.includes(b.id)).map(bo => (
//                             <Button key={bo.id} size="sm" variant="outline"
//                               disabled={isLoading(`add_bo_${bo.id}`)}
//                               onClick={() => withLoading(`add_bo_${bo.id}`, () => handleAddBOToTeam(team.id, bo.id))}>
//                               <UserPlus className="w-3 h-3 mr-1" />{isLoading(`add_bo_${bo.id}`) ? 'Adding...' : bo.name}
//                             </Button>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {activeTab === 'leads' && (
//         <div className="space-y-6">
//           <div>
//             <h2 className="text-2xl font-display font-bold">Upload Leads</h2>
//             <p className="text-sm text-muted-foreground mt-1">Add leads via Excel, paste, or manually</p>
//           </div>

//           {/* BO Selection */}
//           <Card>
//             <CardHeader><CardTitle className="text-base">Select BOs for Distribution</CardTitle></CardHeader>
//             <CardContent>
//               <div className="flex flex-wrap gap-2">
//                 {bos.map(bo => {
//                   const isOnline = onlineUserIds.has(bo.id);
//                   return (
//                     <button key={bo.id} onClick={() => setSelectedBOs(prev => prev.includes(bo.id) ? prev.filter(id => id !== bo.id) : [...prev, bo.id])}
//                       className={`px-3 py-1.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${selectedBOs.includes(bo.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-foreground hover:bg-secondary/80'}`}>
//                       <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
//                       {bo.name}
//                     </button>
//                   );
//                 })}
//               </div>
//               {selectedBOs.length > 0 && <p className="text-xs text-muted-foreground mt-2">{selectedBOs.length} BOs selected</p>}
//             </CardContent>
//           </Card>

//           {/* Excel Upload */}
//           <Card>
//             <CardHeader><CardTitle className="text-base">Excel Upload</CardTitle></CardHeader>
//             <CardContent className="space-y-4">
//               <p className="text-sm text-muted-foreground">Upload an Excel file with columns: Client Name, Phone Number, Loan Requirement Amount</p>
//               <div className="flex gap-3">
//                 <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
//                 <Button onClick={() => fileInputRef.current?.click()}><UploadIcon className="w-4 h-4 mr-2" />Upload Excel File</Button>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Paste from Excel */}
//           <Card>
//             <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardPaste className="w-4 h-4" />Paste from Excel</CardTitle></CardHeader>
//             <CardContent className="space-y-4">
//               <p className="text-sm text-muted-foreground">Copy data from Excel (including headers) and paste below. Headers: Client Name, Phone Number, Loan Requirement Amount</p>
//               <Textarea
//                 value={pasteData}
//                 onChange={e => setPasteData(e.target.value)}
//                 placeholder="Paste Excel data here (Tab-separated with headers)..."
//                 rows={6}
//                 className="font-mono text-xs"
//               />
//               <Button
//                 disabled={!pasteData.trim() || isLoading('paste_import')}
//                 onClick={() => withLoading('paste_import', handlePasteImport)}>
//                 <ClipboardPaste className="w-4 h-4 mr-2" />{isLoading('paste_import') ? 'Importing...' : 'Import Pasted Data'}
//               </Button>
//             </CardContent>
//           </Card>

//           {/* Manual Lead */}
//           <Card>
//             <CardHeader><CardTitle className="text-base">Add Lead Manually</CardTitle></CardHeader>
//             <CardContent className="space-y-4">
//               <div className="grid md:grid-cols-3 gap-4">
//                 <div><Label>Client Name</Label><Input value={leadInput.clientName} onChange={e => setLeadInput(p => ({ ...p, clientName: e.target.value }))} /></div>
//                 <div><Label>Phone Number</Label><Input
//                   inputMode="numeric"
//                   value={leadInput.phoneNumber}
//                   onChange={e => setLeadInput(p => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, '') }))}
//                   placeholder="e.g. 9876543210"
//                 /></div>
//                 <div><Label>Loan Requirement</Label><Input value={leadInput.loanRequirement} onChange={e => setLeadInput(p => ({ ...p, loanRequirement: e.target.value }))} placeholder="Amount or text" /></div>
//               </div>
//               {/* <Button onClick={handleAddLead}><UploadIcon className="w-4 h-4 mr-2" />Add & Distribute Lead</Button> */}
//               <Button
//                 disabled={isLoading('add_lead')}
//                 onClick={() => withLoading('add_lead', handleAddLead)}>
//                 <UploadIcon className="w-4 h-4 mr-2" />{isLoading('add_lead') ? 'Adding...' : 'Add & Distribute Lead'}
//               </Button>
//             </CardContent>
//           </Card>

//           {/* All Leads */}
//           <Card>
//             <CardHeader><CardTitle className="text-base">All Leads ({leads.length})</CardTitle></CardHeader>
//             <CardContent className="p-0">
//               <Table>
//                 <TableHeader>
//                   <TableRow>
//                     <TableHead>Client</TableHead><TableHead>Phone</TableHead><TableHead>Loan Amt</TableHead><TableHead>Assigned BO</TableHead><TableHead>Number Status</TableHead><TableHead>Lead Status</TableHead><TableHead>Date</TableHead>
//                   </TableRow>
//                 </TableHeader>
//                 <TableBody>
//                   {leads.map(lead => {
//                     const bo = users.find(u => u.id === lead.assignedBOId);
//                     return (
//                       <TableRow key={lead.id}>
//                         <TableCell className="font-medium">{lead.clientName}</TableCell>
//                         <TableCell>{lead.phoneNumber}</TableCell>
//                         <TableCell>₹{lead.loanRequirement}</TableCell>
//                         <TableCell>{bo?.name}</TableCell>
//                         <TableCell><Badge variant={lead.numberStatus === 'Connected' ? 'default' : 'secondary'}>{lead.numberStatus || '—'}</Badge></TableCell>
//                         <TableCell><Badge variant="outline">{lead.leadStatus || '—'}</Badge></TableCell>
//                         <TableCell className="text-xs text-muted-foreground">{lead.assignedDate}</TableCell>
//                       </TableRow>
//                     );
//                   })}
//                 </TableBody>
//               </Table>
//             </CardContent>
//           </Card>
//         </div>
//       )}

//       {activeTab === 'bdm' && (
//         <div className="space-y-6">
//           <div>
//             <h2 className="text-2xl font-display font-bold">BDM Performance</h2>
//             <p className="text-sm text-muted-foreground mt-1">Track business development manager outcomes</p>
//           </div>
//           <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
//           <div className="grid md:grid-cols-2 gap-4">
//             {bdms.map(bdm => {
//               const bdmMeetings = filteredMeetings.filter(m => m.bdmId === bdm.id);
//               const done = bdmMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up').length;
//               const converted = bdmMeetings.filter(m => m.status === 'Converted').length;
//               const followUp = bdmMeetings.filter(m => m.status === 'Follow-Up').length;
//               const walkins = bdmMeetings.filter(m => m.meetingType === 'Walk-in' && (m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up'));
//               const rate = done > 0 ? ((converted / done) * 100).toFixed(1) : '0';
//               return (
//                 <Card key={bdm.id}>
//                   <CardHeader><CardTitle className="text-base">{bdm.name}</CardTitle></CardHeader>
//                   <CardContent>
//                     <div className="grid grid-cols-2 gap-3">
//                       <StatCard label="Meeting Done" value={done} variant="primary" />
//                       <StatCard label="Not Done" value={bdmMeetings.filter(m => m.status === 'Not Done').length} variant="destructive" />
//                       <StatCard label="Converted" value={converted} variant="accent" />
//                       <StatCard label="Follow-Up" value={followUp} variant="info" />
//                     </div>
//                     <div className="mt-3 grid grid-cols-2 gap-3">
//                       <div className="p-3 rounded-lg bg-secondary text-center">
//                         <span className="text-xs text-muted-foreground">Walk-in Done</span>
//                         <p className="text-xl font-bold text-primary">{walkins.length}</p>
//                       </div>
//                       <div className="p-3 rounded-lg bg-secondary text-center">
//                         <span className="text-xs text-muted-foreground">Conversion Rate</span>
//                         <p className="text-xl font-bold text-primary">{rate}%</p>
//                       </div>
//                     </div>
//                     {walkins.length > 0 && (
//                       <div className="mt-3">
//                         <p className="text-xs font-medium text-muted-foreground mb-2">Walk-in Dates:</p>
//                         <div className="flex flex-wrap gap-1">
//                           {walkins.map(w => (
//                             <Badge key={w.id} variant="outline" className="text-xs">{w.walkinDate || w.date}</Badge>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </CardContent>
//                 </Card>
//               );
//             })}
//           </div>
//         </div>
//       )}

//       {activeTab === 'duplicates' && (
//         <div className="space-y-6">
//           <div>
//             <h2 className="text-2xl font-display font-bold">Duplicate Leads</h2>
//             <p className="text-sm text-muted-foreground mt-1">Leads skipped due to duplicate phone numbers — {duplicateLeads.length} record{duplicateLeads.length !== 1 ? 's' : ''}</p>
//           </div>

//           <Card>
//             <CardContent className="p-0">
//               <div className="overflow-x-auto">
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Client Name</TableHead>
//                       <TableHead>Phone Number</TableHead>
//                       <TableHead>Meeting Status</TableHead>
//                       <TableHead>Amount Required</TableHead>
//                       <TableHead>Assigned BDO</TableHead>
//                       <TableHead>Created Date</TableHead>
//                       <TableHead className="text-right">Actions</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {duplicateLeads.map(d => {
//                       // Look up original lead → meeting → BDO details
//                       const originalLead = leads.find(l => l.id === d.originalLeadId);
//                       const meeting = originalLead ? meetings.find(m => m.leadId === originalLead.id) : undefined;
//                       const meetingStatus = meeting?.status || '—';
//                       const bdo = meeting?.bdoId ? users.find(u => u.id === meeting.bdoId) : undefined;
//                       return (
//                         <TableRow key={d.id}>
//                           <TableCell className="font-medium">{d.clientName}</TableCell>
//                           <TableCell>{d.phoneNumber}</TableCell>
//                           <TableCell>
//                             <div className="flex flex-col gap-1 items-start">
//                               <Badge variant={meetingStatus === 'Converted' ? 'default' : meetingStatus === 'Meeting Done' ? 'secondary' : 'outline'}>
//                                 {meetingStatus}
//                               </Badge>
//                               {meeting?.bdoStatus && <Badge variant="outline" className="text-[10px]">{meeting.bdoStatus}</Badge>}
//                               {meeting?.walkingStatus && <Badge variant="outline" className="text-[10px]">{meeting.walkingStatus}</Badge>}
//                             </div>
//                           </TableCell>
//                           <TableCell>₹{d.loanRequirement}</TableCell>
//                           <TableCell>{bdo?.name || '—'}</TableCell>
//                           <TableCell className="text-xs text-muted-foreground">
//                             {new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
//                           </TableCell>
//                           <TableCell className="text-right">
//                             <div className="flex gap-1 justify-end">
//                               <Button size="sm" variant="ghost" title="View Detail" onClick={() => setSelectedDuplicate(d)}>
//                                 <Eye className="w-4 h-4 text-primary" />
//                               </Button>
//                               <Button size="sm" variant="ghost" title="Merge Leads" onClick={() => setDuplicateToMerge(d)}>
//                                 <GitMerge className="w-4 h-4 text-blue-500" />
//                               </Button>
//                               <Button size="sm" variant="ghost" title="Delete Duplicate" onClick={() => setDuplicateToDelete(d.id)}>
//                                 <Trash2 className="w-4 h-4 text-destructive" />
//                               </Button>
//                             </div>
//                           </TableCell>
//                         </TableRow>
//                       );
//                     })}
//                     {duplicateLeads.length === 0 && (
//                       <TableRow>
//                         <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
//                           No duplicate leads found
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </TableBody>
//                 </Table>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Detail Dialog */}
//           {selectedDuplicate && (() => {
//             const d = selectedDuplicate;
//             const originalLead = leads.find(l => l.id === d.originalLeadId);
//             const meeting = originalLead ? meetings.find(m => m.leadId === originalLead.id) : undefined;
//             const walkinMeeting = originalLead ? meetings.find(m => m.leadId === originalLead.id && m.meetingType === 'Walk-in') : undefined;
//             const boUser = walkinMeeting ? users.find(u => u.id === walkinMeeting.boId) : (meeting ? users.find(u => u.id === meeting.boId) : undefined);
//             const bdoUser = meeting?.bdoId ? users.find(u => u.id === meeting.bdoId) : undefined;
//             const bdmUser = meeting?.bdmId ? users.find(u => u.id === meeting.bdmId) : undefined;
//             return (
//               <Dialog open={!!selectedDuplicate} onOpenChange={open => !open && setSelectedDuplicate(null)}>
//                 <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
//                   <DialogHeader>
//                     <DialogTitle className="text-lg font-display">Duplicate Lead Detail</DialogTitle>
//                   </DialogHeader>

//                   {/* Section 1: Duplicate Lead Info */}
//                   <div className="space-y-4">
//                     <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
//                       <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
//                         <AlertTriangle className="w-4 h-4" /> Duplicate Lead
//                       </h3>
//                       <div className="grid grid-cols-2 gap-3 text-sm">
//                         <div><span className="text-muted-foreground">Client Name</span><p className="font-medium mt-0.5">{d.clientName}</p></div>
//                         <div><span className="text-muted-foreground">Phone Number</span><p className="font-medium mt-0.5">{d.phoneNumber}</p></div>
//                         <div><span className="text-muted-foreground">Amount Required</span><p className="font-medium mt-0.5">₹{d.loanRequirement}</p></div>
//                         <div><span className="text-muted-foreground">Created Date</span><p className="font-medium mt-0.5">{new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
//                         {meeting && (
//                           <>
//                             <div><span className="text-muted-foreground">Meeting Status</span>
//                               <Badge className="mt-1" variant={meeting.status === 'Converted' ? 'default' : 'secondary'}>{meeting.status}</Badge>
//                             </div>
//                             <div><span className="text-muted-foreground">Assigned BDO</span><p className="font-medium mt-0.5">{bdoUser?.name || '—'}</p></div>
//                           </>
//                         )}
//                       </div>
//                     </div>

//                     {/* Section 2: Original Lead Reference */}
//                     <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
//                       <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-400 mb-3">Original Lead Reference</h3>
//                       <div className="grid grid-cols-2 gap-3 text-sm">
//                         <div>
//                           <span className="text-muted-foreground">Reference ID</span>
//                           <p className="font-mono text-xs mt-0.5 break-all bg-muted px-2 py-1 rounded">{d.originalLeadId || '—'}</p>
//                         </div>
//                         <div><span className="text-muted-foreground">Original BO</span><p className="font-medium mt-0.5">{d.originalBoName || '—'}</p></div>
//                         {originalLead && (
//                           <>
//                             <div><span className="text-muted-foreground">Client Name</span><p className="font-medium mt-0.5">{originalLead.clientName}</p></div>
//                             <div><span className="text-muted-foreground">Phone Number</span><p className="font-medium mt-0.5">{originalLead.phoneNumber}</p></div>
//                           </>
//                         )}
//                       </div>
//                     </div>

//                     {/* Section 3: BO Walk-in Details */}
//                     <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
//                       <h3 className="font-semibold text-sm text-green-800 dark:text-green-400 mb-3">Original BO Walk-in Details</h3>
//                       {(walkinMeeting || meeting) ? (
//                         <div className="grid grid-cols-2 gap-3 text-sm">
//                           <div><span className="text-muted-foreground">BO Name</span><p className="font-medium mt-0.5">{boUser?.name || '—'}</p></div>
//                           <div><span className="text-muted-foreground">BDM</span><p className="font-medium mt-0.5">{bdmUser?.name || '—'}</p></div>
//                           <div><span className="text-muted-foreground">Meeting Type</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.meetingType || '—'}</p></div>
//                           <div><span className="text-muted-foreground">Walk-in Date</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.walkinDate || '—'}</p></div>
//                           <div><span className="text-muted-foreground">BDO Status</span>
//                             <Badge className="mt-1" variant="outline">{(walkinMeeting || meeting)?.bdoStatus || '—'}</Badge>
//                           </div>
//                           <div><span className="text-muted-foreground">Walking Status</span>
//                             <Badge className="mt-1" variant="outline">{(walkinMeeting || meeting)?.walkingStatus || '—'}</Badge>
//                           </div>
//                           <div><span className="text-muted-foreground">Mini Login</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.miniLogin ? 'Yes' : 'No'}</p></div>
//                           <div><span className="text-muted-foreground">Full Login</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.fullLogin ? 'Yes' : 'No'}</p></div>
//                         </div>
//                       ) : (
//                         <p className="text-sm text-muted-foreground">No meeting/walk-in record found for the original lead.</p>
//                       )}
//                     </div>
//                   </div>

//                   <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
//                     <Button variant="outline" className="flex-1" onClick={() => setSelectedDuplicate(null)}>Close</Button>
//                     <Button variant="secondary" className="flex-1" onClick={() => { setSelectedDuplicate(null); setDuplicateToMerge(d); }}>
//                       <GitMerge className="w-4 h-4 mr-2" />Merge Leads
//                     </Button>
//                     <Button variant="destructive" className="flex-1" onClick={() => { setSelectedDuplicate(null); setDuplicateToDelete(d.id); }}>
//                       <Trash2 className="w-4 h-4 mr-2" />Delete Duplicate
//                     </Button>
//                   </DialogFooter>
//                 </DialogContent>
//               </Dialog>
//             );
//           })()}

//           {/* Delete Duplicate – Double Confirm */}
//           <DoubleConfirmModal
//             isOpen={!!duplicateToDelete}
//             onClose={() => setDuplicateToDelete(null)}
//             title="Delete Duplicate Lead"
//             onConfirm={async () => {
//               if (duplicateToDelete) {
//                 await deleteDuplicateLead(duplicateToDelete);
//                 toast.success('Duplicate lead deleted');
//                 setDuplicateToDelete(null);
//               }
//             }}
//           />

//           {/* Merge Leads – Double Confirm */}
//           <DoubleConfirmModal
//             isOpen={!!duplicateToMerge}
//             onClose={() => setDuplicateToMerge(null)}
//             title="Merge Leads"
//             onConfirm={async () => {
//               if (duplicateToMerge) {
//                 await mergeDuplicateLead(duplicateToMerge.id);
//                 toast.success('Leads merged — duplicate resolved');
//                 setDuplicateToMerge(null);
//               }
//             }}
//           />
//         </div>
//       )}

//       {activeTab === 'bdo' && (
//         <div className="space-y-6">
//           <div>
//             <h2 className="text-2xl font-display font-bold">BDO Performance</h2>
//             <p className="text-sm text-muted-foreground mt-1">Track business development officer outcomes</p>
//           </div>
//           <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
//           <div className="grid md:grid-cols-2 gap-4">
//             {bdos.map(bdo => {
//               const bdoMeetings = filteredMeetings.filter(m => (m as any).bdo_id === bdo.id || m.bdoId === bdo.id);
//               const allDoneMeetings = filteredMeetings.filter(m => m.status === 'Meeting Done');
//               const convertedByBDM = allDoneMeetings.filter(m => m.bdoStatus === 'Converted by BDM');
//               const followUps = allDoneMeetings.filter(m => m.bdoStatus === 'Follow-up');
//               const walkingDone = allDoneMeetings.filter(m => m.walkingStatus === 'Walking Done' && m.bdoStatus !== 'Converted by BDM');
//               const totalConverted = convertedByBDM.length + walkingDone.length;
//               const pending = allDoneMeetings.filter(m => !m.bdoStatus || m.bdoStatus.length === 0).length;
//               return (
//                 <Card key={bdo.id}>
//                   <CardHeader><CardTitle className="text-base">{bdo.name}</CardTitle></CardHeader>
//                   <CardContent>
//                     <div className="grid grid-cols-2 gap-3">
//                       <StatCard label="Pending" value={pending} variant="info" />
//                       <StatCard label="Converted by BDM" value={convertedByBDM.length} variant="primary" />
//                       <StatCard label="Follow-up" value={followUps.length} variant="accent" />
//                       <StatCard label="Walking Done" value={walkingDone.length} variant="primary" />
//                     </div>
//                     <div className="mt-3 grid grid-cols-2 gap-3">
//                       <div className="p-3 rounded-lg bg-secondary text-center">
//                         <span className="text-xs text-muted-foreground">Total Converted</span>
//                         <p className="text-xl font-bold text-primary">{totalConverted}</p>
//                       </div>
//                       <div className="p-3 rounded-lg bg-secondary text-center">
//                         <span className="text-xs text-muted-foreground">Mini/Full Logins</span>
//                         <p className="text-xl font-bold text-primary">{allDoneMeetings.filter(m => m.miniLogin).length} / {allDoneMeetings.filter(m => m.fullLogin).length}</p>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               );
//             })}
//             {bdos.length === 0 && (
//               <Card><CardContent className="py-8 text-center text-muted-foreground">No BDOs found. Add a user with BDO role.</CardContent></Card>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Delete Modals */}
//       <DoubleConfirmModal
//         isOpen={!!userToDelete}
//         onClose={() => setUserToDelete(null)}
//         onConfirm={async () => {
//           if (userToDelete) {
//             await removeUser(userToDelete);
//             toast.success('User removed');
//             setUserToDelete(null);
//           }
//         }}
//         title="Delete User"
//       />

//       <DoubleConfirmModal
//         isOpen={!!teamToDelete}
//         onClose={() => setTeamToDelete(null)}
//         onConfirm={async () => {
//           if (teamToDelete) {
//             const team = teams.find(t => t.id === teamToDelete);
//             if (team && team.boIds.length > 0) {
//               const confirmed = window.confirm(`This team has ${team.boIds.length} BO(s). They will be unassigned from this team. Proceed?`);
//               if (!confirmed) {
//                 setTeamToDelete(null);
//                 return;
//               }
//             }
//             await deleteTeam(teamToDelete);
//             toast.success('Team deleted');
//             setTeamToDelete(null);
//           }
//         }}
//         title="Delete Team"
//       />

//       {/* Upload Confirmation Modal */}
//       <Dialog open={!!pendingUpload} onOpenChange={(open) => !open && setPendingUpload(null)}>
//         <DialogContent className="sm:max-w-md">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
//               <AlertTriangle className="h-5 w-5" />
//               Duplicate Leads Detected
//             </DialogTitle>
//           </DialogHeader>
//           <div className="py-4 space-y-4">
//             {pendingUpload?.isManual ? (
//               <p className="text-sm">
//                 This phone number already exists in the system (assigned to <strong className="font-semibold">{pendingUpload.dupes[0]?.originalBoName}</strong>).
//                 <br /><br />
//                 Do you want to discard this lead, or proceed and store it in the <strong>Duplicate Leads</strong> folder for future reference?
//               </p>
//             ) : (
//               <>
//                 <p className="text-sm">We found some duplicate phone numbers in your upload. Do you want to proceed?</p>
//                 <div className="bg-secondary/50 rounded-lg p-4 grid grid-cols-2 gap-4">
//                   <div>
//                     <span className="text-xs text-muted-foreground">New Valid Leads:</span>
//                     <p className="font-semibold text-lg text-green-600 dark:text-green-500">{pendingUpload?.newLeads.length}</p>
//                     <span className="text-[10px] text-muted-foreground">(Will be assigned to BOs)</span>
//                   </div>
//                   <div>
//                     <span className="text-xs text-muted-foreground">Duplicates Found:</span>
//                     <p className="font-semibold text-lg text-amber-600 dark:text-amber-500">{pendingUpload?.dupes.length}</p>
//                     <span className="text-[10px] text-muted-foreground">(Will be stored in Duplicates Folder)</span>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
//           <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
//             <Button variant="outline" className="flex-1" onClick={() => setPendingUpload(null)}>
//               Cancel & Discard
//             </Button>
//             {/* <Button className="flex-1" onClick={async () => {
//               if (pendingUpload) {
//                 await addLeads(pendingUpload.newLeads, pendingUpload.dupes);
//                 setPendingUpload(null);

//                 if (pendingUpload.isManual) {
//                   setLeadInput({ clientName: '', phoneNumber: '', loanRequirement: '' });
//                   toast.success('Lead recorded in Duplicate Leads folder');
//                 } else {
//                   toast.success(`${pendingUpload.newLeads.length} leads uploaded. ${pendingUpload.dupes.length} duplicates stored.`);
//                 }
//               }
//             }}>
//               Confirm & Save {pendingUpload?.isManual ? 'Duplicate' : 'All'}
//             </Button> */}
//             <Button className="flex-1"
//               disabled={isLoading('confirm_upload')}
//               onClick={() => withLoading('confirm_upload', async () => {
//                 if (pendingUpload) {
//                   await addLeads(pendingUpload.newLeads, pendingUpload.dupes);
//                   setPendingUpload(null);
//                   if (pendingUpload.isManual) {
//                     setLeadInput({ clientName: '', phoneNumber: '', loanRequirement: '' });
//                     toast.success('Lead recorded in Duplicate Leads folder');
//                   } else {
//                     toast.success(`${pendingUpload.newLeads.length} leads uploaded. ${pendingUpload.dupes.length} duplicates stored.`);
//                   }
//                 }
//               })}>
//               {isLoading('confirm_upload') ? 'Saving...' : `Confirm & Save ${pendingUpload?.isManual ? 'Duplicate' : 'All'}`}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </DashboardLayout>
//   );
// }


import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { useLoading } from '@/hooks/use-loading';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Lead, UserRole, NumberStatus, LeadStatus, DuplicateLead } from '@/types/crm';
import { DoubleConfirmModal } from '@/components/ui/DoubleConfirmModal';
import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'bo' | 'tc' | 'bdm' | 'bdo' | 'leads' | 'users' | 'teams' | 'duplicates';
type Theme = 'dark' | 'light';

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  overview: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  bo:       <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg>,
  tc:       <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></svg>,
  bdm:      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  bdo:      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>,
  leads:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  users:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  teams:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  dupes:    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>,
  sun:      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  moon:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  logout:   <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  bell:     <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  activity: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  trash:    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  edit:     <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  plus:     <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  check:    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  upload:   <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>,
  paste:    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>,
  eye:      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  merge:    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 009 9"/></svg>,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function FunnelBar({ val, total, color }: { val: number; total: number; color: string }) {
  const pct = total ? Math.round((val / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: '3px', height: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: '3px', background: color, width: `${pct}%`, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: '10px', fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", minWidth: '24px', textAlign: 'right' }}>{val}</span>
    </div>
  );
}

function StatPill({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px' }}>
      <div style={{ fontSize: '16px', fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{val}</div>
      <div style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function Badge({ children, cls }: { children: React.ReactNode; cls?: string }) {
  return <span className={`fm-badge ${cls || 'fm-badge-default'}`}>{children}</span>;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function FMDashboard() {
  const {
    currentUser, users, leads, teams, meetings, meetingRequests, leadRemarks,
    duplicateLeads, addUser, updateUser, removeUser, addLeads, addTeam,
    updateTeam, updateTeamMembers, deleteTeam, deleteDuplicateLead, mergeDuplicateLead, logout,
  } = useCRM();
  const { withLoading, isLoading } = useLoading();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [theme, setTheme] = useState<Theme>('dark');
  const [clock, setClock] = useState('');
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activityFeed, setActivityFeed] = useState<{ id: string; msg: string; time: string; type: string }[]>([]);
  const [selectedBO, setSelectedBO] = useState<string | null>(null);
  const [selectedTC, setSelectedTC] = useState<string | null>(null);

  // User mgmt
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'BO' as UserRole, tcId: '' });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('BO');
  const [editTCId, setEditTCId] = useState('');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);

  // Leads upload
  const [leadInput, setLeadInput] = useState({ clientName: '', phoneNumber: '', loanRequirement: '' });
  const [selectedBOs, setSelectedBOs] = useState<string[]>([]);
  const [pasteData, setPasteData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUpload, setPendingUpload] = useState<{ newLeads: Lead[]; dupes: DuplicateLead[]; isManual: boolean } | null>(null);

  // Duplicates
  const [dupToDelete, setDupToDelete] = useState<string | null>(null);
  const [dupToMerge, setDupToMerge] = useState<DuplicateLead | null>(null);
  const [selectedDup, setSelectedDup] = useState<DuplicateLead | null>(null);

  // Team mgmt
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTC, setNewTeamTC] = useState('');
  const [newTeamBOs, setNewTeamBOs] = useState<string[]>([]);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [changeTCTeamId, setChangeTCTeamId] = useState<string | null>(null);
  const [newTCForTeam, setNewTCForTeam] = useState('');

  // Live clock
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')} ${n.getHours()>=12?'PM':'AM'}`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);

  // Supabase presence — online users
  useEffect(() => {
    const ch = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState<{ userId: string }>();
        const ids = new Set(Object.values(state).flat().map(p => p.userId));
        setOnlineIds(ids);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Supabase realtime — activity feed
  useEffect(() => {
    const addFeed = (msg: string, type: string) => {
      setActivityFeed(prev => [{ id: `${Date.now()}`, msg, time: new Date().toISOString(), type }, ...prev].slice(0, 50));
    };
    const ch = supabase.channel('fm-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'leads' }, payload => {
        const lead = leads.find(l => l.id === payload.new.id);
        const bo = users.find(u => u.id === payload.new.assigned_bo_id);
        if (payload.new.number_status !== payload.old?.number_status)
          addFeed(`${bo?.name || 'BO'} updated ${lead?.clientName || 'lead'} → ${payload.new.number_status}`, 'lead');
        if (payload.new.lead_status !== payload.old?.lead_status)
          addFeed(`${bo?.name || 'BO'} marked ${lead?.clientName || 'lead'} as ${payload.new.lead_status}`, 'status');
        if (payload.new.priority !== payload.old?.priority && payload.new.priority)
          addFeed(`${bo?.name || 'BO'} tagged ${lead?.clientName || 'lead'} as ${payload.new.priority}`, 'priority');
        if (payload.new.call_count > (payload.old?.call_count || 0))
          addFeed(`${bo?.name || 'BO'} logged call on ${lead?.clientName || 'lead'} (total: ${payload.new.call_count})`, 'call');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meeting_requests' }, payload => {
        const bo = users.find(u => u.id === payload.new.bo_id);
        addFeed(`${bo?.name || 'BO'} requested meeting approval`, 'request');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'meetings' }, payload => {
        const bdm = users.find(u => u.id === payload.new.bdm_id);
        if (payload.new.status !== payload.old?.status)
          addFeed(`Meeting status → ${payload.new.status} (BDM: ${bdm?.name || '?'})`, 'meeting');
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [users, leads]);

  // Computed data
  const today = new Date().toISOString().split('T')[0];
  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const bos = users.filter(u => u.role === 'BO' && u.active);
  const tcs = users.filter(u => u.role === 'TC' && u.active);
  const bdms = users.filter(u => u.role === 'BDM' && u.active);
  const bdos = users.filter(u => u.role === 'BDO' && u.active);
  const assignedBOIds = teams.flatMap(t => t.boIds);
  const unassignedBOs = bos.filter(b => !assignedBOIds.includes(b.id));

  const filteredMeetings = useMemo(() => {
    let f = meetings;
    if (fromDate) f = f.filter(m => m.date >= fromDate);
    if (toDate) f = f.filter(m => m.date <= toDate);
    return f;
  }, [meetings, fromDate, toDate]);

  const filteredLeads = useMemo(() => {
    let f = leads;
    if (fromDate) f = f.filter(l => l.assignedDate >= fromDate);
    if (toDate) f = f.filter(l => l.assignedDate <= toDate);
    return f;
  }, [leads, fromDate, toDate]);

  const todayLeads = leads.filter(l => l.assignedDate === today);
  const todayMeetings = meetings.filter(m => m.date === today);
  const onlineCount = [...onlineIds].filter(id => users.find(u => u.id === id)).length;
  const pendingReqs = meetingRequests.filter(r => r.status === 'Pending').length;
  const rescheduleCount = meetings.filter(m => m.status === 'Reschedule Requested').length;

  // Overview KPIs
  const totalLeads = leads.length;
  const connected = leads.filter(l => l.numberStatus === 'Connected').length;
  const interested = leads.filter(l => l.leadStatus === 'Interested').length;
  const totalMeetings = meetings.length;
  const converted = meetings.filter(m => m.status === 'Converted').length;
  const hotLeads = leads.filter(l => l.priority === 'Hot').length;
  const totalCalls = leads.reduce((s, l) => s + (l.callCount || 0), 0);
  const overdueFollowups = leads.filter(l => l.followUpDate && l.followUpDate < today).length;

  // Helpers
  const getLeadsForBO = (boId: string) => filteredLeads.filter(l => l.assignedBOId === boId);

  // Actions
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.password) { toast.error('Fill all fields'); return; }
    if (users.find(u => u.username === newUser.username)) { toast.error('Username already exists'); return; }
    try {
      const user: User = { id: crypto.randomUUID(), name: newUser.name, username: newUser.username, role: newUser.role, active: true };
      if (newUser.role === 'BO' && newUser.tcId) {
        const team = teams.find(t => t.tcId === newUser.tcId);
        if (team) { user.teamId = team.id; await updateTeamMembers(team.id, [...team.boIds, user.id]); }
      }
      if (newUser.role === 'TC') {
        const tid = `team_${Date.now()}`; user.teamId = tid;
        await addTeam({ id: tid, name: `${newUser.name}'s Team`, tcId: user.id, boIds: [] });
      }
      await addUser(user, newUser.password);
      setNewUser({ name: '', username: '', password: '', role: 'BO', tcId: '' });
      setShowAddUser(false);
      toast.success('User added');
    } catch { toast.error('Failed to create user'); }
  };

  const handleEditRole = async (userId: string) => {
    await updateUser(userId, { role: editRole });
    if (editRole === 'BO' && editTCId) {
      for (const t of teams) if (t.boIds.includes(userId)) await updateTeamMembers(t.id, t.boIds.filter(id => id !== userId));
      const tt = teams.find(t => t.tcId === editTCId);
      if (tt) await updateTeamMembers(tt.id, [...tt.boIds, userId]);
    }
    setEditingUser(null); toast.success('User updated');
  };

  const processLeadRows = async (rows: any[]) => {
    if (selectedBOs.length === 0) { toast.error('Select at least one BO'); return; }
    let added = 0;
    const newLeads: Lead[] = [], dupes: DuplicateLead[] = [];
    rows.forEach((row, idx) => {
      const clientName = row['Client Name'] || row['client_name'] || row['Name'] || row['name'] || '';
      const phoneNumber = String(row['Phone Number'] || row['phone_number'] || row['Phone'] || row['phone'] || '').trim().replace(/\D/g, '');
      const loanRequirement = String(row['Loan Requirement'] || row['loan_requirement'] || row['Loan Amount'] || row['amount'] || '');
      if (!clientName || !phoneNumber) return;
      const existing = leads.find(l => l.phoneNumber === phoneNumber) || newLeads.find(l => l.phoneNumber === phoneNumber);
      if (existing) {
        dupes.push({ id: crypto.randomUUID(), clientName, phoneNumber, loanRequirement, originalLeadId: existing.id, originalBoName: users.find(u => u.id === existing.assignedBOId)?.name || 'Unknown', uploadedAt: new Date().toISOString() });
        return;
      }
      newLeads.push({ id: `l${Date.now()}_${idx}`, clientName, phoneNumber, loanRequirement, numberStatus: '', leadStatus: '', leadType: '', assignedBOId: selectedBOs[added % selectedBOs.length], assignedDate: today, meetingRequested: false, meetingApproved: false });
      added++;
    });
    if (newLeads.length === 0 && dupes.length === 0) { toast.error('No valid data'); return; }
    if (dupes.length > 0) setPendingUpload({ newLeads, dupes, isManual: false });
    else { await addLeads(newLeads); toast.success(`${added} leads uploaded`); }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const wb = XLSX.read(evt.target?.result, { type: 'binary' });
      const rows = XLSX.utils.sheet_to_json<any>(wb.Sheets[wb.SheetNames[0]]);
      await processLeadRows(rows);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteImport = async () => {
    if (!pasteData.trim()) { toast.error('Paste data first'); return; }
    const lines = pasteData.trim().split('\n');
    if (lines.length < 2) { toast.error('Need header + data rows'); return; }
    const headers = lines[0].split('\t').map(h => h.trim());
    const rows = lines.slice(1).map(line => { const obj: any = {}; line.split('\t').forEach((v, i) => { obj[headers[i]] = v.trim(); }); return obj; });
    await processLeadRows(rows); setPasteData('');
  };

  const handleAddLead = async () => {
    if (!leadInput.clientName || !leadInput.phoneNumber || !leadInput.loanRequirement) { toast.error('Fill all fields'); return; }
    if (!/^\d+$/.test(leadInput.phoneNumber)) { toast.error('Digits only in phone'); return; }
    if (selectedBOs.length === 0) { toast.error('Select BO first'); return; }
    const dup = leads.find(l => l.phoneNumber === leadInput.phoneNumber);
    if (dup) {
      setPendingUpload({ newLeads: [], dupes: [{ id: crypto.randomUUID(), ...leadInput, originalLeadId: dup.id, originalBoName: users.find(u => u.id === dup.assignedBOId)?.name || 'Unknown', uploadedAt: new Date().toISOString() }], isManual: true });
      return;
    }
    const boId = selectedBOs[Math.floor(Math.random() * selectedBOs.length)];
    await addLeads([{ id: `l${Date.now()}`, ...leadInput, numberStatus: '', leadStatus: '', leadType: '', assignedBOId: boId, assignedDate: today, meetingRequested: false, meetingApproved: false }]);
    setLeadInput({ clientName: '', phoneNumber: '', loanRequirement: '' });
    toast.success(`Lead assigned to ${users.find(u => u.id === boId)?.name}`);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName || !newTeamTC) { toast.error('Enter name and select TC'); return; }
    const tid = `team_${Date.now()}`;
    await addTeam({ id: tid, name: newTeamName, tcId: newTeamTC, boIds: newTeamBOs });
    await updateUser(newTeamTC, { teamId: tid });
    for (const b of newTeamBOs) await updateUser(b, { teamId: tid });
    setNewTeamName(''); setNewTeamTC(''); setNewTeamBOs([]); setShowCreateTeam(false);
    toast.success('Team created');
  };

  const isDark = theme === 'dark';

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

        /* ── THEMES ── */
        .fm-root.dark {
          --bg: #06070d; --bg2: #0c0e1a; --bg3: #111425;
          --surface: #141726; --surface2: #1a1e35;
          --border: rgba(255,255,255,0.06); --border2: rgba(255,255,255,0.1);
          --accent: #3d7fff; --success: #00d4aa; --warning: #f59e0b;
          --danger: #ff4757; --purple: #a78bfa; --orange: #ff6b35; --teal: #06b6d4;
          --text: #e8eaf6; --text2: #8892b0; --text3: #4a5568;
          --row-hover: rgba(255,255,255,0.02);
        }
        .fm-root.light {
          --bg: #f3f4f9; --bg2: #ffffff; --bg3: #eef0f7;
          --surface: #ffffff; --surface2: #eef0f7;
          --border: rgba(0,0,0,0.07); --border2: rgba(0,0,0,0.12);
          --accent: #2563eb; --success: #059669; --warning: #d97706;
          --danger: #dc2626; --purple: #7c3aed; --orange: #ea580c; --teal: #0891b2;
          --text: #0f172a; --text2: #475569; --text3: #94a3b8;
          --row-hover: rgba(0,0,0,0.02);
        }

        .fm-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: var(--bg); color: var(--text);
          min-height: 100vh; transition: background 0.25s, color 0.25s;
        }
        .fm-layout { display: flex; min-height: 100vh; }

        /* ── SIDEBAR ── */
        .fm-sidebar {
          width: 220px; flex-shrink: 0; background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          position: sticky; top: 0; height: 100vh; overflow: hidden;
          transition: background 0.25s;
        }
        .fm-sidebar::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--accent), var(--teal), transparent); }
        .fm-brand { padding: 22px 20px 16px; border-bottom: 1px solid var(--border); }
        .fm-brand-tag { font-size: 9px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--teal); font-family: 'JetBrains Mono', monospace; margin-bottom: 6px; }
        .fm-brand-name { font-size: 17px; font-weight: 800; color: var(--text); line-height: 1.2; }
        .fm-brand-sub { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; margin-top: 3px; }
        .fm-user { margin: 12px 18px; background: var(--surface2); border: 1px solid var(--border2); border-radius: 10px; padding: 10px; display: flex; align-items: center; gap: 9px; }
        .fm-user-ava { width: 32px; height: 32px; border-radius: 9px; background: linear-gradient(135deg, var(--teal), var(--accent)); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0; }
        .fm-user-name { font-size: 12px; font-weight: 600; color: var(--text); }
        .fm-user-role { font-size: 9px; color: var(--teal); font-family: 'JetBrains Mono', monospace; letter-spacing: 1px; }
        .fm-nav-section { padding: 6px 12px; margin-top: 2px; }
        .fm-nav-label { font-size: 9px; font-weight: 600; letter-spacing: 2.5px; color: var(--text3); text-transform: uppercase; font-family: 'JetBrains Mono', monospace; padding: 0 8px; margin-bottom: 3px; }
        .fm-nav-item { display: flex; align-items: center; gap: 9px; padding: 8px 11px; border-radius: 9px; cursor: pointer; transition: all 0.15s; font-size: 12px; font-weight: 500; color: var(--text2); position: relative; margin-bottom: 1px; }
        .fm-nav-item:hover { background: var(--surface2); color: var(--text); }
        .fm-nav-item.active { background: var(--surface2); color: var(--teal); }
        .fm-nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 60%; background: var(--teal); border-radius: 0 3px 3px 0; }
        .fm-nav-icon { width: 16px; height: 16px; opacity: 0.6; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .fm-nav-item.active .fm-nav-icon { opacity: 1; }
        .fm-nav-badge { margin-left: auto; font-size: 9px; font-weight: 700; background: var(--danger); color: #fff; padding: 1px 6px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; }
        .fm-nav-badge.warn { background: var(--warning); }
        .fm-nav-badge.info { background: var(--accent); }
        .fm-nav-badge.teal { background: var(--teal); }
        .fm-sidebar-foot { margin-top: auto; padding: 12px 18px; border-top: 1px solid var(--border); }
        .fm-online-indicator { font-size: 10px; color: var(--text3); font-family: 'JetBrains Mono', monospace; margin-bottom: 10px; }
        .fm-status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); margin-right: 5px; animation: pdot 2s infinite; }
        @keyframes pdot { 0%,100%{opacity:1}50%{opacity:0.3} }
        .fm-theme-toggle { display: flex; background: var(--bg3); border: 1px solid var(--border2); border-radius: 18px; padding: 3px; margin-bottom: 8px; cursor: pointer; }
        .fm-toggle-opt { display: flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 13px; font-size: 10px; font-weight: 600; color: var(--text3); transition: all 0.2s; font-family: 'JetBrains Mono', monospace; flex: 1; justify-content: center; }
        .fm-toggle-opt.active { background: var(--surface); color: var(--text); box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
        .fm-logout-btn { display: flex; align-items: center; gap: 7px; width: 100%; padding: 8px 11px; border-radius: 8px; font-size: 11px; font-weight: 600; color: var(--text2); cursor: pointer; background: var(--surface); border: 1px solid var(--border); transition: all 0.15s; font-family: inherit; }
        .fm-logout-btn:hover { color: var(--text); border-color: var(--border2); }

        /* ── MAIN ── */
        .fm-main { flex: 1; overflow: auto; padding: 26px 28px 60px; }
        .fm-topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
        .fm-page-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: var(--text); }
        .fm-page-sub { font-size: 10px; color: var(--text2); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
        .fm-clock { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text2); background: var(--surface); border: 1px solid var(--border); padding: 6px 12px; border-radius: 7px; }

        /* Date filter */
        .fm-date-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 18px; }
        .fm-date-input { background: var(--surface); border: 1px solid var(--border2); border-radius: 7px; padding: 6px 10px; color: var(--text); font-size: 11px; font-family: 'JetBrains Mono', monospace; outline: none; }
        .fm-date-input:focus { border-color: var(--accent); }
        .fm-label { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
        .fm-clear-btn { font-size: 10px; color: var(--text3); cursor: pointer; font-family: 'JetBrains Mono', monospace; padding: 5px 10px; border: 1px solid var(--border); border-radius: 7px; background: transparent; }
        .fm-clear-btn:hover { color: var(--text2); }

        /* ── KPI GRID ── */
        .fm-kpi-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; margin-bottom: 20px; }
        .fm-kpi-grid-5 { grid-template-columns: repeat(5, minmax(0,1fr)); }
        .fm-kpi { background: var(--surface); border: 1px solid var(--border); border-radius: 13px; padding: 16px 15px; transition: transform 0.15s, background 0.25s; }
        .fm-kpi:hover { transform: translateY(-2px); }
        .fm-kpi-label { font-size: 9px; font-weight: 600; letter-spacing: 1.8px; text-transform: uppercase; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-bottom: 8px; }
        .fm-kpi-val { font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 4px; }
        .fm-kpi-sub { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
        .fm-kpi-bar-wrap { display: flex; align-items: flex-end; gap: 2px; height: 18px; margin-top: 10px; }
        .fm-kpi-spark { flex: 1; border-radius: 2px; min-height: 2px; opacity: 0.45; }

        /* ── CARDS ── */
        .fm-card { background: var(--surface); border: 1px solid var(--border); border-radius: 13px; overflow: hidden; margin-bottom: 16px; transition: background 0.25s; }
        .fm-card-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px 10px; border-bottom: 1px solid var(--border); }
        .fm-card-title { font-size: 12px; font-weight: 700; color: var(--text); letter-spacing: 0.2px; }
        .fm-card-sub { font-size: 10px; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
        .fm-card-body { padding: 14px 17px; }

        /* ── OVERVIEW LAYOUT ── */
        .ov-col2 { display: grid; grid-template-columns: minmax(0,2fr) minmax(0,1fr); gap: 16px; margin-bottom: 16px; }
        .ov-col3 { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; margin-bottom: 16px; }

        /* ── ACTIVITY FEED ── */
        .feed-list { display: flex; flex-direction: column; gap: 5px; max-height: 380px; overflow-y: auto; }
        .feed-item { display: flex; gap: 10px; align-items: flex-start; padding: 7px 10px; background: var(--bg3); border-radius: 8px; border: 1px solid var(--border); }
        .feed-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
        .feed-dot-lead { background: #3d7fff; }
        .feed-dot-status { background: #a78bfa; }
        .feed-dot-priority { background: #ff4757; }
        .feed-dot-call { background: #00d4aa; }
        .feed-dot-request { background: #f59e0b; }
        .feed-dot-meeting { background: #06b6d4; }
        .feed-dot-default { background: var(--text3); }
        .feed-msg { font-size: 11px; color: var(--text); flex: 1; line-height: 1.4; }
        .feed-time { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; white-space: nowrap; }
        .feed-empty { font-size: 11px; color: var(--text3); font-family: 'JetBrains Mono', monospace; padding: 16px 0; text-align: center; }

        /* ── ONLINE USERS ── */
        .online-grid { display: flex; flex-wrap: wrap; gap: 8px; }
        .online-user-chip { display: flex; align-items: center; gap: 7px; padding: 6px 10px; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; }
        .online-ava { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }
        .online-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); flex-shrink: 0; }
        .offline-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text3); flex-shrink: 0; }
        .online-name { font-size: 11px; font-weight: 600; color: var(--text); }
        .online-role { font-size: 9px; color: var(--text3); font-family: 'JetBrains Mono', monospace; }

        /* ── DATA TABLE ── */
        .fm-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .fm-table th { padding: 8px 10px; text-align: left; font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--text3); font-family: 'JetBrains Mono', monospace; border-bottom: 1px solid var(--border); }
        .fm-table td { padding: 9px 10px; border-bottom: 1px solid var(--border); color: var(--text2); vertical-align: middle; }
        .fm-table tr:last-child td { border-bottom: none; }
        .fm-table tbody tr { transition: background 0.12s; cursor: default; }
        .fm-table tbody tr:hover { background: var(--row-hover); }
        .fm-table td.pri { color: var(--text); font-weight: 600; }
        .fm-empty { text-align: center; color: var(--text3); padding: 20px; font-size: 10px; font-family: 'JetBrains Mono', monospace; }

        /* ── BADGES ── */
        .fm-badge { display: inline-flex; align-items: center; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 5px; letter-spacing: 0.5px; font-family: 'JetBrains Mono', monospace; }
        .fm-badge-default { background: var(--surface2); color: var(--text2); border: 1px solid var(--border2); }
        .fm-badge-success { background: rgba(0,212,170,0.1); color: var(--success); border: 1px solid rgba(0,212,170,0.2); }
        .fm-badge-danger { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
        .fm-badge-warning { background: rgba(245,158,11,0.1); color: var(--warning); border: 1px solid rgba(245,158,11,0.2); }
        .fm-badge-accent { background: rgba(61,127,255,0.1); color: var(--accent); border: 1px solid rgba(61,127,255,0.2); }
        .fm-badge-purple { background: rgba(167,139,250,0.1); color: var(--purple); border: 1px solid rgba(167,139,250,0.2); }
        .fm-badge-teal { background: rgba(6,182,212,0.1); color: var(--teal); border: 1px solid rgba(6,182,212,0.2); }
        .fm-badge-hot { background: rgba(255,71,87,0.12); color: #ff4757; border: 1px solid rgba(255,71,87,0.25); }
        .fm-badge-warm { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.25); }
        .fm-badge-cold { background: rgba(61,127,255,0.12); color: var(--accent); border: 1px solid rgba(61,127,255,0.25); }

        /* ── BUTTONS & INPUTS ── */
        .fm-btn { display: inline-flex; align-items: center; gap: 6px; border: none; border-radius: 8px; padding: 8px 16px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif; transition: all 0.15s; }
        .fm-btn-primary { background: var(--teal); color: #fff; }
        .fm-btn-primary:hover { opacity: 0.87; }
        .fm-btn-danger { background: rgba(255,71,87,0.1); color: var(--danger); border: 1px solid rgba(255,71,87,0.2); }
        .fm-btn-danger:hover { background: rgba(255,71,87,0.18); }
        .fm-btn-ghost { background: var(--surface2); color: var(--text2); border: 1px solid var(--border2); }
        .fm-btn-ghost:hover { color: var(--text); border-color: var(--text3); }
        .fm-btn-sm { padding: 5px 10px; font-size: 10px; border-radius: 6px; }
        .fm-input { background: var(--bg3); border: 1px solid var(--border2); border-radius: 7px; padding: 7px 10px; color: var(--text); font-size: 12px; font-family: 'Inter', sans-serif; outline: none; width: 100%; transition: border-color 0.15s; }
        .fm-input:focus { border-color: var(--teal); }
        .fm-input::placeholder { color: var(--text3); }
        .fm-select { background: var(--bg3); border: 1px solid var(--border2); border-radius: 7px; padding: 7px 10px; color: var(--text); font-size: 12px; font-family: 'Inter', sans-serif; outline: none; width: 100%; }
        .fm-select:focus { border-color: var(--teal); }
        .fm-select-sm { width: auto; padding: 4px 8px; font-size: 10px; border-radius: 6px; }
        .fm-textarea { background: var(--bg3); border: 1px solid var(--border2); border-radius: 7px; padding: 7px 10px; color: var(--text); font-size: 11px; font-family: 'JetBrains Mono', monospace; outline: none; width: 100%; resize: vertical; }
        .fm-textarea:focus { border-color: var(--teal); }

        /* ── BO DETAIL PANEL ── */
        .bo-drill-header { display: flex; align-items: center; gap: 14px; padding: 14px 17px; border-bottom: 1px solid var(--border); }
        .bo-drill-ava { width: 42px; height: 42px; border-radius: 10px; background: rgba(61,127,255,0.12); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 700; color: var(--accent); flex-shrink: 0; }
        .bo-drill-name { font-size: 14px; font-weight: 700; color: var(--text); }
        .bo-drill-sub { font-size: 10px; color: var(--text2); font-family: 'JetBrains Mono', monospace; margin-top: 2px; }

        /* ── CHIP TABS ── */
        .chip-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
        .chip-tab { padding: 5px 12px; border-radius: 8px; border: 1px solid var(--border2); cursor: pointer; font-size: 11px; font-weight: 600; color: var(--text2); background: var(--surface); transition: all 0.15s; white-space: nowrap; }
        .chip-tab:hover { background: var(--surface2); color: var(--text); }
        .chip-tab.active { border-color: var(--teal); color: var(--teal); background: rgba(6,182,212,0.07); }

        /* ── MODAL ── */
        .fm-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .fm-modal { background: var(--surface); border: 1px solid var(--border2); border-radius: 14px; padding: 22px; width: 100%; max-width: 460px; max-height: 85vh; overflow-y: auto; }
        .fm-modal-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 16px; }
        .fm-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .fm-form-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
        .fm-field-label { font-size: 9px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text3); font-family: 'JetBrains Mono', monospace; }
        .fm-modal-footer { display: flex; gap: 8px; margin-top: 16px; justify-content: flex-end; }
        .fm-switch { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text2); cursor: pointer; }
        .fm-switch-track { width: 32px; height: 18px; border-radius: 9px; background: var(--surface2); border: 1px solid var(--border2); position: relative; transition: background 0.2s; flex-shrink: 0; }
        .fm-switch-track.on { background: var(--teal); border-color: var(--teal); }
        .fm-switch-thumb { width: 12px; height: 12px; border-radius: 50%; background: #fff; position: absolute; top: 2px; left: 2px; transition: left 0.2s; }
        .fm-switch-track.on .fm-switch-thumb { left: 16px; }

        /* Animations */
        @keyframes fadeInUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .fade-in { animation: fadeInUp 0.25s ease forwards; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
      `}</style>

      <div className={`fm-root ${theme}`}>
        <div className="fm-layout">

          {/* ── SIDEBAR ── */}
          <aside className="fm-sidebar">
            <div className="fm-brand">
              <div className="fm-brand-tag">FM · Command</div>
              <div className="fm-brand-name">Control<br />Tower</div>
              <div className="fm-brand-sub">Full visibility · All roles</div>
            </div>
            <div className="fm-user">
              <div className="fm-user-ava">{currentUser?.name?.[0] ?? 'F'}</div>
              <div>
                <div className="fm-user-name">{currentUser?.name || 'Fund Manager'}</div>
                <div className="fm-user-role">FUND MGR</div>
              </div>
            </div>

            <div className="fm-nav-section">
              <div className="fm-nav-label">Monitor</div>
              {([
                { id: 'overview', label: 'Overview', icon: I.overview, badge: onlineCount, badgeCls: 'teal' },
                { id: 'bo',       label: 'BO Activity',  icon: I.bo,    badge: overdueFollowups > 0 ? overdueFollowups : null, badgeCls: 'warn' },
                { id: 'tc',       label: 'TC Monitor',   icon: I.tc,    badge: pendingReqs > 0 ? pendingReqs : null, badgeCls: '' },
                { id: 'bdm',      label: 'BDM Monitor',  icon: I.bdm,   badge: rescheduleCount > 0 ? rescheduleCount : null, badgeCls: 'warn' },
                { id: 'bdo',      label: 'BDO Monitor',  icon: I.bdo },
              ] as any[]).map(item => (
                <div key={item.id} className={`fm-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                  <div className="fm-nav-icon">{item.icon}</div>{item.label}
                  {item.badge ? <span className={`fm-nav-badge ${item.badgeCls || ''}`}>{item.badge}</span> : null}
                </div>
              ))}
            </div>
            <div className="fm-nav-section">
              <div className="fm-nav-label">Manage</div>
              {([
                { id: 'leads',      label: 'Leads',       icon: I.leads },
                { id: 'users',      label: 'Users',       icon: I.users },
                { id: 'teams',      label: 'Teams',       icon: I.teams },
                { id: 'duplicates', label: 'Duplicates',  icon: I.dupes, badge: duplicateLeads.length > 0 ? duplicateLeads.length : null, badgeCls: 'warn' },
              ] as any[]).map(item => (
                <div key={item.id} className={`fm-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                  <div className="fm-nav-icon">{item.icon}</div>{item.label}
                  {item.badge ? <span className={`fm-nav-badge ${item.badgeCls || ''}`}>{item.badge}</span> : null}
                </div>
              ))}
            </div>

            <div className="fm-sidebar-foot">
              <div className="fm-online-indicator">
                <span className="fm-status-dot" />{onlineCount} online · {users.length} total users<br />
                <span style={{ color: 'var(--text3)', marginTop: '2px', display: 'block' }}>{todayLeads.length} leads today · {todayMeetings.length} meetings</span>
              </div>
              <div className="fm-theme-toggle" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
                <div className={`fm-toggle-opt ${isDark ? 'active' : ''}`}>{I.moon} Dark</div>
                <div className={`fm-toggle-opt ${!isDark ? 'active' : ''}`}>{I.sun} Light</div>
              </div>
              <button className="fm-logout-btn" onClick={logout}>{I.logout} Sign Out</button>
            </div>
          </aside>

          {/* ── MAIN ── */}
          <main className="fm-main">

            {/* ════ OVERVIEW ════ */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                <div className="fm-topbar">
                  <div>
                    <div className="fm-page-title">Control Tower — {todayStr}</div>
                    <div className="fm-page-sub">// {onlineCount} online · {users.length} users · {leads.length} leads · {meetings.length} meetings</div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="fm-clock">{clock}</div>
                    {pendingReqs > 0 && <span className="fm-badge fm-badge-warning">{I.bell} {pendingReqs} pending requests</span>}
                  </div>
                </div>

                {/* Top KPIs */}
                <div className="fm-kpi-grid fm-kpi-grid-5" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))', marginBottom: '16px' }}>
                  {[
                    { label: 'Total Leads', val: totalLeads, color: 'var(--teal)', sub: `${todayLeads.length} today`, bars: [60,70,65,80,75,85,totalLeads], bc: '#06b6d4' },
                    { label: 'Connected', val: connected, color: 'var(--success)', sub: `${totalLeads ? Math.round(connected/totalLeads*100) : 0}% rate`, bars: [20,25,22,30,28,32,connected], bc: '#00d4aa' },
                    { label: 'Meetings', val: totalMeetings, color: 'var(--accent)', sub: `${todayMeetings.length} today`, bars: [5,8,7,10,9,12,totalMeetings], bc: '#3d7fff' },
                    { label: 'Converted', val: converted, color: 'var(--success)', sub: `${totalMeetings ? Math.round(converted/totalMeetings*100) : 0}% conv. rate`, bars: [1,2,2,3,3,4,converted], bc: '#00d4aa' },
                    { label: 'Hot Leads', val: hotLeads, color: 'var(--danger)', sub: `${totalCalls} total calls`, bars: [0,1,1,2,2,3,hotLeads], bc: '#ff4757' },
                  ].map(k => {
                    const max = Math.max(...k.bars) || 1;
                    return (
                      <div key={k.label} className="fm-kpi">
                        <div className="fm-kpi-label">{k.label}</div>
                        <div className="fm-kpi-val" style={{ color: k.color }}>{k.val}</div>
                        <div className="fm-kpi-sub">{k.sub}</div>
                        <div className="fm-kpi-bar-wrap">
                          {k.bars.map((v, i) => <div key={i} className="fm-kpi-spark" style={{ height: `${Math.max(2, Math.round((v/max)*16))}px`, background: k.bc }} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="ov-col2">
                  {/* Real-time Activity Feed */}
                  <div className="fm-card">
                    <div className="fm-card-head">
                      <div>
                        <div className="fm-card-title">{I.activity} Real-time activity feed</div>
                        <div className="fm-card-sub">// live updates from all roles</div>
                      </div>
                      <span className="fm-badge fm-badge-teal">{activityFeed.length} events</span>
                    </div>
                    <div className="fm-card-body">
                      <div className="feed-list">
                        {activityFeed.length === 0 && <div className="feed-empty">Waiting for activity... (live updates will appear here)</div>}
                        {activityFeed.map(item => (
                          <div key={item.id} className="feed-item">
                            <div className={`feed-dot feed-dot-${item.type || 'default'}`} />
                            <span className="feed-msg">{item.msg}</span>
                            <span className="feed-time">{timeAgo(item.time)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Online Users Panel */}
                  <div>
                    <div className="fm-card">
                      <div className="fm-card-head">
                        <div>
                          <div className="fm-card-title">Who's online</div>
                          <div className="fm-card-sub">// {onlineCount} active now</div>
                        </div>
                      </div>
                      <div className="fm-card-body">
                        <div className="online-grid">
                          {users.filter(u => u.role !== 'FM').map(u => {
                            const isOnline = onlineIds.has(u.id);
                            const roleColors: Record<string, string> = { BO: '#3d7fff', TC: '#06b6d4', BDM: '#a78bfa', BDO: '#f59e0b' };
                            const bg = `${roleColors[u.role] || '#4a5568'}20`;
                            const color = roleColors[u.role] || '#4a5568';
                            return (
                              <div key={u.id} className="online-user-chip" style={{ opacity: isOnline ? 1 : 0.55 }}>
                                <div className="online-ava" style={{ background: bg, color }}>{u.name[0]}</div>
                                <div>
                                  <div className="online-name">{u.name.split(' ')[0]}</div>
                                  <div className="online-role">{u.role}</div>
                                </div>
                                <div className={isOnline ? 'online-dot' : 'offline-dot'} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Alert Summary */}
                    <div className="fm-card">
                      <div className="fm-card-head"><div className="fm-card-title">Attention needed</div></div>
                      <div className="fm-card-body">
                        {[
                          { label: 'Pending meeting requests', val: pendingReqs, color: 'var(--warning)', tab: 'tc' as Tab },
                          { label: 'Reschedule requests', val: rescheduleCount, color: 'var(--orange)', tab: 'tc' as Tab },
                          { label: 'Overdue follow-ups (BO)', val: overdueFollowups, color: 'var(--danger)', tab: 'bo' as Tab },
                          { label: 'Duplicate leads', val: duplicateLeads.length, color: 'var(--purple)', tab: 'duplicates' as Tab },
                          { label: 'Hot leads unresponded', val: hotLeads, color: '#ff4757', tab: 'bo' as Tab },
                        ].map(item => (
                          <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setActiveTab(item.tab)}>
                            <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{item.label}</span>
                            <span style={{ fontSize: '16px', fontWeight: 700, color: item.val > 0 ? item.color : 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>{item.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role-wise Summary */}
                <div className="ov-col3">
                  {/* BO Summary */}
                  <div className="fm-card" style={{ marginBottom: 0 }}>
                    <div className="fm-card-head"><div className="fm-card-title">BO performance</div><span className="fm-badge fm-badge-accent">{bos.length} BOs</span></div>
                    <div className="fm-card-body">
                      {[
                        { l: 'Connected', v: leads.filter(l => l.numberStatus === 'Connected').length, c: 'var(--success)' },
                        { l: 'Interested', v: leads.filter(l => l.leadStatus === 'Interested').length, c: 'var(--purple)' },
                        { l: 'Total calls', v: totalCalls, c: 'var(--accent)' },
                        { l: 'Follow-ups due', v: overdueFollowups, c: 'var(--danger)' },
                        { l: 'Meeting reqs', v: meetingRequests.length, c: 'var(--warning)' },
                      ].map(r => (
                        <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{r.l}</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: r.c, fontFamily: "'JetBrains Mono', monospace" }}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* TC Summary */}
                  <div className="fm-card" style={{ marginBottom: 0 }}>
                    <div className="fm-card-head"><div className="fm-card-title">TC performance</div><span className="fm-badge fm-badge-teal">{tcs.length} TCs</span></div>
                    <div className="fm-card-body">
                      {[
                        { l: 'Pending requests', v: pendingReqs, c: 'var(--warning)' },
                        { l: 'Approved requests', v: meetingRequests.filter(r => r.status === 'Approved').length, c: 'var(--success)' },
                        { l: 'Meetings scheduled', v: meetings.filter(m => m.status === 'Scheduled').length, c: 'var(--accent)' },
                        { l: 'Reschedule requests', v: rescheduleCount, c: 'var(--orange)' },
                        { l: 'Total teams', v: teams.length, c: 'var(--teal)' },
                      ].map(r => (
                        <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{r.l}</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: r.c, fontFamily: "'JetBrains Mono', monospace" }}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* BDM/BDO Summary */}
                  <div className="fm-card" style={{ marginBottom: 0 }}>
                    <div className="fm-card-head"><div className="fm-card-title">BDM · BDO</div><span className="fm-badge fm-badge-purple">{bdms.length + bdos.length} active</span></div>
                    <div className="fm-card-body">
                      {[
                        { l: 'Meetings done', v: meetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length, c: 'var(--success)' },
                        { l: 'Pending meetings', v: meetings.filter(m => m.status === 'Pending').length, c: 'var(--warning)' },
                        { l: 'Converted', v: converted, c: 'var(--success)' },
                        { l: 'Mini logins', v: meetings.filter(m => m.miniLogin).length, c: 'var(--accent)' },
                        { l: 'Walking done', v: meetings.filter(m => m.walkingStatus === 'Walking Done').length, c: 'var(--teal)' },
                      ].map(r => (
                        <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{r.l}</span>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: r.c, fontFamily: "'JetBrains Mono', monospace" }}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ BO ACTIVITY ════ */}
            {activeTab === 'bo' && (
              <div className="fade-in">
                <div className="fm-topbar">
                  <div>
                    <div className="fm-page-title">BO Activity Monitor</div>
                    <div className="fm-page-sub">// {bos.length} business officers · real-time lead activity</div>
                  </div>
                  <div className="fm-clock">{clock}</div>
                </div>
                <div className="fm-date-row">
                  <span className="fm-label">FROM</span>
                  <input type="date" className="fm-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  <span className="fm-label">TO</span>
                  <input type="date" className="fm-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                  {(fromDate||toDate) && <button className="fm-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>}
                </div>

                {/* BO selector chips */}
                <div className="chip-tabs">
                  {bos.map(bo => (
                    <div key={bo.id} className={`chip-tab ${selectedBO === bo.id ? 'active' : ''}`} onClick={() => setSelectedBO(selectedBO === bo.id ? null : bo.id)}>
                      <span className={onlineIds.has(bo.id) ? '' : ''} style={{ marginRight: '5px', display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: onlineIds.has(bo.id) ? 'var(--success)' : 'var(--text3)', verticalAlign: 'middle' }} />
                      {bo.name}
                    </div>
                  ))}
                </div>

                {/* BO Summary Table */}
                <div className="fm-card">
                  <div className="fm-card-head">
                    <div className="fm-card-title">All BOs — lead activity</div>
                    <span className="fm-badge fm-badge-accent">{bos.length} total</span>
                  </div>
                  <table className="fm-table">
                    <thead><tr>
                      <th>BO Name</th><th>Status</th><th>Leads</th><th>Connected</th><th>Interested</th>
                      <th>Calls</th><th>Hot</th><th>Overdue F/U</th><th>Meetings</th><th>Conv%</th>
                    </tr></thead>
                    <tbody>
                      {bos.map(bo => {
                        const boLeads = getLeadsForBO(bo.id);
                        const boMeetings = filteredMeetings.filter(m => m.boId === bo.id);
                        const conv = boMeetings.filter(m => m.status === 'Converted').length;
                        const convRate = boMeetings.length ? Math.round(conv/boMeetings.length*100) : 0;
                        const boHot = boLeads.filter(l => l.priority === 'Hot').length;
                        const boCalls = boLeads.reduce((s, l) => s + (l.callCount || 0), 0);
                        const boOD = boLeads.filter(l => l.followUpDate && l.followUpDate < today).length;
                        const isSelected = selectedBO === bo.id;
                        return (
                          <React.Fragment key={bo.id}>
                            <tr style={{ cursor: 'pointer', background: isSelected ? 'var(--surface2)' : undefined }} onClick={() => setSelectedBO(isSelected ? null : bo.id)}>
                              <td className="pri">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                  <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(61,127,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>{bo.name[0]}</div>
                                  {bo.name}
                                </div>
                              </td>
                              <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: onlineIds.has(bo.id) ? 'var(--success)' : 'var(--text3)', fontFamily: "'JetBrains Mono', monospace' " }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />{onlineIds.has(bo.id) ? 'Online' : 'Offline'}</span></td>
                              <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{boLeads.length}</td>
                              <td style={{ color: 'var(--success)', fontWeight: 600 }}>{boLeads.filter(l => l.numberStatus === 'Connected').length}</td>
                              <td style={{ color: 'var(--purple)' }}>{boLeads.filter(l => l.leadStatus === 'Interested').length}</td>
                              <td style={{ color: 'var(--teal)', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{boCalls}</td>
                              <td>{boHot > 0 ? <Badge cls="fm-badge-hot">{boHot} Hot</Badge> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                              <td>{boOD > 0 ? <Badge cls="fm-badge-danger">⚠ {boOD}</Badge> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                              <td style={{ color: 'var(--text)' }}>{boMeetings.length}</td>
                              <td style={{ color: convRate >= 50 ? 'var(--success)' : convRate >= 25 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{convRate}%</td>
                            </tr>
                            {isSelected && (
                              <tr>
                                <td colSpan={10} style={{ padding: 0, background: 'var(--bg3)' }}>
                                  <div style={{ padding: '14px 16px' }}>
                                    {/* BO Drill-down */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '10px', marginBottom: '12px' }}>
                                      {/* Priority breakdown */}
                                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                                        <div style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', marginBottom: '8px' }}>PRIORITY TAGS</div>
                                        {[
                                          { l: 'Hot', v: boLeads.filter(l => l.priority === 'Hot').length, c: '#ff4757', bg: 'rgba(255,71,87,0.1)' },
                                          { l: 'Warm', v: boLeads.filter(l => l.priority === 'Warm').length, c: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                                          { l: 'Cold', v: boLeads.filter(l => l.priority === 'Cold').length, c: 'var(--accent)', bg: 'rgba(61,127,255,0.1)' },
                                          { l: 'Untagged', v: boLeads.filter(l => !l.priority).length, c: 'var(--text3)', bg: 'transparent' },
                                        ].map(item => (
                                          <div key={item.l} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                                            <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: item.c, background: item.bg, padding: '1px 6px', borderRadius: '4px', minWidth: '46px', textAlign: 'center', fontWeight: 700 }}>{item.l}</span>
                                            <FunnelBar val={item.v} total={boLeads.length} color={item.c} />
                                          </div>
                                        ))}
                                      </div>
                                      {/* Follow-up status */}
                                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                                        <div style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', marginBottom: '8px' }}>FOLLOW-UP STATUS</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                          {[
                                            { v: boLeads.filter(l => l.followUpDate && l.followUpDate < today).length, l: 'OVERDUE', c: '#ff4757' },
                                            { v: boLeads.filter(l => l.followUpDate === today).length, l: 'TODAY', c: '#f59e0b' },
                                            { v: boLeads.filter(l => l.followUpDate && l.followUpDate > today).length, l: 'UPCOMING', c: 'var(--success)' },
                                            { v: boLeads.filter(l => l.followUpDate).length, l: 'TOTAL SET', c: 'var(--accent)' },
                                          ].map(item => <StatPill key={item.l} label={item.l} val={item.v} color={item.c} />)}
                                        </div>
                                      </div>
                                      {/* Call activity */}
                                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px' }}>
                                        <div style={{ fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', marginBottom: '8px' }}>CALL ACTIVITY</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                          {[
                                            { v: boLeads.reduce((s, l) => s + (l.callCount||0), 0), l: 'TOTAL CALLS', c: 'var(--accent)' },
                                            { v: +(boLeads.length > 0 ? (boLeads.reduce((s,l) => s+(l.callCount||0),0)/boLeads.length).toFixed(1) : 0), l: 'AVG/LEAD', c: 'var(--purple)' },
                                            { v: boLeads.filter(l => !l.callCount || l.callCount === 0).length, l: 'NOT CALLED', c: '#ff4757' },
                                            { v: boLeads.filter(l => (l.callCount||0) >= 3).length, l: '3+ CALLS', c: '#f59e0b' },
                                          ].map(item => <StatPill key={item.l} label={item.l} val={item.v} color={item.c} />)}
                                        </div>
                                      </div>
                                    </div>
                                    {/* Leads table */}
                                    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>ASSIGNED LEADS</span>
                                        <span style={{ color: 'var(--teal)' }}>Priority · Calls · Follow-up from DB</span>
                                      </div>
                                      <table className="fm-table">
                                        <thead><tr><th>Client</th><th>Phone</th><th>Num. Status</th><th>Lead Status</th><th>Priority</th><th>Calls</th><th>Follow-up</th><th>Loan</th></tr></thead>
                                        <tbody>
                                          {boLeads.slice(0, 8).map(l => {
                                            const fuDate = l.followUpDate || '';
                                            const isOD = fuDate && fuDate < today;
                                            const isToday = fuDate === today;
                                            return (
                                              <tr key={l.id}>
                                                <td className="pri">{l.clientName}</td>
                                                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{l.phoneNumber}</td>
                                                <td><Badge cls={l.numberStatus === 'Connected' ? 'fm-badge-success' : l.numberStatus === 'Not Connected' ? 'fm-badge-danger' : 'fm-badge-warning'}>{l.numberStatus || '—'}</Badge></td>
                                                <td><Badge cls={l.leadStatus === 'Interested' ? 'fm-badge-success' : l.leadStatus === 'Not Interested' ? 'fm-badge-danger' : 'fm-badge-default'}>{l.leadStatus || '—'}</Badge></td>
                                                <td>{l.priority ? <Badge cls={`fm-badge-${l.priority.toLowerCase()}`}>{l.priority}</Badge> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                                                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: (l.callCount||0) === 0 ? 'var(--danger)' : (l.callCount||0) >= 3 ? 'var(--warning)' : 'var(--accent)' }}>{l.callCount || 0}</td>
                                                <td>{fuDate ? <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: isOD ? '#ff4757' : isToday ? '#f59e0b' : '#00d4aa' }}>{isOD ? '⚠ ' : isToday ? '● ' : ''}{fuDate}</span> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                                                <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{l.loanRequirement}</td>
                                              </tr>
                                            );
                                          })}
                                          {boLeads.length === 0 && <tr><td colSpan={8} className="fm-empty">No leads assigned</td></tr>}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {bos.length === 0 && <tr><td colSpan={10} className="fm-empty">No Business Officers found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════ TC MONITOR ════ */}
            {activeTab === 'tc' && (
              <div className="fade-in">
                <div className="fm-topbar">
                  <div>
                    <div className="fm-page-title">TC Monitor</div>
                    <div className="fm-page-sub">// {tcs.length} team captains · {teams.length} teams · {pendingReqs} pending requests</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="date" className="fm-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    <input type="date" className="fm-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                    {(fromDate||toDate) && <button className="fm-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>}
                  </div>
                </div>

                <div className="chip-tabs">
                  {tcs.map(tc => (
                    <div key={tc.id} className={`chip-tab ${selectedTC === tc.id ? 'active' : ''}`} onClick={() => setSelectedTC(selectedTC === tc.id ? null : tc.id)}>
                      <span style={{ marginRight: '5px', display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: onlineIds.has(tc.id) ? 'var(--success)' : 'var(--text3)', verticalAlign: 'middle' }} />
                      {tc.name}
                    </div>
                  ))}
                </div>

                <div className="fm-card">
                  <div className="fm-card-head"><div className="fm-card-title">Team captain overview</div></div>
                  <table className="fm-table">
                    <thead><tr><th>TC Name</th><th>Status</th><th>Team</th><th>BOs</th><th>Total Leads</th><th>Meetings</th><th>Pending Req</th><th>Reschedule</th><th>Approved</th><th>Rejected</th></tr></thead>
                    <tbody>
                      {tcs.map(tc => {
                        const team = teams.find(t => t.tcId === tc.id);
                        const tcLeads = leads.filter(l => team?.boIds.includes(l.assignedBOId));
                        const tcMeetings = filteredMeetings.filter(m => m.tcId === tc.id);
                        const tcReqs = meetingRequests.filter(r => r.tcId === tc.id);
                        const isSelected = selectedTC === tc.id;
                        return (
                          <React.Fragment key={tc.id}>
                            <tr style={{ cursor: 'pointer', background: isSelected ? 'var(--surface2)' : undefined }} onClick={() => setSelectedTC(isSelected ? null : tc.id)}>
                              <td className="pri">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                  <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--teal)', flexShrink: 0 }}>{tc.name[0]}</div>
                                  {tc.name}
                                </div>
                              </td>
                              <td><span style={{ fontSize: '10px', color: onlineIds.has(tc.id) ? 'var(--success)' : 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>{onlineIds.has(tc.id) ? '● Online' : '○ Offline'}</span></td>
                              <td style={{ color: 'var(--teal)' }}>{team?.name || '—'}</td>
                              <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{team?.boIds.length || 0}</td>
                              <td style={{ color: 'var(--text)', fontWeight: 600 }}>{tcLeads.length}</td>
                              <td style={{ color: 'var(--accent)' }}>{tcMeetings.length}</td>
                              <td>{tcReqs.filter(r => r.status === 'Pending').length > 0 ? <Badge cls="fm-badge-warning">{tcReqs.filter(r => r.status === 'Pending').length}</Badge> : <span style={{ color: 'var(--text3)' }}>0</span>}</td>
                              <td>{tcMeetings.filter(m => m.status === 'Reschedule Requested').length > 0 ? <Badge cls="fm-badge-warning">{tcMeetings.filter(m => m.status === 'Reschedule Requested').length}</Badge> : <span style={{ color: 'var(--text3)' }}>0</span>}</td>
                              <td style={{ color: 'var(--success)', fontWeight: 600 }}>{tcReqs.filter(r => r.status === 'Approved').length}</td>
                              <td style={{ color: 'var(--danger)' }}>{tcReqs.filter(r => r.status === 'Rejected').length}</td>
                            </tr>
                            {isSelected && (() => {
                              const boIds = team?.boIds || [];
                              return (
                                <tr>
                                  <td colSpan={10} style={{ padding: 0, background: 'var(--bg3)' }}>
                                    <div style={{ padding: '14px 16px' }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '8px', marginBottom: '12px' }}>
                                        {[
                                          { v: tcMeetings.filter(m => m.status === 'Scheduled').length, l: 'SCHEDULED', c: 'var(--accent)' },
                                          { v: tcMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length, l: 'DONE', c: 'var(--success)' },
                                          { v: tcMeetings.filter(m => m.status === 'Not Done').length, l: 'NOT DONE', c: '#ff4757' },
                                          { v: tcMeetings.filter(m => m.status === 'Converted').length, l: 'CONVERTED', c: 'var(--success)' },
                                        ].map(item => <StatPill key={item.l} label={item.l} val={item.v} color={item.c} />)}
                                      </div>
                                      {/* Meeting requests */}
                                      {meetingRequests.filter(r => r.tcId === tc.id && r.status === 'Pending').length > 0 && (
                                        <div style={{ background: 'var(--surface)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', overflow: 'hidden', marginBottom: '10px' }}>
                                          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '9px', color: 'var(--warning)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px' }}>PENDING MEETING REQUESTS</div>
                                          <table className="fm-table">
                                            <thead><tr><th>Client</th><th>BO</th><th>Loan Req.</th><th>Lead Status</th><th>Date</th></tr></thead>
                                            <tbody>
                                              {meetingRequests.filter(r => r.tcId === tc.id && r.status === 'Pending').map(req => {
                                                const lead = leads.find(l => l.id === req.leadId);
                                                const bo = users.find(u => u.id === req.boId);
                                                return (
                                                  <tr key={req.id}>
                                                    <td className="pri">{lead?.clientName}</td>
                                                    <td>{bo?.name}</td>
                                                    <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{lead?.loanRequirement}</td>
                                                    <td><Badge cls="fm-badge-success">{lead?.leadStatus}</Badge></td>
                                                    <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{req.createdAt}</td>
                                                  </tr>
                                                );
                                              })}
                                            </tbody>
                                          </table>
                                        </div>
                                      )}
                                      {/* Today's meetings */}
                                      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontSize: '9px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px' }}>RECENT MEETINGS</div>
                                        <table className="fm-table">
                                          <thead><tr><th>Client</th><th>Date</th><th>BDM</th><th>Product</th><th>Status</th></tr></thead>
                                          <tbody>
                                            {tcMeetings.slice(0, 6).map(m => {
                                              const lead = leads.find(l => l.id === m.leadId);
                                              const bdm = users.find(u => u.id === m.bdmId);
                                              return (
                                                <tr key={m.id}>
                                                  <td className="pri">{m.clientName || lead?.clientName}</td>
                                                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{m.date}</td>
                                                  <td>{bdm?.name}</td>
                                                  <td><span style={{ fontSize: '10px', background: 'var(--surface2)', color: 'var(--text2)', padding: '1px 7px', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{m.productType || '—'}</span></td>
                                                  <td><Badge cls={m.status === 'Converted' ? 'fm-badge-success' : m.status === 'Not Done' ? 'fm-badge-danger' : m.status === 'Reschedule Requested' ? 'fm-badge-warning' : 'fm-badge-accent'}>{m.status}</Badge></td>
                                                </tr>
                                              );
                                            })}
                                            {tcMeetings.length === 0 && <tr><td colSpan={5} className="fm-empty">No meetings</td></tr>}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })()}
                          </React.Fragment>
                        );
                      })}
                      {tcs.length === 0 && <tr><td colSpan={10} className="fm-empty">No Team Captains found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════ BDM MONITOR ════ */}
            {activeTab === 'bdm' && (
              <div className="fade-in">
                <div className="fm-topbar">
                  <div>
                    <div className="fm-page-title">BDM Monitor</div>
                    <div className="fm-page-sub">// {bdms.length} business development managers</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="date" className="fm-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    <input type="date" className="fm-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                    {(fromDate||toDate) && <button className="fm-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>}
                  </div>
                </div>
                <div className="fm-card">
                  <div className="fm-card-head"><div className="fm-card-title">BDM performance</div></div>
                  <table className="fm-table">
                    <thead><tr><th>BDM Name</th><th>Status</th><th>Total Mtgs</th><th>Pending</th><th>Done</th><th>Converted</th><th>Walk-in</th><th>Reschedule</th><th>Mini Login</th><th>Conv%</th></tr></thead>
                    <tbody>
                      {bdms.map(bdm => {
                        const bdmMtgs = filteredMeetings.filter(m => m.bdmId === bdm.id);
                        const done = bdmMtgs.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length;
                        const conv = bdmMtgs.filter(m => m.status === 'Converted').length;
                        const walkin = bdmMtgs.filter(m => m.meetingType === 'Walk-in').length;
                        const reschedule = bdmMtgs.filter(m => m.status === 'Reschedule Requested').length;
                        const mini = bdmMtgs.filter(m => m.miniLogin).length;
                        const convRate = bdmMtgs.length ? Math.round(conv/bdmMtgs.length*100) : 0;
                        return (
                          <tr key={bdm.id}>
                            <td className="pri">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--purple)', flexShrink: 0 }}>{bdm.name[0]}</div>
                                {bdm.name}
                              </div>
                            </td>
                            <td><span style={{ fontSize: '10px', color: onlineIds.has(bdm.id) ? 'var(--success)' : 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>{onlineIds.has(bdm.id) ? '● Online' : '○ Offline'}</span></td>
                            <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{bdmMtgs.length}</td>
                            <td style={{ color: 'var(--warning)' }}>{bdmMtgs.filter(m => m.status === 'Pending' || m.status === 'Scheduled').length}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 600 }}>{done}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 700 }}>{conv}</td>
                            <td style={{ color: 'var(--teal)' }}>{walkin}</td>
                            <td>{reschedule > 0 ? <Badge cls="fm-badge-warning">{reschedule}</Badge> : <span style={{ color: 'var(--text3)' }}>0</span>}</td>
                            <td style={{ color: 'var(--accent)' }}>{mini}</td>
                            <td style={{ color: convRate >= 50 ? 'var(--success)' : convRate >= 25 ? 'var(--warning)' : 'var(--danger)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{convRate}%</td>
                          </tr>
                        );
                      })}
                      {bdms.length === 0 && <tr><td colSpan={10} className="fm-empty">No BDMs found</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* Recent meetings by BDM */}
                <div className="fm-card">
                  <div className="fm-card-head"><div className="fm-card-title">Recent BDM meetings</div></div>
                  <table className="fm-table">
                    <thead><tr><th>Date</th><th>Time</th><th>Client</th><th>BDM</th><th>TC</th><th>Product</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {filteredMeetings.slice().sort((a,b) => b.date.localeCompare(a.date)).slice(0, 15).map(m => {
                        const lead = leads.find(l => l.id === m.leadId);
                        const bdm = users.find(u => u.id === m.bdmId);
                        const tc = users.find(u => u.id === m.tcId);
                        return (
                          <tr key={m.id}>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{m.date}</td>
                            <td style={{ color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{m.timeSlot}</td>
                            <td className="pri">{m.clientName || lead?.clientName}</td>
                            <td>{bdm?.name}</td>
                            <td style={{ color: 'var(--teal)' }}>{tc?.name}</td>
                            <td><span style={{ fontSize: '10px', background: 'var(--surface2)', color: 'var(--text2)', padding: '1px 7px', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{m.productType || '—'}</span></td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{lead?.loanRequirement}</td>
                            <td><Badge cls={m.status === 'Converted' ? 'fm-badge-success' : m.status === 'Not Done' ? 'fm-badge-danger' : m.status === 'Reschedule Requested' ? 'fm-badge-warning' : 'fm-badge-accent'}>{m.status}</Badge></td>
                          </tr>
                        );
                      })}
                      {filteredMeetings.length === 0 && <tr><td colSpan={8} className="fm-empty">No meetings found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════ BDO MONITOR ════ */}
            {activeTab === 'bdo' && (
              <div className="fade-in">
                <div className="fm-topbar">
                  <div>
                    <div className="fm-page-title">BDO Monitor</div>
                    <div className="fm-page-sub">// {bdos.length} business development officers · post-meeting conversions</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="date" className="fm-date-input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                    <input type="date" className="fm-date-input" value={toDate} onChange={e => setToDate(e.target.value)} />
                    {(fromDate||toDate) && <button className="fm-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>}
                  </div>
                </div>
                <div className="fm-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
                  {[
                    { l: 'Pending BDO Action', v: filteredMeetings.filter(m => m.status === 'Meeting Done' && (!m.bdoStatus || m.bdoStatus === '')).length, c: 'var(--warning)' },
                    { l: 'Converted by BDM', v: filteredMeetings.filter(m => m.bdoStatus === 'Converted by BDM').length, c: 'var(--success)' },
                    { l: 'Walking Done', v: filteredMeetings.filter(m => m.walkingStatus === 'Walking Done').length, c: 'var(--teal)' },
                    { l: 'Mini + Full Login', v: filteredMeetings.filter(m => m.miniLogin || m.fullLogin).length, c: 'var(--accent)' },
                  ].map(k => (
                    <div key={k.l} className="fm-kpi">
                      <div className="fm-kpi-label">{k.l}</div>
                      <div className="fm-kpi-val" style={{ color: k.c }}>{k.v}</div>
                    </div>
                  ))}
                </div>
                <div className="fm-card">
                  <div className="fm-card-head"><div className="fm-card-title">BDO performance table</div></div>
                  <table className="fm-table">
                    <thead><tr><th>BDO Name</th><th>Status</th><th>Pending</th><th>Conv. by BDM</th><th>Follow-up</th><th>Walking Done</th><th>Mini Login</th><th>Full Login</th></tr></thead>
                    <tbody>
                      {bdos.map(bdo => {
                        const bdoMtgs = filteredMeetings.filter(m => m.bdoId === bdo.id);
                        const doneMtgs = filteredMeetings.filter(m => m.status === 'Meeting Done');
                        return (
                          <tr key={bdo.id}>
                            <td className="pri">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '7px', background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--warning)', flexShrink: 0 }}>{bdo.name[0]}</div>
                                {bdo.name}
                              </div>
                            </td>
                            <td><span style={{ fontSize: '10px', color: onlineIds.has(bdo.id) ? 'var(--success)' : 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>{onlineIds.has(bdo.id) ? '● Online' : '○ Offline'}</span></td>
                            <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{doneMtgs.filter(m => !m.bdoStatus || m.bdoStatus === '').length}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 700 }}>{doneMtgs.filter(m => m.bdoStatus === 'Converted by BDM').length}</td>
                            <td style={{ color: 'var(--purple)' }}>{doneMtgs.filter(m => m.bdoStatus === 'Follow-up').length}</td>
                            <td style={{ color: 'var(--teal)', fontWeight: 600 }}>{doneMtgs.filter(m => m.walkingStatus === 'Walking Done').length}</td>
                            <td style={{ color: 'var(--accent)' }}>{doneMtgs.filter(m => m.miniLogin).length}</td>
                            <td style={{ color: 'var(--accent)' }}>{doneMtgs.filter(m => m.fullLogin).length}</td>
                          </tr>
                        );
                      })}
                      {bdos.length === 0 && <tr><td colSpan={8} className="fm-empty">No BDOs found</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* Post-meeting pipeline */}
                <div className="fm-card">
                  <div className="fm-card-head"><div className="fm-card-title">Post-meeting pipeline</div><div className="fm-card-sub">// Meeting Done → BDO action required</div></div>
                  <table className="fm-table">
                    <thead><tr><th>Client</th><th>Date</th><th>BDM</th><th>BDO</th><th>BDO Status</th><th>Walking Status</th><th>Mini Login</th><th>Loan</th></tr></thead>
                    <tbody>
                      {filteredMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Pending').slice(0, 15).map(m => {
                        const lead = leads.find(l => l.id === m.leadId);
                        const bdm = users.find(u => u.id === m.bdmId);
                        const bdo = users.find(u => u.id === m.bdoId);
                        return (
                          <tr key={m.id}>
                            <td className="pri">{m.clientName || lead?.clientName}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>{m.date}</td>
                            <td>{bdm?.name}</td>
                            <td>{bdo?.name || <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                            <td>{m.bdoStatus ? <Badge cls={m.bdoStatus === 'Converted by BDM' ? 'fm-badge-success' : 'fm-badge-purple'}>{m.bdoStatus}</Badge> : <Badge cls="fm-badge-warning">Pending</Badge>}</td>
                            <td>{m.walkingStatus ? <Badge cls={m.walkingStatus === 'Walking Done' ? 'fm-badge-teal' : 'fm-badge-danger'}>{m.walkingStatus}</Badge> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                            <td>{m.miniLogin ? <Badge cls="fm-badge-success">Yes</Badge> : <span style={{ color: 'var(--text3)' }}>No</span>}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{lead?.loanRequirement}</td>
                          </tr>
                        );
                      })}
                      {filteredMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Pending').length === 0 && <tr><td colSpan={8} className="fm-empty">No pending BDO actions</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════ LEADS ════ */}
            {activeTab === 'leads' && (
              <div className="fade-in">
                <div className="fm-topbar">
                  <div><div className="fm-page-title">Leads Management</div><div className="fm-page-sub">// {leads.length} total leads · upload · distribute</div></div>
                </div>
                {/* BO selector */}
                <div className="fm-card">
                  <div className="fm-card-head"><div className="fm-card-title">Select BOs for distribution</div></div>
                  <div className="fm-card-body">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                      {bos.map(bo => (
                        <button key={bo.id} onClick={() => setSelectedBOs(p => p.includes(bo.id) ? p.filter(i => i !== bo.id) : [...p, bo.id])}
                          style={{ padding: '5px 12px', borderRadius: '8px', border: `1px solid ${selectedBOs.includes(bo.id) ? 'var(--teal)' : 'var(--border2)'}`, background: selectedBOs.includes(bo.id) ? 'rgba(6,182,212,0.1)' : 'var(--surface2)', color: selectedBOs.includes(bo.id) ? 'var(--teal)' : 'var(--text2)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'inherit' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: onlineIds.has(bo.id) ? 'var(--success)' : 'var(--text3)', display: 'inline-block', flexShrink: 0 }} />
                          {bo.name}
                        </button>
                      ))}
                    </div>
                    {selectedBOs.length > 0 && <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '8px', fontFamily: "'JetBrains Mono', monospace" }}>{selectedBOs.length} BOs selected</div>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  {/* Excel upload */}
                  <div className="fm-card" style={{ marginBottom: 0 }}>
                    <div className="fm-card-head"><div className="fm-card-title">{I.upload} Excel upload</div></div>
                    <div className="fm-card-body">
                      <p style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '12px' }}>Columns: Client Name, Phone Number, Loan Requirement Amount</p>
                      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} style={{ display: 'none' }} />
                      <button className="fm-btn fm-btn-primary" onClick={() => fileInputRef.current?.click()}>{I.upload} Upload Excel</button>
                    </div>
                  </div>
                  {/* Manual */}
                  <div className="fm-card" style={{ marginBottom: 0 }}>
                    <div className="fm-card-head"><div className="fm-card-title">Add lead manually</div></div>
                    <div className="fm-card-body">
                      <div className="fm-form-row" style={{ marginBottom: '8px' }}>
                        <div className="fm-form-field">
                          <div className="fm-field-label">Client Name</div>
                          <input className="fm-input" value={leadInput.clientName} onChange={e => setLeadInput(p => ({ ...p, clientName: e.target.value }))} placeholder="Name" />
                        </div>
                        <div className="fm-form-field">
                          <div className="fm-field-label">Phone</div>
                          <input className="fm-input" value={leadInput.phoneNumber} onChange={e => setLeadInput(p => ({ ...p, phoneNumber: e.target.value.replace(/\D/g,'') }))} placeholder="10 digits" />
                        </div>
                      </div>
                      <div className="fm-form-field" style={{ marginBottom: '10px' }}>
                        <div className="fm-field-label">Loan Requirement</div>
                        <input className="fm-input" value={leadInput.loanRequirement} onChange={e => setLeadInput(p => ({ ...p, loanRequirement: e.target.value }))} placeholder="Amount" />
                      </div>
                      <button className="fm-btn fm-btn-primary" disabled={isLoading('add_lead')} onClick={() => withLoading('add_lead', handleAddLead)}>{I.plus} {isLoading('add_lead') ? 'Adding...' : 'Add Lead'}</button>
                    </div>
                  </div>
                </div>

                {/* Paste */}
                <div className="fm-card">
                  <div className="fm-card-head"><div className="fm-card-title">{I.paste} Paste from Excel</div></div>
                  <div className="fm-card-body">
                    <textarea className="fm-textarea" rows={4} value={pasteData} onChange={e => setPasteData(e.target.value)} placeholder="Paste tab-separated data with headers..." style={{ marginBottom: '10px' }} />
                    <button className="fm-btn fm-btn-ghost" disabled={!pasteData.trim() || isLoading('paste')} onClick={() => withLoading('paste', handlePasteImport)}>{I.paste} {isLoading('paste') ? 'Importing...' : 'Import Pasted Data'}</button>
                  </div>
                </div>

                {/* All leads table */}
                <div className="fm-card">
                  <div className="fm-card-head"><div className="fm-card-title">All leads ({leads.length})</div></div>
                  <table className="fm-table">
                    <thead><tr><th>Client</th><th>Phone</th><th>Loan</th><th>BO</th><th>Num. Status</th><th>Lead Status</th><th>Priority</th><th>Calls</th><th>Follow-up</th><th>Date</th></tr></thead>
                    <tbody>
                      {leads.slice(0, 30).map(l => {
                        const bo = users.find(u => u.id === l.assignedBOId);
                        const fuDate = l.followUpDate || '';
                        const isOD = fuDate && fuDate < today;
                        return (
                          <tr key={l.id}>
                            <td className="pri">{l.clientName}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{l.phoneNumber}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{l.loanRequirement}</td>
                            <td>{bo?.name}</td>
                            <td><Badge cls={l.numberStatus === 'Connected' ? 'fm-badge-success' : l.numberStatus === 'Not Connected' ? 'fm-badge-danger' : 'fm-badge-default'}>{l.numberStatus || '—'}</Badge></td>
                            <td><Badge cls={l.leadStatus === 'Interested' ? 'fm-badge-success' : l.leadStatus === 'Not Interested' ? 'fm-badge-danger' : 'fm-badge-default'}>{l.leadStatus || '—'}</Badge></td>
                            <td>{l.priority ? <Badge cls={`fm-badge-${l.priority.toLowerCase()}`}>{l.priority}</Badge> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", color: (l.callCount||0) > 0 ? 'var(--teal)' : 'var(--text3)', fontWeight: 600 }}>{l.callCount || 0}</td>
                            <td>{fuDate ? <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: isOD ? '#ff4757' : '#00d4aa', fontWeight: 600 }}>{isOD ? '⚠ ' : ''}{fuDate}</span> : <span style={{ color: 'var(--text3)' }}>—</span>}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{l.assignedDate}</td>
                          </tr>
                        );
                      })}
                      {leads.length === 0 && <tr><td colSpan={10} className="fm-empty">No leads yet</td></tr>}
                    </tbody>
                  </table>
                  {leads.length > 30 && <div style={{ padding: '10px 14px', fontSize: '10px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace", borderTop: '1px solid var(--border)' }}>Showing first 30 of {leads.length} leads</div>}
                </div>
              </div>
            )}

            {/* ════ USERS ════ */}
            {activeTab === 'users' && (
              <div className="fade-in">
                <div className="fm-topbar">
                  <div><div className="fm-page-title">User Management</div><div className="fm-page-sub">// {users.filter(u => u.role !== 'FM').length} users across all roles</div></div>
                  <button className="fm-btn fm-btn-primary" onClick={() => setShowAddUser(true)}>{I.plus} Add User</button>
                </div>
                <div className="fm-card">
                  <table className="fm-table">
                    <thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Team</th><th>Status</th><th>Online</th><th>Actions</th></tr></thead>
                    <tbody>
                      {users.filter(u => u.role !== 'FM').map(user => {
                        const userTeam = teams.find(t => t.boIds.includes(user.id) || t.tcId === user.id);
                        const isEditing = editingUser === user.id;
                        const roleColors: Record<string,string> = { BO: 'fm-badge-accent', TC: 'fm-badge-teal', BDM: 'fm-badge-purple', BDO: 'fm-badge-warning' };
                        return (
                          <tr key={user.id}>
                            <td className="pri">{user.name}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{user.username}</td>
                            <td>
                              {isEditing ? (
                                <select className="fm-select fm-select-sm" value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}>
                                  {['BO','TC','BDM','BDO'].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                              ) : <Badge cls={roleColors[user.role] || 'fm-badge-default'}>{user.role}</Badge>}
                            </td>
                            <td>
                              {isEditing && editRole === 'BO' ? (
                                <select className="fm-select fm-select-sm" value={editTCId} onChange={e => setEditTCId(e.target.value)}>
                                  <option value="">Select TC</option>
                                  {tcs.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
                                </select>
                              ) : <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{userTeam?.name || '—'}</span>}
                            </td>
                            <td>
                              <div className="fm-switch" onClick={() => updateUser(user.id, { active: !user.active })}>
                                <div className={`fm-switch-track ${user.active ? 'on' : ''}`}><div className="fm-switch-thumb" /></div>
                                <span>{user.active ? 'Active' : 'Inactive'}</span>
                              </div>
                            </td>
                            <td><span style={{ fontSize: '10px', color: onlineIds.has(user.id) ? 'var(--success)' : 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>{onlineIds.has(user.id) ? '● Online' : '—'}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {isEditing ? (
                                  <>
                                    <button className="fm-btn fm-btn-primary fm-btn-sm" disabled={isLoading(`edit_${user.id}`)} onClick={() => withLoading(`edit_${user.id}`, () => handleEditRole(user.id))}>{I.check}</button>
                                    <button className="fm-btn fm-btn-ghost fm-btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
                                  </>
                                ) : (
                                  <>
                                    <button className="fm-btn fm-btn-ghost fm-btn-sm" onClick={() => { setEditingUser(user.id); setEditRole(user.role); setEditTCId(''); }}>{I.edit}</button>
                                    <button className="fm-btn fm-btn-danger fm-btn-sm" onClick={() => setUserToDelete(user.id)}>{I.trash}</button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ════ TEAMS ════ */}
            {activeTab === 'teams' && (
              <div className="fade-in">
                <div className="fm-topbar">
                  <div><div className="fm-page-title">Team Management</div><div className="fm-page-sub">// {teams.length} teams · assign TC and BOs</div></div>
                  <button className="fm-btn fm-btn-primary" onClick={() => setShowCreateTeam(true)}>{I.plus} Create Team</button>
                </div>
                {teams.map(team => {
                  const tc = users.find(u => u.id === team.tcId);
                  const isEditing = editingTeam === team.id;
                  return (
                    <div key={team.id} className="fm-card">
                      <div className="fm-card-head">
                        <div>
                          <div className="fm-card-title">{team.name}</div>
                          <div className="fm-card-sub">TC: {tc?.name || '—'} · {team.boIds.length} BOs</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="fm-btn fm-btn-ghost fm-btn-sm" onClick={() => { setChangeTCTeamId(changeTCTeamId === team.id ? null : team.id); setNewTCForTeam(''); }}>Change TC</button>
                          <button className="fm-btn fm-btn-ghost fm-btn-sm" onClick={() => setEditingTeam(isEditing ? null : team.id)}>{I.edit}</button>
                          <button className="fm-btn fm-btn-danger fm-btn-sm" onClick={() => setTeamToDelete(team.id)}>{I.trash}</button>
                        </div>
                      </div>
                      <div className="fm-card-body">
                        {changeTCTeamId === team.id && (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', padding: '10px', background: 'var(--bg3)', borderRadius: '8px' }}>
                            <select className="fm-select" value={newTCForTeam} onChange={e => setNewTCForTeam(e.target.value)} style={{ maxWidth: '200px' }}>
                              <option value="">Select new TC</option>
                              {tcs.filter(t => t.id !== team.tcId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <button className="fm-btn fm-btn-primary fm-btn-sm" disabled={isLoading(`tc_${team.id}`)} onClick={() => withLoading(`tc_${team.id}`, async () => { if (!newTCForTeam) { toast.error('Select TC'); return; } await updateTeam(team.id, { tcId: newTCForTeam }); await updateUser(newTCForTeam, { teamId: team.id }); setChangeTCTeamId(null); setNewTCForTeam(''); toast.success('TC changed'); })}>{isLoading(`tc_${team.id}`) ? 'Saving...' : 'Save'}</button>
                          </div>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: isEditing ? '12px' : 0 }}>
                          {team.boIds.map(boId => {
                            const bo = users.find(u => u.id === boId);
                            return (
                              <div key={boId} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Badge cls="fm-badge-accent">{bo?.name}</Badge>
                                {isEditing && <button className="fm-btn fm-btn-danger fm-btn-sm" style={{ padding: '2px 5px' }} disabled={isLoading(`rm_${boId}`)} onClick={() => withLoading(`rm_${boId}`, async () => { await updateTeamMembers(team.id, team.boIds.filter(id => id !== boId)); await updateUser(boId, { teamId: undefined }); toast.success('BO removed'); })}>{I.trash}</button>}
                              </div>
                            );
                          })}
                          {team.boIds.length === 0 && <span style={{ fontSize: '11px', color: 'var(--text3)' }}>No BOs assigned</span>}
                        </div>
                        {isEditing && (
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px', fontWeight: 600 }}>Add BOs:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {bos.filter(b => !team.boIds.includes(b.id)).map(bo => (
                                <button key={bo.id} className="fm-btn fm-btn-ghost fm-btn-sm" disabled={isLoading(`add_${bo.id}`)} onClick={() => withLoading(`add_${bo.id}`, async () => { for (const t of teams) if (t.boIds.includes(bo.id)) await updateTeamMembers(t.id, t.boIds.filter(id => id !== bo.id)); await updateTeamMembers(team.id, [...team.boIds.filter(id => id !== bo.id), bo.id]); await updateUser(bo.id, { teamId: team.id }); toast.success('BO added'); })}>
                                  {I.plus} {isLoading(`add_${bo.id}`) ? '...' : bo.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {teams.length === 0 && <div className="fm-card"><div className="fm-card-body fm-empty">No teams created yet</div></div>}
              </div>
            )}

            {/* ════ DUPLICATES ════ */}
            {activeTab === 'duplicates' && (
              <div className="fade-in">
                <div className="fm-topbar">
                  <div><div className="fm-page-title">Duplicate Leads</div><div className="fm-page-sub">// {duplicateLeads.length} duplicate records</div></div>
                </div>
                <div className="fm-card">
                  <table className="fm-table">
                    <thead><tr><th>Client</th><th>Phone</th><th>Loan</th><th>Meeting Status</th><th>BDO</th><th>Uploaded</th><th>Actions</th></tr></thead>
                    <tbody>
                      {duplicateLeads.map(d => {
                        const orig = leads.find(l => l.id === d.originalLeadId);
                        const mtg = orig ? meetings.find(m => m.leadId === orig.id) : undefined;
                        const bdo = mtg?.bdoId ? users.find(u => u.id === mtg.bdoId) : undefined;
                        return (
                          <tr key={d.id}>
                            <td className="pri">{d.clientName}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{d.phoneNumber}</td>
                            <td style={{ color: 'var(--accent)', fontWeight: 600 }}>₹{d.loanRequirement}</td>
                            <td><Badge cls={mtg?.status === 'Converted' ? 'fm-badge-success' : mtg?.status ? 'fm-badge-accent' : 'fm-badge-default'}>{mtg?.status || '—'}</Badge></td>
                            <td>{bdo?.name || '—'}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button className="fm-btn fm-btn-ghost fm-btn-sm" title="View" onClick={() => setSelectedDup(d)}>{I.eye}</button>
                                <button className="fm-btn fm-btn-ghost fm-btn-sm" title="Merge" onClick={() => setDupToMerge(d)}>{I.merge}</button>
                                <button className="fm-btn fm-btn-danger fm-btn-sm" title="Delete" onClick={() => setDupToDelete(d.id)}>{I.trash}</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {duplicateLeads.length === 0 && <tr><td colSpan={7} className="fm-empty">No duplicate leads</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ── ADD USER MODAL ── */}
      {showAddUser && (
        <div className="fm-modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddUser(false)}>
          <div className="fm-modal">
            <div className="fm-modal-title">Add New User</div>
            <div className="fm-form-row">
              <div className="fm-form-field"><div className="fm-field-label">Full Name</div><input className="fm-input" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="Full name" /></div>
              <div className="fm-form-field"><div className="fm-field-label">Username</div><input className="fm-input" value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} placeholder="Login username" /></div>
            </div>
            <div className="fm-form-row">
              <div className="fm-form-field"><div className="fm-field-label">Password</div><input className="fm-input" type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" /></div>
              <div className="fm-form-field">
                <div className="fm-field-label">Role</div>
                <select className="fm-select" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value as UserRole }))}>
                  <option value="BO">Business Officer</option>
                  <option value="TC">Team Captain</option>
                  <option value="BDM">BDM</option>
                  <option value="BDO">BDO</option>
                </select>
              </div>
            </div>
            {newUser.role === 'BO' && (
              <div className="fm-form-field">
                <div className="fm-field-label">Assign to TC</div>
                <select className="fm-select" value={newUser.tcId} onChange={e => setNewUser(p => ({ ...p, tcId: e.target.value }))}>
                  <option value="">Select TC (optional)</option>
                  {tcs.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
                </select>
              </div>
            )}
            <div className="fm-modal-footer">
              <button className="fm-btn fm-btn-ghost" onClick={() => setShowAddUser(false)}>Cancel</button>
              <button className="fm-btn fm-btn-primary" disabled={isLoading('add_user')} onClick={() => withLoading('add_user', handleAddUser)}>{I.plus} {isLoading('add_user') ? 'Adding...' : 'Add User'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE TEAM MODAL ── */}
      {showCreateTeam && (
        <div className="fm-modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreateTeam(false)}>
          <div className="fm-modal">
            <div className="fm-modal-title">Create New Team</div>
            <div className="fm-form-field"><div className="fm-field-label">Team Name</div><input className="fm-input" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Alpha Team" /></div>
            <div className="fm-form-field">
              <div className="fm-field-label">Assign TC</div>
              <select className="fm-select" value={newTeamTC} onChange={e => setNewTeamTC(e.target.value)}>
                <option value="">Select TC</option>
                {tcs.filter(tc => !teams.some(t => t.tcId === tc.id)).map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
              </select>
            </div>
            <div className="fm-form-field">
              <div className="fm-field-label">Assign BOs (optional)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                {unassignedBOs.map(bo => (
                  <button key={bo.id} onClick={() => setNewTeamBOs(p => p.includes(bo.id) ? p.filter(id => id !== bo.id) : [...p, bo.id])}
                    style={{ padding: '4px 10px', borderRadius: '7px', border: `1px solid ${newTeamBOs.includes(bo.id) ? 'var(--teal)' : 'var(--border2)'}`, background: newTeamBOs.includes(bo.id) ? 'rgba(6,182,212,0.1)' : 'var(--surface2)', color: newTeamBOs.includes(bo.id) ? 'var(--teal)' : 'var(--text2)', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {bo.name}
                  </button>
                ))}
                {unassignedBOs.length === 0 && <span style={{ fontSize: '11px', color: 'var(--text3)' }}>No unassigned BOs</span>}
              </div>
            </div>
            <div className="fm-modal-footer">
              <button className="fm-btn fm-btn-ghost" onClick={() => setShowCreateTeam(false)}>Cancel</button>
              <button className="fm-btn fm-btn-primary" disabled={isLoading('create_team')} onClick={() => withLoading('create_team', handleCreateTeam)}>{I.plus} {isLoading('create_team') ? 'Creating...' : 'Create Team'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DUPLICATE DETAIL MODAL ── */}
      {selectedDup && (
        <div className="fm-modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedDup(null)}>
          <div className="fm-modal" style={{ maxWidth: '520px' }}>
            <div className="fm-modal-title">Duplicate Lead Detail</div>
            {(() => {
              const d = selectedDup;
              const orig = leads.find(l => l.id === d.originalLeadId);
              const mtg = orig ? meetings.find(m => m.leadId === orig.id) : undefined;
              const bdm = mtg ? users.find(u => u.id === mtg.bdmId) : undefined;
              const bdo = mtg?.bdoId ? users.find(u => u.id === mtg.bdoId) : undefined;
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--warning)', fontFamily: "'JetBrains Mono', monospace', letterSpacing: '1.5px", marginBottom: '8px' }}>DUPLICATE LEAD</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div><span style={{ color: 'var(--text3)' }}>Client:</span><div style={{ fontWeight: 600, color: 'var(--text)' }}>{d.clientName}</div></div>
                      <div><span style={{ color: 'var(--text3)' }}>Phone:</span><div style={{ fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{d.phoneNumber}</div></div>
                      <div><span style={{ color: 'var(--text3)' }}>Amount:</span><div style={{ fontWeight: 600, color: 'var(--accent)' }}>₹{d.loanRequirement}</div></div>
                      <div><span style={{ color: 'var(--text3)' }}>Uploaded:</span><div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>{new Date(d.uploadedAt).toLocaleDateString('en-IN')}</div></div>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(61,127,255,0.07)', border: '1px solid rgba(61,127,255,0.2)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '10px', color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', marginBottom: '8px' }}>ORIGINAL LEAD</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div><span style={{ color: 'var(--text3)' }}>Original BO:</span><div style={{ fontWeight: 600, color: 'var(--text)' }}>{d.originalBoName}</div></div>
                      {orig && <div><span style={{ color: 'var(--text3)' }}>Lead status:</span><div><Badge cls={orig.leadStatus === 'Interested' ? 'fm-badge-success' : 'fm-badge-default'}>{orig.leadStatus || '—'}</Badge></div></div>}
                      {mtg && <div><span style={{ color: 'var(--text3)' }}>Meeting:</span><div><Badge cls={mtg.status === 'Converted' ? 'fm-badge-success' : 'fm-badge-accent'}>{mtg.status}</Badge></div></div>}
                      {bdm && <div><span style={{ color: 'var(--text3)' }}>BDM:</span><div style={{ fontWeight: 600, color: 'var(--text)' }}>{bdm.name}</div></div>}
                      {bdo && <div><span style={{ color: 'var(--text3)' }}>BDO:</span><div style={{ fontWeight: 600, color: 'var(--text)' }}>{bdo.name}</div></div>}
                      {mtg && <div><span style={{ color: 'var(--text3)' }}>Walking:</span><div>{mtg.walkingStatus || '—'}</div></div>}
                      {mtg && <div><span style={{ color: 'var(--text3)' }}>Mini Login:</span><div><Badge cls={mtg.miniLogin ? 'fm-badge-success' : 'fm-badge-default'}>{mtg.miniLogin ? 'Yes' : 'No'}</Badge></div></div>}
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="fm-modal-footer">
              <button className="fm-btn fm-btn-ghost" onClick={() => setSelectedDup(null)}>Close</button>
              <button className="fm-btn fm-btn-ghost" onClick={() => { setDupToMerge(selectedDup); setSelectedDup(null); }}>{I.merge} Merge</button>
              <button className="fm-btn fm-btn-danger" onClick={() => { setDupToDelete(selectedDup.id); setSelectedDup(null); }}>{I.trash} Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── UPLOAD CONFIRM MODAL ── */}
      {pendingUpload && (
        <div className="fm-modal-overlay" onClick={e => e.target === e.currentTarget && setPendingUpload(null)}>
          <div className="fm-modal">
            <div className="fm-modal-title" style={{ color: 'var(--warning)' }}>⚠ Duplicate Leads Detected</div>
            {pendingUpload.isManual ? (
              <p style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6 }}>Phone number already exists (assigned to <strong>{pendingUpload.dupes[0]?.originalBoName}</strong>). Store in Duplicates folder?</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '12px 0', background: 'var(--bg3)', borderRadius: '9px', padding: '14px' }}>
                <div><div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>VALID LEADS</div><div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--success)' }}>{pendingUpload.newLeads.length}</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--text3)', fontFamily: "'JetBrains Mono', monospace" }}>DUPLICATES</div><div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--warning)' }}>{pendingUpload.dupes.length}</div></div>
              </div>
            )}
            <div className="fm-modal-footer">
              <button className="fm-btn fm-btn-ghost" onClick={() => setPendingUpload(null)}>Discard</button>
              <button className="fm-btn fm-btn-primary" disabled={isLoading('confirm_upload')} onClick={() => withLoading('confirm_upload', async () => {
                await addLeads(pendingUpload.newLeads, pendingUpload.dupes);
                setPendingUpload(null);
                if (pendingUpload.isManual) { setLeadInput({ clientName: '', phoneNumber: '', loanRequirement: '' }); toast.success('Stored in duplicates'); }
                else toast.success(`${pendingUpload.newLeads.length} leads uploaded, ${pendingUpload.dupes.length} stored as duplicates`);
              })}>{isLoading('confirm_upload') ? 'Saving...' : 'Confirm & Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DOUBLE CONFIRM MODALS ── */}
      <DoubleConfirmModal isOpen={!!userToDelete} onClose={() => setUserToDelete(null)} title="Delete User" onConfirm={async () => { if (userToDelete) { await removeUser(userToDelete); toast.success('User removed'); setUserToDelete(null); } }} />
      <DoubleConfirmModal isOpen={!!teamToDelete} onClose={() => setTeamToDelete(null)} title="Delete Team" onConfirm={async () => { if (teamToDelete) { await deleteTeam(teamToDelete); toast.success('Team deleted'); setTeamToDelete(null); } }} />
      <DoubleConfirmModal isOpen={!!dupToDelete} onClose={() => setDupToDelete(null)} title="Delete Duplicate" onConfirm={async () => { if (dupToDelete) { await deleteDuplicateLead(dupToDelete); toast.success('Deleted'); setDupToDelete(null); } }} />
      <DoubleConfirmModal isOpen={!!dupToMerge} onClose={() => setDupToMerge(null)} title="Merge Leads" onConfirm={async () => { if (dupToMerge) { await mergeDuplicateLead(dupToMerge.id); toast.success('Merged'); setDupToMerge(null); } }} />
    </>
  );
}