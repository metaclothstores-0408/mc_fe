import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Sparkles, ShoppingBag } from "lucide-react";
import { products, sizes } from "../data/mock";
import { money } from "../lib/storage";

export default function Product({ addToCart, notify }) {
  const { id } = useParams();
  const product = products.find(p=>p.id===Number(id));
  const navigate = useNavigate();
  const [size,setSize]=useState("M");
  const [variantId,setVariantId]=useState(product?.variants[0]?.id);
  const [qty,setQty]=useState(1);
  const variant=useMemo(()=>product?.variants.find(v=>v.id===variantId)||product?.variants[0],[product,variantId]);

  if(!product) return <div className="mc-container py-20"><h1 className="text-2xl font-bold">Product not found.</h1><Link className="mt-5 inline-block text-violet-400" to="/shop">Back to shop</Link></div>;

  const add=()=>{ addToCart({id:`product-${product.id}-${variant.id}-${size}`, productId:product.id, name:product.name, price:product.basePrice, quantity:qty, size, variantId:variant.id, color:variant.colorName, image:variant.image}); notify("Added to bag"); };
  return <div className="mc-container py-8 sm:py-12">
    <Link to="/shop" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white"><ArrowLeft size={16}/> Back to collection</Link>
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#18181B]"><img src={variant.image} alt={product.name} className="aspect-[4/5] w-full object-cover"/></div>
      <div className="lg:py-5">
        <div className="flex flex-wrap gap-2">{product.tags.map(t=><span key={t} className="rounded-full bg-violet-500/10 px-3 py-1 text-xs text-violet-300">{t}</span>)}</div>
        <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{product.name}</h1>
        <div className="mt-4 text-xl font-semibold">{money(product.basePrice)}</div>
        <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-400">{product.description}</p>
        {product.customizable && <Link to="/studio" className="mt-6 flex items-center gap-3 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4"><Sparkles className="text-violet-400"/><div><b className="block text-sm">Customize this garment</b><span className="text-xs text-zinc-500">Open MC Studio and select your avatar.</span></div></Link>}
        <div className="mt-8 space-y-6">
          <div><label className="mb-3 block text-sm font-semibold">Color</label><div className="flex flex-wrap gap-2">{product.variants.map(v=><button key={v.id} onClick={()=>setVariantId(v.id)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${variant.id===v.id?"border-violet-500 bg-violet-500/10":"border-white/10"}`}><span className="h-5 w-5 rounded-full border border-white/20" style={{background:v.colorHex}}/>{v.colorName}</button>)}</div></div>
          <div><label className="mb-3 block text-sm font-semibold">Size</label><div className="grid grid-cols-5 gap-2">{sizes.map(s=><button key={s} onClick={()=>setSize(s)} className={`rounded-xl border py-3 text-sm font-semibold ${size===s?"border-violet-500 bg-violet-500/10":"border-white/10 bg-white/[.02]"}`}>{s}</button>)}</div></div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 p-2"><div className="flex items-center gap-1"><button onClick={()=>setQty(Math.max(1,qty-1))} className="mc-btn-ghost"><Minus size={16}/></button><span className="w-8 text-center text-sm">{qty}</span><button onClick={()=>setQty(qty+1)} className="mc-btn-ghost"><Plus size={16}/></button></div><button onClick={add} className="mc-btn-primary min-w-44"><ShoppingBag size={17}/> Add to bag</button></div>
        </div>
      </div>
    </div>
  </div>;
}