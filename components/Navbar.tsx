
import React from 'react';
import { AppMode, User } from '../types';

interface NavbarProps {
  onNavigate: (mode: AppMode) => void;
  currentMode: AppMode;
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentMode, user, onLogout }) => {
  const isPremium = user?.isPremium;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/5 bg-[#0f172a]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div onClick={() => onNavigate(AppMode.HOME)} className="cursor-pointer group select-none flex items-center gap-3 shrink-0">
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-white leading-none font-sans">
              DGSN<span className="text-red-600">.</span>
            </h1>
          </div>
        </div>
        
        <div className="flex gap-2 md:gap-4 items-center">
           {/* Navigation Buttons - Visible on Mobile now */}
           <div className="flex bg-slate-900/50 p-1 rounded-full backdrop-blur-md border border-white/10 overflow-hidden">
              <button 
                onClick={() => onNavigate(AppMode.STUDY)} 
                className={`px-3 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-300 ${currentMode === AppMode.STUDY ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                المراجعة
              </button>
              <button 
                onClick={() => onNavigate(AppMode.QUIZ)} 
                className={`px-3 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-bold transition-all duration-300 ${currentMode === AppMode.QUIZ ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-slate-400 hover:text-white'}`}
              >
                اختبار
              </button>
           </div>

           {user && (
             <div className="flex items-center gap-2 md:gap-3 pl-3 md:border-l border-white/10">
                <div className="hidden md:block text-right">
                    <p className="text-xs font-bold text-white">{user.name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-wider ${isPremium ? 'text-amber-400' : 'text-slate-500'}`}>{isPremium ? 'PREMIUM' : 'FREE'}</p>
                </div>
                <button onClick={onLogout} className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-500 transition-all border border-white/5" title="تسجيل الخروج">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
             </div>
           )}
        </div>
      </div>
    </nav>
  );
};
