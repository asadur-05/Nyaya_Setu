import React, { useState } from 'react';
import { translations } from '../utils/i18n.js';
import { useChat } from '../hooks/useChat.js';
import { Navbar } from '../components/Navbar.jsx';
import { EmergencyBanner } from '../components/EmergencyBanner.jsx';
import { Hero } from '../components/Hero.jsx';
import { ScenarioCards } from '../components/ScenarioCards.jsx';
import { ChatWindow } from '../components/ChatWindow.jsx';
import { KnowledgeBaseInfo } from '../components/KnowledgeBaseInfo.jsx';
import { HowItWorks } from '../components/HowItWorks.jsx';
import { PrivacyNotice } from '../components/PrivacyNotice.jsx';
import { Footer } from '../components/Footer.jsx';

export function Home() {
  const [lang, setLang] = useState('en');
  const t = translations[lang] || translations.en;
  const chat = useChat(lang);

  const toggleLanguage = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    document.documentElement.lang = nextLang;
  };

  const handleSelectScenario = (promptText) => {
    const guidanceElem = document.getElementById('guidance');
    if (guidanceElem) {
      guidanceElem.scrollIntoView({ behavior: 'smooth' });
    }
    chat.sendMessage(promptText, lang);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar lang={lang} t={t} onToggleLang={toggleLanguage} />
      <EmergencyBanner t={t} />
      <main className="flex-1">
        <Hero t={t} />
        <ScenarioCards t={t} onSelectScenario={handleSelectScenario} />
        <ChatWindow chat={chat} t={t} lang={lang} />
        <KnowledgeBaseInfo t={t} />
        <HowItWorks t={t} />
        <PrivacyNotice t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}
