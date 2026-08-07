import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown, RotateCcw, ShoppingBag } from "lucide-react";
import AvatarPicker from "../components/AvatarPicker";
import { colors, garmentOptions, sizes, zones } from "../data/mock";
import { money } from "../lib/storage";

export default function Studio({ addToCart, notify }) {
  const [garment,setGarment]=useState(garmentOptions[0]);
  const [color,setColor]=useState(colors[0]);
  const [size,setSize]=useState("M");
  const [zone,setZone]=useState(zones[0]);
  const [avatar,setAvatar]=useState(null);
  const printSurcharge=199;
  const total=garment.price+printSurcharge;

  const preview = useMemo(() => `https://placehold.co/800x1000/${color.hex.replace("#","")}/${color.hex === "#F4F4F5" ? "18181B" : "F4F4F5"}?text=${encodeURIComponent(garment.label)}`, [color,garment]);

  const reset=()=>{setGarment(garmentOptions[0]);setColor(colors[0]);setSize("M");setZone(zones[0]);setAvatar(null)};
  const add=()=>{
    if(!avatar){notify("Select an avatar first");return;}
    addToCart({
      id:`studio-${Date.now()}`, productId:null, name:`MC Studio — ${garment.label}`, price:total, quantity:1, size,
      color:color.name, garmentType:garment.type, zone:zone.id, avatarId:avatar.id, avatarTitle:avatar.title, image:preview,
      custom:true, printSurcharge
    });
    notify("Custom design added to bag");
  };

  return <div className="mc-container py-8 sm:py-12">
    <div className="mb-8"><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-400">MC Studio</p><h1 className="text-4xl font-black tracking-tight sm:text-5xl">Make it yours.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">Configure your Phase 1 personalized apparel using curated avatars. No AI image generation or artwork uploads are used here.</p></div>
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      <div className="xl:sticky xl:top-24 xl:self-start">
        <div className="relative mx-auto max-w-[650px] overflow-hidden rounded-3xl border border-white/10 bg-[#18181B] p-3 shadow-glow">
          <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[1.4rem] bg-[radial-gradient(circle_at_50%_35%,#303038,#09090b_65%)]">
            <img src={preview} alt={`${garment.label} preview`} className="h-full w-full object-cover"/>
            {avatar && <motion.img key={avatar.id} initial={{scale:.85,opacity:0}} animate={{scale:1,opacity:1}} src={avatar.imageUrl} alt={avatar.title} className={`absolute w-[23%] max-w-[150px] mix-blend-screen ${zone.id==="CHEST_CENTER"?"left-1/2 top-[39%] -translate-x-1/2":zone.id==="POCKET_LEFT"?"left-[34%] top-[40%]":"left-1/2 top-[53%] -translate-x-1/2"}`}/>}
            {!avatar && <div className="absolute rounded-xl border border-dashed border-white/20 bg-black/30 px-4 py-3 text-center text-xs text-zinc-500">Select an avatar<br/>to preview your print</div>}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/45 px-4 py-3 backdrop-blur"><span className="text-xs text-zinc-400">{zone.label}</span><span className="text-xs font-semibold text-white">{money(total)}</span></div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <section className="mc-card p-5"><Step n="01" title="Garment"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{garmentOptions.map(g=><button key={g.type} onClick={()=>setGarment(g)} className={`rounded-xl border p-3 text-left transition ${garment.type===g.type?"border-violet-500 bg-violet-500/10":"border-white/10 bg-white/[.02]"}`}><span className="block text-sm font-semibold">{g.label}</span><span className="mt-1 block text-xs text-zinc-500">{money(g.price)}</span></button>)}</div></Step></section>
        <section className="mc-card p-5"><Step n="02" title="Color"><div className="flex flex-wrap gap-3">{colors.map(c=><button key={c.name} title={c.name} onClick={()=>setColor(c)} className={`rounded-full border p-1 ${color.name===c.name?"border-violet-500 ring-2 ring-violet-500/20":"border-white/10"}`}><span className="block h-9 w-9 rounded-full border border-white/10" style={{background:c.hex}}/></button>)}</div><div className="mt-3 text-xs text-zinc-500">{color.name}</div></Step></section>
        <section className="mc-card p-5"><Step n="03" title="Size"><div className="grid grid-cols-5 gap-2">{sizes.map(s=><button key={s} onClick={()=>setSize(s)} className={`rounded-xl border py-3 text-sm font-semibold ${size===s?"border-violet-500 bg-violet-500/10":"border-white/10"}`}>{s}</button>)}</div></Step></section>
        <section className="mc-card p-5"><Step n="04" title="Print zone"><div className="relative"><select value={zone.id} onChange={e=>setZone(zones.find(z=>z.id===e.target.value))} className="mc-input appearance-none">{zones.map(z=><option key={z.id} value={z.id}>{z.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-zinc-500" size={17}/></div></Step></section>
        <section className="mc-card p-5"><Step n="05" title="Choose avatar"><AvatarPicker selected={avatar} onSelect={setAvatar}/>{avatar && <div className="mt-4 flex items-center gap-3 rounded-xl bg-violet-500/10 p-3"><img src={avatar.imageUrl} className="h-10 w-10 rounded-lg bg-zinc-900" alt=""/><div className="min-w-0"><div className="truncate text-sm font-semibold">{avatar.title}</div><div className="text-xs text-zinc-500">{avatar.category}</div></div><Check className="ml-auto text-violet-400" size={18}/></div>}</Step></section>
        <div className="mc-card p-5"><div className="flex justify-between text-sm"><span className="text-zinc-500">Base garment</span><span>{money(garment.price)}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-zinc-500">Custom print</span><span>{money(printSurcharge)}</span></div><div className="my-4 border-t border-white/10"/><div className="flex justify-between"><span className="font-semibold">Total</span><span className="text-lg font-bold">{money(total)}</span></div><button onClick={add} className="mc-btn-primary mt-5 w-full"><ShoppingBag size={17}/> Add custom design to bag</button><button onClick={reset} className="mc-btn-ghost mt-2 w-full"><RotateCcw size={15}/> Reset</button></div>
      </div>
    </div>
  </div>;
}
function Step({n,title,children}){return <><div className="mb-4 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-white/5 text-[10px] font-bold text-violet-300">{n}</span><h2 className="font-semibold">{title}</h2></div>{children}</>}
