import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { MessageSquare, Award, User, RefreshCw, Zap, TrendingUp, Sparkles } from 'lucide-react';

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
  
  const [profile, setProfile] = useState<any>(null);
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loadingNudge, setLoadingNudge] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const fetchDashboardData = async () => {
    if (!userId) return;
    try {
      setLoadingData(true);
      const profileRes = await api.get(`/profile/${userId}`);
      setProfile(profileRes.data);

      const nudgeRes = await api.get(`/nudges/${userId}`);
      setNudges(nudgeRes.data.nudges || []);
      
      const recsRes = await api.get(`/recommendations/${userId}`);
      setRecs(recsRes.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userId]);

  const triggerNudgeGeneration = async () => {
    try {
      setLoadingNudge(true);
      const res = await api.post(`/nudges/generate/${userId}`);
      if (res.data) {
        setNudges((prev) => [res.data, ...prev]);
      }
    } catch (error) {
      console.error('Error triggering nudge generation:', error);
    } finally {
      setLoadingNudge(false);
    }
  };

  const triggerRecsGeneration = async () => {
    try {
      setLoadingRecs(true);
      const res = await api.post(`/recommendations/generate/${userId}`);
      if (res.data && res.data.recommendations) {
        setRecs(res.data.recommendations);
      }
    } catch (error) {
      console.error('Error triggering recommendations generation:', error);
    } finally {
      setLoadingRecs(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-card border border-navy-light p-6 rounded-xl relative overflow-hidden shadow-sm">
        <div className="absolute right-4 top-4 opacity-[0.02] pointer-events-none">
          <Sparkles className="w-32 h-32 text-gold" />
        </div>
        <h1 className="text-xl md:text-2xl font-black text-slate-900">
          Welcome back, <span className="text-gradient-gold">{profile ? profile.name.split(' ')[0] : 'User'}</span>!
        </h1>
        <p className="text-slate-600 text-xs md:text-sm mt-1 max-w-xl leading-relaxed">
          SAATHI has reviewed your transactions. We have found new opportunities to optimize your savings and interest rates.
        </p>
      </div>

      {/* Dynamic Sandbox Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card border border-navy-light p-4 rounded-xl shadow-sm bg-white">
          <span className="text-[9px] text-copper uppercase tracking-wider font-extrabold block">Monthly Income</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            ₹{profile ? profile.financial_profile.income.toLocaleString('en-IN') : '0'}
          </span>
        </div>
        <div className="glass-card border border-navy-light p-4 rounded-xl shadow-sm bg-white">
          <span className="text-[9px] text-copper uppercase tracking-wider font-extrabold block">Total Savings</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">
            ₹{profile ? profile.financial_profile.savings.toLocaleString('en-IN') : '0'}
          </span>
        </div>
        <div className="glass-card border border-navy-light p-4 rounded-xl shadow-sm bg-white">
          <span className="text-[9px] text-copper uppercase tracking-wider font-extrabold block">Linked SBI Accounts</span>
          <span className="text-xs font-bold text-slate-700 mt-1 block truncate">
            {profile && profile.financial_profile.existing_products.length > 0
              ? profile.financial_profile.existing_products.join(', ')
              : 'None'}
          </span>
        </div>
      </div>

      {/* Proactive Nudge Card */}
      <div className="glass-card-gold rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gold/5 p-4 flex items-center justify-between border-b border-gold/20">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-copper animate-bounce" />
            <span className="font-extrabold text-slate-900 tracking-wider text-xs uppercase">Proactive Money Nudges</span>
          </div>
          <button 
            onClick={triggerNudgeGeneration}
            disabled={loadingNudge}
            className="flex items-center space-x-1.5 text-xs text-white bg-gold hover:bg-gold-dark px-3.5 py-1.5 rounded-md font-bold transition-all shadow-sm cursor-pointer border-none"
          >
            {loadingNudge ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI to Analyze Spend</span>
              </>
            )}
          </button>
        </div>
        <div className="p-5">
          {loadingData ? (
            <div className="text-center py-6 text-slate-400 text-xs font-semibold animate-pulse">Scanning ledger...</div>
          ) : nudges.length > 0 ? (
            <div className="space-y-4">
              {nudges.slice(0, 1).map((nudge) => (
                <div key={nudge.id} className="flex items-start space-x-3 bg-slate-50 p-4 rounded-lg border border-navy-light">
                  <div className="w-2.5 h-2.5 rounded-full bg-copper mt-1.5 shrink-0 animate-ping"></div>
                  <div>
                    <p className="text-slate-950 text-sm md:text-base leading-relaxed font-bold">
                      {nudge.message}
                    </p>
                    <span className="text-[9px] text-copper mt-2 block font-extrabold uppercase tracking-wider">
                      Generated just now by SAATHI Agent
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs font-semibold">
              No pending alerts. Tap "Ask AI to Analyze Spend" to search.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div>
        <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">Quick Navigation Tools</h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="flex flex-col items-center justify-center p-5 glass-card border border-navy-light hover:border-gold/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
          >
            <MessageSquare className="w-6 h-6 text-gold group-hover:scale-105 transition-transform duration-200" />
            <span className="text-xs font-bold mt-2 text-slate-600 group-hover:text-gold transition-colors">Chat Room</span>
          </button>

          <button
            onClick={() => navigate('/recommendations')}
            className="flex flex-col items-center justify-center p-5 glass-card border border-navy-light hover:border-gold/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
          >
            <Award className="w-6 h-6 text-gold group-hover:scale-105 transition-transform duration-200" />
            <span className="text-xs font-bold mt-2 text-slate-600 group-hover:text-gold transition-colors">SBI Offers</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center justify-center p-5 glass-card border border-navy-light hover:border-gold/30 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
          >
            <User className="w-6 h-6 text-gold group-hover:scale-105 transition-transform duration-200" />
            <span className="text-xs font-bold mt-2 text-slate-600 group-hover:text-gold transition-colors">My Health</span>
          </button>
        </div>
      </div>

      {/* Product Offers / Recommendations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-gold" />
            <span>SBI Product Recommendations</span>
          </h2>
          <button 
            onClick={triggerRecsGeneration}
            disabled={loadingRecs}
            className="flex items-center space-x-1 text-xs text-gold hover:text-gold-dark bg-slate-100 hover:bg-slate-200 border border-navy-light px-3 py-1.5 rounded-md font-bold transition-all"
          >
            {loadingRecs ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-3 h-3" />
                <span>Re-Analyze Profile</span>
              </>
            )}
          </button>
        </div>

        {loadingData ? (
          <div className="text-center py-12 text-slate-400 text-xs font-semibold animate-pulse">Reading profile...</div>
        ) : recs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recs.slice(0, 3).map((rec) => (
              <div 
                key={rec.id} 
                className="glass-card border border-navy-light hover:border-gold/30 p-5 rounded-xl shadow-sm flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-slate-900 text-base">
                      {rec.product_type}
                    </span>
                    <span className="text-[9px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded font-bold shadow-sm">
                      {(rec.score * 100).toFixed(0)}% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {rec.reason}
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/recommendations')}
                  className="w-full mt-4 bg-slate-50 hover:bg-gold hover:text-white text-gold text-xs font-bold py-2 rounded-md transition-all border border-gold/20 hover:border-transparent cursor-pointer"
                >
                  Learn More
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card border border-navy-light rounded-xl p-8 text-center text-slate-400">
            No recommendation history found. Tap "Re-Analyze Profile" to evaluate SBI products.
          </div>
        )}
      </div>
    </div>
  );
};
