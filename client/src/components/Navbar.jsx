import React, { useState } from 'react';
import { Menu, X, ShieldAlert, BookOpen, HelpCircle, Lock, MessageSquare } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle.jsx';

export function Navbar({ lang, t, onToggleLang }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '#guidance', label: t.nav.guidance, icon: MessageSquare },
    { href: '#emergency', label: t.nav.emergency, icon: ShieldAlert, alert: true },
    { href: '#sources', label: t.nav.sources, icon: BookOpen },
    { href: '#how-it-works', label: t.nav.howItWorks, icon: HelpCircle },
    { href: '#privacy', label: t.nav.privacy, icon: Lock }
  ];

  return (
    <>
      {/* Skip to Main Content Link for Keyboard Accessibility */}
      <a
        href="#guidance"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-sky-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-hidden"
      >
        Skip to main guidance content
      </a>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo / Branding */}
          <a href="#" className="flex items-center gap-3 group focus:outline-hidden">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-600 shadow-sm group-hover:shadow-md transition-shadow flex-shrink-0">
              <img
                src="/logo.jpg"
                alt="NyayaSetu_AI Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">NyayaSetu_AI</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-sky-100 text-sky-800 rounded">
                  HACK@BVP 8.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none hidden md:block">
                {t.tagline}
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6" aria-label="Main Navigation">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    item.alert 
                      ? 'text-rose-600 hover:text-rose-700' 
                      : 'text-slate-600 hover:text-sky-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            <LanguageToggle currentLang={lang} onToggle={onToggleLang} />

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(prev => !prev)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    item.alert
                      ? 'text-rose-700 bg-rose-50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-500" />
                  {item.label}
                </a>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
}
