import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 shrink-0" aria-label="B&D home">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-white text-black font-black text-xs tracking-tighter">
        B&D
      </div>
      <div className="leading-none">
        <div className="text-sm font-black tracking-[0.24em] text-white">B & D</div>
        <div className="mt-1 text-[8px] font-semibold tracking-[0.28em] text-zinc-400">MONOCHROME NOIR</div>
      </div>
    </Link>
  );
}