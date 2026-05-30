import { NextRequest, NextResponse } from 'next/server';

const SYSTEM = `You are a clinical AI assistant for Vwelfare, a mental health platform. Generate a concise clinical summary for a psychiatrist reviewing patient data.

Write in clear, professional clinical language. Be objective and factual. Do NOT make diagnostic conclusions. Keep the summary under 250 words. Structure:
1. Mood & wellbeing trend (last 7-14 days)
2. Clinical assessment findings (if any)
3. Notable patterns or concerns
4. Engagement & adherence

Respond in the same language as the prompt language field.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 503 });
  const { moodLogs, submissions, medications, journals, patientName, language } = await req.json();
  const userPrompt = `Clinical summary for: ${patientName}
Language: ${language === 'ar' ? 'Arabic' : 'English'}
MOOD (${moodLogs?.length ?? 0} entries):
${moodLogs?.slice(-14).map((l: { log_date: string; mood_score: number; energy_score: number; anxiety_score: number; sleep_hours: number | null }) => `${l.log_date}: mood=${l.mood_score}, energy=${l.energy_score}, anxiety=${l.anxiety_score}${l.sleep_hours ? `, sleep=${l.sleep_hours}h` : ''}`).join('\n') ?? 'No data'}
ASSESSMENTS: ${submissions?.slice(-3).map((s: { submitted_at: string; assessment_definitions: { code: string }; total_score: number; severity_band: string; high_risk_flag: boolean }) => `${s.submitted_at?.split('T')[0]}: ${s.assessment_definitions?.code}=${s.total_score}(${s.severity_band})${s.high_risk_flag ? ' HIGH RISK' : ''}`).join(', ') ?? 'None'}
MEDICATIONS: ${medications?.filter((m: { is_active: boolean }) => m.is_active).map((m: { drug_name_display: string; dosage?: string }) => `${m.drug_name_display}${m.dosage ? ` ${m.dosage}` : ''}`).join(', ') ?? 'None'}
SHARED JOURNALS: ${journals?.length ?? 0}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, system: SYSTEM, messages: [{ role: 'user', content: userPrompt }] }),
  });
  if (!res.ok) return NextResponse.json({ error: 'AI error' }, { status: 500 });
  const data = await res.json();
  return NextResponse.json({ summary: data.content?.[0]?.text ?? '' });
}
