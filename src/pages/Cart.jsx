import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { money } from "../lib/storage";

export default function Cart({ cart, updateQty, remove }) {
  const navigate = useNavigate();
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  if (!cart.length) return (
    <div className="mc-container py-24 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 border border-white/10 text-zinc-400">
        <ShoppingBag size={24} />
      </div>
      <h1 className="mt-6 text-3xl font-black text-white">Your bag is empty.</h1>
      <p className="mt-3 text-xs sm:text-sm text-zinc-400">
        Explore our curated drops or create a custom piece in SHADE Atelier.
      </p>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/shop" className="mc-btn-secondary text-xs">Explore Drops</Link>
        <Link to="/studio" className="mc-btn-primary text-xs">Open SHADE Atelier</Link>
      </div>
    </div>
  );

  return (
    <div className="mc-container py-10 sm:py-14">
      <h1 className="text-3xl sm:text-4xl font-black text-white">Your Bag</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {cart.map(item => (
            <div key={item.id} className="flex gap-4 rounded-2xl border border-white/10 bg-[#121215] p-3 sm:p-4">
              {item.image ? (
                <img src={item.image} className="h-28 w-24 rounded-xl object-cover sm:h-36 sm:w-28 border border-white/5 shrink-0" alt="" />
              ) : (
                <div className="h-28 w-24 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  SHADE 01
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-white text-sm sm:text-base">{item.name}</h2>
                    <p className="mt-1 text-xs text-zinc-400 font-mono">
                      {item.color} · Size {item.size}
                      {item.avatarTitle && ` · ${item.avatarTitle}`}
                    </p>
                  </div>
                  <button onClick={() => remove(item.id)} className="text-zinc-500 hover:text-white p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border border-white/10 bg-white/[0.02]">
                    <button onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))} className="p-2 text-zinc-400 hover:text-white">
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-xs font-mono font-bold text-white">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-2 text-zinc-400 hover:text-white">
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="font-bold font-mono text-sm sm:text-base text-white">{money(item.price * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-white/10 bg-[#121215] p-6 lg:sticky lg:top-24">
          <h2 className="font-bold text-white text-sm uppercase tracking-wider">Order Summary</h2>
          <div className="mt-5 flex justify-between text-xs text-zinc-400 font-mono">
            <span>Subtotal</span>
            <span>{money(subtotal)}</span>
          </div>
          <div className="mt-3 flex justify-between text-xs text-zinc-400 font-mono">
            <span>Shipping</span>
            <span className="text-emerald-400">FREE (Tirupur Hub)</span>
          </div>
          <div className="my-5 border-t border-white/10" />
          <div className="flex justify-between text-base font-bold text-white font-mono">
            <span>Total</span>
            <span>{money(subtotal)}</span>
          </div>
          <button onClick={() => navigate("/checkout")} className="mc-btn-primary mt-6 w-full text-xs">
            Proceed to Checkout <ArrowRight size={16} />
          </button>
        </aside>
      </div>
    </div>
  );
}