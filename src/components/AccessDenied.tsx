"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";
import Link from "next/link";

interface AccessDeniedProps {
  title?: string;
  message?: string;
  backLink?: string;
  backText?: string;
}

export default function AccessDenied({
  title = "Access Denied",
  message = "You don't have the required permissions to view this resource. Please contact your administrator if you believe this is an error.",
  backLink = "/",
  backText = "Back to Dashboard"
}: AccessDeniedProps) {
  const [refId, setRefId] = useState<string | null>(null);

  useEffect(() => {
    setRefId(Math.random().toString(36).substring(2, 10).toUpperCase());
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 relative overflow-hidden">
      {/* Funky Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[20%] w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Large Outlined 403 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.03] pointer-events-none">
          <h1 className="text-[15rem] md:text-[20rem] font-black leading-none tracking-tighter text-white border-white">403</h1>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Animated Icon Container */}
        <div className="relative mb-12 flex justify-center">
            <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <div className="relative w-24 h-24 bg-slate-900 border border-rose-500/30 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-rose-500/10 to-transparent" />
                <ShieldAlert className="w-12 h-12 text-rose-500 animate-bounce-slow" />
                
                {/* Scanning line effect */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500/50 blur-[2px] animate-scan shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            </div>
            
            {/* Pulsing rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-rose-500/20 animate-ping-slow" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-rose-500/10 animate-ping-slow" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Text Content */}
        <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white uppercase italic">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                    Access
                </span>
                <span className="block text-white mt-[-10px]">
                    Restricted
                </span>
            </h2>
            
            <div className="h-1 w-20 bg-gradient-to-r from-rose-500 to-transparent mx-auto rounded-full" />
            
            <p className="text-slate-400 text-base md:text-lg font-medium max-w-md mx-auto leading-relaxed">
                {message}
            </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
                href={backLink}
                className="group relative px-8 py-4 bg-white text-black font-bold rounded-2xl overflow-hidden transition-all hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                <Home className="w-5 h-5" />
                {backText}
            </Link>
            
            <button 
                onClick={() => window.history.back()}
                className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-300 font-bold rounded-2xl border border-slate-700/50 transition-all flex items-center gap-3 w-full sm:w-auto justify-center"
            >
                <ArrowLeft className="w-5 h-5" />
                Go Back
            </button>
        </div>
        
        {/* Security bits */}
        <div className="mt-16 pt-8 border-t border-slate-800/60 flex flex-wrap items-center justify-center gap-6 opacity-40">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Lock className="w-3 h-3" /> Encrypted Session
            </div>
            <div className="hidden sm:block w-1 h-1 bg-slate-700 rounded-full" />
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Ref ID: {refId || "LOADING..."}
            </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(5%); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        @keyframes ping-slow {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
