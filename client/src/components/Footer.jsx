import React from 'react';
import { Scale, ExternalLink } from 'lucide-react';

export function Footer({ t }) {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                <Scale className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white">NyayaSetu_AI</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              {t.tagline}
            </p>
            <span className="inline-block px-2.5 py-1 text-[11px] font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700">
              {t.hackathon} • Legal-Tech & Social Impact
            </span>
          </div>

          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 mb-3">
              {t.footer.linksTitle}
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.indiacode.nic.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>{t.footer.indiaCode}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://nalsa.gov.in/womens-assistance/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>{t.footer.nalsa}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://112.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>{t.footer.erss}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>{t.footer.copyright}</p>
          <p className="italic">{t.chat.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
