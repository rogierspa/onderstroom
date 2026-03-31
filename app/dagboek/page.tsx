'use client';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';
import { DAILY_Q, pickPrompt } from '@/lib/prompts';

export default function DagboekPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [v, setV] = useState({ a: '', b: '', c: '' });
  const [reflection, setReflection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('entries').select('*').eq('date', today).eq('type', 'daily').single()
      .then(({ data }) => {
        if (data) {
          setV(data.content);
          setReflection(data.reflection);
        }
      });
  }, [today]);

  const filled = Object.values(v).filter(s => s.trim()).length;

  const handleSave = async () => {
    setLoading(true);
    const content = `Vraag 1: ${v.a}\nVraag 2: ${v.b}\nVraag 3: ${v.c}`;
    const res = await fetch('/api/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'daily', content }),
    });
    const { reflection: ref } = await res.json();
    setReflection(ref);

    await supabase.from('entries').upsert({
      date: today, type: 'daily', content: v, reflection: ref,
    }, { onConflict: 'date,type' });

    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const prompts = [
    pickPrompt(DAILY_Q, 0),
    pickPrompt(DAILY_Q, 2),
    pickPrompt(DAILY_Q, 4),
  ];

  return (
    <Shell>
      <div className="page-header">
        <div className="page-title">Dagelijkse check-in</div>
        <div className="page-meta">
          {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      <div className="progress">
        <div className="progress-fill" style={{ width: `${(filled / 3) * 100}%` }} />
      </div>
      <div className="grid">
        {(['a', 'b', 'c'] as const).map((k, i) => (
          <div key={k} className="card">
            <div className="prompt">{prompts[i]}</div>
            <textarea
              placeholder="schrijf vrij…"
              value={v[k]}
              onChange={e => setV(p => ({ ...p, [k]: e.target.value }))}
              rows={4}
            />
          </div>
        ))}
        <div className="card grid-full">
          <div className="action-row">
            <button className="btn" onClick={handleSave} disabled={loading || filled === 0}>
              {loading ? <><span className="spinner" />analyseren…</> : 'opslaan & spiegel'}
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
