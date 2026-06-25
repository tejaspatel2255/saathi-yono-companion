import React, { useState, useEffect } from 'react';
import { User, FileText, ArrowUpRight, ArrowDownLeft, RefreshCw, LogOut, Plus, Trash2 } from 'lucide-react';
import { fetchUserProfile, fetchTransactions, createTransaction, updateUserProfile, clearTransactions, type UserProfile } from '../api';

export const Profile: React.FC = () => {
  const userId = localStorage.getItem('saathi_user_id') || '';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Transaction Form State
  const [txForm, setTxForm] = useState({
    amount: '',
    category: 'Dining',
    merchant: '',
    type: 'debit',
  });

  const categories = ['Dining', 'Shopping', 'Investment', 'Salary', 'Utilities', 'Transport'];

  const loadData = async () => {
    if (!userId) return;
    setSyncing(true);
    setError(null);
    try {
      const uProfile = await fetchUserProfile(userId);
      setProfile(uProfile);
      const uTxList = await fetchTransactions(userId);
      setTransactions(uTxList);
    } catch (err) {
      console.error('Error loading Profile sandbox data:', err);
      setError('SAATHI is thinking... please try again 🙏');
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.merchant.trim()) return;

    const amt = parseFloat(txForm.amount);
    const signedAmount = txForm.type === 'debit' ? -Math.abs(amt) : Math.abs(amt);

    try {
      await createTransaction(userId, {
        amount: signedAmount,
        category: txForm.category,
        merchant: txForm.merchant,
      });
      // Refresh ledger
      const uTxList = await fetchTransactions(userId);
      setTransactions(uTxList);
      // Reset form
      setTxForm({ amount: '', category: 'Dining', merchant: '', type: 'debit' });
    } catch (err) {
      console.error('Failed to create simulation transaction:', err);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    if (!profile) return;
    try {
      const updated = await updateUserProfile(userId, {
        name: profile.name,
        phone: profile.phone,
        language_preference: lang,
        age: profile.financial_profile.age,
        income: profile.financial_profile.income,
        savings: profile.financial_profile.savings,
        existing_products: profile.financial_profile.existing_products,
      });
      setProfile(updated);
    } catch (err) {
      console.error('Error updating language preference:', err);
    }
  };

  const handleClearTransactions = async () => {
    if (!window.confirm('Are you sure you want to clear all transaction logs?')) return;
    try {
      await clearTransactions(userId);
      setTransactions([]);
    } catch (err) {
      console.error('Failed to clear transactions:', err);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to log out and reset this companion profile?')) {
      localStorage.removeItem('saathi_user_id');
      window.location.href = '/'; // Will trigger onboarding gate
    }
  };

  if (error) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-6 bg-red-50/50 border border-red-200 rounded-xl">
        <p className="font-bold text-red-800 text-base mb-3">{error}</p>
        <button
          onClick={loadData}
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

  // Calculate dynamic health score
  const income = profile?.financial_profile.income || 50000;
  const savings = profile?.financial_profile.savings || 100000;
  const ratio = savings / Math.max(1, income);
  // score ranges between 45 and 95 based on savings to income ratio
  const healthScore = Math.min(95, Math.max(45, Math.round(ratio * 12 + 50)));

  // SVG parameters for circular health score
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center space-x-2">
          <User className="w-6 h-6 text-gold animate-float" />
          <span>My YONO Health Profile</span>
        </h1>
        <button
          onClick={handleReset}
          className="inline-flex items-center space-x-2 text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md font-bold transition-all border border-red-200 cursor-pointer w-fit"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Reset Companion Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Circular Health Score Meter */}
        <div className="glass-card border border-navy-light p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-[10px] text-copper uppercase tracking-wider font-extrabold mb-3">
            Financial Health Score
          </span>

          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-gold/5 blur-xl pointer-events-none"></div>
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-slate-200"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-gold transition-all duration-1000 ease-out"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="square"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-slate-900">{healthScore}</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">/ 100</span>
            </div>
          </div>

          <div className="mt-4">
            <span className="bg-green-50 text-green-700 border border-green-200 text-xs px-3.5 py-1 rounded-md font-bold">
              {healthScore > 75 ? 'Excellent Balance' : healthScore > 60 ? 'Stable & Growing' : 'Needs Optimization'}
            </span>
            <p className="text-xs text-slate-650 mt-4 leading-relaxed">
              {healthScore > 75 
                ? 'Your savings buffer is exceptionally healthy. Review matched high-return FDs and Mutual Funds to grow it.'
                : 'Your saving index is steady. Start automating small monthly deposits to bump up your score.'}
            </p>
          </div>
        </div>

        {/* Card 2: User Settings & Preference */}
        <div className="glass-card border border-navy-light p-6 rounded-xl lg:col-span-2 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-navy-light pb-2 flex items-center space-x-2">
              <span>Demographics & Preferences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                  Full Name
                </span>
                <span className="text-sm font-bold text-slate-900">{profile?.name}</span>
              </div>

              <div>
                <span className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                  Registered Mobile
                </span>
                <span className="text-sm font-bold text-slate-900">{profile?.phone}</span>
              </div>

              <div>
                <span className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                  Annual simulated income
                </span>
                <span className="text-sm font-bold text-slate-900">
                  ₹{((profile?.financial_profile.income || 0) * 12).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <span className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                  YONO Security Level
                </span>
                <span className="text-sm font-bold text-green-700 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                  High (Secured by MPIN)
                </span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-2">
                Preferred Companion Language
              </span>
              <div className="flex space-x-2">
                {['en', 'hi', 'ta', 'bn'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`text-xs px-3.5 py-2 rounded-md border font-bold capitalize transition-all duration-200 cursor-pointer ${
                      profile?.language_preference === lang
                        ? 'bg-gold border-transparent text-white shadow-sm'
                        : 'bg-slate-50 border-navy-light hover:border-gold/30 text-slate-700'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : lang === 'ta' ? 'Tamil' : 'Bengali'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-navy-light flex justify-between items-center text-[10px] text-slate-400">
            <span className="flex items-center space-x-1">
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Syncing...' : 'Synced with Supabase Sandbox'}</span>
            </span>
            <span>Security MPIN: Configured</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 3: Transaction Simulation sandbox */}
        <div className="glass-card border border-navy-light p-6 rounded-xl shadow-sm bg-white">
          <h3 className="font-extrabold text-slate-900 text-base border-b border-navy-light pb-2 flex items-center space-x-2 mb-4">
            <Plus className="w-4 h-4 text-gold" />
            <span>Simulate New Transaction</span>
          </h3>

          <form onSubmit={handleCreateTx} className="space-y-4">
            <div>
              <label className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxForm(f => ({ ...f, type: 'debit' }))}
                  className={`py-1.5 text-xs font-bold rounded border ${
                    txForm.type === 'debit'
                      ? 'border-red-500 bg-red-50/50 text-red-650'
                      : 'border-navy-light bg-slate-50 text-slate-600'
                  }`}
                >
                  Debit (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => setTxForm(f => ({ ...f, type: 'credit' }))}
                  className={`py-1.5 text-xs font-bold rounded border ${
                    txForm.type === 'credit'
                      ? 'border-green-600 bg-green-50/50 text-green-700'
                      : 'border-navy-light bg-slate-50 text-slate-600'
                  }`}
                >
                  Credit (Income)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                Merchant / Description
              </label>
              <input
                type="text"
                required
                value={txForm.merchant}
                onChange={e => setTxForm(f => ({ ...f, merchant: e.target.value }))}
                className="w-full px-3 py-2 text-xs border border-navy-light rounded-md focus:outline-none focus:border-gold transition-colors text-slate-900"
                placeholder="e.g. Zomato, Rent, Salary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={txForm.amount}
                  onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-navy-light rounded-md focus:outline-none focus:border-gold transition-colors text-slate-900"
                  placeholder="₹ Amount"
                />
              </div>

              <div>
                <label className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                  Category
                </label>
                <select
                  value={txForm.category}
                  onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 text-xs border border-navy-light rounded-md bg-white focus:outline-none focus:border-gold transition-colors text-slate-900"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gold hover:bg-gold-dark text-white font-bold py-2 rounded text-xs transition-colors shadow-sm cursor-pointer border-none"
            >
              Post Simulated Transaction
            </button>
          </form>
        </div>

        {/* Ledger table */}
        <div className="glass-card border border-navy-light rounded-xl overflow-hidden shadow-sm bg-white lg:col-span-2">
          <div className="p-4 bg-slate-50 border-b border-navy-light flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-gold" />
              <span>Simulated SBI Transaction Log</span>
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-[9px] bg-gold/10 text-gold border border-gold/20 px-2.5 py-0.5 rounded font-bold shadow-sm">
                {transactions.length} Records
              </span>
              {transactions.length > 0 && (
                <button
                  onClick={handleClearTransactions}
                  className="flex items-center space-x-1 text-[10px] text-red-650 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-0.5 rounded font-bold transition-all cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear Logs</span>
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-navy-light max-h-[360px] overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No transactions recorded yet.</p>
            ) : (
              transactions.map((tx, idx) => (
                <div key={tx.id || idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors duration-200 odd:bg-slate-50/30">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded flex items-center justify-center border ${
                      tx.amount > 0 
                        ? 'bg-green-50 border-green-200 text-green-600' 
                        : 'bg-red-50 border-red-200 text-red-650'
                    }`}>
                      {tx.amount > 0 ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{tx.merchant}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[9px] text-slate-500 font-semibold">
                          {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString('en-IN') : 'Recent'}
                        </span>
                        <span className="text-[8px] bg-slate-100 text-gold border border-navy-light px-1.5 py-0.2 rounded font-semibold uppercase">
                          {tx.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-black ${
                      tx.amount > 0 ? 'text-green-600' : 'text-slate-950'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
