'use client';
import { useState, useEffect } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';

const TYPES = [
  { id: 'all', label: 'Alles' },
  { id: 'daily', label: 'Dagboek' },
  { id: 'dream', label: 'Dromen' },
  { id: 'voice', label: 'Voice' },
  { id: 'weekly', label: 'Week' },
];

function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function snippet(entry: any): string {
  const c = entry.content || {};
  if (entry.type === 'daily') return c.a || c.b || c.c || '';
  if (entry.type === 'dream') return c.beelden || c.gevoel || '';
  if (entry.type === 'voice') return c.transcript || c.notes || '';
  if (entry.type === 'weekly') return Object.values(c)[0] as string || '';
  return '';
}

export default function ArchiefPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('entries').select('*').order('date', { ascending: false }).limit(100)
      .then(({ data }) => { setEntries(data || []); setLoaded(true); });
  }, []);

  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter);

  if (!loaded) return <Shell><div style={{ color: 'var(--text3)', padding: '2rem 0' }}>laden…</div></Shell>;

  return (
    <Shell>
      <div className="page-header">
        <div className="page-title">Archief</div>
        <div className="page-meta">{entries.length} entries opgeslagen</div>
      </div>
      <div className="stream-tabs">
        {TYPES.map(t => (
          <div key={t.id} className={`stream-tab ${filter === t.id ? 'active' : ''}`} onClick={() => setFilter(t.id)}>
            {t.label}
          </div>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty">Geen entries gevonden.</div>
      ) : (
        filtered.map(e => {
          const s = snippet(e).slice(0, 200);
          return (
            <div key={e.id} className="entry">
              <div className="entry-date">
                {fmtDate(e.date)}
                <span className="entry-tag">{e.type}</span>
              </div>
              {s && <div className="entry-body">{s}{s.length >= 200 ? '…' : ''}</div>}
              {e.reflection && (
                <div className="entry-reflection">↳ {e.reflection.slice(0, 160)}…</div>
              )}
            </div>
          );
        })
      )}
    </Shell>
  );
}
