import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0e1a] text-center px-4 overflow-hidden relative">
      {/* Background Ornaments */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 glass rounded-3xl p-12 max-w-lg w-full border border-slate-700/50 shadow-2xl shadow-black/80 fade-in-up">
        <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-slate-700/50 glow-indigo group relative">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl animate-ping opacity-20" />
          <SearchX className="w-10 h-10 text-indigo-400" />
        </div>
        
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 drop-shadow-sm tracking-tight mb-2">
          404
        </h1>
        <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
        
        <p className="text-slate-400 mb-8 max-w-sm mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Return to Dashboard
        </Link>
      </div>

      <div className="absolute bottom-8 text-slate-600 text-xs font-medium tracking-widest uppercase">
        OneQA Enterprise Test Platform
      </div>
    </div>
  );
}
