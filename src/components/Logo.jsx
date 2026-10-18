import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="SHADE 01 home">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-black font-black text-xs tracking-tight">
        01
      </div>
      <div className="leading-none">
        <div className="text-sm font-black tracking-[0.22em] text-white">SHADE // 01</div>
        <div className="mt-1 text-[8px] font-semibold tracking-[0.28em] text-zinc-400">HEAVYWEIGHT ATELIER</div>
      </div>
    </Link>
  );
}