import React, { useState } from "react";
import { Patient, Doctor, PriorityLevel, PatientStatus } from "../types";
import { X, Trash2, Save, Sparkles, UserCheck } from "lucide-react";

interface PatientDetailsModalProps {
  patient: Patient;
  doctors: Doctor[];
  onClose: () => void;
  onUpdate: (updated: Patient) => void;
  onDelete: (id: string) => void;
}

export default function PatientDetailsModal({ patient, doctors, onClose, onUpdate, onDelete }: PatientDetailsModalProps) {
  const [name, setName] = useState(patient.name);
  const [age, setAge] = useState(patient.age.toString());
  const [phone, setPhone] = useState(patient.phone);
  const [priority, setPriority] = useState<PriorityLevel>(patient.priority);
  const [doctorId, setDoctorId] = useState(patient.doctorId);
  const [status, setStatus] = useState<PatientStatus>(patient.status);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !phone || !doctorId) {
      setError("Please fill out all required fields.");
      return;
    }

    const cleanedPhone = phone.trim().replace(/\D/g, "");
    if (cleanedPhone.length !== 10) {
      setError("Mobile Phone number must be exactly 10 digits.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, phone, priority, doctorId, status }),
      });

      if (!res.ok) {
        throw new Error("Unable to save patient changes.");
      }

      const updated = await res.json();
      onUpdate(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed saving changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${patient.name} from the current queue?`)) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Failed to delete patient profile");
      }

      onDelete(patient.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Deletion error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-stone-200/60 overflow-hidden">
        
        {/* Header bar */}
        <div className="bg-[#6B705C] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#E9EDC9]" />
            <h2 className="text-sm font-bold tracking-wide uppercase">Edit Patient Record</h2>
          </div>
          <button
            onClick={onClose}
            className="text-stone-200 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-650 font-medium text-xs rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-700">Patient Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm px-4 py-2 bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#6B705C]/20 focus:border-[#6B705C] rounded-xl transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Age */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">Age</label>
              <input
                type="number"
                required
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full text-sm px-4 py-2 bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#6B705C]/20 focus:border-[#6B705C] rounded-xl transition-all"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">Phone</label>
              <input
                type="tel"
                required
                maxLength={10}
                pattern="[0-9]{10}"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) {
                    setPhone(val);
                  }
                }}
                className="w-full text-sm px-4 py-2 bg-stone-50 border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#6B705C]/20 focus:border-[#6B705C] rounded-xl transition-all"
              />
            </div>
          </div>

          {/* Assigned Doctor */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-stone-700">Assigned Consultant</label>
            <select
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full text-sm px-4 py-2 bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#6B705C]/20 focus:border-[#6B705C] rounded-xl transition-all"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.specialization}) - {d.roomNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority Level */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">Priority Tier</label>
              <select
                required
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full text-sm px-4 py-2 bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#6B705C]/20 focus:border-[#6B705C] rounded-xl transition-all"
              >
                <option value="normal">Normal</option>
                <option value="senior">Senior (60+)</option>
                <option value="pregnant">Pregnant</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            {/* Patient Status */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">Queue Stage</label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as PatientStatus)}
                className="w-full text-sm px-4 py-2 bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#6B705C]/20 focus:border-[#6B705C] rounded-xl transition-all"
              >
                <option value="waiting">Waiting</option>
                <option value="in-progress">In Consultation</option>
                <option value="completed">Completed</option>
                <option value="skipped">Skipped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100 gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleDelete}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-[#E07A5F] font-semibold rounded-xl text-xs transition-colors border border-orange-200"
            >
              <Trash2 className="w-4 h-4" />
              Remove Patient
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-stone-205 text-stone-600 font-semibold text-xs rounded-xl hover:bg-stone-50 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#6B705C] hover:bg-[#555949] text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
