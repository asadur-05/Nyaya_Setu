import React from 'react';
import { Lock, ShieldCheck, Check } from 'lucide-react';

export function PrivacyNotice({ t }) {
  return (
    <section id="privacy" className="py-12 bg-white border-b border-slate-200/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-700/60">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                {t.privacy.badge}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {t.privacy.title}
              </h2>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-sky-400">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-4">
            {t.privacy.points.map((pt, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {pt}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
