"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import {
  FolderOpen,
  Plus,
  X,
  CheckCircle2,
  Clock,
  Key,
  ArrowRight,
  RefreshCw,
  Users,
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
    const [projRes, usersRes] = await Promise.all([
      fetch("/api/projects"),
      fetch("/api/users")
    ]);
    if (projRes.ok) setProjects(await projRes.json());
    if (usersRes.ok) setAllUsers(await usersRes.json());
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
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0a0e1a]">
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-semibold text-white">Projects</h1>
            <p className="text-xs text-slate-500">Manage your test projects and API integrations</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass rounded-xl p-6 h-[178px] flex flex-col justify-between border border-slate-700/50">
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Skeleton className="w-40 h-5 mb-2" />
                        <Skeleton className="w-28 h-3" />
                      </div>
                      <Skeleton className="w-4 h-4 rounded-full" />
                    </div>
                    <Skeleton className="w-full h-3.5 mb-2" />
                    <Skeleton className="w-2/3 h-3.5" />
                  </div>
                  <div className="flex items-center gap-3 mt-4 border-t border-slate-800/60 pt-4">
                    <Skeleton className="w-12 h-6 rounded border border-slate-700/50" />
                    <Skeleton className="w-12 h-6 rounded border border-slate-700/50" />
                    <Skeleton className="w-12 h-6 rounded border border-slate-700/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="glass rounded-xl p-16 text-center">
              <FolderOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400">No projects yet. Create your first project to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((project: any, idx: number) => {
                const lastRun = project.testRuns?.[0];
                const runCount = project._count?.testRuns || 0;
                const keyCount = project._count?.apiKeys || 0;
                const isLead = globalRole === "ADMIN" || project.members?.some((m: any) => m.userId === currentUserId && m.role === "PROJECT_LEAD");

                return (
                  <Link key={project.id} href={`/projects/${project.id}`} className="glass rounded-xl p-6 group hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex flex-col justify-between fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-white group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5 font-mono">{project.slug}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
                      </div>
                      {project.description && (
                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-4 border-t border-slate-800/60 pt-4">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 border border-slate-800 px-1.5 py-0.5 rounded"><CheckCircle2 className="w-3 h-3 text-slate-600" /> {runCount}</span>
                        <span className="flex items-center gap-1 border border-slate-800 px-1.5 py-0.5 rounded"><Key className="w-3 h-3 text-slate-600" /> {keyCount}</span>
                        <span className="flex items-center gap-1 border border-slate-800 px-1.5 py-0.5 rounded"><Users className="w-3 h-3 text-slate-600" /> {project.members?.length || 0}</span>
                      </div>
                      
                      {isLead && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedProject(project);
                            setShowMemberModal(true);
                          }}
                          className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition-colors"
                        >
                          Add Member
                        </button>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Project Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md glass rounded-2xl p-6 mx-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">Create Project</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Project Name</label>
                  <input type="text" required value={form.name} onChange={(e) => handleSlugify(e.target.value)} placeholder="e.g. Payment Service" className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Slug</label>
                  <input type="text" required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="payment-service" className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description..." rows={2} className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={creating} className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium disabled:opacity-50">{creating ? "Creating..." : "Create Project"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showMemberModal && selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md glass rounded-2xl p-6 mx-4 fade-in-up" style={{ animationDuration: '0.2s' }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">Add Team Member</h2>
                  <p className="text-xs text-slate-500">To project: {selectedProject.name}</p>
                </div>
                <button onClick={() => setShowMemberModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAddMember} className="space-y-4">
                
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Select User</label>
                  <select
                    required
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:border-indigo-500/50 text-sm appearance-none"
                  >
                    <option value="" disabled>Choose a team member...</option>
                    {allUsers.filter(u => !selectedProject.members.some((m: any) => m.userId === u.id)).map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Project Role</label>
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setNewMemberRole("PROJECT_LEAD")}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                        newMemberRole === "PROJECT_LEAD"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/50 ring-1 ring-current"
                          : "border-slate-700/50 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                       Project Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewMemberRole("CONTRIBUTOR")}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                        newMemberRole === "CONTRIBUTOR"
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/50 ring-1 ring-current"
                          : "border-slate-700/50 text-slate-500 hover:text-slate-300"
                      }`}
                    >
                       Contributor
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowMemberModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={addingMember || !newMemberId} className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium disabled:opacity-50">{addingMember ? "Adding..." : "Add Member"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
