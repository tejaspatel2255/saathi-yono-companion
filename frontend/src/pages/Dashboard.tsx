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
  const userId = '00000000-0000-0000-0000-000000000001';
  
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loadingNudge, setLoadingNudge] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
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
  }, []);

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
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy via-navy-light to-navy border border-navy-light/60 p-6 rounded-2xl relative overflow-hidden shadow-xl">
        <div className="absolute right-4 top-4 opacity-10">
          <Sparkles className="w-32 h-32 text-gold" />
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white">
          Welcome back, <span className="text-gold">Amit</span>!
        </h1>
        <p className="text-gray-300 text-sm mt-1 max-w-xl">
          SAATHI has reviewed your transactions. We have found new opportunities to optimize your savings and interest rates.
        </p>
      </div>

      {/* Proactive Nudge Card */}
      <div className="bg-navy border-2 border-gold/40 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(245,166,35,0.15)]">
        <div className="bg-gradient-to-r from-gold/10 to-transparent p-4 flex items-center justify-between border-b border-gold/25">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-gold animate-bounce" />
            <span className="font-bold text-gold tracking-wide text-sm uppercase">Proactive Money Nudges</span>
          </div>
          <button 
            onClick={triggerNudgeGeneration}
            disabled={loadingNudge}
            className="flex items-center space-x-1 text-xs text-gold hover:text-white bg-gold/20 hover:bg-gold/40 px-3 py-1.5 rounded-lg font-medium transition-all"
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
            <div className="text-center py-6 text-gray-400">Scanning ledger...</div>
          ) : nudges.length > 0 ? (
            <div className="space-y-4">
              {nudges.slice(0, 1).map((nudge) => (
                <div key={nudge.id} className="flex items-start space-x-3 bg-navy-light/40 p-4 rounded-xl border border-navy-light/60">
                  <div className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0 animate-ping"></div>
                  <div>
                    <p className="text-white text-sm md:text-base leading-relaxed font-semibold">
                      {nudge.message}
                    </p>
                    <span className="text-[10px] text-gray-400 mt-2 block">
                      Generated just now by SAATHI Agent
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              No pending alerts. Tap "Ask AI to Analyze Spend" to search.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">Quick Navigation Tools</h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="flex flex-col items-center justify-center p-4 bg-navy hover:bg-navy-light border border-navy-light/50 hover:border-gold/30 rounded-xl transition-all shadow-md group"
          >
            <MessageSquare className="w-6 h-6 text-gold group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold mt-2 text-gray-300 group-hover:text-white">Chat Room</span>
          </button>

          <button
            onClick={() => navigate('/recommendations')}
            className="flex flex-col items-center justify-center p-4 bg-navy hover:bg-navy-light border border-navy-light/50 hover:border-gold/30 rounded-xl transition-all shadow-md group"
          >
            <Award className="w-6 h-6 text-gold group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold mt-2 text-gray-300 group-hover:text-white">SBI Offers</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center justify-center p-4 bg-navy hover:bg-navy-light border border-navy-light/50 hover:border-gold/30 rounded-xl transition-all shadow-md group"
          >
            <User className="w-6 h-6 text-gold group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold mt-2 text-gray-300 group-hover:text-white">My Health</span>
          </button>
        </div>
      </div>

      {/* Product Offers / Recommendations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-gold" />
            <span>SBI Product Recommendations</span>
          </h2>
          <button 
            onClick={triggerRecsGeneration}
            disabled={loadingRecs}
            className="flex items-center space-x-1 text-xs text-gold hover:text-white bg-navy-light hover:bg-navy border border-navy-light/60 hover:border-gold/30 px-3 py-1.5 rounded-lg transition-all"
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
          <div className="text-center py-12 text-gray-400">Reading profile...</div>
        ) : recs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recs.slice(0, 3).map((rec) => (
              <div 
                key={rec.id} 
                className="bg-navy border border-navy-light/60 hover:border-gold/30 p-5 rounded-xl shadow-md flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-white text-base">
                      {rec.product_type}
                    </span>
                    <span className="text-[10px] bg-gold/15 text-gold px-2 py-0.5 rounded-full font-bold">
                      {(rec.score * 100).toFixed(0)}% Match
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed mt-1">
                    {rec.reason}
                  </p>
                </div>
                <button 
                  onClick={() => navigate('/recommendations')}
                  className="w-full mt-4 bg-navy-light hover:bg-gold hover:text-navy text-gold text-xs font-bold py-2 rounded-lg transition-all border border-gold/20 hover:border-transparent"
                >
                  Learn More
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-navy border border-navy-light/60 rounded-xl p-8 text-center text-gray-400">
            No recommendation history found. Tap "Re-Analyze Profile" to evaluate SBI products.
          </div>
        )}
      </div>
    </div>
  );
};
