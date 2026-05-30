'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const L = '#1D6296', Y = '#12273C';

const CATS = [
  { id: 'all',          icon: '✦',  ar: 'الكل',           en: 'All',            color: L },
  { id: 'anxiety',      icon: '🧠',  ar: 'القلق',          en: 'Anxiety',        color: '#1D6296' },
  { id: 'depression',   icon: '🌧️', ar: 'الاكتئاب',       en: 'Depression',     color: '#7c3aed' },
  { id: 'sleep',        icon: '🌙',  ar: 'النوم',           en: 'Sleep',          color: '#ca8a04' },
  { id: 'stress',       icon: '🔥',  ar: 'الضغط والعمل',  en: 'Stress',         color: '#ea580c' },
  { id: 'relationships',icon: '💚',  ar: 'العلاقات',       en: 'Relationships',  color: '#16a34a' },
  { id: 'stigma_culture',icon:'🛡️', ar: 'الوصمة والثقافة',en: 'Stigma & culture',color:'#dc2626' },
];

const CAT_MAP: Record<string,{color:string;icon:string;accent:string}> = {
  anxiety:       { color:'#eff6ff', icon:'🧠',  accent:'#1D6296' },
  depression:    { color:'#f5f3ff', icon:'🌧️', accent:'#7c3aed' },
  sleep:         { color:'#fefce8', icon:'🌙',  accent:'#ca8a04' },
  stress:        { color:'#fff7ed', icon:'🔥',  accent:'#ea580c' },
  relationships: { color:'#f0fdf4', icon:'💚',  accent:'#16a34a' },
  stigma_culture:{ color:'#fef2f2', icon:'🛡️', accent:'#dc2626' },
};

interface Article { id:string; category:string; title_ar:string; title_en:string; body_ar:string; body_en:string; published_at:string; }

export default function LibraryPage() {
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [articles, setArticles] = useState<Article[]>([]);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('language_preference').eq('id', user.id).single()
        .then(({ data }) => { if (data) setLang(data.language_preference as 'ar'|'en'); });
    });
    supabase.from('content_articles').select('id, category, title_ar, title_en, body_ar, body_en, published_at')
      .eq('status', 'published').order('published_at', { ascending: false })
      .then(({ data }) => { setArticles(data ?? []); setLoading(false); });
  }, []);

  const t = (ar:string, en:string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const visible = articles.filter(a => {
    const matchCat = cat === 'all' || a.category === cat;
    const q = search.toLowerCase();
    const matchSearch = !q || a.title_ar.toLowerCase().includes(q) || a.title_en.toLowerCase().includes(q) || a.body_ar.toLowerCase().includes(q) || a.body_en.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const featured = visible[0];
  const rest = visible.slice(1);
  const excerpt = (body:string) => body.split('\n\n').find(p => !p.startsWith('##'))?.slice(0,120) + '…';
  const readTime = (body:string) => Math.max(2, Math.ceil(body.split(' ').length / 200));

  return (
    <div dir={dir} style={{ minHeight:'100vh', background:'#f9fafb', paddingBottom:0 }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${Y} 0%,${L} 100%)`, padding:'20px 20px 24px', color:'#fff' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <h1 style={{ fontSize:20, fontWeight:800, margin:0 }}>{t('المكتبة', 'Library')}</h1>
            <p style={{ fontSize:11, opacity:.65, margin:'2px 0 0' }}>{t('محتوى تثقيفي مراجع سريرياً', 'Clinically reviewed content')}</p>
          </div>
          <button onClick={() => setLang(l => l==='ar'?'en':'ar')}
            style={{ fontSize:11, padding:'4px 12px', borderRadius:100, border:'1px solid rgba(255,255,255,.3)', background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.85)', cursor:'pointer' }}>
            {lang==='ar'?'EN':'عربي'}
          </button>
        </div>
        {/* Search */}
        <div style={{ position:'relative' }}>
          <span style={{ position:'absolute', top:'50%', transform:'translateY(-50%)', ...(lang==='ar'?{right:12}:{left:12}), fontSize:16, opacity:.6 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('ابحث في المكتبة...', 'Search the library...')}
            style={{ width:'100%', padding:`11px ${lang==='ar'?'14px':'38px'} 11px ${lang==='ar'?'38px':'14px'}`, borderRadius:10, border:'none', background:'rgba(255,255,255,.15)', color:'#fff', fontSize:14, outline:'none', backdropFilter:'blur(8px)', boxSizing:'border-box' }}
            onFocus={e => e.currentTarget.style.background='rgba(255,255,255,.22)'}
            onBlur={e => e.currentTarget.style.background='rgba(255,255,255,.15)'}/>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ background:'#fff', borderBottom:'1px solid #f3f4f6', padding:'12px 16px', display:'flex', gap:7, overflowX:'auto', scrollbarWidth:'none' }}>
        {CATS.map(c => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`cat-pill${cat===c.id?' active':''}`}
            style={{ flexShrink:0 }}>
            {c.icon} {t(c.ar, c.en)}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px 18px' }}>
        {loading ? (
          [1,2,3].map(i => <div key={i} style={{ height:120, background:'#e5e7eb', borderRadius:16, marginBottom:12, animation:'pulse 1.5s infinite' }} />)
        ) : visible.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
            <p style={{ color:'#6b7280', fontSize:14 }}>{t('لا نتائج مطابقة', 'No matching articles')}</p>
            <button onClick={() => { setSearch(''); setCat('all'); }} style={{ marginTop:12, fontSize:13, color:L, background:'none', border:'none', cursor:'pointer' }}>
              {t('مسح البحث', 'Clear search')}
            </button>
          </div>
        ) : (
          <>
            {/* Featured hero card */}
            {featured && (
              <div onClick={() => router.push(`/library/${featured.id}`)}
                style={{ borderRadius:20, overflow:'hidden', marginBottom:16, cursor:'pointer', border:'1px solid #e5e7eb', background:'#fff', boxShadow:'0 2px 12px rgba(0,0,0,.06)', transition:'all .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow='0 8px 24px rgba(0,0,0,.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform=''; (e.currentTarget as HTMLDivElement).style.boxShadow='0 2px 12px rgba(0,0,0,.06)'; }}>
                <div style={{ background: `linear-gradient(135deg, ${CAT_MAP[featured.category]?.accent ?? L}, ${Y})`, padding:'24px 20px', color:'#fff' }}>
                  <div style={{ fontSize:11, fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase', opacity:.75, marginBottom:10 }}>
                    {t('مقال مميز', 'Featured article')} · {readTime(lang==='ar'?featured.body_ar:featured.body_en)} {t('دقائق','min')}
                  </div>
                  <h2 style={{ fontSize:18, fontWeight:800, lineHeight:1.35, margin:'0 0 10px' }}>
                    {lang==='ar' ? featured.title_ar : featured.title_en}
                  </h2>
                  <p style={{ fontSize:13, opacity:.8, lineHeight:1.7, margin:0 }}>
                    {excerpt(lang==='ar' ? featured.body_ar : featured.body_en)}
                  </p>
                </div>
                <div style={{ padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, color:'#9ca3af', display:'flex', alignItems:'center', gap:4 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block' }} />
                    {t('مراجع سريرياً', 'Clinically reviewed')}
                  </span>
                  <span style={{ fontSize:13, fontWeight:600, color: CAT_MAP[featured.category]?.accent ?? L }}>
                    {t('اقرأ المقال →', 'Read →')}
                  </span>
                </div>
              </div>
            )}

            {/* Rest of articles */}
            {rest.length > 0 && (
              <>
                <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:10 }}>
                  {t(`${rest.length} مقالاً آخر`, `${rest.length} more article${rest.length !== 1 ? 's' : ''}`)}
                </div>
                {rest.map(a => {
                  const meta = CAT_MAP[a.category] ?? { color:'#f3f4f6', icon:'📄', accent:L };
                  return (
                    <div key={a.id} onClick={() => router.push(`/library/${a.id}`)}
                      style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, marginBottom:9, cursor:'pointer', display:'flex', overflow:'hidden', transition:'all .15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor=meta.accent; (e.currentTarget as HTMLDivElement).style.transform='translateY(-1px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#e5e7eb'; (e.currentTarget as HTMLDivElement).style.transform=''; }}>
                      {/* Color strip */}
                      <div style={{ width:5, background:meta.accent, flexShrink:0 }} />
                      {/* Content */}
                      <div style={{ padding:'13px 14px', flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                          <span style={{ fontSize:20, flexShrink:0 }}>{meta.icon}</span>
                          <div>
                            <h3 style={{ fontSize:14, fontWeight:700, color:Y, lineHeight:1.4, margin:'0 0 5px' }}>
                              {lang==='ar' ? a.title_ar : a.title_en}
                            </h3>
                            <p style={{ fontSize:12, color:'#6b7280', lineHeight:1.5, margin:'0 0 8px' }}>
                              {excerpt(lang==='ar' ? a.body_ar : a.body_en)}
                            </p>
                            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                              <span style={{ fontSize:11, color:'#9ca3af' }}>{readTime(lang==='ar'?a.body_ar:a.body_en)} {t('دقائق','min')}</span>
                              <span style={{ width:3, height:3, borderRadius:'50%', background:'#d1d5db', display:'inline-block' }} />
                              <span style={{ fontSize:11, fontWeight:600, color:meta.accent }}>{t('اقرأ →','Read →')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
