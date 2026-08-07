import { Link, NavLink } from "react-router-dom";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";

export default function Header({ cartCount = 0, user }) {
  const [open, setOpen] = useState(false);
  const nav = [
    ["/shop", "Shop"],
    ["/studio", "MC Studio"],
    ["/orders", "Orders"]
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0B0C]/85 backdrop-blur-xl">
      <div className="mc-container flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} className={({isActive}) =>
              `rounded-lg px-4 py-2 text-sm transition ${isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`
            }>{label}</NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link to={user ? "/profile" : "/signin"} className="mc-btn-ghost hidden sm:inline-flex"><UserRound size={18}/>{user?.full_name || "Sign in"}</Link>
          <Link to="/cart" className="relative mc-btn-ghost" aria-label="Shopping bag">
            <ShoppingBag size={20}/>
            {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1 text-[10px] font-bold">{cartCount}</span>}
          </Link>
          <button className="mc-btn-ghost md:hidden" onClick={() => setOpen(v => !v)} aria-label="Menu">
            {open ? <X size={21}/> : <Menu size={21}/>}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-white/10 bg-[#0B0B0C] px-4 py-3 md:hidden">
          <div className="mc-container flex flex-col gap-1">
            {nav.map(([to, label]) => <Link onClick={() => setOpen(false)} key={to} to={to} className="rounded-xl px-4 py-3 text-zinc-300 hover:bg-white/5 hover:text-white">{label}</Link>)}
            <Link onClick={() => setOpen(false)} to={user ? "/profile" : "/signin"} className="rounded-xl px-4 py-3 text-zinc-300 hover:bg-white/5 hover:text-white">{user ? "Account" : "Sign in"}</Link>
          </div>
        </div>
      )}
    </header>
  );
}