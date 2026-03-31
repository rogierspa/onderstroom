'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Shell from '@/components/Shell';
import { supabase } from '@/lib/supabase';

export default function VoicePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [transcript, setTranscript] = useState('');
  const [notes, setNotes] = useState('');
  const [reflection, setReflection] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const recRef = useRef<any>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) setSupported(true);
  }, []);

  const startRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = 'nl-NL'; r.continuous = true; r.interimResults = false;
    transcriptRef.current = '';
    r.onresult = (e: any) => {
      transcriptRef.current = Array.from(e.results).map((r: any) => r[0].transcript).join(' ');
    };
    r.onend = () => { setRecording(false); if (transcriptRef.current) setTranscript(transcriptRef.current); };
    r.start();
    recRef.current = r;
    setRecording(true);
  }, []);

  const stopRecording = useCallback(() => { recRef.current?.stop(); setRecording(false); }, []);

  const handleSave = async () => {
    if (!transcript && !notes) return;
    setLoading(true);
    const content = `Transcriptie: ${transcript}\nNotities: ${notes}`;
    const res = await fetch('/api/reflect', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'voice', content }),
    });
    const { reflection: ref } = await res.json();
    setReflection(ref);
    await supabase.from('entries').insert({ date: today, type: 'voice', content: { transcript, notes }, reflection: ref });
    setLoading(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <Shell>
      <div className="page-header">
        <div className="page-title">Voice memo</div>
        <div className="page-meta">na een gesprek, beslissing, of ceremonie</div>
      </div>
      <div className="grid">
        <div className="card grid-full">
          <div className="card-label">opname</div>
          <div className="voice-area">
            {supported ? (
              <>
                <button className={`record-btn ${recording ? 'recording' : ''}`} onClick={recording ? stopRecording : startRecording}>
                  <span className="record-dot" />
                  {recording ? 'stop opname' : 'start opname'}
                </button>
                {transcript && <div className="transcript-box">{transcript}</div>}
                {!transcript && !recording && <div className="no-speech">klik om te beginnen · spreek Nederlands</div>}
              </>
            ) : (
              <div className="no-speech">spraakherkenning niet beschikbaar · gebruik Chrome of Safari</div>
            )}
          </div>
        </div>
        <div className="card grid-full">
          <div className="prompt">Wat wil je toevoegen dat je niet uitsprak?</div>
          <textarea placeholder="schrijf vrij…" value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
        </div>
        <div className="card grid-full">
          <div className="action-row">
            <button className="btn" onClick={handleSave} disabled={loading || (!transcript && !notes)}>
              {loading ? <><span className="spinner" />analyseren…</> : 'opslaan & analyseren'}
            </button>
            <span className={`saved-msg ${saved ? 'show' : ''}`}>✓ opgeslagen</span>
          </div>
          {reflection && (
            <div className="reflection">
              <div className="reflection-label">onderstroom · stem-analyse</div>
              <div className="reflection-text">{reflection}</div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
