import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Layers, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import { products } from "../data/mock";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_20%_70%,rgba(255,255,255,0.03),transparent_30%)]" />
        <div className="mc-container relative grid min-h-[640px] items-center gap-12 py-16 lg:py-24 lg:grid-cols-[1.1fr_.9fr]">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white tracking-wider uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SHADE 01 // MONOCHROME ATELIER
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-[0.94] tracking-[-0.04em] sm:text-6xl lg:text-7xl text-white">
              FORM<br />
              FOLLOWS<br />
              SHADE.
            </h1>
            <p className="mt-6 max-w-xl text-sm sm:text-base leading-7 text-zinc-400">
              Heavyweight monochrome essentials engineered for young adults. Pure 260 GSM combed cotton blanks with relaxed drop-shoulder silhouettes. Zero dead stock. Zero visual clutter.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/studio" className="mc-btn-primary">
                Open SHADE Atelier <ArrowRight size={17} />
              </Link>
              <Link to="/shop" className="mc-btn-secondary">
                Explore Drops
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6 text-xs text-zinc-500 font-mono">
              <div><b className="block text-sm text-white font-sans font-bold">260+ GSM</b> Heavy Combed Cotton</div>
              <div><b className="block text-sm text-white font-sans font-bold">100%</b> Black & White Noir</div>
              <div><b className="block text-sm text-white font-sans font-bold">24 HR</b> Tirupur Dispatch</div>
            </div>
          </motion.div>

          {/* Hero Visual Preview */}
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }} className="relative mx-auto w-full max-w-[480px]">
            <div className="absolute -inset-8 rounded-full bg-white/5 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-gradient-to-b from-[#141418] to-[#09090b] p-3 shadow-2xl">
              <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_30%,#1f1f23,#09090b_65%)] relative p-6">
                <div className="text-center space-y-2">
                  <div className="text-3xl sm:text-4xl font-black tracking-[0.25em] text-white">
                    VOID
                  </div>
                  <div className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
                    ARCHIVE 01 // 240 GSM
                  </div>
                  <div className="pt-4">
                    <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-300">
                      Tirupur Boxy Fit
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Drops Collection */}
      <section className="mc-container py-16 sm:py-20">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">The Drops</p>
            <h2 className="section-title">Engineered for the Everyday.</h2>
          </div>
          <Link to="/shop" className="hidden items-center gap-1 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white sm:flex transition">
            View all drops <ChevronRight size={16} />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="mc-container grid gap-8 py-14 sm:grid-cols-3">
          {[
            [Layers, "240 GSM Combed Cotton", "Dense structured knit with luxury drop-shoulder drape and pre-shrunk finish."],
            [ShieldCheck, "300 DPI Lossless DTF", "High-contrast transfers with automated background knockout for razor-sharp edges."],
            [Truck, "Direct Tirupur Fulfillment", "Crafted and dispatched directly from India's textile capital with express tracking."]
          ].map(([Icon, title, desc]) => (
            <div key={title} className="flex gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 border border-white/10 text-white">
                <Icon size={19} />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-zinc-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}