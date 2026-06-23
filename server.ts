import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import { Patient, Doctor, Consultation, PriorityLevel, PatientStatus, QueueStats, FairnessLogEntry } from "./src/types";
import {
  connectDatabase,
  isConnected,
  getPatients,
  getConsultations,
  getFairnessLogs,
  savePatient,
  deletePatient,
  saveConsultation,
  deleteConsultation,
  saveFairnessLog,
  clearAllCollections
} from "./db_connection";

// In-Memory Database store with pre-seeded data for the hackathon
const doctors: Doctor[] = [
  { id: "doc_1", name: "Dr. Arul Selvan", specialization: "Cardiologist", roomNumber: "Room 101", avgConsultationTime: 12 },
  { id: "doc_2", name: "Dr. Meera Krishnan", specialization: "Pediatrician", roomNumber: "Room 102", avgConsultationTime: 8 },
  { id: "doc_3", name: "Dr. Rajesh Kumar", specialization: "Diabetologist", roomNumber: "Room 103", avgConsultationTime: 10 },
  { id: "doc_4", name: "Dr. Sneha Subramanian", specialization: "Orthopedist", roomNumber: "Room 104", avgConsultationTime: 15 },
  { id: "doc_5", name: "Dr. Vijay Ram", specialization: "General Physician", roomNumber: "Room 105", avgConsultationTime: 6 }
];

let patients: Patient[] = [
  // Let's seed some waiting/completed patients to make the app feel alive instantly!
  { id: "pat_1", name: "Karthik Raja", age: 45, phone: "9876543210", tokenNumber: 101, priority: "normal", doctorId: "doc_3", status: "completed", createdAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3000000).toISOString() },
  { id: "pat_2", name: "Mallika S.", age: 68, phone: "9812345678", tokenNumber: 102, priority: "senior", doctorId: "doc_3", status: "completed", createdAt: new Date(Date.now() - 3000000).toISOString(), completedAt: new Date(Date.now() - 2400000).toISOString() },
  { id: "pat_3", name: "Anjali Devi", age: 28, phone: "9765432109", tokenNumber: 103, priority: "pregnant", doctorId: "doc_3", status: "in-progress", createdAt: new Date(Date.now() - 2400000).toISOString(), calledAt: new Date(Date.now() - 300000).toISOString() },
  { id: "pat_4", name: "Ramesh Chandran", age: 72, phone: "9654321098", tokenNumber: 104, priority: "senior", doctorId: "doc_3", status: "waiting", createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: "pat_5", name: "Sarika Murugan", age: 34, phone: "9543210987", tokenNumber: 105, priority: "normal", doctorId: "doc_3", status: "waiting", createdAt: new Date(Date.now() - 1500000).toISOString() },
  { id: "pat_6", name: "Suresh Pillai", age: 52, phone: "9432109876", tokenNumber: 106, priority: "emergency", doctorId: "doc_3", status: "waiting", createdAt: new Date(Date.now() - 600000).toISOString() },
  { id: "pat_7", name: "Thilak M.", age: 22, phone: "9123456711", tokenNumber: 107, priority: "normal", doctorId: "doc_3", status: "waiting", createdAt: new Date(Date.now() - 300000).toISOString() },
];

let consultations: Consultation[] = [
  { id: "con_1", patientId: "pat_1", doctorId: "doc_3", startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date(Date.now() - 3000000).toISOString(), duration: 10 },
  { id: "con_2", patientId: "pat_2", doctorId: "doc_3", startTime: new Date(Date.now() - 3000000).toISOString(), endTime: new Date(Date.now() - 2400000).toISOString(), duration: 10 },
  { id: "con_3", patientId: "pat_3", doctorId: "doc_3", startTime: new Date(Date.now() - 2400000).toISOString() }
];

// Token generation tracks
let currentTokenSuffix = 107;

let fairnessLogs: FairnessLogEntry[] = [
  {
    id: "log_1",
    tokenNumber: 104,
    action: "skip",
    reasonEn: "Patient did not respond to three consecutive loudspeaker announcements",
    reasonTa: "மூன்று முறை ஒலிபெருக்கியில் அழைத்தும் நோயாளி வரவில்லை",
    timestamp: new Date(Date.now() - 1700000).toISOString()
  },
  {
    id: "log_2",
    tokenNumber: 102,
    action: "recall",
    reasonEn: "Emergency patient bypass check requested by pediatrician for priority care",
    reasonTa: "குழந்தை நல மருத்துவரால் முன்னுரிமை சிகிச்சைக்காக அவசர நோயாளி அனுமதி கோரப்பட்டது",
    timestamp: new Date(Date.now() - 1200000).toISOString()
  }
];

// Specialization-based health tips content bank
const healthTipsBank: Record<string, { en: string[]; ta: string[] }> = {
  "Cardiologist": {
    en: [
      "Keep your body moving! At least 30 minutes of brisk walking daily improves your blood microcirculation.",
      "Limit your salt and processed sodium intake to under 1.5 grams daily to protect your heart vessel tension.",
      "Stay hydrated: Water helps keep your blood volume regulated, easing the load on your cardiac muscle.",
      "Include colorful berries and dark leafy greens in your meals; their antioxidants are food for your blood vessels.",
      "Practice deep breathing: Just 5 minutes of mindful box-breathing can reduce cortisol and resting heart rate."
    ],
    ta: [
      "தினசரி குறைந்தது 30 நிமிடங்கள் விறுவிறுப்பாக நடப்பது உங்கள் இரத்த ஓட்டத்தை கணிசமாக மேம்படுத்துகிறது.",
      "இருதயத்தை விபத்துகளிலிருந்து பாதுகாக்க உணவில் உப்பின் அளவை 1.5 கிராமுக்கு குறைவாக வைத்திருங்கள்.",
      "நீர்ச்சத்து குறையாமல் பார்த்துக்கொள்ளுங்கள்: நீர் அருந்துவது இரத்த அழுத்தத்தை சீராக வைத்துக்கொள்ளும்.",
      "வண்ணமயமான பழங்கள் மற்றும் கீரைகளை உணவில் சேர்த்துக்கொள்ளுங்கள்; அவை இதயம் காக்கும் அமுது.",
      "தினமும் 5 நிமிடங்கள் ஆழமாக மூச்சை இழுத்து வெளிவிடுங்கள், இது இதயம் மற்றும் மன அழுத்தத்தைக் குறைக்கும்."
    ]
  },
  "Pediatrician": {
    en: [
      "Limit daily screens to under 1 hour for children. Guide them toward interactive block-building or puzzle-solving instead.",
      "Encourage kid hydration with water or fresh, unsweetened real fruit juices rather than carbonated sodas.",
      "A regular bedtime routine is essential—children aged 5 to 12 benefit immensely from 9 to 11 hours of sleep.",
      "Ensure timely vaccinations. Keep a digital record of pediatric immunizations handy on your phone.",
      "Lead by example: Kids copy parent behavior. Eat clean dinners together without any phones on the table."
    ],
    ta: [
      "குழந்தைகளுக்கு திரை நேரத்தை தினமும் 1 மணிநேரத்திற்கும் குறைவாகக் கட்டுப்படுத்துங்கள்; ஓவியம் போன்ற விளையாட்டுகளில் பழக்குங்கள்.",
      "சோடா பானங்களுக்குப் பதில் புதிய பழச்சாறுகள் மற்றும் இளநீர் பருக குழந்தைகளுக்குக் கொடுங்கள்.",
      "வளரும் குழந்தைகளுக்கு நல்ல தூக்கம் அவசியம்: 5 முதல் 12 வயது குழைந்தைகள் 9 முதல் 11 மணிநேரம் தூங்குவது சிறந்தது.",
      "குழந்தைகளுக்கு அட்டவணைப்படி சரியான நேரத்தில் தடுப்பூசி போடுவதை உறுதிப்படுத்திக் கொள்ளுங்கள்.",
      "பெற்றோர் செய்வதையே குழந்தைகள் செய்வர்; எனவே சாப்பிடும்போது கைபேசி உபயோகிப்பதை தவிர்த்து முன்மாதிரியாக இருங்கள்."
    ]
  },
  "Diabetologist": {
    en: [
      "A brisk 10 to 15 minute continuous walk right after meals can noticeably lower sugars and clear brain fog.",
      "Focus on low Glycemic Index (GI) options like heavy millets, whole-oats, and raw fibrous vegetables instead of white flour.",
      "Never skip breakfast: A high-protein morning meal helps stabilize insulin release patterns throughout the day.",
      "Keep an emergency diabetic kit nearby: Fast-acting sugar, glucose tabs, or candies in case of sudden lightheaded hypoglycemia.",
      "Check your beautiful feet daily for minor scrapes or irritations, as high sugar can delay minor skin vessel healing."
    ],
    ta: [
      "சாப்பிட்ட 10-15 நிமிடங்களுக்குப் பிறகு விறுவிறுப்பாக நடப்பது இரத்தத்தில் சர்க்கரையின் அளவை உடனடியாகக் கட்டுக்குள் வைக்கிறது.",
      "மைதா, வெள்ளை அரிசிக்குப் பதில் தினை, சாமை போன்ற சிறுதானியங்கள் மற்றும் காய்கறிகளை உணவில் அதிகம் சேர்க்கவும்.",
      "காலை உணவை தவிர்க்க வேண்டாம்: அது உங்கள் உடலின் இன்சுலின் சுரப்பை நாள் முழுவதும் சீராக வைத்திருக்க உதவுகிறது.",
      "திடீரென சர்க்கரை குறைந்தால் சாப்பிட எப்போதும் கைவசம் சில சர்க்கரை மிட்டாய்கள் அல்லது குளுக்கோஸ் வைத்திருங்கள்.",
      "பாதங்களில் ஏதேனும் காயங்கள் உள்ளனவா என தினமும் சரிபார்க்கவும்; சர்க்கரை நோயாளிகளுக்கு காயங்கள் ஆற காலம் எடுக்கலாம்."
    ]
  },
  "Orthopedist": {
    en: [
      "Adjust your screen display height to directly match your resting eye level; this preserves natural neck bone curve.",
      "Do the 20-20 double shoulder stretch: Stand up every 45 minutes to roll your shoulders back and reverse static spine load.",
      "Calcium is bones' cement. Supplement daily diets with sesame seeds, yogurt, dark greens, or ragi (finger millet).",
      "Avoid slumping: Keep ears, shoulders, and hips beautifully aligned while typing or texting on handheld gadgets.",
      "Adequate Vitamin D is key for calcium absorption. A 15-minute exposure to gentle morning sunshine does wonders."
    ],
    ta: [
      "உங்கள் கணினியை உங்கள் கண் மட்டத்தில் வைத்து வேலை செய்யுங்கள்; இது கழுத்து எலும்பு தேய்மானத்தை தடுக்கும்.",
      "ஒவ்வொரு 45 நிமிடத்திற்கும் ஒருமுறை எழுந்து நின்று கைகளை நீட்டி தோள்களை பின்னோக்கி சுழற்றி எளிய உடற்பயிற்சி செய்யுங்கள்.",
      "எலும்புகளின் பலத்திற்கு கால்சியம் அவசியம்: கேழ்வரகு, தயிர், கீரைகள் மற்றும் எள்ளை உணவில் சேர்க்கவும்.",
      "முன்னோக்கி வளைந்து உட்காருவதைத் தவிர்க்கவும்: நேராக அமர்வது முதுகெலும்பிற்கு ஆரோக்கியமானது.",
      "வைட்டமின் டி கால்சியத்தை உறிஞ்ச அவசியம்: காலையில் 15 நிமிடம் இதமான வெயிலில் இருப்பது நல்லது."
    ]
  },
  "General Physician": {
    en: [
      "Wash hands thoroughly with soap for at least 20 seconds before touching eyes, nose, or sweet snacks.",
      "Deep, restful sleep between 10 PM and 6 AM acts as a powerful immune system booster and tissue healer.",
      "Hydrate with clear, clean water regularly. A hydrated system keeps body organs performing at optimal speeds.",
      "De-stress dynamically: Take 5 slow, deep breaths when a busy schedule makes your breathing shallow or fast.",
      "Listen to your body. Catching mild cold symptoms early with hot liquids and rest prevents complex bacterial flare-ups."
    ],
    ta: [
      "உணவருந்துவதற்கு முன் கைகளை சோப்பு கொண்டு குறைந்தபட்சம் 20 வினாடிகள் நன்கு தேய்த்து கழுவுங்கள்.",
      "இரவு 10 முதல் காலை 6 மணி வரையிலான முறையான தூக்கம் உங்கள் உடலின் நோய் எதிர்ப்பு சக்தியை அதிகரிக்கிறது.",
      "தினமும் உடலுக்குத் தேவையான அளவு சுத்தமான குடிநீர் பருகுங்கள். இது உடலின் நச்சுக்களை வெளியேற்ற உதவும்.",
      "மன அழுத்தத்தைக் குறைக்க: வேலைகளுக்கு நடுவே 5 முறை மெதுவாக, ஆழமான மூச்சுப்பயிற்சி செய்யுங்கள்.",
      "உடலின் சோர்வை அலட்சியப்படுத்தாதீர்கள். ஆரம்பக்கால சளிக்கு வெந்நீர் குடிப்பது மற்றும் ஓய்வு மிகவும் நல்லது."
    ]
  }
};

// Queue Lock: Prevent concurrent clicks causing race condition for calling patients per doctor
const activeLocks: Record<string, boolean> = {};

/**
 * FAIR QUEUE SORTING LOGIC WITH AGING
 * Prevent starvation of Normal priority patients while honoring Emergency, Pregnant, & Senior tiers.
 * 
 * Logic:
 * Each priority level gets a Base Priority Weight:
 * - Emergency: 10000 (Always top, zero wait)
 * - Pregnant: 600
 * - Senior: 300
 * - Normal: 0
 * 
 * Aging calculation:
 * Waiting Queue calculates an 'Effective Score' for each waiting patient:
 *   Score = BasePriorityWeight + (MinutesSpentWaiting * AgingRate)
 *   where AgingRate = 10 (points accumulated per minute waiting).
 * 
 * An arrival index is also kept as a secondary tie-breaker if scores are equal. This ensures
 * that if a Normal patient waits long enough (e.g. 30 minutes, adding 300 points), they will
 * jump ahead of a newly arrived Senior patient (Base weight 300).
 * 
 * This prevents starvation elegantly while giving urgent tiers their appropriate fast-track starting line!
 */
export function getSortedActiveQueueForDoctor(docId: string): Patient[] {
  const docPatients = patients.filter(p => p.doctorId === docId && p.status === "waiting");
  const now = Date.now();

  const ratedPatients = docPatients.map(p => {
    const ageInMinutes = Math.max(0, (now - new Date(p.createdAt).getTime()) / 60000);
    
    let baseWeight = 0;
    switch (p.priority) {
      case "emergency":
        baseWeight = 10000; // Emergency always gets instant priority
        break;
      case "pregnant":
        baseWeight = 600;
        break;
      case "senior":
        baseWeight = 300;
        break;
      case "normal":
      default:
        baseWeight = 0;
        break;
    }

    const agingRate = 12; // 12 points per minute of waiting
    const effectiveScore = baseWeight + (ageInMinutes * agingRate);

    return {
      patient: p,
      score: effectiveScore,
      createdAtTime: new Date(p.createdAt).getTime()
    };
  });

  // Sort by effectiveScore descending. If scores are equal, preserve arrival order (earlier createdAtTime first)
  ratedPatients.sort((a, b) => {
    if (Math.abs(a.score - b.score) < 0.01) {
      return a.createdAtTime - b.createdAtTime;
    }
    return b.score - a.score;
  });

  return ratedPatients.map(item => item.patient);
}

// Function to calculate rolling average consultation duration per doctor
function updateDoctorAverageTime(docId: string) {
  const completedCols = consultations.filter(c => c.doctorId === docId && c.duration !== undefined);
  if (completedCols.length === 0) return;

  const doc = doctors.find(d => d.id === docId);
  if (!doc) return;

  // Let's compute a rolling average of last 5 consults or all if fewer
  const lastConsults = completedCols.slice(-5);
  const sum = lastConsults.reduce((acc, c) => acc + (c.duration || 10), 0);
  const rollingAvg = Math.round(sum / lastConsults.length);

  doc.avgConsultationTime = Math.max(2, rollingAvg); // Minimum 2 minutes to keep estimates sensible
}

// Function to calculate waiting stats
function getQueueStats(docId: string): QueueStats {
  const docPatients = patients.filter(p => p.doctorId === docId);
  const waitingCount = docPatients.filter(p => p.status === "waiting").length;
  const completedCount = docPatients.filter(p => p.status === "completed").length;
  const inProgressCount = docPatients.filter(p => p.status === "in-progress").length;
  const skippedCount = docPatients.filter(p => p.status === "skipped").length;

  const doc = doctors.find(d => d.id === docId);
  const avgWaitTime = doc ? doc.avgConsultationTime : 10;

  return {
    waitingCount,
    completedCount,
    inProgressCount,
    skippedCount,
    avgWaitTime
  };
}

// Estimates the wait time for a specific waiting patient in a doctor's queue
function estimateWaitTimeForPatient(patientId: string): number {
  const pat = patients.find(p => p.id === patientId);
  if (!pat || pat.status !== "waiting") return 0;

  const sortedWaitList = getSortedActiveQueueForDoctor(pat.doctorId);
  const index = sortedWaitList.findIndex(p => p.id === patientId);

  if (index === -1) return 0;

  const doc = doctors.find(d => d.id === pat.doctorId);
  const avgConsult = doc ? doc.avgConsultationTime : 10;

  // Wait time is based on how many people are in progress plus people ahead times average consult time
  const inProgressCount = patients.filter(p => p.doctorId === pat.doctorId && p.status === "in-progress").length;
  
  const peopleAhead = index + inProgressCount;
  return peopleAhead * avgConsult;
}

// Function to broadcast updates to everyone
let io: Server;
function broadcastQueueState(docId?: string) {
  if (!io) return;

  // Fetch standard data packages
  const updatedDoctorsList = doctors.map(d => {
    const sortedWaiting = getSortedActiveQueueForDoctor(d.id);
    const activeConsulting = patients.find(p => p.doctorId === d.id && p.status === "in-progress");
    const stats = getQueueStats(d.id);

    return {
      ...d,
      waitingCount: stats.waitingCount,
      completedCount: stats.completedCount,
      inProgressActive: activeConsulting || null,
      stats
    };
  });

  // Calculate full statistics
  const totalWaiting = patients.filter(p => p.status === "waiting").length;
  const totalCompleted = patients.filter(p => p.status === "completed").length;
  const totalCalling = patients.filter(p => p.status === "in-progress").length;

  const analytics = {
    totalWaiting,
    totalCompleted,
    totalCalling,
    doctors: updatedDoctorsList,
    consultationsCount: consultations.length
  };

  io.emit("queueUpdated", {
    patients,
    doctors: updatedDoctorsList,
    analytics
  });

  io.emit("analyticsUpdated", analytics);
}

function broadcastFairnessLogs() {
  if (!io) return;
  io.emit("fairnessLogUpdated", fairnessLogs);
}

// Alert trigger check for "Virtual Queue" 3-tokens-ahead notification
function checkVirtualQueueAlerts(docId: string) {
  if (!io) return;
  const sortedQueue = getSortedActiveQueueForDoctor(docId);
  
  // For each patient waiting, check how many tokens are ahead
  sortedQueue.forEach((pat, index) => {
    const activeInProgress = patients.filter(p => p.doctorId === docId && p.status === "in-progress").length;
    const tokensAhead = index + activeInProgress;

    // Trigger simulation notification when exact 3 tokens are ahead
    if (tokensAhead <= 3 && tokensAhead > 0) {
      io.emit("virtualQueueAlert", {
        patientId: pat.id,
        phone: pat.phone,
        name: pat.name,
        tokensAhead,
        msg: `Hey ${pat.name}, you are just ${tokensAhead} token(s) away from your appointment with Dr. ${doctors.find(d => d.id === docId)?.name}. Please proceed to the waiting area or clinic now!`
      });
    }
  });
}

// Setup full startServer wrapper
async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);

  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // Initialize and load persistent entries on server startup
  console.log("Initializing database connection...");
  try {
    await connectDatabase();
    const loadedPatients = await getPatients(patients);
    const loadedConsultations = await getConsultations(consultations);
    const loadedFairnessLogs = await getFairnessLogs(fairnessLogs);

    patients = loadedPatients;
    consultations = loadedConsultations;
    fairnessLogs = loadedFairnessLogs;

    if (patients.length > 0) {
      const maxToken = Math.max(...patients.map(p => p.tokenNumber), 100);
      currentTokenSuffix = maxToken;
    }
    console.log(`Database sync complete: ${patients.length} patients, ${consultations.length} consultations, ${fairnessLogs.length} logs ready.`);
  } catch (err) {
    console.error("Database connection or priming failed on startup. Utilizing in-memory state fallback.", err);
  }

  // API Endpoints
  app.get("/api/doctors", (req, res) => {
    const updatedDoctorsList = doctors.map(d => {
      const sortedWaiting = getSortedActiveQueueForDoctor(d.id);
      const activeConsulting = patients.find(p => p.doctorId === d.id && p.status === "in-progress");
      const stats = getQueueStats(d.id);
      return {
        ...d,
        waitingCount: stats.waitingCount,
        completedCount: stats.completedCount,
        inProgressActive: activeConsulting || null,
        stats
      };
    });
    res.json(updatedDoctorsList);
  });

  app.get("/api/patients", (req, res) => {
    res.json(patients);
  });

  app.get("/api/fairness-logs", (req, res) => {
    res.json(fairnessLogs);
  });

  app.post("/api/seed", async (req, res) => {
    // Reseed patients
    try {
      await clearAllCollections();
    } catch (err) {
      console.error("Failed to clear collections on seed request:", err);
    }

    patients = [
      { id: "pat_1", name: "Karthik Raja", age: 45, phone: "9876543210", tokenNumber: 101, priority: "normal", doctorId: "doc_3", status: "completed", createdAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3000000).toISOString() },
      { id: "pat_2", name: "Mallika S.", age: 68, phone: "9812345678", tokenNumber: 102, priority: "senior", doctorId: "doc_3", status: "completed", createdAt: new Date(Date.now() - 3000000).toISOString(), completedAt: new Date(Date.now() - 2400000).toISOString() },
      { id: "pat_3", name: "Anjali Devi", age: 28, phone: "9765432109", tokenNumber: 103, priority: "pregnant", doctorId: "doc_3", status: "in-progress", createdAt: new Date(Date.now() - 2400000).toISOString(), calledAt: new Date(Date.now() - 300000).toISOString() },
      { id: "pat_4", name: "Ramesh Chandran", age: 72, phone: "9654321098", tokenNumber: 104, priority: "senior", doctorId: "doc_3", status: "waiting", createdAt: new Date(Date.now() - 1800000).toISOString() },
      { id: "pat_5", name: "Sarika Murugan", age: 34, phone: "9543210987", tokenNumber: 105, priority: "normal", doctorId: "doc_3", status: "waiting", createdAt: new Date(Date.now() - 1500000).toISOString() },
      { id: "pat_6", name: "Suresh Pillai", age: 52, phone: "9432109876", tokenNumber: 106, priority: "emergency", doctorId: "doc_3", status: "waiting", createdAt: new Date(Date.now() - 600000).toISOString() },
      { id: "pat_7", name: "Thilak M.", age: 22, phone: "9123456711", tokenNumber: 107, priority: "normal", doctorId: "doc_3", status: "waiting", createdAt: new Date(Date.now() - 300000).toISOString() },
      { id: "pat_8", name: "Lakshmi Narayanan", age: 80, phone: "9234567891", tokenNumber: 108, priority: "senior", doctorId: "doc_1", status: "waiting", createdAt: new Date(Date.now() - 200000).toISOString() },
      { id: "pat_9", name: "Meenakshi Sundaram", age: 29, phone: "9876543221", tokenNumber: 109, priority: "pregnant", doctorId: "doc_2", status: "waiting", createdAt: new Date(Date.now() - 150000).toISOString() },
      { id: "pat_10", name: "Siddharth Verma", age: 10, phone: "9988776655", tokenNumber: 110, priority: "normal", doctorId: "doc_2", status: "waiting", createdAt: new Date(Date.now() - 100000).toISOString() }
    ];

    currentTokenSuffix = 110;

    consultations = [
      { id: "con_1", patientId: "pat_1", doctorId: "doc_3", startTime: new Date(Date.now() - 3600000).toISOString(), endTime: new Date(Date.now() - 3000000).toISOString(), duration: 10 },
      { id: "con_2", patientId: "pat_2", doctorId: "doc_3", startTime: new Date(Date.now() - 3000000).toISOString(), endTime: new Date(Date.now() - 2400000).toISOString(), duration: 10 },
      { id: "con_3", patientId: "pat_3", doctorId: "doc_3", startTime: new Date(Date.now() - 2400000).toISOString() }
    ];

    fairnessLogs = [
      {
        id: "log_1",
        tokenNumber: 104,
        action: "skip",
        reasonEn: "Patient did not respond to three consecutive loudspeaker announcements",
        reasonTa: "மூன்று முறை ஒலிபெருக்கியில் அழைத்தும் நோயாளி வரவில்லை",
        timestamp: new Date(Date.now() - 1700000).toISOString()
      },
      {
        id: "log_2",
        tokenNumber: 102,
        action: "recall",
        reasonEn: "Emergency patient bypass check requested by pediatrician for priority care",
        reasonTa: "குழந்தை நல மருத்துவரால் முன்னுரிமை சிகிச்சைக்காக அவசர நோயாளி அனுமதி கோரப்பட்டது",
        timestamp: new Date(Date.now() - 1200000).toISOString()
      },
      {
        id: "log_3",
        tokenNumber: 105,
        action: "skip",
        reasonEn: "Patient stepped out to pharmacy, temporarily skipped until return",
        reasonTa: "நோயாளி மருந்தகம் சென்றதால், தற்காலிகமாக தவிர்க்கப்பட்டார்",
        timestamp: new Date(Date.now() - 600000).toISOString()
      }
    ];

    // Persist seeded arrays to DB
    try {
      for (const p of patients) await savePatient(p);
      for (const c of consultations) await saveConsultation(c);
      for (const f of fairnessLogs) await saveFairnessLog(f);
    } catch (err) {
      console.error("Failed to seed items to database:", err);
    }

    broadcastQueueState();
    broadcastFairnessLogs();

    res.json({ status: "ok", message: "Demo data successfully re-seeded." });
  });

  // Fetch unique health tips based on Doctor ID
  app.get("/api/health-tips/:doctorId", (req, res) => {
    const { doctorId } = req.params;
    const doc = doctors.find(d => d.id === doctorId);
    if (!doc) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    const tips = healthTipsBank[doc.specialization] || healthTipsBank["General Physician"];
    res.json({ doctorName: doc.name, specialization: doc.specialization, tips });
  });

  // Get single patient and real computed wait status for QR page
  app.get("/api/patients/:id", (req, res) => {
    const pat = patients.find(p => p.id === req.params.id);
    if (!pat) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const doc = doctors.find(d => d.id === pat.doctorId);
    const sortedList = getSortedActiveQueueForDoctor(pat.doctorId);
    const queuePosition = sortedList.findIndex(p => p.id === pat.id);

    const activeConsulting = patients.find(p => p.doctorId === pat.doctorId && p.status === "in-progress");
    const activeConsultingCount = activeConsulting ? 1 : 0;
    const tokensAhead = queuePosition >= 0 ? queuePosition + activeConsultingCount : 0;
    const estimatedWait = estimateWaitTimeForPatient(pat.id);

    res.json({
      patient: pat,
      doctor: doc,
      position: queuePosition >= 0 ? queuePosition + 1 : 0,
      tokensAhead,
      estimatedWait,
      tips: doc ? (healthTipsBank[doc.specialization] || healthTipsBank["General Physician"]) : healthTipsBank["General Physician"]
    });
  });

  // Register New Patient Form
  app.post("/api/patients", async (req, res) => {
    const { name, age, phone, priority, doctorId } = req.body;

    if (!name || !age || !phone || !priority || !doctorId) {
      return res.status(400).json({ error: "All patient fields are required" });
    }

    const cleanedPhone = phone.toString().replace(/\D/g, "");
    if (cleanedPhone.length !== 10) {
      return res.status(400).json({ error: "Mobile Phone number must be exactly 10 digits" });
    }

    const doc = doctors.find(d => d.id === doctorId);
    if (!doc) return res.status(400).json({ error: "Invalid doctor selected" });

    currentTokenSuffix += 1;
    const newPatient: Patient = {
      id: `pat_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      name,
      age: parseInt(age),
      phone,
      tokenNumber: currentTokenSuffix,
      priority: priority as PriorityLevel,
      doctorId,
      status: "waiting",
      createdAt: new Date().toISOString()
    };

    patients.push(newPatient);
    try {
      await savePatient(newPatient);
    } catch (err) {
      console.error("Database write error for new patient:", err);
    }

    broadcastQueueState(doctorId);
    checkVirtualQueueAlerts(doctorId);

    // Send patientAdded real-time notification
    io.emit("patientAdded", {
      patient: newPatient,
      doctorName: doc.name,
      estimatedWait: estimateWaitTimeForPatient(newPatient.id)
    });

    res.status(201).json(newPatient);
  });

  // Edit / Update Patients Details
  app.put("/api/patients/:id", async (req, res) => {
    const { name, age, phone, priority, doctorId, status } = req.body;
    const patIdx = patients.findIndex(p => p.id === req.params.id);

    if (patIdx === -1) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (phone !== undefined) {
      const cleanedPhone = phone.toString().replace(/\D/g, "");
      if (cleanedPhone.length !== 10) {
        return res.status(400).json({ error: "Mobile Phone number must be exactly 10 digits" });
      }
    }

    const previousDocId = patients[patIdx].doctorId;

    patients[patIdx] = {
      ...patients[patIdx],
      name: name ?? patients[patIdx].name,
      age: age ? parseInt(age) : patients[patIdx].age,
      phone: phone ?? patients[patIdx].phone,
      priority: (priority as PriorityLevel) ?? patients[patIdx].priority,
      doctorId: doctorId ?? patients[patIdx].doctorId,
      status: (status as PatientStatus) ?? patients[patIdx].status
    };

    const updatedPatient = patients[patIdx];
    try {
      await savePatient(updatedPatient);
    } catch (err) {
      console.error("Database update error for patient:", err);
    }

    broadcastQueueState(updatedPatient.doctorId);
    if (previousDocId !== updatedPatient.doctorId) {
      broadcastQueueState(previousDocId);
    }

    res.json(updatedPatient);
  });

  // Delete Patient Route
  app.delete("/api/patients/:id", async (req, res) => {
    const patIdx = patients.findIndex(p => p.id === req.params.id);
    if (patIdx === -1) {
      return res.status(404).json({ error: "Patient not found" });
    }
    const targetPatientId = patients[patIdx].id;
    const docId = patients[patIdx].doctorId;
    patients.splice(patIdx, 1);

    try {
      await deletePatient(targetPatientId);
    } catch (err) {
      console.error("Database delete error for patient:", err);
    }

    broadcastQueueState(docId);
    res.json({ message: "Patient deleted from system successfully." });
  });

  // THE ATOMIC SERVER-SIDE CALL NEXT OPERATION
  // Combines atomic locking, active consulting updates, and event announcement broadcasts
  app.post("/api/doctors/:docId/call-next", async (req, res) => {
    const { docId } = req.params;

    // Gracefully check and set our ServerLock to avoid receptionist race conditions
    if (activeLocks[docId]) {
      return res.status(409).json({ error: "Another calling transaction is active for this room. please try again." });
    }

    // Set lock
    activeLocks[docId] = true;

    try {
      const doc = doctors.find(d => d.id === docId);
      if (!doc) {
        activeLocks[docId] = false;
        return res.status(404).json({ error: "Doctor not found" });
      }

      // First check if there is an in-progress patient for this doctor. If so, they must be marked completed/skipped first!
      const currentActive = patients.find(p => p.doctorId === docId && p.status === "in-progress");
      if (currentActive) {
        activeLocks[docId] = false;
        return res.status(400).json({ error: `Please complete or skip the current active consultation with ${currentActive.name} first!` });
      }

      // Fetch the fair sorted active waiting queue
      const sortedQueue = getSortedActiveQueueForDoctor(docId);
      if (sortedQueue.length === 0) {
        activeLocks[docId] = false;
        return res.json({ message: "No patients currently waiting in queue for this doctor.", patient: null });
      }

      // Atomically shift and call next patient
      const nextPat = sortedQueue[0];
      const patientInStore = patients.find(p => p.id === nextPat.id);

      if (patientInStore) {
        patientInStore.status = "in-progress";
        patientInStore.calledAt = new Date().toISOString();

        // Create active consultation record
        const newConsult: Consultation = {
          id: `con_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
          patientId: patientInStore.id,
          doctorId: docId,
          startTime: new Date().toISOString()
        };
        consultations.push(newConsult);

        try {
          await savePatient(patientInStore);
          await saveConsultation(newConsult);
        } catch (err) {
          console.error("Failed to persist call-next action:", err);
        }

        broadcastQueueState(docId);
        checkVirtualQueueAlerts(docId);

        // Broadcast Audio Speech announcement tokenCalled trigger
        io.emit("tokenCalled", {
          patient: patientInStore,
          roomNumber: doc.roomNumber,
          doctorName: doc.name,
          tokenNumber: patientInStore.tokenNumber,
          msgEn: `Token number ${patientInStore.tokenNumber}, ${patientInStore.name}. Please proceed to ${doc.roomNumber}, Dr. ${doc.name}.`,
          msgTa: `அடையாள எண் ${patientInStore.tokenNumber}, ${patientInStore.name}. தயவுசெய்து ${doc.roomNumber}, டாக்டர் ${doc.name} அறைக்குச் செல்லவும்.`
        });
        
        activeLocks[docId] = false;
        return res.json({ message: `Successfully called patient ${patientInStore.name}`, patient: patientInStore });
      }

      activeLocks[docId] = false;
      return res.status(500).json({ error: "State error retrieval on token sequence" });

    } catch (e) {
      activeLocks[docId] = false;
      return res.status(500).json({ error: "Server-side atomic transaction failed inside memory layer." });
    }
  });

  // Skip Patient action
  app.post("/api/patients/:id/skip", async (req, res) => {
    const pat = patients.find(p => p.id === req.params.id);
    if (!pat) return res.status(404).json({ error: "Patient not found" });

    const { reasonEn, reasonTa } = req.body;
    const finalReasonEn = reasonEn || "Patient was not in lobby during call sequence.";
    const finalReasonTa = reasonTa || "அழைப்பின் போது நோயாளி காத்திருப்பு அறையில் இல்லை.";

    pat.status = "skipped";

    const logEntry: FairnessLogEntry = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      tokenNumber: pat.tokenNumber,
      action: "skip",
      reasonEn: finalReasonEn,
      reasonTa: finalReasonTa,
      timestamp: new Date().toISOString()
    };
    fairnessLogs.unshift(logEntry);

    try {
      await savePatient(pat);
      await saveFairnessLog(logEntry);
    } catch (err) {
      console.error("Database save failed inside skip action:", err);
    }

    broadcastQueueState(pat.doctorId);
    broadcastFairnessLogs();

    io.emit("tokenSkipped", { 
      patientId: pat.id, 
      name: pat.name, 
      tokenNumber: pat.tokenNumber,
      reasonEn: finalReasonEn,
      reasonTa: finalReasonTa
    });
    res.json(pat);
  });

  // Fast Re-call Announcement action without changing queue status
  app.post("/api/patients/:id/recall", async (req, res) => {
    const pat = patients.find(p => p.id === req.params.id);
    if (!pat || pat.status !== "in-progress") {
      return res.status(400).json({ error: "Recall can only be triggered for in-progress active patients." });
    }

    const { reasonEn, reasonTa } = req.body;
    const finalReasonEn = reasonEn || "Active examination recall requested by attending doctor.";
    const finalReasonTa = reasonTa || "சிகிச்சை அளிக்கும் மருத்துவரால் அவசர அழைப்பு விடுக்கப்பட்டது.";

    const logEntry: FairnessLogEntry = {
      id: "log_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      tokenNumber: pat.tokenNumber,
      action: "recall",
      reasonEn: finalReasonEn,
      reasonTa: finalReasonTa,
      timestamp: new Date().toISOString()
    };
    fairnessLogs.unshift(logEntry);

    try {
      await saveFairnessLog(logEntry);
    } catch (err) {
      console.error("Database save failed inside recall action:", err);
    }

    const doc = doctors.find(d => d.id === pat.doctorId);
    if (doc) {
      io.emit("tokenRecalled", {
        patient: pat,
        roomNumber: doc.roomNumber,
        doctorName: doc.name,
        tokenNumber: pat.tokenNumber,
        reasonEn: finalReasonEn,
        reasonTa: finalReasonTa,
        msgEn: `Re-calling Token number ${pat.tokenNumber}, ${pat.name}. Please proceed to ${doc.roomNumber}, Dr. ${doc.name} immediately.`,
        msgTa: `மீண்டும் அழைக்கிறோம்: அடையாள எண் ${pat.tokenNumber}, ${pat.name}. உடனடியாக ${doc.roomNumber}, டாக்டர் ${doc.name} அறைக்கு வரவும்.`
      });
    }

    broadcastFairnessLogs();
    res.json({ status: "ok", message: "Recall notification successfully broadcasted." });
  });

  // Move back to tail of queue
  app.post("/api/patients/:id/move-to-end", async (req, res) => {
    const pat = patients.find(p => p.id === req.params.id);
    if (!pat) return res.status(404).json({ error: "Patient not found" });

    pat.status = "waiting";
    pat.createdAt = new Date().toISOString(); // resets chronological ordering tail

    // If they were in-progress, clear consultation start
    const runningConsultIdx = consultations.findIndex(c => c.patientId === pat.id && !c.endTime);
    if (runningConsultIdx !== -1) {
      const runningId = consultations[runningConsultIdx].id;
      consultations.splice(runningConsultIdx, 1);
      try {
        await deleteConsultation(runningId);
      } catch (err) {
        console.error("Database delete failed inside move-to-end action:", err);
      }
    }

    try {
      await savePatient(pat);
    } catch (err) {
      console.error("Database save failed inside move-to-end action:", err);
    }

    broadcastQueueState(pat.doctorId);
    res.json(pat);
  });

  // Mark Completed consultation (Recalculates actual waiting average smart predictions)
  app.post("/api/patients/:id/complete", async (req, res) => {
    const pat = patients.find(p => p.id === req.params.id);
    if (!pat) return res.status(404).json({ error: "Patient not found" });

    const previousStatus = pat.status;
    pat.status = "completed";
    pat.completedAt = new Date().toISOString();

    // Close the consultation
    const activeConsult = consultations.find(c => c.patientId === pat.id && !c.endTime);
    if (activeConsult) {
      activeConsult.endTime = new Date().toISOString();
      const startMs = new Date(activeConsult.startTime).getTime();
      const endMs = new Date(activeConsult.endTime).getTime();
      const durationMin = Math.round((endMs - startMs) / 60000);
      activeConsult.duration = Math.max(1, durationMin); // min 1 min

      updateDoctorAverageTime(pat.doctorId);

      try {
        await saveConsultation(activeConsult);
      } catch (err) {
        console.error("Database save failed inside complete consultation action:", err);
      }
    }

    try {
      await savePatient(pat);
    } catch (err) {
      console.error("Database save failed inside complete action:", err);
    }

    broadcastQueueState(pat.doctorId);
    io.emit("consultationCompleted", { patientId: pat.id, doctorId: pat.doctorId });

    res.json(pat);
  });

  // Direct PDF Download Routes
  app.get("/Project_Process_Guide.pdf", (req, res) => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Project_Process_Guide.pdf");
    res.sendFile(path.join(process.cwd(), "Project_Process_Guide.pdf"));
  });

  app.get("/Smart_Clinic_Case_Study.pdf", (req, res) => {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Smart_Clinic_Case_Study.pdf");
    res.sendFile(path.join(process.cwd(), "Smart_Clinic_Case_Study.pdf"));
  });

  // Full Initial queue telemetry payload on handshakes
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Immediately send current live database state to the socket
    const initialDoctors = doctors.map(d => {
      const activeConsulting = patients.find(p => p.doctorId === d.id && p.status === "in-progress");
      const stats = getQueueStats(d.id);
      return {
        ...d,
        waitingCount: stats.waitingCount,
        completedCount: stats.completedCount,
        inProgressActive: activeConsulting || null,
        stats
      };
    });

    const totalWaiting = patients.filter(p => p.status === "waiting").length;
    const totalCompleted = patients.filter(p => p.status === "completed").length;
    const totalCalling = patients.filter(p => p.status === "in-progress").length;

    socket.emit("initialState", {
      patients,
      doctors: initialDoctors,
      fairnessLogs,
      analytics: {
        totalWaiting,
        totalCompleted,
        totalCalling,
        doctors: initialDoctors,
        consultationsCount: consultations.length
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  // Vite express client builder
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`QueueCure Pro server listening on port ${PORT}`);
  });
}

startServer();
