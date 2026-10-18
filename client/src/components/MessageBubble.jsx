import React from 'react';
import { ShieldAlert, AlertCircle, Info, Scale, Clock, Sparkles } from 'lucide-react';
import { SafeText } from '../utils/safeText.jsx';
import { SourceList } from './SourceList.jsx';
import { ReferralCard } from './ReferralCard.jsx';

export function MessageBubble({ message, t, onSelectFollowUp }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-xl rounded-2xl rounded-tr-sm bg-slate-900 text-white px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          <span className="block text-[10px] text-slate-400 text-right mt-1.5">{message.timestamp}</span>
        </div>
      </div>
    );
  }

  // Assistant Response Bubble
  const {
    content,
    steps,
    sources,
    evidenceLevel,
    needsClarification,
    followUpQuestions,
    limitations,
    outdatedWarning,
    referral,
    emergency,
    mode,
    safetyNotice,
    timestamp
  } = message;

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-3xl w-full rounded-2xl rounded-tl-sm bg-white border border-slate-200/90 shadow-sm p-5 sm:p-6 text-slate-900">
        {/* Header / Mode Badges */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center text-sky-400">
              <Scale className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs text-slate-900">NyayaSetu_AI</span>
          </div>

          <div className="flex items-center gap-2">
            {emergency && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                <ShieldAlert className="w-3 h-3 text-rose-600" />
                {t.chat.emergencyBadge}
              </span>
            )}
            {mode === 'fallback' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-900">
                <Info className="w-3 h-3 text-amber-700" />
                {t.chat.demoBadge}
              </span>
            )}
            {mode === 'no-evidence' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                <AlertCircle className="w-3 h-3 text-slate-500" />
                {t.chat.noEvidenceBadge}
              </span>
            )}
            {needsClarification && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-sky-100 text-sky-800">
                <Info className="w-3 h-3 text-sky-600" />
                {t.chat.clarificationBadge}
              </span>
            )}
            <span className="text-[10px] text-slate-400">{timestamp}</span>
          </div>
        </div>

        {/* Outdated / Legal Transition Warning */}
        {outdatedWarning && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">
              <span className="font-bold">{t.chat.outdatedTitle}: </span>
              {outdatedWarning}
            </div>
          </div>
        )}

        {/* Partial Evidence Notice */}
        {evidenceLevel === 'partial' && (
          <div className="mb-4 p-2.5 rounded-lg bg-sky-50 border border-sky-200/80 text-sky-900 text-xs flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{t.chat.partialEvidenceWarning}</span>
          </div>
        )}

        {/* Main Answer Text */}
        <div className="text-sm sm:text-base leading-relaxed text-slate-800">
          <SafeText text={content} />
        </div>

        {/* Numbered Steps with Citation Chips */}
        {steps && steps.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {t.chat.stepsTitle}
            </h4>
            <div className="space-y-2.5">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                      {step.text}
                    </p>
                    {step.sourceIds && step.sourceIds.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        {step.sourceIds.map(sid => {
                          const srcIndex = sources?.findIndex(s => s.id === sid);
                          const chipLabel = srcIndex !== -1 && srcIndex !== undefined ? `[${srcIndex + 1}]` : `[${sid}]`;
                          return (
                            <a
                              key={sid}
                              href={`#source-card-${sid}`}
                              className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors"
                              title={`Jump to source ${sid}`}
                            >
                              {chipLabel}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Limitations Callout */}
        {limitations && (
          <div className="mt-4 p-3 rounded-xl bg-slate-100/70 text-slate-600 text-xs leading-relaxed">
            <span className="font-semibold text-slate-700">{t.chat.limitationsTitle}: </span>
            {limitations}
          </div>
        )}

        {/* Legal Aid Referral */}
        {referral && <ReferralCard referral={referral} t={t} />}

        {/* Sources List */}
        {sources && sources.length > 0 && <SourceList sources={sources} t={t} />}

        {/* Follow-up Questions Chips */}
        {followUpQuestions && followUpQuestions.length > 0 && onSelectFollowUp && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-600" />
              Follow-up:
            </span>
            {followUpQuestions.map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectFollowUp(q)}
                className="text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 px-2.5 py-1 rounded-full font-medium transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Safety Disclaimer Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 italic">
          {safetyNotice || t.chat.disclaimer}
        </div>
      </div>
    </div>
  );
}
