'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const L='#1D6296', O='#F3650A', Y='#12273C';

interface MoodLog { log_date:string; mood_score:number; energy_score:number; anxiety_score:number; sleep_hours:number|null; }
interface Profile  { id:string; full_name_ar:string|null; full_name_en:string; language_preference:string; }

const avg = (ns:number[]) => ns.length ? ns.reduce((a,b)=>a+b,0)/ns.length : 0;

function calcStreak(logs:MoodLog[]) {
  if (!logs.length) return 0;
  const dates = new Set(logs.map(l=>l.log_date));
  const todayStr = new Date().toISOString().split('T')[0];
  const yestStr  = new Date(Date.now()-86400000).toISOString().split('T')[0];
  const start = dates.has(todayStr)?todayStr:dates.has(yestStr)?yestStr:null;
  if (!start) return 0;
  let streak=0, d=new Date(start+'T12:00:00');
  while (dates.has(d.toISOString().split('T')[0])) { streak++; d=new Date(d.getTime()-86400000); }
  return streak;
}

function calcWellbeing(logs:MoodLog[]) {
  const recent=logs.slice(-7);
  if (recent.length<3) return {score:null as null|number, change:null as null|number};
  const calc=(ls:MoodLog[])=>{
    const m=avg(ls.map(l=>l.mood_score));
    const e=avg(ls.map(l=>l.energy_score));
    const a=avg(ls.map(l=>l.anxiety_score));
    const sl=ls.filter(l=>l.sleep_hours!==null);
    const s=sl.length?avg(sl.map(l=>l.sleep_hours as number)):7;
    return Math.round(((m-1)/9)*100*0.35+((e-1)/9)*100*0.20+(1-(a-1)/9)*100*0.25+Math.min(100,Math.max(0,((Math.min(s,9)-3)/6)*100))*0.20);
  };
  const score=calc(recent);
  const prev=logs.slice(-14,-7);
  const change=prev.length>=3?score-calc(prev):null;
  return {score, change};
}

function buildInsights(logs:MoodLog[], t:(ar:string,en:string)=>string) {
  if (logs.length<5) return [] as {icon:string;text:string;positive:boolean}[];
  const insights:{icon:string;text:string;positive:boolean}[]=[];
  const now=new Date();
  const thisWk=logs.filter(l=>new Date(l.log_date)>=new Date(now.getTime()-7*86400000));
  const lastWk=logs.filter(l=>{const d=new Date(l.log_date);return d>=new Date(now.getTime()-14*86400000)&&d<new Date(now.getTime()-7*86400000);});
  if (thisWk.length>=3&&lastWk.length>=3) {
    const diff=+(avg(thisWk.map(l=>l.mood_score))-avg(lastWk.map(l=>l.mood_score))).toFixed(1);
    if (Math.abs(diff)>=0.4) insights.push({icon:diff>0?'📈':'📉',positive:diff>0,text:diff>0?t(`مزاجك أفضل بـ ${Math.abs(diff)} نقطة هذا الأسبوع`,`Mood up ${Math.abs(diff)} pts this week`):t(`مزاجك أقل بـ ${Math.abs(diff)} نقطة`,`Mood down ${Math.abs(diff)} pts this week`)});
  }
  if (logs.length>=8) {
    const DAY_AR=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const DAY_EN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const byDay:{[k:number]:number[]}={};
    logs.forEach(l=>{const d=new Date(l.log_date).getDay();if(!byDay[d])byDay[d]=[];byDay[d].push(l.mood_score);});
    const q=Object.entries(byDay).filter(([,v])=>v.length>=2);
    if (q.length>=3) {
      const best=q.sort((a,b)=>avg(b[1])-avg(a[1]))[0];
      insights.push({icon:'🌟',positive:true,text:t(`${DAY_AR[+best[0]]} هو يومك الأفضل مزاجاً`,`${DAY_EN[+best[0]]} is your best mood day`)});
    }
  }
  const withSleep=logs.filter(l=>l.sleep_hours!==null);
  if (withSleep.length>=5) {
    const s=avg(withSleep.map(l=>l.sleep_hours as number));
    if (s<6) insights.push({icon:'🌙',positive:false,text:t(`متوسط نومك ${s.toFixed(1)} ساعات — أقل من الموصى به`,`Avg sleep ${s.toFixed(1)} hrs — below recommended`)});
  }
  return insights.slice(0,3);
}

function WellbeingArc({score,change,lang}:{score:number|null;change:number|null;lang:'ar'|'en'}) {
  const t=(ar:string,en:string)=>lang==='ar'?ar:en;
  if (score===null) return (
    <div style={{textAlign:'center',padding:'12px 0'}}>
      <div style={{fontSize:12,color:'rgba(255,255,255,.4)',lineHeight:1.7}}>
        {t('سجّل مزاجك 3 أيام','Log mood 3 days')}<br/>
        {t('لتفعيل نتيجة العافية','to unlock your Wellbeing Score')}
      </div>
      <div style={{marginTop:10,display:'flex',gap:6,justifyContent:'center'}}>
        {[1,2,3].map(i=>(<div key={i} style={{width:8,height:8,borderRadius:'50%',background:'rgba(255,255,255,.2)'}}/>))}
      </div>
    </div>
  );
  const R=42, SW=7, C=2*Math.PI*R, ARC=C*0.75;
  const fill=(score/100)*ARC;
  const col=score>=70?'#4ade80':score>=45?'#fbbf24':'#f87171';
  const label=score>=70?t('ممتاز','Great'):score>=45?t('معتدل','Fair'):t('يحتاج اهتماماً','Needs care');
  return (
    <div style={{display:'flex',alignItems:'center',gap:16}}>
      <svg viewBox="0 0 110 110" width={104} height={104}>
        <circle cx="55" cy="55" r={R} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={SW}
          strokeDasharray={`${ARC} ${C-ARC}`} strokeLinecap="round" transform="rotate(135,55,55)"/>
        <circle cx="55" cy="55" r={R} fill="none" stroke={col} strokeWidth={SW}
          strokeDasharray={`${fill} ${C-fill}`} strokeLinecap="round" transform="rotate(135,55,55)"
          style={{transition:'stroke-dasharray 1.4s ease'}}/>
        <text x="55" y="52" textAnchor="middle" fill="white" fontSize="22" fontWeight="900">{score}</text>
        <text x="55" y="65" textAnchor="middle" fill="rgba(255,255,255,.4)" fontSize="9">/100</text>
      </svg>
      <div style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,.5)',marginBottom:3}}>
          {t('نتيجة العافية الأسبوعية','Weekly Wellbeing')}
        </div>
        <div style={{fontSize:22,fontWeight:900,color:col,lineHeight:1}}>{label}</div>
        {change!==null&&(
          <div style={{display:'flex',alignItems:'center',gap:4,marginTop:6}}>
            <span style={{fontSize:13,color:change>=0?'#4ade80':'#f87171',fontWeight:700}}>
              {change>=0?'↑':'↓'} {Math.abs(change)}
            </span>
            <span style={{fontSize:11,color:'rgba(255,255,255,.4)'}}>
              {t('من الأسبوع الماضي','vs last week')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonHeader() {
  return (
    <div style={{background:`linear-gradient(160deg,${Y} 0%,#1a3a5c 100%)`,padding:'52px 18px 18px'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <div className="skeleton-dark" style={{height:10,width:60,marginBottom:8}}/>
          <div className="skeleton-dark" style={{height:20,width:100}}/>
        </div>
        <div className="skeleton-dark" style={{width:38,height:38,borderRadius:'50%'}}/>
      </div>
      <div className="skeleton-dark" style={{height:100,borderRadius:16}}/>
    </div>
  );
}

function SkeletonCard({height=80}:{height?:number}) {
  return <div className="skeleton" style={{height,borderRadius:16,marginBottom:10}}/>;
}

export default function HomePage() {
  const [profile,setProfile]=useState<Profile|null>(null);
  const [logs,setLogs]=useState<MoodLog[]>([]);
  const [todayLog,setTodayLog]=useState<MoodLog|null|undefined>(undefined);
  const [pendingAss,setPendingAss]=useState(0);
  const [lang,setLang]=useState<'ar'|'en'>('ar');
  const [loading,setLoading]=useState(true);
  const router=useRouter();
  const supabase=createClient();
  const t=(ar:string,en:string)=>lang==='ar'?ar:en;
  const dir=lang==='ar'?'rtl':'ltr';

  const load=useCallback(async()=>{
    const {data:{user}}=await supabase.auth.getUser();
    if (!user) { router.push('/auth/sign-in'); return; }
    const [profRes, mlRes, todayRes, pendRes]=await Promise.all([
      supabase.from('profiles').select('id,full_name_ar,full_name_en,language_preference').eq('id',user.id).single(),
      supabase.from('mood_logs').select('log_date,mood_score,energy_score,anxiety_score,sleep_hours').eq('patient_id',user.id).gte('log_date',new Date(Date.now()-60*86400000).toISOString().split('T')[0]).order('log_date',{ascending:true}),
      supabase.from('mood_logs').select('log_date,mood_score,energy_score,anxiety_score,sleep_hours').eq('patient_id',user.id).eq('log_date',new Date().toISOString().split('T')[0]).maybeSingle(),
      supabase.from('assessment_assignments').select('id',{count:'exact',head:true}).eq('patient_id',user.id).eq('status','pending'),
    ]);
    if (profRes.data) { setProfile(profRes.data); setLang(profRes.data.language_preference as 'ar'|'en'); }
    setLogs(mlRes.data??[]);
    setTodayLog(todayRes.data??null);
    setPendingAss(pendRes.count??0);
    setLoading(false);
  },[]);

  useEffect(()=>{load();},[]);

  const streak=calcStreak(logs);
  const {score:wellScore,change:wellChange}=calcWellbeing(logs);
  const insights=buildInsights(logs,t);
  const firstName=(lang==='ar'?profile?.full_name_ar??profile?.full_name_en:profile?.full_name_en)?.split(' ')[0]??'…';
  const initials=(profile?.full_name_en??'?').split(' ').map((w:string)=>w[0]).slice(0,2).join('');
  const hour=new Date().getHours();
  const greeting=hour<12?t('صباح الخير','Good morning'):hour<17?t('مساء الخير','Good afternoon'):t('مساء النور','Good evening');

  const first14=logs.slice(0,14); const last14=logs.slice(-14);
  const moodDiff=logs.length>=14?+(avg(last14.map(l=>l.mood_score))-avg(first14.map(l=>l.mood_score))).toFixed(1):0;

  async function shareCard() {
    const text=lang==='ar'
      ?`سلسلتي ${streak} يوم 🔥 | نتيجة العافية ${wellScore??'—'}/100 | vwelfare-platform.vercel.app`
      :`My ${streak}-day streak 🔥 | Wellbeing ${wellScore??'—'}/100 | vwelfare-platform.vercel.app`;
    if (navigator.share) await navigator.share({title:'My Vwelfare Progress',text});
    else { await navigator.clipboard.writeText(text); alert(t('تم نسخ النص!','Copied!')); }
  }

  const QUICK=[
    {href:'/assessments',icon:'📋',ar:'التقييمات',en:'Assessments',bg:'#f5f3ff',fg:'#5b21b6',badge:pendingAss>0?pendingAss:null},
    {href:'/messages',   icon:'💬',ar:'الرسائل',   en:'Messages',   bg:'#eff6ff',fg:'#1D6296',badge:null},
    {href:'/medications',icon:'💊',ar:'الأدوية',   en:'Medications', bg:'#fff7ed',fg:'#c2410c',badge:null},
    {href:'/journal',    icon:'📓',ar:'المذكرات',  en:'Journal',     bg:'#f0fdf4',fg:'#166534',badge:null},
  ];

  return (
    <div dir={dir} style={{minHeight:'100vh',background:'#f4f6f9',fontFamily:'inherit'}}>

      {/* Header */}
      {loading ? <SkeletonHeader/> : (
        <div className="page-hero" style={{background:`linear-gradient(160deg,${Y} 0%,#1a3a5c 100%)`,
          padding:'20px 18px 18px',overflow:'hidden',position:'relative'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:160,height:160,
            borderRadius:'50%',background:'rgba(255,255,255,.04)'}}/>
          <div style={{position:'absolute',bottom:-20,left:20,width:80,height:80,
            borderRadius:'50%',background:'rgba(255,255,255,.03)'}}/>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',
            marginBottom:18,position:'relative',zIndex:1}}>
            <div>
              <p style={{fontSize:11,color:'rgba(255,255,255,.45)',margin:0}}>{greeting}</p>
              <h1 style={{fontSize:22,fontWeight:800,color:'#fff',margin:'2px 0 0'}}>{firstName}</h1>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {streak>0&&(
                <div style={{display:'flex',alignItems:'center',gap:4,background:'rgba(255,255,255,.12)',
                  borderRadius:100,padding:'4px 10px',border:'1px solid rgba(255,255,255,.15)'}}>
                  <span style={{fontSize:14}}>🔥</span>
                  <span style={{fontSize:12,fontWeight:700,color:'#fff'}}>{streak}</span>
                </div>
              )}
              <div onClick={()=>router.push('/profile')}
                style={{width:38,height:38,borderRadius:'50%',background:'rgba(255,255,255,.15)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,
                  fontSize:13,color:'#fff',cursor:'pointer',border:'2px solid rgba(255,255,255,.2)'}}>
                {initials||'…'}
              </div>
            </div>
          </div>
          <div style={{background:'rgba(255,255,255,.08)',borderRadius:18,padding:'16px',
            backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,.1)',position:'relative',zIndex:1}}>
            <WellbeingArc score={wellScore} change={wellChange} lang={lang}/>
          </div>
        </div>
      )}

      <div style={{padding:'14px 16px'}}>

        {/* Milestone banner */}
        {!loading&&streak>0&&streak%7===0&&(
          <div className="anim-fade-up" style={{background:`linear-gradient(135deg,${O},#f59e0b)`,
            borderRadius:16,padding:'13px 16px',marginBottom:12,color:'#fff',
            display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:26}}>🎉</span>
            <div>
              <div style={{fontWeight:700,fontSize:14}}>{t(`${streak} يوماً متتالياً!`,`${streak}-day streak!`)}</div>
              <div style={{fontSize:12,opacity:.85}}>{t('أنت تبني عادة صحية حقيقية','Building a real healthy habit')}</div>
            </div>
          </div>
        )}

        {/* Mood CTA */}
        {loading ? <SkeletonCard height={96}/> : todayLog===null ? (
          <div className="anim-fade-up tap-scale" onClick={()=>router.push('/mood')}
            style={{background:`linear-gradient(135deg,${L},#0d4a78)`,borderRadius:20,
              padding:'18px',marginBottom:12,color:'#fff',cursor:'pointer',
              boxShadow:'0 4px 20px rgba(29,98,150,.35)'}}>
            <p style={{fontSize:11,opacity:.55,margin:'0 0 3px'}}>{t('اليوم','Today')}</p>
            <h2 style={{fontSize:17,fontWeight:700,margin:'0 0 14px',lineHeight:1.35}}>
              {t('كيف حالك اليوم؟','How are you feeling today?')}
            </h2>
            <div style={{display:'inline-flex',alignItems:'center',gap:6,
              background:'rgba(255,255,255,.18)',borderRadius:100,padding:'7px 16px',
              fontSize:13,fontWeight:700,border:'1px solid rgba(255,255,255,.2)'}}>
              {t('سجّل مزاجك الآن','Log mood now')} ✦
            </div>
          </div>
        ) : (
          <div className="anim-fade-up tap-scale" onClick={()=>router.push('/mood')}
            style={{background:'#f0fdf4',border:'1.5px solid #86efac',borderRadius:16,
              padding:'13px 15px',marginBottom:12,cursor:'pointer'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:'#4ade80',
                display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l5 5L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{flex:1}}>
                <p style={{fontWeight:700,color:'#166534',fontSize:14,margin:0}}>
                  {t('سجّلت مزاجك اليوم','Mood logged today')}
                </p>
                <p style={{fontSize:12,color:'#16a34a',margin:0}}>
                  {t(`مزاج ${(todayLog as MoodLog).mood_score}/10 · طاقة ${(todayLog as MoodLog).energy_score}/10`,
                    `${(todayLog as MoodLog).mood_score}/10 mood · ${(todayLog as MoodLog).energy_score}/10 energy`)}
                </p>
              </div>
              <span style={{fontSize:12,color:'#16a34a',fontWeight:600,flexShrink:0}}>
                {t('تحديث','Update')} →
              </span>
            </div>
          </div>
        )}

        {/* Insights */}
        {!loading&&insights.length>0&&(
          <div className="anim-fade-up delay-100" style={{marginBottom:14}}>
            <span className="section-label">{t('رؤى شخصية','Personal insights')}</span>
            {insights.map((ins,i)=>(
              <div key={i} style={{background:'#fff',
                borderInlineStart:`3px solid ${ins.positive?'#4ade80':'#f97316'}`,
                borderRadius:12,padding:'11px 14px',marginBottom:7,
                display:'flex',alignItems:'center',gap:10,
                boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                <span style={{fontSize:18,flexShrink:0}}>{ins.icon}</span>
                <span style={{fontSize:13,color:Y,lineHeight:1.5}}>{ins.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Quick links */}
        {loading ? (
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            {[1,2,3,4].map(i=><SkeletonCard key={i} height={80}/>)}
          </div>
        ) : (
          <div className="anim-fade-up delay-200"
            style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
            {QUICK.map(item=>(
              <div key={item.href} onClick={()=>router.push(item.href)} className="tap-scale card-lift"
                style={{background:item.bg,borderRadius:16,padding:'16px 14px',
                  cursor:'pointer',position:'relative',border:'1px solid rgba(0,0,0,.04)'}}>
                {item.badge&&(
                  <div style={{position:'absolute',top:10,...(dir==='rtl'?{left:10}:{right:10}),
                    minWidth:18,height:18,borderRadius:9,background:'#dc2626',color:'#fff',
                    fontSize:10,fontWeight:700,display:'flex',alignItems:'center',
                    justifyContent:'center',padding:'0 4px'}}>
                    {item.badge}
                  </div>
                )}
                <span style={{fontSize:28,display:'block',marginBottom:8}}>{item.icon}</span>
                <span style={{fontSize:13,fontWeight:700,color:item.fg}}>{t(item.ar,item.en)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Progress card */}
        {!loading&&logs.length>=14&&(
          <div className="anim-fade-up delay-300"
            style={{background:`linear-gradient(135deg,${Y},${L})`,borderRadius:20,
              padding:'18px',marginBottom:14,color:'#fff',
              boxShadow:'0 4px 24px rgba(18,39,60,.25)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <div>
                <div style={{fontSize:11,opacity:.5,marginBottom:2}}>{t('تقدمك منذ البداية','Your progress')}</div>
                <div style={{fontSize:15,fontWeight:700}}>{t(`${logs.length} تسجيل مزاج`,`${logs.length} mood logs`)}</div>
              </div>
              <span style={{fontSize:30}}>🌱</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
              {[
                {label:t('السلسلة','Streak'),val:`${streak}🔥`,color:'#fbbf24'},
                {label:t('المزاج','Mood'),val:`${moodDiff>=0?'+':''}${moodDiff}`,color:moodDiff>=0?'#4ade80':'#f87171'},
                {label:t('العافية','Wellbeing'),val:wellScore!==null?`${wellScore}`:'-',color:'#93c5fd'},
              ].map(s=>(
                <div key={s.label} style={{background:'rgba(255,255,255,.1)',borderRadius:12,
                  padding:'10px 8px',textAlign:'center'}}>
                  <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div>
                  <div style={{fontSize:10,opacity:.55,marginTop:2}}>{s.label}</div>
                </div>
              ))}
            </div>
            <button onClick={shareCard}
              style={{width:'100%',padding:'9px',borderRadius:10,
                border:'1px solid rgba(255,255,255,.25)',background:'rgba(255,255,255,.1)',
                color:'#fff',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
              {t('شارك تقدمك 🔗','Share your progress 🔗')}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading&&logs.length===0&&(
          <div className="anim-fade-up" style={{background:'#fff',border:'1px solid #e5e7eb',
            borderRadius:20,padding:'32px 20px',textAlign:'center',
            boxShadow:'0 2px 12px rgba(0,0,0,.06)'}}>
            <div style={{fontSize:48,marginBottom:12}}>👋</div>
            <h3 style={{fontSize:17,fontWeight:800,color:Y,marginBottom:8}}>
              {t('أهلاً بك في Vwelfare','Welcome to Vwelfare')}
            </h3>
            <p style={{fontSize:13,color:'#6b7280',lineHeight:1.7,marginBottom:20,maxWidth:240,margin:'0 auto 20px'}}>
              {t('ابدأ برحلتك في الصحة النفسية بتسجيل مزاجك اليوم.','Start your mental health journey by logging your mood today.')}
            </p>
            <button onClick={()=>router.push('/mood')} className="tap-scale"
              style={{padding:'12px 32px',borderRadius:12,border:'none',background:L,
                color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'inherit',
                boxShadow:`0 4px 16px ${L}40`}}>
              {t('ابدأ الآن ✦','Start now ✦')}
            </button>
          </div>
        )}

        {!loading&&logs.length>0&&(
          <button onClick={()=>router.push('/mood/history')} className="tap-scale"
            style={{width:'100%',padding:'13px',borderRadius:14,border:'1.5px solid #e5e7eb',
              background:'#fff',color:L,fontWeight:700,fontSize:13,cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              fontFamily:'inherit',marginTop:2,boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
            📊 {t('سجل المزاج التفصيلي','Detailed mood history')}
          </button>
        )}
      </div>
    </div>
  );
}
