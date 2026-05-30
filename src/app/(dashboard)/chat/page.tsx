'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const L='#1D6296', O='#F3650A', Y='#12273C';
const GPT_URL='https://chatgpt.com/g/g-67f9886be73c8191a85e6f9f3bc71f9d-mrkz-lrfh-lkhdmt-lsh-lnfsy-vwelfare';

const STARTERS_AR = [
  'كيف أتعامل مع نوبات القلق؟',
  'ما الفرق بين الحزن والاكتئاب؟',
  'كيف أشرح لعائلتي ما أمر به؟',
  'ما هو العلاج المعرفي السلوكي؟',
  'كيف أحسّن نوعية نومي؟',
];
const STARTERS_EN = [
  'How do I manage anxiety attacks?',
  'What is the difference between sadness and depression?',
  'How do I explain my condition to my family?',
  'What is cognitive-behavioural therapy?',
  'How can I improve my sleep quality?',
];

export default function ChatPage() {
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/sign-in'); return; }
      supabase.from('profiles').select('language_preference').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) setLang(data.language_preference as 'ar'|'en');
          setLoading(false);
        });
    });
  }, []);

  const t = (ar:string, en:string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const starters = lang === 'ar' ? STARTERS_AR : STARTERS_EN;

  function launch(starter?:string) {
    const url = starter
      ? `${GPT_URL}?message=${encodeURIComponent(starter)}`
      : GPT_URL;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div dir={dir} style={{ minHeight:'100vh', background:'#f4f6f9' }}>

      {/* Hero header */}
      <div style={{
        background:`linear-gradient(160deg, ${Y} 0%, #163858 60%, ${L} 100%)`,
        padding:'28px 20px 32px', position:'relative', overflow:'hidden',
      }}>
        {/* Background rings */}
        {[180,280,400].map((r,i) => (
          <div key={i} style={{
            position:'absolute', borderRadius:'50%',
            border:'1px solid rgba(255,255,255,.04)',
            width:r, height:r,
            top:'50%', left:'50%',
            transform:`translate(-50%,-50%)`,
            pointerEvents:'none',
          }}/>
        ))}

        <div style={{ position:'relative', zIndex:1 }}>
          {/* Icon */}
          <div style={{
            width:60, height:60, borderRadius:18,
            background:`linear-gradient(135deg, rgba(255,255,255,.18), rgba(255,255,255,.06))`,
            border:'1.5px solid rgba(255,255,255,.2)',
            display:'flex', alignItems:'center', justifyContent:'center',
            marginBottom:16, backdropFilter:'blur(8px)',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <circle cx="9" cy="10" r=".6" fill="white"/>
              <circle cx="12" cy="10" r=".6" fill="white"/>
              <circle cx="15" cy="10" r=".6" fill="white"/>
            </svg>
          </div>

          <h1 style={{ fontSize:26, fontWeight:900, color:'#fff', margin:'0 0 6px', letterSpacing:'-.02em' }}>
            {t('وافي AI','Wafi AI')}
          </h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.55)', margin:'0 0 20px', lineHeight:1.6, maxWidth:340 }}>
            {t(
              'مساعدك الذكي المتخصص في الصحة النفسية — يتحدث العربية بطلاقة ويجيب على أسئلتك الطبية والنفسية.',
              'Your specialised Arabic mental health AI — fluent in Arabic, trained on clinical psychiatry.',
            )}
          </p>

          {/* Capabilities chips */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:24 }}>
            {[
              t('استشارة نفسية','Mental health Q&A'),
              t('شرح التشخيصات','Diagnosis explanations'),
              t('نصائح للعائلة','Family support tips'),
              t('شرح الأدوية','Medication info'),
            ].map(chip => (
              <span key={chip} style={{
                fontSize:11, padding:'4px 10px', borderRadius:100,
                background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.75)',
                border:'1px solid rgba(255,255,255,.15)', fontWeight:600,
              }}>{chip}</span>
            ))}
          </div>

          {/* Primary CTA */}
          <button onClick={() => launch()} style={{
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            width:'100%', padding:'15px', borderRadius:16, border:'none',
            background:`linear-gradient(135deg, ${O}, #e05a08)`,
            color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer',
            fontFamily:'inherit',
            boxShadow:`0 4px 20px rgba(243,101,10,.4)`,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            {t('ابدأ محادثة مع وافي','Start a conversation with Wafi')}
          </button>
          <p style={{ fontSize:10, color:'rgba(255,255,255,.3)', textAlign:'center', margin:'8px 0 0' }}>
            {t('يفتح في تطبيق ChatGPT — مجاناً','Opens in ChatGPT — free to use')}
          </p>
        </div>
      </div>

      {/* Conversation starters */}
      <div style={{ padding:'20px 16px' }}>
        <span style={{ display:'block', fontSize:11, fontWeight:700, color:'#9ca3af',
          letterSpacing:'.07em', textTransform:'uppercase', marginBottom:12 }}>
          {t('ابدأ بسؤال','Ask something')}
        </span>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {starters.map((s, i) => (
            <button key={i} onClick={() => launch(s)} style={{
              width:'100%', padding:'13px 16px', borderRadius:14,
              border:'1.5px solid #e5e7eb', background:'#fff',
              color:Y, fontSize:13, fontWeight:500, cursor:'pointer',
              fontFamily:'inherit', textAlign: dir==='rtl' ? 'right' : 'left',
              display:'flex', alignItems:'center', justifyContent:'space-between', gap:10,
              transition:'border-color .15s, box-shadow .15s',
              boxShadow:'0 1px 4px rgba(0,0,0,.04)',
            }}>
              <span style={{ lineHeight:1.5 }}>{s}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={L} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ flexShrink:0 }}>
                <path d={dir==='rtl' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'}/>
              </svg>
            </button>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{
          marginTop:20, padding:'14px 16px', borderRadius:14,
          background:'#fffbeb', border:'1px solid #fde68a',
        }}>
          <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
            <p style={{ fontSize:12, color:'#92400e', lineHeight:1.65, margin:0 }}>
              {t(
                'وافي AI أداة تثقيفية ومعلوماتية فقط. لا يُعدّ بديلاً عن الاستشارة الطبية المتخصصة. في حالات الطوارئ أو الأزمات، تواصل مع طبيبك مباشرةً.',
                'Wafi AI is for educational and informational purposes only. It is not a substitute for professional medical advice. In emergencies or crises, contact your clinician directly.',
              )}
            </p>
          </div>
        </div>

        {/* Powered by note */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
          gap:8, marginTop:16, padding:'10px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style={{ fontSize:11, color:'#9ca3af' }}>
            {t('مشغّل بواسطة ChatGPT · يتطلب حساب OpenAI مجاني','Powered by ChatGPT · Requires a free OpenAI account')}
          </span>
        </div>
      </div>
    </div>
  );
}
