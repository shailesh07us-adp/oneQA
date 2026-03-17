"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  Key,
  Database,
  Zap,
  Layout,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  X,
  Plus,
  FolderOpen
} from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;
  const globalRole = (session?.user as any)?.globalRole;

  const [projects, setProjects] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Project State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [creating, setCreating] = useState(false);

  // Add Member State
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("CONTRIBUTOR");
  const [addingMember, setAddingMember] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const [projRes, usersRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/users")
      ]);
      if (projRes.ok) setProjects(await projRes.json());
      if (usersRes.ok) setAllUsers(await usersRes.json());
    } catch (e) {
      console.error("Fetch failed", e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSlugify = (name: string) => {
    setForm({
      ...form,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to create project");
      setCreating(false);
      return;
    }
    
    toast.success(`Project ${form.name} created successfully!`);
    setShowModal(false);
    setForm({ name: "", slug: "", description: "" });
    setCreating(false);
    fetchProjects();
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newMemberId) return;
    setAddingMember(true);
    
    const res = await fetch(`/api/projects/${selectedProject.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: newMemberId, role: newMemberRole }),
    });
    
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to add member");
      setAddingMember(false);
      return;
    }
    
    const addedUser = allUsers.find(u => u.id === newMemberId);
    toast.success(`Added ${addedUser?.name || addedUser?.email} to the project as a ${newMemberRole.replace("_", " ")}`);
    
    setShowMemberModal(false);
    setNewMemberId("");
    setNewMemberRole("CONTRIBUTOR");
    setAddingMember(false);
    fetchProjects();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0e1a]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-white/[0.03] sticky top-0 z-20 shrink-0">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Project Portfolio</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
              </span>
              Manage test suites and cross-functional teams
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20"
          >
            <Plus className="w-3 h-3" /> New Project
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-7xl mx-auto w-full scrollbar-premium">
          {/* Project KPI Row */}
          {!loading && projects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in-up">
              <ProjectKPICard 
                label="Total Projects" 
                value={projects.length.toString()} 
                desc="Active development units" 
                icon={<FolderOpen className="w-5 h-5" />} 
                color="sky" 
              />
              <ProjectKPICard 
                label="Total Pipelines" 
                value={projects.reduce((acc, p) => acc + (p._count?.testRuns || 0), 0).toString()} 
                desc="Total test executions tracked" 
                icon={<Zap className="w-5 h-5 text-amber-400" />} 
                color="amber" 
              />
              <ProjectKPICard 
                label="Team Capacity" 
                value={allUsers.length.toString()} 
                desc="Assigned platform owners" 
                icon={<Users className="w-5 h-5" />} 
                color="indigo" 
              />
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
              <Layout className="w-3.5 h-3.5 text-indigo-400" /> Active Projects
            </h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="glass rounded-xl p-5 h-[160px] border-white/[0.03] space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="w-12 h-12 rounded-2xl bg-white/5" />
                      <div className="space-y-2">
                        <Skeleton className="w-32 h-4 bg-white/5" />
                        <Skeleton className="w-20 h-2 bg-white/5" />
                      </div>
                    </div>
                    <Skeleton className="w-full h-8 bg-white/5 rounded-xl" />
                    <div className="flex gap-4 pt-4 border-t border-white/5">
                      <Skeleton className="w-16 h-4 bg-white/5" />
                      <Skeleton className="w-16 h-4 bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border-dashed border-white/10">
                <FolderOpen className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">The Portfolio is Empty</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed mb-8">Ready to track your first test suite? Create a project to start gathering intelligence.</p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="px-8 py-3 rounded-xl bg-white text-[#0a0e1a] text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl shadow-white/5"
                >
                  Create Your First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                {projects.map((project: any, idx: number) => {
                  const runCount = project._count?.testRuns || 0;
                  const keyCount = project._count?.apiKeys || 0;
                  const memberCount = project.members?.length || 0;
                  const isLead = globalRole === "ADMIN" || project.members?.some((m: any) => m.userId === currentUserId && m.role === "PROJECT_LEAD");

                  return (
                    <Link 
                      key={project.id} 
                      href={`/projects/${project.id}`} 
                      className="glass rounded-2xl p-5 border-t-2 border-indigo-500/80 shadow-[0_-8px_15px_-8px_rgba(99,102,241,0.15)] transition-all duration-500 group hover:-translate-y-1 hover:shadow-[0_-10px_20px_-4px_rgba(99,102,241,0.2)] fade-in-up flex flex-col justify-between" 
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center transition-transform group-hover:scale-110 duration-500 relative">
                               <div className="absolute inset-0 bg-indigo-500/20 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                               <Database className="w-5 h-5 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                            </div>
                            <div>
                               <h3 className="text-lg font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors uppercase leading-none">{project.name}</h3>
                               <p className="text-[9px] text-slate-500 tracking-widest font-black uppercase mt-1">Slug: <span className="font-mono text-indigo-400/80">{project.slug}</span></p>
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-white/5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                            <ArrowRight className="w-4 h-4 text-white" />
                          </div>
                        </div>

                        {project.description && (
                          <p className="text-xs text-slate-400 mb-6 line-clamp-2 leading-relaxed min-h-[36px] border-l-2 border-indigo-500/20 pl-3">
                            {project.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-6 border-t border-white/[0.03]">
                        <div className="flex items-center gap-4">
                           <MetricBadge icon={<CheckCircle2 className="w-3 h-3" />} label="Runs" value={runCount} color="emerald" />
                           <MetricBadge icon={<Key className="w-3 h-3" />} label="Keys" value={keyCount} color="purple" />
                           <MetricBadge icon={<Users className="w-3 h-3" />} label="Team" value={memberCount} color="sky" />
                        </div>
                        
                        {isLead && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setSelectedProject(project);
                              setShowMemberModal(true);
                            }}
                            className="px-5 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-[0.15em] hover:bg-indigo-500/20 transition-all border border-indigo-500/20 whitespace-nowrap"
                          >
                            Add Lead
                          </button>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md glass rounded-3xl p-8 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">New Project</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Initialize workspace</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Project Name</label>
                <input 
                  type="text" 
                  required 
                  value={form.name} 
                  onChange={(e) => handleSlugify(e.target.value)} 
                  placeholder="e.g. Identity Service" 
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-bold" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Slug <span className="text-[8px] opacity-40 ml-2">(Auto-generated)</span></label>
                <input 
                  type="text" 
                  required 
                  value={form.slug} 
                  onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                  placeholder="identity-service" 
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-indigo-400 placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-mono font-black" 
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                <textarea 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  placeholder="What is this project's objective?" 
                  rows={3} 
                  className="w-full px-5 py-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-bold resize-none" 
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                  Discard
                </button>
                <button 
                  type="submit" 
                  disabled={creating} 
                  className="px-8 py-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40 disabled:opacity-50"
                >
                  {creating ? "Initializing..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md glass rounded-3xl p-8 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Project Team</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Adding to {selectedProject.name}</p>
              </div>
              <button 
                onClick={() => setShowMemberModal(false)} 
                className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Choose Owner</label>
                <select
                  required
                  value={newMemberId}
                  onChange={(e) => setNewMemberId(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-[#0c1021] border border-white/5 text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm font-bold appearance-none"
                >
                  <option value="" disabled className="bg-[#0c1021]">Select a team member...</option>
                  {allUsers.filter(u => !selectedProject.members.some((m: any) => m.userId === u.id)).map(u => (
                    <option key={u.id} value={u.id} className="bg-[#0c1021]">{u.name || u.email}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Access Level</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNewMemberRole("PROJECT_LEAD")}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      newMemberRole === "PROJECT_LEAD"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-lg shadow-amber-900/20"
                        : "border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/5"
                    }`}
                  >
                     Project Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMemberRole("CONTRIBUTOR")}
                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                      newMemberRole === "CONTRIBUTOR"
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/50 shadow-lg shadow-indigo-900/20"
                        : "border-white/5 text-slate-600 hover:text-slate-400 hover:bg-white/5"
                    }`}
                  >
                     Contributor
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={() => setShowMemberModal(false)} 
                  className="px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={addingMember || !newMemberId} 
                  className="px-8 py-4 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40"
                >
                  {addingMember ? "Granting Access..." : "Grant Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectKPICard({ label, value, desc, icon, color }: any) {
  const map: any = {
    sky: "border-sky-500/80 shadow-[0_-12px_20px_-8px_rgba(14,165,233,0.15)]",
    amber: "border-amber-500/80 shadow-[0_-12px_20px_-8px_rgba(245,158,11,0.15)]",
    indigo: "border-indigo-500/80 shadow-[0_-12px_20px_-8px_rgba(99,102,241,0.15)]",
  };

  return (
    <div className={`glass rounded-2xl p-5 border-t-2 transition-all duration-500 group hover:-translate-y-0.5 ${map[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-1.5 rounded-lg bg-slate-900/50 border border-white/5 transition-transform group-hover:scale-110 duration-500">
          {icon}
        </div>
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Data</span>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">{label}</p>
        <p className="text-2xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500">{value}</p>
        <p className="text-[9px] text-slate-500 mt-0.5 font-medium">{desc}</p>
      </div>
    </div>
  );
}

function MetricBadge({ icon, label, value, color }: any) {
  const colors: any = {
    emerald: "text-emerald-400",
    purple: "text-purple-400",
    sky: "text-sky-400",
  };

  return (
    <div className="flex flex-col gap-1 items-start">
      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-900/40 border border-white/5 text-[10px] font-black text-slate-300">
        <span className={colors[color]}>{icon}</span>
        {value}
      </div>
    </div>
  );
}
