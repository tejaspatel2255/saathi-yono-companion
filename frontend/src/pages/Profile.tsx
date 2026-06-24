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
      <h1 className="text-2xl font-extrabold text-white flex items-center space-x-2">
        <User className="w-7 h-7 text-gold" />
        <span>My YONO Health Profile</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Circular Health Score Meter */}
        <div className="bg-navy border border-navy-light/60 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-md">
          <span className="text-[10px] text-gold uppercase tracking-wider font-extrabold mb-3">
            Financial Health Score
          </span>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-navy-light/50"
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
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{healthScore}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">/ 100</span>
            </div>
          </div>

          <div className="mt-4">
            <span className="bg-green-500/10 text-green-400 text-xs px-3 py-1 rounded-full font-bold">
              Stable & Growing
            </span>
            <p className="text-xs text-gray-300 mt-3 leading-relaxed">
              Your saving index is higher than 82% of users in your bracket. Great job starting your monthly SIPs!
            </p>
          </div>
        </div>

        {/* Card 2: User Settings & Preference */}
        <div className="bg-navy border border-navy-light/60 p-6 rounded-2xl md:col-span-2 flex flex-col justify-between shadow-md">
          <div className="space-y-4">
            <h3 className="font-extrabold text-white text-base border-b border-navy-light/40 pb-2">
              Demographics & Preferences
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">
                  Full Name
                </span>
                <span className="text-sm font-semibold text-white">Amit Kumar</span>
              </div>
              
              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">
                  Registered Mobile
                </span>
                <span className="text-sm font-semibold text-white">+91 98765 43210</span>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">
                  Primary Branch
                </span>
                <span className="text-sm font-semibold text-white">SBI Local Head Office, New Delhi</span>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">
                  YONO Security Level
                </span>
                <span className="text-sm font-semibold text-green-400 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5"></span>
                  High (Secured by MPIN)
                </span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-2">
                Preferred Companion Language
              </span>
              <div className="flex space-x-2">
                {['en', 'hi', 'ta', 'bn'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLangPref(lang)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold capitalize transition-all ${
                      langPref === lang
                        ? 'bg-gold border-transparent text-navy'
                        : 'bg-navy-light/40 border-navy-light hover:border-gold/30 text-gray-300'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : lang === 'ta' ? 'Tamil' : 'Bengali'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-navy-light/40 flex justify-between items-center text-xs text-gray-400">
            <span>Last Sync: 10 mins ago</span>
            <button className="text-gold font-bold hover:underline">Edit Credentials</button>
          </div>
        </div>
      </div>

      {/* Mock Transaction Ledger */}
      <div className="bg-navy border border-navy-light/60 rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 bg-navy-light/20 border-b border-navy-light/60 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-white flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gold" />
            <span>Recent SBI Transaction Log</span>
          </h3>
          <span className="text-[10px] bg-navy-light text-gray-300 px-2 py-0.5 rounded-full font-bold">
            Live Feed
          </span>
        </div>
        <div className="divide-y divide-navy-light/40">
          {mockTransactions.map((tx, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-navy-light/10 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  {tx.amount > 0 ? (
                    <ArrowDownLeft className="w-4 h-4 text-green-400" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{tx.desc}</p>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-[9px] text-gray-400 font-semibold">{tx.date}</span>
                    <span className="text-[8px] bg-navy-light text-gold px-1.5 py-0.2 rounded font-semibold uppercase">
                      {tx.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-extrabold ${
                  tx.amount > 0 ? 'text-green-400' : 'text-white'
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
