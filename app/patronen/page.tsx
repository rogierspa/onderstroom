'use client';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';

const STOPWORDS = new Set(['de','het','een','ik','is','dat','van','en','in','te','op','zijn','wat','maar','ook','mijn','me','ze','hij','was','er','aan','we','dit','bij','als','om','dan','nog','heb','je','niet','wel','voor','met','zo','kan','meer','heel','naar','die','wordt','heeft','zich','uit','over','hoe','iets','werd','even','elke','heel','veel']);

export default function PatronenPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('entries').select('*').order('date', { ascending: false }).limit(60)
      .then(({ data }) => { setEntries(data || []); setLoaded(true); });
  }, []);

  const allText = entries.map(e => {
    const c = e.content || {};
    return [c.a, c.b, c.c, c.beelden, c.gevoel, c.thema, c.transcript, c.notes,
      ...(typeof c === 'object' ? Object.values(c) : [])].filter(Boolean).join(' ');
  }).join(' ').toLowerCase();

  const words = allText.split(/\s+/).filter(w => w.length > 4 && !STOPWORDS.has(w) && /^[a-záéíóúàèëïöü]+$/i.test(w));
  const freq: Record<string, number> = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const top20 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);

  const handleDeepAnalysis = async () => {
    if (entries.length < 3) return;
    setLoading(true);
    const sample = entries.slice(0, 14).map(e => {
      const c = e.content || {};
      const body = [c.a, c.b, c.c, c.beelden, c.transcript, ...(typeof c === 'object' ? Object.values(c) : [])]
        .filter(Boolean).join(' ').slice(0, 300);
      return `[${e.type}·${e.date}] ${body}`;
    }).join('\n\n');
    const res = await fetch('/api/reflect', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'patterns', content: sample }),
    });
    const { reflection } = await res.json();
    setAnalysis(reflection);
    setLoading(false);
  };

  if (!loaded) return <Shell><div style={{ color: 'var(--text3)', padding: '2rem 0' }}>laden…</div></Shell>;

  return (
    <Shell>
      <div className="page-header">
        <div className="page-title">Patronen</div>
        <div className="page-meta">{entries.length} entries geanalyseerd</div>
      </div>

      {entries.length === 0 ? (
        <div className="empty">Nog geen data. Begin met dagelijkse check-ins.</div>
      ) : (
        <>
          <div className="pattern-block">
            <div className="pattern-block-label">Terugkerende taal</div>
            <div className="word-cloud">
              {top20.map(([w, c], i) => (
                <span key={w} className={`word-chip ${i < 5 ? 'hi' : i < 10 ? 'md' : ''}`}>
                  {w} <span style={{ opacity: 0.4, fontSize: '0.55rem' }}>{c}</span>
                </span>
              ))}
            </div>
          </div>
          <div className="action-row" style={{ marginBottom: '1.5rem' }}>
            <button className="btn" onClick={handleDeepAnalysis} disabled={loading || entries.length < 3}>
              {loading ? <><span className="spinner" />analyseren…</> : 'diepe patroonanalyse'}
            </button>
            {entries.length < 3 && <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>minimaal 3 entries nodig</span>}
          </div>
          {analysis && (
            <div className="reflection">
              <div className="reflection-label">onderstroom · diepe analyse</div>
              <div className="reflection-text" style={{ whiteSpace: 'pre-line' }}>{analysis}</div>
            </div>
          )}
        </>
      )}
    </Shell>
  );
}
