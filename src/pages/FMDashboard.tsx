import React from "react";
import { useState, useMemo, useRef, useEffect } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { supabase } from '@/integrations/supabase/client';
import { useLoading } from '@/hooks/use-loading';
import DashboardLayout, { LayoutDashboard, Users, Upload, Calendar, UserCircle, BarChart3, FolderOpen, Briefcase } from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import DateRangeFilter from '@/components/DateRangeFilter';
import DetailDataTable from '@/components/DetailDataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { User, Lead, UserRole, NumberStatus, LeadStatus, DuplicateLead } from '@/types/crm';
import { Plus, Trash2, Upload as UploadIcon, ChevronDown, ChevronRight, Edit2, UserPlus, UserMinus, Download, ClipboardPaste, Footprints, Eye, GitMerge, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DoubleConfirmModal } from '@/components/ui/DoubleConfirmModal';




const navItems = [
  { label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, id: 'dashboard' },
  { label: 'User Management', icon: <Users className="w-4 h-4" />, id: 'users' },
  { label: 'Team Management', icon: <UserCircle className="w-4 h-4" />, id: 'teams' },
  { label: 'Upload Leads', icon: <Upload className="w-4 h-4" />, id: 'leads' },
  { label: 'BDM Performance', icon: <BarChart3 className="w-4 h-4" />, id: 'bdm' },
  { label: 'BDO Performance', icon: <Briefcase className="w-4 h-4" />, id: 'bdo' },
  { label: 'Duplicate Leads', icon: <FolderOpen className="w-4 h-4" />, id: 'duplicates' },
];

export default function FMDashboard() {
  const { users, leads, teams, meetings, duplicateLeads, addUser, updateUser, removeUser, addLeads, addTeam, updateTeam, updateTeamMembers, deleteTeam, deleteDuplicateLead, mergeDuplicateLead } = useCRM();
  // loader
  const { withLoading, isLoading } = useLoading();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedTC, setExpandedTC] = useState<string | null>(null);
  const [showConnectedDetail, setShowConnectedDetail] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  // green dot online status
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<{ userId: string }>();
        const ids = new Set(Object.values(state).flat().map((p) => p.userId));
        setOnlineUserIds(ids);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // User mgmt state
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'BO' as UserRole, tcId: '' });
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('BO');
  const [editTCId, setEditTCId] = useState('');

  // Lead upload state
  const [leadInput, setLeadInput] = useState({ clientName: '', phoneNumber: '', loanRequirement: '' });
  const [selectedBOs, setSelectedBOs] = useState<string[]>([]);
  // Delete modal state
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteData, setPasteData] = useState('');

  // Duplicate leads state
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateLead | null>(null);
  const [duplicateToDelete, setDuplicateToDelete] = useState<string | null>(null);
  const [duplicateToMerge, setDuplicateToMerge] = useState<DuplicateLead | null>(null);

  // Pre-save upload confirmation state
  const [pendingUpload, setPendingUpload] = useState<{
    newLeads: Lead[];
    dupes: DuplicateLead[];
    isManual: boolean;
  } | null>(null);

  // Team management state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTC, setNewTeamTC] = useState('');
  const [newTeamBOs, setNewTeamBOs] = useState<string[]>([]);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [changeTCTeamId, setChangeTCTeamId] = useState<string | null>(null);
  const [newTCForTeam, setNewTCForTeam] = useState('');

  const bos = users.filter(u => u.role === 'BO' && u.active);
  const tcs = users.filter(u => u.role === 'TC' && u.active);
  const bdms = users.filter(u => u.role === 'BDM' && u.active);
  const bdos = users.filter(u => u.role === 'BDO' && u.active);
  const assignedBOIds = teams.flatMap(t => t.boIds);
  const unassignedBOs = bos.filter(b => !assignedBOIds.includes(b.id));

  const filteredLeads = useMemo(() => {
    let filtered = leads;
    if (fromDate) { const from = fromDate.toISOString().split('T')[0]; filtered = filtered.filter(l => l.assignedDate >= from); }
    if (toDate) { const to = toDate.toISOString().split('T')[0]; filtered = filtered.filter(l => l.assignedDate <= to); }
    return filtered;
  }, [leads, fromDate, toDate]);

  const filteredMeetings = useMemo(() => {
    let filtered = meetings;
    if (fromDate) { const from = fromDate.toISOString().split('T')[0]; filtered = filtered.filter(m => m.date >= from); }
    if (toDate) { const to = toDate.toISOString().split('T')[0]; filtered = filtered.filter(m => m.date <= to); }
    return filtered;
  }, [meetings, fromDate, toDate]);

  const getLeadsForBO = (boId: string) => filteredLeads.filter(l => l.assignedBOId === boId);
  const getNumberStatusCount = (boLeads: Lead[], status: NumberStatus) => boLeads.filter(l => l.numberStatus === status).length;
  const getLeadStatusCount = (boLeads: Lead[], status: LeadStatus) => boLeads.filter(l => l.leadStatus === status).length;

  // Walking meetings count
  const walkinMeetings = filteredMeetings.filter(m => m.meetingType === 'Walk-in' && (m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up'));

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.password) {
      toast.error('Fill all fields')
      return
    }
    if (users.find(u => u.username === newUser.username)) {
      toast.error('Username already exists')
      return
    }

    try {
      const user: User = {
        id: crypto.randomUUID(),
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        active: true,
      }

      if (newUser.role === 'BO' && newUser.tcId) {
        const team = teams.find(t => t.tcId === newUser.tcId)
        if (team) {
          user.teamId = team.id
          await updateTeamMembers(team.id, [...team.boIds, user.id])
        }
      }

      if (newUser.role === 'TC') {
        const teamId = `team_${Date.now()}`
        user.teamId = teamId
        await addTeam({ id: teamId, name: `${newUser.name}'s Team`, tcId: user.id, boIds: [] })
      }

      await addUser(user, newUser.password)  // ← password bhi pass karo
      setNewUser({ name: '', username: '', password: '', role: 'BO', tcId: '' })
      toast.success('User added successfully')
    } catch (err) {
      toast.error('Failed to create user')
    }
  }

  const handleEditRole = async (userId: string) => {
    await updateUser(userId, { role: editRole });
    if (editRole === 'BO' && editTCId) {
      for (const t of teams) {
        if (t.boIds.includes(userId)) {
          await updateTeamMembers(t.id, t.boIds.filter(id => id !== userId));
        }
      }
      const targetTeam = teams.find(t => t.tcId === editTCId);
      if (targetTeam) {
        await updateTeamMembers(targetTeam.id, [...targetTeam.boIds, userId]);
      }
    }
    setEditingUser(null);
    toast.success('User updated');
  };

  // Process leads from rows
  const processLeadRows = async (rows: any[]) => {
    if (selectedBOs.length === 0) { toast.error('Select at least one BO for distribution'); return; }
    let added = 0;
    const today = new Date().toISOString().split('T')[0];
    const newLeads: Lead[] = [];
    const dupes: DuplicateLead[] = [];

    rows.forEach((row: any, idx: number) => {
      const clientName = row['Client Name'] || row['client_name'] || row['Name'] || row['name'] || '';
      // Strip all non-digit characters from phone number
      const rawPhone = String(row['Phone Number'] || row['phone_number'] || row['Phone'] || row['phone'] || '').trim();
      const phoneNumber = rawPhone.replace(/\D/g, '');
      const loanRequirement = String(row['Loan Requirement'] || row['loan_requirement'] || row['Loan Amount'] || row['amount'] || row['Loan Requirement Amount'] || '');
      if (!clientName || !phoneNumber) return;

      const existing = leads.find(l => l.phoneNumber === phoneNumber) || newLeads.find(l => l.phoneNumber === phoneNumber);
      if (existing) {
        const bo = users.find(u => u.id === existing.assignedBOId);
        dupes.push({
          id: crypto.randomUUID(), clientName, phoneNumber, loanRequirement,
          originalLeadId: existing.id, originalBoName: bo?.name || 'Unknown',
          uploadedBy: users.find(u => u.id === undefined)?.name, uploadedAt: new Date().toISOString(),
        });
        return;
      }

      const boId = selectedBOs[added % selectedBOs.length];
      newLeads.push({
        id: `l${Date.now()}_${idx}`, clientName, phoneNumber, loanRequirement,
        numberStatus: '', leadStatus: '', leadType: '', assignedBOId: boId,
        assignedDate: today, meetingRequested: false, meetingApproved: false,
      });
      added++;
    });

    if (newLeads.length === 0 && dupes.length === 0) {
      toast.error('No valid data found');
      return;
    }

    if (dupes.length > 0) {
      // Show confirmation popup before saving
      setPendingUpload({ newLeads, dupes, isManual: false });
    } else {
      // No duplicates, safe to add immediately
      await addLeads(newLeads);
      toast.success(`${added} leads uploaded successfully.`);
    }
  };

  // Excel upload
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<any>(sheet);
      await processLeadRows(rows);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Paste from Excel
  const handlePasteImport = async () => {
    if (!pasteData.trim()) { toast.error('Paste data first'); return; }
    const lines = pasteData.trim().split('\n');
    if (lines.length < 2) { toast.error('Need header row + data'); return; }

    const headers = lines[0].split('\t').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const vals = line.split('\t');
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = vals[i]?.trim() || ''; });
      return obj;
    });
    await processLeadRows(rows);
    setPasteData('');
  };

  const handleAddLead = async () => {
    if (!leadInput.clientName || !leadInput.phoneNumber || !leadInput.loanRequirement) { toast.error('Fill all fields'); return; }
    if (!/^\d+$/.test(leadInput.phoneNumber)) { toast.error('Phone number must contain digits only'); return; }
    if (selectedBOs.length === 0) { toast.error('Select at least one BO'); return; }

    const duplicate = leads.find(l => l.phoneNumber === leadInput.phoneNumber);
    if (duplicate) {
      const assignedBO = users.find(u => u.id === duplicate.assignedBOId);

      const dupeObj: DuplicateLead = {
        id: crypto.randomUUID(),
        clientName: leadInput.clientName,
        phoneNumber: leadInput.phoneNumber,
        loanRequirement: leadInput.loanRequirement,
        originalLeadId: duplicate.id,
        originalBoName: assignedBO?.name || 'Unknown',
        uploadedBy: users.find(u => u.id === undefined)?.name,
        uploadedAt: new Date().toISOString()
      };

      // Detected duplicate, prompt for confirmation instead of rejecting
      setPendingUpload({ newLeads: [], dupes: [dupeObj], isManual: true });
      return;
    }

    const boId = selectedBOs[Math.floor(Math.random() * selectedBOs.length)];
    const today = new Date().toISOString().split('T')[0];
    await addLeads([{
      id: `l${Date.now()}`, clientName: leadInput.clientName, phoneNumber: leadInput.phoneNumber,
      loanRequirement: leadInput.loanRequirement, numberStatus: '', leadStatus: '', leadType: '',
      assignedBOId: boId, assignedDate: today, meetingRequested: false, meetingApproved: false,
    }]);
    setLeadInput({ clientName: '', phoneNumber: '', loanRequirement: '' });
    toast.success(`Lead assigned to ${users.find(u => u.id === boId)?.name}`);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName || !newTeamTC) { toast.error('Enter team name and select TC'); return; }
    const teamId = `team_${Date.now()}`;
    await addTeam({ id: teamId, name: newTeamName, tcId: newTeamTC, boIds: newTeamBOs });
    await updateUser(newTeamTC, { teamId: teamId });
    for (const boId of newTeamBOs) {
      await updateUser(boId, { teamId: teamId });
    }
    setNewTeamName(''); setNewTeamTC(''); setNewTeamBOs([]); setShowCreateTeam(false);
    toast.success('Team created');
  };

  const handleAddBOToTeam = async (teamId: string, boId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    for (const t of teams) {
      if (t.boIds.includes(boId)) {
        await updateTeamMembers(t.id, t.boIds.filter(id => id !== boId));
      }
    }
    await updateTeamMembers(teamId, [...team.boIds.filter(id => id !== boId), boId]);
    await updateUser(boId, { teamId });
    toast.success('BO added to team');
  };

  const handleRemoveBOFromTeam = async (teamId: string, boId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return;
    await updateTeamMembers(teamId, team.boIds.filter(id => id !== boId));
    await updateUser(boId, { teamId: undefined });
    toast.success('BO removed from team');
  };

  const handleChangeTC = async (teamId: string) => {
    if (!newTCForTeam) { toast.error('Select a TC'); return; }
    await updateTeam(teamId, { tcId: newTCForTeam });
    await updateUser(newTCForTeam, { teamId });
    setChangeTCTeamId(null);
    setNewTCForTeam('');
    toast.success('TC changed');
  };

  const getDetailData = () => {
    switch (detailView) {
      case 'total': return { title: 'Total Leads', data: filteredLeads };
      case 'connected': return { title: 'Connected Leads', data: filteredLeads.filter(l => l.numberStatus === 'Connected') };
      case 'not_connected': return { title: 'Not Connected Leads', data: filteredLeads.filter(l => l.numberStatus === 'Not Connected') };
      case 'mobile_off': return { title: 'Mobile Off', data: filteredLeads.filter(l => l.numberStatus === 'Mobile Off') };
      case 'incoming_barred': return { title: 'Incoming Barred', data: filteredLeads.filter(l => l.numberStatus === 'Incoming Barred') };
      case 'invalid_number': return { title: 'Invalid Number', data: filteredLeads.filter(l => l.numberStatus === 'Invalid Number') };
      case 'interested': return { title: 'Interested', data: filteredLeads.filter(l => l.leadStatus === 'Interested') };
      case 'not_interested': return { title: 'Not Interested', data: filteredLeads.filter(l => l.leadStatus === 'Not Interested') };
      case 'pending': return { title: 'Pending', data: filteredLeads.filter(l => l.leadStatus === 'Pending') };
      case 'eligible': return { title: 'Eligible', data: filteredLeads.filter(l => l.leadStatus === 'Eligible') };
      case 'not_eligible': return { title: 'Not Eligible', data: filteredLeads.filter(l => l.leadStatus === 'Not Eligible') };
      case 'language_barrier': return { title: 'Language Barrier', data: filteredLeads.filter(l => l.leadStatus === 'Language Barrier') };
      case 'total_bos': return { title: 'All Business Officers', data: filteredLeads };
      case 'total_meetings': return { title: 'All Meetings', data: filteredLeads, meetings: filteredMeetings };
      case 'walkin': return { title: 'Walk-in Meetings', data: filteredLeads, meetings: walkinMeetings };
      default: return null;
    }
  };

  // Dashboard filters
  const [selectedTC, setSelectedTC] = useState('');
  const [selectedMeetingStatus, setSelectedMeetingStatus] = useState('');

  // dashMeetings: filtered by TC + meeting status + date
  const dashMeetings = useMemo(() => {
    let m = filteredMeetings;
    if (selectedMeetingStatus) m = m.filter(mt => mt.status === selectedMeetingStatus);
    if (selectedTC) {
      const team = teams.find(t => t.tcId === selectedTC);
      if (team) {
        const tcBoIds = new Set(team.boIds);
        m = m.filter(mt => tcBoIds.has(mt.boId));
      }
    }
    return m;
  }, [filteredMeetings, selectedTC, selectedMeetingStatus, teams]);

  return (
    <DashboardLayout navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && (
        <div className="space-y-6">

          {/* ── Header + Filters ── */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground">Performance Dashboard</h2>
              <p className="text-sm text-muted-foreground mt-1">Real-time performance metrics and Meeting distribution</p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Team Captain</label>
                <select className="block w-40 pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" value={selectedTC} onChange={e => setSelectedTC(e.target.value)}>
                  <option value="">All Captains</option>
                  {tcs.map(tc => <option key={tc.id} value={tc.id}>{tc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Meeting Status</label>
                <select className="block w-40 pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary" value={selectedMeetingStatus} onChange={e => setSelectedMeetingStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  {['Scheduled', 'Meeting Done', 'Not Done', 'Pending', 'Reject', 'Converted', 'Follow-Up'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
            </div>
          </div>

          {detailView ? (
            (() => {
              const detail = getDetailData();
              if (!detail) return null;
              return <DetailDataTable title={detail.title} leads={detail.data} users={users} meetings={detail.meetings} onBack={() => setDetailView(null)} showMeetingDetails={detailView === 'total_meetings' || detailView === 'walkin'} />;
            })()
          ) : (
            <>
              {/* ── 5 KPI Cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Total Meetings', value: dashMeetings.length, border: 'border-l-blue-500', sub: 'vs last month', view: 'total_meetings' },
                  { label: 'Pending', value: dashMeetings.filter(m => m.status === 'Pending').length, border: 'border-l-amber-500', sub: 'waiting', view: 'total_meetings' },
                  { label: 'Rejected', value: dashMeetings.filter(m => m.status === 'Reject').length, border: 'border-l-red-500', sub: 'improvement', view: 'total_meetings' },
                  { label: 'Meeting Done', value: dashMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length, border: 'border-l-blue-400', sub: 'steady', view: 'total_meetings' },
                  { label: 'Rescheduled', value: dashMeetings.filter(m => m.status === 'Follow-Up').length, border: 'border-l-sky-300', sub: 'follow-up', view: 'total_meetings' },
                ].map(card => (
                  <button key={card.label} onClick={() => setDetailView(card.view)}
                    className={`bg-card border border-border border-l-4 ${card.border} rounded-xl p-5 text-left hover:shadow-md transition-all`}>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.label}</p>
                    <p className="text-3xl font-extrabold text-foreground mt-2">{card.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-2">{card.sub}</p>
                  </button>
                ))}
              </div>

              {/* ── Main 4-col grid ── */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

                {/* LEFT 3 cols */}
                <div className="xl:col-span-3 space-y-6">

                  {/* Row 1: Meeting Status Donut + TC Meeting Count Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-1">
                      <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider">Meeting Status</CardTitle></CardHeader>
                      <CardContent>
                        {(() => {
                          const data = [
                            { name: 'Pending', value: dashMeetings.filter(m => m.status === 'Pending').length, color: '#f59e0b' },
                            { name: 'Rejected', value: dashMeetings.filter(m => m.status === 'Reject').length, color: '#ef4444' },
                            { name: 'Done', value: dashMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length, color: '#3b82f6' },
                            { name: 'Follow-Up', value: dashMeetings.filter(m => m.status === 'Follow-Up').length, color: '#7dd3fc' },
                          ].filter(d => d.value > 0);
                          const total = data.reduce((s, d) => s + d.value, 0);
                          if (total === 0) return <p className="text-center text-muted-foreground text-sm py-14">No data yet</p>;
                          let offset = 0;
                          return (
                            <div className="flex items-center gap-3 h-44">
                              <div className="relative w-36 h-36 flex-shrink-0">
                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                  {data.map((d, i) => { const pct = (d.value / total) * 100; const el = <circle key={i} cx="18" cy="18" r="15.9" fill="none" stroke={d.color} strokeWidth="3.8" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} />; offset += pct; return el; })}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <span className="text-lg font-extrabold text-foreground">{total.toLocaleString()}</span>
                                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Total</span>
                                </div>
                              </div>
                              <div className="flex-1 space-y-2">
                                {data.map(d => (
                                  <div key={d.name} className="flex items-center gap-2 text-xs">
                                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                                    <span className="text-muted-foreground flex-1">{d.name}</span>
                                    <span className="font-bold text-foreground">{d.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider">Meeting Count - Team Captain</CardTitle></CardHeader>
                      <CardContent>
                        {(() => {
                          const tcData = teams.map(team => {
                            const tc = users.find(u => u.id === team.tcId);
                            const tcMeetings = dashMeetings.filter(m => team.boIds.includes(m.boId));
                            return { name: tc?.name || 'TC', value: tcMeetings.length };
                          }).filter(t => t.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
                          if (tcData.length === 0) return <p className="text-center text-muted-foreground text-sm py-14">No TC data yet</p>;
                          const max = Math.max(...tcData.map(t => t.value), 1);
                          const colors = ['#3b82f6', '#0ea5e9', '#10b981', '#6366f1', '#f59e0b', '#94a3b8'];
                          return (
                            <div className="space-y-3 h-44 overflow-y-auto">
                              {tcData.map((t, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <span className="text-xs font-semibold text-foreground w-24 truncate flex-shrink-0">{t.name}</span>
                                  <div className="flex-1 bg-secondary rounded-full h-3.5">
                                    <div className="h-3.5 rounded-full" style={{ width: `${(t.value / max) * 100}%`, backgroundColor: colors[i % colors.length] }} />
                                  </div>
                                  <span className="text-xs text-muted-foreground w-8 text-right">{t.value}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Row 2: BDM Bar Chart + Product Donut */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="md:col-span-2">
                      <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider">Meeting Count - BDM</CardTitle></CardHeader>
                      <CardContent>
                        {(() => {
                          const bdmData = bdms.map(bdm => ({
                            name: bdm.name.split(' ')[0],
                            value: dashMeetings.filter(m => m.bdmId === bdm.id).length,
                          })).filter(b => b.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);
                          if (bdmData.length === 0) return <p className="text-center text-muted-foreground text-sm py-14">No BDM data yet</p>;
                          const max = Math.max(...bdmData.map(b => b.value), 1);
                          return (
                            <div className="flex items-end gap-3 h-40 px-2">
                              {bdmData.map((b, i) => (
                                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                  <span className="text-[10px] font-bold text-foreground">{b.value}</span>
                                  <div className="w-full rounded-t-md bg-indigo-400 dark:bg-indigo-500" style={{ height: `${Math.max((b.value / max) * 100, 8)}%` }} />
                                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">{b.name}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-1">
                      <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase tracking-wider">Product Distribution</CardTitle></CardHeader>
                      <CardContent>
                        {(() => {
                          const productMap: Record<string, number> = {};
                          dashMeetings.forEach(m => { if (m.productType) productMap[m.productType] = (productMap[m.productType] || 0) + 1; });
                          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#94a3b8'];
                          const data = Object.entries(productMap).map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }));
                          const total = data.reduce((s, d) => s + d.value, 0);
                          if (total === 0) return <p className="text-center text-muted-foreground text-sm py-14">No product data yet</p>;
                          let offset = 0;
                          return (
                            <div className="flex flex-col items-center gap-3 h-40 justify-center">
                              <div className="relative w-28 h-28">
                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                  {data.map((d, i) => { const pct = (d.value / total) * 100; const el = <circle key={i} cx="18" cy="18" r="15.9" fill="none" stroke={d.color} strokeWidth="3.8" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} />; offset += pct; return el; })}
                                </svg>
                              </div>
                              <div className="w-full space-y-1">
                                {data.map(d => (
                                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                                    <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                                    <span className="font-bold">{d.value}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </div>

                  {/* ── BDM-wise Performance Table ── */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-xs font-bold uppercase tracking-wider">BDM-wise Performance</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                              <th className="px-4 py-3 text-left">BDM Name</th>
                              <th className="px-4 py-3 text-left">Total Meeting</th>
                              <th className="px-4 py-3 text-left">Pending Meeting</th>
                              <th className="px-4 py-3 text-left">Walk-in</th>
                              <th className="px-4 py-3 text-left">Mini-Login</th>
                              <th className="px-4 py-3 text-left">Walking Rate</th>
                              <th className="px-4 py-3 text-left">Login Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-sm">
                            {bdms.map(bdm => {
                              const bdmMtgs = dashMeetings.filter(m => m.bdmId === bdm.id);
                              if (bdmMtgs.length === 0) return null;
                              const pending = bdmMtgs.filter(m => m.status === 'Pending').length;
                              const walkin = bdmMtgs.filter(m => m.meetingType === 'Walk-in').length;
                              const mini = bdmMtgs.filter(m => m.miniLogin).length;
                              const walkRate = Math.round((walkin / bdmMtgs.length) * 100);
                              const loginRate = Math.round((mini / bdmMtgs.length) * 100);
                              return (
                                <tr key={bdm.id} className="hover:bg-secondary/30 transition-colors">
                                  <td className="px-4 py-4 font-medium text-foreground">{bdm.name}</td>
                                  <td className="px-4 py-4 text-muted-foreground">{bdmMtgs.length}</td>
                                  <td className="px-4 py-4 text-muted-foreground">{pending}</td>
                                  <td className="px-4 py-4 text-muted-foreground">{walkin}</td>
                                  <td className="px-4 py-4 text-muted-foreground">{mini}</td>
                                  <td className="px-4 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">{walkRate}%</span></td>
                                  <td className="px-4 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">{loginRate}%</span></td>
                                </tr>
                              );
                            })}
                            {bdms.filter(b => dashMeetings.filter(m => m.bdmId === b.id).length > 0).length === 0 && (
                              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No BDM data yet</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ── TC-wise Performance Table ── */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-xs font-bold uppercase tracking-wider">TC-wise Performance</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                              <th className="px-4 py-3 text-left">TC Name</th>
                              <th className="px-4 py-3 text-left">No. of BO</th>
                              <th className="px-4 py-3 text-left">Total Leads</th>
                              <th className="px-4 py-3 text-left">Total Meeting</th>
                              <th className="px-4 py-3 text-left">Pending Meetings</th>
                              <th className="px-4 py-3 text-left">Walk-in</th>
                              <th className="px-4 py-3 text-left">Success Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-sm">
                            {teams.map(team => {
                              const tc = users.find(u => u.id === team.tcId);
                              const teamLeads = filteredLeads.filter(l => team.boIds.includes(l.assignedBOId));
                              const tcMtgs = dashMeetings.filter(m => team.boIds.includes(m.boId));
                              const pending = tcMtgs.filter(m => m.status === 'Pending').length;
                              const walkin = tcMtgs.filter(m => m.meetingType === 'Walk-in').length;
                              const done = tcMtgs.filter(m => m.status === 'Meeting Done' || m.status === 'Converted').length;
                              const rate = tcMtgs.length > 0 ? Math.round((done / tcMtgs.length) * 100) : 0;
                              return (
                                <tr key={team.id} className="hover:bg-secondary/30 transition-colors">
                                  <td className="px-4 py-4 font-medium text-foreground">{tc?.name || '—'}</td>
                                  <td className="px-4 py-4 text-muted-foreground">{team.boIds.length}</td>
                                  <td className="px-4 py-4 font-semibold text-foreground">{teamLeads.length}</td>
                                  <td className="px-4 py-4 text-muted-foreground">{tcMtgs.length}</td>
                                  <td className="px-4 py-4 text-muted-foreground">{pending}</td>
                                  <td className="px-4 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">{walkin}</span></td>
                                  <td className="px-4 py-4 font-bold text-foreground">{rate}%</td>
                                </tr>
                              );
                            })}
                            {teams.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">No team data yet</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ── BO-wise Performance Table ── */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-xs font-bold uppercase tracking-wider">BO-wise Performance</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                              <th className="px-4 py-3 text-left">BO Name</th>
                              <th className="px-4 py-3 text-left">Total Leads</th>
                              <th className="px-4 py-3 text-left">Connected</th>
                              <th className="px-4 py-3 text-left">Interested</th>
                              <th className="px-4 py-3 text-left">Meeting</th>
                              <th className="px-4 py-3 text-left">Success Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-sm">
                            {bos.map(bo => {
                              const boLeads = getLeadsForBO(bo.id);
                              if (boLeads.length === 0) return null;
                              const connected = getNumberStatusCount(boLeads, 'Connected');
                              const interested = getLeadStatusCount(boLeads, 'Interested');
                              const boMtgs = dashMeetings.filter(m => m.boId === bo.id).length;
                              const rate = boLeads.length > 0 ? Math.round((boMtgs / boLeads.length) * 100) : 0;
                              return (
                                <tr key={bo.id} className="hover:bg-secondary/30 transition-colors">
                                  <td className="px-4 py-4 font-medium text-foreground">{bo.name}</td>
                                  <td className="px-4 py-4 text-muted-foreground">{boLeads.length}</td>
                                  <td className="px-4 py-4"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-50 text-green-700 text-xs font-bold border border-green-100 dark:bg-green-950 dark:text-green-300 dark:border-green-800">{connected}</span></td>
                                  <td className="px-4 py-4"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">{interested}</span></td>
                                  <td className="px-4 py-4"><span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">{boMtgs}</span></td>
                                  <td className="px-4 py-4 font-bold text-foreground">{rate}%</td>
                                </tr>
                              );
                            })}
                            {bos.filter(bo => getLeadsForBO(bo.id).length > 0).length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No BO data yet</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  {/* ── State-wise Leads Table ── */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-xs font-bold uppercase tracking-wider">State-wise Leads</CardTitle></CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                              <th className="px-4 py-3 text-left">State</th>
                              <th className="px-4 py-3 text-left">Total Meetings</th>
                              <th className="px-4 py-3 text-left">Pending</th>
                              <th className="px-4 py-3 text-left">Top Product</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border text-sm">
                            {(() => {
                              const sm: Record<string, { total: number; pending: number; products: Record<string, number> }> = {};
                              dashMeetings.forEach(m => {
                                const s = m.state || 'Unknown';
                                if (!sm[s]) sm[s] = { total: 0, pending: 0, products: {} };
                                sm[s].total++;
                                if (m.status === 'Pending') sm[s].pending++;
                                if (m.productType) sm[s].products[m.productType] = (sm[s].products[m.productType] || 0) + 1;
                              });
                              const rows = Object.entries(sm).sort((a, b) => b[1].total - a[1].total);
                              if (rows.length === 0) return <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No state data yet</td></tr>;
                              return rows.map(([state, d]) => {
                                const top = Object.entries(d.products).sort((a, b) => b[1] - a[1])[0]?.[0];
                                return (
                                  <tr key={state} className="hover:bg-secondary/30 transition-colors">
                                    <td className="px-4 py-4 font-medium text-foreground">{state}</td>
                                    <td className="px-4 py-4 text-muted-foreground">{d.total}</td>
                                    <td className="px-4 py-4"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100 dark:bg-green-950 dark:text-green-300 dark:border-green-800">{d.pending}</span></td>
                                    <td className="px-4 py-4">{top ? <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-800 border border-orange-100 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">{top}</span> : <span className="text-muted-foreground">—</span>}</td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="xl:col-span-1 space-y-6">
                  {/* Daily Trend */}
                  <Card>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider">Daily Trend</CardTitle>
                      <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded uppercase">Monthly</span>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        const dateMap: Record<string, number> = {};
                        dashMeetings.forEach(m => { dateMap[m.date] = (dateMap[m.date] || 0) + 1; });
                        const sorted = Object.entries(dateMap).sort((a, b) => a[0].localeCompare(b[0]));
                        if (sorted.length === 0) return <div className="h-56 flex items-center justify-center text-muted-foreground text-sm">No trend data yet</div>;
                        const values = sorted.map(([, v]) => v);
                        const max = Math.max(...values, 1);
                        const peak = Math.max(...values);
                        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
                        const W = 200, H = 120;
                        const pts = values.map((v, i) => `${(i / (values.length - 1 || 1)) * W},${H - (v / max) * (H - 10) - 5}`).join(' ');
                        const area = `0,${H} ${pts} ${W},${H}`;
                        return (
                          <>
                            <div className="h-56 w-full">
                              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
                                <defs><linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0" /></linearGradient></defs>
                                <polygon points={area} fill="url(#trendGrad)" />
                                <polyline points={pts} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
                                {values.map((v, i) => <circle key={i} cx={(i / (values.length - 1 || 1)) * W} cy={H - (v / max) * (H - 10) - 5} r="2.5" fill="white" stroke="#3b82f6" strokeWidth="1.5" />)}
                              </svg>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-3">
                              <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Peak Volume</p><p className="text-base font-bold text-foreground">{peak} Meetings</p></div>
                              <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Avg Daily</p><p className="text-base font-bold text-foreground">{avg}</p></div>
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>

                  {/* Activity Heatmap */}
                  <Card>
                    <CardHeader className="pb-4"><CardTitle className="text-xs font-bold uppercase tracking-wider">Activity Heatmap</CardTitle></CardHeader>
                    <CardContent>
                      {(() => {
                        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                        const grid: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
                        dashMeetings.forEach(m => {
                          if (!m.date) return;
                          const d = new Date(m.date);
                          const dow = d.getDay();
                          const wom = Math.floor((d.getDate() - 1) / 7);
                          if (dow >= 1 && dow <= 5 && wom < 5) grid[wom][dow - 1]++;
                        });
                        const maxVal = Math.max(...grid.flat(), 1);
                        const getColor = (v: number) => { const p = v / maxVal; if (p === 0) return 'bg-blue-50 dark:bg-blue-950'; if (p < 0.25) return 'bg-blue-200 dark:bg-blue-800'; if (p < 0.5) return 'bg-blue-400 dark:bg-blue-600'; if (p < 0.75) return 'bg-blue-600 dark:bg-blue-400'; return 'bg-blue-800 dark:bg-blue-300'; };
                        const wLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
                        return (
                          <>
                            <div className="grid gap-1.5" style={{ gridTemplateColumns: '28px repeat(5, 1fr)' }}>
                              <div />
                              {days.map(d => <div key={d} className="text-[9px] text-center text-muted-foreground font-bold uppercase">{d}</div>)}
                              {/* {grid.map((row, wi) => (
                                <>
                                  <div key={`w${wi}`} className="text-[9px] text-muted-foreground font-bold flex items-center justify-end pr-1">{wLabels[wi]}</div>
                                  {row.map((val, di) => <div key={di} title={`${val} meetings`} className={`${getColor(val)} rounded-sm h-8 shadow-sm`} />)}
                                </>
                              ))} */}
                              {grid.map((row, wi) => (
                                <React.Fragment key={wi}>
                                  <div className="text-[9px] text-muted-foreground font-bold flex items-center justify-end pr-1">
                                    {wLabels[wi]}
                                  </div>

                                  {row.map((val, di) => (
                                    <div
                                      key={di}
                                      title={`${val} meetings`}
                                      className={`${getColor(val)} rounded-sm h-8 shadow-sm`}
                                    />
                                  ))}
                                </React.Fragment>
                              ))}
                            </div>
                            <div className="mt-5 flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase">
                              <span>Low Activity</span>
                              <div className="flex gap-1">{['bg-blue-100', 'bg-blue-300', 'bg-blue-500', 'bg-blue-700', 'bg-blue-900'].map((c, i) => <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />)}</div>
                              <span>High Activity</span>
                            </div>
                          </>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold">User Management</h2>
              <p className="text-sm text-muted-foreground mt-1">Add, edit, and manage users</p>
            </div>
            <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add User</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add New User</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Name</Label><Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Username</Label><Input value={newUser.username} onChange={e => setNewUser(p => ({ ...p, username: e.target.value }))} /></div>
                  <div><Label>Password</Label><Input type="password" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} /></div>
                  <div>
                    <Label>Role</Label>
                    <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v as UserRole }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BO">Business Officer</SelectItem>
                        <SelectItem value="TC">Team Captain</SelectItem>
                        <SelectItem value="BDM">Business Dev Manager</SelectItem>
                        <SelectItem value="BDO">Business Dev Officer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {newUser.role === 'BO' && (
                    <div>
                      <Label>Assign to TC</Label>
                      <Select value={newUser.tcId} onValueChange={v => setNewUser(p => ({ ...p, tcId: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select TC" /></SelectTrigger>
                        <SelectContent>{tcs.map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* <Button onClick={handleAddUser} className="w-full">Add User</Button> */}
                  <Button
                    disabled={isLoading('add_user')}
                    onClick={() => withLoading('add_user', handleAddUser)}
                    className="w-full">
                    {isLoading('add_user') ? 'Adding...' : 'Add User'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead>Team</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.filter(u => u.role !== 'FM').map(user => {
                    const userTeam = teams.find(t => t.boIds.includes(user.id) || t.tcId === user.id);
                    const isEditing = editingUser === user.id;
                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select value={editRole} onValueChange={v => setEditRole(v as UserRole)}>
                              <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BO">BO</SelectItem>
                                <SelectItem value="TC">TC</SelectItem>
                                <SelectItem value="BDM">BDM</SelectItem>
                                <SelectItem value="BDO">BDO</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : <Badge variant="secondary">{user.role}</Badge>}
                        </TableCell>
                        <TableCell>
                          {isEditing && editRole === 'BO' ? (
                            <Select value={editTCId} onValueChange={setEditTCId}>
                              <SelectTrigger className="w-32 h-8"><SelectValue placeholder="Select TC" /></SelectTrigger>
                              <SelectContent>{tcs.map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
                            </Select>
                          ) : <span className="text-sm text-muted-foreground">{userTeam?.name || '—'}</span>}
                        </TableCell>
                        <TableCell>
                          <Switch checked={user.active} onCheckedChange={checked => updateUser(user.id, { active: checked })} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {isEditing ? (
                              <>
                                {/* <Button size="sm" onClick={() => handleEditRole(user.id)}>Save</Button> */}
                                <Button size="sm"
                                  disabled={isLoading(`edit_role_${user.id}`)}
                                  onClick={() => withLoading(`edit_role_${user.id}`, () => handleEditRole(user.id))}>
                                  {isLoading(`edit_role_${user.id}`) ? 'Saving...' : 'Save'}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
                              </>
                            ) : (
                              <>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingUser(user.id); setEditRole(user.role); setEditTCId(''); }}>
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setUserToDelete(user.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-display font-bold">Team Management</h2>
              <p className="text-sm text-muted-foreground mt-1">Create teams, assign TC and BOs</p>
            </div>
            <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Create Team</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create New Team</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Team Name</Label><Input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. Alpha Team" /></div>
                  <div>
                    <Label>Assign TC</Label>
                    <Select value={newTeamTC} onValueChange={setNewTeamTC}>
                      <SelectTrigger><SelectValue placeholder="Select TC" /></SelectTrigger>
                      <SelectContent>{tcs.filter(tc => !teams.some(t => t.tcId === tc.id)).map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Assign BOs</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {unassignedBOs.map(bo => (
                        <button key={bo.id} onClick={() => setNewTeamBOs(prev => prev.includes(bo.id) ? prev.filter(id => id !== bo.id) : [...prev, bo.id])}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${newTeamBOs.includes(bo.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-foreground'}`}>
                          {bo.name}
                        </button>
                      ))}
                      {unassignedBOs.length === 0 && <span className="text-sm text-muted-foreground">No unassigned BOs</span>}
                    </div>
                  </div>
                  {/* <Button onClick={handleCreateTeam} className="w-full">Create Team</Button> */}

                  <Button
                    disabled={isLoading('create_team')}
                    onClick={() => withLoading('create_team', handleCreateTeam)}
                    className="w-full">
                    {isLoading('create_team') ? 'Creating...' : 'Create Team'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {teams.map(team => {
              const tc = users.find(u => u.id === team.tcId);
              const isEditing = editingTeam === team.id;
              return (
                <Card key={team.id}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {team.name}
                        <Badge variant="outline">TC: {tc?.name}</Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setChangeTCTeamId(changeTCTeamId === team.id ? null : team.id); setNewTCForTeam(''); }}>
                          Change TC
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTeam(isEditing ? null : team.id)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setTeamToDelete(team.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {changeTCTeamId === team.id && (
                      <div className="mb-4 p-3 bg-secondary/50 rounded-lg flex gap-3 items-end">
                        <div className="flex-1">
                          <Label className="text-xs">New TC</Label>
                          <Select value={newTCForTeam} onValueChange={setNewTCForTeam}>
                            <SelectTrigger><SelectValue placeholder="Select TC" /></SelectTrigger>
                            <SelectContent>{tcs.filter(tc => tc.id !== team.tcId).map(tc => <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        {/* <Button size="sm" onClick={() => handleChangeTC(team.id)}>Save</Button> */}
                        <Button size="sm"
                          disabled={isLoading(`change_tc_${team.id}`)}
                          onClick={() => withLoading(`change_tc_${team.id}`, () => handleChangeTC(team.id))}>
                          {isLoading(`change_tc_${team.id}`) ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-3">Business Officers:</p>
                    <div className="flex flex-wrap gap-2">
                      {team.boIds.map(boId => {
                        const bo = users.find(u => u.id === boId);
                        return (
                          <div key={boId} className="flex items-center gap-1">
                            <Badge>{bo?.name}</Badge>
                            {isEditing && (
                              <button
                                disabled={isLoading(`remove_bo_${boId}`)}
                                onClick={() => withLoading(`remove_bo_${boId}`, () => handleRemoveBOFromTeam(team.id, boId))}
                                className="text-destructive hover:text-destructive/80 disabled:opacity-50">
                                <UserMinus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {team.boIds.length === 0 && <span className="text-sm text-muted-foreground">No BOs assigned</span>}
                    </div>
                    {isEditing && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm font-medium mb-2">Add BO to this team:</p>
                        <div className="flex flex-wrap gap-2">
                          {bos.filter(b => !team.boIds.includes(b.id)).map(bo => (
                            <Button key={bo.id} size="sm" variant="outline"
                              disabled={isLoading(`add_bo_${bo.id}`)}
                              onClick={() => withLoading(`add_bo_${bo.id}`, () => handleAddBOToTeam(team.id, bo.id))}>
                              <UserPlus className="w-3 h-3 mr-1" />{isLoading(`add_bo_${bo.id}`) ? 'Adding...' : bo.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'leads' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Upload Leads</h2>
            <p className="text-sm text-muted-foreground mt-1">Add leads via Excel, paste, or manually</p>
          </div>

          {/* BO Selection */}
          <Card>
            <CardHeader><CardTitle className="text-base">Select BOs for Distribution</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {bos.map(bo => {
                  const isOnline = onlineUserIds.has(bo.id);
                  return (
                    <button key={bo.id} onClick={() => setSelectedBOs(prev => prev.includes(bo.id) ? prev.filter(id => id !== bo.id) : [...prev, bo.id])}
                      className={`px-3 py-1.5 rounded-lg text-sm border transition-colors flex items-center gap-2 ${selectedBOs.includes(bo.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border text-foreground hover:bg-secondary/80'}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {bo.name}
                    </button>
                  );
                })}
              </div>
              {selectedBOs.length > 0 && <p className="text-xs text-muted-foreground mt-2">{selectedBOs.length} BOs selected</p>}
            </CardContent>
          </Card>

          {/* Excel Upload */}
          <Card>
            <CardHeader><CardTitle className="text-base">Excel Upload</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Upload an Excel file with columns: Client Name, Phone Number, Loan Requirement Amount</p>
              <div className="flex gap-3">
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()}><UploadIcon className="w-4 h-4 mr-2" />Upload Excel File</Button>
              </div>
            </CardContent>
          </Card>

          {/* Paste from Excel */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ClipboardPaste className="w-4 h-4" />Paste from Excel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Copy data from Excel (including headers) and paste below. Headers: Client Name, Phone Number, Loan Requirement Amount</p>
              <Textarea
                value={pasteData}
                onChange={e => setPasteData(e.target.value)}
                placeholder="Paste Excel data here (Tab-separated with headers)..."
                rows={6}
                className="font-mono text-xs"
              />
              <Button
                disabled={!pasteData.trim() || isLoading('paste_import')}
                onClick={() => withLoading('paste_import', handlePasteImport)}>
                <ClipboardPaste className="w-4 h-4 mr-2" />{isLoading('paste_import') ? 'Importing...' : 'Import Pasted Data'}
              </Button>
            </CardContent>
          </Card>

          {/* Manual Lead */}
          <Card>
            <CardHeader><CardTitle className="text-base">Add Lead Manually</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div><Label>Client Name</Label><Input value={leadInput.clientName} onChange={e => setLeadInput(p => ({ ...p, clientName: e.target.value }))} /></div>
                <div><Label>Phone Number</Label><Input
                  inputMode="numeric"
                  value={leadInput.phoneNumber}
                  onChange={e => setLeadInput(p => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, '') }))}
                  placeholder="e.g. 9876543210"
                /></div>
                <div><Label>Loan Requirement</Label><Input value={leadInput.loanRequirement} onChange={e => setLeadInput(p => ({ ...p, loanRequirement: e.target.value }))} placeholder="Amount or text" /></div>
              </div>
              {/* <Button onClick={handleAddLead}><UploadIcon className="w-4 h-4 mr-2" />Add & Distribute Lead</Button> */}
              <Button
                disabled={isLoading('add_lead')}
                onClick={() => withLoading('add_lead', handleAddLead)}>
                <UploadIcon className="w-4 h-4 mr-2" />{isLoading('add_lead') ? 'Adding...' : 'Add & Distribute Lead'}
              </Button>
            </CardContent>
          </Card>

          {/* All Leads */}
          <Card>
            <CardHeader><CardTitle className="text-base">All Leads ({leads.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead><TableHead>Phone</TableHead><TableHead>Loan Amt</TableHead><TableHead>Assigned BO</TableHead><TableHead>Number Status</TableHead><TableHead>Lead Status</TableHead><TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map(lead => {
                    const bo = users.find(u => u.id === lead.assignedBOId);
                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.clientName}</TableCell>
                        <TableCell>{lead.phoneNumber}</TableCell>
                        <TableCell>₹{lead.loanRequirement}</TableCell>
                        <TableCell>{bo?.name}</TableCell>
                        <TableCell><Badge variant={lead.numberStatus === 'Connected' ? 'default' : 'secondary'}>{lead.numberStatus || '—'}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{lead.leadStatus || '—'}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{lead.assignedDate}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'bdm' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">BDM Performance</h2>
            <p className="text-sm text-muted-foreground mt-1">Track business development manager outcomes</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
          <div className="grid md:grid-cols-2 gap-4">
            {bdms.map(bdm => {
              const bdmMeetings = filteredMeetings.filter(m => m.bdmId === bdm.id);
              const done = bdmMeetings.filter(m => m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up').length;
              const converted = bdmMeetings.filter(m => m.status === 'Converted').length;
              const followUp = bdmMeetings.filter(m => m.status === 'Follow-Up').length;
              const walkins = bdmMeetings.filter(m => m.meetingType === 'Walk-in' && (m.status === 'Meeting Done' || m.status === 'Converted' || m.status === 'Follow-Up'));
              const rate = done > 0 ? ((converted / done) * 100).toFixed(1) : '0';
              return (
                <Card key={bdm.id}>
                  <CardHeader><CardTitle className="text-base">{bdm.name}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Meeting Done" value={done} variant="primary" />
                      <StatCard label="Not Done" value={bdmMeetings.filter(m => m.status === 'Not Done').length} variant="destructive" />
                      <StatCard label="Converted" value={converted} variant="accent" />
                      <StatCard label="Follow-Up" value={followUp} variant="info" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-secondary text-center">
                        <span className="text-xs text-muted-foreground">Walk-in Done</span>
                        <p className="text-xl font-bold text-primary">{walkins.length}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary text-center">
                        <span className="text-xs text-muted-foreground">Conversion Rate</span>
                        <p className="text-xl font-bold text-primary">{rate}%</p>
                      </div>
                    </div>
                    {walkins.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Walk-in Dates:</p>
                        <div className="flex flex-wrap gap-1">
                          {walkins.map(w => (
                            <Badge key={w.id} variant="outline" className="text-xs">{w.walkinDate || w.date}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'duplicates' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">Duplicate Leads</h2>
            <p className="text-sm text-muted-foreground mt-1">Leads skipped due to duplicate phone numbers — {duplicateLeads.length} record{duplicateLeads.length !== 1 ? 's' : ''}</p>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Meeting Status</TableHead>
                      <TableHead>Amount Required</TableHead>
                      <TableHead>Assigned BDO</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicateLeads.map(d => {
                      // Look up original lead → meeting → BDO details
                      const originalLead = leads.find(l => l.id === d.originalLeadId);
                      const meeting = originalLead ? meetings.find(m => m.leadId === originalLead.id) : undefined;
                      const meetingStatus = meeting?.status || '—';
                      const bdo = meeting?.bdoId ? users.find(u => u.id === meeting.bdoId) : undefined;
                      return (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.clientName}</TableCell>
                          <TableCell>{d.phoneNumber}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <Badge variant={meetingStatus === 'Converted' ? 'default' : meetingStatus === 'Meeting Done' ? 'secondary' : 'outline'}>
                                {meetingStatus}
                              </Badge>
                              {meeting?.bdoStatus && <Badge variant="outline" className="text-[10px]">{meeting.bdoStatus}</Badge>}
                              {meeting?.walkingStatus && <Badge variant="outline" className="text-[10px]">{meeting.walkingStatus}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>₹{d.loanRequirement}</TableCell>
                          <TableCell>{bdo?.name || '—'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="ghost" title="View Detail" onClick={() => setSelectedDuplicate(d)}>
                                <Eye className="w-4 h-4 text-primary" />
                              </Button>
                              <Button size="sm" variant="ghost" title="Merge Leads" onClick={() => setDuplicateToMerge(d)}>
                                <GitMerge className="w-4 h-4 text-blue-500" />
                              </Button>
                              <Button size="sm" variant="ghost" title="Delete Duplicate" onClick={() => setDuplicateToDelete(d.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {duplicateLeads.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No duplicate leads found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Detail Dialog */}
          {selectedDuplicate && (() => {
            const d = selectedDuplicate;
            const originalLead = leads.find(l => l.id === d.originalLeadId);
            const meeting = originalLead ? meetings.find(m => m.leadId === originalLead.id) : undefined;
            const walkinMeeting = originalLead ? meetings.find(m => m.leadId === originalLead.id && m.meetingType === 'Walk-in') : undefined;
            const boUser = walkinMeeting ? users.find(u => u.id === walkinMeeting.boId) : (meeting ? users.find(u => u.id === meeting.boId) : undefined);
            const bdoUser = meeting?.bdoId ? users.find(u => u.id === meeting.bdoId) : undefined;
            const bdmUser = meeting?.bdmId ? users.find(u => u.id === meeting.bdmId) : undefined;
            return (
              <Dialog open={!!selectedDuplicate} onOpenChange={open => !open && setSelectedDuplicate(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-display">Duplicate Lead Detail</DialogTitle>
                  </DialogHeader>

                  {/* Section 1: Duplicate Lead Info */}
                  <div className="space-y-4">
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <h3 className="font-semibold text-sm text-amber-800 dark:text-amber-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Duplicate Lead
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Client Name</span><p className="font-medium mt-0.5">{d.clientName}</p></div>
                        <div><span className="text-muted-foreground">Phone Number</span><p className="font-medium mt-0.5">{d.phoneNumber}</p></div>
                        <div><span className="text-muted-foreground">Amount Required</span><p className="font-medium mt-0.5">₹{d.loanRequirement}</p></div>
                        <div><span className="text-muted-foreground">Created Date</span><p className="font-medium mt-0.5">{new Date(d.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p></div>
                        {meeting && (
                          <>
                            <div><span className="text-muted-foreground">Meeting Status</span>
                              <Badge className="mt-1" variant={meeting.status === 'Converted' ? 'default' : 'secondary'}>{meeting.status}</Badge>
                            </div>
                            <div><span className="text-muted-foreground">Assigned BDO</span><p className="font-medium mt-0.5">{bdoUser?.name || '—'}</p></div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Section 2: Original Lead Reference */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-400 mb-3">Original Lead Reference</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Reference ID</span>
                          <p className="font-mono text-xs mt-0.5 break-all bg-muted px-2 py-1 rounded">{d.originalLeadId || '—'}</p>
                        </div>
                        <div><span className="text-muted-foreground">Original BO</span><p className="font-medium mt-0.5">{d.originalBoName || '—'}</p></div>
                        {originalLead && (
                          <>
                            <div><span className="text-muted-foreground">Client Name</span><p className="font-medium mt-0.5">{originalLead.clientName}</p></div>
                            <div><span className="text-muted-foreground">Phone Number</span><p className="font-medium mt-0.5">{originalLead.phoneNumber}</p></div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Section 3: BO Walk-in Details */}
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h3 className="font-semibold text-sm text-green-800 dark:text-green-400 mb-3">Original BO Walk-in Details</h3>
                      {(walkinMeeting || meeting) ? (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div><span className="text-muted-foreground">BO Name</span><p className="font-medium mt-0.5">{boUser?.name || '—'}</p></div>
                          <div><span className="text-muted-foreground">BDM</span><p className="font-medium mt-0.5">{bdmUser?.name || '—'}</p></div>
                          <div><span className="text-muted-foreground">Meeting Type</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.meetingType || '—'}</p></div>
                          <div><span className="text-muted-foreground">Walk-in Date</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.walkinDate || '—'}</p></div>
                          <div><span className="text-muted-foreground">BDO Status</span>
                            <Badge className="mt-1" variant="outline">{(walkinMeeting || meeting)?.bdoStatus || '—'}</Badge>
                          </div>
                          <div><span className="text-muted-foreground">Walking Status</span>
                            <Badge className="mt-1" variant="outline">{(walkinMeeting || meeting)?.walkingStatus || '—'}</Badge>
                          </div>
                          <div><span className="text-muted-foreground">Mini Login</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.miniLogin ? 'Yes' : 'No'}</p></div>
                          <div><span className="text-muted-foreground">Full Login</span><p className="font-medium mt-0.5">{(walkinMeeting || meeting)?.fullLogin ? 'Yes' : 'No'}</p></div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No meeting/walk-in record found for the original lead.</p>
                      )}
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setSelectedDuplicate(null)}>Close</Button>
                    <Button variant="secondary" className="flex-1" onClick={() => { setSelectedDuplicate(null); setDuplicateToMerge(d); }}>
                      <GitMerge className="w-4 h-4 mr-2" />Merge Leads
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => { setSelectedDuplicate(null); setDuplicateToDelete(d.id); }}>
                      <Trash2 className="w-4 h-4 mr-2" />Delete Duplicate
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            );
          })()}

          {/* Delete Duplicate – Double Confirm */}
          <DoubleConfirmModal
            isOpen={!!duplicateToDelete}
            onClose={() => setDuplicateToDelete(null)}
            title="Delete Duplicate Lead"
            onConfirm={async () => {
              if (duplicateToDelete) {
                await deleteDuplicateLead(duplicateToDelete);
                toast.success('Duplicate lead deleted');
                setDuplicateToDelete(null);
              }
            }}
          />

          {/* Merge Leads – Double Confirm */}
          <DoubleConfirmModal
            isOpen={!!duplicateToMerge}
            onClose={() => setDuplicateToMerge(null)}
            title="Merge Leads"
            onConfirm={async () => {
              if (duplicateToMerge) {
                await mergeDuplicateLead(duplicateToMerge.id);
                toast.success('Leads merged — duplicate resolved');
                setDuplicateToMerge(null);
              }
            }}
          />
        </div>
      )}

      {activeTab === 'bdo' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">BDO Performance</h2>
            <p className="text-sm text-muted-foreground mt-1">Track business development officer outcomes</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
          <div className="grid md:grid-cols-2 gap-4">
            {bdos.map(bdo => {
              const bdoMeetings = filteredMeetings.filter(m => (m as any).bdo_id === bdo.id || m.bdoId === bdo.id);
              const allDoneMeetings = filteredMeetings.filter(m => m.status === 'Meeting Done');
              const convertedByBDM = allDoneMeetings.filter(m => m.bdoStatus === 'Converted by BDM');
              const followUps = allDoneMeetings.filter(m => m.bdoStatus === 'Follow-up');
              const walkingDone = allDoneMeetings.filter(m => m.walkingStatus === 'Walking Done' && m.bdoStatus !== 'Converted by BDM');
              const totalConverted = convertedByBDM.length + walkingDone.length;
              const pending = allDoneMeetings.filter(m => !m.bdoStatus || m.bdoStatus.length === 0).length;
              return (
                <Card key={bdo.id}>
                  <CardHeader><CardTitle className="text-base">{bdo.name}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Pending" value={pending} variant="info" />
                      <StatCard label="Converted by BDM" value={convertedByBDM.length} variant="primary" />
                      <StatCard label="Follow-up" value={followUps.length} variant="accent" />
                      <StatCard label="Walking Done" value={walkingDone.length} variant="primary" />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg bg-secondary text-center">
                        <span className="text-xs text-muted-foreground">Total Converted</span>
                        <p className="text-xl font-bold text-primary">{totalConverted}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary text-center">
                        <span className="text-xs text-muted-foreground">Mini/Full Logins</span>
                        <p className="text-xl font-bold text-primary">{allDoneMeetings.filter(m => m.miniLogin).length} / {allDoneMeetings.filter(m => m.fullLogin).length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {bdos.length === 0 && (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No BDOs found. Add a user with BDO role.</CardContent></Card>
            )}
          </div>
        </div>
      )}

      {/* Delete Modals */}
      <DoubleConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={async () => {
          if (userToDelete) {
            await removeUser(userToDelete);
            toast.success('User removed');
            setUserToDelete(null);
          }
        }}
        title="Delete User"
      />

      <DoubleConfirmModal
        isOpen={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        onConfirm={async () => {
          if (teamToDelete) {
            const team = teams.find(t => t.id === teamToDelete);
            if (team && team.boIds.length > 0) {
              const confirmed = window.confirm(`This team has ${team.boIds.length} BO(s). They will be unassigned from this team. Proceed?`);
              if (!confirmed) {
                setTeamToDelete(null);
                return;
              }
            }
            await deleteTeam(teamToDelete);
            toast.success('Team deleted');
            setTeamToDelete(null);
          }
        }}
        title="Delete Team"
      />

      {/* Upload Confirmation Modal */}
      <Dialog open={!!pendingUpload} onOpenChange={(open) => !open && setPendingUpload(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertTriangle className="h-5 w-5" />
              Duplicate Leads Detected
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {pendingUpload?.isManual ? (
              <p className="text-sm">
                This phone number already exists in the system (assigned to <strong className="font-semibold">{pendingUpload.dupes[0]?.originalBoName}</strong>).
                <br /><br />
                Do you want to discard this lead, or proceed and store it in the <strong>Duplicate Leads</strong> folder for future reference?
              </p>
            ) : (
              <>
                <p className="text-sm">We found some duplicate phone numbers in your upload. Do you want to proceed?</p>
                <div className="bg-secondary/50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground">New Valid Leads:</span>
                    <p className="font-semibold text-lg text-green-600 dark:text-green-500">{pendingUpload?.newLeads.length}</p>
                    <span className="text-[10px] text-muted-foreground">(Will be assigned to BOs)</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Duplicates Found:</span>
                    <p className="font-semibold text-lg text-amber-600 dark:text-amber-500">{pendingUpload?.dupes.length}</p>
                    <span className="text-[10px] text-muted-foreground">(Will be stored in Duplicates Folder)</span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setPendingUpload(null)}>
              Cancel & Discard
            </Button>
            {/* <Button className="flex-1" onClick={async () => {
              if (pendingUpload) {
                await addLeads(pendingUpload.newLeads, pendingUpload.dupes);
                setPendingUpload(null);

                if (pendingUpload.isManual) {
                  setLeadInput({ clientName: '', phoneNumber: '', loanRequirement: '' });
                  toast.success('Lead recorded in Duplicate Leads folder');
                } else {
                  toast.success(`${pendingUpload.newLeads.length} leads uploaded. ${pendingUpload.dupes.length} duplicates stored.`);
                }
              }
            }}>
              Confirm & Save {pendingUpload?.isManual ? 'Duplicate' : 'All'}
            </Button> */}
            <Button className="flex-1"
              disabled={isLoading('confirm_upload')}
              onClick={() => withLoading('confirm_upload', async () => {
                if (pendingUpload) {
                  await addLeads(pendingUpload.newLeads, pendingUpload.dupes);
                  setPendingUpload(null);
                  if (pendingUpload.isManual) {
                    setLeadInput({ clientName: '', phoneNumber: '', loanRequirement: '' });
                    toast.success('Lead recorded in Duplicate Leads folder');
                  } else {
                    toast.success(`${pendingUpload.newLeads.length} leads uploaded. ${pendingUpload.dupes.length} duplicates stored.`);
                  }
                }
              })}>
              {isLoading('confirm_upload') ? 'Saving...' : `Confirm & Save ${pendingUpload?.isManual ? 'Duplicate' : 'All'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}