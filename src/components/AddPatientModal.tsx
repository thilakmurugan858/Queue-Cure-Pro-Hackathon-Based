import React, { useState } from "react";
import { Doctor, PriorityLevel } from "../types";
import { X, UserPlus, FileText, CheckCircle, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface AddPatientModalProps {
  doctors: Doctor[];
  onClose: () => void;
  onSuccess: (newPatient: any) => void;
}

export default function AddPatientModal({ doctors, onClose, onSuccess }: AddPatientModalProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [priority, setPriority] = useState<PriorityLevel>("normal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Track registered patient to show quick QR Print Slip
  const [registeredPatient, setRegisteredPatient] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !phone || !doctorId) {
      setError("Please fill in all patient profile fields.");
      return;
    }

    const cleanedPhone = phone.trim().replace(/\D/g, "");
    if (cleanedPhone.length !== 10) {
      setError("Mobile Phone number must be exactly 10 digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age, phone, priority, doctorId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to register patient");
      }

      const newPat = await res.json();
      setRegisteredPatient(newPat);
      onSuccess(newPat);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadgeColor = (p: PriorityLevel) => {
    switch (p) {
      case "emergency": return "bg-[#E07A5F] text-white";
      case "pregnant": return "bg-[#6B705C] text-white";
      case "senior": return "bg-[#81B29A] text-white";
      default: return "bg-[#F2CC8F] text-stone-800";
    }
  };

  const selectedDoctorName = doctors.find(d => d.id === (registeredPatient?.doctorId || doctorId))?.name || "Clinic Doctor";
  const selectedDoctorRoom = doctors.find(d => d.id === (registeredPatient?.doctorId || doctorId))?.roomNumber || "General Room";

  // Compute live local target status link for simulated QR scan
  const patientQRUrl = registeredPatient 
    ? `${window.location.origin}/#/patient/${registeredPatient.id}`
    : "";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="add_patient_modal_content" 
        className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-stone-200/55 overflow-hidden transform transition-all"
      >
        
        {/* Banner header */}
        <div className="bg-[#6B705C] px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            <h2 className="text-lg font-bold">
              {registeredPatient ? "Patient Registered successfully!" : "Register New Patient"}
            </h2>
          </div>
          <button 
            id="close_modal_btn"
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Slip View */}
        {registeredPatient ? (
          <div className="p-6 text-center space-y-6 bg-main/35">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-[#81B29A]/20 rounded-full flex items-center justify-center text-[#6B705C] animate-scale-up">
                <CheckCircle className="w-10 h-10 text-[#81B29A]" />
              </div>
            </div>

            <div>
              <p className="text-xs font-mono text-[#6B705C] uppercase font-bold tracking-widest">REGISTRATION COMPLETE</p>
              <h3 className="text-xl font-bold text-stone-900 mt-1">{registeredPatient.name}</h3>
              <p className="text-sm text-stone-500">Age {registeredPatient.age} • Phone {registeredPatient.phone}</p>
            </div>

            {/* Simulated Printed Ticket Layout */}
            <div className="border-2 border-dashed border-stone-200 bg-white p-6 rounded-xl mx-auto max-w-xs space-y-4 text-left shadow-sm print:border-none print:shadow-none print:bg-white">
              <div className="text-center font-mono border-b border-dashed border-stone-200 pb-2">
                <p className="font-bold text-[#6B705C] tracking-wider text-sm">QUEUECURE PRO TICKET</p>
                <p className="text-[10px] text-stone-400">Date: {new Date(registeredPatient.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex justify-between items-center py-1">
                <div>
                  <p className="text-xs text-stone-400">TOKEN NUMBER</p>
                  <p className="text-3xl font-extrabold text-[#6B705C] font-mono">{registeredPatient.tokenNumber}</p>
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-lg uppercase ${getPriorityBadgeColor(registeredPatient.priority)}`}>
                  {registeredPatient.priority}
                </span>
              </div>

              <div className="space-y-1 text-xs border-t border-dashed border-stone-200 pt-3">
                <p className="text-stone-700"><strong>Consultant:</strong> {selectedDoctorName}</p>
                <p className="text-stone-700"><strong>Location:</strong> {selectedDoctorRoom}</p>
                <p className="text-[#6B705C] font-semibold"><strong>Fair-Queue Status:</strong> Registered & Waiting</p>
              </div>

              {/* Patient Live mobile status link QR Code */}
              <div className="flex flex-col items-center justify-center border-t border-dashed border-stone-200 pt-3 space-y-2">
                <QRCodeSVG value={patientQRUrl} size={110} />
                <p className="text-[9px] text-center text-stone-400 font-sans leading-tight">
                  Scan QR code to view live queue progress and specialized health advice from your phone!
                </p>
              </div>
            </div>

            {/* Command controls */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <a 
                href={`/#/patient/${registeredPatient.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#6B705C]/10 hover:bg-[#6B705C]/15 text-[#6B705C] font-semibold rounded-xl text-xs transition-all border border-[#6B705C]/10"
              >
                <Smartphone className="w-4 h-4" />
                Go to Live QR Screen
              </a>
              <button
                onClick={() => {
                  // Reset form to register another
                  setRegisteredPatient(null);
                  setName("");
                  setAge("");
                  setPhone("");
                  setDoctorId("");
                  setPriority("normal");
                }}
                className="flex-1 py-1.5 px-3 bg-[#6B705C] hover:bg-[#555949] text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Add Another Patient
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="text-xs text-stone-400 hover:text-stone-600 block mx-auto pt-2 font-medium"
            >
              Back to Registry Dashboard
            </button>
          </div>
        ) : (
          /* Input Form Layout */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 text-xs bg-orange-50 text-orange-950 rounded-xl border border-orange-200/50 font-medium">
                {error}
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">Patient Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anand Sivakumar"
                className="w-full text-sm px-4 py-2.5 bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#6B705C]/20 focus:border-[#6B705C] rounded-xl transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Age Field */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">Age</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="130"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 35"
                  className="w-full text-sm px-4 py-2.5 bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#6B705C]/20 focus:border-[#6B705C] rounded-xl transition-all"
                />
              </div>

              {/* Phone Field */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-stone-700">Mobile Phone</label>
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
                  placeholder="e.g. 9876543210"
                  className="w-full text-sm px-4 py-2.5 bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#6B705C]/20 focus:border-[#6B705C] rounded-xl transition-all"
                />
              </div>
            </div>

            {/* Doctor Selection */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-stone-700">Assign Consultant Doctor</label>
              <select
                required
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full text-sm px-4 py-2.5 bg-white border border-stone-200 focus:outline-none focus:ring-2 focus:ring-[#6B705C]/20 focus:border-[#6B705C] rounded-xl transition-all"
              >
                <option value="">-- Choose Doctor / Specialization --</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialization}) - {doc.roomNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-stone-700">Queue Priority Status Tier</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["normal", "senior", "pregnant", "emergency"] as PriorityLevel[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-semibold capitalize border transition-all ${
                      priority === p
                        ? "border-[#6B705C] bg-[#6B705C] text-white shadow-sm ring-2 ring-[#6B705C]/15"
                        : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {p === "pregnant" ? "Pregnant" : p === "emergency" ? "Emergency" : p === "senior" ? "Senior (60+)" : "Normal"}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-stone-400 leading-tight">
                * Note: Emergency patients jump instantly to the head. Senior/Pregnant patients receive an active fast-track weight, while Normal patients age dynamically in timing formulas to guard against starvation.
              </p>
            </div>

            {/* Submit Actions */}
            <div className="flex gap-2 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 border border-stone-200 text-stone-600 font-semibold rounded-xl text-sm hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-[#6B705C] hover:bg-[#555949] text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {loading ? "Registering..." : "Onboard Patient"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
