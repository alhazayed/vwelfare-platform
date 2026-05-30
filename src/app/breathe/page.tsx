'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Phase = 'inhale'|'hold-in'|'exhale'|'hold-out'|'idle';

interface Exercise {
  key: string;
  name_ar: string;
  name_en: string;
  desc_ar: string;
  desc_en: string;
  benefit_ar: string;
  benefit_en: string;
  phases: { phase: Phase; duration: number; label_ar: string; label_en: string }[];
  cycles: number;
  color: string;
  icon: string;
}

const EXERCISES: Exercise[] = [
  {
    key:'box', name_ar:'التنفس الصندوقي', name_en:'Box breathing',
    desc_ar:'تقنية تستخدمها قوات الطوارئ لتهدئة الجهاز العصبي فوراً',
    desc_en:'Technique used by emergency responders to calm the nervous system instantly',
    benefit_ar:'ممتاز للقلق الحاد وصعوبة التركيز',
    benefit_en:'Excellent for acute anxiety and difficulty concentrating',
    phases:[
      { phase:'inhale',   duration:4, label_ar:'استنشق',   label_en:'Inhale' },
      { phase:'hold-in',  duration:4, label_ar:'احبس',     label_en:'Hold' },
      { phase:'exhale',   duration:4, label_ar:'ازفر',     label_en:'Exhale' },
      { phase:'hold-out', duration:4, label_ar:'احبس',     label_en:'Hold' },
    ],
    cycles:4, color:'#1D6296', icon:'⬜',
  },
  {
    key:'478', name_ar:'4-7-8', name_en:'4-7-8 breathing',
    desc_ar:'الزفير الممتد ينشّط العصب المبهم ويحدث استجابة تهدئة عميقة',
    desc_en:'The extended exhale activates the vagus nerve and produces deep calming',
    benefit_ar:'مثالي للنوم وتخفيف القلق المزمن',
    benefit_en:'Ideal for sleep and relieving chronic anxiety',
    phases:[
      { phase:'inhale',   duration:4, label_ar:'استنشق',   label_en:'Inhale' },
      { phase:'hold-in',  duration:7, label_ar:'احبس',     label_en:'Hold' },
      { phase:'exhale',   duration:8, label_ar:'ازفر ببطء',label_en:'Slow exhale' },
    ],
    cycles:4, color:'#7c3aed', icon:'🌙',
  },
  {
    key:'sigh', name_ar:'الزفير المزدوج', name_en:'Physiological sigh',
    desc_ar:'شهيق مزدوج ثم زفير بطيء — الأسرع علمياً لتقليل الإجهاد الفوري',
    desc_en:'Double inhale then slow exhale — scientifically the fastest stress reducer',
    benefit_ar:'أسرع طريقة لتهدئة الجهاز العصبي',
    benefit_en:'Fastest way to calm the nervous system',
    phases:[
      { phase:'inhale',   duration:2, label_ar:'استنشق',       label_en:'Inhale' },
      { phase:'hold-in',  duration:1, label_ar:'استنشق ثانية', label_en:'Sniff again' },
      { phase:'exhale',   duration:6, label_ar:'ازفر ببطء جداً',label_en:'Long slow exhale' },
    ],
    cycles:5, color:'#16a34a', icon:'😮‍💨',
  },
  {
    key:'belly', name_ar:'التنفس البطني', name_en:'Belly breathing',
    desc_ar:'إعادة تدريب الجهاز التنفسي على النمط الصحيح الأساسي',
    desc_en:'Retraining the respiratory system to its healthy baseline pattern',
    benefit_ar:'مثالي كممارسة يومية لخفض القلق الأساسي',
    benefit_en:'Ideal as a daily practice to lower baseline anxiety',
    phases:[
      { phase:'inhale',   duration:4, label_ar:'استنشق من البطن', label_en:'Belly inhale' },
      { phase:'exhale',   duration:6, label_ar:'ازفر',             label_en:'Exhale' },
    ],
    cycles:6, color:'#ea580c', icon:'🌊',
  },
];

export default function BreathePage() {
  const [lang, setLang]       = useState<'ar'|'en'>('ar');
  const [view, setView]       = useState<'menu'|'session'|'done'>('menu');
  const [exercise, setExercise] = useState<Exercise>(EXERCISES[0]);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle]       = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const [scale, setScale]       = useState(0.55);
  const [totalSessions, setTotalSessions] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const router = useRouter();

  useEffect(() => { const s = parseInt(localStorage.getItem('vw_breathe_sessions') ?? '0'); setTotalSessions(s); }, []);

  const t   = (ar:string, en:string) => lang==='ar' ? ar : en;
  const dir = lang==='ar' ? 'rtl' : 'ltr';

  const currentPhase  = exercise.phases[phaseIdx];
  const isExpanding   = currentPhase?.phase === 'inhale';
  const isContracting = currentPhase?.phase === 'exhale';

  function clearTimers() {
    if (timerRef.current)    clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  const runPhase = useCallback((ex: Exercise, pIdx: number, cIdx: number) => {
    const ph = ex.phases[pIdx];
    if (!ph) return;
    setPhaseIdx(pIdx);
    setElapsed(0);
    setScale(ph.phase === 'inhale' ? 1.0 : ph.phase === 'exhale' ? 0.55 : undefined as unknown as number);

    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    timerRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!);
      const nextPIdx = pIdx + 1;
      if (nextPIdx < ex.phases.length) {
        runPhase(ex, nextPIdx, cIdx);
      } else {
        const nextCycle = cIdx + 1;
        if (nextCycle < ex.cycles) {
          setCycle(nextCycle);
          runPhase(ex, 0, nextCycle);
        } else {
          setView('done');
          const s = parseInt(localStorage.getItem('vw_breathe_sessions') ?? '0') + 1;
          localStorage.setItem('vw_breathe_sessions', String(s));
          setTotalSessions(s);
        }
      }
    }, ph.duration * 1000);
  }, []);

  function startSession(ex: Exercise) {
    setExercise(ex);
    setPhaseIdx(0);
    setCycle(0);
    setElapsed(0);
    setScale(0.55);
    setView('session');
    runPhase(ex, 0, 0);
  }

  function stopSession() {
    clearTimers();
    setView('menu');
    setPhaseIdx(0);
    setCycle(0);
    setElapsed(0);
    setScale(0.55);
  }

  useEffect(() => () => clearTimers(), []);

  // Dynamic circle scale
  const circleStyle: React.CSSProperties = {
    transition: `transform ${currentPhase?.duration ?? 1}s ease-in-out`,
    transform: `scale(${scale})`,
  };

  // ── MENU ──
  if (view === 'menu') return (
    <div dir={dir} style={{ minHeight:'100vh', background:'linear-gradient(180deg,#0f1f35 0%,#1a0533 100%)', padding:'0 0 40px', fontFamily:'Segoe UI,system-ui,sans-serif' }}>
      <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={() => router.back()} style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.12)', borderRadius:8, padding:'6px 14px', color:'rgba(255,255,255,.75)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          ← {t('رجوع','Back')}
        </button>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{t('مركز التنفس','Breathing Center')}</div>
          <div style={{ fontSize:10, color:'rgba(255,255,255,.4)' }}>Vwelfare</div>
        </div>
        <button onClick={() => setLang(l => l==='ar'?'en':'ar')} style={{ background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:100, padding:'5px 12px', color:'rgba(255,255,255,.65)', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
          {lang==='ar'?'EN':'عربي'}
        </button>
      </div>

      <div style={{ padding:'16px 20px 0', textAlign:'center', marginBottom:32 }}>
        <div style={{ fontSize:52, marginBottom:10 }}>🫁</div>
        <h1 style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:8 }}>
          {t('اختر تمرين التنفس','Choose your breathing exercise')}
        </h1>
        <p style={{ fontSize:14, color:'rgba(255,255,255,.5)', lineHeight:1.6, maxWidth:340, margin:'0 auto' }}>
          {t('كل تمرين يُنشّط الجهاز العصبي السمبثاوي بطريقة مختلفة. جرّب واكتشف ما يناسبك.','Each exercise activates the parasympathetic nervous system differently. Try and discover what works for you.')}
        </p>
        {totalSessions > 0 && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.12)', borderRadius:100, padding:'5px 14px', marginTop:14, fontSize:12, color:'rgba(255,255,255,.7)' }}>
            🫁 {totalSessions} {t('جلسة مكتملة','sessions completed')}
          </div>
        )}
      </div>

      <div style={{ padding:'0 20px', display:'flex', flexDirection:'column', gap:12, maxWidth:500, margin:'0 auto' }}>
        {EXERCISES.map(ex => (
          <div key={ex.key} onClick={() => startSession(ex)}
            style={{ background:'rgba(255,255,255,.05)', border:`1px solid ${ex.color}33`, borderRadius:18, padding:'18px 16px', cursor:'pointer', transition:'all .2s', display:'flex', gap:14, alignItems:'center' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background=`${ex.color}18`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background='rgba(255,255,255,.05)'; }}>
            <div style={{ width:54, height:54, borderRadius:14, background:`${ex.color}22`, border:`1px solid ${ex.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
              {ex.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:3 }}>{t(ex.name_ar, ex.name_en)}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.5, marginBottom:6 }}>{t(ex.desc_ar, ex.desc_en)}</div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:11, padding:'2px 10px', borderRadius:100, background:`${ex.color}20`, color:ex.color, border:`1px solid ${ex.color}44`, fontWeight:600 }}>
                  {ex.phases.map(p => p.duration).join('-')}
                </span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,.4)' }}>{ex.cycles} {t('دورات','cycles')}</span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>~{Math.round(ex.cycles * ex.phases.reduce((a,p) => a+p.duration, 0)/60)}{t(' دقيقة',' min')}</span>
              </div>
            </div>
            <div style={{ fontSize:22, flexShrink:0, color:ex.color }}>▶</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── SESSION ──
  if (view === 'session') return (
    <div dir={dir} style={{ height:'100vh', background:`linear-gradient(180deg,#0a0a1a,${exercise.color}22,#0a0a1a)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'Segoe UI,system-ui,sans-serif', position:'relative', overflow:'hidden', userSelect:'none' }}>

      {/* Ambient glow */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:400, height:400, borderRadius:'50%', background:`${exercise.color}14`, filter:'blur(80px)', pointerEvents:'none' }} />

      {/* Header */}
      <div style={{ position:'absolute', top:20, left:20, right:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <button onClick={stopSession} style={{ background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.15)', borderRadius:100, padding:'6px 16px', color:'rgba(255,255,255,.7)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
          {t('إيقاف','Stop')}
        </button>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', fontWeight:600 }}>
          {t(exercise.name_ar, exercise.name_en)} · {t(`دورة ${cycle+1}/${exercise.cycles}`,`Cycle ${cycle+1}/${exercise.cycles}`)}
        </div>
        <div style={{ width:60 }} />
      </div>

      {/* Breathing circle */}
      <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:280, height:280, marginBottom:32 }}>
        {/* Ripple rings */}
        {[0,1,2].map(i => (
          <div key={i} style={{ position:'absolute', width:'100%', height:'100%', borderRadius:'50%', border:`1px solid ${exercise.color}`, animation:`ripple 3s ${i}s ease-out infinite`, opacity:0.3 }} />
        ))}
        {/* Main circle */}
        <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:`radial-gradient(circle,${exercise.color}55,${exercise.color}22)`, border:`2px solid ${exercise.color}88`, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', ...circleStyle, willChange:'transform' }}>
          <div style={{ fontSize:44, marginBottom:4 }}>🫁</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,.7)', fontWeight:600 }}>{elapsed}</div>
        </div>
      </div>

      {/* Phase label */}
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:32, fontWeight:900, color:'#fff', marginBottom:8, letterSpacing:'-.02em', transition:'opacity .3s' }}>
          {t(currentPhase?.label_ar ?? '', currentPhase?.label_en ?? '')}
        </div>
        <div style={{ fontSize:18, color:'rgba(255,255,255,.5)', fontWeight:700 }}>
          {currentPhase?.duration ?? 0} {t('ثانية','seconds')}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ position:'absolute', bottom:40, left:40, right:40 }}>
        <div style={{ display:'flex', gap:6, justifyContent:'center', marginBottom:10 }}>
          {exercise.phases.map((p, i) => (
            <div key={i} style={{ height:4, flex:p.duration, borderRadius:2, background: i===phaseIdx ? exercise.color : 'rgba(255,255,255,.15)', transition:'background .3s' }} />
          ))}
        </div>
        <div style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,.3)' }}>
          {t(exercise.benefit_ar, exercise.benefit_en)}
        </div>
      </div>
    </div>
  );

  // ── DONE ──
  return (
    <div dir={dir} style={{ height:'100vh', background:'linear-gradient(180deg,#0a1628,#052e16)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'Segoe UI,system-ui,sans-serif', padding:'0 24px', textAlign:'center' }}>
      <div style={{ fontSize:64, marginBottom:16, animation:'unlock .5s ease both' }}>✅</div>
      <h2 style={{ fontSize:26, fontWeight:800, color:'#fff', marginBottom:8 }}>
        {t('أحسنت!','Well done!')}
      </h2>
      <p style={{ fontSize:15, color:'rgba(255,255,255,.65)', lineHeight:1.7, marginBottom:8, maxWidth:320 }}>
        {t(
          `أكملت ${exercise.cycles} دورات من ${t(exercise.name_ar, exercise.name_en)}.`,
          `You completed ${exercise.cycles} cycles of ${t(exercise.name_ar, exercise.name_en)}.`
        )}
      </p>
      <p style={{ fontSize:13, color:'rgba(255,255,255,.4)', marginBottom:32 }}>
        {t(`إجمالي الجلسات: ${totalSessions}`,`Total sessions: ${totalSessions}`)}
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:320 }}>
        <button onClick={() => startSession(exercise)}
          style={{ padding:14, borderRadius:12, border:'none', background:'#16a34a', color:'#fff', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
          {t('كرر التمرين','Repeat exercise')}
        </button>
        <button onClick={() => setView('menu')}
          style={{ padding:14, borderRadius:12, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.08)', color:'#fff', fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
          {t('تمرين آخر','Try another')}
        </button>
        <button onClick={() => router.push('/home')}
          style={{ padding:14, borderRadius:12, border:'none', background:'transparent', color:'rgba(255,255,255,.4)', fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
          {t('العودة للرئيسية','Back to home')}
        </button>
      </div>
    </div>
  );
}
