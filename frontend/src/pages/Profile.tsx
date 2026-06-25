import React, { useState } from 'react';
import { User, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Transaction {
  date: string;
  desc: string;
  amount: number;
  category: string;
}

export const Profile: React.FC = () => {
  const [langPref, setLangPref] = useState('en');
  const [healthScore] = useState(78); // Out of 100

  // Mock list of transactions for visual layout
  const mockTransactions: Transaction[] = [
    { date: '2026-06-24', desc: 'Zomato Food Delivery', amount: -1499.00, category: 'Dining' },
    { date: '2026-06-23', desc: 'SBI Direct Debit - Mutual Fund SIP', amount: -5000.00, category: 'Investment' },
    { date: '2026-06-22', desc: 'Interest Credit from SBI Savings', amount: 450.00, category: 'Income' },
    { date: '2026-06-20', desc: 'Amazon India Shopping', amount: -4500.00, category: 'Shopping' },
    { date: '2026-06-18', desc: 'Monthly Salary Credit', amount: 75000.00, category: 'Income' },
  ];

  // SVG parameters for circular health score
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center space-x-2">
        <User className="w-6 h-6 text-gold animate-float" />
        <span>My YONO Health Profile</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Circular Health Score Meter */}
        <div className="glass-card border border-navy-light p-6 rounded-xl flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-[10px] text-copper uppercase tracking-wider font-extrabold mb-3">
            Financial Health Score
          </span>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Ring background glow */}
            <div className="absolute w-24 h-24 rounded-full bg-gold/5 blur-xl pointer-events-none"></div>
            {/* SVG Ring */}
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
              Stable & Growing
            </span>
            <p className="text-xs text-slate-600 mt-4 leading-relaxed">
              Your saving index is higher than 82% of users in your bracket. Great job starting your monthly SIPs!
            </p>
          </div>
        </div>

        {/* Card 2: User Settings & Preference */}
        <div className="glass-card border border-navy-light p-6 rounded-xl md:col-span-2 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base border-b border-navy-light pb-2 flex items-center space-x-2">
              <span>Demographics & Preferences</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                  Full Name
                </span>
                <span className="text-sm font-bold text-slate-900">Amit Kumar</span>
              </div>
              
              <div>
                <span className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                  Registered Mobile
                </span>
                <span className="text-sm font-bold text-slate-900">+91 98765 43210</span>
              </div>

              <div>
                <span className="text-[9px] text-copper uppercase tracking-widest font-extrabold block mb-1">
                  Primary Branch
                </span>
                <span className="text-sm font-bold text-slate-900">SBI Local Head Office, New Delhi</span>
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
                    onClick={() => setLangPref(lang)}
                    className={`text-xs px-3.5 py-2 rounded-md border font-bold capitalize transition-all duration-200 cursor-pointer ${
                      langPref === lang
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
            <span>Last Sync: 10 mins ago</span>
            <button className="text-gold font-bold hover:underline cursor-pointer">Edit Credentials</button>
          </div>
        </div>
      </div>

      {/* Mock Transaction Ledger */}
      <div className="glass-card border border-navy-light rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="p-4 bg-slate-50 border-b border-navy-light flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gold" />
            <span>Recent SBI Transaction Log</span>
          </h3>
          <span className="text-[9px] bg-gold/10 text-gold border border-gold/20 px-2.5 py-0.5 rounded font-bold shadow-sm animate-pulse">
            Live Feed
          </span>
        </div>
        <div className="divide-y divide-navy-light">
          {mockTransactions.map((tx, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors duration-200 odd:bg-slate-50/30">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded flex items-center justify-center border ${
                  tx.amount > 0 
                    ? 'bg-green-50 border-green-200 text-green-600' 
                    : 'bg-red-50 border-red-200 text-red-600'
                }`}>
                  {tx.amount > 0 ? (
                    <ArrowDownLeft className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{tx.desc}</p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[9px] text-slate-500 font-semibold">{tx.date}</span>
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
                  {tx.amount > 0 ? '+' : ''}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
