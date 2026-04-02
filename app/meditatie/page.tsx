'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Shell from '@/components/Shell';

const PRESETS = [5, 10, 15, 20, 30, 45, 60];
const INTERVAL_OPTIONS = [0, 5, 10, 15];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function playBell(ctx: AudioContext, volume = 0.6) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.setValueAtTime(528, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 2);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 3);
}

export default function MeditatePage() {
  const [duration, setDuration] = useState(10);
  const [intervalMin, setIntervalMin] = useState(0);
  const [remaining, setRemaining] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [phase, setPhase] = useState<'setup' | 'running' | 'done'>('setup');
  const [sessions, setSessions] = useState<{ duration: number; date: string }[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const nextIntervalRef = useRef<number>(0);

  const getAudio = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('meditatie-sessions');
    if (stored) setSessions(JSON.parse(stored));
  }, []);

  useEffect(() => {
    setRemaining(duration * 60);
    setFinished(false);
  }, [duration]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          setRunning(false);
          setPhase('done');
          setFinished(true);
          playBell(getAudio(), 0.8);
          // Sla sessie op
          const newSession = { duration, date: new Date().toISOString().slice(0, 10) };
          setSessions(prev => {
            const updated = [newSession, ...prev].slice(0, 30);
            localStorage.setItem('meditatie-sessions', JSON.stringify(updated));
            return updated;
          });
          return 0;
        }
        // Interval bell
        if (intervalMin > 0) {
          const elapsed = duration * 60 - r + 1;
          if (elapsed > 0 && elapsed % (intervalMin * 60) === 0 && elapsed < duration * 60) {
            playBell(getAudio(), 0.4);
          }
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, duration, intervalMin, getAudio]);

  const start = () => {
    setRemaining(duration * 60);
    setFinished(false);
    setPhase('running');
    // Startbel
    playBell(getAudio(), 0.6);
    setTimeout(() => setRunning(true), 100);
  };

  const pause = () => setRunning(r => !r);

  const stop = () => {
    setRunning(false);
    setPhase('setup');
    setRemaining(duration * 60);
    setFinished(false);
  };

  const progress = phase === 'running' || phase === 'done'
    ? ((duration * 60 - remaining) / (duration * 60)) * 100
    : 0;

  const totalMinutes = sessions.reduce((a, s) => a + s.duration, 0);

  return (
    <Shell>
      <div className="page-header">
        <div className="page-title">Meditatie</div>
        <div className="page-meta">{sessions.length} sessies · {totalMinutes} minuten totaal</div>
      </div>

      {/* Timer cirkel */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 0 3rem' }}>
        <div style={{ position: 'relative', width: 220, height: 220, marginBottom: '2rem' }}>
          <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="110" cy="110" r="100" fill="none" stroke="var(--border)" strokeWidth="6" />
            <circle cx="110" cy="110" r="100" fill="none" stroke="var(--accent)" strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 100}`}
              strokeDashoffset={`${2 * Math.PI * 100 * (1 - progress / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: phase === 'done' ? '1.4rem' : '3rem', fontWeight: 300, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {phase === 'done' ? '✓ klaar' : formatTime(remaining)}
            </div>
            {phase === 'running' && (
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text3)', marginTop: '0.3rem' }}>
                {running ? 'stilte' : 'gepauzeerd'}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        {phase === 'setup' && (
          <div style={{ width: '100%', maxWidth: 360 }}>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-label">Duur</div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {PRESETS.map(p => (
                  <button key={p} onClick={() => setDuration(p)}
                    style={{ padding: '0.5rem 0.9rem', borderRadius: '50px', border: '1.5px solid', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--sans)', transition: 'all 0.15s',
                      borderColor: duration === p ? 'var(--accent)' : 'var(--border2)',
                      background: duration === p ? 'var(--accent-light)' : 'var(--bg)',
                      color: duration === p ? 'var(--accent)' : 'var(--text2)',
                      fontWeight: duration === p ? 500 : 300,
                    }}>
                    {p}m
                  </button>
                ))}
              </div>
            </div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-label">Tussenbel (minuten)</div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {INTERVAL_OPTIONS.map(p => (
                  <button key={p} onClick={() => setIntervalMin(p)}
                    style={{ padding: '0.5rem 0.9rem', borderRadius: '50px', border: '1.5px solid', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--sans)', transition: 'all 0.15s',
                      borderColor: intervalMin === p ? 'var(--accent)' : 'var(--border2)',
                      background: intervalMin === p ? 'var(--accent-light)' : 'var(--bg)',
                      color: intervalMin === p ? 'var(--accent)' : 'var(--text2)',
                      fontWeight: intervalMin === p ? 500 : 300,
                    }}>
                    {p === 0 ? 'geen' : `${p}m`}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn" style={{ width: '100%', padding: '1rem', fontSize: '0.9rem', borderRadius: '14px' }} onClick={start}>
              Begin
            </button>
          </div>
        )}

        {phase === 'running' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn secondary" style={{ padding: '0.8rem 2rem', fontSize: '0.85rem' }} onClick={pause}>
              {running ? 'Pauze' : 'Verder'}
            </button>
            <button className="btn secondary" style={{ padding: '0.8rem 2rem', fontSize: '0.85rem' }} onClick={stop}>
              Stop
            </button>
          </div>
        )}

        {phase === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--text2)', marginBottom: '1.5rem' }}>
              {duration} minuten stilte voltooid.
            </div>
            <button className="btn" onClick={stop}>Nieuwe sessie</button>
          </div>
        )}
      </div>

      {/* Sessie geschiedenis */}
      {sessions.length > 0 && (
        <div>
          <div className="pattern-block-label">Recente sessies</div>
          {sessions.slice(0, 7).map((s, i) => (
            <div key={i} className="entry" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="entry-date">{new Date(s.date + 'T12:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 500 }}>{s.duration} min</div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
