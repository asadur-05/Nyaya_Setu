import React from 'react';
import { HelpCircle, ShieldCheck, Database, FileCheck2, Cpu, GitBranch } from 'lucide-react';

const STEP_ICONS = [ShieldCheck, Database, Cpu, FileCheck2, GitBranch];

export function HowItWorks({ t }) {
  return (
    <section id="how-it-works" className="py-14 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>Architecture & Trust</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t.howItWorks.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {t.howItWorks.steps.map((st, i) => {
            const Icon = STEP_ICONS[i] || ShieldCheck;
            return (
              <div
                key={st.step}
                className="relative p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold text-sky-600 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                      {st.step}
                    </span>
                    <Icon className="w-5 h-5 text-slate-400" />
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mb-2">
                    {st.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
