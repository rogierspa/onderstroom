'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePushNotifications } from '@/lib/usePush';

const NAV = [
  { href: '/dagboek',  label: 'Vandaag',   icon: '○' },
  { href: '/dromen',   label: 'Dromen',    icon: '◎' },
  { href: '/voice',    label: 'Voice',     icon: '◈' },
  { href: '/week',     label: 'Week',      icon: '◇' },
  { href: '/patronen', label: 'Patronen',  icon: '∿' },
  { href: '/archief',  label: 'Archief',   icon: '≡' },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [counts, setCounts] = useState({ daily: 0, dream: 0, voice: 0 });
  const { status: pushStatus, subscribe } = usePushNotifications();

  useEffect(() => {
    async function load() {
      const [d, dr, v] = await Promise.all([
        supabase.from('entries').select('id', { count: 'exact' }).eq('type', 'daily'),
        supabase.from('entries').select('id', { count: 'exact' }).eq('type', 'dream'),
        supabase.from('entries').select('id', { count: 'exact' }).eq('type', 'voice'),
      ]);
      setCounts({ daily: d.count || 0, dream: dr.count || 0, voice: v.count || 0 });
    }
    load();
  }, [path]);

  return (
    <div className="root">
      {/* Desktop sidebar */}
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-title">De Onderstroom</div>
          <div className="logo-sub">innerlijk werk</div>
        </div>
        <nav className="nav">
          {NAV.map(n => (
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
            <button className="btn secondary" style={{ marginTop: '1rem', width: '100%', fontSize: '0.7rem', padding: '0.5rem' }} onClick={subscribe}>
              🔔 Notificaties aan
            </button>
          )}
          {pushStatus === 'granted' && (
            <div style={{ marginTop: '1rem', fontSize: '0.65rem', color: 'var(--accent)' }}>✓ Notificaties actief</div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="main">
        {pushStatus === 'idle' && (
          <div className="push-banner">
            <div className="push-banner-text">
              <strong>Reminders aanzetten?</strong> Ontvang elke ochtend om 7:00 en vrijdag 18:00 een herinnering.
            </div>
            <button className="btn" style={{ fontSize: '0.72rem', padding: '0.5rem 1rem' }} onClick={subscribe}>
              Aanzetten
            </button>
          </div>
        )}
        {children}
      </main>

      {/* Mobile nav */}
      <div className="mobile-nav">
        <div className="mobile-nav-inner">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className={`mobile-nav-item ${path === n.href ? 'active' : ''}`}>
              <span className="mobile-nav-icon">{n.icon}</span>
              <span className="mobile-nav-label">{n.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
