'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const LAPIS = '#1D6296';
const YANKEES = '#12273C';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'waiting'|'ready'|'success'|'error'>('waiting');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user lands from the reset email link.
    // The SDK automatically exchanges the token in the URL hash for a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready');
      }
    });

    // Also handle case where session is already set (page refresh after token exchange)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus('ready');
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage('Passwords do not match — كلمتا المرور غير متطابقتين');
      return;
    }
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters — كلمة المرور 8 أحرف على الأقل');
      return;
    }
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
    } else {
      setStatus('success');
      setTimeout(() => router.push('/auth/sign-in'), 2500);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: YANKEES }}>Vwelfare</h1>
        </div>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb', padding: 28 }}>
          {status === 'waiting' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6 }}>
                Verifying your reset link...<br />
                <span style={{ fontSize: 12 }}>جارٍ التحقق من رابط إعادة التعيين</span>
              </p>
            </div>
          )}

          {status === 'ready' && (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: YANKEES, marginBottom: 6 }}>Set new password</h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>تعيين كلمة مرور جديدة</p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
                    New password · كلمة المرور الجديدة
                  </label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={8} placeholder="Minimum 8 characters"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
                    Confirm password · تأكيد كلمة المرور
                  </label>
                  <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                    required placeholder="Repeat password"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {message && (
                  <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 12px', margin: 0 }}>
                    {message}
                  </p>
                )}
                <button type="submit" disabled={loading}
                  style={{ padding: 13, borderRadius: 10, border: 'none', background: LAPIS, color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1 }}>
                  {loading ? 'Updating... · جارٍ التحديث' : 'Set new password · تعيين كلمة المرور'}
                </button>
              </form>
            </>
          )}

          {status === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>✅</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#166534', marginBottom: 8 }}>Password updated!</p>
              <p style={{ fontSize: 13, color: '#6b7280' }}>تم تحديث كلمة المرور · Redirecting to sign in...</p>
            </div>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
          <a href="/auth/sign-in" style={{ color: LAPIS, textDecoration: 'none' }}>← Back to sign in · العودة لتسجيل الدخول</a>
        </p>
      </div>
    </div>
  );
}
