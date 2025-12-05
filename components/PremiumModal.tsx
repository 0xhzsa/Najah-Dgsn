
import React, { useState } from 'react';
import { Button } from './Button';

interface PremiumModalProps {
  onActivate: (code: string) => boolean;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ onActivate, onClose }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  // EDIT THIS RIB BEFORE DEPLOYING
  const RIB = "022 270 0 00435 00 366094 74 68";
  const WHATSAPP_NUMBER = "212691238409"; 

  const handleActivate = () => {
    const success = onActivate(code);
    if (success) {
      onClose();
    } else {
      setError(true);
    }
  };
  
  const handleWhatsappClick = () => {
    const message = encodeURIComponent("سلام عليكم، لقد قمت بدفع واجب الاشتراك في منصة DGSN Prep. المرجو تفعيل حسابي.");
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  const PRICE = "29";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-slate-950 border border-white/5 rounded-[2.5rem] max-w-md w-full shadow-2xl relative overflow-hidden text-right flex flex-col max-h-[90vh]" dir="rtl">
        
        {/* Close Button */}
        <button 
            onClick={onClose} 
            className="absolute top-6 left-6 z-20 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white/50 hover:text-white hover:bg-red-500 transition-all backdrop-blur-md"
            type="button"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="p-8 overflow-y-auto">
          <h2 className="text-3xl font-black text-white text-center mb-8 tracking-tighter">Premium Access</h2>

          {/* Apple Wallet Pass Style Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 to-black p-6 text-white shadow-2xl border border-white/10 mb-8 group transform hover:scale-[1.02] transition-all duration-500">
             {/* Holographic Shine */}
             <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/5 to-transparent rotate-45 group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
             
             <div className="flex justify-between items-start mb-10 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                        <span className="font-bold text-xs">D</span>
                    </div>
                    <span className="font-bold text-sm tracking-wide opacity-90">DGSN Pro</span>
                </div>
                <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] backdrop-blur-md uppercase tracking-wider font-bold border border-white/5">Lifetime Pass</span>
             </div>
             
             <div className="flex justify-between items-end relative z-10">
                <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-1">Total Amount</p>
                    <p className="text-5xl font-black tracking-tighter text-white drop-shadow-lg">{PRICE} <span className="text-xl font-medium opacity-50">DH</span></p>
                </div>
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
             </div>
          </div>

          {/* Minimalist RIB */}
          <div className="mb-8">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3 text-center">رقم الحساب البنكي (للتحويل)</p>
            <div 
                className="bg-black border border-white/10 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer hover:border-white/30 transition-all group relative overflow-hidden"
                onClick={() => {
                    navigator.clipboard.writeText(RIB);
                    alert("تم نسخ RIB");
                }}
            >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="font-mono text-white text-sm md:text-base tracking-[0.15em] font-bold z-10">{RIB}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <button 
                onClick={handleWhatsappClick}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white border border-white/5 font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
            >
                <span className="text-sm">أرسل الوصل عبر واتساب</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
            </button>

            <div className="flex flex-col sm:flex-row gap-3">
                 <input 
                   type="text" 
                   value={code}
                   onChange={(e) => {
                     setCode(e.target.value);
                     setError(false);
                   }}
                   className={`w-full bg-slate-900 border ${error ? 'border-red-500' : 'border-slate-700'} rounded-xl px-4 py-4 text-white text-center font-black placeholder:font-normal placeholder:text-slate-700 transition-colors focus:border-white/30 outline-none uppercase text-xl tracking-widest`}
                   placeholder="CODE"
                 />
                 <button onClick={handleActivate} className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-xl font-black hover:bg-slate-200 transition-colors shadow-lg whitespace-nowrap">
                    تفعيل
                 </button>
            </div>
            {error && <p className="text-red-500 text-[10px] text-center font-bold tracking-wide mt-2">CODE INVALID</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
