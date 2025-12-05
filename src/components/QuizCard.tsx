import React from 'react';
import { Question } from '../types';

interface QuizCardProps {
  question: Question;
  selectedOptionIndex?: number;
  onSelectOption: (index: number) => void;
  showResult: boolean;
}

export const QuizCard: React.FC<QuizCardProps> = ({ 
  question, 
  selectedOptionIndex, 
  onSelectOption, 
  showResult 
}) => {
  const isFrench = question.category === "اللغة الفرنسية";
  const dir = isFrench ? "ltr" : "rtl";
  const align = isFrench ? "text-left" : "text-right";

  return (
    <div className="glass-card rounded-3xl p-6 md:p-10 w-full max-w-4xl mx-auto mb-6 transition-all duration-500 hover:border-white/20">
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
        <span className="bg-red-500/10 text-red-400 text-xs font-bold px-4 py-1.5 rounded-full border border-red-500/20 uppercase tracking-wider shadow-[0_0_10px_rgba(220,38,38,0.1)]">
          {question.category || "عام"}
        </span>
        <span className="text-slate-500 text-xs font-mono tracking-widest opacity-50">ID: {question.id.split('-').slice(0,2).join('-')}</span>
      </div>

      <h3 className={`text-2xl md:text-3xl font-bold text-white mb-10 leading-relaxed tracking-wide ${align}`} dir={dir}>
        {question.text}
      </h3>

      <div className="grid gap-4">
        {question.options.map((option, idx) => {
          let optionClass = `w-full p-5 rounded-2xl border transition-all duration-300 font-semibold text-lg flex items-center justify-between group relative overflow-hidden ${align} `;
          
          if (showResult) {
            if (idx === question.correctAnswerIndex) {
              optionClass += "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
            } else if (idx === selectedOptionIndex) {
              optionClass += "bg-red-500/20 border-red-500/50 text-red-300";
            } else {
              optionClass += "bg-slate-800/30 border-transparent text-slate-500 opacity-50";
            }
          } else {
            if (idx === selectedOptionIndex) {
              optionClass += "bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] scale-[1.01]";
            } else {
              optionClass += "bg-slate-800/50 border-white/5 hover:border-blue-500/50 hover:bg-slate-700/50 text-slate-200";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => !showResult && onSelectOption(idx)}
              className={optionClass}
              disabled={showResult}
              dir={dir}
            >
              <div className={`flex items-center gap-5 z-10 w-full ${isFrench ? 'flex-row-reverse' : 'flex-row'}`}>
                 <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors shrink-0 ${
                    idx === selectedOptionIndex && !showResult 
                    ? 'bg-white text-blue-600' 
                    : 'bg-slate-700/50 text-slate-400 group-hover:bg-blue-500 group-hover:text-white'
                 }`}>
                   {idx + 1}
                 </span>
                 <span className="grow">{option}</span>
              </div>
              {showResult && idx === question.correctAnswerIndex && (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                 </svg>
              )}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-8 p-6 bg-blue-900/20 rounded-2xl border border-blue-500/20 text-slate-200 animate-fade-in text-right" dir="rtl">
          <div className="flex items-center gap-2 mb-3 text-blue-400 font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>شرح مفصل</span>
          </div>
          <p className="leading-relaxed text-slate-300 opacity-90">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};