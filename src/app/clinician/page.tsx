'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const LAPIS = '#1D6296';
const YANKEES = '#12273C';

interface Patient {
  id: string;
  full_name_en: string;
  full_name_ar: string | null;
  created_at: string;
}

interface MoodLog { log_date: string; mood_score: number; energy_score: number; anxiety_score: number; }
interface Submission { id: string; total_score: number; severity_band: string; submitted_at: string; assessment_definitions: { code: string; name_en: string }; }
interface MedAlert { id: string; alert_type: string; severity: string | null; acknowledged_at: string | null; created_at: string; }

const BAND_COLOR: Record<string, string> = {
  Minimal: '#166534', Mild: '#92400e', Moderate: '#9a3412',
  'Moderately severe': '#7c2d12', Severe: '#991b1b', Unknown: '#6b7280',
};

function MoodBar({ logs }: { logs: MoodLog[] }) {
  if (!logs.length) return <span style={{ fontSize: 12, color: '#9ca3af' }}>No data</span>;
  const W = 120, H = 24;
  const n = Math.min(logs.length, 14);
  const recent = logs.slice(-n);
  const barW = Math.floor((W - 2) / n) - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: W, height: H, display: 'block' }}>
      {recent.map((l, i) => {
        const h = Math.max(2, (l.mood_score / 10) * (H - 2));
        const col = l.mood_score >= 7 ? '#16a34a' : l.mood_score >= 4 ? '#ca8a04' : '#dc2626';
        return <rect key={i} x={i * (barW + 1) + 1} y={H - h - 1} width={barW} height={h} rx={1} fill={col} opacity={.85} />;
      })}
    </svg>
  );
}

export default function ClinicianDashboard() {
  const [view, setView]       = useState<'dashboard'|'patients'|'patient'>('dashboard');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selected, setSelected] = useState<Patient|null>(null);
  const [patientMood, setPatientMood] = useState<MoodLog[]>([]);
  const [patientTab, setPatientTab] = useState<'overview'|'mood'|'assessments'|'alerts'|'summary'>('overview');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [alerts, setAlerts]   = useState<MedAlert[]>([]);
  const [moodMap, setMoodMap] = useState<Record<string, MoodLog[]>>({});
  const [clinician, setClinician] = useState<{ full_name_en: string; full_name_ar: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertCount, setAlertCount] = useState(0);
  const [aiSummary, setAiSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      const { data: prof } = await supabase.from('profiles').select('role, full_name_en, full_name_ar').eq('id', user.id).single();
      if (!prof || prof.role !== 'clinician') { router.push('/home'); return; }
      setClinician(prof);

      const { data: pts } = await supabase.from('profiles').select('id, full_name_en, full_name_ar, created_at').eq('assigned_clinician_id', user.id).eq('role', 'patient').order('full_name_en');
      const pList = pts ?? [];
      setPatients(pList);

      // Fetch recent mood logs for all patients
      if (pList.length > 0) {
        const from = new Date(); from.setDate(from.getDate() - 14);
        const ids = pList.map(p => p.id);
        const { data: ml } = await supabase.from('mood_logs').select('patient_id, log_date, mood_score, energy_score, anxiety_score')
          .in('patient_id', ids).gte('log_date', from.toISOString().split('T')[0]).order('log_date');
        const map: Record<string, MoodLog[]> = {};
        (ml ?? []).forEach((l: MoodLog & { patient_id: string }) => {
          if (!map[l.patient_id]) map[l.patient_id] = [];
          map[l.patient_id].push(l);
        });
        setMoodMap(map);

        // Count active alerts
        const { count } = await supabase.from('medication_alerts').select('id', { count: 'exact', head: true }).in('patient_id', ids).is('acknowledged_at', null);
        setAlertCount(count ?? 0);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function openPatient(p: Patient) {
    setSelected(p);
    setPatientTab('overview');
    setView('patient');
    const from = new Date(); from.setDate(from.getDate() - 30);
    const [{ data: ml }, { data: subs }, { data: al }] = await Promise.all([
      supabase.from('mood_logs').select('log_date, mood_score, energy_score, anxiety_score').eq('patient_id', p.id).gte('log_date', from.toISOString().split('T')[0]).order('log_date'),
      supabase.from('assessment_submissions').select('id, total_score, severity_band, submitted_at, assessment_definitions(code, name_en)').eq('patient_id', p.id).order('submitted_at', { ascending: false }).limit(8),
      supabase.from('medication_alerts').select('id, alert_type, severity, acknowledged_at, created_at').eq('patient_id', p.id).order('created_at', { ascending: false }).limit(5),
    ]);
    setPatientMood(ml ?? []);
    setSubmissions((subs as unknown as Submission[]) ?? []);
    setAlerts(al ?? []);
  }

  function MoodChartFull({ logs }: { logs: MoodLog[] }) {
    if (logs.length < 2) return <p style={{ fontSize: 13, color: '#9ca3af', padding: '20px 0', textAlign: 'center' }}>Not enough data yet</p>;
    const W = 320, H = 100, P = { t: 8, r: 10, b: 20, l: 24 };
    const pw = W - P.l - P.r, ph = H - P.t - P.b;
    const n = logs.length;
    const lines = [
      { vals: logs.map(l => l.mood_score),    color: LAPIS,    label: 'Mood' },
      { vals: logs.map(l => l.energy_score),  color: '#F3650A',label: 'Energy' },
      { vals: logs.map(l => l.anxiety_score), color: '#dc2626',label: 'Anxiety' },
    ];
    let svgH = '';
    [2,4,6,8,10].forEach(v => {
      const y = P.t + ph - ((v-1)/9) * ph;
      svgH += `<line x1="${P.l}" y1="${y.toFixed(1)}" x2="${W-P.r}" y2="${y.toFixed(1)}" stroke="#e5e7eb" stroke-width="0.5"/>`;
      svgH += `<text x="${P.l-3}" y="${(y+3).toFixed(1)}" text-anchor="end" font-size="7" fill="#9ca3af">${v}</text>`;
    });
    lines.forEach(({ vals, color }) => {
      let p = '';
      vals.forEach((v, i) => {
        const x = P.l + pw * i / (n-1), y = P.t + ph - ((v-1)/9) * ph;
        p += (i===0?'M':'L') + `${x.toFixed(1)},${y.toFixed(1)} `;
      });
      svgH += `<path d="${p.trim()}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
    });
    ['W1','W2','W3','W4','Now'].forEach((lbl, j) => {
      const i = [0,7,14,21,n-1][j] ?? n-1;
      if (i < n) {
        const x = P.l + pw * Math.min(i, n-1) / (n-1);
        svgH += `<text x="${x.toFixed(1)}" y="${H-4}" text-anchor="middle" font-size="7" fill="#9ca3af">${lbl}</text>`;
      }
    });
    return (
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 100, display: 'block' }} dangerouslySetInnerHTML={{ __html: svgH }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          {lines.map(l => <span key={l.label} style={{ fontSize: 11, color: l.color, display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, display: 'inline-block' }} />{l.label}</span>)}
        </div>
      </div>
    );
  }

  const SB_ITEMS = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'patients',  icon: '👥', label: `Patients (${patients.length})` },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 200, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '16px 14px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: YANKEES }}>Vwelfare</div>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, marginTop: 1 }}>Clinical Portal</div>
        </div>
        <nav style={{ padding: 10, flex: 1 }}>
          {SB_ITEMS.map(item => (
            <button key={item.id} onClick={() => setView(item.id as 'dashboard'|'patients')}
              style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: 'none', background: view === item.id || (view === 'patient' && item.id === 'patients') ? '#eff6ff' : 'transparent', color: view === item.id || (view === 'patient' && item.id === 'patients') ? LAPIS : '#374151', fontWeight: 500, fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 14px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: YANKEES }}>{clinician?.full_name_en ?? '...'}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Clinician</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', background: '#f9fafb' }}>

        {/* ── Dashboard ── */}
        {view === 'dashboard' && (
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: YANKEES, margin: 0 }}>Good morning, {clinician?.full_name_en?.split(' ')[0] ?? 'Doctor'}</h1>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Assigned patients', value: patients.length, color: LAPIS },
                { label: 'Active alerts', value: alertCount, color: alertCount > 0 ? '#dc2626' : '#166534' },
                { label: 'Logged today', value: Object.values(moodMap).filter(logs => logs.some(l => l.log_date === new Date().toISOString().split('T')[0])).length, color: '#7c3aed' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '16px' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{loading ? '—' : s.value}</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Patient priority list */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: YANKEES }}>Patient activity</span>
                <button onClick={() => setView('patients')} style={{ fontSize: 12, color: LAPIS, background: 'none', border: 'none', cursor: 'pointer' }}>View all →</button>
              </div>
              {loading ? <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Loading...</div> :
                patients.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No patients assigned yet. Invite patients from the admin panel.</div> :
                patients.slice(0, 5).map(p => {
                  const logs = moodMap[p.id] ?? [];
                  const latest = logs[logs.length - 1];
                  return (
                    <div key={p.id} onClick={() => openPatient(p)} style={{ padding: '12px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: LAPIS, flexShrink: 0 }}>
                        {p.full_name_en.split(' ').map(w => w[0]).slice(0,2).join('')}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: YANKEES }}>{p.full_name_en}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>
                          {latest ? `Last log: ${new Date(latest.log_date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}` : 'No logs yet'}
                        </div>
                      </div>
                      <MoodBar logs={logs} />
                      {latest && <span style={{ fontSize: 14, fontWeight: 700, color: LAPIS, minWidth: 24, textAlign: 'center' }}>{latest.mood_score}</span>}
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* ── Patient list ── */}
        {view === 'patients' && (
          <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: YANKEES, marginBottom: 20 }}>Patients</h1>
            {loading ? <div style={{ color: '#9ca3af' }}>Loading...</div> :
              patients.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: YANKEES }}>No patients yet</p>
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>Patients will appear here once they accept their invitation and are assigned to you.</p>
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Patient', '14-day mood', 'Latest score', 'Since', 'Alerts'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '.05em', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {patients.map(p => {
                        const logs = moodMap[p.id] ?? [];
                        const latest = logs[logs.length - 1];
                        return (
                          <tr key={p.id} onClick={() => openPatient(p)} style={{ cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                            onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#f9fafb'}
                            onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: LAPIS }}>
                                  {p.full_name_en.split(' ').map(w => w[0]).slice(0,2).join('')}
                                </div>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: YANKEES }}>{p.full_name_en}</div>
                                  {p.full_name_ar && <div style={{ fontSize: 11, color: '#9ca3af', direction: 'rtl' }}>{p.full_name_ar}</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px' }}><MoodBar logs={logs} /></td>
                            <td style={{ padding: '12px 14px' }}>
                              {latest ? <span style={{ fontSize: 15, fontWeight: 800, color: latest.mood_score >= 7 ? '#166534' : latest.mood_score >= 4 ? '#92400e' : '#991b1b' }}>{latest.mood_score}</span> : <span style={{ color: '#9ca3af', fontSize: 13 }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 14px', fontSize: 12, color: '#9ca3af' }}>
                              {new Date(p.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontSize: 12, color: '#9ca3af' }}>—</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        )}

        {/* ── Patient profile ── */}
        {view === 'patient' && selected && (
          <div style={{ padding: 24 }}>
            {/* Back */}
            <button onClick={() => setView('patients')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: LAPIS, fontSize: 13, fontWeight: 500, marginBottom: 16, padding: 0 }}>
              ← Patients
            </button>
            {/* Patient header */}
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: LAPIS }}>
                {selected.full_name_en.split(' ').map(w => w[0]).slice(0,2).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: YANKEES, margin: 0 }}>{selected.full_name_en}</h2>
                {selected.full_name_ar && <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0', direction: 'rtl' }}>{selected.full_name_ar}</p>}
              </div>
              <button onClick={() => router.push('/messages')}
                style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${LAPIS}`, background: '#eff6ff', color: LAPIS, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Message
              </button>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, background: '#f3f4f6', borderRadius: 10, padding: 3, marginBottom: 16 }}>
              {['overview', 'mood', 'assessments', 'alerts', 'summary'].map(tab => (
                <button key={tab} onClick={() => setPatientTab(tab as typeof patientTab)}
                  style={{ flex: 1, padding: '7px 4px', borderRadius: 7, border: 'none', background: patientTab === tab ? '#fff' : 'transparent', color: patientTab === tab ? LAPIS : '#6b7280', fontWeight: patientTab === tab ? 700 : 500, fontSize: tab === 'summary' ? 11 : 12, cursor: 'pointer', textTransform: 'capitalize', boxShadow: patientTab === tab ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
                  {tab === 'summary' ? '🤖 AI' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab: Overview */}
            {patientTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 12 }}>MOOD — 30 DAYS</div>
                  <MoodChartFull logs={patientMood} />
                </div>
                <div>
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 10 }}>LATEST SCORES</div>
                    {submissions.slice(0, 3).map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: YANKEES }}>{s.assessment_definitions.code}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{new Date(s.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: BAND_COLOR[s.severity_band] ?? '#374151' }}>{s.total_score}</div>
                          <div style={{ fontSize: 10, color: BAND_COLOR[s.severity_band] ?? '#9ca3af' }}>{s.severity_band}</div>
                        </div>
                      </div>
                    ))}
                    {submissions.length === 0 && <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>No assessments completed yet.</p>}
                  </div>
                  {alerts.filter(a => !a.acknowledged_at).length > 0 && (
                    <div style={{ background: '#fef3f2', border: '1px solid #fca5a5', borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#991b1b', marginBottom: 8 }}>⚠ ACTIVE ALERTS</div>
                      {alerts.filter(a => !a.acknowledged_at).map(a => (
                        <div key={a.id} style={{ fontSize: 12, color: '#7f1d1d', marginBottom: 4 }}>
                          {a.alert_type === 'drug_interaction' ? `Drug interaction${a.severity ? ` · ${a.severity}` : ''}` : 'Polypharmacy flag'}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Mood */}
            {patientTab === 'mood' && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: YANKEES, marginBottom: 14 }}>30-day mood trend</div>
                <MoodChartFull logs={patientMood} />
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {patientMood.length > 0 && [
                    { label: 'Avg mood',    val: (patientMood.reduce((s,l) => s + l.mood_score, 0) / patientMood.length).toFixed(1),    col: LAPIS },
                    { label: 'Avg energy',  val: (patientMood.reduce((s,l) => s + l.energy_score, 0) / patientMood.length).toFixed(1),  col: '#F3650A' },
                    { label: 'Avg anxiety', val: (patientMood.reduce((s,l) => s + l.anxiety_score, 0) / patientMood.length).toFixed(1), col: '#dc2626' },
                  ].map(m => (
                    <div key={m.label} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: m.col }}>{m.val}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
                {patientMood.length === 0 && <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No mood logs yet for this patient.</p>}
              </div>
            )}

            {/* Tab: Assessments */}
            {patientTab === 'assessments' && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: YANKEES }}>Assessment history</span>
                </div>
                {submissions.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No assessments completed yet.</div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb' }}>
                        {['Scale', 'Score', 'Severity', 'Date'].map(h => (
                          <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '.05em', textTransform: 'uppercase', borderBottom: '1px solid #e5e7eb' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: YANKEES }}>{s.assessment_definitions.code}</td>
                          <td style={{ padding: '10px 14px', fontSize: 16, fontWeight: 800, color: BAND_COLOR[s.severity_band] ?? '#374151' }}>{s.total_score}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 100, background: '#f9fafb', color: BAND_COLOR[s.severity_band] ?? '#374151', fontWeight: 600, border: '1px solid #e5e7eb' }}>
                              {s.severity_band}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontSize: 12, color: '#9ca3af' }}>
                            {new Date(s.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Tab: Alerts */}
            {patientTab === 'alerts' && (
              <div>
                {alerts.length === 0 ? (
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12, padding: 32, textAlign: 'center' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#166534' }}>No medication alerts for this patient.</p>
                  </div>
                ) : (
                  alerts.map(a => (
                    <div key={a.id} style={{ background: a.acknowledged_at ? '#f9fafb' : '#fef3f2', border: `1px solid ${a.acknowledged_at ? '#e5e7eb' : '#fca5a5'}`, borderRadius: 12, padding: '14px 16px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: a.acknowledged_at ? '#374151' : '#991b1b' }}>
                          {a.alert_type === 'drug_interaction' ? `Drug interaction${a.severity ? ` · ${a.severity}` : ''}` : 'Polypharmacy — ≥4 concurrent medications'}
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 3 }}>
                          {new Date(a.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                          {a.acknowledged_at && ' · Acknowledged'}
                        </div>
                      </div>
                      {!a.acknowledged_at && (
                        <button onClick={async () => {
                          await supabase.from('medication_alerts').update({ acknowledged_at: new Date().toISOString() }).eq('id', a.id);
                          setAlerts(prev => prev.map(al => al.id === a.id ? { ...al, acknowledged_at: new Date().toISOString() } : al));
                        }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 500, color: '#374151' }}>
                          Acknowledge
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: AI Summary */}
            {patientTab === 'summary' && (
              <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: YANKEES }}>🤖 AI Clinical Summary</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Generated by Claude · Not a diagnosis</div>
                  </div>
                  <button onClick={async () => {
                    setSummaryLoading(true);
                    setAiSummary('');
                    try {
                      const [medsRes, journalsRes] = await Promise.all([
                        supabase.from('medications').select('drug_name_display, dosage, frequency, is_active').eq('patient_id', selected!.id),
                        supabase.from('journal_entries').select('id').eq('patient_id', selected!.id).eq('is_shared', true),
                      ]);
                      const res = await fetch('/api/clinical-summary', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          patientName: selected!.full_name_en,
                          language: 'en',
                          moodLogs: patientMood,
                          submissions,
                          medications: medsRes.data ?? [],
                          journals: journalsRes.data ?? [],
                        }),
                      });
                      const data = await res.json();
                      setAiSummary(data.summary ?? 'Could not generate summary.');
                    } catch { setAiSummary('Error generating summary.'); }
                    setSummaryLoading(false);
                  }} disabled={summaryLoading}
                    style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: summaryLoading ? '#e5e7eb' : LAPIS, color: summaryLoading ? '#9ca3af' : '#fff', fontWeight: 600, fontSize: 13, cursor: summaryLoading ? 'not-allowed' : 'pointer' }}>
                    {summaryLoading ? 'Generating...' : 'Generate summary'}
                  </button>
                </div>
                {!aiSummary && !summaryLoading && (
                  <div style={{ textAlign: 'center', padding: '32px 20px', color: '#9ca3af' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🤖</div>
                    <p style={{ fontSize: 13 }}>Click "Generate summary" to create an AI clinical narrative from this patient's data.</p>
                  </div>
                )}
                {summaryLoading && (
                  <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                    <div style={{ width: 28, height: 28, border: `3px solid ${LAPIS}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 13, color: '#6b7280' }}>Analyzing patient data…</p>
                  </div>
                )}
                {aiSummary && (
                  <div>
                    <div style={{ background: '#f9fafb', borderRadius: 12, padding: '16px', fontSize: 13, lineHeight: 1.8, color: '#374151', whiteSpace: 'pre-wrap' }}>{aiSummary}</div>
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef3f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 12, color: '#991b1b' }}>
                      ⚠️ This AI summary is an assistive tool only. Clinical judgment must be applied. Not for diagnostic use.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
