'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import SOSButton from '@/components/SOSButton';

const L='#1D6296', O='#F3650A';

// ─────────────────────────────────────────────────────────────────
// SVG Icons (Feather / Heroicon style, 24px viewBox, stroke-based)
// ─────────────────────────────────────────────────────────────────
type NavIcon = React.FC<{s?:number}>;

function Ico({c,s=22}:{c:React.ReactNode;s?:number}) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {c}
    </svg>
  );
}

const IcoHome:     NavIcon = ({s}) => <Ico s={s} c={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>}/>;
const IcoMood:     NavIcon = ({s}) => <Ico s={s} c={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>}/>;
const IcoAssess:   NavIcon = ({s}) => <Ico s={s} c={<><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 12 2 2 4-4"/></>}/>;
const IcoChat:     NavIcon = ({s}) => <Ico s={s} c={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r=".5" fill="currentColor"/><circle cx="12" cy="10" r=".5" fill="currentColor"/><circle cx="15" cy="10" r=".5" fill="currentColor"/></>}/>;
const IcoWellness: NavIcon = ({s}) => <Ico s={s} c={<polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>}/>;
const IcoJournal:  NavIcon = ({s}) => <Ico s={s} c={<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></>}/>;
const IcoLibrary:  NavIcon = ({s}) => <Ico s={s} c={<><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>}/>;
const IcoMessages: NavIcon = ({s}) => <Ico s={s} c={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>}/>;
const IcoMeds:     NavIcon = ({s}) => <Ico s={s} c={<><path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/><circle cx="18" cy="18" r="4"/><path d="M18 16v4M16 18h4"/></>}/>;

// ─────────────────────────────────────────────────────────────────
// Nav config
// ─────────────────────────────────────────────────────────────────
interface NavItem { href:string; Ico:NavIcon; ar:string; en:string; exact?:boolean }

const BOTTOM: NavItem[] = [
  {href:'/home',        Ico:IcoHome,     ar:'الرئيسية', en:'Home'},
  {href:'/mood',        Ico:IcoMood,     ar:'المزاج',    en:'Mood'},
  {href:'/assessments', Ico:IcoAssess,   ar:'تقييم',     en:'Assess'},
  {href:'/chat',        Ico:IcoChat,     ar:'وافي',      en:'Wafi'},
  {href:'/wellness',    Ico:IcoWellness, ar:'رحلتي',     en:'Journey'},
];

const SIDEBAR_MAIN: NavItem[] = [
  {href:'/home',        Ico:IcoHome,     ar:'الرئيسية',  en:'Home'},
  {href:'/mood',        Ico:IcoMood,     ar:'المزاج',     en:'Mood'},
  {href:'/journal',     Ico:IcoJournal,  ar:'المذكرات',   en:'Journal'},
  {href:'/assessments', Ico:IcoAssess,   ar:'التقييمات',  en:'Assessments'},
  {href:'/library',     Ico:IcoLibrary,  ar:'المكتبة',    en:'Library'},
  {href:'/messages',    Ico:IcoMessages, ar:'الرسائل',    en:'Messages'},
  {href:'/medications', Ico:IcoMeds,     ar:'الأدوية',    en:'Medications'},
  {href:'/chat',        Ico:IcoChat,     ar:'وافي AI',    en:'Wafi AI'},
  {href:'/wellness',    Ico:IcoWellness, ar:'رحلتي',      en:'Wellness'},
];

// ─────────────────────────────────────────────────────────────────
// Vwelfare logo mark
// ─────────────────────────────────────────────────────────────────
function VwLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="9" fill="url(#vwg)"/>
      <defs>
        <linearGradient id="vwg" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#4aa3dc"/>
          <stop offset="100%" stopColor="#1D6296"/>
        </linearGradient>
      </defs>
      <path d="M8 10l4 12 4-8 4 8 4-12" stroke="white" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sidebar nav item
// ─────────────────────────────────────────────────────────────────
function SideNavItem({item, active, pending, isRTL, t}:{
  item:NavItem; active:boolean; pending:number; isRTL:boolean;
  t:(ar:string,en:string)=>string;
}) {
  return (
    <Link href={item.href} className="vw-nav-item"
      style={{
        display:'flex', alignItems:'center', gap:11,
        padding:'9px 13px', borderRadius:12, marginBottom:2,
        textDecoration:'none', position:'relative',
        background: active ? 'rgba(255,255,255,.11)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,.52)',
        transition:'background .15s, color .15s',
        borderInlineStart: active ? `3px solid ${O}` : '3px solid transparent',
        paddingInlineStart: active ? '10px' : '10px',
      }}>
      <item.Ico s={17}/>
      <span style={{fontSize:13, fontWeight: active ? 700 : 400, letterSpacing:'.01em'}}>
        {t(item.ar, item.en)}
      </span>
      {item.href === '/assessments' && pending > 0 && (
        <span style={{
          marginInlineStart:'auto', minWidth:18, height:18, borderRadius:9,
          background:O, fontSize:9, fontWeight:800, color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px',
        }}>
          {pending}
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────
// Bottom nav tab
// ─────────────────────────────────────────────────────────────────
function BottomTab({item, active, pending, isRTL, t}:{
  item:NavItem; active:boolean; pending:number; isRTL:boolean;
  t:(ar:string,en:string)=>string;
}) {
  return (
    <Link href={item.href} style={{
      flex:1, display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', gap:2, padding:'6px 2px', borderRadius:18,
      textDecoration:'none', position:'relative', minHeight:50,
      background: active ? L : 'transparent',
      color: active ? '#fff' : '#9ca3af',
      transition:'background .15s, color .15s',
    }}>
      {item.href === '/assessments' && pending > 0 && (
        <span style={{
          position:'absolute', top:5,
          ...(isRTL ? {left:5} : {right:5}),
          width:14, height:14, borderRadius:7,
          background:O, fontSize:8, fontWeight:800, color:'#fff',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          {pending}
        </span>
      )}
      <item.Ico s={20}/>
      <span style={{fontSize:9.5, fontWeight: active ? 700 : 400, lineHeight:1}}>
        {t(item.ar, item.en)}
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main layout
// ─────────────────────────────────────────────────────────────────
export default function DashboardLayout({children}:{children:ReactNode}) {
  const pathname = usePathname();
  const [lang, setLang] = useState('ar');
  const [prof, setProf] = useState<{name:string;initials:string}|null>(null);
  const [pending, setPending] = useState(0);
  const supabase = createClient();
  const isRTL = lang === 'ar';
  const t = (ar:string, en:string) => isRTL ? ar : en;

  useEffect(() => {
    supabase.auth.getUser().then(({data:{user}}) => {
      if (!user) return;
      Promise.all([
        supabase.from('profiles')
          .select('language_preference,full_name_en,full_name_ar')
          .eq('id', user.id).single(),
        supabase.from('assessment_assignments')
          .select('id', {count:'exact', head:true})
          .eq('patient_id', user.id).eq('status', 'pending'),
      ]).then(([{data:p}, pendRes]) => {
        if (p) {
          setLang(p.language_preference ?? 'ar');
          const n = p.full_name_en ?? '';
          setProf({name: n, initials: n.split(' ').map((w:string)=>w[0]).filter(Boolean).slice(0,2).join('')});
        }
        setPending(pendRes.count ?? 0);
      });
    });
  }, []);

  const isActive = (href:string) => pathname === href || (href !== '/home' && pathname.startsWith(href));

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="vw-shell">

      {/* ────────────── SIDEBAR (desktop only) ────────────── */}
      <aside className="vw-sidebar">

        {/* Logo block */}
        <div style={{
          padding:'22px 18px 18px',
          borderBottom:'1px solid rgba(255,255,255,.07)',
          flexShrink:0,
        }}>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <VwLogo/>
            <div>
              <div style={{fontSize:15, fontWeight:800, color:'#fff', lineHeight:1, letterSpacing:'-.01em'}}>
                Vwelfare
              </div>
              <div style={{fontSize:10, color:'rgba(255,255,255,.35)', marginTop:2, fontWeight:400}}>
                {t('مركز الرفاه النفسي','Mental Health Center')}
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{flex:1, padding:'12px 8px', overflowY:'auto'}}>
          <div style={{
            fontSize:9, fontWeight:700, color:'rgba(255,255,255,.25)',
            letterSpacing:'.1em', textTransform:'uppercase',
            padding:'0 13px 8px', marginTop:4,
          }}>
            {t('التنقل','Navigation')}
          </div>
          {SIDEBAR_MAIN.map(item => (
            <SideNavItem key={item.href}
              item={item} active={isActive(item.href)}
              pending={pending} isRTL={isRTL} t={t}/>
          ))}
        </nav>

        {/* Profile footer */}
        <div style={{
          padding:'12px 8px 16px',
          borderTop:'1px solid rgba(255,255,255,.07)',
          flexShrink:0,
        }}>
          <Link href="/profile" className="vw-nav-item"
            style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'9px 13px', borderRadius:12, textDecoration:'none',
              background: isActive('/profile') ? 'rgba(255,255,255,.1)' : 'transparent',
              color: isActive('/profile') ? '#fff' : 'rgba(255,255,255,.5)',
              transition:'background .15s, color .15s',
            }}>
            <div style={{
              width:28, height:28, borderRadius:'50%', flexShrink:0,
              background:`linear-gradient(135deg, ${L}, #4aa3dc)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:800, color:'#fff',
            }}>
              {prof?.initials || '…'}
            </div>
            <div style={{flex:1, overflow:'hidden'}}>
              <div style={{fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                {prof?.name || t('الملف الشخصي','Profile')}
              </div>
              <div style={{fontSize:10, color:'rgba(255,255,255,.3)', marginTop:1}}>
                {t('عرض الحساب','View account')}
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ────────────── MAIN CONTENT ────────────── */}
      <div className="vw-main">
        <AnnouncementBanner role="patient" lang={lang}/>
        {children}
      </div>

      {/* ────────────── BOTTOM NAV (mobile only) ────────────── */}
      <div className="vw-nav-outer">
        <nav className="vw-nav-pill">
          {BOTTOM.map(item => (
            <BottomTab key={item.href}
              item={item} active={isActive(item.href)}
              pending={pending} isRTL={isRTL} t={t}/>
          ))}
        </nav>
      </div>

      <SOSButton lang={lang}/>
    </div>
  );
}
