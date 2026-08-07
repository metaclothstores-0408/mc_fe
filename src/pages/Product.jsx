import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Sparkles, ShoppingBag, Star } from "lucide-react";
import { products, sizes } from "../data/mock";
import { money } from "../lib/storage";

export default function Product({ addToCart, notify }) {
  const { id } = useParams();
  const product = products.find(p=>p.id===Number(id));
  const navigate = useNavigate();
  const [size,setSize]=useState("M");
  const [variantId,setVariantId]=useState(product?.variants[0]?.id);
  const [qty,setQty]=useState(1);

  const [reviews, setReviews] = useState([]);
const [reviewRating, setReviewRating] = useState(0);
const [reviewComment, setReviewComment] = useState("");
const [reviewLoading, setReviewLoading] = useState(false);
const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const variant=useMemo(()=>product?.variants.find(v=>v.id===variantId)||product?.variants[0],[product,variantId]);

  


useEffect(() => {
  if (!product) return;

  const loadReviews = async () => {
    try {
      setReviewLoading(true);

      const response = await fetch(
        `http://localhost:8080/api/v1/products/${product.id}/reviews`
      );

      if (!response.ok) {
        throw new Error("Failed to load reviews");
      }

      const data = await response.json();

      setReviews(data);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setReviewLoading(false);
    }
  };

  loadReviews();
}, [product]);

const averageRating = reviews.length === 0 ? 0 : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

const submitReview = async () => { if (reviewRating === 0) { notify("Please select a rating"); return; } if (!reviewComment.trim()) { notify("Please write a review"); return; } try { setReviewSubmitting(true); const token = localStorage.getItem("accessToken"); const response = await fetch( `http://localhost:8080/api/v1/products/${product.id}/reviews`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, }, body: JSON.stringify({ rating: reviewRating, comment: reviewComment.trim(), }), } ); if (response.status === 401 || response.status === 403) { notify("Please login to submit a review"); return; } if (!response.ok) { throw new Error("Failed to submit review"); } const newReview = await response.json(); setReviews(prev => [newReview, ...prev]); setReviewRating(0); setReviewComment(""); notify("Review submitted successfully"); } catch (error) { console.error("Review submission failed:", error); notify("Unable to submit review"); } finally { setReviewSubmitting(false); } };

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
    {/* ================================= */} {/* PRODUCT REVIEWS */} {/* ================================= */} 
    <section className="mt-20 border-t border-white/10 pt-12"> 
    <div className="grid gap-10 lg:grid-cols-3"> {/* REVIEW SUMMARY */} <div> <h2 className="text-3xl font-black"> Customer Reviews </h2> <div className="mt-6 flex items-center gap-4"> <span className="text-5xl font-black"> {averageRating.toFixed(1)} </span> <div> <div className="flex gap-1"> {[1, 2, 3, 4, 5].map(star => ( <Star key={star} size={20} className={ star <= Math.round(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-zinc-600" } /> ))} </div> <p className="mt-1 text-sm text-zinc-500"> Based on {reviews.length} reviews </p> </div> </div> </div> {/* WRITE REVIEW */} <div className="lg:col-span-2"> <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6"> <h3 className="text-lg font-bold"> Write a review </h3> {/* STAR SELECTOR */} <div className="mt-5"> <p className="mb-2 text-sm text-zinc-400"> Your rating </p> <div className="flex gap-2"> {[1, 2, 3, 4, 5].map(star => ( <button key={star} type="button" onClick={() => setReviewRating(star)} > <Star size={28} className={ star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-zinc-600 hover:text-yellow-400" } /> </button> ))} </div> </div> {/* COMMENT */} <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Share your experience with this product..." maxLength={1000} rows={5} className="mt-5 w-full rounded-xl border border-white/10 bg-black/20 p-4 text-sm outline-none focus:border-violet-500" /> <div className="mt-3 flex items-center justify-between"> <span className="text-xs text-zinc-600"> {reviewComment.length}/1000 </span> <button onClick={submitReview} disabled={reviewSubmitting} className="mc-btn-primary" > {reviewSubmitting ? "Submitting..." : "Submit Review"} </button> </div> </div> </div> </div> {/* REVIEW LIST */} <div className="mt-12"> {reviewLoading ? ( <p className="text-sm text-zinc-500"> Loading reviews... </p> ) : reviews.length === 0 ? ( <div className="rounded-2xl border border-white/10 p-8 text-center"> <p className="text-zinc-400"> No reviews yet. </p> <p className="mt-2 text-sm text-zinc-600"> Be the first person to review this product. </p> </div> ) : ( <div className="space-y-5"> {reviews.map(review => ( <div key={review.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6" > <div className="flex items-start justify-between"> <div> <p className="font-semibold"> {review.userName} </p> <div className="mt-2 flex gap-1"> {[1, 2, 3, 4, 5].map(star => ( <Star key={star} size={15} className={ star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-zinc-700" } /> ))} </div> </div> <span className="text-xs text-zinc-600"> {new Date(review.createdAt).toLocaleDateString()} </span> </div> <p className="mt-4 text-sm leading-7 text-zinc-400"> {review.comment} </p> </div> ))} </div> )} </div> </section>
  </div>;
}