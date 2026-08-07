import { Link } from "react-router-dom";
export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-black/20">
      <div className="mc-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="text-lg font-black tracking-[.18em]">METACLOTH</div>
          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-500">Premium tech-streetwear built around your identity. Phase 1 uses curated preset avatars for a fast, reliable customization experience.</p>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Explore</div>
          <div className="mt-4 space-y-3 text-sm text-zinc-500">
            <Link className="block hover:text-white" to="/shop">Shop</Link>
            <Link className="block hover:text-white" to="/studio">MC Studio</Link>
            <Link className="block hover:text-white" to="/orders">Orders</Link>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-white">Phase 1</div>
          <p className="mt-4 text-sm leading-6 text-zinc-500">Preset avatars only. No AI generation, face swaps, artwork uploads, or marketplace features.</p>
        </div>
      </div>
      <div className="border-t border-white/5 py-5 text-center text-xs text-zinc-600">© {new Date().getFullYear()} MetaCloth. All rights reserved.</div>
    </footer>
  );
}