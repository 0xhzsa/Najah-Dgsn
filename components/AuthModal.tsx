
import React, { useState } from 'react';
import { Button } from './Button';

interface AuthModalProps {
  onLogin: (name: string, email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      onLogin(name, email);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0f172a]/95 backdrop-blur-xl animate-fade-in">
      <div className="glass-card border border-white/10 rounded-[2rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden text-right" dir="rtl">
        
        <div className="mb-12 text-center">
            <h1 className="text-6xl font-black tracking-tighter text-white leading-none font-sans mb-4">
              DGSN<span className="text-red-600">.</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold tracking-[0.2em] uppercase">Bawabat At-tamayouz Al-amni</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-500 text-[10px] font-black mb-2 uppercase tracking-widest">الاسم الكامل</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-white/20 outline-none transition-all placeholder:text-slate-700 text-lg font-bold"
              placeholder="الاسم والنسب"
              required
            />
          </div>
          <div>
            <label className="block text-slate-500 text-[10px] font-black mb-2 uppercase tracking-widest">البريد الإلكتروني</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-white/20 outline-none transition-all placeholder:text-slate-700 text-lg font-bold"
              placeholder="name@example.com"
              required
            />
          </div>

          <Button type="submit" className="w-full justify-center text-lg mt-6 bg-red-600 hover:bg-red-500 text-white border-none py-4 font-black tracking-wide rounded-xl shadow-lg shadow-red-900/20">
            دخول للمنصة
          </Button>
        </form>
        
        <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-600 font-mono">
              SECURE DGSN GATEWAY v5.0
            </p>
        </div>
      </div>
    </div>
  );
};
