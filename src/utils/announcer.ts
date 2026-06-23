// HTML5 Browser SpeechSynthesis Voice Announcement Support with Native Tamil Synthesis

const DOCTOR_TAMIL_NAMES: Record<string, string> = {
  "Dr. Arul Selvan": "அருள் செல்வன்",
  "Dr. Meera Krishnan": "மீரா கிருஷ்ணன்",
  "Dr. Rajesh Kumar": "ராஜேஷ் குமார்",
  "Dr. Sneha Subramanian": "சினேகா சுப்ரமணியன்",
  "Dr. Vijay Ram": "விஜய் ராம்"
};

export function announceToken(
  tokenNumber: number,
  patientName: string,
  roomNumber: string,
  doctorName: string,
  lang: 'en' | 'ta' = 'en'
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported in this environment');
    return;
  }

  // Cancel any ongoing speech to prevent overlapping or stacked audio
  window.speechSynthesis.cancel();

  // Retrieve current active voices from browser
  let voices = window.speechSynthesis.getVoices();

  let speechText = '';
  let utteranceLang = 'en-US';
  let targetVoice: SpeechSynthesisVoice | undefined = undefined;

  // 1. Clean the doctor name to prevent "Dr. Dr." or "Doctor Dr." duplications
  let rawDocKey = doctorName.trim();
  let baseDocName = rawDocKey;
  while (/^(dr\b|doctor\b|dr\.|doctor\.)/i.test(baseDocName)) {
    baseDocName = baseDocName.replace(/^(dr\b|doctor\b|dr\.|doctor\.)\s*/i, "").trim();
  }
  let cleanDocEn = `Dr. ${baseDocName}`;

  // 2. Clean the room number to prevent "Room Room No" duplications
  let rawRoomStr = roomNumber.trim();
  let roomNoOnly = rawRoomStr
    .replace(/room/gi, "")
    .replace(/number/gi, "")
    .replace(/no\b/gi, "")
    .replace(/no\./gi, "")
    .replace(/#/g, "")
    .replace(/\s+/g, " ")
    .trim();
  let cleanRoomEn = `Room No. ${roomNoOnly}`;

  if (lang === 'ta') {
    // True Tamil phrase with native terms
    let cleanDocTa = DOCTOR_TAMIL_NAMES[rawDocKey] || DOCTOR_TAMIL_NAMES[cleanDocEn] || baseDocName;
    speechText = `அடையாள எண் ${tokenNumber}. ${patientName} தயவுசெய்து அறை எண் ${roomNoOnly}, டாக்டர் ${cleanDocTa} அறைக்குச் செல்லவும்.`;
    utteranceLang = 'ta-IN';

    // Find the finest Tamil voice (e.g., Google தமிழ் or Microsoft Valluvar, etc.)
    targetVoice = voices.find(v => {
      const name = v.name.toLowerCase();
      const l = v.lang.toLowerCase().replace('_', '-');
      return l.startsWith('ta') || name.includes('tamil') || l.includes('ta-in');
    });
    console.log("SpeechSynthesis Tamil Voice Search:", targetVoice ? targetVoice.name : "No native Tamil voice found. Falling back to browser default with ta-IN lang configuration.");
  } else {
    // English phrase incorporating clean structures
    speechText = `Token number ${tokenNumber}. ${patientName}. Please proceed to ${cleanRoomEn}, ${cleanDocEn}.`;
    utteranceLang = 'en-US';

    // Find a premium English voice
    targetVoice = voices.find(v => {
      const l = v.lang.toLowerCase();
      return l.startsWith('en') && (l.includes('us') || l.includes('gb') || l.includes('in') || l.includes('premium'));
    });
  }

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.lang = utteranceLang;
  
  if (targetVoice) {
    utterance.voice = targetVoice;
  }
  
  // Set clean speed rate (slightly slower for high comprehensibility in public lobby)
  utterance.rate = 0.88;
  utterance.pitch = 1.0;

  // Fire speech synthesis after a tiny 100ms timeout.
  // This is a verified browser fix to ensure the cancel() operation resolves successfully
  // before speaking, avoiding silence, hanging locks, or blocking speech queues.
  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 100);
}

// Pre-load and warm up browser internal voice catalogues
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
