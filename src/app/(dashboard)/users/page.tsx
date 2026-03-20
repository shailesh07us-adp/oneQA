"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users,
  Plus,
  X,
  Shield,
  Trash2,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import AccessDenied from "@/components/AccessDenied";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";

const ROLE_BADGES: Record<string, { label: string; cls: string }> = {
  ADMIN: { label: "Admin", cls: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  USER: { label: "User", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
};

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER", projectId: "", projectRole: "CONTRIBUTOR" });
  const [creating, setCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "approvals">("users");
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [processingApproval, setProcessingApproval] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const currentUserId = (session?.user as any)?.id;
  const currentRole = (session?.user as any)?.globalRole;

  const fetchUsersAndProjects = async () => {
    setLoading(true);
    const [usersRes, projectsRes, pendingRes] = await Promise.all([
      fetch("/api/users"),
      fetch("/api/projects"),
      fetch("/api/admin/users/approve")
    ]);
    if (usersRes.ok) setUsers(await usersRes.json());
    if (projectsRes.ok) setProjects(await projectsRes.json());
    if (pendingRes.ok) setPendingUsers(await pendingRes.json());
    setLoading(false);
  };

  useEffect(() => { fetchUsersAndProjects(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || "Failed to create user");
      setCreating(false);
      return;
    }
    
    toast.success(`User ${form.name || form.email} created successfully`);
    setShowModal(false);
    setForm({ name: "", email: "", password: "", role: "USER", projectId: "", projectRole: "CONTRIBUTOR" });
    setCreating(false);
    fetchUsersAndProjects();
    window.dispatchEvent(new CustomEvent("pending-approvals-updated"));
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      toast.success(`Role updated successfully`);
    } else {
      toast.error("Failed to update user role");
    }
    setEditingRole(null);
    fetchUsersAndProjects();
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    console.log("UsersPage: Starting deletion for user", userToDelete.id);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: "DELETE" });
      console.log("UsersPage: Deletion response status", res.status);
      if (res.ok) {
        toast.success(`User ${userToDelete.name || userToDelete.email} deleted successfully`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error("UsersPage: Deletion failed", errorData);
        toast.error(errorData.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("UsersPage: Error during delete fetch", error);
      toast.error("An unexpected error occurred");
    } finally {
      setUserToDelete(null);
      setIsDeleting(false);
      fetchUsersAndProjects();
      window.dispatchEvent(new CustomEvent("pending-approvals-updated"));
    }
  };

  const handleApprovalAction = async (userId: string, action: "APPROVE" | "REJECT") => {
    setProcessingApproval(userId);
    try {
      const res = await fetch("/api/admin/users/approve", {
        method: "POST",
        body: JSON.stringify({ userId, action }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        toast.success(`User ${action === "APPROVE" ? "approved" : "rejected"} successfully`);
        fetchUsersAndProjects();
        window.dispatchEvent(new CustomEvent("pending-approvals-updated"));
      } else {
        toast.error(`Failed to ${action.toLowerCase()} user`);
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setProcessingApproval(null);
    }
  };

  if (currentRole !== "ADMIN") {
    return (
      <AccessDenied 
        message="Only administrators can manage users and platform-wide access rules."
      />
    );
  }

  return (
    <>
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">User Management</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Add users, assign roles, and manage access</p>
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/20">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </header>

        <div className="p-8 max-w-5xl mx-auto w-full">
          {/* Role Legend */}
          <div className="flex items-center gap-6 mb-8 border-b border-slate-800/60 pb-px">
            <button 
              onClick={() => setActiveTab("users")}
              className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === "users" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              Active Users
              {activeTab === "users" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
            </button>
            <button 
              onClick={() => setActiveTab("approvals")}
              className={`pb-4 text-sm font-semibold transition-all relative flex items-center gap-2 ${activeTab === "approvals" ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              Pending Approvals
              {pendingUsers.length > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {pendingUsers.length}
                </span>
              )}
              {activeTab === "approvals" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />}
            </button>
          </div>

          {activeTab === "users" ? (
            <div className="flex items-center gap-4 mb-6 fade-in-up">
              {Object.entries(ROLE_BADGES).map(([role, badge]) => (
                <div key={role} className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium border ${badge.cls}`}>{badge.label}</span>
                  <span className="text-xs text-slate-600">
                    {role === "ADMIN" ? "Full access" : "View only"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-6 fade-in-up">
              <p className="text-xs text-slate-500">Users waiting for account verification and access assignment.</p>
            </div>
          )}

          {loading ? (
            <div className="glass rounded-xl overflow-hidden mt-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="px-6 py-3.5"><Skeleton className="w-16 h-4" /></th>
                    <th className="px-6 py-3.5"><Skeleton className="w-12 h-4" /></th>
                    <th className="px-6 py-3.5"><Skeleton className="w-24 h-4" /></th>
                    <th className="px-6 py-3.5"><Skeleton className="w-16 h-4" /></th>
                    <th className="px-6 py-3.5"><Skeleton className="w-12 h-4 ml-auto" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="w-32 h-4" />
                          <Skeleton className="w-24 h-3" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><Skeleton className="w-16 h-6 rounded-md" /></td>
                      <td className="px-6 py-4"><Skeleton className="w-32 h-4" /></td>
                      <td className="px-6 py-4"><Skeleton className="w-20 h-4" /></td>
                      <td className="px-6 py-4 flex justify-end"><Skeleton className="w-8 h-8 rounded-md" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden fade-in-up">
              {activeTab === "users" ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Projects</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {users.filter(u => u.status === "APPROVED").map((user) => {
                      const badge = ROLE_BADGES[user.globalRole] || ROLE_BADGES.USER;
                      const isSelf = user.id === currentUserId;
                      return (
                        <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                {(user.name || user.email).slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{user.name || "—"} {isSelf && <span className="text-xs text-slate-500">(you)</span>}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {editingRole === user.id ? (
                              <select
                                value={user.globalRole}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                onBlur={() => setEditingRole(null)}
                                autoFocus
                                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="ADMIN">Admin</option>
                                <option value="USER">User</option>
                              </select>
                            ) : (
                              <button
                                onClick={() => !isSelf && setEditingRole(user.id)}
                                disabled={isSelf}
                                className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${badge.cls} ${isSelf ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
                              >
                                {badge.label}
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {user.memberships?.length > 0 ? (
                                user.memberships.map((m: any, idx: number) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                    {m.project.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-slate-600 italic">No projects</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">{relativeTime(user.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                            {isSelf ? (
                              <span className="text-xs text-slate-600">—</span>
                            ) : (
                              <button onClick={() => setUserToDelete(user)} className="p-1.5 rounded-md text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete user">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800/60">
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending User</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Requested</th>
                      <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-right">Decisions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {pendingUsers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-500 text-sm">No pending registration requests.</td>
                      </tr>
                    ) : (
                      pendingUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{user.name || "Anonymous"}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">{relativeTime(user.requestedAt || user.createdAt)}</td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                               <button 
                                 disabled={processingApproval === user.id}
                                 onClick={() => handleApprovalAction(user.id, "REJECT")}
                                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium hover:bg-rose-500/20 transition-all"
                               >
                                 <XCircle className="w-3.5 h-3.5" /> Reject
                               </button>
                               <button 
                                 disabled={processingApproval === user.id}
                                 onClick={() => handleApprovalAction(user.id, "APPROVE")}
                                 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all"
                               >
                                 <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md glass rounded-2xl p-6 mx-4">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white">Add New User</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4" autoComplete="off">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" autoComplete="off" className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" autoComplete="off" className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Password *</label>
                  <div className="relative mt-1.5">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      value={form.password} 
                      onChange={(e) => setForm({ ...form, password: e.target.value })} 
                      placeholder="Minimum 6 characters" 
                      minLength={6} 
                      autoComplete="new-password" 
                      className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 text-sm pr-10" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Global Role</label>
                  <div className="flex gap-2 mt-1.5">
                    {(["ADMIN", "USER"] as const).map((role) => {
                      const badge = ROLE_BADGES[role];
                      const selected = form.role === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setForm({ ...form, role })}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                            selected
                              ? badge.cls + " ring-1 ring-current"
                              : "border-slate-700/50 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          {badge.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Optional Project Assignment */}
                <div className="pt-2 border-t border-slate-800/60 mt-4 space-y-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Optional: Assign to Project</p>
                  
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Select Project</label>
                    <select
                      value={form.projectId}
                      onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                      className="w-full mt-1.5 px-4 py-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:border-indigo-500/50 text-sm appearance-none"
                    >
                      <option value="">None (Global Role Only)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {form.projectId && (
                    <div>
                      <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Project Role</label>
                      <div className="flex gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, projectRole: "PROJECT_LEAD" })}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                            form.projectRole === "PROJECT_LEAD"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/50 ring-1 ring-current"
                              : "border-slate-700/50 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                           Lead
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, projectRole: "CONTRIBUTOR" })}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                            form.projectRole === "CONTRIBUTOR"
                              ? "bg-slate-700 text-white border-slate-600 ring-1 ring-current"
                              : "border-slate-700/50 text-slate-500 hover:text-slate-300"
                          }`}
                        >
                           Contributor
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" disabled={creating} className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium disabled:opacity-50">{creating ? "Creating..." : "Add User"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmationDialog
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleDelete}
          isLoading={isDeleting}
          title="Delete User"
          description={`Are you sure you want to delete ${userToDelete?.name || userToDelete?.email}? This action will permanently remove their access and all associated data.`}
          confirmLabel="Delete User"
          variant="danger"
        />
    </>
  );
}
