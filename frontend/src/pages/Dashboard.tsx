import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { MessageSquare, Award, User, Zap, TrendingUp, LayoutDashboard, Globe, ArrowRight, RefreshCw } from 'lucide-react';
import saathiLogo from '../assets/saathi_logo.png';

interface Nudge {
  id: string;
  type: string;
  message: string;
  sent_at: string;
}

interface Recommendation {
  id: string;
  product_type: string;
  reason: string;
  score: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('saathi_user_id') || '';
  
  // Get saathi_user object from localStorage
  const userRaw = localStorage.getItem('saathi_user');
  const saathiUser = userRaw ? JSON.parse(userRaw) : null;
  const name = saathiUser?.name || 'User';
  const language = saathiUser?.language || 'English';

  const [profile, setProfile] = useState<any>(null);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const profileRes = await api.get(`/profile/${userId}`);
      setProfile(profileRes.data);

      const nudgeRes = await api.get(`/nudges/${userId}`);
      setNudges(nudgeRes.data.nudges || []);
      
      const recsRes = await api.get(`/recommendations/${userId}`);
      setRecs(recsRes.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('SAATHI is thinking... please try again 🙏');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  // Section 1: Today's Nudge selection
  const defaultNudgeMessage = `💰 Your ₹45,000 salary was credited! Park ₹5,000 in SBI FD @ 7.1% p.a. for guaranteed returns`;
  const todayNudgeText = nudges.length > 0 ? nudges[0].message : defaultNudgeMessage;

  const handleTakeAction = () => {
    const prefilledMessage = todayNudgeText.includes('credited') 
      ? "How can I park ₹5,000 from my salary credit in SBI FD?"
      : `Tell me more about this nudge: "${todayNudgeText}"`;
    navigate('/chat', { state: { prefilledMessage } });
  };

  // Section 2: For You recommendations
  const defaultRecommendations = [
    {
      id: 'rec-fd',
      product_type: 'SBI Tax Saving FD',
      reason: 'Save taxes and earn guaranteed returns of 7.1% p.a. with flexible lock-in periods.',
      prefill: 'How do I invest in SBI Tax Saving FD?'
    },
    {
      id: 'rec-sip',
      product_type: 'SBI Mutual Fund (SIP)',
      reason: 'Start your wealth generation journey with as little as ₹500/month in market funds.',
      prefill: 'How can I start an SBI Mutual Fund SIP?'
    },
    {
      id: 'rec-loan',
      product_type: 'SBI Personal Loan',
      reason: 'Enjoy pre-approved loans at attractive interest rates and zero processing fees.',
      prefill: 'What are the eligibility criteria for SBI Personal Loan?'
    }
  ];

  const displayRecs = recs.length > 0 
    ? recs.slice(0, 3).map((r) => ({
        id: r.id,
        product_type: r.product_type,
        reason: r.reason,
        prefill: `Tell me about ${r.product_type} and how it benefits me.`
      }))
    : defaultRecommendations;

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-red-50/50 border border-red-200 rounded-xl">
        <p className="font-bold text-red-800 text-base mb-3">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-5 py-2.5 bg-red-650 hover:bg-red-700 text-white font-bold text-xs rounded-md transition-all shadow-sm cursor-pointer border-none"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* 1. Header Row */}
      <div className="flex items-center justify-between bg-white border border-navy-light px-5 py-4 rounded-xl shadow-sm">
        <div className="flex items-center space-x-3">
          <img src={saathiLogo} alt="SAATHI Logo" className="w-9 h-9 object-contain rounded-lg" />
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
              Namaste, <span className="text-gradient-gold">{name}</span> 👋
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              YOUR PERSONAL FINANCIAL COMPANION
            </p>
          </div>
        </div>
        
        {/* Language Badge */}
        <div className="flex items-center space-x-1 bg-slate-100 border border-navy-light px-2.5 py-1 rounded-full shadow-sm">
          <Globe className="w-3.5 h-3.5 text-gold" />
          <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">{language}</span>
        </div>
      </div>

      {/* Sandbox Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card border border-navy-light p-3.5 rounded-xl shadow-sm bg-white">
          <span className="text-[8px] text-copper uppercase tracking-wider font-extrabold block">Monthly Income</span>
          <span className="text-sm md:text-base font-black text-slate-950 mt-0.5 block">
            {profile ? `₹${profile.financial_profile.income.toLocaleString('en-IN')}` : '₹50,000'}
          </span>
        </div>
        <div className="glass-card border border-navy-light p-3.5 rounded-xl shadow-sm bg-white">
          <span className="text-[8px] text-copper uppercase tracking-wider font-extrabold block">Total Savings</span>
          <span className="text-sm md:text-base font-black text-slate-950 mt-0.5 block">
            {profile ? `₹${profile.financial_profile.savings.toLocaleString('en-IN')}` : '₹2,50,000'}
          </span>
        </div>
        <div className="glass-card border border-navy-light p-3.5 rounded-xl shadow-sm bg-white">
          <span className="text-[8px] text-copper uppercase tracking-wider font-extrabold block">Preferred Lang</span>
          <span className="text-sm md:text-base font-black text-slate-950 mt-0.5 block truncate">
            {language}
          </span>
        </div>
      </div>

      {/* 2. Section 1 — TODAY'S NUDGE (gold card) */}
      <div className="border border-gold rounded-xl overflow-hidden shadow-gold-glow bg-white">
        <div className="bg-gold/5 px-4 py-3 flex items-center justify-between border-b border-gold/15">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-copper animate-bounce" />
            <span className="font-extrabold text-slate-900 tracking-wider text-[10px] uppercase">Today's Active Money Nudge</span>
          </div>
          <span className="text-[8px] font-extrabold text-copper uppercase tracking-wider bg-white border border-navy-light px-2 py-0.5 rounded">
            Live AI Nudge
          </span>
        </div>
        
        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl mt-0.5" role="img" aria-label="money icon">💰</span>
            <div>
              <p className="text-slate-950 text-sm md:text-base leading-relaxed font-extrabold">
                {todayNudgeText}
              </p>
              <p className="text-[9px] text-slate-400 mt-1 font-bold">
                Analyzing your in-app simulator ledger patterns.
              </p>
            </div>
          </div>
          <button 
            onClick={handleTakeAction}
            className="shrink-0 flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-gold hover:bg-gold-dark text-white font-bold text-xs rounded-md transition-all shadow-sm cursor-pointer border-none"
          >
            <span>Take Action</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Section 2 — FOR YOU (recommendation cards) */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1.5">
          <TrendingUp className="w-4 h-4 text-gold" />
          <span>For You — Personalized SBI Products</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayRecs.map((rec) => (
            <div 
              key={rec.id} 
              className="glass-card border border-navy-light hover:border-gold/30 p-5 rounded-xl shadow-sm flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200 group bg-white"
            >
              <div>
                <span className="font-extrabold text-slate-950 text-sm block tracking-tight">
                  {rec.product_type}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed mt-2">
                  {rec.reason}
                </p>
              </div>
              <button 
                onClick={() => navigate('/chat', { state: { prefilledMessage: rec.prefill } })}
                className="w-full mt-4 bg-slate-50 hover:bg-gold hover:text-white text-gold text-xs font-extrabold py-2 rounded-md transition-all border border-gold/15 hover:border-transparent cursor-pointer"
              >
                Ask SAATHI
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Section 3 — QUICK ACTIONS (bottom) */}
      <div className="space-y-3">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Actions</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="flex flex-col items-center justify-center p-4 bg-white border border-navy-light hover:border-gold/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gold/5 flex items-center justify-center text-gold group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold mt-2.5 text-slate-800">Chat with SAATHI</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center justify-center p-4 bg-white border border-navy-light hover:border-gold/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gold/5 flex items-center justify-center text-gold group-hover:scale-105 transition-transform">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold mt-2.5 text-slate-800">My Finances</span>
          </button>

          <button
            onClick={() => navigate('/recommendations')}
            className="flex flex-col items-center justify-center p-4 bg-white border border-navy-light hover:border-gold/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gold/5 flex items-center justify-center text-gold group-hover:scale-105 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold mt-2.5 text-slate-800">Recommendations</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center justify-center p-4 bg-white border border-navy-light hover:border-gold/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-gold/5 flex items-center justify-center text-gold group-hover:scale-105 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold mt-2.5 text-slate-800">My Profile</span>
          </button>
        </div>
      </div>

    </div>
  );
};
