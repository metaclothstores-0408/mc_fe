import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { money } from "../lib/storage";

export default function ProductCard({ product }) {
  const variant = product.variants[0];
  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#18181B]">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          {product.tags.map(tag => <span key={tag} className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur">{tag}</span>)}
        </div>
        <img src={variant.image} alt={product.name} className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.035]" />
        <div className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white text-black opacity-0 transition group-hover:opacity-100">
          <ArrowUpRight size={17}/>
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white">{product.name}</h3>
          <p className="mt-1 text-xs text-zinc-500">{product.garmentType.replaceAll("_", " ")}</p>
        </div>
        <div className="text-right">
          <div className="font-semibold">{money(product.basePrice)}</div>
          {product.customizable && <div className="mt-1 flex items-center gap-1 text-[10px] text-violet-400"><Sparkles size={11}/> Custom</div>}
        </div>
      </div>
    </Link>
  );
}