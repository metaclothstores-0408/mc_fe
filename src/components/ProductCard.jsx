import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { money } from "../lib/storage";

export default function ProductCard({ product }) {
  const variant = product.variants?.[0] || {};
  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121215]">
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          {product.tags?.map(tag => (
            <span key={tag} className="rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-white backdrop-blur border border-white/10">
              {tag}
            </span>
          ))}
        </div>
        <img 
          src={variant.image} 
          alt={product.name} 
          className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.035]" 
        />
        <div className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white text-black opacity-0 transition duration-300 group-hover:opacity-100 shadow-xl">
          <ArrowUpRight size={16} />
        </div>
      </div>
      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{product.name}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{product.garmentType?.replaceAll("_", " ")}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-semibold text-sm font-mono text-white">{money(product.basePrice)}</div>
          {product.customizable && (
            <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-zinc-400 font-mono">
              <Sparkles size={10} /> Atelier
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}