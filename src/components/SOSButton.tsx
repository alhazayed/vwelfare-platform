'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function SOSButton({ lang='ar' }: { lang?:string }) {
  const [open, setOpen] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const t = (ar:string, en:string) => lang==='ar' ? ar : en;
  const dir = lang==='ar' ? 'rtl' : 'ltr';

  async function sendAlert() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('assigned_clinician_id, full_name_en').eq('id', user.id).single();
    if (prof?.assigned_clinician_id) {
      await supabase.from('notification_log').insert({
        recipient_id: prof.assigned_clinician_id,
        channel: 'push',
        type: 'sos_alert',
        payload: { patient_id: user.id, patient_name: prof.full_name_en, timestamp: new Date().toISOString(), message: 'Patient pressed SOS button' },
      });
    }
    setAlertSent(true);
  }

  return (
    <>
      {/* Floating SOS button */}
      <button onClick={() => setOpen(true)} className="sos-btn"
        style={{ position:'fixed', bottom:76, ...(dir==='rtl'?{left:16}:{right:16}), zIndex:40, width:50, height:50, borderRadius:'50%', border:'none', background:'#dc2626', color:'#fff', fontSize:15, fontWeight:800, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 3px 16px rgba(220,38,38,.5)', fontFamily:'Segoe UI,system-ui,sans-serif' }}>
        SOS
      </button>

      {/* Crisis modal */}
      {open && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.6)', display:'flex', alignItems:'flex-end', fontFamily:'Segoe UI,system-ui,sans-serif' }}>
          <div dir={dir} style={{ width:'100%', background:'#fff', borderRadius:'24px 24px 0 0', padding:'28px 22px 36px', maxHeight:'85vh', overflowY:'auto' }}>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#991b1b', margin:0 }}>
                🆘 {t('مساعدة فورية','Immediate help')}
              </h2>
              <button onClick={() => { setOpen(false); setAlertSent(false); }} style={{ background:'none', border:'none', fontSize:24, color:'#9ca3af', cursor:'pointer' }}>×</button>
            </div>

            <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, marginBottom:22 }}>
              {t(
                'أنت لست وحدك. هذه الموارد متاحة لك الآن.',
                'You are not alone. These resources are available to you right now.'
              )}
            </p>

            {/* Crisis line */}
            <a href="tel:+96264619556" style={{ display:'block', background:'#fef2f2', border:'2px solid #fca5a5', borderRadius:16, padding:'16px', marginBottom:10, textDecoration:'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:28 }}>📞</span>
                <div>
                  <div style={{ fontSize:14, fontWeight:700, color:'#991b1b' }}>{t('خط دعم الأزمات النفسية','Mental Health Crisis Line')}</div>
                  <div style={{ fontSize:18, fontWeight:900, color:'#dc2626', letterSpacing:'.02em', direction:'ltr' }}>+962 6 461 9556</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>{t('الأردن · مجاني','Jordan · Free')}</div>
                </div>
              </div>
            </a>

            {/* Breathe button */}
            <button onClick={() => { setOpen(false); router.push('/breathe'); }}
              style={{ width:'100%', padding:'14px', borderRadius:14, border:'none', background:'linear-gradient(135deg,#4c1d95,#7c3aed)', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}>
              🫁 {t('ابدأ تمرين التنفس الآن','Start breathing exercise now')}
            </button>

            {/* Alert clinician */}
            {!alertSent ? (
              <button onClick={sendAlert}
                style={{ width:'100%', padding:'14px', borderRadius:14, border:'2px solid #1D6296', background:'#eff6ff', color:'#1D6296', fontWeight:700, fontSize:14, cursor:'pointer', marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontFamily:'inherit' }}>
                📨 {t('أرسل تنبيهاً لطبيبي الآن','Alert my clinician now')}
              </button>
            ) : (
              <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:14, padding:'14px', marginBottom:10, textAlign:'center', fontSize:14, fontWeight:600, color:'#166534' }}>
                ✓ {t('تم إرسال التنبيه لطبيبك','Your clinician has been alerted')}
              </div>
            )}

            {/* Dismiss */}
            <button onClick={() => { setOpen(false); setAlertSent(false); }}
              style={{ width:'100%', padding:13, borderRadius:12, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
              {t('أنا بخير — إغلاق','I\'m okay — close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
