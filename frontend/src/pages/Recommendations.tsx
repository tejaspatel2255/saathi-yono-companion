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
          <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
            <Award className="w-7 h-7 text-gold" />
            <span>Matched SBI Financial Products</span>
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            SAATHI analyzes your monthly cashflows and goals to match you with top-yielding SBI packages.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center justify-center space-x-2 bg-gold hover:bg-gold-dark text-navy font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shrink-0"
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
        <div className="text-center py-20 text-gray-400">Evaluating product portfolio...</div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="bg-navy border border-navy-light/60 p-6 rounded-2xl flex flex-col justify-between hover:border-gold/30 hover:translate-y-[-2px] transition-all duration-300 shadow-md relative overflow-hidden"
            >
              {/* Highlight ribbon */}
              <div className="absolute right-0 top-0 bg-gold/10 text-gold text-[10px] font-extrabold uppercase py-1 px-3 rounded-bl-xl border-l border-b border-gold/20">
                {(rec.score * 100).toFixed(0)}% Match
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-navy-light/80 border border-navy-light flex items-center justify-center">
                    {getProductIcon(rec.product_type)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-white">{rec.product_type}</h3>
                    <span className="text-[10px] text-gold tracking-wide uppercase font-bold">State Bank of India</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">
                      AI Assessment Reason
                    </span>
                    <p className="text-xs text-gray-200 leading-relaxed bg-navy-light/20 p-3 rounded-lg border border-navy-light/40">
                      {rec.reason}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setSelectedProduct(rec)}
                  className="flex-1 bg-navy-light hover:bg-gold hover:text-navy text-gold text-xs font-bold py-3 rounded-xl border border-gold/20 hover:border-transparent transition-all"
                >
                  Learn More
                </button>
                <a
                  href="https://www.yono.sbi/"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 bg-navy-dark hover:bg-navy border border-navy-light/60 flex items-center justify-center rounded-xl text-gray-300 hover:text-white transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-navy border border-navy-light/60 rounded-2xl p-12 text-center text-gray-400">
          <HelpCircle className="w-12 h-12 text-gold mx-auto mb-3 opacity-60" />
          <p className="font-bold text-white text-base">No active offers available</p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
            We require more details to formulate product matches. Tap "Re-evaluate Offers" to generate suggestions.
          </p>
        </div>
      )}

      {/* Learn More Modal Dialog */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy border-2 border-gold/30 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-scale-up">
            <h3 className="font-extrabold text-xl text-gold mb-3">
              {selectedProduct.product_type}
            </h3>
            
            <div className="space-y-4 my-4">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">
                  Relevance Score
                </span>
                <span className="text-sm font-semibold text-white">
                  Matched at {(selectedProduct.score * 100).toFixed(0)}% accuracy based on risk profile and deposit behavior.
                </span>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">
                  Companion Recommendation Analysis
                </span>
                <p className="text-xs text-gray-300 leading-relaxed bg-navy-light/40 p-4 rounded-xl">
                  {selectedProduct.reason}
                </p>
              </div>

              <div className="bg-gold/10 p-3 rounded-lg border border-gold/20 flex items-center justify-between">
                <span className="text-xs font-bold text-gold">Ready to start?</span>
                <a
                  href="https://www.yono.sbi/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-gold text-navy font-bold px-3 py-1.5 rounded-md hover:bg-gold-dark transition-all"
                >
                  Go to YONO portal
                </a>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="bg-navy-light text-white text-xs font-semibold px-4 py-2.5 rounded-lg border border-navy-light hover:bg-navy transition-all"
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
