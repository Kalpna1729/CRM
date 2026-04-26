import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { useLoading } from '@/hooks/use-loading';
import FMReport from './FMReport';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Lead, UserRole, NumberStatus, LeadStatus, DuplicateLead } from '@/types/crm';
import { DoubleConfirmModal } from '@/components/ui/DoubleConfirmModal';
import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'bo' | 'tc' | 'bdm' | 'bdo' | 'leads' | 'users' | 'teams' | 'duplicates' | 'report';
type Theme = 'dark' | 'light';

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  overview: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>,
  bo: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /></svg>,
  tc: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87" /></svg>,
  bdm: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  bdo: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" /></svg>,
  leads: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  users: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  teams: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>,
  dupes: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>,
  sun: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>,
  moon: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>,
  logout: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  bell: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>,
  activity: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
  trash: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6M9 6V4h6v2" /></svg>,
  edit: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  plus: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  check: <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>,
  upload: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" /></svg>,
  paste: <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>,
  eye: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  merge: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M6 21V9a9 9 0 009 9" /></svg>,
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
    updateTeam, updateTeamMembers, deleteTeam, deleteDuplicateLead, mergeDuplicateLead, logout, updateLead, refreshData,
  } = useCRM();
  const { withLoading, isLoading } = useLoading();

  // circulate leads that are Not Connected for 7+ days within the same team (round-robin)
  const runLeadCirculation = async () => {
    const today = new Date().toISOString().split('T')[0];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    // 7 din purane + Not Connected leads dhundho
    const staleLeads = leads.filter(l =>
      l.numberStatus === 'Not Connected' &&
      l.assignedDate <= cutoffStr &&
      !l.meetingRequested &&
      !l.meetingApproved
    );

    if (staleLeads.length === 0) {
      toast.info('No stale leads found to circulate');
      return;
    }

    let reassigned = 0;

    for (const lead of staleLeads) {
      // Us lead ki team dhundho
      const team = teams.find(t => t.boIds.includes(lead.assignedBOId));
      if (!team) continue;

      // Same team ke doosre active BOs
      const otherBOs = team.boIds.filter(id => id !== lead.assignedBOId);
      if (otherBOs.length === 0) continue;

      // Round-robin — current BO ki index se next BO
      const currentIdx = team.boIds.indexOf(lead.assignedBOId);
      const nextBO = team.boIds[(currentIdx + 1) % team.boIds.length];
      if (nextBO === lead.assignedBOId) continue;

      // Reassign karo
      await updateLead(lead.id, {
        assignedBOId: nextBO,
        assignedDate: today,
        numberStatus: '',
        callCount: 0,
      });
      reassigned++;
    }

    toast.success(`${reassigned} lead${reassigned !== 1 ? 's' : ''} circulated successfully`);
    await refreshData();
  };

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  // const [theme, setTheme] = useState<Theme>('dark');
  const [theme, setTheme] = useState<Theme>('light');
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
      setClock(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')} ${n.getHours() >= 12 ? 'PM' : 'AM'}`);
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
                { id: 'bo', label: 'BO Activity', icon: I.bo, badge: overdueFollowups > 0 ? overdueFollowups : null, badgeCls: 'warn' },
                { id: 'tc', label: 'TC Monitor', icon: I.tc, badge: pendingReqs > 0 ? pendingReqs : null, badgeCls: '' },
                { id: 'bdm', label: 'BDM Monitor', icon: I.bdm, badge: rescheduleCount > 0 ? rescheduleCount : null, badgeCls: 'warn' },
                { id: 'bdo', label: 'BDO Monitor', icon: I.bdo },
                { id: 'report', label: 'Reports', icon: I.leads },
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
                { id: 'leads', label: 'Leads', icon: I.leads },
                { id: 'users', label: 'Users', icon: I.users },
                { id: 'teams', label: 'Teams', icon: I.teams },
                { id: 'duplicates', label: 'Duplicates', icon: I.dupes, badge: duplicateLeads.length > 0 ? duplicateLeads.length : null, badgeCls: 'warn' },
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
                  <button
                    onClick={runLeadCirculation}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 18px', borderRadius: '8px', border: '1px solid rgba(255,71,87,0.3)',
                      background: 'rgba(255,71,87,0.08)', color: '#ff4757',
                      fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    🔄 Circulate Stale Leads
                    {(() => {
                      const cutoff = new Date();
                      cutoff.setDate(cutoff.getDate() - 7);
                      const cutoffStr = cutoff.toISOString().split('T')[0];
                      const count = leads.filter(l =>
                        l.numberStatus === 'Not Connected' &&
                        l.assignedDate <= cutoffStr &&
                        !l.meetingRequested &&
                        !l.meetingApproved
                      ).length;
                      return count > 0 ? (
                        <span style={{
                          background: '#ff4757', color: '#fff',
                          borderRadius: '12px', padding: '2px 8px',
                          fontSize: '11px', fontWeight: 700,
                        }}>{count}</span>
                      ) : null;
                    })()}
                  </button>



                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className="fm-clock">{clock}</div>
                    {pendingReqs > 0 && <span className="fm-badge fm-badge-warning">{I.bell} {pendingReqs} pending requests</span>}
                  </div>
                </div>

                {/* Top KPIs */}
                <div className="fm-kpi-grid fm-kpi-grid-5" style={{ gridTemplateColumns: 'repeat(5, minmax(0,1fr))', marginBottom: '16px' }}>
                  {[
                    { label: 'Total Leads', val: totalLeads, color: 'var(--teal)', sub: `${todayLeads.length} today`, bars: [60, 70, 65, 80, 75, 85, totalLeads], bc: '#06b6d4' },
                    { label: 'Connected', val: connected, color: 'var(--success)', sub: `${totalLeads ? Math.round(connected / totalLeads * 100) : 0}% rate`, bars: [20, 25, 22, 30, 28, 32, connected], bc: '#00d4aa' },
                    { label: 'Meetings', val: totalMeetings, color: 'var(--accent)', sub: `${todayMeetings.length} today`, bars: [5, 8, 7, 10, 9, 12, totalMeetings], bc: '#3d7fff' },
                    { label: 'Converted', val: converted, color: 'var(--success)', sub: `${totalMeetings ? Math.round(converted / totalMeetings * 100) : 0}% conv. rate`, bars: [1, 2, 2, 3, 3, 4, converted], bc: '#00d4aa' },
                    { label: 'Hot Leads', val: hotLeads, color: 'var(--danger)', sub: `${totalCalls} total calls`, bars: [0, 1, 1, 2, 2, 3, hotLeads], bc: '#ff4757' },
                  ].map(k => {
                    const max = Math.max(...k.bars) || 1;
                    return (
                      <div key={k.label} className="fm-kpi">
                        <div className="fm-kpi-label">{k.label}</div>
                        <div className="fm-kpi-val" style={{ color: k.color }}>{k.val}</div>
                        <div className="fm-kpi-sub">{k.sub}</div>
                        <div className="fm-kpi-bar-wrap">
                          {k.bars.map((v, i) => <div key={i} className="fm-kpi-spark" style={{ height: `${Math.max(2, Math.round((v / max) * 16))}px`, background: k.bc }} />)}
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
                  {(fromDate || toDate) && <button className="fm-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>}
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
                        const convRate = boMeetings.length ? Math.round(conv / boMeetings.length * 100) : 0;
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
                                            { v: boLeads.reduce((s, l) => s + (l.callCount || 0), 0), l: 'TOTAL CALLS', c: 'var(--accent)' },
                                            { v: +(boLeads.length > 0 ? (boLeads.reduce((s, l) => s + (l.callCount || 0), 0) / boLeads.length).toFixed(1) : 0), l: 'AVG/LEAD', c: 'var(--purple)' },
                                            { v: boLeads.filter(l => !l.callCount || l.callCount === 0).length, l: 'NOT CALLED', c: '#ff4757' },
                                            { v: boLeads.filter(l => (l.callCount || 0) >= 3).length, l: '3+ CALLS', c: '#f59e0b' },
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
                                                <td style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: (l.callCount || 0) === 0 ? 'var(--danger)' : (l.callCount || 0) >= 3 ? 'var(--warning)' : 'var(--accent)' }}>{l.callCount || 0}</td>
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
                    {(fromDate || toDate) && <button className="fm-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>}
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
                    {(fromDate || toDate) && <button className="fm-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>}
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
                        const convRate = bdmMtgs.length ? Math.round(conv / bdmMtgs.length * 100) : 0;
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
                      {filteredMeetings.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 15).map(m => {
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
                    {(fromDate || toDate) && <button className="fm-clear-btn" onClick={() => { setFromDate(''); setToDate(''); }}>clear ×</button>}
                  </div>
                </div>
                <div className="fm-kpi-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}>
                  {[
                    // { l: 'Pending BDO Action', v: filteredMeetings.filter(m => m.status === 'Meeting Done' && (!m.bdoStatus || m.bdoStatus === '')).length, c: 'var(--warning)' },
                    { l: 'Pending BDO Action', v: filteredMeetings.filter(m => m.status === 'Meeting Done' && !m.bdoStatus).length, c: 'var(--warning)' },
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
                            <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{doneMtgs.filter(m => !m.bdoStatus).length}</td>
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



            {activeTab === 'report' && (
              <FMReport
                users={users} leads={leads}
                meetings={meetings} meetingRequests={meetingRequests} teams={teams}
              />
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
                          <input className="fm-input" value={leadInput.phoneNumber} onChange={e => setLeadInput(p => ({ ...p, phoneNumber: e.target.value.replace(/\D/g, '') }))} placeholder="10 digits" />
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
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", color: (l.callCount || 0) > 0 ? 'var(--teal)' : 'var(--text3)', fontWeight: 600 }}>{l.callCount || 0}</td>
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
                        const roleColors: Record<string, string> = { BO: 'fm-badge-accent', TC: 'fm-badge-teal', BDM: 'fm-badge-purple', BDO: 'fm-badge-warning' };
                        return (
                          <tr key={user.id}>
                            <td className="pri">{user.name}</td>
                            <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: 'var(--text3)' }}>{user.username}</td>
                            <td>
                              {isEditing ? (
                                <select className="fm-select fm-select-sm" value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}>
                                  {['BO', 'TC', 'BDM', 'BDO'].map(r => <option key={r} value={r}>{r}</option>)}
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
                  <option value="FO">FO</option>
                  <option value="RM">RM</option>
                  <option value="MD">MD</option>
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