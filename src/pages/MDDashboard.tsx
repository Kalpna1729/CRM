import { useState, useEffect } from 'react';
import { useCRM } from '@/contexts/CRMContext';

type Theme = 'dark' | 'light';

export default function MDDashboard() {
  const {
    currentUser, users, leads, meetings, teams, logout,
  } = useCRM();

  const [theme, setTheme] = useState<Theme>('light');
  const [clock, setClock] = useState('');

  const isDark = theme === 'dark';

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(`${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')} ${n.getHours() >= 12 ? 'PM' : 'AM'}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const today = new Date().toISOString().split('T')[0];

  // Stats
  const totalMeetings = meetings.length;
  const scheduledMeetings = meetings.filter(m => m.status === 'Scheduled').length;
  const doneMeetings = meetings.filter(m => m.status === 'Meeting Done').length;
  const rejectedMeetings = meetings.filter(m => m.status === 'Reject').length;
  const pendingMeetings = meetings.filter(m => m.status === 'Pending').length;
  const walkinDone = meetings.filter(m => m.walkingStatus === 'Walking Done').length;
  const miniLogin = meetings.filter(m => m.miniLogin).length;
  const fullLogin = meetings.filter(m => m.fullLogin).length;
  const convertedMeetings = meetings.filter(m => m.status === 'Converted').length;
  const totalLeads = leads.length;
  const totalUsers = users.filter(u => u.active).length;
  const todayMeetings = meetings.filter(m => m.date === today).length;

  const statCards = [
    { label: 'Total Meetings', val: totalMeetings, color: '#3d7fff', bg: 'rgba(61,127,255,0.1)' },
    { label: 'Scheduled', val: scheduledMeetings, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    { label: 'Meeting Done', val: doneMeetings, color: '#00d4aa', bg: 'rgba(0,212,170,0.1)' },
    { label: 'Pending', val: pendingMeetings, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Rejected', val: rejectedMeetings, color: '#ff4757', bg: 'rgba(255,71,87,0.1)' },
    { label: 'Walk-in Done', val: walkinDone, color: '#00d4aa', bg: 'rgba(0,212,170,0.1)' },
    { label: 'Mini Login', val: miniLogin, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Full Login', val: fullLogin, color: '#3d7fff', bg: 'rgba(61,127,255,0.1)' },
    { label: 'Converted', val: convertedMeetings, color: '#00d4aa', bg: 'rgba(0,212,170,0.1)' },
    { label: 'Total Leads', val: totalLeads, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    { label: 'Active Users', val: totalUsers, color: '#3d7fff', bg: 'rgba(61,127,255,0.1)' },
    { label: "Today's Meetings", val: todayMeetings, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark ? '#0f1117' : '#f4f6fb',
      color: isDark ? '#e8eaf0' : '#1a1d2e',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: isDark ? '#1a1d2e' : '#fff',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px' }}>MD Dashboard</div>
          <div style={{ fontSize: '11px', color: isDark ? '#8b8fa8' : '#6b7280' }}>Managing Director — Overview</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{clock}</span>
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')} style={{
            padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(128,128,128,0.3)',
            background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: '12px',
          }}>{isDark ? '☀ Light' : '🌙 Dark'}</button>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>{currentUser?.name}</div>
          <button onClick={logout} style={{
            padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(255,71,87,0.3)',
            background: 'rgba(255,71,87,0.08)', color: '#ff4757', cursor: 'pointer', fontSize: '12px',
          }}>Sign Out</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Date */}
        <div style={{ marginBottom: '20px', fontSize: '13px', color: isDark ? '#8b8fa8' : '#6b7280' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {statCards.map((s, i) => (
            <div key={i} style={{
              padding: '20px', borderRadius: '12px',
              background: isDark ? '#1a1d2e' : '#fff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
            }}>
              <div style={{ fontSize: '30px', fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '12px', color: isDark ? '#8b8fa8' : '#6b7280', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Team wise stats */}
        <div style={{
          background: isDark ? '#1a1d2e' : '#fff',
          borderRadius: '12px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          overflow: 'hidden',
          marginBottom: '24px',
        }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Team-wise Meeting Stats</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}>
                  {['Team', 'Total', 'Done', 'Pending', 'Rejected', 'Walk-in', 'Mini Login', 'Full Login', 'Converted'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: isDark ? '#8b8fa8' : '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams.map(team => {
                  const teamMeetings = meetings.filter(m => m.tcId === team.tcId || team.boIds.includes(m.boId));
                  return (
                    <tr key={team.id} style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'}` }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{team.name}</td>
                      <td style={{ padding: '12px 16px', color: '#3d7fff', fontWeight: 700 }}>{teamMeetings.length}</td>
                      <td style={{ padding: '12px 16px', color: '#00d4aa' }}>{teamMeetings.filter(m => m.status === 'Meeting Done').length}</td>
                      <td style={{ padding: '12px 16px', color: '#f59e0b' }}>{teamMeetings.filter(m => m.status === 'Pending').length}</td>
                      <td style={{ padding: '12px 16px', color: '#ff4757' }}>{teamMeetings.filter(m => m.status === 'Reject').length}</td>
                      <td style={{ padding: '12px 16px', color: '#00d4aa' }}>{teamMeetings.filter(m => m.walkingStatus === 'Walking Done').length}</td>
                      <td style={{ padding: '12px 16px', color: '#f59e0b' }}>{teamMeetings.filter(m => m.miniLogin).length}</td>
                      <td style={{ padding: '12px 16px', color: '#3d7fff' }}>{teamMeetings.filter(m => m.fullLogin).length}</td>
                      <td style={{ padding: '12px 16px', color: '#00d4aa' }}>{teamMeetings.filter(m => m.status === 'Converted').length}</td>
                    </tr>
                  );
                })}
                {teams.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: isDark ? '#8b8fa8' : '#6b7280' }}>No teams found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}