'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const L = '#1D6296', Y = '#12273C';

const PROMPTS_AR = [
  'صِف لحظةً شعرت فيها بالهدوء الحقيقي هذا الأسبوع. ماذا كان مختلفاً؟',
  'ما الذي كنت ستخبر به نفسك الأسبوع الماضي مما تعرفه الآن؟',
  'اذكر ثلاثة أشياء كانت تحت سيطرتك اليوم.',
  'ما الفكرة التي ظلت تراودك اليوم؟ من أين تعتقد أنها تأتي؟',
  'صِف إنجازاً صغيراً حققته اليوم، مهما بدا بسيطاً.',
  'ما الذي أثقل كاهلك هذا الأسبوع؟ هل كان في استطاعتك فعل شيء مختلف؟',
  'اذكر شخصاً شعرت بالامتنان تجاهه اليوم ولماذا.',
  'ما الموقف الذي تعاملت معه بطريقة أفضل مما كنت تتوقع؟',
  'صِف لحظةً توقفت فيها عن الإسراع وأدركت ما حولك.',
  'ما الفكرة السلبية التي تكررت اليوم؟ هل هي حقيقة أم مجرد تفسير؟',
  'ما الحاجة التي أهملتها هذا الأسبوع؟',
  'اذكر شيئاً تعلمته عن نفسك مؤخراً.',
  'ما المخاوف التي تشغل تفكيرك الآن؟ هل هي في نطاق سيطرتك؟',
  'صِف لحظةً تمنيت فيها التصرف بشكل مختلف. ماذا كنت ستفعل؟',
  'ما الذي يجعلك تشعر بالانتماء والارتباط بالآخرين؟',
  'كيف تصف طاقتك الآن مقارنةً بالصباح؟ ما الذي أثّر فيها؟',
  'اذكر شيئاً أوقف قلقك، حتى لو للحظة.',
  'ما الذي تحتاج إلى سماعه من نفسك اليوم؟',
  'صِف محادثة كان لها أثر إيجابي عليك هذا الأسبوع.',
  'ما الحدود التي لم تُطبّقها وكان يجب أن تفعل؟',
  'اذكر شيئاً جميلاً لاحظته اليوم ولم تتوقع أن يلفت انتباهك.',
  'كيف اعتنيت بنفسك هذا الأسبوع؟ ما الذي يمكن أن تضيفه؟',
  'ما الذي تخشاه الآن؟ هل هو احتمال حقيقي أم قلق متوقع؟',
  'اذكر شخصاً أثّر في حياتك بشكل إيجابي ولم تخبره بذلك.',
  'ما الشيء الذي ندمت على تركه أو إهماله؟',
  'صِف يوماً مثالياً لك. ما الذي يختلف عن يومك الحالي؟',
  'ما الذي يمنحك طاقة؟ ما الذي يستنزفها؟',
  'كيف تصف علاقتك مع نفسك في هذه الفترة؟',
  'اذكر شيئاً أنجزته تعتقد أنه لم يُلاحَظ من أحد.',
  'ما الرسالة التي تريد أن تقرأها بعد شهر من الآن؟',
];

const PROMPTS_EN = [
  'Describe a moment this week when you felt genuinely calm. What made it different?',
  'What would you tell yourself from last week, knowing what you know now?',
  'Name three things that were within your control today.',
  'What thought kept recurring today? Where do you think it comes from?',
  'Describe a small achievement today, however simple it seems.',
  'What weighed on you most this week? Could you have done anything differently?',
  'Name someone you felt grateful for today and why.',
  'Describe a situation you handled better than you expected.',
  'Describe a moment when you paused and noticed your surroundings.',
  'What negative thought repeated today? Is it fact or interpretation?',
  'What need have you been neglecting this week?',
  'Name something you\'ve learned about yourself recently.',
  'What worries are occupying your mind right now? Are they within your control?',
  'Describe a moment you wished you\'d acted differently. What would you do instead?',
  'What makes you feel a sense of connection and belonging?',
  'How would you describe your energy now compared to this morning? What affected it?',
  'Name something that interrupted your anxiety, even briefly.',
  'What do you need to hear from yourself today?',
  'Describe a conversation that had a positive effect on you this week.',
  'What boundary did you fail to hold that you should have?',
  'Name something beautiful you noticed today that surprised you.',
  'How did you take care of yourself this week? What could you add?',
  'What are you afraid of right now? Is it a real possibility or anticipated worry?',
  'Name someone who positively shaped your life and whom you\'ve never told.',
  'What have you regretted letting go or neglecting?',
  'Describe a perfect day. How does it differ from your day today?',
  'What gives you energy? What drains it?',
  'How would you describe your relationship with yourself right now?',
  'Name something you accomplished that you think went unnoticed.',
  'What message do you want to read a month from now?',
];

interface Entry {
  id: string;
  body: string;
  is_shared: boolean;
  word_count: number | null;
  created_at: string;
  updated_at: string;
}

export default function JournalPage() {
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [view, setView] = useState<'list'|'write'|'read'>('list');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [body, setBody] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [showUnshareConfirm, setShowUnshareConfirm] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Daily prompt based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const todayPrompt = lang === 'ar' ? PROMPTS_AR[dayOfYear % PROMPTS_AR.length] : PROMPTS_EN[dayOfYear % PROMPTS_EN.length];

  const loadEntries = useCallback(async (uid: string) => {
    const { data } = await supabase.from('journal_entries').select('id, body, is_shared, word_count, created_at, updated_at').eq('patient_id', uid).order('created_at', { ascending: false });
    setEntries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      setUserId(user.id);
      const { data: prof } = await supabase.from('profiles').select('language_preference').eq('id', user.id).single();
      if (prof) setLang(prof.language_preference as 'ar'|'en');
      await loadEntries(user.id);
    }
    init();
  }, []);

  // Auto-save
  useEffect(() => {
    if (view !== 'write' || !userId || !body.trim()) return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => save(false), 30000);
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, [body, view]);

  async function save(showFeedback = true) {
    if (!userId || !body.trim()) return;
    setSaving(true);
    const wc = body.trim().split(/\s+/).filter(Boolean).length;
    if (editingId) {
      await supabase.from('journal_entries').update({ body, is_shared: isShared, word_count: wc }).eq('id', editingId);
    } else {
      const { data } = await supabase.from('journal_entries').insert({ patient_id: userId, body, is_shared: isShared, word_count: wc }).select().single();
      if (data) setEditingId(data.id);
    }
    setLastSaved(new Date());
    setSaving(false);
    await loadEntries(userId);
    if (showFeedback) setView('list');
  }

  function openNew() {
    setBody('');
    setIsShared(false);
    setEditingId(null);
    setLastSaved(null);
    setView('write');
  }

  function openEdit(entry: Entry) {
    setBody(entry.body);
    setIsShared(entry.is_shared);
    setEditingId(entry.id);
    setLastSaved(null);
    setView('write');
  }

  function openRead(entry: Entry) {
    setSelected(entry);
    setView('read');
  }

  async function toggleShare() {
    if (!selected || !userId) return;
    const newVal = !selected.is_shared;
    if (newVal) { setShowShareConfirm(true); return; }
    setShowUnshareConfirm(true);
  }

  async function confirmShare(val: boolean) {
    if (!selected || !userId) return;
    await supabase.from('journal_entries').update({ is_shared: val }).eq('id', selected.id);
    setSelected({ ...selected, is_shared: val });
    setEntries(prev => prev.map(e => e.id === selected.id ? { ...e, is_shared: val } : e));
    setShowShareConfirm(false);
    setShowUnshareConfirm(false);
  }

  const dateStr = (iso: string) => new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB', { weekday:'short', day:'numeric', month:'short' });
  const bodyPreview = (b: string) => b.slice(0, 80) + (b.length > 80 ? '…' : '');

  // ── LIST VIEW ──
  if (view === 'list') return (
    <div dir={dir} style={{ minHeight:'100vh', background:'#f9fafb', paddingBottom:80 }}>
      <div style={{ background:'#fff', borderBottom:'1px solid #f3f4f6', padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:5 }}>
        <div>
          <h1 style={{ fontSize:18, fontWeight:800, color:Y, margin:0 }}>{t('المذكرات', 'Journal')}</h1>
          <p style={{ fontSize:11, color:'#9ca3af', margin:0 }}>{t('خاصة بطبيعتها', 'Private by default')}</p>
        </div>
        <button onClick={() => setLang(l => l==='ar'?'en':'ar')}
          style={{ fontSize:11, padding:'4px 10px', borderRadius:100, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#6b7280', cursor:'pointer', marginLeft: dir==='ltr'?8:0, marginRight: dir==='rtl'?8:0 }}>
          {lang==='ar'?'EN':'عربي'}
        </button>
      </div>

      <div style={{ padding:'16px 18px' }}>
        {/* Daily prompt CTA */}
        <div onClick={openNew} className="card-lift" style={{ background:`linear-gradient(135deg,${Y},#1a3a5c)`, borderRadius:18, padding:'18px', color:'#fff', marginBottom:16, cursor:'pointer' }}>
          <div style={{ fontSize:11, opacity:.55, marginBottom:8, fontWeight:500, letterSpacing:'.04em', textTransform:'uppercase' }}>
            {t('موضوع اليوم', "Today's prompt")}
          </div>
          <p style={{ fontSize:14, lineHeight:1.65, margin:'0 0 14px', opacity:.9 }}>
            "{todayPrompt}"
          </p>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.14)', borderRadius:100, padding:'6px 14px', fontSize:13, fontWeight:600 }}>
            ✏️ {t('اكتب الآن', 'Write now')}
          </div>
        </div>

        {loading ? (
          [1,2,3].map(i => <div key={i} style={{ height:70, background:'#e5e7eb', borderRadius:12, marginBottom:8 }} />)
        ) : entries.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 20px' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>📓</div>
            <h3 style={{ fontSize:16, fontWeight:700, color:Y, marginBottom:6 }}>{t('لا مذكرات بعد', 'No entries yet')}</h3>
            <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.6 }}>
              {t('ابدأ بالكتابة عن موضوع اليوم أعلاه.', "Start with today's prompt above.")}
            </p>
          </div>
        ) : (
          <>
            <div style={{ fontSize:11, fontWeight:600, color:'#9ca3af', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:10 }}>
              {t(`${entries.length} مذكرة`, `${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`)}
            </div>
            {entries.map(entry => (
              <div key={entry.id}
                style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'14px 15px', marginBottom:8, cursor:'pointer', transition:'all .15s' }}
                onClick={() => openRead(entry)}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor=L}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor='#e5e7eb'}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                  <span style={{ fontSize:12, color:'#9ca3af', fontWeight:500 }}>{dateStr(entry.created_at)}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {entry.is_shared ? (
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'#eff6ff', color:L, border:`1px solid #bfdbfe`, fontWeight:500 }}>
                        {t('مشترك', 'Shared')}
                      </span>
                    ) : (
                      <span style={{ fontSize:10, padding:'2px 8px', borderRadius:100, background:'#f9fafb', color:'#9ca3af', border:'1px solid #e5e7eb', fontWeight:500 }}>
                        {t('خاص', 'Private')}
                      </span>
                    )}
                    <span style={{ fontSize:10, color:'#9ca3af' }}>
                      {entry.word_count ?? entry.body.split(/\s+/).length} {t('ك','w')}
                    </span>
                  </div>
                </div>
                <p style={{ fontSize:13, color:'#374151', lineHeight:1.6, margin:0, fontFamily:'Georgia,serif' }}>
                  {bodyPreview(entry.body)}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );

  // ── WRITE VIEW ──
  if (view === 'write') return (
    <div dir={dir} style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#fff' }}>
      {/* Header */}
      <div style={{ flexShrink:0, borderBottom:'1px solid #f3f4f6', padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => setView('list')} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:22, padding:0, lineHeight:1 }}>
          {lang==='ar'?'→':'←'}
        </button>
        <div style={{ flex:1, fontSize:12, color:'#9ca3af' }}>
          {saving ? t('جارٍ الحفظ...','Saving...') : lastSaved ? t(`حُفظ ${lastSaved.toLocaleTimeString(lang==='ar'?'ar-JO':'en-GB',{hour:'2-digit',minute:'2-digit'})}`, `Saved ${lastSaved.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}`) : ''}
        </div>
        <button onClick={() => save(true)} disabled={saving || !body.trim()}
          style={{ padding:'7px 18px', borderRadius:8, border:'none', background: body.trim() ? L : '#e5e7eb', color: body.trim() ? '#fff' : '#9ca3af', fontWeight:600, fontSize:13, cursor: body.trim() ? 'pointer' : 'not-allowed' }}>
          {t('حفظ','Save')}
        </button>
      </div>

      {/* Prompt strip */}
      {!editingId && (
        <div style={{ flexShrink:0, background:'#eff6ff', borderBottom:'1px solid #bfdbfe', padding:'10px 16px', fontSize:13, color:L, lineHeight:1.5 }}>
          <span style={{ fontWeight:600 }}>✦ </span>{todayPrompt}
        </div>
      )}

      {/* Text area */}
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        autoFocus
        placeholder={t('ابدأ الكتابة...', 'Start writing...')}
        style={{ flex:1, padding:'20px 18px', border:'none', outline:'none', resize:'none', fontSize:16, lineHeight:2, fontFamily:'Georgia,serif', color:'#1f2937', background:'#fff' }}
      />

      {/* Footer */}
      <div style={{ flexShrink:0, borderTop:'1px solid #f3f4f6', padding:'10px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#fff' }}>
        <span style={{ fontSize:12, color:'#9ca3af' }}>
          {body.trim().split(/\s+/).filter(Boolean).length} {t('كلمة','words')}
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:'#9ca3af' }}>{t('مشاركة مع الطبيب', 'Share with clinician')}</span>
          <div onClick={() => setIsShared(s => !s)} className="tog" style={{ background: isShared ? '#16a34a' : '#d1d5db' }}>
            <div className="tog-t" style={{ left: isShared ? 17 : 2 }} />
          </div>
        </div>
      </div>
    </div>
  );

  // ── READ VIEW ──
  if (view === 'read' && selected) return (
    <div dir={dir} style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#fff' }}>
      <div style={{ flexShrink:0, borderBottom:'1px solid #f3f4f6', padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
        <button onClick={() => setView('list')} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:22, padding:0, lineHeight:1 }}>
          {lang==='ar'?'→':'←'}
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:Y }}>{dateStr(selected.created_at)}</div>
          <div style={{ fontSize:11, color:'#9ca3af' }}>{selected.word_count ?? selected.body.split(/\s+/).length} {t('كلمة','words')}</div>
        </div>
        <button onClick={() => openEdit(selected)} style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${L}`, background:'#eff6ff', color:L, fontWeight:600, fontSize:12, cursor:'pointer' }}>
          {t('تعديل','Edit')}
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'20px 18px' }}>
        <p style={{ fontSize:16, lineHeight:2.1, color:'#1f2937', fontFamily:'Georgia,serif', margin:0 }}>{selected.body}</p>
      </div>

      {/* Share footer */}
      <div style={{ flexShrink:0, borderTop:'1px solid #f3f4f6', padding:'12px 16px', background:'#fff' }}>
        {selected.is_shared ? (
          <div>
            <div style={{ fontSize:12, color:L, fontWeight:500, marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
              <span>✓</span> {t('هذه المذكرة مشتركة مع طبيبك', 'This entry is shared with your clinician')}
            </div>
            <button onClick={toggleShare} style={{ fontSize:12, color:'#9ca3af', background:'none', border:'none', cursor:'pointer', padding:0 }}>
              {t('إلغاء المشاركة', 'Unshare')}
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:12, color:'#9ca3af', marginBottom:8 }}>
              {t('هذه المذكرة خاصة', 'This entry is private')}
            </div>
            <button onClick={toggleShare}
              style={{ width:'100%', padding:'11px', borderRadius:10, border:`1px solid ${L}`, background:'#eff6ff', color:L, fontWeight:600, fontSize:13, cursor:'pointer' }}>
              {t('مشاركة مع طبيبي', 'Share with my clinician')}
            </button>
          </div>
        )}
      </div>

      {/* Confirm share modal */}
      {showShareConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'flex-end', zIndex:100, padding:'0 0 0' }}>
          <div dir={dir} style={{ width:'100%', background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:Y, marginBottom:8 }}>{t('مشاركة هذه المذكرة؟', 'Share this entry?')}</h3>
            <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.6, marginBottom:20 }}>
              {t('سيتمكن طبيبك من قراءة هذه المذكرة كاملةً. يمكنك إلغاء المشاركة لاحقاً، لكن طبيبك قد يكون قد قرأها بالفعل.', 'Your clinician will be able to read this entry. You can unshare later, but your clinician may have already read it.')}
            </p>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowShareConfirm(false)} style={{ flex:1, padding:13, borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontWeight:600, fontSize:14, cursor:'pointer' }}>
                {t('إلغاء','Cancel')}
              </button>
              <button onClick={() => confirmShare(true)} style={{ flex:1, padding:13, borderRadius:10, border:'none', background:L, color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                {t('نعم، مشاركة','Yes, share')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnshareConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', display:'flex', alignItems:'flex-end', zIndex:100 }}>
          <div dir={dir} style={{ width:'100%', background:'#fff', borderRadius:'20px 20px 0 0', padding:'24px 20px' }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:Y, marginBottom:8 }}>{t('إلغاء المشاركة؟', 'Unshare this entry?')}</h3>
            <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.6, marginBottom:20 }}>
              {t('ملاحظة: طبيبك قد يكون قد قرأ هذه المذكرة بالفعل.', 'Note: your clinician may have already read this entry.')}</p>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowUnshareConfirm(false)} style={{ flex:1, padding:13, borderRadius:10, border:'1px solid #e5e7eb', background:'#f9fafb', color:'#374151', fontWeight:600, fontSize:14, cursor:'pointer' }}>
                {t('إلغاء','Cancel')}
              </button>
              <button onClick={() => confirmShare(false)} style={{ flex:1, padding:13, borderRadius:10, border:'none', background:'#dc2626', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer' }}>
                {t('إلغاء المشاركة','Unshare')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return null;
}
