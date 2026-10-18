import React from 'react';
import { Building2, ExternalLink, ShieldCheck } from 'lucide-react';

export function ReferralCard({ referral, t }) {
  if (!referral) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-800 mt-0.5">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">
                {t.referral.badge}
              </span>
              <span className="text-xs text-amber-900 font-semibold">{t.referral.actionText}</span>
            </div>
            <h4 className="font-bold text-sm text-slate-900 mt-1">
              {referral.name}
            </h4>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {referral.reason}
            </p>
          </div>
        </div>

        {referral.url && (
          <a
            href={referral.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-800 text-white hover:bg-amber-900 transition-colors shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <span>{t.referral.visitBtn}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
