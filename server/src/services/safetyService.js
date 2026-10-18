/**
 * Emergency and Safety Service for NyayaSetu_AI.
 * Section 8.2:
 * Evaluates user input for immediate danger, active violence, weapons, confinement,
 * or distress calls in English, Devanagari Hindi, and Romanized Hindi (Hinglish).
 * Returns hard-coded compassionate emergency response without calling Gemini.
 */

// Regex patterns for immediate physical danger / life threat / distress calls
const EMERGENCY_PATTERNS = [
  // English
  /\b(?:help\s+me|save\s+me|under\s+attack|attacking\s+me|beating\s+me\s+now|threat(?:en)?(?:ing)?\s+with\s+(?:gun|knife|weapon)|breaking\s+(?:in|my\s+door)|locked\s+in(?:\s+a\s+room)?|confined|life\s+in\s+danger|kill(?:ing)?\s+me|stab(?:bing)?|chok(?:ing)?\s+me|call\s+police\s+(?:now|immediately)|emergency\s+help|in\s+immediate\s+danger)\b/i,
  // Devanagari Hindi
  /(?:बचाओ|मदद\s*करो|हमला\s*हो\s*रहा|मार\s*रहा\s*है|मारपीट\s*कर\s*रहा|चाकू|हथियार|बंदूक|कमरे\s*में\s*बंद|दरवाज़ा\s*तोड़|दरवाजा\s*तोड़|जान\s*का\s*खतरा|जान\s*खतरे\s*में|जान\s*से\s*मारने|पुलिस\s*बुलाओ|आपातकालीन\s*मदद)/i,
  // Romanized Hindi (Hinglish)
  /\b(?:bachao|bachao\s+mujhe|madad\s+karo|hamla\s+ho\s+gaya|maar\s+raha\s+hai|mar\s+raha\s+hai|marpeet\s+kar\s+raha|chaku|jaan\s+khatre\s+me|jaan\s+se\s+maar|kamre\s+me\s+band|darwaza\s+tod|police\s+bulao|emergency\s+hai|abhi\s+attack)\b/i
];

const EMERGENCY_RESPONSES = {
  en: {
    answer: "If you or someone else is in immediate physical danger, facing violence, or needs urgent emergency help in India, please call 112 immediately. You can reach police, ambulance, or fire services through this single nationwide number (official portal: https://112.gov.in/). If it is safe to do so, move to a secure location or reach out to nearby trusted people.\n\nPlease note: NyayaSetu_AI is an automated legal information system and cannot dispatch emergency responders, file police complaints, or contact authorities on your behalf. If you are outside India, local emergency numbers and procedures differ.",
    steps: [
      {
        text: "Dial 112 immediately from any mobile phone or landline in India.",
        sourceIds: ["erss-112-emergency"]
      },
      {
        text: "If safe to do so, move to a secure space or seek assistance from trusted neighbours or family.",
        sourceIds: ["erss-112-emergency"]
      },
      {
        text: "Access the official National Emergency Response Support System at https://112.gov.in/.",
        sourceIds: ["erss-112-emergency"]
      }
    ],
    limitations: "Automated information only; emergency services have not been dispatched.",
    safetyNotice: "General legal and emergency information only; not a substitute for police intervention or legal representation."
  },
  hi: {
    answer: "यदि आप या कोई अन्य व्यक्ति भारत में किसी तात्कालिक शारीरिक खतरे, हिंसा या आपातकालीन स्थिति में हैं, तो कृपया तुरंत 112 पर कॉल करें। यह पूरे भारत में पुलिस, एम्बुलेंस और अग्निशमन सेवाओं के लिए एकीकृत एकल आपातकालीन नंबर है (आधिकारिक पोर्टल: https://112.gov.in/)। यदि सुरक्षित हो, तो किसी सुरक्षित स्थान पर जाएं या आसपास के विश्वसनीय व्यक्तियों से संपर्क करें।\n\nकृपया ध्यान दें: NyayaSetu_AI केवल एक सूचना प्रणाली है। यह प्रणाली आपकी ओर से पुलिस या आपातकालीन सेवाओं को नहीं बुला सकती और न ही कोई शिकायत दर्ज कर सकती है। यदि आप भारत से बाहर हैं, तो स्थानीय आपातकालीन नंबर और प्रक्रियाएं भिन्न हो सकती हैं।",
    steps: [
      {
        text: "भारत में किसी भी फोन से तुरंत 112 डायल करें।",
        sourceIds: ["erss-112-emergency"]
      },
      {
        text: "यदि सुरक्षित हो, तो सुरक्षित स्थान पर जाएं या पड़ोसियों/विश्वसनीय व्यक्तियों से तुरंत मदद लें।",
        sourceIds: ["erss-112-emergency"]
      },
      {
        text: "आधिकारिक आपातकालीन पोर्टल देखें: https://112.gov.in/",
        sourceIds: ["erss-112-emergency"]
      }
    ],
    limitations: "स्वचालित सूचना मात्र; आपातकालीन सहायता सीधे नहीं भेजी गई है।",
    safetyNotice: "केवल सामान्य कानूनी व आपातकालीन जानकारी; पुलिस हस्तक्षेप अथवा वकील का विकल्प नहीं।"
  }
};

/**
 * Checks if the message expresses immediate danger or life threat.
 * @param {string} message 
 * @returns {boolean}
 */
export function isEmergencyMessage(message = '') {
  if (typeof message !== 'string') return false;
  const trimmed = message.trim();
  if (!trimmed) return false;

  return EMERGENCY_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * Generates the hard-coded emergency response package.
 * @param {'en' | 'hi'} language 
 * @param {string} knowledgeBaseVersion 
 * @returns {object}
 */
export function getEmergencyResponse(language = 'en', knowledgeBaseVersion = '1.0.0') {
  const langKey = language === 'hi' ? 'hi' : 'en';
  const template = EMERGENCY_RESPONSES[langKey];

  return {
    ok: true,
    answer: template.answer,
    steps: template.steps,
    language: langKey,
    sources: [
      {
        id: "erss-112-emergency",
        title: "Emergency Response Support System (ERSS - 112)",
        url: "https://112.gov.in/",
        excerpt: "Under the Emergency Response Support System (ERSS), 112 is the single pan-India emergency number for citizens in distress.",
        sourceName: "Emergency Response Support System, Ministry of Home Affairs, Government of India",
        lastVerified: "2026-10-18",
        version: 1
      }
    ],
    evidenceLevel: "sufficient",
    needsClarification: false,
    followUpQuestions: [],
    limitations: template.limitations,
    outdatedWarning: null,
    referral: null,
    emergency: true,
    mode: "emergency",
    knowledgeBaseVersion,
    safetyNotice: template.safetyNotice
  };
}
