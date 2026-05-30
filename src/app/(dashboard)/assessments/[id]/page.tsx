'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const LAPIS = '#1D6296';
const YANKEES = '#12273C';

interface Item {
  id: string;
  item_number: number;
  question_en: string;
  question_ar: string;
  is_safety_item: boolean;
  response_options: { value: number; label_en: string; label_ar: string }[];
}

interface Assignment {
  id: string;
  definition_id: string;
  note_to_patient_ar: string | null;
  note_to_patient_en: string | null;
  assessment_definitions: {
    code: string;
    name_en: string;
    name_ar: string;
    description_en: string;
    description_ar: string;
    total_questions: number;
  };
}

export default function AssessmentFlow() {
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [assignment, setAssignment] = useState<Assignment|null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [step, setStep] = useState<'intro'|'question'|'submitting'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [responses, setResponses] = useState<Record<string, { value: number; en: string; ar: string }>>({});
  const [safetyAck, setSafetyAck] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startedAt] = useState(new Date().toISOString());
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      const { data: prof } = await supabase.from('profiles').select('language_preference').eq('id', user.id).single();
      if (prof) setLang(prof.language_preference as 'ar'|'en');

      const { data: a } = await supabase.from('assessment_assignments')
        .select('id, definition_id, note_to_patient_ar, note_to_patient_en, assessment_definitions(code, name_en, name_ar, description_en, description_ar, total_questions)')
        .eq('id', id).eq('patient_id', user.id).single();
      if (!a) { router.push('/assessments'); return; }
      setAssignment(a as unknown as Assignment);

      const { data: its } = await supabase.from('assessment_items')
        .select('id, item_number, question_en, question_ar, is_safety_item, response_options')
        .eq('definition_id', a.definition_id).order('item_number');
      setItems((its ?? []) as Item[]);
      setLoading(false);
    }
    load();
  }, [id]);

  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const item = items[currentQ];
  const totalQ = items.length;
  const selected = item ? responses[item.id] : null;

  async function submit() {
    setStep('submitting');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      assignment_id: id,
      started_at: startedAt,
      responses: Object.entries(responses).map(([item_id, r]) => ({
        item_id,
        response_value: r.value,
        response_label_en: r.en,
        response_label_ar: r.ar,
      })),
    };
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/submit-assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.submission_id) {
      router.push(`/assessments/${id}/results?sid=${data.submission_id}&score=${data.total_score}&band=${encodeURIComponent(data.severity_band)}&risk=${data.high_risk_flag}`);
    } else {
      setStep('question');
    }
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 28 }}>📋</div></div>;
  if (!assignment) return null;

  const def = assignment.assessment_definitions;

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={() => step === 'intro' ? router.push('/assessments') : setCurrentQ(q => Math.max(0, q-1))}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 20, lineHeight: 1, padding: 0 }}>
          {lang === 'ar' ? '→' : '←'}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: YANKEES }}>{lang === 'ar' ? def.name_ar : def.name_en}</div>
          {step === 'question' && <div style={{ fontSize: 11, color: '#9ca3af' }}>{t(`سؤال ${currentQ+1} من ${totalQ}`, `Question ${currentQ+1} of ${totalQ}`)}</div>}
        </div>
      </div>

      {/* Progress */}
      {step === 'question' && (
        <div style={{ height: 4, background: '#f3f4f6', flexShrink: 0 }}>
          <div style={{ height: '100%', background: LAPIS, borderRadius: '0 2px 2px 0', width: `${((currentQ + 1) / totalQ) * 100}%`, transition: 'width .3s' }} />
        </div>
      )}

      <div style={{ flex: 1, padding: '20px 18px' }}>

        {/* Intro screen */}
        {step === 'intro' && (
          <div>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: YANKEES, marginBottom: 10 }}>{lang === 'ar' ? def.name_ar : def.name_en}</h2>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7, marginBottom: 16 }}>
              {lang === 'ar' ? def.description_ar : def.description_en}
            </p>
            {(lang === 'ar' ? assignment.note_to_patient_ar : assignment.note_to_patient_en) && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: '#1e40af', fontStyle: 'italic' }}>
                "{lang === 'ar' ? assignment.note_to_patient_ar : assignment.note_to_patient_en}"
              </div>
            )}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', marginBottom: 24, fontSize: 12, color: '#6b7280' }}>
              <div>📊 {totalQ} {t('أسئلة', 'questions')}</div>
              <div style={{ marginTop: 4 }}>🔒 {t('إجاباتك سرية ويراها طبيبك فقط', 'Your answers are private and visible only to your clinician')}</div>
            </div>
            <button onClick={() => setStep('question')}
              style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: LAPIS, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              {t('ابدأ الآن', 'Start now')}
            </button>
          </div>
        )}

        {/* Question screen */}
        {step === 'question' && item && (
          <div>
            {/* Safety notice for Q9 of PHQ-9 */}
            {item.is_safety_item && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '14px 15px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>
                  {t('ملاحظة مهمة', 'Important note')}
                </div>
                <div style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.6 }}>
                  {t(
                    'إذا كانت لديك أفكار عن إيذاء نفسك، يرجى التحدث مع طبيبك أو الاتصال بخط دعم الأزمات فوراً. أنت لست وحدك.',
                    'If you have thoughts of harming yourself, please speak to your clinician or contact a crisis line immediately. You are not alone.'
                  )}
                </div>
              </div>
            )}

            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {t('خلال الأسبوعين الماضيين...', 'Over the past two weeks...')}
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: YANKEES, lineHeight: 1.45, marginBottom: 28 }}>
              {lang === 'ar' ? item.question_ar : item.question_en}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {item.response_options.map(opt => {
                const isSel = selected?.value === opt.value;
                return (
                  <button key={opt.value}
                    onClick={() => {
                      setResponses(prev => ({ ...prev, [item.id]: { value: opt.value, en: opt.label_en, ar: opt.label_ar } }));
                    }}
                    style={{ padding: '14px 16px', borderRadius: 12, border: `2px solid ${isSel ? LAPIS : '#e5e7eb'}`, background: isSel ? '#eff6ff' : '#fff', color: isSel ? LAPIS : '#374151', fontWeight: isSel ? 700 : 500, fontSize: 14, cursor: 'pointer', textAlign: lang === 'ar' ? 'right' : 'left', transition: 'all .15s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{lang === 'ar' ? opt.label_ar : opt.label_en}</span>
                    {isSel && <span style={{ fontSize: 16 }}>✓</span>}
                  </button>
                );
              })}
            </div>

            {selected && (
              <button onClick={() => {
                if (currentQ < totalQ - 1) { setCurrentQ(q => q + 1); }
                else { submit(); }
              }}
                style={{ marginTop: 24, width: '100%', padding: 14, borderRadius: 12, border: 'none', background: LAPIS, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                {currentQ < totalQ - 1 ? t('التالي →', 'Next →') : t('إرسال التقييم', 'Submit assessment')}
              </button>
            )}
          </div>
        )}

        {/* Submitting */}
        {step === 'submitting' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <p style={{ fontSize: 15, color: YANKEES, fontWeight: 600 }}>{t('جارٍ معالجة إجاباتك...', 'Processing your responses...')}</p>
          </div>
        )}

      </div>
    </div>
  );
}
