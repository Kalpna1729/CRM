import { useMemo, useState } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { Meeting } from '@/types/crm';

interface Props {
  meeting: Meeting | null;
  isOpen: boolean;
  onClose: () => void;
}

const GOLD  = '#C8951A';
const DARK  = '#1A1506';
const GREEN = '#2D6A4F';
const RED   = '#C0392B';
const BLUE  = '#1A4A8A';

const RS: Record<string, { bg: string; text: string }> = {
  FM:  { bg: '#FDF2E0', text: '#8A5C10' },
  TC:  { bg: '#E8F0FB', text: '#1A4A8A' },
  BDM: { bg: '#EAF5EE', text: '#2D6A4F' },
  BO:  { bg: '#F0EAF8', text: '#6A2D8A' },
  BDO: { bg: '#F5E8FB', text: '#8A2D6A' },
  FO:  { bg: '#FBE8E8', text: '#8A2D2D' },
  RM:  { bg: '#E8F5F8', text: '#1A6A7A' },
};

const ROLE_LABELS: Record<string, string> = {
  BO: 'Business Officer', TC: 'Team Coordinator', BDM: 'Business Dev Manager',
  BDO: 'Business Dev Officer', FO: 'Field Officer', RM: 'Relationship Manager',
};

const CASE_STAGES = ['Login', 'Document', 'Valuation', 'Legal', 'Sanction', 'Disbursed'];

const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const fmtDT = (d: string) =>
  new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const daysSince = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

type StepState = 'done' | 'active' | 'failed' | 'pending';
interface Step { label: string; detail: string; who?: string; whoRole?: string; when?: string | null; state: StepState; note?: string; }

export default function CaseTrackingModal({ meeting, isOpen, onClose }: Props) {
  const { leads, users, teams, meetingRemarks, loginHistory, leadRemarks, followUpReminders } = useCRM();
  const [remarkTab, setRemarkTab] = useState<'meeting' | 'lead'>('meeting');

  // All hooks before early return
  const mRemarks = useMemo(() =>
    !meeting ? [] : meetingRemarks.filter(r => r.meetingId === meeting.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [meeting, meetingRemarks]);

  const lRemarks = useMemo(() =>
    !meeting ? [] : leadRemarks.filter(r => r.leadId === meeting.leadId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [meeting, leadRemarks]);

  const logins = useMemo(() =>
    !meeting ? [] : loginHistory.filter(h => h.meetingId === meeting.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [meeting, loginHistory]);

  const reminders = useMemo(() =>
    !meeting ? [] : followUpReminders.filter(r => r.leadId === meeting.leadId),
    [meeting, followUpReminders]);

  if (!isOpen || !meeting) return null;

  const today = new Date().toISOString().split('T')[0];
  const lead  = leads.find(l => l.id === meeting.leadId);
  const bo    = users.find(u => u.id === meeting.boId);
  const tc    = users.find(u => u.id === meeting.tcId);
  const bdm   = users.find(u => u.id === meeting.bdmId);
  const bdo   = users.find(u => u.id === meeting.bdoId);
  const fo    = users.find(u => u.id === meeting.foId);
  const rm    = users.find(u => u.id === meeting.rmId);
  const team  = teams.find(t => t.boIds.includes(meeting.boId));

  // Build steps
  const isRejected  = meeting.status === 'Reject' || meeting.status === 'Not Done';
  const isMtgDone   = !['Scheduled', 'Pending', 'Reschedule Requested'].includes(meeting.status);
  const bdoActive   = isMtgDone && !isRejected;
  const bdoDone     = ['Walk-in Done', 'Converted', 'Converted by BDM'].includes(meeting.bdoStatus || '');
  const bdoConverted= ['Converted', 'Converted by BDM'].includes(meeting.bdoStatus || '');
  const walkinSent  = meeting.bdoStatus === 'Walk-in Done';
  const foVerified  = meeting.walkingStatus === 'Walking Done';
  const foInvalid   = meeting.walkingStatus === 'Invalid';

  const steps: Step[] = [
    {
      label: 'Lead Assigned',
      detail: `${bo?.name || '—'} · ${team?.name || ''}`,
      who: bo?.name, whoRole: 'BO', state: 'done',
    },
    {
      label: 'Meeting Scheduled',
      detail: `${fmtDate(meeting.date)} · ${meeting.timeSlot}${meeting.meetingType ? ' · ' + meeting.meetingType : ''}`,
      who: bdm?.name, whoRole: 'BDM', when: meeting.date, state: 'done',
    },
    {
      label: 'Meeting Conducted',
      detail: meeting.status,
      who: bdm?.name, whoRole: 'BDM',
      state: isRejected ? 'failed' : isMtgDone ? 'done' : 'active',
    },
  ];

  if (!isRejected) {
    steps.push({
      label: bdoConverted ? 'Converted by BDM' : 'BDO Follow-up',
      detail: meeting.bdoStatus || 'Awaiting BDO action',
      who: bdo?.name, whoRole: 'BDO',
      state: bdoDone ? 'done' : bdoActive ? 'active' : 'pending',
    });

    if (!bdoConverted) {
      steps.push({
        label: 'Walk-in Scheduled',
        detail: meeting.walkinDate ? fmtDate(meeting.walkinDate) : 'Date not set',
        who: bdo?.name, whoRole: 'BDO', when: meeting.walkinDate,
        state: walkinSent || foVerified || foInvalid ? 'done' : bdoDone ? 'active' : 'pending',
        note: meeting.walkinDate && meeting.walkinDate < today && !meeting.walkingStatus ? 'Overdue' : undefined,
      });

      steps.push({
        label: 'Field Officer Verification',
        detail: foVerified ? 'Valid — Approved for login' : foInvalid ? 'Invalid — Walk-in rejected' : walkinSent ? 'Pending FO check' : 'Waiting',
        who: fo?.name, whoRole: 'FO',
        state: foVerified ? 'done' : foInvalid ? 'failed' : walkinSent ? 'active' : 'pending',
      });

      if (!foInvalid) {
        steps.push({
          label: 'Mini Login',
          detail: meeting.miniLogin ? `Completed · ${fmtDate(meeting.miniLoginDate)}` : foVerified ? 'Pending' : 'Waiting',
          who: fo?.name, whoRole: 'FO', when: meeting.miniLoginDate,
          state: meeting.miniLogin ? 'done' : foVerified ? 'active' : 'pending',
        });

        steps.push({
          label: 'Full Login',
          detail: meeting.fullLogin ? `Completed · ${fmtDate(meeting.fullLoginDate)}` : meeting.miniLogin ? 'Pending' : 'Waiting',
          who: rm?.name || fo?.name, whoRole: rm ? 'RM' : 'FO', when: meeting.fullLoginDate,
          state: meeting.fullLogin ? 'done' : meeting.miniLogin ? 'active' : 'pending',
        });

        if (meeting.miniLogin || meeting.fullLogin) {
          steps.push({
            label: 'Case Processing',
            detail: meeting.caseStage || 'RM review pending',
            who: rm?.name, whoRole: 'RM',
            state: meeting.caseStage === 'Disbursed' ? 'done'
                 : meeting.caseStage === 'Rejected'  ? 'failed'
                 : meeting.caseStage ? 'active' : 'pending',
            note: meeting.rmPriority ? `${meeting.rmPriority} Priority` : undefined,
          });
        }
      }
    }
  }

  const doneCnt = steps.filter(s => s.state === 'done').length;
  const pct     = Math.round((doneCnt / steps.length) * 100);

  const allTs   = [...mRemarks.map(r => r.createdAt), ...logins.map(h => h.createdAt),
    meeting.miniLoginDate, meeting.fullLoginDate, meeting.walkinDate].filter(Boolean) as string[];
  const lastTs  = allTs.sort().reverse()[0];
  const stuck   = lastTs ? daysSince(lastTs) : null;

  const people  = [
    { role: 'BO', user: bo }, { role: 'TC', user: tc }, { role: 'BDM', user: bdm },
    { role: 'BDO', user: bdo }, { role: 'FO', user: fo }, { role: 'RM', user: rm },
  ].filter(p => p.user);

  const sc = (s: StepState) => s === 'done' ? GREEN : s === 'active' ? GOLD : s === 'failed' ? RED : '#c8bfa8';
  const sb = (s: StepState) => s === 'done' ? '#EAF5EE' : s === 'active' ? '#FDF8EE' : s === 'failed' ? '#FDECEA' : '#FAF9F7';

  return (
    <>
      <style>{`
        .ctm-ov{position:fixed;inset:0;z-index:9999;background:rgba(26,21,6,0.55);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:20px;animation:cov .18s ease;}
        @keyframes cov{from{opacity:0}to{opacity:1}}
        .ctm-box{width:100%;max-width:860px;max-height:90vh;background:#FFFDF7;border-radius:16px;border:1px solid #E8D9B0;box-shadow:0 20px 60px rgba(26,21,6,0.15);display:flex;flex-direction:column;overflow:hidden;animation:csl .22s cubic-bezier(.22,1,.36,1);}
        @keyframes csl{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        .ctm-sc{overflow-y:auto;flex:1;}
        .ctm-sc::-webkit-scrollbar{width:4px;}
        .ctm-sc::-webkit-scrollbar-thumb{background:#E8D9B0;border-radius:4px;}
        .ctm-hr{border:none;border-top:1px solid #F0E8D0;margin:0;}
        .ctm-sh{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#b5a88a;padding:20px 28px 10px;}
        .ctm-step{display:flex;gap:14px;}
        .ctm-track{display:flex;flex-direction:column;align-items:center;width:28px;flex-shrink:0;}
        .ctm-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
        .ctm-line{width:1.5px;flex:1;min-height:14px;}
        .ctm-sb{flex:1;padding:3px 0 22px;}
        .ctm-sl{font-size:13px;font-weight:700;color:#1A1506;margin-bottom:2px;}
        .ctm-sl.p{color:#c8bfa8;font-weight:500;}
        .ctm-sd{font-size:11px;color:#8a7a5a;margin-bottom:4px;}
        .ctm-sm{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
        .ctm-who{font-size:10px;font-weight:600;padding:2px 9px;border-radius:20px;}
        .ctm-when{font-size:10px;color:#a09070;font-family:monospace;}
        .ctm-note{font-size:10px;font-weight:600;padding:2px 8px;border-radius:20px;}
        .ctm-pg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:0 28px 20px;}
        .ctm-pc{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:#FAF9F7;border:1px solid #EDE3CC;}
        .ctm-av{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;}
        .ctm-rt{font-size:9px;font-weight:700;padding:1px 7px;border-radius:20px;}
        .ctm-rr{padding:11px 0;border-bottom:1px solid #F5EDD8;}
        .ctm-rr:last-child{border-bottom:none;}
        .ctm-lr{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F5EDD8;}
        .ctm-lr:last-child{border-bottom:none;}
        .ctm-tb{padding:5px 12px;border-radius:7px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:all .15s;background:transparent;color:#a09070;}
        .ctm-tb.a{background:${GOLD}18;color:${GOLD};border-color:${GOLD}30;}
        .ctm-rmr{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #F5EDD8;}
        .ctm-rmr:last-child{border-bottom:none;}
        .ctm-cl{width:30px;height:30px;border-radius:8px;border:1px solid #E8D9B0;background:#FAF9F7;color:#8a7a5a;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ctm-cl:hover{background:#FDECEA;color:${RED};}
      `}</style>

      <div className="ctm-ov" onClick={onClose}>
        <div className="ctm-box" onClick={e => e.stopPropagation()}>

          {/* HEADER */}
          <div style={{ padding: '22px 28px 18px', borderBottom: '1px solid #F0E8D0', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: DARK, margin: 0 }}>{lead?.clientName || '—'}</h2>
                  {stuck !== null && stuck >= 5 && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: '#FDECEA', color: RED }}>
                      Stuck {stuck}d
                    </span>
                  )}
                  {meeting.rmPriority && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: meeting.rmPriority === 'High' ? '#FDECEA' : meeting.rmPriority === 'Medium' ? '#FDF8EE' : '#EAF0FB', color: meeting.rmPriority === 'High' ? RED : meeting.rmPriority === 'Medium' ? GOLD : BLUE }}>
                      {meeting.rmPriority} Priority
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {[lead?.phoneNumber, lead?.loanRequirement && `Rs. ${lead.loanRequirement}`, lead?.requirementType, team?.name, lastTs && (stuck === 0 ? 'Active today' : `Last activity ${stuck}d ago`)].filter(Boolean).map((v, i) => (
                    <span key={i} style={{ fontSize: 11, color: '#8a7a5a' }}>{v}</span>
                  ))}
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 4, background: '#EDE3CC', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${GOLD},${GREEN})`, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, color: '#a09070', fontFamily: 'monospace', flexShrink: 0 }}>{pct}%</span>
                </div>
              </div>
              <button className="ctm-cl" onClick={onClose}>✕</button>
            </div>
          </div>

          <div className="ctm-sc">

            {/* JOURNEY */}
            <div className="ctm-sh">Case Journey</div>
            <div style={{ padding: '0 28px' }}>
              {steps.map((step, idx) => {
                const isLast = idx === steps.length - 1;
                const color  = sc(step.state);
                const rs     = step.whoRole ? RS[step.whoRole] : null;
                const dot    = step.state === 'done' ? '✓' : step.state === 'failed' ? '✕' : String(idx + 1);
                return (
                  <div key={idx} className="ctm-step">
                    <div className="ctm-track">
                      <div className="ctm-dot" style={{ background: sb(step.state), color, border: `2px solid ${color}44` }}>{dot}</div>
                      {!isLast && <div className="ctm-line" style={{ background: step.state === 'done' ? `${GREEN}35` : '#EDE3CC' }} />}
                    </div>
                    <div className="ctm-sb">
                      <div className={`ctm-sl ${step.state === 'pending' ? 'p' : ''}`}>{step.label}</div>
                      <div className="ctm-sd">{step.detail}</div>
                      <div className="ctm-sm">
                        {step.who && rs && <span className="ctm-who" style={{ background: rs.bg, color: rs.text }}>{step.who} · {step.whoRole}</span>}
                        {step.when && <span className="ctm-when">{fmtDate(step.when)}</span>}
                        {step.note && (
                          <span className="ctm-note" style={{ background: step.note.includes('Priority') ? '#FDF8EE' : '#FDECEA', color: step.note.includes('Priority') ? GOLD : RED }}>
                            {step.note}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RM STAGE BAR */}
            {meeting.caseStage && meeting.caseStage !== 'Rejected' && (
              <>
                <hr className="ctm-hr" />
                <div className="ctm-sh">RM Case Stage</div>
                <div style={{ padding: '0 28px 20px', display: 'flex', gap: 4 }}>
                  {CASE_STAGES.map((s, i) => {
                    const si = CASE_STAGES.indexOf(meeting.caseStage || '');
                    const done = i < si; const active = i === si;
                    return (
                      <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ height: 5, borderRadius: 3, background: done ? GREEN : active ? GOLD : '#EDE3CC', marginBottom: 5 }} />
                        <span style={{ fontSize: 9, fontWeight: active ? 700 : 400, color: done ? GREEN : active ? GOLD : '#c8bfa8', fontFamily: 'monospace' }}>{s}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* TEAM */}
            {people.length > 0 && (
              <>
                <hr className="ctm-hr" />
                <div className="ctm-sh">Case Team</div>
                <div className="ctm-pg">
                  {people.map(({ role, user }) => {
                    const rs = RS[role] || { bg: '#FAF9F7', text: '#8a7a5a' };
                    return (
                      <div key={role} className="ctm-pc">
                        <div className="ctm-av" style={{ background: rs.bg, color: rs.text }}>{user?.name?.[0]}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                          <span className="ctm-rt" style={{ background: rs.bg, color: rs.text }}>{ROLE_LABELS[role] || role}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* LOGIN HISTORY */}
            {logins.length > 0 && (
              <>
                <hr className="ctm-hr" />
                <div className="ctm-sh">Login History</div>
                <div style={{ padding: '0 28px 4px' }}>
                  {logins.map(h => {
                    const u = users.find(x => x.id === h.createdBy || x.name === h.createdBy);
                    const rs = u?.role ? RS[u.role] : null;
                    return (
                      <div key={h.id} className="ctm-lr">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: DARK }}>{h.loginType}</span>
                          {rs && <span className="ctm-rt" style={{ background: rs.bg, color: rs.text }}>{u?.role}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#8a7a5a' }}>{u?.name || h.createdBy}</span>
                          <span style={{ fontSize: 10, color: '#a09070', fontFamily: 'monospace' }}>{fmtDT(h.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* REMARKS */}
            <hr className="ctm-hr" />
            <div style={{ padding: '18px 28px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#b5a88a' }}>Remarks</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className={`ctm-tb ${remarkTab === 'meeting' ? 'a' : ''}`} onClick={() => setRemarkTab('meeting')}>Meeting ({mRemarks.length})</button>
                <button className={`ctm-tb ${remarkTab === 'lead' ? 'a' : ''}`} onClick={() => setRemarkTab('lead')}>Lead ({lRemarks.length})</button>
              </div>
            </div>
            <div style={{ padding: '0 28px 8px' }}>
              {(remarkTab === 'meeting' ? mRemarks : lRemarks).length === 0
                ? <div style={{ fontSize: 12, color: '#c8bfa8', padding: '8px 0 20px', fontStyle: 'italic' }}>No remarks yet</div>
                : (remarkTab === 'meeting' ? mRemarks : lRemarks).map(r => {
                  const u = users.find(x => x.id === r.createdBy || x.name === r.createdBy);
                  const rs = u?.role ? RS[u.role] : null;
                  return (
                    <div key={r.id} className="ctm-rr">
                      <div style={{ fontSize: 12, color: '#3a2e18', lineHeight: 1.55, marginBottom: 5 }}>{r.remark}</div>
                      <div style={{ fontSize: 10, color: '#a09070', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span>{u?.name || r.createdBy}</span>
                        {rs && <span className="ctm-rt" style={{ background: rs.bg, color: rs.text }}>{u?.role}</span>}
                        <span>{fmtDT(r.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* REMINDERS */}
            {reminders.length > 0 && (
              <>
                <hr className="ctm-hr" />
                <div className="ctm-sh">Follow-up Reminders</div>
                <div style={{ padding: '0 28px 20px' }}>
                  {reminders.sort((a, b) => a.reminderDate.localeCompare(b.reminderDate)).map(r => {
                    const overdue = r.reminderDate < today && !r.isDone;
                    const isToday = r.reminderDate === today && !r.isDone;
                    const u = users.find(x => x.id === r.createdBy || x.name === r.createdBy);
                    const tc = r.isDone ? GREEN : overdue ? RED : isToday ? GOLD : '#8a7a5a';
                    return (
                      <div key={r.id} className="ctm-rmr">
                        <div>
                          <div style={{ fontSize: 12, color: DARK, fontWeight: 500, marginBottom: 2 }}>{r.remark}</div>
                          <div style={{ fontSize: 10, color: '#a09070' }}>{fmtDate(r.reminderDate)} · {u?.name || r.createdBy}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: `${tc}15`, color: tc, flexShrink: 0 }}>
                          {r.isDone ? 'Done' : overdue ? 'Overdue' : isToday ? 'Today' : 'Upcoming'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}