import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Award, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'SAATHI Chat', path: '/chat', icon: MessageSquare },
    { name: 'Offers', path: '/recommendations', icon: Award },
    { name: 'Health Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-navy-dark text-white flex flex-col font-sans selection:bg-gold selection:text-navy">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-navy border-b border-navy-light/40 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Gold Accent Logo Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gold-dark to-gold flex items-center justify-center shadow-md">
              <span className="text-navy font-bold text-lg">S</span>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-wider bg-clip-text text-gradient bg-gradient-to-r from-white to-gray-300">
                SAATHI
              </span>
              <span className="text-[10px] block text-gold tracking-widest font-semibold uppercase -mt-1">
                SBI YONO COMPANION
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-white">Amit Kumar</span>
              <span className="text-xs text-gold">00000000-0000-0000-0000-000000000001</span>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-gold/70 bg-navy-light flex items-center justify-center font-bold text-gold shadow-inner">
              AK
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 mb-20 md:mb-6">
        {children}
      </main>

      {/* Mobile & Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy border-t border-navy-light/40 shadow-[0_-8px_20px_rgba(0,0,0,0.4)] backdrop-blur-lg">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 ${
                  isActive 
                    ? 'text-gold scale-110' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-[10px] mt-1 font-medium tracking-tight">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
