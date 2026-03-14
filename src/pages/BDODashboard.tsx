import { useState, useMemo } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import DashboardLayout, { LayoutDashboard, Calendar } from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import DateRangeFilter from '@/components/DateRangeFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Meeting, BDOStatus, WalkingStatus } from '@/types/crm';
import { ArrowLeft, Eye, User, Phone, Calendar as CalendarIcon, MapPin, Building, Briefcase, IndianRupee, FileText, CheckCircle2, XCircle, Clock, Users } from 'lucide-react';

const navItems = [
  { label: 'Pending Meetings', icon: <LayoutDashboard className="w-4 h-4" />, id: 'pending' },
  { label: 'All Meetings', icon: <Calendar className="w-4 h-4" />, id: 'all' },
];

export default function BDODashboard() {
  const { currentUser, leads, users, meetings, updateMeeting } = useCRM();
  const [activeTab, setActiveTab] = useState('pending');
  const [detailView, setDetailView] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [infoMeeting, setInfoMeeting] = useState<Meeting | null>(null);
  const [walkinDateInput, setWalkinDateInput] = useState('');

  // Only show meetings assigned to this BDO (bdoId === currentUser.id)
  const allBdoMeetings = useMemo(() => {
    let filtered = meetings.filter(m => m.bdoId === currentUser?.id);
    if (fromDate) filtered = filtered.filter(m => m.date >= fromDate.toISOString().split('T')[0]);
    if (toDate) filtered = filtered.filter(m => m.date <= toDate.toISOString().split('T')[0]);
    return filtered;
  }, [meetings, currentUser, fromDate, toDate]);

  // Pending = assigned by BDM with status 'Pending' but no BDO action yet
  const pendingMeetings = allBdoMeetings.filter(m => m.status === 'Pending' && (!m.bdoStatus || m.bdoStatus.length === 0));
  const convertedByBDM = allBdoMeetings.filter(m => m.bdoStatus === 'Converted by BDM');
  const followUpMeetings = allBdoMeetings.filter(m => m.bdoStatus === 'Follow-up');
  const walkingDone = allBdoMeetings.filter(m => m.walkingStatus === 'Walking Done');
  const walkingInvalid = allBdoMeetings.filter(m => m.walkingStatus === 'Invalid');
  const totalConverted = allBdoMeetings.filter(m => m.bdoStatus === 'Converted by BDM' || m.walkingStatus === 'Walking Done');

  const handleConvertedByBDM = async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleSaveConversion = async (miniLogin: boolean, fullLogin: boolean) => {
    if (!selectedMeeting) return;
    await updateMeeting(selectedMeeting.id, {
      bdoStatus: 'Converted by BDM',
      miniLogin,
      fullLogin,
      bdoId: currentUser?.id,
    });
    setSelectedMeeting(null);
    toast.success('Meeting marked as Converted by BDM');
  };

  const handleFollowUp = async (meetingId: string) => {
    await updateMeeting(meetingId, {
      bdoStatus: 'Follow-up',
      bdoId: currentUser?.id,
    });
    toast.success('Meeting marked as Follow-up');
  };

  const handleSetWalkinDate = async (meetingId: string, date: string) => {
    if (!date) { toast.error('Select a date'); return; }
    await updateMeeting(meetingId, { walkinDate: date });
    toast.success('Walking date set');
  };

  const handleWalkingDone = async (meeting: Meeting) => {
    setSelectedMeeting(meeting);
  };

  const handleSaveWalkingConversion = async (miniLogin: boolean, fullLogin: boolean) => {
    if (!selectedMeeting) return;
    await updateMeeting(selectedMeeting.id, {
      walkingStatus: 'Walking Done',
      bdoStatus: 'Converted by BDM',
      miniLogin,
      fullLogin,
    });
    setSelectedMeeting(null);
    toast.success('Walking completed and converted');
  };

  const handleWalkingInvalid = async (meetingId: string) => {
    await updateMeeting(meetingId, { walkingStatus: 'Invalid' });
    toast.success('Walking marked as invalid');
  };

  const getDetailMeetings = () => {
    switch (detailView) {
      case 'pending': return pendingMeetings;
      case 'converted': return convertedByBDM;
      case 'followup': return followUpMeetings;
      case 'walking_done': return walkingDone;
      case 'walking_invalid': return walkingInvalid;
      case 'total_converted': return totalConverted;
      default: return [];
    }
  };

  const detailTitle: Record<string, string> = {
    pending: 'Pending Meetings', converted: 'Converted by BDM', followup: 'Follow-up',
    walking_done: 'Walking Done', walking_invalid: 'Walking Invalid', total_converted: 'Total Converted',
  };

  const renderMeetingRow = (m: Meeting, showActions = false) => {
    const lead = leads.find(l => l.id === m.leadId);

    return (
      <TableRow key={m.id} className="hover:bg-muted/50 transition-colors">
        <TableCell>
          <span className="font-medium text-sm flex items-center gap-1.5 text-foreground">
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            {new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-sm flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            {m.timeSlot}
          </span>
        </TableCell>
        <TableCell>
          <span className="font-semibold text-foreground text-sm">{m.clientName || lead?.clientName || 'Unknown'}</span>
        </TableCell>
        <TableCell>
          <span className="text-sm flex items-center gap-1.5 text-muted-foreground">
            <Phone className="w-3.5 h-3.5" /> {lead?.phoneNumber || '—'}
          </span>
        </TableCell>
        <TableCell>
          <span className="font-semibold text-primary text-sm flex items-center gap-1">
            <IndianRupee className="w-3.5 h-3.5"/>
            {(lead?.loanRequirement || 0).toLocaleString()}
          </span>
        </TableCell>
        {showActions && (
          <TableCell className="text-right pr-6">
            <Button size="sm" variant="outline" className="h-8 text-xs flex items-center justify-center gap-1.5 bg-background shadow-sm hover:bg-secondary/50 ml-auto" onClick={() => setInfoMeeting(m)}>
              <Eye className="w-3.5 h-3.5 text-primary" /> View Details
            </Button>
          </TableCell>
        )}
      </TableRow>
    );
  };

  return (
    <DashboardLayout navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'pending' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">BDO Dashboard</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage post-meeting conversions and follow-ups</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />

          {detailView ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setDetailView(null)}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
                <h3 className="text-lg font-semibold">{detailTitle[detailView]} ({getDetailMeetings().length})</h3>
              </div>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b-2">
                        <TableHead>Client Details</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Requirement</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getDetailMeetings().map(m => renderMeetingRow(m, true))}
                      {getDetailMeetings().length === 0 && (
                        <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No meetings</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Pending Meetings" value={pendingMeetings.length} variant="info" onClick={() => setDetailView('pending')} />
                <StatCard label="Converted by BDM" value={convertedByBDM.length} variant="primary" onClick={() => setDetailView('converted')} />
                <StatCard label="Follow-up" value={followUpMeetings.length} variant="accent" onClick={() => setDetailView('followup')} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Walking Done" value={walkingDone.length} variant="primary" onClick={() => setDetailView('walking_done')} />
                <StatCard label="Walking Invalid" value={walkingInvalid.length} variant="destructive" onClick={() => setDetailView('walking_invalid')} />
                <StatCard label="Total Converted" value={totalConverted.length} variant="accent" onClick={() => setDetailView('total_converted')} />
              </div>

              {/* Pending meetings with actions */}
              <Card>
                <CardHeader><CardTitle className="text-base">Pending Meetings ({pendingMeetings.length})</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 border-b-2">
                        <TableHead>Client Details</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Requirement</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right pr-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingMeetings.map(m => renderMeetingRow(m, true))}
                      {pendingMeetings.length === 0 && (
                        <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No pending meetings</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Follow-up meetings with walking date actions */}
              {followUpMeetings.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-base">Follow-up Meetings ({followUpMeetings.length})</CardTitle></CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 border-b-2">
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Loan Amount</TableHead>
                          <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {followUpMeetings.map(m => renderMeetingRow(m, true))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-display font-bold">All Meetings</h2>
            <p className="text-sm text-muted-foreground mt-1">Complete meeting history with BDO updates</p>
          </div>
          <DateRangeFilter fromDate={fromDate} toDate={toDate} onFromChange={setFromDate} onToChange={setToDate} onClear={() => { setFromDate(undefined); setToDate(undefined); }} />
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 border-b-2">
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBdoMeetings.map(m => renderMeetingRow(m, true))}
                  {allBdoMeetings.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No meetings</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conversion Dialog for Mini/Full Login */}
      <ConversionDialog
        open={!!selectedMeeting}
        onClose={() => setSelectedMeeting(null)}
        onSave={selectedMeeting?.bdoStatus === 'Follow-up' || selectedMeeting?.walkingStatus ? handleSaveWalkingConversion : handleSaveConversion}
        title={selectedMeeting?.bdoStatus === 'Follow-up' ? 'Walking Done — Conversion Details' : 'Converted by BDM — Login Details'}
      />

      {/* Info Dialog */}
      <MeetingDetailDialog
        isOpen={!!infoMeeting}
        meeting={infoMeeting}
        onClose={() => setInfoMeeting(null)}
        onHandleConverted={handleConvertedByBDM}
        onHandleFollowUp={handleFollowUp}
        onHandleSetWalkinDate={handleSetWalkinDate}
        onHandleWalkingDone={handleWalkingDone}
        onHandleWalkingInvalid={handleWalkingInvalid}
      />
    </DashboardLayout>
  );
}

function ConversionDialog({ open, onClose, onSave, title }: { open: boolean; onClose: () => void; onSave: (mini: boolean, full: boolean) => void; title: string }) {
  const [miniLogin, setMiniLogin] = useState(false);
  const [fullLogin, setFullLogin] = useState(false);

  const handleSave = () => {
    onSave(miniLogin, fullLogin);
    setMiniLogin(false);
    setFullLogin(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Mini Login</Label>
            <Switch checked={miniLogin} onCheckedChange={setMiniLogin} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Full Login</Label>
            <Switch checked={fullLogin} onCheckedChange={setFullLogin} />
          </div>
          <Button onClick={handleSave} className="w-full">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MeetingDetailDialog({ 
  meeting, 
  isOpen, 
  onClose,
  onHandleConverted,
  onHandleFollowUp,
  onHandleSetWalkinDate,
  onHandleWalkingDone,
  onHandleWalkingInvalid
}: { 
  meeting: Meeting | null; 
  isOpen: boolean; 
  onClose: () => void;
  onHandleConverted: (m: Meeting) => void;
  onHandleFollowUp: (id: string) => void;
  onHandleSetWalkinDate: (id: string, date: string) => void;
  onHandleWalkingDone: (m: Meeting) => void;
  onHandleWalkingInvalid: (id: string) => void;
}) {
  const { leads, users } = useCRM();
  const [walkinDateInput, setWalkinDateInput] = useState('');

  if (!meeting) return null;
  const lead = leads.find(l => l.id === meeting.leadId);
  const tc = users.find(u => u.id === meeting.tcId);
  const bo = users.find(u => u.id === meeting.boId);
  const bdm = users.find(u => u.id === meeting.bdmId);
  const isPending = meeting.status === 'Pending' && (!meeting.bdoStatus || meeting.bdoStatus.length === 0);
  const isFollowUp = meeting.bdoStatus === 'Follow-up';

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-border shadow-xl">
        <div className="bg-primary/5 p-6 border-b border-border/50 flex items-center justify-between relative">
          <div className="flex items-center gap-5">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0 shadow-sm ml-2">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-display font-bold text-foreground">
                {meeting.clientName || lead?.clientName || 'Unknown Client'}
              </DialogTitle>
              <div className="flex items-center gap-5 mt-2 text-sm text-muted-foreground font-medium">
                <span className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-primary/70" /> {lead?.phoneNumber || '—'}</span>
                <span className="flex items-center gap-1.5"><CalendarIcon className="h-4 w-4 text-primary/70" /> {meeting.date} at {meeting.timeSlot}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            {isPending && (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="border border-border" onClick={() => onHandleFollowUp(meeting.id)}>Follow-up</Button>
                <Button size="sm" onClick={() => { onClose(); onHandleConverted(meeting); }}>Converted by BDM</Button>
              </div>
            )}
            {isFollowUp && !meeting.walkingStatus && (
              <div className="flex gap-2 items-center bg-background/50 p-1.5 rounded-lg border border-border/50">
                {!meeting.walkinDate ? (
                  <>
                    <Input
                      type="date"
                      className="h-8 w-36 text-sm"
                      value={walkinDateInput}
                      onChange={e => setWalkinDateInput(e.target.value)}
                    />
                    <Button size="sm" variant="secondary" onClick={() => { onHandleSetWalkinDate(meeting.id, walkinDateInput); setWalkinDateInput(''); }}>Set Walk-in</Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold mr-2 ml-1 text-primary flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" /> Walk: {meeting.walkinDate}</span>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { onClose(); onHandleWalkingDone(meeting); }}>Walk Done</Button>
                    <Button size="sm" variant="destructive" onClick={() => { onClose(); onHandleWalkingInvalid(meeting.id); }}>Invalid</Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6">
          {/* Requirement & Product */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><IndianRupee className="w-4 h-4 text-primary/80"/> Required Amount</p>
              <p className="text-2xl font-bold text-primary">₹{(lead?.loanRequirement || 0).toLocaleString()}</p>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-primary/80"/> Product Type</p>
              <p className="text-lg font-semibold text-foreground">{meeting.productType || '—'}</p>
            </div>
            <div className="bg-card border border-border/60 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Building className="w-4 h-4 text-primary/80"/> Meeting Type</p>
              {meeting.meetingType ? <Badge variant="secondary" className="px-3 py-1 text-sm bg-secondary/50">{meeting.meetingType}</Badge> : <p className="text-lg font-semibold text-muted-foreground">—</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Extended Details Grid */}
            <div className="space-y-4 bg-muted/20 border border-border/50 rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary"/> Location & Assets</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Location</p>
                  <p className="text-sm font-semibold text-foreground">{meeting.location || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">State</p>
                  <p className="text-sm font-semibold text-foreground">{meeting.state || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Final Req.</p>
                  <p className="text-sm font-semibold text-foreground">{meeting.finalRequirement != null ? `₹${meeting.finalRequirement.toLocaleString()}` : '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Collateral Value</p>
                  <p className="text-sm font-semibold text-foreground">{meeting.collateralValue != null ? `₹${meeting.collateralValue.toLocaleString()}` : '—'}</p>
                </div>
              </div>
            </div>

            {/* Team alignment */}
            <div className="space-y-4 bg-muted/20 border border-border/50 rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground border-b border-border/50 pb-2 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-primary"/> Team Alignment</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-6 text-center text-xs font-bold text-muted-foreground bg-secondary rounded py-0.5">TC</div> <span className="text-sm font-semibold">{tc?.name || '—'}</span></div>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2"><div className="w-6 text-center text-xs font-bold text-muted-foreground bg-secondary rounded py-0.5">BO</div> <span className="text-sm font-semibold">{bo?.name || '—'}</span></div>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2"><div className="w-6 text-center text-xs font-bold text-muted-foreground bg-secondary rounded py-0.5">BDM</div> <span className="text-sm font-semibold">{bdm?.name || '—'}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Status block */}
          <div className="bg-primary/5 rounded-xl p-5 border border-primary/10">
            <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary"/> Status Tracking</h3>
            <div className="grid grid-cols-4 gap-4">
               <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Lead Status</p>
                  <span className="text-sm font-semibold">{lead?.leadStatus || '—'}</span>
               </div>
               <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Meeting Status</p>
                  <Badge variant={meeting.status === 'Converted' ? 'default' : 'outline'} className="shadow-sm">{meeting.status}</Badge>
               </div>
               <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">BDO Status</p>
                  {meeting.bdoStatus ? <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 shadow-sm">{meeting.bdoStatus}</Badge> : <span className="text-sm font-medium text-muted-foreground">—</span>}
               </div>
               <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Logins</p>
                  <div className="flex flex-col gap-1.5 items-start">
                    {meeting.miniLogin && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 shadow-sm">Mini Login</Badge>}
                    {meeting.fullLogin && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shadow-sm">Full Login</Badge>}
                    {!meeting.miniLogin && !meeting.fullLogin && <span className="text-sm font-medium text-muted-foreground">—</span>}
                  </div>
               </div>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
