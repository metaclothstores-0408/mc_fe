import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Sparkles, ShieldCheck, Truck, WandSparkles } from "lucide-react";
import { motion } from "framer-motion";
import ProductCard from "../components/ProductCard";
import { products } from "../data/mock";

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(124,58,237,.22),transparent_32%),radial-gradient(circle_at_20%_70%,rgba(79,70,229,.10),transparent_30%)]"/>
        <div className="mc-container relative grid min-h-[650px] items-center gap-12 py-20 lg:grid-cols-[1.05fr_.95fr]">
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.6}}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300"><Sparkles size={13}/> YOUR IDENTITY. YOUR CLOTH.</div>
            <h1 className="max-w-4xl text-5xl font-black leading-[.96] tracking-[-.045em] sm:text-6xl lg:text-8xl">WEAR<br/><span className="text-violet-500">YOUR</span><br/>AVATAR.</h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">Premium tech-streetwear with a personalized avatar at the center. Choose your garment, select your avatar, and make it yours.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/studio" className="mc-btn-primary">Create in MC Studio <ArrowRight size={17}/></Link>
              <Link to="/shop" className="mc-btn-secondary">Explore Collection</Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6 text-xs text-zinc-500">
              <div><b className="block text-white">40</b> Preset avatars</div>
              <div><b className="block text-white">5</b> Garment types</div>
              <div><b className="block text-white">3</b> Print zones</div>
            </div>
          </motion.div>
          <motion.div initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} transition={{duration:.7,delay:.1}} className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -inset-10 rounded-full bg-violet-600/15 blur-3xl"/>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-zinc-900 to-zinc-950 p-3 shadow-glow">
              <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_30%,#27272a,#09090b_60%)]">
                <div className="relative w-3/4 max-w-[310px]">
                  <img src="https://placehold.co/800x1000/111114/F4F4F5?text=MC+STUDIO" alt="MetaCloth studio preview" className="w-full rounded-2xl object-cover opacity-95"/>
                  <img src="https://api.dicebear.com/9.x/bottts-neutral/svg?seed=metacloth-7" alt="Preset avatar" className="absolute left-1/2 top-[42%] w-[28%] -translate-x-1/2 mix-blend-screen"/>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="mc-container py-20">
        <div className="flex items-end justify-between gap-5">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-400">The collection</p><h2 className="section-title">Built for the everyday.</h2></div>
          <Link to="/shop" className="hidden items-center gap-1 text-sm text-zinc-400 hover:text-white sm:flex">View all <ChevronRight size={16}/></Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {products.map(p => <ProductCard key={p.id} product={p}/>)}
        </div>
      </section>

      <section className="border-y border-white/5 bg-white/[.02]">
        <div className="mc-container grid gap-8 py-14 sm:grid-cols-3">
          {[
            [WandSparkles, "Curated avatars", "40 preset avatars designed for Phase 1 personalization."],
            [ShieldCheck, "Print-ready", "Your configuration is captured as a production-ready order record."],
            [Truck, "Tracked fulfillment", "Follow every order from placed to delivered."]
          ].map(([Icon,title,desc]) => <div key={title} className="flex gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-400"><Icon size={20}/></div><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-zinc-500">{desc}</p></div></div>)}
        </div>
      </section>
    </>
  );
}