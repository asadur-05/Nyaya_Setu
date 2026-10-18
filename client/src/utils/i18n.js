export const translations = {
  en: {
    brand: "NyayaSetu_AI",
    tagline: "AI Powered Bilingual Legal Guidance System",
    hackathon: "HACK@BVP 8.0",
    nav: {
      guidance: "Guidance",
      emergency: "Emergency",
      scenarios: "Common Scenarios",
      sources: "Verified Sources",
      howItWorks: "How It Works",
      privacy: "Privacy",
      toggleLang: "हिंदी में बदलें"
    },
    hero: {
      badge: "India Legal Information Portal • HACK@BVP 8.0",
      title: "Bridging Citizens with Reliable Legal Guidance",
      subtitle: "Plain-language, source-grounded information on legal rights, police procedures, domestic protection, and free legal aid across India.",
      startBtn: "Start Getting Guidance",
      sourcesBtn: "Explore Verified Sources",
      disclaimerNote: "Provides general legal information grounded in verified official texts, not legal advice."
    },
    emergencyBanner: {
      alertTitle: "Immediate Danger or Life-Threatening Emergency?",
      alertText: "Dial 112 immediately for unified police, medical, and fire emergency assistance across India.",
      callBtn: "Call 112 Now",
      portalLink: "Visit 112.gov.in",
      disclaimer: "Emergency numbers and procedures are specific to India. NyayaSetu_AI cannot dispatch emergency responders."
    },
    scenarios: {
      title: "Common Legal Situations",
      subtitle: "Click any scenario below to explore official procedures grounded in current Indian law.",
      cards: [
        {
          id: "sc-dv",
          topic: "Domestic Violence",
          title: "Facing Domestic Abuse or Beating at Home",
          prompt: "What protection orders and residence orders can an abused woman seek under the Domestic Violence Act, 2005?",
          badge: "PWDVA 2005"
        },
        {
          id: "sc-fir",
          topic: "Police Procedures",
          title: "Filing an FIR / Zero FIR at Any Police Station",
          prompt: "How can I register an FIR or Zero FIR under Section 173 of BNSS, and do I get a free copy?",
          badge: "BNSS 2023"
        },
        {
          id: "sc-aid",
          topic: "Free Legal Aid",
          title: "Getting a Free Lawyer under NALSA",
          prompt: "Are women entitled to free legal aid and advocate assistance without income proof under NALSA?",
          badge: "NALSA 1987"
        },
        {
          id: "sc-posh",
          topic: "Workplace Harassment",
          title: "Sexual Harassment at Workplace (POSH)",
          prompt: "How do I file a workplace sexual harassment complaint to the Internal Committee under the POSH Act?",
          badge: "POSH Act 2013"
        },
        {
          id: "sc-stalking",
          topic: "Stalking & Harassment",
          title: "Repeated Following or Cyber Stalking",
          prompt: "What is the legal provision against stalking or digital monitoring of women under Section 78 of BNS?",
          badge: "BNS 2023"
        },
        {
          id: "sc-checklist",
          topic: "Document Checklist",
          title: "Documents Needed for Legal Aid or Complaint",
          prompt: "What documents and evidence should I prepare when approaching DLSA for free legal assistance?",
          badge: "Checklist"
        }
      ]
    },
    chat: {
      title: "Interactive Legal Information Assistant",
      subtitle: "Describe your situation in English, Hindi, or mixed Hindi-English. Answers are grounded strictly in verified official sources.",
      emptyPrompt: "Ask a question about legal rights, FIR registration, domestic protection, or legal aid...",
      inputPlaceholder: "Describe your legal situation or question in plain language... (Press Enter to send, Shift+Enter for new line)",
      sendBtn: "Send",
      sendingBtn: "Searching Sources...",
      newChatBtn: "New Conversation",
      disclaimer: "NyayaSetu_AI provides general legal information, not legal advice. No lawyer-client relationship is formed.",
      demoBadge: "Demo / Fallback Mode (Grounded in Verified Sources)",
      emergencyBadge: "Urgent Emergency Assistance",
      noEvidenceBadge: "Out of Scope / Insufficient Evidence",
      clarificationBadge: "Needs Clarification",
      stepsTitle: "Step-by-Step Procedure",
      sourcesTitle: "Verified Official Sources Used",
      partialEvidenceWarning: "Notice: The available sources provide partial coverage for this specific situation.",
      limitationsTitle: "Limitations & Non-Covered Aspects",
      outdatedTitle: "Legal Transition / Staleness Notice",
      charCount: "characters",
      retryBtn: "Retry Query"
    },
    referral: {
      title: "Official Legal Aid Referral",
      badge: "NALSA / DLSA Support",
      actionText: "Approaching Legal Aid Authority",
      visitBtn: "Visit Official Portal"
    },
    sourcesSection: {
      title: "Verified Knowledge Base & Governance",
      subtitle: "Every guidance step is deterministically linked to official government portals and statutory records.",
      versionLabel: "Knowledge Base Version",
      updatedLabel: "Last Updated",
      activeRulesLabel: "Active Verified Provisions",
      sourceType: "Type",
      lastVerified: "Verified On",
      version: "Version",
      viewOfficial: "View Official Source",
      changelogTitle: "Recent Version Changelog"
    },
    howItWorks: {
      title: "How NyayaSetu_AI Operates Safely",
      subtitle: "Engineered specifically to eliminate legal hallucinations, protect user privacy, and ensure verified citations.",
      steps: [
        {
          step: "01",
          title: "Autonomous Safety Check",
          desc: "Bilingual regex and keyword detection catches immediate danger or violence, instantly routing users to Emergency 112 without AI latency."
        },
        {
          step: "02",
          title: "Deterministic Source Retrieval",
          desc: "Filters out superseded laws and retrieves only active statutory provisions from official .gov.in and .nic.in documents."
        },
        {
          step: "03",
          title: "Strict Evidence Grounding",
          desc: "AI explains only what the retrieved text proves, flagging limitations and forbidding outside legal memory."
        },
        {
          step: "04",
          title: "Server-Side Claim Verification",
          desc: "Extracts sections, deadlines, and helplines, rejecting any ungrounded claim before the answer reaches the user."
        },
        {
          step: "05",
          title: "Versioned & Tested Knowledge",
          desc: "All legal rules are Git-tracked, validated against 6 evaluation dimensions, and updated via CLI with atomic tests."
        }
      ]
    },
    privacy: {
      title: "Privacy & Safe Usage Notice",
      badge: "Zero Server-Side Chat Storage",
      points: [
        "No Chat History Saved: Conversations are held only in your browser tab's memory and are never stored on the server.",
        "Zero Personal Data Needed: Never enter passwords, OTPs, Aadhaar numbers, or bank account details.",
        "Legal Notice: This application provides general legal information in simple terms. For formal legal representation or filing petitions in court, consult your District Legal Services Authority (DLSA) or a qualified advocate."
      ]
    },
    footer: {
      linksTitle: "Official Indian Legal Portals",
      indiaCode: "India Code Digital Repository",
      nalsa: "National Legal Services Authority (NALSA)",
      erss: "Emergency Response Support System (112)",
      copyright: "NyayaSetu_AI • Built for HACK@BVP 8.0 • Social Impact & Legal Technology"
    }
  },
  hi: {
    brand: "न्यायसेतु_AI (NyayaSetu_AI)",
    tagline: "एआई आधारित द्विभाषी विधिक मार्गदर्शन प्रणाली",
    hackathon: "HACK@BVP 8.0",
    nav: {
      guidance: "मार्गदर्शन",
      emergency: "आपातकालीन",
      scenarios: "सामान्य परिस्थितियां",
      sources: "सत्यापित स्रोत",
      howItWorks: "कार्यप्रणाली",
      privacy: "गोपनीयता",
      toggleLang: "Switch to English"
    },
    hero: {
      badge: "भारत विधिक सूचना पोर्टल • HACK@BVP 8.0",
      title: "नागरिकों को विश्वसनीय कानूनी जानकारी से जोड़ना",
      subtitle: "कानूनी अधिकारों, पुलिस प्रक्रिया, घरेलू हिंसा से सुरक्षा और मुफ्त कानूनी सहायता पर सरल हिंदी और अंग्रेजी में सत्यापित आधिकारिक मार्गदर्शन।",
      startBtn: "कानूनी मार्गदर्शन प्राप्त करें",
      sourcesBtn: "सत्यापित कानून और स्रोत देखें",
      disclaimerNote: "यह प्रणाली आधिकारिक सरकारी दस्तावेजों पर आधारित सामान्य कानूनी जानकारी देती है, कानूनी सलाह नहीं।"
    },
    emergencyBanner: {
      alertTitle: "क्या आप या कोई अन्य तात्कालिक खतरे या हिंसा में हैं?",
      alertText: "भारत में पुलिस, एम्बुलेंस और अग्निशमन सहायता के लिए तुरंत 112 डायल करें।",
      callBtn: "तुरंत 112 डायल करें",
      portalLink: "112.gov.in देखें",
      disclaimer: "आपातकालीन नंबर और प्रक्रियाएं भारत के लिए हैं। NyayaSetu_AI सीधे पुलिस या मदद नहीं भेज सकता।"
    },
    scenarios: {
      title: "अक्सर पूछे जाने वाले कानूनी मामले",
      subtitle: "वर्तमान भारतीय कानूनों के तहत आधिकारिक प्रक्रियाओं को जानने के लिए किसी भी स्थिति पर क्लिक करें।",
      cards: [
        {
          id: "sc-dv",
          topic: "घरेलू हिंसा",
          title: "घर में मारपीट या प्रताड़ना का सामना",
          prompt: "घरेलू हिंसा अधिनियम 2005 के तहत पीड़ित महिला को कौन से सुरक्षा आदेश और निवास आदेश मिल सकते हैं?",
          badge: "घरेलू हिंसा कानून 2005"
        },
        {
          id: "sc-fir",
          topic: "पुलिस प्रक्रिया",
          title: "किसी भी थाने में एफआईआर / जीरो एफआईआर",
          prompt: "भारतीय नागरिक सुरक्षा संहिता (BNSS) की धारा 173 के तहत जीरो एफआईआर कैसे दर्ज करवाएं और क्या इसकी कॉपी मुफ्त मिलती है?",
          badge: "BNSS 2023"
        },
        {
          id: "sc-aid",
          topic: "मुफ्त कानूनी सहायता",
          title: "नालसा (NALSA) के तहत मुफ्त वकील पाना",
          prompt: "क्या भारत में महिलाओं को बिना किसी आय सीमा के नालसा के तहत मुफ्त वकील और कानूनी सहायता मिलती है?",
          badge: "विधिक सेवा 1987"
        },
        {
          id: "sc-posh",
          topic: "कार्यस्थल पर प्रताड़ना",
          title: "ऑफिस में यौन उत्पीड़न (POSH एक्ट)",
          prompt: "कार्यस्थल पर यौन उत्पीड़न की शिकायत आंतरिक समिति (Internal Committee) में कैसे दर्ज करें?",
          badge: "POSH एक्ट 2013"
        },
        {
          id: "sc-stalking",
          topic: "पीछा करना व छेड़छाड़",
          title: "महिला का पीछा करना या साइबर स्टॉकिंग",
          prompt: "भारतीय न्याय संहिता (BNS) की धारा 78 के तहत महिला का पीछा करने या इंटरनेट पर निगरानी रखने पर क्या कानूनी कार्रवाई होती है?",
          badge: "BNS 2023"
        },
        {
          id: "sc-checklist",
          topic: "दस्तावेजों की सूची",
          title: "शिकायत या कानूनी सहायता के लिए जरूरी कागजात",
          prompt: "विधिक सेवा प्राधिकरण (DLSA) में मुफ्त कानूनी मदद या शिकायत के लिए कौन-कौन से दस्तावेज तैयार रखने चाहिए?",
          badge: "दस्तावेज चेकलिस्ट"
        }
      ]
    },
    chat: {
      title: "संवादात्मक कानूनी सूचना सहायक",
      subtitle: "अपनी स्थिति हिंदी, अंग्रेजी या मिश्रित भाषा में लिखें। सभी उत्तर केवल सत्यापित सरकारी स्रोतों पर आधारित होते हैं।",
      emptyPrompt: "कानूनी अधिकार, एफआईआर दर्ज कराने, घरेलू संरक्षण या मुफ्त वकील के बारे में प्रश्न पूछें...",
      inputPlaceholder: "अपनी कानूनी स्थिति या प्रश्न सरल भाषा में लिखें... (भेजने के लिए Enter दबाएं, नई लाइन के लिए Shift+Enter)",
      sendBtn: "पूछें",
      sendingBtn: "सत्यापित स्रोत खोजे जा रहे हैं...",
      newChatBtn: "नया संवाद शुरू करें",
      disclaimer: "NyayaSetu_AI केवल सामान्य कानूनी जानकारी देता है, यह कानूनी सलाह या वकील का विकल्प नहीं है।",
      demoBadge: "डेमो / फ़ॉलबैक मोड (सत्यापित स्रोतों पर आधारित)",
      emergencyBadge: "तात्कालिक आपातकालीन सहायता",
      noEvidenceBadge: "ज्ञानकोष के दायरे से बाहर / अपर्याप्त साक्ष्य",
      clarificationBadge: "स्पष्टीकरण की आवश्यकता",
      stepsTitle: "चरणबद्ध आधिकारिक प्रक्रिया",
      sourcesTitle: "उपयोग किए गए सत्यापित सरकारी स्रोत",
      partialEvidenceWarning: "सूचना: उपलब्ध सरकारी स्रोतों में इस स्थिति के कुछ पहलुओं की ही पुष्टि है।",
      limitationsTitle: "सीमाएं व गैर-शामिल पहलू",
      outdatedTitle: "कानूनी संक्रमण / समीक्षा सूचना",
      charCount: "अक्षर",
      retryBtn: "पुनः प्रयास करें"
    },
    referral: {
      title: "आधिकारिक विधिक सेवा प्राधिकरण रेफरल",
      badge: "NALSA / DLSA सहायता",
      actionText: "विधिक सेवा प्राधिकरण से संपर्क",
      visitBtn: "आधिकारिक पोर्टल देखें"
    },
    sourcesSection: {
      title: "सत्यापित ज्ञानकोष एवं स्रोत विवरण",
      subtitle: "प्रत्येक विधिक मार्गदर्शन चरण आधिकारिक सरकारी पोर्टलों (.gov.in / .nic.in) से सत्यापित है।",
      versionLabel: "ज्ञानकोष संस्करण",
      updatedLabel: "अंतिम अद्यतन",
      activeRulesLabel: "सक्रिय सत्यापित प्रावधान",
      sourceType: "प्रकार",
      lastVerified: "सत्यापन तिथि",
      version: "संस्करण",
      viewOfficial: "आधिकारिक स्रोत खोलें",
      changelogTitle: "हालिया संस्करण परिवर्तन (Changelog)"
    },
    howItWorks: {
      title: "NyayaSetu_AI किस प्रकार सुरक्षित मार्गदर्शन प्रदान करता है",
      subtitle: "कानूनी मनगढ़ंत बातों (Hallucinations) को रोकने और नागरिक गोपनीयता सुरक्षित रखने के लिए निर्मित।",
      steps: [
        {
          step: "01",
          title: "स्वचालित सुरक्षा जांच",
          desc: "द्विभाषी सुरक्षा प्रणाली तात्कालिक खतरे या हिंसा को तुरंत पहचानकर उपयोगकर्ता को बिना किसी देरी के 112 आपातकालीन सेवा से जोड़ती है।"
        },
        {
          step: "02",
          title: "निश्चित स्रोत खोज (Deterministic Retrieval)",
          desc: "रद्द हो चुके पुराने कानूनों को अलग कर केवल सक्रिय .gov.in और .nic.in वैधानिक प्रावधानों का चयन किया जाता है।"
        },
        {
          step: "03",
          title: "कठोर साक्ष्य सीमा",
          desc: "एआई केवल चुने गए आधिकारिक अंशों की व्याख्या करता है, बाहर से कोई बात जोड़ने की अनुमति नहीं होती।"
        },
        {
          step: "04",
          title: "सर्वर-स्तरीय दावा सत्यापन",
          desc: "उत्तर में शामिल धाराओं, समय-सीमाओं और नंबरों की जांच होती है; असत्यापित दावा पाए जाने पर तुरंत सुरक्षित रूप से बदल दिया जाता है।"
        },
        {
          step: "05",
          title: "संस्करण-नियंत्रित विधिक ज्ञान",
          desc: "समस्त कानूनी सामग्री Git द्वारा ट्रैक की जाती है और 6 विधिक परीक्षण आयामों पर परखे जाने के बाद ही जोड़ी जाती है।"
        }
      ]
    },
    privacy: {
      title: "गोपनीयता एवं सुरक्षित उपयोग सूचना",
      badge: "सर्वर पर कोई चैट संग्रहीत नहीं",
      points: [
        "संवाद सर्वर पर सेव नहीं होता: आपकी बातचीत केवल आपके ब्राउज़र टैब की मेमोरी में रहती है।",
        "कोई व्यक्तिगत डेटा न दें: कभी भी पासवर्ड, ओटीपी, आधार नंबर या बैंक खाते का विवरण दर्ज न करें।",
        "विधिक सूचना: यह प्रणाली केवल सामान्य कानूनी जानकारी प्रदान करती है। न्यायालय में याचिका दायर करने या मुकदमे के लिए विधिक सेवा प्राधिकरण (DLSA) या किसी अधिवक्ता से संपर्क करें।"
      ]
    },
    footer: {
      linksTitle: "आधिकारिक भारतीय विधिक पोर्टल",
      indiaCode: "इंडिया कोड (India Code) पोर्टल",
      nalsa: "राष्ट्रीय विधिक सेवा प्राधिकरण (NALSA)",
      erss: "आपातकालीन प्रत्युत्तर सहायता प्रणाली (112)",
      copyright: "न्यायसेतु_AI (NyayaSetu_AI) • HACK@BVP 8.0 के लिए निर्मित • सामाजिक प्रभाव एवं विधिक तकनीक"
    }
  }
};
