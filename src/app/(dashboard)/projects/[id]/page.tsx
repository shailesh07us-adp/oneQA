"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { relativeTime } from "@/lib/utils";
import {
  Key,
  Copy,
  CheckCircle2,
  XCircle,
  Trash2,
  Users,
  FolderX,
  Clock,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import AccessDenied from "@/components/AccessDenied";
import { StatCard } from "@/components/StatCard";
import { TestCaseTrendChart, DurationTrendChart } from "@/components/TrendChart";
import { TestingPyramid } from "@/components/TestingPyramid";

interface ProjectRun {
  id: string;
  status: string;
  env: string;
  startTime: string;
  duration: number | null;
  type?: string;
}

interface ProjectApiKey {
  id: string;
  label: string;
  prefix: string;
  createdAt: string;
}

interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  user: {
    name: string | null;
    email: string;
  };
}

interface ProjectUser {
  id: string;
  name: string | null;
  email: string | null;
}

type ProjectDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  error?: never;
  _count?: {
    testRuns: number;
  };
  apiKeys: ProjectApiKey[];
  members: ProjectMember[];
  testRuns: ProjectRun[];
} | { error: string; id?: never; name?: never; slug?: never; description?: never; _count?: never; apiKeys?: never; members?: never; testRuns?: never };

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "trends" | "api-keys" | "team">("overview");

  // API Key state
  const [generatingKey, setGeneratingKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyLabel, setKeyLabel] = useState("Default");
  const [keyCopied, setKeyCopied] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  // Team state
  const [allUsers, setAllUsers] = useState<ProjectUser[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("CONTRIBUTOR");

  const currentUserId = session?.user?.id;
  const globalRole = session?.user?.globalRole;

  const fetchProject = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) {
      setProject(await res.json());
    } else if (res.status === 403) {
      setProject({ error: "Forbidden" });
    }
    setLoading(false);
  }, [id]);

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`/api/users`);
    if (res.ok) setAllUsers(await res.json());
  }, []);

  useEffect(() => { 
    fetchProject(); 
    if (globalRole === "ADMIN") {
      fetchUsers();
    }
  }, [fetchProject, fetchUsers, globalRole]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Clock className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!project || project.error) {
    const isForbidden = project?.error === "Forbidden";
    
    if (isForbidden) {
      return (
        <AccessDenied 
          message="You don't have permission to view this project. If you believe this is an error, please contact your administrator."
          backLink="/projects"
          backText="Back to Projects"
        />
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 overflow-hidden relative">
        {/* Background Ornaments */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 glass rounded-3xl p-12 max-w-lg w-full border border-slate-700/50 shadow-2xl shadow-black/80 fade-in-up">
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-slate-700/50 group relative glow-indigo">
            <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-indigo-500/20" />
            <FolderX className="w-10 h-10 text-indigo-400" />
          </div>
          
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 drop-shadow-sm tracking-tight mb-4">
            Project Not Found
          </h1>
          
          <p className="text-slate-400 mb-8 max-w-sm mx-auto">
            The project you are looking for might have been deleted, or the URL is incorrect.
          </p>

          <Link 
            href="/projects" 
            className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-slate-800 text-white font-medium hover:bg-slate-700 hover:shadow-lg transition-all active:scale-95"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const projectRole = project ? (project.members?.find((m: ProjectMember) => m.userId === currentUserId)?.role || (globalRole === "ADMIN" ? "PROJECT_LEAD" : null)) : null;
  const canManageProject = projectRole === "PROJECT_LEAD";

  const generateKey = async () => {
    setGeneratingKey(true);
    const res = await fetch(`/api/projects/${id}/keys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: keyLabel }),
    });
    if (res.ok) {
      const data = await res.json();
      setNewKey(data.key);
      toast.success("API Key generated successfully");
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to generate API Key");
    }
    setGeneratingKey(false);
  };

  const revokeKey = async (keyId: string) => {
    const res = await fetch(`/api/projects/${id}/keys?keyId=${keyId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("API Key revoked");
      fetchProject();
    } else {
      toast.error("Failed to revoke API Key");
    }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setKeyCopied(true);
      toast.success("API Key copied to clipboard");
      setTimeout(() => setKeyCopied(false), 2000);
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberId) return;
    setAddingMember(true);
    const res = await fetch(`/api/projects/${id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: newMemberId, role: newMemberRole }),
    });
    if (res.ok) {
      toast.success(`Successfully added member as ${newMemberRole.replace("_", " ")}`);
      setNewMemberId("");
      fetchProject();
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to add member");
    }
    setAddingMember(false);
  };

  const removeMember = async (userId: string) => {
    const res = await fetch(`/api/projects/${id}/members?userId=${userId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Team member removed");
      fetchProject();
    } else {
      toast.error("Failed to remove team member");
    }
  };

  const changeMemberRole = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/projects/${id}/members?userId=${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      toast.success(`Role updated to ${newRole.replace("_", " ")}`);
      fetchProject();
    } else {
      toast.error("Failed to update role");
    }
  };

  const runs = project.testRuns || [];
  const passed = runs.filter((r: ProjectRun) => r.status === "passed").length;
  const failed = runs.filter((r: ProjectRun) => r.status === "failed").length;
  const rate = runs.length > 0 ? Math.round((passed / runs.length) * 100) : 0;
  const avgDuration = runs.length > 0 ? Math.round(runs.reduce((s: number, r: ProjectRun) => s + (r.duration || 0), 0) / runs.length / 1000) : 0;

  return (
    <>
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-3 tracking-tight">
              {project.name}
              {projectRole && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                  projectRole === "PROJECT_LEAD" 
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                }`}>
                  {projectRole.replace("_", " ")}
                </span>
              )}
            </h1>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-semibold mt-0.5">{project.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            {canManageProject && activeTab === "api-keys" && (
              <button onClick={() => setShowKeyDialog(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20">
                <Key className="w-4 h-4" /> Generate API Key
              </button>
            )}
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="px-8 pt-4 border-b border-slate-800/60 flex gap-6 shrink-0">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "overview" ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("trends")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "trends" ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
          >
            Automation Trends
          </button>
          <button 
            onClick={() => setActiveTab("api-keys")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "api-keys" ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
          >
            API Keys
            <span className="ml-2 bg-slate-800 text-slate-400 py-0.5 px-2 rounded-full text-[10px]">{project.apiKeys?.length || 0}</span>
          </button>
          {canManageProject && (
            <button 
              onClick={() => setActiveTab("team")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "team" ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-300"}`}
            >
              Team Members
              <span className="bg-slate-800 text-slate-400 py-0.5 px-2 rounded-full text-[10px]">{project.members?.length || 0}</span>
            </button>
          )}
        </div>

        <div className="p-8 pb-20 max-w-7xl mx-auto w-full">
          {activeTab === "overview" && (
            <div className="space-y-6 fade-in-up">
              {/* Project Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8 fade-in-up">
                <StatCard label="Total Runs" value={project._count?.testRuns || 0} icon={<Layers className="w-4 h-4 text-indigo-400" />} color="indigo" />
                
                {/* Orbital Gauge: Success Rate */}
                <div className="lg:col-span-1 glass rounded-[2rem] p-6 relative overflow-hidden border-t-4 border-emerald-500/80 shadow-[0_-12px_20px_-8px_rgba(52,211,153,0.25)] group hover:-translate-y-1 transition-all duration-500">
                  <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Success Rate</span>
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform">
                        <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800/40" />
                        <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={314.159} strokeDashoffset={314.159 - (314.159 * rate) / 100} strokeLinecap="round" className="text-emerald-500 transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-white tracking-tighter">{rate}<span className="text-xs text-emerald-500/60 ml-0.5">%</span></span>
                      </div>
                      <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    </div>
                  </div>
                </div>

                <StatCard label="Passed" value={passed} icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} color="emerald" />
                <StatCard label="Failed" value={failed} icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} color="rose" />
                <StatCard label="Avg Duration" value={`${avgDuration}s`} icon={<Clock className="w-4 h-4 text-sky-400" />} color="sky" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="glass rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Active API Keys</p>
                    <p className="text-2xl font-bold text-white">{project.apiKeys?.length || 0}</p>
                  </div>
                  <Key className="w-8 h-8 text-slate-700/50" />
                </div>
                <div className="glass rounded-xl p-4 flex flex-col justify-center">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mb-1">Description</p>
                  <p className="text-sm text-slate-300 line-clamp-2">{project.description || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Recent Runs */}
                <div>
                  <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" /> Recent Test Runs
                  </h2>
                  {runs.length === 0 ? (
                    <div className="glass rounded-xl p-8 text-center">
                      <p className="text-sm text-slate-500">No test runs yet for this project.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {runs.slice(0, 6).map((run: ProjectRun) => (
                        <div key={run.id} className="glass rounded-xl p-4 flex items-center gap-4">
                          {run.status === "passed"
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200">{run.env}</p>
                            <p className="text-[11px] text-slate-500">{relativeTime(run.startTime)} · {run.duration ? `${(run.duration / 1000).toFixed(1)}s` : "—"}</p>
                          </div>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${run.status === "passed" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                            {run.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "trends" && (
            <div className="space-y-6 fade-in-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass rounded-[2rem] p-8 border-white/[0.03]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Test Case stability Trend</p>
                  <div className="h-64">
                    <TestCaseTrendChart projectId={project.id} />
                  </div>
                </div>
                <div className="glass rounded-[2rem] p-8 border-white/[0.03]">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Performance Velocity</p>
                  <div className="h-64">
                    <DurationTrendChart projectId={project.id} />
                  </div>
                </div>
              </div>
              
              <div className="glass rounded-[2rem] p-8 border-white/[0.03] lg:w-2/3 mx-auto">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">
                  Testing Distribution
                </p>
                <div className="w-full flex justify-center">
                  <TestingPyramid
                    unit={runs.filter((r) => r.type === 'unit').length || 150}
                    integration={runs.filter((r) => r.type === 'integration').length || 60}
                    e2e={runs.filter((r) => r.type === 'e2e').length || 20}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "api-keys" && (
            <div className="space-y-6 fade-in-up md:w-2/3 lg:w-1/2">
              <div>
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" /> API Keys
                </h2>
                {project.apiKeys?.length === 0 ? (
                  <div className="glass rounded-xl p-8 text-center">
                    <Key className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No active API keys.</p>
                    {canManageProject && <p className="text-xs text-slate-600 mt-1">Generate one to connect your test framework.</p>}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {project.apiKeys?.map((key: ProjectApiKey) => (
                      <div key={key.id} className="glass rounded-xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{key.label}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{key.prefix}••••••••••••</p>
                          <p className="text-[11px] text-slate-600 mt-1">Created {relativeTime(key.createdAt)}</p>
                        </div>
                        {canManageProject && (
                          <button onClick={() => revokeKey(key.id)} className="p-2 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Revoke key">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "team" && (
            <div className="space-y-6 fade-in-up">
              <div className="flex items-center justify-between mt-2">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" /> Team Members
                </h2>
              </div>
              
              <div className="glass rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Project Role</th>
                      <th className="px-6 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {project.members?.map((member: ProjectMember) => {
                      const isSelf = member.userId === currentUserId;
                      return (
                        <tr key={member.id} className="hover:bg-slate-800/20">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold border border-slate-700">
                                {(member.user.name || member.user.email).slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{member.user.name || "—"} {isSelf && <span className="text-xs text-slate-500">(you)</span>}</p>
                                <p className="text-xs text-slate-500">{member.user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {canManageProject && !isSelf ? (
                              <select
                                value={member.role}
                                onChange={(e) => changeMemberRole(member.userId, e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="PROJECT_LEAD">Project Lead</option>
                                <option value="CONTRIBUTOR">Contributor</option>
                              </select>
                            ) : (
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${
                                member.role === "PROJECT_LEAD" 
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              }`}>
                                {member.role.replace("_", " ")}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {canManageProject && (!isSelf || globalRole === "ADMIN") && (
                              <button onClick={() => removeMember(member.userId)} className="p-1.5 rounded-md text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Remove member">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    
                    {/* Add Member Row */}
                    {canManageProject && allUsers.length > 0 && (
                      <tr className="bg-slate-800/10">
                        <td colSpan={3} className="px-6 py-4 border-t border-slate-800/60">
                          <form onSubmit={addMember} className="flex items-center gap-3">
                            <select
                              required
                              value={newMemberId}
                              onChange={(e) => setNewMemberId(e.target.value)}
                              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 flex-1 max-w-sm"
                            >
                              <option value="" disabled>Select a user to add...</option>
                              {allUsers.filter(u => !project.members?.some((m: ProjectMember) => m.userId === u.id)).map(u => (
                                <option key={u.id} value={u.id}>{u.name || u.email}</option>
                              ))}
                            </select>
                            <select
                              value={newMemberRole}
                              onChange={(e) => setNewMemberRole(e.target.value)}
                              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                            >
                              <option value="CONTRIBUTOR">Contributor</option>
                              <option value="PROJECT_LEAD">Project Lead</option>
                            </select>
                            <button type="submit" disabled={addingMember || !newMemberId} className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-colors disabled:opacity-50">
                              {addingMember ? "Adding..." : "Add Member"}
                            </button>
                          </form>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Generate Key Dialog */}
        {showKeyDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md glass rounded-2xl p-6 mx-4">
              {newKey ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h2 className="text-lg font-semibold text-white">Save Your API Key</h2>
                  </div>
                  <p className="text-sm text-slate-400">This key will only be shown once. Copy it now and store it securely.</p>
                  <div className="flex items-center gap-2 bg-slate-900/80 rounded-lg p-3 border border-slate-700/50">
                    <code className="text-sm text-emerald-400 flex-1 break-all font-mono">{newKey}</code>
                    <button onClick={copyKey} className="p-1.5 rounded-md hover:bg-slate-800 transition-colors shrink-0">
                      {keyCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                  <button onClick={() => { setShowKeyDialog(false); setNewKey(null); setKeyLabel("Default"); fetchProject(); }} className="w-full py-2.5 rounded-lg bg-indigo-500/20 text-indigo-400 text-sm font-medium hover:bg-indigo-500/30 transition-colors">I've saved the key</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-white">Generate API Key</h2>
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Label</label>
                    <input type="text" value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} placeholder="e.g. CI Pipeline" className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-indigo-500/50" />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowKeyDialog(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                    <button onClick={generateKey} disabled={generatingKey} className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium disabled:opacity-50">
                      {generatingKey ? "Generating..." : "Generate Key"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    </>
  );
}
