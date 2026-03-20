"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Shield, AlertCircle, ArrowRight, User, Clock, ShieldCheck, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

function LoginRegisterForms() {
  const [isFlipped, setIsFlipped] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register State
  const [registerData, setRegisterData] = useState({ name: "", email: "", password: "" });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    const res = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
      callbackUrl,
    });

    if (res?.error) {
      setLoginError("Invalid email or password");
      setLoginLoading(false);
    } else if (res?.ok) {
      router.push(callbackUrl);
      router.refresh();
      // Keep loading as true to show 'Redirecting...' during push
    } else {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setRegisterError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(registerData),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setRegisterSuccess(true);
    } catch (err: any) {
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex bg-[#0a0e1a]">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-purple-300 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-sm">QA</div>
            <span className="text-xl font-bold text-white tracking-tight">OneAutomation</span>
          </div>
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-4xl font-bold text-white leading-tight">Enterprise Quality<br />Engineering Platform</h1>
          <p className="text-indigo-200 max-w-md text-lg">
            Centralized test execution monitoring, quality analytics, and build intelligence for your entire organization.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-indigo-300">Visibility</p>
            </div>
            <div className="w-px h-10 bg-indigo-400/30" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">Real-time</p>
              <p className="text-xs text-indigo-300">Monitoring</p>
            </div>
            <div className="w-px h-10 bg-indigo-400/30" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">Secure</p>
              <p className="text-xs text-indigo-300">API Keys</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-indigo-300 relative z-10">© 2026 OneQA Platform · Enterprise Edition</p>
      </div>

      {/* Right Panel — Forms with Flip Animation */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full lg:hidden" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full lg:hidden" />

        <div className="w-full max-w-md perspective-1000">
          <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
            {/* Login Form (Front) */}
            <div className="flip-card-front space-y-8 relative">
              <div className="lg:hidden flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">QA</div>
                <span className="text-lg font-bold text-white">OneAutomation</span>
              </div>

              <div className="text-left">
                <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                <p className="text-sm text-slate-500 mt-1">Sign in to your OneQA account</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5 text-left">
                {loginError && (
                  <div className="px-4 py-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                    {loginError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      placeholder="admin@oneqa.dev"
                      className="w-full pl-12 pr-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full pl-12 pr-12 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-[11px] font-black text-white uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loginLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {loginError ? "Signing in..." : "Redirecting..."}
                    </>
                  ) : (
                    <>
                      Enter Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest pt-4">
                New user? <button onClick={() => setIsFlipped(true)} className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-4 decoration-2">Register for Access</button>
              </p>
            </div>

                {/* Registration Form (Back) */}
            <div className="flip-card-back space-y-8 relative">
              <div className="lg:hidden flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">QA</div>
                <span className="text-lg font-bold text-white">OneAutomation</span>
              </div>

              {registerSuccess ? (
                <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-700 py-4 text-center">
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/30 shadow-2xl overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <ShieldCheck className="w-10 h-10 text-emerald-400" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-none">
                      Application <span className="text-emerald-400">Received</span>
                    </h2>
                    <div className="h-0.5 w-12 bg-emerald-500/50 mx-auto rounded-full" />
                    <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest opacity-80">
                      Your enterprise access request is being processed by our quality engineering leads.
                    </p>
                  </div>

                  <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex items-start gap-4 text-left backdrop-blur-sm">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-wider">Review in Progress</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">Estimated turnaround: 2-4 business hours</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button 
                      onClick={() => {
                        setRegisterSuccess(false);
                        setIsFlipped(false);
                      }}
                      className="group flex items-center justify-center gap-3 w-full py-4 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-white"
                    >
                      <ArrowRight className="w-3 h-3 rotate-180 group-hover:-translate-x-1 transition-transform" />
                      Back to login screen
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-left space-y-2">
                    <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                      <ShieldCheck className="w-3 h-3 text-indigo-400" />
                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Enterprise Access</span>
                    </div>
                    <h1 className="text-2xl font-black text-white tracking-tight uppercase">Join OneQA</h1>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Centralized Engineering Platform</p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-4 text-left">
                    {registerError && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {registerError}
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input 
                          required
                          type="text"
                          autoComplete="off"
                          value={registerData.name}
                          onChange={e => setRegisterData({...registerData, name: e.target.value})}
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-6 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                          placeholder="Enter your name"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                        <input 
                          required
                          type="email"
                          autoComplete="off"
                          value={registerData.email}
                          onChange={e => setRegisterData({...registerData, email: e.target.value})}
                          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-6 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                          placeholder="name@company.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                      <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                      <input 
                        required
                        type={showRegisterPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={registerData.password}
                        onChange={e => setRegisterData({...registerData, password: e.target.value})}
                        minLength={6}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-12 py-3 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                        placeholder="Min. 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    </div>

                    <button 
                      disabled={registerLoading}
                      className="w-full py-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-[11px] font-black text-white uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3 pt-6"
                    >
                      {registerLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Register Account
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <p className="text-center text-slate-500 text-xs font-bold uppercase tracking-widest pt-4">
                    Already have an account? <button onClick={() => setIsFlipped(false)} className="text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-4 decoration-2">Sign In</button>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .flip-card-inner {
          position: relative;
          width: 100%;
          min-height: 550px;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .flipped {
          transform: rotateY(180deg);
        }
        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
          top: 0;
          left: 0;
        }
        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0e1a]" />}>
      <LoginRegisterForms />
    </Suspense>
  );
}
