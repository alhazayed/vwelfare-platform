'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const L = '#1D6296', O = '#F3650A', Y = '#12273C';

const STEPS = ['welcome', 'language', 'name', 'mood', 'ready'] as const;
type Step = typeof STEPS[number];

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [name, setName] = useState('');
  const [mood, setMood] = useState(5);
  const [saving, setSaving] = useState(false);
  const [clinicianName, setClinicianName] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      const { data: prof } = await supabase.from('profiles')
        .select('full_name_en, assigned_clinician_id, patient_profiles(onboarding_completed_at)')
        .eq('id', user.id).single();

      // Skip if already completed
      const pp = Array.isArray(prof?.patient_profiles) ? prof?.patient_profiles[0] : prof?.patient_profiles;
      if (pp?.onboarding_completed_at) { router.replace('/home'); return; }

      if (prof?.full_name_en) setName(prof.full_name_en);
      if (prof?.assigned_clinician_id) {
        const { data: clin } = await supabase.from('profiles').select('full_name_en').eq('id', prof.assigned_clinician_id).single();
        if (clin) setClinicianName(clin.full_name_en.split(' ').slice(0, 2).join(' '));
      }
    }
    init();
  }, []);

  const currentIdx = STEPS.indexOf(step);
  const progress = ((currentIdx) / (STEPS.length - 1)) * 100;

  function next() {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  }

  async function complete() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({ full_name_en: name.trim() || undefined, language_preference: lang }).eq('id', user.id);
    await supabase.from('patient_profiles').upsert({ id: user.id, onboarding_completed_at: new Date().toISOString(), onboarding_step: STEPS.length }, { onConflict: 'id' });
    if (mood > 0) {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('mood_logs').upsert({ patient_id: user.id, log_date: today, mood_score: mood, energy_score: 5, anxiety_score: 5 }, { onConflict: 'patient_id,log_date' });
    }
    router.replace('/home');
  }

  const MOODS = ['😔', '😟', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '✨'];

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${Y} 0%, #1a3a5c 50%, ${L} 100%)`, display: 'flex', flexDirection: 'column', fontFamily: 'Segoe UI,system-ui,sans-serif', overflow: 'hidden' }}>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,.15)', flexShrink: 0 }}>
        <div style={{ height: '100%', background: O, width: `${progress}%`, transition: 'width .4s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', maxWidth: 460, margin: '0 auto', width: '100%' }}>

        {/* WELCOME */}
        {step === 'welcome' && (
          <div className="anim-fade-up" style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🧠</div>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 14, lineHeight: 1.25 }}>
              {clinicianName
                ? t(`مرحباً، د. ${clinicianName} يرحب بك في Vwelfare`, `Welcome — Dr. ${clinicianName} has added you to Vwelfare`)
                : t('أهلاً بك في Vwelfare', 'Welcome to Vwelfare')
              }
            </h1>
            <p style={{ fontSize: 15, opacity: .75, lineHeight: 1.75, marginBottom: 32 }}>
              {t(
                'منصة آمنة لمتابعة صحتك النفسية والتواصل مع طبيبك. سنأخذ دقيقتين لإعداد حسابك.',
                'A secure platform for tracking your mental health and staying connected with your clinician. Two minutes to set up.'
              )}
            </p>
            <button onClick={next} style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: O, color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${O}55` }}>
              {t('لنبدأ ←', "Let's begin →")}
            </button>
          </div>
        )}

        {/* LANGUAGE */}
        {step === 'language' && (
          <div className="anim-fade-up" style={{ width: '100%', color: '#fff' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>🌐</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
                {lang === 'ar' ? 'ما لغتك المفضّلة؟' : 'What\'s your preferred language?'}
              </h2>
              <p style={{ fontSize: 14, opacity: .65 }}>
                {lang === 'ar' ? 'يمكنك التغيير لاحقاً من الإعدادات' : 'You can change this later in settings'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
              {(['ar', 'en'] as const).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  style={{ flex: 1, padding: '20px 16px', borderRadius: 16, border: `2px solid ${lang === l ? '#fff' : 'rgba(255,255,255,.2)'}`, background: lang === l ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.07)', color: '#fff', cursor: 'pointer', transition: 'all .2s', fontFamily: 'inherit' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{l === 'ar' ? '🇯🇴' : '🇬🇧'}</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{l === 'ar' ? 'العربية' : 'English'}</div>
                  <div style={{ fontSize: 12, opacity: .65, marginTop: 3 }}>{l === 'ar' ? 'Arabic' : 'الإنجليزية'}</div>
                  {lang === l && <div style={{ marginTop: 8, fontSize: 16 }}>✓</div>}
                </button>
              ))}
            </div>
            <button onClick={next} style={{ width: '100%', padding: 15, borderRadius: 12, border: 'none', background: L, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('التالي ←', 'Next →')}
            </button>
          </div>
        )}

        {/* NAME */}
        {step === 'name' && (
          <div className="anim-fade-up" style={{ width: '100%', color: '#fff' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>👤</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t('ما اسمك؟', 'What\'s your name?')}</h2>
              <p style={{ fontSize: 14, opacity: .65 }}>{t('هذا ما سيراه طبيبك', 'This is what your clinician will see')}</p>
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('الاسم الكامل', 'Full name')}
              autoFocus
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '2px solid rgba(255,255,255,.3)', background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 16, outline: 'none', fontFamily: 'inherit', marginBottom: 24, boxSizing: 'border-box' }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.6)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,.3)'}
              onKeyDown={e => e.key === 'Enter' && name.trim() && next()}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={next} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.6)', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                {t('تخطّي', 'Skip')}
              </button>
              <button onClick={next} disabled={!name.trim()}
                style={{ flex: 2, padding: 14, borderRadius: 12, border: 'none', background: name.trim() ? L : 'rgba(255,255,255,.2)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                {t('التالي ←', 'Next →')}
              </button>
            </div>
          </div>
        )}

        {/* MOOD */}
        {step === 'mood' && (
          <div className="anim-fade-up" style={{ width: '100%', color: '#fff' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>{MOODS[mood - 1]}</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{t('كيف تشعر الآن؟', 'How are you feeling right now?')}</h2>
              <p style={{ fontSize: 14, opacity: .65 }}>{t('هذا سيكون أول تسجيل لمزاجك', 'This will be your first mood log')}</p>
            </div>
            <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 16, padding: '20px', marginBottom: 24 }}>
              <input type="range" min={1} max={10} value={mood} onChange={e => setMood(Number(e.target.value))}
                style={{ width: '100%', accentColor: O, cursor: 'pointer', marginBottom: 8 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: .6 }}>
                <span>{t('سيئ', 'Very low')}</span>
                <span style={{ fontWeight: 700, fontSize: 18, opacity: 1 }}>{mood}/10</span>
                <span>{t('رائع', 'Amazing')}</span>
              </div>
            </div>
            <button onClick={next} style={{ width: '100%', padding: 15, borderRadius: 12, border: 'none', background: O, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t('التالي ←', 'Next →')}
            </button>
          </div>
        )}

        {/* READY */}
        {step === 'ready' && (
          <div className="anim-fade-up" style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🌱</div>
            <h2 style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>{t('أنت جاهز!', "You're all set!")}</h2>
            <p style={{ fontSize: 15, opacity: .75, lineHeight: 1.75, marginBottom: 32 }}>
              {t(
                `${name.trim() ? `أهلاً ${name.trim().split(' ')[0]}، ` : ''}منصتك جاهزة. سجّل مزاجك يومياً، وأكمل التقييمات التي يعيّنها طبيبك، واطّلع على المكتبة المجانية في أي وقت.`,
                `${name.trim() ? `Hi ${name.trim().split(' ')[0]}, ` : ''}Your platform is ready. Log your mood daily, complete assessments your clinician assigns, and explore the library anytime.`
              )}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 28 }}>
              {[
                { icon: '📊', ar: 'تسجيل المزاج يومياً', en: 'Daily mood logging' },
                { icon: '📋', ar: 'تقييمات سريرية', en: 'Clinical assessments' },
                { icon: '💬', ar: 'تواصل مع طبيبك', en: 'Message your clinician' },
                { icon: '📚', ar: 'مكتبة مجانية', en: 'Free library' },
              ].map(item => (
                <div key={item.en} style={{ background: 'rgba(255,255,255,.1)', borderRadius: 12, padding: '12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, opacity: .85 }}>{t(item.ar, item.en)}</span>
                </div>
              ))}
            </div>
            <button onClick={complete} disabled={saving}
              style={{ width: '100%', padding: 16, borderRadius: 14, border: 'none', background: saving ? 'rgba(255,255,255,.2)' : O, color: '#fff', fontWeight: 800, fontSize: 16, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', boxShadow: saving ? 'none' : `0 6px 24px ${O}55` }}>
              {saving ? t('جارٍ الإعداد...', 'Setting up...') : t('ادخل للمنصة ←', 'Enter the platform →')}
            </button>
          </div>
        )}
      </div>

      {/* Step dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '20px', flexShrink: 0 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ width: i === currentIdx ? 20 : 6, height: 6, borderRadius: 3, background: i <= currentIdx ? '#fff' : 'rgba(255,255,255,.25)', transition: 'all .3s' }} />
        ))}
      </div>
    </div>
  );
}
