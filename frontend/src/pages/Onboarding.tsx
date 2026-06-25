import React, { useState } from 'react';
import saathiLogo from '../assets/saathi_logo.png';
import { User, Globe, DollarSign, ArrowRight, ArrowLeft, Play, Shield } from 'lucide-react';

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('English');
  const [incomeRange, setIncomeRange] = useState('₹50K-1L');

  const languages = [
    { label: 'English', value: 'English' },
    { label: 'हिंदी', value: 'Hindi' },
    { label: 'தமிழ்', value: 'Tamil' },
    { label: 'বাংলা', value: 'Bengali' },
  ];

  const incomes = [
    { label: 'Below ₹25K', value: 'Below ₹25K' },
    { label: '₹25K-50K', value: '₹25K-50K' },
    { label: '₹50K-1L', value: '₹50K-1L' },
    { label: 'Above ₹1L', value: 'Above ₹1L' },
  ];

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const saveUser = (userData: { name: string; language: string; income_range: string; user_id: string }) => {
    localStorage.setItem('saathi_user', JSON.stringify(userData));
    localStorage.setItem('saathi_user_id', userData.user_id);
    window.location.href = '/';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userData = {
      name,
      language,
      income_range: incomeRange,
      user_id: 'demo-user-001'
    };
    saveUser(userData);
  };

  const handleTryDemo = () => {
    const demoData = {
      name: 'Rahul Sharma',
      language: 'English',
      income_range: '₹50K-1L',
      user_id: 'demo-user-001'
    };
    saveUser(demoData);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 selection:bg-gold selection:text-white font-sans">
      <div className="max-w-lg w-full bg-white border border-navy-light shadow-md rounded-2xl overflow-hidden p-6 md:p-8 relative">
        
        {/* Try Demo Button in top right corner */}
        <button
          onClick={handleTryDemo}
          className="absolute top-4 right-4 flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-gold border border-gold hover:bg-gold hover:text-white rounded-md transition-all cursor-pointer shadow-sm bg-transparent"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Try Demo</span>
        </button>

        {/* Logo and Progress Header */}
        <div className="text-center mb-8 mt-4">
          <img src={saathiLogo} alt="SAATHI Logo" className="w-16 h-16 object-contain rounded-lg mb-4 mx-auto" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">SAATHI</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-0.5">
            SBI YONO AGENTIC AI COMPANION
          </p>
          
          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2 mt-6">
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-8 bg-gold' : 'w-2 bg-slate-200'}`}></span>
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-8 bg-gold' : 'w-2 bg-slate-200'}`}></span>
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-8 bg-gold' : 'w-2 bg-slate-200'}`}></span>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-lg font-extrabold text-slate-800 text-center flex items-center justify-center gap-1.5">
                Hi! I am SAATHI 👋 What's your name?
              </h2>
              <div className="relative max-w-sm mx-auto mt-4">
                <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-navy-light rounded-md focus:outline-none focus:border-gold transition-colors text-slate-900 font-bold"
                  placeholder="Enter your name"
                />
              </div>
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  disabled={!name.trim()}
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gold text-white font-bold rounded-md hover:bg-gold-dark disabled:bg-slate-200 disabled:text-slate-400 transition-all cursor-pointer shadow-sm border-none"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-lg font-extrabold text-slate-800 text-center flex items-center justify-center gap-1.5">
                <Globe className="w-5 h-5 text-gold" /> Which language do you prefer?
              </h2>
              
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mt-4">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setLanguage(lang.value)}
                    className={`py-3 px-4 border rounded-md font-bold text-sm transition-all cursor-pointer ${
                      language === lang.value
                        ? 'border-gold bg-gold/5 text-gold shadow-sm'
                        : 'border-navy-light bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <div className="pt-6 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center space-x-2 px-5 py-2.5 border border-navy-light hover:bg-slate-50 text-slate-600 font-bold rounded-md transition-all cursor-pointer shadow-sm bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gold text-white font-bold rounded-md hover:bg-gold-dark transition-all cursor-pointer shadow-sm border-none"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in-up">
              <h2 className="text-lg font-extrabold text-slate-800 text-center flex items-center justify-center gap-1.5">
                <DollarSign className="w-5 h-5 text-gold" /> What's your monthly income range?
              </h2>
              
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mt-4">
                {incomes.map((inc) => (
                  <button
                    key={inc.value}
                    type="button"
                    onClick={() => setIncomeRange(inc.value)}
                    className={`py-3 px-4 border rounded-md font-bold text-sm transition-all cursor-pointer ${
                      incomeRange === inc.value
                        ? 'border-gold bg-gold/5 text-gold shadow-sm'
                        : 'border-navy-light bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {inc.label}
                  </button>
                ))}
              </div>

              <div className="pt-6 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center space-x-2 px-5 py-2.5 border border-navy-light hover:bg-slate-50 text-slate-600 font-bold rounded-md transition-all cursor-pointer shadow-sm bg-transparent"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-6 py-2.5 bg-gold text-white font-bold rounded-md hover:bg-gold-dark transition-all cursor-pointer shadow-sm border-none"
                >
                  <span>Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>

        <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-400 text-center mt-8 pt-4 border-t border-slate-100">
          <Shield className="w-3.5 h-3.5" />
          <span>Encrypted with SBI secure companion protocols.</span>
        </div>

      </div>
    </div>
  );
};
