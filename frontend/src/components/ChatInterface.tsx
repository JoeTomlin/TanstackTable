import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle } from 'lucide-react';
import type { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
}

// Neumorphism styles
const neumorph = {
  raised: {
    boxShadow: '4px 4px 8px #d4cfc6, -4px -4px 8px #ffffff',
    borderRadius: '16px',
    backgroundColor: '#e8e0d5',
  },
  inset: {
    boxShadow: 'inset 4px 4px 8px #d4cfc6, inset -4px -4px 8px #ffffff',
    borderRadius: '16px',
    backgroundColor: '#e8e0d5',
  },
  button: {
    boxShadow: '4px 4px 8px #d4cfc6, -4px -4px 8px #ffffff',
    borderRadius: '12px',
    backgroundColor: '#e8e0d5',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: "'Inter', system-ui, sans-serif",
  }
};

export default function ChatInterface({ messages, isLoading, onSendMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const suggestions = [
    "Show all active contracts",
    "Add a new contract",
    "Total contract value?",
    "Delete a contract"
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ 
        padding: '20px 24px',
        background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        borderRadius: '24px 24px 0 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles size={20} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontWeight: 600, color: 'white', fontSize: '1.125rem', fontFamily: "'Inter', system-ui, sans-serif" }}>AI Assistant</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: '#fef3c7', fontFamily: "'Inter', system-ui, sans-serif" }}>Manage your contracts with AI</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        backgroundColor: '#e8e0d5'
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...neumorph.raised
            }}>
              <MessageCircle size={28} style={{ color: '#7c3aed' }} />
            </div>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: 600, 
              color: '#1f2937', 
              margin: '0 0 8px 0',
              fontFamily: "'Inter', system-ui, sans-serif",
              letterSpacing: '-0.01em'
            }}>
              How can I help?
            </h3>
            <p style={{ fontSize: '0.9375rem', color: '#4b5563', margin: '0 0 20px 0', lineHeight: 1.5, fontFamily: "'Inter', system-ui, sans-serif" }}>
              I can help you manage your contracts. Try these:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(suggestion)}
                  style={{
                    ...neumorph.button,
                    padding: '10px 18px',
                    fontSize: '0.875rem',
                    color: '#4b5563',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#7c3aed';
                    e.currentTarget.style.boxShadow = 'inset 2px 2px 4px #d4cfc6, inset -2px -2px 4px #ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.boxShadow = '4px 4px 8px #d4cfc6, -4px -4px 8px #ffffff';
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{ 
                display: 'flex', 
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start' 
              }}
            >
              <div
                style={{
                  maxWidth: '85%',
                  padding: '12px 16px',
                  ...(message.role === 'user' 
                    ? {
                        background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
                        color: 'white',
                        borderRadius: '16px 16px 4px 16px',
                        boxShadow: '4px 4px 8px #d4cfc6, -2px -2px 6px #ffffff'
                      }
                    : {
                        ...neumorph.raised,
                        borderRadius: '16px 16px 16px 4px',
                        color: '#374151'
                      }
                  )
                }}
              >
                <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {message.content}
                </p>
                <span style={{ 
                  display: 'block',
                  fontSize: '0.75rem', 
                  marginTop: '8px',
                  color: message.role === 'user' ? '#e9d5ff' : '#9ca3af'
                }}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '12px' }}>
            <div style={{ 
              ...neumorph.raised,
              padding: '14px 18px',
              borderRadius: '16px 16px 16px 4px',
            }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#a855f7',
                      animation: 'bounce 1s infinite',
                      animationDelay: `${i * 0.15}s`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ padding: '16px 20px', backgroundColor: '#e8e0d5' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me about contracts"
            disabled={isLoading}
            style={{
              flex: 1,
              ...neumorph.inset,
              padding: '14px 18px',
              fontSize: '0.9375rem',
              border: 'none',
              outline: 'none',
              color: '#1f2937',
              lineHeight: 1.5,
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            style={{
              ...neumorph.button,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
              opacity: (isLoading || !input.trim()) ? 0.5 : 1,
            }}
          >
            <Send size={18} color="white" />
          </button>
        </div>
      </form>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
