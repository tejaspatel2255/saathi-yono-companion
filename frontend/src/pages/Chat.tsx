import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { Send, Globe } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const Chat: React.FC = () => {
  const userId = localStorage.getItem('saathi_user_id') || '';
  const chatEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Namaste! I am SAATHI, your SBI YONO financial companion. How can I help you with your banking, budgeting, or investments today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      api.get(`/profile/${userId}`)
        .then((res) => {
          if (res.data && res.data.language_preference) {
            setLanguage(res.data.language_preference);
          }
        })
        .catch((err) => console.error('Error fetching chat language preference:', err));
    }
  }, [userId]);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'bn', label: 'বাংলা (Bengali)' }
  ];

  const quickPrompts = [
    'Check current FD rates',
    'How do I open an SIP?',
    'Explain personal loan criteria',
    'How can I lodge a YONO login issue?'
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    // Add user message
    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/chat', {
        user_id: userId,
        message: textToSend,
        language: language
      });
      
      if (response.data && response.data.reply) {
        setMessages((prev) => [...prev, { role: 'assistant', text: response.data.reply }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', text: 'SAATHI is thinking... please try again 🙏' }]);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      setMessages((prev) => [...prev, { role: 'assistant', text: 'SAATHI is thinking... please try again 🙏' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger prefilled message from navigation state if present
  useEffect(() => {
    const prefilled = location.state?.prefilledMessage;
    if (prefilled) {
      handleSendMessage(prefilled);
      // Clean state to avoid sending again on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] md:h-[calc(100vh-11rem)] glass-card border border-navy-light rounded-xl overflow-hidden shadow-sm">
      {/* Chat header */}
      <div className="p-4 bg-slate-50 border-b border-navy-light flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gold flex items-center justify-center font-bold text-white shadow-sm">
            S
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">SAATHI Agent</h3>
            <span className="text-[9px] text-green-600 font-bold flex items-center mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block mr-1 animate-pulse shadow-[0_0_4px_#22c55e]"></span>
              Online Companion
            </span>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center space-x-1.5 bg-slate-100 border border-navy-light hover:border-gold/30 px-2.5 py-1.5 rounded-md transition-colors">
          <Globe className="w-4 h-4 text-gold" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-xs text-slate-900 focus:outline-none cursor-pointer font-bold"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-white text-slate-900 text-xs">
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-white">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl p-4 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#001F70] text-white font-bold rounded-tr-none shadow-sm'
                  : 'bg-[#EAD1BB] text-slate-900 border border-[#D5A27A] rounded-tl-none shadow-sm font-bold'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#EAD1BB] text-slate-900 border border-[#D5A27A] rounded-xl rounded-tl-none p-4 flex items-center space-x-1.5 shadow-sm">
              <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts Panel */}
      {messages.length === 1 && (
        <div className="p-3 bg-slate-50 border-t border-navy-light">
          <p className="text-[9px] text-copper uppercase tracking-wider font-extrabold mb-2 px-1">Suggested Inquiries</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="text-xs bg-white hover:bg-slate-100 text-slate-700 hover:text-gold border border-navy-light hover:border-gold/30 px-3.5 py-1.5 rounded-md transition-all cursor-pointer shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat input form */}
      <form onSubmit={handleFormSubmit} className="p-3 bg-slate-50 border-t border-navy-light flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SAATHI a banking query..."
          className="flex-grow bg-white border border-navy-light text-slate-900 placeholder-slate-400 text-sm px-4 py-3 rounded-md focus:outline-none focus:border-gold/60 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-3 bg-gold hover:bg-gold-dark disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-md transition-all shadow-sm shrink-0 cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
