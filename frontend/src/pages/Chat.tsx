import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../api';
import { Send, Globe, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { t } from '../utils/i18n';

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
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      const recognitionLocaleMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        mr: 'mr-IN',
        gu: 'gu-IN',
        kn: 'kn-IN',
        ml: 'ml-IN',
        bn: 'bn-IN',
        pa: 'pa-IN'
      };

      rec.lang = recognitionLocaleMap[language] || 'en-IN';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      window.speechSynthesis.cancel(); // Stop assistant speaking when user starts talking
      setSpeakingIndex(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Stop any active speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speakMessage = (text: string, index: number) => {
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();

    // Map language code to Indian locales
    const voiceLocaleMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      ta: 'ta-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      bn: 'bn-IN',
      pa: 'pa-IN'
    };

    const cleanText = text.replace(/[*#_`]/g, ''); // Strip markdown syntax for cleaner speech
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = voiceLocaleMap[language] || 'en-IN';
    
    // Find matching system voice
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.includes(utterance.lang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      setSpeakingIndex(null);
    };

    utterance.onerror = () => {
      setSpeakingIndex(null);
    };

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

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

  // Synchronize greeting when language changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([
        {
          role: 'assistant',
          text: t('chat_greeting', language)
        }
      ]);
    }
  }, [language]);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', label: 'മലയാളം (Malayalam)' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' }
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

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    
    // Map code to full name
    const langMapping: Record<string, string> = {
      en: 'English',
      hi: 'Hindi',
      ta: 'Tamil',
      bn: 'Bengali',
      te: 'Telugu',
      mr: 'Marathi',
      gu: 'Gujarati',
      kn: 'Kannada',
      ml: 'Malayalam',
      pa: 'Punjabi'
    };
    const displayLang = langMapping[newLang] || 'English';
    const userRaw = localStorage.getItem('saathi_user');
    if (userRaw) {
      const uObj = JSON.parse(userRaw);
      uObj.language = displayLang;
      localStorage.setItem('saathi_user', JSON.stringify(uObj));
    }

    // Sync to backend profile
    if (userId) {
      try {
        const profileRes = await api.get(`/profile/${userId}`);
        if (profileRes.data) {
          const profile = profileRes.data;
          await api.put(`/profile/${userId}`, {
            name: profile.name,
            phone: profile.phone,
            language_preference: newLang,
            age: profile.financial_profile.age,
            income: profile.financial_profile.income,
            savings: profile.financial_profile.savings,
            existing_products: profile.financial_profile.existing_products,
          });
        }
      } catch (err) {
        console.error('Error syncing chat language preference to profile:', err);
      }
    }
  };

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
        setMessages((prev) => [...prev, { role: 'assistant', text: t('error_friendly', language) }]);
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      setMessages((prev) => [...prev, { role: 'assistant', text: t('error_friendly', language) }]);
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
            <h3 className="font-extrabold text-sm text-slate-900">{t('saathi_assistant', language)}</h3>
            <span className="text-[9px] text-green-600 font-bold flex items-center mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block mr-1 animate-pulse shadow-[0_0_4px_#22c55e]"></span>
              {t('online_companion', language)}
            </span>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center space-x-1.5 bg-slate-100 border border-navy-light hover:border-gold/30 px-2.5 py-1.5 rounded-md transition-colors">
          <Globe className="w-4 h-4 text-gold" />
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
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
              className={`max-w-[80%] rounded-xl p-4 text-sm leading-relaxed relative ${
                msg.role === 'user'
                  ? 'bg-[#001F70] text-white font-bold rounded-tr-none shadow-sm'
                  : 'bg-[#EAD1BB] text-slate-900 border border-[#D5A27A] rounded-tl-none shadow-sm font-bold pr-8'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              
              {/* Speaker icon for assistant messages */}
              {msg.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => speakMessage(msg.text, index)}
                  className="absolute right-2 bottom-2 p-1 hover:bg-gold/15 rounded text-gold transition-all cursor-pointer border-none"
                  title="Speak message"
                >
                  {speakingIndex === index ? (
                    <VolumeX className="w-4 h-4 text-red-650 animate-pulse" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              )}
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
          <p className="text-[9px] text-copper uppercase tracking-wider font-extrabold mb-2 px-1">{t('suggested_inquiries', language)}</p>
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
        <button
          type="button"
          onClick={toggleListening}
          className={`p-3 rounded-md transition-all shadow-sm shrink-0 cursor-pointer border-none ${
            isListening ? 'bg-red-500 hover:bg-red-650 text-white animate-pulse' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
          }`}
          title={isListening ? "Listening... Click to stop" : "Speak to SAATHI"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('chat_placeholder', language)}
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
