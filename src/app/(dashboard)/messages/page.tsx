'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const L = '#1D6296', Y = '#12273C';

interface Message {
  id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}
interface Clinician {
  id: string;
  full_name_en: string;
  full_name_ar: string | null;
  clinician_profiles: {
    availability_message_en: string;
    availability_message_ar: string;
    specialty_en: string | null;
    specialty_ar: string | null;
  } | null;
}

export default function MessagesPage() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [userId, setUserId] = useState<string | null>(null);
  const [clinician, setClinician] = useState<Clinician | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [noClinician, setNoClinician] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const markRead = useCallback(async (uid: string, clinId: string) => {
    await supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('patient_id', uid).eq('clinician_id', clinId)
      .eq('sender_id', clinId).is('read_at', null);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      setUserId(user.id);

      const { data: prof } = await supabase.from('profiles')
        .select('language_preference, assigned_clinician_id')
        .eq('id', user.id).single();
      if (prof) setLang(prof.language_preference as 'ar' | 'en');

      if (!prof?.assigned_clinician_id) { setNoClinician(true); setLoading(false); return; }

      const { data: clin } = await supabase.from('profiles')
        .select('id, full_name_en, full_name_ar, clinician_profiles(availability_message_en, availability_message_ar, specialty_en, specialty_ar)')
        .eq('id', prof.assigned_clinician_id).single();
      setClinician(clin as unknown as Clinician);

      const { data: msgs } = await supabase.from('messages')
        .select('id, sender_id, body, read_at, created_at')
        .eq('patient_id', user.id).eq('clinician_id', prof.assigned_clinician_id)
        .order('created_at', { ascending: true }).limit(100);
      setMessages(msgs ?? []);
      setLoading(false);

      await markRead(user.id, prof.assigned_clinician_id);

      // Realtime subscription
      const channel = supabase
        .channel(`messages:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `patient_id=eq.${user.id}`,
        }, (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
          });
          if (payload.new.sender_id !== user.id) {
            markRead(user.id, prof.assigned_clinician_id);
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
    init();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !userId || !clinician || sending) return;
    const body = input.trim();
    setInput('');
    setSending(true);

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      body,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);

    const { data, error } = await supabase.from('messages').insert({
      patient_id: userId,
      clinician_id: clinician.id,
      sender_id: userId,
      body,
    }).select('id, sender_id, body, read_at, created_at').single();

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(body);
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m));
    }
    setSending(false);
    inputRef.current?.focus();
  }

  const groupByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    msgs.forEach(m => {
      const d = new Date(m.created_at).toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      if (d !== currentDate) { currentDate = d; groups.push({ date: d, messages: [] }); }
      groups[groups.length - 1].messages.push(m);
    });
    return groups;
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString(lang === 'ar' ? 'ar-JO' : 'en-GB', { hour: '2-digit', minute: '2-digit' });

  if (loading) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 28 }}>💬</div>
    </div>
  );

  if (noClinician) return (
    <div dir={dir} style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center', background: '#f4f6f9' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🩺</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: Y, marginBottom: 8 }}>
        {t('لا يوجد طبيب معيَّن بعد', 'No clinician assigned yet')}
      </h2>
      <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 24, maxWidth: 300 }}>
        {t('سيتمكن طبيبك من التواصل معك بمجرد تعيينك في نظامه. تواصل مع عيادتك إذا لم تتلقَّ دعوة.', 'Your clinician will be able to message you once you\'re assigned in their system. Contact your clinic if you haven\'t received an invitation.')}
      </p>
      <button onClick={() => router.push('/home')} style={{ padding: '11px 28px', borderRadius: 10, border: 'none', background: L, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
        {t('العودة للرئيسية', 'Back to home')}
      </button>
    </div>
  );

  const clinName = lang === 'ar' ? clinician?.full_name_ar ?? clinician?.full_name_en : clinician?.full_name_en ?? '';
  const clinInitials = (clinician?.full_name_en ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('');
  const cpRow = Array.isArray(clinician?.clinician_profiles) ? clinician?.clinician_profiles[0] : clinician?.clinician_profiles;
  const availability = lang === 'ar' ? cpRow?.availability_message_ar : cpRow?.availability_message_en;

  return (
    <div dir={dir} style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#f4f6f9' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => router.push('/home')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9ca3af', padding: 0, lineHeight: 1 }}>
          {lang === 'ar' ? '→' : '←'}
        </button>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${L}, #0d4a78)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>
          {clinInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: Y }}>{clinName}</div>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>
            {availability ?? t('يرد عادةً في غضون ساعتين', 'Usually responds within 2 hours')}
          </div>
        </div>
        <button onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 100, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#6b7280', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>
          {lang === 'ar' ? 'EN' : 'عربي'}
        </button>
      </div>

      {/* Disclaimer banner */}
      <div style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe', padding: '7px 16px', fontSize: 11, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span>🔒</span>
        {t('هذه المحادثة خاصة وآمنة بين المريض والطبيب فقط.', 'This conversation is private and secure between patient and clinician only.')}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 14, fontWeight: 600, color: Y, marginBottom: 6 }}>
              {t('ابدأ المحادثة مع طبيبك', 'Start the conversation with your clinician')}
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>
              {t('يمكنك سؤاله عن أي شيء يتعلق بعلاجك أو حالتك.', 'You can ask about anything related to your treatment or condition.')}
            </p>
          </div>
        ) : (
          groupByDate(messages).map(group => (
            <div key={group.date}>
              <div style={{ textAlign: 'center', margin: '12px 0' }}>
                <span style={{ fontSize: 11, color: '#9ca3af', background: '#f4f6f9', padding: '3px 10px', borderRadius: 100 }}>{group.date}</span>
              </div>
              {group.messages.map(msg => {
                const isMe = msg.sender_id === userId;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? (lang === 'ar' ? 'flex-start' : 'flex-end') : (lang === 'ar' ? 'flex-end' : 'flex-start'), marginBottom: 8 }}>
                    <div style={{ maxWidth: '78%' }}>
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isMe ? L : '#fff',
                        color: isMe ? '#fff' : '#1f2937',
                        fontSize: 14, lineHeight: 1.6,
                        boxShadow: isMe ? `0 2px 8px ${L}33` : '0 1px 3px rgba(0,0,0,.07)',
                        border: isMe ? 'none' : '1px solid #f3f4f6',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}>
                        {msg.body}
                      </div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3, textAlign: isMe ? (lang === 'ar' ? 'left' : 'right') : (lang === 'ar' ? 'right' : 'left'), display: 'flex', alignItems: 'center', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 4 }}>
                        {formatTime(msg.created_at)}
                        {isMe && msg.read_at && <span style={{ color: '#4ade80' }}>✓✓</span>}
                        {isMe && !msg.read_at && msg.id.startsWith('temp-') && <span style={{ opacity: 0.5 }}>⏳</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #f3f4f6', padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={t('اكتب رسالة...', 'Type a message...')}
          rows={1}
          style={{ flex: 1, padding: '10px 14px', borderRadius: 20, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 100, overflowY: 'auto', background: '#f9fafb', direction: dir }}
          onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 100) + 'px'; }}
          onFocus={e => e.currentTarget.style.borderColor = L}
          onBlur={e => e.currentTarget.style.borderColor = '#e5e7eb'}
        />
        <button onClick={sendMessage} disabled={!input.trim() || sending}
          style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', background: input.trim() && !sending ? L : '#e5e7eb', color: '#fff', fontSize: 18, cursor: input.trim() && !sending ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
          {lang === 'ar' ? '←' : '→'}
        </button>
      </div>
    </div>
  );
}
