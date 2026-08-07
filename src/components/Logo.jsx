import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="MetaCloth home">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-600 shadow-lg shadow-violet-900/30">
        <span className="text-sm font-black tracking-tighter">MC</span>
      </div>
      <div className="leading-none">
        <div className="text-sm font-black tracking-[.18em] text-white">METACLOTH</div>
        <div className="mt-1 text-[8px] font-medium tracking-[.28em] text-zinc-500">WEAR YOUR AVATAR</div>
      </div>
    </Link>
  );
}