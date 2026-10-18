import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-black/40">
      <div className="mc-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="text-xl font-black tracking-[0.25em] text-white">B & D</div>
          <p className="mt-3 max-w-md text-xs sm:text-sm leading-6 text-zinc-400">
            Monochrome streetwear atelier. Heavyweight 240 GSM combed cotton blanks crafted in the Tirupur textile hub. Engineered for pure drape, high-contrast DTF transfers, and zero dead stock.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white">Explore</div>
          <div className="mt-4 space-y-2.5 text-xs text-zinc-400">
            <Link className="block hover:text-white transition" to="/shop">Collection</Link>
            <Link className="block hover:text-white transition" to="/studio">B&D Atelier</Link>
            <Link className="block hover:text-white transition" to="/orders">Orders</Link>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-white">Manufacturing</div>
          <p className="mt-4 text-xs leading-6 text-zinc-400">
            100% reactive dyed Pitch Black and Super Combed White blanks. Direct factory fulfillment from Tirupur, India.
          </p>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-[11px] text-zinc-500 font-mono">
        © {new Date().getFullYear()} B&D. FORM FOLLOWS SHADE. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
}