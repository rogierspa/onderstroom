'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePushNotifications } from '@/lib/usePush';

const NAV = [
  { href: '/dagboek',   label: 'Vandaag',    icon: '○' },
  { href: '/dromen',    label: 'Dromen',     icon: '◎' },
  { href: '/voice',     label: 'Voice',      icon: '◈' },
  { href: '/week',      label: 'Week',       icon: '◇' },
  { href: '/meditatie', label: 'Meditatie',  icon: '◉' },
  { href: '/patronen',  label: 'Patronen',   icon: '∿' },
  { href: '/archief',   label: 'Archief',    icon: '≡' },
];

const ALL_SECTIONS = [
  { id: 'dromen',    label: 'Dromen' },
  { id: 'voice',     label: 'Voice memo' },
  { id: 'meditatie', label: 'Meditatie' },
  { id: 'patronen',  label: 'Patronen' },
  { id: 'archief',   label: 'Archief' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [counts, setCounts] = useState({ daily: 0, dream: 0, voice: 0 });
  const [intention, setIntention] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const { status: pushStatus, subscribe } = usePushNotifications();

  useEffect(() => {
    const stored = localStorage.getItem('hidden-sections');
    if (stored) setHidden(JSON.parse(stored));
  }, []);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const [d, dr, v, intent] = await Promise.all([
        supabase.from('entries').select('id', { count: 'exact', head: true }).eq('type', 'daily'),
        supabase.from('entries').select('id', { count: 'exact', head: true }).eq('type', 'dream'),
        supabase.from('entries').select('id', { count: 'exact', head: true }).eq('type', 'voice'),
        supabase.from('entries').select('content').eq('date', today).eq('type', 'intention').maybeSingle(),
      ]);
      setCounts({ daily: d.count || 0, dream: dr.count || 0, voice: v.count || 0 });
      if (intent.data) setIntention(intent.data.content?.text || null);
    }
    load();
  }, [path]);

  const toggleSection = (id: string) => {
    setHidden(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('hidden-sections', JSON.stringify(next));
      return next;
    });
  };

  const visibleNav = NAV.filter(n => {
    const id = n.href.replace('/', '');
    return !hidden.includes(id) || path === n.href;
  });

  return (
    <div className="root">
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-title">De Onderstroom</div>
          <div className="logo-sub">innerlijk werk</div>
        </div>

        {intention && (
          <div style={{ margin: '0 1rem 1.5rem', padding: '0.85rem 1rem', background: 'var(--accent-light)', borderRadius: '10px', borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontSize: '0.56rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.3rem', fontWeight: 600, opacity: 0.7 }}>intentie</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '0.88rem', fontStyle: 'italic', color: 'var(--text)', lineHeight: 1.5 }}>{intention}</div>
          </div>
        )}

        <nav className="nav">
          {visibleNav.map(n => (
            <Link key={n.href} href={n.href} className={`nav-item ${path === n.href ? 'active' : ''}`}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-stat">Dagboek <span>{counts.daily} entries</span></div>
          <div className="sidebar-stat">Dromen <span>{counts.dream} entries</span></div>
          <div className="sidebar-stat">Voice <span>{counts.voice} memo's</span></div>
          {pushStatus === 'idle' && (
            <button className="btn secondary" style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.72rem', padding: '0.6rem' }} onClick={subscribe}>
              🔔 Notificaties aan
            </button>
          )}
          {pushStatus === 'granted' && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.65rem', color: 'var(--accent)' }}>✓ Notificaties actief</div>
          )}
          <button className="btn secondary" style={{ marginTop: '0.5rem', width: '100%', fontSize: '0.72rem', padding: '0.6rem' }}
            onClick={() => setShowSettings(s => !s)}>
            ◫ Instellingen
          </button>
          {showSettings && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: '10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '0.6rem' }}>Secties tonen</div>
              {ALL_SECTIONS.map(s => (
                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--text2)' }}>
                  <input type="checkbox" checked={!hidden.includes(s.id)} onChange={() => toggleSection(s.id)}
                    style={{ accentColor: 'var(--accent)', width: 14, height: 14 }} />
                  {s.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        {pushStatus === 'idle' && (
          <div className="push-banner">
            <div className="push-banner-text">
              <strong>Reminders aanzetten?</strong> Elke ochtend 07:00 en vrijdag 18:00.
            </div>
            <button className="btn" style={{ fontSize: '0.75rem', padding: '0.55rem 1.1rem' }} onClick={subscribe}>
              Aanzetten
            </button>
          </div>
        )}
        {children}
      </main>

      {/* Mobile nav */}
      <div className="mobile-nav">
        <div className="mobile-nav-inner">
          {visibleNav.slice(0, 6).map(n => (
            <Link key={n.href} href={n.href} className={`mobile-nav-item ${path === n.href ? 'active' : ''}`}>
              <span className="mobile-nav-icon">{n.icon}</span>
              <span className="mobile-nav-label">{n.label}</span>
            </Link>
          ))}
          <div className="mobile-nav-item" onClick={() => setShowSettings(s => !s)}>
            <span className="mobile-nav-icon">◫</span>
            <span className="mobile-nav-label">Menu</span>
          </div>
        </div>
        {showSettings && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg2)' }}>
            <div style={{ fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '0.75rem' }}>Secties tonen</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {ALL_SECTIONS.map(s => (
                <button key={s.id} onClick={() => toggleSection(s.id)}
                  style={{ padding: '0.4rem 0.9rem', borderRadius: '50px', border: '1.5px solid', cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'var(--sans)',
                    borderColor: !hidden.includes(s.id) ? 'var(--accent)' : 'var(--border2)',
                    background: !hidden.includes(s.id) ? 'var(--accent-light)' : 'var(--bg)',
                    color: !hidden.includes(s.id) ? 'var(--accent)' : 'var(--text2)',
                  }}>
                  {s.label}
                </button>
              ))}
            </div>
            {pushStatus === 'idle' && (
              <button className="btn" style={{ marginTop: '0.75rem', width: '100%' }} onClick={subscribe}>🔔 Notificaties aanzetten</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
