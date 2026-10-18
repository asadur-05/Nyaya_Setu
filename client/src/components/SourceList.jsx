import React from 'react';
import { ExternalLink, CheckCircle, Calendar, ShieldCheck } from 'lucide-react';

export function SourceList({ sources, t, showTitle = true }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-200/80">
      {showTitle && (
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          {t.chat.sourcesTitle} ({sources.length})
        </h4>
      )}

      <div className="space-y-3">
        {sources.map((source, index) => (
          <div
            key={source.id || index}
            id={`source-card-${source.id}`}
            className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-slate-300 transition-colors text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                  {source.title}
                </h5>
              </div>

              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-800 hover:underline"
                  title="Open official government page in new tab"
                >
                  <span>{t.sourcesSection.viewOfficial}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <p className="text-[11px] font-medium text-slate-500 mt-1">
              {source.sourceName}
            </p>

            {source.excerpt && (
              <blockquote className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border-l-2 border-sky-500 italic leading-relaxed">
                "{source.excerpt}"
              </blockquote>
            )}

            <div className="mt-2.5 flex items-center gap-4 text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {t.sourcesSection.lastVerified}: {source.lastVerified}
              </span>
              <span>
                {t.sourcesSection.version}: v{source.version}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
