'use client';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';
import { WEEK_Q } from '@/lib/prompts';

function getWeekISO() {
  const d = new Date(); const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date().setDate(diff)).toISOString().slice(0, 10);
}

export default function WeekPage() {
  const weekStart = getWeekISO();
  const [v, setV] = useState<Record<number, string>>({});
  const [reflection, setReflection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('entries').select('*').eq('date', weekStart).eq('type', 'weekly').single()
      .then(({ data }) => { if (data) { setV(data.content); setReflection(data.reflection); } });
  }, [weekStart]);

  const filled = Object.values(v).filter(s => s?.trim()).length;

  const handleSave = async () => {
    setLoading(true);
    const content = WEEK_Q.map((q, i) => `${q}\n${v[i] || '(geen antwoord)'}`).join('\n\n');
    const res = await fetch('/api/reflect', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'weekly', content }),
    });
    const { reflection: ref } = await res.json();
    setReflection(ref);
    await supabase.from('entries').upsert({ date: weekStart, type: 'weekly', content: v, reflection: ref }, { onConflict: 'date,type' });
    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const wEnd = new Date(weekStart + 'T12:00:00');
  wEnd.setDate(wEnd.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

  return (
    <Shell>
      <div className="page-header">
        <div className="page-title">Weekreflectie</div>
        <div className="page-meta">{fmt(new Date(weekStart + 'T12:00:00'))} — {fmt(wEnd)}</div>
      </div>
      <div className="grid">
        {WEEK_Q.map((q, i) => (
          <div key={i} className="card">
            <div className="prompt">{q}</div>
            <textarea placeholder="schrijf vrij…" value={v[i] || ''} onChange={e => setV(p => ({ ...p, [i]: e.target.value }))} rows={4} />
          </div>
        ))}
        <div className="card grid-full">
          <div className="action-row">
            <button className="btn" onClick={handleSave} disabled={loading || filled === 0}>
              {loading ? <><span className="spinner" />patronen lezen…</> : 'opslaan & week analyseren'}
            </button>
            <span className={`saved-msg ${saved ? 'show' : ''}`}>✓ opgeslagen</span>
          </div>
          {reflection && (
            <div className="reflection">
              <div className="reflection-label">onderstroom · weekpatroon</div>
              <div className="reflection-text">{reflection}</div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
