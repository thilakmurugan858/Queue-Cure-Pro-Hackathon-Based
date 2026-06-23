import React, { useState, useEffect, useRef } from "react";
import { HashRouter, Routes, Route, Link, useParams, useSearchParams } from "react-router-dom";
import { 
  Users, 
  Clock, 
  Tv, 
  UserPlus, 
  UserCheck, 
  FileText, 
  Smartphone, 
  TrendingUp, 
  HelpCircle, 
  Volume2, 
  VolumeX,
  Search, 
  AlertCircle, 
  BookOpen, 
  Sparkles,
  Phone,
  Settings,
  Shield,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Lock,
  ArrowRight
} from "lucide-react";
import io from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";

import { Patient, Doctor, QueueStats, PriorityLevel, PatientStatus } from "./types";
import { announceToken } from "./utils/announcer";
import AddPatientModal from "./components/AddPatientModal";
import PatientDetailsModal from "./components/PatientDetailsModal";
import AnalyticsCharts from "./components/AnalyticsCharts";
import UserGuide from "./components/UserGuide";

// Translation dictionary for bilingual support (English / Tamil)
const LANGUAGE_DICT = {
  en: {
    title: "QueueCure Pro",
    tagline: "Intelligent Fair-Queue Clinic Management",
    language: "Language",
    receptionistPanel: "Receptionist & Doctors Hub",
    waitingRoomMode: "Waiting Room TV Mode",
    analyticsHub: "Clinical Metrics & Graphs",
    userGuide: "User Manual",
    addPatient: "Add Patient Registry",
    registerBtn: "Register Patient",
    name: "Patient Name",
    age: "Age",
    phone: "Mobile Phone",
    priority: "Priority Mode",
    doctor: "Consultant Doctor",
    normal: "Normal Priority",
    senior: "Senior Priority",
    pregnant: "Pregnant Priority",
    emergency: "Emergency Priority",
    activeWaitList: "Live waiting Queue List",
    callingPatient: "Current Active Consultation",
    callNextBtn: "Call Next Patient",
    skipBtn: "Mark Skip",
    recallBtn: "Re-Announce Token",
    moveToEndBtn: "Move to End tail",
    markCompleteBtn: "Mark Consultation Completed",
    reconnecting: "Reconnecting to QueueCure core backend services...",
    connected: "Socket Core Services Synced",
    searchPlaceholder: "Search patient name, token or mobile...",
    doctorHeader: "Specialist Consultant Cabinets",
    tokensAhead: "Tokens Ahead",
    estWait: "Estimated Wait",
    mins: "mins",
    room: "Room",
    waiting: "Waiting",
    completed: "Completed",
    inProgress: "In Consultation",
    skipped: "Skipped",
    cancelled: "Cancelled",
    virtualAlertTitle: "📲 Simulated Virtual Queue Notification (SMS Push)",
    printTicket: "Print Receipt Slip",
    allDoctors: "All Rooms"
  },
  ta: {
    title: "கியூகியூர் ப்ரோ",
    tagline: "அதிநவீன மருத்துவ வரிசை மேலாண்மை",
    language: "மொழி",
    receptionistPanel: "வரவேற்பு மற்றும் மருத்துவர்கள் தளம்",
    waitingRoomMode: "காத்திருப்போர் அரங்கு தொலைக்காட்சி",
    analyticsHub: "நேரடி புள்ளிவிவரங்கள்",
    userGuide: "பயனர் கையேடு",
    addPatient: "புதிய நோயாளியை சேர்க்க",
    registerBtn: "பதிவு செய்க",
    name: "நோயாளி பெயர்",
    age: "வயது",
    phone: "கைபேசி எண்",
    priority: "முன்னுரிமை",
    doctor: "சிகிச்சை மருத்துவர்",
    normal: "சாதாரண முன்னுரிமை",
    senior: "முதியவர் முன்னுரிமை (60+)",
    pregnant: "கர்ப்பிணி முன்னுரிமை",
    emergency: "அவசர சிகிச்சை",
    activeWaitList: "வரிசையில் காத்திருக்கும் நோயாளிகள்",
    callingPatient: "ஆலோசனையில் உள்ள நோயாளி",
    callNextBtn: "அடுத்தவரை அழைக்கவும்",
    skipBtn: "தவிர்க்கவும் (Skip)",
    recallBtn: "அறிவிப்பை மீண்டும் செய்க",
    moveToEndBtn: "வரிசையின் கடைசிக்கு மாற்றவும்",
    markCompleteBtn: "ஆலோசனையை வெற்றிகரமாக முடிக்கவும்",
    reconnecting: "கியூகியூர் உள்ளூர் தரவுத்தளத்துடன் மீண்டும் இணைகிறது...",
    connected: "தரவுத்தளம் வெற்றிகரமாக இணைந்துள்ளது",
    searchPlaceholder: "பெயர், டோக்கன், கைபேசி மூலம் தேட...",
    doctorHeader: "மருத்துவர்களின் அறை நிலவரம்",
    tokensAhead: "முன்னால் உள்ளவர்கள்",
    estWait: "மதிப்பிடப்பட்ட நேரம்",
    mins: "நிமிடம்",
    room: "அறை எண்",
    waiting: "காத்திருப்பவர்",
    completed: "முடிக்கப்பட்டவர்",
    inProgress: "ஆலோசனையில் உள்ளவர்",
    skipped: "தவிர்க்கப்பட்டவர்",
    cancelled: "ரத்து செய்யப்பட்டவர்",
    virtualAlertTitle: "📲 மெய்நிகர் வரிசை விழிப்பூட்டல் சிமுலேஷன் (SMS)",
    printTicket: "சீட்டு அச்சிட",
    allDoctors: "அனைத்து அறைகளும்"
  }
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [fairnessLogs, setFairnessLogs] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    totalWaiting: 0,
    totalCompleted: 0,
    totalCalling: 0,
    doctors: [],
    consultationsCount: 0
  });

  const [isSocketConnected, setIsSocketConnected] = useState(true);
  const [callAlert, setCallAlert] = useState<any>(null);
  
  // Storage for our simulated Virtual Queue push notifications
  const [simulatedSMS, setSimulatedSMS] = useState<any[]>([]);

  // Sound announcer mute setting
  const [isSpokenAnnounceEnabled, setIsSpokenAnnounceEnabled] = useState(true);

  // Silent accessibility High-Contrast Flash Alert Mode
  const [isFlashModeEnabled, setIsFlashModeEnabled] = useState(() => localStorage.getItem("flashMode") === "true");
  const [activeFlash, setActiveFlash] = useState(false);

  // References to keep state values up-to-date in the singleton socket connection
  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const isSpokenAnnounceEnabledRef = useRef(isSpokenAnnounceEnabled);
  useEffect(() => {
    isSpokenAnnounceEnabledRef.current = isSpokenAnnounceEnabled;
  }, [isSpokenAnnounceEnabled]);

  useEffect(() => {
    localStorage.setItem("flashMode", isFlashModeEnabled ? "true" : "false");
  }, [isFlashModeEnabled]);

  // Initialize Socket connection
  useEffect(() => {
    // Connect to same host port 3000
    const socket = io(window.location.origin, {
      reconnectionDelayMax: 10000,
    });

    socket.on("connect", () => {
      console.log("WebSocket connected to QueueCure core.");
      setIsSocketConnected(true);
    });

    socket.on("disconnect", () => {
      console.warn("WebSocket disconnected.");
      setIsSocketConnected(false);
    });

    socket.on("initialState", (payload) => {
      setPatients(payload.patients);
      setDoctors(payload.doctors);
      setFairnessLogs(payload.fairnessLogs || []);
      setAnalytics(payload.analytics);
    });

    socket.on("fairnessLogUpdated", (payload) => {
      setFairnessLogs(payload);
    });

    socket.on("queueUpdated", (payload) => {
      setPatients(payload.patients);
      setDoctors(payload.doctors);
      setAnalytics(payload.analytics);
    });

    socket.on("analyticsUpdated", (payload) => {
      setAnalytics(payload);
    });

    // Speak announcement out loud on room additions
    socket.on("tokenCalled", (payload) => {
      setCallAlert({
        title: "Calling Token Number",
        text: payload.msgEn,
        lang: "en",
        ...payload
      });
      // Silent access flash pulse trigger
      setActiveFlash(true);
      setTimeout(() => setActiveFlash(false), 5500);

      // Speak out loud if voice announcements are toggled on
      if (isSpokenAnnounceEnabledRef.current) {
        if (window.location.hash.includes("waiting-room")) {
          // Speak English first
          announceToken(payload.tokenNumber, payload.patient.name, payload.roomNumber, payload.doctorName, 'en');
          // Speak Tamil right after (sequential bilingual cycle)
          setTimeout(() => {
            announceToken(payload.tokenNumber, payload.patient.name, payload.roomNumber, payload.doctorName, 'ta');
          }, 4500);
        } else {
          // Receptionist & Doctor Hub - exclusively English
          announceToken(payload.tokenNumber, payload.patient.name, payload.roomNumber, payload.doctorName, 'en');
        }
      }
      setTimeout(() => setCallAlert(null), 8500);
    });

    socket.on("tokenRecalled", (payload) => {
      setCallAlert({
        title: "Recall Token Alert",
        text: payload.msgEn,
        lang: "en",
        ...payload
      });
      // Silent access flash pulse trigger
      setActiveFlash(true);
      setTimeout(() => setActiveFlash(false), 5500);

      if (isSpokenAnnounceEnabledRef.current) {
        if (window.location.hash.includes("waiting-room")) {
          // Speak English first
          announceToken(payload.tokenNumber, payload.patient.name, payload.roomNumber, payload.doctorName, 'en');
          // Speak Tamil right after (sequential bilingual cycle)
          setTimeout(() => {
            announceToken(payload.tokenNumber, payload.patient.name, payload.roomNumber, payload.doctorName, 'ta');
          }, 4500);
        } else {
          // Receptionist & Doctor Hub - exclusively English
          announceToken(payload.tokenNumber, payload.patient.name, payload.roomNumber, payload.doctorName, 'en');
        }
      }
      setTimeout(() => setCallAlert(null), 8000);
    });

    // Capture Simulated "Virtual Queue Come-In NOW" notification alert broadcasted
    socket.on("virtualQueueAlert", (smsPayload) => {
      // Silent access flash pulse trigger
      setActiveFlash(true);
      setTimeout(() => setActiveFlash(false), 5500);

      const uniqueSmsId = `sms_${Date.now()}_${smsPayload.patientId || ""}_${Math.random().toString(36).substring(2, 9)}`;
      setSimulatedSMS(prev => [
        { id: uniqueSmsId, timestamp: new Date().toLocaleTimeString(), ...smsPayload },
        ...prev
      ]);
      // Remove simulated popups automatically after 10 secs
      setTimeout(() => {
        setSimulatedSMS(prev => prev.filter(sms => sms.id !== uniqueSmsId));
      }, 10000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Periodic REST Polling fallback to guarantee state syncing
  useEffect(() => {
    const syncData = async () => {
      try {
        const docRes = await fetch("/api/doctors");
        const patRes = await fetch("/api/patients");
        const logRes = await fetch("/api/fairness-logs");
        if (docRes.ok && patRes.ok) {
          const fetchedDocs = await docRes.json();
          const fetchedPats = await patRes.json();
          setDoctors(fetchedDocs);
          setPatients(fetchedPats);
        }
        if (logRes.ok) {
          const fetchedLogs = await logRes.json();
          setFairnessLogs(fetchedLogs);
        }
      } catch (err) {
        console.warn("REST syncing query encountered connection limits.", err);
      }
    };

    const interval = setInterval(syncData, 5000);
    return () => clearInterval(interval);
  }, []);

  const isPatientRoute = window.location.hash.includes("/patient/");

  return (
    <HashRouter>
      <div className="min-h-screen bg-main text-[#3A3A35] flex flex-col font-sans selection:bg-[#6B705C] selection:text-white">
        
        {/* Reconnection banner alerts */}
        {!isSocketConnected && (
          <div className="bg-amber-500 text-slate-900 text-xs font-semibold py-2 px-4 shadow-inner text-center flex items-center justify-center gap-1.5 animate-pulse shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{LANGUAGE_DICT[lang].reconnecting}</span>
          </div>
        )}

        {/* Global Navigation Header bar */}
        {!isPatientRoute && (
          <header className="card-glass border-b border-[#6B705C]/15 sticky top-0 z-40 print:hidden shrink-0 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between flex-wrap gap-4">
            
            {/* Visual Branding Title block */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="p-2 bg-[#6B705C] rounded-xl shadow-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#6B705C]">
                  {LANGUAGE_DICT[lang].title}
                </h1>
                <p className="text-[10px] text-stone-500 font-medium tracking-tight">
                  {LANGUAGE_DICT[lang].tagline}
                </p>
              </div>
            </Link>

            {/* Central Desktop layout link pathways */}
            <nav className="flex items-center gap-2 md:gap-4 text-xs font-semibold">
              <Link 
                to="/" 
                className="px-3 py-2 text-stone-600 hover:text-[#3A3A35] hover:bg-[#6B705C]/10 rounded-xl transition-all"
              >
                🏥 {LANGUAGE_DICT[lang].receptionistPanel}
              </Link>
              <Link 
                to="/waiting-room" 
                className="px-3 py-2 text-stone-600 hover:text-[#3A3A35] hover:bg-[#6B705C]/10 rounded-xl transition-all flex items-center gap-1"
              >
                <Tv className="w-3.5 h-3.5 text-[#6B705C]" />
                {LANGUAGE_DICT[lang].waitingRoomMode}
              </Link>
              <Link 
                to="/user-guide" 
                className="px-3 py-2 text-stone-600 hover:text-[#3A3A35] hover:bg-[#6B705C]/10 rounded-xl transition-all flex items-center gap-1"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#6B705C]" />
                {LANGUAGE_DICT[lang].userGuide}
              </Link>
            </nav>

            {/* Language Selection and Sound toggle */}
            <div className="flex items-center gap-2">
              {/* Seed Demo Data Button */}
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/seed", { method: "POST" });
                    if (res.ok) {
                      const data = await res.json();
                      const docRes = await fetch("/api/doctors");
                      const patRes = await fetch("/api/patients");
                      const logRes = await fetch("/api/fairness-logs");
                      if (docRes.ok && patRes.ok && logRes.ok) {
                        setDoctors(await docRes.json());
                        setPatients(await patRes.json());
                        setFairnessLogs(await logRes.json());
                      }
                    } else {
                      console.error("Failed to seed data");
                    }
                  } catch (e) {
                    console.error("Error calling seed API", e);
                  }
                }}
                className="px-3 py-2 bg-[#81B29A] hover:bg-[#72a189] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1"
                title="Repopulate sandbox with pre-constructed patient history and logs"
              >
                🌱 Seed Demo Data
              </button>

              {/* Voice Synthesizer Audio Announcement Toggle */}
              <button
                onClick={() => setIsSpokenAnnounceEnabled(!isSpokenAnnounceEnabled)}
                title={isSpokenAnnounceEnabled ? "Mute Spoken Announcements" : "Unmute Spoken Announcements"}
                className={`p-2 rounded-xl border transition-all ${
                  isSpokenAnnounceEnabled 
                    ? "bg-[#6B705C] hover:bg-[#555949] text-white border-[#6B705C]/20" 
                    : "bg-orange-50 hover:bg-orange-100 border-orange-200 text-[#E07A5F]"
                }`}
              >
                {isSpokenAnnounceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>


            </div>

          </div>
        </header>
        )}

        {/* Floating Announcement Audio Call Popups */}
        {callAlert && (
          <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl shadow-2xl border border-indigo-700 animate-slide-in flex gap-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl h-12 w-12 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Volume2 className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                {callAlert.title}
              </p>
              <h4 className="text-lg font-black tracking-tight text-white">
                TOKEN {callAlert.tokenNumber}
              </h4>
              <p className="text-xs text-indigo-100 leading-normal font-sans">
                {lang === 'ta' ? callAlert.msgTa : callAlert.msgEn}
              </p>
              <span className="inline-block text-[9px] text-indigo-400 bg-slate-900/30 px-2 py-0.5 rounded font-mono mt-1.5">
                Announced in Room {callAlert.roomNumber}
              </span>
            </div>
          </div>
        )}

        {/* Global Simulated SMS Push Inbox for Virtual Queue alerts */}
        {!isPatientRoute && simulatedSMS.length > 0 && (
          <div className="fixed top-20 right-4 z-50 w-80 space-y-2 pointer-events-none">
            {simulatedSMS.map((sms) => (
              <div 
                key={sms.id} 
                className="bg-white text-gray-900 p-4 rounded-xl shadow-xl border-l-4 border-amber-500 pointer-events-auto animate-slide-in space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1 uppercase">
                    <Phone className="w-3 h-3" />
                    {LANGUAGE_DICT[lang].virtualAlertTitle}
                  </span>
                  <span className="text-[9px] font-mono text-gray-400">{sms.timestamp}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-gray-700 font-medium font-sans">
                  "{sms.msg}"
                </p>
                <div className="flex items-center justify-between text-[9px] text-gray-400 border-t border-gray-100 pt-1.5">
                  <span>To Mobile: +91 {sms.phone}</span>
                  <span className="bg-slate-100 text-slate-600 font-mono text-[8px] px-1.5 py-0.5 rounded uppercase">SIMULATED SMS</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Routed Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route 
              path="/" 
              element={
                <ReceptionistDashboard 
                  patients={patients} 
                  doctors={doctors} 
                  setPatients={setPatients} 
                  setDoctors={setDoctors}
                  lang={lang} 
                />
              } 
            />
            <Route 
              path="/waiting-room" 
              element={
                <WaitingRoomDisplay 
                  doctors={doctors} 
                  patients={patients} 
                  lang={lang} 
                  fairnessLogs={fairnessLogs}
                  isFlashModeEnabled={isFlashModeEnabled}
                  setIsFlashModeEnabled={setIsFlashModeEnabled}
                  activeFlash={activeFlash}
                />
              } 
            />
            <Route 
              path="/patient/:id" 
              element={
                <PatientTicketPage 
                  lang={lang} 
                  patients={patients}
                  doctors={doctors}
                />
              } 
            />
            <Route 
              path="/user-guide" 
              element={<UserGuide />} 
            />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

/**
 * RECEPTIONIST & DOCTORS MAIN DASHBOARD VIEW
 */
function ReceptionistDashboard({
  patients,
  doctors,
  setPatients,
  setDoctors,
  lang
}: {
  patients: Patient[];
  doctors: any[];
  setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
  setDoctors: React.Dispatch<React.SetStateAction<any[]>>;
  lang: 'en' | 'ta';
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchText, setSearchText] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("waiting"); // default is waiting to focus receptionist
  
  // Specific error messages from Call Next locks
  const [actionError, setActionError] = useState<string | null>(null);

  // Success handle when patient is registered
  const handlePatientAdded = (newPat: Patient) => {
    // Add patient is also synced via socket connection callbacks immediately,
    // but updating local state is extremely helpful
    setPatients(prev => [...prev, newPat]);
  };

  const handlePatientUpdated = (updatedPat: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPat.id ? updatedPat : p));
  };

  const handlePatientDeleted = (id: string) => {
    setPatients(prev => prev.filter(p => p.id !== id));
  };

  // Triggers the fair queue call next logic
  const handleCallNext = async (doctorId: string) => {
    setActionError(null);
    try {
      const res = await fetch(`/api/doctors/${doctorId}/call-next`, {
        method: "POST"
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to trigger call next action.");
      }

      const outcome = await res.json();
      if (outcome.message && !outcome.patient) {
        alert(outcome.message);
      }
    } catch (err: any) {
      setActionError(err.message || "Operation failed.");
      setTimeout(() => setActionError(null), 5000);
    }
  };

  // Trigger quick skip patient with auditable reason tracking
  const handleSkipPatient = async (patientId: string) => {
    const defaultReasonEn = "Patient did not respond to multiple waiting hall loudspeaker announcements.";
    const defaultReasonTa = "ஒலிபெருக்கியில் பலமுறை அழைத்தும் நோயாளி வரவில்லை.";
    
    const reasonPrompt = prompt(
      lang === 'en' 
        ? "QUEUE FAIRNESS AUDITED ACTION:\nEnter a short reason explaining to waiting patients why this token is being SKIPPED:"
        : "வரிசை நேர்மை தணிக்கை :\nஇதற்கான சுருக்கமான காரணத்தை உள்ளிடவும்:",
      lang === 'en' ? defaultReasonEn : defaultReasonTa
    );

    if (reasonPrompt === null) return; // Cancelled

    const finalReasonEn = lang === 'en' ? reasonPrompt : "Skipped per staff command confirmation.";
    const finalReasonTa = lang === 'ta' ? reasonPrompt : "பயனர் உள்ளீடு அடிப்படையில் முடக்கப்பட்டது.";

    try {
      const res = await fetch(`/api/patients/${patientId}/skip`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonEn: finalReasonEn, reasonTa: finalReasonTa })
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      alert("Failed to mark patient skipped");
    }
  };

  // Trigger patient recall voice announcement with auditable reason tracking
  const handleRecallPatient = async (patientId: string) => {
    const defaultReasonEn = "Attending physician requested immediate re-call for vital signs validation.";
    const defaultReasonTa = "உடல்நிலை சரிபார்ப்புக்காக மருத்துவர் உடனடியாக மீண்டும் அழைக்கிறார்.";
    
    const reasonPrompt = prompt(
      lang === 'en' 
        ? "QUEUE FAIRNESS AUDITED ACTION:\nEnter a short reason explaining to waiting patients for this RE-CALL event:"
        : "வரிசை நேர்மை தணிக்கை :\nஇந்த டோக்கனை ஏன் மீண்டும் அழைக்கிறீர்கள் என்பதற்கான காரணத்தை உள்ளிடவும்:",
      lang === 'en' ? defaultReasonEn : defaultReasonTa
    );

    if (reasonPrompt === null) return; // Cancelled

    const finalReasonEn = lang === 'en' ? reasonPrompt : "Physician requested physical exam re-call.";
    const finalReasonTa = lang === 'ta' ? reasonPrompt : "மருத்துவர் மீண்டும் அழைப்பு விடுத்தார்.";

    try {
      const res = await fetch(`/api/patients/${patientId}/recall`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonEn: finalReasonEn, reasonTa: finalReasonTa })
      });
      if (!res.ok) throw new Error();
    } catch (e) {
      alert("Failed to trigger re-call voice announcement.");
    }
  };

  // Shift patient to end tail of queue
  const handleMoveToEnd = async (patientId: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/move-to-end`, { method: "POST" });
      if (!res.ok) throw new Error();
    } catch (e) {
      alert("Failed to shift patient to queue tail.");
    }
  };

  // Mark Consultation Complete and trigger dynamic wait prediction recalculation
  const handleCompleteConsultation = async (patientId: string) => {
    try {
      const res = await fetch(`/api/patients/${patientId}/complete`, { method: "POST" });
      if (!res.ok) throw new Error();
    } catch (e) {
      alert("Failed to complete consultation.");
    }
  };

  // Dynamic filter lists for patients
  const filteredPatients = patients.filter(p => {
    const textMatch = 
      p.name.toLowerCase().includes(searchText.toLowerCase()) || 
      p.tokenNumber.toString().includes(searchText) || 
      p.phone.includes(searchText);

    const docMatch = doctorFilter === "" || p.doctorId === doctorFilter;
    const priorityMatch = priorityFilter === "" || p.priority === priorityFilter;
    const statusMatch = statusFilter === "" || p.status === statusFilter;

    return textMatch && docMatch && priorityMatch && statusMatch;
  });

  // Priority styling dictionary
  const getPriorityBadgeAndTag = (p: PriorityLevel) => {
    switch (p) {
      case "emergency":
        return { text: LANGUAGE_DICT[lang].emergency, color: "bg-red-100 text-red-700 border-red-300 font-black saturate-110 shrink-0" };
      case "pregnant":
        return { text: LANGUAGE_DICT[lang].pregnant, color: "bg-pink-100 text-pink-700 border-pink-300 font-bold shrink-0" };
      case "senior":
        return { text: LANGUAGE_DICT[lang].senior, color: "bg-purple-100 text-purple-700 border-purple-300 font-medium shrink-0" };
      case "normal":
      default:
        return { text: LANGUAGE_DICT[lang].normal, color: "bg-slate-100 text-slate-700 border-slate-300 shrink-0" };
    }
  };

  // Queue status indicator styling dictionary
  const getStatusStyle = (s: PatientStatus) => {
    switch (s) {
      case "completed": return "bg-emerald-50 border border-emerald-200 text-emerald-700";
      case "in-progress": return "bg-amber-50 border border-amber-200 text-amber-700 animate-pulse";
      case "skipped": return "bg-rose-50 border border-rose-200 text-rose-700";
      case "waiting":
      default: return "bg-sky-50 border border-sky-100 text-sky-700";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Search Filter Header / Quick Actions row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        
        {/* Search input with icons */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={LANGUAGE_DICT[lang].searchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 rounded-xl transition-all"
          />
        </div>

        {/* Action Controls Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-700">
          
          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs font-medium focus:outline-none"
          >
            <option value="">{LANGUAGE_DICT[lang].allDoctors}</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name.replace("Dr. ", "")}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs font-medium focus:outline-none"
          >
            <option value="">{LANGUAGE_DICT[lang].priority} (All)</option>
            <option value="normal">{LANGUAGE_DICT[lang].normal}</option>
            <option value="senior">{LANGUAGE_DICT[lang].senior}</option>
            <option value="pregnant">{LANGUAGE_DICT[lang].pregnant}</option>
            <option value="emergency">{LANGUAGE_DICT[lang].emergency}</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-xs font-medium focus:outline-none"
          >
            <option value="">Status (All)</option>
            <option value="waiting">{LANGUAGE_DICT[lang].waiting}</option>
            <option value="in-progress">{LANGUAGE_DICT[lang].inProgress}</option>
            <option value="completed">{LANGUAGE_DICT[lang].completed}</option>
            <option value="skipped">{LANGUAGE_DICT[lang].skipped}</option>
          </select>

          {/* Fast Clear Filter buttons */}
          {(doctorFilter || priorityFilter || statusFilter !== "waiting" || searchText) && (
            <button
              onClick={() => {
                setDoctorFilter("");
                setPriorityFilter("");
                setStatusFilter("waiting");
                setSearchText("");
              }}
              title="Reset Filters"
              className="p-2 border border-gray-200 text-gray-500 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Add patient trigger registry button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#6B705C] hover:bg-[#555949] text-white font-extrabold rounded-xl shadow-sm transition-all text-xs"
          >
            <UserPlus className="w-4 h-4" />
            {LANGUAGE_DICT[lang].addPatient}
          </button>
        </div>

      </div>

      {actionError && (
        <div className="p-3 bg-orange-50 text-red-600 text-xs font-mono font-bold rounded-xl border border-orange-150 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#E07A5F] shrink-0" />
          <span>Error Calling Patient: {actionError}</span>
        </div>
      )}

      {/* Grid of Doctor Specialization Cabinets (Doctor Control panels) */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase text-stone-400 tracking-wider">
          {LANGUAGE_DICT[lang].doctorHeader}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => {
            const activeConsulting = patients.find(p => p.doctorId === doc.id && p.status === "in-progress");

            return (
              <div 
                key={doc.id}
                className="card-glass hover:shadow-md transition-all p-5 flex flex-col justify-between gap-4 rounded-2xl"
              >
                
                {/* Doctor Identification Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-[#3A3A35] text-sm">{doc.name}</h4>
                    <p className="text-[10px] text-[#6B705C] font-bold">{doc.specialization} • {doc.roomNumber}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-1 bg-[#E9EDC9] text-[#6B705C] rounded-md">
                    Avg {doc.avgConsultationTime || 10} {LANGUAGE_DICT[lang].mins}
                  </span>
                </div>

                {/* Patient In Consulting Block */}
                <div className="bg-[#F5F5F0]/60 p-4 rounded-xl border border-stone-200/50 flex flex-col justify-between gap-2">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-stone-400 block">
                    {LANGUAGE_DICT[lang].callingPatient}
                  </span>

                  {activeConsulting ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <strong className="text-stone-900 text-sm mt-0.5 block">{activeConsulting.name}</strong>
                        <span className="text-[10px] font-mono shrink-0 font-black text-[#6B705C] bg-white shadow-sm border border-[#6B705C]/20 px-2 py-0.5 rounded-lg">
                          Tk: {activeConsulting.tokenNumber}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500">
                        Age: {activeConsulting.age} • Mobile: +91 {activeConsulting.phone}
                      </p>
                      
                      {/* Active Actions controls during consulting */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-stone-200/60">
                        <button
                          onClick={() => handleRecallPatient(activeConsulting.id)}
                          className="py-1.5 px-2 bg-white hover:bg-stone-50 text-[#6B705C] border border-stone-200 text-[10px] font-bold rounded-lg transition-colors"
                        >
                          📢 {LANGUAGE_DICT[lang].recallBtn}
                        </button>
                        <button
                          onClick={() => handleCompleteConsultation(activeConsulting.id)}
                          className="py-1.5 px-2 bg-[#81B29A] hover:bg-[#72a189] text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm"
                        >
                          ✓ {LANGUAGE_DICT[lang].markCompleteBtn}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2.5 text-center text-xs text-stone-400 font-normal">
                      No patient currently consulting
                    </div>
                  )}
                </div>

                {/* Queue Summary & Control caller */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div>
                    <span className="text-[9px] uppercase font-semibold text-stone-400 block">In Waiting Queue</span>
                    <strong className="text-xl font-extrabold text-[#3A3A35] font-mono">
                      {doc.waitingCount || 0} Patients
                    </strong>
                  </div>

                  <button
                    disabled={!!activeConsulting}
                    onClick={() => handleCallNext(doc.id)}
                    className={`flex items-center gap-1 py-1.5 px-3.5 shadow-sm text-[11px] font-bold rounded-xl transition-all ${
                      activeConsulting 
                        ? "bg-stone-200/50 border border-stone-300 text-stone-400 cursor-not-allowed"
                        : "bg-[#6B705C] hover:bg-[#555949] text-white"
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {LANGUAGE_DICT[lang].callNextBtn}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* Main Patient Active Table Grid list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {LANGUAGE_DICT[lang].activeWaitList}
            </h3>
            <p className="text-xs text-slate-400 leading-tight">
              Anti-starvation rules active. Priority score ages at +12 points/minute.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-slate-50 text-slate-500 font-mono text-[10px] font-bold rounded-md">
            Showing {filteredPatients.length} of {patients.length} records
          </span>
        </div>

        {/* Interactive Patients Queue table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-slate-400 uppercase font-black text-[9px] tracking-wider">
                <th className="py-2.5 px-3">Token Info</th>
                <th className="py-2.5 px-3">Patient Name</th>
                <th className="py-2.5 px-2">Age / Phone</th>
                <th className="py-2.5 px-3">Priority Level</th>
                <th className="py-2.5 px-3">Assigned specialist</th>
                <th className="py-2.5 px-2">Register Time</th>
                <th className="py-2.5 px-3 text-right">Interactive Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-gray-700">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-xs text-slate-400">
                    No matching patient profiles found in queue under active filters.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((pat) => {
                  const patPri = getPriorityBadgeAndTag(pat.priority);
                  const isWaiting = pat.status === "waiting";
                  const isInProgress = pat.status === "in-progress";

                  const secondsDiff = Date.now() - new Date(pat.createdAt).getTime();
                  const minsWaiting = Math.max(0, Math.floor(secondsDiff / 60000));

                  const assignedDocName = doctors.find(d => d.id === pat.doctorId)?.name || "External Doctor";

                  return (
                    <tr 
                      key={pat.id}
                      className="hover:bg-indigo-50/25 transition-colors group"
                    >
                      {/* Token suffix */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100/40 px-2 py-1 rounded-lg">
                          #{pat.tokenNumber}
                        </span>
                      </td>

                      {/* Patient profile name */}
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        <button
                          onClick={() => setSelectedPatient(pat)}
                          className="hover:text-indigo-600 text-left font-bold"
                          title="Click to Edit profile details"
                        >
                          {pat.name}
                        </button>
                      </td>

                      {/* Age & phone */}
                      <td className="py-3 px-2 text-slate-500 font-sans">
                        <div>
                          <span>{pat.age} yrs</span>
                          <span className="block text-[10px] text-slate-400">+91 {pat.phone}</span>
                        </div>
                      </td>

                      {/* Priority Tag */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wide rounded-md uppercase border ${patPri.color}`}>
                          {patPri.text}
                        </span>
                      </td>

                      {/* Specialist */}
                      <td className="py-3 px-3 font-medium text-slate-650">
                        {assignedDocName}
                      </td>

                      {/* Register Timing */}
                      <td className="py-3 px-2 text-slate-450 font-mono text-[10px]">
                        <div>
                          <span>{new Date(pat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isWaiting && (
                            <span className="block text-[9px] text-indigo-500">{minsWaiting}m waiting</span>
                          )}
                        </div>
                      </td>

                      {/* Quick panel action controls */}
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1 font-semibold">
                          {isWaiting && (
                            <>
                              <button
                                onClick={() => handleSkipPatient(pat.id)}
                                title={LANGUAGE_DICT[lang].skipBtn}
                                className="px-2 py-1 text-[10px] border border-gray-200 text-slate-600 bg-white hover:bg-rose-50 hover:text-rose-600 rounded-md transition-colors"
                              >
                                Skip
                              </button>
                              <button
                                onClick={() => handleMoveToEnd(pat.id)}
                                title={LANGUAGE_DICT[lang].moveToEndBtn}
                                className="px-2 py-1 text-[10px] border border-gray-200 text-slate-600 bg-white hover:bg-slate-50 rounded-md transition-colors"
                              >
                                Move Tail
                              </button>
                            </>
                          )}

                          {isInProgress && (
                            <button
                              onClick={() => handleCompleteConsultation(pat.id)}
                              className="px-2.5 py-1 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors"
                            >
                              Complete
                            </button>
                          )}

                          {/* Print interactive ticket coupon */}
                          <a
                            href={`/#/patient/${pat.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Open / Print QR Ticket Screen"
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                          </a>

                          <button
                            onClick={() => setSelectedPatient(pat)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[10px] transition-all ml-1"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Analytics Visualization Panel Section */}
      <section className="bg-slate-50 border border-slate-100 p-1 rounded-2xl">
        <div className="p-5">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">
            Clinic Real-time Queue Analytics Hub
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Visualized analytics of active waiting times, doctor workloads, and hour-by-hour hourly clearance rates.
          </p>
          <AnalyticsCharts doctors={doctors} totalPages={patients.length} />
        </div>
      </section>

      {/* Onboarding Patient modal trigger */}
      {showAddModal && (
        <AddPatientModal
          doctors={doctors}
          onClose={() => setShowAddModal(false)}
          onSuccess={handlePatientAdded}
        />
      )}

      {/* Edit Profile patient details modal trigger */}
      {selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          doctors={doctors}
          onClose={() => setSelectedPatient(null)}
          onUpdate={handlePatientUpdated}
          onDelete={handlePatientDeleted}
        />
      )}

    </div>
  );
}

/**
 * PATIENT WAITING ROOM DISPLAY BOARD (TV SCREEN MODE)
 */
function WaitingRoomDisplay({ 
  doctors, 
  patients, 
  lang,
  fairnessLogs = [],
  isFlashModeEnabled = false,
  setIsFlashModeEnabled,
  activeFlash = false
}: { 
  doctors: any[]; 
  patients: Patient[]; 
  lang: 'en' | 'ta';
  fairnessLogs?: any[];
  isFlashModeEnabled?: boolean;
  setIsFlashModeEnabled?: (v: boolean) => void;
  activeFlash?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'tv' | 'mobile-list'>('tv');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isRotatingLanguage, setIsRotatingLanguage] = useState(true);
  const [localDisplayLanguage, setLocalDisplayLanguage] = useState<'en' | 'ta'>('en');

  // Unified health flat tips selector combined across all specialization to rotate on TV
  const [allTips, setAllTips] = useState<any[]>([]);

  useEffect(() => {
    // Generate simple seed bank list on mount
    const seedTips = [
      { spec: "Diabetologist", textEn: "A brisk 10 to 15 minute continuous walk right after meals can noticeably lower sugars and clear brain fog.", textTa: "சாப்பிட்ட 10-15 நிமிடங்களுக்குப் பிறகு விறுவிறுப்பாக நடப்பது இரத்தத்தில் சர்க்கரையின் அளவை உடனடியாகக் கட்டுக்குள் வைக்கிறது." },
      { spec: "Orthopedist", textEn: "Adjust your screen display height to directly match your resting eye level; this preserves natural neck bone curve.", textTa: "உங்கள் கணினியை உங்கள் கண் மட்டத்தில் வைத்து வேலை செய்யுங்கள்; இது கழுத்து எலும்பு தேய்மானத்தை தடுக்கும்." },
      { spec: "Cardiologist", textEn: "Limit your salt and processed sodium intake to under 1.5 grams daily to protect your heart vessel tension.", textTa: "இருதயத்தை விபத்துகளிலிருந்து பாதுகாக்க உணவில் உப்பின் அளவை 1.5 கிராமுக்கு குறைவாக வைத்திருங்கள்." },
      { spec: "Pediatrician", textEn: "Limit daily screens to under 1 hour for children. Guide them toward interactive block-building or puzzle-solving instead.", textTa: "குழந்தைகளுக்கு திரை நேரத்தை தினமும் 1 மணிநேரத்திற்கும் குறைவாகக் கட்டுப்படுத்துங்கள்; ஓவியம் போன்ற விளையாட்டுகளில் பழக்குங்கள்." },
      { spec: "General Physician", textEn: "De-stress dynamically: Take 5 slow, deep breaths when a busy schedule makes your breathing shallow or fast.", textTa: "மன அழுத்தத்தைக் குறைக்க: வேலைகளுக்கு நடுவே 5 முறை மெதுவாக, ஆழமான மூச்சுப்பயிற்சி செய்யுங்கள்." }
    ];
    setAllTips(seedTips);
  }, []);

  // Set Interval to loop rotating health tips and rotating language layouts
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % Math.max(1, allTips.length));
    }, 8000);

    const langInterval = setInterval(() => {
      if (isRotatingLanguage) {
        setLocalDisplayLanguage(prev => prev === 'en' ? 'ta' : 'en');
      }
    }, 5000);

    return () => {
      clearInterval(tipInterval);
      clearInterval(langInterval);
    };
  }, [allTips.length, isRotatingLanguage]);

  const displayTip = allTips[currentTipIndex] || { spec: "General Clinic Tip", textEn: "Stay hydrated and sleep well.", textTa: "நீர்ச்சத்து மற்றும் ஆரோக்கியமான தூக்கம்." };

  const activeInConsultations = patients.filter(p => p.status === "in-progress");
  const activeWaitings = patients.filter(p => p.status === "waiting");
  const activeComplets = patients.filter(p => p.status === "completed").slice(-5); // showing last 5 completed on board

  return (
    <div className="bg-[#3A3A35] relative overflow-hidden text-stone-100 min-h-[85vh] p-4 sm:p-6 lg:p-8 rounded-3xl border border-stone-800 shadow-2xl flex flex-col justify-between gap-6 font-sans">
      
      {/* Silent/Flash Alert Mode Visual Pulsing Ring Indicator */}
      {activeFlash && isFlashModeEnabled && (
        <div className="absolute inset-0 pointer-events-none z-50 animate-[pulse_1.5s_infinite] border-[16px] border-[#E07A5F] bg-[#E07A5F]/10 transition-all duration-1000" />
      )}

      {/* Lobby header TV Mode styling */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b border-stone-800 pb-4 gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6B705C] rounded-full flex items-center justify-center text-white font-extrabold animate-pulse">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-widest text-[#F2CC8F] font-mono">
              {localDisplayLanguage === 'ta' ? "முன்னோடி நேரடி வாரியம்" : "LIVE PATIENT BOARD"}
            </h2>
            <p className="text-xs text-[#E9EDC9] font-bold">
              {localDisplayLanguage === 'ta' ? "உடனடி டோக்கன் நேரடி அறிவிப்பு" : "Real-time Patient Token Announcement Display Screen"}
            </p>
          </div>
        </div>

        {/* Current Time Clock block */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-stone-400 block font-mono">
              {new Date().toLocaleDateString(localDisplayLanguage === 'ta' ? 'ta-IN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <strong className="text-xl font-extrabold tracking-wider font-mono text-[#81B29A]">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </strong>
          </div>

          {/* Silent/Flash Alert mode selector */}
          {setIsFlashModeEnabled && (
            <button
              onClick={() => setIsFlashModeEnabled(!isFlashModeEnabled)}
              className={`px-3 py-1.5 text-[10px] rounded-lg border font-bold flex items-center gap-1 transition-all ${
                isFlashModeEnabled 
                  ? "bg-[#E07A5F] border-[#E07A5F]/20 text-white shadow-sm font-extrabold" 
                  : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
              }`}
              title="Replace/supplement voice calls with a gentle, non-strobing high-contrast color flash glow"
            >
              <span>{isFlashModeEnabled ? "⚡ Flash Mode: ON" : "🔇 Flash Mode: OFF"}</span>
            </button>
          )}

          <button
            onClick={() => setIsRotatingLanguage(!isRotatingLanguage)}
            className={`px-2.5 py-1.5 text-[10px] rounded-lg border font-mono ${
              isRotatingLanguage 
                ? "bg-[#6B705C] border-[#6B705C]/25 text-white" 
                : "bg-stone-800 border-stone-705 text-stone-400"
            }`}
          >
            {isRotatingLanguage ? "Language Auto-Cycle: ON" : "Language Auto-Cycle: OFF"}
          </button>
        </div>

      </div>

      {/* Main TV split screen split-3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 my-4">
        
        {/* Chambers & Active consulting Column split-5 */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-black tracking-widest text-stone-400 uppercase font-mono border-l-2 border-[#6B705C] pl-2">
            {localDisplayLanguage === 'ta' ? "மருத்துவக் கூட நிலவரம்" : "CHAMBER CONSULTATIONS OUTLET"}
          </h3>

          <div className="space-y-4">
            {doctors.map((doc) => {
              const currentActive = patients.find(p => p.doctorId === doc.id && p.status === "in-progress");

              return (
                <div 
                  key={doc.id}
                  className="bg-stone-800/40 border border-stone-700/60 p-4 rounded-xl flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="font-extrabold text-[13px] text-white tracking-tight">{doc.name}</h4>
                    <span className="text-[10px] text-[#81B29A] font-bold block">{doc.specialization} • {doc.roomNumber}</span>
                  </div>

                  {currentActive ? (
                    <div className="text-right">
                      <span className="inline-block bg-[#81B29A]/15 text-[#81B29A] font-mono text-[9px] font-black tracking-widest border border-[#81B29A]/20 px-2 py-0.5 rounded-md mb-1 uppercase animate-pulse">
                        {localDisplayLanguage === 'ta' ? "ஆலோசனையில்" : "CONSULTING"}
                      </span>
                      <strong className="block text-xl font-black text-[#F2CC8F] font-mono">
                        Token #{currentActive.tokenNumber}
                      </strong>
                      <span className="text-[9px] text-stone-300 block">{currentActive.name}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800">
                      {localDisplayLanguage === 'ta' ? "அறை காலியாக உள்ளது" : "CABIN FREE"}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live waiting list Queue Column split-4 */}
        <div className="lg:col-span-4 bg-stone-800/20 border border-stone-800 p-5 rounded-2xl flex flex-col justify-between">
          
          <div className="space-y-3">
            <h3 className="text-xs font-black tracking-widest text-[#F2CC8F] uppercase font-mono border-l-2 border-[#F2CC8F] pl-2">
              {localDisplayLanguage === 'ta' ? "காத்திருக்கும் நோயாளிகள்" : "QUEUE NEXT UP STREAM"}
            </h3>

            <div className="divide-y divide-stone-800/60 overflow-y-auto max-h-96 pr-1 space-y-1">
              {activeWaitings.length === 0 ? (
                <p className="text-xs text-stone-500 py-6 text-center">
                  {localDisplayLanguage === 'ta' ? "வரிசை காலியாக உள்ளது" : "No patients waiting currently."}
                </p>
              ) : (
                activeWaitings.slice(0, 7).map((pat) => {
                  const patDoc = doctors.find(d => d.id === pat.doctorId)?.name?.replace("Dr. ", "") || "Doc";
                  const priorityText = pat.priority === "emergency" ? "🚨 EMERGENCY" : pat.priority === "pregnant" ? "Pregnant" : pat.priority === "senior" ? "Senior" : "Waiting";

                  return (
                    <div key={pat.id} className="flex items-center justify-between py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-200 bg-stone-800 border border-stone-700 px-2 py-0.5 rounded">
                          #{pat.tokenNumber}
                        </span>
                        <div>
                          <strong className="text-white block font-medium truncate max-w-[120px]">{pat.name}</strong>
                          <span className="text-[9px] text-stone-400 block">consult in {patDoc}</span>
                        </div>
                      </div>

                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border ${
                        pat.priority === "emergency" 
                          ? "bg-[#E07A5F]/15 border-[#E07A5F] text-[#E07A5F] font-extrabold"
                          : pat.priority === "pregnant" 
                            ? "bg-[#6B705C]/15 border-[#6B705C]/50 text-[#E9EDC9]"
                            : pat.priority === "senior"
                              ? "bg-[#81B29A]/15 border-[#81B29A] text-[#81B29A]"
                              : "bg-stone-800/30 border-stone-700 text-stone-300"
                      }`}>
                        {priorityText}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-stone-800 text-[10px] text-stone-400 font-mono text-center leading-tight">
            Showing top active awaiting patients. Anti-bias scheduling engine regulates flow natively.
          </div>
        </div>

        {/* Clearance History timeline view Columns split-3 */}
        <div className="lg:col-span-3 space-y-4">
          <h3 className="text-xs font-black tracking-widest text-[#81B29A] uppercase font-mono border-l-2 border-[#81B29A] pl-2">
            {localDisplayLanguage === 'ta' ? "சமீபத்திய வெளியேற்றம்" : "CLEARANCE HISTORY"}
          </h3>

          <div className="bg-stone-800/10 border border-stone-800 p-4 rounded-xl space-y-3 flex-1 min-h-[300px]">
            {activeComplets.length === 0 ? (
              <p className="text-xs text-stone-500 py-12 text-center">
                History is empty. Completed cases profile here.
              </p>
            ) : (
              activeComplets.map((pat) => (
                <div key={pat.id} className="flex items-center gap-2.5 text-xs text-stone-300 py-1.5 border-b border-stone-800 last:border-0">
                  <div className="w-5 h-5 rounded-full bg-[#81B29A]/15 border border-[#81B29A]/30 flex items-center justify-center text-[#81B29A] text-[10px] shrink-0 font-bold">✓</div>
                  <div>
                    <strong className="text-white font-medium block">{pat.name}</strong>
                    <span className="text-[9px] text-stone-400 font-mono">Token #{pat.tokenNumber} • Completed</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* 9. Queue Fairness Log Collapse Section */}
      <div className="bg-stone-900/30 border border-stone-800 p-4 rounded-2xl flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#E07A5F] animate-pulse" />
            <h4 className="text-xs font-black tracking-widest text-[#F2CC8F] uppercase font-mono">
              🛡️ {localDisplayLanguage === 'ta' ? "உறுதிப்படுத்தப்பட்ட வரிசை நேர்மை பதிவு" : "PROVABLY FAIR QUEUE AUDITING LOG"}
            </h4>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-[10px] font-mono text-[#E9EDC9] italic hidden sm:block">
              "the queue isn't just fast, it's provably fair"
            </p>
            <span className="text-[9px] font-mono bg-stone-800 text-stone-300 px-2.5 py-0.5 rounded-full">
              {fairnessLogs.length} logged events
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {fairnessLogs.length === 0 ? (
            <p className="col-span-full text-center text-xs text-stone-500 py-3 font-mono">
              No skip/recall overrides logged. Clean FIFO sequence active.
            </p>
          ) : (
            fairnessLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="bg-stone-950/40 p-3 rounded-xl border border-stone-800/80 text-[11px] leading-relaxed flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between border-b border-stone-900 pb-1.5 font-mono text-[10px]">
                  <span className="font-extrabold text-stone-100 bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700">
                    Token #{log.tokenNumber}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                    log.action === "skip" 
                      ? "bg-rose-500/15 text-rose-300 border border-rose-500/25" 
                      : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
                  }`}>
                    {log.action} override
                  </span>
                </div>
                
                <p className="text-stone-300 font-sans italic my-1">
                  "{localDisplayLanguage === 'ta' ? log.reasonTa : log.reasonEn}"
                </p>
                
                <div className="text-[8px] text-stone-500 flex items-center justify-between font-mono pt-1.5 border-t border-stone-900/40">
                  <span>Logged: {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-[#81B29A] font-bold">✓ Auditable Signature</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER: Rotating Smart Health Literacy Module */}
      <div className="bg-[#6B705C] text-white p-5 rounded-2xl shadow-lg border border-[#6B705C]/35 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          <div className="space-y-1 max-w-4xl text-left">
            <span className="inline-block bg-white/10 text-[#E9EDC9] font-mono text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
              💡 {localDisplayLanguage === "ta" ? "மருத்துவ சிறப்பு ஆலோசெனைகள்" : `LITERACY TIP: ${displayTip.spec}`}
            </span>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed tracking-tight text-white font-sans transition-all">
              "{localDisplayLanguage === 'ta' ? displayTip.textTa : displayTip.textEn}"
            </p>
          </div>

          <div className="flex flex-col items-center justify-center text-center shrink-0 border-t sm:border-t-0 sm:border-l border-white/15 pl-0 sm:pl-4">
            <p className="text-[10px] text-stone-200 uppercase font-bold tracking-widest">
              {localDisplayLanguage === 'ta' ? "உங்களை பாதுகாக்கவும்" : "HEALTH DIRECT"}
            </p>
            <p className="text-3xl font-black font-mono text-[#81B29A]">A+</p>
            <p className="text-[8px] text-stone-300">QueueCure Pro Engine</p>
          </div>

        </div>
      </div>

    </div>
  );
}

/**
 * SINGLE PATIENT LIVE TICKET QR CODE TARGET PAGE
 * Mobile optimized live-status webpage!
 */
function PatientTicketPage({ 
  lang,
  patients = [],
  doctors = [],
  isFlashModeEnabled = false,
  setIsFlashModeEnabled,
  activeFlash = false
}: { 
  lang: 'en' | 'ta';
  patients?: Patient[];
  doctors?: any[];
  isFlashModeEnabled?: boolean;
  setIsFlashModeEnabled?: (v: boolean) => void;
  activeFlash?: boolean;
}) {
  const { id } = useParams<{ id: string }>();
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [personalLang, setPersonalLang] = useState<'en' | 'ta'>(lang);

  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) throw new Error("Ticket registration profile could not be found.");
      const data = await res.json();
      setTicketData(data);
    } catch (err: any) {
      setError(err.message || "Failed syncing network.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();

    // Set up continuous poll for immediate status shifts on the mobile screen
    const interval = setInterval(fetchTicket, 4000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-8 text-center text-stone-500 font-sans">
        <p className="animate-pulse">Loading live mobile status ticket...</p>
      </div>
    );
  }

  if (error || !ticketData) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white border border-stone-200 rounded-2xl text-center space-y-4 shadow-sm my-8">
        <AlertCircle className="w-12 h-12 text-[#E07A5F] mx-auto" />
        <h3 className="font-bold text-stone-900 text-base">Invalid Ticket ID</h3>
        <p className="text-xs text-stone-555 leading-relaxed">
          The requested patient queue token might have been checked out, archived, or deleted by clinic administrators.
        </p>
        <Link to="/" className="inline-block px-4 py-2 bg-[#6B705C] hover:bg-[#555949] font-bold text-xs text-white rounded-xl">
          Return to Hub
        </Link>
      </div>
    );
  }

  const { patient, doctor, position, tokensAhead, estimatedWait, tips } = ticketData;

  const isUpNext = tokensAhead <= 1 && patient.status === "waiting";
  const isDistanceAlert = tokensAhead === 3 && patient.status === "waiting";
  const isInConsult = patient.status === "in-progress";
  const isCompleted = patient.status === "completed";

  // Select language text
  const t = LANGUAGE_DICT[personalLang];

  return (
    <div className="max-w-md mx-auto p-4 space-y-6 animate-fade-in font-sans">
      
      {/* Mobile Header Language Select toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono font-bold text-[#6B705C] bg-[#E9EDC9] px-2 py-1 rounded">
          ● MOBILE PASS
        </span>
        <div className="flex items-center gap-1.5 bg-stone-200/50 p-0.5 rounded-lg text-xs">
          <button 
            onClick={() => setPersonalLang('en')}
            className={`px-2 py-1 font-semibold rounded ${personalLang === 'en' ? "bg-white text-stone-800 shadow" : "text-stone-400"}`}
          >
            EN
          </button>
          <button 
            onClick={() => setPersonalLang('ta')}
            className={`px-2 py-1 font-semibold rounded ${personalLang === 'ta' ? "bg-white text-stone-800 shadow" : "text-slate-400"}`}
          >
            தமிழ்
          </button>
        </div>
      </div>

      {/* Primary Mobile Wait Ticket card */}
      <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-stone-100 flex flex-col justify-between">
        
        {/* Top Header Card */}
        <div className="bg-[#6B705C] text-white p-6 space-y-3 text-center">
          <div>
            <p className="text-[10px] text-[#E9EDC9] uppercase font-bold tracking-widest">
              {t.title}
            </p>
            <h2 className="text-xl font-extrabold tracking-tight mt-0.5">{patient.name}</h2>
            <p className="text-xs text-stone-100 italic">
              Registered for {doctor?.name} • Room {doctor?.roomNumber}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl py-3 px-4 max-w-[180px] mx-auto border border-white/10">
            <span className="text-[9px] uppercase font-bold tracking-widest text-[#E9EDC9] block">
              YOUR TOKEN NUMBER
            </span>
            <strong className="text-3xl font-black font-mono text-white">
              #{patient.tokenNumber}
            </strong>
          </div>
        </div>

        {/* Live dynamic metrics progress bar */}
        <div className="p-6 space-y-5">
          
          {/* Status alerts */}
          {isInConsult && (
            <div className="bg-[#81B29A]/10 text-stone-800 border border-[#81B29A]/20 p-3.5 rounded-xl font-sans text-xs text-center leading-normal animate-pulse">
              🎉 <strong>{personalLang === 'en' ? "Your Turn is Active!" : "உங்கள் முறை வந்துவிட்டது!"}</strong>
              <p className="text-[11px] mt-1 text-[#6B705C] font-semibold">
                {personalLang === 'en' ? `Please proceed directly to ${doctor?.roomNumber} now.` : `தயவுசெய்து உடனடியாக ${doctor?.roomNumber} அறைக்குச் செல்லவும்.`}
              </p>
            </div>
          )}

          {isCompleted && (
            <div className="bg-stone-50 text-stone-600 border border-stone-150 p-3.5 rounded-xl text-xs text-center leading-normal">
              ✅ <strong>{personalLang === 'en' ? "Consultation Completed" : "ஆலோசனை முடிந்தது"}</strong>
              <p className="text-[11px] mt-1 text-stone-400">
                {personalLang === 'en' ? "Thank you for trusting QueueCure Pro. Get well soon!" : "கியூகியூர் ப்ரோவை நாடியதற்கு நன்றி. விரைவில் நலம் பெறவும்!"}
              </p>
            </div>
          )}

          {isUpNext && (
            <div className="bg-[#E07A5F]/10 text-stone-800 border border-[#E07A5F]/20 p-3.5 rounded-xl text-xs text-center leading-normal animate-pulse">
              ⚠️ <strong>{personalLang === 'en' ? "You are Up NEXT!" : "நீங்கள் அடுத்து அழைக்கப்படுவீர்கள்!"}</strong>
              <p className="text-[11px] mt-1 text-[#E07A5F] font-semibold">
                {personalLang === 'en' ? "Please stand directly outside the room cabinet door now." : "தயவுசெய்து அறை வாசலுக்கு அருகில் காத்திருக்கவும்."}
              </p>
            </div>
          )}

          {isDistanceAlert && (
            <div className="bg-orange-50 text-stone-800 border border-orange-100 p-3 text-xs rounded-xl text-center leading-normal">
              🚀 <strong>{personalLang === 'en' ? "Virtual Queue Reminder" : "மெய்நிகர் நினைவூட்டல்"}</strong>
              <p className="text-[11px] mt-1 text-[#E07A5F] font-semibold">
                There are only 3 tokens ahead of you. If you are waiting remotely, please walk back to the clinic lobby immediately!
              </p>
            </div>
          )}

          {/* Progress Timeline view */}
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold text-stone-400 py-1">
            <div className="space-y-1">
              <div className={`h-1.5 rounded-full ${isCompleted || isInConsult || patient.status === 'waiting' ? "bg-[#6B705C]" : "bg-stone-200"}`} />
              <span className={patient.status === 'waiting' ? "text-[#6B705C]" : "text-stone-550"}>{t.waiting}</span>
            </div>
            <div className="space-y-1">
              <div className={`h-1.5 rounded-full ${isCompleted || isInConsult ? "bg-[#6B705C]" : "bg-stone-200"}`} />
              <span className={isInConsult ? "text-[#6B705C] animate-pulse" : "text-stone-550"}>{t.inProgress}</span>
            </div>
            <div className="space-y-1">
              <div className={`h-1.5 rounded-full ${isCompleted ? "bg-[#6B705C]" : "bg-stone-200"}`} />
              <span className={isCompleted ? "text-[#6B705C]" : "text-stone-550"}>{t.completed}</span>
            </div>
          </div>

          {/* Quick core metrics Grid if waiting */}
          {patient.status === "waiting" && (
            <div className="grid grid-cols-2 gap-4 border-t border-b border-stone-105 py-4 font-sans text-center">
              <div>
                <span className="text-[10px] text-[#6B705C] block uppercase font-bold tracking-wider">{t.tokensAhead}</span>
                <strong className="text-2xl font-black text-stone-800 font-mono">
                  {tokensAhead}
                </strong>
                <span className="text-[9px] text-stone-400 block">{personalLang === 'en' ? "patients ahead" : "நபர்கள் முன்னால்"}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#6B705C] block uppercase font-bold tracking-wider">{t.estWait}</span>
                <strong className="text-2xl font-black text-[#81B29A] font-mono">
                  ~{estimatedWait}
                </strong>
                <span className="text-[9px] text-stone-400 block">{t.mins}</span>
              </div>
            </div>
          )}

          {/* Static Health Tip Rotation specific to assigned doctor */}
          {tips && (
            <div className="bg-[#E9EDC9]/35 border border-[#6B705C]/20 p-4 rounded-xl flex flex-col justify-between gap-2 text-left">
              <span className="text-[9px] font-mono font-black text-[#6B705C] uppercase tracking-widest block">
                🧬 {personalLang === 'en' ? `HEALTH TIP FROM DR. ${doctor?.name}` : `டாக்டர் ${doctor?.name} ஆலோசனை`}
              </span>
              <p className="text-xs text-stone-900 font-medium leading-relaxed font-sans font-medium">
                "{personalLang === 'ta' && tips.ta ? tips.ta[patient.tokenNumber % tips.ta.length] : tips.en[patient.tokenNumber % tips.en.length]}"
              </p>
              <p className="text-[8px] text-stone-400 italic">
                * Reframe wait-time: Learn and stay healthy while waiting in QueueCure Pro.
              </p>
            </div>
          )}

        </div>

        {/* Footer info ticket */}
        <div className="bg-stone-50 font-mono text-center text-[9px] py-3 text-stone-400 border-t border-stone-100">
          TICKET REF: {patient.id} • SECURED FOR CLINIC USE
        </div>

      </div>

      {/* Live Patient List / Live Queue Status Section */}
      <div className="bg-white rounded-3xl shadow-lg border border-stone-100 p-5 space-y-4">
        <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#6B705C] tracking-tight">
            📋 {personalLang === 'en' ? "Live Clinic Queue Status" : "நேரடி வரிசை நிலவரம்"}
          </h3>
          <span className="text-[9px] font-mono font-bold bg-[#81B29A]/15 text-[#81B29A] px-2 py-0.5 rounded-full uppercase animate-pulse">
            {personalLang === 'en' ? "Live Updates" : "நேரடி நிகழ்நிலை"}
          </span>
        </div>

        {/* Chamber Consultations */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] font-bold tracking-wider text-stone-400 uppercase font-mono">
            Chambers / மருத்துவர் அறைகள்
          </h4>
          <div className="space-y-2">
            {doctors.length === 0 ? (
              <p className="text-[10px] text-stone-400 py-2 text-center">No active cabins registered.</p>
            ) : (
              doctors.map((doc) => {
                const currentActive = patients.find(p => p.doctorId === doc.id && p.status === "in-progress");
                return (
                  <div key={doc.id} className="bg-stone-50 border border-stone-100 p-3 rounded-2xl flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-xs text-stone-800">{doc.name}</h5>
                      <span className="text-[9px] text-stone-400 font-medium">{doc.specialization} • Room {doc.roomNumber}</span>
                    </div>
                    {currentActive ? (
                      <span className="text-right">
                        <span className="text-[8px] bg-[#81B29A]/15 font-mono text-[#81B29A] font-extrabold border border-[#81B29A]/20 px-1.5 py-0.5 rounded uppercase">
                          Token #{currentActive.tokenNumber}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-stone-400 bg-stone-100/50 px-2 py-1 rounded">
                        {personalLang === 'en' ? "CABIN FREE" : "அறை காலியாக உள்ளது"}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Waiting List queue */}
        <div className="space-y-2.5 pt-2 border-t border-stone-100">
          <h4 className="text-[10px] font-bold tracking-wider text-[#E07A5F] uppercase font-mono font-semibold">
            Upcoming in Queue / வரிசையில் அடுத்தவர்கள்
          </h4>
          <div className="divide-y divide-stone-50 overflow-y-auto max-h-64 pr-1">
            {patients.filter(p => p.status === "waiting").length === 0 ? (
              <p className="text-[11px] text-stone-500 py-4 text-center">
                {personalLang === 'en' ? "No patients waiting currently." : "வரிசை காலியாக உள்ளது."}
              </p>
            ) : (
              patients.filter(p => p.status === "waiting").map((pat) => {
                const assignedDoc = doctors.find(d => d.id === pat.doctorId)?.name || "Doctor";
                return (
                  <div key={pat.id} className="flex items-center justify-between py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#6B705C] bg-[#E9EDC9] px-2 py-0.5 rounded">
                        #{pat.tokenNumber}
                      </span>
                      <strong className="text-stone-800 font-bold truncate max-w-[150px]">{pat.name}</strong>
                    </div>
                    <span className="text-[9px] text-stone-400 font-mono">Chamber with {assignedDoc.replace("Dr. ", "")}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
