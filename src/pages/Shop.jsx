import { useEffect, useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { products as mockProducts } from "../data/mock";
import { api } from "../lib/api";

export default function Shop() {
  const [productList, setProductList] = useState(mockProducts);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [customOnly, setCustomOnly] = useState(false);
  const [mobileFilters, setMobileFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.getProducts().then(data => {
      if (cancelled || !Array.isArray(data) || data.length === 0) return;
      const normalized = data.map(p => ({
        ...p,
        tags: p.tags || [p.garmentType?.replaceAll("_", " ") || "STREETWEAR"],
        variants: (p.variants || []).map(v => ({
          ...v,
          image: v.image || v.mockupFrontUrl || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800"
        }))
      }));
      setProductList(normalized);
    }).catch(() => {
      // keep mockProducts on error/offline
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => productList.filter(p =>
    (type === "ALL" || p.garmentType === type) &&
    (!customOnly || p.customizable) &&
    `${p.name} ${p.description || ""}`.toLowerCase().includes(search.toLowerCase())
  ), [productList, search, type, customOnly]);

  const filter = <div className="space-y-7">
    <div><label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-zinc-500">Category</label><div className="space-y-1">
      {["ALL","ROUND_NECK","OVERSIZED","HOODIE","ACID_WASH","SPORTS"].map(v => <button key={v} onClick={()=>setType(v)} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${type===v ? "bg-violet-500/10 text-violet-300" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}>{v === "ALL" ? "All products" : v.replaceAll("_"," ")}</button>)}
    </div></div>
    <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-300"><input type="checkbox" checked={customOnly} onChange={e=>setCustomOnly(e.target.checked)} className="h-4 w-4 accent-violet-600"/> Customizable only</label>
  </div>;

  return <div className="mc-container py-10 sm:py-14">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-violet-400">Shop</p><h1 className="text-4xl font-black tracking-tight sm:text-5xl">The Collection</h1><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Ready-made MetaCloth apparel and studio-ready garments.</p></div><button onClick={()=>setMobileFilters(true)} className="mc-btn-secondary sm:hidden"><SlidersHorizontal size={17}/> Filters</button></div>
    <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="hidden lg:block">{filter}</aside>
      <div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} className="mc-input pl-10" placeholder="Search collection..."/></div><div className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-sm text-zinc-500">{filtered.length} items</div></div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">{filtered.map(p=><ProductCard key={p.id} product={p}/>)}</div>
        {filtered.length===0 && <div className="py-20 text-center text-zinc-500">No products match your filters.</div>}
      </div>
    </div>
    {mobileFilters && <div className="fixed inset-0 z-[80] bg-black/70 p-4 lg:hidden"><div className="ml-auto h-full max-w-sm overflow-y-auto rounded-2xl border border-white/10 bg-[#18181B] p-5"><div className="mb-8 flex items-center justify-between"><h2 className="font-semibold">Filters</h2><button onClick={()=>setMobileFilters(false)} className="mc-btn-ghost"><X/></button></div>{filter}<button onClick={()=>setMobileFilters(false)} className="mc-btn-primary mt-8 w-full">Apply filters</button></div></div>}
  </div>;
}