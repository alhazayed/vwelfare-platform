'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const L = '#1D6296', Y = '#12273C';
const CAT_META: Record<string,{accent:string;icon:string;label_ar:string;label_en:string}> = {
  anxiety:        { accent:'#1D6296', icon:'🧠', label_ar:'القلق',          label_en:'Anxiety' },
  depression:     { accent:'#7c3aed', icon:'🌧️',label_ar:'الاكتئاب',       label_en:'Depression' },
  sleep:          { accent:'#ca8a04', icon:'🌙', label_ar:'النوم',           label_en:'Sleep' },
  stress:         { accent:'#ea580c', icon:'🔥', label_ar:'الضغط والعمل',  label_en:'Stress & work' },
  relationships:  { accent:'#16a34a', icon:'💚', label_ar:'العلاقات',       label_en:'Relationships' },
  stigma_culture: { accent:'#dc2626', icon:'🛡️',label_ar:'الوصمة والثقافة',label_en:'Stigma & culture' },
};

interface Article { id:string; category:string; title_ar:string; title_en:string; body_ar:string; body_en:string; published_at:string; }

function ArticleBody({ body, lang }: { body: string; lang: 'ar'|'en' }) {
  return (
    <div className={lang === 'ar' ? 'prose-ar' : ''}>
      {body.split('\n\n').map((block, i) => {
        if (block.startsWith('## ')) {
          return <h3 key={i} style={{ fontSize:17, fontWeight:700, color:Y, margin:'28px 0 12px', lineHeight:1.4 }}>{block.replace('## ','')}</h3>;
        }
        if (!block.trim()) return null;
        return <p key={i} style={{ fontSize:15, color:'#374151', lineHeight: lang==='ar' ? 2.1 : 1.85, margin:'0 0 18px', textAlign: lang==='ar'?'right':'left' }}>{block.trim()}</p>;
      })}
    </div>
  );
}

export default function ArticleReader() {
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [article, setArticle] = useState<Article|null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('language_preference').eq('id', user.id).single()
        .then(({ data }) => { if (data) setLang(data.language_preference as 'ar'|'en'); });
    });
    supabase.from('content_articles').select('*').eq('id', id).eq('status','published').single()
      .then(({ data }) => {
        setArticle(data);
        setLoading(false);
        if (data) {
          supabase.from('content_articles').select('id, category, title_ar, title_en, body_ar, body_en, published_at')
            .eq('status','published').eq('category', data.category).neq('id', id).limit(2)
            .then(({ data: rel }) => setRelated(rel ?? []));
        }
      });
  }, [id]);

  const handleScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    const pct = Math.min(100, (el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)) * 100);
    setProgress(Math.round(pct));
  };

  const t = (ar:string, en:string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const meta = article ? (CAT_META[article.category] ?? { accent:L, icon:'📄', label_ar:'', label_en:'' }) : null;
  const readTime = (body:string) => Math.max(2, Math.ceil(body.split(' ').length / 200));

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
      <div style={{ width:36, height:36, border:`3px solid ${L}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite' }} />
      <p style={{ fontSize:13, color:'#9ca3af' }}>{t('جارٍ تحميل المقال...','Loading article...')}</p>
    </div>
  );

  if (!article || !meta) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:32, textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
      <p style={{ color:'#6b7280', fontSize:15, marginBottom:16 }}>{t('المقال غير موجود','Article not found')}</p>
      <button onClick={() => router.push('/library')} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:L, color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer' }}>
        {t('العودة للمكتبة','Back to library')}
      </button>
    </div>
  );

  return (
    <div dir={dir} style={{ height:'100dvh', display:'flex', flexDirection:'column', background:'#fff' }}>

      {/* Progress bar */}
      <div style={{ height:3, background:'#f3f4f6', flexShrink:0, position:'sticky', top:0, zIndex:10 }}>
        <div style={{ height:'100%', background:meta.accent, width:`${progress}%`, transition:'width .2s', borderRadius:'0 2px 2px 0' }} />
      </div>

      {/* Header */}
      <div style={{ flexShrink:0, borderBottom:'1px solid #f3f4f6', padding:'13px 18px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => router.push('/library')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#9ca3af', padding:0, lineHeight:1, flexShrink:0 }}>
          {lang==='ar' ? '→' : '←'}
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:14 }}>{meta.icon}</span>
            <span style={{ fontSize:12, fontWeight:600, color:meta.accent }}>
              {t(meta.label_ar, meta.label_en)}
            </span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={() => setBookmarked(b => !b)}
            style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, lineHeight:1, color: bookmarked ? meta.accent : '#9ca3af', transition:'color .2s' }}>
            {bookmarked ? '🔖' : '🏷️'}
          </button>
          <button onClick={() => setLang(l => l==='ar'?'en':'ar')}
            style={{ fontSize:11, padding:'4px 10px', borderRadius:100, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', cursor:'pointer' }}>
            {lang==='ar'?'EN':'عربي'}
          </button>
        </div>
      </div>

      {/* Article body scroll area */}
      <div ref={bodyRef} onScroll={handleScroll} style={{ flex:1, overflowY:'auto', padding:'0 0 20px' }}>

        {/* Hero band */}
        <div style={{ background:`linear-gradient(135deg, ${meta.accent}, ${Y})`, padding:'24px 20px 28px', color:'#fff', marginBottom:0 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.15)', borderRadius:100, padding:'4px 12px', fontSize:11, fontWeight:500, marginBottom:14, backdropFilter:'blur(8px)' }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#4ade80', display:'inline-block' }} />
            {t('مراجع سريرياً', 'Clinically reviewed')} · {readTime(lang==='ar'?article.body_ar:article.body_en)} {t('دقائق','min read')}
          </div>
          <h1 style={{ fontSize:20, fontWeight:800, lineHeight:1.35, margin:0 }}>
            {lang==='ar' ? article.title_ar : article.title_en}
          </h1>
        </div>

        {/* Content */}
        <div style={{ padding:'24px 20px 8px' }}>
          <ArticleBody body={lang==='ar' ? article.body_ar : article.body_en} lang={lang} />
        </div>

        {/* Pull quote — first non-heading sentence */}
        <div style={{ margin:'0 20px 24px', padding:'16px 18px', borderLeft: lang==='ltr'?`4px solid ${meta.accent}`:'none', borderRight: lang==='ar'?`4px solid ${meta.accent}`:'none', background:meta.accent+'10', borderRadius: lang==='ar'?'12px 0 0 12px':'0 12px 12px 0' }}>
          <p style={{ fontSize:15, fontStyle:'italic', color:meta.accent, lineHeight:1.7, margin:0 }}>
            {t('هذا المقال لأغراض تثقيفية فقط ولا يُغني عن الاستشارة المهنية.','This article is for educational purposes and does not replace professional advice.')}
          </p>
        </div>

        {/* Related articles */}
        {related.length > 0 && (
          <div style={{ padding:'0 20px 24px' }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#9ca3af', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:12 }}>
              {t('مقالات ذات صلة','Related articles')}
            </div>
            {related.map(r => {
              const rm = CAT_META[r.category] ?? { accent:L, icon:'📄' };
              return (
                <div key={r.id} onClick={() => { router.push(`/library/${r.id}`); bodyRef.current?.scrollTo(0,0); }}
                  style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:12, padding:'13px 14px', marginBottom:8, cursor:'pointer', display:'flex', gap:10, alignItems:'center', transition:'all .15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor=rm.accent; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#e5e7eb'; }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{rm.icon}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:Y, lineHeight:1.4 }}>
                      {lang==='ar' ? r.title_ar : r.title_en}
                    </div>
                    <div style={{ fontSize:11, color:rm.accent, fontWeight:500, marginTop:3 }}>
                      {readTime(lang==='ar'?r.body_ar:r.body_en)} {t('دقائق','min')} →
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
