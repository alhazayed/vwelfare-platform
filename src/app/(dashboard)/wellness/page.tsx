'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const L='#1D6296', Y='#12273C';

const ACHIEVEMENTS = [
  { id:'first_log',     icon:'🌱', ar:'أول تسجيل',          en:'First log',            desc_ar:'سجّلت مزاجك لأول مرة',               desc_en:'You logged your mood for the first time',     check:(d:{totalLogs:number;streak:number;assessments:number;journals:number})=>d.totalLogs>=1 },
  { id:'streak_3',      icon:'🔥', ar:'3 أيام متتالية',       en:'3-day streak',          desc_ar:'3 أيام متتالية من التسجيل',            desc_en:'3 consecutive days of logging',                check:(d:{totalLogs:number;streak:number;assessments:number;journals:number})=>d.streak>=3 },
  { id:'streak_7',      icon:'⚡', ar:'أسبوع كامل',           en:'Full week',             desc_ar:'7 أيام متتالية',                       desc_en:'7 consecutive days',                          check:(d:{totalLogs:number;streak:number;assessments:number;journals:number})=>d.streak>=7 },
  { id:'streak_14',     icon:'💎', ar:'أسبوعان متتاليان',      en:'Two-week streak',       desc_ar:'14 يوماً متتالياً',                     desc_en:'14 consecutive days',                         check:(d:{totalLogs:number;streak:number;assessments:number;journals:number})=>d.streak>=14 },
  { id:'streak_30',     icon:'⭐', ar:'30 يوماً متتالياً',     en:'30-day streak',         desc_ar:'شهر كامل من الالتزام',                  desc_en:'A full month of commitment',                  check:(d:{totalLogs:number;streak:number;assessments:number;journals:number})=>d.streak>=30 },
  { id:'logs_10',       icon:'📊', ar:'10 تسجيلات',           en:'10 logs',               desc_ar:'وصلت لـ 10 تسجيلات',                  desc_en:'You reached 10 mood logs',                    check:(d:{totalLogs:number;streak:number;assessments:number;journals:number})=>d.totalLogs>=10 },
  { id:'logs_30',       icon:'🗓️', ar:'شهر من التتبع',         en:'Month of tracking',     desc_ar:'30 تسجيلاً للمزاج',                    desc_en:'30 mood logs completed',                      check:(d:{totalLogs:number;streak:number;assessments:number;journals:number})=>d.totalLogs>=30 },
  { id:'first_ass',     icon:'📋', ar:'أول تقييم',            en:'First assessment',      desc_ar:'أكملت تقييمك الأول',                   desc_en:'You completed your first assessment',         check:(d:{totalLogs:number;streak:number;assessments:number;journals:number})=>d.assessments>=1 },
  { id:'first_journal', icon:'📓', ar:'أول مذكرة',            en:'First journal entry',   desc_ar:'كتبت مذكرتك الأولى',                   desc_en:'You wrote your first journal entry',          check:(d:{totalLogs:number;streak:number;assessments:number;journals:number})=>d.journals>=1 },
  { id:'breathe_1',     icon:'🫁', ar:'تمرين تنفس',           en:'Breathing session',     desc_ar:'أكملت أول تمرين تنفس',                 desc_en:'You completed a breathing exercise',          check:()=>typeof window!=='undefined'&&parseInt(localStorage.getItem('vw_breathe_sessions')||'0')>=1 },
  { id:'breathe_5',     icon:'🧘', ar:'5 جلسات تنفس',         en:'5 breathing sessions',  desc_ar:'5 جلسات تنفس مكتملة',                  desc_en:'5 completed breathing sessions',              check:()=>typeof window!=='undefined'&&parseInt(localStorage.getItem('vw_breathe_sessions')||'0')>=5 },
  { id:'logs_100',      icon:'🏆', ar:'100 تسجيل',            en:'100 logs',              desc_ar:'100 تسجيل مزاج — مستوى احترافي',        desc_en:'100 mood logs — professional level',          check:(d:{totalLogs:number;streak:number;assessments:number;journals:number})=>d.totalLogs>=100 },
];

const MILESTONES = [
  { days:1,   icon:'🌱', ar:'اليوم الأول',  en:'Day 1' },
  { days:7,   icon:'🔥', ar:'أسبوع',        en:'1 week' },
  { days:14,  icon:'💫', ar:'أسبوعان',      en:'2 weeks' },
  { days:30,  icon:'⭐', ar:'شهر',          en:'1 month' },
  { days:60,  icon:'💎', ar:'شهران',        en:'2 months' },
  { days:90,  icon:'🏆', ar:'3 أشهر',       en:'3 months' },
];

interface AData { totalLogs:number; streak:number; assessments:number; journals:number; }

export default function WellnessPage() {
  const [lang,setLang] = useState<'ar'|'en'>('ar');
  const [data,setData] = useState<AData>({totalLogs:0,streak:0,assessments:0,journals:0});
  const [loading,setLoading] = useState(true);
  const [unlocked,setUnlocked] = useState<Set<string>>(new Set());
  const router = useRouter();
  const supabase = createClient();
  const t = (ar:string,en:string) => lang==='ar'?ar:en;
  const dir = lang==='ar'?'rtl':'ltr';

  useEffect(()=>{
    async function load() {
      const {data:{user}} = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      const {data:prof} = await supabase.from('profiles').select('language_preference').eq('id',user.id).single();
      if (prof) setLang(prof.language_preference as 'ar'|'en');
      const from60 = new Date(Date.now()-60*86400000).toISOString().split('T')[0];
      const [logsRes,assessRes,journalRes] = await Promise.all([
        supabase.from('mood_logs').select('log_date').eq('patient_id',user.id).gte('log_date',from60).order('log_date',{ascending:true}),
        supabase.from('assessment_submissions').select('id',{count:'exact',head:true}).eq('patient_id',user.id),
        supabase.from('journal_entries').select('id',{count:'exact',head:true}).eq('patient_id',user.id),
      ]);
      const logs = logsRes.data ?? [];
      const totalLogs = logs.length;
      const dates = new Set(logs.map((l:{log_date:string})=>l.log_date));
      const todayStr = new Date().toISOString().split('T')[0];
      const yestStr = new Date(Date.now()-86400000).toISOString().split('T')[0];
      const start = dates.has(todayStr)?todayStr:dates.has(yestStr)?yestStr:null;
      let streak = 0;
      if (start) {
        let d = new Date(start+'T12:00:00');
        while (dates.has(d.toISOString().split('T')[0])) { streak++; d=new Date(d.getTime()-86400000); }
      }
      const achData:AData = {totalLogs,streak,assessments:assessRes.count??0,journals:journalRes.count??0};
      setData(achData);
      setUnlocked(new Set(ACHIEVEMENTS.filter(a=>a.check(achData as any)).map(a=>a.id)));
      setLoading(false);
    }
    load();
  },[]);

  const earnedCount = ACHIEVEMENTS.filter(a=>unlocked.has(a.id)).length;
  const currentMilestone = MILESTONES.filter(m=>m.days<=data.streak).pop();
  const nextMilestone = MILESTONES.find(m=>m.days>data.streak);

  return (
    <div dir={dir} style={{minHeight:'100vh',background:'#f4f6f9',paddingBottom:0,fontFamily:'Segoe UI,system-ui,sans-serif'}}>
      {/* Header */}
      <div style={{background:`linear-gradient(160deg,${Y},#1a3a5c)`,padding:'52px 18px 20px',color:'#fff'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
          <div>
            <h1 style={{fontSize:20,fontWeight:800,margin:0}}>{t('رحلتي النفسية','My Wellness Journey')}</h1>
            <p style={{fontSize:12,opacity:.6,margin:'3px 0 0'}}>{t('إنجازاتك وتقدمك','Your achievements and progress')}</p>
          </div>
          <button onClick={()=>setLang(l=>l==='ar'?'en':'ar')} style={{background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:100,padding:'4px 12px',color:'rgba(255,255,255,.75)',fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>{lang==='ar'?'EN':'عربي'}</button>
        </div>
      </div>

      <div style={{padding:'14px 16px'}}>
        {/* Streak path */}
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:'18px',marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:700,color:Y,marginBottom:14}}>{t('مسار السلسلة','Streak path')}</div>
          <div style={{display:'flex',alignItems:'center',gap:0,overflowX:'auto',paddingBottom:4}}>
            {MILESTONES.map((m,i)=>{
              const reached = data.streak>=m.days;
              const isCurrent = currentMilestone?.days===m.days;
              return (
                <div key={m.days} style={{display:'flex',alignItems:'center',flexShrink:0}}>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                    <div style={{width:46,height:46,borderRadius:'50%',background:reached?`linear-gradient(135deg,${L},#0d4a78)`:'#f3f4f6',border:isCurrent?`3px solid ${L}`:`2px solid ${reached?L:'#e5e7eb'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,transition:'all .3s'}}>
                      <span style={{filter:reached?'none':'grayscale(1)',opacity:reached?1:.4}}>{m.icon}</span>
                    </div>
                    <div style={{fontSize:9,fontWeight:600,color:reached?L:'#9ca3af',textAlign:'center',maxWidth:42,lineHeight:1.2}}>{t(m.ar,m.en)}</div>
                  </div>
                  {i<MILESTONES.length-1&&<div style={{width:22,height:3,background:data.streak>=MILESTONES[i+1].days?L:'#e5e7eb',flexShrink:0,borderRadius:2,margin:'0 2px',transition:'background .3s'}}/>}
                </div>
              );
            })}
          </div>
          <div style={{marginTop:12,fontSize:13,color:'#374151'}}>
            {data.streak>0
              ?t(`السلسلة الحالية: ${data.streak} يوم${currentMilestone?` — "${t(currentMilestone.ar,currentMilestone.en)}" ✓`:''}`,`Current streak: ${data.streak} days${currentMilestone?` — "${t(currentMilestone.ar,currentMilestone.en)}" ✓`:''}`)
              :t('ابدأ تسجيل مزاجك يومياً لبناء سلسلتك','Start logging daily to build your streak')
            }
          </div>
          {nextMilestone&&data.streak<nextMilestone.days&&(
            <div style={{marginTop:5,fontSize:12,color:L,fontWeight:600}}>
              {t(`${nextMilestone.days-data.streak} يوماً للمرحلة التالية ${nextMilestone.icon}`,`${nextMilestone.days-data.streak} days to next milestone ${nextMilestone.icon}`)}
            </div>
          )}
        </div>

        {/* Stats row */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
          {[
            {val:data.totalLogs,label:t('تسجيل','logs'),icon:'📊',color:L},
            {val:data.streak,label:t('يوم متتالي','streak'),icon:'🔥',color:'#ea580c'},
            {val:data.assessments,label:t('تقييم','assessments'),icon:'📋',color:'#7c3aed'},
            {val:data.journals,label:t('مذكرة','journals'),icon:'📓',color:'#ca8a04'},
          ].map(s=>(
            <div key={s.label} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'12px 6px',textAlign:'center'}}>
              <div style={{fontSize:16,marginBottom:2}}>{s.icon}</div>
              <div style={{fontSize:20,fontWeight:800,color:s.color,lineHeight:1.1}}>{loading?'—':s.val}</div>
              <div style={{fontSize:9,color:'#9ca3af',marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:18,padding:'16px',marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:700,color:Y}}>{t('الإنجازات','Achievements')}</div>
            <div style={{fontSize:12,fontWeight:600,color:L}}>{earnedCount}/{ACHIEVEMENTS.length} {t('مُحقَّق','earned')}</div>
          </div>
          <div style={{background:'#f3f4f6',borderRadius:100,height:5,marginBottom:14,overflow:'hidden'}}>
            <div style={{height:'100%',background:`linear-gradient(90deg,${L},#4aa3dc)`,borderRadius:100,width:`${(earnedCount/ACHIEVEMENTS.length)*100}%`,transition:'width 1s ease'}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {ACHIEVEMENTS.map(a=>{
              const earned = unlocked.has(a.id);
              return (
                <div key={a.id} style={{display:'flex',alignItems:'center',gap:8,padding:'10px',borderRadius:12,border:`1px solid ${earned?L+'33':'#e5e7eb'}`,background:earned?'#eff6ff':'#f9fafb',opacity:earned?1:.65}}>
                  <span style={{fontSize:20,flexShrink:0,filter:earned?'none':'grayscale(1)'}}>{a.icon}</span>
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,color:earned?Y:'#9ca3af',lineHeight:1.3}}>{t(a.ar,a.en)}</div>
                    <div style={{fontSize:10,color:earned?L:'#9ca3af',marginTop:2,lineHeight:1.3}}>{t(a.desc_ar,a.desc_en)}</div>
                  </div>
                  {earned&&<span style={{fontSize:12,color:L,flexShrink:0}}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Breathe CTA */}
        <div onClick={()=>router.push('/breathe')} style={{background:'linear-gradient(135deg,#4c1d95,#7c3aed)',borderRadius:16,padding:'16px',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',gap:12}}>
          <span style={{fontSize:32}}>🫁</span>
          <div>
            <div style={{fontWeight:700,fontSize:14}}>{t('مركز التنفس','Breathing center')}</div>
            <div style={{fontSize:12,opacity:.75}}>{t('تمارين موجّهة تقطع دورة القلق','Guided exercises that interrupt the anxiety cycle')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
