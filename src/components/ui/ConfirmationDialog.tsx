"use client";

import { X, AlertTriangle, AlertOctagon, Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: AlertOctagon,
      iconBg: "bg-rose-500/10 border-rose-500/20",
      iconColor: "text-rose-400",
      button: "bg-rose-600 hover:bg-rose-500 shadow-rose-900/40",
      accent: "from-rose-500/10",
      border: "border-rose-500/20",
    },
    warning: {
      icon: AlertTriangle,
      iconBg: "bg-amber-500/10 border-amber-500/20",
      iconColor: "text-amber-400",
      button: "bg-amber-600 hover:bg-amber-500 shadow-amber-900/40",
      accent: "from-amber-500/10",
      border: "border-amber-500/20",
    },
    info: {
      icon: AlertTriangle,
      iconBg: "bg-indigo-500/10 border-indigo-500/20",
      iconColor: "text-indigo-400",
      button: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40",
      accent: "from-indigo-500/10",
      border: "border-indigo-500/20",
    },
  };

  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 cursor-pointer" 
        onClick={onClose} 
      />
      
      <div className={`relative w-full max-w-sm glass rounded-3xl p-8 bg-gradient-to-br ${style.accent} to-transparent ${style.border} shadow-2xl overflow-hidden animate-in zoom-in duration-300`}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className={`p-4 rounded-2xl ${style.iconBg} border mb-6`}>
            <Icon className={`w-8 h-8 ${style.iconColor} ${variant === 'danger' ? 'animate-pulse' : ''}`} />
          </div>
          
          <h3 className="text-xl font-black text-white tracking-tight mb-3">
            {title}
          </h3>
          
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            {description}
          </p>

          <div className="flex flex-col w-full gap-3">
            <button 
              disabled={isLoading}
              onClick={() => {
                console.log("ConfirmationDialog: Confirm clicked");
                onConfirm();
              }}
              className={`w-full py-4 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 ${style.button}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : confirmLabel}
            </button>
            <button 
              disabled={isLoading}
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
