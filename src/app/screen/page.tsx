'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const L = '#1D6296', O = '#F3650A', Y = '#12273C';

// ── Assessment data (hardcoded — no auth required) ────────────────────────────
const OPTIONS = [
  { value: 0, en: 'Not at all',           ar: 'إطلاقاً' },
  { value: 1, en: 'Several days',         ar: 'عدة أيام' },
  { value: 2, en: 'More than half the days', ar: 'أكثر من نصف الأيام' },
  { value: 3, en: 'Nearly every day',     ar: 'كل يوم تقريباً' },
];

const PHQ9 = [
  { id:'q1', en:'Little interest or pleasure in doing things',                                  ar:'فقدان الاهتمام أو المتعة في القيام بالأشياء',        safe:false },
  { id:'q2', en:'Feeling down, depressed, or hopeless',                                         ar:'الشعور بالإحباط أو الاكتئاب أو اليأس',              safe:false },
  { id:'q3', en:'Trouble falling or staying asleep, or sleeping too much',                      ar:'صعوبة في النوم أو الاستمرار فيه، أو النوم الزائد', safe:false },
  { id:'q4', en:'Feeling tired or having little energy',                                         ar:'الشعور بالتعب أو قلة الطاقة',                       safe:false },
  { id:'q5', en:'Poor appetite or overeating',                                                   ar:'ضعف الشهية للطعام أو الإفراط في الأكل',           safe:false },
  { id:'q6', en:'Feeling bad about yourself — or that you are a failure',                       ar:'الشعور بعدم الرضا عن نفسك أو أنك فاشل',            safe:false },
  { id:'q7', en:'Trouble concentrating on things',                                               ar:'صعوبة في التركيز على الأشياء',                     safe:false },
  { id:'q8', en:'Moving or speaking so slowly that others could have noticed, or being restless', ar:'التحرك أو الكلام ببطء شديد، أو الشعور بعدم الارتياح', safe:false },
  { id:'q9', en:'Thoughts that you would be better off dead, or of hurting yourself',           ar:'أفكار بأنك أفضل حالاً ميتاً أو إيذاء نفسك',         safe:true },
];

const GAD7 = [
  { id:'g1', en:'Feeling nervous, anxious, or on edge',                    ar:'الشعور بالتوتر أو القلق',                        safe:false },
  { id:'g2', en:'Not being able to stop or control worrying',              ar:'عدم القدرة على إيقاف القلق أو التحكم فيه',       safe:false },
  { id:'g3', en:'Worrying too much about different things',                ar:'القلق المفرط بشأن أشياء مختلفة',                safe:false },
  { id:'g4', en:'Trouble relaxing',                                         ar:'صعوبة في الاسترخاء',                            safe:false },
  { id:'g5', en:'Being so restless that it is hard to sit still',          ar:'القلق الشديد لدرجة صعوبة الجلوس',               safe:false },
  { id:'g6', en:'Becoming easily annoyed or irritable',                    ar:'سهولة الانزعاج أو التهيج',                      safe:false },
  { id:'g7', en:'Feeling afraid as if something awful might happen',       ar:'الشعور بالخوف كأن شيئاً فظيعاً سيحدث',         safe:false },
];

type Scale = 'PHQ9' | 'GAD7';

interface Band { label: string; color: string; bg: string; border: string; narrative_ar: string; narrative_en: string; }

const BANDS: Record<Scale, (score: number) => Band> = {
  PHQ9: (s) => {
    if (s <= 4)  return { label:'Minimal',           color:'#166534', bg:'#f0fdf4', border:'#86efac', narrative_ar:'أعراض ضئيلة أو معدومة. مزاجك يبدو مستقراً نسبياً. استمر في الاهتمام بنفسك.', narrative_en:'Minimal or no depressive symptoms. Your mood appears relatively stable. Keep taking care of yourself.' };
    if (s <= 9)  return { label:'Mild',               color:'#713f12', bg:'#fefce8', border:'#fde047', narrative_ar:'أعراض اكتئاب خفيفة. شائعة جداً وغالباً ترتبط بضغوط الحياة اليومية. يمكن إدارتها بخطوات بسيطة.', narrative_en:'Mild depressive symptoms — very common and often linked to daily stressors. Manageable with simple steps.' };
    if (s <= 14) return { label:'Moderate',           color:'#9a3412', bg:'#fff7ed', border:'#fdba74', narrative_ar:'أعراض اكتئاب متوسطة. هذا المستوى يؤثر على الحياة اليومية ويستحق متابعة متخصص.', narrative_en:'Moderate depressive symptoms affecting daily life. This level warrants professional attention.' };
    if (s <= 19) return { label:'Moderately severe',  color:'#7c2d12', bg:'#fef3f2', border:'#fca5a5', narrative_ar:'أعراض متوسطة إلى شديدة. يُنصح بشدة بالتحدث مع متخصص في الصحة النفسية في أقرب وقت.', narrative_en:'Moderately severe symptoms. Strongly recommended to speak with a mental health professional soon.' };
    return       { label:'Severe',                    color:'#991b1b', bg:'#fef2f2', border:'#fca5a5', narrative_ar:'أعراض اكتئاب شديدة. من المهم جداً التواصل مع متخصص في الصحة النفسية الآن.', narrative_en:'Severe depressive symptoms. It is very important to contact a mental health professional now.' };
  },
  GAD7: (s) => {
    if (s <= 4)  return { label:'Minimal',   color:'#166534', bg:'#f0fdf4', border:'#86efac', narrative_ar:'مستوى ضئيل من القلق. مهاراتك في إدارة الضغوط تبدو في حالة جيدة.', narrative_en:'Minimal anxiety. Your stress management skills appear to be in good shape.' };
    if (s <= 9)  return { label:'Mild',      color:'#713f12', bg:'#fefce8', border:'#fde047', narrative_ar:'قلق خفيف. شائع جداً. تقنيات التنفس وتنظيم اليوم يمكن أن تُحدث فرقاً ملحوظاً.', narrative_en:'Mild anxiety. Very common. Breathing techniques and daily structure can make a noticeable difference.' };
    if (s <= 14) return { label:'Moderate',  color:'#9a3412', bg:'#fff7ed', border:'#fdba74', narrative_ar:'قلق متوسط يؤثر على التركيز والنوم والعلاقات. يستحق متابعة متخصص.', narrative_en:'Moderate anxiety affecting concentration, sleep, and relationships. Worth professional follow-up.' };
    return       { label:'Severe',   color:'#991b1b', bg:'#fef2f2', border:'#fca5a5', narrative_ar:'قلق شديد. يُنصح بشدة بالتحدث مع متخصص في الصحة النفسية في أقرب وقت ممكن.', narrative_en:'Severe anxiety. Strongly recommended to speak with a mental health professional as soon as possible.' };
  },
};

// ── Shareable SVG card ────────────────────────────────────────────────────────
function buildShareSVG(scale: Scale, score: number, band: Band, lang: 'ar'|'en') {
  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const scaleName = scale === 'PHQ9' ? t('مقياس الاكتئاب PHQ-9','PHQ-9 Depression Scale') : t('مقياس القلق GAD-7','GAD-7 Anxiety Scale');
  const maxScore  = scale === 'PHQ9' ? 27 : 21;
  const pct       = Math.round((score / maxScore) * 100);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 220" width="400" height="220">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${Y}"/>
      <stop offset="100%" stop-color="${L}"/>
    </linearGradient>
    <clipPath id="clip"><rect width="400" height="220" rx="20"/></clipPath>
  </defs>
  <rect width="400" height="220" rx="20" fill="url(#bg)"/>
  <circle cx="340" cy="-20" r="110" fill="rgba(255,255,255,.04)"/>
  <circle cx="60"  cy="240" r="80"  fill="rgba(255,255,255,.03)"/>
  <text x="24" y="38" font-family="Arial,sans-serif" font-size="20" font-weight="800" fill="white">Vwelfare</text>
  <text x="24" y="56" font-family="Arial,sans-serif" font-size="11" fill="rgba(255,255,255,.5)">${t('فحص الصحة النفسية','Mental Health Check')}</text>
  <text x="24" y="96" font-family="Arial,sans-serif" font-size="13" fill="rgba(255,255,255,.7)">${scaleName}</text>
  <text x="24" y="148" font-family="Arial,sans-serif" font-size="72" font-weight="800" fill="white" opacity=".95">${score}</text>
  <text x="24" y="172" font-family="Arial,sans-serif" font-size="11" fill="rgba(255,255,255,.5)">${t(`من ${maxScore}`, `out of ${maxScore}`)}</text>
  <rect x="24" y="184" width="${Math.round(pct * 1.8)}" height="6" rx="3" fill="${band.color}" opacity=".9"/>
  <rect x="24" y="184" width="180" height="6" rx="3" fill="rgba(255,255,255,.12)"/>
  <text x="220" y="96" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="${band.color}" text-anchor="middle">${band.label}</text>
  <rect x="140" y="106" width="160" height="1" fill="rgba(255,255,255,.1)"/>
  <text x="220" y="135" font-family="Arial,sans-serif" font-size="11" fill="rgba(255,255,255,.65)" text-anchor="middle">${t('جرّب الفحص على','Check yours at')}</text>
  <text x="220" y="152" font-family="Arial,sans-serif" font-size="13" font-weight="600" fill="rgba(255,255,255,.9)" text-anchor="middle">vwelfare-platform.vercel.app</text>
  <text x="220" y="175" font-family="Arial,sans-serif" font-size="24" text-anchor="middle">${scale === 'PHQ9' ? '🧠' : '💭'}</text>
  <text x="390" y="213" font-family="Arial,sans-serif" font-size="9" fill="rgba(255,255,255,.3)" text-anchor="end">${t('ليس تشخيصاً. للاستخدام التوعوي فقط.','Not a diagnosis. For awareness only.')}</text>
  </svg>`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ScreenPage() {
  const [lang, setLang]     = useState<'ar'|'en'>('ar');
  const [view, setView]     = useState<'intro'|'question'|'result'>('intro');
  const [scale, setScale]   = useState<Scale>('PHQ9');
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [score, setScore]   = useState(0);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t   = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const items = scale === 'PHQ9' ? PHQ9 : GAD7;
  const item  = items[current];
  const total = items.length;
  const band  = BANDS[scale](score);
  const pct   = Math.round(((current + 1) / total) * 100);
  const selectedVal = responses[item?.id];

  function selectResponse(val: number) {
    setResponses(prev => ({ ...prev, [item.id]: val }));
  }

  function next() {
    if (current < total - 1) {
      setCurrent(c => c + 1);
    } else {
      const total_score = Object.values(responses).reduce((a, b) => a + b, 0);
      setScore(total_score);
      setView('result');
    }
  }

  function restart() {
    setView('intro'); setCurrent(0); setResponses({}); setScore(0); setCopied(false);
  }

  function downloadCard() {
    const svg = buildShareSVG(scale, score, band, lang);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `vwelfare-${scale}-result.svg`; a.click();
    URL.revokeObjectURL(url);
  }

  async function shareResult() {
    const text = lang === 'ar'
      ? `أجريت فحص ${scale === 'PHQ9' ? 'الاكتئاب PHQ-9' : 'القلق GAD-7'} على Vwelfare — حصلت على ${score} (${band.label}). جرّبه أنت أيضاً: vwelfare-platform.vercel.app/screen`
      : `I took the ${scale === 'PHQ9' ? 'PHQ-9 depression' : 'GAD-7 anxiety'} check on Vwelfare — scored ${score} (${band.label}). Try yours: vwelfare-platform.vercel.app/screen`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'My Vwelfare Mental Health Check', text, url: 'https://vwelfare-platform.vercel.app/screen' }); return; }
      catch {}
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  function whatsapp() {
    const text = lang === 'ar'
      ? `أجريت فحص ${scale === 'PHQ9' ? 'PHQ-9' : 'GAD-7'} على Vwelfare — حصلت على ${score} (${band.label}). جرّبه: vwelfare-platform.vercel.app/screen`
      : `I took the ${scale} check on Vwelfare — scored ${score} (${band.label}). Try yours: vwelfare-platform.vercel.app/screen`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  // ── INTRO VIEW ──────────────────────────────────────────────────────────────
  if (view === 'intro') return (
    <div dir={dir} style={{ minHeight:'100vh', background:`linear-gradient(160deg,${Y} 0%,#1a3a5c 60%,${L} 100%)`, display:'flex', flexDirection:'column', padding:'0 0 40px', fontFamily:'Segoe UI,system-ui,sans-serif' }}>

      {/* Nav */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px' }}>
        <button onClick={() => router.push('/')} style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:8, padding:'6px 14px', color:'rgba(255,255,255,.8)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          ← {t('الرئيسية','Home')}
        </button>
        <span style={{ fontSize:16, fontWeight:800, color:'#fff' }}>Vwelfare</span>
        <button onClick={() => setLang(l => l==='ar'?'en':'ar')} style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:100, padding:'5px 14px', color:'rgba(255,255,255,.75)', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
          {lang==='ar'?'EN':'عربي'}
        </button>
      </div>

      {/* Hero */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 24px', textAlign:'center', maxWidth:560, margin:'0 auto', width:'100%' }}>
        <div className="anim-float" style={{ fontSize:56, marginBottom:16 }}>🧭</div>
        <div style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,.5)', letterSpacing:'.1em', textTransform:'uppercase', marginBottom:14 }}>
          {t('فحص مجاني · لا يلزم تسجيل','Free check · No signup needed')}
        </div>
        <h1 style={{ fontSize:28, fontWeight:800, color:'#fff', lineHeight:1.3, marginBottom:14 }}>
          {t('كيف صحتك النفسية\nحقاً؟','How is your mental\nhealth, really?')}
        </h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,.7)', lineHeight:1.7, marginBottom:32 }}>
          {t(
            'أجب على بضعة أسئلة سريرية معتمدة واحصل على تقييم فوري. كل ذلك مجاني وبدون أي تسجيل.',
            'Answer a few validated clinical questions and get an instant assessment. Completely free with no registration required.'
          )}
        </p>

        {/* Scale selector */}
        <div style={{ display:'flex', gap:10, marginBottom:28, width:'100%', maxWidth:360 }}>
          {(['PHQ9','GAD7'] as Scale[]).map(sc => (
            <button key={sc} onClick={() => setScale(sc)}
              style={{ flex:1, padding:'14px 10px', borderRadius:14, border:`2px solid ${scale===sc?'rgba(255,255,255,.5)':'rgba(255,255,255,.15)'}`, background:scale===sc?'rgba(255,255,255,.2)':'rgba(255,255,255,.07)', color:'#fff', cursor:'pointer', textAlign:'center', transition:'all .2s', fontFamily:'inherit' }}>
              <div style={{ fontSize:24, marginBottom:5 }}>{sc==='PHQ9'?'🧠':'💭'}</div>
              <div style={{ fontWeight:700, fontSize:14 }}>{sc==='PHQ9'?'PHQ-9':'GAD-7'}</div>
              <div style={{ fontSize:11, opacity:.7, marginTop:3 }}>{sc==='PHQ9'?t('الاكتئاب','Depression'):t('القلق','Anxiety')}</div>
              <div style={{ fontSize:10, opacity:.5, marginTop:2 }}>{sc==='PHQ9'?t('9 أسئلة','9 questions'):t('7 أسئلة','7 questions')}</div>
            </button>
          ))}
        </div>

        <button onClick={() => { setCurrent(0); setResponses({}); setView('question'); }}
          style={{ width:'100%', maxWidth:360, padding:'15px', borderRadius:14, border:'none', background:O, color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', boxShadow:`0 6px 24px ${O}55`, transition:'all .2s', fontFamily:'inherit' }}>
          {t('ابدأ الفحص ←','Start check →')}
        </button>

        <p style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:16, lineHeight:1.5 }}>
          {t('هذا الفحص لأغراض توعوية فقط وليس تشخيصاً طبياً.','This check is for awareness only and is not a medical diagnosis.')}
        </p>
      </div>
    </div>
  );

  // ── QUESTION VIEW ────────────────────────────────────────────────────────────
  if (view === 'question') return (
    <div dir={dir} style={{ minHeight:'100vh', background:'#f9fafb', display:'flex', flexDirection:'column', fontFamily:'Segoe UI,system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #f3f4f6', padding:'12px 18px', display:'flex', alignItems:'center', gap:12, position:'sticky', top:0, zIndex:5 }}>
        <button onClick={() => current > 0 ? setCurrent(c=>c-1) : setView('intro')}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#9ca3af', padding:0, lineHeight:1, fontFamily:'inherit' }}>
          {lang==='ar'?'→':'←'}
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, fontWeight:600, color:L }}>
            {scale==='PHQ9'?t('مقياس الاكتئاب PHQ-9','PHQ-9 Depression Scale'):t('مقياس القلق GAD-7','GAD-7 Anxiety Scale')}
          </div>
          <div style={{ fontSize:11, color:'#9ca3af' }}>{t(`سؤال ${current+1} من ${total}`,`Question ${current+1} of ${total}`)}</div>
        </div>
        <span style={{ fontSize:13, fontWeight:700, color:L }}>{pct}%</span>
      </div>

      {/* Progress bar */}
      <div style={{ height:4, background:'#f3f4f6' }}>
        <div style={{ height:'100%', background:L, width:`${pct}%`, transition:'width .35s ease', borderRadius:'0 2px 2px 0' }} />
      </div>

      <div style={{ flex:1, padding:'28px 20px 100px', maxWidth:520, margin:'0 auto', width:'100%' }}>

        {/* Safety notice for PHQ-9 Q9 */}
        {item.safe && (
          <div className="scale-in" style={{ background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:14, padding:'14px 16px', marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#991b1b', marginBottom:6 }}>{t('ملاحظة مهمة','Important note')}</div>
            <div style={{ fontSize:12, color:'#7f1d1d', lineHeight:1.65 }}>
              {t(
                'إذا كانت لديك أفكار عن إيذاء نفسك، تحدث مع متخصص أو اتصل بخط دعم الأزمات. أنت لست وحدك.',
                'If you are having thoughts of harming yourself, please speak with a professional or contact a crisis line. You are not alone.'
              )}
            </div>
          </div>
        )}

        {/* Question */}
        <div key={item.id} className="scale-in" style={{ marginBottom:28 }}>
          <p style={{ fontSize:11, color:'#9ca3af', fontWeight:600, letterSpacing:'.05em', textTransform:'uppercase', marginBottom:14 }}>
            {t('خلال الأسبوعين الماضيين...','Over the past two weeks...')}
          </p>
          <h2 style={{ fontSize:19, fontWeight:700, color:Y, lineHeight:1.45, margin:0 }}>
            {lang==='ar' ? item.ar : item.en}
          </h2>
        </div>

        {/* Options */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {OPTIONS.map(opt => {
            const sel = selectedVal === opt.value;
            return (
              <button key={opt.value} onClick={() => selectResponse(opt.value)}
                style={{ padding:'15px 18px', borderRadius:14, border:`2px solid ${sel?L:'#e5e7eb'}`, background:sel?'#eff6ff':'#fff', color:sel?L:'#374151', fontWeight:sel?700:500, fontSize:15, cursor:'pointer', textAlign:lang==='ar'?'right':'left', transition:'all .15s', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:'inherit' }}>
                <span>{lang==='ar' ? opt.ar : opt.en}</span>
                <span style={{ marginLeft: lang==='ltr'?8:0, marginRight: lang==='rtl'?8:0, fontSize:18, opacity:sel?1:.25 }}>{sel?'✓':'○'}</span>
              </button>
            );
          })}
        </div>

        {/* Next button — appears after selection */}
        {selectedVal !== undefined && (
          <button onClick={next} className="anim-fade-up"
            style={{ marginTop:24, width:'100%', padding:16, borderRadius:14, border:'none', background: current < total-1 ? L : O, color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', boxShadow:`0 4px 20px ${current < total-1 ? L : O}44`, transition:'all .2s', fontFamily:'inherit' }}>
            {current < total-1 ? t('التالي →','Next →') : t('عرض النتائج ✦','See results ✦')}
          </button>
        )}
      </div>
    </div>
  );

  // ── RESULT VIEW ──────────────────────────────────────────────────────────────
  if (view === 'result') return (
    <div dir={dir} style={{ minHeight:'100vh', background:'#f9fafb', fontFamily:'Segoe UI,system-ui,sans-serif' }}>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #f3f4f6', padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={restart} style={{ background:'none', border:'none', cursor:'pointer', color:L, fontSize:13, fontWeight:600, padding:0, fontFamily:'inherit' }}>
          {t('← إجراء فحص جديد','← Take another check')}
        </button>
        <button onClick={() => setLang(l => l==='ar'?'en':'ar')} style={{ fontSize:11, padding:'4px 10px', borderRadius:100, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', cursor:'pointer', fontFamily:'inherit' }}>
          {lang==='ar'?'EN':'عربي'}
        </button>
      </div>

      <div style={{ maxWidth:520, margin:'0 auto', padding:'24px 20px 60px' }}>

        {/* Score card */}
        <div className="scale-in" style={{ background:`linear-gradient(135deg,${Y},#1a3a5c,${L})`, borderRadius:22, padding:'28px 24px', color:'#fff', marginBottom:16, textAlign:'center', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.05)' }} />
          <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', opacity:.6, marginBottom:12 }}>
            {scale==='PHQ9'?t('مقياس الاكتئاب PHQ-9','PHQ-9 Depression Scale'):t('مقياس القلق GAD-7','GAD-7 Anxiety Scale')}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:18, marginBottom:16 }}>
            <div>
              <div style={{ fontSize:64, fontWeight:900, lineHeight:1, color:'#fff' }}>{score}</div>
              <div style={{ fontSize:13, opacity:.6 }}>{t(`من ${scale==='PHQ9'?27:21}`,`out of ${scale==='PHQ9'?27:21}`)}</div>
            </div>
            <div style={{ width:1, height:60, background:'rgba(255,255,255,.15)' }} />
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.2 }}>{band.label}</div>
              <div style={{ fontSize:11, opacity:.6, marginTop:4 }}>{t('مستوى الشدة','Severity level')}</div>
            </div>
          </div>
          {/* Bar */}
          <div style={{ background:'rgba(255,255,255,.15)', borderRadius:4, height:8, overflow:'hidden' }}>
            <div style={{ height:'100%', background:'rgba(255,255,255,.8)', width:`${Math.round((score/(scale==='PHQ9'?27:21))*100)}%`, borderRadius:4, transition:'width 1s ease' }} />
          </div>
        </div>

        {/* Severity badge */}
        <div style={{ background:band.bg, border:`1.5px solid ${band.border}`, borderRadius:14, padding:'16px 18px', marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:600, color:band.color, letterSpacing:'.05em', textTransform:'uppercase', marginBottom:8 }}>
            {t('ماذا يعني هذا؟','What does this mean?')}
          </div>
          <p style={{ fontSize:14, color: band.color === '#166534' ? '#374151' : band.color, lineHeight:1.75, margin:0 }}>
            {t(band.narrative_ar, band.narrative_en)}
          </p>
        </div>

        {/* Disclaimer */}
        <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:12, padding:'12px 14px', marginBottom:20, fontSize:12, color:'#6b7280', lineHeight:1.6 }}>
          <strong style={{ color:'#374151' }}>{t('تنويه مهم:','Important:')}</strong>{' '}
          {t(
            'هذا الفحص أداة توعوية فقط وليس تشخيصاً طبياً. النتائج لا تُغني عن استشارة متخصص في الصحة النفسية.',
            'This screen is an awareness tool only and not a medical diagnosis. Results do not replace consultation with a mental health professional.'
          )}
        </div>

        {/* Share section */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:18, padding:'18px', marginBottom:14 }}>
          <div style={{ fontSize:14, fontWeight:700, color:Y, marginBottom:6 }}>
            {t('هل تعرف أحداً قد يحتاج هذا؟','Know someone who might need this?')}
          </div>
          <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.6, marginBottom:16 }}>
            {t(
              'شارك الفحص مع شخص تهتم بصحته. لا يحتاج لتسجيل ومجاني تماماً.',
              'Share this check with someone you care about. No signup required, completely free.'
            )}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={shareResult}
              style={{ width:'100%', padding:'12px', borderRadius:12, border:'none', background:L, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}>
              {copied ? `✓ ${t('تم النسخ!','Copied!')}` : `🔗 ${t('شارك نتيجتك','Share your result')}`}
            </button>
            <button onClick={whatsapp}
              style={{ width:'100%', padding:'12px', borderRadius:12, border:'none', background:'#16a34a', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}>
              📱 {t('مشاركة عبر واتساب','Share on WhatsApp')}
            </button>
            <button onClick={downloadCard}
              style={{ width:'100%', padding:'12px', borderRadius:12, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontWeight:600, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}>
              ↓ {t('تنزيل البطاقة','Download card')}
            </button>
          </div>
        </div>

        {/* Platform CTA */}
        <div style={{ background:`linear-gradient(135deg,${Y},${L})`, borderRadius:18, padding:'22px 20px', textAlign:'center', color:'#fff' }}>
          <div style={{ fontSize:28, marginBottom:10 }}>🌱</div>
          <h3 style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>
            {t('تابع صحتك النفسية مع طبيبك','Track your mental health with your clinician')}
          </h3>
          <p style={{ fontSize:13, opacity:.8, lineHeight:1.65, marginBottom:18 }}>
            {t(
              'المنصة تربطك بطبيبك، تتابع مزاجك يومياً، وتوفر تقييمات سريرية منتظمة. مخصصة للمرضى المدعوّين.',
              'The platform connects you with your clinician, tracks your mood daily, and provides regular clinical assessments. For invited patients.'
            )}
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={() => window.open('/library','_blank')}
              style={{ padding:'10px 20px', borderRadius:10, border:'1.5px solid rgba(255,255,255,.35)', background:'rgba(255,255,255,.12)', color:'#fff', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              {t('تصفح المكتبة المجانية','Browse free library')}
            </button>
            <button onClick={() => window.open('/auth/sign-in','_blank')}
              style={{ padding:'10px 20px', borderRadius:10, border:'none', background:O, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              {t('تسجيل الدخول','Sign in')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return null;
}
