import React, { useEffect, useRef, useState } from 'react';
import { submitReport } from '../lib/api.js';

const LANGUAGES = [
  { code: '', label: 'Auto-detect', speech: 'en-US' },
  { code: 'en', label: 'English', speech: 'en-US' },
  { code: 'es', label: 'Español', speech: 'es-ES' },
  { code: 'fr', label: 'Français', speech: 'fr-FR' },
  { code: 'de', label: 'Deutsch', speech: 'de-DE' },
  { code: 'pt', label: 'Português', speech: 'pt-BR' },
  { code: 'ar', label: 'العربية', speech: 'ar-SA' },
  { code: 'zh', label: '中文', speech: 'zh-CN' },
  { code: 'ja', label: '日本語', speech: 'ja-JP' },
];

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition ?? window.webkitSpeechRecognition
    : null;

export default function ReportForm({ onReportSubmitted }) {
  const [text, setText] = useState('');
  const [languageHint, setLanguageHint] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  function toggleMic() {
    if (recording) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = LANGUAGES.find(l => l.code === languageHint)?.speech ?? 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = e => {
      const transcript = e.results[0][0].transcript;
      setText(prev => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => setRecording(false);
    recognitionRef.current = rec;
    setRecording(true);
    rec.start();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const result = await submitReport({ text, languageHint: languageHint || null });
      setStatus({ type: 'success', result });
      setText('');
      onReportSubmitted?.(result);
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" aria-label="Submit a crowd report">
      <div className="card-head">
        <h2 className="card-title">Report What You See</h2>
      </div>
      <p className="card-sub" style={{ marginBottom: 14 }}>
        Type or speak in any language — Claude translates and structures it, the fusion
        engine cross-checks it against other fans.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <label htmlFor="report-text" className="field-label">Your report</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <textarea
            id="report-text"
            className="textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder='e.g. "Gate B queue is really long" or "Cola en Puerta B muy larga"'
            rows={3}
            maxLength={500}
            required
            disabled={loading}
            aria-describedby="report-counter"
          />
          {SpeechRecognition && (
            <button
              type="button"
              className={`mic-btn ${recording ? 'recording' : ''}`}
              onClick={toggleMic}
              disabled={loading}
              aria-pressed={recording}
              aria-label={recording ? 'Stop voice input' : 'Start voice input'}
              title={recording ? 'Listening… tap to stop' : 'Speak your report'}
            >
              {recording ? '⏺' : '🎙'}
            </button>
          )}
        </div>
        <span id="report-counter" className="card-sub" style={{ textAlign: 'right' }} aria-live="polite">
          {text.length}/500
        </span>

        <label htmlFor="lang-select" className="field-label">Language (optional)</label>
        <select
          id="lang-select"
          className="select"
          value={languageHint}
          onChange={e => setLanguageHint(e.target.value)}
          disabled={loading}
        >
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>

        <button type="submit" className="btn" disabled={loading || !text.trim()}>
          {loading ? 'Analyzing your report…' : 'Submit Report'}
        </button>
      </form>

      {status?.type === 'success' && (
        <div role="status" className="notice success">
          <strong>Report fused in.</strong> {status.result.zone?.name} is now{' '}
          <strong>{status.result.state?.status}</strong> ({status.result.state?.confidenceLabel},{' '}
          {status.result.state?.supportingReports} supporting reports).
        </div>
      )}
      {status?.type === 'error' && (
        <div role="alert" className="notice error">{status.message}</div>
      )}
    </section>
  );
}
