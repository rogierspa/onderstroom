'use client';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';

const STOPWORDS = new Set(['de','het','een','ik','is','dat','van','en','in','te','op','zijn','wat','maar','ook','mijn','me','ze','hij','was','er','aan','we','dit','bij','als','om','dan','nog','heb','je','niet','wel','voor','met','zo','kan','meer','heel','naar','die','wordt','heeft','zich','uit','over','hoe','iets','werd','even','elke','veel','toen','want','want','werd','deze','zijn','worden','omdat','toch','weer','even','gewoon','gewoon']);

function extractText(e: any): string {
  const c = e.content || {};
  const parts = [];
  // daily entries opslaan als { entries: { a, b, c } } of direct { a, b, c }
  const entries = c.entries || c;
  if (entries.a) parts.push(entries.a);
  if (entries.b) parts.push(entries.b);
  if (entries.c) parts.push(entries.c);
  if (c.beelden) parts.push(c.beelden);
  if (c.gevoel) parts.push(c.gevoel);
  if (c.thema) parts.push(c.thema);
  if (c.transcript) parts.push(c.transcript);
  if (c.notes) parts.push(c.notes);
  if (c.text) parts.push(c.text);
  // week answers
  if (typeof c === 'object') {
    Object.values(c).forEach((v: any) => { if (typeof v === 'string' && v.length > 3) parts.push(v); });
  }
  return parts.join(' ');
}

export default function PatronenPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('entries').select('*')
      .not('type', 'eq', 'intention')
      .order('date', { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        console.log('patronen data:', data?.length, error);
        setEntries(data || []);
        setLoaded(true);
      });
  }, []);

  const allText = entries.map(extractText).join(' ').toLowerCase();
  const words = allText.split(/\s+/).filter(w => w.length > 4 && !STOPWORDS.has(w) && /^[a-záéíóúàèëïöü]+$/i.test(w));
  const freq: Record<string, number> = {};
  words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  const top20 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 20);

  const handleDeepAnalysis = async () => {
    setLoading(true);
    const sample = entries.slice(0, 14).map(e => {
      const body = extractText(e).slice(0, 300);
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
        <div className="empty">Nog geen data gevonden.<br />Vul eerst een dagboekentry in en sla op.</div>
      ) : (
        <>
          <div className="pattern-block">
            <div className="pattern-block-label">Terugkerende taal</div>
            {top20.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Nog te weinig tekst voor patroonherkenning.</div>
            ) : (
              <div className="word-cloud">
                {top20.map(([w, c], i) => (
                  <span key={w} className={`word-chip ${i < 5 ? 'hi' : i < 10 ? 'md' : ''}`}>
                    {w} <span style={{ opacity: 0.4, fontSize: '0.55rem' }}>{c}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="action-row" style={{ marginBottom: '1.5rem' }}>
            <button className="btn" onClick={handleDeepAnalysis} disabled={loading || entries.length < 2}>
              {loading ? <><span className="spinner" />analyseren…</> : 'diepe patroonanalyse'}
            </button>
            {entries.length < 2 && <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>minimaal 2 entries nodig</span>}
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
