'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const L = '#1D6296';
const Y = '#12273C';

interface Assignment {
  id: string;
  status: string;
  assigned_at: string;
  due_date: string | null;
  note_to_patient_ar: string | null;
  note_to_patient_en: string | null;
  assessment_definitions: {
    id: string; code: string; name_en: string; name_ar: string;
    description_en: string; description_ar: string; total_questions: number;
  };
}
interface Submission {
  id: string; total_score: number; severity_band: string; submitted_at: string;
  assessment_definitions: { code: string; name_en: string; name_ar: string };
}

const BAND_META: Record<string, { color: string; bg: string; ar: string }> = {
  Minimal:            { color:'#166534', bg:'#dcfce7', ar:'طفيف' },
  Mild:               { color:'#713f12', bg:'#fef9c3', ar:'خفيف' },
  Moderate:           { color:'#9a3412', bg:'#ffedd5', ar:'معتدل' },
  'Moderately severe':{ color:'#7c2d12', bg:'#fee2e2', ar:'متوسط-شديد' },
  Severe:             { color:'#991b1b', bg:'#fecaca', ar:'شديد' },
};

const SELF_CHECKS = [
  {
    code: 'phq9',
    name_ar: 'PHQ-9 — الاكتئاب',
    name_en: 'PHQ-9 — Depression',
    desc_ar: '9 أسئلة · 2 دقيقة',
    desc_en: '9 questions · 2 min',
    icon: '💙',
    bg: '#eff6ff',
    fg: L,
    accent: '#bfdbfe',
  },
  {
    code: 'gad7',
    name_ar: 'GAD-7 — القلق',
    name_en: 'GAD-7 — Anxiety',
    desc_ar: '7 أسئلة · 90 ثانية',
    desc_en: '7 questions · 90 sec',
    icon: '💚',
    bg: '#f0fdf4',
    fg: '#166534',
    accent: '#bbf7d0',
  },
];

function SkeletonCard({ height = 80 }: { height?: number }) {
  return <div className="skeleton" style={{ height, borderRadius: 14, marginBottom: 10 }} />;
}

export default function AssessmentsPage() {
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [pending, setPending] = useState<Assignment[]>([]);
  const [completed, setCompleted] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      const { data: prof } = await supabase.from('profiles').select('language_preference').eq('id', user.id).single();
      if (prof) setLang(prof.language_preference as 'ar'|'en');
      const [{ data: pend }, { data: comp }] = await Promise.all([
        supabase.from('assessment_assignments')
          .select('id,status,assigned_at,due_date,note_to_patient_ar,note_to_patient_en,assessment_definitions(id,code,name_en,name_ar,description_en,description_ar,total_questions)')
          .eq('patient_id', user.id).eq('status', 'pending').order('assigned_at', { ascending: false }),
        supabase.from('assessment_submissions')
          .select('id,total_score,severity_band,submitted_at,assessment_definitions(code,name_en,name_ar)')
          .eq('patient_id', user.id).order('submitted_at', { ascending: false }).limit(15),
      ]);
      setPending((pend as unknown as Assignment[]) ?? []);
      setCompleted((comp as unknown as Submission[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} style={{ minHeight:'100vh', background:'#f4f6f9', paddingBottom:0 }}>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'14px 18px',
        position:'sticky', top:0, zIndex:5 }}>
        <h1 style={{ fontSize:18, fontWeight:800, color:Y, margin:0 }}>
          {t('التقييمات','Assessments')}
        </h1>
        <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>
          {t('مقاييس سريرية معتمدة','Validated clinical scales')}
        </p>
      </div>

      <div style={{ padding:'16px 16px' }}>

        {/* ── Self-check section ─────────────────── */}
        <div className="anim-fade-up" style={{ marginBottom:20 }}>
          <span className="section-label">{t('فحص ذاتي','Self-check')}</span>
          <div style={{ background:'#fff', borderRadius:18, border:'1px solid #f0f0f0',
            overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
            {SELF_CHECKS.map((sc, i) => (
              <div key={sc.code}
                onClick={() => router.push(`/assessments/take/${sc.code}`)}
                style={{ padding:'14px 16px', cursor:'pointer',
                  borderBottom: i < SELF_CHECKS.length - 1 ? '1px solid #f0f0f0' : 'none',
                  display:'flex', alignItems:'center', gap:12,
                  transition:'background .12s' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:sc.bg,
                  border:`1px solid ${sc.accent}`, display:'flex',
                  alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  {sc.icon}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:Y, marginBottom:2 }}>
                    {t(sc.name_ar, sc.name_en)}
                  </div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>
                    {t(sc.desc_ar, sc.desc_en)}
                  </div>
                </div>
                <div style={{ fontSize:18, color:'#d1d5db' }}>
                  {dir === 'rtl' ? '←' : '→'}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize:11, color:'#9ca3af', textAlign:'center', marginTop:8 }}>
            {t('النتائج ترسل تلقائياً إلى طبيبك','Results are automatically sent to your clinician')}
          </p>
        </div>

        {/* ── Assigned by clinician ──────────────── */}
        {loading ? (
          <>
            <SkeletonCard height={120} />
            <SkeletonCard height={80} />
          </>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="anim-fade-up delay-100" style={{ marginBottom:20 }}>
                <span className="section-label">
                  {t('معيّنة لك','Assigned to you')} ({pending.length})
                </span>
                {pending.map(a => (
                  <div key={a.id} onClick={() => router.push(`/assessments/${a.id}`)}
                    style={{ background:'#fff', border:`2px solid ${L}`,
                      borderRadius:16, padding:'16px', marginBottom:10, cursor:'pointer',
                      boxShadow:`0 2px 12px ${L}18` }}>
                    <div style={{ display:'flex', alignItems:'flex-start',
                      justifyContent:'space-between', marginBottom:10 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:800, color:Y }}>
                          {lang === 'ar' ? a.assessment_definitions.name_ar : a.assessment_definitions.name_en}
                        </div>
                        <div style={{ fontSize:11, color:'#9ca3af', marginTop:3 }}>
                          {a.assessment_definitions.total_questions} {t('أسئلة','questions')}
                          {a.due_date && ` · ${t('موعد:','Due:')} ${new Date(a.due_date).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB', { day:'numeric', month:'short' })}`}
                        </div>
                      </div>
                      <span style={{ fontSize:10, padding:'3px 10px', borderRadius:100,
                        background:'#eff6ff', color:L, border:`1px solid #bfdbfe`,
                        fontWeight:700, flexShrink:0, marginTop:2 }}>
                        {t('معلّق','Pending')}
                      </span>
                    </div>
                    {(lang === 'ar' ? a.note_to_patient_ar : a.note_to_patient_en) && (
                      <div style={{ fontSize:12, color:'#6b7280', background:'#f9fafb',
                        borderRadius:8, padding:'8px 10px', marginBottom:10,
                        borderInlineStart:`3px solid ${L}20` }}>
                        "{lang === 'ar' ? a.note_to_patient_ar : a.note_to_patient_en}"
                      </div>
                    )}
                    <button style={{ width:'100%', padding:'11px', borderRadius:10,
                      border:'none', background:L, color:'#fff', fontWeight:700,
                      fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                      {t('ابدأ التقييم ←','Start assessment →')}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* No pending state */}
            {pending.length === 0 && (
              <div className="anim-fade-up delay-100"
                style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:16,
                  padding:'18px 20px', display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#4ade80',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l5 5L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:700, color:'#166534', margin:0 }}>
                    {t('لا تقييمات معلّقة','No pending assessments')}
                  </p>
                  <p style={{ fontSize:11, color:'#16a34a', margin:'2px 0 0' }}>
                    {t('سيُبلّغك طبيبك عند تعيين تقييم جديد','Your clinician will notify you when assigned')}
                  </p>
                </div>
              </div>
            )}

            {/* ── History ─────────────────────────── */}
            {completed.length > 0 && (
              <div className="anim-fade-up delay-200">
                <span className="section-label">{t('السجل','History')}</span>
                <div style={{ background:'#fff', borderRadius:18, border:'1px solid #f0f0f0',
                  overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,.05)' }}>
                  {completed.map((s, i) => {
                    const meta = BAND_META[s.severity_band] ?? { color:'#374151', bg:'#f3f4f6', ar: s.severity_band };
                    return (
                      <div key={s.id}
                        style={{ padding:'13px 16px',
                          borderBottom: i < completed.length - 1 ? '1px solid #f9fafb' : 'none',
                          display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:Y }}>
                            {lang === 'ar' ? s.assessment_definitions.name_ar : s.assessment_definitions.name_en}
                          </div>
                          <div style={{ fontSize:11, color:'#9ca3af', marginTop:2 }}>
                            {new Date(s.submitted_at).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB',
                              { day:'numeric', month:'short', year:'numeric' })}
                          </div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:10, padding:'3px 8px', borderRadius:100,
                            background:meta.bg, color:meta.color, fontWeight:700 }}>
                            {lang === 'ar' ? meta.ar : s.severity_band}
                          </span>
                          <span style={{ fontSize:20, fontWeight:900, color:meta.color,
                            minWidth:32, textAlign:'center' }}>
                            {s.total_score}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty history */}
            {completed.length === 0 && !loading && (
              <div className="anim-fade-up delay-200"
                style={{ textAlign:'center', padding:'24px 20px',
                  background:'#fff', borderRadius:18, border:'1px solid #f0f0f0' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>📋</div>
                <p style={{ fontSize:14, fontWeight:600, color:Y, margin:'0 0 6px' }}>
                  {t('لا يوجد سجل تقييمات بعد','No assessment history yet')}
                </p>
                <p style={{ fontSize:12, color:'#9ca3af', margin:0, lineHeight:1.6 }}>
                  {t('ابدأ بأحد الفحوصات الذاتية أعلاه','Try one of the self-checks above to get started')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
