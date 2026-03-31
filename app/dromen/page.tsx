'use client';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';
import { DREAM_Q } from '@/lib/prompts';

export default function DromenPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [v, setV] = useState({ beelden: '', gevoel: '', thema: '' });
  const [reflection, setReflection] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('entries').select('*').eq('date', today).eq('type', 'dream').single()
      .then(({ data }) => { if (data) { setV(data.content); setReflection(data.reflection); } });
  }, [today]);

  const filled = Object.values(v).filter(s => s.trim()).length;

  const handleSave = async () => {
    setLoading(true);
    const content = `Beelden: ${v.beelden}\nGevoel: ${v.gevoel}\nThema: ${v.thema}`;
    const res = await fetch('/api/reflect', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'dream', content }),
    });
    const { reflection: ref } = await res.json();
    setReflection(ref);
    await supabase.from('entries').upsert({ date: today, type: 'dream', content: v, reflection: ref }, { onConflict: 'date,type' });
    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const fields = [
    { k: 'beelden' as const, prompt: DREAM_Q[0] },
    { k: 'gevoel' as const, prompt: DREAM_Q[1] },
    { k: 'thema' as const, prompt: DREAM_Q[2] },
  ];

  return (
    <Shell>
      <div className="page-header">
        <div className="page-title">Droomnotitie</div>
        <div className="page-meta">schrijf zo snel mogelijk na het wakker worden</div>
      </div>
      <div className="grid">
        {fields.map(f => (
          <div key={f.k} className="card">
            <div className="prompt">{f.prompt}</div>
            <textarea placeholder="schrijf vrij…" value={v[f.k]} onChange={e => setV(p => ({ ...p, [f.k]: e.target.value }))} rows={4} />
          </div>
        ))}
        <div className="card grid-full">
          <div className="action-row">
            <button className="btn" onClick={handleSave} disabled={loading || filled === 0}>
              {loading ? <><span className="spinner" />herkennen…</> : 'opslaan & patronen lezen'}
            </button>
            <span className={`saved-msg ${saved ? 'show' : ''}`}>✓ opgeslagen</span>
          </div>
          {reflection && (
            <div className="reflection">
              <div className="reflection-label">onderstroom · droompatroon</div>
              <div className="reflection-text">{reflection}</div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
