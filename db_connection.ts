import mongoose, { Schema } from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Patient, Consultation, FairnessLogEntry } from "./src/types";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DATA_DIR = path.join(process.cwd(), "data");
const LOCAL_DB_PATH = path.join(DATA_DIR, "db.json");

let isMongoConnected = false;

// 1. Definition of Mongoose Schemas (equivalent to MongoDB Collections)
const PatientSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  phone: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  priority: { type: String, required: true },
  doctorId: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: String, required: true },
  calledAt: { type: String },
  completedAt: { type: String }
}, { timestamps: false, collection: "patients" });

const ConsultationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String },
  duration: { type: Number }
}, { timestamps: false, collection: "consultations" });

const FairnessLogSchema = new Schema({
  id: { type: String, required: true, unique: true },
  tokenNumber: { type: Number, required: true },
  action: { type: String, required: true },
  reasonEn: { type: String, required: true },
  reasonTa: { type: String, required: true },
  timestamp: { type: String, required: true }
}, { timestamps: false, collection: "fairness_logs" });

export const MongoPatient = (mongoose.models.Patient || mongoose.model("Patient", PatientSchema)) as any;
export const MongoConsultation = (mongoose.models.Consultation || mongoose.model("Consultation", ConsultationSchema)) as any;
export const MongoFairnessLog = (mongoose.models.FairnessLog || mongoose.model("FairnessLog", FairnessLogSchema)) as any;

// 2. Initialize directories for dynamic local Workspace storage fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 3. Fallback functions for local JSON file-system database
interface LocalStore {
  patients: Patient[];
  consultations: Consultation[];
  fairnessLogs: FairnessLogEntry[];
}

function readLocalDB(): LocalStore {
  try {
    if (fs.existsSync(LOCAL_DB_PATH)) {
      const text = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
      return JSON.parse(text);
    }
  } catch (err) {
    console.error("Failed to read local JSON database, starting clean:", err);
  }
  return { patients: [], consultations: [], fairnessLogs: [] };
}

function writeLocalDB(store: LocalStore) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to local JSON database:", err);
  }
}

// 4. Central Connection Manager
export async function connectDatabase() {
  if (isMongoConnected) return true;

  if (MONGODB_URI) {
    console.log("MongoDB connection URL discovered. Attempting Mongoose connection...");
    try {
      await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      isMongoConnected = true;
      console.log("🟢 SUCCESS: Connected to MongoDB Database.");
      return true;
    } catch (err) {
      console.error("🔴 Connection to MongoDB failed. Falling back to persistent Workspace storage.", err);
      isMongoConnected = false;
    }
  } else {
    console.log("ℹ️ No MONGODB_URI defined in environment. Using workspace-level persistent JSON storage.");
    isMongoConnected = false;
  }
  return false;
}

// Check real-time connection state
export function isConnected(): boolean {
  return isMongoConnected;
}

// 5. Query and Save operations supporting both Mongo and Local Filesytem Fallbacks
export async function getPatients(seedPatients: Patient[] = []): Promise<Patient[]> {
  await connectDatabase();
  
  if (isMongoConnected) {
    try {
      const documents = await MongoPatient.find({});
      if (documents.length === 0 && seedPatients.length > 0) {
        console.log("Seeding MongoDB with default patient list...");
        await MongoPatient.insertMany(seedPatients);
        return seedPatients;
      }
      return documents.map(doc => doc.toObject() as Patient);
    } catch (err) {
      console.error("Failed to query patients from MongoDB:", err);
    }
  }

  // Local persistent fallback
  const store = readLocalDB();
  if (store.patients.length === 0 && seedPatients.length > 0) {
    store.patients = seedPatients;
    writeLocalDB(store);
  }
  return store.patients;
}

export async function getConsultations(seedConsultations: Consultation[] = []): Promise<Consultation[]> {
  await connectDatabase();

  if (isMongoConnected) {
    try {
      const documents = await MongoConsultation.find({});
      if (documents.length === 0 && seedConsultations.length > 0) {
        console.log("Seeding MongoDB with default consultations list...");
        await MongoConsultation.insertMany(seedConsultations);
        return seedConsultations;
      }
      return documents.map(doc => doc.toObject() as Consultation);
    } catch (err) {
      console.error("Failed to query consultations from MongoDB:", err);
    }
  }

  const store = readLocalDB();
  if (store.consultations.length === 0 && seedConsultations.length > 0) {
    store.consultations = seedConsultations;
    writeLocalDB(store);
  }
  return store.consultations;
}

export async function getFairnessLogs(seedLogs: FairnessLogEntry[] = []): Promise<FairnessLogEntry[]> {
  await connectDatabase();

  if (isMongoConnected) {
    try {
      const documents = await MongoFairnessLog.find({});
      if (documents.length === 0 && seedLogs.length > 0) {
        console.log("Seeding MongoDB with default fairness logs...");
        await MongoFairnessLog.insertMany(seedLogs);
        return seedLogs;
      }
      return documents.map(doc => doc.toObject() as FairnessLogEntry);
    } catch (err) {
      console.error("Failed to query fairness logs from MongoDB:", err);
    }
  }

  const store = readLocalDB();
  if (store.fairnessLogs.length === 0 && seedLogs.length > 0) {
    store.fairnessLogs = seedLogs;
    writeLocalDB(store);
  }
  return store.fairnessLogs;
}

// Singular and Batch Mutations
export async function savePatient(patient: Patient): Promise<void> {
  await connectDatabase();

  if (isMongoConnected) {
    try {
      await MongoPatient.findOneAndUpdate(
        { id: patient.id },
        patient,
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("MongoDB failed to write patient:", err);
    }
  }

  const store = readLocalDB();
  const idx = store.patients.findIndex(p => p.id === patient.id);
  if (idx !== -1) {
    store.patients[idx] = patient;
  } else {
    store.patients.push(patient);
  }
  writeLocalDB(store);
}

export async function deletePatient(id: string): Promise<void> {
  await connectDatabase();

  if (isMongoConnected) {
    try {
      await MongoPatient.deleteOne({ id });
    } catch (err) {
      console.error("MongoDB failed to delete patient:", err);
    }
  }

  const store = readLocalDB();
  store.patients = store.patients.filter(p => p.id !== id);
  writeLocalDB(store);
}

export async function saveConsultation(consultation: Consultation): Promise<void> {
  await connectDatabase();

  if (isMongoConnected) {
    try {
      await MongoConsultation.findOneAndUpdate(
        { id: consultation.id },
        consultation,
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("MongoDB failed to write consultation:", err);
    }
  }

  const store = readLocalDB();
  const idx = store.consultations.findIndex(c => c.id === consultation.id);
  if (idx !== -1) {
    store.consultations[idx] = consultation;
  } else {
    store.consultations.push(consultation);
  }
  writeLocalDB(store);
}

export async function deleteConsultation(id: string): Promise<void> {
  await connectDatabase();

  if (isMongoConnected) {
    try {
      await MongoConsultation.deleteOne({ id });
    } catch (err) {
      console.error("MongoDB failed to delete consultation:", err);
    }
  }

  const store = readLocalDB();
  store.consultations = store.consultations.filter(c => c.id !== id);
  writeLocalDB(store);
}

export async function saveFairnessLog(log: FairnessLogEntry): Promise<void> {
  await connectDatabase();

  if (isMongoConnected) {
    try {
      await MongoFairnessLog.findOneAndUpdate(
        { id: log.id },
        log,
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error("MongoDB failed to write fairness log:", err);
    }
  }

  const store = readLocalDB();
  const idx = store.fairnessLogs.findIndex(l => l.id === log.id);
  if (idx !== -1) {
    store.fairnessLogs[idx] = log;
  } else {
    store.fairnessLogs.push(log);
  }
  writeLocalDB(store);
}

// Utility to completely clear data/reset seeding
export async function clearAllCollections(): Promise<void> {
  await connectDatabase();

  if (isMongoConnected) {
    try {
      await MongoPatient.deleteMany({});
      await MongoConsultation.deleteMany({});
      await MongoFairnessLog.deleteMany({});
      console.log("MongoDB collections cleared.");
    } catch (err) {
      console.error("Failed to clear MongoDB collections:", err);
    }
  }

  const store = { patients: [], consultations: [], fairnessLogs: [] };
  writeLocalDB(store);
}
