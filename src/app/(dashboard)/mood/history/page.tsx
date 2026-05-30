'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

const LAPIS = '#1D6296';
const YANKEES = '#12273C';
const DIM_COLORS = { mood: '#1D6296', energy: '#F3650A', anxiety: '#dc2626', sleep: '#7c3aed' };

interface Log { log_date: string; mood_score: number; energy_score: number; anxiety_score: number; sleep_hours: number | null; }

function MiniChart({ logs, dim, color }: { logs: Log[]; dim: keyof typeof DIM_COLORS; color: string }) {
  if (logs.length < 2) return null;
  const W = 280, H = 60, P = { t: 6, r: 8, b: 20, l: 22 };
  const pw = W - P.l - P.r, ph = H - P.t - P.b;
  const vals = logs.map(l => dim === 'sleep' ? (l.sleep_hours ?? 0) : Number(l[`${dim}_score`]));
  const maxV = dim === 'sleep' ? 10 : 10, minV = 0;

  let path = '', dots = '';
  logs.forEach((_, i) => {
    const x = P.l + (pw * i / (logs.length - 1));
    const y = P.t + ph - ((vals[i] - minV) / (maxV - minV)) * ph;
    path += (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)} `;
    if (i === logs.length - 1) {
      dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${color}" stroke="#fff" stroke-width="2"/>`;
      dots += `<text x="${x.toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="${color}">${vals[i]}</text>`;
    }
  });

  const svgH = `<line x1="${P.l}" y1="${P.t}" x2="${P.l}" y2="${P.t + ph}" stroke="#e5e7eb" stroke-width="0.5"/>`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <g dangerouslySetInnerHTML={{ __html:
        svgH +
        `<path d="${path.trim()}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
        dots
      }} />
    </svg>
  );
}

export default function MoodHistory() {
  const [lang, setLang] = useState<'ar'|'en'>('ar');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7|30>(7);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/sign-in'); return; }
      const { data: prof } = await supabase.from('profiles').select('language_preference').eq('id', user.id).single();
      if (prof) setLang(prof.language_preference as 'ar'|'en');
      const from = new Date(); from.setDate(from.getDate() - 30);
      const { data } = await supabase.from('mood_logs').select('log_date, mood_score, energy_score, anxiety_score, sleep_hours')
        .eq('patient_id', user.id).gte('log_date', from.toISOString().split('T')[0]).order('log_date');
      setLogs(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const visible = logs.slice(-period);

  const avg = (dim: keyof Log) => {
    const vals = visible.map(l => Number(l[dim] ?? 0)).filter(v => v > 0);
    return vals.length ? (vals.reduce((a,b) => a+b, 0) / vals.length).toFixed(1) : '—';
  };

  const dims = [
    { key: 'mood_score' as const,   label: t('المزاج',  'Mood'),   dim: 'mood'   as const, color: DIM_COLORS.mood },
    { key: 'energy_score' as const, label: t('الطاقة',  'Energy'), dim: 'energy' as const, color: DIM_COLORS.energy },
    { key: 'anxiety_score' as const,label: t('القلق',   'Anxiety'),dim: 'anxiety'as const, color: DIM_COLORS.anxiety },
  ];

  return (
    <div dir={dir} style={{ minHeight: '100vh', background: '#f9fafb', paddingBottom: 80 }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 5 }}>
        <button onClick={() => router.push('/mood')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 20, lineHeight: 1, padding: 0 }}>
          {lang === 'ar' ? '→' : '←'}
        </button>
        <div style={{ fontSize: 16, fontWeight: 700, color: YANKEES }}>{t('سجل المزاج', 'Mood history')}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {([7, 30] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ fontSize: 12, padding: '4px 12px', borderRadius: 100, border: `1px solid ${period === p ? LAPIS : '#d1d5db'}`, background: period === p ? '#eff6ff' : 'transparent', color: period === p ? LAPIS : '#6b7280', cursor: 'pointer', fontWeight: period === p ? 700 : 400 }}>
              {p}{t('ي', 'd')}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {loading ? <div style={{ height: 200, background: '#e5e7eb', borderRadius: 12 }} /> : (
          <>
            {visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                <p style={{ color: '#6b7280', fontSize: 14 }}>{t('لا بيانات بعد. ابدأ بتسجيل مزاجك يومياً.', 'No data yet. Start logging your mood daily.')}</p>
                <button onClick={() => router.push('/mood')} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 10, border: 'none', background: LAPIS, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {t('سجّل الآن', 'Log now')}
                </button>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
                  {dims.map(d => (
                    <div key={d.key} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: d.color }}>{avg(d.key)}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{d.label}</div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                {dims.map(d => (
                  <div key={d.key} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 16px', marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: d.color, marginBottom: 8 }}>{d.label}</div>
                    <MiniChart logs={visible} dim={d.dim} color={d.color} />
                  </div>
                ))}

                {/* Log count */}
                <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
                  {t(`${visible.length} تسجيلاً في آخر ${period} يوماً`, `${visible.length} logs in the last ${period} days`)}
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
