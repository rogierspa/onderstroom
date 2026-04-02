'use client';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';
import { DAILY_Q, pickPrompt } from '@/lib/prompts';

const HINTS = [
  'Voel in je lichaam — voor je nadenkt. Adem, spanning, ruimte, gewicht. Geen verklaring nodig.',
  'Wat beweegt je emotioneel? Wat raakte je, irriteerde je, verraste je — ook al was het klein?',
  'Welke gedachte, taak of zorg neemt ruimte in je hoofd in? Wat wil je loslaten of juist vasthouden?',
];

export default function DagboekPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [v, setV] = useState({ a: '', b: '', c: '' });
  const [intention, setIntention] = useState('');
  const [reflection, setReflection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reflecting, setReflecting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('entries').select('*').eq('date', today).eq('type', 'daily').maybeSingle()
      .then(({ data }) => {
        if (data) { setV(data.content?.entries || data.content || {}); setReflection(data.reflection); }
      });
    supabase.from('entries').select('*').eq('date', today).eq('type', 'intention').maybeSingle()
      .then(({ data }) => { if (data) setIntention(data.content?.text || ''); });
  }, [today]);

  const filled = Object.values(v).filter((s: any) => s?.trim()).length;

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('entries').upsert(
      { date: today, type: 'daily', content: { entries: v }, reflection },
      { onConflict: 'date,type' }
    );
    if (intention.trim()) {
      await supabase.from('entries').upsert(
        { date: today, type: 'intention', content: { text: intention } },
        { onConflict: 'date,type' }
      );
    }
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReflect = async () => {
    setReflecting(true);
    // Haal ook andere entries van vandaag op voor rijkere context
    const { data: allToday } = await supabase.from('entries').select('*').eq('date', today);
    const context = [
      `Dagboek:\nVraag 1: ${v.a}\nVraag 2: ${v.b}\nVraag 3: ${v.c}`,
      intention ? `Intentie van vandaag: ${intention}` : '',
      ...(allToday || []).filter(e => e.type === 'dream').map(e => `Droom: ${e.content?.beelden || ''}`),
      ...(allToday || []).filter(e => e.type === 'voice').map(e => `Voice: ${e.content?.transcript || ''}`),
    ].filter(Boolean).join('\n\n');

    const res = await fetch('/api/reflect', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'daily', content: context }),
    });
    const { reflection: ref } = await res.json();
    setReflection(ref);
    await supabase.from('entries').upsert(
      { date: today, type: 'daily', content: { entries: v }, reflection: ref },
      { onConflict: 'date,type' }
    );
    setReflecting(false);
  };

  const prompts = [pickPrompt(DAILY_Q, 0), pickPrompt(DAILY_Q, 2), pickPrompt(DAILY_Q, 4)];

  return (
    <Shell>
      <div className="page-header">
        <div className="page-title">Dagelijkse check-in</div>
        <div className="page-meta">
          {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Intentie */}
      <div className="card" style={{ marginBottom: '1rem', borderLeft: '3px solid var(--accent)' }}>
        <div className="card-label" style={{ color: 'var(--accent)' }}>Intentie van vandaag</div>
        <div className="prompt" style={{ fontSize: '0.95rem' }}>Wat wil je vandaag belichamen of onthouden?</div>
        <textarea
          placeholder="bijv. aanwezig blijven, minder sturen, ruimte geven…"
          value={intention}
          onChange={e => setIntention(e.target.value)}
          rows={2}
          style={{ minHeight: '60px' }}
        />
      </div>

      <div className="progress">
        <div className="progress-fill" style={{ width: `${(filled / 3) * 100}%` }} />
      </div>

      <div className="grid">
        {(['a', 'b', 'c'] as const).map((k, i) => (
          <div key={k} className="card">
            <div className="prompt">{prompts[i]}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginBottom: '0.7rem', lineHeight: 1.5 }}>{HINTS[i]}</div>
            <textarea
              placeholder="schrijf vrij…"
              value={v[k] || ''}
              onChange={e => setV(p => ({ ...p, [k]: e.target.value }))}
              rows={4}
            />
          </div>
        ))}

        <div className="card grid-full">
          <div className="action-row">
            <button className="btn" onClick={handleSave} disabled={saving || filled === 0}>
              {saving ? <><span className="spinner" />opslaan…</> : 'opslaan'}
            </button>
            <button className="btn" style={{ background: 'var(--surface2)', color: 'var(--text)', boxShadow: 'none', border: '1.5px solid var(--border2)' }}
              onClick={handleReflect} disabled={reflecting || filled === 0}>
              {reflecting ? <><span className="spinner" style={{ borderTopColor: 'var(--accent)' }} />reflecteren…</> : '✦ reflectie ophalen'}
            </button>
            <span className={`saved-msg ${saved ? 'show' : ''}`}>✓ opgeslagen</span>
          </div>
          {reflection && (
            <div className="reflection">
              <div className="reflection-label">onderstroom · spiegel</div>
              <div className="reflection-text">{reflection}</div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
