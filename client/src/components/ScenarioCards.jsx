import React from 'react';
import { ArrowUpRight, Shield, Scale, FileText, Briefcase, Eye, HelpCircle } from 'lucide-react';

const ICON_MAP = {
  'sc-dv': Shield,
  'sc-fir': FileText,
  'sc-aid': Scale,
  'sc-posh': Briefcase,
  'sc-stalking': Eye,
  'sc-checklist': HelpCircle
};

export function ScenarioCards({ t, onSelectScenario }) {
  return (
    <section id="scenarios" className="py-12 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl tracking-tight">
            {t.scenarios.title}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-600">
            {t.scenarios.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {t.scenarios.cards.map((card) => {
            const Icon = ICON_MAP[card.id] || Scale;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectScenario(card.prompt)}
                className="group relative flex flex-col p-5 bg-slate-50 hover:bg-sky-50/50 rounded-2xl border border-slate-200/90 hover:border-sky-300 text-left transition-all duration-150 hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              >
                <div className="flex items-center justify-between w-full mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-md bg-white border border-slate-200 text-slate-700 group-hover:text-sky-800 group-hover:border-sky-200">
                    <Icon className="w-3.5 h-3.5 text-sky-600" />
                    {card.badge}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-100/70 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-900 group-hover:text-sky-950 transition-colors mb-2">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  "{card.prompt}"
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
