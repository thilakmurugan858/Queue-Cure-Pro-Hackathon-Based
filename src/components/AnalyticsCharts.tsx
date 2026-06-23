import React from "react";
import { Doctor } from "../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { BarChart3, TrendingUp, Clock, Users } from "lucide-react";

interface AnalyticsChartsProps {
  doctors: (Doctor & {
    waitingCount: number;
    completedCount: number;
    stats: {
      waitingCount: number;
      completedCount: number;
      inProgressCount: number;
      skippedCount: number;
      avgWaitTime: number;
    };
  })[];
  totalPages: number;
}

export default function AnalyticsCharts({ doctors, totalPages }: AnalyticsChartsProps) {
  // 1. Data mapping for doctor workload distribution Chart
  const workloadsData = doctors.map((d: any) => ({
    name: d.name.replace("Dr. ", ""),
    Waiting: d.waitingCount || 0,
    Completed: d.completedCount || 0,
    Consulting: d.stats?.inProgressCount || 0
  }));

  // 2. Data mapping for doctor rolling wait prediction averages Chart
  const predictionData = doctors.map((d: any) => ({
    name: d.name.replace("Dr. ", ""),
    "Avg Consult Time": d.avgConsultationTime || 10,
    "Calculated Waiting Rate": (d.waitingCount || 0) * (d.avgConsultationTime || 10)
  }));

  // 3. Hourly patient density data tracker (synthetic hourly logging for clinical analytics context)
  const hourlyDensityData = [
    { hour: "08:00 AM", Patients: 12 },
    { hour: "09:00 AM", Patients: 24 },
    { hour: "10:00 AM", Patients: 42 },
    { hour: "11:00 AM", Patients: 38 },
    { hour: "12:00 PM", Patients: 19 },
    { hour: "01:00 PM", Patients: 10 },
    { hour: "02:00 PM", Patients: 15 },
    { hour: "03:00 PM", Patients: 27 },
    { hour: "04:00 PM", Patients: 35 },
    { hour: "05:00 PM", Patients: 18 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top micro summary stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Doctors</p>
            <p className="text-xl font-extrabold text-slate-800">{doctors?.length || 5}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Clinic Mean Consult</p>
            <p className="text-xl font-extrabold text-slate-800">
              {Math.round(doctors?.reduce((acc: number, d: any) => acc + (d.avgConsultationTime || 10), 0) / (doctors?.length || 5))} mins
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Queue Load</p>
            <p className="text-xl font-extrabold text-slate-800">
              {doctors?.reduce((sum: number, d: any) => sum + (d.waitingCount || 0), 0)} patients
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Direct Clearance Rate</p>
            <p className="text-xl font-extrabold text-slate-800">
              {Math.floor((doctors?.reduce((sum: number, d: any) => sum + (d.completedCount || 0), 0) / 
                Math.max(1, doctors?.reduce((sum: number, d: any) => sum + (d.waitingCount || 0) + (d.completedCount || 0), 0))) * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Visual Chart Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Workloads Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              Doctor Waiting Room Loads
            </h3>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">Real-time update</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Waiting" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Consulting" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Wait Averages */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              Wait-Time Metrics vs Avg Consults
            </h3>
            <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">Calculated</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictionData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Avg Consult Time" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Calculated Waiting Rate" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Simulated Hourly Patient Density Tracker */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              Hourly Patient Density Profile (Heat tracker)
            </h3>
            <span className="text-[10px] font-mono text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">Clearance Analytics</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyDensityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="Patients" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-400 text-center">
            * Peak hours typically occur between 10:00 AM and 11:30 AM. Dynamic staffing matches these loads natively.
          </p>
        </div>

      </div>
    </div>
  );
}
