'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const Y = '#12273C';

interface SeverityData {
  color: string;
  bg: string;
  border: string;
  narrative_ar: string;
  narrative_en: string;
  what_helps_ar: string;
  what_helps_en: string;
  next_ar: string;
  next_en: string;
}

const PHQ9_NARRATIVES: Record<string, SeverityData> = {
  Minimal: {
    color:'#166534', bg:'#f0fdf4', border:'#86efac',
    narrative_ar: 'درجتك تُشير إلى أعراض اكتئاب ضئيلة أو معدومة. هذا مؤشر إيجابي يعكس أن مزاجك مستقر نسبياً في الفترة الحالية.',
    narrative_en: 'Your score suggests minimal or no depressive symptoms. This is a positive indicator reflecting that your mood has been relatively stable recently.',
    what_helps_ar: 'الحفاظ على روتين النوم والنشاط البدني المنتظم يدعم استمرار هذه الحالة الإيجابية.',
    what_helps_en: 'Maintaining a sleep routine and regular physical activity helps sustain this positive state.',
    next_ar: 'استمر في تسجيل مزاجك للحفاظ على هذا الوضوح السريري.',
    next_en: 'Continue logging your mood to maintain this clinical clarity.',
  },
  Mild: {
    color:'#713f12', bg:'#fefce8', border:'#fde047',
    narrative_ar: 'درجتك تُشير إلى أعراض اكتئاب خفيفة. هذا النطاق شائع جداً ويعكس تأثير الضغوط اليومية على المزاج.',
    narrative_en: 'Your score suggests mild depressive symptoms. This range is very common and often reflects the impact of daily stressors on mood.',
    what_helps_ar: 'التنظيم السلوكي، تقليل الإجهاد، والنشاط البدني من أكثر ما يساعد في هذا النطاق.',
    what_helps_en: 'Behavioral activation, stress reduction, and physical activity are among the most helpful approaches at this level.',
    next_ar: 'ناقش هذه النتيجة مع طبيبك في جلستك القادمة.',
    next_en: 'Discuss this result with your clinician at your next session.',
  },
  Moderate: {
    color:'#9a3412', bg:'#fff7ed', border:'#fdba74',
    narrative_ar: 'درجتك تُشير إلى أعراض اكتئاب متوسطة الشدة. هذا النطاق يستدعي متابعة سريرية منتظمة ومناقشة خيارات العلاج مع طبيبك.',
    narrative_en: 'Your score suggests moderate depressive symptoms. This range warrants regular clinical follow-up and discussion of treatment options with your clinician.',
    what_helps_ar: 'العلاج المعرفي السلوكي فعّال جداً في هذا النطاق. قد يقترح طبيبك أيضاً خيارات دوائية.',
    what_helps_en: 'Cognitive-behavioural therapy is highly effective at this level. Your clinician may also discuss medication options.',
    next_ar: 'طبيبك يُراجع هذه النتيجة. يُنصح بمناقشتها في أقرب فرصة.',
    next_en: 'Your clinician is reviewing this result. An early discussion is recommended.',
  },
  'Moderately severe': {
    color:'#7c2d12', bg:'#fef3f2', border:'#fca5a5',
    narrative_ar: 'درجتك تُشير إلى أعراض اكتئاب متوسطة إلى شديدة. هذا المستوى يؤثر بشكل ملموس على الحياة اليومية ويستحق اهتماماً علاجياً مكثفاً.',
    narrative_en: 'Your score suggests moderately severe depressive symptoms. This level meaningfully impacts daily functioning and warrants intensive clinical attention.',
    what_helps_ar: 'مزيج من العلاج النفسي والدواء يُظهر أفضل النتائج في هذا النطاق.',
    what_helps_en: 'A combination of psychotherapy and medication shows the best outcomes at this level.',
    next_ar: 'تم إبلاغ طبيبك وسيتواصل معك. إذا كنت في ضائقة الآن، تواصل مباشرةً.',
    next_en: 'Your clinician has been notified and will follow up. If you are in distress now, contact them directly.',
  },
  Severe: {
    color:'#991b1b', bg:'#fef2f2', border:'#fca5a5',
    narrative_ar: 'درجتك تُشير إلى أعراض اكتئاب شديدة. من المهم جداً التواصل مع طبيبك في أقرب وقت ممكن.',
    narrative_en: 'Your score suggests severe depressive symptoms. It is very important to connect with your clinician as soon as possible.',
    what_helps_ar: 'العلاج الفوري ضروري. تواصل مع طبيبك أو خط الدعم النفسي إذا كنت تحتاج مساعدة عاجلة.',
    what_helps_en: 'Immediate treatment is necessary. Contact your clinician or a crisis line if you need urgent support.',
    next_ar: 'تم إبلاغ طبيبك. تواصل معه مباشرةً الآن.',
    next_en: 'Your clinician has been notified. Please contact them directly now.',
  },
};

const GAD7_NARRATIVES: Record<string, SeverityData> = {
  Minimal: { ...PHQ9_NARRATIVES.Minimal,
    narrative_ar: 'درجتك تُشير إلى مستوى ضئيل من القلق. مزاجك وإدارتك للضغوط تبدو في مستوى صحي جيد.',
    narrative_en: 'Your score suggests minimal anxiety levels. Your mood and stress management appear to be in a healthy range.' },
  Mild: { ...PHQ9_NARRATIVES.Mild,
    narrative_ar: 'درجتك تُشير إلى قلق خفيف. هذا المستوى شائع ويمكن إدارته بأدوات بسيطة كتقنيات التنفس والتنظيم اليومي.',
    narrative_en: 'Your score suggests mild anxiety. This level is common and manageable with simple tools like breathing techniques and daily structure.' },
  Moderate: { ...PHQ9_NARRATIVES.Moderate,
    narrative_ar: 'درجتك تُشير إلى قلق متوسط. يؤثر هذا المستوى على التركيز والنوم والعلاقات ويستحق متابعة سريرية.',
    narrative_en: 'Your score suggests moderate anxiety, which affects concentration, sleep, and relationships and warrants clinical follow-up.' },
  Severe: { ...PHQ9_NARRATIVES.Severe,
    narrative_ar: 'درجتك تُشير إلى قلق شديد. من المهم جداً مناقشة هذه النتيجة مع طبيبك بأسرع وقت.',
    narrative_en: 'Your score suggests severe anxiety. It is very important to discuss this result with your clinician as soon as possible.' },
};

export default function AssessmentResults() {
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [scaleName, setScaleName] = useState('');
  const [moodContext, setMoodContext] = useState<{avgMood:number; avgAnxiety:number; logCount:number} | null>(null);
  const router = useRouter();
  const params = useParams();
  const sp = useSearchParams();
  const score   = parseInt(sp.get('score') ?? '0');
  const band    = sp.get('band') ?? '';
  const risk    = sp.get('risk') === 'true';
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from('profiles').select('language_preference').eq('id', user.id).single();
      if (prof) setLang(prof.language_preference as 'ar'|'en');

      // Get scale name
      const { data: assignment } = await supabase.from('assessment_assignments')
        .select('assessment_definitions(code, name_en, name_ar)')
        .eq('id', params.id as string).single();
      if (assignment?.assessment_definitions) {
        const def = assignment.assessment_definitions as {code:string;name_en:string;name_ar:string};
        setScaleName(prof?.language_preference === 'ar' ? def.name_ar : def.name_en);
      }

      // Get mood context
      const from = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
      const { data: ml } = await supabase.from('mood_logs').select('mood_score, anxiety_score')
        .eq('patient_id', user.id).gte('log_date', from);
      if (ml && ml.length >= 3) {
        const avg = (ns: number[]) => ns.reduce((a,b) => a+b,0) / ns.length;
        setMoodContext({ avgMood: +avg(ml.map(l => l.mood_score)).toFixed(1), avgAnxiety: +avg(ml.map(l => l.anxiety_score)).toFixed(1), logCount: ml.length });
      }
    }
    load();
  }, []);

  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Pick narrative data
  const isGAD = band.includes('risk') || scaleName.includes('GAD') || scaleName.includes('القلق');
  const narratives = isGAD ? GAD7_NARRATIVES : PHQ9_NARRATIVES;
  const nd = narratives[band] ?? PHQ9_NARRATIVES.Moderate;

  // Mood context insight
  const contextInsight = moodContext
    ? band.includes('Moderate') || band.includes('Severe')
      ? moodContext.avgMood < 5
        ? t(`سجلات مزاجك تؤكد هذا — متوسط مزاجك ${moodContext.avgMood}/10 في الأسبوعين الماضيين.`,
            `Your mood logs confirm this — your average mood was ${moodContext.avgMood}/10 over the past two weeks.`)
        : t(`لكن سجلات مزاجك اليومية تُظهر تحسناً — متوسط مزاجك ${moodContext.avgMood}/10. هذا التناقض يستحق النقاش مع طبيبك.`,
            `However, your daily mood logs show improvement — your average is ${moodContext.avgMood}/10. This gap is worth discussing with your clinician.`)
      : null
    : null;

  return (
    <div dir={dir} style={{ minHeight:'100vh', background:'#f9fafb', paddingBottom:0 }}>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #f3f4f6', padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => router.push('/assessments')} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:22, lineHeight:1, padding:0 }}>
          {lang==='ar'?'→':'←'}
        </button>
        <span style={{ fontSize:14, fontWeight:600, color:Y }}>{t('نتيجة التقييم','Assessment result')}</span>
      </div>

      <div style={{ padding:'20px 18px' }}>

        {/* Score hero */}
        <div style={{ background:`linear-gradient(135deg, ${nd.color}22, ${nd.bg})`, border:`1.5px solid ${nd.border}`, borderRadius:20, padding:'24px 20px', textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:nd.color, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:12, opacity:.8 }}>
            {scaleName || t('نتيجة التقييم','Assessment result')}
          </div>
          <div style={{ width:90, height:90, borderRadius:'50%', background:'#fff', border:`3px solid ${nd.border}`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:`0 4px 20px ${nd.color}22` }}>
            <div style={{ fontSize:34, fontWeight:800, color:nd.color, lineHeight:1 }}>{score}</div>
          </div>
          <div style={{ display:'inline-block', padding:'5px 18px', borderRadius:100, background:nd.bg, border:`1px solid ${nd.border}`, fontSize:14, fontWeight:700, color:nd.color }}>
            {band}
          </div>
        </div>

        {/* Narrative block */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, padding:'18px', marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:10 }}>
            {t('ماذا يعني هذا؟','What does this mean?')}
          </div>
          <p style={{ fontSize:14, color:'#374151', lineHeight:1.8, margin:0 }}>
            {t(nd.narrative_ar, nd.narrative_en)}
          </p>
        </div>

        {/* Mood context insight */}
        {contextInsight && (
          <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:14, padding:'14px 16px', marginBottom:12, display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:18, flexShrink:0 }}>🔍</span>
            <p style={{ fontSize:13, color:'#1e40af', lineHeight:1.65, margin:0 }}>{contextInsight}</p>
          </div>
        )}

        {/* What helps */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, padding:'16px', marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:8 }}>
            {t('ما الذي يُفيد في هذا المستوى؟','What typically helps at this level?')}
          </div>
          <p style={{ fontSize:13, color:'#374151', lineHeight:1.75, margin:0 }}>
            {t(nd.what_helps_ar, nd.what_helps_en)}
          </p>
        </div>

        {/* High risk notice */}
        {risk && (
          <div style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:14, padding:'14px 16px', marginBottom:12, display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:18, flexShrink:0 }}>⚠️</span>
            <p style={{ fontSize:13, color:'#991b1b', lineHeight:1.65, margin:0 }}>
              {t('تم إبلاغ طبيبك بهذه النتيجة وسيتواصل معك. إذا كنت في ضائقة الآن، تواصل معه مباشرةً.','Your clinician has been notified and will follow up. If you are in distress right now, please contact them directly.')}
            </p>
          </div>
        )}

        {/* Next step */}
        <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:14, padding:'14px 16px', marginBottom:20, display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:18, flexShrink:0 }}>✓</span>
          <p style={{ fontSize:13, color:'#166534', lineHeight:1.5, margin:0 }}>
            {t(nd.next_ar, nd.next_en)}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <button onClick={() => router.push('/messages')}
            style={{ width:'100%', padding:13, borderRadius:12, border:'none', background:'#1D6296', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>
            {t('راسل طبيبك', 'Message your clinician')}
          </button>
          <button onClick={() => router.push('/home')}
            style={{ width:'100%', padding:13, borderRadius:12, border:'1px solid #e5e7eb', background:'#fff', color:'#374151', fontWeight:600, fontSize:14, cursor:'pointer' }}>
            {t('العودة للرئيسية', 'Back to home')}
          </button>
        </div>
      </div>
    </div>
  );
}
