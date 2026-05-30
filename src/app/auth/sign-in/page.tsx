'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const L = '#1D6296', Y = '#12273C';

const QUOTES = [
  { ar: 'طلب المساعدة شجاعة، ليس ضعفاً.', en: 'Asking for help is courage, not weakness.' },
  { ar: 'الاعتراف بصعوبة المرور به هو الخطوة الأولى للتحسن.', en: 'Acknowledging difficulty is the first step to getting better.' },
  { ar: 'صحتك النفسية تستحق نفس الاهتمام الذي تعطيه لصحتك الجسدية.', en: 'Your mental health deserves the same attention as your physical health.' },
];

export default function SignIn() {
  const [lang, setLang]     = useState<'ar'|'en'>('ar');
  const [tab, setTab]       = useState<'password'|'magic'>('password');
  const [email, setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError]   = useState('');
  const [quoteI, setQuoteI] = useState(0);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    document.documentElement.lang  = lang;
    document.documentElement.dir   = lang === 'ar' ? 'rtl' : 'ltr';
    const iv = setInterval(() => setQuoteI(i => (i+1) % QUOTES.length), 5000);
    return () => clearInterval(iv);
  }, [lang]);

  const t = (ar:string, en:string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  async function handlePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    router.push('/home');
  }

  async function handleMagic(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setError('');
    const { error: err } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (err) { setError(err.message); setLoading(false); return; }
    setMessage(t('تم إرسال رابط الدخول. صالح لمدة 15 دقيقة. تحقق من بريدك.','Magic link sent. Valid for 15 minutes. Check your inbox.'));
    setLoading(false);
  }

  return (
    <div dir={dir} style={{ minHeight:'100vh', fontFamily:'Segoe UI,system-ui,sans-serif', display:'flex' }}>

      {/* Left brand panel — hidden on mobile */}
      <div className='hide-mobile' style={{ flex:'0 0 42%', background:`linear-gradient(160deg,${Y} 0%,#1a3a5c 50%,${L} 100%)`, padding:'48px 40px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
        {/* Background rings */}
        {[200,300,420].map((s,i) => <div key={i} style={{ position:'absolute', bottom:-s/2, ...(dir==='rtl'?{left:-s/2}:{right:-s/2}), width:s, height:s, borderRadius:'50%', border:'1px solid rgba(255,255,255,.06)', pointerEvents:'none' }} />)}

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:24, fontWeight:800, color:'#fff', marginBottom:4 }}>Vwelfare</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.5)' }}>{t('مركز الرفاه لخدمات الصحة النفسية','Mental Health Services Centre')}</div>
        </div>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ fontSize:40, marginBottom:20 }}>🧠</div>
          <blockquote style={{ margin:0, padding:0 }}>
            <p style={{ fontSize:18, fontWeight:600, color:'#fff', lineHeight:1.6, marginBottom:12, transition:'all .4s' }}>
              "{t(QUOTES[quoteI].ar, QUOTES[quoteI].en)}"
            </p>
          </blockquote>
          <div style={{ display:'flex', gap:6, marginTop:20 }}>
            {QUOTES.map((_,i) => <div key={i} style={{ width: i===quoteI?20:6, height:6, borderRadius:3, background:i===quoteI?'#fff':'rgba(255,255,255,.3)', transition:'all .3s' }} />)}
          </div>
        </div>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            {[{icon:'🔒',ar:'مشفّر',en:'Encrypted'},{icon:'🌐',ar:'عربي',en:'Arabic'},{icon:'🔬',ar:'سريري',en:'Clinical'}].map(b => (
              <div key={b.en} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.1)', borderRadius:100, padding:'5px 12px', fontSize:12, color:'rgba(255,255,255,.8)', border:'1px solid rgba(255,255,255,.12)' }}>
                {b.icon} {t(b.ar, b.en)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex:1, background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px', minHeight:'100vh' }}>
        <div style={{ width:'100%', maxWidth:400 }}>

          {/* Mobile-only brand header */}
          <div style={{ textAlign:'center', marginBottom:28, display:'none' }} className="mobile-brand">
            <div style={{ fontSize:22, fontWeight:800, color:Y }}>Vwelfare</div>
          </div>

          <div style={{ background:'#fff', borderRadius:20, border:'1px solid #e5e7eb', padding:28, boxShadow:'0 4px 24px rgba(0,0,0,.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <div>
                <h1 style={{ fontSize:20, fontWeight:800, color:Y, margin:0 }}>{t('مرحباً بك','Welcome back')}</h1>
                <p style={{ fontSize:13, color:'#9ca3af', margin:'4px 0 0' }}>{t('سجّل دخولك للمتابعة','Sign in to continue')}</p>
              </div>
              <button onClick={() => setLang(l => l==='ar'?'en':'ar')}
                style={{ fontSize:11, padding:'4px 12px', borderRadius:100, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', cursor:'pointer' }}>
                {lang==='ar'?'EN':'عربي'}
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:2, background:'#f3f4f6', borderRadius:10, padding:3, marginBottom:22 }}>
              {(['password','magic'] as const).map(tb => (
                <button key={tb} onClick={() => { setTab(tb); setError(''); setMessage(''); }}
                  style={{ flex:1, padding:'8px', borderRadius:8, border:'none', background:tab===tb?'#fff':'transparent', color:tab===tb?L:'#6b7280', fontWeight:tab===tb?700:500, fontSize:13, cursor:'pointer', transition:'all .2s', boxShadow:tab===tb?'0 1px 4px rgba(0,0,0,.08)':'none' }}>
                  {tb==='password' ? t('كلمة المرور','Password') : t('رابط آمن','Magic link')}
                </button>
              ))}
            </div>

            {/* Password form */}
            {tab==='password' && (
              <form onSubmit={handlePassword} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>{t('البريد الإلكتروني','Email address')}</label>
                  <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" placeholder="you@example.com" />
                </div>
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <label style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{t('كلمة المرور','Password')}</label>
                    <a href="/auth/forgot-password" style={{ fontSize:11, color:L, textDecoration:'none' }}>{t('نسيت؟','Forgot?')}</a>
                  </div>
                  <input className="field" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
                </div>
                {error && <div style={{ fontSize:13, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 12px' }}>{error}</div>}
                <button type="submit" disabled={loading}
                  style={{ padding:'13px', borderRadius:10, border:'none', background:loading?'#9ca3af':L, color:'#fff', fontWeight:700, fontSize:14, cursor:loading?'not-allowed':'pointer', transition:'background .2s' }}>
                  {loading ? t('جارٍ الدخول...','Signing in...') : t('دخول','Sign in')}
                </button>
              </form>
            )}

            {/* Magic link form */}
            {tab==='magic' && (
              <form onSubmit={handleMagic} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>{t('البريد الإلكتروني','Email address')}</label>
                  <input className="field" type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" placeholder="you@example.com" />
                </div>
                <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#166534' }}>
                  {t('سيُرسَل إليك رابط آمن صالح لمدة 15 دقيقة. لا تحتاج إلى كلمة مرور.','A secure link valid for 15 minutes will be sent to you. No password needed.')}
                </div>
                {error && <div style={{ fontSize:13, color:'#dc2626', background:'#fef2f2', border:'1px solid #fca5a5', borderRadius:8, padding:'10px 12px' }}>{error}</div>}
                {message && (
                  <div style={{ fontSize:13, color:'#166534', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:'12px', textAlign:'center', lineHeight:1.6 }}>
                    📧 {message}
                  </div>
                )}
                {!message && (
                  <button type="submit" disabled={loading}
                    style={{ padding:'13px', borderRadius:10, border:'none', background:loading?'#9ca3af':L, color:'#fff', fontWeight:700, fontSize:14, cursor:loading?'not-allowed':'pointer' }}>
                    {loading ? t('جارٍ الإرسال...','Sending...') : t('إرسال رابط الدخول','Send magic link')}
                  </button>
                )}
              </form>
            )}
          </div>

          {/* Invite notice */}
          <div style={{ marginTop:18, textAlign:'center', padding:'12px 16px', background:'rgba(29,98,150,.06)', borderRadius:12, border:'1px solid rgba(29,98,150,.12)' }}>
            <p style={{ fontSize:12, color:'#6b7280', margin:0, lineHeight:1.6 }}>
              {t('المنصة مخصصة للمرضى المدعوّين. إذا تلقّيت دعوة من طبيبك، ستجد الرابط في بريدك الإلكتروني.','Platform is for invited patients. If your clinician invited you, check your email for the invitation link.')}
            </p>
          </div>

          <p style={{ textAlign:'center', marginTop:16, fontSize:13 }}>
            <a href="/library" style={{ color:L, textDecoration:'none', fontWeight:500 }}>{t('تصفح المكتبة المجانية ←','Browse the free library ←')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
