'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const L = '#1D6296', Y = '#12273C';

interface Medication {
  id: string;
  drug_name_display: string;
  dosage: string | null;
  frequency: string | null;
  prescribed_by: string | null;
  started_month: string | null;
  is_active: boolean;
  created_at: string;
}
interface Alert {
  id: string;
  alert_type: string;
  severity: string | null;
  mechanism_en: string | null;
  mechanism_ar: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

const FREQ_AR: Record<string, string> = {
  'once-daily': 'مرة يومياً', 'twice-daily': 'مرتين يومياً', 'three-daily': 'ثلاث مرات يومياً',
  'as-needed': 'عند الحاجة', 'before-bed': 'قبل النوم', 'with-meals': 'مع الوجبات',
  'weekly': 'أسبوعياً', 'other': 'أخرى',
};
const FREQ_EN: Record<string, string> = {
  'once-daily': 'Once daily', 'twice-daily': 'Twice daily', 'three-daily': 'Three times daily',
  'as-needed': 'As needed', 'before-bed': 'Before bed', 'with-meals': 'With meals',
  'weekly': 'Weekly', 'other': 'Other',
};

const PSYCH_MEDS = [
  'Sertraline (Zoloft)', 'Escitalopram (Lexapro)', 'Fluoxetine (Prozac)', 'Paroxetine (Paxil)',
  'Venlafaxine (Effexor)', 'Duloxetine (Cymbalta)', 'Bupropion (Wellbutrin)', 'Mirtazapine (Remeron)',
  'Alprazolam (Xanax)', 'Clonazepam (Klonopin)', 'Lorazepam (Ativan)', 'Diazepam (Valium)',
  'Quetiapine (Seroquel)', 'Aripiprazole (Abilify)', 'Risperidone (Risperdal)', 'Olanzapine (Zyprexa)',
  'Lithium Carbonate', 'Valproate (Depakote)', 'Lamotrigine (Lamictal)', 'Methylphenidate (Ritalin)',
  'Clomipramine (Anafranil)', 'Amitriptyline', 'Buspirone',
];

export default function MedicationsPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [meds, setMeds] = useState<Medication[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [form, setForm] = useState({ name: '', dosage: '', frequency: 'once-daily', prescribed_by: '' });
  const router = useRouter();
  const supabase = createClient();

  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  async function load(uid: string) {
    const [medsRes, alertsRes] = await Promise.all([
      supabase.from('medications').select('*').eq('patient_id', uid).order('created_at', { ascending: false }),
      supabase.from('medication_alerts').select('*').eq('patient_id', uid).is('acknowledged_at', null).order('created_at', { ascending: false }),
    ]);
    setMeds(medsRes.data ?? []);
    setAlerts(alertsRes.data ?? []);
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      setUserId(user.id);
      const { data: prof } = await supabase.from('profiles').select('language_preference').eq('id', user.id).single();
      if (prof) setLang(prof.language_preference as 'ar' | 'en');
      await load(user.id);
      setLoading(false);
    }
    init();
  }, []);

  async function addMedication() {
    if (!form.name.trim() || !userId) return;
    setSaving(true);
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/add-medication`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        patient_id: userId,
        drug_name_display: form.name.trim(),
        dosage: form.dosage.trim() || null,
        frequency: form.frequency,
        prescribed_by: form.prescribed_by.trim() || null,
      }),
    });
    if (res.ok) {
      setAdding(false);
      setForm({ name: '', dosage: '', frequency: 'once-daily', prescribed_by: '' });
      await load(userId);
    }
    setSaving(false);
  }

  async function deactivate(medId: string) {
    if (!userId) return;
    await supabase.from('medications').update({ is_active: false, deactivated_at: new Date().toISOString() }).eq('id', medId);
    await load(userId);
  }

  async function acknowledgeAlert(alertId: string) {
    await supabase.from('medication_alerts').update({ acknowledged_at: new Date().toISOString() }).eq('id', alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }

  const activeMeds = meds.filter(m => m.is_active);
  const inactiveMeds = meds.filter(m => !m.is_active);

  const SEV_COL: Record<string, { bg: string; text: string; border: string }> = {
    major: { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
    moderate: { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
    minor: { bg: '#fefce8', text: '#713f12', border: '#fde047' },
  };

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: '#f4f6f9', paddingBottom: 0 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(160deg, ${Y}, #1a3a5c)`, padding: '52px 18px 18px', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{t('الأدوية', 'Medications')}</h1>
            <p style={{ fontSize: 12, opacity: .6, margin: '3px 0 0' }}>
              {activeMeds.length} {t('دواء نشط', 'active medication')}
              {activeMeds.length !== 1 && lang === 'en' ? 's' : ''}
            </p>
          </div>
          <button onClick={() => setAdding(true)}
            style={{ padding: '9px 18px', borderRadius: 10, border: '1.5px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.12)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            + {t('إضافة', 'Add')}
          </button>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Alerts */}
        {alerts.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              ⚠️ {t('تنبيهات الأدوية', 'Medication alerts')} ({alerts.length})
            </div>
            {alerts.map(a => {
              const sc = SEV_COL[a.severity ?? 'moderate'] ?? SEV_COL.moderate;
              return (
                <div key={a.id} style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 14, padding: '14px 15px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: sc.text, marginBottom: 4 }}>
                        {a.alert_type === 'drug_interaction' ? t('تفاعل دوائي محتمل', 'Potential drug interaction') : t('تعدد الأدوية — ≥٤ أدوية', 'Polypharmacy — ≥4 medications')}
                        {a.severity && <span style={{ fontSize: 11, marginRight: lang === 'ltr' ? 0 : 6, marginLeft: lang === 'rtl' ? 0 : 6, background: `${sc.text}20`, padding: '1px 8px', borderRadius: 100 }}>{a.severity}</span>}
                      </div>
                      {(lang === 'ar' ? a.mechanism_ar : a.mechanism_en) && (
                        <p style={{ fontSize: 12, color: sc.text, opacity: .8, margin: 0, lineHeight: 1.5 }}>
                          {lang === 'ar' ? a.mechanism_ar : a.mechanism_en}
                        </p>
                      )}
                    </div>
                    <button onClick={() => acknowledgeAlert(a.id)}
                      style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: `1px solid ${sc.border}`, background: '#fff', color: sc.text, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
                      {t('تأكيد', 'Acknowledge')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Active medications */}
        {loading ? (
          [1, 2].map(i => <div key={i} style={{ height: 90, background: '#e5e7eb', borderRadius: 14, marginBottom: 10 }} />)
        ) : activeMeds.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '32px 20px', textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>💊</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: Y, marginBottom: 6 }}>{t('لا أدوية مسجَّلة', 'No medications recorded')}</h3>
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
              {t('أضف أدويتك لمراقبة التفاعلات الدوائية المحتملة وإبلاغ طبيبك.', 'Add your medications to monitor potential interactions and inform your clinician.')}
            </p>
            <button onClick={() => setAdding(true)} style={{ padding: '11px 28px', borderRadius: 10, border: 'none', background: L, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('إضافة دواء', 'Add medication')}
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 10 }}>
              {t('الأدوية النشطة', 'Active medications')} ({activeMeds.length})
            </div>
            {activeMeds.map(med => (
              <div key={med.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 15px', marginBottom: 9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: Y, marginBottom: 4 }}>{med.drug_name_display}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {med.dosage && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 100, background: '#eff6ff', color: L, border: `1px solid #bfdbfe` }}>{med.dosage}</span>}
                      {med.frequency && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 100, background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' }}>{lang === 'ar' ? FREQ_AR[med.frequency] ?? med.frequency : FREQ_EN[med.frequency] ?? med.frequency}</span>}
                      {med.prescribed_by && <span style={{ fontSize: 11, color: '#9ca3af' }}>د. {med.prescribed_by}</span>}
                    </div>
                  </div>
                  <button onClick={() => deactivate(med.id)}
                    style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
                    {t('إيقاف', 'Stop')}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Inactive */}
        {inactiveMeds.length > 0 && (
          <div>
            <button onClick={() => setShowInactive(s => !s)}
              style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontWeight: 500, fontSize: 13, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}>
              {showInactive ? '▲' : '▼'} {t(`${inactiveMeds.length} أدوية سابقة`, `${inactiveMeds.length} previous medication${inactiveMeds.length !== 1 ? 's' : ''}`)}
            </button>
            {showInactive && inactiveMeds.map(med => (
              <div key={med.id} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', marginBottom: 7, opacity: .65 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', textDecoration: 'line-through' }}>{med.drug_name_display}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{t('أُوقف', 'Stopped')}</div>
              </div>
            ))}
          </div>
        )}

        {/* Safety note */}
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 14px', marginTop: 14 }}>
          <p style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.6, margin: 0 }}>
            🔍 {t('يتم فحص التفاعلات الدوائية تلقائياً عند إضافة كل دواء. طبيبك يُبلَّغ بأي تحذيرات فوراً.', 'Drug interactions are automatically checked when each medication is added. Your clinician is immediately notified of any warnings.')}
          </p>
        </div>
      </div>

      {/* Add medication modal */}
      {adding && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'flex-end' }}>
          <div dir={dir} style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0', padding: '24px 20px 36px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: Y, margin: 0 }}>{t('إضافة دواء', 'Add medication')}</h3>
              <button onClick={() => setAdding(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#9ca3af', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('اسم الدواء *', 'Medication name *')}</label>
              <input
                className="field"
                value={form.name}
                onChange={e => {
                  setForm(f => ({ ...f, name: e.target.value }));
                  const q = e.target.value.toLowerCase();
                  setSuggestions(q.length >= 2 ? PSYCH_MEDS.filter(m => m.toLowerCase().includes(q)).slice(0, 5) : []);
                }}
                placeholder={t('ابحث عن اسم الدواء...', 'Search medication name...')}
                autoComplete="off"
              />
              {suggestions.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, marginTop: 3, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
                  {suggestions.map(s => (
                    <div key={s} onClick={() => { setForm(f => ({ ...f, name: s })); setSuggestions([]); }}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, color: Y, borderBottom: '1px solid #f3f4f6' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f9fafb'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('الجرعة', 'Dosage')}</label>
                <input className="field" value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="50mg" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('التكرار', 'Frequency')}</label>
                <select className="field" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
                  {Object.entries(FREQ_AR).map(([val, ar]) => (
                    <option key={val} value={val}>{lang === 'ar' ? ar : FREQ_EN[val]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{t('وُصف من قِبَل', 'Prescribed by')}</label>
              <input className="field" value={form.prescribed_by} onChange={e => setForm(f => ({ ...f, prescribed_by: e.target.value }))} placeholder={t('اسم الطبيب (اختياري)', 'Doctor name (optional)')} />
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 12px', marginBottom: 20, fontSize: 12, color: '#9a3412' }}>
              ⚠️ {t('سيتم فحص التفاعلات مع أدويتك الحالية تلقائياً.', 'Interactions with your current medications will be checked automatically.')}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setAdding(false)} style={{ flex: 1, padding: 13, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('إلغاء', 'Cancel')}
              </button>
              <button onClick={addMedication} disabled={!form.name.trim() || saving}
                style={{ flex: 2, padding: 13, borderRadius: 10, border: 'none', background: form.name.trim() ? L : '#e5e7eb', color: form.name.trim() ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: 14, cursor: form.name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                {saving ? t('جارٍ الإضافة...', 'Adding...') : t('إضافة الدواء', 'Add medication')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
