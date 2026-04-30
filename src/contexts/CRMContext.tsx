
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { User, Lead, Team, Meeting, MeetingRequest, LeadRemark, DuplicateLead, MeetingRemark, LoginHistory, FollowUpReminder } from '@/types/crm';
import { supabase } from '@/integrations/supabase/client';
interface CRMContextType {
  currentUser: User | null;
  users: User[];
  leads: Lead[];
  teams: Team[];
  meetings: Meeting[];
  meetingRequests: MeetingRequest[];
  leadRemarks: LeadRemark[];
  duplicateLeads: DuplicateLead[];
  meetingRemarks: MeetingRemark[];
  loginHistory: LoginHistory[];
  followUpReminders: FollowUpReminder[];
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshData: () => Promise<void>;
  addLeads: (newLeads: Lead[], duplicates?: DuplicateLead[]) => Promise<void>;
  updateLead: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  addUser: (user: User, password: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  addTeam: (team: Team) => Promise<void>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  updateTeamMembers: (teamId: string, boIds: string[]) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addMeeting: (meeting: Meeting) => Promise<void>;
  updateMeeting: (meetingId: string, updates: Partial<Meeting>) => Promise<void>;
  addMeetingRequest: (req: MeetingRequest) => Promise<void>;
  updateMeetingRequest: (reqId: string, updates: Partial<MeetingRequest>) => Promise<void>;
  addRemark: (remark: Omit<LeadRemark, 'id' | 'updatedAt'>) => Promise<void>;
  updateRemark: (remarkId: string, newText: string) => Promise<void>;
  deleteRemark: (remarkId: string) => Promise<void>;
  deleteDuplicateLead: (id: string) => Promise<void>;
  mergeDuplicateLead: (duplicateId: string) => Promise<void>;
  addMeetingRemark: (meetingId: string, remark: string, createdBy: string) => Promise<void>;
  addLoginUpdate: (meetingId: string, loginType: LoginHistory['loginType'], createdBy: string) => Promise<void>;
  addFollowUpReminder: (leadId: string, date: string, remark: string) => Promise<void>;
  deleteFollowUpReminder: (id: string) => Promise<void>;
  markFollowUpDone: (id: string) => Promise<void>;
}

const CRMContext = createContext<CRMContextType | null>(null);

const mapProfile = (p: any): User => ({
  id: p.id, name: p.name, username: p.username, role: p.role,
  active: p.active, teamId: p.team_id || undefined, authId: p.auth_id || undefined,
});

const mapLead = (l: any): Lead => ({
  id: l.id, clientName: l.client_name, phoneNumber: l.phone_number,
  loanRequirement: String(l.loan_requirement), address: l.address || undefined,
  numberStatus: l.number_status || '', leadStatus: l.lead_status || '',
  leadType: l.lead_type || '', assignedBOId: l.assigned_bo_id,
  assignedDate: l.assigned_date, meetingRequested: l.meeting_requested,
  meetingRejected: l.meeting_rejected,
  meetingApproved: l.meeting_approved, meetingId: l.meeting_id || undefined,
  priority: l.priority ?? undefined,
  followUpDate: l.follow_up_date ?? undefined,
  callCount: l.call_count ?? 0,
  email: l.email || undefined,
  contactNumber: l.contact_number || undefined,
  entityName: l.entity_name || undefined,
  entityType: l.entity_type || undefined,
  natureOfBusiness: l.nature_of_business || undefined,
  businessPlace: l.business_place || undefined,
  lastYearTurnover: l.last_year_turnover || undefined,
  lastYearNetProfit: l.last_year_net_profit || undefined,
  businessVintage: l.business_vintage || undefined,
  businessDescription: l.business_description || undefined,
  state: l.state || undefined,
  requirementType: l.requirement_type || undefined,
  requiredAmount: l.required_amount || undefined,
  collateralType: l.collateral_type || undefined,
  collateralValue: l.collateral_value || undefined,
  collateralDescription: l.collateral_description || undefined,
  projectDescription: l.project_description || undefined,
  loanAmountStatus: l.loan_amount_status || undefined,
  liabilityAmount: l.liability_amount || undefined,
  bankName: l.bank_name || undefined,
  dsaName: l.dsa_name || undefined,
});

const mapMeeting = (m: any): Meeting => ({
  id: m.id, leadId: m.lead_id, bdmId: m.bdm_id, tcId: m.tc_id,
  boId: m.bo_id, date: m.date, timeSlot: m.time_slot,
  status: m.status || 'Scheduled', meetingType: m.meeting_type || undefined,
  walkinDate: m.walkin_date || undefined,
  bdoStatus: m.bdo_status || undefined,
  bdoId: m.bdo_id || undefined,
  miniLogin: m.mini_login || false,
  fullLogin: m.full_login || false,
  walkingStatus: m.walking_status || undefined,
  // clientName: m.client_name || undefined,
  // location: m.location || undefined,
  // state: m.state || undefined,
  // productType: m.product_type || undefined,
  // finalRequirement: m.final_requirement != null ? String(m.final_requirement) : undefined,
  // collateralValue: m.collateral_value != null ? String(m.collateral_value) : undefined,
  foStatus: m.fo_status || undefined,
  miniLoginDate: m.mini_login_date || undefined,
  fullLoginDate: m.full_login_date || undefined,
  foId: m.fo_id || undefined,
  documentsReceived: m.documents_received || false,
  reportDate: m.report_date || undefined,
  rmId: m.rm_id || undefined,
  caseStage: m.case_stage || undefined,
  rmPriority: m.rm_priority || undefined,
});

const mapMeetingRequest = (r: any): MeetingRequest => ({
  id: r.id, leadId: r.lead_id, boId: r.bo_id, tcId: r.tc_id,
  status: r.status, createdAt: r.created_at?.split('T')[0] || '',
});

const mapRemark = (r: any): LeadRemark => ({
  id: r.id, leadId: r.lead_id, remark: r.remark, createdBy: r.created_by,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

const mapDuplicateLead = (d: any): DuplicateLead => ({
  id: d.id, clientName: d.client_name, phoneNumber: d.phone_number,
  loanRequirement: String(d.loan_requirement), address: d.address || undefined,
  originalLeadId: d.original_lead_id || undefined,
  originalBoName: d.original_bo_name || undefined,
  uploadedBy: d.uploaded_by || undefined,
  uploadedAt: d.uploaded_at,
});

const mapMeetingRemark = (r: any): MeetingRemark => ({
  id: r.id, meetingId: r.meeting_id, remark: r.remark,
  createdBy: r.created_by, createdAt: r.created_at,
});

const mapLoginHistory = (r: any): LoginHistory => ({
  id: r.id, meetingId: r.meeting_id, loginType: r.login_type,
  createdBy: r.created_by, createdAt: r.created_at,
});


const mapFollowUp = (r: any): FollowUpReminder => ({
  id: r.id,
  leadId: r.lead_id,
  reminderDate: r.reminder_date,
  remark: r.remark,
  createdBy: r.created_by,
  isDone: r.is_done,
  createdAt: r.created_at,
});

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([]);
  const [leadRemarks, setLeadRemarks] = useState<LeadRemark[]>([]);
  const [duplicateLeads, setDuplicateLeads] = useState<DuplicateLead[]>([]);
  const [meetingRemarks, setMeetingRemarks] = useState<MeetingRemark[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [followUpReminders, setFollowUpReminders] = useState<FollowUpReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // [OPT-1] Sirf profiles + teams fetch karo — baaki data waise hi rehta hai.
  // Yeh function sirf tab call hoga jab profiles/teams/team_members mein change ho.
  // Pehle saara fetchAllData() call hota tha jo 11 queries dobara chalaata tha — ab nahi.
  const fetchProfilesAndTeams = useCallback(async () => {
    const [profilesRes, teamsRes, membersRes] = await Promise.all([
      supabase.from('profiles').select('id, name, username, role, active, team_id, auth_id'),
      supabase.from('teams').select('id, name, tc_id'),
      supabase.from('team_members').select('team_id, bo_id'),
    ]);
    if (profilesRes.error) console.error('[CRM] profiles fetch failed:', profilesRes.error.message);
    else if (profilesRes.data) setUsers(profilesRes.data.map(mapProfile));

    if (teamsRes.error) console.error('[CRM] teams fetch failed:', teamsRes.error.message);
    else if (teamsRes.data && membersRes.data) {
      const builtTeams: Team[] = teamsRes.data.map((t: any) => ({
        id: t.id, name: t.name, tcId: t.tc_id,
        boIds: membersRes.data!.filter((m: any) => m.team_id === t.id).map((m: any) => m.bo_id),
      }));
      setTeams(builtTeams);
    }
  }, []);

  // [OPT-2] fetchAllData: select('*') ki jagah sirf zaroori columns.
  // lead_remarks / meeting_remarks / login_history pe .limit(300) — poora history nahi chahiye har baar.
  const fetchAllData = useCallback(async () => {
    const [profilesRes, teamsRes, membersRes, leadsRes, meetingsRes, reqsRes, remarksRes, dupsRes, meetingRemarksRes, loginHistoryRes, followUpRes] = await Promise.all([
      supabase.from('profiles').select('id, name, username, role, active, team_id, auth_id'),
      supabase.from('teams').select('id, name, tc_id'),
      supabase.from('team_members').select('team_id, bo_id'),
      supabase.from('leads').select('id, client_name, phone_number, loan_requirement, address, number_status, lead_status, lead_type, assigned_bo_id, assigned_date, meeting_requested, meeting_rejected, meeting_approved, meeting_id, priority, follow_up_date, call_count, email, contact_number, entity_name, entity_type, nature_of_business, business_place, last_year_turnover, last_year_net_profit, business_vintage, business_description, state, requirement_type, required_amount, collateral_type, collateral_value, collateral_description, project_description, loan_amount_status, liability_amount, bank_name, dsa_name'),
      supabase.from('meetings').select('id, lead_id, bdm_id, tc_id, bo_id, date, time_slot, status, meeting_type, walkin_date, bdo_status, bdo_id, mini_login, full_login, walking_status, fo_status, mini_login_date, full_login_date, fo_id, documents_received, report_date, rm_id, case_stage, rm_priority'),
      supabase.from('meeting_requests').select('id, lead_id, bo_id, tc_id, status, created_at'),
      supabase.from('lead_remarks').select('id, lead_id, remark, created_by, created_at, updated_at').order('created_at', { ascending: false }).limit(300),
      supabase.from('duplicate_leads').select('id, client_name, phone_number, loan_requirement, address, original_lead_id, original_bo_name, uploaded_by, uploaded_at').order('uploaded_at', { ascending: false }),
      supabase.from('meeting_remarks').select('id, meeting_id, remark, created_by, created_at').order('created_at', { ascending: false }).limit(300),
      (supabase as any).from('login_history').select('id, meeting_id, login_type, created_by, created_at').order('created_at', { ascending: false }).limit(300),
      supabase.from('follow_up_reminders').select('id, lead_id, reminder_date, remark, created_by, is_done, created_at').order('reminder_date', { ascending: true }),
    ]);

    // Har query ka error log karo — ek fail hone se baaki data wipe nahi hoga.
    if (profilesRes.error) console.error('[CRM] profiles fetch failed:', profilesRes.error.message);
    else if (profilesRes.data) setUsers(profilesRes.data.map(mapProfile));

    if (leadsRes.error) console.error('[CRM] leads fetch failed:', leadsRes.error.message);
    else if (leadsRes.data) setLeads(leadsRes.data.map(mapLead));

    if (meetingsRes.error) console.error('[CRM] meetings fetch failed:', meetingsRes.error.message);
    else if (meetingsRes.data) setMeetings(meetingsRes.data.map(mapMeeting));

    if (reqsRes.error) console.error('[CRM] meeting_requests fetch failed:', reqsRes.error.message);
    else if (reqsRes.data) setMeetingRequests(reqsRes.data.map(mapMeetingRequest));

    if (remarksRes.error) console.error('[CRM] lead_remarks fetch failed:', remarksRes.error.message);
    else if (remarksRes.data) setLeadRemarks(remarksRes.data.map(mapRemark));

    if (dupsRes.error) console.error('[CRM] duplicate_leads fetch failed:', dupsRes.error.message);
    else if (dupsRes.data) setDuplicateLeads(dupsRes.data.map(mapDuplicateLead));

    if (meetingRemarksRes.error) console.error('[CRM] meeting_remarks fetch failed:', meetingRemarksRes.error.message);
    else if (meetingRemarksRes.data) setMeetingRemarks(meetingRemarksRes.data.map(mapMeetingRemark));

    if (loginHistoryRes.error) console.error('[CRM] login_history fetch failed:', loginHistoryRes.error.message);
    else if (loginHistoryRes.data) setLoginHistory(loginHistoryRes.data.map(mapLoginHistory));

    if (followUpRes.error) console.error('[CRM] follow_up_reminders fetch failed:', followUpRes.error.message);
    else if (followUpRes.data) setFollowUpReminders(followUpRes.data.map(mapFollowUp));

    if (teamsRes.error) console.error('[CRM] teams fetch failed:', teamsRes.error.message);
    else if (teamsRes.data && membersRes.data) {
      const builtTeams: Team[] = teamsRes.data.map((t: any) => ({
        id: t.id, name: t.name, tcId: t.tc_id,
        boIds: membersRes.data!.filter((m: any) => m.team_id === t.id).map((m: any) => m.bo_id),
      }));
      setTeams(builtTeams);
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      const savedUser = localStorage.getItem('crm_current_user');
      if (savedUser) {
        try { setCurrentUser(JSON.parse(savedUser)); } catch {
          localStorage.removeItem('crm_current_user');
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (savedUser && !session) {
        console.log('Supabase session expired, using anon access for data');
      }

      await fetchAllData();
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { });

    function applyEvent<T extends { id: string }>(
      prev: T[],
      payload: { eventType: string; new: any; old: any },
      mapper: (row: any) => T
    ): T[] {
      const { eventType, new: newRow, old: oldRow } = payload;
      if (eventType === 'INSERT') {
        // Guard against duplicates — can happen when manual optimistic update
        // races with the realtime event, or when multiple clients (e.g. local
        // dev + production) share the same Supabase project.
        if (prev.some(item => item.id === newRow.id)) return prev;
        return [mapper(newRow), ...prev];
      }
      if (eventType === 'UPDATE') return prev.map(item => item.id === newRow.id ? mapper(newRow) : item);
      if (eventType === 'DELETE') return prev.filter(item => item.id !== oldRow.id);
      return prev;
    }

    const channel = supabase.channel('crm-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, (payload) => {
        setLeads(prev => applyEvent(prev, payload as any, mapLead));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, (payload) => {
        setMeetings(prev => applyEvent(prev, payload as any, mapMeeting));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_requests' }, (payload) => {
        setMeetingRequests(prev => applyEvent(prev, payload as any, mapMeetingRequest));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_remarks' }, (payload) => {
        setLeadRemarks(prev => applyEvent(prev, payload as any, mapRemark));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'duplicate_leads' }, (payload) => {
        setDuplicateLeads(prev => applyEvent(prev, payload as any, mapDuplicateLead));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_remarks' }, (payload) => {
        setMeetingRemarks(prev => applyEvent(prev, payload as any, mapMeetingRemark));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'login_history' } as any, (payload) => {
        setLoginHistory(prev => applyEvent(prev, payload as any, mapLoginHistory));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follow_up_reminders' }, (payload) => {
        setFollowUpReminders(prev => applyEvent(prev, payload as any, mapFollowUp));
      })
      // [OPT-3] profiles/teams/team_members change hone pe sirf wahi 3 tables reload karo —
      // pehle yahan fetchAllData() tha jo poori 11 queries dobara chalaata tha.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchProfilesAndTeams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => fetchProfilesAndTeams())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => fetchProfilesAndTeams())
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [fetchAllData, fetchProfilesAndTeams]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('crm_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('crm_current_user');
    }
  }, [currentUser]);

  const login = useCallback(async (username: string, password: string) => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, username, role, active, team_id, auth_id')
      .eq('username', username);

    if (!profiles || profiles.length === 0) return false;

    const profile = mapProfile(profiles[0]);
    if (!profile.active) return false;

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email: username, password });

    if (!signInError && signInData?.user) {
      if (!profile.authId) {
        await supabase.from('profiles').update({ auth_id: signInData.user.id }).eq('id', profile.id);
      }
      setCurrentUser(profile);
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  const refreshData = fetchAllData;

  const addLeads = useCallback(async (newLeads: Lead[], duplicates?: DuplicateLead[]) => {
    if (newLeads.length > 0) {
      const rows = newLeads.map(l => ({
        id: l.id, client_name: l.clientName, phone_number: l.phoneNumber,
        loan_requirement: l.loanRequirement, address: l.address || null,
        number_status: l.numberStatus, lead_status: l.leadStatus,
        lead_type: l.leadType, assigned_bo_id: l.assignedBOId,
        assigned_date: l.assignedDate, meeting_requested: l.meetingRequested,
        meeting_approved: l.meetingApproved, meeting_id: l.meetingId || null,
      }));
      const { error: leadsErr } = await supabase.from('leads').insert(rows);
      if (leadsErr) throw new Error(`Leads save nahi hue: ${leadsErr.message}`);
    }
    if (duplicates && duplicates.length > 0) {
      const dupRows = duplicates.map(d => ({
        client_name: d.clientName, phone_number: d.phoneNumber,
        loan_requirement: d.loanRequirement, address: d.address || null,
        original_lead_id: d.originalLeadId || null,
        original_bo_name: d.originalBoName || null,
        uploaded_by: d.uploadedBy || null,
      }));
      const { error: dupErr } = await supabase.from('duplicate_leads').insert(dupRows);
      if (dupErr) throw new Error(`Duplicate leads save nahi hue: ${dupErr.message}`);
    }
    // Realtime INSERT events handle leads & duplicate_leads state — fetchAllData() hataya gaya.
  }, []);

  const updateLead = useCallback(async (leadId: string, updates: Partial<Lead>) => {
    const dbUpdates: any = {};
    if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
    if (updates.numberStatus !== undefined) dbUpdates.number_status = updates.numberStatus;
    if (updates.leadStatus !== undefined) dbUpdates.lead_status = updates.leadStatus;
    if (updates.leadType !== undefined) dbUpdates.lead_type = updates.leadType;
    if (updates.meetingRequested !== undefined) dbUpdates.meeting_requested = updates.meetingRequested;
    if (updates.meetingApproved !== undefined) dbUpdates.meeting_approved = updates.meetingApproved;
    if (updates.meetingRejected !== undefined) dbUpdates.meeting_rejected = updates.meetingRejected;
    if (updates.meetingId !== undefined) dbUpdates.meeting_id = updates.meetingId;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority || null;
    if (updates.followUpDate !== undefined) dbUpdates.follow_up_date = updates.followUpDate || null;
    if (updates.assignedBOId !== undefined) dbUpdates.assigned_bo_id = updates.assignedBOId;
    // circulate lead among BOs by setting assigned_bo_id to null for 10 seconds before updating to new BO, so that realtime events can trigger properly for all clients
    if (updates.assignedDate !== undefined) dbUpdates.assigned_date = updates.assignedDate;
    if (updates.callCount !== undefined) dbUpdates.call_count = updates.callCount;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.contactNumber !== undefined) dbUpdates.contact_number = updates.contactNumber;
    if (updates.entityName !== undefined) dbUpdates.entity_name = updates.entityName;
    if (updates.entityType !== undefined) dbUpdates.entity_type = updates.entityType;
    if (updates.natureOfBusiness !== undefined) dbUpdates.nature_of_business = updates.natureOfBusiness;
    if (updates.businessPlace !== undefined) dbUpdates.business_place = updates.businessPlace;
    if (updates.lastYearTurnover !== undefined) dbUpdates.last_year_turnover = updates.lastYearTurnover;
    if (updates.lastYearNetProfit !== undefined) dbUpdates.last_year_net_profit = updates.lastYearNetProfit;
    if (updates.businessVintage !== undefined) dbUpdates.business_vintage = updates.businessVintage;
    if (updates.businessDescription !== undefined) dbUpdates.business_description = updates.businessDescription;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.requirementType !== undefined) dbUpdates.requirement_type = updates.requirementType;
    if (updates.requiredAmount !== undefined) dbUpdates.required_amount = updates.requiredAmount;
    if (updates.collateralType !== undefined) dbUpdates.collateral_type = updates.collateralType;
    if (updates.collateralValue !== undefined) dbUpdates.collateral_value = updates.collateralValue;
    if (updates.collateralDescription !== undefined) dbUpdates.collateral_description = updates.collateralDescription;
    if (updates.projectDescription !== undefined) dbUpdates.project_description = updates.projectDescription;
    if (updates.loanAmountStatus !== undefined) dbUpdates.loan_amount_status = updates.loanAmountStatus;
    if (updates.liabilityAmount !== undefined) dbUpdates.liability_amount = updates.liabilityAmount;
    if (updates.bankName !== undefined) dbUpdates.bank_name = updates.bankName;
    if (updates.dsaName !== undefined) dbUpdates.dsa_name = updates.dsaName;
    const { error } = await supabase.from('leads').update(dbUpdates).eq('id', leadId);
    if (error) throw new Error(`Lead update nahi hua: ${error.message}`);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
  }, []);

  const addUser = useCallback(async (user: User, password: string) => {
    const { error } = await supabase.functions.invoke('create-user', {
      body: {
        name: user.name,
        username: user.username,
        password: password,
        role: user.role,
        teamId: user.teamId || null,
      },
    });
    if (error) throw new Error(error.message);
    // fetchProfilesAndTeams() via realtime 'profiles' event handle karega.
  }, []);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    const dbUpdates: any = {};
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.teamId !== undefined) dbUpdates.team_id = updates.teamId;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
    if (error) throw new Error(`User update nahi hua: ${error.message}`);
    // fetchProfilesAndTeams() via realtime 'profiles' event handle karega.
  }, []);

  const removeUser = useCallback(async (userId: string) => {
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
    });
    if (error) throw new Error(error.message);
    // fetchProfilesAndTeams() via realtime handle karega.
  }, []);

  const addTeam = useCallback(async (team: Team) => {
    const { error: teamErr } = await supabase.from('teams').insert({ id: team.id, name: team.name, tc_id: team.tcId });
    if (teamErr) throw new Error(`Team create nahi hua: ${teamErr.message}`);
    if (team.boIds.length > 0) {
      const { error: membErr } = await supabase.from('team_members').insert(team.boIds.map(boId => ({ team_id: team.id, bo_id: boId })));
      if (membErr) throw new Error(`Team members add nahi hue: ${membErr.message}`);
    }
    // fetchProfilesAndTeams() via realtime 'teams' + 'team_members' event handle karega.
  }, []);

  const updateTeam = useCallback(async (teamId: string, updates: Partial<Team>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.tcId !== undefined) dbUpdates.tc_id = updates.tcId;
    const { error } = await supabase.from('teams').update(dbUpdates).eq('id', teamId);
    if (error) throw new Error(`Team update nahi hua: ${error.message}`);
    // fetchProfilesAndTeams() via realtime handle karega.
  }, []);

  const updateTeamMembers = useCallback(async (teamId: string, boIds: string[]) => {
    const { error: delErr } = await supabase.from('team_members').delete().eq('team_id', teamId);
    if (delErr) throw new Error(`Team members clear nahi hue: ${delErr.message}`);
    if (boIds.length > 0) {
      const { error: insErr } = await supabase.from('team_members').insert(boIds.map(boId => ({ team_id: teamId, bo_id: boId })));
      if (insErr) throw new Error(`Team members add nahi hue: ${insErr.message}`);
    }
    const { data: allProfiles } = await supabase.from('profiles').select('id, team_id').eq('role', 'BO');
    if (allProfiles) {
      for (const p of allProfiles) {
        if (boIds.includes(p.id) && p.team_id !== teamId) {
          await supabase.from('profiles').update({ team_id: teamId }).eq('id', p.id);
        }
      }
    }
    // fetchProfilesAndTeams() via realtime 'profiles' + 'team_members' event handle karega.
  }, []);

  const deleteTeam = useCallback(async (teamId: string) => {
    const { data: members } = await supabase.from('team_members').select('bo_id').eq('team_id', teamId);
    if (members) {
      for (const m of members) {
        await supabase.from('profiles').update({ team_id: null }).eq('id', m.bo_id);
      }
    }
    const { error: delMembErr } = await supabase.from('team_members').delete().eq('team_id', teamId);
    if (delMembErr) throw new Error(`Team members delete nahi hue: ${delMembErr.message}`);
    const team = teams.find(t => t.id === teamId);
    if (team) {
      await supabase.from('profiles').update({ team_id: null }).eq('id', team.tcId);
    }
    const { error: delTeamErr } = await supabase.from('teams').delete().eq('id', teamId);
    if (delTeamErr) throw new Error(`Team delete nahi hua: ${delTeamErr.message}`);
    // fetchProfilesAndTeams() via realtime handle karega.
  }, [teams]);

  const addMeeting = useCallback(async (meeting: Meeting) => {
    const { error } = await supabase.from('meetings').insert({
      id: meeting.id, lead_id: meeting.leadId, bdm_id: meeting.bdmId,
      tc_id: meeting.tcId, bo_id: meeting.boId, date: meeting.date,
      time_slot: meeting.timeSlot, status: meeting.status,
      meeting_type: meeting.meetingType || null,
      walkin_date: meeting.walkinDate || null,
      // client_name: meeting.clientName || null,
      // location: meeting.location || null,
      // state: meeting.state || null,
      // product_type: meeting.productType || null,
      // final_requirement: meeting.finalRequirement ?? null,
      // collateral_value: meeting.collateralValue ?? null,
    });
    if (error) throw new Error(`Meeting create nahi hua: ${error.message}`);
    // Realtime INSERT event handles state update — no manual set needed.
  }, []);

  const updateMeeting = useCallback(async (meetingId: string, updates: Partial<Meeting>) => {
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.bdmId !== undefined) dbUpdates.bdm_id = updates.bdmId;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.timeSlot !== undefined) dbUpdates.time_slot = updates.timeSlot;
    if (updates.meetingType !== undefined) dbUpdates.meeting_type = updates.meetingType;
    if (updates.walkinDate !== undefined) dbUpdates.walkin_date = updates.walkinDate;
    if (updates.bdoStatus !== undefined) dbUpdates.bdo_status = updates.bdoStatus;
    if (updates.bdoId !== undefined) dbUpdates.bdo_id = updates.bdoId;
    if (updates.miniLogin !== undefined) dbUpdates.mini_login = updates.miniLogin;
    if (updates.fullLogin !== undefined) dbUpdates.full_login = updates.fullLogin;
    if (updates.walkingStatus !== undefined) dbUpdates.walking_status = updates.walkingStatus;
    // if (updates.clientName !== undefined) dbUpdates.client_name = updates.clientName;
    // if (updates.location !== undefined) dbUpdates.location = updates.location;
    // if (updates.state !== undefined) dbUpdates.state = updates.state;
    // if (updates.productType !== undefined) dbUpdates.product_type = updates.productType;
    // if (updates.finalRequirement !== undefined) dbUpdates.final_requirement = updates.finalRequirement;
    // if (updates.collateralValue !== undefined) dbUpdates.collateral_value = updates.collateralValue;
    if (updates.foStatus !== undefined) dbUpdates.fo_status = updates.foStatus;
    if (updates.miniLoginDate !== undefined) dbUpdates.mini_login_date = updates.miniLoginDate;
    if (updates.fullLoginDate !== undefined) dbUpdates.full_login_date = updates.fullLoginDate;
    if (updates.foId !== undefined) dbUpdates.fo_id = updates.foId;
    if (updates.documentsReceived !== undefined) dbUpdates.documents_received = updates.documentsReceived;
    if (updates.reportDate !== undefined) dbUpdates.report_date = updates.reportDate;
    if (updates.rmId !== undefined) dbUpdates.rm_id = updates.rmId;
    if (updates.caseStage !== undefined) dbUpdates.case_stage = updates.caseStage;
    if (updates.rmPriority !== undefined) dbUpdates.rm_priority = updates.rmPriority;
    const { error } = await supabase.from('meetings').update(dbUpdates).eq('id', meetingId);
    if (error) throw new Error(`Meeting update nahi hua: ${error.message}`);
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, ...updates } : m));
  }, []);

  const addMeetingRequest = useCallback(async (req: MeetingRequest) => {
    const { error } = await supabase.from('meeting_requests').insert({
      id: req.id, lead_id: req.leadId, bo_id: req.boId,
      tc_id: req.tcId, status: req.status,
    });
    if (error) throw new Error(`Meeting request nahi bani: ${error.message}`);
    // NOTE: Do NOT manually update state here.
    // The realtime subscription on 'meeting_requests' handles the INSERT event
    // and adds it to state automatically. Doing both causes duplicate entries.
  }, []);

  const updateMeetingRequest = useCallback(async (reqId: string, updates: Partial<MeetingRequest>) => {
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    const { error } = await supabase.from('meeting_requests').update(dbUpdates).eq('id', reqId);
    if (error) throw new Error(`Meeting request update nahi hua: ${error.message}`);
    setMeetingRequests(prev => prev.map(r => r.id === reqId ? { ...r, ...updates } : r));
  }, []);

  const addRemark = useCallback(async (remark: Omit<LeadRemark, 'id' | 'updatedAt'>) => {
    const { error } = await supabase
      .from('lead_remarks')
      .insert({ lead_id: remark.leadId, remark: remark.remark, created_by: remark.createdBy });
    if (error) throw new Error(`Remark save nahi hua: ${error.message}`);
    // Realtime INSERT event handles state update.
  }, []);

  const updateRemark = useCallback(async (remarkId: string, newText: string) => {
    const { error } = await supabase.from('lead_remarks').update({ remark: newText, updated_at: new Date().toISOString() }).eq('id', remarkId);
    if (error) throw new Error(`Remark update nahi hua: ${error.message}`);
    setLeadRemarks(prev => prev.map(r => r.id === remarkId ? { ...r, remark: newText } : r));
  }, []);

  const deleteRemark = useCallback(async (remarkId: string) => {
    const { error } = await supabase.from('lead_remarks').delete().eq('id', remarkId);
    if (error) throw new Error(`Remark delete nahi hua: ${error.message}`);
    setLeadRemarks(prev => prev.filter(r => r.id !== remarkId));
  }, []);

  const deleteDuplicateLead = useCallback(async (id: string) => {
    const { error } = await supabase.from('duplicate_leads').delete().eq('id', id);
    if (error) throw new Error(`Duplicate lead delete nahi hua: ${error.message}`);
    setDuplicateLeads(prev => prev.filter(d => d.id !== id));
  }, []);

  const mergeDuplicateLead = useCallback(async (duplicateId: string) => {
    // Merging means the duplicate is resolved: simply remove the duplicate record.
    // The original lead remains as the canonical entry.
    const { error } = await supabase.from('duplicate_leads').delete().eq('id', duplicateId);
    if (error) throw new Error(`Duplicate lead merge nahi hua: ${error.message}`);
    setDuplicateLeads(prev => prev.filter(d => d.id !== duplicateId));
  }, []);

  const addMeetingRemark = useCallback(async (meetingId: string, remark: string, createdBy: string) => {
    const { error } = await supabase
      .from('meeting_remarks')
      .insert({ meeting_id: meetingId, remark, created_by: createdBy });
    if (error) throw new Error(`Meeting remark save nahi hua: ${error.message}`);
    // Realtime INSERT event handles state update.
  }, []);

  const addLoginUpdate = useCallback(async (meetingId: string, loginType: LoginHistory['loginType'], createdBy: string) => {
    const { error: logErr } = await (supabase as any).from('login_history').insert({
      meeting_id: meetingId,
      login_type: loginType,
      created_by: createdBy,
    });
    if (logErr) throw new Error(`Login history save nahi hua: ${logErr.message}`);








    // Update the meeting boolean fields and auto-convert to 'Converted by BDM'
    const updates: any = { bdoStatus: 'Converted by BDM' };
    if (loginType === 'Mini Login') updates.miniLogin = true;
    if (loginType === 'Full Login') updates.fullLogin = true;
    if (loginType === 'Both') { updates.miniLogin = true; updates.fullLogin = true; }
    const { error: meetErr } = await supabase.from('meetings').update({
      bdo_status: updates.bdoStatus,
      ...(updates.miniLogin !== undefined && { mini_login: updates.miniLogin }),
      ...(updates.fullLogin !== undefined && { full_login: updates.fullLogin }),
    }).eq('id', meetingId);
    if (meetErr) throw new Error(`Meeting login status update nahi hua: ${meetErr.message}`);
    // Realtime UPDATE event handles meetings state. login_history INSERT handled by realtime too.
    // Optimistic update for meetings so UI is instant:
    setMeetings(prev => prev.map(m => m.id === meetingId ? {
      ...m,
      bdoStatus: 'Converted by BDM',
      ...(loginType === 'Mini Login' || loginType === 'Both' ? { miniLogin: true } : {}),
      ...(loginType === 'Full Login' || loginType === 'Both' ? { fullLogin: true } : {}),
    } : m));
  }, []);




  const addFollowUpReminder = useCallback(async (leadId: string, date: string, remark: string) => {
    // Explicitly id bhejo — DB mein gen_random_uuid() default nahi hai
    // isliye id missing hone pe 409 Conflict aata tha.
    const id = crypto.randomUUID();
    const { error } = await supabase
      .from('follow_up_reminders')
      .insert({ id, lead_id: leadId, reminder_date: date, remark, created_by: currentUser!.id });
    if (error) throw new Error(`Follow-up save nahi hua: ${error.message}`);
    // State update realtime subscription handle karega.
  }, [currentUser]);

  const deleteFollowUpReminder = useCallback(async (id: string) => {
    const { error } = await supabase.from('follow_up_reminders').delete().eq('id', id);
    if (error) throw new Error(`Follow-up delete nahi hua: ${error.message}`);
    setFollowUpReminders(prev => prev.filter(r => r.id !== id));
  }, []);

  const markFollowUpDone = useCallback(async (id: string) => {
    const { error } = await supabase.from('follow_up_reminders').update({ is_done: true }).eq('id', id);
    if (error) throw new Error(`Follow-up mark done nahi hua: ${error.message}`);
    setFollowUpReminders(prev => prev.map(r => r.id === id ? { ...r, isDone: true } : r));
  }, []);



  return (
    <CRMContext.Provider value={{
      currentUser, users, leads, teams, meetings, meetingRequests, leadRemarks, duplicateLeads, meetingRemarks, loginHistory, followUpReminders, loading,
      login, logout, refreshData,
      addLeads, updateLead,
      addUser, updateUser, removeUser,
      addTeam, updateTeam, updateTeamMembers, deleteTeam,
      addMeeting, updateMeeting,
      addMeetingRequest, updateMeetingRequest,
      addRemark, updateRemark, deleteRemark,
      deleteDuplicateLead, mergeDuplicateLead,
      addMeetingRemark, addLoginUpdate,
      addFollowUpReminder, deleteFollowUpReminder, markFollowUpDone,
    }}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const ctx = useContext(CRMContext);
  if (!ctx) throw new Error('useCRM must be used within CRMProvider');
  return ctx;
}