'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const L='#1D6296', Y='#12273C';

export default function ProfilePage() {
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({logs:0,streak:0,assessments:0,days:0});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const t = (ar:string,en:string) => lang==='ar'?ar:en;
  const dir = lang==='ar'?'rtl':'ltr';

  useEffect(()=>{
    async function load() {
      const {data:{user}} = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      const {data:prof} = await supabase.from('profiles').select('full_name_en,full_name_ar,role,created_at,language_preference').eq('id',user.id).single();
      if (prof) { setProfile(prof); setLang(prof.language_preference); }
      const from60 = new Date(Date.now()-60*86400000).toISOString().split('T')[0];
      const [logsRes,assessRes] = await Promise.all([
        supabase.from('mood_logs').select('log_date').eq('patient_id',user.id).gte('log_date',from60).order('log_date',{ascending:true}),
        supabase.from('assessment_submissions').select('id',{count:'exact',head:true}).eq('patient_id',user.id),
      ]);
      const logs = logsRes.data ?? [];
      const dates = new Set(logs.map((l:any)=>l.log_date));
      const todayStr = new Date().toISOString().split('T')[0];
      const yestStr = new Date(Date.now()-86400000).toISOString().split('T')[0];
      const start = dates.has(todayStr)?todayStr:dates.has(yestStr)?yestStr:null;
      let streak = 0;
      if (start) { let d=new Date(start+'T12:00:00'); while(dates.has(d.toISOString().split('T')[0])){streak++;d=new Date(d.getTime()-86400000);} }
      const days = prof ? Math.floor((Date.now()-new Date(prof.created_at).getTime())/86400000) : 0;
      setStats({logs:logs.length,streak,assessments:assessRes.count??0,days});
      setLoading(false);
    }
    load();
  },[]);

  async function saveLanguage(newLang:'ar'|'en') {
    setSaving(true);
    const {data:{user}} = await supabase.auth.getUser();
    if (user) { await supabase.from('profiles').update({language_preference:newLang}).eq('id',user.id); setLang(newLang); setSaved(true); setTimeout(()=>setSaved(false),2000); }
    setSaving(false);
  }

  async function signOut() { await supabase.auth.signOut(); router.push('/auth/sign-in'); }

  const initials = (profile?.full_name_en??'?').split(' ').map((w:string)=>w[0]).slice(0,2).join('');

  return (
    <div dir={dir} style={{minHeight:'100vh',background:'#f4f6f9',paddingBottom:0,fontFamily:'Segoe UI,system-ui,sans-serif'}}>
      <div style={{background:`linear-gradient(160deg,${Y},#1a3a5c)`,padding:'52px 18px 24px',textAlign:'center',color:'#fff'}}>
        <div style={{width:72,height:72,borderRadius:'50%',background:'rgba(255,255,255,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:24,color:'#fff',margin:'0 auto 12px',border:'3px solid rgba(255,255,255,.25)'}}>{loading?'...':initials}</div>
        <h1 style={{fontSize:20,fontWeight:800,margin:'0 0 3px'}}>{profile?.full_name_en??'...'}</h1>
        {profile?.full_name_ar&&<p style={{fontSize:13,opacity:.65,margin:0,direction:'rtl'}}>{profile.full_name_ar}</p>}
        <div style={{display:'inline-flex',alignItems:'center',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:100,padding:'4px 14px',marginTop:8,fontSize:11,color:'rgba(255,255,255,.75)'}}>{profile?.role??'patient'}</div>
      </div>
      <div style={{padding:'14px 16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
          {[{val:stats.days,label:t('يوم','days'),icon:'📅',color:L},{val:stats.logs,label:t('تسجيل','logs'),icon:'📊',color:'#7c3aed'},{val:stats.streak,label:t('سلسلة','streak'),icon:'🔥',color:'#ea580c'},{val:stats.assessments,label:t('تقييم','assessments'),icon:'📋',color:'#16a34a'}].map(s=>(
            <div key={s.label} style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:12,padding:'12px 6px',textAlign:'center'}}>
              <div style={{fontSize:16,marginBottom:2}}>{s.icon}</div>
              <div style={{fontSize:20,fontWeight:800,color:s.color}}>{loading?'-':s.val}</div>
              <div style={{fontSize:9,color:'#9ca3af',marginTop:2}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',marginBottom:14}}>
          <div style={{padding:'13px 16px',borderBottom:'1px solid #f3f4f6',fontSize:13,fontWeight:700,color:Y}}>{t('الإعدادات','Settings')}</div>
          <div style={{padding:'14px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:Y}}>{t('لغة المنصة','Platform language')}</div>
              <div style={{fontSize:12,color:'#9ca3af',marginTop:2}}>{t('اللغة التي تراها في التطبيق','The language you see in the app')}</div>
            </div>
            <div style={{display:'flex',gap:6}}>
              {(['ar','en'] as const).map(l=>(
                <button key={l} onClick={()=>saveLanguage(l)} disabled={saving}
                  style={{padding:'6px 14px',borderRadius:8,border:`1px solid ${lang===l?L:'#e5e7eb'}`,background:lang===l?'#eff6ff':'#f9fafb',color:lang===l?L:'#6b7280',fontWeight:lang===l?700:400,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                  {l==='ar'?'عربي':'EN'}
                </button>
              ))}
            </div>
          </div>
          {saved&&<div style={{padding:'8px 16px',background:'#f0fdf4',fontSize:12,color:'#166534',fontWeight:500}}>✓ {t('تم الحفظ','Saved')}</div>}
        </div>
        <div style={{background:'#fff',border:'1px solid #e5e7eb',borderRadius:16,overflow:'hidden',marginBottom:14}}>
          {[{icon:'🌱',ar:'رحلتي',en:'My journey',href:'/wellness'},{icon:'📊',ar:'سجل المزاج',en:'Mood history',href:'/mood/history'},{icon:'🫁',ar:'مركز التنفس',en:'Breathe',href:'/breathe'},{icon:'🤖',ar:'وافي AI',en:'Wafi AI',href:'/chat'},{icon:'📚',ar:'المكتبة',en:'Library',href:'/library'}].map((item,i,arr)=>(
            <div key={item.href} onClick={()=>router.push(item.href)}
              style={{padding:'13px 16px',borderBottom:i<arr.length-1?'1px solid #f3f4f6':'none',display:'flex',alignItems:'center',gap:12,cursor:'pointer'}}>
              <span style={{fontSize:20}}>{item.icon}</span>
              <span style={{fontSize:14,fontWeight:500,color:Y,flex:1}}>{t(item.ar,item.en)}</span>
              <span style={{fontSize:16,color:'#9ca3af'}}>{dir==='rtl'?'←':'→'}</span>
            </div>
          ))}
        </div>
        <button onClick={signOut} style={{width:'100%',padding:'13px',borderRadius:12,border:'1px solid #fca5a5',background:'#fef2f2',color:'#dc2626',fontWeight:600,fontSize:14,cursor:'pointer',fontFamily:'inherit'}}>{t('تسجيل الخروج','Sign out')}</button>
      </div>
    </div>
  );
}
