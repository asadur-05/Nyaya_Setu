import React from 'react';
import { Languages } from 'lucide-react';

export function LanguageToggle({ currentLang, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border border-slate-300 bg-white/80 backdrop-blur-sm text-slate-700 hover:text-sky-700 hover:border-sky-300 transition-colors shadow-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
      aria-label={`Switch language to ${currentLang === 'en' ? 'Hindi' : 'English'}`}
      title={`Switch language to ${currentLang === 'en' ? 'Hindi' : 'English'}`}
    >
      <Languages className="w-3.5 h-3.5 text-sky-600" />
      <span className={currentLang === 'en' ? 'text-sky-700 font-bold' : 'text-slate-500'}>EN</span>
      <span className="text-slate-300">|</span>
      <span className={currentLang === 'hi' ? 'text-sky-700 font-bold' : 'text-slate-500'}>हिंदी</span>
    </button>
  );
}
