import React, { useState, useRef, useEffect } from 'react';
import { askAssistant } from '../lib/api.js';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'pt', label: 'Português' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
];

const SUGGESTIONS = [
  'Which gate is fastest right now?',
  'Accessible route to Level 1 amenities?',
  'Should I take the train after the match?',
  '¿Dónde hay menos gente ahora?',
];

export default function ChatAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm the PulseMap assistant. I answer from the live fused zone data — crowds, queues, routes, accessibility — in your language.",
    },
  ]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('en');
  const [plainLanguage, setPlainLanguage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function ask(question) {
    if (!question.trim() || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setLoading(true);
    try {
      const { answer, mode: responseMode } = await askAssistant({
        question,
        userLanguagePreference: lang,
        accessibilityMode: plainLanguage ? 'plain-language' : 'standard',
      });
      setMode(responseMode);
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: `Sorry, I couldn't reach the assistant: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" aria-label="Chat assistant" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {mode === 'fallback' && (
        <div className="demo-note" role="note">
          Demo mode — running without an API key. Answers are rule-based.
        </div>
      )}

      <div className="card-head" style={{ marginBottom: 0 }}>
        <h2 className="card-title">Ask PulseMap</h2>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={plainLanguage}
              onChange={e => setPlainLanguage(e.target.checked)}
            />
            Plain language
          </label>
          <label htmlFor="chat-lang" className="visually-hidden">Response language</label>
          <select
            id="chat-lang"
            className="select"
            style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
            value={lang}
            onChange={e => setLang(e.target.value)}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map((msg, i) => (
          <div key={i} className={`bubble ${msg.role}`}>
            <span className="bubble-role">{msg.role === 'user' ? 'You' : 'PulseMap'}</span>
            <p className="bubble-text">{msg.text}</p>
          </div>
        ))}
        {loading && (
          <div className="bubble assistant">
            <span className="bubble-role">PulseMap</span>
            <p className="bubble-text" style={{ color: 'var(--text-muted)' }}>
              Checking the live zone data…
            </p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chips" aria-label="Suggested questions">
        {SUGGESTIONS.map(q => (
          <button key={q} type="button" className="chip" disabled={loading} onClick={() => ask(q)}>
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={e => { e.preventDefault(); ask(input.trim()); }}
        style={{ display: 'flex', gap: 8 }}
      >
        <label htmlFor="chat-input" className="visually-hidden">Your question</label>
        <input
          id="chat-input"
          type="text"
          className="input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="e.g. Which gate has the shortest queue?"
          disabled={loading}
          maxLength={500}
          aria-label="Ask a question about the stadium"
        />
        <button type="submit" className="btn" style={{ padding: '10px 18px' }} disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}
