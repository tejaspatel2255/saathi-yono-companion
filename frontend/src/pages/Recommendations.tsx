import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Award, ShieldCheck, HelpCircle, ExternalLink, Sparkles, RefreshCw } from 'lucide-react';

interface Recommendation {
  id: string;
  product_type: string;
  reason: string;
  score: number;
}

export const Recommendations: React.FC = () => {
  const userId = '00000000-0000-0000-0000-000000000001';
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Recommendation | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/recommendations/${userId}`);
      setRecommendations(res.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await api.post(`/recommendations/generate/${userId}`);
      if (res.data && res.data.recommendations) {
        setRecommendations(res.data.recommendations);
      }
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Helper to resolve suitable visual icons per product type
  const getProductIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('deposit') || lower.includes('fd') || lower.includes('saving')) {
      return <Award className="w-6 h-6 text-gold" />;
    }
    return <ShieldCheck className="w-6 h-6 text-gold" />;
  };

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center space-x-2">
            <Award className="w-6 h-6 text-gold animate-float" />
            <span>Matched SBI Financial Products</span>
          </h1>
          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
            SAATHI analyzes your monthly cashflows and goals to match you with top-yielding SBI packages.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center justify-center space-x-2 bg-gold hover:bg-gold-dark text-white font-bold text-xs px-4 py-2.5 rounded-md transition-all shadow-sm shrink-0 cursor-pointer border-none"
        >
          {generating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Re-evaluate Offers</span>
            </>
          )}
        </button>
      </div>

      {/* Recommendations listing */}
      {loading ? (
        <div className="text-center py-20 text-slate-500 text-xs font-bold animate-pulse">Evaluating product portfolio...</div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="glass-card border border-navy-light p-6 rounded-xl flex flex-col justify-between hover:border-gold/30 hover:-translate-y-0.5 transition-all duration-200 shadow-sm relative overflow-hidden group"
            >
              {/* Highlight ribbon */}
              <div className="absolute right-0 top-0 bg-gold/10 text-gold text-[9px] font-black uppercase py-1.5 px-3.5 rounded-bl-md border-l border-b border-gold/20 shadow-sm">
                {(rec.score * 100).toFixed(0)}% Match
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded bg-slate-100 border border-navy-light flex items-center justify-center">
                    {getProductIcon(rec.product_type)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{rec.product_type}</h3>
                    <span className="text-[9px] text-copper tracking-wide uppercase font-bold">State Bank of India</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                      AI Assessment Reason
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded border border-navy-light">
                      {rec.reason}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setSelectedProduct(rec)}
                  className="flex-1 bg-slate-50 hover:bg-gold hover:text-white text-gold text-xs font-bold py-3 rounded-md border border-gold/20 hover:border-transparent transition-all cursor-pointer"
                >
                  Learn More
                </button>
                <a
                  href="https://www.yono.sbi/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 bg-slate-100 hover:bg-slate-200 border border-navy-light hover:border-gold/30 flex items-center justify-center rounded-md text-slate-600 hover:text-slate-900 transition-all shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card border border-navy-light rounded-xl p-12 text-center text-slate-500">
          <HelpCircle className="w-12 h-12 text-gold mx-auto mb-3 opacity-60 animate-float" />
          <p className="font-bold text-slate-900 text-base">No active offers available</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            We require more details to formulate product matches. Tap "Re-evaluate Offers" to generate suggestions.
          </p>
        </div>
      )}

      {/* Learn More Modal Dialog */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gold rounded-xl w-full max-w-md p-6 relative shadow-xl animate-fade-in-up">
            <h3 className="font-black text-xl text-gold mb-3">
              {selectedProduct.product_type}
            </h3>
            
            <div className="space-y-4 my-4">
              <div>
                <span className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                  Relevance Score
                </span>
                <span className="text-xs font-semibold text-slate-650 mt-1 leading-relaxed block">
                  Matched at {(selectedProduct.score * 100).toFixed(0)}% accuracy based on risk profile and deposit behavior.
                </span>
              </div>

              <div>
                <span className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                  Companion Recommendation Analysis
                </span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded border border-navy-light">
                  {selectedProduct.reason}
                </p>
              </div>

              <div className="bg-gold/5 p-3 rounded border border-gold/20 flex items-center justify-between shadow-sm">
                <span className="text-xs font-bold text-gold">Ready to start?</span>
                <a
                  href="https://www.yono.sbi/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-gold hover:bg-gold-dark text-white font-bold px-3 py-1.5 rounded transition-all"
                >
                  Go to YONO portal
                </a>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="bg-slate-100 text-slate-800 text-xs font-bold px-4 py-2.5 rounded border border-navy-light hover:bg-slate-200 transition-all cursor-pointer"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
