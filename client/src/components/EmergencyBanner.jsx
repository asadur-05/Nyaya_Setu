import React from 'react';
import { PhoneCall, ExternalLink, AlertTriangle } from 'lucide-react';

export function EmergencyBanner({ t }) {
  return (
    <aside id="emergency" aria-label="Emergency Services Notice" className="bg-gradient-to-r from-rose-900 via-rose-800 to-red-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-700/80 border border-rose-500/50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              {t.emergencyBanner.alertTitle}
            </h2>
            <p className="text-xs sm:text-sm text-rose-100">
              {t.emergencyBanner.alertText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <a
            href="tel:112"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold bg-white text-rose-900 hover:bg-rose-50 rounded-lg shadow-sm transition-transform active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-amber-300"
            id="emergency-call-112-btn"
          >
            <PhoneCall className="w-4 h-4 text-rose-600 animate-pulse" />
            {t.emergencyBanner.callBtn}
          </a>
          <a
            href="https://112.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-rose-100 hover:text-white border border-rose-400/40 hover:border-rose-200 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-white"
            id="emergency-portal-112-btn"
          >
            <span>{t.emergencyBanner.portalLink}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </aside>
  );
}
