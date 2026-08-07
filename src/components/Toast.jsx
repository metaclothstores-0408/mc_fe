import { Check, X } from "lucide-react";
export default function Toast({ message, onClose }) {
  if (!message) return null;
  return <div className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-xl border border-white/10 bg-[#18181B] px-4 py-3 text-sm shadow-2xl">
    <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/15 text-emerald-400"><Check size={14}/></span>
    <span>{message}</span>
    <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={15}/></button>
  </div>
}