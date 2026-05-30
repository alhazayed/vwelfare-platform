'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const L = '#1D6296';
const Y = '#12273C';

/** Interpolate hex colors by percentage 0-1 */
function lerpColor(a: string, b: string, t: number) {
  const h = (s: string) => parseInt(s, 16);
  const r = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  const ar = h(a.slice(1,3)), ag = h(a.slice(3,5)), ab = h(a.slice(5,7));
  const br = h(b.slice(1,3)), bg = h(b.slice(3,5)), bb = h(b.slice(5,7));
  return `#${r(ar+(br-ar)*t)}${r(ag+(bg-ag)*t)}${r(ab+(bb-ab)*t)}`;
}

/** Build CSS gradient background for a styled range input */
function sliderBg(val: number, low: string, high: string, min=1, max=10) {
  const pct = ((val - min) / (max - min)) * 100;
  const fill = lerpColor(low, high, (val - min) / (max - min));
  return {
    background: `linear-gradient(to right, ${fill} ${pct}%, #e5e7eb ${pct}%)`,
    accentColor: fill,
  };
}

const MOOD_EMOJIS    = ['😞','😟','😕','😐','🙂','😊','😄','😁','🤩','✨'];
const ENERGY_EMOJIS  = ['🪫','😴','😑','🔋','🔋','⚡','⚡','🌟','🌟','💥'];
const ANXIETY_EMOJIS = ['😌','😌','🙂','😐','😬','😟','😰','😨','😱','🆘'];

function SleepDots({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const steps = [0,1,2,3,4,5,6,7,8,9,10,11,12];
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center', padding:'4px 0' }}>
      {steps.map(h => {
        const active = h <= value;
        const isOptimal = h >= 7 && h <= 9;
        return (
          <button key={h} onClick={() => onChange(h)}
            style={{ width:32, height:32, borderRadius:8, border:'none', cursor:'pointer',
              background: active ? (isOptimal ? '#4ade80' : h < 7 ? '#fbbf24' : '#f87171') : '#f3f4f6',
              color: active ? '#fff' : '#9ca3af',
              fontSize:11, fontWeight:active?700:400,
              transition:'all .12s ease',
              transform: active ? 'scale(1.08)' : 'scale(1)',
            }}>
            {h}
          </button>
        );
      })}
    </div>
  );
}

export default function MoodPage() {
  const [mood,    setMood]    = useState(5);
  const [energy,  setEnergy]  = useState(5);
  const [anxiety, setAnxiety] = useState(3);
  const [sleep,   setSleep]   = useState(7);
  const [note,    setNote]    = useState('');
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [todayLog, setTodayLog] = useState<{ mood_score: number } | null | undefined>(undefined);
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      const { data: prof } = await supabase.from('profiles').select('language_preference').eq('id', user.id).single();
      if (prof) setLang(prof.language_preference as 'ar'|'en');
      const today = new Date().toISOString().split('T')[0];
      const { data: log } = await supabase.from('mood_logs')
        .select('mood_score,energy_score,anxiety_score,sleep_hours')
        .eq('patient_id', user.id).eq('log_date', today).maybeSingle();
      if (log) {
        setTodayLog(log);
        setMood(log.mood_score);
        setEnergy(log.energy_score);
        setAnxiety(log.anxiety_score);
        if (log.sleep_hours != null) setSleep(log.sleep_hours);
      } else {
        setTodayLog(null);
      }
      setLoaded(true);
    }
    load();
  }, []);

  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  async function handleSave() {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/sign-in'); return; }
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('mood_logs').upsert(
      { patient_id: user.id, log_date: today, mood_score: mood, energy_score: energy,
        anxiety_score: anxiety, sleep_hours: sleep, mood_note: note || null, note_shared: false },
      { onConflict: 'patient_id,log_date' }
    );
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => router.push('/home'), 2200); }
  }

  const moodColor   = lerpColor('#f87171', '#4ade80', (mood - 1) / 9);
  const energyColor = lerpColor('#d1d5db', '#fbbf24', (energy - 1) / 9);
  const anxColor    = lerpColor('#4ade80', '#f87171', (anxiety - 1) / 9);

  if (saved) return (
    <div dir={dir} style={{ minHeight:'100vh', background:'#f0fdf4',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
      <div className="success-bounce" style={{ width:88, height:88, borderRadius:'50%',
        background:'#4ade80', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <path d="M8 21l9 9 15-16" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="anim-fade-up delay-200" style={{ textAlign:'center' }}>
        <p style={{ fontSize:20, fontWeight:800, color:'#166534', margin:'0 0 4px' }}>{t('تم الحفظ!', 'Saved!')}</p>
        <p style={{ fontSize:13, color:'#4ade80', margin:0 }}>{t('جارٍ العودة للرئيسية…', 'Returning home…')}</p>
      </div>
      <div className="anim-fade-up delay-400" style={{ display:'flex', gap:16, marginTop:8 }}>
        {[
          { label: t('المزاج','Mood'), val: mood, color: moodColor, emoji: MOOD_EMOJIS[mood-1] },
          { label: t('الطاقة','Energy'), val: energy, color: energyColor, emoji: ENERGY_EMOJIS[energy-1] },
          { label: t('القلق','Anxiety'), val: anxiety, color: anxColor, emoji: ANXIETY_EMOJIS[anxiety-1] },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center', background:'rgba(255,255,255,.7)',
            borderRadius:14, padding:'10px 14px', minWidth:60 }}>
            <div style={{ fontSize:22 }}>{s.emoji}</div>
            <div style={{ fontSize:18, fontWeight:800, color:s.color, lineHeight:1 }}>{s.val}</div>
            <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div dir={dir} style={{ minHeight:'100vh', background:'#f4f6f9', paddingBottom:0 }}>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid #f0f0f0', padding:'14px 16px',
        display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => router.push('/home')}
            style={{ width:34, height:34, borderRadius:10, border:'1px solid #e5e7eb',
              background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center',
              cursor:'pointer', fontSize:16 }}>
            {dir === 'rtl' ? '→' : '←'}
          </button>
          <div>
            <h1 style={{ fontSize:16, fontWeight:700, color:Y, margin:0 }}>{t('تسجيل المزاج', 'Log Mood')}</h1>
            <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>
              {new Date().toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB',
                { weekday:'long', day:'numeric', month:'long' })}
            </p>
          </div>
        </div>
        <button onClick={() => router.push('/mood/history')}
          style={{ fontSize:12, padding:'5px 12px', borderRadius:100,
            border:`1px solid ${L}`, background:'#eff6ff', color:L, cursor:'pointer', fontWeight:600 }}>
          {t('السجل', 'History')}
        </button>
      </div>

      {/* Mood hero — big emoji + summary */}
      {!loaded ? (
        <div style={{ padding:'20px 16px' }}>
          <div className="skeleton" style={{ height:120, marginBottom:12 }} />
        </div>
      ) : (
        <div className="anim-fade-up" style={{ padding:'18px 16px 0' }}>
          {/* Already logged banner */}
          {todayLog !== null && todayLog !== undefined && (
            <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:14,
              padding:'11px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>✓</span>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#166534', margin:0 }}>
                  {t('سجّلت مزاجك اليوم', 'Already logged today')}
                </p>
                <p style={{ fontSize:12, color:'#16a34a', margin:0 }}>
                  {t('يمكنك تحديث القيم أدناه', 'You can update the values below')}
                </p>
              </div>
            </div>
          )}

          {/* Emoji trio — live preview */}
          <div style={{ background:'#fff', borderRadius:20, padding:'18px 16px',
            marginBottom:12, border:'1px solid #f0f0f0',
            display:'flex', justifyContent:'space-around', alignItems:'center' }}>
            {[
              { emoji: MOOD_EMOJIS[mood-1],    color: moodColor,   label: t('المزاج','Mood'),    val: mood },
              { emoji: ENERGY_EMOJIS[energy-1], color: energyColor, label: t('الطاقة','Energy'), val: energy },
              { emoji: ANXIETY_EMOJIS[anxiety-1],color: anxColor,   label: t('القلق','Anxiety'), val: anxiety },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center', flex:1 }}>
                <div style={{ fontSize:34, lineHeight:1, marginBottom:4,
                  transition:'transform .15s', display:'block' }}>{s.emoji}</div>
                <div style={{ fontSize:20, fontWeight:900, color:s.color,
                  lineHeight:1, transition:'color .2s' }}>{s.val}</div>
                <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sliders */}
      <div style={{ padding:'0 16px' }}>
        {/* Mood */}
        <div className="anim-fade-up delay-100" style={{ background:'#fff', borderRadius:18,
          padding:'16px', marginBottom:10, border:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <span style={{ fontSize:14, fontWeight:700, color:Y }}>{t('المزاج', 'Mood')}</span>
            <span className="value-pill"
              style={{ background:`${moodColor}20`, color:moodColor }}>
              {mood}/10
            </span>
          </div>
          <input type="range" min={1} max={10} value={mood}
            onChange={e => setMood(Number(e.target.value))}
            className="mood-slider"
            style={sliderBg(mood, '#f87171', '#4ade80')} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
            color:'#d1d5db', marginTop:6, padding:'0 2px' }}>
            <span>{t('سيء جداً','Very low')}</span>
            <span>{t('ممتاز','Excellent')}</span>
          </div>
        </div>

        {/* Energy */}
        <div className="anim-fade-up delay-200" style={{ background:'#fff', borderRadius:18,
          padding:'16px', marginBottom:10, border:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <span style={{ fontSize:14, fontWeight:700, color:Y }}>{t('الطاقة', 'Energy')}</span>
            <span className="value-pill"
              style={{ background:`${energyColor}25`, color: energy >= 6 ? '#92400e' : '#6b7280' }}>
              {energy}/10
            </span>
          </div>
          <input type="range" min={1} max={10} value={energy}
            onChange={e => setEnergy(Number(e.target.value))}
            className="mood-slider"
            style={sliderBg(energy, '#d1d5db', '#fbbf24')} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
            color:'#d1d5db', marginTop:6, padding:'0 2px' }}>
            <span>{t('منهك','Exhausted')}</span>
            <span>{t('نشيط','Energized')}</span>
          </div>
        </div>

        {/* Anxiety */}
        <div className="anim-fade-up delay-300" style={{ background:'#fff', borderRadius:18,
          padding:'16px', marginBottom:10, border:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <span style={{ fontSize:14, fontWeight:700, color:Y }}>{t('القلق', 'Anxiety')}</span>
            <span className="value-pill"
              style={{ background:`${anxColor}20`, color: anxiety <= 3 ? '#166534' : '#9a3412' }}>
              {anxiety}/10
            </span>
          </div>
          <input type="range" min={1} max={10} value={anxiety}
            onChange={e => setAnxiety(Number(e.target.value))}
            className="mood-slider"
            style={sliderBg(anxiety, '#4ade80', '#f87171')} />
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
            color:'#d1d5db', marginTop:6, padding:'0 2px' }}>
            <span>{t('مرتاح','Calm')}</span>
            <span>{t('قلق جداً','Very anxious')}</span>
          </div>
        </div>

        {/* Sleep */}
        <div className="anim-fade-up delay-400" style={{ background:'#fff', borderRadius:18,
          padding:'16px', marginBottom:10, border:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <span style={{ fontSize:14, fontWeight:700, color:Y }}>{t('النوم', 'Sleep')}</span>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:14 }}>🌙</span>
              <span className="value-pill"
                style={{ background: sleep >= 7 && sleep <= 9 ? '#d1fae5' : sleep < 6 ? '#fef3c7' : '#fde8d8',
                  color: sleep >= 7 && sleep <= 9 ? '#166534' : sleep < 6 ? '#92400e' : '#9a3412' }}>
                {sleep} {t('ساعة','hrs')}
              </span>
            </div>
          </div>
          <SleepDots value={sleep} onChange={setSleep} />
          <div style={{ fontSize:11, color:'#9ca3af', textAlign:'center', marginTop:8 }}>
            {sleep === 0 ? t('لم تنم', 'No sleep')
              : sleep < 6 ? t('أقل من الموصى به (7-9)', 'Below recommended (7-9 hrs)')
              : sleep <= 9 ? t('✓ ضمن النطاق الصحي', '✓ Within healthy range')
              : t('نوم أكثر من 9 ساعات', 'More than 9 hrs sleep')}
          </div>
        </div>

        {/* Note */}
        <div className="anim-fade-up delay-500" style={{ background:'#fff', borderRadius:18,
          padding:'16px', marginBottom:16, border:'1px solid #f0f0f0' }}>
          <label style={{ fontSize:13, fontWeight:700, color:Y, display:'block', marginBottom:8 }}>
            {t('ملاحظة (اختياري)', 'Note (optional)')}
          </label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
            placeholder={t('ما الذي أثّر في مزاجك اليوم؟', "What affected your mood today?")}
            style={{ width:'100%', fontSize:13, color:'#374151', resize:'none', outline:'none',
              border:'none', fontFamily:'inherit', lineHeight:1.7, background:'transparent',
              boxSizing:'border-box' }} />
          {note.length > 0 && (
            <div style={{ fontSize:10, color:'#9ca3af', textAlign:dir==='rtl'?'left':'right' }}>
              {note.length}/500
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={saving} className="tap-scale"
          style={{ width:'100%', padding:'15px', borderRadius:16, border:'none',
            background: saving ? '#9ca3af' : L, color:'#fff', fontWeight:800,
            fontSize:15, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily:'inherit', transition:'background .2s, opacity .2s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {saving ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                style={{ animation:'spin .7s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,.3)" strokeWidth="3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              {t('جارٍ الحفظ…', 'Saving…')}
            </>
          ) : (
            <>{t('حفظ يومي', 'Save today')} ✦</>
          )}
        </button>
      </div>
    </div>
  );
}
