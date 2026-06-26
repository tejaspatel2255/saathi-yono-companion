import React, { useState } from 'react';
import saathiLogo from '../assets/saathi_logo.png';
import { registerUser, loginUser } from '../api';
import { Shield, User, Phone, DollarSign, ArrowRight, Play } from 'lucide-react';
import { LANGUAGES } from '../utils/i18n';

export const Onboarding: React.FC = () => {
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    language_preference: 'en',
    age: 25,
    income: 50000,
    savings: 100000,
    existing_products: [] as string[],
  });

  const [loginPhone, setLoginPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const productsList = [
    'Savings Account',
    'Fixed Deposit (FD)',
    'Credit Card',
    'Mutual Funds',
    'Personal Loan',
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'income' || name === 'savings' ? Number(value) : value,
    }));
  };

  const handleProductToggle = (product: string) => {
    setFormData((prev) => {
      const alreadySelected = prev.existing_products.includes(product);
      return {
        ...prev,
        existing_products: alreadySelected
          ? prev.existing_products.filter((p) => p !== product)
          : [...prev.existing_products, product],
      };
    });
  };

  const saveUserContext = (user: any) => {
    localStorage.setItem('saathi_user_id', user.id);
    const selectedLangObj = LANGUAGES.find(l => l.code === user.language_preference);
    const langName = selectedLangObj ? selectedLangObj.name : 'English';
    
    // Map income to a range label
    let incomeRangeLabel = '₹50K-1L';
    if (user.financial_profile?.income < 25000) {
      incomeRangeLabel = 'Below ₹25K';
    } else if (user.financial_profile?.income < 50000) {
      incomeRangeLabel = '₹25K-50K';
    } else if (user.financial_profile?.income > 100000) {
      incomeRangeLabel = 'Above ₹1L';
    }

    localStorage.setItem('saathi_user', JSON.stringify({
      name: user.name,
      language: langName,
      income_range: incomeRangeLabel,
      user_id: user.id
    }));
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await registerUser(formData);
      if (response && response.id) {
        saveUserContext(response);
        window.location.reload(); // Reload to trigger App routing
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Connection to backend failed. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim()) {
      setError('Please enter your registered mobile number.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await loginUser(loginPhone);
      if (response && response.id) {
        saveUserContext(response);
        window.location.reload(); // Reload to trigger App routing
      } else {
        setError('Login lookup failed.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'No account found with this number. Please sign up.');
    } finally {
      setLoading(false);
    }
  };

  const handleTryDemo = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await loginUser('+91 98765 43210');
      if (response && response.id) {
        saveUserContext(response);
        window.location.reload(); // Reload to trigger App routing
      } else {
        setError('Demo login failed.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Demo connection failed. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-gold selection:text-white font-sans">
      <div className="max-w-lg w-full bg-white border border-navy-light shadow-md rounded-2xl overflow-hidden p-6 md:p-8 relative">
        
        {/* Try Demo Button on top right */}
        <button
          onClick={handleTryDemo}
          disabled={loading}
          className="absolute top-4 right-4 flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-gold border border-gold hover:bg-gold hover:text-white rounded-md transition-all cursor-pointer shadow-sm bg-transparent disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Try Demo</span>
        </button>

        {/* Banner header */}
        <div className="text-center mb-6 mt-4">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-white border border-navy-light rounded-lg mb-4">
            <img src={saathiLogo} alt="SAATHI Logo" className="w-10 h-10 object-contain rounded" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome to SAATHI
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-extrabold mt-1">
            SBI YONO AGENTIC AI COMPANION
          </p>
          <div className="h-0.5 w-12 bg-copper mx-auto mt-4 rounded"></div>
        </div>

        {/* Signup / Login Toggle Tabs */}
        <div className="grid grid-cols-2 gap-2 mb-6 border-b border-navy-light pb-4">
          <button
            type="button"
            onClick={() => { setAuthMode('signup'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-md border transition-all cursor-pointer ${
              authMode === 'signup'
                ? 'border-gold bg-gold/5 text-gold'
                : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Create YONO Account
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('login'); setError(''); }}
            className={`py-2 text-xs font-bold rounded-md border transition-all cursor-pointer ${
              authMode === 'login'
                ? 'border-gold bg-gold/5 text-gold'
                : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Link Existing Account
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-650 text-xs font-semibold p-3 border border-red-200 rounded-md mb-6 leading-relaxed">
            {error}
          </div>
        )}

        {authMode === 'signup' ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            
            {/* Profile fields */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-navy-light rounded-md focus:outline-none focus:border-gold transition-colors text-slate-900"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-navy-light rounded-md focus:outline-none focus:border-gold transition-colors text-slate-900"
                    placeholder="e.g. +91 99999 88888"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  min="18"
                  max="120"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 text-xs border border-navy-light rounded-md focus:outline-none focus:border-gold transition-colors text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                  Monthly Income (₹)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    name="income"
                    min="0"
                    value={formData.income}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-navy-light rounded-md focus:outline-none focus:border-gold transition-colors text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                  Current Savings (₹)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    name="savings"
                    min="0"
                    value={formData.savings}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-navy-light rounded-md focus:outline-none focus:border-gold transition-colors text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Language Preference */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                Preferred YONO Companion Language
              </label>
              <select
                name="language_preference"
                value={formData.language_preference}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-xs border border-navy-light rounded-md bg-white focus:outline-none focus:border-gold transition-colors text-slate-900"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Existing Financial Products */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2">
                Existing Accounts & Linked Products
              </label>
              <div className="flex flex-wrap gap-2">
                {productsList.map((product) => {
                  const selected = formData.existing_products.includes(product);
                  return (
                    <button
                      key={product}
                      type="button"
                      onClick={() => handleProductToggle(product)}
                      className={`text-xs px-3 py-1.5 rounded border transition-all cursor-pointer ${
                        selected
                          ? 'border-gold bg-gold/5 text-gold font-bold shadow-sm'
                          : 'border-navy-light bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {product}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-navy-light">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 text-white bg-gold hover:bg-gold-dark py-3 rounded-md font-bold transition-all shadow cursor-pointer border-none"
              >
                <span>{loading ? 'Setting up profile...' : 'Complete & Generate AI Companion'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                Registered Mobile Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-navy-light rounded-md focus:outline-none focus:border-gold transition-colors text-slate-900"
                  placeholder="e.g. +91 98765 43210"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Tip: You can use the standard demo phone <span className="font-mono font-bold text-slate-655">+91 98765 43210</span> to test with Amit's historical data.
              </p>
            </div>

            <div className="pt-4 border-t border-navy-light">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 text-white bg-gold hover:bg-gold-dark py-3 rounded-md font-bold transition-all shadow cursor-pointer border-none"
              >
                <span>{loading ? 'Linking Account...' : 'Link Companion Account'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-400 text-center mt-5">
          <Shield className="w-3.5 h-3.5" />
          <span>Encrypted with SBI secure companion protocols.</span>
        </div>

      </div>
    </div>
  );
};
