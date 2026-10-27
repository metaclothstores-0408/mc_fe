import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Sparkles, ArrowRight, X, ShieldAlert } from "lucide-react";

export default function GuestAuthModal({ isOpen, onClose, title = "Atelier Sign-In Required", message }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isOpen) return null;

  const handleSignIn = () => {
    onClose?.();
    navigate(`/signin?redirect=${encodeURIComponent(location.pathname + location.search)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0e0e11] p-6 shadow-2xl text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition p-1 rounded-lg hover:bg-white/5"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Lock Icon Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
            <Lock size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-zinc-400">01 SHADE // SECURITY</div>
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          </div>
        </div>

        {/* Body Message */}
        <div className="space-y-3 mb-6 text-xs text-zinc-300 leading-relaxed">
          <p>
            {message || "Custom graphic uploads, AI super-resolution enhancements, 300 DPI production downloads, and version history are reserved for registered Atelier members."}
          </p>
          <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03] space-y-2">
            <div className="flex items-center gap-2 text-zinc-200 font-medium text-[11px]">
              <Sparkles size={13} className="text-emerald-400" />
              <span>Complimentary Member Benefits:</span>
            </div>
            <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
              <li>60 MB Cloudflare R2 cloud storage for DTF artworks</li>
              <li>Tirupur 300 DPI lossless production-ready outputs</li>
              <li>Multi-version design grouping & live 3D preview</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleSignIn}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-zinc-200 transition shadow-lg"
          >
            <span>Sign In / Join Atelier</span>
            <ArrowRight size={14} />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-white/10 text-zinc-400 font-medium text-xs hover:text-white hover:bg-white/5 transition"
          >
            Continue Browsing as Guest
          </button>
        </div>
      </div>
    </div>
  );
}

