import React, { useState, useEffect } from 'react';
import { BookOpen, GitCommit, ShieldCheck, ExternalLink, Calendar, Layers } from 'lucide-react';
import { fetchSources } from '../services/api.js';

export function KnowledgeBaseInfo({ t }) {
  const [kbData, setKbData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchSources()
      .then(data => {
        if (mounted && data.ok) {
          setKbData(data);
        }
      })
      .catch(err => {
        console.warn('Could not load sources overview:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  return (
    <section id="sources" className="py-14 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 border border-sky-200 text-sky-800 mb-4">
            <BookOpen className="w-3.5 h-3.5 text-sky-600" />
            <span>{t.sourcesSection.title}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {t.sourcesSection.subtitle}
          </h2>
        </div>

        {/* Stats Row */}
        {kbData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">{t.sourcesSection.versionLabel}</span>
                <p className="font-extrabold text-slate-900 text-base">v{kbData.knowledgeBaseVersion}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">{t.sourcesSection.updatedLabel}</span>
                <p className="font-extrabold text-slate-900 text-base">{kbData.updatedAt}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">{t.sourcesSection.activeRulesLabel}</span>
                <p className="font-extrabold text-slate-900 text-base">{kbData.sources?.length || 0} Provisions</p>
              </div>
            </div>
          </div>
        )}

        {/* Sources Cards Grid */}
        {kbData?.sources && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-12">
            {kbData.sources.map((src) => (
              <div
                key={src.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-slate-200 text-slate-800 rounded">
                      {src.sourceType}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      v{src.version}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug mb-1">
                    {src.title}
                  </h3>
                  <p className="text-xs text-slate-600 mb-3">
                    {src.sourceName}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    {t.sourcesSection.lastVerified}: {src.lastVerified}
                  </span>
                  <a
                    href={src.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                  >
                    <span>{t.sourcesSection.viewOfficial}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Changelog */}
        {kbData?.changelog && kbData.changelog.length > 0 && (
          <div className="max-w-4xl mx-auto mt-8 p-6 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <h3 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-sky-600" />
              {t.sourcesSection.changelogTitle}
            </h3>
            <div className="space-y-3">
              {kbData.changelog.map((entry, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 text-xs pb-3 border-b border-slate-200/60 last:border-0 last:pb-0">
                  <div>
                    <span className="font-bold text-slate-800 mr-2">v{entry.knowledgeBaseVersion}</span>
                    <span className="text-slate-600">{entry.summary}</span>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 shrink-0">
                    <p>{entry.date}</p>
                    <p>{entry.verifiedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
