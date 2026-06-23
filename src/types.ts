export type PriorityLevel = 'normal' | 'senior' | 'pregnant' | 'emergency';
export type PatientStatus = 'waiting' | 'in-progress' | 'completed' | 'skipped' | 'cancelled';

export interface Patient {
  id: string;
  name: string;
  age: number;
  phone: string;
  tokenNumber: number;
  priority: PriorityLevel;
  doctorId: string;
  status: PatientStatus;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  roomNumber: string;
  avgConsultationTime: number; // in minutes
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
}

export interface QueueStats {
  waitingCount: number;
  completedCount: number;
  inProgressCount: number;
  skippedCount: number;
  avgWaitTime: number; // across all doctors or per doctor
}

export interface LanguageTips {
  en: string[];
  ta: string[];
}

export interface FairnessLogEntry {
  id: string;
  tokenNumber: number;
  action: 'skip' | 'recall';
  reasonEn: string;
  reasonTa: string;
  timestamp: string;
}
