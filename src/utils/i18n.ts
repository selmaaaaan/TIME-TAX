export type Language = 'en' | 'ml';

export const translations = {
  en: {
    brandTagline: 'Your time is worth more.',
    heroOverline: 'MAKE THE INVISIBLE VISIBLE',
    heroTitleLine1: 'YOUR DAY HAS',
    heroTitleLine2: 'A HIDDEN',
    heroTitleHighlight: 'PRICE.',
    heroSubtitle:
      'Every queue takes something you can never earn back. Discover where time disappears, measure its impact, and build a better campus.',
    ctaTrackWait: 'Track my waiting time',
    ctaExploreInsights: 'Explore live insights',
    navHome: 'Overview',
    navInsights: 'Live Insights',
    navReport: 'Report Wait',
    navAreas: 'Campus Areas',
    navDashboard: 'Workspace',
    navLogin: 'Sign In',
    studentGreeting: 'Good morning! Ready to take back your time?',
    studentStartTracking: 'Start tracking',
    qrJoinQueue: 'I joined the queue',
    qrServed: "I've been served",
    qrCancel: 'Cancel session',
    qrScanTitle: 'SCAN TO TRACK YOUR WAIT',
    qrScanSubtitle: 'Scan. Start. Finish.',
    qrNoLoginNeeded: 'No registration or login required for guests.',
    mentorHero: 'Small delays. Big opportunities to improve.',
    managementHero: 'See the cost. Change the system.',
    adminStudioTitle: 'Areas & QR Studio',
    emptyReportsMessage:
      'Not enough reports yet. Check again when more people have shared their waiting times.',
    demoBannerText:
      'DEMONSTRATION MODE — Showing labeled sample records alongside real server-stored reports. Connect Supabase PostgreSQL in Admin Settings for cloud production.',
  },
  ml: {
    brandTagline: 'നിങ്ങളുടെ സമയം കൂടുതൽ വിലപ്പെട്ടതാണ്.',
    heroOverline: 'അദൃശ്യമായ കാത്തിരിപ്പ് ദൃശ്യമാക്കാം',
    heroTitleLine1: 'നിങ്ങളുടെ ദിവസത്തിന്',
    heroTitleLine2: 'ഒരു അദൃശ്യ',
    heroTitleHighlight: 'വിലയുണ്ട്.',
    heroSubtitle:
      'ഓരോ ക്യൂവും തിരികെ ലഭിക്കാത്ത സമയം കവരുന്നു. സമയം എവിടെ നഷ്ടപ്പെടുന്നുവെന്ന് കണ്ടെത്തുക, മികച്ച ക്യാമ്പസ് നിർമ്മിക്കുക.',
    ctaTrackWait: 'കാത്തിരിപ്പ് സമയം രേഖപ്പെടുത്തുക',
    ctaExploreInsights: 'തത്സമയ വിവരങ്ങൾ കാണുക',
    navHome: 'ഹോം',
    navInsights: 'തത്സമയ വിവരങ്ങൾ',
    navReport: 'സമയം ചേർക്കുക',
    navAreas: 'സേവന കേന്ദ്രങ്ങൾ',
    navDashboard: 'ഡാഷ്‌ബോർഡ്',
    navLogin: 'ലോഗിൻ',
    studentGreeting: 'സുപ്രഭാതം! നിങ്ങളുടെ സമയം തിരിച്ചുപിടിക്കാൻ തയ്യാറാണോ?',
    studentStartTracking: 'ട്രാക്കിംഗ് തുടങ്ങാം',
    qrJoinQueue: 'ഞാൻ ക്യൂവിൽ കയറി',
    qrServed: 'സേവനം ലഭിച്ചു',
    qrCancel: 'റദ്ദാക്കുക',
    qrScanTitle: 'കാത്തിരിപ്പ് സമയം രേഖപ്പെടുത്താൻ സ്കാൻ ചെയ്യുക',
    qrScanSubtitle: 'സ്കാൻ ചെയ്യുക. തുടങ്ങുക. പൂർത്തിയാക്കുക.',
    qrNoLoginNeeded: 'ലോഗിൻ ഇല്ലാതെ തന്നെ സമയം രേഖപ്പെടുത്താം.',
    mentorHero: 'ചെറിയ താമസങ്ങൾ. വലിയ മാറ്റങ്ങൾക്കുള്ള അവസരങ്ങൾ.',
    managementHero: 'സമയനഷ്ടം കാണുക. സംവിധാനം മാറ്റുക.',
    adminStudioTitle: 'ഏരിയ & ക്യുആർ സ്റ്റുഡിയോ',
    emptyReportsMessage:
      'ഇതുവരെ ആവശ്യത്തിന് റിപ്പോർട്ടുകൾ ലഭ്യമല്ല. കൂടുതൽ ആളുകൾ സമയം രേഖപ്പെടുത്തിയ ശേഷം വീണ്ടും പരിശോധിക്കുക.',
    demoBannerText:
      'ഡെമോൺസ്ട്രേഷൻ മോഡ് — യഥാർത്ഥ സെർവർ റിപ്പോർട്ടുകൾക്കൊപ്പം മാതൃകാ ഡാറ്റയും കാണിക്കുന്നു.',
  },
};

export function t(lang: Language, key: keyof typeof translations['en']): string {
  return translations[lang]?.[key] || translations.en[key];
}
