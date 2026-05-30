'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

interface CMSSection {
  section_key: string;
  is_visible: boolean;
  display_order: number;
  config: Record<string, string>;
}

const L='#1D6296', O='#F3650A', Y='#12273C';

/* ── Scroll reveal hook ─────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ── Animated mesh background ───────────────────────── */
function MeshBg() {
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      {[
        { s:500, l:'30%', t:'20%', c:'rgba(29,98,150,.35)', an:'mesh1 18s ease-in-out infinite' },
        { s:600, l:'60%', t:'50%', c:'rgba(18,39,60,.4)',   an:'mesh2 22s ease-in-out infinite' },
        { s:400, l:'10%', t:'60%', c:'rgba(243,101,10,.12)',an:'mesh3 14s ease-in-out infinite' },
      ].map((b,i) => (
        <div key={i} style={{ position:'absolute', left:b.l, top:b.t, width:b.s, height:b.s, borderRadius:'50%', background:b.c, filter:'blur(80px)', animation:b.an, willChange:'transform' }} />
      ))}
    </div>
  );
}

/* ── Stats counter ──────────────────────────────────── */
function Counter({ end, suffix='' }: { end:number; suffix?:string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let start = 0;
      const step = end / 40;
      const iv = setInterval(() => {
        start = Math.min(start + step, end);
        setVal(Math.round(start));
        if (start >= end) clearInterval(iv);
      }, 30);
      obs.disconnect();
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const QUOTES = [
  { text_ar: 'طلب المساعدة شجاعة، ليس ضعفاً.', text_en: 'Asking for help is courage, not weakness.' },
  { text_ar: 'الاعتناء بصحتك النفسية بنفس أهمية الاعتناء بصحتك الجسدية.', text_en: 'Mental health care is as important as physical health care.' },
  { text_ar: 'لا تحارب وحيداً — نحن هنا معك.', text_en: "You don't have to fight alone — we are here with you." },
];

const STEPS = [
  { num:'01', icon:'🧭', ar:'اكتشف وضعك الحالي', en:'Discover where you are', sub_ar:'أجرِ فحصاً مجانياً في 3 دقائق. لا تسجيل، لا تكلفة.', sub_en:'Take a free 3-minute check. No signup, no cost.' },
  { num:'02', icon:'🩺', ar:'تواصل مع متخصص', en:'Connect with a specialist', sub_ar:'طبيبك يرى نتائجك مباشرة ويضع خطة علاجية لك.', sub_en:'Your clinician sees your results directly and builds a care plan.' },
  { num:'03', icon:'📊', ar:'تابع تقدمك يومياً', en:'Track your daily progress', sub_ar:'مزاج، طاقة، قلق، نوم — كل يوم تزداد معرفتك بنفسك.', sub_en:'Mood, energy, anxiety, sleep — every day you understand yourself better.' },
  { num:'04', icon:'🌱', ar:'انجز واشترك', en:'Achieve and share', sub_ar:'سلسلة أيام، رؤى شخصية، وبطاقة تقدم قابلة للمشاركة.', sub_en:'Streaks, personal insights, and a shareable progress card.' },
];

const FEATURES = [
  { icon:'📋', grad:'linear-gradient(135deg,#1D6296,#0d4a78)', ar:'تقييمات سريرية معتمدة بالعربية', en:'Validated clinical scales in Arabic', sub_ar:'PHQ-9 وGAD-7 وغيرها — مُعيَّنة من طبيبك', sub_en:'PHQ-9, GAD-7 and more — assigned by your clinician' },
  { icon:'🫁', grad:'linear-gradient(135deg,#7c3aed,#5b21b6)', ar:'مركز التنفس والتأمل', en:'Breathing & mindfulness center', sub_ar:'تقنيات تنفس موجَّهة تقطع دورة القلق في دقيقتين', sub_en:'Guided breathing techniques that interrupt anxiety in 2 minutes' },
  { icon:'🤖', grad:'linear-gradient(135deg,#059669,#047857)', ar:'وافي — مساعد AI ثنائي اللغة', en:'Wafi — bilingual AI assistant', sub_ar:'اسأل عن حالتك بالعربية أو الإنجليزية في أي وقت', sub_en:'Ask about your condition in Arabic or English at any time' },
  { icon:'💊', grad:'linear-gradient(135deg,#dc2626,#b91c1c)', ar:'مراقبة الدواء والتفاعلات', en:'Medication & interaction monitoring', sub_ar:'DrugBank يرصد التفاعلات الخطرة ويبلّغ طبيبك فوراً', sub_en:'DrugBank detects dangerous interactions and alerts your clinician immediately' },
  { icon:'📓', grad:'linear-gradient(135deg,#ca8a04,#92400e)', ar:'مذكرات يومية بتوجيه CBT', en:'CBT-guided daily journaling', sub_ar:'30 سؤالاً علاجياً يتبدل يومياً', sub_en:'30 therapeutic prompts rotating daily' },
  { icon:'🔒', grad:'linear-gradient(135deg,#374151,#111827)', ar:'خصوصية وتشفير كامل', en:'Full privacy & encryption', sub_ar:'لا تُشارَك بياناتك مع أحد دون إذنك الصريح', sub_en:'Your data is never shared without your explicit consent' },
];

interface Article { id:string; category:string; title_ar:string; title_en:string; body_ar:string; body_en:string; }
const CAT_ACCENT: Record<string,string> = { anxiety:L, depression:'#7c3aed', sleep:'#ca8a04', stress:'#ea580c', relationships:'#16a34a', stigma_culture:'#dc2626' };
const CAT_ICON:   Record<string,string> = { anxiety:'🧠', depression:'🌧️', sleep:'🌙', stress:'🔥', relationships:'💚', stigma_culture:'🛡️' };

export default function LandingPage() {
  const [lang, setLang]     = useState<'ar'|'en'>('ar');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [articles, setArticles]     = useState<Article[]>([]);
  const [quoteI, setQuoteI] = useState(0);
  const [sections, setSections] = useState<Record<string, CMSSection>>({});
  const router = useRouter();
  const supabase = createClient();

  useReveal();

  useEffect(() => {
    supabase.auth.getUser().then(({ data:{ user } }) => setIsLoggedIn(!!user));
    supabase.from('content_articles').select('id,category,title_ar,title_en,body_ar,body_en')
      .eq('status','published').order('published_at',{ ascending:false }).limit(3)
      .then(({ data }) => setArticles(data ?? []));
    // Fetch CMS section visibility from admin panel
    supabase.from('cms_sections').select('section_key,is_visible,display_order,config')
      .then(({ data }) => {
        if (data) {
          const map: Record<string, CMSSection> = {};
          data.forEach(s => { map[s.section_key] = s; });
          setSections(map);
        }
      });
    document.documentElement.lang = lang;
    document.documentElement.dir  = lang==='ar'?'rtl':'ltr';
    const iv = setInterval(() => setQuoteI(i => (i+1) % QUOTES.length), 4500);
    return () => clearInterval(iv);
  }, [lang]);

  const t   = (ar:string, en:string) => lang==='ar' ? ar : en;
  const dir = lang==='ar' ? 'rtl' : 'ltr';
  // CMS: section visible by default if not yet loaded from DB
  const vis = (key: string) => sections[key]?.is_visible !== false;
  const cfg = (key: string, field: string, fallback: string) =>
    sections[key]?.config?.[field] || fallback;
  const excerpt = (b:string) => b.split('\n\n').find(p=>!p.startsWith('##'))?.slice(0,100)+'…';

  return (
    <div dir={dir} style={{ fontFamily:"'Segoe UI',system-ui,-apple-system,sans-serif", overflowX:'hidden', background:'#0a1628' }}>

      {/* ── STICKY NAV ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, padding:'0 5%', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(10,22,40,.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:22, fontWeight:900, color:'#fff', letterSpacing:'-.5px' }}>Vwelfare</span>
          <span style={{ fontSize:9, color:'rgba(255,255,255,.4)', fontWeight:500, paddingTop:3, letterSpacing:'.04em' }}>MENTAL HEALTH</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }} className='landing-nav-links'>
          {[{ ar:'فحص مجاني 🧭', en:'Free check', href:'/screen' }, { ar:'المكتبة', en:'Library', href:'/library' }, { ar:'التنفس', en:'Breathe', href:'/breathe' }].map(l => (
            <button key={l.href} onClick={() => router.push(l.href)}
              style={{ fontSize:13, color:'rgba(255,255,255,.65)', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
              {t(l.ar, l.en)}
            </button>
          ))}
          <button onClick={() => setLang(l => l==='ar'?'en':'ar')}
            style={{ fontSize:11, padding:'4px 12px', borderRadius:100, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.7)', cursor:'pointer', fontFamily:'inherit' }}>
            {lang==='ar'?'EN':'عربي'}
          </button>
          <button onClick={() => router.push(isLoggedIn?'/home':'/auth/sign-in')}
            style={{ fontSize:13, padding:'8px 20px', borderRadius:9, border:'none', background:L, color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>
            {isLoggedIn ? t('لوحتي','Dashboard') : t('دخول','Sign in')}
          </button>
        </div>
        {/* Mobile: show only sign-in button */}
        <div className="mobile-nav-only" style={{ display:'none', alignItems:'center', gap:8 }}>
          <button onClick={() => setLang(l => l==='ar'?'en':'ar')}
            style={{ fontSize:11, padding:'4px 10px', borderRadius:100, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.7)', cursor:'pointer', fontFamily:'inherit' }}>
            {lang==='ar'?'EN':'عربي'}
          </button>
          <button onClick={() => router.push(isLoggedIn?'/home':'/auth/sign-in')}
            style={{ fontSize:13, padding:'7px 16px', borderRadius:8, border:'none', background:L, color:'#fff', cursor:'pointer', fontWeight:700, fontFamily:'inherit' }}>
            {isLoggedIn ? t('لوحتي','↗') : t('دخول','↗')}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:'100vh', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 5% 60px', overflow:'hidden', background:`linear-gradient(180deg,${Y} 0%,#0f1f35 50%,#0d1b2e 100%)` }}>
        <MeshBg />
        <div className='landing-hero-grid' className='hero-grid' style={{ maxWidth:1100, width:'100%', position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'1fr 400px', gap:60, alignItems:'center' }}>
          {/* Text */}
          <div>
            <div className="anim-fade-up" style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.12)', borderRadius:100, padding:'6px 16px', fontSize:12, color:'rgba(255,255,255,.75)', marginBottom:24, backdropFilter:'blur(8px)' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 8px #4ade80', display:'inline-block', flexShrink:0 }} />
              {t('منصة الصحة النفسية العربية الأولى','The leading Arabic mental health platform')}
            </div>

            <h1 className="anim-fade-up delay-100" style={{ fontSize:'clamp(30px,4.5vw,56px)', fontWeight:900, lineHeight:1.2, marginBottom:20, color:'#fff' }}>
              {t(cfg('hero','headline_ar','ابدأ رحلتك نحو'), cfg('hero','headline_en','Begin your journey'))}<br />
              <span className="gradient-lapis">{t('الصحة النفسية الحقيقية','to genuine mental health')}</span>
            </h1>

            <p className="anim-fade-up delay-200" style={{ fontSize:16, color:'rgba(255,255,255,.65)', lineHeight:1.8, maxWidth:500, marginBottom:36 }}>
              {t(
                cfg('hero','subtext_ar','تقييمات سريرية معتمدة، تتبع يومي للمزاج، مذكرات موجَّهة، ومساعد AI ثنائي اللغة — كل ذلك في منصة واحدة آمنة ومخصصة للمجتمع العربي.'),
                cfg('hero','subtext_en','Validated clinical assessments, daily mood tracking, guided journaling, and a bilingual AI assistant — all in one secure platform built for the Arab world.')
              )}
            </p>

            {/* Rotating quote */}
            <div className="anim-fade-up delay-300" style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, padding:'14px 18px', marginBottom:32, minHeight:54 }}>
              <span style={{ fontSize:18, marginRight: lang==='ltr'?8:0, marginLeft: lang==='rtl'?8:0, opacity:.6 }}>"</span>
              <span style={{ fontSize:14, color:'rgba(255,255,255,.8)', fontStyle:'italic', lineHeight:1.6 }}>
                {t(QUOTES[quoteI].text_ar, QUOTES[quoteI].text_en)}
              </span>
            </div>

            <div className="anim-fade-up delay-400" style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              <button onClick={() => router.push(isLoggedIn?'/home':'/auth/sign-in')}
                style={{ padding:'14px 32px', borderRadius:12, border:'none', background:O, color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', fontFamily:'inherit', boxShadow:`0 6px 28px ${O}55` }}>
                {isLoggedIn ? t('الذهاب للوحتي ←','Go to dashboard →') : t('ابدأ الآن ←','Start now →')}
              </button>
              <button onClick={() => router.push('/screen')}
                style={{ padding:'14px 28px', borderRadius:12, border:'1.5px solid rgba(255,255,255,.25)', background:'rgba(255,255,255,.07)', color:'#fff', fontWeight:600, fontSize:15, cursor:'pointer', fontFamily:'inherit', backdropFilter:'blur(8px)' }}>
                {t('فحص مجاني 🧭','Free check 🧭')}
              </button>
            </div>
          </div>

          {/* Visual: Wellness orbit */}
          <div className="anim-fade-up delay-300 landing-hero-orbit" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg viewBox="0 0 360 360" width="100%" style={{ maxWidth:360 }} xmlns="http://www.w3.org/2000/svg">
              {/* Rings */}
              {[150,115,80].map((r,i) => <circle key={i} cx="180" cy="180" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={i===0?1:0.5} />)}
              {/* Gradient def */}
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#1D6296" stopOpacity=".45"/>
                  <stop offset="100%" stopColor="#1D6296" stopOpacity="0"/>
                </radialGradient>
              </defs>
              <circle cx="180" cy="180" r="85" fill="url(#glow)" />
              {/* Center */}
              <circle cx="180" cy="180" r="55" fill="rgba(29,98,150,.25)" stroke="rgba(29,98,150,.5)" strokeWidth="1.5"/>
              <text x="180" y="188" textAnchor="middle" fontSize="32" fill="white">🧠</text>
              {/* Orbiting features */}
              {[
                { deg:0,   label:'PHQ-9 ✓', fill:'rgba(29,98,150,.8)' },
                { deg:60,  label:'GAD-7 ✓',  fill:'rgba(124,58,237,.7)' },
                { deg:120, label:'🤖 AI',     fill:'rgba(5,150,105,.7)' },
                { deg:180, label:'📊 Mood',   fill:'rgba(243,101,10,.7)' },
                { deg:240, label:'🫁 Breathe',fill:'rgba(139,92,246,.7)' },
                { deg:300, label:'🔒 Safe',   fill:'rgba(55,65,81,.8)' },
              ].map(({ deg, label, fill }) => {
                const rad = (deg-90)*Math.PI/180;
                const x = 180 + 115*Math.cos(rad);
                const y = 180 + 115*Math.sin(rad);
                return (
                  <g key={deg}>
                    <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="24" fill={fill} stroke="rgba(255,255,255,.15)" strokeWidth="1"/>
                    <text x={x.toFixed(1)} y={(y+4).toFixed(1)} textAnchor="middle" fontSize="9" fill="white" fontWeight="600">{label}</text>
                  </g>
                );
              })}
              {/* Connecting lines */}
              {[0,60,120,180,240,300].map(deg => {
                const rad = (deg-90)*Math.PI/180;
                const x = 180 + 91*Math.cos(rad), y = 180 + 91*Math.sin(rad);
                const xi = 180 + 55*Math.cos(rad), yi = 180 + 55*Math.sin(rad);
                return <line key={deg} x1={xi.toFixed(1)} y1={yi.toFixed(1)} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="rgba(255,255,255,.12)" strokeWidth=".8" strokeDasharray="3 4"/>;
              })}
            </svg>
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{ position:'absolute', bottom:30, left:'50%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center', gap:6, color:'rgba(255,255,255,.3)', fontSize:11 }}>
          <span>{t('استكشف','Explore')}</span>
          <div style={{ width:1, height:36, background:'linear-gradient(to bottom,rgba(255,255,255,.25),transparent)', borderRadius:1 }} />
        </div>
      </section>

      {/* ── FOR WHOM (split) ── */}
      <section style={{ background:'#0f1f35', padding:'80px 5%', borderTop:'1px solid rgba(255,255,255,.06)' }}>
        <div className="reveal" style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontSize:32, fontWeight:800, color:'#fff', marginBottom:8 }}>{t('لمن هذه المنصة؟','Who is this for?')}</h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.5)', maxWidth:500, margin:'0 auto' }}>
            {t('رحلتان مختلفتان، منصة واحدة.','Two different journeys. One platform.')}
          </p>
        </div>
        <div className='landing-for-whom' style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:900, margin:'0 auto' }} className='who-grid'>
          {[
            { icon:'🙋', title_ar:'أبحث عن دعم نفسي', title_en:'I need mental health support', items_ar:['فحص مجاني للاكتئاب والقلق','تتبع مزاجي ونومي يومياً','مذكرات علاجية خاصة','دعم AI في أي وقت'], items_en:['Free depression & anxiety check','Daily mood & sleep tracking','Private therapeutic journal','AI support any time'], href:'/screen', cta_ar:'ابدأ بفحص مجاني', cta_en:'Start with a free check', color:'#1D6296' },
            { icon:'🩺', title_ar:'أنا طبيب أو معالج نفسي', title_en:"I'm a clinician or therapist", items_ar:['لوحة تحكم سريرية للمرضى','تعيين تقييمات PHQ-9/GAD-7','تتبع التقدم اليومي للمرضى','تنبيهات الأدوية والحالات الحرجة'], items_en:['Clinical patient dashboard','Assign PHQ-9/GAD-7 assessments','Track patient daily progress','Medication & crisis alerts'], href:'/auth/sign-in', cta_ar:'دخول البوابة السريرية', cta_en:'Access clinician portal', color:'#7c3aed' },
          ].map(card => (
            <div key={card.href} className="reveal" style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:20, padding:'28px 24px', backdropFilter:'blur(10px)' }}>
              <div style={{ fontSize:40, marginBottom:16 }}>{card.icon}</div>
              <h3 style={{ fontSize:20, fontWeight:700, color:'#fff', marginBottom:16 }}>{t(card.title_ar, card.title_en)}</h3>
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 24px', display:'flex', flexDirection:'column', gap:8 }}>
                {(lang==='ar'?card.items_ar:card.items_en).map(item => (
                  <li key={item} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(255,255,255,.65)' }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:card.color, flexShrink:0 }} />{item}
                  </li>
                ))}
              </ul>
              <button onClick={() => router.push(card.href)}
                style={{ width:'100%', padding:'12px', borderRadius:10, border:`1.5px solid ${card.color}`, background:`${card.color}20`, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
                {t(card.cta_ar, card.cta_en)} →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── JOURNEY STEPS ── */}
      <section style={{ background:`linear-gradient(180deg,#0f1f35,${Y})`, padding:'80px 5%' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontSize:12, fontWeight:600, color:O, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:12 }}>{t('الرحلة','The journey')}</div>
            <h2 style={{ fontSize:34, fontWeight:900, color:'#fff' }}>{t('من لا شيء إلى وضوح كامل','From uncertainty to complete clarity')}</h2>
          </div>
          <div className='landing-journey' style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24 }} className='journey-grid'>
            {STEPS.map((s, i) => (
              <div key={i} className="reveal" style={{ animationDelay:`${i*100}ms`, textAlign:'center', padding:'0 8px' }}>
                <div style={{ fontSize:36, marginBottom:12 }}>{s.icon}</div>
                <div style={{ fontSize:11, fontWeight:800, color:O, letterSpacing:'.1em', marginBottom:8 }}>{s.num}</div>
                <h3 style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:8, lineHeight:1.4 }}>{t(s.ar, s.en)}</h3>
                <p style={{ fontSize:13, color:'rgba(255,255,255,.5)', lineHeight:1.65, margin:0 }}>{t(s.sub_ar, s.sub_en)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background:Y, padding:'60px 5%', borderTop:'1px solid rgba(255,255,255,.08)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, textAlign:'center' }} className='landing-stats'>
          {[{ val:5, suf:'+', ar:'مقاييس سريرية معتمدة', en:'Validated clinical scales' }, { val:100, suf:'%', ar:'بيانات مشفّرة', en:'Encrypted data' }, { val:24, suf:'/7', ar:'وصول دائم', en:'Always available' }, { val:2, suf:' لغة', ar:'عربي وإنجليزي', en:'Arabic & English' }].map((s, i) => (
            <div key={i} className="reveal">
              <div style={{ fontSize:36, fontWeight:900, color:'#fff', lineHeight:1 }}>
                <Counter end={s.val} suffix={s.suf} />
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:5, fontWeight:500 }}>{t(s.ar, s.en)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ background:'#0a1628', padding:'80px 5%' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div className="reveal" style={{ textAlign:'center', marginBottom:48 }}>
            <h2 style={{ fontSize:34, fontWeight:900, color:'#fff' }}>{t('كل ما تحتاجه في مكان واحد','Everything you need in one place')}</h2>
          </div>
          <div className='landing-features-grid' className='landing-library' style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }} className='features-grid'>
            {FEATURES.map((f, i) => (
              <div key={i} className="reveal" style={{ borderRadius:18, overflow:'hidden', background:f.grad, padding:'24px 20px', cursor:'default', transition:'transform .2s' }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform='translateY(-4px) scale(1.01)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform=''}>
                <div style={{ fontSize:34, marginBottom:12 }}>{f.icon}</div>
                <div style={{ fontSize:15, fontWeight:700, color:'#fff', marginBottom:7 }}>{t(f.ar, f.en)}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,.7)', lineHeight:1.6 }}>{t(f.sub_ar, f.sub_en)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BREATHE CTA ── */}
      <section style={{ background:`linear-gradient(135deg,#2e1065,#4c1d95)`, padding:'72px 5%', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:400, height:400, borderRadius:'50%', background:'rgba(139,92,246,.12)', filter:'blur(60px)', pointerEvents:'none' }} />
        <div className="reveal" style={{ textAlign:'center', position:'relative', zIndex:1 }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🫁</div>
          <h2 style={{ fontSize:30, fontWeight:800, color:'#fff', marginBottom:10 }}>
            {t('تنفّس. الآن. مجاناً.','Breathe. Right now. For free.')}
          </h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.65)', lineHeight:1.7, maxWidth:440, margin:'0 auto 28px' }}>
            {t(
              'مركز تنفس موجَّه بالكامل — تقنيات سريرية معتمدة تقطع دورة القلق في دقيقتين. لا تسجيل.',
              'Fully guided breathing center — evidence-based techniques that interrupt the anxiety cycle in 2 minutes. No signup.'
            )}
          </p>
          <button onClick={() => router.push('/breathe')}
            style={{ padding:'14px 36px', borderRadius:12, border:'2px solid rgba(255,255,255,.4)', background:'rgba(255,255,255,.1)', color:'#fff', fontWeight:800, fontSize:16, cursor:'pointer', fontFamily:'inherit', backdropFilter:'blur(8px)' }}>
            {t('افتح مركز التنفس ←','Open breathing center →')}
          </button>
        </div>
      </section>

      {/* ── LIBRARY PREVIEW ── */}
      {articles.length > 0 && (
        <section style={{ background:'#0f1f35', padding:'80px 5%', borderTop:'1px solid rgba(255,255,255,.06)' }}>
          <div style={{ maxWidth:1000, margin:'0 auto' }}>
            <div className="reveal" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:32, flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:O, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:8 }}>{t('مفتوح للجميع','Free for everyone')}</div>
                <h2 style={{ fontSize:28, fontWeight:800, color:'#fff', margin:0 }}>{t('من مكتبة Vwelfare','From the Vwelfare library')}</h2>
              </div>
              <button onClick={() => router.push('/library')} style={{ padding:'9px 20px', borderRadius:9, border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.8)', fontWeight:600, fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                {t('كل المقالات →','All articles →')}
              </button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }} className='features-grid'>
              {articles.map(a => {
                const acc = CAT_ACCENT[a.category] ?? L;
                const ico = CAT_ICON[a.category]  ?? '📄';
                return (
                  <div key={a.id} className="reveal" onClick={() => router.push(`/library/${a.id}`)}
                    style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:16, overflow:'hidden', cursor:'pointer', transition:'all .2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background='rgba(255,255,255,.08)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background='rgba(255,255,255,.04)'; (e.currentTarget as HTMLDivElement).style.transform=''; }}>
                    <div style={{ height:4, background:acc }} />
                    <div style={{ padding:'16px' }}>
                      <div style={{ fontSize:24, marginBottom:10 }}>{ico}</div>
                      <h3 style={{ fontSize:14, fontWeight:700, color:'#fff', lineHeight:1.4, marginBottom:7 }}>
                        {lang==='ar' ? a.title_ar : a.title_en}
                      </h3>
                      <p style={{ fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.6, margin:'0 0 10px' }}>
                        {excerpt(lang==='ar' ? a.body_ar : a.body_en)}
                      </p>
                      <div style={{ fontSize:12, fontWeight:600, color:acc }}>{t('اقرأ →','Read →')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── SCREENING CTA (full orange) ── */}
      <section style={{ background:`linear-gradient(135deg,#c2410c,${O})`, padding:'72px 5%', textAlign:'center' }}>
        <div className="reveal" style={{ maxWidth:600, margin:'0 auto' }}>
          <div style={{ fontSize:50, marginBottom:16 }}>🧭</div>
          <h2 style={{ fontSize:32, fontWeight:900, color:'#fff', marginBottom:10 }}>
            {t('كيف صحتك النفسية حقاً؟','How is your mental health, really?')}
          </h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.8)', lineHeight:1.7, marginBottom:28 }}>
            {t('PHQ-9 وGAD-7 — مقاييس سريرية معتمدة. 3 دقائق. مجاني تماماً. لا تسجيل.','PHQ-9 and GAD-7 — validated clinical scales. 3 minutes. Completely free. No signup.')}
          </p>
          <button onClick={() => router.push('/screen')}
            style={{ padding:'16px 48px', borderRadius:14, border:'none', background:'#fff', color:O, fontWeight:900, fontSize:18, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 6px 32px rgba(0,0,0,.2)' }}>
            {t('ابدأ الفحص المجاني ←','Start the free check →')}
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#060e1a', padding:'32px 5%', borderTop:'1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, color:'#fff', marginBottom:3 }}>Vwelfare</div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.3)' }}>{t('مركز الرفاه · عمّان، الأردن','Mental Health Centre · Amman, Jordan')}</div>
          </div>
          <div style={{ display:'flex', gap:20 }}>
            {[{ ar:'المكتبة', en:'Library', href:'/library' }, { ar:'فحص مجاني', en:'Free check', href:'/screen' }, { ar:'التنفس', en:'Breathe', href:'/breathe' }, { ar:'دخول', en:'Sign in', href:'/auth/sign-in' }].map(l => (
              <a key={l.href} href={l.href} style={{ fontSize:12, color:'rgba(255,255,255,.35)', textDecoration:'none' }}>{t(l.ar, l.en)}</a>
            ))}
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.2)' }}>© 2026 Vwelfare</div>
        </div>
      </footer>
    </div>
  );
}
