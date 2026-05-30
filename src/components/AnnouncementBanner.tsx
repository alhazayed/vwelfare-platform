'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface Announcement { id:string; title_en:string; title_ar:string; body_en:string|null; body_ar:string|null; type:string; is_dismissible:boolean; cta_label_en:string|null; cta_label_ar:string|null; cta_href:string|null; }

const TYPE_STYLES: Record<string,{ bg:string; border:string; text:string; icon:string }> = {
  info:        { bg:'#eff6ff', border:'#bfdbfe', text:'#1e40af', icon:'ℹ️' },
  success:     { bg:'#f0fdf4', border:'#86efac', text:'#166534', icon:'✅' },
  warning:     { bg:'#fefce8', border:'#fde047', text:'#713f12', icon:'⚠️' },
  maintenance: { bg:'#f5f3ff', border:'#c4b5fd', text:'#5b21b6', icon:'🔧' },
  critical:    { bg:'#fef2f2', border:'#fca5a5', text:'#991b1b', icon:'🚨' },
};

export default function AnnouncementBanner({ role='patient', lang='ar' }: { role?:string; lang?:string }) {
  const [banners, setBanners] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: ann } = await supabase
        .from('platform_announcements')
        .select('id, title_en, title_ar, body_en, body_ar, type, is_dismissible, cta_label_en, cta_label_ar, cta_href')
        .eq('is_active', true)
        .contains('target_roles', [role])
        .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(3);

      setBanners(ann ?? []);

      // Load dismissed IDs from localStorage
      try {
        const stored = localStorage.getItem('dismissed_announcements');
        if (stored) setDismissed(new Set(JSON.parse(stored)));
      } catch {}
    }
    load();
  }, [role]);

  function dismiss(id: string) {
    const next = new Set([...dismissed, id]);
    setDismissed(next);
    try { localStorage.setItem('dismissed_announcements', JSON.stringify([...next])); } catch {}
  }

  const t = (en: string|null, ar: string|null) => lang === 'ar' ? (ar ?? en ?? '') : (en ?? ar ?? '');

  const visible = banners.filter(b => !dismissed.has(b.id));
  if (visible.length === 0) return null;

  return (
    <div style={{ position:'sticky', top:0, zIndex:20, display:'flex', flexDirection:'column', gap:0 }}>
      {visible.map(b => {
        const s = TYPE_STYLES[b.type] ?? TYPE_STYLES.info;
        return (
          <div key={b.id} dir={lang==='ar'?'rtl':'ltr'}
            style={{ background:s.bg, borderBottom:`1px solid ${s.border}`, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, fontFamily:'Segoe UI,system-ui,sans-serif' }}>
            <span style={{ fontSize:16, flexShrink:0 }}>{s.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <span style={{ fontSize:13, fontWeight:600, color:s.text }}>{t(b.title_en, b.title_ar)}</span>
              {(b.body_en || b.body_ar) && <span style={{ fontSize:12, color:s.text, opacity:.8, marginLeft: lang==='ltr'?6:0, marginRight:lang==='rtl'?6:0 }}>{t(b.body_en, b.body_ar)}</span>}
            </div>
            {b.cta_href && (
              <a href={b.cta_href} style={{ fontSize:12, fontWeight:700, color:s.text, textDecoration:'underline', flexShrink:0 }}>
                {t(b.cta_label_en, b.cta_label_ar) || (lang==='ar'?'تفاصيل':'Learn more')}
              </a>
            )}
            {b.is_dismissible && (
              <button onClick={() => dismiss(b.id)} style={{ background:'none', border:'none', cursor:'pointer', color:s.text, opacity:.6, fontSize:18, lineHeight:1, padding:'0 2px', flexShrink:0 }}>×</button>
            )}
          </div>
        );
      })}
    </div>
  );
}
