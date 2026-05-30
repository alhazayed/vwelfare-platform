'use client';
export const dynamic = 'force-dynamic';
import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase';

const LAPIS = '#1D6296';
const YANKEES = '#12273C';
const PROD_URL = 'https://vwelfare-platform.vercel.app';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${PROD_URL}/auth/reset-password`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: YANKEES }}>Vwelfare</h1>
        </div>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e5e7eb', padding: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: YANKEES, marginBottom: 6 }}>Reset password</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 22 }}>إعادة تعيين كلمة المرور</p>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#166534', marginBottom: 6 }}>Check your email</p>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>
                تحقق من بريدك الإلكتروني<br />
                We sent a reset link to <strong>{email}</strong>.<br />
                The link expires in 60 minutes.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 5 }}>
                  Email address · البريد الإلكتروني
                </label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  dir="ltr" placeholder="your@email.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {error && (
                <p style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', borderRadius: 8, padding: '10px 12px', margin: 0 }}>
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading}
                style={{ padding: 13, borderRadius: 10, border: 'none', background: LAPIS, color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .6 : 1 }}>
                {loading ? 'Sending...' : 'Send reset link · إرسال رابط إعادة التعيين'}
              </button>
            </form>
          )}
        </div>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13 }}>
          <a href="/auth/sign-in" style={{ color: LAPIS, textDecoration: 'none' }}>← Back to sign in · العودة لتسجيل الدخول</a>
        </p>
      </div>
    </div>
  );
}
