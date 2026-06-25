import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Award, User } from 'lucide-react';
import { fetchUserProfile, type UserProfile } from '../api';
import saathiLogo from '../assets/saathi_logo.png';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userId = localStorage.getItem('saathi_user_id') || '';

  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId)
        .then(setProfile)
        .catch((err) => console.error('Error fetching layout profile:', err));
    }
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('saathi_user_id');
    localStorage.removeItem('saathi_user');
    window.location.href = '/onboarding';
  };

  const getInitials = (name: string) => {
    if (!name) return 'SA';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'SAATHI Chat', path: '/chat', icon: MessageSquare },
    { name: 'Offers', path: '/recommendations', icon: Award },
    { name: 'Health Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col font-sans selection:bg-gold selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/95 border-b border-navy-light backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* SAATHI Logo Image */}
            <img src={saathiLogo} alt="SAATHI Logo" className="w-8 h-8 object-contain rounded" />
            <div>
              <span className="font-black text-xl tracking-wider text-gradient-gold">
                SAATHI
              </span>
              <span className="text-[9px] block text-copper font-bold tracking-widest uppercase -mt-0.5">
                SBI YONO COMPANION
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-900">
                {profile ? profile.name : 'SAATHI User'}
              </span>
              <span className="text-[9px] text-slate-500 font-mono tracking-tight max-w-[200px] truncate">
                {userId}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full border-2 border-gold bg-slate-50 flex items-center justify-center font-bold text-gold shadow-sm hover:scale-105 transition-transform duration-200 cursor-pointer focus:outline-none"
              >
                {profile ? getInitials(profile.name) : 'SU'}
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white border border-navy-light divide-y divide-gray-150 z-50 animate-fade-in">
                  <div className="px-4 py-3">
                    <p className="text-[9px] text-copper font-extrabold uppercase tracking-wider">Companion Account</p>
                    <p className="text-xs font-bold text-slate-900 truncate mt-1">{profile ? profile.name : 'SAATHI User'}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{profile ? profile.phone : ''}</p>
                    <p className="text-[8px] text-slate-400 font-mono mt-0.5 truncate">{userId}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-bold transition-colors cursor-pointer border-none bg-transparent"
                    >
                      Sign Out & Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-20 md:mb-6 animate-fade-in-up">
        {children}
      </main>

      {/* Mobile & Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-navy-light shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 relative ${
                  isActive 
                    ? 'text-gold' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Icon className="w-5.5 h-5.5" />
                <span className="text-[9px] mt-1 font-bold tracking-wide">
                  {item.name}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1.5 h-1.5 bg-copper rounded-full"></span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
