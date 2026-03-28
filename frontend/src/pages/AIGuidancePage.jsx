import { useState, useEffect, useRef } from 'react';
import Layout from '../components/Layout';

const SUGGESTED_QUESTIONS = [
  "What are my rights if I am arrested in India?",
  "How do I file an FIR at a police station?",
  "What is the process for getting bail in India?",
  "How can I file a consumer complaint?",
  "What are tenant rights under Indian law?",
  "How do I file for divorce in India?",
  "What is Section 498A IPC?",
  "How to file an RTI application?",
  "What are my rights as an employee in India?",
  "How to deal with cyber harassment legally?"
];

const AIGuidancePage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: `Namaste! 🙏 I am **Nyaya AI**, your personal legal assistant for Indian law.\n\nI can help you understand:\n- Your legal rights and remedies\n- How to file complaints and cases\n- Relevant laws and sections\n- Step-by-step legal procedures\n\nAsk me any legal question in English or Hindi. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const token = localStorage.getItem('token');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = async (question) => {
    const q = question || input.trim();
    if (!q || loading) return;

    setInput('');
    setShowSuggestions(false);

    // Add user message
    const userMsg = { role: 'user', content: q, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Add loading message
    setMessages(prev => [...prev, {
      role: 'ai',
      content: '...',
      loading: true,
      timestamp: new Date()
    }]);

    try {
      const chatHistory = messages
        .filter(m => !m.loading)
        .slice(1) // skip welcome message
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('http://localhost:5000/api/v1/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          question: q,
          chat_history: chatHistory
        })
      });

      const data = await res.json();

      // Remove loading message and add real response
      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        {
          role: 'ai',
          content: data.answer || data.message || 'Sorry, I could not process your question.',
          timestamp: new Date()
        }
      ]);

    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => !m.loading),
        {
          role: 'ai',
          content: '❌ Cannot connect to AI service. Please make sure the backend is running.',
          timestamp: new Date(),
          error: true
        }
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const formatMessage = (text) => {
    // Convert markdown-like formatting to HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div style={{
        height: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        background: '#0d1117',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #21262d',
          background: '#161b22',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '48px', height: '48px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '24px',
            boxShadow: '0 0 20px rgba(0,212,255,0.3)'
          }}>🤖</div>
          <div>
            <h2 style={{ color: 'white', margin: 0, fontSize: '20px', fontWeight: '700' }}>
              Nyaya AI Legal Assistant
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <div style={{
                width: '8px', height: '8px',
                borderRadius: '50%', background: '#22c55e'
              }} />
              <span style={{ color: '#22c55e', fontSize: '13px' }}>
                Online — Powered by Groq AI
              </span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => {
                setMessages([{
                  role: 'ai',
                  content: 'Namaste! 🙏 I am **Nyaya AI**, your personal legal assistant. How can I help you today?',
                  timestamp: new Date()
                }]);
                setShowSuggestions(true);
              }}
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', borderRadius: '8px',
                padding: '8px 16px', cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              🗑️ Clear Chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px'
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '12px',
              alignItems: 'flex-end'
            }}>
              {/* AI Avatar */}
              {msg.role === 'ai' && (
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '16px',
                  flexShrink: 0
                }}>🤖</div>
              )}

              {/* Message bubble */}
              <div style={{
                maxWidth: '70%',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #00d4ff22, #7c3aed22)'
                  : '#161b22',
                border: `1px solid ${msg.role === 'user'
                  ? 'rgba(0,212,255,0.3)'
                  : msg.error ? 'rgba(239,68,68,0.3)' : '#30363d'}`,
                borderRadius: msg.role === 'user'
                  ? '16px 16px 4px 16px'
                  : '16px 16px 16px 4px',
                padding: '14px 18px',
              }}>
                {msg.loading ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: '8px', height: '8px',
                        borderRadius: '50%', background: '#00d4ff',
                        animation: `bounce 1s infinite ${i * 0.2}s`
                      }} />
                    ))}
                    <style>{`
                      @keyframes bounce {
                        0%, 100% { transform: translateY(0); opacity: 0.4; }
                        50% { transform: translateY(-6px); opacity: 1; }
                      }
                    `}</style>
                  </div>
                ) : (
                  <>
                    <div
                      style={{
                        color: msg.role === 'user' ? '#e6edf3' : '#c9d1d9',
                        fontSize: '14px', lineHeight: '1.6'
                      }}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                    <p style={{
                      color: '#6e7681', fontSize: '11px',
                      margin: '8px 0 0 0', textAlign: 'right'
                    }}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </>
                )}
              </div>

              {/* User Avatar */}
              {msg.role === 'user' && (
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7c3aed, #00d4ff)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'white',
                  fontWeight: 'bold', fontSize: '14px', flexShrink: 0
                }}>
                  {(JSON.parse(localStorage.getItem('user') || '{}').full_name || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
          ))}

          {/* Suggested Questions */}
          {showSuggestions && (
            <div style={{ marginTop: '8px' }}>
              <p style={{ color: '#8b949e', fontSize: '13px', marginBottom: '12px' }}>
                💡 Suggested questions:
              </p>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px'
              }}>
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    style={{
                      background: 'rgba(0,212,255,0.08)',
                      border: '1px solid rgba(0,212,255,0.2)',
                      color: '#00d4ff', borderRadius: '20px',
                      padding: '8px 16px', cursor: 'pointer',
                      fontSize: '13px', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = 'rgba(0,212,255,0.15)';
                      e.target.style.border = '1px solid rgba(0,212,255,0.4)';
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = 'rgba(0,212,255,0.08)';
                      e.target.style.border = '1px solid rgba(0,212,255,0.2)';
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #21262d',
          background: '#161b22'
        }}>
          {/* Disclaimer */}
          <p style={{
            color: '#6e7681', fontSize: '12px',
            textAlign: 'center', marginBottom: '12px'
          }}>
            ⚠️ AI responses are for informational purposes only and do not constitute legal advice.
            Consult a qualified advocate for your specific situation.
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask any legal question... (Press Enter to send, Shift+Enter for new line)"
              rows={2}
              style={{
                flex: 1, background: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: '12px', color: 'white',
                padding: '12px 16px', fontSize: '14px',
                resize: 'none', outline: 'none',
                fontFamily: 'Inter, sans-serif',
                lineHeight: '1.5'
              }}
              onFocus={e => e.target.style.border = '1px solid #00d4ff'}
              onBlur={e => e.target.style.border = '1px solid #30363d'}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: '52px', height: '52px',
                background: input.trim() && !loading
                  ? 'linear-gradient(135deg, #00d4ff, #7c3aed)'
                  : '#21262d',
                border: 'none', borderRadius: '12px',
                color: 'white', fontSize: '20px',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
                transition: 'all 0.2s'
              }}
            >
              {loading ? '⏳' : '→'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIGuidancePage;
