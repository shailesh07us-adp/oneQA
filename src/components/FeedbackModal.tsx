"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Sparkles, 
  Send, 
  Plus, 
  Clock, 
  X,
  Layers, 
  Monitor,
  Check,
  User as UserIcon
} from "lucide-react";
import { useSession } from "next-auth/react";

type FeatureType = "FRAMEWORK" | "DASHBOARD";

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  userName: string | null;
  createdAt: string;
}

export default function FeedbackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"contact" | "feature" | "roadmap">("contact");
  const [features, setFeatures] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [contactForm, setContactForm] = useState({ message: "" });
  const [featureForm, setFeatureForm] = useState({ title: "", description: "", type: "FRAMEWORK" as FeatureType });

  useEffect(() => {
    if (isOpen) {
      fetchFeatures();
    }
  }, [isOpen]);

  async function fetchFeatures() {
    setLoading(true);
    try {
      const res = await fetch("/api/features");
      if (res.ok) {
        const data = await res.json();
        setFeatures(data);
      }
    } catch (e) {
      console.error("Failed to fetch features", e);
    } finally {
      setLoading(false);
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          ...contactForm,
          name: session?.user?.name || "Guest",
          email: session?.user?.email || "",
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setSuccess("Message sent!");
        setContactForm({ message: "" });
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeatureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/features", {
        method: "POST",
        body: JSON.stringify({
          ...featureForm,
          userName: session?.user?.name || "Guest",
          userEmail: session?.user?.email || "",
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setSuccess("Request submitted!");
        setFeatureForm({ title: "", description: "", type: "FRAMEWORK" });
        fetchFeatures();
        setTimeout(() => {
          setSuccess(null);
          setActiveTab("roadmap");
        }, 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const statusMap: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    PENDING: { label: "Pending", icon: Clock, color: "text-slate-400", bg: "bg-slate-500/10" },
    PLANNED: { label: "Planned", icon: Sparkles, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    IN_PROGRESS: { label: "In Progress", icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
    COMPLETED: { label: "Completed", icon: Check, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    REJECTED: { label: "Declined", icon: X, color: "text-rose-400", bg: "bg-rose-500/10" },
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-[#0c1021] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <MessageSquare className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Community Feedback</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Share your thoughts with the QE team</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex p-1 rounded-2xl bg-black/40 border border-white/5 w-fit">
            <button 
              onClick={() => setActiveTab("contact")}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'contact' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Contact Us
            </button>
            <button 
              onClick={() => setActiveTab("feature")}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'feature' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Request Feature
            </button>
            <button 
              onClick={() => setActiveTab("roadmap")}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'roadmap' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Roadmap
            </button>
          </div>

          <div className="min-h-[360px] relative">
            {activeTab === "contact" ? (
              <form onSubmit={handleContactSubmit} className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Logged in as</p>
                      <p className="text-[9px] text-slate-500 font-bold">{session?.user?.name || "Guest"} ({session?.user?.email || "No email"})</p>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] text-emerald-400 font-black uppercase tracking-widest">Verified User</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">How can we help?</label>
                  <textarea 
                    required
                    value={contactForm.message}
                    onChange={e => setContactForm({...contactForm, message: e.target.value})}
                    rows={6}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                    placeholder="Describe your query or feedback..."
                  />
                </div>
                <button 
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Sending..." : "Submit Message"}
                </button>
              </form>
            ) : activeTab === "feature" ? (
              <form onSubmit={handleFeatureSubmit} className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Feature Title</label>
                  <input 
                    required
                    value={featureForm.title}
                    onChange={e => setFeatureForm({...featureForm, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50"
                    placeholder="E.g. Support for GraphQL Tests"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setFeatureForm({...featureForm, type: "FRAMEWORK"})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${featureForm.type === 'FRAMEWORK' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-black/40 border-white/5 text-slate-500'}`}
                    >
                      <Layers className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase">Framework</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setFeatureForm({...featureForm, type: "DASHBOARD"})}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${featureForm.type === 'DASHBOARD' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-black/40 border-white/5 text-slate-500'}`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase">Dashboard</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Describe the Requirement</label>
                  <textarea 
                    required
                    value={featureForm.description}
                    onChange={e => setFeatureForm({...featureForm, description: e.target.value})}
                    rows={4}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                    placeholder="What specific outcome are you looking for?"
                  />
                </div>
                <button 
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide animate-in slide-in-from-bottom-2 duration-300">
                {features.length === 0 ? (
                  <div className="py-20 text-center opacity-50">
                    <p className="text-[10px] font-black uppercase tracking-widest">No active requests found</p>
                  </div>
                ) : (
                  features.map(feature => {
                    const status = statusMap[feature.status] || statusMap.PENDING;
                    const Icon = status.icon;
                    return (
                      <div key={feature.id} className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${feature.type === 'FRAMEWORK' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'}`}>
                              {feature.type}
                            </span>
                            <span className="text-[8px] text-slate-600 font-bold">{new Date(feature.createdAt).toLocaleDateString()}</span>
                          </div>
                          <h4 className="text-[11px] font-bold text-white uppercase tracking-tight">{feature.title}</h4>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{feature.description}</p>
                          <div className="flex items-center gap-1.5 opacity-50 pt-1">
                            <UserIcon className="w-2.5 h-2.5" />
                            <span className="text-[9px] font-bold">{feature.userName || "Guest"}</span>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/5 ${status.bg} shrink-0`}>
                          <Icon className={`w-3 h-3 ${status.color}`} />
                          <span className={`text-[8px] font-black uppercase tracking-widest ${status.color}`}>{status.label}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {success && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c1021]/90 backdrop-blur-sm z-20 rounded-2xl animate-in zoom-in duration-300">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/40">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-black text-white uppercase tracking-widest">{success}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
