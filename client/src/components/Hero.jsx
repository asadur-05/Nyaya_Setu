import React from 'react';
import { ArrowRight, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function Hero({ t }) {
  const handleStartGuidance = () => {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => chatInput.focus(), 400);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-100/40 border-b border-slate-200/80 pt-10 pb-14 sm:pt-16 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Hackathon Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 border border-sky-200/70 text-sky-800 mb-6 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>{t.hero.badge}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {t.hero.title}
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            {t.hero.subtitle}
          </p>

          {/* Call to Actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleStartGuidance}
              id="hero-start-guidance-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all active:scale-98 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <span>{t.hero.startBtn}</span>
              <ArrowRight className="w-4 h-4 text-sky-400" />
            </button>
            <a
              href="#sources"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold rounded-xl bg-white text-slate-700 border border-slate-300/80 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>{t.hero.sourcesBtn}</span>
            </a>
          </div>

          {/* Verified Features Pills */}
          <div className="mt-10 pt-8 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Official Acts (BNSS, BNS, PWDVA)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Free NALSA Legal Aid (Sec 12)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600 col-span-2 sm:col-span-1">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Hindi & English Grounded Guidance</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
