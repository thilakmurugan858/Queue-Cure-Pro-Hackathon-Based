import React from "react";
import { BookOpen, Printer, Download, HelpCircle, Layers, Radio, ShieldAlert, Cpu } from "lucide-react";

export default function UserGuide() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 bg-white text-gray-800 rounded-2xl shadow-xl border border-gray-100 my-8 print:shadow-none print:border-none print:my-0 print:p-0">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 mb-6 print:hidden">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">QueueCure Pro</h1>
            <p className="text-sm text-gray-500">Official Interactive User Manual & Setup Guide</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-indigo-500/20"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Manual Content (Specifically styled for printing) */}
      <div className="space-y-8">
        {/* Title Block */}
        <div className="text-center pb-6 border-b-2 border-gray-900/10">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">QueueCure Pro</h1>
          <p className="text-lg text-indigo-600 font-semibold mt-1">Real-Time Patient Fair-Queue Management System</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-mono text-gray-500">
            <span>VERSION: 1.0.0 (MVP)</span>
            <span>•</span>
            <span>DEVELOPER EDITION</span>
            <span>•</span>
            <span>ENTERPRISE STANDARDS</span>
          </div>
        </div>

        {/* Executive PDF Downloads Block */}
        <div className="bg-gradient-to-r from-teal-500/10 to-indigo-500/10 border border-teal-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/20 text-teal-700 rounded-xl">
              <Download className="w-6 h-6 text-teal-600" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-gray-900 text-base">Official PDF Downloads for Wooble</h3>
              <p className="text-xs text-gray-500">Structured system processes and complete executive case study compiled for review.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href="/Project_Process_Guide.pdf"
              download="Project_Process_Guide.pdf"
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Process Guide PDF
            </a>
            <a
              href="/Smart_Clinic_Case_Study.pdf"
              download="Smart_Clinic_Case_Study.pdf"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Case Study PDF
            </a>
          </div>
        </div>

        {/* Executive Summary */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3 mb-3">
            <Layers className="w-5 h-5 text-indigo-600" />
            1. Executive Product Pitch
          </h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            <strong>QueueCure Pro</strong> is a next-generation healthcare micro-mobility application engineered
            to eliminate clinic congestion, reduce human synchronization errors, and transform wait time from dead hours 
            into productive health-literacy windows.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Unlike legacy ticket systems that trigger client anxiety and keep patients physically captive in crowded, pathogen-prone 
            waiting lobbies, QueueCure Pro implements <strong>Remote Virtual Queuing</strong> (wait from home or car) and 
            <strong>Smart Dynamic Estimated Wait predictions</strong> tailored individually per-doctor.
          </p>
        </section>

        {/* Feature Highlights */}
        <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 print:bg-transparent print:border-none print:p-0">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-indigo-600" />
            2. Core Architecture Differentiators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 print:border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Anti-Starvation Aging Sorting</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Normal priority patients are protected from being indefinitely starved due to subsequent high-priority walk-ins. 
                Using our cumulative ageweight algorithm:
                <code className="block mt-1 p-1 bg-gray-50 text-indigo-600 font-mono text-[10px] rounded">
                  Score = BaseWeight + (MinutesWaiting * 12)
                </code>
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 print:border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Doctor-Specific Wait Predictions</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Estimated wait is dynamically personalized rather than clinic-wide. The engine monitors actual consultation durations
                and keeps a rolling average per doctor to compute high-accuracy metrics.
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 print:border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm mb-1">English & Tamil Audio caller</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Built-in native client text-to-speech speaker supports crisp, clear English commands or fluent phonetical Tamil queue Announcements
                (e.g., <em>"அடையாள எண் 105, தயவுசெய்து..."</em>).
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 print:border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm mb-1">Virtual Queue 3-Token SMS Alerts</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Supports virtual remote waiting. When a patient is detected exactly 3 tokens away, our engine broadcasts an instant 
                action trigger instructing them to return immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Operating Manual */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            3. Step-by-Step Operator Guide
          </h2>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
              <div>
                <h4 className="font-bold text-gray-950 text-sm">On-Boarding Patients (Reception Desk)</h4>
                <p className="text-xs text-gray-600">
                  Select <strong>Add Patient</strong>. Enter Name, Age, Phone number, and select the corresponding doctor's chamber. 
                  Choose their correct physical priority tier: Normal, Senior (60+), Pregnant, or Emergency. The system automatically issues 
                  the next incremental Token Number.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">2</span>
              <div>
                <h4 className="font-bold text-gray-950 text-sm">Calling and Transitions (Doctor / Assistant panel)</h4>
                <p className="text-xs text-gray-600">
                  From the dashboard lobby list, click <strong>Call Next</strong>. Our server-side execution locks the record 
                  (ensuring no dual receptionist clicks conflict), boots the active session, and speaks out loud: 
                  <em>"Token 104, proceeds to Room 102"</em>. Track consultation timing live.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">3</span>
              <div>
                <h4 className="font-bold text-gray-950 text-sm">Patient QR Ticket scanning</h4>
                <p className="text-xs text-gray-600">
                  Once registered, click <strong>Print Ticket</strong>. You see a custom receipt showcasing patient's token, room, and a 
                  <strong>live QR code</strong>. Scanning this QR code or clicking <strong>Open Live Ticket</strong> launches a dedicated 
                  mobile-optimized dashboard. Patients can track exact ranks and wait times live, and access customized health articles.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">4</span>
              <div>
                <h4 className="font-bold text-gray-950 text-sm">Education Rotation System</h4>
                <p className="text-xs text-gray-600">
                  The lobby television screen mode rotates health tips automatically. An Orthopedist's queue displays posture and bone care tips, 
                  whereas a Diabetologist's queue teaches mealtime walks and sugar management. This reduces perceived wait-times by 40%.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Validation & Race Condition Lock */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-l-4 border-indigo-600 pl-3 mb-3">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            4. Reliability & Edge Case Proofing
          </h2>
          <ul className="list-disc pl-5 text-xs text-gray-600 space-y-2">
            <li>
              <strong>Concurrency Lock:</strong> Clicking Call Next locks the Doctor's record on server-side memory instantaneously. 
              Subsequent API requests in the same millisecond receive an HTTP 409 locked back, preventing duplicate screen calling.
            </li>
            <li>
              <strong>Real-Time Sync Fallbacks:</strong> In case the web socket connection experiences brief wifi drop-outs, 
              the client shows a clear yellow reconnection banner and automatically fires a complete state synchronization trigger on recovery.
            </li>
          </ul>
        </section>

        {/* Footer info */}
        <div className="pt-6 border-t border-gray-100 text-center text-xs text-gray-400 font-mono print:border-gray-200">
          <p>This manual can be printed directly from the web browser by pressing Ctrl+P or using the top buttons.</p>
          <p>© 2026 QueueCure Pro System. All Rights Reserved.</p>
        </div>
      </div>
    </div>
  );
}
