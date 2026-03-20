"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Clock, 
  Search, 
  Shield, 
  Calendar,
  UserCheck,
  UserX
} from "lucide-react";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  requestedAt: string;
  status: string;
}

export default function ApprovalsPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users/approve");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: "APPROVE" | "REJECT") => {
    setProcessing(userId);
    try {
      const res = await fetch("/api/admin/users/approve", {
        method: "POST",
        body: JSON.stringify({ userId, action }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <>
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight uppercase">Access Approvals</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Manage pending registration requests</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
               <Shield className="w-3 h-3" />
               Admin Center
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pending Requests</p>
                   <Clock className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-3xl font-black text-white tracking-tight">{users.length}</p>
              </div>
            </div>

            {/* Main Table */}
            <div className="glass rounded-[2rem] border border-white/5 overflow-hidden">
               <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                     <Users className="w-5 h-5 text-indigo-400" />
                     <h2 className="text-xs font-black text-white uppercase tracking-widest">Approval Queue</h2>
                  </div>
                  <div className="relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                     <input 
                        className="bg-black/40 border border-white/5 rounded-full pl-9 pr-4 py-2 text-[10px] w-64 focus:outline-none focus:border-indigo-500/30 transition-all font-medium"
                        placeholder="Search by name or email..."
                     />
                  </div>
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] bg-white/[0.01]">
                       <th className="px-8 py-5">Full Name & Email</th>
                       <th className="px-8 py-5">Requested Date</th>
                       <th className="px-8 py-5 text-right pr-12">Actions</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {loading ? (
                        <tr>
                          <td colSpan={3} className="px-8 py-20 text-center">
                             <div className="flex flex-col items-center gap-4">
                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Syncing with server...</p>
                             </div>
                          </td>
                        </tr>
                     ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-8 py-20 text-center">
                             <div className="flex flex-col items-center gap-4 opacity-30">
                                <Shield className="w-12 h-12" />
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Queue is currently empty</p>
                             </div>
                          </td>
                        </tr>
                     ) : (
                       users.map(user => (
                         <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-600/10 border border-white/5 flex items-center justify-center font-black text-indigo-400 group-hover:scale-110 transition-transform">
                                   {user.name.charAt(0).toUpperCase()}
                                 </div>
                                 <div className="space-y-1">
                                    <p className="text-xs font-black text-white uppercase tracking-tight">{user.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold">{user.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2 text-slate-500">
                                 <Calendar className="w-3.5 h-3.5" />
                                 <span className="text-[10px] font-bold">{new Date(user.requestedAt).toLocaleDateString()}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right pr-12">
                              <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  disabled={!!processing}
                                  onClick={() => handleAction(user.id, "REJECT")}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all active:scale-95"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                                <button 
                                  disabled={!!processing}
                                  onClick={() => handleAction(user.id, "APPROVE")}
                                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/5 transition-all active:scale-95"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                              </div>
                           </td>
                         </tr>
                       ))
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        </div>
    </>
  );
}
