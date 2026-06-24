import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import { Send, Globe } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

export const Chat: React.FC = () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Namaste! I am SAATHI, your SBI YONO financial companion. How can I help you with your banking, budgeting, or investments today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);

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
        setMessages((prev) => [...prev, { role: 'assistant', text: 'Sorry, I encountered an issue. Please try again.' }]);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Error connecting to SAATHI backend. Please ensure uvicorn is running locally.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-13rem)] md:h-[calc(100vh-11rem)] bg-navy border border-navy-light/60 rounded-2xl overflow-hidden shadow-xl">
      {/* Chat header */}
      <div className="p-4 bg-navy border-b border-navy-light/60 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center font-bold text-navy">
            S
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">SAATHI Agent</h3>
            <span className="text-[10px] text-green-400 flex items-center">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block mr-1 animate-pulse"></span>
              Online Companion
            </span>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center space-x-1.5 bg-navy-light/60 border border-navy-light px-2.5 py-1.5 rounded-lg">
          <Globe className="w-4 h-4 text-gold" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-semibold"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-navy text-white text-xs">
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 text-sm shadow-md leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gold text-navy font-semibold rounded-tr-none'
                  : 'bg-navy-light/70 text-white border border-navy-light/40 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-navy-light/70 text-white border border-navy-light/40 rounded-2xl rounded-tl-none p-4 flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2.5 h-2.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2.5 h-2.5 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompts Panel */}
      {messages.length === 1 && (
        <div className="p-3 bg-navy-dark/40 border-t border-navy-light/30">
          <p className="text-[10px] text-gold uppercase tracking-wider font-bold mb-2 px-1">Suggested Inquiries</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="text-xs bg-navy-light/40 hover:bg-gold/20 text-gray-300 hover:text-gold border border-navy-light px-3 py-1.5 rounded-full transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat input form */}
      <form onSubmit={handleFormSubmit} className="p-3 bg-navy border-t border-navy-light/60 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask SAATHI a banking query..."
          className="flex-grow bg-navy-dark border border-navy-light/60 text-white placeholder-gray-400 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-gold/60 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-3 bg-gold hover:bg-gold-dark disabled:bg-gray-600 disabled:text-gray-400 text-navy font-bold rounded-xl transition-all shadow-md shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
